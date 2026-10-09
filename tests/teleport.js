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

    group('THE SQUAD RALLIES');

    // A fight in zone 3 (a follower with a provoked enemy beside it), you out
    // at zone 3, and followers standing at home — fresh respawns.
    const rally = (extra) => run(`(function(){
        actors.length = 0; followers.length = 0; floatingTexts.length = 0;
        const S = SPECIES.ant, foe = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), 3 * ZONE_LENGTH + 9, 2);
        foe.team = 'red'; foe.provoked = true; foe.health = foe.maxHealth = 1e6; actors.push(foe);
        const mk = (x) => { spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.stance = 'follow'; f.job = null; f.x = x; f.y = 2; return f; };
        const fighter = mk(foe.x - 1); fighter._nearestEnemy = foe;
        const home1 = mk(__home.x + 1), home2 = mk(__home.x + 2);
        player.x = player.targetX = player.visualX = foe.x - 2; player.y = player.targetY = player.visualY = 2;
        ${extra || ''}
        frame = (Math.floor(frame / RALLY_EVERY) + 1) * RALLY_EVERY;
        const moved = followerRallyTick();
        return { moved, h1: getZoneIndex(Math.floor(home1.x)), h2: getZoneIndex(Math.floor(home2.x)), fighterX: fighter.x, foeX: foe.x }; })()`);

    await check('THE ASK: a fight out in zone 3 pulls the followers at home to the held nest nearest it', () => {
        hold(3);
        const r = rally();
        ok(r.moved === 2 && r.h1 === 3 && r.h2 === 3, JSON.stringify(r));
    });
    await check('it goes to the nearest held nest, even when that is behind the fight', () => {
        hold(1);
        const r = rally();
        ok(r.moved === 2 && r.h1 === 1 && r.h2 === 1, JSON.stringify(r));
    });
    await check('no fight, no teleport', () => {
        hold(3);
        ok(rally('fighter._nearestEnemy = null;').moved === 0, 'they teleported with nothing to fight');
    });
    await check('not the followers beside you at home, nor a busy or holding one', () => {
        hold(3);
        ok(rally('player.x = player.targetX = player.visualX = __home.x + 1;').moved === 0, 'it took the squad from your side');
        const r = rally('home1.job = { type: "move", x: 3, y: 2 }; home2.stance = "hold";');
        ok(r.moved === 0 && r.h1 === 0 && r.h2 === 0, JSON.stringify(r));
    });
    await check('with only home held there is nowhere to send them', () => {
        hold(0);
        ok(rally().moved === 0, 'they went somewhere');
    });
    await check('it runs every frame from the game loop', () => {
        ok(/followerRallyTick\(\)/.test(rd('js/game.js')), 'not called');
    });

    group('FOLLOWERS USE THE NESTS');

    // A follower at home sent to the zone 3 nest; you hold 1-3.
    const order = (extra) => run(`(function(){
        actors.length = 0; followers.length = 0;
        spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false;
        f.x = __home.x + 2; f.y = 2; f.health = f.maxHealth;
        const dest = { x: __z(3).x + 3, y: 2 };
        ${extra || ''}
        f.job = { type: 'move', target: dest }; f.stance = 'hold';
        let tp = -1, maxStep = 0, lx = f.x;
        for (let i = 0; i < 1500; i++) { render(); const step = Math.abs(f.x - lx); if (step > 5 && tp < 0) tp = i; lx = f.x; if (Math.hypot(f.x - dest.x, f.y - dest.y) < 0.7) break; }
        return { tp, at: Math.hypot(f.x - dest.x, f.y - dest.y), route: f.job && f.job.route };
    })()`);
    await check('THE ASK: a follower positioned far off goes by nest: walks in, teleports, walks on', () => {
        hold(3);
        const r = order();
        ok(r.tp >= 0, 'it never teleported');
        ok(r.at < 0.8, 'it did not reach where it was sent: ' + r.at);
    });
    await check('not when walking is about as quick', () => {
        hold(3);
        const r = run(`(function(){ const a = { x: __z(3).x - 4, y: 2 }; return teleportRouteFor(a, __z(3).x + 3, 2); })()`);
        ok(r === null, 'it took the nests for a short walk');
    });
    await check('a follower left far behind you comes back through the nests', () => {
        hold(3);
        const r = run(`(function(){
            actors.length = 0; followers.length = 0;
            spawnFollowerAtCrystal('fire'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.stance = 'follow'; f.job = null;
            f.x = __home.x + 2; f.y = 2;
            player.x = player.targetX = player.visualX = __z(3).x + 2; player.y = player.targetY = player.visualY = 2;
            frame = (Math.floor(frame / RALLY_EVERY) + 1) * RALLY_EVERY + RALLY_EVERY / 2;
            const n = followerRouteTick();
            let far = true;
            for (let i = 0; i < 900 && far; i++) { render(); far = Math.hypot(f.x - player.x, f.y - player.y) > ROUTE_FOLLOW_MIN; }
            return { n, far, job: !!f.job, stance: f.stance };
        })()`);
        ok(r.n === 1, 'no route given: ' + JSON.stringify(r));
        ok(!r.far, 'it did not get back to you: ' + JSON.stringify(r));
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
