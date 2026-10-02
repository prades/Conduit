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

// zoneSpawnPoints decides which mouths a zone still has. Pulled in so the
// spawn guard can be DRIVEN rather than matched against source text — the two
// checks below used to assert the shape of the old one-nest condition, so they
// broke the moment the vortex became a second spawn point even though the
// behaviour they protect was intact.
const cloneSrc = fs.readFileSync(path.join(ROOT, 'js/clone.js'), 'utf8');
const spFn = cloneSrc.match(/function zoneSpawnPoints\(zoneIndex\)[\s\S]*?\n\}/);
if (!spFn) { console.log('  FAIL could not find zoneSpawnPoints in js/clone.js'); process.exit(1); }
sandbox.getZoneIndex = x => Math.floor(x / 15);
vm.runInContext(spFn[0], ctx, { filename: 'clone.js:zoneSpawnPoints' });

// Taking a zone puts its nest out. Pulled in the same way, so the rule is
// driven rather than described.
const neutFn = wavesSrc.match(/function neutraliseZone\(zoneIndex\)[\s\S]*?\n\}/);
if (!neutFn) { console.log('  FAIL could not find neutraliseZone in js/waves.js'); process.exit(1); }
vm.runInContext(neutFn[0], ctx, { filename: 'waves.js:neutraliseZone' });
// The real predicate, so "the home portal is not a nest to take" is the game's
// own answer rather than this file's.
const helpersSrc = fs.readFileSync(path.join(ROOT, 'js/helpers.js'), 'utf8');
const portalFn = helpersSrc.match(/function isHomePortal\(t\)[\s\S]*?\n\}/);
if (!portalFn) { console.log('  FAIL could not find isHomePortal in js/helpers.js'); process.exit(1); }
vm.runInContext(portalFn[0], ctx, { filename: 'helpers.js:isHomePortal' });

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

    // The game's own restore, not a copy of it: this block used to be written
    // out here as well as in init.js, so the test could agree with itself.
    eq(run('applyNests(loadNests())'), 1, 'one nest should have been re-killed');
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

group('TAKING A ZONE NEUTRALISES IT');

// REPORTED: "after you defeat a zone and its wave, when the message pops up
// saying zone cleared, that zone needs to be neutralised and greyed out — the
// nest on the wall grey, and it can be controlled and turned blue."
//
// Clearing the wave was only a score. The zone's nest stayed alive and went on
// pouring predators out of the wall the player had just fought their way to.

check('THE ASK: clearing a zone puts its nest out', () => {
    const nest = mkNest(16, 1, 200);
    setWorld([nest]);
    eq(run('neutraliseZone(1)'), true, 'it should report that it took something');
    eq(nest.nestHealth, 0, 'the nest should be out');
});

check('and the zone goes silent, because that nest was its only mouth', () => {
    const nest = mkNest(16, 1, 200);
    setWorld([nest]);
    eq(run('zoneSpawnPoints(1)').length, 1, 'fixture: it should be producing first');
    run('neutraliseZone(1)');
    eq(run('zoneSpawnPoints(1)').length, 0, 'the zone is still producing after it was taken');
});

check('it does not reach into a zone you have not taken', () => {
    const one = mkNest(16, 1, 200), two = mkNest(31, 2, 200);
    setWorld([one, two]);
    run('neutraliseZone(1)');
    eq(one.nestHealth, 0, 'the cleared zone should be out');
    eq(two.nestHealth, 200, 'the next zone should be untouched');
});

check('THE HOME PORTAL is never taken — it was never theirs', () => {
    // Zone 0's nest is the green doorway the player walks out of. Clearing a
    // wave whose alarm somehow read as zone 0 must not grey it out.
    const portal = mkNest(1, 0, 200);
    setWorld([portal]);
    eq(run('neutraliseZone(0)'), false, 'it claimed to have taken something');
    eq(portal.nestHealth, 200, 'the home portal was put out');
    // And not by a bad zone index either.
    eq(run('neutraliseZone(-1)'), false, 'a negative zone took something');
});

check('taking a zone twice is harmless and reports nothing the second time', () => {
    const nest = mkNest(16, 1, 200);
    setWorld([nest]);
    eq(run('neutraliseZone(1)'), true, 'the first should take it');
    eq(run('neutraliseZone(1)'), false, 'the second should find nothing to take');
    eq(nest.nestHealth, 0, 'and it should still be out');
});

check('a zone stays taken across the waves that follow', () => {
    // restoreWorldBetweenWaves heals nests back to full. It must not undo this.
    const taken = mkNest(16, 1, 200), theirs = mkNest(31, 2, 120);
    setWorld([taken, theirs]);
    run('neutraliseZone(1)');
    for (let w = 0; w < 5; w++) run('restoreWorldBetweenWaves()');
    eq(taken.nestHealth, 0, 'the taken zone came back to life');
    eq(theirs.nestHealth, 200, 'a merely damaged nest should still recover');
});

