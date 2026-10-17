// node design/roster-poster/poster.js <out.png> : the current evolution roster as a "neo-future fighting game" select screen (needs playwright + chromium).
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '../..');
const EL = [
  { id: 'fire', label: 'FIRE', col: '#ff4a1c' }, { id: 'electric', label: 'ELECTRIC', col: '#ffe733' }, { id: 'flux', label: 'FLUX', col: '#a64dff' },
  { id: 'core', label: 'CORE', col: '#19e6c1' }, { id: 'toxic', label: 'TOXIC', col: '#6dff5a' }, { id: 'ice', label: 'ICE', col: '#8fe3ff' },
];
const ROLES = [{ id: 'brawler', label: 'BRAWLER' }, { id: 'mage', label: 'MAGE' }, { id: 'worker', label: 'WORKER' }, { id: 'technician', label: 'TECHNICIAN' }];
const FIGHTERS = {
  'fire/brawler': { id: 'quillstone', name: 'QUILLSTONE', move: 'QUILL BURST' },
  'fire/mage': { id: 'embercowl', name: 'EMBER HOOD', move: 'HEXFIRE' },
  'electric/brawler': { id: 'voltring', name: 'VOLT RING', move: 'STATIC RUSH', note: 'PLACEHOLDER' },
  'electric/mage': { id: 'thunderhead', name: 'THUNDERHEAD', move: 'ARC VOLLEY' },
  'electric/worker': { id: 'pod', name: 'DYNAMO POD', move: 'RAPID DISCHARGE' },
  'flux/brawler': { id: 'mimic', name: 'RIFT MIMIC', move: 'GRAVITY SLAM', ground: true },
  'flux/mage': { id: 'serpent', name: 'SERPENT', move: 'SINGULARITY SHOT' },
  'flux/worker': { id: 'hauler', name: 'HOVER HAULER', move: 'HEAVY HAUL' },
  'core/brawler': { id: 'hammerslug', name: 'HAMMER SLUG', move: 'AEGIS BURST' },
  'core/mage': { id: 'hornshell', name: 'HORNSHELL', move: 'AEGIS BLOOM' },
  'core/worker': { id: 'vessel', name: 'WORM VESSEL', move: 'REWIRE' },
  'toxic/brawler': { id: 'seeper', name: 'SEEPER', move: 'ERUPTION', ground: true },
  'toxic/mage': { id: 'rotshard', name: 'ROTSHARD', move: 'CORRODE SHOT' },
  'ice/brawler': { id: 'maw', name: 'FROST MAW', move: 'CHOMP', ground: true },
};
const have = new Set(['rotshard', 'mimic', 'maw', 'seeper']);
const rd = f => 'data:image/png;base64,' + fs.readFileSync(path.join(ROOT, 'img/evo', f)).toString('base64');
const imgs = {};
for (const f of Object.values(FIGHTERS)) { imgs[f.id] = rd(f.id + '.png'); if (f.ground && fs.existsSync(path.join(ROOT, 'img/evo', f.id + '_g.png'))) imgs[f.id + '_g'] = rd(f.id + '_g.png'); }
const page = `<!doctype html><body style="margin:0;background:#04060b"><canvas id=c width=2600 height=2040></canvas><script>
const EL=${JSON.stringify(EL)}, ROLES=${JSON.stringify(ROLES)}, FIGHTERS=${JSON.stringify(FIGHTERS)}, IM=${JSON.stringify(imgs)};
const L = s => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = s; });
(async () => {
  const cv = document.getElementById('c'), g = cv.getContext('2d'), W = cv.width, H = cv.height;
  const im = {}; for (const k of Object.keys(IM)) im[k] = await L(IM[k]);
  // background: deep navy, a hex grid, light streaks, vignette
  let bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#070b16'); bg.addColorStop(0.5, '#0a0f1f'); bg.addColorStop(1, '#050810'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.07; g.strokeStyle = '#7fb4ff'; g.lineWidth = 1.5; const hr = 46;
  for (let y = -hr; y < H + hr; y += hr * 1.5) for (let x = -hr; x < W + hr; x += hr * 1.732) { const ox = (Math.round(y / (hr * 1.5)) % 2) ? hr * 0.866 : 0; g.beginPath(); for (let k = 0; k < 6; k++) { const a = Math.PI / 6 + k * Math.PI / 3; g.lineTo(x + ox + Math.cos(a) * hr, y + Math.sin(a) * hr); } g.closePath(); g.stroke(); } g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; for (const [x, w, c, a] of [[-200, 380, '#2a6bff', 0.09], [700, 260, '#19e6c1', 0.06], [1500, 420, '#a64dff', 0.08], [2200, 300, '#ff4a1c', 0.06]]) { g.save(); g.translate(x, 0); g.transform(1, 0, -0.55, 1, 0, 0); const sg = g.createLinearGradient(0, 0, w, 0); sg.addColorStop(0, 'rgba(0,0,0,0)'); sg.addColorStop(0.5, c); sg.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = sg; g.fillRect(0, 0, w, H); g.restore(); } g.restore();
  // title
  g.save(); g.font = 'italic 900 150px "DejaVu Sans", sans-serif'; g.textBaseline = 'alphabetic'; g.fillStyle = '#0b1226'; g.fillText('CONDUIT', 112, 192);
  const tg = g.createLinearGradient(100, 80, 100, 200); tg.addColorStop(0, '#ffffff'); tg.addColorStop(0.5, '#9fe8ff'); tg.addColorStop(1, '#19e6c1'); g.shadowColor = '#19e6c1'; g.shadowBlur = 36; g.fillStyle = tg; g.fillText('CONDUIT', 100, 180); g.restore();
  g.font = 'italic 700 40px "DejaVu Sans Mono", monospace'; g.fillStyle = '#8aa0c8'; g.fillText('EVOLUTION ROSTER', 108, 238);
  const n = Object.keys(FIGHTERS).length; g.textAlign = 'right'; g.font = 'italic 900 110px "DejaVu Sans", sans-serif'; g.fillStyle = '#ffffff'; g.shadowColor = '#2a6bff'; g.shadowBlur = 30; g.fillText(n + ' / 24', W - 110, 178); g.shadowBlur = 0;
  g.font = '700 30px "DejaVu Sans Mono", monospace'; g.fillStyle = '#8aa0c8'; g.fillText('FIGHTERS UNLOCKED', W - 110, 228); g.textAlign = 'left';
  // slash under the title
  g.fillStyle = '#19e6c1'; g.save(); g.transform(1, 0, -0.4, 1, 0, 0); g.fillRect(150, 262, W - 300, 5); g.restore();
  // grid
  const X0 = 150, Y0 = 330, CW = 372, CH = 360, GX = 22, GY = 22, SK = -0.14;
  const card = (cx, cy, w, h, path) => { g.beginPath(); g.moveTo(cx - SK * h * 0 + 28, cy); g.lineTo(cx + w, cy); g.lineTo(cx + w - 28, cy + h); g.lineTo(cx, cy + h); g.lineTo(cx, cy + 28); g.closePath(); };
  // role labels down the left
  ROLES.forEach((r, ri) => { const y = Y0 + ri * (CH + GY); g.save(); g.translate(112, y + CH / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.font = 'italic 900 34px "DejaVu Sans", sans-serif'; g.fillStyle = '#5d7096'; g.fillText(r.label, 0, 0); g.restore(); });
  EL.forEach((e, ei) => {
    const x = X0 + ei * (CW + GX);
    // element header
    g.save(); g.font = 'italic 900 46px "DejaVu Sans", sans-serif'; g.textAlign = 'left'; g.shadowColor = e.col; g.shadowBlur = 22; g.fillStyle = e.col; g.fillText(e.label, x + 8, Y0 - 24); g.restore();
    ROLES.forEach((r, ri) => {
      const y = Y0 + ri * (CH + GY), key = e.id + '/' + r.id, F = FIGHTERS[key];
      g.save(); card(x, y, CW, CH);
      if (F) {
        const cg = g.createLinearGradient(x, y, x, y + CH); cg.addColorStop(0, '#0f1730'); cg.addColorStop(0.55, '#0a1022'); cg.addColorStop(1, '#05070f'); g.fillStyle = cg; g.fill();
        g.save(); g.clip(); const rg = g.createRadialGradient(x + CW / 2, y + CH * 0.58, 10, x + CW / 2, y + CH * 0.58, CW * 0.62); rg.addColorStop(0, e.col + '66'); rg.addColorStop(0.6, e.col + '18'); rg.addColorStop(1, e.col + '00'); g.fillStyle = rg; g.fillRect(x, y, CW, CH);
        // diagonal speed lines
        g.globalAlpha = 0.10; g.strokeStyle = e.col; g.lineWidth = 3; for (let k = 0; k < 9; k++) { g.beginPath(); g.moveTo(x + k * 52 - 40, y + CH); g.lineTo(x + k * 52 + 140, y); g.stroke(); } g.globalAlpha = 1;
        // the sprite: idle frame 0, row 2 (facing the camera), 144px cells scaled up
        g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high'; const S = 2.35, sw = 144 * S, sx = x + CW / 2 - sw / 2 + 4, sy = y + CH * 0.52 - 114 * S + 70;
        if (im[F.id + '_g']) g.drawImage(im[F.id + '_g'], 0, 2 * 144, 144, 144, sx, sy, sw, sw);
        g.shadowColor = e.col; g.shadowBlur = 26; g.drawImage(im[F.id], 0, 2 * 144, 144, 144, sx, sy, sw, sw); g.shadowBlur = 0; g.restore();
        // name plate
        g.save(); card(x, y, CW, CH); g.clip(); const py = y + CH - 92; const pg = g.createLinearGradient(x, py, x, y + CH); pg.addColorStop(0, 'rgba(5,8,16,0.0)'); pg.addColorStop(0.35, 'rgba(5,8,16,0.88)'); pg.addColorStop(1, 'rgba(5,8,16,0.98)'); g.fillStyle = pg; g.fillRect(x, py - 10, CW, 110);
        g.fillStyle = e.col; g.fillRect(x, y + CH - 74, 8, 52);
        let fs = 38; g.font = 'italic 900 ' + fs + 'px "DejaVu Sans", sans-serif'; while (g.measureText(F.name).width > CW - 70 && fs > 24) { fs -= 2; g.font = 'italic 900 ' + fs + 'px "DejaVu Sans", sans-serif'; } g.fillStyle = '#ffffff'; g.shadowColor = e.col; g.shadowBlur = 10; g.fillText(F.name, x + 24, y + CH - 40); g.shadowBlur = 0;
        g.font = '700 20px "DejaVu Sans Mono", monospace'; g.fillStyle = e.col; g.fillText('▸ ' + F.move, x + 24, y + CH - 14); g.restore();
        // role tag top-left
        g.save(); g.font = 'italic 900 20px "DejaVu Sans Mono", monospace'; const tw = g.measureText(r.label).width + 26; g.fillStyle = e.col; g.beginPath(); g.moveTo(x + 40, y + 14); g.lineTo(x + 40 + tw, y + 14); g.lineTo(x + 40 + tw - 10, y + 40); g.lineTo(x + 30, y + 40); g.closePath(); g.fill(); g.fillStyle = '#05070f'; g.fillText(r.label, x + 46, y + 34); g.restore();
        if (F.note) { g.save(); g.font = '900 17px "DejaVu Sans Mono", monospace'; g.fillStyle = '#ffb347'; g.textAlign = 'right'; g.fillText(F.note, x + CW - 40, y + 32); g.restore(); }
        // border
        g.save(); card(x, y, CW, CH); g.lineWidth = 3; g.strokeStyle = e.col; g.shadowColor = e.col; g.shadowBlur = 18; g.stroke(); g.restore();
      } else {
        g.fillStyle = 'rgba(14,20,38,0.55)'; g.fill(); g.setLineDash([14, 10]); g.lineWidth = 2.5; g.strokeStyle = '#3a4a70'; g.stroke(); g.setLineDash([]);
        g.save(); g.font = 'italic 900 130px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.fillStyle = '#1a2441'; g.fillText('?', x + CW / 2, y + CH / 2 + 50); g.font = '700 22px "DejaVu Sans Mono", monospace'; g.fillStyle = '#4b5d88'; g.fillText(r.id === 'technician' ? 'ROLE ON HOLD' : 'IN DEVELOPMENT', x + CW / 2, y + CH - 40); g.restore();
      }
      g.restore();
    });
  });
  // footer
  g.font = '700 26px "DejaVu Sans Mono", monospace'; g.fillStyle = '#5d7096'; g.fillText('LEVEL 10: THE EGG SHEDS AND THE FOLLOWER EVOLVES   \\u00B7   RE-ROLLED TO ANOTHER ELEMENT: BACK TO AN EGG UNTIL ITS NEXT LEVEL-UP', 150, H - 50);
  // vignette
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  document.title = 'done';
})();
</script></body>`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 2600, height: 2040 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setContent(page); await p.waitForFunction(() => document.title === 'done', null, { timeout: 60000 });
  await p.locator('#c').screenshot({ path: process.argv[2] }); console.log(errs.slice(0, 3)); await b.close();
})();
