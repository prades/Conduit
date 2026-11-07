// INFERNO CROWN (the fire Mage's aura at Prototype): the crowns' circlet (design/cards/models/_crown.js) in gold over dark bronze, its points tapered gold spikes each holding an ember orb with a
// flame burning off it, embers rising, a big orange gem. A PROPOSED look, for the owner's approval.
(function () {
  const { std, at, circlet, points } = CROWN;
  const gold = std('#d9ae55', 1, 0.24), orb = STY.glow('#ff7a22', 1.6), flame = STY.glow('#ff5a12', 1.6), flameHot = STY.glow('#ffb347', 1.7), ember = STY.glow('#ff9a2e', 1.7);
  const tear = (h, w) => { const pr = [[0, 0], [w * 0.8, h * 0.08], [w, h * 0.25], [w * 0.75, h * 0.5], [w * 0.35, h * 0.78], [0, h]].map(p => new T.Vector2(p[0], p[1])); return new T.LatheGeometry(pr, 16); };
  ITEMS.inferno_crown = { exposure: 1.0, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    P.add(circlet({ body: '#5a3a22', lip: '#d9ae55', gem: '#ff9a3a', gemGlow: '#ff4a0c' }).g);
    points(P, (h, i) => {
      const t = G(); t.add(at(new T.Mesh(new T.ConeGeometry(0.04, h, 4), gold), 0, h / 2, 0));
      t.add(at(sphere(0.03, orb, 14), 0, h + 0.01, 0));
      const f = new T.Mesh(tear(0.1 + (i % 3) * 0.03, 0.03), flame); f.position.y = h + 0.02; t.add(f);
      const fi = new T.Mesh(tear(0.06 + (i % 3) * 0.02, 0.016), flameHot); fi.position.set(0, h + 0.025, 0.012); t.add(fi);
      return t;
    }, 0.2);
    [[0.2, 0.62, 0.3, 0.014], [-0.26, 0.58, 0.2, 0.011], [0.34, 0.5, -0.1, 0.01], [-0.1, 0.7, 0.1, 0.012], [0.05, 0.66, 0.4, 0.008]].forEach(([x, y, z, r]) => P.add(at(sphere(r, ember, 10), x, y, z)));
    P.rotation.x = 0.06;
    return { g };
  } };
})();
