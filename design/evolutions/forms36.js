// ── THE ELECTRO SKINK, THE NEW ELECTRIC BRAWLER · No. 901 (2026-11-08) ──────────────────────────────────────────────
// The owner's whiteboard sketch (2026-11-07: "The one character on dry erase is the electric brawler, the new electric brawler"), then, on No. 900 (a flying eel-bird):
// "Those look awful they should look like a mix between a centipede and a salamander"; its name: "Electro Skink" (docs/CONVERSION.md §13). The sketch's S-shaped body with
// its head raised at the front, the two long lines swept back from the head and the zig-zag fork at the tail are kept, read now as:
//   BODY   a salamander's long low body, wet black with yellow spots (a fire salamander's blotches, lit), built of overlapping armour segments like a centipede's;
//   LEGS   a centipede's: a pair on each segment, short, jointed and splayed, stepping in a wave down the body while it wriggles (the salamander's walk);
//   HEAD   a salamander's broad flat head with bulging lit eyes; a centipede's venom claws hooked under its front (the sketch's hook); two long antennae swept back
//          over its back (the sketch's two lines), sparking at their tips;
//   TAIL   a centipede's two trailing legs at its end, each a zig-zag lightning bolt (the sketch's fork).
// Idle: it walks on the spot, wriggling, its spots pulsing. Action: it rears its front, then strikes forward and down, claws wide then snapping shut, a charge running up
// its spots from the tail to the head and the bolts flaring.
// No. 900, the first reading (a flying eel-bird with a beak and a sail of a crest), was rejected ("Those look awful") and is gone.
// Uses forms29.js (_limb), forms31.js (_lin31, _c31, _hot31, _prog31) and forms32.js (_taper32, _aim32). +z is the front; ph = 1.6 t runs once round the idle loop.
const _skSkin = new T.MeshStandardMaterial({ color: 0x06070a, metalness: 0.2, roughness: 0.26 }); _skSkin.envMapIntensity = 0.85;   // (wet black skin: it catches the lights)
const _skPlate = new T.MeshStandardMaterial({ color: 0x0b0d12, metalness: 0.4, roughness: 0.3 }); _skPlate.envMapIntensity = 0.8;
const _skLeg = new T.MeshStandardMaterial({ color: 0x050608, metalness: 0.45, roughness: 0.4 }); _skLeg.envMapIntensity = 0.3;
const _skClaw = new T.MeshStandardMaterial({ color: _lin31(0x2c3038), metalness: 0.85, roughness: 0.22 }); _skClaw.envMapIntensity = 0.9;
const _skS = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const _skHash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // (a fixed scatter for the spots)
function _electroSkink(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const lit = _c31(EL.color).lerp(_c31(0xffffff), 0.1).convertSRGBToLinear(), hot = k => _hot31(lit, k);
  const eyeM = hot(1.3), tipM = hot(1.2), boltM = hot(1), clawTipM = hot(1);
  const unit = G(); b.add(unit);
  const curve = new T.CatmullRomCurve3(o.spine.map(([z, y]) => V(0, y, z)));   // the spine at rest, from the head (s = 0) to the tail's end (s = 1)
  // THE BODY: its segments from the neck to the tail, each a domed armour plate over a soft belly, one or two lit spots on each
  const segs = o.segs.map((sd, i) => {
    const grp = G(); unit.add(grp);
    const plateM = new T.Mesh(new T.SphereGeometry(1, 22, 12), _skPlate); plateM.scale.set(sd.w / 2, sd.h / 2, sd.L * 0.62); plateM.position.y = sd.h * 0.1; grp.add(plateM);
    const belly = new T.Mesh(new T.SphereGeometry(1, 16, 10), _skSkin); belly.scale.set(sd.w * 0.47, sd.h * 0.42, sd.L * 0.6); belly.position.y = -sd.h * 0.12; grp.add(belly);
    const spots = [], n = i === 0 ? 0 : i % 3 === 1 ? 1 : 2;
    for (let k = 0; k < n; k++) {
      const m = new T.Mesh(new T.SphereGeometry(1, 12, 8), hot(1)), sideK = n === 1 ? 0 : (k ? 1 : -1);
      const ox = sideK * sd.w * (0.15 + 0.1 * _skHash(i * 7 + k)), oz = sd.L * (_skHash(i * 13 + k) - 0.5) * 0.55, r = sd.w * (0.085 + 0.045 * _skHash(i * 5 + k));
      m.scale.set(r, r * 0.4, r * (1.1 + 0.6 * _skHash(i * 3 + k)));
      const u = Math.max(0, 1 - (ox / (sd.w / 2)) ** 2 - (oz / (sd.L * 0.62)) ** 2);
      m.position.set(ox, sd.h * 0.1 + sd.h / 2 * Math.sqrt(u) - r * 0.1, oz); grp.add(m); spots.push(m);
    }
    return { grp, sd, spots };
  });
  // THE LEGS: a pair on each segment from o.legFrom to o.legTo, two bones each (hip -> knee -> foot) and a claw at the foot, posed in the unit's frame every frame
  const legs = [];
  segs.forEach((Sg, i) => { if (i < o.legFrom || i > o.legTo) return; [-1, 1].forEach(sx => {
    const toe = new T.Mesh(new T.ConeGeometry(o.legR * 0.9, o.toeL, 6), _skClaw); unit.add(toe);
    legs.push({ Sg, k: i - o.legFrom, sx, a: _limb(unit, o.legR, _skLeg, 7), c: _limb(unit, o.legR * 0.8, _skLeg, 7), toe });
  }); });
  // THE HEAD: broad and flat, its eyes bulging on top and lit; the venom claws hooked under its front; the antennae swept back over its back
  const head = G(); unit.add(head);
  const skull = new T.Mesh(new T.SphereGeometry(1, 28, 16), _skSkin); skull.scale.set(o.headW / 2, o.headH / 2, o.headL / 2); head.add(skull);
  const brow = new T.Mesh(new T.SphereGeometry(1, 22, 12), _skPlate); brow.scale.set(o.headW * 0.4, o.headH * 0.32, o.headL * 0.36); brow.position.set(0, o.headH * 0.2, -o.headL * 0.08); head.add(brow);
  [-1, 1].forEach(sx => {
    const bulge = new T.Mesh(new T.SphereGeometry(o.eyeR * 1.35, 14, 10), _skSkin); bulge.position.set(sx * o.eyeX, o.eyeY, o.eyeZ); head.add(bulge);
    const eye = new T.Mesh(new T.SphereGeometry(o.eyeR, 14, 10), eyeM); eye.position.set(sx * (o.eyeX + o.eyeR * 0.4), o.eyeY + o.eyeR * 0.3, o.eyeZ + o.eyeR * 0.25); head.add(eye);
  });
  const claws = [-1, 1].map(sx => {
    const c = G(); c.position.set(sx * o.clawX, o.clawY, o.clawZ); head.add(c);
    const pts = o.claw.map(([x, y, z]) => V(sx * x, y, z)), tb = _taper32(c, _skClaw, pts.length, 8); tb.set(pts, 0, 0, s => o.clawR * (1 - 0.82 * s), 1, 0.75);
    const tip = new T.Mesh(new T.SphereGeometry(o.clawR * 0.42, 8, 6), clawTipM); tip.position.copy(pts[pts.length - 1]); c.add(tip);
    return { c, sx };
  });
  const NA = 14, ants = [-1, 1].map(sx => ({ sx, tb: _taper32(head, _skLeg, NA, 6), tip: (() => { const m = new T.Mesh(new T.SphereGeometry(o.antR * 1.9, 8, 6), tipM); head.add(m); return m; })(), pts: Array.from({ length: NA }, () => V(0, 0, 0)) }));
  // THE TAIL: two trailing legs at its end, each a zig-zag bolt, splayed; a light between them
  const boltOut = o.bolt.map(([back, up]) => [-up, back]);   // (local y runs back along the tail, local x down: _aim32 below)
  const bolts = [-1, 1].map(sx => { const h = G(); unit.add(h); h.add(plate(boltOut, o.boltT, 0.003, boltM)); return { h, sx }; });
  const Lt = new T.PointLight(0xffffff, 0.7, 1.3, 2); Lt.color.copy(lit); unit.add(Lt); LIGHTS.push(Lt);
  // the spine as it moves: the rest curve, the wriggle (sideways, growing toward the tail), the front reared or dipped by the action
  const P = V(0, 0, 0), Pa = V(0, 0, 0), Pb = V(0, 0, 0), fw = V(0, 0, 0), ax = V(0, 0, 0), ay = V(0, 0, 0), up = V(0, 1, 0), m4 = new T.Matrix4(), dir = V(0, 0, 0), tmp = V(0, 0, 0);
  let ph = 0, rear = 0, strike = 0, calm = 1;
  const spine = (s, out) => {
    curve.getPoint(Math.min(1, Math.max(0, s)), out);
    out.x += o.wiggle * (0.3 + 0.7 * s) * Math.sin(ph - TAU * o.waves * s) * calm;
    const front = Math.max(0, 1 - s / o.rearReach); out.y += o.rearH * rear * front * front - o.dipH * strike * front * front;
    return out;
  };
  const frameAt = (s, obj) => {   // place obj on the spine at s, its +z forward along the body, its +y as near up as it can be
    spine(s, P); spine(s - 0.012, Pa); spine(s + 0.012, Pb); fw.copy(Pa).sub(Pb).normalize();
    ax.copy(up).cross(fw).normalize(); ay.copy(fw).cross(ax).normalize(); m4.makeBasis(ax, ay, fw);
    if (obj) { obj.position.copy(P); obj.quaternion.setFromRotationMatrix(m4); }
    return P;
  };
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    ph = 1.6 * t; const a = act || 0, pr = _prog31(t, act);
    rear = _skS(0, 0.3, pr) * (1 - _skS(0.34, 0.5, pr)); strike = _skS(0.34, 0.5, pr) * (1 - _skS(0.62, 1, pr)); calm = 1 - 0.7 * Math.max(rear, strike);
    unit.position.set(0, o.bob * Math.sin(ph * 4) * (1 - a), o.lunge * strike);
    // the segments, and the charge running up their spots during the strike (tail to head)
    const ch = (pr - 0.18) / 0.42;
    segs.forEach((Sg, i) => { frameAt(Sg.sd.s, Sg.grp);
      Sg.spots.forEach((m, k) => { const wave = pr > 0 ? Math.max(0, 1 - Math.abs(ch - (1 - Sg.sd.s)) / 0.2) : 0;
        m.material.color.copy(lit).multiplyScalar((0.82 + 0.18 * Math.sin(ph * 2 + i * 0.9 + k)) * (1 + 2.2 * wave)); }); });
    // the legs: hip under the plate's edge, the foot on the floor stepping in a wave down the body (left and right in turn), the knee out and up; the front pairs lift as it rears
    legs.forEach(L => { const sd = L.Sg.sd; frameAt(sd.s);
      const hip = tmp.copy(P).addScaledVector(ax, L.sx * sd.w * 0.4).addScaledVector(ay, -sd.h * 0.12).clone();
      const phi = 2 * ph - L.k * o.legLag + (L.sx > 0 ? PI : 0), stance = Math.sin(phi) > 0;
      const reach = o.legSpread + sd.w * 0.08, fwdK = o.stride * Math.cos(phi) * (1 - a * 0.6), lift = (stance ? 0 : o.lift * -Math.sin(phi)) * (1 - a * 0.6) + o.rearLift * rear * Math.max(0, 1 - sd.s / o.rearReach);
      const foot = V(hip.x, 0, hip.z).addScaledVector(V(ax.x, 0, ax.z).normalize(), L.sx * reach).addScaledVector(V(fw.x, 0, fw.z).normalize(), fwdK + o.footFwd); foot.y = Math.max(0, lift) + o.toeL * 0.45;
      const knee = hip.clone().lerp(foot, 0.42).addScaledVector(V(ax.x, 0, ax.z).normalize(), L.sx * o.kneeOut); knee.y = Math.max(hip.y, foot.y) + o.kneeUp;
      L.a.set(hip, knee); L.c.set(knee, foot);
      dir.copy(foot).sub(knee).normalize(); L.toe.position.copy(foot).addScaledVector(dir, o.toeL * 0.25); L.toe.quaternion.setFromUnitVectors(up, dir); });
    // the head on the front of the spine, rearing back and then striking down
    frameAt(0, head); head.rotateX(-0.55 * rear + 0.4 * strike + 0.04 * Math.sin(ph * 2 + 0.5) * (1 - a)); head.rotateY(0.07 * Math.sin(ph + 0.3) * (1 - a));
    claws.forEach(({ c, sx }) => { c.rotation.set(0, sx * (0.55 * rear - 0.3 * strike + 0.06 * Math.sin(ph * 2) * (1 - a)), 0); });
    ants.forEach(A => { const cv = new T.CatmullRomCurve3(o.ant.map(([x, y, z], j) => { const w = j / (o.ant.length - 1); return V(A.sx * (x + 0.025 * w * Math.sin(ph * 2 + A.sx)), y + 0.02 * w * Math.sin(ph * 2 + 1 + A.sx) + 0.05 * w * rear, z - 0.04 * w * strike); }));
      for (let j = 0; j < NA; j++) cv.getPoint(j / (NA - 1), A.pts[j]);
      A.tb.set(A.pts, 0, 0, s => o.antR * (1 - 0.55 * s), 1, 1); A.tip.position.copy(A.pts[NA - 1]); });
    // the bolts out of the tail's end, splayed and rising
    spine(1, P); spine(0.96, Pa); dir.copy(P).sub(Pa).normalize();
    bolts.forEach(({ h, sx }) => { const d = dir.clone().applyAxisAngle(up, sx * o.boltSplay); d.y += o.boltRise; d.normalize(); h.position.copy(P); _aim32(h, d, V(1, 0, 0).applyAxisAngle(up, sx * o.boltSplay)); });
    const k = (0.85 + 0.15 * Math.sin(ph * 4)) * (1 + 1.5 * Math.max(0.5 * rear, strike)); boltM.color.copy(lit).multiplyScalar(k); Lt.position.copy(P).add(V(0, 0.1, 0)); Lt.intensity = 0.7 * k;
    tipM.color.copy(lit).multiplyScalar(1.2 * (1 + 1.2 * rear)); clawTipM.color.copy(lit).multiplyScalar(1 + 1.5 * strike);
  } };
}
const _sk0 = {
  S: 1, coreY: 0.17,
  spine: [[0.5, 0.3], [0.4, 0.24], [0.28, 0.17], [0.12, 0.115], [-0.08, 0.1], [-0.28, 0.1], [-0.46, 0.11], [-0.6, 0.13]],
  segs: [0.13, 0.15, 0.165, 0.175, 0.18, 0.18, 0.175, 0.165, 0.15, 0.125, 0.09].map((w, i) => ({ s: 0.08 + i * 0.086, w, h: w * 0.58, L: 0.135 })),
  legFrom: 1, legTo: 8, legR: 0.014, toeL: 0.03, legSpread: 0.15, kneeOut: 0.035, kneeUp: 0.05, footFwd: 0.01, stride: 0.035, lift: 0.03, legLag: 0.75, rearLift: 0.06,
  headW: 0.26, headH: 0.11, headL: 0.23, eyeR: 0.027, eyeX: 0.08, eyeY: 0.046, eyeZ: 0.04,
  clawX: 0.06, clawY: -0.033, clawZ: 0.08, clawR: 0.019,
  claw: [[0, 0, 0], [0.022, -0.01, 0.045], [0.029, -0.016, 0.09], [0.016, -0.018, 0.125], [-0.009, -0.015, 0.142], [-0.027, -0.009, 0.14]],
  ant: [[0.04, 0.045, 0.07], [0.06, 0.13, 0.06], [0.08, 0.2, -0.02], [0.097, 0.225, -0.16], [0.11, 0.21, -0.33], [0.12, 0.175, -0.49], [0.125, 0.14, -0.63]], antR: 0.008,
  bolt: [[-0.01, 0.025], [0.09, 0.07], [0.07, 0.085], [0.21, 0.17], [0.11, 0.055], [0.13, 0.045], [0.0, -0.025]], boltT: 0.018, boltSplay: 0.32, boltRise: 0.35,
  wiggle: 0.035, waves: 0.85, bob: 0.006, rearH: 0.16, rearReach: 0.45, dipH: 0.04, lunge: 0.12,
};
fx(901, "The ELECTRO SKINK, the new electric brawler (the owner's whiteboard sketch, 'a mix between a centipede and a salamander'): a long, low, wet-black body of armour segments with lit yellow spots on a pair of jointed legs each, a broad flat head with bulging lit eyes, venom claws and long antennae swept back, two zig-zag bolts for tail legs.", () => _electroSkink(_sk0));
