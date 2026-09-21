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
    ok(/function drawGrownNests/.test(INFEST), 'grown nests have no drawing of their own');
    ok(/drawGrownNests\(\);/.test(GAME), 'drawGrownNests is never called');
    ok(GAME.indexOf('drawGrownNests();') < GAME.indexOf('drawRadialMenu();'),
       'it should draw under the interface');
});

check('a grown nest actually draws, and stops when it is gone', () => {
    const env = makeEnv();
    board(env, -4, 10, -1, 4);
    const t = greenPylon(env, 3, 2);
    convert(env, t, spinner());
    const nest = env.sandbox.world.find(x => x._infestNest);
    ok(nest && nest.nestHealth > 0, 'fixture: a nest should have grown');
    env.calls.length = 0;
    env.run('drawGrownNests()');
    ok(env.calls.some(c => c.op === 'ellipse'), 'nothing drawn for a grown nest');
    nest.nestHealth = 0;
    env.calls.length = 0;
    env.run('drawGrownNests()');
    same(env.calls.length, 0, 'a dead grown nest should draw nothing');
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
function follower(env, x, y) {
    const f = { x, y, type: 'virus', team: 'green', isFollower: true, dead: false,
                health: 40, maxHealth: 40, element: 'fire' };
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

check('it burns an un-recruited neutral too', () => {
    const env = makeEnv();
    const P = puddleAt(env);
    const n = neutral(env, P.px, P.py);
    tick(env, PUDDLE_INTERVAL + 2);
    ok(n.health < n.maxHealth, 'a recruit standing in it should be hurt');
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
    same(aff({ isNeutralRecruit: true, dead: false }), true, 'recruit');
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
    env.run('drawCocoons()');
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

check('the game loop updates and draws it', () => {
    ok(/updateInfestation\(\);/.test(GAME), 'never updated');
    ok(/drawCocoons\(\);/.test(GAME), 'never drawn');
    ok(/drawConversionBars\(\);/.test(GAME), 'the progress bar is never drawn');
    // Cocoon is on the floor, so it must go under the interface and under the
    // generator filaments.
    ok(GAME.indexOf('drawCocoons();') < GAME.indexOf('drawGeneratorLinks();'), 'cocoon should draw under the links');
    ok(GAME.indexOf('drawCocoons();') < GAME.indexOf('drawRadialMenu();'), 'cocoon should draw under the interface');
    for (const fn of ['drawCocoons', 'drawConversionBars', 'updateInfestation']) {
        same((GAME.match(new RegExp('^\\s*' + fn + '\\(\\);', 'gm')) || []).length, 1, fn + ' called more than once');
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

check('nothing is drawn when there is no infestation', () => {
    const env = makeEnv();
    board(env, -2, 4, 0, 4);
    env.calls.length = 0;
    env.run('drawCocoons()');
    env.run('drawConversionBars()');
    same(env.calls.length, 0, 'drew something with no cocoon and no conversion');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
