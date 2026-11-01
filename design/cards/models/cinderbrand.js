// CINDERBRAND (Pack 1, fire, Precision: 15% per hit to burn): a blacksmith's branding iron held nearly upright, its top leaning out toward you so its stamp shows: a ring pommel at its foot, a leather-wrapped
// grip between brass ferrules, a twisted square bar, then a round shaft that heats toward the top (a vertex-colour heat gradient: steel, the temper colours, red, under a glow that fades in up it), a hot hub and
// three legs carrying the brand: a flame sigil of bar stock (an outline with an inner tongue), white-hot on its face, amber down its sides. Cinders and sparks fall from the brand, embers rise off it. Precision: the most
// worked of the fire items, its burn shown.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const heatM = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.78, roughness: 0.34, vertexColors: true }); heatM.envMapIntensity = 1.0;
  const leatherM = std('#3d2617', 0.05, 0.8), wrapM = std('#6b4428', 0.05, 0.68), brassM = std('#c0a466', 1, 0.3), ringM = std('#9aa3ae', 0.9, 0.26), darkM = std('#2a2f37', 0.8, 0.38);
  const ember = STY.glow('#ff6a1a', 1.6), emberHot = STY.glow('#ffb347', 1.7), emberCore = STY.glow('#fff0c2', 1.8), emberDim = STY.glow('#d9480f', 1.2);
  const glowV = new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false });   // a glow coloured per vertex
  const glowVA = new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false, transparent: true, depthWrite: false });   // ... and fading out (rgba)
  const IRON = STY.col('#4c535e'), HOT = STY.col('#9a3410');
  const C = (hex, k) => STY.col(hex).multiplyScalar(k || 1);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z);
  const AZ = 0.52, EL = 0.36;
  // paint a geometry's vertices by f(position) -> THREE.Color (and alpha, if f gives one)
  function paint(geo, f, rgba) {
    const p = geo.attributes.position, n = rgba ? 4 : 3, col = new Float32Array(p.count * n), v = V(0, 0, 0);
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const [c, a] = f(v); col[i * n] = c.r; col[i * n + 1] = c.g; col[i * n + 2] = c.b; if (rgba) col[i * n + 3] = a; }
    geo.setAttribute('color', new T.BufferAttribute(col, n)); return geo;
  }
  // the heat ramp, 0 (cold iron) .. 1 (white-hot), as a glow colour
  const RAMP = [[0, C('#3a0c02')], [0.3, C('#d9480f', 1.2)], [0.55, C('#ff6a1a', 1.6)], [0.8, C('#ffb347', 1.7)], [1, C('#fff0c2', 1.8)]];
  function ramp(k) { k = Math.max(0, Math.min(1, k)); for (let i = 1; i < RAMP.length; i++) if (k <= RAMP[i][0]) { const [a, ca] = RAMP[i - 1], [b, cb] = RAMP[i]; return ca.clone().lerp(cb, (k - a) / (b - a)); } return RAMP[RAMP.length - 1][1].clone(); }
  // a smooth closed outline through points (x, y), as THREE.Vector2s
  const outline = (pts, n) => new T.CatmullRomCurve3(pts.map(([x, y]) => V(x, y, 0)), true, 'centripetal').getPoints(n).slice(0, -1).map(p => new T.Vector2(p.x, p.y));
  // THE SIGIL (in its own plane, the flame's tip toward +y): the outer flame with three tongues, the hole inside it, and the inner tongue standing in the hole
  const FLAME = [[0, -0.5], [0.2, -0.46], [0.33, -0.31], [0.36, -0.12], [0.33, 0.04], [0.3, 0.16], [0.24, 0.07], [0.18, 0.14], [0.13, 0.3], [0.07, 0.5], [0.0, 0.33], [-0.08, 0.22], [-0.13, 0.12], [-0.22, 0.27],
                 [-0.29, 0.1], [-0.35, -0.1], [-0.33, -0.3], [-0.21, -0.45]];
  const HOLE = [[0, -0.36], [0.15, -0.3], [0.2, -0.14], [0.15, 0.02], [0.08, 0.13], [0.02, 0.2], [-0.05, 0.11], [-0.13, 0.0], [-0.2, -0.15], [-0.14, -0.3]];
  const TONGUE = [[0.0, -0.27], [0.08, -0.23], [0.1, -0.13], [0.06, -0.03], [0.02, 0.07], [-0.03, -0.03], [-0.09, -0.13], [-0.07, -0.23]];

  ITEMS.cinderbrand = { exposure: 1.0, az: AZ, el: EL, build() {
    const g = G(), O = G(), L = G(), K = G(), I = G(); g.add(O); O.add(L); L.add(K); K.add(I);
    O.rotation.y = AZ; L.rotation.z = -0.3; K.rotation.x = 0.46;   // face the camera, lean right, top out toward the camera
    // THE POMMEL: a ring through an eye at the foot
    const eye = torus(0.026, 0.011, ringM, 24); eye.rotation.y = PI / 2; I.add(at(eye, 0, -0.03, 0));
    const ring = torus(0.07, 0.016, ringM, 40); I.add(at(ring, 0, -0.1, 0));
    I.add(at(cyl(0.022, 0.03, 0.04, brassM, 20), 0, 0.005, 0));
    // THE GRIP: leather wrapped round in a raised strap, between brass ferrules
    const y0 = 0.03, y1 = 0.4;
    I.add(at(cyl(0.041, 0.044, y1 - y0, leatherM, 28), 0, (y0 + y1) / 2, 0));
    const hel = []; for (let i = 0; i <= 120; i++) { const s = i / 120, a = s * TAU * 6.5, y = y0 + 0.022 + s * (y1 - y0 - 0.044), r = 0.0432 - 0.003 * s; hel.push([Math.sin(a) * r, y, Math.cos(a) * r]); }
    I.add(tube(hel, 0.0125, wrapM));
    for (const [y, s] of [[y0, 1], [y1, -1]]) { I.add(at(cyl(0.05, 0.05, 0.034, brassM, 28), 0, y + s * 0.008, 0)); const b = torus(0.05, 0.007, brassM, 32); b.rotation.x = PI / 2; I.add(at(b, 0, y + s * 0.027, 0)); }
    // THE TWIST: a square bar wrung through two and a half turns, the iron warming toward its top
    const t0 = 0.43, t1 = 0.68, tg = new T.BoxGeometry(0.04, t1 - t0, 0.04, 1, 60, 1), tp = tg.attributes.position;
    for (let i = 0; i < tp.count; i++) { const x = tp.getX(i), y = tp.getY(i), z = tp.getZ(i), a = (y / (t1 - t0) + 0.5) * TAU * 2.5, c = Math.cos(a), s = Math.sin(a); tp.setXYZ(i, x * c - z * s, y, x * s + z * c); }
    tg.computeVertexNormals(); tg.translate(0, (t0 + t1) / 2, 0);
    paint(tg, v => [STY.col('#8b939e').lerp(HOT, Math.pow(Math.max(0, (v.y - t0) / (t1 - t0)), 2) * 0.3)]); I.add(new T.Mesh(tg, heatM));
    for (const y of [t0, t1]) { I.add(at(cyl(0.031, 0.031, 0.024, darkM, 20), 0, y, 0)); const b = torus(0.031, 0.007, ringM, 24); b.rotation.x = PI / 2; I.add(at(b, 0, y, 0)); }
    // THE SHAFT: round, heat-tinted up its length (lit), and the glow fading in over its upper half
    const s0 = t1, s1 = 1.06, sg = new T.CylinderGeometry(0.019, 0.02, s1 - s0, 20, 30); sg.translate(0, (s0 + s1) / 2, 0);
    // (the lit iron below the glow shows the temper colours, as heated steel does: steel, blue, purple, bronze, straw, then red heat)
    const TEMPER = [[0, IRON], [0.08, STY.col('#5a6578')], [0.17, STY.col('#3b5fa8')], [0.26, STY.col('#6b4b96')], [0.35, STY.col('#9a6438')], [0.44, STY.col('#c2a060')], [0.54, HOT], [1, HOT]];
    const temper = k => { for (let i = 1; i < TEMPER.length; i++) if (k <= TEMPER[i][0]) return TEMPER[i - 1][1].clone().lerp(TEMPER[i][1], (k - TEMPER[i - 1][0]) / (TEMPER[i][0] - TEMPER[i - 1][0])); return HOT.clone(); };
    paint(sg, v => [temper((v.y - s0) / (s1 - s0))]); I.add(new T.Mesh(sg, heatM));
    const HL = (s1 - s0) * 0.56, hg = new T.CylinderGeometry(0.0205, 0.0212, HL, 20, 28); hg.translate(0, s1 - HL / 2, 0);
    paint(hg, v => { const k = (v.y - (s1 - HL)) / HL; return [ramp(0.12 + 0.78 * k), Math.min(1, k * 2.4)]; }, true); I.add(new T.Mesh(hg, glowVA));
    // THE HEAD: a hot hub and three legs up to the sigil
    const yS = 1.12, SC = 0.5, D = 0.05;   // the sigil's underside, its scale, its depth
    I.add(at(cyl(0.032, 0.026, 0.04, emberHot, 20), 0, s1 + 0.005, 0));
    const toS = (x, y) => V(x * SC * 0.66, yS + 0.002, -y * SC);   // a point of the sigil's plane (flame-up is away from the camera, so the flame stands upright as you look down on it)
    for (const [x, y] of [[0, -0.36], [-0.22, 0.05], [0.25, 0.0]]) I.add(tube([[0, s1 + 0.02, 0], toS(x, y).toArray()], 0.011, ember));
    // the sigil: outline and tongue, white-hot on the face, amber to orange down the sides
    const sh = new T.Shape(outline(FLAME, 160).map(p => new T.Vector2(p.x * 0.66, p.y))), hole = new T.Path(outline(HOLE, 90).reverse().map(p => new T.Vector2(p.x * 0.66, p.y))); sh.holes.push(hole);
    const tongueS = new T.Shape(outline(TONGUE, 70).map(p => new T.Vector2(p.x * 0.66, p.y)));
    // (the heat by depth, back 0 .. face 1, and up the flame: the face white at the flame's foot to amber at its tips, a step down to the sides, orange to a dull red at the back)
    const heat = v => { const zf = Math.max(0, Math.min(1, (v.z + 0.012) / (D / SC + 0.024))), yf = Math.max(0, Math.min(1, v.y + 0.5)); return [ramp(zf > 0.985 ? 1.0 - 0.34 * yf : 0.1 + 0.6 * Math.pow(zf, 1.5) - 0.12 * yf)]; };
    const sig = [sh, tongueS].map(s => {
      const geo = new T.ExtrudeGeometry(s, { depth: D / SC, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2, curveSegments: 4 });
      paint(geo, heat); const m = new T.Mesh(geo, glowV); m.scale.set(SC, SC, SC); m.rotation.x = -PI / 2; m.position.y = yS; I.add(m); return m;
    });
    g.updateMatrixWorld(true);
    // SPARKS AND CINDERS falling from the brand: hot streaks by it, duller and redder as they fall (in the world, below the brand)
    const bb = new T.Box3().setFromObject(sig[0]), top = bb.getCenter(V(0, 0, 0)), lo = bb.min.y;
    // (a spark: a tapered streak along an arc, its head the hot end)
    const spark = (pts, r, mat) => {
      const curve = new T.CatmullRomCurve3(pts.map(([x, y, z]) => V(top.x + x, lo + y, top.z + z))), TS = 16, RS = 6, geo = new T.TubeGeometry(curve, TS, r, RS, false), p = geo.attributes.position, c = V(0, 0, 0), v = V(0, 0, 0);
      for (let i = 0; i <= TS; i++) { c.set(0, 0, 0); for (let j = 0; j < RS; j++) c.add(v.fromBufferAttribute(p, i * (RS + 1) + j)); c.multiplyScalar(1 / RS); const k = Math.pow(i / TS, 0.9);
        for (let j = 0; j <= RS; j++) { const n = i * (RS + 1) + j; v.fromBufferAttribute(p, n).sub(c).multiplyScalar(k).add(c); p.setXYZ(n, v.x, v.y, v.z); } }
      g.add(new T.Mesh(geo, mat)); g.add(at(sphere(r * 1.15, mat, 8), ...curve.getPoint(1).toArray()));
    };
    spark([[0.13, -0.03, 0.07], [0.17, -0.04, 0.08], [0.2, -0.08, 0.09]], 0.0105, emberHot);
    spark([[0.19, -0.1, 0.01], [0.22, -0.12, 0.01], [0.235, -0.16, 0.02]], 0.0095, emberHot);
    spark([[0.03, -0.08, 0.08], [0.045, -0.11, 0.09], [0.05, -0.15, 0.1]], 0.009, emberHot);
    spark([[0.2, -0.26, 0.04], [0.215, -0.29, 0.05], [0.222, -0.33, 0.05]], 0.0085, ember);
    spark([[0.09, -0.29, 0.08], [0.1, -0.32, 0.09], [0.104, -0.36, 0.09]], 0.008, ember);
    spark([[-0.07, -0.02, 0.06], [-0.1, -0.04, 0.07], [-0.12, -0.08, 0.08]], 0.009, emberHot);
    spark([[-0.11, -0.19, 0.06], [-0.125, -0.22, 0.07], [-0.13, -0.26, 0.07]], 0.0075, ember);
    spark([[0.27, -0.44, 0.03], [0.28, -0.47, 0.03], [0.284, -0.5, 0.03]], 0.007, emberDim);
    spark([[0.15, -0.48, 0.07], [0.155, -0.51, 0.07], [0.157, -0.54, 0.07]], 0.0065, emberDim);
    // a few embers rising off the brand's face
    const hi = bb.max.y;
    for (const [x, y, z, r, k] of [[-0.06, 0.05, 0.02, 0.011, 2], [0.08, 0.09, 0.0, 0.009, 1], [-0.01, 0.14, 0.03, 0.008, 2], [0.13, 0.15, -0.02, 0.007, 0], [-0.1, 0.18, 0.0, 0.006, 1]])
      g.add(at(sphere(r, k === 2 ? emberHot : k === 1 ? ember : emberDim, 8), top.x + x, hi + y, top.z + z));
    // loose sparks and tumbling cinders
    for (const [x, y, z, r, k] of [[0.27, -0.08, 0.03, 0.007, 2], [0.12, -0.15, 0.1, 0.006, 1], [-0.03, -0.24, 0.1, 0.0055, 2], [0.31, -0.3, 0.02, 0.005, 3], [0.2, -0.38, 0.08, 0.005, 3], [-0.15, -0.33, 0.05, 0.0045, 3]])
      g.add(at(sphere(r, k === 1 ? emberCore : k === 2 ? emberHot : ember, 8), top.x + x, lo + y, top.z + z));
    for (const [x, y, z, r] of [[0.31, -0.2, 0.06, 0.013], [0.04, -0.4, 0.06, 0.011], [0.22, -0.6, 0.04, 0.01], [-0.08, -0.42, 0.08, 0.009]]) {
      const c = new T.Mesh(new T.OctahedronGeometry(r, 0), emberDim); c.rotation.set(x * 9, y * 7, z * 5); c.scale.set(1, 0.6, 1); g.add(at(c, top.x + x, lo + y, top.z + z));
    }
    return { g };
  } };
})();
