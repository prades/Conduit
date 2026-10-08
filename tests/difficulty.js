// THE DIFFICULTY RAMP AND NEST DROP-OFFS.
//
// THE ASK: "Should be able to bring shards to the nest wall zones instead of
// only crystal. Followers can spawn at the crystal still ... But I feel the
// game is too easy right now." Too easy: enemies die too fast, nights are too
// short, the squad is never in danger. Asked to ramp with depth.
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
    // The same scout made in zone `z`, `n` times; its health/power and how many hunt pylons.
    const made = (z, n) => run(`(function(){ let hp = 0, pw = 0, hunt = 0;
        for (let i = 0; i < ${n}; i++) { const S = SPECIES.ant; const p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 0, 0);
            applyZoneDifficulty(p, ${z}); hp += p.maxHealth; pw += p.power; if (p.huntsPylons) hunt++; }
        return { hp: hp / ${n}, pw: pw / ${n}, hunt: hunt / ${n}, base: SPECIES.ant.scout.health }; })()`);

    group('ZONES 1-2 STAY AS THEY ARE');

    await check('a zone 1 or 2 predator is untouched', () => {
        for (const z of [1, 2]) { const r = made(z, 1); ok(r.hp === r.base, `zone ${z}: ${r.hp} vs ${r.base}`); }
    });

    group('FROM ZONE 3 IT CLIMBS');

    await check('THE ASK: enemies take longer to kill and hit harder, zone after zone', () => {
        const z3 = made(3, 1), z6 = made(6, 1), z12 = made(12, 1);
        ok(z3.hp > z3.base && z6.hp > z3.hp && z12.hp > z6.hp, [z3.hp, z6.hp, z12.hp].join(' < '));
        ok(Math.abs(z6.hp / z6.base - (1 + run('RAMP_HP') * 4)) < 0.02, 'zone 6 health ×' + (z6.hp / z6.base));
        ok(z12.pw > z3.pw, 'damage does not climb');
    });
    await check('it levels off at RAMP_CAP — the endless deep growth takes over past zone 12', () => {
        ok(run('rampLevel(12)') === run('RAMP_CAP') && run('rampLevel(30)') === run('RAMP_CAP'), 'ramp ' + run('rampLevel(30)'));
    });
    await check('THE ASK: nights get longer from zone 3', () => {
        const q = z => run(`(function(){ alertSource = { x: ${z} * ZONE_LENGTH + 7, y: -1 }; gameState.nightNumber = 3; return enemiesThisWave(); })()`);
        ok(q(6) - q(2) > 4, `zone 2 quota ${q(2)}, zone 6 ${q(6)}`);
        ok(q(60) <= run('NIGHT_QUOTA_MAX'), 'no cap: ' + q(60));
    });
    await check('THE ASK: more of them come for your pylons, deeper in', () => {
        const a = made(2, 400).hunt, b = made(10, 400).hunt;
        ok(b > a + 0.2, `zone 2 ${a}, zone 10 ${b}`);
    });
    await check('both ways a predator is made get it', () => {
        ok(/applyZoneDifficulty\(predator, zoneIndex\)/.test(rd('js/clone.js')), 'the zone spawner does not');
        ok(/applyZoneDifficulty\(p, getZoneIndex/.test(rd('js/infest.js')), 'a nest hatch does not');
    });

    group('NEST DROP-OFFS');

    await check('THE ASK: a nest you hold is a drop-off, as well as the Crystal', () => {
        const r = run(`(function(){ const n = _nestCache.find(x => x.nestZone === 2); n.nestHealth = 0;
            const pts = massDropPoints(); return { n: pts.length, nest: pts.some(p => p.nest === n), crystal: pts.some(p => p.x === crystal.x && p.y === crystal.y) }; })()`);
        ok(r.nest && r.crystal, JSON.stringify(r));
    });
    await check('a worker carries mass to the NEAREST drop-off and is paid the same shards there', () => {
        const r = run(`(function(){ const n = _nestCache.find(x => x.nestZone === 2); n.nestHealth = 0;
            actors.length = 0; followers.length = 0; chargedMass.length = 0;
            spawnFollowerAtCrystal('electric'); const f = followers[0]; f.returningToCrystal = false; f.duty = 'worker';
            f.x = n.x + 1; f.y = 2;
            const m = spawnChargedMass(f.x, f.y, 7); m.state = MASS_STATE.CARRIED; m.carrier = f; f.carryingMass = m;
            const s0 = shardCount; let frames = 0;
            while (chargedMass.includes(m) && frames < 600) { _workHaul(f); updateChargedMass(); frames++; }
            return { delivered: !chargedMass.includes(m), gained: shardCount - s0, nearNest: Math.hypot(f.x - n.x, f.y - (n.y + 1)) < 1.6, frames }; })()`);
        ok(r.delivered && r.gained === 7, JSON.stringify(r));
        ok(r.nearNest, 'it walked somewhere other than the nest beside it: ' + JSON.stringify(r));
    });
    await check('a live (enemy) nest is not a drop-off, and followers are still only made at the Crystal', () => {
        const r = run(`(function(){ const n = _nestCache.find(x => x.nestZone === 3); n.nestHealth = n.nestMaxHealth || 200;
            return massDropPoints().some(p => p.nest === n); })()`);
        ok(r === false, 'a live nest took a delivery');
        ok(/x:crystal\.x, y:crystal\.y/.test(rd('js/helpers.js')), 'followers spawn somewhere else');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
