// ── THE CORAL CRAB, BLOOM's TECHNICIAN · drafts No. 912 and No. 913 (2026-11-08) ─────────────────────────────────────────────────
// The approved concept (docs/CONVERSION.md §2): "a black crab carrying a living pink coral on its back"; a crustacean; its main attack crushing (its claws clamp); its
// ability REEF (it fires little coral shards, and coral grows where they land). The owner's pencil page (2026-11-07, marked "CORAL CRAB"): a rounded, knobbly body, lumps
// on its top and a small horn, standing on long pointed legs drawn as leaf-shaped spears. In SUNDEW's approved finish (No. 911): matte velvet black, veined in glowing pink.
//   912  from the sketch: a round carapace topped with a mound of glowing coral bulbs and a coral spire (the horn), on six long spear-leaf legs; small claws in front.
//   913  a lower, wider crab with big crushing claws, a tall branching coral on its back, its tips glowing; jointed, pointed legs.
// Drafts for the owner's choice (2026-11-08: "Draft the coral crab next"): not in the game. Uses forms31.js (_c31, _prog31) and forms32.js (_taper32, _aim32).
// +z is the front; ph = 1.6 t runs once round the idle loop.
const _ccRnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;   // (seeded: the textures and the coral come out the same every time)
const _ccS = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const _ccBlack = new T.MeshStandardMaterial({ color: 0x050304, metalness: 0.05, roughness: 0.52, side: T.DoubleSide }); _ccBlack.envMapIntensity = 0.12;   // (SUNDEW's matte black)
// the carapace's skin, u round it and v from its crown down: velvet black and mottled (glow false), or its veins, glowing pink from the crown out over its sides (glow true)
function _ccShellTex(glow) {
  const W = 256, H = 128, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), rnd = _ccRnd(glow ? 5 : 3);
  g.fillStyle = glow ? '#000' : '#070406'; g.fillRect(0, 0, W, H);
  if (!glow) for (let i = 0; i < 260; i++) { const x = rnd() * W, y = rnd() * H, r = 3 + rnd() * 10, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rnd() < 0.55 ? 'rgba(30,14,24,0.4)' : 'rgba(0,0,0,0.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  else {
    g.lineCap = 'round'; g.strokeStyle = 'rgba(255,122,184,0.85)'; g.shadowColor = '#ff7ab8'; g.shadowBlur = 4;
    for (let k = 0; k < 16; k++) { let x = (k + 0.5) / 16 * W, y = 0; g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y);
      while (y < H * 0.62) { x += (rnd() - 0.5) * 7; y += 5 + rnd() * 5; g.lineTo(x, y);
        if (rnd() < 0.18) { g.stroke(); const bx = x + (rnd() < 0.5 ? -1 : 1) * (6 + rnd() * 8); g.beginPath(); g.moveTo(x, y); g.lineTo(bx, y + 6 + rnd() * 6); g.lineWidth = 1; g.stroke(); g.lineWidth = 1.6; g.beginPath(); g.moveTo(x, y); } }
      g.stroke(); }
  }
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = T.RepeatWrapping; t.anisotropy = 4; return t;
}
// the coral's skin: glowing pink, speckled lighter, pocked with dark pores (the cups of its living polyps)
function _ccCoralTex() {
  const W = 128, H = 64, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), rnd = _ccRnd(9);
  g.fillStyle = '#ff7ab8'; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { g.fillStyle = 'rgba(255,190,220,0.35)'; g.beginPath(); g.arc(rnd() * W, rnd() * H, 1 + rnd() * 2.5, 0, TAU); g.fill(); }
  for (let i = 0; i < 70; i++) { const x = rnd() * W, y = rnd() * H, r = 1.4 + rnd() * 2.2;
    g.fillStyle = 'rgba(60,8,30,0.9)'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(255,205,228,0.7)'; g.lineWidth = 0.8; g.beginPath(); g.arc(x, y, r + 0.8, 0, TAU); g.stroke(); }
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 4; return t;
}
// a horn or a finger: a cone, its base at the origin, its tip at +y, bent toward -z as it goes
function _ccHorn(len, rad, bend) {
  const geo = new T.ConeGeometry(rad, len, 8, 5), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const tt = (p.getY(i) + len / 2) / len; p.setZ(i, p.getZ(i) - bend * len * tt * tt); p.setY(i, p.getY(i) + len / 2); }
  geo.computeVertexNormals(); return geo;
}
function _coralCrab(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const shellM = new T.MeshStandardMaterial({ color: 0xffffff, map: _ccShellTex(false), emissive: 0xffffff, emissiveMap: _ccShellTex(true), emissiveIntensity: 0.75, metalness: 0.04, roughness: 0.55 });
  shellM.envMapIntensity = 0.1;
  const coralTex = _ccCoralTex(), coralM = new T.MeshStandardMaterial({ color: 0x1a0610, emissive: 0xffffff, emissiveMap: coralTex, emissiveIntensity: 0.85, metalness: 0, roughness: 0.68 }); coralM.envMapIntensity = 0.15;
  const bulbTex = coralTex.clone(); bulbTex.repeat.set(2.4, 1.8); bulbTex.needsUpdate = true;   // (finer pores on the bulbs)
  const bulbM = coralM.clone(); bulbM.emissiveMap = bulbTex;
  const tipM = new T.MeshBasicMaterial({ color: _c31(EL.color).convertSRGBToLinear().lerp(_c31(0xffffff), 0.35), toneMapped: false });
  const body = G(); b.add(body);   // (the carapace and all it carries: it bobs)
  // THE CARAPACE: a wide, low, knobbly shell, velvet black, veined in glowing pink
  const cg = new T.SphereGeometry(1, 48, 26), cp = cg.attributes.position;
  for (let i = 0; i < cp.count; i++) { const x = cp.getX(i), y = cp.getY(i), z = cp.getZ(i);
    const lump = 1 + o.knob * (Math.sin(5.3 * x + 1.1) * Math.sin(4.1 * z + 2.3) + 0.6 * Math.sin(9.7 * x - 2) * Math.sin(8.3 * z + 0.4) * Math.max(0, y));   // (knobbly, mostly on its back)
    cp.setXYZ(i, x * lump, (y < 0 ? y * 0.55 : y) * lump, z * lump); }
  cg.computeVertexNormals();
  const shell = new T.Mesh(cg, shellM); shell.scale.set(o.bodyW / 2, o.bodyH / 2, o.bodyL / 2); body.add(shell);
  const top = o.bodyH / 2;   // (its crown, above the body's middle)
  // THE CORAL on its back
  const coral = G(); body.add(coral); const tips = [];
  if (o.coral === 'bulbs') {   // (912: a mound of glowing bulbs, a spire for the sketch's horn, and a few short fingers)
    const rnd = _ccRnd(21);
    o.bulbs.forEach(([x, y, z, r], bi) => { const bg = new T.SphereGeometry(1, 26, 18), bp = bg.attributes.position;   // (lumpy, not round: each a little different)
      for (let i = 0; i < bp.count; i++) { const X = bp.getX(i), Y = bp.getY(i), Z = bp.getZ(i), k = 1 + 0.09 * Math.sin(6.3 * X + bi) * Math.sin(5.1 * Y + 2 * bi) * Math.sin(5.7 * Z + 1) + 0.05 * Math.sin(11 * X + 3 * Y + bi);
        bp.setXYZ(i, X * k, Y * k, Z * k); }
      bg.computeVertexNormals(); const m = new T.Mesh(bg, bulbM); m.scale.set(r, r * 0.85, r); m.position.set(x, top + y, z); m.rotation.set(rnd() * 3, rnd() * 3, 0); coral.add(m); });
    const sp = new T.Mesh(_ccHorn(o.spireL, o.spireR, 0.25), coralM); sp.position.set(o.spire[0], top + o.spire[1], o.spire[2]); _aim32(sp, V(0, 1, 0.45), V(0, 0, -1)); coral.add(sp);
    o.fingers.forEach(([x, y, z, dx, dy, dz, len]) => { const f = new T.Mesh(new T.CylinderGeometry(0.016, 0.022, len, 10), coralM); const d = V(dx, dy, dz).normalize();
      f.position.set(x + d.x * len / 2, top + y + d.y * len / 2, z + d.z * len / 2); _aim32(f, d, V(0, 1, 0)); coral.add(f);
      const tp = new T.Mesh(new T.SphereGeometry(0.024, 14, 10), tipM); tp.position.set(x + d.x * len, top + y + d.y * len, z + d.z * len); coral.add(tp); tips.push(tp); });
  } else {   // (913: a branching coral, forking as it grows, its tips glowing)
    const rnd = _ccRnd(33), grow = (P, d, len, r, depth) => {
      const E = P.clone().addScaledVector(d, len), m = new T.Mesh(new T.CylinderGeometry(r * 0.7, r, len, 10), coralM);
      m.position.copy(P).addScaledVector(d, len / 2); _aim32(m, d, V(0, 0, 1)); coral.add(m);
      const kn = new T.Mesh(new T.SphereGeometry(r * 0.72, 12, 8), coralM); kn.position.copy(E); coral.add(kn);   // (a smooth joint)
      if (depth > 0) for (let k = 0; k < 2; k++) { const a = (k ? 1 : -1) * (0.42 + rnd() * 0.25), ax = V(rnd() - 0.5, 0, rnd() - 0.5).normalize(), nd = d.clone().applyAxisAngle(ax, a);
        nd.y = Math.max(0.35, nd.y); nd.normalize(); grow(E, nd, len * (0.7 + rnd() * 0.12), r * 0.72, depth - 1); }
      else { const tp = new T.Mesh(new T.SphereGeometry(r * 1.05, 12, 8), tipM); tp.position.copy(E); coral.add(tp); tips.push(tp); } };
    o.trunks.forEach(([x, z, dx, dz]) => grow(V(x, top - 0.02, z), V(dx, 1, dz).normalize(), o.trunkL, o.trunkR, o.depth));
  }
  // THE LEGS: three a side; each a ringed upper leg up and out to its knee, then a long lower leg down to the floor: a pointed leaf-blade (912) or a jointed spike (913)
  const legs = []; [-1, 1].forEach(s => o.legZ.forEach((z, k) => legs.push({ s, z, k, ph: (k % 2 ? PI : 0) + (s > 0 ? PI : 0), up: _taper32(b, _ccBlack, 12, 8), lo: _taper32(b, _ccBlack, 16, 10),
    pu: Array.from({ length: 12 }, () => V(0, 0, 0)), pl: Array.from({ length: 16 }, () => V(0, 0, 0)) })));
  const A = V(0, 0, 0), K = V(0, 0, 0), F = V(0, 0, 0);
  legs.forEach(L => { L.knee = new T.Mesh(new T.SphereGeometry(o.legR * 1.25, 12, 8), _ccBlack); b.add(L.knee); });   // (a knobbed joint at each knee)
  // THE CLAWS: an arm forward from the front of the shell; a palm; a fixed finger and a hinged one that clamps
  const claws = [-1, 1].map(s => { const arm = _taper32(b, _ccBlack, 12, 8), pa = Array.from({ length: 12 }, () => V(0, 0, 0)), hand = G(); b.add(hand);
    const palm = new T.Mesh(new T.SphereGeometry(1, 22, 16), shellM); palm.scale.set(o.palm * 0.72, o.palm * 0.6, o.palm); hand.add(palm);
    const fx0 = new T.Mesh(_ccHorn(o.finger, o.palm * 0.32, 0.35), _ccBlack); fx0.position.set(0, -o.palm * 0.2, o.palm * 0.7); fx0.rotation.x = PI / 2 + 0.25; hand.add(fx0);   // (the fixed finger, forward and curling up)
    const piv = G(); piv.position.set(0, o.palm * 0.25, o.palm * 0.6); hand.add(piv);
    const fm = new T.Mesh(_ccHorn(o.finger * 0.95, o.palm * 0.28, -0.35), _ccBlack); fm.rotation.x = PI / 2 - 0.25; piv.add(fm);   // (the hinged finger, forward and curling down)
    return { s, arm, pa, hand, piv }; });
  const Lt = new T.PointLight(0xffffff, 0.6, 1.1, 2); Lt.color.copy(_c31(EL.color)); Lt.position.set(0, top + 0.25, 0); body.add(Lt); LIGHTS.push(Lt);
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, pr = _prog31(t, act), rear = _ccS(0, 0.3, pr) * (1 - _ccS(0.34, 0.5, pr)), strike = _ccS(0.34, 0.5, pr) * (1 - _ccS(0.62, 1, pr)), calm = 1 - 0.7 * Math.min(1, act || 0);
    const bob = 0.008 * Math.sin(2 * ph) * calm;
    body.position.set(0, o.bodyY + bob + 0.02 * rear, 0.03 * strike); body.rotation.x = -0.12 * rear + 0.08 * strike;
    const glow = (0.85 + 0.15 * Math.sin(2 * ph)) * (1 + 0.9 * Math.max(0.5 * rear, strike));
    coralM.emissiveIntensity = bulbM.emissiveIntensity = 0.85 * glow; tips.forEach((tp, i) => tp.scale.setScalar(0.9 + 0.12 * Math.sin(2 * ph + i * 1.3))); Lt.intensity = 0.6 * glow;
    legs.forEach(L => {   // (two tripods stepping in turn)
      const lift = Math.max(0, Math.sin(2 * ph + L.ph)) * o.lift * calm, swing = Math.cos(2 * ph + L.ph) * o.stride * calm, splay = (L.k - 1) * o.splay;
      A.set(L.s * o.hipX, o.bodyY + bob - 0.01, L.z);
      K.set(L.s * (o.hipX + o.kneeOut), o.bodyY + o.kneeUp + bob + 0.6 * lift, L.z + splay * 0.6 + swing * 0.4);
      F.set(L.s * (o.hipX + o.kneeOut + o.footOut), 0.004 + lift, L.z + splay + swing);
      L.knee.position.copy(K);
      for (let i = 0; i < 12; i++) { const u = i / 11; L.pu[i].lerpVectors(A, K, u); L.pu[i].y += 0.015 * Math.sin(PI * u); }
      L.up.set(L.pu, 0, 0, u => (o.legR - 0.008 * u) * (1 + 0.14 * Math.pow(0.5 + 0.5 * Math.cos(u * 3 * TAU), 3)), 1, 1);   // (ringed)
      for (let i = 0; i < 16; i++) { const u = i / 15; L.pl[i].lerpVectors(K, F, u); L.pl[i].x += L.s * 0.02 * Math.sin(PI * u); }   // (bowed a little outward)
      if (o.leafLeg) L.lo.set(L.pl, 0, 0, u => o.leafW * Math.pow(Math.sin(PI * Math.min(1, 0.1 + 0.9 * u)), 0.75) + 0.002, 1.25, 0.5);   // (a pointed leaf-blade: widest at its middle)
      else L.lo.set(L.pl, 0, 0, u => (o.legR * 0.85) * (1 - u) * (1 + 0.12 * Math.pow(0.5 + 0.5 * Math.cos(u * 2 * TAU), 3)) + 0.002, 1, 1);   // (a jointed spike, to a point)
    });
    claws.forEach(C => {   // (raised and opened as it rears; clamped shut, thrust forward, as it strikes)
      const sh = V(C.s * o.shoulderX, o.bodyY + bob, o.bodyL * 0.36), el = V(C.s * (o.shoulderX + 0.1), o.bodyY + bob + 0.03 + 0.08 * rear, o.bodyL * 0.36 + 0.09 + 0.02 * strike);
      const wr = V(C.s * (o.shoulderX + 0.05), o.bodyY + bob + 0.02 + 0.1 * rear - 0.03 * strike, o.bodyL * 0.36 + o.reachZ + 0.08 * strike);
      for (let i = 0; i < 12; i++) { const u = i / 11, a = (1 - u) * (1 - u), m = 2 * (1 - u) * u, c = u * u; C.pa[i].set(sh.x * a + el.x * m + wr.x * c, sh.y * a + el.y * m + wr.y * c, sh.z * a + el.z * m + wr.z * c); }
      C.arm.set(C.pa, 0, 0, u => (o.armR - 0.006 * u) * (1 + 0.12 * Math.pow(0.5 + 0.5 * Math.cos(u * 2 * TAU), 3)), 1, 1);
      C.hand.position.copy(wr); C.hand.rotation.set(-0.15 - 0.35 * rear + 0.1 * strike, -C.s * 0.28, 0);
      C.piv.rotation.x = -(0.22 + 0.06 * Math.sin(ph + C.s)) * calm - 0.55 * rear + 0.2 * strike;   // (open, then shut)
    });
  } };
}
const _ccA = {
  S: 1, coreY: 0.32, coral: 'bulbs', bodyW: 0.42, bodyH: 0.2, bodyL: 0.36, bodyY: 0.26, knob: 0.05,
  bulbs: [[0, 0.03, -0.01, 0.085], [0.08, 0.02, 0.04, 0.062], [-0.085, 0.02, 0.03, 0.066], [0.045, 0.04, -0.085, 0.057], [-0.055, 0.035, -0.08, 0.06], [0.11, -0.005, -0.04, 0.05], [-0.115, -0.005, -0.035, 0.046], [0.0, 0.07, -0.05, 0.05]],   // (x, y above its crown, z, radius)
  spire: [-0.03, 0.06, 0.06], spireL: 0.16, spireR: 0.03,
  fingers: [[0.06, 0.05, -0.1, 0.3, 1, -0.4, 0.09], [-0.07, 0.05, -0.11, -0.35, 1, -0.3, 0.1], [0.12, 0.02, 0.0, 0.8, 1, 0.1, 0.07]],   // (where, which way, how long)
  legZ: [0.07, -0.03, -0.13], hipX: 0.14, kneeOut: 0.13, kneeUp: 0.13, footOut: 0.15, splay: 0.07, legR: 0.024, leafLeg: true, leafW: 0.029, lift: 0.035, stride: 0.03,
  shoulderX: 0.1, armR: 0.02, palm: 0.05, finger: 0.07, reachZ: 0.17,
};
fx(912, "CORAL CRAB draft A, from the owner's sketch: a round, knobbly carapace of velvet black veined in glowing pink, topped with a mound of glowing pink coral bulbs, a coral spire for the horn and a few short fingers; six long legs, each a ringed upper leg and a pointed leaf-blade to the floor; small claws in front.", () => _coralCrab(_ccA));
const _ccB = Object.assign({}, _ccA, {
  coral: 'branch', bodyW: 0.48, bodyH: 0.17, bodyL: 0.34, bodyY: 0.2, knob: 0.04,
  trunks: [[0, -0.03, 0, -0.15], [0.07, 0.02, 0.5, 0.15], [-0.07, 0.02, -0.5, 0.1]], trunkL: 0.13, trunkR: 0.026, depth: 2,   // (where each trunk rises (x, z), its lean (x, z), its length and girth, how often it forks)
  legZ: [0.05, -0.04, -0.13], hipX: 0.16, kneeOut: 0.12, kneeUp: 0.1, footOut: 0.13, splay: 0.08, legR: 0.022, leafLeg: false,
  shoulderX: 0.12, armR: 0.03, palm: 0.085, finger: 0.1, reachZ: 0.2,
});
fx(913, "CORAL CRAB draft B: a lower, wider crab of the same velvet black veined in pink, big crushing claws in front, a tall branching coral on its back forking as it grows, its tips glowing; jointed, pointed legs.", () => _coralCrab(_ccB));

