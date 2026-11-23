// THE COZY CAMERA: the pictures and clips (design/cozy-camera/cozy.js; Proposed, drafts for the owner, nothing in the game). After design/sewer-variety/render.js and design/clones/render.js.
//   node design/cozy-camera/render.js <out dir> <variation: 0 today, 1 A low follow camera, 2 B + the rolling world, 3 C + the cozy feel> [spots, comma separated] [--clip]
// The game's own page in headless Chromium (software WebGL), ?dev&cards&engine=3d, the player and a squad of three put at each spot and the game's own frames drawn. dist/view3d.js is
// served with cozy.js put inside it and a few one-line hooks (PATCHES); nothing on disk is changed. Only the 3D picture is shown (the 2D drawn over it, the HUD and the panels hidden:
// they are laid out for today's camera). Prints each picture's draws, triangles and the view's time a frame.
const http = require('http'), fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.resolve(__dirname, '../..'), OUT = process.argv[2], VAR = +(process.argv[3] || 0), ONLY = process.argv[4] && !process.argv[4].startsWith('--') ? process.argv[4].split(',') : null, CLIP = process.argv.includes('--clip');
const NAME = ['today', 'A', 'B', 'C'][VAR];
const MIME = { '.html': 'text/html', '.js': 'application/javascript', '.css': 'text/css', '.png': 'image/png', '.webp': 'image/webp', '.json': 'application/json', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff' };
const PATCHES = [
  ['window.__view3d = function (opts) {\n', 'window.__view3d = function (opts) {\n' + fs.readFileSync(path.join(__dirname, 'cozy.js'), 'utf8') + '\n'],
  ['const cam = new T.OrthographicCamera(-1, 1, 1, -1, 10, 90), BACK = 40,', 'const cam = window.__COZY && window.__COZY.v ? new T.PerspectiveCamera(40, 1, 0.3, 140) : new T.OrthographicCamera(-1, 1, 1, -1, 10, 90), BACK = 40,'],
  ['        cam.lookAt(at);\n        cam.updateProjectionMatrix();\n        cam.updateMatrixWorld();\n    }\n    let cssW', '        cam.lookAt(at);\n        cam.updateProjectionMatrix();\n        cam.updateMatrixWorld();\n        if (window.__COZY && window.__COZY.v) window.__cozyPlace(cam, { a, bk, B, pl, GM, UPX, W, H, k, dt });\n    }\n    let cssW'],
  ['RC.set(seeFrom, DIR);', 'RC.set(seeFrom, window.__COZY && window.__COZY.v ? window.__cozyDir(seeFrom) : DIR);'],
  ['seeRay.set(seeFrom, DIR);', 'seeRay.set(seeFrom, window.__COZY && window.__COZY.v ? window.__cozyDir(seeFrom) : DIR);'],
  ['const fx = turning() || battling() ? null : marks(floorMarks);', 'const fx = turning() || battling() || (window.__COZY && window.__COZY.v) ? null : marks(floorMarks);'],
  ['const dk = lv => Math.round(255 * Math.max(', 'const dk = lv => Math.round(255 * (window.__COZY && window.__COZY.dark || 1) * Math.max('],
  ['idMat.shadowSide = T.BackSide;', 'idMat.shadowSide = T.BackSide; window.__cozyIdMat = idMat;'],
  ['floorId: { value: new T.Vector3() } },', 'floorId: { value: new T.Vector3() }, cozy: { value: 0 }, fogN: { value: 15 }, fogF: { value: 38 } },'],
  ['uniform float thick, near, far, dK, useDepth, isOrtho, useFx;', 'uniform float thick, near, far, dK, useDepth, isOrtho, useFx, cozy, fogN, fogF;'],
  ['gl_FragColor = vec4(mix(c, ink, k), 1.0); }`', 'if (cozy > 0.5) { float zz = useDepth > 0.5 ? lin(vUv) : 0.0; k *= 0.72 * (1.0 - smoothstep(fogN, fogF, zz)); c = mix(c, vec3(1.0, 0.96, 0.9), 0.06); c = c * vec3(1.02, 1.0, 0.97); }\n      gl_FragColor = vec4(mix(c, ink, k), 1.0); }`'],
  ['const quadScene = new T.Scene(), quadCam', 'window.__cozyComp = comp; const quadScene = new T.Scene(), quadCam'],
];
let VIEWJS = null;
const viewJs = () => { if (VIEWJS) return VIEWJS; let s = fs.readFileSync(path.join(ROOT, 'dist/view3d.js'), 'utf8');
  for (const [a, b] of PATCHES) { if (s.split(a).length !== 2) throw new Error('patch not found once: ' + a.slice(0, 70)); s = s.replace(a, () => b); } return (VIEWJS = s); };
const srv = http.createServer((q, r) => {
  const u = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, u === '/' ? 'game.html' : u);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return; }
  if (u === '/dist/view3d.js') { r.writeHead(200, { 'content-type': MIME['.js'] }); r.end(viewJs()); return; }
  r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r);
});
// the spots: [name, how the player is placed, zoom, turn]. room: a cell of that room (frac: how far along its list); xy: the map's own tiles
const SPOTS = [
  ['chamber', { room: 'crystal_chamber', frac: 0.5 }, 1, 0],
  ['hallway', { room: 'lab_hallway', frac: 0.5 }, 1, 0],
  ['arena', { room: 'arena', frac: 0.5 }, 1, 0],
  ['sewers', { xy: [-39, 108.5] }, 1, 0],          // the steel bridge's grating over the main river (design/sewer-variety's spot)
  ['sewers2', { xy: [-26.5, 117] }, 1, 0],         // the south walkway along the river
  ['chamber-t1', { room: 'crystal_chamber', frac: 0.5 }, 1, 1],   // a quarter turn
];
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  await new Promise(r => srv.listen(0, r)); const port = srv.address().port;
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage({ viewport: { width: 1180, height: 820 }, deviceScaleFactor: 2 });
  await p.addInitScript(cfg => { window.__COZY = cfg; }, Object.assign({ v: VAR }, process.env.COZY ? JSON.parse(process.env.COZY) : {}));
  const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
  await p.goto(`http://127.0.0.1:${port}/game.html?dev&cards&engine=3d&sharp=2`, { waitUntil: 'load', timeout: 300000 });
  await p.waitForFunction(() => typeof STARTUP !== 'undefined' && (STARTUP.state === 'done' || STARTUP.state === 'failed') && typeof VIEW3D !== 'undefined' && (VIEW3D.state === 'ready' || VIEW3D.state === 'failed'), null, { timeout: 300000 });
  const info = await p.evaluate(() => { try {
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
    window.__dry = (n, k) => { const V = VIEW3D.view; for (let i = 0; i < n; i++) { V.dry(i % (k || 1) !== (k || 1) - 1); __step(1); } V.dry(false); };
    if (window.__COZY.v) { window.__COZY.scene = VIEW3D.view.core.scene; window.__COZY.wrapMat(window.__cozyIdMat); window.__COZY.wrap(VIEW3D.view.core.scene); window.__COZY.init(VIEW3D.view); window.__COZY.feel(VIEW3D.view); }
    return { ok: true, view: VIEW3D.state, err: VIEW3D.error };
  } catch (e) { return { ok: false, err: String(e && e.stack || e) }; } });
  console.log('setup', JSON.stringify(info)); if (process.env.PRE) console.log('pre', JSON.stringify(await p.evaluate(process.env.PRE)));
  if (!info.ok || info.view !== 'ready') { console.log(errs.slice(0, 8).join('\n')); await b.close(); srv.close(); process.exit(1); }
  const hide = () => p.evaluate(() => { const cv0 = document.getElementById('view3dCanvas'); for (const el of document.querySelectorAll('body *')) if (el !== cv0 && !el.contains(cv0)) el.style.visibility = 'hidden'; });
  const place = (where, zoom, turn) => p.evaluate(([where, zoom, turn]) => { let x, y; if (where.room) { const cells = partyRoomCells(where.room); const c = cells[Math.floor(cells.length * where.frac)]; x = c[0]; y = c[1]; } else [x, y] = where.xy;
    __put(x, y); VIEW_TURN = turn; VIEW3D.turn = turn; __near(); __step(3); VIEW3D.zoom = zoom; window.__COZY.snap = true; __step(2); window.__COZY.snap = false; __near(); __step(2); __near(); return [x, y]; }, [where, zoom, turn]);
  const cost = () => p.evaluate(() => { if (window.__COZY.v) window.__COZY.wrap(VIEW3D.view.core.scene); const gl = VIEW3D.view.core.renderer.getContext(), px = new Uint8Array(4), fr = [], wall = []; for (let i = 0; i < 6; i++) { __near(); const t0 = performance.now(); __step(1); gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); wall.push(performance.now() - t0); const s = VIEW3D.view.stats; fr.push([s.draws, s.tris, s.ms]); }
    const med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)];
    return { showing: VIEW3D.showing, draws: fr.map(f => f[0]).join('/'), tris: fr.map(f => f[1]).join('/'), viewMs: +med(fr.map(f => f[2])).toFixed(0), frameMs: +med(wall).toFixed(0), room: (facilityRoomAt(Math.round(player.x), Math.round(player.y), _fp.F) || {}).id }; });
  const results = {};
  await hide();
  for (const [name, where, zoom, turn] of SPOTS) {
    if (ONLY && !ONLY.includes(name)) continue;
    const xy = await place(where, zoom, turn); await p.evaluate(() => { __step(4); });
    const r = await cost(); r.at = xy; results[name] = r; console.log(name, JSON.stringify(r));
    await hide(); await p.screenshot({ path: path.join(OUT, NAME + '-' + name + '.png'), timeout: 180000 });
  }
  // ── a card battle in the Crystal Chamber: three ants against the squad (the battle's own camera today; at the new angle in A, B, C) ──
  if (!ONLY || ONLY.includes('battle')) {
    const bi = await p.evaluate(() => { try { const cells = partyRoomCells('crystal_chamber'), c0 = cells[Math.floor(cells.length * 0.5)]; __put(c0[0], c0[1]); VIEW_TURN = 0; VIEW3D.turn = 0; VIEW3D.zoom = 1; __near();
      const foe = (cls, x, y) => { const e = spawnCreature({ species: 'ant', className: cls }), q = _fpNearestCellOpen(x, y); e.x = q[0]; e.y = q[1]; e.health = e.maxHealth = 1e6; e.provoked = false; e.state = 'wander'; e.moveSpeed = e.baseMoveSpeed = 0; return e; };
      const foes = [foe('scout', player.x + 3, player.y + 0.2), foe('striker', player.x + 3.4, player.y + 1.4), foe('tank', player.x + 3.3, player.y - 1.1)]; window.__keepFoes = foes;
      const keep = () => { for (const a of foes) { a.health = a.maxHealth; a.state = 'wander'; a.dirX = -1; a.dirY = 0; a.attackAnim = 0; } for (const f of __squad) f.health = f.maxHealth; player.health = player.maxHealth; };
      window.__bt = n => { for (let i = 0; i < n; i++) { keep(); render(); } };
      __bt(4); const chose = cardBattleChoose(foes[0]); const V = VIEW3D.view; V.dry(true); __bt(150); V.dry(false); __bt(3); if (typeof dialogueClear === 'function') dialogueClear();
      return { chose, phase: cardBattlePhase(), n: cardBattleFoes().length }; } catch (e) { return { err: String(e && e.stack || e) }; } });
    console.log('battle', JSON.stringify(bi));
    const r = await p.evaluate(() => { const fr = []; for (let i = 0; i < 4; i++) { __bt(1); const s = VIEW3D.view.stats; fr.push([s.draws, s.tris, s.ms]); } return { draws: fr.map(f => f[0]).join('/'), tris: fr.map(f => f[1]).join('/'), viewMs: +fr.map(f => f[2]).sort((a, b) => a - b)[2].toFixed(0), bodies: VIEW3D.view.stats.bodies, seeing: VIEW3D.view.seeingThrough() }; });
    results.battle = r; console.log('battle', JSON.stringify(r));
    await hide(); await p.screenshot({ path: path.join(OUT, NAME + '-battle.png'), timeout: 180000 });
    // the same battle with the panels shown (the cards over it), to see what the 2D lays over the new angle
    await p.evaluate(() => { for (const el of document.querySelectorAll('body *')) el.style.visibility = ''; __bt(2); });
    await p.screenshot({ path: path.join(OUT, NAME + '-battle-ui.png'), timeout: 180000 });
    await p.evaluate(() => { try { if (typeof cardBattleEnd === 'function') cardBattleEnd(); } catch (e) {} window.__keepFoes = null; });
  }
  // ── the clip: the player walks across the Crystal Chamber into the hallway side, the camera following; 12 pictures a second, a picture each fifth frame of the game's ──
  if (CLIP) {
    const dir = path.join(OUT, 'clip-' + NAME); fs.rmSync(dir, { recursive: true, force: true }); fs.mkdirSync(dir, { recursive: true });
    await p.evaluate(() => { const cells = partyRoomCells('crystal_chamber'); let mnx = 1e9, mxx = -1e9, sy = 0; for (const c of cells) { mnx = Math.min(mnx, c[0]); mxx = Math.max(mxx, c[0]); sy += c[1]; } sy /= cells.length;
      window.__path = { x0: mnx + 1.5, x1: mxx - 1.5, y: Math.round(sy) + 0.5 }; __put(__path.x0, __path.y); VIEW_TURN = 0; VIEW3D.turn = 0; VIEW3D.zoom = 1; __near(); __dry(90); __step(3);   /* (the battle's camera eased all the way back first) */ window.__COZY.snap = true; __step(1); window.__COZY.snap = false; __step(1); window.__ci = 0; });
    const N = 48;
    for (let i = 0; i < N; i++) {
      await p.evaluate(() => { const P = __path, V = VIEW3D.view; for (let j = 0; j < 5; j++) { const t = Math.min(1, (window.__ci++) / (48 * 5 * 0.8)), s = t * t * (3 - 2 * t); const x = P.x0 + (P.x1 - P.x0) * s, y = P.y - Math.sin(s * Math.PI) * 1.5;
        player.x = player.targetX = player.visualX = x; player.y = player.targetY = player.visualY = y; player.fpPath = null;
        __squad.forEach((f, k) => { const tx = x - 1.2 - k * 0.8, ty = y + (k - 1) * 0.9; f.dirX = tx - f.x; f.dirY = ty - f.y; f.x += (tx - f.x) * 0.12; f.y += (ty - f.y) * 0.12; });
        V.dry(j < 4); __step(1); } V.dry(false); });
      await hide(); await p.screenshot({ path: path.join(dir, String(i).padStart(3, '0') + '.png'), timeout: 180000 });
    }
    const mp4 = path.join(OUT, 'clip-' + NAME + '.mp4'), gif = path.join(OUT, 'clip-' + NAME + '.gif');
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '12', '-i', path.join(dir, '%03d.png'), '-vf', 'scale=1180:-2', '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '20', mp4]);
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', '12', '-i', path.join(dir, '%03d.png'), '-vf', 'scale=640:-1:flags=lanczos,split[a][b];[a]palettegen=max_colors=128[p];[b][p]paletteuse=dither=bayer:bayer_scale=4', gif]);
    console.log('clip', mp4, gif);
  }
  fs.writeFileSync(path.join(OUT, NAME + '-cost.json'), JSON.stringify(results, null, 1));
  console.log('missed', JSON.stringify(await p.evaluate(() => window.__COZY.missed || []))); console.log('errors', JSON.stringify(errs.filter(e => !/GPU stall/.test(e)).slice(0, 10)));
  await b.close(); srv.close();
})().catch(e => { console.error(e); process.exit(1); });
