// PHASE BAND (the flux Mage's aura at Refined): the band in dark gunmetal, half out of phase: two ghost copies of its lips (violet, see-through) slipped above and below it and turned a little,
// fragments of its metal hovering off its flanks, violet motes on an orbit round it, a violet gem. The bands' family look: design/cards/models/_band.js (KINDLING BAND, approved 2026-11-07).
// A PROPOSED look, for the owner's approval.
(function () {
  const { std, ring, at, R1, H, FLANKS, onBand } = BAND;
  const ghost = new T.MeshStandardMaterial({ color: STY.col('#b48cff'), emissive: STY.col('#7a1cff'), emissiveIntensity: 0.7, metalness: 0.2, roughness: 0.3, transparent: true, opacity: 0.45 });
  const fragM = std('#3e3750', 0.9, 0.3), edge = STY.glow('#a866ff', 1.6), mote = STY.glow('#d2b0ff', 1.7), moteDim = STY.glow('#8a3cff', 1.4);
  ITEMS.phase_band = { exposure: 1.0, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    P.add(ring({ body: '#38324a', bodyMetal: 0.9, bodyRough: 0.3, lip: '#9c8cc4', bezel: '#b9a8e4', gem: '#c99bff', gemGlow: '#7a1cff', gemK: 0.95 }));
    // the ghost lips: the band slipping out of phase, up and down, a little turned
    [[H + 0.09, 0.12, 0.08], [-H - 0.08, -0.1, -0.06]].forEach(([y, rx, rz]) => { const t = new T.Mesh(new T.TorusGeometry(R1 + 0.01, 0.022, 10, 72), ghost); t.rotation.set(PI / 2 + rx, 0, rz); P.add(at(t, 0, y, 0)); });
    // fragments of its metal hovering off the flanks, each edged in violet
    FLANKS.forEach((a, i) => {
      const off = 0.07 + (i % 3) * 0.04, q = onBand(R1 + off, a, -0.1 + (i % 4) * 0.07), f = G();
      f.add(cbox(0.07 + (i % 2) * 0.03, 0.05 + (i % 3) * 0.02, 0.03, 0.006, fragM));
      const e = cbox(0.074 + (i % 2) * 0.03, 0.054 + (i % 3) * 0.02, 0.012, 0.003, edge); e.position.z = -0.012; f.add(e);
      f.position.set(q[0], q[1], q[2]); f.rotation.set(0.3 * (i % 2 ? 1 : -1), a, 0.4 * ((i % 3) - 1)); P.add(f);
    });
    // motes on a tilted orbit
    for (let k = 0; k < 7; k++) { const t = k / 7 * TAU + 0.4, R = R1 + 0.2; P.add(at(sphere(0.012 + (k % 3) * 0.004, k % 2 ? mote : moteDim, 10), R * Math.sin(t), 0.12 * Math.sin(t + 1.1) + 0.05, R * Math.cos(t))); }
    P.rotation.x = 0.05;
    return { g };
  } };
})();
