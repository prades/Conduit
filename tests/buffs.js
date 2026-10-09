// BUFFS — "Clones need to be more powerful, more enemies need to attack shield
// generators, buff the shield generator. Buff the toxic workers' ability."
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

    group('CLONES');

    await check('THE ASK: a clone has four times its species\' health and power (was three)', () => {
        const r = run(`(function(){ gameState.highestZoneCleared = 0; actors.length = 0;
            const c = makeClone('ant', 'scout', 5, 2), d = getClassDef(SPECIES.ant, 'scout');
            return { hp: c.maxHealth / d.health, pw: c.power / d.power, H: CLONE_HEALTH_MULT, P: CLONE_POWER_MULT }; })()`);
        ok(r.H === 4 && r.P === 4, JSON.stringify(r));
        ok(Math.abs(r.hp - 4) < 0.6 && Math.abs(r.pw - 4) < 0.6, 'not 4x at the front: ' + JSON.stringify(r));
    });
    await check('THE ASK: and it grows with the depth of your frontier, like the predators', () => {
        const r = run(`(function(){ actors.length = 0;
            gameState.highestZoneCleared = 0; const a = makeClone('ant', 'scout', 5, 2);
            gameState.highestZoneCleared = 10; const b = makeClone('ant', 'scout', 5, 2);
            gameState.highestZoneCleared = 20; const c = makeClone('ant', 'scout', 5, 2);
            gameState.highestZoneCleared = 0;
            return { a: a.maxHealth, b: b.maxHealth, c: c.maxHealth, pa: a.power, pc: c.power }; })()`);
        ok(r.b > r.a * 2 && r.c > r.b && r.pc > r.pa, JSON.stringify(r));
    });
    await check('it comes back in 20 seconds (was 30)', () => {
        ok(run('CLONE_RESPAWN_FRAMES') === 1200, 'respawn ' + run('CLONE_RESPAWN_FRAMES'));
    });
    await check('THE ASK (toxic): a clone being mended takes less from each hit', () => {
        const r = run(`(function(){ actors.length = 0; const c = makeClone('ant', 'scout', 5, 2); c.health = c.maxHealth = 1e6;
            const hit = () => { const h = c.health; applyDamage(c, 100, { team: 'red' }); return h - c.health; };
            const plain = hit(); c._mendedAt = frame; const mended = hit(); return { plain, mended }; })()`);
        ok(r.mended < r.plain * 0.9, JSON.stringify(r));
    });

    group('THE SHIELD GENERATOR');

    const gen = (extra) => run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.isConnector = false; t.isBattery = false; t.attackModeElement = null; } });
        shardCount = 999; const home = world.find(t => isHomePortal(t));
        const g = world.find(o => o.type === 'floor' && o.x === home.x + 2 && o.y === 2 && !o.nest && !o.nodeType);
        _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), g); _cacheAge = -999; render();
        const S = SPECIES.ant, q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), g.x + 4, g.y);
        q.team = 'red'; q.health = q.maxHealth = 1e6; actors.push(q);
        ${extra || ''}
        frame = (Math.floor(frame / 30) + 1) * 30; shieldGenHuntTick();
        const out = { hp: g.maxHealth, aggro: q.pylonAggro === g };
        alertActive = false; gameState.phase = 'day';
        return out; })()`);
    await check('THE ASK: tougher — 240 health, three times a pylon', () => {
        ok(gen().hp === run('SHIELD_GEN_HP') && run('SHIELD_GEN_HP') >= 200, 'hp ' + gen().hp);
    });
    await check('THE ASK: a bigger, faster, quicker-to-recover field', () => {
        const r = run('({ R: SHIELD_GEN_RANGE, rate: SHIELD_GEN_RATE, share: SHIELD_GEN_SHARE, min: SHIELD_GEN_MIN, delay: SHIELD_GEN_DELAY, cost: SHIELD_GEN_COST })');
        ok(r.R >= 5 && r.rate >= 8 && r.share >= 0.75 && r.min >= 30 && r.delay <= 120 && r.cost <= 0.03, JSON.stringify(r));
    });
    await check('THE ASK: at night, a generator hunter goes for it and bashes it', () => {
        ok(gen('gameState.phase = "night"; q._genHunter = true;').aggro, 'a night hunter ignored the generator');
        ok(!gen('gameState.phase = "night"; q._genHunter = false;').aggro, 'a predator not rolled as a hunter went for it');
        ok(!gen('q._genHunter = true;').aggro, 'it went for it by day');
    });
    await check('about a third of predators are generator hunters', () => {
        ok(Math.abs(run('SHIELD_GEN_HUNT_SHARE') - 0.35) < 0.11, 'share ' + run('SHIELD_GEN_HUNT_SHARE'));
    });
    await check('pylon hunters by day pick a generator before a nearer pylon', () => {
        ok(/\(t\.isGenerator \? 0\.5 : 1\)/.test(rd('js/infest.js')), 'hunters do not prefer generators');
    });

    group('TOXIC WAVE PYLONS');

    // A shield generator for power and two toxic disruption pylons linked
    // along y = 2; a unit held on the link between them for `frames`.
    const toxic = (who, frames, extra, elId) => run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.isConnector = false; t.isBattery = false; t.attackModeElement = null; t.waveAwake = undefined; t._awakeUntil = undefined; } if (t.nest) { t.powerOff = false; t.nestEnergy = undefined; } });
        shardCount = 9999; const home = world.find(t => isHomePortal(t));
        const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
        _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), T(home.x + 1, 3));
        const E = ELEMENTS.find(e => e.id === ${JSON.stringify(elId || 'toxic')}), a = T(home.x + 3, 2), b = T(home.x + 5, 2);
        _executeBuildInstant(E, a, 'disruption'); _executeBuildInstant(E, b, 'disruption');
        player.x = home.x - 12; player.y = 2;
        _cacheAge = -999; render();
        let u;
        if (${JSON.stringify(who)} === 'clone') { u = makeClone('ant', 'scout', home.x + 4, 2); u.health = u.maxHealth * 0.3; }
        if (${JSON.stringify(who)} === 'follower') { spawnFollowerAtCrystal('fire'); u = followers[followers.length - 1]; u.returningToCrystal = false; u.stance = 'hold'; u.maxHealth = 100; u.health = 30; }
        if (${JSON.stringify(who)} === 'enemy') { const S = SPECIES.ant; u = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), home.x + 4, 2); u.team = 'red'; u.health = u.maxHealth = 1e6; actors.push(u); }
        ${extra || ''}
        const h0 = u.health; globalThis.__ab = [a, b];
        for (let f = 0; f < ${frames}; f++) { u.x = home.x + 4; u.y = 2; render(); }
        return { gain: u.health - h0, awake: [a.waveAwake, b.waveAwake], max: u.maxHealth };
    })()`);
    await check('THE ASK: a toxic link mends a clone standing on it', () => {
        // Against a fire link, which mends nothing: the difference is the toxic link's.
        const r = toxic('clone', 120), fire = toxic('clone', 120, '', 'fire');
        ok(r.gain - fire.gain > r.max * 0.05, 'the toxic link barely mended the clone: ' + JSON.stringify({ toxic: r, fire }));
    });
    await check('THE ASK: and still poisons the predators on it', () => {
        const r = toxic('enemy', 120);
        ok(r.gain < 0, 'the enemy took nothing: ' + JSON.stringify(r));
    });
    await check('a hurt clone wakes the toxic pylons on its own', () => {
        const r = toxic('clone', 12);
        ok(r.awake[0] || r.awake[1], 'no pylon woke for the clone: ' + JSON.stringify(r));
    });
    await check('it does not mend followers (that is the clones\' tending)', () => {
        // Pylons mend anyone of yours standing right beside them anyway, so a
        // follower on a toxic link is compared with one on a fire link.
        const awake = 'a._awakeUntil = b._awakeUntil = Infinity;';
        const tox = toxic('follower', 120, awake), fire = toxic('follower', 120, awake, 'fire');
        ok(Math.abs(tox.gain - fire.gain) < 1e-6, 'the toxic link mended a follower: ' + JSON.stringify({ tox, fire }));
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
