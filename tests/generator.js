// The GENERATOR pylon: neutral element, the only structure a nest will link
// to, and it mends the friendly pylons standing in its reach.
//
// Neutral matters structurally, not just cosmetically. The elemental network's
// tiers and integrity are computed from _wPylons, and the zone-effect switch
// dispatches on attackModeElement — a generator must stay out of both, or it
// would inflate a network it contributes nothing to.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const ROOT = path.resolve(__dirname, '..');
const { fnSource, configNums } = require('./domstub.js');

const CONFIG = fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8');
const GAME   = fs.readFileSync(path.join(ROOT, 'js/game.js'),   'utf8');
const CMD    = fs.readFileSync(path.join(ROOT, 'js/commands.js'),'utf8');
const NPC    = fs.readFileSync(path.join(ROOT, 'js/npc.js'),    'utf8');
const SAVE   = fs.readFileSync(path.join(ROOT, 'js/save.js'),   'utf8');
const INIT   = fs.readFileSync(path.join(ROOT, 'js/init.js'),   'utf8');
const UI     = fs.readFileSync(path.join(ROOT, 'js/ui.js'),     'utf8');

function constant(name) {
    const m = CONFIG.match(new RegExp(`const\\s+${name}\\s*=\\s*([\\d.]+)`));
    if (!m) throw new Error(`config.js no longer defines ${name}`);
    return Number(m[1]);
}
const HEAL_INTERVAL = constant('GENERATOR_HEAL_INTERVAL');
const NEST_RANGE    = constant('GENERATOR_NEST_RANGE');
const HEAL_AMOUNT   = constant('GENERATOR_HEAL_AMOUNT');

