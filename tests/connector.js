// THE CONNECTOR PYLON — a long-reach relay with a circuit switch.
//
// THE ASK: "make a new pylon called a connector pylon, with a really long
// radius of connection strength, used to carry power from the nests to power
// the zones in the later half — and you can turn on or off the circuitry on
// these pylons to turn on an entire group of pylons at the same time."
//
// Held here: it reaches CONNECTOR_RANGE (far past a generator), it lights the
// whole group at once, opening the circuit darkens the whole group at once, it
// draws from the nest it is linked to, it spends nothing itself, it is a
// neutral type in the picker, it survives a refresh, and the radial offers the
// switch (draw + tap paths).
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
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }
function ok(c, m) { if (!c) throw new Error(m); }

async function boot() {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) {
        try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {}
    }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true;');
    return { run };
}

(async () => {
    const E = await boot();
    const RANGE = E.run('CONNECTOR_RANGE');

    // Row y=3 from x=4. `plan`: C connector, A attack pylon, G generator, . gap.
    const board = (plan, opts, frames) => E.run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => {
            t.pillar = false; t.destroyed = false; t.attackMode = false; t.waveMode = false;
            t.isGenerator = false; t.isConnector = false; t.circuitOn = undefined;
            t.connectedPylon = null; t.nestConnection = null;
            t.powered = undefined; t.powerSource = null; t.powerGen = null; t.pillarTeam = 'green';
            if (t.nest) { t.nestHealth = t.nestMaxHealth || 200; t.nestEnergy = undefined; }
        });
        const row = world.filter(t => t.type === 'floor' && t.y === 3 && t.x >= 4 && !t.nest && !t.nodeType)
                         .sort((a,b) => a.x - b.x);
        const made = [];
        ${JSON.stringify(plan)}.split('').forEach((c, i) => {
            const t = row[i];
            if (!t || c === '.') { made.push(null); return; }
            Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'green', health: 20, maxHealth: 20,
                pillarCol: '#0f8', attackModeElement: 'fire', attackModeColor: '#f50', attackPower: 12, attackRange: 2.5 });
            if (c === 'C') { t.isConnector = true; t.attackMode = true; t.attackModeElement = CONNECTOR_ID; t.circuitOn = true; }
            if (c === 'G') { t.isGenerator = true; t.attackMode = true; }
            if (c === 'A') t.attackMode = true;
            made.push(t);
        });
        const o = ${JSON.stringify(opts || {})};
        if (o.open !== undefined && made[o.open]) made[o.open].circuitOn = false;
        if (o.link !== undefined) {
            const nest = world.find(t => t.nest && t.nestZone === o.zone);
            nest.nestHealth = 0;
            if (o.energy !== undefined) nest.nestEnergy = o.energy;
            made[o.link].nestConnection = nest; nest.connectedPylon = made[o.link];
        }
        _cacheAge = -999;
        for (let i = 0; i < ${frames || 1}; i++) render();
        return { lit: made.map(t => t ? !!t.powered : null), x: made.map(t => t ? t.x : null),
                 feeder: made.map(t => t && t.powerGen ? (t.powerGen.isConnector ? 'conn' : 'gen') : null),
                 srcIsHome: !!made.find(t => t && t.powerSource && isHomePortal(t.powerSource)),
                 made: made.length, n: made.filter(Boolean).length,
                 conCount: _conPylons.length, firing: _aPylons.length };
    })()`);

    group('REACH: far past a generator');

    await check('a connector lights pylons well beyond a generator\'s reach', () => {
        const gen = E.run('getPylonRange()');
        ok(RANGE > gen * 3, `the connector range (${RANGE}) is not much longer than a link (${gen})`);
        const r = board('C' + '.'.repeat(9) + 'A');       // 10 tiles away
        same(r.lit[10], true, 'a pylon 10 tiles from a connector was dark');
        same(r.feeder[10], 'conn', 'it is not drawn off the connector');
    });

    await check('a pylon past the connector range is dark', () => {
        const r = board('C' + '.'.repeat(RANGE + 1) + 'A');
        same(r.lit[r.lit.length - 1], false, 'a pylon beyond range was fed anyway');
    });

    await check('one connector lights the whole group at once', () => {
        const r = board('CA.AA..A....A');
        ok(r.lit.filter((v, i) => v !== null && i > 0).every(v => v), 'part of the group stayed dark: ' + r.lit);
    });

    group('THE CIRCUIT: on or off for the whole group');

    await check('opening the circuit darkens every pylon hanging off it together', () => {
        const r = board('CA.AA..A....A', { open: 0 });
        ok(r.lit.every((v, i) => i === 0 || v === false || v === null), 'something stayed lit with the circuit open: ' + r.lit);
    });

    await check('toggleConnectorCircuit flips it and the grid follows immediately', () => {
        board('CA.AA..A....A');
        const r2 = E.run(`(function(){
            const c = world.find(t => t.isConnector);
            toggleConnectorCircuit(c);
            const open = c.circuitOn, lit1 = world.filter(t => t.pillar && t.attackMode && !t.isConnector).some(t => t.powered);
            toggleConnectorCircuit(c);
            const lit2 = world.filter(t => t.pillar && t.attackMode && !t.isConnector).every(t => t.powered);
            return { open, lit1, shut: c.circuitOn, lit2 };
        })()`);
        same(r2.open, false, 'first toggle did not open');
        same(r2.lit1, false, 'pylons stayed lit after opening');
        same(r2.shut, true, 'second toggle did not close');
        same(r2.lit2, true, 'pylons did not relight after closing');
    });

    group('THE CHAIN: it draws from the nest it is linked to');

    await check('a linked connector draws on THAT nest, and a shot costs it', () => {
        board('C' + '.'.repeat(5) + 'A', { link: 0, zone: 1, energy: 100 }, 2);
        const e = E.run(`(function(){
            const n = world.find(t => t.nest && t.nestZone === 1);
            const p = world.find(t => t.pillar && t.attackMode && !t.isConnector);
            const before = n.nestEnergy, paid = payForShot(p);
            return { paid, spent: before - n.nestEnergy, src: p.powerSource === n, cost: POWER_SHOT_COST };
        })()`);
        same(e.src, true, 'the pylon is not drawing on the linked nest');
        same(e.paid, true, 'the shot was refused');
        same(e.spent, e.cost, 'the shot did not cost the nest');
    });

    await check('a connector spends nothing itself', () => {
        const src = rd('js/power.js');
        ok(/isRelayPylon\(t\)\) return false/.test(src.slice(src.indexOf('function needsPower'))),
           'needsPower no longer exempts relays');
    });

    await check('a generator beside the pylon still comes first', () => {
        const r = board('GA' + '.'.repeat(4) + 'C' + '.'.repeat(3) + 'A');
        same(r.feeder[1], 'gen', 'a pylon next to a generator did not use it');
    });

    group('PLACEMENT, PICKER, SAVE');

    await check('it is a neutral type in the picker, needs no unlock, shares the placement rule', () => {
        const r = E.run(`({ listed: PYLON_PICKER_TYPES.some(e => e.id === CONNECTOR_ID),
                            free: isPylonTypeUnlocked(CONNECTOR_ID), relay: isRelayId(CONNECTOR_ID) })`);
        ok(r.listed && r.free && r.relay, JSON.stringify(r));
        const cmd = rd('js/commands.js');
        same([...cmd.matchAll(/isRelayId\(el\.id\) && !canPlaceGenerator/g)].length, 3, 'a creation path is ungated');
    });

    await check('the circuit state and flag are saved and restored', () => {
        ok(/isConnector: !!t\.isConnector/.test(rd('js/save.js')), 'not saved');
        ok(/circuitOn: t\.circuitOn !== false/.test(rd('js/save.js')), 'switch state not saved');
        ok(/tile\.isConnector\s*=\s*!!saved\.isConnector/.test(rd('js/init.js')), 'not restored');
        ok(/tile\.circuitOn\s*=\s*saved\.circuitOn !== false/.test(rd('js/init.js')), 'switch state not restored');
    });

    await check('losing the pylon to the enemy clears the flag', () => {
        ok(/t\.isConnector = false/.test(rd('js/infest.js')), 'a converted connector would stay a connector');
    });

    group('THE RING: the switch is offered, by drag and by tap');

    await check('the radial says OPEN/CLOSE CIRCUIT and both paths select toggle_circuit', () => {
        ok(/OPEN CIRCUIT/.test(rd('js/draw.js')) && /CLOSE CIRCUIT/.test(rd('js/draw.js')), 'label missing');
        ok(/"toggle_circuit"/.test(rd('js/draw.js')), 'the draw path never selects it');
        ok(/"toggle_circuit"/.test(rd('js/input.js')), 'the tap path never selects it');
        ok(/case "toggle_circuit"/.test(rd('js/commands.js')), 'the command is not handled');
    });

    await check('the GAME INDEX teaches it, with the real numbers', () => {
        const html = rd('game.html');
        const at = html.indexOf('CONNECTOR PYLON');
        ok(at > -1, 'no index entry');
        const page = html.slice(at, at + 2400);
        ok(page.indexOf('>' + RANGE + '<') > -1, 'the index does not state the ' + RANGE + '-tile reach');
        ok(/OPEN CIRCUIT/.test(page) && /CLOSE CIRCUIT/.test(page), 'it does not say how to switch it');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
