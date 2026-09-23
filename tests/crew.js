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
const REPEL_RADIUS   = constant(MASS, 'REPEL_RADIUS');
const REPEL_PUSH     = constant(MASS, 'REPEL_PUSH');
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
    same(env.run('workerJobLabel')('toxic'), 'REPEL', 'toxic');
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
group('TOXIC: it repels');

check('THE JOB: a predator walking in is pushed back out', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const p = enemy(env, 10.4, 2);
    const before = dist(p, w);
    work(env, w, 60);
    ok(dist(p, w) > before + 0.5,
       `it should have been shoved: ${before.toFixed(2)} -> ${dist(p, w).toFixed(2)}`);
});

check('and the push beats a predator\'s walking speed', () => {
    // The load-bearing number. A cloud that pushes slower than a predator
    // walks is decorative — they would stroll straight through it.
    ok(REPEL_PUSH > 0.04, `a push of ${REPEL_PUSH} does not outpace a predator`);
});

check('it does NO damage — ground, not kills', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const p = enemy(env, 10.2, 2);
    work(env, w, 120);
    same(p.health, p.maxHealth, 'the repeller should never hurt anything');
    same(p.dead, false, 'nor kill it');
});

check('it stops pushing at the edge of the cloud', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const far = enemy(env, 10 + REPEL_RADIUS + 0.4, 2);
    const at = far.x;
    work(env, w, 60);
    // The repeller walks toward a target it can see, so the cloud follows it —
    // what must not happen is a shove landing from outside the radius on the
    // first frame, before it has moved at all.
    env.sandbox.frame++;
    const w2 = makeEnv();
    const a = follower(w2, 'toxic', 10, 2);
    const b = enemy(w2, 10 + REPEL_RADIUS + 0.4, 2);
    const bx = b.x;
    same(w2.run('repelStep')(a), 0, 'nothing outside the radius should be pushed');
    same(b.x, bx, 'and it should not have moved');
});

check('the push is strongest at the middle and fades to nothing at the rim', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const near_ = enemy(env, 10.1, 2);
    const rim   = enemy(env, 10 + REPEL_RADIUS - 0.05, 2);
    const n0 = near_.x, r0 = rim.x;
    env.run('repelStep')(w);
    ok(near_.x - n0 > rim.x - r0,
       `the middle should push harder: ${(near_.x - n0).toFixed(4)} vs ${(rim.x - r0).toFixed(4)}`);
    ok(rim.x - r0 >= 0, 'the rim should not pull inward');
});

check('THE RECRUIT: it never shoves one off its route', () => {
    // Same rule as every weapon: a recruit walking to the Crystal is not an
    // enemy. Pushing one around would be the same bug as shooting it.
    //
    // There is a REAL enemy in the cloud as well, and that is the whole point.
    // The first version of this check had only the recruit, so the repeller
    // found no target, handed the frame back and never ran the push at all —
    // it passed with the recruit guard removed. The cloud has to be actually
    // running for the recruit standing in it to prove anything.
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const r = recruit(env, 10.2, 2);
    const p = enemy(env, 10.25, 2);
    const at = r.x, aty = r.y, pAt = p.x;
    work(env, w, 120);
    ok(p.x > pAt + 0.5, 'fixture: the cloud must actually be pushing — it did not move the enemy');
    same(r.x, at, 'a recruit should not be moved');
    same(r.y, aty, 'nor sideways');
    same(r.health, r.maxHealth, 'nor hurt');
});

check('and repelStep itself passes a recruit over, foe present or not', () => {
    // The guard belongs in the push as well as in the target scan. With only a
    // recruit in reach the worker bails out earlier, so that path alone cannot
    // show which of the two is doing the work.
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const r = recruit(env, 10.1, 2);
    const p = enemy(env, 10.15, 2);
    const rAt = r.x, pAt = p.x;
    same(env.run('repelStep')(w), 1, 'only the enemy should have counted as pushed');
    ok(p.x > pAt, 'the enemy should have moved');
    same(r.x, rAt, 'the recruit should not have');
});

check('nor does it push your own squad, or itself', () => {
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const mate = follower(env, 'fire', 10.2, 2, 'fighter');
    const at = mate.x, selfAt = w.x;
    env.run('repelStep')(w);
    same(mate.x, at, 'an ally should not be pushed');
    same(w.x, selfAt, 'and it must not push itself');
});

check('it walks to the ENEMY, not to the nearest recruit', () => {
    // The target scan needs the same guard as the push. Without it a repeller
    // would trail the closest recruit around, push nothing, and leave the
    // predator it should be holding off alone — which reverting only the push
    // guard does not show, because the push would still refuse the recruit.
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    const r = recruit(env, 10.5, 2);         // close
    const p = enemy(env, 16, 2);             // far, and the real threat
    const picked = env.run('_nearestRepelTarget')(w);
    ok(picked === p, 'it picked ' + (picked === r ? 'the recruit' : 'nothing'));
    // And it should actually set off toward the enemy.
    const at = w.x;
    work(env, w, 60);
    ok(w.x > at + 0.2, 'it should have walked toward the predator');
});

check('a repeller with nothing in reach hands the frame back', () => {
    // So it holds station and follows normally rather than standing inert.
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    enemy(env, 10 + SEEK + 6, 2);
    same(env.run('followerWorkTick')(w), false, 'it should not claim the frame');
});

