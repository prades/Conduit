// NOTHING WALKS INTO THE WALL.
//
// REPORTED, with a screenshot of a dozen followers piled into the back wall:
// "followers are going off into the walls on the right side." The back wall is
// up-and-right on screen, which is where the squad in that picture was.
//
// generateSegment builds rows -2..5: wall_back at -2, wall_front at 5, FLOOR
// in between. So the walkable strip is y -1..4 and nothing on any team should
// ever stand outside it.
//
// TWO things let the squad out, and it took both to make it look like that:
//
//   1. The per-actor clamp picked its own lower bound. Normally -0.5, which is
//      half a tile SHORT of the y=-1 row the nests and wall panels sit on — so
//      a follower sent to a nest could never arrive. The fix for that had been
//      to relax the bound to -1.5 whenever the job in hand pointed at a row
//      below zero, and -1.5 is half a tile INSIDE the wall.
//
//   2. The follower separation pass, which jostles overlapping followers
//      apart, runs AFTER that clamp and had no bounds of its own at all. One
//      follower pressed against the limit stayed put; a crowd pushed itself
//      straight through it. That is why the report is a pile and not a stray.
//
// Measured before the fix: twelve followers ordered onto a nest ended at
// y = -1.55, standing on wall_back tiles. These checks drive the real game
// loop, because the bug lived in the interaction between two passes and
// neither one alone is wrong enough to see.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox, configNums } = require('./domstub.js');

const SRC = {
    npc:    fs.readFileSync(path.join(ROOT, 'js/npc.js'),     'utf8'),
    game:   fs.readFileSync(path.join(ROOT, 'js/game.js'),    'utf8'),
    world:  fs.readFileSync(path.join(ROOT, 'js/world.js'),   'utf8'),
    helpers:fs.readFileSync(path.join(ROOT, 'js/helpers.js'), 'utf8'),
    config: fs.readFileSync(path.join(ROOT, 'js/config.js'),  'utf8'),
};

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

const C = configNums(['FLOOR_Y_MIN', 'FLOOR_Y_MAX', 'PLAYER_Y_MIN']);

async function boot() {
    const sandbox = makeBrowserSandbox({ tubecrawler_seed: '305419896' });
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true;');
    return { run, sandbox };
}

// Put `n` followers on the board and order them all onto the same tile, then
// run the real loop. Reports the worst place anything ended up.
//
// Ordering them all at ONE tile is the point: it is what the separation pass
// has to resolve, and resolving it is what pushed them out of the world.
function marchAt(E, n, targetExpr, frames) {
    return E.run(`(function(){
        actors.length = 0; followers.length = 0;
        ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
        const target = ${targetExpr};
        if (!target) return { noTarget: true };
        for (let i = 0; i < ${n}; i++) {
            const f = { x: target.x - 1 + (i % 3), y: 2, type: 'virus', team: 'green',
                        isFollower: true, dead: false, element: 'core', role: 'brawler',
                        health: 40, maxHealth: 40, moveSpeed: 0.04, walkCycle: 0,
                        currentWill: 5, stance: 'free',
                        stats: { will: 5, combat: 5, defense: 5, health: 40 } };
            actors.push(f); followers.push(f);
        }
        followers.forEach(f => { f.job = { type: 'move', target }; f.stance = 'hold'; });
        let lowest = Infinity, highest = -Infinity, offFloor = 0, worst = null;
        for (let i = 0; i < ${frames}; i++) {
            render();
            for (const f of followers) {
                if (f.dead) continue;
                if (f.y < lowest)  { lowest = f.y; }
                if (f.y > highest) { highest = f.y; }
                const t = getTile(Math.round(f.x), Math.round(f.y));
                if (!t || t.type !== 'floor') {
                    offFloor++;
                    if (!worst) worst = { x: +f.x.toFixed(2), y: +f.y.toFixed(2),
                                          on: t ? t.type : 'nothing at all' };
                }
            }
        }
        return { target: { x: target.x, y: target.y },
                 lowest: +lowest.toFixed(3), highest: +highest.toFixed(3),
                 offFloor, worst, alive: followers.filter(f => !f.dead).length };
    })()`);
}

