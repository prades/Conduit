// SCOURING: the FIRE follower's work job.
//
// FIRE was the one element with no worker job — mass.js dispatched ELECTRIC,
// FLUX and CORE and said outright that anything else "has nothing to
// contribute". It does now: a fire worker walks to the growth an infestation
// leaves on the ground and burns it back.
//
// The load-bearing parts are not the burning, they are the boundaries:
//
//   - it must be SLOW, or it trivialises the infestation
//   - it must NOT hand the pylon back, or it replaces the reclaim counter
//   - it must not make a player who scours first WORSE off than one who simply
//     reclaims, which is a real risk because reclaiming used to clear the grown
//     nest through the cocoon that a scourer has just removed
//   - the nests it burns must be the GROWN ones only; a zone nest is a fight
//     the player picks, not a chore the work crew quietly takes over
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const INFEST = fs.readFileSync(path.join(ROOT, 'js/infest.js'), 'utf8');
const MASS   = fs.readFileSync(path.join(ROOT, 'js/mass.js'),   'utf8');
const CODEX  = fs.readFileSync(path.join(ROOT, 'js/codex.js'),  'utf8');

// Read the tuning out of the source rather than restating it, so a change to
// the numbers moves these checks with it.
function constant(src, name) {
    const m = src.match(new RegExp(`const\\s+${name}\\s*=\\s*([\\d.]+)`));
    if (!m) throw new Error(`no longer defines ${name}`);
    return Number(m[1]);
}
const PUDDLE_FRAMES = constant(INFEST, 'SCOUR_PUDDLE_FRAMES');
const COCOON_FRAMES = constant(INFEST, 'SCOUR_COCOON_FRAMES');
const NEST_FRAMES   = constant(INFEST, 'SCOUR_NEST_FRAMES');
const WORK_RANGE    = constant(MASS,   'MASS_WORK_RANGE');
const SCOUR_EL      = INFEST.match(/const SCOUR_ELEMENT\s*=\s*"([^"]+)"/)[1];

function makeEnv() {
    const sandbox = {
        console, Math, Object, Array, String, Number, Set, Map, isFinite, isNaN, parseInt, JSON,
        world: [], worldTileMap: new Map(), actors: [], followers: [],
        elementEffects: [], floatingTexts: [], _pillarCache: [],
        frame: 0, shake: 0, shardCount: 0, TILE_W: 60, TILE_H: 30,
        ZONE_LENGTH: 15, alertActive: false,
        crystal: { x: -99, y: 2 },
        player: { x: -99, y: 2, visualX: 0, visualY: 2 },
        canvas: { width: 800, height: 600 },
        saveShards() {}, savedNests: 0,
        applyDamage(t, amt) { if (t) { t.health = Math.max(0, (t.health ?? 100) - amt); if (t.health <= 0) t.dead = true; } },
        getZoneIndex: x => Math.floor(x / 15),
    };
    sandbox.saveNests = () => { sandbox.savedNests++; };
    sandbox.getTile = (gx, gy) => sandbox.worldTileMap.get(`${gx},${gy}`);
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    // mass.js first, as the page loads it first — which is exactly why it must
    // not hold a copy of SCOUR_ELEMENT at load time.
    for (const f of ['js/mass.js', 'js/infest.js']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
    }
    return { sandbox, run: s => vm.runInContext(s, ctx) };
}

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }
function near(a, b, tol, m) {
    if (Math.abs(a - b) > tol) throw new Error(`${m}: expected ~${b} (±${tol}), got ${a}`);
}

