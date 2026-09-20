// INFESTATION: what predators do when nobody is fighting them.
//
// Left undisturbed a predator walks to the nearest pylon you hold, converts it
// to its own side, then seeds a nest and a mould that creeps outward and
// hatches more of the same species. A mould reaching a second pylon takes that
// one too.
//
// The load-bearing parts are the guards, not the growth: "undisturbed" has to
// mean undisturbed, conversion must not be a ratchet the player cannot undo,
// and reclaiming the pylon has to actually clear everything anchored to it —
// otherwise the mechanic is a one-way loss with no counter.
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
const GROW_FRAMES = constant('MOULD_GROW_FRAMES');
const SPAWN_FRAMES= constant('MOULD_SPAWN_FRAMES');
const MAX_TILES   = constant('MOULD_MAX_TILES');
const SPAWN_CAP   = constant('MOULD_SPAWN_CAP');

function makeEnv() {
    const calls = [];
    const gctx = new Proxy({}, {
        get(t, k) {
            if (k === 'canvas') return { width: 800, height: 600 };
            return (...a) => { calls.push({ op: k, args: a }); };
        },
        set() { return true; },
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
        PYLON_AGGRO_EXPOSURE: 45, PYLON_AGGRO_TRAP_RATE: 3,
        PYLON_BASH_COOLDOWN: 45, PYLON_AGGRO_GIVE_UP: 9,
        applyDamage(t, amt) { if (t) { t.health = Math.max(0, (t.health ?? 100) - amt); if (t.health <= 0) t.dead = true; } },
        applyElementalDamage() {}, hurtPlayer: () => false,
        findNearestFriendlyPillar: () => null, spawnFollowerProjectile() {},
        getZoneIndex: x => Math.floor(x / 15),
    };
    sandbox.getTile = (gx, gy) => sandbox.worldTileMap.get(`${gx},${gy}`);
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    for (const f of ['js/species.js', 'js/abilities.js', 'js/infest.js', 'js/predator.js']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
    }
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
// A board of clear floor with nothing on it, so mould has somewhere to creep.
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
        env.run('updateInfestation()');
        if (fn) fn(i);
    }
}
// Straight to a converted pylon, without simulating the walk each time.
function convert(env, t, pred) {
    env.run('convertPylonToRed')(t, pred);
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

group('the nest and the mould');

check('THE REPORTED CASE: a nest grows beside the converted pylon', () => {
    const env = makeEnv();
    board(env, -2, 6, -1, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    const nests = env.sandbox.world.filter(x => x.nest && x.nestHealth > 0);
    same(nests.length, 1, 'exactly one nest should have grown');
    ok(Math.hypot(nests[0].x - t.x, nests[0].y - t.y) <= 2, 'it should be beside the pylon');
    ok(nests[0]._infestNest, 'it should be marked as grown rather than generated');
});

check('a pylon next to an existing nest does not grow a second one', () => {
    const env = makeEnv();
    board(env, -2, 6, -1, 4);
    floorAt(env, 4, -1, { nest: true, nestHealth: 200, nestMaxHealth: 200 });
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    same(env.sandbox.world.filter(x => x.nest && x.nestHealth > 0).length, 1, 'should reuse the nest in reach');
});

check('THE REPORTED CASE: a mould grows around it', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    const m = env.run('moulds')[0];
    ok(m, 'no mould seeded');
    same(m.tiles.length, 1, 'it starts as one patch under the pylon');
    tick(env, GROW_FRAMES * 4 + 5);
    ok(env.run('moulds')[0].tiles.length > 1, 'the mould never crept outward');
});

check('it stops creeping rather than eating the map', () => {
    const env = makeEnv();
    board(env, -6, 12, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    tick(env, GROW_FRAMES * (MAX_TILES + 12));
    const m = env.run('moulds')[0];
    ok(m.tiles.length <= MAX_TILES, `grew to ${m.tiles.length} tiles, cap is ${MAX_TILES}`);
});

check('THE REPORTED CASE: a mould reaching another pylon takes that one too', () => {
    const env = makeEnv();
    board(env, -2, 10, 0, 4);
    const first  = greenPylon(env, 3, 2);
    const second = greenPylon(env, 5, 2);   // within the patch's reach
    convert(env, first, mkPred(env, 3, 2, 'beetle', 'striker'));
    tick(env, GROW_FRAMES * (MAX_TILES + 4));
    same(second.pillarTeam, 'red', 'the second pylon should have been absorbed');
    const m = env.run('moulds')[0];
    ok(m.anchors.includes(first) && m.anchors.includes(second),
       'one patch should hold both pylons');
});

check('a mould only creeps onto real floor', () => {
    const env = makeEnv();
    // Floor only along y=2; everything else absent, so the patch is hemmed in.
    for (let x = 0; x <= 8; x++) floorAt(env, x, 2);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    tick(env, GROW_FRAMES * (MAX_TILES + 6));
    const m = env.run('moulds')[0];
    for (const [mx, my] of m.tiles) {
        same(my, 2, `mould at ${mx},${my} is off the floor strip`);
        ok(env.sandbox.getTile(mx, my), 'mould on a tile that does not exist');
    }
});

group('hatching new predators');

check('THE REPORTED CASE: the mould spawns more of that class', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    const p = mkPred(env, 3, 2, 'beetle', 'tank');
    convert(env, t, p);
    const before = env.sandbox.actors.length;
    tick(env, SPAWN_FRAMES + 5);
    const after = env.sandbox.actors.filter(a => a.fromMould);
    same(after.length, 1, `expected one hatch, actors went ${before} -> ${env.sandbox.actors.length}`);
    same(after[0].speciesName, 'beetle', 'it should be the same species that grew it');
    same(after[0].className, 'tank', 'and the same class');
});

check('a hatched predator starts on the board, alive and wandering', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2, 'spider', 'scout'));
    tick(env, SPAWN_FRAMES + 5);
    const spawn = env.sandbox.actors.find(a => a.fromMould);
    ok(spawn, 'nothing hatched');
    same(spawn.dead, false, 'it should be alive');
    same(spawn.state, 'wander', 'it should start undisturbed, not mid-hunt');
    same(spawn.entryDelay, 0, 'it is already here — no crawl-in delay');
    ok(env.run('moulds')[0].tiles.some(([mx, my]) => mx === Math.round(spawn.x) && my === Math.round(spawn.y)) ||
       Math.hypot(spawn.x - t.x, spawn.y - t.y) < 5, 'it should hatch on the patch');
});

