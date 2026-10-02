// INFESTATION: what predators do when nobody is fighting them.
//
// Left undisturbed a predator walks to the nearest pylon you hold, converts it
// to its own side, then seeds a nest and a cocoon spun over it. The cocoon
// swells to a small square and hatches more of the same species; a pylon that
// ends up inside it is taken too.
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
const SPAWN_FRAMES= constant('COCOON_SPAWN_FRAMES');
const SPAN_MIN    = constant('COCOON_SPAN_MIN');
const SPAN_MAX    = constant('COCOON_SPAN_MAX');
const SWELL       = constant('COCOON_SWELL_FRAMES');
const SPAWN_CAP   = constant('COCOON_SPAWN_CAP');
const TOXIN_SPECIES = JSON.parse(
    INFEST.match(/const COCOON_TOXIN_SPECIES\s*=\s*(\[[^\]]*\])/)[1].replace(/'/g, '"'));
const PUDDLE_INTERVAL = constant('COCOON_PUDDLE_INTERVAL');
const PUDDLE_DAMAGE   = constant('COCOON_PUDDLE_DAMAGE');
const PUDDLE_COLOUR   = INFEST.match(/const COCOON_PUDDLE_COLOUR\s*=\s*"([^"]+)"/)[1];
const NEST_COOLDOWN   = constant('NEST_GROW_COOLDOWN');
const SETTLE_MIN      = constant('INFEST_SETTLE_MIN');
const SETTLE_MAX      = constant('INFEST_SETTLE_MAX');
const PACE_MIN        = constant('INFEST_PACE_MIN');
const PACE_MAX        = constant('INFEST_PACE_MAX');
// Half a tile is 30px; a sac should not reach much past one tile either side.
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
// A board of clear floor with nothing on it, so a cocoon has room to swell.
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
// The same, with the world-wide nest cooldown already spent — for the checks
// that are about the per-zone CAP rather than the pacing. Without this a cap
// check passes because the cooldown swallowed the second nest, which means it
// would keep passing with the cap deleted.
function convertPaced(env, t, pred) {
    env.sandbox.frame += NEST_COOLDOWN;
    env.run('convertPylonToRed')(t, pred);
}
// Drive the per-tile draw the way the depth-sorted pass in game.js does: the
// cocoon and the grown nest are no longer flat overlays, so they are called
// with a tile and that tile's screen position.
function drawTile(env, t) {
    const px = (t.x - env.sandbox.player.visualX - (t.y - env.sandbox.player.visualY)) * 60 + 400;
    const py = (t.x - env.sandbox.player.visualX + (t.y - env.sandbox.player.visualY)) * 30 + 300;
    env.run('drawCocoonForTile')(t, px, py);
    env.run('drawGrownNestForTile')(t, px, py);
}
// Every cocoon and grown nest on the board, in tile order.
function drawAll(env) {
    for (const t of env.sandbox.world) drawTile(env, t);
}

// A predator-shaped object that is NOT in actors[]. The shape tests need a
// converted pylon without a live predator on the board, which would otherwise
// walk off and convert whatever else the test had placed.
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

group('the nest and the cocoon');

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

check('THE REPORTED CASE: the nest lands below the pylon, never above it', () => {
    // Depth in this projection is x+y: a bigger sum draws lower and in front.
    // The nest used to prefer (x, y-1), a SMALLER sum, so it appeared a row
    // above the pylon it belongs to.
    const env = makeEnv();
    board(env, -4, 10, -1, 5);
    const t = greenPylon(env, 3, 2);
    convert(env, t, spinner());
    const nest = env.sandbox.world.find(x => x._infestNest);
    ok(nest, 'no nest grew');
    ok(nest.x + nest.y > t.x + t.y,
       `nest at ${nest.x},${nest.y} (depth ${nest.x + nest.y}) is not in front of the ` +
       `pylon at ${t.x},${t.y} (depth ${t.x + t.y})`);
});

check('it will settle for beside, and only goes above as a last resort', () => {
    // Fence the pylon in so the tiles in front are unavailable.
    const env = makeEnv();
    for (const [x, y] of [[3, 2], [4, 3], [3, 3], [4, 2], [2, 3], [4, 1], [2, 2], [3, 1]]) {
        floorAt(env, x, y);
    }
    const t = env.sandbox.worldTileMap.get('3,2');
    Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'green',
                       health: 80, maxHealth: 80, attackMode: true });
    env.sandbox._pillarCache.push(t);
    // Occupy everything at depth >= the pylon's, leaving only tiles above it.
    for (const k of ['4,3', '3,3', '4,2', '2,3', '4,1']) {
        env.sandbox.worldTileMap.get(k).nodeType = 'blocked';
    }
    convert(env, t, spinner());
    const nest = env.sandbox.world.find(x => x._infestNest);
    ok(nest, 'it should still find somewhere');
    ok(nest.x + nest.y < t.x + t.y, 'with nowhere else it may go above');
});

check('a pylon next to an existing nest does not grow a second one', () => {
    const env = makeEnv();
    board(env, -2, 6, -1, 4);
    floorAt(env, 4, -1, { nest: true, nestHealth: 200, nestMaxHealth: 200 });
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    same(env.sandbox.world.filter(x => x.nest && x.nestHealth > 0).length, 1, 'should reuse the nest in reach');
});

check('THE REPORTED CASE: a grown nest is a dome, not a wall honeycomb', () => {
    // The zone nests sit at y=-1 against the wall, and their renderer projects
    // a honeycomb onto that wall face. A nest GROWN on open floor has no wall
    // behind it, so that projection painted a flat rug on the ground.
    ok(/obj\.nest && obj\.nestHealth > 0 && !obj\._infestNest/.test(GAME),
       'the wall honeycomb still draws for grown nests');
    ok(/obj\.nest && obj\.nestHealth <= 0 && !obj\._infestNest/.test(GAME),
       'the broken-nest wreckage makes the same wall assumption');
    ok(/function drawGrownNestForTile/.test(INFEST), 'grown nests have no drawing of their own');
});

check('a grown nest actually draws, and stops when it is gone', () => {
    const env = makeEnv();
    board(env, -4, 10, -1, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, spinner());
    const nest = env.sandbox.world.find(x => x._infestNest);
    ok(nest && nest.nestHealth > 0, 'fixture: a nest should have grown');
    env.calls.length = 0;
    drawAll(env);
    // A ziggurat is drawn with paths, not ellipses — the shape changed from a
    // dome, so this asserts that something was filled rather than which
    // primitive was used.
    ok(env.calls.some(c => c.op === 'fill'), 'nothing drawn for a grown nest');
    nest.nestHealth = 0;
    env.calls.length = 0;
    // Only the nest here — drawAll would also draw the cocoon on its own tile.
    drawTile(env, nest);
    same(env.calls.length, 0, 'a dead grown nest should draw nothing');
});

