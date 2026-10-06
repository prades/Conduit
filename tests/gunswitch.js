// THE GENERATOR SWITCH AND THE PYLON TURRET.
//
// THE ASK: "make it to where I can turn the generator off and on and that will
// make all of the pylons lose power until it gets turned back on" and "whenever
// the pylon is in turret mode it has a little self-aiming turret on top that
// will lock onto the enemy targets."
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
    run('gameState.running = true;');

    // generator at row[0], turret at row[1], wave pylon at row[2]; optional connector at row[3].
    const board = (opts) => run(`(function(){
        actors.length = 0; followers.length = 0;
        world.forEach(t => { t.pillar = false; t.attackMode = false; t.waveMode = false; t.isGenerator = false;
            t.isConnector = false; t.waveTripped = false; t.circuitOn = undefined; t.connectedPylon = null; t.nestConnection = null;
            t.powered = undefined; if (t.nest) { t.nestHealth = t.nestMaxHealth || 200; t.nestEnergy = undefined; } });
        const row = world.filter(t => t.type === 'floor' && t.y === 3 && t.x >= 4 && !t.nest && !t.nodeType).sort((a,b) => a.x - b.x);
        const o = ${JSON.stringify(opts || {})};
        const base = { pillar: true, destroyed: false, pillarTeam: 'green', health: 99999, maxHealth: 99999, attackModeElement: 'fire', attackModeColor: '#f50', attackPower: 12, attackRange: 2.5 };
        Object.assign(row[0], base, { isGenerator: true, attackMode: true, attackModeElement: 'generator' });
        Object.assign(row[1], base, { attackMode: true });
        Object.assign(row[2], base, { waveMode: true });
        if (o.connector) Object.assign(row[3], base, { isConnector: true, attackMode: true, attackModeElement: 'connector', circuitOn: true });
        if (o.genOff) row[0].circuitOn = false;
        _cacheAge = -999; render();
        globalThis.__row = row;
        return { turret: !!row[1].powered, wave: !!row[2].powered, firing: _aPylons.length, waving: _wPylons.length };
    })()`);

    group('THE GENERATOR SWITCH');

    await check('a generator that is ON powers its pylons', () => {
        const r = board(); ok(r.turret && r.wave, JSON.stringify(r));
    });
    await check('THE ASK: turned OFF, every pylon it feeds loses power', () => {
        const r = board({ genOff: true });
        ok(!r.turret && !r.wave, 'pylons stayed lit with the generator off: ' + JSON.stringify(r));
        ok(r.firing === 0 && r.waving === 0, 'they are still counted as firing or waving');
    });
    await check('turned back ON, they come back', () => {
        board({ genOff: true });
        const r = run(`(function(){ toggleRelayCircuit(__row[0]); render();
            return { on: __row[0].circuitOn, turret: !!__row[1].powered, wave: !!__row[2].powered }; })()`);
        ok(r.on === true && r.turret && r.wave, JSON.stringify(r));
    });
    await check('the switch lands at once, not on the next cache rebuild', () => {
        board();
        const r = run(`(function(){ toggleRelayCircuit(__row[0]); return { turret: !!__row[1].powered, age: _cacheAge }; })()`);
        ok(r.turret === false && r.age < -1000, JSON.stringify(r));
    });
    await check('an OFF generator mends nothing either', () => {
        board({ genOff: true });
        const n = run(`(function(){ rebuildGeneratorLinks(); return _genLinks.length; })()`);
        ok(n === 0, 'an off generator still has ' + n + ' healing links');
    });
    await check('the ring offers TURN ON / TURN OFF for a generator, by drag and by tap', () => {
        ok(/TURN OFF/.test(rd('js/draw.js')) && /TURN ON/.test(rd('js/draw.js')), 'no labels');
        ok(/isSwitchableRelay\(commandTarget\)/.test(rd('js/draw.js')) && /isSwitchableRelay\(commandTarget\)/.test(rd('js/input.js')),
           'draw and tap paths do not agree');
        ok(/isSwitchableRelay\(commandTarget\)[^\n]*toggleRelayCircuit/.test(rd('js/commands.js')), 'the command does not handle a generator');
    });
    await check('the command really flips a generator', () => {
        board();
        const r = run(`(function(){ commandTarget = __row[0]; selectedRadialAction = 'toggle_circuit'; commandFollowerTarget = null;
            commandEnemyTarget = null; commandNestTarget = null; executeCommand(); return __row[0].circuitOn; })()`);
        ok(r === false, 'executing toggle_circuit left it ' + r);
    });
    await check('the pylon says WHY it is dark', () => {
        board({ genOff: true });
        const t = run('pylonPowerState(__row[1]).text'), g = run('pylonPowerState(__row[0]).text');
        ok(/GENERATOR IS OFF/.test(t), 'the pylon says: ' + t);
        ok(/SWITCHED OFF/.test(g), 'the generator says: ' + g);
    });
    await check('a connector in reach still carries them — that is its job', () => {
        const r = board({ genOff: true, connector: true });
        ok(r.turret, 'a connector in reach did not take over from the off generator');
    });
    await check('the on/off state is drawn over the generator and saved', () => {
        ok(/GENERATOR ON/.test(rd('js/game.js')) && /GENERATOR OFF/.test(rd('js/game.js')), 'no on/off label');
        ok(/circuitOn: t\.circuitOn !== false/.test(rd('js/save.js')), 'not saved');
    });

    group('THE PYLON TURRET');

    // Draw one turret with the canvas calls recorded.
    const draw = (setup) => run(`(function(){
        actors.length = 0;
        const t = { x: 10, y: 3, attackRange: 2.5, attackMode: true, pillar: true };
        player.visualX = 10; player.visualY = 3; canvas.width = 800; canvas.height = 600;
        const calls = [];
        const keep = {}; for (const k of ['moveTo','lineTo','arc','ellipse','setLineDash','stroke','fill']) { keep[k] = ctx[k]; ctx[k] = (...a) => calls.push([k, ...a]); }
        let out;
        try { ${setup}; frame = 1000; drawPylonTurret(t, 400, 300, '#f50', typeof dark === 'undefined' ? false : dark); out = { calls, ang: t._tAng, t }; }
        finally { for (const k in keep) ctx[k] = keep[k]; }
        return { n: calls.length, ang: out.ang, dashed: calls.filter(c => c[0] === 'setLineDash' && c[1].length).length,
                 lines: calls.filter(c => c[0] === 'lineTo').map(c => [c[1], c[2]]), arcs: calls.filter(c => c[0] === 'arc').length };
    })()`);
    const foe = (dx, dy) => `const f = { x: t.x + ${dx}, y: t.y + ${dy}, dead: false, team: 'red', health: 50 };
        actors.push(f); globalThis.isHostileTarget = () => true;`;

    await check('it turns to face a target, in screen space', () => {
        // A foe straight along +x in the world projects to the lower right.
        const r = draw(foe(2, 0) + ' t._tAng = -2.5; for (let i = 0; i < 40; i++) drawPylonTurret(t, 400, 300, "#f50", false);');
        const want = Math.atan2(2 * 30, 2 * 60);
        ok(Math.abs(r.ang - want) < 0.1, 'aimed at ' + r.ang.toFixed(2) + ', wanted ' + want.toFixed(2));
    });
    await check('it locks (dashed line + reticle) once the target is in firing range', () => {
        const r = draw(foe(2, 0) + ' t._tAng = 0.46;');
        ok(r.dashed >= 1, 'no lock line to a target inside firing range');
    });
    await check('it only TRACKS, with no lock, between firing range and tracking range', () => {
        const r = draw(foe(3.2, 0) + ' t._tAng = 0.46;');   // beyond 2.5, inside 2.5 x 1.6
        ok(r.dashed === 0, 'it claimed a lock on a target it could not hit');
    });
    await check('it ignores a target past its tracking range, and sweeps instead', () => {
        const a = draw(foe(6, 0) + ' t._tAng = 0.1;');
        ok(a.dashed === 0, 'it locked onto something far away');
        const b = draw('t._tAng = 0.1;');
        ok(Math.abs(b.ang - 0.12) < 0.005, 'the idle sweep did not move the gun (' + b.ang + ')');
    });
    await check('a dark (unpowered) pylon droops: no aiming, no lock', () => {
        const r = draw(foe(1, 0) + ' globalThis.dark = true; t._tAng = -2.0;');
        run('delete globalThis.dark');
        ok(r.dashed === 0, 'a dark turret locked on');
        ok(Math.abs(r.ang - -2.0) < 0.2, 'a dark turret tracked a target (' + r.ang + ')');
    });
    await check('the muzzle flashes right after a shot, and not otherwise', () => {
        const flash = s => draw(s).arcs;
        const quiet = flash('t._tAng = 0.1;');
        const shot  = flash('t._tAng = 0.1; t._lastShotFrame = 998;');
        ok(shot > quiet, 'no flash after a shot (' + shot + ' vs ' + quiet + ')');
    });
    await check('the target scan is throttled, not run every frame', () => {
        ok(/frame - obj\._tScan >= 6/.test(rd('js/draw.js')), 'the scan runs every frame');
    });
    await check('only a turret-mode pylon wears it — never a relay or a wave pylon', () => {
        ok(/obj\.attackMode && !isRelayPylon\(obj\)\) drawPylonTurret/.test(rd('js/game.js')), 'the gate is wrong');
        ok(/t\._lastShotFrame = frame/.test(rd('js/game.js')), 'a paid-for shot does not mark the flash');
    });

    await check('THE ASK: turret rounds hit TURRET_DAMAGE_MULT harder than the base power', () => {
        const mult = run('TURRET_DAMAGE_MULT');
        ok(mult >= 1.5, 'the multiplier is ' + mult);
        const r = run(`(function(){ const keep = spawnFollowerProjectile; let dmg = null;
            spawnFollowerProjectile = (a, tgt, col, d) => { dmg = d; };
            try {
                const row = world.filter(t => t.type === 'floor' && t.y === 3 && t.x >= 4 && !t.nest && !t.nodeType).sort((a,b) => a.x - b.x);
                world.forEach(t => { t.pillar = false; t.attackMode = false; t.isGenerator = false; t.isConnector = false; t.circuitOn = undefined; t.waveTripped = false; t.nestConnection = null; if (t.nest) { t.powerOff = false; t.nestEnergy = undefined; } });
                Object.assign(row[0], { pillar: true, destroyed: false, pillarTeam: 'green', health: 99999, maxHealth: 99999, isGenerator: true, attackMode: true, attackModeElement: 'generator' });
                const t = row[1];
                Object.assign(t, { pillar: true, destroyed: false, pillarTeam: 'green', health: 99999, maxHealth: 99999, attackMode: true, attackModeElement: 'fire', attackPower: 20, attackRange: 2.5 });
                actors.length = 0;
                const S = SPECIES['ant']; const f = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), t.x + 1, t.y);
                f.team = 'red'; f.health = 1e6; f.maxHealth = 1e6; actors.push(f);
                _cacheAge = -999; for (let i = 0; i < 400 && dmg === null; i++) render();
            } finally { spawnFollowerProjectile = keep; }
            return dmg; })()`);
        ok(Math.abs(r - 20 * mult) < 1e-9, 'a 20-power turret fired ' + r);
    });

    group('the index');

    await check('the index teaches both', () => {
        const html = rd('game.html');
        ok(/TURN OFF/.test(html) && /self-aiming/i.test(html), 'the index does not describe the generator switch and the turret');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
