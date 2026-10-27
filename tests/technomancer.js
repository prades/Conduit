// THE TECHNOMANCER: the arc gauntlet, its charge, and the grid (docs/TECHNOMANCER.md; js/technomancer.js, js/mutator.js, js/weapons.js, js/input.js, js/targeting.js, js/game.js, js/facilitysave.js).
// ASKED (the brief, step 8): "Implement the Technomancer's hybrid melee/ranged combat." "Technomancer: hybrid melee and ranged combatant. Uses technological and electrical abilities. Melee combat and ranged
// electrical attacks should complement one another. Also has a technological relationship with the facility's power network and infrastructure."
//   THE PUNCH   in reach: the two beats (a wind-up, then the hit), electric damage, and every punch that lands stores a CHARGE
//   THE ARC     out of reach, with a charge: at once, at the creature, jumping on to the creatures beside it (never to yours), cutting short a bite being wound up; it spends the charge
//   THE GRID    a powered room charges the gauntlet; every relay online makes the arc stronger
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
function near(a, b, tol, m) { if (!(Math.abs(a - b) <= tol)) throw new Error(`${m}: expected about ${b}, got ${a}`); }

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context), J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`facilityBlackoutSet(false); gameState.running = true; alertActive = false; _fp.items = _fp.items.filter(i => !(i.fp === 'prop' && i.kind === 'sentry'));   // (no sentries: the chamber's would shoot the creatures)
        // (staged in the lower half of the Crystal Chamber, five tiles from the Crystal, as tests/mutator.js: a creature beside the Crystal chews on it)
        globalThis.__home = () => { player.x = player.targetX = player.visualX = crystal.x - 2; player.y = player.targetY = player.visualY = crystal.y + 5; player.fpPath = null; player.attackCooldown = 0; health = PLAYER_HITS; player.invuln = 0; };
        // a hit is a DROP of more than a point: every creature bleeds 0.01 a frame (the red decay, js/game.js)
        globalThis.__hits = (u, n) => { const at = []; let h = u.health; for (let i = 0; i < n; i++) { render(); if (h - u.health > 1) at.push(i); h = u.health; } return at; };
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isNeutralRecruit); for (const f of followers) { f.x = crystal.x - 30; f.y = crystal.y; f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; }
            respawnQueue.length = 0; floatingTexts.length = 0; followerProjectiles.length = 0; mutatorReset(); playerAttackMode = false; gunHold = null; playerLockTarget = null; __home(); };
        globalThis.__class = id => { invReset(); playerClassKey = null; classPerks = new Set(); weaponReset(); if (id) classSet(id); };
        globalThis.__creature = (sp, cl, lv, dx, dy, still) => { const p = spawnCreature({ species: sp, className: cl, level: lv || 3, x: player.x + (dx === undefined ? 3 : dx), y: player.y + (dy || 0), state: 'hunt' }); p.provoked = true; p.element = null; if (still) p.update = () => {}; return p; };
        globalThis.__dummy = (dx, dy) => { const p = __creature('ant', 'scout', 4, dx, dy, true); p.health = p.maxHealth = 1e6; return p; };
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };
        // a Technomancer with n charges, and the grid switched off (TECHNO.charge.gridEvery 0) unless a check turns it on: what is measured is the gauntlet
        globalThis.__gridEvery = TECHNO.charge.gridEvery;
        globalThis.__tc = n => { __clear(); __class('technomancer'); technoReset(); technoCharge = n || 0; TECHNO.charge.gridEvery = 0; };`);
    const T = J('TECHNO'), TECHNO_PER_RELAY = T.arc.perRelay, TECHNO_ARC_CD = T.arc.cooldown, TECHNO_CHAIN_PCT = T.arc.chainPct, TECHNO_STAGGER = T.arc.stagger;

    group('THE ARC GAUNTLET: the Technomancer\'s own weapon, a hybrid');
    check('choosing the Technomancer puts the ARC GAUNTLET in hand; no other class has it (EQUIP says whose it is); it strikes in reach (a melee weapon), it is never dry, and the HUD counts its charges', () => {
        const r = J(`(function(){ __tc(0); const o = { w: playerWeapon, has: weaponHas('gauntlet'), melee: weaponMelee(), dry: weaponDry(), hud: [weaponHud().kind, weaponHud().text], el: weaponDef().element };
            __class('mutator'); o.mu = [playerWeapon, weaponHas('gauntlet'), weaponEquip('gauntlet').why]; __class('gunslinger'); o.gs = [playerWeapon, weaponHas('gauntlet')]; return o; })()`);
        same(r.w, 'gauntlet', 'in hand'); same(r.has, true, 'the Technomancer has it'); same(r.melee, true, 'it strikes in reach'); same(r.dry, false, 'dry'); same(r.el, 'electric', 'its element');
        same(r.hud.join(), 'hybrid,CHARGE 0/6', 'the HUD'); same(r.mu[0], 'lash', 'the Mutator\'s weapon'); same(r.mu[1], false, 'the Mutator has the gauntlet'); ok(/TECHNOMANCER'S OWN/.test(r.mu[2]), 'EQUIP said: ' + r.mu[2]);
        same(r.gs.join(), 'service,false', 'the Gunslinger');
    });

    group('THE PUNCH: in reach, in two beats; a punch that lands stores a charge');
    check('a click on a creature in reach: the gauntlet winds up for its windup frames, then lands for its damage, ELECTRIC (a number over it), and stores one charge; no round is spent', () => {
        const r = J(`(function(){ __tc(0); const e = __dummy(1.0, 0); playerAttackMode = true; const ammo = playerAmmo, h0 = e.health;
            const began = firePlayerShot(e); const o = { began, winding: mutatorLashing(), c0: technoCharge }; let land = null; for (let i = 0; i < 40 && land === null; i++) { render(); if (h0 - e.health > 1) land = i; }
            o.land = land; o.dealt = h0 - e.health; o.dmg = weaponDamage('gauntlet') * defenseMult(e, { x: player.x, y: player.y }); o.ammo = playerAmmo - ammo; o.windup = WEAPONS.gauntlet.windup; o.charge = technoCharge;
            o.num = floatingTexts.find(t => t.world && /^\\d+$/.test(t.text)); o.num = o.num ? o.num.color : null; o.arcs = _tc.fx.length; return o; })()`);
        same(r.began, true, 'the punch did not begin'); same(r.winding, true, 'it did not wind up'); same(r.c0, 0, 'a charge before it landed');
        ok(r.land !== null && r.land >= r.windup - 2, 'it landed at frame ' + r.land + ' (wind-up ' + r.windup + ')'); near(r.dealt, r.dmg, 1.5, 'the punch took');
        same(r.num, '#ffff55', 'the number over it is not electric\'s'); same(r.ammo, 0, 'rounds spent'); same(r.charge, 1, 'charges after one punch'); same(r.arcs, 0, 'an arc was thrown in reach');
    });
    check('holding keeps punching (one punch every windup + cooldown frames), a charge each, up to the most the gauntlet holds; it never throws an arc at a creature in reach', () => {
        const r = J(`(function(){ __tc(0); const e = __dummy(1.0, 0); playerAttackMode = true; playerLockTarget = e; gunHold = { x: 0, y: 0, pending: true, released: false, until: 0, button: true };
            const at = __hits(e, 300); const o = { at, charge: technoCharge, max: technoMax(), arcs: _tc.fx.length, cycle: WEAPONS.gauntlet.windup + weaponCooldown('gauntlet') }; gunHold = null; return o; })()`);
        ok(r.at.length >= 7, 'punches: ' + r.at); near(r.at[2] - r.at[1], r.cycle, 2, 'frames between punches'); same(r.charge, r.max, 'the charges after ' + r.at.length + ' punches'); same(r.arcs, 0, 'arcs at a creature in reach');
    });
    check('a punch that misses (the creature slipped out of reach in the wind-up) stores nothing', () => {
        const r = J(`(function(){ __tc(0); const e = __dummy(1.0, 0); playerAttackMode = true; const h0 = e.health; firePlayerShot(e); render(); e.x += 3; __frames(WEAPONS.gauntlet.windup + 2);
            return { dealt: h0 - e.health, charge: technoCharge, said: floatingTexts.map(t => t.text).join('|') }; })()`);
        ok(r.dealt < 1, 'it was hit for ' + r.dealt); same(r.charge, 0, 'a miss stored a charge'); ok(/MISS/.test(r.said), 'no MISS: ' + r.said);
    });

    group('THE ARC: out of reach, with a charge; at once, jumping on, never to yours');
    check('a click on a creature out of reach with a charge throws the arc: at once, for the punch\'s damage × TECHNO.arc.mult, one charge spent, the player stays where it is, the arc\'s rest after it', () => {
        const r = J(`(function(){ __tc(1); const e = __dummy(4, 0); playerAttackMode = true; const x0 = player.x, y0 = player.y, h0 = e.health;
            const fired = firePlayerShot(e); const o = { fired, dealt: h0 - e.health, want: technoArcDamage() * defenseMult(e, { x: player.x, y: player.y }), base: weaponDamage('gauntlet') * TECHNO.arc.mult, arc: technoArcDamage(), relays: technoRelays() };
            o.charge = technoCharge; o.cd = player.attackCooldown; o.fx = _tc.fx.length; o.goal = mutatorLashGoal(); __frames(20); o.moved = Math.hypot(player.x - x0, player.y - y0); return o; })()`);
        same(r.fired, true, 'no arc'); near(r.dealt, r.want, 1.5, 'the arc took'); near(r.arc, r.base * (1 + TECHNO_PER_RELAY * r.relays), 0.06, 'the arc\'s damage');
        same(r.charge, 0, 'charges left'); same(r.cd, TECHNO_ARC_CD, 'the rest after it'); same(r.fx, 1, 'the arc drawn'); same(r.goal, null, 'the player was sent walking'); ok(r.moved < 0.01, 'the player moved ' + r.moved);
    });
    check('it jumps: to the nearest creature within TECHNO.arc.chainRange of the last, TECHNO.arc.chain times, each for TECHNO.arc.chainPct of it; a creature further off is not hit; a follower, a clone and a recruit beside it never are', () => {
        const r = J(`(function(){ __tc(1); const e1 = __dummy(4, 0), e2 = __dummy(5.5, 0.5), e3 = __dummy(6.5, 1.5), far = __dummy(9.5, 3.5);
            const f = followers[0]; f.x = e1.x + 0.9; f.y = e1.y - 0.6; const c = makeClone('ant', 'scout', e1.x + 0.6, e1.y + 0.8, 'hunt'); const nr = { x: e1.x - 0.8, y: e1.y + 0.5, team: 'red', isNeutralRecruit: true, dead: false, health: 10, maxHealth: 10 }; actors.push(nr);
            const H = [e1, e2, e3, far, f, c, nr].map(a => a.health); technoArc(e1); const d = [e1, e2, e3, far, f, c, nr].map((a, i) => Math.round((H[i] - a.health) * 10) / 10);
            const o = { d, first: technoArcDamage() * defenseMult(e1, { x: player.x, y: player.y }), pts: _tc.fx[0] ? _tc.fx[0].pts.length : 0 }; c.dead = true; c.dismissed = true; actors = actors.filter(a => a !== nr); __frames(1); return o; })()`);
        near(r.d[0], r.first, 1.5, 'the first creature'); near(r.d[1], r.first * TECHNO_CHAIN_PCT, 1.5, 'the second'); near(r.d[2], r.first * TECHNO_CHAIN_PCT, 1.5, 'the third');
        same(r.d[3], 0, 'the creature out of the jump\'s reach'); same(r.d[4], 0, 'the follower'); same(r.d[5], 0, 'the clone'); same(r.d[6], 0, 'the recruit'); same(r.pts, 4, 'the arc drawn through the player and three creatures');
    });
    check('out of reach with no charge, the gauntlet walks the player in and punches (one click, one punch); beyond the arc\'s range, or out of sight, the same, and no charge is spent', () => {
        const r = J(`(function(){ __tc(0); const e = __dummy(4.5, 0); playerAttackMode = true; const began = firePlayerShot(e); const hits = __hits(e, 260).length; const o = { began, hits, d1: Math.hypot(e.x - player.x, e.y - player.y), reach: lashReach(), charge: technoCharge, arcs: _tc.fx.length };
            __tc(2); const far = __dummy(TECHNO.arc.range + 1.5, 0); playerAttackMode = true; o.far = [firePlayerShot(far), technoCharge, mutatorLashGoal() === far];
            __tc(2); const e2 = __dummy(4, 0); playerAttackMode = true; const keep = facilityLosFrom; facilityLosFrom = () => false; let hid; try { hid = [firePlayerShot(e2), technoCharge, mutatorLashGoal() === e2]; } finally { facilityLosFrom = keep; } o.hid = hid; mutatorCancel(); return o; })()`);
        same(r.began, false, 'a punch or an arc began out of reach with no charge'); ok(r.d1 <= r.reach + 0.05, 'the player is ' + r.d1.toFixed(2) + ' tiles away (reach ' + r.reach + ')'); same(r.hits, 1, 'punches from one click'); same(r.charge, 1, 'the punch stored a charge'); same(r.arcs, 0, 'arcs');
        same(r.far.join(), 'false,2,true', 'beyond the arc\'s range'); same(r.hid.join(), 'false,2,true', 'out of sight');
    });
    check('THE ARC CUTS A BITE SHORT: a creature rearing back to bite (the telegraph) that the arc hits loses the bite (INTERRUPTED over it) and cannot rear back for TECHNO.arc.stagger frames; the same bite without the arc lands', () => {
        const r = J(`(function(){ const stage = (zap) => { __tc(1); const f = followers[0]; const e = __creature('ant', 'scout', 4, 4, 0); e.health = e.maxHealth = 1e6; f.x = e.x + 1; f.y = e.y; f.job = { type: 'move', target: { x: f.x, y: f.y } }; f.attackCooldown = 1e6; f.currentWill = 0;
                let bites = 0; const b0 = e.bite; e.bite = function () { bites++; return b0.apply(this, arguments); }; let n = 0; for (; n < 300 && !(e.attackWindup > 0); n++) render(); const o = { reared: e.attackWindup > 0, n };
                if (zap) { technoArc(e); o.cut = e.attackWindup; o.said = floatingTexts.some(t => t.text === 'INTERRUPTED'); o.rest = e.attackCooldown; __frames(TECHNO.arc.stagger - 2); o.bites = bites; o.again = e.attackWindup; }
                else { __frames(COMBAT.bite.windup + 2); o.bites = bites; } e.dead = true; __frames(1); return o; };
            return { zap: stage(true), none: stage(false) }; })()`);
        same(r.none.reared, true, 'the creature never reared back (' + r.none.n + ' frames)'); ok(r.none.bites >= 1, 'without the arc the bite did not land');
        same(r.zap.reared, true, 'the creature never reared back'); same(r.zap.cut, 0, 'the wind-up after the arc'); same(r.zap.said, true, 'no INTERRUPTED'); ok(r.zap.rest >= TECHNO_STAGGER, 'its rest after the arc: ' + r.zap.rest);
        same(r.zap.bites, 0, 'it bit in the frames after the arc'); same(r.zap.again, 0, 'it reared back again within the stagger');
    });
    check('no charge, no arc: technoArc refuses and spends nothing', () => {
        const r = J(`(function(){ __tc(0); const e = __dummy(4, 0); const h0 = e.health; return { r: technoArc(e), dealt: h0 - e.health, charge: technoCharge }; })()`);
        same(r.r, false, 'it threw'); same(r.dealt, 0, 'damage'); same(r.charge, 0, 'charges');
    });

    group('THE TWO TOGETHER (the brief: "melee combat and ranged electrical attacks should complement one another")');
    check('the punches fill the gauntlet and the arcs spend it: two punches at the creature in reach store two charges; two arcs at one out of reach spend them; a third click, with none left, walks in', () => {
        const r = J(`(function(){ __tc(0); const near = __dummy(1.0, 0), far = __dummy(0.5, -4); playerAttackMode = true; const hf = far.health;
            playerLockTarget = near; gunHold = { x: 0, y: 0, pending: true, released: false, until: 0, button: true }; const punches = __hits(near, 2 * (WEAPONS.gauntlet.windup + weaponCooldown('gauntlet')) - 4).length; gunHold = null; __frames(40);
            const o = { punches, after: technoCharge }; o.a1 = firePlayerShot(far); __frames(TECHNO.arc.cooldown + 1); o.a2 = firePlayerShot(far); o.spent = technoCharge; o.farHit = Math.round(hf - far.health); o.two = Math.round(2 * technoArcDamage() * defenseMult(far, { x: player.x, y: player.y }));
            __frames(TECHNO.arc.cooldown + 1); o.a3 = firePlayerShot(far); o.walk = mutatorLashGoal() === far; mutatorCancel(); return o; })()`);
        same(r.punches, 2, 'punches'); same(r.after, 2, 'charges after two punches'); same(r.a1, true, 'the first arc'); same(r.a2, true, 'the second arc'); same(r.spent, 0, 'charges after two arcs');
        near(r.farHit, r.two, 2, 'the creature out of reach took'); same(r.a3, false, 'a third arc with no charge'); same(r.walk, true, 'with no charge the gauntlet did not walk in');
    });
    check('THE TECHNOMANCER AGAINST ONE CREATURE: holding the dial on an ant scout four tiles off with two charges, the arcs open the fight, the gauntlet walks in and the punches finish it', () => {
        const r = J(`(function(){ __tc(2); const e = __creature('ant', 'scout', 4, 4, 0); playerAttackMode = true; playerLockTarget = e; gunHold = { x: 0, y: 0, pending: true, released: false, until: 0, button: true };
            let arcs = 0, punches = 0; const ka = technoArc, ks = _mxStrike; technoArc = function (t) { const r = ka.apply(this, arguments); if (r) arcs++; return r; }; _mxStrike = function (t) { const r = ks.apply(this, arguments); if (r) punches++; return r; };
            let n = 0; try { for (; n < 1500 && !e.dead; n++) render(); } finally { technoArc = ka; _mxStrike = ks; gunHold = null; } const o = { dead: !!e.dead, n, arcs, punches, hits: PLAYER_HITS - health }; e.dead = true; __frames(1); __home(); return o; })()`);
        same(r.dead, true, 'the creature still stands after ' + r.n + ' frames: ' + JSON.stringify(r)); ok(r.arcs >= 2, 'arcs: ' + r.arcs); ok(r.punches >= 1, 'punches: ' + r.punches);
    });

    group('THE GRID: the facility\'s power charges the gauntlet; the relays make the arc stronger');
    check('in a powered room the gauntlet gains a charge every TECHNO.charge.gridEvery frames, up to the most it holds; in a room with no power it gains none; only a Technomancer\'s does', () => {
        const r = J(`(function(){ __tc(0); TECHNO.charge.gridEvery = __gridEvery; const o = {}; try { facilityBlackoutSet(true); _fp.tut.powered.clear(); const key = _fpRoomKeyAt(player.x, player.y); o.key = key;
                o.offOn = technoGridOn(); __frames(2 * TECHNO.charge.gridEvery + 10); o.dark = technoCharge;
                _fp.tut.powered.add(key); o.onOn = technoGridOn(); __frames(2 * TECHNO.charge.gridEvery + 10); o.lit = technoCharge; o.hud = [weaponHud().grid, weaponHud().full];
                technoCharge = technoMax(); __frames(TECHNO.charge.gridEvery + 10); o.full = [technoCharge, technoMax()];
                __class('gunslinger'); technoCharge = 0; __frames(TECHNO.charge.gridEvery + 10); o.other = technoCharge;
            } finally { _fp.tut.powered.clear(); facilityBlackoutSet(false); TECHNO.charge.gridEvery = 0; } return o; })()`);
        ok(!!r.key, 'the player is in no room'); same(r.offOn, false, 'the grid with no power'); same(r.dark, 0, 'charges in a room with no power');
        same(r.onOn, true, 'the grid with power'); same(r.lit, 2, 'charges after two rounds in a powered room'); same(r.hud.join(), 'true,false', 'the HUD\'s grid'); same(r.full[0], r.full[1], 'past the most it holds'); same(r.other, 0, 'a Gunslinger\'s charges');
    });
    check('every relay online makes the arc stronger by TECHNO.arc.perRelay', () => {
        const r = J(`(function(){ __tc(0); const ids = Object.keys(_fp.relays), was = ids.map(id => _fp.relays[id].online); ids.forEach(id => { _fp.relays[id].online = false; });
            const o = { n: ids.length, d0: technoArcDamage(), r0: technoRelays() }; ids.slice(0, 3).forEach(id => { _fp.relays[id].online = true; }); o.d3 = technoArcDamage(); o.r3 = technoRelays();
            ids.forEach((id, i) => { _fp.relays[id].online = was[i]; }); o.base = weaponDamage('gauntlet') * TECHNO.arc.mult; return o; })()`);
        ok(r.n >= 3, 'relays: ' + r.n); same(r.r0, 0, 'relays online at first'); same(r.r3, 3, 'relays online'); near(r.d0, r.base, 0.06, 'the arc with none online'); near(r.d3, r.base * (1 + 3 * TECHNO_PER_RELAY), 0.06, 'the arc with three online');
    });

    group('WHAT THE PLAYER SEES, AND THE SAVE');
    check('the small pill counts the charges by a bolt, and says GRID while a powered room charges it; the dial\'s badge is a bolt; the arc and the punch draw; the Armory\'s row says PUNCH and ARC', () => {
        const r = J(`(function(){ __tc(3); TECHNO.charge.gridEvery = __gridEvery; const said = []; const kf = ctx.fillText; ctx.fillText = function (t) { said.push(String(t)); }; let bolts = 0; const kb = _tgBolt; _tgBolt = function () { bolts++; return kb.apply(this, arguments); };
            const o = {}; try { _tgAmmoIcon(20, 20, 1); o.pill = said.slice(); o.pillBolt = bolts; technoCharge = technoMax(); said.length = 0; _tgAmmoIcon(20, 20, 1); o.full = said.slice();
                const e = __dummy(4, 0); bolts = 0; let err = null; try { _tgDialDraw(e, frame); } catch (x) { err = x.message; } o.dial = [bolts, err];
                technoArc(e); firePlayerShot(__dummy(1.0, 0)); __frames(WEAPONS.gauntlet.windup + 1); err = null; try { drawTechnoFx(); drawMutatorFx(); } catch (x) { err = x.message; } o.fx = [err, _tc.fx.length];
            } finally { ctx.fillText = kf; _tgBolt = kb; TECHNO.charge.gridEvery = 0; }
            const caps = []; const kc = uiCaption; uiCaption = function (t) { caps.push(String(t)); return kc.apply(this, arguments); }; armoryPanelOpen = true; try { drawArmoryPanel(); } finally { uiCaption = kc; armoryClose(); } o.armory = caps.filter(t => /PUNCH/.test(t)); return o; })()`);
        ok(r.pill.includes('3/6 · GRID'), 'the pill said: ' + r.pill.join('|')); same(r.pillBolt, 1, 'bolts on the pill'); ok(r.full.includes('6/6'), 'the full pill said: ' + r.full.join('|'));
        same(r.dial[1], null, 'the dial threw'); ok(r.dial[0] >= 1, 'no bolt on the dial\'s badge'); same(r.fx[0], null, 'drawing threw'); same(r.fx[1], 1, 'the arc being drawn');
        same(r.armory.length, 1, 'the Armory\'s gauntlet row: ' + JSON.stringify(r.armory)); ok(/ARC \d/.test(r.armory[0] || ''), 'it does not say what the arc does: ' + r.armory[0]);
    });
    check('the arcs fade (they are drawn TECHNO.arc.fx frames); drawing them changes nothing', () => {
        const r = J(`(function(){ __tc(1); const e = __dummy(4, 0); technoArc(e); const o = { at0: _tc.fx.length }; drawTechnoFx(); o.drawn = [_tc.fx.length, technoCharge]; __frames(TECHNO.arc.fx + 1); o.later = _tc.fx.length; return o; })()`);
        same(r.at0, 1, 'the arc'); same(r.drawn.join(), '1,0', 'drawing changed the state'); same(r.later, 0, 'the arc is still drawn');
    });
    check('the save keeps the charges (and a new game has none): a reload brings them back, no more than it holds', () => {
        const r = J(`(function(){ __tc(4); const d = JSON.parse(JSON.stringify(facilitySaveCollect())); technoReset(); const o = { saved: d.tc, reset: technoCharge }; technoApply(d.tc); o.back = technoCharge; technoApply(99); o.capped = [technoCharge, technoMax()]; technoApply(undefined); o.none = technoCharge; return o; })()`);
        same(r.saved, 4, 'saved'); same(r.reset, 0, 'a reset'); same(r.back, 4, 'restored'); same(r.capped[0], r.capped[1], 'capped'); same(r.none, 0, 'an old save');
        ok(/technoReset\(\)/.test(rd('js/facilityplay.js')), 'a new game does not reset the gauntlet (js/facilityplay.js)');
    });
    check('the wiring: the step ticks it and the scene draws it (js/game.js); a click with the gauntlet in hand is the gauntlet\'s, before the melee weapons\' (js/input.js); the page loads the file', () => {
        const g = rd('js/game.js'), i = rd('js/input.js'), h = rd('game.html');
        ok(/technoTick\(\)/.test(g), 'game.js does not tick it'); ok(/drawTechnoFx\(\)/.test(g), 'game.js does not draw it');
        const fp = i.slice(i.indexOf('function firePlayerShot')); ok(fp.indexOf('technoAttack(foe)') > 0 && fp.indexOf('technoAttack(foe)') < fp.indexOf('mutatorLash(foe)'), 'firePlayerShot does not hand the gauntlet to technoAttack first');
        ok(/<script src="js\/technomancer\.js\?v=/.test(h), 'game.html does not load js/technomancer.js'); ok(/"js\/technomancer\.js": "TECHNO"/.test(h), 'the boot check does not know it');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
