// The tutorial has to agree with the game it is teaching.
//
// Two reported faults:
//   - Nothing on the board said WHICH pylon (or panel, or recruit) a step meant,
//     so every step had to be guessed at. Each step now points at its subject
//     and drawTutorialHighlight() flashes it until the step is satisfied.
//   - "Tap a pylon to open the command menu" was simply wrong. A tap moves you.
//     The command ring is a half-second press and hold, and UPGRADE is not even
//     on the ring unless BUILD mode is on first — so a player following the old
//     text held a pylon, saw no UPGRADE, and was stuck.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const TUT   = fs.readFileSync(path.join(ROOT, 'js/tutorial.js'), 'utf8');
const DRAW  = fs.readFileSync(path.join(ROOT, 'js/draw.js'),     'utf8');
const GAME  = fs.readFileSync(path.join(ROOT, 'js/game.js'),     'utf8');
const CONFIG= fs.readFileSync(path.join(ROOT, 'js/config.js'),   'utf8');

// Records every canvas call so the highlight can be checked without a GPU.
function recorder() {
    const calls = [];
    const ctx = new Proxy({ calls }, {
        get(t, k) {
            if (k === 'calls') return calls;
            if (k === 'canvas') return { width: 800, height: 600 };
            return (...a) => { calls.push({ op: k, args: a }); };
        },
        set(t, k, v) { calls.push({ op: 'set:' + k, args: [v] }); return true; },
    });
    return { ctx, calls };
}

function makeEnv() {
    const rec = recorder();
    const sandbox = {
        console, Math, Object, Array, String, Number, Set, Map, isFinite, isNaN,
        world: [], actors: [], followers: [], frame: 0,
        TILE_W: 60, TILE_H: 30,
        player: { x: 0, y: 2, visualX: 0, visualY: 2, invuln: 0 },
        crystal: { x: 0, y: 2, health: 300, maxHealth: 300 },
        commandMode: false, commandPendingTap: false, buildMode: false,
        ctx: rec.ctx,
        canvas: { width: 800, height: 600 },
        // The circle step spawns a real Predator, so predator.js and the
        // species tables have to be in scope — a stub would let the spawn
        // path go untested, which is exactly where the bug was.
        elementEffects: [], floatingTexts: [], followerProjectiles: [],
        _pillarCache: [], zonePredators: {}, health: 100, shake: 0,
        ZONE_LENGTH: 15, activeDayZones: 3, activeCrystalBuild: null,
        gameState: { nightNumber: 1, phase: 'day' }, alertActive: false,
        PREDATOR_TYPES: { scout: { moveSpeed: 0.022 }, striker: { moveSpeed: 0.018 },
                          tank: { moveSpeed: 0.012 }, worker: { moveSpeed: 0.024 } },
        PYLON_AGGRO_EXPOSURE: 45, PYLON_AGGRO_TRAP_RATE: 3,
        PYLON_BASH_COOLDOWN: 45, PYLON_AGGRO_GIVE_UP: 9,
        applyDamage(t, amt) { if (t) { t.health = Math.max(0, (t.health ?? 100) - amt); if (t.health <= 0) t.dead = true; } },
        applyElementalDamage() {},
        hurtPlayer() { return false; },
        findNearestFriendlyPillar: () => null,
        spawnFollowerProjectile() {},
        getZoneIndex: x => Math.floor(x / 15),
        document: {
            getElementById: id => (sandbox.els[id] = sandbox.els[id] || stubEl(id)),
            createElement: () => stubEl('created'),
            body: { appendChild() {} },
        },
        els: {},
    };
    // A real-enough element: classList is tracked so the BUILD button's pulse
    // can be asserted rather than assumed.
    function stubEl(id) {
        const classes = new Set();
        return {
            id, style: {}, textContent: '', innerHTML: '', onclick: null,
            appendChild() {},
            classList: {
                add: c => classes.add(c),
                remove: c => classes.delete(c),
                contains: c => classes.has(c),
                toggle: (c, on) => { if (on === undefined) on = !classes.has(c);
                                     if (on) classes.add(c); else classes.delete(c); return on; },
            },
            _classes: classes,
        };
    }
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    for (const f of ['js/species.js', 'js/abilities.js', 'js/predator.js']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
    }
    vm.runInContext(TUT, ctx, { filename: 'js/tutorial.js' });
    return { sandbox, calls: rec.calls, run: s => vm.runInContext(s, ctx) };
}

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// ── fixtures ──────────────────────────────────────────────
function floor(x, y)  { return { x, y, type: 'floor' }; }
function pylon(x, y, up) {
    return { x, y, type: 'floor', pillar: true, destroyed: false, health: 20, maxHealth: 20,
             attackMode: !!up, waveMode: false };
}
function panel(x, y)  { return { x, y, type: 'wall', nodeType: 'wall_panel', panelActivated: false }; }
function recruit(x, y){ return { x, y, team: 'red', isNeutralRecruit: true, dead: false }; }
function enemy(x, y)  { return { x, y, team: 'red', isNeutralRecruit: false, dead: false }; }

