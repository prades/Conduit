// THE FORMS' EFFECT PIECES, modelled in 3D and baked like the forms (docs/EFFECTS.md: the owner chose "Modelled 3D pieces", 2026-11-09).
// The models reuse the forms' own model code (design/evolutions/forms*.js) so a piece is made of what its form is made of: the Quillstone's quill
// is one of the red shards on its back (forms15.js _quillShard, _redShardMat). The lights, the environment and the camera are the forms' baker's
// (design/evolutions/bake.js): the game's 2:1 iso camera, a warm key light from above right, a blue rim light.
//   node design/effects/bake_fx.js <three-dir> preview quill <out.png>   one piece, large, with its form beside it for scale (for the owner's yes: docs/ART-PROCESS.md)
//   node design/effects/bake_fx.js <three-dir> sheet quill img/fx          the game's sheet: one column per direction it flies (yaws, round the floor, the first along the game's +x),
//                                                                          one row per tilt (pitches, nose down to nose up); writes <piece>.png there and design/effects/out/<piece>.json
// The sheet is at the forms' own pixels a unit (144 px over 3.4 units, design/evolutions/bake.js), so the game draws it at their scale (EVO_SCALE).
// <three-dir>: an unpacked three@0.128.0 npm package (its package/build/three.min.js).
const { chromium } = require('/opt/node22/lib/node_modules/playwright');
const fs = require('fs'), path = require('path');
const THREE_DIR = process.argv[2], MODE = process.argv[3], PIECE = process.argv[4], OUT = process.argv[5];
const EVO = path.join(__dirname, '..', 'evolutions');
const files = ['forms-core.js'].concat(fs.readdirSync(EVO).filter(f => /^forms\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5))));
const src = files.map(f => fs.readFileSync(path.join(EVO, f), 'utf8')).join('\n');

// THE PIECES. Each builds a T.Group at the origin, pointing along +x (the way it flies), and says which form it belongs to (for the lights' colour, and the preview).
const PIECES = {
  // QUILL BURST and QUILLSTORM (the QUILLSTONE): one of the big red shards on its back, five-sided and faceted, glowing from within (the same material, glow 0.5),
  // as long as the biggest of them in the game sprite (0.65 x its scale 1.5, about 25 px on screen).
  quill: { form: 361, color: '#ff3300', len: 0.95, fat: 0.2, sides: 5, seed: 5, roll: 0.75, cell: 56, yaws: 32, pitches: [-0.3, 0, 0.3] },   // (approved as a model 2026-11-09: "Yes, build it")
  // ICICLE VOLLEY (the RIMESTAR): one of the frost shards its cast throws (forms32.js: an eight-faced crystal drawn out long), made big: a slender six-sided spike of pale blue ice,
  // long-pointed in front and a short faceted point behind, a little uneven, as long as the quill
  icicle: { form: 861, color: '#7fd6ff', len: 0.95, r: 0.085, sides: 6, back: 0.15, seed: 3, roll: 0.5, cell: 56, yaws: 32, pitches: [-0.3, 0, 0.3] },   // (a draft, for the owner's yes)
};

