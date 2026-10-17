// ── THE SAUCER · Nos. 661–: a sleek black flying-saucer body, a ring of lights that chase round its rim, and mechanical legs it walks on. ──
const _saucerHull = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.15, roughness: 0.75, flatShading: true }); _saucerHull.envMapIntensity = 0.18;
const _saucerLeg = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.15, roughness: 0.75, flatShading: true }); _saucerLeg.envMapIntensity = 0.18;   // the same black as the hull
function _curvyLeg(o, b) {   // a leg built as a chain of short segments laid along two curves (thigh, shin), with ribs, joint collars, an optional piston and a foot clamp
  const M = o.curveSeg || 6, N = M * 2, segs = [], ribs = [], collars = [];
  for (let i = 0; i < N; i++) { const sg = _bone(null, null, o.legR, o.legR * 0.8, _saucerLeg); b.add(sg); segs.push(sg); }
  for (let i = 1; i < N; i += 3) { const rb = new T.Mesh(new T.CylinderGeometry(1, 1, 0.01, 8), _saucerLeg); b.add(rb); ribs.push({ rb, i }); }
  for (let i = 0; i < 3; i++) { const cl = new T.Mesh(new T.CylinderGeometry(1, 1, 0.05, 8), _saucerHull); b.add(cl); collars.push(cl); }   // hip, knee, ankle
  const piston = o.piston ? new T.Mesh(new T.CylinderGeometry(o.legR * 0.35, o.legR * 0.35, 1, 5), _saucerLeg) : null; if (piston) b.add(piston);
  const foot = new T.Mesh(new T.SphereGeometry(o.legR * 1.6, 8, 6), _saucerLeg); foot.scale.y = 0.6; b.add(foot);
  // JAGGED FOREARMS: a row of sharp black spikes along the shin (the forearm, below the knee), alternating sides and swept back, and a pair at the knee joint
  const spikes = []; if (o.jag) { const J = o.jag; for (let k = 0; k < J.n; k++) { const sp = new T.Mesh(new T.ConeGeometry(J.r * (1 - 0.35 * k / J.n), J.len * (1.1 - 0.5 * k / J.n), 4, 1), _saucerLeg); sp.geometry.translate(0, J.len * 0.5, 0); b.add(sp); spikes.push({ sp, k, side: k % 2 ? 1 : -1, knee: false }); }
    for (let k = 0; k < 2; k++) { const sp = new T.Mesh(new T.ConeGeometry(J.r * 1.5, J.len * 1.5, 4, 1), _saucerLeg); sp.geometry.translate(0, J.len * 0.75, 0); b.add(sp); spikes.push({ sp, k, side: k ? 1 : -1, knee: true }); } }
  const pts = []; for (let i = 0; i <= N; i++) pts.push(new T.Vector3());
  const bez = (a, c, d, u, out) => out.set((1 - u) * (1 - u) * a.x + 2 * (1 - u) * u * c.x + u * u * d.x, (1 - u) * (1 - u) * a.y + 2 * (1 - u) * u * c.y + u * u * d.y, (1 - u) * (1 - u) * a.z + 2 * (1 - u) * u * c.z + u * u * d.z);
  const c1 = new T.Vector3(), c2 = new T.Vector3(), up = new T.Vector3(0, 1, 0);
  return { foot, set(hip, knee, ft, out) {
    c1.copy(hip).add(knee).multiplyScalar(0.5).addScaledVector(out, o.bulge1); c2.copy(knee).add(ft).multiplyScalar(0.5).addScaledVector(out, o.bulge2);
    for (let i = 0; i <= M; i++) bez(hip, c1, knee, i / M, pts[i]);
    for (let i = 1; i <= M; i++) bez(knee, c2, ft, i / M, pts[M + i]);
    for (let i = 0; i < N; i++) { _setBone(segs[i], pts[i], pts[i + 1]); const u = i / N, r = 1 - 0.55 * u; segs[i].scale.x = segs[i].scale.z = r; }
    ribs.forEach(({ rb, i }) => { const d = new T.Vector3().subVectors(pts[Math.min(N, i + 1)], pts[Math.max(0, i - 1)]).normalize(); rb.position.copy(pts[i]); rb.quaternion.setFromUnitVectors(up, d); rb.scale.set(o.legR * 1.45 * (1 - 0.4 * i / N), 1, o.legR * 1.45 * (1 - 0.4 * i / N)); });
    const cp = [pts[0], pts[M], pts[N]]; collars.forEach((cl, k) => { const a = pts[Math.max(0, [0, M, N][k] - 1)], bb = pts[Math.min(N, [0, M, N][k] + 1)], d = new T.Vector3().subVectors(bb, a).normalize(); cl.position.copy(cp[k]); cl.quaternion.setFromUnitVectors(up, d); const w = o.legR * (k === 1 ? 1.7 : 1.4); cl.scale.set(w, 1, w); });
    if (piston) { const a = pts[1].clone().addScaledVector(out, -0.06), bb = pts[M + 1].clone().addScaledVector(out, -0.06); _setBone(piston, a, bb); }
    spikes.forEach(Sk => { const J = o.jag, idx = Sk.knee ? M : M + 1 + Math.floor(Sk.k * (M - 1) / Math.max(1, J.n - 1)), i0 = Math.min(N, idx), a = pts[Math.max(0, i0 - 1)], bb = pts[Math.min(N, i0 + 1)], d = new T.Vector3().subVectors(bb, a).normalize(), side = new T.Vector3().crossVectors(d, up).normalize().multiplyScalar(Sk.side), dir = side.clone().multiplyScalar(0.8).addScaledVector(out, 0.5).addScaledVector(d, Sk.knee ? -0.2 : -(J.sweep == null ? 0.55 : J.sweep)).normalize();
      Sk.sp.position.copy(pts[i0]); Sk.sp.quaternion.setFromUnitVectors(up, dir); });
    foot.position.copy(ft); } };
}
function _saucer(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1.3);
  const body = G(); b.add(body);
  const R = o.R, k = o.sy || 1;
  // the disc: a lens, with a low dome on top (opaque dark metal: a hatch and a lamp, no glass)
  const prof = [[0.0, 0.0], [R * 0.35, 0.02], [R * 0.9, 0.08 * k], [R, 0.13 * k], [R * 0.95, 0.18 * k], [R * 0.55, 0.27 * k], [R * 0.3, 0.3 * k], [0.0, 0.3 * k]].map(p => new T.Vector2(Math.max(0.0001, p[0]), p[1]));
  const hull = new T.Mesh(new T.LatheGeometry(prof, o.segs || 24), _saucerHull); body.add(hull);
  const gl = o.glass, dome = new T.Mesh(new T.SphereGeometry(o.domeR, 28, 14, 0, TAU, 0, PI / 2), gl ? new T.MeshStandardMaterial({ color: gl.col || 0x2a3a58, metalness: 0.0, roughness: 0.06, transparent: true, opacity: gl.opacity || 0.3, depthWrite: false }) : _saucerHull); if (gl) dome.material.envMapIntensity = 2.0; dome.scale.y = gl ? (gl.tall || 0.8) : 0.75; dome.position.y = 0.29 * k; dome.renderOrder = 6; body.add(dome);
  // what shows through the glass: a dark inner deck with a ring of dim light, and a soft haze; nothing bright and no crystal
  let haze = null, plasma = null; if (gl) { const deck = new T.Mesh(new T.CylinderGeometry(o.domeR * 0.97, o.domeR * 0.97, 0.03, 24), _saucerHull); deck.position.y = 0.29 * k + 0.02; body.add(deck);
    const dring = new T.Mesh(new T.TorusGeometry(o.domeR * 0.8, 0.012, 4, 24), new T.MeshBasicMaterial({ color: 0x3a3000, toneMapped: false })); dring.rotation.x = PI / 2; dring.position.y = 0.29 * k + 0.04; body.add(dring); haze = dring;
    if (gl.plasma) { plasma = new T.Mesh(new T.SphereGeometry(o.domeR * 0.42, 14, 10), new T.MeshBasicMaterial({ color: 0xffe27a, transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false })); plasma.position.y = 0.29 * k + o.domeR * 0.32; plasma.renderOrder = 5; body.add(plasma); }
    if (gl.mist) { const hs = glowSprite(o.domeR * 2.2); hs.material = hs.material.clone(); hs.material.opacity = 0.22; hs.position.y = 0.29 * k + o.domeR * 0.3; hs.renderOrder = 5; body.add(hs); haze = hs; }
    // the dome's frame: a dark collar at its base and meridian ribs
    const col = new T.Mesh(new T.TorusGeometry(o.domeR, 0.035, 6, 28), _saucerHull); col.rotation.x = PI / 2; col.position.y = 0.29 * k; body.add(col);
    for (let i = 0; i < (gl.ribs == null ? 4 : gl.ribs); i++) { const a = i * PI / (gl.ribs == null ? 4 : gl.ribs), rib = new T.Mesh(new T.TorusGeometry(o.domeR * 1.005, 0.014, 4, 24, PI), _saucerHull); rib.scale.y = dome.scale.y; rib.rotation.y = a; rib.position.y = 0.29 * k; body.add(rib); } }
  const beacon = new T.Mesh(_litFacets(new T.OctahedronGeometry(0.06, 0), 1), new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); beacon.scale.y = 1.5; beacon.position.y = 0.29 * k + o.domeR * 0.75 + 0.07; if (o.beacon) body.add(beacon);   // (the dome's crystal is off: "no central crystal")
  // belly: a dark ring and a dim plate underneath
  const belly = new T.Mesh(new T.TorusGeometry(R * 0.45, 0.025, 5, o.segs || 24), _saucerLeg); belly.rotation.x = PI / 2; belly.position.y = -0.0; body.add(belly);
  // the rim lights: a ring of small lamps; the lit ones chase round it
  const lamps = []; for (let i = 0; i < o.nLamps; i++) { const a = i * TAU / o.nLamps, mat = new T.MeshBasicMaterial({ color: 0x3a3000, toneMapped: false }), lp = new T.Mesh(new T.BoxGeometry(0.075, 0.05, 0.075), mat); lp.position.set(Math.sin(a) * R * 1.0, 0.145 * k, Math.cos(a) * R * 1.0); lp.rotation.y = a; body.add(lp); lamps.push({ lp, mat, i }); }
  if (o.bellyBand) for (let i = 0; i < o.nLamps; i++) { const a = i * TAU / o.nLamps + TAU / o.nLamps / 2, mat = new T.MeshBasicMaterial({ color: 0x3a3000, toneMapped: false }), lp = new T.Mesh(new T.BoxGeometry(0.06, 0.04, 0.06), mat); lp.position.set(Math.sin(a) * R * 0.92, 0.075 * k, Math.cos(a) * R * 0.92); lp.rotation.y = a; body.add(lp); lamps.push({ lp, mat, i: i + 3 }); }
  const rimBand = new T.Mesh(new T.TorusGeometry(R * 0.985, 0.014, 4, o.segs || 24), _saucerLeg); rimBand.rotation.x = PI / 2; rimBand.position.y = 0.105 * k; body.add(rimBand);
  // the legs: hip under the disc, thigh, knee, shin, a round foot; the foot walks a loop and the leg follows it
  const legs = []; for (let i = 0; i < o.legs; i++) { const a = i * TAU / o.legs + (o.legRot || 0); if (o.curved) { legs.push({ a, cv: _curvyLeg(o, b), ph: (o.legs === 3 ? i * TAU / 3 : (i % 2 ? PI : 0)) + (o.legPh || 0) }); continue; } const th = _bone(null, null, o.legR, o.legR * 0.8, _saucerLeg), sh = _bone(null, null, o.legR * 0.8, o.legR * 0.35, _saucerLeg), kn = new T.Mesh(new T.IcosahedronGeometry(o.legR * 1.2, 0), _saucerLeg), ft = new T.Mesh(new T.SphereGeometry(o.legR * 1.5, 8, 6), _saucerLeg); ft.scale.y = 0.6; b.add(th); b.add(sh); b.add(kn); b.add(ft); legs.push({ a, th, sh, kn, ft, ph: (o.legs === 3 ? i * TAU / 3 : (i % 2 ? PI : 0)) + (o.legPh || 0) }); }
  const L = new T.PointLight(0xffffff, 0.4, 3.5, 2); L.color.set(EL.color); L.position.set(0, 0.6, 0.4); b.add(L); LIGHTS.push(L);
  const glow = _glowPool(R * 0.8, 0.02); if (o.pool) b.add(glow.g);
  const U1 = new T.Vector3(), U2 = new T.Vector3(), U3 = new T.Vector3();
  return { g, core: (o.hipH + 0.2) * (o.S || 1.3), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    body.position.y = o.hipH + 0.015 * Math.sin(ph * 2) - 0.05 * ac; body.rotation.z = 0.025 * Math.sin(ph); body.rotation.x = 0.03 * Math.sin(ph * 2) + 0.06 * ac;
    // chase: the pattern is "on, on, off, off" round the rim, advanced one lamp a step; the loop is a whole number of repeats so it closes
    const step = Math.floor(((ph / TAU) * o.chase) + 0.0001) , rate = 1 + 3 * ac;
    lamps.forEach(Lp => { const pos = (Lp.i + Math.floor(ph / TAU * o.chase * rate)) % 4, on = pos < 2 ? 1 : 0, lit = on * (0.7 + 0.3 * Math.sin(ph * 4 + Lp.i)) + 0.25 * ac; Lp.mat.color.setRGB(0.23 + 0.77 * lit, 0.19 + 0.78 * lit, 0.0 + 0.45 * lit * lit); });
    if (plasma) { plasma.material.opacity = 0.25 + 0.15 * Math.sin(ph * 3) + 0.3 * ac; plasma.scale.setScalar(1 + 0.12 * Math.sin(ph * 2) + 0.3 * ac); plasma.rotation.y = ph; }
    if (haze && haze.material && haze.material.opacity !== undefined && o.glass && o.glass.mist) haze.material.opacity = 0.16 + 0.1 * Math.sin(ph * 2) + 0.25 * ac;
    beacon.scale.setScalar(1 + 0.3 * Math.sin(ph * 3) + 0.6 * ac); beacon.scale.y *= 1.5; L.intensity = 0.4 + 0.8 * ac; if (o.pool) { glow.m.material.opacity = 0.2 + 0.2 * Math.sin(ph * 2) + 0.3 * ac; }
    const hipY = body.position.y + 0.02, stride = o.stride * (1 + 0.3 * ac), lift = o.lift;
    legs.forEach(Lg => { const cyc = ph + Lg.ph, hx = Math.sin(Lg.a) * R * o.hipR, hz = Math.cos(Lg.a) * R * o.hipR, fx0 = Math.sin(Lg.a) * R * o.footR, fz0 = Math.cos(Lg.a) * R * o.footR;
      const fx = fx0, fz = fz0 + stride * Math.cos(cyc), fy = 0.03 + Math.max(0, Math.sin(cyc)) * lift;
      const hip = U1.set(hx, hipY + (o.hipUp || 0), hz), foot = U2.set(fx, fy, fz), A = o.legH * 0.6, Bn = o.legH * 0.68, d = hip.distanceTo(foot), c = Math.max(0.05, Math.min(A + Bn - 0.001, d)), kk = Math.acos(Math.max(-1, Math.min(1, (A * A + c * c - Bn * Bn) / (2 * A * c))));
      const mid = U3.copy(hip).add(foot).multiplyScalar(0.5), dir = new T.Vector3().subVectors(foot, hip).normalize(), out = new T.Vector3(Math.sin(Lg.a) * (o.kneeOut == null ? 1 : o.kneeOut), o.kneeUp == null ? 0.9 : o.kneeUp, Math.cos(Lg.a) * (o.kneeOut == null ? 1 : o.kneeOut)).normalize(); out.addScaledVector(dir, -out.dot(dir)).normalize();
      const knee = mid.clone().addScaledVector(out, Math.sin(kk) * A * 0.95);
      if (Lg.cv) { Lg.cv.set(hip.clone(), knee.clone(), foot.clone(), out.clone()); return; }
      _setBone(Lg.th, hip, knee); _setBone(Lg.sh, knee, foot); Lg.kn.position.copy(knee); Lg.ft.position.copy(foot); }); } };
}
const _sc0 = { S: 1.3, R: 0.95, domeR: 0.3, nLamps: 16, chase: 8, legs: 4, legR: 0.045, legH: 0.8, hipH: 0.55, hipR: 0.6, footR: 1.05, stride: 0.14, lift: 0.14 };
fx(661, "A sleek black saucer: a lens-shaped hull with a low dome and a lit beacon, sixteen rim lights chasing round it two on, two off, and four mechanical legs it walks on.", () => _saucer(Object.assign({}, _sc0)));
fx(662, "A tripod lander: a wider, flatter saucer on three long jointed legs with a tripod gait.", () => _saucer(Object.assign({}, _sc0, { legs: 3, legH: 0.95, hipH: 0.7, R: 1.05, sy: 0.8, hipR: 0.55, footR: 1.15, legR: 0.05, stride: 0.16 })));
fx(663, "A spider saucer: six thin legs, a smaller disc, more of the insect about it.", () => _saucer(Object.assign({}, _sc0, { legs: 6, legR: 0.032, legH: 0.85, R: 0.85, hipR: 0.62, footR: 1.2, nLamps: 14, stride: 0.1 })));
fx(664, "Low and heavy: short stout legs and a tractor glow on the ground beneath the disc.", () => _saucer(Object.assign({}, _sc0, { legH: 0.55, hipH: 0.4, legR: 0.07, stride: 0.1, lift: 0.1, pool: true, R: 1.0, sy: 1.2 })));
fx(665, "Sleek and tall: a taller, more pointed lens hull and long slim legs, the lights in a fast chase.", () => _saucer(Object.assign({}, _sc0, { sy: 1.6, legH: 0.95, hipH: 0.75, legR: 0.038, chase: 16, nLamps: 20, R: 0.9, domeR: 0.26 })));

