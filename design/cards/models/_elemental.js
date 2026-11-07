// THE ELEMENTAL ITEMS (Series 2: RAW SHARD, FOCUSING PRISM, ATTUNED CORE, STORM HEART; docs/SERIES-2.md): one family in the species' PRISM WHITE (docs/UI-STYLE.md): clear white crystal and
// white light, brass and steel fittings, and the six element colours (fire, toxic, electric, ice, flux, core) as small lights and split beams. Two drafted looks ask for "the wearer's element
// colour": a baked picture cannot change with its wearer, so those carry all six. The Crustaceans and Mollusks (approved 2026-11-07) set the way: one family's colours.
const ELEM = (function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const crystal = new T.MeshStandardMaterial({ color: STY.col('#f4f7ff'), emissive: STY.col('#9fb4e8'), emissiveIntensity: 0.18, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.82, flatShading: true }); crystal.envMapIntensity = 1.6;
  const glass = new T.MeshStandardMaterial({ color: STY.col('#eef6ff'), metalness: 0, roughness: 0.03, transparent: true, opacity: 0.45, flatShading: true }); glass.envMapIntensity = 1.8;
  const brass = std('#c9a35a', 1, 0.26), steel = std('#aeb6c0', 1, 0.24), dark = std('#3a3f47', 0.8, 0.35);
  const white = STY.glow('#ffffff', 1.8), whiteDim = STY.glow('#cfe0ff', 1.4);
  const ELS = ['#ff3300', '#66ff66', '#ffee33', '#99ddff', '#9933ff', '#00ccaa'].map(h => STY.glow(h, 1.6));   // fire, toxic, electric, ice, flux, core
  // a rough crystal: a six-sided column with a pointed top, its faces jittered so it reads as broken, not cut
  function shard(len, r, seed) {
    const geo = new T.CylinderGeometry(r * 0.7, r, len * 0.75, 6, 3), pos = geo.attributes.position, rnd = k => Math.sin(k * 12.9898 + seed * 78.233) * 0.5;
    for (let i = 0; i < pos.count; i++) pos.setXYZ(i, pos.getX(i) * (1 + rnd(i) * 0.25), pos.getY(i) + rnd(i + 7) * len * 0.03, pos.getZ(i) * (1 + rnd(i + 3) * 0.25));
    geo.computeVertexNormals();
    const g = G(); g.add(at(new T.Mesh(geo, crystal), 0, len * 0.375, 0));
    g.add(at(new T.Mesh(new T.ConeGeometry(r * 0.7, len * 0.3, 6), crystal), 0, len * 0.9, 0));
    return g;
  }
  return { std, at, crystal, glass, brass, steel, dark, white, whiteDim, ELS, shard };
})();
