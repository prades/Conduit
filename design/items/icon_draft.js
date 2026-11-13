// DRAFT, ONE PIECE FIRST (docs/ART-PROCESS.md): the PACK's items as 3D assets (the owner, 2026-11-13: "I want to redo the items in the game make them have 3-D looking assets").
// The AMMO PACK as a real 3D model, in the props' style kit and light (design/props/models/_style.js, design/props/bake_props.js), seen from the game's own camera (2:1 iso), framed to fill an icon.
// Its design is the ground model's (design/props/models/pickups.js `ammo_pack`, build 2026-11-09zz: a paper sleeve with an orange band, its top torn open on a row of brass rounds), made at icon detail:
// the rounds' cases, rims and copper tips, the torn flap, the band's printed label (AMMO · 10 RDS, the item's +10 rounds), the lore's stamped rota.
//   node design/items/icon_draft.js <three-dir> <out-dir>   ->  <out-dir>/ammo_hero.png (large, on a dark backdrop) and <out-dir>/ammo_icon.png (320 x 320, clear: for the PACK's tiles and stage)
// Nothing in the game reads this; if approved, the items' icons are baked by a tool made from it.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'), path = require('path');
const [THREE_DIR, OUTDIR] = process.argv.slice(2);
if (!THREE_DIR || !OUTDIR) { console.error('usage: node design/items/icon_draft.js <three-dir> <out-dir>'); process.exit(1); }
const ROOT = path.join(__dirname, '..', '..'), rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PX = 60 / Math.sin(Math.PI / 4), UH = PX * Math.cos(Math.asin(0.5));

