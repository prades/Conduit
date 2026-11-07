// THE CROWNS (the Mage auras at Prototype, the ones that also spread the element's status: INFERNO, PESTILENCE, TEMPEST, WINTER, ECLIPSE, MONOLITH; docs/UNIVERSAL-AND-PLAYER-CARDS.md):
// one family, the top of the climb from the bands and sigils (both approved 2026-11-07). A circlet with rolled lips and a big faceted gem in a four-pronged bezel at its front (the band's
// gem, larger); eight points rise round it, the one over the gem the tallest; each element shapes its points and dresses them its own way.
const CROWN = (function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const R0 = 0.38, R1 = 0.44, H = 0.1;   // the circlet, from y = -H to y = H
  // o: { body, bodyMetal, bodyRough, lip, gem, gemGlow }: hex colours
  function circlet(o) {
    const g = G(), lip = std(o.lip, 1, 0.24);
    const prof = [[R0, -H], [R1, -H], [R1, H], [R0, H], [R0, -H]].map(p => new T.Vector2(p[0], p[1]));
    const bodyM = std(o.body, o.bodyMetal == null ? 0.85 : o.bodyMetal, o.bodyRough == null ? 0.32 : o.bodyRough, { side: T.DoubleSide });
    g.add(new T.Mesh(new T.LatheGeometry(prof, 72), bodyM));
    for (const y of [-H, H]) { const t = new T.Mesh(new T.TorusGeometry(R1 + 0.006, 0.024, 10, 80), lip); t.rotation.x = PI / 2; t.position.y = y; g.add(t); }
    const bz = G(); bz.position.set(0, 0.01, R1 + 0.02);
    const rim = new T.Mesh(new T.TorusGeometry(0.1, 0.02, 10, 40), lip); rim.position.z = 0.02; bz.add(rim);
    for (let k = 0; k < 4; k++) { const pr = cbox(0.028, 0.045, 0.028, 0.006, lip), a = k * TAU / 4 + PI / 4; pr.position.set(0.09 * Math.cos(a), 0.09 * Math.sin(a), 0.045); pr.rotation.z = a - PI / 2; bz.add(pr); }
    const gm = new T.MeshStandardMaterial({ color: STY.col(o.gem), emissive: STY.col(o.gemGlow), emissiveIntensity: 0.9, metalness: 0.1, roughness: 0.2, flatShading: true }); gm.envMapIntensity = 1.2;
    const gem = new T.Mesh(new T.OctahedronGeometry(0.095, 0), gm); gem.scale.set(0.85, 1.15, 0.62); gem.rotation.z = PI / 4; gem.position.z = 0.055; bz.add(gem);
    g.add(bz);
    return { g, lip, bodyM, gemM: gm };
  }
  // the eight points: angle (0 = over the gem, at the front) and height; a point is built by `make(h, i)` with its foot at the origin, pointing up, and set on the circlet's top
  function points(P, make, base) {
    for (let i = 0; i < 8; i++) {
      const a = i * TAU / 8, h = (base || 0.2) * (i === 0 ? 1.45 : i % 2 ? 0.8 : 1.1), p = make(h, i, a), r = R1 - 0.02;
      p.position.set(r * Math.sin(a), H, r * Math.cos(a)); p.rotation.y = a; P.add(p);
    }
  }
  return { std, at, R0, R1, H, circlet, points };
})();
