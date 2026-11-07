// THE DRONE ITEMS (Series 2: SERVO OIL, GYRO STABILIZER, HUNTER OPTICS, OVERCLOCK CHIP; docs/SERIES-2.md): one family in the species' GUNMETAL (docs/UI-STYLE.md): dark blue-grey machined
// metal, brushed steel, black rubber, small cyan status lights; the drafted looks add their own (amber oil, a red reticle, a hot orange glow). The Crustaceans, Mollusks and Elementals
// (approved 2026-11-07) set the way: one family's colours, each item from its drafted look.
const DRONE = (function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const gun = std('#4a5260', 0.9, 0.34), gunDark = std('#2c323b', 0.85, 0.4), steel = std('#b4bcc6', 1, 0.22), rubber = std('#16181c', 0.1, 0.8);
  const cyan = STY.glow('#3fe0ff', 1.7), red = STY.glow('#ff2a2a', 1.8), hot = STY.glow('#ff7a1a', 1.7), hotCore = STY.glow('#ffd27a', 1.8);
  const oil = new T.MeshStandardMaterial({ color: STY.col('#d99a1e'), emissive: STY.col('#5a3a06'), emissiveIntensity: 0.4, metalness: 0.1, roughness: 0.08 }); oil.envMapIntensity = 1.4;
  const lens = new T.MeshStandardMaterial({ color: STY.col('#203048'), emissive: STY.col('#0a1830'), emissiveIntensity: 0.4, metalness: 0.5, roughness: 0.05 }); lens.envMapIntensity = 1.8;
  return { std, at, gun, gunDark, steel, rubber, cyan, red, hot, hotCore, oil, lens };
})();
