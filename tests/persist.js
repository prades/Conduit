// A page refresh should resume the game, not restart it.
//
// The blocker was that generateSegment used Math.random() throughout, so every
// reload built a different map and nothing restored by coordinate could line up
// with the terrain under it. These checks cover the seeded generator and the
// session snapshot built on top of it.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { configNums } = require('./domstub.js');

let store = {};
// world.js stamps every tile with the one pylon look; read it out of config.js
// rather than copying the string.
function _pylonStyle() {
    const src = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
    const m = src.match(/const PYLON_STYLE = "([^"]+)"/);
    if (!m) { console.log('  FAIL config.js no longer defines PYLON_STYLE'); process.exit(1); }
    return m[1];
}

function makeCtx() {
    const sandbox = {
        console, Math, JSON, Object, Array, String, Number, Set, Map,
        isNaN, isFinite, parseInt, parseFloat,
        world: [], worldTileMap: new Map(), actors: [], signalTowers: [],
        exploredZones: new Set(), dayStats: { redSpawned: 0, redConverted: 0 },
        activeDayZones: 3, ZONE_LENGTH: 15, lastGenX: 0, _cacheAge: 0,
        health: 100,
        // The session snapshot now records the player's ultimate bar.
        playerUltimate: 0, PLAYER_ULT_MAX: 100,
        // saveSession now records the siphon switch too.
        siphonEnabled: true, siphonWisps: [],
        unlockedElements: new Set(['fire', 'electric']),
        cfg: { pillarSpawnRate: 0.15, npcSpawnRate: 0.22 },
        // World generation reads these; lifted from config.js, not restated.
        ...configNums(['PANEL_DECOY_CHANCE', 'PANEL_SHARD_MIN', 'PANEL_SHARD_MAX']),
        PYLON_STYLE: _pylonStyle(),
        NPC_TYPES: { virus: { moveSpeed: 0.02 }, lobster: { moveSpeed: 0.02 }, turtle: { moveSpeed: 0.02 } },
        PERSONALITY_KEYS: ['aggressive', 'cautious', 'cunning', 'stoic', 'wild'],
        COMBAT_TRAITS: { a: {}, b: {} }, NATURAL_TRAITS: { a: {}, b: {} }, PERKS: { a: {}, b: {} },
        applyPersonality: () => ({ hp: 20, defense: 10, attack: 10, speed: 10, specialAttack: 10, accuracy: 10, will: 20, resonance: 0 }),
        assignRole: () => 'brawler',
        player: { x: 2, y: 1, targetX: 2, targetY: 1, visualX: 2, visualY: 1 },
        crystal: { x: 0, y: 2 }, shardCount: 0, floatingTexts: [], canvas: { width: 800, height: 600 },
        frame: 0, saveShards() {},
        localStorage: {
            getItem(k) { return k in store ? store[k] : null; },
            setItem(k, v) { store[k] = String(v); },
            removeItem(k) { delete store[k]; },
        },
    };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    // save.js serialises charged mass, so mass.js has to be in scope too.
    for (const f of ['js/rng.js', 'js/mass.js', 'js/infest.js', 'js/world.js', 'js/save.js']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
    }
    return { sandbox, ctx, run: s => vm.runInContext(s, ctx) };
}

