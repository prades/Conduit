// A SHARP REVIEW SHEET for the breakable states' drafts (design/props/drafts/hexbreak.js): each piece as the game has it today and in the states a follower's utility leaves it in, rendered straight
// from the 3D models at K times game size, in the baker's own light and camera (design/props/bake_props.js), as design/hex-objects/render.js does; each on its hex of the floor's grid (two for a
// 2-tile piece).
//   node design/hex-objects/render-break.js <three-dir> <out-dir> [K]
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'), path = require('path');
const [THREE_DIR, OUTDIR, KARG] = process.argv.slice(2), K = +KARG || 3, REPO = path.join(__dirname, '..', '..');
const rd = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const PX = 60 / Math.sin(Math.PI / 4), UH = PX * Math.cos(Math.asin(0.5));
const SHEETS = [
  { file: 'draft4-door.png', title: 'The subway door, and after Quillstone\'s CHARGED DOOR BREACH', wide: true, zoom: 0.56, up: 0.42, cells: [['door.locked', 'LOCKED (today)', 0], ['door.breached', 'BREACHED', 1]] },
  { file: 'draft4-machine.png', title: 'The generator, and Frost Maw\'s CRYO-FRACTURE: frozen, then shattered', wide: false, zoom: 0.62, up: 0.3, cells: [['machine', 'TODAY', 0], ['machine.frozen', 'FROZEN', 1], ['machine.shattered', 'SHATTERED', 1]] },
  { file: 'draft4-vines-rubble.png', title: 'The sewer\'s heavy vines (new) and Seaper\'s BIOLOGICAL DISSOLUTION; the rubble heap as it is (Jelly Ram\'s ELASTIC RUBBLE BREAK)', wide: true, zoom: 0.56, up: 0.42, cells: [['vines.whole', 'VINES · WHOLE', 1], ['vines.dissolved', 'DISSOLVED', 1], ['rubble.whole', 'RUBBLE · WHOLE (today)', 0], ['rubble.cleared', 'CLEARED (today)', 0]] },
];
const page = `<!doctype html><html><body style="margin:0;background:#10151d"><script src="three.min.js"></script><script>
window.__render = async function (SHEETS, PX0, UH0, K) {
  const PX = PX0, UH = UH0;
  ${rd('design/evolutions/forms-core.js')}
  ${rd('design/evolutions/forms2.js')}
  ${rd('design/evolutions/forms29.js')}
  const px = h => h / UH;
  const PROPS = {};
  ${rd('design/props/models/_items.js')}
  ${rd('design/props/models/_sewer.js')}
  ${rd('design/props/models/_style.js')}
  ${rd('design/props/models/lab.js')}
  ${rd('design/props/drafts/hexbreak.js')}
  const elev = Math.asin(0.5), D = 40, CW = 190 * K, CH = 170 * K, S = PX * K;
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.localClippingEnabled = true;   // (machine.shattered: the generator cut off low)
  renderer.setPixelRatio(1); renderer.setSize(CW, CH, false); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95; renderer.setClearColor(0x000000, 0);
  const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  const floorM = new T.MeshStandardMaterial({ color: new T.Color('#3a4656').convertSRGBToLinear(), roughness: 0.8, metalness: 0.1 }), lineM = new T.MeshBasicMaterial({ color: 0x6f8aa8 });
  const hexShape = (r) => { const s = new T.Shape(); for (let i = 0; i < 6; i++) { const a = i * PI / 3; i ? s.lineTo(Math.sin(a) * r, Math.cos(a) * r) : s.moveTo(Math.sin(a) * r, Math.cos(a) * r); } s.closePath(); return s; };
  function floor(wide) {   // the floor's hexes round it: its own (two for a 2-tile piece) and the ring next to them, so what is thrown on the floor lies on floor
    const g = new T.Group(), R = 1 / Math.sqrt(3), HH = 1.5 * R, own = wide ? [-0.5, 0.5] : [0];
    for (let row = -2; row <= 2; row++) for (let q = -3; q <= 3; q++) { const x = q + (Math.abs(row) % 2) * 0.5 + (wide ? 0.5 : 0), z = row * HH; if (Math.abs(x) > (wide ? 2.1 : 1.6) || Math.abs(z) > 1.4) continue;
      const mine = row === 0 && own.some(o => Math.abs(o - x) < 0.01);
      const e = new T.Mesh(new T.ShapeGeometry(hexShape(R * 1.0)), lineM); e.rotation.x = -PI / 2; e.position.set(x, -0.014, z); g.add(e);
      const fm = mine ? floorM : floorM.clone(); if (!mine) fm.color.multiplyScalar(0.62);
      const m = new T.Mesh(new T.ShapeGeometry(hexShape(R * 0.965)), fm); m.rotation.x = -PI / 2; m.position.set(x, -0.01, z); g.add(m); }
    return g;
  }
  function shot(name, sh) {
    const scene = new T.Scene(); scene.environment = env;
    scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.5));
    const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
    const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
    const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
    const B = PROPS.hexbreak.build(name); scene.add(B.g); scene.add(floor(sh.wide));
    const k = sh.zoom, cam = new T.OrthographicCamera(-CW / 2 / S / k, CW / 2 / S / k, CH / 2 / S / k, -CH / 2 / S / k, 0.1, 200);
    cam.position.set(D * Math.cos(elev) * Math.SQRT1_2, D * Math.sin(elev) + sh.up, D * Math.cos(elev) * Math.SQRT1_2); cam.lookAt(0, sh.up, 0); cam.updateProjectionMatrix();
    renderer.render(scene, cam); const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; cv.getContext('2d').drawImage(renderer.domElement, 0, 0); return cv;
  }
  const out = {};
  for (const sh of SHEETS) {
    const n = sh.cells.length, PAD = 24, TOP = 70, LAB = 40, W = PAD + n * (CW + PAD), H = TOP + CH + LAB + PAD, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#10151d'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.font = 'bold ' + (n > 3 ? 26 : 24) + 'px DejaVu Sans, sans-serif'; g.fillText(sh.title, PAD, 46, W - 2 * PAD);
    sh.cells.forEach((c, i) => { const x = PAD + i * (CW + PAD);
      g.fillStyle = '#161d28'; g.fillRect(x, TOP, CW, CH + LAB); g.strokeStyle = '#2a3546'; g.lineWidth = 2; g.strokeRect(x, TOP, CW, CH + LAB);
      g.drawImage(shot(c[0], sh), x, TOP);
      g.font = 'bold 22px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.fillStyle = c[2] ? '#ffe37a' : '#9fb0c8'; g.fillText(c[1], x + CW / 2, TOP + CH + 26); g.textAlign = 'left';
      if (i > 0 && !(sh.cells[i][0].split('.')[0] !== sh.cells[i - 1][0].split('.')[0])) { g.fillStyle = '#ffe37a'; g.font = 'bold 40px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.fillText('\\u2192', x - PAD / 2, TOP + CH / 2); g.textAlign = 'left'; } });
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
