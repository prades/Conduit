// ARC CAPACITOR (Pack 1, electric, Refined: +10% attack speed): an industrial capacitor canister: a graphite cylinder ribbed round its foot, a yellow band round its shoulder, a charge window of glowing
// segments in its front, a little warning plate beside it, a bolted steel cap and foot ring; on the cap two ribbed ceramic insulators with brass terminals and a bright jagged arc leaping between their
// balls, forking, sparks thrown off it. The electric family's Refined piece: more built up than CHARGED WIRING.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const graphite = std('#55606c', 0.72, 0.3, { side: T.DoubleSide }), steelM = std('#a7b0bb', 0.85, 0.26, { side: T.DoubleSide });
  const boltM = std('#c3cbd6', 0.9, 0.22), paint = std('#e6ac00', 0.15, 0.36, { side: T.DoubleSide }), ceramic = std('#efe7d6', 0.05, 0.26, { side: T.DoubleSide }), brass = std('#d6ac52', 1, 0.28);
  const winM = std('#0b0d10', 0.5, 0.35), plateY = std('#f0c419', 0.2, 0.4), ink = std('#14161a', 0.3, 0.5);
  graphite.envMapIntensity = 1.1;
  const yel = STY.glow('#ffee33', 1.3), yelHot = STY.glow('#fff7a8', 1.8), yelDim = STY.glow('#d4b800', 1.1);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = p => p.isVector3 ? p.clone() : new T.Vector3(p[0], p[1], p[2]), UP = new T.Vector3(0, 1, 0);
  function rod(a, b, r, mat, seg) { const A = V(a), d = V(b).sub(A), L = d.length(), m = new T.Mesh(new T.CylinderGeometry(r, r, L, seg || 6, 1), mat); m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); return m; }
  function lathe(pr, mat, seg) { const pts = []; pr.forEach(([r, y]) => pts.push(new T.Vector2(r, y), new T.Vector2(r, y))); return new T.Mesh(new T.LatheGeometry(pts, seg || 64), mat); }
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // a jagged arc from a to b: n straight legs zig-zagging across the line (mostly alternate sides, each kink reaching up to `amp` of a leg's length, in the plane facing the camera, a little depth), the
  // whole bowed by `bow` along +y
  function jag(a, b, n, amp, bow, R, cam) { const A = V(a), d = V(b).sub(A), side = new T.Vector3().crossVectors(d, cam).normalize(), seg = d.length() / n, pts = []; let s = R() < 0.5 ? 1 : -1;
    for (let i = 0; i <= n; i++) { const t = i / n, p = A.clone().addScaledVector(d, t); if (i && i < n) { const k = amp * seg * (0.4 + R() * 0.6); p.addScaledVector(side, s * k).addScaledVector(cam, (R() - 0.5) * k * 0.6); s = R() < 0.8 ? -s : s; } p.y += Math.sin(PI * t) * bow; pts.push(p); }
    return pts; }
  function bolt(pts, rDim, rCore, cam, dimM, coreM) { const g = G(), off = cam.clone().multiplyScalar(rDim * 0.8);
    for (let i = 0; i < pts.length - 1; i++) { g.add(rod(pts[i], pts[i + 1], rDim, dimM || yelDim)); g.add(rod(pts[i].clone().add(off), pts[i + 1].clone().add(off), rCore, coreM || yelHot)); }
    pts.forEach(p => { g.add(at(sphere(rDim, dimM || yelDim, 6), p.x, p.y, p.z)); g.add(at(sphere(rCore, coreM || yelHot, 6), p.x + off.x, p.y + off.y, p.z + off.z)); });
    return g; }
  // a ribbed ceramic insulator standing on +y: a column with three sheds, a brass cap and stud, a nut and a ball electrode; returns the ball's centre height
  function insulator(g, x, y, z) {
    const pr = [[0.0, 0], [0.05, 0], [0.05, 0.02]], sheds = [[0.07, 0.042], [0.064, 0.082], [0.058, 0.122]];
    sheds.forEach(([r, h]) => pr.push([0.031, h - 0.018], [r - 0.008, h - 0.011], [r, h - 0.005], [r, h + 0.002], [r - 0.012, h + 0.011], [0.031, h + 0.016]));
    pr.push([0.031, 0.152], [0.0, 0.152]);
    g.add(at(lathe(pr, ceramic, 40), x, y, z));
    g.add(at(cyl(0.04, 0.042, 0.026, brass, 24), x, y + 0.165, z)); g.add(at(cyl(0.013, 0.013, 0.05, brass, 12), x, y + 0.198, z));
    g.add(at(cyl(0.024, 0.024, 0.016, brass, 6), x, y + 0.19, z)); g.add(at(sphere(0.027, steelM, 20), x, y + 0.235, z));
    return y + 0.235;
  }

  ITEMS.arc_capacitor = { exposure: 1.0, az: 0.5, el: 0.33, build() {
    const g = G(), R = rng(11), az = 0.5, el = 0.33, cam = new T.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    const RB = 0.285, yF = -0.46, yC = 0.2;
    // THE FOOT RING, bolted
    g.add(lathe([[0, yF], [0.335, yF], [0.35, yF + 0.014], [0.35, yF + 0.04], [0.333, yF + 0.056], [0, yF + 0.056]], steelM, 72));
    for (let i = 0; i < 10; i++) { const a = i * TAU / 10 + 0.3; g.add(at(cyl(0.017, 0.017, 0.014, boltM, 6), 0.316 * Math.sin(a), yF + 0.062, 0.316 * Math.cos(a))); }
    // THE BODY: a graphite can, three ribs round its foot, plain above (the window's place), a yellow band at the shoulder
    const body = [[0, yF + 0.05], [RB, yF + 0.05]];
    for (let k = 0; k < 3; k++) { const y = yF + 0.07 + k * 0.056; body.push([RB, y], [RB + 0.022, y + 0.008], [RB + 0.022, y + 0.03], [RB, y + 0.038]); }
    body.push([RB, yC - 0.03], [RB - 0.02, yC], [0, yC]);
    g.add(lathe(body, graphite, 72));
    g.add(lathe([[RB - 0.002, 0.075], [RB + 0.008, 0.075], [RB + 0.012, 0.081], [RB + 0.012, 0.154], [RB + 0.008, 0.16], [RB - 0.002, 0.16]], paint, 72));
    // THE CAP: a bevelled steel lid, bolted round its rim
    g.add(lathe([[0, yC - 0.01], [RB - 0.008, yC - 0.01], [RB, yC], [RB, yC + 0.022], [RB - 0.014, yC + 0.036], [0, yC + 0.036]], steelM, 72));
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + PI / 8; g.add(at(cyl(0.017, 0.017, 0.014, boltM, 6), 0.234 * Math.sin(a), yC + 0.043, 0.234 * Math.cos(a))); }
    // THE TERMINALS: two ceramic insulators on the cap (set across the view), and the arc between their balls
    const rx = new T.Vector3(Math.cos(az), 0, -Math.sin(az)), s = 0.13;
    const ya = insulator(g, -s * rx.x, yC + 0.036, -s * rx.z); insulator(g, s * rx.x, yC + 0.036, s * rx.z);
    const A = new T.Vector3(-s * rx.x, ya, -s * rx.z).addScaledVector(rx, 0.022), B = new T.Vector3(s * rx.x, ya, s * rx.z).addScaledVector(rx, -0.022);
    const main = jag(A, B, 12, 0.75, 0.15, R, cam);
    g.add(bolt(main, 0.012, 0.0056, cam));
    g.add(bolt(jag(A, B, 9, 0.75, 0.045, R, cam), 0.0065, 0.003, cam, yel, yelHot));
    // two short forks crackling off the top of the main arc, a spark at each tip
    [[4, -1], [8, 1]].forEach(([i, sg]) => { const p0 = main[i], fk = [p0, p0.clone().addScaledVector(rx, sg * 0.022).add(new T.Vector3(0, 0.024, 0.004)), p0.clone().addScaledVector(rx, sg * 0.024).add(new T.Vector3(0, 0.05, -0.004))];
      g.add(bolt(fk, 0.0055, 0.0025, cam)); const e = fk[2]; g.add(at(sphere(0.0075, yelHot, 8), e.x, e.y, e.z)); });
    [A, B].forEach(p => g.add(at(sphere(0.021, yelHot, 12), p.x, p.y + 0.004, p.z)));
    // THE CHARGE WINDOW: a steel frame facing the viewer, a dark recess and five glowing segments (the top one the brightest)
    const W = G(); W.rotation.y = az; g.add(W); const wy = -0.075;
    W.add(at(cbox(0.13, 0.26, 0.05, 0.014, steelM), 0, wy, RB - 0.012)); W.add(at(cbox(0.092, 0.218, 0.02, 0.006, winM), 0, wy, RB + 0.012));
    for (let k = 0; k < 5; k++) W.add(at(cbox(0.066, 0.032, 0.012, 0.004, k === 4 ? yelHot : yel), 0, wy - 0.084 + k * 0.042, RB + 0.02));
    for (const sy of [-1, 1]) { const b = at(cyl(0.008, 0.008, 0.01, boltM, 8), 0, wy + sy * 0.117, RB + 0.014); b.rotation.x = PI / 2; W.add(b); }
    // THE WARNING PLATE: a small yellow triangle with a dark rim and a lightning glyph, to the window's left
    const P = G(); P.rotation.y = az - 0.62; g.add(P);
    const tri = (r) => [[0, r], [-r * 0.866, -r * 0.5], [r * 0.866, -r * 0.5]];
    P.add(at(plate(tri(0.068), 0.012, 0.003, ink), 0, -0.06, RB + 0.002)); P.add(at(plate(tri(0.054), 0.012, 0.002, plateY), 0, -0.062, RB + 0.006));
    P.add(at(plate([[0.006, 0.028], [-0.013, -0.002], [0.0, -0.002], [-0.007, -0.028], [0.015, 0.006], [0.002, 0.006]], 0.01, 0, ink), 0, -0.066, RB + 0.01));
    // SPARKS thrown off the arc
    const motes = [[0.0, 0.6, 0.05, 0.012, 2], [-0.13, 0.55, 0.06, 0.01, 1], [0.14, 0.57, -0.02, 0.01, 1], [-0.05, 0.64, 0.0, 0.008, 2], [0.08, 0.65, 0.02, 0.008, 0], [-0.19, 0.6, 0.0, 0.007, 0],
                   [0.21, 0.48, -0.05, 0.007, 2], [-0.24, 0.46, 0.04, 0.006, 1], [0.2, 0.62, -0.06, 0.005, 1]];
    motes.forEach(([x, y, z, r, k]) => g.add(at(sphere(r, k === 2 ? yelHot : k === 1 ? yel : yelDim, 8), x, y, z)));
    return { g };
  } };
})();
