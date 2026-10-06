// OVERCHARGE — docs/ROADMAP-top5.md §2.
//
// Hold a nest you control → OVERCHARGE: the grid gives up 40% of what it holds
// and every pylon on it surges for 8 s — turrets fire 3× as often on rounds
// they do not pay for, wave pylons count a tier higher, stay awake and draw
// nothing. Needs the grid half full; 60 s to recharge.
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
    run('gameState.running = true; if (typeof tutorialMode !== "undefined") tutorialMode = false; unlockedElements = new Set(ELEMENTS.map(e => e.id));');

    // Home generator, a fire turret and an electric support pylon on the home
    // reserve, the home pool at `fill`. Returns handles on globalThis.
    const base = (fill) => run(`(function(){
        actors.length = 0; followers.length = 0; floatingTexts.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false;
            t.isConnector = false; t.attackModeElement = null; t.waveTripped = false; t.circuitOn = undefined; t.nestConnection = null;
            t.waveAwake = undefined; t._awakeUntil = undefined; }
            if (t.nest) { t.powerOff = false; t.nestEnergy = undefined; t._ocUntil = undefined; t._ocReadyAt = undefined; } });
        shardCount = 9999;
        const home = world.find(t => isHomePortal(t));
        const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
        _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), T(home.x + 1, 2));
        const tur = T(home.x + 3, 2); _executeBuildInstant(ELEMENTS.find(e => e.id === 'fire'), tur, 'attack');
        const sup = T(home.x + 3, 0); _executeBuildInstant(ELEMENTS.find(e => e.id === 'electric'), sup, 'support');
        player.x = home.x - 12; player.y = 2;
        _cacheAge = -999; render();
        home.nestEnergy = nestEnergyMax(home) * ${fill};
        globalThis.__home = home; globalThis.__tur = tur; globalThis.__sup = sup;
        return { src: tur.powerSource === home && sup.powerSource === home };
    })()`);
    // Shots a turret fires in `n` frames with a foe held in range.
    const shots = (n) => run(`(function(){
        const S = SPECIES.ant; actors = actors.filter(a => !(a instanceof Predator));
        const q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), __tur.x + 1, __tur.y);
        q.team = 'red'; q.health = q.maxHealth = 1e9; actors.push(q);
        let s = 0; for (let i = 0; i < ${n}; i++) { q.x = __tur.x + 1; q.y = __tur.y; q.spawnProtection = 0; const l = __tur._lastShotFrame; render(); if (__tur._lastShotFrame !== l) s++; }
        q.dead = true; return s; })()`);

    group('THE VERB');

    await check('THE ASK: the top of the ring on a held nest offers OVERCHARGE (build mode off)', () => {
        base(0.9);
        const r = run(`(function(){ buildMode = false; commandMode = true; commandTarget = null; commandNestTarget = __home;
            commandX = 300; commandY = 300; dragDX = 0; dragDY = -RADIAL_RADIUS; selectedRadialAction = null;
            drawRadialMenu(); const a = selectedRadialAction; commandMode = false;
            buildMode = true; commandMode = true; selectedRadialAction = null; drawRadialMenu(); const b = selectedRadialAction; buildMode = false; commandMode = false;
            return { a, b }; })()`);
        ok(r.a === 'overcharge', 'top of the ring on a nest: ' + r.a);
        ok(r.b !== 'overcharge', 'build mode should keep BUILD on top');
        ok(/selectedRadialAction = "overcharge"/.test(rd('js/input.js')), 'the release-tap hit test does not mirror it');
    });
    await check('it spends exactly OVERCHARGE_COST of what the grid holds', () => {
        base(0.9);
        const r = run(`(function(){ const before = nestEnergy(__home); const ok = overchargeNest(__home);
            return { ok, before, after: nestEnergy(__home), cost: OVERCHARGE_COST }; })()`);
        ok(r.ok, 'it refused');
        ok(Math.abs(r.after - r.before * (1 - r.cost)) < 1e-6, JSON.stringify(r));
    });
    await check('it refuses under OVERCHARGE_MIN_FILL, with the reason', () => {
        base(0.3);
        const r = run(`(function(){ const before = nestEnergy(__home); const ok = overchargeNest(__home);
            return { ok, spent: before - nestEnergy(__home), said: floatingTexts.map(t => t.text) }; })()`);
        ok(!r.ok && r.spent === 0, JSON.stringify(r));
        ok(r.said.some(t => /NEEDS 50% STORED/.test(t)), 'no reason given: ' + JSON.stringify(r.said));
    });
    await check('it refuses a nest that is switched OFF', () => {
        base(0.9);
        ok(run(`(__home.powerOff = true, overchargeBlocker(__home))`) === 'NEST IS OFF', 'an OFF nest overcharged');
        run('__home.powerOff = false');
    });
    await check('and while it recharges — 60 s from the moment it fired', () => {
        base(0.95);
        const r = run(`(function(){ overchargeNest(__home); __home.nestEnergy = nestEnergyMax(__home);
            for (let i = 0; i < OVERCHARGE_FRAMES + 10; i++) render();
            const mid = overchargeBlocker(__home);
            for (let i = 0; i < OVERCHARGE_COOLDOWN; i++) frame++;
            __home.nestEnergy = nestEnergyMax(__home);
            return { mid, after: overchargeBlocker(__home) }; })()`);
        ok(/^RECHARGING/.test(r.mid || ''), 'it could fire again straight away: ' + r.mid);
        ok(r.after === null, 'it never recharged: ' + r.after);
    });

    await check('a ring opened under the top HUD is drawn on screen, and releasing in place picks nothing', () => {
        const r = run(`(function(){ buildMode = false; commandPendingTap = false; handleLongHold(canvas.width / 2, 20);
            // the same arithmetic pointermove and the release use, finger still at the press point
            const dx = canvas.width / 2 - (commandX - commandShiftX), dy = 20 - (commandY - commandShiftY);
            dragDX = dx; dragDY = dy; selectedRadialAction = null; drawRadialMenu();
            const out = { cy: commandY, drag: Math.hypot(dx, dy), picked: selectedRadialAction };
            commandMode = false; return out; })()`);
        ok(r.cy >= run('RADIAL_RADIUS') + 100, 'the ring is still under the HUD at y=' + r.cy);
        ok(r.drag === 0 && !r.picked, 'releasing in place would pick ' + r.picked);
    });

    group('THE SURGE');

    await check('THE ASK: a surged turret fires OVERCHARGE_FIRE_MULT× as often, and goes back after', () => {
        base(0.9);
        const normal = shots(270);
        run('overchargeNest(__home)');
        const surged = shots(270);
        for (let i = 0; i < 300; i++) run('render()');
        const after = shots(270);
        ok(surged >= normal * 2.5, `surged ${surged} vs normal ${normal}`);
        ok(after <= normal + 1, `still surging after it ended: ${after} vs ${normal}`);
    });
    await check('surged rounds cost the pool nothing', () => {
        base(0.9);
        run('overchargeNest(__home)');
        const r = run(`(function(){ const e0 = nestEnergy(__home); let n = 0; const S = SPECIES.ant;
            const q = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), __tur.x + 1, __tur.y); q.team = 'red'; q.health = q.maxHealth = 1e9; actors.push(q);
            for (let i = 0; i < 120; i++) { q.x = __tur.x + 1; q.y = __tur.y; const l = __tur._lastShotFrame; render(); if (__tur._lastShotFrame !== l) n++; }
            q.dead = true; return { n, spent: e0 - nestEnergy(__home) }; })()`);
        ok(r.n > 3 && r.spent <= 0.01, JSON.stringify(r));
    });
    await check('a surged support pylon is awake with nobody near, and draws nothing', () => {
        base(0.9);
        const r = run(`(function(){ for (let i = 0; i < 12; i++) render(); const before = __sup.waveAwake;
            overchargeNest(__home); const e0 = nestEnergy(__home);
            for (let i = 0; i < 60; i++) render();
            return { before, during: __sup.waveAwake, spent: e0 - nestEnergy(__home) }; })()`);
        ok(r.before === false && r.during === true, JSON.stringify(r));
        ok(r.spent <= 0.01, 'a surged wave pylon still drew ' + r.spent);
    });
    await check('it raises the haste tier by one', () => {
        base(0.9);
        const r = run(`(function(){ spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false;
            const hold = () => { f.x = __sup.x; f.y = __sup.y + 1; };
            for (let i = 0; i < 12; i++) { hold(); render(); }
            const t0 = networkStrength.electric, h0 = f.slowFactor;
            overchargeNest(__home); for (let i = 0; i < 12; i++) { hold(); render(); }
            return { t0, h0, h1: f.slowFactor, want: ELECTRIC_HASTE[Math.min(3, Math.max(1, t0) + (t0 >= 1 ? 1 : 0))] }; })()`);
        // A lone electric pylon is tier 0 — no haste — and a surge lifts it to tier I.
        ok(r.h1 > (r.h0 || 1), JSON.stringify(r));
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
