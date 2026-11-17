// CARD BATTLES, step 1 (js/cardbattle.js; docs/CARD-BATTLES.md §2.5, §2.6, §2.7, §2.12, §2.23, §2.24, §2.26, §2.27): behind ?cards with ?engine=3d, a battle STARTS when you choose a creature
// (a near one where you stand; a far one after a walk, a black screen and a landing in front of it, in its room and in its sight) or when a creature hits you or yours; it takes in the creatures
// round it; those outside it go for nobody of yours and your squad goes only for those in it; the camera eases to the fight (lower, turned, nearer); RUN ends it, and the creatures of a battle
// just ended start nothing for a while. The game logic, in the sandbox (the 3D view itself is checked by tests/view3d.js; the picture was seen in a real browser, not here).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860;');
    run(`globalThis.__cell = (room, k) => { const cs = partyRoomCells(room); return cs[Math.floor(cs.length * (k === undefined ? 0.5 : k))]; };
        globalThis.__fresh = (n) => { cardBattleReset(); actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); frame = 1000;
            const c = __cell('crystal_chamber'); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; player.fpPath = null;
            for (let i = 0; i < n; i++) { spawnFollowerAtCrystal(['electric', 'core', 'fire'][i % 3]); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.x = player.x + 0.5 + i * 0.2; f.y = player.y + 0.5; } partyTick(); return followers.slice(); };
        globalThis.__ant = (x, y) => { const e = spawnCreature({ species: 'ant', className: 'scout' }); const c = _fpNearestCellOpen(x, y); e.x = c[0]; e.y = c[1]; e.moveSpeed = 0; e.baseMoveSpeed = 0; e.provoked = false; e.state = 'wander'; return e; };
        globalThis.__ticks = (n) => { for (let i = 0; i < n; i++) { frame++; cardBattleTick(); } };`);

    group('THE SWITCH');
    check('off by default (no ?cards): choosing a creature starts nothing; a hit starts nothing; the camera is the game\'s own', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = false; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); const chose = cardBattleChoose(a); cardBattleHit(player, a); return { chose, phase: cardBattlePhase(), cam: cardBattleCam(), prey: predatorPreyOk(a, player) }; })()`);
        same(r.chose, false, 'chose'); same(r.phase, 'off', 'phase'); same(r.cam, null, 'camera'); same(r.prey, true, 'a creature may go for you as ever');
    });
    check('on, but the 3D view not drawing the room: nothing (step 1 is the 3D game\'s, §2.24)', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = false; const a = __ant(player.x + 2, player.y); return { chose: cardBattleChoose(a), phase: cardBattlePhase() }; })()`);
        same(r.chose, false, 'chose'); same(r.phase, 'off', 'phase');
    });

    group('A BATTLE STARTS');
    check('a near creature chosen: the battle is on where you stand, with the creatures round it (3.5 tiles, at most 4); you are not moved', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const x0 = player.x, y0 = player.y;
            const a = __ant(player.x + 2.5, player.y), b = __ant(a.x + 1, a.y + 1), c = __ant(a.x - 1, a.y + 1.5), d = __ant(a.x + 2, a.y - 1), e = __ant(a.x + 1, a.y - 1.6), far = __ant(a.x + 9, a.y);
            const chose = cardBattleChoose(a); const foes = cardBattleFoes(); return { chose, phase: cardBattlePhase(), n: foes.length, hasA: foes.indexOf(a) >= 0, hasFar: foes.indexOf(far) >= 0, moved: Math.hypot(player.x - x0, player.y - y0) }; })()`);
        same(r.chose, true, 'chose'); same(r.phase, 'on', 'phase'); same(r.n, 4, 'at most four in it'); same(r.hasA, true, 'the one chosen'); same(r.hasFar, false, 'one far off'); same(r.moved, 0, 'you were moved');
    });
    check('a far creature chosen (§2.27): you walk towards it, then the black, then you and your squad land in front of it (in its room, in its sight), then the battle is on and the camera eases in', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 7.5, player.y - 1.5), x0 = player.x, y0 = player.y;
            const o = { chose: cardBattleChoose(a), p0: cardBattlePhase(), walking: !!(player.fpPath && player.fpPath.length) };
            __ticks(CARD_BATTLE.walk); o.p1 = cardBattlePhase(); __ticks(CARD_BATTLE.blackIn); o.p2 = cardBattlePhase(); o.black = cardBattleBlack();
            o.dist = Math.hypot(player.x - a.x, player.y - a.y); o.sees = facilitySeesFrom(player.x, player.y, a.x, a.y); o.room = facilityRoomAt(player.x, player.y, _fp.F).id === facilityRoomAt(a.x, a.y, _fp.F).id;
            o.squad = partyMembers().map(f => +Math.hypot(f.x - player.x, f.y - player.y).toFixed(1)); o.moved = Math.hypot(player.x - x0, player.y - y0) > 3;
            __ticks(CARD_BATTLE.blackHold + 1); o.p3 = cardBattlePhase(); __ticks(CARD_BATTLE.easeIn + 2); const cam = cardBattleCam(); o.k = cam ? +cam.k.toFixed(2) : 0; o.zoom = cam && cam.zoom; o.pitch = cam && cam.pitch < Math.PI / 6;
            return o; })()`);
        same(r.chose, true, 'chose'); same(r.p0, 'walk', 'first'); same(r.walking, true, 'you are not walking towards it'); same(r.p1, 'black', 'after the walk'); same(r.p2, 'black', 'in the black'); ok(r.black > 0.9, 'the black: ' + r.black);
        same(r.moved, true, 'not moved'); ok(r.dist >= 1.2 && r.dist <= 3.6, 'in front of it: ' + r.dist); same(r.sees, true, 'in its sight'); same(r.room, true, 'in its room'); ok(r.squad.every(d => d <= 2.6), 'the squad round you: ' + r.squad);
        same(r.p3, 'on', 'then'); same(r.k, 1, 'the camera in'); ok(r.zoom > 1, 'nearer'); same(r.pitch, true, 'lower than the game\'s own 30°');
    });
    check('a creature hitting you or your squad starts one where you stand (§2.5)', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 1.5, player.y); const x0 = player.x; applyDamage(followers[0], 1, a); return { phase: cardBattlePhase(), has: cardBattleFoes().indexOf(a) >= 0, moved: player.x !== x0 }; })()`);
        same(r.phase, 'on', 'phase'); same(r.has, true, 'the one that struck'); same(r.moved, false, 'moved');
    });

    group('IN A BATTLE');
    check('the creatures outside it walk past: they go for nobody of yours (§2.6); your squad and your gun go only for those in it', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y), out = __ant(player.x - 6, player.y + 1); out.provoked = true; out.currentTarget = player;
            cardBattleChoose(a); return { inPrey: predatorPreyOk(a, player), outPrey: predatorPreyOk(out, player), outFol: predatorPreyOk(out, followers[0]), target: out.currentTarget === player, mayIn: cardBattleMayTarget(a), mayOut: cardBattleMayTarget(out), gun: targetNearest() !== out }; })()`);
        same(r.inPrey, true, 'one in it may go for you'); same(r.outPrey, false, 'one outside goes for you'); same(r.outFol, false, 'one outside goes for your squad'); same(r.target, false, 'one outside kept you as its target');
        same(r.mayIn, true, 'your squad may go for one in it'); same(r.mayOut, false, 'your squad goes for one outside'); same(r.gun, true, 'your gun picks one outside');
    });
    check('RUN ends it (§2.12): the camera eases back, and the creatures of the battle start nothing and go for nobody for a while; then all as ever', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(CARD_BATTLE.easeIn + 2);
            const o = { ran: cardBattleRun(), p: cardBattlePhase() }; applyDamage(player, 1, a); o.after = cardBattlePhase(); o.prey = predatorPreyOk(a, player); o.calmed = !a.provoked;
            __ticks(CARD_BATTLE.easeOut + 2); o.off = cardBattlePhase(); o.cam = cardBattleCam(); __ticks(CARD_BATTLE.calm); o.preyLater = predatorPreyOk(a, player); return o; })()`);
        same(r.ran, true, 'ran'); same(r.p, 'end', 'phase'); same(r.after, 'end', 'its last blow started one again'); same(r.prey, false, 'it goes for you at once'); same(r.calmed, true, 'still provoked');
        same(r.off, 'off', 'phase, after the camera is out'); same(r.cam, null, 'the camera'); same(r.preyLater, true, 'later, as ever');
    });
    check('it ends by itself when every creature in it is down', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(CARD_BATTLE.easeIn + 2); for (const f of cardBattleFoes()) f.dead = true; __ticks(1); return cardBattlePhase(); })()`);
        same(r, 'end', 'phase');
    });

    group('THE PIECES');
    check('the page loads js/cardbattle.js (and its boot check); the tap, the hit, the prey, the squad, the gun, the step and the edges ask it; the 3D view\'s camera reads it', () => {
        const html = rd('game.html'), view = rd('view3d/gameview.js') + rd('view3d/gamemap.js');
        ok(/<script src="js\/cardbattle\.js\?v=/.test(html) && /"js\/cardbattle\.js": "CARD_BATTLE"/.test(html), 'the page');
        ok(/cardBattleTap\(ex, ey\)/.test(rd('js/targeting.js')) && /cardBattleMayTarget/.test(rd('js/targeting.js')), 'the tap and the gun');
        ok(/cardBattleHit\(target, source\)/.test(rd('js/helpers.js')), 'the hit'); ok(/cardBattleBars\(p\)/.test(rd('js/predator.js')), 'the prey'); ok(/cardBattleMayTarget\(a\)/.test(rd('js/npc.js')), 'the squad');
        ok(/cardBattleTick\(\)/.test(rd('js/game.js')) && /cardBattlePost\(\)/.test(rd('js/game.js')), 'the step and the edges');
        ok(/get battleCam\(\)/.test(view) && /GM\.battleCam/.test(view) && /battling\(\)/.test(view), 'the 3D view');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