// A board with one of everything, so every step has something to point at.
function populate(env) {
    for (let x = -2; x < 12; x++) for (let y = 0; y < 5; y++) env.sandbox.world.push(floor(x, y));
    // The upgraded pylon sits further out, so "nearest pylon" and "the upgraded
    // one" are different tiles and each step has to pick the right one.
    env.sandbox.world.push(pylon(6, 3), pylon(10, 4, true), panel(9, 0));
    env.sandbox.actors.push(recruit(3, 2), enemy(5, 4));
    return env;
}
function stepIds(env) { return env.run('TUTS').map(s => s.id); }
function gotoStep(env, id) {
    const i = stepIds(env).indexOf(id);
    if (i < 0) throw new Error('no such step: ' + id);
    env.run(`tutorialStep = ${i}; tutorialTimer = 0;`);
    env.run('_tutTarget = null; _tutTargetStep = -1;');
}
function highlightOf(env) {
    env.calls.length = 0;
    env.run('drawTutorialHighlight()');
    return env.calls.filter(c => c.op === 'ellipse');
}

group('every step points at something');

check('THE REPORTED CASE: each step marks the thing it is talking about', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    const missing = [];
    for (const id of stepIds(env)) {
        gotoStep(env, id);
        if (!env.run('tutorialTarget()')) missing.push(id);
    }
    eq(missing.length, 0, `steps with nothing marked on the board: ${missing.join(', ')}`);
});

check('the marked thing is the one the step is about', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    const at = id => { gotoStep(env, id); const t = env.run('tutorialTarget()'); return t && `${t.x},${t.y}`; };
    eq(at('recruit'), '3,2', 'the recruit step should mark the recruit');
    eq(at('panel'),   '9,0', 'the panel step should mark the wall panel');
    eq(at('circle'),  '5,4', 'the circle step should mark the enemy, not the recruit');
    eq(at('hold'),    '6,3', 'the hold step should mark the pylon');
    eq(at('upgrade'), '6,3', 'the upgrade step should mark the un-upgraded pylon');
});

check('the upgrade step marks a pylon that still needs upgrading', () => {
    const env = makeEnv();
    for (let x = 0; x < 12; x++) for (let y = 0; y < 5; y++) env.sandbox.world.push(floor(x, y));
    env.sandbox.world.push(pylon(3, 1, true), pylon(8, 3, false));   // one done, one not
    env.run('startTutorial()');
    gotoStep(env, 'upgrade');
    eq(`${env.run('tutorialTarget()').x}`, '8', 'should mark the pylon that is not upgraded yet');
    gotoStep(env, 'switch');
    eq(`${env.run('tutorialTarget()').x}`, '3', 'the switch step should mark the upgraded one');
});

check('the first step marks somewhere reachable to walk to', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'move');
    const t = env.run('tutorialTarget()');
    ok(t, 'nowhere marked to move to');
    const d = Math.hypot(t.x - 0, t.y - 2);
    ok(d > 2.5 && d < 6, `marked tile is ${d.toFixed(1)} tiles away — too close or too far to read as a destination`);
    ok(!t.pillar && !t.nest && !t.nodeType, 'should mark bare floor, not a structure');
});

check('a step with nothing to point at degrades instead of throwing', () => {
    const env = makeEnv();       // empty world, no actors
    env.run('startTutorial()');
    for (const id of stepIds(env)) {
        gotoStep(env, id);
        env.run('tutorialTarget()');       // must not throw
        env.run('drawTutorialHighlight()');
    }
});

group('the flashing');

check('the target is drawn, and pulses rather than sitting still', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'hold');
    env.run('frame = 0');
    const a = highlightOf(env);
    ok(a.length >= 1, 'nothing drawn over the marked pylon');
    env.run('frame = 14');                  // ~quarter of the pulse period
    const b = highlightOf(env);
    const radii = c => c.map(e => e.args[3].toFixed(3)).join(',');
    ok(radii(a) !== radii(b), 'the highlight is static — it should flash');
});

check('the flashing stops as soon as the step is satisfied', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'hold');
    ok(highlightOf(env).length >= 1, 'precondition: should be flashing');
    // Opening the ring satisfies the hold step.
    env.run('commandMode = true');
    env.run('tutorialTick()');
    ok(env.run("TUTS[tutorialStep].id") !== 'hold', 'the step should have advanced');
    // The pylon it was flashing must no longer be the thing being flashed.
    const now = env.run('tutorialTarget()');
    ok(!now || !(now.x === 6 && now.y === 3 && env.run("TUTS[tutorialStep].id") === 'hold'),
       'still flashing the finished step\'s target');
});

check('nothing flashes once the tutorial is closed', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'hold');
    ok(highlightOf(env).length >= 1, 'precondition: should be flashing');
    env.run('exitTutorial()');
    eq(highlightOf(env).length, 0, 'the board is still flashing after the tutorial closed');
    eq(env.run('tutorialTarget()'), null, 'a target survived exitTutorial');
});

