// ── THE TECHNICIANS' FORMS · Nos. 850–852 (from the user's design sheets) ──────────────────────────────
// The technician ("camper" in the code) evolves at last. Its job is to get the squad across the battlefield and give the player exploration tools (the user's own, to come); these are its looks.
//   850  THE GOO PROXY, the FLUX technician (the "GOO PROXY" sheet): a black ring of eight segments in two stepped bands, a slit of violet light low on each, four long four-sided spikes
//        out at the quarters with a line of light along each top ridge; in the ring a pool of violet goo with a big bulb holding the main diamond, a small bulb holding another, a lump,
//        drops on the rim and droplets floating over it. Its idle sloshes the goo round the ring and turns the diamonds; its action heaves the big bulb up into a peak and throws drops off it.
//   851  THE THERMITE BURROWER, the FIRE technician (the "THERMITE BU…" sheet: "a compact mechanical creature designed to burn through armor, machinery, and obstacles using
//        concentrated heat"): a hunched dark iron body under three rust plates, a big cone drill for a nose (a steel flight wound round a core glowing in the grooves) behind a collar
//        of hot slots, a glowing round vent on its back, a glowing window over the drill, a grille of hot slots behind, four armoured legs splayed wide. Its idle trots on the spot,
//        the drill turning; its action lunges, spins the drill hard and white-hot and throws sparks off its tip.
//   852  THE IGLOO SKATER, the ICE technician (the user's pencil sketch: "a rectangular igloo looking dude that has diamonds for legs, who skates around [...] as if he's on ice"):
//        a squat box of cut ice blocks, three columns with their own seams (the sketch's), standing on diamonds (◇, a point at each end) that it skates on. Its idle glides from side to side, leaning into
//        each stride, frost kicked off behind; its action is a spin on its diamonds with a ring of frost thrown off.
// +z is the front, as everywhere; ph = 1.6 t runs once round the idle loop.
// COLOUR: the renderer outputs sRGB and these materials' colours are taken as linear, so a colour picked off a sheet is made linear first (_lin31), or it comes out pale.

const _lin31 = hex => new T.Color(hex).convertSRGBToLinear();
const _c31 = hex => new T.Color(hex);
function _hot31(c, k) { return new T.MeshBasicMaterial({ color: c.clone().multiplyScalar(k == null ? 1 : k), toneMapped: false }); }
// an annular sector of a ring (outer Ro, inner Ri, from a0 to a1 round y), h tall, its foot at y = 0
function _ringSeg31(Ri, Ro, a0, a1, h, bev, mat) {
  const s = new T.Shape(); s.absarc(0, 0, Ro, a0, a1, false); s.absarc(0, 0, Ri, a1, a0, true); s.closePath();
  const geo = new T.ExtrudeGeometry(s, { depth: Math.max(0.002, h - 2 * bev), bevelEnabled: bev > 0, bevelThickness: bev, bevelSize: bev, bevelSegments: 1, curveSegments: 10 });
  geo.rotateX(-PI / 2); geo.translate(0, bev, 0); return new T.Mesh(geo, mat);
}
// an ellipsoid laid along a -> b (its long axis), w across and d deep: an armour plate on a limb
function _segEll31(parent, w, d, mat, seg) {
  const m = new T.Mesh(new T.SphereGeometry(0.5, seg || 8, 6), mat); parent.add(m); const up = new T.Vector3(0, 1, 0), dir = new T.Vector3();
  return { m, set(a, b) { dir.copy(b).sub(a); const L = dir.length() || 1e-4; m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(up, dir.divideScalar(L)); m.scale.set(w, L, d); } };
}
// A gem lit facet by facet from a light fixed in the model, not in the gem: turn the gem and the light stays put, so a quarter turn of a four-sided gem closes
// the loop (a gem with its light baked in, as _litFacets does, would jump at the loop's end). Call relight() after moving it.
function _gemLit31(geo, dim) {
  geo = geo.index ? geo.toNonIndexed() : geo;
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3); geo.setAttribute('color', new T.BufferAttribute(col, 3));
  const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3(), Ld = new T.Vector3(-0.4, 0.7, 0.6).normalize(), k = dim == null ? 1 : dim;
  m.userData.relight = () => {
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i).multiply(m.scale); b.fromBufferAttribute(pos, i + 1).multiply(m.scale); c.fromBufferAttribute(pos, i + 2).multiply(m.scale);
      n.crossVectors(b.sub(a), c.sub(a)).normalize().applyQuaternion(m.quaternion);
      const fc = _facetCol(0.5 + 0.5 * n.dot(Ld)); for (let j = 0; j < 3; j++) { col[(i + j) * 3] = fc[0] * k; col[(i + j) * 3 + 1] = fc[1] * k; col[(i + j) * 3 + 2] = fc[2] * k; }
    }
    geo.attributes.color.needsUpdate = true;
  };
  m.userData.relight(); return m;
}
// where an action frame is in its move, 0..1 (the bake's action frames run t = 1 + 0.06 i): for a move that must keep going one way (a spin), where act only goes up and back
const _prog31 = (t, act) => act > 0 ? Math.min(1, Math.max(0, (t - 1) / 0.48 + 1 / 16)) : 0;

