// MORE MENACING INSECTS: the pictures (design/insects/drafts.js; Proposed, drafts for the owner, nothing in the game).
//   node design/insects/render.js <out dir> <draft: 0 for today's look, or A, B, ...> [prefix]
// The game's own page in headless Chromium (software WebGL), ?dev&cards&engine=3d, a card battle in the Crystal Chamber (the lab floor) with the player, three
// followers, three ant scouts, an ant tank and THE ANT QUEEN (drawn as an ant body: ?queen3d=1), at the battle's own camera; then close 3/4 views by a camera
// of this script's. dist/view3d.js is served with drafts.js put inside it (the file on disk is not changed).
const http = require('http'), fs = require('fs'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.resolve(__dirname, '../..'), OUT = process.argv[2], DRAFT = process.argv[3] || '0', PRE = process.argv[4] || DRAFT;
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const MARK = '/* design/style-evolution/live/floor.js */';
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, u === '/' ? 'game.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  if (u === '/dist/view3d.js') { const s = fs.readFileSync(f, 'utf8'), i = s.indexOf(MARK); if (i < 0) throw new Error('no ' + MARK);
    r.writeHead(200, { 'content-type': MIME['.js'] }); r.end(s.slice(0, i) + '\n' + fs.readFileSync(path.join(__dirname, 'drafts.js'), 'utf8') + '\n' + s.slice(i)); return; }
  r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto(`http://127.0.0.1:${port}/game.html?dev&cards&engine=3d&sharp=2&queen3d=1&draft=${DRAFT}`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && typeof VIEW3D !== 'undefined' && (VIEW3D.state === 'ready' || VIEW3D.state === 'failed'), null, { timeout: 240000 });
  const info = await p.evaluate(() => { try {
    facilityBlackoutSet(false); gameState.running = true; if (_fp.tut && _fp.tut.script) { _fp.tut.script.step = TUT_STEPS.length; _fp.tut.script.doneAt = 3; } if (typeof dialogueClear === 'function') dialogueClear();
    window.requestAnimationFrame = function () { return 0; }; gfxLow = false; _fp.gfxSaved = 'high'; classPickerOpen = false; crystalMenuOpen = false; selectedUnits.clear();
    const put = (x, y) => { player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null; };
    actors = actors.filter(a => !(a instanceof Predator) && !a.isClone && !a.isFollower); followers.length = 0; for (const k in followerByElement) followerByElement[k].length = 0;
    const cells = partyRoomCells('crystal_chamber'), c0 = cells[Math.floor(cells.length * 0.5)]; put(c0[0], c0[1]);
    const mk = (ev, dx, dy) => { const D = EVOLUTIONS[ev]; spawnFollowerAtCrystal(D.element); const f = followers[followers.length - 1]; f.returningToCrystal = false; f.spawnProtection = 0; f.x = player.x + dx; f.y = player.y + dy;
      f.element = D.element; f.role = D.role; f.evolved = ev; f._moltAt = -1e9; f.level = 20; _applyFollowerLevel(f, true); if (typeof energyFill === 'function') energyFill(f); f.health = f.maxHealth = 1e6; return f; };
    const fs3 = [mk('maw', 0.4, 0.8), mk('embercowl', 0.9, -0.3), mk('thunderhead', 0.2, -0.9)]; partyTick();
    const foe = (cls, x, y) => { const e = spawnCreature({ species: 'ant', className: cls }), q = _fpNearestCellOpen(x, y); e.x = q[0]; e.y = q[1]; e.health = e.maxHealth = 1e6; e.provoked = false; e.state = 'wander'; e.moveSpeed = e.baseMoveSpeed = 0; return e; };
    const foes = [foe('scout', player.x + 3, player.y + 0.2), foe('scout', player.x + 3.4, player.y + 1.4), foe('tank', player.x + 3.3, player.y - 1.1)];
    const q = foe('boss', player.x + 4.6, player.y + 0.2); q.dimensions.width *= 3; q.dimensions.height *= 3; foes.push(q);
    const keep = () => { for (const a of foes) { a.health = a.maxHealth; a.state = 'wander'; a.dirX = -1; a.dirY = 0; a.attackAnim = 0; } for (const f of fs3) f.health = f.maxHealth; player.health = player.maxHealth; };
    const tick = n => { for (let i = 0; i < n; i++) { keep(); render(); } };
    tick(4); const chose = cardBattleChoose(foes[0]); tick(140);
    window.__S = { foes, fs3, tick, keep };
    return { ok: true, chose, phase: cardBattlePhase(), n: cardBattleFoes().length, view: VIEW3D.state, err: VIEW3D.error };
  } catch (e) { return { ok: false, err: String(e && e.stack || e) }; } });
  console.log('setup', JSON.stringify(info));
  if (!info.ok) { console.log(errs.slice(0, 5).join('\n')); await b.close(); srv.close(); process.exit(1); }
  // THE QUEEN a step back from the line, clear of the scouts in front of her (her squares are the battle's; she is three times their size)
  await p.evaluate(() => { const q = __S.foes[3], c = _fpNearestCellOpen(q.x + 1.3, q.y - 0.5); q.x = c[0]; q.y = c[1]; for (const a of __S.foes) { a.dirX = -1; a.dirY = 0; } __S.tick(6); });
  await p.screenshot({ path: path.join(OUT, PRE + '-battle.png') });
  // close views: a camera of our own on the 3D view's own drawing (its look, its ink line, its shadows), the game's frame stopped
  const shots = [['scout', 0, 1.45, 0.6, 0.75], ['tank', 2, 1.95, 0.8, +(process.env.TANKYAW || 0.75)], ['queen', 3, 4.6, 2.1, 0.75], ['side', 0, 1.35, 0.32, 1.57]];
  await p.evaluate(() => { canvas.style.visibility = 'hidden'; const V = VIEW3D.view, sc = V.core.scene, cv0 = document.getElementById('view3dCanvas');
    for (const el of document.querySelectorAll('body *')) if (el !== cv0 && !el.contains(cv0)) el.style.visibility = 'hidden';   // (the HUD's panels: the close views show the 3D drawing alone)
    window.__solo = keep => sc.traverse(o => { if (o.userData && o.userData.body) { if (o.userData._was === undefined) o.userData._was = o.visible; o.visible = keep ? (o === keep) : o.userData._was; } });
    window.__holderOf = a => { let best = null, bd = 0.6; sc.traverse(o => { if (o.userData && o.userData.body && o.visible) { const d = Math.hypot(o.position.x - a.x, o.position.z - a.y); if (d < bd) { bd = d; best = o; } } }); return best; };
    const cv = document.getElementById('view3dCanvas'); window.__cam = new THREE.PerspectiveCamera(30, cv.clientWidth / cv.clientHeight, 0.05, 200);
    // a camera before the body, `yaw` round from straight ahead, `dist` away, `hgt` up, looking at its middle
    window.__aim = (h, dist, hgt, yaw, look) => { const T = THREE, cam = __cam, ry = h.rotation.y, fx = Math.cos(ry), fz = -Math.sin(ry), a = Math.atan2(fz, fx) + yaw;
      cam.aspect = cv.clientWidth / cv.clientHeight; cam.updateProjectionMatrix(); cam.position.set(h.position.x + Math.cos(a) * dist, h.position.y + hgt, h.position.z + Math.sin(a) * dist);
      cam.lookAt(new T.Vector3(h.position.x, h.position.y + look, h.position.z)); cam.updateMatrixWorld(); V.core.aimLight(h.position.x, h.position.z, 14); V.core.draw(cam); }; });
  for (const [name, idx, dist, hgt, yaw] of shots) {
    const ok = await p.evaluate(([idx, dist, hgt, yaw]) => { __solo(null); const a = __S.foes[idx], h = __holderOf(a); if (!h) return false; if (idx !== 3) __solo(h); __aim(h, dist, hgt, yaw, idx === 3 ? 0.3 : 0.12); return true; }, [idx, dist, hgt, yaw]);
    if (!ok) { console.log('no body for', name); continue; }
    await (await p.$('#view3dCanvas')).screenshot({ path: path.join(OUT, PRE + '-' + name + '.png') });
  }
  // triangles in one body (one pose: the view shows one of its poses at a time), today's builder or the draft's
  const tri = await p.evaluate(() => { const count = g => { let n = 0; g.traverse(o => { if (o.isMesh && o.geometry) { const gg = o.geometry; n += (gg.index ? gg.index.count : gg.attributes.position.count) / 3; } }); return Math.round(n); };
    const K = window.__antKit; return { scout: count(K.build({ cls: 'scout', size: 0.5, zk: 2, walk: 0, stand: true })), tank: count(K.build({ cls: 'tank', size: 0.5, zk: 2, walk: 0, stand: true })), queen: count(K.build({ cls: 'boss', size: 1.5, zk: 2, walk: 0, stand: true })) }; });
  console.log('triangles', JSON.stringify(tri));
  // THE CLIP (with CLIP=1): the scout's skittering walk and its strike, posed by this script (bursts of quick steps, a twitch of the head-on turn, a pause; then the
  // strike: sickles and jaws), drawn by the view's own drawing at the close camera
  if (process.env.CLIP) {
    const dir = path.join(OUT, PRE + '-clip'); fs.mkdirSync(dir, { recursive: true });
    const n = await p.evaluate(() => { const V = VIEW3D.view, T = window.THREE, K = window.__antKit, a = __S.foes[0], sc = V.core.scene;
      __solo(null); const body = __holderOf(a); __solo({});   // (every body of the battle hidden: the clip's scout alone)
      const y0 = body ? body.position.y : 0; if (body) body.visible = false;
      const mk = o => { const g = K.build(Object.assign({ cls: 'scout', size: 0.5, zk: 2, accent: a.color }, o)); K.toonify(g, V.core.ctx.grad); const h = new T.Group(); h.add(g); h.visible = false; V.core.tagInk(h); sc.add(h); return h; };
      const walk = [0, 0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875].map(w => mk({ walk: w })), stand = mk({ walk: 0, stand: true }), hit = [0.05, 0.12, 0.2, 0.3].map(op => mk({ walk: 0.3, open: op }));
      // the script: [pose, dx, yaw twitch] a frame
      const F = []; let x = 0.9, wi = 0;
      for (const burst of [6, 7, 5]) { for (let i = 0; i < burst; i++) { F.push([walk[wi++ % 8], x, 0]); x -= 0.055; } const tw = (F.length % 2 ? 1 : -1) * 0.28; F.push([stand, x, tw]); F.push([stand, x, tw]); F.push([stand, x, tw * 0.4]); F.push([stand, x, 0]); F.push([stand, x, 0]); }
      for (const k of [0, 0, 1, 2, 3, 3, 3, 3, 2, 1, 0]) F.push([hit[k], x - (k === 3 ? 0.06 : 0), 0]);
      for (let i = 0; i < 6; i++) F.push([stand, x, 0]);
      window.__clip = { F, x0: body ? body.position.x : a.x, y: body ? body.position.z : a.y, y0, all: walk.concat([stand], hit) }; return F.length; });
    for (let i = 0; i < n; i++) {
      await p.evaluate(i => { const V = VIEW3D.view, T = window.THREE, C = window.__clip, [h, dx, tw] = C.F[i]; for (const q of C.all) q.visible = false;
        h.visible = true; h.position.set(C.x0 + dx, C.y0, C.y); h.rotation.y = Math.PI + tw; h.updateMatrixWorld(true);
        const fake = { position: new T.Vector3(C.x0 - 0.25, C.y0, C.y), rotation: { y: Math.PI } }; __aim(fake, 2.0, 0.75, 0.75, 0.1); }, i);
      await (await p.$('#view3dCanvas')).screenshot({ path: path.join(dir, String(i).padStart(3, '0') + '.png') });
    }
    console.log('clip frames', n);
  }
  console.log('errors', JSON.stringify(errs.slice(0, 6)));
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
