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
    check('the world goes on (§2.28, the owner: "Both at once"): a follower holding a room (HOLD) is not in the battle: creatures outside it may still go for it, it fights them, and their hits on it start no battle', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const F = partyMembers(), held = F[2]; partyApplyStance([held], 'hold');
            const o = { posted: !!held.post, member: partyIsMember(held) }; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); const out = __ant(held.x + 1.5, held.y);   // (after the battle began: not one of it)
            o.preyHeld = predatorPreyOk(out, held); o.preySquad = predatorPreyOk(out, partyMembers()[0]); o.heldMay = cardBattleMayTarget(out, held); o.squadMay = cardBattleMayTarget(out, partyMembers()[0]);
            cardBattleRun(); __ticks(CARD_BATTLE.easeOut + CARD_BATTLE.calm + 4); applyDamage(held, 1, out); o.started = cardBattlePhase(); return o; })()`);
        same(r.posted, true, 'held'); same(r.member, false, 'still in the squad');
        same(r.preyHeld, true, 'a creature outside may go for the one holding a room'); same(r.preySquad, false, 'nor for your squad'); same(r.heldMay, true, 'the one holding a room fights it'); same(r.squadMay, false, 'your squad does not');
        same(r.started, 'off', 'a hit on the one holding a room started a battle');
    });
    check('RUN ends it (§2.12): the camera eases back, and the creatures of the battle start nothing and go for nobody for a while; then all as ever', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(CARD_BATTLE.easeIn + 2);
            const o = { ran: cardBattleRun(), p: cardBattlePhase() }; applyDamage(player, 1, a); o.after = cardBattlePhase(); o.prey = predatorPreyOk(a, player); o.calmed = !a.provoked;
            __ticks(CARD_BATTLE.easeOut + 2); o.off = cardBattlePhase(); o.cam = cardBattleCam(); __ticks(CARD_BATTLE.calm); o.preyLater = predatorPreyOk(a, player); return o; })()`);
        same(r.ran, true, 'ran'); same(r.p, 'end', 'phase'); same(r.after, 'end', 'its last blow started one again'); same(r.prey, false, 'it goes for you at once'); same(r.calmed, true, 'still provoked');
        same(r.off, 'off', 'phase, after the camera is out'); same(r.cam, null, 'the camera'); same(r.preyLater, true, 'later, as ever');
    });
    check('its prey down, a creature in the battle keeps at it (the owner, 2026-11-17): it goes for the nearest of yours still up, instead of calming down and wandering off', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a);
            const gone = followers[0]; a.currentTarget = gone; a.provoked = true; gone.health = 0; gone.dead = true; let at = null;
            for (let i = 0; i < 60; i++) { frame++; a.update(); cardBattleTick(); }
            return { phase: cardBattlePhase(), state: a.state, provoked: a.provoked, onTheOther: a.currentTarget === followers[1] || a.currentTarget === player }; })()`);
        same(r.phase, 'on', 'the battle'); same(r.provoked, true, 'it calmed down'); same(r.onTheOther, true, 'it went for another of yours'); same(r.state === 'wander', false, 'it wandered off');
    });
    check('one far from you all the same is let go: out of the battle, calm, and the camera no longer takes it in; the last one let go ends the battle and the camera comes back', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y), b = __ant(player.x + 2.5, player.y + 1); cardBattleChoose(a);
            const o = { both: cardBattleFoes().length }; a.x = player.x + CARD_BATTLE.leave + 2; __ticks(10);
            o.left = cardBattleFoes().indexOf(a) < 0; o.calm = !a.provoked && a.state === 'wander'; o.bars = cardBattleBars(a, player); o.still = cardBattlePhase();
            b.x = player.x - CARD_BATTLE.leave - 2; __ticks(10); o.end = cardBattlePhase(); __ticks(CARD_BATTLE.easeOut + 5); o.cam = cardBattleCam(); o.off = cardBattlePhase();
            return o; })()`);
        same(r.both, 2, 'both in it'); same(r.left, true, 'the far one let go'); same(r.calm, true, 'calmed'); same(r.bars, true, 'it goes for nobody of yours for a while'); same(r.still, 'on', 'the battle with the other');
        same(r.end, 'end', 'the last one let go'); same(r.cam, null, 'the camera'); same(r.off, 'off', 'then');
    });
    check('it ends by itself when every creature in it is down', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(CARD_BATTLE.easeIn + 2); for (const f of cardBattleFoes()) f.dead = true; __ticks(1); return cardBattlePhase(); })()`);
        same(r, 'end', 'phase');
    });

    group('THE BATTLE SCREEN (step 2): SQUAD ROWS\' cards');
    check('each member\'s own cards (§2.25): its BASIC ATTACK always ready; each second attack it may use, its recharge its wait time at 2 s a turn (rounded up), ready or the turns left; its Ultimate by its meter', () => {
        const r = J(`(function(){ __fresh(3); const F = partyMembers(); F[0].evolved = 'jellyram'; F[0].element = 'core'; energyFill(F[0]); F[0].ultimateCharge = 100; F[1].evolved = 'rimestar'; F[1].element = 'ice'; energyFill(F[1]); F[1].ultimateCharge = 40;
            const a = cardBattleCards(F[0]), b = cardBattleCards(F[1]), egg = cardBattleCards(F[2]);
            const cooler = F.find(f => altCools(f)) || (F[2].role = 'brawler', F[2]); cooler._altReadyAt = frame + 150; const cooling = cardBattleCards(cooler).find(c => c.kind === 'move');   // (one that cools down after its move: a Brawler, js/moves.js altCools)
            const pick = cs => cs.map(c => c.kind + ':' + c.name + ':' + (c.ready ? 'R' : 'W') + (c.recharge ? ':' + c.recharge : '') + (c.kind === 'ult' ? ':' + c.charge : ''));
            return { a: pick(a), b: pick(b), egg: pick(egg), cooling: [cooling.ready, cooling.turns], wob: Math.max(1, Math.ceil(MOVES.wobble_slam.windup / 2)), icy: Math.max(1, Math.ceil(MOVES[b[1].name === MOVES.icicle_volley.name ? 'icicle_volley' : 'icicle_volley'].windup / 2)), fx: a[1].fx.length > 10 && b[2].fx.length > 10 }; })()`);
        same(r.a.join(), 'basic:BASIC ATTACK:R,move:WOBBLE SLAM:R:' + r.wob + ',ult:JELLY SHIELDS:R:100', 'the Jelly Ram\'s');
        same(r.b.join(), 'basic:BASIC ATTACK:R,move:ICICLE VOLLEY:R:' + r.icy + ',ult:WHITEOUT:W:40', 'the Rimestar\'s');
        same(r.egg.join(), 'basic:BASIC ATTACK:R,move:BASH:R:1', 'an egg\'s (BASH before it evolves)'); same(r.cooling.join(), 'false,2', 'a second attack cooling 2.5 s: 2 turns'); same(r.fx, true, 'the effect lines (the game\'s own)');
    });
    check('a named everyday attack is the basic card\'s name (a Mage\'s shot), with the game\'s own effect line', () => {
        const r = J(`(function(){ __fresh(1); const f = partyMembers()[0]; f.evolved = 'thunderhead'; f.element = 'electric'; energyFill(f); const c = cardBattleCards(f)[0]; return [c.kind, c.name, c.fx.length > 10]; })()`);
        same(r.join(), 'basic,CHAIN LIGHTNING,true', 'the basic card');
    });
    check('the screen: a battle on puts it up (body.cb-on) with the rest of the HUD out of its way; the network panel waits; game.html styles it after SQUAD ROWS', () => {
        const html = rd('game.html');
        ok(/body\.cb-on #cbScreen \{ display: block;/.test(html), 'the screen shown'); ok(/body\.cb-on :is\(#squadBar, #mixTool, #coreHud, #btnPack, #kitCards, #topToggles, #squadFly, #zoneLine\) \{ visibility: hidden !important; \}/.test(html), 'the HUD out of its way');
        ok(/cardBattleCam\(\)\) return;/.test(rd('js/facilitynet.js')), 'the network panel');
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(2); const on = cardBattleShown(); cardBattleRun(); __ticks(CARD_BATTLE.easeOut + 2); return [on, cardBattleShown()]; })()`);
        same(r.join(), 'true,false', 'the screen up in the battle, and after it');
    });

    group('THE PIECES');
    check('the page loads js/cardbattle.js (and its boot check); the tap, the hit, the prey, the squad, the gun, the step and the edges ask it; the 3D view\'s camera reads it', () => {
        const html = rd('game.html'), view = rd('view3d/gameview.js') + rd('view3d/gamemap.js');
        ok(/<script src="js\/cardbattle\.js\?v=/.test(html) && /"js\/cardbattle\.js": "CARD_BATTLE"/.test(html), 'the page');
        ok(/cardBattleTap\(ex, ey\)/.test(rd('js/targeting.js')) && /cardBattleMayTarget/.test(rd('js/targeting.js')), 'the tap and the gun');
        ok(/cardBattleHit\(target, source\)/.test(rd('js/helpers.js')), 'the hit'); ok(/cardBattleBars\(p, a\)/.test(rd('js/predator.js')), 'the prey'); ok(/cardBattleMayTarget\(a, actor\)/.test(rd('js/npc.js')), 'the squad');
        ok(/cardBattleTick\(\)/.test(rd('js/game.js')) && /cardBattlePost\(\)/.test(rd('js/game.js')), 'the step and the edges');
        ok(/get battleCam\(\)/.test(view) && /GM\.battleCam/.test(view) && /battling\(\)/.test(view), 'the 3D view');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