check('THE REPORTED CASE: it is geometric, not round', () => {
    // These are computer bugs on a circuit board. Every earlier pass was
    // organic — a mould carpet, a smooth dome, a tapered bezier sac — or
    // monumental. The cocoon is an encapsulated component now, and the rule
    // that encodes that is: straight lines only.
    ok(/function _drawCocoonSac/.test(INFEST), 'no cocoon drawing');
    ok(!/function _drawZiggurat/.test(INFEST), 'the stepped pyramid is still there');
    ok(!/function _drawDome/.test(INFEST), 'the dome is still there');
    const at = INFEST.indexOf('function _drawCocoonSac');
    const body = INFEST.slice(at, INFEST.indexOf('function _infestToScreen'));
    ok(!/bezierCurveTo|quadraticCurveTo/.test(body), 'a curve survives in the cocoon');
    ok(!/ctx\.arc\b|ctx\.ellipse/.test(body), 'something round survives in the cocoon');
    const layer = INFEST.slice(INFEST.indexOf('function drawCocoons'));
    ok(!/ctx\.arc\b|ctx\.ellipse|bezierCurveTo/.test(layer.slice(0, layer.indexOf('function drawConversionBars'))),
       'something round survives elsewhere in the cocoon layer');
    // ...and the board motifs that make it read as a component.
    ok(/trace/i.test(body), 'no circuit traces across the lid');
    ok(/pad/i.test(body), 'no solder pads');
    ok(/pins/i.test(body), 'no pins out to the board');
    same((INFEST.match(/_drawCocoonSac\(/g) || []).length, 3,
         'expected the definition plus two call sites');
});

check('nothing round is drawn for a cocoon at all', () => {
    // Driven, not read: the whole cocoon layer must emit no arcs or ellipses.
    // The toxin pool is the one exception and is drawn separately below.
    const env = makeEnv();
    board(env, -4, 10, 0, 4);
    const t = greenPylon(env, 0, 2);
    // A venomous one, so the toxin patch is included — it has to be angular
    // too. Nothing round on a circuit board.
    convert(env, t, spinner('spider', 'striker'));
    ok(env.run('cocoons')[0].puddles.length > 0, 'fixture: should carry the toxin');
    env.calls.length = 0;
    drawAll(env);
    const round = env.calls.filter(c => c.op === 'arc' || c.op === 'ellipse');
    same(round.length, 0, `the cocoon emitted ${round.length} round primitives`);
    ok(env.calls.some(c => c.op === 'lineTo'), 'fixture: it should have drawn something');
});

check('a grown nest is geometric too', () => {
    const env = makeEnv();
    board(env, -4, 10, -1, 4);
    const t = greenPylon(env, 0, 2);
    convert(env, t, spinner('ant', 'scout'));
    ok(env.sandbox.world.some(x => x._infestNest), 'fixture: a nest should have grown');
    env.calls.length = 0;
    drawAll(env);
    const round = env.calls.filter(c => c.op === 'arc' || c.op === 'ellipse');
    same(round.length, 0, `the grown nest emitted ${round.length} round primitives`);
    ok(env.calls.some(c => c.op === 'fill'), 'nothing drawn for a grown nest');
});

// Every coordinate the drawing emits, so its real extent can be measured
// rather than assumed.
function drawnExtent(env, fn) {
    return drawnExtentOf(env, () => env.run(fn));
}
function drawnExtentOf(env, run) {
    env.calls.length = 0;
    run();
    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const c of env.calls) {
        if (!['moveTo', 'lineTo', 'ellipse', 'bezierCurveTo', 'arc'].includes(c.op)) continue;
        // x,y are the first two args for every one of these.
        const pts = c.op === 'bezierCurveTo'
            ? [[c.args[0], c.args[1]], [c.args[2], c.args[3]], [c.args[4], c.args[5]]]
            : [[c.args[0], c.args[1]]];
        for (const [x, y] of pts) {
            if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
            minX = Math.min(minX, x); maxX = Math.max(maxX, x);
            minY = Math.min(minY, y); maxY = Math.max(maxY, y);
        }
        // An ellipse carries its radii, which extend past its centre.
        if (c.op === 'ellipse') {
            minX = Math.min(minX, c.args[0] - c.args[2]); maxX = Math.max(maxX, c.args[0] + c.args[2]);
            minY = Math.min(minY, c.args[1] - c.args[3]); maxY = Math.max(maxY, c.args[1] + c.args[3]);
        }
    }
    return { minX, maxX, minY, maxY };
}

check('THE REPORTED CASE: it is small enough not to stand in front of things', () => {
    // The pyramid rose ~66px over a 3x3 and hid whatever walked behind it.
    // A predator sprite is drawn roughly 44px tall, so the sac has to stay
    // well under that to leave one visible.
    //
    // The sac body is measured on its own. drawCocoons also runs hairline
    // threads out to the footprint tiles, which legitimately reach a tile
    // away; those cannot hide anything and would otherwise dominate this.
    const env = makeEnv();
    const GY = 330;
    const biggest = `_drawCocoonSac(400, ${GY}, COCOON_SAC_W + ${SPAN_MAX - SPAN_MIN} * 3, ` +
                    `COCOON_SAC_H + ${SPAN_MAX - SPAN_MIN} * 2, "#cc2244", 1, 3)`;
    const e = drawnExtent(env, biggest);
    const height = GY - e.minY;
    ok(height < 30, `the sac stands ${height.toFixed(0)}px tall — too tall to see past`);
    const halfW = Math.max(e.maxX - 400, 400 - e.minX);
    ok(halfW < TILE_W_HALF_LIMIT, `the sac reaches ${halfW.toFixed(0)}px either side of its tile`);
});

check('the threads it runs to the footprint cannot hide anything', () => {
    // They reach a tile out by design, so what matters is that they are
    // hairlines rather than anything with area.
    const env = makeEnv();
    board(env, -4, 10, 0, 4);
    const t = greenPylon(env, 0, 2);
    convert(env, t, spinner('spider', 'striker'));
    env.calls.length = 0;
    drawAll(env);
    const widths = env.calls.filter(c => c.op === 'set:lineWidth').map(c => c.args[0]);
    ok(widths.length > 0, 'nothing sets a line width');
    ok(widths.every(w => w <= 1.5), `a thread is ${Math.max(...widths)}px thick`);
    const alphas = env.calls.filter(c => c.op === 'set:globalAlpha').map(c => c.args[0]);
    ok(Math.min(...alphas) < 0.2, 'the threads should be drawn faintly');
});

