// DESTROY — "have a destroy option that automatically destroys pylons and
// gives you 8 shards".
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
    // A fire turret of yours on a free floor tile near home.
    const build = () => run(`(function(){ shardCount = 100; const home = world.find(t => isHomePortal(t));
        const t = world.find(o => o.type === 'floor' && o.x === home.x + 4 && o.y === 2 && !o.nest && !o.nodeType);
        t.pillar = false; _executeBuildInstant(ELEMENTS[0], t, 'attack'); _cacheAge = -999; render(); globalThis.__t = t; return shardCount; })()`);

    group('THE RING');

    await check('THE ASK: in build mode, the bottom of the ring on your pylon is DESTROY', () => {
        build();
        const r = run(`(function(){ buildMode = true; commandMode = true; commandTarget = __t; commandNestTarget = null;
            commandX = 300; commandY = 300; dragDX = 0; dragDY = RADIAL_RADIUS; selectedRadialAction = null;
            drawRadialMenu(); const a = selectedRadialAction;
            buildMode = false; selectedRadialAction = null; drawRadialMenu(); const b = selectedRadialAction; commandMode = false;
            return { a, b }; })()`);
        ok(r.a === 'demolish', 'build mode: ' + r.a);
        ok(r.b !== 'demolish', 'out of build mode the bottom is POSITION');
        ok(/selectedRadialAction = "demolish"/.test(rd('js/input.js')), 'the release-tap hit test does not mirror it');
    });

    group('DESTROYING');

    await check('THE ASK: it is gone, and you get DEMOLISH_REFUND shards', () => {
        const s0 = build();
        const r = run(`(function(){ commandTarget = __t; selectedRadialAction = 'demolish'; executeCommand(); render();
            return { pillar: __t.pillar, attack: __t.attackMode, shards: shardCount, inCache: _pillarCache.includes(__t), said: floatingTexts.map(f => f.text) }; })()`);
        ok(!r.pillar && !r.attack && !r.inCache, JSON.stringify(r));
        ok(r.shards === s0 + run('DEMOLISH_REFUND'), `shards ${s0} -> ${r.shards}`);
        ok(run('DEMOLISH_REFUND') === 8, 'the refund should be 8');
        ok(r.said.some(t => /PYLON DESTROYED \+8/.test(t)), 'not announced');
    });
    await check('the tile is free to build on again', () => {
        const r = run(`(function(){ shardCount = 100; _executeBuildInstant(ELEMENTS[0], __t, 'attack'); return { pillar: __t.pillar, tomb: __t.demolished }; })()`);
        ok(r.pillar && r.tomb === false, JSON.stringify(r));
    });
    await check('not a pylon the enemy holds, and not one mid-build', () => {
        build();
        const r = run(`(function(){ __t.pillarTeam = 'red'; const a = demolishPylon(__t); __t.pillarTeam = 'green';
            __t.constructing = true; const b = demolishPylon(__t); __t.constructing = false; return { a, b, still: __t.pillar }; })()`);
        ok(!r.a && !r.b && r.still, JSON.stringify(r));
    });
    await check('a generator can be destroyed too, and its nest link is let go', () => {
        const r = run(`(function(){ shardCount = 100; const home = world.find(t => isHomePortal(t));
            const g = world.find(o => o.type === 'floor' && o.x === home.x + 1 && o.y === 2 && !o.nest && !o.nodeType);
            g.pillar = false; _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), g); _cacheAge = -999; render();
            const linked = !!g.nestConnection; const ok_ = demolishPylon(g);
            return { linked, ok_, gen: g.isGenerator, link: g.nestConnection, home: home.connectedPylon === g }; })()`);
        ok(r.ok_ && !r.gen && !r.link && !r.home, JSON.stringify(r));
    });

    group('RELOAD');

    await check('a destroyed pylon the world had placed does not grow back on a reload', () => {
        const r = run(`(function(){ const t = world.find(o => o.pillar && o.pillarTeam === 'green' && !o.constructing && o.x > 10);
            demolishPylon(t); savePylons();
            const saved = JSON.parse(localStorage.getItem('tubecrawler_pylons'));
            return { tomb: saved.some(s => s.x === t.x && s.y === t.y && s.demolished) }; })()`);
        ok(r.tomb, 'the save does not remember it');
        ok(/if \(saved\.demolished\) \{ tile\.pillar = false;/.test(rd('js/init.js')), 'the reload does not honour it');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
