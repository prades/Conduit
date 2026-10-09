// TELEPORT — "next to each controlled nest including the home zone there
// should be a left click option saying teleport to zone, and it will teleport
// to the controlled zone closest to the enemy zone."
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
    run('gameState.running = true; if (typeof tutorialMode !== "undefined") tutorialMode = false; ensureWorldTo(6 * ZONE_LENGTH);');

    // You hold zones 1..held; the rest are live.
    const hold = held => run(`(function(){
        world.forEach(t => { if (t.nest && !isHomePortal(t)) { const z = getZoneIndex(t.x); t.nestHealth = (z >= 1 && z <= ${held}) ? 0 : t.nestMaxHealth; } });
        _nestCache = world.filter(t => t.nest); buildMode = false;
        globalThis.__home = world.find(t => t.nest && isHomePortal(t));
        globalThis.__z = z => world.find(t => t.nest && getZoneIndex(t.x) === z);
        return true; })()`);

    group('WHERE IT GOES');

    await check('THE ASK: from home it goes to the held nest closest to the enemy', () => {
        hold(3);
        ok(run('teleportDestination(__home) === __z(3)'), 'went to zone ' + run('getZoneIndex((teleportDestination(__home) || {x: -99}).x)'));
        ok(run('teleportLabel(__home)') === 'TELEPORT · ZONE 3', run('teleportLabel(__home)'));
    });
    await check('from any other held nest too', () => {
        hold(3);
        ok(run('teleportDestination(__z(1)) === __z(3)'), 'zone 1 does not go to the front');
    });
    await check('on the front nest itself it takes you home', () => {
        hold(3);
        ok(run('teleportDestination(__z(3)) === __home'), 'not home');
        ok(run('teleportLabel(__z(3))') === 'TELEPORT HOME', run('teleportLabel(__z(3))'));
    });
    await check('holding nothing but home, there is nowhere to go', () => {
        hold(0);
        ok(run('teleportDestination(__home)') === null, 'it found somewhere');
        ok(run('teleportLabel(__home)') === 'NO ZONE HELD', run('teleportLabel(__home)'));
    });

    group('GOING');

    await check('THE ASK: you land in front of the front nest, with the squad that follows you', () => {
        hold(2);
        const r = run(`(function(){
            actors.length = 0; followers.length = 0;
            player.x = player.targetX = __home.x + 1; player.y = player.targetY = 2;
            for (let i = 0; i < 4; i++) { spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.stance = 'follow'; f.job = null; f.x = player.x + i * 0.3; f.y = 2; }
            const busy = followers[3]; busy.job = { type: 'move', x: 3, y: 2 };
            const holdOne = followers[2]; holdOne.stance = 'hold';
            commandNestTarget = __home; selectedRadialAction = 'teleport'; executeCommand();
            const n = __z(2);
            return { px: player.x, py: player.y, cam: player.visualX, nx: n.x,
                     came: followers.filter(f => Math.hypot(f.x - player.x, f.y - player.y) < 2).length,
                     busyStayed: Math.abs(busy.x - __home.x) < 6, holdStayed: Math.abs(holdOne.x - __home.x) < 6 }; })()`);
        ok(Math.abs(r.px - r.nx) < 2 && r.py >= 0 && r.py <= 3, 'landed at ' + r.px + ',' + r.py + ' (nest at ' + r.nx + ')');
        ok(r.cam === r.px, 'the camera did not jump with you');
        ok(r.came === 2, r.came + ' followers came (want the 2 following)');
        ok(r.busyStayed && r.holdStayed, 'a follower on a job or holding came along');
    });
    await check('it does not stay at the new spot by walking back: the move target is the landing spot', () => {
        ok(run('player.targetX === player.x && player.targetY === player.y'), 'player will walk away');
        run('for (let i = 0; i < 5; i++) render();');
        ok(Math.abs(run('player.x') - run('__z(2).x')) < 2, 'player drifted to ' + run('player.x'));
    });

    group('THE RING');

    await check('left of the ring on a held nest: TELEPORT out of build mode, NEST ON/OFF in it', () => {
        const d = rd('js/draw.js'), inp = rd('js/input.js');
        ok(/leftLabel = teleportLabel\(commandNestTarget\)/.test(d) && /"teleport"/.test(d), 'the ring does not offer it');
        ok(/buildMode \? "toggle_nest"/.test(inp) && /"teleport"/.test(inp), 'the tap path does not mirror it');
        hold(2);
        run('buildMode = true; commandNestTarget = __z(1); __z(1).powerOff = false; selectedRadialAction = "toggle_nest"; executeCommand(); buildMode = false;');
        ok(run('__z(1).powerOff') === true, 'NEST OFF no longer works in build mode');
        run('__z(1).powerOff = false; recomputePower();');
    });
    await check('the guide explains it', () => {
        ok(/TELEPORT/.test(rd('game.html')) && /front nest/.test(rd('game.html')), 'not in the guide');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
