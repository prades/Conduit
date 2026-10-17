// node design/roster-poster/ui-mock.js <out-dir> : mock-ups of the game's UI in the roster-poster style (big slanted buttons, big type).
// Writes hud_mock.png and crystal_mock.png. See docs/UI-STYLE.md.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const OUT = process.argv[2] || '.';
const page = `<!doctype html><body style="margin:0;background:#04060b"><canvas id=c width=1920 height=1080></canvas><script>
const EL = { fire: '#ff4a1c', electric: '#ffe733', flux: '#a64dff', core: '#19e6c1', toxic: '#6dff5a', ice: '#8fe3ff' };
const CV = document.getElementById('c'), g = CV.getContext('2d'), W = CV.width, H = CV.height;
const SANS = '"DejaVu Sans", sans-serif', MONO = '"DejaVu Sans Mono", monospace';
// ── the kit (this is what would become the game's UI helpers) ──
function slab(x, y, w, h, cut) { cut = cut == null ? 22 : cut; g.beginPath(); g.moveTo(x + cut, y); g.lineTo(x + w, y); g.lineTo(x + w - cut, y + h); g.lineTo(x, y + h); g.lineTo(x, y + cut); g.closePath(); }
function bgScene() {
  const bg = g.createLinearGradient(0, 0, W, H); bg.addColorStop(0, '#070b16'); bg.addColorStop(0.5, '#0b1124'); bg.addColorStop(1, '#050810'); g.fillStyle = bg; g.fillRect(0, 0, W, H);
  // an isometric floor, faint
  g.save(); g.globalAlpha = 0.10; g.strokeStyle = '#6fa8ff'; g.lineWidth = 1.5; for (let i = -30; i < 60; i++) { g.beginPath(); g.moveTo(i * 120, 0); g.lineTo(i * 120 + H * 2, H); g.stroke(); g.beginPath(); g.moveTo(i * 120 + 2400, 0); g.lineTo(i * 120 + 2400 - H * 2, H); g.stroke(); } g.restore();
  // the crystal, glowing
  const cx = 960, cy = 560; const rg = g.createRadialGradient(cx, cy, 10, cx, cy, 380); rg.addColorStop(0, 'rgba(60,150,255,0.5)'); rg.addColorStop(1, 'rgba(60,150,255,0)'); g.fillStyle = rg; g.fillRect(cx - 400, cy - 400, 800, 800);
  g.save(); g.shadowColor = '#4aa8ff'; g.shadowBlur = 50; g.fillStyle = '#7cc4ff'; g.beginPath(); g.moveTo(cx, cy - 170); g.lineTo(cx + 70, cy - 20); g.lineTo(cx, cy + 130); g.lineTo(cx - 70, cy - 20); g.closePath(); g.fill(); g.fillStyle = '#b8e4ff'; g.beginPath(); g.moveTo(cx, cy - 170); g.lineTo(cx + 70, cy - 20); g.lineTo(cx, cy - 10); g.closePath(); g.fill(); g.restore();
  // a few units
  for (const [x, y, c] of [[620, 760, EL.core], [780, 820, EL.electric], [1180, 790, EL.toxic], [1320, 700, EL.fire]]) { g.save(); g.shadowColor = c; g.shadowBlur = 30; g.fillStyle = '#0a0d18'; g.beginPath(); g.ellipse(x, y, 54, 30, 0, 0, 7); g.fill(); g.strokeStyle = c; g.lineWidth = 3; g.stroke(); g.restore(); }
}
function button(x, y, w, h, label, o) {
  o = o || {}; const col = o.col || '#19e6c1', on = !!o.on;
  g.save(); slab(x, y, w, h);
  const bgc = g.createLinearGradient(x, y, x, y + h); bgc.addColorStop(0, on ? col : '#121a34'); bgc.addColorStop(1, on ? col + 'aa' : '#080c1a'); g.fillStyle = bgc; g.fill();
  g.shadowColor = col; g.shadowBlur = on ? 30 : 14; g.lineWidth = 3; g.strokeStyle = col; g.stroke(); g.shadowBlur = 0;
  g.fillStyle = on ? '#05070f' : '#ffffff'; g.font = 'italic 900 ' + (o.fs || 30) + 'px ' + SANS; g.textAlign = 'center'; g.textBaseline = 'middle';
  if (o.icon) { g.save(); g.translate(x + 52, y + h / 2); icon(o.icon, on ? '#05070f' : col); g.restore(); g.fillText(label, x + w / 2 + 28, y + h / 2 + 2); } else g.fillText(label, x + w / 2, y + h / 2 + 2);
  if (o.sub) { g.font = '700 16px ' + MONO; g.fillStyle = on ? '#05070f' : '#8aa0c8'; g.fillText(o.sub, x + w / 2 + (o.icon ? 28 : 0), y + h - 14); }
  g.restore();
}
function icon(kind, col) {   // small vector glyphs, 40px
  g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 4; g.lineCap = 'round'; g.lineJoin = 'round';
  if (kind === 'sel') { g.beginPath(); g.arc(0, -8, 9, 0, 7); g.stroke(); g.beginPath(); g.moveTo(-17, 18); g.quadraticCurveTo(0, -4, 17, 18); g.stroke(); }
  if (kind === 'build') { g.beginPath(); g.moveTo(-16, 16); g.lineTo(10, -10); g.stroke(); g.beginPath(); g.arc(14, -14, 9, 0, 7); g.stroke(); }
  if (kind === 'auto') { g.strokeRect(-15, -8, 30, 22); g.beginPath(); g.moveTo(0, -8); g.lineTo(0, -18); g.stroke(); g.beginPath(); g.arc(0, -20, 3, 0, 7); g.fill(); g.beginPath(); g.arc(-6, 3, 3, 0, 7); g.arc(6, 3, 3, 0, 7); g.fill(); }
  if (kind === 'help') { g.font = '900 34px ' + SANS; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('?', 0, 2); }
  g.restore();
}
function bar(x, y, w, h, frac, col, label, segs) {
  g.save(); slab(x, y, w, h, 16); g.fillStyle = '#05070f'; g.fill(); g.clip();
  const fg = g.createLinearGradient(x, y, x, y + h); fg.addColorStop(0, col); fg.addColorStop(1, col + '99'); g.fillStyle = fg; g.fillRect(x, y, w * frac, h);
  g.strokeStyle = '#05070f'; g.lineWidth = 4; for (let i = 1; i < segs; i++) { g.beginPath(); g.moveTo(x + w * i / segs + 8, y); g.lineTo(x + w * i / segs - 8, y + h); g.stroke(); } g.restore();
  g.save(); slab(x, y, w, h, 16); g.lineWidth = 3; g.strokeStyle = col; g.shadowColor = col; g.shadowBlur = 14; g.stroke(); g.restore();
  if (label) { g.fillStyle = '#fff'; g.font = 'italic 900 ' + Math.round(h * 0.55) + 'px ' + SANS; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x + w / 2, y + h / 2 + 2); }
}
function chip(x, y, w, h, label, count, col, sub, on) {
  g.save(); slab(x, y, w, h, 18); g.fillStyle = on ? col + '33' : '#0a1022'; g.fill(); g.shadowColor = col; g.shadowBlur = on ? 26 : 8; g.lineWidth = 3; g.strokeStyle = col; g.stroke(); g.shadowBlur = 0;
  g.fillStyle = col; g.fillRect(x + 4, y + 20, 10, h - 28);
  g.font = 'italic 900 34px ' + SANS; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillStyle = '#fff'; g.fillText(label, x + 34, y + h / 2 - 6);
  g.font = '700 17px ' + MONO; g.fillStyle = col; g.fillText(sub, x + 36, y + h - 16);
  g.font = 'italic 900 46px ' + SANS; g.textAlign = 'right'; g.fillStyle = col; g.fillText(count, x + w - 30, y + h / 2); g.restore();
}
function title(text, x, y, size, col) { g.save(); g.textAlign = 'left'; g.font = 'italic 900 ' + size + 'px ' + SANS; g.textBaseline = 'alphabetic'; g.shadowColor = col; g.shadowBlur = 24; g.fillStyle = col; g.fillText(text, x, y); g.restore(); }
function vignette() { const vg = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, H * 0.95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.5)'); g.fillStyle = vg; g.fillRect(0, 0, W, H); }

window.hud = () => {
  bgScene();
  // top left: shards
  g.save(); slab(40, 36, 300, 84, 20); g.fillStyle = '#0a1022'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#ffe733'; g.shadowColor = '#ffe733'; g.shadowBlur = 16; g.stroke(); g.restore();
  g.fillStyle = '#ffe733'; g.font = 'italic 900 22px ' + SANS; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('SHARDS', 70, 66); g.font = 'italic 900 52px ' + SANS; g.textAlign = 'right'; g.fillStyle = '#fff'; g.fillText('100', 318, 84);
  // top centre: health + ultimate + objective + buttons
  bar(560, 36, 800, 52, 1.0, '#19e6c1', 'SQUAD', 3);
  bar(640, 98, 640, 34, 0.01, '#ffe733', 'ULTIMATE  1%', 1);
  g.save(); slab(470, 150, 980, 62, 20); g.fillStyle = 'rgba(8,14,30,0.9)'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#2a3a66'; g.stroke(); g.restore();
  g.fillStyle = '#19e6c1'; g.font = 'italic 900 28px ' + SANS; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('HOME SECURE  \\u25B8  NEXT: ZONE 1 \\u2014 HACK A NEST THERE', 960, 182);
  button(520, 232, 220, 84, 'SELECT', { icon: 'sel', col: '#19e6c1', on: true });
  button(752, 232, 220, 84, 'BUILD', { icon: 'build', col: '#ffe733' });
  button(984, 232, 220, 84, 'AUTO', { icon: 'auto', col: '#a64dff' });
  button(1216, 232, 190, 84, 'HELP', { icon: 'help', col: '#8fe3ff', fs: 26 });
  // top right
  g.save(); slab(1560, 36, 320, 84, 20); g.fillStyle = '#0a1022'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#19e6c1'; g.shadowColor = '#19e6c1'; g.shadowBlur = 14; g.stroke(); g.restore();
  g.fillStyle = '#8aa0c8'; g.font = '700 20px ' + MONO; g.textAlign = 'left'; g.fillText('ZONE', 1596, 66); g.fillStyle = '#fff'; g.font = 'italic 900 44px ' + SANS; g.textAlign = 'right'; g.fillText('HOME', 1850, 84);
  button(1630, 140, 250, 92, 'CLONES', { col: '#19e6c1', fs: 30 });
  // left: element roster
  const lx = 40, ly = 400; ['ELEMENTS', 'UNITS', 'CLONES'].forEach((t, i) => button(lx + i * 142, ly, 136, 58, t, { col: '#19e6c1', on: i === 0, fs: t === 'ELEMENTS' ? 16 : 18 }));
  [['FIRE', EL.fire, '4', 'B 2  M 1  T 1', 0], ['ELECTRIC', EL.electric, '3', 'B 1  M 1  T 1', 1], ['FLUX', EL.flux, '2', 'B 1  M 1  T 0', 0], ['CORE', EL.core, '5', 'B 2  M 2  T 1', 0], ['TOXIC', EL.toxic, '1', 'B 1  M 0  T 0', 0], ['ICE', EL.ice, '\\u2014', 'LOCKED', 0]].forEach((r, i) => chip(lx, ly + 76 + i * 92, 420, 84, r[0], r[2], r[1], r[3], i === 1));
  // right: side buttons
  button(1700, 420, 180, 100, 'SETTINGS', { col: '#8aa0c8', fs: 22 }); button(1700, 540, 180, 100, 'SHOP', { col: '#6fa8ff', fs: 28 });
  // bottom
  g.save(); slab(760, 960, 400, 84, 20); g.fillStyle = '#0a1022'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#ffe733'; g.shadowColor = '#ffe733'; g.shadowBlur = 14; g.stroke(); g.restore();
  g.fillStyle = '#8aa0c8'; g.font = '700 22px ' + MONO; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText('AMMO', 800, 1002); g.font = 'italic 900 50px ' + SANS; g.textAlign = 'right'; g.fillStyle = '#fff'; g.fillText('12', 1124, 1002);
  button(1560, 940, 320, 100, 'TUTORIAL', { col: '#19e6c1', on: true, fs: 36 });
  vignette();
};
window.crystal = () => {
  bgScene(); g.fillStyle = 'rgba(2,4,10,0.55)'; g.fillRect(0, 0, W, H);
  const px = 260, py = 70, pw = 1400, ph = 940;
  g.save(); slab(px, py, pw, ph, 40); const pg = g.createLinearGradient(px, py, px, py + ph); pg.addColorStop(0, '#0f1730'); pg.addColorStop(1, '#060914'); g.fillStyle = pg; g.fill(); g.lineWidth = 4; g.strokeStyle = '#19e6c1'; g.shadowColor = '#19e6c1'; g.shadowBlur = 28; g.stroke(); g.restore();
  title('MODULATION', px + 70, py + 120, 84, '#19e6c1');
  g.font = '700 26px ' + MONO; g.fillStyle = '#8aa0c8'; g.textAlign = 'left'; g.fillText('WHAT YOUR FOLLOWERS ARE MADE OF', px + 76, py + 168);
  ['MODULATION', 'STATUS', 'INFO', 'RECRUIT', 'CRAFT'].forEach((t, i) => button(px + 70 + i * 250, py + 196, 240, 64, t, { col: '#19e6c1', on: i === 0, fs: 22 }));
  g.font = '700 24px ' + MONO; g.fillStyle = '#8aa0c8'; g.fillText('NEW FOLLOWERS COME OUT AS  \\u2014  TAP TO ADD OR DROP', px + 76, py + 318);
  [['ELECTRIC', EL.electric, 1], ['FLUX', EL.flux, 1], ['FIRE', EL.fire, 0]].forEach((r, i) => { const x = px + 70 + i * 270; g.save(); slab(x, py + 340, 250, 130, 24); g.fillStyle = r[2] ? r[1] : '#0a1022'; g.fill(); g.lineWidth = 3; g.strokeStyle = r[1]; g.shadowColor = r[1]; g.shadowBlur = r[2] ? 24 : 6; g.stroke(); g.restore(); g.fillStyle = r[2] ? '#05070f' : r[1]; g.font = 'italic 900 38px ' + SANS; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(r[0], x + 125, py + 405); });
  title('UNLOCK EARNED', px + 70, py + 580, 52, '#ffcc44'); g.font = '700 24px ' + MONO; g.fillStyle = '#8aa0c8'; g.textAlign = 'left'; g.fillText('CHOOSE AN ELEMENT TO BRING ONLINE', px + 76, py + 620);
  [['CORE', EL.core], ['TOXIC', EL.toxic], ['ICE', EL.ice]].forEach((r, i) => { const x = px + 70 + i * 420, y = py + 650; g.save(); slab(x, y, 390, 130, 26); const cg = g.createLinearGradient(x, y, x, y + 130); cg.addColorStop(0, r[1] + '55'); cg.addColorStop(1, '#070b18'); g.fillStyle = cg; g.fill(); g.lineWidth = 4; g.strokeStyle = r[1]; g.shadowColor = r[1]; g.shadowBlur = 24; g.stroke(); g.restore();
    g.fillStyle = r[1]; g.fillRect(x + 6, y + 30, 12, 92); g.fillStyle = '#fff'; g.font = 'italic 900 52px ' + SANS; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(r[0], x + 44, y + 58); g.font = '700 20px ' + MONO; g.fillStyle = r[1]; g.fillText('\\u25B8 UNLOCK', x + 46, y + 104); });
  g.font = '700 22px ' + MONO; g.fillStyle = '#4b5d88'; g.textAlign = 'left'; g.fillText('MODULATORS: NONE \\u2014 DEFEAT A BOSS TO UNLOCK', px + 76, py + ph - 40);
  button(px + pw - 230, py + 36, 180, 64, 'CLOSE', { col: '#ff4a1c', fs: 24 });
  vignette();
};
</script></body>`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: 1920, height: 1080 } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setContent(page);
  for (const name of ['hud', 'crystal']) { await p.evaluate(n => window[n](), name); await p.locator('#c').screenshot({ path: path.join(OUT, name + '_mock.png') }); }
  console.log(errs.slice(0, 3)); await b.close();
})();