// ── 850 · THE GOO PROXY ───────────────────────────────────────────────────────────────────────────────────
const _gpBlack = new T.MeshStandardMaterial({ color: 0x14141c, metalness: 0.85, roughness: 0.26, flatShading: true }); _gpBlack.envMapIntensity = 1.15;
const _gpInner = new T.MeshStandardMaterial({ color: 0x07060c, metalness: 0.4, roughness: 0.6 }); _gpInner.envMapIntensity = 0.25;
const _gpSpike = new T.MeshStandardMaterial({ color: 0x0a0a0f, metalness: 0.8, roughness: 0.35, flatShading: true }); _gpSpike.envMapIntensity = 0.32;
// the ring the goo sits in (o.Ro, o.Ri, o.H; its four spikes o.spike*): shared by the first Goo Proxy (850) and the frog (853)
function _gpRing31(b, o, glowM, slitM) {
  const Ro = o.Ro, Ri = o.Ri, H = o.H, N = 8, h1 = H * 0.5;
  // the ring: eight black segments in two bands (the upper one stepped in), a slit of light low on each, an inner lip, a dark floor
  const ring = G(); b.add(ring);
  for (let i = 0; i < N; i++) { const a0 = i * TAU / N + 0.035, a1 = (i + 1) * TAU / N - 0.035, am = (a0 + a1) / 2;
    ring.add(_ringSeg31(Ri + 0.06, Ro, a0, a1, h1, 0.025, _gpBlack));
    const up = _ringSeg31(Ri, Ro - 0.045, a0 + 0.012, a1 - 0.012, H - h1, 0.03, _gpBlack); up.position.y = h1; ring.add(up);
    const sl = _ringSeg31(Ro + 0.012, Ro + 0.034, am - 0.22, am + 0.22, 0.04, 0, slitM); sl.position.y = h1 * 0.3; ring.add(sl); }   // (outside the band's bevel, which grows its outline by 0.025)
  const lip = new T.Mesh(new T.TorusGeometry(Ri + 0.012, 0.03, 6, 40), _gpBlack); lip.rotation.x = PI / 2; lip.position.y = H; ring.add(lip);
  const floor = cyl(Ri + 0.02, Ri + 0.02, 0.04, _gpInner, 32); floor.position.y = H * 0.4; ring.add(floor);
  // the four spikes, out at the quarters: long four-sided pyramids leaning down a little, a line of light along each top ridge
  for (let k = 0; k < 4; k++) { const sg = G(); sg.rotation.y = k * PI / 2; ring.add(sg);
    const tg = G(); tg.position.set(0, o.spikeY, Ro - 0.07); tg.rotation.x = o.tilt; sg.add(tg);
    const geo = new T.ConeGeometry(1, 1, 4, 1); geo.rotateX(PI / 2); geo.translate(0, 0, 0.5);
    const sp = new T.Mesh(geo, _gpSpike); sp.scale.set(o.spikeW, o.spikeH, o.spike); tg.add(sp);
    _limb(tg, 0.018, glowM, 6).set(V(0, o.spikeH * 0.9 + 0.013, o.spike * 0.1), V(0, o.spikeH * 0.16 + 0.013, o.spike * 0.84)); }
  return ring;
}
function _gooProxy(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color), lcL = lc.clone().convertSRGBToLinear(), lit = lc.clone().lerp(_c31(0xffffff), 0.2).convertSRGBToLinear(), glowM = _hot31(lit), slitM = _hot31(lit);
  const Ro = o.Ro, Ri = o.Ri, H = o.H;
  _gpRing31(b, o, glowM, slitM);
  // the goo: a pool filling the ring, the big bulb on a neck with the main diamond in it, a small bulb with a second, a lump, drops on the rim, droplets floating over it
  // (the goo leans bluer than the element's violet, as on the sheet; the big bulb is clearer, so its diamond shows)
  const gooC = lcL.clone().multiply(_c31(0x8cffff)), gooM = new T.MeshStandardMaterial({ color: gooC.clone().multiplyScalar(0.55), emissive: gooC.clone().multiplyScalar(0.42), roughness: 0.1, metalness: 0, transparent: true, opacity: 0.86, depthWrite: false }); gooM.envMapIntensity = 0.55;
  const clearM = gooM.clone(); clearM.opacity = 0.6; clearM.envMapIntensity = 0.55;
  const goo = G(); goo.position.y = H; b.add(goo);
  const blob = (r, p, mat) => { const m = new T.Mesh(new T.SphereGeometry(r, 28, 18), mat || gooM); m.position.copy(p); m.renderOrder = 6; goo.add(m); return m; };
  const pool = blob(Ri + 0.025, V(0, -0.01, 0)); pool.scale.y = 0.25;
  const B0 = V(-0.06, o.bigY, 0), N0 = V(-0.05, o.bigY * 0.4, 0), S0 = V(0.27, o.small * 0.6, -0.08), L0 = V(0.12, 0.04, 0.25);
  const big = blob(o.big, B0, clearM), neck = blob(o.big * 0.72, N0), small = blob(o.small, S0, clearM), lump = blob(o.small * 0.72, L0);
  const dia = _gemLit31(new T.OctahedronGeometry(o.dia, 0)); dia.scale.y = 2.1; goo.add(dia);
  const dia2 = _gemLit31(new T.OctahedronGeometry(o.dia * 0.55, 0)); dia2.scale.y = 2; goo.add(dia2);
  const drops = []; for (let i = 0; i < 4; i++) { const a = 0.5 + i * 1.6, m = blob(0.042 + 0.012 * (i % 2), V(Math.cos(a) * (Ri - 0.01), 0.035, -Math.sin(a) * (Ri - 0.01))); m.scale.y = 0.75; drops.push(m); }
  const floaters = [V(0.24, 0.55, -0.04), V(0.33, 0.42, 0.06)].map((p, i) => ({ m: blob(0.03 - 0.008 * i, p), p }));
  const splash = []; for (let i = 0; i < 6; i++) { const m = blob(0.038, V(0, 0, 0)); m.visible = false; splash.push({ m, a: i * TAU / 6 + 0.4 }); }
  const fl = _glowPool(Ro * 1.3, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(lc); fl.m.material.opacity = 0.28; b.add(fl.g);
  const Lt = new T.PointLight(0xffffff, 0.8, 4, 2); Lt.color.set(EL.color); Lt.position.set(0, H + 0.45, 0.1); b.add(Lt); LIGHTS.push(Lt);
  return { g, core: (H + B0.y) * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, s2 = Math.sin(ph * 2), lx = 0.025 * Math.cos(ph), lz = 0.025 * Math.sin(ph);
    // the slosh: the bulbs lean round a small circle and breathe; the heave (action) draws the big one up into a peak
    big.position.set(B0.x + lx, B0.y + 0.015 * s2 + 0.17 * a, B0.z + lz); big.scale.set(1 + 0.035 * s2 - 0.15 * a, 1 - 0.03 * s2 + 0.55 * a, 1 + 0.035 * s2 - 0.15 * a);
    neck.position.set(N0.x + lx * 0.5, N0.y + 0.06 * a, N0.z + lz * 0.5); neck.scale.set(1 - 0.1 * a, 1 + 0.5 * a, 1 - 0.1 * a);
    small.position.set(S0.x - lx * 0.6, S0.y + 0.012 * Math.sin(ph * 2 + 2), S0.z - lz * 0.6); small.scale.setScalar(1 + 0.05 * Math.sin(ph * 2 + 2.4) - 0.2 * a);
    lump.scale.set(1 + 0.07 * Math.sin(ph * 2 + 4), 1 + 0.09 * Math.sin(ph * 2 + 4.6), 1 + 0.07 * Math.sin(ph * 2 + 4));
    pool.scale.y = 0.25 * (1 + 0.06 * Math.sin(ph * 2 + 1) + 0.25 * a);
    // the diamonds turn a quarter turn a loop (four-sided, lit from the model: it closes)
    dia.position.set(big.position.x, big.position.y + 0.01, big.position.z); dia.rotation.y = ph / 4; dia.scale.set(1 + 0.2 * a, 2.1 * (1 + 0.2 * a), 1 + 0.2 * a); dia.userData.relight();
    dia2.position.copy(small.position); dia2.rotation.y = -ph / 4; dia2.userData.relight();
    drops.forEach((m, i) => { m.scale.y = 0.75 + 0.2 * Math.sin(ph * 2 + i * 1.7); });
    floaters.forEach((F, i) => { F.m.position.set(F.p.x + lx, F.p.y + 0.03 * Math.sin(ph + i * 2.1) + 0.1 * a, F.p.z + lz); });
    splash.forEach((S, i) => { S.m.visible = a > 0.1; const r = 0.12 + 0.4 * a, h = big.position.y + 0.12 + 0.3 * Math.sin(PI * a) * (0.6 + 0.4 * (i % 2)); S.m.position.set(Math.cos(S.a) * r, h, Math.sin(S.a) * r); S.m.scale.setScalar(0.6 + 0.5 * a); });
    glowM.color.copy(lit).multiplyScalar(0.8 + 0.2 * Math.sin(ph * 2) + 0.4 * a); slitM.color.copy(lit).multiplyScalar(0.65 + 0.25 * Math.sin(ph * 2 + 1) + 0.5 * a);
  } };
}
const _gp0 = { S: 1.35, Ro: 0.6, Ri: 0.4, H: 0.28, spike: 0.44, spikeW: 0.2, spikeH: 0.19, spikeY: 0.16, tilt: 0.22, big: 0.28, bigY: 0.26, small: 0.14, dia: 0.13 };
fx(850, "The flux technician, the GOO PROXY: a black segmented ring on four long spikes lit along their ridges, a pool of violet goo in it with a big bulb round the main diamond, a small bulb with another, drops and floating droplets.", () => _gooProxy(_gp0));

