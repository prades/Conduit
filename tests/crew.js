// THE TWO NEW WORKER JOBS, and the recruit protection that came with them.
//
// Reported together:
//
//   "the predators are using their little abilities and they're attacking the
//    recruits before they have a chance to have an element at the crystal.
//    let's give the toxic workers the ability to work, and what they do is
//    they repel the enemy, and the ice workers can turn into ice blocks ...
//    they push the other enemies and allies out of that perimeter and create a
//    solid ice block ... unfrozen with a long hold ... just one block wide."
//
// The recruit part was measured before it was fixed, and the measurement moved
// where the fix went. Every predator special was driven through its active
// phase with a recruit standing in the blast and a follower beside it: all
// seven offensive abilities landed in full on the follower and did not scratch
// the recruit. The targeting was already right. What was killing recruits were
// the two paths that never picked a target at all —
//
//   - the red health-decay pass, which bleeds anything on team red, and a
//     recruit is on team red until it reaches the Crystal
//   - the cocoon toxin, which named isNeutralRecruit outright
//
// so the guard went to the damage chokepoint rather than to the abilities.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { scriptOrder, makeBrowserSandbox } = require('./domstub.js');

const MASS    = fs.readFileSync(path.join(ROOT, 'js/mass.js'),    'utf8');
const HELPERS = fs.readFileSync(path.join(ROOT, 'js/helpers.js'), 'utf8');
const GAME    = fs.readFileSync(path.join(ROOT, 'js/game.js'),    'utf8');
const DRAW    = fs.readFileSync(path.join(ROOT, 'js/draw.js'),    'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function near(a, b, tol, m) {
    if (Math.abs(a - b) > tol) throw new Error(`${m}: expected ~${b} (±${tol}), got ${a}`);
}

// Read the tuning out of the source rather than restating it, so a change to
// the numbers moves these checks with it.
function constant(src, name) {
    const m = src.match(new RegExp(`const\\s+${name}\\s*=\\s*([\\d.]+)`));
    if (!m) throw new Error(`no longer defines ${name}`);
    return Number(m[1]);
}
const MEND_RATE      = constant(MASS, 'MEND_RATE');
const MEND_ESCORT    = constant(MASS, 'MEND_ESCORT');
const ICE_BLOCK_R    = constant(MASS, 'ICE_BLOCK_R');
const ICE_BLOCK_PUSH = constant(MASS, 'ICE_BLOCK_PUSH');
const ICE_FORM       = constant(MASS, 'ICE_FORM_FRAMES');
const SEEK           = constant(MASS, 'MASS_SEEK_RANGE');

// ── environment ───────────────────────────────────────────
// Deliberately minimal, and deliberately supplies NO worker state: the point
// is that mass.js declares what it needs. Predator is a real class here because
// isHostileTarget and puddleAffects both branch on `instanceof Predator`.
function makeEnv() {
    const sandbox = {
        console, Math, Object, Array, String, Number, Set, Map, JSON,
        isFinite, isNaN, parseInt,
        world: [], worldTileMap: new Map(), actors: [], followers: [],
        elementEffects: [], floatingTexts: [], chargedMass: [],
        frame: 0, shake: 0, shardCount: 0, TILE_W: 60, TILE_H: 30,
        ZONE_LENGTH: 15, alertActive: false, armySurgeTimer: 0,
        ARMY_SURGE_POWER: 1.6, health: 100,
        gameState: { nightNumber: 1, phase: 'day' },
        crystal: { x: -99, y: 2 },
        canvas: { width: 800, height: 600 },
        player: { x: -99, y: 2, targetX: -99, targetY: 2, visualX: -99, visualY: 2, invuln: 0 },
        getFollowerAttackMult: () => 1,
        getFollowerDefMult: () => 1,
        saveShards() {}, saveNests() {},
    };
    sandbox.getTile = (gx, gy) => sandbox.worldTileMap.get(`${gx},${gy}`);
    sandbox.Predator = function Predator() {};
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    for (const f of ['js/helpers.js', 'js/mass.js']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
    }
    return { sandbox, run: e => vm.runInContext(e, ctx) };
}

function follower(env, element, x, y, duty) {
    const f = { element, x, y, visualX: x, visualY: y, dead: false, isFollower: true,
                team: 'green', duty: duty === undefined ? 'worker' : duty,
                moveSpeed: 0.05, walkCycle: 0, job: null, stance: 'follow',
                dirX: 1, dirY: 0, health: 40, maxHealth: 40 };
    env.sandbox.followers.push(f); env.sandbox.actors.push(f);
    return f;
}
function enemy(env, x, y) {
    const e = { x, y, dead: false, team: 'red', health: 100, maxHealth: 100,
                moveSpeed: 0.03, dirX: -1, dirY: 0 };
    env.sandbox.actors.push(e);
    return e;
}
function recruit(env, x, y) {
    const r = { x, y, dead: false, team: 'red', isNeutralRecruit: true,
                health: 60, maxHealth: 60, moveSpeed: 0.03 };
    env.sandbox.actors.push(r);
    return r;
}
// Run the work tick the way updateRTSNPC does, plus the per-frame block pass
// the update loop runs.
function work(env, crew, n) {
    const list = Array.isArray(crew) ? crew : [crew];
    for (let i = 0; i < n; i++) {
        env.sandbox.frame++;
        for (const f of list) env.run('followerWorkTick')(f);
        env.run('iceBlockTick()');
    }
}
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);

// ─────────────────────────────────────────────────────────
group('both new elements are on the crew');

check('TOXIC and ICE can be put on the work crew', () => {
    const env = makeEnv();
    for (const el of ['toxic', 'ice']) {
        const f = follower(env, el, 0, 2, 'fighter');
        same(env.run('setFollowerDuty')(f, 'worker'), true, el + ' should be accepted');
        same(f.duty, 'worker', el + ' should be on the crew');
    }
});

