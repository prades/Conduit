// AMORPHOUS BODY (Series 2, Jelly, Prototype: Absorb; docs/SERIES-2.md, drafted look: "a blob of gel holding its shape inside a ring field"): a soft lumpy blob of orchid gel with a deeper core,
// held in the air by three glowing field rings round it at angles, small motes caught in the field. The Jellies' look: design/cards/models/_jelly.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, gel, gelDeep, sting, field } = JELLY;
  ITEMS.amorphous_body = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    const geo = new T.SphereGeometry(0.22, 64, 48), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = 1 + 0.12 * Math.sin(x * 9 + 1) * Math.sin(y * 7 - z * 5) + 0.08 * Math.sin(z * 11 + y * 3); pos.setXYZ(i, x * k * 1.1, y * k * 0.92, z * k); }
    geo.computeVertexNormals(); P.add(new T.Mesh(geo, gel));
    const core = sphere(0.11, gelDeep, 24); core.scale.set(1.2, 0.9, 1); P.add(core);
    P.add(at(sphere(0.04, sting, 14), 0.02, 0.01, 0.02));
    [[PI / 2, 0, 0, 0.34], [PI / 2 + 0.7, 0.4, 0, 0.37], [PI / 2 - 0.6, -0.6, 0.3, 0.4]].forEach(([rx, ry, rz, r]) => { const f = new T.Mesh(new T.TorusGeometry(r, 0.008, 8, 80), field); f.rotation.set(rx, ry, rz); P.add(f); });
    [[0.33, 0.1, 0.1], [-0.3, -0.12, 0.15], [0.05, 0.36, -0.1], [-0.12, -0.3, -0.2], [0.24, -0.24, 0.12]].forEach(([x, y, z]) => P.add(at(sphere(0.012, sting, 8), x, y, z)));
    return { g };
  } };
})();