// ── 853 · THE GOO PROXY AS A FROG ───────────────────────────────────────────────────────────────────────
// ASKED (on 850): "I was thinking a frog face with diamond eye iris and one is way bigger than the other and smaller ring". The two bulbs of goo are its eyes now, bulging
// on top of a head of goo, one far bigger than the other, a diamond on the front of each for its iris with a slit of a pupil; a wide mouth across its front. The ring is
// smaller. Its idle breathes and looks about; its action puffs the head and pops the eyes.
function _gooFrog(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color), lcL = lc.clone().convertSRGBToLinear(), lit = lc.clone().lerp(_c31(0xffffff), 0.2).convertSRGBToLinear(), glowM = _hot31(lit), slitM = _hot31(lit);
  const H = o.H; _gpRing31(b, o, glowM, slitM);
  const gooC = lcL.clone().multiply(_c31(0x8cffff));
  const gooM = new T.MeshStandardMaterial({ color: gooC.clone().multiplyScalar(0.55), emissive: gooC.clone().multiplyScalar(0.42), roughness: 0.1, metalness: 0, transparent: true, opacity: 0.9, depthWrite: false }); gooM.envMapIntensity = 0.55;
  const eyeM = gooM.clone(); eyeM.color.copy(gooC).multiplyScalar(0.5); eyeM.emissive.copy(gooC).multiplyScalar(0.5); eyeM.opacity = 0.9; eyeM.envMapIntensity = 1.0; eyeM.roughness = 0.06;   // the eyeballs: glossy bulbs, a shade brighter than the head
  gooM.color.multiplyScalar(0.8); gooM.emissive.multiplyScalar(0.8);
  const darkM = new T.MeshBasicMaterial({ color: gooC.clone().multiplyScalar(0.05), toneMapped: false });
  const frog = G(); frog.position.y = H * 0.85; b.add(frog);   // (the head sits up on the ring, so its mouth shows over the lip)
  const hw = o.headW, hh = o.headH, hd = o.headD, hz = o.headZ;
  // the head: a dome of goo sitting in the ring, a little over its lip
  const head = new T.Mesh(new T.SphereGeometry(1, 32, 20), gooM); head.scale.set(hw, hh, hd); head.position.z = hz; head.renderOrder = 6; frog.add(head);
  const onHead = (u, v, k) => V(Math.sin(u) * Math.cos(v) * hw * k, Math.sin(v) * hh * k, hz + Math.cos(u) * Math.cos(v) * hd * k);   // a point on the head (u round from the front, v up)
  // the mouth: a wide smile across its front, hugging the head
  const mouthPts = []; for (let i = 0; i <= 24; i++) { const u = -1.1 + 2.2 * i / 24; mouthPts.push(onHead(u, 0.04 + 0.18 * u * u, 1.015)); }
  frog.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(mouthPts), 48, 0.022, 5, false), darkM));
  // the eyes: two bulbs bulging on top of the head, one far bigger than the other; a diamond on the front of each for its iris (tilted up a little to meet the
  // camera's eye), a slit of a pupil down it
  const look = V(0, 0.42, 0.91).normalize();
  const eyes = [[-o.eyeX, o.eyeBig, -0.08], [o.eyeX2, o.eyeSmall, 0.08]].map(([x, r, zf], i) => {
    const c = V(x, hh * 0.78 + r * 0.42, hz + hd * zf);
    const ball = new T.Mesh(new T.SphereGeometry(r, 28, 20), eyeM); ball.position.copy(c); ball.renderOrder = 6; frog.add(ball);
    const iris = _gemLit31(new T.OctahedronGeometry(r * 0.62, 0)); frog.add(iris);
    const pupil = new T.Mesh(new T.OctahedronGeometry(r * 0.62, 0), darkM); frog.add(pupil);
    return { c, r, ball, iris, pupil, i };
  });
  const q = new T.Quaternion().setFromUnitVectors(V(0, 0, 1), look), tmp = V(0, 0, 0);
  // goo dripping over the ring's lip
  const drips = [0.9, 2.6, 4.2].map((a, i) => { const m = new T.Mesh(new T.SphereGeometry(1, 12, 10), gooM); m.renderOrder = 6; m.position.set(Math.cos(a) * (o.Ro - 0.03), -H * 0.45, -Math.sin(a) * (o.Ro - 0.03)); frog.add(m); return { m, i }; });
  const splash = []; for (let i = 0; i < 6; i++) { const m = new T.Mesh(new T.SphereGeometry(0.034, 10, 8), gooM); m.renderOrder = 6; m.visible = false; frog.add(m); splash.push({ m, a: i * TAU / 6 + 0.3 }); }
  const fl = _glowPool(o.Ro * 1.5, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(lc); fl.m.material.opacity = 0.28; b.add(fl.g);
  const Lt = new T.PointLight(0xffffff, 0.8, 4, 2); Lt.color.set(EL.color); Lt.position.set(0, H + 0.6, 0.5); b.add(Lt); LIGHTS.push(Lt);
  return { g, core: (H * 0.85 + hh * 0.78 + o.eyeBig * 0.42) * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act), pop = Math.sin(PI * pr), br = Math.sin(ph * 2);
    // a breath: the head swells a little; the action: the head puffs and the eyes pop
    head.scale.set(hw * (1 + 0.02 * br + 0.1 * pop), hh * (1 + 0.04 * br + 0.14 * pop), hd * (1 + 0.02 * br + 0.08 * pop));
    const lookX = 0.16 * Math.sin(ph) * (1 - a), lookY = 0.06 * Math.cos(ph) * (1 - a);   // it looks about
    eyes.forEach(E => { const k = 1 + 0.2 * pop, y = E.c.y + 0.012 * br + 0.05 * pop;
      E.ball.position.set(E.c.x, y, E.c.z); E.ball.scale.setScalar(k);
      tmp.set(lookX, lookY, 0).add(look).normalize();
      E.iris.position.set(E.c.x + tmp.x * E.r * k * 0.9, y + tmp.y * E.r * k * 0.9, E.c.z + tmp.z * E.r * k * 0.9);
      E.iris.quaternion.copy(q); E.iris.scale.set(0.46 * k, 1.25 * k, 0.4 * k); E.iris.userData.relight();   // (thin: "thinner diamonds")
      E.pupil.position.copy(E.iris.position).addScaledVector(look, E.r * k * 0.62 * 0.4 + 0.003); E.pupil.quaternion.copy(q); E.pupil.scale.set(0.06 * k, 0.88 * k, 0.08 * k); });
    drips.forEach(D => { const s = 0.034 + 0.008 * Math.sin(ph * 2 + D.i * 2); D.m.scale.set(s, s * (1.6 + 0.3 * Math.sin(ph * 2 + D.i)), s); });
    splash.forEach((S, i) => { S.m.visible = pop > 0.1; const r = 0.1 + 0.4 * pop, h = hh + 0.25 * pop * (0.6 + 0.4 * (i % 2)); S.m.position.set(Math.cos(S.a) * r, h, hz + Math.sin(S.a) * r); S.m.scale.setScalar(0.6 + 0.6 * pop); });
    glowM.color.copy(lit).multiplyScalar(0.8 + 0.2 * Math.sin(ph * 2) + 0.4 * a); slitM.color.copy(lit).multiplyScalar(0.65 + 0.25 * Math.sin(ph * 2 + 1) + 0.5 * a);
  } };
}
const _gf0 = { S: 1.6, Ro: 0.42, Ri: 0.28, H: 0.24, spike: 0.34, spikeW: 0.16, spikeH: 0.15, spikeY: 0.13, tilt: 0.22,
  headW: 0.38, headH: 0.26, headD: 0.36, headZ: 0.04, eyeX: 0.13, eyeX2: 0.19, eyeBig: 0.21, eyeSmall: 0.11 };
fx(853, "The flux technician, the GOO PROXY as a frog (the user's ask): a head of violet goo in a smaller black spiked ring, two bulging eyes on top, one far bigger than the other, each with a diamond for its iris; a wide mouth.", () => _gooFrog(_gf0));

