// VENOM GLAND (Pack 1, toxic, Unrefined: +5% special attack): a translucent pear-shaped gland sac, lumpy, leaning, its tip curling over, its venom glowing green through the membrane (bright where it faces you,
// deeper toward its sides, a few bubbles in it) and dark veins branching over it from its neck; the neck gathered into a steel collar of two halves, bolted at either side by a small clamp screw; below the
// collar a short steel nozzle and a needle pointing down, a drop of venom forming at its tip and one falling; a few motes of venom rising off it. Unrefined: the simplest of the toxic items.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const steelM = std('#a7b0bb', 0.9, 0.26), steelDk = std('#5d6570', 0.85, 0.32), screwM = std('#c3cbd6', 0.9, 0.22), veinM = std('#1d3d22', 0.1, 0.36), lipM = std('#5f8a4c', 0.05, 0.4);
  const membraneM = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, transparent: true, depthWrite: false, metalness: 0, roughness: 0.3 }); membraneM.envMapIntensity = 0.55;
  const fluidM = new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false });
  const tox = STY.glow('#66ff66', 1.3), toxHot = STY.glow('#b6ff9a', 1.5), toxDim = STY.glow('#2fae4a', 1.1), toxCore = STY.glow('#eaffd8', 1.6);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const AZ = 0.55, EL = 0.32, CAM = V(Math.cos(EL) * Math.sin(AZ), Math.sin(EL), Math.cos(EL) * Math.cos(AZ));   // toward the hero camera (for the membrane's sheen and the venom's glow)
  // THE SAC: a pear on its narrow end (radius, height), its neck at SY, in the collar; lumpy, its tip curling over to one side, and gathered in folds where the collar pinches it
  const SY = 0.02, H = 0.615;
  const PROF = [[0.07, 0], [0.085, 0.03], [0.14, 0.1], [0.225, 0.2], [0.275, 0.32], [0.285, 0.42], [0.255, 0.51], [0.17, 0.585], [0.0, H]];
  const PTS = new T.CatmullRomCurve3(PROF.map(([r, y]) => V(r, y, 0)), false, 'centripetal').getPoints(64).map(p => new T.Vector2(Math.max(0.0005, p.x), p.y));
  const rAt = y => { for (let i = 1; i < PTS.length; i++) if (PTS[i].y >= y) { const t = (y - PTS[i - 1].y) / Math.max(1e-6, PTS[i].y - PTS[i - 1].y); return PTS[i - 1].x + (PTS[i].x - PTS[i - 1].x) * t; } return 0; };
  const shape = (a, s) => { const w = Math.pow(Math.max(0, 1 - s / 0.22), 2); return (1 + 0.07 * Math.sin(2 * a + 0.9) * Math.sin(PI * s) + 0.035 * Math.sin(3 * a - 2 * s * PI) * s) * (1 + 0.09 * w * Math.sin(11 * a)); };
  const place = (r, a, y) => { const s = y / H, tip = Math.pow(Math.max(0, (s - 0.6) / 0.4), 2); return V(Math.sin(a) * r + 0.06 * s * s + 0.07 * tip, y + SY - 0.02 * tip, Math.cos(a) * r * 0.9 - 0.02 * s * s); };
  function sac(k) {
    const geo = new T.LatheGeometry(PTS.map(p => new T.Vector2(Math.max(0.0005, p.x * k), p.y)), 96), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), a = Math.atan2(x, z), q = place(Math.hypot(x, z) * shape(a, y / H), a, y); p.setXYZ(i, q.x, q.y, q.z); }
    geo.computeVertexNormals(); return geo;
  }
  const onSac = (y, a, out) => place(rAt(y) * shape(a, y / H) + (out || 0), a, y);   // a point on (or off) the sac at height y (0..H) and azimuth a (0 = front, toward +x)
  const LEAN = 0.22, CAML = CAM.clone().applyAxisAngle(V(0, 0, 1), -LEAN);   // (the gland is built upright, then leant: the camera as the upright gland sees it)
  const facing = (n, i) => n.getX(i) * CAML.x + n.getY(i) * CAML.y + n.getZ(i) * CAML.z;
  // a vein: a tapered tube along points, thick at its root
  function vein(pts, r) {
    const curve = new T.CatmullRomCurve3(pts), TS = 40, RS = 6, geo = new T.TubeGeometry(curve, TS, r, RS, false), p = geo.attributes.position, c = V(0, 0, 0), v = V(0, 0, 0);
    for (let i = 0; i <= TS; i++) { c.set(0, 0, 0); for (let j = 0; j < RS; j++) c.add(v.fromBufferAttribute(p, i * (RS + 1) + j)); c.multiplyScalar(1 / RS); const k = 1 - 0.92 * Math.pow(i / TS, 1.3);
      for (let j = 0; j <= RS; j++) { const n = i * (RS + 1) + j; v.fromBufferAttribute(p, n).sub(c).multiplyScalar(k).add(c); p.setXYZ(n, v.x, v.y, v.z); } }
    geo.computeVertexNormals(); return new T.Mesh(geo, veinM);
  }

  ITEMS.venom_gland = { exposure: 1.0, az: AZ, el: EL, build() {
    const g = G(), S = G(); g.add(S); S.rotation.z = LEAN;   // the gland leans: its top to the left, its needle down to the right
    // the venom: bright where it faces you, a deeper green toward its sides
    const fg = sac(0.95), fp = fg.attributes.position, fn = fg.attributes.normal, fc = new Float32Array(fp.count * 3), c = new T.Color();
    const DIM = STY.col('#145c29'), MID = STY.col('#4fe85a').multiplyScalar(1.1), BRIGHT = STY.col('#c8ffb0').multiplyScalar(1.25);
    for (let i = 0; i < fp.count; i++) { const t = Math.pow(Math.max(0, facing(fn, i)), 1.3); if (t < 0.65) c.copy(DIM).lerp(MID, t / 0.65); else c.copy(MID).lerp(BRIGHT, (t - 0.65) / 0.35); fc.set([c.r, c.g, c.b], i * 3); }
    fg.setAttribute('color', new T.BufferAttribute(fc, 3)); S.add(new T.Mesh(fg, fluidM));
    // the membrane: clear where it faces you, cloudier toward its rim
    const mg = sac(1), mn = mg.attributes.normal, mc = new Float32Array(mn.count * 4), CLEAR = STY.col('#a6e690'), SKIN = STY.col('#2f7d30');
    for (let i = 0; i < mn.count; i++) { const e = Math.pow(1 - Math.abs(facing(mn, i)), 2); c.copy(CLEAR).lerp(SKIN, Math.min(1, e * 1.4)); mc.set([c.r, c.g, c.b, 0.08 + 0.66 * Math.pow(e, 0.9)], i * 4); }
    mg.setAttribute('color', new T.BufferAttribute(mc, 4)); S.add(new T.Mesh(mg, membraneM));
    // bubbles in the venom (just under the membrane, on the side toward you)
    for (const [y, a, r] of [[0.2, 0.55, 0.015], [0.3, 0.25, 0.011], [0.37, 0.75, 0.013], [0.45, 0.45, 0.009], [0.15, 0.95, 0.009]]) S.add(at(sphere(r, toxCore, 10), ...onSac(y, a, -0.05 * rAt(y) - r * 0.2).toArray()));
    // the veins: up from the neck over the sac, branching as they climb, thinning out
    let seed = 11; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    const grow = (y, a, len, drift, r, depth) => {
      const pts = [onSac(y, a, 0.002)], n = Math.max(3, Math.round(len / 0.03));
      for (let i = 1; i <= n && y < H - 0.06; i++) {
        y += 0.028 * (0.8 + 0.4 * rnd()); a += drift * (0.6 + 0.8 * rnd()) / Math.max(0.08, rAt(y)) * 0.02 + (rnd() - 0.5) * 0.05; pts.push(onSac(y, a, 0.002));
        if (depth < 1 && i > 1 && i < n - 1 && rnd() < 0.3) grow(y, a, len * 0.45, (rnd() < 0.5 ? -1 : 1) * (1.4 + rnd()), r * 0.62, depth + 1);
      }
      if (pts.length > 2) S.add(vein(pts, r));
    };
    for (const [a, drift, len] of [[-0.55, -0.6, 0.5], [0.18, 0.3, 0.55], [0.85, 0.7, 0.52], [1.6, 0.4, 0.45], [-1.3, -0.5, 0.45], [2.6, 0.5, 0.45], [-2.3, -0.4, 0.4]]) grow(0.05, a, len, drift, 0.011, 0);
    // the membrane gathered into the collar: a fleshy lip over its top
    const lip = torus(0.09, 0.016, lipM, 40); lip.rotation.x = PI / 2; S.add(at(lip, 0, SY + 0.05, 0));
    // THE COLLAR: a steel band round the neck in two halves, an ear at either side bolted through by a small clamp screw
    S.add(at(cyl(0.098, 0.098, 0.085, steelM, 36), 0, SY + 0.005, 0));
    for (const y of [SY + 0.047, SY - 0.037]) { const b = torus(0.098, 0.011, steelM, 36); b.rotation.x = PI / 2; S.add(at(b, 0, y, 0)); }
    S.add(at(cyl(0.101, 0.101, 0.03, steelDk, 36), 0, SY + 0.005, 0));
    for (const s of [-1, 1]) {
      for (const z of [-0.016, 0.016]) S.add(at(cbox(0.06, 0.062, 0.024, 0.007, steelM), s * 0.122, SY + 0.005, z));
      const sc = cyl(0.009, 0.009, 0.08, screwM, 10); sc.rotation.x = PI / 2; S.add(at(sc, s * 0.13, SY + 0.005, 0));
      const hd = cyl(0.019, 0.019, 0.013, screwM, 6); hd.rotation.x = PI / 2; S.add(at(hd, s * 0.13, SY + 0.005, 0.034));
      const nut = cyl(0.016, 0.016, 0.012, steelDk, 6); nut.rotation.x = PI / 2; S.add(at(nut, s * 0.13, SY + 0.005, -0.033));
    }
    // THE NOZZLE: a steel cone off the collar, a hex nut, and the needle
    S.add(at(cyl(0.085, 0.045, 0.06, steelM, 32), 0, SY - 0.075, 0));
    S.add(at(cyl(0.046, 0.046, 0.032, steelDk, 6), 0, SY - 0.12, 0));
    S.add(at(cyl(0.019, 0.014, 0.08, steelM, 16), 0, SY - 0.175, 0));
    S.add(at(cyl(0.014, 0.003, 0.04, screwM, 16), 0, SY - 0.235, 0));
    // the drop forming at its tip: a fat teardrop hanging straight down off the point, its core nudged toward you
    g.updateMatrixWorld(true); const tip = V(0, SY - 0.25, 0).applyMatrix4(S.matrixWorld);
    const drop = (r, h, mat, push) => { const pts = []; for (let i = 0; i <= 20; i++) { const t = i / 20; pts.push(new T.Vector2(Math.max(0.0005, r * Math.sin(PI * Math.pow(t, 1.6))), -h * t)); }
      const m = new T.Mesh(new T.LatheGeometry(pts, 24), mat); m.position.copy(tip).addScaledVector(CAM, push); return m; };
    g.add(drop(0.036, 0.1, tox, 0)); g.add(drop(0.022, 0.072, toxHot, 0.014)); g.add(drop(0.01, 0.042, toxCore, 0.024));
    // and one already falling below it
    const fall = (r, mat, push) => { const m = sphere(r, mat, 16); m.scale.set(1, 1.25, 1); return at(m, tip.x + CAM.x * push, tip.y - 0.17 + CAM.y * push, tip.z + CAM.z * push); };
    g.add(fall(0.017, tox, 0)); g.add(fall(0.009, toxHot, 0.01));
    // MOTES of venom rising off the sac
    for (const [x, y, z, r, k] of [[0.12, 0.62, 0.08, 0.013, 1], [-0.32, 0.6, 0.1, 0.011, 2], [-0.06, 0.7, 0.06, 0.01, 0], [0.18, 0.72, 0.0, 0.008, 2], [-0.22, 0.76, 0.05, 0.007, 1], [0.04, 0.8, 0.03, 0.006, 0]])
      g.add(at(sphere(r, k === 2 ? toxHot : k === 1 ? tox : toxDim, 8), x, y, z));
    return { g };
  } };
})();
