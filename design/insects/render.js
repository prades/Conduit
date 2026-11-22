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
  await p.goto(`http://127.0.0.1:${port}/game.html?dev&cards&engine=3d&sharp=2&queen3d=1&draft=${DRAFT}`, { waitUntil: 'load' });
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
    const foes = [foe('scout', player.x + 3, player.y + 0.2), foe('scout', player.x + 3.4, player.y + 1.4), foe('scout', player.x + 3.3, player.y - 1.1), foe('tank', player.x + 4.4, player.y + 0.4)];
    const q = foe('boss', player.x + 6, player.y - 0.4); q.dimensions.width *= 3; q.dimensions.height *= 3; foes.push(q);
    const keep = () => { for (const a of foes) { a.health = a.maxHealth; a.state = 'wander'; a.dirX = -1; a.dirY = 0; a.attackAnim = 0; } for (const f of fs3) f.health = f.maxHealth; player.health = player.maxHealth; };
    const tick = n => { for (let i = 0; i < n; i++) { keep(); render(); } };
    tick(4); const chose = cardBattleChoose(foes[0]); tick(140);
    window.__S = { foes, fs3, tick, keep };
    return { ok: true, chose, phase: cardBattlePhase(), n: cardBattleFoes().length, view: VIEW3D.state, err: VIEW3D.error };
  } catch (e) { return { ok: false, err: String(e && e.stack || e) }; } });
  console.log('setup', JSON.stringify(info));
  if (!info.ok) { console.log(errs.slice(0, 5).join('\n')); await b.close(); srv.close(); process.exit(1); }
  await p.evaluate(() => { for (const a of __S.foes) { a.dirX = -1; a.dirY = 0; } __S.tick(6); });
  await p.screenshot({ path: path.join(OUT, PRE + '-battle.png') });
  // close views: a camera of our own on the 3D view's own drawing (its look, its ink line, its shadows), the game's frame stopped
  const shots = [['scout', 0, 2.2, 0.9, -0.7], ['queen', 4, 4.6, 1.6, -0.75], ['line', null, 6.5, 2.2, -0.62]];
  for (const [name, idx, dist, hgt, yaw] of shots) {
    await p.evaluate(([idx, dist, hgt, yaw]) => { const V = VIEW3D.view, T = window.THREE; __S.tick(1);
      const foes = __S.foes, a = idx === null ? null : foes[idx];
      const tx = a ? a.x : (foes[0].x + player.x) / 2, ty = a ? a.y : player.y; const lift = 0; const cv = document.getElementById('view3dCanvas');
      const cam = window.__cam || (window.__cam = new T.PerspectiveCamera(30, cv.clientWidth / cv.clientHeight, 0.1, 200)); cam.aspect = cv.clientWidth / cv.clientHeight; cam.updateProjectionMatrix();
      const aim = new T.Vector3(tx, (idx === 4 ? 0.45 : idx === null ? 0.3 : 0.16), ty); const ang = Math.PI + yaw;
      cam.position.set(tx + Math.cos(ang) * dist, hgt, ty + Math.sin(ang) * dist); cam.lookAt(aim); cam.updateMatrixWorld();
      V.core.aimLight(tx, ty, 14); V.core.draw(cam); }, [idx, dist, hgt, yaw]);
    await p.screenshot({ path: path.join(OUT, PRE + '-' + name + '.png') });
  }
  const tri = await p.evaluate(() => { const V = VIEW3D.view; let out = {}; V.core.scene.traverse(o => { if (!o.isMesh || !o.parent || !o.parent.parent || !o.parent.parent.userData.body) return; });
    return out; });
  console.log('errors', JSON.stringify(errs.slice(0, 6)));
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
