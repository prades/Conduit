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
            o.squad = partyMembers().map(f => +Math.hypot(f.x - player.x, f.y - player.y).toFixed(1)); o.moved = Math.hypot(player.x - x0, player.y - y0) > 3; o.onSquares = _cb.slots.size > 0 && [..._cb.slots].every(([x, s]) => Math.hypot(x.x - s.x, x.y - s.y) < 1e-6 && facilityRoomAt(s.x, s.y, _fp.F).id === facilityRoomAt(a.x, a.y, _fp.F).id);
            __ticks(CARD_BATTLE.blackHold + 1); o.p3 = cardBattlePhase(); __ticks(CARD_BATTLE.easeIn + 2); const cam = cardBattleCam(); o.k = cam ? +cam.k.toFixed(2) : 0; o.zoom = cam && cam.zoom; o.pitch = cam && cam.pitch > Math.PI / 4;
            return o; })()`);
        same(r.chose, true, 'chose'); same(r.p0, 'walk', 'first'); same(r.walking, true, 'you are not walking towards it'); same(r.p1, 'black', 'after the walk'); same(r.p2, 'black', 'in the black'); ok(r.black > 0.9, 'the black: ' + r.black);
        same(r.moved, true, 'not moved'); same(r.room, true, 'in its room'); same(r.onSquares, true, 'everyone on its square in its room, in the same black (the line-up, §2.31)');
        same(r.p3, 'on', 'then'); same(r.k, 1, 'the camera in'); ok(r.zoom > 1, 'nearer'); same(r.pitch, true, 'nearly top down (over 45°; the owner, 2026-11-17: the tiles nearly square)');
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
            for (let i = 0; i < 200 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) { frame++; cardBattleTick(); }   /* (the turns begun, lined up) */
            const o = { both: cardBattleFoes().length }; a.x = player.x + CARD_BATTLE.leave + 2; __ticks(10);
            o.left = cardBattleFoes().indexOf(a) < 0; o.calm = !a.provoked && a.state === 'wander'; o.bars = cardBattleBars(a, player); o.still = cardBattlePhase();
            b.x = player.x - CARD_BATTLE.leave - 2; b.y = player.y; __ticks(10); o.end = cardBattlePhase(); __ticks(CARD_BATTLE.easeOut + 5); o.cam = cardBattleCam(); o.off = cardBattlePhase();
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
        globalThis.__walker = (x, y) => { const e = __ant(x, y); e.moveSpeed = e.baseMoveSpeed = 0.04; return e; };
        globalThis.__nextTo = (u, t) => { const s = _cb.slots.get(t), o = _cbSq(u), taken = new Set([..._cb.slots.entries()].filter(e => e[0] !== u).map(e => e[1].x + ',' + e[1].y)), c = [];   /* (u onto a free square next to t's, the nearest to u's own: §2.39's "next to") */
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const x = s.x + dx, y = s.y + dy; if ((dx || dy) && !taken.has(x + ',' + y) && _fp.cellsP.has(x + ',' + y) && facilityRoomIdAt(x, y) === _cb.lay.room && facilitySeesFrom(x, y, s.x, s.y)) c.push([Math.hypot(x - o[0], y - o[1]), x, y]); }
            c.sort((p, q) => p[0] - q[0]); if (!c.length) return false; const [, x, y] = c[0]; _cb.slots.set(u, { x, y }); u.x = x; u.y = y; if (Number.isFinite(u.visualX)) { u.visualX = x; u.visualY = y; } return true; };`);
    const CARD_BATTLE_TETHER = J('CARD_BATTLE.tether');
    check('a battle on: your turn first; everyone in it holds still but the cube; the gun holds its fire; the screen says it is your turn', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const T = cardBattleTurnInfo(), h0 = a.health; firePlayerShot(a); __ticks(CARD_BATTLE.every + 1);
            return { who: T && T.who, foe: cardBattleHolds(a), member: cardBattleHolds(followers[0]), me: cardBattleHolds(player), gun: a.health === h0, banner: _cbEls && _cbEls.turn ? _cbEls.turn.textContent : '' }; })()`);
        same(r.who, 'you', 'first'); same(r.foe, true, 'the enemy holds'); same(r.member, true, 'a member holds'); same(r.me, false, 'the cube holds'); same(r.gun, true, 'the gun fired'); same(/YOUR TURN/.test(r.banner), true, 'the banner: ' + r.banner);
    });
    check('a basic card dragged onto an enemy: that follower alone does its attack on it (the game\'s own damage); then each enemy its turn; then yours again', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __walker(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const f = followers[0]; __nextTo(f, a);   /* (next to it: whatever its role, it can hit it from its square, §2.39) */
            const h0 = a.health, o = { played: cardBattlePlay(f, 'basic', null, a) }; const T = cardBattleTurnInfo(); o.who = T.who; o.actor = T.actor === f; o.otherHolds = cardBattleHolds(followers[1]);
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
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; f.alt = null; const a = __ant(player.x + 1.4, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1); __nextTo(f, a);   /* (in its move's reach: §2.39) */
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
        same(r.end === 'end' || r.end === 'off', true, 'out: ' + r.end);   // (whether a last hit lands is the creature's own attack: a scout may call for backup instead, COMBAT.md §9; so not asked here)
    });
    check('the drag: the cards carry what they play; the band\'s cards take the press; the screen dims them out of your turn; the hold-still in the follower step and the moves\' cycle; the gun', () => {
        const c = rd('js/cardbattle.js'), h = rd('game.html'), n = rd('js/npc.js'), e = rd('js/evolution.js'), i = rd('js/input.js');
        same(/data-kind="' \+ c\.kind/.test(c) && /addEventListener\("pointerdown", _cbDragStart\)/.test(c) && /findEnemyAtScreen\(p\[0\], p\[1\]\)/.test(c), true, 'the drag');
        same(/#cbScreen \.cb-card \{ pointer-events: auto; touch-action: none; \}/.test(h) && /#cbScreen:not\(\.yours\) \.cb-card/.test(h) && /#cbScreen \.cb-turn/.test(h), true, 'its look');
        same(/function updateNPC\(actor\) \{\n    if \(typeof cardBattleHolds === "function" && cardBattleHolds\(actor\)\) return;/.test(n), true, 'js/npc.js');
        same(/if \(typeof cardBattleHolds === "function" && cardBattleHolds\(f\)\) continue;/.test(e), true, 'js/evolution.js'); same(/function firePlayerShot\(foe\) \{\n    if \(typeof cardBattleTurn === "function" && cardBattleTurn\(\)\) return;/.test(i), true, 'the gun');
    });

    group('EITHER A BATTLE OR NONE (§2.35; the owner: "no intermediary fighting with my squad. It\'s either battle or no battle")');
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

    group('LINED UP, SIDE ON; THE BATTLE\'S SQUAD (the owner, 2026-11-17)');
    check('the turns begin lined up on squares: your squad on one side, the enemies on the other, each on its own tile, no two in one column across the line; everyone eases there and faces the other side', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2.4, player.y - 0.6), b = __ant(player.x + 3, player.y + 0.7), c = __ant(player.x + 2.2, player.y + 1.4); cardBattleChoose(a); __ticks(1);
            const L = _cb.lay; if (!L) return { none: true }; __ticks(120);
            const along = o => (o.x - L.mx) * L.ux + (o.y - L.my) * L.uy, us = [], keys = new Set(), at = [];
            for (const [o, s] of _cb.slots) { us.push(Math.round(along(s) * 10)); keys.add(s.x + ',' + s.y); at.push(Math.hypot(o.x - s.x, o.y - s.y)); }
            const mine = [...followers.filter(f => _cb.slots.has(f)), player].map(along), theirs = [a, b, c].map(along);
            return { n: _cb.slots.size, tiles: keys.size, cols: new Set(us).size, mineSide: mine.every(u => u < 0), theirSide: theirs.every(u => u > 0), at: Math.max(...at), axis: Math.abs(L.ux) + Math.abs(L.uy), dir: cardBattleCam() && cardBattleCam().dir, ux: L.ux, uy: L.uy, skew: CARD_BATTLE.skew }; })()`);
        same(!!r.none, false, 'no line-up'); same(r.n, 7, 'three of yours, you and three enemies'); same(r.tiles, 7, 'each its own tile'); same(r.cols, 7, 'no two in one column across the line');
        same(r.mineSide, true, 'yours on one side'); same(r.theirSide, true, 'theirs on the other'); ok(r.at < 0.05, 'eased to their squares: ' + r.at); same(r.axis, 1, 'along a direction of the floor');
        { const off = Math.asin(Math.max(-1, Math.min(1, -(Math.cos(r.dir) * r.ux + Math.sin(r.dir) * r.uy)))) * 180 / Math.PI; ok(Math.abs(off - r.skew) < 1e-6, 'the camera looks across the line, turned ' + r.skew + '° towards your side: ' + off); }
    });
    check('the one whose turn it is strikes from its square, next to the enemy (a step off it at most, §2.39: it was the walk up to strike), and is back on it after', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __walker(player.x + 2.4, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1); __live(90);
            const f = followers[0]; __nextTo(f, a); const s = _cb.slots.get(f), h0 = a.health; cardBattlePlay(f, 'basic', null, a); let left = 0;
            for (let i = 0; i < 900 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) { __live(1); const t = cardBattleTurnInfo(); if (t && t.actor === f) left = Math.max(left, Math.hypot(f.x - s.x, f.y - s.y)); }
            __live(60); return { left, back: Math.hypot(f.x - s.x, f.y - s.y), hurt: h0 - a.health, kept: _cb.slots.get(f) === s, role: f.role }; })()`);
        ok(r.left < CARD_BATTLE_TETHER + 0.1, 'it went off its square (' + r.role + '): ' + r.left); ok(r.back < 0.05, 'not back on its square: ' + r.back); ok(r.hurt > 0, 'the enemy not hurt (' + r.role + ')'); same(r.kept, true, 'its square kept');
    });
    check('all your squad down: the battle ends (§2.23), even where the fallen rejoin at once (the Crystal Chamber); one that comes back meanwhile is out of the battle', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const [f, g] = followers; f.health = 0; __ticks(1); f.health = f.maxHealth; const o = { back: cardBattlePlay(f, 'basic', null, a), phase1: cardBattlePhase() };
            g.health = 0; __ticks(2); o.phase2 = cardBattlePhase(); return o; })()`);
        same(r.back, false, 'one back from down played a card'); same(r.phase1, 'on', 'with one still up'); same(r.phase2 === 'end' || r.phase2 === 'off', true, 'all down: ' + r.phase2);
    });
    check('a dragged card shrinks to a floor tile under the finger; the camera\'s turn across the line is the 3D view\'s', () => {
        const c = rd('js/cardbattle.js'), h = rd('game.html'), v = rd('view3d/gameview.js');
        same(/t = _cbTilePx\(\), w = t, h = Math\.round\(t \* 1\.3\)/.test(c) && /requestAnimationFrame\(shrink\)/.test(c), true, 'the shrink');
        same(/#cbScreen \.cb-ghost :is\(\.cb-tag, \.cb-fx, \.cb-rc, \.cb-meter, \.cb-st\) \{ display: none; \}/.test(h), true, 'its look');
        same(/a0 \+ bk \* \(B\.side \? wrapA\(B\.dir - a0\) : acrossTurn\(B\.dir, a0\)\)/.test(v), true, 'view3d/gameview.js');
        same(/Math\.sin\(a\); DIR\.set\(Math\.cos\(elv\) \* ca/.test(v), true, 'the camera\'s direction still set after the battle\'s turn (a comment once swallowed it)');
    });

    check('a battle by a doorway is fought in one room (the owner, 2026-11-17): you and your squad in the next room are brought, in a black, onto squares in the enemies\' room, and you see them', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true;
            let door = null; for (const o of _fp.F.openings || []) if (o && o.rooms && o.rooms.length === 2 && o.a && o.b && !FP_NEST_ROOMS.has(o.rooms[0]) && !FP_NEST_ROOMS.has(o.rooms[1]) && partyRoomCells(o.rooms[0]).length > 30 && partyRoomCells(o.rooms[1]).length > 30) { door = o; break; }
            if (!door) return { none: true };
            const mx = (door.a[0] + door.b[0]) / 2, my = (door.a[1] + door.b[1]) / 2, near = (room, k) => { let b = null, bd = Infinity; for (const c of partyRoomCells(room)) { const d = Math.hypot(c[0] - mx, c[1] - my); if (d < bd && d > k) { bd = d; b = c; } } return b; };
            const mine = near(door.rooms[0], 1.2), theirs = near(door.rooms[1], 1.2); player.x = player.targetX = player.visualX = mine[0]; player.y = player.targetY = player.visualY = mine[1];
            followers.forEach((f, i) => { f.x = mine[0] + 0.1 * i; f.y = mine[1]; }); const a = __ant(theirs[0], theirs[1]);
            const o = { split: facilityRoomIdAt(player.x, player.y) !== facilityRoomIdAt(a.x, a.y), chose: cardBattleChoose(a) };
            let black = false; for (let i = 0; i < 200 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) { frame++; cardBattleTick(); if (cardBattlePhase() === 'black') black = true; }
            const room = facilityRoomIdAt(a.x, a.y); o.black = black; o.who = cardBattleTurnInfo() && cardBattleTurnInfo().who;
            o.allIn = [player].concat(followers).every(x => facilityRoomIdAt(x.x, x.y) === room); o.squares = [..._cb.slots.values()].every(s => facilityRoomIdAt(s.x, s.y) === room); o.seen = facilityShowsActor(a); return o; })()`);
        same(!!r.none, false, 'no doorway to try'); same(r.split, true, 'the setup: you and it in two rooms'); same(r.chose, true, 'chose');
        same(r.black, true, 'the black'); same(r.who, 'you', 'then your turn'); same(r.squares, true, 'every square in its room'); same(r.allIn, true, 'all of yours in its room'); same(r.seen, true, 'it is seen');
    });

    check('the battle seen whole (the owner, 2026-11-17, under the arena\'s observatory): the 3D view makes what stands between a fighter and the camera see-through, a wall\'s or floor\'s tile left out, never a body nor the floor round a fighter; a failure there turns it off and keeps the view; the one-time tip waits', () => {
        const v = rd('view3d/gameview.js'), m = rd('view3d/gamemap.js'), c = rd('view3d/core.js'), ta = rd('js/techabilities.js'), h = rd('game.html'), cb = rd('js/cardbattle.js');
        same(/place\(dt\); seeThrough\(f0\);/.test(v), true, 'called each frame after the camera is placed');
        same(/RC\.layers\.enableAll\(\);/.test(v), true, 'every layer (the world is on 1 to 3)');
        same(/b\.holder\.userData\.body = true;/.test(v) && /if \(p\.userData && p\.userData\.body\) return false;/.test(v), true, 'bodies never');
        same(/!B\.box\.containsPoint\(seeFeet\)/.test(v), true, 'never the floor round a fighter');
        same(/try \{ seeThroughStep\(f0\); \} catch \(e\) \{ seeBroke = true;/.test(v), true, 'a failure turns it off');
        same(/get battleFighters\(\) \{ return typeof cardBattleFighters === "function"/.test(m) && /function cardBattleFighters\(\)/.test(cb), true, 'the fighters reach the view');
        same(/if \(o2 && o2\.copy\) \{ g\.computeBoundingBox\(\); g\.computeBoundingSphere\(\); \}/.test(c), true, 'a merged room\'s bounds kept');
        same(/cardBattlePhase\(\) !== "off"\) return;/.test(ta) && /body\.cb-on #reefTip \{ display: none !important; \}/.test(h), true, 'the one-time tip waits');
    });

    group('A RETICLE ON EVERY ENEMY (§2.37; the owner: "So we need to fix that to where it shows each enemy with one of those")');
    check('in a battle the red corners go round each of its enemies, where the 3D view draws it by its camera as drawn (not placed again); the gun\'s own are not drawn; out of a battle the gun\'s as ever', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y), b = __ant(player.x + 2.6, player.y + 1);
            const pts = [], keep = { moveTo: ctx.moveTo, stroke: ctx.stroke }; let strokes = 0; ctx.moveTo = function (x, y) { pts.push([x, y]); }; ctx.stroke = function () { strokes++; };
            const V0 = VIEW3D.view, S0 = VIEW3D.showing; let placed = 0; const fake = { screenNow: (x, y, h) => [x * 100, y * 100 - (h || 0)], screenOf: () => { placed++; return [0, 0]; }, has: () => true, top: () => 20 };
            const o = {}, at = e => [e.x * 100, e.y * 100 - 10], near = (p, e) => Math.hypot(p[0] - at(e)[0], p[1] - at(e)[1]) < 40;
            try {
                playerAttackMode = true; playerLockTarget = a; o.outBattle = cardBattleReticles(); drawLockReticle(); o.outStrokes = strokes;
                cardBattleChoose(a); __ticks(1); VIEW3D.view = fake; VIEW3D.showing = true; strokes = 0; pts.length = 0;
                o.taken = cardBattleReticles(); o.inStrokes = strokes; o.round = [a, b].map(e => pts.filter(p => near(p, e)).length);
                strokes = 0; pts.length = 0; drawLockReticle(); o.gunStrokes = strokes; o.allOnThem = pts.every(p => near(p, a) || near(p, b)); o.placed = placed; o.aiming = cardBattleAiming();
            } finally { VIEW3D.view = V0; VIEW3D.showing = S0; ctx.moveTo = keep.moveTo; ctx.stroke = keep.stroke; playerAttackMode = false; playerLockTarget = null; }
            cardBattleReset(); o.after = cardBattleAiming(); return o; })()`);
        same(JSON.stringify([r.outBattle, r.outStrokes]), '[false,4]', 'out of a battle: not the battle\'s; the gun\'s four corners');
        same(JSON.stringify([r.taken, r.inStrokes].concat(r.round)), '[true,8,4,4]', 'in it: four corners round each of its two enemies');
        same(JSON.stringify([r.gunStrokes, r.allOnThem, r.placed, r.aiming, r.after]), '[8,true,0,true,false]', 'the gun\'s draw: the battle\'s corners only, all on its enemies; the camera not placed again; aiming in it, not after');
    });

    group('OVER LOW OBJECTS (§2.38; the owner: "ranged attacks can go over objects if, you know, they don\'t exceed a certain height"; "Card battles only")');
    check('in a battle\'s room a shot passes over a low object that gives cover (a crate, a barrel, a desk); a tall one still stops it; out of the battle, or fired from another room, the cover rule as ever', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const F = _fp.F;
            const across = so => { if (so.open || so.shape === 'circle' || !so.bb) return null; const cx = (so.bb[0] + so.bb[2]) / 2, cy = (so.bb[1] + so.bb[3]) / 2, w = so.bb[2] - so.bb[0] + 2.8, h = so.bb[3] - so.bb[1] + 2.8;
                for (const [dx, dy] of [[w / 2, 0], [0, h / 2]]) { const p = [cx - dx, cy - dy], q = [cx + dx, cy + dy], rm = facilityRoomIdAt(p[0], p[1]);
                    if (rm && rm === facilityRoomIdAt(q[0], q[1]) && facilityWalkable(p[0], p[1], F) && facilityWalkable(q[0], q[1], F) && partyRoomCells(rm).length > 20 && facilityShotStop(p[0], p[1], q[0], q[1], p[0], p[1], F)) return { p, q, room: rm, kind: so.kind }; } return null; };
            let L = null, H = null; for (const so of F.solids) { if (!L && so.cover && so.low) L = across(so); if (!H && !so.low && !so.cover) H = across(so); if (L && H) break; }
            if (!L || !H) return { none: [!!L, !!H] };
            const stop = (s, o) => !!facilityShotStop(s.p[0], s.p[1], s.q[0], s.q[1], o[0], o[1], F), other = partyRoomCells(L.room === 'crystal_chamber' ? 'arena' : 'crystal_chamber')[0];
            const o = { low: L.kind, tall: H.kind, before: stop(L, L.p) };
            const c = __cell(L.room, 0.4); player.x = player.targetX = player.visualX = c[0]; player.y = player.targetY = player.visualY = c[1]; const a = __ant(c[0] + 2, c[1]); cardBattleChoose(a); for (let i = 0; i < 200 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) __ticks(1);   /* (your squad brought in, in a black: then the turns) */
            o.room = _cb.lay && _cb.lay.room === L.room; o.inBattle = stop(L, L.p); o.fromOther = stop(L, other); o.tallIn = stop(H, L.p); cardBattleReset(); o.after = stop(L, L.p); return o; })()`);
        same(JSON.stringify(r.none || null), 'null', 'no low cover object or tall one with floor round it to try (found: ' + JSON.stringify(r.none) + ')');
        same(JSON.stringify([r.before, r.room, r.inBattle, r.fromOther, r.tallIn, r.after]), '[true,true,false,true,true,true]', 'a ' + r.low + ' stops it before; the battle in its room; over it in the battle; fired from another room; a ' + r.tall + ' in the battle; after it');
    });

    group('MOVE NOW, ATTACK LATER (§2.39; the owner: "it takes a move to reposition to attack the target, and it\'s based on their speed, how many tiles they can move, up to 3 if their speed is really high")');
    check('the tiles a turn by its lasting pace, 1 to 3: a tank and the Ant Queen 1, a scout and a striker 2, a nymph 3; a quick form\'s own pace counts', () => {
        const r = J(`(function(){ __fresh(0); const t = c => { const e = spawnCreature({ species: 'ant', className: c }); const n = _cbTiles(e); e.dead = true; e.health = 0; return n; };
            return { paces: [0, 0.008, 0.012, 0.016, 0.018, 0.022, 0.023, 0.026, 0.028, 0.032].map(s => _cbTiles({ baseMoveSpeed: s })), ants: ['tank', 'scout', 'striker', 'nymph'].map(t), boss: _cbTiles({ baseMoveSpeed: PREDATOR_TYPES.boss.moveSpeed }),
                plain: _cbTiles({ baseMoveSpeed: 0.02 }), skink: _cbTiles({ baseMoveSpeed: 0.02, evolved: 'electroskink' }), pace: EVOLUTIONS.electroskink.pace }; })()`);
        same(r.paces.join(), '0,1,1,2,2,2,2,3,3,3', 'by pace (0, 0.008, 0.012, 0.016, 0.018, 0.022, 0.023, 0.026, 0.028, 0.032)'); same(r.ants.join(), '1,2,2,3', 'a tank, a scout, a striker, a nymph'); same(r.boss, 1, 'the Ant Queen');
        same(JSON.stringify([r.plain, r.skink]), '[2,3]', 'a pace of 0.02 as itself and as an Electro Skink (its pace ' + r.pace + ')');
    });
    check('a Brawler that cannot hit from its square: its card is a walk instead (the owner: "Automatic"), up to its tiles, onto a free square next to the enemy; the card stays ready, nothing is hurt, the banner says so; that is its square; then the enemies; next turn the card is its attack', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; f.role = 'brawler'; f.moveSpeed = f.baseMoveSpeed = 0.028; f.health = f.maxHealth = 1e5;
            const a = __ant(player.x + 2, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
            const s0 = _cbSq(f), qa = _cbSq(a), h0 = a.health, o = { d0: Math.hypot(s0[0] - qa[0], s0[1] - qa[1]), can0: _cbCanHit(f, a, 'basic'), played: cardBattlePlay(f, 'basic', null, a) };
            const T = cardBattleTurnInfo(); o.walk = T.walk; o.holds = cardBattleHolds(f); __ticks(CARD_BATTLE.every + 1); o.banner = _cbEls && _cbEls.turn ? _cbEls.turn.textContent : '';
            for (let i = 0; i < 600 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) __live(1);
            const s1 = _cbSq(f); o.at = +Math.hypot(f.x - s1[0], f.y - s1[1]).toFixed(3); o.steps = Math.max(Math.abs(s1[0] - s0[0]), Math.abs(s1[1] - s0[1])); o.d1 = +Math.hypot(s1[0] - qa[0], s1[1] - qa[1]).toFixed(2);
            o.hurt = h0 - a.health; o.ready = cardBattleCards(f).find(c => c.kind === 'basic').ready; o.next = cardBattleTurnInfo() && cardBattleTurnInfo().who;
            for (let i = 0; i < 2000 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) __live(1);
            o.can1 = _cbCanHit(f, a, 'basic'); o.played2 = cardBattlePlay(f, 'basic', null, a); o.walk2 = cardBattleTurnInfo() && cardBattleTurnInfo().walk;
            for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) __live(1); o.hurt2 = h0 - a.health; return o; })()`);
        same(JSON.stringify([r.d0, r.can0, r.played]), '[4,false,true]', 'four tiles off, out of its reach, played');
        same(JSON.stringify([r.walk, r.holds]), '[3,true]', 'a walk of its three tiles, the battle walking it'); ok(/MOVES 3 TILES/.test(r.banner), 'the banner: ' + r.banner);
        ok(r.at < 0.01 && r.steps >= 1 && r.steps <= 3 && r.d1 <= 1.5, 'on its new square, next to the enemy (' + r.at + ' off it, ' + r.steps + ' squares from its own, ' + r.d1 + ' from the enemy)');
        same(JSON.stringify([r.hurt, r.ready, r.next]), '[0,true,"foe"]', 'nothing hurt, its card still ready, the enemies\' turn');
        same(JSON.stringify([r.can1, r.played2, r.walk2]), '[true,true,0]', 'next turn: next to it, the card is its attack'); ok(r.hurt2 > 0, 'the enemy not hurt by it');
    });
    check('a Mage hits from its square, near or far, when it sees the enemy: from next to it (no backing off) and from six tiles (no walking in), and is on its square after', () => {
        const r = J(`(function(){ const one = far => { __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; f.role = 'sniper'; f.health = f.maxHealth = 1e5; const a = __ant(player.x + 2, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
                if (far) { const s = _cbSq(a), taken = new Set([..._cb.slots.values()].map(q => q.x + ',' + q.y)), c = partyRoomCells(_cb.lay.room).filter(c => !taken.has(c[0] + ',' + c[1]) && Math.abs(Math.hypot(c[0] - s[0], c[1] - s[1]) - 6) < 0.6 && facilitySeesFrom(c[0], c[1], s[0], s[1]))[0]; if (!c) return null; _cb.slots.set(f, { x: c[0], y: c[1] }); f.x = c[0]; f.y = c[1]; }
                else __nextTo(f, a);
                const s = _cb.slots.get(f), d = Math.hypot(s.x - _cbSq(a)[0], s.y - _cbSq(a)[1]), h0 = a.health, played = cardBattlePlay(f, 'basic', null, a), walk = cardBattleTurnInfo().walk; let left = 0;
                for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) { __live(1); left = Math.max(left, Math.hypot(f.x - s.x, f.y - s.y)); }
                return { d: +d.toFixed(2), played, walk, left: +left.toFixed(2), hurt: h0 - a.health > 0, back: +Math.hypot(f.x - s.x, f.y - s.y).toFixed(2) }; };
            return { near: one(false), far: one(true) }; })()`);
        for (const k of ['near', 'far']) { const o = r[k]; ok(o, 'no square six tiles off in sight to try'); same(JSON.stringify([o.played, o.walk, o.hurt]), '[true,0,true]', k + ' (' + o.d + ' tiles): played, no walk, the enemy hurt'); ok(o.left < 0.3 && o.back < 0.3, k + ': it moved off its square (' + o.left + ', ' + o.back + ')'); }
    });
    check('one that cannot see the enemy from its square (a wall or a tall object in the way) walks to the nearest square it can, the fewest steps', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; f.role = 'sniper'; f.moveSpeed = f.baseMoveSpeed = 0.028; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const s = _cbSq(f), keep = facilitySeesFrom; facilitySeesFrom = function (x0, y0, x1, y1) { return !(Math.round(x0) === s[0] && Math.round(y0) === s[1]) && keep(x0, y0, x1, y1); };   /* (as if a tall object stood between its square and the enemy) */
            let o; try { o = { can: _cbCanHit(f, a, 'basic'), played: cardBattlePlay(f, 'basic', null, a), walk: cardBattleTurnInfo().walk }; } finally { facilitySeesFrom = keep; } return o; })()`);
        same(JSON.stringify([r.can, r.played, r.walk]), '[false,true,1]', 'out of sight from its square; played: a walk of one square');
    });
    check('no way nearer (no pace to walk with, or boxed in): nothing is played, it is still your turn, and the banner says so for a moment (words over the world wait while the battle\'s camera is up)', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; f.role = 'brawler'; f.moveSpeed = f.baseMoveSpeed = 0; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const o = { can: _cbCanHit(f, a, 'basic'), played: cardBattlePlay(f, 'basic', null, a), who: cardBattleTurnInfo().who }; __ticks(CARD_BATTLE.every + 1); o.banner = _cbEls && _cbEls.turn ? _cbEls.turn.textContent : '';
            __ticks(130); o.later = _cbEls && _cbEls.turn ? _cbEls.turn.textContent : ''; return o; })()`);
        same(JSON.stringify([r.can, r.played, r.who]), '[false,false,"you"]', 'out of its reach, not played, your turn still'); ok(/ · NO WAY THROUGH$/.test(r.banner), 'the banner: ' + r.banner); ok(/^YOUR TURN/.test(r.later), 'the banner after: ' + r.later);
    });
    check('the walk keeps to the battle\'s room and the floor, never onto or through the other side\'s squares, no further than its tiles (through its own side\'s it may)', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2.4, player.y - 0.6), b = __ant(player.x + 3, player.y + 0.7), c = __ant(player.x + 2.2, player.y + 1.4); cardBattleChoose(a); __ticks(1);
            const room = _cb.lay.room, theirs = new Set([a, b, c].map(e => _cbSq(e).join())), all = new Set([..._cb.slots.values()].map(q => q.x + ',' + q.y)), bad = [];
            for (const f of followers) { f.role = 'brawler'; for (const t of [a, b, c]) { const w = _cbWalkPath(f, t, 'basic'); if (!w) continue; let p = _cbSq(f);
                if (w.length > _cbTiles(f)) bad.push('too long'); if (all.has(w[w.length - 1].join())) bad.push('ends on a square');
                for (const q of w) { if (theirs.has(q.join())) bad.push('through theirs'); if (facilityRoomIdAt(q[0], q[1]) !== room) bad.push('off the room'); if (Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1])) !== 1 || !_fpEdgeOk(p[0], p[1], q[0], q[1])) bad.push('not a step'); p = q; } } }
            const f = followers[0], s = _cbSq(f); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (dx || dy) { _cb.slots.set({ dead: false, health: 1 }, { x: s[0] + dx, y: s[1] + dy }); }   /* (boxed in by its own side: it may pass, not stop) */
            return { bad: [...new Set(bad)], boxed: !!_cbWalkPath(f, a, 'basic') }; })()`);
        same(r.bad.join('; '), '', 'the walks'); same(r.boxed, true, 'boxed in by its own side, it walks through');
    });
    check('an enemy the same (the owner: "both enemy and ally"): not next to any of yours, its turn is a walk of its tiles towards its prey and it bites nobody; next to one, it bites', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; f.role = 'sniper'; const a = __walker(player.x + 2, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
            const turn = () => { const seen = { walk: 0, hurt: 0 }; cardBattlePlay(f, 'basic', null, a); for (let i = 0; i < 3000 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) { const t = cardBattleTurnInfo(); if (t && t.who === 'foe' && t.actor === a) { if (t.walk) seen.walk = t.walk; if (_cb.turn.hit) seen.hurt = 1; } __live(1); } seen.d = +Math.hypot(_cbSq(a)[0] - _cbSq(f)[0], _cbSq(a)[1] - _cbSq(f)[1]).toFixed(2); return seen; };   /* (hurt: its blow landed, by the battle's own reckoning) */
            const d0 = Math.hypot(_cbSq(a)[0] - _cbSq(f)[0], _cbSq(a)[1] - _cbSq(f)[1]), one = turn(), two = turn(); return { d0, tiles: _cbTiles(a), one, two }; })()`);
        ok(r.d0 > 1.5, 'the setup: it began next to one of yours (' + r.d0 + ')'); ok(r.one.walk >= 1 && r.one.walk <= r.tiles && r.one.hurt === 0, 'its first turn: a walk of ' + r.one.walk + ' (its tiles ' + r.tiles + '), its blow landing: ' + r.one.hurt);
        ok(r.one.d <= 1.5 || r.two.walk >= 1, 'it got no nearer (' + r.one.d + ')'); ok(r.one.d > 1.5 || (r.two.walk === 0 && r.two.hurt > 0), 'next to it, its second turn bit nobody (' + JSON.stringify(r.two) + ')');
    });
    check('a striker\'s LEAP STRIKE ready, one of yours 2 to 4 tiles off: its turn is the leap, not a walk; where it lands is its square ("They jump and create new positioning")', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; f.role = 'sniper'; f.health = f.maxHealth = 1e5;
            const st = spawnCreature({ species: 'ant', className: 'striker', level: 5 }); { const c = _fpNearestCellOpen(player.x + 2, player.y); st.x = c[0]; st.y = c[1]; } st.spawnProtection = 0; st.health = st.maxHealth = 9999; cardBattleChoose(st); __ticks(1);
            const s = _cbSq(st), taken = new Set([..._cb.slots.values()].map(q => q.x + ',' + q.y)), c = partyRoomCells(_cb.lay.room).filter(c => !taken.has(c[0] + ',' + c[1]) && Math.abs(Math.hypot(c[0] - s[0], c[1] - s[1]) - 3) < 0.45 && facilitySeesFrom(c[0], c[1], s[0], s[1]))[0];
            if (!c) return { none: true }; _cb.slots.set(f, { x: c[0], y: c[1] }); f.x = c[0]; f.y = c[1];
            initAbility(st); st.abilityPhase = 'ready'; st.abilityCharge = 100; f.alt = null;
            cardBattlePlay(f, 'basic', null, st); let sp = false, walk = 0, flew = false;
            for (let i = 0; i < 3000 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) { const t = cardBattleTurnInfo(); if (t && t.who === 'foe' && t.actor === st) { if (_cb.turn.sp) sp = true; if (t.walk) walk = t.walk; } if ((st.leapLift || 0) > 5) flew = true; __live(1); }
            __live(40); const s1 = _cbSq(st); return { key: st.abilityKey, sp, walk, flew, moved: +Math.hypot(s1[0] - s[0], s1[1] - s[1]).toFixed(2), byIt: +Math.hypot(s1[0] - c[0], s1[1] - c[1]).toFixed(2), on: +Math.hypot(st.x - s1[0], st.y - s1[1]).toFixed(2) }; })()`);
        same(!!r.none, false, 'no square three tiles off in sight to try'); same(r.key, 'LEAP_STRIKE', 'its special');
        same(JSON.stringify([r.sp, r.walk, r.flew]), '[true,0,true]', 'its turn its special, no walk, it leapt'); ok(r.moved >= 1 && r.byIt <= 1.6, 'its new square by the one it leapt at (' + r.moved + ' from its own, ' + r.byIt + ' from it)'); ok(r.on < 0.3, 'not on its new square: ' + r.on);
    });
    check('on its attack\'s turn one keeps to its square on its own legs (a tether), and a leap or a dash carries it to a new square', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const s = _cbSq(f), T = {}; f.x = s[0]; f.y = s[1]; f.baseMoveSpeed = f.moveSpeed = 0.025; _cbTether(T, f); let far = 0;
            for (let i = 0; i < 120; i++) { f.x += 0.025; _cbTether(T, f); far = Math.max(far, Math.hypot(f.x - s[0], f.y - s[1])); }
            const walked = +far.toFixed(2); _cbResquare(f); const kept = _cbSq(f).join() === s.join();
            f.x += 2.4; _cbTether(T, f); const carried = +Math.hypot(f.x - s[0], f.y - s[1]).toFixed(2); _cbResquare(f); const s2 = _cbSq(f);
            return { walked, kept, carried, moved: s2.join() !== s.join(), near: +Math.hypot(s2[0] - f.x, s2[1] - f.y).toFixed(2) }; })()`);
        ok(r.walked <= CARD_BATTLE_TETHER + 0.03, 'it walked off its square: ' + r.walked); same(r.kept, true, 'a step within the tether keeps its square');
        ok(r.carried > 2, 'the carry was held back: ' + r.carried); same(r.moved, true, 'carried: a new square'); ok(r.near < 1.5, 'its new square far from where it was carried: ' + r.near);
    });

    group('THE FRONT LINE (§2.40; the owner: "the predators typically attack who\'s in front of them ... we can have characters absorb damage in front lines")');
    check('lined up in the formation\'s order, whatever the squad\'s: a Brawler on the front square, then a technician, then a Mage; you behind them all', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const [m, t, b] = followers; m.role = 'sniper'; t.role = 'camper'; b.role = 'brawler'; const a = __ant(player.x + 2.4, player.y); cardBattleChoose(a); __ticks(1);
            const L = _cb.lay, along = u => { const s = _cbSq(u); return (s[0] - L.mx) * L.ux + (s[1] - L.my) * L.uy; };
            return { squad: _cb.squad.map(f => f.role).join(), b: along(b), t: along(t), m: along(m), you: along(player) }; })()`);
        same(r.squad, 'sniper,camper,brawler', 'the setup: the squad\'s own order, the Mage first');
        ok(r.b > r.t && r.t > r.m && r.m > r.you, 'from the middle of the line: the Brawler ' + r.b + ', the technician ' + r.t + ', the Mage ' + r.m + ', you ' + r.you);
    });
    check('a creature goes for the one in front of it, not the one it was after (the Mage that shot it, behind): the Brawler in front, far off or next to it; next to it, its turn is the bite', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const [m, b] = followers; m.role = 'sniper'; b.role = 'brawler'; const a = __walker(player.x + 2.4, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
            a.currentTarget = m; a.lastAttacker = m;   /* (as if the Mage had shot it) */
            const o = { far: _cbFront(a, [m, b, player]) === b }; __nextTo(b, a); o.near = _cbFront(a, [m, b, player]) === b;
            _cbFoesTurn(false); const T = cardBattleTurnInfo(); o.turn = !!T && T.actor === a; o.walk = T ? T.walk : -1; o.prey = a.currentTarget === b ? 'the Brawler' : a.currentTarget === m ? 'the Mage' : 'another'; return o; })()`);
        same(JSON.stringify([r.far, r.near, r.turn, r.walk, r.prey]), '[true,true,true,0,"the Brawler"]', 'in front far off, in front next to it, its turn, no walk, its prey');
    });
    check('one of yours in the way is a wall to it: with the Brawler in front and the Mage behind, its walk goes for the Brawler', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const [m, b] = followers; m.role = 'sniper'; b.role = 'brawler'; const a = __walker(player.x + 2.4, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
            a.currentTarget = m; const d0 = Math.hypot(_cbSq(a)[0] - _cbSq(b)[0], _cbSq(a)[1] - _cbSq(b)[1]); _cbFoesTurn(false); const T = cardBattleTurnInfo(), prey = a.currentTarget === b ? 'the Brawler' : 'the Mage';
            for (let i = 0; i < 300 && cardBattleTurnInfo() && cardBattleTurnInfo().actor === a; i++) { frame++; cardBattleTick(); }
            return { walk: T ? T.walk : 0, prey, d0: +d0.toFixed(2), d1: +Math.hypot(_cbSq(a)[0] - _cbSq(b)[0], _cbSq(a)[1] - _cbSq(b)[1]).toFixed(2) }; })()`);
        same(r.prey, 'the Brawler', 'its prey'); ok(r.walk >= 1 && r.d1 < r.d0, 'it walked ' + r.walk + ' towards the Brawler (' + r.d0 + ' to ' + r.d1 + ')');
    });
    check('a pounce still goes over the front line (the owner: "unless they have some sort of ranged attack or pounce attack"): a striker with its LEAP STRIKE ready, a Brawler next to it and a Mage 3 tiles off, leaps at the Mage', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const [m, b] = followers; m.role = 'sniper'; b.role = 'brawler'; m.health = m.maxHealth = b.health = b.maxHealth = 5000;
            const st = spawnCreature({ species: 'ant', className: 'striker', level: 5 }); { const c = _fpNearestCellOpen(player.x + 2, player.y); st.x = c[0]; st.y = c[1]; } st.spawnProtection = 0; st.health = st.maxHealth = 9999; cardBattleChoose(st); __ticks(1);
            const s = _cbSq(st), taken = new Set([..._cb.slots.values()].map(q => q.x + ',' + q.y)), c = partyRoomCells(_cb.lay.room).filter(c => !taken.has(c[0] + ',' + c[1]) && Math.abs(Math.hypot(c[0] - s[0], c[1] - s[1]) - 3) < 0.45 && facilitySeesFrom(c[0], c[1], s[0], s[1]))[0];
            if (!c) return { none: true }; _cb.slots.set(m, { x: c[0], y: c[1] }); m.x = c[0]; m.y = c[1]; __nextTo(b, st);
            initAbility(st); st.abilityPhase = 'ready'; st.abilityCharge = 100; const front = _cbFront(st, [m, b, player]) === b;
            _cbFoesTurn(false); let picked = null, flew = false; for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().actor === st; i++) { if (st.abilityPhase === 'winding' && !picked) picked = st.strikeTarget === m ? 'the Mage' : st.strikeTarget === b ? 'the Brawler' : 'another'; if ((st.leapLift || 0) > 5) flew = true; __live(1); }
            return { front, picked, flew }; })()`);
        same(!!r.none, false, 'no square three tiles off in sight to try'); same(JSON.stringify([r.front, r.picked, r.flew]), '[true,"the Mage",true]', 'the Brawler in front of it; it leapt, at the Mage');
    });

    group('THE PIECES');
    check('the page loads js/cardbattle.js (and its boot check); the tap, the hit, the prey, the squad, the gun, the step and the edges ask it; the 3D view\'s camera reads it', () => {
        const html = rd('game.html'), view = rd('view3d/gameview.js') + rd('view3d/gamemap.js');
        ok(/<script src="js\/cardbattle\.js\?v=/.test(html) && /"js\/cardbattle\.js": "CARD_BATTLE"/.test(html), 'the page');
        ok(/cardBattleTap\(ex, ey\)/.test(rd('js/targeting.js')) && /cardBattleMayTarget/.test(rd('js/targeting.js')), 'the tap and the gun');
        ok(/cardBattleHit\(target, source\)/.test(rd('js/helpers.js')), 'the hit'); ok(/cardBattleBars\(p, a\)/.test(rd('js/predator.js')), 'the prey'); ok(/cardBattleMayTarget\(a, actor\)/.test(rd('js/npc.js')), 'the squad');
        ok(/cardBattleTick\(\)/.test(rd('js/game.js')) && /cardBattlePost\(\)/.test(rd('js/game.js')), 'the step and the edges');
        ok(/get battleCam\(\)/.test(view) && /GM\.battleCam/.test(view) && /battling\(\)/.test(view), 'the 3D view');
        ok(/cardBattleHit\(target, source\)\) return;/.test(rd('js/helpers.js')) && /cardBattleHit\(player, source\)\) return false;/.test(rd('js/helpers.js')) && /cardBattleNoFight\(\)\) return;/.test(rd('js/input.js')) && /_noFight/.test(rd('js/evolution.js')) && /cardBattleNoFight\(f\)\) return false;/.test(rd('js/elements.js')) && /cardBattleNoFight\(\) && typeof cardBattleChoose/.test(rd('js/mixtool.js')) && /cardBattleNoFight\(pred\)/.test(rd('js/abilities.js')), 'either a battle or none (§2.35): the blow, the gun, the second attack, the Ultimate, ATTACK, the clone\'s special');
        ok(/cardBattleStands\(actor\)/.test(rd('js/npc.js')) && /cardBattleOverLow\(ox, oy\)/.test(rd('js/facility.js')) && /cardBattleReticles\(\)\) return;/.test(rd('js/gunfire.js')) && /cardBattleAiming\(\)\)\) \{ const k = age/.test(rd('js/targeting.js')) && /screenNow\(x, y, hPx\) \{ const v = SCR\.set/.test(rd('view3d/gameview.js')), 'the reticles, the shots over low objects, the moves (§2.37 to §2.39): the gun\'s corners and its locking-on, the 3D view\'s point, the cover rule, the Mage\'s stand');
        ok(/cardBattleClock\(\)/.test(rd('js/antraids.js')) && (rd('js/facilityspawn.js').match(/cardBattleClock\(\)/g) || []).length === 3 && /cardBattleClock\(\)/.test(rd('js/crystalpower.js')) && /cardBattleClock\(\)/.test(rd('js/stations.js')) && /cardBattleRest\(this\)/.test(rd('js/predator.js')), 'the countdowns ask the clock (§2.30): the raids, the three spawns, the refill, the turrets, the bites');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
