// NEST GRIDS AND THE NEST SWITCH.
//
// THE ASK: "connect the power from one nest to the network of another nest,
// and make it so you can turn on and off the power from a conquered nest, so
// you're not drawing all the power before the predators approach."
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
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${b}, got ${a}`); }

(async () => {
    const ctx = vm.createContext(makeBrowserSandbox({ tubecrawler_seed: '305419896' }));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), ctx, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = e => vm.runInContext(e, ctx);
    ok(run('world.length') > 100, 'fixture: the world did not generate');
    run('gameState.running = true; ensureWorldTo(4 * ZONE_LENGTH);');

    // Zone-1 and zone-2 nests taken; connector C1 beside nest 1 (offset c1dx),
    // connector C2 beside nest 2; a turret T fed by C2. Energies set per nest.
    const scene = (o) => run(`(function(){
        const o = ${JSON.stringify(o || {})};
        actors.length = 0;
        world.forEach(t => { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false; t.isConnector = false;
            t.circuitOn = undefined; t.connectedPylon = null; t.nestConnection = null; t.waveTripped = false; t.powered = undefined;
            if (t.nest) { t.powerOff = false; t.nestEnergy = undefined; } });
        const n1 = world.find(t => t.nest && t.nestZone === 1), n2 = world.find(t => t.nest && t.nestZone === 2);
        n1.nestHealth = 0; n2.nestHealth = 0;
        const T = (x, y) => world.find(t => t.type === 'floor' && t.x === x && t.y === y);
        const base = { pillar: true, destroyed: false, pillarTeam: 'green', health: 9999, maxHealth: 9999 };
        const c1 = T(n1.x + (o.c1dx ?? 2), 1), c2 = T(n2.x - 2, 1), tu = T(n2.x, 3);
        Object.assign(c1, base, { isConnector: true, attackMode: true, attackModeElement: 'connector', circuitOn: !o.c1off });
        Object.assign(c2, base, { isConnector: true, attackMode: true, attackModeElement: 'connector', circuitOn: true });
        Object.assign(tu, base, { attackMode: true, attackModeElement: 'fire', attackPower: 12, attackRange: 2.5 });
        if (o.e1 !== undefined) n1.nestEnergy = o.e1;
        if (o.e2 !== undefined) n2.nestEnergy = o.e2;
        if (o.off1) n1.powerOff = true;
        if (o.off2) n2.powerOff = true;
        _cacheAge = -999; render();
        if (o.e2 !== undefined) n2.nestEnergy = o.e2;      // undo a frame of regen
        if (o.e1 !== undefined) n1.nestEnergy = o.e1;
        recomputePower();
        globalThis.__s = { n1, n2, c1, c2, tu };
        return { lit: !!tu.powered, tied: n1._grid === n2._grid, links: _gridLinks.length,
                 c1link: c1.nestConnection === n1, c2link: c2.nestConnection === n2 };
    })()`);

    group('NEST GRIDS: one nest\'s power feeds another\'s network');

    await check('fixture: each connector links its own nest', () => {
        const r = scene();
        ok(r.c1link && r.c2link, JSON.stringify(r));
    });
    await check('THE ASK: two nests whose relays are in reach of each other are one grid', () => {
        const r = scene();
        ok(r.tied, 'the two nests are not tied');
        same(r.links, 1, 'tie count');
    });
    await check('THE ASK: a pylon on an EMPTY nest is fed from the other nest in its grid', () => {
        const r = scene({ e1: 200, e2: 0 });
        ok(r.lit, 'the turret is dark although the grid has power');
        const paid = run(`(function(){ const s = __s; const before = s.n1.nestEnergy; const ok = payForShot(s.tu);
            return { ok, from1: before - s.n1.nestEnergy, n2: s.n2.nestEnergy }; })()`);
        ok(paid.ok, 'the shot was refused');
        same(paid.from1, run('POWER_SHOT_COST'), 'the other nest did not pay');
        same(paid.n2, 0, 'the empty nest was charged');
    });
    await check('its own nest still pays first while it can', () => {
        scene({ e1: 200, e2: 100 });
        const r = run(`(function(){ const s = __s; payForShot(s.tu); return { n1: s.n1.nestEnergy, n2: s.n2.nestEnergy }; })()`);
        same(r.n1, 200, 'the other nest paid while this one had power');
        same(r.n2, 100 - run('POWER_SHOT_COST'), 'its own nest did not pay');
    });
    await check('relays out of reach of each other do not tie: the empty nest stays dark', () => {
        const r = scene({ c1dx: -4, e1: 200, e2: 0 });
        ok(!r.tied, 'the nests tied across ' + run('Math.hypot(__s.c1.x - __s.c2.x, __s.c1.y - __s.c2.y)').toFixed(1) + ' tiles');
        ok(!r.lit, 'the turret was fed without a tie');
    });
    await check('a relay switched off does not tie', () => {
        const r = scene({ c1off: true, e1: 200, e2: 0 });
        ok(!r.tied && !r.lit, JSON.stringify(r));
    });
    await check('the tie is a gold cable on the floor between the two relays', () => {
        scene();
        run('layAllCables()');
        const r = run(`(function(){ const s = __s; const tiles = cableTiles(s.c1, s.c2);
            return tiles.every(t => { const c = _cableTiles.get(t.x + ',' + t.y); return c && c.pieces.some(p => p.style.core === CONNECTOR_COLOR); }); })()`);
        ok(r, 'no gold cable along the tie');
    });

    group('THE NEST SWITCH');

    await check('THE ASK: a nest switched OFF is not drawn on — its power is held', () => {
        scene({ e2: 120, off2: true });
        const r = run(`(function(){ const s = __s; s.n1.powerOff = true; recomputePower();
            const lit = !!s.tu.powered; const before = s.n2.nestEnergy; const paid = payForShot(s.tu);
            return { lit, paid, held: s.n2.nestEnergy === before }; })()`);
        same(r.lit, false, 'the turret is lit off a switched-off nest');
        same(r.paid, false, 'a shot was paid from a switched-off nest');
        ok(r.held, 'the switched-off nest lost power');
    });
    await check('with its own nest off, the rest of the grid still carries it', () => {
        const r = scene({ e1: 200, e2: 120, off2: true });
        ok(r.lit, 'the grid did not take over');
        const paid = run(`(function(){ const s = __s; payForShot(s.tu); return { n1: s.n1.nestEnergy, n2: s.n2.nestEnergy }; })()`);
        same(paid.n2, 120, 'the switched-off nest paid');
        same(paid.n1, 200 - run('POWER_SHOT_COST'), 'the grid did not pay');
    });
    await check('a switched-off nest keeps charging', () => {
        scene({ e2: 50, off2: true });
        const e = run(`(function(){ for (let i = 0; i < 120; i++) nestEnergyTick(); return __s.n2.nestEnergy; })()`);
        ok(e > 50, 'it did not charge while off');
    });
    await check('turning it back on lights its pylons again', () => {
        scene({ e1: 0, e2: 120, off2: true });
        run('__s.n1.powerOff = true; recomputePower();');
        ok(!run('!!__s.tu.powered'), 'fixture: should be dark with both off');
        run('toggleNestPower(__s.n2)');
        ok(run('!!__s.tu.powered'), 'turning the nest back on did not relight it');
    });
    await check('the radial offers NEST OFF / NEST ON on a nest you hold, by drag and by tap', () => {
        ok(/"NEST ON" : "NEST OFF"/.test(rd('js/draw.js')) && /leftAction = "toggle_nest"/.test(rd('js/draw.js')), 'no button');
        ok(/selectedRadialAction = "toggle_nest"/.test(rd('js/input.js')), 'the tap path does not mirror it');
        scene();
        const r = run(`(function(){ commandTarget = null; commandFollowerTarget = null; commandEnemyTarget = null;
            commandNestTarget = __s.n2; selectedRadialAction = 'toggle_nest'; executeCommand(); return __s.n2.powerOff; })()`);
        same(r, true, 'the command did not switch it off');
    });
    await check('a nest still spawning cannot be switched', () => {
        scene();
        const r = run(`(function(){ const n = world.find(t => t.nest && t.nestZone === 3); n.nestHealth = 200; return toggleNestPower(n); })()`);
        same(r, false, 'a hostile nest was switched');
    });
    await check('the switch survives a refresh, and the gauge shows OFF', () => {
        ok(/nestOff: world\.filter\(t => t\.nest && t\.powerOff\)/.test(rd('js/save.js')), 'not saved');
        ok(/sess\.nestOff/.test(rd('js/save.js')), 'not restored');
        ok(/OFF \\u2014 HELD/.test(rd('js/draw.js')), 'the gauge does not show it');
    });

    group('the index');

    await check('the GAME INDEX explains grids and the switch', () => {
        const html = rd('game.html');
        const at = html.indexOf('NEST GRIDS');
        ok(at > -1, 'no index entry');
        const page = html.slice(at, at + 1600);
        ok(/NEST OFF/.test(page) && /gold cable/.test(page), 'it does not explain the switch and the tie');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
