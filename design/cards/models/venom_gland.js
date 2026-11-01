// VENOM GLAND (Pack 1, toxic, Unrefined: +5% special attack): a plump, rounded gland sac, bottom-heavy (swelling out over its collar, a round dome on top) and budding two smaller lobes; its skin a wet,
// deep-green, semi-translucent membrane with dark veins branching over it, and the venom glowing INSIDE it (a glow smaller than the skin, bright in its middle, so the sac's edges stay dark: fluid in a sac, not a
// lamp), a few bubbles in it; its neck gathered into a steel collar of two halves, bolted at either side by a small clamp screw; below the collar a short steel nozzle and a needle pointing down, a fat drop of
// venom forming at its tip and one falling; a few motes of venom rising off it. Unrefined: the simplest of the toxic items.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const steelM = std('#a7b0bb', 0.9, 0.26), steelDk = std('#5d6570', 0.85, 0.32), screwM = std('#c3cbd6', 0.9, 0.22), veinM = std('#12281a', 0.1, 0.32), lipM = std('#24552e', 0.05, 0.3);
  const skinM = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, transparent: true, depthWrite: false, metalness: 0, roughness: 0.26 }); skinM.envMapIntensity = 0.6;   // the membrane (rgba per vertex)
  const fluidM = new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false });   // the venom's glow
  const tox = STY.glow('#66ff66', 1.3), toxHot = STY.glow('#b6ff9a', 1.5), toxDim = STY.glow('#2fae4a', 1.1), toxCore = STY.glow('#eaffd8', 1.6);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const AZ = 0.55, EL = 0.32, CAM = V(Math.cos(EL) * Math.sin(AZ), Math.sin(EL), Math.cos(EL) * Math.cos(AZ));   // toward the hero camera (for the membrane's rim and the venom's glow)
  const YC = 0.025;   // the collar's middle
  // THE SAC: a lathe profile (radius, height): a short neck in the collar, the underside swelling out over it, widest low, a round dome on top ...
  const PROF = [[0.074, -0.01], [0.076, 0.05], [0.086, 0.078], [0.14, 0.1], [0.205, 0.135], [0.25, 0.185], [0.265, 0.245], [0.258, 0.32], [0.238, 0.4], [0.195, 0.475], [0.13, 0.54], [0.06, 0.575], [0, 0.582]];
  const PTS = new T.CatmullRomCurve3(PROF.map(([r, y]) => V(r, y, 0)), false, 'centripetal').getPoints(80).map(p => new T.Vector2(Math.max(0.0005, p.x), p.y));
  const Y0 = PROF[0][1], Y1 = PROF[PROF.length - 1][1];
  const rAt = y => { for (let i = 1; i < PTS.length; i++) if (PTS[i].y >= y) { const t = (y - PTS[i - 1].y) / Math.max(1e-6, PTS[i].y - PTS[i - 1].y); return PTS[i - 1].x + (PTS[i].x - PTS[i - 1].x) * t; } return 0; };
  // ... a little lumpy, and gathered in folds where it leaves the collar
  const shape = (a, y) => { const s = (y - Y0) / (Y1 - Y0), w = y < 0.07 ? 0 : Math.pow(Math.max(0, 1 - (y - 0.07) / 0.09), 2); return (1 + 0.035 * Math.sin(2 * a + 0.9) * Math.sin(PI * s)) * (1 + 0.07 * w * Math.sin(11 * a)); };
  // ... and two smaller lobes budding off it: along each ray from the sac's middle C, the farther of the body and each lobe, blended smoothly (a soft crease where they meet)
  const C = V(0, 0.3, 0), LOBES = [[V(-0.17, 0.42, 0.1), 0.1], [V(0.2, 0.18, -0.1), 0.09]], KS = 55;
  function bud(P) {
    const d = P.clone().sub(C), rm = d.length(); d.normalize(); let acc = Math.exp(KS * rm);
    for (const [L, rho] of LOBES) { const o = L.clone().sub(C), b = d.dot(o), disc = b * b - (o.lengthSq() - rho * rho); if (disc > 0 && b + Math.sqrt(disc) > 0) acc += Math.exp(KS * (b + Math.sqrt(disc))); }
    return C.clone().addScaledVector(d, Math.log(acc) / KS);
  }
  // the sac's surface (the lathe's seam at the back), or, `inset` in from it along its normals, the glow inside it
  function sacGeo(inset) {
    const geo = new T.LatheGeometry(PTS, 120, PI), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), sh = shape(Math.atan2(x, z), y), q = bud(V(x * sh, y, z * sh)); p.setXYZ(i, q.x, q.y, q.z); }
    geo.computeVertexNormals();
    if (inset) { const n = geo.attributes.normal; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) - n.getX(i) * inset, p.getY(i) - n.getY(i) * inset, p.getZ(i) - n.getZ(i) * inset); geo.computeVertexNormals(); }
    return geo;
  }
  // a point on (or off, by `out`: less than 0 is in) the skin at height y and azimuth a (0 = front, toward +x)
  const skinPt = (y, a, out) => { const r = rAt(y) * shape(a, y), p = bud(V(Math.sin(a) * r, y, Math.cos(a) * r)); return p.addScaledVector(p.clone().sub(C).normalize(), out || 0); };
  const facing = (n, i) => n.getX(i) * CAM.x + n.getY(i) * CAM.y + n.getZ(i) * CAM.z;
  // a vein: a tapered tube along points, thick at its root
  function vein(pts, r) {
    const curve = new T.CatmullRomCurve3(pts), TS = 40, RS = 6, geo = new T.TubeGeometry(curve, TS, r, RS, false), p = geo.attributes.position, c = V(0, 0, 0), v = V(0, 0, 0);
    for (let i = 0; i <= TS; i++) { c.set(0, 0, 0); for (let j = 0; j < RS; j++) c.add(v.fromBufferAttribute(p, i * (RS + 1) + j)); c.multiplyScalar(1 / RS); const k = 1 - 0.9 * Math.pow(i / TS, 1.3);
      for (let j = 0; j <= RS; j++) { const n = i * (RS + 1) + j; v.fromBufferAttribute(p, n).sub(c).multiplyScalar(k).add(c); p.setXYZ(n, v.x, v.y, v.z); } }
    geo.computeVertexNormals(); return new T.Mesh(geo, veinM);
  }

  ITEMS.venom_gland = { exposure: 1.0, az: AZ, el: EL, build() {
    const g = G(), c = new T.Color();
    // THE VENOM: a glow inside the skin, a skin's thickness in from it: bright in the middle, where it faces you, a deep green toward its edges
    const SKIN = 0.05, fg = sacGeo(SKIN), fn = fg.attributes.normal, fc = new Float32Array(fn.count * 3);
    const DIM = STY.col('#1f8a3a'), MID = STY.col('#55f060').multiplyScalar(1.15), BRIGHT = STY.col('#d8ffc4').multiplyScalar(1.35);
    for (let i = 0; i < fn.count; i++) { const t = Math.pow(Math.max(0, facing(fn, i)), 1.3); if (t < 0.6) c.copy(DIM).lerp(MID, t / 0.6); else c.copy(MID).lerp(BRIGHT, (t - 0.6) / 0.4); fc.set([c.r, c.g, c.b], i * 3); }
    fg.setAttribute('color', new T.BufferAttribute(fc, 3)); g.add(new T.Mesh(fg, fluidM));
    // bubbles in it, on the side toward you
    for (const [y, a, r] of [[0.22, 0.45, 0.014], [0.3, 0.15, 0.01], [0.37, 0.7, 0.012], [0.45, 0.4, 0.008], [0.18, 0.95, 0.009]]) g.add(at(sphere(r, toxCore, 10), ...skinPt(y, a, -SKIN + r * 0.3).toArray()));
    // THE SKIN: a deep-green membrane, wet (glossy): thin and clear enough over the glow to let it through, a dense dark green past the glow's edge, toward its rim
    const mg = sacGeo(0), mn = mg.attributes.normal, mc = new Float32Array(mn.count * 4), MIDSKIN = STY.col('#2b6a35'), RIMSKIN = STY.col('#0f3d1b');
    for (let i = 0; i < mn.count; i++) { const f = Math.abs(facing(mn, i)), e = Math.min(1, Math.max(0, (0.64 - f) / 0.2)), k = e * e * (3 - 2 * e); c.copy(MIDSKIN).lerp(RIMSKIN, k); mc.set([c.r, c.g, c.b, 0.38 + 0.58 * k], i * 4); }
    mg.setAttribute('color', new T.BufferAttribute(mc, 4)); g.add(new T.Mesh(mg, skinM));
    // the veins: fanning up from the neck over the sac and its lobes, each forking once or twice, thinning out (none crossing)
    const run = (y0, y1, a0, a1, wig, r) => { const pts = []; for (let i = 0; i <= 12; i++) { const t = i / 12; pts.push(skinPt(y0 + (y1 - y0) * t, a0 + (a1 - a0) * t + wig * Math.sin(t * 7 + a0 * 3), 0.002)); } g.add(vein(pts, r)); };
    for (const [a0, len, side] of [[-0.95, 0.4, 1], [-0.25, 0.46, -1], [0.45, 0.48, 1], [1.15, 0.44, -1], [1.85, 0.38, 1], [2.7, 0.36, -1], [-1.9, 0.36, 1]]) {
      const a1 = a0 + 0.12 * side, y1 = 0.085 + len; run(0.085, y1, a0, a1, 0.07, 0.0105);
      for (const [t, dir, bl] of [[0.38, side, 0.16], [0.62, -side, 0.12]]) { const ya = 0.085 + len * t, aa = a0 + (a1 - a0) * t + 0.07 * Math.sin(t * 7 + a0 * 3); run(ya, Math.min(Y1 - 0.06, ya + bl), aa, aa + dir * 0.42, 0.03, 0.0062); }
    }
    // the membrane gathered into the collar: a fleshy lip over its top
    const lip = torus(0.088, 0.016, lipM, 40); lip.rotation.x = PI / 2; g.add(at(lip, 0, YC + 0.05, 0));
    // THE COLLAR: a steel band round the neck in two halves, an ear at either side bolted through by a small clamp screw
    g.add(at(cyl(0.098, 0.098, 0.085, steelM, 36), 0, YC, 0));
    for (const y of [YC + 0.042, YC - 0.042]) { const b = torus(0.098, 0.011, steelM, 36); b.rotation.x = PI / 2; g.add(at(b, 0, y, 0)); }
    g.add(at(cyl(0.101, 0.101, 0.03, steelDk, 36), 0, YC, 0));
    for (const s of [-1, 1]) {
      for (const z of [-0.016, 0.016]) g.add(at(cbox(0.06, 0.062, 0.024, 0.007, steelM), s * 0.122, YC, z));
      const sc = cyl(0.009, 0.009, 0.08, screwM, 10); sc.rotation.x = PI / 2; g.add(at(sc, s * 0.13, YC, 0));
      const hd = cyl(0.019, 0.019, 0.013, screwM, 6); hd.rotation.x = PI / 2; g.add(at(hd, s * 0.13, YC, 0.034));
      const nut = cyl(0.016, 0.016, 0.012, steelDk, 6); nut.rotation.x = PI / 2; g.add(at(nut, s * 0.13, YC, -0.033));
    }
    // THE NOZZLE: a steel cone off the collar, a hex nut, and the needle
    g.add(at(cyl(0.085, 0.045, 0.06, steelM, 32), 0, YC - 0.08, 0));
    g.add(at(cyl(0.046, 0.046, 0.032, steelDk, 6), 0, YC - 0.125, 0));
    g.add(at(cyl(0.019, 0.014, 0.08, steelM, 16), 0, YC - 0.18, 0));
    g.add(at(cyl(0.014, 0.003, 0.04, screwM, 16), 0, YC - 0.24, 0));
    // the drop forming at its tip: a fat teardrop hanging off the point, its core nudged toward you; and one already falling below it
    const tip = V(0, YC - 0.255, 0);
    const drop = (r, h, mat, push) => { const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new T.Vector2(Math.max(0.0005, r * Math.sin(PI * Math.pow(t, 1.6))), -h * t)); }
      const m = new T.Mesh(new T.LatheGeometry(pts, 24), mat); m.position.copy(tip).addScaledVector(CAM, push); return m; };
    g.add(drop(0.036, 0.1, tox, 0)); g.add(drop(0.022, 0.072, toxHot, 0.014)); g.add(drop(0.01, 0.042, toxCore, 0.024));
    const fall = (r, mat, push) => { const m = sphere(r, mat, 16); m.scale.set(1, 1.25, 1); return at(m, tip.x + CAM.x * push, tip.y - 0.17 + CAM.y * push, tip.z + CAM.z * push); };
    g.add(fall(0.017, tox, 0)); g.add(fall(0.009, toxHot, 0.01));
    // MOTES of venom rising off the sac
    for (const [x, y, z, r, k] of [[0.17, 0.66, 0.06, 0.012, 1], [-0.24, 0.66, 0.1, 0.01, 2], [-0.03, 0.72, 0.05, 0.009, 0], [0.24, 0.74, -0.02, 0.008, 2], [-0.15, 0.78, 0.04, 0.007, 1], [0.07, 0.81, 0.02, 0.006, 0]])
      g.add(at(sphere(r, k === 2 ? toxHot : k === 1 ? tox : toxDim, 8), x, y, z));
    return { g };
  } };
})();