check('it barely grows with the footprint', () => {
    // Scaling the drawing with the mechanical extent is what produced
    // something big enough to hide behind. Measured through drawCocoons, so
    // the call site is under test and not just the helper — with the footprint
    // pinned to the anchor tile so the threads do not skew the extent.
    const env = makeEnv();
    board(env, -4, 10, 0, 4);
    const t = greenPylon(env, 0, 2);
    convert(env, t, spinner('spider', 'striker'));
    const m = env.run('cocoons')[0];
    const measure = span => {
        m.span = span;
        m.tiles = [[m.x, m.y]];      // no threads, so this is the sac alone
        m.puddles = [];
        m.pulse = 0;
        const e = drawnExtentOf(env, () => drawTile(env, t));
        return { w: e.maxX - e.minX, h: e.maxY - e.minY };
    };
    const a = measure(SPAN_MIN), b = measure(SPAN_MAX);
    ok(b.w > a.w, 'a bigger span should read slightly bigger');
    const grow = b.w - a.w;
    ok(grow < 12, `span ${SPAN_MIN} to ${SPAN_MAX} widened the sac by ${grow.toFixed(0)}px — too much`);
    ok(b.h - a.h < 10, `and heightened it by ${(b.h - a.h).toFixed(0)}px — too much`);
    ok(b.h < 34, `the widest sac is ${b.h.toFixed(0)}px tall overall`);
});

check('it sits on the deck rather than floating', () => {
    const env = makeEnv();
    const e = drawnExtent(env, '_drawCocoonSac(400, 330, COCOON_SAC_W, COCOON_SAC_H, "#cc2244", 0.5, 3)');
    ok(e.maxY >= 330 - 1, `the sac's lowest point is ${e.maxY.toFixed(0)}, above the ground at 330`);
    ok(e.maxY <= 330 + 8, 'it should not sink through the deck either');
});

check('the footprint is threaded, not filled', () => {
    // The extent is communicated with hairlines out to the tiles; a fill
    // across them is the carpet coming back.
    const at = INFEST.indexOf('Hairline anchor threads');
    ok(at > -1, 'no anchor threads — the footprint extent is invisible');
    const block = INFEST.slice(at, at + 600);
    ok(/ctx\.stroke\(\)/.test(block), 'the threads should be stroked');
    ok(!/ctx\.fill\(\)/.test(block), 'the footprint tiles must not be filled');
});

check('nothing is painted flat on the floor under a cocoon', () => {
    // The floor wash under the dome was what read as a carpet. The dome's own
    // base half-ellipse stays; a full ground ellipse in the species colour
    // does not.
    const at = INFEST.indexOf('function drawCocoons');
    const body = INFEST.slice(at, at + 2600);
    ok(!/Silk floor/.test(body), 'the silk floor wash is back');
    ok(!/ctx\.ellipse\(sx, sy, rw, rh, 0, 0, Math\.PI \* 2\)/.test(body),
       'a full ground ellipse is being filled under the dome');
});

check('THE REPORTED CASE: a cocoon encapsulates a small square', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, spinner());
    const m = env.run('cocoons')[0];
    ok(m, 'no cocoon spun');
    same(m.span, SPAN_MIN, `it should start as a ${SPAN_MIN}x${SPAN_MIN}`);
    same(m.tiles.length, SPAN_MIN * SPAN_MIN, 'the footprint should be the full square');
    ok(m.tiles.some(([tx, ty]) => tx === t.x && ty === t.y), 'the pylon must be inside it');
});

check('it swells once and then stops', () => {
    const env = makeEnv();
    board(env, -4, 10, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, spinner());
    tick(env, SWELL + 5);
    same(env.run('cocoons')[0].span, SPAN_MAX, `it should have widened to ${SPAN_MAX}`);
    // And then hold there however long it is left.
    tick(env, SWELL * 6);
    const m = env.run('cocoons')[0];
    same(m.span, SPAN_MAX, 'it kept growing past its span');
    ok(m.tiles.length <= SPAN_MAX * SPAN_MAX, `footprint is ${m.tiles.length} tiles`);
});

check('the footprint is a contiguous square, not a scatter', () => {
    const env = makeEnv();
    board(env, -4, 10, 0, 4);
    const t = greenPylon(env, 4, 2);
    convert(env, t, spinner());
    tick(env, SWELL + 5);
    const m = env.run('cocoons')[0];
    const xs = m.tiles.map(([x]) => x), ys = m.tiles.map(([, y]) => y);
    same(Math.max(...xs) - Math.min(...xs) + 1, SPAN_MAX, 'width should be the span');
    same(Math.max(...ys) - Math.min(...ys) + 1, SPAN_MAX, 'height should be the span');
});

check('THE REPORTED CASE: swelling brings a neighbouring pylon inside the shell', () => {
    const env = makeEnv();
    board(env, -2, 10, 0, 4);
    const first  = greenPylon(env, 3, 2);
    const second = greenPylon(env, 4, 2);   // adjacent, so a 3x3 covers it
    convert(env, first, spinner('beetle', 'striker'));
    tick(env, SWELL + 5);
    same(second.pillarTeam, 'red', 'the neighbour should have been taken');
    const m = env.run('cocoons')[0];
    ok(m.anchors.includes(first) && m.anchors.includes(second),
       'one cocoon should hold both pylons');
    same(env.run('cocoons').length, 1, 'and it should still be a single cocoon');
});

check('a pylon outside the square is left alone', () => {
    const env = makeEnv();
    board(env, -2, 12, 0, 4);
    const inside  = greenPylon(env, 3, 2);
    const outside = greenPylon(env, 8, 2);   // well clear of a 3x3
    convert(env, inside, spinner());
    tick(env, SWELL * 3);
    same(outside.pillarTeam, 'green', 'a pylon beyond the shell should not be converted');
});

check('the footprint only covers real floor', () => {
    const env = makeEnv();
    // A single strip of floor, so a square would otherwise hang off the deck.
    for (let x = 0; x <= 8; x++) floorAt(env, x, 2);
    const t = greenPylon(env, 3, 2);
    convert(env, t, spinner());
    tick(env, SWELL + 5);
    const m = env.run('cocoons')[0];
    for (const [mx, my] of m.tiles) {
        same(my, 2, `cocoon tile ${mx},${my} is off the floor strip`);
        ok(env.sandbox.getTile(mx, my), 'cocoon on a tile that does not exist');
    }
});

check('two cocoons do not claim the same tile', () => {
    const env = makeEnv();
    board(env, -2, 14, 0, 4);
    const a = greenPylon(env, 3, 2);
    const b = greenPylon(env, 6, 2);   // far enough apart to spin separately
    convert(env, a, spinner());
    convert(env, b, spinner());
    tick(env, SWELL * 3);
    const all = env.run('cocoons');
    const seen = new Set();
    for (const m of all) for (const [tx, ty] of m.tiles) {
        const k = `${tx},${ty}`;
        ok(!seen.has(k), `tile ${k} is claimed by two cocoons`);
        seen.add(k);
    }
});

