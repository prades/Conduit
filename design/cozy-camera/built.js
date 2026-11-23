// THE LOW CAMERA, AS BUILT: pictures and costs of the real built files (dist/view3d.js, game.html) under the switch, ?cam=low (view3d/lowcam.js; docs/VIEW-3D.md §8). Not a test.
//   node design/cozy-camera/built.js <out dir> [low|today] [spots, comma separated] [--ui] [--nohorizon]
// The game's own page in headless Chromium (software WebGL: its times say nothing of an iPad), ?dev&cards&engine=3d (&cam=low), the player and a squad of three put at the drafts' spots
// (design/cozy-camera/render.js) and the game's own frames drawn; then a tap on a tile and a card battle. --ui: the 2D over the picture shown too (else only the 3D picture).
// Prints each picture's draws, triangles, the view's time a frame and the frame's; writes <out>/<low|today>-cost.json.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.resolve(__dirname, '../..'), OUT = process.argv[2], MODE = process.argv[3] === 'today' ? 'today' : 'low', ONLY = process.argv[4] && !process.argv[4].startsWith('--') ? process.argv[4].split(',') : null;
const UI = process.argv.includes('--ui'), NOHZ = process.argv.includes('--nohorizon'), NAME = MODE + (NOHZ ? '-nohz' : '') + (UI ? '-ui' : '');
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, u === '/' ? 'game.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
const SPOTS = [
  ['chamber', { room: 'crystal_chamber', frac: 0.5 }, 1, 0],
  ['hallway', { room: 'lab_hallway', frac: 0.5 }, 1, 0],
  ['arena', { room: 'arena', frac: 0.5 }, 1, 0],
  ['sewers', { xy: [-39, 108.5] }, 1, 0],
  ['sewers2', { xy: [-26.5, 117] }, 1, 0],
  ['chamber-t1', { room: 'crystal_chamber', frac: 0.5 }, 1, 1],
  ['chamber-t2', { room: 'crystal_chamber', frac: 0.5 }, 1, 2],
  ['chamber-t3', { room: 'crystal_chamber', frac: 0.5 }, 1, 3],
  ['chamber-z06', { room: 'crystal_chamber', frac: 0.5 }, 0.6, 0],
  ['chamber-z18', { room: 'crystal_chamber', frac: 0.5 }, 1.8, 0],
];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto(`http://127.0.0.1:${port}/game.html?dev&cards&engine=3d&sharp=2${MODE === 'low' ? '&cam=low' : ''}`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && typeof VIEW3D !== 'undefined' && (VIEW3D.state === 'ready' || VIEW3D.state === 'failed'), null, { timeout: 300000 });
  const info = await p.evaluate(nohz => { try {
    if (nohz && VIEW3D.view && VIEW3D.view.low) VIEW3D.view.low.K.horizon = false;
    facilityBlackoutSet(false); gameState.running = true; if (_fp.tut && _fp.tut.script) { _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; } if (typeof dialogueClear === 'function') dialogueClear();
    window.requestAnimationFrame = function () { return 0; }; gfxLow = false; _fp.gfxSaved = 'high'; classPickerOpen = false; crystalMenuOpen = false; selectedUnits.clear();
    actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0;
    window.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
    const cells = partyRoomCells('crystal_chamber'), c0 = cells[Math.floor(cells.length * 0.5)]; __put(c0[0], c0[1]);
    const mk = (ev, dx, dy) => { const D = EVOLUTIONS[ev]; spawnFollowerAtCrystal(D.element); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.x = player.x + dx; f.y = player.y + dy;
      f.element = D.element; f.role = D.role; f.evolved = ev; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); if (typeof energyFill === 'function') energyFill(f); f.health = f.maxHealth = 1e6; return f; };
    window.__squad = [mk('maw', -0.9, 0.9), mk('embercowl', 0.9, 0.9), mk('thunderhead', 0.0, 1.5)];
    window.__offs = [[-0.9, 0.9], [0.9, 0.9], [0.0, 1.5]];
    window.__near = () => { const t = VIEW_TURN || 0, R = [[1, 0, 0, 1], [0, -1, 1, 0], [-1, 0, 0, -1], [0, 1, -1, 0]][t]; __squad.forEach((f, i) => { const o = __offs[i], dx = o[0] * R[0] + o[1] * R[1], dy = o[0] * R[2] + o[1] * R[3], q = _fpNearestCellOpen(player.x + dx, player.y + dy); f.x = q[0]; f.y = q[1]; f.dirX = 0; f.dirY = -1; f.state = 'idle'; }); };
    window.__step = n => { for (let i = 0; i < n; i++) { actors = actors.filter(a => !(a instanceof Predator) || (window.__keepFoes && window.__keepFoes.includes(a))); render(); } };
    return { ok: true, view: VIEW3D.state, err: VIEW3D.error, cam: VIEW3D.cam };
  } catch (e) { return { ok: false, err: String(e && e.stack || e) }; } }, NOHZ);
  console.log('setup', JSON.stringify(info));
  if (!info.ok || info.view !== 'ready') { console.log(errs.slice(0, 8).join('\n')); await b.close(); srv.close(); process.exit(1); }
  const hide = () => UI ? null : p.evaluate(() => { const cv0 = document.getElementById('view3dCanvas'); for (const el of document.querySelectorAll('body *')) if (el !== cv0 && !el.contains(cv0)) el.style.visibility = 'hidden'; });
  const place = (where, zoom, turn) => p.evaluate(([where, zoom, turn]) => { let x, y; if (where.room) { const cells = partyRoomCells(where.room); const c = cells[Math.floor(cells.length * where.frac)]; x = c[0]; y = c[1]; } else [x, y] = where.xy;
    __put(x, y); VIEW_TURN = turn; VIEW3D.turn = turn; VIEW3D.zoom = zoom; __near(); VIEW3D.view.show(true); __step(3); __near(); __step(2); __near(); __step(2); return [x, y]; }, [where, zoom, turn]);
  const cost = () => p.evaluate(() => { const gl = VIEW3D.view.core.renderer.getContext(), px = new Uint8Array(4), fr = [], wall = []; let culled = 0; for (let i = 0; i < 6; i++) { __near(); const t0 = performance.now(); __step(1); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); wall.push(performance.now() - t0); const s = VIEW3D.view.stats; fr.push([s.draws, s.tris, s.ms]); const L = VIEW3D.view.lowInfo && VIEW3D.view.lowInfo(); if (L) culled = L.culled; }
    const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    return { showing: VIEW3D.showing, draws: med(fr.map(f => f[0])), tris: med(fr.map(f => f[1])), viewMs: +med(fr.map(f => f[2])).toFixed(0), frameMs: +med(wall).toFixed(0), culledByHorizon: culled, room: (facilityRoomAt(Math.round(player.x), Math.round(player.y), _fp.F) || {}).id }; });
  const results = {};
  await hide();
  for (const [name, where, zoom, turn] of SPOTS) {
    if (ONLY && !ONLY.includes(name)) continue;
    const xy = await place(where, zoom, turn);
    const r = await cost(); r.at = xy; results[name] = r; console.log(name, JSON.stringify(r));
    await hide(); await p.screenshot({ path: path.join(OUT, NAME + '-' + name + '.png'), timeout: 180000 });
  }
  await p.evaluate(() => { VIEW3D.turn = 0; VIEW_TURN = 0; VIEW3D.zoom = 1; });
  // ── a tap on a tile: the tile three to the right and two ahead of the player, through the game's own tap (js/input.js handleInput), and where it sends the player ──
  if (!ONLY || ONLY.includes('tap')) {
    const t = await p.evaluate(() => { try { const cells = partyRoomCells('crystal_chamber'), c0 = cells[Math.floor(cells.length * 0.5)]; __put(c0[0], c0[1]); __near(); __step(4);
      const V = VIEW3D.view, tgt = [Math.round(player.x) + 2, Math.round(player.y) - 2], h = facilityLiftPx(tgt[0], tgt[1]), s = V.screenNow(tgt[0], tgt[1], h);
      const back = typeof techScreenToWorld === 'function' ? techScreenToWorld(s[0], s[1]) : null; window.__tapAt = s;
      let went = null; if (typeof handleInput === 'function') { handleInput(s[0], s[1]); went = player.fpPath && player.fpPath.length ? player.fpPath[player.fpPath.length - 1] : [player.targetX, player.targetY]; }
      __step(1); return { tile: tgt, screen: s.map(v => +v.toFixed(1)), back: back && [+back.x.toFixed(2), +back.y.toFixed(2)], went }; } catch (e) { return { err: String(e && e.stack || e) }; } });
    console.log('tap', JSON.stringify(t)); results.tap = t;
    await hide(); await p.evaluate(() => { const c = document.createElement('div'), s = window.__tapAt, r = document.getElementById('cavernCanvas').getBoundingClientRect(), k = r.width / canvas.width;
      c.id = '__tapMark'; c.style.cssText = 'position:fixed;z-index:99;width:22px;height:22px;margin:-11px 0 0 -11px;border:3px solid #ff3b7f;border-radius:50%;pointer-events:none;visibility:visible;left:' + (r.left + s[0] * k) + 'px;top:' + (r.top + s[1] * k) + 'px'; document.body.appendChild(c); });
    await p.screenshot({ path: path.join(OUT, NAME + '-tap.png'), timeout: 180000 }); await p.evaluate(() => { const c = document.getElementById('__tapMark'); if (c) c.remove(); });
  }
  // ── a card battle in the Crystal Chamber: three ants against the squad; in it, then eased back out ──
  if (!ONLY || ONLY.includes('battle')) {
    const bi = await p.evaluate(() => { try { const cells = partyRoomCells('crystal_chamber'), c0 = cells[Math.floor(cells.length * 0.5)]; __put(c0[0], c0[1]); VIEW_TURN = 0; VIEW3D.turn = 0; VIEW3D.zoom = 1; __near();
      const foe = (cls, x, y) => { const e = spawnCreature({ species: 'ant', className: cls }), q = _fpNearestCellOpen(x, y); e.x = q[0]; e.y = q[1]; e.health = e.maxHealth = 1e6; e.provoked = false; e.state = 'wander'; e.moveSpeed = e.baseMoveSpeed = 0; return e; };
      const foes = [foe('scout', player.x + 3, player.y + 0.2), foe('striker', player.x + 3.4, player.y + 1.4), foe('tank', player.x + 3.3, player.y - 1.1)]; window.__keepFoes = foes;
      const keep = () => { for (const a of foes) { a.health = a.maxHealth; a.state = 'wander'; a.dirX = -1; a.dirY = 0; a.attackAnim = 0; } for (const f of __squad) f.health = f.maxHealth; player.health = player.maxHealth; };
      window.__bt = n => { for (let i = 0; i < n; i++) { keep(); render(); } };
      __bt(4); const chose = cardBattleChoose(foes[0]); const V = VIEW3D.view; V.dry(true); __bt(150); V.dry(false); __bt(3); if (typeof dialogueClear === 'function') dialogueClear();
      const L = V.lowInfo && V.lowInfo(); return { chose, phase: cardBattlePhase(), n: cardBattleFoes().length, camK: GM_k(), low: L && { fov: +L.fov.toFixed(3), k: L.k, focusD: +L.focusD.toFixed(1) } };
      function GM_k() { const B = typeof cardBattleCam === 'function' ? cardBattleCam() : null; return B ? +B.k.toFixed(3) : 0; } } catch (e) { return { err: String(e && e.stack || e) }; } });
    console.log('battle', JSON.stringify(bi));
    const r = await p.evaluate(() => { const fr = []; for (let i = 0; i < 4; i++) { __bt(1); const s = VIEW3D.view.stats; fr.push([s.draws, s.tris, s.ms]); } return { draws: fr.map(f => f[0]).join('/'), tris: fr.map(f => f[1]).join('/'), viewMs: +fr.map(f => f[2]).sort((a, b) => a - b)[2].toFixed(0), bodies: VIEW3D.view.stats.bodies, seeing: VIEW3D.view.seeingThrough() }; });
    results.battle = Object.assign(r, bi); console.log('battle', JSON.stringify(r));
    await hide(); await p.screenshot({ path: path.join(OUT, NAME + '-battle.png'), timeout: 180000 });
    // halfway out, then all the way back to the follow camera
    const out = await p.evaluate(() => { try { if (typeof cardBattleEnd === 'function') cardBattleEnd(); } catch (e) {} window.__keepFoes = null; actors = actors.filter(a => !(a instanceof Predator));
      const V = VIEW3D.view; let n = 0; while (n < 200) { __step(1); n++; const B = typeof cardBattleCam === 'function' ? cardBattleCam() : null; if (!B || B.k < 0.5) break; }
      const L = V.lowInfo && V.lowInfo(); return { framesToHalf: n, low: L && { fov: +L.fov.toFixed(2), k: L.k } }; });
    console.log('battle-out', JSON.stringify(out)); await hide(); await p.screenshot({ path: path.join(OUT, NAME + '-battle-easing.png'), timeout: 180000 });
    const back = await p.evaluate(() => { const V = VIEW3D.view; V.dry(true); __step(120); V.dry(false); __step(2); const L = V.lowInfo && V.lowInfo(); return { battleCam: typeof cardBattleCam === 'function' ? cardBattleCam() : null, low: L && { fov: L.fov, k: L.k } }; });
    console.log('battle-back', JSON.stringify(back)); results.battleBack = back; await hide(); await p.screenshot({ path: path.join(OUT, NAME + '-battle-after.png'), timeout: 180000 });
  }
  fs.writeFileSync(path.join(OUT, NAME + '-cost.json'), JSON.stringify(results, null, 1));
  console.log('low', JSON.stringify(await p.evaluate(() => VIEW3D.view.lowInfo ? VIEW3D.view.lowInfo() : null)));
  console.log('errors', JSON.stringify(errs.filter(e => !/GPU stall/.test(e)).slice(0, 10)));
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
