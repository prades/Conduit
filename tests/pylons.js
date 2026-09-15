// Pylon network linking: how far one pylon reaches, and the spanning-forest
// rule that stops the network turning into a mesh.
//
// The headline case is the reported one: a pylon on tile 1 must link to a pylon
// on tile 4, two empty tiles between them. The old range of 2.5 tiles fell just
// short of that span of 3.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');

const sandbox = {
    console, Math, Map, Set, Array, Object, Number, String, isNaN, isFinite,
    _wPylons: [], _wPylonPairs: [], _pylonsWithPartner: new Set(),
    campBuilt: {},                         // drives the isCampBuilt stub
};
sandbox.isCampBuilt = id => !!sandbox.campBuilt[id];
sandbox.globalThis = sandbox;
const ctx = vm.createContext(sandbox);

// Pull the real range constants and getPylonRange out of camp.js.
const campSrc = fs.readFileSync(path.join(ROOT, 'js/camp.js'), 'utf8');
const rangeBlock = campSrc.match(/const PYLON_LINK_TILES[\s\S]*?function getPylonRange\(\)[\s\S]*?\n\}/);
if (!rangeBlock) { console.log('  FAIL could not find getPylonRange in js/camp.js'); process.exit(1); }
vm.runInContext(rangeBlock[0], ctx, { filename: 'camp.js:getPylonRange' });

// ...and the real linking function out of game.js.
const gameSrc = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
const linkFn = gameSrc.match(/function rebuildPylonPairs\(\)[\s\S]*?\n\}/);
if (!linkFn) { console.log('  FAIL could not find rebuildPylonPairs in js/game.js'); process.exit(1); }
vm.runInContext(linkFn[0], ctx, { filename: 'game.js:rebuildPylonPairs' });

const run = s => vm.runInContext(s, ctx);
let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// A pylon in WAVE mode with an element — the only kind that links.
function pylon(x, y, el) {
    return { x, y, pillar: true, pillarTeam: 'green', destroyed: false,
             health: 20, maxHealth: 20, waveMode: true,
             attackModeElement: el || 'fire', attackModeColor: '#ff5522' };
}
function link(pylons, relay) {
    sandbox.campBuilt = relay ? { signal_relay: true } : {};
    sandbox._wPylons.length = 0;
    pylons.forEach(p => sandbox._wPylons.push(p));
    run('_wPylons = globalThis._wPylons');
    run('rebuildPylonPairs()');
    return run('_wPylonPairs');
}
function linked(pairs, a, b) {
    return pairs.some(p => (p.pa === a && p.pb === b) || (p.pa === b && p.pb === a));
}

group('reach');
check('THE REPORTED CASE: tile 1 links to tile 4', () => {
    const a = pylon(1, 3), b = pylon(4, 3);
    const pairs = link([a, b]);
    eq(pairs.length, 1, 'pair count');
    ok(linked(pairs, a, b), 'tile 1 and tile 4 must connect');
});
check('the old 2.5-tile range would have refused that span', () => {
    // Guards against the range silently regressing below 3.
    ok(run('getPylonRange()') >= 3, 'base range is ' + run('getPylonRange()') + ', need >= 3');
});
check('adjacent pylons link', () => {
    const a = pylon(1, 3), b = pylon(2, 3);
    ok(linked(link([a, b]), a, b), 'distance 1');
});
check('two tiles apart links', () => {
    const a = pylon(1, 3), b = pylon(3, 3);
    ok(linked(link([a, b]), a, b), 'distance 2');
});
check('four tiles apart does NOT link at base range', () => {
    const a = pylon(1, 3), b = pylon(5, 3);
    eq(link([a, b]).length, 0, 'distance 4 should be out of reach');
});
check('an exactly-3.0 span is not lost to floating point', () => {
    // getPylonRange carries a small epsilon precisely so that d2 === range²
    // does not depend on exact float equality.
    const r = run('getPylonRange()');
    ok(3 * 3 <= r * r, `3² = 9 must be <= range² = ${(r * r).toFixed(4)}`);
});

group('reach with Signal Relay');
check('Signal Relay reaches five tiles, matching its "+2 tiles" text', () => {
    const a = pylon(1, 3), b = pylon(6, 3);
    ok(linked(link([a, b], true), a, b), 'distance 5 with relay');
    eq(link([a, b], false).length, 0, 'but not without it');
});
check('the relay is worth exactly the +2 tiles it advertises', () => {
    sandbox.campBuilt = {};
    const base = run('getPylonRange()');
    sandbox.campBuilt = { signal_relay: true };
    const withRelay = run('getPylonRange()');
    eq(Math.round((withRelay - base) * 100) / 100, 2, 'advertised bonus');
});
check('even the relay will not reach six tiles', () => {
    const a = pylon(1, 3), b = pylon(7, 3);
    eq(link([a, b], true).length, 0, 'distance 6 is out of reach');
});

