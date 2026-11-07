// WINTER CROWN (the ice Mage's aura at Prototype): the crowns' circlet (design/cards/models/_crown.js) in pale silver, its points clear ice crystals (six-sided, pointed) with smaller ones at
// their feet, a glint of frost, a big ice-blue gem. A PROPOSED look, for the owner's approval.
(function () {
  const { at, circlet, points } = CROWN;
  const ice = new T.MeshStandardMaterial({ color: STY.col('#d6f2ff'), emissive: STY.col('#3d8fc4'), emissiveIntensity: 0.35, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.88, flatShading: true }); ice.envMapIntensity = 1.4;
  const glint = STY.glow('#e8f8ff', 1.7), glintBlue = STY.glow('#8fdcff', 1.5);
  function shard(len, r) { const g = G(); g.add(at(new T.Mesh(new T.CylinderGeometry(r, r * 0.9, len * 0.72, 6), ice), 0, len * 0.36, 0)); g.add(at(new T.Mesh(new T.ConeGeometry(r, len * 0.28, 6), ice), 0, len * 0.86, 0)); return g; }
  ITEMS.winter_crown = { exposure: 1.0, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    P.add(circlet({ body: '#8796a8', bodyMetal: 0.9, bodyRough: 0.24, lip: '#e3edf6', gem: '#c4ecff', gemGlow: '#3aaef0' }).g);
    points(P, (h, i) => {
      const t = G(); t.add(shard(h + 0.04, 0.038));
      const s1 = shard(h * 0.45, 0.022); s1.rotation.z = 0.5; s1.position.x = 0.02; t.add(s1);
      const s2 = shard(h * 0.35, 0.018); s2.rotation.z = -0.55; s2.position.x = -0.02; t.add(s2);
      return t;
    }, 0.2);
    [[0.26, 0.56, 0.3, 0.013], [-0.3, 0.5, 0.2, 0.011], [0.06, 0.68, 0.36, 0.009], [-0.44, 0.36, -0.1, 0.01], [0.44, 0.44, -0.16, 0.009]].forEach(([x, y, z, r], k) => P.add(at(sphere(r, k % 2 ? glintBlue : glint, 10), x, y, z)));
    P.rotation.x = 0.06;
    return { g };
  } };
})();
