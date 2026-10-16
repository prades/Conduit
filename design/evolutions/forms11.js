// ── THE AMMONITE IN ITS JAR · Nos. 158–162 ────────────────────────────────
// From a mock-up of a glossy black goblet studded with green crystals and a ghostly hand reaching out of it.
// Here the goblet is the creature's jar or shell, and an ammonite-looking cephalopod curls out of the mouth:
// a soft solid-green body with eyes, and tentacles whose tips coil like an ammonite's whorl.
const _gobBlack = new T.MeshStandardMaterial({ color: 0x020203, metalness: 0.7, roughness: 0.22, flatShading: true }); _gobBlack.envMapIntensity = 1.1;
function _creatureMat() { const m = new T.MeshStandardMaterial({ color: 0x021a0e, emissive: new T.Color(EL.color).multiplyScalar(0.28), emissiveIntensity: 1.0, roughness: 0.9, metalness: 0, flatShading: true }); m.envMapIntensity = 0.15; return m; }
function _goblet(o) {   // a faceted bowl on a short stem ending in a point; returns the group and the rim's height
  const g = G(), pts = o.prof.map(p => new T.Vector2(Math.max(0.0001, p[0] * o.w), p[1] * o.h));
  const m = new T.Mesh(new T.LatheGeometry(pts, o.seg || 12), _gobBlack); m.material.side = T.DoubleSide; g.add(m);
  return g;
}
const _PROF_GOBLET = [[0, 0.0], [0.08, 0.04], [0.14, 0.1], [0.12, 0.16], [0.3, 0.24], [0.5, 0.45], [0.58, 0.72], [0.58, 0.8], [0.52, 0.8], [0.5, 0.72], [0.42, 0.46], [0.22, 0.28], [0, 0.26]];
const _PROF_AMPHORA = [[0, 0.0], [0.08, 0.04], [0.16, 0.1], [0.34, 0.3], [0.46, 0.58], [0.34, 0.88], [0.26, 1.0], [0.36, 1.06], [0.3, 1.06], [0.22, 1.0], [0.3, 0.88], [0.4, 0.58], [0.28, 0.3], [0, 0.22]];
const _PROF_BOWL = [[0, 0.0], [0.1, 0.03], [0.34, 0.1], [0.62, 0.32], [0.74, 0.58], [0.72, 0.64], [0.66, 0.64], [0.66, 0.58], [0.56, 0.34], [0.3, 0.14], [0, 0.12]];
function _studs(parent, n, rBelly, y, size, tilt) {   // crystals on the jar's belly, pointing outward and a little down
  for (let i = 0; i < n; i++) { const a = i * TAU / n, big = i === 0, c = hexCrystal(size * (big ? 1.2 : 0.8), size * (big ? 3 : 2), size * (big ? 2 : 1.4), M.crystal);
    const h = G(); h.position.set(Math.sin(a) * rBelly, y + (big ? 0 : 0.04), Math.cos(a) * rBelly); h.rotation.y = a; c.rotation.x = PI / 2 - (tilt || 0.2); c.position.z = size * 1.4; h.add(c); parent.add(h); }
}
function _tentacle(parent, mat, n, r0) {   // a chain of low-poly beads, thinning to the tip; returns the beads
  const beads = []; for (let i = 0; i < n; i++) { const b = new T.Mesh(new T.SphereGeometry(1, 8, 6), mat); b.userData.k = (1 - 0.82 * (i / (n - 1))) * r0; parent.add(b); beads.push(b); } return beads;
}
function _ammonite(o) {
  const g = G(), b = G(); g.add(b); const Y = o.Y;
  const hov = G(); hov.position.y = Y; b.add(hov);
  hov.add(_goblet({ prof: o.prof, w: o.w, h: o.h, seg: o.seg }));
  _studs(hov, o.studs || 7, o.belly, o.studY, o.stud, 0.25);
  const tip = hexCrystal(0.07, 0.12, 0.3, M.crystal); tip.rotation.x = PI; tip.position.y = -0.2; hov.add(tip);   // the point below
  const mat = _creatureMat(), rimY = o.h * o.rim, body = new T.Mesh(new T.IcosahedronGeometry(1, 1), mat); body.scale.set(o.bodyR, o.bodyR * 0.85, o.bodyR); body.position.y = rimY + o.bodyUp; hov.add(body);
  const eyes = []; for (const sx of [-1, 1]) { const e = sphere(0.045, new T.MeshBasicMaterial({ color: 0x021008 }), 8); e.position.set(sx * o.bodyR * 0.42, rimY + o.bodyUp + o.bodyR * 0.15, o.bodyR * 0.78); hov.add(e); eyes.push(e);
    const hi = sphere(0.015, M.glow, 6); hi.position.set(sx * o.bodyR * 0.42 + 0.015, rimY + o.bodyUp + o.bodyR * 0.2, o.bodyR * 0.86); hov.add(hi); }
  const tents = []; for (let i = 0; i < o.tents; i++) tents.push({ beads: _tentacle(hov, mat, o.tn, o.tr), a: i * TAU / o.tents + 0.3, ph: i * 1.3 });
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, Y + o.h, 0.7); b.add(L); LIGHTS.push(L);
  return { g, core: Y + rimY, update(t, act) { const ac = act || 0, ph = 1.6 * t; hov.position.y = Y + bob(t, 0, 0.04);
    body.scale.set(o.bodyR * (1 + 0.03 * Math.sin(ph)), o.bodyR * (0.85 + 0.04 * Math.sin(ph + 1) + 0.06 * ac), o.bodyR * (1 + 0.03 * Math.sin(ph)));
    // Each arm is walked out as a curve: it rises from the rim, leans out, and its heading keeps turning while its steps shorten,
    // so the tip winds into a whorl like an ammonite's. (radial/up in the arm's own plane, a little sway sideways)
    for (const T0 of tents) { const bs = T0.beads, N2 = bs.length, ra = Math.sin(T0.a), rb = Math.cos(T0.a), ta = rb, tb = -ra;
      let r = o.rimR * 0.55, y = rimY + o.bodyUp * 0.4, th = o.th0 + 0.15 * Math.sin(ph + T0.ph) - 0.25 * ac;
      for (let i = 0; i < N2; i++) { const u = i / (N2 - 1), sway = o.sway * Math.sin(ph + T0.ph + u * 2) * u;
        bs[i].position.set(ra * r + ta * sway, y, rb * r + tb * sway); bs[i].scale.setScalar(bs[i].userData.k);
        const step = o.step * (1 - 0.62 * u); r += Math.cos(th) * step; y += Math.sin(th) * step; th -= o.turn * (0.35 + u * 1.3) * (1 + 0.25 * ac) / N2 * 2.4; } } } };
}
const _jarBase = { Y: 0.9, tents: 5, tn: 18, tr: 0.085, th0: 1.25, step: 0.085, turn: 3.2, sway: 0.08, rim: 0.8, bodyUp: 0.05, w: 1, h: 1, seg: 12 };
fx(158, "Ammonite in a goblet.", () => _ammonite(Object.assign({}, _jarBase, { prof: _PROF_GOBLET, belly: 0.5, studY: 0.4, stud: 0.07, rimR: 0.3, bodyR: 0.34, studs: 6, tents: 5 })));
fx(159, "Shy ammonite in an amphora.", () => _ammonite(Object.assign({}, _jarBase, { prof: _PROF_AMPHORA, belly: 0.44, studY: 0.5, stud: 0.065, rimR: 0.18, bodyR: 0.24, bodyUp: 0.0, rim: 1.04, studs: 6, tents: 3, tn: 16, tr: 0.07, th0: 1.35, step: 0.08, turn: 3.6 })));
fx(160, "Ammonite in a wide bowl.", () => _ammonite(Object.assign({}, _jarBase, { prof: _PROF_BOWL, belly: 0.66, studY: 0.36, stud: 0.075, rimR: 0.4, bodyR: 0.4, rim: 0.62, studs: 8, tents: 6, tn: 18, tr: 0.09, th0: 0.95, step: 0.085, turn: 3.0 })));
fx(161, "Tall ammonite, long coiled tentacles.", () => _ammonite(Object.assign({}, _jarBase, { prof: _PROF_GOBLET, belly: 0.5, studY: 0.4, stud: 0.07, rimR: 0.22, bodyR: 0.3, studs: 6, tents: 3, tn: 24, tr: 0.08, th0: 1.4, step: 0.09, turn: 3.8 })));
fx(162, "Ammonite, tentacles draped over the rim.", () => _ammonite(Object.assign({}, _jarBase, { prof: _PROF_GOBLET, belly: 0.5, studY: 0.4, stud: 0.07, rimR: 0.4, bodyR: 0.32, studs: 7, tents: 7, tn: 18, tr: 0.075, th0: 0.55, step: 0.08, turn: 2.6 })));
