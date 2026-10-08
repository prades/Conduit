// RAIDS — "whenever there's nothing going on, the enemies will spawn from the
// three nests that haven't been conquered, and they'll migrate down and start
// sucking on the nests ... they'll rob you of your shards and they can take it
// to their nests to multiply and create new forms of machinery that is hostile
// and needs to be taken out."
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
    run('ensureWorldTo(8 * ZONE_LENGTH)');

    // Zone 1's nest is yours; zones 2.. are live. Nobody on the map; quiet day.
    const reset = (extra) => run(`(function(){
        actors.length = 0; followers.length = 0; floatingTexts.length = 0; followerProjectiles.length = 0;
        gameState.phase = 'day'; alertActive = false; clearRaids();
        world.forEach(t => { if (t.nest && !isHomePortal(t)) { t.nestHealth = getZoneIndex(t.x) === 1 ? 0 : t.nestMaxHealth; t.stolenStock = 0; t.massStock = 0; } });
        _nestCache = world.filter(t => t.nest);
        shardCount = 100;
        globalThis.__held = world.find(t => t.nest && getZoneIndex(t.x) === 1);
        globalThis.__n2 = world.find(t => t.nest && getZoneIndex(t.x) === 2);
        ${extra || ''}
    })()`);
    const step = n => run(`for (let i = 0; i < ${n}; i++) { frame++; actors.forEach(a => { if (!a.dead && a.update) a.update(); }); raidTick(); actors = actors.filter(a => !a.dead); }`);

    group('WHEN THEY COME');

    await check('THE ASK: on a quiet day the three nearest unconquered nests each send a thief', () => {
        reset();
        run('_raidTimer = 0'); step(1 + 2 * run('RAID_STAGGER') + 1);
        const r = run(`({ n: raidThieves().length, from: raidThieves().map(p => getZoneIndex(p._raidHome.x)).sort(), live: _liveEnemyNests().length })`);
        ok(r.live > 3, 'fixture: only ' + r.live + ' live nests');
        ok(r.n === 3, 'thieves: ' + r.n);
        ok(JSON.stringify(r.from) === '[2,3,4]', 'they came from zones ' + JSON.stringify(r.from));
    });
    await check('not at night, not in an alarm, not before you hold a nest', () => {
        reset('gameState.phase = "night";'); run('_raidTimer = 0'); step(400);
        ok(run('raidThieves().length') === 0, 'a raid at night');
        reset('alertActive = true;'); run('_raidTimer = 0'); step(400);
        ok(run('raidThieves().length') === 0, 'a raid during an alarm');
        reset('__held.nestHealth = __held.nestMaxHealth; _nestCache = world.filter(t => t.nest);'); run('_raidTimer = 0'); step(400);
        ok(run('raidThieves().length') === 0, 'a raid with no nest of yours to rob');
        run('alertActive = false');
    });

    group('THE THEFT');

    // One thief from zone 2, stood next to your nest.
    const thief = (near) => run(`(function(){ const p = spawnThief(__n2); p._infestSettle = 0;
        ${near ? 'p.x = __held.x + 0.3; p.y = 0;' : ''} globalThis.__p = p; return true; })()`);

    await check('THE ASK: it siphons your nest, then your shard count drops by what it carries', () => {
        reset(); thief(true);
        step(run('RAID_SIPHON_FRAMES') - 5);
        ok(run('shardCount') === 100, 'took shards before the siphon finished');
        ok(run('__p._raidSiphoning === __held'), 'not siphoning the held nest');
        step(10);
        const r = run('({ count: shardCount, stolen: __p.stolen, take: __p._raidTake })');
        ok(r.stolen === r.take && r.count === 100 - r.take, JSON.stringify(r));
    });
    await check('it walks there first, from its own nest', () => {
        reset(); thief(false);
        const d0 = run('Math.abs(__p.x - __held.x)'); step(300);
        ok(run('Math.abs(__p.x - __held.x)') < d0 - 2, 'it did not head for your nest');
    });
    await check('carrying, it runs home and banks them in its nest; that is not a kill', () => {
        reset(); thief(true);
        step(run('RAID_SIPHON_FRAMES') + 5);
        const take = run('__p.stolen');
        run('__p.x = __n2.x + 0.4; __p.y = 0;'); step(5);
        const r = run('({ stock: __n2.stolenStock, gone: !actors.includes(__p), dead: __p.dead, killed: !__p.killCounted })');
        ok(r.stock === take, 'nest stock ' + r.stock + ', carried ' + take);
        ok(r.gone, 'the thief is still on the map');
    });
    await check('carrying, a fight does not stop it', () => {
        reset(); thief(true); step(run('RAID_SIPHON_FRAMES') + 5);
        run('__p.provoked = true; __p.lastAttacker = player;');
        const x0 = run('__p.x'); step(60);
        ok(run('__p.x') > x0 + 0.5, 'it stopped running home');
    });
    await check('THE ASK: kill it with the loot and every shard comes back', () => {
        reset(); thief(true); step(run('RAID_SIPHON_FRAMES') + 5);
        const before = run('shardCount'), take = run('__p.stolen');
        run('__p.health = 0; __p.dead = true; onPredatorDeath(__p);');
        ok(run('shardCount') === before + take, `had ${before}, carried ${take}, now ${run('shardCount')}`);
    });

    group('THE MACHINES');

    await check('THE ASK: banked shards build a SENTRY, then a STRIDER, then hatch predators', () => {
        reset();
        run('raidBank(__n2, MACHINE_COST, null)');
        const a = run('nestMachines(__n2).map(m => m.machineKind)');
        ok(JSON.stringify(a) === '["sentry"]', 'first: ' + JSON.stringify(a));
        run('raidBank(__n2, MACHINE_COST, null)');
        const b = run('nestMachines(__n2).map(m => m.machineKind).sort()');
        ok(JSON.stringify(b) === '["sentry","strider"]', 'second: ' + JSON.stringify(b));
        const n0 = run('actors.filter(a => !a.isMachine).length');
        run('raidBank(__n2, MACHINE_HATCH_COST, null)');
        ok(run('actors.filter(a => !a.isMachine).length') === n0 + 1, 'the surplus did not hatch');
        ok(run('__n2.stolenStock') === 0, 'stock left ' + run('__n2.stolenStock'));
    });
    await check('a machine assembles first: part-armoured, and it does not fire', () => {
        reset();
        run(`raidBank(__n2, MACHINE_COST, null); globalThis.__m = nestMachines(__n2)[0];
             spawnFollowerAtCrystal('fire'); globalThis.__f = followers[followers.length - 1]; __f.returningToCrystal = false; __f.spawnProtection = 0;`);
        ok(run('__m.health < __m.maxHealth * 0.5'), 'it started at full armour');
        run(`for (let i = 0; i < 200; i++) { frame++; __f.x = __m.x + 2; __f.y = __m.y; __f.spawnProtection = 0; __m.update(); }`);
        ok(run('followerProjectiles.length') === 0, 'it fired while assembling');
    });
    await check('THE ASK: the sentry shoots your squad in range, and stays bolted down', () => {
        run(`__m._assemble = 0; for (let i = 0; i < 120; i++) { frame++; __f.x = __m.x + 2; __f.y = __m.y; __f.spawnProtection = 0; __m.x += 0.3; __m.update(); }`);
        const r = run('({ shots: followerProjectiles.filter(s => s.targetsGreen).length, moved: Math.hypot(__m.x - __m._anchorX, __m.y - __m._anchorY) })');
        ok(r.shots >= 1, 'no shots at a follower in range');
        ok(r.moved < 0.01, 'it was pushed ' + r.moved);
        run('followerProjectiles.length = 0');
        run(`for (let i = 0; i < 200; i++) { frame++; __f.x = __m.x + MACHINE_DEFS.sentry.range + 1; __f.y = __m.y; __m.update(); }`);
        ok(run('followerProjectiles.length') === 0, 'it shot out of range');
    });
    await check('THE ASK: the strider walks onto your nest and drains it', () => {
        reset();
        run(`globalThis.__s = spawnMachine('strider', __n2); __s._assemble = 0; __s.x = __held.x + 3; __s.y = 0;`);
        run(`for (let i = 0; i < 2000 && !__s._raidSiphoning; i++) { frame++; __s.update(); }`);
        ok(run('__s._raidSiphoning === __held'), 'it never reached your nest');
        const c0 = run('shardCount');
        run(`for (let i = 0; i < MACHINE_DEFS.strider.drainEvery * 3 + 2; i++) { frame++; __s.update(); }`);
        ok(run('shardCount') <= c0 - 3, `drained ${c0 - run('shardCount')} shards`);
        ok(run('__n2.stolenStock') >= 3, 'the drained shards did not go to its nest');
    });
    await check('machines do not decay, do not count against the predator ceiling, and salvage when destroyed', () => {
        reset(); run(`globalThis.__m = spawnMachine('sentry', __n2); __m._assemble = 0; __m.health = __m.maxHealth;`);
        ok(run('livePredatorCount()') === 0, 'a machine counted as a predator');
        const hp = run('__m.health'); run('render()');
        ok(run('__m.health') === hp || run('__m.dead') === false && run('__m.health') >= hp - 0.001, 'it decayed');
        const c0 = run('shardCount');
        run('__m.health = 0; __m.dead = true; onPredatorDeath(__m);');
        ok(run('shardCount') > c0, 'no salvage');
    });
    await check('machines stand through the turn of a wave', () => {
        ok(/isMachine/.test(run('nextWave.toString()')), 'nextWave wipes every actor, machines included');
    });

    group('SAVE');

    await check('the nest bank and the machines survive a refresh', () => {
        reset(); run(`__n2.stolenStock = 7; globalThis.__m = spawnMachine('sentry', __n2); __m._assemble = 0; __m.health = 77;`);
        const blob = run('JSON.stringify(serialiseRaids())');
        reset(); run('__n2.stolenStock = 0');
        run(`restoreRaids(${blob})`);
        const r = run(`({ s: __n2.stolenStock, m: nestMachines(__n2).map(m => m.machineKind + ':' + Math.round(m.health)) })`);
        ok(r.s === 7 && JSON.stringify(r.m) === '["sentry:77"]', JSON.stringify(r));
        ok(/raids:/.test(run('saveSession.toString()')), 'saveSession does not write it');
    });

    group('DRAWING');

    await check('both machines, a thief and the siphon beam draw without error', () => {
        reset(); thief(true); step(20);
        run(`spawnMachine('sentry', __n2); const s = spawnMachine('strider', __n2); s._assemble = 0; s.drained = 2;`);
        run('player.x = player.visualX = __held.x; player.y = player.visualY = 1; render(); render();');
        run(`actors.filter(a => a.isMachine).forEach(m => _drawPredator(m, 100, 100, ctx)); drawThiefTag(__p, 100, 100); drawRaidOverlay();`);
        ok(/isMachine/.test(run('_drawPredator.toString()')), 'the predator draw does not hand machines to drawMachine');
    });
    await check('no shadowBlur in the raid drawing (the effects rules)', () => {
        const src = rd('js/raids.js');
        ok(!/shadowBlur\s*=\s*[1-9]/.test(src), 'raids.js sets a shadowBlur');
    });
    await check('the docs describe thieves and machines', () => {
        const html = rd('game.html');
        ok(/SHARD THIEVES/.test(html) && /SENTRY/.test(html) && /STRIDER/.test(html), 'not in the docs');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
