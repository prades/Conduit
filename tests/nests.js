// A nest the player destroys must stay destroyed — across wave transitions and
// across page loads. Nests are floor tiles rather than pillars, so the pylon
// save never covered them and world generation always rebuilds them at full
// health.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const store = {};
const sandbox = {
    console, Math, JSON, Object, Array, String, Number, Map, Set, isNaN, isFinite, parseInt,
    world: [], worldTileMap: new Map(),
    floatingTexts: [], actors: [],
    localStorage: {
        getItem(k) { return k in store ? store[k] : null; },
        setItem(k, v) { store[k] = String(v); },
        removeItem(k) { delete store[k]; },
    },
};
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

// save.js is self-contained apart from `world`; pull in just the nest helpers
// plus the extracted between-wave restore from waves.js.
const saveSrc = fs.readFileSync(path.join(ROOT, 'js/save.js'), 'utf8');
vm.runInContext(saveSrc, ctx, { filename: 'js/save.js' });

const wavesSrc = fs.readFileSync(path.join(ROOT, 'js/waves.js'), 'utf8');
const restoreFn = wavesSrc.match(/function restoreWorldBetweenWaves\(\)[\s\S]*?\n\}/);
if (!restoreFn) { console.log('  FAIL could not find restoreWorldBetweenWaves in js/waves.js'); process.exit(1); }
vm.runInContext(restoreFn[0], ctx, { filename: 'waves.js:restoreWorldBetweenWaves' });

const run = s => vm.runInContext(s, ctx);
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

function mkNest(x, zone, health) {
    return { x, y: -1, nest: true, nestHealth: health, nestMaxHealth: 200, nestZone: zone };
}
function mkPylon(x, over) {
    return Object.assign({ pillar: true, x, y: 3, pillarTeam: 'green', destroyed: false,
                           health: 4, maxHealth: 20, seasoned: 0 }, over || {});
}
function setWorld(tiles) {
    sandbox.world.length = 0;
    tiles.forEach(t => sandbox.world.push(t));
    sandbox.worldTileMap = new Map(tiles.map(t => [`${t.x},${t.y}`, t]));
    run('worldTileMap = globalThis.worldTileMap');
    for (const k of Object.keys(store)) delete store[k];
}

group('between-wave restore');
check('a destroyed nest is NOT healed by the wave transition', () => {
    const dead = mkNest(20, 1, 0);
    setWorld([dead]);
    run('restoreWorldBetweenWaves()');
    eq(dead.nestHealth, 0, 'destroyed nest health');
});
check('a damaged but living nest IS healed back', () => {
    const hurt = mkNest(20, 1, 37);
    setWorld([hurt]);
    run('restoreWorldBetweenWaves()');
    eq(hurt.nestHealth, 200, 'damaged nest health');
});
check('a nest reduced to exactly zero counts as destroyed', () => {
    // Every damage site clamps with Math.max(0, ...), so 0 is the destroyed
    // state — there is no separate flag to check.
    const edge = mkNest(20, 1, 0.0);
    setWorld([edge]);
    run('restoreWorldBetweenWaves()');
    eq(edge.nestHealth, 0, 'edge case');
});
check('destroying one nest leaves other nests alone', () => {
    const dead = mkNest(20, 1, 0), alive = mkNest(35, 2, 120);
    setWorld([dead, alive]);
    run('restoreWorldBetweenWaves()');
    eq(dead.nestHealth, 0, 'dead stays dead');
    eq(alive.nestHealth, 200, 'other nest healed');
});
check('green pylon healing and seasoning still work', () => {
    const p = mkPylon(5);
    setWorld([p]);
    run('restoreWorldBetweenWaves()');
    eq(p.health, 20, 'healed');
    eq(p.seasoned, 1, 'seasoned');
});
check('seasoned stacks are capped at 3', () => {
    const p = mkPylon(5, { seasoned: 3 });
    setWorld([p]);
    run('restoreWorldBetweenWaves()');
    eq(p.seasoned, 3, 'capped');
});
check('a destroyed pylon is not healed', () => {
    const p = mkPylon(5, { destroyed: true, health: 0 });
    setWorld([p]);
    run('restoreWorldBetweenWaves()');
    eq(p.health, 0, 'stays down');
});
check('an enemy pylon is not healed for free', () => {
    const p = mkPylon(5, { pillarTeam: 'red' });
    setWorld([p]);
    run('restoreWorldBetweenWaves()');
    eq(p.health, 4, 'untouched');
});

