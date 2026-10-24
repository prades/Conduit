// THE LAB FAMILY (docs: design/props/BRIEF.md). Variants (named kind[.WxH|.rNN][.sN]):
//   lab_bench.8x2.s0 / .s1   the two long island benches of the Experiment Lab: white solid-surface top, cabinets and drawers on the +z face, a sink with a gooseneck tap, glassware, racks, a microscope, a centrifuge, a monitor
//   fume_hood                the 3 x 2 fume cupboard: cabinet base, a glass sash front and side, a lit interior with apparatus, a control header, a canopy and a duct up
//   test_chamber.r85 / .r75  the two round glass specimen chambers (mint / violet liquid, bubbles, a suspended specimen, a steel cap with tubes)
//   cart.1x1 / cart.2x1      utility carts (the lab's: instruments and a bin; the armory's: ammunition cases and crates), two shelves, a push handle, four castors
//   generator.1x2 / .1x1     industrial generator sets (1x2 against a west wall, its front on +x; 1x1 with its front on +z)
//   toolbox                  a rolling tool chest, drawers with chrome handles, a top tray of tools
//   speaker                  a PA speaker cabinet on a tripod stand
//   spool                    a wooden cable drum on its side, wound with orange cable, its loose end on the floor
// Everything is in a block: the helpers must not collide with the other families'.
{
  const MT = STY.mat, col = STY.col, std = STY.std, glow = STY.glow;
  const P = px;                                           // a height in game pixels, in units
  const rnd = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
  const deg = a => a * PI / 180;
  // materials of this family
  const L = {
    steel: std('#aeb8c4', 0.92, 0.3), steelDk: std('#5d6874', 0.85, 0.38), chrome: std('#e4ebf2', 1, 0.14), dark: std('#14181e', 0.5, 0.55), graphite: MT.graphite, rubber: MT.rubber,
    top: std('#f3f8fa', 0.04, 0.34), laminate: MT.laminate, laminateDk: std('#b8d0d6', 0.05, 0.5), teal: MT.teal, tealDk: MT.tealDk, tealLit: MT.tealLit, amber: MT.amber,
    redPaint: std('#c8402c', 0.35, 0.42), orange: std('#e07a1f', 0.1, 0.6), olive: std('#4a5a3a', 0.25, 0.6), oliveDk: std('#2f3a28', 0.25, 0.65), yellow: std('#f2b13a', 0.3, 0.45),
    wood: std('#9a7440', 0.05, 0.72), woodDk: std('#6a4a24', 0.05, 0.8), woodLt: std('#b48a52', 0.05, 0.7), plastic: std('#e9eff2', 0.05, 0.5), blueBin: std('#3a7bff', 0.1, 0.55), label: std('#fff6d0', 0, 0.8),
    glass: MT.glass, glassTint: MT.glassTint, glassBrown: new T.MeshStandardMaterial({ color: col('#7a4a1c'), transparent: true, opacity: 0.55, metalness: 0, roughness: 0.1, depthWrite: false, envMapIntensity: 1 }),
    smoke: new T.MeshStandardMaterial({ color: col('#2a3a44'), transparent: true, opacity: 0.55, metalness: 0.1, roughness: 0.1, depthWrite: false, envMapIntensity: 1 }),
  };
  L.glass.side = T.DoubleSide; L.glassTint.side = T.DoubleSide; L.glassBrown.side = T.DoubleSide; L.smoke.side = T.DoubleSide;
  const G_ = { cyan: glow('#31e8ff', 0.9), mint: glow('#43e0a8', 0.9), amber: glow('#f2b13a', 0.95), red: glow('#ff4a3a', 0.9), violet: glow('#b57bff', 0.9), blue: glow('#3a7bff', 0.85), white: glow('#eaffff', 0.95), green: glow('#6dff9a', 0.85), pink: glow('#ff7ac8', 0.85) };
  // a vertical gradient (a lit liquid: brighter towards its surface) as an unlit material
  const grad = (top, bot) => { const c = document.createElement('canvas'); c.width = 4; c.height = 128; const g = c.getContext('2d'), gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, top); gr.addColorStop(1, bot); g.fillStyle = gr; g.fillRect(0, 0, 4, 128); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return new T.MeshBasicMaterial({ map: t, toneMapped: false }); };
  const LQ = { mint: grad('#b8ffe6', '#1f9c78'), violet: grad('#e8c8ff', '#6a2fc8'), cyan: grad('#c8f8ff', '#1a9ac0'), amber: grad('#ffe2a0', '#c8741a'), red: grad('#ffb0a0', '#b02a1a'), green: grad('#d8ffb8', '#3aa030'), blue: grad('#bcd4ff', '#2a58c8') };
  // placing helpers: B a bevelled box by extents (x0,x1), (y0,y1 in game px), (z0,z1); Cy a vertical cylinder from y0 to y1 (game px); Ca a cylinder along an axis
  const B = (par, xr, yr, zr, mat, b) => { const m = cbox(xr[1] - xr[0], P(yr[1] - yr[0]), zr[1] - zr[0], b == null ? 0.015 : b, mat); m.position.set((xr[0] + xr[1]) / 2, P((yr[0] + yr[1]) / 2), (zr[0] + zr[1]) / 2); par.add(m); return m; };
  const Cy = (par, r, y0, y1, mat, x, z, seg, r1) => { const m = cyl(r, r1 == null ? r : r1, P(y1 - y0), mat, seg || 16); m.position.set(x || 0, P((y0 + y1) / 2), z || 0); par.add(m); return m; };
  const Ca = (par, axis, r, a0, a1, mat, x, y, z, seg) => { const m = cyl(r, r, Math.abs(a1 - a0), mat, seg || 12); const c = (a0 + a1) / 2; if (axis === 'x') { m.rotation.z = PI / 2; m.position.set(c, y, z); } else if (axis === 'z') { m.rotation.x = PI / 2; m.position.set(x, y, c); } else m.position.set(x, c, z); par.add(m); return m; };
  const S = (par, r, mat, x, y, z, sy) => { const m = sphere(r, mat, 14); m.position.set(x, y, z); if (sy) m.scale.y = sy; par.add(m); return m; };
  const rod = (par, a, b, r, mat, seg) => { const m = cyl(r, r, 1, mat, seg || 8), d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), l = d.length() || 1e-4; m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.divideScalar(l)); m.scale.set(1, l, 1); par.add(m); return m; };
  const at = (g, x, y, z, ry) => { g.position.set(x, y, z); if (ry) g.rotation.y = ry; return g; };

  // ───────────── glassware and small lab things (each is a Group standing on y = 0 at its own origin) ─────────────
  const beaker = (r, h, liq, fill) => { const g = G(); const wall = new T.Mesh(new T.CylinderGeometry(r, r * 0.96, P(h), 20, 1, true), L.glass); wall.position.y = P(h) / 2; wall.renderOrder = 2; g.add(wall);
    if (liq) { const lh = P(h * (fill || 0.62)), l = cyl(r * 0.93, r * 0.9, lh, liq, 18); l.position.y = lh / 2 + P(0.6); g.add(l); const sf = cyl(r * 0.93, r * 0.93, P(0.5), G_.white, 18); sf.position.y = lh + P(0.8); sf.scale.set(0.9, 1, 0.9); g.add(sf); }
    const rim = new T.Mesh(new T.TorusGeometry(r, 0.012, 6, 20), L.chrome); rim.rotation.x = PI / 2; rim.position.y = P(h); g.add(rim); return g; };
  const erlen = (r, h, liq) => { const g = G(); const nk = P(h * 0.28), body = P(h * 0.72);
    const w = new T.Mesh(new T.CylinderGeometry(r * 0.28, r, body, 20, 1, true), L.glass); w.position.y = body / 2; w.renderOrder = 2; g.add(w);
    const nw = new T.Mesh(new T.CylinderGeometry(r * 0.27, r * 0.27, nk, 14, 1, true), L.glass); nw.position.y = body + nk / 2; nw.renderOrder = 2; g.add(nw);
    const lh = body * 0.55; const l = cyl(r * 0.5, r * 0.94, lh, liq, 18); l.position.y = lh / 2 + P(0.6); g.add(l);
    const rim = new T.Mesh(new T.TorusGeometry(r * 0.27, 0.01, 6, 14), L.chrome); rim.rotation.x = PI / 2; rim.position.y = body + nk; g.add(rim); return g; };
  const flask = (r, liq) => { const g = G(); const s = sphere(r, L.glass, 20); s.position.y = r; s.renderOrder = 2; g.add(s); const l = sphere(r * 0.92, liq, 16); l.scale.set(1, 0.55, 1); l.position.y = r * 0.62; g.add(l);
    const nk = new T.Mesh(new T.CylinderGeometry(r * 0.25, r * 0.28, r * 1.1, 14, 1, true), L.glass); nk.position.y = r * 2 + r * 0.35; nk.renderOrder = 2; g.add(nk); const rim = new T.Mesh(new T.TorusGeometry(r * 0.26, 0.01, 6, 12), L.chrome); rim.rotation.x = PI / 2; rim.position.y = r * 2 + r * 0.9; g.add(rim);
    const ring = new T.Mesh(new T.TorusGeometry(r * 0.52, 0.018, 6, 16), L.steelDk); ring.rotation.x = PI / 2; ring.position.y = P(0.5); ring.scale.set(1, 1, 1); g.add(ring); return g; };
  const bottle = (r, h, glassM, liq, capM) => { const g = G(); const bw = new T.Mesh(new T.CylinderGeometry(r, r, P(h * 0.7), 16, 1, true), glassM); bw.position.y = P(h * 0.35); bw.renderOrder = 2; g.add(bw); const bt = cyl(r * 0.98, r * 0.98, P(h * 0.7 * 0.6), liq, 14); bt.position.y = P(h * 0.35 * 0.6) + P(0.4); g.add(bt);
    const sh = cyl(r * 0.4, r, P(h * 0.14), glassM, 14); sh.position.y = P(h * 0.7 + h * 0.07); sh.renderOrder = 2; g.add(sh); const nk = cyl(r * 0.36, r * 0.4, P(h * 0.12), glassM, 12); nk.position.y = P(h * 0.84 + h * 0.06); nk.renderOrder = 2; g.add(nk);
    const cp = cyl(r * 0.5, r * 0.5, P(h * 0.08), capM || L.dark, 12); cp.position.y = P(h * 0.96); g.add(cp); const lb = cyl(r * 1.01, r * 1.01, P(h * 0.22), L.label, 16); lb.position.y = P(h * 0.28); lb.scale.set(1.0, 1, 1); g.add(lb); return g; };
  // a test-tube rack: a base, a top plate, n tubes of coloured liquid in a row (along x)
  const tubeRack = (n, liqs) => { const g = G(), w = n * 0.085 + 0.1; B(g, [-w / 2, w / 2], [0, 1.6], [-0.09, 0.09], L.tealDk, 0.01); B(g, [-w / 2, w / 2], [8.5, 9.8], [-0.09, 0.09], L.teal, 0.01); B(g, [-w / 2, -w / 2 + 0.03], [0, 9.8], [-0.09, 0.09], L.tealDk, 0.008); B(g, [w / 2 - 0.03, w / 2], [0, 9.8], [-0.09, 0.09], L.tealDk, 0.008);
    for (let i = 0; i < n; i++) { const x = -w / 2 + 0.07 + i * 0.085; const t = new T.Mesh(new T.CylinderGeometry(0.03, 0.03, P(13), 10, 1, true), L.glass); t.position.set(x, P(7.5), 0); t.renderOrder = 2; g.add(t); const hh = P(5 + rnd(i * 3.1 + n) * 5), l = cyl(0.027, 0.024, hh, liqs[i % liqs.length], 8); l.position.set(x, P(1.8) + hh / 2, 0); g.add(l); const cap = cyl(0.032, 0.032, P(1.6), [L.redPaint, L.blueBin, L.amber, L.plastic][i % 4], 8); cap.position.set(x, P(14.4), 0); g.add(cap); }
    return g; };
  const monitor = (w, h, hex) => { const g = G(); Cy(g, 0.07, 0, 1.4, L.graphite, 0, 0, 14); B(g, [-0.02, 0.02], [1.2, 7], [-0.03, 0], L.graphite, 0.005); const sc = G(); sc.position.set(0, P(7 + h * 0.5), 0.0); sc.rotation.x = -0.12; g.add(sc);
    const bz = cbox(w, P(h), 0.035, 0.01, L.graphite); sc.add(bz); const f = new T.Mesh(new T.PlaneGeometry(w * 0.9, P(h) * 0.84), grad('#' + hex[0], '#' + hex[1])); f.position.z = 0.019; sc.add(f);
    for (let i = 0; i < 5; i++) { const ln = new T.Mesh(new T.PlaneGeometry(w * (0.18 + 0.1 * rnd(i + w * 9)), P(0.5)), G_.white); ln.position.set(-w * 0.28 + (i % 2) * w * 0.12, P(h) * (0.28 - i * 0.1), 0.021); sc.add(ln); }
    const wv = tube([[-w * 0.4, 0, 0.022], [-w * 0.25, P(h) * 0.1, 0.022], [-w * 0.1, -P(h) * 0.05, 0.022], [w * 0.05, P(h) * 0.18, 0.022], [w * 0.2, -P(h) * 0.02, 0.022], [w * 0.38, P(h) * 0.08, 0.022]], 0.006, G_.green); wv.position.y = P(h) * 0.2; sc.add(wv); return g; };
  const keyboard = () => { const g = G(); B(g, [-0.2, 0.2], [0, 1.4], [-0.07, 0.07], L.graphite, 0.01); for (let r = 0; r < 3; r++) for (let c = 0; c < 8; c++) B(g, [-0.18 + c * 0.045, -0.15 + c * 0.045], [1.4, 1.9], [-0.055 + r * 0.04, -0.03 + r * 0.04], L.steelDk, 0.004); return g; };
  const microscope = () => { const g = G(); B(g, [-0.19, 0.19], [0, 2.6], [-0.15, 0.15], L.laminate, 0.03); B(g, [-0.17, 0.17], [2.6, 3.0], [-0.13, 0.13], G_.white, 0.01);   // the base and its lamp
    const arm = tube([[0, P(2.6), -0.1], [0, P(12), -0.13], [0, P(21), -0.11], [0, P(26), -0.03]], 0.04, L.laminate); g.add(arm); B(g, [-0.12, 0.12], [9.4, 10.6], [-0.1, 0.12], L.steelDk, 0.01);   // the arm and the stage
    B(g, [-0.07, 0.07], [10.6, 11.0], [-0.05, 0.08], L.glassTint, 0.003);
    const hd = G(); hd.position.set(0, P(24), 0.0); hd.rotation.x = -0.5; g.add(hd); Cy(hd, 0.05, -2, 8, L.graphite, 0, 0, 12); Cy(hd, 0.065, 8, 10.5, L.steel, 0, 0, 12); const ob = cyl(0.045, 0.045, P(5), L.chrome, 10); ob.position.set(0, P(-4), 0.0); hd.add(ob);
    const tur = cyl(0.07, 0.07, P(2.2), L.steelDk, 10); tur.position.set(0, P(15.5), 0.06); g.add(tur); for (let i = 0; i < 3; i++) { const o = cyl(0.022, 0.016, P(5), L.chrome, 8); o.position.set((i - 1) * 0.045, P(12.4), 0.075); g.add(o); }
    Cy(g, 0.03, 12, 15.4, L.steelDk, 0.0, 0.06, 8); const kn = cyl(0.035, 0.035, 0.03, L.dark, 10); kn.rotation.z = PI / 2; kn.position.set(0.19, P(8), -0.1); g.add(kn); return g; };
  const centrifuge = () => { const g = G(); Cy(g, 0.3, 0, 11, L.laminate, 0, 0, 28, 0.32); Cy(g, 0.31, 0, 1.4, L.graphite, 0, 0, 28); const lid = new T.Mesh(new T.SphereGeometry(0.27, 24, 10, 0, TAU, 0, PI / 2), L.smoke); lid.position.y = P(11); lid.scale.y = 0.7; lid.renderOrder = 2; g.add(lid);
    const rot = cyl(0.2, 0.2, P(1.2), L.steelDk, 18); rot.position.y = P(11.6); g.add(rot); for (let i = 0; i < 6; i++) { const a = i * PI / 3; const t = cyl(0.025, 0.025, P(2.4), L.teal, 8); t.position.set(Math.cos(a) * 0.15, P(12.2), Math.sin(a) * 0.15); g.add(t); }
    B(g, [-0.2, 0.08], [3, 8], [0.28, 0.33], L.graphite, 0.006); const sc = new T.Mesh(new T.PlaneGeometry(0.2, P(2.6)), G_.cyan); sc.position.set(-0.06, P(6.5), 0.337); g.add(sc); for (let i = 0; i < 3; i++) S(g, 0.016, [G_.green, G_.amber, G_.red][i], 0.12 + i * 0.045, P(7), 0.332); const kn = cyl(0.04, 0.04, 0.03, L.chrome, 10); kn.rotation.x = PI / 2; kn.position.set(0.19, P(4.8), 0.33); g.add(kn); return g; };
  const sink = () => { const g = G(); B(g, [-0.42, 0.42], [0, 1.6], [-0.3, 0.32], L.steel, 0.02); B(g, [-0.36, 0.36], [1.5, 1.7], [-0.24, 0.26], L.graphite, 0.01); B(g, [-0.34, 0.34], [1.7, 1.9], [-0.22, 0.24], L.steelDk, 0.01); Cy(g, 0.035, 1.7, 1.95, L.chrome, 0.0, 0.0, 10);
    Cy(g, 0.045, 0, 8, L.chrome, 0.0, -0.36, 12); const sw = tube([[0, P(8), -0.36], [0, P(17), -0.36], [0, P(20), -0.3], [0, P(17), -0.14], [0, P(13), -0.12]], 0.022, L.chrome); g.add(sw); const nz = cyl(0.03, 0.026, P(2), L.chrome, 8); nz.position.set(0, P(12), -0.12); g.add(nz);
    for (const sx of [-0.12, 0.12]) { const v = cyl(0.03, 0.03, P(3), sx < 0 ? L.blueBin : L.redPaint, 8); v.position.set(sx, P(5), -0.36); g.add(v); } return g; };
  const gasTap = () => { const g = G(); Cy(g, 0.04, 0, 3, L.steelDk, 0, 0, 10); const n = tube([[0, P(3), 0], [0, P(7), 0], [0.05, P(9), 0.06], [0.07, P(8), 0.12]], 0.018, L.yellow); g.add(n); Cy(g, 0.032, 5.8, 7.2, L.yellow, 0, 0, 10); return g; };
  const tablet = () => { const g = G(); const st = B(g, [-0.2, 0.2], [0, 0.8], [-0.13, 0.13], L.graphite, 0.008); const s = G(); s.position.set(0, P(6), 0); s.rotation.x = -0.55; g.add(s); B(s, [-0.19, 0.19], [-5.8, 5.8], [-0.012, 0.012], L.graphite, 0.006); const f = new T.Mesh(new T.PlaneGeometry(0.34, P(10.6)), grad('#9be8ff', '#2a58c8')); f.position.z = 0.014; s.add(f); rod(g, [0, P(0.8), -0.06], [0, P(5), -0.1], 0.014, L.steelDk, 6); return g; };
  const tipBox = () => { const g = G(); B(g, [-0.16, 0.16], [0, 3.2], [-0.12, 0.12], L.tealLit, 0.012); B(g, [-0.14, 0.14], [3.2, 4.4], [-0.1, 0.1], L.glass, 0.008); for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) { const t = cone_(0.012, P(2.4)); t.position.set(-0.1 + i * 0.065, P(4.9), -0.07 + j * 0.07); g.add(t); } return g; };
  const cone_ = (r, h) => { const m = new T.Mesh(new T.ConeGeometry(r, h, 6), L.plastic); m.rotation.x = PI; return m; };
  const washBottle = () => { const g = G(); Cy(g, 0.075, 0, 9, L.plastic, 0, 0, 14, 0.07); Cy(g, 0.05, 9, 10, L.plastic, 0, 0, 12); const n = tube([[0, P(10), 0], [0.03, P(13), 0], [0.12, P(14), 0.03], [0.17, P(12.5), 0.04]], 0.012, L.plastic); g.add(n); S(g, 0.05, L.yellow, 0, P(10.2), 0); return g; };
  const sharps = () => { const g = G(); Cy(g, 0.1, 0, 7, L.redPaint, 0, 0, 14, 0.09); Cy(g, 0.105, 7, 8.2, L.graphite, 0, 0, 14); const t = new T.Mesh(new T.PlaneGeometry(0.07, P(2.4)), G_.amber); t.position.set(0, P(4), 0.098); g.add(t); return g; };
  const labTop = (par, y, items, k) => { for (const [mk, x, z, ry] of items) { const o = mk(); at(o, x, P(y), z, ry); if (k) o.scale.setScalar(k); par.add(o); } };

  // ───────────── THE BENCH ─────────────
  const bench = (style) => {
    const g = G(), TOP = 36, X0 = -4, X1 = 4, Z1 = 1;
    // kick plate, carcass, doors and drawers on the +z face, the +x end panel
    B(g, [X0 + 0.04, X1 - 0.04], [0, 4], [-Z1 + 0.08, Z1 - 0.08], L.graphite, 0.01);
    B(g, [X0 + 0.02, X1 - 0.02], [4, 33.2], [-Z1 + 0.06, Z1 - 0.1], L.laminateDk, 0.01);
    const kinds = style === 0 ? ['door', 'drawers', 'door', 'door', 'drawers', 'door', 'drawers', 'door'] : ['drawers', 'door', 'door', 'drawers', 'door', 'drawers', 'door', 'door'];
    for (let i = 0; i < 8; i++) {
      const x0 = X0 + i + 0.04, x1 = X0 + i + 0.96, zf = Z1 - 0.1;
      if (kinds[i] === 'door') { B(g, [x0, x1], [4.6, 32.8], [zf, zf + 0.05], L.laminate, 0.012); B(g, [x0 + 0.05, x1 - 0.05], [6.2, 31.2], [zf + 0.045, zf + 0.055], L.laminateDk, 0.004); const h = cyl(0.016, 0.016, P(9), L.chrome, 8); h.position.set(x1 - 0.12, P(18), zf + 0.1); g.add(h); for (const yy of [14, 22]) rod(g, [x1 - 0.12, P(yy), zf + 0.05], [x1 - 0.12, P(yy), zf + 0.1], 0.012, L.chrome, 6); }
      else for (let k = 0; k < 3; k++) { const y0 = 5 + k * 9.4, y1 = y0 + 8.6; B(g, [x0, x1], [y0, y1], [zf, zf + 0.05], L.laminate, 0.012); Ca(g, 'x', 0.016, x0 + 0.26, x1 - 0.26, L.chrome, 0, P((y0 + y1) / 2 + 2.4), zf + 0.1, 8); for (const xx of [x0 + 0.26, x1 - 0.26]) rod(g, [xx, P((y0 + y1) / 2 + 2.4), zf + 0.05], [xx, P((y0 + y1) / 2 + 2.4), zf + 0.1], 0.011, L.chrome, 6); B(g, [x0 + 0.04, x0 + 0.1], [y0 + 1.6, y0 + 3.4], [zf + 0.05, zf + 0.06], i % 2 ? L.tealLit : L.amber, 0.002); }
      if (i % 2 === 0 && kinds[i] === 'door') B(g, [x0 + 0.1, x0 + 0.32], [28, 30], [zf + 0.052, zf + 0.06], i % 4 === 0 ? G_.mint : G_.cyan, 0.002);
    }
    for (let i = 0; i <= 8; i++) B(g, [X0 + i - 0.012, X0 + i + 0.012], [4.4, 33], [Z1 - 0.1, Z1 - 0.04], L.steelDk, 0.003);   // the gaps between the modules
    // the +x end: a panel with a teal band, a label plate and a lit indicator
    B(g, [X1 - 0.06, X1], [3, 34], [-Z1 + 0.08, Z1 - 0.08], L.laminate, 0.012); B(g, [X1 - 0.07, X1 + 0.005], [8, 10.4], [-0.82, 0.82], L.teal, 0.004); B(g, [X1 - 0.07, X1 + 0.005], [20, 28], [-0.5, 0.1], L.graphite, 0.006); B(g, [X1 - 0.08, X1 + 0.01], [22, 26], [-0.42, 0.0], style ? G_.cyan : G_.mint, 0.002); S(g, 0.03, G_.green, X1, P(30), 0.55);
    // the worktop: a white solid surface with a teal edge and a splash lip at the back
    B(g, [X0, X1], [33.2, TOP], [-Z1, Z1], L.top, 0.03); B(g, [X0 + 0.01, X1 - 0.01], [31.8, 33.2], [Z1 - 0.1, Z1 - 0.045], L.teal, 0.01); B(g, [X1 - 0.075, X1 - 0.02], [31.8, 33.2], [-Z1 + 0.06, Z1 - 0.1], L.teal, 0.01); B(g, [X0, X1], [TOP, TOP + 1.2], [-Z1 + 0.02, -Z1 + 0.1], L.top, 0.012);
    // the reagent riser along the back: a shelf on steel posts with a row of bottles, and a teal strip under it
    { const sy = TOP + 14; B(g, [X0 + 0.1, X1 - 0.1], [sy, sy + 1.6], [-Z1 + 0.02, -Z1 + 0.36], L.top, 0.01); B(g, [X0 + 0.1, X1 - 0.1], [sy - 0.8, sy], [-Z1 + 0.34, -Z1 + 0.36], L.teal, 0.004);
      for (const x of [X0 + 0.14, -1.9, 0.1, 2.1, X1 - 0.14]) B(g, [x - 0.03, x + 0.03], [TOP + 1.2, sy], [-Z1 + 0.1, -Z1 + 0.16], L.steel, 0.006);
      const cols = [[L.glassBrown, LQ.amber, L.redPaint], [L.glass, LQ.mint, L.tealDk], [L.glass, LQ.violet, L.dark], [L.glassBrown, LQ.red, L.blueBin], [L.glass, LQ.cyan, L.yellow], [L.glassBrown, LQ.amber, L.dark]];
      for (let i = 0; i < 21; i++) { if ((i + style * 3) % 7 === 4) continue; const c = cols[(i * 5 + style * 2) % cols.length], h = 11 + rnd(i + style * 9) * 6, b = bottle(0.075 + rnd(i + 3) * 0.02, h, c[0], c[1], c[2]); at(b, X0 + 0.45 + i * 0.37, P(sy + 1.6), -Z1 + 0.19); g.add(b); } }
    const slots = []; const T0 = TOP + 0.1;
    if (style === 0) {
      labTop(g, T0, [[sink, -3.5, 0.55, 0], [() => tubeRack(6, [LQ.mint, LQ.amber, LQ.violet]), -2.3, 0.5, 0.1], [microscope, -1.6, -0.4, deg(20)], [() => flask(0.14, LQ.mint), -0.78, 0.55, 0], [() => erlen(0.17, 18, LQ.amber), -0.38, 0.6, 0], [() => beaker(0.14, 14, LQ.cyan), -0.02, 0.5, 0], [centrifuge, 0.5, -0.45, 0], [() => monitor(0.54, 17, ['8fd0ff', '2a58c8']), 1.55, -0.5, 0], [keyboard, 1.5, 0.3, 0], [() => tubeRack(5, [LQ.red, LQ.cyan]), 2.5, 0.55, -0.1], [gasTap, 2.8, -0.82, 0], [washBottle, 3.15, 0.45, 0.4], [() => bottle(0.1, 16, L.glassBrown, LQ.amber, L.redPaint), 2.75, -0.35, 0], [() => bottle(0.09, 14, L.glass, LQ.green, L.blueBin), 3.0, -0.5, 0], [() => bottle(0.11, 18, L.glassBrown, LQ.red, L.dark), 3.3, -0.4, 0], [sharps, 3.6, 0.55, 0], [tipBox, -3.0, -0.6, 0.2]], 1.25);
    } else {
      labTop(g, T0, [[() => monitor(0.54, 17, ['9be8ff', '2a58c8']), -3.4, -0.5, 0], [keyboard, -3.4, 0.28, 0], [centrifuge, -2.5, -0.4, deg(40)], [() => tubeRack(7, [LQ.violet, LQ.mint, LQ.cyan]), -1.5, 0.5, 0], [microscope, -0.5, -0.4, deg(-15)], [sink, 0.7, 0.55, 0], [() => flask(0.15, LQ.violet), 1.55, 0.52, 0], [() => flask(0.11, LQ.cyan), 1.9, 0.6, 0], [() => erlen(0.15, 16, LQ.mint), 2.25, 0.5, 0], [() => beaker(0.16, 15, LQ.amber, 0.5), 2.6, 0.55, 0], [tablet, 2.3, -0.45, 0.2], [() => bottle(0.1, 17, L.glassBrown, LQ.amber, L.redPaint), 3.0, -0.45, 0], [() => bottle(0.1, 15, L.glass, LQ.blue, L.tealDk), 3.25, -0.38, 0], [() => bottle(0.1, 16, L.glass, LQ.violet, L.dark), 3.5, -0.46, 0], [gasTap, -2.0, -0.82, 0], [washBottle, 3.4, 0.5, -0.5], [tipBox, -0.4, 0.55, 0], [sharps, 3.7, 0.55, 0]], 1.25);
    }
    return { g };
  };

  // ───────────── THE FUME HOOD (3 x 2, front +z) ─────────────
  const hood = () => {
    const g = G(), X = 1.46, Z = 0.96;
    B(g, [-X, X], [0, 4], [-Z + 0.08, Z - 0.1], L.graphite, 0.01); B(g, [-X, X], [4, 33], [-Z + 0.04, Z - 0.1], L.laminateDk, 0.012);
    for (let i = 0; i < 3; i++) { const x0 = -X + i * (2 * X / 3) + 0.05, x1 = -X + (i + 1) * (2 * X / 3) - 0.05, zf = Z - 0.1; B(g, [x0, x1], [4.6, 32.6], [zf, zf + 0.05], L.laminate, 0.012); B(g, [x0 + 0.06, x1 - 0.06], [6.4, 30.8], [zf + 0.045, zf + 0.056], L.laminateDk, 0.004); Ca(g, 'z', 0.016, 0, 0, L.chrome, 0, 0, 0, 6).visible = false; const h = cyl(0.016, 0.016, P(9), L.chrome, 8); h.position.set(x1 - 0.14, P(18), zf + 0.1); g.add(h); if (i === 1) { B(g, [x0 + 0.1, x0 + 0.4], [26, 28], [zf + 0.052, zf + 0.06], G_.amber, 0.002); } }
    // the worktop (steel, a raised spill lip) and the enclosure: a back, two side walls with windows, a header
    B(g, [-X, X], [33, 35], [-Z, Z], L.top, 0.02); B(g, [-X + 0.04, X - 0.04], [34.6, 35.2], [-Z + 0.1, Z - 0.12], G_.white, 0.004); B(g, [-X + 0.04, X - 0.04], [35, 36.2], [Z - 0.1, Z - 0.04], L.steelDk, 0.008);
    const EY0 = 35, EY1 = 78, ZB = -Z + 0.06, ZF = Z - 0.06;
    B(g, [-X, X], [EY0, EY1], [ZB - 0.02, ZB + 0.08], L.laminate, 0.012);                       // the back panel
    B(g, [-X, -X + 0.1], [EY0, EY1], [ZB, ZF], L.laminate, 0.012);                              // the west post
    // the east side: a frame round a big window
    B(g, [X - 0.1, X], [EY0, EY0 + 5], [ZB, ZF], L.laminate, 0.01); B(g, [X - 0.1, X], [EY1 - 6, EY1], [ZB, ZF], L.laminate, 0.01); B(g, [X - 0.1, X], [EY0, EY1], [ZB, ZB + 0.1], L.laminate, 0.01); B(g, [X - 0.1, X], [EY0, EY1], [ZF - 0.1, ZF], L.laminate, 0.01);
    const sw = new T.Mesh(new T.PlaneGeometry(ZF - ZB - 0.2, P(EY1 - EY0 - 11)), L.glass); sw.rotation.y = PI / 2; sw.position.set(X - 0.04, P((EY0 + EY1) / 2 - 0.5), (ZB + ZF) / 2); sw.renderOrder = 3; g.add(sw);
    for (const [dz, w] of [[0.18, 0.1], [0.42, 0.04]]) { const hl = new T.Mesh(new T.PlaneGeometry(w, P(EY1 - EY0 - 16)), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22, depthWrite: false, toneMapped: false })); hl.rotation.y = PI / 2; hl.position.set(X - 0.035, P((EY0 + EY1) / 2), ZB + 0.1 + dz); hl.rotation.z = 0.35; hl.renderOrder = 4; g.add(hl); }
    // the interior: a lit back, a white ceiling light, a hotplate, a retort stand with a flask, glassware
    const bk = new T.Mesh(new T.PlaneGeometry(2 * X - 0.3, P(EY1 - EY0 - 10)), grad('#e8fbff', '#7ac8d4')); bk.position.set(0, P((EY0 + EY1) / 2 - 1), ZB + 0.085); g.add(bk);
    B(g, [-X + 0.14, X - 0.14], [EY1 - 9, EY1 - 7], [ZB + 0.1, ZF - 0.1], G_.white, 0.01);
    B(g, [-1.1, -0.45], [36.2, 40.6], [-0.3, 0.3], L.graphite, 0.02); B(g, [-1.05, -0.5], [40.6, 41.4], [-0.25, 0.25], L.steel, 0.01); S(g, 0.04, G_.red, -0.9, P(38.6), 0.31);
    { const f = flask(0.2, LQ.mint); at(f, -0.78, P(41.4), 0, 0); g.add(f); }
    Cy(g, 0.02, 36.2, 66, L.steel, 0.25, -0.45, 8); B(g, [-0.9, 0.3], [64, 65.2], [-0.47, -0.43], L.steelDk, 0.004); Ca(g, 'x', 0.016, -0.2, 0.25, L.steel, 0, P(58), -0.45, 6); const cl = new T.Mesh(new T.TorusGeometry(0.17, 0.014, 6, 16), L.steel); cl.rotation.x = PI / 2; cl.position.set(-0.7, P(52), -0.2); g.add(cl);
    { const b = beaker(0.2, 18, LQ.violet, 0.5); at(b, 0.05, P(36.2), 0.1); g.add(b); } { const b = erlen(0.18, 22, LQ.amber); at(b, 0.55, P(36.2), 0.15); g.add(b); } { const b = beaker(0.12, 12, LQ.cyan, 0.7); at(b, 0.95, P(36.2), -0.1); g.add(b); }
    { const t = tubeRack(4, [LQ.red, LQ.mint]); at(t, 0.9, P(36.2), 0.4, 0.2); g.add(t); }
    // the sash: a glass pane in a steel frame raised a little, with a handle bar, over the front
    const sy0 = EY0 + 1, sy1 = EY1 - 1, sh = P(sy1 - sy0) - 0.0;
    B(g, [-X + 0.06, X - 0.06], [sy0 + 2, sy0 + 4], [ZF, ZF + 0.05], L.steelDk, 0.006); B(g, [-X + 0.06, X - 0.06], [sy1 - 9, sy1 - 7], [ZF, ZF + 0.05], L.steelDk, 0.006); B(g, [-X + 0.06, -X + 0.14], [sy0 + 2, sy1 - 7], [ZF, ZF + 0.05], L.steelDk, 0.006); B(g, [X - 0.14, X - 0.06], [sy0 + 2, sy1 - 7], [ZF, ZF + 0.05], L.steelDk, 0.006);
    const gl = new T.Mesh(new T.PlaneGeometry(2 * X - 0.2, P(sy1 - sy0 - 11)), L.glassTint); gl.position.set(0, P((sy0 + 4 + sy1 - 9) / 2), ZF + 0.025); gl.renderOrder = 3; g.add(gl);
    for (const [dx, w, rot] of [[-1.5 * 0.4, 0.16, 0.3], [-0.2, 0.05, 0.3], [0.9, 0.1, 0.3]]) { const hl = new T.Mesh(new T.PlaneGeometry(w, P(sy1 - sy0 - 20)), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, depthWrite: false, toneMapped: false })); hl.position.set(dx, P((sy0 + sy1) / 2 - 3), ZF + 0.03); hl.rotation.z = rot; hl.renderOrder = 4; g.add(hl); }
    Ca(g, 'x', 0.022, -0.7, 0.7, L.chrome, 0, P(sy0 + 6), ZF + 0.12, 10); for (const xx of [-0.65, 0.65]) rod(g, [xx, P(sy0 + 6), ZF + 0.05], [xx, P(sy0 + 6), ZF + 0.12], 0.014, L.chrome, 6);
    // the header: a control panel with a display, lamps and a dial, under a canopy that narrows to a round duct
    B(g, [-X, X], [EY1, EY1 + 11], [ZB - 0.02, ZF + 0.02], L.laminate, 0.014); B(g, [-X + 0.08, X - 0.08], [EY1 + 1.6, EY1 + 9.4], [ZF + 0.02, ZF + 0.05], L.graphite, 0.008);
    { const sc = new T.Mesh(new T.PlaneGeometry(0.62, P(4.6)), grad('#a8fff0', '#1a8a78')); sc.position.set(-0.7, P(EY1 + 5.6), ZF + 0.056); g.add(sc); for (let i = 0; i < 4; i++) { const b = new T.Mesh(new T.PlaneGeometry(0.05, P(1.2 + rnd(i + 4) * 2.8)), G_.white); b.position.set(-0.9 + i * 0.12, P(EY1 + 4.2 + 0.6 * i * 0), ZF + 0.058); b.geometry.translate(0, P(0.6 + rnd(i + 4) * 1.4) - P(1), 0); g.add(b); } }
    for (let i = 0; i < 4; i++) S(g, 0.04, [G_.green, G_.green, G_.amber, G_.red][i], -0.05 + i * 0.13, P(EY1 + 7.4), ZF + 0.06); { const d = cyl(0.1, 0.1, 0.04, L.chrome, 16); d.rotation.x = PI / 2; d.position.set(0.7, P(EY1 + 5.5), ZF + 0.06); g.add(d); const n = cyl(0.012, 0.012, 0.045, G_.cyan, 6); n.rotation.x = PI / 2; n.position.set(0.7, P(EY1 + 6.1), ZF + 0.075); g.add(n); }
    for (const sx of [1.08, 1.28]) { const sl = new T.Mesh(new T.PlaneGeometry(0.1, P(5)), G_.mint); sl.position.set(sx, P(EY1 + 5.5), ZF + 0.056); g.add(sl); }
    // the canopy and the duct
    const cp = new T.Mesh(new T.CylinderGeometry(0.24, 1.0, P(18), 4, 1), L.laminateDk); cp.rotation.y = PI / 4; cp.scale.set(2.04, 1, 1.33); cp.position.set(0, P(EY1 + 11 + 9), 0); g.add(cp); B(g, [-X + 0.02, X - 0.02], [EY1 + 11, EY1 + 12.4], [ZB - 0.0, ZF + 0.0], L.teal, 0.006);
    const duct = cyl(0.27, 0.27, P(34), L.steel, 24); duct.position.set(0, P(EY1 + 29 + 17), 0); g.add(duct); for (const yy of [EY1 + 32, EY1 + 46]) { const fl = cyl(0.33, 0.33, P(2.2), L.steelDk, 24); fl.position.set(0, P(yy), 0); g.add(fl); for (let i = 0; i < 12; i++) { const a = i * PI / 6, b = cyl(0.014, 0.014, P(2.8), L.chrome, 6); b.position.set(Math.cos(a) * 0.3, P(yy), Math.sin(a) * 0.3); g.add(b); } }
    { const damp = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, 0.62, 8), L.chrome); damp.rotation.z = PI / 2; damp.position.set(0, P(EY1 + 39), 0); g.add(damp); const lv = cbox(0.04, 0.2, 0.025, 0.004, L.redPaint); lv.position.set(0.3, P(EY1 + 39), 0.3); g.add(lv); }
    { const cw = new T.Mesh(new T.ConeGeometry(0.36, P(8), 24), L.steelDk); cw.position.set(0, P(EY1 + 63 + 4), 0); g.add(cw); const cr2 = cyl(0.3, 0.3, P(1.4), L.steel, 24); cr2.position.set(0, P(EY1 + 63), 0); g.add(cr2); }
    // the base: a hazard strip along the foot and a label
    B(g, [-X + 0.2, X - 0.2], [0.4, 3], [Z - 0.095, Z - 0.05], MT.amber, 0.004);
    return { g };
  };

  // ───────────── THE TEST CHAMBERS (round) ─────────────
  const chamber = (R, liq, hot, spec, accent) => {
    const g = G(), gR = R - 0.14, y0 = 11, y1 = 86;
    // the base: a dark steel drum with a lit band of status lights, anchor bolts, pipes towards the front
    Cy(g, R - 0.02, 0, 3.4, L.graphite, 0, 0, 40, R); Cy(g, R - 0.06, 3.4, 10, L.steelDk, 0, 0, 40, R - 0.03); Cy(g, R - 0.04, 10, 11.6, L.steel, 0, 0, 40);
    for (let i = 0; i < 18; i++) { const a = i * TAU / 18 + 0.1, b = cyl(0.026, 0.026, P(1.2), L.chrome, 6); b.position.set(Math.cos(a) * (R - 0.1), P(11.9), Math.sin(a) * (R - 0.1)); g.add(b); }
    for (let i = 0; i < 12; i++) { const a = deg(-30 + i * 14); const l = S(g, 0.026, [G_.cyan, accent, G_.green, G_.amber][i % 4], Math.cos(a) * (R - 0.03), P(7), Math.sin(a) * (R - 0.03)); l.scale.set(1, 0.9, 1); }
    { const a = deg(40); const px_ = Math.cos(a) * (R + 0.02), pz = Math.sin(a) * (R + 0.02); const pp = tube([[px_ * 0.9, P(5), pz * 0.9], [px_ * 1.2, P(5), pz * 1.2], [px_ * 1.3, P(3), pz * 1.3 + 0.1], [px_ * 1.3 + 0.1, P(1.4), pz * 1.3 + 0.25]], 0.032, L.steel); g.add(pp); S(g, 0.06, L.steelDk, px_ * 1.3, P(3), pz * 1.3 + 0.1); }
    // the liquid (a lit gradient), its bright surface, a column of bubbles and a floating specimen
    const lq = y0 + (y1 - y0) * 0.84, li = new T.Mesh(new T.CylinderGeometry(gR - 0.02, gR - 0.02, P(lq - y0), 40, 1, true), liq); li.position.y = P((y0 + lq) / 2); g.add(li);
    const bt = cyl(gR - 0.02, gR - 0.02, P(0.6), liq, 40); bt.position.y = P(y0 + 0.3); g.add(bt); const sf = cyl(gR - 0.02, gR - 0.02, P(1.2), hot, 40); sf.position.y = P(lq); g.add(sf);
    for (let i = 0; i < 30; i++) { const a = rnd(i) * TAU, rr = Math.sqrt(rnd(i + 31)) * (gR - 0.1), bb = sphere(0.014 + rnd(i + 70) * 0.028, hot, 6); bb.position.set(Math.cos(a) * rr, P(y0 + 8 + (lq - y0 - 12) * rnd(i + 99)), Math.sin(a) * rr); g.add(bb); }
    const sp = G(); sp.position.set(0.02, P(y0 + (lq - y0) * 0.52), 0); g.add(sp);
    if (spec === 'embryo') { S(sp, 0.2, std('#ffe0f0', 0, 0.4, { emissive: col('#ff9ad0'), emissiveIntensity: 0.55 }), 0, 0, 0, 1.1); S(sp, 0.12, std('#ffc8e4', 0, 0.4, { emissive: col('#ff7ac8'), emissiveIntensity: 0.6 }), 0.1, P(-5), 0.06); const cord = tube([[0.1, P(-6), 0.05], [0.14, P(-14), 0.1], [0.05, P(-22), 0.0], [0.0, P(-30), 0.04]], 0.014, std('#ffc8e4', 0, 0.5)); sp.add(cord); }
    else { for (let i = 0; i < 5; i++) { const c = cyl(0, 0.07 + i * 0.012, P(11 + i * 2), std('#e8c8ff', 0.1, 0.25, { emissive: col('#a64dff'), emissiveIntensity: 0.9 }), 5); c.position.set((i - 2) * 0.1, P(i % 2 ? 3 : -2), (i % 3 - 1) * 0.08); c.rotation.z = (i - 2) * 0.22; c.rotation.x = (i % 2 - 0.5) * 0.4; sp.add(c); } S(sp, 0.1, G_.white, 0, 0, 0); }
    // the glass, its rim lines and highlights, four support rods and the cap with its tubes
    const gl = new T.Mesh(new T.CylinderGeometry(gR, gR, P(y1 - y0), 40, 1, true), L.glass); gl.position.y = P((y0 + y1) / 2); gl.renderOrder = 3; g.add(gl);
    for (const yy of [y0 + 0.5, y1 - 0.5]) { const r = new T.Mesh(new T.TorusGeometry(gR, 0.02, 6, 40), hot); r.rotation.x = PI / 2; r.position.y = P(yy); g.add(r); }
    for (const [th, w, op] of [[deg(40), 0.07, 0.42], [deg(58), 0.03, 0.4], [deg(-12), 0.04, 0.3]]) { const hl = new T.Mesh(new T.PlaneGeometry(w, P(y1 - y0 - 8)), new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: op, depthWrite: false, toneMapped: false })); const w2 = G(); w2.rotation.y = -th; hl.position.set(gR + 0.006, P((y0 + y1) / 2), 0); hl.rotation.y = PI / 2; w2.add(hl); hl.renderOrder = 4; g.add(w2); }
    for (let i = 0; i < 4; i++) { const th = deg(45 + i * 90), x = Math.cos(th) * (R - 0.06), z = Math.sin(th) * (R - 0.06); const r = cyl(0.026, 0.026, P(y1 - y0 + 4), L.steel, 8); r.position.set(x, P((y0 + y1 + 4) / 2), z); g.add(r); }
    Cy(g, R - 0.03, y1, y1 + 4, L.steel, 0, 0, 40, R - 0.05); Cy(g, R - 0.12, y1 + 4, y1 + 8, L.chrome, 0, 0, 40, R - 0.2); for (let k = 0; k < 8; k++) { const a = k * PI / 4; rod(g, [Math.cos(a) * 0.12, P(y1 + 8.2), Math.sin(a) * 0.12], [Math.cos(a) * (R - 0.22), P(y1 + 8.2), Math.sin(a) * (R - 0.22)], 0.012, L.steelDk, 6); } const cr = new T.Mesh(new T.TorusGeometry(R - 0.04, 0.02, 6, 40), L.chrome); cr.rotation.x = PI / 2; cr.position.y = P(y1 + 2); g.add(cr);
    for (const [th, hh] of [[deg(35), 14], [deg(150), 9], [deg(-60), 11]]) { const x = Math.cos(th) * (R * 0.5), z = Math.sin(th) * (R * 0.5); rod(g, [x, P(y1 + 8), z], [x, P(y1 + 8 + hh), z], 0.04, L.steel, 10); const el = S(g, 0.055, L.steel, x, P(y1 + 8 + hh), z); }
    { const tt = tube([[Math.cos(deg(35)) * R * 0.5, P(y1 + 22), Math.sin(deg(35)) * R * 0.5], [R * 0.7, P(y1 + 26), R * 0.4], [R * 0.9, P(y1 + 16), R * 0.7], [R * 0.95, P(y1 - 4), R * 0.7]], 0.024, L.rubber); g.add(tt); }
    { const a = deg(62), x = Math.cos(a) * (R * 0.55), z = Math.sin(a) * (R * 0.55); const d = cyl(0.11, 0.11, 0.05, L.chrome, 20); d.position.set(x, P(y1 + 12), z); d.rotation.x = PI / 2 - 0.6; g.add(d); const f = cyl(0.085, 0.085, 0.052, grad('#ffffff', '#c8d8e0'), 20); f.position.copy(d.position); f.rotation.copy(d.rotation); f.position.y += 0.002; g.add(f); }
    S(g, 0.04, accent, 0, P(y1 + 8.4), 0);
    return { g, marks: { top: [0, P(y1 + 8), 0] } };
  };

  // ───────────── CARTS ─────────────
  const cart = (W, items) => {
    const g = G(), hw = W / 2 - 0.05, hz = 0.38, ys = [7, 21, 35];
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { Cy(g, 0.03, 5, 36, L.steel, sx * (hw - 0.03), sz * (hz - 0.03), 10); const fk = G(); fk.position.set(sx * (hw - 0.03), P(5), sz * (hz - 0.03)); g.add(fk); Cy(fk, 0.03, -2.4, 0, L.steelDk, 0, 0, 10); const wh = cyl(0.055, 0.055, 0.05, L.rubber, 14); wh.rotation.z = PI / 2; wh.position.y = P(-3.6); fk.add(wh); const hub = cyl(0.03, 0.03, 0.056, L.chrome, 8); hub.rotation.z = PI / 2; hub.position.y = P(-3.6); fk.add(hub); }
    for (const y of [ys[0], ys[1], ys[2]]) { B(g, [-hw, hw], [y, y + 1.4], [-hz, hz], L.steel, 0.012); B(g, [-hw, hw], [y + 1.4, y + 3.2], [hz - 0.03, hz], L.steel, 0.008); B(g, [-hw, hw], [y + 1.4, y + 3.2], [-hz, -hz + 0.03], L.steel, 0.008); B(g, [hw - 0.03, hw], [y + 1.4, y + 3.2], [-hz, hz], L.steel, 0.008); B(g, [-hw, -hw + 0.03], [y + 1.4, y + 3.2], [-hz, hz], L.steel, 0.008); }
    const hd = tube([[-hw - 0.02, P(35), -hz + 0.05], [-hw - 0.2, P(44), -hz + 0.05], [-hw - 0.2, P(44), hz - 0.05], [-hw - 0.02, P(35), hz - 0.05]], 0.022, L.chrome); g.add(hd); Ca(g, 'z', 0.026, -hz + 0.05, hz - 0.05, L.rubber, -hw - 0.2, P(44), 0, 10);
    B(g, [-hw + 0.04, -hw + 0.12], [35, 39], [hz - 0.01, hz + 0.01], G_.cyan, 0.002); B(g, [hw - 0.02, hw + 0.01], [7, 9.5], [-hz + 0.04, hz - 0.04], L.amber, 0.003);
    items(g, hw, hz, ys); return { g };
  };
  const labItems = (g, hw, hz, ys) => {
    const lap = G(); B(lap, [-0.17, 0.17], [0, 1.4], [-0.12, 0.12], L.graphite, 0.01); const sc = G(); sc.position.set(0, P(1.4), -0.11); sc.rotation.x = -0.35; lap.add(sc); B(sc, [-0.17, 0.17], [0, 11], [-0.01, 0.01], L.graphite, 0.006); const f = new T.Mesh(new T.PlaneGeometry(0.3, P(9.6)), grad('#9be8ff', '#2a58c8')); f.position.set(0, P(5.5), 0.013); sc.add(f); at(lap, -0.15, P(ys[2] + 3.2), 0.0, 0.1); g.add(lap);
    const bin = G(); B(bin, [-0.17, 0.17], [0, 9], [-0.12, 0.12], L.blueBin, 0.02); B(bin, [-0.18, 0.18], [9, 10.2], [-0.13, 0.13], L.blueBin, 0.01); B(bin, [-0.1, 0.1], [3.5, 6.5], [0.12, 0.13], L.label, 0.002); at(bin, 0.36, P(ys[2] + 3.2), 0.0); g.add(bin);
    for (let i = 0; i < 3; i++) { const t = tubeRack(5, [[LQ.mint, LQ.amber, LQ.red][i], LQ.violet]); at(t, -0.2 + i * 0.0, P(ys[1] + 3.2), -0.15 + i * 0.15, 0); if (i === 0) g.add(t); }
    const bx = G(); B(bx, [-0.16, 0.16], [0, 7], [-0.12, 0.12], L.plastic, 0.015); B(bx, [-0.16, 0.16], [7, 8], [-0.12, 0.12], L.laminateDk, 0.01); B(bx, [-0.05, 0.05], [2, 5], [0.12, 0.13], L.redPaint, 0.002); at(bx, 0.3, P(ys[1] + 3.2), 0.0, 0.2); g.add(bx);
    { const sp = G(); B(sp, [-0.14, 0.14], [0, 4.5], [-0.1, 0.1], L.graphite, 0.01); const sc2 = new T.Mesh(new T.PlaneGeometry(0.16, P(2.4)), grad('#a8fff0', '#1a8a78')); sc2.position.set(-0.04, P(2.6), 0.102); sp.add(sc2); Cy(sp, 0.03, 4.5, 5.5, L.chrome, 0.08, 0.0, 8); at(sp, -0.35, P(ys[1] + 3.2), 0.1); g.add(sp); }
    for (let i = 0; i < 3; i++) { const f = flask(0.09, [LQ.cyan, LQ.amber, LQ.green][i]); at(f, -0.15 + i * 0.18, P(ys[0] + 3.2), 0.1); g.add(f); } B(g, [0.15, 0.4], [ys[0] + 3.2, ys[0] + 10], [-0.2, 0.2], L.oliveDk, 0.012); B(g, [0.15, 0.4], [ys[0] + 10, ys[0] + 11], [-0.19, 0.19], L.olive, 0.01);
  };
  const armoryItems = (g, hw, hz, ys) => {
    const ammo = (x, y, z, c, ry) => { const b = G(); B(b, [-0.2, 0.2], [0, 7.5], [-0.12, 0.12], c, 0.014); B(b, [-0.21, 0.21], [7.5, 8.6], [-0.13, 0.13], c === L.olive ? L.oliveDk : L.dark, 0.01); for (const sx of [-0.12, 0.12]) B(b, [sx - 0.02, sx + 0.02], [2.5, 6.5], [0.12, 0.14], L.chrome, 0.003); const h = tube([[-0.07, P(8.6), 0], [-0.07, P(10.4), 0], [0.07, P(10.4), 0], [0.07, P(8.6), 0]], 0.012, L.steelDk); b.add(h); B(b, [-0.12, 0.12], [3.4, 4.8], [0.125, 0.14], L.yellow, 0.002); at(b, x, P(y), z, ry); g.add(b); };
    ammo(-0.6, ys[2] + 3.2, 0.0, L.olive, 0); ammo(-0.12, ys[2] + 3.2, 0.05, L.olive, 0.1); ammo(0.4, ys[2] + 3.2, -0.05, L.oliveDk, -0.08); ammo(0.9, ys[2] + 3.2, 0.0, L.olive, 0.05); ammo(0.2, ys[2] + 11.9, 0.0, L.oliveDk, 0.2);
    const crate = (x, z, ry) => { const b = G(); B(b, [-0.3, 0.3], [0, 12], [-0.2, 0.2], L.woodLt, 0.012); for (const yy of [2, 6.5, 10]) B(b, [-0.305, 0.305], [yy, yy + 1.2], [-0.205, 0.205], L.woodDk, 0.004); B(b, [-0.2, 0.2], [4, 8], [0.2, 0.208], L.label, 0.002); at(b, x, P(ys[1] + 3.2), z, ry); g.add(b); }; crate(-0.55, 0.05, 0.05); crate(0.2, 0.0, -0.05);
    { const coil = new T.Mesh(new T.TorusGeometry(0.14, 0.04, 8, 20), L.yellow); coil.rotation.x = PI / 2; coil.position.set(0.8, P(ys[1] + 3.2) + 0.04, 0.0); g.add(coil); const c2 = new T.Mesh(new T.TorusGeometry(0.14, 0.04, 8, 20), L.yellow); c2.rotation.x = PI / 2; c2.position.set(0.8, P(ys[1] + 3.2) + 0.1, 0.0); g.add(c2); }
    ammo(-0.7, ys[0] + 3.2, 0.0, L.oliveDk, 0.04); ammo(-0.2, ys[0] + 3.2, 0.0, L.olive, -0.04); { const r = G(); B(r, [-0.22, 0.22], [0, 1.4], [-0.1, 0.1], L.oliveDk, 0.008); const tl = cyl(0.04, 0.04, 0.4, L.steel, 10); tl.rotation.z = PI / 2; tl.position.set(0, P(2.6), 0); r.add(tl); at(r, 0.7, P(ys[0] + 3.2), 0.0); g.add(r); }
  };

  // ───────────── GENERATORS (built with the front on +z and the length along x; the 1x2 is turned to face +x) ─────────────
  const genset = (len, dep, big) => {
    const g = G(), hl = len / 2, hd = dep / 2;
    // the skid: two steel I-beams and a hazard strip, a drip tray
    B(g, [-hl, hl], [0, 3], [-hd, hd], L.graphite, 0.015); B(g, [-hl + 0.04, hl - 0.04], [0.4, 2.4], [hd - 0.012, hd + 0.01], MT.amber, 0.004); B(g, [-hl, hl], [3, 4], [-hd, hd], L.steelDk, 0.012);
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) Cy(g, 0.04, 0, 1.2, L.rubber, sx * (hl - 0.15), sz * (hd - 0.1), 8);
    // the engine housing: a sound-proofed box with bevelled corners, louvred doors on the front, side vents
    const hh = big ? 52 : 46, bx0 = -hl + 0.06, bx1 = hl - 0.06;
    B(g, [bx0, bx1], [4, 4 + hh], [-hd + 0.06, hd - 0.05], L.tealDk, 0.04); B(g, [bx0 - 0.01, bx1 + 0.01], [4 + hh - 3, 4 + hh], [-hd + 0.05, hd - 0.04], L.teal, 0.03);
    const nd = big ? 3 : 2, dw = (bx1 - bx0 - 0.5) / nd; for (let i = 0; i < nd; i++) { const x0 = bx0 + 0.3 + i * dw + 0.03, x1 = x0 + dw - 0.06; B(g, [x0, x1], [8, 4 + hh - 6], [hd - 0.05, hd - 0.01], L.teal, 0.012); const nl = 9; for (let k = 0; k < nl; k++) B(g, [x0 + 0.04, x1 - 0.04], [10 + k * ((hh - 18) / nl), 10.8 + k * ((hh - 18) / nl)], [hd - 0.012, hd + 0.01], L.graphite, 0.003); const h = cyl(0.014, 0.014, P(7), L.chrome, 8); h.position.set(x1 - 0.06, P(4 + hh / 2), hd + 0.04); g.add(h); }
    B(g, [bx0, bx0 + 0.28], [8, 4 + hh - 3], [hd - 0.05, hd - 0.01], L.graphite, 0.008); B(g, [bx1 - 0.2, bx1], [8, 4 + hh - 3], [hd - 0.05, hd - 0.01], L.graphite, 0.008);
    // the +x end: a radiator / intake grille with a fan ring and an access panel
    const ex = bx1 + 0.005; B(g, [bx1 - 0.01, bx1 + 0.04], [8, 4 + hh - 7], [-hd + 0.16, hd - 0.16], L.graphite, 0.01); for (let k = 0; k < 12; k++) B(g, [bx1 + 0.03, bx1 + 0.05], [9.5 + k * ((hh - 20) / 12), 10.3 + k * ((hh - 20) / 12)], [-hd + 0.2, hd - 0.2], L.steel, 0.003);
    { const fr = new T.Mesh(new T.TorusGeometry(Math.min(0.3, hd - 0.22), 0.016, 6, 24), L.chrome); fr.rotation.y = PI / 2; fr.position.set(bx1 + 0.055, P(4 + hh / 2 - 1), 0); g.add(fr); }
    // the control panel on the front: a dark panel with gauges, lamps, a display and a big red stop button
    const cx = hl - 0.55, cz = hd + 0.01; B(g, [cx - 0.42, cx + 0.42], [4 + hh - 30, 4 + hh - 4], [hd - 0.02, hd + 0.04], L.graphite, 0.012);
    for (let i = 0; i < 2; i++) { const gx = cx - 0.22 + i * 0.3, gy = P(4 + hh - 20); const rim = cyl(0.1, 0.1, 0.05, L.chrome, 22); rim.rotation.x = PI / 2; rim.position.set(gx, gy, cz + 0.04); g.add(rim); const fc = cyl(0.085, 0.085, 0.052, grad('#ffffff', '#d8e4ea'), 22); fc.rotation.x = PI / 2; fc.position.set(gx, gy, cz + 0.044); g.add(fc); const nd2 = cbox(0.012, 0.075, 0.01, 0.002, G_.red); nd2.position.set(gx, gy + 0.02, cz + 0.072); nd2.rotation.z = -0.7 + i * 0.9; g.add(nd2); }
    { const sc = new T.Mesh(new T.PlaneGeometry(0.3, P(4)), grad('#a8fff0', '#1a8a78')); sc.position.set(cx - 0.2, P(4 + hh - 9), cz + 0.042); g.add(sc); for (let i = 0; i < 4; i++) S(g, 0.022, [G_.green, G_.green, G_.amber, G_.red][i], cx + 0.04 + i * 0.07, P(4 + hh - 9), cz + 0.044); const st = cyl(0.05, 0.05, 0.04, L.redPaint, 14); st.rotation.x = PI / 2; st.position.set(cx + 0.31, P(4 + hh - 9), cz + 0.055); g.add(st); }
    // exhaust stack(s) with a rain cap, a silencer drum, a fuel filler cap, a warning plate
    const sxp = -hl + 0.5, sh = big ? 62 : 54; Cy(g, 0.07, 4 + hh, 4 + hh + sh, L.steelDk, sxp, -hd * 0.3, 14); Cy(g, 0.12, 4 + hh + 4, 4 + hh + 22, L.steel, sxp, -hd * 0.3, 18); const cap = cyl(0.01, 0.12, P(4), L.steelDk, 14); cap.position.set(sxp, P(4 + hh + sh + 2), -hd * 0.3); g.add(cap); const lid = cyl(0.12, 0.12, P(0.8), L.steelDk, 14); lid.position.set(sxp, P(4 + hh + sh + 5), -hd * 0.3); g.add(lid);
    for (const yy of [4 + hh + 3, 4 + hh + 28]) Cy(g, 0.09, yy, yy + 1.6, L.steelDk, sxp, -hd * 0.3, 14);
    Cy(g, 0.09, 4 + hh, 4 + hh + 3, L.chrome, 0.1, hd * 0.45, 12); B(g, [0.3, 0.62], [4 + hh, 4 + hh + 1.2], [hd * 0.2, hd * 0.6], MT.amber, 0.006);
    B(g, [-hl + 0.12, -hl + 0.6], [4 + hh - 20, 4 + hh - 13], [hd - 0.04, hd + 0.01], MT.amber, 0.004); for (let i = 0; i < 3; i++) B(g, [-hl + 0.18 + i * 0.12, -hl + 0.24 + i * 0.12], [4 + hh - 19, 4 + hh - 14], [hd - 0.01, hd + 0.012], L.graphite, 0.002);
    // cables: a thick black one from the panel looping down to the floor with a plug, a coiled lead on the +x end
    { const cb = tube([[cx + 0.3, P(4 + hh - 28), hd + 0.02], [cx + 0.38, P(14), hd + 0.12], [cx + 0.2, P(3), hd + 0.3], [cx - 0.1, P(0.8), hd + 0.34]], 0.032, L.rubber); g.add(cb); const pl = cbox(0.1, P(2.6), 0.09, 0.01, L.yellow); pl.position.set(cx - 0.18, P(1.4), hd + 0.34); g.add(pl); }
    { const cb = tube([[bx1 + 0.02, P(10), -0.1], [bx1 + 0.16, P(6), 0.0], [bx1 + 0.18, P(1.2), 0.2], [bx1 + 0.08, P(0.8), 0.4]], 0.026, L.rubber); g.add(cb); }
    return g;
  };
  const gen1x2 = () => { const w = G(), g = genset(1.9, 0.9, true); w.add(g); w.rotation.y = PI / 2; return { g: w }; };
  const gen1x1 = () => { const w = G(), g = genset(0.92, 0.84, false); w.add(g); return { g: w }; };

  // ───────────── THE TOOLBOX ─────────────
  const toolbox = () => {
    const g = G(), hw = 0.42, hz = 0.28;
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const f = G(); f.position.set(sx * (hw - 0.07), 0, sz * (hz - 0.06)); g.add(f); Cy(f, 0.025, 3.6, 5.6, L.steelDk, 0, 0, 8); const wh = cyl(0.048, 0.048, 0.05, L.rubber, 14); wh.rotation.z = PI / 2; wh.position.y = P(2.6); f.add(wh); const hub = cyl(0.025, 0.025, 0.056, L.chrome, 8); hub.rotation.z = PI / 2; hub.position.y = P(2.6); f.add(hub); }
    B(g, [-hw, hw], [5.4, 27], [-hz, hz], L.graphite, 0.025);                                           // the lower cabinet
    for (let k = 0; k < 3; k++) { const y0 = 7 + k * 6.6; B(g, [-hw + 0.03, hw - 0.03], [y0, y0 + 6], [hz, hz + 0.04], L.steelDk, 0.01); Ca(g, 'x', 0.014, -0.18, 0.18, L.chrome, 0, P(y0 + 4.4), hz + 0.08, 8); for (const xx of [-0.18, 0.18]) rod(g, [xx, P(y0 + 4.4), hz + 0.04], [xx, P(y0 + 4.4), hz + 0.08], 0.01, L.chrome, 6); }
    B(g, [-hw - 0.02, hw + 0.02], [27, 29], [-hz - 0.02, hz + 0.03], L.steel, 0.012);                    // the top of the cabinet, the chest on it
    B(g, [-hw + 0.02, hw - 0.02], [29, 52], [-hz + 0.02, hz - 0.03], L.redPaint, 0.03); B(g, [-hw, hw], [50.4, 52.4], [-hz, hz - 0.01], L.redPaint, 0.025);
    for (let k = 0; k < 4; k++) { const y0 = 30 + k * 5.4; B(g, [-hw + 0.05, hw - 0.05], [y0, y0 + 4.8], [hz - 0.03, hz + 0.01], std('#a8301e', 0.35, 0.45), 0.008); Ca(g, 'x', 0.012, -0.16, 0.16, L.chrome, 0, P(y0 + 3.4), hz + 0.05, 8); }
    B(g, [hw - 0.01, hw + 0.04], [32, 48], [-hz + 0.06, hz - 0.08], L.steelDk, 0.008);                    // a side handle and a lock
    { const h = tube([[hw + 0.01, P(40), -0.2], [hw + 0.1, P(40), -0.2], [hw + 0.1, P(40), 0.16], [hw + 0.01, P(40), 0.16]], 0.016, L.chrome); g.add(h); }
    B(g, [-0.06, 0.06], [46, 50], [hz - 0.03, hz + 0.02], L.chrome, 0.006); S(g, 0.014, G_.green, -0.3, P(48), hz + 0.005);
    // the top tray, open: tools laid in it
    B(g, [-hw + 0.04, hw - 0.04], [52.4, 53.2], [-hz + 0.04, hz - 0.06], L.steelDk, 0.006);
    { const ham = G(); Cy(ham, 0.014, 0, 7, L.woodDk, 0, 0, 8); B(ham, [-0.07, 0.07], [7, 9.4], [-0.02, 0.02], L.steelDk, 0.006); at(ham, -0.18, P(53.2), 0.02, 0); ham.rotation.z = PI / 2; ham.position.y += 0.014; ham.rotation.y = 0.2; g.add(ham); }
    { const sp = G(); B(sp, [-0.2, 0.2], [0, 0.7], [-0.025, 0.025], L.chrome, 0.004); const jaw = new T.Mesh(new T.TorusGeometry(0.035, 0.012, 6, 10, PI * 1.5), L.chrome); jaw.position.x = 0.21; jaw.rotation.x = PI / 2; sp.add(jaw); at(sp, 0.12, P(53.2), -0.06, 0.1); g.add(sp); }
    { const sd = G(); Cy(sd, 0.02, 0, 5, L.yellow, 0, 0, 8); Cy(sd, 0.008, 5, 9, L.chrome, 0, 0, 6); sd.rotation.z = PI / 2; sd.position.set(-0.05, P(53.2) + 0.02, 0.1); sd.rotation.y = -0.15; g.add(sd); }
    { const bx = G(); B(bx, [-0.08, 0.08], [0, 3], [-0.06, 0.06], L.yellow, 0.01); at(bx, 0.28, P(53.2), 0.0, 0.1); g.add(bx); }
    return { g };
  };

  // ───────────── THE SPEAKER ─────────────
  const speaker = () => {
    const g = G();
    // the tripod: three splayed legs, a centre column with a collar and a mounting stub
    for (let i = 0; i < 3; i++) { const a = deg(30 + i * 120 + 8), x = Math.cos(a) * 0.4, z = Math.sin(a) * 0.4; rod(g, [x, P(1), z], [Math.cos(a) * 0.05, P(36), Math.sin(a) * 0.05], 0.02, L.graphite, 8); S(g, 0.03, L.rubber, x, P(0.8), z); }
    Cy(g, 0.032, 22, 62, L.steel, 0, 0, 10); Cy(g, 0.05, 34, 37, L.graphite, 0, 0, 12); const kn = cyl(0.04, 0.04, 0.04, L.redPaint, 10); kn.rotation.z = PI / 2; kn.position.set(0.07, P(35.5), 0); g.add(kn);
    // the cabinet, tilted a little down towards the camera: a trapezoid box with a perforated grille, a woofer cone, a horn tweeter, a handle and a lamp
    const sp = G(); sp.position.set(0, P(78), 0.0); sp.rotation.set(0.12, 0.62, 0); g.add(sp);
    B(sp, [-0.3, 0.3], [-20, 20], [-0.22, 0.18], std('#2c3642', 0.45, 0.45), 0.04); B(sp, [-0.31, 0.31], [-21, -18.4], [-0.23, 0.19], L.steelDk, 0.02); B(sp, [-0.31, 0.31], [18.4, 21], [-0.23, 0.19], L.steelDk, 0.02);
    B(sp, [-0.25, 0.25], [-16, 16], [0.17, 0.21], L.steelDk, 0.014);
    for (let r = 0; r < 14; r++) for (let c = 0; c < 8; c++) { const d = cyl(0.012, 0.012, 0.012, L.dark, 6); d.rotation.x = PI / 2; d.position.set(-0.2 + c * 0.057, P(-14 + r * 2.15) , 0.212); if ((r * 7 + c) % 1 === 0) sp.add(d); }
    { const wr = new T.Mesh(new T.TorusGeometry(0.17, 0.02, 8, 28), L.chrome); wr.position.set(0, P(-6), 0.212); sp.add(wr); const cone = new T.Mesh(new T.ConeGeometry(0.15, 0.1, 22, 1, true), L.rubber); cone.rotation.x = -PI / 2; cone.position.set(0, P(-6), 0.19); cone.material = L.rubber; sp.add(cone); const dust = new T.Mesh(new T.SphereGeometry(0.05, 12, 8, 0, TAU, 0, PI / 2), L.steelDk); dust.rotation.x = PI / 2; dust.position.set(0, P(-6), 0.214); sp.add(dust); }
    { const hn = new T.Mesh(new T.CylinderGeometry(0.1, 0.045, 0.14, 4, 1, true), L.steel); hn.rotation.set(PI / 2, PI / 4, 0); hn.scale.set(1.4, 1, 0.8); hn.position.set(0, P(10.5), 0.28); hn.material = L.steel; sp.add(hn); B(sp, [-0.16, 0.16], [8.6, 12.4], [0.2, 0.215], L.graphite, 0.006); }
    S(sp, 0.016, G_.red, 0.22, P(16.4), 0.2); const hd = tube([[-0.12, P(20), 0], [-0.12, P(24), 0], [0.12, P(24), 0], [0.12, P(20), 0]], 0.016, L.rubber); sp.add(hd); const lg = new T.Mesh(new T.PlaneGeometry(0.1, P(1.8)), G_.cyan); lg.position.set(0.18, P(-17.2), 0.214); sp.add(lg);
    const side = new T.Mesh(new T.PlaneGeometry(0.4, P(30)), grad('#2a3a44', '#10181e')); side.rotation.y = PI / 2; side.position.set(0.305, 0, -0.02); sp.add(side); for (let i = 0; i < 3; i++) B(sp, [0.3, 0.32], [-16 + i * 11, -13.4 + i * 11], [-0.12, 0.1], L.steelDk, 0.004);
    // the lead
    { const cb = tube([[-0.28, P(70), -0.2], [-0.45, P(40), -0.3], [-0.38, P(6), -0.2], [-0.2, P(0.8), 0.1], [0.1, P(0.8), 0.3]], 0.018, L.rubber); g.add(cb); }
    return { g };
  };

  // ───────────── THE CABLE DRUM ─────────────
  const spool = () => {
    const g = G(), R = 0.44, y = R + 0.015, fl = 0.045, hw = 0.27;
    // two wooden flanges (planked discs with a steel rim, bolts and a hub), the barrel and the cable wound on it
    for (const sx of [-1, 1]) { const x = sx * (hw + fl / 2); const d = cyl(R, R, fl, L.wood, 40); d.rotation.z = PI / 2; d.position.set(x, y, 0); g.add(d); const rm = new T.Mesh(new T.TorusGeometry(R, 0.012, 6, 40), L.steelDk); rm.rotation.y = PI / 2; rm.position.set(x, y, 0); g.add(rm);
      for (let k = 0; k < 6; k++) { const a = k * PI / 3 + 0.3; const b = cyl(0.018, 0.018, 0.012, L.chrome, 8); b.rotation.z = PI / 2; b.position.set(sx * (hw + fl + 0.004), y + Math.cos(a) * R * 0.78, Math.sin(a) * R * 0.78); g.add(b); }
      const hb = cyl(0.1, 0.1, 0.05, L.steelDk, 20); hb.rotation.z = PI / 2; hb.position.set(sx * (hw + fl + 0.01), y, 0); g.add(hb); const ax = cyl(0.04, 0.04, 0.056, L.chrome, 12); ax.rotation.z = PI / 2; ax.position.set(sx * (hw + fl + 0.015), y, 0); g.add(ax);
      for (let k = 0; k < 8; k++) { const a = k * PI / 4; const pl = cbox(0.012, 0.0, 0.0, 0.0001, L.woodDk); } }
    const barrel = cyl(0.17, 0.17, hw * 2, L.woodDk, 24); barrel.rotation.z = PI / 2; barrel.position.set(0, y, 0); g.add(barrel);
    const wind = cyl(0.36, 0.36, hw * 2 - 0.03, L.orange, 40); wind.rotation.z = PI / 2; wind.position.set(0, y, 0); g.add(wind);
    for (let i = 0; i < 16; i++) { const x = -hw + 0.03 + i * ((hw * 2 - 0.06) / 15), r = new T.Mesh(new T.TorusGeometry(0.363, 0.016, 5, 40), i % 4 === 0 ? L.yellow : L.orange); r.rotation.y = PI / 2; r.position.set(x, y, 0); g.add(r); }
    // planks: radial lines on each visible flange face
    for (let k = 0; k < 8; k++) { const a = k * PI / 4 + 0.2; const x = hw + fl + 0.002; const ln = cbox(0.006, R * 1.7, 0.012, 0.001, L.woodDk); ln.position.set(x, y, 0); ln.rotation.x = a; g.add(ln); }
    // the loose end: unwinds from the top, hangs over the +z flange and lies on the floor with a plug
    { const cb = tube([[hw * 0.4, y + 0.375, 0.0], [hw * 0.4, y + 0.36, 0.2], [hw * 0.55, y + 0.1, 0.5], [0.15, 0.03, 0.55], [-0.1, 0.03, 0.7], [0.0, 0.03, 0.85]], 0.026, L.orange); g.add(cb); const pl = cbox(0.12, 0.05, 0.1, 0.01, L.yellow); pl.position.set(0.0, 0.03, 0.88); g.add(pl); B(g, [-0.03, 0.03], [0.6, 0.62], [0.91, 0.96], L.chrome, 0.002); }
    // chocks and a stencilled hazard band on the +z side
    for (const sx of [-1, 1]) { const c = new T.Mesh(new T.CylinderGeometry(0.02, 0.1, 0.12, 3), L.woodDk); c.rotation.z = PI / 2; c.rotation.y = PI / 6; c.position.set(sx * 0.14, 0.04, 0.28); c.scale.set(1, 1, 1); g.add(c); }
    return { g };
  };

  const VAR = {
    'lab_bench.8x2.s0': () => bench(0), 'lab_bench.8x2.s1': () => bench(1), 'fume_hood': hood,
    'test_chamber.r85': () => chamber(0.85, LQ.mint, glow('#b8ffe6'), 'embryo', G_.mint), 'test_chamber.r75': () => chamber(0.75, LQ.violet, glow('#e8c8ff'), 'crystal', G_.violet),
    'cart.1x1': () => cart(0.92, labItems), 'cart.2x1': () => cart(1.92, armoryItems), 'generator.1x2': gen1x2, 'generator.1x1': gen1x1, 'toolbox': toolbox, 'speaker': speaker, 'spool': spool,
  };
  PROPS.lab = { variants: Object.keys(VAR), canvas: [1100, 760], exposure: 0.92, build(name) { return VAR[name](); } };
}
