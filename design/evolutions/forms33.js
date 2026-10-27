// ── THE LAST TWO TECHNICIANS · Nos. 870–871 (from the user's design sheets) ─────────────────────────────
//   870  THE BLIGHT SPIDER, the TOXIC technician (the user's card: "BLIGHT SPIDER · TOXIC DEPLOY"): a glass tank of bubbling toxin laid along its back, black bands round it,
//        a black ring at its back end and a black cap at its front with a lens in it, on a faceted black six-legged chassis with green eyes. Its idle trots on the spot (three legs
//        at a time), the bubbles rising; its action crouches and puffs a cloud of toxin from the lens.
//   871  THE HOVER SHELL, the ELECTRIC technician (the user's "ELECTRIC TECHNICIAN · FINAL CONCEPT" sheet; the sheet has no name, so this one is its own words for the attached
//        form, "Hover Shell + 6-Leg Shuttle"): a horseshoe crab's domed black shell with a yellow underglow and nothing else lit, square flat wings either side, two launcher
//        prongs at its back; under it, a six-legged shuttle with a crystal set flat in its back. Its idle hovers, shut; its action is the sheet's separation sequence: the shell
//        (the kinetic module) lifts off, the shuttle's legs unfold to the floor and its crystal flares, then it all closes again (no morphing: the parts stay distinct).
// Uses forms31.js and forms32.js's helpers. +z is the front; ph = 1.6 t runs once round the idle loop.

// a box laid along a -> b (its long side), w across and d deep
function _segBox33(parent, w, d, mat) { const m = new T.Mesh(new T.BoxGeometry(w, 1, d), mat); parent.add(m); const up = new T.Vector3(0, 1, 0), dir = new T.Vector3();
  return { m, set(a, b) { dir.copy(b).sub(a); const L = dir.length() || 1e-4; m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(up, dir.divideScalar(L)); m.scale.set(1, L, 1); } }; }
// a four-sided spike laid from a (its base, r across) to b (its point)
function _segSpike33(parent, r, mat) { const geo = new T.ConeGeometry(r, 1, 4, 1); geo.translate(0, 0.5, 0); const m = new T.Mesh(geo, mat); parent.add(m); const up = new T.Vector3(0, 1, 0), dir = new T.Vector3();
  return { m, set(a, b) { dir.copy(b).sub(a); const L = dir.length() || 1e-4; m.position.copy(a); m.quaternion.setFromUnitVectors(up, dir.divideScalar(L)); m.scale.set(1, L, 1); } }; }

