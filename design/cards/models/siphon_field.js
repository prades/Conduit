// SIPHON FIELD (Pack 1, flux, Precision: 15% per hit to heal 10% of the damage dealt): a field projector drawing flux in. A flared steel horn, ribbed and spined, its rolled lip violet-lit and
// its inside glowing ever brighter down to a white-hot throat, tilted a little toward the viewer on a knuckle joint over a compact base of copper coil windings lit violet between the turns; a thin
// ring of field with three nodes hovers over the lip, and a whirlpool of violet light lies over the mouth, its three arms winding in from wide and faint to tight and white-hot as they are drawn
// down into the throat, comets riding them inward and loose motes drifting in from beyond.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const hornM = std('#626a77', 0.8, 0.3), rimM = std('#a7b0bb', 0.9, 0.24), boltM = std('#c3cbd6', 0.95, 0.2), baseM = std('#59606c', 0.8, 0.32), slotM = std('#15181d', 0.6, 0.5);
  const copper = std('#c47c45', 1, 0.3);
  const flux = STY.glow('#a35cff', 1.25), fluxHot = STY.glow('#e2c8ff', 1.4), fluxDim = STY.glow('#6a2fd0', 1.2), white = STY.glow('#ffffff', 1.6);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const flat = (m) => { m.rotation.x = PI / 2; return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z), Yv = V(0, 1, 0);
  function lathe(pts, mat, seg) { const v = []; pts.forEach(([r, y], i) => { v.push(new T.Vector2(r, y)); if (i > 0 && i < pts.length - 1) v.push(new T.Vector2(r, y)); }); return new T.Mesh(new T.LatheGeometry(v, seg || 64), mat); }
  function smooth(pts, mat, seg) { return new T.Mesh(new T.LatheGeometry(pts.map(([r, y]) => new T.Vector2(r, y)), seg || 64), mat); }
  function ribbon(pts, r, mat, n) { const c = new T.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : V(p[0], p[1], p[2]))); return new T.Mesh(new T.TubeGeometry(c, n || 32, r, 8, false), mat); }
  // the horn's flare: radius at s (0 = throat, 1 = mouth) along its length
  const L0 = 0.08, L = 0.48, rad = s => 0.07 + 0.3 * Math.pow(s, 2.3), yAt = s => L0 + s * L;

  ITEMS.siphon_field = { exposure: 1.0, az: 0.55, el: 0.32, build() {
    const g = G();
    // THE BASE: a bevelled foot, a stack of copper windings round a violet-lit core, a top flange, a neck and the knuckle joint
    g.add(lathe([[0, -0.6], [0.27, -0.6], [0.3, -0.575], [0.3, -0.545], [0.27, -0.525], [0, -0.525]], baseM));
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.3; g.add(at(cyl(0.018, 0.018, 0.012, boltM, 8), 0.255 * Math.sin(a), -0.52, 0.255 * Math.cos(a))); }
    g.add(at(cyl(0.17, 0.17, 0.25, slotM, 32), 0, -0.4, 0));
    g.add(at(cyl(0.19, 0.19, 0.2, flux, 32), 0, -0.405, 0));
    for (let i = 0; i < 5; i++) g.add(at(flat(torus(0.21, 0.016, copper, 48)), 0, -0.485 + i * 0.041, 0));
    g.add(lathe([[0, -0.31], [0.23, -0.31], [0.25, -0.295], [0.25, -0.262], [0.23, -0.247], [0.1, -0.24], [0, -0.24]], baseM));
    g.add(at(flat(torus(0.251, 0.008, flux, 64)), 0, -0.278, 0));
    g.add(at(cyl(0.07, 0.085, 0.09, baseM, 24), 0, -0.2, 0));
    const J = V(0, -0.12, 0);   // the knuckle joint
    g.add(at(sphere(0.085, rimM, 32), J.x, J.y, J.z));
    // THE HORN: tilted a little toward the viewer about the joint, so its flare and the mouth both read
    const dir = V(Math.sin(-0.2) * 0.34, 1, Math.cos(-0.2) * 0.34).normalize(), H = G(); H.position.copy(J); H.quaternion.setFromUnitVectors(Yv, dir); g.add(H);
    const N = 24, out = [], inn = [];
    for (let i = 0; i <= N; i++) { const s = i / N; out.push([rad(s) + 0.018, yAt(s)]); inn.push([rad(s), yAt(s)]); }
    H.add(smooth([[0, L0 - 0.02], [0.07, L0 - 0.02]].concat(out), hornM, 72));
    // its inside lit violet, dark at the lip and brighter all the way down the throat
    const ig = new T.LatheGeometry(inn.map(([r, y]) => new T.Vector2(r, y)), 72), ip = ig.attributes.position, ic = new Float32Array(ip.count * 3), I0 = STY.col('#b57bff'), I1 = STY.col('#170733'), c = new T.Color();
    for (let i = 0; i < ip.count; i++) { const s = (ip.getY(i) - L0) / L; c.copy(I0).lerp(I1, Math.pow(Math.max(0, Math.min(1, s)), 0.75)); ic[i * 3] = c.r; ic[i * 3 + 1] = c.g; ic[i * 3 + 2] = c.b; }
    ig.setAttribute('color', new T.BufferAttribute(ic, 3));
    H.add(new T.Mesh(ig, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, toneMapped: false })));
    H.add(at(cyl(0.09, 0.09, 0.07, baseM, 24), 0, L0 - 0.01, 0));                          // the collar where the horn leaves the joint
    H.add(at(flat(torus(0.093, 0.01, flux, 32)), 0, L0 + 0.02, 0));
    for (const s of [0.34, 0.66]) H.add(at(flat(torus(rad(s) + 0.02, 0.012, rimM, 72)), 0, yAt(s), 0));       // steel ribs round it
    for (let k = 0; k < 4; k++) {                                                                                // and four spines up its flare
      const a = k * TAU / 4 + 0.75, pts = []; for (let i = 0; i <= 10; i++) { const s = 0.08 + 0.86 * i / 10, r = rad(s) + 0.024; pts.push(V(r * Math.sin(a), yAt(s), r * Math.cos(a))); } H.add(ribbon(pts, 0.012, rimM, 24));
    }
    H.add(at(flat(torus(rad(1) + 0.012, 0.026, rimM, 96)), 0, yAt(1) + 0.004, 0));                           // the rolled lip
    H.add(at(flat(torus(rad(1) - 0.012, 0.011, flux, 96)), 0, yAt(1) - 0.008, 0));                           // violet light just inside it
    // inside: rings of light down the throat, brighter the deeper they are, and the white-hot throat
    [[0.74, 0.008, fluxDim], [0.5, 0.009, flux], [0.28, 0.01, fluxHot]].forEach(([s, r, m]) => H.add(at(flat(torus(rad(s) - 0.004, r, m, 64)), 0, yAt(s), 0)));
    H.add(at(sphere(0.06, white, 16), 0, L0 + 0.03, 0));
    // THE FIELD: a thin ring hovering just over the lip, three nodes on it
    const FY = yAt(1) + 0.09, FR = 0.33;
    H.add(at(flat(torus(FR, 0.01, flux, 96)), 0, FY, 0));
    for (let k = 0; k < 3; k++) { const a = k * TAU / 3 + 0.4; H.add(at(sphere(0.024, fluxHot, 12), FR * Math.sin(a), FY, FR * Math.cos(a))); }
    // THE SIPHON: a whirlpool lying over the mouth, three arms winding in from wide and faint to tight and white-hot, dipping down into the throat at its eye; comets ride the arms
    // inward, each bright head leading and its tail trailing back out along the arm, and loose motes drift in from beyond it
    const sp = (t, a0) => { const a = a0 + t * 2.3 * PI, r = 0.04 + 0.46 * Math.pow(t, 1.1); return V(r * Math.sin(a), yAt(1) - 0.12 + 0.2 * Math.sqrt(t), r * Math.cos(a)); };
    for (let k = 0; k < 3; k++) {
      const a0 = k * TAU / 3, seg = (t0, t1, r, m) => { const pts = []; for (let j = 0; j <= 12; j++) pts.push(sp(t0 + (t1 - t0) * j / 12, a0)); H.add(ribbon(pts, r, m, 32)); };
      seg(0.0, 0.26, 0.013, fluxHot); seg(0.24, 0.5, 0.01, flux); seg(0.48, 0.76, 0.007, flux); seg(0.74, 1, 0.0045, fluxDim);
      [[0.2 + k * 0.08, 0.024], [0.56 + k * 0.06, 0.017]].forEach(([t, hr]) => {
        H.add(at(sphere(hr, t < 0.45 ? fluxHot : flux, 12), ...sp(t, a0).toArray()));
        const tail = []; for (let j = 0; j <= 6; j++) tail.push(sp(t + 0.012 + j * 0.016, a0)); H.add(ribbon(tail, hr * 0.62, t < 0.45 ? fluxHot : flux, 12));
      });
    }
    [[1.12, 0.6, 0.011], [1.08, 2.7, 0.01], [1.15, 4.5, 0.009], [0.96, 1.6, 0.008], [1.18, 5.5, 0.008]].forEach(([t, a0, r]) => H.add(at(sphere(r, flux, 8), ...sp(t, a0).toArray())));
    return { g };
  } };
})();
