// IMPACT STUDS (Pack 1, core, Unrefined: +5% damage dealt): a heavy knuckle band. A thick loop of dark leather, shaped as it sits round a fist, its cut edges lighter and stitched along both
// sides; across its crown (the knuckles) a riveted steel plate carrying four big conical steel studs, each seated on a washer ringed in glowing core-teal; a steel buckle on its side, the strap's
// tail coming through it and lying down the loop, and a few teal sparks knocked off the studs.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const leather = std('#2e241f', 0.15, 0.48), edgeM = std('#4d3c30', 0.1, 0.55), threadM = std('#b59d78', 0.05, 0.7), studM = std('#c3cbd6', 0.75, 0.26), plateM = std('#59606c', 0.8, 0.3);
  const washM = std('#8b939e', 0.85, 0.28), buckleM = std('#c3cbd6', 0.75, 0.28), holeM = std('#0d0f12', 0.3, 0.7);
  const teal = STY.glow('#00ccaa', 1.6), tealHot = STY.glow('#8ffff0', 1.7), tealDim = STY.glow('#00806a', 1.2);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const flat = (m) => { m.rotation.x = PI / 2; return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z), Yv = V(0, 1, 0);
  const A = 0.43, B = 0.3, TH = 0.075, W = 0.3;   // the loop: outer half-width, half-height, the strap's thickness and width
  const onLoop = th => ({ p: V(A * Math.cos(th), B * Math.sin(th), 0), n: V(Math.cos(th) / A, Math.sin(th) / B, 0).normalize() });   // a point on the loop's outer face and its normal
  // a strip lying on the loop's outer face from angle a0 to a1, between offsets o0 and o1 off it, w wide (across z)
  function strip(a0, a1, o0, o1, w, mat) {
    const s = new T.Shape(), n = 40, b = 0.006;
    for (let i = 0; i <= n; i++) { const { p, n: q } = onLoop(a0 + (a1 - a0) * i / n), v = p.addScaledVector(q, o1 - b); i ? s.lineTo(v.x, v.y) : s.moveTo(v.x, v.y); }
    for (let i = n; i >= 0; i--) { const { p, n: q } = onLoop(a0 + (a1 - a0) * i / n), v = p.addScaledVector(q, o0 + b); s.lineTo(v.x, v.y); }
    s.closePath();
    const geo = new T.ExtrudeGeometry(s, { depth: w - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 4 }); geo.translate(0, 0, -(w - 2 * b) / 2);
    return new T.Mesh(geo, mat);
  }
  const onFace = (th, off, z, o) => { const { p, n } = onLoop(th); o.position.copy(p).addScaledVector(n, off); o.position.z = z; o.quaternion.setFromUnitVectors(Yv, n); return o; };

  ITEMS.impact_studs = { exposure: 1.0, az: 0.55, el: 0.34, build() {
    const g = G(), P = G(); g.add(P);
    // THE STRAP: an oval loop, extruded across its width (local z); its cut edges a lighter leather; stitched along both sides
    const s = new T.Shape(); s.absellipse(0, 0, A, B, 0, TAU, false); const h = new T.Path(); h.absellipse(0, 0, A - TH, B - TH, 0, TAU, true); s.holes.push(h);
    const geo = new T.ExtrudeGeometry(s, { depth: W - 0.04, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.012, bevelSegments: 2, curveSegments: 96 }); geo.translate(0, 0, -(W - 0.04) / 2);
    P.add(new T.Mesh(geo, [edgeM, leather]));
    for (let i = 0; i < 64; i++) { const th = i / 64 * TAU; if (th < 0.12 || th > TAU - 0.95) continue; for (const z of [-1, 1]) P.add(onFace(th, 0.016, z * (W / 2 - 0.03), cbox(0.026, 0.006, 0.007, 0.002, threadM))); }
    // THE CROWN PLATE across the knuckles, riveted between the studs
    P.add(strip(PI / 2 - 1.28, PI / 2 + 1.28, 0.006, 0.03, 0.2, plateM));
    for (const th of [PI / 2, PI / 2 + 0.64, PI / 2 - 0.64, PI / 2 + 1.2, PI / 2 - 1.2]) for (const z of [-0.072, 0.072]) P.add(onFace(th, 0.03, z, sphere(0.014, washM, 10)));
    // THE STUDS, each along the loop's outward normal: a washer ringed in teal, a collar, the cone
    [PI / 2 + 0.95, PI / 2 + 0.32, PI / 2 - 0.32, PI / 2 - 0.95].forEach(th => {
      const q = onFace(th, 0.028, 0, G()); P.add(q);
      q.add(at(cyl(0.098, 0.106, 0.03, washM, 32), 0, 0.012, 0));
      q.add(at(flat(torus(0.11, 0.014, teal, 48)), 0, 0.008, 0));
      q.add(at(cyl(0.082, 0.09, 0.02, studM, 32), 0, 0.036, 0));
      q.add(at(new T.Mesh(new T.ConeGeometry(0.082, 0.2, 32), studM), 0, 0.146, 0));
    });
    // THE BUCKLE on its right-hand side: a steel frame over the strap, its bar and prong; the strap's tail through it, lying down the loop
    P.add(strip(-0.95, 0.02, 0.004, 0.03, W - 0.09, leather));
    for (const th of [-0.42, -0.62]) P.add(onFace(th, 0.03, 0, cyl(0.017, 0.017, 0.006, holeM, 12)));
    const bq = onFace(0.0, 0.034, 0, G()); P.add(bq);
    const rr = (p, w, h, r) => { const x = w / 2, y = h / 2; p.moveTo(-x + r, -y); [[x - r, -y + r, -PI / 2], [x - r, y - r, 0], [-x + r, y - r, PI / 2], [-x + r, -y + r, PI]].forEach(([cx, cy, s0]) => p.absarc(cx, cy, r, s0, s0 + PI / 2, false)); p.closePath(); return p; };
    const fr = rr(new T.Shape(), 0.14, 0.38, 0.03), fh = new T.Path(); fh.moveTo(-0.042, -0.16); fh.lineTo(-0.042, 0.16); fh.lineTo(0.042, 0.16); fh.lineTo(0.042, -0.16); fh.closePath(); fr.holes.push(fh);
    const fg = new T.ExtrudeGeometry(fr, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2 }); fg.translate(0, 0, -0.006);
    bq.add(flat(new T.Mesh(fg, buckleM)));
    const bar = cbox(0.024, 0.022, 0.34, 0.008, buckleM); bq.add(at(bar, -0.03, 0.012, 0));
    const prong = cbox(0.13, 0.016, 0.022, 0.005, buckleM); prong.rotation.z = -0.12; bq.add(at(prong, 0.035, 0.024, 0));
    P.rotation.set(0.12, -0.35, 0);
    // TEAL SPARKS knocked off the studs
    const motes = [[-0.32, 0.62, 0.2, 0.014, 1], [0.08, 0.7, 0.18, 0.012, 2], [0.36, 0.6, 0.12, 0.011, 1], [-0.14, 0.8, 0.12, 0.009, 0], [0.24, 0.82, 0.1, 0.008, 2], [-0.44, 0.45, 0.1, 0.009, 0]];
    motes.forEach(([x, y, z, r, k]) => g.add(at(sphere(r, k === 2 ? tealHot : k === 1 ? teal : tealDim, 8), x, y, z)));
    return { g };
  } };
})();
