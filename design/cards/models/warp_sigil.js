// WARP SIGIL (the flux Mage's aura at Precision): the sigils' medallion (design/cards/models/_sigil.js) in dark gunmetal, a spiral rune glowing violet, a ghost of its rim slipped out of phase
// behind it, fragments of metal hovering round it, violet motes, a violet gem. A PROPOSED look, for the owner's approval.
(function () {
  const { std, at, R, D, medallion, rune } = SIGIL;
  const ghost = new T.MeshStandardMaterial({ color: STY.col('#b48cff'), emissive: STY.col('#7a1cff'), emissiveIntensity: 0.7, metalness: 0.2, roughness: 0.3, transparent: true, opacity: 0.42 });
  const fragM = std('#3e3750', 0.9, 0.3), edge = STY.glow('#a866ff', 1.6), mote = STY.glow('#d2b0ff', 1.7);
  ITEMS.warp_sigil = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(medallion({ face: '#2e2840', faceMetal: 0.9, faceRough: 0.3, rim: '#9c8cc4', gem: '#c99bff', gemGlow: '#7a1cff' }));
    const sp = []; for (let k = 0; k <= 40; k++) { const t = k / 40, a = t * TAU * 1.75, r = 0.06 + t * 0.5; sp.push([r * Math.cos(a), r * Math.sin(a)]); }
    P.add(rune([sp], '#c99bff', 1.7));
    const gr = new T.Mesh(new T.TorusGeometry(R + 0.02, 0.03, 10, 80), ghost); gr.position.set(0.08, -0.05, -0.12); gr.rotation.set(0.15, 0.2, 0.1); P.add(gr);
    [[-0.5, 0.25, 0.05], [0.52, 0.3, -0.02], [0.46, -0.36, 0.06], [-0.44, -0.38, 0.02], [-0.58, -0.05, -0.04]].forEach(([x, y, z], i) => {
      const f = G(); f.add(cbox(0.07 + (i % 2) * 0.03, 0.05 + (i % 3) * 0.02, 0.03, 0.006, fragM));
      const e = cbox(0.074 + (i % 2) * 0.03, 0.054 + (i % 3) * 0.02, 0.012, 0.003, edge); e.position.z = -0.012; f.add(e);
      f.position.set(x, y, z); f.rotation.set(0.4 * (i % 2 ? 1 : -1), 0.3 * i, 0.5 * ((i % 3) - 1)); P.add(f);
    });
    for (let k = 0; k < 6; k++) { const a = k / 6 * TAU + 0.3, rr = R + 0.17; P.add(at(sphere(0.012 + (k % 3) * 0.004, mote, 10), rr * Math.cos(a), rr * Math.sin(a), 0.1 * Math.sin(a * 2))); }
    P.rotation.y = 0.35;
    return { g };
  } };
})();
