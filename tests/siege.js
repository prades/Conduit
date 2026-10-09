// NIGHT SIEGE MODIFIERS — docs/ROADMAP-top5.md §3.
//
// From night 3, each night rolls one modifier as the alarm turns day into
// night — never the same as last night — and it lifts at dawn.
//   BLACKOUT       nests regenerate nothing
//   SWARM TIDE     most spawns are nymphs, at half health, and more of them
//   HUNTER'S MOON  every predator hunts pylons; pylons take 20% less bash
//   STATIC STORM   electric doubled for both sides
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
    const set = id => run(`siegeToday = ${JSON.stringify(id)};`);

    group('THE ROLL');

    await check('no modifier before night SIEGE_FROM_NIGHT, one every night after', () => {
        const r = run(`(function(){ siegeLast = null; const early = rollSiege(SIEGE_FROM_NIGHT - 1);
            const later = []; for (let n = SIEGE_FROM_NIGHT; n < SIEGE_FROM_NIGHT + 40; n++) { later.push(rollSiege(n)); endSiege(); }
            return { early, later }; })()`);
        ok(r.early === null, 'a modifier on night ' + (run('SIEGE_FROM_NIGHT') - 1));
        ok(r.later.every(x => run('Object.keys(SIEGES)').includes(x)), JSON.stringify(r.later));
        ok(new Set(r.later).size === run('Object.keys(SIEGES).length'), 'not every modifier came up in 40 nights: ' + [...new Set(r.later)]);
    });
    await check('never the same two nights running', () => {
        const seq = run(`(function(){ siegeLast = null; const s = []; for (let i = 0; i < 60; i++) { s.push(rollSiege(10)); endSiege(); } return s; })()`);
        for (let i = 1; i < seq.length; i++) ok(seq[i] !== seq[i - 1], 'repeated ' + seq[i] + ' at ' + i);
    });
    await check('THE ASK: the alarm that starts a night announces it, and the banner carries it', () => {
        const r = run(`(function(){ siegeToday = null; siegeLast = null; floatingTexts.length = 0; gameState.phase = 'day'; gameState.nightNumber = 5;
            triggerAlarm('zone', 20, 2); const said = floatingTexts.map(t => t.text);
            return { id: siegeToday, said, banner: objectiveText() }; })()`);
        ok(r.id, 'no modifier on night 6');
        const label = run(`SIEGES[${JSON.stringify(r.id)}].label`);
        ok(r.said.some(t => t.includes(label)), 'not announced: ' + JSON.stringify(r.said));
        ok(r.banner.includes(label), 'the banner does not carry it: ' + r.banner);
    });
    await check('it lifts at dawn — nextWave ends it — and a new game starts clean', () => {
        ok(/if \(typeof endSiege === "function"\) endSiege\(\);/.test(rd('js/waves.js')), 'nextWave does not end the siege');
        const r = run(`(function(){ siegeToday = 'storm'; endSiege(); return { today: siegeToday, last: siegeLast }; })()`);
        ok(r.today === null && r.last === 'storm', JSON.stringify(r));
        ok(/siegeToday = null; siegeLast = null;/.test(rd('js/waves.js')), 'restartGame does not clear it');
    });
    await check('it survives a refresh mid-night', () => {
        const r = run(`(function(){ siegeToday = 'hunt'; siegeLast = 'storm'; gameState.phase = 'night'; saveSession();
            const sess = JSON.parse(localStorage.getItem('tubecrawler_session'));
            siegeToday = null; siegeLast = null; applySession(sess);
            return { today: siegeToday, last: siegeLast, saved: sess.fight && sess.fight.siege }; })()`);
        ok(r.saved === 'hunt' && r.today === 'hunt' && r.last === 'storm', JSON.stringify(r));
        run(`siegeToday = null; gameState.phase = 'day';`);
    });

    group('THE MODIFIERS');

    await check('BLACKOUT: nests regenerate nothing', () => {
        const regen = id => { set(id); return run(`(function(){ const n = world.find(t => isHomePortal(t)); n.nestEnergy = 10;
            for (let i = 0; i < 120; i++) nestEnergyTick(); return n.nestEnergy - 10; })()`); };
        const on = regen('blackout'), off = regen(null);
        ok(on === 0 && off > 0, `blackout regained ${on}, a normal night ${off}`);
    });
    await check('SWARM TIDE: most spawns are nymphs at half health, and the zone cap rises', () => {
        set('swarm');
        const r = run(`(function(){ let ny = 0, half = 0; const n = 60;
            for (let i = 0; i < n; i++) { const p = spawnPredatorForZone(2, {}); if (p.className === 'nymph') ny++;
                const def = getClassDef(SPECIES[p.speciesName] || SYNTHETIC_SPECIES[p.speciesName], p.className);
                if (p.maxHealth <= Math.ceil(def.health * SIEGE_SWARM_HP) + 1) half++; p.dead = true; }
            actors = actors.filter(a => !a.dead); return { ny, half, n }; })()`);
        set(null);
        ok(r.ny >= r.n * 0.5, `${r.ny} of ${r.n} were nymphs`);
        ok(r.half >= r.n * 0.8, `${r.half} of ${r.n} at half health`);
        ok(/\(2 \+ z \+ \(typeof siegeIs === "function" && siegeIs\("swarm"\) \? SIEGE_SWARM_CAP : 0\)\)/.test(rd('js/game.js')), 'the zone cap does not rise');
    });
    await check("HUNTER'S MOON: every predator spawned hunts pylons, and pylons take less bash", () => {
        set('hunt');
        const r = run(`(function(){ let h = 0; for (let i = 0; i < 20; i++) { const p = spawnPredatorForZone(1, {}); if (p.huntsPylons) h++; p.dead = true; }
            actors = actors.filter(a => !a.dead); return h; })()`);
        set(null);
        ok(r === 20, `${r} of 20 hunt pylons`);
        ok(/siegeIs\("hunt"\) \? SIEGE_HUNT_BASH : 1/.test(rd('js/predator.js')), 'the bash is not softened');
    });
    await check('STATIC STORM: electric hits double, for anyone', () => {
        const hit = id => { set(id); return run(`(function(){ const S = SPECIES.ant; const q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 3, 2);
            q.health = q.maxHealth = 1000; applyDamage(q, 10, null, 'electric'); return 1000 - q.health; })()`); };
        const storm = hit('storm'), calm = hit(null);
        ok(storm === calm * 2, `storm ${storm} vs calm ${calm}`);
        const f = run(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.health = f.maxHealth = 1000; f.stats = Object.assign({}, f.stats, { defense: 0 });
            siegeToday = 'storm'; applyDamage(f, 10, null, 'electric'); const a = 1000 - f.health; f.health = 1000; siegeToday = null; applyDamage(f, 10, null, 'electric'); return { a, b: 1000 - f.health }; })()`);
        ok(Math.abs(f.a - f.b * 2) < 1e-6, 'your side is not hit double too: ' + JSON.stringify(f));
    });
    await check('STATIC STORM: the haste bonus doubles', () => {
        set('storm'); const a = run('stormHaste(1.35)'); set(null); const b = run('stormHaste(1.35)');
        ok(Math.abs(a - 1.7) < 1e-9 && b === 1.35, `${a} / ${b}`);
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
