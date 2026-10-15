// ── THE VOLCANO TURTLE · the toxic brawler, Nos. 126–129 ──────────────────
// A small, stout dark-armoured turtle with a volcano on its shell, the crater a little cauldron of toxic green
// that bubbles up and runs down the cone. The crystal is the heart of the crater.
const _rock = new T.MeshStandardMaterial({ color: 0x120d0a, roughness: 0.8, metalness: 0.1, flatShading: true });
function _goo() { const m = new T.MeshStandardMaterial({ color: 0x0a3a14, emissive: new T.Color(EL.color).multiplyScalar(0.62), emissiveIntensity: 1.0, roughness: 1, metalness: 0 }); m.envMapIntensity = 0; return m; }   // solid and matte: no shine, nothing see-through
const _blackGloss = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.0, roughness: 1 }); _blackGloss.envMapIntensity = 0.1;   // matte black: no shine, no glass
const _obsidian = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.0, roughness: 1, flatShading: true }); _obsidian.envMapIntensity = 0.1;
const _rock2 = new T.MeshStandardMaterial({ color: 0x1c140f, roughness: 0.75, metalness: 0.1, flatShading: true });   // lighter, so the cone reads against the dark
function volcanoMesh(r0, h, rimR, seed, mat, seg) {   // a cone with a hollow crater and a ragged rim
  const pts = [[0.0001, h * 0.7], [rimR * 0.55, h * 0.72], [rimR * 0.85, h * 0.95], [rimR, h], [rimR * 1.2, h * 0.88], [(rimR + r0) * 0.5, h * 0.55], [r0 * 0.88, h * 0.22], [r0, 0]].reverse().map(p => new T.Vector2(p[0], p[1]));   // (from the foot up: the faces then point outwards)
  const geo = new T.LatheGeometry(pts, seg || 11), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), rr = Math.hypot(x, z); if (rr < 0.01) continue; const n = _hz(Math.round(x * 200) + seed, Math.round(y * 200), Math.round(z * 200)), k = 1 + (n - 0.5) * 0.22; p.setXYZ(i, x * k, y + (n - 0.5) * 0.05, z * k); }
  geo.computeVertexNormals(); return new T.Mesh(geo, mat || _rock);
}
function _shell(rx, ry, rz, rings, black) {   // the dome of the shell: a dark half-ellipsoid with scutes laid on it (none, if it is to be plain black)
  const g = G(), dome = new T.Mesh(new T.SphereGeometry(1, 24, 12, 0, TAU, 0, PI / 2), black ? _blackGloss : M.dark); dome.scale.set(rx, ry, rz); g.add(dome);
  for (let ring = 0; ring < (rings == null ? 3 : rings); ring++) { const polar = 0.5 + ring * 0.4, n = 6 + ring * 3; for (let i = 0; i < n; i++) { const az = i * TAU / n + ring * 0.35;
    scaleOn(g, V(Math.sin(polar) * Math.sin(az) * rx * 1.02, Math.cos(polar) * ry * 1.02, Math.sin(polar) * Math.cos(az) * rz * 1.02), 0.3 - ring * 0.03, 0.26, 0.3, (i + ring) % 3 ? M.armor : M.gun); } }
  const rim = new T.Mesh(new T.TorusGeometry(1, 0.035, 5, 28), black ? _blackGloss : M.steel); rim.rotation.x = PI / 2; rim.scale.set(rx * 1.02, rz * 1.02, 1); g.add(rim);   // the edge of the shell
  return g;
}
function _turtle(o) {
  const g = G(), b = G(); g.add(b); const bodyY = o.legH + 0.05;
  const shell = _shell(o.rx, o.ry, o.rz); shell.position.y = bodyY; b.add(shell);
  const belly = cbox(o.rx * 1.6, 0.14, o.rz * 1.6, 0.04, M.dark); belly.position.y = bodyY - 0.02; b.add(belly);
  const legs = []; for (let i = 0; i < 4; i++) { const sx = i % 2 ? -1 : 1, sz = i < 2 ? 1 : -1; const l = G(); l.position.set(sx * o.rx * 0.72, bodyY - 0.05, sz * o.rz * 0.6); const th = cbox(0.2 * o.leg, o.legH, 0.24 * o.leg, 0.05, M.armor); th.position.y = -o.legH / 2; l.add(th); const ft = cbox(0.26 * o.leg, 0.07, 0.3 * o.leg, 0.025, M.gun); ft.position.set(0, -o.legH, 0.04); l.add(ft); b.add(l); legs.push(l); }
  const head = G(); head.position.set(0, bodyY + 0.08, o.rz + 0.12); b.add(head);
  const nk = cbox(0.22 * o.head, 0.2, 0.3, 0.05, M.armor); nk.position.set(0, -0.02, -0.1); head.add(nk);
  const hd = cbox(0.4 * o.head, 0.32 * o.head, 0.44 * o.head, 0.07, M.dark); hd.position.set(0, 0.04, 0.12); head.add(hd);
  const jaw = cbox(0.3 * o.head, 0.07, 0.32 * o.head, 0.02, M.gun); jaw.position.set(0, -0.1 * o.head, 0.18); head.add(jaw);
  for (const s of [-1, 1]) { const ey = cbox(0.11 * o.head, 0.07 * o.head, 0.04, 0.012, M.glow); ey.position.set(s * 0.12 * o.head, 0.1 * o.head, 0.34 * o.head); ey.rotation.z = -s * 0.25; head.add(ey); }
  const brow = cbox(0.44 * o.head, 0.04, 0.1, 0.01, M.armor); brow.position.set(0, 0.2 * o.head, 0.26 * o.head); head.add(brow);
  const tail = new T.Mesh(new T.ConeGeometry(0.1, 0.34, 6), M.armor); tail.rotation.x = -PI / 2 - 0.3; tail.position.set(0, bodyY + 0.05, -o.rz - 0.15); b.add(tail);
  return { g, b, bodyY, head, legs, shell };
}
function _bubbling(parent, x, y, z, R, n, o) {   // goo in the crater: a swollen surface, bubbles that rise and pop, a crystal heart
  const gm = _goo(), pool = new T.Mesh(new T.SphereGeometry(R, 16, 8, 0, TAU, 0, PI / 2), gm); pool.position.set(x, y, z); pool.scale.y = 0.35; parent.add(pool);
  if (!(o && o.noHeart)) { const heart = hexCrystal(R * 0.22, R * 0.7, R * 0.45, M.crystal); heart.position.set(x, y + R * 0.3, z); parent.add(heart); }   // (glass-like: left out when asked)
  const bubs = []; for (let i = 0; i < n; i++) { const bb = new T.Mesh(new T.SphereGeometry(1, 10, 8), gm); parent.add(bb); bubs.push({ bb, a: i * 2.4, rr: R * 0.55 * (0.3 + 0.7 * _hz(i, 3, 7)), ph: i / n, sz: 0.035 + 0.03 * _hz(i, 8, 2) }); }
  if (!(o && o.noHeart)) { const glow = glowSprite(R * 3.2); glow.position.set(x, y + 0.1, z); parent.add(glow); }   // (a haze: left out with the crystal)
  return (t, act) => { const a = act || 0; pool.scale.set(1, 0.35 + 0.1 * Math.sin(1.6 * t * 2) + 0.35 * a, 1);
    for (const q of bubs) { const u = ((1.6 * t / TAU * (1 + (a > 0.3 ? 1 : 0)) + q.ph) % 1 + 1) % 1; const rise = (0.12 + 0.5 * (1 + 0.8 * a)) * u;
      q.bb.position.set(x + Math.sin(q.a + t) * q.rr * (1 - u * 0.4), y + 0.04 + rise, z + Math.cos(q.a + t) * q.rr * (1 - u * 0.4)); q.bb.scale.setScalar(q.sz * (1 + 1.4 * a) * Math.sin(Math.PI * Math.min(1, u * 1.05)) + 0.001); } };
}
function _drips(parent, vx, vy, vz, r0, h, rimR, n, seed) {   // goo running down the cone's side, hugging it
  const gm = _goo(), prof = [[0, r0], [0.22, r0 * 0.88], [0.55, (rimR + r0) * 0.5], [0.88, rimR * 1.2], [1, rimR]];
  const rAt = y => { const u = Math.max(0, Math.min(1, y / h)); for (let i = 1; i < prof.length; i++) if (u <= prof[i][0]) { const a = prof[i - 1], b = prof[i], k = (u - a[0]) / (b[0] - a[0]); return a[1] + (b[1] - a[1]) * k; } return rimR; };   // the cone's radius at height y (the lathe's own profile)
  for (let i = 0; i < n; i++) { const a = seed + i * (TAU / n) + _hz(i, seed, 1) * 0.6, drop = h * (0.45 + 0.4 * _hz(i, seed, 2));
    const pts = []; for (let k = 0; k <= 6; k++) { const yy = h * 0.96 - drop * k / 6; pts.push(new T.Vector3(vx + Math.sin(a) * (rAt(yy) + 0.012), vy + yy, vz + Math.cos(a) * (rAt(yy) + 0.012))); }
    parent.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 14, 0.03, 6, false), gm)); const end = pts[pts.length - 1]; const bl = sphere(0.05, gm, 8); bl.position.copy(end); parent.add(bl); }
}
function _volcanoTurtle(o) {
  const T0 = _turtle(o), { g, b, bodyY, head, legs } = T0;
  const vx = 0, vy = bodyY + o.ry * 0.82, vz = -0.02;
  const vol = volcanoMesh(o.vr, o.vh, o.rimR, o.seed || 3); vol.position.set(vx, vy, vz); b.add(vol);
  _drips(b, vx, vy, vz, o.vr, o.vh, o.rimR, o.drips || 4, o.seed || 3);
  if (o.cauldron) { const lip = new T.Mesh(new T.TorusGeometry(o.rimR * 1.02, 0.045, 6, 16), M.steel); lip.rotation.x = PI / 2; lip.position.set(vx, vy + o.vh * 0.99, vz); b.add(lip);
    for (const s of [-1, 1]) { const hd = new T.Mesh(new T.TorusGeometry(0.1, 0.02, 5, 10, PI), M.steel); hd.position.set(vx + s * o.rimR * 1.1, vy + o.vh * 0.99, vz); hd.rotation.y = PI / 2; hd.rotation.z = s > 0 ? 0 : PI; b.add(hd); } }
  const bub = _bubbling(b, vx, vy + o.vh * 0.86, vz, o.rimR * 0.92, o.bubbles || 7);
  // cracks of light down the rock
  for (let i = 0; i < 3; i++) { const a = i * 2.1 + 0.5, cr = cbox(0.025, o.vh * 0.5, 0.02, 0.004, M.glow); const hh = vy + o.vh * 0.45, rr = (o.vr + o.rimR) * 0.5 * 0.92; cr.position.set(vx + Math.sin(a) * rr, hh, vz + Math.cos(a) * rr); cr.rotation.set(Math.cos(a) * 0.5, a, -Math.sin(a) * 0.3); b.add(cr); }
  if (o.spikes) for (let i = 0; i < 7; i++) { const a = i * TAU / 7 + 0.3, sp = new T.Mesh(new T.ConeGeometry(0.06, 0.22, 5), M.gun); sp.position.set(Math.sin(a) * o.rx * 0.86, bodyY + o.ry * 0.5, Math.cos(a) * o.rz * 0.86); sp.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9); b.add(sp); }
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, vy + o.vh + 0.3, 0.5); b.add(L); LIGHTS.push(L);
  return { g, core: vy + o.vh * 0.9, update(t, act) { const a = act || 0, w = Math.sin(1.6 * t);
    b.position.y = 0.012 * Math.sin(1.6 * t * 2); head.position.z = o.rz + 0.12 + 0.2 * a; head.rotation.x = 0.06 * w - 0.2 * a;
    legs.forEach((l, i) => { l.rotation.x = 0.1 * Math.sin(1.6 * t + (i % 2 ? PI : 0) + (i < 2 ? 0 : PI / 2)); });
    bub(t, a); } };
}
fx(126, "Volcano turtle.", () => _volcanoTurtle({ rx: 0.58, ry: 0.4, rz: 0.72, legH: 0.26, leg: 1, head: 1, vr: 0.42, vh: 0.62, rimR: 0.2 }));
fx(127, "Volcano turtle, cauldron crater, big head.", () => _volcanoTurtle({ rx: 0.52, ry: 0.36, rz: 0.62, legH: 0.22, leg: 1.1, head: 1.35, vr: 0.4, vh: 0.5, rimR: 0.27, cauldron: true, drips: 5, seed: 5 }));
fx(128, "Volcano turtle, armoured and spiked.", () => _volcanoTurtle({ rx: 0.66, ry: 0.42, rz: 0.78, legH: 0.3, leg: 1.3, head: 1.1, vr: 0.44, vh: 0.7, rimR: 0.21, spikes: true, drips: 3, seed: 9 }));
fx(129, "Volcano turtle, tall cone.", () => _volcanoTurtle({ rx: 0.5, ry: 0.34, rz: 0.62, legH: 0.24, leg: 0.95, head: 1.05, vr: 0.36, vh: 0.95, rimR: 0.17, drips: 5, bubbles: 9, seed: 7 }));

