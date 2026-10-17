// ── THE SAUCER · Nos. 661–: a sleek black flying-saucer body, a ring of lights that chase round its rim, and mechanical legs it walks on. ──
const _saucerHull = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.15, roughness: 0.75, flatShading: true }); _saucerHull.envMapIntensity = 0.18;
const _saucerLeg = new T.MeshStandardMaterial({ color: 0x030304, metalness: 0.3, roughness: 0.6, flatShading: true }); _saucerLeg.envMapIntensity = 0.4;
function _saucer(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1.3);
  const body = G(); b.add(body);
  const R = o.R, k = o.sy || 1;
  // the disc: a lens, with a low dome on top (opaque dark metal: a hatch and a lamp, no glass)
  const prof = [[0.0, 0.0], [R * 0.35, 0.02], [R * 0.9, 0.08 * k], [R, 0.13 * k], [R * 0.95, 0.18 * k], [R * 0.55, 0.27 * k], [R * 0.3, 0.3 * k], [0.0, 0.3 * k]].map(p => new T.Vector2(Math.max(0.0001, p[0]), p[1]));
  const hull = new T.Mesh(new T.LatheGeometry(prof, o.segs || 24), _saucerHull); body.add(hull);
  const dome = new T.Mesh(new T.SphereGeometry(o.domeR, 20, 10, 0, TAU, 0, PI / 2), _saucerHull); dome.scale.y = 0.75; dome.position.y = 0.29 * k; body.add(dome);
  const beacon = new T.Mesh(_litFacets(new T.OctahedronGeometry(0.06, 0), 1), new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); beacon.scale.y = 1.5; beacon.position.y = 0.29 * k + o.domeR * 0.75 + 0.07; body.add(beacon);
  // belly: a dark ring and a dim plate underneath
  const belly = new T.Mesh(new T.TorusGeometry(R * 0.45, 0.025, 5, o.segs || 24), _saucerLeg); belly.rotation.x = PI / 2; belly.position.y = -0.0; body.add(belly);
  // the rim lights: a ring of small lamps; the lit ones chase round it
  const lamps = []; for (let i = 0; i < o.nLamps; i++) { const a = i * TAU / o.nLamps, mat = new T.MeshBasicMaterial({ color: 0x3a3000, toneMapped: false }), lp = new T.Mesh(new T.BoxGeometry(0.075, 0.05, 0.075), mat); lp.position.set(Math.sin(a) * R * 1.0, 0.145 * k, Math.cos(a) * R * 1.0); lp.rotation.y = a; body.add(lp); lamps.push({ lp, mat, i }); }
  const rimBand = new T.Mesh(new T.TorusGeometry(R * 0.985, 0.014, 4, o.segs || 24), _saucerLeg); rimBand.rotation.x = PI / 2; rimBand.position.y = 0.105 * k; body.add(rimBand);
  // the legs: hip under the disc, thigh, knee, shin, a round foot; the foot walks a loop and the leg follows it
  const legs = []; for (let i = 0; i < o.legs; i++) { const a = i * TAU / o.legs + (o.legRot || 0), th = _bone(null, null, o.legR, o.legR * 0.8, _saucerLeg), sh = _bone(null, null, o.legR * 0.8, o.legR * 0.35, _saucerLeg), kn = new T.Mesh(new T.IcosahedronGeometry(o.legR * 1.2, 0), _saucerLeg), ft = new T.Mesh(new T.SphereGeometry(o.legR * 1.5, 8, 6), _saucerLeg); ft.scale.y = 0.6; b.add(th); b.add(sh); b.add(kn); b.add(ft); legs.push({ a, th, sh, kn, ft, ph: (o.legs === 3 ? i * TAU / 3 : (i % 2 ? PI : 0)) + (o.legPh || 0) }); }
  const L = new T.PointLight(0xffffff, 0.4, 3.5, 2); L.color.set(EL.color); L.position.set(0, 0.6, 0.4); b.add(L); LIGHTS.push(L);
  const glow = _glowPool(R * 0.8, 0.02); if (o.pool) b.add(glow.g);
  const U1 = new T.Vector3(), U2 = new T.Vector3(), U3 = new T.Vector3();
  return { g, core: (o.hipH + 0.2) * (o.S || 1.3), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    body.position.y = o.hipH + 0.015 * Math.sin(ph * 2) - 0.05 * ac; body.rotation.z = 0.025 * Math.sin(ph); body.rotation.x = 0.03 * Math.sin(ph * 2) + 0.06 * ac;
    // chase: the pattern is "on, on, off, off" round the rim, advanced one lamp a step; the loop is a whole number of repeats so it closes
    const step = Math.floor(((ph / TAU) * o.chase) + 0.0001) , rate = 1 + 3 * ac;
    lamps.forEach(Lp => { const pos = (Lp.i + Math.floor(ph / TAU * o.chase * rate)) % 4, on = pos < 2 ? 1 : 0, lit = on * (0.7 + 0.3 * Math.sin(ph * 4 + Lp.i)) + 0.25 * ac; Lp.mat.color.setRGB(0.23 + 0.77 * lit, 0.19 + 0.78 * lit, 0.0 + 0.45 * lit * lit); });
    beacon.scale.setScalar(1 + 0.3 * Math.sin(ph * 3) + 0.6 * ac); beacon.scale.y *= 1.5; L.intensity = 0.4 + 0.8 * ac; if (o.pool) { glow.m.material.opacity = 0.2 + 0.2 * Math.sin(ph * 2) + 0.3 * ac; }
    const hipY = body.position.y + 0.02, stride = o.stride * (1 + 0.3 * ac), lift = o.lift;
    legs.forEach(Lg => { const cyc = ph + Lg.ph, hx = Math.sin(Lg.a) * R * o.hipR, hz = Math.cos(Lg.a) * R * o.hipR, fx0 = Math.sin(Lg.a) * R * o.footR, fz0 = Math.cos(Lg.a) * R * o.footR;
      const fx = fx0, fz = fz0 + stride * Math.cos(cyc), fy = 0.03 + Math.max(0, Math.sin(cyc)) * lift;
      const hip = U1.set(hx, hipY, hz), foot = U2.set(fx, fy, fz), A = o.legH * 0.6, Bn = o.legH * 0.68, d = hip.distanceTo(foot), c = Math.max(0.05, Math.min(A + Bn - 0.001, d)), kk = Math.acos(Math.max(-1, Math.min(1, (A * A + c * c - Bn * Bn) / (2 * A * c))));
      const mid = U3.copy(hip).add(foot).multiplyScalar(0.5), dir = new T.Vector3().subVectors(foot, hip).normalize(), out = new T.Vector3(Math.sin(Lg.a), 0.9, Math.cos(Lg.a)).normalize(); out.addScaledVector(dir, -out.dot(dir)).normalize();
      const knee = mid.clone().addScaledVector(out, Math.sin(kk) * A * 0.95);
      _setBone(Lg.th, hip, knee); _setBone(Lg.sh, knee, foot); Lg.kn.position.copy(knee); Lg.ft.position.copy(foot); }); } };
}
const _sc0 = { S: 1.3, R: 0.95, domeR: 0.3, nLamps: 16, chase: 8, legs: 4, legR: 0.045, legH: 0.8, hipH: 0.55, hipR: 0.6, footR: 1.05, stride: 0.14, lift: 0.14 };
fx(661, "A sleek black saucer: a lens-shaped hull with a low dome and a lit beacon, sixteen rim lights chasing round it two on, two off, and four mechanical legs it walks on.", () => _saucer(Object.assign({}, _sc0)));
fx(662, "A tripod lander: a wider, flatter saucer on three long jointed legs with a tripod gait.", () => _saucer(Object.assign({}, _sc0, { legs: 3, legH: 0.95, hipH: 0.7, R: 1.05, sy: 0.8, hipR: 0.55, footR: 1.15, legR: 0.05, stride: 0.16 })));
fx(663, "A spider saucer: six thin legs, a smaller disc, more of the insect about it.", () => _saucer(Object.assign({}, _sc0, { legs: 6, legR: 0.032, legH: 0.85, R: 0.85, hipR: 0.62, footR: 1.2, nLamps: 14, stride: 0.1 })));
fx(664, "Low and heavy: short stout legs and a tractor glow on the ground beneath the disc.", () => _saucer(Object.assign({}, _sc0, { legH: 0.55, hipH: 0.4, legR: 0.07, stride: 0.1, lift: 0.1, pool: true, R: 1.0, sy: 1.2 })));
fx(665, "Sleek and tall: a taller, more pointed lens hull and long slim legs, the lights in a fast chase.", () => _saucer(Object.assign({}, _sc0, { sy: 1.6, legH: 0.95, hipH: 0.75, legR: 0.038, chase: 16, nLamps: 20, R: 0.9, domeR: 0.26 })));