function makeEnv(relay) {
    const calls = [];
    const gctx = new Proxy({}, {
        get(t, k) {
            if (k === 'canvas') return { width: 800, height: 600 };
            return (...a) => { calls.push({ op: k, args: a }); };
        },
        set() { return true; },
    });
    const sandbox = {
        console, Math, Object, Array, String, Number, Set, Map, isFinite, isNaN,
        world: [], actors: [], floatingTexts: [], _pillarCache: [],
        // The aura ring the link draw now paints asks the pylon's network tier
        // and its element colour. Tiers come from the game at runtime; an empty
        // table means "nothing networked", which is the honest default here.
        networkStrength: {},
        ...configNums(['GEN_AURA_RADIUS', 'GEN_AURA_PER_TIER', 'GEN_AURA_INTERVAL', 'GEN_AURA_HEAL']),
        _genPylons: [], _genLinks: [], _wPylons: [], _wPylonPairs: [],
        _pylonsWithPartner: new Set(),
        frame: 0, TILE_W: 60, TILE_H: 30,
        player: { x: 0, y: 2, visualX: 0, visualY: 2 },
        canvas: { width: 800, height: 600 }, ctx: gctx,
        campBuilt: relay ? { signal_relay: true } : {},
        GENERATOR_ID: 'generator',
        GENERATOR_HEAL_INTERVAL: HEAL_INTERVAL,
        GENERATOR_HEAL_AMOUNT: HEAL_AMOUNT,
    };
    sandbox.isCampBuilt = id => !!sandbox.campBuilt[id];
    sandbox.globalThis = sandbox;
    const ctx = vm.createContext(sandbox);

    // The real range rule out of camp.js.
    const camp = fs.readFileSync(path.join(ROOT, 'js/camp.js'), 'utf8');
    const rangeBlock = camp.match(/const PYLON_LINK_TILES[\s\S]*?function getPylonRange\(\)[\s\S]*?\n\}/);
    if (!rangeBlock) { console.log('  FAIL could not find getPylonRange in js/camp.js'); process.exit(1); }
    vm.runInContext(rangeBlock[0], ctx, { filename: 'camp.js:getPylonRange' });

    // ...and the real generator functions out of game.js.
    for (const name of ['rebuildGeneratorLinks', 'generatorHealTick', 'drawGeneratorLinks']) {
        const fn = GAME.match(new RegExp(`function ${name}\\(\\) \\{[\\s\\S]*?\\n\\}`));
        if (!fn) { console.log(`  FAIL could not find ${name} in js/game.js`); process.exit(1); }
        vm.runInContext(fn[0], ctx, { filename: 'game.js:' + name });
    }
    // The link draw now also draws the healing aura's reach, which asks the
    // pylon's network tier and the aura constants. Real function, real numbers.
    vm.runInContext(fnSource('js/game.js', 'pylonNetworkTier'), ctx, { filename: 'game.js:pylonNetworkTier' });
    // The real ELEMENTS declaration, evaluated rather than transcribed: the
    // aura ring colours itself from the pylon's element.
    vm.runInContext(CONFIG.match(/const ELEMENTS = \[[\s\S]*?\n\];/)[0], ctx, { filename: 'config.js:ELEMENTS' });
    return { sandbox, calls, run: s => vm.runInContext(s, ctx) };
}

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function eq(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
function ok(c, m) { if (!c) throw new Error(m); }

// ── fixtures ──────────────────────────────────────────────
function gen(x, y, extra) {
    return Object.assign({ x, y, pillar: true, destroyed: false, pillarTeam: 'green',
        health: 80, maxHealth: 80, isGenerator: true, attackMode: true, waveMode: false,
        attackModeElement: 'generator', attackModeColor: '#cdd6e0' }, extra || {});
}
function pylon(x, y, extra) {
    return Object.assign({ x, y, pillar: true, destroyed: false, pillarTeam: 'green',
        health: 40, maxHealth: 80, isGenerator: false, attackMode: true, waveMode: false,
        attackModeElement: 'fire', attackModeColor: '#ff3300' }, extra || {});
}
// Populate the caches the way the 60-frame world-cache block does.
function place(env, tiles) {
    env.sandbox.world.length = 0;
    env.sandbox._pillarCache.length = 0;
    env.sandbox._genPylons.length = 0;
    for (const t of tiles) {
        env.sandbox.world.push(t);
        if (t.pillar && !t.destroyed && t.health > 0) {
            env.sandbox._pillarCache.push(t);
            if (t.isGenerator) env.sandbox._genPylons.push(t);
        }
    }
    env.run('rebuildGeneratorLinks()');
}
const linked = (env, g, p) => env.run('_genLinks').some(l => l.gen === g && l.pylon === p);
// Advance whole heal intervals.
function heal(env, ticks) {
    for (let i = 0; i < ticks * HEAL_INTERVAL; i++) {
        env.sandbox.frame++;
        env.run('generatorHealTick()');
    }
}

group('what a generator is');

check('THE REPORTED CASE: there is a neutral pylon type called GENERATOR', () => {
    ok(/const GENERATOR_ID\s*=\s*"generator"/.test(CONFIG), 'no generator id');
    ok(/const GENERATOR_LABEL\s*=\s*"GENERATOR"/.test(CONFIG), 'it should be called GENERATOR');
    // Neutral: not one of the six elements followers are made of.
    const elBlock = CONFIG.match(/const ELEMENTS = \[[\s\S]*?\n\];/)[0];
    ok(!/generator/i.test(elBlock), 'the generator must not be an ELEMENT');
});

check('the pylon picker offers it alongside the six elements', () => {
    ok(/const PYLON_PICKER_TYPES = \[\.\.\.ELEMENTS,/.test(CONFIG), 'no picker list');
    // The picker's grid, geometry and tap indexing must all read the same list,
    // or a tap lands on a different cell than the one drawn.
    for (const re of [/const _EP_ROWS = Math\.ceil\(PYLON_PICKER_TYPES\.length/,
                      /PYLON_PICKER_TYPES\.forEach\(\(el, i\)/,
                      /const el   = PYLON_PICKER_TYPES\[idx\]/]) {
        ok(re.test(UI), 'ui.js still uses ELEMENTS somewhere the picker needs the full list: ' + re);
    }
});

check('it needs no unlock — it is neutral, not earned', () => {
    ok(/function isPylonTypeUnlocked/.test(CONFIG), 'no unlock helper');
    ok(/id === GENERATOR_ID \|\| unlockedElements\.has\(id\)/.test(CONFIG),
       'the generator should bypass element unlocks');
    ok(/isPylonTypeUnlocked\(el\.id\)/.test(UI), 'the picker should use the type-aware check');
    ok(/isPylonTypeUnlocked\(el\.id\)/.test(CMD), 'the build path should use it too');
});

check('it stays out of the elemental network', () => {
    // networkStrength/networkIntegrity and every zone effect come off _wPylons.
    ok(/_wPylons\s*=\s*_pillarCache\.filter\(t => t\.waveMode && t\.attackModeElement && !t\.isGenerator\)/.test(GAME),
       'a generator would be counted as part of an elemental network');
    ok(/_aPylons\s*=\s*_pillarCache\.filter\(t => t\.attackMode && !t\.isGenerator\)/.test(GAME),
       'a generator would be counted as an attack pylon');
    ok(/_genPylons\s*=\s*_pillarCache\.filter\(t => t\.isGenerator\)/.test(GAME),
       'generators are not cached');
});

check('no elemental zone effect can fire for it', () => {
    // applyPylonZoneEffects switches on the element id; there must be no
    // generator case and no default that would catch it.
    const at = GAME.indexOf('function applyPylonZoneEffects');
    const body = GAME.slice(at, GAME.indexOf('function rebuildPylonPairs'));
    ok(!/case "generator"/.test(body), 'a generator has an elemental zone effect');
    ok(!/\bdefault:/.test(body), 'a default case would give the generator an element effect');
});

group('linking to ally pylons');

check('THE REPORTED CASE: a generator links to friendly pylons in range', () => {
    const env = makeEnv();
    const g = gen(0, 2), p = pylon(2, 2);
    place(env, [g, p]);
    ok(linked(env, g, p), 'the generator did not link to the ally pylon beside it');
});

check('it links regardless of the pylon\'s element', () => {
    const env = makeEnv();
    const g = gen(0, 2);
    const ps = ['fire', 'ice', 'core', 'toxic'].map((el, i) =>
        pylon(1 + i * 0.5, 2, { attackModeElement: el }));
    place(env, [g, ...ps]);
    for (const p of ps) ok(linked(env, g, p), `should link to a ${p.attackModeElement} pylon`);
});

check('it never links to an enemy pylon', () => {
    const env = makeEnv();
    const g = gen(0, 2), foe = pylon(2, 2, { pillarTeam: 'red' });
    place(env, [g, foe]);
    ok(!linked(env, g, foe), 'linked to an enemy pylon');
});

check('range is the shared pylon range, not a number of its own', () => {
    ok(/const r = getPylonRange\(\), r2 = r \* r;/.test(GAME),
       'generator links should use getPylonRange()');
    const env = makeEnv();
    const r = env.run('getPylonRange()');
    const g = gen(0, 2);
    const near = pylon(r - 0.5, 2), far = pylon(r + 1, 2);
    place(env, [g, near, far]);
    ok(linked(env, g, near), 'a pylon inside range should link');
    ok(!linked(env, g, far), 'a pylon outside range should not');
});

check('Signal Relay extends a generator\'s reach too', () => {
    const plain = makeEnv(false), relay = makeEnv(true);
    ok(relay.run('getPylonRange()') > plain.run('getPylonRange()'), 'fixture: relay should extend range');
    const d = plain.run('getPylonRange()') + 0.5;
    for (const env of [plain, relay]) { const g = gen(0, 2); place(env, [g, pylon(d, 2)]); env._g = g; }
    eq(plain.run('_genLinks').length, 0, 'out of plain range');
    eq(relay.run('_genLinks').length, 1, 'the relay should bring it in range');
});

check('two generators support each other', () => {
    const env = makeEnv();
    const a = gen(0, 2), b = gen(2, 2);
    place(env, [a, b]);
    ok(linked(env, a, b) && linked(env, b, a), 'generators should chain');
});

check('a generator does not link to itself', () => {
    const env = makeEnv();
    const g = gen(0, 2);
    place(env, [g]);
    eq(env.run('_genLinks').length, 0, 'linked to itself');
});

check('no generators means no links and no work', () => {
    const env = makeEnv();
    place(env, [pylon(0, 2), pylon(1, 2)]);
    eq(env.run('_genLinks').length, 0, 'links without a generator');
});

group('healing what it is linked to');

check('THE REPORTED CASE: a linked pylon regains health', () => {
    const env = makeEnv();
    const g = gen(0, 2), p = pylon(2, 2, { health: 40 });
    place(env, [g, p]);
    heal(env, 1);
    eq(p.health, 40 + HEAL_AMOUNT, 'the linked pylon was not mended');
});

check('it heals every linked pylon, not just one', () => {
    const env = makeEnv();
    const g = gen(0, 2);
    const ps = [pylon(1, 2, { health: 10 }), pylon(1, 3, { health: 20 }), pylon(0, 3, { health: 30 })];
    place(env, [g, ...ps]);
    heal(env, 1);
    eq(ps.map(p => p.health).join(','),
       [10 + HEAL_AMOUNT, 20 + HEAL_AMOUNT, 30 + HEAL_AMOUNT].join(','), 'all three should mend');
});

check('healing is paced, not applied every frame', () => {
    const env = makeEnv();
    const g = gen(0, 2), p = pylon(2, 2, { health: 10 });
    place(env, [g, p]);
    for (let i = 0; i < HEAL_INTERVAL - 1; i++) { env.sandbox.frame++; env.run('generatorHealTick()'); }
    eq(p.health, 10, 'healed before its interval elapsed');
    env.sandbox.frame++; env.run('generatorHealTick()');
    eq(p.health, 10 + HEAL_AMOUNT, 'should heal on the interval');
});

check('it never overheals past maxHealth', () => {
    const env = makeEnv();
    const g = gen(0, 2), p = pylon(2, 2, { health: 79, maxHealth: 80 });
    place(env, [g, p]);
    heal(env, 10);
    eq(p.health, 80, 'health went past the cap');
});

check('it does not rebuild broken pylons — that is the CORE crew\'s job', () => {
    const env = makeEnv();
    const g = gen(0, 2);
    const wreck = pylon(2, 2, { destroyed: true, health: 0 });
    env.sandbox.world.length = 0;
    env.sandbox._pillarCache.length = 0; env.sandbox._genPylons.length = 0;
    env.sandbox.world.push(g, wreck);
    env.sandbox._pillarCache.push(g); env.sandbox._genPylons.push(g);
    // Even if a stale link survived a pylon breaking, healing must skip it.
    env.run('_genLinks = [{ gen: world[0], pylon: world[1] }]');
    heal(env, 5);
    eq(wreck.health, 0, 'a generator rebuilt wreckage that CORE workers are meant to fix');
});

check('a dead generator heals nothing', () => {
    const env = makeEnv();
    const g = gen(0, 2), p = pylon(2, 2, { health: 20 });
    place(env, [g, p]);
    ok(linked(env, g, p), 'fixture: should be linked');
    g.destroyed = true; g.health = 0;
    heal(env, 5);
    eq(p.health, 20, 'a destroyed generator kept healing');
});

check('the healing rate is meaningful but not absurd', () => {
    const perSec = (HEAL_AMOUNT / HEAL_INTERVAL) * 60;
    ok(perSec >= 1, `${perSec} HP/s is too little to be worth building`);
    // A predator bashing a pylon takes off far more than this; healing must not
    // make a pylon invulnerable to being chewed on.
    ok(perSec <= 8, `${perSec} HP/s would out-heal a predator bashing the pylon`);
});

group('drawing the links');

check('the links are drawn, and with the world not the interface', () => {
    const env = makeEnv();
    const g = gen(0, 2), p = pylon(2, 2);
    place(env, [g, p]);
    env.calls.length = 0;
    env.run('drawGeneratorLinks()');
    ok(env.calls.some(c => c.op === 'stroke'), 'nothing drawn for a live link');
    const at = GAME.indexOf('drawGeneratorLinks();');
    ok(at > -1, 'drawGeneratorLinks is never called');
    ok(at < GAME.indexOf('drawRadialMenu();'), 'should draw before the interface layer');
    eq((GAME.match(/^\s*drawGeneratorLinks\(\);/gm) || []).length, 1, 'called more than once');
});

check('with no links nothing is drawn at all', () => {
    const env = makeEnv();
    place(env, [pylon(0, 2)]);
    env.calls.length = 0;
    env.run('drawGeneratorLinks()');
    eq(env.calls.length, 0, 'drew something with no generator links');
});

check('a heal flash fades rather than sticking on', () => {
    const env = makeEnv();
    const g = gen(0, 2), p = pylon(2, 2, { health: 10 });
    place(env, [g, p]);
    heal(env, 1);
    ok(p._genHealFlash > 0, 'no flash on the frame it healed');
    const start = p._genHealFlash;
    for (let i = 0; i < start + 5; i++) env.run('drawGeneratorLinks()');
    eq(p._genHealFlash, 0, 'the flash never faded out');
});

group('where you may put one');

// The real placement rule out of config.js, plus the world it reads.
function placeEnv() {
    const env = makeEnv();
    for (const name of ['nestInGeneratorRange', 'canPlaceGenerator']) {
        const fn = CONFIG.match(new RegExp(`function ${name}\\([^)]*\\) \\{[\\s\\S]*?\\n\\}`));
        if (!fn) { console.log(`  FAIL could not find ${name} in js/config.js`); process.exit(1); }
        env.run(fn[0]);
    }
    env.run(`GENERATOR_NEST_RANGE = ${NEST_RANGE}`);
    return env;
}
function nest(x, y) { return { x, y, nest: true, nestHealth: 0, nestMaxHealth: 200 }; }

check('THE REPORTED CASE: a generator far from every nest is refused', () => {
    const env = placeEnv();
    env.sandbox.world.length = 0;
    env.sandbox.world.push(nest(0, -1));
    const far = { x: NEST_RANGE + 5, y: 2 };
    eq(env.run('canPlaceGenerator')(far).ok, false, 'placement should be refused out of reach');
});

check('a generator within reach of a nest is allowed', () => {
    const env = placeEnv();
    env.sandbox.world.length = 0;
    const n = nest(7, -1);
    env.sandbox.world.push(n);
    const r = env.run('canPlaceGenerator')({ x: 7, y: 2 });
    eq(r.ok, true, 'three tiles from the nest should be fine');
    eq(r.nest, n, 'it should name the nest it would serve');
});

check('the boundary is inclusive and does not drift', () => {
    const env = placeEnv();
    env.sandbox.world.length = 0;
    env.sandbox.world.push(nest(0, 0));
    eq(env.run('canPlaceGenerator')({ x: NEST_RANGE, y: 0 }).ok, true,  'exactly at the range');
    eq(env.run('canPlaceGenerator')({ x: NEST_RANGE + 0.01, y: 0 }).ok, false, 'just past it');
});

check('a nest you already destroyed still counts', () => {
    // A broken nest is exactly the one you want to link, so it must not be
    // excluded from the reach test.
    const env = placeEnv();
    env.sandbox.world.length = 0;
    env.sandbox.world.push(Object.assign(nest(2, -1), { nestHealth: 0 }));
    eq(env.run('canPlaceGenerator')({ x: 2, y: 2 }).ok, true, 'a dead nest should still anchor a generator');
});

check('the nearest nest is the one named', () => {
    const env = placeEnv();
    env.sandbox.world.length = 0;
    const near = nest(3, 2), far = nest(1, 2);
    // Nearest pushed FIRST, so an implementation that keeps the last match in
    // world order returns the far one and this fails.
    env.sandbox.world.push(near, far);
    ok(env.run('canPlaceGenerator')({ x: 4, y: 2 }).nest === near,
       'nearest should win, not last in world order');
});

check('no nests at all means no generators', () => {
    const env = placeEnv();
    env.sandbox.world.length = 0;
    eq(env.run('canPlaceGenerator')({ x: 0, y: 0 }).ok, false, 'allowed a generator with no nest anywhere');
});

check('a missing tile is refused rather than throwing', () => {
    const env = placeEnv();
    env.sandbox.world.length = 0;
    env.sandbox.world.push(nest(0, 0));
    eq(env.run('canPlaceGenerator')(null).ok, false, 'null tile');
    eq(env.run('canPlaceGenerator')(undefined).ok, false, 'undefined tile');
});

check('every path that creates a generator is gated', () => {
    // Build, instant build, and converting a pylon you already own.
    const gated = [...CMD.matchAll(/el\.id === GENERATOR_ID && !canPlaceGenerator\([^)]*\)\.ok/g)];
    eq(gated.length, 3, `expected all three creation paths gated, found ${gated.length}`);
    for (const fn of ['_executeBuild', '_executeBuildInstant', '_executeUpgrade']) {
        const at = CMD.indexOf('function ' + fn);
        ok(at > -1, 'missing ' + fn);
        ok(/canPlaceGenerator/.test(CMD.slice(at, at + 500)), fn + ' is not gated');
    }
});

check('the picker dims the option instead of offering a dead end', () => {
    ok(/const outOfRange = el\.id === GENERATOR_ID &&/.test(UI),
       'the picker does not check placement while drawing');
    ok(/NEEDS A NEST/.test(UI), 'the dimmed cell does not say why');
    // And a tap on it explains rather than doing nothing.
    const at = UI.indexOf('const el   = PYLON_PICKER_TYPES[idx];');
    ok(/refuseGenerator\(\)/.test(UI.slice(at, at + 400)), 'tapping a dimmed generator says nothing');
});

check('one refusal message, used everywhere', () => {
    ok(/function refuseGenerator/.test(CONFIG), 'no shared refusal');
    ok(/WITHIN " \+ GENERATOR_NEST_RANGE \+ " TILES OF A NEST/.test(CONFIG),
       'the message should quote the real range, not a copy of it');
    // Nothing should roll its own wording.
    for (const [name, src] of [['commands.js', CMD], ['ui.js', UI]]) {
        ok(!/MUST BE WITHIN/.test(src), name + ' has its own copy of the message');
    }
});

check('the link honours the same reach as the placement rule', () => {
    const INPUT = fs.readFileSync(path.join(ROOT, 'js/input.js'), 'utf8');
    ok(/> GENERATOR_NEST_RANGE/.test(INPUT),
       'handleNestConnectTap does not check the distance to the nest');
    ok(/TOO FAR FROM THE NEST/.test(INPUT), 'it does not say why the link was refused');
});

group('building one, and keeping it');

check('choosing GENERATOR sets the flag, choosing an element clears it', () => {
    ok(/pylon\.isGenerator\s*=\s*\(el\.id === GENERATOR_ID\)/.test(CMD),
       'swapping a pylon type should set or clear isGenerator');
    ok(/t\.isGenerator=\(el\.id===GENERATOR_ID\)/.test(CMD),
       'the build path should set the flag');
    ok(/p\.isGenerator = \(p\.attackModeElement === GENERATOR_ID\)/.test(NPC),
       'the follower-merge path should set the flag');
    ok(/p\.isGenerator=\(p\.chosenElement===GENERATOR_ID\)/.test(NPC),
       'the finished-construction path should set the flag');
});

check('a generator holds no wave network', () => {
    // waveMode is what puts a pylon into _wPylons; a neutral pylon must not
    // claim a slot in an elemental network.
    ok(/pylon\.waveMode = false; pylon\.attackMode = true;/.test(CMD),
       'converting to a generator should drop wave mode');
});

check('the colour lookup covers the generator', () => {
    // ELEMENTS.find would return undefined for "generator" and fall back to
    // the default green, so it would not read as neutral.
    ok(/PYLON_PICKER_TYPES\.find\(e=>e\.id===obj\.attackModeElement\)/.test(GAME),
       'the network highlight still looks the colour up in ELEMENTS');
    ok(/PYLON_PICKER_TYPES\.find\(e=>e\.id===p\.attackModeElement\)/.test(NPC),
       'the merge path still looks the colour up in ELEMENTS');
});

check('it survives a refresh', () => {
    ok(/isGenerator: !!t\.isGenerator/.test(SAVE), 'savePylons does not persist the flag');
    ok(/tile\.isGenerator\s*=\s*!!saved\.isGenerator/.test(INIT), 'the restore does not read it back');
});

console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
process.exit(failures ? 1 : 0);
