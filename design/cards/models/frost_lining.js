// FROST LINING (Pack 1, ice, Unrefined: +5% defense): a quilted thermal shoulder guard: a curved pad of dark navy satin, wrapped round the arm and rolling back over the top like a shoulder's cap, padded and
// diamond-quilted into puffy cells, its stitching glowing a cold blue; piping round its rim, a pale fleece lining showing at its edges; the rim crusted with small faceted frost crystals and a row of short
// icicles hanging off its flared lower edge, a leather strap with a steel buckle over its crown, and snow motes drifting round it. The ice family's first piece, the counterpart of EMBER PLATING.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const satin = std('#16214a', 0.12, 0.42, { side: T.DoubleSide }), fleece = std('#bcd2e4', 0.0, 0.85, { side: T.DoubleSide }), piping = std('#5f7296', 0.4, 0.36);
  const leather = std('#5c3f2b', 0.05, 0.68, { side: T.DoubleSide }), buckleM = std('#c3cbd6', 0.95, 0.22);
  satin.envMapIntensity = 0.7;
  const ice = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.05, roughness: 0.1, flatShading: true, transparent: true, opacity: 0.86 }); ice.color = STY.col('#cdeeff'); ice.emissive = STY.col('#3584bb'); ice.emissiveIntensity = 0.5; ice.envMapIntensity = 1.5;
  const frost = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.3, flatShading: true }); frost.color = STY.col('#e4f5ff'); frost.emissive = STY.col('#4f9fd4'); frost.emissiveIntensity = 0.35; frost.envMapIntensity = 1.2;
  const glowB = STY.glow('#99ddff', 1.2), glowHot = STY.glow('#e6f7ff', 1.5), glowDim = STY.glow('#4aa8d8', 0.9);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const UP = new T.Vector3(0, 1, 0);
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // THE PAD'S SHAPE: a panel wrapped round a vertical axis (radius RC, spanning +-PHI), standing straight in its lower part and rolling back over the top (bend radius RHO, through BEND radians) like a
  // shoulder's cap; its top corners rounded off (the span narrows toward the top edge), its lower edge flared out. u in [-1, 1] across, v in [0, 1] from the top edge down to the lower edge.
  const RC = 0.6, PHI = 0.58, RHO = 0.25, LS = 0.48, BEND = 1.45, LT = LS + RHO * BEND;
  const prof = s => s <= LS ? [s, 0] : [LS + RHO * Math.sin((s - LS) / RHO), RHO * (1 - Math.cos((s - LS) / RHO))];   // [height, inset toward the axis] at arc length s up from the lower edge
  const span = v => PHI * (v < 0.32 ? 0.52 + 0.48 * Math.sqrt(1 - Math.pow((0.32 - v) / 0.32, 2)) : 1);
  const flare = v => 1 + 0.12 * Math.pow(Math.max(0, (v - 0.72) / 0.28), 2);
  const rad = v => (RC - prof((1 - v) * LT)[1]) * flare(v);
  const base = (u, v) => { const h = prof((1 - v) * LT)[0], r = rad(v), ph = u * span(v); return new T.Vector3(r * Math.sin(ph), h - 0.36, r * Math.cos(ph) - RC * 0.9); };
  const nrm = (u, v) => { const e = 1e-3, p = base(u, v), pu = base(u + e, v).sub(p), pv = base(u, v + e).sub(p); return pv.cross(pu).normalize(); };
  // the quilting: diamond cells laid out by arc length across (X) and down (Y), so they keep their size where the pad narrows
  const CX = 0.17, CY = 0.15;
  const puff = (u, v) => { const X = u * span(v) * rad(v), Y = v * LT, p = X / CX + Y / CY, q = X / CX - Y / CY, e = Math.min(1, (1 - Math.abs(u)) / 0.07, v / 0.06, (1 - v) / 0.05);
    return Math.pow(Math.abs(Math.sin(PI * p) * Math.sin(PI * q)), 0.55) * Math.max(0, e); };
  // a grid surface over (u, v), pushed along the normal by f(u, v)
  function surface(f, mat, NU, NV) {
    const pos = [], idx = [];
    for (let j = 0; j <= NV; j++) for (let i = 0; i <= NU; i++) { const u = -1 + 2 * i / NU, v = j / NV, p = base(u, v).addScaledVector(nrm(u, v), f(u, v)); pos.push(p.x, p.y, p.z); }
    for (let j = 0; j < NV; j++) for (let i = 0; i < NU; i++) { const a = j * (NU + 1) + i, b = a + 1, c = a + NU + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); return new T.Mesh(geo, mat);
  }

  ITEMS.frost_lining = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), R = rng(5), P = G(); g.add(P);
    const PUFF = 0.034, TK = 0.05;
    P.add(surface((u, v) => PUFF * puff(u, v), satin, 110, 110));
    P.add(surface(() => -TK, fleece, 40, 40));
    // THE STITCHING: the quilt's seam lines, a thin cold glow sunk in each groove
    const seam = (k, sgn) => { let run = []; const runs = [];
      for (let j = 0; j <= 140; j++) { const v = j / 140, X = (k - sgn * v * LT / CY) * CX, u = X / (span(v) * rad(v));
        if (Math.abs(u) < 0.95 && v > 0.04 && v < 0.97) run.push(base(u, v).addScaledVector(nrm(u, v), 0.003)); else if (run.length) { runs.push(run); run = []; } }
      if (run.length) runs.push(run); return runs; };
    for (let k = -9; k <= 9; k++) for (const sgn of [1, -1]) seam(k, sgn).forEach(run => { if (run.length > 2) P.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(run), run.length * 2, 0.0042, 6, false), glowDim)); });
    // THE PIPING round its rim (mid-way through its thickness)
    const loop = [], edge = [];
    const pushE = (u, v, out) => { loop.push(base(u, v).addScaledVector(nrm(u, v), -TK / 2)); edge.push({ u, v, out }); };
    for (let i = 0; i < 16; i++) pushE(-1 + 2 * i / 16, 0, 'top');
    for (let i = 0; i < 18; i++) pushE(1, i / 18, 'right');
    for (let i = 0; i < 16; i++) pushE(1 - 2 * i / 16, 1, 'bottom');
    for (let i = 0; i < 18; i++) pushE(-1, 1 - i / 18, 'left');
    const rim = new T.CatmullRomCurve3(loop, true);
    P.add(new T.Mesh(new T.TubeGeometry(rim, 260, 0.032, 10, true), piping));
    // FROST CRUST along the rim: small faceted crystals packed on the piping, leaning out of the pad's face, thickest on the crown edge and the lower corners
    const cryst = (p, dir, r, mat) => { const m = new T.Mesh(new T.OctahedronGeometry(1, 0), mat); m.scale.set(r, r * (1.5 + R() * 1.2), r * (0.8 + R() * 0.4)); m.quaternion.setFromUnitVectors(UP, dir); m.rotateY(R() * PI); m.position.copy(p).addScaledVector(dir, r * 0.6); return m; };
    for (let i = 0; i < 300; i++) {
      const t = R(), p = rim.getPointAt(t), e = edge[Math.min(edge.length - 1, Math.floor(t * edge.length))], n = nrm(e.u, e.v);
      const e2 = 1e-3, out = e.out === 'top' ? base(e.u, e.v).sub(base(e.u, e.v + e2)) : e.out === 'bottom' ? base(e.u, e.v).sub(base(e.u, e.v - e2)) : e.out === 'right' ? base(e.u, e.v).sub(base(e.u - e2, e.v)) : base(e.u, e.v).sub(base(e.u + e2, e.v));
      out.normalize(); const corner = (Math.abs(e.u) > 0.7 && e.v > 0.75) || e.v < 0.12;
      if (!(e.out === 'top' || corner) && R() < 0.55) continue;
      const dir = n.clone().multiplyScalar(0.75).addScaledVector(out, 0.55).add(new T.Vector3((R() - 0.5) * 0.35, (R() - 0.5) * 0.35, (R() - 0.5) * 0.35)).normalize();
      P.add(cryst(p.clone().addScaledVector(n, 0.024).addScaledVector(out, (R() - 0.4) * 0.016), dir, 0.007 + R() * 0.012, R() < 0.55 ? ice : frost));
    }
    // ICICLES hanging off the lower edge, longest in the middle, each with a faint cold light inside
    const NI = 9;
    for (let i = 0; i < NI; i++) {
      const u = -0.86 + 1.72 * i / (NI - 1) + (R() - 0.5) * 0.06, p = base(u, 1).addScaledVector(nrm(u, 1), -TK / 2), L = 0.07 + 0.13 * (1 - Math.abs(u)) * (0.65 + R() * 0.5), r = 0.016 + R() * 0.008;
      const c = new T.Mesh(new T.ConeGeometry(r, L, 6, 1), ice); c.rotation.x = PI; c.rotation.y = R() * PI; P.add(at(c, p.x, p.y - L / 2 - 0.014, p.z));
      const k = new T.Mesh(new T.ConeGeometry(r * 0.35, L * 0.7, 5, 1), glowB); k.rotation.x = PI; P.add(at(k, p.x, p.y - L * 0.35 - 0.016, p.z));
      if (i % 3 === 1) P.add(at(sphere(0.006, glowHot, 8), p.x, p.y - L - 0.032, p.z));
    }
    // THE STRAP: a leather strap up the pad's face, over its crown edge and away behind it, a steel buckle on it
    { const us = -0.42, c0 = base(us, 0), n0 = nrm(us, 0), knots = [];
      for (let j = 0; j <= 6; j++) { const v = 0.42 - 0.42 * j / 6; knots.push(base(us, v).addScaledVector(nrm(us, v), PUFF * 0.6 + 0.012)); }
      knots.push(c0.clone().addScaledVector(n0, -0.03).add(new T.Vector3(0, 0.01, -0.07)), c0.clone().add(new T.Vector3(0.0, -0.08, -0.15)));
      const sc = new T.CatmullRomCurve3(knots), sp = []; for (let j = 0; j <= 40; j++) sp.push(sc.getPointAt(j / 40));
      // a flat band swept along the run: four faces, hard-edged, smooth along its length, capped at both ends
      const frame = t => { const yAx = sc.getTangentAt(t).normalize(), xAx = new T.Vector3(1, 0, 0).addScaledVector(yAx, -yAx.x).normalize(); return [xAx, yAx, new T.Vector3().crossVectors(xAx, yAx)]; };
      const W2 = 0.0425, T2 = 0.008, C = [[-1, 1], [1, 1], [1, -1], [-1, -1]], pos = [], idx = [], ring = [];
      sp.forEach((p, i) => { const [xA, , zA] = frame(i / 40), cs = C.map(([a, b]) => p.clone().addScaledVector(xA, a * W2).addScaledVector(zA, b * T2)); ring.push(cs);
        for (let k = 0; k < 4; k++) { const q0 = cs[k], q1 = cs[(k + 1) % 4]; pos.push(q0.x, q0.y, q0.z, q1.x, q1.y, q1.z); } });
      for (let i = 0; i < sp.length - 1; i++) for (let k = 0; k < 4; k++) { const a = i * 8 + k * 2, b = a + 1, c = a + 8, d = b + 8; idx.push(a, b, d, a, d, c); }
      for (const cs of [ring[0], ring[ring.length - 1]]) { const o = pos.length / 3; cs.forEach(q => pos.push(q.x, q.y, q.z)); idx.push(o, o + 1, o + 2, o, o + 2, o + 3); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); P.add(new T.Mesh(geo, leather));
      // the buckle, a third of the way up
      const [xA, yA, zA] = frame(0.3), bk = G(); bk.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(xA, yA, zA)); bk.position.copy(sc.getPointAt(0.3)).addScaledVector(zA, 0.012);
      bk.add(cbox(0.115, 0.08, 0.016, 0.006, buckleM)); bk.add(at(cbox(0.075, 0.042, 0.02, 0.004, leather), 0, 0, 0.001)); bk.add(at(cbox(0.012, 0.05, 0.012, 0.003, buckleM), 0, 0, 0.012)); P.add(bk); }
    // SNOW MOTES drifting round it
    const motes = [[0.06, 0.5, 0.0, 0.012, 2], [-0.22, 0.46, -0.02, 0.01, 1], [0.26, 0.43, 0.02, 0.01, 0], [-0.46, 0.16, 0.06, 0.009, 2], [0.46, 0.08, 0.1, 0.008, 1], [-0.1, -0.66, 0.22, 0.01, 2],
                   [0.14, -0.63, 0.22, 0.008, 1], [-0.32, -0.58, 0.2, 0.007, 0], [0.34, -0.56, 0.18, 0.007, 2], [0.02, -0.72, 0.2, 0.006, 0]];
    motes.forEach(([x, y, z, r, k]) => g.add(at(sphere(r, k === 2 ? glowHot : k === 1 ? glowB : glowDim, 8), x, y, z)));
    P.rotation.set(0.04, 0, 0);
    return { g };
  } };
})();
