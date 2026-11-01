// REPULSOR PULSE (Pack 1, core, Precision: 15% per hit to knock the target back): a palm repulsor firing. A round emitter disc (a dark steel housing ringed with cooling fins; on its face
// concentric steel rings round a bolt circle, a core-teal ring and a white-hot teal core under a lens) on a short armoured wrist cuff, tilted to face up toward the viewer; three shockwave rings
// push out in front of it, each wider and fainter than the last, and teal sparks are blown outward past them.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const housM = std('#434a55', 0.85, 0.3), faceM = std('#23272e', 0.8, 0.34), finM = std('#8b939e', 0.85, 0.28), rimM = std('#a7b0bb', 0.9, 0.24), boltM = std('#c3cbd6', 0.95, 0.2);
  const cuffM = std('#6b737e', 0.8, 0.3), innerM = std('#1a1d22', 0.6, 0.5, { side: T.BackSide });
  const lensM = new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.3, metalness: 0, roughness: 0.04, depthWrite: false }); lensM.color = STY.col('#d8fff8'); lensM.envMapIntensity = 1.5;
  const teal = STY.glow('#00ccaa', 1.6), tealHot = STY.glow('#8ffff0', 1.7), tealDim = STY.glow('#00806a', 1.2), white = STY.glow('#eafffb', 1.7);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z), Zv = V(0, 0, 1);
  function lathe(pts, mat, seg) { const v = []; pts.forEach(([r, y], i) => { v.push(new T.Vector2(r, y)); if (i > 0 && i < pts.length - 1) v.push(new T.Vector2(r, y)); }); return new T.Mesh(new T.LatheGeometry(v, seg || 64), mat); }
  const zl = (pts, mat, seg) => { const m = lathe(pts, mat, seg); m.rotation.x = PI / 2; return m; };   // a lathe whose axis is +z

  ITEMS.repulsor_pulse = { exposure: 1.0, az: 0.55, el: 0.3, build() {
    const g = G();
    const nD = V(Math.sin(0.5) * Math.cos(1.2), Math.sin(1.2), Math.cos(0.5) * Math.cos(1.2)).normalize(), D = G(); D.quaternion.setFromUnitVectors(Zv, nD); g.add(D);
    // THE HOUSING: a dark steel drum, its front edge chamfered, a domed back
    D.add(zl([[0, -0.16], [0.14, -0.16], [0.2, -0.13], [0.25, -0.1], [0.29, -0.07], [0.305, -0.04], [0.305, 0.035], [0.29, 0.058], [0.27, 0.066], [0, 0.066]], housM, 96));
    // cooling fins round its rim
    for (let i = 0; i < 22; i++) { const q = G(); q.rotation.z = i * TAU / 22; q.add(at(cbox(0.075, 0.018, 0.1, 0.006, finM), 0.33, 0, -0.03)); D.add(q); }
    D.add(at(torus(0.312, 0.012, rimM, 96), 0, 0, 0.034));
    // THE FACE: a dark recessed plate, the outer steel ring, a bolt circle, the teal ring, an inner steel ring, the core and its lens
    D.add(zl([[0, 0.06], [0.262, 0.06], [0.262, 0.072], [0, 0.072]], faceM, 96));
    D.add(at(torus(0.272, 0.017, rimM, 96), 0, 0, 0.074));
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8 + 0.2, b = cyl(0.014, 0.014, 0.016, boltM, 8); b.rotation.x = PI / 2; D.add(at(b, 0.236 * Math.cos(a), 0.236 * Math.sin(a), 0.078)); }
    D.add(at(torus(0.2, 0.012, teal, 96), 0, 0, 0.075));
    D.add(at(torus(0.155, 0.02, finM, 72), 0, 0, 0.082));
    D.add(zl([[0, 0.07], [0.135, 0.07], [0.135, 0.084], [0, 0.084]], teal, 48));
    D.add(at(torus(0.132, 0.01, rimM, 64), 0, 0, 0.088));
    const hot = sphere(0.085, white, 24); hot.scale.set(1, 1, 0.45); D.add(at(hot, 0, 0, 0.084));
    const lens = new T.Mesh(new T.SphereGeometry(0.128, 32, 12, 0, TAU, 0, 0.75), lensM); lens.rotation.x = PI / 2; D.add(at(lens, 0, 0, 0.0));
    // THE CUFF: a short armoured sleeve behind the palm, bent down at the wrist
    const wd = V(-0.65, -0.72, -0.2).normalize().applyQuaternion(D.quaternion.clone().invert()), W = G(); W.quaternion.setFromUnitVectors(Zv, wd); W.position.set(0, 0, -0.14); D.add(W);
    W.add(zl([[0.1, 0], [0.1, 0.12]], housM, 32));
    W.add(new T.Mesh(new T.SphereGeometry(0.12, 24, 12), housM));
    W.add(zl([[0.2, 0.1], [0.215, 0.085], [0.235, 0.085], [0.25, 0.1], [0.25, 0.42], [0.235, 0.435], [0.215, 0.435], [0.2, 0.42]], cuffM, 64));
    W.add(zl([[0.2, 0.1], [0.2, 0.42]], innerM, 64));
    for (const z of [0.13, 0.39]) W.add(at(torus(0.252, 0.014, rimM, 64), 0, 0, z));
    W.add(at(torus(0.253, 0.009, teal, 64), 0, 0, 0.26));
    for (let i = 0; i < 6; i++) { const q = G(); q.rotation.z = i * TAU / 6 + 0.26; q.add(at(cbox(0.11, 0.025, 0.2, 0.008, housM), 0, 0.262, 0.26)); W.add(q); }
    // THE PULSE: three shockwave rings pushing out from the face, each wider and fainter
    [[0.23, 0.29, 0.016, tealHot], [0.41, 0.345, 0.012, teal], [0.6, 0.4, 0.009, tealDim]].forEach(([z, r, t, m]) => D.add(at(torus(r, t, m, 96), 0, 0, z)));
    // sparks blown outward past the rings
    [[0.6, 0.14, 0.016, tealHot], [2.2, 0.24, 0.014, teal], [3.4, 0.18, 0.013, tealHot], [4.6, 0.3, 0.012, teal], [5.6, 0.4, 0.011, teal], [1.4, 0.48, 0.01, tealDim], [2.9, 0.6, 0.009, tealDim]].forEach(([a, z, r, m]) => {
      const rr = 0.38 + z * 0.3; D.add(at(sphere(r, m, 10), rr * Math.cos(a), rr * Math.sin(a), z));
    });
    return { g };
  } };
})();
