// THE FACILITY'S PROP STYLE KIT (shared by every family in design/props/models: loaded before them, never baked itself). Every prop is built from these so the whole facility reads as one set:
//   the look: a rundown 2010s tech-startup headquarters turned dark sci-fi facility. Clean pale laminate and steel (the walls are white-grey with teal bases), dark rubber and graphite for the heavy parts,
//   teal and cyan trims, violet and amber accents, warning yellow/black stripes, glass with a tint, and EMISSIVE screens and lamps; a little wear (scuffs, stains, tape) but never grime-brown. Hard-surface
//   forms: bevelled edges (cbox's third argument ~0.02-0.04), panel lines, handles, screws, vents, cables. Nothing is a plain box; nothing is cartoon-outlined. Dark rooms dim a sprite to a dark navy silhouette,
//   so detail should come from SHAPE and emissive glows, not from many dark-on-dark colours.
// USE:  STY.col('#4f9aa0')  an sRGB colour as a linear THREE.Color (three r128 reads hex as linear: always go through this for materials);  STY.mat.<name>  shared materials (never mutate them; STY.std(hex, metal,
// rough) makes a new one);  STY.glow(hex, k)  an emissive (unlit) material for lamps and screens;  STY.box(w, h, d, mat, bevel)  a bevelled box centred on its own origin (h is a height in UNITS: use px(H)
// for game pixels);  STY.stripes(w, h, mat) etc.  The palette follows the flat style's FP_PAL (js/facilitystyle.js): ink 16303a, cap f1f8fa, wallLit c6dae1, teal 4f9aa0, tealLit 6cb3bb, tealDark 2f6a73,
// case a9c4cc, caseLit dbeaee, cyan 31e8ff, blue 3a7bff, violet 9a5cff, amber f2b13a.
const STY = (function () {
  const col = hex => new T.Color(hex).convertSRGBToLinear();
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal == null ? 0.2 : metal, roughness: rough == null ? 0.5 : rough }, extra || {})); m.color = col(hex); m.envMapIntensity = 0.5; return m; };
  const glow = (hex, k) => { const m = new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }); m.color = col(hex); if (k != null && k !== 1) m.color.multiplyScalar(k); return m; };
  // a hazard stripe texture (yellow/black diagonals), repeated
  const stripeTex = (a, b) => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = b || '#14181d'; g.fillRect(0, 0, 64, 64); g.fillStyle = a || '#f2b13a'; for (let i = -1; i < 3; i++) { g.beginPath(); g.moveTo(i * 32, 64); g.lineTo(i * 32 + 16, 64); g.lineTo(i * 32 + 48, 0); g.lineTo(i * 32 + 32, 0); g.closePath(); g.fill(); } const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.encoding = T.sRGBEncoding; return t; };
  const mat = {
    laminate: std('#dbeaee', 0.05, 0.45), laminateDk: std('#a9c4cc', 0.05, 0.5), cap: std('#f1f8fa', 0.02, 0.4),
    steel: std('#8a929e', 0.9, 0.35), steelDk: std('#4a525e', 0.85, 0.4), graphite: std('#1c2027', 0.7, 0.45), rubber: std('#0c0e12', 0.1, 0.85), ink: std('#16303a', 0.3, 0.6),
    teal: std('#4f9aa0', 0.25, 0.4), tealLit: std('#6cb3bb', 0.25, 0.4), tealDk: std('#2f6a73', 0.3, 0.45), violet: std('#9a5cff', 0.2, 0.4), amber: std('#f2b13a', 0.3, 0.45), blue: std('#3a7bff', 0.2, 0.4),
    wood: std('#8a6a3a', 0.05, 0.7), woodDk: std('#5a4224', 0.05, 0.75), fabricBlue: std('#3a7bff', 0, 0.9), fabricViolet: std('#9a5cff', 0, 0.9), fabricTeal: std('#4f9aa0', 0, 0.9),
    glass: new T.MeshStandardMaterial({ color: col('#cfe6ff'), transparent: true, opacity: 0.28, metalness: 0, roughness: 0.04, depthWrite: false, envMapIntensity: 1.2 }),
    glassTint: new T.MeshStandardMaterial({ color: col('#8fe3f0'), transparent: true, opacity: 0.4, metalness: 0, roughness: 0.05, depthWrite: false, envMapIntensity: 1.2 }),
    screenOff: std('#05080c', 0.8, 0.15), cyan: glow('#31e8ff'), cyanDim: glow('#31e8ff', 0.55), amberGlow: glow('#f2b13a'), redGlow: glow('#ff4a3a'), greenGlow: glow('#43e0a8'), violetGlow: glow('#b57bff'), white: glow('#eaffff'),
  };
  const hazard = (rx, ry) => { const m = new T.MeshStandardMaterial({ map: stripeTex(), metalness: 0.2, roughness: 0.6 }); m.map.repeat.set(rx || 1, ry || 1); m.envMapIntensity = 0.4; return m; };
  const box = (w, h, d, m, b) => cbox(w, h, d, b == null ? 0.025 : b, m || mat.laminate);
  // a flat emissive screen plate facing +z (centred): a dark bezel and a lit face
  const screen = (w, h, hex) => { const g = G(); const bz = box(w, h, 0.03, mat.graphite, 0.01); g.add(bz); const f = new T.Mesh(new T.PlaneGeometry(w * 0.88, h * 0.82), glow(hex || '#3a7bff', 0.9)); f.position.z = 0.017; g.add(f); return g; };
  return { col, std, glow, mat, hazard, box, screen, stripeTex };
})();
