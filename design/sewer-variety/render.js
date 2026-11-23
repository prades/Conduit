// THE SEWER LOOK, VARIETY: the pictures (design/sewer-variety/variety.js; Proposed, drafts for the owner, nothing in the game).
//   [SD=1] node design/sewer-variety/render.js <out dir> <variation: 0 today's (as merged), 1 grating, 2 grating + clutter, 3 round 3: smooth grating, cleaner> [spots, comma separated]
// The game's own page in headless Chromium (software WebGL), ?dev&engine=3d&sewerdungeon, the player put at each spot and the game's own frame drawn; dist/view3d.js is made in memory from
// its sources (tools/view3d.js) and served with variety.js put inside it after the merged sewerdress.js, which it takes the place of (nothing on disk is changed). Prints each picture's
// draws and triangles, and the posts', tanks' and clutter's guard (does anything standing hide a body on a tile one can stand on, in any of the four quarter turns: tests/view3d.js's check).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.resolve(__dirname, '../..'), OUT = process.argv[2], VAR = process.argv[3] || '0', ONLY = process.argv[4] ? process.argv[4].split(',') : null, SD = !!process.env.SD;   // (SD=1: the sewer dungeon's spots, with ?sewerdungeon; else the Sewers', without: with it the Sewers' water shows as cleaned)
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const MARK = '/* view3d/core.js */';
let VIEWJS = null; const viewJs = () => VIEWJS || (VIEWJS = process.env.DIST ? fs.readFileSync(path.join(ROOT, 'dist/view3d.js'), 'utf8') : require(path.join(ROOT, 'tools/view3d.js')).build().js);   // (DIST=1: the built dist/view3d.js as it is on disk)
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, u === '/' ? 'game.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  if (u === '/dist/view3d.js' && !(process.env.DIST && VAR === '0')) { const s = viewJs(), i = s.indexOf(MARK); if (i < 0) throw new Error('no ' + MARK);
    const d = VAR === '0' ? '' : 'const SEWER_VARIETY = ' + VAR + ';\n' + fs.readFileSync(path.join(__dirname, 'variety.js'), 'utf8');
    r.writeHead(200, { 'content-type': MIME['.js'] }); r.end(s.slice(0, i) + '\n' + d + '\n' + s.slice(i)); return; }
  r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
