// THE RUBBLE, MODELLED IN THE CAVE'S ROCK (the owner, 2026-11-09: "update the rubble patches make those look more like a cave rock"; "Approve the walls for everyone, then do the rubble").
// Every rubble patch a fire technician drills (js/techabilities.js techDrawRubbleOn: the arena's south rubble, the Sewers' gate, bank and collapsed tunnel) is modelled in the walls' rock (design/cave/bake_walls.js):
//   node design/cave/bake_rubble.js <three-dir>
// 1. boots the game as the tests do and reads each rubble patch (its stretch along the wall, its piles of two tiles, its seed)
// 2. models each pile's nine stones where the drawn pile had them (_TECH_RUBBLE: along the pile, how high, how wide, how tall), as chunks of the cave's brown rock, softly shaded, over a dark heap
//    that fills the gap behind them; one picture for each stage of the drilling (the stones shown as the hits go in: 9, 8, 7, 6, 4, 3; the top ones go first) and one of what a drilled choke leaves
// 3. renders them at the game's camera and scale (the props' lights) and packs them into img/cave/rubble.png; writes js/caverubble.js (each picture's place and where it goes from the patch's start)
const fs = require('fs'), vm = require('vm'), path = require('path');
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const ROOT = path.join(__dirname, '..', '..');
const { scriptOrder, makeBrowserSandbox } = require(path.join(ROOT, 'tests', 'domstub.js'));
const THREE_DIR = process.argv[2];
const SHOWS = [9, 8, 7, 6, 4, 3];   // the stones shown after 0 to 5 hits (techDrawRubbleOn: show = 9 - floor(hits * 9 / 7))
process.on('unhandledRejection', () => {});

