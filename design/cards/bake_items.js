// Bakes the EQUIP CARDS' ITEMS from 3D models: each card's own object (EMBER PLATING, FURNACE HEART...), which floats up out of its card on the CARDS screen in place of the element's crystal.
//   node design/cards/bake_items.js <three-dir> <id[,id...]|all>      e.g.  node design/cards/bake_items.js /tmp/threepkg ember_plating
// <three-dir>: an unpacked three@0.128.0 npm package, as for design/props/bake_props.js and design/evolutions/bake.js.
// ASKED (the owner, 2026-11-01): "give 3D item looks instead of crystal for the first packs designs ... the item itself needs to be a 3D object that hovers out of the picture of the card itself", in the game-model look
// (the owner's pick: "modeled in 3D and lit like the followers and props"). docs/ART-PROCESS.md: one piece first, approved before the rest of the family is made, the crystal kept until then.
// A model is a file design/cards/models/<id>.js (the card's id in js/cards.js) that registers `ITEMS.<id> = { build() -> { g }, exposure? }` with the helpers of design/evolutions/forms-core.js (T, G, cbox, cyl,
// torus, tube, sphere, plate, PI, TAU...) and the facility's style kit design/props/models/_style.js (STY). The item sits at the origin, about a unit across, +y up; it is lit as the props are (the same key, rim and
// back lights and the same soft-box reflections) and seen by a hero camera from the front-right and a little above, so its top and its front read at card size.
// Output: img/cards/<id>.png, the item alone on transparency, cropped with a margin.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const THREE_DIR = process.argv[2], WANT = (process.argv[3] || 'all').split(',');
const ROOT = path.join(__dirname, '..', '..'), MODELS = path.join(__dirname, 'models'), OUT = path.join(ROOT, 'img', 'cards');
const ids = fs.readdirSync(MODELS).filter(f => f.endsWith('.js') && !f.startsWith('_')).map(f => f.slice(0, -3)).filter(f => WANT.includes('all') || WANT.includes(f));
const read = f => fs.readFileSync(f, 'utf8');
const core = read(path.join(ROOT, 'design', 'evolutions', 'forms-core.js')), f2 = read(path.join(ROOT, 'design', 'evolutions', 'forms2.js')), f29 = read(path.join(ROOT, 'design', 'evolutions', 'forms29.js'));
const style = read(path.join(ROOT, 'design', 'props', 'models', '_style.js'));
const shared = fs.readdirSync(MODELS).filter(f => f.endsWith('.js') && f.startsWith('_')).map(f => read(path.join(MODELS, f))).join('\n');
const models = ids.map(id => read(path.join(MODELS, id + '.js'))).join('\n');
const SIZE = 720;   // the render (square); the card shows it at about a third of this, so it stays sharp on a high-density screen

const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__bake = async function (ids, SIZE) {
  ${core}
  ${f2}
  ${f29}
  const px = h => h / 73.48;   // (a height in game pixels, as the props' helper, should a model want it: design/props/bake_props.js UH)
  ${style}
  const ITEMS = {};
  ${shared}
  ${models}
  const out = {};
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.setSize(SIZE, SIZE, false); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.setClearColor(0x000000, 0);
  // the soft-box room the props reflect (design/props/bake_props.js)
  const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  for (const id of ids) {
    const def = ITEMS[id]; if (!def) throw new Error('no model registers ITEMS.' + id);
    renderer.toneMappingExposure = def.exposure || 1.05;
    const scene = new T.Scene(); scene.environment = env;
    scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.5));
    const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
    const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
    const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
    const B = def.build(); scene.add(B.g);
    // the hero camera: front-right, a little above, a long lens so the item is not distorted; framed on the item's bounds
    const box = new T.Box3().setFromObject(B.g), c = box.getCenter(new T.Vector3()), r = box.getBoundingSphere(new T.Sphere()).radius;
    const cam = new T.PerspectiveCamera(24, 1, 0.05, 100), az = def.az == null ? 0.62 : def.az, el = def.el == null ? 0.36 : def.el, dist = r / Math.sin(24 * PI / 360) * 1.06;
    cam.position.set(c.x + dist * Math.cos(el) * Math.sin(az), c.y + dist * Math.sin(el), c.z + dist * Math.cos(el) * Math.cos(az)); cam.lookAt(c); cam.updateProjectionMatrix();
    renderer.render(scene, cam);
    const cv = document.createElement('canvas'); cv.width = SIZE; cv.height = SIZE; const g = cv.getContext('2d'); g.drawImage(renderer.domElement, 0, 0);
    const d = g.getImageData(0, 0, SIZE, SIZE).data; let x0 = SIZE, y0 = SIZE, x1 = -1, y1 = -1;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (d[(y * SIZE + x) * 4 + 3] > 6) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) throw new Error(id + ' is empty');
    const edge = x0 === 0 || y0 === 0 || x1 === SIZE - 1 || y1 === SIZE - 1, m = 6;
    x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(SIZE - 1, x1 + m); y1 = Math.min(SIZE - 1, y1 + m);
    const w = x1 - x0 + 1, h = y1 - y0 + 1, c2 = document.createElement('canvas'); c2.width = w; c2.height = h; c2.getContext('2d').drawImage(cv, x0, y0, w, h, 0, 0, w, h);
    out[id] = { png: c2.toDataURL('image/png'), w, h, edge };
  }
  renderer.dispose();
  return out;
};
</script></body></html>`;

(async () => {
  if (!ids.length) { console.log('no item models matched', WANT.join(',')); process.exit(1); }
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://bake.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://bake.local/');
  let res; try { res = await p.evaluate(([a, s]) => window.__bake(a, s), [ids, SIZE]); } catch (e) { console.log('ERRORS', errs.slice(0, 5), e.message); await b.close(); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  for (const [id, r] of Object.entries(res)) {
    const f = path.join(OUT, id + '.png'); fs.writeFileSync(f, Buffer.from(r.png.split(',')[1], 'base64'));
    console.log(id, r.w + 'x' + r.h, fs.statSync(f).size, 'bytes', r.edge ? '(EDGE!)' : '');
  }
  if (errs.length) console.log('PAGE ERRORS', errs.slice(0, 5));
  await b.close();
})();
