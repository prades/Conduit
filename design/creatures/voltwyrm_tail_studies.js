// VOLTWYRM'S TAIL: DRAFTS, NOT A DESIGN (the owner, 2026-11-14: "I want to redesign the volt worm, and I want to make the tail a little bit thicker and wider, and make it have like claws on
// the end, like Groudon from Pokemon"). Each draft is the game's own model (design/props/models/larva.js, its TAILS) with a thicker, wider tail and claws of our own at its end (the
// reference's spirit: heavy, pale, hooked; not its shapes), drawn with the bake's own camera and light (design/props/bake_props.js):
//   NOW  the tail as built (look A's twin prongs);   A  three talons splayed like a raptor's foot, hooking down to the floor;
//   B    four claws round the wrist, curling in like a gripping hand;   C  two great pincer claws, sweeping out and hooking back in until their points cross.
// Row 1: the whole boss lying across the screen at the game's size; row 2: its tail's end, close (it faces away up the screen, its tail toward you).
// ROUND 2 (the owner: "A and make the tail and body need more plating on each segment"): tail A with more armour on every segment, body and tail, in two ways (the model's plates):
//   NOW, A as drafted, A + PANELS (three raised panels a segment, rivets), A + SCALES (two overlapping rows a segment); row 2 its plating close, turned three-quarters.
// ROUND 3 (the owner: "I like a, now legs should be more angular at least have single claw feet"): tail A as drafted (read as the owner's "a"), its legs in three drafts (the model's LEGS)
//   beside its legs as built: 1 BLADE, 2 HIGH KNEES, 3 STRUT; every foot one hooked claw. Row 1 the whole boss at the game's size, three-quarters; rows 2 and 3 its legs close (three-quarters, head-on).
// ROUND 4 (the owner circled 3: "I like this one and can you make the head slightly more angular and that's perfect"): 3 with its head as it was, and with the head more angular (the game's
//   look from build 2026-11-14m, the model's LOOK). Rows as round 3 with the head close.
//   node design/creatures/voltwyrm_tail_studies.js <three-dir> <out-dir> [legs|head]   ->  <out-dir>/voltwyrm_tails.png (round 1), voltwyrm_plating.png (round 2), voltwyrm_legs.png (round 3),
//   voltwyrm_head.png (round 4); with legs or head only that round
// Every part and proportion here is the agent's, provisional. Nothing in the game reads this; the bake draws the model's LOOK.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'), path = require('path');
const [THREE_DIR, OUTDIR, ONLY] = process.argv.slice(2);
if (!THREE_DIR || !OUTDIR) { console.error('usage: node design/creatures/voltwyrm_tail_studies.js <three-dir> <out-dir>'); process.exit(1); }
const ROOT = path.join(__dirname, '..', '..'), rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PX = 60 / Math.sin(Math.PI / 4), UH = PX * Math.cos(Math.asin(0.5));