let failures = 0;
function group(n) { console.log('\n' + n); }
// Returns a promise when `fn` is async, so an async check must be AWAITED.
// Without the await an async check that throws prints "ok" and the suite goes
// green on a broken game: the try/catch sees a returned promise, not a throw.
function check(name, fn) {
    try {
        const r = fn();
        if (r && typeof r.then === 'function') {
            return r.then(() => console.log('  ok   ' + name),
                          e => { failures++; console.log('  FAIL ' + name + ' — ' + e.message); });
        }
        console.log('  ok   ' + name);
    } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
    return Promise.resolve();
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// A comparable fingerprint of the generated terrain.
function terrain(sandbox) {
    return sandbox.world.map(t => [
        t.x, t.y, t.pillar ? 1 : 0, t.pillarTeam, t.pylonStyle,
        t.nodeType || '', t.isDecoy ? 1 : 0, t.shardReward || 0, t.alarmType || '',
    ].join(':')).join('|');
}
function generate(env, from, to) {
    for (let i = from; i < to; i++) env.run(`generateSegment(${i})`);
}

group('recruits across a refresh');

check('THE REPORTED CASE: between-wave recruits survive a refresh', () => {
    // nextWave() drops fresh neutrals in with NO spawnKey, and nothing
    // regenerates them — they were dropped from the save entirely, so a
    // refresh after a wave came up with an empty map.
    store = {};
    const a = makeCtx();
    a.run('initWorldSeed()');
    a.sandbox.actors.push(
        { type: 'virus', x: 18.5, y: 2, team: 'red', isNeutralRecruit: true,
          dead: false, health: 12, maxHealth: 15 },
        { type: 'virus', x: 33.25, y: 3, team: 'red', isNeutralRecruit: true,
          dead: false, health: 15, maxHealth: 15 });
    a.run('saveSession()');

    const b = makeCtx();
    const sess = b.run('loadSession()');
    ok(Array.isArray(sess.waveNpcs), 'the session should carry the wave recruits');
    eq(sess.waveNpcs.length, 2, 'both should be saved');
    b.run('restoreWaveRecruits')(sess.waveNpcs);
    const back = b.sandbox.actors.filter(x => x.isNeutralRecruit);
    eq(back.length, 2, 'both should come back');
    eq(back[0].x, 18.5, 'position should survive');
    eq(back[0].health, 12, 'damage taken should survive');
    ok(back.every(x => !x.dead && x.team === 'red'), 'they should be live recruits');
});

check('a killed one is not handed back', () => {
    store = {};
    const a = makeCtx();
    a.run('initWorldSeed()');
    a.sandbox.actors.push(
        { type: 'virus', x: 18, y: 2, team: 'red', isNeutralRecruit: true, dead: true, health: 0 },
        { type: 'virus', x: 20, y: 2, team: 'red', isNeutralRecruit: true, dead: false, health: 15 });
    a.run('saveSession()');
    eq(makeCtx().run('loadSession()').waveNpcs.length, 1, 'only the survivor should be saved');
});

check('a converted recruit is not handed back either', () => {
    // Recruiting one flips it to team green; it is a follower now and the
    // follower roster owns it.
    store = {};
    const a = makeCtx();
    a.run('initWorldSeed()');
    a.sandbox.actors.push(
        { type: 'virus', x: 18, y: 2, team: 'green', isFollower: true, isNeutralRecruit: false,
          dead: false, health: 15 });
    a.run('saveSession()');
    eq(makeCtx().run('loadSession()').waveNpcs.length, 0, 'a follower is not a loose recruit');
});

check('the generated ones are still tracked by key, not duplicated', () => {
    // A segment-generated recruit carries a spawnKey and generateSegment
    // re-creates it; saving it as a wave recruit too would double it.
    store = {};
    const a = makeCtx();
    a.run('initWorldSeed()');
    a.sandbox.actors.push(
        { type: 'virus', x: 7, y: 3, team: 'red', isNeutralRecruit: true,
          dead: false, health: 15, spawnKey: 7 });
    a.run('saveSession()');
    const sess = makeCtx().run('loadSession()');
    eq(sess.npcs.length, 1, 'it should be saved by key');
    eq(sess.waveNpcs.length, 0, 'and NOT also as a wave recruit');
});

check('a session with no wave recruits restores without throwing', () => {
    const b = makeCtx();
    b.run('restoreWaveRecruits')(undefined);
    b.run('restoreWaveRecruits')(null);
    b.run('restoreWaveRecruits')([{}, null, { x: 'nonsense', y: 2 }]);
    eq(b.sandbox.actors.length, 0, 'junk should restore nothing');
});

group('the world seed');
check('a seed is created and then reused', () => {
    store = {};
    const a = makeCtx(); const s1 = a.run('initWorldSeed()');
    ok(s1 !== 0, 'seed should not be zero');
    const b = makeCtx(); const s2 = b.run('initWorldSeed()');
    eq(s2, s1, 'second load should reuse the stored seed');
});
check('clearing the seed yields a different world next time', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, 0, 12);
    const before = terrain(a.sandbox);
    a.run('clearWorldSeed()');
    const b = makeCtx(); b.run('initWorldSeed()'); generate(b, 0, 12);
    ok(terrain(b.sandbox) !== before, 'a reset should not hand back the same map');
});
check('a corrupt stored seed is replaced rather than trusted', () => {
    store = { tubecrawler_seed: 'banana' };
    const a = makeCtx();
    const s = a.run('initWorldSeed()');
    ok(Number.isFinite(s) && s !== 0, 'got ' + s);
});
check('a stored seed of zero is replaced', () => {
    store = { tubecrawler_seed: '0' };
    const a = makeCtx();
    ok(a.run('initWorldSeed()') !== 0, 'zero is not a usable seed');
});

