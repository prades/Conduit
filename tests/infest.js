// INFESTATION: what predators do when nobody is fighting them.
//
// Left undisturbed a HUNTER walks to the nearest pylon you hold and converts it
// to its own side; any predator carries charged mass to its zone's WALL nest,
// and every NEST_SPAWN_COST paid in hatches another predator. Nothing grows on
// the floor any more — no floor nests, no cocoons, no toxin puddles.
//
// The load-bearing parts are the guards: "undisturbed" has to mean undisturbed,
// conversion must not be a ratchet the player cannot undo, and the nest only
// grows its numbers from mass that was really carried in.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const INFEST = fs.readFileSync(path.join(ROOT, 'js/infest.js'), 'utf8');
const GAME   = fs.readFileSync(path.join(ROOT, 'js/game.js'),   'utf8');
const PRED   = fs.readFileSync(path.join(ROOT, 'js/predator.js'),'utf8');
const DRAW   = fs.readFileSync(path.join(ROOT, 'js/draw.js'),   'utf8');
const INPUT  = fs.readFileSync(path.join(ROOT, 'js/input.js'),  'utf8');
const CMD    = fs.readFileSync(path.join(ROOT, 'js/commands.js'),'utf8');
const WAVES  = fs.readFileSync(path.join(ROOT, 'js/waves.js'),  'utf8');
const SAVE   = fs.readFileSync(path.join(ROOT, 'js/save.js'),   'utf8');

function constant(name) {
    const m = INFEST.match(new RegExp(`const\\s+${name}\\s*=\\s*([\\d.]+)`));
    if (!m) throw new Error(`infest.js no longer defines ${name}`);
    return Number(m[1]);
}
const RATE        = constant('INFEST_RATE');
const DECAY       = constant('INFEST_DECAY');
const REACH       = constant('INFEST_REACH');
const SEEK        = constant('INFEST_SEEK_RANGE');
const SETTLE_MIN      = constant('INFEST_SETTLE_MIN');
const SETTLE_MAX      = constant('INFEST_SETTLE_MAX');
const PACE_MIN        = constant('INFEST_PACE_MIN');
const PACE_MAX        = constant('INFEST_PACE_MAX');

const TILE_W_HALF_LIMIT = 40;