check('each has its own job, distinct from the other four', () => {
    const env = makeEnv();
    same(env.run('workerJobLabel')('toxic'), 'TEND CLONE', 'toxic');
    same(env.run('workerJobLabel')('ice'), 'SET BLOCK', 'ice');
    const els = env.run('workerElements()');
    const jobs = els.map(e => env.run('workerJobLabel')(e));
    same(new Set(jobs).size, els.length, 'two elements share a job: ' + jobs.join(','));
});

check('the refusal message names them', () => {
    // It was frozen at "ELECTRIC, FLUX AND CORE" once before.
    const env = makeEnv();
    const label = env.run('workerElementsLabel()');
    ok(/TOXIC/.test(label), label + ' does not mention toxic');
    ok(/ICE/.test(label), label + ' does not mention ice');
});

// ─────────────────────────────────────────────────────────
group('TOXIC: it tends the clones');

// REPORTED: "change the toxic workers' effect to repairing clones — basically
// siding by them and healing them constantly."
//
// It used to be a repel cloud that shoved enemies around for no damage. A clone
// costs shards AND a DNA splice and carries 3x the health of what it was cloned
// from, so there is both a reason to keep one alive and a lot of bar to top up.

function clone(env, x, y, health) {
    const c = { x, y, dead: false, isClone: true, team: 'green',
                health: health === undefined ? 60 : health, maxHealth: 120,
                moveSpeed: 0.03, dirX: 1, dirY: 0 };
    env.sandbox.actors.push(c);
    return c;
}

check('THE JOB: a hurt clone beside it is mended', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const c = clone(env, 10.4, 2, 60);
    work(env, w, 60);
    ok(c.health > 60, `the clone was not mended: still ${c.health}`);
});

check('THE ASK: it heals CONSTANTLY, not once', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const c = clone(env, 10.4, 2, 20);
    work(env, w, 30);  const early = c.health;
    work(env, w, 30);  const later = c.health;
    ok(early > 20, 'nothing happened in the first half-second');
    ok(later > early, `it stopped after one pulse: ${early} then ${later}`);
});

check('and at the documented rate', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const c = clone(env, 10.2, 2, 10);
    work(env, w, 60);
    // 60 frames at MEND_RATE a frame, give or take the frames spent closing.
    ok(Math.abs((c.health - 10) - MEND_RATE * 60) < MEND_RATE * 12,
       `60 frames put in ${(c.health - 10).toFixed(2)}, expected about ${(MEND_RATE * 60).toFixed(2)}`);
});

check('THE ASK: it sides by the clone — it follows it around', () => {
    // "Basically siding by them." A medic that walks to where the clone WAS
    // spends the fight out of range of the thing it is assigned to.
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const c = clone(env, 10.3, 2, 60);
    work(env, w, 30);
    const near = dist(w, c);
    // The clone walks off.
    c.x = 18;
    work(env, w, 200);
    ok(dist(w, c) <= Math.max(near, MEND_ESCORT) + 0.4,
       `it did not follow: ended ${dist(w, c).toFixed(2)} away`);
});

check('it never overheals past the clone\'s maximum', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const c = clone(env, 10.2, 2, 118);
    work(env, w, 300);
    same(c.health, c.maxHealth, `it healed to ${c.health}, past the cap of ${c.maxHealth}`);
});

check('a HURT clone is chosen over a healthy one that is nearer', () => {
    // Mending is the job. Escorting a full-health clone while another is
    // bleeding two tiles away would be the wrong call.
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const full = clone(env, 10.3, 2, 120);
    const hurt = clone(env, 12, 2, 30);
    work(env, w, 90);
    ok(hurt.health > 30, 'it tended the full-health clone instead of the hurt one');
    same(full.health, full.maxHealth, 'fixture: the healthy one should have stayed full');
});

check('with none hurt it still escorts the nearest, ready for when one is', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const c = clone(env, 14, 2, 120);
    same(env.run('followerWorkTick')(w), true, 'it should claim the frame to escort');
    work(env, w, 200);
    ok(dist(w, c) < 2, `it did not take station: ${dist(w, c).toFixed(2)} away`);
});

check('it mends ONLY clones — not followers, not the player, not enemies', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const mate = follower(env, 'core', 10.3, 2, 'fighter');
    mate.health = 10;
    const foe = enemy(env, 10.4, 2);
    foe.health = 10;
    env.sandbox.player.health = 10;
    work(env, w, 120);
    same(mate.health, 10, 'it healed an ordinary follower');
    same(foe.health, 10, 'it healed an enemy');
});

check('it does NO damage, as before', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    clone(env, 10.2, 2, 60);
    const p = enemy(env, 10.3, 2);
    work(env, w, 120);
    same(p.health, p.maxHealth, 'the mender should never hurt anything');
    same(p.dead, false, 'nor kill it');
});

check('a mender with no clone at all hands the frame back', () => {
    // So it falls through to holding station rather than standing still
    // pretending to work.
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    same(env.run('followerWorkTick')(w), false, 'it claimed a frame with nothing to tend');
});

check('a dead clone is dropped rather than tended forever', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const c = clone(env, 10.3, 2, 60);
    work(env, w, 20);
    ok(w.sandbox === undefined || true, 'fixture');
    c.dead = true;
    same(env.run('followerWorkTick')(w), false, 'it kept working on a dead clone');
});

check('THE OLD JOB IS GONE: nothing repels any more', () => {
    for (const name of ['repelStep', '_workRepel', 'REPEL_RADIUS', 'REPEL_PUSH',
                        'MASS_REPELLER', '_repelTarget']) {
        ok(!MASS.includes(name), 'mass.js still carries ' + name);
    }
    const CODEX = fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8');
    ok(!/REPEL_RADIUS/.test(CODEX), 'the codex still reads the repel radius');
});

// ─────────────────────────────────────────────────────────
group('ICE: it sets a solid block');