group('hatching new predators');

check('THE REPORTED CASE: the cocoon spawns more of that class', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    const p = mkPred(env, 3, 2, 'beetle', 'tank');
    convert(env, t, p);
    const before = env.sandbox.actors.length;
    tick(env, SPAWN_FRAMES + 5);
    const after = env.sandbox.actors.filter(a => a.fromCocoon);
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
    const spawn = env.sandbox.actors.find(a => a.fromCocoon);
    ok(spawn, 'nothing hatched');
    same(spawn.dead, false, 'it should be alive');
    same(spawn.state, 'wander', 'it should start undisturbed, not mid-hunt');
    same(spawn.entryDelay, 0, 'it is already here — no crawl-in delay');
    ok(env.run('cocoons')[0].tiles.some(([mx, my]) => mx === Math.round(spawn.x) && my === Math.round(spawn.y)) ||
       Math.hypot(spawn.x - t.x, spawn.y - t.y) < 5, 'it should hatch on the patch');
});

check('a patch will not flood the map with spawns', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    tick(env, SPAWN_FRAMES * (SPAWN_CAP + 4));
    const live = env.sandbox.actors.filter(a => a.fromCocoon && !a.dead);
    ok(live.length <= SPAWN_CAP, `${live.length} live spawns, cap is ${SPAWN_CAP}`);
});

check('killing its spawns frees the patch to hatch again', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    tick(env, SPAWN_FRAMES * (SPAWN_CAP + 2));
    let live = env.sandbox.actors.filter(a => a.fromCocoon && !a.dead);
    same(live.length, SPAWN_CAP, 'fixture: should be at the cap');
    live.forEach(a => { a.dead = true; });
    tick(env, SPAWN_FRAMES + 5);
    ok(env.sandbox.actors.filter(a => a.fromCocoon && !a.dead).length > 0, 'it should hatch again');
});

check('hatching is slow enough to be answerable', () => {
    const secs = SPAWN_FRAMES / 60;
    ok(secs >= 8, `one spawn every ${secs}s is too fast to fight`);
});

group('toxic puddles');

// A follower, a not-yet-recruited neutral, a predator and a clone — the four
// kinds of thing that can stand on a puddle.
// Element matters now: FIRE followers scour this stuff for a living and the
// toxin does not touch them, so the hazard fixture is deliberately NOT fire.
function follower(env, x, y, element) {
    const f = { x, y, type: 'virus', team: 'green', isFollower: true, dead: false,
                health: 40, maxHealth: 40, element: element || 'ice' };
    env.sandbox.actors.push(f); return f;
}
function neutral(env, x, y) {
    const n = { x, y, type: 'virus', team: 'red', isNeutralRecruit: true, dead: false,
                health: 40, maxHealth: 40 };
    env.sandbox.actors.push(n); return n;
}
// A cocoon spun by a venomous species, so the toxin tile is placed by the real
// rule rather than faked. An earlier version pushed a tile outside the
// footprint, which the restore now (correctly) rejects.
function puddleAt(env) {
    board(env, -4, 10, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, spinner('spider', 'striker'));
    const m = env.run('cocoons')[0];
    ok(m.puddles.length === 1, 'fixture: a spider cocoon should leave one toxin tile');
    return { m, t, tile: m.puddles[0], px: m.puddles[0][0], py: m.puddles[0][1] };
}

check('THE REPORTED CASE: a puddle burns a follower standing in it', () => {
    const env = makeEnv();
    const P = puddleAt(env);
    const f = follower(env, P.px, P.py);
    tick(env, PUDDLE_INTERVAL + 2);
    ok(f.health < f.maxHealth, 'the follower took no damage');
    ok(env.sandbox.floatingTexts.some(x => /TOXIC/.test(x.text)), 'no callout on the follower');
});

check('THE REVERSAL: it does NOT burn a recruit on its way in', () => {
    // This check used to assert the opposite, and said "by design". The design
    // changed: a recruit walking to the Crystal takes nothing from anyone or
    // anything. Measured over a minute of a busy wave 8, every single point of
    // damage landed on a recruit came from this puddle — it was not a corner
    // case, it was the whole of what was hurting them.
    //
    // A recruit cannot fight, cannot be ordered and has no element yet, so a
    // toxin patch lying across its route was a coin toss it had no part in.
    const env = makeEnv();
    const P = puddleAt(env);
    const n = neutral(env, P.px, P.py);
    tick(env, PUDDLE_INTERVAL * 4 + 2);
    same(n.health, n.maxHealth, 'a recruit standing in it should be untouched');
    // And a follower in the same patch still burns, so this cannot pass because
    // the puddle stopped working altogether.
    const f = follower(env, P.px, P.py);
    tick(env, PUDDLE_INTERVAL + 2);
    ok(f.health < f.maxHealth, 'the puddle should still bite a follower');
    same(n.health, n.maxHealth, 'and still not the recruit beside it');
});

// Pinned in place: update() is stubbed out so the subject cannot simply walk
// off the puddle. Without this the clone case passed for the wrong reason — it
// wandered away to chase the predator that made the patch.
function pinned(p) { p.update = () => {}; return p; }

check('THE ASYMMETRY: predators are not touched by it', () => {
    const env = makeEnv();
    const P = puddleAt(env);
    const p = pinned(mkPred(env, P.px, P.py));
    const hp = p.health;
    tick(env, PUDDLE_INTERVAL * 3 + 2);
    same(p.health, hp, 'a predator should be immune to its own kind\'s toxin');
    same(p.x, P.px, 'fixture: it must not have moved off the puddle');
});

check('THE ASYMMETRY: your clones are not touched either', () => {
    const env = makeEnv();
    const P = puddleAt(env);
    const c = pinned(mkPred(env, P.px, P.py));
    c.isClone = true; c.team = 'green';
    const hp = c.health;
    tick(env, PUDDLE_INTERVAL * 3 + 2);
    same(c.health, hp, 'a clone is still a predator');
    same(c.x, P.px, 'fixture: it must not have moved off the puddle');
});

check('THE ASYMMETRY: the player walks through untouched', () => {
    const env = makeEnv();
    let hurt = 0;
    env.sandbox.hurtPlayer = () => { hurt++; return true; };
    const P = puddleAt(env);
    env.sandbox.player.x = P.px; env.sandbox.player.y = P.py;
    env.sandbox.health = 100;
    tick(env, PUDDLE_INTERVAL * 4 + 2);
    same(hurt, 0, 'the puddle should never reach for the player');
    same(env.sandbox.health, 100, 'and must not touch health directly either');
});

