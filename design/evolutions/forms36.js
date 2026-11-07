// ── THE NEW ELECTRIC BRAWLER, FROM THE OWNER'S WHITEBOARD SKETCH · No. 900 (2026-11-07) ──────────────────────────────────
// The owner: "The one character on dry erase is the electric brawler, the new electric brawler; the old electric brawler [the Static Orb] will now be the magnetic one"
// (docs/CONVERSION.md §13). The sketch, side on and facing right: a long low body in an S; a round head with a hooked beak; a great crest swept back from the top of the
// head down the neck; under the body a small fin at the chest, a long pointed blade at the middle and a small fin near the back; the tail drawn out into a fork with a
// zig-zag: a lightning bolt.
// Read here, for the owner's review (docs/ART-PROCESS.md: one piece first): it flies low, swimming through the air as an eel does, its fins hanging (they do not walk);
// near-black and smooth, its eyes, the crest's edge, a line down each flank and the bolt of its tail lit in the element's colour. Idle: it hangs in the air, a wave running
// down its body, its fins swaying, the bolt flickering. Action: it draws back and strikes forward, straightening, the bolt flaring and its flank lines blazing.
// Uses forms31.js (_lin31, _c31, _hot31, _prog31) and forms32.js (_taper32, _aim32). +z is the front; ph = 1.6 t runs once round the idle loop.
const _ebSkin = new T.MeshStandardMaterial({ color: 0x0b0c10, metalness: 0.65, roughness: 0.38 }); _ebSkin.envMapIntensity = 0.5;
const _ebFin = new T.MeshStandardMaterial({ color: 0x08090c, metalness: 0.8, roughness: 0.45, flatShading: true, side: T.DoubleSide }); _ebFin.envMapIntensity = 0.35;
const _ebBeak = new T.MeshStandardMaterial({ color: _lin31(0x2a2d35), metalness: 0.9, roughness: 0.28 }); _ebBeak.envMapIntensity = 0.75;
const _ebSmooth = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
function _eelBrawler(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lit = _c31(EL.color).lerp(_c31(0xffffff), 0.12).convertSRGBToLinear();
  const boltM = _hot31(lit), lineM = _hot31(lit), eyeM = _hot31(lit.clone().lerp(new T.Color(1, 1, 1), 0.35)), edgeM = _hot31(lit);
  const unit = G(); b.add(unit);
  // THE BODY: a tube along its spine from the tail's root (s = 0) to the neck (s = 1), rebuilt every frame as the wave runs down it; its radius by rOf(s)
  const N = 28, curve = new T.CatmullRomCurve3(o.spine.map(([z, y]) => V(0, y, z))), base = [], pts = [];
  for (let i = 0; i < N; i++) { base.push(curve.getPoint(i / (N - 1))); pts.push(V(0, 0, 0)); }
  const rOf = s => o.rTail + (o.rMid - o.rTail) * Math.pow(_ebSmooth(0, o.rGrow, s), 0.7) - (o.rMid - o.rNeck) * _ebSmooth(0.74, 1, s);
  const body = _taper32(unit, _ebSkin, N, 14);
  // a line of light down each flank, on the widest of the body
  const lines = [_taper32(unit, lineM, N, 5), _taper32(unit, lineM, N, 5)], lp = [[], []];
  for (let i = 0; i < N; i++) { lp[0].push(V(0, 0, 0)); lp[1].push(V(0, 0, 0)); }
  // THE HEAD: a round skull at the neck's end, a hooked beak at its front, an eye either side
  const head = G(); unit.add(head);
  const skull = new T.Mesh(new T.SphereGeometry(1, 28, 20), _ebSkin); skull.scale.set(o.hw, o.hh, o.hl); head.add(skull);
  const beak = _taper32(head, _ebBeak, 7, 10);
  beak.set(o.beak.map(([z, y]) => V(0, y, z)), 0, 0, s => o.beakR * Math.pow(1 - s, 0.85) + 0.002, 0.72, 1);
  [-1, 1].forEach(sx => { const e = new T.Mesh(new T.SphereGeometry(1, 14, 10), eyeM); e.scale.set(0.006, o.eyeH, o.eyeL); e.position.set(sx * o.hw * 0.9, o.eyeY, o.eyeZ); e.rotation.set(-0.25, sx * 0.35, sx * 0.18); head.add(e); });
  // THE CREST: a swept blade from the top of the skull back down the neck to a point over the back; its top edge lit
  const crest = G(); unit.add(crest);   // (on the body, at the head's resting place: it stays on the neck when the head rears or thrusts)
  const cr = o.crest, ctop = cr.top.map(([z, y]) => [z, y]), cbot = cr.bottom.map(([z, y]) => [z, y]);
  const cm = plate(ctop.concat(cbot.slice().reverse()), cr.thick, 0.006, _ebFin); cm.rotation.y = -PI / 2; crest.add(cm);
  crest.add(tube(ctop.map(([z, y]) => [0, y + 0.004, z]), 0.0065, edgeM));
  // THE FINS: three pairs hanging from the underside, splayed out: a small one at the chest, a long blade at the middle (its front edge lit), a small one near the back
  const fins = [];
  o.fins.forEach(fd => [-1, 1].forEach(sx => {
    const h = G(); unit.add(h);
    const out = [[fd.W * 0.5, 0], [-fd.W * 0.5, 0], [-fd.W * 0.5 - fd.L * fd.rake, -fd.L], [-fd.W * 0.1 - fd.L * fd.rake * 0.55, -fd.L * 0.55]];
    const m = plate(out, 0.012, 0.003, _ebFin); m.rotation.y = -PI / 2; h.add(m);
    if (fd.lit) h.add(tube([[0, 0, out[0][0]], [0, out[3][1], out[3][0]], [0, out[2][1], out[2][0]]], 0.0045, edgeM));   // (along its front edge: the outline's root front, its bend and its tip)
    fins.push({ h, fd, sx });
  }));
  // THE TAIL: a zig-zag bolt of light out of the tail's end, swinging with it; a light in it
  const boltH = G(); unit.add(boltH);
  const boltP = o.bolt.map(([back, up]) => [-up, back]);   // (local y runs back along the tail, local x down: _aim32 below)
  const boltMesh = plate(boltP, o.boltT, 0.004, boltM); boltH.add(boltMesh);
  const Lt = new T.PointLight(0xffffff, 0.8, 1.4, 2); Lt.color.copy(lit); boltH.add(Lt); Lt.position.set(-0.08, 0.1, 0); LIGHTS.push(Lt);
  const tq = V(0, 0, 0), nr = V(0, 0, 0), up = V(0, 1, 0), side = V(1, 0, 0);
  const spineAt = s => { const f = s * (N - 1), i = Math.min(N - 2, Math.floor(f)), u = f - i; return pts[i].clone().lerp(pts[i + 1], u); };
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act);
    // the action: it draws back (0-0.3), strikes forward straightening (0.3-0.55), and settles (0.55-1)
    const draw = _ebSmooth(0, 0.3, pr) * (1 - _ebSmooth(0.3, 0.45, pr)), strike = _ebSmooth(0.3, 0.48, pr) * (1 - _ebSmooth(0.62, 1, pr)), flare = Math.max(draw * 0.6, strike);
    unit.position.set(0, o.bob * Math.sin(ph * 2) * (1 - a), -o.drawBack * draw + o.lunge * strike);
    unit.rotation.set(-0.12 * draw + 0.06 * strike, 0, 0);
    // the spine: the S at rest, a wave running down it toward the tail (sideways and a little up and down), flattened as it strikes
    const calm = 1 - strike * 0.85;
    for (let i = 0; i < N; i++) {
      const s = i / (N - 1), k = Math.pow(1 - s, 1.3), w = ph - TAU * o.waves * s, p = base[i];
      pts[i].set(o.ampX * k * Math.sin(w) * calm, p.y + o.ampY * k * Math.sin(w + 1.3) * calm - o.dip * draw * Math.sin(PI * s), p.z);
    }
    body.set(pts, 0, 0, rOf, o.fx, 1);
    // the flank lines: on the body's widest, a little above its middle
    for (let i = 0; i < N; i++) {
      tq.copy(pts[Math.min(N - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize(); nr.copy(up).cross(tq).normalize();
      const s = i / (N - 1), r = rOf(s) * o.fx * 0.97;
      lp[0][i].copy(pts[i]).addScaledVector(nr, r).addScaledVector(up, rOf(s) * 0.12); lp[1][i].copy(pts[i]).addScaledVector(nr, -r).addScaledVector(up, rOf(s) * 0.12);
    }
    const lr = s => 0.0042 * Math.pow(Math.sin(PI * Math.min(1, Math.max(0, (s - 0.12) / 0.8))), 0.5);
    lines[0].set(lp[0], 0, 0, lr, 1, 1); lines[1].set(lp[1], 0, 0, lr, 1, 1);
    // the head rides the neck's end, rearing back as it draws and thrusting as it strikes
    const hp = pts[N - 1]; head.position.set(hp.x, hp.y + o.headUp, hp.z + o.headFwd); crest.position.set(hp.x, base[N - 1].y + o.headUp, hp.z + o.headFwd); head.rotation.set(-0.18 * draw + 0.1 * strike + 0.03 * Math.sin(ph + 0.4) * (1 - a), 0.08 * Math.sin(ph - 0.6) * (1 - a), 0);
    // the fins: rooted under the body, splayed out, swaying with the wave; swept back as it strikes
    fins.forEach(({ h, fd, sx }) => { const p = spineAt(fd.s), r = rOf(fd.s);
      h.position.set(p.x + sx * r * o.fx * 0.45, p.y - r * 0.72, p.z);
      h.rotation.set(0.12 * Math.sin(ph - TAU * o.waves * fd.s + (sx > 0 ? 0 : 0.5)) * (1 - a) - 0.45 * strike, 0, sx * fd.splay); });
    // the bolt at the tail's end, along the tail
    const t0 = pts[0], t1 = pts[3], bd = t0.clone().sub(t1).normalize(); bd.lerp(o.boltDir, o.boltLevel).normalize(); boltH.position.copy(t0); _aim32(boltH, bd, side);
    const k = (0.85 + 0.15 * Math.sin(ph * 4)) * (1 + 1.6 * flare); boltM.color.copy(lit).multiplyScalar(k); Lt.intensity = 0.8 * (1 + 1.5 * flare);
    lineM.color.copy(lit).multiplyScalar((0.7 + 0.3 * Math.sin(ph * 2 + 0.8)) * (1 + 1.8 * strike));
    edgeM.color.copy(lit).multiplyScalar(0.9 + 0.6 * flare); eyeM.color.copy(lit).lerp(new T.Color(1, 1, 1), 0.35).multiplyScalar(1 + 0.8 * flare);
  } };
}
// the sketch's proportions: the spine (z, y) from the tail's root to the neck; the head at the neck's end
const _eb0 = {
  S: 1, coreY: 0.48,
  spine: [[-0.5, 0.47], [-0.38, 0.41], [-0.22, 0.37], [-0.03, 0.365], [0.13, 0.41], [0.24, 0.5], [0.3, 0.6]],
  rTail: 0.016, rMid: 0.1, rNeck: 0.072, rGrow: 0.42, fx: 0.8,
  hw: 0.1, hh: 0.112, hl: 0.15, headUp: 0.06, headFwd: 0.07,
  beak: [[0.1, -0.02], [0.15, -0.025], [0.19, -0.04], [0.215, -0.065], [0.222, -0.09], [0.216, -0.108], [0.205, -0.118]], beakR: 0.042,
  eyeY: 0.025, eyeZ: 0.075, eyeH: 0.013, eyeL: 0.028,
  // the crest, in the head's resting frame (z, y): its top edge from the skull's brow back to its point over the back; its bottom edge on the skull and down the neck's top
  crest: { thick: 0.026,
    top: [[0.075, 0.1], [0.02, 0.15], [-0.06, 0.162], [-0.15, 0.105], [-0.25, 0.005], [-0.35, -0.08], [-0.45, -0.152], [-0.56, -0.21]],
    bottom: [[0.07, 0.085], [0.0, 0.098], [-0.07, 0.07], [-0.12, 0.02], [-0.17, -0.05], [-0.25, -0.125], [-0.34, -0.175], [-0.45, -0.2]] },
  fins: [{ s: 0.84, L: 0.13, W: 0.08, rake: 0.4, splay: 0.4 }, { s: 0.58, L: 0.26, W: 0.12, rake: 0.36, splay: 0.24, lit: true }, { s: 0.33, L: 0.11, W: 0.07, rake: 0.45, splay: 0.42 }],
  bolt: [[-0.02, 0.04], [0.12, 0.115], [0.095, 0.13], [0.3, 0.27], [0.145, 0.095], [0.172, 0.08], [0.0, -0.04]], boltT: 0.024, boltDir: V(0, 0.3, -1).normalize(), boltLevel: 0.85,
  waves: 0.9, ampX: 0.05, ampY: 0.016, dip: 0.05, bob: 0.02, drawBack: 0.08, lunge: 0.16,
};
fx(900, "The NEW ELECTRIC BRAWLER, from the owner's whiteboard sketch: a long near-black flyer swimming through the air, a round head with a hooked beak and a great swept crest, three pairs of hanging fins, a line of light down each flank and a lightning bolt for a tail.", () => _eelBrawler(_eb0));
