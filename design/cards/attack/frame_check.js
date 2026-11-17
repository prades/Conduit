// LOOK AT AN ATTACK CARD'S PICTURE IN THE REAL CARD FRAME (docs/ATTACK-CARD-ART.md; the card artist's own check before the owner sees it).
// Opens the game's working page (game.html?dev) in Chromium at an iPad's size (1180 x 820, 2x), opens the Cards sheet, and builds cards with the game's own _cdSlab
// (js/cardsui.js) in the game's own styles: the attack card frame is not built yet, so the picture is shown in the nearest frame the game has, the full-art ENERGY CARD's
// (its world's layer, .ew-bg), twice: (1) under that card's mask, which fades the picture under the name plate, and (2) at full strength, the hardest case for the name; and once at the card's own size.
// The card's name says what the picture is a sample of; nothing else on the card is changed.
//   node design/cards/attack/frame_check.js <picture.png> <element> "<NAME ON THE CARD>" <out.png>
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [PIC, EL, NAME, OUT] = process.argv.slice(2);
const ROOT = path.join(__dirname, '..', '..', '..');
if (!PIC || !EL || !NAME || !OUT) { console.error('usage: node design/cards/attack/frame_check.js <picture.png> <element> "<NAME>" <out.png>'); process.exit(1); }
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  if (u === '/__sample.png') { r.writeHead(200, { 'Content-Type': 'image/png' }); return r.end(fs.readFileSync(PIC)); }
  const f = path.join(ROOT, u === '/' ? 'game.html' : u); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
srv.listen(0, async () => {
  const port = srv.address().port;
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:' + port + '/game.html?dev', { waitUntil: 'load' });
  await p.waitForFunction(() => typeof _cdSlab === 'function' && typeof energyCardOf === 'function' && typeof cardsOpen === 'function', null, { timeout: 60000 });
  await p.waitForTimeout(1500);
  const res = await p.evaluate(async ([el, name]) => {
    try { cardsOpen(); } catch (e) {}
    const root = document.getElementById('cardsRoot'); if (!root) return { err: 'no #cardsRoot' };
    const box = document.createElement('div'); box.id = '__attackCheck';
    box.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;gap:40px;background:#05070f;';
    const mk = (masked, sc) => { const c = Object.assign({}, energyCardOf(el), { name }); const s = _cdSlab(c, ''); const w = s.querySelector('.ew-w'), bg = s.querySelector('.ew-bg');
      s.querySelectorAll('.ew-mo, .ew-bo, .ew-gem, .cd-chip').forEach(n => n.remove());   // (the energy card's motes, gem and ENERGY tab: not this card's)
      if (bg) bg.style.backgroundImage = 'url("/__sample.png")';
      if (w && !masked) { w.style.webkitMask = 'none'; w.style.mask = 'none'; } s.style.transform = 'scale(' + sc + ')'; s.style.margin = '0 ' + (sc > 1 ? 40 : 0) + 'px'; return s; };
    box.appendChild(mk(true, 1)); box.appendChild(mk(true, 1.6)); box.appendChild(mk(false, 1.6)); root.appendChild(box);   // (the first at the card's own size in the game)
    await new Promise(r => setTimeout(r, 900));
    const a = box.querySelectorAll('.cd-art'); return { arts: [...a].map(e => { const r = e.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(Math.round); }) };
  }, [EL, NAME]);
  if (res.err) { console.error(res.err); process.exit(1); }
  await p.screenshot({ path: OUT });
  console.log('wrote ' + OUT + '  cards at ' + JSON.stringify(res.arts) + (errs.length ? '  page errors: ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close(); srv.close();
});