const page = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__draw = async function (PX, UH, ONLY) {
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
  const shot = (key, name, W, H, zoom, onTail, plates, at, legs, headLook) => {
    renderer.setSize(W, H, false);
    const scene = new T.Scene(); scene.environment = env;
    scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.5));
    const k1 = new T.DirectionalLight(0xfff1e2, 2.4); k1.position.set(3, 6, 4); scene.add(k1);
    const k2 = new T.DirectionalLight(0x6c8cff, 1.3); k2.position.set(-5, 1.2, 1.5); scene.add(k2);
    const k3 = new T.DirectionalLight(0x6c8cff, 0.6); k3.position.set(2, 1, -5); scene.add(k3);
    const B = PROPS.larva.study(key, name, plates, legs, headLook); scene.add(B.g); B.g.updateMatrixWorld(true);
    const inner = B.g.children[0].children[0], focus = at ? inner.localToWorld(new T.Vector3(at[0], at[1], at[2])) : onTail ? inner.localToWorld(new T.Vector3(-0.96, 0.22, 0.05)) : new T.Vector3(0, 0.25, 0);
    const cam = new T.OrthographicCamera(-W / 2 / PX / zoom, W / 2 / PX / zoom, H / 2 / PX / zoom, -H / 2 / PX / zoom, 0.1, 200);
    cam.position.set(focus.x + D * Math.cos(elev) * Math.SQRT1_2, focus.y + D * Math.sin(elev), focus.z + D * Math.cos(elev) * Math.SQRT1_2); cam.lookAt(focus); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    renderer.render(scene, cam);
    const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'); g.fillStyle = BG; g.fillRect(0, 0, W, H); g.drawImage(renderer.domElement, 0, 0); return c;
  };
  const out = {};
  if (!ONLY) {
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
  // round 2: the plating
  const cols2 = [['prongs', null, 'NOW'], ['A', null, 'A · as drafted'], ['A', 'panels', 'A + PANELS'], ['A', 'scales', 'A + SCALES']];
  const cv2 = document.createElement('canvas'); cv2.width = cv.width; cv2.height = head + 2 * (lab + pad) + R1 + R2 + pad; const t = cv2.getContext('2d');
  t.fillStyle = '#151a24'; t.fillRect(0, 0, cv2.width, cv2.height);
  t.fillStyle = '#ffffff'; t.font = '800 30px system-ui, sans-serif'; t.fillText("VOLTWYRM · tail A, more plating on every segment · drafts", pad, 44);
  t.fillStyle = '#93a1b8'; t.font = '500 17px system-ui, sans-serif'; t.fillText('Row 1: the whole boss at the game\\'s size. Row 2: its body and tail close, turned three-quarters. PANELS: three raised panels a segment with rivets; SCALES: two overlapping rows a segment.', pad, 74);
  cols2.forEach(([key, plates, title], i) => { const x = pad + i * (CW + pad);
    t.fillStyle = '#ffffff'; t.font = '800 19px system-ui, sans-serif'; t.fillText(title, x, head + 20);
    t.drawImage(shot(key, 'w7_0', CW, R1, 1, false, plates), x, head + lab);
    t.drawImage(shot(key, 'w0_0', CW, R2, 2.3, false, plates, [-0.55, 0.16, 0]), x, head + lab + R1 + pad);
    t.strokeStyle = '#2a3344'; t.lineWidth = 2; t.strokeRect(x, head + lab, CW, R1); t.strokeRect(x, head + lab + R1 + pad, CW, R2); });
  out.tails = cv.toDataURL('image/png'); out.plating = cv2.toDataURL('image/png'); }
  // round 3: the legs
  if (!ONLY || ONLY === 'legs') { const cols3 = [[null, 'NOW · tail A, its legs as built'], ['1', '1 · BLADE LEGS'], ['2', '2 · HIGH KNEES'], ['3', '3 · STRUT LEGS']], R3 = 300, CW = 470, pad = 22, head = 96, lab = 30;
    const cv3 = document.createElement('canvas'); cv3.width = pad + cols3.length * (CW + pad); cv3.height = head + 3 * (lab + pad) + 250 + 2 * R3; const u = cv3.getContext('2d');
    u.fillStyle = '#151a24'; u.fillRect(0, 0, cv3.width, cv3.height);
    u.fillStyle = '#ffffff'; u.font = '800 30px system-ui, sans-serif'; u.fillText("VOLTWYRM · tail A, its legs more angular, one claw on each foot · drafts", pad, 44);
    u.fillStyle = '#93a1b8'; u.font = '500 17px system-ui, sans-serif'; u.fillText('Row 1: the whole boss at the game\\'s size. Row 2: its legs close, three-quarters. Row 3: its legs close, coming at you. Every foot one hooked claw, pale like its jaws, its inner edge lit.', pad, 74);
    cols3.forEach(([legs, title], i) => { const x = pad + i * (CW + pad), y1 = head + lab, y2 = y1 + 250 + pad + lab, y3 = y2 + R3 + pad + lab;
      u.fillStyle = '#ffffff'; u.font = '800 19px system-ui, sans-serif'; u.fillText(title, x, head + 20);
      u.drawImage(shot('A', 'w0_0', CW, 250, 1, false, null, null, legs), x, y1);
      u.drawImage(shot('A', 'w0_0', CW, R3, 2.6, false, null, [0.3, 0.12, 0.12], legs), x, y2);
      u.drawImage(shot('A', 'w1_0', CW, R3, 2.4, false, null, [0.3, 0.14, 0], legs), x, y3);
      u.strokeStyle = '#2a3344'; u.lineWidth = 2; u.strokeRect(x, y1, CW, 250); u.strokeRect(x, y2, CW, R3); u.strokeRect(x, y3, CW, R3); });
    out.legs = cv3.toDataURL('image/png'); }
  // round 4: the head
  if (!ONLY || ONLY === 'head') { const cols4 = [[null, '3 · STRUT LEGS, its head as it was'], ['angular', '3 + ITS HEAD MORE ANGULAR (the game\\'s)']], R3 = 300, CW = 470, pad = 22, head = 96, lab = 30;
    const cv4 = document.createElement('canvas'); cv4.width = Math.max(1100, pad + cols4.length * (CW + pad)); cv4.height = head + 3 * (lab + pad) + 250 + 2 * R3; const v = cv4.getContext('2d');
    v.fillStyle = '#151a24'; v.fillRect(0, 0, cv4.width, cv4.height);
    v.fillStyle = '#ffffff'; v.font = '800 30px system-ui, sans-serif'; v.fillText("VOLTWYRM · its head a little more angular", pad, 44);
    v.fillStyle = '#93a1b8'; v.font = '500 17px system-ui, sans-serif'; v.fillText('Row 1: the game\\'s size. Rows 2 and 3: its head close. Straight facets to a prow, wedges, hexagonal lens cups, faceted horns.', pad, 74);
    cols4.forEach(([hd, title], i) => { const x = pad + i * (CW + pad), y1 = head + lab, y2 = y1 + 250 + pad + lab, y3 = y2 + R3 + pad + lab;
      v.fillStyle = '#ffffff'; v.font = '800 19px system-ui, sans-serif'; v.fillText(title, x, head + 20);
      v.drawImage(shot('A', 'w0_0', CW, 250, 1, false, null, null, '3', hd), x, y1);
      v.drawImage(shot('A', 'w0_0', CW, R3, 2.8, false, null, [0.66, 0.2, 0], '3', hd), x, y2);
      v.drawImage(shot('A', 'w1_0', CW, R3, 2.8, false, null, [0.66, 0.18, 0], '3', hd), x, y3);
      v.strokeStyle = '#2a3344'; v.lineWidth = 2; v.strokeRect(x, y1, CW, 250); v.strokeRect(x, y2, CW, R3); v.strokeRect(x, y3, CW, R3); });
    out.head = cv4.toDataURL('image/png'); }
  return out;
};
</script></body></html>`;

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://draw.local/', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: page }));
  await p.goto('http://draw.local/');
  let res; try { res = await p.evaluate(([a, b2, c]) => window.__draw(a, b2, c), [PX, UH, ONLY || '']); } catch (e) { console.log('ERRORS', errs.slice(0, 5), e.message); await b.close(); process.exit(1); }
  fs.mkdirSync(OUTDIR, { recursive: true });
  const wrote = [];
  for (const [k, f] of [['tails', 'voltwyrm_tails.png'], ['plating', 'voltwyrm_plating.png'], ['legs', 'voltwyrm_legs.png'], ['head', 'voltwyrm_head.png']]) if (res[k]) { const o = path.join(OUTDIR, f); fs.writeFileSync(o, Buffer.from(res[k].split(',')[1], 'base64')); wrote.push(o); }
  console.log('wrote', wrote.join(' '), errs.length ? 'PAGE ERRORS ' + JSON.stringify(errs.slice(0, 3)) : '');
  await b.close();
})();
