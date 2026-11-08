// ── THE ELECTRO SKINK, THE NEW ELECTRIC BRAWLER · No. 903 (2026-11-08) ──────────────────────────────────────────────
// The owner's whiteboard sketch (2026-11-07: "The one character on dry erase is the electric brawler, the new electric brawler"); on No. 900 (a flying eel-bird): "Those look
// awful they should look like a mix between a centipede and a salamander"; its name: "Electro Skink"; on No. 901 (a many-legged centipede with spots, claws and antennae):
// "It's only supposed to have two legs, and it only has the long skinny body flattened like a centipede other features are like a salamander", then "4 legs total" and
// "No spots on the back"; on No. 902 (a salamander's face, eyes and jointed legs with toes): "No face or eyes just a rounded off head and and a single arch for the legs"
// (docs/CONVERSION.md §13). So:
//   BODY   long, skinny and flattened, low to the floor, wet black and plain;
//   HEAD   just a rounded-off end: no face, no eyes;
//   LEGS   four, each a single arch out of its side and down to the floor;
//   TAIL   long and tapering, its tip a zig-zag lightning bolt (the sketch's tail), lit.
// Idle: it walks on the spot as a salamander does, the body bending side to side, the diagonal legs stepping together, the bolt pulsing. Action: it rears its front, then
// lunges, the bolt flaring.
// Nos. 900, 901 and 902 were rejected and are gone.
// Uses forms31.js (_c31, _hot31, _prog31) and forms32.js (_taper32, _aim32). +z is the front; ph = 1.6 t runs once round the idle loop.
const _skSkin = new T.MeshStandardMaterial({ color: 0x06070a, metalness: 0.2, roughness: 0.24 }); _skSkin.envMapIntensity = 0.9;   // (wet black skin: it catches the lights)
const _skS = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
function _electroSkink(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1); b.position.z = (o.shiftZ || 0) * (o.S || 1);   // (shifted so its middle, not its neck, stands on the spot)
  const lit = _c31(EL.color).lerp(_c31(0xffffff), 0.08).convertSRGBToLinear(), boltM = _hot31(lit, 1);
  const unit = G(); b.add(unit);
  const curve = new T.CatmullRomCurve3(o.spine.map(([z, y]) => V(0, y, z)));   // the spine at rest, from the neck (s = 0) to the tail's tip (s = 1)
  const rOf = s => s < o.sTrunk ? o.rNeck + (o.rBody - o.rNeck) * _skS(0, o.sTrunk, s) : s < o.sHip ? o.rBody : o.rBody + (o.rTip - o.rBody) * Math.pow(_skS(o.sHip, 1, s), 0.75);
  // THE BODY AND TAIL: one tube, wide and low (flattened), rebuilt every frame as it bends
  const N = 44, pts = Array.from({ length: N }, () => V(0, 0, 0)), body = _taper32(unit, _skSkin, N, 16);
  // THE LEGS: four, each a single arch, rebuilt every frame as it steps
  const NL = 14, legs = [];
  o.legs.forEach((ld, li) => [-1, 1].forEach(sx => legs.push({ ld, li, sx, tb: _taper32(unit, _skSkin, NL, 10), pts: Array.from({ length: NL }, () => V(0, 0, 0)) })));
  const legR = s => o.legR0 + (o.legR1 - o.legR0) * s - (s > 0.9 ? (s - 0.9) * 0.05 : 0);   // (thick at the body, thinner to its rounded foot)
  // THE HEAD: just a rounded-off end
  const head = new T.Mesh(new T.SphereGeometry(1, 30, 18), _skSkin); head.scale.set(o.headW / 2, o.headH / 2, o.headL / 2); unit.add(head);
  // THE TAIL'S TIP: a zig-zag bolt, upright, along the tail; a light in it
  const boltH = G(); unit.add(boltH); boltH.add(plate(o.bolt.map(([back, upv]) => [-upv, back]), o.boltT, 0.003, boltM));
  const Lt = new T.PointLight(0xffffff, 0.6, 1.2, 2); Lt.color.copy(lit); unit.add(Lt); LIGHTS.push(Lt);
  // the spine as it moves: the rest curve, the salamander's side-to-side bend (and a wave down the tail), the front reared by the action
  const P = V(0, 0, 0), Pa = V(0, 0, 0), Pb = V(0, 0, 0), fw = V(0, 0, 0), ax = V(0, 0, 0), ay = V(0, 0, 0), up = V(0, 1, 0), m4 = new T.Matrix4(), d = V(0, 0, 0);
  let ph = 0, rear = 0, strike = 0, calm = 1;
  const spine = (s, out) => {
    curve.getPoint(Math.min(1, Math.max(0, s)), out);
    out.x += (o.bend * Math.sin(PI * (s - o.sMid) / 0.7) * Math.sin(2 * ph) + o.tailWave * s * s * Math.sin(2 * ph - TAU * 0.9 * s)) * calm;
    const front = Math.max(0, 1 - s / o.rearReach); out.y += o.rearH * rear * front * front;
    return out;
  };
  const frameAt = s => {   // the spine at s and its frame: fw forward along the body, ax to its left, ay up
    spine(s, P); spine(s - 0.01, Pa); spine(s + 0.01, Pb); fw.copy(Pa).sub(Pb).normalize();
    ax.copy(up).cross(fw).normalize(); ay.copy(fw).cross(ax).normalize(); return P;
  };
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    ph = 1.6 * t; const a = act || 0, pr = _prog31(t, act);
    rear = _skS(0, 0.3, pr) * (1 - _skS(0.34, 0.5, pr)); strike = _skS(0.34, 0.5, pr) * (1 - _skS(0.62, 1, pr)); calm = 1 - 0.75 * Math.max(rear, strike);
    unit.position.set(0, 0, o.lunge * strike);
    for (let i = 0; i < N; i++) spine(i / (N - 1), pts[i]);
    body.set(pts, 0, 0, rOf, 1, o.flat);
    // the legs: each an arch from the side of the body, up and out, down to a foot on the floor; the diagonal pairs step together
    legs.forEach(L => { const ld = L.ld; frameAt(ld.s); const r = rOf(ld.s), side = V(ax.x, 0, ax.z).normalize().multiplyScalar(L.sx), ahead = V(fw.x, 0, fw.z).normalize();
      const hip = P.clone().addScaledVector(ax, L.sx * r * 0.8);
      const phi = 2 * ph + (L.li === 0 ? 0 : PI) + (L.sx > 0 ? PI : 0), stance = Math.sin(phi) > 0;
      const lift = (stance ? 0 : o.lift * -Math.sin(phi)) * (1 - a * 0.7) + (L.li === 0 ? o.rearLift * rear : 0);
      const foot = V(hip.x, 0, hip.z).addScaledVector(side, o.reach).addScaledVector(ahead, ld.fwd + o.stride * Math.cos(phi) * (1 - a * 0.7)); foot.y = o.legR1 + lift;
      const ctrl = hip.clone().lerp(foot, 0.42); ctrl.y = Math.max(hip.y, foot.y) + 2 * o.arch;   // (a quadratic arch: its top halfway to the control point)
      for (let j = 0; j < NL; j++) { const u = j / (NL - 1), w0 = (1 - u) * (1 - u), w1 = 2 * (1 - u) * u, w2 = u * u;
        L.pts[j].set(hip.x * w0 + ctrl.x * w1 + foot.x * w2, hip.y * w0 + ctrl.y * w1 + foot.y * w2, hip.z * w0 + ctrl.z * w1 + foot.z * w2); }
      L.tb.set(L.pts, 0, 0, legR, 1, 1); });
    // the head: a rounded end ahead of the neck, rearing back, then lunging
    frameAt(0); head.position.copy(P).addScaledVector(fw, o.headFwd).addScaledVector(ay, o.headUp);
    m4.makeBasis(ax, ay, fw); head.quaternion.setFromRotationMatrix(m4); head.rotateX(-o.headTilt - 0.5 * rear + 0.25 * strike); head.rotateY(-0.12 * Math.sin(2 * ph) * calm);
    // the bolt at the tail's tip, along the tail, rising
    spine(1, P); spine(0.97, Pa); d.copy(P).sub(Pa).normalize(); d.y += o.boltRise; d.normalize(); boltH.position.copy(P); _aim32(boltH, d, V(d.z, 0, -d.x).normalize());
    const k = (0.85 + 0.15 * Math.sin(ph * 4)) * (1 + 1.5 * Math.max(0.5 * rear, strike)); boltM.color.copy(lit).multiplyScalar(k); Lt.position.copy(P).add(V(0, 0.12, 0)); Lt.intensity = 0.6 * k;
  } };
}
const _sk0 = {
  S: 0.85, coreY: 0.09, shiftZ: 0.2,
  spine: [[0.36, 0.112], [0.25, 0.086], [0.1, 0.072], [-0.08, 0.07], [-0.24, 0.07], [-0.42, 0.066], [-0.6, 0.072], [-0.78, 0.098]],
  rNeck: 0.05, rBody: 0.065, rTip: 0.01, sTrunk: 0.12, sHip: 0.47, flat: 0.6,
  legs: [{ s: 0.115, fwd: 0.04 }, { s: 0.47, fwd: -0.03 }], legR0: 0.025, legR1: 0.015, reach: 0.13, arch: 0.045,
  stride: 0.035, lift: 0.028, rearLift: 0.05,
  headW: 0.15, headH: 0.078, headL: 0.17, headFwd: 0.055, headUp: 0.004, headTilt: 0.1,
  bolt: [[-0.02, 0.04], [0.11, 0.1], [0.08, 0.12], [0.27, 0.24], [0.135, 0.08], [0.16, 0.067], [0.0, -0.034]], boltT: 0.02, boltRise: 0.9,
  bend: 0.045, sMid: 0.3, tailWave: 0.06, rearH: 0.12, rearReach: 0.42, lunge: 0.11,
};
fx(903, "The ELECTRO SKINK, the new electric brawler (the owner's whiteboard sketch: a long, skinny, flat body, a rounded-off head with no face, four legs each a single arch): wet black and plain, a long tail ending in a lit lightning bolt.", () => _electroSkink(_sk0));
