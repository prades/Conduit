// CHARGED WIRING (Pack 1, electric, Unrefined: +5% attack speed): a short cable spool, two bevelled steel flanges with lightening holes and a hub nut, wound with insulated cable in alternating black and
// yellow turns; the cable's two ends stick up out of it, one off the top turn round the flange's rim, one out of a hole in the top flange, and bend toward each other, their insulation stripped back to bare
// copper frayed into strands at the tips, a small yellow arc jumping the gap between them and sparks drifting off it. The electric family's first piece (after EMBER PLATING, the approved reference).
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const flangeM = std('#aeb7c2', 0.68, 0.28, { side: T.DoubleSide }), hubM = std('#c3cbd6', 0.95, 0.2), holeM = std('#0d0f13', 0.5, 0.6), rivetM = std('#d4dbe4', 0.9, 0.2);
  const yellowIns = std('#e8ac00', 0.1, 0.34), blackIns = std('#2a2d33', 0.35, 0.28), coreM = std('#111317', 0.3, 0.6);
  const copper = std('#e8925a', 1, 0.24);
  const yel = STY.glow('#ffee33', 1.3), yelHot = STY.glow('#fff7a8', 1.8), yelDim = STY.glow('#d4b800', 1.1);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = p => p.isVector3 ? p.clone() : new T.Vector3(p[0], p[1], p[2]), UP = new T.Vector3(0, 1, 0);
  // a straight rod from a to b
  function rod(a, b, r, mat, seg) { const A = V(a), d = V(b).sub(A), L = d.length(), m = new T.Mesh(new T.CylinderGeometry(r, r, L, seg || 6, 1), mat); m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); return m; }
  // a lathe about +y from an (r, y) profile, every corner kept sharp (each profile point doubled)
  function lathe(pr, mat, seg) { const pts = []; pr.forEach(([r, y]) => pts.push(new T.Vector2(r, y), new T.Vector2(r, y))); return new T.Mesh(new T.LatheGeometry(pts, seg || 64), mat); }
  // a smooth tube through points (more segments than the shared helper, for the long cable runs)
  function cable(pts, r, mat) { return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts.map(V)), 64, r, 12, false), mat); }
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // a jagged arc from a to b: n straight legs zig-zagging across the line (mostly alternate sides, each kink reaching up to `amp` of a leg's length, in the plane facing the camera, a little depth), the
  // whole bowed by `bow` along +y
  function jag(a, b, n, amp, bow, R, cam) { const A = V(a), d = V(b).sub(A), side = new T.Vector3().crossVectors(d, cam).normalize(), seg = d.length() / n, pts = []; let s = R() < 0.5 ? 1 : -1;
    for (let i = 0; i <= n; i++) { const t = i / n, p = A.clone().addScaledVector(d, t); if (i && i < n) { const k = amp * seg * (0.4 + R() * 0.6); p.addScaledVector(side, s * k).addScaledVector(cam, (R() - 0.5) * k * 0.6); s = R() < 0.8 ? -s : s; } p.y += Math.sin(PI * t) * bow; pts.push(p); }
    return pts; }
  // draw it: a thicker dim sheath and a thin bright core nudged toward the camera so it shows on the sheath
  function bolt(pts, rDim, rCore, cam, dimM, coreM) { const g = G(), off = cam.clone().multiplyScalar(rDim * 0.8);
    for (let i = 0; i < pts.length - 1; i++) { g.add(rod(pts[i], pts[i + 1], rDim, dimM || yelDim)); g.add(rod(pts[i].clone().add(off), pts[i + 1].clone().add(off), rCore, coreM || yelHot)); }
    pts.forEach(p => { g.add(at(sphere(rDim, dimM || yelDim, 6), p.x, p.y, p.z)); g.add(at(sphere(rCore, coreM || yelHot, 6), p.x + off.x, p.y + off.y, p.z + off.z)); });
    return g; }
  // the bare end of a lead: a copper core out of the insulation, splitting into strands that splay apart; returns the strands' tips
  function fray(g, base, dir, R) {
    const side = new T.Vector3().crossVectors(dir, UP).normalize(), up2 = new T.Vector3().crossVectors(side, dir).normalize(), tips = [];
    const coreEnd = base.clone().addScaledVector(dir, 0.03); g.add(rod(base, coreEnd, 0.019, copper, 12)); g.add(at(sphere(0.019, copper, 12), coreEnd.x, coreEnd.y, coreEnd.z));
    for (let i = 0; i < 9; i++) {
      const a = i / 9 * TAU + R() * 0.5, k = i % 2 ? 0.012 : 0.006, spread = 0.35 + R() * 0.6, L = 0.045 + R() * 0.035;
      const off = side.clone().multiplyScalar(Math.cos(a)).addScaledVector(up2, Math.sin(a)), d = dir.clone().addScaledVector(off, spread).normalize();
      const s0 = coreEnd.clone().addScaledVector(off, k), s1 = s0.clone().addScaledVector(dir, L * 0.3).addScaledVector(off, 0.004), s2 = s1.clone().addScaledVector(d, L * 0.7);
      g.add(rod(s0, s1, 0.0052, copper)); g.add(rod(s1, s2, 0.0045, copper)); g.add(at(sphere(0.0052, copper, 6), s1.x, s1.y, s1.z)); tips.push(s2);
    }
    return { tips, end: coreEnd.clone().addScaledVector(dir, 0.04) };
  }

  ITEMS.charged_wiring = { exposure: 1.0, az: 0.55, el: 0.32, build() {
    const g = G(), R = rng(7), az = 0.55, el = 0.32, cam = new T.Vector3(Math.cos(el) * Math.sin(az), Math.sin(el), Math.cos(el) * Math.cos(az));
    const RF = 0.3, TH = 0.046, RH = 0.214, RC = 0.033, N = 6, yb = -0.38, y0 = yb + TH / 2 + RC, yTop = y0 + (N - 1) * 2 * RC, yt = yTop + RC + 0.002 + TH / 2;
    // THE FLANGES: bevelled steel discs, rivets round the top one's rim, four lightening holes and a hub nut
    const flange = () => lathe([[0.03, -TH / 2], [RF - 0.014, -TH / 2], [RF, -TH / 2 + 0.014], [RF, TH / 2 - 0.014], [RF - 0.014, TH / 2], [0.03, TH / 2], [0.03, -TH / 2]], flangeM, 72);
    g.add(at(flange(), 0, yb, 0)); g.add(at(flange(), 0, yt, 0));
    const top = yt + TH / 2;
    for (let i = 0; i < 4; i++) { const a = PI / 4 + i * PI / 2; g.add(at(cyl(0.036, 0.036, 0.004, holeM, 24), 0.158 * Math.sin(a), top + 0.001, 0.158 * Math.cos(a))); }
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12, r = sphere(0.012, rivetM, 10); r.scale.y = 0.55; g.add(at(r, 0.262 * Math.sin(a), top, 0.262 * Math.cos(a))); }
    g.add(at(cyl(0.068, 0.074, 0.026, hubM, 32), 0, top + 0.013, 0)); g.add(at(cyl(0.046, 0.046, 0.026, hubM, 6), 0, top + 0.039, 0)); g.add(at(cyl(0.018, 0.018, 0.004, holeM, 16), 0, top + 0.052, 0));
    // THE WINDING: turns of insulated cable stacked on a dark core, black and yellow by turns (the top one yellow)
    g.add(at(cyl(RH - 0.012, RH - 0.012, yTop - y0 + 2 * RC, coreM, 40), 0, (y0 + yTop) / 2, 0));
    for (let k = 0; k < N; k++) { const t = new T.Mesh(new T.TorusGeometry(RH, RC, 14, 80), (N - 1 - k) % 2 ? blackIns : yellowIns); t.rotation.x = PI / 2; g.add(at(t, 0, y0 + k * 2 * RC, 0)); }
    // THE LEADS. The outer one leaves the top turn at the front-right, out under the flange's rim and up round it; the inner one comes up out of a hole in the top flange (front-left). Both bend toward each other.
    const a0 = 0.78, ra = (r, y) => [r * Math.sin(a0), y, r * Math.cos(a0)];
    const outer = [ra(RH - 0.004, yTop), ra(0.29, yTop - 0.012), ra(0.352, yt - 0.006), ra(0.34, top + 0.07), [0.27, top + 0.18, 0.19], [0.215, top + 0.245, 0.13], [0.17, top + 0.268, 0.1]];
    g.add(cable(outer, RC * 0.8, yellowIns));
    const ah = -PI / 4, hx = 0.158 * Math.sin(ah), hz = 0.158 * Math.cos(ah);
    const inner = [[hx, top - 0.02, hz], [hx - 0.004, top + 0.06, hz], [hx - 0.04, top + 0.16, hz - 0.012], [-0.2, top + 0.238, 0.085], [-0.162, top + 0.266, 0.078]];
    g.add(cable(inner, RC * 0.8, blackIns));
    // the bare copper at each cut end, frayed into strands
    const endOf = pts => { const p = V(pts[pts.length - 1]), q = V(pts[pts.length - 2]); return { p, d: p.clone().sub(q).normalize() }; };
    const eo = endOf(outer), ei = endOf(inner);
    const fo = fray(g, eo.p, eo.d, R), fi = fray(g, ei.p, ei.d, R);
    // THE ARC jumping between the two frayed ends: a main bolt, a thinner one looping higher, a flare where each meets the copper, sparks at a few strand tips
    const mid = t => t.reduce((s, p) => s.add(p), new T.Vector3()).multiplyScalar(1 / t.length);
    const A = mid(fo.tips), B = mid(fi.tips);
    g.add(bolt(jag(A, B, 8, 0.8, 0.02, R, cam), 0.011, 0.005, cam));
    g.add(bolt(jag(A, B, 7, 0.75, 0.045, R, cam), 0.0062, 0.0028, cam, yel, yelHot));
    [A, B].forEach(p => g.add(at(sphere(0.014, yelHot, 12), p.x, p.y, p.z)));
    [fo.tips[1], fo.tips[4], fi.tips[2], fi.tips[6]].forEach(p => g.add(at(sphere(0.0065, yelHot, 8), p.x, p.y, p.z)));
    // SPARKS drifting up off the arc (smaller and fainter as they rise) and a few falling
    const motes = [[-0.03, 0.43, 0.06, 0.012, 2], [0.08, 0.44, 0.04, 0.01, 1], [-0.12, 0.45, 0.03, 0.009, 1], [0.03, 0.49, 0.02, 0.009, 2], [0.14, 0.48, 0.0, 0.007, 0], [-0.07, 0.52, 0.02, 0.007, 1],
                   [0.07, 0.53, -0.01, 0.006, 0], [-0.2, 0.33, 0.1, 0.007, 0], [0.22, 0.36, 0.08, 0.007, 1], [-0.17, 0.5, 0.0, 0.005, 0]];
    motes.forEach(([x, y, z, r, k]) => g.add(at(sphere(r, k === 2 ? yelHot : k === 1 ? yel : yelDim, 8), x, y, z)));
    return { g };
  } };
})();