// ── 851 · THE THERMITE BURROWER ────────────────────────────────────────────────────────────────────────
const _thRust = new T.MeshStandardMaterial({ color: _lin31(0x6b2e0e), metalness: 0.25, roughness: 0.62, flatShading: true, side: T.DoubleSide }); _thRust.envMapIntensity = 0.5;
const _thRust2 = new T.MeshStandardMaterial({ color: _lin31(0x823c15), metalness: 0.25, roughness: 0.58, flatShading: true, side: T.DoubleSide }); _thRust2.envMapIntensity = 0.5;
const _thIron = new T.MeshStandardMaterial({ color: _lin31(0x2e2a27), metalness: 0.7, roughness: 0.45, flatShading: true }); _thIron.envMapIntensity = 0.6;
const _thSteel = new T.MeshStandardMaterial({ color: _lin31(0x5a5c62), metalness: 0.9, roughness: 0.32, flatShading: true, side: T.DoubleSide }); _thSteel.envMapIntensity = 0.9;
// the drill's flight: a ribbon wound round a cone (base radius Dr at z = 0, tip at z = DL), w0 wide at the base and narrowing to the tip
function _flight31(Dr, DL, turns, w0, n) {
  const pos = [], idx = [];
  for (let i = 0; i <= n; i++) { const s = i / n, th = s * turns * TAU, rIn = Dr * (1 - s) * 0.98, rOut = rIn + w0 * (1 - 0.7 * s), z = s * DL;
    pos.push(Math.cos(th) * rIn, Math.sin(th) * rIn, z, Math.cos(th) * rOut, Math.sin(th) * rOut, z - 0.03 * (1 - s));
    if (i) { const p = (i - 1) * 2, q = i * 2; idx.push(p, p + 1, q + 1, p, q + 1, q); } }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); return geo;
}
function _thermite(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color), heat = lc.clone().lerp(_c31(0xffa040), 0.45).convertSRGBToLinear(), hot2 = heat.clone().lerp(_c31(0xffd080).convertSRGBToLinear(), 0.3), hotM = _hot31(heat), coreM = _hot31(hot2), grooveM = _hot31(heat, 0.55);
  const body = G(); b.add(body);
  const Y = o.y, rx = o.rx, ry = o.ry, rz = o.rz;
  const onBody = (th, k) => V(0, ry * k * Math.sin(th), rz * k * Math.cos(th)), tiltAt = th => Math.atan2(Math.cos(th) / rz, Math.sin(th) / ry);   // a point on the back's midline, th from the front; the tilt of the surface there
  // the body: dark iron, hunched, under three rust plates shingled along the back (the middle one proudest, the hump)
  const torso = new T.Mesh(new T.SphereGeometry(1, 14, 10), _thIron); torso.scale.set(rx, ry, rz); torso.position.y = Y; body.add(torso);
  [[0.48, 1.12, 1.1, _thRust2], [1.2, 1.9, 1.14, _thRust], [1.98, 2.58, 1.1, _thRust2]].forEach(([t0, t1, k, mat]) => {   // (dark seams between them)
    const geo = new T.SphereGeometry(1, 12, 4, PI - 0.55, PI + 1.1, t0, t1 - t0); geo.rotateX(PI / 2);
    const m = new T.Mesh(geo, mat); m.scale.set(rx * k, ry * k, rz * k); m.position.y = Y; body.add(m); });
  // its back: a raised round vent glowing; over the drill, a glowing window in the front plate
  const vent = G(); vent.position.copy(onBody(1.75, 1.15)).add(V(0, Y, 0)); vent.rotation.x = tiltAt(1.75); body.add(vent);
  const collar = cyl(0.14, 0.16, 0.08, _thIron, 16); collar.position.y = 0.03; vent.add(collar);
  const ventGlow = new T.Mesh(new T.CircleGeometry(0.115, 24), coreM); ventGlow.rotation.x = -PI / 2; ventGlow.position.y = 0.072; vent.add(ventGlow);
  for (const r of [0, PI / 2]) { const bar = new T.Mesh(new T.BoxGeometry(0.23, 0.018, 0.02), _thIron); bar.rotation.y = r; bar.position.y = 0.078; vent.add(bar); }
  const win = new T.Mesh(new T.BoxGeometry(0.18, 0.025, 0.09), coreM); win.position.copy(onBody(0.8, 1.11)).add(V(0, Y, 0)); win.rotation.x = tiltAt(0.8); body.add(win);
  // behind: a grille of hot slots
  const grille = cbox(rx * 1.1, ry * 1.0, 0.08, 0.02, _thIron); grille.position.set(0, Y, -rz * 0.98); body.add(grille);
  const slots = []; for (let i = 0; i < 4; i++) { const s = new T.Mesh(new T.BoxGeometry(rx * 0.8, 0.026, 0.02), hotM); s.position.set(0, Y - ry * 0.32 + i * ry * 0.21, -rz * 0.98 - 0.045); body.add(s); slots.push(s); }
  // the drill: a collar of hot slots, a cone glowing in its grooves with a steel flight wound round it, a steel tip
  const front = G(); front.position.set(0, Y - 0.03, rz * 0.9); body.add(front);
  front.add(new T.Mesh(new T.TorusGeometry(o.drillR + 0.03, 0.055, 8, 24), _thIron));
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6, s = new T.Mesh(new T.BoxGeometry(0.06, 0.024, 0.03), hotM); s.position.set(Math.cos(a) * (o.drillR + 0.03), Math.sin(a) * (o.drillR + 0.03), 0.045); s.rotation.z = a; front.add(s); }
  const drill = G(); drill.position.z = 0.03; front.add(drill);
  const DL = o.drillL, Dr = o.drillR;
  const cone = new T.Mesh(new T.CylinderGeometry(0.01, Dr, DL, 18, 1), _thIron); cone.rotation.x = PI / 2; cone.position.z = DL / 2; drill.add(cone);
  drill.add(new T.Mesh(_flight31(Dr, DL, o.turns, o.flight, 200), _thSteel));
  const groove = []; for (let i = 0; i <= 120; i++) { const s = i / 120 * 0.86, th = s * o.turns * TAU + PI, r = Dr * (1 - s) * 0.98 + 0.006; groove.push(V(Math.cos(th) * r, Math.sin(th) * r, s * DL)); }   // the hot line down the groove, half a turn from the flight
  drill.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(groove), 220, 0.014, 5, false), grooveM));
  const tip = new T.Mesh(new T.CylinderGeometry(0.004, Dr * 0.3, DL * 0.28, 12, 1), _thSteel); tip.rotation.x = PI / 2; tip.position.z = DL * 0.86; drill.add(tip);
  const tipHot = sphere(0.05, coreM, 10); tipHot.position.z = DL + 0.01; tipHot.visible = false; drill.add(tipHot);
  const sparks = []; for (let i = 0; i < 9; i++) { const sp = new T.Mesh(new T.OctahedronGeometry(0.024, 0), _hot31(_c31(0xfff0c0))); sp.visible = false; front.add(sp); sparks.push({ sp, a: i * 2.39, v: 0.6 + 0.4 * ((i * 37) % 10) / 10 }); }
  // the legs: four, splayed wide; a rust plate over the thigh, a dark knee joint, a plated shin, a claw
  const legs = [];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const L = { sx, sz, hip: V(sx * rx * 0.8, Y - 0.06, sz * rz * 0.45), knee0: V(sx * (rx + 0.2), Y + 0.04, sz * (rz * 0.5 + 0.08)), foot0: V(sx * (rx + 0.3), 0, sz * (rz * 0.55 + 0.18)) };
    L.thigh = _limb(b, 0.07, _thIron, 8); L.thPl = _segEll31(b, 0.32, 0.24, sz > 0 ? _thRust2 : _thRust, 7); L.shin = _limb(b, 0.055, _thIron, 8); L.shPl = _segEll31(b, 0.2, 0.16, _thRust, 7);
    L.knee = sphere(0.085, _thIron, 10); b.add(L.knee); L.claw = new T.Mesh(new T.ConeGeometry(0.075, 0.13, 6), _thIron); L.claw.rotation.x = PI; b.add(L.claw); legs.push(L); }
  const fl = _glowPool(0.9, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(heat); fl.m.material.opacity = 0.22; b.add(fl.g);
  const Lt = new T.PointLight(0xffffff, 0.9, 4, 2); Lt.color.copy(heat); Lt.position.set(0, Y + ry + 0.35, rz); b.add(Lt); LIGHTS.push(Lt);
  const kp = V(0, 0, 0), fp = V(0, 0, 0), hp = V(0, 0, 0), out = V(0, 0, 0);
  return { g, core: (Y + ry * 1.15 + 0.08) * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act);
    // the trot: diagonal pairs step in turn, once each a loop; the lunge (action) pushes it forward and down
    body.position.set(0, 0.012 * Math.sin(ph * 2) - 0.04 * a, 0.08 * a); body.rotation.x = 0.06 * a;
    drill.rotation.z = -ph - pr * TAU * 2;   // a turn a loop; two more in the action
    grooveM.color.copy(heat).multiplyScalar(0.85 + 0.15 * Math.sin(ph * 2) + 0.4 * a); hotM.color.copy(heat).lerp(_c31(0xffffff), 0.3 * a);
    ventGlow.material.color.copy(hot2).multiplyScalar(0.85 + 0.15 * Math.sin(ph * 2) + 0.2 * a);
    slots.forEach((S, i) => S.material.color.copy(heat).multiplyScalar(0.7 + 0.3 * Math.max(0, Math.sin(ph * 2 - i * 0.8)) + 0.3 * a));
    tipHot.visible = a > 0.12; tipHot.scale.setScalar(0.6 + 1.2 * a);
    sparks.forEach((S, i) => { S.sp.visible = a > 0.12; if (!S.sp.visible) return; const u = (pr * 2 + i * 0.11) % 1, r = 0.06 + 0.45 * u * S.v; S.sp.position.set(Math.cos(S.a) * r, Math.sin(S.a) * r * 0.6 + 0.12 * u, DL + 0.06 + 0.22 * u); S.sp.scale.setScalar(1.2 - u); });
    legs.forEach(L => { const pair = (L.sx * L.sz > 0) ? 0 : PI, lift = Math.max(0, Math.sin(ph + pair)) * 0.07 * (1 - a), sw = Math.cos(ph + pair) * 0.05 * (1 - a), brace = 0.05 * a;
      hp.copy(L.hip).add(body.position); kp.set(L.knee0.x + L.sx * brace * 0.5, L.knee0.y + lift * 0.6 + body.position.y, L.knee0.z + sw * 0.6 + body.position.z * 0.5); fp.set(L.foot0.x + L.sx * brace, lift, L.foot0.z + sw);
      L.thigh.set(hp, kp); out.set(L.sx * 0.04, 0.06, 0); L.thPl.set(hp.clone().lerp(kp, 0.2).add(out), kp.clone().add(out)); L.knee.position.copy(kp);
      L.shin.set(kp, fp); out.set(L.sx * 0.025, 0, 0); L.shPl.set(kp.clone().lerp(fp, 0.15).add(out), kp.clone().lerp(fp, 0.78).add(out)); L.claw.position.set(fp.x, fp.y + 0.06, fp.z); });
  } };
}
const _th0 = { S: 1.25, y: 0.48, rx: 0.38, ry: 0.26, rz: 0.42, drillR: 0.26, drillL: 0.56, turns: 3.5, flight: 0.08 };
fx(851, "The fire technician, the THERMITE BURROWER: a hunched iron body under rust plates on four armoured legs, a cone drill nose glowing in its grooves, a glowing vent on its back and a hot grille behind.", () => _thermite(_th0));

