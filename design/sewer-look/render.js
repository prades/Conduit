// THE SEWER LOOK: the pictures (design/sewer-look/drafts.js; Proposed, drafts for the owner, nothing in the game).
//   node design/sewer-look/render.js <out dir> <draft: 0 today's look, 1 faithful, 2 in our look> [spots, comma separated]
// The game's own page in headless Chromium (software WebGL), ?dev&engine=3d, the player put at each spot of the Sewers and the game's own frame drawn; dist/view3d.js is
// served with drafts.js put inside it, after the floor's builder (the file on disk is not changed). Prints the draws and triangles of each picture.
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.resolve(__dirname, '../..'), OUT = process.argv[2], DRAFT = process.argv[3] || '0', ONLY = process.argv[4] ? process.argv[4].split(',') : null;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const MARK = '/* view3d/core.js */';
// THE FLOOR, PUT BACK (found here, 2026-11-22): since build 2026-11-17bz the statements that add each room's floor sit inside the comment at the end of floor.js's line
// `const fm = quadMesh(...)`, so the 3D view draws no room's floor (the ground shows through). The pictures are made with them out of the comment (NOFIX=1: as main has it).
// The view's script is made here in memory from its sources, floor.js so mended; nothing on disk is changed.
const FLOOR = path.join(ROOT, 'design/style-evolution/live/floor.js'), BAD = ": P0.floorSide }]);   // (THE SEWER DUNGEON's risers, the sides of its steps and ledges: the dark concrete, not the lab's pale) fm.receiveShadow";
let VIEWJS = null;
function viewJs() { if (VIEWJS) return VIEWJS; if (process.env.NOFIX) return (VIEWJS = fs.readFileSync(path.join(ROOT, 'dist/view3d.js'), 'utf8'));
  const rfs = fs.readFileSync; fs.readFileSync = function (f, ...a) { const s = rfs.call(fs, f, ...a); if (path.resolve(String(f)) === FLOOR) { if (!s.includes(BAD)) throw new Error('floor.js: the line was not found'); return s.replace(BAD, ": P0.floorSide }]); fm.receiveShadow"); } return s; };
  try { VIEWJS = require(path.join(ROOT, 'tools/view3d.js')).build().js; } finally { fs.readFileSync = rfs; } return VIEWJS; }
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, u === '/' ? 'game.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  if (u === '/dist/view3d.js') { const s = viewJs(), i = s.indexOf(MARK); if (i < 0) throw new Error('no ' + MARK);
    const d = DRAFT === '0' ? '' : 'const SEWER_DRAFT = ' + DRAFT + ';\n' + fs.readFileSync(path.join(__dirname, 'drafts.js'), 'utf8');
    r.writeHead(200, { 'content-type': MIME['.js'] }); r.end(s.slice(0, i) + '\n' + d + '\n' + s.slice(i)); return; }
  if (u === '/js/view3d.js') { r.writeHead(200, { 'content-type': MIME['.js'] }); r.end(fs.readFileSync(f, 'utf8').replace('VIEW3D.error = String((e && e.message) || e);', 'VIEW3D.error = String((e && e.message) || e); console.error("VIEWFAIL " + (e && e.stack));')); return; }   // (a failure's stack, to the log)
  r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
// the spots: [name, player x, y (tiles), zoom, turn]
const SPOTS = [
  ['bridge', 24.5, 44, 1, 0],        // the steel bridge over the main river, from the north ledge
  ['bank', 37, 52.5, 1, 0],          // the south ledge (the walkway) along the river, the broken bridge east
  ['arch', 51, 45.5, 1, 0],          // the service bridge, the river's mouth into the reservoir and the big barred arch in the Nest's north wall
  ['wide', 31, 50, 0.6, 0],          // a wide shot: the river, both ledges, the bridge
];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto(`http://127.0.0.1:${port}/game.html?dev&engine=3d&sharp=2`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && typeof VIEW3D !== 'undefined' && (VIEW3D.state === 'ready' || VIEW3D.state === 'failed'), null, { timeout: 300000 });
  const info = await p.evaluate(() => { try {
    facilityBlackoutSet(false); gameState.running = true; if (_fp.tut && _fp.tut.script) { _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; } if (typeof dialogueClear === 'function') dialogueClear();
    window.requestAnimationFrame = function () { return 0; }; gfxLow = false; _fp.gfxSaved = 'high'; classPickerOpen = false; crystalMenuOpen = false; selectedUnits.clear();
    actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0;
    window.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
    window.__step = n => { for (let i = 0; i < n; i++) { actors = actors.filter(a => !(a instanceof Predator)); render(); } };
    return { ok: true, view: VIEW3D.state, err: VIEW3D.error };
  } catch (e) { return { ok: false, err: String(e && e.stack || e) }; } });
  console.log('setup', JSON.stringify(info), JSON.stringify(await p.evaluate(() => [window.__swInfo, window.__swErr, window.__swLamps])), JSON.stringify(await p.evaluate(() => _fp.F.byId.get('sewers').bb)));
  if (!info.ok || info.view !== 'ready') { console.log(errs.slice(0, 8).join('\n')); await b.close(); srv.close(); process.exit(1); }
  if (process.env.DUMP) { console.log(JSON.stringify(await p.evaluate(() => ({ fl: (() => { const out = []; VIEW3D.view.core.scene.traverse(o => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m && m.map === __swM.floor.map) { const c = o.geometry.attributes.color; out.push([m.type, m.vertexColors, c ? Array.from(c.array.slice(0, 9)).map(v => +v.toFixed(2)) : null, o.geometry.attributes.position.count]); } }); return out.slice(0, 6); })(), info: window.__swInfo })), null, 1)); await b.close(); srv.close(); return; }
  const cost = [];
  for (const [name, x, y, zoom, turn] of SPOTS) {
    if (ONLY && !ONLY.includes(name)) continue;
    const r = await p.evaluate(([x, y, zoom, turn]) => { const R = _fp.F.byId.get('sewers').bb; x += R[0] - 14; y += R[1] - 39; __put(x, y); VIEW_TURN = turn; VIEW3D.turn = turn; __step(4); VIEW3D.zoom = zoom; __step(30);
      // the HUD's DOM panels hidden (the world and the game's own canvas drawing stay)
      if (window.__swDraft) VIEW3D.view.core.scene.background = new THREE.Color(__swDraft.bg).convertSRGBToLinear();
      if (!window.__WITHHUD) { const cv0 = document.getElementById('view3dCanvas'); for (const el of document.querySelectorAll('body *')) if (el !== cv0 && !el.contains(cv0)) el.style.visibility = 'hidden'; }
      const fr = []; for (let i = 0; i < 4; i++) { __step(1); const I = VIEW3D.view.core.renderer.info.render; fr.push([I.calls, I.triangles]); }   // (four frames: the shadows are drawn every other one)
      return { showing: VIEW3D.showing, calls: fr.map(f => f[0]).join('/'), tris: fr.map(f => f[1]).join('/'), room: (facilityRoomAt(Math.round(player.x), Math.round(player.y), _fp.F) || {}).id };
    }, [x, y, zoom, turn]);
    cost.push([name, r]); console.log(name, JSON.stringify(r));
    await p.screenshot({ path: path.join(OUT, DRAFT + '-' + name + '.png'), timeout: 180000 });
  }
  fs.writeFileSync(path.join(OUT, DRAFT + '-cost.json'), JSON.stringify(cost));
  console.log('errors', JSON.stringify(errs.slice(0, 8)));
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
