// VORTEX CORE (Pack 1, flux, Refined: +10% maximum HP): a flux core held in a gyroscopic cage. A dark steel sphere with a violet vortex at its heart (three spiral arms winding down into a
// white-hot eye, the well round it glowing deeper violet toward its steel bezel), slung on an axle inside three nested gimbal rings, each a bevelled steel band with a violet-lit inlay, pinned to the
// next at its pivots; the outer ring stands on a short pedestal with a violet-lit collar; flux motes orbit the cage on a tilted path.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const ringA = std('#8b939e', 0.85, 0.28), ringB = std('#6b737e', 0.85, 0.3), ringC = std('#a7b0bb', 0.9, 0.26), pinM = std('#c3cbd6', 0.95, 0.2), shellM = std('#262a33', 0.8, 0.28);
  const baseM = std('#59606c', 0.8, 0.32);
  const flux = STY.glow('#a35cff', 1.25), fluxHot = STY.glow('#e2c8ff', 1.4), fluxDim = STY.glow('#6a2fd0', 1.2), white = STY.glow('#ffffff', 1.6);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z), Yv = V(0, 1, 0), Zv = V(0, 0, 1);
  const face = (o, n) => { o.quaternion.setFromUnitVectors(Zv, n.clone().normalize()); return o; };
  const flat = (m) => { m.rotation.x = PI / 2; return m; };   // a torus laid level
  function lathe(pts, mat, seg) { const v = []; pts.forEach(([r, y], i) => { v.push(new T.Vector2(r, y)); if (i > 0 && i < pts.length - 1) v.push(new T.Vector2(r, y)); }); return new T.Mesh(new T.LatheGeometry(v, seg || 64), mat); }
  function ribbon(pts, r, mat, n) { const c = new T.CatmullRomCurve3(pts.map(p => p.isVector3 ? p : V(p[0], p[1], p[2]))); return new T.Mesh(new T.TubeGeometry(c, n || 48, r, 8, false), mat); }
  // a gimbal ring: a flat band of mean radius R, radial thickness t, width w across its axis (+z), bevelled
  function band(R, t, w, mat) {
    const b = Math.min(t, w) * 0.22, s = new T.Shape(); s.absarc(0, 0, R + t / 2 - b, 0, TAU, false); const h = new T.Path(); h.absarc(0, 0, R - t / 2 + b, 0, TAU, true); s.holes.push(h);
    const geo = new T.ExtrudeGeometry(s, { depth: w - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 120 }); geo.translate(0, 0, -(w - 2 * b) / 2);
    return new T.Mesh(geo, mat);
  }
  // a rod along the unit vector a from radius r0 to r1
  function rod(a, r0, r1, rad, mat) { const m = cyl(rad, rad, r1 - r0, mat, 14); m.quaternion.setFromUnitVectors(Yv, a); m.position.copy(a).multiplyScalar((r0 + r1) / 2); return m; }
  const AZ = 0.55, EL = 0.33, view = V(Math.sin(AZ) * Math.cos(EL), Math.sin(EL), Math.cos(AZ) * Math.cos(EL));

  ITEMS.vortex_core = { exposure: 1.0, az: AZ, el: EL, build() {
    const g = G();
    const RS = 0.25, T0 = 0.045, W0 = 0.075, R = [0.52, 0.43, 0.345];   // the sphere; the rings' thickness, width and radii (outer, middle, inner)
    // THE GIMBAL: the outer ring turns on the vertical, the middle one on a level axis across the outer, the inner one across the middle, the core's axle across the inner
    // (angles chosen so that, from the hero camera, the middle and inner rings pass round the core, not across its face)
    const bA = -0.1, nA = V(Math.sin(bA), 0, Math.cos(bA)), aB = V(Math.cos(bA), 0, -Math.sin(bA));
    const nB = nA.clone().applyAxisAngle(aB, -1.3), aC = nB.clone().cross(aB).normalize(), nC = nB.clone().applyAxisAngle(aC, 0.8), aD = nC.clone().cross(aC).normalize();
    [[R[0], nA, ringA], [R[1], nB, ringB], [R[2], nC, ringC]].forEach(([r, n, m]) => {
      const q = face(G(), n); g.add(q);
      q.add(band(r, T0, W0, m));
      for (const s of [-1, 1]) q.add(at(torus(r, 0.008, flux, 120), 0, 0, s * (W0 / 2 + 0.001)));   // a violet inlay in each face
      q.add(torus(r + T0 / 2 + 0.002, 0.006, fluxDim, 120));                                         // and round its rim
    });
    // the pivots: a pin from each ring to the next, a boss on the outside of each
    [[aB, R[1], R[0]], [aC, R[2], R[1]], [aD, RS - 0.02, R[2]]].forEach(([a, r0, r1], i) => {
      for (const s of [-1, 1]) {
        const d = a.clone().multiplyScalar(s);
        g.add(rod(d, r0 + (i === 2 ? 0 : T0 / 2), r1 - T0 / 2, 0.022, pinM));
        g.add(rod(d, r1 + T0 / 2 - 0.004, r1 + T0 / 2 + 0.03, 0.036, pinM));
      }
    });
    // the outer ring's own pivots: a finial on top, the post down into the pedestal
    g.add(rod(Yv, R[0] + T0 / 2 - 0.004, R[0] + T0 / 2 + 0.04, 0.04, baseM)); g.add(at(sphere(0.03, pinM, 16), 0, R[0] + T0 / 2 + 0.05, 0)); g.add(at(sphere(0.013, fluxHot, 8), 0, R[0] + T0 / 2 + 0.083, 0));
    g.add(rod(V(0, -1, 0), R[0] + T0 / 2 - 0.004, 0.66, 0.032, pinM));
    // THE PEDESTAL: a stepped round base, a violet-lit collar
    g.add(lathe([[0, -0.8], [0.25, -0.8], [0.27, -0.78], [0.27, -0.75], [0.25, -0.735], [0.15, -0.72], [0.12, -0.7], [0.075, -0.69], [0.07, -0.66], [0, -0.66]], baseM));
    g.add(at(flat(torus(0.258, 0.01, flux, 64)), 0, -0.744, 0));
    g.add(at(flat(torus(0.077, 0.012, pinM, 32)), 0, -0.665, 0));
    // THE CORE: the dark sphere; the vortex facing the viewer: its glowing well, the spiral arms, the eye, the bezel
    const core = G(); g.add(core);
    core.add(sphere(RS, shellM, 48));
    const pole = view.clone().add(V(-0.06, 0.02, 0)).normalize(), u = Yv.clone().cross(pole).normalize(), w = pole.clone().cross(u).normalize();
    const onS = (r, phi, th) => pole.clone().multiplyScalar(r * Math.cos(phi)).addScaledVector(u, r * Math.sin(phi) * Math.cos(th)).addScaledVector(w, r * Math.sin(phi) * Math.sin(th));
    const PH = 0.92;   // the well's angular radius on the sphere
    const bezel = face(torus(RS * Math.sin(PH), 0.017, pinM, 72), pole); bezel.position.copy(pole.clone().multiplyScalar(RS * Math.cos(PH))); core.add(bezel);
    const cg = new T.SphereGeometry(RS + 0.003, 48, 16, 0, TAU, 0, PH), cp = cg.attributes.position, cc = new Float32Array(cp.count * 3), E0 = STY.col('#8a4dff'), E1 = STY.col('#1e0848'), c = new T.Color();
    for (let i = 0; i < cp.count; i++) { const k = Math.acos(Math.min(1, cp.getY(i) / (RS + 0.003))) / PH; c.copy(E0).lerp(E1, Math.pow(k, 0.8)); cc[i * 3] = c.r; cc[i * 3 + 1] = c.g; cc[i * 3 + 2] = c.b; }
    cg.setAttribute('color', new T.BufferAttribute(cc, 3));
    const cap = new T.Mesh(cg, new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); cap.quaternion.setFromUnitVectors(Yv, pole); core.add(cap);
    for (let k = 0; k < 3; k++) {
      const arm = (t0, t1, r, m) => { const pts = []; for (let i = 0; i <= 16; i++) { const t = t0 + (t1 - t0) * i / 16; pts.push(onS(RS + 0.007, 0.07 + t * (PH - 0.13), k * TAU / 3 + t * 3.6)); } core.add(ribbon(pts, r, m)); };
      arm(0, 0.36, 0.02, fluxHot); arm(0.34, 0.7, 0.016, flux); arm(0.68, 1, 0.011, fluxDim);
    }
    core.add(at(sphere(0.042, white, 16), ...pole.clone().multiplyScalar(RS - 0.006).toArray()));
    // ORBITING MOTES: a faint path round the cage, tilted, with bright motes riding it
    const nO = V(-0.5, 1, 0.12).normalize(), RO = 0.6, orb = face(torus(RO, 0.004, fluxDim, 160), nO); g.add(orb);
    const oU = V(1, 0, 0).applyQuaternion(orb.quaternion), oW = V(0, 1, 0).applyQuaternion(orb.quaternion), onO = th => oU.clone().multiplyScalar(RO * Math.cos(th)).addScaledVector(oW, RO * Math.sin(th));
    [[0.35, 0.022, fluxHot], [1.45, 0.016, flux], [2.55, 0.018, fluxHot], [3.75, 0.016, flux], [4.9, 0.02, fluxHot], [5.6, 0.012, flux]].forEach(([th, r, m]) => {
      g.add(at(sphere(r, m, 12), ...onO(th).toArray()));
      const tr = []; for (let i = 0; i <= 6; i++) tr.push(onO(th - i * 0.045).multiplyScalar(1.001)); g.add(ribbon(tr, r * 0.55, flux, 12));
    });
    return { g };
  } };
})();
