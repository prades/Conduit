// ATTUNED CORE (Series 2, Elemental, Precision: a chance per hit to set its own element's status; docs/SERIES-2.md, drafted look: "a small reactor core in a cage, its colour the wearer's"):
// a white-hot core in a clear shell inside a steel cage of three rings and bars between two caps, six indicator lights in the six element colours round its foot (a baked picture cannot take one
// wearer's colour). The Elementals' look: design/cards/models/_elemental.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, glass, steel, dark, white, whiteDim, ELS } = ELEM;
  ITEMS.attuned_core = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(at(sphere(0.1, white, 24), 0, 0, 0)); P.add(at(sphere(0.15, whiteDim, 24), 0, 0, 0)).children;
    P.children[P.children.length - 1].material = new T.MeshBasicMaterial({ color: STY.col('#bcd2ff'), transparent: true, opacity: 0.35 });
    P.add(at(sphere(0.19, glass, 32), 0, 0, 0));
    for (let k = 0; k < 3; k++) { const r = new T.Mesh(new T.TorusGeometry(0.25, 0.012, 8, 56), steel); r.rotation.set(0, k * PI / 3, 0); P.add(r); }
    for (const y of [-0.3, 0.3]) { P.add(at(cyl(0.16, 0.18, 0.06, dark, 32), 0, y, 0)); P.add(at(new T.Mesh(new T.TorusGeometry(0.17, 0.012, 8, 40), steel), 0, y, 0)).children; }
    P.children.slice(-1)[0].rotation.x = PI / 2; P.children.slice(-3)[0].rotation.x = PI / 2;
    for (let k = 0; k < 6; k++) { const a = k * TAU / 6; P.add(at(cyl(0.01, 0.01, 0.56, steel, 8), 0.24 * Math.cos(a), 0, 0.24 * Math.sin(a))); }
    ELS.forEach((m, k) => { const a = k * TAU / 6 + PI / 6; P.add(at(sphere(0.018, m, 10), 0.175 * Math.cos(a), -0.3, 0.175 * Math.sin(a))); });
    P.add(at(cyl(0.05, 0.05, 0.05, steel, 16), 0, 0.355, 0));
    return { g };
  } };
})();