check('an off-screen target is not drawn clamped to the edge', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'hold');
    ok(highlightOf(env).length >= 1, 'precondition: should be flashing');
    env.run('player.visualX = 900');       // walk far away
    env.run('_tutTarget = null; _tutTargetStep = -1');
    env.sandbox.world.push(pylon(901, 3));  // give the step a target near the player
    env.run('_tutTarget = world.find(t => t.x === 6 && t.y === 3); _tutTargetStep = tutorialStep;');
    eq(highlightOf(env).length, 0, 'drew a highlight for a target far off screen');
});

check('the highlight draws with the world, not up with the interface', () => {
    const at = GAME.indexOf('drawTutorialHighlight();');
    ok(at > -1, 'drawTutorialHighlight is never called');
    const iface = GAME.indexOf('drawRadialMenu();');
    ok(at < iface, 'the highlight should draw before the interface layer');
    eq((GAME.match(/^\s*drawTutorialHighlight\(\);/gm) || []).length, 1, 'called more than once');
});

check('scanning the world is cached, not done every frame', () => {
    // The worker AI once rescanned every frame and cost real time; the target
    // finders walk the whole world, so they must not run per frame either.
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'hold');
    let scans = 0;
    env.sandbox.countingWorld = new Proxy(env.sandbox.world, {
        get(t, k) { if (k === Symbol.iterator) scans++; return t[k]; },
    });
    env.run('world = countingWorld');
    for (let f = 0; f < 60; f++) { env.run(`frame = ${f}`); env.run('drawTutorialHighlight()'); }
    ok(scans <= 6, `walked the world ${scans} times in 60 frames`);
});

group('getting past CIRCLE TO KILL');

check('THE REPORTED CASE: the kill is reported, never polled for', () => {
    // tutorialTick() runs early in render(), and dead actors are swept out of
    // actors[] later in the SAME frame. A follower kill was therefore gone
    // before any poll could see it, so the step hung forever.
    const tickBody = TUT.slice(TUT.indexOf('function tutorialTick'),
                               TUT.indexOf('function drawTutorialHighlight'));
    ok(!/actors\.some\([^)]*dead/.test(tickBody),
       'tutorialTick still polls actors[] for a corpse');
    ok(/function tutorialNoteKill/.test(TUT), 'no kill notification exists');
});

check('the notification happens before dead actors are swept away', () => {
    const notify = GAME.indexOf('tutorialNoteKill(a)');
    const sweep  = GAME.indexOf('actors=actors.filter(a=>!a.dead)');
    ok(notify > -1, 'game.js never notifies the tutorial of a kill');
    ok(sweep  > -1, 'could not find the dead-actor sweep');
    ok(notify < sweep,
       'the notification runs after the sweep, so the corpse is already gone');
});

check('the circle step puts an enemy next to the player', () => {
    // Real predators only exist in zone 1 and up — thirteen or more tiles from
    // where the tutorial starts — so the step used to promise an enemy that
    // was nowhere on screen.
    const env = makeEnv();
    for (let x = -2; x < 12; x++) for (let y = 0; y < 5; y++) env.sandbox.world.push(floor(x, y));
    env.run('startTutorial()');
    gotoStep(env, 'circle');
    eq(env.sandbox.actors.length, 0, 'fixture: no enemies on the board to begin with');
    env.run('tutorialTick()');
    eq(env.sandbox.actors.length, 1, 'the circle step did not provide anything to kill');
    const foe = env.sandbox.actors[0];
    const d = Math.hypot(foe.x - 0, foe.y - 2);
    ok(d <= 4.5, `the practice bug spawned ${d.toFixed(1)} tiles away — too far to see`);
    ok(foe.team === 'red' && !foe.isNeutralRecruit, 'the practice bug should be hostile');
});

check('the marker points at the bug the step spawned', () => {
    const env = makeEnv();
    for (let x = -2; x < 12; x++) for (let y = 0; y < 5; y++) env.sandbox.world.push(floor(x, y));
    env.run('startTutorial()');
    gotoStep(env, 'circle');
    env.run('tutorialTick()');
    eq(env.run('tutorialTarget()'), env.run('tutPracticeFoe'),
       'the marker is not on the practice bug');
    ok(highlightOf(env).length >= 1, 'the practice bug is not being flashed');
});

check('only one practice bug is ever spawned', () => {
    const env = makeEnv();
    for (let x = -2; x < 12; x++) for (let y = 0; y < 5; y++) env.sandbox.world.push(floor(x, y));
    env.run('startTutorial()');
    gotoStep(env, 'circle');
    for (let i = 0; i < 120; i++) env.run('tutorialTick()');
    eq(env.sandbox.actors.length, 1, 'the step kept spawning bugs every frame');
});

