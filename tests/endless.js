// AN ENDLESS TUNNEL — "the game stops at zone 13, no predators spawn. Make
// sure the game is infinite and the enemies scale throughout and become bigger."
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

    // Every zone up to `cleared` taken, an alarm in the next one, `frames` run.
    const night = (cleared, frames) => run(`(function(){
        actors.length = 0; followers.length = 0; zonePredators = {}; zoneRespawnTimers = {};
        gameState.highestZoneCleared = ${cleared}; gameState.nightNumber = ${cleared} * 2 + 1;
        // Zones past the frontier are live again (an earlier scenario may have taken them).
        _nestCache.forEach(n => { if (n.nestZone > ${cleared}) n.nestHealth = n.nestMaxHealth || 200; });
        for (let z = 1; z <= ${cleared}; z++) neutraliseZone(z);
        const z = ${cleared} + 1;
        gameState.phase = 'day'; alertActive = false;
        for (let i = 0; i < 130; i++) render();                // the ground ahead gets built
        triggerAlarm('zone', z * ZONE_LENGTH + 7, -1);
        for (let i = 0; i < ${frames}; i++) render();
        _cacheAge = -999;
        const ps = actors.filter(a => a instanceof Predator && !a.dead && a.team !== 'green' && a.homeZone === z);
        const out = { z, n: ps.length, nest: !!_nestCache.find(n => n.nestZone === z), built: lastGenX >= (z + 1) * ZONE_LENGTH,
                      hp: ps.length ? ps.reduce((s, p) => s + p.maxHealth, 0) / ps.length : 0,
                      w: ps.length ? ps.reduce((s, p) => s + p.dimensions.width, 0) / ps.length : 0, deep: ps.length ? ps[0].deepLevel || 0 : 0 };
        alertActive = false; gameState.phase = 'day'; return out; })()`);

    group('NO END');

    await check('THE REPORTED CASE: zone 13 has its nest, its ground, and predators', () => {
        const r = night(12, 600);
        ok(r.nest && r.built, 'zone 13 does not exist: ' + JSON.stringify(r));
        ok(r.n > 0, 'no predators in zone 13: ' + JSON.stringify(r));
    });
    await check('and so do zones 20 and 40', () => {
        for (const c of [19, 39]) { const r = night(c, 600); ok(r.nest && r.built && r.n > 0, JSON.stringify(r)); }
    });
    await check('the spawner follows the frontier, not a fixed list of zones', () => {
        const G = rd('js/game.js');
        ok(!/Math\.min\(gameState\.nightNumber, 12\)/.test(G), 'the 12-zone cap is still there');
        ok(/for \(let z = _zLo; z <= hostileZoneCount; z\+\+\)/.test(G), 'the spawn loop does not use the frontier window');
    });
    await check('the ground ahead of the frontier is built even if you never walk there', () => {
        ok(/ensureWorldTo\(\(nextZoneToTake\(\) \+ ZONE_SPAWN_AHEAD \+ 1\) \* ZONE_LENGTH\)/.test(rd('js/game.js')), 'no build-ahead');
    });

    group('THEY SCALE, AND GROW');

    await check('THE ASK: deeper predators are tougher and BIGGER, zone after zone', () => {
        const a = night(12, 600), b = night(20, 600), c = night(35, 600);
        ok(a.deep === 1 && b.deep === 9 && c.deep === 24, 'deep levels ' + [a.deep, b.deep, c.deep]);
        // Health and size compared like for like: the SAME species and class
        // made at each depth. Averaging whatever the night happened to send
        // was flaky — the class is rolled (nymph to boss, about 30x the
        // health), so one boss in a handful decided the result either way.
        const same = run(`[13, 21, 36].map(z => { const sp = getSyntheticZoneSpecies(99);
            const p = _spawnPredatorAt(sp, 'scout', z * ZONE_LENGTH + 7, 1); p.dead = true;
            return { hp: p.maxHealth, w: p.dimensions.width }; })`);
        ok(same[1].hp > same[0].hp && same[2].hp > same[1].hp, 'health does not climb: ' + same.map(q => Math.round(q.hp)));
        ok(same[1].w > same[0].w && same[2].w > same[1].w, 'size does not grow: ' + same.map(q => Math.round(q.w)));
    });
    await check('the multipliers, and a size cap so they stay on screen', () => {
        const r = run(`({ z12: deepZoneScale(12), z13: deepZoneScale(13), z200: deepZoneScale(200) })`);
        ok(r.z12.hp === 1 && r.z12.size === 1, 'designed zones are left alone: ' + JSON.stringify(r.z12));
        ok(r.z13.hp > 1 && r.z13.size > 1 && r.z13.reward > 1, JSON.stringify(r.z13));
        ok(r.z200.size === run('DEEP_SIZE_MAX'), 'size is not capped: ' + r.z200.size);
    });
    await check('a deep night has a quota you can finish', () => {
        const q = run(`(function(){ alertSource = { x: 100 * ZONE_LENGTH + 7, y: -1 }; gameState.nightNumber = 201; return enemiesThisWave(); })()`);
        ok(q <= run('NIGHT_QUOTA_MAX'), 'quota ' + q);
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
