// THE LIQUID TANKS (family 'tank'). Variant 'reserve': the arena's two giant liquid reserves (violet ooze): a riveted steel storage tank on a hazard-striped plinth, footprint radius 2.25 tiles on the origin, the flat roof deck
// at exactly 170 game-px (the catwalks' deck height: a footbridge lands on the roof from the +x side, where the roof railing has a gate gap), with a sight window of glowing liquid, a caged ladder, pipes and valves, a
// pressure gauge, a roof hatch, a vent stack and indicator lights. Variant 'lab': the Experiment Lab's glass tank (radius 1.2, 80 game-px): mint liquid with bubbles in a glass cylinder between a steel base and cap.
// The camera sees the faces that look towards +x and +z, so the details (window, valves, ladder, gauge) are set on the angles -25..135 degrees (angle = atan2(z, x)).
// (Everything is inside a block: the helpers must not collide with the other families' when several are baked in one page.)
{
  // (the renderer outputs sRGB, so a colour given as a hex is turned to linear first: what is written is what is seen)
  const tkCol = c => new T.Color(c).convertSRGBToLinear();
  const tkStd = (c, m, r, e) => { const x = new T.MeshStandardMaterial({ color: tkCol(c), metalness: m, roughness: r }); x.envMapIntensity = e == null ? 0.6 : e; return x; };
  const tkBasic = c => new T.MeshBasicMaterial({ color: tkCol(c), toneMapped: false });
  const TK = {
    steel: tkStd(0x5a6a76, 0.7, 0.5), steel2: tkStd(0x4a5864, 0.7, 0.55), steel3: tkStd(0x546471, 0.7, 0.5), steelLt: tkStd(0x93a6b8, 0.75, 0.4, 0.9), dark: tkStd(0x20272f, 0.6, 0.6, 0.3), pipe: tkStd(0x7a8c9c, 0.65, 0.42, 0.8),
    pipeDk: tkStd(0x44525e, 0.65, 0.5), brass: tkStd(0xb8923f, 1, 0.36, 0.9), wheel: tkStd(0xd24a35, 0.5, 0.45, 0.6), rubber: tkStd(0x14171c, 0.2, 0.8, 0.2), white: tkStd(0xdfe6ee, 0.1, 0.5, 0.5), stain: tkStd(0x2a2f36, 0.3, 0.9, 0.2),
    vio: tkBasic(0xa64dff), vio2: tkBasic(0x7a30d8), vioHot: tkBasic(0xe0b8ff), teal: tkBasic(0x31e8ff), amber: tkBasic(0xffb347), mint: tkBasic(0x2fd4a0), mintHot: tkBasic(0xb8ffe6),
    glass: new T.MeshStandardMaterial({ color: tkCol(0xc8d4ff), transparent: true, opacity: 0.2, metalness: 0, roughness: 0.04, depthWrite: false, side: T.DoubleSide }),
    glassMint: new T.MeshStandardMaterial({ color: tkCol(0xbfffe9), transparent: true, opacity: 0.17, metalness: 0, roughness: 0.04, depthWrite: false, side: T.DoubleSide }),
  };
  TK.glass.envMapIntensity = 1.3; TK.glassMint.envMapIntensity = 1.3;
  // yellow and black hazard stripes (a texture; the geometry's u runs along its long side)
  const tkHazard = (reps, rough) => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 32; const g = c.getContext('2d'); g.fillStyle = '#f0b030'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#15171b';
    for (let i = -2; i < 7; i++) { g.beginPath(); g.moveTo(i * 24, 0); g.lineTo(i * 24 + 12, 0); g.lineTo(i * 24 - 20, 32); g.lineTo(i * 24 - 32, 32); g.closePath(); g.fill(); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(reps, 1); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    const m = new T.MeshStandardMaterial({ map: t, color: 0xffffff, metalness: 0.2, roughness: rough == null ? 0.6 : rough }); m.envMapIntensity = 0.5; return m;
  };
  const rnd = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const deg = a => a * PI / 180;
  const at = (th, r) => [Math.cos(th) * r, Math.sin(th) * r];
  // a rod / pipe between two points
  const rod = (parent, a, b, r, mat, seg) => { const m = cyl(r, r, 1, mat, seg || 8), d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length() || 1e-4; m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.divideScalar(L)); m.scale.set(1, L, 1); parent.add(m); return m; };
  // a flat ring (arc) in the xz plane at height y, from angle `start` (radians, from +x towards +z) for `arc` radians
  const ring = (parent, r, tube, mat, y, start, arc, seg) => { const w = G(), m = new T.Mesh(new T.TorusGeometry(r, tube, 6, seg || 64, arc == null ? TAU : arc), mat); m.rotation.x = PI / 2; w.add(m); w.rotation.y = -(start || 0); w.position.y = y; parent.add(w); return w; };
  // a handwheel on a horizontal-axis (axis = +x local) or vertical stem: a rim and three spokes
  const wheel = (parent, r, mat, x, y, z, vertical) => {
    const w = G(), rim = new T.Mesh(new T.TorusGeometry(r, r * 0.14, 6, 18), mat); w.add(rim);
    for (let i = 0; i < 3; i++) { const s = cbox(r * 2, r * 0.12, r * 0.12, 0.004, mat); s.rotation.z = i * PI / 3; w.add(s); }
    if (vertical) w.rotation.x = PI / 2; else w.rotation.y = PI / 2; w.position.set(x, y, z); parent.add(w); return w;
  };
  // a gate valve on a vertical pipe at (x, y, z): a body, a bonnet, a stem and a wheel on top
  const valve = (parent, x, y, z, s) => {
    const b = cyl(0.14 * s, 0.14 * s, px(9) * s, TK.steel3, 12); b.position.set(x, y, z); parent.add(b);
    const bn = cyl(0.08 * s, 0.1 * s, px(10) * s, TK.steelLt, 10); bn.position.set(x, y + px(9) * s, z); parent.add(bn);
    rod(parent, [x, y + px(12) * s, z], [x, y + px(24) * s, z], 0.018 * s, TK.steelLt, 6); wheel(parent, 0.1 * s, TK.wheel, x, y + px(24) * s, z, true);
  };
  const flange = (parent, r, x, y, z, axis) => { const f = cyl(r, r, 0.035, TK.steelLt, 14); f.position.set(x, y, z); if (axis === 'x') f.rotation.z = PI / 2; else if (axis === 'z') f.rotation.x = PI / 2; parent.add(f); for (let i = 0; i < 6; i++) { const a = i * TAU / 6, bl = sphere(0.014, TK.steelLt, 6); if (axis === 'x') bl.position.set(x + 0.02, y + Math.cos(a) * r * 0.78, z + Math.sin(a) * r * 0.78); else bl.position.set(x + Math.cos(a) * r * 0.78, y + 0.02, z + Math.sin(a) * r * 0.78); parent.add(bl); } };

  // ───────────── the arena's reserve ─────────────
  const reserve = () => {
    const g = G(), R = 2.0, H = px(170), base = px(9), roofT = px(5), shellTop = H - roofT, shellH = shellTop - base, ch = shellH / 4;
    const radial = (th, fn) => { const w = G(); w.rotation.y = -th; g.add(w); fn(w); return w; };   // a group whose local +x points away from the tank at angle th
    const skip = th => { const d = ((th % TAU) + TAU) % TAU * 180 / PI; return (d > 46 && d < 70) || (d > 99 && d < 122); };   // where the window and the ladder are: no ribs or rivets
    // the plinth: a hazard-striped concrete-and-steel ring with anchor bolts
    const pl = cyl(R + 0.2, R + 0.22, base, tkHazard(34, 0.7), 64); pl.position.y = base / 2; g.add(pl);
    const plTop = cyl(R + 0.2, R + 0.2, px(1.5), TK.steelLt, 64); plTop.position.y = base - px(0.75); g.add(plTop);
    for (let i = 0; i < 24; i++) { const th = (i + 0.5) * TAU / 24, [x, z] = at(th, R + 0.13), n = cyl(0.035, 0.035, px(4), TK.steelLt, 6); n.position.set(x, base + px(2), z); g.add(n); }
    // the shell: four courses, each a little thinner than the one below, welded together, with vertical ribs and rows of rivets
    const cols = [TK.steel, TK.steel2, TK.steel3, TK.steel];
    for (let i = 0; i < 4; i++) { const r = R + [0.04, 0.028, 0.016, 0.006][i], c = cyl(r, r, ch + px(0.4), cols[i], 72); c.position.y = base + ch * (i + 0.5); g.add(c); }
    for (let i = 0; i <= 4; i++) {
      const y = base + ch * i, r = R + [0.05, 0.062, 0.05, 0.036, 0.024][i]; const wb = cyl(r, r, px(5), TK.steelLt, 72); wb.position.y = y; g.add(wb);
      for (let k = 0; k < 72; k++) { const th = k * TAU / 72; if (skip(th)) continue; for (const dy of [-px(5), px(5)]) { if (y + dy < base + px(2) || y + dy > shellTop) continue; const [x, z] = at(th, r + 0.002), b = sphere(0.013, TK.steelLt, 5); b.position.set(x, y + dy, z); g.add(b); } }
    }
    for (let k = 0; k < 30; k++) { const th = (k + 0.5) * TAU / 30; if (skip(th)) continue; const [x, z] = at(th, R + 0.07), rb = cbox(0.06, shellH - px(6), 0.05, 0.008, TK.steelLt); rb.position.set(x, base + shellH / 2, z); rb.rotation.y = -th; g.add(rb); }
    // weathering: dark streaks down the shell under the weld bands and the pipes
    for (let k = 0; k < 26; k++) { const th = rnd(k + 3) * TAU; if (skip(th)) continue; const len = px(14 + rnd(k + 9) * 40), y = base + shellH * (0.2 + rnd(k + 5) * 0.75), [x, z] = at(th, R + 0.075), s = cbox(0.045 + rnd(k) * 0.05, len, 0.004, 0.001, TK.stain); s.position.set(x, y - len / 2, z); s.rotation.y = -th; g.add(s); }
    // the roof: a plate, grating bars, a rim lip
    const rf = cyl(R + 0.06, R + 0.06, roofT, TK.steel2, 72); rf.position.y = H - roofT / 2; g.add(rf);
    const lip = cyl(R + 0.09, R + 0.09, px(3), TK.steelLt, 72); lip.position.y = shellTop + px(1); g.add(lip);
    for (let k = 0; k < 20; k++) { const th = k * TAU / 20, b = cbox(R - 0.35, px(1.6), 0.035, 0.004, TK.steelLt); const [x, z] = at(th, (R + 0.35) / 2 + 0.05); b.position.set(x, H + px(0.7), z); b.rotation.y = -th; g.add(b); }
    for (const rr of [0.8, 1.35, 1.8]) ring(g, rr, 0.014, TK.steelLt, H + px(0.9), 0, TAU, 72);
    // the hatch: a raised collar, a dome and a handwheel; a glowing inspection port; the vent stack with its stays
    const hc = cyl(0.55, 0.6, px(9), TK.steel, 36); hc.position.y = H + px(4.5); g.add(hc); ring(g, 0.58, 0.022, TK.steelLt, H + px(9), 0, TAU, 40);
    const dome = new T.Mesh(new T.SphereGeometry(0.5, 28, 12, 0, TAU, 0, PI / 2), TK.steel3); dome.scale.y = 0.45; dome.position.y = H + px(9); g.add(dome);
    wheel(g, 0.2, TK.wheel, 0, H + px(9) + 0.5 * 0.45 + 0.01, 0, true);
    { const [px0, pz0] = at(deg(40), 1.25), pt = cyl(0.2, 0.2, px(2.5), TK.vio, 24); pt.position.set(px0, H + px(1.3), pz0); g.add(pt); ring(g, 0.2, 0.026, TK.steelLt, H + px(3), 0, TAU, 24).position.set(px0, H + px(3), pz0); }
    { const [vx, vz] = at(deg(215), 1.2), st = cyl(0.11, 0.11, px(62), TK.pipe, 14); st.position.set(vx, H + px(31), vz); g.add(st); const cap = cyl(0.17, 0.12, px(6), TK.steelLt, 14); cap.position.set(vx, H + px(65), vz); g.add(cap); flange(g, 0.17, vx, H + px(4), vz, 'y');
      for (let i = 0; i < 3; i++) { const [sx, sz] = at(deg(215 + i * 120), 0.5); rod(g, [vx + sx * 0.4, H + px(2), vz + sz * 0.4], [vx, H + px(40), vz], 0.012, TK.pipeDk, 5); } }
    { const [mx, mz] = at(deg(150), 1.0); rod(g, [0.5, H + px(7), 0.2], [mx, H + px(7), mz], 0.045, TK.pipe, 10); const el = sphere(0.055, TK.pipe, 10); el.position.set(mx, H + px(7), mz); g.add(el); }
    // the roof railing (a gate gap where the bridge lands, +x, and a second one where the ladder comes up): posts, a toe board, a mid rail, a top rail
    const arcs = [[deg(21), deg(97)], [deg(121), deg(339)]];
    for (const [a0, a1] of arcs) {
      const arc = a1 - a0; for (const [y, t, m] of [[px(3), 0.016, TK.steelLt], [px(18), 0.013, TK.steelLt], [px(34), 0.02, TK.steelLt]]) ring(g, R - 0.04, t, m, H + y, a0, arc, 48);
      const n = Math.max(2, Math.round(arc / deg(14)) + 1); for (let i = 0; i < n; i++) { const th = a0 + arc * i / (n - 1), [x, z] = at(th, R - 0.04), p = cyl(0.018, 0.018, px(34), TK.steelLt, 6); p.position.set(x, H + px(17), z); g.add(p); }
    }
    for (const th of [deg(21), deg(-21)]) { const [x, z] = at(th, R - 0.04), p = cyl(0.036, 0.036, px(44), TK.steelLt, 8); p.position.set(x, H + px(22), z); g.add(p); const hs = cyl(0.05, 0.05, px(4), TK.dark, 8); hs.position.set(x, H + px(46), z); g.add(hs); const lm = sphere(0.045, th > 0 ? TK.teal : TK.vio, 10); lm.position.set(x, H + px(51), z); g.add(lm); }
    // an indicator light ring just under the roof: violet and teal in turn
    for (let k = 0; k < 24; k++) { const th = k * TAU / 24, [x, z] = at(th, R + 0.03), l = sphere(0.032, k % 3 === 0 ? TK.teal : TK.vio, 8); l.position.set(x, shellTop - px(12), z); g.add(l); }
    // a violet glow band round the shell under the lights (not where the window and ladder are)
    for (const [a0, a1] of [[deg(-40), deg(44)], [deg(72), deg(97)], [deg(125), deg(320)]]) ring(g, R + 0.045, 0.014, TK.vio2, shellTop - px(26), a0, a1 - a0, 48);
    // the sight window, with the liquid in it
    radial(deg(58), w => {
      const y0 = base + px(36), wh = px(104), wx = R + 0.03;
      const fr = cbox(0.08, wh + 0.14, 0.7, 0.014, TK.steelLt); fr.position.set(wx, y0 + wh / 2, 0); w.add(fr);
      const rec = cbox(0.03, wh, 0.5, 0.004, TK.dark); rec.position.set(wx + 0.05, y0 + wh / 2, 0); w.add(rec);
      const lh = wh * 0.64, liq = cbox(0.02, lh, 0.46, 0.003, TK.vio2); liq.position.set(wx + 0.062, y0 + lh / 2, 0); w.add(liq);
      const upper = cbox(0.021, lh * 0.5, 0.46, 0.003, TK.vio); upper.position.set(wx + 0.064, y0 + lh * 0.75, 0); w.add(upper);
      const men = cbox(0.024, px(2.2), 0.46, 0.002, TK.vioHot); men.position.set(wx + 0.07, y0 + lh, 0); w.add(men);
      const gl = cbox(0.012, wh, 0.5, 0.002, TK.glass); gl.position.set(wx + 0.082, y0 + wh / 2, 0); w.add(gl);
      for (const sy of [-1, 1]) for (const sz of [-1, 1]) { const b = sphere(0.022, TK.steelLt, 6); b.position.set(wx + 0.05, y0 + wh / 2 + sy * (wh / 2 + 0.03), sz * 0.3); w.add(b); }
      for (let i = 0; i <= 10; i++) { const tk = cbox(0.02, px(1.6), i % 5 === 0 ? 0.16 : 0.09, 0.002, TK.steelLt); tk.position.set(wx + 0.05, y0 + wh * i / 10, 0.43 + (i % 5 === 0 ? 0.03 : 0)); w.add(tk); }
      const lamp = sphere(0.035, TK.teal, 8); lamp.position.set(wx + 0.05, y0 + wh + 0.13, 0); w.add(lamp);
    });
    // the ladder with its safety cage, from the plinth to the roof
    radial(deg(110), w => {
      const x0 = R + 0.13, y0 = base + px(3), y1 = H + px(36);
      for (const z of [-0.17, 0.17]) { const r = cbox(0.03, y1 - y0, 0.03, 0.005, TK.steelLt); r.position.set(x0, (y0 + y1) / 2, z); w.add(r); }
      for (let y = y0 + px(8); y < y1 - px(4); y += px(9)) { const rg = cyl(0.011, 0.011, 0.34, TK.steelLt, 5); rg.rotation.x = PI / 2; rg.position.set(x0, y, 0); w.add(rg); }
      for (let y = y0 + px(12); y < y1; y += px(48)) for (const z of [-0.17, 0.17]) { const b = cbox(0.13, 0.025, 0.025, 0.004, TK.steelLt); b.position.set(x0 - 0.065, y, z); w.add(b); }
      const cy0 = base + px(58);
      for (let y = cy0; y < H + px(30); y += px(26)) { const hp = ring(w, 0.26, 0.011, TK.steelLt, y, -PI / 2, PI, 16); hp.position.x = x0; }
      for (const a of [-1.05, 0, 1.05]) { const cx = x0 + Math.cos(a) * 0.26, cz = Math.sin(a) * 0.26; const bar = cbox(0.016, H + px(30) - cy0, 0.016, 0.003, TK.steelLt); bar.position.set(cx, (cy0 + H + px(30)) / 2, cz); w.add(bar); }
    });
    // the pipework near the foot: a small line with a valve (A), a big line with a flange and a valve (B), a pressure gauge, a junction box with cables, a hazard sign
    radial(deg(7), w => {   // A: out of the shell, an elbow, down to the floor, a valve in it, and a puddle of ooze beneath
      const y = px(30); rod(w, [R - 0.05, y, 0], [R + 0.2, y, 0], 0.07, TK.pipe, 12); const el = sphere(0.085, TK.pipe, 12); el.position.set(R + 0.22, y, 0); w.add(el);
      rod(w, [R + 0.22, y, 0], [R + 0.22, 0, 0], 0.07, TK.pipe, 12); flange(w, 0.1, R + 0.02, y, 0, 'x'); valve(w, R + 0.22, px(8), 0, 0.9);
      const pd = cyl(0.34, 0.34, px(0.8), new T.MeshBasicMaterial({ color: 0x8a46e0, transparent: true, opacity: 0.55 }), 24); pd.scale.z = 0.7; pd.position.set(R + 0.5, px(0.4), 0.05); w.add(pd);
    });
    radial(deg(84), w => {   // B: a fat horizontal manifold leaving the shell, bending down into the floor
      const y = px(54); rod(w, [R - 0.05, y, 0], [R + 0.18, y, 0], 0.1, TK.pipe, 14); const el = sphere(0.12, TK.pipe, 14); el.position.set(R + 0.2, y, 0); w.add(el);
      rod(w, [R + 0.2, y, 0], [R + 0.2, 0, 0], 0.1, TK.pipe, 14); flange(w, 0.15, R + 0.0, y, 0, 'x'); for (const yy of [px(38), px(17)]) flange(w, 0.14, R + 0.2, yy, 0, 'y');
      for (const sz of [-1, 1]) { const gl = cyl(0.025, 0.025, px(10), TK.vio, 6); gl.position.set(R + 0.1, y + 0.13, sz * 0.06); w.add(gl); }
    });
    radial(deg(26), w => {   // the pressure gauge: a dial on a short stub
      const y = base + px(112); rod(w, [R, y, 0], [R + 0.1, y, 0], 0.03, TK.pipe, 8);
      const d = cyl(0.115, 0.115, 0.05, TK.steelLt, 24); d.rotation.z = PI / 2; d.position.set(R + 0.13, y, 0); w.add(d);
      const f = cyl(0.095, 0.095, 0.012, TK.white, 24); f.rotation.z = PI / 2; f.position.set(R + 0.16, y, 0); w.add(f);
      const nd = cbox(0.01, 0.08, 0.012, 0.002, TK.wheel); nd.position.set(R + 0.17, y, 0); nd.rotation.x = 0.7; w.add(nd);
      for (let i = 0; i < 7; i++) { const a = -2.2 + i * 0.73, tk = cbox(0.008, 0.016, 0.006, 0.001, TK.dark); tk.position.set(R + 0.168, y + Math.cos(a) * 0.08 * 0.0 + Math.sin(a + PI / 2) * 0.075, Math.cos(a + PI / 2) * 0.075); tk.rotation.x = a; w.add(tk); }
    });
    radial(deg(-24), w => {   // a hazard sign on the shell
      const sg = new T.Mesh(new T.BoxGeometry(0.02, px(30), 0.5), tkHazard(2, 0.6)); sg.position.set(R + 0.05, base + px(118), 0); w.add(sg);
      const fr = cbox(0.016, px(33), 0.54, 0.004, TK.dark); fr.position.set(R + 0.04, base + px(118), 0); w.add(fr);
    });
    radial(deg(150), w => {   // a junction box with cables up and down the shell
      const y = base + px(70), jb = cbox(0.14, 0.26, 0.2, 0.012, TK.dark); jb.position.set(R + 0.09, y, 0); w.add(jb);
      const lt = sphere(0.022, TK.vio, 8); lt.position.set(R + 0.17, y + 0.06, 0.05); w.add(lt);
      for (const z of [-0.06, 0, 0.06]) { const t1 = tube([[R + 0.05, y + 0.13, z], [R + 0.07, y + px(30), z * 1.4], [R + 0.06, y + px(62), z * 2]], 0.014, TK.rubber); w.add(t1); const t2 = tube([[R + 0.05, y - 0.13, z], [R + 0.08, y - px(26), z * 1.2], [R + 0.05, y - px(48), z * 1.6]], 0.014, TK.rubber); w.add(t2); }
    });
    return { g, marks: { top: [0, H, 0] } };
  };

  // ───────────── the lab's glass tank ─────────────
  const lab = () => {
    const g = G(), R = 1.2, base = px(9), capY = px(70), capT = px(10), top = capY + capT;
    const pl = cyl(R - 0.02, R, base, TK.steel2, 48); pl.position.y = base / 2; g.add(pl); const pr = cyl(R + 0.0, R + 0.0, px(2), tkHazard(24, 0.7), 48); pr.position.y = px(1); g.add(pr);
    const bt = cyl(1.04, 1.1, px(3), TK.steelLt, 48); bt.position.y = base + px(1.5); g.add(bt);
    for (let i = 0; i < 16; i++) { const th = (i + 0.5) * TAU / 16, [x, z] = at(th, 1.1), b = sphere(0.03, TK.steelLt, 6); b.position.set(x, base + px(3), z); g.add(b); }
    // the liquid (opaque, so the glass over it shades it), its bright surface, the bubbles
    const gR = 0.95, y0 = base + px(3), y1 = capY, lq = y0 + (y1 - y0) * 0.82;
    const li = cyl(gR - 0.02, gR - 0.02, lq - y0, TK.mint, 40); li.position.y = (y0 + lq) / 2; g.add(li);
    const sf = cyl(gR - 0.02, gR - 0.02, px(1.2), TK.mintHot, 40); sf.position.y = lq; g.add(sf);
    for (let i = 0; i < 34; i++) { const a = rnd(i) * TAU, rr = Math.sqrt(rnd(i + 40)) * (gR - 0.1), bb = sphere(0.016 + rnd(i + 80) * 0.03, TK.mintHot, 6); bb.position.set(Math.cos(a) * rr, y0 + px(6) + (lq - y0 - px(10)) * rnd(i + 120), Math.sin(a) * rr); g.add(bb); }
    for (let i = 0; i < 7; i++) { const bb = sphere(0.02 + i * 0.004, TK.mintHot, 6); bb.position.set(0.12 * Math.sin(i * 2.1), y0 + px(8) + i * px(6), 0.1 * Math.cos(i * 1.7)); g.add(bb); }
    const stone = cyl(0.14, 0.18, px(4), TK.steel3, 12); stone.position.y = y0 + px(2); g.add(stone);
    // the glass, with its rim lines and highlights
    const gl = new T.Mesh(new T.CylinderGeometry(gR, gR, y1 - y0, 48, 1, true), TK.glassMint); gl.position.y = (y0 + y1) / 2; gl.renderOrder = 2; g.add(gl);
    ring(g, gR, 0.022, TK.mintHot, y0 + px(0.5), 0, TAU, 48); ring(g, gR, 0.022, TK.mintHot, y1 - px(0.5), 0, TAU, 48);
    for (const [th, w] of [[deg(38), 0.07], [deg(52), 0.03], [deg(-10), 0.04]]) { const [x, z] = at(th, gR + 0.004), hl = new T.Mesh(new T.PlaneGeometry(w, (y1 - y0) * 0.86), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.42, depthWrite: false })); hl.position.set(x, (y0 + y1) / 2, z); hl.rotation.y = -th + PI / 2; hl.renderOrder = 3; g.add(hl); }
    // four support rods, the cap with a rim, risers with valves and a gauge, cables
    for (let i = 0; i < 4; i++) { const th = deg(45 + i * 90), [x, z] = at(th, 1.03); const r = cyl(0.035, 0.035, capY - base, TK.steelLt, 8); r.position.set(x, (capY + base) / 2, z); g.add(r); const nut = cyl(0.055, 0.055, px(3), TK.steel3, 6); nut.position.set(x, capY + px(1.5), z); g.add(nut); }
    const cp = cyl(1.04, 1.1, capT, TK.steel, 48); cp.position.y = capY + capT / 2; g.add(cp); ring(g, 1.07, 0.025, TK.steelLt, top - px(1), 0, TAU, 48);
    for (let i = 0; i < 12; i++) { const th = (i + 0.5) * TAU / 12, [x, z] = at(th, 0.98), b = sphere(0.025, TK.steelLt, 6); b.position.set(x, top + px(0.5), z); g.add(b); }
    for (const [th, h] of [[deg(30), 17], [deg(150), 12]]) { const [x, z] = at(th, 0.55); rod(g, [x, top, z], [x, top + px(h), z], 0.065, TK.pipe, 12); flange(g, 0.1, x, top + px(2), z, 'y'); const el = sphere(0.08, TK.pipe, 10); el.position.set(x, top + px(h), z); g.add(el); const [x2, z2] = at(th + 0.5, 0.72); rod(g, [x, top + px(h), z], [x2, top + px(h), z2], 0.055, TK.pipe, 10); const el2 = sphere(0.07, TK.pipe, 10); el2.position.set(x2, top + px(h), z2); g.add(el2); rod(g, [x2, top + px(h), z2], [x2, top + px(3), z2], 0.055, TK.pipe, 10); }
    { const [vx, vz] = at(deg(58), 0.7); valve(g, vx, top, vz, 0.7); }
    { const [x, z] = at(deg(100), 0.6), gp = cyl(0.04, 0.04, px(10), TK.pipe, 8); gp.position.set(x, top + px(5), z); g.add(gp); const d = cyl(0.12, 0.12, 0.05, TK.steelLt, 24); d.position.set(x, top + px(14), z); d.rotation.x = PI / 2 - 0.5; d.rotation.z = 0.2; g.add(d); const f = cyl(0.1, 0.1, 0.012, TK.white, 24); f.position.set(x, top + px(14), z); f.rotation.copy(d.rotation); f.translateY(0.03); g.add(f); }
    { const [x, z] = at(deg(-70), 0.8); const t = tube([[x, top, z], [x * 1.25, top + px(14), z * 1.25], [x * 1.3, top + px(10), z * 1.3 + 0.1], [x * 1.7, top - px(10), z * 1.7]], 0.02, TK.rubber); g.add(t); }
    // a drain valve and a status light on the base, a glow pool on the floor
    { const [x, z] = at(deg(12), 1.2); rod(g, [x - 0.2, px(6), z], [x + 0.18, px(6), z], 0.05, TK.pipe, 10); const el = sphere(0.06, TK.pipe, 10); el.position.set(x + 0.18, px(6), z); g.add(el); wheel(g, 0.07, TK.wheel, x + 0.06, px(15), z, true); rod(g, [x + 0.06, px(6), z], [x + 0.06, px(15), z], 0.016, TK.steelLt, 5); }
    { const [x, z] = at(deg(70), 1.14), sl = sphere(0.04, TK.teal, 8); sl.position.set(x, px(5), z); g.add(sl); }
    return { g, marks: { top: [0, top, 0] } };
  };

  PROPS.tank = { variants: ['reserve', 'lab'], canvas: [1000, 760], build(name) { return name === 'lab' ? lab() : reserve(); } };
}