check('a foe standing exactly on it is still pushed, not sent to NaN', () => {
    // Distance zero has no direction to push along. Dividing by it writes NaN
    // into a coordinate, and one NaN takes the actor off the map permanently.
    const env = makeEnv();
    const w = follower(env, 'toxic', 10, 2);
    w.dirX = 1; w.dirY = 0;
    const p = enemy(env, 10, 2);
    same(env.run('repelStep')(w), 1, 'it should still count as pushed');
    ok(isFinite(p.x) && isFinite(p.y), `position went to ${p.x},${p.y}`);
    ok(p.x > 10, 'it should be pushed along the repeller\'s facing');
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

check('the cocoon toxin no longer names them', () => {
    const INFEST = fs.readFileSync(path.join(ROOT, 'js/infest.js'), 'utf8');
    const at = INFEST.indexOf('function puddleAffects');
    const body = INFEST.slice(at, INFEST.indexOf('\nfunction ', at + 1));
    ok(at > 0 && body.length > 40, 'puddleAffects could not be located');
    ok(!/return !!\(a\.isFollower \|\| a\.isNeutralRecruit\)/.test(body),
       'the toxin still names recruits as victims');
    ok(/a\.isFollower/.test(body), 'and it should still name followers');
});

// ─────────────────────────────────────────────────────────
group('the index says so');

check('the work crew page documents both new jobs, from the constants', () => {
    const CODEX = fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8');
    ok(/Repel \\u2014 TOXIC|Repel — TOXIC/.test(CODEX), 'the page does not document REPEL');
    ok(/Set a block \\u2014 ICE|Set a block — ICE/.test(CODEX), 'nor SET BLOCK');
    ok(/one tile wide/.test(CODEX), 'the page does not say the block is one tile wide');
    ok(/THAW/.test(CODEX), 'nor how to melt it');
    // And the job list is generated, so both appear without being named twice.
    ok(/workerElements\(\)/.test(CODEX), 'the eligible list is not read off workerElements');
});

// Render the work-crew page for a given REPEL_RADIUS and hand back the HTML.
// Grepping the source for the identifier is not enough: it still appears in a
// `typeof` guard, so hardcoding the printed number passed that check.
function crewPageWith(repelRadius) {
    let html = '';
    const el = { set innerHTML(v) { html = v; }, get innerHTML() { return html; } };
    const sandbox = {
        console, Math, Object, Array, String, Number, JSON, Set, Map,
        document: { getElementById: () => el },
        REPEL_RADIUS: repelRadius,
        MASS_NEUTRALISE_FRAMES: 110, MASS_VALUE_SCALE: 0.35,
        SCOUR_COCOON_FRAMES: 900, SCOUR_NEST_FRAMES: 600,
        workerElements: () => ['electric', 'flux', 'core', 'toxic', 'ice', 'fire'],
        ELEMENTS: [], PYLON_BUILD_COST: 10,
        GENERATOR_ID: 'gen', GENERATOR_LABEL: 'GEN', GENERATOR_COLOR: '#8fa',
        GENERATOR_HEAL_AMOUNT: 1, GENERATOR_HEAL_INTERVAL: 60, GENERATOR_NEST_RANGE: 4,
        INFEST_RATE: 0.00067, COCOON_SPAWN_FRAMES: 900, COCOON_SPAN_MAX: 3,
        COCOON_PUDDLE_DAMAGE: 3, COCOON_PUDDLE_INTERVAL: 45,
        COCOON_TOXIN_SPECIES: ['spider', 'scorpion'], NEST_GROW_COOLDOWN: 2700,
    };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8'), ctx,
                    { filename: 'js/codex.js' });
    vm.runInContext('renderWorkCrewIndex()', ctx);
    return html;
}

check('the cloud size on the page follows REPEL_RADIUS', () => {
    const page = crewPageWith(REPEL_RADIUS);
    const want = String(+(REPEL_RADIUS * 2).toFixed(1)).replace(/\.0$/, '');
    ok(page.includes(want + ' tiles'),
       `the page should state ${want} tiles across; it says: `
       + (page.match(/[\d.]+ tiles/g) || ['nothing']).join(', '));
    // And it MOVES with the constant, which is the part a source grep cannot
    // tell apart from a number that was typed in once.
    const doubled = crewPageWith(REPEL_RADIUS * 2);
    ok(!doubled.includes(want + ' tiles'),
       'the stated cloud size did not change when REPEL_RADIUS did');
});

check('the index no longer says a hazard may hurt a recruit', () => {
    const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
    ok(/no damage at all/.test(HTML), 'the index does not state the new recruit rule');
    ok(/never <strong>pushed<\/strong>/.test(HTML), 'nor that a repeller will not shove one');
    // The player's own hazard rule is a different promise and must still stand:
    // predators do not attack them, but acid and vents still do.
    ok(/Hazards still hurt/.test(HTML), 'the player hazard rule was removed by mistake');
});

check('the drawn block reads as a cube, not a column', () => {
    // One tile edge is sqrt(30² + 15²) ≈ 33.5px on screen, so the vertical edge
    // has to be about TILE_H * 1.1 for the three edges to match. The first pass
    // used 1.9 and drew a pillar — caught by rendering it beside its own tile.
    const m = DRAW.match(/const H\s*=\s*TILE_H \* ([\d.]+)/);
    ok(!!m, 'the block height is no longer a multiple of TILE_H');
    const mul = Number(m[1]);
    ok(mul > 0.9 && mul < 1.4, `a height of TILE_H * ${mul} is not one tile tall`);
});

console.log(failures ? `\n${failures} FAILING` : '\nall passing');
process.exit(failures ? 1 : 0);