check('the predicate is the single place that decides', () => {
    const env = makeEnv();
    const aff = env.run('puddleAffects');
    same(aff({ isFollower: true, dead: false }), true, 'follower');
    same(aff({ isNeutralRecruit: true, dead: false }), false, 'a recruit is no longer affected');
    same(aff({ isFollower: true, dead: true }), false, 'a corpse');
    same(aff({ team: 'green', dead: false }), false, 'something that is neither');
    same(aff(null), false, 'null');
    same(aff(undefined), false, 'undefined');
    const p = mkPred(env, 0, 2);
    p.isFollower = true;            // even if mislabelled, a Predator is excluded
    same(aff(p), false, 'a Predator instance is never affected');
});

check('only the puddle tiles bite, not the whole patch', () => {
    const env = makeEnv();
    const P = puddleAt(env); const m = P.m;
    // A cocoon tile that is NOT a puddle.
    const plain = m.tiles.find(([tx, ty]) => !m.puddles.some(([px, py]) => px === tx && py === ty));
    ok(plain, 'fixture: the patch should have a non-puddle tile');
    const f = follower(env, plain[0], plain[1]);
    tick(env, PUDDLE_INTERVAL * 3 + 2);
    same(f.health, f.maxHealth, 'plain cocoon should not hurt anything');
});

check('standing beside a puddle is safe', () => {
    const env = makeEnv();
    const P = puddleAt(env);
    const f = follower(env, P.px + 1.6, P.py);   // well clear of the pool
    tick(env, PUDDLE_INTERVAL * 3 + 2);
    same(f.health, f.maxHealth, 'a follower clear of the pool should be unharmed');
});

check('it bites on an interval, not every frame', () => {
    const env = makeEnv();
    const P = puddleAt(env);
    const f = follower(env, P.px, P.py);
    tick(env, PUDDLE_INTERVAL - 1);
    same(f.health, f.maxHealth, 'bit before its interval elapsed');
    tick(env, 2);
    same(f.health, f.maxHealth - PUDDLE_DAMAGE, 'should bite once on the interval');
});

check('a puddle dies with the patch that grew it', () => {
    const env = makeEnv();
    const P = puddleAt(env); const t = P.t;
    const f = follower(env, P.px, P.py);
    t.pillarTeam = 'green';
    env.run('clearInfestationAt')(t);
    tick(env, PUDDLE_INTERVAL * 3 + 2);
    same(f.health, f.maxHealth, 'a reclaimed pylon should take its puddles with it');
});

check('THE REPORTED CASE: only a venomous species leaves toxin', () => {
    const env = makeEnv();
    board(env, -4, 10, 0, 4);
    for (const sp of TOXIN_SPECIES) {
        env.run('cocoons').length = 0;
        const t = greenPylon(env, 3, 2, { pillarTeam: 'green' });
        convert(env, t, spinner(sp, 'striker'));
        const m = env.run('cocoons')[0];
        same(m.enhancement, 'toxic', `${sp} should carry the toxin`);
        ok(m.puddles.length > 0, `${sp} should leave a toxin tile`);
        t.pillarTeam = 'green'; env.run('clearInfestationAt')(t);
    }
});

check('a species that is not venomous leaves a plain cocoon', () => {
    const env = makeEnv();
    board(env, -4, 10, 0, 4);
    for (const sp of ['ant', 'beetle', 'mantis', 'moth']) {
        ok(!TOXIN_SPECIES.includes(sp), `fixture: ${sp} should not be venomous`);
        env.run('cocoons').length = 0;
        const t = greenPylon(env, 3, 2, { pillarTeam: 'green' });
        convert(env, t, spinner(sp, 'striker'));
        const m = env.run('cocoons')[0];
        same(m.enhancement, null, `${sp} should carry no enhancement`);
        same(m.puddles.length, 0, `${sp} should leave no toxin`);
        t.pillarTeam = 'green'; env.run('clearInfestationAt')(t);
    }
});

check('the enhancement table is the single place that decides', () => {
    const env = makeEnv();
    const f = env.run('cocoonEnhancement');
    for (const sp of TOXIN_SPECIES) same(f(sp), 'toxic', sp);
    same(f('ant'), null, 'ant');
    same(f('nonsense'), null, 'an unknown species');
    same(f(undefined), null, 'undefined');
});

check('the toxin is ONE tile beside the pylon, not the whole footprint', () => {
    const env = makeEnv();
    board(env, -4, 10, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, spinner('spider', 'striker'));
    tick(env, SWELL + 5);
    const m = env.run('cocoons')[0];
    same(m.puddles.length, 1, `expected one toxin tile, got ${m.puddles.length}`);
    const [px, py] = m.puddles[0];
    ok(!(px === t.x && py === t.y), 'it should be beside the pylon, not under it');
    ok(Math.abs(px - t.x) <= 1 && Math.abs(py - t.y) <= 1, 'and adjacent to it');
    ok(m.tiles.some(([tx, ty]) => tx === px && ty === py), 'and inside the cocoon');
});

check('puddles are drawn, and distinctly from the cocoon', () => {
    const env = makeEnv();
    const P = puddleAt(env);
    env.calls.length = 0;
    drawAll(env);
    const fills = env.calls.filter(c => c.op === 'set:fillStyle').map(c => c.args[0]);
    ok(fills.includes(PUDDLE_COLOUR), 'the puddle colour is never used');
    ok(env.calls.some(c => c.op === 'stroke'), 'no meniscus outline');
});

check('puddles survive a refresh', () => {
    const env = makeEnv();
    const P = puddleAt(env);
    const blob = JSON.parse(JSON.stringify(env.run('serialiseCocoons()')));
    ok(blob[0].puddles.length > 0, 'puddles are not saved');
    env.run('restoreCocoons')(blob);
    same(env.run('cocoons')[0].puddles.length, 1, 'puddles did not come back');
    // A save written before the toxin existed gets it back, because the
    // enhancement is derived from the species rather than stored — a spider
    // cocoon is toxic whether or not the save says so.
    const legacy = blob.map(b => { const c = Object.assign({}, b); delete c.puddles; delete c.enhancement; return c; });
    env.run('restoreCocoons')(legacy);
    same(env.run('cocoons')[0].puddles.length, 1, 'a venomous legacy save should regain its toxin');
    // ...and a non-venomous one still gets none.
    const plain = legacy.map(b => Object.assign({}, b, { species: 'ant' }));
    env.run('restoreCocoons')(plain);
    same(env.run('cocoons')[0].puddles.length, 0, 'an ant cocoon should have no toxin');
});