// ── The legs curved, still mechanical (Nos. 666–670): each leg is a chain of ribbed segments along two arcs, with collars at hip, knee and ankle ──
const _scv = Object.assign({}, _sc0, { curved: true, bulge1: 0.34, bulge2: -0.2, curveSeg: 9, legR: 0.045 });
fx(666, "Curved mechanical legs: each a smooth bow out from the disc and back in to the foot, ribbed along its length, with collars at the hip, knee and ankle.", () => _saucer(Object.assign({}, _scv)));
fx(667, "An S-curve: the thigh arcs up and out, the shin curls back in, with a piston rod running alongside.", () => _saucer(Object.assign({}, _scv, { bulge1: 0.46, bulge2: -0.4, piston: true, legH: 0.95, hipH: 0.66 })));
fx(668, "Reverse knees, like a raptor's: the legs bend backward in a hook, thick and sprung, with a clamp for a foot.", () => _saucer(Object.assign({}, _scv, { bulge1: -0.3, bulge2: 0.45, legR: 0.05, legH: 0.9 })));
fx(669, "Six thin curved legs, strongly arched like a spider's, many fine ribs.", () => _saucer(Object.assign({}, _scv, { legs: 6, legR: 0.03, bulge1: 0.5, bulge2: -0.22, curveSeg: 9, R: 0.85, hipR: 0.62, footR: 1.25, nLamps: 14, stride: 0.1 })));
fx(670, "Heavy hydraulic legs: thick and gently curved, with an exposed piston along each and a lit knee.", () => _saucer(Object.assign({}, _scv, { legR: 0.065, bulge1: 0.22, bulge2: -0.12, piston: true, legH: 0.75, hipH: 0.52, sy: 1.2, R: 1.0, stride: 0.1 })));