check('THE JOB: an ice worker freezes where it stands', () => {
    const env = makeEnv();
    const w = follower(env, 'ice', 20.3, 2.2);
    same(env.run('followerWorkTick')(w), true, 'it should claim the frame');
    ok(w.iceBlock, 'it should have frozen');
    // Snapped to the tile, so the block lines up with the floor rather than
    // straddling two tiles.
    same(w.x, 20, 'snapped in x');
    same(w.y, 2, 'snapped in y');
    same(w.iceBlockX, 20, 'and it remembers its tile');
    same(w.iceBlockY, 2, 'and its row');
});

check('ONE BLOCK WIDE, as asked', () => {
    // A tile is 1.0 in world units. The radius clears the tile and no more —
    // the first description was a "four foot radius" and was then corrected to
    // one block, so this is the number that was actually chosen.
    ok(ICE_BLOCK_R > 0.5, `a radius of ${ICE_BLOCK_R} does not cover its own tile`);
    ok(ICE_BLOCK_R < 1.0, `a radius of ${ICE_BLOCK_R} is wider than one block`);
});

check('it does not walk once it is set', () => {
    const env = makeEnv();
    const w = follower(env, 'ice', 20, 2);
    const speed = w.moveSpeed;
    work(env, w, 30);
    same(w.moveSpeed, 0, 'a block must not have a walking speed');
    same(w._preIceSpeed, speed, 'and it has to remember what it had');
});

check('THE PERIMETER: it pushes an enemy out', () => {
    const env = makeEnv();
    const p = enemy(env, 20.05, 2);
    const w = follower(env, 'ice', 20, 2);
    work(env, w, 30);
    near(dist(p, w), ICE_BLOCK_R, 0.02, 'the enemy should be sitting on the perimeter');
});

check('and an ALLY out — allies too, or it is cover and not a wall', () => {
    const env = makeEnv();
    const mate = follower(env, 'fire', 20.05, 2, 'fighter');
    const w = follower(env, 'ice', 20, 2);
    work(env, w, 30);
    near(dist(mate, w), ICE_BLOCK_R, 0.02, 'your own squad should be pushed clear too');
});

check('and the PLAYER out, target and all', () => {
    // The player's position is lerped toward a target every frame, so moving
    // only the position would be undone on the next one and they would walk
    // straight through.
    const env = makeEnv();
    env.sandbox.player.x = 20.05; env.sandbox.player.y = 2;
    env.sandbox.player.targetX = 20.05; env.sandbox.player.targetY = 2;
    const w = follower(env, 'ice', 20, 2);
    work(env, w, 30);
    near(dist(env.sandbox.player, w), ICE_BLOCK_R, 0.02, 'the player should be pushed clear');
    same(env.sandbox.player.targetX, env.sandbox.player.x, 'their target should come with them');
    same(env.sandbox.player.targetY, env.sandbox.player.y, 'in both axes');
});

check('something standing dead centre is cleared in ONE step on formation', () => {
    // Anything still inside a solid block after it forms would be trapped in
    // it, shoved a fraction of a tile per frame while the block pins it.
    const env = makeEnv();
    const p = enemy(env, 20, 2);
    const w = follower(env, 'ice', 20, 2);
    env.run('followerWorkTick')(w);      // the formation frame, and only that
    near(dist(p, w), ICE_BLOCK_R, 0.02, 'formation should clear the tile outright');
    ok(ICE_BLOCK_PUSH < ICE_BLOCK_R,
       'the per-frame push is not smaller than the radius, so this proves nothing');
});

check('it holds its tile when shoved', () => {
    const env = makeEnv();
    const w = follower(env, 'ice', 20, 2);
    work(env, w, 10);
    w.x += 3; w.y = 0;                   // a crowd pushing it, or any other pass
    env.run('iceBlockTick()');
    same(w.x, 20, 'it should be pinned back in x');
    same(w.y, 2, 'and in y');
});

check('two blocks never shove each other', () => {
    const env = makeEnv();
    const a = follower(env, 'ice', 20, 2);
    const b = follower(env, 'ice', 20.4, 2);
    work(env, [a, b], 20);
    ok(a.iceBlock && b.iceBlock, 'both should be set');
    same(a.x, a.iceBlockX, 'the first should be where it froze');
    same(b.x, b.iceBlockX, 'and the second where it froze');
});

check('THE THAW: coming off the crew melts it, and gives the speed back', () => {
    const env = makeEnv();
    const w = follower(env, 'ice', 20, 2);
    const speed = w.moveSpeed;
    work(env, w, 30);
    ok(w.iceBlock, 'fixture: it should be set');
    same(env.run('setFollowerDuty')(w, 'fighter'), true, 'it should come off the crew');
    same(w.iceBlock, false, 'and thaw');
    same(w.moveSpeed, speed, 'with the speed it had before');
    same(w.stance, 'follow', 'and back in the line');
});

check('a thawed block no longer pushes anything', () => {
    const env = makeEnv();
    const w = follower(env, 'ice', 20, 2);
    work(env, w, 20);
    env.run('setFollowerDuty')(w, 'fighter');
    const p = enemy(env, 20.05, 2);
    const at = p.x;
    env.run('iceBlockTick()');
    same(p.x, at, 'a melted block should not still hold a perimeter');
});

check('thawing something that was never frozen is a no-op', () => {
    const env = makeEnv();
    const f = follower(env, 'fire', 1, 2, 'fighter');
    same(env.run('thawIceBlock')(f), false, 'it should report nothing to do');
    same(env.run('thawIceBlock')(null), false, 'and tolerate null');
});

// ─────────────────────────────────────────────────────────
group('the long hold offers the thaw');

check('the radial menu says THAW on a block, not TO LINE', () => {
    // "unfrozen with a click. A long hold." The long hold already finds a
    // follower and offers its duty toggle — a block reuses that rather than
    // adding a second instruction that could disagree with it.
    ok(/f\.iceBlock \? "THAW"/.test(DRAW), 'the follower menu does not offer THAW on a block');
    ok(/"FROZEN BLOCK"/.test(DRAW), 'the menu does not say what it is looking at');
});