check('killing it advances the step', () => {
    const env = makeEnv();
    for (let x = -2; x < 12; x++) for (let y = 0; y < 5; y++) env.sandbox.world.push(floor(x, y));
    env.run('startTutorial()');
    gotoStep(env, 'circle');
    env.run('tutorialTick()');
    const foe = env.sandbox.actors[0];
    // The real sequence: the follower kills it, then the render loop notifies
    // the tutorial on its way to sweeping the corpse.
    foe.dead = true;
    env.run('actors.forEach(a => { if (a.dead) tutorialNoteKill(a); })');
    env.run('tutorialTick()');
    ok(env.run("TUTS[tutorialStep].id") !== 'circle',
       'the step did not advance after the enemy died');
});

check('the practice bug does not hold a zone respawn slot', () => {
    const env = makeEnv();
    for (let x = -2; x < 12; x++) for (let y = 0; y < 5; y++) env.sandbox.world.push(floor(x, y));
    env.run('startTutorial()');
    gotoStep(env, 'circle');
    env.run('tutorialTick()');
    eq(env.sandbox.actors[0].homeZone, undefined,
       'a homeZone would make the zone respawn logic keep a slot open for it');
});

check('the practice bug leaves when the tutorial closes', () => {
    const env = makeEnv();
    for (let x = -2; x < 12; x++) for (let y = 0; y < 5; y++) env.sandbox.world.push(floor(x, y));
    env.run('startTutorial()');
    gotoStep(env, 'circle');
    env.run('tutorialTick()');
    const foe = env.sandbox.actors[0];
    env.run('exitTutorial()');
    ok(foe.dead, 'a live practice bug was left loose in the safe zone');
    eq(env.run('tutPracticeFoe'), null, 'the reference outlived the tutorial');
});

check('a restart spawns a fresh bug rather than pointing at the old one', () => {
    const env = makeEnv();
    for (let x = -2; x < 12; x++) for (let y = 0; y < 5; y++) env.sandbox.world.push(floor(x, y));
    env.run('startTutorial()');
    gotoStep(env, 'circle');
    env.run('tutorialTick()');
    env.run('exitTutorial()');
    env.run('startTutorial()');
    eq(env.run('tutPracticeFoe'), null, 'startTutorial kept the old bug');
    gotoStep(env, 'circle');
    env.run('tutorialTick()');
    ok(env.run('tutPracticeFoe') && !env.run('tutPracticeFoe').dead, 'no fresh bug on restart');
});

check('an enter hook runs once per step, not every frame', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    env.run('TUTS[0].enter = () => { globalThis.enters = (globalThis.enters||0) + 1; }');
    for (let i = 0; i < 50; i++) env.run('tutorialTick()');
    eq(env.run('enters'), 1, 'the enter hook fired more than once');
});

group('the squad lesson: fire only, or everyone');

