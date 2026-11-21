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

  // ── A1 · THE SUBWAY KEY (draft 2; APPROVED 2026-11-21, the owner: "Looks good", of it, the module's parts, the battery pack, the sluice gate, the sluice switch and the drain) ───────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // (the owner, 2026-11-20: "I want to have a key at the bottom of the [...] channel"; "The key is going to be to the subway".) Draft 1 had an enamel disc with a lit tunnel on its bow, three collars, a
  // ward groove, a steel ring with the beads of a snapped chain, and green patina: the owner, 2026-11-21: "The key is kind of overdrawn." So draft 2 is a plain brass key and nothing else: a six-sided
  // bow (the game's hex language) with a round hole through it, a round shank with one collar, a square bit with one notch. About 27 px tall at the game's size. The look is the agent's, provisional.
  D.subway_key = { no: 'A1', title: 'THE SUBWAY KEY', sub: 'key item · lies on the west channel\'s bed · opens the subway door · APPROVED', keyItem: true,
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
  D.module_canister = { no: 'A3', title: 'MODULE PART · THE CANISTER', sub: 'key item · one of the purification module\'s three parts · APPROVED', keyItem: true,
    build() { const g = G(), m = MOD(), R = 0.1, H = px(19);
      g.add(at(cyl(R, R, H, m.shell, 28), 0, H / 2 + px(1.2), 0)); g.add(at(cyl(R * 1.06, R * 1.06, px(1.6), m.steelDk, 28), 0, px(0.8), 0)); g.add(at(cyl(R * 1.06, R * 1.06, px(1.6), m.steelDk, 28), 0, H + px(1.8), 0));
      g.add(at(cyl(R * 0.8, R * 0.8, px(0.5), m.dark, 28), 0, H + px(2.65), 0));   // its open top
      g.add(at(cbox(0.062, px(10.5), 0.012, 0.004, m.dark), 0, px(8.75), R - 0.002));   // the window, empty
      g.add(at(new T.Mesh(new T.TorusGeometry(0.045, 0.008, 8, 16, PI), m.steel), 0, H + px(2.6), 0));   // the handle
      return g; } };
  D.module_membranes = { no: 'A3', title: 'MODULE PART · THE MEMBRANES', sub: 'key item · one of the purification module\'s three parts · APPROVED', keyItem: true,
    build() { const g = G(), m = MOD();   // a dark core between two caps, five lit bands round it (the five lit bars of the module's window)
      g.add(at(cyl(0.062, 0.062, px(15.6), m.dark, 28), 0, px(8.5), 0)); for (const y of [0.7, 16.3]) g.add(at(cyl(0.076, 0.076, px(1.4), m.steelDk, 24), 0, px(y), 0));
      for (let i = 0; i < 5; i++) g.add(at(cyl(0.0635, 0.0635, px(1.15), m.lit, 28), 0, px(3.3 + i * 2.6), 0));
      return g; } };
  D.module_pump = { no: 'A3', title: 'MODULE PART · THE PUMP', sub: 'key item · one of the purification module\'s three parts · APPROVED', keyItem: true,
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
  D.battery_pack = { no: 'A7', title: 'THE BATTERY PACK', sub: 'key item · carried · refills the mech\'s charges and every follower\'s utility · APPROVED', keyItem: true,
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
  D.sluice_gate = { no: 'C2', title: 'THE SLUICE GATE', sub: 'fixture · two tiles across a channel · shut, it raises the water · APPROVED', keyItem: false, states: ['open', 'shut'], foot: [2, 1],
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
  D.sluice_switch = { no: 'C3', title: 'THE SLUICE SWITCH', sub: 'fixture · high on a wall · a shot, or the mech, throws it · APPROVED', keyItem: false, states: ['up', 'thrown'], foot: [1, 1],
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
  D.drain = { no: 'C4', title: 'A DRAIN', sub: 'fixture · one tile, set in the floor · an obstacle moved onto it stops it · APPROVED', keyItem: false, foot: [1, 1],
    build() { const g = G(), m = IRON(), FH = px(3);
      for (const s of [1, -1]) { g.add(at(cbox(0.92, FH, 0.1, 0.01, m.ironDk), 0, FH / 2, s * 0.41)); g.add(at(cbox(0.1, FH, 0.72, 0.01, m.ironDk), s * 0.41, FH / 2, 0)); }
      g.add(at(rot(new T.Mesh(new T.PlaneGeometry(0.74, 0.74), new T.MeshBasicMaterial({ color: 0x020304 })), -PI / 2, 0, 0), 0, px(0.5), 0));
      for (let i = 0; i < 6; i++) g.add(at(cbox(0.055, FH * 0.9, 0.74, 0.008, m.iron), -0.3 + i * 0.12, FH / 2, 0));
      for (const sx of [1, -1]) for (const sz of [1, -1]) g.add(at(cyl(0.02, 0.02, FH + 0.008, m.bare, 6), sx * 0.41, FH / 2 + 0.004, sz * 0.41));
      for (const [x, z, r, mm] of [[0.36, 0.44, 0.03, m.moss], [0.42, 0.37, 0.022, m.mossDk], [0.3, 0.46, 0.018, m.mossDk]]) g.add(at(blob(r, mm, 1, 0.4, 1), x, FH, z));
      return g; } };

  // ── B · DOORS AND BARRIERS (the subway door, the shortcut door and the rubble APPROVED 2026-11-21, the owner: "Yes drafts good") ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // A door is two tiles wide, as the game's doorways are, and stands at the BACK of its tile row (on the wall's line), its face to the room; the wall is 74 px tall (FP_WALL_H), so the frame is. Its
  // frame is the water works' ironwork (approved). Two more signals, both the agent's, provisional: BRASS is the key's (the key is brass: what it opens wears a brass plate with the key's six-sided
  // shape); and what is cleared away, not worked, is pale broken CONCRETE, nothing green or red on it.
  const WH = () => px(74), ZB = -0.38;
  const frame = (g, m) => { const H = WH(); for (const s of [1, -1]) { g.add(at(cbox(0.14, H, 0.24, 0.02, m.iron), s * 0.93, H / 2, ZB)); g.add(at(cbox(0.146, 0.06, 0.246, 0.01, m.slime), s * 0.93, 0.05, ZB)); }
    g.add(at(cbox(2.0, 0.12, 0.26, 0.02, m.ironDk), 0, H - 0.06, ZB)); };
  const way = (g) => g.add(at(new T.Mesh(new T.PlaneGeometry(1.72, WH() - 0.12), new T.MeshBasicMaterial({ color: 0x020304 })), 0, (WH() - 0.12) / 2, ZB - 0.06));   // the dark way through

  // ── B4 · THE SUBWAY DOOR ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // ("The key is going to be to the subway": the way on to the subway, south-west of the junction. With "Just 1 for now", the owner, 2026-11-21, it is the dungeon's one keyed door.) A steel roller
  // shutter in an iron frame: slats, a hazard stripe along its foot, its drum's housing across the top with the plate SUBWAY, and on the right post a key switch: a brass plate with a six-sided
  // keyhole, the key's own shape, a lamp over it. LOCKED, the shutter down, the lamp amber; OPEN, the shutter rolled up under the housing, the way dark behind it, the lamp green.
  D.subway_door = { no: 'B4', title: 'THE SUBWAY DOOR', sub: 'door · two tiles, in a wall · the subway key opens it · APPROVED', keyItem: false, states: ['locked', 'open'], foot: [2, 1],
    build(state) { const open = state === 'open', g = G(), m = IRON(), H = WH(), brass = STY.std('#f0c05a', 0.8, 0.28), brassDk = STY.std('#b68632', 0.78, 0.36);
      way(g); frame(g, m);
      g.add(at(cbox(1.9, 0.2, 0.3, 0.025, m.iron), 0, H - 0.02, ZB + 0.03)); g.add(at(decal(0.36, 0.1, sign('SUBWAY')), 0, H - 0.02, ZB + 0.1825));   // the drum's housing and its plate
      const top = H - 0.12, bot = open ? top - 0.14 : 0.0, CH = top - bot;   // the shutter: from under the housing down to its foot
      g.add(at(cbox(1.72, CH, 0.05, 0.008, STY.mat.steelDk), 0, bot + CH / 2, ZB + 0.02)); for (let y = bot + 0.13; y < top - 0.02; y += 0.075) g.add(at(cbox(1.72, 0.014, 0.064, 0.004, m.bare), 0, y, ZB + 0.02));
      g.add(at(cbox(1.72, 0.09, 0.07, 0.006, STY.hazard(7, 7)), 0, bot + 0.045, ZB + 0.02));
      // the key switch on the right post: brass, six-sided, a keyhole; the lamp over it
      const KY = px(34), sw = G(); sw.position.set(0.93, KY, ZB + 0.125); g.add(sw);
      sw.add(cbox(0.13, 0.2, 0.03, 0.008, STY.mat.graphite)); const hx = alongZ(cyl(0.048, 0.048, 0.014, brass, 6)); hx.position.set(0, -0.03, 0.018); sw.add(hx);
      sw.add(at(alongZ(cyl(0.014, 0.014, 0.004, m.pit, 12)), 0, -0.022, 0.026)); sw.add(at(cbox(0.009, 0.026, 0.004, 0.001, m.pit), 0, -0.042, 0.026)); sw.add(at(alongZ(cyl(0.02, 0.02, 0.012, lamp(open), 14)), 0, 0.06, 0.02));
      return g; } };

  // ── B2 · A SHORTCUT DOOR ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // ("Some doors open from the far side to make shortcuts"; today's drain pipe has a grate that "opens only from inside".) A barred iron door of two leaves, so the way beyond is SEEN before it can be
  // taken; its latch, a dark box with a red lever, is on one face only. FAR: the latch is on the other side, seen through the bars and out of reach, the lamp on the frame amber. NEAR: the latch is on
  // this side, the red lever to hand, the lamp amber. OPEN: both leaves swung out into the room, the lamp green.
  D.shortcut_door = { no: 'B2', title: 'A SHORTCUT DOOR', sub: 'door · two tiles, in a wall · opens only from the side its latch is on · APPROVED', keyItem: false, states: ['far', 'near', 'open'], foot: [2, 1],
    build(state) { const open = state === 'open', near = state !== 'far', g = G(), m = IRON(), H = WH(), GH = H - 0.14;
      frame(g, m); g.add(at(cbox(0.07, 0.07, 0.03, 0.008, STY.mat.graphite), 0, H - 0.06, ZB + 0.135)); g.add(at(alongZ(cyl(0.022, 0.022, 0.014, lamp(open), 14)), 0, H - 0.06, ZB + 0.155));
      for (const s of [1, -1]) { const leaf = G(); leaf.position.set(s * 0.86, 0, ZB); leaf.rotation.y = open ? s * PI * 0.47 : 0; g.add(leaf); const cx = -s * 0.43;
        for (const x of [0.025, 0.835]) leaf.add(at(cbox(0.05, GH, 0.05, 0.008, m.ironDk), -s * x, GH / 2, 0)); for (const y of [0.03, GH / 2, GH - 0.03]) leaf.add(at(cbox(0.86, 0.05, 0.05, 0.008, m.ironDk), cx, y, 0));
        for (let i = 1; i <= 4; i++) leaf.add(at(cyl(0.018, 0.018, GH, m.iron, 10), -s * i * 0.172, GH / 2, 0));
        if (s > 0) { const zf = (near ? 1 : -1) * 0.055; leaf.add(at(cbox(0.2, 0.16, 0.06, 0.012, STY.mat.graphite), -0.8, GH / 2, zf)); const lv = cbox(0.034, 0.17, 0.03, 0.006, m.red); lv.position.set(-0.8, GH / 2 + 0.03, zf + (near ? 1 : -1) * 0.04); lv.rotation.z = open ? 1.2 : 0.35; leaf.add(lv);
          leaf.add(at(alongX(cyl(0.014, 0.014, 0.2, m.steel, 8)), -0.9, GH / 2 - 0.04, zf)); }   /* the latch: its box, its red lever, its bolt across to the other leaf */
      }
      return g; } };

  // ── B5 · RUBBLE ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // ("East rubble: a chest behind it; several ways through"; proposed check U9: "a Fire Technician drills it; the mech moves it". Today's is a flat pile drawn over and over.) A heap of broken
  // concrete two tiles wide (laid end to end along a wider block), a slab leaning in it, a few bricks, three bent bars of rusted steel. WHOLE, about 45 px high: it shuts the way. CLEARED: a few
  // blocks shoved to each side and grit between them: walked through. The heap is the same every time (its chance is seeded).
  D.rubble = { no: 'B5', title: 'RUBBLE', sub: 'barrier · two tiles · drilled or moved, it is cleared · APPROVED', keyItem: false, states: ['whole', 'cleared'], foot: [2, 1],
    build(state) { const whole = state !== 'cleared', g = G(); let sd = 11; const r = () => { sd = sd + 0x6D2B79F5 | 0; let t = Math.imul(sd ^ sd >>> 15, 1 | sd); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
      const conc = STY.std('#6f757d', 0.04, 0.94), concDk = STY.std('#4c525a', 0.04, 0.96), brick = STY.std('#7c4232', 0.03, 0.92), rust = STY.std('#8a5230', 0.35, 0.8), grit = STY.std('#555b63', 0.03, 0.96);
      const chunk = (x, y, z, w, h, d) => { const c = cbox(w, h, d, Math.min(w, h, d) * 0.2, r() < 0.16 ? brick : r() < 0.45 ? concDk : conc); c.position.set(x, y, z); c.rotation.set((r() - 0.5) * 0.8, (r() - 0.5) * 3, (r() - 0.5) * 0.8); g.add(c); };
      if (whole) { for (const [n, y, xr, zr, a, b] of [[11, 0.11, 0.7, 0.27, 0.22, 0.36], [8, 0.29, 0.52, 0.2, 0.2, 0.3], [5, 0.46, 0.3, 0.12, 0.16, 0.24]]) for (let i = 0; i < n; i++) chunk((r() * 2 - 1) * xr, y + (r() - 0.5) * 0.05, (r() * 2 - 1) * zr, a + r() * (b - a), (a + r() * (b - a)) * 0.75, a + r() * (b - a));
        const slab = cbox(0.56, 0.07, 0.36, 0.012, conc); slab.position.set(-0.32, 0.36, 0.14); slab.rotation.set(0.25, 0.4, 0.55); g.add(slab);
        for (const [x, y, z, rx, rz] of [[0.3, 0.46, 0.05, 0.5, -0.8], [-0.05, 0.5, -0.08, -0.5, 0.6], [0.52, 0.3, 0.12, 0.7, -1.1]]) { const b = cyl(0.008, 0.008, 0.34, rust, 6); b.position.set(x, y, z); b.rotation.set(rx, 0, rz); g.add(b); }
      } else for (const s of [1, -1]) for (let i = 0; i < 4; i++) chunk(s * (0.74 + r() * 0.12), 0.08 + r() * 0.12, (r() * 2 - 1) * 0.3, 0.16 + r() * 0.14, 0.14 + r() * 0.08, 0.16 + r() * 0.14);
      for (let i = 0; i < 18; i++) { const b = blob(0.02 + r() * 0.03, grit, 1, 0.45, 1); b.position.set((r() * 2 - 1) * 0.9, 0.008, (r() * 2 - 1) * 0.44); g.add(b); }
      return g; } };

  // ── THE DUNGEON'S WALL, A SAMPLE, AND B3 · THE SECRET DOOR IN IT ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // (the owner, 2026-11-21, asked which the dungeon's walls are: "Brick concrete"; then, shown a sample with a concrete foot and brick above it: "It should be concrete".) So the wall is POURED
  // CONCRETE, top to floor. The dungeon's walls are the layout's work, drawn by the game's wall code, not props; this SAMPLE is only so the secret door has a wall to hide in, and so the owner sees
  // one: board marks, a joint between pours at each tile, tie holes, soot under its top, a dark tide line a third of the way up with its runs, slime at the floor. 74 px tall, two tiles.
  // THE SECRET DOOR ("a secret door", the northwest wing; another from corridor 12 to area 11) is that wall with two tells for an eye that looks: a hairline seam round a door one tile wide, and
  // scrape marks on the floor where it has dragged (the owner, 2026-11-21, of how plain they are: "about right"). OPEN, that tile of wall is gone and the way is dark behind it.
  const rnd = seed => () => { seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
  const concTex = (seam) => tex(1024, 512, (c, w, h) => { const r = rnd(9); c.fillStyle = '#7b8186'; c.fillRect(0, 0, w, h); for (let y = 0; y < h; y += 30) { c.fillStyle = 'rgba(30,34,38,0.26)'; c.fillRect(0, y, w, 2); }   /* board marks */
    for (let i = 0; i < 150; i++) { c.fillStyle = 'rgba(' + (r() < 0.5 ? '255,255,255,0.045' : '0,0,0,0.07') + ')'; c.fillRect(r() * w, r() * h, 30 + r() * 100, 4 + r() * 12); }
    for (const x of [0, w / 2 - 1, w - 2]) { c.fillStyle = 'rgba(26,30,34,0.42)'; c.fillRect(x, 0, 2, h); }   /* a joint between pours, each tile */
    for (let x = 64; x < w; x += 128) for (const y of [70, 190, 310, 430]) { c.fillStyle = '#2a2e32'; c.beginPath(); c.arc(x, y, 5, 0, TAU); c.fill(); }   /* tie holes */
    let g = c.createLinearGradient(0, 0, 0, h * 0.3); g.addColorStop(0, 'rgba(10,12,14,0.38)'); g.addColorStop(1, 'rgba(10,12,14,0)'); c.fillStyle = g; c.fillRect(0, 0, w, h * 0.3);   /* soot under the top */
    const ty = h * 0.66; c.fillStyle = 'rgba(18,22,22,0.55)'; c.fillRect(0, ty, w, 9); for (let i = 0; i < 30; i++) { const x = r() * w; c.fillStyle = 'rgba(18,22,22,0.3)'; c.fillRect(x, ty, 3 + r() * 4, 20 + r() * 80); }   /* the tide line and its runs */
    c.fillStyle = 'rgba(20,26,24,0.16)'; c.fillRect(0, ty, w, h - ty);
    g = c.createLinearGradient(0, h * 0.86, 0, h); g.addColorStop(0, 'rgba(34,62,40,0)'); g.addColorStop(1, 'rgba(34,62,40,0.85)'); c.fillStyle = g; c.fillRect(0, h * 0.86, w, h * 0.14);   /* slime at the floor */
    if (seam) { c.fillStyle = 'rgba(12,10,9,0.9)'; c.fillRect(w * 0.25 - 1.5, 44, 3, h); c.fillRect(w * 0.75 - 1.5, 44, 3, h); c.fillRect(w * 0.25, 44, w * 0.5, 3); } });
  const wallSeg = (g, x0, x1, cT) => { const H = WH(), W = x1 - x0, cx = (x0 + x1) / 2, u0 = (x0 + 1) / 2, u1 = (x1 + 1) / 2, pg = new T.PlaneGeometry(W, H), uv = pg.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, u0 + uv.getX(i) * (u1 - u0));
    g.add(at(cbox(W, H, 0.24, 0.004, STY.std('#70767b', 0.03, 0.94)), cx, H / 2, ZB)); g.add(at(new T.Mesh(pg, new T.MeshStandardMaterial({ map: cT, metalness: 0, roughness: 0.93 })), cx, H / 2, ZB + 0.1205)); };
  D.wall_sample = { no: 'W', title: 'THE WALL, A SAMPLE', sub: 'not a prop: poured concrete (the owner: "It should be concrete"), for the secret door to hide in', keyItem: false, foot: [2, 1],
    build() { const g = G(); wallSeg(g, -1, 1, concTex(false)); return g; } };
  D.secret_door = { no: 'B3', title: 'THE SECRET DOOR', sub: 'door · one tile of the wall itself · two tells: a seam, and scrapes on the floor', keyItem: false, states: ['hidden', 'open'], foot: [2, 1],
    build(state) { const open = state === 'open', g = G(), cT = concTex(true);
      if (open) { wallSeg(g, -1, -0.5, cT); wallSeg(g, 0.5, 1, cT); g.add(at(new T.Mesh(new T.PlaneGeometry(1.0, WH()), new T.MeshBasicMaterial({ color: 0x020304 })), 0, WH() / 2, ZB - 0.1));
        for (const s of [1, -1]) g.add(at(cbox(0.02, WH(), 0.22, 0.003, STY.std('#3c4044', 0.02, 0.95)), s * 0.49, WH() / 2, ZB)); }   /* the door's two jambs, bare */
      else wallSeg(g, -1, 1, cT);
      const scr = tex(256, 128, (c, w, h) => { c.strokeStyle = 'rgba(8,10,12,0.55)'; c.lineWidth = 5; for (const y of [30, 52, 96]) { c.beginPath(); c.moveTo(18, y); c.quadraticCurveTo(w / 2, y + 10, w - 22, y - 4); c.stroke(); } c.lineWidth = 2; for (const y of [42, 70, 84]) { c.beginPath(); c.moveTo(40, y); c.lineTo(w - 50, y + 3); c.stroke(); } });
      const m = new T.Mesh(new T.PlaneGeometry(0.96, 0.42), new T.MeshBasicMaterial({ map: scr, transparent: true, depthWrite: false })); m.rotation.x = -PI / 2; m.position.set(0, 0.002, ZB + 0.36); g.add(m);
      return g; } };

  // ── D · THINGS THAT MOVE ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // D1, THE BRIDGE BOX, is one of the facility's ordinary crates (design/props/models/cargo.js), nothing new: the owner, 2026-11-21, shown a sealed float box drafted for it: "The bridge box should be
  // facilities ordinary crates." The same day, of an amber edge on whatever is moved: "No." So a movable thing wears no mark of its own.
  // ── D5 · A LOOSE SLAB ──
  // (Notion, of the Queen's lair: "suitable loose masonry, stone slabs, movable sewer machinery, or discarded chitin plates can be repositioned to create cover".) A thick slab of the wall's own
  // concrete fallen flat, two tiles by one, about 20 px high: low cover. A corner broken off and lying by it, a crack across it, two bar ends in its broken edge.
  D.loose_slab = { no: 'D5', title: 'A LOOSE SLAB', sub: 'movable · two tiles by one · low cover', keyItem: false, foot: [2, 1],
    build() { const g = G(), conc = STY.std('#5d6369', 0.03, 0.95), concDk = STY.std('#464c52', 0.03, 0.96), rust = STY.std('#8a5230', 0.35, 0.8), HH = px(19);
      const sh = new T.Shape(); [[-0.88, 0.4], [0.9, 0.4], [0.9, -0.16], [0.62, -0.4], [-0.88, -0.4]].forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath();
      const geo = new T.ExtrudeGeometry(sh, { depth: HH - 0.02, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 1, steps: 1 }); const slab = new T.Mesh(geo, conc); slab.rotation.x = -PI / 2; slab.position.y = 0.01; g.add(slab);
      const bit = cbox(0.2, HH * 0.8, 0.16, 0.02, concDk); bit.position.set(0.84, HH * 0.4, 0.38); bit.rotation.y = 0.6; g.add(bit);   /* its broken corner */
      const crack = tex(512, 256, (c, w, h) => { c.strokeStyle = 'rgba(14,16,18,0.8)'; c.lineWidth = 5; c.beginPath(); c.moveTo(150, 0); c.lineTo(170, 60); c.lineTo(140, 120); c.lineTo(190, 180); c.lineTo(176, h); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(140, 120); c.lineTo(80, 150); c.lineTo(50, 210); c.stroke(); });
      const cm = new T.Mesh(new T.PlaneGeometry(1.7, 0.76), new T.MeshBasicMaterial({ map: crack, transparent: true, depthWrite: false })); cm.rotation.x = -PI / 2; cm.position.set(0, HH + 0.002, 0); g.add(cm);
      for (const [x, z] of [[0.8, 0.24], [0.72, 0.31]]) { const b = cyl(0.012, 0.012, 0.16, rust, 6); b.rotation.set(PI / 2 - 0.25, 0.86, 0); b.position.set(x, HH * 0.5, z); g.add(b); }
      return g; } };

  // ── F · THE NEST'S FINDS: WHERE A SAMPLE COMES FROM WITHOUT A KILL ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // (the owner, 2026-11-20: samples "found as shed chitin, eggs, or a dead ant in the dungeon".) Each is the game's own toxic ant (its body in the 3D view: design/style-evolution/round2/chamber.js
  // buildAnt: a near-black shell tinted with its element's green, pale jaw tips, black legs, at the game's size) or its egg (today's flat egg: pale, green at its edge, glowing while the Nest is
  // infested). Kept plain. One tile each, low: walked round, not over. The looks are the agent's, provisional.
  const antMat = () => { const c = new T.Color('#17171c').lerp(new T.Color('#66ff66'), 0.07), m = new T.MeshStandardMaterial({ roughness: 0.5, metalness: 0.25 }); m.envMapIntensity = 0.45; m.color = c.convertSRGBToLinear(); return m; };
  const ell = (rx, ry, rz, m) => { const e = sphere(1, m, 22); e.scale.set(rx, ry, rz); return e; };
  const rod = (a, b, r, m) => { const A = new T.Vector3(a[0], a[1], a[2]), B = new T.Vector3(b[0], b[1], b[2]), c = cyl(r, r, A.distanceTo(B), m, 8); c.position.copy(A).add(B).multiplyScalar(0.5); c.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), B.clone().sub(A).normalize()); return c; };
  // ── F3 · A DEAD ANT ── on its back, its six legs drawn in over it, its eyes and the rim of its gaster dark
  D.dead_ant = { no: 'F3', title: 'A DEAD ANT', sub: 'the Nest · a sample is taken from it', keyItem: false, foot: [1, 1],
    build() { const g = G(), a = G(), ch = antMat(), leg = STY.std('#141416', 0.3, 0.45), tip = STY.std('#8a8296', 0.5, 0.35), dull = STY.std('#1f3320', 0.1, 0.75); a.rotation.y = 0.55; g.add(a);
      a.add(at(ell(0.11, 0.07, 0.084, ch), -0.184, 0.072, 0)); const rim = torus(1, 0.016, dull, 32); rim.rotation.x = PI / 2; rim.scale.set(0.111, 0.085, 0.4); rim.position.set(-0.184, 0.072, 0); a.add(rim);   /* the gaster, its rim */
      a.add(at(ell(0.024, 0.02, 0.02, ch), -0.068, 0.05, 0)); a.add(at(ell(0.068, 0.046, 0.042, ch), 0.006, 0.05, 0)); a.add(at(ell(0.05, 0.046, 0.054, ch), 0.118, 0.05, 0));   /* the waist, the thorax, the head */
      for (const s of [1, -1]) { const j = new T.Mesh(new T.ConeGeometry(0.013, 0.08, 8), ch); j.rotation.set(0, s * -0.4, -PI / 2); j.position.set(0.19, 0.046, s * 0.03); a.add(j); a.add(at(sphere(0.006, tip, 8), 0.226, 0.046, s * 0.016));   /* a jaw, its tip */
        a.add(rod([0.14, 0.07, s * 0.03], [0.2, 0.11, s * 0.09], 0.005, leg)); a.add(rod([0.2, 0.11, s * 0.09], [0.26, 0.012, s * 0.12], 0.004, leg));   /* an antenna, fallen */
        [[0.04, 0.03, 0.02], [0.008, 0.0, -0.015], [-0.024, -0.035, -0.05]].forEach(([x, k1, k2]) => { a.add(rod([x, 0.075, s * 0.03], [x + k1, 0.17, s * 0.105], 0.01, leg)); a.add(rod([x + k1, 0.17, s * 0.105], [x + k2, 0.125, s * 0.02], 0.0075, leg)); a.add(at(sphere(0.011, leg, 8), x + k1, 0.17, s * 0.105)); }); }   /* three legs a side, drawn in */
      return g; } };
  // ── F1 · SHED CHITIN ── a moulted skin: the same three shapes, pale, thin and hollow, split open along the back, its leg sheaths crumpled beside it
  D.shed_chitin = { no: 'F1', title: 'SHED CHITIN', sub: 'the Nest · a sample is taken from it', keyItem: false, foot: [1, 1],
    build() { const g = G(), a = G(); a.rotation.y = -0.4; g.add(a); const husk = new T.MeshStandardMaterial({ color: STY.col('#a89f84'), roughness: 0.5, metalness: 0.08, transparent: true, opacity: 0.92, side: T.DoubleSide }), sheath = STY.std('#8f876f', 0.05, 0.6);
      const shell = (rx, ry, rz, gap) => { const m = new T.Mesh(new T.SphereGeometry(1, 22, 14, PI / 2 + gap / 2, TAU - gap), husk); m.rotation.z = PI / 2; m.scale.set(ry, rx, rz); return m; };   /* a hollow shape, its gap along the top */
      a.add(at(shell(0.11, 0.06, 0.084, 1.5), -0.184, 0.058, 0)); a.add(at(shell(0.068, 0.04, 0.042, 1.3), 0.006, 0.04, 0)); a.add(at(shell(0.05, 0.04, 0.054, 1.1), 0.118, 0.04, 0));
      for (const [p, q] of [[[0.02, 0.01, 0.07], [0.09, 0.012, 0.16]], [[0.09, 0.012, 0.16], [0.03, 0.01, 0.22]], [[-0.03, 0.01, -0.06], [-0.1, 0.012, -0.15]], [[-0.1, 0.012, -0.15], [-0.02, 0.01, -0.2]], [[-0.06, 0.01, 0.08], [-0.13, 0.012, 0.17]]]) a.add(rod(p, q, 0.008, sheath));
      return g; } };
  // ── F2 · EGGS ── three, of three sizes, pale with the Nest's green light in them, a little resin at their feet
  D.egg_cluster = { no: 'F2', title: 'EGGS', sub: 'the Nest · a sample is taken from them', keyItem: false, foot: [1, 1],
    build() { const g = G(), egg = new T.MeshStandardMaterial({ color: STY.col('#c3d29c'), roughness: 0.34, metalness: 0.05, emissive: STY.col('#3f8a26'), emissiveIntensity: 0.4 }), resin = STY.std('#33421a', 0.2, 0.45);
      for (const [x, z, h, tz] of [[-0.09, -0.05, px(27), 0.1], [0.15, 0.02, px(21), -0.14], [-0.01, 0.18, px(15), 0.2]]) { const e = sphere(1, egg, 26); e.scale.set(h * 0.37, h / 2, h * 0.37); e.position.set(x, h / 2 * 0.95, z); e.rotation.z = tz; g.add(e); }
      for (const [x, z, r] of [[0.03, 0.03, 0.07], [-0.16, 0.06, 0.045], [0.2, 0.12, 0.04], [0.08, -0.1, 0.05], [-0.05, 0.25, 0.035]]) g.add(at(blob(r, resin, 1, 0.3, 1), x, r * 0.12, z));
      const glowT = tex(128, 128, (c) => { const r = c.createRadialGradient(64, 64, 2, 64, 64, 64); r.addColorStop(0, 'rgba(140,255,90,0.45)'); r.addColorStop(1, 'rgba(140,255,90,0)'); c.fillStyle = r; c.fillRect(0, 0, 128, 128); });
      const gl = new T.Mesh(new T.PlaneGeometry(0.9, 0.9), new T.MeshBasicMaterial({ map: glowT, transparent: true, depthWrite: false, toneMapped: false, blending: T.AdditiveBlending })); gl.rotation.x = -PI / 2; gl.position.set(0.02, 0.003, 0.05); gl.userData.noFrame = true; g.add(gl);
      return g; } };

  // ── A8 · AN ENERGY CARD, FOUND ──────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
  // (the owner, 2026-11-20: "Definitely energy cards and other upgrades scattered throughout the level".) On the CARDS screen an energy card's face is its element's gem (js/energygem.js); here it
  // is the thing itself: a dark card with a thin lit edge in its element's colour and that gem set THROUGH it, so it is a gem from the front and still one edge-on as it turns. Plain. FIRE, ICE and
  // TOXIC are three of the seven, for the look; UNKNOWN is the same card with the game's clear, unlit crystal (an egg with no element has one), should the owner want its element kept until it is
  // taken (Q4). The look is the agent's, provisional.
  D.energy_card = { no: 'A8', title: 'AN ENERGY CARD, FOUND', sub: 'key item · its element\'s gem set through a card', keyItem: true, states: ['fire', 'ice', 'toxic', 'unknown'],
    build(state) { const hex = { fire: '#ff3300', ice: '#99ddff', toxic: '#66ff66', unknown: '#b4bcc8' }[state] || '#b4bcc8', known = state !== 'unknown', g = G(), CW = 0.2, CT = 0.28, TH = 0.014, Y0 = 0.01, R = 0.022;
      const sh = new T.Shape(), x0 = -CW / 2, x1 = CW / 2, y0 = Y0, y1 = Y0 + CT; sh.moveTo(x0 + R, y0); sh.lineTo(x1 - R, y0); sh.quadraticCurveTo(x1, y0, x1, y0 + R); sh.lineTo(x1, y1 - R); sh.quadraticCurveTo(x1, y1, x1 - R, y1); sh.lineTo(x0 + R, y1); sh.quadraticCurveTo(x0, y1, x0, y1 - R); sh.lineTo(x0, y0 + R); sh.quadraticCurveTo(x0, y0, x0 + R, y0);
      const geo = new T.ExtrudeGeometry(sh, { depth: TH - 0.004, bevelEnabled: true, bevelThickness: 0.002, bevelSize: 0.002, bevelSegments: 1, steps: 1, curveSegments: 8 }); geo.translate(0, 0, -(TH - 0.004) / 2); g.add(new T.Mesh(geo, STY.std('#10202a', 0.3, 0.35)));
      const edge = STY.glow(hex, known ? 0.95 : 0.35);
      for (const s of [1, -1]) { const z = s * (TH / 2 + 0.0008); g.add(at(cbox(CW - 0.05, 0.006, 0.0016, 0.0005, edge), 0, y0 + 0.018, z)); g.add(at(cbox(CW - 0.05, 0.006, 0.0016, 0.0005, edge), 0, y1 - 0.018, z)); g.add(at(cbox(0.006, CT - 0.05, 0.0016, 0.0005, edge), x0 + 0.018, (y0 + y1) / 2, z)); g.add(at(cbox(0.006, CT - 0.05, 0.0016, 0.0005, edge), x1 - 0.018, (y0 + y1) / 2, z)); }
      const gem = new T.Mesh(new T.OctahedronGeometry(1, 0), new T.MeshStandardMaterial({ color: STY.col(hex), roughness: 0.12, metalness: 0.15, flatShading: true, emissive: STY.col(hex), emissiveIntensity: known ? 0.55 : 0.0 })); gem.scale.set(0.056, 0.088, 0.034); gem.position.set(0, (y0 + y1) / 2, 0); g.add(gem);
      return g; } };

  return D;
})();