group('deterministic generation');
check('THE FIX: the same seed rebuilds the identical map', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, -6, 40);
    const b = makeCtx(); b.run('initWorldSeed()'); generate(b, -6, 40);
    eq(terrain(b.sandbox), terrain(a.sandbox), 'reload produced a different world');
});
check('a different seed gives a different map', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, 0, 40);
    store = {};
    const b = makeCtx(); b.run('initWorldSeed()'); generate(b, 0, 40);
    ok(terrain(b.sandbox) !== terrain(a.sandbox), 'two fresh games should differ');
});
check('generation order does not matter', () => {
    // Segments are created lazily as the player walks, so the order is not
    // stable between runs. Each segment draws from its own stream for this.
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()');
    for (let i = 0; i < 20; i++) a.run(`generateSegment(${i})`);
    const b = makeCtx(); b.run('initWorldSeed()');
    for (let i = 19; i >= 0; i--) b.run(`generateSegment(${i})`);
    const key = t => `${t.x},${t.y}`;
    const byKey = w => { const m = {}; w.forEach(t => { m[key(t)] = `${t.pillar?1:0}:${t.pillarTeam}:${t.pylonStyle}:${t.nodeType||''}`; }); return m; };
    const A = byKey(a.sandbox.world), B = byKey(b.sandbox.world);
    for (const k of Object.keys(A)) eq(B[k], A[k], 'tile ' + k + ' differs by generation order');
});
check('the same segment twice does not vary', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()');
    a.run('generateSegment(7)');
    const first = terrain(a.sandbox);
    a.sandbox.world.length = 0; a.sandbox.worldTileMap.clear();
    a.run('generateSegment(7)');
    eq(terrain(a.sandbox), first, 'segment 7 generated differently the second time');
});
check('nests still land at zone centres', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, 0, 46);
    const nests = a.sandbox.world.filter(t => t.nest);
    ok(nests.length >= 2, 'expected nests, got ' + nests.length);
    nests.forEach(n => eq(n.x % 15, 7, 'nest at x=' + n.x + ' is not at a zone centre'));
});

group('session round trip');
function play(env) {
    // Simulate a bit of progress: move, take damage, link a nest, bank a panel.
    const sb = env.sandbox;
    sb.player.x = 23.5; sb.player.y = 2;
    sb.health = 61;
    sb.lastGenX = 44;
    sb.exploredZones = new Set([0, 1, 2]);
    const nest  = sb.world.find(t => t.nest);
    const pylon = sb.world.find(t => t.pillar);
    ok(nest && pylon, 'fixture needs a nest and a pylon');
    nest.nestHealth = 120;
    nest.connectedPylon = pylon; pylon.nestConnection = nest;
    const panel = sb.world.find(t => t.nodeType === 'wall_panel');
    if (panel) { panel.panelActivated = true; panel.shardReward = 4; panel.panelTimesActivated = 2; }
    const node = sb.world.find(t => t.capturable);
    if (node) { node.captured = true; node.predatorOwned = false; }
    return { nest, pylon, panel, node };
}

check('a refresh restores position, health and explored zones', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, -6, 46);
    play(a); a.run('saveSession()');

    const b = makeCtx(); b.run('initWorldSeed()');
    b.run('restoredNpcKeys = null'); generate(b, -6, 46);
    b.run('applySession(loadSession())');
    eq(b.sandbox.player.x, 23.5, 'x');
    eq(b.sandbox.player.y, 2, 'y');
    eq(b.sandbox.health, 61, 'health');
    eq(b.sandbox.player.visualX, 23.5, 'camera follows the restored position');
    eq([...b.sandbox.exploredZones].sort().join(','), '0,1,2', 'explored zones');
    eq(b.sandbox.lastGenX >= 44, true, 'world extent');
});
check('THE REPORTED CASE: a nest-to-pylon link survives the refresh', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, -6, 46);
    const { nest, pylon } = play(a);
    a.run('saveSession()');

    const b = makeCtx(); b.run('initWorldSeed()');
    b.run('restoredNpcKeys = null'); generate(b, -6, 46);
    b.run('applySession(loadSession())');
    const nest2  = b.sandbox.worldTileMap.get(`${nest.x},${nest.y}`);
    const pylon2 = b.sandbox.worldTileMap.get(`${pylon.x},${pylon.y}`);
    ok(nest2 && pylon2, 'tiles should exist at the same coordinates');
    eq(nest2.connectedPylon, pylon2, 'nest should still point at its pylon');
    eq(pylon2.nestConnection, nest2, 'and the pylon back at the nest');
    eq(nest2.nestHealth, 120, 'partial nest damage should persist too');
});
check('panel and capture-node progress survive', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, -6, 46);
    const { panel, node } = play(a);
    a.run('saveSession()');

    const b = makeCtx(); b.run('initWorldSeed()');
    b.run('restoredNpcKeys = null'); generate(b, -6, 46);
    b.run('applySession(loadSession())');
    if (panel) {
        const p2 = b.sandbox.worldTileMap.get(`${panel.x},${panel.y}`);
        eq(p2.panelActivated, true, 'panel stays activated');
        eq(p2.shardReward, 4, 'diminished reward persists');
        eq(p2.panelTimesActivated, 2, 'activation count persists');
    }
    if (node) {
        const n2 = b.sandbox.worldTileMap.get(`${node.x},${node.y}`);
        eq(n2.captured, true, 'capture persists');
        eq(n2.predatorOwned, false, 'ownership persists');
    }
});