// ── BUG LEGS (Nos. 671–675): up, then curved down, like an insect's: the hip on the rim, the knee raised high above the disc, the shin arching down to the ground ──
const _sbug = Object.assign({}, _sc0, { S: 1.0, curved: true, curveSeg: 9, legR: 0.05, bulge1: 0.12, bulge2: 0.1, kneeUp: 1.0, kneeOut: 0.3, hipUp: 0.12, hipR: 0.92, footR: 1.3, legH: 1.15, hipH: 0.42, stride: 0.14, lift: 0.14 });
fx(671, "Bug legs: four ribbed mechanical legs that rise up and out of the rim to a high knee above the disc, then curve down to the ground.", () => _saucer(Object.assign({}, _sbug)));
fx(672, "Six insect legs, a smaller saucer, the knees held high, a quick scuttling gait.", () => _saucer(Object.assign({}, _sbug, { legs: 6, R: 0.85, legR: 0.04, legH: 1.1, footR: 1.3, nLamps: 14, stride: 0.1 })));
fx(673, "Eight spider legs, the knees arching very high, thin and long.", () => _saucer(Object.assign({}, _sbug, { legs: 8, R: 0.8, legR: 0.034, legH: 1.2, kneeUp: 1.2, footR: 1.4, nLamps: 12, stride: 0.08 })));
fx(674, "Mantis legs: four, long, thin, the highest arch, the shins long and hooked at the ends.", () => _saucer(Object.assign({}, _sbug, { legR: 0.042, legH: 1.3, kneeUp: 1.3, footR: 1.2, hipH: 0.5, bulge2: 0.25 })));
fx(675, "Beetle legs: six, thick, low arches and short shins, a heavy scuttling crawler.", () => _saucer(Object.assign({}, _sbug, { legs: 6, legR: 0.062, legH: 0.9, kneeUp: 0.7, footR: 1.25, hipH: 0.34, sy: 1.2, piston: true, stride: 0.1 })));