check('and that button is the duty toggle, which is what melts it', () => {
    ok(/thawIceBlock\(actor\)/.test(MASS), 'setFollowerDuty no longer thaws');
    // Inside the "coming off the crew" branch, not on every duty change —
    // otherwise assigning the duty would thaw the block it just made.
    const at = MASS.indexOf("if (duty !== 'worker')");
    ok(at > 0, 'the off-the-crew branch could not be found');
    const branch = MASS.slice(at, MASS.indexOf('floatingTexts.push', at));
    ok(/thawIceBlock/.test(branch), 'the thaw is not in the off-the-crew branch');
});

// ─────────────────────────────────────────────────────────
group('the block is terrain, not a unit in the crowd');

check('the follower separation pass skips blocks', () => {
    // Otherwise a follower would shove its way back in for a frame at a time,
    // and two blocks would jostle each other off their tiles.
    ok(/_a\.iceBlock \|\| _b\.iceBlock/.test(GAME),
       'the separation pass still treats a block as an ordinary follower');
});

check('the block pass runs AFTER separation, so it has the last word', () => {
    const sep = GAME.indexOf('FOLLOWER SEPARATION');
    const ice = GAME.indexOf('iceBlockTick()');
    ok(sep > 0 && ice > 0, 'one of the two passes is missing');
    ok(ice > sep, 'iceBlockTick runs before the separation pass and would be undone');
});

check('and it is wired into the update loop at all', () => {
    ok(/\n    iceBlockTick\(\);/.test(GAME), 'iceBlockTick is never called');
});

// ─────────────────────────────────────────────────────────
group('RECRUITS: nothing touches them before the Crystal');

check('THE CHOKEPOINT: applyDamage refuses a neutral recruit outright', () => {
    // The guard is here rather than in the abilities because the abilities were
    // measured and were already clean — what was hurting recruits were the two
    // paths that never chose a target.
    const env = makeEnv();
    const r = recruit(env, 5, 2);
    env.run('applyDamage')(r, 50, null, 'toxic');
    same(r.health, r.maxHealth, 'a hazard should not reach it');
    env.run('applyDamage')(r, 50, { team: 'red' });
    same(r.health, r.maxHealth, 'nor an attacker');
    same(r.dead, false, 'and it should still be alive');
});

check('but an ordinary enemy still takes damage', () => {
    // So this cannot pass because applyDamage stopped working.
    const env = makeEnv();
    const e = enemy(env, 5, 2);
    env.run('applyDamage')(e, 30, null);
    ok(e.health < e.maxHealth, 'an enemy should still be hurt');
});

check('and a recruit that has ARRIVED is an ordinary follower again', () => {
    // The protection is the walk in, not a permanent immunity. npc.js clears
    // isNeutralRecruit at the Crystal, at the same moment it assigns the
    // element — which is exactly the line the report drew.
    const env = makeEnv();
    const r = recruit(env, 5, 2);
    r.isNeutralRecruit = false; r.team = 'green'; r.isFollower = true;
    env.run('applyDamage')(r, 20, { team: 'red' });
    ok(r.health < r.maxHealth, 'a recruited follower should be damageable');
});

check('the red health-decay pass skips them', () => {
    // 0.01 a frame sounds like nothing; over a long walk in it was 36 HP, which
    // is enough to kill a weak recruit on the way to a body it never got to use.
    ok(/a\.team==="red" && !isNeutralBystander\(a\)/.test(GAME),
       'the decay pass still bleeds recruits');
});

// ─────────────────────────────────────────────────────────
group('GROUP DUTY: long press the index, order the whole group');

// REPORTED: "when you long press on the little index at the bottom left of all
// your followers, you can switch them to working or fighting by the selected
// group — campers, brawlers, snipers, or individual element types."
//
// Duty was a per-follower order: long press the unit, pick TO WORK. With a
// dozen followers that is a dozen long presses, and the index already groups
// them the way the player thinks about them.

// ui.js needs more of the page than mass.js does, so this group boots the whole
// thing rather than the two-file sandbox the rest of the suite uses.
function uiEnv() {
    const sandbox = makeBrowserSandbox({ tubecrawler_seed: '305419896' });
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    return { sandbox, run: e => vm.runInContext(e, ctx) };
}

// Build a squad, long-press a row, press a button, report what moved.
// `press` is 'work' | 'line' | null (null just opens the menu).
const squadOrder = (U, tab, which, press) => U.run(`(function(){
    gameState.running = true;
    actors.length = 0; followers.length = 0;
    ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
    floatingTexts.length = 0;
    const roles = ['brawler', 'sniper', 'camper'];
    ['core','core','core','toxic','toxic','flux'].forEach((el, i) => {
        spawnFollowerAtCrystal(el);
        const f = followers[followers.length - 1];
        f.role = roles[i % 3];
        f.x = 5 + i; f.y = 2; f.visualX = f.x; f.visualY = f.y;
    });
    uiTab = ${JSON.stringify(tab)}; followerPoolMinimized = false;
    followerDutyMenu = null;
    // Aimed from the panel's own geometry, not from the picker under test.
    const py0 = canvas.height - 20 - _UI_TAB_H - _UI_CONTENT_H;
    const i = ${typeof which === 'number' ? which
                : `ELEMENTS.findIndex(e => e.id === ${JSON.stringify(which)})`};
    const rh = ${JSON.stringify(tab)} === 'elements' ? _UI_ROW_H : Math.floor(_UI_CONTENT_H / 3);
    const px = _UI_X + 90, pyy = py0 + _UI_TAB_H + i * rh + rh / 2;
    const took = handleLongHold(px, pyy) === undefined && !!followerDutyMenu;
    const opened = followerDutyMenu ? followerDutyMenu.group.label : null;
    let pressed = null;
    if (followerDutyMenu && ${JSON.stringify(press)}) {
        drawFollowerDutyMenu();
        const m = followerDutyMenu, b = m._btn;
        const bx = ${JSON.stringify(press)} === 'work' ? m.x + 6 + b.bw / 2
                                                       : m.x + 12 + b.bw + b.bw / 2;
        pressed = handleFollowerDutyMenuTap(bx, b.by + 10);
    }
    const live = followers.filter(f => !f.dead);
    return {
        opened, pressed, stillOpen: !!followerDutyMenu,
        workers: live.filter(f => f.duty === 'worker').length,
        total: live.length,
        core: live.filter(f => f.element === 'core').length,
        coreWorking: live.filter(f => f.element === 'core' && f.duty === 'worker').length,
        brawlers: live.filter(f => f.role === 'brawler').length,
        brawlersWorking: live.filter(f => f.role === 'brawler' && f.duty === 'worker').length,
        said: floatingTexts.map(t => t.text),
    };
})()`);