// the spots: [name, player x, y (the map's own tiles, as today's pictures: scratchpad/sewer-built/cost.json), zoom, turn]
const SPOTS = [
  ['bridge', -39, 108.5, 1, 0],          // the steel bridge over the main river, from the north ledge
  ['bank', -26.5, 117, 1, 0],            // the south ledge (the walkway) along the river, the broken bridge east
  ['arch', -12.5, 110, 1, 0],            // the service bridge, the river's mouth into the reservoir and the big barred arch
  ['wide', -32.5, 114.5, 0.6, 0],        // wide: the river, both ledges, the bridge
  ['sd-west', -226, 265.5, 1, 0],        // THE SEWER DUNGEON (?sewerdungeon): the west walkway
  ['sd-central', -201.5, 268, 1, 0],     // its central walkway
  ['sd-ring', -216.5, 298, 1, 0],        // the ring by the junction nest
  ['close', -41.5, 107, 1.8, 0],         // a grate close, by a lamp on the north ledge (zoomed in all the way the game lets)
  ['bank-t1', -26.5, 117, 1, 1], ['bank-t2', -26.5, 117, 1, 2], ['bank-t3', -26.5, 117, 1, 3],   // the four quarter turns
];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 }); if (process.env.RK) await p.addInitScript(k => { window.__RK = k; }, +process.env.RK);
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto(`http://127.0.0.1:${port}/game.html?dev&engine=3d&sharp=2${SD ? '&sewerdungeon' : ''}`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && typeof VIEW3D !== 'undefined' && (VIEW3D.state === 'ready' || VIEW3D.state === 'failed'), null, { timeout: 300000 });
  const info = await p.evaluate(() => { try {
    facilityBlackoutSet(false); gameState.running = true; if (_fp.tut && _fp.tut.script) { _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; } if (typeof dialogueClear === 'function') dialogueClear();
    window.requestAnimationFrame = function () { return 0; }; gfxLow = false; _fp.gfxSaved = 'high'; classPickerOpen = false; crystalMenuOpen = false; selectedUnits.clear();
    actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0;
    window.__put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
    window.__step = n => { for (let i = 0; i < n; i++) { actors = actors.filter(a => !(a instanceof Predator)); render(); } };
    return { ok: true, view: VIEW3D.state, err: VIEW3D.error };
  } catch (e) { return { ok: false, err: String(e && e.stack || e) }; } });
  // the guard (tests/view3d.js's own check, the same numbers): the triangles of everything standing, against a body's feet and middle on every tile one can stand on, in each quarter turn
  const guard = await p.evaluate(() => { const V = VIEW3D.view, W = V.world, L = W.sewerLook; if (!L) return { err: W.sewerLookError || 'not dressed' }; const UHh = 73.48469228349533, v = new THREE.Vector3(), tris = []; let n = 0; const where = [];
    L.standing.forEach(m => { m.updateMatrixWorld(); const p = m.geometry.attributes.position, ix = m.geometry.index, cnt = ix ? ix.count : p.count; for (let i = 0; i < cnt; i += 3) { const t3 = []; for (let k = 0; k < 3; k++) t3.push(v.fromBufferAttribute(p, ix ? ix.getX(i + k) : i + k).applyMatrix4(m.matrixWorld).toArray()); tris.push(t3); } });
    for (let t = 0; t < 4; t++) { const scr = (x, y, z) => { const u = [x, -z, -x, z][t], vv = [z, x, -z, -x][t]; return [(u - vv) * 60, (u + vv) * 30 - y * UHh, (u + vv) * 0.612 + y * 0.5]; };
      const T2 = tris.map(q => { const a = scr(...q[0]), b = scr(...q[1]), c = scr(...q[2]); return { a, b, c, x0: Math.min(a[0], b[0], c[0]), x1: Math.max(a[0], b[0], c[0]), y0: Math.min(a[1], b[1], c[1]), y1: Math.max(a[1], b[1], c[1]) }; });
      const covers = (q, P) => { if (P[0] < q.x0 || P[0] > q.x1 || P[1] < q.y0 || P[1] > q.y1) return false; const den = (q.b[1] - q.c[1]) * (q.a[0] - q.c[0]) + (q.c[0] - q.b[0]) * (q.a[1] - q.c[1]); if (Math.abs(den) < 1e-9) return false;
        const l1 = ((q.b[1] - q.c[1]) * (P[0] - q.c[0]) + (q.c[0] - q.b[0]) * (P[1] - q.c[1])) / den, l2 = ((q.c[1] - q.a[1]) * (P[0] - q.c[0]) + (q.a[0] - q.c[0]) * (P[1] - q.c[1])) / den, l3 = 1 - l1 - l2; if (l1 < -1e-6 || l2 < -1e-6 || l3 < -1e-6) return false; return l1 * q.a[2] + l2 * q.b[2] + l3 * q.c[2] > P[2] + 0.05; };
      L.rooms.forEach(id => W.rooms[id].rec.cells.forEach(c => { if (!L.walk(c[0], c[1])) return; const h = (c[2] || 0) / UHh; if ([0.15, 0.6].some(lift => { const P = scr(c[0], h + lift, c[1]); return T2.some(q => covers(q, P)); })) { n++; if (where.length < 6) where.push('turn ' + t + ': ' + id + ' ' + c[0] + ',' + c[1]); } })); }
    return { hidden: n, where, standing: L.standing.length, rooms: L.rooms.length, lamps: L.lamps, variety: window.__swVariety || null, err: W.sewerLookError || null }; });
  console.log('setup', JSON.stringify(info), 'guard', JSON.stringify(guard)); if (process.env.EVAL) console.log('eval', JSON.stringify(await p.evaluate(process.env.EVAL)));
  if (!info.ok || info.view !== 'ready') { console.log(errs.slice(0, 8).join('\n')); await b.close(); srv.close(); process.exit(1); }
  const cost = [];
  for (const [name, x, y, zoom, turn] of SPOTS) {
    if (ONLY && !ONLY.includes(name)) continue; if (SD !== name.startsWith('sd-')) continue;
    const r = await p.evaluate(([x, y, zoom, turn]) => { __put(x, y); VIEW_TURN = turn; VIEW3D.turn = turn; __step(4); VIEW3D.zoom = zoom; __step(30);
      const cv0 = document.getElementById('view3dCanvas'); for (const el of document.querySelectorAll('body *')) if (el !== cv0 && !el.contains(cv0)) el.style.visibility = 'hidden';   // (the HUD's panels hidden)
      const fr = []; for (let i = 0; i < 4; i++) { __step(1); const I = VIEW3D.view.core.renderer.info.render; fr.push([I.calls, I.triangles]); }   // (four frames: the shadows are drawn every other one)
      return { showing: VIEW3D.showing, calls: fr.map(f => f[0]).join('/'), tris: fr.map(f => f[1]).join('/'), room: (facilityRoomAt(Math.round(player.x), Math.round(player.y), _fp.F) || {}).id };
    }, [x, y, zoom, turn]);
    cost.push([name, r]); console.log(name, JSON.stringify(r));
    if (process.env.PROBE) console.log('probe', JSON.stringify(await p.evaluate(pts => pts.map(([px, py]) => { try { const V = VIEW3D.view, cv = document.getElementById('view3dCanvas'), R = cv.getBoundingClientRect(), ray = new THREE.Raycaster(), cam = V.core.camera || V.camera;
      if (!cam) return 'no camera: ' + Object.keys(V.core).join(','); ray.setFromCamera({ x: (px - R.left) / R.width * 2 - 1, y: -((py - R.top) / R.height) * 2 + 1 }, cam); const L = []; V.core.scene.traverse(o => { if (o.isMesh && o.visible) { const m2 = o.layers.mask; o.userData._lm = m2; o.layers.mask = 0xffffffff; L.push(o); } }); const hit0 = []; for (const o of L) { try { o.raycast(ray, hit0); } catch (e) {} } hit0.sort((a, b) => a.distance - b.distance); L.forEach(o => o.layers.mask = o.userData._lm); const hit = hit0.filter(h => h.object.visible)[0];
      if (!hit) { const W = V.world, out = []; for (const yy of [-2.5, -1.44, -0.5, 0, 0.5]) { const t = (yy - ray.ray.origin.y) / ray.ray.direction.y, x = ray.ray.origin.x + ray.ray.direction.x * t, z = ray.ray.origin.z + ray.ray.direction.z * t, b = W.band.get(Math.round(x) + ',' + Math.round(z)), r = W.roomAt(x, z); out.push([yy, +x.toFixed(1), +z.toFixed(1), r && (r.id || r), b ? { own: b.own, hi: +b.hi.toFixed(2), lo: +b.lo.toFixed(2), hides: b.hides && b.hides.map(h => h.length).join('') } : null]); } return { none: out }; } const o = hit.object, m = [].concat(o.material)[hit.face && o.geometry.groups.length ? (o.geometry.groups.find(g => hit.faceIndex * 3 >= g.start && hit.faceIndex * 3 < g.start + g.count) || {}).materialIndex || 0 : 0];
      let path = []; for (let q = o; q; q = q.parent) path.push(q.name || q.type + (q.userData.merged ? '(m)' : '')); return { p: hit.point.toArray().map(v => +v.toFixed(2)), n: hit.face && hit.face.normal.toArray().map(v => +v.toFixed(2)), mat: m && m.type, col: m && m.color && m.color.getHexString(), map: !!(m && m.map), vc: m && m.vertexColors, path: path.slice(0, 5).join('<') }; } catch (e) { return String(e.stack).slice(0, 300); } }), JSON.parse(process.env.PROBE))));
    await p.screenshot({ path: path.join(OUT, VAR + '-' + name + '.png'), timeout: 180000 });
  }
  fs.writeFileSync(path.join(OUT, VAR + (SD ? '-sd' : '') + '-cost.json'), JSON.stringify({ guard, cost }));
  console.log('errors', JSON.stringify(errs.slice(0, 8)));
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