// ── Legs the same black as the body, with jagged forearms (Nos. 676–680) ──
const _sjag = Object.assign({}, _sbug, { jag: { n: 5, len: 0.2, r: 0.03, sweep: 0.55 } });
fx(676, "Bug legs in the hull's own black, a row of sharp black spikes along each forearm (the shin below the knee), alternating sides and swept back, and a pair at the knee.", () => _saucer(Object.assign({}, _sjag)));
fx(677, "Longer, sparser spines: fewer but bigger blades along each forearm, like a mantis's raptorial arm.", () => _saucer(Object.assign({}, _sjag, { jag: { n: 3, len: 0.34, r: 0.04, sweep: 0.7 }, legs: 4 })));
fx(678, "Dense saw-teeth along the forearm: many small sharp teeth, a barbed look.", () => _saucer(Object.assign({}, _sjag, { jag: { n: 9, len: 0.12, r: 0.022, sweep: 0.5 } })));
fx(679, "Six legs, each forearm jagged with medium spikes, a smaller saucer.", () => _saucer(Object.assign({}, _sjag, { legs: 6, R: 0.85, legR: 0.04, legH: 1.1, nLamps: 14, jag: { n: 5, len: 0.2, r: 0.03, sweep: 0.55 } })));
fx(680, "Heavy: thick beetle legs, wide jagged forearms with large blunt-based spikes.", () => _saucer(Object.assign({}, _sjag, { legs: 6, legR: 0.06, legH: 0.9, kneeUp: 0.7, hipH: 0.34, sy: 1.2, jag: { n: 4, len: 0.24, r: 0.05, sweep: 0.5 } })));