// ── 854 · THE THERMITE BURROWER IN BLACK ────────────────────────────────────────────────────────────────
// ASKED (on 851): "I don't like the body or shoulders, it actually needs to have a black body with red glowing accents". The same digger, all black: black armour
// plates with seams of red light between them, a red vent, window and grille, red in the drill's groove and its collar; the round shoulder plates are gone. Then: "Thick
// armored arms": the legs are thick and angular, armour plates on thigh and shin, a heavy knee, a line of red down each. (Uses forms33.js's _segBox33 and _segSpike33: the bake inlines every forms file into one scope.)
const _tbBlack = new T.MeshStandardMaterial({ color: 0x0e0f12, metalness: 0.85, roughness: 0.55, flatShading: true, side: T.DoubleSide }); _tbBlack.envMapIntensity = 0.25;   // (rough: a big flat plate mirrors the studio as a white patch)
const _tbDark = new T.MeshStandardMaterial({ color: 0x08090b, metalness: 0.8, roughness: 0.5, flatShading: true }); _tbDark.envMapIntensity = 0.3;
const _tbLimb = new T.MeshStandardMaterial({ color: 0x07080a, metalness: 0.9, roughness: 0.6, flatShading: true }); _tbLimb.envMapIntensity = 0.12;   // (the bear's legs: their flat faces mirrored the studio grey)
const _tbSteel = new T.MeshStandardMaterial({ color: _lin31(0x3a3c42), metalness: 0.9, roughness: 0.32, flatShading: true, side: T.DoubleSide }); _tbSteel.envMapIntensity = 0.7;
// a box laid along a -> b, w across and d deep, its depth turned as near to `up` as it can (an armour plate's thickness stays upright)
function _segPlate31(parent, w, d, mat) { const m = new T.Mesh(new T.BoxGeometry(w, 1, d), mat); parent.add(m); const y = V(0, 0, 0), z = V(0, 0, 0), x = V(0, 0, 0), M4 = new T.Matrix4();
  return { m, set(a, b, up) { y.copy(b).sub(a); const L = y.length() || 1e-4; y.divideScalar(L); z.copy(up).addScaledVector(y, -up.dot(y)).normalize(); x.crossVectors(y, z);
    m.quaternion.setFromRotationMatrix(M4.makeBasis(x, y, z)); m.position.copy(a).add(b).multiplyScalar(0.5); m.scale.set(1, L, 1); } }; }
