// RUPTURE FANG (the Brawler's opportunity card at Prototype: "breaks open a weakness"): the Brawlers' knuckle-duster (design/cards/models/_knuckle.js) with one great ivory fang in a steel
// collar rising out of its striking bar, cracked open up its front with the Brawler's red-orange light bursting out of the fissures, shards flaking off it, two lesser fangs at its sides.
// A PROPOSED look, for the owner's approval.
(function () {
  const { std, at, steel, bright, accent, TOP, mount } = KNUCKLE;
  const ivory = new T.MeshStandardMaterial({ color: STY.col('#efe6cf'), metalness: 0.05, roughness: 0.42, flatShading: true }); ivory.envMapIntensity = 0.9;
  const hot = STY.glow('#ffb347', 1.8), burst = STY.glow('#ff4a1c', 1.7);
  const BEND = 0.18;   // how far back the fang leans by its tip (its front, +z, faces the viewer)
  function fang(len, r) {
    const geo = new T.ConeGeometry(r, len, 8, 8), pos = geo.attributes.position;
    for (let k = 0; k < pos.count; k++) { const t = pos.getY(k) / len + 0.5; pos.setZ(k, pos.getZ(k) - t * t * len * BEND); }
    geo.computeVertexNormals(); const m = new T.Mesh(geo, ivory); m.position.y = len / 2; return m;
  }
  ITEMS.rupture_fang = { exposure: 1.0, az: 0.55, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(mount());
    const F = G(); F.position.set(0, TOP, -0.01);
    F.add(at(cyl(0.1, 0.11, 0.05, bright, 24), 0, 0.025, 0));
    const ring = new T.Mesh(new T.TorusGeometry(0.1, 0.012, 8, 32), accent); ring.rotation.x = PI / 2; F.add(at(ring, 0, 0.05, 0));
    const L = 0.46, R0 = 0.095, big = fang(L, R0); big.position.y += 0.05; F.add(big);
    // the fissures up its front: on the surface, following the lean
    const front = y => { const t = y / L, r = R0 * (1 - t); return [0, 0.05 + y, r * 0.98 - t * t * L * BEND]; };
    const fis = [0.04, 0.1, 0.16, 0.22, 0.28, 0.34].map((y, k) => { const p = front(y); p[0] = (k % 2 ? 0.012 : -0.01); return p; });
    for (let k = 0; k < fis.length - 1; k++) F.add(tube([fis[k], fis[k + 1]], 0.0085, k % 2 ? hot : burst));
    const br = (y, dx) => { const p = front(y), q = front(y + 0.05); return [[p[0], p[1], p[2]], [dx, q[1], q[2] - 0.01]]; };
    F.add(tube(br(0.1, 0.05), 0.006, burst)); F.add(tube(br(0.2, -0.045), 0.006, hot));
    [[0.08, 0.3, 0.06, 0.6], [-0.07, 0.36, 0.05, -0.8], [0.05, 0.44, 0.02, 1.2]].forEach(([x, y, z, r]) => { const s = new T.Mesh(new T.TetrahedronGeometry(0.02, 0), ivory); s.position.set(x, y, z); s.rotation.set(r, r * 1.3, r * 0.7); F.add(s); });
    P.add(F);
    for (const s of [-1, 1]) { const f = G(); f.position.set(s * 0.19, TOP, -0.01); f.add(at(cyl(0.05, 0.056, 0.035, bright, 18), 0, 0.017, 0)); const sm = fang(0.22, 0.045); sm.position.y += 0.03; f.add(sm); P.add(f); }
    return { g };
  } };
})();
