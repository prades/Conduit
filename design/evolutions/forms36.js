// ── THE ELECTRO SKINK, THE NEW ELECTRIC BRAWLER · No. 904 (2026-11-08) ──────────────────────────────────────────────
// The owner's whiteboard sketch (2026-11-07: "The one character on dry erase is the electric brawler, the new electric brawler"); on No. 900 (a flying eel-bird): "Those look
// awful they should look like a mix between a centipede and a salamander"; its name: "Electro Skink"; on No. 901 (a many-legged centipede with spots, claws and antennae):
// "It's only supposed to have two legs, and it only has the long skinny body flattened like a centipede other features are like a salamander", then "4 legs total" and
// "No spots on the back"; on No. 902 (a salamander's face, eyes and jointed legs with toes): "No face or eyes just a rounded off head and and a single arch for the legs";
// on No. 903 (a flat bolt stuck on the tail's end): "The tail should gradually change colors at the end and have that electric lightning bolt definition. It shouldn't look
// like a number one fan hand sign" (docs/CONVERSION.md §13). So:
//   BODY   long, skinny and flattened, low to the floor, wet black and plain;
//   HEAD   small and rounded, no face, no eyes; on a pinched neck, taller than the flat body and lifted a little, so it reads as a head (the owner on build
//          2026-11-08b: "He's supposed to have a small head, but it looks like he doesn't have a head at all"); a rounded triangle seen from above, wide at the back
//          and narrowing to a rounded snout, its top domed, a pill from the side (on build c: "Needs a more triangle head, but still overall round. Still want it
//          pill-shaped");
//   LEGS   four, each a single arch out of its side and down to the floor;
//   TAIL   long and tapering; toward its end it fades from the black of the body into a glowing electric yellow, and its last stretch IS the lightning bolt: the tail
//          itself zig-zags in sharp jogs to a point, upright, its tip the brightest.
// Idle (its walk, fast): it slithers like an eel, a quick S-wave running down its body to the tail, its legs paddling in time with the wave (the owner: "it's really fast",
// then "maybe he moves like a fish, like a slippery eel, but also legs"); the bolt pulsing. Action: it rears its front, then lunges, the bolt flaring.
// Nos. 900 to 903 were rejected and are gone.
// Uses forms31.js (_c31, _prog31) and forms32.js (_taper32). +z is the front; ph = 1.6 t runs once round the idle loop.
const _skSkin = new T.MeshStandardMaterial({ color: 0x020203, metalness: 0.2, roughness: 0.34 }); _skSkin.envMapIntensity = 0.32;   // (black skin with a little wet sheen: darker since the owner's "make him darker", 2026-11-08; it was 0x06070a, roughness 0.24, env 0.9, which read slate grey)
const _skS = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
// a tube along pts (as forms32.js's _taper32) whose cross-section (fxf, fyf: sideways and upright) and colour (cf, into vertex colours) change along it, rebuilt every frame
function _skTube(parent, mat, n, ring) {
  const pos = new Float32Array(n * ring * 3), col = new Float32Array(n * ring * 3), idx = [];
  for (let i = 0; i < n - 1; i++) for (let j = 0; j < ring; j++) { const a = i * ring + j, b = i * ring + (j + 1) % ring, c = (i + 1) * ring + j, d = (i + 1) * ring + (j + 1) % ring; idx.push(a, b, c, b, d, c); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setIndex(idx);
  const m = new T.Mesh(geo, mat); parent.add(m);
  const t = V(0, 0, 0), nr = V(0, 0, 0), bi = V(0, 0, 0), up = V(0, 1, 0), ax = V(1, 0, 0), c3 = new T.Color();
  return { m, set(pts, rf, fxf, fyf, cf) {
    for (let i = 0; i < n; i++) {
      t.copy(pts[Math.min(n - 1, i + 1)]).sub(pts[Math.max(0, i - 1)]).normalize(); nr.copy(Math.abs(t.y) > 0.9 ? ax : up).cross(t).normalize(); bi.copy(t).cross(nr).normalize();
      const s = i / (n - 1), r = rf(s), fx = fxf(s), fy = fyf(s), p = pts[i]; cf(s, c3);
      for (let j = 0; j < ring; j++) { const a = j / ring * TAU, cc = Math.cos(a) * r * fx, ss = Math.sin(a) * r * fy, k = (i * ring + j) * 3;
        pos[k] = p.x + nr.x * cc + bi.x * ss; pos[k + 1] = p.y + nr.y * cc + bi.y * ss; pos[k + 2] = p.z + nr.z * cc + bi.z * ss; col[k] = c3.r; col[k + 1] = c3.g; col[k + 2] = c3.b; }
    }
    geo.attributes.position.needsUpdate = true; geo.attributes.color.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
  } };
}
// THE HEAD's shape (the owner, 2026-11-08: "Needs a more triangle head, but still overall round. Still want it pill-shaped"): seen from above a rounded triangle, wide
// at the back and narrowing to a rounded snout (its outline the hull of three circles: two at the back corners, a smaller one at the snout); its top domed and its sides
// round (every level a smaller copy of that outline, the rise a rounded oval: headP 2 is an ellipse, more is fuller); from the side a pill, lower toward the snout
// (headTaper). Its length runs along +z, the snout at +z, its middle at the origin. (A hull of three balls was tried first: its top was flat between them.)
function _skHeadGeo(o) {
  const rb = o.headRb, rf = o.headRf, bx = o.headW / 2 - rb, zb = -o.headL / 2 + rb, zf = o.headL / 2 - rf;
  const C = [[bx, zb, rb], [-bx, zb, rb], [0, zf, rf]], OL = [];   // (x, z, radius)
  for (let k = 0; k < 720; k++) { const a = k / 720 * TAU, sx = Math.sin(a), cz = Math.cos(a); let c = C[0], best = -Infinity;   // (the outline, walked round by the way it faces)
    for (const q of C) { const h = q[0] * sx + q[1] * cz + q[2]; if (h > best) { best = h; c = q; } }
    OL.push([c[0] + c[2] * sx, c[1] + c[2] * cz]); }
  const R = th => { const dx = Math.sin(th), dz = Math.cos(th); let best = Infinity;   // (how far the outline is from the middle toward th: 0 the snout, PI / 2 its left)
    for (let k = 0; k < OL.length; k++) { const A = OL[k], B = OL[(k + 1) % OL.length], ex = B[0] - A[0], ez = B[1] - A[1], den = dx * ez - dz * ex;
      if (Math.abs(den) < 1e-12) continue; const t = (A[0] * ez - A[1] * ex) / den, u = (A[0] * dz - A[1] * dx) / den;
      if (t > 0 && u >= -1e-9 && u <= 1 + 1e-9 && t < best) best = t; }
    return best; };
  const NA = 96, NB = 36, e = 2 / (o.headP || 2), hh = o.headH / 2, tz = Z => 1 - (o.headTaper || 0) * Z / o.headL;   // (round the outline × top to bottom; the taper)
  const Rs = Array.from({ length: NA }, (_, i) => R(i / NA * TAU)), pos = [0, hh, 0], idx = [];
  for (let j = 1; j < NB; j++) { const be = j / NB * PI, sb = Math.sin(be), cb = Math.cos(be), rho = Math.pow(sb, e), yy = Math.sign(cb) * Math.pow(Math.abs(cb), e);
    for (let i = 0; i < NA; i++) { const th = i / NA * TAU, X = Rs[i] * rho * Math.sin(th), Z = Rs[i] * rho * Math.cos(th); pos.push(X, hh * yy * tz(Z), Z); } }
  pos.push(0, -hh, 0); const bot = pos.length / 3 - 1, at = (j, i) => 1 + (j - 1) * NA + (i % NA);   // (one point at each pole, the rings closed round: no seam)
  for (let i = 0; i < NA; i++) idx.push(0, at(1, i), at(1, i + 1));
  for (let j = 1; j < NB - 1; j++) for (let i = 0; i < NA; i++) { const a = at(j, i + 1), b = at(j, i), c = at(j + 1, i), d = at(j + 1, i + 1); idx.push(a, b, d, b, c, d); }
  for (let i = 0; i < NA; i++) idx.push(at(NB - 1, i + 1), at(NB - 1, i), bot);
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); geo.computeBoundingSphere();
  return geo;
}
function _electroSkink(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1); b.position.z = (o.shiftZ || 0) * (o.S || 1);   // (shifted so its middle, not its neck, stands on the spot)
  const lit = _c31(EL.color).lerp(_c31(0xffffff), 0.08).convertSRGBToLinear(), dark = _skSkin.color.clone(), white = new T.Color(1, 1, 1);
  const unit = G(); b.add(unit);
  const curve = new T.CatmullRomCurve3(o.spine.map(([z, y]) => V(0, y, z)));   // the spine at rest, from the neck (s = 0) to the tail's tip (s = 1)
  const rOf = s => s < o.sTrunk ? o.rNeck + (o.rBody - o.rNeck) * _skS(0, o.sTrunk, s) : s < o.sHip ? o.rBody : o.rBody + (o.rTip - o.rBody) * Math.pow(_skS(o.sHip, 1, s), 0.75);
  // THE BODY: a tube, wide and low (flattened), to the middle of the tail, rebuilt every frame as it bends
  const N = 32, pts = Array.from({ length: N }, () => V(0, 0, 0)), body = _taper32(unit, _skSkin, N, 16);
  // THE TAIL'S END: a tube of its own from there to the tip, its colour fading from the body's black to a glowing yellow, turning from flat to upright, its last stretch
  // a zig-zag bolt (sharp jogs up and back down, rising to a point)
  // (the same wet skin as the body, so the join does not show, but its colour and its glow both follow the vertex colour: black where it leaves the body, glowing yellow at its end)
  const tailM = new T.MeshStandardMaterial({ color: _skSkin.color, vertexColors: true, metalness: 0.2, roughness: 0.34, emissive: 0xffffff, toneMapped: false }); tailM.envMapIntensity = 0.32;   // (not tone mapped: the yellow stays saturated)
  tailM.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '').replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;'); };   // (the vertex colour is its glow only: the skin stays wet black under it, so the yellow is pure)
  const NT = 72, tpts = Array.from({ length: NT }, () => V(0, 0, 0)), tail = _skTube(unit, tailM, NT, 12);
  const s0 = o.sCut - 0.006, sOf = i => s0 + (1 - s0) * i / (NT - 1);
  const zig = s => { if (s <= o.sBolt) return 0; const u = (s - o.sBolt) / (1 - o.sBolt), Z = o.zig; for (let k = 1; k < Z.length; k++) if (u <= Z[k][0]) { const f = (u - Z[k - 1][0]) / (Z[k][0] - Z[k - 1][0]); return Z[k - 1][1] + (Z[k][1] - Z[k - 1][1]) * f; } return Z[Z.length - 1][1]; };
  const tailR = q => { const s = s0 + (1 - s0) * q; if (s <= o.sBolt) return rOf(s); const u = (s - o.sBolt) / (1 - o.sBolt); return rOf(o.sBolt) * (1 - u * 0.15) * Math.pow(1 - u, 0.55) + 0.002; };
  const tailFx = q => { const k = _skS(o.sCut + 0.05, o.sBolt, s0 + (1 - s0) * q); return 1 + (o.boltFx - 1) * k; }, tailFy = q => { const k = _skS(o.sCut + 0.05, o.sBolt, s0 + (1 - s0) * q); return o.flat + (o.boltFy - o.flat) * k; };
  let glow = 1;
  const tailCol = (q, c) => { const s = s0 + (1 - s0) * q, tt = _skS(o.colStart, o.colFull, s), w = 0.3 * _skS(0.94, 1, s);
    c.copy(dark).lerp(lit.clone().multiplyScalar(glow), tt).lerp(white.clone().multiplyScalar(glow), w); };
  // THE LEGS: four, each a single arch, rebuilt every frame as it steps
  const NL = 14, legs = [];
  o.legs.forEach((ld, li) => [-1, 1].forEach(sx => legs.push({ ld, li, sx, tb: _taper32(unit, _skSkin, NL, 10), pts: Array.from({ length: NL }, () => V(0, 0, 0)) })));
  const legR = s => o.legR0 + (o.legR1 - o.legR0) * s - (s > 0.9 ? (s - 0.9) * 0.05 : 0);   // (thick at the body, thinner to its rounded foot)
  // THE HEAD: small, no face: a rounded triangle seen from above, a pill from the side
  const head = new T.Mesh(_skHeadGeo(o), _skSkin); unit.add(head);
  // a light at the tail's tip
  const Lt = new T.PointLight(0xffffff, 0.6, 1.2, 2); Lt.color.copy(lit); unit.add(Lt); LIGHTS.push(Lt);
  // the spine as it moves: the rest curve, the salamander's side-to-side bend (and a wave down the tail), the front reared by the action
  const P = V(0, 0, 0), Pa = V(0, 0, 0), Pb = V(0, 0, 0), fw = V(0, 0, 0), ax = V(0, 0, 0), ay = V(0, 0, 0), up = V(0, 1, 0), m4 = new T.Matrix4(), d = V(0, 0, 0);
  let ph = 0, rear = 0, strike = 0, calm = 1;
  const spine = (s, out) => {
    s = Math.min(1, Math.max(0, s)); curve.getPoint(s, out);   // (clamped first: the frame at the neck asks a little ahead of it, and a power of a negative s is NaN, which hid the head in build 2026-11-08a)
    out.x += o.swimAmp * (0.22 + 0.78 * Math.pow(s, 1.15)) * Math.sin(2 * ph - TAU * o.swimWaves * s) * calm;   // (the eel's wave: small at the head, wide at the tail, two strokes a loop)
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
    for (let i = 0; i < N; i++) spine(o.sCut * i / (N - 1), pts[i]);
    body.set(pts, 0, 0, s => rOf(o.sCut * s), 1, o.flat);
    glow = (0.85 + 0.15 * Math.sin(ph * 4)) * (1 + 1.5 * Math.max(0.5 * rear, strike));
    for (let i = 0; i < NT; i++) { const s = sOf(i); spine(s, tpts[i]); tpts[i].y += zig(s); }
    tail.set(tpts, tailR, tailFx, tailFy, tailCol);
    // the legs: each an arch from the side of the body, up and out, down to a foot on the floor; the diagonal pairs step together
    legs.forEach(L => { const ld = L.ld; frameAt(ld.s); const r = rOf(ld.s), side = V(ax.x, 0, ax.z).normalize().multiplyScalar(L.sx), ahead = V(fw.x, 0, fw.z).normalize();
      const hip = P.clone().addScaledVector(ax, L.sx * r * 0.8);
      const phi = 2 * ph - TAU * o.swimWaves * ld.s + (L.sx > 0 ? PI : 0), stance = Math.sin(phi) > 0;   // (each leg paddles in time with the wave where it is)
      const lift = (stance ? 0 : o.lift * -Math.sin(phi)) * (1 - a * 0.7) + (L.li === 0 ? o.rearLift * rear : 0);
      const foot = V(hip.x, 0, hip.z).addScaledVector(side, o.reach).addScaledVector(ahead, ld.fwd + o.stride * Math.cos(phi) * (1 - a * 0.7)); foot.y = o.legR1 + lift;
      const ctrl = hip.clone().lerp(foot, 0.42); ctrl.y = Math.max(hip.y, foot.y) + 2 * o.arch;   // (a quadratic arch: its top halfway to the control point)
      for (let j = 0; j < NL; j++) { const u = j / (NL - 1), w0 = (1 - u) * (1 - u), w1 = 2 * (1 - u) * u, w2 = u * u;
        L.pts[j].set(hip.x * w0 + ctrl.x * w1 + foot.x * w2, hip.y * w0 + ctrl.y * w1 + foot.y * w2, hip.z * w0 + ctrl.z * w1 + foot.z * w2); }
      L.tb.set(L.pts, 0, 0, legR, 1, 1); });
    // the head: a rounded end ahead of the neck, rearing back, then lunging
    frameAt(0); head.position.copy(P).addScaledVector(fw, o.headFwd).addScaledVector(ay, o.headUp);
    m4.makeBasis(ax, ay, fw); head.quaternion.setFromRotationMatrix(m4); head.rotateX(-o.headTilt - 0.5 * rear + 0.25 * strike); head.rotateY(-0.16 * Math.sin(2 * ph + 0.6) * calm);
    // the light at the tail's glowing end
    Lt.position.copy(tpts[NT - 8]).add(V(0, 0.05, 0)); Lt.intensity = 0.6 * glow;
  } };
}
const _sk0 = {
  S: 0.85, coreY: 0.09, shiftZ: 0.2,
  spine: [[0.36, 0.112], [0.25, 0.086], [0.1, 0.072], [-0.08, 0.07], [-0.24, 0.07], [-0.42, 0.066], [-0.6, 0.072], [-0.78, 0.098]],
  rNeck: 0.034, rBody: 0.065, rTip: 0.01, sTrunk: 0.13,   // (a pinched neck, so the head reads: the owner, 2026-11-08, "He's supposed to have a small head, but it looks like he doesn't have a head at all")
  sHip: 0.47, flat: 0.6,
  legs: [{ s: 0.115, fwd: 0.04 }, { s: 0.47, fwd: -0.03 }], legR0: 0.025, legR1: 0.015, reach: 0.13, arch: 0.045,
  stride: 0.035, lift: 0.028, rearLift: 0.05,
  headW: 0.185, headL: 0.21, headH: 0.104, headRb: 0.045, headRf: 0.026, headP: 2.4, headTaper: 0.3,   // (small, taller than the flat body: wide at the back corners (rounded by headRb), narrowing to the snout (rounded by headRf). Build c's was a ball 0.165 × 0.115 × 0.165; build a's 0.15 × 0.078 × 0.17, level with the body)
  headFwd: 0.075, headUp: 0.028, headTilt: 0.18,   // (ahead of the neck and lifted a little)
  sCut: 0.55, sBolt: 0.8, colStart: 0.57, colFull: 0.88, boltFx: 0.55, boltFy: 1.5,
  zig: [[0, 0], [0.3, 0.078], [0.38, 0.026], [0.66, 0.112], [0.74, 0.056], [1, 0.17]],   // (the bolt: (along its stretch, height): up, a sharp jog back down, up, a jog, up to the point)
  swimAmp: 0.075, swimWaves: 1.1, rearH: 0.12, rearReach: 0.42, lunge: 0.11,
};
fx(904, "The ELECTRO SKINK, the new electric brawler (the owner's whiteboard sketch: a long, skinny, flat body, a rounded-off head with no face, four legs each a single arch): wet black and plain, its tail fading into a glowing electric yellow toward its end, its last stretch a zig-zag lightning bolt.", () => _electroSkink(_sk0));
fx(905, "904, the game sprite (its size in the sheet's cell; S 2.8 since the owner's \"make him bigger\", 2026-11-08: it was 2.0; baked in a 192 px cell, half 2.267, so it keeps the 144 px cell's pixels a unit).", () => _electroSkink(Object.assign({}, _sk0, { S: 2.8 })));
