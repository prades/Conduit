// THE CRYSTAL PAD FAMILY (docs: design/props/BRIEF.md). Variants (the game picks them by name, js/facilitystyle.js _fpStyleRigPad / _fpStyleRig):
//   pad    THE CRADLE ON THE FLOOR: a round, three-tier machine (radius 1.5 tiles, 24 px high): a graphite foundation ring with a hazard-striped chamfer, a teal drum with panel grooves, vents and a light band,
//          a pale top deck inlaid with three glowing rings (cyan, violet, cyan) and eight seams, a chrome-collared emitter well in the middle with four cradle prongs round it, four lamp pylons on the deck and two
//          heavy cables leaving the foundation. The crystal floats over the well (it is drawn live, with the pulses and the field rings).
//   rig    THE CROWN IN THE CEILING: the matching round machine 230 px up (a teal housing with a lamp band, a deck inlaid like the pad's, a core under a glass dome), three ribbed posts with glowing collars down to the
//          pad's back rim, and two heavy struts running up out of the picture. The energy lines from the core to the crystal are drawn live.
// marks: pad.well (the emitter well's middle on the deck), pad.tip (where the crystal's point hangs), rig.core (the crown's core, where the energy lines start).
// Everything is in a block: the helpers must not collide with the other families'.
{
  const MT = STY.mat, col = STY.col, std = STY.std, glow = STY.glow;
  const P = px;                                           // a height in game pixels, in units
  const Q = {
    graphite: MT.graphite, rubber: MT.rubber, steel: std('#aeb8c4', 0.92, 0.3), steelDk: std('#5d6874', 0.85, 0.38), chrome: std('#e4ebf2', 1, 0.14), dark: std('#10141a', 0.5, 0.55),
    teal: std('#4f9aa0', 0.3, 0.36), tealLit: std('#6cb3bb', 0.3, 0.36), tealDk: std('#2f6a73', 0.35, 0.42), deck: std('#dbe9ee', 0.25, 0.32), deckDk: std('#a9c4cc', 0.3, 0.4),
    yellow: std('#f2b13a', 0.3, 0.45), glassTint: MT.glassTint.clone(),
  };
  for (const k of ['graphite', 'steel', 'steelDk', 'teal', 'tealLit', 'tealDk', 'deck', 'deckDk']) { Q[k] = Q[k].clone(); Q[k].side = T.DoubleSide; }
  Q.glassTint.side = T.DoubleSide;
  const E = { cyan: glow('#31e8ff', 1.0), cyanDim: glow('#31e8ff', 0.6), violet: glow('#b57bff', 0.95), white: glow('#eaffff', 1.0), amber: glow('#f2b13a', 0.95) };
  const deg = a => a * PI / 180;
  const B = (par, xr, yr, zr, mat, b) => { const m = cbox(xr[1] - xr[0], P(yr[1] - yr[0]), zr[1] - zr[0], b == null ? 0.012 : b, mat); m.position.set((xr[0] + xr[1]) / 2, P((yr[0] + yr[1]) / 2), (zr[0] + zr[1]) / 2); par.add(m); return m; };
  const Cy = (par, r, y0, y1, mat, x, z, seg, r1) => { const m = cyl(r, r1 == null ? r : r1, P(y1 - y0), mat, seg || 48); m.position.set(x || 0, P((y0 + y1) / 2), z || 0); par.add(m); return m; };
  // a surface of revolution round the vertical axis: points are [radius, height in game px] going up the outside
  const Lathe = (par, pts, mat, seg) => { const m = new T.Mesh(new T.LatheGeometry(pts.map(q => new T.Vector2(q[0], P(q[1]))), seg || 96), mat); par.add(m); return m; };
  // a flat ring on a horizontal plane (an inlay): inner and outer radius, at height y (game px)
  const Ring = (par, r0, r1, y, mat, seg) => { const m = new T.Mesh(new T.RingGeometry(r0, r1, seg || 96, 1), mat); m.rotation.x = -PI / 2; m.position.y = P(y); par.add(m); return m; };
  // a block set radially on a circle: w along the radius, d along the tangent, centre at (r, y) and angle a
  const Rad = (par, a, r, y0, y1, w, d, mat, b) => { const m = cbox(w, P(y1 - y0), d, b == null ? 0.006 : b, mat); m.position.set(Math.cos(a) * r, P((y0 + y1) / 2), Math.sin(a) * r); m.rotation.y = -a; par.add(m); return m; };
  const rod = (par, a, b, r, mat, seg) => { const m = cyl(r, r, 1, mat, seg || 8), d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), l = d.length() || 1e-4; m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.scale.set(1, l, 1); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); par.add(m); return m; };

  // the deck's inlays, shared by the pad and the crown: a dark moat, a lit ring, three of them, and eight seams
  const inlays = (g, y, R, withSeams) => {
    for (const [r, m, w] of [[R * 0.82, E.cyan, 0.024], [R * 0.58, E.violet, 0.024], [R * 0.38, E.cyan, 0.02]]) { Ring(g, r - 0.05, r + 0.05, y + 0.05, Q.dark); Ring(g, r - w, r + w, y + 0.25, m); }
    if (withSeams) for (let i = 0; i < 8; i++) { const a = i * PI / 4 + PI / 8; Rad(g, a, R * 0.68, y, y + 0.35, R * 0.62, 0.014, Q.dark, 0.002); }
  };

  const pad = () => {
    const g = G();
    // THE FOUNDATION: a low graphite ring with a chamfered top, a dark toe, and a hazard-striped band round the chamfer
    Lathe(g, [[0.01, 0], [1.5, 0], [1.5, 6], [1.46, 8.2], [1.32, 8.2], [0.01, 8.2]], Q.graphite);
    Lathe(g, [[1.505, 0], [1.505, 2.2], [1.5, 2.2], [1.5, 0]], Q.dark);
    for (let i = 0; i < 36; i++) { const a = i * TAU / 36; Rad(g, a, 1.445, 5.2, 8.0, 0.1, 0.135, i & 1 ? Q.yellow : Q.graphite, 0.004); }
    // THE DRUM: teal, with panel grooves, vents and a lit band
    Lathe(g, [[1.32, 8.2], [1.32, 17], [1.29, 18.6], [1.21, 18.6]], Q.teal);
    Lathe(g, [[1.325, 8.2], [1.325, 9.6], [1.32, 9.6]], Q.tealDk);
    for (let i = 0; i < 24; i++) { const a = i * TAU / 24 + PI / 24; Rad(g, a, 1.315, 9.8, 17.4, 0.02, 0.014, Q.dark, 0.002); }
    for (let i = 0; i < 8; i++) { const a = i * PI / 4; for (let k = 0; k < 3; k++) Rad(g, a, 1.318, 12.5 + k * 1.5, 13.1 + k * 1.5, 0.02, 0.2, Q.dark, 0.002); }
    for (let i = 0; i < 8; i++) { const a = i * PI / 4 + PI / 8; Rad(g, a, 1.322, 9.8, 17.0, 0.014, 0.17, Q.tealDk, 0.003); }
    Cy(g, 1.327, 15.6, 16.6, E.cyanDim, 0, 0, 96);   // the lit band
    // THE DECK: pale, bevelled, inlaid
    Lathe(g, [[1.21, 18.6], [1.21, 21.2], [1.16, 22.6], [0.4, 22.6]], Q.deck);
    Lathe(g, [[1.215, 18.6], [1.215, 19.4], [1.21, 19.4]], Q.deckDk);
    inlays(g, 22.6, 1.16, true);
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16 + PI / 16; const b = cyl(0.026, 0.026, P(1.2), Q.chrome, 10); b.position.set(Math.cos(a) * 1.1, P(23.1), Math.sin(a) * 1.1); g.add(b); }
    // THE EMITTER WELL: a chrome collar, a dark throat, a lit disc, a violet ring, a white core, four cradle prongs
    { const col0 = new T.Mesh(new T.TorusGeometry(0.37, 0.045, 12, 64), Q.chrome); col0.rotation.x = PI / 2; col0.position.y = P(23.0); g.add(col0);
      Cy(g, 0.34, 20.2, 22.7, Q.dark, 0, 0, 64); Cy(g, 0.28, 22.4, 22.8, E.cyanDim, 0, 0, 64); Ring(g, 0.15, 0.185, 23.0, E.violet, 64); { const c = new T.Mesh(new T.SphereGeometry(0.07, 18, 12), E.white); c.position.y = P(23.4); g.add(c); }
      for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4; rod(g, [Math.cos(a) * 0.4, P(23), Math.sin(a) * 0.4], [Math.cos(a) * 0.25, P(44), Math.sin(a) * 0.25], 0.026, Q.chrome, 8); const tip = new T.Mesh(new T.SphereGeometry(0.04, 12, 8), E.cyan); tip.position.set(Math.cos(a) * 0.25, P(44.5), Math.sin(a) * 0.25); g.add(tip); } }
    // FOUR LAMP PYLONS on the deck: a hexagonal foot, a body, a lit head, a chrome cap
    for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, x = Math.cos(a) * 0.98, z = Math.sin(a) * 0.98;
      Cy(g, 0.14, 22.6, 24.6, Q.graphite, x, z, 6); Cy(g, 0.085, 24.6, 33, Q.steelDk, x, z, 12); Cy(g, 0.11, 33, 38.5, E.cyanDim, x, z, 16); Cy(g, 0.125, 38.5, 40.6, Q.chrome, x, z, 16); Cy(g, 0.07, 40.6, 43, Q.graphite, x, z, 12);
      Cy(g, 0.092, 27.5, 28.6, Q.chrome, x, z, 12); Cy(g, 0.092, 30.5, 31.6, Q.chrome, x, z, 12); }
    // TWO HEAVY CABLES leaving the foundation to the left and the right (on screen) and lying along the floor, each with a clamp where it leaves and a plug at the end
    for (const a of [deg(135), deg(315)]) { const ca = Math.cos(a), sa = Math.sin(a); g.add(tube([[ca * 1.46, P(4.6), sa * 1.46], [ca * 1.62, P(2.4), sa * 1.62], [ca * 1.85, P(1.7), sa * 1.85], [ca * 2.2, P(1.7), sa * 2.2]], 0.065, Q.rubber)); Rad(g, a, 1.52, 2.6, 7.4, 0.06, 0.2, Q.steelDk, 0.01); Rad(g, a, 2.28, 0.4, 3.6, 0.12, 0.13, Q.yellow, 0.01); }
    return { g, marks: { well: [0, P(23), 0], tip: [0, P(76), 0] } };
  };

  const rig = () => {
    const g = G(), Y = 230;
    // THE POSTS: three ribbed columns from the pad's back rim up to the crown, with glowing collars and a cable along each
    for (const a of [PI, PI * 1.25, PI * 1.5]) { const x = Math.cos(a) * 1.38, z = Math.sin(a) * 1.38;
      Cy(g, 0.2, 8, 14, Q.graphite, x, z, 8); Cy(g, 0.125, 14, Y - 8, Q.steelDk, x, z, 14); Cy(g, 0.16, Y - 10, Y, Q.graphite, x, z, 12);
      for (const y of [58, 118, 178]) { Cy(g, 0.175, y, y + 8, Q.steel, x, z, 16); Cy(g, 0.181, y + 2.6, y + 5.4, E.cyan, x, z, 16); }
      for (let k = 0; k < 6; k++) Cy(g, 0.14, 24 + k * 30, 27.5 + k * 30, Q.steel, x, z, 12);
      g.add(tube([[x + 0.12 * Math.cos(a), P(16), z + 0.12 * Math.sin(a)], [x + 0.16 * Math.cos(a), P(110), z + 0.16 * Math.sin(a)], [x + 0.12 * Math.cos(a), P(Y - 12), z + 0.12 * Math.sin(a)]], 0.03, Q.rubber)); }
    // THE CROWN: the housing (a teal wall with a lamp band), the deck with the pad's inlays, a core under a glass dome
    Lathe(g, [[0.01, Y - 4], [1.5, Y - 4], [1.5, Y + 10], [1.46, Y + 13.6], [1.36, Y + 13.6]], Q.teal);
    Lathe(g, [[1.505, Y - 4], [1.505, Y + 0.6], [1.5, Y + 0.6]], Q.graphite);
    Cy(g, 1.508, Y + 4.4, Y + 6.6, E.cyanDim, 0, 0, 96);
    for (let i = 0; i < 20; i++) { const a = i * TAU / 20 + PI / 20; Rad(g, a, 1.5, Y + 0.8, Y + 9.6, 0.016, 0.026, Q.tealDk, 0.002); }
    Lathe(g, [[1.36, Y + 13.6], [1.36, Y + 17], [0.4, Y + 17]], Q.deck);
    inlays(g, Y + 17, 1.36, false);
    for (let i = 0; i < 12; i++) { const a = i * TAU / 12; const l = cyl(0.04, 0.04, P(2), E.amber, 8); l.position.set(Math.cos(a) * 1.27, P(Y + 18), Math.sin(a) * 1.27); g.add(l); }
    Cy(g, 0.4, Y + 17, Y + 22, Q.graphite, 0, 0, 48); { const ring = new T.Mesh(new T.TorusGeometry(0.4, 0.03, 10, 48), Q.chrome); ring.rotation.x = PI / 2; ring.position.y = P(Y + 22); g.add(ring); }
    { const dome = new T.Mesh(new T.SphereGeometry(0.3, 32, 16, 0, TAU, 0, PI / 2), Q.glassTint); dome.position.y = P(Y + 22); g.add(dome); const core = new T.Mesh(new T.SphereGeometry(0.18, 24, 16), E.cyan); core.position.y = P(Y + 25); g.add(core); const c2 = new T.Mesh(new T.SphereGeometry(0.08, 16, 10), E.white); c2.position.y = P(Y + 25); g.add(c2); }
    // THE STRUTS: two heavy square beams from the crown's back-left and back-right up out of the picture (never in front of its core), with collars and a cable bundle
    for (const [dx, dz] of [[-0.95, -0.15], [-0.15, -0.95]]) { B(g, [dx - 0.13, dx + 0.13], [Y + 17, Y + 400], [dz - 0.13, dz + 0.13], Q.steelDk, 0.02);
      for (let k = 0; k < 5; k++) B(g, [dx - 0.17, dx + 0.17], [Y + 40 + k * 80, Y + 52 + k * 80], [dz - 0.17, dz + 0.17], Q.steel, 0.02);
      B(g, [dx - 0.2, dx + 0.2], [Y + 14, Y + 22], [dz - 0.2, dz + 0.2], Q.graphite, 0.02); g.add(tube([[dx + 0.15, P(Y + 22), dz], [dx + 0.18, P(Y + 200), dz], [dx + 0.15, P(Y + 392), dz]], 0.035, Q.rubber)); }
    return { g, marks: { core: [0, P(Y + 25), 0] } };
  };

  const VAR = { pad, rig };
  PROPS.crystalpad = { variants: Object.keys(VAR), canvas: [900, 1400], exposure: 1.0, build(name) { return VAR[name](); } };
}
