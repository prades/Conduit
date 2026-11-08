// ── THE ELECTRO SKINK, THE NEW ELECTRIC BRAWLER · No. 902 (2026-11-08) ──────────────────────────────────────────────
// The owner's whiteboard sketch (2026-11-07: "The one character on dry erase is the electric brawler, the new electric brawler"); on No. 900 (a flying eel-bird): "Those look
// awful they should look like a mix between a centipede and a salamander"; its name: "Electro Skink"; on No. 901 (a many-legged centipede with spots, claws and antennae):
// "It's only supposed to have two legs, and it only has the long skinny body flattened like a centipede other features are like a salamander", then "4 legs total"
// (docs/CONVERSION.md §13). So:
//   BODY   a centipede's only in its shape: long, skinny and flattened, low to the floor; its skin a salamander's, wet black, plain (the owner on the blotches of the
//          first version of this one: "No spots on the back");
//   HEAD   a salamander's: broad, flat and round-snouted, its eyes bulging on top, the parotoid glands behind them swollen and lit; its jaw drops when it strikes;
//   LEGS   four, a salamander's: sprawled out to the side, elbows and knees up, splayed toes on the floor;
//   TAIL   a salamander's, long and tapering, its tip a zig-zag lightning bolt (the sketch's tail).
// Idle: it walks on the spot as a salamander does, the body bending side to side, the diagonal legs stepping together, its glands and its bolt pulsing. Action: it rears
// its front, then lunges, jaw open, its glands blazing and the bolt flaring.
// No. 900 (the flying eel-bird) and No. 901 (the centipede) were rejected and are gone.
// Uses forms29.js (_limb), forms31.js (_lin31, _c31, _hot31, _prog31) and forms32.js (_taper32, _aim32). +z is the front; ph = 1.6 t runs once round the idle loop.
const _skSkin = new T.MeshStandardMaterial({ color: 0x06070a, metalness: 0.2, roughness: 0.24 }); _skSkin.envMapIntensity = 0.9;   // (wet black skin: it catches the lights)
const _skDark = new T.MeshStandardMaterial({ color: 0x030304, metalness: 0.1, roughness: 0.6 }); _skDark.envMapIntensity = 0.2;   // (inside the mouth)
const _skS = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const _skHash = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };   // (a fixed scatter for the blotches)
function _electroSkink(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1); b.position.z = (o.shiftZ || 0) * (o.S || 1);   // (shifted so its middle, not its neck, stands on the spot)
  const lit = _c31(EL.color).lerp(_c31(0xffffff), 0.08).convertSRGBToLinear(), hot = k => _hot31(lit, k);
  const eyeM = hot(1.3), boltM = hot(1), glandM = hot(1), mouthM = hot(0.6);
  const unit = G(); b.add(unit);
  const curve = new T.CatmullRomCurve3(o.spine.map(([z, y]) => V(0, y, z)));   // the spine at rest, from the neck (s = 0) to the tail's tip (s = 1)
  const rOf = s => s < o.sTrunk ? o.rNeck + (o.rBody - o.rNeck) * _skS(0, o.sTrunk, s) : s < o.sHip ? o.rBody : o.rBody + (o.rTip - o.rBody) * Math.pow(_skS(o.sHip, 1, s), 0.75);
  // THE BODY AND TAIL: one tube, wide and low (flattened), rebuilt every frame as it bends
  const N = 44, pts = Array.from({ length: N }, () => V(0, 0, 0)), body = _taper32(unit, _skSkin, N, 16);
  // THE LEGS: four, each an upper limb out to the side, a lower limb down to the floor, a little palm and four splayed toes
  const legs = [];
  o.legs.forEach((ld, li) => [-1, 1].forEach(sx => {
    const toes = [0, 1, 2, 3].map(() => _limb(unit, o.toeR, _skSkin, 6)), palm = new T.Mesh(new T.SphereGeometry(1, 12, 8), _skSkin); unit.add(palm);
    const spot = new T.Mesh(new T.SphereGeometry(1, 10, 6), hot(1)); unit.add(spot);
    legs.push({ ld, li, sx, up: _limb(unit, o.upR, _skSkin, 10), lo: _limb(unit, o.loR, _skSkin, 10), toes, palm, spot });
  }));
  // THE HEAD: broad, flat, round-snouted; bulging lit eyes on top, the swollen glands behind them lit; a lower jaw hinged at the back
  const head = G(); unit.add(head);
  const skull = new T.Mesh(new T.SphereGeometry(1, 30, 18, 0, TAU, 0, PI * 0.56), _skSkin); skull.scale.set(o.headW / 2, o.headH * 0.62, o.headL / 2); skull.position.y = -o.headH * 0.05; head.add(skull);
  const snout = new T.Mesh(new T.SphereGeometry(1, 24, 14, 0, TAU, 0, PI * 0.56), _skSkin); snout.scale.set(o.headW * 0.4, o.headH * 0.5, o.headL * 0.3); snout.position.set(0, -o.headH * 0.05, o.headL * 0.28); head.add(snout);
  const jaw = G(); jaw.position.set(0, -o.headH * 0.05, -o.headL * 0.36); head.add(jaw);   // (the hinge, at the back of the head)
  const jawM = new T.Mesh(new T.SphereGeometry(1, 26, 12, 0, TAU, PI * 0.5, PI * 0.5), _skSkin); jawM.scale.set(o.headW * 0.47, o.headH * 0.38, o.headL * 0.5); jawM.position.z = o.headL * 0.38; jaw.add(jawM);
  const mouth = new T.Mesh(new T.CircleGeometry(1, 20), mouthM); mouth.scale.set(o.headW * 0.4, o.headL * 0.42, 1); mouth.rotation.x = -PI / 2; mouth.position.set(0, -o.headH * 0.06, o.headL * 0.06); head.add(mouth);   // (lit inside: seen when the jaw drops)
  [-1, 1].forEach(sx => {
    const bulge = new T.Mesh(new T.SphereGeometry(o.eyeR * 1.3, 14, 10), _skSkin); bulge.position.set(sx * o.eyeX, o.eyeY, o.eyeZ); head.add(bulge);
    const eye = new T.Mesh(new T.SphereGeometry(o.eyeR, 14, 10), eyeM); eye.position.set(sx * (o.eyeX + o.eyeR * 0.45), o.eyeY + o.eyeR * 0.25, o.eyeZ + o.eyeR * 0.2); head.add(eye);
    const gland = new T.Mesh(new T.SphereGeometry(1, 14, 10), glandM); gland.scale.set(o.headW * 0.11, o.headH * 0.2, o.headL * 0.2); gland.position.set(sx * o.headW * 0.3, o.headH * 0.3, -o.headL * 0.22); head.add(gland);
  });
  // THE TAIL'S TIP: a zig-zag bolt, upright, along the tail; a light in it
  const boltH = G(); unit.add(boltH); boltH.add(plate(o.bolt.map(([back, upv]) => [-upv, back]), o.boltT, 0.003, boltM));
  const Lt = new T.PointLight(0xffffff, 0.6, 1.2, 2); Lt.color.copy(lit); unit.add(Lt); LIGHTS.push(Lt);
  // the spine as it moves: the rest curve, the salamander's side-to-side bend (and a wave down the tail), the front reared or dipped by the action
  const P = V(0, 0, 0), Pa = V(0, 0, 0), Pb = V(0, 0, 0), fw = V(0, 0, 0), ax = V(0, 0, 0), ay = V(0, 0, 0), up = V(0, 1, 0), m4 = new T.Matrix4(), d = V(0, 0, 0);
  let ph = 0, rear = 0, strike = 0, calm = 1;
  const spine = (s, out) => {
    curve.getPoint(Math.min(1, Math.max(0, s)), out);
    out.x += (o.bend * Math.sin(PI * (s - o.sMid) / 0.7) * Math.sin(2 * ph) + o.tailWave * s * s * Math.sin(2 * ph - TAU * 0.9 * s)) * calm;
    const front = Math.max(0, 1 - s / o.rearReach); out.y += o.rearH * rear * front * front;
    return out;
  };
  const frameAt = (s, obj) => {   // place obj on the spine at s, its +z forward along the body, its +y as near up as it can be
    spine(s, P); spine(s - 0.01, Pa); spine(s + 0.01, Pb); fw.copy(Pa).sub(Pb).normalize();
    ax.copy(up).cross(fw).normalize(); ay.copy(fw).cross(ax).normalize();
    if (obj) { m4.makeBasis(ax, ay, fw); obj.position.copy(P); obj.quaternion.setFromRotationMatrix(m4); }
    return P;
  };
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    ph = 1.6 * t; const a = act || 0, pr = _prog31(t, act);
    rear = _skS(0, 0.3, pr) * (1 - _skS(0.34, 0.5, pr)); strike = _skS(0.34, 0.5, pr) * (1 - _skS(0.62, 1, pr)); calm = 1 - 0.75 * Math.max(rear, strike);
    unit.position.set(0, 0, o.lunge * strike);
    for (let i = 0; i < N; i++) spine(i / (N - 1), pts[i]);
    body.set(pts, 0, 0, rOf, 1, o.flat);
    // the legs: shoulder or hip at the side of the body; the upper limb out sideways, the elbow or knee up, the lower limb down to a foot on the floor; the diagonal pairs step together
    legs.forEach(L => { const ld = L.ld; frameAt(ld.s); const r = rOf(ld.s), side = V(ax.x, 0, ax.z).normalize().multiplyScalar(L.sx), ahead = V(fw.x, 0, fw.z).normalize();
      const hip = P.clone().addScaledVector(ax, L.sx * r * 0.82).addScaledVector(ay, -o.flat * r * 0.2);
      const phi = 2 * ph + (L.li === 0 ? 0 : PI) + (L.sx > 0 ? PI : 0), stance = Math.sin(phi) > 0;
      const lift = (stance ? 0 : o.lift * -Math.sin(phi)) * (1 - a * 0.7) + (L.li === 0 ? o.rearLift * rear : 0);
      const foot = V(hip.x, 0, hip.z).addScaledVector(side, o.reach).addScaledVector(ahead, ld.fwd + o.stride * Math.cos(phi) * (1 - a * 0.7)); foot.y = o.palmH + lift;
      const elbow = hip.clone().addScaledVector(side, o.upper).addScaledVector(ahead, ld.fwd * 0.4); elbow.y = hip.y + o.elbowUp + lift * 0.5;
      L.up.set(hip, elbow); L.lo.set(elbow, foot);
      L.palm.position.copy(foot); L.palm.position.y = o.palmH * 0.6 + lift; L.palm.scale.set(o.palmR, o.palmR * 0.45, o.palmR * 1.1);
      L.toes.forEach((tl, j) => { const ang = (j - 1.5) * 0.42 + (L.li === 0 ? 0.25 : -0.35) * L.sx, td = ahead.clone().applyAxisAngle(up, ang * L.sx + (L.li === 0 ? 0 : PI * 0.15 * L.sx));
        const from = L.palm.position.clone(), to = from.clone().addScaledVector(td, o.toeL); to.y = Math.max(0.004, from.y - 0.008); tl.set(from, to); });
      L.spot.position.copy(hip).lerp(elbow, 0.55); L.spot.position.y += o.upR * 0.8; L.spot.scale.set(o.upR * 0.9, o.upR * 0.35, o.upR * 1.4); });
    // the head ahead of the neck, rearing back, then lunging with its jaw dropped
    frameAt(0); head.position.copy(P).addScaledVector(fw, o.headFwd).addScaledVector(ay, o.headUp);
    m4.makeBasis(ax, ay, fw); head.quaternion.setFromRotationMatrix(m4); head.rotateX(-o.headTilt - 0.5 * rear + 0.25 * strike); head.rotateY(-0.12 * Math.sin(2 * ph) * calm);
    jaw.rotation.x = 0.06 + 0.45 * strike + 0.12 * rear; mouthM.color.copy(lit).multiplyScalar(0.25 + 1.1 * Math.max(strike, 0.4 * rear));
    eyeM.color.copy(lit).multiplyScalar(1.3 * (1 + 0.6 * strike)); glandM.color.copy(lit).multiplyScalar((0.85 + 0.15 * Math.sin(ph * 2)) * (1 + 1.5 * Math.max(rear, strike)));
    // the bolt at the tail's tip, along the tail, rising
    spine(1, P); spine(0.97, Pa); d.copy(P).sub(Pa).normalize(); d.y += o.boltRise; d.normalize(); boltH.position.copy(P); _aim32(boltH, d, V(d.z, 0, -d.x).normalize());
    const k = (0.85 + 0.15 * Math.sin(ph * 4)) * (1 + 1.5 * Math.max(0.5 * rear, strike)); boltM.color.copy(lit).multiplyScalar(k); Lt.position.copy(P).add(V(0, 0.12, 0)); Lt.intensity = 0.6 * k;
  } };
}
const _sk0 = {
  S: 0.85, coreY: 0.09, shiftZ: 0.2,
  spine: [[0.36, 0.112], [0.25, 0.086], [0.1, 0.072], [-0.08, 0.07], [-0.24, 0.07], [-0.42, 0.066], [-0.6, 0.072], [-0.78, 0.098]],
  rNeck: 0.05, rBody: 0.065, rTip: 0.01, sTrunk: 0.12, sHip: 0.47, flat: 0.6,
  legs: [{ s: 0.115, fwd: 0.045 }, { s: 0.47, fwd: -0.035 }], upR: 0.018, loR: 0.016, reach: 0.135, upper: 0.07, elbowUp: 0.012, palmH: 0.012, palmR: 0.018, toeR: 0.006, toeL: 0.032,
  stride: 0.035, lift: 0.028, rearLift: 0.05,
  headW: 0.19, headH: 0.08, headL: 0.19, headFwd: 0.08, headUp: 0.01, headTilt: 0.14, eyeR: 0.02, eyeX: 0.058, eyeY: 0.03, eyeZ: 0.038,
  bolt: [[-0.02, 0.04], [0.11, 0.1], [0.08, 0.12], [0.27, 0.24], [0.135, 0.08], [0.16, 0.067], [0.0, -0.034]], boltT: 0.02, boltRise: 0.9,
  bend: 0.045, sMid: 0.3, tailWave: 0.06, rearH: 0.12, rearReach: 0.42, lunge: 0.11,
};
fx(902, "The ELECTRO SKINK, the new electric brawler (the owner's whiteboard sketch: the body long, skinny and flat as a centipede's, everything else a salamander's, four legs): wet black skin with lit yellow blotches, a broad flat head with bulging eyes and lit glands, four sprawled legs with splayed toes, a long tail ending in a lightning bolt.", () => _electroSkink(_sk0));
