// THE SEWER DUNGEON'S PROPS AND KEY ITEMS: DRAFT MODELS (docs/SEWER-PROPS.md is the list of them and where each stands; docs/ART-PROCESS.md: one piece first, a yes before the rest of its family).
// Nothing in the game reads this file. Each draft is built as the game's props and items are (design/props/BRIEF.md): from the shared style kit (design/props/models/_style.js, STY) and the helpers of
// design/evolutions/forms-core.js (G, cbox, cyl, torus, plate, sphere, mesh), one world unit a TILE, px(H) a height in game pixels, the floor at y = 0, the middle of its footprint at the origin, +x the
// game's x (down-right on screen), +z the game's y (down-left). An approved KEY ITEM moves to design/props/models/_items.js (ITEMS3D); an approved PROP to a family in design/props/models.
//   SEWER_DRAFTS.<id> = { no, title, sub, keyItem, states?, foot?, build(state) -> THREE.Group }
// `no` is its number in docs/SEWER-PROPS.md. A KEY ITEM is modelled standing on its own axis (the review tool floats, slants and turns it, as the owner asked of key items: docs/SEWER-PROPS.md §3); it is
// seen from every side, so its back is modelled too. A PROP has a front and stays inside its footprint (`foot`: tiles along x and z), as the facility's props do.
const SEWER_DRAFTS = (function () {
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; }, rot = (m, x, y, z) => { m.rotation.set(x || 0, y || 0, z || 0); return m; };
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };
  const lit = (w, h, t) => new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, toneMapped: false }));   // a lit (emissive) drawing
  const decal = (w, h, t, extra) => new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial(Object.assign({ map: t, transparent: true, metalness: 0, roughness: 0.7, depthWrite: false }, extra || {})));
  const blob = (r, mat, sx, sy, sz) => { const m = new T.Mesh(new T.IcosahedronGeometry(r, 1), mat); m.scale.set(sx == null ? 1 : sx, sy == null ? 1 : sy, sz == null ? 1 : sz); return m; };
  const alongX = m => { m.rotation.z = PI / 2; return m; }, alongZ = m => { m.rotation.x = PI / 2; return m; };   // a cylinder (made along y) laid along x, or along z
  const D = {};

  // ── A1 · THE SUBWAY KEY ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // (the owner, 2026-11-20: "I want to have a key at the bottom of the [...] channel"; "The key is going to be to the subway".) A heavy brass service key that has lain under the water: a six-sided bow in
  // the game's hex language (THE CORE, the hazard flasks, the hex cache) with an enamel disc on each face, lit amber with a tunnel and its rails, so the key says where it goes without a word; a round
  // shank with collars; a square bit cut with two notches (the plainest shape that says KEY at any size); a steel ring at its head with the last beads of a snapped chain; green patina in its corners.
  // Every part of that look is the agent's, provisional. About 29 px tall at the game's size.
  D.subway_key = { no: 'A1', title: 'THE SUBWAY KEY', sub: 'key item · lies on the west channel\'s bed · opens the subway door', keyItem: true,
    build() {
      const g = G(), brass = STY.std('#f0c05a', 0.8, 0.28), brassDk = STY.std('#b68632', 0.78, 0.36), steel = STY.std('#aab4c2', 0.88, 0.32), enamel = STY.std('#10202a', 0.3, 0.35), patina = STY.std('#2f8f7c', 0.05, 0.9);
      const TH = 0.018, BY = 0.30, R = 0.066;   // the bit's and the bow's thickness; the bow's middle; its radius
      // the bit: two notches in its edge, a ward groove along it on both faces
      g.add(plate([[0.006, 0.020], [0.080, 0.020], [0.080, 0.040], [0.060, 0.040], [0.060, 0.052], [0.080, 0.052], [0.080, 0.066], [0.068, 0.066], [0.068, 0.078], [0.080, 0.078], [0.080, 0.098], [0.006, 0.098]], TH, 0.003, brass));
      for (const s of [1, -1]) g.add(at(cbox(0.058, 0.007, 0.002, 0.0006, brassDk), 0.042, 0.088, s * (TH / 2 + 0.0006)));
      // the shank: its tip, the collar over the bit, two under the bow
      g.add(at(cyl(0.0125, 0.0125, 0.215, brass, 20), 0, 0.1195, 0)); g.add(at(cyl(0.0125, 0.007, 0.012, brassDk, 20), 0, 0.006, 0));
      g.add(at(cyl(0.019, 0.019, 0.010, brassDk, 20), 0, 0.106, 0)); g.add(at(cyl(0.021, 0.021, 0.012, brassDk, 20), 0, 0.196, 0)); g.add(at(cyl(0.017, 0.017, 0.006, brass, 20), 0, 0.212, 0));
      // the neck and the six-sided bow (a point up, a point down onto the neck)
      g.add(plate([[-0.014, 0.218], [0.014, 0.218], [0.027, 0.252], [-0.027, 0.252]], TH + 0.002, 0.003, brass));
      const hex = []; for (let i = 0; i < 6; i++) { const a = PI / 2 + i * PI / 3; hex.push([Math.cos(a) * R, BY + Math.sin(a) * R]); }
      g.add(plate(hex, 0.022, 0.0045, brass));
      // the enamel disc through it, a brass rim round it on each face, and the tunnel lit amber on both
      g.add(at(alongZ(cyl(0.041, 0.041, 0.0246, enamel, 36)), 0, BY, 0));
      const tunnel = tex(256, 256, (c) => { c.strokeStyle = '#ffc040'; c.lineCap = 'butt'; c.lineJoin = 'miter'; c.lineWidth = 22; c.beginPath(); c.moveTo(50, 214); c.lineTo(50, 126); c.arc(128, 126, 78, PI, 0); c.lineTo(206, 214); c.stroke();
        c.lineWidth = 9; c.beginPath(); c.moveTo(106, 214); c.lineTo(119, 112); c.moveTo(150, 214); c.lineTo(137, 112); c.stroke();   /* the two rails, running in (they do not meet: it is a track, not a letter) */
        for (const [y, a, b, lw] of [[202, 84, 172, 11], [178, 90, 166, 10], [156, 95, 161, 9], [136, 100, 156, 8], [118, 104, 152, 7]]) { c.lineWidth = lw; c.beginPath(); c.moveTo(a, y); c.lineTo(b, y); c.stroke(); } });
      for (const s of [1, -1]) { const r = torus(0.042, 0.0042, brassDk, 36); g.add(at(r, 0, BY, s * 0.0118)); g.add(at(rot(lit(0.068, 0.068, tunnel), 0, s > 0 ? 0 : PI, 0), 0, BY - 0.002, s * 0.0128)); }
      // the ring at its head, and three beads of the chain it hung on
      g.add(at(rot(torus(0.02, 0.0042, steel, 28), 0, PI / 2, 0), 0, BY + R + 0.012, 0));
      for (const [x, y, z] of [[0.004, 0.393, -0.016], [0.01, 0.382, -0.026], [0.018, 0.369, -0.031]]) g.add(at(sphere(0.005, steel, 10), x, y, z));
      // patina, where the water sat
      for (const [x, y, z, r, sx, sy] of [[0.063, 0.045, 0.0085, 0.0065, 1.3, 0.7], [0.07, 0.0715, -0.0085, 0.0055, 1.2, 0.7], [0.012, 0.1125, 0.013, 0.006, 1.2, 0.5], [-0.013, 0.203, -0.015, 0.006, 1.2, 0.5], [-0.044, 0.262, 0.0108, 0.008, 1.5, 0.7],
        [-0.036, 0.256, 0.0108, 0.005, 1, 1], [0.048, 0.33, -0.0108, 0.008, 0.8, 1.4], [0.02, 0.243, 0.0108, 0.005, 1.4, 0.7], [-0.02, 0.243, -0.0108, 0.006, 1.4, 0.7]])
        g.add(at(blob(r, patina, sx, sy, 0.22), x, y, z));
      return g;
    } };

  // ── C1 · THE DRAIN VALVE ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // (the owner, 2026-11-20: "opening a drain valve lowers it", the water.) The first of the sewer's fixtures, so it sets their materials: FIXED municipal ironwork in a worn utility green, bare iron and
  // rust at its flanges, a slimy tide mark at its foot; and the one part a hand turns in signal red. A gate valve in a length of main (the main runs along x, flanged at both ends of its tile so pipes can
  // meet it), on two saddles; its bonnet, a yoke, the stem and a wide red handwheel on top; a lamp on the bonnet. Its two states read in the dark: SHUT, the lamp amber and the stem down in the wheel;
  // OPEN, the lamp green and the stem risen through the wheel (as a rising-stem valve does). One tile. The handwheel is about 50 px off the floor (the player's cube is about 70 px tall).
  // Every part of that look, the colour rule and the two states' signals are the agent's, provisional.
  D.drain_valve = { no: 'C1', title: 'THE DRAIN VALVE', sub: 'fixture · one tile · opening it lowers the water', keyItem: false, states: ['shut', 'open'], foot: [1, 1],
    build(state) {
      const open = state === 'open', g = G();
      const iron = STY.std('#3f6f69', 0.3, 0.64), ironDk = STY.std('#2a4c4a', 0.35, 0.68), bare = STY.std('#3a4048', 0.8, 0.48), rust = STY.std('#9a5f38', 0.35, 0.8), red = STY.std('#c8321e', 0.25, 0.5), redDk = STY.std('#7e2415', 0.3, 0.55),
        steel = STY.std('#aab4c2', 0.88, 0.32), slime = STY.std('#2c4a32', 0.05, 0.9), moss = STY.std('#3d6a2a', 0, 0.95), mossDk = STY.std('#2a4a20', 0, 0.95);
      const Z0 = -0.06, YC = px(15), PR = 0.118;   // the main: how far back it runs, its middle's height, its radius
      const main = G(); main.position.set(0, YC, Z0); g.add(main);
      main.add(alongX(cyl(PR, PR, 0.9, iron, 28)));
      for (const s of [1, -1]) {   // each end: a flange and its bolts, a ring of rust behind it
        main.add(at(alongX(cyl(0.168, 0.168, 0.04, ironDk, 28)), s * 0.44, 0, 0)); main.add(at(alongX(cyl(0.128, 0.128, 0.012, rust, 28)), s * 0.414, 0, 0));
        for (let i = 0; i < 8; i++) { const a = i * PI / 4 + PI / 8; main.add(at(alongX(cyl(0.014, 0.014, 0.056, bare, 6)), s * 0.44, Math.cos(a) * 0.146, Math.sin(a) * 0.146)); }
        // a saddle under the main, a foot plate, the tide mark round its foot
        g.add(at(cbox(0.09, YC - PR + 0.03, 0.2, 0.012, ironDk), s * 0.27, (YC - PR + 0.03) / 2, Z0)); g.add(at(cbox(0.15, 0.022, 0.3, 0.008, bare), s * 0.27, 0.011, Z0)); g.add(at(cbox(0.096, 0.04, 0.206, 0.008, slime), s * 0.27, 0.042, Z0));
      }
      // the valve's body round the main, its bonnet, the bonnet's flange and bolts
      main.add(alongX(cyl(0.165, 0.165, 0.2, iron, 8))); main.add(at(cbox(0.2, 0.16, 0.26, 0.03, iron), 0, 0.1, 0));
      const BT = 0.16;   // the body's top, over the main's middle
      main.add(at(cyl(0.158, 0.158, 0.03, ironDk, 8), 0, BT + 0.015, 0)); for (let i = 0; i < 8; i++) { const a = i * PI / 4; main.add(at(cyl(0.013, 0.013, 0.05, bare, 6), Math.cos(a) * 0.135, BT + 0.018, Math.sin(a) * 0.135)); }
      main.add(at(cyl(0.075, 0.12, 0.13, iron, 8), 0, BT + 0.095, 0)); main.add(at(cyl(0.05, 0.05, 0.03, bare, 12), 0, BT + 0.175, 0));
      // the yoke (two arms and a bridge), the stem through it, the handwheel on the bridge
      const YT = BT + 0.33;   // the bridge's height
      for (const s of [1, -1]) main.add(at(rot(cbox(0.026, 0.19, 0.04, 0.006, ironDk), 0, 0, s * 0.16), s * 0.062, BT + 0.25, 0));
      main.add(at(cbox(0.13, 0.03, 0.07, 0.008, ironDk), 0, YT, 0));
      const rise = open ? 0.13 : 0.012; main.add(at(cyl(0.016, 0.016, 0.2 + rise, steel, 12), 0, BT + 0.16 + (0.2 + rise) / 2, 0)); main.add(at(cyl(0.02, 0.02, 0.012, bare, 6), 0, BT + 0.36 + rise, 0));
      const wheel = G(); wheel.position.set(0, YT + 0.034, 0); wheel.rotation.y = open ? 0.5 : 0; main.add(wheel);
      wheel.add(rot(torus(0.2, 0.021, red, 40), PI / 2, 0, 0)); wheel.add(cyl(0.046, 0.046, 0.034, redDk, 16));
      for (let i = 0; i < 5; i++) { const a = i * TAU / 5, sp = cbox(0.2, 0.017, 0.03, 0.005, red); sp.position.set(Math.cos(a) * 0.1, 0, Math.sin(a) * 0.1); sp.rotation.y = -a; wheel.add(sp); }
      // the lamp on the bonnet's front: amber shut, green open; and a cast plate under it: DRAIN
      main.add(at(cbox(0.07, 0.07, 0.04, 0.008, STY.mat.graphite), 0, BT + 0.1, 0.105)); main.add(at(alongZ(cyl(0.022, 0.022, 0.014, STY.glow(open ? '#43e0a8' : '#f2b13a', 1.15), 14)), 0, BT + 0.1, 0.13));
      const plateT = tex(256, 96, (c, w, h) => { c.fillStyle = '#d9e2e0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1a2a2c'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#1a2a2c'; c.font = 'bold 54px DejaVu Sans Condensed, DejaVu Sans, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('DRAIN', w / 2, h / 2 + 3); });
      main.add(at(cbox(0.17, 0.07, 0.014, 0.004, ironDk), 0, -0.035, 0.158)); main.add(at(decal(0.15, 0.054, plateT), 0, -0.035, 0.1656));
      // wear: rust under the bonnet's flange, a streak down the body, moss at a saddle's foot
      main.add(at(cyl(0.163, 0.163, 0.008, rust, 8), 0, BT - 0.002, 0)); for (const s of [1, -1]) main.add(at(alongX(cyl(0.07, 0.07, 0.012, ironDk, 20)), s * 0.462, 0, 0));   /* a boss on each blind flange */
      for (const [x, a, w] of [[-0.2, 0.5, 0.07], [0.24, 1.0, 0.05], [0.17, 0.2, 0.04], [-0.3, 1.25, 0.045]]) main.add(at(rot(cbox(w, 0.003, 0.034, 0.001, rust), a - PI / 2, 0, 0), x, Math.sin(a) * (PR + 0.0005), Math.cos(a) * (PR + 0.0005)));   /* rust where the paint has gone from the main */
      for (const [x, z, r, m] of [[0.33, 0.1, 0.034, moss], [0.385, 0.06, 0.024, mossDk], [0.28, 0.135, 0.022, mossDk], [0.345, 0.15, 0.016, moss], [-0.2, 0.11, 0.026, mossDk], [-0.25, 0.14, 0.018, moss]]) g.add(at(blob(r, m, 1, 0.42, 1), x, r * 0.25, Z0 + z));
      return g;
    } };

  return D;
})();
