// MONOLITH CROWN (the core Mage's aura at Prototype): the crowns' circlet (design/cards/models/_crown.js) in dark wrought iron, its points standing stones (rough monoliths, the tallest over the
// gem) with glowing teal veins, a big teal gem. A PROPOSED look, for the owner's approval.
(function () {
  const { at, circlet, points } = CROWN;
  const stone = new T.MeshStandardMaterial({ color: STY.col('#5f636a'), metalness: 0.2, roughness: 0.75, flatShading: true }); stone.envMapIntensity = 0.8;
  const vein = STY.glow('#19e6c1', 1.5);
  ITEMS.monolith_crown = { exposure: 1.05, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    P.add(circlet({ body: '#34383e', bodyMetal: 0.7, bodyRough: 0.5, lip: '#8b939c', gem: '#7fffe6', gemGlow: '#00b894' }).g);
    points(P, (h, i) => {
      const t = G(), w = 0.07 + (i === 0 ? 0.02 : 0), geo = new T.BoxGeometry(w, h, 0.06, 1, 3, 1), pos = geo.attributes.position;
      for (let k = 0; k < pos.count; k++) { const y = pos.getY(k) / h + 0.5; pos.setX(k, pos.getX(k) * (1 - y * 0.25) + Math.sin(k * 7.1 + i) * 0.004); pos.setZ(k, pos.getZ(k) * (1 - y * 0.2)); }   // tapering a little, a rough face
      geo.computeVertexNormals(); const m = new T.Mesh(geo, stone); m.position.y = h / 2; m.rotation.z = (i % 3 - 1) * 0.05; t.add(m);
      t.add(tube([[-w * 0.3, h * 0.2, 0.032], [w * 0.1, h * 0.5, 0.033], [-w * 0.15, h * 0.8, 0.032]], 0.004, vein));
      return t;
    }, 0.19);
    P.rotation.x = 0.06;
    return { g };
  } };
})();
