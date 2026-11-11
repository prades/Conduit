// THE FOLLOWER COMBAT REDESIGN (the owner's brief "CONDUIT — FOLLOWER COMBAT REDESIGN · Fire & Electric Follower Attack Implementation Brief", 2026-11-02; docs/FOLLOWER-COMBAT-REDESIGN.md).
// The brief's Phase 3 list: QUILLSTONE (QUILL BURST: exactly five quills, at once, each on its own, stopping at the first enemy, no piercing, no splash), EMBER HOOD (FIREBALL; HEXFIRE's circle
// placed, stationary, its duration and damage, never growing or travelling), STATIC ORB (SONIC ROLL kept; PINBALL: the nearest targets, never one twice, ending, never looping), THUNDERHEAD
// (CHAIN LIGHTNING by distance: clusters chain further, a gap breaks it; STATIC VORTEX: stationary, pulling in, biting on), and HOVER SHELL with its KINETIC LAUNCHER unchanged.
// THERMITE BURROWER (BURROW STRIKE's targeting and eruption; FAULTLINE's freehand path, followed under the floor, its eruptions, on a chip of its own beside the THERMITE DRILL; touch in the real browser).
// Every number read here is the code's own, PROVISIONAL constant.
const fs = require('fs');
const vm = require('vm');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');
const { ROOT, scriptOrder, makeBrowserSandbox } = require('./domstub.js');
process.on('unhandledRejection', () => {});

let failures = 0;
function group(n) { console.log('\n' + n); }
function check(name, fn) { try { fn(); console.log('  ok   ' + name); } catch (e) { failures++; console.log('  FAIL ' + name + ' — ' + e.message); } }
function ok(c, m) { if (!c) throw new Error(m); }
function same(a, b, m) { if (a !== b) throw new Error(`${m}: expected ${JSON.stringify(b)}, got ${JSON.stringify(a)}`); }
const rd = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');
function findChromium() {
    const fromEnv = process.env.CHROMIUM_PATH; if (fromEnv && fs.existsSync(fromEnv)) return fromEnv;
    const base = process.env.PLAYWRIGHT_BROWSERS_PATH || '/opt/pw-browsers'; let dirs = [];
    try { dirs = fs.readdirSync(base); } catch (e) { return null; }
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-headless-shell-linux64/chrome-headless-shell', 'chrome-linux/headless_shell', 'chrome-linux/chrome', 'chrome-linux64/chrome']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
    for (const p of ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome']) if (fs.existsSync(p)) return p;
    return null;
}
// THE REAL PAGE (FAULTLINE by touch): an evolved Thermite Burrower in the squad; its card's two chips; a tap on FAULTLINE's; a path drawn on the canvas with a finger's pointer events (pointerType
// "touch": the canvas listens to pointer events for a mouse and a finger alike, js/input.js); then a second stroke the system cancels (pointercancel).
const SCRIPT = `<script>window.addEventListener('load', function(){ setTimeout(async function(){
  var out = {}, wait = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); }, $ = function(s){ return document.querySelector(s); }, step = function(n){ for (var i = 0; i < n; i++) render(); };
  canvas.setPointerCapture = function(){};   // (a synthetic pointer is not a real one: capturing it throws)
  var rect = function(e){ if (!e) return null; var b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.right), Math.round(b.bottom)]; };
  var scr = function(wx, wy){ var sx = (wx - player.visualX - (wy - player.visualY)) * TILE_W + canvas.width / 2, sy = (wx - player.visualX + (wy - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H; for (var i = 0; i < 8; i++) { var w = techScreenToWorld(sx, sy), ex = wx - w.x, ey = wy - w.y; if (Math.hypot(ex, ey) < 1e-4) break; sx += (ex - ey) * TILE_W; sy += (ex + ey) * TILE_H; } return { x: sx, y: sy }; };
  var touch = function(type, x, y, id){ var r = canvas.getBoundingClientRect(); id = id || 11; canvas.dispatchEvent(new PointerEvent(type, { bubbles: true, cancelable: true, clientX: r.left + x * r.width / canvas.width, clientY: r.top + y * r.height / canvas.height, pointerId: id, pointerType: 'touch', isPrimary: id === 11 })); };
  try {
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(300);
    gameState.running = true; crystalMenuOpen = false; selectedUnits.clear();
    actors = actors.filter(function(a){ return !(a instanceof Predator); });
    var t = followers[0]; t.element = 'fire'; t.role = 'camper'; t.evolved = 'thermite'; t._moltAt = -1e9; energyFill(t); followers.slice(1).forEach(function(f){ f.role = 'brawler'; f.evolved = undefined; });
    var said = [], keepSay = _techSay; _techSay = function(m){ said.push(m); return keepSay.apply(this, arguments); };   // (what the game tells the player, in case a path is refused)
    var cells = partyRoomCells('arena'), set = new Set(cells.map(function(c){ return c[0] + ',' + c[1]; })), best = null, bn = -1;   // (the arena's most open patch of floor, as the node checks use: where the Burrower stands, the player beside it)
    cells.forEach(function(c){ var n = 0; for (var dx = -6; dx <= 6; dx++) for (var dy = -6; dy <= 6; dy++) if (set.has((c[0] + dx) + ',' + (c[1] + dy))) n++; if (n > bn) { bn = n; best = c; } });
    var put = function(){ t.x = best[0] + 0.5; t.y = best[1] + 0.5; t.job = null; t.stance = 'hold'; player.x = player.visualX = t.x - 2; player.y = player.visualY = t.y; };
    put(); step(12); partyTick(); t._ab2ReadyAt = 0; t._abReadyAt = 0; put(); step(7); partyTick(); put();
    var slot = Array.prototype.slice.call(document.querySelectorAll('#squadBar .sb-slot')).find(function(e){ return e._unit === t; }), c1 = slot && slot.querySelector('.sb-ab'), c2 = slot && slot.querySelector('.sb-ab2');
    out.chips = { has1: !!slot && slot.classList.contains('has-ab'), has2: !!slot && slot.classList.contains('has-ab2'), t1: c1 && c1.textContent, t2: c2 && c2.textContent, r1: rect(c1), r2: rect(c2), shown2: c2 ? getComputedStyle(c2).display : null };
    (t.ultimateCharge = 100, followerUltimate(t).execute(t)); step(2);
    out.aim = { on: document.body.classList.contains('tech-aiming'), prompt: $('#techAim .ta-t').textContent, chip2: c2 ? c2.textContent : null, chip1: c1.textContent };
    var cx = t.x, cy = t.y, pts = []; for (var i = 0; i <= 24; i++) { var th = Math.PI * (1 - i / 24) / 2; pts.push(scr(cx + 3 - 2.5 * Math.cos(th), cy + 2.5 - 2.5 * Math.sin(th))); }
    touch('pointerdown', pts[0].x, pts[0].y); for (var j = 1; j < pts.length; j++) touch('pointermove', pts[j].x, pts[j].y); touch('pointerup', pts[pts.length - 1].x, pts[pts.length - 1].y); step(1);
    out.sent = { fault: !!t._fault, n: t._fault ? t._fault.pts.length : 0, len: t._fault ? Math.round(t._fault.cum[t._fault.cum.length - 1] * 100) / 100 : 0, aiming: document.body.classList.contains('tech-aiming'), start: t._fault ? [Math.round((t._fault.pts[0].x - cx) * 100) / 100, Math.round((t._fault.pts[0].y - cy) * 100) / 100] : null, said: said.slice(-3), at: [Math.round(cx * 10) / 10, Math.round(cy * 10) / 10], stroke: techAim && techAim.stroke ? techAim.stroke.length : null,
      panels: [typeof infoPanelOpen !== 'undefined' && infoPanelOpen, typeof settingsPanelOpen !== 'undefined' && settingsPanelOpen, typeof questBoxOpen !== 'undefined' && questBoxOpen, typeof classPickerOpen !== 'undefined' && classPickerOpen, typeof invPanelOpen !== 'undefined' && invPanelOpen, typeof armoryPanelOpen !== 'undefined' && armoryPanelOpen, typeof cloneMenuOpen !== 'undefined' && cloneMenuOpen].map(function(b){ return b ? 1 : 0; }).join('') };
    for (var k = 0; k < 400 && t._fault; k++) step(1);
    out.run = { over: !t._fault, up: !t.untargetable };
    t._ab2ReadyAt = 0; partyTick(); (t.ultimateCharge = 100, followerUltimate(t).execute(t)); step(1);
    var on2 = document.body.classList.contains('tech-aiming');
    touch('pointerdown', pts[0].x, pts[0].y); touch('pointermove', pts[6].x, pts[6].y); touch('pointercancel', pts[6].x, pts[6].y); step(1);
    out.cancel = { was: on2, aiming: document.body.classList.contains('tech-aiming'), fault: !!t._fault };
    // A SECOND FINGER while the path is drawn (build 2026-11-06b): it is ignored, its moves and its lift. Once with the stray finger lifting first, once with the drawing finger lifting first.
    var two = function(strayFirst){
      for (var k2 = 0; k2 < 400 && t._fault; k2++) step(1);
      put(); if (techAim) techAimCancel(); t._ab2ReadyAt = 0; partyTick(); (t.ultimateCharge = 100, followerUltimate(t).execute(t)); step(1);
      var bx = t.x, by = t.y, ps = []; for (var i2 = 0; i2 <= 24; i2++) { var th2 = Math.PI * (1 - i2 / 24) / 2; ps.push(scr(bx + 3 - 2.5 * Math.cos(th2), by + 2.5 - 2.5 * Math.sin(th2))); }
      var st = scr(player.x - 1.5, player.y + 1);   // floor beside you, away from the Burrower: a tap there would walk you
      player.fpPath = null;
      touch('pointerdown', ps[0].x, ps[0].y, 11); for (var j3 = 1; j3 <= 10; j3++) touch('pointermove', ps[j3].x, ps[j3].y, 11);
      touch('pointerdown', st.x, st.y, 12); touch('pointermove', st.x + 6, st.y + 3, 12);
      if (strayFirst) touch('pointerup', st.x + 6, st.y + 3, 12);
      for (var j4 = 11; j4 < ps.length; j4++) touch('pointermove', ps[j4].x, ps[j4].y, 11);
      touch('pointerup', ps[ps.length - 1].x, ps[ps.length - 1].y, 11);
      if (!strayFirst) { touch('pointermove', st.x + 9, st.y + 5, 12); touch('pointerup', st.x + 9, st.y + 5, 12); }
      step(1);
      return { fault: !!t._fault, len: t._fault ? Math.round(t._fault.cum[t._fault.cum.length - 1] * 100) / 100 : 0, start: t._fault ? [Math.round((t._fault.pts[0].x - bx) * 100) / 100, Math.round((t._fault.pts[0].y - by) * 100) / 100] : null, walked: !!player.fpPath, aiming: document.body.classList.contains('tech-aiming'), said: said.slice(-2) };
    };
    out.twoA = two(true); out.twoB = two(false);
    // A finger set aside whose lift the canvas never sees (build 2026-11-06b): its id is not kept, so the next press with it is an ordinary tap and walks you
    for (var k3 = 0; k3 < 400 && t._fault; k3++) step(1);
    put(); if (techAim) techAimCancel(); t._ab2ReadyAt = 0; partyTick(); (t.ultimateCharge = 100, followerUltimate(t).execute(t)); step(1);
    var st3 = scr(player.x - 1.5, player.y + 1), p3 = scr(t.x + 0.5, t.y + 2.5);
    touch('pointerdown', p3.x, p3.y, 11); touch('pointerdown', st3.x, st3.y, 13); touch('pointerup', p3.x, p3.y, 11); step(1);
    var aimed3 = document.body.classList.contains('tech-aiming'); if (techAim) techAimCancel(); step(1);
    player.fpPath = null; touch('pointerdown', st3.x, st3.y, 13); touch('pointerup', st3.x, st3.y, 13); step(1);
    out.lost = { aimed: aimed3, walked: !!player.fpPath, aiming: document.body.classList.contains('tech-aiming') };
  } catch (err) { out.err = String(err && err.stack || err); }
  var pre = document.createElement('pre'); pre.id = '__fc'; pre.textContent = JSON.stringify(out); document.body.appendChild(pre);
}, 2000); });</script></body>`;
function measure(w, h) {
    const bin = findChromium(); if (!bin) return null;
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'fc-')), file = path.join(dir, 'game.html');
    fs.writeFileSync(file, rd('game.html').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">').replace(/<\/body>/i, () => SCRIPT));
    let dom = '';
    try { dom = execFileSync(bin, ['--headless=new', '--no-sandbox', '--disable-gpu', '--allow-file-access-from-files', '--window-size=' + w + ',' + h, '--virtual-time-budget=60000', '--dump-dom', 'file://' + file], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 150000, stdio: ['ignore', 'pipe', 'ignore'] }); } catch (e) { dom = (e && e.stdout) || ''; }
    try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {}
    const m = dom.match(/<pre id="__fc">([\s\S]*?)<\/pre>/); return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')) : undefined;
}

