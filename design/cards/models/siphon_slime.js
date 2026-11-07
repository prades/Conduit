// SIPHON SLIME (Series 2, Mollusk, Precision: a chance per hit to siphon; docs/SERIES-2.md, drafted look: "a dripping vial of glowing slime"): a slender glass vial, its cork pushed half out,
// full of glowing sea-green slime that has welled over the lip and runs down its side in drips, a drop falling below, a brass collar. The Mollusks' look: design/cards/models/_mollusk.js.
// A PROPOSED look, for the owner's approval.
(function () {
  const { at, glass, brass, cork, glow, glowDim, lathe } = MOLL;
  const slime = new T.MeshStandardMaterial({ color: STY.col('#7dffc4'), emissive: STY.col('#1fa878'), emissiveIntensity: 1.0, metalness: 0, roughness: 0.12, side: T.DoubleSide }); slime.envMapIntensity = 1.3;
  ITEMS.siphon_slime = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    const V = G(); V.rotation.z = -0.32; P.add(V);
    V.add(new T.Mesh(lathe([[0, -0.4], [0.06, -0.39], [0.09, -0.35], [0.1, -0.3], [0.1, 0.3], [0.11, 0.32], [0.11, 0.34], [0.095, 0.34]], 48), glass));
    V.add(new T.Mesh(lathe([[0, -0.38], [0.055, -0.37], [0.08, -0.34], [0.088, -0.3], [0.088, 0.31], [0, 0.31]], 32), slime));
    const ck = cyl(0.082, 0.07, 0.12, cork, 24); ck.rotation.z = 0.15; V.add(at(ck, 0.012, 0.4, 0));
    const col = cyl(0.106, 0.106, 0.04, brass, 32); V.add(at(col, 0, 0.27, 0));
    // the overflow at the lip, and drips down the side
    const lip = new T.Mesh(new T.TorusGeometry(0.1, 0.022, 10, 32), slime); lip.rotation.x = PI / 2; V.add(at(lip, 0, 0.335, 0));
    [[0.4, 0.3, 0.2], [1.6, 0.3, 0.32], [-0.5, 0.3, 0.12]].forEach(([a, y0, len]) => {
      const x = 0.104 * Math.sin(a), z = 0.104 * Math.cos(a);
      V.add(tube([[x, y0, z], [x * 1.05, y0 - len * 0.5, z * 1.05], [x, y0 - len, z]], 0.014, slime));
      const b = sphere(0.022, slime, 12); b.scale.y = 1.3; V.add(at(b, x, y0 - len - 0.01, z));
    });
    const drop = sphere(0.026, glow, 14); drop.scale.y = 1.4; P.add(at(drop, 0.16, -0.5, 0.05));
    P.add(at(sphere(0.012, glowDim, 10), 0.13, -0.58, 0.05));
    return { g };
  } };
})();
