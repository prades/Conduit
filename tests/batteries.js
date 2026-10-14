// BATTERIES, MK II AND ONE CABLE — "The ultra pylons still have cables going to
// all 4 sides, make the ground look cleaner by removing 3 cables, make a tier of
// pylon upgrades for tier 1 network, make them slightly better than regular
// upgraded pylons. Make the pylons do damage equal to their status. Batteries
// should be charged up from the nests and allow the player to use more power
// than would otherwise be possible. That's what charges the pylons. Hardcode
// that system, make it clearly visible on screen."
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

    // A clean slate by home. o.gen: a shield generator beside home for the
    // nest link. o.bats: batteries of o.el along row 4 from (X, 4), o.charge
    // each. o.turrets: turret offsets from (X, 1). Returns nothing; the tiles
    // are reachable as __T(__X + dx, y).
    const build = o => run(`(function(){
        const o = ${JSON.stringify(o || {})};
        actors.length = 0; followers.length = 0; turretShots.length = 0; floatingTexts.length = 0;
        world.forEach(t => { if (t.pillar) { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.isConnector = false; t.isBattery = false;
                                              t.attackModeElement = null; t._ultra = null; t._ultraOf = null; t._wform = null; t._wformOf = null; t.charge = 0; t.mk = 0; t.upgraded = false; t._supply = null; }
                             if (t.nest) { t.powerOff = false; t.nestEnergy = undefined; } });
        shardCount = 9999; if (typeof _formState !== "undefined") _formState = new Map();
        const home = world.find(t => isHomePortal(t)), X = home.x + 4;
        const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y && !t.nest && !t.nodeType);
        const el = o.el || 'fire', E = ELEMENTS.find(e => e.id === el);
        if (o.gen !== false) _executeBuildInstant(PYLON_PICKER_TYPES.find(e => e.id === GENERATOR_ID), T(home.x + 2, 3));
        for (let i = 0; i < (o.bats || 0); i++) { const b = T(X + i, 4); _executeBuildInstant(E, b, 'battery'); b.charge = o.charge || 0; }
        for (const [dx, dy] of (o.turrets || [])) _executeBuildInstant(E, T(X + dx, 1 + dy), 'attack');
        player.x = player.targetX = player.visualX = X; player.y = player.targetY = player.visualY = 2;
        _cacheAge = -999; render();
        globalThis.__X = X; globalThis.__T = T; globalThis.__home = home;
        return true;
    })()`);

    group('NEST → BATTERY');

    await check('THE ASK: a battery wired to a nest charges from it', () => {
        build({ bats: 1 });
        const r = run(`(function(){ const b = __T(__X, 4), n = b.powerSource; if (!n) return { route: false };
            n.nestEnergy = nestEnergyMax(n); const n0 = nestEnergy(n), c0 = b.charge;
            for (let i = 0; i < 100; i++) batteryChargeTick();
            return { route: true, stored: b.charge - c0, spent: n0 - nestEnergy(n) }; })()`);
        ok(r.route, 'the battery has no route to a nest');
        ok(r.stored > 9.9, 'it did not charge: ' + JSON.stringify(r));
    });
    await check('THE ASK: it stores more than it takes — more power than the nests alone', () => {
        const r = run(`(function(){ const b = __T(__X, 4), n = b.powerSource; b.charge = 0;
            n.nestEnergy = nestEnergyMax(n); const n0 = nestEnergy(n);
            for (let i = 0; i < 100; i++) batteryChargeTick();
            return { stored: b.charge, spent: n0 - nestEnergy(n), gain: BATTERY_CHARGE_GAIN }; })()`);
        ok(r.gain > 1, 'no gain: ' + r.gain);
        ok(Math.abs(r.stored - r.spent * r.gain) < 1e-6, 'stored is not gain × spent: ' + JSON.stringify(r));
    });
    await check('it never takes a nest below its floor', () => {
        const r = run(`(function(){ const b = __T(__X, 4), n = b.powerSource; b.charge = 0;
            n.nestEnergy = nestEnergyMax(n) * (BATTERY_NEST_FLOOR - 0.01);
            for (let i = 0; i < 100; i++) batteryChargeTick();
            return b.charge; })()`);
        ok(r === 0, 'charged from a nest under its floor: ' + r);
    });
    await check('it stops when full', () => {
        const r = run(`(function(){ const b = __T(__X, 4), n = b.powerSource; b.charge = BATTERY_CAPACITY;
            n.nestEnergy = nestEnergyMax(n); const n0 = nestEnergy(n);
            for (let i = 0; i < 100; i++) batteryChargeTick();
            return { c: b.charge, spent: n0 - nestEnergy(n) }; })()`);
        ok(r.c === run('BATTERY_CAPACITY') && r.spent === 0, JSON.stringify(r));
    });
    await check('a battery with nothing wired to it does not charge', () => {
        build({ bats: 1, gen: false });
        const r = run(`(function(){ const b = __T(__X, 4); for (let i = 0; i < 100; i++) batteryChargeTick(); return { c: b.charge, src: !!b.powerSource }; })()`);
        ok(r.c === 0 && !r.src, JSON.stringify(r));
    });

    group('BATTERY → PYLON');

    await check('THE ASK: a turret by a charged battery pays from the battery, not the nest', () => {
        build({ bats: 2, charge: 50, turrets: [[0, 0]] });
        const r = run(`(function(){ const t = __T(__X, 1), n = t.powerSource || __home; const n0 = nestEnergy(n);
            const c0 = __T(__X, 4).charge + __T(__X + 1, 4).charge; const paid = payForShot(t);
            return { paid, drop: c0 - (__T(__X, 4).charge + __T(__X + 1, 4).charge), nest: n0 - nestEnergy(n), supply: !!t._supply && t._supply.isBattery }; })()`);
        ok(r.paid && r.supply, JSON.stringify(r));
        ok(Math.abs(r.drop - run('POWER_SHOT_COST')) < 1e-9 && r.nest === 0, JSON.stringify(r));
    });
    await check('the fullest battery in reach pays, so a bank drains evenly', () => {
        const r = run(`(function(){ const a = __T(__X, 4), b = __T(__X + 1, 4); a.charge = 10; b.charge = 40;
            payForShot(__T(__X, 1)); return [a.charge, b.charge]; })()`);
        ok(r[0] === 10 && r[1] === 40 - run('POWER_SHOT_COST'), JSON.stringify(r));
    });
    await check('THE ASK (one generator per zone): a charged battery does nothing in a zone with no generator', () => {
        build({ bats: 2, charge: 60, turrets: [[0, 0]], gen: false });
        const r = run(`(function(){ const t = __T(__X, 1); recomputePower(); return { powered: t.powered, dark: !!t.zoneDark, paid: payForShot(t) }; })()`);
        ok(!r.powered && r.dark && !r.paid, JSON.stringify(r));
    });
    await check('a charged battery powers a turret no nest route reaches — in a zone that has a generator', () => {
        // The zone's generator is stood in for: this is about the battery
        // paying, not the zone rule (tests/shieldcells.js).
        const r = run(`(function(){ const t = __T(__X, 1); const keep = zoneGenerated; zoneGenerated = () => true;
            try { recomputePower(); return { powered: t.powered, src: !!t.powerSource, paid: payForShot(t) }; } finally { zoneGenerated = keep; } })()`);
        ok(!r.src, 'fixture: it has a nest route');
        ok(r.powered && r.paid, JSON.stringify(r));
    });
    await check('flat batteries and no nest: dark', () => {
        const r = run(`(function(){ __T(__X, 4).charge = 0; __T(__X + 1, 4).charge = 0; const t = __T(__X, 1); const keep = zoneGenerated; zoneGenerated = () => true;
            try { recomputePower(); return { powered: t.powered, paid: payForShot(t) }; } finally { zoneGenerated = keep; } })()`);
        ok(!r.powered && !r.paid, JSON.stringify(r));
    });
    await check('flat batteries fall back to the nest', () => {
        build({ bats: 1, charge: 0, turrets: [[0, 0]] });
        const r = run(`(function(){ const t = __T(__X, 1); const n = t.powerSource; n.nestEnergy = nestEnergyMax(n); const n0 = nestEnergy(n);
            const paid = payForShot(t); return { paid, nest: n0 - nestEnergy(n) }; })()`);
        ok(r.paid && r.nest > 0, JSON.stringify(r));
    });
    await check('wave pylons draw on the batteries too', () => {
        const r = run(`(function(){ const t = __T(__X, 1); t.attackMode = false; t.waveMode = true; t._awakeUntil = Infinity; t.waveAwake = true;
            __T(__X, 4).charge = 80; recomputePower(); const c0 = __T(__X, 4).charge; const n = t.powerSource, n0 = nestEnergy(n);
            for (let i = 0; i < 10; i++) waveDrainTick();
            return { drop: c0 - __T(__X, 4).charge, nest: n0 - nestEnergy(n) }; })()`);
        ok(r.drop > 0 && r.nest === 0, JSON.stringify(r));
    });

    group('ON SCREEN');

    await check('THE ASK: the HUD shows what the batteries hold and which way it flows', () => {
        build({ bats: 2, charge: 30, turrets: [[0, 0]] });
        const st = run('JSON.stringify(powerStatus().batteries)');
        const b = JSON.parse(st);
        ok(b.count === 2 && b.stored === 60 && b.cap === 2 * run('BATTERY_CAPACITY'), st);
        const G = rd('js/game.js');
        ok(/"\\u26a1 BATT " \+ bs\.stored \+ " \/ " \+ bs\.cap/.test(G), 'no battery row in the HUD');
        ok(/bs\.rateIn - bs\.rateOut/.test(G), 'the HUD does not show the flow');
    });
    await check('THE ASK: a battery\'s cells show its charge, and a gauge over it', () => {
        const D = rd('js/draw.js');
        ok(/function drawBatteryPylon\(px, base, colour, tier, pulse, dark, fill, charging\)/.test(D), 'the sprite does not take the charge');
        ok(/Math\.ceil\(Math\.max\(0, Math\.min\(1, fill\)\) \* 4/.test(D), 'cells do not follow the charge');
        ok(/batteryCharge\(obj\) \/ BATTERY_CAPACITY, batteryCharging\(obj\)/.test(rd('js/game.js')), 'the battery is not drawn with its charge');
    });
    await check('charging runs a lit cable into the battery; a battery-fed pylon\'s cable runs from the battery in gold', () => {
        build({ bats: 1, charge: 50, turrets: [[0, 0]] });
        const r = run(`(function(){ const b = __T(__X, 4); b.charge = 50; const n = b.powerSource; n.nestEnergy = nestEnergyMax(n);
            batteryChargeTick(); recomputePower(); layAllCables();
            const gold = [], blueIn = [];
            for (const [k, c] of _cableTiles) for (const p of c.pieces) { if (p.style.core === BATTERY_COLOR) gold.push(k); if (p.style.core === POWER_WIRE_COLOUR && p.end) blueIn.push(k); }
            return { charging: batteryCharging(b), gold: gold.includes(__X + ',1') && gold.includes(__X + ',4'), blue: blueIn.includes(__X + ',4') }; })()`);
        ok(r.charging, 'fixture: not charging');
        ok(r.gold, 'no gold cable from the battery to the turret');
        ok(r.blue, 'no live cable into the charging battery');
    });

    group('ONE CABLE PER ULTRA');

    await check('THE ASK: an Ultra turret takes one cable, at its anchor — not one to each of its four', () => {
        // Tier II for the Ultra: four fire batteries in reach, kept flat so
        // the feed comes from the generator.
        build({ bats: 4, charge: 0, turrets: [[0, 0], [1, 0], [0, 1], [1, 1]] });
        const r = run(`(function(){ _cacheAge = -999; render(); const A = __T(__X, 1);
            if (!A._ultra) return { ultra: false };
            for (const b of world) if (b.isBattery) b.charge = 0;
            for (const p of A._ultra.tiles) p.powerFlow = 1;
            layAllCables();
            const ends = {};
            for (const p of A._ultra.tiles) { const c = _cableTiles.get(p.x + ',' + p.y); ends[p.x + ',' + p.y] = c ? c.pieces.filter(q => q.end).length : 0; }
            return { ultra: true, anchor: ends[A.x + ',' + A.y], parts: A._ultra.tiles.filter(p => p !== A).map(p => ends[p.x + ',' + p.y]) }; })()`);
        ok(r.ultra, 'fixture: no Ultra');
        ok(r.anchor >= 1, 'no cable at the anchor: ' + JSON.stringify(r));
        ok(r.parts.every(n => n === 0), 'cables end at the other three: ' + JSON.stringify(r));
    });

    group('MK II');

    await check('THE ASK: MK II needs its element\'s tier I network', () => {
        build({ bats: 0, turrets: [[0, 0]] });
        const r = run(`(function(){ const t = __T(__X, 1); const s0 = shardCount; return { why: mk2Blocker(t), bought: upgradeToMk2(t), mk: t.mk || 0, spent: s0 - shardCount }; })()`);
        ok(/TIER I/.test(r.why) && !r.bought && r.mk === 0 && r.spent === 0, JSON.stringify(r));
    });
    await check('on tier I it costs MK2_COST shards and makes it MK II, tougher, with the upgraded pulse', () => {
        build({ bats: 2, turrets: [[0, 0]] });
        const r = run(`(function(){ const t = __T(__X, 1); const hp0 = t.maxHealth, s0 = shardCount;
            const bought = upgradeToMk2(t);
            return { bought, mk: t.mk, up: t.upgraded, hp: t.maxHealth / hp0, spent: s0 - shardCount, cost: MK2_COST, again: mk2Blocker(t) }; })()`);
        ok(r.bought && r.mk === 2 && r.up && r.spent === r.cost, JSON.stringify(r));
        ok(Math.abs(r.hp - run('MK2_HP_MULT')) < 0.02, 'health did not rise: ' + r.hp);
        ok(r.again === 'ALREADY MK II', r.again);
    });
    await check('THE ASK: damage follows status — plain < upgraded < MK II', () => {
        const r = run(`(function(){ const t = __T(__X, 1), foe = { maxHealth: 100 };
            t.mk = 0; t.upgraded = false; const plain = turretRoundDamage(t, foe);
            t.upgraded = true; const up = turretRoundDamage(t, foe);
            t.mk = 2; const mk = turretRoundDamage(t, foe);
            return { up: up / plain, mk: mk / plain }; })()`);
        ok(Math.abs(r.up - run('STATUS_MULT_UPGRADED')) < 1e-9, 'upgraded ×' + r.up);
        ok(Math.abs(r.mk - run('STATUS_MULT_MK2')) < 1e-9, 'MK II ×' + r.mk);
        ok(r.mk > r.up && r.up > 1, JSON.stringify(r));
    });
    await check('status reaches wave links and formations as well', () => {
        ok(/const _seasonBonus = \(_seasonBonusCache\[el\] \|\| 1\.0\) \* _status\b/.test(rd('js/game.js')), 'wave links ignore status');
        ok(/st = Math\.max\(st, pylonStatusMult\(p\)\)/.test(rd('js/formations.js')), 'formations ignore status');
    });
    await check('the ring offers it out of build mode on your turret, and the label says MK II', () => {
        ok(/selectedRadialAction = "mk2"/.test(rd('js/draw.js')) && /selectedRadialAction = "mk2"/.test(rd('js/input.js')), 'no MK II button');
        ok(/case "mk2":/.test(rd('js/commands.js')), 'the button does nothing');
        ok(/pylonStatusLabel\(obj\)/.test(rd('js/game.js')), 'no status on the label');
    });
    await check('charge and MK II survive a save', () => {
        build({ bats: 1, charge: 77, turrets: [[0, 0]] });
        const r = run(`(function(){ __T(__X, 1).mk = 2; savePylons(); const d = JSON.parse(localStorage.getItem('tubecrawler_pylons'));
            const b = d.find(p => p.x === __X && p.y === 4), t = d.find(p => p.x === __X && p.y === 1); return { c: b && b.charge, mk: t && t.mk }; })()`);
        ok(r.c === 77 && r.mk === 2, JSON.stringify(r));
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