function _thermiteBlack(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const red = _c31(o.red).convertSRGBToLinear(), red2 = red.clone().lerp(_c31(0xffffff), 0.12), hotM = _hot31(red), coreM = _hot31(red2), grooveM = _hot31(red, 0.8), seamM = _hot31(red, 0.9), legM = _hot31(red, 0.85);
  const body = G(); b.add(body);
  const Y = o.y, rx = o.rx, ry = o.ry, rz = o.rz;
  const onBody = (th, k) => V(0, ry * k * Math.sin(th), rz * k * Math.cos(th)), tiltAt = th => Math.atan2(Math.cos(th) / rz, Math.sin(th) / ry);
  // the body: black, hunched, under three black plates along the back, a seam of red light between each and at the plates' ends
  const torso = new T.Mesh(new T.SphereGeometry(1, 14, 10), _tbDark); torso.scale.set(rx, ry, rz); torso.position.y = Y; body.add(torso);
  const bk = o.bandK || [1.1, 1.14, 1.1];   // how proud each plate stands (the bear's: its front one, the shoulders, the hump)
  [[0.48, 1.12, bk[0]], [1.2, 1.9, bk[1]], [1.98, 2.58, bk[2]]].forEach(([t0, t1, k]) => {
    const geo = new T.SphereGeometry(1, 12, 4, PI - 0.55, PI + 1.1, t0, t1 - t0); geo.rotateX(PI / 2);
    const m = new T.Mesh(geo, _tbBlack); m.scale.set(rx * k, ry * k, rz * k); m.position.y = Y; body.add(m); });
  const seam = (th, k) => { const pts = []; for (let i = 0; i <= 28; i++) { const f = PI - 0.5 + (PI + 1.0) * i / 28; pts.push(V(-Math.cos(f) * Math.sin(th) * rx * k, Y - Math.sin(f) * Math.sin(th) * ry * k, Math.cos(th) * rz * k)); }
    body.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 56, 0.014, 5, false), seamM)); };
  seam(1.16, Math.min(bk[0], bk[1])); seam(1.94, Math.min(bk[1], bk[2])); seam(0.5, bk[0] - 0.02); seam(2.56, bk[2] - 0.02);
  // its back: a raised round vent glowing red; over the drill, a red window
  const vent = G(); vent.position.copy(onBody(1.75, 1.15)).add(V(0, Y, 0)); vent.rotation.x = tiltAt(1.75); body.add(vent);
  const collar = cyl(0.14, 0.16, 0.08, _tbBlack, 16); collar.position.y = 0.03; vent.add(collar);
  const ventGlow = new T.Mesh(new T.CircleGeometry(0.115, 24), coreM); ventGlow.rotation.x = -PI / 2; ventGlow.position.y = 0.072; vent.add(ventGlow);
  for (const r of [0, PI / 2]) { const bar = new T.Mesh(new T.BoxGeometry(0.23, 0.018, 0.02), _tbDark); bar.rotation.y = r; bar.position.y = 0.078; vent.add(bar); }
  const win = new T.Mesh(new T.BoxGeometry(0.18, 0.025, 0.09), coreM); win.position.copy(onBody(0.8, 1.11)).add(V(0, Y, 0)); win.rotation.x = tiltAt(0.8); body.add(win);
  // behind: a grille of red slots
  const grille = cbox(rx * 1.1, ry * 1.0, 0.08, 0.02, _tbBlack); grille.position.set(0, Y, -rz * 0.98); body.add(grille);
  const slots = []; for (let i = 0; i < 4; i++) { const sm = _hot31(red); const sl = new T.Mesh(new T.BoxGeometry(rx * 0.8, 0.026, 0.02), sm); sl.position.set(0, Y - ry * 0.32 + i * ry * 0.21, -rz * 0.98 - 0.045); body.add(sl); slots.push(sl); }
  // the drill: a black collar of red slots, a black cone with a dark steel flight wound round it and red glowing down its groove, a steel tip
  const front = G(); front.position.set(0, Y - 0.03, rz * 0.9); body.add(front);
  front.add(new T.Mesh(new T.TorusGeometry(o.drillR + 0.03, 0.055, 8, 24), _tbBlack));
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6, sl = new T.Mesh(new T.BoxGeometry(0.06, 0.024, 0.03), hotM); sl.position.set(Math.cos(a) * (o.drillR + 0.03), Math.sin(a) * (o.drillR + 0.03), 0.045); sl.rotation.z = a; front.add(sl); }
  const drill = G(); drill.position.z = 0.03; front.add(drill);
  const DL = o.drillL, Dr = o.drillR;
  const cone = new T.Mesh(new T.CylinderGeometry(0.01, Dr, DL, 18, 1), _tbDark); cone.rotation.x = PI / 2; cone.position.z = DL / 2; drill.add(cone);
  drill.add(new T.Mesh(_flight31(Dr, DL, o.turns, o.flight, 200), _tbSteel));
  const groove = []; for (let i = 0; i <= 120; i++) { const s = i / 120 * 0.86, th = s * o.turns * TAU + PI, r = Dr * (1 - s) * 0.98 + 0.006; groove.push(V(Math.cos(th) * r, Math.sin(th) * r, s * DL)); }
  drill.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(groove), 220, 0.015, 5, false), grooveM));
  const tip = new T.Mesh(new T.CylinderGeometry(0.004, Dr * 0.3, DL * 0.28, 12, 1), _tbSteel); tip.rotation.x = PI / 2; tip.position.z = DL * 0.86; drill.add(tip);
  const tipHot = sphere(0.05, coreM, 10); tipHot.position.z = DL + 0.01; tipHot.visible = false; drill.add(tipHot);
  const sparks = []; for (let i = 0; i < 9; i++) { const sp = new T.Mesh(new T.OctahedronGeometry(0.024, 0), _hot31(_c31(0xffc8a0))); sp.visible = false; front.add(sp); sparks.push({ sp, a: i * 2.39, v: 0.6 + 0.4 * ((i * 37) % 10) / 10 }); }
  // the legs ("thick armored arms"): four, splayed wide; a thick black thigh under an armour plate with a line of red along it, a heavy knee, a thick armoured shin with
  // a line of red down it, a claw
  const legs = [];
  if (o.bear) {
    // ... or a bear's ("a bear / zoids style tank animal", no face): elbows back and knees forward, thick armoured limbs on big clawed paws, a line of red down each
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const fr = sz > 0;
      const L = { sx, sz, fr, top: V(sx * rx * 0.72, Y - 0.02, sz * rz * 0.42),
        mid: fr ? V(sx * (rx + 0.1), Y - 0.2, rz * 0.22) : V(sx * (rx + 0.1), Y - 0.17, -rz * 0.16),
        low: fr ? V(sx * (rx + 0.14), 0.09, rz * 0.5) : V(sx * (rx + 0.13), 0.16, -rz * 0.64),
        paw: fr ? V(sx * (rx + 0.14), 0.035, rz * 0.56) : V(sx * (rx + 0.13), 0.035, -rz * 0.5) };
      L.up = _segPlate31(b, o.thighW, o.thighD, _tbLimb); L.upPl = _segPlate31(b, o.thighW * 1.3, 0.05, _tbLimb); L.upLn = _segPlate31(b, 0.022, 0.012, legM);
      L.lo = _segPlate31(b, o.shinW, o.shinD, _tbLimb); L.loPl = _segPlate31(b, o.shinW * 1.25, 0.04, _tbLimb); L.loLn = _segPlate31(b, 0.02, 0.012, legM);
      L.ft = fr ? null : _segPlate31(b, o.shinW * 0.85, o.shinD * 0.85, _tbLimb);   // a hind leg's foot, from the hock forward to the paw
      L.j1 = new T.Mesh(new T.IcosahedronGeometry(o.knee, 0), _tbDark); b.add(L.j1); L.j2 = new T.Mesh(new T.IcosahedronGeometry(o.knee * 0.75, 0), _tbDark); b.add(L.j2);
      L.pawM = cbox(o.pawW, 0.07, o.pawL, 0.02, _tbLimb); b.add(L.pawM);
      L.claws = [-1, 0, 1].map(c => { const m = new T.Mesh(new T.ConeGeometry(0.03, 0.1, 4), _tbDark); m.rotation.x = PI / 2 + 0.5; b.add(m); return { m, c }; });
      legs.push(L); }
  } else
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const L = { sx, sz, hip: V(sx * rx * 0.78, Y - 0.04, sz * rz * 0.45), knee0: V(sx * (rx + 0.21), Y + 0.08, sz * (rz * 0.5 + 0.08)), foot0: V(sx * (rx + 0.32), 0, sz * (rz * 0.55 + 0.18)) };
    L.thigh = _segPlate31(b, o.thighW, o.thighD, _tbBlack); L.thPlate = _segPlate31(b, o.thighW * 1.45, 0.05, _tbBlack); L.thLine = _segPlate31(b, 0.022, 0.012, legM);
    L.shin = _segPlate31(b, o.shinW, o.shinD, _tbBlack); L.shPlate = _segPlate31(b, o.shinW * 1.3, 0.04, _tbBlack); L.shLine = _segPlate31(b, 0.02, 0.012, legM);
    L.knee = new T.Mesh(new T.IcosahedronGeometry(o.knee, 0), _tbDark); b.add(L.knee); L.claw = _segSpike33(b, 0.08, _tbDark); legs.push(L); }
  const fl = _glowPool(0.9, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(red); fl.m.material.opacity = 0.2; b.add(fl.g);
  const Lt = new T.PointLight(0xffffff, 0.8, 4, 2); Lt.color.copy(red); Lt.position.set(0, Y + ry + 0.35, rz); b.add(Lt); LIGHTS.push(Lt);
  const kp = V(0, 0, 0), fp = V(0, 0, 0), hp = V(0, 0, 0), ak = V(0, 0, 0), Up = V(0, 1, 0), out = V(0, 0, 0), tA = V(0, 0, 0), tB = V(0, 0, 0), P0 = V(0, 0, 0), P1 = V(0, 0, 0), P2 = V(0, 0, 0), P3 = V(0, 0, 0);
  const armour = (seg, pl, ln, A, B, d) => { seg.set(A, B, out); tA.copy(A).lerp(B, 0.1).addScaledVector(out, d * 0.55); tB.copy(B).addScaledVector(out, d * 0.55); pl.set(tA, tB, out);
    tA.addScaledVector(out, 0.026); tB.addScaledVector(out, 0.026); ln.set(tA, tB, out); };   // a limb, its armour plate on its outer side, and the line of red on the plate
  return { g, core: (Y + ry * 1.15 + 0.08) * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act);
    body.position.set(0, 0.012 * Math.sin(ph * 2) - 0.04 * a, 0.08 * a); body.rotation.x = 0.06 * a;
    drill.rotation.z = -ph - pr * TAU * 2;
    const pulse = 0.85 + 0.15 * Math.sin(ph * 2);
    grooveM.color.copy(red).multiplyScalar(0.8 * pulse + 0.4 * a); hotM.color.copy(red).lerp(_c31(0xffffff), 0.25 * a); seamM.color.copy(red).multiplyScalar(0.85 * pulse + 0.3 * a); legM.color.copy(red).multiplyScalar(0.8 * pulse + 0.3 * a);
    ventGlow.material.color.copy(red2).multiplyScalar(pulse + 0.2 * a);
    slots.forEach((S, i) => S.material.color.copy(red).multiplyScalar(0.7 + 0.3 * Math.max(0, Math.sin(ph * 2 - i * 0.8)) + 0.3 * a));
    tipHot.visible = a > 0.12; tipHot.scale.setScalar(0.6 + 1.2 * a);
    sparks.forEach((S, i) => { S.sp.visible = a > 0.12; if (!S.sp.visible) return; const u = (pr * 2 + i * 0.11) % 1, r = 0.06 + 0.45 * u * S.v; S.sp.position.set(Math.cos(S.a) * r, Math.sin(S.a) * r * 0.6 + 0.12 * u, DL + 0.06 + 0.22 * u); S.sp.scale.setScalar(1.2 - u); });
    if (o.bear) legs.forEach(L => { const pair = (L.sx * L.sz > 0) ? 0 : PI, lift = Math.max(0, Math.sin(ph + pair)) * 0.06 * (1 - a), sw = Math.cos(ph + pair) * 0.05 * (1 - a), bp = body.position;
      P0.copy(L.top).add(bp); P1.set(L.mid.x, L.mid.y + bp.y + lift * 0.5, L.mid.z + sw * 0.5 + bp.z * 0.5); P2.set(L.low.x, L.low.y + lift, L.low.z + sw); P3.set(L.paw.x, L.paw.y + lift, L.paw.z + sw);
      out.set(L.sx, 0, 0); armour(L.up, L.upPl, L.upLn, P0, P1, o.thighD); armour(L.lo, L.loPl, L.loLn, P1, P2, o.shinD); if (L.ft) L.ft.set(P2, P3, out);
      L.j1.position.copy(P1); L.j2.position.copy(P2); L.pawM.position.set(P3.x, P3.y, P3.z + 0.02);
      L.claws.forEach(C => C.m.position.set(P3.x + C.c * o.pawW * 0.3, P3.y - 0.005, P3.z + 0.02 + o.pawL * 0.5 + 0.025)); });
    else legs.forEach(L => { const pair = (L.sx * L.sz > 0) ? 0 : PI, lift = Math.max(0, Math.sin(ph + pair)) * 0.07 * (1 - a), sw = Math.cos(ph + pair) * 0.05 * (1 - a), brace = 0.05 * a;
      hp.copy(L.hip).add(body.position); kp.set(L.knee0.x + L.sx * brace * 0.5, L.knee0.y + lift * 0.6 + body.position.y, L.knee0.z + sw * 0.6 + body.position.z * 0.5); fp.set(L.foot0.x + L.sx * brace, lift, L.foot0.z + sw);
      ak.copy(kp).lerp(fp, 0.72);   // the ankle: the shin's armour ends there and the claw goes on to the floor
      out.set(L.sx, 0, 0);
      L.thigh.set(hp, kp, Up); tA.copy(hp).lerp(kp, 0.12).addScaledVector(Up, o.thighD * 0.55); tB.copy(kp).addScaledVector(Up, o.thighD * 0.55); L.thPlate.set(tA, tB, Up);
      tA.addScaledVector(Up, 0.03); tB.addScaledVector(Up, 0.03); L.thLine.set(tA, tB, Up); L.knee.position.copy(kp);
      L.shin.set(kp, ak, out); tA.copy(kp).lerp(ak, 0.1).addScaledVector(out, o.shinD * 0.55); tB.copy(ak).addScaledVector(out, o.shinD * 0.55); L.shPlate.set(tA, tB, out);
      tA.addScaledVector(out, 0.025); tB.addScaledVector(out, 0.025); L.shLine.set(tA, tB, out); L.claw.set(ak, fp); });
  } };
}
const _thb0 = Object.assign({}, _th0, { red: 0xff2a14, thighW: 0.17, thighD: 0.15, shinW: 0.14, shinD: 0.13, knee: 0.1 });
const _thbear0 = Object.assign({}, _thb0, { bear: true, bandK: [1.18, 1.13, 1.05], thighW: 0.19, thighD: 0.17, shinW: 0.15, shinD: 0.14, knee: 0.1, pawW: 0.17, pawL: 0.22 });
fx(855, "The fire technician, the THERMITE BURROWER as a bear-like tank animal (the user's ask: a bear / zoids style tank animal, same silhouette, no face): the black armoured digger with red seams and the drill, a shoulder hump, a bear's legs on clawed paws.", () => _thermiteBlack(_thbear0));
fx(854, "The fire technician, the THERMITE BURROWER in black (the user's ask): a black armoured digger with seams of red light, a red vent, window and grille, a black drill glowing red in its groove, thick armoured legs lined with red.", () => _thermiteBlack(_thb0));

