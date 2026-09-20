// THE REPORTED CASE: hitting RESET GAME leaves the map with no recruits on it.
//
// generateSegment() suppresses a recruit whose segment is absent from
// restoredNpcKeys — that is how a refresh avoids handing back a recruit you
// already converted or killed. restartGame() never cleared it, so a reset
// rebuilt the world while still filtering against the *previous* game's
// survivors. Recruit most of them and the set is nearly empty, so the fresh
// map comes up nearly empty too.
//
// Two more things restartGame got wrong, both found while confirming the above:
//   - it calls clearWorldSeed() and never re-seeds, so every reset builds the
//     same world from seed 0 and nothing is written to storage for the next
//     refresh to resume from;
//   - it generates x = -6..20 while the camp reaches back to CAMP_MIN_X (-14),
//     leaving four of the six base building sites with no floor under them.
//
// These run the real restartGame() out of js/waves.js.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const WAVES = fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8');
const CAMP  = fs.readFileSync(path.join(ROOT, 'js/camp.js'),  'utf8');

let store = {};
// world.js stamps every tile with the one pylon look; read it out of config.js
// rather than copying the string.
function _pylonStyle() {
    const src = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
    const m = src.match(/const PYLON_STYLE = "([^"]+)"/);
    if (!m) { console.log('  FAIL config.js no longer defines PYLON_STYLE'); process.exit(1); }
    return m[1];
}