group('persistence across a page load');
check('saveNests records only destroyed nests', () => {
    setWorld([mkNest(20, 1, 0), mkNest(35, 2, 200), mkNest(50, 3, 0)]);
    run('saveNests()');
    const saved = JSON.parse(store['tubecrawler_nests']);
    eq(saved.length, 2, 'two destroyed');
    eq(saved.map(n => n.x).sort((a, b) => a - b).join(','), '20,50', 'the right two');
});
check('loadNests round-trips', () => {
    setWorld([mkNest(20, 1, 0)]);
    run('saveNests()');
    const back = run('loadNests()');
    eq(back.length, 1, 'one entry');
    eq(back[0].x, 20, 'x'); eq(back[0].y, -1, 'y');
});
check('loadNests returns null when nothing was saved', () => {
    for (const k of Object.keys(store)) delete store[k];
    eq(run('loadNests()'), null, 'no data');
});
check('a fresh world re-kills nests that were saved as destroyed', () => {
    // Save from one world...
    setWorld([mkNest(20, 1, 0), mkNest(35, 2, 90)]);
    run('saveNests()');
    const snapshot = store['tubecrawler_nests'];

    // ...then rebuild the world the way generateSegment does: full health.
    const fresh = [mkNest(20, 1, 200), mkNest(35, 2, 200)];
    sandbox.world.length = 0; fresh.forEach(t => sandbox.world.push(t));
    sandbox.worldTileMap = new Map(fresh.map(t => [`${t.x},${t.y}`, t]));
    run('worldTileMap = globalThis.worldTileMap');
    store['tubecrawler_nests'] = snapshot;

    // This mirrors the restore block in init.js.
    run(`
        const savedNests = loadNests();
        if (savedNests) savedNests.forEach(s => {
            const tile = worldTileMap.get(s.x + "," + s.y);
            if (tile && tile.nest) tile.nestHealth = 0;
        });
    `);
    eq(fresh[0].nestHealth, 0, 'destroyed nest re-killed on load');
    eq(fresh[1].nestHealth, 200, 'the living one is left at full health');
});
check('clearNests wipes the record for a fresh game', () => {
    setWorld([mkNest(20, 1, 0)]);
    run('saveNests()');
    ok(store['tubecrawler_nests'], 'saved');
    run('clearNests()');
    eq(run('loadNests()'), null, 'cleared');
});
check('a destroyed nest survives repeated wave transitions', () => {
    const dead = mkNest(20, 1, 0), alive = mkNest(35, 2, 200);
    setWorld([dead, alive]);
    for (let wave = 0; wave < 10; wave++) {
        run('restoreWorldBetweenWaves()');
        run('saveNests()');
    }
    eq(dead.nestHealth, 0, 'still dead after 10 waves');
    eq(JSON.parse(store['tubecrawler_nests']).length, 1, 'still recorded once');
});

group('spawn consequence');
check('the spawn guard treats a zero-health nest as shut down', () => {
    // game.js: `if (nest && nest.nestHealth <= 0) continue;` — this is the
    // payoff for destroying one, so assert the condition it depends on.
    const gameSrc = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
    ok(/nest\.nestHealth\s*<=\s*0\s*\)\s*continue/.test(gameSrc),
       'the zone spawn loop no longer skips dead nests');
});
check('a destroyed nest is also not chosen as a spawn point', () => {
    const cloneSrc = fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8');
    ok(/t\.nest\s*&&\s*t\.nestZone\s*===\s*zoneIndex\s*&&\s*t\.nestHealth\s*>\s*0/.test(cloneSrc),
       'spawnPredatorForZone no longer requires a living nest');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