const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__draw = async function (PX, UH) {
  ${rd('design/evolutions/forms-core.js')}
  ${rd('design/evolutions/forms2.js')}
  ${rd('design/evolutions/forms29.js')}
  const px = h => h / UH;
  ${rd('design/props/models/_style.js')}
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; }, rot = (m, x, y, z) => { m.rotation.set(x || 0, y || 0, z || 0); return m; };
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };
  const decal = (w, h, t, extra) => new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial(Object.assign({ map: t, transparent: true, metalness: 0, roughness: 0.7, depthWrite: false }, extra || {})));

  // ── THE AMMO PACK ──
  const paper = STY.std('#b48f5c', 0, 0.85), paperDk = STY.std('#7e6240', 0, 0.88), paperIn = STY.std('#cfb07a', 0, 0.85), inside = STY.std('#140e08', 0, 0.95);
  const brass = STY.std('#f4c65c', 0.72, 0.27), brassDk = STY.std('#c9963c', 0.72, 0.32), copper = STY.std('#e38a4e', 0.68, 0.3), primer = STY.std('#d5dae2', 0.7, 0.3);
  const SW = 0.3, SH = 0.15, SD = 0.17, primerUnused = primer;   // the sleeve: width (x), height, depth (z)
  // a round: brass case, its rim at the mouth, a copper tip (a lathe: the ogive)
  const tipGeo = new T.LatheGeometry([V(0, 0.036, 0), V(0.004, 0.034, 0), V(0.009, 0.028, 0), V(0.013, 0.019, 0), V(0.0155, 0.009, 0), V(0.0158, 0, 0)].map(v => new T.Vector2(v.x, v.y)), 18);
  const round = () => { const r = G();
    r.add(at(cyl(0.0172, 0.0172, 0.072, brass, 18), 0, 0.036, 0));
    r.add(at(cyl(0.0185, 0.0185, 0.006, brassDk, 18), 0, 0.003, 0));   // the rim at its base
    r.add(at(cyl(0.0164, 0.0172, 0.006, brassDk, 18), 0, 0.072, 0));   // the case mouth
    r.add(at(new T.Mesh(tipGeo, copper), 0, 0.074, 0));
    return r; };
  const g = G(), s = G(); s.rotation.y = 0.45; g.add(s);
  // the sleeve, the band round its middle, a darker scuffed foot
  s.add(at(cbox(SW, SH, SD, 0.008, paper), 0, SH / 2, 0));
  s.add(at(cbox(SW + 0.004, 0.012, SD + 0.004, 0.003, paperDk), 0, 0.006, 0));
  s.add(at(cbox(SW + 0.005, 0.056, SD + 0.005, 0.004, STY.std('#e9771f', 0.02, 0.6)), 0, 0.074, 0));
  // its labels: the front (+z) AMMO · 10 RDS, the end (+x) 10 RDS; the stamped rota on the paper above the band (the lore: "a rota nobody kept")
  const ink = '#1e0f05';
  const front = tex(512, 96, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = ink; c.font = 'bold 64px DejaVu Sans Condensed, DejaVu Sans, sans-serif'; c.textBaseline = 'middle'; c.fillText('AMMO', 22, h / 2 + 3);
    c.font = 'bold 34px DejaVu Sans Mono, monospace'; c.fillText('10 RDS', 296, h / 2 + 4); for (let i = 0; i < 9; i++) c.fillRect(444 + i * 6, 24, i % 3 ? 3 : 5, 48); });
  s.add(at(decal(SW * 0.94, 0.05, front), 0, 0.074, SD / 2 + 0.0035));
  const end = tex(192, 96, (c, w, h) => { c.fillStyle = ink; c.font = 'bold 40px DejaVu Sans Mono, monospace'; c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText('10 RDS', w / 2, h / 2 + 3); });
  s.add(at(rot(decal(SD * 0.9, 0.046, end), 0, Math.PI / 2, 0), SW / 2 + 0.0035, 0.074, 0));
  const rota = tex(256, 160, (c, w, h) => { c.strokeStyle = 'rgba(40,52,90,0.75)'; c.lineWidth = 4; c.strokeRect(8, 8, w - 16, h - 16); c.lineWidth = 2;
    for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(8 + i * (w - 16) / 5, 8); c.lineTo(8 + i * (w - 16) / 5, h - 8); c.stroke(); } for (let j = 1; j < 3; j++) { c.beginPath(); c.moveTo(8, 8 + j * (h - 16) / 3); c.lineTo(w - 8, 8 + j * (h - 16) / 3); c.stroke(); }
    c.lineWidth = 5; for (const x0 of [24, 68]) { c.beginPath(); c.moveTo(x0, 30); c.lineTo(x0 + 9, 42); c.lineTo(x0 + 26, 18); c.stroke(); } });
  s.add(at(rot(decal(0.07, 0.044, rota, { opacity: 0.85 }), 0, 0, -0.06), -0.085, 0.124, SD / 2 + 0.0032));
  // its top torn open: the dark inside, the rim of the paper round it, the torn flap folded back
  s.add(at(rot(new T.Mesh(new T.PlaneGeometry(SW - 0.022, SD - 0.022), inside), -Math.PI / 2, 0, 0), 0, SH + 0.0015, 0));
  const flapShape = new T.Shape(); flapShape.moveTo(-SW / 2 + 0.004, 0); flapShape.lineTo(SW / 2 - 0.004, 0); flapShape.lineTo(SW / 2 - 0.004, 0.05);
  for (let i = 0; i <= 14; i++) { const x = SW / 2 - 0.004 - i * (SW - 0.008) / 14; flapShape.lineTo(x, 0.03 + (i % 2 ? 0.01 : 0) + Math.sin(i * 1.7) * 0.004); }
  flapShape.lineTo(-SW / 2 + 0.004, 0);
  const flap = new T.Mesh(new T.ExtrudeGeometry(flapShape, { depth: 0.002, bevelEnabled: false }), paperIn); flap.material = paperIn.clone(); flap.material.side = T.DoubleSide;
  s.add(at(rot(flap, -0.95, 0, 0), 0, SH - 0.002, -SD / 2 + 0.002));
  // the rounds: two rows of five standing in it, their tips over the rim, two pulled up a little, one gone
  for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) { if (row === 1 && i === 3) continue;
    const lift = (row === 0 && i === 1) ? 0.016 : (row === 1 && i === 4) ? 0.009 : 0, x = -SW / 2 + 0.042 + i * 0.054 + (row ? 0.012 : 0), z = row ? -0.03 : 0.032;
    s.add(at(round(), x, SH - 0.06 + lift, z)); }
  // (a round lying loose in front of it was tried: at the icon's size it is a speck, and it shrank the box in its frame)

  // ── the light, as the props are baked ──
  const shoot = (W, H, bg, pad) => {
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
    renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0; renderer.setClearColor(0x000000, 0);
    const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
    const soft = (w, h, x, y, z, c, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(0, ry || 0, 0); es.add(m); };
    soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
    const scene = new T.Scene(); scene.environment = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
    scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.5));
    const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
    const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
    const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
    scene.add(g);
    // a soft contact shadow under it
    const sh = new T.Mesh(new T.PlaneGeometry(0.7, 0.6), new T.MeshBasicMaterial({ map: tex(128, 128, (c, w, h) => { const r = c.createRadialGradient(w / 2, h / 2, 2, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(0,0,0,0.55)'); r.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false }));
    sh.rotation.x = -Math.PI / 2; sh.position.set(0.03, 0.0005, 0.04); scene.add(sh);
    // the game's camera (2:1 iso, from +x +z), framed to the model
    const elev = Math.asin(0.5), D = 40, cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    cam.position.set(D * Math.cos(elev) * Math.SQRT1_2, D * Math.sin(elev), D * Math.cos(elev) * Math.SQRT1_2); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
    const box = new T.Box3().setFromObject(g); let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const X of [box.min.x, box.max.x]) for (const Y of [box.min.y, box.max.y]) for (const Z of [box.min.z, box.max.z]) { const v = new T.Vector3(X, Y, Z).applyMatrix4(cam.matrixWorldInverse); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, half = Math.max(x1 - x0, y1 - y0) / 2 * (1 + pad);
    cam.left = cx - half; cam.right = cx + half; cam.top = cy + half; cam.bottom = cy - half; cam.updateProjectionMatrix();
    renderer.render(scene, cam);
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const c2 = cv.getContext('2d');
    if (bg) { const r = c2.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H / 2, W * 0.7); r.addColorStop(0, '#1d2a44'); r.addColorStop(1, '#070b16'); c2.fillStyle = r; c2.fillRect(0, 0, W, H); }
    c2.drawImage(renderer.domElement, 0, 0); renderer.dispose(); scene.remove(g);
    return cv.toDataURL('image/png');
  };
  return { hero: shoot(1000, 1000, true, 0.2), icon: shoot(320, 320, false, 0.03) };
};
</script></body></html>`;

(async () => {
  const OLD_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b = await chromium.launch({ ...(fs.existsSync(OLD_CHROME) ? { executablePath: OLD_CHROME } : {}), args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://draw.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://draw.local/');
  let res; try { res = await p.evaluate(([a, b2]) => window.__draw(a, b2), [PX, UH]); } catch (e) { console.log('ERRORS', errs.slice(0, 5), e.message); await b.close(); process.exit(1); }
  fs.mkdirSync(OUTDIR, { recursive: true });
  for (const k of ['hero', 'icon']) fs.writeFileSync(path.join(OUTDIR, 'ammo_' + k + '.png'), Buffer.from(res[k].split(',')[1], 'base64'));
  console.log('wrote', path.join(OUTDIR, 'ammo_hero.png'), path.join(OUTDIR, 'ammo_icon.png'), errs.length ? 'PAGE ERRORS ' + JSON.stringify(errs.slice(0, 3)) : '');
  await b.close();
})();
