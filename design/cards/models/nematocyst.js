// NEMATOCYST (Series 2, Jelly, Precision: a chance per hit to poison; docs/SERIES-2.md, drafted look: "a cluster of glowing stinging cells in a capsule"): a clear glass capsule with silver end
// caps, inside it a cluster of glowing orchid stinging cells, each with a coiled pink thread and a barb. The Jellies' look: design/cards/models/_jelly.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, gelDeep, silver, glass, sting, stingHot } = JELLY;
  ITEMS.nematocyst = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    const C = G(); C.rotation.z = 0.5; P.add(C);
    C.add(new T.Mesh(new T.CylinderGeometry(0.16, 0.16, 0.42, 48, 1, true), glass));
    for (const s of [-1, 1]) { const cap = new T.Mesh(new T.SphereGeometry(0.165, 40, 20, 0, TAU, 0, PI / 2), silver); cap.position.y = s * 0.21; cap.rotation.x = s > 0 ? 0 : PI; C.add(cap); C.add(at(new T.Mesh(new T.TorusGeometry(0.165, 0.014, 8, 48), silver), 0, s * 0.21, 0)).children; C.children[C.children.length - 1].rotation.x = PI / 2; }
    // the cells: glowing ovals, each with a coiled thread and a barb at its top
    [[0, -0.08, 0, 0.07], [0.07, 0.05, 0.03, 0.06], [-0.07, 0.04, -0.03, 0.06], [0.02, 0.13, -0.05, 0.05], [-0.04, -0.12, 0.06, 0.045], [0.06, -0.14, -0.05, 0.045]].forEach(([x, y, z, r], k) => {
      const cell = sphere(r, gelDeep, 18); cell.scale.y = 1.3; C.add(at(cell, x, y, z));
      C.add(at(sphere(r * 0.45, sting, 12), x, y, z));
      const coil = []; for (let j = 0; j <= 14; j++) { const t = j / 14, a = t * TAU * 2; coil.push([x + Math.cos(a) * r * 0.35, y - r * 0.6 + t * r * 1.2, z + Math.sin(a) * r * 0.35]); }
      C.add(tube(coil, 0.004, stingHot));
      const barb = new T.Mesh(new T.ConeGeometry(0.008, 0.04, 6), stingHot); C.add(at(barb, x, y + r * 1.35, z));
    });
    return { g };
  } };
})();
