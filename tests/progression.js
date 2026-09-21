// PROGRESSION: depth, not purchases.
//
// The shop is gone — all four panes (Supply, Pylons, Armaments, Builds) and
// every item in them. Removing it took two things with it that the game cannot
// do without, and both had to be replaced in the same change:
//
//   - ELEMENT UNLOCKS were shop-only. Without a replacement the player is
//     locked to fire and electric for the whole game.
//   - AMMO was shop-only. Without a replacement the weapon is dry forever
//     after the opening magazine.
//
// Elements now come from depth: kill a zone's nest, take its element. Ammo
// comes from hacking a wall panel. Both are acts in the world rather than
// purchases, which is the point of the revamp.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const SRC = {};
for (const f of ['config', 'wavedata', 'waves', 'game', 'clone', 'helpers', 'predator']) {
    SRC[f] = fs.readFileSync(path.join(ROOT, `js/${f}.js`), 'utf8');
}
const HTML = fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// The real depth-unlock code out of wavedata.js, with a world of nests.
function makeEnv() {
    const sandbox = {
        console, Math, Object, Array, String, Number, Set, Map, isNaN, isFinite, parseInt,
        floatingTexts: [], _nestCache: [],
        ELEMENTS: [
            { id: 'fire', label: 'FIRE', color: '#ff3300' },
            { id: 'electric', label: 'ELECTRIC', color: '#ffee33' },
            { id: 'ice', label: 'ICE', color: '#99ddff' },
            { id: 'flux', label: 'FLUX', color: '#9933ff' },
            { id: 'core', label: 'CORE', color: '#00ccaa' },
            { id: 'toxic', label: 'TOXIC', color: '#66ff66' },
        ],
        unlockedElements: new Set(['fire', 'electric']),
        saves: 0,
    };
    sandbox.saveUnlocks = () => { sandbox.saves++; };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    // Lift just the depth-progression block; wavedata.js otherwise reaches for
    // the DOM and the whole wave system.
    // From the table through the end of checkDepthUnlocks. A non-greedy match
    // to the first closing brace stopped at depthUnlockFor and left the watcher
    // out, which looked like the watcher was missing.
    const from = SRC.wavedata.indexOf('const DEPTH_ELEMENT_UNLOCKS');
    const at   = SRC.wavedata.indexOf('function checkDepthUnlocks', from);
    if (from < 0 || at < 0) { console.log('  FAIL could not find the depth-progression block'); process.exit(1); }
    let i = SRC.wavedata.indexOf('{', at), depth = 0;
    while (true) {
        if (SRC.wavedata[i] === '{') depth++;
        else if (SRC.wavedata[i] === '}') depth--;
        if (depth === 0) break;
        i++;
    }
    vm.runInContext(SRC.wavedata.slice(from, i + 1), ctx, { filename: 'wavedata.js:depth' });
    return { sandbox, run: s => vm.runInContext(s, ctx) };
}
function nest(zone, health) {
    return { nest: true, nestZone: zone, nestHealth: health, nestMaxHealth: 200, x: zone * 15 + 7, y: -1 };
}

group('the shop is gone');

check('THE REPORTED CASE: no shop, no items, no purchasing', () => {
    for (const list of ['SHOP_ITEMS', 'PYLON_SHOP_ITEMS', 'ARMAMENT_ITEMS', 'CRYSTAL_BUILD_ITEMS']) {
        ok(!new RegExp('const ' + list + ' = \\[').test(SRC.wavedata), list + ' is back');
    }
    ok(!/boughtItems/.test(SRC.wavedata) && !/boughtItems/.test(SRC.waves),
       'the bought-items ledger is back');
    ok(!/function buildShopGrid/.test(SRC.waves), 'the shop grid builder is back');
    ok(!/function _fillShopPane/.test(SRC.waves), 'the shop pane filler is back');
    ok(!/switchShopTab/.test(HTML), 'the shop tab switcher is back in the page');
    ok(!/id="shopGridSupply"/.test(HTML), 'the shop markup is back in the page');
});

check('crystal builds cannot be acquired, and nothing reads them', () => {
    // All 21 were set only from the Builds pane and one tab in clone.js.
    ok(!/activeCrystalBuild/.test(SRC.config), 'activeCrystalBuild is still declared');
    for (const f of ['waves', 'game', 'clone', 'helpers', 'predator']) {
        ok(!/activeCrystalBuild/.test(SRC[f]), `js/${f}.js still references activeCrystalBuild`);
    }
    ok(!/_drawBuildsTab/.test(SRC.clone), 'the builds tab is back');
    ok(!/id:"builds"/.test(SRC.clone), 'the builds tab is still offered');
});

check('the two last-life saves went with them', () => {
    // ghostphage and warden_pact were crystal builds, so running out of HP
    // stat is permanent now. The queue must not resurrect on a zero.
    ok(/if \(newHp<=0\) return;/.test(SRC.game),
       'a follower out of HP is still being queued for respawn');
    ok(!/isGhostSave|isWardenSave/.test(SRC.game), 'the build-only saves survive');
});

group('elements come from depth');