// ── 852 · THE IGLOO SKATER ─────────────────────────────────────────────────────────────────────────────
// a diamond, ◇: a point at the foot, the widest round its middle (r), a point at the top; h tall, seg sides
function _diamond31(r, h, seg) { return new T.LatheGeometry([new T.Vector2(0, 0), new T.Vector2(r, h * 0.5), new T.Vector2(0, h)], seg || 6); }
function _iglooSkater(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color);
  const rig = G(); b.add(rig);   // body and legs: it glides and spins as one
  const body = G(); rig.add(body);
  const W = o.W, H = o.H, D = o.D, y0 = o.y0, gap = 0.024;
  const seamM = new T.MeshStandardMaterial({ color: _lin31(0x1d466a), roughness: 0.6, metalness: 0.1 }); seamM.envMapIntensity = 0.3;
  const core = cbox(W - 0.06, H - 0.06, D - 0.06, 0.02, seamM); core.position.y = y0 + H / 2; body.add(core);
  // the blocks: three columns across, each cut at its own seams (the sketch's), and each course cut once more through the depth; every block a slab of its own shade, a little askew
  const iceMats = o.ice.map(hx => { const m = new T.MeshStandardMaterial({ color: _lin31(hx), emissive: _lin31(hx).multiplyScalar(0.06), roughness: 0.38, metalness: 0.02 }); m.envMapIntensity = 0.9; return m; });
  const cols = o.cols, xs = []; let x = -W / 2; for (const c of cols) { xs.push([x, x + c.w * W]); x += c.w * W; }
  let n = 0;
  cols.forEach((c, ci) => { const [xa, xb] = xs[ci], cuts = [0, ...c.seams, 1];
    for (let r = 0; r < cuts.length - 1; r++) { const ya = y0 + cuts[r] * H, yb = y0 + cuts[r + 1] * H, zc = c.depth[r % c.depth.length];
      [[-D / 2, -D / 2 + zc * D], [-D / 2 + zc * D, D / 2]].forEach(([za, zb], q) => { const j = (ci * 7 + r * 3 + q * 5) % 5;
        const bx = cbox(xb - xa - gap, yb - ya - gap, zb - za - gap, 0.035, iceMats[(n++ + ci) % iceMats.length]);
        bx.position.set((xa + xb) / 2 + (j - 2) * 0.004, (ya + yb) / 2, (za + zb) / 2); bx.rotation.set((j - 2) * 0.008, 0, ((j * 3) % 5 - 2) * 0.012); body.add(bx); }); } });
  // the legs: diamonds, ◇, the top point in the body, under the three columns, front and back: it skates on their lower points
  const legs = []; xs.forEach(([xa, xb], ci) => { for (const sz of [-1, 1]) { const gm = _litFacets(_diamond31(o.gem, o.legH, 6).toNonIndexed()); _shadeCrystal(gm, 1, true, 0, o.legH);
    const lg = new T.Mesh(gm, new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); const x0 = (xa + xb) / 2; lg.position.set(x0, 0.005, sz * (D / 2 - o.gem)); rig.add(lg); legs.push({ lg, ci, sz, x0 }); } });
  // frost: flecks kicked off behind by the stride, and a ring of it in the spin
  const fleckM = new T.MeshBasicMaterial({ color: 0xeefbff, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false });
  const flecks = []; for (let i = 0; i < 10; i++) { const f = new T.Mesh(new T.OctahedronGeometry(0.02 + 0.008 * (i % 3), 0), fleckM); b.add(f); flecks.push({ f, k: i / 10, sx: i % 2 ? 1 : -1 }); }
  const ringM = new T.MeshBasicMaterial({ color: lc.clone().lerp(_c31(0xffffff), 0.5), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const frostRing = new T.Mesh(new T.TorusGeometry(0.5, 0.025, 4, 40), ringM); frostRing.rotation.x = PI / 2; frostRing.position.y = 0.03; b.add(frostRing);
  const fl = _glowPool(0.8, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(lc); fl.m.material.opacity = 0.25; b.add(fl.g);
  const Lt = new T.PointLight(0xffffff, 0.6, 4, 2); Lt.color.copy(lc); Lt.position.set(0, y0 * 0.5, D * 0.7); b.add(Lt); LIGHTS.push(Lt);
  return { g, core: (y0 + H * 0.5) * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act), s = Math.sin(ph), c = Math.cos(ph), q = 1 - a;
    // the glide: from side to side, leaning into each stride and turning with it; the spin (action) goes once round on its points, with a little hop
    rig.position.set(0.06 * s * q, 0.03 * Math.sin(PI * pr), 0); rig.rotation.set(0, 0.12 * c * q + TAU * pr, -0.07 * s * q);
    legs.forEach(L => { const side = L.ci === 0 ? 1 : L.ci === 2 ? -1 : 0, push = side * s * 0.05 * q; L.lg.position.z = L.sz * (D / 2 - o.gem) - push; L.lg.rotation.x = -push * 2.4; });
    flecks.forEach(F => { const u = ((ph / TAU) * 2 + F.k) % 1; F.f.position.set(F.sx * (0.28 + 0.12 * u) + rig.position.x * 0.5, 0.02 + 0.1 * u * (1 - u) * 4, -D * 0.4 - 0.5 * u); F.f.scale.setScalar((1 - u) * (0.8 + 0.6 * a)); F.f.rotation.y = u * 6; });
    frostRing.scale.setScalar(0.6 + 1.6 * a); ringM.opacity = 0.75 * Math.sin(PI * a);
  } };
}
const _ig0 = { S: 1.4, W: 1.1, H: 0.58, D: 0.76, y0: 0.4, gem: 0.16, legH: 0.52,
  ice: ['#5e9fd0', '#4f8fc4', '#6dacd8', '#4482b8', '#64a6d4'],
  cols: [{ w: 0.29, seams: [0.31, 0.58], depth: [0.52, 0.44, 0.58] }, { w: 0.31, seams: [0.2, 0.62], depth: [0.46, 0.56, 0.48] }, { w: 0.4, seams: [0.21, 0.44], depth: [0.55, 0.47, 0.53] }] };
