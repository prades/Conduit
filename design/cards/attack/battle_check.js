// LOOK AT AN ATTACK CARD'S PICTURE ON THE BATTLE'S SMALL CARD (docs/ATTACK-CARD-ART.md; the card artist's own check before the owner sees it; beside frame_check.js, the big frame's).
// Since build 2026-11-17aq a picture is shown on its attack's card in the card battles' pop-up (docs/CARD-BATTLES.md §2.42; js/cardbattle.js CARD_BATTLE_ART, _cbCardHTML; game.html
// "#cbScreen .cb-card.art"): a small card, about 130 x 177 CSS px for a follower with five cards, wider than the picture's 5:7, the picture laid in to cover it from its middle, with the card's
// tag and name over a dark fade on its lower part and its state under them. This opens the game's working page (game.html?dev) in Chromium at an iPad's size (1180 x 820, 2x), builds the
// pop-up with the game's own elements, styles and card builder (_cbMake, cardBattleCards, _cbCardHTML) for a follower of the form, and puts the picture on the card of the move, in the page
// only: nothing in the game is changed, and the form's other cards are as the game has them. The picture: the move's card three times its size, and beside it the pop-up as the game shows
// it, every card of the follower at its real size.
//   node design/cards/attack/battle_check.js <picture.png> <form id> <move id> <out.png>      e.g. ... drafts/followers6/hammerslug_bladeroll.png hammerslug blade_roll out.png
const { chromium } = require('playwright');
const http = require('http'), fs = require('fs'), path = require('path');
const [PIC, FORM, MOVE, OUT] = process.argv.slice(2);
const ROOT = path.join(__dirname, '..', '..', '..');
if (!PIC || !FORM || !MOVE || !OUT) { console.error('usage: node design/cards/attack/battle_check.js <picture.png> <form id> <move id> <out.png>'); process.exit(1); }
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
  await p.waitForFunction(() => typeof _cbMake === 'function' && typeof _cbCardHTML === 'function' && typeof cardBattleCards === 'function' && typeof EVOLUTIONS !== 'undefined', null, { timeout: 60000 });
  await p.waitForTimeout(1500);
  const res = await p.evaluate(async ([form, move]) => {
    const d = EVOLUTIONS[form]; if (!d) return { err: 'no evolved form "' + form + '"' };
    if (!(d.moves || []).includes(move)) return { err: form + ' has no move "' + move + '" (its moves: ' + (d.moves || []).join(', ') + ')' };
    // a follower of the form, as the game makes one, with its energy full (so the card of each of its attacks shows); if the page will not make one here, a plain stand-in of the same form
    let f = null, how = 'a follower the game made';
    try { spawnFollowerAtCrystal(d.element); f = followers[followers.length - 1]; f.evolved = form; f.element = d.element; f.role = d.role; f._moltAt = -9999; if (typeof energyFill === 'function') energyFill(f); } catch (e) { f = null; }
    let cards = null; try { cards = f && cardBattleCards(f); } catch (e) { cards = null; }
    if (!cards || !cards.some(c => c.kind === 'move' && c.id === move)) { how = 'a stand-in (the page made no follower with the move here: ' + (cards ? cards.map(c => c.id || c.kind).join(',') : 'no cards') + ')';
      const col = (ELEMENTS.find(x => x.id === d.element) || {}).color || '#19e6c1', pic = id => { try { return _cbArt({ evolved: form }, id); } catch (e) { return null; } };
      cards = [{ kind: 'basic', tag: 'BASIC ATTACK', name: d.shot || d.hit || 'BASIC ATTACK', fx: '', ready: true, turns: 0, col }].concat(d.moves.map(id => ({ kind: 'move', id, tag: 'ATTACK', name: MOVES[id].name, fx: '', ready: true, turns: 0, col, art: pic(id) })),
        [{ kind: 'ult', tag: 'ULTIMATE', name: 'ULTIMATE', fx: '', ready: false, charge: 40, col }, { kind: 'walk', tag: 'MOVE', name: 'MOVE', fx: '', ready: true, tiles: 3, col }]); }
    for (const c of cards) { c.ready = true; c.done = false; if (c.kind === 'move' && c.id === move) c.art = '/__sample.png'; }
    const E = _cbMake(); if (!E) return { err: 'the battle screen was not made' };
    window._cbDom = function () {};   // (no battle is on, so the game would put its battle screen away again every frame: here, in this page only, it is left up)
    const col = cards[0].col, nm = (typeof unitTypeLabel === 'function' && f ? unitTypeLabel(f) : d.name) || d.name;
    document.body.classList.add('cb-on'); E.scr.classList.add('yours'); E.band.classList.add('cb-pop'); E.band.classList.remove('away', 'swap');
    E.row.innerHTML = ''; const el = document.createElement('div'); el.className = 'cb-col'; el.style.setProperty('--c', col); E.row.appendChild(el);
    el.innerHTML = '<div class="cb-chips"><i class="cb-chip now">' + nm + '</i></div><div class="cb-head"><canvas class="cb-pt" width="52" height="52"></canvas><div class="cb-hw"><b class="cb-name">' + nm + '</b><i class="cb-sub">LV ' + ((f && f.level) || 1) + '</i><i class="cb-hbar"><u style="width:100%"></u></i></div><span class="cb-hpn"></span></div><div class="cb-cards">' + cards.map(_cbCardHTML).join('') + '</div>';
    try { if (f && typeof _ccThumb === 'function') _ccThumb(el.querySelector('.cb-pt'), f); } catch (e) {}
    await new Promise(r => setTimeout(r, 1200));
    const rect = n => { const r = n.getBoundingClientRect(); return [r.left, r.top, r.width, r.height].map(v => Math.round(v * 10) / 10); };
    const all = [...el.querySelectorAll('.cb-card')], mine = all.find(n => n.dataset.kind === 'move' && n.dataset.id === move);
    return { how, name: nm, cards: all.map(n => (n.querySelector('.cb-nm') || {}).textContent + (n.classList.contains('art') ? ' [picture]' : '')), mine: mine && rect(mine), band: rect(E.band.querySelector('.cb-col')) };
  }, [FORM, MOVE]);
  if (res.err) { console.error(res.err); await b.close(); srv.close(); process.exit(1); }
  if (!res.mine || !res.mine[2]) { console.error('the card of ' + MOVE + ' is not on the screen'); await b.close(); srv.close(); process.exit(1); }
  const M = res.mine, C = res.band, clip = (x, y, w, h) => p.screenshot({ clip: { x, y, width: w, height: h } });
  const big = await clip(M[0] - 4, M[1] - 4, M[2] + 8, M[3] + 8), band = await clip(C[0] - 4, C[1] - 4, C[2] + 8, C[3] + 8);
  // the picture: the move's card three times its size at the left, the pop-up as the game shows it (every card of the follower, at its real size) at the right
  const bw = (M[2] + 8) * 3, bh = (M[3] + 8) * 3, W2 = Math.ceil(16 + bw + 24 + C[2] + 8 + 16), H2 = Math.ceil(Math.max(bh, C[3] + 8) + 32);
  const q = await ctx.newPage(); await q.setViewportSize({ width: W2, height: H2 });
  await q.setContent('<body style="margin:0;background:#05070f"><img id="b" style="position:absolute;left:16px;top:16px;width:' + bw + 'px;height:' + bh + 'px"><img id="a" style="position:absolute;left:' + (16 + bw + 24) + 'px;top:' + Math.round((H2 - C[3] - 8) / 2) + 'px;width:' + (C[2] + 8) + 'px;height:' + (C[3] + 8) + 'px">');
  await q.evaluate(([a, c]) => new Promise(r => { let n = 2; const done = () => { if (--n === 0) r(); }; for (const [id, src] of [['a', a], ['b', c]]) { const im = document.getElementById(id); im.onload = done; im.src = 'data:image/png;base64,' + src; } }), [band.toString('base64'), big.toString('base64')]);
  await q.screenshot({ path: OUT });
  console.log('wrote ' + OUT + '  ' + res.name + ': ' + res.cards.join(' | ') + '  the card at ' + JSON.stringify(res.mine) + ' (left, top, width, height, CSS px)  ' + res.how + (errs.length ? '  page errors: ' + errs.slice(0, 3).join(' | ') : ''));
  await b.close(); srv.close();
});
