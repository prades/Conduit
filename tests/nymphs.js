// REPORTED: "Make nymphs not grant any points." Asked: no shards (charged
// mass) and no kill toward the night's quota. They still drop DNA.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
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
    const kill = cls => run(`(function(){
        const S = SPECIES.ant, def = Object.assign({}, getClassDef(S, ${JSON.stringify(cls)}), { color: S.color });
        const p = new Predator(${JSON.stringify(cls)}, def, crystal.x + 6, 2);
        p.team = 'red'; p.speciesName = 'ant'; p.className = ${JSON.stringify(cls)}; p.dnaDrops = def.dnaDrops; p.shardDrop = def.shardDrop;
        actors.push(p);
        const mass0 = chargedMass.length, dna0 = JSON.stringify(getDNA()), kills0 = nightKillCount;
        p.health = 0; p.dead = true;
        onPredatorDeath(p); p.deathProcessed = true;
        render();
        return { mass: chargedMass.length - mass0, kills: nightKillCount - kills0,
                 dna: JSON.stringify(getDNA()) !== dna0 }; })()`);

    console.log('\nNYMPHS');
    await check('THE ASK: a dead nymph leaves no charged mass — it is worth no shards', () => {
        const n = kill('nymph'), s = kill('scout');
        ok(s.mass === 1, 'fixture: a scout left no mass: ' + JSON.stringify(s));
        ok(n.mass === 0, 'a nymph left mass: ' + JSON.stringify(n));
    });
    await check('THE ASK: a dead nymph does not count toward the night\'s kills', () => {
        const n = kill('nymph'), s = kill('striker');
        ok(s.kills === 1, 'fixture: a striker did not count: ' + JSON.stringify(s));
        ok(n.kills === 0, 'a nymph counted: ' + JSON.stringify(n));
    });
    await check('it still drops its DNA (not asked to change)', () => {
        ok(kill('nymph').dna, 'a nymph dropped no DNA');
    });
    await check('where most spawns are nymphs the quota counts only the rest, so the wave can still be cleared', () => {
        // The nymph tier is wave 1 (90% nymphs) and wave 2 (half); wave 3 has none.
        const r = run(`(function(){ const keep = alertSource, n0 = gameState.nightNumber;
            alertSource = { x: 2 * ZONE_LENGTH + 7, y: 2 };
            const q = w => { gameState.nightNumber = w; return enemiesThisWave(); };
            const out = { w1: q(1), w3: q(3), floor: NYMPH_QUOTA_FLOOR };
            alertSource = keep; gameState.nightNumber = n0; return out; })()`);
        ok(r.w1 < r.w3 && r.w1 >= r.floor, 'wave 1 asks for ' + JSON.stringify(r));
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
