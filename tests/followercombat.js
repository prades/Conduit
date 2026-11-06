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
    for (const d of dirs.filter(d => d.startsWith('chromium')).sort().reverse()) for (const rel of ['chrome-linux/chrome', 'chrome-linux/headless_shell']) { const p = path.join(base, d, rel); if (fs.existsSync(p)) return p; }
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
    var t = followers[0]; t.element = 'fire'; t.role = 'camper'; t.evolved = 'thermite'; t._moltAt = -1e9; followers.slice(1).forEach(function(f){ f.role = 'brawler'; f.evolved = undefined; });
    var said = [], keepSay = _techSay; _techSay = function(m){ said.push(m); return keepSay.apply(this, arguments); };   // (what the game tells the player, in case a path is refused)
    var cells = partyRoomCells('arena'), set = new Set(cells.map(function(c){ return c[0] + ',' + c[1]; })), best = null, bn = -1;   // (the arena's most open patch of floor, as the node checks use: where the Burrower stands, the player beside it)
    cells.forEach(function(c){ var n = 0; for (var dx = -6; dx <= 6; dx++) for (var dy = -6; dy <= 6; dy++) if (set.has((c[0] + dx) + ',' + (c[1] + dy))) n++; if (n > bn) { bn = n; best = c; } });
    var put = function(){ t.x = best[0] + 0.5; t.y = best[1] + 0.5; t.job = null; t.stance = 'hold'; player.x = player.visualX = t.x - 2; player.y = player.visualY = t.y; };
    put(); step(12); partyTick(); t._ab2ReadyAt = 0; t._abReadyAt = 0; put(); step(7); partyTick(); put();
    var slot = Array.prototype.slice.call(document.querySelectorAll('#squadBar .sb-slot')).find(function(e){ return e._unit === t; }), c1 = slot && slot.querySelector('.sb-ab'), c2 = slot && slot.querySelector('.sb-ab2');
    out.chips = { has1: !!slot && slot.classList.contains('has-ab'), has2: !!slot && slot.classList.contains('has-ab2'), t1: c1 && c1.textContent, t2: c2 && c2.textContent, r1: rect(c1), r2: rect(c2), shown2: c2 ? getComputedStyle(c2).display : null };
    c2.dispatchEvent(new MouseEvent('click', { bubbles: true })); step(2);
    out.aim = { on: document.body.classList.contains('tech-aiming'), prompt: $('#techAim .ta-t').textContent, chip2: c2.textContent, chip1: c1.textContent };
    var cx = t.x, cy = t.y, pts = []; for (var i = 0; i <= 24; i++) { var th = Math.PI * (1 - i / 24) / 2; pts.push(scr(cx + 3 - 2.5 * Math.cos(th), cy + 2.5 - 2.5 * Math.sin(th))); }
    touch('pointerdown', pts[0].x, pts[0].y); for (var j = 1; j < pts.length; j++) touch('pointermove', pts[j].x, pts[j].y); touch('pointerup', pts[pts.length - 1].x, pts[pts.length - 1].y); step(1);
    out.sent = { fault: !!t._fault, n: t._fault ? t._fault.pts.length : 0, len: t._fault ? Math.round(t._fault.cum[t._fault.cum.length - 1] * 100) / 100 : 0, aiming: document.body.classList.contains('tech-aiming'), start: t._fault ? [Math.round((t._fault.pts[0].x - cx) * 100) / 100, Math.round((t._fault.pts[0].y - cy) * 100) / 100] : null, said: said.slice(-3), at: [Math.round(cx * 10) / 10, Math.round(cy * 10) / 10], stroke: techAim && techAim.stroke ? techAim.stroke.length : null,
      panels: [typeof infoPanelOpen !== 'undefined' && infoPanelOpen, typeof settingsPanelOpen !== 'undefined' && settingsPanelOpen, typeof questBoxOpen !== 'undefined' && questBoxOpen, typeof classPickerOpen !== 'undefined' && classPickerOpen, typeof invPanelOpen !== 'undefined' && invPanelOpen, typeof armoryPanelOpen !== 'undefined' && armoryPanelOpen, typeof cloneMenuOpen !== 'undefined' && cloneMenuOpen].map(function(b){ return b ? 1 : 0; }).join('') };
    for (var k = 0; k < 400 && t._fault; k++) step(1);
    out.run = { over: !t._fault, up: !t.untargetable };
    t._ab2ReadyAt = 0; partyTick(); c2.dispatchEvent(new MouseEvent('click', { bubbles: true })); step(1);
    var on2 = document.body.classList.contains('tech-aiming');
    touch('pointerdown', pts[0].x, pts[0].y); touch('pointermove', pts[6].x, pts[6].y); touch('pointercancel', pts[6].x, pts[6].y); step(1);
    out.cancel = { was: on2, aiming: document.body.classList.contains('tech-aiming'), fault: !!t._fault };
    // A SECOND FINGER while the path is drawn (build 2026-11-06b): it is ignored, its moves and its lift. Once with the stray finger lifting first, once with the drawing finger lifting first.
    var two = function(strayFirst){
      for (var k2 = 0; k2 < 400 && t._fault; k2++) step(1);
      put(); if (techAim) techAimCancel(); t._ab2ReadyAt = 0; partyTick(); c2.dispatchEvent(new MouseEvent('click', { bubbles: true })); step(1);
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
    put(); if (techAim) techAimCancel(); t._ab2ReadyAt = 0; partyTick(); c2.dispatchEvent(new MouseEvent('click', { bubbles: true })); step(1);
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
    const J = s => JSON.parse(run('JSON.stringify(' + s + ')'));
    run(`gameState.running = true; facilityBlackoutSet(false); unlockedElements = new Set(ELEMENTS.map(e => e.id)); TUT.followerLevel = 0;`);
    // An open patch of the arena's floor (the cell with the most floor round it), the player off to one side; creatures that hold still and do not die; a follower of a form at level 20.
    run(`(function(){ const cells = partyRoomCells('arena'), set = new Set(cells.map(c => c[0] + ',' + c[1])); let best = null, bn = -1;
        for (const [x, y] of cells) { let n = 0; for (let dx = -6; dx <= 6; dx++) for (let dy = -6; dy <= 6; dy++) if (set.has((x + dx) + ',' + (y + dy))) n++; if (n > bn) { bn = n; best = [x, y]; } }
        globalThis.__C = [best[0] + 0.5, best[1] + 0.5]; player.x = player.visualX = __C[0] - 8; player.y = player.visualY = __C[1]; })();
        globalThis.__clear = () => { actors = actors.filter(a => !(a instanceof Predator) && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k] = []; followerProjectiles.length = 0; elementEffects.length = 0; floatingTexts.length = 0; frame++; };
        globalThis.__foe = (x, y, sp) => { const S = SPECIES[sp || 'ant'], p = new Predator('scout', Object.assign({}, S.scout, { color: S.color }), x, y); p.speciesName = sp || 'ant'; p.team = 'red'; p.provoked = true; p.health = p.maxHealth = 1e6; p.update = () => {}; actors.push(p); return p; };
        globalThis.__fol = (el, role, evo) => { spawnFollowerAtCrystal(el); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.role = role; f.evolved = evo || undefined; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); f.stance = 'hold'; f.x = __C[0]; f.y = __C[1]; return f; };
        globalThis.__off = f => { actors = actors.filter(a => a !== f); followers = followers.filter(a => a !== f); };   // (out of the world: its own AI and melee add nothing; its shots and fields keep it as their source)
        globalThis.__dmg = p => 1e6 - p.health;
        globalThis.__fire = f => { frame++; f._sigCd = 1; evolutionTick(); };
        globalThis.__one = (f, x, y, sp) => { const twin = __foe(x, y, sp); return twin; };
        globalThis.__scr = (wx, wy) => { let sx = (wx - player.visualX - (wy - player.visualY)) * TILE_W + canvas.width / 2, sy = (wx - player.visualX + (wy - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H; for (let i = 0; i < 8; i++) { const w = techScreenToWorld(sx, sy), ex = wx - w.x, ey = wy - w.y; if (Math.hypot(ex, ey) < 1e-4) break; sx += (ex - ey) * TILE_W; sy += (ex + ey) * TILE_H; } return { x: sx, y: sy }; };
        globalThis.__burrower = () => { const f = __fol('fire', 'camper', 'thermite'); partyAdd([f]); techAbilityTick(); f._abReadyAt = 0; f._ab2ReadyAt = 0; f.attackCooldown = 0; return f; };
        globalThis.__draw = (f, wpts) => { const sp = wpts.map(p => __scr(f.x + p[0], f.y + p[1])); techAimPathStart(sp[0].x, sp[0].y); for (let i = 1; i < sp.length; i++) techAimPathMove(sp[i].x, sp[i].y); return techAimTap(sp[sp.length - 1].x, sp[sp.length - 1].y); };
        globalThis.__arc = (R, n) => { const o = []; for (let i = 0; i <= n; i++) { const th = Math.PI * (1 - i / n) / 2; o.push([1 + R - R * Math.cos(th), R - R * Math.sin(th)]); } return o; };`);

    // ── QUILLSTONE ──────────────────────────────────────────
    group('QUILLSTONE (fire Brawler): QUILL BURST, five crystal quills at once, each stopping at the first enemy it hits; its main attack and FIRE BOMBS kept');
    check('EXACTLY five quills, all launched at once (the same frame, from the Quillstone), in a forward fan QUILL_FAN degrees edge to edge with the middle one at the nearest enemy', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'), t = __foe(f.x + 3, f.y + 1); __fire(f);
            const q = followerProjectiles.filter(p => p.kind === 'quill'), a0 = Math.atan2(t.y - f.y, t.x - f.x) * 180 / Math.PI, ang = q.map(p => Math.atan2(p.vy, p.vx) * 180 / Math.PI - a0);
            return { n: q.length, all: followerProjectiles.length, born: q.every(p => p.frame === 0 && p.x === f.x && p.y === f.y && p.source === f), ang, fan: QUILL_FAN, count: QUILL_COUNT, cd: f._sigCd, every: QUILL_EVERY }; })()`);
        same(r.count, 5, 'QUILL_COUNT (approved: exactly five)'); same(r.n, 5, 'quills'); same(r.all, 5, 'shots in all'); ok(r.born, 'not all launched together from the Quillstone');
        const s = r.ang.slice().sort((a, b) => a - b); ok(Math.abs(s[0] + r.fan / 2) < 1e-6 && Math.abs(s[4] - r.fan / 2) < 1e-6 && Math.abs(s[2]) < 1e-6, 'the fan: ' + JSON.stringify(s));
        for (let i = 1; i < 5; i++) ok(Math.abs(s[i] - s[i - 1] - r.fan / 4) < 1e-6, 'evenly spread: ' + JSON.stringify(s));
        same(r.cd, r.every, 'its wait');
    });
    check('each quill travels on its own: its own heading and speed, the follower shots\' flight, as far as QUILL_RANGE and no farther', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'); __foe(f.x + 3, f.y); __fire(f); __off(f); actors = actors.filter(a => !(a instanceof Predator));
            const q = followerProjectiles.filter(p => p.kind === 'quill'), s0 = q.map(p => [p.x, p.y]); let fr = 0; while (followerProjectiles.length && fr < 200) { render(); fr++; }
            const far = q.map((p, i) => Math.hypot(p.x - s0[i][0], p.y - s0[i][1]));
            return { speeds: q.map(p => Math.hypot(p.vx, p.vy)), heads: new Set(q.map(p => Math.round(Math.atan2(p.vy, p.vx) * 1000))).size, far, range: QUILL_RANGE, speed: QUILL_SPEED, left: followerProjectiles.length }; })()`);
        same(r.heads, 5, 'five headings'); ok(r.speeds.every(v => Math.abs(v - r.speed) < 1e-9), 'speeds ' + r.speeds); same(r.left, 0, 'quills still flying');
        ok(r.far.every(d => d >= r.range - 1e-6 && d <= r.range + r.speed + 1e-6), 'how far each flew with nothing in the way: ' + r.far);
    });
    check('each stops at the FIRST enemy it touches: no piercing (an enemy in line behind the first takes no quill), no explosion, no fragment splash (all the damage is the quills\' own hits, one a quill)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'), front = __foe(f.x + 2, f.y), behind = __foe(f.x + 3.3, f.y), off = __foe(f.x + 2.6, f.y + 2.8); __fire(f); __off(f);
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
            const near = __foe(f.x + 1.0, f.y); __fire(f); __off(f); { let fr = 0; while (followerProjectiles.length && fr < 200) { render(); fr++; } } out.close = __dmg(near); near.dead = true;
            frame++; followers.push(f); actors.push(f); const ps = [-20, -10, 0, 10, 20].map(d => { const R = d ? 3.9 : 3.8, an = (90 + d) * Math.PI / 180; return __foe(f.x + Math.cos(an) * R, f.y + Math.sin(an) * R); });   // (the middle one the nearest, so the fan is aimed at it; the fan down the floor's y, its quills spread along x, where a shot's touch is narrowest: js/game.js tests 30 px of (dx × TILE_W, dy × TILE_H))
            __fire(f); __off(f); { let fr = 0; while (followerProjectiles.length && fr < 200) { render(); fr++; } } out.spread = ps.map(__dmg);
            const twin = __foe(f.x + 40, f.y + 40); applyDamage(twin, f.power * QUILL_MULT, f, null, false, false, DMG_HIT_ALT); out.one = __dmg(twin); return out; })()`);
        ok(Math.abs(r.close - 5 * r.one) < 1e-6 * r.close + 1e-6, 'close up, five quills in one enemy: ' + JSON.stringify(r));
        ok(r.spread.every(d => Math.abs(d - r.one) < 1e-6 * d + 1e-6), 'across the fan, a quill each: ' + JSON.stringify(r));
    });
    check('nobody in reach: no quills and no wait spent; QUILL BURST stays its default move and FIRE BOMBS a choice on INFO; its main attack (the Brawler\'s plain hit, Piercing) is kept', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'brawler', 'quillstone'); __foe(f.x + QUILL_RANGE + 0.6, f.y); __fire(f);
            return { n: followerProjectiles.length, cd: f._sigCd, ids: evoMoveIds(EVOLUTIONS.quillstone), def: evoMoveOf(f).id, info: followerInfo(f).attacks.filter(s => s.choices).map(s => s.choices.map(c => c.label)), main: DMG_FORM.quillstone.main, alt: DMG_FORM.quillstone.alt, shot: EVOLUTIONS.quillstone.shot || null }; })()`);
        same(r.n, 0, 'quills at an enemy out of reach'); ok(r.cd <= 0, 'a wait for nothing: ' + r.cd);
        same(r.ids.join(), 'quill_burst,bomb_lob', 'its moves'); same(r.def, 'quill_burst', 'its default'); same(JSON.stringify(r.info), JSON.stringify([['QUILL BURST', 'FIRE BOMBS']]), 'the INFO choice');
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
    check('a shot that touches nobody lands where it was aimed and leaves its circle there; the retired Cinder Halo shares the move; HEXFIRE and FIRE BOMBS stay the INFO choice', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'sniper', 'embercowl'), t = __foe(f.x + 5, f.y); __fire(f); __off(f); const aim = [t.x, t.y]; t.x += 30;
            let fr = 0, c = null; while (!c && fr < 200) { render(); fr++; c = elementEffects.find(e => e.type === 'hexfire'); }
            return { at: c && [c.x, c.y], aim, halo: evoMoveIds(EVOLUTIONS.halo), ember: evoMoveIds(EVOLUTIONS.embercowl), def: evoMoveOf(f).id }; })()`);
        ok(r.at && Math.hypot(r.at[0] - r.aim[0], r.at[1] - r.aim[1]) < 0.4, 'not where it was aimed: ' + JSON.stringify(r));
        same(r.halo.join(), 'hexfire,bomb_lob', 'the Cinder Halo'); same(r.ember.join(), 'hexfire,bomb_lob', 'the Ember Hood'); same(r.def, 'hexfire', 'its default');
    });

    // ── STATIC ORB ──────────────────────────────────────────
    group('STATIC ORB (electric Brawler): SONIC ROLL kept (STATIC RUSH renamed); PINBALL, an automatic ricochet from enemy to enemy');
    check('SONIC ROLL is STATIC RUSH renamed, kept as it is: the same id (a saved choice), function and numbers; the default move; dash, hit, shock two more, all stunned', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'), a = __foe(f.x + 3, f.y), b = __foe(f.x + 4.5, f.y + 0.6), c = __foe(f.x + 6, f.y + 1), far = __foe(f.x + 12, f.y);
            __fire(f); const d = __dmg;
            return { name: MOVES.static_rush.name, fn: MOVES.static_rush.fn.toString(), nums: [MANTA_RANGE, MANTA_EVERY, MANTA_MULT, MANTA_CHAIN, MANTA_HOP, MANTA_CHAIN_SHARE, MANTA_STUN], def: evoMoveOf(f).id, ids: evoMoveIds(EVOLUTIONS.staticorb),
                     dist: Math.hypot(a.x - f.x, a.y - f.y), hit: [d(a), d(b), d(c), d(far)], stun: [a, b, c].every(p => p.stunned > 0), cd: f._sigCd, legacy: ['manta', 'prism', 'voltring'].map(k => EVOLUTIONS[k].move) }; })()`);
        same(r.name, 'SONIC ROLL', 'its name'); ok(/staticRush\(/.test(r.fn), 'its function'); same(r.nums.join(), '4,300,2.4,2,2.2,0.6,45', 'its numbers (unchanged)');
        same(r.def, 'static_rush', 'the default'); same(r.ids.join(), 'static_rush,pinball', 'its moves');
        ok(Math.abs(r.dist - 0.8) < 1e-6, 'the dash stops 0.8 short: ' + r.dist); ok(r.hit[0] > r.hit[1] && r.hit[1] > 0 && r.hit[2] > 0 && r.hit[3] === 0, 'hit and shocks: ' + r.hit); ok(r.stun, 'not stunned'); same(r.cd, 300, 'its wait');
        same(r.legacy.join(), 'SONIC ROLL,SONIC ROLL,SONIC ROLL', 'the retired electric brawlers');
    });
    check('PINBALL rolls into the nearest valid enemy, then each time into the nearest enemy it has NOT hit within PIN_HOP of it; an enemy farther than that ends it; no fixed count', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); f.move = 'pinball';
            const a = __foe(f.x + 2, f.y), b = __foe(f.x + 4.2, f.y + 0.6), c = __foe(f.x + 5.5, f.y + 2.4), d = __foe(f.x + 6.4, f.y + 4.6), far = __foe(f.x + 6.4, f.y + 9), name = p => p === a ? 'a' : p === b ? 'b' : p === c ? 'c' : p === d ? 'd' : p === far ? 'far' : 'other';
            __fire(f); const order = [], keep = applyDamage; globalThis.applyDamage = function (t, amt, src, el, rf, fx, hit) { if (src === f && hit === DMG_HIT_ALT) order.push(name(t)); return keep.apply(this, arguments); };   // (the roll's own hits: its melee, once it has stopped, is another attack)
            let fr = 0; try { while (f._pinball && fr < 900) { frame++; updateNPC(f); fr++; } } finally { globalThis.applyDamage = keep; }
            return { order, ended: !f._pinball, fr }; })()`);
        same(r.order.join(), 'a,b,c,d', 'the order it hit them (four collisions, no count fixed)'); ok(r.ended, 'it did not end');
    });
    check('PINBALL never hits one enemy twice and never loops: two enemies side by side are hit once each and it stops; it ends with its wait (PIN_EVERY, counted from the end) and fires nothing while rolling', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); f.move = 'pinball'; const a = __foe(f.x + 2, f.y), b = __foe(f.x + 2.6, f.y + 0.4);
            __fire(f); const hits = [], keep = applyDamage; globalThis.applyDamage = function (t, amt, src, el, rf, fx, hit) { if (src === f && hit === DMG_HIT_ALT) hits.push(t === a ? 'a' : 'b'); return keep.apply(this, arguments); };
            let fr = 0, fired = 0; try { while (f._pinball && fr < 900) { const cd = f._sigCd; frame++; updateNPC(f); evolutionTick(); if (f._pinball && f._sigCd !== cd) fired++; fr++; } } finally { globalThis.applyDamage = keep; }
            return { hits, ended: !f._pinball, cd: f._sigCd, fired, every: PIN_EVERY, fr }; })()`);
        same(r.hits.slice().sort().join(), 'a,b', 'hits'); ok(r.ended && r.fr < 100, 'it went on: ' + JSON.stringify(r)); same(r.fired, 0, 'its wait ran (or a move fired) while it rolled');
        ok(r.cd >= r.every - 1 && r.cd <= r.every, 'its wait after the roll: ' + r.cd);
    });
    check('PINBALL ROLLS (never more than PIN_SPEED tiles a frame) and stops cleanly at its safety limits: a target that keeps running off ends it by PIN_MAX_FRAMES or PIN_MAX_DIST', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); f.move = 'pinball'; const a = __foe(f.x + 3, f.y); __fire(f);
            let fr = 0, most = 0, x = f.x, y = f.y; while (f._pinball && fr < 2000) { a.x = f.x + 1.5; a.y = f.y + (fr % 2 ? 0.3 : -0.3); frame++; updateNPC(f); most = Math.max(most, Math.hypot(f.x - x, f.y - y)); x = f.x; y = f.y; fr++; }   // (it runs on ahead every frame: a wall, PIN_MAX_FRAMES or PIN_MAX_DIST must stop it)
            return { most, speed: PIN_SPEED, fr, ended: !f._pinball, maxF: PIN_MAX_FRAMES, maxD: PIN_MAX_DIST }; })()`);
        ok(r.most <= r.speed + 1e-9, 'a frame\'s step ' + r.most); ok(r.ended, 'it never stopped: ' + JSON.stringify(r)); ok(r.fr <= r.maxF + 2, 'it rolled ' + r.fr + ' frames');
    });
    check('PINBALL: nobody in reach, no roll and no wait spent; an enemy it cannot see (a wall between) is not picked; PINBALL is the Static Orb\'s only (the retired electric brawlers keep SONIC ROLL alone)', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'brawler', 'staticorb'); f.move = 'pinball'; __foe(f.x + PIN_RANGE + 0.7, f.y); __fire(f); const out = { roll: !!f._pinball, cd: f._sigCd };
            out.legacy = ['manta', 'prism', 'voltring'].map(k => evoMoveIds(EVOLUTIONS[k]).join()); out.hover = evoMoveIds(EVOLUTIONS.hovershell).length;
            out.sees = (function(){ const g = { x: __C[0], y: __C[1] }, cells = partyRoomCells('arena'); return typeof _pinSees === 'function' && cells.length > 0; })(); return out; })()`);
        same(r.roll, false, 'a roll at an enemy out of reach'); ok(r.cd <= 0, 'a wait for nothing: ' + r.cd); same(r.legacy.join('|'), 'static_rush|static_rush|static_rush', 'the retired forms'); same(r.hover, 0, 'the Hover Shell has a move'); ok(r.sees, 'no sight check');
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
    check('STATIC VORTEX is STATIONARY (it never travels or grows) and pulls the enemies in it toward its middle; a beetle is too heavy to drag; one outside it is left alone', () => {
        const r = J(`(function(){ __clear(); const f = __fol('electric', 'sniper', 'thunderhead'), t = __foe(f.x + 5, f.y), p = __foe(f.x + 6.9, f.y + 0.4), b = __foe(f.x + 5, f.y + 1.8, 'beetle'), out = __foe(f.x + 9, f.y);
            __fire(f); __off(f); const v = elementEffects.find(e => e.type === 'staticVortex'), x0 = v.x, y0 = v.y, r0 = v.radius, d0 = Math.hypot(p.x - v.x, p.y - v.y), b0 = [b.x, b.y], o0 = [out.x, out.y];
            let moved = false; for (let i = 0; i < 90; i++) { render(); if (v.x !== x0 || v.y !== y0 || v.radius !== r0) moved = true; }
            return { at: [x0, y0], t: [5, 0], moved, d0, d1: Math.hypot(p.x - x0, p.y - y0), beetle: Math.hypot(b.x - b0[0], b.y - b0[1]), outMoved: Math.hypot(out.x - o0[0], out.y - o0[1]), r: r0, R: VORTEX_RADIUS }; })()`);
        same(r.moved, false, 'the vortex moved or grew'); same(r.r, r.R, 'its radius'); ok(r.d1 < r.d0 - 1, 'pulled in from ' + r.d0 + ' to ' + r.d1);
        same(r.beetle, 0, 'the beetle was dragged'); same(r.outMoved, 0, 'an enemy outside it was pulled');
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
    check('FAULTLINE is the evolved Burrower\'s alone, on a SECOND CHIP with its own wait; the THERMITE DRILL keeps its chip, its wait and the rubble (the egg has the drill alone; no other form has a second chip)', () => {
        const r = J(`(function(){ __clear(); const f = __burrower(), egg = __fol('fire', 'camper', null), hs = __fol('electric', 'camper', 'hovershell'), o = {};
            o.second = (techAbility2Of(f) || {}).id; o.first = (techAbilityOf(f) || {}).id; o.egg = techAbility2Of(egg); o.eggFirst = (techAbilityOf(egg) || {}).id; o.hover = techAbility2Of(hs);
            o.chip2 = techChip2State(f).text; o.chip1 = techChipState(f).text; o.others = Object.keys(EVOLUTIONS).filter(k => k !== 'thermite' && TECH_ABILITY2[k]).join();
            o.rubble = _techFireTechs().indexOf(f) >= 0; o.join = (function(){ __clear(); const g = __fol('fire', 'camper', 'thermite'); partyAdd([g]); techAbilityTick(); return Math.round(techReady2In(g) / 60); })(); return o; })()`);
        same(r.second, 'faultline', 'its second'); same(r.first, 'thermite_drill', 'its first'); same(r.egg, null, 'the egg\'s second'); same(r.eggFirst, 'thermite_drill', 'the egg\'s first'); same(r.hover, null, 'the Hover Shell\'s second');
        ok(/^〰 FAULT$/.test(r.chip2) && /^✹ DRILL$/.test(r.chip1), 'the chips: ' + r.chip1 + ' / ' + r.chip2); same(r.others, '', 'other forms with a second ability'); ok(r.rubble, 'the rubble\'s ring does not find the Burrower'); same(r.join, 60, 'FAULTLINE\'s first wait (s) after joining');
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
    check('FAULTLINE is called off by the chip again, by Escape and by a touch the system cancels; its spikes go through the damage system as its ability; it is busy while it runs (the drill cannot start) and its wait is its own', () => {
        const r = J(`(function(){ __clear(); const f = __burrower(), o = {}; techChip2Tap(f); techChip2Tap(f); o.chipAgain = !!techAim;
            techChip2Tap(f); techAimCancel(); o.escape = !!techAim;   // (Escape: js/techabilities.js's keydown calls techAimCancel)
            techChip2Tap(f); const s0 = __scr(f.x + 1, f.y); techAimPathStart(s0.x, s0.y); techAimPathMove(s0.x + 30, s0.y + 10); techAimPathCancel(); o.cancel = { aim: !!techAim, fault: !!f._fault };
            techChip2Tap(f); __draw(f, __arc(3, 40)); o.busyDrill = techAbilityCan(f).why; o.chip1 = techChipState(f).text; o.drillWait = techReadyIn(f); o.faultWait = Math.round(techReady2In(f) / 60);
            const E = rd => 0; return o; })()`);
        same(r.chipAgain, false, 'the chip again'); same(r.escape, false, 'Escape'); same(r.cancel.aim, false, 'a cancelled touch'); same(r.cancel.fault, false, 'a cancelled touch sent it');
        same(r.busyDrill, 'BUSY', 'the drill while FAULTLINE runs'); ok(/BUSY/.test(r.chip1), 'the drill\'s chip: ' + r.chip1); same(r.drillWait, 0, 'the drill\'s wait was spent'); same(r.faultWait, 60, 'FAULTLINE\'s wait (s)');
        const T = rd('js/techabilities.js'), I = rd('js/input.js'); ok(/applyElementalDamage\(e, dmg, f, "fire", DMG_HIT_ALT\)/.test(T), 'the spikes do not go through the damage system as its ability');
        ok(/canvas\.addEventListener\('pointercancel'/.test(I) && /techAimPathCancel\(\)/.test(I) && /techAimPathMove\(_mx, _my\)/.test(I) && /techAimPathStart\(pressX, pressY\)/.test(I), 'the input does not carry the path');
    });
    check('INFO names it all: MAIN ATTACK · BURROW STRIKE, ABILITY · THERMITE DRILL, ABILITY · FAULTLINE (its path, its spikes, its own wait)', () => {
        const r = J(`(function(){ __clear(); const f = __burrower(); return followerInfo(f).attacks.map(s => s.h); })()`);
        ok(r.indexOf('MAIN ATTACK · BURROW STRIKE') >= 0 && r.indexOf('ABILITY · THERMITE DRILL') >= 0 && r.indexOf('ABILITY · FAULTLINE') >= 0, 'INFO: ' + r);
    });
    {
        const T = measure(1180, 820);
        if (T === null) console.log('  (no Chromium here: the real page\'s check skipped)');
        else check('THE REAL PAGE, BY TOUCH: the Burrower\'s card shows both chips, FAULTLINE\'s just above the drill\'s; a tap on it aims; a path drawn with a finger\'s pointer events is sent and run; a stroke the system cancels sends nothing and ends the aim', () => {
            ok(T && !T.err, 'the page: ' + JSON.stringify(T));
            ok(T.chips.has1 && T.chips.has2 && T.chips.shown2 === 'block', 'the chips: ' + JSON.stringify(T.chips)); ok(/DRILL/.test(T.chips.t1) && /FAULT/.test(T.chips.t2), 'their words: ' + JSON.stringify(T.chips));
            ok(T.chips.r2[3] <= T.chips.r1[1] + 1 && Math.abs(T.chips.r2[2] - T.chips.r1[2]) <= 1, 'FAULTLINE\'s chip is not just above the drill\'s: ' + JSON.stringify(T.chips));
            ok(T.aim.on && /FAULTLINE/.test(T.aim.prompt) && /AIMING/.test(T.aim.chip2) && !/AIMING/.test(T.aim.chip1), 'the aim: ' + JSON.stringify(T.aim));
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
    check('the Hover Shell itself is as it was: no move, no named shot, its types (Crushing, Earthquake) and subclass (Drone), and the Technicians\' shared plain hit within 4 tiles', () => {
        const r = J(`({ form: EVOLUTIONS.hovershell, dmg: DMG_FORM.hovershell, sub: EQUIP_FORM_SUBCLASS.hovershell })`);
        same(JSON.stringify(r.form), JSON.stringify({ id: 'hovershell', name: 'HOVER SHELL', element: 'electric', role: 'camper', sheet: 'img/evo/hovershell.png', cell: 144, anchor: [72, 114.2], core: [72, 91.1], noGlow: true, color: '#ffee33' }), 'its form');
        same(JSON.stringify(r.dmg), JSON.stringify({ main: 'crushing', alt: 'earthquake' }), 'its damage types'); same(r.sub, 'drone', 'its subclass');
        const N = rd('js/npc.js'); ok(/const CAMPER_ENGAGE_RADIUS = 4;/.test(N) && /\} else \{\s*followerAttack\(actor, nearestEnemy\);\s*\}/.test(N.slice(N.indexOf('CAMPER (the technician)'))), 'the Technicians\' plain hit changed');
    });

    // ── THE DAMAGE SYSTEM, THE TABLES AND THE WORDS ─────────
    group('ONE DAMAGE SYSTEM, ONE TABLE, ONE SET OF WORDS');
    check('every new hit goes through applyDamage with the established hit kinds (a move\'s DMG_HIT_ALT, the Mages\' DMG_HIT_SHOT): no health is taken off by hand', () => {
        const E = rd('js/evolution.js'), body = n => { const i = E.indexOf('function ' + n + '('); ok(i >= 0, 'no ' + n); const j = E.indexOf('\nfunction ', i + 10); return E.slice(i, j < 0 ? undefined : j); };
        for (const [fn, kind] of [['quillBurst', 'DMG_HIT_ALT'], ['fieldBite', 'DMG_HIT_ALT'], ['pinballStep', 'DMG_HIT_ALT'], ['chainLightning', 'DMG_HIT_SHOT']]) { const b = body(fn); ok(b.indexOf(kind) >= 0, fn + ' does not use ' + kind); ok(!/\.health\s*-=|\.health\s*=\s*[^=]/.test(b), fn + ' sets health by hand'); }
        ok(/applyDamage\(t, \(f\.power \|\| 10\) \* PIN_MULT/.test(E) && /applyDamage\(a, e\.bite/.test(E) && /applyDamage\(next, d, f/.test(E), 'not through applyDamage');
    });
    check('MAGMA VENT (the Thermite Burrower\'s move; the owner: "Short and hot"): a vent MAGMA_RADIUS tiles round opens under the enemy it can see within MAGMA_RANGE, bites at once and every MAGMA_TICK frames for MAGMA_LIFE frames, enemies only; then MAGMA_EVERY frames before the next', () => {
        const r = J(`(function(){ __clear(); const f = __fol('fire', 'camper', 'thermite'), t = __foe(f.x + 4, f.y + 0.5), far = __foe(f.x + 4 + MAGMA_RADIUS + 1, f.y + 0.5); const fired = magmaVent(f), cd = f._sigCd; const v = elementEffects.find(e => e.type === 'magmavent');
            const first = __dmg(t), farFirst = __dmg(far); let bites = 0, last = first, k = 0; while (elementEffects.some(e => e.type === 'magmavent') && k < 600) { render(); k++; const d = __dmg(t); if (d !== last) { bites++; last = d; } }
            return { fired, move: evoMoveOf(f).name, at: v && [Math.round(v.x * 10) / 10, Math.round(v.y * 10) / 10], t: [Math.round(t.x * 10) / 10, Math.round(t.y * 10) / 10], r: v && v.radius, first: first > 0, far: farFirst, bites, gone: k, cd, want: [MAGMA_RADIUS, MAGMA_LIFE, MAGMA_TICK, MAGMA_EVERY] }; })()`);
        same(r.fired, true, 'it did not open'); same(r.move, 'MAGMA VENT', 'the Thermite Burrower\'s move'); same(JSON.stringify(r.at), JSON.stringify(r.t), 'not under the enemy');
        same(r.r, r.want[0], 'its radius'); same(r.first, true, 'no bite as it opened'); same(r.far, 0, 'it reached an enemy beyond its radius');
        same(r.bites, Math.floor(r.want[1] / r.want[2]) - 1, 'bursts after the first (one a second while it is open): ' + r.bites); ok(r.gone <= r.want[1] + 2, 'it stayed open too long: ' + r.gone); same(r.cd, r.want[3], 'the wait');
    });
    check('OWN ULTIMATES (the owner, 2026-11-06: "Own Ultimates"): a form with its own fires it, any other its element\'s; OVERDRIVE rushes to the biggest group and hits it with a knockback ("Smaller rush"); ABSOLUTE ZERO swallows up to three, holds them 6 s, no damage, then lets them go; TOXIC UNDERTOW hurts, scatters and poisons ("Strong"); CONTAMINATION NETWORK needs two pods and bites what touches a strand ("10 s")', () => {
        const r = J(`(function(){ const o = {};
            __clear(); const so = __fol('electric', 'brawler', 'staticorb'), eh = __fol('fire', 'sniper', 'embercowl'), qs = __fol('fire', 'brawler', 'quillstone');
            o.look = [followerUltimate(so).name, followerUltimate(eh) === FOLLOWER_ULTIMATES.fire, followerUltimate(qs) === FOLLOWER_ULTIMATES.fire];
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
        same(r.look.join(), 'Overdrive,true,true', 'its own, the Ember Hood\'s (the fire one), a form without its own (its element\'s)');
        same(r.over.join(), 'true,true,true,true,0,true', 'OVERDRIVE: spent (its own hits charge it a little again), rushed to the group, both hit, the lone one not, knocked back');
        same(r.zero.join(), '0,3,true', 'ABSOLUTE ZERO: spent, three swallowed (not four), no damage'); same(r.zeroAfter.join(), '0,true,true', 'let go after 6 s, targetable again, still no damage');
        same(r.under.join(), 'true,true,240,0.7,true', 'TOXIC UNDERTOW: both hurt, poisoned 4 s at 70% of their hits, thrown');
        same(r.netNone, 100, 'CONTAMINATION NETWORK with no pods spent its charge'); same(r.net.join(), 'true,true,true,0,true', 'CONTAMINATION NETWORK: spent (its bites charge it a little again), the strand is up, the one on it hurt and poisoned, the one off it not');
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

    console.log(failures ? `\n${failures} FAILED` : '\nall passed');
    process.exit(failures ? 1 : 0);
})();
