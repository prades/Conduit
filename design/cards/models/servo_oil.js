// SERVO OIL (Series 2, Drone, Unrefined: +8% attack speed; docs/SERIES-2.md, drafted look: "an oil can with a long nozzle"): a squat gunmetal oil can with a domed top and a rolled rim, a long
// thin steel spout, a thumb pump on its handle, a cyan fill light, a bead of amber oil at the spout's tip and a drip running down its side. The Drones' look: design/cards/models/_drone.js.
// A PROPOSED look, for the owner's approval.
(function () {
  const { at, gun, gunDark, steel, rubber, cyan, oil } = DRONE;
  ITEMS.servo_oil = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(new T.Mesh(new T.LatheGeometry([[0, -0.3], [0.24, -0.3], [0.26, -0.28], [0.26, 0.02], [0.24, 0.06], [0.14, 0.14], [0.06, 0.17], [0, 0.17]].map(p => new T.Vector2(p[0], p[1])), 48), gun));
    for (const y of [-0.28, 0.0]) { const r = new T.Mesh(new T.TorusGeometry(0.262, 0.012, 8, 48), steel); r.rotation.x = PI / 2; P.add(at(r, 0, y, 0)); }
    P.add(at(cyl(0.05, 0.06, 0.06, steel, 20), 0, 0.19, 0));
    // the spout: a long thin tube rising out of the top and reaching forward
    const sp = [[0, 0.2, 0], [0.08, 0.34, 0.04], [0.22, 0.46, 0.1], [0.42, 0.55, 0.16]];
    P.add(tube(sp, 0.018, steel)); P.add(at(sphere(0.022, steel, 12), sp[3][0], sp[3][1], sp[3][2]));
    const bead = sphere(0.02, oil, 12); bead.scale.y = 1.3; P.add(at(bead, sp[3][0] + 0.01, sp[3][1] - 0.03, sp[3][2]));
    // the handle and its thumb pump, at the back
    P.add(tube([[-0.24, -0.15, 0], [-0.38, -0.08, 0], [-0.38, 0.06, 0], [-0.22, 0.05, 0]], 0.025, rubber));
    const pump = cbox(0.09, 0.03, 0.06, 0.01, gunDark); pump.rotation.z = 0.5; P.add(at(pump, -0.33, 0.12, 0));
    P.add(at(sphere(0.022, cyan, 12), 0.12, -0.12, 0.23));   // the fill light
    P.add(tube([[0.2, 0.03, 0.16], [0.21, -0.08, 0.17], [0.2, -0.16, 0.17]], 0.012, oil));   // a drip down its side
    P.rotation.y = -0.4;
    return { g };
  } };
})();
