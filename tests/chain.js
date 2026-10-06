// POWER DOWN THE CHAIN, AND TIER III FROM TURRETS.
//
// REPORTED: "I feel like tier 3 cannot be achieved, because I tried to lay down
// a bunch of electric pylons and it didn't ever get to level 3." Measured: of
// eight electric pylons in a row by a generator, ONE was lit — a generator only
// reached pylons within link range of itself and pylons did not pass power on —
// and only wave pylons counted toward a tier, while a new pylon defaulted to a
// turret. Both fixed: power runs down a chain of pylons, and every lit pylon of
// an element counts toward its tier.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
async function check(name, fn) {
    try { await fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true; if (typeof tutorialMode !== "undefined") tutorialMode = false;');

    // A generator by home, then `n` electric pylons two tiles apart heading
    // away from it, built the way the player builds them. Runs `frames`.
    const lay = (kind, n, frames, gap) => run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false;
            t.isConnector = false; t.attackModeElement = null; t.waveTripped = false; t.circuitOn = undefined; t.nestConnection = null; }
            if (t.nest) { t.powerOff = false; t.nestEnergy = undefined; } });
        shardCount = 9999;
        const home = world.find(t => isHomePortal(t));
        const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
        const g = T(home.x + 1, 0); _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), g);
        const el = ELEMENTS.find(e => e.id === 'electric'), built = [];
        for (let i = 0; i < ${n}; i++) { const t = T(home.x + 2 + i * ${gap || 2}, 2); if (!t) continue;
            _executeBuildInstant(el, t, ${JSON.stringify(kind)}); built.push(t); }
        _cacheAge = -999;
        for (let f = 0; f < ${frames}; f++) render();
        return { n: built.length, lit: built.filter(t => t.powered).length, tier: networkStrength.electric,
                 far: Math.max(...built.map(t => Math.hypot(t.x - g.x, t.y - g.y))), reach: getPylonRange(),
                 viaPylon: built.filter(t => t.powerGen && !isRelayPylon(t.powerGen)).length,
                 state: built.map(t => pylonPowerState(t).text) };
    })()`);

    group('POWER DOWN THE CHAIN');

    await check('THE REPORTED CASE: eight pylons in a row are all lit', () => {
        const r = lay('wave', 8, 120);
        ok(r.n === 8, 'fixture: built ' + r.n);
        ok(r.far > r.reach * 2, 'fixture: the row should run well past one generator\'s reach');
        ok(r.lit === 8, `only ${r.lit} of 8 lit`);
    });
    await check('the ones past the generator are fed by their neighbour', () => {
        const r = lay('attack', 8, 120);
        ok(r.viaPylon >= 5, `only ${r.viaPylon} took power from a pylon`);
        ok(r.state.every(s => /^POWERED/.test(s)), 'INFO says otherwise: ' + JSON.stringify(r.state));
    });
    await check('a gap wider than link range breaks the chain', () => {
        const r = lay('attack', 4, 120, 4);
        ok(r.lit < 4, 'power jumped a gap no pylon spans');
    });
    await check('the chain leg is wired pylon to pylon, never nest to pylon', () => {
        ok(/if \(!isRelayPylon\(gen\)\) continue;/.test(rd('js/game.js')), 'drawPowerChain would wire a nest to a plain pylon');
    });

    group('TIER III');

    await check('THE REPORTED CASE: six or more electric wave pylons reach tier III', () => {
        const r = lay('wave', 8, 120);
        ok(r.tier === 3, 'tier ' + r.tier);
    });
    await check('and so do turrets: every lit pylon of the element counts', () => {
        const r = lay('attack', 8, 120);
        ok(r.tier === 3, 'tier ' + r.tier);
    });
    await check('it holds: the home reserve keeps a tier III wave row lit for 30 seconds', () => {
        const r = lay('wave', 6, 1800);
        ok(r.tier === 3 && r.lit === 6, JSON.stringify({ tier: r.tier, lit: r.lit }));
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
