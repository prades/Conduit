// THE LOUNGE FAMILY: the soft furnishings and the break-room machines of the Front Lobby, the Observation Deck, the hallway, the Security Room and teleport room 1 (design/props/BRIEF.md).
//   couch.3x1.s0 / .s1      a modern startup sofa along +x: seat cushions, leaning back cushions, a backrest on the far (-z) side, end arms, steel legs, teal piping (s0 blue, s1 violet)
//   table                   2x1: a low meeting/coffee table: tinted glass over a laminate shelf on a steel frame, with a tablet, mugs, a pot plant and magazines on it
//   beanbag.s0..s3          1x1: slouched, seamed beanbags (cyan, violet, amber, mint)
//   pingpong                4x2: a ping-pong table: a teal top with white lines, a net, steel A-frame legs on castors, two paddles and a ball
//   vending.1x1.s0/s1/s2    1x1: snack (amber), drinks (cyan) and gadget (violet) vending machines: a lit product window of items, a keypad and card reader, a dispenser flap, a lit header sign and a lit side panel
//   vending.2x1             a wide double machine
//   cooler                  1x1: a water cooler with an upturned glass bottle of blue water, two taps, a drip tray, a cup dispenser on the +x side
//   bin.s0 / bin.s1         1x1: a swing-lid bin (grey with a teal band / violet recycling with arrows)
//   chair                   1x1: an office chair on a five-star base with castors, FACING -z (the two chairs in the game sit south of a desk and face it: the camera sees their backs)
// The front of a machine (window, keypad, taps) is on the +z face and carries on round the +x face where the unit may stand against a west wall (a lit side panel, vents, the cup dispenser).
(function () {
  const S = STY, MT = S.mat;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const add = (g, m, x, y, z) => { g.add(at(m, x, y, z)); return m; };
  const fab = (hex, rough) => S.std(hex, 0, rough == null ? 0.92 : rough);
  const basic = (hex, k) => S.glow(hex, k);
  const along = (m) => { m.rotation.z = PI / 2; return m; };            // a cylinder lies along x
  const alongZ = (m) => { m.rotation.x = PI / 2; return m; };           // a cylinder lies along z
  const flat = (m) => { m.rotation.x = PI / 2; return m; };             // a torus lies on the floor
  const rng = (seed) => { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
  // a canvas texture: fn(g, w, h) draws it; used for the lit signs, the court and the net
  const tex = (w, h, fn, rep) => { const c = document.createElement('canvas'); c.width = w; c.height = h; fn(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; if (rep) { t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep[0], rep[1]); } return t; };
  const lit = (t, k) => { const m = new T.MeshBasicMaterial({ map: t, toneMapped: false }); if (k != null) m.color.setScalar(k); return m; };
  const decal = (w, h, m) => new T.Mesh(new T.PlaneGeometry(w, h), m);     // a plane facing +z

  // ═══════════════ the couch ═══════════════
  function couch(style) {
    const g = G(), P = style === 0 ? { seat: '#4f86e0', back: '#6f9ff0', dark: '#2c58b0', pil: '#9a5cff' } : { seat: '#8f63ee', back: '#ab85f6', dark: '#5f3dbb', pil: '#31c8e0' };
    const seatM = fab(P.seat), backM = fab(P.back), darkM = fab(P.dark), piping = MT.teal;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {            // four tapered steel legs, splayed a little
      const l = cyl(0.034, 0.022, px(7), MT.steel, 10); add(g, l, sx * 1.31, px(3.5), sz * 0.36); l.rotation.z = -sx * 0.1; l.rotation.x = sz * 0.1;
      add(g, cyl(0.05, 0.05, px(1), MT.graphite, 10), sx * 1.31 + sx * 0.012, px(0.5), sz * 0.36);
    }
    add(g, S.box(2.94, px(8), 0.92, MT.graphite, 0.03), 0, px(10), 0);                      // the plinth
    add(g, S.box(2.96, px(1), 0.94, MT.teal, 0.01), 0, px(14.2), 0);                         // a teal shadow line
    for (const sx of [-1, 1]) {                                                              // arms: a padded box with a rounded top
      add(g, S.box(0.22, px(23), 0.94, darkM, 0.06), sx * 1.36, px(26), 0.0);
      add(g, S.box(0.2, px(2.4), 0.9, piping, 0.02), sx * 1.36, px(37.8), 0.0);
    }
    add(g, S.box(2.5, px(31), 0.22, darkM, 0.06), 0, px(30), -0.36);                          // the backrest shell
    for (const [i, x] of [[0, -0.84], [1, 0], [2, 0.84]]) {                                  // seat cushions with a piped front edge
      add(g, S.box(0.82, px(8.5), 0.68, seatM, 0.07), x, px(18.8), 0.1);
      add(g, S.box(0.8, px(0.9), 0.02, piping, 0.005), x, px(22.8), 0.455);
      add(g, S.box(0.02, px(0.9), 0.62, piping, 0.005), x + (i === 2 ? 0.405 : 0), px(22.8), 0.1);
    }
    for (const x of [-0.84, 0, 0.84]) {                                                       // back cushions, leaning
      const c = add(g, S.box(0.8, px(20), 0.2, backM, 0.07), x, px(35), -0.17); c.rotation.x = -0.16;
      add(g, S.box(0.78, px(0.9), 0.02, piping, 0.005), x, px(44.6), -0.075).rotation.x = -0.16;
    }
    const pil = add(g, S.box(0.4, px(14), 0.12, fab(P.pil), 0.05), style === 0 ? -1.02 : 1.0, px(33), 0.08); pil.rotation.set(-0.35, style === 0 ? 0.5 : -0.5, style === 0 ? 0.25 : -0.25);   // a scatter cushion
    add(g, S.box(0.14, px(4), 0.02, MT.cyan, 0.004), 0, px(12), 0.468);                       // a status strip under the seat (lit)
    return { g };
  }

  // ═══════════════ the table ═══════════════
  function table() {
    const g = G();
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      add(g, S.box(0.06, px(19), 0.06, MT.steel, 0.012), sx * 0.8, px(9.5), sz * 0.36);
      add(g, S.box(0.09, px(1), 0.09, MT.graphite, 0.01), sx * 0.8, px(0.5), sz * 0.36);
    }
    add(g, S.box(1.64, px(1.2), 0.06, MT.steel, 0.01), 0, px(18), 0.36); add(g, S.box(1.64, px(1.2), 0.06, MT.steel, 0.01), 0, px(18), -0.36);   // the long rails
    add(g, S.box(0.06, px(1.2), 0.72, MT.steel, 0.01), 0.8, px(18), 0); add(g, S.box(0.06, px(1.2), 0.72, MT.steel, 0.01), -0.8, px(18), 0);
    add(g, S.box(1.5, px(1.6), 0.64, MT.laminateDk, 0.015), 0, px(8), 0);                                                                          // a low shelf
    add(g, S.box(1.9, px(2.2), 0.9, MT.graphite, 0.03), 0, px(20.3), 0);                                                                           // the top's frame
    add(g, S.box(1.82, px(2.4), 0.82, MT.glassTint, 0.02), 0, px(21.7), 0);                                                                        // tinted glass inset
    add(g, S.box(1.84, px(0.5), 0.84, MT.cyanDim, 0.005), 0, px(20.4), 0.0).scale.set(1, 0.4, 1);                                                  // (a faint lit edge under the glass)
    const topY = px(23);
    // on it: a tablet, two mugs, a pot plant, a stack of magazines
    const tab = add(g, S.box(0.34, px(1.1), 0.24, MT.graphite, 0.02), -0.5, topY + px(0.55), 0.12); tab.rotation.y = 0.4;
    const ts = add(g, decal(0.3, 0.2, basic('#3a7bff', 0.9)), -0.5, topY + px(1.2), 0.12); ts.rotation.set(-PI / 2, 0, -0.4);
    for (const [x, z, c] of [[0.3, 0.2, '#f1f8fa'], [0.52, -0.1, '#31c8e0']]) {
      add(g, cyl(0.06, 0.055, px(5), S.std(c, 0.05, 0.4), 16), x, topY + px(2.5), z);
      add(g, cyl(0.052, 0.052, px(0.3), S.std('#3a2a1a', 0, 0.5), 16), x, topY + px(4.9), z);
      const h = add(g, new T.Mesh(new T.TorusGeometry(0.035, 0.009, 6, 12, PI), S.std(c, 0.05, 0.4)), x + 0.07, topY + px(2.6), z); h.rotation.z = -PI / 2;
    }
    const pot = add(g, cyl(0.1, 0.075, px(6), MT.tealDk, 16), 0.05, topY + px(3), -0.18); add(g, cyl(0.1, 0.1, px(0.8), MT.tealLit, 16), 0.05, topY + px(6), -0.18);
    const lf = S.std('#3aa05a', 0, 0.7); for (let i = 0; i < 5; i++) { const l = new T.Mesh(new T.SphereGeometry(0.07, 8, 6), lf); l.scale.set(0.55, 1.5, 0.35); l.position.set(0.05 + Math.cos(i * 1.26) * 0.05, topY + px(11 + (i % 2) * 3), -0.18 + Math.sin(i * 1.26) * 0.05); l.rotation.set(Math.sin(i) * 0.5, 0, Math.cos(i * 1.26) * 0.6); g.add(l); }
    [['#9a5cff', 0], ['#f2b13a', 1], ['#31e8ff', 2]].forEach(([c, i]) => { const m = add(g, S.box(0.3, px(0.7), 0.22, S.std(c, 0, 0.6), 0.01), -0.12, topY + px(0.35 + i * 0.75), -0.22); m.rotation.y = 0.12 * i - 0.1; });
    return { g };
  }

  // ═══════════════ the beanbag ═══════════════
  const BEAN = ['#2fc6e0', '#9a5cff', '#f2b13a', '#43d9a8'];
  function beanbag(style) {
    const g = G(), R = 0.41, geo = new T.SphereGeometry(R, 40, 26), pos = geo.attributes.position, r = rng(style + 3);
    const lobes = [[0.7, 0.08], [2.4, 0.06], [4.1, 0.05]];
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i); const up = Math.max(0, y / R), dn = Math.max(0, -y / R), az = Math.atan2(z, x);
      let k = 1 + 0.06 * Math.sin(az * 3 + style) * (1 - Math.abs(y / R)) + 0.04 * Math.sin(az * 5 + up * 4 + style * 2);
      x *= k; z *= k; y = y * 0.72;
      if (y < 0) { const f = 1 - dn * dn * 0.15; x *= 1.04; z *= 1.04; y *= 0.55; }   // a flattened, slightly spread underside
      z += -0.11 * up * up - 0.05 * up;                                                // slouched back, the front lower
      y -= 0.06 * Math.max(0, 1 - ((x * x + (z + 0.08) * (z + 0.08)) / 0.045)) * up; // a dent in the top
      y += 0.05 * Math.sin(az * 2 + 1) * up * 0.4;
      pos.setXYZ(i, x, y, z);
    }
    geo.computeVertexNormals(); geo.translate(0, R * 0.55 * 0.72 + 0.002, 0);
    const col = BEAN[style], bm = fab(col, 0.95); g.add(new T.Mesh(geo, bm));
    // seams: meridians drawn through the displaced surface, slightly proud, darker
    const seamM = S.std(col, 0, 1); seamM.color.multiplyScalar(0.55); const seg = 26;
    for (let m = 0; m < 6; m++) {
      const az = m * PI / 3 + 0.3, pts = [];
      for (let i = 1; i < seg; i++) { const t = i / seg, th = PI * t; let x = R * Math.sin(th) * Math.cos(az), y = R * Math.cos(th), z = R * Math.sin(th) * Math.sin(az); const up = Math.max(0, y / R), dn = Math.max(0, -y / R); const az2 = Math.atan2(z, x); const k = 1 + 0.06 * Math.sin(az2 * 3 + style) * (1 - Math.abs(y / R)) + 0.04 * Math.sin(az2 * 5 + up * 4 + style * 2); x *= k; z *= k; y *= 0.72; if (y < 0) { x *= 1.04; z *= 1.04; y *= 0.55; } z += -0.11 * up * up - 0.05 * up; y -= 0.06 * Math.max(0, 1 - ((x * x + (z + 0.08) * (z + 0.08)) / 0.045)) * up; y += 0.05 * Math.sin(az2 * 2 + 1) * up * 0.4; pts.push([x * 1.006, y + R * 0.55 * 0.72 + 0.002, z * 1.006]); }
      g.add(tube(pts, 0.0085, seamM));
    }
    const hl = add(g, new T.Mesh(new T.TorusGeometry(0.07, 0.016, 8, 16, PI * 1.15), seamM), 0, R * 0.55 * 0.72 + 0.26, -0.24); hl.rotation.set(0.3, 0, PI * 0.43);   // a grab handle at the back
    return { g };
  }

  // ═══════════════ the ping-pong table ═══════════════
  function pingpong() {
    const g = G(), TW = 3.8, TD = 1.9, topY = px(26);
    const court = tex(512, 256, (c, w, h) => { c.fillStyle = '#17828a'; c.fillRect(0, 0, w, h); const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(255,255,255,0.06)'); gr.addColorStop(0.5, 'rgba(0,0,0,0.05)'); gr.addColorStop(1, 'rgba(255,255,255,0.06)'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.strokeStyle = '#f1f8fa'; c.lineWidth = 5; c.strokeRect(8, 8, w - 16, h - 16); c.beginPath(); c.moveTo(8, h / 2); c.lineTo(w - 8, h / 2); c.lineWidth = 3; c.stroke(); c.beginPath(); c.moveTo(w / 2, 8); c.lineTo(w / 2, h - 8); c.lineWidth = 2; c.globalAlpha = 0.4; c.stroke(); });
    const top = new T.Mesh(new T.PlaneGeometry(TW - 0.04, TD - 0.04), new T.MeshStandardMaterial({ map: court, roughness: 0.4, metalness: 0.1 })); top.rotation.x = -PI / 2; add(g, top, 0, topY + 0.002, 0);
    add(g, S.box(TW, px(2.6), TD, MT.graphite, 0.03), 0, topY - px(1.3), 0);                                                   // the slab
    add(g, S.box(TW - 0.04, px(0.4), TD - 0.04, MT.teal, 0.005), 0, topY - px(0.2), 0).scale.set(1, 1, 1);
    for (const sx of [-1, 1]) {                                                                                                 // two A-frame leg sets on castors
      for (const sz of [-1, 1]) {
        const lg = add(g, S.box(0.07, px(23), 0.07, MT.steel, 0.012), sx * 1.5, px(12.2), sz * 0.74); lg.rotation.x = sz * 0.05;
        add(g, cyl(0.055, 0.055, px(1.4), MT.graphite, 12), sx * 1.5, px(1.2), sz * 0.77).rotation.z = 0;
        add(g, cyl(0.03, 0.03, px(2), MT.rubber, 10), sx * 1.5, px(1.0), sz * 0.82);
      }
      add(g, S.box(0.06, px(1.6), 1.54, MT.steel, 0.01), sx * 1.5, px(12), 0);                                                  // the cross brace
      add(g, S.box(0.1, px(1.6), 1.6, MT.steelDk, 0.015), sx * 1.5, px(22.2), 0);                                                // the leg frame under the top
      add(g, S.box(0.06, px(7), 0.06, MT.steelDk, 0.01), sx * 1.5, px(8), 0.0).rotation.z = 0;
    }
    add(g, S.box(3.0, px(1.6), 0.07, MT.steelDk, 0.01), 0, px(21.6), 0);                                                         // a rail under the top
    // the net: posts with clamps, a mesh, a white tape
    const net = tex(256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = 'rgba(20,24,30,0.9)'; c.lineWidth = 2; for (let x = 0; x <= w; x += 8) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); } for (let y = 0; y <= h; y += 8) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); } });
    const nm = new T.MeshBasicMaterial({ map: net, transparent: true, side: T.DoubleSide, toneMapped: false, depthWrite: false }); nm.map.encoding = T.sRGBEncoding;
    const nt = add(g, new T.Mesh(new T.PlaneGeometry(TD + 0.14, px(6.6)), nm), 0, topY + px(3.4), 0); nt.rotation.y = PI / 2;
    add(g, S.box(0.025, px(0.9), TD + 0.14, MT.cap, 0.004), 0, topY + px(6.6), 0);
    for (const sz of [-1, 1]) { add(g, cyl(0.022, 0.022, px(7.6), MT.steel, 8), 0, topY + px(3.8), sz * (TD / 2 + 0.065)); add(g, S.box(0.07, px(2), 0.05, MT.graphite, 0.01), 0, topY + px(0.2), sz * (TD / 2 - 0.02)); }
    // two paddles and a ball
    const paddle = (x, z, rot, col) => { const p = G(); const head = cyl(0.115, 0.115, px(0.8), S.std(col, 0, 0.7), 20); head.scale.set(1, 1, 0.9); p.add(at(head, 0, px(0.4), 0)); p.add(at(cyl(0.12, 0.12, px(0.3), MT.rubber, 20), 0, px(0.15), 0)); p.add(at(S.box(0.05, px(0.9), 0.2, MT.woodDk, 0.01), 0.0, px(0.45), 0.2)); p.position.set(x, topY, z); p.rotation.y = rot; g.add(p); };
    paddle(-1.2, 0.35, 0.5, '#e24a3a'); paddle(1.3, -0.3, 3.5, '#1c2027');
    add(g, new T.Mesh(new T.SphereGeometry(0.045, 12, 10), S.std('#f7f2e6', 0, 0.35)), 0.5, topY + 0.045, 0.25);
    return { g };
  }

  // ═══════════════ the vending machines ═══════════════
  const VEND = [
    { name: 'SNAX', trim: '#f2b13a', body: '#2a3038', glowBack: '#ffe9b0', items: ['#e0402a', '#f2b13a', '#f7d36a', '#c97a2a', '#8a4a1a'], shape: 'box', shelf: 4 },
    { name: 'COLD', trim: '#31c8e0', body: '#dbeaee', glowBack: '#cdf4ff', items: ['#31c8e0', '#3a7bff', '#43d9a8', '#f1f8fa', '#e24a3a'], shape: 'can', shelf: 4 },
    { name: 'GADGETS', trim: '#9a5cff', body: '#1c2027', glowBack: '#e0d0ff', items: ['#9a5cff', '#31e8ff', '#eaffff', '#3a7bff', '#f2b13a'], shape: 'slab', shelf: 5 },
  ];
  function sign(name, w, h, trim, dark) {
    return lit(tex(256, 64, (c, W, H) => { c.fillStyle = dark ? '#0a0d12' : '#10151c'; c.fillRect(0, 0, W, H); c.fillStyle = trim; c.fillRect(0, H - 8, W, 8); c.fillRect(0, 0, W, 4); c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = '#ffffff'; c.fillText(name, W / 2, H / 2 - 2); c.fillStyle = trim; c.fillRect(14, H / 2 - 2, 26, 4); c.fillRect(W - 40, H / 2 - 2, 26, 4); }), 1);
  }
  function sideLogo(P) {
    return lit(tex(128, 256, (c, W, H) => { c.fillStyle = '#0c1118'; c.fillRect(0, 0, W, H); const gr = c.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, P.trim); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.globalAlpha = 0.5; c.fillRect(0, 0, W, H * 0.7); c.globalAlpha = 1; c.fillStyle = P.trim; c.beginPath(); c.arc(W / 2, H * 0.36, 34, 0, 6.2832); c.fill(); c.fillStyle = '#0c1118'; c.beginPath(); c.arc(W / 2, H * 0.36, 20, 0, 6.2832); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 22px sans-serif'; c.textAlign = 'center'; c.fillText(P.name, W / 2, H * 0.62); c.fillStyle = P.trim; for (let i = 0; i < 4; i++) c.fillRect(24, H * 0.7 + i * 12, W - 48, 4); }), 0.9);
  }
  function vending(styleIdx, wide) {
    const g = G(), P = VEND[styleIdx], W = wide ? 1.86 : 0.84, D = 0.78, H = px(70), r = rng(styleIdx * 7 + (wide ? 3 : 1));
    const bodyM = S.std(P.body, 0.45, 0.4), trimM = S.std(P.trim, 0.3, 0.4), glowTrim = basic(P.trim, 0.95);
    add(g, S.box(W, H, D, bodyM, 0.04), 0, H / 2 + px(2), 0);                                                         // the body
    for (const sx of [-1, 1]) add(g, S.box(0.07, px(2), 0.07, MT.graphite, 0.01), sx * (W / 2 - 0.08), px(1), D / 2 - 0.1), add(g, S.box(0.07, px(2), 0.07, MT.graphite, 0.01), sx * (W / 2 - 0.08), px(1), -D / 2 + 0.1);
    add(g, S.box(W + 0.03, px(2.2), D + 0.03, MT.graphite, 0.015), 0, H + px(2.4), 0);                                    // the top cap
    add(g, S.box(W - 0.06, px(0.7), 0.02, glowTrim, 0.003), 0, H + px(0.2), D / 2 + 0.006);                              // a lit trim line under the cap
    const zF = D / 2;
    // the header sign (lit)
    const sg = add(g, decal(W - 0.12, px(8.5), sign(P.name, W, 8, P.trim)), 0, H - px(5.2), zF + 0.008);
    add(g, S.box(W - 0.08, px(9.6), 0.02, MT.graphite, 0.004), 0, H - px(5.2), zF + 0.002);
    // the product window(s)
    const cols = wide ? 2 : 1, winW = wide ? 0.66 : 0.52, winH = px(38), winY = px(40), colX = wide ? [-0.55, 0.55] : [-0.1];
    const items = [];
    colX.forEach((cx, ci) => {
      add(g, S.box(winW + 0.05, winH + px(2), 0.04, MT.graphite, 0.01), cx, winY, zF + 0.012);                          // the frame
      add(g, decal(winW, winH, basic(P.glowBack, 0.55)), cx, winY, zF + 0.036);                                           // the lit back of the window
      const rows = P.shelf;
      for (let row = 0; row < rows; row++) {                                                                               // shelves with items on them
        const y = winY - winH / 2 + px(3) + row * (winH - px(5)) / rows; add(g, S.box(winW - 0.02, px(0.7), 0.1, MT.steelDk, 0.005), cx, y, zF + 0.075);
        const n = P.shape === 'slab' ? 3 : 4;
        for (let i = 0; i < n; i++) {
          const x = cx - winW / 2 + 0.07 + (i + 0.5) * (winW - 0.1) / n, c = P.items[(row * 3 + i + ci * 2) % P.items.length], m = basic(c, 0.85);
          let it;
          if (P.shape === 'can') { it = cyl(0.036, 0.036, px(6.2), m, 12); it.position.set(x, y + px(3.6), zF + 0.09); const top = cyl(0.037, 0.037, px(0.5), MT.steel, 12); add(g, top, x, y + px(6.9), zF + 0.09); }
          else if (P.shape === 'slab') { it = S.box(0.1, px(4.6), 0.035, m, 0.006); it.position.set(x, y + px(3), zF + 0.09); add(g, S.box(0.09, px(3.2), 0.004, basic('#10151c', 1), 0.001), x, y + px(3.2), zF + 0.109); }
          else { it = S.box(0.1, px(5.2), 0.04, m, 0.008); it.position.set(x, y + px(3.4), zF + 0.09); add(g, S.box(0.07, px(1.4), 0.004, basic('#ffffff', 0.9), 0.001), x, y + px(3.7), zF + 0.112); }
          g.add(it);
        }
        add(g, S.box(0.05, px(0.5), 0.015, basic(P.trim, 0.9), 0.003), cx - winW / 2 + 0.06, y + px(1.2), zF + 0.13);   // a price tag rail
      }
      add(g, decal(winW + 0.02, winH, MT.glass), cx, winY, zF + 0.145);                                                      // the glass
    });
    // the control column: a keypad, a card reader with a lamp, a coin slot, a lit button
    const kx = wide ? 0 : W / 2 - 0.1, kW = 0.13;
    if (!wide) { /* the single machine has its controls at the right of the window */ }
    const cx0 = wide ? 0 : 0.31;
    if (wide) add(g, S.box(0.16, winH + px(2), 0.05, MT.graphite, 0.01), 0, winY, zF + 0.016);
    const pad = add(g, S.box(kW + (wide ? 0.0 : 0.0), px(10), 0.04, MT.graphite, 0.01), wide ? 0 : cx0, winY + px(8), zF + 0.04 + (wide ? 0.03 : 0));
    for (let i = 0; i < 12; i++) add(g, S.box(0.026, px(1.7), 0.02, i === 11 ? basic('#43e0a8', 0.9) : MT.cap, 0.004), (wide ? 0 : cx0) + (i % 3 - 1) * 0.038, winY + px(10.5) - Math.floor(i / 3) * px(2.5), zF + 0.07 + (wide ? 0.03 : 0));
    add(g, S.box(kW, px(4), 0.04, MT.steelDk, 0.01), wide ? 0 : cx0, winY - px(1), zF + 0.05 + (wide ? 0.03 : 0));                  // the card reader
    add(g, S.box(0.07, px(0.6), 0.02, basic('#43e0a8', 0.95), 0.003), wide ? 0 : cx0, winY - px(0.4), zF + 0.074 + (wide ? 0.03 : 0));
    add(g, S.box(0.03, px(3.2), 0.02, MT.rubber, 0.004), wide ? 0 : cx0, winY - px(8), zF + 0.06 + (wide ? 0.03 : 0));                   // the coin slot
    add(g, S.box(0.07, px(1.6), 0.02, basic(P.trim, 0.9), 0.004), wide ? 0 : cx0, winY - px(12), zF + 0.06 + (wide ? 0.03 : 0));
    // the dispenser: a recessed bay with a hinged flap
    const dW = wide ? 1.3 : 0.64;
    add(g, S.box(dW, px(10), 0.05, MT.rubber, 0.01), 0, px(11), zF + 0.006);
    const flap = add(g, S.box(dW - 0.1, px(7.2), 0.02, MT.steelDk, 0.006), 0, px(11.2), zF + 0.05); flap.rotation.x = -0.12;
    add(g, S.box(dW - 0.04, px(1.2), 0.02, basic(P.trim, 0.8), 0.004), 0, px(16.8), zF + 0.04);
    add(g, S.box(0.2, px(1.6), 0.02, MT.cap, 0.005), 0, px(14.5), zF + 0.063);                                                           // PUSH
    // the +x face: a lit side panel and vents (the unit may stand against a west wall, so this face is its front too)
    const xF = W / 2;
    const sp = add(g, decal(D - 0.16, px(54), sideLogo(P)), xF + 0.008, px(38), 0); sp.rotation.y = PI / 2;
    const sf = add(g, S.box(0.02, px(56), D - 0.12, MT.graphite, 0.004), xF + 0.002, px(38), 0);
    for (let i = 0; i < 5; i++) add(g, S.box(0.02, px(0.9), D - 0.3, MT.steelDk, 0.003), xF + 0.012, px(7 + i * 2.2), 0);
    return { g };
  }

  // ═══════════════ the water cooler ═══════════════
  function cooler() {
    const g = G();
    add(g, S.box(0.5, px(36), 0.5, MT.laminate, 0.04), 0, px(19), 0);                                                          // the cabinet
    add(g, S.box(0.52, px(2), 0.52, MT.graphite, 0.015), 0, px(1.6), 0); add(g, S.box(0.52, px(2.2), 0.52, MT.graphiteDk || MT.graphite, 0.015), 0, px(37.4), 0);
    add(g, S.box(0.36, px(14), 0.02, MT.tealDk, 0.01), 0, px(24), 0.255);                                                       // the recessed front panel
    add(g, S.box(0.3, px(0.8), 0.015, basic('#31e8ff', 0.8), 0.003), 0, px(30.4), 0.268);
    for (const [x, c] of [[-0.08, '#3a7bff'], [0.08, '#e24a3a']]) {                                                             // two taps
      add(g, cyl(0.032, 0.032, 0.09, MT.steel, 12), x, px(24.5), 0.31).rotation.x = PI / 2;
      add(g, cyl(0.038, 0.038, px(1.2), S.std(c, 0.2, 0.4), 12), x, px(27), 0.285);
      add(g, S.box(0.05, px(0.7), 0.05, S.std(c, 0.2, 0.4), 0.008), x, px(28), 0.3);
    }
    add(g, S.box(0.34, px(1.4), 0.2, MT.steelDk, 0.01), 0, px(18.5), 0.33);                                                    // the drip tray with a grille
    for (let i = 0; i < 6; i++) add(g, S.box(0.3, px(0.3), 0.012, MT.graphite, 0.002), 0, px(19.3), 0.255 + 0.04 + i * 0.03);
    add(g, cyl(0.19, 0.21, px(2.4), MT.steel, 24), 0, px(40), 0);                                                              // the collar
    // an upturned glass bottle: the neck in the collar, the belly up
    const prof = [[0.05, 0], [0.06, 0.02], [0.09, 0.07], [0.15, 0.13], [0.185, 0.2], [0.19, px(18)], [0.185, px(24)], [0.16, px(26.6)], [0.0, px(27.2)]].map(p => new T.Vector2(p[0], p[1]));
    const bottle = new T.Mesh(new T.LatheGeometry(prof, 28), MT.glassTint.clone()); bottle.material.opacity = 0.3; bottle.material.side = T.DoubleSide; add(g, bottle, 0, px(41.4), 0);
    const wp = [[0.045, 0.01], [0.055, 0.025], [0.085, 0.07], [0.145, 0.13], [0.178, 0.2], [0.182, px(18)], [0.178, px(21.5)], [0.0, px(21.5)]].map(p => new T.Vector2(p[0], p[1]));
    const water = new T.Mesh(new T.LatheGeometry(wp, 28), new T.MeshStandardMaterial({ color: STY.col('#3aa8e8'), transparent: true, opacity: 0.72, roughness: 0.15, metalness: 0, emissive: STY.col('#1a6ab8'), emissiveIntensity: 0.5 })); add(g, water, 0, px(41.4), 0);
    add(g, S.box(0.1, px(1), 0.1, basic('#cdf4ff', 0.6), 0.01), 0.05, px(41.4) + px(24.5), 0.06).scale.set(1, 0.3, 1);          // a bubble highlight (a pale sliver)
    add(g, cyl(0.075, 0.075, px(1.4), MT.cap, 14), 0, px(41.4) + px(27.7), 0);                                                   // the cap
    // the cup dispenser on the +x side
    add(g, cyl(0.085, 0.085, px(14), MT.glassTint, 16), 0.34, px(26), 0.04);
    for (let i = 0; i < 5; i++) { const c = add(g, new T.Mesh(new T.CylinderGeometry(0.07, 0.05, px(2.6), 14), S.std('#f1f8fa', 0, 0.5)), 0.34, px(21 + i * 2.6), 0.04); }
    add(g, S.box(0.07, px(18), 0.12, MT.steelDk, 0.01), 0.26, px(26), 0.04);
    add(g, S.box(0.02, px(26), 0.3, MT.tealDk, 0.005), 0.255, px(22), -0.02);                                                    // a side panel
    return { g };
  }

  // ═══════════════ the bin ═══════════════
  function bin(style) {
    const g = G(), P = style === 0 ? { body: '#8a929e', band: '#31c8e0', lid: '#2a3038' } : { body: '#6a3fc4', band: '#cdb8ff', lid: '#2a1a50' };
    const bodyM = S.std(P.body, 0.5, 0.45);
    add(g, S.box(0.52, px(30), 0.46, bodyM, 0.05), 0, px(16), 0);
    add(g, S.box(0.54, px(1.8), 0.48, MT.graphite, 0.015), 0, px(1.3), 0);
    const bandTex = tex(256, 64, (c, w, h) => { c.fillStyle = style === 0 ? '#0e3a42' : '#2b1760'; c.fillRect(0, 0, w, h); c.strokeStyle = P.band; c.lineWidth = 6; if (style === 1) { for (let i = 0; i < 3; i++) { const a = i * 2.0944 - 1.57, cx = 128 + Math.cos(a) * 18, cy = 32 + Math.sin(a) * 18; c.beginPath(); c.arc(128, 32, 20, a, a + 1.6); c.stroke(); c.beginPath(); c.moveTo(128 + Math.cos(a + 1.6) * 20, 32 + Math.sin(a + 1.6) * 20); c.lineTo(128 + Math.cos(a + 1.9) * 26, 32 + Math.sin(a + 1.9) * 26); c.lineTo(128 + Math.cos(a + 1.3) * 28, 32 + Math.sin(a + 1.3) * 28); c.stroke(); } } else { c.strokeRect(100, 14, 56, 40); c.beginPath(); c.moveTo(94, 14); c.lineTo(162, 14); c.stroke(); c.beginPath(); c.moveTo(118, 14); c.lineTo(118, 8); c.lineTo(138, 8); c.lineTo(138, 14); c.stroke(); for (const x of [114, 128, 142]) { c.beginPath(); c.moveTo(x, 22); c.lineTo(x, 46); c.stroke(); } } });
    add(g, decal(0.42, px(8), lit(bandTex, 0.75)), 0, px(20), 0.234); const bx = add(g, decal(0.36, px(8), lit(bandTex, 0.75)), 0.264, px(20), 0); bx.rotation.y = PI / 2;
    add(g, S.box(0.56, px(3.2), 0.5, S.std(P.lid, 0.3, 0.5), 0.03), 0, px(32.2), 0);                                                // the lid
    add(g, S.box(0.36, px(1.6), 0.03, MT.rubber, 0.006), 0, px(32.6), 0.255);                                                       // the slot
    const fl = add(g, S.box(0.4, px(2.2), 0.012, MT.steelDk, 0.003), 0, px(31.2), 0.248); fl.rotation.x = 0.22;                       // the swing flap
    add(g, S.box(0.14, px(0.8), 0.02, basic(P.band, 0.85), 0.004), 0, px(34), 0.2);                                                // a lit tip on the lid
    add(g, S.box(0.1, px(2), 0.04, MT.steelDk, 0.006), -0.18, px(2.4), 0.25); add(g, S.box(0.12, px(1), 0.1, MT.graphite, 0.006), -0.18, px(1.0), 0.28);   // a foot pedal
    return { g };
  }

  // ═══════════════ the office chair (faces -z) ═══════════════
  function chair() {
    const g = G(), cloth = fab('#2a6a72', 0.9), clothDk = fab('#1d2a30', 0.9);
    for (let i = 0; i < 5; i++) {                                                                                                  // the five-star base and its castors
      const a = i * PI * 2 / 5 + 0.3, ex = Math.cos(a) * 0.27, ez = Math.sin(a) * 0.27, sp = G(); sp.position.set(0, px(7.2), 0); sp.rotation.y = -a;
      sp.add(at(S.box(0.29, px(1.5), 0.045, MT.graphite, 0.008), 0.14, px(-1.2), 0)); g.add(sp);
      const w = G(); w.position.set(ex, px(2.2), ez); w.add(at(cyl(0.028, 0.028, px(3.2), MT.rubber, 10), 0, 0, 0).rotateX(PI / 2));
      w.children[0].rotation.set(0, 0, 0); const wheel = cyl(0.028, 0.028, 0.03, MT.rubber, 10); wheel.rotation.z = PI / 2; wheel.rotation.y = -a; w.children.length = 0; w.add(wheel); w.add(at(S.box(0.02, px(2), 0.02, MT.steel, 0.003), 0, px(1.6), 0)); g.add(w);
    }
    add(g, cyl(0.06, 0.07, px(5), MT.graphite, 14), 0, px(8.4), 0);                                                                // the hub
    add(g, cyl(0.032, 0.032, px(9), MT.steel, 12), 0, px(14.5), 0); add(g, cyl(0.048, 0.048, px(5), MT.graphite, 12), 0, px(11), 0);   // the gas strut
    add(g, S.box(0.34, px(1.6), 0.32, MT.graphite, 0.02), 0, px(19), 0);                                                           // the seat plate and its mechanism
    add(g, S.box(0.2, px(2.2), 0.1, MT.steelDk, 0.01), 0, px(17.5), 0.0);
    add(g, S.box(0.46, px(4.6), 0.44, cloth, 0.07), 0, px(22), -0.01);                                                             // the seat
    add(g, S.box(0.44, px(0.6), 0.02, MT.cyan, 0.003), 0, px(23.5), -0.225);                                                       // a lit piping on the front edge (-z)
    const bk = add(g, S.box(0.44, px(24), 0.07, cloth, 0.03), 0, px(37), 0.22); bk.rotation.x = 0.1;                                // the back: a shell and a cloth face
    add(g, S.box(0.4, px(21), 0.02, clothDk, 0.01), 0, px(37), 0.18).rotation.x = 0.1;
    add(g, S.box(0.07, px(8), 0.05, MT.graphite, 0.008), 0, px(27.5), 0.2).rotation.x = 0.1;                                     // the back's stem
    for (const sx of [-1, 1]) {                                                                                                    // armrests: post, pad
      add(g, S.box(0.03, px(8), 0.03, MT.steelDk, 0.005), sx * 0.26, px(27), 0.06);
      add(g, S.box(0.06, px(1.4), 0.24, MT.graphite, 0.012), sx * 0.26, px(31.4), -0.04);
      add(g, S.box(0.04, px(1.4), 0.04, MT.steelDk, 0.005), sx * 0.24, px(22.8), 0.06);
    }
    add(g, cyl(0.026, 0.026, 0.07, MT.steel, 8), 0.23, px(19.4), 0.0).rotation.z = PI / 2;                                         // a height lever
    return { g };
  }

  const VARIANTS = ['couch.3x1.s0', 'couch.3x1.s1', 'table', 'beanbag.s0', 'beanbag.s1', 'beanbag.s2', 'beanbag.s3', 'pingpong', 'vending.1x1.s0', 'vending.1x1.s1', 'vending.1x1.s2', 'vending.2x1', 'cooler', 'bin.s0', 'bin.s1', 'chair'];
  PROPS.lounge = { variants: VARIANTS, canvas: [900, 600], exposure: 0.95, build(name) {
    const s = name.match(/\.s(\d)$/); const si = s ? +s[1] : 0;
    if (name.startsWith('couch')) return couch(si);
    if (name === 'table') return table();
    if (name.startsWith('beanbag')) return beanbag(si);
    if (name === 'pingpong') return pingpong();
    if (name === 'vending.2x1') return vending(0, true);
    if (name.startsWith('vending')) return vending(si, false);
    if (name === 'cooler') return cooler();
    if (name.startsWith('bin')) return bin(si);
    if (name === 'chair') return chair();
    throw new Error('unknown variant ' + name);
  } };
})();