group('the reload exploit');
check('a converted recruit is not handed back on reload', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, 0, 40);
    const recruits = a.sandbox.actors.filter(x => x.spawnKey !== undefined);
    ok(recruits.length >= 2, 'fixture needs recruits, got ' + recruits.length);
    // Convert one and kill another, as play would.
    recruits[0].team = 'green';
    recruits[1].dead = true;
    a.run('saveSession()');
    const stillRed = recruits.filter(r => r.team === 'red' && !r.dead).length;

    const b = makeCtx(); b.run('initWorldSeed()');
    b.run('restoredNpcKeys = new Set(loadSession().npcs)');
    generate(b, 0, 40);
    const back = b.sandbox.actors.filter(x => x.spawnKey !== undefined).length;
    eq(back, stillRed, 'reload should only bring back the recruits still standing');
    ok(!b.sandbox.actors.some(x => x.spawnKey === recruits[0].spawnKey), 'the converted one came back');
    ok(!b.sandbox.actors.some(x => x.spawnKey === recruits[1].spawnKey), 'the dead one came back');
});
check('skipping a recruit does not shift the rest of the segment', () => {
    // The recruit is built either way so the segment's random stream stays
    // aligned; skipping only the push keeps terrain identical.
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, 0, 30);
    const withAll = terrain(a.sandbox);
    const b = makeCtx(); b.run('initWorldSeed()');
    b.run('restoredNpcKeys = new Set()');      // suppress every recruit
    generate(b, 0, 30);
    eq(terrain(b.sandbox), withAll, 'terrain shifted when recruits were suppressed');
});
check('a fresh game spawns recruits normally', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()');
    a.run('restoredNpcKeys = null');
    generate(a, 0, 40);
    ok(a.sandbox.actors.some(x => x.spawnKey !== undefined), 'no recruits on a fresh game');
});

group('robustness');
check('no saved session is not an error', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, 0, 20);
    eq(a.run('loadSession()'), null, 'no session');
    a.run('applySession(null)');            // must not throw
    a.run('applySession(loadSession())');
});
check('a corrupt session is ignored rather than thrown', () => {
    store = { tubecrawler_session: '{not json' };
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, 0, 20);
    eq(a.run('loadSession()'), null, 'corrupt payload should read as null');
});
check('a session referring to tiles that no longer exist is survivable', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, 0, 20);
    store.tubecrawler_session = JSON.stringify({
        px: 5, py: 1, health: 50, lastGenX: 10, explored: [0],
        nests:  [{ x: 9999, y: -1, h: 10, cx: 8888, cy: 3 }],
        panels: [{ x: 9999, y: 0, a: true, r: 5, n: 1, d: false }],
        nodes:  [{ x: 9999, y: 2, c: true, p: false }],
        npcs: [],
    });
    a.run('applySession(loadSession())');   // must not throw
    eq(a.sandbox.player.x, 5, 'the parts that do resolve still apply');
});
check('clearing wipes the session', () => {
    store = {};
    const a = makeCtx(); a.run('initWorldSeed()'); generate(a, 0, 20);
    a.run('saveSession()');
    ok(store.tubecrawler_session, 'saved');
    a.run('clearSession()');
    eq(a.run('loadSession()'), null, 'cleared');
});
check('restartGame clears both the session and the seed', () => {
    const waves = fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8');
    const fn = waves.slice(waves.indexOf('function restartGame'), waves.indexOf('function restartGame') + 1200);
    ok(/clearSession\(\)/.test(fn), 'restartGame does not clear the session');
    ok(/clearWorldSeed\(\)/.test(fn), 'restartGame does not clear the world seed');
});
check('the game autosaves rather than only saving at wave transitions', () => {
    const game = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
    ok(/saveSession\(\);\s*savePylons\(\)/.test(game), 'no autosave tick in the render loop');
    const input = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
    ok(/pagehide/.test(input), 'nothing saves when the page is hidden');
});