(async () => {
  const sb = makeBrowserSandbox({}), ctx = vm.createContext(sb);
  for (const rel of scriptOrder()) { try { vm.runInContext(fs.readFileSync(path.join(ROOT, rel), 'utf8'), ctx, { filename: rel }); } catch (e) {} }
  for (let i = 0; i < 20; i++) await new Promise(r => setImmediate(r));
  const items = JSON.parse(vm.runInContext(`JSON.stringify((_fp.items || []).filter(it => it.fp === "wdecor" && it.kind === "rubble").map(it => {
      const r = _techRubble(it.rubble), dx = it.b[0] - it.a[0], dy = it.b[1] - it.a[1], L = Math.hypot(dx, dy) || 1;
      let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
      return { id: it.rubble, a: it.a, b: it.b, seed: it.seed >>> 0, n: [nx, ny], len: L, segs: Math.max(1, Math.round(L / 2)), choke: !!(r && r.solid), rocks: _TECH_RUBBLE };
    }))`, ctx));
  console.log(items.length + ' rubble patches: ' + items.map(i => i.id + ' (' + i.segs + ')').join(', '));

  const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__pile = function (R, stage) {
  const T = THREE, PI = Math.PI, PX = 60 / Math.sin(PI / 4), UH = PX * Math.cos(Math.asin(0.5));
  const h3 = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
  const sm = t => t * t * (3 - 2 * t);
  const n3 = (x, y, z) => { const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), xf = sm(x - xi), yf = sm(y - yi), zf = sm(z - zi); let v = 0;
    for (let a = 0; a < 2; a++) for (let b = 0; b < 2; b++) for (let c = 0; c < 2; c++) v += h3(xi + a, yi + b, zi + c) * (a ? xf : 1 - xf) * (b ? yf : 1 - yf) * (c ? zf : 1 - zf); return v; };
  const lin = h => new T.Color(h).convertSRGBToLinear();
  const base = lin(0x4a3f37), dark = lin(0x1d1714), light = lin(0x7a6a5c), tones = [0x52463d, 0x4a3f37, 0x5a4d42, 0x463c35].map(lin);
  const A = R.a, dir = [(R.b[0] - A[0]) / R.len, (R.b[1] - A[1]) / R.len], n = R.n, W2 = (u, off) => [A[0] + dir[0] * u * R.len + n[0] * off, A[1] + dir[1] * u * R.len + n[1] * off];
  const rock = window.__MAT || (window.__MAT = (() => { const m = new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0, flatShading: false }); m.envMapIntensity = 0.25; return m; })());
  const g = new T.Group();
  // a stone: a lumpy low-poly chunk of the cave's rock, softly shaded, its top lighter and its underside dark; (u, zb px) its foot, w its width (of the stretch), h px its height
  const stone = (u, zb, w, h, off, seed, tone) => { const q = new T.IcosahedronGeometry(1, 1), a = q.attributes.position, c2 = new Float32Array(a.count * 3), key = new Map();
    for (let i = 0; i < a.count; i++) { const x = a.getX(i), y = a.getY(i), z = a.getZ(i), id = Math.round(x * 100) + ',' + Math.round(y * 100) + ',' + Math.round(z * 100);
      let k = key.get(id); if (k === undefined) { k = 0.78 + 0.44 * n3(x * 2.5 + seed, y * 2.5, z * 2.5 + seed * 0.3); key.set(id, k); }
      a.setXYZ(i, x * k, Math.max(y * k, -0.55), z * k);
      const up = 0.5 + 0.5 * y, cc = tone.clone().lerp(light, Math.max(0, up - 0.55) * 0.7).lerp(dark, Math.max(0, 0.4 - up) * 1.1); c2[i * 3] = cc.r; c2[i * 3 + 1] = cc.g; c2[i * 3 + 2] = cc.b; }
    q.setAttribute('color', new T.BufferAttribute(c2, 3)); q.computeVertexNormals();
    const m = new T.Mesh(q, rock), Wt = w * R.len / 2, Hu = h / UH / 2, Dt = Math.min(0.32, Math.max(0.16, Wt * 0.9)), c = W2(u, off);
    m.scale.set(Wt, Hu, Dt); m.rotation.y = -Math.atan2(dir[1], dir[0]) + (h3(seed, 2, 5) - 0.5) * 0.5; m.position.set(c[0], (zb + h * 0.42) / UH, c[1]); g.add(m); };
  const segs = R.segs, rocks = R.rocks;
  if (stage === 'left') {   // what a drilled choke leaves: stones at the foot of each side, and where the piles met
    [[0.1, 0, 0.1], [0.19, 0, 0.07], [0.9, 0, 0.11], [0.8, 0, 0.06], [0.14, 8, 0.06], [0.87, 7, 0.07]].forEach(([u, z, w], k) => stone(u < 0.5 ? u / segs : 1 - (1 - u) / segs, z, w / segs, 12 + (k % 3) * 3, 0.12, R.seed + k * 13, tones[k % 4]));
    for (let sg = 1; sg < segs; sg++) [[-0.04, 0.05], [0.05, 0.035]].forEach(([du, w], k) => stone((sg + du) / segs, 0, w / segs, 10, 0.12, R.seed + sg * 31 + k, tones[(sg + k) % 4]));
  } else {
    const show = stage;
    for (let sg = 0; sg < segs; sg++) {
      const seed = (R.seed + sg * 7919) >>> 0, U = u => (sg + u) / segs;
      // the dark heap behind the stones (the gap the pile fills): a low mound along the pile, against the wall
      const u0 = sg ? 0 : 0.08, u1 = sg === segs - 1 ? 0.95 : 1, prof = [[u0, 0], [u0 + 0.04, 30], [0.3, 52], [0.55, 58], [0.8, 48], [u1 - 0.01, 26], [u1, 0]].map(([u, z]) => [u, z * (0.55 + 0.45 * show / 9)]);
      const heap = new T.Shape(); prof.forEach(([u, z], i) => { const x = U(u) * R.len; i ? heap.lineTo(x, z / UH) : heap.moveTo(x, z / UH); });
      const hg = new T.ExtrudeGeometry(heap, { depth: 0.16, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 2 }), hc = new Float32Array(hg.attributes.position.count * 3);
      for (let i = 0; i < hg.attributes.position.count; i++) { const cc = dark.clone().lerp(base, 0.25); hc[i * 3] = cc.r; hc[i * 3 + 1] = cc.g; hc[i * 3 + 2] = cc.b; }
      hg.setAttribute('color', new T.BufferAttribute(hc, 3)); hg.computeVertexNormals();
      const hm = new T.Mesh(hg, rock); hm.rotation.y = -Math.atan2(dir[1], dir[0]); hm.position.set(A[0] - n[0] * 0.08, 0, A[1] - n[1] * 0.08); g.add(hm);
      for (let k = 0; k < Math.min(show, rocks.length); k++) { const [uc, zb, w, h] = rocks[k]; stone(U(uc), zb, w / segs, h, 0.1 + 0.06 * (k % 2), seed + k * 17, tones[(k + seed) % 4]); }
      if (sg && show > 2) stone(U(0.02), 0, 0.18 / segs, 20, 0.12, seed + 11, tones[(seed + 3) % 4]);   // (a boulder across the joint with the pile before it)
    }
  }
  // the screen box, from the patch's start A at the floor
  const SX = (gx, gy) => (gx - gy - (A[0] - A[1])) * 60, SY = (gx, gy, z) => (gx + gy - (A[0] + A[1])) * 30 - z;
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; g.updateMatrixWorld(true);
  g.traverse(o => { if (!o.isMesh) return; const a = o.geometry.attributes.position, v = new T.Vector3(); for (let i = 0; i < a.count; i++) { v.fromBufferAttribute(a, i).applyMatrix4(o.matrixWorld); const sx = SX(v.x, v.z), sy = SY(v.x, v.z, v.y * UH); if (sx < x0) x0 = sx; if (sx > x1) x1 = sx; if (sy < y0) y0 = sy; if (sy > y1) y1 = sy; } });
  const M = 3, W = Math.ceil(x1 - x0) + 2 * M, H = Math.ceil(y1 - y0) + 2 * M, cx = Math.round(-x0 + M), cy = Math.round(-y0 + M);
  const renderer = window.__R || (window.__R = (() => { const r = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false }); r.setPixelRatio(1);
    r.outputEncoding = T.sRGBEncoding; r.toneMapping = T.ACESFilmicToneMapping; r.toneMappingExposure = 1.05; r.setClearColor(0x000000, 0); return r; })());
  const env = window.__ENV || (window.__ENV = (() => { const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide }))); return new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture; })());
  const scene = new T.Scene(); scene.environment = env; scene.add(g);
  scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.45));
  const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
  const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
  const bk = new T.DirectionalLight(0x6c8cff, 0.6); bk.position.set(2, 1, -5); scene.add(bk);
  const cam = new T.OrthographicCamera(-cx / PX, (W - cx) / PX, cy / PX, -(H - cy) / PX, 0.1, 400), D = 100, el = Math.asin(0.5);
  cam.position.set(A[0] + D * Math.cos(el) * Math.SQRT1_2, D * Math.sin(el), A[1] + D * Math.cos(el) * Math.SQRT1_2); cam.lookAt(A[0], 0, A[1]); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  renderer.setSize(W, H, false); renderer.render(scene, cam);
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; cv.getContext('2d').drawImage(renderer.domElement, 0, 0);
  scene.traverse(o => { if (o.geometry) o.geometry.dispose(); });
  return { w: W, h: H, dx: -cx, dy: -cy, png: cv.toDataURL('image/png') };
};
</script></body></html>`;
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://rubble.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://rubble.local/');
  const pics = [];
  for (const R of items) for (const st of SHOWS.concat(R.choke ? ['left'] : [])) {
    const res = await p.evaluate(([R, st]) => window.__pile(R, st), [R, st]); if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
    pics.push(Object.assign(res, { id: R.id, stage: String(st) }));
  }
  // one sheet (shelf-packed) and the atlas
  const MAXW = 2048; let x = 0, y = 0, rowH = 0; pics.sort((a, c) => c.h - a.h);
  for (const s of pics) { if (x + s.w > MAXW) { x = 0; y += rowH + 1; rowH = 0; } s.x = x; s.y = y; x += s.w + 1; rowH = Math.max(rowH, s.h); }
  const SW = MAXW, SH = y + rowH;
  const q = await b.newPage();
  const png = await q.evaluate(async ([list, W, H]) => { const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    for (const s of list) { const im = new Image(); await new Promise(r => { im.onload = r; im.src = s.png; }); g.drawImage(im, s.x, s.y); } return cv.toDataURL('image/png'); }, [pics.map(s => ({ x: s.x, y: s.y, png: s.png })), SW, SH]);
  await b.close();
  fs.mkdirSync(path.join(ROOT, 'img', 'cave'), { recursive: true }); fs.writeFileSync(path.join(ROOT, 'img', 'cave', 'rubble.png'), Buffer.from(png.split(',')[1], 'base64'));
  const atlas = { sheet: 'img/cave/rubble.png', w: SW, h: SH, shows: SHOWS, items: {} };
  for (const s of pics) { (atlas.items[s.id] = atlas.items[s.id] || {})[s.stage] = ['rubble', s.x, s.y, s.w, s.h, s.dx, s.dy]; }
  const js = '// THE RUBBLE, MODELLED IN THE CAVE\'S ROCK: written by design/cave/bake_rubble.js (do not edit by hand; bake again when the rubble changes).\n' +
    '// items: a rubble patch\'s id -> its pictures: "9" ... "3" (the stones shown as the drilling goes in), "left" (what a drilled choke leaves) -> [sheet, x, y, w, h, dx, dy]: drawn with its top-left at (dx, dy) from the screen point of the patch\'s start.\n' +
    'const CAVE_RUBBLE = ' + JSON.stringify(atlas) + ';\n';
  fs.writeFileSync(path.join(ROOT, 'js', 'caverubble.js'), js);
  console.log('img/cave/rubble.png: ' + SW + ' x ' + SH + ', ' + pics.length + ' pictures; wrote js/caverubble.js');
})();
