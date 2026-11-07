// THE SIGILS (the Mage auras at Precision: HEARTH, MIASMA, VOLTAIC, GLACIAL, WARP, KEYSTONE; docs/UNIVERSAL-AND-PLAYER-CARDS.md): one family, one medallion, a step up from the bands
// (approved 2026-11-07). A thick round medallion standing upright, a heavy rolled rim and a fine inner ring in bright metal, the element's rune raised and glowing in its middle, a faceted
// gem in a bezel at the top where it hangs from a bail and a short chain; each element dresses its rim its own way.
const SIGIL = (function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const R = 0.36, D = 0.08;   // the medallion's radius and thickness; its face at z = D / 2
  // o: { face, faceMetal, faceRough, rim, gem, gemGlow }: hex colours
  function medallion(o) {
    const g = G(), rimM = std(o.rim, 1, 0.24);
    const disc = cyl(R, R, D, std(o.face, o.faceMetal == null ? 0.85 : o.faceMetal, o.faceRough == null ? 0.36 : o.faceRough), 64); disc.rotation.x = PI / 2; g.add(disc);
    g.add(at(new T.Mesh(new T.TorusGeometry(R, 0.036, 12, 80), rimM), 0, 0, 0));
    g.add(at(new T.Mesh(new T.TorusGeometry(R * 0.74, 0.013, 8, 64), rimM), 0, 0, D / 2));
    for (let k = 0; k < 12; k++) { const a = k * TAU / 12, s = sphere(0.014, rimM, 8); g.add(at(s, R * 0.87 * Math.cos(a), R * 0.87 * Math.sin(a), D / 2 + 0.004)); }   // a ring of studs between rim and inner ring
    // the gem at the top, in a bezel, and the bail and chain it hangs from
    const top = G(); top.position.set(0, R + 0.05, 0.01);
    const bz = new T.Mesh(new T.TorusGeometry(0.06, 0.016, 8, 32), rimM); top.add(bz);
    const gm = new T.MeshStandardMaterial({ color: STY.col(o.gem), emissive: STY.col(o.gemGlow), emissiveIntensity: 0.85, metalness: 0.1, roughness: 0.22, flatShading: true }); gm.envMapIntensity = 1.2;
    const gem = new T.Mesh(new T.OctahedronGeometry(0.058, 0), gm); gem.scale.set(0.85, 1.1, 0.6); gem.rotation.z = PI / 4; gem.position.z = 0.012; top.add(gem);
    const bail = new T.Mesh(new T.TorusGeometry(0.045, 0.013, 8, 24), rimM); bail.rotation.y = PI / 2; top.add(at(bail, 0, 0.1, 0));
    for (let k = 0; k < 3; k++) { const l = new T.Mesh(new T.TorusGeometry(0.026, 0.008, 6, 16), rimM); l.rotation.y = k % 2 ? 0 : PI / 2; top.add(at(l, 0, 0.17 + k * 0.042, 0)); }
    g.add(top);
    return g;
  }
  // the rune: glowing strokes on the face (each a list of [x, y] in units of R, drawn as a smooth tube), with a dim halo stroke under each
  function rune(strokes, hex, k) {
    const g = G(), hot = STY.glow(hex, k || 1.6), dim = STY.glow(hex, 1.1), z = D / 2 + 0.012;
    for (const s of strokes) {
      const pts = s.map(p => [p[0] * R, p[1] * R, z]);
      if (pts.length === 2) pts.splice(1, 0, [(pts[0][0] + pts[1][0]) / 2, (pts[0][1] + pts[1][1]) / 2, z]);
      g.add(tube(pts, 0.014, hot));
      const h = tube(pts.map(p => [p[0], p[1], z - 0.006]), 0.024, dim); h.material = dim; g.add(h);
    }
    return g;
  }
  return { std, at, R, D, medallion, rune };
})();
