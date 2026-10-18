// node design/roster-poster/portraits.js <dir> && node design/roster-poster/roster-all.js <dir> <out.png> : EVERY creature in the game on one "neo-future fighting game" select sheet
// (the style of poster.js / docs/UI-STYLE.md): the player, the follower egg in each element, the evolved forms (the baked 3D sheets in img/evo), the six predator species in every
// class (your clones are these), and the machines. Portraits of the things the game draws itself come from portraits.js (the game's own drawing code); the evolved forms are the sprite sheets.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../..'), DIR = process.argv[2], OUT = process.argv[3] || 'roster-all.png';
const meta = JSON.parse(fs.readFileSync(path.join(DIR, 'meta.json'), 'utf8'));
const b64 = f => 'data:image/png;base64,' + fs.readFileSync(f).toString('base64');
const IM = {};
for (const f of fs.readdirSync(DIR)) if (f.endsWith('.png')) IM['p:' + f.replace('.png', '')] = b64(path.join(DIR, f));
const forms = meta.forms.filter(f => !f.legacy);
for (const f of forms) { IM['e:' + f.id] = b64(path.join(ROOT, 'img/evo', f.id + '.png')); const g = path.join(ROOT, 'img/evo', f.id + '_g.png'); if (fs.existsSync(g)) IM['e:' + f.id + '_g'] = b64(g); }
const EL = [
  { id: 'fire', label: 'FIRE', col: '#ff4a1c' }, { id: 'electric', label: 'ELECTRIC', col: '#ffe733' }, { id: 'flux', label: 'FLUX', col: '#a64dff' },
  { id: 'core', label: 'CORE', col: '#19e6c1' }, { id: 'toxic', label: 'TOXIC', col: '#6dff5a' }, { id: 'ice', label: 'ICE', col: '#8fe3ff' },
];
const ROLES = [{ id: 'brawler', label: 'BRAWLER' }, { id: 'mage', label: 'MAGE' }, { id: 'worker', label: 'WORKER' }, { id: 'technician', label: 'TECHNICIAN' }];
const SPECIES = [['ant', 'ANT', '#aa55ff'], ['beetle', 'BEETLE', '#cc44ff'], ['scorpion', 'SCORPION', '#8844ff'], ['spider', 'SPIDER', '#ff3355'], ['mantis', 'MANTIS', '#44dd55'], ['moth', 'MOTH', '#ff9a22']];
const CLASSES = [['nymph', 'NYMPH'], ['worker', 'WORKER'], ['scout', 'SCOUT'], ['striker', 'STRIKER'], ['tank', 'TANK'], ['boss', 'BOSS']];
const W = 2600, H = 4600;
const page = `<!doctype html><body style="margin:0;background:#04060b"><canvas id=c width=${W} height=${H}></canvas><script>
const EL=${JSON.stringify(EL)}, ROLES=${JSON.stringify(ROLES)}, FORMS=${JSON.stringify(forms)}, META=${JSON.stringify(meta)}, SPECIES=${JSON.stringify(SPECIES)}, CLASSES=${JSON.stringify(CLASSES)}, IM_SRC=${JSON.stringify(IM)}, W=${W}, H=${H};
const L = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
(async () => {
  const cv = document.getElementById('c'), g = cv.getContext('2d');
  const im = {}; for (const k of Object.keys(IM_SRC)) im[k] = await L(IM_SRC[k]);
  const F = (w, s) => w + ' ' + s + 'px "DejaVu Sans", sans-serif', MONO = (w, s) => w + ' ' + s + 'px "DejaVu Sans Mono", monospace';
  // the bounding box of what a portrait actually drew, so every creature fills its card the same way
  const bboxCache = {};
  const bbox = (k, img, sx, sy, sw, sh) => { const key = k + sx + sy; if (bboxCache[key]) return bboxCache[key]; const c = document.createElement('canvas'); c.width = sw; c.height = sh; const x = c.getContext('2d'); x.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);
    const d = x.getImageData(0, 0, sw, sh).data; let x0 = sw, y0 = sh, x1 = 0, y1 = 0; for (let y = 0; y < sh; y++) for (let xx = 0; xx < sw; xx++) if (d[(y * sw + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    return bboxCache[key] = x1 < x0 ? { x: 0, y: 0, w: sw, h: sh } : { x: x0, y: y0, w: x1 - x0 + 1, h: y1 - y0 + 1 }; };
  // draw a picture fitted into the box (bx, by, bw, bh), bottom-centred, never bigger than maxScale
  const fit = (k, img, sx, sy, sw, sh, bx, by, bw, bh, maxS, glow) => { const bb = bbox(k, img, sx, sy, sw, sh), s = Math.min(bw / bb.w, bh / bb.h, maxS || 6), dw = bb.w * s, dh = bb.h * s;
    g.save(); g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; if (glow) { g.shadowColor = glow; g.shadowBlur = 26; } g.drawImage(img, sx + bb.x, sy + bb.y, bb.w, bb.h, bx + (bw - dw) / 2, by + bh - dh, dw, dh); g.restore(); };
  // background
  let bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#070b16'); bg.addColorStop(0.5, '#0a0f1f'); bg.addColorStop(1, '#050810'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.07; g.strokeStyle = '#7fb4ff'; g.lineWidth = 1.5; const hr = 46;
  for (let y = -hr; y < H + hr; y += hr * 1.5) for (let x = -hr; x < W + hr; x += hr * 1.732) { const ox = (Math.round(y / (hr * 1.5)) % 2) ? hr * 0.866 : 0; g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 3 * k + Math.PI / 6; const px = x + ox + hr * Math.cos(a), py = y + hr * Math.sin(a); k ? g.lineTo(px, py) : g.moveTo(px, py); } g.closePath(); g.stroke(); } g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 14; i++) { const x = (i * 477) % W - 100, w = 220 + (i * 97) % 260, c = ['#2a6bff', '#19e6c1', '#a64dff', '#ff4a1c'][i % 4]; g.globalAlpha = 0.045; g.fillStyle = c; g.beginPath(); g.moveTo(x, H); g.lineTo(x + w, H); g.lineTo(x + w + 700, 0); g.lineTo(x + 700, 0); g.closePath(); g.fill(); } g.restore();
  const card = (cx, cy, w, h, cut) => { cut = cut || 28; g.beginPath(); g.moveTo(cx + cut, cy); g.lineTo(cx + w, cy); g.lineTo(cx + w - cut, cy + h); g.lineTo(cx, cy + h); g.lineTo(cx, cy + cut); g.closePath(); };
  const slabTitle = (text, x, y, col, sub) => { g.save(); g.font = F('italic 900', 64); g.fillStyle = col; g.shadowColor = col; g.shadowBlur = 24; g.fillText(text, x, y); g.restore(); if (sub) { g.font = MONO('700', 26); g.fillStyle = '#8aa0c8'; g.fillText(sub, x + 6, y + 40); } g.fillStyle = col; g.save(); g.transform(1, 0, -0.4, 1, 0, 0); g.fillRect(x + 40, y + 62, W - 2 * x - 40, 4); g.restore(); };
  const nameplate = (x, y, w, h, name, sub, col, big) => { g.save(); card(x, y, w, h); g.clip(); const py = y + h - (big ? 92 : 74); const pg = g.createLinearGradient(x, py, x, y + h); pg.addColorStop(0, 'rgba(5,8,16,0)'); pg.addColorStop(0.35, 'rgba(5,8,16,0.9)'); pg.addColorStop(1, 'rgba(5,8,16,0.98)'); g.fillStyle = pg; g.fillRect(x, py - 10, w, 110);
    g.fillStyle = col; g.fillRect(x, y + h - (big ? 74 : 58), 8, big ? 52 : 40); let fs = big ? 38 : 30; g.font = F('italic 900', fs); while (g.measureText(name).width > w - 60 && fs > 18) { fs -= 2; g.font = F('italic 900', fs); }
    g.fillStyle = '#fff'; g.shadowColor = col; g.shadowBlur = 10; g.fillText(name, x + 24, y + h - (big ? 40 : 30)); g.shadowBlur = 0; g.font = MONO('700', big ? 20 : 17); g.fillStyle = col; let ss = sub; while (g.measureText(ss).width > w - 50 && ss.length > 6) ss = ss.slice(0, -2); g.fillText(ss, x + 24, y + h - (big ? 14 : 9)); g.restore(); };
  const frame = (x, y, w, h, col) => { g.save(); card(x, y, w, h); g.lineWidth = 3; g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 16; g.stroke(); g.restore(); };
  const wash = (x, y, w, h, col) => { g.save(); card(x, y, w, h); const cg = g.createLinearGradient(x, y, x, y + h); cg.addColorStop(0, '#0f1730'); cg.addColorStop(0.55, '#0a1022'); cg.addColorStop(1, '#05070f'); g.fillStyle = cg; g.fill(); g.clip();
    const rg = g.createRadialGradient(x + w / 2, y + h * 0.58, 10, x + w / 2, y + h * 0.58, w * 0.62); rg.addColorStop(0, col + '66'); rg.addColorStop(0.6, col + '18'); rg.addColorStop(1, col + '00'); g.fillStyle = rg; g.fillRect(x, y, w, h);
    g.globalAlpha = 0.1; g.strokeStyle = col; g.lineWidth = 3; for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(x + k * 52 - 40, y + h); g.lineTo(x + k * 52 + 140, y); g.stroke(); } g.restore(); };
  const tag = (x, y, text, col) => { g.save(); g.font = F('italic 900', 20); const tw = g.measureText(text).width + 26; g.fillStyle = col; g.beginPath(); g.moveTo(x + 10, y); g.lineTo(x + 10 + tw, y); g.lineTo(x + tw, y + 26); g.lineTo(x, y + 26); g.closePath(); g.fill(); g.fillStyle = '#05070f'; g.fillText(text, x + 14, y + 21); g.restore(); };

  // ── TITLE ──
  g.save(); g.font = F('italic 900', 150); g.fillStyle = '#0b1226'; g.fillText('CONDUIT', 112, 192); const tg = g.createLinearGradient(100, 80, 100, 200); tg.addColorStop(0, '#fff'); tg.addColorStop(0.5, '#9fe8ff'); tg.addColorStop(1, '#19e6c1'); g.shadowColor = '#19e6c1'; g.shadowBlur = 30; g.fillStyle = tg; g.fillText('CONDUIT', 108, 188); g.restore();
  g.font = MONO('700', 40); g.fillStyle = '#8aa0c8'; g.fillText('THE WHOLE ROSTER', 108, 238);
  const total = 1 + 6 + FORMS.length + SPECIES.length * CLASSES.length + 2; g.textAlign = 'right'; g.font = F('italic 900', 110); g.fillStyle = '#fff'; g.shadowColor = '#2a6bff'; g.shadowBlur = 30; g.fillText(String(total), W - 110, 180); g.shadowBlur = 0; g.font = MONO('700', 30); g.fillStyle = '#8aa0c8'; g.fillText('CREATURES IN THE GAME', W - 110, 228); g.textAlign = 'left';
  g.fillStyle = '#19e6c1'; g.save(); g.transform(1, 0, -0.4, 1, 0, 0); g.fillRect(150, 262, W - 300, 5); g.restore();

  // ── A: THE CREW (the player, the egg in six elements) ──
  let Y = 330; slabTitle('THE CREW', 112, Y + 50, '#19e6c1', 'YOU, AND THE EGG EVERY FOLLOWER STARTS AS (IT SHEDS AT LEVEL 10)'); Y += 120;
  { const CW = 320, CH = 340, GAP = 20, X0 = 150; const cards = [['player', 'THE PLAYER', 'THE CIRCUIT RUNNER', '#19e6c1', 'YOU']].concat(EL.map(e => ['egg_' + e.id, e.label + ' EGG', 'FOLLOWER \\u00b7 LV 1-9', e.col, 'EGG']));
    cards.forEach((c, i) => { const x = X0 + i * (CW + GAP), y = Y; wash(x, y, CW, CH, c[3]); const img = im['p:' + c[0]]; fit(c[0], img, 0, 0, 360, 360, x + 30, y + 40, CW - 60, CH - 150, 4.2, c[3]); nameplate(x, y, CW, CH, c[1], c[2], c[3], false); tag(x + 36, y + 14, c[4], c[3]); frame(x, y, CW, CH, c[3]); }); }
  Y += 340 + 70;

  // ── B: THE EVOLUTIONS ──
  slabTitle('EVOLUTIONS', 112, Y + 50, '#a64dff', 'A FOLLOWER SHEDS ITS EGG AT LEVEL 10 AND BECOMES ONE OF THESE, BY ELEMENT AND ROLE'); Y += 175;
  { const X0 = 150, CW = 372, CH = 330, GX = 22, GY = 20; const byKey = {}; FORMS.forEach(f => { byKey[f.element + '/' + f.role] = f; });
    ROLES.forEach((r, ri) => { const y = Y + ri * (CH + GY); g.save(); g.translate(112, y + CH / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.font = F('italic 900', 34); g.fillStyle = '#6a7aa0'; g.fillText(r.label, 0, 0); g.restore(); });
    EL.forEach((e, ei) => { const x = X0 + ei * (CW + GX); g.save(); g.font = F('italic 900', 40); g.fillStyle = e.col; g.shadowColor = e.col; g.shadowBlur = 20; g.fillText(e.label, x + 8, Y - 16); g.restore();
      ROLES.forEach((r, ri) => { const y = Y + ri * (CH + GY), f = byKey[e.id + '/' + r.id];
        if (f) { wash(x, y, CW, CH, e.col); g.save(); card(x, y, CW, CH); g.clip(); const S = 144; const ig = im['e:' + f.id + '_g']; if (ig) fit(f.id + 'g', ig, 0, 2 * S, S, S, x + 30, y + 30, CW - 60, CH - 120, 2.4, null); fit(f.id, im['e:' + f.id], 0, 2 * S, S, S, x + 30, y + 30, CW - 60, CH - 120, 2.4, e.col); g.restore(); nameplate(x, y, CW, CH, f.name, '\\u25b8 ' + f.move, e.col, true); tag(x + 40, y + 14, r.label, e.col); frame(x, y, CW, CH, e.col); }
        else { g.save(); card(x, y, CW, CH); g.fillStyle = 'rgba(14,20,38,0.55)'; g.fill(); g.setLineDash([14, 10]); g.lineWidth = 2.5; g.strokeStyle = '#3a4a70'; g.stroke(); g.setLineDash([]); g.font = F('italic 900', 120); g.textAlign = 'center'; g.fillStyle = '#1a2441'; g.fillText('?', x + CW / 2, y + CH / 2 + 44); g.font = MONO('700', 22); g.fillStyle = '#4b5d88'; g.fillText(r.id === 'technician' ? 'ROLE ON HOLD' : 'IN DEVELOPMENT', x + CW / 2, y + CH - 34); g.restore(); } }); }); }
  Y += 4 * (330 + 20) + 50;

  // ── C: THE COLONY ──
  slabTitle('THE COLONY', 112, Y + 50, '#ff4a1c', 'SIX PREDATOR SPECIES, SIX CLASSES EACH: THEY HUNT YOU, AND YOUR CLONES ARE MADE FROM THEM (SPLICES OF THESE)'); Y += 175;
  { const X0 = 150, CW = 372, CH = 214, GX = 22, GY = 14;
    CLASSES.forEach((c, ci) => { const y = Y + ci * (CH + GY); g.save(); g.translate(112, y + CH / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.font = F('italic 900', 28); g.fillStyle = '#6a7aa0'; g.fillText(c[1], 0, 0); g.restore(); });
    SPECIES.forEach((sp, si) => { const x = X0 + si * (CW + GX); g.save(); g.font = F('italic 900', 40); g.fillStyle = sp[2]; g.shadowColor = sp[2]; g.shadowBlur = 20; g.fillText(sp[1], x + 8, Y - 16); g.restore();
      CLASSES.forEach((c, ci) => { const y = Y + ci * (CH + GY), d = META.species[sp[0]].classes[c[0]], id = sp[0] + '_' + c[0], boss = c[0] === 'boss';
        wash(x, y, CW, CH, sp[2]); fit(id, im['p:' + id], 0, 0, 360, 360, x + 24, y + 22, CW - 48, CH - 84, boss ? 2.2 : 3.2, sp[2]);
        nameplate(x, y, CW, CH, sp[1] + ' ' + c[1], 'HP ' + d.hp + '  \\u00b7  PWR ' + d.power + (d.special ? '  \\u00b7  RANGED ' + d.range : ''), sp[2], false); tag(x + 36, y + 12, c[1], sp[2]); frame(x, y, CW, CH, boss ? '#ffe733' : sp[2]); }); }); }
  Y += 6 * (214 + 14) + 40;

  // ── D: THE MACHINES ──
  slabTitle('MACHINES', 112, Y + 50, '#8fe3ff', 'WHAT THE THIEVES BUILD WITH THE SHARDS THEY STEAL AT A NEST'); Y += 120;
  { const CW = 500, CH = 300, X0 = 150; ['sentry', 'strider'].forEach((k, i) => { const x = X0 + i * (CW + 30), y = Y, m = META.machines[k]; wash(x, y, CW, CH, '#8fe3ff'); fit('m' + k, im['p:machine_' + k], 0, 0, 360, 360, x + 40, y + 24, CW - 80, CH - 110, 3, '#8fe3ff');
      nameplate(x, y, CW, CH, m.label, 'HP ' + m.hp + '  \\u00b7  PWR ' + m.power + (k === 'sentry' ? '  \\u00b7  BOLTED DOWN' : '  \\u00b7  DRAINS SHARDS'), '#8fe3ff', true); tag(x + 36, y + 14, 'MACHINE', '#8fe3ff'); frame(x, y, CW, CH, '#8fe3ff'); }); }
  g.font = MONO('700', 26); g.fillStyle = '#5d7096'; g.fillText('THE PLAYER AND THE EGG ARE 3D SPRITES NOW, LIKE THE EVOLUTIONS ABOVE', 150, H - 50);
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  window.__endY = Y; document.title = 'done';
})();
</script></body>`;
(async () => {
  const b = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: W, height: 1200 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setContent(page); await p.waitForFunction(() => document.title === 'done', null, { timeout: 120000 });
  await p.locator('#c').screenshot({ path: OUT }); console.log('end of content y =', await p.evaluate(() => window.__endY), 'of', H, errs.slice(0, 3)); await b.close();
})();
