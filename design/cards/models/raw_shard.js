// RAW SHARD (Series 2, Elemental, Unrefined: +8% special attack; docs/SERIES-2.md, drafted look: "a rough crystal shard that takes the wearer's element colour"): a rough, broken crystal in
// prism white with two small ones at its foot, lit from within, six glints in the six element colours caught in its faces (a baked picture cannot take one wearer's colour). The Elementals'
// look: design/cards/models/_elemental.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, whiteDim, ELS, shard, dark } = ELEM;
  ITEMS.raw_shard = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    const main = shard(0.72, 0.15, 1); main.rotation.z = -0.12; P.add(at(main, 0, -0.36, 0));
    const s1 = shard(0.32, 0.07, 2); s1.rotation.z = 0.6; P.add(at(s1, -0.12, -0.36, 0.04));
    const s2 = shard(0.26, 0.06, 3); s2.rotation.set(-0.4, 0, -0.7); P.add(at(s2, 0.12, -0.37, 0.05));
    P.add(at(sphere(0.06, whiteDim, 16), -0.02, 0.0, 0));   // the light inside
    [[0.07, -0.18, 0.11], [-0.09, -0.05, 0.1], [0.05, 0.08, 0.1], [-0.05, 0.2, 0.08], [0.1, 0.0, 0.06], [-0.11, -0.22, 0.06]].forEach((p, k) => P.add(at(sphere(0.016, ELS[k], 10), p[0], p[1], p[2])));
    const base = new T.Mesh(new T.DodecahedronGeometry(0.16, 0), dark); base.scale.set(1.2, 0.35, 0.9); P.add(at(base, 0, -0.4, 0));   // the rock it broke from
    return { g };
  } };
})();
