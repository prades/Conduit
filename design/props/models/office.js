// THE OFFICE FAMILY: the reception desk, the computer desks, the armory's workbench, the control consoles and the server racks (design/props/BRIEF.md; the shared kit is _style.js).
//   reception_desk        13 x 4: a stepped reception counter with a raised sign panel, built-in info displays and a teal toe-kick glow ('lobby_desk' in the Front Lobby)
//   computer_desk.5x1.s0/.s1, .6x1, .4x1, .1x2   office desks with flat monitors (UI-like screens, one dark), keyboards, lamps, mugs; .4x1 is the Security Room's two-monitor camera desk, .1x2 the armory's rugged terminal
//   desk                  3 x 1: the armory workbench (steel frame, thick wood top, vise, pegboard of tools, parts bins, a work lamp)
//   console.1x3, .3x1.s0/.s1, .4x1   control consoles: a sloped panel of buttons, sliders and small screens, a back bank of displays, status lights, a cable run (.1x3 has a tall wall of readouts)
//   server_rack.1x5, .2x3  a row of five server cabinets (perforated doors, unit slots, blinking LEDs, cable trays) and a three-bay hot-aisle pod with cooling units
// Every model is built along x with its FRONT on +z ("canonical"); a prop longer in z than in x is turned a quarter so its front faces +x.
(function () {
  const S = STY, MT = S.mat;
  const rng = seed => { let s = (seed * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  const add = (p, m, x, y, z) => { m.position.set(x, y, z); p.add(m); return m; };
  const bx = (w, h, d, mat, b) => S.box(w, h, d, mat, b);
  // mid-tone laminates: the shared pale ones blow out to white on a pale floor, so the big surfaces are a stop darker
  const TOP_M = S.std('#8ca4ae', 0.15, 0.45), FRONT_M = S.std('#bccfd6', 0.1, 0.5), END_M = S.std('#6f8a96', 0.2, 0.5), PLATE_M = S.std('#566b76', 0.3, 0.45), WOOD_M = S.std('#6f5330', 0.05, 0.7);
  const ps = px;                                                        // a height in game px -> units
  // ---- textures (canvas, sRGB) ----
  const ctex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t; };
  const lit = (t, k) => { const m = new T.MeshBasicMaterial({ map: t, toneMapped: false }); if (k) m.color.setScalar(k); return m; };
  const SC = {};   // screen materials by kind
  const screenMat = (kind) => {
    if (SC[kind]) return SC[kind];
    const R = rng(kind.length * 17 + kind.charCodeAt(0));
    const t = ctex(160, 100, (g, w, h) => {
      const bg = { code: '#0b1630', chart: '#07202e', dash: '#0e1d33', term: '#02140a', alert: '#2a1500', cams: '#0a0f14', map: '#06182a', mail: '#10243e', blank: '#05080c' }[kind] || '#0b1630'; g.fillStyle = bg; g.fillRect(0, 0, w, h);
      if (kind === 'code') { g.fillStyle = '#16294f'; g.fillRect(0, 0, w, 10); for (let i = 0; i < 11; i++) { const ind = (i % 4) * 9; g.fillStyle = ['#6cb3ff', '#9ad0ff', '#ffb347', '#8fe8a8', '#c79bff'][(i * 3) % 5]; g.fillRect(12 + ind, 16 + i * 7, 20 + R() * 70, 3.5); g.fillStyle = '#3a4c78'; g.fillRect(3, 16 + i * 7, 5, 3.5); } }
      else if (kind === 'chart') { g.strokeStyle = 'rgba(100,200,230,0.2)'; for (let i = 1; i < 6; i++) { g.beginPath(); g.moveTo(8, i * 15); g.lineTo(w - 8, i * 15); g.stroke(); } for (let i = 0; i < 9; i++) { g.fillStyle = i % 3 ? '#31e8ff' : '#2f8fd8'; const bh = 14 + R() * 50; g.fillRect(12 + i * 16, h - 10 - bh, 10, bh); } g.strokeStyle = '#ffb347'; g.lineWidth = 2; g.beginPath(); for (let i = 0; i < 9; i++) g.lineTo(17 + i * 16, 60 - R() * 40); g.stroke(); }
      else if (kind === 'dash') { for (let i = 0; i < 4; i++) { g.fillStyle = '#16335a'; g.fillRect(6 + (i % 2) * 76, 6 + (i >> 1) * 46, 72, 40); g.fillStyle = ['#31e8ff', '#43e0a8', '#f2b13a', '#b57bff'][i]; g.fillRect(12 + (i % 2) * 76, 14 + (i >> 1) * 46, 30 + R() * 20, 10); g.fillStyle = '#7fa6d8'; g.fillRect(12 + (i % 2) * 76, 30 + (i >> 1) * 46, 58, 3); g.fillRect(12 + (i % 2) * 76, 36 + (i >> 1) * 46, 36, 3); } }
      else if (kind === 'term') { for (let i = 0; i < 11; i++) { g.fillStyle = i % 5 === 4 ? '#c8ffd8' : '#3ee06a'; g.fillRect(6, 8 + i * 8, 10 + R() * 100, 3.5); } g.fillStyle = '#c8ffd8'; g.fillRect(6, 92, 8, 4); }
      else if (kind === 'alert') { g.fillStyle = '#f2b13a'; g.beginPath(); g.moveTo(80, 14); g.lineTo(104, 58); g.lineTo(56, 58); g.closePath(); g.fill(); g.fillStyle = '#2a1500'; g.fillRect(78, 28, 5, 16); g.fillRect(78, 48, 5, 5); for (let i = 0; i < 3; i++) { g.fillStyle = '#c98a22'; g.fillRect(30, 68 + i * 9, 100 - i * 20, 4); } }
      else if (kind === 'cams') { for (let i = 0; i < 4; i++) { const x = 4 + (i % 2) * 78, y = 4 + (i >> 1) * 48; g.fillStyle = '#1b2733'; g.fillRect(x, y, 74, 44); g.fillStyle = '#2d4152'; g.fillRect(x + 6 + R() * 20, y + 14 + R() * 8, 18, 26); g.fillRect(x + 40 + R() * 14, y + 24, 22, 16); g.fillStyle = i === 1 ? '#ff4a3a' : '#43e0a8'; g.fillRect(x + 4, y + 4, 4, 4); } }
      else if (kind === 'map') { g.strokeStyle = '#2f8fd8'; g.lineWidth = 2; for (let i = 0; i < 4; i++) g.strokeRect(14 + R() * 30, 12 + R() * 20, 40 + R() * 60, 20 + R() * 40); g.fillStyle = '#ffb347'; g.beginPath(); g.arc(100, 56, 5, 0, 7); g.fill(); g.strokeStyle = '#ffb347'; g.beginPath(); g.arc(100, 56, 12, 0, 7); g.stroke(); }
      else if (kind === 'mail') { g.fillStyle = '#183a66'; g.fillRect(0, 0, 44, h); for (let i = 0; i < 9; i++) { g.fillStyle = i === 2 ? '#31e8ff' : '#2c5a94'; g.fillRect(4, 8 + i * 10, 36, 6); g.fillStyle = '#9ad0ff'; g.fillRect(52, 10 + i * 10, 30 + R() * 70, 4); } }
      else { g.fillStyle = 'rgba(120,170,220,0.08)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(70, 0); g.lineTo(0, 50); g.fill(); }
    });
    return (SC[kind] = kind === 'blank' ? new T.MeshStandardMaterial({ map: t, metalness: 0.7, roughness: 0.12 }) : lit(t, 0.95));
  };
  const keysTex = ctex(128, 40, (g, w, h) => { g.fillStyle = '#1a1f27'; g.fillRect(0, 0, w, h); for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) { g.fillStyle = r === 3 && c > 3 && c < 11 ? '#3b4452' : '#2c3441'; if (r === 3 && c > 3 && c < 11) { if (c === 4) g.fillRect(4 + c * 8, 4 + r * 9, 48, 7); } else g.fillRect(4 + c * 8, 4 + r * 9, 7, 7); } });
  const MKEYS = new T.MeshStandardMaterial({ map: keysTex, metalness: 0.2, roughness: 0.6 });
  const sticky = [S.std('#ffe36a', 0, 0.9), S.std('#ff9ad0', 0, 0.9), S.std('#8fe8a8', 0, 0.9)];
  const paper = S.std('#f4f6f8', 0, 0.9), mugCols = [S.std('#f2b13a', 0.1, 0.5), S.std('#31e8ff', 0.1, 0.5), S.std('#eaffff', 0.1, 0.45), S.std('#9a5cff', 0.1, 0.5)];

  // ---- small things (each sits on y = 0 of its own group, facing +z) ----
  function monitor(w, h, kind, tilt) {   // a flat monitor on a stand; w x h of the screen in units; faces +z
    const g = G(), m = screenMat(kind), base = bx(0.2, 0.012, 0.15, MT.graphite, 0.004); base.position.y = 0.006; g.add(base);
    const neck = bx(0.035, h * 0.55, 0.03, MT.steelDk, 0.006); neck.position.set(0, 0.012 + h * 0.275, -0.02); g.add(neck);
    const head = G(); head.position.set(0, 0.03 + h * 0.5, 0); head.rotation.x = tilt == null ? -0.06 : tilt; g.add(head);
    add(head, bx(w + 0.03, h + 0.03, 0.035, MT.graphite, 0.008), 0, 0, 0);
    const f = new T.Mesh(new T.PlaneGeometry(w, h), m); f.position.z = 0.0185; head.add(f);
    add(head, bx(0.05, 0.008, 0.004, MT.steel, 0.002), 0, -h / 2 - 0.004, 0.019);
    return g;
  }
  function keyboard() { const g = G(); add(g, bx(0.4, 0.014, 0.14, MT.graphite, 0.004), 0, 0.007, 0); const k = new T.Mesh(new T.PlaneGeometry(0.38, 0.12), MKEYS); k.rotation.x = -PI / 2; k.position.y = 0.0145; g.add(k); return g; }
  function mouse() { const g = G(); add(g, bx(0.045, 0.02, 0.07, MT.graphite, 0.01), 0, 0.01, 0); add(g, bx(0.006, 0.004, 0.02, MT.cyan, 0.001), 0, 0.021, -0.015); return g; }
  function mug(i) { const g = G(), c = cyl(0.034, 0.03, 0.08, mugCols[i % mugCols.length], 14); c.position.y = 0.04; g.add(c); const h = new T.Mesh(new T.TorusGeometry(0.022, 0.007, 6, 10, PI), mugCols[i % mugCols.length]); h.position.set(0.034, 0.042, 0); h.rotation.z = -PI / 2; g.add(h); add(g, cyl(0.03, 0.03, 0.004, S.std('#2a1a10', 0, 0.8), 12), 0, 0.078, 0); return g; }
  function papers(R) { const g = G(); for (let i = 0; i < 4; i++) { const p = bx(0.21, 0.003, 0.3, paper, 0.001); p.position.y = 0.0015 + i * 0.0032; p.rotation.y = (R() - 0.5) * 0.3; p.position.x = (R() - 0.5) * 0.02; g.add(p); } return g; }
  function notes(R) { const g = G(); for (let i = 0; i < 3; i++) { const n = bx(0.05, 0.002, 0.05, sticky[i % 3], 0.0005); n.position.set((R() - 0.5) * 0.1, 0.001 + i * 0.002, (R() - 0.5) * 0.06); n.rotation.y = R() * 1.5; g.add(n); } return g; }
  function lamp(col) { const g = G(); add(g, cyl(0.05, 0.055, 0.015, MT.graphite, 14), 0, 0.0075, 0); const a = rodBetween(g, [0, 0.015, 0], [0.02, 0.2, -0.03], 0.008, MT.steel); const b = rodBetween(g, [0.02, 0.2, -0.03], [0.08, 0.26, 0.04], 0.008, MT.steel); const hd = cyl(0.015, 0.05, 0.05, MT.graphite, 12); hd.position.set(0.1, 0.25, 0.07); hd.rotation.z = -0.5; hd.rotation.x = 0.4; g.add(hd); add(g, cyl(0.045, 0.045, 0.004, S.glow(col || '#fff3c8'), 12), 0.113, 0.228, 0.083).rotation.set(0.4, 0, -0.5); return g; }
  function rodBetween(parent, a, b, r, mat, seg) { const m = cyl(r, r, 1, mat, seg || 8), d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length() || 1e-4; m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.clone().normalize()); m.scale.set(1, L, 1); parent.add(m); return m; }
  function laptop() { const g = G(); add(g, bx(0.3, 0.012, 0.21, MT.steel, 0.004), 0, 0.006, 0); const k = new T.Mesh(new T.PlaneGeometry(0.26, 0.08), MKEYS); k.rotation.x = -PI / 2; k.position.set(0, 0.013, 0.03); g.add(k); const lid = G(); lid.position.set(0, 0.012, -0.1); lid.rotation.x = -0.28; g.add(lid); add(lid, bx(0.3, 0.2, 0.01, MT.steel, 0.004), 0, 0.1, 0); const f = new T.Mesh(new T.PlaneGeometry(0.27, 0.17), screenMat('chart')); f.position.set(0, 0.1, 0.0055); lid.add(f); return g; }
  function cable(parent, pts, r, mat) { const c = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2]))), m = new T.Mesh(new T.TubeGeometry(c, 24, r, 6, false), mat); parent.add(m); return m; }
  function led(parent, x, y, z, hex, s) { return add(parent, cyl(s || 0.008, s || 0.008, 0.006, S.glow(hex), 8), x, y, z).rotateX(PI / 2); }

  // ======================================================== computer desks ========================================================
  function desk(len, opt) {
    opt = opt || {}; const g = G(), R = rng(opt.seed || 5), D = 0.88, TOP = ps(30), tk = 0.04, kinds = opt.kinds || ['code', 'chart', 'dash', 'mail', 'term'];
    // the top: a pale slab with a teal front edge and a dark back lip
    add(g, bx(len, tk, D, opt.topMat || TOP_M, 0.012), 0, TOP - tk / 2, 0);
    add(g, bx(len - 0.02, 0.016, 0.012, opt.edge || MT.teal, 0.004), 0, TOP - tk / 2 - 0.004, D / 2 + 0.002);
    add(g, bx(len - 0.04, 0.02, 0.022, MT.graphite, 0.006), 0, TOP + 0.008, -D / 2 + 0.02);
    // the body: end panels, a modesty panel, a drawer pedestal, kick rail
    for (const sx of [-1, 1]) add(g, bx(0.035, TOP - tk, D - 0.05, END_M, 0.01), sx * (len / 2 - 0.03), (TOP - tk) / 2, 0);
    add(g, bx(len - 0.12, 0.2, 0.02, MT.graphite, 0.006), 0, TOP - tk - 0.1 - 0.02, -D / 2 + 0.06);
    add(g, bx(len - 0.1, 0.03, 0.03, MT.steelDk, 0.008), 0, 0.03, D / 2 - 0.08);
    const px0 = -len / 2 + 0.4, ped = bx(0.6, TOP - tk - 0.03, D - 0.14, FRONT_M, 0.01); ped.position.set(px0, 0.03 + (TOP - tk - 0.03) / 2, 0); g.add(ped);
    for (let i = 0; i < 3; i++) { const fh = (TOP - tk - 0.03) / 3; add(g, bx(0.56, fh - 0.015, 0.012, i === 1 ? END_M : FRONT_M, 0.004), px0, 0.03 + fh * (i + 0.5), D / 2 - 0.065); add(g, bx(0.18, 0.012, 0.014, MT.steel, 0.004), px0, 0.03 + fh * (i + 0.5) + 0.03, D / 2 - 0.058); }
    if (len > 3) { const tw = bx(0.17, 0.34, 0.34, MT.graphite, 0.012); tw.position.set(len / 2 - 0.36, 0.03 + 0.17, -0.05); g.add(tw); led(tw, 0.05, 0.12, 0.172, '#31e8ff', 0.007); add(tw, bx(0.1, 0.008, 0.002, MT.rubber, 0.001), -0.02, 0.1, 0.172); }
    // the workstations
    const n = Math.max(1, Math.round(len / (opt.pitch || 1.3))), lo = len > 3 ? 0.3 : 0.0;
    for (let i = 0; i < n; i++) {
      const cx = -len / 2 + 0.35 + lo + (i + 0.5) * (len - 0.7 - lo) / n, dark = opt.darkAt === undefined ? (n > 2 ? i === 1 : false) : opt.darkAt === i;
      const kind = dark ? 'blank' : kinds[(i + (opt.seed || 0)) % kinds.length];
      const m = monitor(0.58, 0.35, kind); m.position.set(cx, TOP, -0.17); g.add(m);
      if (opt.dual) { const m2 = monitor(0.58, 0.35, dark ? 'blank' : kinds[(i + 2) % kinds.length]); m2.position.set(cx + 0.64, TOP, -0.15); m2.rotation.y = -0.2; g.add(m2); m.position.x = cx - 0.32; m.rotation.y = 0.12; }
      const k = keyboard(); k.position.set(cx + (opt.dual ? 0.02 : 0), TOP, 0.15); g.add(k); const ms = mouse(); ms.position.set(cx + 0.3 + (opt.dual ? 0.02 : 0), TOP, 0.15); g.add(ms);
      const r = R(); if (r < 0.34) { const mg = mug(i + (opt.seed || 0)); mg.position.set(cx - 0.36, TOP, 0.12); g.add(mg); } else if (r < 0.62 || opt.laptops) { const p = papers(R); p.position.set(cx - 0.38, TOP, 0.06); g.add(p); } else { const nn = notes(R); nn.position.set(cx - 0.36, TOP, -0.1); g.add(nn); }
      if (opt.laptops && i % 2 === 1) { const l = laptop(); l.position.set(cx + 0.12, TOP, 0.08); g.add(l); }
    }
    if (opt.lamps) for (const x of opt.lamps) { const l = lamp(opt.lampCol); l.position.set(x * len / 2, TOP, -0.3); g.add(l); }
    return g;
  }
  // the Security Room's camera desk: two monitors a station, a joystick, a radio
  function secDesk() {
    const g = desk(4, { seed: 11, pitch: 2, dual: true, kinds: ['cams', 'map', 'cams', 'dash'], darkAt: -1, topMat: MT.steelDk, edge: MT.amber, lamps: [0.9] }), TOP = ps(30);
    const joy = G(); add(joy, bx(0.12, 0.03, 0.12, MT.graphite, 0.01), 0, 0.015, 0); add(joy, cyl(0.012, 0.014, 0.06, MT.steel, 8), 0, 0.06, 0); add(joy, new T.Mesh(new T.SphereGeometry(0.03, 12, 10), S.std('#c23a2a', 0.1, 0.5)), 0, 0.1, 0); joy.position.set(0.0, TOP, 0.3); g.add(joy);
    const rad = G(); add(rad, bx(0.07, 0.12, 0.05, MT.graphite, 0.01), 0, 0.06, 0); add(rad, cyl(0.004, 0.004, 0.16, MT.steel, 6), 0.02, 0.2, 0); add(rad, bx(0.04, 0.025, 0.003, S.glow('#43e0a8'), 0.001), 0, 0.1, 0.026); rad.position.set(1.6, TOP, 0.2); g.add(rad);
    return g;
  }
  // the armory's terminal: a rugged desk with a sloped display housing, a card reader, a scanner (red laser dot) and a stencilled ammo box; 2 long (canonical len 2)
  function armoryTerminal() {
    const g = G(), TOP = ps(32);
    add(g, bx(1.96, 0.05, 0.9, MT.steelDk, 0.015), 0, TOP - 0.025, 0); add(g, bx(1.94, 0.02, 0.014, MT.amber, 0.004), 0, TOP - 0.05, 0.456);
    for (const sx of [-1, 1]) add(g, bx(0.05, TOP - 0.05, 0.84, MT.graphite, 0.012), sx * 0.95, (TOP - 0.05) / 2, 0);
    add(g, bx(1.8, 0.2, 0.02, MT.graphite, 0.006), 0, 0.2, -0.38);
    const dr = bx(0.7, TOP - 0.1, 0.7, MT.steel, 0.012); dr.position.set(-0.58, (TOP - 0.1) / 2 + 0.02, 0); g.add(dr); for (let i = 0; i < 3; i++) { add(g, bx(0.62, 0.15, 0.012, MT.steelDk, 0.004), -0.58, 0.12 + i * 0.19, 0.357); add(g, bx(0.2, 0.014, 0.016, MT.amber, 0.004), -0.58, 0.17 + i * 0.19, 0.368); }
    // the display housing: a slab tilted back with a big screen, hazard-striped base
    const hs = G(); hs.position.set(0.2, TOP, -0.2); g.add(hs); add(hs, bx(0.95, 0.07, 0.34, MT.graphite, 0.012), 0, 0.035, 0); add(hs, bx(0.95, 0.012, 0.22, S.hazard(5, 1), 0.003), 0, 0.074, 0.06);
    const sl = G(); sl.position.set(0, 0.07, -0.02); sl.rotation.x = -0.22; hs.add(sl); add(sl, bx(0.9, 0.52, 0.06, MT.graphite, 0.02), 0, 0.26, 0); const f = new T.Mesh(new T.PlaneGeometry(0.8, 0.43), screenMat('map')); f.position.set(0, 0.27, 0.031); sl.add(f);
    add(sl, bx(0.5, 0.02, 0.004, MT.amber, 0.001), 0, 0.03, 0.031);
    const kb = keyboard(); kb.position.set(0.12, TOP, 0.18); g.add(kb); const ms = mouse(); ms.position.set(0.46, TOP, 0.18); g.add(ms);
    // a card reader and a scanner on the left
    const cr = G(); add(cr, bx(0.1, 0.12, 0.08, MT.graphite, 0.01), 0, 0.06, 0); add(cr, bx(0.07, 0.006, 0.01, MT.rubber, 0.001), 0, 0.1, 0.041); led(cr, -0.03, 0.04, 0.041, '#43e0a8', 0.006); cr.position.set(-0.45, TOP, -0.08); g.add(cr);
    const sc = G(); add(sc, bx(0.14, 0.05, 0.1, MT.graphite, 0.012), 0, 0.025, 0); add(sc, bx(0.06, 0.07, 0.07, MT.steelDk, 0.01), 0, 0.085, -0.01); add(sc, bx(0.07, 0.01, 0.003, S.glow('#ff3a2a'), 0.001), 0, 0.075, 0.03); sc.position.set(-0.7, TOP, 0.2); g.add(sc);
    const ac = G(); add(ac, bx(0.3, 0.16, 0.22, S.std('#4a5a3a', 0.2, 0.7), 0.012), 0, 0.08, 0); add(ac, bx(0.26, 0.012, 0.005, MT.amber, 0.002), 0, 0.12, 0.112); add(ac, bx(0.1, 0.012, 0.005, MT.amber, 0.002), -0.07, 0.07, 0.112); add(ac, bx(0.28, 0.02, 0.02, MT.steel, 0.006), 0, 0.17, 0); ac.position.set(0.78, TOP, 0.1); g.add(ac);
    cable(g, [[0.5, TOP + 0.02, -0.25], [0.8, TOP + 0.02, -0.3], [0.97, 0.3, -0.2], [0.98, 0.0, 0.0]], 0.012, MT.rubber);
    return g;
  }

  // ======================================================== the workbench ========================================================
  function workbench() {
    const g = G(), len = 3, D = 0.88, TOP = ps(33), R = rng(31);
    add(g, bx(len, 0.07, D, WOOD_M, 0.012), 0, TOP - 0.035, 0); add(g, bx(len - 0.04, 0.03, D - 0.04, MT.steelDk, 0.008), 0, TOP - 0.085, 0);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(g, bx(0.07, TOP - 0.1, 0.07, MT.steelDk, 0.012), sx * (len / 2 - 0.08), (TOP - 0.1) / 2, sz * (D / 2 - 0.08));
    add(g, bx(len - 0.3, 0.025, 0.05, MT.steelDk, 0.008), 0, 0.2, D / 2 - 0.1); add(g, bx(len - 0.3, 0.025, 0.05, MT.steelDk, 0.008), 0, 0.2, -D / 2 + 0.1);
    add(g, bx(len - 0.22, 0.03, D - 0.22, MT.steel, 0.01), 0, 0.16, 0);
    const cols = ['#f2b13a', '#31e8ff', '#9a5cff', '#43e0a8', '#c23a2a'];
    for (let i = 0; i < 6; i++) { const t = G(); t.position.set(-1.2 + i * 0.24, 0.175, 0.05 + (R() - 0.5) * 0.12); g.add(t); add(t, bx(0.2, 0.07, 0.3, S.std(cols[i % 5], 0.2, 0.6), 0.008), 0, 0.035, 0); add(t, bx(0.15, 0.05, 0.28, MT.graphite, 0.006), 0, 0.045, 0.004); }
    const ped = bx(0.7, TOP - 0.1 - 0.2, D - 0.14, MT.steel, 0.012); ped.position.set(1.0, 0.2 + (TOP - 0.1 - 0.2) / 2, 0); g.add(ped); for (let i = 0; i < 2; i++) { add(g, bx(0.62, 0.15, 0.012, MT.steelDk, 0.004), 1.0, 0.3 + i * 0.19, D / 2 - 0.065); add(g, bx(0.24, 0.016, 0.018, MT.amber, 0.004), 1.0, 0.33 + i * 0.19, D / 2 - 0.055); }
    // the vise on the left end
    const v = G(); v.position.set(-1.28, TOP, 0.18); g.add(v); add(v, bx(0.2, 0.09, 0.14, S.std('#c23a2a', 0.5, 0.45), 0.012), 0, 0.045, 0); add(v, bx(0.2, 0.06, 0.04, MT.steel, 0.008), 0, 0.11, -0.04); add(v, bx(0.2, 0.06, 0.04, MT.steel, 0.008), 0, 0.11, 0.08);
    rodBetween(v, [0.03, 0.08, 0.09], [0.03, 0.08, 0.26], 0.009, MT.steel); rodBetween(v, [-0.03, 0.08, 0.26], [0.09, 0.08, 0.26], 0.008, MT.steel);
    // a pegboard of tools along the back
    const pb = bx(len - 0.3, 0.55, 0.022, MT.graphite, 0.01); pb.position.set(0, TOP + 0.4, -D / 2 + 0.03); g.add(pb);
    const pg = new T.Mesh(new T.PlaneGeometry(len - 0.36, 0.5), new T.MeshStandardMaterial({ map: ctex(256, 40, (c, w, h) => { c.fillStyle = '#242b34'; c.fillRect(0, 0, w, h); c.fillStyle = '#323b47'; for (let y = 4; y < h; y += 8) for (let x = 4; x < w; x += 8) c.fillRect(x, y, 2, 2); }), roughness: 0.8 })); pg.position.set(0, TOP + 0.4, -D / 2 + 0.042); g.add(pg);
    for (let i = 0; i < 11; i++) {
      const x = -1.25 + i * 0.25, kind = i % 4, t = G(); t.position.set(x, TOP + 0.4, -D / 2 + 0.05); g.add(t);
      if (kind === 0) { add(t, bx(0.02, 0.22, 0.012, MT.steel, 0.004), 0, 0.02, 0); add(t, bx(0.1, 0.05, 0.016, MT.steel, 0.006), 0, 0.14, 0); add(t, bx(0.025, 0.13, 0.016, S.std('#c23a2a', 0, 0.7), 0.005), 0, -0.11, 0); }
      else if (kind === 1) { add(t, bx(0.03, 0.34, 0.012, MT.steel, 0.004), 0, 0, 0); add(t, bx(0.07, 0.06, 0.012, MT.steel, 0.004), 0, 0.17, 0); }
      else if (kind === 2) { add(t, bx(0.02, 0.16, 0.012, MT.steel, 0.004), -0.02, 0.06, 0); add(t, bx(0.02, 0.16, 0.012, MT.steel, 0.004), 0.02, 0.06, 0); add(t, bx(0.03, 0.12, 0.014, S.std(cols[i % 5], 0, 0.7), 0.006), -0.02, -0.08, 0); add(t, bx(0.03, 0.12, 0.014, S.std(cols[i % 5], 0, 0.7), 0.006), 0.02, -0.08, 0); }
      else { add(t, bx(0.1, 0.1, 0.02, MT.amber, 0.006), 0, 0.05, 0); add(t, bx(0.14, 0.012, 0.03, MT.steelDk, 0.004), 0, -0.01, 0.008); }
    }
    const lp = lamp('#fff3c8'); lp.position.set(0.5, TOP, -0.25); g.add(lp);
    const tb = G(); tb.position.set(-0.3, TOP, 0.14); g.add(tb); add(tb, bx(0.34, 0.09, 0.16, S.std('#c23a2a', 0.3, 0.5), 0.012), 0, 0.045, 0); add(tb, bx(0.3, 0.012, 0.012, MT.steel, 0.004), 0, 0.1, 0); add(tb, bx(0.06, 0.015, 0.018, MT.steel, 0.005), 0.1, 0.075, 0.09);
    const gp = G(); gp.position.set(0.1, TOP, 0.12); g.add(gp); add(gp, bx(0.3, 0.025, 0.1, MT.graphite, 0.008), 0, 0.0125, 0); add(gp, bx(0.1, 0.05, 0.06, MT.steelDk, 0.01), 0.1, 0.05, 0.0); add(gp, cyl(0.012, 0.012, 0.14, MT.steel, 8), -0.04, 0.045, 0).rotation.z = PI / 2;
    return g;
  }

  // ======================================================== consoles ========================================================
  function console_(len, opt) {
    opt = opt || {}; const g = G(), R = rng(opt.seed || 3), D = 0.92, accent = opt.accent || '#31e8ff', accent2 = opt.accent2 || '#b57bff', glowA = S.glow(accent), glowB = S.glow(accent2);
    const baseH = 0.3; add(g, bx(len - 0.02, baseH, D, MT.graphite, 0.02), 0, baseH / 2, 0);
    for (let i = 0; i < Math.round(len * 2); i++) add(g, bx(0.012, 0.18, 0.004, MT.rubber, 0.001), -len / 2 + 0.3 + i * (len - 0.6) / (Math.round(len * 2) - 1 || 1), 0.15, D / 2 + 0.001);
    add(g, bx(len - 0.04, 0.02, 0.02, glowA, 0.006), 0, 0.05, D / 2 + 0.004);
    // the sloped panel
    const pn = G(); pn.position.set(0, baseH, 0.08); pn.rotation.x = 0.5; g.add(pn); add(pn, bx(len - 0.04, 0.045, 0.58, MT.steelDk, 0.014), 0, 0.0225, 0);
    const top = 0.0455, zones = Math.max(2, Math.round(len / 0.9));
    for (let z = 0; z < zones; z++) {
      const cx = -len / 2 + 0.2 + (z + 0.5) * (len - 0.4) / zones, zw = (len - 0.5) / zones, kind = (z + (opt.seed || 0)) % 3;
      add(pn, bx(zw, 0.006, 0.5, PLATE_M, 0.002), cx, top + 0.003, 0);
      if (kind === 0) { for (let r = 0; r < 4; r++) for (let c = 0; c < Math.max(3, Math.round(zw / 0.07)); c++) { const cc = Math.max(3, Math.round(zw / 0.07)), b = bx(0.042, 0.016, 0.034, [MT.graphite, MT.graphite, MT.teal, MT.amber, S.std('#c23a2a', 0.2, 0.5), S.std('#2faa6a', 0.2, 0.5)][(r * 5 + c * 3 + z) % 6], 0.006); b.position.set(cx - zw / 2 + 0.05 + c * (zw - 0.1) / (cc - 1), top + 0.014, -0.18 + r * 0.075); pn.add(b); if ((r + c + z) % 4 === 0) add(pn, bx(0.03, 0.004, 0.022, [glowA, glowB, S.mat.amberGlow][(r + c) % 3], 0.001), b.position.x, top + 0.024, b.position.z); } }
      else if (kind === 1) { for (let s = 0; s < 4; s++) { add(pn, bx(0.012, 0.006, 0.3, MT.rubber, 0.002), cx - zw / 2 + 0.08 + s * (zw - 0.16) / 3, top + 0.01, -0.05); add(pn, bx(0.04, 0.02, 0.03, MT.steel, 0.006), cx - zw / 2 + 0.08 + s * (zw - 0.16) / 3, top + 0.02, -0.12 + R() * 0.2); add(pn, bx(0.012, 0.004, 0.06, [glowA, S.mat.greenGlow, S.mat.amberGlow, glowB][s], 0.001), cx - zw / 2 + 0.08 + s * (zw - 0.16) / 3, top + 0.008, 0.14); } const sc = new T.Mesh(new T.PlaneGeometry(zw * 0.8, 0.18), screenMat(['chart', 'dash', 'code', 'alert'][(z + 1) % 4])); sc.rotation.x = -PI / 2; sc.position.set(cx, top + 0.008, 0.18); pn.add(sc); }
      else { const sc = new T.Mesh(new T.PlaneGeometry(zw * 0.86, 0.3), screenMat(['map', 'dash', 'term', 'alert'][z % 4])); sc.rotation.x = -PI / 2; sc.position.set(cx, top + 0.008, -0.08); pn.add(sc); for (let k = 0; k < 4; k++) { const b = cyl(0.022, 0.022, 0.02, [MT.steel, MT.graphite][k % 2], 14); b.position.set(cx - zw / 2 + 0.1 + k * (zw - 0.2) / 3, top + 0.012, 0.17); pn.add(b); add(pn, bx(0.006, 0.004, 0.02, MT.cyan, 0.001), b.position.x, top + 0.024, 0.17); } }
    }
    // the back bank of displays on posts, angled a little towards the front
    const bank = G(); bank.position.set(0, baseH + 0.05, -D / 2 + 0.06); g.add(bank); const tall = !!opt.tall, bh = tall ? 1.0 : 0.52;
    add(bank, bx(len - 0.08, tall ? 0.7 : 0.1, 0.1, MT.graphite, 0.02), 0, tall ? 0.28 : 0.03, 0);
    if (tall) {
      // a wall of readouts: three columns of screens, dials and bar graphs
      for (let c = 0; c < 3; c++) for (let r = 0; r < 2; r++) { const w = (len - 0.2) / 3 - 0.06; add(bank, bx(w + 0.03, 0.34, 0.03, MT.graphite, 0.008), -len / 2 + 0.17 + (c + 0.5) * (len - 0.2) / 3, 0.2 + r * 0.38 + 0.38, 0.065); const f = new T.Mesh(new T.PlaneGeometry(w, 0.31), screenMat(['chart', 'dash', 'map', 'code', 'alert', 'term'][(c * 2 + r) % 6])); f.position.set(-len / 2 + 0.17 + (c + 0.5) * (len - 0.2) / 3, 0.2 + r * 0.38 + 0.38, 0.0815); bank.add(f); }
      for (let i = 0; i < 4; i++) { const dx = -len / 2 + 0.22 + i * 0.22; const d = cyl(0.06, 0.06, 0.02, MT.graphite, 20); d.rotation.x = PI / 2; d.position.set(dx, 1.04, 0.075 + 0.01); bank.add(d); const nd = cyl(0.002, 0.002, 0.05, S.glow('#ffb347'), 4); nd.position.set(dx, 1.04, 0.1); nd.rotation.z = R() * 3; bank.add(nd); }
      for (let i = 0; i < 10; i++) { const hh = 0.04 + R() * 0.16; add(bank, bx(0.02, hh, 0.012, [glowA, S.mat.greenGlow, S.mat.amberGlow][i % 3], 0.002), len / 2 - 0.18 + (i % 5) * 0.03 * 0, 0.0, 0).visible = false; }
      add(bank, bx(len - 0.1, 0.02, 0.02, glowB, 0.004), 0, 1.26, 0.065);
    } else {
      const n = Math.max(2, Math.round(len / 1.0)); for (let i = 0; i < n; i++) { const w = (len - 0.2) / n - 0.05, cx = -len / 2 + 0.1 + (i + 0.5) * (len - 0.2) / n; const sc = G(); sc.position.set(cx, 0.32, 0.03); sc.rotation.y = (i - (n - 1) / 2) * -0.07; sc.rotation.x = -0.12; bank.add(sc); add(sc, bx(w + 0.03, 0.34, 0.03, MT.graphite, 0.01), 0, 0, 0); const f = new T.Mesh(new T.PlaneGeometry(w, 0.31), screenMat(['map', 'dash', 'chart', 'alert', 'code'][(i + (opt.seed || 0)) % 5])); f.position.z = 0.0165; sc.add(f); rodBetween(bank, [cx, 0.0, 0.0], [cx, 0.16, 0.03], 0.012, MT.steelDk); }
    }
    // status lamps along the top of the base's end and a beacon
    for (let i = 0; i < 5; i++) add(g, cyl(0.014, 0.014, 0.012, [S.mat.greenGlow, S.mat.amberGlow, glowA, S.mat.redGlow, glowB][i], 10), len / 2 - 0.08 - i * 0.045, baseH + 0.006, D / 2 - 0.05);
    // a cable run down the +x end
    cable(g, [[len / 2 - 0.12, baseH + 0.4, -0.3], [len / 2 - 0.02, baseH + 0.2, -0.38], [len / 2 + 0.0, 0.1, -0.2], [len / 2 - 0.02, 0.012, 0.1]], 0.016, MT.rubber);
    cable(g, [[len / 2 - 0.2, baseH + 0.4, -0.35], [len / 2 - 0.08, baseH + 0.15, -0.42], [len / 2 - 0.05, 0.05, -0.1], [len / 2 - 0.3, 0.012, 0.3]], 0.011, S.std('#2fd4e8', 0.1, 0.5));
    return g;
  }

  // ======================================================== server racks ========================================================
  const rackTex = (seed) => ctex(128, 288, (g, w, h) => {
    const R = rng(seed); g.fillStyle = '#12161c'; g.fillRect(0, 0, w, h); g.fillStyle = '#1f252e'; g.fillRect(4, 4, w - 8, 18); g.fillStyle = '#3a4656'; g.fillRect(10, 9, 36, 8);
    for (let u = 0; u < 10; u++) { const y = 28 + u * 25; g.fillStyle = '#222a35'; g.fillRect(6, y, w - 12, 22); g.fillStyle = '#10141a'; g.fillRect(6, y + 21, w - 12, 2);
      const t = u % 4; if (t === 0) { for (let i = 0; i < 18; i++) { g.fillStyle = '#0a0d12'; g.fillRect(12 + i * 5.2, y + 5, 2.4, 13); } } else if (t === 1) { for (let i = 0; i < 6; i++) { g.fillStyle = '#0a0d12'; g.fillRect(12 + i * 18, y + 4, 15, 14); g.fillStyle = '#2f3a48'; g.fillRect(14 + i * 18, y + 6, 11, 4); } } else if (t === 2) { g.fillStyle = '#0a0d12'; g.fillRect(12, y + 5, 70, 12); g.fillStyle = '#2f3a48'; for (let i = 0; i < 4; i++) g.fillRect(14 + i * 17, y + 8, 14, 6); } else { for (let i = 0; i < 12; i++) { g.fillStyle = '#0a0d12'; g.fillRect(12 + i * 7.4, y + 4, 5, 14); } }
    } });
  const ledTex = (seed) => ctex(128, 288, (g, w, h) => {
    const R = rng(seed); g.clearRect(0, 0, w, h); for (let u = 0; u < 10; u++) { const y = 28 + u * 25; for (let i = 0; i < 9; i++) { if (R() < 0.35) continue; const c = ['#31e8ff', '#43e0a8', '#f2b13a', '#43e0a8', '#ff4a3a'][Math.floor(R() * 5)]; g.fillStyle = c; g.fillRect(92 + (i % 3) * 8, y + 5 + Math.floor(i / 3) * 5, 3.5, 3.5); } if (u % 3 === 0) { g.fillStyle = '#31e8ff'; g.fillRect(100, y + 17, 18, 2); } }
    g.fillStyle = '#ffb347'; g.fillRect(52, 12, 10, 3); });
  const rackMats = {};
  function rackDoor(i) { const k = i % 4; if (!rackMats[k]) { const m = new T.MeshStandardMaterial({ map: rackTex(40 + k), metalness: 0.5, roughness: 0.5 }); m.envMapIntensity = 0.5; const l = new T.MeshBasicMaterial({ map: ledTex(70 + k), transparent: true, toneMapped: false, depthWrite: false }); rackMats[k] = [m, l]; } return rackMats[k]; }
  function rackCabinet(i, depth, H) {
    const g = G(), W = 0.94, [dm, lm] = rackDoor(i);
    add(g, bx(W, H, depth, MT.graphite, 0.015), 0, H / 2, 0);
    for (const sx of [-1, 1]) add(g, bx(0.03, H - 0.02, 0.05, MT.steelDk, 0.008), sx * (W / 2 - 0.015), H / 2, depth / 2 - 0.01);
    const door = new T.Mesh(new T.PlaneGeometry(W - 0.1, H - 0.14), dm); door.position.set(0, H / 2, depth / 2 + 0.006); g.add(door);
    const leds = new T.Mesh(new T.PlaneGeometry(W - 0.1, H - 0.14), lm); leds.position.set(0, H / 2, depth / 2 + 0.01); g.add(leds);
    add(g, bx(W - 0.04, 0.05, 0.02, MT.steel, 0.006), 0, 0.03, depth / 2 + 0.004); add(g, bx(0.016, H - 0.2, 0.014, MT.steel, 0.004), W / 2 - 0.07, H / 2, depth / 2 + 0.014);
    add(g, bx(0.1, 0.03, 0.004, MT.laminate, 0.001), -0.25, H - 0.06, depth / 2 + 0.012);
    add(g, bx(W - 0.04, 0.02, depth - 0.1, MT.steelDk, 0.006), 0, H + 0.01, 0);
    return g;
  }
  function rackRow(n, depth, opt) {
    opt = opt || {}; const g = G(), H = opt.H || 1.15, R = rng(opt.seed || 9);
    for (let i = 0; i < n; i++) { const c = rackCabinet(i + (opt.seed || 0), depth, H); c.position.x = -n / 2 + 0.5 + i; g.add(c); }
    // cable tray along the top: two rails and rungs, with a few cables and a fan unit
    const tz = depth / 2 - 0.35; add(g, bx(n - 0.1, 0.03, 0.03, MT.steel, 0.006), 0, H + 0.18, tz - 0.12); add(g, bx(n - 0.1, 0.03, 0.03, MT.steel, 0.006), 0, H + 0.18, tz + 0.12);
    for (let i = 0; i < n * 5; i++) add(g, bx(0.015, 0.015, 0.26, MT.steelDk, 0.003), -n / 2 + 0.1 + i * (n - 0.2) / (n * 5 - 1), H + 0.172, tz);
    for (let i = 0; i < n; i++) { for (const sx of [-0.35, 0.35]) rodBetween(g, [-n / 2 + 0.5 + i + sx, H + 0.02, tz], [-n / 2 + 0.5 + i + sx, H + 0.17, tz], 0.008, MT.steelDk); }
    cable(g, [[-n / 2 + 0.2, H + 0.2, tz - 0.05], [-n / 2 + n * 0.5, H + 0.25, tz + 0.05], [n / 2 - 0.2, H + 0.2, tz]], 0.012, S.std('#2fd4e8', 0.1, 0.5));
    cable(g, [[-n / 2 + 0.3, H + 0.2, tz + 0.08], [0, H + 0.23, tz - 0.06], [n / 2 - 0.3, H + 0.2, tz + 0.06]], 0.01, S.std('#f2b13a', 0.1, 0.5));
    // patch cords hanging from two doors
    for (const i of [1, n - 2]) cable(g, [[-n / 2 + 0.5 + i + 0.2, H * 0.55, depth / 2 + 0.01], [-n / 2 + 0.5 + i + 0.3, H * 0.4, depth / 2 + 0.07], [-n / 2 + 0.5 + i + 0.22, H * 0.25, depth / 2 + 0.03]], 0.008, i % 2 ? S.std('#f2b13a', 0.1, 0.5) : S.std('#2fd4e8', 0.1, 0.5));
    // end panels with louvres and a caution label on the +x and -x ends
    for (const sx of [-1, 1]) { add(g, bx(0.02, H + 0.03, depth - 0.02, END_M, 0.006), sx * (n / 2 - 0.01), (H + 0.03) / 2, 0); for (let k = 0; k < 7; k++) add(g, bx(0.006, 0.02, depth * 0.55, MT.rubber, 0.001), sx * (n / 2 + 0.002), 0.4 + k * 0.08, -0.05); add(g, bx(0.006, 0.12, 0.2, S.hazard(1, 1), 0.001), sx * (n / 2 + 0.002), H - 0.14, depth / 2 - 0.2); }
    return g;
  }
  function serverPod() {   // 3 bays, 2 deep: a front row of server cabinets and a rear row of cooling units under a hot-aisle roof
    const g = G(), H = 1.15;
    const fr = rackRow(3, 1.0, { seed: 4, H }); fr.position.z = 0.5; g.add(fr);
    for (let i = 0; i < 3; i++) {   // the cooling units
      const c = G(); c.position.set(-1 + 0.5 + i, 0, -0.5); g.add(c); add(c, bx(0.94, H + 0.14, 0.96, FRONT_M, 0.02), 0, (H + 0.14) / 2, 0);
      const gr = G(); gr.position.set(0, 0.55, 0.49); c.add(gr); for (let k = 0; k < 9; k++) add(gr, bx(0.74, 0.012, 0.01, MT.graphite, 0.002), 0, -0.2 + k * 0.05, 0);
      add(c, bx(0.3, 0.1, 0.01, MT.screenOff, 0.003), 0, H - 0.12, 0.485); const f = new T.Mesh(new T.PlaneGeometry(0.26, 0.07), screenMat(i === 1 ? 'alert' : 'dash')); f.position.set(0, H - 0.12, 0.491); c.add(f);
      add(c, bx(0.84, 0.03, 0.01, glowFor(i), 0.004), 0, 0.12, 0.488);
      const fan = cyl(0.3, 0.3, 0.02, MT.graphite, 24); fan.position.set(0, H + 0.15, 0); c.add(fan); for (let k = 0; k < 5; k++) { const bl = bx(0.28, 0.006, 0.07, MT.steelDk, 0.002); bl.position.set(0, H + 0.162, 0); bl.rotation.y = k * PI / 5; c.add(bl); } const ring = new T.Mesh(new T.TorusGeometry(0.3, 0.014, 6, 24), MT.steel); ring.rotation.x = PI / 2; ring.position.set(0, H + 0.16, 0); c.add(ring);
    }
    // the roof between the rows: translucent panels in a steel frame, an exhaust duct and a warning light
    add(g, bx(2.96, 0.03, 0.12, MT.steel, 0.008), 0, H + 0.02, 0.02); add(g, new T.Mesh(new T.BoxGeometry(2.9, 0.012, 0.9), MT.glassTint), 0, H + 0.06, 0.02);
    add(g, bx(2.96, 0.04, 0.04, S.hazard(8, 1), 0.006), 0, H + 0.25, 0.7);
    return g;
  }
  function glowFor(i) { return [S.mat.cyan, S.mat.greenGlow, S.mat.amberGlow][i % 3]; }

  // ======================================================== the reception desk ========================================================
  function reception() {
    const g = G(), len = 12.9, hw = len / 2, R = rng(71), TOPF = ps(44), TOPB = ps(34);
    // the visitor-side counter: three bays, the middle one bowed out; a long front panel with groove lines, steel trim and teal toe-kick light
    const bays = [[-hw, -2.3, 0.0], [-2.3, 2.3, 0.45], [2.3, hw, 0.0]];
    for (const [a, b, bow] of bays) {
      const w = b - a, cx = (a + b) / 2, zf = 1.55 + bow;
      add(g, bx(w, TOPF - 0.07, 0.32, FRONT_M, 0.03), cx, 0.07 + (TOPF - 0.07) / 2, zf);                         // the front panel
      for (let k = 1; k < Math.round(w / 0.8); k++) add(g, bx(0.014, TOPF - 0.2, 0.012, k % 2 ? END_M : S.glow('#31e8ff', 0.7), 0.002), a + k * w / Math.round(w / 0.8), 0.07 + (TOPF - 0.07) / 2, zf + 0.164);
      add(g, bx(w + 0.02, 0.05, 0.4, MT.steel, 0.012), cx, TOPF + 0.005, zf - 0.02);                                 // the transaction ledge
      add(g, bx(w + 0.02, 0.03, 0.34, MT.teal, 0.01), cx, TOPF - 0.07, zf + 0.0);
      add(g, bx(w - 0.1, 0.03, 0.02, S.glow('#31e8ff', 0.9), 0.006), cx, 0.045, zf + 0.17);                          // the toe-kick glow
      add(g, bx(w, 0.07, 0.36, MT.graphite, 0.01), cx, 0.035, zf);
    }
    // the bow's side cheeks
    for (const sx of [-2.3, 2.3]) add(g, bx(0.04, TOPF - 0.07, 0.5, FRONT_M, 0.01), sx, 0.07 + (TOPF - 0.07) / 2, 1.78);
    // info displays set into the wing panels, and a brand strip in the bay
    for (const [cx, kind] of [[-4.4, 'map'], [4.4, 'dash']]) { add(g, bx(1.7, 0.5, 0.03, MT.graphite, 0.01), cx, 0.38, 1.72); const f = new T.Mesh(new T.PlaneGeometry(1.6, 0.42), screenMat(kind)); f.position.set(cx, 0.38, 1.738); g.add(f); }
    { const badge = ctex(128, 128, (c, w, h) => { c.fillStyle = '#071a24'; c.fillRect(0, 0, w, h); c.strokeStyle = '#31e8ff'; c.lineWidth = 8; c.beginPath(); for (let i = 0; i < 6; i++) { const a2 = i * PI / 3 + PI / 6, x = 64 + Math.cos(a2) * 44, y = 64 + Math.sin(a2) * 44; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.stroke(); c.fillStyle = '#b57bff'; c.fillRect(50, 40, 28, 48); });
      add(g, bx(0.62, 0.62, 0.03, MT.graphite, 0.01), 0, 0.37, 2.03); const bf = new T.Mesh(new T.PlaneGeometry(0.56, 0.56), lit(badge, 0.95)); bf.position.set(0, 0.37, 2.048); g.add(bf); }
    // the working surfaces behind the ledge: a lower desk the whole length, then a second one at the back
    add(g, bx(len - 0.4, 0.05, 1.1, TOP_M, 0.012), 0, TOPB - 0.025, 0.55); add(g, bx(len - 0.4, TOPB - 0.05, 0.05, END_M, 0.01), 0, (TOPB - 0.05) / 2, 1.08);
    add(g, bx(len - 0.4, TOPB - 0.05, 0.05, END_M, 0.01), 0, (TOPB - 0.05) / 2, 0.02);
    add(g, bx(len, 0.05, 0.9, TOP_M, 0.012), 0, ps(30) - 0.025, -1.0); add(g, bx(len - 0.2, ps(30) - 0.05, 0.9, END_M, 0.012), 0, (ps(30) - 0.05) / 2, -1.0);
    // the back partition: low (the lobby behind it must stay in sight), with a teal cap, a light strip and two display panels each side; a lit sign box stands on its middle
    const wallH = 0.5; add(g, bx(len, wallH, 0.12, FRONT_M, 0.02), 0, wallH / 2, -1.85);
    for (const sx of [-1, 1]) add(g, bx(0.22, wallH + 0.1, 0.2, MT.steel, 0.02), sx * (hw - 0.12), (wallH + 0.1) / 2, -1.8);
    add(g, bx(len, 0.06, 0.18, MT.teal, 0.02), 0, wallH + 0.03, -1.82); add(g, bx(len - 0.5, 0.035, 0.02, S.glow('#31e8ff'), 0.008), 0, 0.12, -1.77);
    for (const sx of [-1, 1]) for (let k = 0; k < 2; k++) { const cx = sx * (3.2 + k * 1.75); add(g, bx(1.55, 0.36, 0.03, MT.graphite, 0.01), cx, 0.38, -1.77); const f = new T.Mesh(new T.PlaneGeometry(1.47, 0.3), screenMat(['chart', 'mail', 'dash', 'code'][(k * 2 + (sx > 0 ? 1 : 0)) % 4])); f.position.set(cx, 0.38, -1.753); g.add(f); }
    const logo = ctex(1024, 112, (c, w, h) => { c.fillStyle = '#071a24'; c.fillRect(0, 0, w, h); c.strokeStyle = '#31e8ff'; c.lineWidth = 7; c.beginPath(); for (let i = 0; i < 6; i++) { const a = i * PI / 3 + PI / 6, x = 70 + Math.cos(a) * 40, y = 56 + Math.sin(a) * 40; i ? c.lineTo(x, y) : c.moveTo(x, y); } c.closePath(); c.stroke(); c.fillStyle = '#b57bff'; c.fillRect(57, 36, 26, 40); c.fillStyle = '#31e8ff'; c.fillRect(150, 30, 520, 20); c.fillRect(150, 62, 340, 12); c.fillStyle = '#7fa6d8'; c.fillRect(150, 86, 420, 7); c.fillStyle = '#f2b13a'; c.fillRect(730, 30, 96, 20); c.fillStyle = '#31e8ff'; for (let i = 0; i < 6; i++) c.fillRect(860 + i * 24, 30 + (i % 2) * 14, 14, 40 - (i % 2) * 14); });
    add(g, bx(4.6, 0.5, 0.1, MT.graphite, 0.03), 0, wallH + 0.3, -1.82); const lg = new T.Mesh(new T.PlaneGeometry(4.45, 0.4), lit(logo, 0.95)); lg.position.set(0, wallH + 0.3, -1.765); g.add(lg);
    for (const sx of [-1, 1]) add(g, bx(0.1, 0.3, 0.1, MT.steel, 0.02), sx * 2.0, wallH + 0.15, -1.82);
    add(g, bx(4.6, 0.03, 0.12, S.glow('#31e8ff'), 0.01), 0, wallH + 0.57, -1.8);
    // things on the counters: a bank of monitors seen from behind, phones, a bell, lamps, papers, a name plate, a plant-free pen holder
    for (let i = 0; i < 6; i++) { const cx = -5.4 + i * 2.15 + (i > 2 ? 0.0 : 0); const m = monitor(0.5, 0.3, 'dash'); m.rotation.y = PI + (R() - 0.5) * 0.15; m.position.set(cx, TOPB, 0.55); g.add(m); const kb = keyboard(); kb.position.set(cx + 0.02, TOPB, 0.9); g.add(kb); if (i % 2) { const mg = mug(i); mg.position.set(cx + 0.5, TOPB, 0.8); g.add(mg); } else { const p = papers(R); p.position.set(cx - 0.55, TOPB, 0.75); g.add(p); } }
    for (const cx of [-5.2, 0.0, 5.2]) { const ph = G(); ph.position.set(cx + 0.6, TOPF + 0.03, 1.5); g.add(ph); add(ph, bx(0.16, 0.04, 0.2, MT.graphite, 0.012), 0, 0.02, 0); add(ph, bx(0.14, 0.03, 0.05, MT.steel, 0.008), 0, 0.07, 0.04).rotation.z = 0.15; add(ph, bx(0.07, 0.01, 0.1, S.glow('#43e0a8'), 0.003), 0.0, 0.043, 0.0); }
    const bell = G(); bell.position.set(-1.1, TOPF + 0.03, 1.5); g.add(bell); add(bell, cyl(0.06, 0.07, 0.015, MT.steel, 16), 0, 0.0075, 0); const dome = new T.Mesh(new T.SphereGeometry(0.055, 14, 8, 0, TAU, 0, PI / 2), S.std('#d9c27a', 1, 0.3)); dome.position.y = 0.015; bell.add(dome); add(bell, cyl(0.008, 0.008, 0.02, MT.steel, 8), 0, 0.075, 0);
    for (const cx of [-3.0, 3.2]) { const l = lamp('#ffe9b0'); l.position.set(cx, TOPB, 0.2); g.add(l); }
    const hold = G(); hold.position.set(1.6, TOPF + 0.03, 1.48); g.add(hold); add(hold, cyl(0.04, 0.04, 0.09, MT.graphite, 12), 0, 0.045, 0); for (let i = 0; i < 4; i++) rodBetween(hold, [0, 0.08, 0], [(i - 1.5) * 0.02, 0.2, (i % 2 - 0.5) * 0.03], 0.004, [MT.cyan, MT.amber, MT.steel, MT.violet][i]);
    add(g, bx(0.7, 0.012, 0.16, MT.steel, 0.004), 2.0, TOPF + 0.04, 1.48).rotation.x = -0.25; add(g, bx(0.62, 0.003, 0.1, S.glow('#31e8ff', 0.8), 0.001), 2.0, TOPF + 0.047, 1.482).rotation.x = -0.25;
    // a brochure stand and a wall of lockers' worth of detail on the +x end: end panel, shelf, a plant-free tray of leaflets, a hazard kick
    add(g, bx(0.05, TOPF + 0.15, 3.6, MT.steel, 0.012), hw - 0.08, (TOPF + 0.15) / 2, 0.1); add(g, bx(0.012, 0.9, 3.0, END_M, 0.004), hw - 0.05, 0.55, 0.1);
    for (let r = 0; r < 3; r++) add(g, bx(0.14, 0.02, 1.4, MT.steel, 0.006), hw - 0.12, 0.35 + r * 0.28, 0.9);
    for (let r = 0; r < 3; r++) for (let k = 0; k < 4; k++) add(g, bx(0.08, 0.17, 0.26, [MT.cap, MT.teal, MT.amber, MT.violet][(r + k) % 4], 0.004), hw - 0.1, 0.45 + r * 0.28, 0.35 + k * 0.33).rotation.z = 0.05;
    add(g, bx(0.04, 0.05, 3.4, S.glow('#31e8ff', 0.8), 0.01), hw - 0.04, 0.05, 0.1);
    return g;
  }

  // ======================================================== the family ========================================================
  const orient = (g, rot) => { if (!rot) return g; const w = G(); g.rotation.y = rot; w.add(g); return w; };
  const BUILD = {
    'reception_desk': () => reception(),
    'computer_desk.5x1.s0': () => desk(5, { seed: 1, kinds: ['code', 'chart', 'dash', 'mail'], lamps: [-0.55] }),
    'computer_desk.5x1.s1': () => desk(5, { seed: 7, kinds: ['dash', 'term', 'mail', 'code'], laptops: true, edge: MT.violet, darkAt: 2, lamps: [0.6], lampCol: '#cfe6ff' }),
    'computer_desk.6x1': () => desk(6, { seed: 4, kinds: ['chart', 'code', 'mail', 'dash', 'alert'], darkAt: 3, lamps: [0.0] }),
    'computer_desk.4x1': () => secDesk(),
    'computer_desk.1x2': () => orient(armoryTerminal(), PI / 2),
    'desk': () => workbench(),
    'console.1x3': () => orient(console_(3, { seed: 2, tall: true, accent: '#31e8ff', accent2: '#b57bff' }), PI / 2),
    'console.3x1.s0': () => console_(3, { seed: 1, accent: '#b57bff', accent2: '#31e8ff' }),
    'console.3x1.s1': () => console_(3, { seed: 4, accent: '#f2b13a', accent2: '#31e8ff' }),
    'console.4x1': () => console_(4, { seed: 5, accent: '#31e8ff', accent2: '#43e0a8' }),
    'server_rack.1x5': () => orient(rackRow(5, 0.98, { seed: 2 }), PI / 2),
    'server_rack.2x3': () => orient(serverPod(), PI / 2),
  };
  PROPS.office = { variants: Object.keys(BUILD), canvas: [1900, 1200], exposure: 0.95, build(name) { const g = G(), m = BUILD[name](); g.add(m); return { g }; } };
})();
