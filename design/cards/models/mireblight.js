// MIREBLIGHT (Pack 1, toxic, Precision: 15% per hit to poison, which weakens): a lump of bog iron (rusty, pitted stone), a rusted pipe stub and a broken iron cog sunk in it, overgrown with blight: moss
// over its top and a cluster of five bulbous fungal spore pods on pale stalks: dark, wet, lobed caps with a glowing green gill down every groove and glowing spots; two of them burst, their tops peeled back into
// petals (glowing inside) round a glowing spore mass, and spore motes rising off them; glowing veins creeping down the stone, slime pooled among the stalks and dripping off the stone's lip. Precision: the
// most worked of the toxic items, its poison shown.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const stoneM = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.12, roughness: 0.55, vertexColors: true }); stoneM.envMapIntensity = 0.85;
  const capM = std('#3b3350', 0.25, 0.3), stalkM = std('#a3ad7c', 0.05, 0.5), rustM = std('#8a4a26', 0.45, 0.72), rustDk = std('#4a2a18', 0.4, 0.8), ironM = std('#5a5048', 0.75, 0.42), mossM = std('#3d5a2c', 0.05, 0.85);
  const tox = STY.glow('#66ff66', 1.3), toxHot = STY.glow('#b6ff9a', 1.5), toxDim = STY.glow('#2fae4a', 1.1), toxCore = STY.glow('#eaffd8', 1.6);
  const inner = new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, toneMapped: false });   // the inside of a burst pod's petals (glowing toward the spore mass, darker toward their tips)
  const slimeM = new T.MeshStandardMaterial({ color: STY.col('#2a8a35'), emissive: STY.col('#16702a'), metalness: 0, roughness: 0.2 }); slimeM.envMapIntensity = 0.8;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z), UP = V(0, 1, 0);
  const AZ = 0.55, EL = 0.33, CAM = V(Math.cos(EL) * Math.sin(AZ), Math.sin(EL), Math.cos(EL) * Math.cos(AZ));
  let seed = 3; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // THE STONE: a lump of bog iron, flattened, pitted, rust-brown, its top mossy and its foot in shadow (vertex colours)
  const SX = 0.4, SYc = 0.25, SZ = 0.33;
  const bump = d => 1 + 0.14 * Math.sin(3.1 * d.x + 1.7) * Math.sin(2.3 * d.z + 0.4) + 0.08 * Math.sin(5.3 * d.y + 2.1 * d.x) + 0.06 * Math.sin(7 * d.z - 3 * d.y + 1) + 0.05 * Math.sin(11 * d.x + 4 * d.z) - 0.03 * Math.pow(Math.abs(Math.sin(23 * d.x + 2) * Math.sin(19 * d.y - 1) * Math.sin(21 * d.z + 3)), 0.5);
  const stonePt = d => { const n = d.clone().normalize(), k = bump(n); return V(n.x * k * SX, n.y * k * SYc, n.z * k * SZ); };
  // a tapered tube along points (thick at its start), and a bead at its end if asked
  function taper(pts, r, mat, k1, bead) {
    const curve = new T.CatmullRomCurve3(pts), TS = 32, RS = 10, geo = new T.TubeGeometry(curve, TS, r, RS, false), p = geo.attributes.position, c = V(0, 0, 0), v = V(0, 0, 0);
    for (let i = 0; i <= TS; i++) { c.set(0, 0, 0); for (let j = 0; j < RS; j++) c.add(v.fromBufferAttribute(p, i * (RS + 1) + j)); c.multiplyScalar(1 / RS); const k = 1 - (1 - k1) * i / TS;
      for (let j = 0; j <= RS; j++) { const n = i * (RS + 1) + j; v.fromBufferAttribute(p, n).sub(c).multiplyScalar(k).add(c); p.setXYZ(n, v.x, v.y, v.z); } }
    geo.computeVertexNormals(); const g = G(); g.add(new T.Mesh(geo, mat));
    if (bead) { const e = curve.getPoint(1), b = sphere(r * k1 * 1.5, bead, 12); b.scale.set(1, 1.3, 1); g.add(at(b, e.x, e.y - r * 0.3, e.z)); }
    return g;
  }
  // A SPORE POD, built up its own +y: a stalk, then a bulb of N lobes (profile radius R, height HB) with a glowing gill down each groove and glowing spots; `burst` peels the bulb's top back into petals
  // (dark outside, glowing inside) round a glowing spore mass. Returns the group and, for a burst pod, where its spores leave.
  const BULB = [[0.34, 0], [0.75, 0.1], [0.97, 0.28], [1.0, 0.45], [0.86, 0.66], [0.52, 0.86], [0.16, 0.97], [0, 1]];
  const BP = new T.CatmullRomCurve3(BULB.map(([r, y]) => V(r, y, 0)), false, 'centripetal').getPoints(40);
  const bulbR = s => { for (let i = 1; i < BP.length; i++) if (BP[i].y >= s) { const t = (s - BP[i - 1].y) / Math.max(1e-6, BP[i].y - BP[i - 1].y); return BP[i - 1].x + (BP[i].x - BP[i - 1].x) * t; } return 0; };
  function pod(stalkH, R, HB, N, burst, twist) {
    const P = G(), y0 = stalkH, gw = 0.2, D = 0.13, S0 = 0.5;
    // the stalk: tapered, a little bowed
    P.add(taper([V(0, -0.04, 0), V(0.01, stalkH * 0.4, 0.005), V(-0.005, stalkH * 0.8, 0), V(0, stalkH + 0.02, 0)], R * 0.42, stalkM, 0.62));
    // the lobes: each a patch of the bulb between two grooves; a groove sinks the bulb by D
    const IN0 = STY.col('#b6ff9a').multiplyScalar(1.3), IN1 = STY.col('#1f6b2c');
    const lobe = (k) => {
      const a0 = twist + k * TAU / N, a1 = a0 + TAU / N, am = (a0 + a1) / 2, nu = 30, nv = 14, pos = [], col = [], idx = [];
      for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
        const s = i / nu, v = j / nv, tp = burst && s > S0 ? (s - S0) / (1 - S0) : 0, a = am + (a0 + (a1 - a0) * v - am) * (1 - 0.8 * Math.pow(tp, 0.8)) * (burst ? 0.94 : 1);
        const ed = Math.min(v, 1 - v) * (a1 - a0), f = 1 - D * Math.exp(-(ed * ed) / (gw * gw * 0.5)), r = bulbR(s) * R * f;
        let p = V(Math.sin(a) * r, y0 + s * HB, Math.cos(a) * r);
        if (tp > 0) {   // peel back: rotate about the horizontal tangent at the split, more toward the tip
          const rh = bulbR(S0) * R * f, h = V(Math.sin(a) * rh, y0 + S0 * HB, Math.cos(a) * rh), d = V(Math.sin(am), 0, Math.cos(am)), ax = UP.clone().cross(d).normalize();
          p = p.sub(h).applyAxisAngle(ax, burst * Math.pow(tp, 0.85)).add(h);
        }
        pos.push(p.x, p.y, p.z); const cc = IN0.clone().lerp(IN1, Math.min(1, Math.max(0, (s - S0 * 0.6) / (1 - S0 * 0.6)) * 1.1)); col.push(cc.r, cc.g, cc.b);
      }
      for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + 1, c = a + nu + 1, d = c + 1; idx.push(a, c, b, b, c, d); }
      const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
      P.add(new T.Mesh(geo, capM)); if (burst) P.add(new T.Mesh(geo, inner));
    };
    for (let k = 0; k < N; k++) lobe(k);
    // the gills: a glowing line down each groove (on a burst pod, only below the split)
    for (let k = 0; k < N; k++) {
      const a = twist + k * TAU / N, pts = [], sEnd = burst ? S0 : 0.93;
      for (let i = 0; i <= 12; i++) { const s = 0.05 + (sEnd - 0.05) * i / 12, r = bulbR(s) * R * (1 - D) + 0.002; pts.push(V(Math.sin(a) * r, y0 + s * HB, Math.cos(a) * r)); }
      P.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 24, 0.0065 + R * 0.025, 6, false), tox));
    }
    // glowing spots on the lobes
    if (!burst) for (let k = 0; k < N; k++) for (const [s, dv, rr] of [[0.62, 0.5, 0.05], [0.76, 0.35, 0.035], [0.45, 0.62, 0.04]]) {
      if (rnd() < 0.3) continue;
      const a = twist + (k + dv) * TAU / N, r = bulbR(s) * R + 0.002; P.add(at(sphere(rr * R * 1.6 + 0.003, toxHot, 8), Math.sin(a) * r, y0 + s * HB, Math.cos(a) * r));
    }
    let mouth = null;
    if (burst) {   // the spore mass in the open cup: a lumpy glowing ball, its hot core toward you
      const mg = new T.IcosahedronGeometry(R * 0.78, 2), mp = mg.attributes.position, v = V(0, 0, 0);
      for (let i = 0; i < mp.count; i++) { v.fromBufferAttribute(mp, i); const k = 1 + 0.12 * Math.sin(v.x * 60 + 1) * Math.sin(v.y * 50) * Math.sin(v.z * 55 + 2); mp.setXYZ(i, v.x * k, v.y * k, v.z * k); }
      mg.computeVertexNormals(); P.add(at(new T.Mesh(mg, tox), 0, y0 + S0 * HB + R * 0.22, 0));
      P.add(at(sphere(R * 0.56, toxHot, 16), CAM.x * R * 0.3, y0 + S0 * HB + R * 0.26 + CAM.y * R * 0.3, CAM.z * R * 0.3));
      P.add(at(sphere(R * 0.3, toxCore, 16), CAM.x * R * 0.6, y0 + S0 * HB + R * 0.3 + CAM.y * R * 0.6, CAM.z * R * 0.6));
      mouth = V(0, y0 + S0 * HB + R * 0.85, 0);
    }
    return { P, mouth };
  }

  ITEMS.mireblight = { exposure: 1.0, az: AZ, el: EL, build() {
    const g = G(); seed = 3;   // (the same scatter every bake)
    // the stone
    const sg = new T.SphereGeometry(1, 96, 64), sp = sg.attributes.position, scol = new Float32Array(sp.count * 3), c = new T.Color(), STONE = STY.col('#7a4a2e'), STONE2 = STY.col('#4a2e1e'), MOSS = STY.col('#3f5a2b');
    for (let i = 0; i < sp.count; i++) {
      const d = V(sp.getX(i), sp.getY(i), sp.getZ(i)).normalize(), q = stonePt(d); sp.setXYZ(i, q.x, q.y, q.z);
      const moss = Math.max(0, Math.min(1, (d.y - 0.15) * 2.2 + 0.25 * Math.sin(d.x * 9 + d.z * 7)));
      c.copy(STONE).lerp(STONE2, 0.5 + 0.5 * Math.sin(d.x * 17 + d.y * 11) * Math.sin(d.z * 13)).lerp(MOSS, moss).multiplyScalar(0.55 + 0.45 * Math.min(1, Math.max(0, d.y + 0.75))); scol.set([c.r, c.g, c.b], i * 3);
    }
    sg.setAttribute('color', new T.BufferAttribute(scol, 3)); sg.computeVertexNormals(); g.add(new T.Mesh(sg, stoneM));
    // the scrap sunk in it: a rusted pipe stub with its flange, out of the front-left; a broken cog in its right flank
    const pipe = G(); pipe.position.copy(stonePt(V(-0.75, 0.25, 0.6))); pipe.rotation.set(0.5, 0, 0.75); g.add(pipe);
    pipe.add(at(new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.16, 20, 1, true), rustM), 0, 0.03, 0));
    pipe.add(at(cyl(0.052, 0.052, 0.005, rustDk, 20), 0, 0.1, 0));
    pipe.add(at(new T.Mesh(new T.CylinderGeometry(0.055, 0.055, 0.15, 20, 1, true), new T.MeshStandardMaterial({ color: STY.col('#2a1a10'), side: T.BackSide, roughness: 0.9 })), 0, 0.03, 0));
    const fl = torus(0.068, 0.014, rustM, 24); fl.rotation.x = PI / 2; pipe.add(at(fl, 0, 0.105, 0));
    for (let i = 0; i < 4; i++) pipe.add(at(sphere(0.009, rustDk, 6), Math.sin(i * PI / 2 + 0.4) * 0.068, 0.12, Math.cos(i * PI / 2 + 0.4) * 0.068));
    const cog = gear(0.15, 0.06, 9, 0.035, ironM); const cg = G(); cg.position.copy(stonePt(V(0.9, 0.12, 0.3))); cg.rotation.set(0.1, AZ + 0.55, 0.45); cg.add(cog); g.add(cg);
    // moss tufts over the top
    for (let i = 0; i < 14; i++) { const d = V(rnd() * 2 - 1, 0.7 + rnd() * 0.5, rnd() * 2 - 1), p = stonePt(d), m = new T.Mesh(new T.IcosahedronGeometry(0.022 + rnd() * 0.022, 1), mossM); m.scale.set(1.4, 0.5, 1.2); g.add(at(m, p.x, p.y - 0.005, p.z)); }
    // THE PODS: (where on the stone, stalk height, bulb radius, bulb height, lobes, burst?, lean (x, z))
    const PODS = [[V(-0.05, 1, -0.2), 0.2, 0.15, 0.32, 5, 1.35, [-0.1, -0.06]], [V(-0.5, 1, 0.22), 0.1, 0.11, 0.24, 5, 0, [-0.38, 0.1]], [V(0.5, 1, -0.08), 0.12, 0.095, 0.2, 5, 0, [0.38, -0.05]],
                  [V(0.28, 1, 0.45), 0.05, 0.08, 0.16, 4, 1.5, [0.35, 0.3]], [V(-0.2, 1, 0.55), 0.02, 0.05, 0.1, 4, 0, [-0.1, 0.45]]];
    const mouths = [];
    PODS.forEach(([d, sh, R, HB, N, burst, [lx, lz]], i) => {
      const base = stonePt(d), { P, mouth } = pod(sh, R, HB, N, burst, i * 0.7 + 0.2);
      P.position.copy(base); P.quaternion.setFromUnitVectors(UP, V(lx, 1, lz).normalize()); g.add(P);
      if (mouth) { P.updateMatrixWorld(true); mouths.push([mouth.applyMatrix4(P.matrixWorld), R]); }
      // slime pooled round the stalk's foot
      const pool = sphere(R * 0.55, slimeM, 16); pool.scale.set(1.3, 0.2, 1.2); g.add(at(pool, base.x, base.y - 0.004, base.z));
    });
    // BLIGHT VEINS creeping over the stone from the pods' feet, down its sides
    for (const [x0, z0, x1, z1, e] of [[-0.5, 0.22, -0.95, 0.5, 0.75], [0.5, -0.08, 0.98, 0.35, 0.8], [0.28, 0.45, 0.65, 0.95, 0.7], [-0.2, 0.55, -0.5, 0.98, 0.6]]) {
      const pts = []; for (let i = 0; i <= 10; i++) { const t = i / 10, d = V(x0 + (x1 - x0) * t + 0.06 * Math.sin(t * 11 + x0 * 5), 1 - t * e, z0 + (z1 - z0) * t + 0.06 * Math.cos(t * 9 + z0 * 4)); pts.push(stonePt(d).multiplyScalar(1.012)); }
      g.add(taper(pts, 0.0065, toxDim, 0.3));
    }
    // SPORES rising off the burst pods: a loose plume of motes, smaller and fainter as they rise
    mouths.forEach(([m, R], j) => {
      const n = j ? 8 : 14;
      for (let i = 0; i < n; i++) {
        const t = i / n, y = m.y + 0.02 + t * (j ? 0.3 : 0.45), sw = 0.03 + t * (j ? 0.1 : 0.16), a = rnd() * TAU, r = (j ? 0.011 : 0.014) * (1 - t * 0.6);
        g.add(at(sphere(r, i < 2 ? toxCore : t < 0.35 ? toxHot : t < 0.7 ? tox : toxDim, 8), m.x + Math.sin(a) * sw, y, m.z + Math.cos(a) * sw * 0.7));
      }
    });
    // SLIME dripping off the stone's front lip
    for (const [dx, dz, len] of [[0.15, 0.95, 0.14], [-0.35, 0.9, 0.1], [0.55, 0.75, 0.08]]) {
      const top = stonePt(V(dx, -0.05, dz)), p0 = stonePt(V(dx, 0.25, dz));
      g.add(taper([V(p0.x, p0.y, p0.z), V(top.x + 0.01, top.y, top.z + 0.012), V(top.x + 0.01, top.y - len * 0.5, top.z + 0.016), V(top.x + 0.01, top.y - len, top.z + 0.016)], 0.014, tox, 0.55, toxHot));
    }
    return { g };
  } };
})();