check('a creeping-era save does not bring the old carpet back', () => {
    // Sessions written before the rework hold a sprawling footprint of up to
    // fourteen scattered tiles. Restoring that verbatim put the carpet back.
    const env = makeEnv();
    const P = puddleAt(env);
    const blob = JSON.parse(JSON.stringify(env.run('serialiseCocoons()')));
    blob[0].tiles = [];
    for (let i = 0; i < 14; i++) blob[0].tiles.push([3 + i, 2]);   // a long creeping strip
    blob[0].puddles = blob[0].tiles.slice(0, 5);
    env.run('restoreCocoons')(blob);
    const m = env.run('cocoons')[0];
    ok(m.tiles.length <= SPAN_MAX * SPAN_MAX,
       `restored ${m.tiles.length} tiles from a creeping-era save`);
    ok(m.puddles.length <= 1, `restored ${m.puddles.length} toxin tiles, expected at most one`);
    const xs = m.tiles.map(([x]) => x);
    ok(Math.max(...xs) - Math.min(...xs) + 1 <= SPAN_MAX, 'the footprint should be a square again');
});

check('the damage is a nuisance, not an execution', () => {
    const perSec = (PUDDLE_DAMAGE / PUDDLE_INTERVAL) * 60;
    ok(perSec >= 1, `${perSec} HP/s is not worth avoiding`);
    ok(perSec <= 8, `${perSec} HP/s would delete a follower for standing still`);
});

group('reclaiming the pylon is the counter');

check('THE COUNTER: taking the pylon back kills its cocoon and nest', () => {
    const env = makeEnv();
    board(env, -2, 8, -1, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    tick(env, SWELL + 5);
    ok(env.run('cocoons').length === 1, 'fixture: should have a cocoon');
    const nest = env.sandbox.world.find(x => x._infestNest);
    ok(nest && nest.nestHealth > 0, 'fixture: should have a nest');

    // What the reconstruction completion in game.js does.
    t.pillarTeam = 'green';
    env.run('clearInfestationAt')(t);
    same(env.run('cocoons').length, 0, 'the cocoon should die with the pylon');
    same(nest.nestHealth, 0, 'the grown nest should go too');
    same(nest.nest, false, 'and stop being a nest at all');
});

check('a patch holding two pylons survives losing one of them', () => {
    const env = makeEnv();
    board(env, -2, 10, 0, 4);
    const a = greenPylon(env, 3, 2);
    const b = greenPylon(env, 4, 2);     // adjacent, so the 3x3 covers it
    convert(env, a, spinner());
    tick(env, SWELL + 5);
    const m = env.run('cocoons')[0];
    ok(m.anchors.length >= 2, 'fixture: should hold both pylons');
    a.pillarTeam = 'green';
    env.run('clearInfestationAt')(a);
    same(env.run('cocoons').length, 1, 'it should still be held up by the other pylon');
    b.pillarTeam = 'green';
    env.run('clearInfestationAt')(b);
    same(env.run('cocoons').length, 0, 'losing the last anchor should kill it');
});

check('a cocoon whose pylons are all destroyed dies on its own', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2));
    t.destroyed = true;
    tick(env, 5);
    same(env.run('cocoons').length, 0, 'wreckage should not keep a cocoon alive');
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

check('THE REPORTED CASE: they draw in the world, under the pylons', () => {
    // As flat overlays these painted over every pylon on the board, so a nest
    // behind a pylon still landed on top of it and looked like it was floating
    // above it. They belong in the depth-sorted tile pass.
    ok(/updateInfestation\(\);/.test(GAME), 'never updated');
    ok(/drawConversionBars\(\);/.test(GAME), 'the progress bar is never drawn');
    ok(!/drawCocoons\(\);/.test(GAME), 'the flat cocoon overlay is back');
    ok(!/drawGrownNests\(\);/.test(GAME), 'the flat nest overlay is back');

    const cocoonAt = GAME.indexOf('drawCocoonForTile(obj, px, py);');
    const nestAt   = GAME.indexOf('drawGrownNestForTile(obj, px, py);');
    ok(cocoonAt > -1, 'the cocoon is never drawn per tile');
    ok(nestAt   > -1, 'the grown nest is never drawn per tile');

    // Both must be inside the sorted draw loop, not after it.
    const loopAt  = GAME.indexOf('drawList.forEach(obj=>{');
    const ifaceAt = GAME.indexOf('drawRadialMenu();');
    ok(loopAt > -1 && ifaceAt > loopAt, 'could not locate the sorted pass');
    ok(cocoonAt > loopAt && cocoonAt < ifaceAt, 'the cocoon is outside the sorted pass');
    ok(nestAt   > loopAt && nestAt   < ifaceAt, 'the grown nest is outside the sorted pass');

    // And the cocoon must precede the pylon body, so the pylon rises out of it.
    const pylonAt = GAME.indexOf('if (obj.pillar&&!obj.destroyed&&typeof obj.health==="number"&&obj.health>0) {');
    ok(pylonAt > -1, 'could not find the pylon body branch');
    ok(cocoonAt < pylonAt, 'the cocoon is pasted over the pylon instead of under it');

    for (const fn of ['drawCocoonForTile', 'drawGrownNestForTile', 'drawConversionBars', 'updateInfestation']) {
        same((GAME.match(new RegExp(fn + '\\(', 'g')) || []).length, 1, fn + ' called more than once');
    }
});

check('it survives a refresh', () => {
    ok(/cocoons: serialiseCocoons\(\)/.test(SAVE), 'cocoons are not saved');
    ok(/restoreCocoons\(sess\.cocoons\)/.test(SAVE), 'cocoons are not restored');
    ok(SAVE.indexOf('restoreCocoons') > SAVE.indexOf('if (pylon && pylon.pillar)'),
       'restore must run after the pylon restore, or anchors cannot resolve');
});

check('a save round-trips a patch, and junk does not throw', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, mkPred(env, 3, 2, 'moth', 'scout'));
    tick(env, SWELL + 5);
    const before = env.run('cocoons')[0];
    const blob = JSON.parse(JSON.stringify(env.run('serialiseCocoons()')));
    env.run('restoreCocoons')(blob);
    const after = env.run('cocoons')[0];
    ok(after, 'the patch did not come back');
    same(after.tiles.length, before.tiles.length, 'tile count');
    same(after.species, 'moth', 'species');
    same(after.className, 'scout', 'class');
    ok(after.anchors.includes(t), 'the anchor should resolve back to the real tile');
    env.run('restoreCocoons')(null);
    env.run('restoreCocoons')([{ }, null, { tiles: 'nonsense' }]);
    same(env.run('cocoons').length, 0, 'junk should restore to nothing rather than throwing');
});

check('a patch whose anchors no longer exist is not restored', () => {
    const env = makeEnv();
    board(env, -2, 8, 0, 4);
    env.run('restoreCocoons')([{ x: 3, y: 2, tiles: [[3, 2]], anchors: [[99, 99]],
                                species: 'ant', className: 'scout' }]);
    same(env.run('cocoons').length, 0, 'a cocoon with no surviving pylon should be dropped');
});

check('a change of scene clears it', () => {
    ok(/cocoons\.length = 0;/.test(WAVES), 'cocoons survive a reset or a new wave');
    ok(/t\.converting\) \{ t\.converting = false; t\.convertProgress = 0; \}/.test(WAVES),
       'half-finished conversions survive a change of scene');
});