// ── Simpler (Nos. 130–132): no head, no tail. The shell, the volcano, the goo, and little feet. ──
function _simpleVolcano(o) {
  const g = G(), b = G(); g.add(b); const bodyY = o.feet ? o.legH + 0.05 : 0.05;
  const shell = _shell(o.rx, o.ry, o.rz, o.black ? 0 : 1, o.black); shell.position.y = bodyY; b.add(shell);
  const belly = cbox(o.rx * 1.6, 0.14, o.rz * 1.6, 0.04, o.black ? _blackGloss : M.dark); belly.position.y = bodyY - 0.02; b.add(belly);
  const feet = []; if (o.feet) for (let i = 0; i < 4; i++) { const sx = i % 2 ? -1 : 1, sz = i < 2 ? 1 : -1, l = G(); l.position.set(sx * o.rx * 0.72, bodyY - 0.05, sz * o.rz * 0.6);
    const th = cbox(0.22, o.legH, 0.26, 0.05, o.black ? _blackGloss : M.armor); th.position.y = -o.legH / 2; l.add(th); const ft = cbox(0.28, 0.07, 0.32, 0.025, o.black ? _blackGloss : M.gun); ft.position.set(0, -o.legH, 0.04); l.add(ft); b.add(l); feet.push(l); }
  const vx = 0, vy = bodyY + o.ry * 0.82, vz = 0;
  const vol = volcanoMesh(o.vr, o.vh, o.rimR, o.seed || 3, o.black ? _obsidian : o.light ? _rock2 : _rock, o.seg); vol.position.set(vx, vy, vz); b.add(vol);
  _drips(b, vx, vy, vz, o.vr, o.vh, o.rimR, o.drips == null ? 3 : o.drips, o.seed || 3);
  if (o.cracks) for (let i = 0; i < o.cracks; i++) { const a = i * TAU / o.cracks + 0.5, cr = cbox(0.03, o.vh * 0.55, 0.02, 0.004, M.glow), rr = (o.vr + o.rimR) * 0.5 * 0.9; cr.position.set(vx + Math.sin(a) * rr, vy + o.vh * 0.45, vz + Math.cos(a) * rr); cr.rotation.set(Math.cos(a) * 0.55, a, -Math.sin(a) * 0.35); b.add(cr); }
  if (o.cauldron) { const lip = new T.Mesh(new T.TorusGeometry(o.rimR * 1.02, 0.045, 6, 16), M.steel); lip.rotation.x = PI / 2; lip.position.set(vx, vy + o.vh * 0.99, vz); b.add(lip); }
  const bub = _bubbling(b, vx, vy + o.vh * 0.86, vz, o.rimR * 0.92, o.bubbles || 6, { noHeart: o.black });
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, vy + o.vh + 0.3, 0.5); b.add(L); LIGHTS.push(L);
  return { g, core: vy + o.vh * 0.9, update(t, act) { const a = act || 0;
    b.position.y = 0.012 * Math.sin(1.6 * t * 2); shell.scale.y = 1 - 0.1 * a; shell.scale.x = shell.scale.z = 1 + 0.05 * a;   // it hunkers down as the volcano erupts
    feet.forEach((l, i) => { l.rotation.x = 0.1 * Math.sin(1.6 * t + (i % 2 ? PI : 0) + (i < 2 ? 0 : PI / 2)); });
    bub(t, a); } };
}
fx(130, "Headless volcano turtle, feet.", () => _simpleVolcano({ rx: 0.6, ry: 0.4, rz: 0.66, legH: 0.24, feet: true, vr: 0.42, vh: 0.6, rimR: 0.2 }));
fx(131, "Headless volcano turtle, on the ground.", () => _simpleVolcano({ rx: 0.68, ry: 0.36, rz: 0.72, vr: 0.44, vh: 0.58, rimR: 0.21, seed: 5 }));
fx(132, "Headless volcano turtle, cauldron crater.", () => _simpleVolcano({ rx: 0.6, ry: 0.38, rz: 0.64, legH: 0.22, feet: true, vr: 0.4, vh: 0.46, rimR: 0.27, cauldron: true, drips: 4, seed: 7 }));