const U = uiEnv();

check('THE ASK: a long press on an ELEMENT row opens that group', () => {
    const r = squadOrder(U, 'elements', 'core', null);
    same(r.opened, 'CORE', 'the press did not open the CORE group');
});

check('and TO WORK moves the whole element group at once', () => {
    const r = squadOrder(U, 'elements', 'core', 'work');
    same(r.coreWorking, r.core, `only ${r.coreWorking} of ${r.core} core went to work`);
    same(r.workers, r.core, 'it moved followers outside the group as well');
    same(r.stillOpen, false, 'the menu stayed open after the order');
});

check('THE ASK: a long press on a ROLE row opens that group', () => {
    const r = squadOrder(U, 'units', 0, null);
    same(r.opened, 'BRAWLERS', 'the press did not open the BRAWLERS group');
});

check('and it orders by role across every element', () => {
    const r = squadOrder(U, 'units', 0, 'work');
    same(r.brawlersWorking, r.brawlers,
         `only ${r.brawlersWorking} of ${r.brawlers} brawlers went to work`);
    same(r.workers, r.brawlers, 'it moved followers outside the role as well');
});

check('snipers and campers are their own groups', () => {
    same(squadOrder(U, 'units', 1, null).opened, 'SNIPERS', 'row 2 is not snipers');
    same(squadOrder(U, 'units', 2, null).opened, 'CAMPERS', 'row 3 is not campers');
});

check('TO LINE takes the group back off the crew', () => {
    const on  = squadOrder(U, 'elements', 'core', 'work');
    same(on.coreWorking, on.core, 'fixture: they should be working first');
    const off = squadOrder(U, 'elements', 'core', 'line');
    same(off.coreWorking, 0, `${off.coreWorking} core are still on the crew`);
});

check('a group order says it ONCE, not once per follower', () => {
    // setFollowerDuty announces every follower it moves. Three identical
    // "ASSIGNED TO WORK CREW" lines stacked on one another is noise, so a group
    // order silences the per-follower line and says it for the whole group.
    const r = squadOrder(U, 'elements', 'core', 'work');
    const perFollower = r.said.filter(t => /ASSIGNED TO WORK CREW/.test(t)).length;
    same(perFollower, 0, perFollower + ' per-follower announcements survived');
    const summary = r.said.filter(t => /CORE/.test(t) && /TO WORK/.test(t));
    same(summary.length, 1, 'expected one summary for the group, got ' + summary.length);
    ok(/3 CORE/.test(summary[0]), 'the summary does not say how many moved: ' + summary[0]);
});

check('a single follower still gets its own answer', () => {
    // The group path must not have silenced the ordinary one-unit order.
    const r = U.run(`(function(){
        floatingTexts.length = 0;
        const f = followers.find(a => !a.dead);
        f.duty = 'fighter';
        setFollowerDuty(f, 'worker');
        return floatingTexts.map(t => t.text);
    })()`);
    ok(r.some(t => /ASSIGNED TO WORK CREW/.test(t)),
       'a single follower order went silent: ' + JSON.stringify(r));
});

check('the CLONES tab is not a duty group', () => {
    const r = squadOrder(U, 'clones', 0, null);
    same(r.opened, null, 'the clones tab opened a duty menu');
});

check('the index says the group order exists', () => {
    const CODEX = fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8');
    ok(/follower index/i.test(CODEX), 'the page never mentions the index as a handle');
    ok(/ELEM/.test(CODEX) && /UNITS/.test(CODEX), 'nor which tabs group what');
    for (const role of ['BRAWLERS', 'SNIPERS', 'CAMPERS']) {
        ok(CODEX.indexOf(role) > -1, 'it does not name ' + role);
    }
});

check('the index takes the press before the world radial does', () => {
    // Otherwise the command ring opens underneath the panel and the press does
    // two things at once.
    const INPUT = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
    const at = INPUT.indexOf('function handleLongHold');
    const body = INPUT.slice(at, INPUT.indexOf('commandTarget=', at));
    ok(/openFollowerDutyMenu\(ex, ey\)\) return/.test(body),
       'the long hold does not give the index first refusal');
    // And the menu's own taps are taken before the index's row taps.
    ok(INPUT.indexOf('handleFollowerDutyMenuTap') < INPUT.indexOf('handleFollowerUIClick(upX'),
       'the index would swallow a tap aimed at the menu');
});

group('the index says so');

check('the work crew page documents both new jobs, from the constants', () => {
    const CODEX = fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8');
    ok(/Tend a clone \\u2014 TOXIC|Tend a clone — TOXIC/.test(CODEX),
       'the page does not document TEND CLONE');
    ok(/Set a block \\u2014 ICE|Set a block — ICE/.test(CODEX), 'nor SET BLOCK');
    ok(/one tile wide/.test(CODEX), 'the page does not say the block is one tile wide');
    ok(/THAW/.test(CODEX), 'nor how to melt it');
    // And the job list is generated, so both appear without being named twice.
    ok(/workerElements\(\)/.test(CODEX), 'the eligible list is not read off workerElements');
});

