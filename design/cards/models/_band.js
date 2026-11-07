// THE BANDS (the Mage auras at Refined: KINDLING, SPORE, IONIC, CHILL, PHASE, LODESTONE; docs/UNIVERSAL-AND-PLAYER-CARDS.md): one family, so one ring. KINDLING BAND (approved by the owner,
// 2026-11-07) set the look: a thick metal arm-band with rolled lips top and bottom and a faceted gem in a four-pronged bezel at its front. Each element dresses it its own way, on its flanks,
// clear of the gem. (kindling_band.js keeps its own copy of this ring, as approved.)
const BAND = (function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const R0 = 0.36, R1 = 0.42, H = 0.17;
  // o: { body, bodyMetal, bodyRough, lip, bezel, gem, gemGlow, gemK }: hex colours
  function ring(o) {
    const g = G();
    const prof = [[R0, -H], [R1, -H], [R1, H], [R0, H], [R0, -H]].map(p => new T.Vector2(p[0], p[1]));
    const bodyM = std(o.body, o.bodyMetal == null ? 0.85 : o.bodyMetal, o.bodyRough == null ? 0.34 : o.bodyRough, { side: T.DoubleSide });
    g.add(new T.Mesh(new T.LatheGeometry(prof, 64), bodyM));
    const lip = std(o.lip, 1, 0.24);
    for (const y of [-H, H]) { const t = new T.Mesh(new T.TorusGeometry(R1 + 0.006, 0.026, 10, 72), lip); t.rotation.x = PI / 2; t.position.y = y; g.add(t); }
    const bz = G(); bz.position.set(0, 0, R1 + 0.02);
    const back = cyl(0.115, 0.115, 0.03, bodyM, 32); back.rotation.x = PI / 2; bz.add(back);
    const rim = new T.Mesh(new T.TorusGeometry(0.112, 0.022, 10, 40), std(o.bezel, 0.9, 0.3)); rim.position.z = 0.02; bz.add(rim);
    for (let k = 0; k < 4; k++) { const pr = cbox(0.03, 0.05, 0.03, 0.006, lip), a = k * TAU / 4 + PI / 4; pr.position.set(0.1 * Math.cos(a), 0.1 * Math.sin(a), 0.05); pr.rotation.z = a - PI / 2; bz.add(pr); }
    const gm = new T.MeshStandardMaterial({ color: STY.col(o.gem), emissive: STY.col(o.gemGlow), emissiveIntensity: o.gemK == null ? 0.85 : o.gemK, metalness: 0.1, roughness: 0.22, flatShading: true }); gm.envMapIntensity = 1.2;
    const gem = new T.Mesh(new T.OctahedronGeometry(0.1, 0), gm); gem.scale.set(0.82, 1.15, 0.62); gem.rotation.z = PI / 4; gem.position.z = 0.06; bz.add(gem);
    g.add(bz);
    return g;
  }
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const FLANKS = [-1.25, -1.02, -0.8, -0.58, 0.58, 0.8, 1.02, 1.25];   // where the dressing sits (radians round from the front, the gem's): KINDLING BAND's eight sticks
  const onBand = (R, a, y) => [R * Math.sin(a), y, R * Math.cos(a)];
  return { std, ring, at, R0, R1, H, FLANKS, onBand };
})();
