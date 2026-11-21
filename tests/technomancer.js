// THE TECHNOMANCER HAS NO WEAPON OF ITS OWN (docs/TECHNOMANCER.md; js/technomancer.js, js/weapons.js, js/input.js, js/targeting.js, js/game.js, js/facilitysave.js).
// The owner, 2026-11-20: "I want to get rid of all guns except for the gun given to the gunslinger whenever the tutorial is finished. [...] I want to remove the Technomancer's arc shot and melee. No melee
// unless it's the gunslinger." (build 2026-11-17at). The ARC GAUNTLET went: its punch, the arc it threw, its charges and the grid that filled them. This suite was the gauntlet's; it now checks that it is
// gone, that a Technomancer fights with nothing in hand, and what is kept for the Player cards:
//   THE ZAP     ARC WARDEN's (js/playercards.js): electric damage, more with every relay online, cutting short a bite being wound up
//   THE BOLT    how the zap, and ARC SLINGER's jump, are drawn
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
        // a hit is a DROP of more than a point (a creature loses nothing on its own: js/game.js)
        globalThis.__hits = (u, n) => { const at = []; let h = u.health; for (let i = 0; i < n; i++) { render(); if (h - u.health > 1) at.push(i); h = u.health; } return at; };
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isNeutralRecruit); for (const f of followers) { f.x = crystal.x - 30; f.y = crystal.y; f.stance = 'hold'; f.job = { type: 'move', target: { x: f.x, y: f.y } }; }
            respawnQueue.length = 0; floatingTexts.length = 0; followerProjectiles.length = 0; mutatorReset(); playerAttackMode = false; gunHold = null; playerLockTarget = null; __home(); };
        globalThis.__class = id => { invReset(); playerClassKey = null; classPerks = new Set(); weaponReset(); if (id) classSet(id); };
        globalThis.__creature = (sp, cl, lv, dx, dy, still) => { const p = spawnCreature({ species: sp, className: cl, level: lv || 3, x: player.x + (dx === undefined ? 3 : dx), y: player.y + (dy || 0), state: 'hunt' }); p.provoked = true; p.element = null; if (still) p.update = () => {}; return p; };
        globalThis.__dummy = (dx, dy) => { const p = __creature('ant', 'scout', 4, dx, dy, true); p.health = p.maxHealth = 1e6; return p; };
        globalThis.__frames = n => { for (let i = 0; i < n; i++) render(); };
        globalThis.__tc = () => { __clear(); __class('technomancer'); technoReset(); };`);
    const T = J('TECHNO'), TECHNO_PER_RELAY = T.arc.perRelay, TECHNO_STAGGER = T.arc.stagger;

    group('NO WEAPON: the gauntlet is gone, and a Technomancer has nothing in hand');
    check('choosing the Technomancer puts no weapon in hand: none to arm, no ammunition pill, nothing to fire; the ARC GAUNTLET is no weapon any more, for any class', () => {
        const r = J(`(function(){ __tc(); const o = { w: playerWeapon, inHand: weaponInHand(), own: weaponOwn(), hud: weaponHud(), dry: weaponDry(), row: !!WEAPONS.gauntlet, eq: weaponEquip('gauntlet'), cls: CLASSES.technomancer.weapon === undefined, rows: weaponRows().length };
            __class('gunslinger'); o.gs = [playerWeapon, weaponHas('gauntlet')]; __class('mutator'); o.mu = [playerWeapon, weaponHas('gauntlet')]; return o; })()`);
        same(r.w, null, 'in hand'); same(r.inHand, false, 'a weapon in hand'); same(r.own, null, 'a weapon of its own'); same(r.hud, null, 'the HUD'); same(r.dry, true, 'nothing to fire'); same(r.row, false, 'WEAPONS still has the gauntlet');
        same(r.eq.ok, false, 'the gauntlet was equipped'); same(r.eq.why, 'NO SUCH WEAPON', 'why'); same(r.cls, true, 'the class row still names a weapon'); same(r.rows, 0, 'weapons on its Armory terminal');
        same(r.gs.join(), ',false', 'the Gunslinger'); same(r.mu.join(), ',false', 'the Mutator');
    });
    check('a creature beside a Technomancer is LOCKED (the slab, the squad\'s orders go by it) but nothing is armed: a shot, the dial held for two seconds, do nothing to it, and the Technomancer does not walk in', () => {
        const r = J(`(function(){ __tc(); const e = __dummy(1.0, 0), far = __dummy(0.5, -4); const x0 = player.x, y0 = player.y, h0 = [e.health, far.health];
            const o = { set: targetSet(e, true), locked: targetCurrent() === e, armed: playerAttackMode, shot: firePlayerShot(e), hold: targetFireHold() };
            playerLockTarget = far; gunHold = { x: 0, y: 0, pending: true, released: false, until: 0, button: true }; __frames(120); o.held = [gunHold, playerAttackMode];
            o.dealt = [h0[0] - e.health, h0[1] - far.health]; o.moved = Math.hypot(player.x - x0, player.y - y0); o.fx = _tc.fx.length; setPlayerAttackMode(true); o.arm = playerAttackMode; return o; })()`);
        same(r.set, true, 'the lock was refused'); same(r.locked, true, 'not locked'); same(r.armed, false, 'armed'); same(r.shot, false, 'a shot'); same(r.hold, false, 'the dial\'s hold began');
        same(JSON.stringify(r.held), '[null,false]', 'a hold kept going'); ok(r.dealt[0] < 1 && r.dealt[1] < 1, 'the creatures took ' + r.dealt); ok(r.moved < 0.01, 'the player moved ' + r.moved); same(r.fx, 0, 'a bolt was drawn'); same(r.arm, false, 'ATTACK armed it');
    });
    check('the punch, the thrown arc, the charges and the grid are gone from the code; a powered room charges nothing', () => {
        const r = J(`(function(){ __tc(); const gone = ['technoAttack', 'technoArc', 'technoGain', 'technoMax', 'technoGridOn', 'technoSnapshot', 'technoApply', 'weaponMelee', 'mutatorLash', 'lashReach'].filter(n => { try { return eval('typeof ' + n) !== 'undefined'; } catch (e) { return true; } });
            let charge; try { charge = eval('typeof technoCharge'); } catch (e) { charge = 'threw'; }
            return { gone, charge, keys: Object.keys(TECHNO).join(), arc: Object.keys(TECHNO.arc).join(), punch: typeof DMG_HIT_PUNCH, lash: typeof DMG_HIT_LASH }; })()`);
        same(r.gone.join(), '', 'still in the code'); same(r.charge, 'undefined', 'the charge'); same(r.keys, 'arc', 'TECHNO'); same(r.arc, 'base,mult,perRelay,stagger,fx', 'TECHNO.arc'); same(r.punch + r.lash, 'undefinedundefined', 'the punch\'s and the lash\'s kinds of hit');
    });

    group('THE ZAP, kept for ARC WARDEN (a Player card): electric damage, a bite cut short');
    check('the zap is the arc\'s number as it was: 14 × 1.3, and TECHNO.arc.perRelay more for every relay online', () => {
        const r = J(`(function(){ __tc(); const ids = Object.keys(_fp.relays), was = ids.map(id => _fp.relays[id].online); ids.forEach(id => { _fp.relays[id].online = false; });
            const o = { n: ids.length, d0: technoArcDamage(), r0: technoRelays() }; ids.slice(0, 3).forEach(id => { _fp.relays[id].online = true; }); o.d3 = technoArcDamage(); o.r3 = technoRelays();
            ids.forEach((id, i) => { _fp.relays[id].online = was[i]; }); o.base = TECHNO.arc.base * TECHNO.arc.mult; return o; })()`);
        ok(r.n >= 3, 'relays: ' + r.n); same(r.r0, 0, 'relays online at first'); same(r.r3, 3, 'relays online'); near(r.base, 18.2, 0.001, '14 × 1.3'); near(r.d0, r.base, 0.06, 'the zap with none online'); near(r.d3, r.base * (1 + 3 * TECHNO_PER_RELAY), 0.06, 'the zap with three online');
    });
    check('it lands at once, Elemental (an ant resists it), and is the player\'s hit', () => {
        const r = J(`(function(){ __tc(); const e = __dummy(4, 0), h0 = e.health; _tcZap(e, technoArcDamage());
            return { dealt: h0 - e.health, want: technoArcDamage() * defenseMult(e, { x: player.x, y: player.y }) * dmgRowMult(dmgRow(e), 'elemental'), hit: DMG_HIT_ARC.type + ':' + DMG_HIT_ARC.element + ':' + DMG_HIT_ARC.player }; })()`);
        near(r.dealt, r.want, 1.5, 'the zap took'); same(r.hit, 'elemental:electric:true', 'its kind of hit');
    });
    check('IT CUTS A BITE SHORT: a creature rearing back to bite (the telegraph) that it hits loses the bite (INTERRUPTED over it) and cannot rear back for TECHNO.arc.stagger frames; the same bite without it lands', () => {
        const r = J(`(function(){ const stage = (zap) => { __tc(); const f = followers[0]; const e = __creature('ant', 'scout', 4, 4, 0); e.health = e.maxHealth = 1e6; f.x = e.x + 1; f.y = e.y; f.job = { type: 'move', target: { x: f.x, y: f.y } }; f.attackCooldown = 1e6; f.currentWill = 0;
                let bites = 0; const b0 = e.bite; e.bite = function () { bites++; return b0.apply(this, arguments); }; let n = 0; for (; n < 300 && !(e.attackWindup > 0); n++) render(); const o = { reared: e.attackWindup > 0, n };
                if (zap) { _tcZap(e, technoArcDamage()); o.cut = e.attackWindup; o.said = floatingTexts.some(t => t.text === 'INTERRUPTED'); o.rest = e.attackCooldown; __frames(TECHNO.arc.stagger - 2); o.bites = bites; o.again = e.attackWindup; }
                else { __frames(COMBAT.bite.windup + 2); o.bites = bites; } e.dead = true; __frames(1); return o; };
            return { zap: stage(true), none: stage(false) }; })()`);
        same(r.none.reared, true, 'the creature never reared back (' + r.none.n + ' frames)'); ok(r.none.bites >= 1, 'without the zap the bite did not land');
        same(r.zap.reared, true, 'the creature never reared back'); same(r.zap.cut, 0, 'the wind-up after the zap'); same(r.zap.said, true, 'no INTERRUPTED'); ok(r.zap.rest >= TECHNO_STAGGER, 'its rest after the zap: ' + r.zap.rest);
        same(r.zap.bites, 0, 'it bit in the frames after the zap'); same(r.zap.again, 0, 'it reared back again within the stagger');
    });

    group('THE BOLT, WHAT THE PLAYER SEES, AND THE SAVE');
    check('a bolt is drawn from point to point and fades (TECHNO.arc.fx frames); drawing it changes nothing', () => {
        const r = J(`(function(){ __tc(); const e = __dummy(4, 0), e2 = __dummy(5, 1); technoBolt(player, e, true); technoBolt(e, e2); const o = { at0: _tc.fx.length, low: _tc.fx.map(z => !!z.low).join() };
            let err = null; try { drawTechnoFx(); } catch (x) { err = x.message; } o.drawn = [err, _tc.fx.length]; __frames(TECHNO.arc.fx + 1); o.later = _tc.fx.length; technoBolt(player, e, true); technoReset(); o.reset = _tc.fx.length; return o; })()`);
        same(r.at0, 2, 'bolts'); same(r.low, 'false,true', 'from the hand, and between creatures'); same(JSON.stringify(r.drawn), '[null,2]', 'drawing'); same(r.later, 0, 'a bolt is still drawn'); same(r.reset, 0, 'a new game keeps a bolt');
    });
    check('no ammunition pill and no badge on the dial for a Technomancer; the pills beside the ammunition are still drawn; its Armory terminal says its class carries no weapon', () => {
        const r = J(`(function(){ __tc(); const said = []; const kf = ctx.fillText; ctx.fillText = function (t) { said.push(String(t)); }; let guns = 0, pills = 0; const kg = _tgGun, kp = _tgPill; _tgGun = function () { guns++; return kg.apply(this, arguments); }; _tgPill = function (i) { pills++; return 0; };
            const o = {}; try { _tgAmmoIcon(20, 20, 1); o.pill = said.slice(); o.chip = _ATKCHIP.w; o.pills = pills;
                const e = __dummy(4, 0); targetSet(e, true); let err = null; try { _tgDialDraw(e, frame); } catch (x) { err = x.message; } o.dial = [guns, err];
            } finally { ctx.fillText = kf; _tgGun = kg; _tgPill = kp; }
            const caps = []; const kc = uiCaptionFit; uiCaptionFit = function (t) { caps.push(String(t)); return kc.apply(this, arguments); }; armoryPanelOpen = true; let aerr = null; try { drawArmoryPanel(); } catch (x) { aerr = x.message; } finally { uiCaptionFit = kc; armoryClose(); } o.armory = [aerr, caps.filter(t => /NO WEAPON/.test(t)).length]; return o; })()`);
        same(r.pill.length, 0, 'the pill said: ' + r.pill.join('|')); same(r.chip, 0, 'the pill\'s tap area'); same(r.pills, 4, 'the pills beside it'); same(JSON.stringify(r.dial), '[0,null]', 'the dial\'s badge'); same(JSON.stringify(r.armory), '[null,1]', 'the Armory terminal');
    });
    check('the save keeps nothing of the gauntlet, and a game saved with one (its charges, the gauntlet in hand) loads with no weapon', () => {
        const r = J(`(function(){ __tc(); const d = JSON.parse(JSON.stringify(facilitySaveCollect())); const o = { tc: 'tc' in d, w: d.weapon.w };
            weaponRestore({ w: 'gauntlet', owned: { laser: false }, lv: { service: 1, machinegun: 1, laser: 1, lash: 1, gauntlet: 1 }, charge: 0, cw: 1 }); o.old = [playerWeapon, weaponInHand()]; return o; })()`);
        same(r.tc, false, 'the save has the charges'); same(r.w, null, 'the weapon saved'); same(r.old.join(), ',false', 'an old save');
        ok(/technoReset\(\)/.test(rd('js/facilityplay.js')), 'a new game does not clear the bolts (js/facilityplay.js)');
    });
    check('the wiring: the step fades the bolts and the scene draws them (js/game.js); a shot asks for a weapon in hand and knows no gauntlet (js/input.js); the page loads the file', () => {
        const g = rd('js/game.js'), i = rd('js/input.js'), h = rd('game.html');
        ok(/technoTick\(\)/.test(g), 'game.js does not tick it'); ok(/drawTechnoFx\(\)/.test(g), 'game.js does not draw it');
        const fp = i.slice(i.indexOf('function firePlayerShot'), i.indexOf('function setPlayerAttackMode')); ok(/weaponInHand\(\)\) return false;/.test(fp), 'firePlayerShot does not ask for a weapon in hand'); ok(!/technoAttack|mutatorLash|fireLaserShot/.test(fp), 'firePlayerShot still knows a removed weapon');
        ok(/<script src="js\/technomancer\.js\?v=/.test(h), 'game.html does not load js/technomancer.js'); ok(/"js\/technomancer\.js": "TECHNO"/.test(h), 'the boot check does not know it');
    });

    console.log(failures ? `\n${failures} FAILING` : '\nall passing');
    process.exit(failures ? 1 : 0);
})();
