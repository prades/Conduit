// THE COLD FAMILY: the Cold Storage's furniture (the room under the Experiment Lab, from the user's floor plan). Variants (named kind[.WxH|.rNN][.sN]):
//   freezer_bank.10x3   THE FREEZERS: a bank of five walk-in freezers along the north wall, ten tiles by three (the "big block with five compartments" on the plan). Pale insulated steel; each compartment
//                       two tiles wide with a heavy insulated door (a gasketed frame, a frosted window, a chrome latch, two hinges, a kick plate), a cyan temperature readout and a lamp over it, frost crusting
//                       the foot. On top, three condensing units with fan guards and copper lines into the back; on the +x end a pipe chase. Its front is on +z (it faces the room). ~122 px to the fan guards.
//   toppled_rack.s0/s1  A STORAGE RACK TOPPLED OVER (the plan's "toppled over storage racks"): a tall rack lying on its back, four tiles long and 1.3 wide, at the angle the map lays it (the long side 15 degrees
//                       off the y axis, toward -x as y grows: js/facilitymap.js `cold_rack_1`, `cold_rack_2`). Its two upright frames lie along it as ladders, its five shelf decks stand up across it, and
//                       the foam and card boxes that were on them lie between the decks and spill out of one side: s0 spills toward +x (the east rack, cold_rack_2), s1 toward -x (the west one, cold_rack_1).
// Everything is in a block: the helpers must not collide with the other families'.
{
  const MT = STY.mat, col = STY.col, std = STY.std, glow = STY.glow;
  const P = px;                                           // a height in game pixels, in units
  const deg = a => a * PI / 180;
  const Q = {
    panel: std('#e3edf2', 0.15, 0.42), panelDk: std('#c2d4dd', 0.2, 0.45), door: std('#f1f6f8', 0.08, 0.36), seam: std('#9fb4c0', 0.4, 0.4),
    steel: std('#aeb8c4', 0.92, 0.3), steelDk: std('#5d6874', 0.85, 0.38), chrome: std('#e4ebf2', 1, 0.14), graphite: MT.graphite, rubber: MT.rubber,
    glassDk: std('#1d3a48', 0.6, 0.12), label: std('#fff6d0', 0, 0.8), copper: std('#c8782e', 0.9, 0.28), insul: std('#f4f4ee', 0, 0.85),
    unit: std('#8f9ba6', 0.6, 0.4), unitDk: std('#55606b', 0.7, 0.42),
    upright: std('#2f6a73', 0.45, 0.4), uprightLit: std('#3f8590', 0.45, 0.38), beam: std('#e07a2a', 0.4, 0.42), deck: std('#b9c3cb', 0.8, 0.35),
    foam: std('#f4f7f8', 0, 0.9), foamDk: std('#dfe6ea', 0, 0.9), card: std('#c69c62', 0, 0.85), cardDk: std('#a8834f', 0, 0.85), tape: std('#d9c79a', 0.1, 0.5), blue: std('#3a7bff', 0.2, 0.45),
  };
  const frost = new T.MeshStandardMaterial({ color: col('#f6fcff'), transparent: true, opacity: 0.72, metalness: 0, roughness: 0.35, depthWrite: false }); frost.envMapIntensity = 0.6;
  const rime = std('#f7fcff', 0, 0.3);
  const G_ = { cyan: glow('#9be8ff', 0.95), mint: glow('#43e0a8', 0.9), amber: glow('#f2b13a', 0.95), red: glow('#ff4a3a', 0.9), white: glow('#eaffff', 0.95) };
  const B = (par, xr, yr, zr, mat, b) => { const m = cbox(xr[1] - xr[0], P(yr[1] - yr[0]), zr[1] - zr[0], b == null ? 0.015 : b, mat); m.position.set((xr[0] + xr[1]) / 2, P((yr[0] + yr[1]) / 2), (zr[0] + zr[1]) / 2); par.add(m); return m; };
  const Cy = (par, r, y0, y1, mat, x, z, seg) => { const m = cyl(r, r, P(y1 - y0), mat, seg || 16); m.position.set(x || 0, P((y0 + y1) / 2), z || 0); par.add(m); return m; };
  const S = (par, r, mat, x, y, z) => { const m = sphere(r, mat, 12); m.position.set(x, y, z); par.add(m); return m; };
  const rod = (par, a, b, r, mat) => { const m = cyl(r, r, 1, mat, 8), d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), l = d.length() || 1e-4; m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.scale.set(1, l, 1); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); par.add(m); return m; };
  // a box at (x, z) on the floor (or on y0 game px), turned by ang about the vertical, w x d tiles and h game px tall
  const boxAt = (par, x, z, w, d, h, ang, mat, y0, tilt) => { const m = cbox(w, P(h), d, 0.02, mat); m.position.set(x, P((y0 || 0) + h / 2), z); m.rotation.y = ang || 0; if (tilt) m.rotation.z = tilt; par.add(m); return m; };

  // ── THE FREEZERS ──
  const freezers = () => {
    const g = G(), X0 = -4.96, X1 = 4.96, ZB = -1.48, ZF = 1.2, H = 98;
    // the body: insulated panels, a darker band at the foot, a cap along the top; panel seams on the front and the +x end
    B(g, [X0, X1], [0, H], [ZB, ZF], Q.panel, 0.04);
    B(g, [X0 - 0.01, X1 + 0.01], [0, 7], [ZB - 0.01, ZF + 0.05], Q.steelDk, 0.015);   // the stainless kick strip
    B(g, [X0 - 0.02, X1 + 0.02], [H - 4, H + 2], [ZB - 0.02, ZF + 0.04], Q.panelDk, 0.02);   // the cap
    for (let k = 0; k < 5; k++) { const z0 = ZB + 0.25 + k * 0.55; B(g, [X1, X1 + 0.012], [8, H - 6], [z0, z0 + 0.02], Q.seam, 0.003); }   // the end's panel seams
    // THE FIVE COMPARTMENTS: a steel pilaster between each, a door, a readout and a lamp over it, frost at its foot
    for (const x of [-4.98, -3, -1, 1, 3, 4.98]) B(g, [x - 0.05, x + 0.05], [7, H - 4], [ZF - 0.02, ZF + 0.05], Q.steel, 0.01);
    for (let i = 0; i < 5; i++) {
      const c = -4 + i * 2, dz = ZF + 0.03;
      B(g, [c - 0.7, c + 0.7], [5, 90], [ZF - 0.01, dz], Q.graphite, 0.01);   // the gasket round the door
      B(g, [c - 0.66, c + 0.66], [7, 87], [dz - 0.02, dz + 0.07], Q.door, 0.03);   // the door: a thick insulated slab
      for (const y of [30, 56]) B(g, [c - 0.6, c + 0.6], [y, y + 0.8], [dz + 0.065, dz + 0.075], Q.seam, 0.002);   // its panel lines
      B(g, [c - 0.62, c + 0.62], [8, 20], [dz + 0.06, dz + 0.085], Q.steel, 0.006);   // the kick plate
      B(g, [c - 0.34, c + 0.16], [60, 78], [dz + 0.06, dz + 0.09], Q.chrome, 0.008); B(g, [c - 0.3, c + 0.12], [62, 76], [dz + 0.075, dz + 0.1], Q.glassDk, 0.004);   // the window: a chrome frame, dark glass,
      B(g, [c - 0.3, c + 0.12], [62, 67], [dz + 0.095, dz + 0.105], frost, 0.002); B(g, [c - 0.26, c - 0.12], [70, 75], [dz + 0.095, dz + 0.104], rime, 0.001);   // frost across its foot and a glint
      for (const y of [16, 66]) B(g, [c - 0.7, c - 0.6], [y, y + 9], [dz + 0.04, dz + 0.12], Q.chrome, 0.008);   // two hinges on the left
      B(g, [c + 0.44, c + 0.58], [34, 52], [dz + 0.06, dz + 0.13], Q.steelDk, 0.01);   // the latch box on the right, and its lever
      { const lv = cbox(0.05, P(4), 0.3, 0.012, Q.chrome); lv.position.set(c + 0.51, P(46), dz + 0.24); lv.rotation.x = -0.25; g.add(lv); S(g, 0.04, Q.graphite, c + 0.51, P(46.5), dz + 0.4); }
      B(g, [c - 0.2, c + 0.2], [80, 85], [dz + 0.06, dz + 0.08], Q.label, 0.003); for (let k = 0; k < 2; k++) B(g, [c - 0.16, c + 0.12 - k * 0.1], [81.4 + k * 2, 82.2 + k * 2], [dz + 0.078, dz + 0.086], Q.graphite, 0.001);   // its number plate
      B(g, [c - 0.32, c + 0.32], [89, 94.5], [ZF + 0.02, ZF + 0.07], Q.graphite, 0.006); B(g, [c - 0.26, c + 0.1], [90.2, 93.4], [ZF + 0.065, ZF + 0.075], G_.cyan, 0.001);   // the temperature readout
      S(g, 0.035, i === 3 ? G_.amber : G_.mint, c + 0.22, P(91.8), ZF + 0.08);   // its lamp (one compartment warns)
      B(g, [c - 0.66, c + 0.66], [0, 13], [dz + 0.06, dz + 0.1], frost, 0.008); B(g, [c - 0.46, c + 0.3 - (i % 2) * 0.2], [0, 1.6], [dz + 0.06, dz + 0.16], rime, 0.006);   // frost crusting its foot, a thin skin of rime on the floor
    }
    // ON TOP: three condensing units (a grey case with two fan guards on top), copper lines into the back
    for (const ux of [-3.2, 0, 3.2]) {
      B(g, [ux - 0.85, ux + 0.85], [H + 2, H + 20], [-1.3, -0.25], Q.unit, 0.03); B(g, [ux - 0.86, ux + 0.86], [H + 2, H + 5], [-1.31, -0.24], Q.unitDk, 0.01);
      for (let k = 0; k < 7; k++) B(g, [ux - 0.75 + k * 0.22, ux - 0.67 + k * 0.22], [H + 7, H + 17], [-0.26, -0.22], Q.unitDk, 0.003);   // the louvres on its front
      for (const fx of [ux - 0.42, ux + 0.42]) {
        Cy(g, 0.32, H + 20, H + 21.5, Q.graphite, fx, -0.78, 24);
        const ring = new T.Mesh(new T.TorusGeometry(0.33, 0.025, 6, 28), Q.chrome); ring.rotation.x = PI / 2; ring.position.set(fx, P(H + 22), -0.78); g.add(ring);
        for (let k = 0; k < 4; k++) { const a = k * PI / 4; rod(g, [fx - Math.cos(a) * 0.32, P(H + 22.4), -0.78 - Math.sin(a) * 0.32], [fx + Math.cos(a) * 0.32, P(H + 22.4), -0.78 + Math.sin(a) * 0.32], 0.008, Q.chrome); }
        S(g, 0.06, Q.steelDk, fx, P(H + 22.6), -0.78);
      }
      for (let k = 0; k < 2; k++) g.add(tube([[ux + 0.6 + k * 0.12, P(H + 8), -1.3], [ux + 0.6 + k * 0.12, P(H + 6), -1.42], [ux + 0.6 + k * 0.12, P(H - 10), -1.46]], 0.03, k ? Q.insul : Q.copper));
      B(g, [ux - 0.6, ux + 0.2], [H + 20, H + 20.8], [-1.25, -0.3], rime, 0.002);   // rime on its lid
    }
    // the pipe chase up the +x end: three insulated lines and a copper one in clamps, into a junction box
    for (let k = 0; k < 4; k++) { const z = -0.95 + k * 0.17; Cy(g, k === 3 ? 0.03 : 0.05, 6, H + 4, k === 3 ? Q.copper : Q.insul, X1 + 0.08, z, 12); }
    for (const y of [20, 50, 80]) B(g, [X1 + 0.01, X1 + 0.15], [y, y + 3], [-1.02, -0.38], Q.steelDk, 0.004);
    B(g, [X1 + 0.01, X1 + 0.14], [56, 76], [0.15, 0.75], Q.panelDk, 0.015); S(g, 0.03, G_.mint, X1 + 0.15, P(72), 0.62);
    // frost along the cap's front edge, and a sign on the end: a blue plate with a white bar
    B(g, [X0, X1], [H - 1, H + 3], [ZF + 0.02, ZF + 0.08], rime, 0.004);
    B(g, [X1 + 0.005, X1 + 0.02], [60, 74], [-0.2, 0.08], Q.blue, 0.002);
    return { g };
  };

  // ── A TOPPLED RACK ──
  // built with its length along z and turned to the map's angle; `side` is where its boxes spill (+1: +x, -1: -x)
  const rack = (side, seed) => {
    const g = G(), r = G(); g.add(r); r.rotation.y = deg(-15);   // the long side 15 degrees off z, toward -x as z grows (the three r128 rotation: (0,0,1) turns to (sin a, 0, cos a))
    const L = 2.0, W = 0.62, HT = 30;   // half its length, half its width (tiles); how high it stands lying down (its depth, game px)
    const rnd = k => { const s = Math.sin((seed + 1) * 12.9898 + k * 78.233) * 43758.5453; return s - Math.floor(s); };
    // the two upright frames, lying along it as ladders: a post on the floor, a post on top, braces between
    for (const sx of [-1, 1]) {
      const x = sx * W;
      B(r, [x - 0.05, x + 0.05], [0, 5], [-L, L], Q.upright, 0.012);
      B(r, [x - 0.05, x + 0.05], [HT - 5, HT], [-L, L], Q.uprightLit, 0.012);
      for (let k = 0; k < 9; k++) { const z0 = -L + 0.08 + k * (2 * L - 0.16) / 8, z1 = -L + 0.08 + (k + 1) * (2 * L - 0.16) / 8; if (k < 8) rod(r, [x, P(4), z0], [x, P(HT - 4), z1], 0.016, Q.upright); rod(r, [x, P(4), z0], [x, P(HT - 4), z0], 0.016, Q.upright); }
      for (let k = 0; k < 12; k++) B(r, [x + sx * 0.048, x + sx * 0.056], [HT - 3.6, HT - 1.6], [-L + 0.2 + k * 0.32, -L + 0.26 + k * 0.32], Q.graphite, 0.001);   // the punched holes along the top post
      for (const z of [-L, L]) B(r, [x - 0.09, x + 0.09], [0, HT + 1], [z - 0.04, z + 0.04], Q.steelDk, 0.01);   // the foot plates (the rack's ends)
    }
    // the five shelf decks, standing up across it, each between an orange beam on the floor and one on top
    const decks = [-1.62, -0.82, 0.0, 0.8, 1.6];
    for (const z of decks) {
      B(r, [-W, W], [0, 5], [z - 0.05, z + 0.05], Q.beam, 0.01); B(r, [-W, W], [HT - 6, HT - 1], [z - 0.05, z + 0.05], Q.beam, 0.01);
      B(r, [-W + 0.05, W - 0.05], [5, HT - 6], [z - 0.015, z + 0.015], Q.deck, 0.004);
      for (let k = 0; k < 4; k++) B(r, [-W + 0.1 + k * 0.33, -W + 0.12 + k * 0.33], [5, HT - 6], [z - 0.022, z + 0.022], Q.steelDk, 0.002);   // the deck's mesh ribs
      B(r, [-W + 0.02, W - 0.02], [HT - 1, HT], [z - 0.06, z + 0.06], rime, 0.002);   // rime on the top beam
    }
    // the boxes that stayed between the decks: foam and card, fallen over at angles
    const mats = [Q.foam, Q.card, Q.foam, Q.foamDk, Q.card];
    for (let i = 0; i + 1 < decks.length; i++) {
      const n = 1 + (rnd(i) > 0.45 ? 1 : 0);
      for (let j = 0; j < n; j++) {
        const zc = (decks[i] + decks[i + 1]) / 2 + (rnd(i * 7 + j) - 0.5) * 0.2, xc = (n === 1 ? (rnd(i + 3) - 0.5) * 0.4 : (j ? 0.28 : -0.28)), w = 0.36 + rnd(i * 3 + j) * 0.12, d = 0.38 + rnd(i * 5 + j) * 0.12, h = 16 + rnd(i * 11 + j) * 14;
        const m = mats[(i * 2 + j + seed) % mats.length], bx = boxAt(r, xc, zc, w, d, h, (rnd(i * 13 + j) - 0.5) * 0.7, m, 2, (rnd(i * 17 + j) - 0.5) * 0.25);
        if (m === Q.card) { const t = cbox(w * 1.02, P(1.6), 0.08, 0.004, Q.tape); t.position.set(0, P(h / 2), 0); bx.add(t); }   // packing tape over its top
        if (m === Q.foam || m === Q.foamDk) { const lb = cbox(w * 0.5, P(4), 0.012, 0.002, Q.blue); lb.position.set(0, 0, d / 2 + 0.006); bx.add(lb); }   // a blue label
      }
    }
    // the boxes it spilled: out of one side onto the floor, one burst open with a few packs, a lid lying by it
    const sx = side * (W + 0.3);
    boxAt(r, sx, -0.9, 0.42, 0.38, 20, 0.5, Q.foam); boxAt(r, sx + side * 0.06, 0.3, 0.4, 0.44, 18, -0.35, Q.card);
    { const o = boxAt(r, sx - side * 0.05, 1.25, 0.44, 0.4, 12, 0.9, Q.foamDk); for (let k = 0; k < 3; k++) boxAt(r, sx + side * (0.12 + k * 0.09), 1.0 + k * 0.17, 0.14, 0.1, 5, k * 0.8, k === 1 ? Q.blue : Q.foam); o.scale.y = 0.9; }
    boxAt(r, sx + side * 0.1, -0.25, 0.4, 0.3, 2.5, 1.2, Q.foam);   // a lid
    // frost along its top
    for (const sx2 of [-1, 1]) B(r, [sx2 * W - 0.04, sx2 * W + 0.04], [HT, HT + 1.2], [-L + 0.3, L - 0.4], rime, 0.002);
    return { g };
  };

  const VAR = { 'freezer_bank.10x3': freezers, 'toppled_rack.s0': () => rack(1, 0), 'toppled_rack.s1': () => rack(-1, 1) };
  PROPS.cold = { variants: Object.keys(VAR), canvas: [1500, 1000], exposure: 0.9, build(name) { return VAR[name](); } };
}