check('a patch will not flood the map with spawns', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    tick(env, SPAWN_FRAMES * (SPAWN_CAP + 4));
    const live = env.sandbox.actors.filter(a => a.fromMould && !a.dead);
    ok(live.length <= SPAWN_CAP, `${live.length} live spawns, cap is ${SPAWN_CAP}`);
});

check('killing its spawns frees the patch to hatch again', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    tick(env, SPAWN_FRAMES * (SPAWN_CAP + 2));
    let live = env.sandbox.actors.filter(a => a.fromMould && !a.dead);
    same(live.length, SPAWN_CAP, 'fixture: should be at the cap');
    live.forEach(a => { a.dead = true; });
    tick(env, SPAWN_FRAMES + 5);
    ok(env.sandbox.actors.filter(a => a.fromMould && !a.dead).length > 0, 'it should hatch again');
});

check('hatching is slow enough to be answerable', () => {
    const secs = SPAWN_FRAMES / 60;
    ok(secs >= 8, `one spawn every ${secs}s is too fast to fight`);
});

group('reclaiming the pylon is the counter');

check('THE COUNTER: taking the pylon back kills its mould and nest', () => {
    const env = makeEnv();
    board(env, -2, 8, -1, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    tick(env, GROW_FRAMES * 3);
    ok(env.run('moulds').length === 1, 'fixture: should have a mould');
    const nest = env.sandbox.world.find(x => x._infestNest);
    ok(nest && nest.nestHealth > 0, 'fixture: should have a nest');

    // What the reconstruction completion in game.js does.
    t.pillarTeam = 'green';
    env.run('clearInfestationAt')(t);
    same(env.run('moulds').length, 0, 'the mould should die with the pylon');
    same(nest.nestHealth, 0, 'the grown nest should go too');
    same(nest.nest, false, 'and stop being a nest at all');
});

check('a patch holding two pylons survives losing one of them', () => {
    const env = makeEnv();
    board(env, -2, 10, 0, 4);
    const a = greenPylon(env, 3, 2);
    const b = greenPylon(env, 5, 2);
    convert(env, a, mkPred(env, 3, 2));
    tick(env, GROW_FRAMES * (MAX_TILES + 4));
    const m = env.run('moulds')[0];
    ok(m.anchors.length >= 2, 'fixture: should hold both pylons');
    a.pillarTeam = 'green';
    env.run('clearInfestationAt')(a);
    same(env.run('moulds').length, 1, 'it should still be held up by the other pylon');
    b.pillarTeam = 'green';
    env.run('clearInfestationAt')(b);
    same(env.run('moulds').length, 0, 'losing the last anchor should kill it');
});

check('a mould whose pylons are all destroyed dies on its own', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    t.destroyed = true;
    tick(env, 5);
    same(env.run('moulds').length, 0, 'wreckage should not keep a mould alive');
});

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

