// AUTOPLAY — the squad plays by itself (js/autoplay.js).
//
// THE ASK: "create a simple set of instructions for the followers to use to
// autoplay the game by themselves, including hacking the nests ... build pylon
// networks and extend the pylons from different conquered nests and increase
// the network tier ... make them use their ultimates, and bundle all of this
// into an autoplay feature button."
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
    const fresh = (n) => run(`(function(){ autoplayOn = false; actors.length = 0; followers.length = 0; floatingTexts.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.isConnector = false; t.attackModeElement = null; } if (t.nest) t._autoEl = undefined; });
        alertActive = false; gameState.phase = 'day'; gameState.highestZoneCleared = 0; shardCount = 500;
        for (let i = 0; i < ${n}; i++) { spawnFollowerAtCrystal(['core','core','fire','ice','electric','toxic'][i % 6]); followers[followers.length - 1].returningToCrystal = false; }
        _cacheAge = -999; render(); return followers.length; })()`);

    group('THE BUTTON');

    await check('THE ASK: an AUTOPLAY button on the top bar turns it on and off', () => {
        ok(/id="btnAuto"[^>]*onclick="toggleAutoplay\(\)"/.test(rd('game.html')), 'no button');
        fresh(3);
        const r = run(`(function(){ const a = autoplayOn; toggleAutoplay(); const b = autoplayOn; toggleAutoplay(); return { a, b, c: autoplayOn }; })()`);
        ok(!r.a && r.b && !r.c, JSON.stringify(r));
    });
    await check('turning it off hands the squad back — no autoplay orders left standing', () => {
        fresh(4);
        const r = run(`(function(){ autoplayOn = true; frame = Math.ceil(frame / AUTOPLAY_THINK) * AUTOPLAY_THINK; _autoHack();
            const had = followers.filter(f => f.hackOrder).length; toggleAutoplay();
            return { had, left: followers.filter(f => f.hackOrder || (f.job && f.job.type === 'move')).length }; })()`);
        ok(r.had > 0 && r.left === 0, JSON.stringify(r));
    });

    group('HACKING');

    await check('THE ASK: a follower ORDERED to hack, standing at the nest, hacks it — and sets the alarm', () => {
        fresh(1);
        const r = run(`(function(){ const n = _nestCache.find(x => x.nestZone === 1); const c = nestHackCentre(n); const f = followers[0];
            player.x = player.targetX = n.x - 10; player.y = player.targetY = 3;
            f.hackOrder = n; for (let i = 0; i < NEST_HACK_FRAMES + 5; i++) { f.x = c.x; f.y = c.y; f.job = null; render(); }
            const out = { alarm: alertActive, zone: alertZone }; alertActive = false; gameState.phase = 'day'; return out; })()`);
        ok(r.alarm && r.zone === 1, JSON.stringify(r));
    });
    await check('a follower merely standing there does NOT', () => {
        fresh(1);
        const r = run(`(function(){ const n = _nestCache.find(x => x.nestZone === 1); const c = nestHackCentre(n); const f = followers[0];
            player.x = player.targetX = n.x - 10; player.y = player.targetY = 3;
            for (let i = 0; i < NEST_HACK_FRAMES + 5; i++) { f.x = c.x; f.y = c.y; f.job = null; render(); }
            return { alarm: alertActive, prog: n.nestHackProgress }; })()`);
        ok(!r.alarm && !r.prog, JSON.stringify(r));
    });
    await check('it sends a hack team to the next nest', () => {
        fresh(6);
        const r = run(`(function(){ _autoHack(); const n = _autoNextNest(); const c = nestHackCentre(n);
            const team = followers.filter(f => f.hackOrder === n);
            return { zone: n.nestZone, n: team.length, jobs: team.every(f => f.job && f.job.type === 'move' && f.job.target.x === c.x && f.job.target.y === c.y) }; })()`);
        ok(r.zone === 1 && r.n === run('AUTOPLAY_HACK_TEAM') && r.jobs, JSON.stringify(r));
    });
    await check('a follower on a move order is not held up by a neutral recruit it cannot hurt', () => {
        ok(/let bd2=actor\.hackOrder \? 2\.25 : 20\.25;[\s\S]{0,80}isHostileTarget\(a\)/.test(rd('js/npc.js')), 'the move order still engages any non-green unit');
    });

    group('BUILDING');

    await check('THE ASK: it builds a generator at a nest you hold, then grows a linked network to tier III', () => {
        fresh(6);
        const r = run(`(function(){ for (let i = 0; i < 14; i++) { _autoBuild(); _cacheAge = -999; render(); }
            const home = homePortalTile();
            const gen = world.find(t => t.pillar && t.isGenerator && Math.hypot(t.x - home.x, t.y - home.y) <= GENERATOR_NEST_RANGE);
            const el = home._autoEl; const net = world.filter(t => t.pillar && t.attackModeElement === el && !t.isGenerator && !t.isConnector);
            return { gen: !!gen, el, n: net.length, tier: networkStrength[el], waves: net.filter(t => t.waveMode).length, cons: world.filter(t => t.pillar && t.isConnector).length }; })()`);
        ok(r.gen, 'no generator');
        ok(r.el === 'core', 'the network should be in the commonest squad element: ' + r.el);
        ok(r.n === run('AUTOPLAY_NETWORK_SIZE') && r.tier === 3, JSON.stringify(r));
        ok(r.waves >= 2, 'no support/disruption pylons in the mix: ' + r.waves);
        ok(r.cons >= 1, 'no connector reaching toward the next zone');
    });
    await check('it stops when the shards run out', () => {
        fresh(2);
        const r = run(`(function(){ shardCount = PYLON_BUILD_COST - 1; const before = world.filter(t => t.pillar).length; _autoBuild();
            return world.filter(t => t.pillar).length - before; })()`);
        ok(r === 0, 'built ' + r + ' with no shards');
    });

    await check('short of shards by day, the player goes to siphon a wall panel no further out than the next zone', () => {
        fresh(3);
        const r = run(`(function(){ shardCount = 0; const p = _autoSafePanel(); _autoHack();
            const z = p ? zoneOfTile(p) : null;
            return { panel: !!p, safe: p ? z <= nextZoneToTake() : null, tx: player.targetX, px: p && p.x }; })()`);
        ok(r.panel && r.safe && r.tx === r.px, JSON.stringify(r));
    });

    group('ULTIMATES AND WAVES');

    await check('THE ASK: a full ultimate with an enemy close is fired', () => {
        fresh(1);
        const r = run(`(function(){ const f = followers[0]; let fired = 0; const u = FOLLOWER_ULTIMATES[f.element], keep = u.execute; u.execute = () => { fired++; };
            const S = SPECIES.ant; const q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), f.x + 1, f.y); q.team = 'red'; q.health = q.maxHealth = 999; actors.push(q);
            f.ultimateCharge = 100; _autoUltimates(); const near = fired; q.x = f.x + 20; f.ultimateCharge = 100; _autoUltimates();
            u.execute = keep; return { near, far: fired - near }; })()`);
        ok(r.near === 1 && r.far === 0, JSON.stringify(r));
    });
    await check('a cleared wave is advanced on its own, after a pause to read it', () => {
        const r = run(`(function(){ let called = 0; const keep = nextWave; nextWave = () => { called++; };
            autoplayOn = true; gameState.phase = 'waveComplete'; gameState.running = false; _autoWaveSince = 0;
            autoplayWatch(); const first = called;
            _autoWaveSince -= AUTOPLAY_NEXT_WAVE_MS + 10; autoplayWatch();
            nextWave = keep; autoplayOn = false; gameState.phase = 'day'; gameState.running = true; return { first, after: called }; })()`);
        ok(r.first === 0 && r.after === 1, JSON.stringify(r));
    });
    await check('it keeps about a quarter of the squad on the work crew, for shards', () => {
        fresh(8);
        const r = run(`(function(){ _autoWorkCrew(); return followers.filter(f => f.duty === 'worker').length; })()`);
        ok(r === 2, r + ' of 8 working');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