// ── fixtures ──────────────────────────────────────────────
function addTile(env, t) {
    env.sandbox.world.push(t);
    env.sandbox.worldTileMap.set(`${t.x},${t.y}`, t);
    return t;
}
function board(env, x0, x1, y0, y1) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        if (!env.sandbox.worldTileMap.has(`${x},${y}`)) addTile(env, { x, y, type: 'floor' });
    }
}
function greenPylon(env, x, y, extra) {
    return addTile(env, Object.assign({
        x, y, type: 'floor', pillar: true, destroyed: false, pillarTeam: 'green',
        pillarCol: '#0f8', health: 80, maxHealth: 80, attackMode: true, waveMode: false,
        attackModeElement: 'fire', converting: false, convertProgress: 0, upgraded: false,
    }, extra || {}));
}
function spinner(species, cls) {
    return { speciesName: species || 'ant', className: cls || 'scout', color: '#aa55ff' };
}
// An infested pylon: red, with its cocoon and grown nest in place. A spider
// spins the toxin, an ant does not, so the species picks whether there is a
// puddle to find.
function infested(env, x, y, species) {
    board(env, x - 4, x + 4, 0, 4);
    const t = greenPylon(env, x, y);
    env.run('convertPylonToRed')(t, spinner(species || 'ant', 'striker'));
    const m = env.run('cocoons').find(c => c.anchors.includes(t));
    ok(!!m, 'fixture: conversion should have spun a cocoon');
    return { t, m };
}
// A worker standing right on top of its chore, so the walk is not under test.
function worker(env, x, y, element) {
    const f = { x, y, type: 'virus', team: 'green', isFollower: true, dead: false,
                duty: 'worker', element: element === undefined ? SCOUR_EL : element,
                health: 40, maxHealth: 40, moveSpeed: 0.02, job: null, walkCycle: 0 };
    env.sandbox.actors.push(f);
    env.sandbox.followers.push(f);
    return f;
}
// Run the work tick the way updateRTSNPC does.
function work(env, crew, n) {
    const list = Array.isArray(crew) ? crew : [crew];
    for (let i = 0; i < n; i++) {
        env.sandbox.frame++;
        for (const f of list) env.run('followerWorkTick')(f);
    }
}
function grownNestOf(env) {
    return env.sandbox.world.find(t => t._infestNest && t.nest && t.nestHealth > 0) || null;
}
// A board where the COCOON is the top-ranked chore. A conversion also grows a
// nest, and a nest outranks a cocoon by design — so a worker standing on the
// cocoon correctly burns the nest first, and a test that wants to measure the
// cocoon has to clear the nest out of the way rather than assume it.
function cocoonOnly(env, x, y, species) {
    const r = infested(env, x, y, species);
    const nest = grownNestOf(env);
    if (nest) { nest.nest = false; nest.nestHealth = 0; nest._infestNest = false; }
    ok(env.run('nearestScourChore')(r.m.x, r.m.y).kind !== 'nest',
       'fixture: the nest should no longer be the top chore');
    return r;
}

// ─────────────────────────────────────────────────────────
group('fire can work at all');

check('THE REPORTED CASE: FIRE is on the work crew', () => {
    const env = makeEnv();
    const f = worker(env, 0, 0);
    same(env.run('canWorkMass')(f), true, 'a fire follower should be assignable to the crew');
    same(env.run('workerJobLabel')(SCOUR_EL), 'SCOUR', 'its job should be labelled');
});

check('the three original jobs still work', () => {
    const env = makeEnv();
    for (const [el, label] of [['electric', 'NEUTRALISE'], ['flux', 'HAUL'], ['core', 'REPAIR']]) {
        same(env.run('workerJobLabel')(el), label, el + ' lost its label');
        same(env.run('canWorkMass')({ element: el }), true, el + ' can no longer work');
    }
});

check('an element with no job is still refused', () => {
    const env = makeEnv();
    same(env.run('canWorkMass')({ element: 'ice' }), false, 'ice has no job and should be refused');
    same(env.run('setFollowerDuty')({ element: 'ice' }, 'worker'), false, 'it should not be accepted');
});

check('the refusal names the elements that CAN work, from the list', () => {
    // A hardcoded sentence is how this ends up saying "ELECTRIC, FLUX AND CORE"
    // after a fourth element has been added.
    const env = makeEnv();
    const label = env.run('workerElementsLabel()');
    for (const el of env.run('workerElements()')) {
        ok(label.includes(el.toUpperCase()), label + ' does not mention ' + el);
    }
    ok(!/ELECTRIC, FLUX AND CORE$/.test(label), 'the refusal still names only the original three');
});

