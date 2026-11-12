// Bakes THE ENERGY CARDS' 3D GEMS (design/cards/energy/gems3d.js) to img/cards/energy_<element>.png: each gem alone on transparency, cropped with a margin, lit as the card items are
// (design/cards/bake_items.js: the soft-box room, key, rim and back lights, ACES, sRGB). The card hovers it over its element's world (js/energygem.js); its glow is the card's (game.html).
//   node design/cards/energy/bake.js <three-dir> [element,element...]      e.g.  node design/cards/energy/bake.js /tmp/threepkg fire,ice
// <three-dir>: an unpacked three@0.128.0 npm package (its package/build/three.min.js), as for design/props/bake_props.js. Then node tools/images.js (or the stamp) makes the WebP and the map.
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
require('./gems3d.js');
const THREE_DIR = process.argv[2], ALL = ['fire', 'ice', 'electric', 'flux', 'core', 'toxic', 'blossom'];
const WANT = (process.argv[3] || ALL.join(',')).split(',').filter(e => ALL.includes(e));
const ROOT = path.join(__dirname, '..', '..', '..'), OUT = path.join(ROOT, 'img', 'cards');
const SIZE = 640;   // (the card shows a gem at about 180 px; a high-density screen at twice that)
if (!THREE_DIR || !WANT.length) { console.log('usage: node design/cards/energy/bake.js <three-dir> [' + ALL.join(',') + ']'); process.exit(1); }
const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
${global.GEMS_JS}
window.__bake = function (list, SIZE) {
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.setSize(SIZE, SIZE, false); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.setClearColor(0x000000, 0);
  const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  const out = {};
  for (const el of list) {
    const def = GEMS[el]; renderer.toneMappingExposure = def.exposure || 1.05;
    const scene = new T.Scene(); scene.environment = env;
    scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.5));
    const key = new T.DirectionalLight(0xfff1e2, 2.2); key.position.set(3, 6, 4); scene.add(key);
    const rim = new T.DirectionalLight(0x6c8cff, 1.2); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
    const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
    const gem = def.build(); scene.add(gem);
    const box = new T.Box3().setFromObject(gem), c = box.getCenter(new T.Vector3()), r = box.getBoundingSphere(new T.Sphere()).radius; gem.position.sub(c);
    const cam = new T.PerspectiveCamera(24, 1, 0.05, 100), az = def.az == null ? 0.4 : def.az, elv = def.el == null ? 0.2 : def.el, dist = r / Math.sin(24 * PI / 360) * 1.06;
    cam.position.set(dist * Math.cos(elv) * Math.sin(az), dist * Math.sin(elv), dist * Math.cos(elv) * Math.cos(az)); cam.lookAt(0, 0, 0); cam.updateProjectionMatrix();
    renderer.render(scene, cam);
    const cv = document.createElement('canvas'); cv.width = SIZE; cv.height = SIZE; const g = cv.getContext('2d'); g.drawImage(renderer.domElement, 0, 0);
    const d = g.getImageData(0, 0, SIZE, SIZE).data; let x0 = SIZE, y0 = SIZE, x1 = -1, y1 = -1;
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) if (d[(y * SIZE + x) * 4 + 3] > 10) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (x1 < 0) throw new Error(el + ' is empty');
    const edge = x0 === 0 || y0 === 0 || x1 === SIZE - 1 || y1 === SIZE - 1, m = 8;
    x0 = Math.max(0, x0 - m); y0 = Math.max(0, y0 - m); x1 = Math.min(SIZE - 1, x1 + m); y1 = Math.min(SIZE - 1, y1 + m);
    const w = x1 - x0 + 1, h = y1 - y0 + 1, c2 = document.createElement('canvas'); c2.width = w; c2.height = h; c2.getContext('2d').drawImage(cv, x0, y0, w, h, 0, 0, w, h);
    out[el] = { png: c2.toDataURL('image/png'), w, h, edge };
  }
  renderer.dispose(); return out;
};
</script></body></html>`;
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://bake.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://bake.local/');
  let res; try { res = await p.evaluate(([a, s]) => window.__bake(a, s), [WANT, SIZE]); } catch (e) { console.log('ERRORS', errs.slice(0, 5), e.message); await b.close(); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true });
  for (const [el, r] of Object.entries(res)) {
    const f = path.join(OUT, 'energy_' + el + '.png'); fs.writeFileSync(f, Buffer.from(r.png.split(',')[1], 'base64'));
    console.log('energy_' + el, r.w + 'x' + r.h, fs.statSync(f).size, 'bytes', r.edge ? '(EDGE!)' : '');
  }
  if (errs.length) console.log('PAGE ERRORS', errs.slice(0, 5));
  await b.close();
})();
