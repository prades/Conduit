// ── THE CORE BRAWLER AND THE ICE MAGE · Nos. 860–861 (from the user's design sheets) ────────────────────
//   860  THE JELLY RAM, the CORE BRAWLER (the "CORE BRAWLER · JELLY RAM" sheet: "a floating brawler that uses its horned shell to ram targets. Half of its body is a circular
//        helmet housing a glowing core, while the rear consists of gelatinous tentacles for smooth, hovering movement"): a clear glass dome with a big diamond in it, a black helmet
//        band round it with an ear-piece either side and a horn out of each, lit along its top; behind, a body of jelly trailing tentacles that end in drops. Its idle hovers, the
//        tentacles swaying; its action is the sheet's charge: it draws back and rams forward, the tentacles streaming behind, a burst at its front.
//   861  THE RIMESTAR, the ICE MAGE (the user's sheet; the sheet has no name, this one is ours): a white drone of three long fins round a faceted blue diamond, the fins on black
//        joints ringed with light, a line of light along each, a dark disc with a glowing eye at its back. It hovers; its idle sways the fins and breathes; its action spins them a
//        third of a turn (three alike: it closes), flares the diamond and throws a ring of frost and shards ahead.
// Uses forms31.js's helpers (_lin31, _c31, _hot31, _gemLit31, _prog31). +z is the front; ph = 1.6 t runs once round the idle loop.

// a tube along points pts[0..n-1] (root to tip), its radius going r0 -> r1: a tentacle, rebuilt in place by set() every frame
function _taper32(parent, mat, n, ring) {
  ring = ring || 8; const pos = new Float32Array(n * ring * 3), idx = [];
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < ring; j++) { const a = i * ring + j, b = i * ring + (j + 1) % ring, c = (i + 1) * ring + j, d = (i + 1) * ring + (j + 1) % ring; idx.push(a, b, c, b, d, c); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setIndex(idx);
  const m = new T.Mesh(geo, mat); m.renderOrder = 6; parent.add(m);
  const t = new T.Vector3(), nr = new T.Vector3(), bi = new T.Vector3(), up = new T.Vector3(0, 1, 0), ax = new T.Vector3(1, 0, 0);
  return { m, set(pts, r0, r1, rf, fx, fy) {   // rf(s): the radius along it (0 at the root, 1 at the tip), if not r0 -> r1; fx, fy: its cross-section drawn out sideways / flattened (a ribbon)
    for (let i = 0; i < n; i++) {
      t.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize();
      nr.copy(Math.abs(t.y) > 0.9 ? ax : up).cross(t).normalize(); bi.copy(t).cross(nr).normalize();
      const r = rf ? rf(i / (n - 1)) : r0 + (r1 - r0) * i / (n - 1), p = pts[i];
      for (let j = 0; j < ring; j++) { const a = j / ring * TAU, c = Math.cos(a) * r * (fx || 1), s = Math.sin(a) * r * (fy || 1), k = (i * ring + j) * 3;
        pos[k] = p.x + nr.x * c + bi.x * s; pos[k + 1] = p.y + nr.y * c + bi.y * s; pos[k + 2] = p.z + nr.z * c + bi.z * s; }
    }
    geo.attributes.position.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
  } };
}
// turn obj so its +y points along dir and its +z as near to `up` as it can (a horn's lit top stays on top)
function _aim32(obj, dir, up) { const y = dir.clone().normalize(), z = up.clone().sub(y.clone().multiplyScalar(up.dot(y))).normalize(), x = new T.Vector3().crossVectors(y, z); obj.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z)); }
// a gem coloured facet by facet from its own base colour (linear) to white, lit from a light fixed in the model (as _gemLit31, but not the element's colour)
function _gemCol32(geo, base) {
  geo = geo.index ? geo.toNonIndexed() : geo;
  const pos = geo.attributes.position, col = new Float32Array(pos.count * 3); geo.setAttribute('color', new T.BufferAttribute(col, 3));
  const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
  const a = new T.Vector3(), b = new T.Vector3(), c = new T.Vector3(), n = new T.Vector3(), Ld = new T.Vector3(-0.4, 0.7, 0.6).normalize();
  m.userData.relight = (glow) => { const g = glow || 0;
    for (let i = 0; i < pos.count; i += 3) {
      a.fromBufferAttribute(pos, i).multiply(m.scale); b.fromBufferAttribute(pos, i + 1).multiply(m.scale); c.fromBufferAttribute(pos, i + 2).multiply(m.scale);
      n.crossVectors(b.sub(a), c.sub(a)).normalize().applyQuaternion(m.quaternion);
      const k = 0.5 + 0.5 * n.dot(Ld), w = 0.45 * k * k * k + 0.25 * g, f = 0.35 + 0.65 * k + 0.3 * g;
      for (let j = 0; j < 3; j++) { col[(i + j) * 3] = base.r * f + w; col[(i + j) * 3 + 1] = base.g * f + w; col[(i + j) * 3 + 2] = base.b * f + w; }
    }
    geo.attributes.color.needsUpdate = true;
  };
  m.userData.relight(); return m;
}