(async () => {
    const context = vm.createContext(makeBrowserSandbox({}));
    for (const rel of scriptOrder()) { try { vm.runInContext(rd(rel), context, { filename: rel }); } catch (e) {} }
    for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
    const run = s => vm.runInContext(s, context);
    vm.runInContext('globalThis.__arm = (f, id) => { const d = evolvedDef(f); f.alt = id || (f.move && evoMoveAllowed(f, d, f.move) ? f.move : evoMoveIds(d)[0]); f._altLive = null; f._altWind = 1; };', context);   // (the alternate as a chosen mode, js/moves.js: __arm locks a follower on its alternate and fires it on the next evolutionTick)
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; facilityBlackoutSet(false); unlockedElements = new Set(ELEMENTS.map(e => e.id)); TUT.followerLevel = 0; for (const s of hazardSolids()) if (s.room === 'arena') facilitySolidSet(s.id, true);`);   // (the arena's hazard containers, build 2026-11-09yy, taken off the floor: the open patch below had one beside it, which stopped quills and went off)
    // An open patch of the arena's floor (the cell with the most floor round it), the player off to one side; creatures that hold still and do not die; a follower of a form at level 20.
    run(`(function(){ const cells = partyRoomCells('arena'), set = new Set(cells.map(c => c[0] + ',' + c[1])); let best = null, bn = -1;
        for (const [x, y] of cells) { let n = 0; for (let dx = -6; dx <= 6; dx++) for (let dy = -6; dy <= 6; dy++) if (set.has((x + dx) + ',' + (y + dy))) n++; if (n > bn) { bn = n; best = [x, y]; } }
        globalThis.__C = [best[0] + 0.5, best[1] + 0.5]; player.x = player.visualX = __C[0] - 8; player.y = player.visualY = __C[1]; })();
        globalThis.__pinOn = () => { if (!globalThis.__soMoves) globalThis.__soMoves = EVOLUTIONS.staticorb.moves.slice(); EVOLUTIONS.staticorb.moves = ['static_rush', 'pinball']; };   // (PINBALL is superseded by CAPACITOR DISCHARGE since build 2026-11-07ss: its checks turn it back on for themselves, as its code is kept)
        globalThis.__clear = () => { if (globalThis.__soMoves) { EVOLUTIONS.staticorb.moves = globalThis.__soMoves; globalThis.__soMoves = null; } actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k] = []; followerProjectiles.length = 0; elementEffects.length = 0; floatingTexts.length = 0; frame++; };
        globalThis.__foe = (x, y, sp) => { const S = SPECIES[sp || 'ant'], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp || 'ant'; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
        globalThis.__fol = (el, role, evo) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.evolved = evo || undefined; if (evo) energyFill(f); f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.stance = 'hold'; f.x = __C[0]; f.y = __C[1]; return f; };
        globalThis.__off = f => { actors = actors.filter(a => a !== f); followers = followers.filter(a => a !== f); };   // (out of the world: its own AI and melee add nothing; its shots and fields keep it as their source)
        globalThis.__dmg = p => 1e6 - p.health;
        globalThis.__fire = f => { frame++; __arm(f); evolutionTick(); };
        globalThis.__fireQ = f => { __fire(f); for (let i = 0; i < QUILL_FIRE; i++) { frame++; evolutionTick(); } };   // (QUILL BURST: the Quillstone turns, and its quills leave QUILL_FIRE frames after the cast: build 2026-11-11n)
        globalThis.__one = (f, x, y, sp) => { const twin = __foe(x, y, sp); return twin; };
        globalThis.__scr = (wx, wy) => { let sx = (wx - player.visualX - (wy - player.visualY)) * TILE_W + canvas.width / 2, sy = (wx - player.visualX + (wy - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H; for (let i = 0; i < 8; i++) { const w = techScreenToWorld(sx, sy), ex = wx - w.x, ey = wy - w.y; if (Math.hypot(ex, ey) < 1e-4) break; sx += (ex - ey) * TILE_W; sy += (ex + ey) * TILE_H; } return { x: sx, y: sy }; };
        globalThis.__burrower = () => { const f = __fol('fire', 'camper', 'thermite'); partyAdd([f]); techAbilityTick(); f._abReadyAt = 0; f._ab2ReadyAt = 0; f.attackCooldown = 0; f.ultimateCharge = 100; return f; };   // (FAULTLINE is its Ultimate: charged)
        globalThis.__draw = (f, wpts) => { const sp = wpts.map(p => __scr(f.x + p[0], f.y + p[1])); techAimPathStart(sp[0].x, sp[0].y); for (let i = 1; i < sp.length; i++) techAimPathMove(sp[i].x, sp[i].y); return techAimTap(sp[sp.length - 1].x, sp[sp.length - 1].y); };
        globalThis.__arc = (R, n) => { const o = []; for (let i = 0; i <= n; i++) { const th = Math.PI * (1 - i / n) / 2; o.push([1 + R - R * Math.cos(th), R - R * Math.sin(th)]); } return o; };`);

    // ── QUILLSTONE ──────────────────────────────────────────
    group('QUILLSTONE (fire Brawler): QUILL BURST, five crystal quills at once, each stopping at the first enemy it hits; its main attack kept (FIRE BOMBS taken off it, 2026-11-07)');
    check('EXACTLY five quills, all launched at once (the same frame, QUILL_FIRE frames after the cast, from the Quillstone), in a forward fan QUILL_FAN degrees edge to edge with the middle one at the nearest enemy', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'), t = __foe(f.x + 3, f.y + 1); __fireQ(f);
            const q = followerProjectiles.filter(p => p.kind === 'quill'), a0 = Math.atan2(t.y - f.y, t.x - f.x) * 180 / Math.PI, ang = q.map(p => Math.atan2(p.vy, p.vx) * 180 / Math.PI - a0);
            return { n: q.length, all: followerProjectiles.length, born: q.every(p => p.frame === 0 && p.x === f.x && p.y === f.y && p.source === f), ang, fan: QUILL_FAN, count: QUILL_COUNT, cd: f._sigCd, every: moveWindupFrames("quill_burst") }; })()`);
        same(r.count, 5, 'QUILL_COUNT (approved: exactly five)'); same(r.n, 5, 'quills'); same(r.all, 5, 'shots in all'); ok(r.born, 'not all launched together from the Quillstone');
        const s = r.ang.slice().sort((a, b) => a - b); ok(Math.abs(s[0] + r.fan / 2) < 1e-6 && Math.abs(s[4] - r.fan / 2) < 1e-6 && Math.abs(s[2]) < 1e-6, 'the fan: ' + JSON.stringify(s));
        for (let i = 1; i < 5; i++) ok(Math.abs(s[i] - s[i - 1] - r.fan / 4) < 1e-6, 'evenly spread: ' + JSON.stringify(s));
        same(r.cd, r.every, 'its wait');
    });
    check('each quill travels on its own: its own heading and speed, the follower shots\' flight, as far as QUILL_RANGE and no farther', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'); __foe(f.x + 3, f.y); __fireQ(f); __off(f); actors = actors.filter(a => !(a instanceof Predator));
            const q = followerProjectiles.filter(p => p.kind === 'quill'), s0 = q.map(p => [p.x, p.y]); let fr = 0; while (followerProjectiles.length && fr < 200) { render(); fr++; }
            const far = q.map((p, i) => Math.hypot(p.x - s0[i][0], p.y - s0[i][1]));
            return { speeds: q.map(p => Math.hypot(p.vx, p.vy)), heads: new Set(q.map(p => Math.round(Math.atan2(p.vy, p.vx) * 1000))).size, far, range: QUILL_RANGE, speed: QUILL_SPEED, left: followerProjectiles.length }; })()`);
        same(r.heads, 5, 'five headings'); ok(r.speeds.every(v => Math.abs(v - r.speed) < 1e-9), 'speeds ' + r.speeds); same(r.left, 0, 'quills still flying');
        ok(r.far.every(d => d >= r.range - 1e-6 && d <= r.range + r.speed + 1e-6), 'how far each flew with nothing in the way: ' + r.far);
    });
    check('each stops at the FIRST enemy it touches: no piercing (an enemy in line behind the first takes no quill), no explosion, no fragment splash (all the damage is the quills\' own hits, one a quill)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'), front = __foe(f.x + 2, f.y), behind = __foe(f.x + 3.3, f.y), off = __foe(f.x + 2.6, f.y + 2.8); __fireQ(f); __off(f);
            const q = followerProjectiles.filter(p => p.kind === 'quill'), hits = [], dmg = [];
            for (const p of q) { const o = p.onHit; p.onHit = a => { hits.push([q.indexOf(p), a === front ? 'front' : a === behind ? 'behind' : a === off ? 'off' : 'other']); if (o) o(a); }; }
            const keep = applyDamage; globalThis.applyDamage = function (t, amt, src) { dmg.push(t === front ? 'front' : t === behind ? 'behind' : t === off ? 'off' : 'other'); return keep.apply(this, arguments); };
            let fr = 0; try { while (followerProjectiles.length && fr < 200) { render(); fr++; } } finally { globalThis.applyDamage = keep; }
            const twin = __foe(f.x + 40, f.y + 40); applyDamage(twin, f.power * QUILL_MULT, f, null, false, false, DMG_HIT_ALT);
            return { hits, dmg, d: [__dmg(front), __dmg(behind), __dmg(off)], one: __dmg(twin), fx: elementEffects.map(e => e.type) }; })()`);
        ok(r.hits.length >= 1 && r.hits.length <= 5, 'quill hits: ' + JSON.stringify(r.hits));
        same(new Set(r.hits.map(h => h[0])).size, r.hits.length, 'a quill hit twice (it pierced)'); ok(r.hits.every(h => h[1] === 'front'), 'a quill passed the front enemy: ' + JSON.stringify(r.hits));
        same(r.d[1], 0, 'the enemy behind took damage'); same(r.d[2], 0, 'the enemy beside the fan took damage');
        same(r.dmg.length, r.hits.length, 'damage beyond the quills\' own hits (an explosion or a splash): ' + JSON.stringify(r.dmg));
        ok(Math.abs(r.d[0] - r.hits.length * r.one) < 1e-6 * r.d[0] + 1e-6, 'a quill\'s hit is power × QUILL_MULT through the damage system: ' + JSON.stringify(r));
        ok(!r.fx.some(t => /impact|splash|explo/i.test(t)), 'an impact or splash effect: ' + r.fx);
    });
    check('a cluster catches several quills and spread-out enemies fewer: five enemies across the fan take one each; one enemy close up takes them all', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'), out = {};
            const near = __foe(f.x + 1.0, f.y); __fireQ(f); __off(f); { let fr = 0; while (followerProjectiles.length && fr < 200) { render(); fr++; } } out.close = __dmg(near); near.dead = true;
            frame++; followers.push(f); actors.push(f); const ps = [-20, -10, 0, 10, 20].map(d => { const R = d ? 3.9 : 3.8, an = (90 + d) * Math.PI / 180; return __foe(f.x + Math.cos(an) * R, f.y + Math.sin(an) * R); });   // (the middle one the nearest, so the fan is aimed at it; the fan down the floor's y, its quills spread along x, where a shot's touch is narrowest: js/game.js tests 30 px of (dx × TILE_W, dy × TILE_H))
            __fireQ(f); __off(f); { let fr = 0; while (followerProjectiles.length && fr < 200) { render(); fr++; } } out.spread = ps.map(__dmg);
            const twin = __foe(f.x + 40, f.y + 40); applyDamage(twin, f.power * QUILL_MULT, f, null, false, false, DMG_HIT_ALT); out.one = __dmg(twin); return out; })()`);
        ok(Math.abs(r.close - 5 * r.one) < 1e-6 * r.close + 1e-6, 'close up, five quills in one enemy: ' + JSON.stringify(r));
        ok(r.spread.every(d => Math.abs(d - r.one) < 1e-6 * d + 1e-6), 'across the fan, a quill each: ' + JSON.stringify(r));
    });
    check('nobody in reach: no quills and no wait spent; QUILL BURST its one alternate on INFO (FIRE BOMBS taken off it, 2026-11-07); its main attack (the Brawler\'s plain hit, Piercing) is kept', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'); __foe(f.x + QUILL_RANGE + 0.6, f.y); __fire(f);
            return { n: followerProjectiles.length, cd: f._sigCd, ids: evoMoveIds(EVOLUTIONS.quillstone), def: evoMoveIds(EVOLUTIONS.quillstone)[0], info: followerInfo(f).attacks.filter(s => s.choices).map(s => s.choices.map(c => c.label)), main: DMG_FORM.quillstone.main, alt: DMG_FORM.quillstone.alt, shot: EVOLUTIONS.quillstone.shot || null }; })()`);
        same(r.n, 0, 'quills at an enemy out of reach'); ok(!(r.cd > 0), 'a wait for nothing: ' + r.cd);
        same(r.ids.join(), 'quill_burst', 'its moves'); same(r.def, 'quill_burst', 'its first move'); same(JSON.stringify(r.info), JSON.stringify([['NORMAL ATTACK', 'QUILL BURST']]), 'the INFO choice (2026-11-07: its normal attack, or an alternate)');
        same(r.main, 'piercing', 'its main attack\'s type'); same(r.alt, 'projectile', 'QUILL BURST\'s type'); same(r.shot, null, 'a shot of its own (a Brawler has none)');
    });

    // ── EMBER HOOD ──────────────────────────────────────────
    group('EMBER HOOD (fire Mage): FIREBALL, the direct shot; HEXFIRE, a shot that leaves a stationary burning circle, enemies only');
    check('FIREBALL is its everyday shot: the Mages\' fire projectile at the nearest enemy, SP.ATK × MAGE_SHOT_MULT, a plain hit (no effect of its own), named FIREBALL on INFO', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'sniper', 'embercowl'), t = __foe(f.x + 3.5, f.y); f.attackCooldown = 0; f._sigCd = 1e9;
            let fr = 0; while (!followerProjectiles.length && fr < 120) { frame++; updateNPC(f); fr++; }
            const p = followerProjectiles[0], i = followerInfo(f).attacks.find(s => /^MAIN ATTACK/.test(s.h));
            return { got: !!p, el: p && p.element, kind: p ? p.kind || null : null, onHit: p ? !!p.onHit : null, hit: p && p.hit === DMG_HIT_SHOT, dmg: p && p.damage, want: f.stats.specialAttack * MAGE_SHOT_MULT, shot: EVOLUTIONS.embercowl.shot, info: i && i.h }; })()`);
        ok(r.got, 'no shot'); same(r.el, 'fire', 'its element'); same(r.kind, null, 'a special look (it is the fire shot, drawn as a fireball)'); same(r.onHit, false, 'an effect of its own'); ok(r.hit, 'not the Mages\' shot');
        ok(Math.abs(r.dmg - r.want) < 1e-9, 'damage ' + r.dmg + ' not ' + r.want); same(r.shot, 'FIREBALL', 'its name'); same(r.info, 'MAIN ATTACK · FIREBALL', 'INFO');
    });
    check('HEXFIRE: one shot at the nearest enemy in reach, doing no damage itself; where it lands, a circle HALO_RADIUS tiles round that bites every enemy in it at once and every HALO_TICK frames, then is gone after HALO_LIFE frames', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'sniper', 'embercowl'), t = __foe(f.x + 5, f.y + 0.5); __fire(f); __off(f);
            const shot = followerProjectiles.find(p => p.kind === 'hex'); let fr = 0, c = null; while (!c && fr < 200) { render(); fr++; c = elementEffects.find(e => e.type === 'hexfire'); }
            const at = c && { x: c.x, y: c.y, r: c.radius, life: c.life, maxLife: c.maxLife }, first = __dmg(t), bites = []; let last = first, k = 0;
            while (elementEffects.some(e => e.type === 'hexfire') && k < 400) { render(); k++; const d = __dmg(t); if (d !== last) { bites.push(k); last = d; } }
            const twin = __foe(f.x + 40, f.y + 40); applyDamage(twin, f.power * HALO_BITE, f, 'fire', false, false, DMG_HIT_ALT);
            return { shot: shot ? shot.damage : null, landed: fr, at, t: [t.x, t.y], first, bites, after: k, one: __dmg(twin), r: HALO_RADIUS, tick: HALO_TICK, life: HALO_LIFE }; })()`);
        same(r.shot, 0, 'the shot\'s own damage'); ok(r.at, 'no circle');
        ok(Math.hypot(r.at.x - r.t[0], r.at.y - r.t[1]) < 1.1, 'not where it landed on the enemy: ' + JSON.stringify(r)); same(r.at.r, r.r, 'its radius');
        ok(Math.abs(r.first - r.one) < 1e-6 * r.one + 1e-6, 'it bit at once as it landed: ' + JSON.stringify(r));
        ok(r.bites.length >= 6 && r.bites.every((b, i) => i === 0 || b - r.bites[i - 1] === r.tick), 'a bite every ' + r.tick + ' frames: ' + JSON.stringify(r.bites));
        ok(r.after <= r.life + 2 && r.after >= r.life - 2, 'it lasted ' + r.after + ' frames, not ' + r.life);
    });
    check('the circle is STATIONARY: it never travels and never grows, a creature walking out of it is no longer bitten, and one walking into it is', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'sniper', 'embercowl'), t = __foe(f.x + 5, f.y); __fire(f); __off(f);
            let fr = 0, c = null; while (!c && fr < 200) { render(); fr++; c = elementEffects.find(e => e.type === 'hexfire'); }
            const x0 = c.x, y0 = c.y, r0 = c.radius, late = __foe(c.x + 6, c.y); let moved = false;
            for (let i = 0; i < 40; i++) { render(); if (c.x !== x0 || c.y !== y0 || c.radius !== r0) moved = true; }
            t.x = c.x + 3; const out0 = __dmg(t); late.x = c.x + 0.3; const in0 = __dmg(late);
            for (let i = 0; i < 70; i++) { render(); if (c.x !== x0 || c.y !== y0 || c.radius !== r0) moved = true; }
            return { moved, outAfter: __dmg(t) - out0, inAfter: __dmg(late) - in0 }; })()`);
        same(r.moved, false, 'the circle moved or grew'); same(r.outAfter, 0, 'bitten after leaving it'); ok(r.inAfter > 0, 'not bitten after walking in');
    });
    check('enemies only (unlike FIRE BOMBS\' burning ground): a follower and the player in the circle take nothing; a new HEXFIRE takes the place of the same Ember Hood\'s last circle', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'sniper', 'embercowl'), t = __foe(f.x + 5, f.y), mate = __fol('fire', 'brawler', null); mate.x = t.x + 0.4; mate.y = t.y; mate.stance = 'hold';
            const mh = mate.health; __fire(f); __off(f); __off(mate);
            let fr = 0, c = null; while (!c && fr < 200) { render(); fr++; c = elementEffects.find(e => e.type === 'hexfire'); }
            const ph = health, px = player.x, py = player.y; player.x = c.x - 0.3; player.y = c.y;
            for (let i = 0; i < 100; i++) render(); const out = { mate: mh - mate.health, player: ph - health };
            player.x = px; player.y = py;
            followers.push(f); actors.push(f); __fire(f); __off(f); fr = 0; let n2 = 0; while (fr < 200) { render(); fr++; const cs = elementEffects.filter(e => e.type === 'hexfire' && e.by === f); n2 = Math.max(n2, cs.length); if (cs.length && cs[0] !== c) break; }
            out.circles = elementEffects.filter(e => e.type === 'hexfire' && e.by === f).length; out.most = n2; return out; })()`);
        same(r.mate, 0, 'the follower in it was hurt'); same(r.player, 0, 'the player in it was hurt'); same(r.circles, 1, 'circles of one Ember Hood'); same(r.most, 1, 'two at once');
    });
    check('a shot that touches nobody lands where it was aimed and leaves its circle there; the retired Cinder Halo shares the move; HEXFIRE its one alternate on INFO (FIRE BOMBS taken out, 2026-11-07)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'sniper', 'embercowl'), t = __foe(f.x + 5, f.y); __fire(f); __off(f); const aim = [t.x, t.y]; t.x += 30;
            let fr = 0, c = null; while (!c && fr < 200) { render(); fr++; c = elementEffects.find(e => e.type === 'hexfire'); }
            return { at: c && [c.x, c.y], aim, halo: evoMoveIds(EVOLUTIONS.halo), ember: evoMoveIds(EVOLUTIONS.embercowl), def: evoMoveOf(f).id }; })()`);
        ok(r.at && Math.hypot(r.at[0] - r.aim[0], r.at[1] - r.aim[1]) < 0.4, 'not where it was aimed: ' + JSON.stringify(r));
        same(r.halo.join(), 'hexfire', 'the Cinder Halo'); same(r.ember.join(), 'hexfire', 'the Ember Hood (FIRE BOMBS taken out, 2026-11-07)'); same(r.def, 'hexfire', 'its default');
    });

    // ── STATIC ORB ──────────────────────────────────────────
    group('STATIC ORB (electric Brawler): SONIC ROLL kept (STATIC RUSH renamed); PINBALL, an automatic ricochet from enemy to enemy');
    check('SONIC ROLL is STATIC RUSH renamed, kept as it is: the same id (a saved choice), function and numbers; the default move; dash, hit, shock two more, all stunned', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'), a = __foe(f.x + 3, f.y), b = __foe(f.x + 4.5, f.y + 0.6), c = __foe(f.x + 6, f.y + 1), far = __foe(f.x + 12, f.y);
            __fire(f); const d = __dmg;
            return { name: MOVES.static_rush.name, fn: MOVES.static_rush.fn.toString(), nums: [MANTA_RANGE, moveWindupFrames("static_rush"), MANTA_MULT, MANTA_CHAIN, MANTA_HOP, MANTA_CHAIN_SHARE, MANTA_STUN], def: evoMoveOf(f).id, ids: evoMoveIds(EVOLUTIONS.staticorb),
                     dist: Math.hypot(a.x - f.x, a.y - f.y), hit: [d(a), d(b), d(c), d(far)], stun: [a, b, c].every(p => p.stunned > 0), cd: f._sigCd, legacy: ['manta', 'prism', 'voltring'].map(k => EVOLUTIONS[k].move) }; })()`);
        same(r.name, 'SONIC ROLL', 'its name'); ok(/staticRush\(/.test(r.fn), 'its function'); same(r.nums.join(), '4,150,2.4,2,2.2,0.6,45', 'its numbers (unchanged but its time, halved in build 2026-11-10a: 300 frames before)');
        same(r.def, 'static_rush', 'the default'); same(r.ids.join(), 'static_rush,capacitor_discharge', 'its moves (PINBALL superseded by CAPACITOR DISCHARGE, build 2026-11-07ss)');
        ok(Math.abs(r.dist - 0.8) < 1e-6, 'the dash stops 0.8 short: ' + r.dist); ok(r.hit[0] > r.hit[1] && r.hit[1] > 0 && r.hit[2] > 0 && r.hit[3] === 0, 'hit and shocks: ' + r.hit); ok(r.stun, 'not stunned'); same(r.cd, 150, 'its wait (half the old 300 since build 2026-11-10a)');
        same(r.legacy.join(), 'SONIC ROLL,SONIC ROLL,SONIC ROLL', 'the retired electric brawlers');
    });
    check('PINBALL rolls into the nearest valid enemy, then each time into the nearest enemy it has NOT hit within PIN_HOP of it; an enemy farther than that ends it; no fixed count', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); __pinOn(); f.move = 'pinball';
            const a = __foe(f.x + 2, f.y), b = __foe(f.x + 4.2, f.y + 0.6), c = __foe(f.x + 5.5, f.y + 2.4), d = __foe(f.x + 6.4, f.y + 4.6), far = __foe(f.x + 6.4, f.y + 9), name = p => p === a ? 'a' : p === b ? 'b' : p === c ? 'c' : p === d ? 'd' : p === far ? 'far' : 'other';
            __fire(f); const order = [], keep = applyDamage; globalThis.applyDamage = function (t, amt, src, el, rf, fx, hit) { if (src === f && hit === DMG_HIT_ALT) order.push(name(t)); return keep.apply(this, arguments); };   // (the roll's own hits: its melee, once it has stopped, is another attack)
            let fr = 0; try { while (f._pinball && fr < 900) { frame++; updateNPC(f); fr++; } } finally { globalThis.applyDamage = keep; }
            return { order, ended: !f._pinball, fr }; })()`);
        same(r.order.join(), 'a,b,c,d', 'the order it hit them (four collisions, no count fixed)'); ok(r.ended, 'it did not end');
    });
    check('PINBALL never hits one enemy twice and never loops: two enemies side by side are hit once each and it stops; it ends with its wait (its WIND-UP, counted from the end) and fires nothing while rolling', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); __pinOn(); f.move = 'pinball'; const a = __foe(f.x + 2, f.y), b = __foe(f.x + 2.6, f.y + 0.4);
            __fire(f); const hits = [], keep = applyDamage; globalThis.applyDamage = function (t, amt, src, el, rf, fx, hit) { if (src === f && hit === DMG_HIT_ALT) hits.push(t === a ? 'a' : 'b'); return keep.apply(this, arguments); };
            let fr = 0, fired = 0; try { while (f._pinball && fr < 900) { const cd = f._sigCd; frame++; updateNPC(f); evolutionTick(); if (f._pinball && f._sigCd !== cd) fired++; fr++; } } finally { globalThis.applyDamage = keep; }
            return { hits, ended: !f._pinball, cd: f._sigCd, fired, every: moveWindupFrames("pinball"), fr }; })()`);
        same(r.hits.slice().sort().join(), 'a,b', 'hits'); ok(r.ended && r.fr < 100, 'it went on: ' + JSON.stringify(r)); same(r.fired, 0, 'its wait ran (or a move fired) while it rolled');
        ok(r.cd >= r.every - 1 && r.cd <= r.every, 'its wait after the roll: ' + r.cd);
    });
    check('PINBALL ROLLS (never more than PIN_SPEED tiles a frame) and stops cleanly at its safety limits: a target that keeps running off ends it by PIN_MAX_FRAMES or PIN_MAX_DIST', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); __pinOn(); f.move = 'pinball'; const a = __foe(f.x + 3, f.y); __fire(f);
            let fr = 0, most = 0, x = f.x, y = f.y; while (f._pinball && fr < 2000) { a.x = f.x + 1.5; a.y = f.y + (fr % 2 ? 0.3 : -0.3); frame++; updateNPC(f); most = Math.max(most, Math.hypot(f.x - x, f.y - y)); x = f.x; y = f.y; fr++; }   // (it runs on ahead every frame: a wall, PIN_MAX_FRAMES or PIN_MAX_DIST must stop it)
            return { most, speed: PIN_SPEED, fr, ended: !f._pinball, maxF: PIN_MAX_FRAMES, maxD: PIN_MAX_DIST }; })()`);
        ok(r.most <= r.speed + 1e-9, 'a frame\'s step ' + r.most); ok(r.ended, 'it never stopped: ' + JSON.stringify(r)); ok(r.fr <= r.maxF + 2, 'it rolled ' + r.fr + ' frames');
    });
    check('PINBALL: nobody in reach, no roll and no wait spent; an enemy it cannot see (a wall between) is not picked; PINBALL is the Static Orb\'s only (the retired electric brawlers keep SONIC ROLL alone)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); __pinOn(); f.move = 'pinball'; __foe(f.x + PIN_RANGE + 0.7, f.y); __fire(f); const out = { roll: !!f._pinball, cd: f._sigCd };
            out.legacy = ['manta', 'prism', 'voltring'].map(k => evoMoveIds(EVOLUTIONS[k]).join()); out.hover = evoMoveIds(EVOLUTIONS.hovershell).join();
            out.sees = (function(){ const g = { x: __C[0], y: __C[1] }, cells = partyRoomCells('arena'); return typeof _pinSees === 'function' && cells.length > 0; })(); return out; })()`);
        same(r.roll, false, 'a roll at an enemy out of reach'); ok(!(r.cd > 0), 'a wait for nothing: ' + r.cd); same(r.legacy.join('|'), 'static_rush|static_rush|static_rush', 'the retired forms'); same(r.hover, 'shock_zap', 'the Hover Shell\'s moves (BASH until build 2026-11-09c, then SHOCK ZAP, the owner\'s pick)'); ok(r.sees, 'no sight check');
        ok(/_pinSees\(f, a\)/.test(rd('js/evolution.js')) && /facilityLosFrom\(f\.x, f\.y, a\.x, a\.y\)/.test(rd('js/evolution.js')), 'PINBALL does not ask whether it can see its target');
    });

    // ── THUNDERHEAD ─────────────────────────────────────────
    group('THUNDERHEAD (electric Mage): CHAIN LIGHTNING, its everyday shot, conducting by distance; STATIC VORTEX, a stationary pull with continuous damage');
    check('CHAIN LIGHTNING respects distance: from the enemy struck, on to each next enemy within CHAIN_HOP of the last (a cluster carries it far), and a gap wider than that breaks it', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'); const A = __foe(f.x + 3, f.y), B = __foe(f.x + 5, f.y), C = __foe(f.x + 7, f.y), D = __foe(f.x + 9, f.y), gap = __foe(f.x + 12, f.y);
            frame++; const n = chainLightning(f, A, 40), close = [B, C, D, gap].map(__dmg);
            __clear(); const g = __fol('electric', 'sniper', 'thunderhead'), A2 = __foe(g.x + 3, g.y), B2 = __foe(g.x + 6, g.y), C2 = __foe(g.x + 6.5, g.y + 2.9); frame++; const n2 = chainLightning(g, A2, 40);
            return { n, close, n2, spread: [__dmg(B2), __dmg(C2)], hop: CHAIN_HOP }; })()`);
        same(r.hop, 2.5, 'CHAIN_HOP'); same(r.n, 3, 'jumps through a cluster 2 tiles apart'); ok(r.close[0] > 0 && r.close[1] > 0 && r.close[2] > 0, 'the cluster: ' + r.close); same(r.close[3], 0, 'across a 3-tile gap');
        same(r.n2, 0, 'jumps between enemies 3 tiles apart'); same(r.spread.join(), '0,0', 'damage across the gaps');
    });
    check('each jump does CHAIN_SHARE of the one before; each enemy is struck once (it never bounces back); it ends when a jump would do under CHAIN_MIN, with no fixed cap', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), ps = []; for (let i = 0; i < 9; i++) ps.push(__foe(f.x + 3 + i * 1.5, f.y + (i % 2) * 0.4));
            const sim = __foe(f.x + 40, f.y + 40); frame++; const n = chainLightning(f, ps[0], 30), got = ps.map(__dmg);
            const share = []; for (let i = 2; i < got.length && got[i] > 0; i++) share.push(got[i] / got[i - 1]);
            __clear(); const g = __fol('electric', 'sniper', 'thunderhead'), a = __foe(g.x + 3, g.y), b = __foe(g.x + 3.8, g.y); frame++; const twice = chainLightning(g, a, 30);
            __clear(); const h = __fol('electric', 'sniper', 'thunderhead'), q = []; for (let i = 0; i < 6; i++) q.push(__foe(h.x + 3 + i, h.y)); frame++; const weak = chainLightning(h, q[0], 2.5);
            return { n, got, share, twice, weak, min: CHAIN_MIN, k: CHAIN_SHARE }; })()`);
        ok(r.share.length >= 3 && r.share.every(s => Math.abs(s - r.k) < 1e-6), 'each jump ' + JSON.stringify(r.share) + ' of the last, not ' + r.k);
        ok(r.n >= 4, 'jumps through a long cluster: ' + r.n); same(r.got[0], 0, 'the first enemy (the shot\'s own) struck again by the chain');
        same(r.twice, 1, 'two enemies: one jump (none back)'); same(r.weak, 1, 'a 2.5 shot: 1.5, then 0.9 is under ' + r.min);
    });
    check('the Thunderhead\'s everyday shot IS the CHAIN LIGHTNING (the Mages\' shot, conducting on from the enemy it strikes); an electric Mage egg\'s and the retired Reaver\'s shots are plain', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), A = __foe(f.x + 3.5, f.y), B = __foe(f.x + 5, f.y + 0.5); f.attackCooldown = 0; f._sigCd = 1e9;
            let fr = 0; while (!followerProjectiles.length && fr < 120) { frame++; updateNPC(f); fr++; } const p = followerProjectiles[0]; __off(f);
            fr = 0; while (followerProjectiles.length && fr < 120) { render(); fr++; }
            const egg = __fol('electric', 'sniper', null), rea = __fol('electric', 'sniper', 'reaver');
            return { shot: !!p, hasHit: !!(p && p.onHit), hit: p && p.hit === DMG_HIT_SHOT, a: __dmg(A), b: __dmg(B), egg: !!evoShotOnHit(egg, 10), reaver: !!evoShotOnHit(rea, 10), name: EVOLUTIONS.thunderhead.shot, info: followerInfo(f).attacks.find(s => /^MAIN ATTACK/.test(s.h)).h }; })()`);
        ok(r.shot && r.hasHit && r.hit, 'the shot: ' + JSON.stringify(r)); ok(r.a > 0 && r.b > 0 && r.b < r.a, 'struck and conducted: ' + JSON.stringify(r));
        same(r.egg, false, 'an egg\'s shot chains'); same(r.reaver, false, 'the Reaver\'s shot chains'); same(r.name, 'CHAIN LIGHTNING', 'its name'); same(r.info, 'MAIN ATTACK · CHAIN LIGHTNING', 'INFO');
    });
    check('STATIC VORTEX is STATIONARY (it never travels or grows) and pulls the enemies in it to a spot VORTEX_HOLD tile in front of its middle (the owner, build 2026-11-11o: so the tornado does not hide them); a beetle is too heavy to drag; one outside it is left alone', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), t = __foe(f.x + 5, f.y), p = __foe(f.x + 6.9, f.y + 0.4), b = __foe(f.x + 5, f.y + 1.8, 'beetle'), out = __foe(f.x + 9, f.y);
            __fire(f); __off(f); const v = elementEffects.find(e => e.type === 'staticVortex'), x0 = v.x, y0 = v.y, r0 = v.radius, G = staticVortexGather(v), d0 = Math.hypot(p.x - G.x, p.y - G.y), b0 = [b.x, b.y], o0 = [out.x, out.y];
            let moved = false; for (let i = 0; i < 90; i++) { render(); if (v.x !== x0 || v.y !== y0 || v.radius !== r0) moved = true; }
            return { at: [x0, y0], t: [5, 0], moved, d0, d1: Math.hypot(p.x - G.x, p.y - G.y), beetle: Math.hypot(b.x - b0[0], b.y - b0[1]), outMoved: Math.hypot(out.x - o0[0], out.y - o0[1]), r: r0, R: VORTEX_RADIUS }; })()`);
        same(r.moved, false, 'the vortex moved or grew'); same(r.r, r.R, 'its radius'); ok(r.d1 < r.d0 - 0.8 && r.d1 <= 0.35, 'pulled in to the gathering point from ' + r.d0 + ' to ' + r.d1);
        same(r.beetle, 0, 'the beetle was dragged'); same(r.outMoved, 0, 'an enemy outside it was pulled');
    });
    check('the enemies in the storm end at that point and not at its middle; the storm\'s radius and who is in it are still measured from the middle', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), t = __foe(f.x + 5, f.y), a = __foe(f.x + 6.4, f.y - 0.6), edge = __foe(f.x + 5 + VORTEX_RADIUS - 0.1, f.y), out = __foe(f.x + 5 + VORTEX_RADIUS + 0.6, f.y);
            __fire(f); __off(f); const v = elementEffects.find(e => e.type === 'staticVortex'), G = staticVortexGather(v), edge0 = [edge.x, edge.y], out0 = [out.x, out.y]; for (let i = 0; i < 150; i++) render();
            return { aG: Math.hypot(a.x - G.x, a.y - G.y), aMid: Math.hypot(a.x - v.x, a.y - v.y), edgeMoved: Math.hypot(edge.x - edge0[0], edge.y - edge0[1]), outMoved: Math.hypot(out.x - out0[0], out.y - out0[1]) }; })()`);
        ok(r.aG <= 0.35, 'it did not reach the gathering point: ' + r.aG); ok(r.aMid > 0.6, 'it ended at the storm\'s middle (under the funnel): ' + r.aMid); ok(r.edgeMoved > 0.5, 'one at the storm\'s edge was not pulled: ' + r.edgeMoved); same(r.outMoved, 0, 'one just outside the storm was pulled');
    });
    check('STATIC VORTEX bites every enemy in it every VORTEX_TICK frames for power × VORTEX_MULT, through the damage system, until it runs out after VORTEX_LIFE frames; it is the Thunderhead\'s move (ARC VOLLEY stays the Reaver\'s)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), t = __foe(f.x + 5, f.y), out = __foe(f.x + 9.5, f.y); __fire(f); __off(f);
            const bites = []; let last = 0, k = 0; while (elementEffects.some(e => e.type === 'staticVortex') && k < 600) { render(); k++; const d = __dmg(t); if (d !== last) { bites.push([k, d - last]); last = d; } }
            const twin = __foe(f.x + 40, f.y + 40); applyDamage(twin, f.power * VORTEX_MULT, f, 'electric', false, false, DMG_HIT_ALT);
            return { bites, k, one: __dmg(twin), out: __dmg(out), tick: VORTEX_TICK, life: VORTEX_LIFE, move: evoMoveOf(f).id, reaver: EVOLUTIONS.reaver.move, thunder: EVOLUTIONS.thunderhead.move }; })()`);
        ok(r.bites.length >= 6 && r.bites.every((b, i) => i === 0 || b[0] - r.bites[i - 1][0] === r.tick), 'bites every ' + r.tick + ': ' + JSON.stringify(r.bites));
        ok(r.bites.every(b => Math.abs(b[1] - r.one) < 1e-6 * r.one + 1e-6), 'a bite is power × VORTEX_MULT: ' + JSON.stringify(r));
        ok(Math.abs(r.k - r.life) <= 2, 'it lasted ' + r.k); same(r.out, 0, 'an enemy outside it was bitten');
        same(r.move, 'static_vortex', 'the Thunderhead\'s move'); same(r.thunder, 'STATIC VORTEX', 'its form'); same(r.reaver, 'ARC VOLLEY', 'the Reaver');
    });

    // ── THERMITE BURROWER ───────────────────────────────────
    group('THERMITE BURROWER (fire Technician): BURROW STRIKE, its everyday hit from under the floor; FAULTLINE, a path the player draws freehand, on its own chip beside the THERMITE DRILL');
    check('BURROW STRIKE: at the nearest enemy it can see in reach it DIVES (BURROW_DIVE frames), TRAVELS UNDER THE FLOOR (never more than BURROW_SPEED a frame) and ERUPTS BENEATH IT for BURROW_MULT × its plain hit, then surfaces and rests', () => {
        const r = J(`(function(){ __clear(); const f = __burrower(), t = __foe(f.x + 3, f.y + 0.5); f.perk = 'siphon'; f.health = Math.round(f.maxHealth * 0.9); let fr = 0, under = -1, most = 0, x = f.x, y = f.y, at = -1, near = null, healed = null;
            while (fr < 240) { const h0 = f.health; frame++; updateNPC(f); most = Math.max(most, Math.hypot(f.x - x, f.y - y)); x = f.x; y = f.y; fr++; if (f.untargetable && under < 0) under = fr; if (__dmg(t) > 0 && at < 0) { at = fr; near = Math.hypot(f.x - t.x, f.y - t.y); healed = f.health - h0; } if (at > 0 && fr > at + 1) break; }
            const rest = f.attackCooldown, twin = __foe(f.x + 40, f.y + 40), w0 = f.currentWill; f.currentWill = 0; f.attackCooldown = 0; followerAttack(f, twin); f.currentWill = w0;   // (its plain hit, as a technician strikes with no Will: js/combat.js followerAttack)
            return { under, dive: BURROW_DIVE, most, speed: BURROW_SPEED, at, near, touch: BURROW_TOUCH, dmg: __dmg(t), want: BURROW_MULT * __dmg(twin), healed, siphon: 0.1 * f.stats.attack * 0.25 * BURROW_MULT, up: !f.untargetable, done: !f._burrow, rest, plain: DMG_FORM.thermite.main, hit: EVOLUTIONS.thermite.hit }; })()`);
        same(r.under, r.dive + 1, 'under the floor after its dive'); ok(r.most <= r.speed + 1e-9, 'a frame\'s step ' + r.most); ok(r.at > 0 && r.near <= r.touch + 1e-9, 'not beneath it: ' + JSON.stringify(r));
        ok(Math.abs(r.dmg - r.want) < 1e-6 * r.want + 1e-6, 'the eruption is ' + r.dmg + ', not ' + r.want + ' (BURROW_MULT × a plain hit of its own, its main attack)'); ok(r.up && r.done, 'it did not surface'); ok(r.rest > 60, 'no rest after: ' + r.rest);
        ok(Math.abs(r.healed - r.siphon) < 1e-6, 'a Siphon perk heals on the eruption as on the plain hit it stands in for: ' + r.healed + ', not ' + r.siphon);
        same(r.plain, 'piercing', 'its main attack\'s type'); same(r.hit, 'BURROW STRIKE', 'its form\'s hit');
    });
    check('under the floor it cannot be targeted or hurt; a target lost on the way (dead) brings it up where it is, with no eruption; out of reach or behind a wall it does not dive', () => {
        const r = J(`(function(){ __clear(); const f = __burrower(), t = __foe(f.x + 3.5, f.y), o = {}; for (let i = 0; i < 30; i++) { frame++; updateNPC(f); }
            o.under = f.untargetable; const h0 = f.health; applyDamage(f, 50, t); o.hurt = h0 - f.health; t.dead = true; frame++; updateNPC(f); o.upAfterLoss = !f.untargetable && !f._burrow;
            __clear(); const g = __burrower(), far = __foe(g.x + BURROW_REACH + 0.6, g.y); o.far = burrowStrikeTry(g, far); o.farBurrow = !!g._burrow;
            const keep = facilitySeesFrom; globalThis.facilitySeesFrom = () => false; const near = __foe(g.x + 2, g.y); o.wall = burrowStrikeTry(g, near); globalThis.facilitySeesFrom = keep;
            return o; })()`);
        same(r.under, true, 'under the floor'); same(r.hurt, 0, 'hurt under the floor'); same(r.upAfterLoss, true, 'it stayed under with its enemy dead');
        same(r.far, false, 'it dived at an enemy out of reach'); same(r.farBurrow, false, 'a burrow out of reach'); same(r.wall, false, 'it dived at an enemy it cannot see');
    });
    check('only the Thermite Burrower\'s hit changes: a fire technician egg, the Hover Shell and every other technician keep the plain hit', () => {
        const r = J(`(function(){ __clear(); const t = __foe(__C[0] + 2, __C[1]), o = {}; for (const [el, evo] of [['fire', null], ['electric', 'hovershell'], ['core', 'hammerslug'], ['flux', 'gooproxy'], ['ice', 'igloo'], ['toxic', 'blightspider']]) { const f = __fol(el, 'camper', evo); f.attackCooldown = 0; o[evo || 'egg'] = burrowStrikeTry(f, t) || !!f._burrow; } return o; })()`);
        for (const k of Object.keys(r)) same(r[k], false, k + ' burrowed');
    });
    check('FAULTLINE is the evolved Burrower\'s alone, its ULTIMATE (the owner, 2026-11-06: "Make it the Ultimate"): no chip of its own; the THERMITE DRILL keeps its chip, its wait and the rubble (the egg has the drill alone; no other form has FAULTLINE)', () => {
        const r = J(`(function(){ __clear(); const f = __burrower(), egg = __fol('fire', 'camper', null), hs = __fol('electric', 'camper', 'hovershell'), o = {};
            o.second = (techAbility2Of(f) || {}).id; o.first = (techAbilityOf(f) || {}).id; o.egg = techAbility2Of(egg); o.eggFirst = (techAbilityOf(egg) || {}).id; o.hover = techAbility2Of(hs);
            o.chip2 = techChip2State(f); o.chip1 = techChipState(f).text; o.ult = followerUltimate(f).name; f.ultimateCharge = 50; o.uncharged = techAbility2Can(f).why; f.ultimateCharge = 100; o.others = Object.keys(EVOLUTIONS).filter(k => k !== 'thermite' && TECH_ABILITY2[k]).join();
            o.rubble = _techFireTechs().indexOf(f) >= 0; o.join = (function(){ __clear(); const g = __fol('fire', 'camper', 'thermite'); partyAdd([g]); techAbilityTick(); return Math.round(techReady2In(g) / 60); })(); return o; })()`);
        same(r.second, 'faultline', 'its second'); same(r.first, 'thermite_drill', 'its first'); same(r.egg, null, 'the egg\'s second'); same(r.eggFirst, 'thermite_drill', 'the egg\'s first'); same(r.hover, null, 'the Hover Shell\'s second');
        same(r.chip2, null, 'FAULTLINE has a chip'); ok(/^✹ DRILL$/.test(r.chip1), 'the drill\'s chip: ' + r.chip1); same(r.ult, 'Faultline', 'its Ultimate'); same(r.uncharged, 'FAULTLINE · ITS ULTIMATE IS NOT CHARGED', 'uncharged'); same(r.others, '', 'other forms with FAULTLINE'); ok(r.rubble, 'the rubble\'s ring does not find the Burrower');
    });
    check('FAULTLINE\'s input is a FREEHAND PATH: a press, a drag and a let-go (not taps, not a straight line); its curve is kept (resampled, smoothed); a stroke under minLen sends nothing and the aim stays up; the stroke stops at maxLen', () => {
        const r = J(`(function(){ __clear(); const f = __burrower(), o = {}; o.tap = techChip2Tap(f); o.need = techAimNeed();
            __draw(f, [[1, 0], [1.4, 0]]); o.short = { aim: !!techAim, fault: !!f._fault };
            __draw(f, __arc(3, 40)); const F = f._fault; o.sent = !!F; o.aimAfter = !!techAim;
            const P = F ? F.pts : [], A = P[0], B = P[P.length - 1]; let bulge = 0; for (const q of P) { const dx = B.x - A.x, dy = B.y - A.y, L = Math.hypot(dx, dy) || 1; bulge = Math.max(bulge, Math.abs((q.x - A.x) * dy - (q.y - A.y) * dx) / L); }
            o.n = P.length; o.len = F ? F.cum[F.cum.length - 1] : 0; o.bulge = bulge; o.start = F ? [P[0].x - f.x, P[0].y - f.y] : null;
            __clear(); const g = __burrower(); techChip2Tap(g); const long = []; for (let i = 0; i <= 60; i++) long.push([1 + i * 0.25, Math.sin(i * 0.3) * 0.8]);
            const sp = long.map(p => __scr(g.x + p[0], g.y + p[1])); techAimPathStart(sp[0].x, sp[0].y); for (let i = 1; i < sp.length; i++) techAimPathMove(sp[i].x, sp[i].y);
            o.stroke = techAim && techAim.stroke ? _faultLen(techAim.stroke) : -1; o.full = !!(techAim && techAim.full); techAimTap(sp[sp.length - 1].x, sp[sp.length - 1].y); o.capped = g._fault ? g._fault.cum[g._fault.cum.length - 1] : -1;
            o.min = TECH_AB.fault.minLen; o.max = TECH_AB.fault.maxLen; return o; })()`);
        same(r.tap, true, 'the chip aims it'); same(r.need, 'path', 'what it asks for'); same(r.short.fault, false, 'a short stroke sent'); same(r.short.aim, true, 'the aim fell after a short stroke');
        same(r.sent, true, 'the path was not sent'); same(r.aimAfter, false, 'the aim stayed up after sending'); ok(r.n >= 10, 'points on the path: ' + r.n);
        ok(Math.abs(r.len - 3 * Math.PI / 2) < 0.15, 'a quarter circle of radius 3 is ' + r.len + ' long, not ' + (3 * Math.PI / 2)); ok(r.bulge > 0.7, 'the curve was flattened into a line: ' + r.bulge);
        ok(Math.hypot(r.start[0] - 4, r.start[1]) < 0.05, 'it does not start where it was drawn (the arc\'s first point, [4, 0]): ' + JSON.stringify(r.start)); ok(Math.abs(r.stroke - r.max) < 1e-6 && r.full, 'a long stroke (drawn ~15 tiles) stops at ' + r.stroke + ', not at ' + r.max);
        ok(r.capped <= r.max + 1e-9 && r.capped > r.max - 0.2, 'its path is ' + r.capped + ' tiles (at most ' + r.max + '; the smoothing takes only a little off a wobbly stroke)');
    });
    check('FAULTLINE runs UNDER THE FLOOR along the drawn path (it dives, tunnels to its start, follows it exactly, surfaces at its end) and MOLTEN SPIKES erupt along it: every enemy within hitR of a spike is hit once, one beside it is not', () => {
        // (the drawn arc: a quarter circle round (4, 3), radius 3, from [4, 0] to [1, 3]; on1 and on2 lie within hitR of it, off beside its start and far past its end)
        const r = J(`(function(){ __clear(); const f = __burrower(), on1 = __foe(f.x + 2.5, f.y + 1.0), on2 = __foe(f.x + 1.3, f.y + 2.0), off = __foe(f.x + 4.5, f.y + 1.0), far = __foe(f.x + 1, f.y + 5);
            techChip2Tap(f); __draw(f, __arc(3, 40)); const F = f._fault, P = F.pts.slice(), dist = (x, y) => { let best = 1e9; for (let i = 1; i < P.length; i++) { const A = P[i - 1], B = P[i], dx = B.x - A.x, dy = B.y - A.y, L = dx * dx + dy * dy || 1e-9, t = Math.max(0, Math.min(1, ((x - A.x) * dx + (y - A.y) * dy) / L)); best = Math.min(best, Math.hypot(x - (A.x + dx * t), y - (A.y + dy * t))); } return best; };
            const hits = [], keep = applyDamage, keepStep = techFaultStep; let up = null; globalThis.applyDamage = function (t, amt, src, el, rf, fx, hit) { if (src === f) hits.push(t === on1 ? 'on1' : t === on2 ? 'on2' : t === off ? 'off' : t === far ? 'far' : 'x'); return keep.apply(this, arguments); };
            globalThis.techFaultStep = function (a) { const go = keepStep.apply(this, arguments); if (a === f && !go && !up) up = { x: a.x, y: a.y, top: !a.untargetable }; return go; };   // (where it is the moment it surfaces: the same frame, its own AI takes over)
            let fr = 0, offPath = 0, under = 0, along = 0, phases = []; try { while (f._fault && fr < 800) { frame++; updateNPC(f); fr++; if (f.untargetable) under++; const ph = f._fault && f._fault.phase; if (ph && phases[phases.length - 1] !== ph) phases.push(ph); if (ph === 'along') { along++; offPath = Math.max(offPath, dist(f.x, f.y)); } } } finally { globalThis.applyDamage = keep; globalThis.techFaultStep = keepStep; }
            const spikes = elementEffects.filter(e => e.type === 'faultSpike').length, trace = elementEffects.find(e => e.type === 'faultTrace');
            return { phases, offPath, hits, end: up ? Math.hypot(up.x - P[P.length - 1].x, up.y - P[P.length - 1].y) : -1, up: !!up && up.top, under, fr, spikes, len: F.cum[F.cum.length - 1], spacing: TECH_AB.fault.spacing, d: [dist(on1.x, on1.y), dist(on2.x, on2.y), dist(off.x, off.y)], hitR: TECH_AB.fault.hitR, trace: !!trace && trace.done }; })()`);
        same(r.phases.join(), 'dive,to,along', 'its phases'); ok(r.offPath < 1e-6, 'it left the path: ' + r.offPath); ok(r.end >= 0 && r.end < 1e-6 && r.up, 'it did not surface at the path\'s end: ' + JSON.stringify({ end: r.end, up: r.up }));
        ok(r.d[0] <= r.hitR && r.d[1] <= r.hitR && r.d[2] > r.hitR, 'the fixture: ' + JSON.stringify(r.d));
        same(r.hits.slice().sort().join(), 'on1,on2', 'who was hit (each once)'); ok(r.spikes >= Math.floor(r.len / r.spacing), 'spikes ' + r.spikes + ' along ' + r.len + ' tiles'); same(r.trace, true, 'the path\'s glow did not start to fade');
    });
    check('FAULTLINE is called off by asking again, by Escape and by a touch the system cancels; its spikes go through the damage system as its ability; it is busy while it runs (the drill cannot start); the Ultimate\'s charge is spent as it goes under', () => {
        const r = J(`(function(){ __clear(); const f = __burrower(), o = {}; techChip2Tap(f); techChip2Tap(f); o.chipAgain = !!techAim;
            techChip2Tap(f); techAimCancel(); o.escape = !!techAim;   // (Escape: js/techabilities.js's keydown calls techAimCancel)
            techChip2Tap(f); const s0 = __scr(f.x + 1, f.y); techAimPathStart(s0.x, s0.y); techAimPathMove(s0.x + 30, s0.y + 10); techAimPathCancel(); o.cancel = { aim: !!techAim, fault: !!f._fault };
            techChip2Tap(f); __draw(f, __arc(3, 40)); o.busyDrill = techAbilityCan(f).why; o.chip1 = techChipState(f).text; o.drillWait = techReadyIn(f); o.charge = f.ultimateCharge;
            const E = rd => 0; return o; })()`);
        same(r.chipAgain, false, 'the chip again'); same(r.escape, false, 'Escape'); same(r.cancel.aim, false, 'a cancelled touch'); same(r.cancel.fault, false, 'a cancelled touch sent it');
        same(r.busyDrill, 'BUSY', 'the drill while FAULTLINE runs'); ok(/BUSY/.test(r.chip1), 'the drill\'s chip: ' + r.chip1); same(r.drillWait, 0, 'the drill\'s wait was spent'); ok(r.charge < 50, 'the Ultimate\'s charge was not spent: ' + r.charge);
        const T = rd('js/techabilities.js'), I = rd('js/input.js'); ok(/applyElementalDamage\(e, dmg, f, "fire", DMG_HIT_ALT\)/.test(T), 'the spikes do not go through the damage system as its ability');
        ok(/canvas\.addEventListener\('pointercancel'/.test(I) && /techAimPathCancel\(\)/.test(I) && /techAimPathMove\(_mx, _my\)/.test(I) && /techAimPathStart\(pressX, pressY\)/.test(I), 'the input does not carry the path');
    });
    check('INFO names it all: MAIN ATTACK · BURROW STRIKE, ABILITY · THERMITE DRILL, ULTIMATE · FAULTLINE', () => {
        const r = J(`(function(){ __clear(); const f = __burrower(); return followerInfo(f).attacks.map(s => s.h); })()`);
        ok(r.indexOf('MAIN ATTACK · BURROW STRIKE') >= 0 && r.indexOf('ABILITY · THERMITE DRILL') >= 0 && r.indexOf('ULTIMATE · FAULTLINE') >= 0, 'INFO: ' + r);
    });
    {
        const T = measure(1180, 820);
        if (T === null) console.log('  (no Chromium here: the real page\'s check skipped)');
        else check('THE REAL PAGE, BY TOUCH: the Burrower\'s card shows the drill\'s chip and no FAULTLINE chip (it is the Ultimate); the Ultimate aims; a path drawn with a finger\'s pointer events is sent and run; a stroke the system cancels sends nothing and ends the aim', () => {
            ok(T && !T.err, 'the page: ' + JSON.stringify(T));
            ok(T.chips.has1 && !T.chips.has2, 'the chips: ' + JSON.stringify(T.chips)); ok(/DRILL/.test(T.chips.t1), 'its words: ' + JSON.stringify(T.chips));
            ok(T.aim.on && /FAULTLINE/.test(T.aim.prompt) && !/AIMING/.test(T.aim.chip1), 'the aim: ' + JSON.stringify(T.aim));
            ok(T.sent.fault && T.sent.n >= 8 && Math.abs(T.sent.len - 2.5 * Math.PI / 2) < 0.2 && !T.sent.aiming, 'the touch path: ' + JSON.stringify(T.sent));
            ok(Math.hypot(T.sent.start[0] - 3, T.sent.start[1]) < 0.1, 'it does not start under the finger (the stroke\'s first point, [3, 0] from the Burrower): ' + JSON.stringify(T.sent.start)); ok(T.run.over && T.run.up, 'the run: ' + JSON.stringify(T.run));
            ok(T.cancel.was && !T.cancel.aiming && !T.cancel.fault, 'the cancelled touch: ' + JSON.stringify(T.cancel));
        });
        if (T !== null) check('THE REAL PAGE, A SECOND FINGER (build 2026-11-06b): a finger that touches while the path is drawn is ignored, its moves and its lift: the path is the first finger\'s, whole, from where it started, and nobody walks, whichever finger lifts first; a finger set aside whose lift never came does not keep its id: the next press with it is an ordinary tap', () => {
            ok(T && !T.err && T.twoA && T.twoB, 'the page: ' + JSON.stringify(T && (T.err || T)));
            for (const [k, r] of [['the stray finger lifting first', T.twoA], ['the drawing finger lifting first', T.twoB]]) {
                ok(r.fault && !r.aiming, k + ': the path was not sent: ' + JSON.stringify(r));
                ok(Math.hypot(r.start[0] - 3, r.start[1]) < 0.1, k + ': the stroke restarted from the second finger: ' + JSON.stringify(r.start));
                ok(Math.abs(r.len - 2.5 * Math.PI / 2) < 0.2, k + ': the path is not the first finger\'s arc: ' + r.len);
                ok(!r.walked, k + ': a finger\'s lift walked you');
            }
            ok(T.lost && T.lost.walked && !T.lost.aiming, 'a press with the id of a finger set aside, whose lift the canvas never saw, was not an ordinary tap (it did not walk you): ' + JSON.stringify(T.lost));
            const I = rd('js/input.js');
            ok(/if \(_techAimPressed && typeof techAimActive === "function" && techAimActive\(\)\) \{ e\.preventDefault\(\); _aimIgnored\.add\(e\.pointerId\); return; \}/.test(I) && /if \(_aimIgnored\.has\(e\.pointerId\)\) return;/.test(I) && (I.match(/if \(_aimIgnored\.delete\(e\.pointerId\)\) return;/g) || []).length === 2, 'the input does not set the other finger aside');
        });
    }

    // ── HOVER SHELL ─────────────────────────────────────────
    group('HOVER SHELL (electric Technician) and its KINETIC LAUNCHER: unchanged');
    check('the Kinetic Launcher is as it was: its id, name, chip, colour and aim (a follower, then an enemy), and every one of its numbers', () => {
        const r = J(`(function(){ const a = TECH_ABILITIES.electric, o = {}; for (const k in a) o[k] = typeof a[k] === 'function' ? 'fn' : a[k]; return { ab: o, launch: TECH_AB.launch }; })()`);
        same(JSON.stringify(r.ab), JSON.stringify({ id: 'kinetic_launcher', name: 'KINETIC LAUNCHER', short: 'LAUNCH', icon: '⚡', col: '#ffe733', aim: ['follower', 'enemy'], use: 'fn', ask: 'fn' }), 'the ability');
        same(JSON.stringify(r.launch), JSON.stringify({ cooldown: 3600, selfDamage: 10, powerMult: 3, siteXp: 100, hitReach: 1.6, loadReach: 1.3, loadWait: 480, flight: 40, peak: 70, siteFlight: 64, sitePeak: 120, dropFlight: 28, near: 6, setupWalk: 1200, setup: 120 }), 'its numbers');
    });
    check('the Hover Shell itself is as it was: SHOCK ZAP its only move (BASH until build 2026-11-09c, the owner\'s pick in its place; the design notes give it none), no named shot, its types (Crushing, Earthquake) and subclass (Drone), and the Technicians\' shared plain hit within 4 tiles', () => {
        const r = J(`({ form: EVOLUTIONS.hovershell, dmg: DMG_FORM.hovershell, sub: EQUIP_FORM_SUBCLASS.hovershell })`);
        same(JSON.stringify(r.form), JSON.stringify({ id: 'hovershell', name: 'HOVER SHELL', element: 'electric', role: 'camper', move: 'SHOCK ZAP', moves: ['shock_zap'], sheet: 'img/evo/hovershell.png', cell: 144, anchor: [72, 114.2], core: [72, 91.1], noGlow: true, color: '#ffee33' }), 'its form');
        same(JSON.stringify(r.dmg), JSON.stringify({ main: 'crushing', alt: 'earthquake' }), 'its damage types'); same(r.sub, 'drone', 'its subclass');
        const N = rd('js/npc.js'); ok(/const CAMPER_ENGAGE_RADIUS = 4;/.test(N) && /\} else \{\s*followerAttack\(actor, nearestEnemy\);\s*\}/.test(N.slice(N.indexOf('CAMPER (the technician)'))), 'the Technicians\' plain hit changed');
    });

    // ── THE DAMAGE SYSTEM, THE TABLES AND THE WORDS ─────────
    // ── THE THORNWHIP (BLOOM's Mage, build 2026-11-08j) ──
    group('THORNWHIP (BLOOM Mage, build 2026-11-08j): SEED SHOT, its everyday shot, that MENDs as every BLOOM hit; SEEDFALL, seeds raining on a circle that hurt the enemies in it and mend your followers in it');
    check('SEED SHOT is its everyday shot: the BLOOM shot (a seed) at the nearest enemy, SP.ATK × MAGE_SHOT_MULT, a plain hit, named SEED SHOT on INFO; its hit MENDs the most hurt follower near the shrub', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'sniper', 'shrub'), t = __foe(f.x + 3.5, f.y), mate = __fol('fire', 'brawler', null); mate.x = f.x - 1; mate.y = f.y; mate.health = mate.maxHealth * 0.5;
            f.attackCooldown = 0; f._sigCd = 1e9;
            let fr = 0; while (!followerProjectiles.length && fr < 120) { frame++; updateNPC(f); fr++; }
            const p = followerProjectiles[0], i = followerInfo(f).attacks.find(s => /^MAIN ATTACK/.test(s.h)), h0 = mate.health; __off(f); __off(mate); followers.push(mate);
            let k = 0; while (followerProjectiles.length && k < 200) { render(); k++; }
            return { got: !!p, el: p && p.element, src: !!p && p.source === f, onHit: p ? !!p.onHit : null, hit: p && p.hit === DMG_HIT_SHOT, dmg: p && p.damage, want: f.stats.specialAttack * MAGE_SHOT_MULT, shot: EVOLUTIONS.shrub.shot, info: i && i.h, hurt: __dmg(t), mended: mate.health - h0, share: mate.maxHealth * ELEMENT_MEND.share }; })()`);
        ok(r.got, 'no shot'); same(r.el, 'blossom', 'its element'); ok(r.src, 'not the shrub\'s'); same(r.onHit, false, 'an effect of its own'); ok(r.hit, 'not the Mages\' shot');
        ok(Math.abs(r.dmg - r.want) < 1e-9, 'damage ' + r.dmg + ' not ' + r.want); same(r.shot, 'SEED SHOT', 'its name'); same(r.info, 'MAIN ATTACK · SEED SHOT', 'INFO');
        ok(r.hurt > 0, 'the enemy was not hit'); ok(r.mended >= r.share * 0.999, 'the hurt follower was mended ' + r.mended + ', not ' + r.share);
    });
    check('SEEDFALL: cast on the nearest enemy it can see in reach (no shot): a circle SEEDFALL_RADIUS tiles round on it that bites every enemy in it at once and every SEEDFALL_TICK frames, and mends each of your hurt followers in it by SEEDFALL_MEND of its maximum health each time; gone after SEEDFALL_LIFE frames; a follower outside it is not mended by it', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'sniper', 'shrub'), t = __foe(f.x + 5, f.y + 0.5), inn = __fol('fire', 'brawler', null), outt = __fol('fire', 'brawler', null);
            inn.x = t.x + 0.6; inn.y = t.y; outt.x = t.x + 4; outt.y = t.y + 3; for (const m of [inn, outt]) m.health = m.maxHealth * 0.3;
            const at0 = [t.x, t.y], oPre = outt.health; __fire(f); __off(f); __off(inn); __off(outt); followers.push(inn, outt);
            const c = elementEffects.find(e => e.type === 'seedfall' && e.by === f), at = c && { x: c.x, y: c.y, r: c.radius, life: c.life }, first = __dmg(t), m0 = inn.maxHealth, h0 = inn.health, firstMend = inn.health - inn.maxHealth * 0.3, o0 = outt.health, outFirst = outt.health - oPre;
            const hi = inn.health, ho = outt.health; seedfallBeat(c); const beatIn = inn.health - hi, beatOut = outt.health - ho, beatShare = inn.maxHealth * SEEDFALL_MEND; inn.health = hi;   // (one beat alone, nothing else running: followers also mend on their own over time)
            const twin = __foe(f.x + 40, f.y + 40); applyDamage(twin, f.power * SEEDFALL_BITE, f, 'blossom', false, false, DMG_HIT_ALT);
            const bites = []; let last = __dmg(t), k = 0;   // (from here: the direct beat above bit it too)
            while (elementEffects.some(e => e.type === 'seedfall') && k < 400) { render(); k++; const d = __dmg(t); if (d !== last) { bites.push(k); last = d; } }
            return { shots: followerProjectiles.length, at, t: at0, first, one: __dmg(twin), bites, after: k, tick: SEEDFALL_TICK, life: SEEDFALL_LIFE, r: SEEDFALL_RADIUS, firstMend, share: m0 * SEEDFALL_MEND, gained: inn.health - h0, mend: SEEDFALL_MEND, m0, outFirst, beatIn, beatOut, beatShare,
                     info: (followerInfo(f).attacks.find(s => /^ALTERNATE · SEEDFALL/.test(s.h)) || {}).h || null }; })()`);
        same(r.shots, 0, 'shots'); ok(r.at, 'no circle'); ok(Math.hypot(r.at.x - r.t[0], r.at.y - r.t[1]) < 1e-9, 'not on the enemy: ' + JSON.stringify(r)); same(r.at.r, r.r, 'its radius');
        ok(Math.abs(r.first - r.one) < 1e-6 * r.one + 1e-6, 'it bit at once as it opened: ' + JSON.stringify(r));
        ok(r.bites.length >= 6 && r.bites.every((b, i) => i === 0 || b - r.bites[i - 1] === r.tick), 'a bite every ' + r.tick + ' frames: ' + JSON.stringify(r.bites));
        ok(r.after <= r.life + 2 && r.after >= r.life - 2, 'it lasted ' + r.after + ' frames, not ' + r.life);
        ok(Math.abs(r.firstMend - r.share) < 1e-6, 'the follower in it was mended ' + r.firstMend + ' as it opened, not ' + r.share);
        ok(r.gained >= r.bites.length * r.mend * r.m0 * 0.999, 'the follower in it was mended each beat: ' + r.gained + ' after the first (' + r.bites.length + ' beats)'); same(r.outFirst, 0, 'the follower outside it was mended as it opened'); ok(Math.abs(r.beatIn - r.beatShare) < 1e-9, 'a beat mended the follower in it ' + r.beatIn + ', not ' + r.beatShare); same(r.beatOut, 0, 'a beat mended the follower outside it');
        ok(/^ALTERNATE · SEEDFALL/.test(r.info || ''), 'INFO: ' + r.info);
    });

    // ── THORNWHIP's PINK THICKET (build 2026-11-08l) ──
    group('THORNWHIP (BLOOM Mage): its Ultimate PINK THICKET (build 2026-11-08l, the owner\'s design): a big seed grows into a thicket that binds and bites the enemies in it, the damage shared out as healing among your followers in it');
    check('PINK THICKET slings a big seed (no damage of its own) at the nearest enemy it can see in reach and spends the charge; nothing in reach keeps it; where the seed lands, a thicket ULT_THICKET.radius round for ULT_THICKET.frames', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'sniper', 'shrub'); __foe(f.x + 12, f.y); f.ultimateCharge = 100; const none = followerUltFire(f), keep = f.ultimateCharge;
            const t = __foe(f.x + 4, f.y + 0.5), fired = followerUltFire(f), p = followerProjectiles.find(q => q.kind === 'bigseed'), out = { none, keep, fired, spent: f.ultimateCharge, seed: p ? [p.damage, p.element, p.radius] : null };
            __off(f); let k = 0, c = null; while (!c && k < 200) { render(); k++; c = elementEffects.find(e => e.type === 'thicket'); }
            out.at = c && [c.x - t.x, c.y - t.y, c.radius, c.maxLife]; out.name = followerUltimate(f).name; return out; })()`);
        same(r.none, false, 'it fired with nothing in reach'); same(r.keep, 100, 'the charge with nothing in reach'); same(r.fired, true, 'it did not fire'); same(r.spent, 0, 'the charge after');
        ok(r.seed && r.seed[0] === 0 && r.seed[1] === 'blossom' && r.seed[2] > 5, 'the big seed: ' + JSON.stringify(r.seed)); ok(r.at && Math.hypot(r.at[0], r.at[1]) < 1.1, 'no thicket where it landed: ' + JSON.stringify(r.at));
        same(r.at[2], 2, 'its radius'); same(r.at[3], 300, 'its life'); same(r.name, 'Pink Thicket', 'its Ultimate');
    });
    check('each beat holds every enemy in it in place and bites it (Elemental, its power × ULT_THICKET.mult), one outside untouched; what the bites take is shared out as healing among your followers in it, the most hurt first, the total the damage dealt; a follower outside it, and the player, are not healed', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'sniper', 'shrub'); __off(f); const x = f.x + 6, y = f.y;   // (6 tiles off: its followers out of MEND's 4, which every BLOOM bite also does)
            const a = __foe(x + 0.5, y), b = __foe(x - 0.5, y + 0.4), o = __foe(x + 5, y), lo = __fol('fire', 'brawler', null), mid = __fol('fire', 'brawler', null), far = __fol('fire', 'brawler', null);
            lo.x = x + 0.3; lo.y = y - 0.6; mid.x = x - 0.6; mid.y = y - 0.3; far.x = x + 6; far.y = y + 3; __off(lo); __off(mid); __off(far); followers.push(lo, mid, far);
            lo.health = lo.maxHealth * 0.2; mid.health = mid.maxHealth * 0.9; far.health = far.maxHealth * 0.2; const h = [lo.health, mid.health, far.health], ph = health;
            const twin = __foe(x + 30, y + 30); applyDamage(twin, f.power * ULT_THICKET.mult, f, 'blossom', false, false, DMG_HIT_SPECIAL); const one = __dmg(twin);
            const e = thicketGrow(f, x, y), got = [lo.health - h[0], mid.health - h[1], far.health - h[2]];
            return { one, bites: [__dmg(a), __dmg(b), __dmg(o)], held: [a.slowFactor, a.slowed > 0, b.slowFactor, o.slowed > 0], got, lowMiss: lo.maxHealth - h[0], player: health - ph }; })()`);
        ok(Math.abs(r.bites[0] - r.one) < 1e-6 && Math.abs(r.bites[1] - r.one) < 1e-6, 'each enemy in it bitten ' + r.one + ': ' + JSON.stringify(r.bites)); same(r.bites[2], 0, 'the enemy outside it bitten');
        same(r.held.join(), '0,true,0,false', 'held in place (in it), not (outside)');
        const dealt = r.bites[0] + r.bites[1], healed = r.got[0] + r.got[1];
        ok(Math.abs(healed - Math.min(dealt, r.lowMiss + r.got[1])) < 1e-6, 'the healing is the damage dealt: ' + healed + ' of ' + dealt);
        ok(r.got[0] >= Math.min(dealt, r.lowMiss) - 1e-6, 'the most hurt first: ' + JSON.stringify(r.got)); same(r.got[2], 0, 'the follower outside it healed'); same(r.player, 0, 'the player healed');
    });

    // ── SUNDEW (BLOOM's Brawler, build 2026-11-08k) ──
    group('SUNDEW (BLOOM Brawler, build 2026-11-08k): its Ultimate CONSUME: an enemy swallowed whole (not a boss) for 5 s, a bite every second, 75% less damage while it holds one, spat out if it lives');
    check('CONSUME swallows the nearest enemy it can see within its reach, passing over a boss: the catch is out of the fight (untargetable, not drawn) and held inside it; SUNDEW stands still on its CONSUME frames; nothing in reach keeps the charge', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'brawler', 'sundew'); __foe(f.x + 6, f.y);
            f.ultimateCharge = 100; const none = followerUltFire(f), keep = f.ultimateCharge;
            const t = __foe(f.x + 1.2, f.y + 0.3), boss = __foe(f.x + 0.9, f.y - 0.2); boss.bossId = '__test';
            const fired = followerUltFire(f), out = { none, keep, fired, spent: f.ultimateCharge, caught: t._swallowedBy === f, bossFree: !boss._swallowedBy, untargetable: !!t.untargetable, hostile: isHostileTarget(t), at: Math.hypot(t.x - f.x, t.y - f.y) };
            const x0 = f.x, y0 = f.y; f.targetX = f.x + 3; f.targetY = f.y; f.stance = 'follow';
            for (let i = 0; i < 40; i++) { frame++; updateNPC(f); updateElementEffects(); }
            out.moved = Math.hypot(f.x - x0, f.y - y0); out.col = _evoFrame(f, EVOLUTIONS.sundew, frame).col; out.inside = Math.hypot(t.x - f.x, t.y - f.y);
            out.name = followerUltimate(f).name; boss.bossId = null; return out; })()`);
        same(r.none, false, 'it fired with nothing in reach'); same(r.keep, 100, 'the charge with nothing in reach');
        same(r.fired, true, 'it did not fire'); same(r.spent, 0, 'the charge after'); ok(r.caught, 'the enemy was not caught'); ok(r.bossFree, 'the boss was caught');
        ok(r.untargetable && !r.hostile, 'the catch can be targeted'); ok(r.at < 1e-9 && r.inside < 1e-9, 'the catch is not inside it: ' + JSON.stringify(r));
        ok(r.moved < 1e-9, 'it moved while digesting: ' + r.moved); ok(r.col >= 16 && r.col < 24, 'its sheet\'s CONSUME frames: column ' + r.col); same(r.name, 'Consume', 'its Ultimate');
    });
    check('it bites its catch every second (Elemental: a BLOOM hit), takes 75% less damage while it holds it, and spits it out in front of it after 5 s, back in the fight; a catch that dies inside is gone; SUNDEW falling lets it out at once', () => {
        const r = J(`(function(){ __clear(); const f = __fol('blossom', 'brawler', 'sundew'), g = __fol('blossom', 'brawler', 'sundew'); g.x += 5; f.dirX = 1; f.dirY = 0;
            const t = __foe(f.x + 1.2, f.y), src = __foe(f.x - 6, f.y); f.ultimateCharge = 100; followerUltFire(f); __off(f); __off(g);
            const fh = f.health; applyDamage(f, 20, src, null, false, false, null); const C = f._consume; f._consume = null; const fh2 = f.health; applyDamage(f, 20, src, null, false, false, null); f._consume = C; const guard = [fh - fh2, fh2 - f.health];   // (the same hit on the same SUNDEW, holding and not)
            const twin = __foe(f.x + 30, f.y + 30); applyDamage(twin, (f.power || 10) * ULT_CONSUME.mult, f, 'blossom', false, false, DMG_HIT_SPECIAL); const one = __dmg(twin);
            const bites = []; let last = __dmg(t), k = 0;
            while (t._swallowedBy && k < 400) { frame++; updateElementEffects(); k++; const d = __dmg(t); if (d !== last) { bites.push(k); last = d; } }
            const out = { guard, one, bite: bites.length ? 0 : 0, n: bites.length, gaps: bites.map((b, i) => i ? b - bites[i - 1] : b), after: k, free: !t._swallowedBy && !t.untargetable && isHostileTarget(t), ahead: t.x - f.x, d: Math.hypot(t.x - f.x, t.y - f.y), held: f._consume || null, total: __dmg(t) };
            // a catch that dies inside: gone, and SUNDEW lets go
            actors = actors.filter(a => a !== t); const u = __foe(f.x + 1.2, f.y); f._consume = null; f.ultimateCharge = 100; actors.push(f); followers.push(f); followerUltFire(f); __off(f); u.health = 1; for (let i = 0; i < 70; i++) { frame++; updateElementEffects(); }
            out.died = [u.dead || u.health <= 0, !f._consume];
            // SUNDEW falling: its catch out at once
            actors = actors.filter(a => a !== u); const v = __foe(f.x + 1.2, f.y); f._consume = null; f.ultimateCharge = 100; actors.push(f); followers.push(f); followerUltFire(f); __off(f); f.dead = true; frame++; updateElementEffects();
            out.fell = [!v._swallowedBy, !v.untargetable]; f.dead = false; return out; })()`);
        ok(Math.abs(r.guard[0] - r.guard[1] * 0.25) < 1e-6 * r.guard[1] + 1e-6, '75% less damage while it holds one: ' + JSON.stringify(r.guard));
        same(r.n, 5, 'bites in 5 s: ' + JSON.stringify(r.gaps)); ok(r.gaps.every(g => g === 60), 'a bite a second: ' + JSON.stringify(r.gaps)); ok(Math.abs(r.total - 5 * r.one) < 1e-6 * r.total + 1e-6, 'each bite ' + r.one + ' (Elemental, as SUNDEW\'s power × ' + 'ULT_CONSUME.mult): ' + r.total);
        ok(r.after >= 299 && r.after <= 301, 'it held it ' + r.after + ' frames, not 300'); ok(r.free, 'the catch is not back in the fight'); ok(r.ahead > 0.25 && r.d < 2, 'not spat out in front of it (on the open floor nearest the spot ahead of it): ' + JSON.stringify(r)); same(r.held, null, 'SUNDEW still holds it');
        same(r.died.join(), 'true,true', 'a catch that died inside'); same(r.fell.join(), 'true,true', 'SUNDEW fell: its catch let out');
    });

    group('THE WIND-UP (the owner, 2026-11-07: "make it another stat ... it needs to be adjustable ... it\'s on the attack not the follower")');
    check('a move waits its own WIND-UP after it fires (the Static Orb\'s two moves each their own), and changing the number on the attack changes the wait', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'), t = __foe(f.x + 3, f.y); const out = {};
            f.move = 'static_rush'; __fire(f); out.roll = [f._sigCd, moveWindupFrames('static_rush')];
            const keep = MOVES.static_rush.windup; MOVES.static_rush.windup = 2; f.x = t.x - 3; f.move = 'static_rush'; __fire(f); out.tuned = f._sigCd; MOVES.static_rush.windup = keep;
            const r2 = __fol('toxic', 'sniper', 'rotshard'), t2 = __foe(r2.x + 3, r2.y); r2.move = 'rotten_decoy'; __fire(r2); out.decoy = [r2._sigCd, moveWindupFrames('rotten_decoy')];
            return out; })()`);   // (the Rotshard's CORRODE SHOT is its everyday shot since build 2026-11-07ss: the Static Orb's SONIC ROLL is the move tuned here)
        same(r.roll[0], r.roll[1], 'SONIC ROLL\'s wait'); same(r.decoy[0], r.decoy[1], 'ROTTEN DECOY\'s wait'); ok(r.roll[1] !== r.decoy[1], 'the two moves share one wait');
        same(r.tuned, 120, 'SONIC ROLL with its wind-up set to 2 s');
    });

    group('ONE DAMAGE SYSTEM, ONE TABLE, ONE SET OF WORDS');
    check('every new hit goes through applyDamage with the established hit kinds (a move\'s DMG_HIT_ALT, the Mages\' DMG_HIT_SHOT): no health is taken off by hand', () => {
        const E = rd('js/evolution.js'), body = n => { const i = E.indexOf('function ' + n + '('); ok(i >= 0, 'no ' + n); const j = E.indexOf('\nfunction ', i + 10); return E.slice(i, j < 0 ? undefined : j); };
        for (const [fn, kind] of [['quillFireTick', 'DMG_HIT_ALT'], ['fieldBite', 'DMG_HIT_ALT'], ['pinballStep', 'DMG_HIT_ALT'], ['chainLightning', 'DMG_HIT_SHOT']]) { const b = body(fn); ok(b.indexOf(kind) >= 0, fn + ' does not use ' + kind); ok(!/\.health\s*-=|\.health\s*=\s*[^=]/.test(b), fn + ' sets health by hand'); }
        ok(/applyDamage\(t, \(f\.power \|\| 10\) \* PIN_MULT/.test(E) && /applyDamage\(a, e\.bite/.test(E) && /applyDamage\(next, d, f/.test(E), 'not through applyDamage');
    });
    check('MAGMA VENT (the Thermite Burrower\'s move; the owner: "Short and hot"): a vent MAGMA_RADIUS tiles round opens under the enemy it can see within MAGMA_RANGE, bites at once and every MAGMA_TICK frames for MAGMA_LIFE frames, enemies only; then moveWindupFrames("magma_vent") frames before the next', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'camper', 'thermite'), t = __foe(f.x + 4, f.y + 0.5), far = __foe(f.x + 4 + MAGMA_RADIUS + 1, f.y + 0.5); const fired = magmaVent(f), cd = f._sigCd; const v = elementEffects.find(e => e.type === 'magmavent');
            const first = __dmg(t), farFirst = __dmg(far); let bites = 0, last = first, k = 0; while (elementEffects.some(e => e.type === 'magmavent') && k < 600) { render(); k++; const d = __dmg(t); if (d !== last) { bites++; last = d; } }
            return { fired, move: MOVES[evoMoveIds(EVOLUTIONS.thermite)[0]].name, at: v && [Math.round(v.x * 10) / 10, Math.round(v.y * 10) / 10], t: [Math.round(t.x * 10) / 10, Math.round(t.y * 10) / 10], r: v && v.radius, first: first > 0, far: farFirst, bites, gone: k, cd, want: [MAGMA_RADIUS, MAGMA_LIFE, MAGMA_TICK, moveWindupFrames("magma_vent")] }; })()`);
        same(r.fired, true, 'it did not open'); same(r.move, 'MAGMA VENT', 'the Thermite Burrower\'s move'); same(JSON.stringify(r.at), JSON.stringify(r.t), 'not under the enemy');
        same(r.r, r.want[0], 'its radius'); same(r.first, true, 'no bite as it opened'); same(r.far, 0, 'it reached an enemy beyond its radius');
        same(r.bites, Math.floor(r.want[1] / r.want[2]) - 1, 'bursts after the first (one a second while it is open): ' + r.bites); ok(r.gone <= r.want[1] + 2, 'it stayed open too long: ' + r.gone); same(r.cd, r.want[3], 'the wait');
    });
    check('OWN ULTIMATES (the owner, 2026-11-06: "Own Ultimates"): a form with its own fires it (the Electro Skink its LIGHTNING CIRCUIT since build 2026-11-09c), a retired form and an unevolved follower none (build 2026-11-09b: the element Ultimates are gone; the Ember Hood keeps its VOLCANIC ERUPTION); OVERDRIVE rushes to the biggest group and hits it with a knockback ("Smaller rush"); ABSOLUTE ZERO swallows up to three, holds them 6 s, no damage, then lets them go; TOXIC UNDERTOW hurts, scatters and poisons ("Strong"); CONTAMINATION NETWORK needs two pods and bites what touches a strand ("10 s")', () => {
        const r = J(`(function(){ const o = {};
            __clear(); const so = __fol('electric', 'brawler', 'staticorb'), eh = __fol('fire', 'sniper', 'embercowl'), qs = __fol('electric', 'camper', null), sk = __fol('electric', 'brawler', 'electroskink'), rt = __fol('electric', 'brawler', 'manta');
            o.look = [followerUltimate(so).name, followerUltimate(eh) === ULT_VOLCANIC_ERUPTION && followerUltimate(eh).name, followerUltimate(qs), followerUltimate(sk).name, followerUltimate(rt), followerUltPending(rt), followerUltPending(qs), typeof FOLLOWER_ULTIMATES];
            __clear(); const s = __fol('electric', 'brawler', 'staticorb'), g1 = __foe(s.x + 4, s.y), g2 = __foe(s.x + 4.6, s.y + 0.4), lone = __foe(s.x - 3, s.y); s.ultimateCharge = 100; followerUltimate(s).execute(s);
            o.over = [s.ultimateCharge < 50, Math.hypot(s.x - g1.x, s.y - g1.y) <= 1.2, __dmg(g1) > 0, __dmg(g2) > 0, __dmg(lone), !!(g1.kbVX || g1.kbVY)];
            __clear(); const m = __fol('ice', 'brawler', 'maw'), z = [1, 2, 3, 4].map(i => __foe(m.x + i * 0.6, m.y)); m.ultimateCharge = 100; followerUltimate(m).execute(m);
            o.zero = [m.ultimateCharge, z.filter(a => a._swallowedBy === m).length, z.every(a => __dmg(a) === 0)];
            for (let i = 0; i < 365; i++) updateElementEffects(); o.zeroAfter = [z.filter(a => a._swallowedBy).length, z.every(a => !a.untargetable), z.every(a => __dmg(a) === 0)];
            __clear(); const sp = __fol('toxic', 'brawler', 'seeper'), u1 = __foe(sp.x + 1.5, sp.y), u2 = __foe(sp.x - 1.5, sp.y + 0.3); sp.ultimateCharge = 100; followerUltimate(sp).execute(sp);
            o.under = [__dmg(u1) > 0, __dmg(u2) > 0, u1.toxicWeakened, Math.round(u1.toxicWeakenFactor * 10) / 10, !!(u1.kbVX || u1.kbVY)];
            __clear(); const bs = __fol('toxic', 'camper', 'blightspider'); techPools = []; bs.ultimateCharge = 100; followerUltimate(bs).execute(bs); o.netNone = bs.ultimateCharge;
            _techPoolLay(bs, bs.x + 2.5, bs.y + 0.5); _techPoolLay(bs, bs.x + 6.5, bs.y + 0.5); const on = __foe(bs.x + 4.5, bs.y + 0.6), off = __foe(bs.x + 4.5, bs.y + 4);
            followerUltimate(bs).execute(bs); for (let i = 0; i < 61; i++) updateElementEffects();
            o.net = [bs.ultimateCharge < 50, elementEffects.some(e => e.type === 'toxicnet'), __dmg(on) > 0, __dmg(off), on.toxicWeakened > 0];
            techPools = []; return o; })()`);
        same(r.look.join(), 'Overdrive,Volcanic Eruption,,Lightning Circuit,,false,false,undefined', 'its own, the Ember Hood\'s (VOLCANIC ERUPTION, the fire one once), an unevolved follower none, the Electro Skink\'s LIGHTNING CIRCUIT, a retired form none and not flagged, the element Ultimates gone');
        same(r.over.join(), 'true,true,true,true,0,true', 'OVERDRIVE: spent (its own hits charge it a little again), rushed to the group, both hit, the lone one not, knocked back');
        same(r.zero.join(), '0,3,true', 'ABSOLUTE ZERO: spent, three swallowed (not four), no damage'); same(r.zeroAfter.join(), '0,true,true', 'let go after 6 s, targetable again, still no damage');
        same(r.under.join(), 'true,true,240,0.7,true', 'TOXIC UNDERTOW: both hurt, poisoned 4 s at 70% of their hits, thrown');
        same(r.netNone, 100, 'CONTAMINATION NETWORK with no pods spent its charge'); same(r.net.join(), 'true,true,true,0,true', 'CONTAMINATION NETWORK: spent (its bites charge it a little again), the strand is up, the one on it hurt and poisoned, the one off it not');
    });
    check('OWN ULTIMATES, the next three (the owner, 2026-11-06: "8 s", "Squad only", "Make it the Ultimate"): SHARD VORTEX pulls the enemies in its swirl and grinds them (crushing), healing the Mimic, for 8 s; the JELLY RAM\'s shields go on it and the two other squad followers, take hits first (40% of each wearer\'s max health) and knock the attacker back, for 10 s; FAULTLINE opens the Thermite Burrower\'s path', () => {
        const r = J(`(function(){ const o = {};
            __clear(); const m = __fol('core', 'brawler', 'mimic'); m.health = m.maxHealth * 0.5; const a = __foe(m.x + 2.5, m.y), far = __foe(m.x + 6, m.y), d0 = Math.hypot(a.x - m.x, a.y - m.y), h0 = m.health; m.ultimateCharge = 100; followerUltimate(m).execute(m);
            for (let i = 0; i < 90; i++) { updateElementEffects(); updateStatusEffects(); }
            o.vortex = [elementEffects.some(e => e.type === 'shardvortex'), __dmg(a) > 0, __dmg(far), Math.hypot(a.x - m.x, a.y - m.y) < d0, m.health > h0];
            for (let i = 0; i < 400; i++) updateElementEffects(); o.vortexGone = !elementEffects.some(e => e.type === 'shardvortex');
            __clear(); const j = __fol('core', 'brawler', 'jellyram'), b1 = __fol('fire', 'brawler'), b2 = __fol('ice', 'sniper'), b3 = __fol('toxic', 'brawler'); partyAdd([j, b1, b2]); j.ultimateCharge = 100; followerUltimate(j).execute(j);
            o.worn = [j, b1, b2, b3].map(f => !!f.jellyShield).join(); o.soak = Math.round(b1.jellyShield.hp / b1.maxHealth * 100);
            const biter = __foe(b1.x + 0.8, b1.y), hp0 = b1.health; applyDamage(b1, b1.maxHealth * 0.1, biter); o.hit = [b1.health === hp0, !!(biter.kbVX || biter.kbVY)];
            frame += 601; applyDamage(b1, 1, biter); o.after = [b1.jellyShield === null, b1.health < hp0];
            __clear(); const t = __fol('fire', 'camper', 'thermite'); partyAdd([t]); techAbilityTick(); t.ultimateCharge = 100; followerUltimate(t).execute(t); o.fault = [!!techAim, techAimNeed()]; techAimCancel();
            return o; })()`);
        same(r.vortex.join(), 'true,true,0,true,true', 'SHARD VORTEX: up, grinding the one in it, not the one outside, pulling it in, healing the Mimic'); same(r.vortexGone, true, 'over after 8 s');
        same(r.worn, 'true,true,true,false', 'the shields: the Jelly Ram and the two other squad followers, not the one outside the squad'); same(r.soak, 40, 'a shield\'s share of its wearer\'s max health');
        same(r.hit.join(), 'true,true', 'a hit taken by the shield, the attacker knocked back'); same(r.after.join(), 'true,true', 'gone after 10 s');
        same(r.fault.join(), 'true,path', 'FAULTLINE: its path is asked for');
    });
    check('the ROTSHARD\'s puddle (the owner, 2026-11-06: "Short and tight"): it spreads under the group it can see, grows to 2 tiles, a shard every 0.5 s under each enemy in it for 0.5× its power, poisoned 2 s; gone after 5 s; nothing in sight keeps the charge', () => {
        const r = J(`(function(){ const o = {};
            __clear(); const rs = __fol('toxic', 'sniper', 'rotshard'); rs.ultimateCharge = 100; followerUltimate(rs).execute(rs); o.none = rs.ultimateCharge;
            const a = __foe(rs.x + 5, rs.y), b = __foe(rs.x + 5.4, rs.y + 0.4), edge = __foe(rs.x + 6.6, rs.y), far = __foe(rs.x + 5, rs.y + 4); followerUltimate(rs).execute(rs);
            const e = elementEffects.find(x => x.type === 'toxicpuddle'); o.at = [!!e, e && Math.hypot(e.x - a.x, e.y - a.y) < 1, rs.ultimateCharge, followerUltimate(rs).name];
            for (let i = 0; i < 30; i++) updateElementEffects(); o.first = [__dmg(a) > 0, __dmg(b) > 0, __dmg(edge), __dmg(far), a.toxicWeakened, Math.round(e.bite / rs.power * 10) / 10];
            for (let i = 0; i < 100; i++) updateElementEffects(); o.grown = [e.radius, __dmg(edge) > 0, __dmg(far)];
            for (let i = 0; i < 200; i++) updateElementEffects(); o.gone = !elementEffects.some(x => x.type === 'toxicpuddle');
            return o; })()`);
        same(r.none, 100, 'nothing in sight: the charge kept'); same(r.at.join(), 'true,true,0,Toxic Puddle', 'the puddle under the group, the charge spent, its name');
        same(r.first.join(), 'true,true,0,0,120,0.5', 'the first shards at 0.5 s: the two in it hurt, poisoned 2 s, a bite 0.5× its power (before the damage system); the one past its edge and the far one not yet');
        same(r.grown.join(), '2,true,0', 'grown to 2 tiles: the one 1.6 tiles out bitten now, the far one never'); same(r.gone, true, 'gone after 5 s');
    });
    check('CARD ATTACKS (the owner, 2026-11-06: "Series 2, Prototype", "Only its own form", a SPECIAL ATTACK menu of its own, "It stays the new primary attack", "Nothing in between"): the two cards, their own slot, its rules, saved and cleared; CRYSTAL SPIKE TRIO ("Light") and SEARED CHARGE ("Short and hard") strike, then wait 8 s with no everyday hit; taken off, the everyday hit is back', () => {
        const r = J(`(function(){ const o = {}, ids = ['crystal_spike_trio', 'seared_charge'];
            __clear(); for (const id of ids) if (equipFound.indexOf(id) < 0) equipFound.push(id);
            const rs = __fol('toxic', 'sniper', 'rotshard'), qs = __fol('fire', 'brawler', 'quillstone');
            o.cards = ids.map(id => [EQUIP_CARDS[id].pack, EQUIP_CARDS[id].rarity, EQUIP_CARDS[id].kind, EQUIP_CARDS[id].match].join(':')).join();
            o.why = [equipSpecialWhyNot(qs, ids[0]), equipSpecialWhyNot(rs, ids[0]), equipWhyNot(rs, ids[0], 0), equipSpecialWhyNot(rs, 'chitin_scale')].join('|');
            o.put = [equipSpecialPut(qs, ids[0]), equipSpecialPut(rs, ids[0]), rs.special, equipSpecialPut(qs, ids[1]), qs.special].join();
            o.rec = [followerRecord(rs).special, equipSpecialRestore({}, ids[1]), equipSpecialRestore({}, 7)].join();
            const t = __foe(rs.x + 5, rs.y); rs._spReadyAt = 0;
            o.spike = [cardAttackTry(rs, t), __dmg(t) > 0, t.stunned, t.toxicWeakened, elementEffects.some(e => e.type === 'spiketrio'), rs._spReadyAt - frame];
            const d1 = __dmg(t); rs.attackCooldown = 0; o.wait = [cardAttackTry(rs, t), (followerAttack(rs, t), __dmg(t) === d1)];
            followerProjectiles.length = 0; t.x = rs.x + 4; for (let i = 0; i < 30; i++) updateNPC(rs); o.noShot = followerProjectiles.length;
            equipSpecialPut(rs, null); rs.attackCooldown = 0; for (let i = 0; i < 30; i++) updateNPC(rs); o.shotBack = followerProjectiles.length > 0;
            const far = __foe(qs.x + 4, qs.y + 3), u = __foe(qs.x + 2.5, qs.y); qs._spReadyAt = 0; const x0 = qs.x;
            o.charge = [cardAttackTry(qs, far), cardAttackTry(qs, u), Math.hypot(u.x - qs.x, u.y - qs.y) < 1.4, qs.x > x0, __dmg(u) > 0, !!(u.kbVX || u.kbVY), elementEffects.some(e => e.type === 'searedcharge'), qs._spReadyAt - frame];
            equipFound.splice(equipFound.indexOf(ids[0]), 1); equipValid(rs); equipSpecialPut(rs, ids[0]); o.gone = [rs.special === undefined, equipClear(qs), qs.special === undefined].join();
            return o; })()`);
        same(r.cards, 'series2:prototype:form:rotshard,series2:prototype:form:quillstone', 'the two cards: Series 2, Prototype, each its own form\'s');
        same(r.why, 'FOR A ROTSHARD ONLY||A SPECIAL ATTACK · ITS OWN MENU|NOT A SPECIAL ATTACK', 'the slot\'s rules: another form, its own form, not in CARD 1 or 2, an equip card not in the special slot');
        same(r.put, 'false,true,crystal_spike_trio,true,seared_charge', 'set in its own slot (not on the wrong form)');
        same(r.rec, 'crystal_spike_trio,true,false', 'saved with the follower; a bad saved value not believed');
        same(r.spike.join(), 'true,true,30,180,true,480', 'CRYSTAL SPIKE TRIO: it struck, stunned 0.5 s, poisoned 3 s, the spikes drawn, 8 s to wait');
        same(r.wait.join(), 'false,true', 'waiting: no strike and no everyday hit'); same(r.noShot, 0, 'the Mage shot no everyday shot while it waited');
        same(r.shotBack, true, 'the card taken off: its everyday shot is back');
        same(r.charge.join(), 'false,true,true,true,true,true,true,480', 'SEARED CHARGE: not past 3 tiles; charged in, hurt it, knocked it back, the streak drawn, 8 s to wait');
        same(r.gone, 'true,true,true', 'out of the hand it comes off; EXILE (a clear) empties it');
    });
    check('VOLTAGE FIELD ("Speed and attack speed") and WRAITHFIRE ("Haunt"): the field moves with the Orb, marks the followers in it (+30% move, +20% attack speed) and bites the enemies in it; the Ember Hood gives 25% of its HP, is a ghost 4 s that touches and hurts, then is back where it began; each waits from its end', () => {
        const r = J(`(function(){ const o = {}; __clear(); for (const id of ['voltage_field', 'wraithfire']) if (equipFound.indexOf(id) < 0) equipFound.push(id);
            const so = __fol('electric', 'brawler', 'staticorb'), mate = __fol('fire', 'brawler'), t = __foe(so.x + 1.5, so.y); mate.x = so.x - 1; mate.y = so.y;
            o.put = equipSpecialPut(so, 'voltage_field'); so._spReadyAt = 0; o.vf = [cardAttackTry(so, t), so._spReadyAt - frame];
            for (let i = 0; i < 31; i++) updateElementEffects(); o.vin = [__dmg(t) > 0, mate._voltUntil > frame, mate._voltMove, followerRest(mate, 45)];
            __clear(); const eh = __fol('fire', 'sniper', 'embercowl'), a = __foe(eh.x + 2, eh.y), b = __foe(eh.x + 2.6, eh.y + 0.4);
            equipSpecialPut(eh, 'wraithfire'); eh._spReadyAt = 0; const hp0 = eh.health, x0 = eh.x, y0 = eh.y;
            o.wf = [cardAttackTry(eh, a), Math.round((hp0 - eh.health) / hp0 * 100), eh.untargetable === true, eh._spReadyAt - frame];
            for (let i = 0; i < 60; i++) { frame++; updateNPC(eh); } o.mid = [__dmg(a) > 0, !!eh._wraith && eh._wraith.left < eh._wraith.power];
            for (let i = 0; i < 200 && eh._wraith; i++) { frame++; updateNPC(eh); } o.end = [!eh._wraith, eh.untargetable === false, eh.x === x0 && eh.y === y0, __dmg(b) > 0];
            return o; })()`);
        same(r.put, true, 'set'); same(r.vf.join(), 'true,1140', 'VOLTAGE FIELD: up; 5 s and then 14 s to wait');
        same(r.vin.join(), 'true,true,1.3,37', 'the enemy in it bitten; the follower in it marked: +30% move, its rest after an attack 37 frames, not 45 (+20%)');
        same(r.wf.join(), 'true,25,true,1140', 'WRAITHFIRE: 25% of its HP given, a ghost no one can hit; 4 s and then 15 s to wait');
        same(r.mid.join(), 'true,true', 'a touch hurt the enemy, spending part of its power'); same(r.end.join(), 'true,true,true,true', 'at the end: no ghost, targetable, back where it began; the rest exploded');
    });
    check('ROTTEN DECOY (the owner, 2026-11-07: "Short lure", "A second move to pick"): the Rotshard\'s second move sets a black crystal decoy 2 tiles from the nearest enemy, toward it; enemies within 6 tiles go for it (a boss does not); its mist poisons within 1.5 tiles; it lasts 6 s (half the Rotshard\'s max HP) and is ready again every 7 s (14 s until build 2026-11-10a halved it)', () => {
        const r = J(`(function(){ const o = {}; __clear(); rotDecoys = [];
            const rs = __fol('toxic', 'sniper', 'rotshard'); rs.move = 'rotten_decoy'; const t = __foe(rs.x + 5, rs.y), far = __foe(rs.x + 14, rs.y);
            o.moves = EVOLUTIONS.rotshard.moves.join(); __fire(rs); const d = rotDecoys[0];
            o.set = [rotDecoys.length, !!d && Math.round(Math.hypot(d.x - t.x, d.y - t.y)), !!d && d.x < t.x, !!d && Math.round(d.maxHealth / rs.maxHealth * 10) / 10, rs._sigCd];
            o.lure = [predatorPickPrey(t) === d, predatorPickPrey(far) === d]; t.bossName = 'TEST'; o.boss = predatorPickPrey(t) === d; t.bossName = undefined;
            const m = __foe(d.x + 0.5, d.y); for (let i = 0; i < 31; i++) { frame++; evolutionTick(); } o.mist = m.toxicWeakened > 0;
            for (let i = 0; i < 340; i++) { frame++; evolutionTick(); } o.gone = rotDecoys.length; o.info = !!MOVE_INFO['ROTTEN DECOY'];
            return o; })()`);
        same(r.moves, 'rotten_decoy', 'its moves (CORRODE SHOT its everyday shot since build 2026-11-07ss)'); same(r.set.join(), '1,2,true,0.5,420', 'set 2 tiles from the enemy toward the Rotshard (its time halved in build 2026-11-10a: 840 frames before); half its max HP; 7 s to the next');
        same(r.lure.join(), 'true,false', 'the near enemy goes for it, the far one not'); same(r.boss, false, 'a boss goes for it'); same(r.mist, true, 'the mist poisons'); same(r.gone, 0, 'gone after 6 s'); same(r.info, true, 'INFO has its rows');
    });
    check('QUILLSTORM, THUNDERSTORM, EVENT HORIZON (the owner, 2026-11-07): the Quillstone throws 16 burning quills all round; the Thunderhead\'s storm moves with it and its bolts strike enemies under it; the Void Star\'s black hole opens on the group, drags them in and crushes them', () => {
        const r = J(`(function(){ const o = {};
            __clear(); const q = __fol('fire', 'brawler', 'quillstone'); __foe(q.x + 3, q.y); q.ultimateCharge = 100; followerUltimate(q).execute(q);
            o.quill = [followerUltimate(q).name, followerProjectiles.filter(p => p.kind === 'quill').length, q.ultimateCharge];
            __clear(); const th = __fol('electric', 'sniper', 'thunderhead'), a = __foe(th.x + 2.5, th.y); th.ultimateCharge = 100; followerUltimate(th).execute(th);
            for (let i = 0; i < 31; i++) updateElementEffects(); o.storm = [followerUltimate(th).name, elementEffects.some(e => e.type === 'thunderstorm'), __dmg(a) > 0];
            __clear(); const v = __fol('flux', 'sniper', 'voidstar'), g1 = __foe(v.x + 5, v.y), g2 = __foe(v.x + 5.6, v.y + 1.5), d0 = Math.hypot(g2.x - g1.x, g2.y - g1.y); v.ultimateCharge = 100; followerUltimate(v).execute(v);
            const H = elementEffects.find(e => e.type === 'eventhorizon'); for (let i = 0; i < 31; i++) { updateElementEffects(); updateStatusEffects(); }
            o.hole = [followerUltimate(v).name, !!H && Math.hypot(H.x - g1.x, H.y - g1.y) < 2, __dmg(g1) > 0, __dmg(g2) > 0, Math.hypot(g2.x - H.x, g2.y - H.y) < Math.hypot(g2.x - H.x, g2.y - H.y) + 1];
            return o; })()`);
        same(r.quill.join(), 'Quillstorm,16,0', 'QUILLSTORM: 16 quills, the charge spent');
        same(r.storm.join(), 'Thunderstorm,true,true', 'THUNDERSTORM: the storm is up; the enemy under it struck');
        same(r.hole.join(), 'Event Horizon,true,true,true,true', 'EVENT HORIZON: on the group, both crushed');
    });
    check('SHOCKWAVE SLAM, ICE RINK, PROXY SWARM (the owner\'s picks, 2026-11-07): the Hammer Slug slams (core damage, thrown, stunned); the Igloo Skater\'s rink stays put, slows and bites enemies on it and speeds the squad on it; the Goo Proxy\'s three copies lure enemies, then burst (flux)', () => {
        const r = J(`(function(){ const o = {};
            __clear(); const hs = __fol('core', 'camper', 'hammerslug'), a = __foe(hs.x + 2, hs.y), far = __foe(hs.x + 6, hs.y); hs.ultimateCharge = 100; followerUltimate(hs).execute(hs);
            o.slam = [followerUltimate(hs).name, hs.ultimateCharge < 50, __dmg(a) > 0, a.stunned >= 60, !!(a.kbVX || a.kbVY), __dmg(far)];
            __clear(); const ig = __fol('ice', 'camper', 'igloo'), mate = __fol('fire', 'brawler', null), b = __foe(ig.x + 2.5, ig.y); mate.x = ig.x + 1; mate.y = ig.y; const x0 = ig.x;
            ig.ultimateCharge = 100; followerUltimate(ig).execute(ig); ig.x += 10; for (let i = 0; i < 31; i++) updateElementEffects();
            const rink = elementEffects.find(e => e.type === 'icerink');
            o.rink = [followerUltimate(ig).name, !!rink, rink && rink.x === x0, b.slowed > 0, b.slowFactor, __dmg(b) > 0, mate._voltMove, mate._voltUntil > frame];
            __clear(); rotDecoys = []; const gp = __fol('flux', 'camper', 'gooproxy'), c = __foe(gp.x + 3, gp.y); gp.ultimateCharge = 100; followerUltimate(gp).execute(gp);
            const goo = rotDecoys.filter(d => d.goo); o.swarm = [followerUltimate(gp).name, goo.length, !!(decoyLure(c) && decoyLure(c).goo)];
            const near = goo.reduce((m, d) => Math.hypot(d.x - c.x, d.y - c.y) < Math.hypot(m.x - c.x, m.y - c.y) ? d : m, goo[0]); c.x = near.x + 0.5; c.y = near.y;
            for (const d of goo) d.until = frame; rotDecoyTick();
            o.burst = [rotDecoys.filter(d => d.goo).length, __dmg(c) > 0];
            rotDecoys = []; return o; })()`);
        same(r.slam.join(), 'Shockwave Slam,true,true,true,true,0', 'SHOCKWAVE SLAM: spent, the near one hurt, stunned and thrown, the far one untouched');
        same(r.rink.join(), 'Ice Rink,true,true,true,0.4,true,1.3,true', 'ICE RINK: stays where it was made, the enemy on it slowed to 40% and bitten, the squad mate on it 30% faster');
        same(r.swarm.join(), 'Proxy Swarm,3,true', 'PROXY SWARM: three copies, an enemy near goes for one');
        same(r.burst.join(), '0,true', 'they burst at the end, hurting the enemy beside one');
    });
    check('WAVE MAKER and DRIFT SLASH (the owner\'s designs, 2026-11-07): the Hornshell\'s three waves hurt and throw the enemy ahead and it moves up after them; the Hover Shell interrupts, swings round the enemies in an oval slashing each (the owner, 2026-11-07: "a circular sort of slash, like a sword"), returns to its post, and the squad is faster for 6 s', () => {
        const r = J(`(function(){ const o = {};
            __clear(); const hn = __fol('core', 'sniper', 'hornshell'), a = __foe(hn.x + 3.8, hn.y), behind = __foe(hn.x - 5, hn.y), x0 = hn.x; hn.ultimateCharge = 100; followerUltimate(hn).execute(hn);
            const hit1 = __dmg(a), thrown = !!(a.kbVX || a.kbVY); for (let i = 0; i < 130; i++) updateElementEffects();
            o.wave = [followerUltimate(hn).name, hn.ultimateCharge < 50, hit1 > 0, thrown, __dmg(a) > hit1 * 2.5, __dmg(behind), Math.round((hn.x - x0) * 10) / 10 >= 2.5];
            __clear(); const hv = __fol('electric', 'camper', 'hovershell'), b = __foe(hv.x + 3, hv.y), c = __foe(hv.x + 3, hv.y + 1.5), home = [hv.x, hv.y]; b.attackWindup = 20; hv.ultimateCharge = 100; followerUltimate(hv).execute(hv);
            o.int = [b.attackWindup, b.glitched > 0]; let far = 0; for (let i = 0; i < 80; i++) { updateElementEffects(); far = Math.max(far, Math.hypot(hv.x - home[0], hv.y - home[1])); }
            o.drift = [followerUltimate(hv).name, hv.ultimateCharge < 50, __dmg(b) > 0, __dmg(c) > 0, far > 2, Math.hypot(hv.x - home[0], hv.y - home[1]) < 0.05, hv._voltMove, hv._voltUntil > frame + 200];
            return o; })()`);
        same(r.wave.join(), 'Wave Maker,true,true,true,true,0,true', 'WAVE MAKER: spent, the enemy ahead hit and thrown by all three waves, the one behind untouched, it moved up 3 tiles');
        same(r.int.join(), '0,true', 'DRIFT SLASH interrupts: the wind-up cancelled, its wind-ups failing');
        same(r.drift.join(), 'Drift Slash,true,true,true,true,true,1.3,true', 'DRIFT SLASH: spent, both slashed by the oval, it swung out and came back to its post, 30% faster for 6 s');
    });
    check('THE ALTERNATE IS A CHOSEN MODE (the owner, 2026-11-07: "locked into that ability [...] the wind up makes it balanced, and whenever the effect ends is when another wind up occurs, and when the wind up is occurring the [...] follower cannot move"; "Yes, exactly"; "Stays on the alternate"): on its normal attack no move fires; locked on STATIC VORTEX it winds up for the move\'s wind-up standing still and makes no normal attack (an attack order included), fires, and winds up again only once the vortex is gone', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), t = __foe(f.x + 3, f.y), o = {}, vortex = () => elementEffects.some(e => e.type === 'staticVortex');
            for (let i = 0; i < 400; i++) { frame++; evolutionTick(); } o.normal = [vortex(), !!f._altWind];
            o.set = followerAltSet(f, 'static_vortex'); frame++; evolutionTick(); o.wind = [f._altWind, moveWindupFrames('static_vortex')];
            const x0 = f.x, y0 = f.y, h0 = __dmg(t); f.attackOrder = t; let n = 0; while (f._altWind > 0 && n < 2000) { frame++; updateNPC(f); followerAttack(f, t); evolutionTick(); n++; }
            o.held = [Math.hypot(f.x - x0, f.y - y0) < 1e-6, __dmg(t) === h0, n]; o.fired = [vortex(), !!f._altLive];
            let k = 0, waited = true; while (f._altLive && k < 3000) { if (f._altWind > 0) waited = false; frame++; updateElementEffects(); evolutionTick(); k++; }
            o.after = [waited, vortex(), f._altWind === moveWindupFrames('static_vortex')]; f.attackOrder = null; return o; })()`);
        same(r.normal.join(), 'false,false', 'a move on its normal attack');
        same(r.set, true, 'locked on it'); same(r.wind[0], r.wind[1], 'its wind-up (frames)');
        same(r.held.slice(0, 2).join(), 'true,true', 'during the wind-up it moved, or hit with its normal attack: ' + JSON.stringify(r.held)); ok(r.held[2] >= r.wind[1] - 2, 'the wind-up was cut short: ' + r.held[2]);
        same(r.fired.join(), 'true,true', 'the vortex, and the effect it waits on');
        same(r.after.join(), 'true,false,true', 'no wind-up while the vortex was on; the next one began when it was gone');
    });
    check('WHITEOUT (the owner, 2026-11-07): the Rime Star\'s snowstorm moves with it for 6 s, slows the enemies in it to half speed and bites them (ice) every 0.5 s', () => {
        const r = J(`(function(){ __clear(); const rs = __fol('ice', 'sniper', 'rimestar'), a = __foe(rs.x + 2.5, rs.y); rs.ultimateCharge = 100; followerUltimate(rs).execute(rs);
            for (let i = 0; i < 31; i++) updateElementEffects(); return [followerUltimate(rs).name, elementEffects.some(e => e.type === 'whiteout'), a.slowed > 0, a.slowFactor, __dmg(a) > 0, rs.ultimateCharge < 50]; })()`);
        same(r.join(), 'Whiteout,true,true,0.5,true,true', 'WHITEOUT: up, the enemy in it slowed to half and bitten, the charge spent');
    });
    check('the move table has one row a move, no id twice, every form\'s moves in it; the new ids are pinball and static_vortex; static_rush keeps its id under its new name', () => {
        const r = J(`(function(){ const ids = Object.keys(MOVES), names = ids.map(k => MOVES[k].name), missing = []; for (const k in EVOLUTIONS) for (const id of (EVOLUTIONS[k].moves || [])) if (!MOVES[id]) missing.push(k + ':' + id);
            return { ids, names, dupN: names.length - new Set(names).size, idOk: ids.every(k => MOVES[k].id === k), missing }; })()`);
        same(r.dupN, 0, 'a name twice'); ok(r.idOk, 'a row whose id is not its key'); same(r.missing.join(), '', 'moves a form lists that have no row');
        ok(r.ids.indexOf('pinball') >= 0 && r.ids.indexOf('static_vortex') >= 0 && r.ids.indexOf('static_rush') >= 0, 'the ids: ' + r.ids);
        same(r.names.indexOf('STATIC RUSH'), -1, 'the old name is still in the table');
    });
    check('INFO says what each new attack does, read off the constants: QUILL BURST, HEXFIRE, SONIC ROLL, PINBALL, STATIC VORTEX, and the named shots FIREBALL and CHAIN LIGHTNING', () => {
        const r = J(`(function(){ const o = {}; for (const k of ['QUILL BURST', 'HEXFIRE', 'SONIC ROLL', 'PINBALL', 'STATIC VORTEX']) o[k] = MOVE_INFO[k] ? MOVE_INFO[k]() : null; for (const k of ['FIREBALL', 'CHAIN LIGHTNING']) o[k] = SHOT_INFO[k] ? SHOT_INFO[k]() : null; o.old = !!MOVE_INFO['STATIC RUSH']; return o; })()`);
        for (const k of ['QUILL BURST', 'HEXFIRE', 'SONIC ROLL', 'PINBALL', 'STATIC VORTEX', 'FIREBALL', 'CHAIN LIGHTNING']) ok(r[k] && r[k].length >= 3, k + ': ' + JSON.stringify(r[k]));
        const row = (k, h) => (r[k].find(x => x[0] === h) || [])[1] || '';
        ok(/^5, all at once/.test(row('QUILL BURST', 'QUILLS')), 'QUILL BURST: ' + row('QUILL BURST', 'QUILLS')); ok(/stays put and never grows/.test(row('HEXFIRE', 'EFFECT')), 'HEXFIRE: ' + row('HEXFIRE', 'EFFECT'));
        ok(/each enemy once/.test(row('PINBALL', 'EFFECT')), 'PINBALL: ' + row('PINBALL', 'EFFECT')); ok(/stays where it is cast/.test(row('STATIC VORTEX', 'EFFECT')), 'STATIC VORTEX: ' + row('STATIC VORTEX', 'EFFECT'));
        same(r.old, false, 'INFO still has STATIC RUSH');
    });
    check('the new fields are drawn without an error (the circle, the vortex, the chain\'s bolt, a quill and a HEXFIRE shot), and kept from the effects budget', () => {
        same(run(`(function(){ try { elementEffects.length = 0; elementEffects.push({ type: 'hexfire', x: player.x, y: player.y, radius: HALO_RADIUS, life: 100, maxLife: HALO_LIFE }, { type: 'staticVortex', x: player.x + 1, y: player.y, radius: VORTEX_RADIUS, life: 100, maxLife: VORTEX_LIFE }, { type: 'chainBolt', pts: [{ x: player.x, y: player.y }, { x: player.x + 2, y: player.y }], color: '#ffee33', life: 10, maxLife: 18 });
            drawElementEffects(); _drawFollowerProjectile(ctx, { kind: 'quill', vx: 0.18, vy: 0, element: 'fire', frame: 3 }, 100, 100); _drawFollowerProjectile(ctx, { kind: 'hex', vx: 0.18, vy: 0, element: 'fire', frame: 3 }, 100, 100); return 'drawn'; } catch (e) { return e.message; } finally { elementEffects.length = 0; } })()`), 'drawn', 'drawing');
        same(run(`FX_LONG.hexfire === 1 && FX_LONG.staticVortex === 1`), true, 'the budget could drop them');
    });
    check('EVERYDAY HITS (build 2026-11-09b; the owner, 2026-11-09: "Unevolved only", "Plain hit for now", "Full-strength hit"): an unevolved Brawler makes the plain hit even with WILL, one enemy, and spends none (it keeps its element: the triangle still reads it); an evolved one its element\'s move (a Quillstone\'s ring of fire hits the enemies round it) for 1 WILL; SUNDEW and STONEPETAL hit 0.45 × their attack, one enemy, for 1 WILL (1.8 times their plain hit), and MEND', () => {
        const r = J(`(function(){ const keep = Math.random; Math.random = () => 0.5; try { const o = {};
            const swing = (f, will) => { f.currentWill = will; f.attackCooldown = 0; const a = __foe(f.x + 0.7, f.y), b = __foe(f.x - 0.7, f.y + 0.3); followerAttack(f, a); const res = { a: __dmg(a), b: __dmg(b), will: f.currentWill }; actors = actors.filter(q => q !== a && q !== b); return res; };
            __clear(); const egg = __fol('fire', 'brawler', null); o.egg = swing(egg, 20); o.eggEl = egg.element;
            __clear(); const qs = __fol('fire', 'brawler', 'quillstone'); o.qs = swing(qs, 20);
            for (const id of ['sundew', 'coralcrab']) { __clear(); const E = EVOLUTIONS[id], f = __fol(E.element, E.role, id), hurt = __fol('fire', 'brawler', 'maw'); hurt.x = f.x + 1; hurt.y = f.y + 1; hurt.health = hurt.maxHealth * 0.5; const h0 = hurt.health;
                const full = swing(f, 20), plain = swing(f, 0); o[id] = { full, plain, ratio: Math.round(full.a / plain.a * 1000) / 1000, mended: hurt.health > h0 }; }
            o.mult = ELEMENT_ATTACKS.blossom.mult; return o; } finally { Math.random = keep; } })()`);
        ok(r.egg.a > 0 && r.egg.b === 0 && r.egg.will === 20, 'the unevolved Brawler: ' + JSON.stringify(r.egg)); same(r.eggEl, 'fire', 'its element');
        ok(r.qs.a > 0 && r.qs.b > 0 && r.qs.will === 19, 'the Quillstone\'s ring of fire: ' + JSON.stringify(r.qs));
        same(r.mult, 0.45, 'BLOOM\'s hit');
        for (const id of ['sundew', 'coralcrab']) { const x = r[id]; ok(x.full.a > 0 && x.full.b === 0 && x.full.will === 19, id + ' with WILL: ' + JSON.stringify(x.full)); same(x.ratio, 1.8, id + '\'s hit against its plain hit'); same(x.mended, true, id + '\'s hit MENDed'); }
    });

    console.log(failures ? `\n${failures} FAILED` : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
