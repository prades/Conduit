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

  // ── A1 · THE SUBWAY KEY (draft 2) ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // (the owner, 2026-11-20: "I want to have a key at the bottom of the [...] channel"; "The key is going to be to the subway".) Draft 1 had an enamel disc with a lit tunnel on its bow, three collars, a
  // ward groove, a steel ring with the beads of a snapped chain, and green patina: the owner, 2026-11-21: "The key is kind of overdrawn." So draft 2 is a plain brass key and nothing else: a six-sided
  // bow (the game's hex language) with a round hole through it, a round shank with one collar, a square bit with one notch. About 27 px tall at the game's size. The look is the agent's, provisional.
  D.subway_key = { no: 'A1', title: 'THE SUBWAY KEY', sub: 'key item · lies on the west channel\'s bed · opens the subway door · draft 2, plainer', keyItem: true,
    build() {
      const g = G(), brass = STY.std('#f0c05a', 0.8, 0.28), brassDk = STY.std('#b68632', 0.78, 0.36), TH = 0.02, BY = 0.30, R = 0.068;
      g.add(plate([[0.006, 0.020], [0.078, 0.020], [0.078, 0.046], [0.056, 0.046], [0.056, 0.066], [0.078, 0.066], [0.078, 0.094], [0.006, 0.094]], TH, 0.003, brass));   // the bit
      g.add(at(cyl(0.013, 0.013, 0.225, brass, 20), 0, 0.1225, 0)); g.add(at(cyl(0.013, 0.008, 0.012, brass, 20), 0, 0.006, 0)); g.add(at(cyl(0.021, 0.021, 0.014, brassDk, 20), 0, 0.214, 0));   // the shank, its tip, its collar
      const sh = new T.Shape(); for (let i = 0; i < 6; i++) { const a = PI / 2 + i * PI / 3, x = Math.cos(a) * R, y = BY + Math.sin(a) * R; i ? sh.lineTo(x, y) : sh.moveTo(x, y); } sh.closePath();
      const hole = new T.Path(); hole.absarc(0, BY + 0.004, 0.03, 0, TAU, true); sh.holes.push(hole);
      const geo = new T.ExtrudeGeometry(sh, { depth: TH - 0.008, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, steps: 1, curveSegments: 28 }); geo.translate(0, 0, -(TH - 0.008) / 2);
      g.add(new T.Mesh(geo, brass));   // the bow
      return g;
    } };

  // ── A3 · THE MODULE'S THREE PARTS ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // (the owner, 2026-11-20: "The purification module is made from spare parts found in the sewer"; asked whether they are the three things the module's own description names, "a canister of membranes
  // and a pump", 2026-11-21: "that sounds correct. 3 parts is okay".) Each is the piece of the PURIFICATION MODULE's own model (design/props/models/_items.js `purification_module`) it will become, at
  // that model's size and in its colours, so the three are seen to make the one: the teal CANISTER, its window empty and its top open; the MEMBRANES, a dark core with five lit bands round it between two caps; the
  // PUMP, its dark block, its motor with a teal band, two pipe stubs. Kept plain (the owner on the key: "overdrawn"). The looks are the agent's, provisional.
  const MOD = () => ({ shell: STY.std('#2f6a73', 0.5, 0.42), steel: STY.std('#9aa4b4', 0.85, 0.35), steelDk: STY.std('#4a525e', 0.8, 0.42), dark: STY.std('#0b1a1f', 0.4, 0.5), lit: STY.glow('#5ff7e0', 1.05) });
  D.module_canister = { no: 'A3', title: 'MODULE PART · THE CANISTER', sub: 'key item · one of the purification module\'s three parts', keyItem: true,
    build() { const g = G(), m = MOD(), R = 0.1, H = px(19);
      g.add(at(cyl(R, R, H, m.shell, 28), 0, H / 2 + px(1.2), 0)); g.add(at(cyl(R * 1.06, R * 1.06, px(1.6), m.steelDk, 28), 0, px(0.8), 0)); g.add(at(cyl(R * 1.06, R * 1.06, px(1.6), m.steelDk, 28), 0, H + px(1.8), 0));
      g.add(at(cyl(R * 0.8, R * 0.8, px(0.5), m.dark, 28), 0, H + px(2.65), 0));   // its open top
      g.add(at(cbox(0.062, px(10.5), 0.012, 0.004, m.dark), 0, px(8.75), R - 0.002));   // the window, empty
      g.add(at(new T.Mesh(new T.TorusGeometry(0.045, 0.008, 8, 16, PI), m.steel), 0, H + px(2.6), 0));   // the handle
      return g; } };
  D.module_membranes = { no: 'A3', title: 'MODULE PART · THE MEMBRANES', sub: 'key item · one of the purification module\'s three parts', keyItem: true,
    build() { const g = G(), m = MOD();   // a dark core between two caps, five lit bands round it (the five lit bars of the module's window)
      g.add(at(cyl(0.062, 0.062, px(15.6), m.dark, 28), 0, px(8.5), 0)); for (const y of [0.7, 16.3]) g.add(at(cyl(0.076, 0.076, px(1.4), m.steelDk, 24), 0, px(y), 0));
      for (let i = 0; i < 5; i++) g.add(at(cyl(0.0635, 0.0635, px(1.15), m.lit, 28), 0, px(3.3 + i * 2.6), 0));
      return g; } };
  D.module_pump = { no: 'A3', title: 'MODULE PART · THE PUMP', sub: 'key item · one of the purification module\'s three parts', keyItem: true,
    build() { const g = G(), m = MOD(), BH = px(7);
      g.add(at(cbox(0.12, BH, 0.11, 0.012, m.steelDk), 0, BH / 2, 0));   // its block
      g.add(at(alongX(cyl(0.043, 0.043, 0.13, m.steel, 20)), 0, BH + 0.038, 0)); g.add(at(alongX(cyl(0.0445, 0.0445, 0.036, m.shell, 20)), 0, BH + 0.038, 0));   // the motor, its teal band
      g.add(at(alongX(cyl(0.016, 0.016, 0.05, m.steel, 12)), 0.083, px(2.6), 0)); g.add(at(alongX(cyl(0.023, 0.023, 0.008, m.steelDk, 12)), 0.108, px(2.6), 0));   // the stub in
      g.add(at(cyl(0.016, 0.016, px(3.4), m.steel, 12), -0.03, BH + 0.08 + px(1.5), 0)); g.add(at(cyl(0.023, 0.023, 0.008, m.steelDk, 12), -0.03, BH + 0.08 + px(3.2), 0));   // the stub out
      g.add(at(alongZ(cyl(0.01, 0.01, 0.006, m.lit, 10)), 0.03, px(4.6), 0.057));   // its lamp
      return g; } };

  // ── A7 · THE BATTERY PACK ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // ("Battery packs, found in the dungeon, restore the mech's charges and every spent follower utility"; the owner, 2026-11-21: "I guess a battery pack can be held, carried".) A block, to be nothing
  // like the Technomancer's POWER CELL (an upright glass capsule with a cyan core): an amber shell between two dark caps, two terminals on top, and a bar of four green cells lit on its front and its
  // back, full. The look is the agent's, provisional.
  D.battery_pack = { no: 'A7', title: 'THE BATTERY PACK', sub: 'key item · carried · refills the mech\'s charges and every follower\'s utility', keyItem: true,
    build() { const g = G(), shell = STY.std('#f2b13a', 0.25, 0.5), cap = STY.mat.graphite, steel = STY.std('#9aa4b4', 0.85, 0.35), full = STY.glow('#43e0a8', 1.1), W = 0.26, H = px(12), DP = 0.15;
      g.add(at(cbox(W, H, DP, 0.014, shell), 0, H / 2 + px(1), 0)); g.add(at(cbox(W + 0.012, px(1.8), DP + 0.012, 0.005, cap), 0, px(0.9), 0)); g.add(at(cbox(W + 0.012, px(2.2), DP + 0.012, 0.006, cap), 0, H + px(1.9), 0));
      for (const s of [1, -1]) { g.add(at(cyl(0.022, 0.022, px(2.6), steel, 14), s * 0.075, H + px(4.2), 0));
        g.add(at(cbox(0.2, px(6.6), 0.004, 0.001, cap), 0, H / 2 + px(1), s * (DP / 2 + 0.001))); for (let i = 0; i < 4; i++) g.add(at(cbox(0.036, px(4.6), 0.004, 0.001, full), -0.066 + i * 0.044, H / 2 + px(1), s * (DP / 2 + 0.003))); }
      return g; } };

  // ── C · THE WATER WORKS ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // THE IRONWORK (approved with the drain valve, the owner, 2026-11-21: "The valve is good enough. It should work"): FIXED municipal ironwork in a worn utility green, bare iron and rust at its joints,
  // a slimy tide mark at its foot, moss; the one part a hand (or a shot) works in signal red; a fixture's state shown twice, by a lamp (amber shut, green open) and by its shape (a stem risen).
  const IRON = () => ({ iron: STY.std('#3f6f69', 0.3, 0.64), ironDk: STY.std('#2a4c4a', 0.35, 0.68), bare: STY.std('#3a4048', 0.8, 0.48), rust: STY.std('#9a5f38', 0.35, 0.8), red: STY.std('#c8321e', 0.25, 0.5), redDk: STY.std('#7e2415', 0.3, 0.55),
    steel: STY.std('#aab4c2', 0.88, 0.32), slime: STY.std('#2c4a32', 0.05, 0.9), moss: STY.std('#3d6a2a', 0, 0.95), mossDk: STY.std('#2a4a20', 0, 0.95), pit: STY.std('#05080a', 0.1, 0.9) });
  const lamp = on => STY.glow(on ? '#43e0a8' : '#f2b13a', 1.15);
  const sign = (word) => tex(256, 96, (c, w, h) => { c.fillStyle = '#d9e2e0'; c.fillRect(0, 0, w, h); c.strokeStyle = '#1a2a2c'; c.lineWidth = 6; c.strokeRect(6, 6, w - 12, h - 12); c.fillStyle = '#1a2a2c'; c.font = 'bold 50px DejaVu Sans Condensed, DejaVu Sans, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(word, w / 2, h / 2 + 3); });

  // ── C1 · THE DRAIN VALVE (APPROVED 2026-11-21) ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // (the owner, 2026-11-20: "opening a drain valve lowers it", the water.) A gate valve in a length of main (the main runs along x, flanged at both ends of its tile so pipes can meet it), on two
  // saddles; its bonnet, a yoke, the stem and a wide red handwheel on top; a lamp on the bonnet. SHUT, the lamp amber and the stem down in the wheel; OPEN, the lamp green and the stem risen through the
  // wheel (as a rising-stem valve does). One tile. The handwheel is about 50 px off the floor (the player's cube is about 70 px tall).
  D.drain_valve = { no: 'C1', title: 'THE DRAIN VALVE', sub: 'fixture · one tile · opening it lowers the water · APPROVED', keyItem: false, states: ['shut', 'open'], foot: [1, 1],
    build(state) {
      const open = state === 'open', g = G();
      const { iron, ironDk, bare, rust, red, redDk, steel, slime, moss, mossDk } = IRON();
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

  // ── C2 · THE SLUICE GATE ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // ("moving obstacles into drains or the sluice raises it", the water; proposed check U7: a switch "closing the sluice and raising the water".) A lifting gate across a channel, two tiles wide (the
  // channel's width is not set yet: the model is to be re-cut to it): two green posts and a beam, a dark ribbed gate between them with a hazard stripe along its foot, two stems, a gearbox on the beam
  // with the lamp. No red on it: nothing here is worked by hand (its switch is, C3). OPEN, the gate hangs up under the beam, the stems stand high over it, the lamp green; SHUT, the gate is down on the
  // bed, the stems are down, the lamp amber. The frame is about 92 px tall. The look, and which state is which, are the agent's, provisional.
  D.sluice_gate = { no: 'C2', title: 'THE SLUICE GATE', sub: 'fixture · two tiles across a channel · shut, it raises the water', keyItem: false, states: ['open', 'shut'], foot: [2, 1],
    build(state) { const shut = state === 'shut', g = G(), m = IRON(), FH = 1.25, PH = 0.6, lift = shut ? 0 : 0.52;
      for (const s of [1, -1]) {
        g.add(at(cbox(0.14, FH, 0.2, 0.02, m.iron), s * 0.9, FH / 2, 0)); g.add(at(cbox(0.2, 0.03, 0.3, 0.008, m.bare), s * 0.89, 0.015, 0)); g.add(at(cbox(0.146, 0.07, 0.206, 0.01, m.slime), s * 0.9, 0.065, 0));   // a post, its foot, its tide mark
        g.add(at(cbox(0.03, FH - 0.16, 0.08, 0.006, m.bare), s * 0.822, (FH - 0.16) / 2, 0));   // the gate's guide
        g.add(at(cyl(0.02, 0.02, 0.74, m.steel, 12), s * 0.45, PH + lift + 0.37, 0)); g.add(at(cyl(0.027, 0.027, 0.014, m.bare, 6), s * 0.45, PH + lift + 0.745, 0)); g.add(at(cyl(0.05, 0.05, 0.05, m.bare, 12), s * 0.45, FH + 0.02, 0));   // a stem, through its nut on the beam
        g.add(at(cbox(0.15, 0.012, 0.21, 0.004, m.rust), s * 0.9, FH - 0.125, 0));   // rust under the beam
      }
      g.add(at(cbox(1.94, 0.12, 0.24, 0.025, m.ironDk), 0, FH - 0.06, 0));   // the beam
      g.add(at(cbox(0.36, 0.15, 0.28, 0.022, m.iron), 0, FH + 0.07, 0)); g.add(at(cbox(0.07, 0.07, 0.03, 0.008, STY.mat.graphite), 0.11, FH + 0.075, 0.148)); g.add(at(alongZ(cyl(0.022, 0.022, 0.014, lamp(!shut), 14)), 0.11, FH + 0.075, 0.168));
      g.add(at(decal(0.16, 0.058, sign('SLUICE')), -0.07, FH + 0.07, 0.1425));
      const gate = G(); gate.position.y = lift; g.add(gate);
      gate.add(at(cbox(1.62, PH, 0.06, 0.012, STY.mat.steelDk), 0, PH / 2, 0)); for (const y of [0.22, 0.39, 0.56]) gate.add(at(cbox(1.62, 0.04, 0.09, 0.008, m.bare), 0, y, 0));
      gate.add(at(cbox(1.62, 0.1, 0.07, 0.006, STY.hazard(7, 7)), 0, 0.055, 0));
      return g; } };

  // ── C3 · THE SLUICE SWITCH ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // (proposed check U7, not approved by the dungeon's spec yet: "a stuck sluice switch, high up: the Gunslinger shoots it, closing the sluice and raising the water [...] the mech turns it if reached".)
  // A green switch box high on a wall (about 115 px up: over the player's head), a conduit down the wall to the floor, and a long lever out of its front with a red ball on its end: the part to hit.
  // UP, as it is found, the lamp green (the sluice open); THROWN, the lever down, the lamp amber (the sluice shut), as the gate's own lamp. Rust at its pivot (it is stuck). It stands at the back of
  // its tile, against the wall behind it. The look, its height and the two states' signals are the agent's, provisional.
  D.sluice_switch = { no: 'C3', title: 'THE SLUICE SWITCH', sub: 'fixture · high on a wall · a shot, or the mech, throws it', keyItem: false, states: ['up', 'thrown'], foot: [1, 1],
    build(state) { const thrown = state === 'thrown', g = G(), m = IRON(), ZB = -0.4, BY = 1.55;
      g.add(at(cyl(0.028, 0.028, BY - 0.2, m.ironDk, 12), 0.1, (BY - 0.2) / 2, ZB)); for (const y of [0.35, 0.95]) g.add(at(cbox(0.09, 0.03, 0.06, 0.006, m.bare), 0.1, y, ZB));   // the conduit and its clips
      g.add(at(cbox(0.36, 0.42, 0.16, 0.022, m.iron), 0, BY, ZB)); g.add(at(cbox(0.42, 0.03, 0.22, 0.008, m.ironDk), 0, BY + 0.225, ZB + 0.01));   // the box, its hood
      g.add(at(alongZ(cyl(0.026, 0.026, 0.016, lamp(!thrown), 14)), -0.105, BY + 0.125, ZB + 0.088)); g.add(at(decal(0.17, 0.06, sign('SLUICE')), 0.065, BY + 0.125, ZB + 0.083));
      g.add(at(cbox(0.06, 0.22, 0.01, 0.003, m.pit), 0, BY - 0.07, ZB + 0.081)); g.add(at(alongX(cyl(0.03, 0.03, 0.09, m.rust, 12)), 0, BY - 0.07, ZB + 0.086));   // the slot, the rusted pivot
      const lever = G(); lever.position.set(0, BY - 0.07, ZB + 0.086); lever.rotation.x = thrown ? 0.7 : -0.7; g.add(lever);
      lever.add(at(alongZ(cyl(0.02, 0.02, 0.28, m.steel, 12)), 0, 0, 0.14)); lever.add(at(sphere(0.068, m.red, 18), 0, 0, 0.3));
      return g; } };

  // ── C4 · A DRAIN ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // ("moving obstacles into drains or the sluice raises it", the water.) The mouth an obstacle is moved onto: an iron frame set in the floor, one tile, six bars over a black pit, bolts at its
  // corners, moss at one. A hand's breadth high (about 3 px): it is walked over. The look is the agent's, provisional.
  D.drain = { no: 'C4', title: 'A DRAIN', sub: 'fixture · one tile, set in the floor · an obstacle moved onto it stops it', keyItem: false, foot: [1, 1],
    build() { const g = G(), m = IRON(), FH = px(3);
      for (const s of [1, -1]) { g.add(at(cbox(0.92, FH, 0.1, 0.01, m.ironDk), 0, FH / 2, s * 0.41)); g.add(at(cbox(0.1, FH, 0.72, 0.01, m.ironDk), s * 0.41, FH / 2, 0)); }
      g.add(at(rot(new T.Mesh(new T.PlaneGeometry(0.74, 0.74), new T.MeshBasicMaterial({ color: 0x020304 })), -PI / 2, 0, 0), 0, px(0.5), 0));
      for (let i = 0; i < 6; i++) g.add(at(cbox(0.055, FH * 0.9, 0.74, 0.008, m.iron), -0.3 + i * 0.12, FH / 2, 0));
      for (const sx of [1, -1]) for (const sz of [1, -1]) g.add(at(cyl(0.02, 0.02, FH + 0.008, m.bare, 6), sx * 0.41, FH / 2 + 0.004, sz * 0.41));
      for (const [x, z, r, mm] of [[0.36, 0.44, 0.03, m.moss], [0.42, 0.37, 0.022, m.mossDk], [0.3, 0.46, 0.018, m.mossDk]]) g.add(at(blob(r, mm, 1, 0.4, 1), x, FH, z));
      return g; } };

  return D;
})();