// Render the work-crew page for a given MEND_RATE and hand back the HTML.
// Grepping the source for the identifier is not enough: it still appears in a
// `typeof` guard, so hardcoding the printed number passed that check.
function crewPageWith(mendRate) {
    let html = '';
    const el = { set innerHTML(v) { html = v; }, get innerHTML() { return html; } };
    const sandbox = {
        console, Math, Object, Array, String, Number, JSON, Set, Map,
        document: { getElementById: () => el },
        MEND_RATE: mendRate,
        MASS_NEUTRALISE_FRAMES: 110, MASS_VALUE_SCALE: 0.35,
        SCOUR_COCOON_FRAMES: 900, SCOUR_NEST_FRAMES: 600,
        workerElements: () => ['electric', 'flux', 'core', 'toxic', 'ice'],
        ELEMENTS: [], PYLON_BUILD_COST: 10,
        GENERATOR_ID: 'gen', GENERATOR_LABEL: 'GEN', GENERATOR_COLOR: '#8fa',
        GENERATOR_HEAL_AMOUNT: 1, GENERATOR_HEAL_INTERVAL: 60, GENERATOR_NEST_RANGE: 4,
        INFEST_RATE: 0.00067, NEST_SPAWN_COST: 20,
    };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8'), ctx,
                    { filename: 'js/codex.js' });
    vm.runInContext('renderWorkCrewIndex()', ctx);
    return html;
}

check('the mend rate on the page follows MEND_RATE', () => {
    // Stated per second, which is the unit the player experiences; the
    // constant is per frame.
    const page = crewPageWith(MEND_RATE);
    const want = String(+(MEND_RATE * 60).toFixed(1)).replace(/\.0$/, '');
    ok(page.includes(want + ' HP a second'),
       `the page should state ${want} HP a second; it says: `
       + (page.match(/[\d.]+ HP a second/g) || ['nothing']).join(', '));
    // And it MOVES with the constant, which is the part a source grep cannot
    // tell apart from a number that was typed in once.
    const doubled = crewPageWith(MEND_RATE * 2);
    ok(!doubled.includes(want + ' HP a second'),
       'the stated rate did not change when MEND_RATE did');
});

check('the index no longer says a hazard may hurt a recruit', () => {
    const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
    ok(/no damage at all/.test(HTML), 'the index does not state the new recruit rule');

    // The player's own hazard rule is a different promise and must still stand:
    // predators do not attack them, but acid and vents still do.
    ok(/Hazards still hurt/.test(HTML), 'the player hazard rule was removed by mistake');
});

check('the drawn block reads as a cube, not a column', () => {
    // One tile edge is sqrt(30² + 15²) ≈ 33.5px on screen, so the vertical edge
    // has to be about TILE_H * 1.1 for the three edges to match. The first pass
    // used 1.9 and drew a pillar — caught by rendering it beside its own tile.
    // Named ICE_BLOCK_H_MULT now, because the TAP test needs the same number
    // to know where the cube is — it used to probe 68px above it and tapping a
    // block selected nothing.
    ok(/const H\s*=\s*TILE_H \* ICE_BLOCK_H_MULT/.test(DRAW),
       'the block height is no longer a multiple of TILE_H');
    const m = MASS.match(/const ICE_BLOCK_H_MULT\s*=\s*([\d.]+)/);
    ok(!!m, 'ICE_BLOCK_H_MULT is not declared in mass.js');
    const mul = Number(m[1]);
    ok(mul > 0.9 && mul < 1.4, `a height of TILE_H * ${mul} is not one tile tall`);
});

