// FLUX CELL (Pack 1, flux, Unrefined: +5% maximum HP): a power cell standing upright. A stout steel-capped cylinder: a heavy base cap and a shouldered top cap with an insulated contact nub,
// joined by three riveted steel struts across a clear window band round its middle, through which the violet charge is seen swirling (a twisted helix of three glowing strands round a white-hot
// core rod, the chamber behind it and its floor lit violet); violet-lit seams where the caps grip the glass, a charge gauge of three violet segments on the base cap, flux sparks drifting up off it.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const capM = std('#5d6573', 0.75, 0.3), rimM = std('#a7b0bb', 0.9, 0.24), strutM = std('#8b939e', 0.8, 0.3), nubM = std('#c3cbd6', 0.95, 0.2), slotM = std('#15181d', 0.6, 0.5), insulM = std('#2b2236', 0.2, 0.55);
  const glassM = new T.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.18, metalness: 0, roughness: 0.05, depthWrite: false }); glassM.color = STY.col('#e6dcff'); glassM.envMapIntensity = 1.5;
  const flux = STY.glow('#a35cff', 1.25), fluxHot = STY.glow('#e2c8ff', 1.4), fluxDim = STY.glow('#6a2fd0', 1.2), lilac = STY.glow('#c9a2ff', 1.2);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const flat = (m) => { m.rotation.x = PI / 2; return m; };   // a torus laid level
  // a solid of revolution from a profile [[r, y], ...], its corners kept crisp (each inner point doubled so the normals do not smear round it)
  function lathe(pts, mat, seg) { const v = []; pts.forEach(([r, y], i) => { v.push(new T.Vector2(r, y)); if (i > 0 && i < pts.length - 1) v.push(new T.Vector2(r, y)); }); return new T.Mesh(new T.LatheGeometry(v, seg || 64), mat); }
  function ribbon(pts, r, mat, n) { const c = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2]))); return new T.Mesh(new T.TubeGeometry(c, n || 120, r, 8, false), mat); }
  const Y0 = -0.27, Y1 = 0.19, RW = 0.27;   // the window band: its foot, its head, its radius

  ITEMS.flux_cell = { exposure: 1.0, az: 0.55, el: 0.32, build() {
    const g = G();
    // THE BASE CAP: a heavy bevelled drum, a groove round its foot, a bright collar gripping the glass
    g.add(lathe([[0, -0.52], [0.272, -0.52], [0.3, -0.494], [0.3, -0.3], [0.288, -0.284], [0, -0.284]], capM));
    g.add(at(flat(torus(0.301, 0.007, slotM, 64)), 0, -0.462, 0));
    g.add(at(flat(torus(0.282, 0.024, rimM, 64)), 0, Y0, 0));
    // THE TOP CAP: a drum with a rounded shoulder, a groove, the insulator and the contact nub
    g.add(lathe([[0, Y1 + 0.008], [0.288, Y1 + 0.008], [0.3, Y1 + 0.022], [0.3, 0.33], [0.282, 0.362], [0.2, 0.388], [0.13, 0.395], [0, 0.395]], capM));
    g.add(at(flat(torus(0.301, 0.007, slotM, 64)), 0, 0.3, 0));
    g.add(at(flat(torus(0.282, 0.024, rimM, 64)), 0, Y1, 0));
    g.add(lathe([[0, 0.39], [0.13, 0.39], [0.13, 0.425], [0.115, 0.435], [0, 0.435]], insulM));
    g.add(at(flat(torus(0.124, 0.009, flux, 40)), 0, 0.428, 0));
    g.add(lathe([[0, 0.43], [0.085, 0.43], [0.085, 0.47], [0.068, 0.49], [0, 0.49]], nubM, 32));
    // THE WINDOW: the chamber behind lit violet (an inside wall, seen from any side), its floor glowing from the core, the core's sockets ringed in light
    const lin = new T.CylinderGeometry(RW - 0.015, RW - 0.015, Y1 - Y0, 48, 8, true), lp = lin.attributes.position, lc = new Float32Array(lp.count * 3), A = STY.col('#240b52'), B = STY.col('#7a3ae6'), c = new T.Color();
    for (let i = 0; i < lp.count; i++) { const k = 1 - Math.abs(lp.getY(i)) / ((Y1 - Y0) / 2); c.copy(A).lerp(B, Math.pow(Math.max(0, k), 0.7)); lc[i * 3] = c.r; lc[i * 3 + 1] = c.g; lc[i * 3 + 2] = c.b; }
    lin.setAttribute('color', new T.BufferAttribute(lc, 3));
    g.add(at(new T.Mesh(lin, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide, toneMapped: false })), 0, (Y0 + Y1) / 2, 0));
    const fl = new T.CircleGeometry(RW - 0.014, 48), fp = fl.attributes.position, fc = new Float32Array(fp.count * 3), F0 = STY.col('#8a4dff'), F1 = STY.col('#1c0942');
    for (let i = 0; i < fp.count; i++) { c.copy(F0).lerp(F1, Math.min(1, Math.hypot(fp.getX(i), fp.getY(i)) / (RW - 0.014))); fc[i * 3] = c.r; fc[i * 3 + 1] = c.g; fc[i * 3 + 2] = c.b; }
    fl.setAttribute('color', new T.BufferAttribute(fc, 3));
    const floor = new T.Mesh(fl, new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); floor.rotation.x = -PI / 2; g.add(at(floor, 0, Y0 + 0.004, 0));   // the chamber's floor, lit from the core
    for (const y of [Y0 + 0.012, Y1 - 0.012]) { g.add(at(flat(torus(0.06, 0.012, fluxHot, 32)), 0, y, 0)); g.add(at(cyl(0.05, 0.05, 0.02, slotM, 24), 0, y, 0)); }
    // the charge: a twisted helix of three violet strands, fattest at its middle, round a white-hot core rod
    for (let s = 0; s < 3; s++) {
      const pts = []; for (let i = 0; i <= 60; i++) { const t = i / 60, a = s * TAU / 3 + t * TAU * 2.1, r = 0.07 + 0.085 * Math.sin(PI * t); pts.push([r * Math.sin(a), Y0 + 0.02 + t * (Y1 - Y0 - 0.04), r * Math.cos(a)]); }
      g.add(ribbon(pts, s === 0 ? 0.016 : 0.013, s === 0 ? lilac : flux));
    }
    g.add(at(cyl(0.024, 0.024, Y1 - Y0 - 0.02, fluxHot, 12), 0, (Y0 + Y1) / 2, 0));
    g.add(at(new T.Mesh(new T.CylinderGeometry(RW, RW, Y1 - Y0, 48, 1, true), glassM), 0, (Y0 + Y1) / 2, 0));
    // the seams: violet light where the glass meets each collar
    g.add(at(flat(torus(RW + 0.002, 0.009, flux, 64)), 0, Y0 + 0.028, 0));
    g.add(at(flat(torus(RW + 0.002, 0.009, flux, 64)), 0, Y1 - 0.028, 0));
    // THE STRUTS: three steel bars across the window, riveted to the caps
    for (const a of [0.55 - 1.2, 0.55 + 1.2, 0.55 + PI]) {
      const q = G(); q.rotation.y = a; g.add(q);
      q.add(at(cbox(0.06, Y1 - Y0 + 0.06, 0.04, 0.012, strutM), 0, (Y0 + Y1) / 2, RW + 0.018));
      for (const y of [Y0 - 0.005, Y1 + 0.005]) q.add(at(flat(cyl(0.016, 0.016, 0.02, nubM, 10)), 0, y, RW + 0.04));
    }
    // THE CHARGE GAUGE on the base cap: a dark slot with three violet segments, facing the viewer
    const gauge = G(); gauge.rotation.y = 0.32; gauge.position.y = -0.395; g.add(gauge);
    gauge.add(at(cbox(0.21, 0.11, 0.03, 0.008, slotM), 0, 0, 0.296));
    for (let i = 0; i < 3; i++) gauge.add(at(cbox(0.048, 0.072, 0.014, 0.003, i === 2 ? fluxHot : flux), (i - 1) * 0.062, 0, 0.312));
    // FLUX SPARKS drifting off it
    const motes = [[0.37, 0.06, 0.2, 0.016, 1], [-0.33, -0.06, 0.26, 0.013, 0], [0.2, 0.52, 0.22, 0.015, 1], [-0.17, 0.54, 0.18, 0.012, 2], [0.33, 0.42, 0.05, 0.011, 0],
                   [-0.31, 0.36, 0.2, 0.009, 1], [0.05, 0.6, 0.18, 0.011, 2], [0.4, -0.22, 0.08, 0.01, 0], [0.15, 0.62, 0.08, 0.008, 1], [-0.08, 0.64, 0.1, 0.007, 0], [0.27, 0.58, 0.04, 0.008, 0]];
    motes.forEach(([x, y, z, r, k]) => g.add(at(sphere(r, k === 2 ? fluxHot : k === 1 ? flux : fluxDim, 8), x, y, z)));
    return { g };
  } };
})();
