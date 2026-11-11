// DRAFT HARNESS (for the owner; not built): the target bubble (the round dial: the locked creature, a tap shoots it) folded into THE CORE, in three ways, drawn over the real page.
// The owner, 2026-11-11, after build 2026-11-11u: "I honestly want a way to incorporate the little player to shoot or attack predator little bubble. I want that to be incorporated into that little
// menu down there as well, but I want the whole thing to look elegant".
//   A  CROWN   the bubble on top of THE CORE, set on the surge's words like a gem on a stand: the target, then you, then your bars, top to bottom. Your cube looks up at it; a shot runs up through it.
//   B  TRIO    the bubble joins GUARD and STUN as the top of their column, on its own cable: your three actions, the shot first. A shot runs along the cable.
//   C  SLABS   the target as a slab across the top of THE CORE, its picture in a round socket at the slab's end and the trigger at the other: the creature's slab above, yours below (the bars).
//              A shot runs up into it. (The cube's screen as the scope was tried too: at the screen's size the creature cannot be made out.)
//   C2 SLABS UNDER THE CUBE (the owner circled C and drew it down under the cube): the creature's slab between the cube and the pills, over yours; the box 56 px taller while one is locked.
//              A shot runs down into it. NONE: no creature locked (THE CORE as it is).
// Each is drawn LOCKED (aiming) and FIRING (a shot: the cube fires, the bubble takes it, the number). NOW is build 2026-11-11u as it is.
// node design/ui-mocks/core-target/draft.js [--out=dir] [WxH]   The repo's files are read, never written. Needs playwright and ImageMagick's convert (the sheet).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || 'playwright'); const fs = require('fs'), path = require('path'), os = require('os');
const { execFileSync } = require('child_process');
const ROOT = path.resolve(__dirname, '../../..'), OUT = path.resolve((process.argv.find(x => x.startsWith('--out=')) || '--out=/tmp/core-target').slice(6));
const [VW, VH] = (process.argv.find(x => /^\d+x\d+$/.test(x)) || '1180x820').split('x').map(Number);