check('THE REPLACEMENT: killing a zone nest hands over its element', () => {
    const env = makeEnv();
    env.sandbox._nestCache.push(nest(1, 0));       // zone 1 nest destroyed
    env.run('checkDepthUnlocks()');
    ok(env.sandbox.unlockedElements.has('ice'), 'zone 1 should hand over ICE');
    ok(env.sandbox.saves > 0, 'the unlock should be persisted');
    ok(env.sandbox.floatingTexts.some(t => /ICE/.test(t.text)), 'the player should be told');
});

check('a living nest hands over nothing', () => {
    const env = makeEnv();
    env.sandbox._nestCache.push(nest(1, 200), nest(2, 120));
    env.run('checkDepthUnlocks()');
    same(env.sandbox.unlockedElements.size, 2, 'nothing should unlock while the nests stand');
    same(env.sandbox.saves, 0, 'and nothing should be written');
});

check('all four elements are reachable, one per zone', () => {
    const env = makeEnv();
    for (const z of [1, 2, 3, 4]) env.sandbox._nestCache.push(nest(z, 0));
    env.run('checkDepthUnlocks()');
    for (const el of ['ice', 'flux', 'core', 'toxic']) {
        ok(env.sandbox.unlockedElements.has(el), el + ' should be reachable');
    }
    same(env.sandbox.unlockedElements.size, 6, 'all six should be held');
});

check('every element the game has is reachable from some zone', () => {
    // A sixth element with no zone behind it would be unobtainable.
    const env = makeEnv();
    const table = env.run('DEPTH_ELEMENT_UNLOCKS');
    const granted = new Set(Object.values(table));
    for (const el of env.sandbox.ELEMENTS) {
        const startsUnlocked = el.id === 'fire' || el.id === 'electric';
        ok(startsUnlocked || granted.has(el.id),
           el.id + ' can never be obtained — no zone grants it');
    }
});

check('home gives nothing, and depths past the table give nothing', () => {
    const env = makeEnv();
    same(env.run('depthUnlockFor')(0), null, 'zone 0 is home');
    same(env.run('depthUnlockFor')(9), null, 'there is nothing left to grant that deep');
    same(env.run('depthUnlockFor')(undefined), null, 'a nest with no zone');
});

check('it is idempotent — a dead nest does not re-grant every frame', () => {
    const env = makeEnv();
    env.sandbox._nestCache.push(nest(1, 0));
    for (let i = 0; i < 50; i++) env.run('checkDepthUnlocks()');
    same(env.sandbox.saves, 1, 'should write once, not once per frame');
    same(env.sandbox.floatingTexts.length, 1, 'and announce once');
});

check('it watches rather than hooking each damage site', () => {
    // nestHealth is written from two element effects, the destroy_nest job and
    // the nest hack. A watcher cannot be forgotten when a fifth site is added.
    ok(/function checkDepthUnlocks/.test(SRC.wavedata), 'no watcher');
    ok(/checkDepthUnlocks\(\);/.test(SRC.game), 'the watcher is never called');
    same((SRC.game.match(/checkDepthUnlocks\(\);/g) || []).length, 1, 'called more than once');
});

check('an unlock survives a refresh', () => {
    // unlockedElements already persists, which is why this needs no ledger of
    // its own — the unlock IS the record.
    ok(/saveUnlocks\(\)/.test(SRC.wavedata), 'the unlock is not persisted');
    const SAVE = fs.readFileSync(path.join(ROOT, 'js/save.js'), 'utf8');
    ok(/function saveUnlocks/.test(SAVE) && /function getUnlocks/.test(SAVE),
       'unlocks have no storage behind them');
});

check('a dead nest stays dead, so the unlock cannot be undone', () => {
    // restoreWorldBetweenWaves heals damaged nests but deliberately leaves
    // destroyed ones destroyed. That is what makes depth a ratchet.
    ok(/if \(obj\.nest && obj\.nestHealth > 0\) obj\.nestHealth = obj\.nestMaxHealth/.test(SRC.waves),
       'between-wave restore no longer spares destroyed nests');
});

group('the in-game docs match');

check('the index no longer tells the player to buy elements', () => {
    ok(!/purchased in the shop/.test(HTML), 'the docs still describe buying elements');
    ok(!/Shop: <span class="cm-stat">\d+ shards/.test(HTML), 'the per-element shop prices are back');
    ok(/There is no shop/.test(HTML), 'the docs do not say the shop is gone');
    for (const z of ['ZONE 1 nest', 'ZONE 2 nest', 'ZONE 3 nest', 'ZONE 4 nest']) {
        ok(HTML.includes(z), 'the docs do not list ' + z);
    }
});

check('the documented mapping matches the code', () => {
    const env = makeEnv();
    const table = env.run('DEPTH_ELEMENT_UNLOCKS');
    for (const [zone, el] of Object.entries(table)) {
        const re = new RegExp('ZONE ' + zone + ' nest</span><br><span class="cost">unlocks ' + el.toUpperCase());
        ok(re.test(HTML), `the docs disagree with the code for zone ${zone} (${el})`);
    }
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
