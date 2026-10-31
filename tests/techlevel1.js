// THE OTHER FIVE TECHNICIANS' LEVEL 1 ABILITIES (js/techabilities.js; docs/TECHNICIANS.md): the core technician's PHOTONIC SHIELD, the fire technician's THERMITE DRILL (the arena's rubble, its hole, its rocks), the ice
// technician's FROST PATCH, the toxic technician's BLIGHT SPIDER (its pools, the play clock), the flux technician's TELEGRAB.
// ASKED (the core technician): "The Core Technician deploys a photonic shield between itself and the player-selected creature, creating a defensive barrier that blocks enemy movement while allowing friendly units to pass through
// and fire through it [...] The shield lasts exactly 20 seconds after activation, then disappears automatically", then "3 wide, 3 back" and "Block attacks too"; 60 s cooldown for each of the six. The others: see each group.
// The logic runs in the sandbox, stepping the frames the game would; the long press on the rubble, the chips and the taps in the real browser (no Chromium: it says so and passes).
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});
const rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const near = (a, b, tol, m) => { if (!(Math.abs(a - b) <= tol)) throw new Error(`${m}: expected ${b} ± ${tol}, got ${a}`); };

function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// The real page: three technicians' chips; a long press on the rubble and a release up its ring's THERMITE DRILL; the ice chip and a tap on the floor; the flux chip and a tap on a supply case.
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, step = function(n){ for (var i = 0; i < n; i++) render(); };
  canvas.setPointerCapture = function(){};
  var ev = function(type, x, y){ var r = canvas.getBoundingClientRect(); canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: r.left + x * r.width / canvas.width, clientY: r.top + y * r.height / canvas.height, pointerId: 7, isPrimary: true })); };
  var tapAt = function(x, y){ ev('pointerdown', x, y); ev('pointerup', x, y); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; selectedUnits.clear(); facilityBlackoutSet(false); actors = actors.filter(function(a){ return !(a instanceof Predator); });
    var R = _fp.F.rubble[0]; player.x = player.targetX = player.visualX = R.work[0] - 3; player.y = player.targetY = player.visualY = R.work[1] - 1.5; player.fpPath = null;
    var els = ['fire', 'ice', 'flux']; followers.forEach(function(f, i){ f.element = els[i % 3]; f.role = 'camper'; f.evolved = undefined; f.x = player.x + 0.5 * i; f.y = player.y + 0.6; });
    step(3); partyTick(); followers.forEach(function(f){ f._abReadyAt = frame; }); step(3); partyTick();
    out.chips = Array.prototype.slice.call(document.querySelectorAll('#squadBar .sb-slot.has-ab .sb-ab')).map(function(e){ return e.textContent; });
    var q = _fpP(R.at[0], R.at[1], 25); ev('pointerdown', q[0], q[1]); await wait(650); step(2);
    out.ring = { mode: commandMode, tech: !!commandTechTarget };
    ev('pointermove', q[0], q[1] - 70); ev('pointerup', q[0], q[1] - 70); step(1);
    out.drill = followers.some(function(f){ return !!f._drill; });
    // the ice chip, then a tap on the floor beside the player
    var slots = document.querySelectorAll('#squadBar .sb-slot.has-ab .sb-ab'); slots[1].dispatchEvent(new MouseEvent('click', { bubbles: true })); step(1);
    var s = _techScr(player.x + 1.4, player.y + 0.2); tapAt(s.x, s.y + TILE_H); step(1);
    out.frost = techFrosts.length ? techFrosts[0].tiles.size : 0;
    // the flux chip, then a tap on a supply case on the screen
    var it = null; for (var k = 0; k < _fp.items.length; k++) { var c = _fp.items[k]; if (c.fp === 'pickup' && !c.taken && !c.rock && !c.cls) { var p = _techScr(c.x, c.y); if (p.x > 60 && p.x < canvas.width - 60 && p.y > 120 && p.y < canvas.height - 160) { it = c; break; } } }
    if (!it) { var cs = _fp.items.filter(function(c){ return c.fp === 'pickup' && !c.taken && !c.rock && !c.cls; }); it = cs[0]; player.x = player.targetX = player.visualX = it.x - 3; player.y = player.targetY = player.visualY = it.y - 2; step(3); }
    slots = document.querySelectorAll('#squadBar .sb-slot.has-ab .sb-ab'); slots[2].dispatchEvent(new MouseEvent('click', { bubbles: true })); step(1);
    var ip = _techScr(it.x, it.y); tapAt(ip.x, ip.y + TILE_H - 40); step(1);
    out.grab = !!it.grab || it.taken;
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__tl'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tl-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=30000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 120000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__tl">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

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
            // (the creature that bit across the shield stands 0.45 beyond it, inside the shot's reach, so it is taken out of the way: what the shot does is then what it does to the one 2.5 tiles beyond. Only the shot's own damage is counted, whatever the squad does meanwhile)
            e.y = W.y + 3; const e2 = __foe(W.x + 2.5, W.y + 0.4), from = { x: W.x - 2, y: W.y, element: 'fire' }; o.ours = 0; const _ad = applyDamage; applyDamage = function (tg, am, src) { if (src === from && tg === e2) o.ours += am; return _ad.apply(this, arguments); };
            try { spawnFollowerProjectile(from, e2, '#f80', 10, 4, null); for (let i = 0; i < 60; i++) render(); } finally { applyDamage = _ad; }
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

    group('THE THERMITE DRILL (fire): the rubble in the arena\'s south rock, its hole, its rocks; an enemy from the chip');
    // ASKED: "Place a distinctive rubble patch at the midpoint of the southern wall [...] Allow the player to long-press the rubble and select Thermite Drill. Have the Fire Technician travel to the target and drill it. Destroy the
    // rubble after six successful drill hits. Spawn collectible rocks exactly once upon destruction. Preserve the resulting opening [...] Allow the ability to target enemies through the Technician HUD", then one hit a second,
    // a sealed dark hole, 3 rocks once (no use yet), against an enemy 3 hits a second apart, each twice its normal hit.
    check('the rubble is map data on the arena\'s south rock, on its straight stretch: its ends and middle on a wall, its work spot on the arena floor in sight of it; the built map validates', () => {
        const r = J(`(function(){ const R = _fp.F.rubble[0]; return { n: _fp.F.rubble.length, id: R.id, room: R.room, a: R.a, b: R.b, flat: Math.abs(R.a[1] - R.b[1]) < 1e-6, south: _fp.F.walls.some(w => Math.abs(w.a[1] - w.b[1]) < 1e-6 && Math.abs(w.a[1] - R.a[1]) < 1e-6 && Math.min(w.a[0], w.b[0]) <= R.a[0] && Math.max(w.a[0], w.b[0]) >= R.b[0]),
            work: partyRoomAt(R.work[0], R.work[1]), stand: facilityStandOk(R.work[0], R.work[1]), errs: facilityValidate(_fp.F).errors.filter(e => /rubble/.test(e)), deco: _fp.items.some(i => i.fp === 'wdecor' && i.kind === 'rubble') }; })()`);
        same(r.n, 1, 'rubble'); same(r.id, 'rubble_arena_south', 'its id'); same(r.room, 'arena', 'its room'); same(r.flat && r.south, true, 'not on the south rock\'s straight stretch: ' + JSON.stringify([r.a, r.b]));
        same(r.work, 'arena', 'the work spot'); same(r.stand, true, 'the work spot is not floor'); same(r.errs.length, 0, 'the validator: ' + r.errs); same(r.deco, true, 'it is not drawn on the rock');
    });
    check('a long press on it opens its ring (THERMITE DRILL); with no fire technician in the squad, or one still cooling down, it is refused and says why; with one ready it walks to the rubble and drills it, a hit a second; the cooldown starts at the first hit', () => {
        const r = J(`(function(){ const o = {}, R = _fp.F.rubble[0]; _fp.rubbleHits = {}; _fp.items = _fp.items.filter(i => !i.rock);
            let fs = __fresh(['core']); player.x = player.visualX = R.work[0] + 1; player.y = player.visualY = R.work[1] - 2; const p = _fpP(R.at[0], R.at[1], 25), hit = techRubbleAtScreen(p[0], p[1]);
            o.found = !!hit && hit.r === R; o.ring = techRingFor(R); o.none = techRubbleDrill(R).why;
            fs = __fresh(['fire']); const t = fs[0]; t._abReadyAt = frame + 600; o.cooling = techRubbleDrill(R).why; t._abReadyAt = frame;
            t.x = R.work[0] + 3; t.y = R.work[1] - 3; o.go = techRingAct(R, 'drill').ok; o.chip = techChipState(t).text;
            const at = []; let last = 0; for (let i = 0; i < 1500 && !techRubbleOpen(R); i++) { __step(1); const h = _fp.rubbleHits[R.id] || 0; if (h !== last) { at.push(frame); last = h; if (h === 1) o.coolAtFirst = techReadyIn(t); } }
            o.gaps = at.slice(1).map((f, i) => f - at[i]); o.hits = at.length; o.open = techRubbleOpen(R); o.near = Math.hypot(t.x - R.work[0], t.y - R.work[1]) < 0.7; o.free = !t._drill && !t._abBusy; return o; })()`);
        same(r.found, true, 'the press does not find the rubble'); ok(r.ring && r.ring.up.label === 'THERMITE DRILL' && /6 HITS TO DRILL THROUGH/.test(r.ring.caption), 'the ring: ' + JSON.stringify(r.ring));
        same(r.none, 'THE THERMITE DRILL NEEDS A FIRE TECHNICIAN IN YOUR SQUAD', 'no fire technician'); ok(/DRILL READY IN 10 S/.test(r.cooling), 'cooling down: ' + r.cooling); same(r.go, true, 'the order'); same(r.chip, '✹ DRILLING', 'the chip while it goes');
        same(r.hits, 6, 'hits'); same(r.gaps.join(), '60,60,60,60,60', 'a hit a second'); same(r.coolAtFirst, 3600, 'the cooldown from the first hit'); same(r.open, true, 'not drilled through'); same(r.near, true, 'it did not drill from its spot'); same(r.free, true, 'still busy');
    });
    check('drilled through: a dark hole for good (the ring has nothing more, a second order is refused), 3 rocks in front of it ONCE, each a pack item (ROCK, no use yet) taken by walking over it; the save keeps the hole and the rocks not taken, and a fresh game has the rubble back', () => {
        const r = J(`(function(){ const o = {}, R = _fp.F.rubble[0]; o.ring = techRingFor(R); o.again = techRubbleDrill(R).why;
            o.rocks = _fp.items.filter(i => i.rock && !i.taken).map(i => i.id); _techRocksOut(R, true); o.once = _fp.items.filter(i => i.rock).length;
            const rk = _fp.items.find(i => i.rock && !i.taken), n0 = invCount('rock'); player.x = player.visualX = rk.x; player.y = player.visualY = rk.y; facilityPickupTick(); o.took = [rk.taken, invCount('rock') - n0 === _fp.items.filter(i => i.rock && i.taken).length, ITEMS.rock.name, ITEMS.rock.use().ok];
            const save = facilitySaveCollect(); o.saved = save.rubble; o.takenSaved = save.taken.includes(rk.id);
            _fp.items = _fp.items.filter(i => !i.rock); _fp.rubbleHits = {}; techRubbleApply(save.rubble); const taken = new Set(save.taken); for (const it of _fp.items) if (it.fp === 'pickup' && taken.has(it.id)) it.taken = true;
            o.left = _fp.items.filter(i => i.rock && !i.taken).length; o.back = [techRubbleOpen(R), _fp.items.filter(i => i.rock && !i.taken).length]; techRubbleApply({}); o.fresh = [techRubbleOpen(R), techRubbleLeft(R)]; techRubbleApply(save.rubble); return o; })()`);
        same(r.ring, null, 'the hole has a ring'); same(r.again, 'IT IS DRILLED THROUGH', 'a second order'); same(r.rocks.join(), 'rock_rubble_arena_south_1,rock_rubble_arena_south_2,rock_rubble_arena_south_3', 'the rocks'); same(r.once, 3, 'rocks made again');
        same(r.took.join(), 'true,true,ROCK,false', 'a rock picked up (one in the pack for each taken)'); same(JSON.stringify(r.saved), '{"rubble_arena_south":6}', 'the save'); same(r.takenSaved, true, 'the rock taken is not in the save');
        same(r.back.join(), 'true,' + r.left, 'a saved game: the hole and the rocks left'); same(r.fresh.join(), 'false,6', 'a fresh game: the rubble');
    });
    check('from the chip, at an enemy it can see (or the enemy card): it closes in and drills it 3 times a second apart, each twice its normal hit (followerAttack\'s plain hit: a quarter of its attack), as fire; the cooldown starts at the first hit; one it cannot see is refused', () => {
        const r = J(`(function(){ const fs = __fresh(['fire']), t = fs[0], o = {}; const e = __foe(t.x + 3, t.y); const ref = __foe(t.x + 3, t.y + 2);
            applyElementalDamage(ref, (t.stats.attack || 5) * 0.25 * 2, t, 'fire'); o.want = Math.round((5000 - ref.health) * 100) / 100; ref.dead = true;
            techChipTap(t); o.prompt = techAimPrompt(); techAimPickEnemy(e); o.aiming = techAimActive(); const hp = []; let last = e.health;
            for (let i = 0; i < 600 && t._drill; i++) { __step(1); if (e.health !== last) { hp.push([frame, Math.round((last - e.health) * 100) / 100]); if (hp.length === 1) o.cool = techReadyIn(t); last = e.health; } }
            o.hits = hp.length; o.each = hp.map(h => h[1]); o.gaps = hp.slice(1).map((h, i) => h[0] - hp[i][0]);
            const fs2 = __fresh(['fire']), t2 = fs2[0], hid = __foe(partyRoomCells('lab_hallway')[0][0], partyRoomCells('lab_hallway')[0][1]); o.hidden = techAbilityUse(t2, { enemy: hid }); o.hidCool = techReadyIn(t2); return o; })()`);
        ok(/THERMITE DRILL · TAP AN ENEMY/.test(r.prompt), r.prompt); same(r.aiming, false, 'still aiming'); same(r.hits, 3, 'hits'); same(r.gaps.join(), '60,60', 'a hit a second');
        for (const h of r.each) near(h, r.want, 0.01, 'a hit'); same(r.cool, 3600, 'the cooldown from the first hit'); same(r.hidden.why, 'THE TECHNICIAN CANNOT SEE IT', 'one behind a wall'); same(r.hidCool, 0, 'a cooldown for nothing');
    });

    group('THE FROST PATCH (ice)');
    // ASKED: "Implement the Level 1 Frost Patch using existing terrain and status-effect systems", then 3x3, 10 s, enemies at half speed, on a spot it can see, there at once; "they cross faster" for your own units (how much faster:
    // provisional); ice bridges later.
    check('a tap on the floor it can see: 3x3 tiles of ice there at once (floor only), for 10 s; an enemy on it moves at half its pace (a stronger slow it has is kept), your units on it faster; off it, and when it is gone, as before; the cooldown is 60 s', () => {
        const r = J(`(function(){ const fs = __fresh(['ice', 'fire']), t = fs[0], g = fs[1], o = {}; const sp = { x: t.x + 2.2, y: t.y + 0.3 };
            techChipTap(t); o.prompt = techAimPrompt(); o.ok = techAimPickSpot(sp); const P = techFrosts[0]; o.patch = P ? [P.x, P.y, P.tiles.size, P.until - P.t0] : null; o.cool = techReadyIn(t);
            const e = __foe(P.x + 0.2, P.y - 0.3); e.baseMoveSpeed = e.moveSpeed = 0.04; e.state = 'wander'; e.provoked = false; g.x = P.x - 0.6; g.y = P.y + 0.4; g.baseMoveSpeed = g.moveSpeed = 0.05;   // (the creatures calm: the followers leave them alone, so only the ice slows them)
            const w = __foe(P.x + 6, P.y); w.baseMoveSpeed = w.moveSpeed = 0.04; w.state = 'wander'; w.provoked = false;
            _techFrostTick(frame); updateStatusEffects(); o.on = [Math.round(e.moveSpeed * 1000), Math.round(g.moveSpeed * 1000), Math.round(w.moveSpeed * 1000)];
            applySlow(e, 100, 0.2); _techFrostTick(frame); updateStatusEffects(); o.web = Math.round(e.moveSpeed * 1000);
            e.slowed = 0; e.slowFactor = 1; __step(600); for (let i = 0; i < 6; i++) updateStatusEffects(); o.gone = techFrosts.length; e.x = P.x; e.y = P.y; _techFrostTick(frame); updateStatusEffects(); o.after = Math.round(e.moveSpeed * 1000); return o; })()`);
        ok(/FROST PATCH · TAP THE FLOOR/.test(r.prompt), r.prompt); same(r.ok, true, 'the pick'); ok(r.patch && r.patch[2] === 9 && r.patch[3] === 600, 'the patch: ' + JSON.stringify(r.patch)); same(r.cool, 3600, 'the cooldown');
        same(r.on.join(), '20,75,40', 'speeds on and off it (enemy, follower, an enemy off it)'); same(r.web, 8, 'a web\'s slow on it was weakened'); same(r.gone, 0, 'still there after 10 s'); same(r.after, 40, 'an enemy where it was');
    });
    check('one it cannot see, or a tap that is not floor, is refused and the aim stays up (no cooldown); its tiles are only the floor in sight of its middle', () => {
        const r = J(`(function(){ const fs = __fresh(['ice']), t = fs[0], o = {}; const c = partyRoomCells('lab_hallway')[0];
            techChipTap(t); techAimPickSpot({ x: c[0], y: c[1] }); o.hidden = [techAimActive(), techReadyIn(t), floatingTexts.slice(-1)[0].text]; techAimCancel(true);
            const R = _fp.F.rubble[0]; o.wall = techAbilityUse(t, { spot: { x: R.at[0], y: R.at[1] + 2 } }).why;
            t._abReadyAt = frame; t.x = R.work[0]; t.y = R.work[1]; o.edgeOk = techAbilityUse(t, { spot: { x: R.at[0], y: R.at[1] - 0.4 } }).ok; const P = techFrosts[techFrosts.length - 1]; o.edge = P ? [...P.tiles].every(k => { const [x, y] = k.split(',').map(Number); return facilityStandOk(x, y); }) && P.tiles.size < 9 : null; return o; })()`);
        same(r.hidden.join(), 'true,0,THE TECHNICIAN CANNOT SEE THERE', 'out of sight'); same(r.wall, 'TAP THE FLOOR', 'past the wall'); same(r.edgeOk, true, 'a patch by the wall'); same(r.edge, true, 'a patch by the wall is floor only');
    });

    group('THE BLIGHT SPIDER (toxic) and THE PLAY CLOCK');
    // ASKED: "Make the pools persist for two complete in-game days. Implement gradual toxin reabsorption [...] Prevent repeated updates from incorrectly extending pool duration or multiplying toxin reabsorption. Leave the death-spill
    // behavior unresolved", then a tapped spot it can see, a 2x2 pool, up to 3, a day = 20 minutes of play (play time only, saved), the toxic cloud's damage every half second, fading weaker and smaller until gone.
    check('a tap on the floor it can see: the spider walks there and leaves a 2x2 pool; the cooldown starts when it is down; up to 3 pools, a 4th takes the oldest\'s place', () => {
        const r = J(`(function(){ const fs = __fresh(['toxic']), t = fs[0], o = {}; const sp = { x: t.x + 2.3, y: t.y + 0.8 };
            techChipTap(t); o.prompt = techAimPrompt(); techAimPickSpot(sp); o.walk = !!t._blight; o.chip = techChipState(t).text; o.coolBefore = techReadyIn(t);
            for (let i = 0; i < 600 && !techPools.length; i++) __step(1); const P = techPools[0]; o.pool = P ? [P.x, P.y] : null; o.want = [Math.round(sp.x - 0.5) + 0.5, Math.round(sp.y - 0.5) + 0.5]; o.cool = techReadyIn(t);
            for (let k = 1; k <= 3; k++) _techPoolLay(t, P.x + k * 3, P.y); o.n = techPools.length; o.ids = techPools.map(q => q.id); o.first = P.id; return o; })()`);
        ok(/BLIGHT SPIDER · TAP THE FLOOR/.test(r.prompt), r.prompt); same(r.walk, true, 'it does not walk there'); same(r.chip, '☣ LAYING', 'the chip'); same(r.coolBefore, 0, 'the cooldown before the pool');
        same(JSON.stringify(r.pool), JSON.stringify(r.want), 'the pool\'s middle'); ok(r.cool > 3500, 'the cooldown when it is down: ' + r.cool); same(r.n, 3, 'pools'); ok(!r.ids.includes(r.first), 'the oldest was kept');
    });
    check('THE PLAY CLOCK: a frame of play a frame; a day is 20 minutes of it; a pool lasts 2 days, fading weaker and smaller as it goes (half at one day), and is gone at two; it hurts the enemies standing in it with the toxic cloud\'s bite every half second, and nothing of yours', () => {
        const r = J(`(function(){ const fs = __fresh(['toxic', 'fire']), t = fs[0], g = fs[1], o = {}; const c0 = techClock; __step(10); o.tick = techClock - c0; o.day = TECH_AB.day; o.life = techPoolLife();
            techPools = []; _techPoolLay(t, t.x + 2.5, t.y + 0.5); const P = techPools[0]; o.bite = Math.round(P.bite * 1000) / 1000; o.want = Math.round(((t.stats && t.stats.specialAttack) || 10) * 0.12 * 0.3 * 1000) / 1000;
            const e = __foe(P.x + 0.3, P.y - 0.2), ref = __foe(P.x + 9, P.y); applyDamage(ref, P.bite, null); const full = 5000 - ref.health; ref.dead = true; g.x = P.x - 0.3; g.y = P.y; g.spawnProtection = 0; const gh = g.health;
            const bites = n => { const h0 = e.health; for (let i = 0; i < n; i++) { techClock++; _techPoolTick(); } return Math.round((h0 - e.health) / full * 100) / 100; };
            o.oneSecond = bites(60); techClock = P.born + o.day; o.k = techPoolFade(P); o.half = [techInPool(e, P), (e.x = P.x + 0.7, techInPool(e, P))]; e.x = P.x + 0.3; o.halfBite = bites(30);
            o.mine = gh - g.health; techClock = P.born + o.life - 1; _techPoolTick(); o.lastFrame = techPools.length; techClock++; _techPoolTick(); o.gone = techPools.length; return o; })()`);
        same(r.tick, 10, 'the clock'); same(r.day, 72000, 'a day'); same(r.life, 144000, 'a pool\'s life'); same(r.bite, r.want, 'the bite (the toxic cloud\'s)');
        same(r.oneSecond, 2, 'bites in a second'); same(r.k, 0.5, 'at one day'); same(r.half.join(), 'true,false', 'its size at one day'); same(r.halfBite, 0.5, 'its bite at one day');
        same(r.mine, 0, 'it hurt a follower'); same(r.lastFrame, 1, 'gone before two days'); same(r.gone, 0, 'there after two days');
    });
    check('saved: the clock and the pools; put back as they were (nothing passes while the game is closed); putting the same save back again changes nothing (no pool is stretched, no fade doubled); a new game starts the clock again', () => {
        const r = J(`(function(){ const fs = __fresh(['toxic']), t = fs[0], o = {}; techPools = []; techClock = 50000; _techPoolLay(t, t.x + 2.5, t.y + 0.5); techClock += 30000;
            const save = facilitySaveCollect(); o.saved = save.blight; const k0 = techPoolFade(techPools[0]);
            techBlightApply(save.blight); techBlightApply(save.blight); o.back = [techClock, techPools.length, techPoolFade(techPools[0]) === k0];
            techReset(); o.reset = [techClock, techPools.length]; techBlightApply(save.blight); return o; })()`);
        same(r.saved.clock, 80000, 'the clock saved'); same(r.saved.pools.length, 1, 'the pools saved'); same(r.back.join(), '80000,1,true', 'put back'); same(r.reset.join(), '0,0', 'a new game');
    });

    group('TELEGRAB (flux)');
    // ASKED: "Implement the Level 1 Telegrab ability using existing targeting and item-interaction systems", then any item on the ground, any distance (supply cases, scrap, capsules, rocks), pulled to the player and collected once
    // through the existing pickup; shards stay paid at the kill.
    check('the chip, then an item on the floor anywhere (out of the technician\'s sight too): it flies to the player and the pickup takes it, once; a specimen capsule goes into the pack the same way; the cooldown is 60 s', () => {
        const r = J(`(function(){ const fs = __fresh(['flux', 'fire']), t = fs[0], o = {}; const it = _fp.items.find(i => i.fp === 'pickup' && !i.taken && !i.rock && (!i.cls) && i.items.every(([id, n]) => invRoom(id) >= n)); o.far = Math.round(Math.hypot(it.x - t.x, it.y - t.y)); o.sees = facilityLosFrom(t.x, t.y, it.x, it.y);
            const id = it.items[0][0], n0 = invCount(id); o.n = it.items[0][1]; techChipTap(t); o.prompt = techAimPrompt(); techAimPickItem({ kind: 'pickup', o: it }); o.cool = techReadyIn(t); o.flying = !!it.grab;
            for (let i = 0; i < 45; i++) { frame++; techAbilityTick(); } o.at = [Math.hypot(it.x - player.x, it.y - player.y) < 0.01, !it.grab]; facilityPickupTick(); o.took = [it.taken, invCount(id) - n0]; facilityPickupTick(); o.once = invCount(id) - n0;
            const g = fs[1], b = specimenFollowerFell(g); b.frozen = true; b.x = player.x + 7; b.y = player.y + 1; const c0 = invCount('specimen_capsule'); t._abReadyAt = frame;
            o.capOk = techAbilityUse(t, { item: { kind: 'capsule', o: b } }).ok; for (let i = 0; i < 45; i++) { frame++; techAbilityTick(); } specimenTick(); o.cap = [invCount('specimen_capsule') - c0, cloneBodies.includes(b)];
            t._abReadyAt = frame; techChipTap(t); o.miss = techAimTap(5, 5) && techAimActive(); techAimCancel(true); return o; })()`);
        ok(r.far > 4, 'the item is near: ' + r.far); ok(/TELEGRAB · TAP AN ITEM ON THE FLOOR/.test(r.prompt), r.prompt); same(r.cool, 3600, 'the cooldown'); same(r.flying, true, 'not flying');
        same(r.at.join(), 'true,true', 'it did not come to the player'); same(r.took.join(), 'true,' + r.n, 'not taken'); same(r.once, r.n, 'taken twice'); same(r.capOk, true, 'a capsule'); same(r.cap.join(), '1,false', 'the capsule not in the pack');
        same(r.miss, true, 'a tap on nothing ended the aim');
    });

    group('ALL SIX, AND THE CODE THAT CARRIES THEM');
    check('every element\'s technician has its ability and its chip mark; the ring, the save, the floor drawing and the walks are wired', () => {
        const r = J(`(function(){ return Object.keys(TECH_ABILITIES).map(k => k + ':' + TECH_ABILITIES[k].id + ':' + TECH_ABILITIES[k].icon); })()`);
        same(r.join(), 'electric:kinetic_launcher:⚡,core:photonic_shield:◈,fire:thermite_drill:✹,ice:frost_patch:❄,toxic:blight_spider:☣,flux:telegrab:✦', 'the six');
        const I = rd('js/input.js'), D = rd('js/draw.js'), C = rd('js/commands.js'), S = rd('js/facilitysave.js'), G = rd('js/game.js'), N = rd('js/npc.js'), FD = rd('js/facilitydecor.js');
        ok(/techRubbleAtScreen\(ex, ey\)/.test(I) && /_ring\.up\.act \+ "_tech"/.test(I), 'the press and the release'); ok(/ring\.up\.act \+ "_tech"/.test(D), 'the ring'); ok(/techRingAct\(commandTechTarget/.test(C), 'the command');
        ok(S.indexOf('techRubbleApply(d.rubble)') < S.indexOf('const taken = new Set(d.taken'), 'the rubble before the taken pickups'); ok(/techBlightApply\(d\.blight\)/.test(S) && /rubble: typeof techRubbleSnapshot/.test(S) && /blight: typeof techBlightSnapshot/.test(S), 'the save');
        ok(/techDrawOnTile\(obj\.x, obj\.y, px, py\)/.test(G), 'the floor drawing'); ok(/techStepWants\(actor\) && techStepOverride\(actor\)\) return;/.test(N), 'the walks'); ok(/rubble: \(it, f\) => \{ if \(typeof techDrawRubbleOn/.test(FD), 'the rubble on the rock');
        ok(!/shadowBlur/.test(rd('js/techabilities.js')), 'shadowBlur');
    });

    group('THE RUBBLE\'S RING, THE CHIPS AND THE TAPS (real browser)');
    const b = measure(1180, 820);
    if (b === null) console.log('  (no Chromium here: skipped)');
    else {
        check('1180x820: the instrument ran', () => { ok(b, 'the probe produced nothing'); same(b.err, undefined, 'the probe threw'); });
        if (b && !b.err) {
            check('the chips of a fire, an ice and a flux technician; a long press on the rubble opens its ring and a release up sends the fire technician to drill it', () => {
                same((b.chips || []).join(), '✹ DRILL,❄ FROST,✦ GRAB', 'the chips'); same(b.ring.mode && b.ring.tech, true, 'the ring did not open on the rubble'); same(b.drill, true, 'nobody went to drill');
            });
            check('the ice chip and a tap on the floor: the patch; the flux chip and a tap on a supply case: it flies to the player', () => {
                same(b.frost, 9, 'the patch'); same(b.grab, true, 'the case did not fly');
            });
        }
    }

    console.log(failures ? `\n${failures} FAILING\n` : '\nall passing\n');
    process.exit(failures ? 1 : 0);
})();
