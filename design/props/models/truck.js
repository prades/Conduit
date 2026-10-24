// THE MISSILE TRUCK parked along the arena's west side: a footprint of 5 tiles in x by 11 in z (the prop's rect), centred on the origin, so the model stays inside x -2.5..2.5 and z -5.5..5.5. Its long axis is z.
// A heavy 8x8 missile transporter-erector-launcher (a TEL) in dark weathered navy-olive: a cab-over armoured cab at the +z end (the front faces +z), four axles of fat tyres (two under the cab, a bogie of two at the
// back), a ladder frame with fuel tanks, tool boxes and folded outriggers, and a launcher: a long cradle on two hydraulic rams that holds THREE pale missiles side by side, tilted up a little at the front, strapped
// down, with warheads, painted bands and fins (the map: cargo: missile x3). The truck is about 4.0 wide x 10.4 long and ~ 175 game-px high at the missiles' noses (the cab roof ~165). Everything is inside the footprint.
// Written inside build() (this file shares one scope with the other families' models).
PROPS.truck = { variants: ['truck'], canvas: [1500, 1000], build() {
  const g = G();
  // ── materials ──
  const mt = (c, o) => { const m = new T.MeshStandardMaterial(Object.assign({ color: c, metalness: 0.5, roughness: 0.6, flatShading: true }, o || {})); m.envMapIntensity = 0.35; return m; };
  const gl = c => new T.MeshBasicMaterial({ color: c, toneMapped: false });
  const BODY = mt(0x222d37, { metalness: 0.35, roughness: 0.68 }), BODY2 = mt(0x19232b, { metalness: 0.35, roughness: 0.68 }), OLIVE = mt(0x20281e, { roughness: 0.78, metalness: 0.3 }), DARK = mt(0x14181d, { metalness: 0.4, roughness: 0.7 }), STEEL = mt(0x8a929e, { metalness: 0.9, roughness: 0.35 }), GUN = mt(0x4a525c, { metalness: 0.8, roughness: 0.4 });
  const RUBBER = new T.MeshStandardMaterial({ color: 0x0b0c0e, metalness: 0.1, roughness: 0.9, flatShading: true }), GLASS = mt(0x0a1620, { metalness: 0.9, roughness: 0.12, emissive: 0x06202a, emissiveIntensity: 0.6 });
  const RUST = mt(0x4a2f1e, { roughness: 0.95, metalness: 0.2 }), ORANGE = mt(0xd9661f, { roughness: 0.6 }), YELLOW = mt(0xd7ae22, { roughness: 0.6 }), CREAM = mt(0xcfd0c2, { metalness: 0.3, roughness: 0.5 }), WARHEAD = mt(0xe2dcc6, { metalness: 0.25, roughness: 0.45 }), RED = mt(0xb23a22, { roughness: 0.55 });
  const CYAN = gl(0x31e8ff), LAMP = gl(0xfff2c6), TAIL = gl(0xff3a22), AMBER = gl(0xffa21a);
  // ── helpers ──
  const put = (p, m, x, y, z) => { m.position.set(x, y, z); p.add(m); return m; };
  const box = (p, w, h, d, m, x, y, z, b) => put(p, cbox(w, h, d, b == null ? 0.03 : b, m), x, y, z);
  const cylX = (r, len, m, seg) => { const c = cyl(r, r, len, m, seg || 18); c.rotation.z = PI / 2; return c; };      // a cylinder along x
  const cylZ = (r0, r1, len, m, seg) => { const c = cyl(r1, r0, len, m, seg || 18); c.rotation.x = PI / 2; return c; };  // along z: r0 at -z, r1 at +z
  const link = (p, a, b, r, m) => { const l = limb(r, m); setLink(l, a, b); p.add(l); return l; };
  // a side profile (z, y points) extruded across x by `w`, centred on x = 0
  const side = (pts, w, b, m) => { const s = plate(pts.map(q => [-q[0], q[1]]), w, b, m); s.rotation.y = PI / 2; return s; };
  const both = f => { f(1); f(-1); };

  // ── the parking pad: the ground the truck stands on, the whole footprint (the game does not draw the arena floor under a solid prop, so the sprite brings its own): dark asphalt with oil stains, tyre marks and painted lines ──
  const flat = hex => { const c = new T.Color(hex); c.convertSRGBToLinear(); return new T.MeshBasicMaterial({ color: c, toneMapped: false }); };   // (a colour as it should appear on screen: the renderer encodes to sRGB)
  const PAD = flat(0x2e2c2d);   // (unlit: a flat floor colour like the game's own, so the room's light dims it with the rest)
  box(g, 4.98, 0.06, 10.98, PAD, 0, 0.03, 0, 0.01);
  const LINE = flat(0x6a5d24), OIL = flat(0x1d1c1e);
  for (const x of [-2.32, 2.32]) box(g, 0.1, 0.012, 10.7, LINE, x, 0.066, 0, 0.002);
  for (const z of [-5.25, 5.25]) box(g, 4.7, 0.012, 0.1, LINE, 0, 0.066, z, 0.002);
  for (const [x, z, w, d] of [[0.2, 1.5, 1.4, 1.1], [-0.9, -3.0, 0.9, 1.6], [1.0, -0.4, 0.6, 0.6], [-0.2, 4.2, 1.1, 0.8], [1.6, -4.2, 0.7, 0.7]]) box(g, w, 0.012, d, OIL, x, 0.068, z, 0.004);
  for (const x of [-1.74, 1.74]) for (const [z0, z1] of [[-6, -4.6], [-1.2, 5]]) box(g, 0.5, 0.01, z1 - z0 > 10 ? 10 : Math.min(5.4, z1 - z0), OIL, x, 0.067, Math.max(-5.2, Math.min(5.2, (z0 + z1) / 2)), 0.003);
  // ── the ladder frame, and what hangs on it ──
  const chassis = G(); g.add(chassis);
  both(s => { box(chassis, 0.34, 0.34, 10.0, OLIVE, s * 0.95, 0.72, 0, 0.04); box(chassis, 0.1, 0.22, 10.0, DARK, s * 1.14, 0.72, 0, 0.02); });
  for (const z of [-4.6, -3.2, -1.8, -0.4, 1.0, 2.4, 3.8]) box(chassis, 2.2, 0.2, 0.26, DARK, 0, 0.72, z, 0.03);
  box(chassis, 2.9, 0.12, 7.6, BODY2, 0, 0.98, -1.6, 0.03);                                   // the deck under the launcher
  // the rear: a bumper bar with warning stripes, tail lights, a tow pin
  box(g, 3.6, 0.32, 0.22, DARK, 0, 0.62, -5.06, 0.04);
  for (let i = 0; i < 9; i++) box(g, 0.34, 0.3, 0.05, i % 2 ? YELLOW : DARK, -1.52 + i * 0.38, 0.62, -5.19, 0.01);
  both(s => { box(g, 0.36, 0.2, 0.08, TAIL, s * 1.5, 1.06, -5.06, 0.02); box(g, 0.2, 0.1, 0.08, AMBER, s * 1.5, 0.9, -5.07, 0.01); });
  put(g, cylZ(0.07, 0.07, 0.3, STEEL, 10), 0, 0.5, -5.2);
  // tool boxes, fuel tanks and the cyan running lights down both flanks
  both(s => {
    box(g, 0.5, 0.46, 1.1, GUN, s * 1.52, 0.56, -1.2, 0.04); box(g, 0.04, 0.26, 0.92, DARK, s * 1.79, 0.58, -1.2, 0.01); box(g, 0.05, 0.05, 0.3, STEEL, s * 1.8, 0.66, -1.2, 0.01);
    const t = put(g, cylZ(0.3, 0.3, 1.7, mt(0x8e98a3, { metalness: 0.9, roughness: 0.4 }), 18), s * 1.5, 0.6, 0.55); for (const z of [-0.2, 0.55, 1.3]) { const bd = put(g, cylZ(0.315, 0.315, 0.06, DARK, 18), s * 1.5, 0.6, z); }
    for (let i = 0; i < 6; i++) box(g, 0.03, 0.05, 0.34, CYAN, s * 1.2, 0.99, -4.4 + i * 0.5 + (i > 2 ? 1.1 : 0), 0.005);
    // a folded outrigger at the back corner: a leg, a pad, a ram
    box(g, 0.22, 0.8, 0.22, OLIVE, s * 1.86, 0.78, -4.3, 0.03); box(g, 0.5, 0.08, 0.46, DARK, s * 1.86, 0.34, -4.3, 0.02); link(g, V(s * 1.86, 0.9, -4.3), V(s * 1.55, 1.18, -3.75), 0.045, STEEL);
  });

  // ── the wheels: four axles, two fat tyres each side ──
  const wheel = (x, z, s) => {
    const w = G(), R = 0.5, W = 0.46;
    w.add(cyl(R, R, W, RUBBER, 20));
    for (let i = 0; i < 20; i++) { const a = i * TAU / 20, b = cbox(0.07, W * 1.02, 0.11, 0.02, RUBBER); b.position.set(Math.cos(a) * (R + 0.015), 0, Math.sin(a) * (R + 0.015)); b.rotation.y = -a; w.add(b); }
    const hub = cyl(0.3, 0.3, W + 0.04, GUN, 14); w.add(hub); const cap = cyl(0.16, 0.16, W + 0.1, STEEL, 12); w.add(cap);
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8, bt = cyl(0.028, 0.028, W + 0.08, STEEL, 6); bt.position.set(Math.cos(a) * 0.22, 0, Math.sin(a) * 0.22); w.add(bt); }
    w.rotation.z = PI / 2; const o = G(); o.add(w); o.position.set(x, R, z); g.add(o); return o;
  };
  for (const z of [4.05, 2.85, -2.55, -3.85]) { both(s => wheel(s * 1.74, z, s)); put(g, cylX(0.12, 3.2, DARK, 10), 0, 0.5, z); }
  // mud guards: half tubes over each tyre, a flap behind the rear ones
  const fender = (x, z) => { const m = BODY2.clone(); m.side = T.DoubleSide; const f = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.62, 18, 1, true, 0, PI), m); f.rotation.z = PI / 2; f.position.set(x, 0.5, z); g.add(f); return f; };
  for (const z of [4.05, 2.85, -2.55, -3.85]) both(s => fender(s * 1.74, z));

  // ── the cab: a cab-over armoured box, a raked windscreen, a door, mirrors, a grille and lamps ──
  const cab = G(); g.add(cab);
  cab.add(side([[2.7, 0.8], [4.92, 0.8], [4.92, 1.62], [4.34, 2.26], [2.92, 2.26], [2.7, 2.1]], 3.34, 0.05, BODY));
  both(s => { box(cab, 0.08, 0.2, 2.1, DARK, s * 1.66, 0.95, 3.8, 0.02); });                    // the sill
  // armoured windscreen (two panes) and side windows
  const wsA = [0, 1.64, 4.9], wsB = [0, 2.2, 4.38];
  for (const x of [-0.8, 0.8]) { const pane = cbox(1.42, 0.7, 0.05, 0.03, GLASS); pane.position.set(x, 1.95, 4.65); pane.rotation.x = -0.84; cab.add(pane); box(cab, 1.5, 0.05, 0.06, DARK, x, 1.6, 4.93, 0.01); }
  box(cab, 0.08, 0.7, 0.07, DARK, 0, 1.95, 4.65, 0.01).rotation.x = -0.84;
  both(s => {
    box(cab, 0.05, 0.5, 0.95, GLASS, s * 1.69, 1.88, 4.0, 0.03); box(cab, 0.05, 0.4, 0.55, GLASS, s * 1.69, 1.9, 3.1, 0.03);
    box(cab, 0.05, 0.8, 1.15, BODY2, s * 1.69, 1.2, 4.05, 0.03); box(cab, 0.03, 0.04, 0.2, STEEL, s * 1.72, 1.26, 3.6, 0.01);       // a door and its handle
    box(cab, 0.02, 0.66, 0.025, DARK, s * 1.715, 1.2, 4.62, 0.005); box(cab, 0.02, 0.66, 0.025, DARK, s * 1.715, 1.2, 3.48, 0.005); box(cab, 0.02, 0.025, 1.15, DARK, s * 1.715, 1.54, 4.05, 0.005);
    for (let i = 0; i < 3; i++) box(cab, 0.04, 0.06, 0.04, CYAN, s * 1.7, 1.02, 3.2 + i * 0.4, 0.005);
    // the mirror arm and its mirror, out in front of the door
    link(cab, V(s * 1.68, 1.95, 4.5), V(s * 2.0, 1.95, 4.65), 0.025, STEEL); box(cab, 0.07, 0.5, 0.3, DARK, s * 2.02, 1.95, 4.65, 0.02);
    // lamps in the front panel, an amber marker, and a step
    box(cab, 0.5, 0.26, 0.08, LAMP, s * 1.22, 1.12, 4.94, 0.03); box(cab, 0.18, 0.1, 0.08, AMBER, s * 1.55, 1.38, 4.93, 0.02); box(cab, 0.5, 0.06, 0.34, DARK, s * 1.5, 0.74, 4.2, 0.01);
  });
  // the grille: black slats in a frame, a winch drum behind the bumper
  box(cab, 1.6, 0.6, 0.05, DARK, 0, 1.14, 4.95, 0.02); for (let i = 0; i < 5; i++) box(cab, 1.5, 0.04, 0.06, GUN, 0, 0.92 + i * 0.12, 4.97, 0.01);
  box(g, 3.5, 0.34, 0.26, DARK, 0, 0.7, 5.05, 0.05); for (let i = 0; i < 9; i++) box(g, 0.36, 0.32, 0.05, i % 2 ? YELLOW : DARK, -1.48 + i * 0.37, 0.7, 5.19, 0.01);
  put(g, cylX(0.14, 1.0, STEEL, 12), 0, 0.5, 5.0);
  // roof: a rack, a beacon and an aerial; the exhaust stack up the back of the cab
  box(cab, 2.4, 0.08, 1.3, DARK, 0, 2.31, 3.55, 0.02); for (const x of [-0.9, 0, 0.9]) box(cab, 0.08, 0.06, 1.3, STEEL, x, 2.37, 3.55, 0.01);
  put(cab, cyl(0.1, 0.12, 0.14, AMBER, 12), 0.9, 2.43, 4.0); put(cab, cyl(0.1, 0.12, 0.14, AMBER, 12), -0.9, 2.43, 4.0);
  link(cab, V(-1.05, 2.35, 3.05), V(-1.15, 3.0, 2.95), 0.018, DARK); put(cab, sphere(0.04, STEEL, 8), -1.15, 3.0, 2.95);
  put(g, cyl(0.09, 0.09, 1.55, mt(0x6a6e74, { metalness: 0.8, roughness: 0.5 }), 12), 1.78, 1.78, 2.62); put(g, cyl(0.13, 0.09, 0.14, DARK, 12), 1.78, 2.58, 2.62);
  // rust, dirt and panel lines on the cab and flank (thin patches just proud of the paint)
  both(s => { box(cab, 0.012, 0.28, 0.7, RUST, s * 1.675, 0.98, 4.4, 0.004); box(cab, 0.012, 0.18, 1.1, RUST, s * 1.675, 0.9, 3.2, 0.004); box(cab, 0.012, 0.12, 0.4, DARK, s * 1.675, 1.7, 3.0, 0.004); });
  box(cab, 0.9, 0.1, 0.012, RUST, -0.5, 1.0, 4.93, 0.004);

  // ── the launcher: the erector cradle on two rams, three missiles strapped to it, raised a little at the front ──
  const PITCH = 0.1, PIVOT = V(0, 1.14, -4.8), er = G(); er.position.copy(PIVOT); er.rotation.x = -PITCH; g.add(er);
  const ey = (yl, zl) => PIVOT.y + yl * Math.cos(PITCH) + zl * Math.sin(PITCH), ez = (yl, zl) => PIVOT.z - yl * Math.sin(PITCH) + zl * Math.cos(PITCH);     // a point of the cradle in the truck's frame
  // the pivot at the rear, and the two rams from the chassis up to the cradle
  both(s => { box(g, 0.4, 0.5, 0.42, DARK, s * 1.2, 1.08, -4.84, 0.04); box(g, 0.24, 0.3, 0.5, STEEL, s * 1.2, 1.28, -4.86, 0.03);
    const a = V(s * 1.18, 1.0, -2.75), b = V(s * 1.18, ey(-0.1, 3.0), ez(-0.1, 3.0)), mid = a.clone().lerp(b, 0.45); link(g, a, mid, 0.1, DARK); link(g, mid, b, 0.065, STEEL); put(g, sphere(0.1, GUN, 8), a.x, a.y, a.z); put(g, sphere(0.085, GUN, 8), b.x, b.y, b.z); });
  // the cradle: two long side girders, cross frames with saddles, a spine
  both(s => { box(er, 0.2, 0.28, 7.1, BODY2, s * 1.46, 0.08, 3.5, 0.03); box(er, 0.05, 0.1, 7.1, CYAN, s * 1.572, 0.12, 3.5, 0.005); });
  for (let i = 0; i < 5; i++) { const z = 0.6 + i * 1.3; box(er, 3.0, 0.16, 0.2, DARK, 0, 0.0, z, 0.02); for (const x of [-1, 0, 1]) { box(er, 0.84, 0.26, 0.24, GUN, x, 0.2, z, 0.03); box(er, 0.5, 0.16, 0.24, GUN, x, 0.3, z, 0.02); } }
  // each missile: a body in painted bands, a pale ogive warhead, a dark tail with a nozzle and four fins
  const missile = (x) => {
    const m = G(); // built along +y (the nose up), then laid along +z
    const L = 5.6, body = cyl(0.4, 0.4, L, CREAM, 20); body.position.y = L / 2; m.add(body);
    const prof = []; for (let i = 0; i <= 12; i++) { const t = i / 12; prof.push(new T.Vector2(0.4 * Math.pow(1 - t, 0.7) + 0.012, L + 1.35 * t)); }
    const nose = new T.Mesh(new T.LatheGeometry(prof, 20), WARHEAD); m.add(nose);
    const tip = new T.Mesh(new T.LatheGeometry(prof.filter((p, i) => i > 9).map(p => new T.Vector2(p.x * 1.04, p.y)), 20), RED); m.add(tip);
    for (const [y, h, mm] of [[L - 0.05, 0.16, RED], [L - 0.55, 0.3, YELLOW], [3.6, 0.38, ORANGE], [3.1, 0.12, YELLOW], [1.6, 0.34, ORANGE]]) { const bd = cyl(0.412, 0.412, h, mm, 20); bd.position.y = y; m.add(bd); }
    const tail = cyl(0.42, 0.36, 1.0, mt(0x3a4046, { metalness: 0.8, roughness: 0.5 }), 20); tail.position.y = 0.5; m.add(tail);
    const noz = cyl(0.26, 0.32, 0.3, DARK, 16); noz.position.y = -0.1; m.add(noz); const ring = cyl(0.2, 0.2, 0.31, gl(0xff8a3a), 16); ring.position.y = -0.1; m.add(ring);
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, f = cbox(0.3, 0.8, 0.04, 0.008, OLIVE); f.position.set(Math.cos(a) * 0.55, 0.6, Math.sin(a) * 0.55); f.rotation.y = -a; m.add(f); }
    for (let i = 0; i < 3; i++) { const sk = cbox(0.03, 0.18, 0.12, 0.005, DARK); sk.position.set(0.4, 2.2 + i * 0.5, 0); m.add(sk); }          // stencil marks along the body
    m.rotation.x = PI / 2; const o = G(); o.add(m); o.position.set(x, 0.56, 0.2); return o;
  };
  for (const x of [-1.0, 0, 1.0]) er.add(missile(x));
  // hold-down straps over each missile, with ratchets
  for (const z of [1.1, 2.6, 4.1, 5.6]) for (const x of [-1.0, 0, 1.0]) { const st = new T.Mesh(new T.TorusGeometry(0.43, 0.035, 6, 18, PI), DARK); st.position.set(x, 0.56, z); st.rotation.z = 0; er.add(st); box(er, 0.1, 0.1, 0.12, STEEL, x, 0.99, z, 0.01); }
  // a small radar / sensor mast at the back of the cradle (on the +x girder) and a hazard stripe across the cradle's tail
  link(er, V(1.46, 0.2, 0.7), V(1.46, 1.0, 0.7), 0.04, DARK); put(er, cbox(0.44, 0.34, 0.16, 0.02, GUN), 1.46, 1.12, 0.7); put(er, cyl(0.05, 0.05, 0.05, CYAN, 8), 1.46, 1.12, 0.8);
  for (let i = 0; i < 6; i++) box(er, 0.4, 0.04, 0.012, i % 2 ? YELLOW : DARK, -1.0 + i * 0.4, 0.13, 0.13, 0.005);
  // grease and dirt on the deck and the lower flank
  for (const [x, z, w, d] of [[1.35, -2.0, 0.35, 1.2], [1.4, 0.4, 0.3, 0.8], [1.45, -4.0, 0.3, 0.7]]) box(g, w, 0.012, d, RUST, x, 1.005, z, 0.003);
  return { g };
} };