function makeEnv() {
    const sandbox = {
        console, Math, JSON, Object, Array, String, Number, Set, Map,
        isNaN, isFinite, parseInt, parseFloat,
        world: [], worldTileMap: new Map(), actors: [], followers: [],
        capturedNodes: [], signalTowers: [], projectiles: [], fragments: [],
        smoke: [], shards: [], elementEffects: [], floatingTexts: [],
        followerProjectiles: [], pendingPillarDestruction: [], respawnQueue: [],
        traps: [], _pillarCache: [], _wPylons: [], _aPylons: [], _uPylons: [],
        _wPylonPairs: [], _capturableNodeCache: [], _pylonsWithPartner: new Set(),
        _genPylons: [], _genLinks: [],
        exploredZones: new Set(), boughtItems: new Set(), permUpgrades: new Set(),
        unlockedElements: new Set(['fire', 'electric']),
        dayStats: { redSpawned: 0, redConverted: 0 },
        gameState: { phase: 'day', nightNumber: 1, running: true },
        networkStrength: {}, networkIntegrity: {}, _prevNetworkTiers: {},
        followerByElement: {}, zonePredators: {}, zoneRespawnTimers: {},
        activeDayZones: 3, ZONE_LENGTH: 15, lastGenX: 0, _cacheAge: 0,
        frame: 0, shake: 0, shardCount: 0, health: 100,
        pylonMaxHPBonus: 0, pylonRangeBonus: 0, pylonFireRateBonus: 0,
        followerPermPowerBonus: 0, followerPermHPBonus: 0,
        nightKillCount: 0, nightEnemiesTarget: 0, nightPredatorsRemaining: 0,
        alertActive: false, alertTimer: 0, alertType: null, alertSource: null, alertZone: null,
        activePredator: null, predatorRespawnTimer: 0,
        ELEMENTS: ['fire', 'ice', 'electric', 'core', 'flux', 'toxic'].map(id => ({ id })),
        cfg: { pillarSpawnRate: 0.15, npcSpawnRate: 0.22 },
        PYLON_STYLE: _pylonStyle(),
        PLAYER_AMMO_START: 12, PLAYER_AMMO_MAX: 60, playerAmmo: 0,
        NPC_TYPES: { virus: { moveSpeed: 0.02 }, lobster: { moveSpeed: 0.02 }, turtle: { moveSpeed: 0.02 } },
        PERSONALITY_KEYS: ['aggressive', 'cautious', 'cunning', 'stoic', 'wild'],
        COMBAT_TRAITS: { a: {}, b: {} }, NATURAL_TRAITS: { a: {}, b: {} }, PERKS: { a: {}, b: {} },
        applyPersonality: () => ({ hp: 20, defense: 10, attack: 10, speed: 10,
                                   specialAttack: 10, accuracy: 10, will: 20, resonance: 0 }),
        assignRole: () => 'brawler',
        player: { x: 2, y: 1, targetX: 2, targetY: 1, visualX: 2, visualY: 1 },
        crystal: { x: 0, y: 2 },
        canvas: { width: 800, height: 600 },
        // restartGame's outward-facing bits, and the neighbours it leans on.
        spawnHazardsForDay() { sandbox.hazardDays++; },
        clearCampBuildings() { sandbox.campCleared++; },
        hazardDays: 0, campCleared: 0,
        waveUI: { textContent: '' },
        document: { getElementById: () => ({ classList: { remove() {}, add() {} } }) },
        localStorage: {
            getItem(k) { return k in store ? store[k] : null; },
            setItem(k, v) { store[k] = String(v); },
            removeItem(k) { delete store[k]; },
        },
    };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    for (const f of ['js/rng.js', 'js/mass.js', 'js/world.js', 'js/save.js']) {
        vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
    }
    // The real restartGame and the shared reset it calls, lifted out of waves.js.
    for (const name of ['resetTransientState', 'restartGame']) {
        const fn = WAVES.match(new RegExp(`function ${name}\\(\\) \\{[\\s\\S]*?\\n\\}`));
        if (!fn) { console.log(`  FAIL could not find ${name} in js/waves.js`); process.exit(1); }
        vm.runInContext(fn[0], ctx, { filename: 'waves.js:' + name });
    }
    // ...and CAMP_MIN_X plus the building footprints, so this suite tracks the
    // camp's real extent rather than a copy of it.
    const extent = CAMP.match(/const CAMP_MIN_X = -?\d+;/);
    const tiles  = CAMP.match(/const _CAMP_BLDG_TILES = \{[\s\S]*?\n\};/);
    if (!extent || !tiles) { console.log('  FAIL could not find the camp extent in js/camp.js'); process.exit(1); }
    vm.runInContext(extent[0] + '\n' + tiles[0], ctx, { filename: 'camp.js:extent' });
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

const recruits = env => env.sandbox.actors.filter(a => a.team === 'red' || a.isNPC || a.spawnKey !== undefined);

// A fixed seed so the fixture always has the same recruits to take off the
// board. The reset path mints its own, which is what the seed checks below
// exercise.
const FIXTURE_SEED = '123456789';

// A game that has been played: a world, then most of its recruits taken off
// the board, then saved. This is the state RESET GAME is pressed from.
function playedSession() {
    store = { tubecrawler_seed: FIXTURE_SEED };
    const env = makeEnv();
    env.run('initWorldSeed()');
    for (let i = -14; i < 0; i++) env.run(`generateSegment(${i})`);
    for (let i = 0; i < 40; i++) env.run(`generateSegment(${i})`);
    const found = recruits(env);
    ok(found.length > 3, `fixture needs recruits to start with, got ${found.length}`);
    // Convert or kill all but one, the way a night of play would.
    found.slice(1).forEach(a => { a.dead = true; });
    env.sandbox.actors.length = 0;
    env.sandbox.actors.push(found[0]);
    env.run('saveSession()');
    return { env, before: found.length };
}

// Reload the page on that save — this is what sets restoredNpcKeys.
function reloadOn(env) {
    const fresh = makeEnv();
    fresh.run('initWorldSeed()');
    const session = fresh.run('loadSession()');
    fresh.run(`restoredNpcKeys = new Set(${JSON.stringify(session.npcs || [])})`);
    for (let i = -14; i < 0; i++) fresh.run(`generateSegment(${i})`);
    for (let i = 0; i < 40; i++) fresh.run(`generateSegment(${i})`);
    return fresh;
}

group('resetting after a game has been played');

// How many recruits a never-played world built from `seed` holds. A reset mints
// its own random seed, and some seeds honestly carry only two or three recruits
// across the three active day zones, so no fixed count can be asserted — the
// comparison has to be against the same world with no history behind it.
function virginCount(seed) {
    const virgin = makeEnv();
    virgin.run(`worldSeed = ${seed}`);
    for (let i = -14; i < 0; i++) virgin.run(`generateSegment(${i})`);
    for (let i = 0; i < 80; i++) virgin.run(`generateSegment(${i})`);
    return recruits(virgin).length;
}

check('THE REPORTED CASE: a reset map has recruits on it', () => {
    // Several resets, because one map's recruit count is a property of its
    // random seed. What must hold every time is that the reset map carries
    // exactly what a first-ever load of that same world would.
    let total = 0;
    for (let n = 0; n < 5; n++) {
        const loaded = reloadOn(playedSession().env);
        ok(recruits(loaded).length <= 1, 'fixture: the reload should be down to one survivor');
        loaded.run('restartGame()');
        const after = recruits(loaded).length;
        const virgin = virginCount(loaded.run('worldSeed'));
        eq(after, virgin, `reset map holds ${after} recruits where a fresh load of that world holds ${virgin}`);
        total += after;
    }
    // With the bug every reset came up at 0 while a fresh load gave ~10, so the
    // equality above is the real check; this guards the degenerate case where
    // both sides are empty for some other reason.
    ok(total > 10, `five resets produced ${total} recruits between them`);
});

check('the previous game\'s survivors no longer filter the new one', () => {
    const { env } = playedSession();
    const loaded = reloadOn(env);
    loaded.run('restartGame()');
    eq(loaded.run('restoredNpcKeys'), null,
       'restoredNpcKeys still holds the last game\'s survivors');
});

check('a reset counts its recruits as freshly spawned', () => {
    const { env } = playedSession();
    const loaded = reloadOn(env);
    loaded.run('restartGame()');
    for (let i = loaded.sandbox.lastGenX + 1; i < 40; i++) loaded.run(`generateSegment(${i})`);
    eq(loaded.sandbox.dayStats.redSpawned, recruits(loaded).length,
       'redSpawned should match what is actually on the map');
});

check('resetting twice in a row still populates the map', () => {
    const { env } = playedSession();
    const loaded = reloadOn(env);
    loaded.run('restartGame()');
    loaded.run('restartGame()');
    eq(recruits(loaded).length, virginCount(loaded.run('worldSeed')),
       'the second reset did not match a fresh load of its own world');
});

group('the world a reset builds');

check('a reset re-seeds instead of leaving the seed at zero', () => {
    const { env } = playedSession();
    const loaded = reloadOn(env);
    loaded.run('restartGame()');
    ok(loaded.run('worldSeed') !== 0, 'worldSeed left at 0 — every reset builds the same map');
    ok(store['tubecrawler_seed'], 'nothing stored, so the next refresh cannot rebuild this map');
    eq(Number(store['tubecrawler_seed']), loaded.run('worldSeed'), 'stored seed should be the live one');
});

check('two resets do not hand back the same map', () => {
    const a = reloadOn(playedSession().env);
    a.run('restartGame()');
    const seedA = a.run('worldSeed');
    // A separate played game, since the first reset wiped that save.
    const b = reloadOn(playedSession().env);
    b.run('restartGame()');
    ok(b.run('worldSeed') !== seedA, 'both resets produced the same seed');
});

check('the map a reset leaves is the one a refresh rebuilds', () => {
    const { env } = playedSession();
    const loaded = reloadOn(env);
    loaded.run('restartGame()');
    const fingerprint = w => new Map(w.filter(t => t.x >= 0 && t.x < 20)
        .map(t => [`${t.x},${t.y}`,
                   [t.pillar ? 1 : 0, t.nest ? 1 : 0, t.nodeType || ''].join(':')]));
    const after = fingerprint(loaded.sandbox.world);
    // Now refresh: a new page load reads the stored seed.
    const refreshed = makeEnv();
    refreshed.run('initWorldSeed()');
    for (let i = -14; i < 0; i++) refreshed.run(`generateSegment(${i})`);
    for (let i = 0; i < 20; i++) refreshed.run(`generateSegment(${i})`);
    const now = fingerprint(refreshed.sandbox.world);
    const diff = [...after].filter(([k, v]) => now.get(k) !== v).map(([k]) => k);
    eq(diff.length, 0,
       `refreshing after a reset built a different map: ${diff.length} tiles differ, e.g. ${diff.slice(0, 5).join(' ')}`);
});

group('the camp a reset builds');

check('every base building site has floor under it', () => {
    const { env } = playedSession();
    const loaded = reloadOn(env);
    loaded.run('restartGame()');
    const tiles = loaded.run('_CAMP_BLDG_TILES');
    const have = new Set(loaded.sandbox.world.map(t => `${t.x},${t.y}`));
    const missing = [];
    for (const [id, b] of Object.entries(tiles)) {
        for (let dx = 0; dx < (b.w || 1); dx++)
            for (let dy = 0; dy < (b.h || 1); dy++)
                if (!have.has(`${b.x + dx},${b.y + dy}`)) missing.push(`${id}@${b.x + dx},${b.y + dy}`);
    }
    eq(missing.length, 0, `building sites with no ground under them: ${missing.slice(0, 6).join(' ')}`);
});

check('the reset reaches as far back as the camp does', () => {
    const { env } = playedSession();
    const loaded = reloadOn(env);
    loaded.run('restartGame()');
    const minX = Math.min(...loaded.sandbox.world.map(t => t.x));
    eq(minX, loaded.run('CAMP_MIN_X'), 'reset should generate the whole camp, not part of it');
});

check('a reset generates the same span a fresh page load does', () => {
    // init.js is the reference: whatever it lays down, a reset should match, or
    // the two entry points drift apart again.
    const INIT = fs.readFileSync(path.join(ROOT, 'js/init.js'), 'utf8');
    const back = INIT.match(/for \(let i = (CAMP_MIN_X|-?\d+); i < 0; i\+\+\) generateSegment\(i\)/);
    const fwd  = INIT.match(/for \(let i = 0; i < (\d+); i\+\+\) generateSegment\(i\)/);
    ok(back && fwd, 'could not read init.js\'s generation span');
    ok(/for \(let i=CAMP_MIN_X;i<0;i\+\+\) generateSegment\(i\)/.test(WAVES.replace(/ /g, '')
        .replace(/for\(leti=/g, 'for (let i=')) ||
       WAVES.includes('CAMP_MIN_X'),
       'restartGame should generate back to CAMP_MIN_X, as init.js does');
    const rFwd = WAVES.match(/function restartGame[\s\S]*?for \(let i=0;i<(\d+);i\+\+\) generateSegment\(i\)/);
    ok(rFwd, 'could not read restartGame\'s forward span');
    ok(Number(rFwd[1]) >= Number(fwd[1]),
       `restart generates ${rFwd[1]} segments forward, a fresh load generates ${fwd[1]}`);
});

group('what a reset clears');

check('a reset wipes the save so a refresh does not resurrect the old game', () => {
    const { env } = playedSession();
    const loaded = reloadOn(env);
    loaded.run('restartGame()');
    eq(loaded.run('loadSession()'), null, 'the old session survived a reset');
});

check('charged mass from the old game does not litter the new map', () => {
    const loaded = reloadOn(playedSession().env);
    loaded.run('spawnChargedMass(5, 2, 10)');
    ok(loaded.run('chargedMass').length > 0, 'fixture: should have a lump on the floor');
    loaded.run('restartGame()');
    eq(loaded.run('chargedMass').length, 0, 'lumps from the previous game survived the reset');
});

check('a reset restores health and the opening ammo allowance', () => {
    const loaded = reloadOn(playedSession().env);
    loaded.run('health = 12; playerAmmo = 1');
    loaded.run('restartGame()');
    eq(loaded.run('health'), 100, 'health should be full again');
    eq(loaded.run('playerAmmo'), loaded.run('PLAYER_AMMO_START'),
       'ammo should be back to the opening allowance');
});

check('no pointer survives into the world the reset threw away', () => {
    const loaded = reloadOn(playedSession().env);
    const ghost = { x: 3, y: 2, dead: false };
    loaded.sandbox.commandEnemyTarget    = ghost;
    loaded.sandbox.commandFollowerTarget = ghost;
    loaded.sandbox.infoPanelTarget       = ghost;
    loaded.sandbox.pendingConnectNest    = ghost;
    loaded.run('playerAttackMode = true; infoPanelOpen = true; holdLineX = 9');
    loaded.run('restartGame()');
    for (const name of ['commandEnemyTarget', 'commandFollowerTarget',
                        'infoPanelTarget', 'pendingConnectNest', 'holdLineX']) {
        eq(loaded.run(name), null, `${name} still points into the old world`);
    }
    eq(loaded.run('playerAttackMode'), false, 'attack mode should be off after a reset');
    eq(loaded.run('infoPanelOpen'), false, 'the info panel should be closed after a reset');
});

check('nextWave and restartGame share one reset, so they cannot drift', () => {
    const calls = (WAVES.match(/resetTransientState\(\)/g) || []).length;
    ok(calls >= 3, `expected the helper plus two callers, found ${calls} mentions`);
    const nw = WAVES.slice(WAVES.indexOf('function nextWave()'));
    ok(nw.slice(0, nw.indexOf('function restartGame')).includes('resetTransientState()'),
       'nextWave should call the shared reset');
    ok(WAVES.slice(WAVES.indexOf('function restartGame')).includes('resetTransientState()'),
       'restartGame should call the shared reset');
});

check('the generator caches are cleared too', () => {
    // Stale _genLinks would point at pylons in the world that was thrown away,
    // and the heal tick walks that list every interval.
    const loaded = reloadOn(playedSession().env);
    loaded.run('_genPylons = [{ x: 1, y: 1 }]; _genLinks = [{ gen: {}, pylon: {} }]');
    loaded.run('restartGame()');
    eq(loaded.run('_genPylons').length, 0, 'generator cache survived a reset');
    eq(loaded.run('_genLinks').length, 0, 'generator links survived a reset');
});

check('a reset still clears the things it already cleared', () => {
    const { env } = playedSession();
    const loaded = reloadOn(env);
    loaded.run('shardCount = 99');
    loaded.run('restartGame()');
    eq(loaded.run('shardCount'), 0, 'shards should be back to zero');
    eq(loaded.run('gameState.nightNumber'), 1, 'night number should be back to one');
    eq(loaded.run('frame'), 0, 'frame should be back to zero');
    eq([...loaded.run('unlockedElements')].sort().join(','), 'electric,fire', 'starting elements');
    eq(loaded.sandbox.followers.length, 0, 'followers should be empty');
    ok(loaded.sandbox.campCleared > 0, 'camp buildings should be cleared');
    ok(loaded.sandbox.hazardDays > 0, 'day hazards should be laid down');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