const _zAx32 = new T.Vector3(0, 0, 1);
// ── 860 · THE JELLY RAM ────────────────────────────────────────────────────────────────────────────────
const _jrBlack = new T.MeshStandardMaterial({ color: 0x0d0e13, metalness: 0.8, roughness: 0.3, flatShading: true }); _jrBlack.envMapIntensity = 0.55;
const _jrBlack2 = _jrBlack.clone(); _jrBlack2.side = T.DoubleSide; _jrBlack2.roughness = 0.45; _jrBlack2.envMapIntensity = 0.35;   // (the band is an open ring: both its faces show; rougher, or one facet of it mirrors the studio's panel as a white stripe)
const _jrCup = new T.MeshStandardMaterial({ color: 0x111218, metalness: 0.4, roughness: 0.5, flatShading: true }); _jrCup.envMapIntensity = 0.3;   // (the ear-pieces' flat faces: a mirror there flashes white)
const _jrGlass = new T.MeshStandardMaterial({ color: 0xdfefff, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.2, depthWrite: false }); _jrGlass.envMapIntensity = 1.6;
function _jellyRam(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color), lcL = lc.clone().convertSRGBToLinear(), lit = lc.clone().lerp(_c31(0xffffff), 0.2).convertSRGBToLinear(), glowM = _hot31(lit);
  const jellyM = new T.MeshStandardMaterial({ color: lcL.clone().multiplyScalar(0.5), emissive: lcL.clone().multiplyScalar(0.4), roughness: 0.12, metalness: 0, transparent: true, opacity: 0.74, depthWrite: false }); jellyM.envMapIntensity = 0.6;
  const R = o.R, Y = o.y;
  const body = G(); body.position.y = Y; b.add(body);   // hovers: everything but the floor glow moves with it
  // the helmet: the clear dome in front with the diamond in it, a black band round it (an ear-piece either side, a horn out of each, lit along the top), a ridge over it
  const dia = _gemLit31(new T.OctahedronGeometry(o.dia, 0)); dia.scale.set(1, 1.45, 0.8); dia.position.z = R * 0.22; body.add(dia);
  const heart = new T.Mesh(new T.SphereGeometry(o.dia * 0.9, 16, 12), new T.MeshBasicMaterial({ color: lit.clone().multiplyScalar(0.55), transparent: true, opacity: 0.35, depthWrite: false, toneMapped: false })); heart.position.z = R * 0.05; heart.renderOrder = 5; body.add(heart);
  const dome = new T.Mesh(new T.SphereGeometry(R, 32, 20), _jrGlass); dome.renderOrder = 7; body.add(dome);
  const band = new T.Mesh(new T.CylinderGeometry(R + 0.035, R + 0.035, 0.15, 36, 1, true), _jrBlack2); band.rotation.x = PI / 2; band.position.z = -0.04; body.add(band);
  const rim = new T.Mesh(new T.TorusGeometry(R + 0.04, 0.026, 8, 40), _jrBlack); rim.position.z = 0.035; body.add(rim);
  const ridge = cbox(0.13, 0.07, 0.3, 0.025, _jrBlack); ridge.position.set(0, R + 0.055, -0.1); ridge.rotation.x = 0.12; body.add(ridge);
  const horns = [];
  for (const sx of [-1, 1]) {
    const cup = cyl(0.13, 0.15, 0.09, _jrCup, 18); cup.rotation.z = PI / 2; cup.position.set(sx * (R + 0.06), -0.02, -0.04); body.add(cup);
    const ring = new T.Mesh(new T.TorusGeometry(0.085, 0.009, 4, 24), glowM); ring.rotation.y = PI / 2; ring.position.set(sx * (R + 0.107), -0.02, -0.04); body.add(ring);
    const hg = G(); hg.position.set(sx * (R + 0.1), -0.03, -0.03); _aim32(hg, V(sx * o.hornOut, -0.06, o.hornFwd), V(0, 1, 0)); body.add(hg);
    const horn = new T.Mesh(new T.ConeGeometry(o.hornR, o.hornL, 8), _jrBlack); horn.position.y = o.hornL / 2; hg.add(horn);
    _limb(hg, 0.011, glowM, 5).set(V(0, o.hornL * 0.12, o.hornR * 0.88 + 0.008), V(0, o.hornL * 0.7, o.hornR * 0.3 + 0.008));   // along its top
    horns.push(hg);
  }
  // the jelly: a body of it behind the band, and tentacles trailing back and down from it, each ending in a drop
  const back = new T.Mesh(new T.SphereGeometry(R * 0.95, 28, 18), jellyM); back.scale.set(1, 0.92, 1.05); back.position.z = -R * 0.62; back.renderOrder = 6; body.add(back);
  const style = o.tent || 'drop', K = o.tentacles, N = style === 'drop' ? 12 : 16, tent = [];
  // (o.tent, the tentacles' shape: 'drop', the first, tubes with a ball at the end; 'goo', the sheet's thick flat uneven streams pinching into a drip, droplets breaking off;
  // 'taper', smooth arms narrowing to a point; 'string', thin wavy strings, more of them)
  for (let k = 0; k < K; k++) { const u = K > 1 ? (k / (K - 1)) * 2 - 1 : 0, mid = 1 - Math.abs(u), row = k % 2;   // two rows, the lower one hanging more
    const root = V(u * R * 0.7, -R * (0.3 + 0.22 * row) - 0.04 * mid, -R * (0.95 - 0.25 * row) + 0.06 * Math.abs(u)), L = o.tentL * (0.75 + 0.3 * mid + 0.12 * ((k * 53) % 7) / 7), droop = 0.22 + 0.14 * row + 0.08 * ((k * 37) % 5) / 5;
    const tb = _taper32(body, jellyM, N, style === 'string' ? 6 : 10), drop = new T.Mesh(new T.SphereGeometry(1, 14, 10), jellyM); drop.renderOrder = 6; drop.visible = style === 'drop' || style === 'goo'; body.add(drop);   // (a drop: a sphere drawn out along the tentacle's end)
    tent.push({ u, mid, root, L: L * (style === 'string' ? 1.08 : style === 'goo' ? 0.94 : 1), droop, tb, drop, k, pts: Array.from({ length: N }, () => V(0, 0, 0)) }); }
  const droplets = style === 'goo' ? [1, 3, 5, 7].filter(k => k < K).map((k, i) => { const m = new T.Mesh(new T.SphereGeometry(1, 10, 8), jellyM); m.renderOrder = 6; body.add(m); return { m, k, i }; }) : [];
  // the charge's burst: shards and a flash at its front
  const shardM = _hot31(lit.clone().lerp(_c31(0xffffff), 0.4));
  const shards = []; for (let i = 0; i < 8; i++) { const s = new T.Mesh(new T.OctahedronGeometry(0.035, 0), shardM); s.visible = false; body.add(s); shards.push({ s, a: i * TAU / 8 + 0.3 }); }
  const flashM = new T.MeshBasicMaterial({ color: lit, transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const flash = new T.Mesh(new T.TorusGeometry(R * 0.9, 0.035, 6, 32), flashM); flash.position.z = R + 0.1; body.add(flash);
  const fl = _glowPool(0.7, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(lc); fl.m.material.opacity = 0.3; b.add(fl.g);
  const Lt = new T.PointLight(0xffffff, 0.8, 4, 2); Lt.color.copy(lc); Lt.position.set(0, R * 0.2, R + 0.3); body.add(Lt); LIGHTS.push(Lt);
  return { g, core: Y * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act);
    // the charge: draws back, then rams forward and comes back (all of it in the action's frames)
    const ram = (pr < 0.32 ? -0.12 * Math.sin(PI * pr / 0.32) : 0.42 * Math.sin(PI * (pr - 0.32) / 0.68)) * (o.ramK || 1), hit = pr > 0.5 && pr < 0.95 ? Math.sin(PI * (pr - 0.5) / 0.45) : 0;
    // the swim (o.swim; "it needs to move with flicks from all of its tentacles like the jellyfish from SpongeBob"): once a loop every tentacle flicks back at once, the
    // bell of jelly squeezes and it bobs up; then it glides, sinking a little, while the tentacles fan out again. The flick runs from root to tip, so they whip.
    const U = ((ph / TAU) % 1 + 1) % 1, pulseAt = v => { v = ((v % 1) + 1) % 1; return v < 0.18 ? Math.sin(PI / 2 * v / 0.18) : v < 0.8 ? Math.cos(PI / 2 * (v - 0.18) / 0.62) : 0; };
    const lift = U < 0.35 ? Math.sin(PI / 2 * U / 0.35) : Math.cos(PI / 2 * (U - 0.35) / 0.65), pulse = pulseAt(U);
    if (o.swim) { body.position.set(0, Y + (0.09 * lift - 0.03) * (1 - a), ram); body.rotation.set(-0.1 * pulse * (1 - a) + 0.12 * Math.max(0, ram), 0, 0);
      back.scale.set(1 + 0.16 * pulse * (1 - a), 0.92 * (1 - 0.2 * pulse * (1 - a)), 1.05 * (1 - 0.08 * pulse * (1 - a))); }
    else body.position.set(0, Y + 0.035 * Math.sin(ph * 2) * (1 - a), ram), body.rotation.set(0.035 * Math.sin(ph) * (1 - a) + 0.12 * Math.max(0, ram), 0, 0.025 * Math.sin(ph + 1) * (1 - a));
    heart.material.opacity = 0.3 + 0.06 * Math.sin(ph * 2) + 0.4 * hit; dia.scale.set(1 + 0.03 * Math.sin(ph * 2) + 0.15 * hit, 1.45 * (1 + 0.03 * Math.sin(ph * 2) + 0.15 * hit), 0.8); dia.userData.relight();
    glowM.color.copy(lit).multiplyScalar(0.8 + 0.2 * Math.sin(ph * 2) + 0.5 * a);
    // the tentacles: a wave runs down each; in the charge they stream straight back
    const stream = Math.min(1, a * 1.4);
    tent.forEach(T0 => { const { u, mid, root, L, droop, pts, k } = T0;
      if (o.swim) for (let i = 0; i < N; i++) { const s = i / (N - 1), ps = pulseAt(U - 0.14 * s) * (1 - a), rip = (style === 'string' ? 0.06 : 0.03) * s * Math.sin(TAU * U - (style === 'string' ? 7 : 4) * s + (style === 'string' ? k * 1.3 : 0)) * (1 - a);   // the flick reaches each point a little later than the one before
        pts[i].set(root.x * (1 - 0.35 * ps) + u * 0.3 * s * (1 - 0.8 * ps) + rip * u,
                   root.y - (droop * 1.35 * s + 0.2 * s * s) * (1 - 0.8 * ps) * (1 - 0.7 * stream) + rip,
                   root.z - L * s * (0.72 + 0.32 * ps + 0.15 * stream)); }   // (in the charge they stream straight back, no longer: the cell's edge)
      else for (let i = 0; i < N; i++) { const s = i / (N - 1), w = 2 * ph - 5 * s + k * 0.9;
        pts[i].set(root.x + u * 0.2 * s + 0.05 * s * Math.sin(w) * (1 - 0.6 * stream),
                   root.y - (droop * s + 0.14 * s * s) * (1 - 0.7 * stream) + 0.045 * s * Math.cos(w + 0.7) * (1 - 0.6 * stream),
                   root.z - L * s * (0.85 + 0.45 * stream)); }
      const R0 = (style === 'string' ? (o.strR || 0.032) : style === 'taper' ? 0.085 : 0.09) + 0.02 * mid * (style === 'string' ? 0.3 : 1);   // (o.strR: a string's thickness at its root)
      if (style === 'goo') T0.tb.set(pts, 0, 0, s => R0 * (1 - 0.45 * s) * (1 + 0.2 * Math.sin(PI * (2.4 * s + 0.37 * k))) * (1 - 0.45 * Math.min(1, Math.max(0, (s - 0.76) / 0.16))), 1.45, 0.75);
      else if (style === 'taper') T0.tb.set(pts, 0, 0, s => R0 * Math.pow(1 - s, 0.85) + 0.004);
      else if (style === 'string') T0.tb.set(pts, 0, 0, s => R0 * (1 - 0.85 * s) + 0.003);
      else T0.tb.set(pts, 0.08 + 0.02 * mid, 0.03);
      const tip = pts[N - 1], pre = pts[N - 2]; T0.dir = (T0.dir || V(0, 0, 0)).copy(tip).sub(pre).normalize();
      if (style === 'goo') { T0.drop.position.copy(tip).addScaledVector(T0.dir, 0.03); T0.drop.scale.set(R0 * 0.62, R0 * 0.62, R0 * 1.05); }   // a drip, drawn out along the stream
      else T0.drop.position.copy(tip), T0.drop.scale.set(0.05 + 0.012 * mid, 0.05 + 0.012 * mid, 0.07 + 0.015 * mid);
      T0.drop.quaternion.setFromUnitVectors(_zAx32, T0.dir); });
    // a few droplets breaking off the drips, falling behind the stroke
    droplets.forEach(D => { const T0 = tent[D.k], tip = T0.pts[N - 1], f = ((((ph / TAU) + D.i * 0.27) % 1) + 1) % 1; D.m.position.copy(tip).addScaledVector(T0.dir, 0.05 + 0.07 * f); D.m.position.y -= 0.05 * f * f; D.m.scale.setScalar(0.022 * (1 - 0.6 * f)); });
    shards.forEach((S, i) => { S.s.visible = hit > 0.05; const r = 0.12 + 0.45 * hit; S.s.position.set(Math.cos(S.a) * r, Math.sin(S.a) * r * 0.8, R + 0.12 + 0.1 * hit); S.s.scale.setScalar(0.6 + 0.8 * hit); });
    flash.scale.setScalar(0.5 + 0.9 * hit); flashM.opacity = 0.85 * hit;
  } };
}
const _jr0 = { S: 1.45, R: 0.34, y: 0.74, dia: 0.17, hornR: 0.11, hornL: 0.46, hornOut: 0.88, hornFwd: 0.42, tentacles: 9, tentL: 0.62 };
// 862: the Jelly Ram after the user's review: it swims like a jellyfish (every tentacle flicks at once, the bell squeezes, it bobs up and glides), and it is a little bigger.
fx(862, "The core brawler, the JELLY RAM swimming (the user's ask): every tentacle flicks back at once like a jellyfish's stroke, the bell squeezes and it bobs up, then glides; a little bigger.", () => _jellyRam(Object.assign({}, _jr0, { swim: true, S: 1.6, tentL: 0.54, ramK: 0.55 })));   // (ramK: a shorter lunge, so the bigger ram stays in its cell)
const _jrSwim = Object.assign({}, _jr0, { swim: true, S: 1.6, tentL: 0.54, ramK: 0.55 });
fx(863, "The JELLY RAM swimming, its tentacles as the sheet's: thick flat uneven streams of jelly that pinch into a drip, droplets breaking off.", () => _jellyRam(Object.assign({}, _jrSwim, { tent: 'goo' })));
fx(864, "The JELLY RAM swimming, its tentacles smooth arms narrowing to a point.", () => _jellyRam(Object.assign({}, _jrSwim, { tent: 'taper', tentacles: 8 })));
fx(865, "The JELLY RAM swimming, its tentacles thin wavy strings, more of them.", () => _jellyRam(Object.assign({}, _jrSwim, { tent: 'string', tentacles: 12 })));
// 866: the user chose the strings, "but fewer and thicker": seven of them, about half as thick again.
fx(866, "The JELLY RAM swimming, its tentacles wavy strings, seven of them and thicker (the user's pick: C, fewer and thicker).", () => _jellyRam(Object.assign({}, _jrSwim, { tent: 'string', tentacles: 7, strR: 0.052 })));
fx(860, "The core brawler, the JELLY RAM: a clear dome with a big diamond in it under a black helmet band, a horn out of either side lit along its top, a body of jelly trailing tentacles that end in drops; it hovers and rams.", () => _jellyRam(_jr0));