// ─────────────────────────────────────────────────────────
//  THE WHOLE WORLD COMES BACK
// ─────────────────────────────────────────────────────────
// REPORTED: "sometimes when I refresh the game, the later zones do not appear."
//
// The checks above drive the save and restore functions directly. This bug was
// not in either of them — it was in the ORDER init.js runs them, so it needs
// the real page, booted twice against one localStorage.
//
// Boot builds columns 0..79. Clearing a wave extends the tunnel by ZONE_LENGTH
// and pushes lastGenX out with it, so a few waves in it stands at 109. The
// session restore then did `lastGenX = Math.max(lastGenX, sess.lastGenX)`,
// moving the marker to 109 over ground that stopped at 79 — and nothing ever
// filled the gap, because the only other generator appends PAST lastGenX and
// never behind it.
//
// Measured before the fix: thirty columns missing, and with them eight saved
// pylons and a nest already taken, because each restore looks its tile up in
// worldTileMap and silently skips what is not there.
const { scriptOrder, makeBrowserSandbox } = require('./domstub.js');

async function bootPage(store) {
    const sandbox = makeBrowserSandbox(store);
    const ctx = vm.createContext(sandbox);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); }
        catch (e) { /* DOM-heavy init is noisy under stubs */ }
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    return { run: e => vm.runInContext(e, ctx), sandbox };
}

// What the world IS, in a form two boots can be compared by.
const SNAPSHOT = `(function(){
    const cols = [...new Set(world.map(t => t.x))].sort((a, b) => a - b);
    const gaps = [];
    for (let x = cols[0]; x <= lastGenX; x++) if (!world.some(t => t.x === x)) gaps.push(x);
    return {
        lastGenX, tiles: world.length,
        minX: cols[0], maxX: cols[cols.length - 1], gaps: gaps.length,
        gapFrom: gaps.length ? gaps[0] : null,
        gapTo: gaps.length ? gaps[gaps.length - 1] : null,
        zones: [...new Set(world.filter(t => t.type === 'floor')
                                .map(t => Math.floor(t.x / ZONE_LENGTH)))].sort((a, b) => a - b).join(','),
        pylonsFar: world.filter(t => t.pillar && !t.destroyed && t.x > 85).length,
        deadNestsFar: world.filter(t => t.nest && t.nestHealth <= 0 && t.x > 85).length,
    };
})()`;