// One converted pylon and its cocoon. Used by the taming checks, which are
// about the cocoon rather than the nest beside it.
function infestOne(env, x, y, species) {
    board(env, x - 4, x + 6, 0, 4);
    const t = greenPylon(env, x, y);
    env.run('convertPylonToRed')(t, spinner(species || 'ant', 'striker'));
    const m = env.run('cocoons').find(c => c.anchors.includes(t));
    ok(!!m, 'fixture: conversion should have spun a cocoon');
    return { t, m };
}

// ─────────────────────────────────────────────────────────
group('taming it: the runaway loop');

check('the index documents every limit', () => {
    const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
    ok(/never gardens/i.test(HTML), 'the index does not say hatchlings cannot convert');
    ok(/one grown nest per zone/i.test(HTML), 'nor the per-zone cap');
    ok(/burns out/i.test(HTML), 'nor that cocoons go inert');
    // The pacing floor and the de-synchronisation, from the constants.
    const cool = Math.round(NEST_COOLDOWN / 60);
    ok(new RegExp('once every <span class="cm-stat">' + cool + ' seconds').test(HTML),
       'the documented nest cooldown does not match NEST_GROW_COOLDOWN (' + cool + 's)');
    ok(/settle back into gardening at their own pace/i.test(HTML),
       'nor that predators do not all resume converting together');
    const lim = constant('COCOON_HATCH_LIMIT');
    ok(new RegExp('>' + lim + '</span> hatchlings').test(HTML),
       'the documented hatch limit does not match COCOON_HATCH_LIMIT (' + lim + ')');
    // And the conversion time in the docs must match the constant.
    const secs = Math.round(1 / constant('INFEST_RATE') / 60);
    ok(new RegExp('>' + secs + ' seconds<').test(HTML),
       'the documented conversion time does not match INFEST_RATE (' + secs + 's)');
});

check('and it no longer claims every taken pylon grows a nest', () => {
    // It used to say "seeds a nest and a cocoon there", which was true before
    // the pacing floor and is not now. Same claim in the in-game codex.
    const HTML  = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
    const CODEX = fs.readFileSync(path.join(ROOT, 'js/codex.js'), 'utf8');
    ok(!/seeds a <strong>nest<\/strong> and a <strong>cocoon<\/strong>/.test(HTML),
       'the index still promises a nest with every conversion');
    ok(!/A taken pylon grows a nest/.test(CODEX),
       'the codex still promises a nest with every conversion');
    ok(/NEST_GROW_COOLDOWN/.test(CODEX),
       'the codex should read the cooldown from the constant rather than restate it');
});

check('the index describes the wall nest as a vortex', () => {
    const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
    ok(/vortex in the back wall/i.test(HTML), 'the wall nest is not described as a vortex');
    ok(/wall plane/i.test(HTML), 'it does not say the plane is what differs');
    ok(!/honeycomb/i.test(HTML), 'the index still describes a honeycomb');
});

// THE REPORTED CASE: "it gets crazy hectic real fast when they start laying
// nests everywhere."
//
// Measured at wave 8, one minute of leaving pylons alone: 11 of 27 pylons lost,
// 7 grown nests on top of the 6 the zones generate, 10 cocoons, 31 predators —
// and 34 of the eventual 42 predators had come OUT OF COCOONS rather than out
// of the zones. That is the loop: convert a pylon, get a cocoon, the cocoon
// hatches predators, they convert more pylons.
//
// Four levers, all four chosen: hatchlings do not garden, one grown nest per
// zone, conversion takes 25s instead of 7.5s, and a cocoon goes inert after a
// lifetime total of hatches.

check('THE LOOP: a predator hatched from a cocoon never gardens', () => {
    const env = makeEnv();
    const p = mkPred(env, 0, 2);
    same(env.run('predatorUndisturbed')(p), true, 'fixture: a quiet zone predator gardens');
    p.fromCocoon = true;
    same(env.run('predatorUndisturbed')(p), false, 'a hatchling must not garden');
});

check('so a hatchling cannot convert a pylon either', () => {
    // The gate is one function, so this follows — but it is the behaviour that
    // matters, and infestTick is where it bites.
    const env = makeEnv();
    board(env, 0, 8, 0, 4);
    const t = greenPylon(env, 3, 2);
    const p = mkPred(env, 3, 2);
    p.fromCocoon = true;
    same(env.run('infestTick')(p), false, 'a hatchling should not claim the frame to garden');
    tick(env, 200);
    same(t.pillarTeam, 'green', 'and the pylon should still be yours');
});

check('a cocoon-hatched predator IS flagged as one', () => {
    // The whole lever rests on this flag being set where cocoons hatch.
    ok(/p\.fromCocoon = true/.test(INFEST), '_hatchFromCocoon no longer marks its spawn');
});

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

check('THE CAP: one grown nest per zone', () => {
    const env = makeEnv();
    board(env, 0, 14, 0, 4);
    const a = greenPylon(env, 3, 2);
    const b = greenPylon(env, 11, 2);      // same zone (0..14), clear of the 4-tile guard
    convertPaced(env, a, spinner('ant', 'striker'));
    const first = env.sandbox.world.filter(t => t._infestNest && t.nest).length;
    same(first, 1, 'fixture: the first conversion should grow one');
    // Paced, so the cooldown is NOT what is being measured here.
    convertPaced(env, b, spinner('ant', 'striker'));
    same(env.sandbox.world.filter(t => t._infestNest && t.nest).length, 1,
         'a second conversion in the same zone should grow no second nest');
});

check('but a different zone gets its own', () => {
    const env = makeEnv();
    board(env, 0, 40, 0, 4);
    const a = greenPylon(env, 3, 2);       // zone 0
    const b = greenPylon(env, 20, 2);      // zone 1
    convertPaced(env, a, spinner('ant', 'striker'));
    convertPaced(env, b, spinner('ant', 'striker'));
    same(env.sandbox.world.filter(t => t._infestNest && t.nest).length, 2,
         'the cap is per zone, not per map');
});

// ─────────────────────────────────────────────────────────
//  "NESTS ARE OCCURRING TOO OFTEN"
// ─────────────────────────────────────────────────────────
// Reported after the caps above were already in place and working — the five
// nests measured at wave 8 really were in five different zones. The complaint
// was not how MANY there were, it was that they all turned up at once.
//
// Traced with a conversion timeline. Nothing was wrong with the rate: every
// predator started gardening on the same frame and worked at the same flat
// rate, so they all crossed the line together. Four nests grew inside 142
// frames, five inside ten seconds, after twenty-five seconds of nothing.
//
// The synchroniser is structural, not accidental: predatorUndisturbed() bails
// out while alertActive, and alertActive is one global flag, so the frame an
// alarm clears is the frame every wanderer in every zone resumes.
//
// Two fixes. Predators settle back to work at their own pace and then work at
// their own speed; and a nest can GROW at most once every NEST_GROW_COOLDOWN
// anywhere on the map, which bounds arrival rate rather than population.

