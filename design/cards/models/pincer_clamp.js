// PINCER CLAMP (Series 2, Crustacean, Precision: a chance per hit to slow; docs/SERIES-2.md, drafted look: "a hinged mechanical claw, its jaw half open"): a crab's claw in banded coral chitin,
// its lower finger hinged on a steel pin and driven by a hydraulic piston, its jaw half open, blunt teeth along both fingers, a steel collar at its wrist. The Crustaceans' look:
// design/cards/models/_crust.js (CHITIN SCALE, approved). A PROPOSED look, for the owner's approval.
(function () {
  const { shell, spine, std, at, band, horn } = CRUST;
  const steel = std('#5a616b', 0.9, 0.3), bright = std('#c4cbd4', 1, 0.22), fingerM = std('#e98a6a', 0.05, 0.32);
  function teeth(h, n, dir) { const g = G(), pts = h.userData.pts; for (let k = 1; k <= n; k++) { const p = pts[k], t = new T.Mesh(new T.ConeGeometry(0.016, 0.035, 8), spine); t.position.set(p[0], p[1] + dir * 0.012, 0); t.rotation.z = dir > 0 ? 0 : PI; g.add(t); } return g; }
  ITEMS.pincer_clamp = { exposure: 1.0, az: 0.5, el: 0.25, build() {
    const g = G(), P = G(); g.add(P);
    // the palm: a banded swollen shell
    const palm = new T.Mesh(band(new T.SphereGeometry(0.22, 40, 28), 0, -0.22, 0.22, 3), shell); palm.scale.set(1.25, 0.85, 0.7); P.add(at(palm, -0.08, 0, 0));
    // the fixed finger (top), curving down at its tip
    const fixed = horn(0.44, 0.08, -0.55, fingerM); fixed.position.set(0.12, 0.07, 0); P.add(fixed); P.add(at(teeth(fixed, 5, -1), 0.12, 0.07, 0));
    // the moving finger (bottom), on its pin, opened
    const mv = G(); mv.position.set(0.16, -0.08, 0); mv.rotation.z = -0.5;
    const finger = horn(0.38, 0.07, 0.5, fingerM); mv.add(finger); mv.add(teeth(finger, 4, 1)); P.add(mv);
    const pin = cyl(0.045, 0.045, 0.2, bright, 20); pin.rotation.x = PI / 2; P.add(at(pin, 0.16, -0.08, 0));
    for (const z of [-0.105, 0.105]) { const nut = cyl(0.035, 0.035, 0.02, steel, 6); nut.rotation.x = PI / 2; P.add(at(nut, 0.16, -0.08, z)); }
    // the piston: from under the palm to the moving finger's heel
    const a = [-0.18, -0.16, 0.09], b = [0.1, -0.2, 0.09];
    P.add(tube([a, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, a[2]], b], 0.026, steel));
    P.add(tube([[0.0, -0.18, 0.09], [0.08, -0.19, 0.09], [0.14, -0.15, 0.09]], 0.014, bright));
    // the wrist collar
    const col = cyl(0.16, 0.17, 0.08, steel, 32); col.rotation.z = PI / 2; P.add(at(col, -0.36, 0, 0));
    const ring = new T.Mesh(new T.TorusGeometry(0.165, 0.014, 8, 40), bright); ring.rotation.y = PI / 2; P.add(at(ring, -0.32, 0, 0));
    P.rotation.set(0.1, -0.35, 0.05);
    return { g };
  } };
})();