fx(852, "The ice technician, the IGLOO SKATER (the user's sketch): a squat box of cut ice blocks in three columns with their own seams, standing on diamonds it skates on.", () => _iglooSkater(_ig0));

// ── 856 · THE IGLOO SKATER OF FITTED BRICKS ─────────────────────────────────────────────────────────────
// ASKED (on 852): "Only 4 legs and it should look like fitted bricks on the body and the diamonds are nested under the body". The body is a box of ice bricks laid in
// staggered courses on its four walls and its top, dark mortar in the joints; four diamonds sit in sockets under it, only their lower halves showing, and it skates on them.
function _iglooBricks(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color);
  const rig = G(); b.add(rig);   // body and diamonds: it glides and spins as one
  const W = o.W, H = o.H, D = o.D, y0 = o.y0, gap = o.gap, t = o.brickT;
  const mortar = new T.MeshStandardMaterial({ color: _lin31(0x16324a), roughness: 0.7, metalness: 0.05 }); mortar.envMapIntensity = 0.25;
  const core = cbox(W - 0.03, H - 0.03, D - 0.03, 0.02, mortar); core.position.y = y0 + H / 2; rig.add(core);
  const iceMats = o.ice.map(hx => { const m = new T.MeshStandardMaterial({ color: _lin31(hx), emissive: _lin31(hx).multiplyScalar(0.06), roughness: 0.38, metalness: 0.02 }); m.envMapIntensity = 0.9; return m; });
  // lay a face with bricks: centre c, its along-axis U and up-axis Vv (U x Vv is its outward normal), w x h, rows courses of bricks bl long, each course half a brick on from the last
  const M4 = new T.Matrix4(); let n = 0;
  const lay = (c, U, Vv, w, h, rows, bl, phase) => { const N = new T.Vector3().crossVectors(U, Vv), q = new T.Quaternion().setFromRotationMatrix(M4.makeBasis(U, Vv, N));
    for (let r = 0; r < rows; r++) { const v0 = -h / 2 + r * h / rows, v1 = v0 + h / rows, off = ((r + phase) % 2) * bl / 2;
      for (let u0 = -w / 2 - off; u0 < w / 2 - 0.01; u0 += bl) { const a = Math.max(-w / 2, u0), e = Math.min(w / 2, u0 + bl); if (e - a < 0.05) continue;
        const k = (n++ * 7 + r * 3) % iceMats.length, bx = cbox(e - a - gap, v1 - v0 - gap, t, 0.022, iceMats[k]); bx.quaternion.copy(q);
        bx.position.copy(c).addScaledVector(U, (a + e) / 2).addScaledVector(Vv, (v0 + v1) / 2).addScaledVector(N, -t / 2 + 0.004); rig.add(bx); } } };
  const X = V(1, 0, 0), Yv = V(0, 1, 0), Z = V(0, 0, 1), mid = y0 + H / 2;
  lay(V(0, mid, D / 2), X, Yv, W, H, o.rows, o.brick, 0);                                    // the front
  lay(V(0, mid, -D / 2), X.clone().negate(), Yv, W, H, o.rows, o.brick, 1);                  // the back
  lay(V(W / 2, mid, 0), Z.clone().negate(), Yv, D - 2 * t, H, o.rows, o.brick, 1);           // the right side (inside the front and back's ends)
  lay(V(-W / 2, mid, 0), Z, Yv, D - 2 * t, H, o.rows, o.brick, 0);                           // the left side
  lay(V(0, y0 + H, 0), X, Z.clone().negate(), W - 2 * t, D - 2 * t, o.topRows, o.brick, 0);  // the top
  // the diamonds: four, set in sockets under the body, their upper halves inside it
  const sockM = new T.MeshStandardMaterial({ color: _lin31(0x0f2133), roughness: 0.6, metalness: 0.2 }); sockM.envMapIntensity = 0.3;
  const legs = []; for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const gm = _litFacets(_diamond31(o.gem, o.legH, 6).toNonIndexed()); _shadeCrystal(gm, 1, true, 0, o.legH);
    const lg = new T.Mesh(gm, new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); lg.position.set(sx * W * o.legX, y0 - o.legH / 2 + 0.005, sz * D * o.legZ); rig.add(lg);
    const sock = new T.Mesh(new T.TorusGeometry(o.gem * 1.02, 0.03, 6, 20), sockM); sock.rotation.x = PI / 2; sock.position.set(lg.position.x, y0 - 0.008, lg.position.z); rig.add(sock);
    legs.push({ lg, sx, sz }); }
  // frost: flecks kicked off behind by the glide, and a ring of it in the spin
  const fleckM = new T.MeshBasicMaterial({ color: 0xeefbff, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false });
  const flecks = []; for (let i = 0; i < 10; i++) { const f = new T.Mesh(new T.OctahedronGeometry(0.02 + 0.008 * (i % 3), 0), fleckM); b.add(f); flecks.push({ f, k: i / 10, sx: i % 2 ? 1 : -1 }); }
  const ringM = new T.MeshBasicMaterial({ color: lc.clone().lerp(_c31(0xffffff), 0.5), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const frostRing = new T.Mesh(new T.TorusGeometry(0.5, 0.025, 4, 40), ringM); frostRing.rotation.x = PI / 2; frostRing.position.y = 0.03; b.add(frostRing);
  const fl = _glowPool(0.8, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(lc); fl.m.material.opacity = 0.25; b.add(fl.g);
  const Lt = new T.PointLight(0xffffff, 0.6, 4, 2); Lt.color.copy(lc); Lt.position.set(0, y0 * 0.5, D * 0.7); b.add(Lt); LIGHTS.push(Lt);
  return { g, core: (y0 + H * 0.5) * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act), s = Math.sin(ph), c = Math.cos(ph), q = 1 - a;
    // the glide: from side to side on its diamonds, leaning into each stride and turning with it; the spin (action) goes once round on them, with a little hop
    if (o.cart) { rig.position.set(0, 0.008 * Math.abs(s) + 0.03 * Math.sin(PI * pr), 0.045 * s * q); rig.rotation.set(-0.025 * c * q, TAU * pr, 0); }   // ("moves like a train cart": glides along its length, rocking a little)
    else { rig.position.set(0.06 * s * q, 0.03 * Math.sin(PI * pr), 0); rig.rotation.set(0, 0.12 * c * q + TAU * pr, -0.06 * s * q); }
    flecks.forEach(F => { const u = ((ph / TAU) * 2 + F.k) % 1; F.f.position.set(F.sx * (W * 0.3 + 0.12 * u) + rig.position.x * 0.5, 0.02 + 0.1 * u * (1 - u) * 4, -D * 0.45 - 0.5 * u); F.f.scale.setScalar((1 - u) * (0.8 + 0.6 * a)); F.f.rotation.y = u * 6; });
    frostRing.scale.setScalar(0.6 + 1.6 * a); ringM.opacity = 0.75 * Math.sin(PI * a);
  } };
}
const _igb0 = { S: 1.4, W: 1.1, H: 0.58, D: 0.76, y0: 0.2, gap: 0.028, brickT: 0.09, rows: 2, topRows: 2, brick: 0.5, gem: 0.15, legH: 0.42, legX: 0.27, legZ: 0.24,   // ("bigger bricks, 2 layers")
  ice: ['#6aa7d4', '#5a98c8', '#7bb6dd', '#4f8dc0', '#72afd9'] };
// 857: "when it moves like a train cart, so that the smaller side is front facing": the same box turned to run along its length (narrow end first), gliding like a cart.
fx(857, "The ice technician, the IGLOO SKATER of fitted bricks running like a train cart (the user's ask): its narrow end first, gliding along its length on four nested diamonds.", () => _iglooBricks(Object.assign({}, _igb0, { W: 0.76, D: 1.1, cart: true, legX: 0.3, legZ: 0.3 })));
fx(856, "The ice technician, the IGLOO SKATER of fitted bricks (the user's ask): a box of ice bricks in staggered courses, dark mortar in the joints, on four diamonds nested in sockets under it.", () => _iglooBricks(_igb0));