check('and across a refresh', () => {
    const nest = mkNest(16, 1, 200);
    setWorld([nest]);
    run('neutraliseZone(1)');
    run('saveNests()');
    // Regeneration rebuilds every nest at full health; the save is what undoes
    // that for the ones already taken.
    nest.nestHealth = 200;
    run('applyNests(loadNests())');
    eq(nest.nestHealth, 0, 'the taken zone came back after a refresh');
});

check('and init.js uses that one restore rather than its own copy', () => {
    const INIT = fs.readFileSync(path.join(ROOT, 'js/init.js'), 'utf8');
    ok(/applyNests\(loadNests\(\)\)/.test(INIT), 'init.js does not use the shared restore');
    ok(!/tile\.nest\) tile\.nestHealth = 0/.test(INIT),
       'init.js still re-kills nests with its own copy of the rule');
    const SAVE = fs.readFileSync(path.join(ROOT, 'js/save.js'), 'utf8');
    eq((SAVE.match(/function applyNests/g) || []).length, 1, 'the restore is defined more than once');
});

check('it is wired into the wave clear, before the overlay goes up', () => {
    const at = wavesSrc.indexOf('function checkWaveClear');
    const body = wavesSrc.slice(at, wavesSrc.indexOf('\nfunction ', at + 10));
    ok(at > -1 && body.length > 200, 'checkWaveClear could not be located');
    ok(/neutraliseZone\(clearedZone\)/.test(body),
       'clearing a wave does not neutralise the zone');
    ok(body.indexOf('neutraliseZone(') < body.indexOf('showWaveClear()'),
       'the zone is taken after the ZONE CLEARED overlay, so the player sees it live');
});

group('spawn consequence');

// REPORTED: "I want the portals on the wall to be the nests. I don't want the
// holes on the ground or the floor any more."
//
// A zone used to have TWO mouths: its wall nest and a floor vortex (the
// capacitor node, open until captured). Killing the nest was not enough, which
// is what the old one-nest guard would have got wrong. The floor vortex is gone
// now, so the nest in the back wall is the only mouth and killing it is the
// whole of it.

check('a destroyed nest is not offered as a spawn point', () => {
    setWorld([mkNest(16, 1, 0)]);
    const open = run('zoneSpawnPoints(1)');
    eq(open.length, 0, 'a dead nest should offer nothing');
});

check('a living nest is', () => {
    setWorld([mkNest(16, 1, 200)]);
    eq(run('zoneSpawnPoints(1)').length, 1, 'a living nest should be a mouth');
});

check('THE ASK: a floor tile is never a mouth, whatever is on it', () => {
    // The vortex sat at y=2 on an ordinary floor tile and answered as a mouth.
    // No tile on the floor does any more.
    setWorld([mkNest(16, 1, 200),
              { x: 18, y: 2, type: 'floor', nodeType: 'capacitor_node',
                capturable: true, captured: false },
              { x: 19, y: 2, type: 'floor', nodeType: 'signal_tower',
                capturable: true, captured: false }]);
    const open = run('zoneSpawnPoints(1)');
    eq(open.length, 1, 'something on the floor is still counted as a mouth');
    eq(open[0].y, -1, 'the one mouth should be the nest against the back wall');
});

check('THE ASK: killing the nest shuts the zone outright', () => {
    setWorld([mkNest(16, 1, 0),
              { x: 18, y: 2, type: 'floor', nodeType: 'capacitor_node',
                capturable: true, captured: false }]);
    eq(run('zoneSpawnPoints(1)').length, 0,
       'the zone is still producing after its nest died');
});

check('a zone with no nest reads differently from one whose nest is dead', () => {
    // null means "nothing was ever there", which still spawns from the zone
    // centre as it always did. An empty array means "shut", which stops.
    setWorld([{ x: 16, y: 2, type: 'floor' }]);
    eq(run('zoneSpawnPoints(1)'), null, 'a zone with no nest should report null');
    setWorld([mkNest(16, 1, 0)]);
    eq(run('zoneSpawnPoints(1)').length, 0, 'a zone with a dead nest should report empty');
});

check('a nest in another zone is not counted', () => {
    setWorld([mkNest(16, 1, 200), mkNest(33, 2, 200)]);   // x 33 is zone 2
    eq(run('zoneSpawnPoints(1)').length, 1, "zone 1 should not see zone 2's nest");
    eq(run('zoneSpawnPoints(2)').length, 1, 'and zone 2 should see its own');
});

check('the spawn loop and the spawner agree on the rule', () => {
    // One function decides, and both callers use it — the guard in game.js and
    // the choice in clone.js. Two copies of "is this zone finished" is how they
    // come to disagree.
    const gameSrc = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
    ok(/zoneSpawnPoints\(z\)/.test(gameSrc), 'the zone loop does not use zoneSpawnPoints');
    ok(/mouths && mouths\.length === 0\) continue/.test(gameSrc),
       'the zone loop no longer stops when every mouth is shut');
    ok(/zoneSpawnPoints\(zoneIndex\)/.test(cloneSrc), 'the spawner does not use zoneSpawnPoints');
    ok(!/nest\.nestHealth\s*<=\s*0\s*\)\s*continue/.test(gameSrc),
       'the old one-nest guard is still there as well');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
