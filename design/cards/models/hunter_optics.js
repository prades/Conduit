// HUNTER OPTICS (Series 2, Drone, Precision: +10% damage and +10% attack speed; docs/SERIES-2.md, drafted look: "a targeting lens array with a red reticle"): a gunmetal sensor head with one big
// lens and two small ones in a cluster, a red reticle glowing in the big lens (a ring, a cross and a centre dot), a range-finder slot, a cyan status light, cooling fins on its back.
// The Drones' look: design/cards/models/_drone.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, gun, gunDark, steel, cyan, red, lens } = DRONE;
  ITEMS.hunter_optics = { exposure: 1.0, az: 0.45, el: 0.2, build() {
    const g = G(), P = G(); g.add(P);
    P.add(cbox(0.5, 0.36, 0.26, 0.06, gun));   // the head
    const ring = (r, d, x, y) => { const b = cyl(r + 0.03, r + 0.035, d, gunDark, 40); b.rotation.x = PI / 2; P.add(at(b, x, y, 0.13 + d / 2)); const l = cyl(r, r, 0.01, lens, 40); l.rotation.x = PI / 2; P.add(at(l, x, y, 0.13 + d + 0.002)); const s = new T.Mesh(new T.TorusGeometry(r + 0.012, 0.008, 8, 40), steel); P.add(at(s, x, y, 0.13 + d + 0.004)); return 0.13 + d + 0.01; };
    const zb = ring(0.12, 0.1, -0.06, 0);
    ring(0.05, 0.06, 0.15, 0.08); ring(0.04, 0.05, 0.16, -0.08);
    // the reticle: a ring, four ticks, a dot
    const ret = new T.Mesh(new T.TorusGeometry(0.065, 0.005, 6, 48), red); P.add(at(ret, -0.06, 0, zb));
    for (let k = 0; k < 4; k++) { const a = k * PI / 2, t = cbox(0.005, 0.04, 0.004, 0.001, red); t.rotation.z = a; P.add(at(t, -0.06 + 0.085 * Math.sin(a), 0.085 * Math.cos(a), zb)); }
    P.add(at(sphere(0.008, red, 8), -0.06, 0, zb));
    P.add(at(cbox(0.12, 0.02, 0.01, 0.004, red), 0.12, -0.15, 0.135));   // the range-finder slot
    P.add(at(sphere(0.016, cyan, 10), 0.2, 0.15, 0.13));
    for (let k = 0; k < 5; k++) P.add(at(cbox(0.42, 0.012, 0.06, 0.003, gunDark), 0, -0.12 + k * 0.06, -0.16));   // the fins
    P.add(at(cbox(0.08, 0.06, 0.1, 0.02, gunDark), 0, -0.21, -0.02));   // the mount
    return { g };
  } };
})();