// ── 861 · THE RIMESTAR ─────────────────────────────────────────────────────────────────────────────────
const _rsWhite = new T.MeshStandardMaterial({ color: _lin31(0xe6eaf0), metalness: 0.08, roughness: 0.36, flatShading: true }); _rsWhite.envMapIntensity = 0.8;
const _rsDark = new T.MeshStandardMaterial({ color: 0x14161c, metalness: 0.7, roughness: 0.35, flatShading: true }); _rsDark.envMapIntensity = 0.55;
// a fin: a long leaf along +y from its root (y = 0) to its point (y = L), w across, d thick, centred on z = 0
function _fin32(L, w, d) {
  const s = new T.Shape(); s.moveTo(-w * 0.36, 0); s.quadraticCurveTo(-w * 0.62, L * 0.32, -w * 0.2, L * 0.78); s.quadraticCurveTo(-w * 0.06, L * 0.95, 0, L);
  s.quadraticCurveTo(w * 0.1, L * 0.9, w * 0.26, L * 0.72); s.quadraticCurveTo(w * 0.58, L * 0.3, w * 0.36, 0); s.closePath();
  const geo = new T.ExtrudeGeometry(s, { depth: d * 0.4, bevelEnabled: true, bevelThickness: d * 0.3, bevelSize: w * 0.1, bevelSegments: 2, curveSegments: 12 }); geo.translate(0, 0, -d * 0.2); return geo;
}
function _rimestar(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lc = _c31(EL.color), lit = lc.clone().lerp(_c31(0xffffff), 0.15).convertSRGBToLinear(), glowM = _hot31(lit), ringM = _hot31(lit);
  const body = G(); body.position.y = o.y; b.add(body);
  // the core: a faceted white ball, the blue diamond set in its front in a dark frame, a dark disc with a glowing eye at its back
  const ball = new T.Mesh(new T.IcosahedronGeometry(o.core, 1), _rsWhite); body.add(ball);
  const frame = new T.Mesh(new T.OctahedronGeometry(o.dia * 1.18, 0), _rsDark); frame.scale.set(0.95, 1.3, 0.5); frame.position.z = o.core * 0.55; body.add(frame);
  const dia = _gemCol32(new T.OctahedronGeometry(o.dia, 0), _lin31(o.gem)); dia.scale.set(0.9, 1.3, 0.75); dia.position.z = o.core * 0.75; body.add(dia);
  const eye = cyl(o.core * 0.58, o.core * 0.62, 0.06, _rsDark, 20); eye.rotation.x = PI / 2; eye.position.z = -o.core * 0.92; body.add(eye);
  const pupil = new T.Mesh(new T.CircleGeometry(o.core * 0.22, 20), glowM); pupil.rotation.y = PI; pupil.position.z = -o.core * 0.92 - 0.032; body.add(pupil);
  const eyeRing = new T.Mesh(new T.TorusGeometry(o.core * 0.4, 0.008, 4, 28), ringM); eyeRing.position.z = -o.core * 0.92 - 0.031; body.add(eyeRing);
  // the fins: three, up and down either side, each on a dark joint ringed with light, a dark channel down its face with a line of light in it
  const spin = G(); body.add(spin);
  const fins = [];
  for (let k = 0; k < 3; k++) { const arm = G(); arm.rotation.z = k * TAU / 3; spin.add(arm);   // fin k points up, then a third of a turn round each
    const tilt = G(); tilt.position.y = o.core * 0.8; arm.add(tilt);
    const joint = cyl(0.055, 0.065, o.joint, _rsDark, 14); joint.position.y = o.joint / 2; tilt.add(joint);
    const jr = new T.Mesh(new T.TorusGeometry(0.067, 0.012, 6, 20), ringM); jr.rotation.x = PI / 2; jr.position.y = o.joint * 0.55; tilt.add(jr);
    const fin = new T.Mesh(_fin32(o.finL, o.finW, o.finD), _rsWhite); fin.position.y = o.joint - 0.02; tilt.add(fin);
    const ch = new T.Mesh(new T.BoxGeometry(o.finW * 0.2, o.finL * 0.62, 0.01), _rsDark); ch.position.set(0, o.joint + o.finL * 0.44, o.finD * 0.52); tilt.add(ch);
    _limb(tilt, 0.011, glowM, 5).set(V(0, o.joint + o.finL * 0.16, o.finD * 0.56), V(0, o.joint + o.finL * 0.72, o.finD * 0.56));
    fins.push({ tilt, k }); }
  // the cast: a ring of frost and shards thrown ahead
  const frostM = new T.MeshBasicMaterial({ color: lit.clone().lerp(_c31(0xffffff), 0.5), transparent: true, opacity: 0, depthWrite: false, toneMapped: false });
  const frost = new T.Mesh(new T.TorusGeometry(0.3, 0.022, 6, 36), frostM); body.add(frost);
  const shardM = _hot31(_c31(0xeefaff));
  const shards = []; for (let i = 0; i < 6; i++) { const s = new T.Mesh(new T.OctahedronGeometry(0.03, 0), shardM); s.scale.set(0.6, 0.6, 1.8); s.visible = false; body.add(s); shards.push({ s, a: i * TAU / 6 + 0.5 }); }
  const fl = _glowPool(0.65, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(lc); fl.m.material.opacity = 0.28; b.add(fl.g);
  const Lt = new T.PointLight(0xffffff, 0.7, 4, 2); Lt.color.copy(lc); Lt.position.set(0, 0, 0.6); body.add(Lt); LIGHTS.push(Lt);
  return { g, core: o.y * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act);
    body.position.y = o.y + 0.04 * Math.sin(ph * 2) * (1 - a) + 0.03 * a; body.rotation.set(0.04 * Math.sin(ph) * (1 - a) - 0.08 * a, 0, 0);
    spin.rotation.z = 0.12 * Math.sin(ph) * (1 - a) + (TAU / 3) * pr;   // sways; in the cast, a third of a turn (three alike: it closes)
    fins.forEach(F => { F.tilt.rotation.x = 0.07 * Math.sin(ph * 2 + F.k * 2.1) * (1 - a) - 0.3 * a; });
    dia.scale.set(0.9 * (1 + 0.04 * Math.sin(ph * 2) + 0.15 * a), 1.3 * (1 + 0.04 * Math.sin(ph * 2) + 0.15 * a), 0.75); dia.userData.relight(0.15 + 0.15 * Math.sin(ph * 2) + 0.8 * a);
    glowM.color.copy(lit).multiplyScalar(0.8 + 0.2 * Math.sin(ph * 2) + 0.5 * a); ringM.color.copy(lit).multiplyScalar(0.75 + 0.25 * Math.sin(ph * 2 + 1.5) + 0.5 * a);
    frost.position.z = o.core + 0.12 + 0.35 * pr; frost.scale.setScalar(0.5 + 1.4 * pr); frostM.opacity = 0.8 * Math.sin(PI * pr);
    shards.forEach((S, i) => { S.s.visible = a > 0.1; const r = 0.08 + 0.18 * pr; S.s.position.set(Math.cos(S.a) * r, Math.sin(S.a) * r, o.core + 0.15 + 0.6 * pr * (0.8 + 0.2 * (i % 2))); });
  } };
}
const _rs0 = { S: 1.35, y: 0.85, core: 0.21, dia: 0.17, gem: 0x2f6dff, joint: 0.12, finL: 0.62, finW: 0.22, finD: 0.08 };
fx(861, "The ice mage, the RIMESTAR: a white drone of three long fins round a faceted blue diamond, black joints ringed with light, a line of light along each fin, a dark disc with a glowing eye at its back.", () => _rimestar(_rs0));