const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__fx = async function (mode, piece, P) {
  ${src}
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.setClearColor(0x000000, 0);
  // the forms' baker's environment ("the shop's lights", for reflections)
  const es = new T.Scene(); es.background = new T.Color(0x020203);
  es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  EL = { color: P.color }; setElementColour(P.color);
  const lit = scene => { scene.environment = env; scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.45));
    const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
    const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
    const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back); };
  // the game's 2:1 iso camera (as design/evolutions/bake.js), looking at (0, lookY, 0), the view w x h world units across
  const camFor = (w, h, lookY) => { const c = new T.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, 0.1, 100), D = 10, el = Math.asin(0.5);
    c.position.set(D * Math.cos(el) * Math.SQRT1_2, lookY + D * Math.sin(el), D * Math.cos(el) * Math.SQRT1_2); c.lookAt(0, lookY, 0); c.updateMatrixWorld(); c.updateProjectionMatrix(); return c; };
  const build = () => { const g = new T.Group();
    if (piece === 'quill') { const sh = _quillShard(P.len, P.len * P.fat, P.sides, _redShardMat(0.5), P.seed); sh.rotation.z = -PI / 2; sh.position.x = -P.len / 2; const r = new T.Group(); r.add(sh); r.rotation.x = P.roll || 0; g.add(r); }   // (rolled about its length so a ridge, not a flat face, meets the light)
    if (piece === 'icicle') {   // pale ice: glossy, flat-shaded facets, a cold glow from within (the Rimestar's light blue)
      const ice = new T.MeshStandardMaterial({ color: new T.Color(0x7cc8f2).convertSRGBToLinear(), emissive: new T.Color(0x1f6fc4).multiplyScalar(0.45), roughness: 0.3, metalness: 0.05, flatShading: true }); ice.envMapIntensity = 0.55;
      const front = P.len - P.back, mk = (h, tip, sd) => { const geo = new T.ConeGeometry(P.r, h, P.sides, 1), q = geo.attributes.position;
        for (let v = 0; v < q.count; v++) { const x = q.getX(v), y = q.getY(v), z = q.getZ(v), n = _hz(Math.round(x * 400) + sd, Math.round(y * 400), Math.round(z * 400)); q.setXYZ(v, x * (0.8 + 0.4 * n), y, z * (0.8 + 0.4 * (1 - n))); }
        geo.translate(0, h / 2, 0); geo.computeVertexNormals(); const m = new T.Mesh(geo, ice); if (!tip) m.rotation.z = PI; return m; };
      const spike = new T.Group(); spike.add(mk(front, true, P.seed)); spike.add(mk(P.back, false, P.seed + 7));   // (both cones from the widest point: the long one forward, the short one back)
      spike.rotation.z = -PI / 2; spike.position.x = (P.back - front) / 2; const r = new T.Group(); r.add(spike); r.rotation.x = P.roll || 0; g.add(r); }
    return g; };
  // the way it flies, in the world: the game's x is the world's +x, the game's y the world's +z
  const aim = (g, yaw, pitch) => { g.rotation.set(0, 0, 0); g.rotation.order = 'YZX'; g.rotation.y = -yaw; g.rotation.z = pitch; };
  if (mode === 'preview') {
    const shot = (scene, cam, W, H) => { renderer.setSize(W, H, false); renderer.render(scene, cam); const c = document.createElement('canvas'); c.width = W; c.height = H; c.getContext('2d').drawImage(renderer.domElement, 0, 0); return c; };
    // 1. the piece alone, large: flying to the screen's right (the game's +x, -y), its nose a little up
    const s1 = new T.Scene(); lit(s1); const q1 = build(); aim(q1, -PI / 4, 0.12); s1.add(q1);
    const big = shot(s1, camFor(P.len * 1.4, P.len * 0.616, 0), 1600, 704);
    // 2. the same, beside its form, at one scale (the form idle, facing the camera; the piece at mid height, as in flight)
    const s2 = new T.Scene(); lit(s2); const B = FORMS2[P.form].build(); B.update(0, 0); s2.add(B.g); B.g.rotation.y = PI / 4;
    const q2 = build(); aim(q2, -PI / 4, 0.12); q2.position.set(1.75 * Math.SQRT1_2, 0.55, -1.75 * Math.SQRT1_2); s2.add(q2); B.g.position.set(-0.75 * Math.SQRT1_2, 0, 0.75 * Math.SQRT1_2);
    const side = shot(s2, camFor(5.2, 2.6, 0.75), 800, 400);
    return { big: big.toDataURL('image/png'), side: side.toDataURL('image/png') };
  }
  if (mode === 'sheet') {
    const C = P.cell, PXU = 144 / 3.4, Wv = C / PXU;   // (the forms' pixels a unit)
    renderer.setSize(C, C, false);
    const scene = new T.Scene(); lit(scene); const q = build(); scene.add(q); const cam = camFor(Wv, Wv, 0);
    const sheet = document.createElement('canvas'); sheet.width = C * P.yaws; sheet.height = C * P.pitches.length; const sg = sheet.getContext('2d');
    const probe = document.createElement('canvas'); probe.width = C; probe.height = C; const pg = probe.getContext('2d'); const edges = [];
    for (let j = 0; j < P.pitches.length; j++) for (let k = 0; k < P.yaws; k++) {
      aim(q, k * 2 * PI / P.yaws, P.pitches[j]); renderer.render(scene, cam); sg.drawImage(renderer.domElement, k * C, j * C, C, C);
      pg.clearRect(0, 0, C, C); pg.drawImage(renderer.domElement, 0, 0, C, C); const d = pg.getImageData(0, 0, C, C).data; let edge = false;
      for (let i = 0; i < C && !edge; i++) for (const [x, y] of [[i, 0], [i, C - 1], [0, i], [C - 1, i]]) if (d[(y * C + x) * 4 + 3] > 8) { edge = true; break; }
      if (edge) edges.push(k + ',' + j);
    }
    const g0 = new T.Vector3(0, 0, 0).project(cam);
    return { png: sheet.toDataURL('image/png'), meta: { piece, cell: C, yaws: P.yaws, pitches: P.pitches, anchor: { x: (g0.x * 0.5 + 0.5) * C, y: (1 - (g0.y * 0.5 + 0.5)) * C }, unitsPerCell: Wv, len: P.len }, edges };
  }
  return { err: 'mode ' + mode };
};
</script></body></html>`;

(async () => {
  if (!PIECES[PIECE]) { console.error('no piece ' + PIECE + ' (' + Object.keys(PIECES).join(', ') + ')'); process.exit(1); }
  const OLD_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';   // (as the forms' baker)
  const b = await chromium.launch(Object.assign(fs.existsSync(OLD_CHROME) ? { executablePath: OLD_CHROME } : {}, { args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] }));
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://fx.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://fx.local/');
  const res = await p.evaluate(([m, k, P]) => window.__fx(m, k, P), [MODE, PIECE, PIECES[PIECE]]);
  if (errs.length || res.err) { console.error(errs.join('\n') || res.err); process.exit(1); }
  if (MODE === 'preview') {
    // one picture: the piece large on top, the piece beside its form below (on the arena's dark floor colour, so the glow reads as it will)
    const q = await b.newPage(); await q.setViewportSize({ width: 1600, height: 1160 });
    await q.setContent(`<body style="margin:0;background:#15181d;font:600 22px sans-serif;color:#9aa6b2"><img src="${res.big}" style="display:block"><div style="display:flex;align-items:center;gap:24px;padding:8px 24px"><img src="${res.side}"><div>the ${PIECE} beside its form, at one scale<br><span style="font-weight:400;font-size:18px">(in the game it is about 25 px long)</span></div></div></body>`);
    await q.screenshot({ path: OUT, clip: { x: 0, y: 0, width: 1600, height: 1120 } });
    console.log('wrote ' + OUT);
  }
  if (MODE === 'sheet') {
    fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, PIECE + '.png'), Buffer.from(res.png.split(',')[1], 'base64'));
    const od = path.join(__dirname, 'out'); fs.mkdirSync(od, { recursive: true }); fs.writeFileSync(path.join(od, PIECE + '.json'), JSON.stringify(res.meta, null, 1) + '\n');
    console.log('wrote ' + path.join(OUT, PIECE + '.png') + ' (' + res.meta.cell * res.meta.yaws + ' x ' + res.meta.cell * res.meta.pitches.length + ') and ' + path.join(od, PIECE + '.json') + (res.edges.length ? '  EDGE! cells touching their edge: ' + res.edges.join(' ') : ''));
  }
  await b.close();
})();
