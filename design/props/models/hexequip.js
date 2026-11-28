// THE HEXAGON GROUND FLOOR'S NEW EQUIPMENT, DRAFT 1 (docs/FACILITY.md, "The hexagon ground floor"; the owner, 2026-11-28: "furnish it with all sorts of new equipment that will fill in these spots
// perfectly"; the layout approved: design/maps/hex-ground-floor/furnishing-draft-1.png, "Good to go"). Each piece stands on hexes of the floor's grid (js/cardbattle.js THE HEXES: a tile across its
// flats, its flat faces at +x and -x, its points along z), in the six-sided language of the cargo (hexcargo.js) and the facility's materials (_style.js). The camera looks from +x,+z.
// Drafts for the owner: nothing here is in the game. Every size and look is the agent's, provisional.
//   hexrack        a server rack (one hex): the Server Room's diagonal rows
//   hexpallet      a pallet rack (one hex): the Warehouse's shelving
//   hexsofa        a sofa (two hexes along x)            hextable   a low coffee table (one hex)      hexcoffee  a coffee machine on its counter (one hex)
//   hexbench       a hallway bench (two hexes along x)   hexrail    a railing post and rails (one hex side), round a stairwell
//   hexstairs      a flight of stairs up (two hexes wide, rising along -z); hexstairs.barred with its gate shut (the floor above is not built)
//   hexhatch       the stair door down to the electrical domain: a hooded hatch (one hex)
//   corner pieces, made to fill a corner of the floor: .c60 an equilateral wedge for a 60 degree corner, .c120 a half-hex for a 120 degree one
//     hexcool        a cooling unit (the Server Room)    hexshelf  corner shelving (the Warehouse)   hexplanter  a planter    hexrelay  a relay cabinet    hexflood  a floodlight
(function () {
  const S = STY, mt = S.mat;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const C30 = Math.cos(PI / 6), R = 0.5;   // R: a piece's hex, a little inside the floor's (whose circumradius is 1/sqrt(3))
  // ── the hex kit (as hexcargo.js's) ──
  function prism(pts, h, m, b) {   // a bevelled prism on an outline in the floor's plane ([x, z] points), its foot at 0
    b = b == null ? 0.012 : b; const s = new T.Shape(); pts.forEach((p, i) => i ? s.lineTo(p[0], -p[1]) : s.moveTo(p[0], -p[1])); s.closePath();
    const g = new T.ExtrudeGeometry(s, { depth: Math.max(0.002, h - 2 * b), bevelEnabled: b > 0, bevelThickness: b, bevelSize: b, bevelSegments: 1, steps: 1 });
    g.rotateX(-PI / 2); g.translate(0, b, 0); return new T.Mesh(g, m);
  }
  const hexPts = (r, x0, z0) => { const o = []; for (let i = 0; i < 6; i++) { const a = i * PI / 3; o.push([(x0 || 0) + Math.sin(a) * r, (z0 || 0) + Math.cos(a) * r]); } return o; };
  const hexB = (r, h, m, b) => prism(hexPts(r), h, m, b);
  function face(parent, k, r, y) { const th = PI / 6 + k * PI / 3, f = G(); f.position.set(Math.sin(th) * r * C30, y || 0, Math.cos(th) * r * C30); f.rotation.y = th; parent.add(f); return f; }
  const decal = (w, h, draw) => {
    const cw = Math.round(w * 256), ch = Math.round(h * 256), c = document.createElement('canvas'); c.width = cw; c.height = ch; const g = c.getContext('2d'); g.clearRect(0, 0, cw, ch); draw(g, cw, ch);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    return new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.7, metalness: 0.05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  };
  const text = (g, s, x, y, size, col) => { g.fillStyle = col; g.font = 'bold ' + size + 'px monospace'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(s, x, y); };
  // the floor's 60 degree wedge and 120 degree half-hex, their corner at the origin pointing to -x+z... laid so the corner sits in the floor's corner: built here with the corner at (0,0) opening towards +x
  const wedge60 = (L) => [[0, 0], [L * Math.cos(PI / 6), -L / 2], [L * Math.cos(PI / 6), L / 2]];

  const white = mt.laminate, whiteDk = mt.laminateDk, cap = mt.cap, steel = mt.steel, steelDk = mt.steelDk, graph = mt.graphite, rub = mt.rubber;
  const teal = mt.teal, tealDk = mt.tealDk, cyan = mt.cyan, cyanDim = mt.cyanDim, amber = mt.amberGlow, green = mt.greenGlow || S.glow('#5dff8a'), red = mt.redGlow;

  // ═════════ THE SERVER RACK: a tall six-sided cabinet, its front (face 0) a smoked-glass door over blinking drive bays, its side (face 1) vents, cable trunking on top ═════════
  function rack() {
    const g = G(), H = px(78), base = px(4);
    g.add(at(hexB(R + 0.02, base, rub, 0.006), 0, 0, 0));
    g.add(at(hexB(R, H - base - px(5), graph, 0.014), 0, base, 0));
    g.add(at(hexB(R + 0.015, px(5), steelDk, 0.012), 0, H - px(5), 0));
    for (let i = 0; i < 6; i++) { const th = i * PI / 3, p = cbox(0.05, H - px(6), 0.05, 0.01, steelDk); p.rotation.y = th; g.add(at(p, Math.sin(th) * (R - 0.01), base + (H - px(6)) / 2, Math.cos(th) * (R - 0.01))); }
    const f0 = face(g, 0, R), fw = R * 0.92, bh = H - base - px(10);
    f0.add(at(cbox(fw, bh, 0.02, 0.006, steel), 0, base + px(3) + bh / 2, 0.005));   // the door's frame
    const gl = new T.Mesh(new T.PlaneGeometry(fw * 0.86, bh * 0.92), mt.glassTint); f0.add(at(gl, 0, base + px(3) + bh / 2, 0.03));
    for (let r = 0; r < 9; r++) { const y = base + px(6) + r * bh / 9.6;   // the drive bays behind the glass, each with its lights
      f0.add(at(cbox(fw * 0.78, bh / 11, 0.012, 0.002, S.std('#141922', 0.6, 0.5)), 0, y + bh / 22, 0.018));
      for (let k = 0; k < 4; k++) f0.add(at(cbox(0.018, 0.012, 0.006, 0.001, (r * 3 + k) % 5 === 0 ? amber : (r + k) % 3 ? cyan : green), -fw * 0.3 + k * 0.04, y + bh / 22, 0.026)); }
    f0.add(at(cbox(0.022, px(14), 0.03, 0.006, steel), fw * 0.4, base + bh * 0.55, 0.04));   // the handle
    for (const k of [1, 5]) { const f = face(g, k, R); for (let r = 0; r < 12; r++) f.add(at(cbox(R * 0.7, px(1.4), 0.012, 0.002, rub), 0, base + px(8) + r * bh / 13, 0.006)); }   // the vents
    g.add(at(cbox(0.5, px(4), 0.16, 0.01, S.std('#2a2f38', 0.5, 0.5)), 0, H + px(2), 0));   // the cable trunking along the row's top
    g.add(at(cbox(0.06, px(3), 0.06, 0.006, cyan), R * 0.5, H + px(5), 0.0));                // a status lamp
    return { g };
  }
  // ═════════ THE PALLET RACK: a six-sided steel shelving unit, orange uprights, three decks of boxes and wrapped loads ═════════
  function pallet() {
    const g = G(), H = px(80), orange = S.std('#e2672a', 0.4, 0.45), deck = S.std('#7c8794', 0.7, 0.4);
    for (let i = 0; i < 6; i++) { const th = i * PI / 3; g.add(at(cbox(0.05, H, 0.05, 0.008, orange), Math.sin(th) * R, H / 2, Math.cos(th) * R)); }
    const loads = [S.std('#b98b55', 0.05, 0.8), S.std('#c9d6dc', 0.1, 0.35), S.std('#8a9b6c', 0.1, 0.75)];
    [px(4), px(30), px(56)].forEach((y, i) => {
      g.add(at(hexB(R + 0.01, px(2.4), deck, 0.006), 0, y, 0));
      g.add(at(cbox(0.36, px(18), 0.3, 0.02, loads[i % 3]), -0.05, y + px(2.4), 0.04));
      g.add(at(cbox(0.18, px(12), 0.2, 0.015, loads[(i + 1) % 3]), 0.2, y + px(2.4), -0.12));
      if (i === 1) { const w = new T.Mesh(new T.CylinderGeometry(0.1, 0.1, px(16), 12), S.std('#dfe9ef', 0, 0.2, { transparent: true, opacity: 0.7 })); g.add(at(w, 0.22, y + px(10.4), 0.16)); }
    });
    for (let i = 0; i < 6; i++) { const a = i * PI / 3 + PI / 6, b = cbox(R * 1.0, px(2), 0.04, 0.004, orange); b.rotation.y = a; g.add(at(b, Math.sin(a) * R * C30, H, Math.cos(a) * R * C30)); }   // the top frame, open
    const f0 = face(g, 0, R); f0.add(at(decal(0.32, 0.12, (c, w, h) => { c.fillStyle = '#ffd34d'; c.fillRect(0, 0, w, h); text(c, 'BAY 4-C', w / 2, h / 2, h * 0.6, '#1a1a1a'); }), 0, px(31.5), 0.03));
    return { g };
  }
  // ═════════ THE LOUNGE: a two-hex sofa, a low hex table, a coffee machine on a six-sided counter ═════════
  function sofa() {
    const g = G(), fab = S.std('#3b6fd6', 0, 0.85), fabDk = S.std('#2a52a3', 0, 0.88), seatH = px(14);
    const two = [[-0.5, 0], [0.5, 0]], outline = [[-1.0, -0.28], [1.0, -0.28], [1.0, 0.36], [-1.0, 0.36]];
    g.add(at(prism(outline, px(5), graph, 0.01), 0, 0, 0));
    g.add(at(prism(outline.map(p => [p[0] * 0.98, p[1]]), seatH - px(5), fab, 0.03), 0, px(5), 0));
    for (const [x] of two) g.add(at(cbox(0.92, px(5), 0.56, 0.05, fabDk), x, seatH + px(2), 0.05));   // the cushions
    g.add(at(cbox(2.0, px(18), 0.16, 0.05, fab), 0, seatH + px(9), -0.22));                        // the back
    for (const x of [-0.95, 0.95]) g.add(at(cbox(0.14, px(12), 0.62, 0.05, fab), x, seatH + px(5), 0.04));   // the arms
    for (const x of [-0.5, 0.5]) g.add(at(cbox(0.4, px(10), 0.08, 0.04, fabDk), x, seatH + px(9), -0.12));   // the back cushions
    return { g };
  }
  function table() {
    const g = G(); g.add(at(hexB(R * 0.32, px(9), steelDk, 0.01), 0, 0, 0)); g.add(at(hexB(R * 0.9, px(2.5), mt.wood, 0.01), 0, px(9), 0)); g.add(at(hexB(R * 0.86, px(0.6), cap, 0.002), 0, px(11.5), 0));
    g.add(at(cbox(0.14, px(1.2), 0.1, 0.01, S.std('#d83a3a', 0.1, 0.6)), 0.12, px(12.3), 0.05)); g.add(at(new T.Mesh(new T.CylinderGeometry(0.035, 0.03, px(6), 12), cap), -0.15, px(15), -0.05));   // a magazine, a mug
    return { g };
  }
  function coffee() {
    const g = G(), H = px(32);
    g.add(at(hexB(R, H, white, 0.016), 0, 0, 0)); g.add(at(hexB(R + 0.02, px(2.4), mt.wood, 0.01), 0, H, 0));
    const m = G(); m.position.set(-0.04, H + px(2.4), -0.06); g.add(m);   // the machine
    m.add(at(cbox(0.32, px(26), 0.3, 0.03, graph), 0, px(13), 0)); m.add(at(cbox(0.3, px(5), 0.1, 0.02, steel), 0, px(16), 0.16));
    m.add(at(cbox(0.12, px(6), 0.02, 0.005, mt.screenOff), 0, px(22), 0.155)); m.add(at(cbox(0.1, px(4), 0.015, 0.003, cyanDim), 0, px(22), 0.165));
    m.add(at(new T.Mesh(new T.CylinderGeometry(0.04, 0.035, px(6), 12), cap), 0, px(3), 0.12));
    g.add(at(new T.Mesh(new T.CylinderGeometry(0.03, 0.03, px(5), 10), S.std('#d83a3a', 0.1, 0.6)), 0.22, H + px(5), 0.1));   // a mug
    const f0 = face(g, 0, R); f0.add(at(cbox(R * 0.8, px(1.4), 0.012, 0.003, cyanDim), 0, H - px(4), 0.01));
    return { g };
  }
  // ═════════ THE HALLWAY: a two-hex bench; a railing segment (one hex side) for the stairwells ═════════
  function bench() {
    const g = G(), out = [[-1.0, -0.2], [1.0, -0.2], [1.0, 0.2], [-1.0, 0.2]];
    for (const x of [-0.7, 0, 0.7]) { g.add(at(cbox(0.08, px(11), 0.3, 0.01, steelDk), x, px(5.5), 0)); g.add(at(cbox(0.14, px(1.5), 0.36, 0.004, rub), x, px(0.75), 0)); }
    g.add(at(prism(out, px(3), mt.wood, 0.012), 0, px(11), 0));
    for (let i = -4; i <= 4; i++) g.add(at(cbox(0.012, px(0.6), 0.38, 0.002, mt.woodDk), i * 0.22, px(14.1), 0));
    return { g };
  }
  function rail() {
    const g = G(), H = px(26);
    for (const x of [-0.5, 0.5]) { g.add(at(hexB(0.04, H, steelDk, 0.006), x, 0, 0)); g.add(at(hexB(0.05, px(1.4), steel, 0.004), x, H, 0)); }
    for (const y of [H, H * 0.55]) { const b = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 1.0, 8), steel); b.rotation.z = PI / 2; g.add(at(b, 0, y, 0)); }
    g.add(at(cbox(1.0, px(3), 0.02, 0.004, S.hazard(4, 1)), 0, px(4), 0));
    return { g };
  }
  // ═════════ THE STAIRS UP: a flight two hexes wide, eight steps rising along -z, rails both sides; .barred its gate shut with a sign ═════════
  function stairs(barred) {
    const g = G(), n = 8, run = 1.6 / n, rise = px(8), W = 1.6, tread = S.std('#c9d4da', 0.4, 0.5), riser = S.std('#56606c', 0.6, 0.45);
    for (let i = 0; i < n; i++) { g.add(at(cbox(W, rise * (i + 1), run, 0.006, i % 2 ? tread : S.std('#bccad1', 0.4, 0.5)), 0, rise * (i + 1) / 2, 0.8 - run * (i + 0.5)));
      g.add(at(cbox(W, px(1), 0.02, 0.002, S.hazard(6, 1)), 0, rise * (i + 1) + px(0.4), 0.8 - run * i - 0.01)); }
    g.add(at(cbox(W, px(2), 0.01, 0.002, riser), 0, px(1), 0.8));
    for (const x of [-W / 2 - 0.04, W / 2 + 0.04]) {
      g.add(at(cbox(0.06, rise * n + px(6), 1.6, 0.01, steelDk), x, (rise * n + px(6)) / 2, 0));
      const hr = new T.Mesh(new T.CylinderGeometry(0.02, 0.02, Math.hypot(1.6, rise * n), 8), steel); hr.rotation.x = PI / 2 - Math.atan2(rise * n, 1.6); g.add(at(hr, x, rise * n / 2 + px(22), 0));
    }
    if (barred) {   // the gate at the foot, shut, and its sign
      const gate = G(); gate.position.set(0, 0, 0.86); g.add(gate);
      for (const x of [-0.78, 0.78]) gate.add(at(cbox(0.06, px(40), 0.06, 0.01, steelDk), x, px(20), 0));
      for (let i = 0; i < 9; i++) gate.add(at(cbox(0.018, px(36), 0.018, 0.004, steel), -0.64 + i * 0.16, px(20), 0));
      for (const y of [px(6), px(36)]) gate.add(at(cbox(1.56, px(2), 0.03, 0.004, steel), 0, y, 0));
      gate.add(at(decal(0.7, 0.22, (c, w, h) => { c.fillStyle = '#ffd34d'; c.fillRect(0, 0, w, h); c.fillStyle = '#1a1a1a'; c.fillRect(6, 6, w - 12, h - 12); text(c, 'FLOOR 1 · CLOSED', w / 2, h / 2, h * 0.38, '#ffd34d'); }), 0, px(24), 0.03));
    }
    return { g };
  }
  // ═════════ THE STAIR DOOR DOWN to the electrical domain: a six-sided hood over a hatch, a lamp and a stencil ═════════
  function hatch() {
    const g = G(), H = px(44);
    g.add(at(hexB(R, px(3), steelDk, 0.008), 0, 0, 0));
    const hood = new T.Mesh(new T.CylinderGeometry(R * 0.82, R, H, 6, 1, true), S.std('#5a6470', 0.7, 0.4, { side: T.DoubleSide })); g.add(at(hood, 0, px(3) + H / 2, 0));
    g.add(at(hexB(R * 0.84, px(3), steelDk, 0.008), 0, H, 0));
    const f0 = face(g, 0, R * 0.92); f0.add(at(cbox(R * 0.7, H * 0.78, 0.02, 0.008, S.std('#2a3038', 0.7, 0.45)), 0, px(3) + H * 0.4, 0.0));   // the door
    f0.add(at(cbox(R * 0.66, px(3), 0.022, 0.003, S.hazard(3, 1)), 0, px(3) + H * 0.82, 0.005));
    f0.add(at(decal(0.22, 0.12, (c, w, h) => { text(c, 'DOWN B-1', w / 2, h / 2, h * 0.5, '#ffd34d'); }), 0, px(3) + H * 0.5, 0.02));
    g.add(at(new T.Mesh(new T.CylinderGeometry(0.05, 0.05, px(5), 6), amber), 0.2, H + px(5.5), 0.05));
    return { g };
  }

  // ═════════ THE CORNER PIECES: each on a wedge (60) or a half-hex (120) footprint, its corner in the floor's corner ═════════
  const FOOT = { c60: wedge60(0.9), c120: [[0, 0], [0.45, -0.78], [0.9, 0], [0.45, 0.78]] };   // (c120: a diamond, its 120 degree corner in the floor's corner, its sides along the two walls)
  const shrink = (pts, k) => { const cx = pts.reduce((a, p) => a + p[0], 0) / pts.length, cz = pts.reduce((a, p) => a + p[1], 0) / pts.length; return pts.map(p => [cx + (p[0] - cx) * k, cz + (p[1] - cz) * k]); };
  const centre = pts => [pts.reduce((a, p) => a + p[0], 0) / pts.length, pts.reduce((a, p) => a + p[1], 0) / pts.length];
  function cool(foot) {   // a cooling unit: a white cabinet, a grille of louvres, a fan behind a hex guard on top
    const g = G(), H = px(56), F = FOOT[foot], c = centre(F);
    g.add(at(prism(F, px(3), rub, 0.004), 0, 0, 0)); g.add(at(prism(shrink(F, 0.96), H - px(3), white, 0.02), 0, px(3), 0)); g.add(at(prism(shrink(F, 0.98), px(3), cap, 0.01), 0, H, 0));
    const fan = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, px(2), 6), graph); g.add(at(fan, c[0], H + px(3), c[1]));
    for (let i = 0; i < 3; i++) { const b = cbox(0.36, px(0.8), 0.04, 0.002, steel); b.rotation.y = i * PI / 3; g.add(at(b, c[0], H + px(4.4), c[1])); }
    // the louvres on its faces into the room (the edges that do not touch the corner), each grille turned along its face
    for (let i = 0; i < F.length; i++) { const pa = F[i], pb = F[(i + 1) % F.length]; if (Math.hypot(pa[0], pa[1]) < 1e-6 || Math.hypot(pb[0], pb[1]) < 1e-6) continue;
      const len = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]), ang = Math.atan2(pb[1] - pa[1], pb[0] - pa[0]); let nx = (pb[1] - pa[1]) / len, nz = -(pb[0] - pa[0]) / len; const mx = (pa[0] + pb[0]) / 2, mz = (pa[1] + pb[1]) / 2;
      if ((mx + nx * 0.05 - c[0]) * nx + (mz + nz * 0.05 - c[1]) * nz < 0) { nx = -nx; nz = -nz; }
      for (let k = 0; k < 9; k++) { const l = cbox(len * 0.78, px(1.6), 0.04, 0.002, steelDk); l.rotation.y = -ang; l.rotation.x = 0.35; g.add(at(l, mx + nx * 0.02, px(10) + k * px(4.2), mz + nz * 0.02)); }
      const lamp = cbox(0.12, px(3), 0.02, 0.002, cyanDim); lamp.rotation.y = -ang; g.add(at(lamp, mx + nx * 0.025, H - px(6), mz + nz * 0.025)); }
    return { g };
  }
  function shelf(foot) {   // corner shelving: three wedge decks on corner posts, boxes and parts bins on them
    const g = G(), H = px(70), F = FOOT[foot], deck = S.std('#7c8794', 0.7, 0.4), orange = S.std('#e2672a', 0.4, 0.45), c = centre(F);
    for (const p of shrink(F, 0.92)) g.add(at(cbox(0.045, H, 0.045, 0.008, orange), p[0], H / 2, p[1]));
    [px(4), px(26), px(48), px(68)].forEach((y, i) => { g.add(at(prism(shrink(F, 0.98), px(2), deck, 0.004), 0, y, 0));
      if (i < 3) { g.add(at(cbox(0.2, px(12), 0.16, 0.015, [S.std('#b98b55', 0.05, 0.8), S.std('#3a7bff', 0.2, 0.5), S.std('#ffd34d', 0.2, 0.5)][i]), c[0] + 0.05, y + px(8), c[1] - 0.04));
        g.add(at(cbox(0.12, px(8), 0.12, 0.01, S.std('#c9d6dc', 0.1, 0.4)), c[0] - 0.12, y + px(6), c[1] + 0.08)); } });
    return { g };
  }
  function planter(foot) {   // a planter: a white wedge box of soil and a spray of leaves
    const g = G(), F = FOOT[foot], c = centre(F), H = px(18), leaf = S.std('#3f9a52', 0, 0.7), leafDk = S.std('#2b6e3a', 0, 0.75);
    g.add(at(prism(F, H, white, 0.02), 0, 0, 0)); g.add(at(prism(shrink(F, 0.88), px(1), S.std('#3a2a1c', 0, 0.95), 0.004), 0, H - px(1.5), 0));
    for (let i = 0; i < 14; i++) { const a = i * 2.39, r = 0.06 + (i % 5) * 0.04, l = new T.Mesh(new T.ConeGeometry(0.05, 0.36 + (i % 3) * 0.12, 4), i % 2 ? leaf : leafDk);
      l.position.set(c[0] + Math.cos(a) * r, H + 0.16 + (i % 3) * 0.05, c[1] + Math.sin(a) * r); l.rotation.set(Math.sin(a) * 0.5, a, Math.cos(a) * 0.5); g.add(l); }
    return { g };
  }
  function relay(foot) {   // a relay cabinet: a graphite wedge cabinet, a cyan core window, cable conduits up the wall
    const g = G(), F = FOOT[foot], c = centre(F), H = px(64);
    g.add(at(prism(F, H, graph, 0.02), 0, 0, 0)); g.add(at(prism(shrink(F, 1.04), px(3), steelDk, 0.01), 0, H, 0));
    g.add(at(cbox(0.03, px(30), 0.12, 0.004, cyan), c[0] + 0.24, px(30), c[1]));
    for (const dz of [-0.12, 0.12]) g.add(at(new T.Mesh(new T.CylinderGeometry(0.025, 0.025, px(40), 8), steelDk), 0.06, H + px(20), dz));
    return { g };
  }
  function flood(foot) {   // a floodlight: a wedge base, a mast, a lamp head angled into the room
    const g = G(), F = FOOT[foot], c = centre(F);
    g.add(at(prism(shrink(F, 0.8), px(8), S.std('#ffd34d', 0.3, 0.5), 0.012), 0, 0, 0));
    g.add(at(new T.Mesh(new T.CylinderGeometry(0.035, 0.045, px(70), 8), steelDk), c[0], px(43), c[1]));
    const head = G(); head.position.set(c[0], px(80), c[1]); head.rotation.z = -0.5; g.add(head);
    head.add(at(cbox(0.34, px(10), 0.24, 0.02, graph), 0.06, 0, 0)); head.add(at(cbox(0.02, px(7), 0.2, 0.003, S.glow('#fff6d8', 1.2)), 0.23, 0, 0));
    return { g };
  }

  const KINDS = { hexrack: rack, hexpallet: pallet, hexsofa: sofa, hextable: table, hexcoffee: coffee, hexbench: bench, hexrail: rail, hexhatch: hatch };
  const CORNERS = { hexcool: cool, hexshelf: shelf, hexplanter: planter, hexrelay: relay, hexflood: flood };
  // THE GAME'S CORNER PIECES (design/maps/hex-ground-floor/furnishing.json cornerKinds): kind + its corner's angle (60 or 120) + 'r' + its turn in twelfths of a round, so the floor's 2D sprite is
  // baked already turned to the corner it fills. Built with its corner at the origin opening along +x, turned, then moved so the middle of its outline's box is the origin (where the game draws it).
  const USED = ['hexcool120r3', 'hexcool120r5', 'hexflood120r5', 'hexplanter120r1', 'hexplanter120r11', 'hexplanter120r5', 'hexplanter120r7', 'hexrelay120r1', 'hexshelf120r1', 'hexshelf120r7'];
  function turnedCorner(kind, foot, r12) {
    const inner = CORNERS[kind](foot).g, phi = r12 * PI / 6, F = FOOT[foot].map(([x, z]) => [x * Math.cos(phi) - z * Math.sin(phi), x * Math.sin(phi) + z * Math.cos(phi)]);
    const xs = F.map(p => p[0]), zs = F.map(p => p[1]), cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2;
    const t = G(); t.rotation.y = -phi; t.add(inner); const g = G(); t.position.set(-cx, 0, -cz); g.add(t); return { g };
  }
  const variants = Object.keys(KINDS).concat(['hexsofa.2x1', 'hexbench.2x1', 'hexstairs']).filter(v => v !== 'hexsofa' && v !== 'hexbench').concat(USED);
  PROPS.hexequip = { variants, canvas: [700, 700], exposure: 0.95, build(name) {
    const [kind, v] = name.split('.');
    if (KINDS[kind]) return KINDS[kind]();
    if (kind === 'hexstairs') return stairs(v !== 'open');   // (the game's: barred, the floor above is not built)
    if (CORNERS[kind]) return CORNERS[kind](v || 'c60');      // (the drafts' sheets: unturned)
    const m = /^(hex[a-z]+)(60|120)r(\d+)$/.exec(kind); if (m && CORNERS[m[1]]) return turnedCorner(m[1], 'c' + m[2], +m[3]);
    throw new Error('no such hexequip variant ' + name);
  } };
})();
