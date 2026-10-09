// SUPPORT AND DISRUPTION PYLONS, AND WAKING.
//
// THE ASK: "make it to where the wave pylons are labeled as the support or the
// disruption pylons, and they only activate when there is an ally or an enemy
// nearby. For instance, a follower is near an electric wave pylon and it will
// blink and activate the effect of the tiered network that is active."
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

    // A generator and six wave pylons of `el` in a row by home (tier III), the
    // player parked far away. `who` is null, 'ally' or 'enemy', held at the
    // third pylon for `frames`. Returns the pylons' state and the pool spent.
    const scene = (el, who, frames) => run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false;
            t.isConnector = false; t.isBattery = false; t.attackModeElement = null; t.waveTripped = false; t.circuitOn = undefined; t.nestConnection = null;
            t.waveAwake = undefined; t._awakeUntil = undefined; t._wakeFrame = undefined; }
            if (t.nest) { t.powerOff = false; t.nestEnergy = undefined; } });
        shardCount = 9999;
        const home = world.find(t => isHomePortal(t));
        const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
        _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), T(home.x + 1, 2));
        const E = ELEMENTS.find(e => e.id === ${JSON.stringify(el)}), ps = [];
        for (let i = 0; i < 6; i++) { const t = T(home.x + 2 + i * 2, 2); _executeBuildInstant(E, t, waveRole(E.id)); ps.push(t); }
        // Tier III comes from a bank of six batteries now (config.js BATTERY_TIER_SIZES).
        for (let i = 0; i < 6; i++) _executeBuildInstant(E, T(home.x + 2 + i * 2, 3), 'battery');
        player.x = home.x - 12; player.y = 2;
        _cacheAge = -999; for (let f = 0; f < 70; f++) render();
        globalThis.__ps = ps;
        let unit = null;
        if (${JSON.stringify(who)} === 'ally') { spawnFollowerAtCrystal('fire'); unit = followers[followers.length - 1]; }
        if (${JSON.stringify(who)} === 'enemy') { const S = SPECIES.ant; unit = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 0, 0);
            unit.team = 'red'; unit.speciesName = 'ant'; unit.className = 'scout'; unit.health = unit.maxHealth = 1e6; actors.push(unit); }
        const src = ps[2].powerSource; src.nestEnergy = nestEnergyMax(src) * 0.5;
        const before = nestEnergy(src), f0 = frame;
        for (let f = 0; f < ${frames}; f++) { if (unit) { unit.x = ps[2].x; unit.y = ps[2].y + 1; unit.spawnProtection = 0; } render(); }
        return { tier: networkStrength[${JSON.stringify(el)}], awake: ps.map(t => t.waveAwake), woke: ps[2]._wakeFrame >= f0,
                 spent: before - nestEnergy(src), regen: NEST_ENERGY_REGEN * ${frames}, hp: unit ? unit.health : null,
                 ratio: unit && unit.baseMoveSpeed ? unit.moveSpeed / unit.baseMoveSpeed : null };
    })()`);

    group('LABELS');

    await check('electric and core are SUPPORT; fire, ice, flux and toxic are DISRUPTION', () => {
        const r = run(`ELEMENTS.map(e => e.id + ':' + waveRole(e.id)).join(',')`);
        ok(r === 'fire:disruption,electric:support,ice:disruption,flux:disruption,core:support,toxic:disruption', r);
    });
    await check('THE ASK: a wave pylon is labelled by its role over its head, and in INFO', () => {
        const G = rd('js/game.js');
        ok(/const _title = obj\.waveMode && !isRelayPylon\(obj\) \? waveRoleLabel\(el0\)/.test(G), 'the label over the pylon is not the role');
        ok(/waveRoleLabel\(targetTile\.attackModeElement\)/.test(rd('js/ui.js')), 'INFO does not name the role');
    });

    group('STANDBY UNTIL SOMEONE IS NEAR');

    await check('with nobody near, a support pylon rests: asleep and drawing no power', () => {
        const r = scene('electric', null, 240);
        ok(r.tier === 3, 'fixture: tier ' + r.tier);
        ok(r.awake.every(a => a === false), 'awake with nobody near: ' + r.awake);
        ok(r.spent <= 0, 'a resting pylon spent ' + r.spent);
    });
    await check('THE ASK: a follower near an electric support pylon wakes it, it blinks, and the tier III haste lands', () => {
        const r = scene('electric', 'ally', 60);
        ok(r.awake[2] === true && r.woke, 'it did not wake: ' + JSON.stringify(r));
        ok(Math.abs(r.ratio - run('ELECTRIC_HASTE[3]')) < 1e-9, 'haste ' + r.ratio);
        ok(r.spent > 0, 'an awake pylon should be drawing power');
        ok(r.awake[5] === false, 'a pylon nobody is near should stay asleep: ' + r.awake);
    });
    await check('an ENEMY does not wake a support pylon', () => {
        const r = scene('electric', 'enemy', 60);
        ok(r.awake[2] === false, JSON.stringify(r.awake));
    });
    await check('a disruption pylon wakes for an enemy and hurts it', () => {
        const r = scene('fire', 'enemy', 120);
        ok(r.awake[2] === true && r.woke, JSON.stringify(r.awake));
        ok(r.hp < 1e6, 'the fire did not land');
    });
    await check('but not for one of yours', () => {
        const r = scene('fire', 'ally', 60);
        ok(r.awake[2] === false, JSON.stringify(r.awake));
    });
    await check('it goes back to sleep WAVE_WAKE_LINGER frames after the last one leaves', () => {
        ok(scene('electric', 'ally', 30).awake[2] === true, 'fixture: it should be awake first');
        const r = run(`(function(){
            const t = __ps[2]; followers.forEach(f => { f.x = 0; f.y = 0; }); actors.forEach(a => { a.x = 0; a.y = 0; });
            const awake = [];
            for (let f = 0; f < WAVE_WAKE_LINGER + 10; f++) { render(); awake.push(t.waveAwake); }
            return { early: awake[5], late: awake[awake.length - 1] };
        })()`);
        ok(r.early === true && r.late === false, JSON.stringify(r));
    });
    await check('the blink is drawn on waking, and the standby look has no scan line', () => {
        const G = rd('js/game.js'), D = rd('js/draw.js');
        ok(/_sinceWake < WAVE_WAKE_BLINK\) drawWaveWakeBlink/.test(G), 'no wake blink');
        ok(/if \(!dark && !asleep\) \{/.test(D), 'the scan line still runs on standby');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
