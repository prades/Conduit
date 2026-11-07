// THE MOLLUSK ITEMS (Series 2: MANTLE GEL, NACRE PEARL, SIPHON SLIME, REGROWTH SAC; docs/SERIES-2.md): one family in the species' NACRE (docs/UI-STYLE.md, the species colours): mother-of-
// pearl that shifts white to pink to sea-green across a surface, clear glass, brass fittings, and a sea-green glow for what lives inside. The Crustaceans (approved 2026-11-07) set the way:
// one family's colours, each item from its drafted look.
const MOLL = (function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const nacreM = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.18, vertexColors: true }); nacreM.envMapIntensity = 0.9;
  const glass = new T.MeshStandardMaterial({ color: STY.col('#dff4f2'), metalness: 0, roughness: 0.04, transparent: true, opacity: 0.28, side: T.DoubleSide }); glass.envMapIntensity = 1.8;
  const brass = std('#c9a35a', 1, 0.26), steel = std('#aeb6c0', 1, 0.24), cork = std('#8a6a48', 0, 0.85);
  const glow = STY.glow('#7dffc4', 1.6), glowDim = STY.glow('#2ec48e', 1.3);
  const W = STY.col('#f3eee8'), PINK = STY.col('#ee9fbe'), SEA = STY.col('#7fdcc8'), LIL = STY.col('#a996ea');
  // colour a geometry in nacre: bands of white, pink, sea-green and lilac running across it, by position
  function nacre(geo, scale) {
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), k = scale || 6;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), t = (Math.sin(x * k + y * k * 0.7) + Math.sin(z * k * 1.3 - y * k * 0.4)) * 0.25 + 0.5;
      c.copy(W); if (t < 0.4) c.lerp(PINK, Math.min(1, (0.4 - t) * 3.2)); else if (t > 0.6) c.lerp(SEA, Math.min(1, (t - 0.6) * 3.2)); else c.lerp(LIL, Math.max(0, 0.1 - Math.abs(t - 0.5)) * 6);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); return geo;
  }
  const lathe = (pts, seg) => new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg || 48);
  return { std, at, nacreM, glass, brass, steel, cork, glow, glowDim, nacre, lathe };
})();