// ─────────────────────────────────────────────────────────
//  CALLING A WORKER BACK
//
// REPORTED: "the ICE followers need to be able to be unassigned from work —
// whenever they're in the ICE block you need to be able to take them out of it.
// Also the toxic followers need a quit-working option."
//
// Both commands already existed on the radial — THAW on a block, TO LINE on
// any other worker. Neither could be REACHED, for two different reasons, both
// measured before being fixed:
//
//   ICE:   findFollowerAtScreen probes 55px above a follower's projected point,
//          where a virus sprite's body is drawn. A block is a cube sitting ON
//          its tile, 68px lower. Tapping the block selected nothing; the only
//          way in was to tap the empty air above it.
//
//   TOXIC: an enemy under the press took the ring outright. A repeller has
//          enemies pressed against it BY DESIGN — that is its whole job — so
//          with a predator inside 0.3 tiles the worker could not be selected
//          at all and the ring showed ATTACK. The closer of the two wins now.
(async () => {
    const sandbox = makeBrowserSandbox({ tubecrawler_seed: '305419896', tubecrawler_shards: '999' });
    const vctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), vctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const R = e => vm.runInContext(e, vctx);
    R('gameState.running = true;');

    // One worker of `el`, optionally a predator `enemyOff` tiles away, then a
    // long press aimed at the worker and the ring driven UP to the duty button.
    const recall = (el, enemyOff, settle) => R(`(function(){
        actors.length = 0; followers.length = 0;
        ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
        spawnFollowerAtCrystal(${JSON.stringify(el)});
        const f = followers[0];
        f.x = 6; f.y = 2;
        player.x = 6; player.y = 4; player.visualX = 6; player.visualY = 4;
        setFollowerDuty(f, 'worker');
        for (let n = 0; n < ${settle || 0}; n++) render();
        let foe = null;
        ${enemyOff === null ? '' : `
        const S = SPECIES['ant'];
        foe = new Predator('scout', Object.assign({}, S.scout, {color:S.color}), 6 + ${enemyOff}, 2);
        foe.team = 'red'; foe.speciesName = 'ant'; foe.className = 'scout';
        actors.push(foe);`}
        const wasBlock = !!f.iceBlock;
        // Aimed at where the thing is DRAWN, worked out from the projection and
        // the draw's own height — NOT from followerPickPoint, which is the
        // function under test. Using it to choose the tap made the test follow
        // the bug: delete the block branch and it happily aimed at the sprite
        // instead and still passed.
        const _px = (f.x - player.visualX - (f.y - player.visualY)) * TILE_W + canvas.width/2;
        const _py = (f.x - player.visualX + (f.y - player.visualY)) * TILE_H + canvas.height/2;
        const pt = wasBlock
            ? { x: _px, y: _py + TILE_H - (TILE_H * ICE_BLOCK_H_MULT) / 2 }
            : { x: _px, y: _py - 55 };
        commandFollowerTarget = null; commandEnemyTarget = null;
        handleLongHold(pt.x, pt.y);
        const pickedF = commandFollowerTarget === f;
        const pickedE = !!foe && commandEnemyTarget === foe;
        dragDX = 0; dragDY = -RADIAL_RADIUS;
        drawRadialMenu();
        const action = selectedRadialAction;
        executeCommand();
        for (let n = 0; n < 5; n++) render();
        return { wasBlock, pickedF, pickedE, action,
                 stillBlock: !!f.iceBlock, duty: f.duty, speed: f.moveSpeed };
    })()`);

    group('ICE: the block can be tapped, and thawed');

    check('THE REPORTED CASE: long-holding the BLOCK selects it', () => {
        const r = recall('ice', null, 40);
        same(r.wasBlock, true, 'fixture: it never froze');
        ok(r.pickedF, 'tapping the block did not select the follower');
    });

    check('and the ring melts it and gives the speed back', () => {
        const r = recall('ice', null, 40);
        same(r.action, 'toggle_duty', 'the ring did not offer the duty toggle');
        same(r.stillBlock, false, 'it is still frozen');
        same(r.duty, 'fighter', 'it is still on the work crew');
        ok(r.speed > 0, 'it thawed without getting its speed back');
    });

    check('the pick point follows the BLOCK, not the walking sprite', () => {
        const r = R(`(function(){
            actors.length = 0; followers.length = 0;
            ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
            spawnFollowerAtCrystal('ice');
            const f = followers[0]; f.x = 4; f.y = 2;
            player.x = 4; player.y = 4; player.visualX = 4; player.visualY = 4;
            const walking = followerPickPoint(f).y;
            setFollowerDuty(f, 'worker');
            for (let n = 0; n < 40; n++) render();
            const py = (f.x - player.visualX + (f.y - player.visualY)) * TILE_H + canvas.height/2;
            return { walking, frozen: followerPickPoint(f).y, froze: !!f.iceBlock,
                     drawnCentre: py + TILE_H - (TILE_H * ICE_BLOCK_H_MULT) / 2 };
        })()`);
        same(r.froze, true, 'fixture: it never froze');
        ok(r.frozen > r.walking + 40,
           `the block's pick point (${r.frozen}) is not well below the sprite's (${r.walking})`);
        ok(Math.abs(r.frozen - r.drawnCentre) < 2,
           `the pick point (${r.frozen}) is not where the cube is drawn (${r.drawnCentre})`);
    });

    group('TOXIC: an enemy in the cloud no longer steals the ring');

    check('THE REPORTED CASE: the worker is reachable with a predator on top', () => {
        for (const off of [0, 0.1, 0.3, 0.8]) {
            const r = recall('toxic', off);
            ok(r.pickedF, `with a predator ${off} tiles away the worker was not selectable`);
            same(r.pickedE, false, `the enemy took the ring at ${off} tiles`);
            same(r.action, 'toggle_duty', `no duty toggle offered at ${off} tiles`);
            same(r.duty, 'fighter', `it could not be taken off the crew at ${off} tiles`);
        }
    });

    check('but aiming at the ENEMY still arms the weapon', () => {
        // The new precedence must not cost the ability to attack.
        const r = R(`(function(){
            actors.length = 0; followers.length = 0;
            ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
            spawnFollowerAtCrystal('toxic');
            const f = followers[0]; f.x = 6; f.y = 2;
            player.x = 6; player.y = 4; player.visualX = 6; player.visualY = 4;
            setFollowerDuty(f, 'worker');
            const S = SPECIES['ant'];
            const foe = new Predator('scout', Object.assign({}, S.scout, {color:S.color}), 6.6, 2);
            foe.team = 'red'; foe.speciesName = 'ant'; foe.className = 'scout';
            actors.push(foe);
            const apx = (foe.x - player.visualX - (foe.y - player.visualY)) * TILE_W + canvas.width/2;
            const apy = (foe.x - player.visualX + (foe.y - player.visualY)) * TILE_H + canvas.height/2 + TILE_H;
            commandFollowerTarget = null; commandEnemyTarget = null;
            handleLongHold(apx, apy - 55);
            const out = { enemy: commandEnemyTarget === foe, follower: commandFollowerTarget === f };
            commandMode = false; commandEnemyTarget = null; commandFollowerTarget = null;
            return out;
        })()`);
        same(r.enemy, true, 'aiming squarely at an enemy no longer selects it');
        same(r.follower, false, 'it selected the follower instead');
    });

    check('every worker element can be called back the same way', () => {
        // Not just the two that were reported — the ring is one control.
        for (const el of R('workerElements()')) {
            const r = recall(el, null, el === 'ice' ? 40 : 0);
            ok(r.pickedF, el + ' could not be selected');
            same(r.duty, 'fighter', el + ' could not be taken off the crew');
        }
    });

    check('with several in reach, the CLOSEST is picked', () => {
        // Each finder used to return the first match it walked past, which with
        // a crowd is whichever happens to sit earliest in the array.
        const r = R(`(function(){
            actors.length = 0; followers.length = 0;
            ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
            player.x = 6; player.y = 4; player.visualX = 6; player.visualY = 4;
            for (const el of ['fire', 'toxic', 'ice']) spawnFollowerAtCrystal(el);
            // Far one FIRST in the array, near one last.
            followers[0].x = 6.6; followers[0].y = 2;
            followers[1].x = 6.3; followers[1].y = 2;
            followers[2].x = 6.0; followers[2].y = 2;
            const want = followers[2];
            const p = followerPickPoint(want);
            const got = findFollowerAtScreen(p.x, p.y);
            return { right: got === want,
                     gotEl: got ? got.element : null, wantEl: want.element };
        })()`);
        same(r.right, true,
             'it picked the ' + r.gotEl + ' follower instead of the ' + r.wantEl + ' one under the finger');
    });

    check('the work crew page says how to call one back', () => {
        const CODEX = fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8');
        ok(/Call back/.test(CODEX), 'the page does not mention taking one off the crew');
        ok(/THAW/.test(CODEX), 'nor that a block says THAW');
        ok(/not the air above it/i.test(CODEX), 'nor where to press a block');
        ok(/nearer your finger/i.test(CODEX),
           'nor that a worker with an enemy on it is still reachable');
    });

    check('the two finders share one radius and one rule', () => {
        const INPUT = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        ok(/const PICK_RADIUS = \d+/.test(INPUT), 'the tap radius is not a named constant');
        ok(/function followerPickPoint/.test(INPUT), 'there is no shared pick point');
        ok(/_fD <= _eD/.test(INPUT), 'the closer of the two no longer wins');
        ok(!/commandFollowerTarget = commandEnemyTarget \? null :/.test(INPUT),
           'the enemy still takes the ring outright');
    });

    check('the block height is one constant, shared by the draw and the tap', () => {
        const INPUT = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        ok(/ICE_BLOCK_H_MULT/.test(DRAW), 'the draw no longer uses the named height');
        ok(/ICE_BLOCK_H_MULT/.test(INPUT), 'the tap test does not use the same height');
    });

    group('RE-ROLL: a long hold sends a follower back to the crystal');

    // Long-press the follower, drive the ring LEFT, execute, then walk it home.
    const reroll = (el, prep) => R(`(function(){
        actors.length = 0; followers.length = 0;
        ELEMENTS.forEach(e => { followerByElement[e.id] = []; });
        spawnFollowerAtCrystal(${JSON.stringify(el)});
        const f = followers[0];
        f.x = 6; f.y = 2;
        player.x = 6; player.y = 4; player.visualX = 6; player.visualY = 4;
        ${prep || ''}
        const before = { element: f.element, stats: JSON.stringify(f.stats), personality: f.personality };
        const _px = (f.x - player.visualX - (f.y - player.visualY)) * TILE_W + canvas.width/2;
        const _py = (f.x - player.visualX + (f.y - player.visualY)) * TILE_H + canvas.height/2;
        commandFollowerTarget = null; commandEnemyTarget = null;
        handleLongHold(_px, _py - 55);
        const picked = commandFollowerTarget === f;
        dragDX = -RADIAL_RADIUS; dragDY = 0;
        drawRadialMenu();
        const action = selectedRadialAction;
        executeCommand();
        const leaving = { returning: f.returningToCrystal, inList: followers.includes(f),
            inElement: (followerByElement[before.element]||[]).includes(f), carrying: !!f.carryingMass,
            personality: f.personality };
        for (let n = 0; n < 3000 && f.returningToCrystal; n++) updateNPC(f);
        const all = followers.filter(a => a === f).length;
        const byEl = []; ELEMENTS.forEach(e => (followerByElement[e.id]||[]).forEach(a => { if (a === f) byEl.push(e.id); }));
        return { picked, action, before, leaving, home: !f.returningToCrystal, isFollower: f.isFollower,
                 all, byEl, element: f.element, personality: f.personality, hp: f.health, maxHp: f.maxHealth,
                 stats: JSON.stringify(f.stats) };
    })()`);

    check('the ring offers RE-ROLL on the left and executing it sends the follower home', () => {
        const r = reroll('fire');
        ok(r.picked, 'fixture: follower not picked');
        same(r.action, 'reroll_follower', 'left button is not RE-ROLL');
        same(r.leaving.returning, true, 'it is not walking back');
        same(r.leaving.inList, false, 'it is still in followers[] while walking');
        same(r.leaving.inElement, false, 'it is still in followerByElement while walking');
        same(r.leaving.personality, null, 'identity was not cleared');
    });

    check('it arrives as a follower exactly once, with fresh identity', () => {
        const r = reroll('fire');
        same(r.home, true, 'never arrived');
        same(r.isFollower, true, 'not a follower again');
        same(r.all, 1, 'duplicated in followers[]');
        same(r.byEl.length, 1, 'duplicated or lost in followerByElement');
        same(r.byEl[0], r.element, 'filed under the wrong element');
        ok(r.personality, 'no personality rolled');
        ok(r.hp > 0 && r.hp === r.maxHp, 'health not reset to the new stats');
    });

    check('stats actually re-roll (differ in at least one of several tries)', () => {
        let changed = false;
        for (let i = 0; i < 12 && !changed; i++) {
            const r = reroll('fire');
            changed = r.stats !== r.before.stats || r.element !== r.before.element;
        }
        ok(changed, 'twelve re-rolls never changed anything');
    });

    check('a worker carrying a lump puts it down', () => {
        const r = reroll('electric', `setFollowerDuty(f,'worker');
            const m = chargedMass[0] || (chargedMass.push({x:6,y:2,state:MASS_STATE.CARRIED,carrier:f,amount:1}), chargedMass[0]);
            m.state = MASS_STATE.CARRIED; m.carrier = f; f.carryingMass = m;`);
        same(r.leaving.carrying, false, 'still holding the lump');
    });

    check('clones cannot be re-rolled', () => {
        const r = R(`(function(){
            actors.length = 0; followers.length = 0;
            spawnFollowerAtCrystal('fire');
            const f = followers[0]; f.isClone = true;
            return { can: canRerollFollower(f), did: startFollowerReroll(f), still: followers.includes(f) };
        })()`);
        same(r.can, false, 'clone offered re-roll');
        same(r.did, false, 'clone re-rolled');
        same(r.still, true, 'clone left the squad');
    });

    check('the release-tap path mirrors the button', () => {
        const INPUT = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
        ok(/"reroll_follower"/.test(INPUT), 'input.js cannot select RE-ROLL by tapping');
        ok(/"reroll_follower"/.test(DRAW), 'draw.js does not offer RE-ROLL');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();

