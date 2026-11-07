// SPORE BAND (the toxic Mage's aura at Refined): the band in tarnished, patinated bronze, fungus growing on its flanks (clusters of capped spore pods, their gills glowing green), a toxic-green
// gem, spores drifting up. The bands' family look: design/cards/models/_band.js (KINDLING BAND, approved 2026-11-07). A PROPOSED look, for the owner's approval.
(function () {
  const { std, ring, at, R1, FLANKS, onBand } = BAND;
  const stemM = std('#b9b48a', 0.05, 0.7), capM = std('#3a4420', 0.1, 0.5), spotM = STY.glow('#8dff6e', 1.5), gill = STY.glow('#66ff66', 1.5), spore = STY.glow('#9cff7a', 1.6), sporeDim = STY.glow('#3ecc3e', 1.3);
  function pod(h, r) {   // a spore pod: a stem, a domed cap, a glowing ring of gills under it, pale spots
    const g = G();
    g.add(at(cyl(r * 0.32, r * 0.42, h, stemM, 10), 0, h / 2, 0));
    const cap = sphere(r, capM, 18); cap.scale.set(1.15, 0.42, 1.15); g.add(at(cap, 0, h, 0));
    const gl = new T.Mesh(new T.TorusGeometry(r * 0.95, r * 0.12, 6, 24), gill); gl.rotation.x = PI / 2; g.add(at(gl, 0, h - r * 0.08, 0));
    for (let k = 0; k < 5; k++) { const a = k * 1.4, s = sphere(r * 0.14, spotM, 8); s.scale.y = 0.5; g.add(at(s, r * 0.6 * Math.cos(a), h + r * 0.3, r * 0.6 * Math.sin(a))); }
    return g;
  }
  ITEMS.spore_band = { exposure: 1.0, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    P.add(ring({ body: '#4a5236', bodyMetal: 0.75, bodyRough: 0.46, lip: '#8fae7a', bezel: '#a6c48a', gem: '#8dff6e', gemGlow: '#22cc22' }));
    const sizes = [[0.16, 0.085], [0.24, 0.11], [0.12, 0.07], [0.2, 0.095], [0.2, 0.095], [0.12, 0.07], [0.26, 0.115], [0.15, 0.08]];
    FLANKS.forEach((a, i) => {
      const [h, r] = sizes[i], p = pod(h, r), q = onBand(R1 + 0.01, a, -0.12 + (i % 3) * 0.1);
      p.position.set(q[0], q[1], q[2]); p.rotation.set(0, a, 0); p.rotateX(1.2 - (i % 2) * 0.35); P.add(p);   // growing out of the band, tipped up
    });
    [[0.2, 0.36, 0.42, 0.016], [-0.16, 0.46, 0.4, 0.012], [0.04, 0.55, 0.44, 0.01], [-0.32, 0.34, 0.3, 0.013], [0.34, 0.5, 0.28, 0.009], [0.1, 0.42, 0.5, 0.008]]
      .forEach(([x, y, z, r], k) => P.add(at(sphere(r, k % 2 ? spore : sporeDim, 10), x, y, z)));
    P.rotation.x = 0.05;
    return { g };
  } };
})();