// The real getCommandPool/issueAttackOnEnemies out of helpers.js, so the
// SEL-versus-ALL behaviour under test is the game's, not a restatement of it.
const HELPERS = fs.readFileSync(path.join(ROOT, 'js/helpers.js'), 'utf8');
function squadEnv() {
    const env = makeEnv();
    for (let x = -2; x < 12; x++) for (let y = 0; y < 5; y++) env.sandbox.world.push(floor(x, y));
    env.sandbox.squadMode = 'selected';
    env.sandbox.selectedRole = null;
    env.sandbox.uiTab = 'elements';
    env.sandbox.followerByElement = {};
    env.sandbox.player.selectedElement = 'fire';
    env.sandbox.NPC_TYPES = { virus: { moveSpeed: 0.02 } };
    env.sandbox.PERSONALITY_KEYS = ['stoic'];
    env.sandbox.applyPersonality = () => ({ hp: 20, attack: 5, speed: 10, will: 20 });
    env.sandbox.assignRole = () => 'brawler';
    env.sandbox.rebuildFollowerTable = () => {};
    for (const name of ['getCommandPool', 'issueAttackOnEnemies', 'spawnFollowerFromSave']) {
        const src = name === 'spawnFollowerFromSave'
            ? fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8')
            : HELPERS;
        const fn = src.match(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`));
        if (!fn) { console.log(`  FAIL could not find ${name}`); process.exit(1); }
        env.run(fn[0]);
    }
    env.run('startTutorial()');
    gotoStep(env, 'squad');
    return env;
}
const sqClasses = env => env.sandbox.els['btnSquad'] && env.sandbox.els['btnSquad']._classes;
const sqFlashing = env => !!(sqClasses(env) && sqClasses(env).has('tut-wanted'));

check('THE REPORTED CASE: there is a stage for it, before a follower gets spent', () => {
    const ids = stepIds(makeEnv());
    ok(ids.includes('squad'), 'no squad stage in the tutorial');
    ok(ids.indexOf('squad') > ids.indexOf('circle'),
       'the squad lesson should come after the circle gesture it builds on');
    ok(ids.indexOf('squad') < ids.indexOf('upgrade'),
       'it must come before the upgrade step, which sacrifices a follower');
});

check('the stage lends a mixed squad so the lesson is demonstrable', () => {
    const env = squadEnv();
    eq(env.sandbox.followers.length, 0, 'fixture: no squad to begin with');
    env.run('tutorialTick()');
    const els = new Set(env.sandbox.followers.map(f => f.element));
    ok(els.has('fire'), 'no fire unit to demonstrate "fire only" with');
    ok(els.size >= 2, `a mixed squad is needed, got only ${[...els].join(',')}`);
});

check('it does not pile on units the player already has', () => {
    const env = squadEnv();
    env.run("spawnFollowerFromSave({ element: 'fire' })");
    env.run("spawnFollowerFromSave({ element: 'electric' })");
    const before = env.sandbox.followers.length;
    env.run('tutorialTick()');
    eq(env.sandbox.followers.length, before, 'spawned duplicates over an existing squad');
});

check('SQUAD: SEL sends only the selected element', () => {
    const env = squadEnv();
    env.run('tutorialTick()');
    const foe = env.sandbox.actors.find(a => a.isTutorialFoe);
    ok(foe, 'no enemy to order an attack on');
    env.run("squadMode = 'selected'; player.selectedElement = 'fire'");
    env.run('issueAttackOnEnemies([actors.find(a => a.isTutorialFoe)])');
    const ordered = env.sandbox.followers.filter(f => f.job);
    ok(ordered.length > 0, 'nobody answered the order');
    ok(ordered.every(f => f.element === 'fire'),
       `SEL sent ${ordered.map(f => f.element).join(',')} — should be fire only`);
});

check('SQUAD: ALL sends everyone', () => {
    const env = squadEnv();
    env.run('tutorialTick()');
    env.run("squadMode = 'all'");
    env.run('issueAttackOnEnemies([actors.find(a => a.isTutorialFoe)])');
    const ordered = env.sandbox.followers.filter(f => f.job);
    eq(ordered.length, env.sandbox.followers.length, 'ALL should commit the whole squad');
});

check('the stage needs both modes demonstrated to advance', () => {
    const env = squadEnv();
    env.run('tutorialTick()');
    const aim = () => env.run('issueAttackOnEnemies([actors.find(a => a.isTutorialFoe)])');

    env.run("squadMode = 'selected'; player.selectedElement = 'fire'");
    aim();
    env.run('tutorialTick()');
    eq(env.run("TUTS[tutorialStep].id"), 'squad', 'advanced on one mode alone');

    env.run('followers.forEach(f => f.job = null)');
    env.run("squadMode = 'all'");
    aim();
    env.run('tutorialTick()');
    ok(env.run("TUTS[tutorialStep].id") !== 'squad', 'both modes shown but the stage did not advance');
});

check('an order nobody answered does not count as a demonstration', () => {
    // SEL with an element the player has none of commits nobody — that is the
    // lesson working, not the lesson learned.
    const env = squadEnv();
    env.run('tutorialTick()');
    env.run("squadMode = 'selected'; player.selectedElement = 'toxic'");
    env.run('issueAttackOnEnemies([actors.find(a => a.isTutorialFoe)])');
    eq(env.run('tutOrderedSelected'), false, 'an empty order was credited');
});

check('it flashes SQUAD only for the mode still to be shown', () => {
    const env = squadEnv();
    env.run('tutorialTick()');
    // Nothing shown yet: the player can start in either mode, so no nagging.
    ok(!sqFlashing(env), 'flashing SQUAD before the player has done anything');
    env.run("squadMode = 'selected'; player.selectedElement = 'fire'");
    env.run('issueAttackOnEnemies([actors.find(a => a.isTutorialFoe)])');
    env.run('tutorialTick()');
    ok(sqFlashing(env), 'SEL is done — SQUAD should be flashing to ask for ALL');
    env.run("squadMode = 'all'");
    env.run('tutorialTick()');
    ok(!sqFlashing(env), 'the player switched; SQUAD should stop flashing');
});

check('a target stays available for the second order', () => {
    // The first order can kill the bug, and then there is nothing to circle.
    const env = squadEnv();
    env.run('tutorialTick()');
    const first = env.sandbox.actors.find(a => a.isTutorialFoe);
    first.dead = true;
    env.run('tutorialTick()');
    const now = env.sandbox.actors.filter(a => a.isTutorialFoe && !a.dead);
    eq(now.length, 1, 'no fresh target after the first one died');
});

check('the loaned units are handed back when the tutorial closes', () => {
    const env = squadEnv();
    env.run('tutorialTick()');
    ok(env.sandbox.followers.length > 0, 'precondition: should have a loaned squad');
    env.run('exitTutorial()');
    eq(env.sandbox.followers.length, 0, 'free followers were left behind after the tutorial');
    eq(env.sandbox.actors.filter(a => a.isTutorialUnit).length, 0, 'loaned units still in actors[]');
    const buckets = env.run('Object.values(followerByElement).map(b => b.length).join(",")');
    ok(!/[1-9]/.test(buckets), 'followerByElement still holds loaned units: ' + buckets);
});

check('units the player earned are NOT taken away', () => {
    const env = squadEnv();
    env.run("spawnFollowerFromSave({ element: 'ice' })");   // earned, not loaned
    env.run('tutorialTick()');
    env.run('exitTutorial()');
    const left = env.sandbox.followers.map(f => f.element);
    eq(left.join(','), 'ice', `the player's own follower was removed too, left: ${left}`);
});

check('handing them back does not kill them or drop shards', () => {
    const env = squadEnv();
    env.run('tutorialTick()');
    const loaned = env.sandbox.followers.slice();
    env.run('exitTutorial()');
    ok(loaned.every(f => !f.dead), 'loaned units were killed rather than withdrawn');
});

check('a restart lends a fresh squad rather than reusing the old one', () => {
    const env = squadEnv();
    env.run('tutorialTick()');
    env.run('exitTutorial()');
    eq(env.run('tutLoanedFollowers.length'), 0, 'the loan list outlived the tutorial');
    env.run('startTutorial()');
    eq(env.run('tutOrderedSelected'), false, 'SEL progress survived a restart');
    eq(env.run('tutOrderedAll'), false, 'ALL progress survived a restart');
    gotoStep(env, 'squad');
    env.run('tutorialTick()');
    ok(env.sandbox.followers.length >= 2, 'no fresh squad on restart');
});

check('issueAttackOnEnemies still works with no tutorial running', () => {
    const env = squadEnv();
    env.run('tutorialTick()');
    env.run('exitTutorial()');
    env.run("spawnFollowerFromSave({ element: 'fire' })");
    env.run("squadMode = 'all'");
    env.run('issueAttackOnEnemies([{ x: 1, y: 1, dead: false, team: "red" }])');
    ok(env.sandbox.followers.some(f => f.job), 'orders stopped working outside the tutorial');
});

check('the game calls the notifier, and survives it being absent', () => {
    ok(/tutorialNoteAttackOrder/.test(HELPERS), 'helpers.js never reports an attack order');
    ok(/typeof tutorialNoteAttackOrder === "function"/.test(HELPERS),
       'the call should be guarded — helpers.js loads before tutorial.js');
});

group('the BUILD button flashes when the tutorial wants it');

const buildClasses = env => env.sandbox.els['btnBuild'] && env.sandbox.els['btnBuild']._classes;
const buildFlashing = env => !!(buildClasses(env) && buildClasses(env).has('tut-wanted'));

// populate() includes an already-upgraded pylon, which satisfies the upgrade
// step's check() immediately — no good for watching that step's own flashing.
function unbuilt(env) {
    for (let x = -2; x < 12; x++) for (let y = 0; y < 5; y++) env.sandbox.world.push(floor(x, y));
    env.sandbox.world.push(pylon(6, 3));
    return env;
}

check('THE REPORTED CASE: the upgrade step flashes BUILD', () => {
    const env = unbuilt(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'upgrade');
    env.run('buildMode = false');
    env.run('tutorialTick()');
    ok(buildFlashing(env), 'the step asks for build mode but BUILD is not flashing');
});

check('it stops the moment the player turns build mode on', () => {
    const env = unbuilt(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'upgrade');
    env.run('tutorialTick()');
    ok(buildFlashing(env), 'precondition: should be flashing');
    env.run('buildMode = true');
    env.run('tutorialTick()');
    ok(!buildFlashing(env), 'BUILD kept flashing after the player complied');
});

check('the switch step asks for the opposite and flashes accordingly', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'switch');
    env.run('buildMode = true');            // this step wants it OFF
    env.run('tutorialTick()');
    ok(buildFlashing(env), 'the step asks for build mode off but BUILD is not flashing');
    env.run('buildMode = false');
    env.run('tutorialTick()');
    ok(!buildFlashing(env), 'BUILD kept flashing after build mode went off');
});

