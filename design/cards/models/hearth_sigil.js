// HEARTH SIGIL (the fire Mage's aura at Precision): the sigils' medallion (design/cards/models/_sigil.js) in dark bronze with a brass rim, a flame rune glowing in its middle, tongues of fire
// licking up off the top of its rim, embers rising, an orange gem. A PROPOSED look, for the owner's approval.
(function () {
  const { at, R, D, medallion, rune } = SIGIL;
  const flame = STY.glow('#ff5a12', 1.6), flameHot = STY.glow('#ffb347', 1.7), ember = STY.glow('#ff9a2e', 1.7);
  ITEMS.hearth_sigil = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(medallion({ face: '#5a3a22', rim: '#c9a35a', gem: '#ff9a3a', gemGlow: '#ff4a0c' }));
    // the flame rune: an outer flame and an inner flick
    P.add(rune([[[0, -0.5], [-0.32, -0.2], [-0.22, 0.2], [-0.05, 0.12], [0, 0.55], [0.14, 0.2], [0.3, 0.12], [0.32, -0.2], [0, -0.5]], [[0, -0.32], [-0.1, -0.08], [0.02, 0.18], [0.1, -0.1], [0, -0.32]]], '#ffb347'));
    // tongues of fire off the top of the rim: teardrop flames, an orange one with a yellow heart, leaning out
    const tear = (h, w) => { const pr = [[0, 0], [w * 0.8, h * 0.08], [w, h * 0.25], [w * 0.75, h * 0.5], [w * 0.35, h * 0.78], [0, h]].map(p => new T.Vector2(p[0], p[1])); return new T.LatheGeometry(pr, 16); };
    [-0.95, -0.62, -0.32, 0.32, 0.62, 0.95].forEach((a, i) => {
      const t = G(), h = 0.16 + (i % 3) * 0.05, x = (R + 0.01) * Math.sin(a), y = (R + 0.01) * Math.cos(a);
      t.add(new T.Mesh(tear(h, 0.05), flame)); const inner = new T.Mesh(tear(h * 0.6, 0.028), flameHot); inner.position.set(0, 0.01, 0.02); t.add(inner);
      t.position.set(x, y - 0.03, 0); t.rotation.z = -a * 0.85 + (i % 2 ? 0.12 : -0.12); P.add(t);
    });
    [[0.22, 0.6, 0.1, 0.014], [-0.26, 0.56, 0.06, 0.011], [0.38, 0.42, 0.04, 0.01], [-0.4, 0.38, 0.08, 0.012], [0.08, 0.68, 0.12, 0.008]].forEach(([x, y, z, r]) => P.add(at(sphere(r, ember, 10), x, y, z)));
    P.rotation.y = 0.35;
    return { g };
  } };
})();