// ── 870 · THE BLIGHT SPIDER ────────────────────────────────────────────────────────────────────────────
const _bsBlack = new T.MeshStandardMaterial({ color: 0x121317, metalness: 0.85, roughness: 0.4, flatShading: true }); _bsBlack.envMapIntensity = 0.5;   // (black reads black as metal: a dark matte surface goes grey under the studio's lights)
const _bsGrey = new T.MeshStandardMaterial({ color: _lin31(0x2a2c31), metalness: 0.8, roughness: 0.42, flatShading: true }); _bsGrey.envMapIntensity = 0.5;
const _bsGlass = new T.MeshStandardMaterial({ color: 0xeafff0, metalness: 0, roughness: 0.05, transparent: true, opacity: 0.12, depthWrite: false, side: T.DoubleSide }); _bsGlass.envMapIntensity = 0.6;
const _bsMatte = new T.MeshStandardMaterial({ color: 0x0e0f12, metalness: 0.85, roughness: 0.6, flatShading: true }); _bsMatte.envMapIntensity = 0.2;   // (the cap, bands and hub: rougher, so they stay black and do not mirror the studio as silver)
function _blightSpider(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color), lcL = lc.clone().convertSRGBToLinear(), lit = lc.clone().lerp(_c31(0xffffff), 0.15).convertSRGBToLinear(), glowM = _hot31(lit), lensM = _hot31(lit, 0.85);
  const body = G(); b.add(body);
  const Y = o.y, W = o.hubW, Hh = o.hubH, Lh = o.hubL, Rt = o.tankR, Lt = o.tankL;
  // the chassis: a chunky faceted hub, green eyes at its front and a line of green down either side, a saddle on top for the tank
  const hub = cbox(W, Hh, Lh, 0.07, _bsMatte); hub.position.y = Y; body.add(hub);
  const belly = cbox(W * 0.7, Hh * 0.6, Lh * 0.7, 0.04, _bsMatte); belly.position.y = Y - Hh * 0.55; body.add(belly);
  const saddle = cbox(W * 0.8, 0.07, Lt * 0.72, 0.02, _bsMatte); saddle.position.set(0, Y + Hh / 2 + 0.02, -0.02); body.add(saddle);
  const eyes = []; for (const [x, y, r] of [[-0.07, 0.035, 0.026], [0.07, 0.035, 0.026], [-0.13, -0.01, 0.018], [0.13, -0.01, 0.018]]) { const e = sphere(r, glowM, 8); e.position.set(x, Y + y, Lh / 2 + 0.006); body.add(e); eyes.push(e); }
  for (const sx of [-1, 1]) { const st = new T.Mesh(new T.BoxGeometry(0.014, 0.026, Lh * 0.62), glowM); st.position.set(sx * (W / 2 + 0.004), Y + 0.01, 0); body.add(st); }
  // the tank: toxin filling a glass cylinder laid along it, a dark sediment along its foot, bubbles; black bands round it, a black ring at its back, a black cap at its front with a lens
  const tank = G(); tank.position.set(0, Y + Hh / 2 + 0.06 + Rt, -0.03); body.add(tank);
  const fluidM = new T.MeshStandardMaterial({ color: lcL.clone().multiplyScalar(0.25), emissive: lcL.clone().multiplyScalar(0.36), roughness: 0.35, metalness: 0, transparent: true, opacity: 0.86, depthWrite: false }); fluidM.envMapIntensity = 0.4;
  const fluid = new T.Mesh(new T.CylinderGeometry(Rt * 0.9, Rt * 0.9, Lt * 0.96, 24), fluidM); fluid.rotation.x = PI / 2; fluid.renderOrder = 5; tank.add(fluid);
  const sed = new T.Mesh(new T.CylinderGeometry(Rt * 0.86, Rt * 0.86, Lt * 0.94, 24), new T.MeshStandardMaterial({ color: _lin31(0x4a3f1c), roughness: 0.85, metalness: 0 })); sed.rotation.x = PI / 2; sed.scale.set(1, 1, 0.32); sed.position.y = -Rt * 0.58; tank.add(sed);
  const bubM = new T.MeshBasicMaterial({ color: lit.clone().lerp(_c31(0xffffff), 0.45), transparent: true, opacity: 0.9, depthWrite: false, toneMapped: false });
  const bubbles = []; for (let i = 0; i < 6; i++) { const m = new T.Mesh(new T.SphereGeometry(0.022 + 0.008 * (i % 2), 8, 6), bubM); m.renderOrder = 6; tank.add(m); bubbles.push({ m, k: i / 6, x: ((i * 37) % 7 - 3) * 0.035, z: ((i * 53) % 9 - 4) * Lt * 0.09 }); }
  const glass = new T.Mesh(new T.CylinderGeometry(Rt, Rt, Lt, 28, 1, true), _bsGlass); glass.rotation.x = PI / 2; glass.renderOrder = 7; tank.add(glass);
  for (const z of [-Lt * 0.18, Lt * 0.2]) { const bd = new T.Mesh(new T.TorusGeometry(Rt + 0.008, 0.032, 6, 32), _bsMatte); bd.position.z = z; tank.add(bd); }
  const backRing = cyl(Rt + 0.035, Rt + 0.035, 0.07, _bsMatte, 24); backRing.rotation.x = PI / 2; backRing.position.z = -Lt / 2; tank.add(backRing);
  const cap = new T.Mesh(new T.CylinderGeometry(Rt * 0.55, Rt + 0.035, 0.17, 16), _bsMatte); cap.rotation.x = PI / 2; cap.position.z = Lt / 2 + 0.07; tank.add(cap);
  const lensRing = new T.Mesh(new T.TorusGeometry(Rt * 0.42, 0.022, 6, 24), _bsMatte); lensRing.position.z = Lt / 2 + 0.16; tank.add(lensRing);
  const lens = new T.Mesh(new T.CircleGeometry(Rt * 0.34, 20), lensM); lens.position.z = Lt / 2 + 0.157; tank.add(lens);
  // the toxin it puffs (action)
  const puffs = []; for (let i = 0; i < 7; i++) { const m = new T.Mesh(new T.SphereGeometry(1, 12, 8), new T.MeshBasicMaterial({ color: lit, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); m.renderOrder = 6; m.visible = false; tank.add(m); puffs.push({ m, k: i, a: i * 2.4 }); }
  // the legs: six, three a side; a faceted thigh up and out to a knee, a shin tapering to a point on the floor
  const legs = [];
  // (o.legs, the user's "smaller, thinner, finer legs ... lower to the ground": thinner thighs and shins, smaller knees, the knees lower and the feet nearer; the body sits lower)
  const lg = o.legs || { thighW: 0.12, thighD: 0.14, shinR: 0.1, knee: 0.08, kneeUp: 0.22, kneeOut: 0.2, footOut: 0.36 };
  for (const sx of [-1, 1]) for (let i = -1; i <= 1; i++) { const L = { sx, i, A: (sx < 0) === (i !== 0), hip: V(sx * W * 0.42, Y + 0.01, i * Lh * 0.32), knee0: V(sx * (W / 2 + lg.kneeOut), Y + lg.kneeUp, i * (Lh * 0.32 + 0.09)), foot0: V(sx * (W / 2 + lg.footOut), 0, i * (Lh * 0.32 + 0.22)) };
    L.thigh = _segBox33(b, lg.thighW, lg.thighD, _bsGrey); L.shin = _segSpike33(b, lg.shinR, _bsBlack); L.knee = new T.Mesh(new T.IcosahedronGeometry(lg.knee, 0), _bsMatte); b.add(L.knee); legs.push(L); }
  const fl = _glowPool(0.85, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(lc); fl.m.material.opacity = 0.26; b.add(fl.g);
  const Lt0 = new T.PointLight(0xffffff, 0.8, 4, 2); Lt0.color.copy(lc); Lt0.position.set(0, Y + 0.5, 0.5); b.add(Lt0); LIGHTS.push(Lt0);
  const kp = V(0, 0, 0), fp = V(0, 0, 0), hp = V(0, 0, 0);
  return { g, core: (Y + Hh / 2 + 0.06 + Rt) * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act);
    // the trot: three legs at a time (front and back of one side, the middle of the other), once each a loop; the deploy (action) crouches and leans in
    body.position.set(0, 0.012 * Math.sin(ph * 2) - 0.06 * a, 0.03 * a); body.rotation.x = 0.08 * a;
    legs.forEach(L => { const pair = L.A ? 0 : PI, lift = Math.max(0, Math.sin(ph + pair)) * 0.07 * (1 - a), sw = Math.cos(ph + pair) * 0.05 * (1 - a), spread = 0.05 * a;
      hp.copy(L.hip).add(body.position); kp.set(L.knee0.x + L.sx * spread * 0.5, L.knee0.y + lift * 0.7 + body.position.y, L.knee0.z + sw * 0.6); fp.set(L.foot0.x + L.sx * spread, lift, L.foot0.z + sw);
      L.thigh.set(hp, kp); L.knee.position.copy(kp); L.shin.set(kp, fp); });
    bubbles.forEach(B => { const u = ((ph / TAU) * 2 + B.k) % 1; B.m.position.set(B.x, -Rt * 0.5 + u * Rt * 1.25, B.z); B.m.scale.setScalar(u < 0.85 ? 1 : (1 - u) / 0.15); });
    fluidM.emissive.copy(lcL).multiplyScalar(0.36 + 0.05 * Math.sin(ph * 2) + 0.3 * a);
    lensM.color.copy(lit).multiplyScalar(0.75 + 0.2 * Math.sin(ph * 2) + 0.6 * a); glowM.color.copy(lit).multiplyScalar(0.85 + 0.15 * Math.sin(ph * 2 + 1) + 0.3 * a);
    puffs.forEach(P => { const u = pr * 1.5 - P.k * 0.07; P.m.visible = a > 0.05 && u > 0 && u < 1; if (!P.m.visible) return; const r = 0.05 + 0.13 * u;
      P.m.position.set(Math.cos(P.a) * 0.1 * u, Math.sin(P.a) * 0.07 * u + 0.05 * u, Lt / 2 + 0.2 + (o.puff || 0.55) * u); P.m.scale.setScalar(r); P.m.material.opacity = 0.7 * (1 - u); });
  } };
}
const _bs0 = { S: 1.45, y: 0.42, hubW: 0.42, hubH: 0.2, hubL: 0.5, tankR: 0.22, tankL: 0.6 };
// 873: "smaller, thinner, finer legs, and ... make it lower to the ground".
fx(873, "The toxic technician, the BLIGHT SPIDER on fine legs, lower to the ground (the user's ask): the tank of toxin on a black chassis, sitting low on six thin spidery legs.", () => _blightSpider(Object.assign({}, _bs0, { y: 0.27, puff: 0.38, legs: { thighW: 0.055, thighD: 0.065, shinR: 0.045, knee: 0.045, kneeUp: 0.13, kneeOut: 0.17, footOut: 0.3 } })));
fx(870, "The toxic technician, the BLIGHT SPIDER: a glass tank of bubbling toxin with black bands and a black front cap with a lens, on a faceted black six-legged chassis with green eyes.", () => _blightSpider(_bs0));

