// THE OTHER FIVE TECHNICIANS' LEVEL 1 ABILITIES (js/techabilities.js; docs/TECHNICIANS.md): the core technician's PHOTONIC SHIELD, ...
// ASKED (the core technician): "The Core Technician deploys a photonic shield between itself and the player-selected creature, creating a defensive barrier that blocks enemy movement while allowing friendly units to pass through
// and fire through it [...] The shield lasts exactly 20 seconds after activation, then disappears automatically", then "3 wide, 3 back" and "Block attacks too"; 60 s cooldown for each of the six.
// The logic runs in the sandbox, stepping the frames the game would.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const near = (a, b, tol, m) => { if (!(Math.abs(a - b) <= tol)) throw new Error(`${m}: expected ${b} ± ${tol}, got ${a}`); };

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run('gameState.running = true; unlockedElements = new Set(ELEMENTS.map(e => e.id)); facilityPlayStart(); facilityBlackoutSet(false); canvas.width = 1280; canvas.height = 860; innerWidth = 1100;');
    // an open spot in the arena with floor all round (a shield 3 wide fits in any direction), a squad of the given elements (the first a technician), a creature that does only what the test says
    run(`globalThis.__open = (() => { const need = [[7.5, 0], [-4, 0], [0, 3], [0, -3], [4, 3], [4, -3], [6, 2.5], [-1, 2], [-1, -2]], cs = partyRoomCells('arena');
            const good = cs.filter(c => need.every(d => facilityLosFrom(c[0], c[1], c[0] + d[0], c[1] + d[1]))); return good[Math.floor(good.length / 2)] || cs[Math.floor(cs.length / 2)]; })();
        globalThis.__fresh = (els) => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0; selectedUnits.clear(); floatingTexts.length = 0; techReset(); followerProjectiles = [];
            player.x = player.targetX = player.visualX = __open[0] - 1; player.y = player.targetY = player.visualY = __open[1]; player.invuln = 0; health = PLAYER_HITS;
            els.forEach((el, i) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 1e9; f.health = f.maxHealth = 400; f.currentWill = 1e5; f.x = __open[0] + (i ? 0.3 * i : 0); f.y = __open[1] + (i ? 0.6 : 0); f.role = i === 0 ? 'camper' : 'brawler'; });
            partyTick(); techAbilityTick(); followers[0]._abReadyAt = frame; return followers.slice(); };
        globalThis.__step = (n, also) => { for (let i = 0; i < n; i++) { frame++; techAbilityTick(); for (const a of actors.slice()) if (!a.dead && (a.isFollower || (also && also.includes(a)))) updateNPC(a); } };
        globalThis.__foe = (x, y) => { const e = spawnCreature({ species: 'ant', className: 'tank' }); e.x = x; e.y = y; e.update = () => {}; e.health = e.maxHealth = 5000; e.provoked = true; e.spawnProtection = 0; return e; };
        globalThis.__walker = (e, tx, ty, sp) => { e.update = function () { const dx = tx - this.x, dy = ty - this.y, d = Math.hypot(dx, dy); if (d > 0.05) { this.x += dx / d * (sp || 0.05); this.y += dy / d * (sp || 0.05); } }; return e; };
        globalThis.__s = (W, a) => _techShieldS(W, a.x, a.y);`);

    group('THE PHOTONIC SHIELD (core)');
    check('the core technician has it (egg or evolved): PHOTONIC SHIELD, its chip ◈ SHIELD; the prompt asks for a creature (or its card)', () => {
        const r = J(`(function(){ const fs = __fresh(['core', 'fire']), t = fs[0], o = {}; o.id = (techAbilityOf(t) || {}).id; t.evolved = 'hammerslug'; o.evolved = (techAbilityOf(t) || {}).id; t.evolved = undefined;
            o.chip = techChipState(t).text; techChipTap(t); o.need = techAimNeed(); o.prompt = techAimPrompt(); techAimCancel(true); return o; })()`);
        same(r.id, 'photonic_shield', 'the core technician'); same(r.evolved, 'photonic_shield', 'evolved'); same(r.chip, '◈ SHIELD', 'the chip'); same(r.need, 'enemy', 'what it aims at'); ok(/PHOTONIC SHIELD · TAP THE CREATURE \(OR ITS CARD\)/.test(r.prompt), r.prompt);
    });
    check('where it goes: a creature 6 tiles off: across the line between them, 3 tiles in front of the technician, 3 wide; the technician holds where it is. A creature 2 tiles off: just in front of it, and the technician steps back to hold 3 behind it', () => {
        const r = J(`(function(){ const fs = __fresh(['core']), t = fs[0], o = {}; const e = __foe(t.x + 6, t.y);
            const u = techAbilityUse(t, { enemy: e }); o.ok = u.ok; const W = techShields[0];
            o.far = { d: Math.hypot(W.x - t.x, W.y - t.y), nx: W.nx, ny: W.ny, width: W.u1 - W.u0, hold: Math.hypot(t._shieldHold.x - t.x, t._shieldHold.y - t.y), foeSide: __s(W, e) > 0, techSide: __s(W, t) < 0 };
            const fs2 = __fresh(['core']), t2 = fs2[0], e2 = __foe(t2.x + 2, t2.y); techAbilityUse(t2, { enemy: e2 }); const W2 = techShields[0];
            o.close = { toFoe: Math.hypot(W2.x - e2.x, W2.y - e2.y), back: -_techShieldS(W2, t2._shieldHold.x, t2._shieldHold.y), foeSide: __s(W2, e2) > 0 };
            for (let i = 0; i < 200; i++) __step(1); o.close.held = -__s(W2, t2); return o; })()`);
        same(r.ok, true, 'used'); near(r.far.d, 3, 0.01, 'its middle from the technician'); near(r.far.nx, 1, 0.01, 'facing the creature'); near(r.far.width, 3, 0.11, 'its width'); near(r.far.hold, 0, 0.01, 'the technician\'s spot');
        same(r.far.foeSide && r.far.techSide, true, 'not between them');
        near(r.close.toFoe, 0.9, 0.01, 'in front of a near creature'); near(r.close.back, 3, 0.3, 'the technician\'s spot behind it'); same(r.close.foeSide, true, 'the creature on the far side'); near(r.close.held, 3, 0.4, 'the technician did not walk back to hold behind it');
    });
    check('it lasts exactly 20 s and then is gone; the cooldown is 60 s from when it went up; the technician stops holding when it goes', () => {
        const r = J(`(function(){ const fs = __fresh(['core']), t = fs[0], o = {}; const e = __foe(t.x + 6, t.y); const f0 = frame; techAbilityUse(t, { enemy: e });
            o.cool = techReadyIn(t); o.chip = techChipState(t).text; __step(1199); o.at1199 = techShields.length; o.holding = !!t._shieldHold; __step(1); o.at1200 = techShields.length; o.holdAfter = !!t._shieldHold; o.elapsed = frame - f0; return o; })()`);
        same(r.cool, 3600, 'the cooldown'); same(r.chip, '◈ 60 S', 'the chip'); same(r.at1199, 1, 'gone early'); same(r.holding, true, 'not holding'); same(r.at1200, 0, 'still up after 20 s'); same(r.holdAfter, false, 'still holding');
    });
    check('enemies cannot walk through it: one walking straight at the technician is held on its side for the 20 s and crosses only once it is gone; one going round an end gets by; your followers and the player walk through', () => {
        const r = J(`(function(){ const fs = __fresh(['core', 'fire']), t = fs[0], g = fs[1], o = {}; const e = __walker(__foe(t.x + 6, t.y), t.x - 2, t.y, 0.05); techAbilityUse(t, { enemy: e }); const W = techShields[0];
            let minS = 9; for (let i = 0; i < 1190; i++) { __step(1, [e]); minS = Math.min(minS, __s(W, e)); } o.minS = minS;
            __step(200, [e]); o.after = __s(W, e) < 0;
            const fs2 = __fresh(['core', 'fire']), t2 = fs2[0], g2 = fs2[1]; const e2 = __foe(t2.x + 6, t2.y); techAbilityUse(t2, { enemy: e2 }); const W2 = techShields[0];
            __walker(e2, t2.x + 3, t2.y + 3, 0.05); e2.x = t2.x + 4; e2.y = t2.y + 2.5; __walker(e2, t2.x + 2, t2.y + 2.5, 0.05); __step(120, [e2]); o.round = __s(W2, e2) < 0;
            g2.x = t2.x + 0.5; g2.y = t2.y; const gp = { x: g2.x, y: g2.y }; for (let i = 0; i < 30; i++) { const px = g2.x, py = g2.y; g2.x += 0.1; techShieldKeep(g2, px, py); } o.friend = __s(W2, g2) > 0;
            const pp = { x: player.x, y: player.y }; player.x = W2.x - 0.5; player.y = W2.y; const px = player.x; player.x += 1; techShieldKeep(player, px, player.y); o.player = __s(W2, player) > 0; return o; })()`);
        ok(r.minS >= 0.39, 'it got through, or into it: ' + r.minS); same(r.after, true, 'it never crossed after the shield was gone'); same(r.round, true, 'round an end it is stopped');
        same(r.friend, true, 'a follower is stopped'); same(r.player, true, 'the player is stopped');
    });
    check('it stops enemies\' attacks across it: a bite at a follower, at the player and at the Crystal on the far side lands nowhere (BLOCKED shows); one on its own side is bitten; an enemy\'s shot stops at it, yours go through; a creature\'s special neither aims at nor reaches the far side', () => {
        const r = J(`(function(){ const fs = __fresh(['core', 'fire', 'ice']), t = fs[0], g = fs[1], h = fs[2], o = {}; const e = __foe(t.x + 4.2, t.y); techAbilityUse(t, { enemy: e }); const W = techShields[0];
            g.spawnProtection = 0; h.spawnProtection = 0; e.power = 30;
            g.x = W.x - 0.45; g.y = W.y; e.x = W.x + 0.45; e.y = W.y; const hp0 = g.health; o.bite = e.bite(g) === g; o.hp = hp0 - g.health; o.said = floatingTexts.some(f => f.text === 'BLOCKED'); o.ripple = W.hits.length > 0;
            player.x = W.x - 0.4; player.y = W.y + 0.2; const h0 = health; e.bite(player); o.player = h0 - health;
            const c0 = crystal.health, cx = crystal.x, cy = crystal.y; crystal.x = W.x - 0.5; crystal.y = W.y - 0.2; e.bite(crystal); o.crystal = c0 - crystal.health; crystal.x = cx; crystal.y = cy;
            h.x = W.x + 1.0; h.y = W.y + 0.3; const hh = h.health; o.sameSide = e.bite(h) === h && h.health < hh;
            h.y = W.y + 2.5; spawnFollowerProjectile({ x: W.x + 2, y: W.y }, g, '#f00', 10, 4, null); const shot = followerProjectiles[followerProjectiles.length - 1]; shot.targetsGreen = true; o.shotHp = 0; shot.onHit = () => { o.shotHp = 1; };
            for (let i = 0; i < 40; i++) render(); o.shot = followerProjectiles.includes(shot) ? 1 : 0;
            const e2 = __foe(W.x + 2.5, W.y + 0.4); const before = e2.health; spawnFollowerProjectile({ x: W.x - 2, y: W.y, element: 'fire' }, e2, '#f80', 10, 4, null);
            for (let i = 0; i < 60; i++) render(); o.ours = before - e2.health;
            e.x = W.x + 0.45; e.y = W.y; g.x = W.x - 0.45; g.y = W.y; h.x = W.x + 1.0; h.y = W.y + 0.3; t.x = W.x - 3; t.y = W.y;
            o.nearest = _abNearestFoe(e, 5) === h; let reached = []; _abForEachFoeInRadius(e, 3, v => reached.push(v === g ? 'g' : v === h ? 'h' : '?')); o.reached = reached.join(); return o; })()`);
        same(r.bite, false, 'the bite across landed'); same(r.hp, 0, 'the follower lost health'); same(r.said, true, 'no BLOCKED'); same(r.ripple, true, 'no ripple on the shield');
        same(r.player, 0, 'the player was bitten across it'); same(r.crystal, 0, 'the Crystal was bitten across it'); same(r.sameSide, true, 'one on its own side was not bitten');
        same(r.shot, 0, 'the enemy\'s shot went on'); same(r.shotHp, 0, 'the enemy\'s shot hit'); ok(r.ours > 0, 'your shot did not go through');
        same(r.nearest, true, 'a special aims across it'); same(r.reached, 'h', 'a special reaches across it');
    });
    check('a knock, a pull or a leap does not put an enemy across it either', () => {
        const r = J(`(function(){ const fs = __fresh(['core']), t = fs[0], o = {}; const e = __foe(t.x + 6, t.y); techAbilityUse(t, { enemy: e }); const W = techShields[0];
            e.x = W.x + 0.6; e.y = W.y; e.kbVX = -0.3; e.kbVY = 0; for (let i = 0; i < 20; i++) updateStatusEffects(); o.knock = __s(W, e);
            const px = e.x, py = e.y; e.x = W.x - 0.8; techShieldKeep(e, px, py); o.pull = __s(W, e);
            const sc = __foe(W.x + 1, W.y); sc.species = 'scout'; o.leap = !!techShieldBetween(sc.x, sc.y, W.x - 2, W.y); return o; })()`);
        ok(r.knock >= 0.39, 'knocked across: ' + r.knock); ok(r.pull >= 0.39, 'pulled across: ' + r.pull); same(r.leap, true, 'the leap check');
    });
    check('the technician holds behind it until the shield goes, or COME, RETREAT, an attack order, leaving the squad, or the player 10 tiles off; one that cannot see the creature cannot raise it (no cooldown spent); a new game takes the shields away', () => {
        const r = J(`(function(){ const o = {}; let fs = __fresh(['core']), t = fs[0]; let e = __foe(t.x + 6, t.y);
            techAbilityUse(t, { enemy: e }); __step(60); o.still = Math.hypot(t.x - t._shieldHold.x, t.y - t._shieldHold.y) < 0.3;
            ccApplyStance([t], 'follow'); o.come = !!t._shieldHold;
            fs = __fresh(['core']); t = fs[0]; e = __foe(t.x + 6, t.y); techAbilityUse(t, { enemy: e }); t.retreatUntil = frame + 100; __step(1); o.retreat = !!t._shieldHold;
            fs = __fresh(['core']); t = fs[0]; e = __foe(t.x + 6, t.y); techAbilityUse(t, { enemy: e }); player.x += 12; __step(1); o.leash = !!t._shieldHold;
            fs = __fresh(['core']); t = fs[0]; const hid = __foe(partyRoomCells('lab_hallway')[0][0], partyRoomCells('lab_hallway')[0][1]); o.hidden = techAbilityUse(t, { enemy: hid }).why; o.cool = techReadyIn(t); o.none = techShields.length;
            e = __foe(t.x + 6, t.y); techAbilityUse(t, { enemy: e }); facilityResetState(); o.reset = techShields.length; facilityPlayStart(); facilityBlackoutSet(false); return o; })()`);
        same(r.still, true, 'it did not hold its spot'); same(r.come, false, 'COME'); same(r.retreat, false, 'RETREAT'); same(r.leash, false, 'the player far off');
        same(r.hidden, 'THE TECHNICIAN CANNOT SEE IT', 'behind a wall'); same(r.cool, 0, 'a cooldown for nothing'); same(r.none, 0, 'a shield for nothing'); same(r.reset, 0, 'a new game');
    });
    check('the code: every way an enemy moves goes past the shield\'s check (its step, a knock, a pull, a slam); its bite, its shots and its specials ask it; the enemy card picks the creature while aiming; COME ends the hold', () => {
        const N = rd('js/npc.js'), C = rd('js/combat.js'), E = rd('js/evolution.js'), P = rd('js/predator.js'), A = rd('js/abilities.js'), G = rd('js/game.js'), M = rd('js/mixtool.js'), Y = rd('js/party.js');
        ok(/techShieldKeep\(actor, _fpx, _fpy\)/.test(N), 'the step'); ok(/techShieldKeep\(actor, _kx, _ky\)/.test(C), 'a knock'); ok((E.match(/techShieldKeep\(a, _px, _py\)/g) || []).length === 2, 'the pulls');
        ok(/techShieldBlocks\(this, a\)/.test(P) && /techShieldBetween\(this\.x, this\.y, a\.x, a\.y\)/.test(P), 'the bite'); ok(/_abWalled\(pred, a\)/.test(A) && /_over\(/.test(A), 'the specials and the leap'); ok(/techShieldStopsShot\(p\)\) return false;/.test(G), 'the shots');
        ok(/techAimNeed\(\) === "enemy"\) \{[^\n]*techAimPickEnemy\(_mtFoeShown\)/.test(M), 'the enemy card'); ok(/a\._shieldHold = null;/.test(Y), 'COME');
    });

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