// what is drawn over the page for a draft (runs in the page)
function install() {
  const D = window.__D = { mode: null, fire: 0 };
  const OV = document.createElement('canvas'); OV.style.cssText = 'position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:13;pointer-events:none'; OV.width = innerWidth * 2; OV.height = innerHeight * 2; document.body.appendChild(OV);
  const g = OV.getContext('2d'), NEO = '"DejaVu Sans", "Segoe UI", system-ui, sans-serif';
  const TAU = Math.PI * 2;
  const glow = (x, y, r0, r1, c0) => { const gr = g.createRadialGradient(x, y, r0, x, y, r1); gr.addColorStop(0, c0); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r1, 0, TAU); g.fill(); };
  // a slab skewed as THE CORE's (skewX -12deg), centred on (x, y), with its words
  const plate = (x, y, w, h, fill, stroke, text, tcol, font) => { g.save(); g.translate(x, y); g.transform(1, 0, -0.2126, 1, 0, 0); g.fillStyle = fill; g.fillRect(-w / 2, -h / 2, w, h); g.lineWidth = 1.5; g.strokeStyle = stroke; g.strokeRect(-w / 2, -h / 2, w, h); g.restore();
    if (text) { g.font = font; g.fillStyle = tcol; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, x, y + 1); } };
  const lvOf = a => 'LV ' + (Number.isFinite(a.level) ? a.level : '?');
  const hpOf = a => Math.max(0, Math.min(1, Math.max(0, a.health) / Math.max(1, a.maxHealth || a.health || 1)));
  const hpCol = k => k > 0.5 ? '#5fe0a0' : k > 0.25 ? '#ffd34d' : '#ff5a3a';
  // the target bubble, in THE CORE's manner: the picture in a dark disc, the health ring, a thin bezel in the creature's colour, LV on a slab, INFO, and the trigger (a tap on the bubble shoots)
  function bubble(x, y, R, a, fire, left) {
    const col = _tgColour(a), k = hpOf(a);
    glow(x, y, R * 0.7, R * 1.5, fire ? 'rgba(255,96,64,0.6)' : 'rgba(255,128,72,0.22)');
    g.fillStyle = '#0b1226'; g.beginPath(); g.arc(x, y, R, 0, TAU); g.fill();
    const pic = targetPortrait(a); if (pic) { g.save(); g.beginPath(); g.arc(x, y, R - 7, 0, TAU); g.clip(); g.drawImage(pic, x - R + 7, y - R + 7, (R - 7) * 2, (R - 7) * 2); if (fire) { g.fillStyle = 'rgba(255,220,200,0.35)'; g.fillRect(x - R, y - R, R * 2, R * 2); } g.restore(); }
    g.lineCap = 'round'; g.lineWidth = 6; g.strokeStyle = 'rgba(255,255,255,0.14)'; g.beginPath(); g.arc(x, y, R - 3, 0, TAU); g.stroke();
    g.strokeStyle = hpCol(k); g.beginPath(); g.arc(x, y, R - 3, -Math.PI / 2, -Math.PI / 2 + k * TAU); g.stroke();
    g.lineWidth = 2; g.strokeStyle = fire ? '#fff4e8' : col; g.beginPath(); g.arc(x, y, R + 1.5, 0, TAU); g.stroke();
    plate(left ? x : x - R * 0.62, y + R * (left ? 0.98 : 0.86), 44, 17, 'rgba(6,10,24,0.94)', col, lvOf(a), '#fff', 'italic 900 11px ' + NEO);
    // INFO, upper right; the trigger, lower right (a crosshair: the bubble is the gun's button)
    const ix = x + R * 0.76, iy = y - R * 0.76; g.fillStyle = '#0b1226'; g.beginPath(); g.arc(ix, iy, 11, 0, TAU); g.fill(); g.lineWidth = 1.8; g.strokeStyle = '#8fe3ff'; g.stroke();
    g.fillStyle = '#8fe3ff'; g.font = 'italic 900 13px ' + NEO; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('i', ix, iy + 1);
    const tx = x + (left ? -1 : 1) * R * 0.78, ty = y + R * 0.74; g.fillStyle = fire ? '#ff4a3a' : '#0b1226'; g.beginPath(); g.arc(tx, ty, 14, 0, TAU); g.fill(); g.lineWidth = 2.2; g.strokeStyle = '#ff4a3a'; g.stroke();
    g.strokeStyle = fire ? '#fff' : '#ff6a50'; g.lineWidth = 1.8; g.beginPath(); g.arc(tx, ty, 6, 0, TAU); g.moveTo(tx - 10, ty); g.lineTo(tx - 3, ty); g.moveTo(tx + 3, ty); g.lineTo(tx + 10, ty); g.moveTo(tx, ty - 10); g.lineTo(tx, ty - 3); g.moveTo(tx, ty + 3); g.lineTo(tx, ty + 10); g.stroke();
  }
  // a shot: a soft beam with a bright core, a flash where it leaves, a burst where it lands, and the number
  function beam(x0, y0, x1, y1) { g.lineCap = 'round'; g.strokeStyle = 'rgba(255,170,90,0.35)'; g.lineWidth = 9; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.strokeStyle = '#fff3c8'; g.lineWidth = 2.6; g.stroke(); }
  function burst(x, y, r) { glow(x, y, 2, r, 'rgba(255,236,190,0.95)'); g.strokeStyle = '#ffe2a0'; g.lineWidth = 2; for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.3; g.beginPath(); g.moveTo(x + Math.cos(a) * r * 0.45, y + Math.sin(a) * r * 0.45); g.lineTo(x + Math.cos(a) * r * 1.05, y + Math.sin(a) * r * 1.05); g.stroke(); } }
  function number(x, y, n) { g.font = 'italic 900 30px "BV Barlow", ' + NEO; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 5; g.strokeStyle = 'rgba(20,6,4,0.9)'; g.strokeText(String(n), x, y); g.fillStyle = '#ffb347'; g.fillText(String(n), x, y); }
  // a cable as THE CORE's (dark, a faint light along it); lit, the shot running down it
  function cable(x0, y0, x1, y1, sag, lit) { g.beginPath(); g.moveTo(x0, y0); g.quadraticCurveTo((x0 + x1) / 2 - 6, (y0 + y1) / 2 + sag, x1, y1); g.lineCap = 'round'; g.lineWidth = 6; g.strokeStyle = '#040506'; g.stroke();
    g.lineWidth = lit ? 3 : 1.4; g.strokeStyle = lit ? '#ffe9b0' : 'rgba(120,140,170,0.35)'; g.stroke(); if (lit) { g.lineWidth = 9; g.strokeStyle = 'rgba(255,170,90,0.3)'; g.stroke(); } }

  function draw() {
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, OV.width, OV.height); g.setTransform(2, 0, 0, 2, 0, 0);
    const a = typeof targetCurrent === 'function' ? targetCurrent() : null; if (!D.mode || !a || !_core) return;
    const r = _core.root.getBoundingClientRect(), bx = r.left, by = r.top, P = _core.art.frames[0], fire = D.fire;
    if (D.mode === 'A') {   // CROWN: the bubble above the surge's words, held in a gold setting; the shot up through the words
      const x = bx + 200, y = by - 46, R = 46, sx = bx + P.arcC[0], st = by + P.arcC[1] - P.arcR - 8 - 24;
      g.lineWidth = 2; g.strokeStyle = 'rgba(255,214,90,0.85)'; g.beginPath(); g.arc(x, y, R + 6, 0.18 * Math.PI, 0.82 * Math.PI); g.stroke();   // the setting, under the bubble
      for (const s of [-1, 1]) { const ax = x + Math.cos(Math.PI / 2 - s * 0.32 * Math.PI) * (R + 6), ay = y + Math.sin(Math.PI / 2 - s * 0.32 * Math.PI) * (R + 6); g.fillStyle = '#ffd65a'; g.beginPath(); g.arc(ax, ay, 2.6, 0, TAU); g.fill(); }
      g.fillStyle = '#ffd65a'; g.beginPath(); g.moveTo(sx, st + 1); g.lineTo(sx - 5, y + R + 5); g.lineTo(sx + 5, y + R + 5); g.closePath(); g.fill();   // the stem to the words
      if (fire) { beam(bx + P.lid[0], by + P.lid[1] - 6, sx, st + 26); beam(sx, st - 1, x, y + R * 0.2); _core.els.surge.style.boxShadow = '0 0 18px #ffd84a'; } else _core.els.surge.style.boxShadow = '';
      bubble(x, y, R, a, fire); if (fire) { burst(x, y + R * 0.45, 22); number(x + R + 14, y - R + 4, 27); }
    } else if (D.mode === 'B') {   // TRIO: the bubble at the top of GUARD's and STUN's column, on its own cable; the shot runs down the cable
      const x = bx + 80, y = by - 20, R = 42, s0 = [bx + 147, by + 82];
      cable(s0[0], s0[1], x + R * 0.82, y + R * 0.35, 18, fire);
      g.font = 'italic 900 12px ' + NEO; g.textAlign = 'center'; g.textBaseline = 'bottom'; g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,0.85)'; const nm = targetName(a); g.strokeText(nm, x, y - R - 8); g.fillStyle = _tgColour(a); g.fillText(nm, x, y - R - 8);
      if (fire) burst(s0[0], s0[1], 12);
      bubble(x, y, R, a, fire, true); if (fire) { burst(x + R * 0.62, y + R * 0.5, 20); number(x - R - 8, y - R + 6, 27); }
    } else if (D.mode === 'C') {   // SLABS: the creature's slab across the top, yours at the foot; the shot runs up through the surge's words into it
      const sx = bx + P.arcC[0], st = by + P.arcC[1] - P.arcR - 8 - 24, yc = by - 34;
      if (fire) { beam(bx + P.lid[0], by + P.lid[1] - 6, sx, st + 26); beam(sx, st - 1, sx, yc + 21); _core.els.surge.style.boxShadow = '0 0 18px #ffd84a'; } else _core.els.surge.style.boxShadow = '';
      const T = targetSlab(bx + 40, bx + 318, yc, 46, a, fire); if (fire) { burst(sx, yc + 8, 22); number(T.end + 18, yc - 34, 27); }
    } else if (D.mode === 'C2') {   // SLABS UNDER THE CUBE (the owner's arrow): the creature's slab between the cube and the pills, over yours; the box 56 px taller while one is locked, the cube risen; the shot runs down into it
      const yc = by + 236, cx = bx + 190;
      if (fire) beam(cx, by + 172, cx, yc - 6);
      const T = targetSlab(bx + 34, bx + 330, yc, 44, a, fire); if (fire) { burst(cx, yc + 6, 22); number(T.end + 16, yc - 32, 27); }
    }
  }
  // THE CREATURE'S SLAB, skewed as yours: its picture in a round socket at the left end, its name and level, its health, INFO, and the trigger at the right end (a tap on it shoots)
  function targetSlab(x0, x1, yc, h, a, fire) {
    const col = _tgColour(a), k = hpOf(a), w = x1 - x0, mid = (x0 + x1) / 2;
    glow(mid, yc, 20, w * 0.62, fire ? 'rgba(255,96,64,0.32)' : 'rgba(255,128,72,0.1)');
    g.save(); g.translate(mid, yc); g.transform(1, 0, -0.2126, 1, 0, 0); const gr = g.createLinearGradient(0, -h / 2, 0, h / 2); gr.addColorStop(0, '#121a34'); gr.addColorStop(1, '#05070f'); g.fillStyle = gr; g.fillRect(-w / 2, -h / 2, w, h);
    g.lineWidth = 2; g.strokeStyle = fire ? '#fff4e8' : col; g.strokeRect(-w / 2, -h / 2, w, h); g.fillStyle = col; g.fillRect(-w / 2 + 50, -h / 2 + 7, 4, h - 14); g.restore();
    const nm = targetName(a); g.font = 'italic 900 13px ' + NEO; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = col; g.fillText(nm, x0 + 62, yc - 10);
    const nw = g.measureText(nm).width; g.fillStyle = '#c8d6e8'; g.font = 'italic 900 11px ' + NEO; g.fillText(lvOf(a), x0 + 70 + nw, yc - 10);
    const bw = w - 130, bh = 9, bxx = x0 + 60; g.save(); g.translate(bxx + bw / 2, yc + 9); g.transform(1, 0, -0.2126, 1, 0, 0); g.fillStyle = 'rgba(255,255,255,0.14)'; g.fillRect(-bw / 2, -bh / 2, bw, bh);
    g.fillStyle = hpCol(k); g.fillRect(-bw / 2, -bh / 2, bw * k, bh); if (fire) { g.fillStyle = '#fff'; g.fillRect(-bw / 2 + bw * k, -bh / 2, bw * 0.12, bh); } g.restore();
    const px = x0 + 6, R = h <= 44 ? 28 : 30; g.fillStyle = '#0b1226'; g.beginPath(); g.arc(px, yc, R, 0, TAU); g.fill(); const pic = targetPortrait(a);
    if (pic) { g.save(); g.beginPath(); g.arc(px, yc, R - 4, 0, TAU); g.clip(); g.drawImage(pic, px - R + 4, yc - R + 4, (R - 4) * 2, (R - 4) * 2); if (fire) { g.fillStyle = 'rgba(255,220,200,0.35)'; g.fillRect(px - R, yc - R, R * 2, R * 2); } g.restore(); }
    g.lineWidth = 2.5; g.strokeStyle = fire ? '#fff4e8' : col; g.beginPath(); g.arc(px, yc, R, 0, TAU); g.stroke();
    const tx = x1 - 6, ty = yc, tr = 21; glow(tx, ty, 6, tr * 1.6, fire ? 'rgba(255,80,50,0.7)' : 'rgba(255,80,50,0.25)'); g.fillStyle = fire ? '#ff4a3a' : '#0b1226'; g.beginPath(); g.arc(tx, ty, tr, 0, TAU); g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#ff4a3a'; g.stroke();
    g.strokeStyle = fire ? '#fff' : '#ff6a50'; g.lineWidth = 2.2; g.beginPath(); g.arc(tx, ty, 9, 0, TAU); g.moveTo(tx - 15, ty); g.lineTo(tx - 5, ty); g.moveTo(tx + 5, ty); g.lineTo(tx + 15, ty); g.moveTo(tx, ty - 15); g.lineTo(tx, ty - 5); g.moveTo(tx, ty + 5); g.lineTo(tx, ty + 15); g.stroke();
    const ix = x1 - 44, iy = yc - 13; g.fillStyle = '#0b1226'; g.beginPath(); g.arc(ix, iy, 9, 0, TAU); g.fill(); g.lineWidth = 1.6; g.strokeStyle = '#8fe3ff'; g.stroke(); g.fillStyle = '#8fe3ff'; g.font = 'italic 900 11px ' + NEO; g.textAlign = 'center'; g.fillText('i', ix, iy + 1);
    return { end: bxx + bw * k };
  }
  // C2's box: 56 px taller while a creature is locked (the cube, its arc and buttons risen; the pills and your slab at the foot)
  D.setBox = on => { _core.root.style.height = on ? '356px' : ''; CORE_HUD.pills[1] = on ? 285 : 229; _core.topY = 0; };
  // the old dial is not drawn (the pills still are: js/targeting.js _tgPillsInCore); the overlay after every frame's HUD
  const realDial = window._tgDialDraw; window._tgDialDraw = function (a, f) { if (!D.mode) return realDial(a, f); _tgPillsInCore(); _tgDial = null; };
  const realUI = window.drawTargetUI; window.drawTargetUI = function () { realUI(); draw(); };
  // its face looks at the bubble (and sets its look to fire)
  const realPick = window._corePick; window._corePick = function (S, f) { const F = realPick(S, f), on = D.mode && targetCurrent();
    if (on && !S.surging && !S.ready && !S.armed) { if (D.mode === 'B') { F.lx = -0.8; F.ly = -0.55; } else if (D.mode === 'C2') { F.lx = 0; F.ly = 0.85; } else { F.lx = 0; F.ly = -0.9; } if (D.fire) { F.eye = 'set'; F.flash = 'rgba(255,240,200,0.18)'; } }
    return F; };
  return true;
}

