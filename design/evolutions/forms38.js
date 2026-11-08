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
// glowing BLOOM's pink (the living coral under the rock); on its back the sketch's little coral spire and two nubs; a small head at the front, its mouthparts clamping
// (its crushing bite); its legs the sketch's long pointed leaf-spears, four (the owner, interrupting the first render: "4 legs"; it had eight, as a tick has).
function _coralTick(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const pink = _c31(EL.color).convertSRGBToLinear(), rnd = _ccRnd(o.seed || 17);
  const body = G(); b.add(body);
  // THE BODY: a sphere broken into rocky plates (the nearest of o.plates points on it), each domed, the seams between sunk and glowing pink
  const cells = Array.from({ length: o.plates }, () => { const u = rnd() * 2 - 1, a = rnd() * TAU, r = Math.sqrt(1 - u * u); return V(r * Math.cos(a), u, r * Math.sin(a)); });
  const bg = new T.SphereGeometry(1, 60, 40), bp = bg.attributes.position, col = new Float32Array(bp.count * 3), n = V(0, 0, 0);
  for (let i = 0; i < bp.count; i++) {
    n.set(bp.getX(i), bp.getY(i), bp.getZ(i)).normalize(); let d1 = -2, d2 = -2;
    for (const c of cells) { const d = n.dot(c); if (d > d1) { d2 = d1; d1 = d; } else if (d > d2) d2 = d; }
    const gap = d1 - d2, plate = Math.min(1, gap / 0.14), crack = 1 - _ccS(0, 0.03, gap);
    const grain = 0.012 * Math.sin(n.x * 37.1 + n.y * 17.3) * Math.sin(n.y * 29.7 + n.z * 11.1) * Math.sin(n.z * 23.3 + n.x * 13.7);
    const k = 1 + o.plateH * Math.sqrt(plate) - 0.02 * crack + grain;
    let x = n.x * k, y = n.y * k, z = n.z * k; if (y < 0) y *= 0.55;   // (its belly flatter)
    x *= o.w * (1 + o.flare * Math.max(0, -n.z)); y *= o.h; z *= o.l;   // (wider toward the back, as a tick's)
    bp.setXYZ(i, x, y, z); const glow = crack * 0.95; col[i * 3] = pink.r * glow; col[i * 3 + 1] = pink.g * glow; col[i * 3 + 2] = pink.b * glow;
  }
  bg.setAttribute('color', new T.BufferAttribute(col, 3)); bg.computeVertexNormals();
  const rockM = new T.MeshPhysicalMaterial({ color: o.rock, vertexColors: true, emissive: 0xffffff, flatShading: true, metalness: 0, roughness: 0.92, reflectivity: 0.08 }); rockM.envMapIntensity = 0.08;   // (dull charcoal stone, barely any shine: its facets show by their shading, its seams glow)
  let seamU = null;   // (the seams' glow: it pulses)
  rockM.onBeforeCompile = sh => { sh.uniforms.seamK = seamU = seamU || { value: 1 }; sh.fragmentShader = 'uniform float seamK;\n' + sh.fragmentShader.replace('#include <color_fragment>', '').replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor * seamK;'); };
  rockM.customProgramCacheKey = () => 'ccRock';
  body.add(new T.Mesh(bg, rockM));
  // ON ITS BACK: the sketch's little coral spire and two nubs, glowing, porous
  const coralM = new T.MeshStandardMaterial({ color: 0x1a0610, emissive: 0xffffff, emissiveMap: _ccCoralTex(), emissiveIntensity: 0.85, metalness: 0, roughness: 0.68 }); coralM.envMapIntensity = 0.15;
  const sp = new T.Mesh(_ccHorn(o.spireL, o.spireR, 0.3), coralM); sp.position.set(o.spire[0], o.h * o.spire[1], o.spire[2]); _aim32(sp, V(-0.15, 1, 0.35), V(0, 0, -1)); body.add(sp);
  o.nubs.forEach(([x, y, z, r]) => { const m = new T.Mesh(new T.SphereGeometry(r, 16, 12), coralM); m.position.set(x, o.h * y, z); m.scale.y = 1.25; body.add(m); });
  // THE HEAD: small, at the front; a barbed mouth-spike between two clamping mouthparts and two short palps
  const head = G(); head.position.set(0, -o.h * 0.15, o.l * 0.96); body.add(head);
  const hm = new T.Mesh(new T.SphereGeometry(1, 20, 14), rockM); hm.scale.set(o.headR * 1.1, o.headR * 0.8, o.headR); head.add(hm);
  const spike = new T.Mesh(_ccHorn(o.headR * 1.5, o.headR * 0.32, -0.25), coralM); spike.position.set(0, -o.headR * 0.2, o.headR * 0.6); spike.rotation.x = PI / 2 + 0.35; head.add(spike);
  const jaws = [-1, 1].map(s => { const pv = G(); pv.position.set(s * o.headR * 0.55, 0, o.headR * 0.7); head.add(pv);
    const j = new T.Mesh(_ccHorn(o.headR * 1.3, o.headR * 0.3, 0.45), _ccBlack); j.rotation.set(PI / 2, 0, -s * 0.5); pv.add(j); return { s, pv }; });
  [-1, 1].forEach(s => { const pa = new T.Mesh(new T.CylinderGeometry(o.headR * 0.18, o.headR * 0.24, o.headR * 1.1, 8), rockM); pa.position.set(s * o.headR * 0.95, -o.headR * 0.1, o.headR * 0.55); pa.rotation.set(PI / 2 - 0.3, 0, s * 0.3); head.add(pa); });
  // THE LEGS: eight, from the front half of the body: the back four the sketch's leaf-spears, the front four thinner and jointed
  const legs = []; [-1, 1].forEach(s => o.legs.forEach((ld, k) => legs.push({ s, k, ld, ph: (k % 2 ? PI : 0) + (s > 0 ? PI : 0), up: _taper32(b, _ccBlack, 12, 8), lo: _taper32(b, _ccBlack, 18, 10),
    knee: (() => { const m = new T.Mesh(new T.SphereGeometry(1, 12, 8), _ccBlack); b.add(m); return m; })(), pu: Array.from({ length: 12 }, () => V(0, 0, 0)), pl: Array.from({ length: 18 }, () => V(0, 0, 0)) })));
  const A = V(0, 0, 0), K = V(0, 0, 0), F = V(0, 0, 0);
  const Lt = new T.PointLight(0xffffff, 0.5, 1, 2); Lt.color.copy(_c31(EL.color)); Lt.position.set(0, o.h + 0.12, 0); body.add(Lt); LIGHTS.push(Lt);
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, pr = _prog31(t, act), rear = _ccS(0, 0.3, pr) * (1 - _ccS(0.34, 0.5, pr)), strike = _ccS(0.34, 0.5, pr) * (1 - _ccS(0.62, 1, pr)), calm = 1 - 0.7 * Math.min(1, act || 0);
    const bob = 0.007 * Math.sin(2 * ph) * calm;
    body.position.set(0, o.bodyY + bob + 0.02 * rear, 0.04 * strike); body.rotation.x = -0.1 * rear + 0.14 * strike;   // (it rears, then lunges and bites)
    const glow = (0.85 + 0.15 * Math.sin(2 * ph)) * (1 + 0.8 * Math.max(0.5 * rear, strike));
    if (seamU) seamU.value = glow; coralM.emissiveIntensity = 0.85 * glow; Lt.intensity = 0.5 * glow;
    head.rotation.x = 0.1 * Math.sin(ph) * calm - 0.25 * rear + 0.3 * strike;
    jaws.forEach(J => { J.pv.rotation.y = J.s * ((0.18 + 0.06 * Math.sin(ph * 2)) * calm + 0.45 * rear - 0.25 * strike); });   // (open, then clamp)
    legs.forEach(L => { const ld = L.ld, lift = Math.max(0, Math.sin(2 * ph + L.ph)) * o.lift * calm, swing = Math.cos(2 * ph + L.ph) * o.stride * calm, big = ld.leaf > 0;
      A.set(L.s * o.hipX, o.bodyY + bob - o.h * 0.35, ld.z);
      K.set(L.s * (o.hipX + ld.out * 0.5), o.bodyY + bob + ld.up + 0.6 * lift, ld.z + ld.dz * 0.45 + swing * 0.3);
      F.set(L.s * (o.hipX + ld.out), 0.004 + lift, ld.z + ld.dz + swing);
      L.knee.position.copy(K); L.knee.scale.setScalar(big ? o.legR * 1.4 : o.legR * 1.1);
      for (let i = 0; i < 12; i++) { const u = i / 11; L.pu[i].lerpVectors(A, K, u); L.pu[i].y += 0.02 * Math.sin(PI * u); }
      L.up.set(L.pu, 0, 0, u => ((big ? o.legR * 1.15 : o.legR) - 0.006 * u) * (1 + 0.14 * Math.pow(0.5 + 0.5 * Math.cos(u * 3 * TAU), 3)), 1, 1);
      for (let i = 0; i < 18; i++) { const u = i / 17; L.pl[i].lerpVectors(K, F, u); L.pl[i].x += L.s * (big ? 0.03 : 0.015) * Math.sin(PI * u); }
      if (big) L.lo.set(L.pl, 0, 0, u => ld.leaf * Math.pow(Math.sin(PI * Math.min(1, 0.1 + 0.9 * u)), 0.75) + 0.002, 1.25, 0.5);   // (the sketch's leaf-spear: widest at its middle, to a point)
      else L.lo.set(L.pl, 0, 0, u => o.legR * 0.8 * (1 - u) * (1 + 0.12 * Math.pow(0.5 + 0.5 * Math.cos(u * 2 * TAU), 3)) + 0.002, 1, 1);
    });
  } };
}
const _ccT = {
  S: 1, coreY: 0.32, seed: 17, bodyY: 0.27, w: 0.2, h: 0.14, l: 0.25, flare: 0.28, plates: 34, plateH: 0.07, rock: 0x0b090a,
  spire: [-0.03, 0.85, 0.02], spireL: 0.15, spireR: 0.028, nubs: [[0.07, 0.8, -0.06, 0.028], [-0.08, 0.75, -0.1, 0.024]],
  headR: 0.055,
  hipX: 0.1, legR: 0.02, lift: 0.032, stride: 0.03,
  legs: [   // (a pair each, front to back: where along it (z), how far out, how high the knee, how far forward or back the foot goes, the leaf-spear's width (0: a thin jointed leg))
    { z: 0.06, out: 0.3, up: 0.15, dz: 0.14, leaf: 0.044 }, { z: -0.06, out: 0.3, up: 0.16, dz: -0.17, leaf: 0.046 },
  ],
};
fx(914, "CORAL TICK, the coral crab redrawn as the owner asked: a tick's plump body, wider at the back, its exterior rocky plates of dark stone, the seams between them glowing BLOOM pink; the sketch's little coral spire and two nubs on its back; a small head with clamping mouthparts; eight legs, the back four the sketch's long pointed leaf-spears, the front four thinner and jointed.", () => _coralTick(_ccT));
