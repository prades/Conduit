// BARNACLE BRACER (Series 2, Crustacean, Refined: +14% maximum HP; docs/SERIES-2.md, drafted look: "a forearm guard crusted with barnacles and a strap"): a curved chitin forearm guard, banded,
// narrowing to the wrist, crusted with pale ridged barnacles, a leather strap with a brass buckle round its middle. The Crustaceans' look: design/cards/models/_crust.js (CHITIN SCALE, approved).
// A PROPOSED look, for the owner's approval.
(function () {
  const { shell, spine, std, at, band } = CRUST;
  const barn = new T.MeshStandardMaterial({ color: STY.col('#b9b2a4'), metalness: 0.02, roughness: 0.75, flatShading: true }); barn.envMapIntensity = 0.8;
  const hole = std('#2a1d18', 0, 0.9), leather = std('#4a2f1c', 0.05, 0.78), brass = std('#c9a35a', 1, 0.26);
  const T0 = -PI / 2 - 0.35, TL = PI + 0.7;   // the guard's arc (round its front, +z)
  function barnacle(s) {
    const g = G(), c = new T.Mesh(new T.CylinderGeometry(s * 0.38, s, s * 0.8, 6, 1), barn); c.position.y = s * 0.4; g.add(c);
    g.add(at(new T.Mesh(new T.CylinderGeometry(s * 0.2, s * 0.2, 0.01, 6), hole), 0, s * 0.805, 0));
    for (const sx of [-1, 1]) { const p = new T.Mesh(new T.BoxGeometry(s * 0.16, s * 0.05, s * 0.3), barn); p.position.set(sx * s * 0.08, s * 0.82, 0); p.rotation.z = sx * 0.5; g.add(p); }
    return g;
  }
  ITEMS.barnacle_bracer = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    const geo = band(new T.CylinderGeometry(0.27, 0.32, 0.72, 48, 24, true, T0, TL), 1, -0.36, 0.36, 4);
    P.add(new T.Mesh(geo, shell));
    const inner = new T.Mesh(new T.CylinderGeometry(0.255, 0.305, 0.72, 48, 1, true, T0, TL), std('#7a3a28', 0.05, 0.6, { side: T.BackSide })); P.add(inner);
    for (const y of [-0.36, 0.36]) { const r = y > 0 ? 0.27 : 0.32, lip = new T.Mesh(new T.TorusGeometry(r + 0.004, 0.016, 8, 48, TL), spine); lip.rotation.set(PI / 2, 0, -T0 - PI / 2 - TL + PI / 2); lip.rotation.set(-PI / 2, 0, T0 + PI / 2); P.add(at(lip, 0, y, 0)); }
    // the strap round its middle, the buckle at the front
    P.add(at(new T.Mesh(new T.CylinderGeometry(0.31, 0.312, 0.09, 48, 1, true, T0, TL), leather), 0, -0.02, 0));
    const bk = G(); bk.position.set(0, -0.02, 0.315); bk.add(new T.Mesh(new T.TorusGeometry(0.05, 0.01, 6, 4), brass)); bk.children[0].rotation.z = PI / 4; bk.add(at(cbox(0.012, 0.09, 0.012, 0.003, brass), 0, 0, 0.01)); P.add(bk);
    // the barnacles, crusted over the front and sides, clear of the strap
    [[-0.6, 0.22, 0.07], [-0.2, 0.26, 0.06], [0.25, 0.2, 0.075], [0.7, 0.24, 0.05], [-0.95, 0.12, 0.05], [1.0, 0.1, 0.06], [-0.4, -0.2, 0.065], [0.1, -0.24, 0.055], [0.55, -0.18, 0.07], [-0.85, -0.26, 0.05], [0.95, -0.27, 0.045], [0.38, 0.3, 0.04]].forEach(([a, y, s]) => {
      const r = 0.3 - (y + 0.36) / 0.72 * 0.05, b = barnacle(s), q = G(); q.position.set(r * Math.sin(a), y, r * Math.cos(a)); q.rotation.y = a; b.rotation.x = PI / 2; q.add(b); P.add(q);
    });
    P.rotation.set(0.12, 0.1, -0.12);
    return { g };
  } };
})();