(async () => {
    group('a refresh gives back the world you left');

    const store = {};
    const A = await bootPage(store);
    // Play forward the way clearing waves does: extend the tunnel, build out
    // there, and take a nest out there.
    const before = A.run(`(function(){
        for (let i = 0; i < 4; i++) {
            if (activeDayZones < 5) {
                activeDayZones++;
                const baseX = lastGenX;
                for (let k = 1; k <= ZONE_LENGTH; k++) generateSegment(baseX + k);
            }
        }
        const far = world.find(t => t.x > 85 && t.y === 3 && t.type === 'floor' && !t.pillar);
        if (far) {
            far.pillar = true; far.destroyed = false; far.pillarTeam = 'green';
            far.health = 20; far.maxHealth = 20; far.pillarCol = '#0f8';
        }
        const farNest = world.find(t => t.nest && t.x > 85);
        if (farNest) farNest.nestHealth = 0;
        savePylons(); saveNests(); saveGameState(); saveSession();
        return ${SNAPSHOT};
    })()`);

    const B = await bootPage(store);
    const after = B.run(SNAPSHOT);

    check('fixture: the game really did dig past the opening columns', () => {
        const opening = Number(fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8')
            .match(/const WORLD_OPENING_COLUMNS = (\d+)/)[1]);
        ok(before.lastGenX > opening,
           `the frontier only reached ${before.lastGenX}, inside the opening ${opening}`);
        ok(before.pylonsFar > 0, 'fixture: nothing was built out in the new ground');
        ok(before.deadNestsFar > 0, 'fixture: no nest was taken out in the new ground');
    });

    check('THE ASK: no column between here and the frontier is missing', () => {
        eq(after.gaps, 0,
             `${after.gaps} columns missing, ${after.gapFrom}..${after.gapTo}, with lastGenX at ${after.lastGenX}`);
    });

    check('the later zones are all still there', () => {
        eq(after.zones, before.zones, 'the zones the player could walk to changed');
        eq(after.maxX, before.maxX, 'the tunnel got shorter');
        eq(after.tiles, before.tiles, 'the world came back a different size');
    });

    check('and so is everything built in them', () => {
        // The real cost of the hole: the restores look their tiles up in
        // worldTileMap, so a pylon on ground that was never rebuilt is dropped
        // without a word.
        eq(after.pylonsFar, before.pylonsFar, 'pylons in the later zones were lost');
        eq(after.deadNestsFar, before.deadNestsFar, 'a nest already taken came back');
    });

    check('the frontier marker is never set without building the ground', () => {
        const WORLD = fs.readFileSync(path.join(ROOT, 'js/world.js'), 'utf8');
        const SAVE  = fs.readFileSync(path.join(ROOT, 'js/save.js'), 'utf8');
        const INIT  = fs.readFileSync(path.join(ROOT, 'js/init.js'), 'utf8');
        ok(/function ensureWorldTo/.test(WORLD), 'there is no way to ask for ground');
        ok(!/lastGenX = Math\.max\(lastGenX, sess\.lastGenX\)/.test(SAVE),
           'the session restore still moves the marker over ground it did not build');
        ok(/ensureWorldTo/.test(SAVE), 'the session restore does not build the ground it claims');
        ok(/ensureWorldTo\(session\.lastGenX\)/.test(INIT),
           'boot does not follow the saved frontier out');
        // ...and it has to happen BEFORE anything is restored onto that ground.
        ok(INIT.indexOf('ensureWorldTo') < INIT.indexOf('loadPylons()'),
           'the ground is built after the pylons are restored onto it');
        ok(INIT.indexOf('ensureWorldTo') < INIT.indexOf('applyNests'),
           'the ground is built after the nests are restored onto it');
    });

    group('a refresh keeps a nest that is being paid for');

    // Through the REAL save and the REAL boot: the fixtures prove the serialiser
    // round-trips, not that saveSession writes it and applySession reads it.
    // saveSession's whole body sits in one try/catch, so a throw in the new field
    // would silently lose the entire session — that is what this guards.
    await check('THE ASK: mass already carried into a site is still there after a refresh', async () => {
        const st = {};
        const a = await bootPage(st);
        a.run(`(function(){
            const t = world.find(x => x.x === 40 && x.y === 3 && x.type === 'floor');
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'red', pillarCol: '#ff3344',
                               health: 40, maxHealth: 40 });
            _cacheAge = -999;
            const site = planNestNear(t, null);
            if (!site) throw new Error('fixture: no site could be planned at (40,3)');
            site.mass = 11;
            savePylons(); saveSession();
        })()`);
        const b = await bootPage(st);
        const r = b.run(`({ n: nestSites.length,
                            mass: nestSites[0] ? nestSites[0].mass : null,
                            at: nestSites[0] ? [nestSites[0].anchor.x, nestSites[0].anchor.y] : null,
                            flagged: !!(nestSites[0] && nestSites[0].tile._nestSite) })`);
        eq(r.n, 1, 'the site did not survive the refresh');
        eq(r.mass, 11, 'what had been paid into it was lost');
        eq(r.at.join(','), '40,3', 'it came back hanging off the wrong pylon');
        eq(r.flagged, true, 'its tile no longer knows it is a site, so it would not draw');
    });

    await check('THE ASK: a nest that has been BUILT is still there after a refresh, at the health it had', async () => {
        // It cost 20 mass. The world regenerates on load, so the tile is plain
        // floor again until something marks it — and the cocoon used to be left
        // standing with its nest gone, on a pylon that is already red, so nothing
        // would ever build it a second time.
        const st = {};
        const a = await bootPage(st);
        a.run(`(function(){
            const t = world.find(x => x.x === 40 && x.y === 3 && x.type === 'floor');
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'red', pillarCol: '#ff3344',
                               health: 40, maxHealth: 40 });
            _cacheAge = -999;
            convertPylonToRed(t, { speciesName: 'ant', className: 'scout', color: '#a5f' });
            nestSites.forEach(s => { s.mass = NEST_BUILD_COST; });
            _lastNestGrowFrame = -1e9; nestSiteTick();
            const n = world.find(x => x._infestNest && x.nest);
            n.nestHealth = 77;
            savePylons(); saveNests(); saveSession();
        })()`);
        const b = await bootPage(st);
        const r = b.run(`(function(){
            const n = world.find(x => x._infestNest && x.nest);
            return { found: !!n, health: n ? n.nestHealth : null, zone: n ? n.nestZone : null,
                     sites: nestSites.length,
                     owned: !!(n && cocoons.some(m => m.nest === n)) };
        })()`);
        eq(r.found, true, 'the nest that was paid for vanished on refresh');
        eq(r.health, 77, 'it came back at the wrong health');
        eq(r.owned, true, 'its cocoon no longer owns it, so reclaiming would leave it behind');
        eq(r.sites, 0, 'a built nest came back as a site as well');
    });

    await check('a nest a fire worker BURNED OUT stays out after a refresh', async () => {
        // The cocoon still points at the tile after the nest is killed, so a
        // restore that trusts the reference brings it back at full health.
        const st = {};
        const a = await bootPage(st);
        a.run(`(function(){
            const t = world.find(x => x.x === 40 && x.y === 3 && x.type === 'floor');
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'red', pillarCol: '#ff3344',
                               health: 40, maxHealth: 40 });
            _cacheAge = -999;
            convertPylonToRed(t, { speciesName: 'ant', className: 'scout', color: '#a5f' });
            nestSites.forEach(s => { s.mass = NEST_BUILD_COST; });
            _lastNestGrowFrame = -1e9; nestSiteTick();
            _killGrownNest(world.find(x => x._infestNest && x.nest));
            savePylons(); saveNests(); saveSession();
        })()`);
        const b = await bootPage(st);
        eq(b.run('world.filter(x => x._infestNest && x.nest).length'), 0,
           'a burned-out nest was resurrected by the refresh');
    });

    await check('and a site whose pylon is no longer theirs does not come back', async () => {
        const st = {};
        const a = await bootPage(st);
        a.run(`(function(){
            const t = world.find(x => x.x === 40 && x.y === 3 && x.type === 'floor');
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'red', pillarCol: '#ff3344',
                               health: 40, maxHealth: 40 });
            _cacheAge = -999;
            planNestNear(t, null).mass = 6;
            saveSession();
            // The player takes it back before the next load.
            t.pillarTeam = 'green'; savePylons();
        })()`);
        const b = await bootPage(st);
        eq(b.run('nestSites.length'), 0, 'a site for a pylon the player holds came back');
        // nestSiteTick would sweep a stale site up on the first frame anyway, so
        // the count alone cannot tell the restore guard from that sweep. What
        // tells them apart is the refund: the sweep hands the stockpile back as a
        // lump, and a site restored only to be swept would mint one that was
        // already returned when the pylon was retaken.
        eq(b.run('chargedMass.length'), 0, 'a stale site was restored and then refunded a second time');
    });

    check('a corrupt frontier cannot hang the boot', () => {
        const C = A.run(`(function(){
            const was = lastGenX;
            const built = ensureWorldTo(1e9);
            const got = lastGenX;
            return { was, built, got };
        })()`);
        ok(C.built > 0, 'it refused to build anything at all');
        ok(C.built < 10000, `it built ${C.built} columns before stopping`);
        ok(C.got > C.was, 'the frontier did not move');
    });

    // ─────────────────────────────────────────────────────
    group('a refresh resumes the wave you were on');

    // REPORTED: "whenever I refresh the game, it forgets what wave I'm on and
    // resets it to the beginning."
    //
    // It did not forget. nightNumber comes back out of tubecrawler_gamestate
    // and always did. What reset was what the player READS: the objective line
    // is written into game.html as a placeholder — "WAVE 1 — clear panels for
    // shards" — and nothing on the boot path ever rewrote it, so it sat there
    // saying WAVE 1 until an alarm or a wave clear happened along. Underneath,
    // the fight itself really was lost: the phase, the kill count and the alarm
    // were in no save at all.
    const PLACEHOLDER = (() => {
        const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');
        const m = HTML.match(/<div id="waveInfo">([^<]*)<\/div>/);
        ok(!!m, 'the objective line is no longer in game.html');
        return m[1];
    })();

    // Play to a given state, save, and boot again. Returns what the second boot
    // came back with.
    async function refreshFrom(setup) {
        const st = {};
        const a = await bootPage(st);
        a.run(`(function(){ ${setup} saveGameState(); saveSession(); })()`);
        const b = await bootPage(st);
        return b.run(`({ wave: gameState.nightNumber, phase: gameState.phase,
                         cleared: gameState.highestZoneCleared,
                         alarm: !!alertActive, alertZone, alertType,
                         kills: nightKillCount, target: nightEnemiesTarget,
                         banner: waveUI ? String(waveUI.textContent) : null })`);
    }

    check('fixture: game.html really does ship a WAVE 1 placeholder', () => {
        ok(/WAVE 1/i.test(PLACEHOLDER),
           'the placeholder no longer says WAVE 1, so this group is testing nothing: ' + PLACEHOLDER);
    });

    await check('THE ASK: the line names where you are, not the placeholder', async () => {
        const r = await refreshFrom('gameState.nightNumber = 7; gameState.highestZoneCleared = 3;');
        eq(r.wave, 7, 'the wave number itself was lost');
        ok(r.banner !== PLACEHOLDER,
           'the objective line is still the placeholder after a refresh');
        ok(/ZONE 3 TAKEN/.test(r.banner), 'it does not say what has been taken: ' + r.banner);
        ok(/NEXT: ZONE 4/.test(r.banner), 'nor where to go next: ' + r.banner);
    });

    await check('and on a brand new game it is not the placeholder either', async () => {
        const st = {};
        const a = await bootPage(st);
        const banner = a.run('waveUI ? String(waveUI.textContent) : null');
        ok(banner !== PLACEHOLDER, 'a fresh game still shows the raw placeholder');
        ok(/HOME SECURE/.test(banner), 'a fresh game should start from home: ' + banner);
    });

    await check('THE FIGHT: a refresh mid-wave puts you back in it', async () => {
        const r = await refreshFrom(`
            const nest = world.find(t => t.nest && t.nestZone === 2);
            triggerAlarm('proximity', nest.x, nest.y);
            nightEnemiesTarget = 9; nightKillCount = 4;
        `);
        eq(r.phase, 'night', 'the fight was dropped back to day');
        eq(r.alarm, true, 'the alarm was lost');
        eq(r.alertZone, 2, 'the alarm forgot which zone it was for');
        eq(r.alertType, 'proximity', 'and what tripped it');
        eq(r.kills, 4, 'the kill count went back to zero');
        eq(r.target, 9, 'and the quota with it');
        ok(/4\/9/.test(r.banner), 'the line does not show the fight: ' + r.banner);
    });

    await check('an alarm with no time left does NOT come back', async () => {
        // Restoring an expired alarm leaves a siren nothing will ever switch
        // off, because the thing that clears it is the timer running out.
        const r = await refreshFrom(`
            const nest = world.find(t => t.nest && t.nestZone === 2);
            triggerAlarm('zone', nest.x, nest.y);
            alertTimer = 0;
        `);
        eq(r.alarm, false, 'an expired alarm was restored');
    });

    await check('a save written before any of this still loads', async () => {
        // Every returning player has one. It carries no fight block at all.
        const st = {};
        const a = await bootPage(st);
        a.run(`(function(){
            gameState.nightNumber = 5; gameState.highestZoneCleared = 2;
            saveGameState(); saveSession();
            const s = JSON.parse(localStorage.getItem('tubecrawler_session'));
            delete s.fight;
            localStorage.setItem('tubecrawler_session', JSON.stringify(s));
        })()`);
        const b = await bootPage(st);
        const r = b.run(`({ wave: gameState.nightNumber, phase: gameState.phase,
                            alarm: !!alertActive,
                            banner: waveUI ? String(waveUI.textContent) : null })`);
        eq(r.wave, 5, 'an older save lost its wave number');
        eq(r.phase, 'day', 'it should resume quietly, not in a half-restored fight');
        eq(r.alarm, false, 'it should not come back under alarm');
        ok(/ZONE 2 TAKEN/.test(r.banner), 'the line is wrong on an older save: ' + r.banner);
    });

    await check('junk in the fight block is ignored rather than thrown', async () => {
        const st = {};
        const a = await bootPage(st);
        a.run(`(function(){
            gameState.nightNumber = 4; saveGameState(); saveSession();
            const s = JSON.parse(localStorage.getItem('tubecrawler_session'));
            s.fight = { phase: 'elevenses', kills: 'lots', target: null,
                        alertActive: 'yes', alertTimer: 'soon', alertZone: {} };
            localStorage.setItem('tubecrawler_session', JSON.stringify(s));
        })()`);
        const b = await bootPage(st);
        const r = b.run(`({ phase: gameState.phase, alarm: !!alertActive,
                            kills: nightKillCount, target: nightEnemiesTarget,
                            wave: gameState.nightNumber })`);
        eq(r.wave, 4, 'a junk fight block took the wave number with it');
        eq(r.phase, 'day', 'a nonsense phase was accepted: ' + r.phase);
        eq(r.alarm, false, 'a nonsense alarm was raised');
        eq(r.kills, 0, 'a nonsense kill count was accepted');
    });

    check('the boot refreshes the line LAST, once it has something to say', () => {
        const INIT = fs.readFileSync(path.join(ROOT, 'js/init.js'), 'utf8');
        ok(/updateObjectiveUI\(\)/.test(INIT), 'the boot never refreshes the objective line');
        ok(INIT.indexOf('applySession(session)') < INIT.indexOf('updateObjectiveUI()'),
           'the line is written before the session it describes has been restored');
    });

    check('asking for ground already there is free', () => {
        const r = A.run('ensureWorldTo(1)');
        eq(r, 0, 'it rebuilt ' + r + ' columns that already existed');
        eq(A.run('ensureWorldTo(undefined)'), 0, 'a missing frontier built something');
        eq(A.run('ensureWorldTo(NaN)'), 0, 'a NaN frontier built something');
    });

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
})();
