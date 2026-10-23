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
    run('gameState.running = true; ');
    run('unlockedElements = new Set(ELEMENTS.map(e => e.id));'); // A late game: every element held (the ladder unlocks them two waves apart).
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
        // Two charged batteries of yours in zone 1: what a thief eats now.
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.isBattery = false; t.destroyed = false; } });
        const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
        globalThis.__b1 = T(__held.x + 2, 2); globalThis.__b2 = T(__held.x + 4, 2);
        for (const b of [__b1, __b2]) { _executeBuildInstant(ELEMENTS.find(e => e.id === 'fire'), b, 'battery'); b.charge = 80; }
        _pillarCache = world.filter(t => t.pillar && !t.destroyed && t.health > 0);
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
        reset('__b1.pillar = false; __b2.pillar = false; _pillarCache = [];'); run('_raidTimer = 0'); step(400);
        ok(run('raidThieves().length') === 0, 'a raid with no battery to eat');
        run('alertActive = false');
    });

    group('THE BATTERY EATER');

    // One thief from zone 2, stood beside your first battery.
    const thief = (near) => run(`(function(){ const p = spawnThief(__n2); p._infestSettle = 0;
        ${near ? 'p.x = __b1.x + 0.5; p.y = __b1.y + 1.1;' : ''} globalThis.__p = p; return true; })()`);

    await check('THE ASK: it goes after your battery, not your nest, and eats it', () => {
        reset(); thief(true);
        const s0 = run('shardCount');
        step(run('RAID_EAT_FRAMES') - 5);
        ok(run('__p._raidSiphoning === __b1'), 'it is not feeding on the battery');
        ok(!run('__b1.destroyed'), 'the battery went before it had finished');
        ok(run('shardCount') === s0, 'it took shards');
        step(10);
        const r = run('({ wrecked: __b1.destroyed, charge: __b1.charge, eaten: __p.batteriesEaten })');
        ok(r.wrecked && r.charge === 0 && r.eaten === 1, JSON.stringify(r));
    });
    await check('THE ASK: eating one makes it more powerful', () => {
        reset(); thief(true);
        const a = run('({ hp: __p.maxHealth, pw: __p.power, sp: __p.moveSpeed, w: __p.dimensions.width })');
        step(run('RAID_EAT_FRAMES') + 5);
        const b = run('({ hp: __p.maxHealth, pw: __p.power, sp: __p.moveSpeed, w: __p.dimensions.width, full: __p.health === __p.maxHealth })');
        ok(b.hp > a.hp * 1.4 && b.pw > a.pw && b.sp > a.sp && b.w > a.w, JSON.stringify({ a, b }));
        ok(b.full, 'it was not healed by it');
    });
    await check('THE ASK: it cannot touch your nest until it has eaten a battery', () => {
        reset(); thief(false);
        let nestBefore = false;
        for (let i = 0; i < 60 && !run('__p.batteriesEaten'); i++) { step(20); if (!run('__p.batteriesEaten') && run('!!(__p._raidSiphoning && __p._raidSiphoning.nest)')) nestBefore = true; }
        ok(run('__p.batteriesEaten') >= 1, 'fixture: it never ate');
        ok(!nestBefore, 'it fed on a nest before it had eaten a battery');
    });
    await check('it walks there first, from its own nest', () => {
        reset(); thief(false);
        const d0 = run('Math.abs(__p.x - __b1.x)'); step(300);
        ok(run('Math.abs(__p.x - __b1.x)') < d0 - 2, 'it did not head for your battery');
    });
    await check('THE ASK: once it has eaten one, it steals from your nest — more for each battery — and runs home', () => {
        reset(); thief(true);
        step(run('RAID_EAT_FRAMES') + 5);
        ok(run('__p.batteriesEaten') === 1, 'fixture: it did not eat');
        const s0 = run('shardCount');
        let stolen = 0;
        for (let i = 0; i < 250 && !stolen; i++) { step(10); stolen = run("__p.stolen || 0"); }
        const r = run('({ take: __p._raidTake * __p.batteriesEaten, eaten: __p.batteriesEaten })');
        ok(stolen > 0, 'it never stole from your nest');
        ok(stolen === r.take, 'it stole ' + stolen + ', not ' + r.take);
        ok(run('shardCount') === s0 - stolen, 'your shard count did not drop');
        run('__p.x = raidMouth(__p._raidHome).x; __p.y = raidMouth(__p._raidHome).y;'); step(5);
        const h = run('({ stock: __p._raidHome.stolenStock + nestMachines(__p._raidHome).length * MACHINE_COST, gone: !actors.includes(__p), killed: !!__p.killCounted && __p._enteredNest !== true })');
        ok(h.gone, 'the thief is still on the map');
        ok(h.stock === stolen + r.eaten * run('RAID_EAT_BANK'), 'its nest banked ' + h.stock);
    });
    await check('THE ASK: kill it carrying and every shard comes back', () => {
        reset(); thief(true);
        step(run('RAID_EAT_FRAMES') + 5);
        let stolen = 0;
        for (let i = 0; i < 250 && !stolen; i++) { step(10); stolen = run("__p.stolen || 0"); }
        const before = run('shardCount');
        run('__p.health = 0; __p.dead = true; onPredatorDeath(__p);');
        ok(run('shardCount') === before + stolen, 'had ' + before + ', it carried ' + stolen + ', now ' + run('shardCount'));
    });
    await check('a battery nearer than your nest is eaten on the way (up to three)', () => {
        reset('__b2.x; '); thief(true);
        // Move the second battery right beside the first, so it is nearer than the nest.
        run(`(function(){ const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
            __b2.pillar = false; globalThis.__b2 = T(__b1.x + 1, 2); _executeBuildInstant(ELEMENTS.find(e => e.id === 'fire'), __b2, 'battery'); __b2.charge = 50;
            _pillarCache = world.filter(t => t.pillar && !t.destroyed && t.health > 0); })()`);
        step(run('RAID_EAT_FRAMES') + 5);
        for (let i = 0; i < 60 && run('__p.batteriesEaten') < 2; i++) step(10);
        ok(run('__p.batteriesEaten') === 2 && run('__b2.destroyed'), 'it walked past the nearer battery: ate ' + run('__p.batteriesEaten'));
    });
    await check('THE ASK: kill it after it has eaten and it drops a bigger lump of charged mass', () => {
        reset(); thief(true);
        const plain = run('Math.max(1, Math.round((__p.shardDrop || 5) * MASS_VALUE_SCALE))');
        step(run('RAID_EAT_FRAMES') + 5);
        run('chargedMass.length = 0; __p.health = 0; __p.dead = true; onPredatorDeath(__p);');
        const v = run('chargedMass.length ? chargedMass[0].value : 0');
        ok(v > plain, 'it dropped ' + v + ' (an uneaten thief drops ' + plain + ')');
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

    await check('THE ASK: fire does little to the jellies, electric is good against them', () => {
        reset();
        const r = run(`(function(){
            const m = spawnMachine('strider', __n2); m._assemble = 0;
            const hit = el => { m.health = m.maxHealth = 1e6; m.shielded = false; applyDamage(m, 100, { team: 'green', x: m.x, y: m.y }, el); return 1e6 - m.health; };
            return { fire: hit('fire'), electric: hit('electric'), ice: hit('ice'), bySource: (function(){ m.health = 1e6; applyDamage(m, 100, { team: 'green', element: 'fire' }); return 1e6 - m.health; })() };
        })()`);
        ok(Math.abs(r.ice - 100) < 1e-6, 'a neutral element did not land as normal: ' + JSON.stringify(r));
        ok(r.fire <= r.ice * 0.3, 'fire is not weak: ' + JSON.stringify(r));
        ok(r.electric >= r.ice * 1.9, 'electric is not strong: ' + JSON.stringify(r));
        ok(r.bySource <= r.ice * 0.3, 'a fire attacker passing no element got through in full: ' + JSON.stringify(r));
    });
    await check('ordinary predators are not affected', () => {
        const r = run(`(function(){ const S = SPECIES.ant, q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 0, 0); q.team = 'red'; q.health = q.maxHealth = 1e6;
            applyDamage(q, 100, { team: 'green' }, 'fire'); return 1e6 - q.health; })()`);
        ok(Math.abs(r - 100) < 1e-6, 'a predator took ' + r + ' from a 100 fire hit');
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
        ok(/BATTERY THIEVES/.test(html) && /eats it/.test(html) && !/SHARD THIEVES/.test(html) && /SENTRY/.test(html) && /STRIDER/.test(html), 'not in the docs');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
