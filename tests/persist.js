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
        unlockedElements: new Set(['fire', 'electric']),
        cfg: { pillarSpawnRate: 0.15, npcSpawnRate: 0.22 },
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
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
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

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
