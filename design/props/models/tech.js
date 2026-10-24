// THE TECH PROPS (family 'tech'): the things that do something. Variants:
//   teleporter.s0 / .s1   1x1  a teleport pad: a low dais with a hazard rim, an inlaid glowing ring and core, three emitter pylons and a floating ring (s0 cyan, s1 violet)       [8: teleport rooms 1 and 2]
//   charger.on / .off     1x1  the charging station: a cabinet with a bay and a bolt, lit mint green when fed, dark with a red standby lamp when not; the cable on a holster on the +x side
//   relay.on / .off       1x1  a heavy power relay cabinet: louvres, conduits, a breaker lever (down when broken, up when repaired), an indicator porthole (red/dead, green/lit) and lamp            [6]
//   mech_bay              2x2  the mech assembly bay: a raised hazard-edged pad, an overhead gantry with two robot arms, a control pylon, parts racks, floor clamps and work lights
//   locker.1x1.s0 / .s1   1x1  a tall louvred locker (s0 green-grey armoured weapon locker; s1 the gunmetal gun locker with a wheel lock, thick hinges and an amber lamp); locker.4x1  a bank of four, one ajar
//   cabinet.1x1           1x1  a filing cabinet with three drawers (the Security Room's, against the west wall: its front is on the +x face);  cabinet.1x2  the lab's tall glass-fronted storage cabinet (front on +x)
//   display_case.s0..s2   1x1  a showcase on a pedestal lit from within: s0 a floating crystal, s1 a small drone, s2 a headset
//   telescope             1x1  a brass-and-steel observation telescope on a tripod, pointing out (+x) and up
// The front of a 1x1 is on its +z face except where said (the lockers and cabinets stand against a wall and the cabinets face +x). Detail on BOTH visible faces (+x and +z), nothing on the hidden ones.
(function () {
  const S = STY.mat, std = STY.std, glow = STY.glow, col = STY.col;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const flat = m => { m.rotation.x = PI / 2; return m; };
  // a bevelled box of height h game-px whose bottom is at y0 game-px, centred at (x, z)
  const slab = (par, w, h, d, mat, x, y0, z, b) => { const m = cbox(w, px(h), d, b == null ? 0.02 : b, mat); par.add(at(m, x, px(y0 + h / 2), z)); return m; };
  const cylY = (par, r0, r1, h, mat, x, y0, z, seg) => { const m = cyl(r0, r1, px(h), mat, seg || 16); par.add(at(m, x, px(y0 + h / 2), z)); return m; };
  const rubber = std('#0c0e12', 0.1, 0.85), graphite = std('#252b34', 0.75, 0.45), graphiteLt = std('#39424e', 0.7, 0.45), steelDk = std('#4a525e', 0.85, 0.4), steel = std('#9aa3af', 0.9, 0.32), steelLt = std('#c4ccd4', 0.9, 0.3);
  const black = std('#06080b', 0.6, 0.35), glassDk = std('#04090d', 0.9, 0.08);
  const hzY = std('#e0a526', 0.2, 0.6), hzK = std('#14181d', 0.2, 0.7);
  const cyan = glow('#31e8ff'), cyanDim = glow('#31e8ff', 0.5), amber = glow('#f2b13a'), amberDim = glow('#f2b13a', 0.45), red = glow('#ff4a3a'), redDim = glow('#ff4a3a', 0.4), mint = glow('#43e0a8'), mintHi = glow('#b8ffe4'), violet = glow('#b57bff'), white = glow('#eaffff'), blue = glow('#4a8bff');
  const trans = (hex, op, glowK) => { const m = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: op, toneMapped: false, depthWrite: false }); m.color = col(hex); if (glowK) m.color.multiplyScalar(glowK); return m; };
  const glassMat = new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, metalness: 0, roughness: 0.04, depthWrite: false, envMapIntensity: 1.3 }); glassMat.color = col('#cfe6ff');
  // a label plate: a small flat plane with canvas text
  const plateTex = (text, bg, fg, w, h, font) => {
    const c = document.createElement('canvas'); c.width = w || 128; c.height = h || 48; const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = fg; g.lineWidth = 2; g.strokeRect(2, 2, c.width - 4, c.height - 4); g.fillStyle = fg; g.font = (font || 'bold 26px sans-serif'); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, c.width / 2, c.height / 2 + 1);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
  };
  const plate = (w, h, text, bg, fg, font) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: plateTex(text, bg, fg, 128, Math.max(24, Math.round(128 * h / w)), font), metalness: 0.1, roughness: 0.6, envMapIntensity: 0.3 })); return m; };
  // a plate on the +z face (default) or the +x face (face = 'x') at position (x, y, z), `off` standing off the surface
  const onZ = (par, m, x, y, z) => { m.position.set(x, y, z); par.add(m); return m; };
  const onX = (par, m, x, y, z) => { m.rotation.y = PI / 2; m.position.set(x, y, z); par.add(m); return m; };
  const hazardZ = (par, x0, x1, y0, hpx, z, n) => { const w = (x1 - x0) / n; for (let i = 0; i < n; i++) par.add(at(cbox(w, px(hpx), 0.018, 0.003, i % 2 ? hzK : hzY), x0 + w * (i + 0.5), px(y0 + hpx / 2), z)); };
  const hazardX = (par, z0, z1, y0, hpx, x, n) => { const w = (z1 - z0) / n; for (let i = 0; i < n; i++) par.add(at(cbox(0.018, px(hpx), w, 0.003, i % 2 ? hzK : hzY), x, px(y0 + hpx / 2), z0 + w * (i + 0.5))); };
  const bolt = (par, x, y, z, ax) => { const b = cyl(0.014, 0.014, 0.012, steelLt, 6); if (ax === 'z') b.rotation.x = PI / 2; else if (ax === 'x') b.rotation.z = PI / 2; par.add(at(b, x, y, z)); };
  const louvres = (par, n, x0, x1, y0, y1, z, mat) => { for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * (i + 0.5) / n; const s = cbox(x1 - x0, px(1.1), 0.03, 0.004, mat || black); s.rotation.x = -0.35; par.add(at(s, (x0 + x1) / 2, px(y), z)); } };
  const louvresX = (par, n, z0, z1, y0, y1, x, mat) => { for (let i = 0; i < n; i++) { const y = y0 + (y1 - y0) * (i + 0.5) / n; const s = cbox(0.03, px(1.1), z1 - z0, 0.004, mat || black); s.rotation.z = 0.35; par.add(at(s, x, px(y), (z0 + z1) / 2)); } };
  // a bolt-shaped emissive icon (an extruded polygon) facing +z
  const boltIcon = (hpx, mat) => { const s = new T.Shape(); const k = px(hpx); [[0.3, 1], [-0.45, 0.05], [-0.05, 0.05], [-0.3, -1], [0.45, -0.1], [0.05, -0.1]].forEach(([x, y], i) => i ? s.lineTo(x * k * 0.5, y * k * 0.5) : s.moveTo(x * k * 0.5, y * k * 0.5)); s.closePath(); const g = new T.ExtrudeGeometry(s, { depth: 0.01, bevelEnabled: false }); return new T.Mesh(g, mat); };

  // ───────────────────────── TELEPORTER ─────────────────────────
  function teleporter(style) {
    const g = G(), hue = style === 0 ? '#31e8ff' : '#b57bff', hueDim = style === 0 ? '#1d8fa3' : '#7a4cc4', E = glow(hue), Ed = glow(hueDim), Et = trans(hue, 0.22, 1.0), Etm = trans(hue, 0.5, 1.0);
    cylY(g, 0.47, 0.5, 5, graphite, 0, 0, 0, 40);                                  // the footing
    cylY(g, 0.45, 0.47, 6, steelDk, 0, 5, 0, 40);                                  // the dais, bevelled in
    for (let i = 0; i < 36; i++) { const a = i * TAU / 36, m = cbox(0.07, px(5.2), 0.026, 0.004, i % 2 ? hzK : hzY); m.position.set(Math.cos(a) * 0.472, px(2.6), Math.sin(a) * 0.472); m.rotation.y = -a + PI / 2; g.add(m); }   // the hazard rim
    cylY(g, 0.4, 0.42, 1.6, graphiteLt, 0, 11, 0, 40);                             // the plate
    cylY(g, 0.35, 0.35, 0.5, std('#10151b', 0.8, 0.3), 0, 12.6, 0, 40);            // a dark inlay
    g.add(at(flat(torus(0.3, 0.018, E, 48)), 0, px(13.4), 0));                       // the glowing ring
    g.add(at(flat(torus(0.2, 0.01, Ed, 40)), 0, px(13.4), 0));
    for (let i = 0; i < 8; i++) { const a = i * PI / 4 + PI / 8, m = cbox(0.05, px(0.6), 0.1, 0.004, E); m.position.set(Math.cos(a) * 0.36, px(13.1), Math.sin(a) * 0.36); m.rotation.y = -a; g.add(m); }   // tick marks
    g.add(at(cyl(0.14, 0.14, px(0.7), E, 28), 0, px(13.2), 0));                       // the bright core disc
    g.add(at(cyl(0.085, 0.085, px(0.9), white, 24), 0, px(13.5), 0));
    // three emitter pylons (at the back and sides, so the pad stays open to the camera)
    for (const ang of [200, 270, 340]) {
      const a = ang * PI / 180, x = Math.cos(a) * 0.37, z = Math.sin(a) * 0.37, p = G(); p.position.set(x, 0, z); p.rotation.y = -a; g.add(p);
      slab(p, 0.1, 6, 0.14, graphite, 0, 11, 0, 0.015);                                   // the foot block
      slab(p, 0.06, 56, 0.06, steelDk, 0, 17, 0, 0.012);                                  // the post
      slab(p, 0.045, 50, 0.012, E, -0.0, 20, 0.036, 0.002);                                // a lit seam up its face (towards the centre)
      slab(p, 0.1, 5, 0.12, graphiteLt, 0, 73, 0, 0.012);                                 // the head
      const tip = new T.Mesh(new T.OctahedronGeometry(0.045), E); tip.scale.y = 1.5; p.add(at(tip, 0, px(81), 0));            // an emitter crystal
      p.add(at(cbox(0.05, px(2), 0.05, 0.005, ang === 270 ? amber : cyanDim), 0.0, px(70.5), 0.0));
    }
    // the floating ring above the pad, tied to the pylons by thin energy lines, and a faint column of light
    const ring = flat(torus(0.27, 0.014, E, 48)); g.add(at(ring, 0, px(58), 0)); g.add(at(flat(torus(0.27, 0.05, Et, 48)), 0, px(58), 0));
    g.add(at(flat(torus(0.17, 0.008, Ed, 36)), 0, px(46), 0));
    for (const ang of [200, 270, 340]) { const a = ang * PI / 180, l = tube([[Math.cos(a) * 0.37, px(78), Math.sin(a) * 0.37], [Math.cos(a) * 0.3, px(66), Math.sin(a) * 0.3], [Math.cos(a) * 0.27, px(58), Math.sin(a) * 0.27]], 0.008, E); g.add(l); }
    const beam = cyl(0.26, 0.3, px(46), Et, 32); beam.material = Et; g.add(at(beam, 0, px(36), 0));
    const beam2 = cyl(0.13, 0.17, px(46), Etm, 24); g.add(at(beam2, 0, px(36), 0));
    return { g };
  }

  // ───────────────────────── CHARGER ─────────────────────────
  function charger(on) {
    const g = G(), body = S.laminate;
    slab(g, 0.8, 4, 0.64, graphite, 0, 0, 0, 0.015);                                 // the plinth
    slab(g, 0.76, 62, 0.58, body, 0, 4, 0, 0.035);                                   // the cabinet
    slab(g, 0.8, 4, 0.62, steelDk, 0, 66, 0, 0.02);                                  // the top cap
    for (let i = 0; i < 5; i++) g.add(at(cbox(0.4, px(0.8), 0.012, 0.002, black), -0.0, px(68.4 - i * 0.0), 0.31 - 0.0));
    louvres(g, 5, -0.28, 0.28, 54, 62, 0.296, black);                                // vents at the top of the front
    // the bay (front +z): a deep dark recess with a bright inner panel
    slab(g, 0.56, 34, 0.04, graphite, 0, 16, 0.3, 0.01); slab(g, 0.5, 29, 0.05, black, 0, 18.5, 0.3, 0.008);
    const bay = new T.Mesh(new T.PlaneGeometry(0.46, px(26)), on ? glow('#43e0a8', 0.85) : std('#0a1013', 0.8, 0.2)); g.add(at(bay, 0, px(32), 0.331));
    const ic = boltIcon(18, on ? mintHi : std('#2b3a40', 0.6, 0.5)); g.add(at(ic, 0, px(32), 0.332));
    if (on) { for (const dx of [-0.19, 0.19]) g.add(at(cbox(0.02, px(26), 0.012, 0.003, mint), dx, px(32), 0.335)); }
    for (const dx of [-0.31, 0.31]) for (const dy of [18, 46]) bolt(g, dx, px(dy), 0.325, 'z');
    // a status lamp and a small display above the bay, and a hazard band under it
    g.add(at(cyl(0.035, 0.04, px(3), steelDk, 12), 0.24, px(55), 0.3));
    const lamp = new T.Mesh(new T.SphereGeometry(0.034, 12, 8), on ? mint : redDim); g.add(at(lamp, 0.24, px(57.4), 0.3));
    slab(g, 0.26, 7, 0.02, black, -0.16, 49, 0.299, 0.005); g.add(at(new T.Mesh(new T.PlaneGeometry(0.22, px(4.4)), on ? glow('#43e0a8', 0.9) : amberDim), -0.16, px(52.5), 0.31));
    hazardZ(g, -0.38, 0.38, 4.2, 3.4, 0.296, 14);
    onZ(g, at(plate(0.22, 0.07, 'CHARGE', '#14181d', '#b8ffe4', 'bold 28px sans-serif'), 0, 0, 0), 0, px(12), 0.302);
    // the +x side: a holster with the charging plug and its coiled cable, a panel with a switch
    slab(g, 0.04, 30, 0.34, steelDk, 0.39, 18, -0.02, 0.01); slab(g, 0.075, 15, 0.2, graphiteLt, 0.43, 25, -0.02, 0.012);
    const plug = cyl(0.045, 0.05, px(15), black, 12); g.add(at(plug, 0.43, px(34), -0.02)); g.add(at(cyl(0.032, 0.032, px(4), on ? mint : steelLt, 10), 0.43, px(42.5), -0.02));
    g.add(tube([[0.43, px(26), -0.02], [0.52, px(18), 0.04], [0.5, px(10), 0.18], [0.4, px(6), 0.26], [0.34, px(4), 0.14]], 0.02, rubber));
    louvresX(g, 6, -0.25, 0.22, 44, 62, 0.381, black);
    slab(g, 0.04, 6, 0.1, black, 0.395, 8, -0.2, 0.006); g.add(at(cbox(0.03, px(2), 0.03, 0.004, on ? mint : redDim), 0.42, px(10), -0.2));
    for (const dy of [10, 58]) bolt(g, 0.388, px(dy), 0.2, 'x');
    return { g };
  }

  // ───────────────────────── RELAY ─────────────────────────
  function relay(on) {
    const g = G(), shell = std('#59636f', 0.8, 0.4), shellDk = std('#3d4651', 0.8, 0.42);
    slab(g, 0.84, 3, 0.52, graphite, 0, 0, 0, 0.012);
    slab(g, 0.8, 60, 0.5, shell, 0, 3, 0, 0.03);                                      // the cabinet
    slab(g, 0.84, 3.5, 0.55, shellDk, 0, 63, 0, 0.015);                              // the roof lip
    // thick conduits: out of the top and into the floor, with elbows
    for (const dx of [-0.22, 0.22]) { cylY(g, 0.05, 0.05, 20, steelDk, dx, 66, -0.1, 12); cylY(g, 0.062, 0.062, 3, steelLt, dx, 68, -0.1, 12); g.add(at(sphere(0.052, steelDk, 12), dx, px(86.5), -0.1)); const el = cyl(0.05, 0.05, 0.3, steelDk, 12); el.rotation.x = PI / 2; g.add(at(el, dx, px(86.5), -0.25)); }
    cylY(g, 0.045, 0.045, 12, steelDk, -0.32, -0.0, 0.34, 10);
    // the front (+z): louvres at the top and bottom, the breaker slot and lever, the porthole, the label
    louvres(g, 4, -0.3, 0.3, 50, 58, 0.256, black); louvres(g, 3, -0.3, 0.3, 6, 12, 0.256, black);
    slab(g, 0.24, 25, 0.035, black, -0.16, 18, 0.255, 0.01);                          // the lever's slot
    const lever = G(); lever.position.set(-0.16, px(30.5), 0.285); g.add(lever);
    lever.add(at(cyl(0.05, 0.05, 0.03, steelLt, 14), 0, 0, 0)); lever.children[0].rotation.x = PI / 2;
    const arm = cbox(0.034, px(15), 0.03, 0.006, std('#d6422a', 0.3, 0.45)); lever.add(at(arm, 0, on ? px(7.5) : px(-7.5), 0.012));
    lever.add(at(sphere(0.045, std('#d6422a', 0.3, 0.45), 12), 0, on ? px(15.5) : px(-15.5), 0.012));
    // the porthole: a glass dome in a bolted ring
    const rim = torus(0.075, 0.017, steelLt, 24); g.add(at(rim, 0.17, px(42), 0.268)); g.add(at(cyl(0.065, 0.065, 0.014, on ? glow('#43e0a8', 0.9) : std('#150b08', 0.6, 0.3), 24), 0.17, px(42), 0.262)); g.children[g.children.length - 1].rotation.x = PI / 2;
    if (!on) g.add(at(cyl(0.028, 0.028, 0.016, redDim, 12), 0.17, px(42), 0.268)), g.children[g.children.length - 1].rotation.x = PI / 2;
    else g.add(at(trans('#43e0a8', 0.3, 1.0) && new T.Mesh(new T.SphereGeometry(0.075, 14, 8, 0, TAU, 0, PI / 2), trans('#43e0a8', 0.35, 1.0)), 0.17, px(42), 0.262)), g.children[g.children.length - 1].rotation.x = PI / 2;
    // the lamp on top and the status bar
    g.add(at(cyl(0.04, 0.045, px(3), steelDk, 12), 0.3, px(68), 0.18));
    g.add(at(new T.Mesh(new T.SphereGeometry(0.04, 12, 8), on ? mint : red), 0.3, px(70.6), 0.18));
    slab(g, 0.3, 4, 0.02, black, 0.17, 24, 0.256, 0.004); for (let i = 0; i < 6; i++) g.add(at(cbox(0.036, px(2), 0.016, 0.003, on ? mint : (i < 1 ? redDim : std('#2a1210', 0.5, 0.5))), 0.04 + i * 0.044, px(25), 0.262));
    hazardZ(g, -0.4, 0.4, 3.4, 3.2, 0.252, 16);
    onZ(g, plate(0.3, 0.11, 'POWER RELAY', '#e0a526', '#14181d', 'bold 19px sans-serif'), 0.17, px(14.5), 0.257);
    onZ(g, plate(0.1, 0.08, 'DANGER', '#c9301f', '#ffffff', 'bold 17px sans-serif'), -0.33, px(55.5), 0.258);
    for (const [dx, dy] of [[-0.36, 58], [0.36, 58], [-0.36, 8], [0.36, 8]]) bolt(g, dx, px(dy), 0.255, 'z');
    // the +x side: a plate, cooling fins, a data port
    slab(g, 0.02, 40, 0.34, shellDk, 0.405, 12, 0.0, 0.006);
    for (let i = 0; i < 9; i++) g.add(at(cbox(0.03, px(36), 0.012, 0.002, graphiteLt), 0.425, px(32), -0.14 + i * 0.035));
    onX(g, plate(0.22, 0.08, on ? 'ONLINE' : 'OFFLINE', on ? '#14301f' : '#301410', on ? '#7dffbf' : '#ff8a70', 'bold 22px sans-serif'), 0.41, px(52), 0.0);
    if (!on) {
      // broken: scorch marks round the porthole and the top, a tag on the lever, a cut cable hanging out of the bottom
      for (const [x, y, w, h] of [[0.17, 46, 0.2, 14], [-0.28, 60, 0.15, 7]]) { const sc = new T.Mesh(new T.PlaneGeometry(w, px(h)), new T.MeshBasicMaterial({ color: 0x050608, transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false })); g.add(at(sc, x, px(y), 0.2575)); }
      onZ(g, plate(0.09, 0.07, 'DEAD', '#e8e3d2', '#b02515', 'bold 20px sans-serif'), -0.07, px(24), 0.29);
      g.add(tube([[-0.34, px(12), 0.26], [-0.4, px(7), 0.34], [-0.36, px(3), 0.44], [-0.28, px(1.2), 0.48]], 0.016, rubber));
      g.add(at(new T.Mesh(new T.SphereGeometry(0.02, 8, 6), amber), -0.28, px(1.6), 0.49));
    }
    return { g };
  }

  // ───────────────────────── MECH BAY (2 x 2) ─────────────────────────
  function mechBay() {
    const g = G();
    slab(g, 1.94, 4, 1.94, graphite, 0, 0, 0, 0.03);                                     // the footing
    slab(g, 1.86, 5, 1.86, steelDk, 0, 4, 0, 0.04);                                      // the raised pad
    hazardZ(g, -0.93, 0.93, 4, 4.6, 0.94, 22); hazardX(g, -0.93, 0.93, 4, 4.6, 0.94, 22);  // the hazard edge on the two faces the camera sees
    slab(g, 1.7, 1.2, 1.7, std('#171c23', 0.7, 0.35), 0, 9, 0, 0.02);                    // the dark plate
    // the amber outline and the central ring (where the mech stands)
    for (const [w, d, x, z] of [[1.6, 0.025, 0, 0.8], [1.6, 0.025, 0, -0.8], [0.025, 1.6, 0.8, 0], [0.025, 1.6, -0.8, 0]]) g.add(at(cbox(w, px(0.5), d, 0.003, amber), x, px(10.4), z));
    g.add(at(flat(torus(0.52, 0.02, cyan, 48)), 0, px(10.4), 0)); g.add(at(flat(torus(0.36, 0.01, cyanDim, 40)), 0, px(10.4), 0));
    for (let i = 0; i < 8; i++) { const a = i * PI / 4, m = cbox(0.12, px(0.5), 0.03, 0.003, cyanDim); m.position.set(Math.cos(a) * 0.62, px(10.4), Math.sin(a) * 0.62); m.rotation.y = -a; g.add(m); }
    // floor clamps at the corners of the ring: claws that hold the legs
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const x = sx * 0.55, z = sz * 0.55; slab(g, 0.14, 3, 0.14, graphiteLt, x, 10, z, 0.015); slab(g, 0.05, 7, 0.05, steelDk, x + sx * 0.06, 10, z, 0.008); slab(g, 0.12, 1.4, 0.05, amberDim === 0 ? hzY : hzY, x, 16, z + sz * 0.06, 0.004); }
    // the gantry: two uprights at the back corners and a crossbeam, a rail along it, a trolley with a hoist
    const gx = [-0.88, 0.88];
    for (const x of gx) { slab(g, 0.12, 120, 0.12, graphite, x, 9, -0.86, 0.02); slab(g, 0.2, 4, 0.2, steelDk, x, 9, -0.86, 0.02); slab(g, 0.045, 108, 0.014, hzY, x, 14, -0.795, 0.003); slab(g, 0.14, 8, 0.2, steelDk, x, 124, -0.86, 0.015); }
    slab(g, 1.96, 10, 0.2, graphiteLt, 0, 128, -0.86, 0.03); slab(g, 1.8, 2, 0.24, steelDk, 0, 138, -0.86, 0.01); for (let i = 0; i < 9; i++) slab(g, 0.04, 8, 0.205, graphite, -0.84 + i * 0.21, 128.5, -0.86, 0.004);
    slab(g, 0.34, 8, 0.3, std('#c28d1f', 0.4, 0.5), 0.1, 118, -0.86, 0.02); g.add(at(cyl(0.025, 0.025, px(18), steel, 8), 0.1, px(108), -0.86));   // the trolley and its hoist chain
    slab(g, 0.1, 6, 0.1, steelDk, 0.1, 100, -0.86, 0.01);
    // two robot arms hanging from the crossbeam: three segments, joints, a welding head with a hot tip
    const arm = (x, z, s) => {
      const a = G(); a.position.set(x, px(118), z); g.add(a);
      a.add(at(cyl(0.07, 0.07, px(6), steelDk, 16), 0, px(-3), 0));
      const seg = (len, r, y, zz, tilt, mat) => { const c = cyl(r, r * 0.9, px(len), mat || graphiteLt, 12); c.position.set(0, px(y), zz); c.rotation.x = tilt; a.add(c); return c; };
      a.add(at(sphere(0.07, steelDk, 14), 0, px(-8), 0));
      seg(26, 0.045, -22, 0.02 * s, 0.0);
      a.add(at(sphere(0.055, steelDk, 12), 0, px(-36), 0.03 * s));
      seg(24, 0.038, -47, 0.12 * s, -0.55 * s);
      a.add(at(sphere(0.046, steelDk, 12), 0, px(-58), 0.2 * s));
      const head = G(); head.position.set(0, px(-58), 0.2 * s); a.add(head);
      head.add(at(cyl(0.032, 0.032, px(14), graphite, 10), 0, px(-8), 0.05 * s)); head.add(at(cyl(0.012, 0.022, px(8), steelLt, 8), 0, px(-19), 0.05 * s));
      head.add(at(new T.Mesh(new T.SphereGeometry(0.02, 8, 6), s > 0 ? amber : cyan), 0, px(-23.5), 0.05 * s));
      head.add(at(cbox(0.05, px(6), 0.06, 0.005, std('#c28d1f', 0.4, 0.5)), 0, px(-2), 0.0));
      return a;
    };
    arm(-0.55, -0.55, 1); arm(0.6, -0.5, -1);
    // the control pylon (front right): a sloped screen and a keyboard shelf; cables to the pad
    const py = G(); py.position.set(0.8, 0, 0.62); g.add(py);
    slab(py, 0.22, 4, 0.3, graphite, 0, 9, 0, 0.015); slab(py, 0.16, 42, 0.18, graphiteLt, 0, 13, -0.02, 0.025);
    const scr = G(); scr.position.set(0, px(60), 0.04); scr.rotation.x = -0.45; py.add(scr); slab(scr, 0.34, 20, 0.05, black, 0, -10, 0, 0.012);
    scr.add(at(new T.Mesh(new T.PlaneGeometry(0.3, px(16.5)), glow('#4a8bff', 0.9)), 0, px(0), 0.027));
    for (let i = 0; i < 4; i++) scr.add(at(cbox(0.2 - i * 0.03, px(1.2), 0.004, 0.001, white), -0.04 + (i * 0.015), px(4 - i * 3.4), 0.03));
    slab(py, 0.34, 3, 0.16, steelDk, 0, 44, 0.12, 0.01); for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) py.add(at(cbox(0.05, px(1), 0.04, 0.003, i % 2 ? cyanDim : amberDim), -0.12 + i * 0.08, px(47.8), 0.08 + j * 0.06));
    g.add(tube([[0.72, px(11), 0.5], [0.5, px(7), 0.45], [0.3, px(6), 0.2], [0.18, px(8), 0.1]], 0.026, rubber));
    // the parts racks (front left): a shelf unit holding spare legs and a core shell
    const rk = G(); rk.position.set(-0.78, 0, 0.55); g.add(rk);
    for (const dx of [-0.17, 0.17]) for (const dz of [-0.17, 0.17]) slab(rk, 0.035, 54, 0.035, steelDk, dx, 9, dz, 0.005);
    for (const y of [9, 31, 53]) slab(rk, 0.4, 2, 0.4, graphiteLt, 0, y, 0, 0.01);
    for (const [i, dz] of [[0, -0.1], [1, 0.1]]) { const leg = tube([[-0.14, px(34), dz], [0.0, px(46), dz], [0.14, px(36), dz]], 0.028, i ? steelLt : std('#7a8591', 0.9, 0.35)); rk.add(leg); rk.add(at(sphere(0.04, steelDk, 10), 0.0, px(46), dz)); }
    const shell = cyl(0.12, 0.12, px(14), std('#3a4350', 0.8, 0.35), 6); rk.add(at(shell, 0.0, px(41), 0.0)); rk.add(at(cyl(0.12, 0.12, px(1.5), cyan, 6), 0.0, px(49.5), 0.0)); shell.visible = false;
    rk.add(at(cyl(0.11, 0.11, px(12), std('#3a4350', 0.8, 0.35), 6), 0.04, px(15), 0.0)); rk.add(at(cyl(0.085, 0.085, px(1.2), cyan, 6), 0.04, px(21.4), 0.0));
    slab(rk, 0.16, 8, 0.12, std('#c28d1f', 0.4, 0.5), -0.1, 11, 0.12, 0.01);                      // a tool box on the bottom shelf
    // two work lights on poles at the far corners
    for (const [x, z] of [[0.86, -0.1], [-0.86, -0.0]]) { cylY(g, 0.025, 0.03, 70, steelDk, x, 9, z, 8); slab(g, 0.14, 9, 0.14, graphite, x, 79, z, 0.015); g.add(at(new T.Mesh(new T.PlaneGeometry(0.11, px(7)), white), x * 0.995, px(83.5), z + 0.073)); }
    slab(g, 0.04, 8, 0.4, std('#c28d1f', 0.4, 0.5), -0.93, 9, 0.28, 0.01);
    onZ(g, plate(0.5, 0.1, 'MECH BAY 01', '#14181d', '#f2b13a', 'bold 22px sans-serif'), 0.0, px(6.6), 0.945);
    return { g };
  }

  // ───────────────────────── LOCKERS ─────────────────────────
  // one tall locker door unit centred on x, front on +z at z = zf: louvres, a handle, a number plate
  function lockerUnit(par, w, x, zf, mat, matDk, num, opts) {
    opts = opts || {};
    slab(par, w - 0.02, 72, 0.5, mat, x, 3, 0, 0.025);                                     // the body
    slab(par, w - 0.06, 66, 0.02, matDk, x, 5.5, zf, 0.008);                                // the door panel (a shade darker, inset)
    louvres(par, 5, x - w / 2 + 0.1, x + w / 2 - 0.1, 60, 70, zf + 0.012, black);
    louvres(par, 3, x - w / 2 + 0.1, x + w / 2 - 0.1, 8, 14, zf + 0.012, black);
    slab(par, 0.02, 14, 0.03, steelLt, x + w / 2 - 0.12, 36, zf + 0.018, 0.005);          // the handle
    par.add(at(cyl(0.012, 0.012, 0.03, black, 8), x + w / 2 - 0.12, px(31), zf + 0.02)); par.children[par.children.length - 1].rotation.x = PI / 2;
    onZ(par, plate(0.1, 0.05, num, '#e8ecef', '#1b2430', 'bold 26px sans-serif'), x, px(53), zf + 0.013);
    bolt(par, x - w / 2 + 0.07, px(66), zf + 0.012, 'z'); bolt(par, x + w / 2 - 0.07, px(66), zf + 0.012, 'z'); bolt(par, x - w / 2 + 0.07, px(10), zf + 0.012, 'z'); bolt(par, x + w / 2 - 0.07, px(10), zf + 0.012, 'z');
  }
  function locker1x1(style) {
    const g = G();
    if (style === 0) {   // the green-grey armoured weapon locker
      const mat = std('#5c6f63', 0.55, 0.5), dk = std('#4a5a50', 0.55, 0.52);
      slab(g, 0.84, 3, 0.52, graphite, 0, 0, 0, 0.012); slab(g, 0.86, 3, 0.54, steelDk, 0, 75, 0, 0.015);
      lockerUnit(g, 0.86, 0, 0.255, mat, dk, '07');
      hazardZ(g, -0.38, 0.38, 3, 3, 0.263, 12);
      onZ(g, plate(0.2, 0.06, 'ARMS', '#e0a526', '#14181d', 'bold 24px sans-serif'), 0, px(44), 0.269);
      slab(g, 0.02, 60, 0.4, dk, 0.44, 8, 0, 0.006); louvresX(g, 5, -0.15, 0.15, 50, 66, 0.451, black);   // the +x side: a panel and a vent
      onX(g, plate(0.18, 0.06, 'ARMOURY', '#d9dee2', '#1b2430', 'bold 22px sans-serif'), 0.452, px(36), 0.0);
      g.add(at(cbox(0.02, px(2.5), 0.12, 0.004, hzY), 0.45, px(5), 0.14));
      // a dent and a scuff
      const dent = cbox(0.14, px(9), 0.01, 0.004, std('#3d4b42', 0.5, 0.6)); dent.rotation.z = 0.2; g.add(at(dent, -0.18, px(26), 0.263));
    } else {             // the gun locker: reinforced gunmetal door, a wheel lock, thick hinges, an amber lamp
      const mat = std('#2c333c', 0.8, 0.42), dk = std('#222830', 0.8, 0.45);
      slab(g, 0.86, 3, 0.54, graphite, 0, 0, 0, 0.012); slab(g, 0.88, 4, 0.56, steelDk, 0, 75, 0, 0.015);
      slab(g, 0.84, 72, 0.52, mat, 0, 3, 0, 0.03);
      slab(g, 0.78, 66, 0.045, dk, 0, 5.5, 0.272, 0.012);                                   // the thick door
      for (const y of [12, 36, 60]) { const h = cyl(0.03, 0.03, px(9), steelLt, 10); g.add(at(h, -0.37, px(y), 0.3)); slab(g, 0.08, 3, 0.05, steelDk, -0.34, y - 7, 0.29, 0.006); }   // hinges
      // the wheel lock
      const wl = G(); wl.position.set(0.14, px(36), 0.31); g.add(wl);
      wl.add(flat(torus(0.1, 0.014, steelLt, 24))); wl.add(at(cyl(0.03, 0.03, 0.04, steelDk, 12), 0, 0, 0.0)); wl.children[1].rotation.x = PI / 2;
      for (let i = 0; i < 4; i++) { const sp = cbox(0.014, 0.2, 0.014, 0.002, steelLt); sp.rotation.z = i * PI / 4; wl.add(sp); } wl.rotation.x = 0;
      for (const o of wl.children) { if (o.geometry && o.geometry.type === 'TorusGeometry') o.rotation.x = 0; }
      g.add(at(cbox(0.38, px(2.5), 0.03, 0.004, hzY), 0, px(10), 0.3)); g.add(at(cbox(0.38, px(2.5), 0.03, 0.004, hzY), 0, px(63), 0.3));
      onZ(g, plate(0.26, 0.08, 'FIREARMS', '#e0a526', '#14181d', 'bold 22px sans-serif'), 0, px(49), 0.298);
      // an amber lamp on top
      g.add(at(cyl(0.045, 0.05, px(3.5), steelDk, 12), 0.28, px(80.7), 0.0)); g.add(at(new T.Mesh(new T.SphereGeometry(0.043, 12, 8), amber), 0.28, px(83.6), 0.0));
      louvresX(g, 4, -0.15, 0.15, 52, 66, 0.451, black); slab(g, 0.02, 60, 0.4, dk, 0.442, 8, 0, 0.006);
      onX(g, plate(0.2, 0.06, 'RESTRICTED', '#14181d', '#ff8a70', 'bold 18px sans-serif'), 0.453, px(36), 0.0);
    }
    return { g };
  }
  function locker4x1() {
    const g = G(), mat = std('#5d7f89', 0.6, 0.45), dk = std('#4a6a74', 0.6, 0.48), W = 4, w = 0.95;
    slab(g, 3.96, 3, 0.52, graphite, 0, 0, 0, 0.012); slab(g, 3.96, 3, 0.54, steelDk, 0, 75, 0, 0.015);
    for (let i = 0; i < 4; i++) {
      const x = -1.5 + i;
      if (i === 2) {   // ajar: the door swung out a little, the inside dark with a shelf and a hanging jacket
        slab(g, w - 0.02, 72, 0.5, mat, x, 3, 0, 0.025); slab(g, w - 0.12, 66, 0.4, std('#0a0d11', 0.4, 0.8), x, 5.5, 0.07, 0.01); slab(g, w - 0.14, 1.6, 0.34, steelDk, x, 48, 0.06, 0.006);
        g.add(at(cbox(0.4, px(26), 0.09, 0.03, std('#2b3947', 0, 0.9)), x, px(22), 0.06));
        const door = G(); door.position.set(x - w / 2 + 0.03, 0, 0.255); door.rotation.y = 0.22; g.add(door);
        slab(door, w - 0.08, 66, 0.022, dk, (w - 0.08) / 2, 5.5, 0.011, 0.008); louvres(door, 5, 0.1, w - 0.18, 60, 70, 0.026, black); louvres(door, 3, 0.1, w - 0.18, 8, 14, 0.026, black);
        slab(door, 0.02, 14, 0.03, steelLt, w - 0.16, 36, 0.034, 0.005); onZ(door, plate(0.1, 0.05, '03', '#e8ecef', '#1b2430', 'bold 26px sans-serif'), (w - 0.08) / 2, px(53), 0.024);
      } else {
        lockerUnit(g, w, x, 0.255, mat, dk, '0' + (i + 1 + (i > 2 ? 0 : 0)));
        if (i === 1) { const dent = cbox(0.18, px(12), 0.012, 0.004, std('#3b5a63', 0.5, 0.6)); dent.rotation.z = -0.15; g.add(at(dent, x - 0.12, px(24), 0.262)); }
      }
    }
    hazardZ(g, -1.9, 1.9, 3, 3, 0.263, 40);
    // the +x end: a blank side panel and a sticker; a notice on the first door
    slab(g, 0.02, 66, 0.44, dk, 1.98, 5, 0.0, 0.006); onX(g, plate(0.3, 0.1, 'STAFF ONLY', '#d9dee2', '#1b2430', 'bold 22px sans-serif'), 1.99, px(52), 0.0);
    g.add(at(cbox(0.16, px(10), 0.01, 0.002, std('#e8e3d2', 0, 0.9)), -1.78, px(34), 0.265));
    return { g };
  }

  // ───────────────────────── CABINETS ─────────────────────────
  function cabinet1x1() {   // a filing cabinet: three drawers on the +x face (it stands against a west wall); the +z face is a side with a label
    const g = G(), body = std('#aebcc3', 0.5, 0.45), dk = std('#8fa3ac', 0.5, 0.5);
    slab(g, 0.7, 2.5, 0.8, graphite, 0, 0, 0, 0.012);
    slab(g, 0.68, 46, 0.8, body, 0, 2.5, 0, 0.025); slab(g, 0.72, 3, 0.84, steelLt, 0, 48.5, 0, 0.015);
    for (let i = 0; i < 3; i++) {
      const y = 5 + i * 14.4; slab(g, 0.02, 12.6, 0.7, dk, 0.345, y, 0, 0.008);
      slab(g, 0.03, 2.2, 0.26, steelDk, 0.36, y + 8.4, 0, 0.006); g.add(at(cbox(0.012, px(1.2), 0.22, 0.002, black), 0.373, px(y + 8.2), 0));            // the pull, recessed
      onX(g, plate(0.2, 0.05, ['A-H', 'I-P', 'Q-Z'][i], '#e8ecef', '#1b2430', 'bold 22px sans-serif'), 0.358, px(y + 4.2), 0.0);
    }
    g.add(at(cbox(0.012, px(2.6), 0.06, 0.002, hzY), 0.352, px(46.5), 0.3));
    onZ(g, plate(0.34, 0.12, 'ARCHIVE', '#e0e6e9', '#1b2430', 'bold 22px sans-serif'), 0, px(30), 0.405); louvres(g, 3, -0.2, 0.2, 8, 14, 0.402, black);
    bolt(g, -0.3, px(44), 0.402, 'z'); bolt(g, 0.3, px(44), 0.402, 'z');
    return { g };
  }
  function cabinet1x2() {   // the lab's tall storage cabinet: two glass doors on the +x face, shelves with bottles and boxes
    const g = G(), frame = std('#7e8e98', 0.7, 0.4), inside = std('#cfd9de', 0.3, 0.6), dkIn = std('#0b1013', 0.4, 0.7);
    slab(g, 0.88, 3, 1.9, graphite, 0, 0, 0, 0.015);
    // a hollow carcase open at the +x front: back, two ends, a floor and a roof, and a centre post
    slab(g, 0.05, 78, 1.86, frame, -0.395, 3, 0, 0.012); slab(g, 0.84, 78, 0.05, frame, 0, 3, 0.905, 0.012); slab(g, 0.84, 78, 0.05, frame, 0, 3, -0.905, 0.012);
    slab(g, 0.84, 3, 1.86, frame, 0, 3, 0, 0.012); slab(g, 0.88, 3, 1.9, steelLt, 0, 80.5, 0, 0.015); slab(g, 0.05, 74, 0.05, frame, 0.395, 5, 0, 0.008);
    slab(g, 0.02, 74, 1.78, dkIn, -0.36, 5, 0, 0.004);
    for (const y of [24, 44, 64]) slab(g, 0.76, 1.4, 1.78, inside, 0.0, y, 0, 0.006);
    const bottles = [['#43e0a8', 0.05, 11], ['#b57bff', 0.055, 9], ['#4a8bff', 0.045, 12], ['#f2b13a', 0.055, 8], ['#ff7a5a', 0.045, 10]];
    for (const [y0, zs] of [[25.4, [-0.74, -0.58, -0.4, -0.2, 0.0, 0.18, 0.4, 0.6, 0.76]], [45.4, [-0.7, -0.5, -0.32, -0.12, 0.1, 0.3, 0.5, 0.72]], [65.4, [-0.72, -0.5, -0.28, 0.0, 0.24, 0.5, 0.72]]]) {
      zs.forEach((z, i) => { if ((i + Math.round(y0)) % 3 === 0) { slab(g, 0.28, 7 + (i % 2) * 3, 0.15, std(['#d9cfae', '#bfc9ce', '#d9d3c4'][i % 3], 0, 0.8), 0.04, y0, z, 0.01); return; }
        const b = bottles[(i + Math.round(y0)) % bottles.length], h = b[2]; g.add(at(cyl(b[1], b[1], px(h), new T.MeshStandardMaterial({ color: col(b[0]), emissive: col(b[0]), emissiveIntensity: 0.45, transparent: true, opacity: 0.85, roughness: 0.2 }), 12), 0.04, px(y0 + h / 2), z)); g.add(at(cyl(b[1] * 0.45, b[1] * 0.45, px(2.5), black, 8), 0.04, px(y0 + h + 1.2), z)); });
    }
    // the two glass doors on +x: a steel frame round a pane, handles at the meeting edge
    for (const z0 of [-0.46, 0.46]) {
      const d = G(); d.position.set(0.43, 0, z0); g.add(d);
      for (const [y, h] of [[5, 3], [76, 3]]) slab(d, 0.03, h, 0.92, steelDk, 0, y, 0, 0.006);
      for (const dz of [-0.45, 0.45]) slab(d, 0.03, 74, 0.03, steelDk, 0, 5, dz, 0.006);
      d.add(at(cbox(0.012, px(70), 0.86, 0.004, glassMat), 0.004, px(42), 0));
      slab(d, 0.04, 14, 0.03, steelLt, 0.012, 34, z0 > 0 ? -0.4 : 0.4, 0.005);
    }
    slab(g, 0.03, 12, 0.12, std('#14181d', 0.4, 0.6), 0.45, 38, 0.0, 0.005); g.add(at(cbox(0.01, px(2), 0.05, 0.002, red), 0.468, px(42), 0));
    onX(g, plate(0.5, 0.09, 'REAGENTS', '#e0a526', '#14181d', 'bold 24px sans-serif'), 0.442, px(81.5), 0.0);
    // the +z end: a side panel with a vent and a hazard label
    louvres(g, 4, -0.3, 0.3, 54, 68, 0.935, black); onZ(g, plate(0.3, 0.12, 'CAUTION', '#e0a526', '#14181d', 'bold 22px sans-serif'), 0, px(30), 0.935);
    return { g };
  }

  // ───────────────────────── DISPLAY CASES ─────────────────────────
  function displayCase(style) {
    const g = G();
    slab(g, 0.78, 3, 0.78, graphite, 0, 0, 0, 0.015);
    slab(g, 0.72, 22, 0.72, S.laminate, 0, 3, 0, 0.03);                                      // the pedestal
    slab(g, 0.76, 2.5, 0.76, steelLt, 0, 25, 0, 0.012);                                      // the plinth top
        g.add(at(cbox(0.6, px(1.6), 0.012, 0.003, cyan), 0, px(8), 0.366)); g.add(at(cbox(0.012, px(1.6), 0.6, 0.003, cyan), 0.366, px(8), 0));   // a lit strip on both faces
    onZ(g, plate(0.34, 0.1, ['LUMEN-X', 'SKYEYE 2', 'HALO VR'][style], '#14181d', '#7fe8ff', 'bold 20px sans-serif'), 0, px(16), 0.367);
    onX(g, plate(0.26, 0.07, 'PROTOTYPE', '#14181d', '#f2b13a', 'bold 17px sans-serif'), 0.367, px(16), 0.0);
    const gy = 27.5, gh = 44;                                                                  // the glass box
    g.add(at(cbox(0.66, px(gh), 0.66, 0.01, glassMat), 0, px(gy + gh / 2), 0));
    for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) g.add(at(cbox(0.026, px(gh + 2), 0.026, 0.004, steelLt), sx * 0.33, px(gy + gh / 2), sz * 0.33));
    for (const [w, d, x, z] of [[0.68, 0.026, 0, 0.33], [0.68, 0.026, 0, -0.33], [0.026, 0.68, 0.33, 0], [0.026, 0.68, -0.33, 0]]) { g.add(at(cbox(w, px(2.2), d, 0.004, steelLt), x, px(gy + gh + 0.2), z)); g.add(at(cbox(w, px(2.2), d, 0.004, steelLt), x, px(gy), z)); }
    slab(g, 0.7, 1.6, 0.7, std('#cfd9de', 0.2, 0.5), 0, gy + gh + 1.4, 0, 0.012);              // the lid
    // the spotlight on the lid: an arm and a lamp head aimed down
    slab(g, 0.04, 8, 0.04, steelDk, -0.2, gy + gh + 3.4, -0.2, 0.006); slab(g, 0.14, 5, 0.1, graphite, -0.2, gy + gh + 11, -0.16, 0.012); g.add(at(cbox(0.1, px(0.8), 0.06, 0.003, white), -0.2, px(gy + gh + 10.6), -0.1));
    const pad = cyl(0.26, 0.26, px(1.2), std('#1c2127', 0.6, 0.4), 28); g.add(at(pad, 0, px(gy + 0.6), 0)); g.add(at(flat(torus(0.255, 0.008, cyan, 36)), 0, px(gy + 1.3), 0));
    // the product
    if (style === 0) {          // a crystal: a faceted gem floating over a small base, with a halo ring
      const gem = new T.Mesh(new T.OctahedronGeometry(0.17), glow('#31e8ff', 0.95)); gem.scale.set(1, 1.55, 1); gem.rotation.y = 0.5; g.add(at(gem, 0, px(gy + 20), 0));
      const gem2 = new T.Mesh(new T.OctahedronGeometry(0.2), trans('#31e8ff', 0.25, 1)); gem2.scale.set(1, 1.55, 1); gem2.rotation.y = 0.5; g.add(at(gem2, 0, px(gy + 20), 0));
      g.add(at(flat(torus(0.26, 0.01, cyanDim, 32)), 0, px(gy + 20), 0)); g.add(at(cyl(0.05, 0.08, px(4), steelDk, 12), 0, px(gy + 3), 0)); g.add(at(cyl(0.02, 0.02, px(8), cyanDim, 8), 0, px(gy + 9), 0));
    } else if (style === 1) {   // a small drone: a body, four arms with rotors, a camera pod, hovering over a stand
      const dr = G(); dr.position.set(0, px(gy + 20), 0); dr.rotation.y = 0.45; dr.scale.set(1.2, 1.2, 1.2); g.add(dr);
      dr.add(at(cbox(0.2, px(6), 0.24, 0.03, std('#e6edf0', 0.3, 0.45)), 0, 0, 0)); dr.add(at(cbox(0.14, px(1.6), 0.18, 0.01, graphiteLt), 0, px(3.6), 0));
      for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) { const a = tube([[sx * 0.08, 0, sz * 0.08], [sx * 0.16, px(1), sz * 0.16], [sx * 0.22, px(1.5), sz * 0.22]], 0.014, graphite); dr.add(a); dr.add(at(cyl(0.032, 0.032, px(3), graphiteLt, 10), sx * 0.22, px(2.5), sz * 0.22)); dr.add(at(cyl(0.12, 0.12, px(0.5), trans('#9fd8ff', 0.4, 1), 20), sx * 0.22, px(4.4), sz * 0.22)); dr.add(at(cbox(0.24, px(0.4), 0.02, 0.002, graphite), sx * 0.22, px(4.4), sz * 0.22)); }
      dr.add(at(new T.Mesh(new T.SphereGeometry(0.055, 12, 8), black), 0.05, px(-3.6), 0.12)); dr.add(at(new T.Mesh(new T.SphereGeometry(0.02, 8, 6), cyan), 0.07, px(-3.8), 0.17));
      dr.add(at(cbox(0.05, px(1), 0.05, 0.005, amber), -0.06, px(0.5), 0.13));
      g.add(at(cyl(0.03, 0.05, px(15), steelDk, 10), 0, px(gy + 8), 0));
    } else {                    // a headset: a headband, two ear cups, a visor lens, on a bust stand
      const hs = G(); hs.position.set(0, px(gy + 22), 0); hs.rotation.y = 0.35; hs.scale.set(1.15, 1.15, 1.15); g.add(hs);
      g.add(at(cyl(0.05, 0.07, px(14), steelDk, 12), 0, px(gy + 8), 0)); g.add(at(sphere(0.11, std('#252b34', 0.3, 0.5), 14), 0, px(gy + 20), 0)); g.children[g.children.length - 1].scale.set(1, 1.1, 1.1);
      const band = new T.Mesh(new T.TorusGeometry(0.15, 0.018, 8, 28, PI), std('#e6edf0', 0.3, 0.45)); band.rotation.z = 0; band.position.y = px(2); hs.add(band); band.rotation.y = PI / 2;
      for (const s of [-1, 1]) { const c = cyl(0.08, 0.075, 0.07, std('#e6edf0', 0.3, 0.45), 18); c.rotation.z = PI / 2; hs.add(at(c, 0, px(-2), s * 0.15)); c.rotation.x = PI / 2; c.rotation.z = 0; hs.add(at(cyl(0.05, 0.05, 0.075, cyanDim, 16), 0, px(-2), s * 0.15)); hs.children[hs.children.length - 1].rotation.x = PI / 2; }
      const visor = new T.Mesh(new T.CylinderGeometry(0.17, 0.17, px(5.5), 24, 1, true, -0.9, 1.8), std('#10161d', 0.9, 0.12, { side: T.DoubleSide })); visor.position.set(0, px(-5), 0.0); visor.rotation.y = PI / 2; hs.add(visor);
      hs.add(at(cbox(0.012, px(1.6), 0.18, 0.003, cyan), 0.17, px(-5), 0));
    }
    return { g };
  }

  // ───────────────────────── TELESCOPE ─────────────────────────
  function telescope() {
    const g = G(), brass = std('#b88a3a', 0.9, 0.3), brassDk = std('#8a6424', 0.9, 0.38), brassLt = std('#dcb15a', 0.9, 0.28);
    // the tripod: three splayed legs to a hub, feet on rubber pads
    const hubY = 40;
    for (const ang of [30, 150, 270]) { const a = ang * PI / 180, bx = Math.cos(a) * 0.38, bz = Math.sin(a) * 0.38; g.add(tube([[Math.cos(a) * 0.05, px(hubY), Math.sin(a) * 0.05], [Math.cos(a) * 0.22, px(hubY * 0.5), Math.sin(a) * 0.22], [bx, px(2.5), bz]], 0.028, brassDk)); g.add(at(cyl(0.05, 0.055, px(2.5), rubber, 12), bx, px(1.2), bz)); }
    cylY(g, 0.075, 0.075, 6, brass, 0, hubY - 3, 0, 18); cylY(g, 0.045, 0.045, 14, brassLt, 0, hubY + 3, 0, 14);
    g.add(flat(at(torus(0.09, 0.008, brassLt, 20), 0, px(hubY + 0.2), 0)));
    // a spreader and a little coin box on the +z leg side
    slab(g, 0.22, 10, 0.16, std('#2f3a46', 0.6, 0.5), 0.22, 8, 0.2, 0.02); onZ(g, plate(0.16, 0.05, '25c', '#14181d', '#f2b13a', 'bold 22px sans-serif'), 0.22, px(15), 0.285); g.add(at(cbox(0.1, px(1), 0.012, 0.002, black), 0.22, px(11.5), 0.286));
    // the mount: a fork and a pivot, then the tube pointing out (+x) and up
    slab(g, 0.16, 5, 0.2, brass, 0, hubY + 16, 0, 0.015); slab(g, 0.05, 14, 0.05, brassDk, 0, hubY + 20, 0.09, 0.008); slab(g, 0.05, 14, 0.05, brassDk, 0, hubY + 20, -0.09, 0.008);
    const piv = cyl(0.03, 0.03, 0.26, brassLt, 10); piv.rotation.x = PI / 2; g.add(at(piv, 0, px(hubY + 33), 0));
    const tubeG = G(); tubeG.position.set(0, px(hubY + 33), 0); tubeG.rotation.z = 0.5; g.add(tubeG);   // raised about z: the tube points +x and up
    const body = cyl(0.085, 0.085, 0.9, brass, 24); body.rotation.z = -PI / 2; tubeG.add(at(body, 0.08, 0, 0));
    for (const x of [-0.18, 0.12, 0.42]) { const r = cyl(0.093, 0.093, 0.035, brassLt, 24); r.rotation.z = -PI / 2; tubeG.add(at(r, x, 0, 0)); }          // the bands
    const hood = cyl(0.11, 0.095, 0.17, brassDk, 24); hood.rotation.z = -PI / 2; tubeG.add(at(hood, 0.6, 0, 0));
    const lens = cyl(0.092, 0.092, 0.01, new T.MeshStandardMaterial({ color: col('#7fd8ff'), metalness: 0.2, roughness: 0.05, emissive: col('#1a6f8a'), emissiveIntensity: 0.6 }), 24); lens.rotation.z = -PI / 2; tubeG.add(at(lens, 0.67, 0, 0));
    const ep = cyl(0.04, 0.05, 0.22, std('#242a32', 0.6, 0.5), 14); ep.rotation.z = -PI / 2; tubeG.add(at(ep, -0.46, 0, 0)); const cup = cyl(0.055, 0.045, 0.04, rubber, 14); cup.rotation.z = -PI / 2; tubeG.add(at(cup, -0.59, 0, 0));
    // the finder scope on top, a focus knob, a counterweight
    const fs = cyl(0.028, 0.028, 0.34, steelDk, 12); fs.rotation.z = -PI / 2; tubeG.add(at(fs, 0.18, 0.13, 0)); for (const x of [0.06, 0.3]) tubeG.add(at(cbox(0.03, 0.06, 0.03, 0.004, brassDk), x, 0.095, 0));
    const kn = cyl(0.03, 0.03, 0.04, brassLt, 10); kn.rotation.x = PI / 2; tubeG.add(at(kn, -0.3, 0, 0.11)); tubeG.add(at(cyl(0.045, 0.045, 0.02, brassLt, 10), -0.3, 0, 0.135)); tubeG.children[tubeG.children.length - 1].rotation.x = PI / 2;
    const cw = cyl(0.05, 0.05, 0.1, steelDk, 12); cw.rotation.z = -PI / 2; tubeG.add(at(cw, -0.52, -0.07, -0.0)); g.add(at(new T.Mesh(new T.SphereGeometry(0.014, 8, 6), cyan), 0.24, px(hubY + 8), 0.1));
    onX(g, plate(0.2, 0.06, 'OBSERVATORY', '#14181d', '#dcb15a', 'bold 17px sans-serif'), 0.0, px(26), 0.0); g.children[g.children.length - 1].visible = false;
    return { g };
  }

  const VARS = [];
  for (const s of [0, 1]) VARS.push('teleporter.s' + s);
  VARS.push('charger.on', 'charger.off', 'relay.on', 'relay.off', 'mech_bay', 'locker.1x1.s0', 'locker.1x1.s1', 'locker.4x1', 'cabinet.1x1', 'cabinet.1x2', 'display_case.s0', 'display_case.s1', 'display_case.s2', 'telescope');
  PROPS.tech = { variants: VARS, canvas: [1100, 900], exposure: 0.92, build(name) {
    if (name.startsWith('teleporter')) return teleporter(+name.slice(-1));
    if (name === 'charger.on' || name === 'charger.off') return charger(name === 'charger.on');
    if (name === 'relay.on' || name === 'relay.off') return relay(name === 'relay.on');
    if (name === 'mech_bay') return mechBay();
    if (name === 'locker.1x1.s0') return locker1x1(0);
    if (name === 'locker.1x1.s1') return locker1x1(1);
    if (name === 'locker.4x1') return locker4x1();
    if (name === 'cabinet.1x1') return cabinet1x1();
    if (name === 'cabinet.1x2') return cabinet1x2();
    if (name.startsWith('display_case')) return displayCase(+name.slice(-1));
    if (name === 'telescope') return telescope();
    throw new Error('unknown tech variant ' + name);
  } };
})();
