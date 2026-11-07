// GYRO STABILIZER (Series 2, Drone, Refined: +14% attack speed; docs/SERIES-2.md, drafted look: "a spinning gyroscope in a gimbal frame"): a heavy steel rotor disc on its axle, spinning (cyan
// light along its rim), inside two gunmetal gimbal rings set at angles, on a fork and a round foot. The Drones' look: design/cards/models/_drone.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, gun, gunDark, steel, cyan } = DRONE;
  const blur = new T.MeshBasicMaterial({ color: STY.col('#9fe8ff'), transparent: true, opacity: 0.25, side: T.DoubleSide });
  ITEMS.gyro_stabilizer = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    const C = G(); C.position.y = 0.1; P.add(C);
    // the rotor: a disc, its hub and axle, a cyan line round its rim, a faint spin blur
    const R = G(); R.rotation.set(0.5, 0, 0.3); C.add(R);
    const disc = cyl(0.17, 0.17, 0.05, steel, 48); R.add(disc);
    const rim = new T.Mesh(new T.TorusGeometry(0.17, 0.008, 6, 48), cyan); rim.rotation.x = PI / 2; R.add(rim);
    R.add(cyl(0.04, 0.04, 0.4, gunDark, 16));
    const bl = new T.Mesh(new T.RingGeometry(0.17, 0.2, 48), blur); bl.rotation.x = PI / 2; R.add(bl);
    // the gimbals: an inner ring round the rotor's axle, an outer ring round that, each turned
    const inner = new T.Mesh(new T.TorusGeometry(0.22, 0.016, 10, 56), gun); inner.rotation.set(0.5 + PI / 2, 0.0, 0.3); C.add(inner);
    const outer = new T.Mesh(new T.TorusGeometry(0.28, 0.018, 10, 64), gun); outer.rotation.set(0, 0.9, 0); C.add(outer);
    for (const s of [-1, 1]) C.add(at(sphere(0.026, steel, 12), s * 0.28 * Math.cos(0.9), 0, -s * 0.28 * Math.sin(0.9)));   // the outer pivots
    // the fork and foot
    P.add(tube([[0, -0.3, 0], [0, -0.22, 0], [0, -0.18, 0]], 0.03, gunDark));
    P.add(at(new T.Mesh(new T.TorusGeometry(0.3, 0.014, 8, 48, PI), gunDark), 0, 0.1, 0)).children;
    P.children[P.children.length - 1].rotation.set(0, 0.9, PI);
    P.add(at(cyl(0.16, 0.2, 0.05, gun, 40), 0, -0.32, 0)); P.add(at(sphere(0.02, cyan, 10), 0.12, -0.3, 0.12));
    return { g };
  } };
})();
