// THE PLAYER'S PART IN A FIGHT (docs/PLAYER-COMBAT.md), step 1 (build 2026-11-11e): the bars come back, and the repair kit; step 2 (build 2026-11-11f): GUARD and STUN DIVE.
// The owner, 2026-11-11: "B built on A"; the refill "Slow" (after 10 s out of danger, a bar every 8 s); repair kits from "Both" (creature drops, and spots in the facility that fill again).
//   THE REFILL   no bar before 10 s out of danger, then one, then one every 8 s, never past three; a hit or a creature near starts the wait again
//   THE KIT      one bar back from the pack (USE), refused when full; the KIT pill by the dial and the H key use one
//   WHERE FROM   a kill sometimes drops one (never a test boss); three spots in the facility, on its floor, back three minutes after one is taken, not saved as taken; its own model on the floor
const fs = require('fs'), vm = require('vm'), path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
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
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; canvas.width = 1280; canvas.height = 860; innerWidth = 1100; _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3;
        globalThis.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
        globalThis.__calm = () => { actors = actors.filter(a => !(a instanceof Predator)); };
        globalThis.__run = (n) => { for (let i = 0; i < n; i++) { frame++; if (player.invuln > 0) player.invuln--; playerCombatTick(); } };
        const C = _fp.F.byId.get('crystal_chamber').bb; __put((C[0] + C[2]) / 2, (C[1] + C[3]) / 2 + 2); __calm();`);

    group('THE REFILL: out of danger, the bars come back slowly');
    check('down to one bar and out of danger: nothing for 10 s; at 10 s a bar comes back, at 18 s the third; never past three', () => {
        const r = J(`(function(){ __calm(); health = 1; player.lastHitAt = 0; player._pcSafe = undefined; __run(1); const o = [];
            __run(PLAYER_COMBAT.refill.after - 2); o.push(health); __run(2); o.push(health); __run(PLAYER_COMBAT.refill.every - 2); o.push(health); __run(2); o.push(health); __run(3000); o.push(health); return o; })()`);
        same(J('[PLAYER_COMBAT.refill.after, PLAYER_COMBAT.refill.every]').join(), '600,480', 'the owner\'s "Slow" (frames)');
        same(r.join(), '1,2,2,3,3', 'the bars over time (just before 10 s, at 10 s, just before 18 s, at 18 s, long after)');
    });
    check('a hit starts the wait again; so does a creature coming near (in sight): no bar comes back while one is about', () => {
        const r = J(`(function(){ const o = {}; __calm(); health = 2; player.lastHitAt = 0; player._pcSafe = undefined; player.invuln = 0; __run(PLAYER_COMBAT.refill.after - 50);
            hurtPlayer(1, 0, null); o.afterHit = health; __run(PLAYER_COMBAT.refill.after - 10); o.waited = health; __run(20); o.back = health;
            health = 1; const p = spawnCreature({ species: 'ant', className: 'worker', x: player.x + 2, y: player.y, level: 2 }); p.provoked = false; p.state = 'idle'; p.speed = 0;
            __run(PLAYER_COMBAT.refill.after * 2); o.nearby = health; o.near = !!facilityEnemyNear(); __calm(); __run(PLAYER_COMBAT.refill.after + 20); o.gone = health; return o; })()`);
        same(r.afterHit, 1, 'the hit took a bar'); same(r.waited, 1, 'a bar came back before 10 s after the hit'); same(r.back, 2, 'no bar 10 s after the hit');
        same(r.near, true, 'the creature beside you is not near'); same(r.nearby, 1, 'a bar came back with a creature beside you'); same(r.gone, 2, 'no bar once it was gone');
    });

    group('THE REPAIR KIT');
    check('an item of the pack (a consumable for anyone, three at most, its own icon, listed in the pack); USE gives a bar back and spends it; refused, and kept, when the bars are full', () => {
        const r = J(`(function(){ const d = ITEMS.repair_kit, o = { def: [d.name, d.type, d.stack, d.classes, d.icon, !!INV_ICONS[d.icon], ITEM_ORDER.indexOf('repair_kit') >= 0] };
            playerInv = {}; invAdd('repair_kit', 2); health = 1; const a = invUse('repair_kit'); o.used = [a.ok, health, invCount('repair_kit')];
            health = PLAYER_HITS; const b = invUse('repair_kit'); o.full = [b.ok, b.why, health, invCount('repair_kit')]; return o; })()`);
        same(r.def.join(), 'REPAIR KIT,consumable,3,,repair,true,true', 'the item'); same(r.used.join(), 'true,2,1', 'used: a bar back, one spent'); same(r.full.join(), 'false,YOUR BARS ARE FULL,3,1', 'refused when full');
    });
    check('the KIT pill sits in the row by the dial while you carry one, and a tap on it uses one; so does H', () => {
        const T = rd('js/targeting.js'), I = rd('js/input.js'), P = rd('js/playercombat.js');
        ok(/if \(i === 2\) return typeof drawKitChip === "function" \? drawKitChip\(x, y, alpha\) \|\| 0 : 0;/.test(T) && /px \+= _tgPill\(i, px, y, alpha\);/.test(T), 'the pill is not drawn in the row');   // (the row's pills are js/targeting.js _tgPill's, build 2026-11-11u)
        ok(/kitChipTap\(upX, upY\)\) \{ isPressing=false; return; \}/.test(I), 'a tap on the pill is not taken');
        ok(/kit: \{ item: "repair_kit", key: "h" \}/.test(P) && /String\(e\.key \|\| ""\)\.toLowerCase\(\) !== PLAYER_COMBAT\.kit\.key/.test(P), 'the key');
        const r = J(`(function(){ playerInv = {}; ctx.measureText = () => ({ width: 40 }); const w0 = drawKitChip(100, 100, 1); invAdd('repair_kit', 1); const w1 = drawKitChip(100, 100, 1); health = 1; const hit = kitChipTap(_KITCHIP.x + 2, _KITCHIP.y + 2); return [w0, w1 > 0, hit, health, invCount('repair_kit')]; })()`);
        same(r.join(), '0,true,true,2,0', 'no pill without a kit; with one a pill, and its tap used it');
    });

    group('WHERE KITS COME FROM');
    check('a kill sometimes drops one where it fell (a pickup that is gone after a while, as the scrap); never a test boss\'s', () => {
        const r = J(`(function(){ const o = {}, keep = Math.random, A = _fp.F.byId.get('arena').bb, at = { x: (A[0] + A[2]) / 2, y: (A[1] + A[3]) / 2 };
            const p = spawnCreature({ species: 'ant', className: 'scout', x: at.x, y: at.y, level: 2 }); const before = _fp.items.length;
            try { Math.random = () => 0.01; const it = playerKitDrop(p); o.drop = it ? [it.items[0][0], it.temp, it.expires - frame] : null; Math.random = () => 0.99; o.none = playerKitDrop(p); p.noReward = true; Math.random = () => 0.01; o.boss = playerKitDrop(p); } finally { Math.random = keep; }
            o.chance = PLAYER_COMBAT.drop.chance; o.hooked = /playerKitDrop\\(predator\\)/.test(onPredatorDeath.toString()); __calm(); return o; })()`);
        same(JSON.stringify(r.drop), JSON.stringify(['repair_kit', true, J('PLAYER_COMBAT.drop.life')]), 'the drop'); same(r.none, null, 'a drop above the chance'); same(r.boss, null, 'a test boss dropped one');
        ok(r.chance > 0 && r.chance < 0.25, 'the chance is not "sometimes": ' + r.chance); same(r.hooked, true, 'a creature\'s death does not ask');
    });
    check('three spots in the facility (two in the arena, one on the Sewers\' north ledge), each on its room\'s floor; taken, a spot fills again three minutes later; a save does not keep it taken', () => {
        const r = J(`(function(){ const spots = _fp.items.filter(i => i.fp === 'pickup' && i.items.some(q => q[0] === 'repair_kit') && !i.temp), o = {};
            o.spots = spots.map(i => i.id + ':' + (facilityRoomAt(i.x, i.y, _fp.F) || {}).id + ':' + facilityWalkable(i.x, i.y, _fp.F) + ':' + i.respawn).join();
            const s = spots[0]; playerInv = {}; s.taken = false; __put(s.x, s.y); facilityPickupTick(); o.took = [s.taken, invCount('repair_kit')]; const saved = JSON.parse(JSON.stringify(facilitySaveCollect()));
            o.savedTaken = (saved.taken || []).indexOf(s.id) >= 0; __put(s.x + 20, s.y + 20); frame += s.respawn - 5; facilityPickupTick(); o.early = s.taken; frame += 10; facilityPickupTick(); o.back = s.taken; return o; })()`);
        same(r.spots, 'pk_kit_arena_n:arena:true:10800,pk_kit_arena_s:arena:true:10800,pk_kit_sewers:sewers:true:10800', 'the spots (room, on the floor, frames until back)');
        same(r.took.join(), 'true,1', 'walking over it'); same(r.savedTaken, false, 'the save keeps it taken'); same(r.early, true, 'back before three minutes'); same(r.back, false, 'not back after three minutes');
    });
    check('a kit on the floor is drawn as itself, a small case with a green plus (its model on the pickups sheet), not the white supply case', () => {
        same(J('!!(PROP_ATLAS.pickups && PROP_ATLAS.pickups.cells.repair_kit)'), true, 'its model on the pickups sheet');
        ok(/repair_kit\(\) \{/.test(rd('design/props/models/_items.js')) && /ITEMS3D\(name\)/.test(rd('design/props/models/pickups.js')), 'its model in design/props/models/_items.js (since build 2026-11-13x, shared by the pickups and the items\' icons)');
    });

    group('GUARD: a stance; shots at your squad near you hit you instead (step 2, build 2026-11-11f)');
    check('GUARD toggles on and off; you move at half speed while it is up; the player\'s step asks it; a knockout and a new game drop it', () => {
        const r = J(`(function(){ playerGuardOn = false; const o = { a: [playerGuardToggle(), playerGuardSpeed()], b: [playerGuardToggle(), playerGuardSpeed()] }; playerGuardToggle(true); playerCombatReset(); o.c = playerGuardOn; return o; })()`);
        same(r.a.join(), 'true,0.5', 'up, half speed'); same(r.b.join(), 'false,1', 'down, full speed'); same(r.c, false, 'reset left it up');
        ok(/\* \(typeof playerGuardSpeed === "function" \? playerGuardSpeed\(\) : 1\)/.test(rd('js/facilityplay.js')), 'the player\'s step does not ask the guard');
        ok(/if \(typeof playerCombatReset === "function"\) playerCombatReset\(\);   \/\/ \(the guard down, no dive/.test(rd('js/game.js')), 'a knockout does not drop the guard');
    });
    check('up: a creature\'s shot at a follower within reach is stopped and costs you one bar (inside the grace, nothing); out of reach, or not your squad, or the guard down: not stopped; the shots\' hit test asks it', () => {
        const r = J(`(function(){ const o = {}; __calm(); const f = followers[0]; f.x = player.x + 1; f.y = player.y; const shot = { targetsGreen: true, x: f.x, y: f.y };
            playerGuardOn = true; health = 3; player.invuln = 0; o.near = [playerGuardBlocks(shot, f), health]; o.grace = [playerGuardBlocks(shot, f), health]; player.invuln = 0;
            f.x = player.x + PLAYER_COMBAT.guard.reach + 0.5; o.far = playerGuardBlocks(shot, f); f.x = player.x + 1;
            o.mine = playerGuardBlocks({ targetsGreen: false, x: f.x, y: f.y }, f); playerGuardOn = false; o.down = playerGuardBlocks(shot, f); health = 3; return o; })()`);
        same(r.near.join(), 'true,2', 'stopped, one bar'); same(r.grace.join(), 'true,2', 'inside the grace: stopped, no bar'); same(r.far, false, 'stopped out of reach');
        same(r.mine, false, 'one of your own shots stopped'); same(r.down, false, 'stopped with the guard down');
        ok(/if \(p\.targetsGreen && typeof playerGuardBlocks === "function" && playerGuardBlocks\(p, a\)\) \{ hit = true; return; \}/.test(rd('js/game.js')), 'the shots\' hit test does not ask the guard');
    });

    group('STUN DIVE: the button, then a creature (step 2)');
    check('armed, a creature within reach and in sight: you swoop to its side (nothing hits you on the way) and it is stunned; then the button rests; too far, or resting: refused', () => {
        const r = J(`(function(){ const o = {}; __calm(); _pcDiveReady = 0; _pcDive = null; const A = _fp.F.byId.get('arena').bb, cx = (A[0] + A[2]) / 2, cy = (A[1] + A[3]) / 2; __put(cx, cy);
            const foe = spawnCreature({ species: 'ant', className: 'worker', x: cx + 3, y: cy, level: 2 }); foe.speed = 0; foe.stunned = 0;
            o.armed = playerDiveArm(); const res = playerDiveAt(foe); o.ok = res.ok; o.safe = player.invuln >= PLAYER_COMBAT.dive.frames; o.disarmed = playerDiveArmed;
            for (let i = 0; i < PLAYER_COMBAT.dive.frames + 2; i++) { frame++; playerCombatTick(); }
            o.beside = +Math.hypot(foe.x - player.x, foe.y - player.y).toFixed(2); o.stunned = foe.stunned > 0; o.resting = playerDiveAt(foe).why; o.arm = playerDiveArm();
            _pcDiveReady = 0; const far = spawnCreature({ species: 'ant', className: 'worker', x: player.x + PLAYER_COMBAT.dive.reach + 2, y: player.y, level: 2 }); far.speed = 0; o.far = playerDiveAt(far).why; __calm(); return o; })()`);
        same(r.armed, true, 'armed'); same(r.ok, true, 'the dive'); same(r.safe, true, 'something can hit you on the way'); same(r.disarmed, false, 'still armed after the dive');
        ok(Math.abs(r.beside - J('PLAYER_COMBAT.dive.stop')) < 0.2, 'not at its side: ' + r.beside); same(r.stunned, true, 'not stunned'); same(r.resting, 'RESTING', 'dived again at once'); same(r.arm, false, 'armed while resting'); same(r.far, 'TOO FAR', 'dived too far');
    });
    check('the two round buttons by the dial (outside the corners layout: THE CORE holds GUARD and STUN there, build 2026-11-11t): drawn left of it, a tap on GUARD toggles it and on STUN arms the dive; G and V do the same; a tap on a creature while armed dives, anywhere else puts the dive away', () => {
        const r = J(`(function(){ const keepW = innerWidth; innerWidth = 600; playerGuardOn = false; playerDiveArmed = false; _pcDiveReady = 0; ctx.measureText = () => ({ width: 30 }); drawPlayerCombatChips({ left: 900, y: 600 });
            const g = [_GUARDBTN.x, _GUARDBTN.y, _DIVEBTN.x, _DIVEBTN.y]; const t1 = playerCombatTap(_GUARDBTN.x, _GUARDBTN.y), up = playerGuardOn, t2 = playerCombatTap(_DIVEBTN.x, _DIVEBTN.y), armed = playerDiveArmed, t3 = playerCombatTap(10, 10);
            playerGuardOn = false; playerDiveArmed = false; innerWidth = keepW; return { g, t: [t1, up, t2, armed, t3] }; })()`);
        same(r.g.join(), '870,574,870,626', 'where they are (left of the dial: GUARD above, STUN below)'); same(r.t.join(), 'true,true,true,true,false', 'the taps');
        const P = rd('js/playercombat.js'), I = rd('js/input.js'), T = rd('js/targeting.js');
        ok(/guard: \{ reach: [\d.]+, speed: 0\.5, key: "g" \}/.test(P) && /key: "v" \}/.test(P) && /if \(k === PLAYER_COMBAT\.guard\.key\) playerGuardToggle\(\); else if \(k === PLAYER_COMBAT\.dive\.key\) playerDiveArm\(\);/.test(P), 'the keys');
        ok(/if \(!touchMoved && typeof playerCombatTap === "function" && playerCombatTap\(upX, upY\)\)/.test(I), 'a tap on the buttons is not taken');
        ok(/if \(typeof playerDiveArmed !== "undefined" && playerDiveArmed\) \{ const foe = findEnemyAtScreen\(ex, ey\); if \(foe\) \{ playerDiveAt\(foe\); return; \} playerDiveCancel\(\); \}/.test(I), 'the armed tap');
        ok(/drawPlayerCombatChips\(_tgAnchor\(\)\)/.test(T), 'the buttons are not drawn by the dial');
    });
    check('THE CORE on (the corners layout, build 2026-11-11t): the round buttons are not drawn and take no tap; GUARD and STUN are on the cube (js/corehud.js), which calls the same playerGuardToggle and playerDiveArm', () => {
        const r = J(`(function(){ const keepW = innerWidth; innerWidth = 1180; const on = coreOn(); playerGuardOn = false; drawPlayerCombatChips({ left: 900, y: 600 }); const o = [on, _GUARDBTN.r, _DIVEBTN.r, playerCombatTap(870, 574), playerGuardOn]; innerWidth = keepW; return o; })()`);
        same(r.join(), 'true,0,0,false,false', 'with THE CORE on (on, GUARD r, STUN r, a tap where GUARD was, guard up)');
        const C = rd('js/corehud.js'); ok(/playerGuardToggle\(\)/.test(C) && /playerDiveArm\(\)/.test(C), 'THE CORE does not call the same functions');
    });

    check('a huge body (THE ANT QUEEN\'s bodyR) is in reach when its edge is, and you stop outside it, not in it', () => {
        const r = J(`(function(){ const o = {}; __calm(); _pcDiveReady = 0; _pcDive = null; const A = _fp.F.byId.get('arena').bb, cx = (A[0] + A[2]) / 2, cy = (A[1] + A[3]) / 2; __put(cx, cy);
            const big = spawnCreature({ species: 'ant', className: 'worker', x: cx + 4, y: cy, level: 2 }); big.speed = 0; big.bodyR = 1.5;
            o.ok = playerDiveAt(big).ok; for (let i = 0; i < PLAYER_COMBAT.dive.frames + 2; i++) { frame++; playerCombatTick(); }
            o.gap = +Math.hypot(big.x - player.x, big.y - player.y).toFixed(2); _pcDiveReady = 0; __put(cx, cy);
            big.x = cx + PLAYER_COMBAT.dive.reach + 1; o.edge = playerDiveAt(big).ok; _pcDive = null; __calm(); return o; })()`);
        same(r.ok, true, 'the dive'); ok(Math.abs(r.gap - (1.5 + J('PLAYER_COMBAT.dive.stop'))) < 0.2, 'not outside its body: ' + r.gap); same(r.edge, true, 'its edge in reach, and refused');
    });
    check('a panel over the corner (the pack) hides the buttons and the pills by the dial, and their taps go with them: a tap there is the panel\'s', () => {
        const r = J(`(function(){ const keepW = innerWidth; innerWidth = 600; playerGuardOn = false; ctx.measureText = () => ({ width: 30 }); drawPlayerCombatChips({ left: 900, y: 600 }); const gx = _GUARDBTN.x, gy = _GUARDBTN.y;
            _KITCHIP.w = _POTIONCHIP.w = _SERUMCHIP.w = 40; invOpen(); drawTargetUI();
            const o = [playerCombatTap(gx, gy), playerGuardOn, _KITCHIP.w, _POTIONCHIP.w, _SERUMCHIP.w, _ATKCHIP.w]; invClose(); playerGuardOn = false; innerWidth = keepW; return o; })()`);
        same(r.join(), 'false,false,0,0,0,0', 'a hidden button or pill still takes a tap (GUARD tap, guard up, KIT, POTION, SERUM, ammunition)');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