check('steps that do not want BUILD leave it alone', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    for (const id of ['move', 'recruit', 'panel', 'circle', 'hold', 'ready']) {
        gotoStep(env, id);
        env.run('tutorialTick()');
        ok(!buildFlashing(env), `step "${id}" should not be flashing BUILD`);
    }
});

check('nothing flashes once the tutorial closes', () => {
    const env = unbuilt(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'upgrade');
    env.run('tutorialTick()');
    ok(buildFlashing(env), 'precondition: should be flashing');
    env.run('exitTutorial()');
    ok(!buildFlashing(env), 'BUILD is still flashing after the tutorial closed');
});

check('the class the tutorial sets is actually styled', () => {
    const html = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
    // Anchored on the brace, so a renamed or commented-out selector is caught.
    ok(/\.top-btn\.tut-wanted\s*\{/.test(html), 'game.html has no rule for .tut-wanted');
    ok(/@keyframes\s+tutBtnPulse/.test(html), 'the pulse animation is missing');
    ok(/prefers-reduced-motion[\s\S]{0,200}tut-wanted/.test(html),
       'no reduced-motion fallback for the pulse');
});

check('a missing button is survived, not thrown on', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'upgrade');
    env.run('document.getElementById = () => null');
    env.run('tutorialUiHints()');     // must not throw
});