// ── 914 · THE CORAL TICK ───────────────────────────────────────────────────────────────────────────────────────────────────────────
// The owner on 912 and 913 (2026-11-08): "Look, it's not really a crab. It's more of a tick-looking thing, but it's rocky exterior and has those back legs like the
// picture." So: a tick's plump body, wider at the back, low, its underside flatter; its exterior rocky, plates of dark stone fitted together, the seams between them
// glowing BLOOM's pink; on its back (at first) the sketch's little coral spire and two nubs, now crystals (below); a small head at the front, its mouthparts clamping
// (its crushing bite); its legs the sketch's long pointed leaf-spears, four (the owner, interrupting the first render: "4 legs"; it had eight, as a tick has).
// THE CRYSTALS on its back (914; the owner, after the coral: "Instead of brain, coral and random little mushroom looking things let's just have jagged bold crystal
// instead it's like square pieces you know"): a few big crystals of square section breaking out of the rock, each a four-sided prism with a jagged point. One crystal:
// its base at the origin, pointing up (+y), its sides r from its axis at the top (a little narrower at its foot), h tall to its shoulders, its point tip higher and
// pushed off centre by jag (so no two points are alike), turned twist about its axis. With bot (the owner: "the crystals need to look whole. They look like they're
// clipping at the bottom"; their open feet were cut off by the rock): a whole crystal, pointed at both ends, its foot as wide as its top and a short point bot below
// it, set into the rock by that point. Without bot, open at a narrower foot.
function _ccCrystal(h, r, tip, jag, twist, seed, bot) {
  const rn = _ccRnd(seed), q = [], at = (k, y, rr) => [rr * Math.cos(twist + k * PI / 2), y, rr * Math.sin(twist + k * PI / 2)];
  const top = [0, 1, 2, 3].map(k => at(k, h * (1 - 0.12 * rn()), r)), foot = [0, 1, 2, 3].map(k => at(k, 0, r * (bot ? 0.95 : 0.82))), ax = jag * (rn() - 0.5) * r, az = jag * (rn() - 0.5) * r, apex = [ax, h + tip, az];
  for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; q.push(foot[k], top[k2], foot[k2], foot[k], top[k], top[k2], top[k], apex, top[k2]); }   // (its faces turned outward)
  if (bot) { const low = [0.5 * jag * (rn() - 0.5) * r, -bot, 0.5 * jag * (rn() - 0.5) * r]; for (let k = 0; k < 4; k++) q.push(foot[k], foot[(k + 1) % 4], low); }   // (its lower point)
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(q.flat(), 3)); geo.computeVertexNormals(); return geo;
}
// a deformed SphereGeometry's normals made one at its two poles and either side of its seam (NW: its width segments); smooth shading would show those copies apart
function _ccSmoothSeams(geo, NW) {
  const nr = geo.attributes.normal, R = NW + 1, rows = nr.count / R, s = V(0, 0, 0);
  const avg = ids => { s.set(0, 0, 0); ids.forEach(j => { s.x += nr.getX(j); s.y += nr.getY(j); s.z += nr.getZ(j); }); s.normalize(); ids.forEach(j => nr.setXYZ(j, s.x, s.y, s.z)); };
  avg(Array.from({ length: R }, (_, j) => j)); avg(Array.from({ length: R }, (_, j) => (rows - 1) * R + j));
  for (let r = 1; r < rows - 1; r++) avg([r * R, r * R + NW]);
}
function _coralTick(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const pink = _c31(EL.color).convertSRGBToLinear(), rnd = _ccRnd(o.seed || 17);
  const body = G(); b.add(body);
  // THE BODY: a sphere broken into rocky plates (the nearest of o.plates points on it), cartoony (the owner: "the texture on the crab is just a little too it's a little
  // creepy. It's too realistic. So make it more cartoony"; it was thirty-four small faceted plates with a fine grain): a dozen or so big, smooth, rounded plates, like a
  // toy's armour, spread evenly (a Fibonacci sphere, a little jostled), clean soft grooves between them, smooth shading, no grain. Its glow (the owner: "The print on the
  // back is low quality, make it a gradient that radiates from the crystal"): one smooth gradient of BLOOM's pink, worked out for each pixel, brightest where each crystal
  // breaks out of the rock and fading into the dark stone around it (glowPts: where, and how far it reaches); it pulses
  const cells = Array.from({ length: o.plates }, (_, i) => { const y = 1 - 2 * (i + 0.5) / o.plates, r = Math.sqrt(1 - y * y), a = i * 2.39996 + 0.6 * (rnd() - 0.5);
    return V(r * Math.cos(a), y + 0.15 * (rnd() - 0.5), r * Math.sin(a)).normalize(); });
  const rockAt = n => { let d1 = -2, d2 = -2;   // (the rock's height along the direction n: each plate a rounded pillow, sinking into the groove at its edge)
    for (const c of cells) { const d = n.dot(c); if (d > d1) { d2 = d1; d1 = d; } else if (d > d2) d2 = d; }
    const gap = d1 - d2; return 1 + o.plateH * _ccS(0, o.plateW, gap) - o.groove * (1 - _ccS(0, o.grooveW, gap)); };
  const place = (n, k, P) => { const y = n.y * k;   // (the point on the body at the direction n, k times out: its belly flatter, wider toward the back, as a tick's)
    return P.set(n.x * k * o.w * (1 + o.flare * Math.max(0, -n.z)), (y < 0 ? y * 0.55 : y) * o.h, n.z * k * o.l); };
  const bg = new T.SphereGeometry(1, 128, 96), bp = bg.attributes.position, n = V(0, 0, 0), P = V(0, 0, 0);
  for (let i = 0; i < bp.count; i++) { n.set(bp.getX(i), bp.getY(i), bp.getZ(i)).normalize(); place(n, rockAt(n), P); bp.setXYZ(i, P.x, P.y, P.z); }
  bg.computeVertexNormals(); _ccSmoothSeams(bg, 128);
  const rockM = new T.MeshPhysicalMaterial({ color: o.rock, emissive: pink, metalness: 0, roughness: o.rockRough, reflectivity: 0.15 }); rockM.envMapIntensity = 0.15;   // (smooth, soft-sheened stone)
  const glowPts = []; let seamU = null;
  rockM.onBeforeCompile = sh => { const N = Math.max(1, glowPts.length); sh.uniforms.seamK = seamU = seamU || { value: 1 }; sh.uniforms.gemP = { value: glowPts.length ? glowPts : [new T.Vector4(0, -9, 0, 0.001)] };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vObj;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvObj = position;');
    sh.fragmentShader = `uniform float seamK;\nuniform vec4 gemP[${N}];\nvarying vec3 vObj;\n` + sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;',
      `float gg = 0.0; for (int i = 0; i < ${N}; i++) { vec3 d = vObj - gemP[i].xyz; gg += exp(-dot(d, d) / (gemP[i].w * gemP[i].w)); }\n  vec3 totalEmissiveRadiance = emissive * ${o.gradK.toFixed(3)} * min(gg, 1.0) * seamK;`); };
  rockM.customProgramCacheKey = () => 'ccRockGlow' + glowPts.length;
  body.add(new T.Mesh(bg, rockM));
  // ON ITS BACK: THE CRYSTALS (o.crystals), the biggest where the sketch's little spire stood; each breaks out of the rock where it stands, its foot sunk in it, and is
  // coloured facet by facet in BLOOM's pink, as the game's crystals are (_gemCol32, forms32.js); they brighten as it strikes
  const gem = pink.clone().multiplyScalar(o.gemK), gems = [], Pc = V(0, 0, 0), aim = new T.Object3D();
  o.crystals.forEach(([nx, nz, dx, dz, h, r, tip, twist], i) => {
    n.set(nx, Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz)), nz); place(n, rockAt(n), Pc); glowPts.push(new T.Vector4(Pc.x, Pc.y, Pc.z, o.gradR * r / 0.05));   // (where it breaks out: its glow spreads from there)
    const ax = V(dx, 1, dz).normalize(), bot = o.bot * r, geo = _ccCrystal(h, r, tip, o.jag, twist, (o.seed || 17) * 31 + i, bot);
    aim.position.copy(Pc).addScaledVector(ax, bot * (1 - o.sink)); _aim32(aim, ax, V(0, 0, 1)); aim.updateMatrix(); geo.applyMatrix4(aim.matrix);   // (its lower point partly in the rock: the whole crystal shows)
    const m = _gemCol32(geo, gem); body.add(m); gems.push(m);
  });
  // FLOWERS (o.flowers; the owner: "we may add flowers to the 3d texture", then "the flower pattern is too regular, and they're not, I don't like them glowing like
  // that"): small open blossoms in a few loose clumps among the crystals, no two alike: five or six petals, each a little longer or shorter, wider or narrower, turned
  // a little off even and cupped more or less; each flower its own size and shade of pink, its petals round, tipped a little off the rock's face. Matte: nothing on them glows.
  if (o.flowers) {
    const fr = _ccRnd((o.seed || 17) + 53), pg = new T.SphereGeometry(1, 14, 10);
    const heartM = new T.MeshStandardMaterial({ color: _lin31(0x7a1e45), metalness: 0, roughness: 0.88 }); heartM.envMapIntensity = 0.2;
    o.flowers.forEach(([nx, nz, sz]) => { n.set(nx, Math.sqrt(Math.max(0, 1 - nx * nx - nz * nz)), nz); place(n, rockAt(n), Pc);
      const petalM = new T.MeshStandardMaterial({ color: _lin31(0xdf6f9f).lerp(_lin31(0xc44c83), fr()), metalness: 0, roughness: 0.88 }); petalM.envMapIntensity = 0.2;
      const face = V(n.x / o.w, n.y / o.h, n.z / o.l).normalize().add(V(fr() - 0.5, 0, fr() - 0.5).multiplyScalar(0.6)).normalize();   // (out from the rock, tipped a little)
      const fl = G(); fl.position.copy(Pc); _aim32(fl, face, V(0, 0, 1)); body.add(fl);
      const np = fr() < 0.5 ? 5 : 6, a0 = fr() * TAU;
      for (let k = 0; k < np; k++) { const pv = G(); pv.rotation.y = a0 + (k + 0.35 * (fr() - 0.5)) * TAU / np; fl.add(pv);
        const pl = sz * (0.75 + 0.3 * fr()), pw = sz * (0.46 + 0.16 * fr()), pt = new T.Mesh(pg, petalM); pt.scale.set(pw, sz * 0.16, pl); pt.position.set(0, sz * 0.2, pl * 0.85); pt.rotation.x = -(0.15 + 0.45 * fr()); pv.add(pt); }
      const ht = new T.Mesh(pg, heartM); ht.scale.set(sz * 0.34, sz * 0.26, sz * 0.34); ht.position.y = sz * 0.26; fl.add(ht); });
  }
  // THE HEAD: small, at the front, smooth and simple (the owner: "its head is really weirdly shaped right now. It needs to have less definition"; it had a faceted
  // head, two curved black horns for mouthparts, two palps and a crystal mouth-spike): one rounded head of the same stone, smooth. On it (the owner: "make it to where
  // he has a crystal on his head that points upward on top of his head, and make two smaller fangs that point downward"; its mouthparts were two blunt lobes): a
  // crystal standing straight up from the top of its head, and under its face two smaller fangs pointing down, which open as it rears and clamp as it bites. The fangs
  // are of the head's smooth stone, as its mouthparts were (the owner, on crystal fangs: "No, not crystal fangs. Keep them the same texture as you had earlier"):
  // round, tapering to a point, curving back a little
  // Then (the owner: "too sharp and make the head more angular"): the head cut angular, a six-sided block narrowing to its flat face, flat on top, its faces flat-shaded
  // (it was a smooth ball); the fangs blunt, six-sided, tapering to a flat tip (they were sharp round points)
  const headM = new T.MeshPhysicalMaterial({ color: o.rock, flatShading: true, metalness: 0, roughness: o.rockRough, reflectivity: 0.15 }); headM.envMapIntensity = 0.15;   // (the body's stone, cut in facets)
  const head = G(); head.position.set(0, -o.h * 0.1, o.l * 1.05 - o.headR * o.headCut[0] / 2); body.add(head);   // (its neck, where it joins the body: it droops from there (the owner: "Head droops downward", "It needs to droop downward more"))
  const hd = G(); hd.position.z = o.headR * o.headCut[0] / 2; head.add(hd);   // (the head itself, out from under the body's front, so its crystal stands clear)
  const [hl, hb, hf, hy] = o.headCut, hg = new T.CylinderGeometry(o.headR * hf, o.headR * hb, o.headR * hl, 6, 1, false, PI / 6);   // (narrower at its face; a flat top and bottom)
  const hm = new T.Mesh(hg, headM); hm.rotation.x = PI / 2; hm.scale.set(1, 1, hy); hd.add(hm);   // (its axis forward, flattened)
  const topY = o.headR * (hb + hf) / 2 * Math.cos(PI / 6) * hy;   // (its flat top, at its middle)
  const [gh, gr, gt] = o.headGem, gb = o.bot * gr, hc = _gemCol32(_ccCrystal(gh, gr, gt, o.jag, 0.6, 77, gb), gem); hc.position.set(0, topY + gb * (1 - o.sink), o.headR * 0.05); hc.rotation.x = -0.5 * o.droop; hd.add(hc); gems.push(hc);   // (its foot sunk in the head)
  const [fl, fr2, ft2] = o.fang, fangGeo = new T.CylinderGeometry(fr2 * ft2, fr2, fl, 6); fangGeo.translate(0, fl / 2, 0);   // (its root at the origin, its blunt tip up: turned over below)
  const jaws = [-1, 1].map(s => { const pv = G(); pv.position.set(s * o.headR * 0.32, -topY * 0.8, o.headR * hl * 0.36); hd.add(pv);   // (each fang's root, under its face)
    const f = new T.Mesh(fangGeo, headM); f.rotation.x = PI - 0.12; pv.add(f); return { s, pv }; });   // (pointing down, a touch forward)
  // THE LEGS (the owner: "the legs more like the original image, pointed steak like legs that have a shorter segment that connects to the body at 90degree"): a pair for
  // each of o.legs, each a short, straight segment out of the body's side, square to it, and at its knee the sketch's leaf-spear: a long pointed stake hanging almost
  // straight down to its point on the floor, its top end rising a little above the knee
  const legs = []; [-1, 1].forEach(s => o.legs.forEach((ld, k) => legs.push({ s, ld, ph: (k % 2 ? PI : 0) + (s > 0 ? PI : 0), up: _taper32(b, _ccBlack, 6, 10), lo: _taper32(b, _ccBlack, 20, 10),
    knee: (() => { const m = new T.Mesh(new T.SphereGeometry(1, 14, 10), _ccBlack); b.add(m); return m; })(), pu: Array.from({ length: 6 }, () => V(0, 0, 0)), pl: Array.from({ length: 20 }, () => V(0, 0, 0)) })));
  legs.forEach(L => { const z = L.ld.z, wz = o.w * (1 + o.flare * Math.max(0, -z / o.l)), hx = wz * Math.sqrt(Math.max(0, 1 - (z / o.l) ** 2));   // (the body's side at that z)
    L.hip = V(L.s * hx * 0.97, 0, z); L.out = V(L.s * hx / (wz * wz), 0, z / (o.l * o.l)).normalize(); });   // (its root just inside the rock; straight out, square to the body)
  const A = V(0, 0, 0), K = V(0, 0, 0), F = V(0, 0, 0), Tp = V(0, 0, 0), dir = V(0, 0, 0), dn = V(0, 0, 0), UP = V(0, 1, 0);
  const Lt = new T.PointLight(0xffffff, 0.5, 1, 2); Lt.color.copy(_c31(EL.color)); Lt.position.set(0, o.h + 0.12, 0); body.add(Lt); LIGHTS.push(Lt);
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, pr = _prog31(t, act), rear = _ccS(0, 0.3, pr) * (1 - _ccS(0.34, 0.5, pr)), strike = _ccS(0.34, 0.5, pr) * (1 - _ccS(0.62, 1, pr)), calm = 1 - 0.7 * Math.min(1, act || 0);
    const bob = 0.007 * Math.sin(2 * ph) * calm;
    body.position.set(0, o.bodyY + bob + 0.02 * rear, 0.04 * strike); body.rotation.x = -0.1 * rear + 0.14 * strike;   // (it rears, then lunges and bites)
    const glow = (0.85 + 0.15 * Math.sin(2 * ph)) * (1 + 0.8 * Math.max(0.5 * rear, strike));
    if (seamU) seamU.value = glow; Lt.intensity = 0.5 * glow;
    const gk = 1.2 * Math.max(0, glow - 0.85); gems.forEach(m => m.userData.relight(gk));   // (the crystals brighten with the glow)
    head.rotation.x = o.droop + 0.1 * Math.sin(ph) * calm - 0.25 * rear + 0.3 * strike;   // (it hangs its head; it lifts it as it rears and drives it down as it bites)
    jaws.forEach(J => { J.pv.rotation.z = J.s * ((0.12 + 0.05 * Math.sin(ph * 2)) * calm + 0.45 * rear - 0.3 * strike); });   // (the fangs splay open, then clamp together)
    legs.forEach(L => { const ld = L.ld, lift = Math.max(0, Math.sin(2 * ph + L.ph)) * o.lift * calm, swing = Math.cos(2 * ph + L.ph) * o.stride * calm;
      dir.copy(L.out).applyAxisAngle(UP, -L.s * swing / (o.seg + ld.out));   // (it steps: the leg swings forward and back at its root)
      A.set(L.hip.x, o.bodyY + bob + o.hipY + 0.02 * rear, L.hip.z + 0.04 * strike);   // (its root moves with the body)
      K.copy(A).addScaledVector(dir, o.seg); K.y += 0.7 * lift;
      F.copy(K).addScaledVector(dir, ld.out); F.y = 0.004 + lift;
      dn.copy(F).sub(K).normalize(); Tp.copy(K).addScaledVector(dn, -ld.top);
      L.knee.position.copy(K); L.knee.scale.setScalar(o.legR * 0.8);   // (inside the stake: the segment simply enters it)
      for (let i = 0; i < 6; i++) L.pu[i].lerpVectors(A, K, i / 5);
      L.up.set(L.pu, o.legR * 1.1, o.legR * 0.9);
      for (let i = 0; i < 20; i++) L.pl[i].lerpVectors(Tp, F, i / 19);
      L.lo.set(L.pl, 0, 0, u => ld.leaf * Math.pow(Math.sin(PI * Math.pow(u, 0.62)), 0.8) + 0.0015, 1.25, 0.5);   // (the leaf-spear: pointed at its top, widest a third of the way down, to a long point on the floor)
    });
  } };
}
const _ccT = {
  S: 1, coreY: 0.32, seed: 17, bodyY: 0.27, w: 0.2, h: 0.14, l: 0.25, flare: 0.28, rock: 0x0b090a, rockRough: 0.72,
  plates: 14, plateH: 0.06, plateW: 0.14, groove: 0.035, grooveW: 0.06,   // (the cartoony plates: how many, how far each swells, how soon it rounds over; the grooves' depth and width)
  crystals: [   // (each: where it breaks out (its direction's x and z on the body), its lean (x, z), its height to the shoulders, its half-width, its point, its turn about its axis)
    [-0.1, 0.06, -0.15, 0.3, 0.15, 0.06, 0.05, 0.35],   // (the biggest, where the sketch's little spire stood, leaning forward as it did)
    [0.36, 0.2, 0.6, 0.3, 0.1, 0.05, 0.04, 1], [-0.45, 0.22, -0.75, 0.35, 0.085, 0.046, 0.036, 0.2], [0.22, -0.36, 0.45, -0.6, 0.12, 0.054, 0.045, 1.3],
    [-0.32, -0.36, -0.5, -0.65, 0.09, 0.048, 0.038, 0.7], [0.02, -0.68, 0.05, -1, 0.075, 0.044, 0.034, 0.9],
  ],
  jag: 0.8, bot: 0.8, sink: 0.6, gemK: 1,   // (how far off centre the points go; each crystal's lower point (times its half-width) and how much of that point is sunk; how bright their pink)
  headR: 0.055, droop: 0.68, headCut: [1.8, 1.2, 0.78, 0.72], headGem: [0.085, 0.03, 0.035], fang: [0.034, 0.012, 0.5],   // (its head; its cut (length, width at the back and at its face, all times headR; how flat); the crystal on it (height to the shoulders, half-width, point); each fang (length, girth at the root, its tip's share of that))
  gradK: 0.85, gradR: 0.06,   // (the glow on its back: how bright where a crystal breaks out, how far it reaches)
  flowers: null,   // (none: see No. 915)
  seg: 0.08, hipY: 0, legR: 0.022, lift: 0.03, stride: 0.03,   // (the legs' short segment: how long, how high on the body's side; how thick; their step)
  legs: [   // (a pair each, front and back: where along the body (z), how far out the point stands beyond the knee, how far the stake's top rises above the knee, its half-width)
    { z: 0.1, out: 0.04, top: 0.05, leaf: 0.037 }, { z: -0.1, out: 0.045, top: 0.05, leaf: 0.038 },
  ],
};
fx(914, "CORAL TICK, the coral crab redrawn as the owner asked: a tick's plump body, wider at the back, its exterior big, smooth, rounded plates of dark stone, cartoony; jagged, bold crystals of square section breaking out of its back, the biggest where the sketch's little spire stood, a glow of BLOOM pink radiating from each over the rock; a small, angular head of the same stone, a crystal standing straight up on top of it and two smaller, blunt fangs of its stone pointing down that clamp; four legs as in the sketch, each a short segment straight out of its side and a long pointed leaf-spear stake.", () => _coralTick(_ccT));
fx(915, "CORAL TICK with flowers: No. 914 with small open blossoms in a few loose clumps among its crystals, no two alike, five or six round pink petals round a deep rose heart, matte (the owner: \"we may add flowers to the 3d texture\").", () => _coralTick(Object.assign({}, _ccT, {
  flowers: [[0.1, 0.32, 0.024], [0.21, 0.43, 0.015], [0.01, 0.45, 0.013], [-0.18, -0.2, 0.02], [-0.28, -0.11, 0.014], [0.42, -0.5, 0.018], [-0.62, -0.05, 0.016]],   // (each: where (its direction's x and z on the body), its size; in clumps)
})));
