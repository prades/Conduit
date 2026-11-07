// THE BRAWLER'S OPPORTUNITY CARDS (PRESSURE SPUR at Refined, FAULTLINE TALON at Precision, RUPTURE FANG at Prototype; docs/UNIVERSAL-AND-PLAYER-CARDS.md: "climb a Brawler's weapon: a SPUR,
// a TALON, a FANG. Each one presses, splits, then breaks open a weakness"): one family, one mount. A heavy knuckle plate (four raised knuckles, rivets, a leather grip bar behind) in dark steel
// with the Brawler's red-orange (#ff4a1c) as its accent; the weapon of each tier stands out of its front. The family's look follows the approved bands, sigils and crowns (2026-11-07).
const KNUCKLE = (function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const steel = std('#4a5058', 0.9, 0.32), bright = std('#b9c0c9', 1, 0.24), leather = std('#4a2f1c', 0.05, 0.78), accent = STY.glow('#ff4a1c', 1.5);
  // the mount: a knuckle-duster facing the viewer (+z): four finger rings in a row, a heavy striking bar across their tops with the accent glowing along its face, a grip bar under them;
  // the weapon of each tier rises out of the striking bar's top, at (0, TOP, 0)
  const W = 0.62, TOP = 0.16, FRONT = 0;
  function mount() {
    const g = G();
    for (let k = 0; k < 4; k++) { const x = (k - 1.5) * 0.15, r = new T.Mesh(new T.TorusGeometry(0.058, 0.022, 12, 32), steel); g.add(at(r, x, 0, 0)); g.add(at(sphere(0.016, bright, 10), x, 0.083, 0.03)); }
    g.add(at(cbox(W, 0.09, 0.1, 0.03, steel), 0, 0.11, 0));   // the striking bar
    g.add(at(cbox(W - 0.08, 0.018, 0.012, 0.004, accent), 0, 0.11, 0.052));   // the accent along its face
    for (const s of [-1, 1]) g.add(at(cbox(0.05, 0.2, 0.08, 0.02, steel), s * (W / 2 - 0.02), 0.0, 0));   // the side plates
    const bar = cyl(0.04, 0.04, W - 0.04, leather, 16); bar.rotation.z = PI / 2; g.add(at(bar, 0, -0.1, 0));   // the grip
    for (let k = 0; k < 5; k++) { const w = new T.Mesh(new T.TorusGeometry(0.043, 0.005, 6, 18), bright); w.rotation.y = PI / 2; g.add(at(w, (k - 2) * 0.11, -0.1, 0)); }
    return g;
  }
  return { std, at, steel, bright, accent, W, TOP, FRONT, mount };
})();
