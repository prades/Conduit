// THE WAVE LADDER — REPORTED: "the nymphs spawn as the first things that you
// see. The first waves have nymphs, rare spawn of an ant. The second wave less
// nymphs, then it becomes the next tier — the ant. And then it keeps going up
// in tiers, 10% chance for it to spawn, and double the amount of creatures in
// that spawn. Remove the grub completely. Nymphs drop the ant DNA."
// Asked: species ladder, every 2 waves, the rare tier in pairs, nymphs do not
// count toward the quota (it is scaled instead).
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
    run('gameState.running = true; ensureWorldTo(8 * ZONE_LENGTH); siegeToday = null;');
    // What a wave sends, sampled: { "ant.nymph": share, "ant.scout": … } by species and nymph-or-not.
    const sample = (wave, zone, n) => run(`(function(){ const out = {}; for (let i = 0; i < ${n || 3000}; i++) { const p = ladderPick(${wave}, ${zone || 1});
        const k = p.className === 'nymph' ? 'nymph' : p.species; out[k] = (out[k] || 0) + 1 / ${n || 3000}; } return out; })()`);

    group('THE LADDER');

    await check('THE ASK: wave 1 is nymphs, with a rare ant (10%)', () => {
        const s = sample(1);
        ok(Math.abs((s.nymph || 0) - 0.9) < 0.03 && Math.abs((s.ant || 0) - 0.1) < 0.03, JSON.stringify(s));
        ok(Object.keys(s).every(k => k === 'nymph' || k === 'ant'), 'something else came out: ' + JSON.stringify(s));
    });
    await check('THE ASK: wave 2 has fewer nymphs — half of it is ants now', () => {
        const s = sample(2);
        ok(Math.abs((s.nymph || 0) - 0.5) < 0.04 && Math.abs((s.ant || 0) - 0.5) < 0.04, JSON.stringify(s));
    });
    await check('THE ASK: then ants are the tier, with a rare beetle (10%), and so on up', () => {
        const s3 = sample(3), s4 = sample(4), s5 = sample(5);
        ok(!s3.nymph && Math.abs((s3.ant || 0) - 0.9) < 0.03 && Math.abs((s3.beetle || 0) - 0.1) < 0.03, 'wave 3: ' + JSON.stringify(s3));
        ok(Math.abs((s4.ant || 0) - 0.5) < 0.04 && Math.abs((s4.beetle || 0) - 0.5) < 0.04, 'wave 4: ' + JSON.stringify(s4));
        ok(Math.abs((s5.beetle || 0) - 0.9) < 0.03 && Math.abs((s5.scorpion || 0) - 0.1) < 0.03, 'wave 5: ' + JSON.stringify(s5));
        const order = run('[1,3,5,7,9,11,13].map(w => ladderSpecies(ladderTier(w)))');
        ok(JSON.stringify(order) === JSON.stringify(['ant', 'ant', 'beetle', 'scorpion', 'mantis', 'moth', 'spider']), JSON.stringify(order));
        ok(run('!!SYNTHETIC_SPECIES[ladderSpecies(ladderTier(15))]'), 'past the spider it does not reach the chimeras');
    });
    await check('every zone sends the wave\'s mix (no species per zone)', () => {
        const s = sample(1, 6);
        ok(Object.keys(s).every(k => k === 'nymph' || k === 'ant'), 'zone 6 on wave 1 sent ' + JSON.stringify(s));
    });
    await check('THE ASK: the rare next tier comes in PAIRS', () => {
        const r = run(`(function(){ actors.length = 0; gameState.nightNumber = 1;
            const keep = Math.random; let first = true;
            Math.random = () => { if (first) { first = false; return 0.95; } return 0.3; };   // the mix roll lands on the 10%
            try { spawnPredatorForZone(2); } finally { Math.random = keep; }
            return actors.map(a => a.speciesName + '.' + a.className); })()`);
        ok(r.length === 2 && r[0] === r[1] && r[0].startsWith('ant.') && !r[0].endsWith('nymph'), JSON.stringify(r));
    });
    await check('a nymph comes alone', () => {
        const r = run(`(function(){ actors.length = 0; gameState.nightNumber = 1;
            const keep = Math.random; Math.random = () => 0.1;
            try { spawnPredatorForZone(2); } finally { Math.random = keep; }
            return actors.map(a => a.className); })()`);
        ok(r.length === 1 && r[0] === 'nymph', JSON.stringify(r));
    });

    group('THE GRUB IS GONE');

    await check('THE ASK: no grub, no Brood Tyrant — not spawned, not in the code', () => {
        ok(run('typeof spawnGrub === "undefined" && typeof broodSpawnTick === "undefined" && typeof broodTick === "undefined" && typeof onTyrantDeath === "undefined"'), 'grub code still loaded');
        const r = run(`(function(){ actors.length = 0; gameState.nightNumber = 7; for (let i = 0; i < 400; i++) { gameState.running = true; crystal.health = crystal.maxHealth; render(); }
            return actors.filter(a => a.isGrub || a.isBrood).length; })()`);
        ok(r === 0, r + ' grubs');
        const html = rd('game.html');
        ok(!/BROOD TYRANT|the GRUB|THE GRUB/.test(html), 'the guide still describes the grub');
    });

    group('NYMPHS');

    await check('THE ASK: a nymph drops ANT DNA (an ant scout\'s), whatever species it was', () => {
        const r = run(`(function(){ const before = (getDNA()['ant_scout'] || 0), bn = (getDNA()['beetle_nymph'] || 0);
            const S = SPECIES.beetle, p = new Predator('nymph', Object.assign({}, getClassDef(S, 'nymph'), { color: S.color }), crystal.x + 5, 2);
            p.team = 'red'; p.speciesName = 'beetle'; p.className = 'nymph'; p.dnaDrops = 1; actors.push(p);
            p.dead = true; onPredatorDeath(p);
            return { ant: (getDNA()['ant_scout'] || 0) - before, beetleNymph: (getDNA()['beetle_nymph'] || 0) - bn }; })()`);
        ok(r.ant >= 1 && r.beetleNymph === 0, JSON.stringify(r));
    });
    await check('nymph-heavy waves ask for fewer kills (only the rest count)', () => {
        const r = run(`(function(){ const q = w => { gameState.nightNumber = w; alertSource = { x: 2 * ZONE_LENGTH + 7, y: 2 }; return enemiesThisWave(); };
            return { w1: q(1), w2: q(2), w3: q(3) }; })()`);
        ok(r.w1 >= 3 && r.w1 <= r.w2 && r.w2 <= r.w3 && r.w1 < r.w3, JSON.stringify(r));
    });

    group('THIEVES');

    await check('a thief is the wave\'s main species — an ant in the first waves', () => {
        ok(run('ladderMainSpecies(1)') === 'ant' && run('ladderMainSpecies(2)') === 'ant' && run('ladderMainSpecies(5)') === 'beetle', 'wrong thief species');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