// ── A bigger centre with the glass exposed (Nos. 681–685): the dome grown large, clear glass over a dark inner deck, ribbed frame; the legs as 676 ──
const _sgl = Object.assign({}, _sjag, { domeR: 0.52 });
fx(681, "676 with the centre grown big: a large glass dome over a dark inner deck with a ring of dim light, a ribbed frame, nothing inside it.", () => _saucer(Object.assign({}, _sgl, { glass: { opacity: 0.3 } })));
fx(682, "A faint glowing haze inside the glass, like a held breath of light.", () => _saucer(Object.assign({}, _sgl, { glass: { opacity: 0.3, mist: true } })));
fx(683, "A small ball of plasma turning slowly in the middle of the glass, dim yellow, not a crystal.", () => _saucer(Object.assign({}, _sgl, { glass: { opacity: 0.3, plasma: true } })));
fx(684, "An even bigger tall glass bubble, nearly a hemisphere, with eight frame ribs.", () => _saucer(Object.assign({}, _sgl, { domeR: 0.65, glass: { opacity: 0.28, tall: 1.0, ribs: 8, mist: true } })));
fx(685, "A wide low glass canopy covering most of the top of the disc, thin frame, the dark deck visible.", () => _saucer(Object.assign({}, _sgl, { domeR: 0.78, glass: { opacity: 0.26, tall: 0.5, ribs: 6 } })));

