// CORROSIVE RESERVOIR (Pack 1, toxic, Refined: +10% special attack): a reinforced chemical canister: a glass cylinder of glowing green acid (bright where it faces you, bubbles rising in it, its surface
// lit under the cap) between a heavy steel base, banded in yellow/black hazard stripes, and a bolted steel cap; three steel struts up its sides; a valve wheel on the cap and a small pressure gauge on its
// front; the acid eating at the cap: green-stained corrosion crusting its rim and running down over the glass in drips; fumes rising off the valve. Refined: more worked than VENOM GLAND.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const steelM = std('#a7b0bb', 0.9, 0.26), capSteel = std('#9aa3ae', 0.6, 0.36), steelMd = std('#7d8590', 0.7, 0.34), steelDk = std('#4c535e', 0.82, 0.36), boltM = std('#c3cbd6', 0.9, 0.22), rubberM = std('#15181d', 0.2, 0.7);
  const wheelM = std('#b8322a', 0.45, 0.35), faceM = std('#e9e4d2', 0.05, 0.5), needleM = std('#c0281e', 0.3, 0.4), crustM = std('#6f9a3a', 0.1, 0.75), stainM = std('#4f7f35', 0.3, 0.55);
  const glassM = new T.MeshStandardMaterial({ color: STY.col('#d6f5e0'), transparent: true, opacity: 0.24, metalness: 0, roughness: 0.02, depthWrite: false }); glassM.envMapIntensity = 2.2;
  const acidM = new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const tox = STY.glow('#66ff66', 1.3), toxHot = STY.glow('#b6ff9a', 1.5), toxDim = STY.glow('#2fae4a', 1.1), toxCore = STY.glow('#eaffd8', 1.6);
  const hazardM = STY.hazard(14, 0.5);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const AZ = 0.55, EL = 0.34, CAM = V(Math.cos(EL) * Math.sin(AZ), Math.sin(EL), Math.cos(EL) * Math.cos(AZ));
  const ring = (r, tube, mat, y) => { const t = torus(r, tube, mat, 48); t.rotation.x = PI / 2; t.position.y = y; return t; };
  const polar = (r, a, y) => [Math.sin(a) * r, y, Math.cos(a) * r];   // a = 0 is the front (+z)
  // a tapered run (a drip, a stain): a tube along points thinning toward its end, with a bead at its end
  function drip(pts, r, mat, bead) {
    const curve = new T.CatmullRomCurve3(pts.map(p => V(...p))), TS = 30, RS = 8, geo = new T.TubeGeometry(curve, TS, r, RS, false), p = geo.attributes.position, c = V(0, 0, 0), v = V(0, 0, 0);
    for (let i = 0; i <= TS; i++) { c.set(0, 0, 0); for (let j = 0; j < RS; j++) c.add(v.fromBufferAttribute(p, i * (RS + 1) + j)); c.multiplyScalar(1 / RS); const k = 1 - 0.55 * i / TS;
      for (let j = 0; j <= RS; j++) { const n = i * (RS + 1) + j; v.fromBufferAttribute(p, n).sub(c).multiplyScalar(k).add(c); p.setXYZ(n, v.x, v.y, v.z); } }
    geo.computeVertexNormals(); const g = G(); g.add(new T.Mesh(geo, mat));
    if (bead) { const e = curve.getPoint(1), b = sphere(r * 0.9, bead, 12); b.scale.set(1, 1.35, 1); g.add(at(b, e.x, e.y - r * 0.3, e.z)); }
    return g;
  }

  ITEMS.corrosive_reservoir = { exposure: 1.0, az: AZ, el: EL, build() {
    const g = G();
    const RB = 0.3, RG = 0.215, RA = 0.2, RC = 0.27, Y1 = 0.17, Y2 = 0.66, Y3 = 0.78, FILL = 0.585;   // the base's radius, the glass's, the acid's, the cap's; the glass from Y1 to Y2, the cap to Y3
    // THE BASE: a heavy steel drum on a foot ring, banded in hazard stripes, bolted round its top
    g.add(at(cyl(RB + 0.02, RB + 0.025, 0.035, steelDk, 48), 0, 0.0175, 0));
    g.add(at(cyl(RB, RB, Y1 - 0.035, steelMd, 48), 0, 0.035 + (Y1 - 0.035) / 2, 0));
    const hz = new T.Mesh(new T.CylinderGeometry(RB + 0.006, RB + 0.006, 0.07, 64, 1, false), [hazardM, steelDk, steelDk]); g.add(at(hz, 0, 0.09, 0));
    g.add(ring(RB + 0.006, 0.008, steelM, 0.125)); g.add(ring(RB + 0.006, 0.008, steelM, 0.055));
    g.add(ring(RB - 0.012, 0.014, steelM, Y1 - 0.002));
    g.add(at(cyl(RG + 0.03, RB - 0.02, 0.02, steelDk, 48), 0, Y1 + 0.006, 0));
    for (let i = 0; i < 12; i++) g.add(at(sphere(0.013, boltM, 8), ...polar(RB - 0.035, i * TAU / 12 + 0.13, Y1 + 0.012)));
    // THE GLASS and the gaskets it sits in
    g.add(at(new T.Mesh(new T.CylinderGeometry(RG, RG, Y2 - Y1, 64, 1, true), glassM), 0, (Y1 + Y2) / 2, 0));
    g.add(ring(RG + 0.004, 0.012, rubberM, Y1 + 0.018)); g.add(ring(RG + 0.004, 0.012, rubberM, Y2 - 0.016));
    // THE ACID: bright where it faces you, a deeper green toward its sides, its surface lit
    const ag = new T.CylinderGeometry(RA, RA, FILL - Y1 - 0.01, 64, 8, false), ap = ag.attributes.position, an = ag.attributes.normal, acol = new Float32Array(ap.count * 3), c = new T.Color();
    const DIM = STY.col('#1a7a34'), MID = STY.col('#55f060').multiplyScalar(1.2), BRIGHT = STY.col('#d8ffc4').multiplyScalar(1.45);
    for (let i = 0; i < ap.count; i++) {
      const top = an.getY(i) > 0.5, t = top ? 0.82 : Math.pow(Math.max(0, an.getX(i) * CAM.x + an.getZ(i) * CAM.z) / Math.hypot(CAM.x, CAM.z), 1.4);
      if (t < 0.65) c.copy(DIM).lerp(MID, t / 0.65); else c.copy(MID).lerp(BRIGHT, (t - 0.65) / 0.35); acol.set([c.r, c.g, c.b], i * 3);
    }
    ag.setAttribute('color', new T.BufferAttribute(acol, 3)); g.add(at(new T.Mesh(ag, acidM), 0, (Y1 + 0.01 + FILL) / 2, 0));
    g.add(ring(RA - 0.002, 0.006, toxHot, FILL));
    // bubbles rising in it, on the side toward you
    for (const [a, y, r] of [[0.35, 0.24, 0.012], [0.38, 0.31, 0.009], [0.33, 0.37, 0.011], [0.37, 0.44, 0.008], [0.34, 0.5, 0.007], [0.8, 0.28, 0.01], [0.84, 0.36, 0.008], [0.79, 0.45, 0.007],
                             [-0.1, 0.26, 0.009], [-0.06, 0.35, 0.007], [-0.12, 0.47, 0.008], [0.6, 0.55, 0.007], [0.15, 0.57, 0.006]])
      g.add(at(sphere(r, r > 0.009 ? toxCore : toxHot, 10), ...polar(RA + 0.004, AZ + a - 0.5, y)));
    // THE STRUTS: three steel bars from the base to the cap, clear of the front, bolted at both ends
    for (const a of [AZ + PI / 3 + 0.15, AZ + PI, AZ - PI / 3 - 0.15]) {
      const s = G(); s.rotation.y = a; g.add(s);
      s.add(at(cbox(0.05, Y2 - Y1 + 0.04, 0.032, 0.01, steelM), 0, (Y1 + Y2) / 2, RG + 0.045));
      for (const y of [Y1 + 0.03, Y2 - 0.03]) { const b = cyl(0.012, 0.012, 0.012, boltM, 6); b.rotation.x = PI / 2; s.add(at(b, 0, y, RG + 0.066)); }
      s.add(at(cbox(0.07, 0.03, 0.06, 0.008, steelDk), 0, Y1 + 0.005, RG + 0.04)); s.add(at(cbox(0.07, 0.03, 0.06, 0.008, steelDk), 0, Y2 - 0.005, RG + 0.04));
    }
    // THE CAP: a bolted steel drum, a raised boss on top
    g.add(at(cyl(RC, RC, Y3 - Y2, capSteel, 48), 0, (Y2 + Y3) / 2, 0));
    g.add(at(cyl(RC + 0.004, RC + 0.004, 0.026, steelDk, 48), 0, Y2 + 0.022, 0));
    g.add(ring(RC - 0.004, 0.012, steelM, Y3 - 0.002)); g.add(ring(RC - 0.004, 0.01, steelDk, Y2 + 0.004));
    for (let i = 0; i < 12; i++) g.add(at(sphere(0.013, boltM, 8), ...polar(RC - 0.03, i * TAU / 12 + 0.13, Y3 + 0.002)));
    g.add(at(cyl(0.11, 0.14, 0.035, capSteel, 40), 0, Y3 + 0.017, 0));
    // the valve: a stem up out of the boss and a red handwheel (rim, four spokes, a hub)
    g.add(at(cyl(0.022, 0.026, 0.08, steelDk, 16), 0, Y3 + 0.07, 0));
    const W = G(); W.position.y = Y3 + 0.105; W.rotation.set(0.0, 0.3, 0.0); g.add(W);
    W.add(ring(0.105, 0.015, wheelM, 0));
    for (let i = 0; i < 4; i++) { const sp = cbox(0.1, 0.016, 0.02, 0.005, wheelM); sp.rotation.y = i * PI / 2 + PI / 4; sp.position.set(Math.cos(i * PI / 2 + PI / 4) * 0.05, 0, -Math.sin(i * PI / 2 + PI / 4) * 0.05); W.add(sp); }
    W.add(at(cyl(0.03, 0.03, 0.03, steelM, 16), 0, 0, 0)); W.add(at(cyl(0.012, 0.012, 0.04, boltM, 6), 0, 0.01, 0));
    // the pressure gauge on the cap's front: a short pipe, a round case and bezel, a pale face with a needle
    const ga = AZ - 0.15, gp = G(); gp.rotation.y = ga; g.add(gp);
    const pipeG = cyl(0.016, 0.016, 0.05, steelDk, 12); pipeG.rotation.x = PI / 2; gp.add(at(pipeG, 0, (Y2 + Y3) / 2, RC + 0.02));
    const caseG = cyl(0.058, 0.058, 0.032, steelM, 32); caseG.rotation.x = PI / 2; gp.add(at(caseG, 0, (Y2 + Y3) / 2, RC + 0.055));
    const bez = torus(0.055, 0.008, boltM, 32); gp.add(at(bez, 0, (Y2 + Y3) / 2, RC + 0.072));
    const face = cyl(0.049, 0.049, 0.006, faceM, 32); face.rotation.x = PI / 2; gp.add(at(face, 0, (Y2 + Y3) / 2, RC + 0.07));
    const arc = new T.Mesh(new T.TorusGeometry(0.038, 0.005, 6, 24, 1.3), STY.glow('#ff4a3a', 1.2)); arc.rotation.z = -0.25; gp.add(at(arc, 0, (Y2 + Y3) / 2, RC + 0.074));
    const nd = cbox(0.006, 0.04, 0.004, 0.0015, needleM); nd.geometry.translate(0, 0.016, 0); nd.rotation.z = -0.9; gp.add(at(nd, 0, (Y2 + Y3) / 2, RC + 0.076));
    gp.add(at(sphere(0.007, steelDk, 8), 0, (Y2 + Y3) / 2, RC + 0.077));
    // CORROSION: green crust round the cap's rim and the valve's foot, stains down the cap's side, drips running from it down over the glass
    let seed = 5; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (const [a0, n] of [[0.05, 5], [0.42, 4], [-0.42, 4], [0.85, 3], [-0.8, 3], [1.5, 3]]) for (let i = 0; i < n; i++) {
      const r = 0.008 + 0.012 * rnd(), a = AZ + a0 + (rnd() - 0.5) * 0.22, rr = RC - 0.012 - rnd() * 0.07, k = new T.Mesh(new T.IcosahedronGeometry(r, 1), crustM); k.scale.set(1.3, 0.5, 1.2); k.rotation.set(rnd(), rnd() * 3, rnd());
      g.add(at(k, ...polar(rr, a, Y3 + 0.002)));
    }
    for (let i = 0; i < 6; i++) { const r = 0.01 + 0.01 * rnd(), k = new T.Mesh(new T.IcosahedronGeometry(r, 1), crustM); k.scale.set(1.2, 0.6, 1.2); g.add(at(k, ...polar(0.03 + 0.03 * rnd(), i * 1.1 + AZ, Y3 + 0.035 + 0.01 * rnd()))); }
    for (const [a, len, glowEnd] of [[AZ + 0.05, 0.3, true], [AZ + 0.42, 0.18, true], [AZ - 0.42, 0.24, true], [AZ + 0.85, 0.12, false], [AZ - 0.8, 0.1, false]]) {
      const pts = [polar(RC + 0.003, a, Y3 - 0.005), polar(RC + 0.004, a + 0.01, (Y2 + Y3) / 2), polar(RC + 0.002, a + 0.015, Y2 + 0.004), polar(RG + 0.03, a + 0.02, Y2 - 0.02)];
      for (let k = 1; k <= 4; k++) { const y = Y2 - 0.02 - len * k / 4; pts.push(polar(RG + 0.004, a + 0.02 + 0.015 * Math.sin(k * 1.7), y)); }
      g.add(drip(pts, 0.011, glowEnd ? tox : stainM, glowEnd ? toxHot : null));
    }
    // FUMES rising off the valve
    for (const [x, y, z, r, k] of [[0.05, 0.96, -0.02, 0.013, 1], [-0.15, 0.97, 0.06, 0.011, 2], [0.0, 1.03, 0.03, 0.01, 0], [0.17, 1.02, -0.06, 0.008, 2], [-0.08, 1.07, 0.02, 0.007, 1], [0.1, 1.1, 0.0, 0.006, 0]])
      g.add(at(sphere(r, k === 2 ? toxHot : k === 1 ? tox : toxDim, 8), x, y, z));
    return { g };
  } };
})();
