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
        globalThis.__fresh = (n) => { CARD_BATTLE.byClass = false; cardBattleReset();   /* (each check of something else, at once; the charge and the cooldown by class have checks of their own) */ actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); frame = 1000;
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
        same(r.a.join(), 'basic:BASIC ATTACK:R,move:WOBBLE SLAM:R:' + r.wob + ',ult:JELLY SHIELDS:R:100,walk:MOVE:R', 'the Jelly Ram\'s (its MOVE card last, §2.56)');
        same(r.b.join(), 'basic:BASIC ATTACK:R,move:ICICLE VOLLEY:R:' + r.icy + ',ult:WHITEOUT:W:40,walk:MOVE:R', 'the Rimestar\'s');
        same(r.egg.join(), 'basic:BASIC ATTACK:R,move:BASH:R:1,walk:MOVE:R', 'an egg\'s (BASH before it evolves)'); same(r.cooling.join(), 'false,2', 'a second attack cooling 2.5 s: 2 turns'); same(r.fx, true, 'the effect lines (the game\'s own)');
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
    check('a basic card dragged onto an enemy: that follower alone does its attack on it (the game\'s own damage); then your other follower its card (the owner, 2026-11-17: each follower attacks); then each enemy its turn; then yours again', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __walker(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const f = followers[0]; __nextTo(f, a);   /* (next to it: whatever its role, it can hit it from its square, §2.39) */
            const h0 = a.health, o = { played: cardBattlePlay(f, 'basic', null, a) }; const T = cardBattleTurnInfo(); o.who = T.who; o.actor = T.actor === f; o.otherHolds = cardBattleHolds(followers[1]);
            const g = followers[1]; let second = false; const seen = []; let last = ''; for (let i = 0; i < 2400; i++) { __live(1); const t = cardBattleTurnInfo(); const k = t ? t.who : cardBattlePhase(); if (k !== last) { seen.push(k); last = k; }
                if (k === 'you' && !second) { o.firstAgain = cardBattlePlay(f, 'basic', null, a); __nextTo(g, a); o.second = second = cardBattlePlay(g, 'basic', null, a); last = 'act'; seen.push('act'); continue; } if (k === 'you' && second) break; }
            o.seen = seen.join(','); o.hurt = a.health < h0; o.again = cardBattlePlay(f, 'basic', null, a) || cardBattlePhase() !== 'on'; return o; })()`);
        same(r.played, true, 'played'); same(r.who, 'act', 'its turn'); same(r.actor, true, 'the follower'); same(r.otherHolds, true, 'the other member holds');
        same(r.firstAgain, false, 'the first played twice in a round'); same(r.second, true, 'the second played');
        same(r.hurt, true, 'the enemy took no damage'); same(/^act,you,act,foe,you$/.test(r.seen), true, 'the turns: ' + r.seen); same(r.again, true, 'your turn again (a new round: the first plays again)');
    });
    check('only on your turn, and only a card that is ready: not during another turn, not a member that is down (§2.22)', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const f = followers[0], g = followers[1]; g.health = 0; g.dead = true; const o = { down: cardBattlePlay(g, 'basic', null, a) }; o.first = cardBattlePlay(f, 'basic', null, a); o.during = cardBattlePlay(f, 'basic', null, a); return o; })()`);
        same(r.down, false, 'a member that is down played'); same(r.first, true, 'played'); same(r.during, false, 'played during its own turn');
    });
    check('the enemies act fastest first, by their own speed (§2.20), each in its own window', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y), b = __ant(player.x + 2.5, player.y + 0.8), c = __ant(player.x + 1.8, player.y - 0.8);
            a.baseMoveSpeed = 0.02; b.baseMoveSpeed = 0.06; c.baseMoveSpeed = 0.04; cardBattleChoose(a); __ticks(1); cardBattlePlay(followers[0], 'basic', null, a);
            const order = []; for (let i = 0; i < 4000; i++) { frame++; cardBattleTick(); const t = cardBattleTurnInfo(); if (t && t.who === 'foe' && t.actor && order[order.length - 1] !== t.actor) { order.push(t.actor); } if (t && t.who === 'you') { if (cardBattlePlay(followers[1], 'basic', null, a)) continue; break; } }
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
        same(/if \(typeof cardBattleHolds === "function" && cardBattleHolds\(f\)\) continue;/.test(e), true, 'js/evolution.js'); same(/function firePlayerShot\(foe\) \{\n    if \(typeof cardBattleTurn === "function" && cardBattleTurn\(\) && !\(typeof cardBattleShooting === "function" && cardBattleShooting\(\)\)\) return;/.test(i), true, 'the gun (it holds its fire in the turns but for the Gunslinger\'s own burst, §2.66)');
    });

    group('EITHER A BATTLE OR NONE (§2.35; the owner: "no intermediary fighting with my squad. It\'s either battle or no battle")');
    check('out of a battle, with the switch on, your squad and your gun fight nothing: a provoked creature beside them is not attacked in the game\'s own frames, and no battle starts; with the switch off they fight it as ever', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 1.6, player.y + 0.4); a.provoked = true; a.state = 'hunt'; a.noBite = true; a.health = a.maxHealth = 1e6;
            const sentries = sentryItems(); for (const it of sentries) it.broken = true; followerProjectiles.length = 0; projectiles.length = 0;   // (the facility's turrets are the world's, not your squad: they fire as ever, §2.28; and the shots an earlier check left in the air go)
            const mine = u => !!u && (u === player || partyMembers().indexOf(u) >= 0 || (typeof partyClone === 'function' && u === partyClone()));   // (you and your squad: a follower holding a room may fight, §2.28; a blow with no source is no one's: with no clone, partyClone() is null too)
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
        same(/b\.holder\.userData\.body = true;/.test(v) && /if \(p\.userData && \(p\.userData\.body \|\| p\.userData\.fx3d\)\) return false;/.test(v), true, 'bodies never');
        same(/!B\.box\.containsPoint\(seeFeet\)/.test(v), true, 'never the floor round a fighter');
        same(/try \{ seeThroughStep\(f0\); \} catch \(e\) \{ seeBroke = true;/.test(v), true, 'a failure turns it off');
        same(/get battleFighters\(\) \{ return typeof cardBattleFighters === "function"/.test(m) && /function cardBattleFighters\(\)/.test(cb), true, 'the fighters reach the view');
        same(/if \(o2 && o2\.copy\) \{ g\.computeBoundingBox\(\); g\.computeBoundingSphere\(\); \}/.test(c), true, 'a merged room\'s bounds kept');
        same(/cardBattlePhase\(\) !== "off"\) return;/.test(ta) && /body\.cb-on #reefTip \{ display: none !important; \}/.test(h), true, 'the one-time tip waits');
    });

    group('A RETICLE ON EVERY ENEMY (§2.37; the owner: "So we need to fix that to where it shows each enemy with one of those")');
    check('in a battle the red corners go round each of its enemies, where the 3D view draws it by its camera as drawn (not placed again); the gun\'s own are not drawn; out of a battle the gun\'s as ever', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y), b = __ant(player.x + 2.6, player.y + 1);
            const pts = [], keep = { moveTo: ctx.moveTo, stroke: ctx.stroke, bar: _cbGroundBar }; let strokes = 0; _cbGroundBar = function () {};   /* (the corners only: the health on the ground has its own check) */ ctx.moveTo = function (x, y) { pts.push([x, y]); }; ctx.stroke = function () { strokes++; };
            const V0 = VIEW3D.view, S0 = VIEW3D.showing; let placed = 0; const fake = { screenNow: (x, y, h) => [x * 100, y * 100 - (h || 0)], screenOf: () => { placed++; return [0, 0]; }, has: () => true, top: () => 20 };
            const o = {}, at = e => [e.x * 100, e.y * 100 - 10], near = (p, e) => Math.hypot(p[0] - at(e)[0], p[1] - at(e)[1]) < 40;
            try {
                playerAttackMode = true; playerLockTarget = a; o.outBattle = cardBattleReticles(); drawLockReticle(); o.outStrokes = strokes;
                cardBattleChoose(a); __ticks(1); VIEW3D.view = fake; VIEW3D.showing = true; strokes = 0; pts.length = 0;
                o.taken = cardBattleReticles(); o.inStrokes = strokes; o.round = [a, b].map(e => pts.filter(p => near(p, e)).length);
                strokes = 0; pts.length = 0; drawLockReticle(); o.gunStrokes = strokes; o.allOnThem = pts.every(p => near(p, a) || near(p, b)); o.placed = placed; o.aiming = cardBattleAiming();
            } finally { VIEW3D.view = V0; VIEW3D.showing = S0; ctx.moveTo = keep.moveTo; ctx.stroke = keep.stroke; _cbGroundBar = keep.bar; playerAttackMode = false; playerLockTarget = null; }
            cardBattleReset(); o.after = cardBattleAiming(); return o; })()`);
        same(JSON.stringify([r.outBattle, r.outStrokes]), '[false,4]', 'out of a battle: not the battle\'s; the gun\'s four corners');
        same(JSON.stringify([r.taken, r.inStrokes].concat(r.round)), '[true,8,4,4]', 'in it: four corners round each of its two enemies');
        same(JSON.stringify([r.gunStrokes, r.allOnThem, r.placed, r.aiming, r.after]), '[8,true,0,true,false]', 'the gun\'s draw: the battle\'s corners only, all on its enemies; the camera not placed again; aiming in it, not after');
    });
    check('ON THE FLOOR IT STANDS ON (the owner, 2026-11-23: "In some card battles, the hit marker or the reticule is not correctly on top of the target whenever it\'s dragged over it"): the 3D view stands a body on its floor\'s own height (the arena\'s is 61 px under the lab\'s), and all a battle lays on the picture asks the view for that height too: an enemy\'s corners, its bar\'s dot, the point a dragged card is measured from, its lit square (flat: its middle\'s height at all four corners), the floor square under a finger (each square at its own height); on the lab\'s ground floor (0) all as before', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y);
            const keep = { lift: facilityLiftPx, bar: _cbGroundBar, drag: _cbDrag, to: typeof toCanvas === 'function' ? toCanvas : undefined }, V0 = VIEW3D.view, S0 = VIEW3D.showing; let asked = [];
            const fake = { screenNow: (x, y, h) => { asked.push([x, y, h, 'now']); return [x * 100, y * 100 - (h || 0)]; }, screenOf: (x, y, h) => { asked.push([x, y, h, 'of']); return [x * 100, y * 100 - (h || 0)]; }, has: () => true, top: () => 20 };
            const hs = () => [...new Set(asked.map(c => c[2]))].sort((p, q) => p - q).join(), o = {};
            try { cardBattleChoose(a); __ticks(1); VIEW3D.view = fake; VIEW3D.showing = true; toCanvas = (x, y) => [x, y];
                for (const L of [0, -61]) { const k = L ? 'low' : 'flat'; facilityLiftPx = () => L; _cbGroundBar = function () {};
                    asked = []; cardBattleReticles(); o[k + 'Corners'] = hs();
                    asked = []; _cbBarGeom(fake, a); o[k + 'Bar'] = hs();
                    asked = []; _cbDrag = { foe: a }; _cbFoeTileDraw(fake); o[k + 'Square'] = asked.length + ':' + hs(); _cbDrag = keep.drag;
                    asked = []; const at = fake.screenOf(a.x, a.y, L + CARD_BATTLE.pickH); asked = []; const got = _cbDragFoe({ clientX: at[0], clientY: at[1] }); o[k + 'Pick'] = (got === a) + ':' + hs(); }
                // a room whose floor is not all one height: each square of it where its own floor is, and a square's corners all at its middle's
                const sq = _cbSq(a), sx = Math.round(sq[0]), sy = Math.round(sq[1]); facilityLiftPx = (x, y) => (x > sx + 0.2 ? -37 : -61);
                asked = []; _cbDrag = { foe: a }; _cbFoeTileDraw(fake); o.slopeSquare = hs(); _cbDrag = keep.drag;
                asked = []; const t = cardShapeTileAt(sx * 100, sy * 100 + 61, fake); o.tile = t ? [t.x - sx, t.y - sy].join() : null; o.tileAsked = asked.filter(c => c[3] === 'of').every(c => c[2] === facilityLiftPx(c[0], c[1]) || c[2] === facilityLiftPx(Math.round(c[0] - 0.5), c[1]) || c[2] === facilityLiftPx(c[0] - 1, c[1])) && asked.length > 4;
                o.lift = [cardBattleLift(sx, sy), cardBattleLift(NaN, 1), cardBattleLift(sx + 1, sy)].join();
            } finally { facilityLiftPx = keep.lift; _cbGroundBar = keep.bar; _cbDrag = keep.drag; VIEW3D.view = V0; VIEW3D.showing = S0; if (keep.to) toCanvas = keep.to; }
            cardBattleReset(); return o; })()`);
        same([r.flatCorners, r.flatBar, r.flatSquare, r.flatPick].join(' | '), '0,20 | 11 | 4:0 | true:30', 'on the lab\'s ground floor: the corners (its feet, its top), the bar\'s dot, the square\'s four corners, the pick (its own height over its feet)');
        same([r.lowCorners, r.lowBar, r.lowSquare, r.lowPick].join(' | '), '-61,-41 | -50 | 4:-61 | true:-31', 'on a floor 61 px lower each is asked 61 px lower: the corners, the bar\'s dot, the square, the pick');
        same(r.slopeSquare, '-61', 'a square on a slope is not flat (its corners were asked at more than one height)'); same(r.tile, '0,0', 'the floor square under a finger, on a floor not all one height'); same(r.tileAsked, true, 'a square of the room was asked at another\'s height'); same(r.lift, '-61,0,-37', 'the floor\'s height at a point (none for no point)');
        const files = ['js/cardbattle.js', 'js/cardshapes.js', 'js/cardults.js'].map(f => [f, rd(f).split('\n').filter(l => !/^\s*\/\//.test(l)).join('\n')]);
        for (const [f, src] of files) { const calls = src.match(/V\.screen(?:Now|Of)\((?:[^()]|\([^()]*\))*\)/g) || []; ok(calls.length > 0, f + ' asks the view nothing'); for (const c of calls) ok(/, (?:L|L \+ [^,]+|_csLift\([^)]*\)|cardBattleLift\([^)]*\)(?: \+ [^,]+)?)\)$/.test(c), f + ' asks the view for a height with no floor in it: ' + c); }
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
    check('the walk keeps to the battle\'s room and the floor, never onto or through a taken square (its own side\'s too: the owner, 2026-11-18, "Make sure that they avoid interactions with their teammates"), no further than its tiles; boxed in by its own side it has no way', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2.4, player.y - 0.6), b = __ant(player.x + 3, player.y + 0.7), c = __ant(player.x + 2.2, player.y + 1.4); cardBattleChoose(a); __ticks(1);
            const room = _cb.lay.room, bad = [];
            for (const f of followers) { f.role = 'brawler'; const all = new Set([..._cb.slots.entries()].filter(e => e[0] !== f).map(e => e[1].x + ',' + e[1].y)); for (const t of [a, b, c]) { const w = _cbWalkPath(f, t, 'basic'); if (!w) continue; let p = _cbSq(f);
                if (w.length > _cbTiles(f)) bad.push('too long'); if (all.has(w[w.length - 1].join())) bad.push('ends on a square');
                for (const q of w) { if (all.has(q.join())) bad.push('through a taken square'); if (facilityRoomIdAt(q[0], q[1]) !== room) bad.push('off the room'); if (Math.max(Math.abs(q[0] - p[0]), Math.abs(q[1] - p[1])) !== 1 || !_fpEdgeOk(p[0], p[1], q[0], q[1])) bad.push('not a step'); p = q; } } }
            const f = followers[0], s = _cbSq(f); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if (dx || dy) { _cb.slots.set({ dead: false, health: 1 }, { x: s[0] + dx, y: s[1] + dy }); }   /* (boxed in by its own side: no way round, none through) */
            return { bad: [...new Set(bad)], boxed: !!_cbWalkPath(f, a, 'basic') }; })()`);
        same(r.bad.join('; '), '', 'the walks'); same(r.boxed, false, 'boxed in by its own side, it walked through');
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

    check('one at a time (the owner, 2026-11-17): the pop-up holds the follower whose turn it is, in the squad\'s order; only its cards play; played, the next one\'s; HEXFIRE\'s card has its picture; the light copy of the art', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
            const [f, g] = _cbSquad(), o = { first: _cbCurrent() === f, outOfTurn: cardBattlePlay(g, 'basic', null, a), inTurn: cardBattlePlay(f, 'basic', null, a) };
            for (let i = 0; i < 900 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) { frame++; cardBattleTick(); } o.next = _cbCurrent() === g;
            const e = { evolved: 'embercowl' }; o.art = _cbArt(e, 'hexfire'); o.none = _cbArt(e, 'fireball'); o.other = _cbArt({ evolved: 'jellyram' }, 'hexfire'); o.chomp = _cbArt({ evolved: 'maw' }, 'chomp'); return o; })()`);
        same(r.first, true, 'the first in the squad\'s order first'); same(r.outOfTurn, false, 'another\'s card played out of its turn'); same(r.inTurn, true, 'its own played');
        same(r.next, true, 'then the next one\'s turn'); ok(/img\/cards\/attack\/embercowl_hexfire\.(webp|png)/.test(r.art || ''), 'HEXFIRE\'s picture: ' + r.art); ok(/img\/cards\/attack\/maw_chomp\.(webp|png)/.test(r.chomp || ''), 'CHOMP\'s picture: ' + r.chomp); same(r.none, null, 'a card with no picture'); same(r.other, null, 'another form\'s HEXFIRE (the picture is the Ember Hood\'s)');
        const c = rd('js/cardbattle.js'), h = rd('game.html'), im = rd('tools/images.js');
        same(/E\.band\.classList\.add\("cb-pop"\); E\.band\.classList\.toggle\("away", away\);/.test(c) && /#cbScreen \.cb-band\.cb-pop\.swap \{ animation: cbSwapIn/.test(h), true, 'the pop-up, away and switching in');
        same(/const LOSSY = p => \/\^img\\\/cards\\\/attack\\\/\/\.test\(p\)/.test(im) && fs.statSync(path.join(ROOT, 'img/cards/attack/embercowl_hexfire.webp')).size < 60000, true, 'the art saved lighter (under 60 KB)');
    });
    check('every evolved form has its approved picture on the card of the attack it shows (22; the owner: "What happened to my attack cards?"), on no other card of its; each file there, its light copy under 60 KB; a two-line name does not cover its tag', () => {
        const r = J(`(function(){ __fresh(1); const f = followers[0], out = {}; for (const k of Object.keys(EVOLUTIONS).filter(k => !EVOLUTIONS[k].legacy)) { f.evolved = k; f.element = EVOLUTIONS[k].element; f.role = EVOLUTIONS[k].role; f._moltAt = -9999; energyFill(f);
            out[k] = cardBattleCards(f).filter(c => c.art).map(c => c.kind + ':' + c.id + ':' + String(c.art).replace(/^.*cards\\/attack\\//, '').replace(/\\.(webp|png).*$/, '')); } return { out, keys: Object.keys(CARD_BATTLE_ART).length }; })()`);
        const WANT = { embercowl: 'hexfire', maw: 'chomp', hammerslug: 'shell_guard', thunderhead: 'static_vortex', quillstone: 'ember_slash', coralcrab: 'stake_ring', voidstar: 'maelstrom', seeper: 'toxic_stomp', igloo: 'skate_charge', rimestar: 'icicle_volley', electroskink: 'zigzag_dash',
            thermite: 'magma_vent', mimic: 'rift_impale', hornshell: 'echo_pulse', staticorb: 'static_rush', gooproxy: 'phase_swap', shrub: 'briar_sweep', sundew: 'sweet_scent', rotshard: 'rotten_decoy', jellyram: 'wobble_slam', blightspider: 'venom_bite', hovershell: 'shock_zap' };
        same(Object.keys(r.out).sort().join(), Object.keys(WANT).sort().join(), 'the evolved forms'); same(r.keys, 23, 'the pictures in the table (the Hammer Slug has two: BLADE ROLL\'s, approved "fine for now" 2026-11-20)');
        for (const k of Object.keys(WANT)) same(JSON.stringify(r.out[k].filter(x => x !== 'move:blade_roll:hammerslug_blade_roll')), JSON.stringify(['move:' + WANT[k] + ':' + k + '_' + WANT[k]]), k + '\'s picture cards');
        ok(r.out.hammerslug.indexOf('move:blade_roll:hammerslug_blade_roll') >= 0 && fs.existsSync(path.join(ROOT, 'img/cards/attack/hammerslug_blade_roll.webp')), 'BLADE ROLL\'s picture');
        const bad = []; for (const k of Object.keys(WANT)) { const b = path.join(ROOT, 'img/cards/attack/' + k + '_' + WANT[k]); if (!fs.existsSync(b + '.png')) bad.push(k + ': no picture'); else if (!fs.existsSync(b + '.webp')) bad.push(k + ': no light copy'); else if (fs.statSync(b + '.webp').size >= 60000) bad.push(k + ': ' + fs.statSync(b + '.webp').size + ' bytes'); }
        same(bad.join(' / '), '', 'pictures missing or heavy');
        const h = rd('game.html'); ok(/#cbScreen \.cb-card\.art \.cb-tag \{ margin-top: auto; \}/.test(h) && !/#cbScreen \.cb-card\.art \.cb-tag \{ bottom: 50px; \}/.test(h), 'a picture card\'s tag sits over its name, whatever the name\'s lines');
    });

    group('TANKS AND THE ENEMIES\' FOCUS (§2.46; the owner: "each creature independently checks their own health for Who Is done the most damage to them"; "Card battles only"; "Don\'t change the damage numbers on any of the roles")');
    run(`globalThis.__tanks = () => { __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const [t, m, b] = followers; t.role = 'camper'; m.role = 'sniper'; b.role = 'brawler'; for (const f of followers) f.health = f.maxHealth = 5000; return { t, m, b }; };`);
    check('the roster\'s TANK ("DAMAGE ABSORPTION"), set on any follower and kept in its save; its tags say TANK; no TAUNT card; out of a battle it fights at the usual reach', () => {
        const r = J(`(function(){ const { t, m, b } = __tanks(); const P = PLAY_STYLES.find(x => x.id === 'tank'); const o = { label: P && P.label, blurb: P && P.blurb, set: ccApplyPlayStyle([m, b], 'tank'), styles: [t.playStyle || 'balanced', m.playStyle, b.playStyle].join() };
            o.saved = /"playStyle":"tank"/.test(JSON.stringify(followerRosterSnapshot())); o.reach = playReach(b); o.tag = ccRow(ccUnits({}).find(u => u === b) || b).playStyle;
            const a = __ant(player.x + 2.4, player.y); cardBattleChoose(a); __ticks(CARD_BATTLE.every + 1); o.cards = cardBattleCards(b).some(c => c.kind === 'taunt'); o.column = _cbTank(b) && !_cbTank(t);
            for (const f of followers) f.playStyle = undefined; return o; })()`);
        same(JSON.stringify([r.label, r.blurb, r.set, r.styles]), '["TANK","DAMAGE ABSORPTION",2,"balanced,tank,tank"]', 'the style, set on a Mage and a Brawler');
        same(JSON.stringify([r.saved, r.reach, r.tag, r.cards, r.column]), '[true,1,"tank",false,true]', 'saved, the usual reach out of a battle, its roster row, no TAUNT card, a tank');
        ok(/r\.playStyle === "tank" \? "TANK"/.test(rd('js/commandcenter.js')) && /f\.playStyle === "tank" \? "TANK"/.test(rd('js/squadfly.js')) && /class="cb-sub">LV ' \+ \(f\.level \|\| 1\) \+ \(_cbTank\(f\) \? " · TANK" : ""\)/.test(rd('js/cardbattle.js')), 'the roster card\'s, the squad bar\'s and the battle column\'s TANK');
    });
    check('no play style changes damage (the owner: "Don\'t change the damage numbers on any of the roles"): a hit by a TANK on its turn deals what the same hit deals when it is BALANCED, CAUTIOUS or RECKLESS', () => {
        const r = J(`(function(){ const { t, m, b } = __tanks(); const a = __ant(player.x + 2.4, player.y); a.health = a.maxHealth = 1e6; cardBattleChoose(a); __ticks(1); __nextTo(t, a); cardBattlePlay(t, 'basic', null, a);
            const hit = ps => { t.playStyle = ps; const h0 = a.health; applyDamage(a, 10, t, null, false, false, DMG_HIT_MAIN); return +(h0 - a.health).toFixed(4); };
            const o = ['tank', undefined, 'defensive', 'aggressive'].map(hit); t.playStyle = undefined; return o; })()`);
        same(new Set(r).size, 1, 'the damage of one hit under each play style: ' + r.join(', '));
    });
    check('each creature goes for whoever has hurt it most (its own tally): the technician\'s one hit on the front ant tops the Brawler\'s blows spread over all three, so the front ant goes for the TANK and the other two for the Brawler; unhurt, the front line', () => {
        const r = J(`(function(){ const { t, m, b } = __tanks(); t.playStyle = 'tank'; const a = __ant(player.x + 2.4, player.y - 0.6), c = __ant(player.x + 3, player.y + 0.7), d = __ant(player.x + 2.2, player.y + 1.4);
            for (const e of [a, c, d]) { e.health = e.maxHealth = 1e6; e.moveSpeed = e.baseMoveSpeed = 0.04; } cardBattleChoose(a); __ticks(1); const all = [t, m, b, player], o = {};   /* (walkers: a test ant has no pace of its own) */
            o.before = [a, c, d].map(e => _cbGrudge(e, all) === null && _cbFront(e, all) !== null);
            cardBattleHurt(a, t, 15); for (const e of [a, c, d]) cardBattleHurt(e, b, 6);   /* (the tank's one heavy hit; the Brawler's spread over all three) */
            const who = e => { const g = _cbGrudge(e, all); return g === t ? 'tank' : g === b ? 'brawler' : g === m ? 'mage' : 'none'; }; o.after = [a, c, d].map(who);
            cardBattleHurt(c, m, 40); o.mage = who(c); _cbFoesTurn(false); let first = null; for (let i = 0; i < 3000 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'foe'; i++) { const T = _cb.turn; if (T.a === a && !first) first = a.currentTarget === t ? 'tank' : 'other'; frame++; cardBattleTick(); }
            o.turn = first; t.playStyle = undefined; return o; })()`);
        same(JSON.stringify(r.before), '[true,true,true]', 'unhurt: no tally, the front line');
        same(r.after.join(), 'tank,brawler,brawler', 'the front ant, the second, the third'); same(r.mage, 'mage', 'the second, hurt more by the Mage after'); same(r.turn, 'tank', 'the front ant on its turn');
    });
    check('a TANK sits out front (the owner: "Sit out front"): a technician set to TANK is lined up on the front square, before the Brawler; then the Mage; you behind them all', () => {
        const r = J(`(function(){ const { t, m, b } = __tanks(); t.playStyle = 'tank'; const a = __ant(player.x + 2.4, player.y); cardBattleChoose(a); __ticks(1);
            const L = _cb.lay, along = u => { const s = _cbSq(u); return (s[0] - L.mx) * L.ux + (s[1] - L.my) * L.uy; }, o = { tank: along(t), brawler: along(b), mage: along(m), you: along(player) }; t.playStyle = undefined; return o; })()`);
        ok(r.tank > r.brawler && r.brawler > r.mage && r.mage > r.you, 'from the middle of the line: the TANK technician ' + r.tank + ', the Brawler ' + r.brawler + ', the Mage ' + r.mage + ', you ' + r.you);
    });
    check('THE OPENING STANCE (§2.53; the owner: "the tank and the aggressive play style should be upfront maybe two spaces"): a TANK and a RECKLESS start side by side two squares ahead of the line, a TANK first; BALANCED in its role\'s place; CAUTIOUS at the back of the squad, before you', () => {
        const r = J(`(function(){ const { t, m, b } = __tanks(); t.playStyle = 'tank'; m.playStyle = 'aggressive'; b.playStyle = 'defensive'; const a = __ant(player.x + 2.4, player.y); cardBattleChoose(a); __ticks(1);
            const L = _cb.lay, along = u => { const s = _cbSq(u); return (s[0] - L.mx) * L.ux + (s[1] - L.my) * L.uy; }, o = { tank: along(t), reckless: along(m), cautious: along(b), you: along(player), gap: CARD_BATTLE.lineGap, up: CARD_BATTLE.upFront, order: _cbFrontFirst([b, m, t]).map(f => f === t ? 'tank' : f === m ? 'reckless' : 'cautious').join() };
            for (const f of [t, m, b]) f.playStyle = undefined; __fresh(3); const B = __tanks(); B.b.playStyle = 'defensive'; const a2 = __ant(player.x + 2.4, player.y); cardBattleChoose(a2); __ticks(1); const L2 = _cb.lay, al = u => { const s = _cbSq(u); return (s[0] - L2.mx) * L2.ux + (s[1] - L2.my) * L2.uy; };
            o.second = { cautiousBrawler: al(B.b), balancedTech: al(B.t), balancedMage: al(B.m), you: al(player) }; B.b.playStyle = undefined; return o; })()`);
        same(JSON.stringify([r.tank, r.reckless]), JSON.stringify([-(r.gap - r.up), -(r.gap - r.up)].map(x => x || 0)), 'the TANK and the RECKLESS Mage, from the middle of the line (side by side, ' + r.up + ' squares ahead of its front at ' + (-r.gap) + ')');
        ok(r.cautious < r.tank && r.you < r.cautious, 'the CAUTIOUS Brawler behind them, you last: ' + JSON.stringify(r)); same(r.order, 'tank,reckless,cautious', 'the order');
        const q = r.second; ok(q.balancedTech > q.balancedMage && q.balancedMage > q.cautiousBrawler && q.cautiousBrawler > q.you, 'a CAUTIOUS Brawler behind the BALANCED technician and Mage, before you: ' + JSON.stringify(q));
    });
    check('one it cannot reach it passes over for the next most (your squad all round the one that hurt it most); the tally is the battle\'s, gone when it ends', () => {
        const r = J(`(function(){ const { t, m, b } = __tanks(); const a = __ant(player.x + 2.4, player.y); cardBattleChoose(a); __ticks(1); __nextTo(b, a); const all = [t, m, b, player];
            cardBattleHurt(a, t, 30); cardBattleHurt(a, b, 10); const o = { top: _cbGrudge(a, all) === t };
            const s = _cbSq(t); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) if ((dx || dy) && ![..._cb.slots.values()].some(q => q.x === s[0] + dx && q.y === s[1] + dy)) _cb.slots.set({ dead: false, health: 1 }, { x: s[0] + dx, y: s[1] + dy });   /* (yours on every square round it) */
            o.next = _cbGrudge(a, all) === b; cardBattleEnd(); o.gone = _cb.grudge.size === 0; cardBattleHurt(a, t, 5); o.outside = _cb.grudge.size === 0; return o; })()`);
        same(JSON.stringify([r.top, r.next, r.gone, r.outside]), '[true,true,true,true]', 'the one that hurt it most, then the next when it cannot reach it, gone at the end, nothing kept out of a battle');
    });

    group('THE PLAY STYLES IN A BATTLE (§2.45; the owner: "Shoots from far", "Into the crowd", "none of them do anything with damage", "CAUTIOUS / RECKLESS")');
    check('the roster calls them CAUTIOUS, BALANCED, RECKLESS and TANK, with their words; the saved ids are kept; the tags say CAUT and RECK', () => {
        const r = J(`PLAY_STYLES.map(p => p.id + ':' + p.label + ':' + p.blurb)`);
        same(r.join('|'), 'defensive:CAUTIOUS:PREFERS TO KEEP ITS DISTANCE|balanced:BALANCED:THE USUAL REACH|aggressive:RECKLESS:MAXIMUM OUTPUT, WHATEVER TOUCHES IT|tank:TANK:DAMAGE ABSORPTION', 'the play styles');
        ok(/"defensive" \? "CAUT" : r\.playStyle === "aggressive" \? "RECK"/.test(rd('js/commandcenter.js')) && /"defensive" \? "CAUT" : f\.playStyle === "aggressive" \? "RECK"/.test(rd('js/squadfly.js')), 'the roster card\'s and the squad bar\'s tags');
    });
    check('CAUTIOUS walks to the farthest square it can hit from (a Mage that cannot see from its own square); BALANCED, the fewest steps', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; f.role = 'sniper'; f.moveSpeed = f.baseMoveSpeed = 0.028; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const s = _cbSq(f), q = _cbSq(a), keep = facilitySeesFrom; facilitySeesFrom = function (x0, y0, x1, y1) { return !(Math.round(x0) === s[0] && Math.round(y0) === s[1]) && keep(x0, y0, x1, y1); };   /* (it cannot see the ant from its own square: it must walk) */
            const end = () => { const w = _cbWalkPath(f, a, 'basic'), e = w[w.length - 1]; return { steps: w.length, d: +Math.hypot(e[0] - q[0], e[1] - q[1]).toFixed(2), sees: _cbHitsFrom(e[0], e[1], f, a, 'basic') }; };
            let o; try { f.playStyle = undefined; const bal = end(); f.playStyle = 'defensive'; const cau = end(); o = { bal, cau }; } finally { facilitySeesFrom = keep; f.playStyle = undefined; } return o; })()`);
        same(JSON.stringify([r.bal.steps, r.bal.sees, r.cau.sees]), '[1,true,true]', 'BALANCED one step; both can hit from where they stop');
        ok(r.cau.d >= r.bal.d + 1, 'CAUTIOUS no farther than BALANCED: ' + r.cau.d + ' (' + r.cau.steps + ' steps) and ' + r.bal.d);
    });
    check('RECKLESS walks to the square next to the most enemies (a Brawler going for the front ant of three): never fewer than BALANCED, more where it can', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; f.role = 'brawler'; f.moveSpeed = f.baseMoveSpeed = 0.028;
            const a = __ant(player.x + 2.4, player.y - 0.6), b = __ant(player.x + 3, player.y + 0.7), c = __ant(player.x + 2.2, player.y + 1.4); cardBattleChoose(a); __ticks(1);
            const q = _cbSq(a), taken = new Set([..._cb.slots.entries()].filter(e => e[0] !== f).map(e => e[1].x + ',' + e[1].y)), tries = [];
            for (const cell of partyRoomCells(_cb.lay.room)) { const dd = Math.max(Math.abs(cell[0] - q[0]), Math.abs(cell[1] - q[1])); if (dd < 2 || dd > 3 || taken.has(cell[0] + ',' + cell[1])) continue;
                _cb.slots.set(f, { x: cell[0], y: cell[1] }); f.x = cell[0]; f.y = cell[1]; if (_cbCanHit(f, a, 'basic')) continue;
                f.playStyle = undefined; const w0 = _cbWalkPath(f, a, 'basic'); f.playStyle = 'aggressive'; const w1 = _cbWalkPath(f, a, 'basic'); f.playStyle = undefined; if (!w0 || !w1) continue;
                const e0 = w0[w0.length - 1], e1 = w1[w1.length - 1]; if (!_cbHitsFrom(e0[0], e0[1], f, a, 'basic') || !_cbHitsFrom(e1[0], e1[1], f, a, 'basic')) continue;
                tries.push([_cbFoesNextTo(e0), _cbFoesNextTo(e1)]); }
            return { n: tries.length, never: tries.every(t => t[1] >= t[0]), better: tries.filter(t => t[1] > t[0]).length }; })()`);
        ok(r.n > 0, 'no start square to try'); same(r.never, true, 'RECKLESS stood next to fewer enemies than BALANCED'); ok(r.better > 0, 'RECKLESS never went into a bigger crowd (' + r.n + ' starts)');
    });

    check('each enemy\'s health, a callout (the owner, 2026-11-18): a raised bar floating up and to the side of it, a line from a dot on the creature to it, its health from the left, its numbers', () => {
        const r = J(`(function(){ const ops = []; let path = [], fs = null; const saved = ctx;
            const fake = { save(){}, restore(){}, beginPath(){ path = []; }, closePath(){}, moveTo(x, y){ path.push(['m', x, y]); }, lineTo(x, y){ path.push(['l', x, y]); }, arc(x, y){ path.push(['a', x, y]); },
                fill(){ ops.push({ op: 'fill', style: this.fillStyle, path: path.slice() }); }, stroke(){ ops.push({ op: 'stroke', path: path.slice() }); }, createLinearGradient(){ return { addColorStop(){}, grad: true }; },
                strokeText(){}, fillText(s){ ops.push({ op: 'text', s }); } };
            ctx = fake; const V = { screenNow: (x, y, h) => [x * 40, y * 30 - h], top: () => 20 };
            try { _cbGroundBar(V, { x: 25, y: 10, health: 30, maxHealth: 60 }); } finally { ctx = saved; }
            const cx = 25 * 40, cy = 10 * 30 - 20 * 0.55, fills = ops.filter(o => o.op === 'fill' && o.path.length === 4), face = fills[1], hp = fills.find(o => o.style && o.style.grad);
            const lineFrom = ops.find(o => o.op === 'stroke' && o.path.length === 3);
            return { lineStarts: lineFrom && Math.hypot(lineFrom.path[0][1] - cx, lineFrom.path[0][2] - cy) < 1e-6, above: face && Math.max(...face.path.map(q => q[2])) < cy - 20,
                aside: face && (Math.min(...face.path.map(q => q[1])) > cx || Math.max(...face.path.map(q => q[1])) < cx), half: hp && +((hp.path[1][1] - hp.path[0][1]) / (face.path[1][1] - face.path[0][1])).toFixed(2), text: (ops.find(o => o.op === 'text') || {}).s }; })()`);
        same(r.lineStarts, true, 'the line starts on the creature'); same(r.above, true, 'the bar above it'); same(r.aside, true, 'to its side'); same(r.half, 0.5, 'half its health, half the bar'); same(r.text, '30/60', 'its numbers');
        same(/if \(V\) _cbGroundBar\(V, a\);/.test(rd('js/cardbattle.js')), true, 'drawn with each enemy\'s corners');
    });

    group('ROUND EVERYONE, NEVER THROUGH (the owner, 2026-11-18: "Whenever creatures have to pass through other creatures for their attack, the game freezes up. Make sure that they avoid interactions with their teammates")');
    run(`/* two of yours on the line to the enemy, f four squares from it and g two, in front of f: a battle of brawlers (f quick) */
        globalThis.__behind = () => { __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const [f, g] = followers; f.role = g.role = 'brawler'; f.health = f.maxHealth = g.health = g.maxHealth = 1e5;
            f.moveSpeed = f.baseMoveSpeed = 0.028; const a = __ant(player.x + 2, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
            const qa = _cbSq(a), L = _cb.lay, sq = k => [qa[0] - L.ux * k, qa[1] - L.uy * k], room = new Set(partyRoomCells(L.room).map(c => c.join())), fs = sq(4), gs = sq(2);
            if (![1, 2, 3, 4].every(k => room.has(sq(k).join()))) return null;
            for (const [u, q] of [[f, fs], [g, gs]]) { _cb.slots.set(u, { x: q[0], y: q[1] }); u.x = q[0]; u.y = q[1]; }
            for (const [u, s] of [..._cb.slots]) if (u !== f && u !== g && u !== a && [1, 2, 3, 4].some(k => sq(k)[0] === s.x && sq(k)[1] === s.y)) { const c = partyRoomCells(L.room).find(c => ![..._cb.slots.values()].some(t => t.x === c[0] && t.y === c[1]) && ![1, 2, 3, 4].some(k => sq(k).join() === c.join())); if (c) { _cb.slots.set(u, { x: c[0], y: c[1] }); u.x = c[0]; u.y = c[1]; } }
            while (_cbCurrent() && _cbCurrent() !== f) _cb.acted.add(_cbCurrent());
            return { f, g, a, sq, gs }; };`);
    check('a follower behind a teammate on its way to the enemy walks round it: no square of its walk is taken, and its turn is over in moments, on its new square (it froze 10 s, held 0.75 tiles short of the square it shared)', () => {
        const r = J(`(function(){ const B = __behind(); if (!B) return null; const { f, g, a, gs } = B, taken = new Set([..._cb.slots.entries()].filter(e => e[0] !== f).map(e => e[1].x + ',' + e[1].y));
            const played = cardBattlePlay(f, 'basic', null, a), w = _cb.turn.walk || []; let n = 0, near = 9;
            for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) { __live(1); n++; near = Math.min(near, Math.hypot(f.x - g.x, f.y - g.y)); }
            const s = _cbSq(f); return { played, steps: w.length, through: w.some(q => taken.has(q.join())), frames: n, at: +Math.hypot(f.x - s[0], f.y - s[1]).toFixed(3), near: +near.toFixed(2) }; })()`);
        ok(r, 'no line of four free squares to try'); same(JSON.stringify([r.played, r.through]), '[true,false]', 'played; its walk through a taken square'); ok(r.steps >= 1, 'no walk');
        ok(r.frames < 150, 'its turn took ' + r.frames + ' frames'); ok(r.at < 0.01, 'not on its square (' + r.at + ' off)'); ok(r.near >= 0.7, 'it came ' + r.near + ' tiles from its teammate');
    });
    check('one walked through a teammate\'s square all the same is not held back by the squad\'s spacing: the walk still ends in moments', () => {
        const r = J(`(function(){ const B = __behind(); if (!B) return null; const { f, a, sq, gs } = B; cardBattlePlay(f, 'basic', null, a); if (!_cb.turn.walk) return { noWalk: true };
            _cb.turn.walk = [sq(3), gs, sq(1)]; let n = 0; for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) { __live(1); n++; }
            const s = _cbSq(f); return { frames: n, on: s[0] === sq(1)[0] && s[1] === sq(1)[1] }; })()`);
        ok(r && !r.noWalk, 'the setup: no walk'); ok(r.frames < 150, 'its walk took ' + r.frames + ' frames (it was held for 600)'); same(r.on, true, 'it did not get to the square past its teammate');
    });
    check('an enemy behind another on its way walks round it too', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0]; f.role = 'sniper'; f.health = f.maxHealth = 1e5; const a = __walker(player.x + 2, player.y), b = __walker(player.x + 3, player.y); a.health = a.maxHealth = b.health = b.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
            const qf = _cbSq(f), L = _cb.lay, sq = k => [qf[0] + L.ux * k, qf[1] + L.uy * k], room = new Set(partyRoomCells(L.room).map(c => c.join()));
            if (![1, 2, 3, 4].every(k => room.has(sq(k).join()))) return null;
            for (const [u, q] of [[b, sq(2)], [a, sq(4)]]) { _cb.slots.set(u, { x: q[0], y: q[1] }); u.x = q[0]; u.y = q[1]; }
            const taken = new Set([..._cb.slots.entries()].filter(e => e[0] !== a).map(e => e[1].x + ',' + e[1].y)), w = _cbWalkPath(a, f, 'basic');
            return { w: !!w, through: !!w && w.some(q => taken.has(q.join())) }; })()`);
        ok(r, 'no line of four free squares to try'); same(JSON.stringify([r.w, r.through]), '[true,false]', 'a walk, through no taken square');
    });

    group('THE TILE ATTACKS (§2.48; the owner: "The shape decides who\'s hit", "From what each attack does now"; of the page of every card\'s shape: "Approve and push the new tile attack")');
    run(`/* a battle of one follower of form 'form' (none: an egg) and enemies at offsets [dx, dy] from its square, every one on a floor square it sees; { f, foes, P } */
        globalThis.__shaped = (form, offs, free) => { __fresh(1); elementEffects.length = 0; followerProjectiles.length = 0; rotDecoys.length = 0; CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const f = followers[0];
            if (form) { f.evolved = form; f.element = EVOLUTIONS[form].element; f.role = EVOLUTIONS[form].role; f._moltAt = -9999; energyFill(f); }
            f.health = f.maxHealth = 1e6;
            const foes = offs.map((o, i) => { const e = __ant(player.x + 2 + i * 0.4, player.y + (i % 2)); e.health = e.maxHealth = 9999; return e; });
            cardBattleChoose(foes[0]); __ticks(1); if (!_cb.lay) return null;
            const room = new Set(partyRoomCells(_cb.lay.room).map(c => c.join())), mid = [_cb.lay.mx, _cb.lay.my], want = offs.concat([[0, 0]], free || []);   /* (free: squares of the floor, in sight, that nobody is put on) */
            const cells = partyRoomCells(_cb.lay.room).slice().sort((p, q) => Math.hypot(p[0] - mid[0], p[1] - mid[1]) - Math.hypot(q[0] - mid[0], q[1] - mid[1]));
            const P = cells.find(c => want.every(o => room.has((c[0] + o[0]) + ',' + (c[1] + o[1])) && facilitySeesFrom(c[0], c[1], c[0] + o[0], c[1] + o[1]))); if (!P) return null;
            const put = (a, x, y) => { _cb.slots.set(a, { x, y }); a.x = x; a.y = y; if (Number.isFinite(a.visualX)) { a.visualX = x; a.visualY = y; } }, used = new Set(want.map(o => (P[0] + o[0]) + ',' + (P[1] + o[1])));
            for (const [a] of [..._cb.slots]) { if (a === f || foes.indexOf(a) >= 0) continue; const c = cells.slice().reverse().find(c => !used.has(c.join())); if (c) { used.add(c.join()); put(a, c[0], c[1]); } }
            put(f, P[0], P[1]); foes.forEach((a, i) => put(a, P[0] + offs[i][0], P[1] + offs[i][1]));
            return { f, foes, P }; };
        /* play a card and run its turn: the damage each enemy took in it */
        globalThis.__card = (f, kind, id, target, foes) => { const h0 = foes.map(a => a.health), played = cardBattlePlay(f, kind, id, target), T = _cb.turn, S = T && T.shape; let n = 0;
            for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) { __live(1); n++; }
            return { played, frames: n, walk: !!(T && T.walk), hit: S ? S.hit.length : -1, eff: S ? S.eff.length : -1, mask: S ? S.mask.map(a => foes.indexOf(a)).sort().join() : '', hurt: foes.map((a, i) => h0[i] - a.health > 0.001 ? 1 : 0).join('') }; };`);
    check('every attack card has its shape, let go where its shape takes it: a blast and the decoy on a floor square, a ring and CAPACITOR DISCHARGE anywhere, the rest on an enemy; an Ultimate has its own (js/cardults.js, §2.64)', () => {
        const r = J(`(function(){ const bad = [], by = { tile: [], any: [], foe: [] };
            for (const k in EVOLUTIONS) { const f = { evolved: k }; const d0 = cardShapeDef(f, 'basic'); if (!d0) bad.push(k + ' basic'); for (const id of evoMoveIds(EVOLUTIONS[k])) { const d = cardShapeDef(f, 'move', id); if (!d || d === CARD_SHAPES._basic && !CARD_SHAPES[id]) bad.push(k + ' ' + id); else if (by[cardShapeAim(d)].indexOf(id) < 0) by[cardShapeAim(d)].push(id); } }
            for (const id of UNEVOLVED_MOVES.moves) if (!CARD_SHAPES[id]) bad.push('egg ' + id);
            return { bad, tile: by.tile.sort().join(), any: by.any.sort().join(), foe: by.foe.sort().join(), ult: (cardShapeDef({ evolved: 'maw' }, 'ult') || {}).kind || null, thunder: cardShapeDef({ evolved: 'thunderhead' }, 'basic').kind, rot: cardShapeDef({ evolved: 'rotshard' }, 'basic').r ? 'splash' : 'one' }; })()`);
        same(r.bad.join('; '), '', 'without a shape of its own');
        same(r.tile, 'hexfire,maelstrom,magma_vent,rotten_decoy,singularity_shot,static_vortex', 'let go on a floor square');
        same(r.any, 'briar_sweep,capacitor_discharge,echo_pulse,eruption,gravity_slam,petal_blaze,seedfall,shell_guard,stake_ring,sweet_scent,toxic_stomp,wobble_slam', 'let go anywhere'); same(r.foe, 'arc_volley,blade_roll,chomp,ember_slash,icicle_volley,phase_swap,quill_burst,rift_impale,shock_zap,skate_charge,static_rush,venom_bite,zigzag_dash', 'on an enemy');
        same(JSON.stringify([r.ult, r.thunder, r.rot]), '["swallow","chain","splash"]', 'an Ultimate (the Frost Maw\'s: it swallows); the Thunderhead\'s CHAIN LIGHTNING; the Rotshard\'s CORRODE SHOT');
    });
    check('the sizes are the attacks\' own (the page\'s): STAKE RING 8 squares, BRIAR SWEEP and GRAVITY SLAM 12, ERUPTION 20, ECHO PULSE 48; MAELSTROM and MAGMA VENT 3×3, HEXFIRE a cross of 5, STATIC VORTEX 21', () => {
        const r = J(`[STAKE_RADIUS, BRIAR_RADIUS, MIMIC_RADIUS, CALDERA_RADIUS, ECHO_RADIUS].map(x => _csDisc(0, 0, x, true).length).concat([MAEL_RADIUS, MAGMA_RADIUS, HALO_RADIUS, VORTEX_RADIUS].map(x => _csDisc(0, 0, x, false).length))`);
        same(r.join(), '8,12,12,20,48,9,9,5,21', 'the squares');
    });
    check('one target: a Brawler\'s everyday hit hurts only the enemy it is dropped on, not the one beside it; a Mage\'s shot only the one it is dropped on, not one in front of it', () => {
        const r = J(`(function(){ const A = __shaped('jellyram', [[1, 0], [1, 1]]), B = A && __card(A.f, 'basic', null, A.foes[0], A.foes), C = __shaped('rimestar', [[2, 0], [4, 0]]), D = C && __card(C.f, 'basic', null, C.foes[1], C.foes); return [B, D]; })()`);
        ok(r[0] && r[1], 'no room to set it up'); same(JSON.stringify([r[0].played, r[0].hurt]), '[true,"10"]', 'the Brawler'); same(JSON.stringify([r[1].played, r[1].hurt]), '[true,"01"]', 'the Mage');
    });
    check('a ring round itself (WOBBLE SLAM, played anywhere): the enemies on its squares are hurt, one a square beyond it is not; with none on them it is not played, the card still ready', () => {
        const r = J(`(function(){ const A = __shaped('jellyram', [[1, 0], [-1, 1], [2, 0]]); if (!A) return null; const o = __card(A.f, 'move', 'wobble_slam', null, A.foes);
            const B = __shaped('jellyram', [[3, 0]]), p = cardBattlePlay(B.f, 'move', 'wobble_slam', null); return { o, empty: [p, _cb.say && _cb.say.text, cardBattleCards(B.f).find(c => c.id === 'wobble_slam').ready] }; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.o.played, r.o.hit, r.o.hurt]), '[true,8,"110"]', 'played, its 8 squares, who was hurt'); same(r.empty[0], false, 'played with nobody in it'); ok(/NO ENEMY IN ITS SQUARES/.test(r.empty[1]) && r.empty[2] === true, 'the banner and the card: ' + JSON.stringify(r.empty));
    });
    check('a chain (SONIC ROLL): its target and the next two each within its hop of the last; one farther off is not hurt', () => {
        const r = J(`(function(){ const A = __shaped('staticorb', [[2, 0], [3, 1], [4, 2], [2, -3]]); return A && __card(A.f, 'move', 'static_rush', A.foes[0], A.foes); })()`);
        ok(r, 'no room'); same(JSON.stringify([r.played, r.mask, r.hurt]), '[true,"0,1,2","1110"]', 'played, its chain, who was hurt');
    });
    check('paths: EMBER SLASH along the line through its target, not the one beside it; ZIGZAG DASH every enemy on its zigzag, not one off it', () => {
        const r = J(`(function(){ const A = __shaped('quillstone', [[1, 0], [3, 0], [2, 1]]), a = A && __card(A.f, 'move', 'ember_slash', A.foes[0], A.foes), B = __shaped('electroskink', [[1, -1], [2, 0], [3, -1], [2, 2]]), b = B && __card(B.f, 'move', 'zigzag_dash', B.foes[1], B.foes); return [a, b]; })()`);
        ok(r[0] && r[1], 'no room'); same(r[0].hurt, '110', 'EMBER SLASH'); same(JSON.stringify([r[1].hit, r[1].hurt]), '[3,"1110"]', 'ZIGZAG DASH (its zigzag stops at a wall)');
    });
    check('ZIGZAG DASH ends on a new square (§2.57; the owner: "they should end up in a different location than when they started it"): the farthest free square of its zigzag; its zigzag all taken, the free square nearest the last it struck; on the floor, and it stays there', () => {
        const r = J(`(function(){ const one = (offs, at) => { const A = __shaped('electroskink', offs); if (!A) return null; const f = A.f, s0 = _cbSq(f).join();
                const taken = new Set([..._cb.slots.entries()].filter(e => e[0] !== f).map(e => e[1].x + ',' + e[1].y)), S = cardShapeFor(f, 'move', 'zigzag_dash', A.foes[at]);
                const want = S.hit.slice().reverse().find(c => !taken.has(c.join()) && c.join() !== s0), last = S.hit[S.hit.length - 1]; cardBattlePlay(f, 'move', 'zigzag_dash', A.foes[at]);
                for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) __live(1); __live(30); const s1 = _cbSq(f);   /* (a moment after its turn: settled on its square) */
                return { s0, s1: s1.join(), want: want ? want.join() : null, fromLast: +Math.hypot(s1[0] - last[0], s1[1] - last[1]).toFixed(2), floor: facilityWalkable(s1[0], s1[1], _fp.F), at: +Math.hypot(f.x - s1[0], f.y - s1[1]).toFixed(3) }; };
            return { open: one([[1, -1], [2, 0]], 1), full: one([[1, -1], [2, 0], [3, -1], [4, 0]], 1) }; })()`);
        for (const k of ['open', 'full']) { const o = r[k]; ok(o, 'no room (' + k + ')'); ok(o.s1 !== o.s0, k + ': it ended where it started, ' + o.s0); same(JSON.stringify([o.floor, o.at < 0.05]), '[true,true]', k + ': on the floor, on its square'); }
        ok(r.open.want, 'the setup: no free square on its zigzag'); same(r.open.s1, r.open.want, 'its new square (the farthest free one of its zigzag)');
        same(r.full.want, null, 'the setup: a free square on its zigzag'); ok(r.full.fromLast <= 2.3, 'its zigzag all taken: by the last it struck (' + r.full.fromLast + ' from its zigzag\'s end)');
    });
    check('a move that carries its follower leaves it where it was carried (SKATE CHARGE: its new square by its dash\'s end, not eased back by its start)', () => {
        const r = J(`(function(){ const A = __shaped('igloo', [[2, 0], [3, 0]]); if (!A) return null; const f = A.f, s0 = _cbSq(f); cardBattlePlay(f, 'move', 'skate_charge', A.foes[0]); const end = [f.x, f.y];
            for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) __live(1); const s1 = _cbSq(f);
            return { moved: +Math.hypot(end[0] - s0[0], end[1] - s0[1]).toFixed(2), fromEnd: +Math.hypot(s1[0] - end[0], s1[1] - end[1]).toFixed(2), fromStart: +Math.hypot(s1[0] - s0[0], s1[1] - s0[1]).toFixed(2) }; })()`);
        ok(r, 'no room'); ok(r.moved >= 3, 'the dash carried it ' + r.moved); ok(r.fromEnd <= 1.5 && r.fromStart >= 2, 'its new square: ' + r.fromEnd + ' from where the dash ended, ' + r.fromStart + ' from where it started');
    });
    check('a fan (ICICLE VOLLEY): each icicle the first enemy on its line; one behind another on the same line is untouched', () => {
        const r = J(`(function(){ const A = __shaped('rimestar', [[3, 0], [5, 0], [4, 1]]); return A && __card(A.f, 'move', 'icicle_volley', A.foes[0], A.foes); })()`);
        ok(r, 'no room'); same(JSON.stringify([r.played, r.hurt]), '[true,"101"]', 'played; who was hurt');
    });
    check('a blast on a floor square (MAELSTROM): it opens on the square it is let go on and hurts only the enemies in its area; it stays 2 enemy turns, biting at the start of each and never between, and closes as your next turn comes', () => {
        const r = J(`(function(){ const A = __shaped('voidstar', [[4, 0], [5, 1], [4, -2]]); if (!A) return null; const bites = () => A.foes.map(a => Math.round((9999 - a.health) * 10));
            cardBattlePlay(A.f, 'move', 'maelstrom', { x: A.P[0] + 4, y: A.P[1], tile: true }); const e = elementEffects.find(e => e.type === 'maelstrom'), o = { at: e ? [e.x - A.P[0], e.y - A.P[1]] : null, cast: bites(), log: [] };
            for (let k = 0; k < 3; k++) { for (let i = 0; i < 3000 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) __live(1); const t0 = bites(); __live(240); o.log.push([t0, JSON.stringify(bites()) === JSON.stringify(t0), elementEffects.indexOf(e) >= 0]); cardBattlePlay(A.f, 'basic', null, A.foes[2]); for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) __live(1); }
            return o; })()`);
        ok(r, 'no room'); same(JSON.stringify(r.at), '[4,0]', 'where it opened'); const one = r.cast[0];
        ok(one > 0 && r.cast[1] === one && r.cast[2] === 0, 'its first bite, as it opens, only on the two in it: ' + JSON.stringify(r.cast));
        same(JSON.stringify(r.log.map(x => [Math.round(x[0][0] / one), x[1], x[2]])), '[[2,true,true],[3,true,false],[3,true,false]]', 'its bites by each of your turns (as it opened and at the first enemy turn: 2; at the second: 3), none while you wait, and there after a wait (after its second enemy turn it closes)');
    });
    check('the draws kept (the owner): SHELL GUARD draws the enemies on its squares, and one it drew comes for it on the enemies\' next turn although another hurt it more; ROTTEN DECOY is set on the square it is let go on, and the enemies near it go for it', () => {
        const r = J(`(function(){ const A = __shaped('hammerslug', [[1, 0], [2, 2], [0, 4]]); if (!A) return null; A.foes[0].moveSpeed = A.foes[0].baseMoveSpeed = 0.04;
            cardBattleHurt(A.foes[0], player, 500); const o = __card(A.f, 'move', 'shell_guard', null, A.foes), prey = []; o.drawn = A.foes.map(a => a._scentBy === A.f ? 1 : 0).join(''); o.braced = A.f._guardUntil > frame;
            for (let i = 0; i < 3000 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'foe'; i++) { const t = _cb.turn; if (t.a === A.foes[0] && !prey.length) prey.push(t.a.currentTarget === A.f ? 'it' : 'another'); __live(1); }
            const B = __shaped('rotshard', [[4, 0], [5, 1]]); for (const a of B.foes) a.moveSpeed = a.baseMoveSpeed = 0.04; cardBattlePlay(B.f, 'move', 'rotten_decoy', { x: B.P[0] + 2, y: B.P[1] + 1, tile: true }); const d = rotDecoys[0], went = [];
            for (let i = 0; i < 3000; i++) { const t = _cb.turn; if (t && t.who === 'foe' && t.a && went.indexOf(t.a) < 0 && t.a.currentTarget === d) went.push(t.a); if (t && t.who === 'you' && i > 30) break; __live(1); }
            return { o, prey: prey[0], decoy: d ? [d.x - B.P[0], d.y - B.P[1]] : null, went: went.length }; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.o.played, r.o.hurt, r.o.drawn, r.o.braced]), '[true,"000","110",true]', 'played, nobody hurt, who was drawn (the third 4 squares off), braced');
        same(r.prey, 'it', 'the one it drew, hurt more by you, went for'); same(JSON.stringify(r.decoy), '[2,1]', 'the decoy set at'); same(r.went, 2, 'the enemies that went for the decoy');
    });
    check('PHASE SWAP: it and the enemy it is let go on change squares, and keep them', () => {
        const r = J(`(function(){ const A = __shaped('gooproxy', [[3, 0]]); if (!A) return null; const a0 = _cbSq(A.f).join(), b0 = _cbSq(A.foes[0]).join(), o = __card(A.f, 'move', 'phase_swap', A.foes[0], A.foes); __live(60);
            return { o, swapped: _cbSq(A.f).join() === b0 && _cbSq(A.foes[0]).join() === a0, at: +Math.hypot(A.f.x - _cbSq(A.f)[0], A.f.y - _cbSq(A.f)[1]).toFixed(2) }; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.o.played, r.o.hurt, r.swapped]), '[true,"1",true]', 'played, the enemy hurt, the squares swapped'); ok(r.at < 0.3, 'it is not on its new square: ' + r.at);
    });
    check('CAPACITOR DISCHARGE (played anywhere): a full release on its chain, from the nearest enemy within its reach; it recharges for a full charge\'s time (4 × 0.75 s: 2 turns)', () => {
        const r = J(`(function(){ const A = __shaped('staticorb', [[1, 0], [3, 0], [5, 0]]); if (!A) return null; const o = __card(A.f, 'move', 'capacitor_discharge', null, A.foes), c = cardBattleCards(A.f).find(c => c.id === 'capacitor_discharge'); return { o, rech: c.recharge, ready: c.ready }; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.o.played, r.o.hurt, r.rech, r.ready]), '[true,"111",2,false]', 'played, who was hurt, its recharge, ready'); ok(r.o.frames < 120, 'its turn took ' + r.o.frames + ' frames');
    });
    check('no number changes (the owner: "Don\'t change the damage numbers"): a shaped hit is the move\'s own blow, the same as out of a battle', () => {
        const r = J(`(function(){ const A = __shaped('jellyram', [[1, 0]]); if (!A) return null; const o = __card(A.f, 'move', 'wobble_slam', null, A.foes), inB = 9999 - A.foes[0].health;
            const x = A.f.x, y = A.f.y, ex = A.foes[0].x, ey = A.foes[0].y; cardBattleReset(); CARD_BATTLE.on = false; A.f.x = x; A.f.y = y; const e = A.foes[0]; e.x = ex; e.y = ey; e.health = e.maxHealth = 9999; e.stunned = 0; A.f._sigAt = -1;
            let fired = false; try { fired = wobbleSlam(A.f); } finally { CARD_BATTLE.on = true; } return { inB: +inB.toFixed(3), out: +(9999 - e.health).toFixed(3), fired }; })()`);
        ok(r && r.fired, 'out of a battle it did not fire'); ok(r.inB > 0 && r.inB === r.out, 'in a battle ' + r.inB + ', out of one ' + r.out);
    });
    check('dragged, a card\'s squares are lit on the floor where the 3D view draws them (a ring round it; a blast\'s area on the square under the finger, the square in gold); over the band, none', () => {
        const r = J(`(function(){ const A = __shaped('jellyram', [[1, 0]]); if (!A) return null; const V = { screenNow: (x, y) => [x * 20, y * 20] }; let fills = 0, gold = 0; const kf = ctx.fill, ks = ctx.stroke;
            ctx.fill = function () { fills++; }; ctx.stroke = function () { if (ctx.strokeStyle === '#ffe733') gold++; };
            try { _cbDrag = { f: A.f, kind: 'move', id: 'wobble_slam', aim: true, col: '#00ccaa' }; cardShapeDraw(V); const ring = fills; fills = 0;
                const B = __shaped('voidstar', [[4, 0]]), T = { x: B.P[0] + 4, y: B.P[1], tile: true }; _cbDrag = { f: B.f, kind: 'move', id: 'maelstrom', aim: T, col: '#cc88ff' }; cardShapeDraw(V); const blast = fills, area = cardShapeFor(B.f, 'move', 'maelstrom', T).hit.length; fills = 0;
                _cbDrag = { f: B.f, kind: 'move', id: 'maelstrom', aim: null }; cardShapeDraw(V); return { ring, blast, area, gold, none: fills }; }
            finally { ctx.fill = kf; ctx.stroke = ks; _cbDrag = null; } })()`);
        ok(r, 'no room'); same(r.ring, 8, 'WOBBLE SLAM\'s squares lit'); ok(r.blast >= 1 && r.blast === r.area, 'MAELSTROM\'s squares lit: ' + r.blast + ' of its ' + r.area); same(r.gold, 1, 'its square in gold'); same(r.none, 0, 'with nothing under the finger');
    });

    check('the numbers (the owner, 2026-11-18): a hit on an enemy in a battle is tagged; its bar shows the health before it until the number lands, then the health after; a hit on one of yours is tagged and cuts no bar; out of a battle nothing is tagged', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); a.health = a.maxHealth = 60; const o = {}; _cbNums.clear(); _cbHp.clear();
            CARD_BATTLE.on = false; applyDamage(a, 5, followers[0]); o.outside = _cbNums.size; CARD_BATTLE.on = true;   /* (no battle: nothing tagged) */
            cardBattleChoose(a); __ticks(1); _cbNums.clear(); _cbHp.clear(); const h0 = a.health;
            applyDamage(a, 7, followers[0]); const n = [..._cbNums.values()].find(x => x.unit === a); o.tagged = !!n && n.foe; o.hp = Math.round(a.health); o.before = Math.round(_cbShown(a).v);
            if (n) _cbNumLand(n); for (let i = 0; i < 40; i++) _cbShown(a); o.after = Math.round(_cbShown(a).v);
            applyDamage(followers[0], 3, a); o.mine = [..._cbNums.values()].some(x => x.unit === followers[0] && !x.foe); o.mineBar = _cbHp.has(followers[0]); o.h0 = Math.round(h0);
            cardBattleReset(); cardBattleNumbers(); o.cleared = _cbNums.size + _cbHp.size; return o; })()`);
        same(r.outside, 0, 'tagged out of a battle'); same(r.tagged, true, 'the hit on the enemy tagged'); same(r.before, r.h0, 'its bar before the number lands: the health before the hit'); same(r.after, r.hp, 'after it lands: the health after');
        same(r.mine, true, 'a hit on one of yours tagged'); same(r.mineBar, false, 'one of yours has no bar to cut'); same(r.cleared, 0, 'the battle over, nothing left');
        same(/if \(typeof cardBattleNumbers === "function" && cardBattleNumbers\(\)\) return;/.test(rd('js/drops.js')) && /cardBattleNumberTag\(floatingTexts\[floatingTexts\.length - 1\], target, dmg\)/.test(rd('js/helpers.js')), true, 'wired: the words drawn by the battle; the hit tagged');
    });

    group('STATUSES IN TURNS, SPLASH IN THE BATTLE (§2.52; the owner: "it\'s calculated within the parameters of the battle and not outside of it"; a status shorter than a turn: "At least one turn")');
    run(`/* your follower's card passed (a test's shortcut to the enemies' turn), then the battle run until your turn again; what happened in it */
        globalThis.__pass = (f) => { _cb.acted.add(f); _cbAfterAct(frame); const o = { lost: [], walks: [] }; let seen = false;
            for (let i = 0; i < 4000; i++) { const T = _cb.turn; if (T && T.who === 'foe') { seen = true; if (T.hit) o.hit = true; if (T.lost && o.lost.indexOf(T.lostWord) < 0) { o.lost.push(T.lostWord); __ticks(CARD_BATTLE.every + 1); o.banner = _cbEls && _cbEls.turn ? _cbEls.turn.textContent : ''; } if (T.walk && o.walks.indexOf(T.a) < 0) o.walks.push(T.a); } if (seen && T && T.who === 'you') break; __live(1); }
            o.walked = o.walks.length; delete o.walks; return o; };`);
    check('statuses hold still while a battle\'s turns run (a stun, a burn, an armour shred, a draw kept as an end time); out of a battle they run down in real time as ever', () => {
        const r = J(`(function(){ const A = __shaped(null, [[4, 0]]); if (!A) return null; const a = A.foes[0]; applyStun(a, 45); applyBurn(a, 1, 180); a.defenseShredded = 240; a._scentBy = A.f; a._scentUntil = frame + 240;
            const h0 = a.health; __live(300); const held = [a.stunned, a.burning, a.defenseShredded, a._scentUntil - frame, +(h0 - a.health).toFixed(3)];
            cardBattleReset(); __live(60); return { held, after: [a.stunned, a.burning, a.defenseShredded] }; })()`);
        ok(r, 'no room'); same(JSON.stringify(r.held), '[45,180,240,240,0]', 'after 5 s of your turn'); same(JSON.stringify(r.after), '[0,120,180]', 'out of the battle, after 1 s');
    });
    check('a stunned creature loses its turn (the banner says so; it bites nobody); a stun shorter than a turn is over when your turn comes (at least one turn)', () => {
        const r = J(`(function(){ const A = __shaped(null, [[1, 0]]); if (!A) return null; const a = A.foes[0]; applyStun(a, 45); const o = __pass(A.f); o.stun = a.stunned; o.hit = !!o.hit; return o; })()`);
        ok(r, 'no room'); same(JSON.stringify(r.lost), '["STUNNED"]', 'its turn'); ok(/STUNNED/.test(r.banner || ''), 'the banner: ' + r.banner); same(JSON.stringify([r.hit, r.stun]), '[false,0]', 'its blow landed; the stun at your turn');
    });
    check('as many turns as its time: a 2.5 s stun costs the creature two turns, then it acts', () => {
        const r = J(`(function(){ const A = __shaped(null, [[1, 0]]); if (!A) return null; const a = A.foes[0]; applyStun(a, 150); return [0, 1, 2].map(() => __pass(A.f).lost.join() || 'acted'); })()`);
        ok(r, 'no room'); same(r.join(' / '), 'STUNNED / STUNNED / acted', 'its three turns');
    });
    check('a glitched creature next to one of yours loses its turn; one that has to walk still walks', () => {
        const r = J(`(function(){ const A = __shaped(null, [[1, 0]]); if (!A) return null; applyGlitch(A.foes[0], 30); const near = __pass(A.f);
            const B = __shaped(null, [[4, 0]]); const b = B.foes[0]; b.moveSpeed = b.baseMoveSpeed = 0.04; applyGlitch(b, 30); const far = __pass(B.f); return { near: near.lost.join(), far: [far.lost.join(), far.walked] }; })()`);
        ok(r, 'no room'); same(r.near, 'GLITCHED', 'next to one of yours'); same(JSON.stringify(r.far), '["",1]', 'four squares off: lost, walked');
    });
    check('a slowed creature (or follower) walks fewer squares: its tiles by its pace times the slow', () => {
        same(J(`[0, 0.6, 0.4].map(k => _cbTiles(k ? { baseMoveSpeed: 0.03, slowed: 60, slowFactor: k } : { baseMoveSpeed: 0.03 }))`).join(), '3,2,1', 'at 0.03 a frame, then slowed to 60% and 40%');
    });
    check('damage over time counts by the turns: a burn bites nothing in your turn, a turn\'s worth (6 ticks) when the enemies\' turn is over and the rest (3) a turn later, 9 in all as out of a battle', () => {
        const r = J(`(function(){ const A = __shaped(null, [[4, 0]]); if (!A) return null; const a = A.foes[0]; const hx = a.health; applyDamage(a, 1, null); const one = hx - a.health;   /* (one tick's damage on it, after its defence) */
            applyBurn(a, 1, 180); const h0 = a.health; __live(200); const d0 = h0 - a.health; __pass(A.f); const d1 = h0 - a.health; __pass(A.f); const d2 = h0 - a.health; return { one, d0, d1, d2 }; })()`);
        ok(r, 'no room'); same(r.d0, 0, 'in your turn'); ok(r.one > 0 && Math.abs(r.d1 - 6 * r.one) < 1e-6 && Math.abs(r.d2 - 9 * r.one) < 1e-6, 'ticks: ' + (r.d1 / r.one) + ', then ' + (r.d2 / r.one) + ' in all (a tick ' + r.one + ')');
    });
    check('SHELL GUARD\'s bracing and its draw last their time in turns (4 s: through 2 enemy turns), then end', () => {
        const r = J(`(function(){ const A = __shaped('hammerslug', [[1, 0]]); if (!A) return null; const a = A.foes[0]; cardBattlePlay(A.f, 'move', 'shell_guard', null); for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) __live(1);
            const at = () => [A.f._guardUntil > frame, a._scentBy === A.f && a._scentUntil > frame]; const o = [at()];
            for (let k = 0; k < 2; k++) { let seen = false; for (let i = 0; i < 4000; i++) { const T = _cb.turn; if (T && T.who === 'you') { if (seen) break; } else seen = true; __live(1); } o.push(at()); _cb.acted.add(A.f); _cbAfterAct(frame); o.push(at()); }
            return o.map(x => x.map(Number).join('')).join(' '); })()`);
        ok(r, 'no room'); same(r, '11 11 11 00 00', 'braced and drawn: in its turn\'s end, your next turn, the enemies\' second turn, your turn after, the enemies\' third');
    });
    check('splash stays in the battle: a field of yours bites no creature outside the battle standing in it; a one-target card\'s ring of fire hurts and burns no enemy beside its follower', () => {
        const r = J(`(function(){ const A = __shaped('halo', [[4, 0], [5, 0]]); if (!A) return null; const T = { x: A.P[0] + 4, y: A.P[1], tile: true }, inB = A.foes[0], out = A.foes[1];
            _cb.foes.splice(_cb.foes.indexOf(out), 1); _cb.slots.delete(out);   /* (one standing in the cross that is not in the battle) */ cardBattlePlay(A.f, 'move', 'hexfire', T); for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) __live(1);
            const o = { inB: +(9999 - inB.health).toFixed(2), out: +(9999 - out.health).toFixed(2), outIn: cardBattleFoes().indexOf(out) >= 0 };
            const B = __shaped('quillstone', [[1, 0], [0, 1]]); B.f.currentWill = 50; const b = B.foes[1]; cardBattlePlay(B.f, 'basic', null, B.foes[0]); for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) __live(1);
            o.target = +(9999 - B.foes[0].health).toFixed(2); o.beside = [+(9999 - b.health).toFixed(2), b.burning || 0]; return o; })()`);
        ok(r, 'no room'); same(r.outIn, false, 'the setup: the one outside joined the battle'); ok(r.inB > 0, 'the battle\'s creature in the field was not bitten'); same(r.out, 0, 'the one outside the battle, in the field, was bitten');
        ok(r.target > 0, 'the target not hurt'); same(JSON.stringify(r.beside), '[0,0]', 'the one beside the follower, off the card (hurt, burning)');
    });
    check('a creature\'s special touches only your battle side: its blow on a follower holding a room outside the battle does not land; on one of your squad it does', () => {
        const r = J(`(function(){ __fresh(3); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const F = partyMembers(), held = F[2]; partyApplyStance([held], 'hold'); const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const sq = F[0]; held.health = held.maxHealth = sq.health = sq.maxHealth = 500; _abHurt(a, held, 20); _abHurt(a, sq, 20); return { held: 500 - held.health, squad: 500 - sq.health, member: partyIsMember(held) }; })()`);
        same(r.member, false, 'the setup: the one holding a room is in the squad'); same(r.held, 0, 'the one holding a room hurt'); ok(r.squad > 0, 'your squad\'s member not hurt');
    });

    check('the enemy\'s square lit (the owner, 2026-11-18): a card dragged over an enemy lights the square it stands on (a pulsing fill and a bright rim, drawn on the floor); over its square counts as over it; back over the cards, nothing lit', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); cardBattleChoose(a); __ticks(1);
            const q = _cbSq(a), fills = []; let path = []; const saved = ctx; const fake = { save(){}, restore(){}, setTransform(){}, beginPath(){ path = []; }, closePath(){}, moveTo(x, y){ path.push([x, y]); }, lineTo(x, y){ path.push([x, y]); }, fill(){ fills.push({ s: this.fillStyle, p: path.slice() }); }, stroke(){} };
            const V = { screenNow: (x, y) => [x * 50, y * 50] }; _cbDrag = { foe: a }; ctx = fake; try { _cbFoeTileDraw(V); } finally { ctx = saved; }
            const sq = fills.find(f => f.s === '#ffe733'), cx = sq ? sq.p.reduce((s, c) => s + c[0], 0) / 4 / 50 : null, cy = sq ? sq.p.reduce((s, c) => s + c[1], 0) / 4 / 50 : null;
            _cbDrag = null; return { lit: !!sq, on: sq && Math.abs(cx - Math.round(q[0])) < 1e-6 && Math.abs(cy - Math.round(q[1])) < 1e-6 }; })()`);
        same(r.lit, true, 'its square lit'); same(r.on, true, 'the square it stands on');
        const c = rd('js/cardbattle.js');
        same(/const foe = _cbDragFoe\(ev\) \|\| _cbFoeOnTileAt\(ev\),/.test(c) && /if \(_cbOverBand\(ev\)\) \{ D\.foe = null; return null; \}/.test(c) && /if \(V\) _cbFoeTileDraw\(V\);/.test(c), true, 'wired: over its square counts; back over the cards nothing; drawn with the battle\'s marks');
        same(/up: h \/ 2 \+ CARD_BATTLE\.dragUp/.test(c), true, 'the dragged card rides above the finger');
    });
    group('THE MOVE CARD (§2.56; the owner: "should have a move option, and you select a tile that you want to move to ... but you drag it just like every other card")');
    check('every follower has a MOVE card, always ready like its basic attack, its reach its tiles by its pace; one with no pace cannot use it', () => {
        const r = J(`(function(){ __fresh(2); const [f, g] = followers; f.moveSpeed = f.baseMoveSpeed = 0.028; g.moveSpeed = g.baseMoveSpeed = 0; const c = cardBattleCards(f).find(x => x.kind === 'walk'), d = cardBattleCards(g).find(x => x.kind === 'walk');
            return { c: c && [c.tag, c.name, c.ready, c.tiles, /3 squares/.test(c.fx)], html: c && /UP TO 3 SQUARES/.test(_cbCardHTML(c)) && /data-kind="walk"/.test(_cbCardHTML(c)), d: d && [d.ready, /NO PACE/.test(_cbCardHTML(d))] }; })()`);
        same(JSON.stringify(r.c), '["MOVE","MOVE",true,3,true]', 'its card (tag, name, ready, tiles, words)'); same(r.html, true, 'drawn with its reach'); same(JSON.stringify(r.d), '[false,true]', 'one with no pace');
    });
    check('let go on a free square in its reach, it walks there round everyone, that is its square and its turn is over; on a taken square or one out of reach nothing is played, the banner says why, the card still ready', () => {
        const r = J(`(function(){ const A = __shaped(null, [[4, 0]]); if (!A) return null; const f = A.f; f.moveSpeed = f.baseMoveSpeed = 0.028; const n = _cbTiles(f), sq = cardBattleWalkSquares(f), P = A.P, o = { n, count: sq.length };
            const say = () => (_cb.say && _cb.say.text || '').replace(/^.* · /, '');
            o.taken = [cardBattlePlay(f, 'walk', null, { x: P[0] + 4, y: P[1], tile: true }), say()];
            const far = partyRoomCells(_cb.lay.room).find(c => Math.max(Math.abs(c[0] - P[0]), Math.abs(c[1] - P[1])) > n + 1 && ![..._cb.slots.values()].some(s => s.x === c[0] && s.y === c[1]));
            o.far = far ? [cardBattlePlay(f, 'walk', null, { x: far[0], y: far[1], tile: true }), say()] : null; o.ready = cardBattleCards(f).find(c => c.kind === 'walk').ready;
            const to = sq.slice().sort((p, q) => Math.hypot(q[0] - P[0], q[1] - P[1]) - Math.hypot(p[0] - P[0], p[1] - P[1]))[0], taken = new Set([..._cb.slots.entries()].filter(e => e[0] !== f).map(e => e[1].x + ',' + e[1].y));
            const round0 = _cb.round; o.played = cardBattlePlay(f, 'walk', null, { x: to[0], y: to[1], tile: true }); const w = _cb.turn.walk || []; o.steps = w.length; o.through = w.some(q => taken.has(q.join())); let k = 0;
            for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) { __live(1); k++; }
            const s = _cbSq(f); o.on = s[0] === to[0] && s[1] === to[1]; o.at = +Math.hypot(f.x - s[0], f.y - s[1]).toFixed(3); o.frames = k; o.acted = _cb.acted.has(f) || _cb.round > round0;   /* (its turn had: marked, or the round over already) */ o.next = cardBattleTurnInfo() && cardBattleTurnInfo().who; return o; })()`);
        ok(r, 'no room'); ok(r.n === 3 && r.count > 8, 'its reach: ' + r.n + ' tiles, ' + r.count + ' squares');
        same(JSON.stringify(r.taken), '[false,"THAT SQUARE IS TAKEN"]', 'on the enemy\'s square'); ok(r.far, 'no square out of reach to try'); same(JSON.stringify(r.far), '[false,"OUT OF ITS REACH"]', 'out of its reach'); same(r.ready, true, 'the card after the refusals');
        same(JSON.stringify([r.played, r.through, r.on, r.acted]), '[true,false,true,true]', 'played; through a taken square; on its new square; its turn had'); ok(r.steps >= 1 && r.steps <= r.n && r.at < 0.01 && r.frames < 150, 'the walk: ' + JSON.stringify(r));
    });
    check('dragged, it lights every square the follower can reach and the one under the finger in gold; in red when it cannot go there', () => {
        const r = J(`(function(){ const A = __shaped(null, [[4, 0]]); if (!A) return null; const f = A.f; f.moveSpeed = f.baseMoveSpeed = 0.028; const sq = cardBattleWalkSquares(f), V = { screenNow: (x, y) => [x * 20, y * 20] };
            let fills = 0; const strokes = []; const kf = ctx.fill, ks = ctx.stroke; ctx.fill = function () { fills++; }; ctx.stroke = function () { strokes.push(ctx.strokeStyle); };
            try { _cbDrag = { f, kind: 'walk', aim: { x: sq[0][0], y: sq[0][1], tile: true }, col: '#19e6c1' }; cardShapeDraw(V); const ok = { fills, gold: strokes.filter(c => c === '#ffe733').length };
                fills = 0; strokes.length = 0; _cbDrag = { f, kind: 'walk', aim: { x: A.P[0] + 4, y: A.P[1], tile: true }, col: '#19e6c1' }; cardShapeDraw(V); const no = { fills, red: strokes.filter(c => c === '#ff4a3a').length };
                return { n: sq.length, ok, no }; } finally { ctx.fill = kf; ctx.stroke = ks; _cbDrag = null; } })()`);
        ok(r, 'no room'); same(JSON.stringify([r.ok.fills, r.ok.gold]), JSON.stringify([r.n + 1, 1]), 'its reach lit and its square in gold'); same(JSON.stringify([r.no.fills, r.no.red]), JSON.stringify([r.n, 1]), 'on a taken square: its reach, the square in red');
    });

    group('CHARGE AND COOL DOWN, BY CLASS (the owner, 2026-11-18): a Mage charges both its cards, a Brawler acts at once and cools down, a Technician charges its second attack and cools it down; an Ultimate at once');
    run(`globalThis.__one = (role) => { __fresh(1); CARD_BATTLE.byClass = true; const f = followers[0]; f.role = role; f.health = f.maxHealth = 1e5; const a = __ant(player.x + 2, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1); __nextTo(f, a); return { f, a }; };
        globalThis.__toYou = () => { for (let i = 0; i < 3000 && !(cardBattleTurnInfo() && cardBattleTurnInfo().who === 'you'); i++) { frame++; cardBattleTick(); } };`);
    check('a Mage: its basic card charges (its turn passes, CHARGING) and fires on its own at its next turn; its card reads CHARGE 1 TURN', () => {
        const r = J(`(function(){ const { f, a } = __one('sniper'); const c0 = cardBattleCards(f).find(c => c.kind === 'basic'); const o = { label: c0.chargeT, played: cardBattlePlay(f, 'basic', null, a) };
            o.charging = _cb.charge.has(f); o.left = _cb.charge.get(f) && _cb.charge.get(f).left; const T = cardBattleTurnInfo(); o.after = T && T.who; o.actedNow = !(T && T.who === 'act' && T.actor === f);
            __toYou(); for (let i = 0; i < 5; i++) { frame++; cardBattleTick(); } const T2 = cardBattleTurnInfo(); o.fired = !!T2 && T2.who === 'act' && T2.actor === f && T2.kind === 'basic'; o.gone = !_cb.charge.has(f); return o; })()`);
        same(r.label, 1, 'its card: CHARGE 1 TURN'); same(r.played, true, 'played'); same(r.charging, true, 'charging'); same(r.left, 1, 'one turn to charge'); same(r.actedNow, true, 'it struck at once');
        same(r.fired, true, 'it fired on its own at its next turn'); same(r.gone, true, 'its charge spent');
    });
    check('a Mage\'s second attack charges by its wait time and does not cool down after', () => {
        const r = J(`(function(){ const { f, a } = __one('sniper'); const mv = cardBattleCards(f).find(c => c.kind === 'move'); if (!mv) return { none: true };
            return { charge: mv.chargeT, want: _cbTurns(MOVES[mv.id].windup), recharge: mv.recharge, cools: _cbCools(f, 'move') }; })()`);
        same(!!r.none, false, 'no second attack'); same(r.charge, r.want, 'its charge from its wait time'); same(r.recharge, 0, 'no recharge shown'); same(r.cools, false, 'it cools down');
    });
    check('a Brawler acts at once, its second attack then cools down; a Technician\'s basic at once, its second attack charges and cools down; an Ultimate charges for no one', () => {
        const r = J(`(function(){ const o = {};
            { const { f, a } = __one('brawler'); o.bBasic = _cbChargeTurns(f, 'basic'); const mv = cardBattleCards(f).find(c => c.kind === 'move'); o.bMove = mv ? _cbChargeTurns(f, 'move', mv.id) : null; o.bCools = _cbCools(f, 'move'); o.bPlayed = cardBattlePlay(f, 'basic', null, a); o.bNow = cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; }
            { const { f } = __one('camper'); o.tBasic = _cbChargeTurns(f, 'basic'); const mv = cardBattleCards(f).find(c => c.kind === 'move'); o.tMove = mv ? _cbChargeTurns(f, 'move', mv.id) : null; o.tCools = _cbCools(f, 'move'); o.tLabel = mv ? _cbCardHTML(mv) : ''; }
            { const { f } = __one('sniper'); o.ult = _cbChargeTurns(f, 'ult'); }
            return o; })()`);
        same(JSON.stringify([r.bBasic, r.bMove, r.bCools, r.bPlayed, r.bNow]), '[0,0,true,true,true]', 'the Brawler: at once, its second attack cooling, its basic played at once');
        same(JSON.stringify([r.tBasic, r.tMove > 0, r.tCools]), '[0,true,true]', 'the Technician: its basic at once, its second attack charging and cooling');
        ok(/CHARGE \d+ TURNS? · RECHARGE \d+ TURNS?/.test(r.tLabel), 'its card reads both: ' + (r.tLabel.match(/cb-rc">([^<]*)/) || [])[1]);
        same(r.ult, 0, 'an Ultimate charges');
    });

    check('a kill in a battle (the owner, 2026-11-18): a large +N XP rises from where the creature fell, once, what the kill paid; no panel, nothing to tap; a faint is the view\'s', () => {
        const r = J(`(function(){ __fresh(2); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y), b = __ant(player.x + 2.6, player.y + 1); b.health = b.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
            floatingTexts.length = 0; const want = killXp(a), ax = a.x, ay = a.y; a.lastAttacker = followers[0]; applyDamage(a, 99999, followers[0]); __ticks(2);
            const big = floatingTexts.filter(t => t._cbBig); const o = { n: big.length, text: big[0] && big[0].text, want: '+' + want + ' XP', size: big[0] && big[0].size, at: big[0] && Math.hypot(big[0].x - ax, big[0].y - ay) < 1e-6, on: cardBattlePhase() };
            __ticks(20); o.once = floatingTexts.filter(t => t._cbBig).length; return o; })()`);
        same(r.n, 1, 'one text for the kill'); same(r.text, r.want, 'what the kill paid'); ok(r.size >= 26, 'large: ' + r.size); same(r.at, true, 'from where it fell'); same(r.on, 'on', 'the battle goes on with the other'); same(r.once, 1, 'said once');
        const v = rd('view3d/gameview.js'), h = rd('game.html'), c = rd('js/cardbattle.js');
        same(/if \(!faintStart\(u, b, f0\)\) give\(b\); live\.delete\(u\); \}\n    faintStep\(f0\);/.test(v) && /if \(!u \|\| !u\.dead \|\| !battling\(\)/.test(v), true, 'the faint: a body of the battle that goes down is kept and tipped over before it goes');
        same(/#cbWin/.test(h) || /cbWin/.test(c), false, 'the panel is gone');
    });

    group('THE CARDS AUDITED (§2.58; the owner: "Do an audit of all the different cards and try to make them more attuned to the new card combat system")');
    check('none of yours left to play a round (all charging): the enemies\' turn comes at once, and the charge fires when it is done (the battle waited for ever)', () => {
        const r = J(`(function(){ const A = __shaped('voidstar', [[4, 0], [5, 1]]); if (!A) return null; CARD_BATTLE.byClass = true; const f = A.f; const played = cardBattlePlay(f, 'move', 'maelstrom', { x: A.P[0] + 4, y: A.P[1], tile: true });
            const o = { played, say: _cb.say && _cb.say.text, charging: _cb.charge.has(f), turn: _cb.turn && _cb.turn.who, seen: [] }; let last = '';
            for (let i = 0; i < 3000 && _cb.charge.has(f); i++) { const T = _cb.turn, k = (T ? T.who : '-') + _cb.round; if (k !== last) { o.seen.push(k); last = k; } __live(1); }
            o.fired = !_cb.charge.has(f) && !!elementEffects.find(e => e.type === 'maelstrom'); o.round = _cb.round; CARD_BATTLE.byClass = false; return o; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.charging, r.fired]), '[true,true]', 'charging, then fired (' + JSON.stringify(r) + ')'); ok(r.round >= 3, 'the rounds went on (it stood on round 2 for ever): ' + r.seen.join(' '));
    });
    check('an Ultimate\'s splash stays in the battle: a creature outside it, in its reach, is neither hurt nor slowed (the Rimestar\'s WHITEOUT; the Ember Hood\'s rain of rocks)', () => {
        const r = J(`(function(){ const one = form => { const A = __shaped(form, [[1, 0], [2, 1]]); if (!A) return null; const f = A.f; f.ultimateCharge = 100;
                const out = __ant(A.P[0] + 1, A.P[1] - 1); out.x = A.P[0] + 1; out.y = A.P[1] - 1; out.health = out.maxHealth = 9999; const inB = A.foes[0], h0 = inB.health;
                const SD = typeof SENTRY_DAMAGE !== 'undefined' ? SENTRY_DAMAGE : 0; const hits = []; const ad = applyDamage; applyDamage = function (t, amt, src) { const h = t && t.health, r = ad.apply(this, arguments); if (t === out && t.health < h) hits.push(src && src.isFollower ? 'F' : src && src.by ? 'by' : 'world'); return r; };   /* (blows that landed on it; a sentry's are the world's) */
                try { cardBattlePlay(f, 'ult', null, null); for (let i = 0; i < 400; i++) __live(1); } finally { applyDamage = ad; }
                return { mine: hits.filter(h => h !== 'world').length, slowed: (out.slowed || 0) > 0, burning: (out.burning || 0) > 0, inB: +(h0 - inB.health).toFixed(1) }; };
            return { rime: one('rimestar'), ember: one('embercowl') }; })()`);
        for (const k of ['rime', 'ember']) { const o = r[k]; ok(o, 'no room (' + k + ')'); same(JSON.stringify([o.mine, o.slowed, o.burning]), '[0,false,false]', k + ': the one outside the battle (blows of yours on it, slowed, burning)'); }
        ok(r.rime.inB > 0 || r.ember.inB > 0, 'the battle\'s creature was not hurt by either: ' + JSON.stringify(r));
    });
    check('a shot of the world\'s (a sentry\'s) strikes no fighter of a battle in its way; one outside the battle it does', () => {
        const r = J(`(function(){ const A = __shaped(null, [[2, 0]]); if (!A) return null; const a = A.foes[0], out = __ant(A.P[0] + 4, A.P[1]); out.x = A.P[0] + 4; out.y = A.P[1]; out.health = out.maxHealth = 9999;
                const src = { x: A.P[0] + 1, y: A.P[1], element: 'electric' }, h = [a.health, out.health]; spawnFollowerProjectile(src, out, '#7ff2ff', 8, 5, null, null);
                for (let i = 0; i < 60; i++) __live(1); return { battle: +(h[0] - a.health).toFixed(1), outside: +(h[1] - out.health).toFixed(1) }; })()`);
        ok(r, 'no room'); same(r.battle, 0, 'the battle\'s creature in its way hurt'); ok(r.outside > 0, 'the one outside the battle it was aimed at not hurt');
    });
    check('an Ultimate that cannot go off where its card is dropped is not played: its turn and its card still its own, its charge kept, the banner saying why (no enemy in its squares; an enemy out of its reach)', () => {
        const r = J(`(function(){ const one = (form, offs) => { const A = __shaped(form, offs); if (!A) return null; const f = A.f; f.ultimateCharge = 100; const played = cardBattlePlay(f, 'ult', null, A.foes[0]);
                const o = { played, turn: _cb.turn && _cb.turn.who, mine: _cbCurrent() === f, acted: _cb.acted.has(f), charge: f.ultimateCharge, say: _cb.say && _cb.say.text }; for (let i = 0; i < 60; i++) __live(1); o.still = !!_cb.turn && _cb.turn.who === 'you' && _cbCurrent() === f; return o; };
            return { slam: one('hammerslug', [[5, 0]]), eat: one('sundew', [[4, 0]]) }; })()`);
        for (const [k, why] of [['slam', /NO ENEMY IN ITS SQUARES/], ['eat', /OUT OF ITS REACH/]]) { const o = r[k]; ok(o, 'no room (' + k + ')'); same(JSON.stringify([o.played, o.turn, o.mine, o.acted, o.charge, o.still]), '[false,"you",true,false,100,true]', k + ': not played (played, turn, its turn, acted, charge, still its turn after)'); ok(why.test(o.say || ''), k + ': the banner: ' + o.say); }
    });
    check('every card speaks the battle\'s words, an Ultimate\'s too (js/cardults.js): its squares and its effects in turns, no seconds, short enough for the card\'s four lines; an Ultimate without the real time\'s "tap"; none without words', () => {
        const r = J(`(function(){ const bad = [], seen = []; for (const k of Object.keys(EVOLUTIONS).filter(k => !EVOLUTIONS[k].legacy)) { __fresh(1); const f = followers[0]; f.evolved = k; f.element = EVOLUTIONS[k].element; f.role = EVOLUTIONS[k].role; f._moltAt = -9999; energyFill(f); f.ultimateCharge = 100;
                const cs = cardBattleCards(f); for (const c of cs) { const t = String(c.fx || ''); if (!t.trim()) bad.push(k + ' ' + c.kind + ' empty'); if (c.kind === 'ult' && /tap ULTIMATE/.test(t)) bad.push(k + ' ult tap'); if (/\\d(\\.\\d+)? ?s\\b|second/.test(t)) bad.push(k + ' ' + (c.id || c.kind) + ': ' + t);
                    if (t.length > (cs.length >= 5 ? 82 : 100)) bad.push(k + ' ' + (c.id || c.kind) + ' too long for its card (' + t.length + ' letters): ' + t); seen.push(c.kind + ':' + (c.id || '')); } }   /* (game.html .cb-fx: 4 lines; measured in a real browser, 82 letters fit a card of a follower with five, 100 one with four) */
                const say = (form, kind, id) => { __fresh(1); const f = followers[0]; f.evolved = form; f.element = EVOLUTIONS[form].element; f.role = EVOLUTIONS[form].role; f._moltAt = -9999; energyFill(f); return cardBattleCards(f).find(c => c.kind === kind && (!id || c.id === id)).fx; };
                return { bad, chomp: say('maw', 'move', 'chomp'), hex: say('embercowl', 'move', 'hexfire'), wob: say('jellyram', 'move', 'wobble_slam'), stun: _csTurns(MAW_STUN), base: say('thunderhead', 'basic') }; })()`);
        same(r.bad.join(' / '), '', 'cards not in the battle\'s words');
        same(r.chomp, 'Its target; the 8 squares round it · frozen ' + r.stun + '; the squares round it slowed 1 turn', 'CHOMP'); ok(/^A cross of 5 squares on a square in reach · burns as it opens and as 2 enemy turns begin$/.test(r.hex), 'HEXFIRE: ' + r.hex);
        same(r.wob, 'The 8 squares round it · each staggered 1 turn (not a boss)', 'WOBBLE SLAM'); ok(/every enemy within 2\.5 squares of the last · 1 hit in 4: stunned 1 turn$/.test(r.base), 'CHAIN LIGHTNING: ' + r.base);
    });

    check('the battle draws its own words where the 3D view puts the fight: a hit\'s number, a word and a kill\'s large +N XP all drawn, none throwing', () => {
        const r = J(`(function(){ __fresh(1); CARD_BATTLE.on = true; CARD_BATTLE.force3d = true; const a = __ant(player.x + 2, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1);
            floatingTexts.length = 0; _cbNums.clear(); applyDamage(a, 7, followers[0]); floatingTexts.push({ world: true, x: a.x, y: a.y, text: 'MISS', color: '#fff', life: 40 });
            floatingTexts.push({ world: true, x: a.x, y: a.y, text: '+40 XP', color: '#ffe733', size: 30, life: 110, _cbBig: true });
            const drawn = [], sizes = {}, saved = ctx, V0 = VIEW3D.view, S0 = VIEW3D.showing; let err = '';
            const fake = { save(){}, restore(){}, setTransform(){}, strokeText(){}, fillText(s){ drawn.push(String(s)); sizes[String(s)] = parseInt((this.font.match(/(\\d+)px/) || [0, 0])[1], 10); }, beginPath(){}, moveTo(){}, lineTo(){}, closePath(){}, fill(){}, stroke(){}, arc(){}, createLinearGradient(){ return { addColorStop(){} }; } };
            VIEW3D.view = { screenNow: (x, y, h) => [x * 40, y * 30 - (h || 0)], top: () => 20 }; VIEW3D.showing = true; ctx = fake;
            try { for (let i = 0; i < 12; i++) cardBattleNumbers(); } catch (e) { err = String(e && e.message || e); } finally { ctx = saved; VIEW3D.view = V0; VIEW3D.showing = S0; }
            return { err, num: drawn.indexOf('7') >= 0, word: drawn.indexOf('MISS') >= 0, big: drawn.indexOf('+40 XP') >= 0, bigger: sizes['+40 XP'] > sizes['MISS'] * 2 }; })()`);
        same(r.err, '', 'it threw'); same(r.num, true, 'the hit\'s number'); same(r.word, true, 'the word'); same(r.big, true, 'the kill\'s experience'); same(r.bigger, true, 'large: more than twice a word\'s size');
    });

    group('THE ULTIMATES IN A BATTLE (§2.64, §13; the owner, of the page that drew each one: "Approve")');
    const ULT = `const rel = (A, a) => { const s = _cb.slots.get(a); return s ? [s.x - A.P[0], s.y - A.P[1]].join() : (a._swallowedBy ? 'IN' : 'none'); }, act = () => { let n = 0; for (; n < 900 && _cb.turn && _cb.turn.who === 'act'; n++) __live(1); return n; },
        foesTurn = () => { for (let i = 0; i < 1200 && _cb.turn && _cb.turn.who === 'foe'; i++) __live(1); }, pass = () => { const f = _cbCurrent(); if (f) { _cb.acted.add(f); _cbAfterAct(frame); } else __live(2); foesTurn(); },
        fx = t => elementEffects.find(e => e.type === t), blows = (by, n) => { const ad = applyDamage; applyDamage = function (t, amt, src) { const h = t && t.health, r = ad.apply(this, arguments); if (t && t.health < h && (src === by || (src && src.by === by))) n.push(t); return r; }; return () => { applyDamage = ad; }; };`;   /* (pass: your squad's cards left unplayed, the enemies' turn had, yours again; blows: the hits of `by` that landed) */
    check('every evolved form\'s Ultimate has its shape and the place its card is dropped (22): 7 on an enemy, 5 on a floor tile, 10 anywhere', () => {
        const r = J(`(function(){ const by = { foe: [], tile: [], any: [] }, bad = []; for (const k of Object.keys(EVOLUTIONS).filter(k => !EVOLUTIONS[k].legacy)) { const d = cardShapeDef({ evolved: k }, 'ult'); if (!d || !d.ult) { bad.push(k); continue; } by[cardShapeAim(d)].push(k); }
            return { bad, foe: by.foe.sort().join(), tile: by.tile.sort().join(), any: by.any.sort().join() }; })()`);
        same(r.bad.join(), '', 'without a shape'); same(r.foe, 'coralcrab,hornshell,hovershell,shrub,staticorb,sundew,thermite', 'dropped on an enemy');
        same(r.tile, 'blightspider,electroskink,embercowl,rotshard,voidstar', 'dropped on a floor tile'); same(r.any, 'gooproxy,hammerslug,igloo,jellyram,maw,mimic,quillstone,rimestar,seeper,thunderhead', 'dropped anywhere');
    });
    check('a field keeps its own length in turns and its full damage, a turn\'s worth at a time (THUNDERSTORM, 6 s: 3 turns, the 11 bolts it strikes out of a battle as 4, 4 and 3): 4 as it is played, its turn lasting those 2 s; 4 as the enemies\' turn begins, the enemies waiting; standing still through your turn; its last 3 as the next enemy turn begins; then gone', () => {
        const r = J(`(function(){ ${ULT} const A = __shaped('thunderhead', [[2, 0], [3, 1]]); if (!A) return null; const f = A.f, n = [], undo = blows(f, n); f.ultimateCharge = 100; let o;
            try { const played = cardBattlePlay(f, 'ult', null, null), e = fx('thunderstorm'), life0 = e && e.life, frames = act(); o = { played, life0, frames, ran1: life0 - e.life, n1: n.length, field: !!(_cb.turn && _cb.turn.who === 'foe' && _cb.turn.field), banner: cardUltBanner() };
                foesTurn(); o.life2 = e.life; o.n2 = n.length; o.round = _cb.round; o.you = _cb.turn && _cb.turn.who;
                for (let i = 0; i < 200; i++) __live(1); o.lifeHeld = e.life; o.nHeld = n.length;
                pass(); o.n3 = n.length; o.gone = elementEffects.indexOf(e) < 0; pass(); o.n4 = n.length; } finally { undo(); }
            /* (the same storm out of a battle, in real time: its bolts counted by their own damage) */
            __fresh(1); CARD_BATTLE.on = false; elementEffects.length = 0; const g = followers[0]; g.evolved = 'thunderhead'; g.element = EVOLUTIONS.thunderhead.element; g.role = EVOLUTIONS.thunderhead.role; g._moltAt = -9999; energyFill(g); g.health = g.maxHealth = 1e6; g.ultimateCharge = 100;
            const t = __ant(g.x + 2, g.y); t.health = t.maxHealth = 9999; let out = 0, bite = 0; const ad = applyDamage; applyDamage = function (u, amt, src) { if (src === g && bite && amt === bite) out++; return ad.apply(this, arguments); };
            try { o.outFired = followerUltFire(g); const e2 = fx('thunderstorm'); bite = e2 ? e2.bite : 0; for (let i = 0; i < 400; i++) { t.x = g.x + 2; t.y = g.y; __live(1); } } finally { applyDamage = ad; CARD_BATTLE.on = true; }
            o.out = out; return o; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.played, r.life0, r.n1]), '[true,360,4]', 'played: the storm\'s own length, its bolts in its turn'); ok(r.frames >= 120 && r.frames <= 121 && r.ran1 === r.frames, 'its turn lasted its 2 s, the storm running each frame of it: ' + r.frames + ' frames, ' + r.ran1 + ' of the storm');
        same(r.field, true, 'the enemies wait for its next turn\'s worth'); ok(/^THUNDERSTORM · 2 TURNS LEFT$/.test(r.banner), 'the banner: ' + r.banner);
        same(JSON.stringify([r.life2, r.n2, r.round, r.you]), '[120,8,2,"you"]', 'the enemies\' turn had: its time left, its bolts, the round after, yours'); same(JSON.stringify([r.lifeHeld, r.nHeld]), '[120,8]', 'through your turn (200 frames): its time left and its bolts, the same');
        same(JSON.stringify([r.n3, r.gone, r.n4]), '[11,true,11]', 'its third turn\'s worth (3: its own rule strikes none on its last frame), then gone, no more after'); same(JSON.stringify([r.outFired, r.out]), '[true,11]', 'out of a battle, in real time: the same 11 bolts');
    });
    check('an Ultimate\'s turn is its Ultimate alone: no everyday hit goes with it and the follower takes no step (QUILLSTORM: one on each of two lines takes one quill\'s worth, the same)', () => {
        const r = J(`(function(){ ${ULT} const A = __shaped('quillstone', [[2, 0], [0, 2]]); if (!A) return null; const f = A.f; f.ultimateCharge = 100; const played = cardBattlePlay(f, 'ult', null, null), held = cardBattleHolds(f); act();
            return { played, held, hurt: A.foes.map(a => +(9999 - a.health).toFixed(2)), f: rel(A, f), at: +Math.hypot(f.x - A.P[0], f.y - A.P[1]).toFixed(2) }; })()`);
        ok(r, 'no room'); same(r.played && r.held, true, 'played, and holding still in its turn'); ok(r.hurt[0] > 0 && r.hurt[0] === r.hurt[1], 'each took one quill\'s worth: ' + r.hurt); same(JSON.stringify([r.f, r.at]), '["0,0",0]', 'where it stands');
    });
    check('dropped on a floor tile (EVENT HORIZON): the black hole on that tile, the enemies in it drawn in on the squares and crushed; a tile beyond its reach is refused', () => {
        const r = J(`(function(){ ${ULT} const A = __shaped('voidstar', [[3, 0], [5, 0]], [[4, 0], [2, 0]]); if (!A) return null; const f = A.f, P = A.P; f.ultimateCharge = 100;
            const far = cardShapeFor(f, 'ult', null, { x: P[0] + 7, y: P[1] }), played = cardBattlePlay(f, 'ult', null, { x: P[0] + 3, y: P[1], tile: true }); __live(4); const e = fx('eventhorizon'); const o = { far: far && far.why, played, at: e && [e.x - P[0], e.y - P[1]].join(), drawn: A.foes.map(a => rel(A, a)) }; act();
            o.hurt = A.foes.map(a => a.health < 9999); return o; })()`);
        ok(r, 'no room'); same(r.far, 'OUT OF ITS REACH', 'a tile 7 squares off'); same(JSON.stringify([r.played, r.at]), '[true,"3,0"]', 'played; the hole on the tile'); same(JSON.stringify(r.drawn), '["3,0","4,0"]', 'the one 2 squares off drawn a square in, next to the one on its middle'); same(JSON.stringify(r.hurt), '[true,true]', 'both crushed');
    });
    check('FAULTLINE is a line of squares (§2.61): played on an enemy, it goes under and along its line; the enemy on the line is spiked, one off it is not; it comes up on a new square at the line\'s end; its charge spent', () => {
        const r = J(`(function(){ ${ULT} const A = __shaped('thermite', [[2, 0], [1, 2]], [[1, 0], [3, 0], [4, 0]]); if (!A) return null; const f = A.f; f.ultimateCharge = 100; const S = cardShapeFor(f, 'ult', null, A.foes[0]);
            const played = cardBattlePlay(f, 'ult', null, A.foes[0]), under = !!f._fault, spent = f.ultimateCharge < 100; act(); for (let i = 0; i < 20; i++) __live(1); const s = rel(A, f).split(',').map(Number);
            return { line: S.hit.map(c => [c[0] - A.P[0], c[1] - A.P[1]].join()).join(' '), mask: S.mask.length, played, under, spent, hurt: A.foes.map(a => a.health < 9999), f: s, up: !f._fault, aim: !!(typeof techAim !== 'undefined' && techAim) }; })()`);
        ok(r, 'no room'); ok(/^1,0 2,0 3,0 4,0/.test(r.line), 'its line: ' + r.line); same(JSON.stringify([r.mask, r.played, r.under, r.spent, r.aim]), '[1,true,true,true,false]', 'the enemies on it, played, under, its charge spent, no drawing opened');
        same(JSON.stringify(r.hurt), '[true,false]', 'the one on the line spiked, the one off it not'); ok(r.up && r.f[1] === 0 && r.f[0] >= 3, 'it came up on its line, past the enemy: ' + r.f);
    });
    check('CONTAMINATION NETWORK lays its own pods (§2.62): no pod laid before, three in a triangle round the tile, strands between; one on a strand\'s end is bitten, one inside the triangle is not; one that walks across a strand is bitten once a walk', () => {
        const r = J(`(function(){ ${ULT} const A = __shaped('blightspider', [[3, 0], [3, -2]], [[1, 1], [5, 1], [3, -1], [2, 0], [4, 0], [3, 1]]); if (!A) return null; const f = A.f, P = A.P; f.ultimateCharge = 100; if (typeof techPools !== 'undefined') techPools.length = 0;
            const played = cardBattlePlay(f, 'ult', null, { x: P[0] + 3, y: P[1], tile: true }), e = fx('toxicnet'); act(); const o = { played, pods: e && e.pods.map(c => [c[0] - P[0], c[1] - P[1]].join()).join(' '), segs: e && e.segs.length, turns: e && Math.ceil(e.life / 120), hurt: A.foes.map(a => a.health < 9999) };
            const a = A.foes[0], h = a.health, T = {}; cardUltStepOn(T, a, [P[0] + 3, P[1] + 1]); o.cross = +(h - a.health).toFixed(2) > 0; o.weak = (a.weakened || 0) > 0 || (a.poisoned || 0) > 0; const h2 = a.health; cardUltStepOn(T, a, [P[0] + 2, P[1] + 1]); o.twice = a.health < h2; return o; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.played, r.pods, r.segs, r.turns]), '[true,"3,-2 1,1 5,1",3,4]', 'played with no pod laid; its pods; its strands; its turns left after the first'); same(JSON.stringify(r.hurt), '[false,true]', 'the one inside the triangle, the one on a strand\'s end');
        same(JSON.stringify([r.cross, r.twice]), '[true,false]', 'walked across a strand: bitten; a second strand square the same walk: not again');
    });
    check('ABSOLUTE ZERO holds as a status does (3 turns): the nearest three swallowed, out of the fight, their squares free; the battle goes on with every enemy held (no card to play, your squad waits, the rounds pass); after the third enemy turn they are let go on free squares', () => {
        const r = J(`(function(){ ${ULT} const A = __shaped('maw', [[1, 0], [2, 1], [1, -1]], [[0, 1], [0, -1], [2, 0], [-1, 0]]); if (!A) return null; const f = A.f; f.ultimateCharge = 100; const played = cardBattlePlay(f, 'ult', null, null);
            const o = { played, in: A.foes.map(a => rel(A, a)).join(' '), hit: A.foes.some(_cbFoeOk), round0: _cb.round, say: '' }; o.frames = act(); o.on = cardBattleActive(); o.held = A.foes.every(a => !!a._swallowedBy);
            for (let i = 0; i < 3000 && A.foes.some(a => a._swallowedBy); i++) { __live(1); if (_cb.say && /HELD/.test(_cb.say.text)) o.say = _cb.say.text; if (o.card === undefined && _cb.turn && _cb.turn.who === 'you' && A.foes.some(a => a._swallowedBy)) o.card = cardBattlePlay(f, 'basic', null, A.foes[0]); }
            const sq = A.foes.map(a => rel(A, a)); o.round = _cb.round; o.out = sq.join(' '); o.distinct = new Set(sq).size === 3 && sq.indexOf('none') < 0 && sq.indexOf('IN') < 0; o.free = A.foes.every(a => !a.untargetable && !(a.stunned > 0)); o.hurt = A.foes.some(a => a.health < 9999); o.still = cardBattleActive(); return o; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.played, r.in, r.hit, r.round0]), '[true,"IN IN IN",false,1]', 'swallowed as it is played: none on a square, none to strike'); ok(r.frames >= 60, 'its turn has its moment though nothing is left to strike: ' + r.frames + ' frames');
        same(JSON.stringify([r.on, r.held, r.card]), '[true,true,false]', 'its turn over: the battle still on, all three held, no card to play'); ok(/HELD/.test(r.say), 'the banner while they are held: ' + r.say);
        same(JSON.stringify([r.round, r.distinct, r.free, r.hurt, r.still]), '[4,true,true,false,true]', 'let go after the third enemy turn (the round after), each on a square of its own, free to act and be struck, unhurt, the battle on: ' + r.out);
    });
    check('CONSUME: the enemy it is dropped on swallowed for its turns, 5 bites (2, 2, 1) as the enemies\' turns end, none in its own turn; the Sundew holds still, playing no card, till it spits it out on a free square', () => {
        const r = J(`(function(){ ${ULT} const A = __shaped('sundew', [[1, 0], [4, 0]], [[1, 1], [0, 1], [2, 0]]); if (!A) return null; const f = A.f, prey = A.foes[0], n = [], undo = blows(f, n); f.ultimateCharge = 100; let o;
            try { const played = cardBattlePlay(f, 'ult', null, prey); o = { played, in: rel(A, prey), n0: 0, per: [] };
                for (let i = 0, r0 = _cb.round; i < 3000 && prey._swallowedBy; i++) { if (_cb.turn && _cb.turn.who === 'act') o.n0 = n.length; __live(1); if (_cb.round !== r0) { r0 = _cb.round; o.per.push(n.length); if (prey._swallowedBy) { o.cur = _cbCurrent() === f; o.card = cardBattlePlay(f, 'basic', null, A.foes[1]); } } }
                o.round = _cb.round; o.out = rel(A, prey); o.free = !prey.untargetable && !f._consume; __live(2); o.again = _cbCurrent() === f; } finally { undo(); }
            return o; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.played, r.in, r.n0]), '[true,"IN",0]', 'swallowed, no bite in its own turn'); same(JSON.stringify(r.per), '[2,4,5]', 'its bites as each enemy turn ends'); same(JSON.stringify([r.cur, r.card]), '[false,false]', 'while it digests: not its turn, its card refused');
        same(JSON.stringify([r.round, r.free, r.again]), '[4,true,true]', 'spat out after the third enemy turn, free; the Sundew\'s turn again'); ok(/^-?\d+,-?\d+$/.test(r.out), 'the prey on a square: ' + r.out);
    });
    check('shields, copies and walls count as the enemies\' turn ends: JELLY SHIELDS 5 turns; PROXY SWARM\'s three copies on free squares next to it, bursting after the third; REEF PILLAR\'s wall of three squares that nobody walks through, mending yours by it, 5 turns', () => {
        const r = J(`(function(){ ${ULT} const o = {};
            { const A = __shaped('jellyram', [[3, 0]]); if (!A) return null; const f = A.f, left = () => f.jellyShield && f.jellyShield.until > frame ? f.jellyShield._cbTurns : 0; f.ultimateCharge = 100; cardBattlePlay(f, 'ult', null, null); o.shield = [_cb.round, left()]; act(); o.shield.push(_cb.round, left());
              for (let i = 0; i < 3; i++) pass(); o.shield.push(_cb.round, left()); pass(); __live(3); o.shield.push(_cb.round, left()); }
            { const A = __shaped('gooproxy', [[3, 0]], [[1, 0], [0, 1], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]); if (!A) return null; const f = A.f, taken = new Set([..._cb.slots.values()].map(q => q.x + ',' + q.y)); f.ultimateCharge = 100; cardBattlePlay(f, 'ult', null, null);
              const sq = rotDecoys.map(d => [d.x - A.P[0], d.y - A.P[1]]); o.copies = sq.length; o.next = sq.every(c => Math.max(Math.abs(c[0]), Math.abs(c[1])) === 1 && Number.isInteger(c[0]) && Number.isInteger(c[1])); o.apart = new Set(sq.map(c => c.join())).size === 3 && rotDecoys.every(d => !taken.has(d.x + ',' + d.y));
              act(); __live(40); o.swarm = [_cb.round, rotDecoys.length]; pass(); __live(40); o.swarm.push(_cb.round, rotDecoys.length); pass(); __live(40); o.swarm.push(_cb.round, rotDecoys.length); }
            { const A = __shaped('coralcrab', [[4, 0]], [[1, 0], [2, 0], [3, 0], [3, 1], [3, -1]]); if (!A) return null; const f = A.f, P = A.P; f.ultimateCharge = 100; cardBattlePlay(f, 'ult', null, A.foes[0]);
              o.wall = cardUltWalls().map(c => [c[0] - P[0], c[1] - P[1]].join()).sort().join(' '); const G = _cbGrid(A.foes[0]); o.blocked = cardUltWalls().every(c => G.taken.has(c[0] + ',' + c[1])); act(); o.reef = [_cb.round, cardUltWalls().length];
              _cb.slots.set(f, { x: P[0] + 2, y: P[1] }); f.x = P[0] + 2; f.y = P[1]; f.health = 5e5; pass(); o.mend = +((f.health - 5e5) / f.maxHealth).toFixed(3); pass(); pass(); o.reef.push(_cb.round, cardUltWalls().length); pass(); o.reef.push(_cb.round, cardUltWalls().length); }
            return o; })()`);
        ok(r, 'no room'); same(JSON.stringify(r.shield), '[1,5,2,4,5,1,6,0]', 'the jelly shield, round by round and its turns left: 5 as it is put on, 4 after the first enemy turn, 1 after the fourth, gone after the fifth');
        same(JSON.stringify([r.copies, r.next, r.apart]), '[3,true,true]', 'the copies: three, each on a square next to it, apart and on no taken square'); same(JSON.stringify(r.swarm), '[2,3,3,3,4,0]', 'round by round: standing after the first and the second enemy turn, burst after the third');
        same(JSON.stringify([r.wall, r.blocked, r.mend]), '["3,-1 3,0 3,1",true,0.08]', 'the wall: its squares, closed to a walk, a turn\'s mending of one by it'); same(JSON.stringify(r.reef), '[2,3,5,3,6,0]', 'round by round: standing through its fourth enemy turn, gone after its fifth');
    });
    check('METEOR RAIN falls on squares round the tile it is dropped on, over 2 turns: some rocks as it is played, the rest as the enemy turn begins; its last rock down, the enemies wait for it no more', () => {
        const r = J(`(function(){ ${ULT} const A = __shaped('embercowl', [[3, 0], [4, 1]]); if (!A) return null; const f = A.f, P = A.P; f.ultimateCharge = 100; const played = cardBattlePlay(f, 'ult', null, { x: P[0] + 3, y: P[1], tile: true }), e = fx('meteorrain'); act();
            const o = { played, mid: e && [e.x - P[0], e.y - P[1]].join(), rocks: e && e.rocks.length, onSq: e && e.rocks.every(q => Number.isInteger(q.x) && Number.isInteger(q.y)), down1: e && e.rocks.filter(q => q.hit).length };
            _cb.acted.add(f); _cbAfterAct(frame); o.field = !!(_cb.turn && _cb.turn.field); foesTurn(); o.down2 = e.rocks.filter(q => q.hit).length; o.off = !e._cbUlt; pass(); o.field2 = cardUltLive(); return o; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.played, r.mid, r.onSq, r.field, r.off, r.field2]), '[true,"3,0",true,true,true,false]', 'played on the tile; each rock on a square; the enemies wait for its second turn\'s worth; then it is off the battle\'s clock');
        ok(r.rocks >= 8 && r.down1 >= 4 && r.down1 < r.rocks && r.down2 === r.rocks, 'its rocks: ' + r.down1 + ' of ' + r.rocks + ' in its turn, ' + r.down2 + ' by the end of the next turn\'s worth');
    });

    check('every Ultimate goes off in a battle and runs out (22): played, its charge spent, its turn over in time; what it leaves is on the battle\'s clock and gone when its turns are over; your turn comes again; its follower on a square of the room after; the battle on, nothing thrown', () => {
        const r = J(`(function(){ ${ULT} const out = {};
            for (const k of Object.keys(EVOLUTIONS).filter(k => !EVOLUTIONS[k].legacy)) {
                const A = __shaped(k, [[2, 0], [3, 1], [3, -1]], [[1, 0], [1, 1], [1, -1], [2, -2], [0, 1], [4, 1], [0, -1], [-1, 0]]); if (!A) { out[k] = { err: 'no room' }; continue; }
                const f = A.f, P = A.P, aimK = cardShapeAim(cardShapeDef(f, 'ult')), aim = aimK === 'foe' ? A.foes[0] : aimK === 'tile' ? { x: P[0] + 2, y: P[1], tile: true } : null, h0 = A.foes.map(a => a.health); f.ultimateCharge = 100;
                const o = out[k] = { played: false, frames: 0, spent: false, loose: '', clear: 0, err: '' };
                try { o.played = cardBattlePlay(f, 'ult', null, aim); if (!o.played) { o.err = 'not played: ' + (_cb.say && _cb.say.text); continue; }
                    o.frames = act(); o.spent = f.ultimateCharge < 100;
                    o.loose = elementEffects.filter(e => _CU_LAST[e.type] && e.life > 0 && !e._cbUlt && e.type !== 'meteorrain').map(e => e.type).join();   /* (what it left that lasts, not on the battle's clock) */
                    const left = () => elementEffects.some(e => e._cbUlt && e.life > 0) || _cbSquad().some(m => m.jellyShield && m.jellyShield._cbTurns > 0) || cardUltWalls().length > 0 || rotDecoys.length > 0 || A.foes.some(a => a._swallowedBy);
                    for (let n = 0; n < 12 && left() && cardBattleActive(); n++) { pass(); __live(40); } o.clear = left() ? -1 : _cb.round; foesTurn(); o.back = !!_cb.turn && _cb.turn.who === 'you';
                } catch (e) { o.err = String(e && e.message || e); }
                const q = _cb.slots.get(f); o.on = cardBattleActive(); o.sq = !!q && Number.isInteger(q.x) && Number.isInteger(q.y) && !!_cb.lay && facilityRoomIdAt(q.x, q.y) === _cb.lay.room; o.did = A.foes.some((a, i) => a.health < h0[i]) || k === 'jellyram' || k === 'gooproxy' || k === 'coralcrab' || k === 'maw';
            }
            return out; })()`);
        const bad = [], CLEAR = { thunderhead: 3, rimestar: 3, igloo: 3, mimic: 4, voidstar: 3, rotshard: 3, shrub: 3, electroskink: 3, blightspider: 5, embercowl: 2, maw: 4, sundew: 4, jellyram: 6, gooproxy: 4, coralcrab: 6 };   // (the round by which what it left is gone: a field of n turns has its last turn's worth as round n's enemy turn begins; a hold, a shield, a copy or a wall of n turns goes as its nth enemy turn ends, round n + 1)
        same(Object.keys(r).length, 22, 'the forms');
        for (const k in r) { const o = r[k]; if (o.err) { bad.push(k + ': ' + o.err); continue; }
            if (!o.played || !o.spent) bad.push(k + ' not played or its charge kept'); if (!(o.frames > 0 && o.frames < 300)) bad.push(k + ' its turn: ' + o.frames + ' frames'); if (o.loose) bad.push(k + ' left off the clock: ' + o.loose);
            if (CLEAR[k] ? o.clear !== CLEAR[k] : !(o.clear > 0)) bad.push(k + ' gone by round ' + o.clear + (CLEAR[k] ? ', not ' + CLEAR[k] : '')); if (!o.back) bad.push(k + ' your turn did not come again'); if (!o.on) bad.push(k + ' ended the battle'); if (!o.sq) bad.push(k + ' its follower off the squares'); if (!o.did) bad.push(k + ' touched no enemy'); }
        same(bad.join(' / '), '', 'the Ultimates that did not');
    });
    check('wired: the page loads js/cardults.js after the shapes, with its boot check; an effect asks the battle\'s clock before its step; the battle asks the Ultimates at its turns', () => {
        const h = rd('game.html'), e = rd('js/elements.js'), c = rd('js/cardbattle.js'), sh = rd('js/cardshapes.js');
        ok(/<script src="js\/cardshapes\.js\?v=[^"]+"><\/script>\s*<script src="js\/cardults\.js\?v=[^"]+"><\/script>/.test(h) && /"js\/cardults\.js": "CARD_ULTS"/.test(h), 'the page');
        ok(/function elementEffectStep\(e\) \{\s*if \(typeof cardUltGate === "function" && cardUltGate\(e\)\) return true;/.test(e) && /elementEffects\.filter\(elementEffectStep\)/.test(e) && /cardUltPoint\(actor\)/.test(e), 'the effects\' step');
        ok(/cardUltFire\(f, S, T\)/.test(c) && /cardUltDone\(T, el\)/.test(c) && /cardUltWindow\(\)\) \{ _cb\.turn\.field = _cbF\(\)/.test(c) && /cardUltTurnEnd\(\);/.test(c) && /cardUltWalls\(\)\) taken\.add/.test(c) && /cardUltStepOn\(/.test(c) && (c.match(/cardUltEnd\(\)/g) || []).length === 2, 'the battle\'s turns');
        ok(/cardUltDef\(f\)/.test(sh) && /cardUltShape\(/.test(sh) && /cardUltSays\(f\)/.test(sh) && /cardUltNow\(\)/.test(sh), 'the shapes');
    });

    check('a field\'s squares stay lit, faintly, while it lasts (the owner, 2026-11-20: "you can have the tiles faint right now"): a field on a tile keeps its card\'s squares; one that moves with its follower is laid again where it is; gone with the field; drawn under the reticles', () => {
        const r = J(`(function(){ ${ULT} const A = __shaped('voidstar', [[3, 0]], [[2, 0]]); if (!A) return null; const f = A.f, P = A.P; f.ultimateCharge = 100; cardBattlePlay(f, 'ult', null, { x: P[0] + 3, y: P[1], tile: true }); __live(3); const e = fx('eventhorizon'), sq = cardUltSquares(e), S = _cb.turn.shape;
            const o = { n: sq && sq.length, same: sq === S.hit, has: !!sq && sq.some(c => c[0] === P[0] + 3 && c[1] === P[1]) };
            const B = __shaped('thunderhead', [[2, 0]]); B.f.ultimateCharge = 100; cardBattlePlay(B.f, 'ult', null, null); __live(3); const t = fx('thunderstorm'), s1 = cardUltSquares(t).length, k1 = t._cbSqK; t.x += 1; const s2 = cardUltSquares(t); o.moved = [s1 > 20, k1 !== t._cbSqK, s2.every(c => Math.hypot(c[0] - Math.round(t.x), c[1] - Math.round(t.y)) <= t.radius + 0.01)]; return o; })()`);
        ok(r && r.n > 10 && r.same && r.has, 'the black hole\'s squares are its card\'s: ' + JSON.stringify(r)); same(JSON.stringify(r.moved), '[true,true,true]', 'the storm\'s, laid again when it moved');
        ok(/cardUltDraw\(V\);[^\n]*\n\s*if \(V && typeof cardShapeDraw/.test(rd('js/cardbattle.js')) && /e\._cbUlt !== "win" \|\| !\(e\.life > 0\) \|\| !cardUltShown\(e\)\) continue; const sq = cardUltSquares\(e\)/.test(rd('js/cardults.js')), 'drawn by the battle, only while the field lives');
    });

    check('the fields in 3D, begun (the owner, 2026-11-20: "the full animation"; "Start with the Ultimates\' lasting fields"): the battle hands the view its live fields, none out of a battle; the view draws them while the battle\'s camera is up (view3d/fields.js: all ten that last; every one the battle\'s clock keeps has its 3D field)', () => {
        const r = J(`(function(){ ${ULT} const A = __shaped('thunderhead', [[2, 0]]); A.f.ultimateCharge = 100; cardBattlePlay(A.f, 'ult', null, null); __live(3); const on = cardUltFields().map(e => e.type).join(); cardBattleReset(); _cb.phase = 'off'; return { on, off: cardUltFields().length }; })()`);
        same(JSON.stringify(r), '{"on":"thunderstorm","off":0}', 'the fields handed over');
        const f = rd('view3d/fields.js'), v = rd('view3d/gameview.js');
        ok(/FIELDS\.step\(battling\(\) \? GM\.battleFields : null, f0, GM\.meteor\)/.test(v) && /cardUltFields\(\)/.test(rd('view3d/gamemap.js')) && /'view3d\/fields\.js', 'view3d\/gameview\.js'/.test(rd('tools/view3d.js')), 'wired into the view and its build');
        for (const k of ['ring', 'impact', 'quill', 'wavemaker', 'hoverdrift', 'faultSpike']) ok(new RegExp('\\n    ' + k + '\\((e|p)\\) \\{').test(f), k + ' has its 3D burst');
        const b = J(`(function(){ ${ULT} const o = {}, kinds = () => [...new Set(cardUltFields().map(x => x.type || x.kind))].sort().join();
            { const A = __shaped('quillstone', [[2, 0], [0, 2]]); A.f.ultimateCharge = 100; cardBattlePlay(A.f, 'ult', null, null); __live(2); o.quills = kinds(); }
            { const A = __shaped('hammerslug', [[1, 0]]); A.f.ultimateCharge = 100; cardBattlePlay(A.f, 'ult', null, null); __live(2); o.slam = kinds(); act(); foesTurn(); o.after = cardUltFields().length; }
            { const A = __shaped('hornshell', [[3, 0]], [[1, 0], [2, 0]]); A.f.ultimateCharge = 100; cardBattlePlay(A.f, 'ult', null, A.foes[0]); __live(4); o.wave = kinds(); }
            { const A = __shaped('hovershell', [[2, 0]], [[1, 0], [3, 0], [2, 1], [2, -1]]); A.f.ultimateCharge = 100; cardBattlePlay(A.f, 'ult', null, A.foes[0]); __live(6); o.drift = /hoverdrift/.test(kinds()); }
            { const A = __shaped('thermite', [[2, 0]], [[1, 0], [3, 0], [4, 0]]); A.f.ultimateCharge = 100; cardBattlePlay(A.f, 'ult', null, A.foes[0]); let sp = false; for (let i = 0; i < 80 && !sp; i++) { __live(1); sp = /faultSpike/.test(kinds()); } o.fault = sp; }
            return o; })()`);
        same(JSON.stringify(b), '{"quills":"quill,ring","slam":"impact,ring","after":0,"wave":"wavemaker","drift":true,"fault":true}', 'the Ultimates over in their own turn hand their bursts to the view as they are cast, nothing after');
        for (const k of ['abszero', 'consume', 'jellyshield', 'gooproxy', 'reef']) ok(new RegExp('\\n    ' + k + '\\((e|O)\\) \\{').test(f), k + ' has its 3D thing');
        const h = J(`(function(){ ${ULT} const o = {}; { const A = __shaped('coralcrab', [[4, 0]], [[1, 0], [2, 0], [3, 0], [3, 1], [3, -1]]); A.f.ultimateCharge = 100; cardBattlePlay(A.f, 'ult', null, A.foes[0]); act(); foesTurn(); _cb.acted.add(A.f); o.wall = cardUltFields().filter(x => x.parts).length; }
            { const A = __shaped('gooproxy', [[3, 0]], [[1, 0], [0, 1], [0, -1], [-1, 0], [1, 1], [1, -1], [-1, 1], [-1, -1]]); A.f.ultimateCharge = 100; cardBattlePlay(A.f, 'ult', null, null); act(); foesTurn(); _cb.acted.add(A.f); o.copies = cardUltFields().filter(x => x.type === 'gooproxy').length; }
            { const A = __shaped('jellyram', [[3, 0]]); A.f.ultimateCharge = 100; cardBattlePlay(A.f, 'ult', null, null); __live(2); o.shieldCast = cardUltFields().filter(x => x.type === 'jellyshield').length; act(); foesTurn(); o.shieldTurn = cardUltFields().length; _cb.acted.add(A.f); o.shieldOff = cardUltFields().length; }
            { const A = __shaped('sundew', [[1, 0], [4, 0]], [[1, 1], [0, 1], [2, 0]]); A.f.ultimateCharge = 100; cardBattlePlay(A.f, 'ult', null, A.foes[0]); __live(2); const e = fx('consume'); o.gulp = [cardUltShown(e)]; _cb.turn = { who: 'you', t0: frame }; o.gulp.push(cardUltShown(e)); _cb.turn = { who: 'foe', a: A.foes[1], t0: frame, queue: [] }; o.gulp.push(cardUltShown(e)); }
            return o; })()`);
        same(JSON.stringify(h), '{"wall":1,"copies":3,"shieldCast":1,"shieldTurn":1,"shieldOff":0,"gulp":[true,true,false]}', 'the wall and the copies always there; a shield in its caster\'s turn; the Sundew\'s hold through your round, not an enemy\'s turn');
        same(J(`Object.keys(_CU_LAST).filter(k => _CU_LAST[k] === 'win').sort().join()`), 'circuit,eventhorizon,icerink,meteorrain,shardvortex,thicket,thunderstorm,toxicnet,toxicpuddle,whiteout', 'the fields that last');
        for (const k of ['thunderstorm', 'eventhorizon', 'toxicpuddle', 'whiteout', 'icerink', 'shardvortex', 'thicket', 'circuit', 'toxicnet', 'meteorrain']) ok(new RegExp('\\n    ' + k + '\\(e\\) \\{').test(f), k + ' has its 3D field');
    });

    check('a field is seen only in its caster\'s turn (the owner, 2026-11-20: "The battlefield should be clear, unless it\'s the creature who casts the ultimate\'s turn"): as it is cast; while its turn\'s worth strikes; not while an enemy acts nor in another follower\'s turn; again when your round comes to its caster', () => {
        const r = J(`(function(){ ${ULT} const A = __shaped('thunderhead', [[2, 0]]); const f = A.f; f.ultimateCharge = 100; cardBattlePlay(f, 'ult', null, null); __live(3); const e = fx('thunderstorm'), o = { cast: cardUltShown(e) && cardUltFields().length === 1 };
            act(); o.strikes = !!_cb.turn.field && cardUltShown(e); const T = _cb.turn; _cb.turn = { who: 'foe', a: A.foes[0], t0: frame, queue: [] }; o.foe = cardUltShown(e) || cardUltFields().length > 0;
            const other = { health: 1 }; _cb.turn = { who: 'act', f: other, t0: frame }; o.other = cardUltShown(e); _cb.turn = { who: 'you', t0: frame }; _cb.acted.clear(); o.yours = _cbCurrent() === f && cardUltShown(e); _cb.acted.add(f); o.done = cardUltShown(e); _cb.turn = T; return o; })()`);
        same(JSON.stringify(r), '{"cast":true,"strikes":true,"foe":false,"other":false,"yours":true,"done":false}', 'when it is seen');
    });

    group('PUSHES AND PULLS ON THE SQUARES (§2.63; the owner, of three offered: "Its own distance")');
    const REL = `const rel = (A, a) => { const s = _cbSq(a); return [s[0] - A.P[0], s[1] - A.P[1]].join(); }, act = () => { for (let i = 0; i < 900 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act'; i++) __live(1); };`;
    check('BASH pushes its target its 1 tile: 1 square straight back, and that is its square (it eases there and stays); to the side as well as straight on', () => {
        const r = J(`(function(){ ${REL} const A = __shaped(null, [[1, 0]], [[2, 0]]); if (!A) return null; const a = A.foes[0], played = cardBattlePlay(A.f, 'move', 'bash', a); __live(1); const sq = rel(A, a); act(); for (let i = 0; i < 40; i++) __live(1);
            const s = _cbSq(a), o = { played, sq, after: rel(A, a), off: +Math.hypot(a.x - s[0], a.y - s[1]).toFixed(2), kb: (a.kbVX || 0) + (a.kbVY || 0) };
            const B = __shaped(null, [[1, 1]], [[2, 2], [1, 2], [2, 1]]); if (!B) return o; cardBattlePlay(B.f, 'move', 'bash', B.foes[0]); __live(1); o.diag = rel(B, B.foes[0]); return o; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.played, r.sq, r.after, r.kb]), '[true,"2,0","2,0",0]', 'played, its square a frame after, its square after the turn, no knock of the game\'s own'); ok(r.off < 0.1, 'not on its new square: ' + r.off + ' off'); same(r.diag, '2,2', 'one to the side: its square');
    });
    check('each push its own distance, a part of a tile counting whole: STAKE RING (1.5 tiles) 2 squares, GRAVITY SLAM (half a tile) 1, BRIAR SWEEP (1) 1', () => {
        const r = J(`(function(){ ${REL} const one = (form, id, free) => { const A = __shaped(form, [[1, 0]], free); if (!A) return null; cardBattlePlay(A.f, 'move', id, null); __live(1); return rel(A, A.foes[0]); };
            return { stake: one('coralcrab', 'stake_ring', [[2, 0], [3, 0], [4, 0]]), slam: one('mimic', 'gravity_slam', [[2, 0], [3, 0]]), briar: one('shrub', 'briar_sweep', [[2, 0], [3, 0]]), n: [STAKE_PUSH, MIMIC_PUSH, BRIAR_PUSH] }; })()`);
        same(JSON.stringify([r.stake, r.slam, r.briar]), '["3,0","2,0","2,0"]', 'STAKE RING, GRAVITY SLAM, BRIAR SWEEP (their tiles: ' + r.n + ')');
    });
    check('those pushed in one go move together (two in a line, neither stopped by the other); a push stops at a taken square (the one behind it not pushed)', () => {
        const r = J(`(function(){ ${REL} const A = __shaped('shrub', [[1, 0], [2, 0], [0, -2], [0, -3]], [[3, 0], [0, -1]]); if (!A) return null; cardBattlePlay(A.f, 'move', 'briar_sweep', null); __live(1); return A.foes.map(a => rel(A, a)); })()`);
        ok(r, 'no room'); same(JSON.stringify(r), '["2,0","3,0","0,-2","0,-3"]', 'the two in a line a square on each; the one with a creature behind it (out of the sweep\'s reach) where it was');
    });
    check('a push stops at a wall (one with no floor behind it stays, and is still pushed the other way); a boss is not moved; a pull goes no further than the square it is drawn to', () => {
        const r = J(`(function(){ ${REL} const A = __shaped(null, [[2, 0]]); if (!A) return null; const a = A.foes[0], room = new Set(partyRoomCells(_cb.lay.room).map(c => c.join())), taken = new Set([..._cb.slots.values()].map(q => q.x + ',' + q.y));
            const c = partyRoomCells(_cb.lay.room).find(c => !room.has((c[0] + 1) + ',' + c[1]) && room.has((c[0] - 1) + ',' + c[1]) && room.has((c[0] - 2) + ',' + c[1]) && room.has((c[0] - 3) + ',' + c[1]) && [0, -1, -2, -3].every(d => !taken.has((c[0] + d) + ',' + c[1])) && _fpEdgeOk(c[0], c[1], c[0] - 1, c[1]) && _fpEdgeOk(c[0] - 1, c[1], c[0] - 2, c[1]) && _fpEdgeOk(c[0] - 2, c[1], c[0] - 3, c[1])); if (!c) return { none: true };
            const at = () => { const s = _cbSq(a); return [s[0] - c[0], s[1] - c[1]].join(); }; _cb.slots.set(a, { x: c[0], y: c[1] }); a.x = c[0]; a.y = c[1];
            const o = { wall: cardBattlePush(a, 1, 0, 2) }; __live(1); o.atWall = at(); cardBattlePush(a, -1, 0, 1); __live(1); o.back = at();
            a.isBoss = true; o.boss = cardBattlePush(a, -1, 0, 1); __live(1); o.atBoss = at(); a.isBoss = false;
            cardBattlePull(a, c[0] - 3, c[1], 9); __live(1); o.pulled = at(); return o; })()`);
        ok(r && !r.none, 'no square by a wall'); same(JSON.stringify([r.wall, r.atWall, r.back]), '[true,"0,0","-1,0"]', 'against the wall: taken by the battle, not moved; then a square the other way');
        same(JSON.stringify([r.boss, r.atBoss]), '[true,"-1,0"]', 'a boss: the battle\'s, and not moved'); same(r.pulled, '-3,0', 'a pull of 9 tiles to a square 2 away: on that square, no further');
    });
    check('yours are pushed as theirs are (a creature\'s knock of 2 tiles: 2 squares); out of a battle a knock is the game\'s own', () => {
        const r = J(`(function(){ ${REL} const A = __shaped('jellyram', [[1, 0]], [[-1, 0], [-2, 0], [-3, 0]]); if (!A) return null; const f = A.f, took = applyKnockback(f, A.foes[0], 2 * KNOCK_PER_TILE); __live(1);
            const o = { took, sq: rel(A, f), kb: (f.kbVX || 0) + (f.kbVY || 0) }; __fresh(1); const g = followers[0], e = __ant(g.x + 1, g.y); o.out = applyKnockback(e, g, KNOCK_PER_TILE); o.outKb = +Math.hypot(e.kbVX || 0, e.kbVY || 0).toFixed(2); o.phase = cardBattlePhase(); return o; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.took, r.sq, r.kb]), '[true,"-2,0",0]', 'one of yours knocked 2 tiles: 2 squares away from the creature'); same(JSON.stringify([r.out, r.outKb, r.phase]), '[true,0.28,"off"]', 'out of a battle: the knock\'s own motion');
    });
    check('a biter thrown off a jelly shield in its own turn (JELLY SHIELDS: its 1 tile) ends its turn a square back, and that is its square from then on', () => {
        const r = J(`(function(){ ${REL} const A = __shaped('jellyram', [[1, 0]], [[2, 0], [3, 0]]); if (!A) return null; const f = A.f, a = A.foes[0]; f.jellyShield = { hp: 1e6, until: frame + 1e6, by: f };
            const h = f.health; cardBattlePlay(f, 'walk', null, { x: A.P[0], y: A.P[1] - 1, tile: true }); let bit = false, mine = 0;
            for (let i = 0; i < 1500; i++) { __live(1); const T = _cb.turn; if (T && T.who === 'foe' && T.a === a) bit = true; if (bit && T && T.who === 'you') { mine = i; break; } }
            for (let i = 0; i < 30; i++) __live(1); const s = _cbSq(a);
            return { bit, mine: mine > 0, hurt: h - f.health, sq: [s[0] - A.P[0], s[1] - (A.P[1])].join(), f: rel(A, f), off: +Math.hypot(a.x - s[0], a.y - s[1]).toFixed(2), knock: ULT_JELLY.knock }; })()`);
        ok(r, 'no room'); ok(r.bit && r.mine, 'the creature had no turn: ' + JSON.stringify(r)); same(r.hurt, 0, 'the shield did not take the bite');
        ok(r.off < 0.1, 'the biter is not on its square after its turn: ' + r.off + ' off (' + JSON.stringify(r) + ')');
        const d = r.sq.split(',').map(Number), g = r.f.split(',').map(Number); ok(Math.max(Math.abs(d[0] - g[0]), Math.abs(d[1] - g[1])) === 2, 'the biter did not end a square back from the one it bit (it bites from next to it): it at ' + r.sq + ', the Jelly Ram at ' + r.f);
    });
    check('STATIC VORTEX draws the enemies in it in as it opens, towards its gathering square and no further (not a beetle), and again before its shock as the enemies\' turn begins', () => {
        const r = J(`(function(){ ${REL} const A = __shaped('thunderhead', [[2, 0], [5, 0], [3, -2]], [[3, 0], [3, 1], [4, 1], [4, 0], [2, 1], [5, 1], [3, -1]]); if (!A) return null; const f = A.f, P = A.P; A.foes[2].speciesName = 'beetle';
            const played = cardBattlePlay(f, 'move', 'static_vortex', { x: P[0] + 3, y: P[1], tile: true }); __live(1); const e = elementEffects.find(e => e.type === 'staticVortex'), g = e && staticVortexGather(e);
            const o = { played, gather: g && [Math.round(g.x) - P[0], Math.round(g.y) - P[1]].join(), open: A.foes.map(a => rel(A, a)) };
            _cb.slots.set(A.foes[0], { x: P[0] + 2, y: P[1] }); A.foes[0].x = P[0] + 2; A.foes[0].y = P[1]; const h = A.foes[0].health; cardShapeStays('foes'); __live(1); o.again = rel(A, A.foes[0]); o.shock = A.foes[0].health < h; return o; })()`);
        ok(r, 'no room'); same(JSON.stringify([r.played, r.gather]), '[true,"4,1"]', 'played; its gathering square'); same(JSON.stringify(r.open), '["3,1","4,1","3,-2"]', 'as it opens: one a square in (the gathering square taken by then), one onto the gathering square, the beetle where it was');
        same(JSON.stringify([r.again, r.shock]), '["3,1",true]', 'as the enemies\' turn begins: one that had got out drawn in again, and shocked');
    });
    check('the cards say it in squares: BASH "pushed back 1 square", STAKE RING "2 squares out", GRAVITY SLAM "shoved 1 square", STATIC VORTEX "pulls them in"', () => {
        const r = J(`[CARD_SAYS.bash(), CARD_SAYS.stake_ring(), CARD_SAYS.briar_sweep(), CARD_SAYS.gravity_slam(), CARD_SAYS.static_vortex()]`);
        same(JSON.stringify(r), JSON.stringify(['pushed back 1 square, stunned 1 turn', 'each pushed 2 squares out', 'each pushed 1 square out', 'each shoved 1 square and slowed 1 turn', 'pulls them in; shocks as 2 enemy turns begin']), 'the words');
    });

    group('THE GUNSLINGER\'S TURN (§2.66; the owner, 2026-11-20: "the gunslinger gets a turn in the battle phases. So every rotation he gets a turn, and he has one attack so far, which is shoot [...] four to five shots [...] shows the ammo [...] the bottom [...] it has no wind up or anything")');
    run(`globalThis.__gs = (ammo, hp) => { __fresh(1); invReset(); playerClassKey = null; classSet('gunslinger'); classGrant('machinegun'); weaponEquip('machinegun'); playerAmmo = ammo === undefined ? 20 : ammo; player.selectedElement = null; player.attackCooldown = 0; health = PLAYER_HITS; player.invuln = 1e6;
            const f = followers[0]; f.role = 'brawler'; f.health = f.maxHealth = 1e5; const a = __ant(player.x + 2, player.y); a.element = null; a.health = a.maxHealth = hp || 9999; cardBattleChoose(a); __ticks(1); __nextTo(f, a); return { f, a }; };   /* (its follower beside the enemy, so the enemy has its bite to do in its turn) */
        globalThis.__gsOff = () => { cardBattleReset(); followerProjectiles.length = 0; invReset(); playerClassKey = null; weaponReset(); playerAmmo = PLAYER_AMMO_START; player.invuln = 0; player.attackCooldown = 0; };
        /* its follower's turn passed, so the cube's is up */
        globalThis.__gsUp = (f) => { _cb.acted.add(f); _cbAfterAct(frame); return _cbCurrent() === player; };
        /* the game's own frames till the turn is no longer the cube's burst (the rounds fly, the gun cycles) */
        globalThis.__gsBurst = () => { let n = 0; for (; n < 600 && cardBattleTurnInfo() && cardBattleTurnInfo().who === 'act' && cardBattleTurnInfo().kind === 'shoot'; n++) _simStep(false); return n; };`);
    check('with no weapon in hand the cube has no turn (§2.10, as before): no class, a Technomancer, a Gunslinger before the locker; the round goes from your followers to the enemies', () => {
        const r = J(`(function(){ const o = {}; for (const cls of [null, 'technomancer', 'gunslinger']) { __fresh(1); invReset(); playerClassKey = null; if (cls) classSet(cls); playerAmmo = 20; const f = followers[0]; f.health = f.maxHealth = 1e5; const a = __ant(player.x + 2, player.y); a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1); __nextTo(f, a);
                const row = [_cbYouIn(), _cbCurrent() === f, cardBattlePlay(player, 'shoot', null, a)]; _cb.acted.add(f); _cbAfterAct(frame); row.push(_cbCurrent() === player, cardBattleTurnInfo().who, playerAmmo); o[cls || 'none'] = row.join(); __gsOff(); } return o; })()`);
        for (const k of ['none', 'technomancer', 'gunslinger']) same(r[k], 'false,true,false,false,foe,20', k + ' (in it, its follower first, a SHOOT played, its turn, whose turn after its follower, its rounds)');
    });
    check('a Gunslinger with the machine gun and rounds has its own turn every round, after its followers: not before them, then the pop-up is its; its cards are SHOOT (4 to 5 rounds, the gun\'s damage a round, the ammunition on its foot), SMASH (§2.69) and HOLD FIRE', () => {
        const r = J(`(function(){ const { f, a } = __gs(20); const o = { in: _cbYouIn(), first: _cbCurrent() === f, early: cardBattlePlay(player, 'shoot', null, a), ammo0: playerAmmo };
            o.up = __gsUp(f); o.who = cardBattleTurnInfo().who; const cs = cardBattleCards(player); o.kinds = cs.map(c => c.kind + ':' + c.ready).join(); o.fx = cs[0].fx; o.html = _cbCardHTML(cs[0]); o.round = _cb.round; __gsOff(); return o; })()`);
        same(r.in, true, 'the cube is in the battle\'s turns'); same(r.first, true, 'its follower is not first'); same(r.early, false, 'SHOOT played before its turn'); same(r.ammo0, 20, 'rounds spent early'); same(r.up, true, 'its turn does not follow its followers\''); same(r.who, 'you', 'whose turn'); same(r.round, 1, 'the round');
        same(r.kinds, 'shoot:true,smash:true,pass:true', 'its cards'); same(r.fx, '4 to 5 rounds at one enemy, at once: 8 a round.', 'SHOOT\'s words'); ok(/class="cb-st">AMMO 20</.test(r.html) && /cb-shoot ready/.test(r.html) && />SHOOT</.test(r.html), 'the card (its foot says the ammunition): ' + r.html);
    });
    check('SHOOT goes off at once (no charge, no cooldown): a burst of 4 or of 5 rounds at the gun\'s own rate, each the gun\'s damage and a round spent, the enemy hurt by all of them; then the enemies\' turn; the next round the cube has its turn again, its card ready', () => {
        const r = J(`(function(){ const o = {}, keep = Math.random; try { for (const [k, rnd] of [['four', 0], ['five', 0.99]]) { Math.random = () => rnd; const { f, a } = __gs(20); __gsUp(f); const s0 = playerShotsFired, h0 = a.health, r0 = _cb.round;
                    const row = { played: cardBattlePlay(player, 'shoot', null, a) }; const T = cardBattleTurnInfo(); row.act = [T.who, T.actor === player, T.kind].join(); row.frames = __gsBurst(); row.shots = playerShotsFired - s0; row.ammo = playerAmmo; row.dealt = h0 - a.health;
                    row.each = weaponDamage() * defenseMult(a, { x: player.x, y: player.y }) * dmgRowMult(dmgRow(a), 'projectile'); row.after = cardBattleTurnInfo().who === 'foe' || _cb.round > r0;   /* (the enemies' turn: or already over, the test's enemy, which cannot walk, having none to bite: the one who hurt it most is the cube, §2.46) */ row.charge = _cb.charge.size;
                    if (k === 'four') { __toYou(); row.round = _cb.round; row.again = __gsUp(f); row.ready = cardBattleCards(player)[0].ready; row.foot = /AMMO 16</.test(_cbCardHTML(cardBattleCards(player)[0])); } o[k] = row; __gsOff(); } } finally { Math.random = keep; } return o; })()`);
        for (const [k, n] of [['four', 4], ['five', 5]]) { const x = r[k]; same(x.played, true, k + ': played'); same(x.act, 'act,true,shoot', k + ': its turn'); same(x.shots, n, k + ': rounds fired'); same(x.ammo, 20 - n, k + ': rounds left'); ok(Math.abs(x.dealt - n * x.each) < 0.5 * n + 1, k + ': the enemy took ' + x.dealt + ', not ' + n + ' × ' + x.each);
            ok(x.frames >= (n - 1) * 11 && x.frames < 300, k + ': the burst took ' + x.frames + ' frames'); same(x.after, true, k + ': the enemies\' turn after it'); same(x.charge, 0, k + ': a charge'); }
        same(r.four.round, 2, 'the next round'); same(r.four.again, true, 'its turn again the next round'); same(r.four.ready, true, 'SHOOT ready again (no cooldown)'); same(r.four.foot, true, 'the ammunition on its foot the next round');
    });
    check('fewer rounds than the burst: it fires what it has; with none left SHOOT is not ready (NO AMMO on its foot) and a drop of it plays nothing, though the cube still has its turn, for SMASH (§2.69); an enemy that falls ends the burst and the rounds not fired are kept', () => {
        const r = J(`(function(){ const o = {}, keep = Math.random; try { Math.random = () => 0.99; let g = __gs(2); __gsUp(g.f); const s0 = playerShotsFired; const r0 = _cb.round; cardBattlePlay(player, 'shoot', null, g.a); __gsBurst(); o.few = [playerShotsFired - s0, playerAmmo, cardBattleTurnInfo().who === 'foe' || _cb.round > r0].join();
                __toYou(); o.next = [_cbYouTurn(), __gsUp(g.f), cardBattleCards(player)[0].ready, /NO AMMO</.test(_cbCardHTML(cardBattleCards(player)[0])), cardBattlePlay(player, 'shoot', null, g.a), _cb.say && _cb.say.text, cardBattleCards(player)[1].ready].join(); __gsOff();
                g = __gs(20, 3); const b = __ant(player.x + 2, player.y + 1); b.health = b.maxHealth = 9999; _cb.foes.push(b); __gsUp(g.f); const s1 = playerShotsFired; cardBattlePlay(player, 'shoot', null, g.a); __gsBurst(); o.kill = [g.a.dead || g.a.health <= 0, playerShotsFired - s1 < 5, playerAmmo === 20 - (playerShotsFired - s1), b.health].join(); __gsOff();
            } finally { Math.random = keep; } return o; })()`);
        same(r.few, '2,0,true', 'two rounds left (fired, left, the enemies\' turn after)'); same(r.next, 'true,true,false,true,false,YOU · NO AMMO,true', 'the next round with none (its turn, up after its follower, SHOOT ready, NO AMMO on its foot, SHOOT played, what the banner says, SMASH ready)'); same(r.kill, 'true,true,true,9999', 'an enemy that falls (down, the burst cut short, only the rounds fired spent, the other enemy unhurt)');
    });
    check('HOLD FIRE passes its turn and keeps the rounds; a drop on an enemy with no clear shot says so and plays nothing; out of its own burst the gun still holds its fire in a battle (§2.10)', () => {
        const r = J(`(function(){ const o = {}; let g = __gs(20); o.held = [firePlayerShot(g.a) === true, cardBattleShooting(), playerAmmo].join(); __gsUp(g.f); o.pass = [cardBattlePlay(player, 'pass', null, null), playerAmmo, cardBattleTurnInfo().who, _cb.youActed].join(); __gsOff();
            g = __gs(20); __gsUp(g.f); const keep = facilityShotClear; facilityShotClear = () => false; try { o.blocked = [cardBattlePlay(player, 'shoot', null, g.a), _cb.say && _cb.say.text, cardBattleTurnInfo().who, playerAmmo, _cbCurrent() === player].join(); } finally { facilityShotClear = keep; }
            o.then = cardBattlePlay(player, 'pass', null, null); __gsOff(); return o; })()`);
        same(r.held, 'false,false,20', 'the gun outside its burst (fired, shooting, rounds)'); same(r.pass, 'true,20,foe,true', 'HOLD FIRE (played, rounds, whose turn after, its turn had)'); same(r.blocked, 'false,YOU · NO CLEAR SHOT,you,20,true', 'no clear shot'); same(r.then, true, 'HOLD FIRE after it');
    });
    check('SMASH (§2.69; the owner: "a close up smash with the gun", "About a burst (36)", "Free, every round"): on an enemy next to the cube the blow lands at once for 36, Crushing, with no round spent; then the enemies\' turn; ready again the next round, with or without rounds', () => {
        const r = J(`(function(){ const o = {}; const { f, a } = __gs(0); o.next = __nextTo(player, a); __gsUp(f); const c = cardBattleCards(player).find(c => c.kind === 'smash'); o.card = [c.ready, c.fx, /cb-smash ready/.test(_cbCardHTML(c)), />READY</.test(_cbCardHTML(c))].join('|');
            const h0 = a.health, r0 = _cb.round, s0 = playerShotsFired; o.reach = _cbCanHit(player, a, 'smash'); o.played = cardBattlePlay(player, 'smash', null, a); const T = cardBattleTurnInfo(); o.act = [T.who, T.actor === player, T.kind, !!_cb.turn.walk].join();
            let n = 0; for (; n < 300 && cardBattleTurnInfo().kind === 'smash'; n++) _simStep(false); o.frames = n; o.dealt = h0 - a.health; o.want = CARD_BATTLE.smash.damage * defenseMult(a, { x: player.x, y: player.y }) * dmgRowMult(dmgRow(a), 'crushing');
            o.free = [playerAmmo, playerShotsFired - s0].join(); o.after = cardBattleTurnInfo().who === 'foe' || _cb.round > r0; o.hit = [DMG_HIT_SMASH.type, DMG_HIT_SMASH.player, CARD_BATTLE.smash.damage].join();
            __toYou(); o.again = [__gsUp(f), cardBattleCards(player).find(c => c.kind === 'smash').ready].join(); __gsOff(); return o; })()`);
        same(r.next, true, 'fixture: the cube next to the enemy'); same(r.card, 'true|A blow with the gun on an enemy next to you: 36, no ammo. Too far, you walk up.|true|true', 'its card'); same(r.reach, true, 'in reach'); same(r.played, true, 'played'); same(r.act, 'act,true,smash,false', 'its turn (no walk)');
        ok(Math.abs(r.dealt - r.want) < 1.5, 'the blow took ' + r.dealt + ', not ' + r.want); ok(r.frames >= 20 && r.frames < 120, 'its turn took ' + r.frames + ' frames'); same(r.free, '0,0', 'rounds (left, fired)'); same(r.after, true, 'the enemies\' turn after it'); same(r.hit, 'crushing,true,36', 'its kind of hit and its damage');
        same(r.again, 'true,true', 'the next round (its turn, SMASH ready)');
    });
    check('SMASH on an enemy out of reach: the cube\'s turn is a walk towards it, by its own pace on the squares, round everyone, as a follower\'s (§2.39); nothing is hit, no round spent, where it stops is its square, nearer the enemy; the card is ready the next round and, next to it then, the blow lands', () => {
        const r = J(`(function(){ const o = {}; const { f, a } = __gs(20); const far = __ant(player.x, player.y); far.element = null; far.health = far.maxHealth = 9999; _cb.foes.push(far);
            /* an enemy put on a free square of the room 4 to 6 squares from the cube's, in its sight */
            const p0 = _cbSq(player), taken = new Set([..._cb.slots.values()].map(q => q.x + ',' + q.y)); let spot = null; for (const c of partyRoomCells(_cb.lay.room)) { const d = Math.hypot(c[0] - p0[0], c[1] - p0[1]); if (d >= 4 && d <= 6 && !taken.has(c[0] + ',' + c[1]) && facilitySeesFrom(p0[0], p0[1], c[0], c[1])) { spot = c; break; } }
            o.spot = !!spot; if (!spot) { __gsOff(); return o; } far.x = spot[0]; far.y = spot[1]; _cb.slots.set(far, { x: spot[0], y: spot[1] });
            __gsUp(f); o.tiles = _cbTiles(player); o.reach = _cbCanHit(player, far, 'smash'); const d0 = Math.hypot(p0[0] - spot[0], p0[1] - spot[1]), h0 = far.health;
            o.played = cardBattlePlay(player, 'smash', null, far); o.walk = _cb.turn.walk ? _cb.turn.walk.length : 0; o.walking = cardBattleWalking(player);
            let n = 0; for (; n < 600 && cardBattleTurnInfo().kind === 'smash'; n++) _simStep(false); const p1 = _cbSq(player), d1 = Math.hypot(p1[0] - spot[0], p1[1] - spot[1]);
            o.moved = [d1 < d0 - 0.9, Math.abs(player.x - p1[0]) < 0.6 && Math.abs(player.y - p1[1]) < 0.6, far.health === h0, playerAmmo].join(); o.steps = Math.max(Math.abs(p1[0] - p0[0]), Math.abs(p1[1] - p0[1])) <= o.tiles;
            o.mine = _cbGrid(f).taken.has(Math.round(p1[0]) + ',' + Math.round(p1[1]));
            /* the rounds after: SMASH again each of its turns, till it is next to it and the blow lands */
            let landed = false; for (let k = 0; k < 4 && !landed; k++) { __toYou(); if (!__gsUp(f)) break; cardBattlePlay(player, 'smash', null, far); for (let m = 0; m < 600 && cardBattleTurnInfo().kind === 'smash'; m++) _simStep(false); landed = far.health < h0; }
            o.landed = landed; o.dealt = h0 - far.health; __gsOff(); return o; })()`);
        same(r.spot, true, 'fixture: a far square in sight'); same(r.tiles, 3, 'the cube\'s pace on the squares (the walker\'s own pace, as a follower\'s: 3)'); same(r.reach, false, 'in reach at the start'); same(r.played, true, 'played'); ok(r.walk >= 1 && r.walk <= 3, 'its walk: ' + r.walk + ' squares'); same(r.walking, true, 'the battle is not walking it');
        same(r.moved, 'true,true,true,20', 'after its walk (nearer the enemy, on its new square, the enemy unhurt, its rounds)'); same(r.steps, true, 'it walked further than its pace'); same(r.mine, true, 'its square does not stand in a follower\'s way');
        same(r.landed, true, 'the blow never landed on a later turn'); ok(r.dealt > 0, 'the blow took ' + r.dealt);
    });
    check('the pieces of it: the shot is let through only for its burst (js/input.js); SHOOT and HOLD FIRE have no shape (js/cardshapes.js); the banner names it; a new battle starts it afresh', () => {
        const inp = rd('js/input.js'), cb = rd('js/cardbattle.js');
        ok(/cardBattleTurn\(\) && !\(typeof cardBattleShooting === "function" && cardBattleShooting\(\)\)\) return;/.test(inp), 'js/input.js firePlayerShot');
        same(J(`cardShapeDef(player, 'smash', null)`), null, 'SMASH\'s shape'); ok(/T\.kind === "smash" \? "SMASH"/.test(cb), 'the banner names SMASH');
        const r = J(`[cardShapeDef(player, 'shoot', null), cardShapeDef(player, 'pass', null), (() => { _cb.youActed = true; _cb.shooting = true; cardBattleReset(); return [_cb.youActed, _cb.shooting].join(); })()]`);
        same(r[0], null, 'SHOOT\'s shape'); same(r[1], null, 'HOLD FIRE\'s shape'); same(r[2], 'false,false', 'after a reset'); ok(/T\.kind === "shoot" \? "SHOOT"/.test(cb), 'the banner'); ok(/if \(off \|\| D\.kind === "pass"\) cardBattlePlay/.test(cb), 'HOLD FIRE by a tap');
    });

    group('THE MUTATOR\'S TURN (§2.70; the owner, 2026-11-21: "you could make it to where the mutator can use his healing serum to affect the team whenever it\'s available in the card battles"; asked: "The whole squad", "Over 3 turns: 24%, 24%, 12%", "On its own turn each round")');
    run(`globalThis.__mu = (serums) => { __fresh(2); invReset(); playerClassKey = null; classSet('mutator'); playerInv = {}; if (serums) invAdd('healing_serum', serums); player.invuln = 1e6; health = PLAYER_HITS;
            for (const f of followers) { f.role = 'brawler'; f.maxHealth = 1000; f.health = 100; } const a = __ant(player.x + 2, player.y); a.element = null; a.health = a.maxHealth = 9999; cardBattleChoose(a); __ticks(1); return { fs: followers.slice(), a }; };   /* (the enemy cannot walk and stands next to nobody: its turns pass with no bite, so the healing is all that moves its squad's health) */
        globalThis.__muOff = () => { cardBattleReset(); invReset(); playerClassKey = null; weaponReset(); player.invuln = 0; };
        globalThis.__muUp = (fs) => { for (const f of fs) _cb.acted.add(f); _cbAfterAct(frame); return _cbCurrent() === player; };
        /* the cube's serum turn played out (the battle's own frames), to the next turn of yours */
        globalThis.__muOn = () => { for (let i = 0; i < 400 && cardBattleTurnInfo() && cardBattleTurnInfo().kind === 'serum'; i++) { frame++; cardBattleTick(); } __toYou(); };`);
    check('a Mutator with no serum has no turn (and no other class has this one); carrying one, its turn follows its followers\': its cards are HEALING SERUM (the serums it carries on its foot, its turns\' worth in its words) and HOLD; the turns\' worth come from the pool\'s own numbers: 24%, 24%, 12%', () => {
        const r = J(`(function(){ const o = {}; let g = __mu(0); o.none = [_cbYouKind(), _cbYouTurn(), __muUp(g.fs), cardBattlePlay(player, 'serum', null, null)].join(); __muOff();
            g = __mu(2); o.first = _cbCurrent() === g.fs[0]; o.early = cardBattlePlay(player, 'serum', null, null); o.up = __muUp(g.fs); const cs = cardBattleCards(player); o.kinds = cs.map(c => c.kind + ':' + c.ready).join(); o.fx = cs[0].fx; o.html = _cbCardHTML(cs[0]); o.hold = cs[1].name + '|' + cs[1].fx;
            o.doses = _cbSerumDoses().map(v => Math.round(v * 100)).join(); o.gun = [cardBattlePlay(player, 'shoot', null, g.a), cardBattlePlay(player, 'smash', null, g.a)].join(); __muOff();
            __fresh(1); invReset(); playerClassKey = null; classSet('technomancer'); playerInv = {}; invAdd('healing_serum', 1); o.tech = [_cbYouKind(), _cbYouIn()].join(); __muOff(); return o; })()`);
        same(r.none, 'serum,false,false,false', 'with no serum (its kind of turn, a turn, up after its followers, a serum played)'); same(r.first, true, 'its follower is not first'); same(r.early, false, 'a serum played before its turn'); same(r.up, true, 'its turn does not follow its followers\'');
        same(r.kinds, 'serum:true,pass:true', 'its cards'); same(r.fx, 'Heals your whole squad: 24% now, then 24% and 12% as the enemy turns begin.', 'the serum\'s words'); ok(/class="cb-st">SERUM 2</.test(r.html) && /cb-serum ready/.test(r.html) && />HEALING SERUM</.test(r.html), 'the card (its foot says the serums carried): ' + r.html); same(r.hold, 'HOLD|Keep your serum: your turn passes.', 'HOLD');
        same(r.doses, '24,24,12', 'the turns\' worth (js/serum.js SERUM.splash: 10 beats of 6%, 4 a turn)'); same(r.gun, 'false,false', 'a Mutator played the Gunslinger\'s cards'); same(r.tech, ',false', 'a Technomancer carrying a serum');
    });
    check('HEALING SERUM played: one serum spent; every one of the squad still up is healed 24% of its own health at once, wherever it stands; then 24% and 12% as the next two enemy turns begin (60% in all), and no more after; one at full health gains nothing; one that is down is not raised', () => {
        const r = J(`(function(){ const o = {}; const g = __mu(2), [f1, f2] = g.fs; f2.health = 990; const far = partyRoomCells(_cb.lay.room).slice().sort((p, q) => Math.hypot(q[0] - player.x, q[1] - player.y) - Math.hypot(p[0] - player.x, p[1] - player.y))[0]; f1.x = far[0]; f1.y = far[1]; _cb.slots.set(f1, { x: far[0], y: far[1] });
            __muUp(g.fs); const r0 = _cb.round; o.played = cardBattlePlay(player, 'serum', null, null); const T = cardBattleTurnInfo(); o.act = [T.who, T.actor === player, T.kind].join(); o.now = [f1.health, f2.health, invCount('healing_serum'), _cb.serums.length, _cb.serums[0].left.length].join();
            __muOn(); o.second = [f1.health, _cb.round - r0, _cb.serums.length ? _cb.serums[0].left.length : 0].join();
            __muUp(g.fs); cardBattlePlay(player, 'pass', null, null); __toYou(); o.third = [f1.health, _cb.serums.length, invCount('healing_serum')].join();
            __muUp(g.fs); cardBattlePlay(player, 'pass', null, null); __toYou(); o.after = f1.health; o.said = floatingTexts.some(t => t.world && /^\\+\\d+$/.test(t.text));
            __muOff(); return o; })()`);
        same(r.played, true, 'played'); same(r.act, 'act,true,serum', 'its turn'); same(r.now, '340,1000,1,1,2', 'at once (the far one 100 + 24% of 1000; the one near full capped; serums left; a serum at work, its turns\' worth left)');
        same(r.second, '580,1,1', 'as the next enemy turn begins (its health, the round on, turns\' worth left)'); same(r.third, '700,0,1', 'as the one after begins (its health, serums at work, serums carried: HOLD kept it)'); same(r.after, 700, 'a turn later'); same(r.said, true, 'no green +n over the healed');
    });
    check('HOLD keeps the serum; two serums at work add up; HERBALIST\'s stronger pool heals half as much again here; one of the squad that is down is not raised; a new battle starts with none at work', () => {
        const r = J(`(function(){ const o = {}; let g = __mu(2); __muUp(g.fs); o.hold = [cardBattlePlay(player, 'pass', null, null), invCount('healing_serum'), g.fs[0].health].join(); __muOff();
            g = __mu(2); g.fs[1].health = 0; g.fs[1].dead = true; __ticks(2); __muUp(g.fs); cardBattlePlay(player, 'serum', null, null); o.down = [g.fs[0].health, g.fs[1].health, g.fs[1].dead].join(); __muOn();
            __muUp(g.fs); cardBattlePlay(player, 'serum', null, null); o.two = [g.fs[0].health, _cb.serums.length, invCount('healing_serum')].join(); __muOff(); o.reset = _cb.serums.length;
            g = __mu(1); const keep = playerSerumHealMult; playerSerumHealMult = () => 1.5; try { __muUp(g.fs); cardBattlePlay(player, 'serum', null, null); o.herb = g.fs[0].health; } finally { playerSerumHealMult = keep; } __muOff(); return o; })()`);
        same(r.hold, 'true,2,100', 'HOLD (played, serums, its follower\'s health)'); same(r.down, '340,0,true', 'one of the squad down (the other healed, it not)'); same(r.two, '820,2,0', 'a second serum the next round (100 + 24% + 24% of the first + 24% of the second; two at work; none carried)'); same(r.reset, 0, 'serums at work after the battle'); same(r.herb, 460, 'with HERBALIST (24% × 1.5)');
    });
    check('ASH SURGEON or PLAGUE DOCTOR worn (the owner, 2026-11-21, of their pool statuses in a battle, where there is no pool: "just make them do moderate damage"): each turn\'s worth of a serum also hits every enemy of the battle in the role\'s element, 10, 10 and 5; the card says so; with no such role, and with HERBALIST, the enemies are not touched', () => {
        const r = J(`(function(){ const o = {}, keep = playerMutRole; const run = (role) => { const g = __mu(1), b = __ant(player.x + 2, player.y + 1); b.element = null; b.health = b.maxHealth = 9999; _cb.foes.push(b); playerMutRole = () => role;
                __muUp(g.fs); const fx = cardBattleCards(player)[0].fx, h = () => [g.a.health, b.health]; cardBattlePlay(player, 'serum', null, null); const h1 = h(); __muOn(); const h2 = h(); __muUp(g.fs); cardBattlePlay(player, 'pass', null, null); __toYou(); const h3 = h();
                const per = dmgRowMult(dmgRow(g.a), 'elemental') * defenseMult(g.a, { x: player.x, y: player.y }); const row = { fx, d: [9999 - h1[0], h1[0] - h2[0], h2[0] - h3[0]].map(v => Math.round(v / per * 10) / 10).join(), both: Math.abs((9999 - h3[0]) - (9999 - h3[1])) < 0.01, healed: g.fs[0].health }; __muOff(); return row; };
            try { o.ash = run({ match: 'mutator', kit: { el: 'fire', pool: true } }); o.herb = run({ match: 'mutator', kit: { el: 'blossom', biteMend: true, poolHeal: 0.5 } }); o.none = run(null); } finally { playerMutRole = keep; }
            o.bite = CARD_BATTLE.serum.bite; o.roles = ['ash_surgeon', 'plague_doctor', 'herbalist'].map(id => !!EQUIP_CARDS[id].kit.pool).join(); return o; })()`);
        same(r.bite, 10, 'a full turn\'s worth on an enemy'); same(r.roles, 'true,true,false', 'the roles whose kit is the pool\'s (ASH SURGEON, PLAGUE DOCTOR; not HERBALIST)');
        same(r.ash.d, '10,10,5', 'with ASH SURGEON: what the enemy takes, turn by turn (before its own resistances)'); same(r.ash.both, true, 'every enemy the same'); same(r.ash.healed, 700, 'the healing is as it was'); same(r.ash.fx, 'Heals your squad 24%, 24%, 12% and hits every enemy 10, 10, 5, turn by turn.', 'the card\'s words');
        same(r.herb.d, '0,0,0', 'with HERBALIST'); same(r.none.d, '0,0,0', 'with no role'); same(r.none.fx, 'Heals your whole squad: 24% now, then 24% and 12% as the enemy turns begin.', 'the card\'s words with no role');
    });
    check('the pieces of it: the serum has no shape and is let go anywhere over the fight (not by a tap); the enemies\' turn begins with the serums\' next turn\'s worth; the banner names it', () => {
        const cb = rd('js/cardbattle.js'); same(J(`cardShapeDef(player, 'serum', null)`), null, 'its shape');
        ok(/if \(D\.kind === "pass" \|\| D\.kind === "serum"\) return true;/.test(cb), 'the drag'); ok(/if \(off \|\| D\.kind === "pass"\) cardBattlePlay/.test(cb), 'a tap plays a serum'); ok(/if \(!run\) _cbSerumDose\(\);/.test(cb), 'the enemies\' turn'); ok(/T\.kind === "serum" \? "HEALING SERUM"/.test(cb), 'the banner');
    });

    group('THE PIECES');
    check('the page loads js/cardbattle.js (and its boot check); the tap, the hit, the prey, the squad, the gun, the step and the edges ask it; the 3D view\'s camera reads it', () => {
        const html = rd('game.html'), view = rd('view3d/gameview.js') + rd('view3d/gamemap.js');
        ok(/<script src="js\/cardbattle\.js\?v=/.test(html) && /"js\/cardbattle\.js": "CARD_BATTLE"/.test(html), 'the page');
        ok(/<script src="js\/cardbattle\.js\?v=[^"]+"><\/script>\n<script src="js\/cardshapes\.js\?v=/.test(html) && /"js\/cardshapes\.js": "CARD_SHAPES"/.test(html), 'the page loads js/cardshapes.js after it, with its boot check');
        ok(/cardShapeFoes\(x, y, r\)/.test(rd('js/evolution.js')) && /cardShapeSees\(a\)\) \|\| typeof facilitySeesFrom/.test(rd('js/evolution.js')) && /cardShapeSpared\(target, source\)\) return;/.test(rd('js/helpers.js')) && /cardShapeShot\(p, actor\)/.test(rd('js/clone.js')) && /p\._cbOnly && !p\._cbOnly\.has\(a\)/.test(rd('js/game.js')) && /cardBattleWalking\(_a\) \|\| cardBattleWalking\(_b\)/.test(rd('js/game.js')) && (rd('js/elements.js').match(/!e\._cbHeld/g) || []).length === 5, 'the shapes\' hooks (§2.48) and the walk\'s (the spacing)');
        ok(/cardBattlePush\(t, t\.x - from\.x, t\.y - from\.y, push \//.test(rd('js/combat.js')) && /\n    _cbPushes\(\);/.test(rd('js/cardbattle.js')) && /cardBattlePush\(a, dx, dy, MIMIC_PUSH\)\) continue;/.test(rd('js/evolution.js')) && /cardBattlePush\(v, dx, dy, def\.knockback \//.test(rd('js/abilities.js')) && /cardBattlePull\(a, target\.x, target\.y, 0\.12 \/ KNOCK_PER_TILE\)/.test(rd('js/elements.js')) && /_csVortexPull\(e\); fieldBite\(e, "electric"\)/.test(rd('js/cardshapes.js')), 'the pushes\' hooks (§2.63): the knock, the shoves by hand, the vortex\'s pull, each frame of the turns');
        ok(/cardBattleStatusHeld\(actor\)\)\) statusTimersStep\(actor\)/.test(rd('js/combat.js')) && (rd('js/combat.js').match(/cardBattleStatusOk\(t\)/g) || []).length === 6 && /cardBattleStatusHeld\(this\)/.test(rd('js/predator.js')) && /cardBattleTouches\(this, a\)/.test(rd('js/predator.js')) && /cardBattleStatusOk\(actor\)/.test(rd('js/abilities.js')) && /cardBattleTouches\(pred, victim\)/.test(rd('js/abilities.js')) && (rd('js/evolution.js').match(/cardBattleTouches\(/g) || []).length === 5 && (rd('js/elements.js').match(/cardBattleTouches\(actor, a\)/g) || []).length === 6, 'the statuses\' clock and the splash\'s bounds (§2.52)');
        ok(/cardBattleTap\(ex, ey\)/.test(rd('js/targeting.js')) && /cardBattleMayTarget/.test(rd('js/targeting.js')), 'the tap and the gun');
        ok(/cardBattleHit\(target, source\)/.test(rd('js/helpers.js')), 'the hit'); ok(/cardBattleBars\(p, a\)/.test(rd('js/predator.js')), 'the prey'); ok(/cardBattleMayTarget\(a, actor\)/.test(rd('js/npc.js')), 'the squad');
        ok(/cardBattleTick\(\)/.test(rd('js/game.js')) && /cardBattlePost\(\)/.test(rd('js/game.js')), 'the step and the edges');
        ok(/get battleCam\(\)/.test(view) && /GM\.battleCam/.test(view) && /battling\(\)/.test(view), 'the 3D view');
        ok(/cardBattleHit\(target, source\)\) return;/.test(rd('js/helpers.js')) && /cardBattleHit\(player, source\)\) return false;/.test(rd('js/helpers.js')) && /cardBattleNoFight\(\)\) return;/.test(rd('js/input.js')) && /_noFight/.test(rd('js/evolution.js')) && /cardBattleNoFight\(f\)\) return false;/.test(rd('js/elements.js')) && /cardBattleNoFight\(\) && typeof cardBattleChoose/.test(rd('js/mixtool.js')) && /cardBattleNoFight\(pred\)/.test(rd('js/abilities.js')), 'either a battle or none (§2.35): the blow, the gun, the second attack, the Ultimate, ATTACK, the clone\'s special');
        ok(/cardBattleHurt\(target, source, dmg\);/.test(rd('js/helpers.js')) && !/cardBattleDamageMult|tankHit/.test(rd('js/helpers.js') + rd('js/cardbattle.js')) && !/cardBattleTaunted/.test(rd('js/abilities.js')), 'the focus (§2.46): js/helpers.js tells the battle each blow; no damage share for a play style; no taunt left in js/abilities.js');
        ok(/cardBattleStands\(actor\)/.test(rd('js/npc.js')) && /cardBattleOverLow\(ox, oy\)/.test(rd('js/facility.js')) && /cardBattleReticles\(\)\) return;/.test(rd('js/gunfire.js')) && /cardBattleAiming\(\)\)\) \{ const k = age/.test(rd('js/targeting.js')) && /screenNow\(x, y, hPx\) \{ const v = SCR\.set/.test(rd('view3d/gameview.js')), 'the reticles, the shots over low objects, the moves (§2.37 to §2.39): the gun\'s corners and its locking-on, the 3D view\'s point, the cover rule, the Mage\'s stand');
        ok(/cardBattleClock\(\)/.test(rd('js/antraids.js')) && (rd('js/facilityspawn.js').match(/cardBattleClock\(\)/g) || []).length === 3 && /cardBattleClock\(\)/.test(rd('js/crystalpower.js')) && /cardBattleClock\(\)/.test(rd('js/stations.js')) && /cardBattleRest\(this\)/.test(rd('js/predator.js')), 'the countdowns ask the clock (§2.30): the raids, the three spawns, the refill, the turrets, the bites');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
