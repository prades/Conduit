// A contact sheet of a family's baked sprites, for looking at them: node design/props/preview.js <family> [out.png] [scale] [name-prefix,name-prefix...]
// Each variant is drawn on a floor diamond (its footprint: 1 tile = the 60 x 30 px diamond at the anchor) over a mid-grey backdrop, with its name; the anchor point is marked with a small red cross.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..'), fam = process.argv[2], out = process.argv[3] || path.join(__dirname, 'out', 'preview_' + fam + '.png'), SC = +process.argv[4] || 1;
const meta = JSON.parse(fs.readFileSync(path.join(__dirname, 'out', fam + '.json'), 'utf8')), ONLY = process.argv[5] ? process.argv[5].split(',') : null, cells = Object.entries(meta.cells).filter(([n]) => !ONLY || ONLY.some(o => n.startsWith(o)));
(async () => {
  const b = await chromium.launch({ args: ['--allow-file-access-from-files', '--no-sandbox'] }); const pg = await b.newPage();
  const html = `<body style="margin:0;background:#3a4252"><canvas id=c></canvas><script>
  const cells = ${JSON.stringify(cells)}, SC = ${SC}, maxW = 2400, PAD = 24; const im = new Image(); im.onload = () => {
    let x = PAD, y = PAD, rowH = 0; const pos = [];
    for (const [n, c] of cells) { const w = c.w * SC + PAD, h = c.h * SC + PAD + 18; if (x + w > maxW) { x = PAD; y += rowH + PAD; rowH = 0; } pos.push([x, y]); x += w; rowH = Math.max(rowH, h); }
    const cv = document.getElementById('c'); cv.width = maxW; cv.height = y + rowH + PAD; const g = cv.getContext('2d'); g.fillStyle = '#3a4252'; g.fillRect(0, 0, cv.width, cv.height);
    cells.forEach(([n, c], i) => { const [px, py] = pos[i], ax = px + c.ax * SC, ay = py + 18 + c.ay * SC;
      g.fillStyle = '#4a5468'; g.beginPath(); g.moveTo(ax, ay - 30 * SC); g.lineTo(ax + 60 * SC, ay); g.lineTo(ax, ay + 30 * SC); g.lineTo(ax - 60 * SC, ay); g.closePath(); g.fill(); g.strokeStyle = 'rgba(255,255,255,0.25)'; g.stroke();
      g.imageSmoothingEnabled = true; g.drawImage(im, c.x, c.y, c.w, c.h, px, py + 18, c.w * SC, c.h * SC);
      g.strokeStyle = '#ff3a3a'; g.beginPath(); g.moveTo(ax - 5, ay); g.lineTo(ax + 5, ay); g.moveTo(ax, ay - 5); g.lineTo(ax, ay + 5); g.stroke();
      g.fillStyle = '#fff'; g.font = '13px monospace'; g.fillText(n + (c.edge ? ' (EDGE!)' : ''), px, py + 12); });
    document.title = 'done'; };
  im.src = '../../../img/props/${fam}.png';</script>`;
  fs.writeFileSync(path.join(__dirname, 'out', 'preview.html'), html);
  await pg.goto('file://' + path.join(__dirname, 'out', 'preview.html')); await pg.waitForFunction(() => document.title === 'done', null, { timeout: 20000 });
  await (await pg.$('#c')).screenshot({ path: out }); await b.close(); console.log(out);
})();
