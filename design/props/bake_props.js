// Bakes the facility's PROP sprites from 3D models: the sentry turret, the plants, the arena's missile truck, its liquid tanks and the catwalk bridges (docs/TUTORIAL.md, "3D props").
//   node design/props/bake_props.js <three-dir> <family[,family...]|all>      e.g.  node design/props/bake_props.js /tmp/threepkg sentry,plant
// <three-dir>: an unpacked three@0.128.0 npm package (its package/build/three.min.js), as for design/evolutions/bake.js.
// A family is a file design/props/models/<family>.js that registers `PROPS.<family> = { variants: [name, ...], canvas: [w, h], build(name) -> { g, marks } }` using the helpers of design/evolutions/forms-core.js
// (T = three, M = materials, G(), cbox(), cyl(), torus(), V(), PI, TAU ...) and the constants below. `g` is a THREE.Group with the model's footprint centre at the origin and the ground at y = 0, +x is the
// game's x (down-right on screen), +z is the game's y (down-left), +y is up. `marks` is { name: [x, y, z] }: points of the model the game wants to know the screen position of (a lamp, a muzzle).
// THE SCALE: one world unit is ONE TILE of the game. The game draws a tile step along x as (60, 30) px (TILE_W, TILE_H in js/config.js), so the camera is an orthographic 2:1 iso one with PX = 60 / sin(45) px to
// the unit, and a height of H game-pixels (the game's z) is H / UH units (a unit of height is UH px on screen: PX * cos(30 deg)). Use `px(H)` for a height given in game pixels. The map's elevation is 34 px a tile.
// Output: img/props/<family>.png (all the variants packed in one sheet, each cropped) and design/props/out/<family>.json (where each is in the sheet, and where the ground point under the model's origin and
// every mark are inside it); then js/propatlas.js (all the families' json, as data, since the page cannot fetch files) is written from every json in design/props/out.
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const THREE_DIR = process.argv[2], WANT = (process.argv[3] || 'all').split(',');
const ROOT = path.join(__dirname, '..', '..'), MODELS = path.join(__dirname, 'models'), OUT = path.join(__dirname, 'out');
const files = fs.readdirSync(MODELS).filter(f => f.endsWith('.js')).sort();
const shared = files.filter(f => f.startsWith('_'));   // _style.js and the like: shared helpers, loaded before every family, never baked themselves
const fams = files.filter(f => !f.startsWith('_')).map(f => f.slice(0, -3)).filter(f => WANT.includes('all') || WANT.includes(f));
const core = fs.readFileSync(path.join(__dirname, '..', 'evolutions', 'forms-core.js'), 'utf8');
const f29 = fs.readFileSync(path.join(__dirname, '..', 'evolutions', 'forms29.js'), 'utf8');
const f2 = fs.readFileSync(path.join(__dirname, '..', 'evolutions', 'forms2.js'), 'utf8');
const modelSrc = shared.concat(fams.map(f => f + '.js')).map(f => fs.readFileSync(path.join(MODELS, f), 'utf8')).join('\n');
const PX = 60 / Math.sin(Math.PI / 4), UH = PX * Math.cos(Math.asin(0.5));

