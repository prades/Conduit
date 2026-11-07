// DOUBLE CELL (Series 2, Technician, Prototype: Double charge; docs/SERIES-2.md, drafted look: "a twin power cell in a clip"): two fat power cells side by side, each a gunmetal can with a
// yellow band and a glass window showing its ice-blue charge, steel contacts at their ends, held together by a steel clip with a handle loop, a lit status pip on the clip.
// The Technicians' look: design/cards/models/_tech.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, yellow, gun, dark, steel, charge, chargeDim, white } = TECH;
  const glass = new T.MeshStandardMaterial({ color: STY.col('#e8f6ff'), metalness: 0, roughness: 0.04, transparent: true, opacity: 0.35 }); glass.envMapIntensity = 1.8;
  ITEMS.double_cell = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    for (const x of [-0.12, 0.12]) {
      for (const y of [-0.215, 0.215]) P.add(at(cyl(0.11, 0.11, 0.13, gun, 40), x, y, 0));   // the can's ends; its middle is glass
      for (const y of [-0.17, 0.17]) P.add(at(cyl(0.113, 0.113, 0.04, yellow, 40), x, y, 0));
      P.add(at(cyl(0.07, 0.07, 0.3, chargeDim, 24), x, 0, 0)); P.add(at(cyl(0.04, 0.04, 0.32, charge, 20), x, 0, 0));   // the charge, seen through
      const win = new T.Mesh(new T.CylinderGeometry(0.108, 0.108, 0.3, 40, 1, true), glass); P.add(at(win, x, 0, 0));
      P.add(at(cyl(0.05, 0.05, 0.04, steel, 20), x, 0.3, 0)); P.add(at(cyl(0.08, 0.08, 0.02, steel, 24), x, -0.29, 0));
    }
    // the clip: two bands round both cells, a spine and a handle loop
    for (const y of [-0.12, 0.12]) { const band = new T.Mesh(new T.TorusGeometry(0.2, 0.014, 8, 48), steel); band.rotation.x = PI / 2; band.scale.set(1.25, 0.62, 1); P.add(at(band, 0, y, 0)); }
    P.add(at(cbox(0.06, 0.32, 0.03, 0.008, dark), 0, 0, 0.12));
    const loop = new T.Mesh(new T.TorusGeometry(0.07, 0.012, 8, 32, PI), steel); P.add(at(loop, 0, 0.32, 0));
    P.add(at(sphere(0.016, white, 10), 0, 0.08, 0.14)); P.add(at(sphere(0.026, charge, 12), 0, 0.08, 0.135)).children;
    return { g };
  } };
})();
