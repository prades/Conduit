// THE HEXAGON GROUND FLOOR'S NEW EQUIPMENT, review sheets (design/props/models/hexequip.js; docs/FACILITY.md): each piece rendered straight from its 3D model at K times game size, in the baker's
// light and camera (design/hex-objects/render.js's), standing on the floor's hexes; each corner piece in a corner of walls at its angle, so its fit shows.
//   node design/hex-objects/render-equip.js <three-dir> <out-dir> [K]
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'), path = require('path');
const [THREE_DIR, OUTDIR, KARG] = process.argv.slice(2), K = +KARG || 4, REPO = path.join(__dirname, '..', '..');
const rd = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const PX = 60 / Math.sin(Math.PI / 4), UH = PX * Math.cos(Math.asin(0.5));
const SHEETS = [
  { file: 'equip-draft1-server-lounge.png', title: 'Server Room and Lounge: the server rack, the stair door down; sofa, coffee table, coffee machine', shots: [['hexrack', 1], ['hexhatch', 1], ['hexsofa', 2], ['hextable', 1], ['hexcoffee', 1]] },
  { file: 'equip-draft1-warehouse-halls.png', title: 'Warehouse and hallways: pallet rack, bench, railing, the stairs up (open, and barred)', shots: [['hexpallet', 1], ['hexbench', 2], ['hexrail', 1], ['hexstairs.open', 'stairs'], ['hexstairs.barred', 'stairs']] },
  { file: 'equip-draft1-corners-60.png', title: 'Corner pieces for a 60 degree corner: cooling unit, shelving, planter, relay cabinet, floodlight', shots: [['hexcool.c60', 'c60'], ['hexshelf.c60', 'c60'], ['hexplanter.c60', 'c60'], ['hexrelay.c60', 'c60'], ['hexflood.c60', 'c60']] },
  { file: 'equip-draft1-corners-120.png', title: 'Corner pieces for a 120 degree corner', shots: [['hexcool.c120', 'c120'], ['hexshelf.c120', 'c120'], ['hexplanter.c120', 'c120'], ['hexrelay.c120', 'c120'], ['hexflood.c120', 'c120']] },
];
const page = `<!doctype html><html><body style="margin:0;background:#10151d"><script src="three.min.js"></script><script>
window.__render = async function (SHEETS, PX0, UH0, K) {
  const PX = PX0, UH = UH0;
  ${rd('design/evolutions/forms-core.js')}
  ${rd('design/evolutions/forms2.js')}
  ${rd('design/evolutions/forms29.js')}
  const px = h => h / UH;
  const PROPS = {};
  ${rd('design/props/models/_style.js')}
  ${rd('design/props/models/hexequip.js')}
  const elev = Math.asin(0.5), D = 40, CW = 150 * K, CH = 150 * K, S = PX * K;
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.setSize(CW, CH, false); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95; renderer.setClearColor(0x000000, 0);
  const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  const floorM = new T.MeshStandardMaterial({ color: new T.Color('#3a4656').convertSRGBToLinear(), roughness: 0.8, metalness: 0.1 }), lineM = new T.MeshBasicMaterial({ color: 0x6f8aa8 });
  const hexShape = (r) => { const s = new T.Shape(); for (let i = 0; i < 6; i++) { const a = i * PI / 3; i ? s.lineTo(Math.sin(a) * r, Math.cos(a) * r) : s.moveTo(Math.sin(a) * r, Math.cos(a) * r); } s.closePath(); return s; };
  function floor(kind) {   // the hexes it stands on (one, two along x, or a block for the stairs); for a corner piece, the floor's corner and its two walls
    const g = new T.Group(), R = 1 / Math.sqrt(3), H3 = Math.sqrt(3) / 2;
    const cell = (x, z) => { const e = new T.Mesh(new T.ShapeGeometry(hexShape(R * 1.02)), lineM); e.rotation.x = -PI / 2; e.position.set(x, -0.012, z); g.add(e);
      const m = new T.Mesh(new T.ShapeGeometry(hexShape(R * 0.985)), floorM); m.rotation.x = -PI / 2; m.position.set(x, -0.008, z); g.add(m); };
    if (kind === 1) cell(0, 0);
    else if (kind === 2) { cell(-0.5, 0); cell(0.5, 0); }
    else if (kind === 'stairs') { for (const z of [-H3 * 1, 0, H3]) for (const x of [-1, 0, 1]) cell(x + (Math.abs(Math.round(z / H3)) % 2) * 0.5 - 0.25, z); }
    else {   // a corner: the floor and two walls meeting at the corner (at the origin), the piece opening towards +x
      const ang = kind === 'c60' ? PI / 3 : 2 * PI / 3, Lw = 2.2, wallM = new T.MeshStandardMaterial({ color: new T.Color('#dbe6ea').convertSRGBToLinear(), roughness: 0.6 });
      for (let x = -1; x <= 3; x++) for (let k = -2; k <= 2; k++) { const z = k * H3, cx = x + (Math.abs(k) % 2) * 0.5; if (Math.abs(Math.atan2(z, cx)) < ang / 2 - 0.05 && Math.hypot(cx, z) < 2.4) cell(cx, z); }
      for (const s of [-1, 1]) { const a = s * ang / 2, w = new T.Mesh(new T.BoxGeometry(Lw, 1.1, 0.12), wallM); w.position.set(Math.cos(a) * Lw / 2 - Math.sin(a) * s * 0.06 * -1, 0.55, -Math.sin(a) * Lw / 2); w.rotation.y = a; g.add(w); }
    }
    return g;
  }
  function shot(name, kind) {
    const scene = new T.Scene(); scene.environment = env;
    scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.5));
    const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
    const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
    const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
    const B = PROPS.hexequip.build(name), W0 = new T.Group(); W0.add(B.g); W0.add(floor(kind)); scene.add(W0);
    const corner = typeof kind === 'string' && kind[0] === 'c'; if (corner) { W0.position.set(-0.9, 0, -0.9); W0.rotation.y = -PI / 4; }   // (a corner piece: its corner turned away from the camera, the room opening towards it)
    const k = kind === 1 ? 1 : kind === 2 ? 0.62 : 0.5, cx = 0, cam = new T.OrthographicCamera(-CW / 2 / S / k, CW / 2 / S / k, CH / 2 / S / k, -CH / 2 / S / k, 0.1, 200);
    cam.position.set(cx + D * Math.cos(elev) * Math.SQRT1_2, D * Math.sin(elev) + 0.4 / k, D * Math.cos(elev) * Math.SQRT1_2); cam.lookAt(cx, 0.4 / k, 0); cam.updateProjectionMatrix();
    renderer.render(scene, cam); const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; cv.getContext('2d').drawImage(renderer.domElement, 0, 0); return cv;
  }
  const out = {};
  for (const sh of SHEETS) {
    const n = sh.shots.length, PAD = 24, TOP = 70, LAB = 34, W = PAD + n * (CW + PAD), H = TOP + CH + LAB + PAD, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#10151d'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.font = 'bold 30px DejaVu Sans, sans-serif'; g.fillText(sh.title, PAD, 46);
    sh.shots.forEach((p, i) => { const x = PAD + i * (CW + PAD);
      g.fillStyle = '#161d28'; g.fillRect(x, TOP, CW, CH + LAB); g.strokeStyle = '#2a3546'; g.lineWidth = 2; g.strokeRect(x, TOP, CW, CH + LAB);
      g.drawImage(shot(p[0], p[1]), x, TOP);
      g.font = 'bold 20px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#ffe37a'; g.fillText(p[0], x + CW / 2, TOP + CH + 22); g.textAlign = 'left'; });
    out[sh.file] = cv.toDataURL('image/png');
  }
  return out;
};
</script></body></html>`;
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('**/page.html', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://hexrender.local/page.html');
  let out; try { out = await p.evaluate(([s, a, c, k]) => window.__render(s, a, c, k), [SHEETS, PX, UH, K]); } catch (e) { console.error('ERRORS', errs, e.message); process.exit(1); }
  fs.mkdirSync(OUTDIR, { recursive: true });
  for (const [f, url] of Object.entries(out)) { fs.writeFileSync(path.join(OUTDIR, f), Buffer.from(url.split(',')[1], 'base64')); console.log(path.join(OUTDIR, f)); }
  await b.close();
})();
