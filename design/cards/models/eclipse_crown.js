// ECLIPSE CROWN (the flux Mage's aura at Prototype): the crowns' circlet (design/cards/models/_crown.js) in dark gunmetal, its points black obsidian blades edged in violet; over the gem at the
// front, rising from the tallest point, a black disc ringed by a glowing violet corona (the eclipse); violet motes on an orbit, a big violet gem. A PROPOSED look, for the owner's approval.
(function () {
  const { std, at, R1, H, circlet, points } = CROWN;
  const obsidian = new T.MeshStandardMaterial({ color: STY.col('#1d1828'), metalness: 0.6, roughness: 0.18, flatShading: true }); obsidian.envMapIntensity = 1.3;
  const edge = STY.glow('#a866ff', 1.6), corona = STY.glow('#b37aff', 1.7), coronaDim = STY.glow('#7a1cff', 1.4), mote = STY.glow('#d2b0ff', 1.7), disc = std('#08060c', 0.3, 0.6);
  ITEMS.eclipse_crown = { exposure: 1.0, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    P.add(circlet({ body: '#2e2840', bodyMetal: 0.9, bodyRough: 0.3, lip: '#9c8cc4', gem: '#c99bff', gemGlow: '#7a1cff' }).g);
    points(P, (h, i) => {
      const t = G(), blade = new T.Mesh(new T.ConeGeometry(0.045, h, 3), obsidian); blade.position.y = h / 2; t.add(blade);
      const e = new T.Mesh(new T.ConeGeometry(0.05, h * 0.25, 3), edge); e.position.y = h * 0.12; t.add(e);
      return t;
    }, 0.2);
    // the eclipse over the front: a black disc, a corona round it
    const ec = G(); ec.position.set(0, H + 0.38, R1 - 0.02); ec.scale.setScalar(0.82);
    const d = cyl(0.11, 0.11, 0.02, disc, 40); d.rotation.x = PI / 2; ec.add(d);
    ec.add(new T.Mesh(new T.TorusGeometry(0.125, 0.012, 8, 48), corona));
    ec.add(new T.Mesh(new T.TorusGeometry(0.15, 0.02, 8, 48), coronaDim));
    for (let k = 0; k < 10; k++) { const a = k * TAU / 10, ray = new T.Mesh(new T.ConeGeometry(0.012, 0.05 + (k % 2) * 0.03, 4), corona); ray.position.set(0.17 * Math.cos(a), 0.17 * Math.sin(a), 0); ray.rotation.z = a - PI / 2; ec.add(ray); }
    P.add(ec);
    for (let k = 0; k < 7; k++) { const t = k / 7 * TAU + 0.4, rr = R1 + 0.2; P.add(at(sphere(0.012 + (k % 3) * 0.004, mote, 10), rr * Math.sin(t), 0.1 * Math.sin(t + 1.1) + 0.12, rr * Math.cos(t))); }
    P.rotation.x = 0.06;
    return { g };
  } };
})();
