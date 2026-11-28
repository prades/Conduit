// A SHARP REVIEW SHEET for the hex cargo drafts (design/props/drafts/hexcargo.js): each of the game's own props (design/props/models/cargo.js) beside its six-sided draft, rendered straight from the 3D
// models at K times game size (not a sprite blown up), in the baker's own light and camera (design/props/bake_props.js), each standing on its floor cell (a square tile; a hex of the floor's grid).
//   node design/hex-objects/render.js <three-dir> <out-dir> [K]
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'), path = require('path');
const [THREE_DIR, OUTDIR, KARG] = process.argv.slice(2), K = +KARG || 4, REPO = path.join(__dirname, '..', '..');
const rd = f => fs.readFileSync(path.join(REPO, f), 'utf8');
const PX = 60 / Math.sin(Math.PI / 4), UH = PX * Math.cos(Math.asin(0.5));
const SHEETS = [
  { file: 'draft3-crates.png', title: 'The crates: today (left of each pair) and six-sided (right)', pairs: [['cargo', 'crate.s0', 'hexcargo', 'hexcrate.s0'], ['cargo', 'crate.s1', 'hexcargo', 'hexcrate.s1'], ['cargo', 'crate.s2', 'hexcargo', 'hexcrate.s2'], ['cargo', 'crate.s3', 'hexcargo', 'hexcrate.s3']] },
  { file: 'draft3-barrels.png', title: 'The barrels: today and six-sided', pairs: [['cargo', 'barrel.s0', 'hexcargo', 'hexdrum.s0'], ['cargo', 'barrel.s1', 'hexcargo', 'hexdrum.s1'], ['cargo', 'barrel.s2', 'hexcargo', 'hexdrum.s2'], ['cargo', 'barrel.s3', 'hexcargo', 'hexdrum.s3']] },
  { file: 'draft3-stacks-barrier.png', title: 'The crate stacks and the barrier: today and six-sided', pairs: [['cargo', 'crate_stack.s0', 'hexcargo', 'hexstack.s0'], ['cargo', 'crate_stack.s1', 'hexcargo', 'hexstack.s1'], ['cargo', 'barrier', 'hexcargo', 'hexbarrier']] },
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
  ${rd('design/props/models/cargo.js')}
  ${rd('design/props/drafts/hexcargo.js')}
  const elev = Math.asin(0.5), D = 40, CW = 150 * K, CH = 150 * K, S = PX * K;
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.setSize(CW, CH, false); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 0.95; renderer.setClearColor(0x000000, 0);
  const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  const floorM = new T.MeshStandardMaterial({ color: new T.Color('#3a4656').convertSRGBToLinear(), roughness: 0.8, metalness: 0.1 }), lineM = new T.MeshBasicMaterial({ color: 0x6f8aa8 });
  const hexShape = (r) => { const s = new T.Shape(); for (let i = 0; i < 6; i++) { const a = i * PI / 3; i ? s.lineTo(Math.sin(a) * r, Math.cos(a) * r) : s.moveTo(Math.sin(a) * r, Math.cos(a) * r); } s.closePath(); return s; };
  function floor(kind, wide) {   // the cell it stands on: a square tile (two for the barrier), or a hex of the floor's grid (two side by side)
    const g = new T.Group(), R = 1 / Math.sqrt(3);
    const cell = (x) => { let geo, edge;
      if (kind === 'hex') { geo = new T.ShapeGeometry(hexShape(R * 0.985)); edge = new T.ShapeGeometry(hexShape(R * 1.02)); }
      else { geo = new T.PlaneGeometry(0.97, 0.97); edge = new T.PlaneGeometry(1.01, 1.01); }
      const e = new T.Mesh(edge, lineM); e.rotation.x = -PI / 2; e.position.set(x, -0.012, 0); g.add(e);
      const m = new T.Mesh(geo, floorM); m.rotation.x = -PI / 2; m.position.set(x, -0.008, 0); g.add(m); };
    if (wide) { cell(-0.5); cell(0.5); } else cell(0);
    return g;
  }
  function shot(fam, name) {
    const wide = /barrier/.test(name), scene = new T.Scene(); scene.environment = env;
    scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.5));
    const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
    const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
    const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
    const B = PROPS[fam].build(name); scene.add(B.g); scene.add(floor(fam === 'hexcargo' ? 'hex' : 'sq', wide));
    const k = wide ? 0.62 : 1, cam = new T.OrthographicCamera(-CW / 2 / S / k, CW / 2 / S / k, CH / 2 / S / k, -CH / 2 / S / k, 0.1, 200);
    cam.position.set(D * Math.cos(elev) * Math.SQRT1_2, D * Math.sin(elev) + 0.32 / k, D * Math.cos(elev) * Math.SQRT1_2); cam.lookAt(0, 0.32 / k, 0); cam.updateProjectionMatrix();
    renderer.render(scene, cam); const cv = document.createElement('canvas'); cv.width = CW; cv.height = CH; cv.getContext('2d').drawImage(renderer.domElement, 0, 0); return cv;
  }
  const out = {};
  for (const sh of SHEETS) {
    const n = sh.pairs.length, PAD = 24, TOP = 70, LAB = 34, W = PAD + n * (2 * CW + PAD), H = TOP + CH + LAB + PAD, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
    g.fillStyle = '#10151d'; g.fillRect(0, 0, W, H); g.fillStyle = '#ffffff'; g.font = 'bold 30px DejaVu Sans, sans-serif'; g.fillText(sh.title, PAD, 46);
    sh.pairs.forEach((p, i) => { const x = PAD + i * (2 * CW + PAD);
      g.fillStyle = '#161d28'; g.fillRect(x, TOP, 2 * CW, CH + LAB); g.strokeStyle = '#2a3546'; g.lineWidth = 2; g.strokeRect(x, TOP, 2 * CW, CH + LAB);
      g.drawImage(shot(p[0], p[1]), x, TOP); g.drawImage(shot(p[2], p[3]), x + CW, TOP);
      g.font = 'bold 20px DejaVu Sans, sans-serif'; g.textAlign = 'center'; g.fillStyle = '#9fb0c8'; g.fillText('TODAY', x + CW / 2, TOP + CH + 22); g.fillStyle = '#ffe37a'; g.fillText('SIX-SIDED', x + CW + CW / 2, TOP + CH + 22); g.textAlign = 'left'; });
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