check('mass.js holds no second copy of the element name', () => {
    // It loads BEFORE infest.js, so it cannot import the constant — it reads it
    // at call time instead. A literal here would be free to drift.
    ok(!/['"]fire['"]\s*[;,)\]]/.test(MASS.replace(/^\s*\/\/.*$/gm, '')),
       'mass.js has a literal fire element again');
    ok(/SCOUR_ELEMENT/.test(MASS), 'mass.js should read SCOUR_ELEMENT');
});

check('nothing breaks if infest.js is absent', () => {
    // mass.js reads SCOUR_ELEMENT through a typeof guard, so the three original
    // jobs must still dispatch with the infestation layer missing.
    const sandbox = {
        console, Math, Object, Array, Number, Set, Map, isFinite,
        floatingTexts: [], elementEffects: [], world: [], actors: [], frame: 0,
        canvas: { width: 800, height: 600 }, crystal: { x: 0, y: 0 }, shardCount: 0,
        saveShards() {},
    };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    vm.runInContext(MASS, ctx, { filename: 'js/mass.js' });
    same(vm.runInContext('canWorkMass({element:"electric"})', ctx), true, 'electric should still work');
    same(vm.runInContext('canWorkMass({element:"fire"})', ctx), false, 'fire has no job without infest.js');
    same(vm.runInContext('followerWorkTick({duty:"worker",element:"fire",x:0,y:0})', ctx), false,
         'it should decline rather than throw');
});

// ─────────────────────────────────────────────────────────
group('it burns the mess back');

check('THE REPORTED CASE: a fire worker burns a cocoon open', () => {
    const env = makeEnv();
    const { t, m } = cocoonOnly(env, 3, 2);
    const f = worker(env, m.x, m.y);
    work(env, f, COCOON_FRAMES + 4);
    ok(!env.run('cocoons').includes(m), 'the cocoon should be gone');
    ok(env.sandbox.floatingTexts.some(x => /COCOON BURNED/.test(x.text)), 'no callout');
});

check('it burns a grown nest out', () => {
    const env = makeEnv();
    infested(env, 3, 2);
    const nest = grownNestOf(env);
    ok(!!nest, 'fixture: conversion should have grown a nest');
    // Stand on the nest and let the cocoon be out of reach, so the nest is the
    // chore under test rather than whatever happens to rank first.
    const f = worker(env, nest.x, nest.y);
    work(env, f, NEST_FRAMES + 8);
    same(nest.nest, false, 'the nest should be out');
    same(nest.nestHealth, 0, 'and at zero health');
    ok(env.sandbox.savedNests > 0, 'the kill should be persisted immediately');
});

check('it burns a toxin patch off', () => {
    const env = makeEnv();
    const { m } = infested(env, 3, 2, 'spider');
    same(m.puddles.length, 1, 'fixture: a spider should leave one toxin tile');
    const [px, py] = m.puddles[0];
    const f = worker(env, px, py);
    work(env, f, PUDDLE_FRAMES + 4);
    same(m.puddles.length, 0, 'the patch should be burned off');
    ok(env.sandbox.floatingTexts.some(x => /TOXIN BURNED/.test(x.text)), 'no callout');
});

check('burning the toxin off clears the enhancement, so it cannot seep back', () => {
    // _applyEnhancement runs again on every swell. Leaving enhancement set to
    // "toxic" would put a fresh patch straight back out and make the work
    // pointless.
    const env = makeEnv();
    const { m } = infested(env, 3, 2, 'spider');
    const [px, py] = m.puddles[0];
    work(env, worker(env, px, py), PUDDLE_FRAMES + 4);
    same(m.enhancement, null, 'the enhancement should have gone with the patch');
    m.span = 2;
    env.run('_swellCocoon')(m);
    same(m.puddles.length, 0, 'a swell should not seep a new patch');
});

check('the toxin does not bite a fire follower', () => {
    const env = makeEnv();
    const { m } = infested(env, 3, 2, 'spider');
    const [px, py] = m.puddles[0];
    const fire  = worker(env, px, py, SCOUR_EL);
    const other = worker(env, px, py, 'ice');
    // _puddleTick fires on its interval; run the interval a few times over.
    const interval = constant(INFEST, 'COCOON_PUDDLE_INTERVAL');
    for (let i = 0; i < interval * 3 + 2; i++) { env.sandbox.frame++; env.run('_puddleTick()'); }
    same(fire.health, fire.maxHealth, 'the scourer should be untouched by what it burns');
    ok(other.health < other.maxHealth, 'fixture: a non-fire follower should still be bitten');
});

// ─────────────────────────────────────────────────────────
group('it is deliberately not fast');

check('a cocoon is not cleared in a second', () => {
    const env = makeEnv();
    const { m } = cocoonOnly(env, 3, 2);
    const f = worker(env, m.x, m.y);
    work(env, f, 60);
    ok(env.run('cocoons').includes(m), 'a second of work should not finish it');
    ok((m.shellBurn || 0) > 0, 'but it should have made progress');
    ok(m.shellBurn < 0.2, 'a second should be well under a fifth of the job, got ' + m.shellBurn);
});

check('one worker takes about the documented time', () => {
    const env = makeEnv();
    const { m } = cocoonOnly(env, 3, 2);
    const f = worker(env, m.x, m.y);
    let done = 0;
    for (let i = 1; i <= COCOON_FRAMES * 2 && !done; i++) {
        env.sandbox.frame++;
        env.run('followerWorkTick')(f);
        if (!env.run('cocoons').includes(m)) done = i;
    }
    ok(done > 0, 'it never finished');
    near(done, COCOON_FRAMES, 3, 'a single scourer should take SCOUR_COCOON_FRAMES');
});

check('two workers on the same chore are twice as quick', () => {
    // Progress is kept on the thing being burnt, not on the worker, which is
    // what makes a second scourer add up instead of restarting the job.
    const env = makeEnv();
    const { m } = cocoonOnly(env, 3, 2);
    const a = worker(env, m.x, m.y), b = worker(env, m.x, m.y);
    let done = 0;
    for (let i = 1; i <= COCOON_FRAMES && !done; i++) {
        env.sandbox.frame++;
        env.run('followerWorkTick')(a);
        env.run('followerWorkTick')(b);
        if (!env.run('cocoons').includes(m)) done = i;
    }
    ok(done > 0, 'two workers never finished');
    near(done, COCOON_FRAMES / 2, 3, 'two scourers should halve it');
});

// ─────────────────────────────────────────────────────────
// "MAKE THE FIRE WORKERS DEAL MORE DAMAGE TO THE NESTS."
//
// A nest used to be the longest chore on the list at 1500 frames — longer than
// the cocoon, which was backwards. A grown nest is surface growth on a floor
// tile and it is the thing actively minting predators, so it is what a fire
// crew should be best at; the cocoon is spun around a pylon and stays the long
// job. These checks pin the ratio, not just the constant, because a constant on
// its own can be read from source and satisfied by any value.

check('THE DAMAGE: one worker clears a nest in the documented time', () => {
    const env = makeEnv();
    infested(env, 3, 2);
    const nest = grownNestOf(env);
    ok(!!nest, 'fixture: conversion should have grown a nest');
    const f = worker(env, nest.x, nest.y);
    let done = 0;
    for (let i = 1; i <= NEST_FRAMES * 3 && !done; i++) {
        env.sandbox.frame++;
        env.run('followerWorkTick')(f);
        if (!nest.nest) done = i;
    }
    ok(done > 0, 'it never burned the nest out');
    near(done, NEST_FRAMES, 3, 'a single scourer should take SCOUR_NEST_FRAMES');
});

check('two workers halve it, so a crew is worth having', () => {
    const env = makeEnv();
    infested(env, 3, 2);
    const nest = grownNestOf(env);
    const a = worker(env, nest.x, nest.y), b = worker(env, nest.x, nest.y);
    let done = 0;
    for (let i = 1; i <= NEST_FRAMES && !done; i++) {
        env.sandbox.frame++;
        env.run('followerWorkTick')(a);
        env.run('followerWorkTick')(b);
        if (!nest.nest) done = i;
    }
    ok(done > 0, 'two workers never finished');
    near(done, NEST_FRAMES / 2, 3, 'two scourers should halve the nest too');
});

check('a nest now burns faster than the cocoon, not slower', () => {
    // The reported case. At 1500 against the cocoon's 900 this was inverted,
    // and reverting the constant fails here rather than anywhere above.
    ok(NEST_FRAMES < COCOON_FRAMES,
       `a nest takes ${NEST_FRAMES} frames against the cocoon's ${COCOON_FRAMES}`);
});

check('but it is still a real job, not a touch', () => {
    // It has to stay slower than the toxin patch, which is the quick one, and
    // slow enough that a nest is worth burning rather than free to ignore.
    ok(NEST_FRAMES > PUDDLE_FRAMES,
       `a nest takes ${NEST_FRAMES} frames, no more than the toxin patch`);
    ok(NEST_FRAMES >= 300, `at ${NEST_FRAMES} frames a nest is gone in under 5s`);
});

check('a worker that dies partway does not take the progress with it', () => {
    const env = makeEnv();
    const { m } = cocoonOnly(env, 3, 2);
    const a = worker(env, m.x, m.y);
    work(env, a, Math.round(COCOON_FRAMES * 0.6));
    const banked = m.shellBurn;
    ok(banked > 0.5, 'fixture: it should be over half done');
    a.dead = true;
    const b = worker(env, m.x, m.y);
    work(env, b, 2);
    ok(m.shellBurn >= banked, 'a fresh worker should carry on, not start over');
});

// ─────────────────────────────────────────────────────────
group('it cleans the mess, it does not take the pylon back');

check('THE BOUNDARY: burning the cocoon leaves the pylon red', () => {
    const env = makeEnv();
    const { t, m } = cocoonOnly(env, 3, 2);
    work(env, worker(env, m.x, m.y), COCOON_FRAMES + 4);
    ok(!env.run('cocoons').includes(m), 'fixture: the cocoon must actually have burned');
    same(t.pillarTeam, 'red', 'scouring must not hand the pylon back');
    same(t.attackMode, false, 'nor put it back to work');
});

check('the nest is burned before the cocoon, so the order cannot invert', () => {
    // Why this matters: reclaiming clears the grown nest THROUGH the cocoon's
    // reference to it. If a scourer could burn the cocoon while the nest still
    // stood, that link would be gone and the player who scoured would be left
    // with a spawner the player who simply reclaimed would not have. The
    // ranking is what rules that out, so it is asserted rather than assumed.
    const env = makeEnv();
    const { m } = infested(env, 3, 2);
    const nest = grownNestOf(env);
    ok(!!nest, 'fixture: there should be a grown nest');
    const f = worker(env, m.x, m.y);
    // Generous: it has to walk off the cocoon tile to the nest beside it before
    // any of the burn budget is spent.
    work(env, f, NEST_FRAMES + 200);
    same(nest.nest, false, 'the nest should have gone first');
    ok(env.run('cocoons').includes(m), 'and the cocoon should still be standing');
});

check('a nest its cocoon has lost track of is still cleared on reclaim', () => {
    // The reachable orphan: a session saved before cocoons recorded their nest
    // restores with m.nest === null while the nest tile is still standing. The
    // cocoon reference cannot clear it, so reclaiming finds it by looking beside
    // the pylon instead.
    const env = makeEnv();
    const { t } = infested(env, 3, 2);
    const nest = grownNestOf(env);
    const blob = JSON.parse(JSON.stringify(env.run('serialiseCocoons')()));
    delete blob[0].nest;                       // an older save
    env.run('restoreCocoons')(blob);
    same(env.run('cocoons')[0].nest, null, 'fixture: the reference should be missing');
    ok(nest.nest, 'fixture: but the nest itself should still be standing');
    t.pillarTeam = 'green';
    env.run('clearInfestationAt')(t);
    same(nest.nest, false, 'reclaiming should find it anyway');
});

check('reclaiming one pylon of a two-pylon patch keeps the nest', () => {
    // The other side of the same coin: the orphan sweep must not fire while a
    // cocoon is still standing and still holds that nest.
    const env = makeEnv();
    const { t, m } = infested(env, 3, 2);
    const nest = grownNestOf(env);
    const second = greenPylon(env, 4, 2);
    m.anchors.push(second);
    env.run('convertPylonToRed')(second, spinner('ant', 'striker'));
    t.pillarTeam = 'green';
    env.run('clearInfestationAt')(t);
    ok(env.run('cocoons').includes(m), 'the patch should survive losing one pylon');
    ok(nest.nest, 'and keep its nest');
});

check('a zone nest is not a chore', () => {
    // Zone nests are a fight the player picks. Quietly bulldozing them with the
    // work crew would replace the destroy_nest order.
    const env = makeEnv();
    board(env, 0, 8, 0, 4);
    const zoneNest = addTile(env, { x: 3, y: 2, type: 'floor', nest: true,
                                    nestHealth: 200, nestMaxHealth: 200 });
    const f = worker(env, 3, 2);
    same(env.run('nearestScourChore')(3, 2), null, 'a zone nest should not be offered as a chore');
    work(env, f, 300);
    same(zoneNest.nestHealth, 200, 'and should take no damage');
});

check('with nothing to burn, the worker declines the frame', () => {
    // Returning true with no chore would freeze the follower in place instead
    // of letting the ordinary AI run.
    const env = makeEnv();
    board(env, 0, 8, 0, 4);
    const f = worker(env, 3, 2);
    same(env.run('followerWorkTick')(f), false, 'it should hand the frame back');
});

// ─────────────────────────────────────────────────────────
group('which chore it picks');

check('THE RANKING: the toxin patch comes before the cocoon', () => {
    const env = makeEnv();
    const { m } = infested(env, 3, 2, 'spider');
    const [px, py] = m.puddles[0];
    // Stand on the cocoon itself, so distance alone would pick the cocoon.
    const chore = env.run('nearestScourChore')(m.x, m.y);
    same(chore.kind, 'puddle', 'the thing actively hurting the squad should win');
    ok(chore.x === px && chore.y === py, 'and it should be the real patch');
});

check('the grown nest comes before the cocoon', () => {
    const env = makeEnv();
    const { m } = infested(env, 3, 2);          // an ant: no toxin
    const nest = grownNestOf(env);
    const chore = env.run('nearestScourChore')(m.x, m.y);
    same(chore.kind, 'nest', 'a spawner should outrank the shell');
    ok(chore.x === nest.x && chore.y === nest.y, 'and be the grown nest');
});

check('distance only breaks a tie inside a rank', () => {
    const env = makeEnv();
    const a = infested(env, 3, 2);
    const b = infested(env, 12, 2);
    // Kill both nests so the two cocoons are the only chores left, then ask
    // from right beside the far one.
    for (const t of env.sandbox.world) if (t._infestNest) { t.nest = false; t.nestHealth = 0; }
    const chore = env.run('nearestScourChore')(12, 2);
    same(chore.kind, 'cocoon', 'fixture: only cocoons should be left');
    same(chore.cocoon, b.m, 'the nearer cocoon of the same rank should win');
});

check('it will not walk further than the seek range', () => {
    const env = makeEnv();
    const seek = constant(INFEST, 'INFEST_SEEK_RANGE');
    infested(env, 3, 2);
    same(env.run('nearestScourChore')(3 + seek + 6, 2), null,
         'a chore beyond the seek range should not be offered');
});

check('a chore finished by someone else is dropped, not worked on', () => {
    const env = makeEnv();
    const { m } = infested(env, 3, 2, 'spider');
    const [px, py] = m.puddles[0];
    const f = worker(env, px, py);
    work(env, f, 10);
    ok(!!f._scourTarget, 'fixture: it should have taken the puddle');
    m.puddles = [];              // another worker got there first
    work(env, f, 2);
    ok(!f._scourTarget || f._scourTarget.kind !== 'puddle', 'it should have let the stale chore go');
});

check('it walks to a chore it is not standing on', () => {
    const env = makeEnv();
    const { m } = infested(env, 3, 2);
    const f = worker(env, 3 - 5, 2);
    const d0 = Math.hypot(m.x - f.x, m.y - f.y);
    work(env, f, 120);
    const d1 = Math.hypot(m.x - f.x, m.y - f.y);
    ok(d1 < d0 - 0.5, `it should have closed the distance, ${d0} -> ${d1}`);
    ok(f.walkCycle > 0, 'and animated while walking');
});

check('it does not start burning before it arrives', () => {
    const env = makeEnv();
    const { m } = infested(env, 3, 2);
    const f = worker(env, 3 - 6, 2);
    env.sandbox.frame++;
    env.run('followerWorkTick')(f);
    ok(Math.hypot(m.x - f.x, m.y - f.y) > WORK_RANGE, 'fixture: it should still be out of range');
    ok(!(m.shellBurn > 0), 'it burned the cocoon from across the room');
});

// ─────────────────────────────────────────────────────────
group('duty and orders');

check('an explicit order from the player still wins', () => {
    const env = makeEnv();
    const { m } = infested(env, 3, 2);
    const f = worker(env, m.x, m.y);
    f.job = { type: 'attack', target: null };
    same(env.run('followerWorkTick')(f), false, 'a worker under orders should defer');
    ok(!(m.shellBurn > 0), 'and not quietly scour instead');
});

check('a fighter does not scour', () => {
    const env = makeEnv();
    const { m } = infested(env, 3, 2);
    const f = worker(env, m.x, m.y);
    f.duty = 'fighter';
    same(env.run('followerWorkTick')(f), false, 'only workers scour');
    ok(!(m.shellBurn > 0), 'a fighter should not have burned anything');
});

check('pulling a worker back to the line drops its chore', () => {
    const env = makeEnv();
    const { m } = infested(env, 3, 2);
    const f = worker(env, m.x, m.y);
    work(env, f, 10);
    ok(!!f._scourTarget, 'fixture: it should be holding a chore');
    env.run('setFollowerDuty')(f, 'fighter');
    same(f._scourTarget, null, 'a stale chore reference should not survive the reassignment');
});

check('a non-fire worker does not scour', () => {
    const env = makeEnv();
    const { m } = infested(env, 3, 2);
    const f = worker(env, m.x, m.y, 'electric');
    work(env, f, 200);
    ok(!(m.shellBurn > 0), 'electric neutralises charge, it does not burn cocoons');
});

// ─────────────────────────────────────────────────────────
group('a standing position order must not bench a worker');

// The reported case: "I positioned my followers to a certain spot and then
// they're stuck on that positioning relay and they won't take on a new duty."
//
// followerWorkTick used to bail on ANY job, on the reasoning that an explicit
// order from the player wins. That is right for a task — building, capturing,
// attacking, an element job — because each of those clears itself when it is
// done. But a "move" order is not a task, it is a post: it never completes,
// clearing only if the unit drops under half health or the target tile
// vanishes. So a positioned follower put on the crew deferred to that order
// forever and never did a minute's work.
function positioned(env, f, tx, ty) {
    // Exactly what issueMoveCommand does.
    f.job = { type: 'move', target: { x: tx, y: ty } };
    f.stance = 'hold';
    return f;
}

check('THE REPORTED CASE: positioned first, then put on the crew', () => {
    const env = makeEnv();
    const { m } = cocoonOnly(env, 3, 2);
    const f = worker(env, m.x, m.y);
    positioned(env, f, 9, 1);
    // setFollowerDuty is how the radial assigns it.
    same(env.run('setFollowerDuty')(f, 'worker'), true, 'the assignment should be accepted');
    work(env, f, 200);
    ok(m.shellBurn > 0, 'a positioned follower put on the crew should get to work');
});

check('assigning a duty releases the post and the hold stance', () => {
    const env = makeEnv();
    const f = worker(env, 0, 0);
    positioned(env, f, 9, 1);
    env.run('setFollowerDuty')(f, 'worker');
    same(f.job, null, 'the standing order should be released');
    same(f.stance, 'follow', 'and the hold stance with it \u2014 otherwise it idles instead of following');
});

check('taking one off the crew releases it too', () => {
    // The post order is long gone by then; going back on the line should mean
    // following, not standing on a spot the player has forgotten about.
    const env = makeEnv();
    const f = worker(env, 0, 0);
    positioned(env, f, 9, 1);
    env.run('setFollowerDuty')(f, 'fighter');
    same(f.job, null, 'the standing order should be released');
    same(f.stance, 'follow', 'and the stance restored');
});

check('positioned AFTER being put on the crew, it still works', () => {
    // The same trap in the other order. The duty assignment cannot clear an
    // order that has not been given yet, so the work tick has to be the one
    // that does not treat a post as a task.
    const env = makeEnv();
    const { m } = cocoonOnly(env, 3, 2);
    const f = worker(env, m.x, m.y);
    env.run('setFollowerDuty')(f, 'worker');
    positioned(env, f, 9, 1);
    work(env, f, 200);
    ok(m.shellBurn > 0, 'a worker given a post should still take a chore');
});

check('a worker with a post and NO chore holds the post', () => {
    // The post is not ignored, it is outranked. With nothing to burn the work
    // tick hands the frame back and the move handler keeps the unit in place.
    const env = makeEnv();
    board(env, 0, 12, 0, 4);
    const f = worker(env, 3, 2);
    positioned(env, f, 9, 1);
    same(env.run('followerWorkTick')(f), false, 'with no chore it should hand the frame back');
    ok(!!f.job, 'and leave the post in place for the move handler');
});

check('a worker still finishes a real task first', () => {
    // The original rule, which must survive: a task the player ordered is not
    // interrupted by a chore.
    const env = makeEnv();
    const { m } = cocoonOnly(env, 3, 2);
    const f = worker(env, m.x, m.y);
    f.job = { type: 'attack', target: { x: 5, y: 2, dead: false } };
    same(env.run('followerWorkTick')(f), false, 'an ordered task should still win');
    work(env, f, 200);
    ok(!(m.shellBurn > 0), 'and nothing should have been scoured meanwhile');
});

check('"move" is the only job that never completes', () => {
    // This is what makes the exception principled rather than a special case.
    // If another standing job type is ever added, it has to be considered here
    // too — so the list is asserted rather than left as a comment.
    const NPC = fs.readFileSync(path.join(ROOT, 'js/npc.js'), 'utf8');
    const GAME = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
    const types = [...new Set([...NPC.matchAll(/job\.type\s*===?\s*"(\w+)"/g)].map(m => m[1]))];
    ok(types.includes('move'), 'fixture: the move job should still exist');
    for (const t of types) {
        if (t === 'move') continue;
        // Each other type must have a path that sets job = null.
        const at = NPC.indexOf(`job.type==="${t}"`);
        const body = at < 0 ? '' : NPC.slice(at, at + 1400);
        const clears = /job\s*=\s*null/.test(body) ||
                       new RegExp(`job\\.type==="${t}"\\) a\\.job=null`).test(GAME) ||
                       new RegExp(`type==="${t}"[\\s\\S]{0,200}job=null`).test(GAME);
        ok(clears, `the "${t}" job has no path that clears itself — it would bench a worker too`);
    }
    // And the work tick names move specifically.
    ok(/job\.type !== 'move'/.test(MASS), 'the work tick no longer makes the move exception');
});

// ─────────────────────────────────────────────────────────
group('it survives a refresh');

check('burn progress is saved and restored', () => {
    const env = makeEnv();
    const { m } = cocoonOnly(env, 3, 2, 'spider');
    m.puddles = [];   // the patch outranks the shell too
    work(env, worker(env, m.x, m.y), 200);
    const partial = m.shellBurn;
    ok(partial > 0 && partial < 1, 'fixture: it should be partway through');

    const blob = JSON.parse(JSON.stringify(env.run('serialiseCocoons')()));
    env.run('restoreCocoons')(blob);
    const back = env.run('cocoons')[0];
    ok(!!back, 'the cocoon should have restored');
    near(back.shellBurn, partial, 1e-9, 'a shift of work should not be undone by a refresh');
});

check('junk burn values do not come back through the save', () => {
    const env = makeEnv();
    const { t } = infested(env, 3, 2);
    const blob = JSON.parse(JSON.stringify(env.run('serialiseCocoons')()));
    blob[0].shellBurn = 'lots';
    blob[0].puddleBurn = -5;
    env.run('restoreCocoons')(blob);
    const back = env.run('cocoons')[0];
    same(back.shellBurn, 0, 'a non-number should read as no progress');
    same(back.puddleBurn, 0, 'and a negative one too');
});

check('a cocoon restored mid-burn still finishes', () => {
    const env = makeEnv();
    const { m } = cocoonOnly(env, 3, 2);
    work(env, worker(env, m.x, m.y), Math.round(COCOON_FRAMES * 0.8));
    env.run('restoreCocoons')(JSON.parse(JSON.stringify(env.run('serialiseCocoons')())));
    const back = env.run('cocoons')[0];
    const f = worker(env, back.x, back.y);
    work(env, f, Math.round(COCOON_FRAMES * 0.3));
    ok(!env.run('cocoons').includes(back), 'the remaining fifth should have finished it');
});

// ─────────────────────────────────────────────────────────
group('the index says so');

check('the index says a duty releases a standing post', () => {
    // The reported confusion was that a positioned follower would not take a
    // duty. The behaviour is fixed; the page has to say so, because "my order
    // was silently dropped" is its own surprise.
    ok(/releases a standing POSITION order/i.test(CODEX),
       'the work crew page does not mention what a duty change does to a post');
    ok(/left to finish/i.test(CODEX), 'nor that a real task is not cancelled');
});

check('the work crew page documents the job from the constants', () => {
    for (const name of ['SCOUR_COCOON_FRAMES', 'SCOUR_NEST_FRAMES', 'workerElements']) {
        ok(CODEX.includes(name), 'the codex should read ' + name + ' rather than restating it');
    }
    ok(/Scour/.test(CODEX), 'the page should name the job');
});

check('it does not promise the pylon back', () => {
    // The page has to be straight about the boundary, or the job reads as a
    // replacement for reclaiming.
    const at = CODEX.indexOf('Scour');
    const page = CODEX.slice(at, at + 900);
    ok(/RECLAIM/.test(page), 'the scour entry should point at RECLAIM for the pylon');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