group('diagonals');
check('a diagonal inside the radius links', () => {
    const a = pylon(1, 1), b = pylon(3, 3);   // hypot(2,2) = 2.83
    ok(linked(link([a, b]), a, b), 'diagonal 2.83');
});
check('a diagonal outside the radius does not', () => {
    const a = pylon(1, 0), b = pylon(4, 2);   // hypot(3,2) = 3.61
    eq(link([a, b]).length, 0, 'diagonal 3.61 should be out of reach');
});

group('element matching');
check('different elements never link', () => {
    const a = pylon(1, 3, 'fire'), b = pylon(3, 3, 'ice');
    eq(link([a, b]).length, 0, 'mismatched elements');
});
check('two separate element chains coexist', () => {
    const f1 = pylon(1, 3, 'fire'), f2 = pylon(3, 3, 'fire');
    const i1 = pylon(1, 0, 'ice'),  i2 = pylon(3, 0, 'ice');
    const pairs = link([f1, f2, i1, i2]);
    eq(pairs.length, 2, 'one pair per element');
    ok(linked(pairs, f1, f2) && linked(pairs, i1, i2), 'each element paired internally');
});

group('spanning forest (no meshes)');
check('three in a row form a chain, not a triangle', () => {
    const a = pylon(1, 3), b = pylon(3, 3), c = pylon(5, 3);
    const pairs = link([a, b, c]);
    // All three are mutually in range now (a-c is 4... not in range), so:
    // a-b and b-c link; a-c is 4 tiles and out of reach anyway.
    eq(pairs.length, 2, 'two links for three pylons');
    ok(linked(pairs, a, b) && linked(pairs, b, c), 'chained through the middle');
});
check('a redundant long link is skipped when a short path exists', () => {
    // a-b-c all within reach of each other: a-c must be dropped as a cycle.
    const a = pylon(1, 3), b = pylon(2, 3), c = pylon(3, 3);
    const pairs = link([a, b, c]);
    eq(pairs.length, 2, 'a spanning tree over 3 nodes has 2 edges, not 3');
    ok(!linked(pairs, a, c), 'the redundant shortcut must be skipped');
});
check('n pylons in one cluster produce n-1 links', () => {
    const ps = [0, 1, 2, 3, 4, 5].map(i => pylon(1 + i, 3));
    const pairs = link(ps);
    eq(pairs.length, ps.length - 1, 'spanning tree edge count');
});
check('two clusters out of reach of each other stay separate', () => {
    const a = pylon(1, 3), b = pylon(2, 3);
    const c = pylon(20, 3), d = pylon(21, 3);
    const pairs = link([a, b, c, d]);
    eq(pairs.length, 2, 'one link per cluster');
    ok(linked(pairs, a, b) && linked(pairs, c, d), 'clusters intact');
    ok(!linked(pairs, b, c), 'no bridge across the gap');
});
check('closer neighbours are preferred over longer shortcuts', () => {
    // b sits between a and c. Sorting candidates closest-first must pick the
    // short hops, leaving the long a-c span as the redundant one.
    const a = pylon(1, 3), b = pylon(2, 3), c = pylon(4, 3);
    const pairs = link([a, b, c]);
    eq(pairs.length, 2, 'two links');
    ok(linked(pairs, a, b), 'short hop a-b taken');
    ok(linked(pairs, b, c), 'short hop b-c taken');
    ok(!linked(pairs, a, c), 'long span a-c dropped');
});

group('pair payload');
check('each pair carries the geometry the zone effects need', () => {
    const a = pylon(1, 3), b = pylon(4, 3);
    const p = link([a, b])[0];
    eq(p.el, 'fire', 'element');
    eq(p.midX, 2.5, 'midpoint x');
    eq(p.midY, 3, 'midpoint y');
    eq(p.len2, 9, 'squared length');
    ok(p.bMinX < 1 && p.bMaxX > 4, 'bounding box spans both pylons');
});
check('the partner set covers every linked pylon', () => {
    const a = pylon(1, 3), b = pylon(4, 3), lone = pylon(30, 3);
    link([a, b, lone]);
    const partners = run('_pylonsWithPartner');
    ok(partners.has(a) && partners.has(b), 'linked pair recorded');
    ok(!partners.has(lone), 'an isolated pylon has no partner');
});

group('degenerate input');
check('no pylons produces no pairs', () => eq(link([]).length, 0, 'empty'));
check('a single pylon produces no pairs', () => eq(link([pylon(1, 3)]).length, 0, 'lone'));
check('two pylons stacked on the same tile still link once', () => {
    const a = pylon(2, 3), b = pylon(2, 3);
    eq(link([a, b]).length, 1, 'zero distance');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
