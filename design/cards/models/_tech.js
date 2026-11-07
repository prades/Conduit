// THE TECHNICIAN ITEMS (Series 2: SPARE PARTS KIT, CAPACITOR BANK, FIELD MULTITOOL, DOUBLE CELL; docs/SERIES-2.md): one family in the workshop: safety-yellow and gunmetal casings, brushed
// steel and brass parts, black rubber grips, and the Technician's ice-blue (#8fe3ff, the role colour) for charge and lit bits. The species families (approved 2026-11-07) set the way: one
// family's colours, each item from its drafted look.
const TECH = (function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const yellow = std('#f2b632', 0.35, 0.4), gun = std('#4a5260', 0.9, 0.34), dark = std('#2a2f37', 0.8, 0.4), steel = std('#b8c0ca', 1, 0.22), brass = std('#c9a35a', 1, 0.26), rubber = std('#16181c', 0.1, 0.8);
  const charge = STY.glow('#8fe3ff', 1.7), chargeDim = STY.glow('#3fa8d0', 1.3), white = STY.glow('#ffffff', 1.8);
  return { std, at, yellow, gun, dark, steel, brass, rubber, charge, chargeDim, white };
})();
