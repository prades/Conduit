// FOCUSING PRISM (Series 2, Elemental, Refined: +14% special attack; docs/SERIES-2.md, drafted look: "a cut prism in a brass cradle, light split through it"): a clear triangular prism, its
// triangle facing you and its edges bound in brass, held on pivots in a brass cradle on a foot; a white beam goes in at its left face and six beams in the six element colours fan out of its
// right. The Elementals' look: design/cards/models/_elemental.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, brass, white, ELS } = ELEM;
  const glassP = new T.MeshStandardMaterial({ color: STY.col('#e6f0ff'), emissive: STY.col('#8fa6d8'), emissiveIntensity: 0.25, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.55, flatShading: true }); glassP.envMapIntensity = 1.8;
  ITEMS.focusing_prism = { exposure: 1.0, az: 0.35, el: 0.2, build() {
    const g = G(), P = G(); g.add(P);
    const R = 0.2, D = 0.2, Y = 0.1;   // the triangle's radius, the prism's depth, its height
    const pr = new T.Mesh(new T.CylinderGeometry(R, R, D, 3), glassP); pr.rotation.x = -PI / 2; P.add(at(pr, 0, Y, 0));
    // brass along its edges: the two triangles and the three long edges
    const v = k => { const a = PI / 2 + k * TAU / 3; return [R * Math.cos(a), Y + R * Math.sin(a)]; };   // (the cylinder's corners, turned to face +z: one at the top)
    for (const z of [-D / 2, D / 2]) for (let k = 0; k < 3; k++) { const a = v(k), b = v((k + 1) % 3); P.add(tube([[a[0], a[1], z], [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, z], [b[0], b[1], z]], 0.008, brass)); }
    for (let k = 0; k < 3; k++) { const a = v(k); P.add(tube([[a[0], a[1], -D / 2], [a[0], a[1], 0], [a[0], a[1], D / 2]], 0.008, brass)); }
    // the cradle: two arms from the foot up to pivots at the prism's front and back
    for (const s of [-1, 1]) {
      P.add(tube([[0, -0.32, s * 0.12], [0, -0.12, s * 0.2], [0, Y - 0.02, s * (D / 2 + 0.04)]], 0.016, brass));
      const pv = cyl(0.03, 0.03, 0.04, brass, 16); pv.rotation.x = PI / 2; P.add(at(pv, 0, Y - 0.02, s * (D / 2 + 0.03)));
    }
    P.add(at(cyl(0.2, 0.24, 0.05, brass, 32), 0, -0.34, 0)); P.add(at(cyl(0.14, 0.17, 0.04, brass, 32), 0, -0.3, 0));
    // the light: a white beam into its left face, six beams out of its right face, fanned
    const inA = v(1), inB = v(0), mid = [(inA[0] + inB[0]) / 2, (inA[1] + inB[1]) / 2];
    P.add(tube([[-0.6, Y + 0.12, 0], [-0.35, Y + 0.06, 0], [mid[0], mid[1], 0]], 0.012, white));
    const oA = v(0), oB = v(2), om = [(oA[0] + oB[0]) / 2 + 0.01, (oA[1] + oB[1]) / 2];
    ELS.forEach((m, k) => { const a = -0.05 - k * 0.075; P.add(tube([[om[0], om[1], 0], [om[0] + 0.25 * Math.cos(a), om[1] + 0.25 * Math.sin(a), 0], [om[0] + 0.5 * Math.cos(a), om[1] + 0.5 * Math.sin(a), 0]], 0.009, m)); });
    return { g };
  } };
})();
