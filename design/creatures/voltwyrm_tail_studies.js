// VOLTWYRM'S TAIL: DRAFTS, NOT A DESIGN (the owner, 2026-11-14: "I want to redesign the volt worm, and I want to make the tail a little bit thicker and wider, and make it have like claws on
// the end, like Groudon from Pokemon"). Each draft is the game's own model (design/props/models/larva.js, its TAILS) with a thicker, wider tail and claws of our own at its end (the
// reference's spirit: heavy, pale, hooked; not its shapes), drawn with the bake's own camera and light (design/props/bake_props.js):
//   NOW  the tail as built (look A's twin prongs);   A  three talons splayed like a raptor's foot, hooking down to the floor;
//   B    four claws round the wrist, curling in like a gripping hand;   C  two great pincer claws, sweeping out and hooking back in until their points cross.
// Row 1: the whole boss lying across the screen at the game's size; row 2: its tail's end, close (it faces away up the screen, its tail toward you).
//   node design/creatures/voltwyrm_tail_studies.js <three-dir> <out-dir>   ->  <out-dir>/voltwyrm_tails.png
// Every part and proportion here is the agent's, provisional. Nothing in the game reads this; the bake draws the game's tail until a draft is picked.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'), path = require('path');
const [THREE_DIR, OUTDIR] = process.argv.slice(2);
if (!THREE_DIR || !OUTDIR) { console.error('usage: node design/creatures/voltwyrm_tail_studies.js <three-dir> <out-dir>'); process.exit(1); }
const ROOT = path.join(__dirname, '..', '..'), rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PX = 60 / Math.sin(Math.PI / 4), UH = PX * Math.cos(Math.asin(0.5));

const page = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__draw = async function (PX, UH) {
  ${rd('design/evolutions/forms-core.js')}
  ${rd('design/evolutions/forms2.js')}
  ${rd('design/evolutions/forms29.js')}
  const px = h => h / UH;
  const PROPS = {};
  ${rd('design/props/models/_style.js')}
  ${rd('design/props/models/larva.js')}
  const elev = Math.asin(0.5), D = 40, BG = '#2a2e36';
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.setClearColor(0x000000, 0);
  const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  // one picture: the model by its name and tail, the bake's camera looking at a point of it (its middle, or its tail's end), zoom times the game's size
  const shot = (key, name, W, H, zoom, onTail) => {
    renderer.setSize(W, H, false);
    const scene = new T.Scene(); scene.environment = env;
    scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.5));
    const k1 = new T.DirectionalLight(0xfff1e2, 2.4); k1.position.set(3, 6, 4); scene.add(k1);
    const k2 = new T.DirectionalLight(0x6c8cff, 1.3); k2.position.set(-5, 1.2, 1.5); scene.add(k2);
    const k3 = new T.DirectionalLight(0x6c8cff, 0.6); k3.position.set(2, 1, -5); scene.add(k3);
    const B = PROPS.larva.study(key, name); scene.add(B.g); B.g.updateMatrixWorld(true);
    const inner = B.g.children[0].children[0], focus = onTail ? inner.localToWorld(new T.Vector3(-0.96, 0.22, 0.05)) : new T.Vector3(0, 0.25, 0);
    const cam = new T.OrthographicCamera(-W / 2 / PX / zoom, W / 2 / PX / zoom, H / 2 / PX / zoom, -H / 2 / PX / zoom, 0.1, 200);
    cam.position.set(focus.x + D * Math.cos(elev) * Math.SQRT1_2, focus.y + D * Math.sin(elev), focus.z + D * Math.cos(elev) * Math.SQRT1_2); cam.lookAt(focus); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    renderer.render(scene, cam);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.fillStyle = BG; g.fillRect(0, 0, W, H); g.drawImage(renderer.domElement, 0, 0); return c;
  };
  const cols = [['prongs', 'NOW · the twin prongs'], ['A', 'A · THREE TALONS'], ['B', 'B · GRASPING CLAW'], ['C', 'C · PINCER CLAWS']];
  const CW = 470, R1 = 250, R2 = 300, pad = 22, head = 96, lab = 30, cv = document.createElement('canvas');
  cv.width = pad + cols.length * (CW + pad); cv.height = head + 2 * (lab + pad) + R1 + R2 + pad; const s = cv.getContext('2d');
  s.fillStyle = '#151a24'; s.fillRect(0, 0, cv.width, cv.height);
  s.fillStyle = '#ffffff'; s.font = '800 30px system-ui, sans-serif'; s.fillText("VOLTWYRM'S TAIL · thicker, wider, with claws · drafts", pad, 44);
  s.fillStyle = '#93a1b8'; s.font = '500 17px system-ui, sans-serif'; s.fillText('Row 1: the whole boss at the game\\'s size. Row 2: its tail\\'s end, close (facing away, its tail toward you). The claws are our own: heavy, pale, hooked, their inner edges lit.', pad, 74);
  cols.forEach(([key, title], i) => { const x = pad + i * (CW + pad);
    s.fillStyle = '#ffffff'; s.font = '800 19px system-ui, sans-serif'; s.fillText(title, x, head + 20);
    s.drawImage(shot(key, 'w7_0', CW, R1, 1, false), x, head + lab);
    s.drawImage(shot(key, 'w5_0', CW, R2, 2.6, true), x, head + lab + R1 + pad);
    s.strokeStyle = '#2a3344'; s.lineWidth = 2; s.strokeRect(x, head + lab, CW, R1); s.strokeRect(x, head + lab + R1 + pad, CW, R2); });
  return cv.toDataURL('image/png');
};
</script></body></html>`;

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://draw.local/', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: page }));
  await p.goto('http://draw.local/');
  let url; try { url = await p.evaluate(([a, b2]) => window.__draw(a, b2), [PX, UH]); } catch (e) { console.log('ERRORS', errs.slice(0, 5), e.message); await b.close(); process.exit(1); }
  fs.mkdirSync(OUTDIR, { recursive: true });
  const out = path.join(OUTDIR, 'voltwyrm_tails.png'); fs.writeFileSync(out, Buffer.from(url.split(',')[1], 'base64'));
  console.log('wrote', out, errs.length ? 'PAGE ERRORS ' + JSON.stringify(errs.slice(0, 3)) : '');
  await b.close();
})();
