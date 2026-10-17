// node design/roster-poster/ui-mock-mobile.js <out.png> : mobile mock-up of the LEFT RADIAL MENU in the roster-poster style: three phone screens side by side
// (closed hub / radial open / squad-analytics panel). See docs/UI-STYLE.md.
const { chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/node22/lib/node_modules/playwright');
const W = 390, H = 800, GAP = 40, SC = 1.6;
const page = `<!doctype html><body style="margin:0;background:#04060b"><canvas id=c width=${(W * 3 + GAP * 4) * SC} height=${(H + 80) * SC}></canvas><script>
const SANS = '"DejaVu Sans", sans-serif', MONO = '"DejaVu Sans Mono", monospace', EL = { fire: '#ff4a1c', electric: '#ffe733', flux: '#a64dff', core: '#19e6c1', toxic: '#6dff5a', ice: '#8fe3ff' };
const cv = document.getElementById('c'), g = cv.getContext('2d'); g.scale(${SC}, ${SC});
function slab(x, y, w, h, cut) { cut = cut == null ? 12 : cut; g.beginPath(); g.moveTo(x + cut, y); g.lineTo(x + w, y); g.lineTo(x + w - cut, y + h); g.lineTo(x, y + h); g.lineTo(x, y + cut); g.closePath(); }
function plate(x, y, w, h, col, txt, fs, filled) { g.save(); slab(x, y, w, h, 10); g.fillStyle = filled ? col : '#0a1022'; g.fill(); g.shadowColor = col; g.shadowBlur = 10; g.lineWidth = 2; g.strokeStyle = col; g.stroke(); g.shadowBlur = 0; g.fillStyle = filled ? '#05070f' : '#fff'; g.font = 'italic 900 ' + fs + 'px ' + SANS; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, x + w / 2, y + h / 2 + 1); g.restore(); }
function scene(ox) {
  g.save(); g.translate(ox, 40); g.beginPath(); g.rect(0, 0, ${W}, ${H}); g.clip();
  const bg = g.createLinearGradient(0, 0, 0, ${H}); bg.addColorStop(0, '#0b1124'); bg.addColorStop(1, '#050810'); g.fillStyle = bg; g.fillRect(0, 0, ${W}, ${H});
  g.strokeStyle = 'rgba(111,168,255,0.1)'; g.lineWidth = 1; for (let i = -10; i < 20; i++) { g.beginPath(); g.moveTo(i * 60, 0); g.lineTo(i * 60 + 800, ${H}); g.stroke(); g.beginPath(); g.moveTo(i * 60 + 800, 0); g.lineTo(i * 60, ${H}); g.stroke(); }
  const rg = g.createRadialGradient(240, 330, 5, 240, 330, 170); rg.addColorStop(0, 'rgba(60,150,255,0.5)'); rg.addColorStop(1, 'rgba(60,150,255,0)'); g.fillStyle = rg; g.fillRect(40, 130, 400, 400);
  g.save(); g.shadowColor = '#4aa8ff'; g.shadowBlur = 30; g.fillStyle = '#7cc4ff'; g.beginPath(); g.moveTo(240, 270); g.lineTo(272, 330); g.lineTo(240, 396); g.lineTo(208, 330); g.closePath(); g.fill(); g.restore();
  [[290, 470, EL.core], [220, 520, EL.electric], [330, 560, EL.toxic]].forEach(([x, y, c]) => { g.save(); g.shadowColor = c; g.shadowBlur = 16; g.fillStyle = '#0a0d18'; g.beginPath(); g.ellipse(x, y, 24, 14, 0, 0, 7); g.fill(); g.strokeStyle = c; g.lineWidth = 2; g.stroke(); g.restore(); });
  // top status (as in the HUD skin)
  plate(10, 10, 140, 34, '#ffe733', 'SHARDS 100', 14); plate(246, 10, 134, 34, '#19e6c1', 'ZONE HOME', 14);
  g.save(); slab(10, 54, 370, 24, 8); g.fillStyle = '#05070f'; g.fill(); g.lineWidth = 2; g.strokeStyle = '#19e6c1'; g.shadowColor = '#19e6c1'; g.shadowBlur = 10; g.stroke(); g.restore(); g.fillStyle = '#19e6c1'; g.fillRect(16, 60, 358, 12);
  plate(10, 86, 370, 32, '#19e6c1', 'HOME SECURE → NEXT: ZONE 1', 13);
  g.restore();
}
function hub(x, y, r, open) { g.save(); g.shadowColor = '#19e6c1'; g.shadowBlur = 22; g.fillStyle = open ? '#19e6c1' : '#0a1022'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); g.lineWidth = 3; g.strokeStyle = '#19e6c1'; g.stroke(); g.shadowBlur = 0; g.strokeStyle = open ? '#05070f' : '#19e6c1'; g.lineWidth = 4; g.lineCap = 'round'; if (open) { g.beginPath(); g.moveTo(x - 10, y - 10); g.lineTo(x + 10, y + 10); g.moveTo(x + 10, y - 10); g.lineTo(x - 10, y + 10); g.stroke(); } else { for (let k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(x - 11, y + k * 9); g.lineTo(x + 11, y + k * 9); g.stroke(); } } g.restore(); }
function petal(cx, cy, r0, r1, a0, a1, col, label, icon, on) {
  g.save(); g.beginPath(); g.arc(cx, cy, r1, a0, a1); g.arc(cx, cy, r0, a1, a0, true); g.closePath(); g.fillStyle = on ? col : 'rgba(10,16,34,0.94)'; g.fill(); g.shadowColor = col; g.shadowBlur = on ? 22 : 10; g.lineWidth = 2.5; g.strokeStyle = col; g.stroke(); g.restore();
  const am = (a0 + a1) / 2, rm = (r0 + r1) / 2, x = cx + Math.cos(am) * rm, y = cy + Math.sin(am) * rm;
  g.save(); g.fillStyle = on ? '#05070f' : col; g.font = '900 20px ' + SANS; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(icon, x, y - 8); g.fillStyle = on ? '#05070f' : '#fff'; g.font = 'italic 900 11px ' + SANS; g.fillText(label, x, y + 12); g.restore();
}
function radial(cx, cy, active) {
  const items = [['SQUAD', '#19e6c1', '◉'], ['ROSTER', '#a64dff', '▦'], ['ORDERS', '#ffe733', '➤'], ['BUILD', '#ff4a1c', '⚒'], ['AUTO', '#8fe3ff', '⚙']];
  const a0 = -Math.PI / 2 - 0.02, span = Math.PI + 0.04, n = items.length, gap = 0.05;
  items.forEach((it, i) => petal(cx, cy, 70, 150, a0 + span * i / n + gap, a0 + span * (i + 1) / n - gap, it[1], it[0], it[2], i === active));
  g.save(); g.fillStyle = 'rgba(4,6,11,0.5)'; g.beginPath(); g.arc(cx, cy, 66, -Math.PI / 2, Math.PI / 2); g.fill(); g.restore();
}
function bar(x, y, w, h, frac, col) { g.save(); slab(x, y, w, h, 5); g.fillStyle = '#05070f'; g.fill(); g.restore(); g.fillStyle = col; g.fillRect(x + 4, y + 3, (w - 10) * frac, h - 6); g.save(); slab(x, y, w, h, 5); g.lineWidth = 1.5; g.strokeStyle = col; g.stroke(); g.restore(); }
// ── screen 1: closed ──
const S1 = 40, S2 = S1 + ${W} + ${GAP}, S3 = S2 + ${W} + ${GAP};
scene(S1); g.save(); g.translate(S1, 40); hub(44, 400, 30, false); g.fillStyle = '#8aa0c8'; g.font = '700 11px ' + MONO; g.textAlign = 'left'; g.fillText('MENU', 10, 446); g.restore();
// ── screen 2: open radial, SQUAD highlighted ──
scene(S2); g.save(); g.translate(S2, 40); g.fillStyle = 'rgba(2,4,10,0.45)'; g.fillRect(0, 130, ${W}, ${H - 130}); radial(0, 400, 0); hub(34, 400, 30, true); g.restore();
// ── screen 3: SQUAD analytics panel ──
scene(S3); g.save(); g.translate(S3, 40); g.fillStyle = 'rgba(2,4,10,0.55)'; g.fillRect(0, 130, ${W}, ${H - 130}); radial(0, 400, 0); hub(34, 400, 30, true);
const px = 160, py = 140, pw = 222, ph = 640; g.save(); slab(px, py, pw, ph, 18); const pg = g.createLinearGradient(px, py, px, py + ph); pg.addColorStop(0, '#0f1730'); pg.addColorStop(1, '#060914'); g.fillStyle = pg; g.fill(); g.lineWidth = 2.5; g.strokeStyle = '#19e6c1'; g.shadowColor = '#19e6c1'; g.shadowBlur = 14; g.stroke(); g.restore();
g.fillStyle = '#19e6c1'; g.font = 'italic 900 22px ' + SANS; g.textAlign = 'left'; g.fillText('SQUAD', px + 24, py + 34); g.fillStyle = '#8aa0c8'; g.font = '700 11px ' + MONO; g.fillText('14 UNITS · 3 WORKING', px + 24, py + 54);
const els = [['FIRE', EL.fire, 3, 0.8], ['ELECTRIC', EL.electric, 4, 0.55], ['FLUX', EL.flux, 2, 0.95], ['CORE', EL.core, 3, 0.7], ['TOXIC', EL.toxic, 1, 0.4], ['ICE', EL.ice, 1, 1.0]];
els.forEach((e, i) => { const y = py + 76 + i * 46; g.fillStyle = e[1]; g.fillRect(px + 14, y + 3, 6, 30); g.fillStyle = '#fff'; g.font = 'italic 900 14px ' + SANS; g.fillText(e[0], px + 28, y + 12); g.fillStyle = e[1]; g.textAlign = 'right'; g.font = 'italic 900 22px ' + SANS; g.fillText(String(e[2]), px + pw - 18, y + 16); g.textAlign = 'left'; bar(px + 28, y + 22, pw - 90, 10, e[3], e[1]); });
g.fillStyle = '#ffcc44'; g.font = 'italic 900 13px ' + SANS; g.fillText('ROLES', px + 24, py + 366); [['BRAWL', 6], ['MAGE', 5], ['WORK', 3]].forEach((r, i) => plate(px + 14 + i * 66, py + 376, 60, 40, ['#ff4a1c', '#a64dff', '#19e6c1'][i], r[0] + ' ' + r[1], 11));
g.fillStyle = '#ffcc44'; g.font = 'italic 900 13px ' + SANS; g.fillText('EVOLVED', px + 24, py + 444); g.fillStyle = '#fff'; g.font = '900 16px ' + SANS; g.fillText('5 / 14', px + 120, py + 444);
plate(px + 14, py + 462, 194, 40, '#19e6c1', 'ALL UNITS', 15, true); plate(px + 14, py + 512, 94, 40, '#ffe733', 'WORKERS', 13); plate(px + 114, py + 512, 94, 40, '#a64dff', 'FIGHTERS', 13);
g.fillStyle = '#4b5d88'; g.font = '700 10px ' + MONO; g.fillText('TAP A ROW: SELECT THAT ELEMENT', px + 14, py + 600);
g.restore();
// captions
g.fillStyle = '#c9d2dc'; g.font = '700 14px ' + MONO; g.textAlign = 'center'; [['1  CLOSED: ONE THUMB HUB', S1], ['2  OPEN: RADIAL FAN', S2], ['3  SQUAD ANALYTICS', S3]].forEach(([t, x]) => g.fillText(t, x + ${W} / 2, 26));
document.title = 'done';
</script></body>`;
(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox'] });
  const p = await b.newPage({ viewport: { width: Math.round((W * 3 + GAP * 4) * SC), height: Math.round((H + 80) * SC) } });
  const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.setContent(page); await p.waitForFunction(() => document.title === 'done');
  await p.locator('#c').screenshot({ path: process.argv[2] || 'mobile_mock.png' }); console.log(errs.slice(0, 3)); await b.close();
})();