const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__bake = async function (fams, PX, UH) {
  ${core}
  ${f2}
  ${f29}
  const px = h => h / UH;                  // a height in game pixels, in units
  const PROPS = {};
  ${modelSrc}
  const out = {};
  const elev = Math.asin(0.5), D = 40;
  for (const fam of fams) {
    const def = PROPS[fam]; const [W, H] = def.canvas || [1400, 1000];
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
    renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = def.exposure || 1.05; renderer.setClearColor(0x000000, 0);
    const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
    const soft = (w, h, x, y, z, c, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); };
    soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
    const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
    const cam = new T.OrthographicCamera(-W / 2 / PX, W / 2 / PX, H / 2 / PX, -H / 2 / PX, 0.1, 200);
    cam.position.set(D * Math.cos(elev) * Math.SQRT1_2, D * Math.sin(elev), D * Math.cos(elev) * Math.SQRT1_2); cam.lookAt(0, 0, 0); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    const proj = (x, y, z) => { const v = new T.Vector3(x, y, z).project(cam); return [(v.x * 0.5 + 0.5) * W, (1 - (v.y * 0.5 + 0.5)) * H]; };
    const cells = [];
    for (const name of def.variants) {
      const scene = new T.Scene(); scene.environment = env;
      scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.5));
      const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
      const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
      const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
      const B = def.build(name); scene.add(B.g); if (B.update) B.update(0);
      B.g.traverse(o => { if (o.isSprite) o.visible = false; });
      renderer.render(scene, cam);
      const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d'); g.drawImage(renderer.domElement, 0, 0);
      const d = g.getImageData(0, 0, W, H).data; let x0 = W, y0 = H, x1 = -1, y1 = -1;
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[(y * W + x) * 4 + 3] > 8) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      if (x1 < 0) throw new Error(fam + '/' + name + ' is empty');
      const edge = x0 === 0 || y0 === 0 || x1 === W - 1 || y1 === H - 1; x0 = Math.max(0, x0 - 2); y0 = Math.max(0, y0 - 2); x1 = Math.min(W - 1, x1 + 2); y1 = Math.min(H - 1, y1 + 2);
      const w = x1 - x0 + 1, h = y1 - y0 + 1, c2 = document.createElement('canvas'); c2.width = w; c2.height = h; c2.getContext('2d').drawImage(cv, x0, y0, w, h, 0, 0, w, h);
      const o = proj(0, 0, 0), marks = {}; for (const [k, p] of Object.entries(B.marks || {})) { const q = proj(p[0], p[1], p[2]); marks[k] = [Math.round((q[0] - x0) * 10) / 10, Math.round((q[1] - y0) * 10) / 10]; }
      cells.push({ name, w, h, cv: c2, ax: Math.round((o[0] - x0) * 10) / 10, ay: Math.round((o[1] - y0) * 10) / 10, marks, edge });
    }
    // pack: rows of cells, widest row at most 4096
    const maxW = Math.min(4096, Math.max(...cells.map(c => c.w))*Math.max(1, Math.min(cells.length, 4))); let x = 0, y = 0, rowH = 0, sheetW = 0; const place = [];
    for (const c of cells) { if (x + c.w > maxW && x > 0) { x = 0; y += rowH; rowH = 0; } place.push([x, y]); x += c.w; rowH = Math.max(rowH, c.h); sheetW = Math.max(sheetW, x); }
    const sheet = document.createElement('canvas'); sheet.width = sheetW; sheet.height = y + rowH; const sg = sheet.getContext('2d');
    const meta = { px: PX, uh: UH, sheet: [sheet.width, sheet.height], cells: {} };
    cells.forEach((c, i) => { sg.drawImage(c.cv, place[i][0], place[i][1]); meta.cells[c.name] = { x: place[i][0], y: place[i][1], w: c.w, h: c.h, ax: c.ax, ay: c.ay, marks: c.marks, edge: c.edge }; });
    out[fam] = { png: sheet.toDataURL('image/png'), meta };
    renderer.dispose();
  }
  return out;
};
</script></body></html>`;

(async () => {
  const b = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome', args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://bake.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://bake.local/');
  let res; try { res = await p.evaluate(([f, a, b2]) => window.__bake(f, a, b2), [fams, PX, UH]); } catch (e) { console.log('ERRORS', errs.slice(0, 5), e.message); await b.close(); process.exit(1); }
  fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(path.join(ROOT, 'img', 'props'), { recursive: true });
  for (const [id, r] of Object.entries(res)) {
    fs.writeFileSync(path.join(ROOT, 'img', 'props', id + '.png'), Buffer.from(r.png.split(',')[1], 'base64')); fs.writeFileSync(path.join(OUT, id + '.json'), JSON.stringify(r.meta));
    console.log(id, r.meta.sheet.join('x'), fs.statSync(path.join(ROOT, 'img', 'props', id + '.png')).size, 'bytes', Object.entries(r.meta.cells).map(([k, c]) => k + (c.edge ? '(EDGE!)' : '')).join(' '));
  }
  // js/propatlas.js: every family's json, as data
  const all = {}; for (const f of fs.readdirSync(OUT).filter(f => f.endsWith('.json'))) all[f.slice(0, -5)] = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'));
  fs.writeFileSync(path.join(ROOT, 'js', 'propatlas.js'), '// GENERATED by design/props/bake_props.js: where each prop sprite is in img/props/<family>.png, and its anchor and marks. Do not edit.\nconst PROP_ATLAS = ' + JSON.stringify(all) + ';\n');
  if (errs.length) console.log('PAGE ERRORS', errs.slice(0, 5));
  await b.close();
})();
