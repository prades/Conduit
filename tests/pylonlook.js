// One look for every pylon and every upgrade: the sentinel fortress. The other
// five bodies (spire, monolith, antenna, shrine, conduit) are gone, and the
// wall panelling is trimmed to the same palette instead of carrying its own
// greens.
//
// The dangerous part of this change is invisible: world.js picked the style
// with a draw from the segment's seeded stream. Dropping that draw would shift
// every later draw in the segment and silently rebuild a DIFFERENT world under
// every existing save. The first group here proves the stream still lines up,
// by generating a world with the previous committed world.js and comparing it
// to the current one tile for tile.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { configNums } = require('./domstub.js');

const CONFIG = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
const GAME   = fs.readFileSync(path.join(ROOT, 'js/game.js'),   'utf8');
const CMD    = fs.readFileSync(path.join(ROOT, 'js/commands.js'),'utf8');
const UI     = fs.readFileSync(path.join(ROOT, 'js/ui.js'),     'utf8');
const WORLD  = fs.readFileSync(path.join(ROOT, 'js/world.js'),  'utf8');

const GONE_STYLES = ['spire', 'monolith', 'antenna', 'shrine', 'conduit'];

function cfgStr(name) {
    const m = CONFIG.match(new RegExp(`const\\s+${name}\\s*=\\s*"([^"]+)"`));
    if (!m) throw new Error(`config.js no longer defines ${name}`);
    return m[1];
}

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// Generate a world from a given world.js source with a fixed seed.
function generate(worldSrc, seed, from, to) {
    const sandbox = {
        console, Math, Object, Array, String, Number, Set, Map, isNaN, isFinite, parseInt,
        world: [], worldTileMap: new Map(), actors: [], signalTowers: [],
        exploredZones: new Set(), dayStats: { redSpawned: 0, redConverted: 0 },
        activeDayZones: 3, ZONE_LENGTH: 15, lastGenX: 0, _cacheAge: 0,
        unlockedElements: new Set(['fire', 'electric']),
        cfg: { pillarSpawnRate: 0.15, npcSpawnRate: 0.22 },
        // World generation reads these; lifted from config.js, not restated.
        ...configNums(['PANEL_DECOY_CHANCE', 'PANEL_SHARD_MIN', 'PANEL_SHARD_MAX']),
        NPC_TYPES: { virus: { moveSpeed: 0.02 }, lobster: { moveSpeed: 0.02 }, turtle: { moveSpeed: 0.02 } },
        PERSONALITY_KEYS: ['aggressive', 'cautious', 'cunning', 'stoic', 'wild'],
        COMBAT_TRAITS: { a: {}, b: {} }, NATURAL_TRAITS: { a: {}, b: {} }, PERKS: { a: {}, b: {} },
        applyPersonality: () => ({ hp: 20, defense: 10, attack: 10, speed: 10,
                                   specialAttack: 10, accuracy: 10, will: 20, resonance: 0 }),
        assignRole: () => 'brawler',
        restoredNpcKeys: null,
        PYLON_STYLE: cfgStr('PYLON_STYLE'),
        localStorage: { getItem: () => null, setItem() {}, removeItem() {} },
    };
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);
    vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/rng.js'), 'utf8'), ctx, { filename: 'js/rng.js' });
    vm.runInContext(worldSrc, ctx, { filename: 'world.js' });
    vm.runInContext(`worldSeed = ${seed}`, ctx);
    for (let i = from; i < to; i++) vm.runInContext(`generateSegment(${i})`, ctx);
    return sandbox;
}

// Everything about a tile that the seed decides, EXCEPT the pylon style — that
// is the one field this change is allowed to alter.
function fingerprint(sandbox) {
    return sandbox.world.map(t => [
        t.x, t.y, t.type,
        t.pillar ? 1 : 0, t.pillarTeam,
        t.nest ? 1 : 0, t.nestZone,
        t.nodeType || '', t.capturable ? 1 : 0,
        t.isDecoy ? 1 : 0, t.shardReward || 0, t.alarmType || '',
        t.panelFlicker !== undefined ? t.panelFlicker.toFixed(6) : '',
    ].join(':')).join('|');
}

group('the seeded world is unchanged');