// ── 676 with the original dark centre and a TALLER disc (Nos. 686–690): a thicker, deeper hull; no glass ──
const _stall = Object.assign({}, _sjag, { domeR: 0.34 });
fx(686, "676 with the disc taller: a deeper lens hull, the dark dome kept, the legs lifted to match.", () => _saucer(Object.assign({}, _stall, { sy: 2.0, hipH: 0.55 })));
fx(687, "Taller again: a fat, deep disc like a drum, the rim lights on a deeper band.", () => _saucer(Object.assign({}, _stall, { sy: 2.8, hipH: 0.66, domeR: 0.36 })));
fx(688, "A tall, steep-sided hull, almost a cylinder with a sloped top and a taller dark dome.", () => _saucer(Object.assign({}, _stall, { sy: 3.2, hipH: 0.72, domeR: 0.34, R: 0.88 })));
fx(689, "A deep hull with a second rim-light band low on its belly, as well as the top one.", () => _saucer(Object.assign({}, _stall, { sy: 2.4, hipH: 0.6, bellyBand: true })));
fx(690, "Tall and slightly domed all over, an egg-like disc with the dark centre rising from it.", () => _saucer(Object.assign({}, _stall, { sy: 2.6, hipH: 0.64, domeR: 0.42, R: 0.92 })));
