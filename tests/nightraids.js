// NIGHT RAIDS — LATERAL ATTACK and BEHEMOTH (js/nightraids.js).
//
// THE REPORTED CASE: "make different types of night raid statuses. One where
// it's a lateral attack and all the nests start leaking predators into the map
// instead of just one at the very end of the tunnel. And one where it's like a
// really big boss monster."
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function check(name, fn) {
    try { fn(); console.log('  ok   ' + name); }
    catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); }
}
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

async function boot() {
    const sb = makeBrowserSandbox({});
    const context = vm.createContext(sb);
    for (const rel of scriptOrder()) {
        try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), context, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = src => vm.runInContext(src, context);
    run(`gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); ensureWorldTo(10 * ZONE_LENGTH);
         // Zones 1 and 2 are yours; the night's alarm is in zone 3.
         neutraliseZone(1); neutraliseZone(2); gameState.highestZoneCleared = 2; gameState.nightNumber = 4;
         player.x = player.targetX = player.visualX = 20; player.y = player.targetY = player.visualY = 1.5;
         triggerAlarm('zone', 3 * ZONE_LENGTH + 7, -1);
         actors = actors.filter(a => !(a instanceof Predator));`);
    return run;
}

(async () => {
    console.log('\nTHE NIGHTS');
    {
        const run = await boot();
        check('both are siege nights the night can roll', () => {
            ok(run('!!SIEGES.lateral && !!SIEGES.behemoth'), 'not in SIEGES');
            const seen = new Set(run(`(function(){ const out = []; for (let i = 0; i < 300; i++) { siegeLast = null; out.push(rollSiege(5)); } return out; })()`));
            ok(seen.has('lateral') && seen.has('behemoth'), 'rolled: ' + [...seen]);
        });
    }

    console.log('\nLATERAL ATTACK');
    {
        const run = await boot();
        const N = (sel) => run(`actors.filter(a => a instanceof Predator && !a.dead && !a.isClone && (${sel})).length`);
        run(`siegeToday = 'lateral';`);
        check('THE ASK: the nests you hold leak predators into your own ground', () => {
            const r = run(`(function(){ const held = world.filter(t => t.nest && !(t.nestHealth > 0) && t.nestZone >= 1 && !isHomePortal(t));
                for (let i = 0; i < 1200; i++) { frame++; lateralTick(); }
                const out = actors.filter(a => a._lateral && !a.dead);
                return { held: held.map(t => t.nestZone), n: out.length, zones: out.map(p => getZoneIndex(Math.floor(p.x))), hostile: out.every(p => !p.isWanderer) }; })()`);
            ok(r.held.length >= 2, 'fixture: two held nests ' + JSON.stringify(r.held));
            ok(r.n >= r.held.length, 'leaked ' + r.n + ' from ' + r.held.length + ' nests');
            ok(r.zones.every(z => r.held.includes(z)), 'they came out of zones ' + r.zones + ', not the held ones ' + r.held);
            ok(r.hostile, 'a leaker is a wanderer');
        });
        check('…up to LATERAL_PER_NEST from each, no more', () => {
            for (let i = 0; i < 3; i++) run(`for (let i = 0; i < 1200; i++) { frame++; lateralTick(); }`);
            const per = run(`world.filter(t => t._lateral).map(t => t._lateral.filter(p => !p.dead).length)`);
            ok(per.every(n => n <= run('LATERAL_PER_NEST')), 'per nest ' + per);
        });
        check('THE ASK: and every enemy nest sends at full strength, not just the one ahead', () => {
            const src = fs.readFileSync(path.join(ROOT, 'js/game.js'), 'utf8');
            ok(/siegeIs\("lateral"\)\)\);/.test(src), 'the spawner does not treat every zone as an alarm zone on a lateral night');
        });
        check('on any other night nothing leaks', () => {
            run(`actors = actors.filter(a => !a._lateral); world.forEach(t => { t._lateral = []; t._lateralAt = -1e9; }); siegeToday = 'blackout';`);
            run(`for (let i = 0; i < 1200; i++) { frame++; lateralTick(); }`);
            same(N('a._lateral'), 0, 'leakers on a blackout night');
        });
    }

    console.log('\nBEHEMOTH');
    {
        const run = await boot();
        run(`siegeToday = 'behemoth'; behemoth = null; _behemothSpawned = false;`);
        check('THE ASK: one really big boss rises — once', () => {
            const r = run(`(function(){ for (let i = 0; i < 5; i++) behemothTick();
                const bs = actors.filter(a => a.isBehemoth);
                const ref = spawnPredatorForZone(3, { species: behemoth.speciesName, className: 'boss' }); ref.dead = true;
                return { n: bs.length, hp: behemoth.maxHealth, refHp: ref.maxHealth, w: behemoth.dimensions.width, refW: getClassDef(SPECIES[behemoth.speciesName] || SYNTHETIC_SPECIES[behemoth.speciesName], 'boss').width,
                         lv: behemoth.level, refLv: ref.level, ownHp: Math.round(behemoth.base.hp * levelFactor(behemoth.level)), boss: behemoth.isBoss, heavy: vortexPullImmune(behemoth) }; })()`);
            same(r.n, 1, 'behemoths');
            ok(Math.abs(r.hp - r.ownHp * run('BEHEMOTH_HP')) <= 2, 'health ' + r.hp + ', ' + run('BEHEMOTH_HP') + '× its level\'s ' + r.ownHp);
            ok(r.w > r.refW * 1.5, 'size ' + r.w + ' vs ' + r.refW);
            ok(r.lv > r.refLv, 'level ' + r.lv + ' vs ' + r.refLv);
            ok(r.boss && r.heavy, 'not a boss / can be dragged');
        });
        check('THE ASK: the night is not over while it lives, kill quota or not', () => {
            const r = run(`(function(){ gameState.phase = 'night'; nightKillCount = 99; nightEnemiesTarget = 1; checkWaveClear();
                const held = gameState.phase === 'night';
                behemoth.health = 0; behemoth.dead = true; behemothDeathCheck(); checkWaveClear();
                return { held, after: gameState.phase }; })()`);
            same(r.held, true, 'the night ended with the behemoth alive');
            same(r.after, 'waveComplete', 'the night did not end when it fell');
        });
        check('it pays: its drops are a fortune', () => {
            const r = run(`(function(){ const p = spawnPredatorForZone(3, { species: 'ant', className: 'boss' }); const s0 = p.shardDrop, d0 = p.dnaDrops;
                makeBehemoth(p); p.dead = true; return { s: p.shardDrop / s0, d: p.dnaDrops / Math.max(1, d0) }; })()`);
            ok(r.s >= 4 && r.d >= 4, JSON.stringify(r));
        });
        check('its health is the bar across the top, and the banner names it', () => {
            run(`siegeToday = 'behemoth'; gameState.phase = 'night'; alertActive = true; behemoth = null; _behemothSpawned = false; behemothTick();`);
            run('drawBehemothBar();');
            ok(/THE BEHEMOTH/.test(run('objectiveText()')), run('objectiveText()'));
        });
    }

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
