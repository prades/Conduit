// THE JELLY ITEMS (Series 2: GEL MEMBRANE, STINGER TENDRIL, NEMATOCYST, AMORPHOUS BODY; docs/SERIES-2.md): one family in the species' GEL ORCHID (docs/UI-STYLE.md): see-through orchid gel
// lit from inside, a pale pink glow where it stings, and bright silver for whatever holds it. The Crustaceans, Mollusks, Elementals and Drones (approved 2026-11-07) set the way: one family's
// colours, each item from its drafted look.
const JELLY = (function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const gel = new T.MeshStandardMaterial({ color: STY.col('#cf7ff5'), emissive: STY.col('#a03ee8'), emissiveIntensity: 0.55, metalness: 0, roughness: 0.12, transparent: true, opacity: 0.74, side: T.DoubleSide }); gel.envMapIntensity = 1.0;
  const gelDeep = new T.MeshStandardMaterial({ color: STY.col('#b052ea'), emissive: STY.col('#8226d6'), emissiveIntensity: 0.7, metalness: 0, roughness: 0.15, transparent: true, opacity: 0.85 }); gelDeep.envMapIntensity = 1.0;
  const silver = std('#d6dbe2', 1, 0.2), glass = new T.MeshStandardMaterial({ color: STY.col('#eef4ff'), metalness: 0, roughness: 0.04, transparent: true, opacity: 0.3, side: T.DoubleSide }); glass.envMapIntensity = 1.8;
  const sting = STY.glow('#ffb8e8', 1.7), stingHot = STY.glow('#ffffff', 1.8), field = STY.glow('#e09bff', 1.6);
  return { std, at, gel, gelDeep, silver, glass, sting, stingHot, field };
})();