check('THE RISK: the same seed still builds the same world', () => {
    // Reconstruct the old six-style roll from the current source rather than
    // reading it out of git: pinned against HEAD this check would turn into a
    // tautology the moment the change was committed.
    const OLD_ROLL = 'pylonStyle:["sentinel","spire","monolith","antenna","shrine","conduit"]' +
                     '[Math.floor(rnd()*6)]';
    // Match whatever the assignment is now, so a version that dropped the draw
    // still gets compared and reports the shifted world rather than failing to
    // build a baseline.
    const prev = WORLD.replace(/pylonStyle:[^\n]*?,\n/, OLD_ROLL + ',\n');
    ok(prev !== WORLD, 'could not find the pylonStyle assignment in world.js');
    const a = generate(prev,  123456789, -14, 40);
    const b = generate(WORLD, 123456789, -14, 40);
    const fa = fingerprint(a), fb = fingerprint(b);
    if (fa !== fb) {
        // Name the first tile that differs rather than dumping both worlds.
        const la = fa.split('|'), lb = fb.split('|');
        const at = la.findIndex((v, i) => v !== lb[i]);
        throw new Error(`the stream shifted: tile ${at} was "${la[at]}" and is now "${lb[at]}"`);
    }
    ok(a.world.length > 400, 'fixture: should have generated a real world');
});

check('the style draw is still consumed', () => {
    // A bare `pylonStyle: PYLON_STYLE` with no rnd() would be the bug above.
    ok(/pylonStyle:\(rnd\(\), PYLON_STYLE\)/.test(WORLD),
       'world.js must still consume one rnd() draw where the style roll was');
});

check('two different seeds still build different worlds', () => {
    const a = generate(WORLD, 111111, 0, 30);
    const b = generate(WORLD, 999999, 0, 30);
    ok(fingerprint(a) !== fingerprint(b), 'the generator stopped depending on the seed');
});

group('one look for every pylon');

check('THE REPORTED CASE: every pylon is a sentinel', () => {
    eq(cfgStr('PYLON_STYLE'), 'sentinel', 'the one style should be sentinel');
    const a = generate(WORLD, 42, 0, 30);
    const styles = new Set(a.world.map(t => t.pylonStyle));
    eq([...styles].join(','), 'sentinel', 'generated tiles carry more than one style');
});

check('a pylon built or upgraded in play gets the same look', () => {
    const assigns = [...CMD.matchAll(/t\.pylonStyle\s*=\s*([^;]+);/g)].map(m => m[1].trim());
    ok(assigns.length >= 2, `expected the build and upgrade paths to set a style, found ${assigns.length}`);
    for (const a of assigns) eq(a, 'PYLON_STYLE', 'a play-time path picks its own style');
    ok(!/Math\.random\(\)\*_?[I]?PYLON_STYLES/.test(CMD), 'a random style roll survives in commands.js');
});

check('the other five bodies are gone from the drawing code', () => {
    for (const st of GONE_STYLES) {
        ok(!new RegExp(`case "${st}"`).test(GAME), `case "${st}" is still drawn`);
        ok(!new RegExp(`_style\\s*===\\s*"${st}"`).test(GAME), `${st} is still branched on`);
    }
    ok(!/switch\(_style\)/.test(GAME), 'the style switch survives');
    ok(!/const _style\s*=/.test(GAME), 'the now-unused _style local survives');
});

check('nothing still offers the removed styles by name', () => {
    for (const src of [['game.js', GAME], ['commands.js', CMD], ['ui.js', UI], ['world.js', WORLD]]) {
        for (const st of GONE_STYLES) {
            ok(!new RegExp(`["']${st}["']`).test(src[1]),
               `${src[0]} still names the "${st}" style`);
        }
    }
});

check('the orb sits at one height, not a per-style one', () => {
    ok(/const _orbY = _base-54;/.test(GAME), 'the orb height is still computed per style');
});

group('the trim matches');

