// EVERY ATTACK CARD A CARD BATTLE CAN SHOW, AND WHICH HAVE A PICTURE (docs/ATTACK-CARD-ART.md §5; the owner, 2026-11-23: "make the other cards for the attacks just have graphics").
// It opens the game's working page (game.html?dev) in Chromium, makes a follower of each evolved form with its energy full (so every one of its attacks is open), and asks the game's own
// card builder (js/cardbattle.js cardBattleCards) for its cards: nothing is read from a list kept here, so it cannot drift from the game. It prints a table (markdown) and the counts.
//   node design/cards/attack/inventory.js [--json]
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..', '..', '..'), JSON_OUT = process.argv.includes('--json');
const TYPES = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.jpg': 'image/jpeg', '.json': 'application/json', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.wav': 'audio/wav' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]);
  const f = path.join(ROOT, u === '/' ? 'game.html' : u); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
srv.listen(0, async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await (await b.newContext({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2, hasTouch: true })).newPage();
  await p.goto('http://127.0.0.1:' + srv.address().port + '/game.html?dev', { waitUntil: 'load' });
  await p.waitForFunction(() => typeof cardBattleCards === 'function' && typeof EVOLUTIONS !== 'undefined' && typeof followers !== 'undefined', null, { timeout: 60000 });
  await p.waitForTimeout(1500);
  const rows = await p.evaluate(async () => {
    const out = [];
    for (const k of Object.keys(EVOLUTIONS).filter(k => !EVOLUTIONS[k].legacy)) {
      const d = EVOLUTIONS[k]; spawnFollowerAtCrystal(d.element); const f = followers[followers.length - 1];
      f.evolved = k; f.element = d.element; f.role = d.role; f._moltAt = -9999; if (typeof energyFill === 'function') energyFill(f);
      if (typeof cardBattleArtReady === 'function') await cardBattleArtReady(f);   /* (a basic attack card's picture is put together in the page: wait for it) */
      const cards = cardBattleCards(f).filter(c => c.kind === 'basic' || c.kind === 'move' || c.kind === 'ult');
      out.push({ form: k, name: d.name, role: d.role, element: d.element, type: typeof dmgFormType === 'function' ? dmgFormType(f, 'main') : '', cards: cards.map(c => ({ kind: c.kind, id: c.id || '', name: c.name, art: !!c.art })) });
    }
    return out;
  });
  await b.close(); srv.close();
  if (JSON_OUT) return console.log(JSON.stringify(rows, null, 1));
  const ROLE = { sniper: 'Mage', brawler: 'Brawler', camper: 'Technician' }, mark = c => c.name + (c.art ? ' ✔' : ' ✘');
  const n = { basic: [0, 0], move: [0, 0], ult: [0, 0] };
  console.log('| Form | Class · element | Basic attack (type) | Second attacks | Ultimate |\n|---|---|---|---|---|');
  for (const r of rows) {
    for (const c of r.cards) { n[c.kind][1]++; if (c.art) n[c.kind][0]++; }
    const of = k => r.cards.filter(c => c.kind === k).map(mark).join(', ') || 'none';
    console.log('| ' + r.name + ' | ' + (ROLE[r.role] || r.role) + ' · ' + r.element + ' | ' + of('basic') + ' (' + r.type + ') | ' + of('move') + ' | ' + of('ult') + ' |');
  }
  console.log('\nwith a picture: basic ' + n.basic.join(' of ') + ', second attacks ' + n.move.join(' of ') + ', Ultimates ' + n.ult.join(' of ') + '; forms ' + rows.length);
});
