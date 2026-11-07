// CHILL BAND (the ice Mage's aura at Refined): the band in pale silver, clusters of clear ice crystals (six-sided, pointed) growing out of its flanks, an ice-blue gem, a glint of frost.
// The bands' family look: design/cards/models/_band.js (KINDLING BAND, approved 2026-11-07). A PROPOSED look, for the owner's approval.
(function () {
  const { std, ring, at, R1, FLANKS, onBand } = BAND;
  const ice = new T.MeshStandardMaterial({ color: STY.col('#d6f2ff'), emissive: STY.col('#3d8fc4'), emissiveIntensity: 0.35, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.86, flatShading: true }); ice.envMapIntensity = 1.4;
  const glint = STY.glow('#e8f8ff', 1.7), glintBlue = STY.glow('#8fdcff', 1.5);
  function shard(len, r) {   // a crystal: a six-sided prism with a pointed tip, its foot at the origin, pointing up
    const g = G();
    g.add(at(new T.Mesh(new T.CylinderGeometry(r, r * 0.9, len * 0.72, 6), ice), 0, len * 0.36, 0));
    g.add(at(new T.Mesh(new T.ConeGeometry(r, len * 0.28, 6), ice), 0, len * 0.86, 0));
    return g;
  }
  ITEMS.chill_band = { exposure: 1.0, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    P.add(ring({ body: '#93a2b3', bodyMetal: 0.9, bodyRough: 0.24, lip: '#e3edf6', bezel: '#eef5fb', gem: '#c4ecff', gemGlow: '#3aaef0' }));
    FLANKS.forEach((a, i) => {
      const q = onBand(R1 + 0.005, a, -0.06 + (i % 2) * 0.08), cl = G(); cl.position.set(q[0], q[1], q[2]); cl.rotation.set(0, a, 0);
      [[0.3 + (i % 3) * 0.05, 0.04, 0.95], [0.18, 0.028, 0.5], [0.14, 0.024, 1.4]].forEach(([len, r, tilt], k) => { const s = shard(len, r); s.rotation.set(tilt * 0.9, 0, (k - 1) * 0.5); cl.add(s); });
      P.add(cl);
    });
    [[0.24, 0.36, 0.44, 0.014], [-0.2, 0.42, 0.42, 0.011], [0.02, 0.5, 0.46, 0.009], [-0.34, 0.3, 0.3, 0.01]].forEach(([x, y, z, r], k) => P.add(at(sphere(r, k % 2 ? glintBlue : glint, 10), x, y, z)));
    P.rotation.x = 0.05;
    return { g };
  } };
})();
