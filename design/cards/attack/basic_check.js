// LOOK AT THE BASIC ATTACK CARDS' PICTURES AS THE GAME MAKES THEM (docs/ATTACK-CARD-ART.md §4, 2026-11-23; js/cardbattle.js CARD_BATTLE_BASIC). A basic attack's picture is no file: the game
// puts it together from the element's world and the attack type's two layers. This opens the game's working page (game.html?dev) in Chromium at an iPad's size (1180 x 820, 2x), and for every
// evolved form builds the battle's pop-up with the game's own elements, styles and card builder (as battle_check.js does, but with nothing put in: every card is as the game has it), then saves:
//   <out-dir>/<form>_popup.png   the pop-up as the game shows it, every card of the follower at its real size
//   <out-dir>/<form>_basic.png   its basic attack card alone
//   <out-dir>/<form>_full.jpg    the picture the game made, whole (450 x 630)
//   node design/cards/attack/basic_check.js <out-dir> [form,form,...]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [OUT, ONLY] = process.argv.slice(2);
const ROOT = path.join(__dirname, '..', '..', '..');
if (!OUT) { console.error('usage: node design/cards/attack/basic_check.js <out-dir> [form,form,...]'); process.exit(1); }
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  const f = path.join(ROOT, u === '/' ? 'game.html' : u); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
srv.listen(0, async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const ctx = await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true });
  const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto('http://127.0.0.1:' + srv.address().port + '/game.html?dev', { waitUntil: 'load' });
  await p.waitForFunction(() => typeof _cbMake === 'function' && typeof _cbCardHTML === 'function' && typeof cardBattleCards === 'function' && typeof EVOLUTIONS !== 'undefined', null, { timeout: 60000 });
  await p.waitForTimeout(1500);
  const forms = await p.evaluate(() => Object.keys(EVOLUTIONS).filter(k => !EVOLUTIONS[k].legacy));
  for (const form of forms.filter(k => !ONLY || ONLY.split(',').includes(k))) {
    const res = await p.evaluate(async form => {
      const d = EVOLUTIONS[form]; spawnFollowerAtCrystal(d.element); const f = followers[followers.length - 1];
      f.evolved = form; f.element = d.element; f.role = d.role; f._moltAt = -9999; if (typeof energyFill === 'function') energyFill(f);
      const t0 = performance.now(), made = await cardBattleArtReady(f), ms = Math.round(performance.now() - t0);
      const cards = cardBattleCards(f), E = _cbMake(); window._cbDom = function () {};   /* (no battle is on: in this page only, the battle screen is left up) */
      const col = cards[0].col, nm = (typeof unitTypeLabel === 'function' ? unitTypeLabel(f) : d.name) || d.name;
      document.body.classList.add('cb-on'); E.scr.classList.add('yours'); E.band.classList.add('cb-pop'); E.band.classList.remove('away', 'swap');
      E.row.innerHTML = ''; const el = document.createElement('div'); el.className = 'cb-col'; el.style.setProperty('--c', col); E.row.appendChild(el);
      el.innerHTML = '<div class="cb-chips"><i class="cb-chip now">' + nm + '</i></div><div class="cb-head"><canvas class="cb-pt" width="52" height="52"></canvas><div class="cb-hw"><b class="cb-name">' + nm + '</b><i class="cb-sub">LV ' + (f.level || 1) + '</i><i class="cb-hbar"><u style="width:100%"></u></i></div><span class="cb-hpn"></span></div><div class="cb-cards">' + cards.map(_cbCardHTML).join('') + '</div>';
      try { if (typeof _ccThumb === 'function') _ccThumb(el.querySelector('.cb-pt'), f); } catch (e) {}
      await new Promise(r => setTimeout(r, 700));
      const rect = n => { const r = n.getBoundingClientRect(); return [r.left, r.top, r.width, r.height]; };
      let full = null; if (made) { const i = new Image(); await new Promise(r => { i.onload = r; i.onerror = r; i.src = made; }); const c = document.createElement('canvas'); c.width = i.naturalWidth; c.height = i.naturalHeight; c.getContext('2d').drawImage(i, 0, 0); full = c.toDataURL('image/jpeg', 0.92); }
      const mine = el.querySelector('.cb-card.cb-basic');
      return { made: !!made, ms, key: _cbBasicKey(f), art: mine.classList.contains('art'), name: mine.querySelector('.cb-nm').textContent, mine: rect(mine), band: rect(el), full };
    }, form);
    const clip = (r, f) => p.screenshot({ path: f, clip: { x: r[0] - 3, y: r[1] - 3, width: r[2] + 6, height: r[3] + 6 } });
    await clip(res.band, path.join(OUT, form + '_popup.png')); await clip(res.mine, path.join(OUT, form + '_basic.png'));
    if (res.full) fs.writeFileSync(path.join(OUT, form + '_full.jpg'), Buffer.from(res.full.split(',')[1], 'base64'));
    console.log(form + ': ' + res.key + '  ' + (res.art ? 'picture' : 'PLAIN') + '  "' + res.name + '"  made in ' + res.ms + ' ms  card ' + res.mine.slice(2).map(Math.round).join(' x ') + ' CSS px');
  }
  if (errs.length) console.log('page errors: ' + errs.slice(0, 5).join(' | '));
  await b.close(); srv.close();
});