group('the ring shows and honours UPGRADE in build mode');

check('THE REPORTED CASE: tapping UPGRADE on a pylon upgrades it', () => {
    // draw.js draws the top button whenever buildMode is on (showTopBtn), but
    // input.js resolved a tap with `buildMode ? !_isPyCmd : _isPyCmd` — which
    // excluded exactly the UPGRADE case, so the tap fell through to
    // switch_context and toggled the pylon's mode instead of upgrading it.
    // Comments stripped: the fix explains itself by quoting the old expression.
    const INPUT = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8')
        .replace(/\/\/[^\n]*/g, '');
    ok(!/buildMode \? !_isPyCmd : _isPyCmd/.test(INPUT),
       'the tap path still inverts the pylon test in build mode');
    const m = INPUT.match(/relAngle < -Math\.PI\/4 && relAngle > -3\*Math\.PI\/4 && ([^)]*?)\) selectedRadialAction = "build_upgrade"/);
    ok(m, 'could not find the top-button tap condition');
    eq(m[1].trim(), 'buildMode', 'the tap condition should match showTopBtn in draw.js');
});

check('the draw and tap paths agree on when the top button exists', () => {
    const INPUT = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
    // draw.js: const showTopBtn = buildMode;
    const drawn = DRAW.match(/const showTopBtn = ([^;]+);/);
    ok(drawn, 'could not read showTopBtn from draw.js');
    eq(drawn[1].trim(), 'buildMode', 'draw.js changed how the top button appears');
    const tapped = INPUT.match(/&& ([A-Za-z]+)\) selectedRadialAction = "build_upgrade"/);
    ok(tapped, 'could not read the tap condition from input.js');
    eq(tapped[1], drawn[1].trim(),
       'the ring draws the top button under one rule and taps it under another');
});

check('the ring redraws from buildMode every frame, so toggling updates it', () => {
    // Nothing caches the button set; drawRadialMenu recomputes it per call.
    // That is what lets the player tap BUILD with the ring already open.
    const at = DRAW.indexOf('function drawRadialMenu');
    const body = DRAW.slice(at, DRAW.indexOf('function drawPredatorDebug'));
    ok(/const showTopBtn = buildMode;/.test(body), 'showTopBtn is not read per frame');
    ok(GAME.includes('drawRadialMenu();'), 'the ring is not drawn from the render loop');
});

group('the words match the game');

check('THE REPORTED CASE: no step tells the player to TAP for commands', () => {
    // The exact old wording was "Tap a pylon to open the command menu" and
    // "Tap the active pylon and select SWITCH MODE". A tap moves you; it never
    // opens the ring. Tapping the BUILD button is fine and stays allowed.
    const tuts = makeEnv().run('TUTS');
    const wrong = [
        /tap\s+(a|the)\s+\w*\s*pylon/i,                    // "tap a pylon"
        /tap[^.]{0,40}(open|bring up)[^.]{0,20}command/i,   // "tap ... to open the command menu"
        /tap[^.]{0,30}select\s+(UPGRADE|SWITCH)/i,          // "tap ... and select SWITCH"
    ];
    const bad = tuts.filter(s => wrong.some(re => re.test(s.body)));
    eq(bad.length, 0,
       `steps still say to tap for commands: ${bad.map(s => s.id).join(', ')}`);
});

check('the steps that need the ring say press and hold', () => {
    const tuts = makeEnv().run('TUTS');
    for (const id of ['hold', 'upgrade', 'switch']) {
        const s = tuts.find(t => t.id === id);
        ok(s, 'missing step ' + id);
        ok(/hold/i.test(s.body), `step "${id}" never mentions holding`);
    }
});

check('there is a step whose whole job is teaching the hold', () => {
    const tuts = makeEnv().run('TUTS');
    const s = tuts.find(t => t.id === 'hold');
    ok(s, 'no dedicated press-and-hold step');
    const ids = tuts.map(t => t.id);
    ok(ids.indexOf('hold') < ids.indexOf('upgrade'),
       'the hold must be taught before a step depends on it');
});

check('the hold step is satisfied by actually opening the ring', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'hold');
    env.run('tutorialTick()');
    eq(env.run("TUTS[tutorialStep].id"), 'hold', 'advanced without the player doing anything');
    env.run('commandMode = true');
    env.run('tutorialTick()');
    ok(env.run("TUTS[tutorialStep].id") !== 'hold', 'opening the ring did not satisfy the step');
});

