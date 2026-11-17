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
        globalThis.__ticks = (n) => { for (let i = 0; i < n; i++) { frame++; cardBattleTick(); } };
        globalThis.__run = () => { const ran = cardBattleRun(); for (let i = 0; i < 3000 && cardBattlePhase() === 'on'; i++) { frame++; cardBattleTick(); } return ran; };   // (RUN on your turn: the enemies' last hits, each a window, then out)`);

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
            __run(); __ticks(CARD_BATTLE.easeOut + CARD_BATTLE.calm + 4); applyDamage(held, 1, out); o.started = cardBattlePhase(); return o; })()`);
        same(r.posted, true, 'held'); same(r.member, false, 'still in the squad');
        same(r.preyHeld, true, 'a creature outside may go for the one holding a room'); same(r.preySquad, false, 'nor for your squad'); same(r.heldMay, true, 'the one holding a room fights it'); same(r.squadMay, false, 'your squad does not');
        same(r.started, 'off', 'a hit on the one holding a room started a battle');
    });
    check('RUN ends it (§2.12): the camera eases back, and the creatures of the battle start nothing and go for nobody for a while; then all as ever', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(CARD_BATTLE.easeIn + 2);
            const o = { ran: __run(), p: cardBattlePhase() }; applyDamage(player, 1, a); o.after = cardBattlePhase(); o.prey = predatorPreyOk(a, player); o.calmed = !a.provoked;
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

    check('THE CLOCK AT HALF (§2.30; the owner, 2026-11-17: "time slows down to about half ... like the crystal being destroyed in half speed"; "Clock only"): in a battle every countdown of the world runs at half, the raids\' clock, the spawns\', the Crystal\'s idle refill, a turret\'s shots and the bites of a creature outside it; a creature in it bites at its own pace; out of a battle all as ever', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true;
            const a = __ant(player.x + 2, player.y), out = __ant(player.x - 6, player.y + 1), R = _raidState(), keepOn = raidsOn, it = sentryItems()[0];
            const bites = (c, n) => { let k = 0; const keep = c.bite; c.bite = function () { k++; return null; }; c.attackCooldown = 0; c.attackWindup = 0; c.attackAnim = 0; for (let i = 0; i < n; i++) { frame++; c._biteTick(crystal); } c.bite = keep; return k; };
            const clocks = (n) => { R.nextAt = frame + 1000; _fp.spawnAt = frame + 1000; crystal.health = crystal.maxHealth / 2; _crystalDrawnAt = -1e9; const h0 = crystal.health; if (it) it.cd = 50; raidsOn = function () { return true; };
                for (let i = 0; i < n; i++) { frame++; raidTick(); facilitySpawnTick(); crystalRefillTick(); facilitySentryTick(); }
                raidsOn = keepOn; return { raid: R.nextAt - frame, spawn: _fp.spawnAt - frame, refill: Math.round((crystal.health - h0) / crystal.maxHealth * CRYSTAL_POWER.refill.fullFrames * 1000) / 1000, turret: it ? it.cd : null }; };
            const o = { outside: { clocks: clocks(40), bites: bites(out, 630), clock: cardBattleClock() } };
            cardBattleChoose(a); o.phase = cardBattlePhase();
            o.inside = { clocks: clocks(40), bitesOut: bites(out, 630), bitesIn: bites(a, 630), clock: [cardBattleClock(), cardBattleClock(out), cardBattleClock(a)] };
            cardBattleRun(); o.after = cardBattleClock(out); return o; })()`);
        same(r.phase, 'on', 'the battle'); same(JSON.stringify(r.outside.clocks), JSON.stringify({ raid: 960, spawn: 960, refill: 40, turret: 10 }), 'out of a battle, after 40 frames: the raid and the spawn 960 frames off, 40 frames of refill, the turret 10 frames from its shot');
        same(JSON.stringify(r.inside.clocks), JSON.stringify({ raid: 980, spawn: 980, refill: 20, turret: 30 }), 'in a battle, after 40 frames: half as far on');
        same(r.outside.bites, 10, 'a creature\'s bites in 630 frames out of a battle'); same(r.inside.bitesOut, 5, 'in a battle, one outside it'); same(r.inside.bitesIn, 10, 'in a battle, one in it');
        same(JSON.stringify(r.inside.clock), JSON.stringify([0.5, 0.5, 1]), 'the clock in a battle: the world\'s, one outside it, one in it'); same(r.outside.clock, 1, 'out of a battle'); same(r.after, 1, 'after RUN');
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
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(2); const on = cardBattleShown(); __run(); __ticks(CARD_BATTLE.easeOut + 2); return [on, cardBattleShown()]; })()`);
        same(r.join(), 'true,false', 'the screen up in the battle, and after it');
    });

    group('THE TURNS (step 3): one card, then the enemies one by one, fastest first; recharge by turns; RUN with a last hit; the cube commands only');
    run(`globalThis.__live = (n) => { for (let i = 0; i < n; i++) _simStep(false); };
        globalThis.__walker = (x, y) => { const e = __ant(x, y); e.moveSpeed = e.baseMoveSpeed = 0.04; return e; };`);
    check('a battle on: your turn first; everyone in it holds still but the cube; the gun holds its fire; the screen says it is your turn', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const T = cardBattleTurnInfo(), h0 = a.health; firePlayerShot(a); __ticks(CARD_BATTLE.every + 1);
            return { who: T && T.who, foe: cardBattleHolds(a), member: cardBattleHolds(followers[0]), me: cardBattleHolds(player), gun: a.health === h0, banner: _cbEls && _cbEls.turn ? _cbEls.turn.textContent : '' }; })()`);
        same(r.who, 'you', 'first'); same(r.foe, true, 'the enemy holds'); same(r.member, true, 'a member holds'); same(r.me, false, 'the cube holds'); same(r.gun, true, 'the gun fired'); same(/YOUR TURN/.test(r.banner), true, 'the banner: ' + r.banner);
    });
    check('a basic card dragged onto an enemy: that follower alone does its attack on it (the game\'s own damage); then each enemy its turn; then yours again', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __walker(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const f = followers[0], h0 = a.health, o = { played: cardBattlePlay(f, 'basic', null, a) }; const T = cardBattleTurnInfo(); o.who = T.who; o.actor = T.actor === f; o.otherHolds = cardBattleHolds(followers[1]);
            const seen = []; let last = ''; for (let i = 0; i < 900; i++) { __live(1); const t = cardBattleTurnInfo(); const k = t ? t.who : cardBattlePhase(); if (k !== last) { seen.push(k); last = k; } if (k === 'you' && seen.length > 1) break; }
            o.seen = seen.join(','); o.hurt = a.health < h0; o.again = cardBattlePlay(followers[1], 'basic', null, a) || cardBattlePhase() !== 'on'; return o; })()`);
        same(r.played, true, 'played'); same(r.who, 'act', 'its turn'); same(r.actor, true, 'the follower'); same(r.otherHolds, true, 'the other member holds');
        same(r.hurt, true, 'the enemy took no damage'); same(/^act,foe,you$/.test(r.seen), true, 'the turns: ' + r.seen); same(r.again, true, 'your turn again');
    });
    check('only on your turn, and only a card that is ready: not during another turn, not a member that is down (§2.22)', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const f = followers[0], g = followers[1]; g.health = 0; g.dead = true; const o = { down: cardBattlePlay(g, 'basic', null, a) }; o.first = cardBattlePlay(f, 'basic', null, a); o.during = cardBattlePlay(f, 'basic', null, a); return o; })()`);
        same(r.down, false, 'a member that is down played'); same(r.first, true, 'played'); same(r.during, false, 'played during its own turn');
    });
    check('the enemies act fastest first, by their own speed (§2.20), each in its own window', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y), b = __ant(player.x + 2.5, player.y + 0.8), c = __ant(player.x + 1.8, player.y - 0.8);
            a.baseMoveSpeed = 0.02; b.baseMoveSpeed = 0.06; c.baseMoveSpeed = 0.04; cardBattleChoose(a); __ticks(1); cardBattlePlay(followers[0], 'basic', null, a);
            const order = []; for (let i = 0; i < 2000; i++) { frame++; cardBattleTick(); const t = cardBattleTurnInfo(); if (t && t.who === 'foe' && t.actor && order[order.length - 1] !== t.actor) { order.push(t.actor); } if (t && t.who === 'you') break; }
            return order.map(x => x === a ? 'a' : x === b ? 'b' : x === c ? 'c' : '?').join(''); })()`);
        same(r, 'bca', 'the order');
    });
    check('a second attack card: that follower does that move (its mode for the turn, then its own back); it then sits out its RECHARGE in turns, and is ready after', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; f.alt = null; const a = __ant(player.x + 1.4, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
            const mv = cardBattleCards(f).find(c => c.kind === 'move'); if (!mv) return { none: true }; const o = { id: mv.id, rech: mv.recharge, played: cardBattlePlay(f, 'move', mv.id, a), mode: f.alt };
            const waits = []; for (let turn = 0; turn < mv.recharge + 2; turn++) { for (let i = 0; i < 2000 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) { frame++; cardBattleTick(); }
                const c = cardBattleCards(f).find(x => x.kind === 'move' && x.id === mv.id); waits.push(c.ready ? 'R' : c.turns); if (c.ready) break; cardBattlePlay(f, 'basic', null, a); }
            o.back = f.alt; o.waits = waits.join(','); return o; })()`);
        same(!!r.none, false, 'no second attack');
        same(r.played, true, 'played'); same(r.mode, r.id, 'its mode for the turn'); same(r.back, null, 'its own mode back');
        same(r.waits, Array.from({ length: r.rech }, (_, i) => r.rech - i).concat(['R']).join(','), 'the turns to wait (' + r.rech + ')');
    });
    check('an Ultimate card: playable with its meter full, it fires it (the meter empties); not before', () => {
        const r = J(`(function(){ __fresh(0); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; spawnFollowerAtCrystal('electric'); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.x = player.x + 0.5; f.y = player.y + 0.5;
            const keepOpen = energyUltOpen; energyUltOpen = () => true;   /* (its Ultimate open, as with its energy filled: js/energy.js) */ const forms = Object.keys(FORM_ULTIMATES); for (const id of forms) { f.evolved = id; if (followerUltimate(f)) break; } partyTick();
            const a = __ant(player.x + 2, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1); if (!followerUltimate(f)) { energyUltOpen = keepOpen; return { none: true }; }
            f.ultimateCharge = 50; const o = { early: cardBattlePlay(f, 'ult', null, a) }; f.ultimateCharge = 100; o.full = cardBattlePlay(f, 'ult', null, a); o.after = f.ultimateCharge; o.form = f.evolved; energyUltOpen = keepOpen; return o; })()`);
        same(!!r.none, false, 'no form with an Ultimate to try'); { same(r.early, false, 'played at 50%'); same(r.full, true, 'played full'); same(r.after < 100, true, 'the meter emptied'); }
    });
    check('RUN on your turn (§2.12, §2.16): each enemy gets its last hit, then you are out; not during another turn', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __walker(player.x + 1.3, player.y), b = __walker(player.x + 1.5, player.y + 0.8); a.health = a.maxHealth = b.health = b.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
            const o = {}; cardBattlePlay(followers[0], 'basic', null, a); o.during = cardBattleRun(); for (let i = 0; i < 2000 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) __live(1);
            const hp0 = followers.reduce((s, f) => s + f.health, 0); o.ran = cardBattleRun(); const T = cardBattleTurnInfo(); o.runTurn = !!(T && T.who === 'foe' && T.run);
            let hits = 0; const by = new Set(); for (let i = 0; i < 1500 && cardBattlePhase() === 'on'; i++) { const t = cardBattleTurnInfo(); if (t && t.actor) by.add(t.actor); __live(1); }
            o.end = cardBattlePhase(); o.both = by.has(a) && by.has(b); o.hurt = followers.reduce((s, f) => s + f.health, 0) < hp0; return o; })()`);
        same(r.during, false, 'RUN during another turn'); same(r.ran, true, 'RUN'); same(r.runTurn, true, 'their last hits'); same(r.both, true, 'each enemy had its turn');
        same(r.hurt, true, 'no last hit landed on the squad'); same(r.end === 'end' || r.end === 'off', true, 'out: ' + r.end);
    });
    check('the drag: the cards carry what they play; the band\'s cards take the press; the screen dims them out of your turn; the hold-still in the follower step and the moves\' cycle; the gun', () => {
        const c = rd('js/cardbattle.js'), h = rd('game.html'), n = rd('js/npc.js'), e = rd('js/evolution.js'), i = rd('js/input.js');
        same(/data-kind="' \+ c\.kind/.test(c) && /addEventListener\("pointerdown", _cbDragStart\)/.test(c) && /findEnemyAtScreen\(p\[0\], p\[1\]\)/.test(c), true, 'the drag');
        same(/#cbScreen \.cb-card \{ pointer-events: auto; touch-action: none; \}/.test(h) && /#cbScreen:not\(\.yours\) \.cb-card/.test(h) && /#cbScreen \.cb-turn/.test(h), true, 'its look');
        same(/function updateNPC\(actor\) \{\n    if \(typeof cardBattleHolds === "function" && cardBattleHolds\(actor\)\) return;/.test(n), true, 'js/npc.js');
        same(/if \(typeof cardBattleHolds === "function" && cardBattleHolds\(f\)\) continue;/.test(e), true, 'js/evolution.js'); same(/function firePlayerShot\(foe\) \{\n    if \(typeof cardBattleTurn === "function" && cardBattleTurn\(\)\) return;/.test(i), true, 'the gun');
    });

    group('EITHER A BATTLE OR NONE (§2.31; the owner: "no intermediary fighting with my squad. It\'s either battle or no battle")');
    check('out of a battle, with the switch on, your squad and your gun fight nothing: a provoked creature beside them is not attacked in the game\'s own frames, and no battle starts; with the switch off they fight it as ever', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 1.6, player.y + 0.4); a.provoked = true; a.state = 'hunt'; a.noBite = true; a.health = a.maxHealth = 1e6;
            const sentries = sentryItems(); for (const it of sentries) it.broken = true; followerProjectiles.length = 0; projectiles.length = 0;   // (the facility's turrets are the world's, not your squad: they fire as ever, §2.28; and the shots an earlier check left in the air go)
            const mine = u => u === player || partyMembers().indexOf(u) >= 0 || (typeof partyClone === 'function' && u === partyClone());   // (you and your squad: a follower holding a room may fight, §2.28)
            let squadHurt = 0; const by = [], _ad = applyDamage; applyDamage = function (t, amt, src) { if (t === a && mine(src)) { squadHurt += amt; by.push(Math.round(amt) + ' from ' + (src === player ? 'you' : 'a squad member (' + (src.element || '') + ')')); } return _ad.apply(this, arguments); };
            const h0 = a.health; __live(300); applyDamage = _ad; const o = { phase: cardBattlePhase(), hurt: squadHurt, by: by.slice(0, 4), gun: targetNearest() === a, picked: partyMembers().some(f => f._nearestEnemy === a) };
            CARD_BATTLE.on = false; __live(300); o.offHurt = h0 - a.health; for (const it of sentries) it.broken = false; return o; })()`);
        same(r.phase, 'off', 'a battle started'); same(r.hurt, 0, 'damage your side dealt it (' + r.by.join('; ') + ')'); same(r.gun, false, 'your gun locked on it'); same(r.picked, false, 'a member of your squad went for it');
        ok(r.offHurt > 0, 'with the switch off, your squad did not fight it');
    });
    check('a creature\'s blow on a follower, or on you, starts the battle and does not land; nor does the rest of that blow on another of yours that frame', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 1.5, player.y);
            const f1 = followers[0], f2 = followers[1], h1 = f1.health, h2 = f2.health; applyDamage(f1, 5, a); applyDamage(f2, 5, a); const o = { phase: cardBattlePhase(), l1: h1 - f1.health, l2: h2 - f2.health };
            cardBattleReset(); player.invuln = 0; const hp = health, b = __ant(player.x + 1.2, player.y + 0.6); o.ret = hurtPlayer(1, 4, b); o.phase2 = cardBattlePhase(); o.you = hp - health; return o; })()`);
        same(JSON.stringify([r.phase, r.l1, r.l2]), JSON.stringify(['on', 0, 0]), 'the battle on, the blow on the first and on the second');
        same(JSON.stringify([r.phase2, r.you, r.ret]), JSON.stringify(['on', 0, false]), 'on you: the battle on, your health, the blow');
    });
    check('out of a battle your squad fires no second attack and no Ultimate (it says ONLY IN A BATTLE), and it still evolves; the enemy card\'s ATTACK starts a battle with that creature', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = partyMembers()[0]; f.evolved = 'jellyram'; f.element = 'core'; f._moltAt = -9999; energyFill(f); f.ultimateCharge = 100;
            const a = __ant(f.x + 1, f.y); a.provoked = true; a.state = 'hunt'; a.noBite = true; a.health = a.maxHealth = 1e6; let wound = 0;
            for (let i = 0; i < 240; i++) { frame++; evolutionTick(); if (f._altWind > 0 || f._altLive) wound++; }
            const o = { wound, ult: followerUltFire(f), charge: f.ultimateCharge, said: cardBattleNoFight(f) };
            o.attack = mixToolAttack(a); o.phase = cardBattlePhase(); o.orders = followers.filter(u => u.attackOrder).length; return o; })()`);
        same(r.wound, 0, 'frames its second attack wound up or was live'); same(JSON.stringify([r.ult, r.charge, r.said]), JSON.stringify([false, 100, true]), 'its Ultimate, its meter, ONLY IN A BATTLE');
        same(JSON.stringify([r.attack, r.phase, r.orders]), JSON.stringify([1, 'on', 0]), 'ATTACK: taken, the battle on, no orders to fight outside one');
    });
    check('a follower holding a room is not your squad: it still fights what is in its room (§2.28), while your squad may not', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); const h = followers[2]; h.post = partyRoomAt(h.x, h.y); partyTick();
            return { holder: cardBattleMayTarget(a, h), squad: cardBattleMayTarget(a, partyMembers().filter(m => m !== h)[0]), holdNo: cardBattleNoFight(h) }; })()`);
        same(JSON.stringify([r.holder, r.squad, r.holdNo]), JSON.stringify([true, false, false]), 'the holder may, the squad may not, the holder is not held back');
    });

    group('THE PIECES');
    check('the page loads js/cardbattle.js (and its boot check); the tap, the hit, the prey, the squad, the gun, the step and the edges ask it; the 3D view\'s camera reads it', () => {
        const html = rd('game.html'), view = rd('view3d/gameview.js') + rd('view3d/gamemap.js');
        ok(/<script src="js\/cardbattle\.js\?v=/.test(html) && /"js\/cardbattle\.js": "CARD_BATTLE"/.test(html), 'the page');
        ok(/cardBattleTap\(ex, ey\)/.test(rd('js/targeting.js')) && /cardBattleMayTarget/.test(rd('js/targeting.js')), 'the tap and the gun');
        ok(/cardBattleHit\(target, source\)/.test(rd('js/helpers.js')), 'the hit'); ok(/cardBattleBars\(p, a\)/.test(rd('js/predator.js')), 'the prey'); ok(/cardBattleMayTarget\(a, actor\)/.test(rd('js/npc.js')), 'the squad');
        ok(/cardBattleTick\(\)/.test(rd('js/game.js')) && /cardBattlePost\(\)/.test(rd('js/game.js')), 'the step and the edges');
        ok(/get battleCam\(\)/.test(view) && /GM\.battleCam/.test(view) && /battling\(\)/.test(view), 'the 3D view');
        ok(/cardBattleHit\(target, source\)\) return;/.test(rd('js/helpers.js')) && /cardBattleHit\(player, source\)\) return false;/.test(rd('js/helpers.js')) && /cardBattleNoFight\(\)\) return;/.test(rd('js/input.js')) && /_noFight/.test(rd('js/evolution.js')) && /cardBattleNoFight\(f\)\) return false;/.test(rd('js/elements.js')) && /cardBattleNoFight\(\) && typeof cardBattleChoose/.test(rd('js/mixtool.js')) && /cardBattleNoFight\(pred\)/.test(rd('js/abilities.js')), 'either a battle or none (§2.31): the blow, the gun, the second attack, the Ultimate, ATTACK, the clone\'s special');
        ok(/cardBattleClock\(\)/.test(rd('js/antraids.js')) && (rd('js/facilityspawn.js').match(/cardBattleClock\(\)/g) || []).length === 3 && /cardBattleClock\(\)/.test(rd('js/crystalpower.js')) && /cardBattleClock\(\)/.test(rd('js/stations.js')) && /cardBattleRest\(this\)/.test(rd('js/predator.js')), 'the countdowns ask the clock (§2.30): the raids, the three spawns, the refill, the turrets, the bites');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
