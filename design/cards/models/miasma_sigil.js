// MIASMA SIGIL (the toxic Mage's aura at Precision): the sigils' medallion (design/cards/models/_sigil.js) in patinated bronze, a rune of three droplets round a ring glowing green, toxic goo
// dripping off the bottom of its rim, a green haze round it, a green gem. A PROPOSED look, for the owner's approval.
(function () {
  const { at, R, D, medallion, rune } = SIGIL;
  const goo = new T.MeshStandardMaterial({ color: STY.col('#6cff4a'), emissive: STY.col('#1f9a1f'), emissiveIntensity: 0.8, metalness: 0, roughness: 0.15 }); goo.envMapIntensity = 1.2;
  const haze = new T.MeshStandardMaterial({ color: STY.col('#7dff6a'), emissive: STY.col('#2ecc2e'), emissiveIntensity: 0.6, transparent: true, opacity: 0.18, roughness: 1 });
  ITEMS.miasma_sigil = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(medallion({ face: '#3f4a30', faceMetal: 0.75, faceRough: 0.46, rim: '#8fae7a', gem: '#8dff6e', gemGlow: '#22cc22' }));
    // the rune: a small ring and three droplets round it
    const drop = a => { const c = [Math.cos(a), Math.sin(a)], s = [-c[1], c[0]], o = 0.2, L = 0.5; return [[c[0] * o, c[1] * o], [c[0] * 0.36 + s[0] * 0.13, c[1] * 0.36 + s[1] * 0.13], [c[0] * L, c[1] * L], [c[0] * 0.36 - s[0] * 0.13, c[1] * 0.36 - s[1] * 0.13], [c[0] * o, c[1] * o]]; };
    const ring = []; for (let k = 0; k <= 16; k++) ring.push([0.12 * Math.cos(k * TAU / 16), 0.12 * Math.sin(k * TAU / 16)]);
    P.add(rune([ring, drop(PI / 2), drop(PI / 2 + TAU / 3), drop(PI / 2 + 2 * TAU / 3)], '#8dff6e'));
    // goo dripping off the bottom of the rim
    [-0.5, -0.22, 0.05, 0.3, 0.55].forEach((a, i) => {
      const len = 0.08 + (i % 3) * 0.05, x = (R + 0.01) * Math.sin(a), y = -(R + 0.01) * Math.cos(a);
      const d = cyl(0.018, 0.012, len, goo, 10); P.add(at(d, x, y - len / 2, 0.01));
      const b = sphere(0.026, goo, 12); b.scale.y = 1.25; P.add(at(b, x, y - len - 0.02, 0.01));
    });
    const spore = STY.glow('#9cff7a', 1.6), sporeDim = STY.glow('#3ecc3e', 1.3);
    [[-0.44, 0.34, 0.1, 0.014], [0.46, 0.2, 0.06, 0.012], [0.3, 0.5, 0.1, 0.01], [-0.5, -0.1, 0.08, 0.011], [0.52, -0.28, 0.04, 0.009], [-0.2, 0.56, 0.12, 0.008]].forEach(([x, y, z, r], k) => P.add(at(sphere(r, k % 2 ? spore : sporeDim, 10), x, y, z)));
    P.rotation.y = 0.35;
    return { g };
  } };
})();