check('THE PACING: a second nest cannot grow right behind the first', () => {
    const env = makeEnv();
    board(env, 0, 40, 0, 4);
    const a = greenPylon(env, 3, 2);       // zone 0
    const b = greenPylon(env, 20, 2);      // zone 1 — the per-zone cap allows it
    convert(env, a, spinner('ant', 'striker'));
    same(env.sandbox.world.filter(t => t._infestNest && t.nest).length, 1,
         'fixture: the first one should grow');
    // Same frame, different zone, nowhere near the 4-tile guard: every other
    // gate says yes. Only the cooldown should stop it.
    convert(env, b, spinner('ant', 'striker'));
    same(env.sandbox.world.filter(t => t._infestNest && t.nest).length, 1,
         'a nest grew in the same breath as the last one');
});

check('and the pylon is still lost, and still cocooned, when it does not', () => {
    // The cooldown must not turn into an amnesty. Losing the pylon is the
    // consequence; the nest is the extra.
    const env = makeEnv();
    board(env, 0, 40, 0, 4);
    const a = greenPylon(env, 3, 2);
    const b = greenPylon(env, 20, 2);
    convert(env, a, spinner('ant', 'striker'));
    convert(env, b, spinner('ant', 'striker'));
    same(b.pillarTeam, 'red', 'the pylon should still change hands');
    ok(!!env.run('cocoonForAnchor')(b), 'and should still be cocooned');
});

check('once the cooldown is up, the next one grows', () => {
    // Otherwise this is not pacing, it is a one-nest-per-game cap.
    const env = makeEnv();
    board(env, 0, 40, 0, 4);
    const a = greenPylon(env, 3, 2);
    const b = greenPylon(env, 20, 2);
    convert(env, a, spinner('ant', 'striker'));
    env.sandbox.frame += NEST_COOLDOWN;
    convert(env, b, spinner('ant', 'striker'));
    same(env.sandbox.world.filter(t => t._infestNest && t.nest).length, 2,
         'the second should grow once the map has had a rest');
});

check('a blocked conversion does not spend the cooldown on nothing', () => {
    // The stamp is at the point a nest is actually placed. If it were taken on
    // entry, a conversion the per-zone cap rejected would silently push the
    // next real nest another 45 seconds out.
    const env = makeEnv();
    board(env, 0, 40, 0, 4);
    const a = greenPylon(env, 3, 2);       // zone 0
    const b = greenPylon(env, 11, 2);      // zone 0 too — capped out
    const c = greenPylon(env, 20, 2);      // zone 1
    convert(env, a, spinner('ant', 'striker'));
    env.sandbox.frame += NEST_COOLDOWN;
    convert(env, b, spinner('ant', 'striker'));   // rejected by the zone cap
    same(env.sandbox.world.filter(t => t._infestNest && t.nest).length, 1,
         'fixture: the zone cap should have refused that one');
    convert(env, c, spinner('ant', 'striker'));   // same frame, fresh zone
    same(env.sandbox.world.filter(t => t._infestNest && t.nest).length, 2,
         'the refused conversion consumed the cooldown');
});

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

check('the cap counts only GROWN nests, not the zone\'s own', () => {
    // A zone is generated with a wall nest. If that counted, a zone could never
    // grow one at all and the mechanic would be dead.
    const env = makeEnv();
    board(env, 0, 14, 0, 4);
    addTile(env, { x: 6, y: -1, type: 'floor', nest: true, nestHealth: 200,
                   nestMaxHealth: 200, nestZone: 0 });
    const t = greenPylon(env, 11, 2);
    convert(env, t, spinner('ant', 'striker'));
    same(env.sandbox.world.filter(x => x._infestNest && x.nest).length, 1,
         'a zone wall nest should not block the grown one');
});

check('THE TAP: a cocoon goes inert after a lifetime of hatches', () => {
    const env = makeEnv();
    const { m } = infestOne(env, 3, 2);
    const limit = constant('COCOON_HATCH_LIMIT');
    same(m.hatchesLeft, limit, 'a fresh cocoon should have its full allowance');
    // Hatch it dry, clearing the live cap between each so only the lifetime
    // total is under test.
    let hatched = 0;
    for (let i = 0; i < limit + 4; i++) {
        env.sandbox.actors.length = 0;
        m.spawned = [];
        const before = env.sandbox.actors.length;
        env.run('_hatchFromCocoon')(m);
        if (env.sandbox.actors.length > before) hatched++;
    }
    same(hatched, limit, `it should hatch exactly ${limit} in its life, got ${hatched}`);
    same(m.hatchesLeft, 0, 'and be spent');
});

check('a spent cocoon stops, and looks stopped', () => {
    // Identical-looking live and spent cocoons would make "this site is
    // finished" unreadable, which is most of the value of it burning out.
    const env = makeEnv();
    const { m, t } = infestOne(env, 3, 2);
    m.hatchesLeft = 0;
    env.sandbox.actors.length = 0;
    env.run('_hatchFromCocoon')(m);
    same(env.sandbox.actors.length, 0, 'a spent cocoon should hatch nothing');
    env.calls.length = 0;
    drawTile(env, t);
    const greys = env.calls.filter(c => c.op === 'set:fillStyle' && /#4a4a52/i.test(String(c.args[0])));
    ok(greys.length > 0, 'a spent cocoon should go grey rather than keep its species colour');
});

check('the allowance survives a refresh, and an old save is not immortal', () => {
    const env = makeEnv();
    const { m } = infestOne(env, 3, 2);
    m.hatchesLeft = 1;
    const blob = JSON.parse(JSON.stringify(env.run('serialiseCocoons')()));
    same(blob[0].hatchesLeft, 1, 'the count is not saved');
    env.run('restoreCocoons')(blob);
    same(env.run('cocoons')[0].hatchesLeft, 1, 'it should come back where it was');
    // A save written before cocoons burned out carries no count at all.
    delete blob[0].hatchesLeft;
    env.run('restoreCocoons')(blob);
    same(env.run('cocoons')[0].hatchesLeft, constant('COCOON_HATCH_LIMIT'),
         'an older save should get a fresh allowance, not an unlimited one');
});

// ─────────────────────────────────────────────────────────
check('nothing is drawn when there is no infestation', () => {
    const env = makeEnv();
    board(env, -2, 4, 0, 4);
    env.calls.length = 0;
    drawAll(env);
    env.run('drawConversionBars()');
    same(env.calls.length, 0, 'drew something with no cocoon and no conversion');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