(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'coretg-')), file = path.join(dir, 'game.html');
  fs.writeFileSync(file, fs.readFileSync(path.join(ROOT, 'game.html'), 'utf8').replace(/<head>/i, '<head><base href="file://' + ROOT + '/">'));
  const b = await chromium.launch({ args: ['--allow-file-access-from-files'] });
  const p = await b.newPage({ viewport: { width: VW, height: VH }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(String(e.message)));
  await p.goto('file://' + file + '?dev'); await p.waitForTimeout(2500);
  // the arena, powered; the squad by the tanks; a beetle tank locked and still (as the game bible's picture of the HUD)
  await p.evaluate(async () => {
    const wait = ms => new Promise(r => setTimeout(r, ms));
    if (!(typeof facilityPlay !== 'undefined' && facilityPlay)) facilityPlayStart(); await wait(200);
    gameState.running = true; crystalMenuOpen = false; _fp.gfxSaved = 'high'; gfxLow = false; if (typeof classPickerClose === 'function') classPickerClose(); classPickerOpen = false;
    _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; if (typeof dialogueClear === 'function') dialogueClear();
    facilityBlackoutSet(false); for (const r of _fp.F.relays) { try { _fp.relays[r.id].online = true; for (const room of r.powers) facilityPower(room, true); } catch (e) {} }
    shardCount = 5859; playerUltimate = PLAYER_ULT_MAX * 0.42; playerInv = { repair_kit: 2, ammo_pack: 1, sleeping_potion: 2 }; if (typeof potionEquip === 'function') potionEquip('sleeping_potion');
    await document.fonts.ready;
    const near = (x, y) => { const F = _fp.F; if (facilityWalkable(x, y, F)) return [x, y]; for (let d = 0.5; d < 8; d += 0.5) for (let t = 0; t < 16; t++) { const qx = x + Math.cos(t * Math.PI / 8) * d, qy = y + Math.sin(t * Math.PI / 8) * d; if (facilityWalkable(qx, qy, F)) return [qx, qy]; } return [x, y]; };
    const [x, y] = near(30, 50); floatingTexts.length = 0; _fp.portalCool = frame + 1e6; player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; player.invuln = 1e9;
    partyMembers().forEach((f, i) => { const q = near(x + 1 + (i % 2), y + 0.6 + i * 0.5); f.x = f.targetX = f.visualX = q[0]; f.y = f.targetY = f.visualY = q[1]; f.fpPath = null; });
    actors = actors.filter(a => !(a instanceof Predator));
    const e = spawnCreature({ species: 'beetle', className: 'tank' }), q = near(player.x + 4, player.y - 1); e.x = q[0]; e.y = q[1]; e.state = 'wander'; e.provoked = false; e.moveSpeed = 0; e.baseMoveSpeed = 0;
    e.health = e.maxHealth * 0.72; targetSet(e, true); window.__foe = e; floatingTexts.length = 0; selectedUnits.clear(); partyTick(); mixToolRender(true);
    for (let i = 0; i < 30; i++) render();
  });
  const crop = { x: VW - 560, y: VH - 500, width: 560, height: 500 };
  const shot = async (name, setup) => { await p.evaluate(s => { (new Function(s))(); for (let i = 0; i < 8; i++) render(); floatingTexts.length = 0; render(); }, setup || ''); await p.waitForTimeout(120);
    await p.screenshot({ path: path.join(OUT, name + '.png'), clip: crop }); };
  await shot('now');
  await p.screenshot({ path: path.join(OUT, 'now_screen.png') });
  await p.evaluate(install);
  for (const m of ['A', 'B', 'C']) {
    await shot(m + '_locked', `__D.mode = '${m}'; __D.fire = 0; __foe.health = __foe.maxHealth * 0.72; _coreDrawn.faceKey = '';`);
    await shot(m + '_firing', `__D.fire = 1; __foe.health = __foe.maxHealth * 0.6; _coreDrawn.faceKey = '';`);
    await p.screenshot({ path: path.join(OUT, m + '_screen.png') });
  }
  // C2: the slab under the cube; then NONE (the creature gone: THE CORE back to its size)
  await shot('C2_locked', `_core.els.surge.style.boxShadow = ''; __D.mode = 'C2'; __D.fire = 0; __D.setBox(true); __foe.health = __foe.maxHealth * 0.72; _coreDrawn.faceKey = '';`);
  await shot('C2_firing', `__D.fire = 1; __foe.health = __foe.maxHealth * 0.6; _coreDrawn.faceKey = '';`);
  await p.screenshot({ path: path.join(OUT, 'C2_screen.png') });
  await shot('C2_none', `__D.fire = 0; __foe.dead = true; targetDrop(); standDown = true; __D.setBox(false); _coreDrawn.faceKey = '';`);
  console.log(JSON.stringify({ out: OUT, errs: errs.slice(0, 5) }));
  await b.close(); fs.rmSync(dir, { recursive: true, force: true });
  // the review sheet: NOW, then each draft LOCKED | FIRING, titled
  try {
    const t = (src, label, dst) => execFileSync('convert', [path.join(OUT, src), '-gravity', 'North', '-background', '#0b0f1a', '-splice', '0x64', '-fill', '#e8fff9', '-pointsize', '34', '-gravity', 'NorthWest', '-annotate', '+22+14', label, path.join(OUT, dst)]);
    t('now.png', 'NOW (build 11u): the bubble floats above', 't_now.png');
    const rows = [['A', 'A  CROWN'], ['B', 'B  TRIO'], ['C', 'C  SLABS']].map(([m, n]) => { t(m + '_locked.png', n + ': LOCKED', 't_' + m + '1.png'); t(m + '_firing.png', n + ': FIRING', 't_' + m + '2.png'); return ['t_' + m + '1.png', 't_' + m + '2.png']; });
    for (const [i, r] of rows.entries()) execFileSync('convert', r.map(f => path.join(OUT, f)).concat(['+append', path.join(OUT, 'row' + i + '.png')]));
    execFileSync('convert', [path.join(OUT, 'row0.png'), path.join(OUT, 'row1.png'), path.join(OUT, 'row2.png'), '-append', '-resize', '50%', path.join(OUT, 'sheet.png')]);
    console.log('sheet: ' + path.join(OUT, 'sheet.png'));
    t('C2_locked.png', 'C2  SLAB UNDER THE CUBE: LOCKED', 't_C21.png'); t('C2_firing.png', 'C2: FIRING', 't_C22.png'); t('C2_none.png', 'C2: NOTHING LOCKED', 't_C23.png');
    execFileSync('convert', ['t_C21.png', 't_C22.png', 't_C23.png'].map(f => path.join(OUT, f)).concat(['+append', '-resize', '50%', path.join(OUT, 'sheet_c2.png')]));
    console.log('sheet: ' + path.join(OUT, 'sheet_c2.png'));
  } catch (e) { console.log('no sheet (ImageMagick?): ' + e.message.split('\n')[0]); }
})();