check('reclaiming is wired into the reconstruction completion', () => {
    const at = GAME.indexOf('COMPLETE RECONSTRUCTION');
    ok(at > -1, 'could not find the reconstruction block');
    ok(/clearInfestationAt\(t\)/.test(GAME.slice(at, at + 700)),
       'finishing a reconstruction does not clear the infestation');
});

group('wiring');

check('the predator AI calls it, and only after the ability and worker ticks', () => {
    const a = PRED.indexOf('abilityTick(this)');
    const w = PRED.indexOf('workerTick(this)');
    const i = PRED.indexOf('infestTick(this)');
    ok(i > -1, 'predator.js never calls infestTick');
    ok(i > a && i > w, 'infesting must not pre-empt an ability windup or worker duty');
});

check('the game loop updates and draws it', () => {
    ok(/updateInfestation\(\);/.test(GAME), 'never updated');
    ok(/drawMoulds\(\);/.test(GAME), 'never drawn');
    ok(/drawConversionBars\(\);/.test(GAME), 'the progress bar is never drawn');
    // Mould is on the floor, so it must go under the interface and under the
    // generator filaments.
    ok(GAME.indexOf('drawMoulds();') < GAME.indexOf('drawGeneratorLinks();'), 'mould should draw under the links');
    ok(GAME.indexOf('drawMoulds();') < GAME.indexOf('drawRadialMenu();'), 'mould should draw under the interface');
    for (const fn of ['drawMoulds', 'drawConversionBars', 'updateInfestation']) {
        same((GAME.match(new RegExp('^\\s*' + fn + '\\(\\);', 'gm')) || []).length, 1, fn + ' called more than once');
    }
});

check('it survives a refresh', () => {
    ok(/moulds: serialiseMoulds\(\)/.test(SAVE), 'moulds are not saved');
    ok(/restoreMoulds\(sess\.moulds\)/.test(SAVE), 'moulds are not restored');
    ok(SAVE.indexOf('restoreMoulds') > SAVE.indexOf('if (pylon && pylon.pillar)'),
       'restore must run after the pylon restore, or anchors cannot resolve');
});

check('a save round-trips a patch, and junk does not throw', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2, 'moth', 'scout'));
    tick(env, GROW_FRAMES * 3);
    const before = env.run('moulds')[0];
    const blob = JSON.parse(JSON.stringify(env.run('serialiseMoulds()')));
    env.run('restoreMoulds')(blob);
    const after = env.run('moulds')[0];
    ok(after, 'the patch did not come back');
    same(after.tiles.length, before.tiles.length, 'tile count');
    same(after.species, 'moth', 'species');
    same(after.className, 'scout', 'class');
    ok(after.anchors.includes(t), 'the anchor should resolve back to the real tile');
    env.run('restoreMoulds')(null);
    env.run('restoreMoulds')([{ }, null, { tiles: 'nonsense' }]);
    same(env.run('moulds').length, 0, 'junk should restore to nothing rather than throwing');
});

check('a patch whose anchors no longer exist is not restored', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    env.run('restoreMoulds')([{ x: 3, y: 2, tiles: [[3, 2]], anchors: [[99, 99]],
                                species: 'ant', className: 'scout' }]);
    same(env.run('moulds').length, 0, 'a mould with no surviving pylon should be dropped');
});

check('a change of scene clears it', () => {
    ok(/moulds\.length = 0;/.test(WAVES), 'moulds survive a reset or a new wave');
    ok(/t\.converting\) \{ t\.converting = false; t\.convertProgress = 0; \}/.test(WAVES),
       'half-finished conversions survive a change of scene');
});

check('nothing is drawn when there is no infestation', () => {
    const env = makeEnv();
    board(env, -2, 4, 0, 4);
    env.calls.length = 0;
    env.run('drawMoulds()');
    env.run('drawConversionBars()');
    same(env.calls.length, 0, 'drew something with no mould and no conversion');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