check('the sentinel palette is named once, not spelled out twice', () => {
    for (const n of ['SENTINEL_FRONT_ACTIVE', 'SENTINEL_FRONT_DORMANT', 'SENTINEL_FRONT_UPGRADED',
                     'SENTINEL_RIGHT_ACTIVE', 'SENTINEL_RIGHT_DORMANT', 'SENTINEL_RIGHT_UPGRADED',
                     'SENTINEL_TOP_ACTIVE',   'SENTINEL_TOP_DORMANT',   'SENTINEL_TOP_UPGRADED',
                     'SENTINEL_SLIT', 'SENTINEL_ACCENT', 'SENTINEL_ACCENT_DIM']) {
        ok(/^#[0-9a-f]{6}$/i.test(cfgStr(n)), `${n} is missing or not a colour`);
    }
});

check('the palette values are the sentinel tower\'s own', () => {
    // These are the literals the tower was drawn with before they were named;
    // the point of the change was to reuse them, not to invent new ones.
    eq(cfgStr('SENTINEL_FRONT_ACTIVE'), '#1a2030', 'front face');
    eq(cfgStr('SENTINEL_RIGHT_ACTIVE'), '#0d1520', 'right face');
    eq(cfgStr('SENTINEL_TOP_ACTIVE'),   '#2a3545', 'top face');
    eq(cfgStr('SENTINEL_SLIT'),         '#050508', 'arrow slit');
});

check('the tower body draws from the named palette', () => {
    const at = GAME.indexOf('// ── BODY STRUCTURE');
    ok(at > -1, 'could not find the pylon body block');
    const body = GAME.slice(at, at + 4000);
    ok(/SENTINEL_FRONT_ACTIVE/.test(body) && /SENTINEL_TOP_ACTIVE/.test(body) &&
       /SENTINEL_SLIT/.test(body), 'the body still uses bare hex literals');
});

check('THE REPORTED CASE: the wall panel is trimmed to the same palette', () => {
    const at = GAME.indexOf('// ── SHARD PANEL');
    ok(at > -1, 'could not find the wall panel block');
    const panel = GAME.slice(at, at + 5200);
    for (const n of ['SENTINEL_ACCENT', 'SENTINEL_FRONT_ACTIVE', 'SENTINEL_TOP_ACTIVE', 'SENTINEL_SLIT']) {
        ok(new RegExp(n).test(panel), `the panel does not use ${n}`);
    }
    // The old greens must be gone from the panel, or the two clash.
    for (const green of ['#0f8', '#00ff88', '#00cc66', '#001a0a', '#0a1a10', '#181f1a']) {
        ok(!panel.includes("'" + green + "'"), `the panel still uses the old green ${green}`);
    }
});

check('the panel keeps a live-versus-spent distinction', () => {
    const at = GAME.indexOf('// ── SHARD PANEL');
    const panel = GAME.slice(at, at + 5200);
    // Both states must differ in plate, frame and readout, or a spent panel
    // looks identical to one still worth hacking.
    ok(/activated \? SENTINEL_ACCENT_DIM : SENTINEL_ACCENT/.test(panel), 'frame does not change');
    ok(/activated \? SENTINEL_FRONT_DORMANT : SENTINEL_FRONT_ACTIVE/.test(panel), 'plate does not change');
    ok(/activated \? SENTINEL_SLIT : '#0a141e'/.test(panel), 'readout does not change');
    ok(/if \(!activated\)/.test(panel), 'the scan line and LED should only run while live');
});

check('the panel borrows the tower\'s own motifs', () => {
    const at = GAME.indexOf('// ── SHARD PANEL');
    const panel = GAME.slice(at, at + 5200);
    ok(/merlons, in miniature/.test(panel), 'no stepped crown echoing the battlements');
    ok(/arrow slit/.test(panel), 'no arrow loop echoing the tower');
    ok(/rivets/i.test(panel), 'no corner rivets');
});

check('the readout sits below the slit, not above it', () => {
    // Wall-space y points up, so the readout has to be at the LOW y. Getting
    // this backwards put the recess at the top with the slit dangling under
    // it, which reads as a keyhole rather than a panel.
    const at = GAME.indexOf('// ── SHARD PANEL');
    const panel = GAME.slice(at, at + 5200);
    const readout = panel.match(/ctx\.fillRect\(pL \+ 2, pT \+ (\d+), pw - 4, 13\)/);
    const slit    = panel.match(/ctx\.fillRect\(pcx - 1\.5, pT \+ (\d+), 3, ph - 26\)/);
    ok(readout && slit, 'could not find the readout and the slit');
    ok(Number(readout[1]) < Number(slit[1]),
       `readout at y=${readout[1]} must be below the slit at y=${slit[1]}`);
});

check('the upgraded highlight is steel, not the old cyan', () => {
    const at = GAME.indexOf('// Upgraded detail');
    ok(at > -1, 'could not find the upgraded detail');
    const block = GAME.slice(at, at + 400);
    ok(/SENTINEL_ACCENT/.test(block), 'the upgraded highlight is not on the sentinel palette');
    ok(!/"#0ff"/.test(block), 'the old cyan highlight survives');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
