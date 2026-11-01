// STATIC LOCK (Pack 1, electric, Precision: 10% a hit to GLITCH, the enemy's wind-ups failing): an electromagnetic padlock: a chunky dark-steel padlock body, bevelled, ribbed down its sides, a dark face plate
// screwed to its front with a glowing yellow keyhole glyph in a ring and a row of lit keys; its shackle is a loop of energy rising out of two emitter collars on its top, crackling with static (jagged arcs
// wound round it and jumping off it), sparks round it, and its side breaking up into glitch pixels (little cubes, steel and lit, on a grid): the glitch it puts on what it hits. The electric family's
// Precision piece, the most intricate.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const shellM = std('#626b78', 0.8, 0.3), ribM = std('#9aa3ae', 0.9, 0.24), faceM = std('#16191e', 0.6, 0.38), collarM = std('#a7b0bb', 0.9, 0.24), screwM = std('#c3cbd6', 0.9, 0.22), keyM = std('#262a31', 0.6, 0.35);
  shellM.envMapIntensity = 1.05;
  const yel = STY.glow('#ffee33', 1.3), yelHot = STY.glow('#fff7a8', 1.8), yelDim = STY.glow('#d4b800', 1.1);
  const sheath = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.28, depthWrite: false, toneMapped: false }); sheath.color = STY.col('#ffe14a');
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = p => p.isVector3 ? p.clone() : new T.Vector3(p[0], p[1], p[2]), UP = new T.Vector3(0, 1, 0);
  function rod(a, b, r, mat, seg) { const A = V(a), d = V(b).sub(A), L = d.length(), m = new T.Mesh(new T.CylinderGeometry(r, r, L, seg || 6, 1), mat); m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); return m; }
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function bolt(pts, rDim, rCore, cam, dimM, coreM) { const g = G(), off = cam.clone().multiplyScalar(rDim * 0.8);
    for (let i = 0; i < pts.length - 1; i++) { g.add(rod(pts[i], pts[i + 1], rDim, dimM || yelDim)); g.add(rod(pts[i].clone().add(off), pts[i + 1].clone().add(off), rCore, coreM || yelHot)); }
    pts.forEach(p => { g.add(at(sphere(rDim, dimM || yelDim, 6), p.x, p.y, p.z)); g.add(at(sphere(rCore, coreM || yelHot, 6), p.x + off.x, p.y + off.y, p.z + off.z)); });
    return g; }
  // a rounded rectangle outline (x-y), its top corners radius rt, its bottom ones rb
  function rrect(w, h, rt, rb, n) { const pts = [], hw = w / 2, hh = h / 2, c = (cx, cy, r, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + PI / 2 * i / n; pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); } };
    c(hw - rb, -hh + rb, rb, -PI / 2); c(hw - rt, hh - rt, rt, 0); c(-hw + rt, hh - rt, rt, PI / 2); c(-hw + rb, -hh + rb, rb, PI); return pts; }

  ITEMS.static_lock = { exposure: 1.0, az: 0.55, el: 0.32, build() {
    const g = G(), R = rng(23), az = 0.55, el = 0.32, cam = new T.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    const W = 0.6, H = 0.5, D = 0.26, yB = -0.2, top = yB + H / 2, zf = D / 2;
    // THE BODY: a chunky bevelled block, its bottom corners well rounded
    g.add(at(plate(rrect(W, H, 0.07, 0.16, 6), D, 0.03, shellM), 0, yB, 0));
    // ribs down its sides
    for (const s of [-1, 1]) for (let k = 0; k < 3; k++) g.add(at(cbox(0.03, 0.03, D - 0.07, 0.008, ribM), s * (W / 2 + 0.004), yB + 0.12 - k * 0.075, 0));
    // THE FACE: a dark plate screwed to the front, a glowing keyhole in a ring, a row of keys
    const F = G(); F.position.set(0, yB + 0.005, zf); g.add(F);
    F.add(at(plate(rrect(0.46, 0.38, 0.045, 0.11, 5), 0.03, 0.008, faceM), 0, 0, 0.012));
    for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) { const sc = cyl(0.014, 0.014, 0.012, screwM, 12); sc.rotation.x = PI / 2; F.add(at(sc, sx * 0.19, sy * 0.145, 0.03)); }
    const ring = new T.Mesh(new T.TorusGeometry(0.085, 0.013, 10, 48), yel); F.add(at(ring, 0, 0.045, 0.03));
    const ring2 = new T.Mesh(new T.TorusGeometry(0.106, 0.005, 8, 48), yelDim); F.add(at(ring2, 0, 0.045, 0.029));
    const kh = cyl(0.026, 0.026, 0.012, yelHot, 20); kh.rotation.x = PI / 2; F.add(at(kh, 0, 0.064, 0.031));
    F.add(at(plate([[-0.012, 0.05], [0.012, 0.05], [0.022, -0.0], [-0.022, -0.0]], 0.012, 0, yelHot), 0, 0.0, 0.031));
    for (let k = 0; k < 4; k++) { const x = -0.093 + k * 0.062; F.add(at(cbox(0.046, 0.034, 0.02, 0.006, keyM), x, -0.105, 0.033)); F.add(at(cbox(0.03, 0.012, 0.006, 0.002, k === 1 ? yelHot : yelDim), x, -0.105, 0.044)); }
    // THE EMITTERS: two steel collars on the top, a lit ring in each mouth
    const sx = 0.17;
    for (const s of [-1, 1]) {
      g.add(at(cyl(0.07, 0.078, 0.05, collarM, 32), s * sx, top + 0.02, 0)); g.add(at(cyl(0.058, 0.058, 0.012, faceM, 32), s * sx, top + 0.048, 0));
      const lr = new T.Mesh(new T.TorusGeometry(0.046, 0.01, 8, 32), yel); lr.rotation.x = PI / 2; g.add(at(lr, s * sx, top + 0.052, 0));
    }
    // THE SHACKLE: a U of energy out of the collars: a glowing band, a hot core along its face, a faint sheath round it
    const legTop = top + 0.22, pts = [];
    for (let i = 0; i <= 6; i++) pts.push(new T.Vector3(-sx, top + 0.05 + (legTop - top - 0.05) * i / 6, 0));
    for (let i = 1; i < 24; i++) { const a = PI - PI * i / 24; pts.push(new T.Vector3(sx * Math.cos(a), legTop + sx * Math.sin(a), 0)); }
    for (let i = 0; i <= 6; i++) pts.push(new T.Vector3(sx, legTop - (legTop - top - 0.05) * i / 6, 0));
    const curve = new T.CatmullRomCurve3(pts);
    g.add(new T.Mesh(new T.TubeGeometry(curve, 96, 0.03, 12, false), yel));
    { const core = new T.Mesh(new T.TubeGeometry(curve, 96, 0.015, 8, false), yelHot); core.position.copy(cam).multiplyScalar(0.02); g.add(core); }
    g.add(new T.Mesh(new T.TubeGeometry(curve, 96, 0.05, 12, false), sheath));
    // THE STATIC: jagged arcs crawling along the shackle, leaping out from it and back at random (mostly on the side toward the viewer), and three forks jumping off it
    const along = (t0, t1, n) => { const p = []; for (let i = 0; i <= n; i++) { const t = t0 + (t1 - t0) * i / n, c = curve.getPointAt(t), tg = curve.getTangentAt(t), nz = new T.Vector3(0, 0, 1), nx = new T.Vector3().crossVectors(tg, nz).normalize(), a = (R() - 0.5) * 2.6 + (R() < 0.5 ? 0 : PI), r = (i === 0 || i === n) ? 0.03 : 0.036 + R() * 0.045;
      p.push(c.addScaledVector(nx, Math.cos(a) * r).addScaledVector(nz, Math.abs(Math.sin(a)) * r)); } return p; };
    [[0.03, 0.27, 5], [0.36, 0.62, 6], [0.7, 0.95, 5]].forEach(([t0, t1, n], i) => g.add(bolt(along(t0, t1, n), 0.0068, 0.0031, cam, i % 2 ? yel : yelDim, yelHot)));
    [[0.14, [-0.13, 0.05, 0.03]], [0.5, [0.03, 0.12, 0.04]], [0.84, [0.13, 0.04, 0.03]]].forEach(([t, d]) => { const p0 = curve.getPointAt(t), D3 = new T.Vector3(d[0], d[1], d[2]), side = new T.Vector3().crossVectors(D3, cam).normalize(), pts2 = [p0];
      for (let i = 1; i <= 4; i++) pts2.push(p0.clone().addScaledVector(D3, i / 4).addScaledVector(side, (i % 2 ? 1 : -1) * 0.014));
      g.add(bolt(pts2, 0.006, 0.0028, cam, yel, yelHot)); const e = pts2[pts2.length - 1]; g.add(at(sphere(0.009, yelHot, 8), e.x, e.y, e.z)); });
    // SPARKS
    const motes = [[-0.3, 0.34, 0.05, 0.01, 2], [0.29, 0.38, 0.02, 0.009, 1], [-0.22, 0.52, 0.0, 0.008, 1], [0.23, 0.5, 0.04, 0.008, 2], [0.02, 0.56, 0.06, 0.007, 0], [-0.34, 0.2, 0.08, 0.007, 0], [0.12, 0.6, -0.02, 0.006, 1]];
    motes.forEach(([x, y, z, r, k]) => g.add(at(sphere(r, k === 2 ? yelHot : k === 1 ? yel : yelDim, 8), x, y, z)));
    // GLITCH: the body's right side breaking up into pixels on a grid, steel ones near it, lit ones drifting further out
    const cell = 0.044;
    for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
      if (R() > 0.92 - col * 0.2 - (row === 3 ? 0.2 : 0)) continue;
      const x = W / 2 + 0.04 + col * cell + (row % 2) * 0.01, y = yB - 0.02 - row * cell + 0.04, z = zf - 0.03 - R() * 0.06, s = cell * (0.78 - col * 0.1);
      g.add(at(cbox(s, s, s, 0.003, col < 1 && R() < 0.7 ? shellM : (R() < 0.4 ? yelHot : R() < 0.6 ? yel : yelDim)), x, y, z));
    }
    return { g };
  } };
})();
