// PESTILENCE CROWN (the toxic Mage's aura at Prototype): the crowns' circlet (design/cards/models/_crown.js) in patinated bronze, its points curved bone thorns each tipped with a glowing green
// blister, goo dripping off the circlet, spores drifting, a big green gem. A PROPOSED look, for the owner's approval.
(function () {
  const { std, at, R1, H, circlet, points } = CROWN;
  const bone = std('#d8d2b0', 0.05, 0.55), blister = STY.glow('#7dff5a', 1.6), spore = STY.glow('#9cff7a', 1.6), sporeDim = STY.glow('#3ecc3e', 1.3);
  const goo = new T.MeshStandardMaterial({ color: STY.col('#6cff4a'), emissive: STY.col('#1f9a1f'), emissiveIntensity: 0.8, metalness: 0, roughness: 0.15 }); goo.envMapIntensity = 1.2;
  ITEMS.pestilence_crown = { exposure: 1.0, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    P.add(circlet({ body: '#3f4a30', bodyMetal: 0.75, bodyRough: 0.46, lip: '#8fae7a', gem: '#8dff6e', gemGlow: '#22cc22' }).g);
    points(P, (h, i) => {
      const t = G(), bend = 0.06 + (i % 2) * 0.03;   // a thorn curving outward, tapering (three tubes thinning)
      const p = [[0, 0, 0], [0, h * 0.4, bend * 0.3], [0, h * 0.75, bend], [0, h, bend * 1.8]];
      t.add(tube(p.slice(0, 3), 0.026, bone)); t.add(tube(p.slice(1, 4), 0.016, bone));
      t.add(at(sphere(0.026, blister, 12), 0, h + 0.01, bend * 1.9));
      return t;
    }, 0.2);
    [-0.6, -0.25, 0.25, 0.6, 2.4, 3.6].forEach((a, i) => {
      const len = 0.06 + (i % 3) * 0.04, x = (R1 + 0.012) * Math.sin(a), z = (R1 + 0.012) * Math.cos(a);
      P.add(at(cyl(0.016, 0.011, len, goo, 10), x, -H - len / 2, z)); const b = sphere(0.022, goo, 12); b.scale.y = 1.25; P.add(at(b, x, -H - len - 0.018, z));
    });
    [[-0.3, 0.55, 0.2, 0.013], [0.32, 0.5, 0.1, 0.011], [0.1, 0.68, 0.3, 0.009], [-0.42, 0.4, -0.1, 0.01], [0.42, 0.62, -0.2, 0.008]].forEach(([x, y, z, r], k) => P.add(at(sphere(r, k % 2 ? spore : sporeDim, 10), x, y, z)));
    P.rotation.x = 0.06;
    return { g };
  } };
})();