// ── 871 · THE HOVER SHELL ──────────────────────────────────────────────────────────────────────────────
const _hsBlack = new T.MeshStandardMaterial({ color: 0x0e0f12, metalness: 0.85, roughness: 0.55, flatShading: true, side: T.DoubleSide }); _hsBlack.envMapIntensity = 0.25;   // (solid black: metal, so the studio's lights leave it black; brighter reflections read as blue glints)
const _hsSteel = new T.MeshStandardMaterial({ color: _lin31(0xb9bcc4), metalness: 0.9, roughness: 0.3, flatShading: true }); _hsSteel.envMapIntensity = 0.9;
// the carapace: the top of an ellipsoid, narrowed toward its front into the horseshoe crab's point (front: how much narrower at the very front)
function _domeGeo33(rx, ry, rz, front) {
  const geo = new T.SphereGeometry(1, 18, 7, 0, TAU, 0, PI / 2), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = z > 0 ? 1 - front * z * z : 1; p.setXYZ(i, x * rx * k, y * ry, z * rz); }
  geo.computeVertexNormals(); return geo;
}
function _hoverShell(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color), lit = lc.clone().lerp(_c31(0xffffff), 0.1).convertSRGBToLinear(), glowM = _hot31(lit), lineM = _hot31(lit);
  const unit = G(); b.add(unit);   // it hovers: the shell and the shuttle together
  const hb = o.hover, rx = o.rx, ry = o.ry, rz = o.rz;
  // the shell (the kinetic module): the dome, its glowing rim, the square wings with their glowing undersides, two launcher prongs at the back
  const shell = G(); shell.position.y = hb; unit.add(shell);
  shell.add(new T.Mesh(_domeGeo33(rx, ry, rz, o.front), _hsBlack));
  const rimPts = []; for (let i = 0; i < 48; i++) { const f = i / 48 * TAU, z = Math.sin(f), k = z > 0 ? 1 - o.front * z * z : 1; rimPts.push(V(Math.cos(f) * rx * k * 1.01, 0.012, z * rz * 1.01)); }
  shell.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(rimPts, true), 96, 0.026, 6, true), glowM));
  for (const sx of [-1, 1]) {
    const top = cbox(o.wingW, 0.06, o.wingL, 0.014, _hsBlack); top.position.set(sx * (rx * 0.86 + o.wingW / 2), 0.115, -rz * 0.12); shell.add(top);
    const under = cbox(o.wingW - 0.03, 0.08, o.wingL - 0.03, 0.012, glowM); under.position.set(sx * (rx * 0.86 + o.wingW / 2), 0.045, -rz * 0.12); shell.add(under);   // (its underside glows: the only light on it)
  }
  for (const sx of [-1, 1]) { const pg = G(); pg.position.set(sx * 0.09, ry * 0.72, -rz * 0.42); _aim32(pg, V(sx * 0.12, 0.85, -0.5), V(0, 0, 1)); shell.add(pg);
    const pr = new T.Mesh(new T.ConeGeometry(0.07, o.prong, 4, 1), _hsBlack); pr.scale.z = 0.6; pr.position.y = o.prong / 2; pg.add(pr);
    const tip = new T.Mesh(new T.ConeGeometry(0.025, o.prong * 0.32, 4, 1), _hsSteel); tip.scale.z = 0.6; tip.position.y = o.prong * 0.82; pg.add(tip);
    _limb(pg, 0.008, lineM, 4).set(V(0, o.prong * 0.12, 0.03), V(0, o.prong * 0.55, 0.016)); }
  // the shuttle under it: a faceted black body with a crystal set flat in its back, six legs folded under it until the shell lifts
  const shut = G(); shut.position.y = o.shY; unit.add(shut);
  shut.add(cbox(o.shW, o.shH, o.shL, 0.04, _hsBlack));
  const cry = _gemLit31(new T.OctahedronGeometry(o.cry, 0)); cry.scale.set(1.2, 0.5, 1.6); cry.position.y = o.shH / 2 + 0.01; shut.add(cry);
  const legs = [];
  for (const sx of [-1, 1]) for (let i = -1; i <= 1; i++) { const L = { sx, i, hip: V(sx * o.shW * 0.45, o.shY, i * o.shL * 0.3) };
    L.tuckK = V(sx * (o.shW * 0.5 + 0.05), o.shY + 0.03, i * o.shL * 0.3); L.tuckF = V(sx * o.shW * 0.36, o.shY - o.shH * 0.4, i * o.shL * 0.33);
    L.outK = V(sx * (o.shW * 0.5 + 0.2), o.shY + 0.16, i * (o.shL * 0.3 + 0.08)); L.outF = V(sx * (o.shW * 0.5 + 0.34), -hb * 0.05, i * (o.shL * 0.3 + 0.2));
    L.thigh = _segBox33(unit, 0.06, 0.07, _hsBlack); L.strip = _segBox33(unit, 0.012, 0.074, lineM); L.shin = _segSpike33(unit, 0.05, _hsBlack); legs.push(L); }
  const fl = _glowPool(0.95, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(lc); fl.m.material.opacity = 0.42; b.add(fl.g);   // the underglow on the floor
  const Lt0 = new T.PointLight(0xffffff, 0.9, 3, 2); Lt0.color.copy(lc); Lt0.position.set(0, hb * 0.5, 0); unit.add(Lt0); LIGHTS.push(Lt0);
  const kp = V(0, 0, 0), fp = V(0, 0, 0), up = V(0, 0.035, 0);
  return { g, core: (hb + ry * 0.5) * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act), lift = Math.sin(PI * pr), ext = Math.min(1, lift * 1.4);
    // the hover: a bob and a slight bank; the separation (action): the shell lifts off and tips back, the shuttle's legs unfold to the floor, then it shuts again
    unit.position.y = 0.022 * Math.sin(ph * 2) * (1 - a); unit.rotation.z = 0.035 * Math.sin(ph) * (1 - a);
    shell.position.y = hb + o.lift * lift; shell.rotation.x = -0.14 * lift;
    legs.forEach(L => { kp.copy(L.tuckK).lerp(L.outK, ext); fp.copy(L.tuckF).lerp(L.outF, ext); fp.y -= unit.position.y * ext; L.thigh.set(L.hip, kp); L.strip.set(L.hip.clone().add(up), kp.clone().add(up)); L.shin.set(kp, fp); });
    cry.scale.set(1.2 * (1 + 0.25 * lift), 0.5 * (1 + 0.25 * lift), 1.6 * (1 + 0.25 * lift)); cry.userData.relight();
    glowM.color.copy(lit).multiplyScalar(0.8 + 0.2 * Math.sin(ph * 2) + 0.4 * a); lineM.color.copy(lit).multiplyScalar(0.7 + 0.3 * Math.sin(ph * 2 + 1.2) + 0.6 * a);
    fl.m.material.opacity = 0.42 * (1 - 0.4 * lift);
  } };
}
const _hs0 = { S: 1.8, hover: 0.14, rx: 0.36, ry: 0.36, rz: 0.56, front: 0.5, wingW: 0.34, wingL: 0.5, prong: 0.42, lift: 0.42, shY: 0.24, shW: 0.36, shH: 0.12, shL: 0.5, cry: 0.08 };
fx(871, "The electric technician, the HOVER SHELL: a horseshoe crab's domed black shell with a yellow underglow, square flat wings and two launcher prongs, over a six-legged shuttle with a crystal in its back; the shell lifts off.", () => _hoverShell(_hs0));
