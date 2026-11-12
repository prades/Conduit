// Bakes a DRAFT prop family (design/props/drafts/<family>.js) for review, without touching the game: the real baker and the shared style kit are copied into a scratch root, the draft is baked
// there (its img/props/<family>.png, design/props/out/<family>.json and js/propatlas.js land in the scratch root, not in the repo), and a review sheet is drawn: each variant large, then all at game size.
//   node design/props/drafts/bake_draft.js <three-dir> <family> <out-dir> [title]        e.g.  node design/props/drafts/bake_draft.js /tmp/threepkg chest /tmp/review 'The default chest'
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const [THREE_DIR, FAM, OUTDIR, TITLE] = process.argv.slice(2);
if (!THREE_DIR || !FAM || !OUTDIR) { console.error('usage: node design/props/drafts/bake_draft.js <three-dir> <family> <out-dir>'); process.exit(1); }
const REPO = path.join(__dirname, '..', '..', '..'), ROOT = path.join(path.resolve(OUTDIR), '_root_' + FAM);
fs.rmSync(ROOT, { recursive: true, force: true });
const cp = (from, to) => { fs.mkdirSync(path.dirname(to), { recursive: true }); fs.copyFileSync(from, to); };
cp(path.join(REPO, 'design/props/bake_props.js'), path.join(ROOT, 'design/props/bake_props.js'));
for (const f of fs.readdirSync(path.join(REPO, 'design/props/models')).filter(f => f.startsWith('_'))) cp(path.join(REPO, 'design/props/models', f), path.join(ROOT, 'design/props/models', f));
cp(path.join(__dirname, FAM + '.js'), path.join(ROOT, 'design/props/models', FAM + '.js'));
for (const f of ['forms-core.js', 'forms29.js', 'forms2.js']) cp(path.join(REPO, 'design/evolutions', f), path.join(ROOT, 'design/evolutions', f));
fs.mkdirSync(path.join(ROOT, 'js'), { recursive: true });
execFileSync(process.execPath, [path.join(ROOT, 'design/props/bake_props.js'), path.resolve(THREE_DIR), FAM], { stdio: 'inherit' });
const meta = JSON.parse(fs.readFileSync(path.join(ROOT, 'design/props/out', FAM + '.json'), 'utf8')), png = fs.readFileSync(path.join(ROOT, 'img/props', FAM + '.png')).toString('base64');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
  await p.setContent(`<body style="margin:0;background:#0b0f16"><canvas id=c></canvas><script>
  const meta = ${JSON.stringify(meta)}, cells = Object.entries(meta.cells), im = new Image();
  im.onload = () => {
    const BIG = 3, colW = 300, TOPH = ${TITLE ? 44 : 0}, PAD = 30 + TOPH, rowH = 330, smallH = 170, cv = document.getElementById('c'); cv.width = 60 + colW * cells.length; cv.height = PAD + 40 + rowH + smallH + 40; const g = cv.getContext('2d');
    g.fillStyle = '#0b0f16'; g.fillRect(0, 0, cv.width, cv.height);
    if (TOPH) { g.fillStyle = '#ffffff'; g.font = 'bold 24px DejaVu Sans, sans-serif'; g.fillText(${JSON.stringify(TITLE || '')}, 30, 40); }
    const floor = (ax, ay, s, n) => { for (let i = -n; i <= n; i++) for (let j = -n; j <= n; j++) { const x = ax + (i - j) * 30 * s, y = ay + (i + j) * 15 * s; g.fillStyle = (i + j) % 2 ? '#1b2533' : '#202c3c'; g.beginPath(); g.moveTo(x, y - 15 * s); g.lineTo(x + 30 * s, y); g.lineTo(x, y + 15 * s); g.lineTo(x - 30 * s, y); g.closePath(); g.fill(); } };
    g.font = 'bold 18px DejaVu Sans, sans-serif'; g.fillStyle = '#ffffff';
    cells.forEach(([n, c], i) => { const cx = 30 + colW * i + colW / 2, ay = PAD + 40 + rowH - 70;
      g.save(); g.beginPath(); g.rect(30 + colW * i + 6, PAD + 40, colW - 12, rowH); g.clip(); floor(cx, ay, BIG / 2, 3); g.restore();
      g.imageSmoothingEnabled = true; g.drawImage(im, c.x, c.y, c.w, c.h, cx - c.ax * BIG, ay - c.ay * BIG, c.w * BIG, c.h * BIG);
      g.fillStyle = '#ffffff'; g.font = 'bold 17px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.fillText(n.replace('chest_', '').toUpperCase().replace('_OPEN', ' · OPEN'), cx, PAD + 26);
      if (c.edge) { g.fillStyle = '#ff5a5a'; g.fillText('EDGE!', cx, PAD + 60); }
      const sy = PAD + 40 + rowH + 110; g.save(); g.beginPath(); g.rect(30 + colW * i + 6, PAD + 40 + rowH + 10, colW - 12, smallH - 20); g.clip(); floor(cx, sy, 1, 2); g.restore();
      g.drawImage(im, c.x, c.y, c.w, c.h, cx - c.ax, sy - c.ay, c.w, c.h); });
    g.fillStyle = '#8fa6bd'; g.font = '15px DejaVu Sans, sans-serif'; g.textAlign = 'left'; g.fillText('above: three times game size · below: at game size (a tile is 60 px wide)', 30, cv.height - 14);
    document.title = 'done'; };
  im.src = 'data:image/png;base64,${png}';</script></body>`);
  await p.waitForFunction(() => document.title === 'done', null, { timeout: 20000 });
  fs.mkdirSync(OUTDIR, { recursive: true }); const out = path.join(OUTDIR, FAM + '_draft.png');
  await (await p.$('#c')).screenshot({ path: out }); await b.close(); console.log(out);
})();
