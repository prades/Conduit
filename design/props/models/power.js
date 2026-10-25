// THE POWER FAMILY (docs: design/props/BRIEF.md). Variants (named kind[.WxH|.rNN][.sN]):
//   main_generator.7x3   THE ARENA'S GENERATOR: a big electrical generating set standing against the arena's north wall, seven tiles by three. From the left: a diesel/turbine prime mover under a teal housing (louvred doors,
//                        a rack of exhaust stacks, an air-intake drum), the long ribbed alternator drum with a glowing viewing port and a terminal box, a control desk of screens and dials in front of it,
//                        and a tall step-up transformer with radiator fins and three ceramic insulators whose bus-bars run back over the alternator. Cables go into the wall behind. Its front is on +z (it faces the room).
// Everything is in a block: the helpers must not collide with the other families'.
{
  const MT = STY.mat, col = STY.col, std = STY.std, glow = STY.glow;
  const P = px;                                           // a height in game pixels, in units
  const deg = a => a * PI / 180;
  const Q = {
    steel: std('#aeb8c4', 0.92, 0.3), steelDk: std('#5d6874', 0.85, 0.38), chrome: std('#e4ebf2', 1, 0.14), dark: std('#14181e', 0.5, 0.55), graphite: MT.graphite, rubber: MT.rubber,
    concrete: std('#8d949a', 0.05, 0.85), concreteDk: std('#6c737a', 0.05, 0.9), teal: MT.teal, tealDk: MT.tealDk, tealLit: MT.tealLit, amber: MT.amber,
    paint: std('#2f6a73', 0.35, 0.4), paintLit: std('#3f8590', 0.35, 0.38), gray: std('#9aa6b2', 0.5, 0.45), grayDk: std('#6f7b88', 0.55, 0.45), copper: std('#c8782e', 0.9, 0.28), ceramic: std('#e8dfc8', 0.1, 0.35),
    yellow: std('#f2b13a', 0.3, 0.45), redPaint: std('#c8402c', 0.35, 0.42), label: std('#fff6d0', 0, 0.8),
    glass: MT.glass, glassTint: MT.glassTint,
  };
  Q.glass.side = T.DoubleSide; Q.glassTint.side = T.DoubleSide;
  const G_ = { cyan: glow('#31e8ff', 0.95), mint: glow('#43e0a8', 0.9), amber: glow('#f2b13a', 0.95), red: glow('#ff4a3a', 0.9), violet: glow('#b57bff', 0.9), blue: glow('#3a7bff', 0.85), white: glow('#eaffff', 0.95), green: glow('#6dff9a', 0.85) };
  const grad = (top, bot) => { const c = document.createElement('canvas'); c.width = 4; c.height = 128; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 4, 128); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return new T.MeshBasicMaterial({ map: t, toneMapped: false }); };
  const B = (par, xr, yr, zr, mat, b) => { const m = cbox(xr[1] - xr[0], P(yr[1] - yr[0]), zr[1] - zr[0], b == null ? 0.015 : b, mat); m.position.set((xr[0] + xr[1]) / 2, P((yr[0] + yr[1]) / 2), (zr[0] + zr[1]) / 2); par.add(m); return m; };
  const Cy = (par, r, y0, y1, mat, x, z, seg, r1) => { const m = cyl(r, r1 == null ? r : r1, P(y1 - y0), mat, seg || 16); m.position.set(x || 0, P((y0 + y1) / 2), z || 0); par.add(m); return m; };
  // a cylinder along an axis from a0 to a1, centred on the other two coordinates ((y, z) for x; (x, y) for z)
  const Ca = (par, axis, r, a0, a1, mat, p, q, seg) => { const m = cyl(r, r, Math.abs(a1 - a0), mat, seg || 16); const c = (a0 + a1) / 2; if (axis === 'x') { m.rotation.z = PI / 2; m.position.set(c, p, q); } else { m.rotation.x = PI / 2; m.position.set(p, q, c); } par.add(m); return m; };
  const S = (par, r, mat, x, y, z, sy) => { const m = sphere(r, mat, 14); m.position.set(x, y, z); if (sy) m.scale.y = sy; par.add(m); return m; };
  const rod = (par, a, b, r, mat, seg) => { const m = cyl(r, r, 1, mat, seg || 8), d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), l = d.length() || 1e-4; m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.scale.set(1, l, 1); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); par.add(m); return m; };
  // a gauge on a +z face: a chrome rim, a white face, a red needle at an angle
  const gauge = (par, x, y, z, r, ang) => { const rim = cyl(r, r, 0.04, Q.chrome, 24); rim.rotation.x = PI / 2; rim.position.set(x, y, z + 0.02); par.add(rim); const fc = cyl(r * 0.86, r * 0.86, 0.045, grad('#ffffff', '#cfdce4'), 24); fc.rotation.x = PI / 2; fc.position.set(x, y, z + 0.025); par.add(fc); const nd = cbox(0.012, r * 0.72, 0.012, 0.002, G_.red); nd.position.set(x + Math.sin(ang) * r * 0.3, y + Math.cos(ang) * r * 0.3, z + 0.052); nd.rotation.z = -ang; par.add(nd); S(par, r * 0.1, Q.dark, x, y, z + 0.05); };
  // a ceramic insulator: a stack of discs on a post, a copper cap
  const insulator = (par, x, y0, z, n) => { Cy(par, 0.05, y0, y0 + 6 + n * 5.5, Q.steelDk, x, z, 10); for (let i = 0; i < n; i++) { const yy = y0 + 4 + i * 5.5; Cy(par, 0.17 - (i % 2) * 0.03, yy, yy + 2.4, Q.ceramic, x, z, 18); } Cy(par, 0.09, y0 + 6 + n * 5.5, y0 + 10 + n * 5.5, Q.copper, x, z, 12); return y0 + 10 + n * 5.5; };

  const gen7x3 = () => {
    const g = G();
    // THE PLINTH AND SKID: a concrete slab with a hazard edge on the front, a steel frame on it
    B(g, [-3.47, 3.47], [0, 5], [-1.47, 1.47], Q.concrete, 0.035); B(g, [-3.5, 3.5], [4.4, 5.4], [-1.5, 1.5], Q.concreteDk, 0.02);
    for (let i = 0; i < 34; i++) { const x0 = -3.4 + i * 0.2; B(g, [x0, x0 + 0.1], [0.5, 3.4], [1.43, 1.49], i & 1 ? Q.graphite : Q.yellow, 0.004); }
    B(g, [3.43, 3.5], [0.5, 3.4], [-1.4, 1.4], Q.yellow, 0.004);
    B(g, [-3.3, 3.3], [5.4, 10], [-1.32, 1.32], Q.graphite, 0.02); for (const x of [-3.0, -1.4, 1.6, 3.0]) B(g, [x - 0.08, x + 0.08], [5.4, 11], [-1.34, 1.34], Q.steelDk, 0.01);

    // THE PRIME MOVER (left): a teal-housed engine, two louvred doors on the front, a vent bank on its +x end, a lifting eye, a rack of stacks and an air-intake drum on top
    const e0 = -3.25, e1 = -1.5, eh0 = 10, eh1 = 74;
    B(g, [e0, e1], [eh0, eh1], [-1.28, 1.1], Q.paint, 0.05); B(g, [e0 - 0.01, e1 + 0.01], [eh1 - 4, eh1], [-1.29, 1.11], Q.paintLit, 0.035); B(g, [e0 - 0.01, e1 + 0.01], [eh0, eh0 + 4], [-1.29, 1.11], Q.graphite, 0.02);
    for (let i = 0; i < 2; i++) { const x0 = e0 + 0.18 + i * 0.82, x1 = x0 + 0.74; B(g, [x0, x1], [eh0 + 6, eh1 - 8], [1.08, 1.14], Q.paintLit, 0.015); for (let k = 0; k < 11; k++) B(g, [x0 + 0.06, x1 - 0.06], [eh0 + 12 + k * 3.8, eh0 + 14.4 + k * 3.8], [1.12, 1.16], Q.graphite, 0.004); B(g, [x1 - 0.1, x1 - 0.06], [eh0 + 28, eh0 + 40], [1.13, 1.2], Q.chrome, 0.004); }
    B(g, [e1 - 0.02, e1 + 0.04], [eh0 + 6, eh1 - 10], [-1.0, 0.9], Q.graphite, 0.012); for (let k = 0; k < 16; k++) B(g, [e1 + 0.03, e1 + 0.06], [eh0 + 8 + k * 3.4, eh0 + 9.6 + k * 3.4], [-0.94, 0.84], Q.steel, 0.003);
    B(g, [e0 + 0.08, e0 + 0.7], [eh1 - 22, eh1 - 12], [1.1, 1.16], Q.yellow, 0.006); for (let i = 0; i < 3; i++) B(g, [e0 + 0.14 + i * 0.16, e0 + 0.2 + i * 0.16], [eh1 - 21, eh1 - 13], [1.15, 1.17], Q.graphite, 0.002);
    // the exhaust: two stacks through a silencer drum, rain caps, bands
    for (const [x, z, h] of [[e0 + 0.55, -0.55, 168], [e0 + 1.25, -0.55, 150]]) { Cy(g, 0.15, eh1, h, Q.steelDk, x, z, 16); Cy(g, 0.27, eh1 + 4, eh1 + 34, Q.steel, x, z, 20); for (const y of [eh1 + 3, eh1 + 35, h - 16]) Cy(g, 0.19, y, y + 2, Q.graphite, x, z, 16); const cap = cyl(0.02, 0.2, P(7), Q.steelDk, 16); cap.position.set(x, P(h + 3), z); g.add(cap); const lid = cyl(0.2, 0.2, P(1.2), Q.graphite, 16); lid.position.set(x, P(h + 7), z); g.add(lid); }
    // the air intake: a drum with a ribbed filter, a stub into the housing, a wire guard
    Cy(g, 0.34, eh1, eh1 + 26, Q.gray, e0 + 1.1, 0.35, 22); for (let k = 0; k < 6; k++) Cy(g, 0.355, eh1 + 3 + k * 3.6, eh1 + 4.6 + k * 3.6, Q.grayDk, e0 + 1.1, 0.35, 22); Cy(g, 0.36, eh1 + 26, eh1 + 29, Q.steelDk, e0 + 1.1, 0.35, 22); Cy(g, 0.08, eh1 + 29, eh1 + 36, Q.chrome, e0 + 1.1, 0.35, 10);
    // a lifting eye, a fuel filler with a chain and a gauge, a hand-hold
    Cy(g, 0.07, eh1, eh1 + 2.4, Q.yellow, e1 - 0.2, 0.8, 12); { const t = new T.Mesh(new T.TorusGeometry(0.1, 0.022, 8, 20), Q.yellow); t.position.set(e1 - 0.2, P(eh1 + 7), 0.8); t.rotation.y = 0.4; g.add(t); }
    gauge(g, e0 + 0.55, P(eh0 + 44), 1.14, 0.13, 0.7); gauge(g, e0 + 0.95, P(eh0 + 44), 1.14, 0.13, -0.4);

    // THE ALTERNATOR (middle): a long ribbed drum on cradle feet, end bells, cooling fins, a terminal box on top, a glowing viewing port on the front
    const a0 = e1 + 0.02, a1 = 1.55, ar = 0.74, ay = 10 + ar / P(1) * 1, az = -0.3;   // (ar is in units; ay in game px: the drum sits on the frame)
    const ayu = P(10) + ar;                                                             // the drum's axis, in units
    for (const x of [a0 + 0.3, a1 - 0.35]) { B(g, [x - 0.2, x + 0.2], [10, 10 + (ayu - P(10)) / P(1) * 0.55], [az - 0.5, az + 0.5], Q.graphite, 0.03); }
    Ca(g, 'x', ar, a0 + 0.12, a1 - 0.14, Q.paint, ayu, az, 40);
    for (let i = 0; i < 12; i++) Ca(g, 'x', ar + 0.03, a0 + 0.35 + i * 0.2, a0 + 0.42 + i * 0.2, Q.paintLit, ayu, az, 40);
    Ca(g, 'x', ar + 0.07, a0, a0 + 0.14, Q.steel, ayu, az, 40); Ca(g, 'x', ar + 0.07, a1 - 0.16, a1, Q.steel, ayu, az, 40); Ca(g, 'x', ar - 0.08, a1, a1 + 0.04, Q.graphite, ayu, az, 40);
    for (let k = 0; k < 10; k++) { const a = k * TAU / 10; const b = new T.Mesh(new T.CylinderGeometry(0.022, 0.022, 0.05, 8), Q.chrome); b.rotation.z = PI / 2; b.position.set(a1 - 0.08, ayu + Math.sin(a) * (ar + 0.07), az + Math.cos(a) * (ar + 0.07)); g.add(b); }
    // the viewing port on the front: a chrome ring, glass, a glowing coil inside
    { const pz = az + ar + 0.005, px0 = 0.35; const ring = cyl(0.3, 0.3, 0.07, Q.chrome, 28); ring.rotation.x = PI / 2; ring.position.set(px0, ayu, pz + 0.01); g.add(ring); const inner = cyl(0.25, 0.25, 0.075, grad('#0a1a22', '#02060a'), 28); inner.rotation.x = PI / 2; inner.position.set(px0, ayu, pz + 0.012); g.add(inner);
      for (let k = 0; k < 3; k++) { const t = new T.Mesh(new T.TorusGeometry(0.09 + k * 0.05, 0.012, 6, 28), k === 1 ? G_.violet : G_.cyan); t.position.set(px0, ayu, pz + 0.05); g.add(t); } S(g, 0.045, G_.white, px0, ayu, pz + 0.055);
      const gl = cyl(0.26, 0.26, 0.012, Q.glassTint, 28); gl.rotation.x = PI / 2; gl.position.set(px0, ayu, pz + 0.07); g.add(gl);
      for (let k = 0; k < 8; k++) { const a = k * TAU / 8; const sc = cyl(0.014, 0.014, 0.05, Q.chrome, 8); sc.rotation.x = PI / 2; sc.position.set(px0 + Math.cos(a) * 0.31, ayu + Math.sin(a) * 0.31, pz + 0.06); g.add(sc); } }
    // the terminal box on top, with three bushings, and a lifting lug
    B(g, [0.5, 1.2], [P(ayu) + 52, P(ayu) + 74], [az - 0.32, az + 0.32], Q.gray, 0.03); B(g, [0.48, 1.22], [P(ayu) + 72, P(ayu) + 76], [az - 0.34, az + 0.34], Q.grayDk, 0.02);
    for (let i = 0; i < 3; i++) { Cy(g, 0.06, P(ayu) + 76, P(ayu) + 90, Q.ceramic, 0.65 + i * 0.22, az, 12); Cy(g, 0.07, P(ayu) + 90, P(ayu) + 94, Q.copper, 0.65 + i * 0.22, az, 12); }
    B(g, [0.52, 0.72], [P(ayu) + 56, P(ayu) + 70], [az + 0.3, az + 0.36], Q.yellow, 0.005);
    // a nameplate on the drum and a high-voltage plate: a yellow triangle with a bolt
    B(g, [-0.62, 0.0], [P(ayu) + 8, P(ayu) + 22], [az + ar - 0.02, az + ar + 0.03], Q.label, 0.004); for (let k = 0; k < 4; k++) B(g, [-0.55, -0.1], [P(ayu) + 10 + k * 3, P(ayu) + 11 + k * 3], [az + ar + 0.025, az + ar + 0.035], Q.graphite, 0.002);

    // THE CONTROL DESK (front, in front of the alternator): a low sloped console of screens, dials, switches and a big red stop button, with a hazard-striped kerb
    const d0 = -1.25, d1 = 1.3, dz0 = 0.52, dz1 = 1.34;
    B(g, [d0, d1], [10, 34], [dz0, dz1], Q.graphite, 0.04); B(g, [d0 - 0.03, d1 + 0.03], [33, 36], [dz0 - 0.03, dz1 + 0.03], Q.steelDk, 0.025);
    { const tilt = G(); tilt.position.set((d0 + d1) / 2, P(36), (dz0 + dz1) / 2 + 0.05); tilt.rotation.x = -0.28; g.add(tilt); const W = d1 - d0 - 0.2;
      B(tilt, [-W / 2, W / 2], [0, 3], [-0.34, 0.34], Q.graphite, 0.02);
      for (let i = 0; i < 4; i++) { const sx = -W / 2 + 0.12 + i * (W - 0.24) / 4 + (W - 0.24) / 8; const scr = new T.Mesh(new T.PlaneGeometry((W - 0.24) / 4 - 0.1, P(8)), [G_.cyan, G_.green, G_.amber, G_.cyan][i]); scr.rotation.x = -PI / 2; scr.position.set(sx, P(3.15), -0.14); tilt.add(scr); const bz = cbox((W - 0.24) / 4 - 0.04, P(1.4), 0.38 * 0.8, 0.01, Q.dark); bz.position.set(sx, P(2.5), -0.14); tilt.add(bz);
        for (let k = 0; k < 4; k++) { const ln = new T.Mesh(new T.PlaneGeometry(((W - 0.24) / 4 - 0.14) * (0.3 + 0.6 * ((i * 5 + k * 3) % 7) / 7), 0.014), G_.white); ln.rotation.x = -PI / 2; ln.position.set(sx - 0.04, P(3.2), -0.2 + k * 0.05); tilt.add(ln); } }
      for (let i = 0; i < 9; i++) { const sw = cbox(0.045, P(2.4), 0.045, 0.006, i % 3 === 0 ? G_.red : Q.chrome); sw.position.set(-W / 2 + 0.16 + i * 0.2, P(4.2), 0.16); tilt.add(sw); S(tilt, 0.016, [G_.green, G_.amber, G_.red][i % 3], -W / 2 + 0.16 + i * 0.2, P(3.2), 0.26); }
      const st = cyl(0.085, 0.085, P(3), Q.redPaint, 18); st.position.set(W / 2 - 0.22, P(4.4), 0.2); tilt.add(st); const stc = cyl(0.12, 0.12, P(1.2), Q.yellow, 18); stc.position.set(W / 2 - 0.22, P(3.4), 0.2); tilt.add(stc); }
    for (let i = 0; i < 3; i++) gauge(g, d0 + 0.3 + i * 0.5, P(26), dz1 + 0.01, 0.13, [0.6, -0.3, 1.0][i]);
    for (let i = 0; i < 8; i++) B(g, [d0 + 0.05 + i * 0.32, d0 + 0.2 + i * 0.32], [11, 14], [dz1 - 0.01, dz1 + 0.04], i & 1 ? Q.yellow : Q.dark, 0.004);

    // THE TRANSFORMER (right): a tall grey tank with radiator fins on its +x face, a conservator drum on top, three ceramic insulators and warning plates
    const t0 = 1.75, t1 = 3.3, th = 104;
    B(g, [t0, t1], [10, th], [-1.28, 1.15], Q.gray, 0.05); B(g, [t0 - 0.02, t1 + 0.02], [th - 5, th], [-1.3, 1.17], Q.grayDk, 0.03); B(g, [t0 - 0.02, t1 + 0.02], [10, 15], [-1.3, 1.17], Q.grayDk, 0.025);
    for (let k = 0; k < 6; k++) { const z0 = -1.1 + k * 0.38; B(g, [t1 - 0.01, t1 + 0.16], [22, th - 12], [z0, z0 + 0.06], Q.steel, 0.01); } for (const y of [th - 16, 26]) Ca(g, 'z', 0.07, -1.12, 1.0, Q.steelDk, t1 + 0.08, P(y), 0, 12);   // the headers the fins hang between
    for (let k = 0; k < 7; k++) B(g, [t0 + 0.12 + k * 0.2, t0 + 0.2 + k * 0.2], [24, th - 14], [1.14, 1.2], Q.grayDk, 0.008);
    Ca(g, 'z', 0.2, -0.7, 0.2, Q.grayDk, 2.5, P(th) + 0.26, 0, 20); for (const z of [-0.7, 0.2]) { const ec = cyl(0.21, 0.21, 0.03, Q.steelDk, 20); ec.rotation.x = PI / 2; ec.position.set(2.5, P(th) + 0.26, z); g.add(ec); }
    const tops = []; for (let i = 0; i < 3; i++) tops.push(insulator(g, t0 + 0.4 + i * 0.5, th, 0.45, 3));
    gauge(g, t0 + 0.35, P(70), 1.17, 0.12, 0.2); gauge(g, t0 + 0.75, P(70), 1.17, 0.12, -0.8);
    B(g, [t0 + 0.2, t0 + 1.2], [28, 50], [1.14, 1.19], Q.label, 0.004); for (let k = 0; k < 4; k++) B(g, [t0 + 0.3, t0 + 1.1], [31 + k * 4.4, 32.4 + k * 4.4], [1.185, 1.2], Q.graphite, 0.002);
    { const tri = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.03, 3), Q.yellow); tri.rotation.set(PI / 2, 0, PI); tri.position.set(t1 - 0.4, P(80), 1.18); g.add(tri); B(g, [t1 - 0.45, t1 - 0.35], [P(80) / P(1) - 2, P(80) / P(1) + 4], [1.19, 1.205], Q.graphite, 0.002); }
    for (let i = 0; i < 4; i++) S(g, 0.03, [G_.green, G_.green, G_.amber, G_.red][i], t0 + 0.3 + i * 0.22, P(58), 1.2);
    // bus-bars: copper tubes from the alternator's bushings up and across to the transformer's insulators
    for (let i = 0; i < 3; i++) { const sx = 0.65 + i * 0.22, ex = t0 + 0.4 + i * 0.5; const top = P(ayu) + 94 + 2; const pts = [[sx, P(top), az], [sx, P(top + 14 + i * 4), az], [ex, P(top + 14 + i * 4), 0.1 + i * 0.1], [ex, P(tops[i] + 2), 0.45]]; g.add(tube(pts, 0.032, Q.copper)); }
    // cables into the wall behind: thick black ones from the transformer and the engine, with clamps
    for (let i = 0; i < 3; i++) { g.add(tube([[t0 + 0.3 + i * 0.4, P(th - 8), -1.28], [t0 + 0.3 + i * 0.4, P(th + 6), -1.4], [t0 + 0.3 + i * 0.4, P(th + 20), -1.5]], 0.04, Q.rubber)); }
    g.add(tube([[e0 + 0.9, P(eh1 - 10), -1.28], [e0 + 0.9, P(eh1 + 20), -1.42], [e0 + 1.4, P(eh1 + 40), -1.5]], 0.045, Q.rubber));
    // a floor cable from the desk to the engine with a plug, a drip tray under the engine and some cable clips
    g.add(tube([[d0 + 0.1, P(11), dz1], [d0 - 0.2, P(2), dz1 + 0.06], [e0 + 0.6, P(1.2), dz1 + 0.04], [e0 + 0.5, P(11), 1.12]], 0.03, Q.rubber)); { const pl = cbox(0.1, P(2.6), 0.09, 0.01, Q.yellow); pl.position.set(e0 + 0.5, P(13), 1.16); g.add(pl); }
    // a red beacon on the engine's front corner and an amber lamp on the transformer: they flash in the game (the sprite shows them lit)
    S(g, 0.07, G_.red, e1 - 0.14, P(eh1 + 5), 0.95); Cy(g, 0.085, eh1, eh1 + 2.4, Q.graphite, e1 - 0.14, 0.95, 12);
    return { g };
  };

  const VAR = { 'main_generator.7x3': gen7x3 };
  PROPS.power = { variants: Object.keys(VAR), canvas: [1500, 1000], exposure: 0.95, build(name) { return VAR[name](); } };
}
