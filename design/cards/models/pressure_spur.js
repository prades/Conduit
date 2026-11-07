// PRESSURE SPUR (the Brawler's opportunity card at Refined: "presses"): the Brawlers' knuckle-duster (design/cards/models/_knuckle.js) with a blunt steel spur on a piston rising out of its
// striking bar, the accent glowing in the piston's seams, a pressure gauge on its side. A PROPOSED look, for the owner's approval.
(function () {
  const { std, at, steel, bright, accent, W, TOP, mount } = KNUCKLE;
  const glass = new T.MeshStandardMaterial({ color: STY.col('#e8eef5'), metalness: 0, roughness: 0.1, transparent: true, opacity: 0.35 }), face = std('#e9e4d4', 0.05, 0.6), needle = STY.glow('#ff4a1c', 1.6);
  ITEMS.pressure_spur = { exposure: 1.0, az: 0.55, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(mount());
    const sp = G(); sp.position.set(0, TOP, 0);
    sp.add(at(cyl(0.085, 0.095, 0.09, steel, 24), 0, 0.045, 0));   // the piston housing
    for (const y of [0.07, 0.1]) { const t = new T.Mesh(new T.TorusGeometry(0.088, 0.008, 6, 28), accent); t.rotation.x = PI / 2; sp.add(at(t, 0, y, 0)); }
    sp.add(at(cyl(0.055, 0.055, 0.1, bright, 24), 0, 0.14, 0));   // the rod
    sp.add(at(new T.Mesh(new T.ConeGeometry(0.075, 0.17, 24), steel), 0, 0.27, 0));   // the blunt spur
    sp.add(at(sphere(0.03, bright, 14), 0, 0.355, 0));
    P.add(sp);
    const gg = G(); gg.position.set(W / 2 - 0.1, TOP + 0.05, 0.03);   // the gauge
    const body = cyl(0.055, 0.055, 0.03, bright, 24); body.rotation.x = PI / 2; gg.add(body);
    const dial = cyl(0.046, 0.046, 0.005, face, 24); dial.rotation.x = PI / 2; gg.add(at(dial, 0, 0, 0.017));
    const nd = cbox(0.006, 0.036, 0.004, 0.001, needle); nd.rotation.z = -0.9; gg.add(at(nd, 0.012, 0.01, 0.022));
    const gl = cyl(0.048, 0.048, 0.008, glass, 24); gl.rotation.x = PI / 2; gg.add(at(gl, 0, 0, 0.024));
    P.add(gg);
    return { g };
  } };
})();