(async () => {
    const E = await boot();

    group('the strip the game actually builds');

    check('fixture: the floor is rows -1..4, with a wall on each side', () => {
        const r = E.run(`(function(){
            const rows = {};
            for (const t of world) (rows[t.type] = rows[t.type] || new Set()).add(t.y);
            const out = {};
            for (const k of Object.keys(rows)) out[k] = [...rows[k]].sort((a,b)=>a-b);
            return out;
        })()`);
        same(r.floor.join(','), '-1,0,1,2,3,4', 'the floor rows are not what the bounds assume');
        same(r.wall_back.join(','), '-2', 'the back wall moved');
        same(r.wall_front.join(','), '5', 'the front wall moved');
        // And the named bounds have to match the world, not a memory of it.
        same(C.FLOOR_Y_MIN, Math.min(...r.floor), 'FLOOR_Y_MIN disagrees with the generated floor');
        same(C.FLOOR_Y_MAX, Math.max(...r.floor), 'FLOOR_Y_MAX disagrees with the generated floor');
    });

    group('THE REPORTED CASE: a squad sent to the back row');

    check('THE ASK: twelve followers ordered onto a nest stay on the floor', () => {
        const r = marchAt(E, 12, `world.find(t => t.nest && t.nestZone === 1)`, 1500);
        ok(!r.noTarget, 'fixture: zone 1 has no nest to march at');
        same(r.target.y, C.FLOOR_Y_MIN, 'fixture: a nest should sit on the back floor row');
        same(r.offFloor, 0, 'a follower stood on ' + JSON.stringify(r.worst));
        ok(r.lowest >= C.FLOOR_Y_MIN,
           `the squad reached y=${r.lowest}, past the floor edge at ${C.FLOOR_Y_MIN}`);
    });

    check('and they do REACH it — the fix is not just a tighter leash', () => {
        // Clamping to -0.5 would also pass the check above while leaving a
        // follower permanently half a tile short of the nest it was sent to.
        const r = marchAt(E, 12, `world.find(t => t.nest && t.nestZone === 1)`, 1500);
        same(r.lowest, C.FLOOR_Y_MIN, `the squad never got closer than y=${r.lowest}`);
    });

    check('THE CROWD is what did it — thirty do not push each other through', () => {
        // One follower against the limit stayed put even before the fix. It
        // took the separation pass, which runs after the clamp, to shove a
        // packed squad past it.
        const r = marchAt(E, 30, `world.find(t => t.nest && t.nestZone === 1)`, 2500);
        // Most of them, not all of them. 2500 frames beside a live nest is long
        // enough for a predator to kill one, and demanding thirty survivors
        // made this fail about one run in three on a bug it was not testing.
        // What has to hold is that nobody left the floor.
        ok(r.alive >= 20, `only ${r.alive} of thirty survived — too few to crowd anything`);
        same(r.offFloor, 0, 'a follower stood on ' + JSON.stringify(r.worst));
        ok(r.lowest >= C.FLOOR_Y_MIN, `thirty followers reached y=${r.lowest}`);
    });

    check('the front wall holds too, with the same crowd', () => {
        const r = marchAt(E, 30, `world.find(t => t.type === 'floor' && t.y === ${C.FLOOR_Y_MAX}
                                                  && getZoneIndex(Math.floor(t.x)) === 1)`, 2000);
        ok(!r.noTarget, 'fixture: no front-row tile in zone 1');
        same(r.offFloor, 0, 'a follower stood on ' + JSON.stringify(r.worst));
        ok(r.highest <= C.FLOOR_Y_MAX, `the squad reached y=${r.highest}, past ${C.FLOOR_Y_MAX}`);
    });

    group('NOTHING GOES NaN: standing on a target is not a way to vanish');

    // FOUND by an optimisation profile, not by a report: a brawler's orbit and a
    // sniper's back-off divide by the distance to their target, and that
    // distance is exactly 0 when the follower is standing on it. -dy/0 is NaN,
    // a NaN position is permanent, and every effect that unit then spawns carries
    // it into createRadialGradient, which THROWS on a non-finite value and takes
    // the whole frame with it.
    //
    // The write is trapped rather than the result read, so the ROOT is proved
    // fixed independently of the net that would otherwise mask it.
    const stack = (role, el) => E.run(`(function(){
        actors.length = 0; followers.length = 0;
        ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
        spawnFollowerAtCrystal(${JSON.stringify(el)});
        const f = followers[followers.length - 1];
        f.role = ${JSON.stringify(role)}; f.x = 12; f.y = 2; f.visualX = 12; f.visualY = 2;
        f.stance = 'follow'; f.job = null; f.duty = 'fighter';
        const S = SPECIES['ant'];
        const foe = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 12, 2);
        foe.team = 'red'; foe.speciesName = 'ant'; foe.className = 'scout';
        foe.health = 99999; foe.maxHealth = 99999; actors.push(foe);
        let bad = null;
        ['x', 'y'].forEach(k => { let v = f[k];
            Object.defineProperty(f, k, { configurable: true, enumerable: true, get() { return v; },
                set(n) { if (bad === null && !Number.isFinite(n)) bad = k + '=' + n; v = n; } }); });
        for (let i = 0; i < 120; i++) { try { render(); } catch (e) { bad = bad || 'threw: ' + e.message; } }
        return { wrote: bad, x: f.x, y: f.y };
    })()`);

    check('THE ASK: a brawler standing ON its target never writes a NaN', () => {
        const r = stack('brawler', 'core');
        same(r.wrote, null, 'a brawler on its target wrote ' + r.wrote);
        ok(Number.isFinite(r.x) && Number.isFinite(r.y), 'and it ended at a non-finite position');
    });

    check('a sniper standing ON its target never writes a NaN', () => {
        const r = stack('sniper', 'electric');
        same(r.wrote, null, 'a sniper on its target wrote ' + r.wrote);
        ok(Number.isFinite(r.x) && Number.isFinite(r.y), 'and it ended at a non-finite position');
    });

    check('and the frame survives it — nothing throws in the draw', () => {
        // The NaN's real cost was not the unit, it was the frame: a non-finite
        // value reaching createRadialGradient throws out of render().
        for (const [role, el] of [['brawler', 'toxic'], ['sniper', 'toxic']]) {
            const r = stack(role, el);
            ok(!/threw/.test(String(r.wrote)), role + ' on its target broke the frame: ' + r.wrote);
        }
    });

    check('THE NET: a follower that does go non-finite is put back, not kept', () => {
        // Per-branch guards are exactly how this got through. Any NEW movement
        // that forgets one must not leave a permanent NaN behind.
        const r = E.run(`(function(){
            actors.length = 0; followers.length = 0;
            spawnFollowerAtCrystal('core');
            const f = followers[followers.length - 1];
            f.x = 9; f.y = 2; f.visualX = 9; f.visualY = 2; f.stance = 'follow';
            // Poison it the way a bad division would, mid-update.
            const real = updateRTSNPC;
            updateRTSNPC = function (a) { real.apply(this, arguments); if (a === f) { a.x = NaN; a.y = NaN; } };
            try { updateNPC(f); } finally { updateRTSNPC = real; }
            return { x: f.x, y: f.y };
        })()`);
        ok(Number.isFinite(r.x) && Number.isFinite(r.y),
           'a NaN position survived updateNPC: ' + r.x + ', ' + r.y);
        same(r.x, 9, 'it was not put back where it was');
    });

    check('both guards are real code, not comments', () => {
        const NPC = fs.readFileSync(path.join(ROOT, 'js/npc.js'), 'utf8');
        const code = NPC.split('\n').map(l => l.replace(/\/\/.*$/, '')).join('\n');
        ok(/NPC_MIN_DIST/.test(code), 'the distance floor is gone');
        ok((code.match(/Math\.max\(NPC_MIN_DIST/g) || []).length >= 2,
           'both the orbit and the back-off should use the floor');
        ok(/Number\.isFinite\(actor\.x\)/.test(code), 'the non-finite net is gone');
    });

    group('one rule, in one place');

    check('the bounds are named, not written out again', () => {
        // Four places used to carry their own copy and they did not agree.
        ok(/function clampToFloor/.test(SRC.helpers), 'there is no shared floor clamp');
        ok(/clampToFloor\(/.test(SRC.npc), 'the per-actor update does not use it');
        ok(/clampToFloor\(/.test(SRC.game), 'the separation pass does not use it');
        ok(!/Math\.max\(-1\.5/.test(SRC.npc), 'the -1.5 relaxation is still there');
        ok(!/Math\.max\(-0\.5, Math\.min\(4/.test(SRC.npc), 'the old bare bounds survive in npc.js');
        ok(!/_jobTargetY/.test(SRC.npc),
           'the clamp still changes its mind based on the job in hand');
    });

    check('the jostle is bounded where it happens, not hopefully beforehand', () => {
        // The ordering is the whole bug: a clamp that runs before the push does
        // not bound the push.
        const sepAt   = SRC.game.indexOf('FOLLOWER SEPARATION');
        ok(sepAt > -1, 'the separation pass could not be located');
        const body = SRC.game.slice(sepAt, SRC.game.indexOf('ICE BLOCKS', sepAt));
        ok(/clampToFloor\(_a\); clampToFloor\(_b\);/.test(body),
           'the separation pass still pushes followers without bounding them');
        ok(body.indexOf('_b.y += _dy*_p') < body.indexOf('clampToFloor'),
           'the clamp runs before the push it is meant to bound');
    });

    check('the player keeps its own bound, and says why', () => {
        // Deliberately NOT the floor minimum: at y=-1 the player stands level
        // with the nest's own wall face, which draws over them.
        ok(C.PLAYER_Y_MIN > C.FLOOR_Y_MIN,
           'the player bound is no longer distinct from the floor');
        ok(/PLAYER_Y_MIN/.test(SRC.game), 'game.js does not use the named player bound');
        ok(!/Math\.max\(-0\.5, Math\.min\(4, player\.y\)\)/.test(SRC.game),
           'the player clamp is still a pair of bare numbers');
        const at = SRC.config.indexOf('const PLAYER_Y_MIN');
        const why = SRC.config.slice(Math.max(0, at - 500), at);
        ok(/wall face|draws over/.test(why),
           'nothing explains why the player stops short of the floor edge');
    });

    check('nothing else quietly carries its own floor bounds', () => {
        // The repel cloud and the ice shove clamp to 0..3, which is INSIDE the
        // floor rather than outside it, so they cannot put anything in a wall.
        // That is the property worth holding, not the exact numbers.
        const MASS = fs.readFileSync(path.join(ROOT, 'js/mass.js'), 'utf8');
        const PRED = fs.readFileSync(path.join(ROOT, 'js/predator.js'), 'utf8');
        for (const [name, src] of [['mass.js', MASS], ['predator.js', PRED]]) {
            for (const m of src.matchAll(/Math\.max\((-?[\d.]+), Math\.min\((-?[\d.]+),[^)]*\.y/g)) {
                const lo = Number(m[1]), hi = Number(m[2]);
                ok(lo >= C.FLOOR_Y_MIN,
                   `${name} clamps down to ${lo}, which is inside the back wall`);
                ok(hi <= C.FLOOR_Y_MAX,
                   `${name} clamps up to ${hi}, which is inside the front wall`);
            }
        }
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