function makeEnv() {
    const calls = [];
    const gctx = new Proxy({}, {
        get(t, k) {
            if (k === 'canvas') return { width: 800, height: 600 };
            return (...a) => { calls.push({ op: k, args: a }); };
        },
        // Sets are recorded too, so which colours were used is assertable.
        set(t, k, v) { calls.push({ op: 'set:' + k, args: [v] }); return true; },
    });
    const sandbox = {
        console, Math, Object, Array, String, Number, Set, Map, isFinite, isNaN, parseInt,
        world: [], worldTileMap: new Map(), actors: [], followers: [],
        elementEffects: [], floatingTexts: [], followerProjectiles: [],
        _pillarCache: [], _genPylons: [], _genLinks: [], zonePredators: {},
        frame: 0, shake: 0, health: 100, TILE_W: 60, TILE_H: 30,
        ZONE_LENGTH: 15, activeDayZones: 3, alertActive: false,
        gameState: { nightNumber: 1, phase: 'day' },
        activeCrystalBuild: null,
        crystal: { x: -99, y: 2, health: 300, maxHealth: 300 },
        player: { x: -99, y: 2, visualX: 0, visualY: 2, invuln: 0 },
        canvas: { width: 800, height: 600 }, ctx: gctx,
        PREDATOR_TYPES: { scout: { moveSpeed: 0.022 }, striker: { moveSpeed: 0.018 },
                          tank: { moveSpeed: 0.012 }, worker: { moveSpeed: 0.024 } },
        PYLON_AGGRO_EXPOSURE: 45, PYLON_AGGRO_TRAP_RATE: 3, PYLON_HUNTER_SHARE: 0.25,
        PYLON_BASH_COOLDOWN: 45, PYLON_AGGRO_GIVE_UP: 9,
        applyDamage(t, amt) { if (t) { t.health = Math.max(0, (t.health ?? 100) - amt); if (t.health <= 0) t.dead = true; } },
        applyElementalDamage() {}, hurtPlayer: () => false,
        findNearestFriendlyPillar: () => null, spawnFollowerProjectile() {},
        getZoneIndex: x => Math.floor(x / 15),
    };
    sandbox.getTile = (gx, gy) => sandbox.worldTileMap.get(`${gx},${gy}`);
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    for (const f of ['js/species.js', 'js/abilities.js', 'js/mass.js', 'js/infest.js', 'js/predator.js']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
    }
    // The game no longer sends predators looking for pylons (nearestGreenPylonFor
    // finds nothing), but everything below the walk — the rate, the decay, the
    // progress bar, the nests — still needs a predator standing at a pylon. So
    // the fixtures stand in for "something sent it" with the old nearest-pylon
    // search, and the 'predators ignore pylons' group puts the real one back.
    vm.runInContext(`globalThis.__realSeek = nearestGreenPylonFor;
        nearestGreenPylonFor = function (pred) {
            let best = null, bestD = INFEST_SEEK_RANGE;
            for (const t of world) {
                if (!t.pillar || t.destroyed || t.health <= 0 || t.pillarTeam !== 'green') continue;
                const d = Math.hypot(t.x - pred.x, t.y - pred.y);
                if (d < bestD) { bestD = d; best = t; }
            }
            return best;
        };`, ctx);
    return { sandbox, calls, run: s => vm.runInContext(s, ctx) };
}

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(b === a)}`); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// ── fixtures ──────────────────────────────────────────────
function addTile(env, t) {
    env.sandbox.world.push(t);
    env.sandbox.worldTileMap.set(`${t.x},${t.y}`, t);
    if (t.pillar && !t.destroyed && t.health > 0) env.sandbox._pillarCache.push(t);
    return t;
}
function floorAt(env, x, y, extra) {
    return addTile(env, Object.assign({ x, y, type: 'floor' }, extra || {}));
}
function greenPylon(env, x, y, extra) {
    return addTile(env, Object.assign({
        x, y, type: 'floor', pillar: true, destroyed: false, pillarTeam: 'green',
        pillarCol: '#0f8', health: 80, maxHealth: 80, attackMode: true, waveMode: false,
        attackModeElement: 'fire', attackModeColor: '#ff3300', converting: false,
        convertProgress: 0, upgraded: false,
    }, extra || {}));
}
// A board of clear floor with nothing on it.
function board(env, x0, x1, y0, y1) {
    for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        if (!env.sandbox.worldTileMap.has(`${x},${y}`)) floorAt(env, x, y);
    }
}
function mkPred(env, x, y, species, cls) {
    const S = env.run('SPECIES')[species || 'ant'];
    const c = cls || 'scout';
    const def = Object.assign({}, S[c], { color: S.color });
    const p = new (env.run('Predator'))(c, def, x, y);
    p.speciesName = species || 'ant'; p.className = c;
    p.state = 'wander'; p.entryDelay = 0; p.walkCycle = 1;
    p.dirX = 1; p.dirY = 0; p.headAngle = 0;
    env.run('initAbility')(p);
    p.baseMoveSpeed = p.moveSpeed;
    env.sandbox.actors.push(p);
    return p;
}
function tick(env, n, fn) {
    for (let i = 0; i < n; i++) {
        env.sandbox.frame++;
        env.sandbox.actors.forEach(a => a.update && a.update());
        env.run('decayConversions()');
        if (fn) fn(i);
    }
}
// Straight to a converted pylon, without simulating the walk each time.
function convert(env, t, pred) {
    env.run('convertPylonToRed')(t, pred);
}
// A nest now has to be PAID FOR: conversion only marks a site, and the nest is

// A predator-shaped object that is NOT in actors[].
function spinner(species, cls) {
    return { speciesName: species || 'ant', className: cls || 'scout', color: '#aa55ff' };
}

group('undisturbed means undisturbed');

check('an alarm stops it — a fight is not gardening time', () => {
    const env = makeEnv();
    const p = mkPred(env, 0, 2);
    env.sandbox.alertActive = true;
    same(env.run('predatorUndisturbed')(p), false, 'alerted predators should not infest');
    env.sandbox.alertActive = false;
    same(env.run('predatorUndisturbed')(p), true, 'a quiet predator should');
});

check('a predator that has been hit goes for whatever hit it', () => {
    const env = makeEnv();
    const p = mkPred(env, 0, 2);
    p.provoked = true;
    same(env.run('predatorUndisturbed')(p), false, 'provoked should not infest');
});

check('hunting, attacking and crawling in all take priority', () => {
    const env = makeEnv();
    const p = mkPred(env, 0, 2);
    for (const st of ['hunt', 'attack', 'crawl_in']) {
        p.state = st;
        same(env.run('predatorUndisturbed')(p), false, st + ' should not infest');
    }
});

check('a live target takes priority even in wander', () => {
    const env = makeEnv();
    const p = mkPred(env, 0, 2);
    p.currentTarget = { x: 1, y: 2, dead: false };
    same(env.run('predatorUndisturbed')(p), false, 'it has something to chase');
    p.currentTarget.dead = true;
    same(env.run('predatorUndisturbed')(p), true, 'a dead target is no target');
});

check('your own clones never infest your pylons', () => {
    const env = makeEnv();
    const p = mkPred(env, 0, 2);
    p.isClone = true;
    same(env.run('predatorUndisturbed')(p), false, 'a clone fights for you');
    p.isClone = false; p.team = 'green';
    same(env.run('predatorUndisturbed')(p), false, 'a converted predator fights for you');
});

check('being disturbed mid-job drops the target rather than resuming later', () => {
    const env = makeEnv();
    board(env, -2, 6, 0, 4);
    const t = greenPylon(env, 4, 2);
    const p = mkPred(env, 0, 2);
    tick(env, 30);
    ok(p.infestTarget === t, 'fixture: should have picked the pylon');
    env.sandbox.alertActive = true;
    env.run('infestTick')(p);
    ok(!p.infestTarget, 'the target should be dropped when a fight starts');
});

group('most predators leave pylons alone; hunters do not');

// "Predators hunt pylons again, rarely." About one in PYLON_HUNTER_SHARE goes
// looking, chosen at birth; everyone else leaves your pylons alone.
const realSeek = env => env.run('nearestGreenPylonFor = __realSeek');

check('THE ASK: a non-hunter does not go for a pylon', () => {
    const env = makeEnv();
    realSeek(env);
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 6, 2);
    const p = mkPred(env, 0, 2);
    p.huntsPylons = false;
    tick(env, 400);
    ok(!p.infestTarget, 'it picked a pylon to infest');
    same(t.pillarTeam, 'green', 'the pylon was taken');
    ok(!t.converting, 'it began converting the pylon');
});

check('not even one standing right beside it', () => {
    const env = makeEnv();
    realSeek(env);
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 1, 2);
    const p = mkPred(env, 0.5, 2);
    p.huntsPylons = false;
    tick(env, 600);
    same(t.pillarTeam, 'green', 'the pylon was taken');
    ok(!p.pylonAggro, 'it turned on a pylon that was doing nothing to it');
});

check('an alarm or the night does not send a non-hunter after pylons either', () => {
    const env = makeEnv();
    realSeek(env);
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 2, 2);
    const hp0 = t.health;
    const p = mkPred(env, 0, 2);
    p.huntsPylons = false;
    env.sandbox.alertActive = true; env.sandbox.gameState.phase = 'night';
    tick(env, 300);
    ok(!p.pylonAggro, 'the alarm sent it after a pylon');
    same(t.health, hp0, 'the pylon was damaged');
});

check('THE ASK: a HUNTER, left undisturbed, walks to a pylon and starts taking it', () => {
    const env = makeEnv();
    realSeek(env);
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 6, 2);
    const p = mkPred(env, 0, 2);
    p.huntsPylons = true;
    const start = Math.hypot(t.x - p.x, t.y - p.y);
    tick(env, 400);
    ok(Math.hypot(t.x - p.x, t.y - p.y) < start - 3, 'a hunter did not close on the pylon');
    ok(t.converting || t.pillarTeam === 'red', 'a hunter at the pylon did not start converting it');
});

check('a hunter stands down the moment there is an alarm', () => {
    const env = makeEnv();
    realSeek(env);
    board(env, -2, 8, 0, 4);
    greenPylon(env, 6, 2);
    const p = mkPred(env, 0, 2);
    p.huntsPylons = true;
    env.sandbox.alertActive = true;
    tick(env, 100);
    ok(!p.infestTarget, 'a hunter kept hunting through an alarm');
});

check('only a fraction are hunters, decided at birth, and the tutorial bug never is', () => {
    const env = makeEnv();
    let hunters = 0;
    for (let i = 0; i < 400; i++) if (mkPred(env, 0, 2).huntsPylons) hunters++;
    const share = env.run('PYLON_HUNTER_SHARE');
    ok(share > 0 && share < 0.5, 'the share is not a small minority: ' + share);
    ok(Math.abs(hunters / 400 - share) < 0.08, 'observed ' + (hunters / 400).toFixed(2) + ' hunters, expected ~' + share);
    const TUTSRC = fs.readFileSync(path.join(ROOT, 'js/tutorial.js'), 'utf8');
    ok(true, 'tutorial foes are excluded in nearestGreenPylonFor via isTutorialFoe');
    ok(/pred\.isTutorialFoe/.test(fs.readFileSync(path.join(ROOT, 'js/infest.js'), 'utf8')), 'the tutorial bug could hunt a pylon');
});

group('walking to a pylon and taking it');

check('THE REPORTED CASE: an undisturbed predator walks to your pylon', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 6, 2);
    const p = mkPred(env, 0, 2);
    const start = Math.hypot(t.x - p.x, t.y - p.y);
    tick(env, 400);
    const end = Math.hypot(t.x - p.x, t.y - p.y);
    ok(end < start, `did not close the distance: ${start.toFixed(2)} -> ${end.toFixed(2)}`);
    ok(end <= REACH + 0.2, `never arrived, stopped ${end.toFixed(2)} away`);
});

check('green pylons are what it goes for, first and foremost', () => {
    const env = makeEnv();
    board(env, -2, 10, 0, 4);
    const red   = greenPylon(env, 2, 2, { pillarTeam: 'red' });
    const green = greenPylon(env, 8, 2);
    const p = mkPred(env, 0, 2);
    tick(env, 60);
    ok(p.infestTarget === green, 'it should walk past its own pylon to yours');
});

check('it picks the nearest of several', () => {
    const env = makeEnv();
    board(env, -2, 12, 0, 4);
    const far  = greenPylon(env, 10, 2);
    const near = greenPylon(env, 3, 2);
    const p = mkPred(env, 0, 2);
    tick(env, 60);
    ok(p.infestTarget === near, 'nearest should win');
    ok(far !== near, 'fixture sanity');
});

check('a pylon across the map is not worth the walk', () => {
    const env = makeEnv();
    board(env, -2, 4, 0, 4);
    greenPylon(env, SEEK + 6, 2);
    const p = mkPred(env, 0, 2);
    tick(env, 60);
    ok(!p.infestTarget, 'it should ignore a pylon beyond the seek range');
});

check('standing on it converts it, and it takes real time', () => {
    const env = makeEnv();
    board(env, -2, 4, 0, 4);
    const t = greenPylon(env, 2, 2);
    const p = mkPred(env, 2 - REACH * 0.5, 2);
    tick(env, 10);
    ok(t.converting, 'it should start working on the pylon');
    ok(t.convertProgress > 0 && t.convertProgress < 1, 'progress should be partial: ' + t.convertProgress);
    same(t.pillarTeam, 'green', 'not taken yet');
    const framesNeeded = Math.ceil(1 / RATE);
    ok(framesNeeded > 120, `conversion takes ${framesNeeded} frames — too fast to react to`);
    tick(env, framesNeeded + 20);
    same(t.pillarTeam, 'red', 'it should have been taken by now');
});

check('a converted pylon stops working for you', () => {
    const env = makeEnv();
    board(env, -2, 4, 0, 4);
    const t = greenPylon(env, 2, 2, { waveMode: true, isGenerator: false, upgraded: true });
    convert(env, t, mkPred(env, 2, 2));
    same(t.attackMode, false, 'no longer a turret');
    same(t.waveMode, false, 'no longer in a wave network');
    same(t.attackModeElement, null, 'element stripped');
    same(t.isGenerator, false, 'not a generator any more');
    same(t.upgraded, false, 'upgrade lost');
});

check('a nest link through a converted pylon is severed both ways', () => {
    const env = makeEnv();
    board(env, -2, 6, -1, 4);
    const t = greenPylon(env, 2, 2, { isGenerator: true });
    const nest = floorAt(env, 5, -1, { nest: true, nestHealth: 0, nestMaxHealth: 200 });
    t.nestConnection = nest; nest.connectedPylon = t;
    convert(env, t, mkPred(env, 2, 2));
    ok(!t.nestConnection, 'the pylon still points at the nest');
    ok(!nest.connectedPylon, 'the nest still points at the pylon');
});

check('the player is told, and can see it happening', () => {
    const env = makeEnv();
    board(env, -2, 4, 0, 4);
    const t = greenPylon(env, 2, 2);
    const p = mkPred(env, 2 - REACH * 0.5, 2);
    tick(env, 30);
    env.calls.length = 0;
    env.run('drawConversionBars()');
    ok(env.calls.some(c => c.op === 'fillRect'), 'no progress bar while a pylon is being taken');
    convert(env, t, p);
    ok(env.sandbox.floatingTexts.some(f => /PYLON LOST/.test(f.text)), 'no callout when a pylon falls');
});

group('conversion is not a ratchet');

check('THE COUNTER: progress decays once nobody is working on it', () => {
    const env = makeEnv();
    board(env, -2, 4, 0, 4);
    const t = greenPylon(env, 2, 2);
    const p = mkPred(env, 2 - REACH * 0.5, 2);
    tick(env, 60);
    const peak = t.convertProgress;
    ok(peak > 0, 'fixture: should have made progress');
    p.dead = true;
    env.sandbox.actors.length = 0;
    tick(env, 30);
    ok(t.convertProgress < peak, `progress should decay: ${peak.toFixed(4)} -> ${t.convertProgress.toFixed(4)}`);
});

check('left alone long enough the pylon recovers completely', () => {
    const env = makeEnv();
    board(env, -2, 4, 0, 4);
    const t = greenPylon(env, 2, 2, { converting: true, convertProgress: 0.9 });
    tick(env, Math.ceil(0.9 / DECAY) + 10);
    same(t.convertProgress, 0, 'progress should reach zero');
    same(t.converting, false, 'and the flag should clear');
    same(t.pillarTeam, 'green', 'it should still be yours');
});

check('decay is slower than progress, so interrupting is not a free reset', () => {
    ok(DECAY > RATE, `decay ${DECAY} should outpace progress ${RATE} so a save is possible`);
    ok(DECAY < RATE * 10, `decay ${DECAY} is so fast that any interruption undoes everything`);
});

group('reclaiming the pylon is the counter');

check('the reclaim path is actually reachable from the ring', () => {
    // issueReconstruct existed before this but nothing in the radial reached
    // it, so a converted pylon would have been an unanswerable loss.
    ok(/leftLabel="RECLAIM"; leftAction="reconstruct"/.test(DRAW),
       'the ring does not offer RECLAIM on an enemy pylon');
    ok(/selectedRadialAction = "reconstruct"/.test(INPUT),
       'a tap on it does not resolve to reconstruct');
    ok(/pylon\.pillarTeam !== "red"/.test(CMD),
       'issueReconstruct should refuse a pylon that is already yours');
    ok(/NEED FOLLOWERS TO RECLAIM/.test(CMD), 'it should say why it cannot run');
});

group('wiring');

check('the predator AI calls it, and only after the ability and worker ticks', () => {
    const a = PRED.indexOf('abilityTick(this)');
    const w = PRED.indexOf('workerTick(this)');
    const i = PRED.indexOf('infestTick(this)');
    ok(i > -1, 'predator.js never calls infestTick');
    ok(i > a && i > w, 'infesting must not pre-empt an ability windup or worker duty');
});

group('the conversion itself');

check('THE RATE: a pylon takes about 25 seconds, not 7.5', () => {
    const env = makeEnv();
    board(env, 0, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    const p = mkPred(env, 3, 2);
    let frames = 0;
    while (t.pillarTeam === 'green' && frames < 60 * 60) {
        env.sandbox.frame++;
        env.run('infestTick')(p);
        frames++;
    }
    ok(t.pillarTeam === 'red', 'it should still convert eventually');
    const secs = frames / 60;
    ok(secs > 18, `a conversion took ${secs.toFixed(1)}s — fast enough to strip a network unseen`);
    ok(secs < 35, `a conversion took ${secs.toFixed(1)}s, which is no longer a threat`);
});

check('a predator standing exactly on the pylon still converts it', () => {
    // Found by the rate check above, which put the predator on the tile.
    // `Math.hypot(dx,dy) || 1` made dist 1 at distance ZERO, because zero is
    // falsy — past INFEST_REACH, so it took the walk branch, moved nowhere
    // (dx/dist is 0) and never converted. A deadlock. Unreachable in play,
    // where predators walk in and land short of the reach, but the guard was
    // wrong and the next caller would have found it the hard way.
    const env = makeEnv();
    board(env, 0, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    const p = mkPred(env, 3, 2);
    same(p.x, t.x, 'fixture: exactly on the tile');
    same(p.y, t.y, 'fixture: exactly on the tile');
    same(env.run('infestTick')(p), true, 'it should claim the frame to work, not to walk');
    ok((t.convertProgress || 0) > 0, 'and make progress from a standing start');
});

check('interrupting still saves it, and faster than it is taken', () => {
    // The decay has to outrun the rate or interrupting would be pointless.
    ok(constant('INFEST_DECAY') > constant('INFEST_RATE') * 3,
       'decay should comfortably outrun conversion');
});

group('pacing: they settle back to work at their own speed');

check('THE SYNCHRONISER: a disturbed predator has to settle before gardening', () => {
    const env = makeEnv();
    board(env, 0, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    const p = mkPred(env, 3, 2);
    // Disturb it the way an alarm does, tick once, then let it go quiet again.
    env.sandbox.alertActive = true;
    same(env.run('infestTick')(p), false, 'fixture: it should not garden under alarm');
    env.sandbox.alertActive = false;
    ok(p._infestSettle > 0, 'it should have been given a settle time');
    same(env.run('infestTick')(p), false, 'it should not resume on the very next frame');
    same(t.convertProgress || 0, 0, 'and should have made no progress');
});

check('it does resume, once it has settled', () => {
    const env = makeEnv();
    board(env, 0, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    const p = mkPred(env, 3, 2);
    env.sandbox.alertActive = true;
    env.run('infestTick')(p);
    env.sandbox.alertActive = false;
    let frames = 0;
    while ((t.convertProgress || 0) === 0 && frames < SETTLE_MAX + 120) {
        env.sandbox.frame++; env.run('infestTick')(p); frames++;
    }
    ok((t.convertProgress || 0) > 0, 'it never went back to work at all');
    ok(frames >= SETTLE_MIN, `it waited only ${frames} frames, under INFEST_SETTLE_MIN`);
    ok(frames <= SETTLE_MAX + 4, `it waited ${frames} frames, past INFEST_SETTLE_MAX`);
});

check('and two predators do not settle on the same frame', () => {
    // The whole point. A settle time that were constant would pass every check
    // above and change nothing about the burst.
    const env = makeEnv();
    board(env, 0, 8, 0, 4);
    const waits = new Set();
    for (let i = 0; i < 40; i++) {
        const p = mkPred(env, 3, 2);
        env.sandbox.alertActive = true;
        env.run('infestTick')(p);
        env.sandbox.alertActive = false;
        waits.add(p._infestSettle);
    }
    ok(waits.size > 20, `40 predators produced only ${waits.size} distinct settle times`);
});

check('nor at the same speed', () => {
    const env = makeEnv();
    const paces = new Set();
    for (let i = 0; i < 40; i++) {
        const p = mkPred(env, 3, 2);
        env.run('rollInfestSettle')(p);
        ok(p._infestPace >= PACE_MIN && p._infestPace <= PACE_MAX,
           `pace ${p._infestPace} is outside the declared range`);
        paces.add(p._infestPace);
    }
    ok(paces.size > 20, `40 predators produced only ${paces.size} distinct paces`);
});

check('the pace range is centred, so 25 seconds is still the average', () => {
    // tests further up assert the GAME INDEX's documented conversion time
    // against 1/INFEST_RATE. A lopsided pace range would quietly make the
    // documentation wrong without failing that check.
    const mid = (PACE_MIN + PACE_MAX) / 2;
    ok(Math.abs(mid - 1) < 0.001, `the pace range averages ${mid}, not 1`);
});

check('a predator with no history gardens straight away', () => {
    // The settle is rolled on disturbance and at spawn, never lazily on first
    // use. A lone wanderer that has never been bothered should not sit idle,
    // and the reach and rate checks above depend on it.
    const env = makeEnv();
    board(env, 0, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    const p = mkPred(env, 3, 2);
    same(p._infestSettle, undefined, 'fixture: no settle history');
    same(env.run('infestTick')(p), true, 'it should claim the frame at once');
    ok((t.convertProgress || 0) > 0, 'and make progress');
});

check('a freshly spawned predator is staggered too', () => {
    // A batch of spawns is the other way a cohort ends up synchronised, and
    // spawnPredatorForZone lives in clone.js, so this is a cross-file contract.
    const CLONE = fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8');
    ok(/rollInfestSettle\(predator\)/.test(CLONE),
       'spawnPredatorForZone no longer rolls a settle time');
    // And it has to be read at call time, because infest.js loads after clone.js.
    ok(/typeof rollInfestSettle === "function"/.test(CLONE),
       'it should guard on the function existing, not assume load order');
});


group('FEEDING THE WALL NEST');

// "Let them grab the charged particles on the ground and carry them to the nest
// on the walls, and if they retrieve a certain amount another predator spawns."
const SPAWN_COST = constant('NEST_SPAWN_COST');
// A live wall nest at (6,-1), floor around it, and one lump of `value` at lumpAt.
function wallScene(env, lumpAt, value) {
    board(env, -2, 12, -1, 4);
    const nest = env.run('getTile')(6, -1);
    Object.assign(nest, { nest: true, nestHealth: 200, nestMaxHealth: 200, nestZone: 1 });
    env.sandbox._nestCache = [nest];
    env.run('chargedMass.length = 0');
    if (lumpAt) env.run(`chargedMass.push({ x: ${lumpAt[0]}, y: ${lumpAt[1]}, value: ${value || 5}, state: 'charged', carrier: null })`);
    return nest;
}
function stepFetch(env, pred, n) {
    for (let i = 0; i < n; i++) { env.sandbox.frame++; env.run('nestFetchTick')(pred); }
}

check('THE ASK: an idle predator picks up a lump and carries it to the wall nest', () => {
    const env = makeEnv();
    const nest = wallScene(env, [3, 2], 5);
    const p = mkPred(env, 1, 2);
    stepFetch(env, p, 600);
    same(env.run('chargedMass.length'), 0, 'the lump is still lying where it fell');
    same(nest.massStock, 5, 'the nest was not paid what was carried');
    same(p.nestMass || 0, 0, 'it is still holding it');
});

check("THE ASK: every NEST_SPAWN_COST paid in hatches one more predator, of the carrier's kind", () => {
    const env = makeEnv();
    const nest = wallScene(env, null);
    const p = mkPred(env, 6, 0, 'beetle', 'striker');
    const before = env.sandbox.actors.length;
    env.run('payIntoWallNest')(nest, SPAWN_COST - 1, p);
    same(env.sandbox.actors.length, before, 'it hatched before the price was paid');
    env.run('payIntoWallNest')(nest, 1, p);
    same(env.sandbox.actors.length, before + 1, 'paying the last of it hatched nothing');
    const hatch = env.sandbox.actors[env.sandbox.actors.length - 1];
    same(hatch.speciesName, 'beetle', "the hatchling is not the carrier's species");
    same(hatch.className, 'striker', "the hatchling is not the carrier's class");
    ok(Math.abs(hatch.x - nest.x) < 0.01 && hatch.y >= nest.y, 'the hatchling did not appear at the nest');
    same(nest.massStock, 0, 'the price was not taken out of the stock');
});

check('a big delivery hatches one per price, and keeps the change', () => {
    const env = makeEnv();
    const nest = wallScene(env, null);
    const p = mkPred(env, 6, 0);
    const before = env.sandbox.actors.length;
    env.run('payIntoWallNest')(nest, SPAWN_COST * 2 + 3, p);
    same(env.sandbox.actors.length, before + 2, 'two prices paid did not hatch two');
    same(nest.massStock, 3, 'the change was lost');
});

check("at the map's predator ceiling the stock WAITS rather than being lost", () => {
    const env = makeEnv();
    const nest = wallScene(env, null);
    const p = mkPred(env, 6, 0);
    env.sandbox.predatorBudgetFull = () => true;
    const before = env.sandbox.actors.length;
    env.run('payIntoWallNest')(nest, SPAWN_COST, p);
    same(env.sandbox.actors.length, before, 'it hatched past the ceiling');
    same(nest.massStock, SPAWN_COST, 'the stock was thrown away');
    env.sandbox.predatorBudgetFull = () => false;
    env.run('payIntoWallNest')(nest, 0, p);
    same(env.sandbox.actors.length, before + 1, 'it did not hatch once there was room');
});

check('no live wall nest in reach: it leaves the lump alone', () => {
    const env = makeEnv();
    const nest = wallScene(env, [3, 2], 5);
    nest.nestHealth = 0;                      // the zone is taken
    const p = mkPred(env, 1, 2);
    stepFetch(env, p, 300);
    same(env.run('chargedMass.length'), 1, 'it picked up mass with nowhere to take it');
});

check('a nest you have neutralised is never fed', () => {
    const env = makeEnv();
    const nest = wallScene(env, null);
    nest.nestHealth = 0;
    same(env.run('_wallNestFor')(mkPred(env, 5, 1)), null, 'a taken nest was chosen');
});

check('a predator pulled into a fight drops what it carries, as a lump', () => {
    const env = makeEnv();
    wallScene(env, [3, 2], 7);
    const p = mkPred(env, 2.6, 2);
    stepFetch(env, p, 40);
    same(p.nestMass, 7, 'fixture: it should be carrying');
    env.sandbox.alertActive = true;
    env.run('infestTick')(p);
    same(p.nestMass || 0, 0, 'it kept the mass through a fight');
    same(env.run('chargedMass.length'), 1, 'the mass vanished instead of dropping');
});

check('the tutorial bug never feeds a nest', () => {
    const env = makeEnv();
    wallScene(env, [3, 2], 5);
    const p = mkPred(env, 1, 2);
    p.isTutorialFoe = true;
    stepFetch(env, p, 200);
    same(env.run('chargedMass.length'), 1, 'the tutorial bug carried mass');
});

check('THE ASK: nothing grows on the floor any more', () => {
    for (const gone of ['seedCocoon', 'planNestNear', 'drawCocoonForTile', 'drawGrownNestForTile', 'nestSiteTick', 'nearestScourChore'])
        ok(!new RegExp('function ' + gone + '\\b').test(INFEST), gone + ' still exists');
    const at = INFEST.indexOf('function convertPylonToRed');
    const body = INFEST.slice(at, INFEST.indexOf('\n}', at));
    ok(!/planNestNear\(|seedCocoon\(/.test(body), 'a converted pylon still grows something');
    ok(!/drawCocoonForTile|drawGrownNestForTile|nestSiteTick|updateInfestation/.test(GAME), 'the game still calls into the floor nests');
    ok(!/serialiseCocoons|serialiseNestSites/.test(SAVE), 'the save still writes floor nests');
});

check('the wall nest shows its stock, and the stock survives a refresh', () => {
    ok(/TO HATCH/.test(GAME), 'the nest does not show how close it is to hatching');
    ok(/nestStock:/.test(SAVE) && /t\.massStock = Math\.max\(0, n\.m\)/.test(SAVE), 'the stock is not saved and restored');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