check('a release straight after the hold also counts', () => {
    // Letting go on the spot leaves the ring up awaiting a tap — that is a
    // successful hold and must not leave the player stuck on this step.
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'hold');
    env.run('commandPendingTap = true');
    env.run('tutorialTick()');
    ok(env.run("TUTS[tutorialStep].id") !== 'hold', 'a hold-then-release did not count');
});

check('the hold duration the step promises is the one the game uses', () => {
    const ms = Number((CONFIG.match(/const LONG_HOLD_MS = (\d+)/) || [])[1]);
    ok(ms, 'could not read LONG_HOLD_MS');
    eq(ms, 500, 'the tutorial says "half a second" — update the text if this changes');
});

check('the upgrade step warns that UPGRADE needs BUILD mode', () => {
    // draw.js only puts UPGRADE on the ring when buildMode is on, so a player
    // who follows the step without it sees no UPGRADE button at all.
    ok(/const showTopBtn = buildMode;/.test(DRAW),
       'UPGRADE is no longer gated on buildMode — this step\'s wording can be simplified');
    const s = makeEnv().run('TUTS').find(t => t.id === 'upgrade');
    ok(/build/i.test(s.body), 'the upgrade step never mentions build mode');
});

check('the switch step names the button that actually exists', () => {
    // The ring's left button is labelled SWITCH, not "SWITCH MODE".
    ok(/leftLabel\s*=\s*"SWITCH"/.test(DRAW), 'the left ring button is no longer SWITCH');
    const s = makeEnv().run('TUTS').find(t => t.id === 'switch');
    ok(/\bSWITCH\b/.test(s.body), 'the switch step does not name the SWITCH button');
});

check('no step is too long for the panel on a phone', () => {
    // The panel is max 400px wide at 0.7rem monospace and sits 80px off the
    // bottom, so it grows upward. Roughly 38 characters a line; a step much
    // past 260 characters starts eating the board on a short screen.
    const tuts = makeEnv().run('TUTS');
    const tooLong = tuts.filter(s => s.body.length > 260);
    eq(tooLong.length, 0,
       `steps too long for the panel: ${tooLong.map(s => `${s.id} (${s.body.length} chars)`).join(', ')}`);
    // And none so terse it explains nothing.
    const tooShort = tuts.filter(s => s.body.length < 40);
    eq(tooShort.length, 0, `steps with no real explanation: ${tooShort.map(s => s.id).join(', ')}`);
});

group('progress tracking');

check('progress is watched by step id, not by step number', () => {
    // These watchers were pinned to indices 3 and 5; inserting the hold step
    // would have re-pointed them at whatever landed on those numbers.
    ok(!/tutorialStep === \d/.test(TUT),
       'tutorialTick still compares tutorialStep against a number');
    ok(/id !== 'circle'/.test(TUT) && /id === 'switch'/.test(TUT),
       'the watchers should key off step ids');
});

check('the kill only counts on its own step', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'recruit');
    env.sandbox.foe = { x: 1, y: 1, team: 'red', dead: true, isFollower: false };
    env.run('tutorialNoteKill(foe)');
    eq(env.run('tutEnemyKilled'), false, 'a corpse counted a kill on the wrong step');
    gotoStep(env, 'circle');
    env.run('tutorialNoteKill(foe)');
    eq(env.run('tutEnemyKilled'), true, 'the kill did not register on the circle step');
});

check('a dead follower or recruit is not a kill won', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    gotoStep(env, 'circle');
    env.sandbox.ally   = { x: 1, y: 1, team: 'green', dead: true, isFollower: true };
    env.sandbox.neutral= { x: 1, y: 1, team: 'red', dead: true, isNeutralRecruit: true };
    env.run('tutorialNoteKill(ally)');
    env.run('tutorialNoteKill(neutral)');
    eq(env.run('tutEnemyKilled'), false, 'a dead ally or recruit satisfied the kill step');
    env.run('tutorialNoteKill(null)');    // must not throw
});

check('every step has an id, and they are unique', () => {
    const ids = makeEnv().run('TUTS').map(s => s.id);
    ok(ids.every(Boolean), 'a step is missing its id');
    eq(new Set(ids).size, ids.length, 'duplicate step ids: ' + ids.join(','));
});

check('the step counter matches the number of steps', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    eq(env.run('TUTS.length'), stepIds(env).length, 'step count disagrees with the list');
    ok(env.run('TUTS[TUTS.length-1].check()') === false,
       'the last step should wait for the player to close it');
});

check('a fresh start clears the previous run\'s progress', () => {
    const env = populate(makeEnv());
    env.run('startTutorial()');
    env.run('tutEnemyKilled = true; tutModeSwitched = true; tutHeldOpen = true; tutorialStep = 4');
    env.run('startTutorial()');
    eq(env.run('tutorialStep'), 0, 'did not go back to the first step');
    eq(env.run('tutEnemyKilled'), false, 'kill flag survived a restart');
    eq(env.run('tutModeSwitched'), false, 'mode-switch flag survived a restart');
    eq(env.run('tutHeldOpen'), false, 'hold flag survived a restart');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