// ── Four feet, a cone, no cauldron (Nos. 133–135) ──
fx(133, "Cone volcano turtle.", () => _simpleVolcano({ rx: 0.6, ry: 0.36, rz: 0.66, legH: 0.24, feet: true, vr: 0.5, vh: 0.78, rimR: 0.14, light: true, cracks: 3, drips: 3, seg: 9, seed: 3 }));
fx(134, "Tall cone volcano turtle.", () => _simpleVolcano({ rx: 0.56, ry: 0.34, rz: 0.62, legH: 0.24, feet: true, vr: 0.44, vh: 1.02, rimR: 0.11, light: true, cracks: 3, drips: 2, seg: 8, seed: 5 }));
fx(135, "Squat wide cone volcano turtle.", () => _simpleVolcano({ rx: 0.66, ry: 0.32, rz: 0.7, legH: 0.22, feet: true, vr: 0.6, vh: 0.62, rimR: 0.17, light: true, cracks: 4, drips: 4, seg: 10, seed: 7 }));

// ── Black, and plain (Nos. 136–138): glossy black shell and cone, no scutes, only the goo and a few cracks glow. ──
fx(136, "Black cone volcano turtle.", () => _simpleVolcano({ black: true, rx: 0.6, ry: 0.36, rz: 0.66, legH: 0.24, feet: true, vr: 0.5, vh: 0.78, rimR: 0.14, cracks: 3, drips: 3, seg: 9, seed: 3 }));
fx(137, "Black cone volcano turtle, smooth.", () => _simpleVolcano({ black: true, rx: 0.58, ry: 0.34, rz: 0.64, legH: 0.24, feet: true, vr: 0.46, vh: 0.9, rimR: 0.12, cracks: 0, drips: 2, seg: 14, seed: 5 }));
fx(138, "Black volcano turtle, one mound.", () => _simpleVolcano({ black: true, rx: 0.66, ry: 0.22, rz: 0.7, legH: 0.22, feet: true, vr: 0.62, vh: 0.78, rimR: 0.15, cracks: 4, drips: 3, seg: 12, seed: 7 }));
