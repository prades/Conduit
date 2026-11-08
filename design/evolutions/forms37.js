// ── SUNDEW, THE BLOOM BRAWLER · drafts No. 906 (the pitcher) and No. 907 (the snail) (2026-11-08) ────────────────────────────────
// The approved concept (docs/CONVERSION.md §2, "BLOOM's creatures"): SUNDEW, "a black pitcher-shaped shell holding a pool of pink nectar"; a mollusk; its main attack
// slashing (its barbed lip); its move CONSUME (it swallows an enemy whole). BLOOM's colour: blossom pink #ff7ab8. The owner's pencil page (sent 2026-11-07; marked "BRAWLY",
// "MOLLUSK", "BLOOM (PINK)", with the lotus lantern and the coral crab) has two mollusks, drawn here one each:
//   906  from the one marked BRAWLY: a round sac body on splayed, flat feet, a Y on its front; a stalk from its top to a four-petal flower; from the flower a long
//        blade-leaf, its edge jagged. Drawn as a black pitcher (its mouth on top, rim barbed, holding the glowing nectar), its feet a mollusk's flat arms.
//   907  from the snail below it: a spiral shell on a frilled foot; a long S-curved neck to a four-petal flower; from the flower a long blade-leaf, its lower edge a
//        sawtooth. Drawn with the shell's growth lines glowing nectar pink.
// Drafts for the owner's choice (2026-11-08: "draft me some designs for the brawler next", "The bloom one."): not in the game. The owner chose 906: "The left one tilted
// pitcher and feet like roots/tentacles". That is No. 908 (below 906); then, on its body, "a wilted flower that has teeth": No. 909; then, on its textures, Nos. 910 and 911 (two finishes);
// then CONSUME's look ("whenever it ... eats one of the enemy targets, that the petal close up"): update's third argument, cons (seconds since it swallowed), closes the
// petals into a bud, throbbing, then opens them; and its stem withers to the floor round it. "The design looks solid right now as stationary and moving". Then "911, and
// make CONSUME his Ultimate": **No. 911 is SUNDEW's approved look** (docs/DECISION-LOG.md). 907 was passed over; 906 and 908 to 910 are the steps to 911.
// Uses forms31.js (_c31, _prog31) and forms32.js (_taper32, _aim32). +z is the front; ph = 1.6 t runs once round the idle loop.
const _sdS = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const _sdSkin = new T.MeshStandardMaterial({ color: 0x040405, metalness: 0.25, roughness: 0.3, side: T.DoubleSide }); _sdSkin.envMapIntensity = 0.5;   // (wet black, as the Electro Skink's)
const _sdMatte = new T.MeshStandardMaterial({ color: 0x030203, metalness: 0.05, roughness: 0.5, side: T.DoubleSide }); _sdMatte.envMapIntensity = 0.1;   // (910, 911: a matte, organic black with a plum tint, for the roots, stem, base and blade)
const _sdRnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;   // (a seeded random: the textures come out the same every time)
// a petal's texture (its base at the canvas's foot, its tip at its head): velvet plum-black, mottled, its veins fanning out from the base, its edges and its tip darker,
// wilted. With glow: only the veins, in BLOOM's pink, as an emissive map (911)
function _sdPetalTex(glow) {
  const W = 128, H = 256, c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d'), rnd = _sdRnd(glow ? 11 : 7);
  g.fillStyle = glow ? '#000' : '#070406'; g.fillRect(0, 0, W, H);
  if (!glow) for (let i = 0; i < 240; i++) { const x = rnd() * W, y = rnd() * H, r = 5 + rnd() * 16, gr = g.createRadialGradient(x, y, 0, x, y, r);
    gr.addColorStop(0, rnd() < 0.5 ? 'rgba(34,16,26,0.32)' : 'rgba(0,0,0,0.3)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  const n = 11; g.lineCap = 'round';
  for (let k = 0; k < n; k++) {
    const f = (k - (n - 1) / 2) / ((n - 1) / 2), wob = (rnd() - 0.5) * 12, mid = k === (n - 1) / 2;
    if (glow) { g.strokeStyle = 'rgba(255,122,184,' + (mid ? 0.95 : 0.75) + ')'; g.shadowColor = '#ff7ab8'; g.shadowBlur = 5; } else g.strokeStyle = 'rgba(64,36,52,' + (mid ? 0.65 : 0.45) + ')';
    g.beginPath(); g.moveTo(W / 2 + f * 5, H); g.quadraticCurveTo(W / 2 + f * W * 0.2 + wob, H * 0.48, W / 2 + f * W * 0.44, H * 0.03); g.lineWidth = mid ? 3.2 : 1.5; g.stroke();
    for (let q = 0; q < 3; q++) { const t0 = 0.25 + q * 0.22 + rnd() * 0.06, yy = H * (1 - t0), xx = W / 2 + f * W * (0.05 + 0.4 * t0), dir = f >= 0 ? 1 : -1;   // (veinlets toward the edges)
      g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx + dir * (8 + rnd() * 8), yy - 10 - rnd() * 8); g.lineWidth = 0.9; g.stroke(); }
  }
  g.shadowBlur = 0;
  if (!glow) {
    const ge = g.createLinearGradient(0, 0, W, 0); ge.addColorStop(0, 'rgba(0,0,0,0.65)'); ge.addColorStop(0.16, 'rgba(0,0,0,0)'); ge.addColorStop(0.84, 'rgba(0,0,0,0)'); ge.addColorStop(1, 'rgba(0,0,0,0.65)');
    g.fillStyle = ge; g.fillRect(0, 0, W, H);
    const gt = g.createLinearGradient(0, 0, 0, H); gt.addColorStop(0, 'rgba(8,4,6,0.75)'); gt.addColorStop(0.3, 'rgba(8,4,6,0)'); g.fillStyle = gt; g.fillRect(0, 0, W, H);   // (the wilted tip darkest)
  }
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return t;
}
// BLOOM's pink from the colour the page is set to (EL.color), and the parts that glow with it
function _sdMats() {
  const pink = _c31(EL.color).convertSRGBToLinear(), white = _c31(0xffffff);
  return {
    pink,
    petal: (() => { const p = new T.MeshStandardMaterial({ color: pink.clone().multiplyScalar(0.75), emissive: pink, emissiveIntensity: 0.28, metalness: 0.05, roughness: 0.55, side: T.DoubleSide, toneMapped: false }); p.envMapIntensity = 0.25; return p; })(),   // (saturated: lit pink, not washed to white)
    nectar: new T.MeshBasicMaterial({ color: pink.clone().multiplyScalar(1.1), toneMapped: false }),
    heart: new T.MeshBasicMaterial({ color: pink.clone().lerp(white, 0.4), toneMapped: false }),
    vein: new T.MeshBasicMaterial({ color: pink.clone().multiplyScalar(0.85), toneMapped: false }),
  };
}
// a flower of four rounded petals round a bright heart, facing +z
function _sdFlower(m, r) {
  const f = G();
  for (let i = 0; i < 4; i++) { const a = PI / 4 + i * PI / 2, p = new T.Mesh(new T.SphereGeometry(1, 18, 12), m.petal);
    p.scale.set(r * 0.58, r * 0.46, r * 0.13); p.position.set(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, -r * 0.05); p.rotation.set(0, 0, a); p.rotateY(-0.3); f.add(p); }   // (cupped a little forward)
  const h = new T.Mesh(new T.SphereGeometry(r * 0.26, 16, 12), m.heart); h.position.z = r * 0.06; f.add(h);
  return f;
}
// a flat leaf-blade along +z from its root at the origin, curving down like a scythe (bend): one edge (top: +y, else -y) sharp triangle teeth, the other smooth; a
// glowing vein down its middle
function _sdBlade(m, L, W, teeth, top, bend, skin) {
  const s = top ? 1 : -1, h = u => W / 2 * Math.pow(Math.sin(PI * Math.min(1, 0.1 + 0.9 * u)), 0.6), c = u => -(bend || 0) * u * u, P = [];
  for (let i = 0; i <= 20; i++) { const u = i / 20; P.push([u * L, c(u) - s * h(u) * 0.7]); }   // (the smooth edge, root to tip)
  for (let k = teeth; k >= 1; k--) { const u1 = k / teeth, um = (k - 0.5) / teeth;   // (the toothed edge, tip to root: a notch, then a sharp tooth)
    P.push([u1 * L, c(u1) + s * h(u1) * 0.75]); P.push([um * L, c(um) + s * (h(um) * 0.75 + W * 0.3)]); }
  P.push([0, c(0) + s * h(0) * 0.75]);
  const sh = new T.Shape(); P.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath();
  const geo = new T.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 4 });
  geo.translate(0, 0, -0.006); geo.rotateY(-PI / 2); geo.computeVertexNormals();
  const bl = G(); bl.add(new T.Mesh(geo, skin || _sdSkin));
  const vp = Array.from({ length: 12 }, (_, i) => { const u = 0.04 + 0.8 * i / 11; return V(0, c(u), u * L); });   // (the vein follows the curve)
  _taper32(bl, m.vein, 12, 6).set(vp, 0.007, 0.004, null, 1.7, 0.6);
  return bl;
}
// a cubic Bézier from p0 to p3 (controls c1, c2) into n points, written into pts
function _sdBez(pts, p0, c1, c2, p3) {
  const n = pts.length;
  for (let i = 0; i < n; i++) { const u = i / (n - 1), a = (1 - u) * (1 - u) * (1 - u), b = 3 * (1 - u) * (1 - u) * u, c = 3 * (1 - u) * u * u, d = u * u * u;
    pts[i].set(p0.x * a + c1.x * b + c2.x * c + p3.x * d, p0.y * a + c1.y * b + c2.y * c + p3.y * d, p0.z * a + c1.z * b + c2.z * c + p3.z * d); }
  return pts;
}

// ── 909's BODY · A WILTED FLOWER WITH TEETH ─────────────────────────────────────────────────────────────────────────────────────
// (the owner on 908: "I like everything but the cauldron-like body. Can we make it look more like a flower that has teeth? Like a wilted flower that has teeth"): black
// petals cupped round a mouth, their tips wilting outward and down, each its own way; their inner faces glow pink, brightest deep in the throat; two rings of pale fangs
// in the mouth, the nectar at the bottom; a pink vein down each petal's back. Built in the pot's frame (its axis +y, its base at the origin). The petals breathe, flare open
// as it strikes and close a little as it rears.
function _sdWilted(pot, m, o) {
  const NU = 16, NV = 9, petals = [];
  const tex = o.tex ? _sdPetalTex(false) : null, veinTex = o.tex === 'glow' ? _sdPetalTex(true) : null;   // (910: velvet, veined; 911: its veins glowing)
  const petalM = new T.MeshStandardMaterial(tex ? { color: 0xffffff, map: tex, vertexColors: true, metalness: 0.04, roughness: 0.62, emissive: m.pink, side: T.DoubleSide }
    : { color: _sdSkin.color, vertexColors: true, metalness: 0.15, roughness: 0.5, emissive: m.pink, side: T.DoubleSide }); petalM.envMapIntensity = tex ? 0.08 : 0.26;
  petalM.customProgramCacheKey = () => 'sdPetal' + (tex ? 'T' : '') + (veinTex ? 'G' : '');   // (its shader differs by version)   // (a soft, deep black: less shine than the wet roots)
  let veinU = null;   // (911: the glowing veins' strength; they pulse as it digests)
  petalM.onBeforeCompile = sh => { if (veinTex) { sh.uniforms.veinMap = { value: veinTex }; sh.uniforms.veinK = veinU = veinU || { value: 0.85 }; sh.fragmentShader = 'uniform sampler2D veinMap;\nuniform float veinK;\n' + sh.fragmentShader; }
    sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '').replace('vec3 totalEmissiveRadiance = emissive;',
      'vec3 totalEmissiveRadiance = (gl_FrontFacing ? emissive * vColor : vec3(0.0))' + (veinTex ? ' + sRGBToLinear(texture2D(veinMap, vUv)).rgb * veinK' : '') + ';'); };   // (the inner faces glow, deepest brightest; the backs stay black)
  const rec = new T.Mesh(new T.SphereGeometry(1, 24, 16), o.matte ? _sdMatte : _sdSkin); rec.scale.set(o.recR, o.recR * 0.8, o.recR); rec.position.y = o.recR * 0.8; pot.add(rec);   // (the base the petals and the roots grow from)
  for (let k = 0; k < o.petals; k++) {
    const a = (k + 0.5) / o.petals * TAU, R = V(Math.sin(a), 0, Math.cos(a)), Tn = V(Math.cos(a), 0, -Math.sin(a));
    const droop = 1 + 0.22 * Math.sin(k * 2.4 + 1), L = o.petalL * (1 + 0.08 * Math.sin(k * 1.7 + 0.4));   // (each wilts a little differently)
    const pos = new Float32Array(NU * NV * 3), col = new Float32Array(NU * NV * 3), idx = [];
    for (let i = 0; i < NU - 1; i++) for (let j = 0; j < NV - 1; j++) { const p0 = i * NV + j, p1 = p0 + 1, p2 = p0 + NV, p3 = p2 + 1; idx.push(p0, p2, p1, p1, p2, p3); }   // (front faces inward)
    for (let i = 0; i < NU; i++) { const gl = Math.max(0.015, Math.pow(Math.max(0, 1 - i / (NU - 1) / 0.6), 1.3)); for (let j = 0; j < NV; j++) { const q = (i * NV + j) * 3; col[q] = col[q + 1] = col[q + 2] = gl; } }   // (the glow only in the cup and the throat: the wilting outer petals stay black)
    const uv = new Float32Array(NU * NV * 2); for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { const q = (i * NV + j) * 2; uv[q] = j / (NV - 1); uv[q + 1] = i / (NU - 1); }   // (across, along)
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setAttribute('uv', new T.BufferAttribute(uv, 2)); geo.setIndex(idx);
    pot.add(new T.Mesh(geo, petalM));
    petals.push({ R, Tn, droop, L, pos, geo, seed: k * 1.9, vein: _taper32(pot, m.vein, 12, 6), vpts: Array.from({ length: 12 }, () => V(0, 0, 0)), sp: Array.from({ length: NU }, () => [0, 0, 0, 0]) });
  }
  // the fangs: a ring at the lip of the cup and a smaller one deep in the throat, pointing in, hooked down
  const toothM = new T.MeshStandardMaterial({ color: 0xeee0e4, emissive: m.pink, emissiveIntensity: 0.05, metalness: 0, roughness: 0.32 }); toothM.envMapIntensity = 0.6;
  const fang = (len, rad) => { const geo = new T.ConeGeometry(rad, len, 7, 4), p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const tt = (p.getY(i) + len / 2) / len; p.setZ(i, p.getZ(i) - 0.35 * len * tt * tt); p.setY(i, p.getY(i) + len / 2); }
    geo.computeVertexNormals(); return geo; };
  const teeth = G(); pot.add(teeth);
  [[o.teethRim, o.rimR, o.rimY, 0.075, 0.016, 0.25], [o.teethThroat, o.throatR, o.throatY, 0.05, 0.012, 0.5]].forEach(([n, r, y, len, rad, upw], ring) => {
    for (let k = 0; k < n; k++) { const a = (k + ring * 0.5) / n * TAU, sm = k % 2 ? 0.72 : 1, f = new T.Mesh(fang(len * sm, rad * (k % 2 ? 0.8 : 1)), toothM);
      f.position.set(Math.sin(a) * r, y, Math.cos(a) * r); _aim32(f, V(-Math.sin(a), upw, -Math.cos(a)), V(0, 1, 0)); teeth.add(f); } });
  // a point on a petal: its spine at row i, across it by v (-1..1), its edges cupped inward
  const surf = (P, i, v, out) => { const [r, y, dr, dy] = P.sp[i], u = i / (NU - 1);
    const base = 0.45 + 0.55 * Math.sin(Math.min(1, u / 0.5) * PI / 2), tipR = u > 0.78 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.78) / 0.22, 2))) : 1;
    const w = o.petalW * base * tipR + 0.003, cup = o.cup * (1 - 0.5 * u) * v * v + (o.pleat || 0) * Math.sin(v * PI * 2.5 + P.seed) * (0.3 + u);   // (cupped, and creased lengthwise (910); along the inner normal, (-dy, dr) in its (out, up) plane)
    return out.set(P.R.x * (r - dy * cup) + P.Tn.x * v * w, y + dr * cup, P.R.z * (r - dy * cup) + P.Tn.z * v * w); };
  const tmp = V(0, 0, 0);
  return { update(ph, rear, strike, shut, throb) {   // (shut: 0 open, 1 closed into a bud (CONSUME); throb 0..1, its digesting pulse)
    const se = shut ? shut * shut * (3 - 2 * shut) : 0, open = 1 + 0.03 * Math.sin(ph) - 0.12 * rear + 0.25 * strike;
    petals.forEach((P, k) => {
      let r = o.p0r, y = o.p0y; const ds = P.L / (NU - 1);
      for (let i = 0; i < NU; i++) { const u = i / (NU - 1), s = Math.min(1, u / o.pRise), w = Math.max(0, (u - o.pRise) / (1 - o.pRise));
        const phi = (o.phi0 + (o.phi1 - o.phi0) * s) * open + o.wilt * P.droop * w * w * (1 - 0.35 * strike);   // (from upright toward outward; past the lip it wilts over and down)
        const dr = Math.sin(phi), dy = Math.cos(phi); P.sp[i][0] = r; P.sp[i][1] = y; P.sp[i][2] = dr; P.sp[i][3] = dy; r += dr * ds; y += dy * ds; }
      if (se > 0) {   // (CONSUME: each petal curls up and in over the mouth to the bud's tip, the inner whorl inside the outer; the bud swells as it digests)
        const lay = k % 2 ? 1 : 0.92, swell = 1 + 0.1 * (throb || 0);
        for (let i = 0; i < NU; i++) { const u = i / (NU - 1), a = (1 - u) * (1 - u), b = 2 * (1 - u) * u, c = u * u;
          const cr = (a * o.p0r + b * o.budR + c * o.budTip) * lay * swell, cy = o.p0y + (0.55 * b + c) * o.budH * (0.96 + 0.04 * swell);
          P.sp[i][0] += (cr - P.sp[i][0]) * se; P.sp[i][1] += (cy - P.sp[i][1]) * se; }
        for (let i = 0; i < NU; i++) { const i0 = Math.max(0, i - 1), i1 = Math.min(NU - 1, i + 1), dr = P.sp[i1][0] - P.sp[i0][0], dy = P.sp[i1][1] - P.sp[i0][1], l = Math.hypot(dr, dy) || 1;
          P.sp[i][2] = dr / l; P.sp[i][3] = dy / l; } }
      for (let i = 0; i < NU; i++) for (let j = 0; j < NV; j++) { surf(P, i, -1 + 2 * j / (NV - 1), tmp); const q = (i * NV + j) * 3; P.pos[q] = tmp.x; P.pos[q + 1] = tmp.y; P.pos[q + 2] = tmp.z; }
      P.geo.attributes.position.needsUpdate = true; P.geo.computeVertexNormals(); P.geo.computeBoundingSphere();
      for (let i = 0; i < 12; i++) { const [rr, yy, dr, dy] = P.sp[i + 1]; P.vpts[i].set(P.R.x * (rr + dy * 0.008), yy - dr * 0.008, P.R.z * (rr + dy * 0.008)); }   // (the vein on its back)
      P.vein.set(P.vpts, 0.006, 0.0035, null, 1.6, 0.6);
    });
    teeth.scale.set(1 - 0.3 * se, 1, 1 - 0.3 * se);   // (inside the bud)
    if (veinU) veinU.value = 0.85 * (1 + 1.2 * se * (throb || 0));
  } };
}

// ── 906 · THE PITCHER (from BRAWLY) ──────────────────────────────────────────────────────────────────────────────────────────
function _sundewPitcher(o) {
  const m = _sdMats(), g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  // THE PITCHER: round and black, its mouth on top, the rim barbed, holding the glowing nectar; a Y of pink vein on its front
  const pot = G(); b.add(pot); pot.rotation.x = o.tilt || 0; pot.position.y = o.lift || 0;   // (908: tilted forward, its mouth to the front)
  const ct = Math.cos(o.tilt || 0), st = Math.sin(o.tilt || 0), potPt = (x, y, z) => V(x, (o.lift || 0) + y * ct - z * st, y * st + z * ct);   // (a point of the pot where it stands)
  const nec = new T.Mesh(new T.CircleGeometry(o.necR, 40), m.nectar); nec.rotation.x = -PI / 2; nec.position.y = o.necY; pot.add(nec);
  const wilted = o.body === 'flower' ? _sdWilted(pot, m, o) : null;   // (909: the wilted flower with teeth, not the pitcher)
  if (!wilted) {
    pot.add(new T.Mesh(new T.LatheGeometry(o.prof.map(([r, y]) => new T.Vector2(r, y)), 48), _sdSkin));
    const outer = o.prof.slice(0, o.lipAt + 1), rAt = y => { for (let i = 1; i < outer.length; i++) if (y <= outer[i][1]) { const [r0, y0] = outer[i - 1], [r1, y1] = outer[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return outer[outer.length - 1][0]; };
    for (let k = 0; k < o.barbs; k++) { const a = k / o.barbs * TAU, c = new T.Mesh(new T.ConeGeometry(0.011, 0.045, 6), _sdSkin);   // (the barbed lip: teeth pointing in and down)
      c.position.set(Math.sin(a) * o.barbR, o.barbY, Math.cos(a) * o.barbR); _aim32(c, V(-Math.sin(a), -0.7, -Math.cos(a)), V(0, 1, 0)); pot.add(c); }
    const surf = (y, a) => { const r = rAt(y) + 0.002; return V(Math.sin(a) * r, y, Math.cos(a) * r); };
    [[[0.07, 0], [0.13, 0], [0.19, 0]], [[0.19, 0], [0.25, 0.12], [0.31, 0.3]], [[0.19, 0], [0.25, -0.12], [0.31, -0.3]]].forEach(seg => {   // (the Y, its stem low on the front)
      const pts = Array.from({ length: 8 }, () => V(0, 0, 0)); _sdBez(pts, surf(...seg[0]), surf(...seg[1]), surf(...seg[1]), surf(...seg[2]));
      _taper32(pot, m.vein, 8, 8).set(pts, 0.011, 0.008); });
  }
  const Ln = new T.PointLight(0xffffff, 0.9, 0.9, 2); Ln.color.copy(m.pink); Ln.position.set(0, o.necY + 0.06, 0); pot.add(Ln); LIGHTS.push(Ln);
  // THE FEET (906): six flat arms splayed on the floor, their tips lifting in a slow wave round it; or ROOTS (908): long, round, tapering tentacles out of its lower body,
  // arching down to the floor and out, wavering, their tips curling, some forking a rootlet (the owner on 906: "tilted pitcher and feet like roots/tentacles")
  const NF = 12, feet = (o.feet || []).map(([deg, len]) => ({ a: deg * PI / 180, len, tb: _taper32(b, _sdSkin, NF, 10), pts: Array.from({ length: NF }, () => V(0, 0, 0)) }));
  const skin = o.matte ? _sdMatte : _sdSkin, NR = o.rootN || 18, roots = (o.roots || []).map(([deg, len, ph0, twig], j) => { const a = deg * PI / 180, P0 = potPt(Math.sin(a) * o.rootR, o.rootY, Math.cos(a) * o.rootR);
    return { len, ph0, P0, cs: j % 2 ? 1 : -1, tb: _taper32(b, skin, NR, 10), pts: Array.from({ length: NR }, () => V(0, 0, 0)),
             twig: twig ? { side: twig, tb: _taper32(b, skin, 8, 8), pts: Array.from({ length: 8 }, () => V(0, 0, 0)) } : null }; });
  // THE STALK, from the rim up to the flower (906); or (908) THE STEM, from the bottom of the barrel at its back, out behind it, up and over its top to the flower, like a
  // scorpion's tail (the owner on 908: "Put the stem on the bottom of the barrel"); THE FLOWER; THE BLADE-LEAF, from the flower, forward
  const NS = o.stemVia ? 30 : 16, stalk = _taper32(b, skin, NS, 10), spts = Array.from({ length: NS }, () => V(0, 0, 0));
  const flower = _sdFlower(m, o.flowerR); b.add(flower);
  const bladeP = G(); b.add(bladeP); const blade = _sdBlade(m, o.bladeL, o.bladeW, o.teeth, true, o.bend, skin); blade.position.z = 0.02; bladeP.add(blade);
  const S0 = o.stemVia ? potPt(0, o.stemBase[0], o.stemBase[1]) : potPt(0, o.stalkY0, o.stalkZ0), C1 = V(0, 0, 0), C2 = V(0, 0, 0), TOP = V(0, 0, 0);
  const via0 = (o.stemVia || []).map(p => V(p[0], p[1], p[2])), via = via0.map(p => p.clone());
  const wv = (o.witherVia || []).map(p => V(p[0], p[1], p[2])), WTOP = o.witherTop ? V(o.witherTop[0], o.witherTop[1], o.witherTop[2]) : null;   // (CONSUME: where the stem lies, withered)
  const stem = o.stemVia ? new T.CatmullRomCurve3([S0].concat(via, [TOP]), false, 'centripetal') : null;   // (it holds these points: moving them moves it)
  return { g, core: o.coreY * (o.S || 1), update(t, act, cons) {   // (cons: seconds since CONSUME swallowed its catch; leave it out when it holds none)
    const ph = 1.6 * t, pr = _prog31(t, act), rear = _sdS(0, 0.3, pr) * (1 - _sdS(0.34, 0.5, pr)), strike = _sdS(0.34, 0.5, pr) * (1 - _sdS(0.62, 1, pr)), br = Math.sin(ph);
    const calm = 1 - 0.7 * Math.min(1, act || 0);
    // CONSUME (909 on): the mouth flares to take the catch, the petals snap shut into a bud, it throbs as it digests (consumeHold seconds), then the petals open again
    const c = cons == null ? -1 : cons, gulp = c < 0 ? 0 : _sdS(0, 0.1, c) * (1 - _sdS(0.1, 0.24, c));
    const shut = c < 0 ? (o.shutHold || 0) : _sdS(0.1, 0.3, c) * (1 - _sdS(o.consumeHold, o.consumeHold + 0.45, c));
    const throb = shut > 0.3 ? 0.5 + 0.5 * Math.sin((c < 0 ? t : c - 0.3) * TAU * 1.1 - PI / 2) : 0;
    // ...and while it digests its stem withers to the floor and curls round toward it, the flower and the blade lying wilted on the ground; its roots draw in (the owner:
    // "make him put the stem on the ground when he's consuming like he may make it wrapped towards him as well. He's taking it all in make it [wither] on the ground")
    const wither = c < 0 || !WTOP ? 0 : _sdS(0.15, 0.85, c) * (1 - _sdS(o.consumeHold - 0.1, o.consumeHold + 0.7, c)), we = wither * wither * (3 - 2 * wither);
    roots.forEach(r => { const d0 = Math.hypot(r.P0.x, r.P0.z), ax = Math.atan2(r.P0.x, r.P0.z), dx = Math.sin(ax), dz = Math.cos(ax), tx = Math.cos(ax), tz = -Math.sin(ax);
      for (let i = 0; i < NR; i++) { const u = i / (NR - 1), d = d0 + r.len * (1 - 0.14 * shut) * u, down = _sdS(0, 0.34, u), tip = _sdS(0.68, 1, u);   // (drawn in while it holds a catch)
        const side = o.rootWave * u * Math.sin(TAU * 0.85 * u + r.ph0 + ph) * calm + r.cs * o.rootCurlSide * tip * tip;   // (a slow writhe, the tip curling to one side)
        r.pts[i].set(dx * d + tx * side, r.P0.y * (1 - down) + o.rootR1 * down + o.rootCurl * (1 + 0.9 * shut) * tip * tip * (0.8 + 0.2 * Math.sin(ph + r.ph0) * calm), dz * d + tz * side); }
      r.tb.set(r.pts, 0, 0, u => (o.rootR0 * Math.pow(1 - u, 0.85) + 0.0035) * (1 + (o.rootRing || 0) * Math.pow(0.5 + 0.5 * Math.cos(u * (o.rootRingN || 0) * TAU), 3)), 1.2, 0.85);   // (910: ringed, as roots or tentacles)
      if (r.twig) { const B = r.pts[Math.floor(NR * 0.45)], ta = r.twig.side * 0.6, bx = dx * Math.cos(ta) + tx * Math.sin(ta), bz = dz * Math.cos(ta) + tz * Math.sin(ta);
        for (let i = 0; i < 8; i++) { const u = i / 7; r.twig.pts[i].set(B.x + bx * 0.13 * u, B.y + 0.012 * Math.sin(PI * u) + 0.018 * u * u, B.z + bz * 0.13 * u); }
        r.twig.tb.set(r.twig.pts, 0, 0, u => 0.013 * (1 - u) + 0.003, 1.1, 0.9); } });
    if (wilted) { wilted.update(ph, rear, Math.max(strike, gulp), shut, throb); pot.scale.set(1 + 0.03 * throb * shut, 1 + 0.045 * throb * shut, 1 + 0.03 * throb * shut); }   // (the petals breathe, flare, close; the bud throbs)
    else pot.scale.set(1 - 0.012 * br, 1 + 0.02 * br, 1 - 0.012 * br);   // (the pitcher breathes)
    nec.position.y = o.necY + 0.004 * Math.sin(2 * ph); Ln.intensity = 0.9 * (o.lightK || 1) * (0.85 + 0.15 * Math.sin(2 * ph)) * (1 + 0.8 * Math.max(strike, gulp)) * (1 - 0.8 * shut);
    feet.forEach((f, j) => { const lift = 0.03 * Math.max(0, Math.sin(ph - j * TAU / feet.length)) * (1 - 0.7 * Math.min(1, act || 0));
      for (let i = 0; i < NF; i++) { const u = i / (NF - 1), d = o.footR0 + f.len * u;
        f.pts[i].set(Math.sin(f.a) * d, o.footY * (1 - u) + 0.012 + lift * u * u + o.curl * Math.pow(u, 4), Math.cos(f.a) * d); }
      f.tb.set(f.pts, 0, 0, u => 0.05 * Math.sqrt(Math.max(0, 1 - u * u * u)) + 0.006, 2, 0.35); });   // (flat and wide, their ends blunt and round, as drawn)
    TOP.set(0.02 * Math.sin(ph + 0.5), o.flowerY + 0.012 * Math.sin(2 * ph) + 0.05 * rear - 0.07 * strike, o.flowerZ - 0.08 * rear + 0.1 * strike);
    if (we > 0) TOP.lerp(WTOP, we);   // (the flower down on the floor in front of it)
    if (stem) {   // (the higher along it, the more it follows the flower: cocked back as it rears, whipped forward in the strike)
      via.forEach((p, i) => { const k = (i + 1) / (via.length + 1); p.copy(via0[i]); p.x += TOP.x * k; p.y += (0.05 * rear - 0.06 * strike) * k; p.z += (-0.06 * rear + 0.1 * strike) * k;
        if (we > 0) p.lerp(wv[i], we); });   // (withered: along the floor, round its side)
      for (let i = 0; i < NS; i++) stem.getPoint(i / (NS - 1), spts[i]);
      stalk.set(spts, 0, 0, u => o.stemR0 + (o.stemR1 - o.stemR0) * u, 1, 1);
    } else {
      C1.set(0, S0.y + 0.16, S0.z + 0.02); C2.set(TOP.x * 0.6, TOP.y - 0.12, TOP.z - 0.06);
      stalk.set(_sdBez(spts, S0, C1, C2, TOP), 0, 0, u => 0.024 - 0.009 * u, 1, 1);
    }
    flower.position.copy(TOP); flower.rotation.set(-0.35 + 0.4 * rear - 0.3 * strike, 0.1 * Math.sin(ph + 0.5), 0);
    bladeP.position.copy(TOP); bladeP.rotation.set(o.droop + 0.05 * Math.sin(ph + 1) - 1.1 * rear + 1.0 * strike, 0.08 * Math.sin(ph + 0.9), 0);
    flower.scale.setScalar(1 - 0.15 * we);
    if (we > 0) {   // (withered: the flower face up on the floor, the blade lying flat beside it)
      flower.rotation.x += (-1.35 - flower.rotation.x) * we; flower.rotation.y += (o.witherYaw - flower.rotation.y) * we;
      bladeP.rotation.x += (0.06 - bladeP.rotation.x) * we; bladeP.rotation.y += (o.witherYaw - bladeP.rotation.y) * we; bladeP.rotation.z += (PI / 2 - bladeP.rotation.z) * we; }
  } };
}
const _sdA = {
  S: 1, coreY: 0.3,
  prof: [[0, 0.03], [0.1, 0.032], [0.17, 0.06], [0.215, 0.12], [0.235, 0.2], [0.23, 0.28], [0.205, 0.36], [0.17, 0.43], [0.142, 0.49], [0.136, 0.53], [0.15, 0.565], [0.163, 0.583],
         [0.152, 0.596], [0.13, 0.584], [0.118, 0.55], [0.112, 0.49]],   // (the outer wall from the floor up to the lip at index 11, then over the rim and down inside)
  lipAt: 11, necR: 0.116, necY: 0.515, barbs: 18, barbR: 0.142, barbY: 0.588,
  feet: [[-150, 0.3], [-95, 0.22], [-30, 0.3], [30, 0.26], [95, 0.32], [160, 0.22]], footR0: 0.13, footY: 0.05, curl: 0.02,
  stalkY0: 0.57, stalkZ0: 0.12, flowerY: 0.86, flowerZ: 0.2, flowerR: 0.075,
  bladeL: 0.4, bladeW: 0.1, teeth: 6, bend: 0.06, droop: 0.25,
};
fx(906, "SUNDEW draft A, from the owner's sketch marked BRAWLY: a black pitcher on six flat mollusk feet, a pink Y vein on its front, its barbed mouth holding glowing pink nectar; a stalk from the rim to a four-petal pink flower, and from the flower a long blade-leaf with a sawtooth top edge.", () => _sundewPitcher(_sdA));
// 908: the owner chose 906 (2026-11-08: "The left one tilted pitcher and feet like roots/tentacles"): the pitcher tilted forward, its mouth to the front; seven long round
// roots for feet; then "Put the stem on the bottom of the barrel and no spikes on the bowl rim": its stem from the bottom of the barrel at its back, up behind it and over
// its top like a scorpion's tail, so the flower and the blade hang in front of the mouth; its rim smooth
const _sdC = Object.assign({}, _sdA, {
  tilt: 0.45, lift: 0.035, feet: null, barbs: 0,   // (a smooth rim: the owner on 908, "no spikes on the bowl rim")
  roots: [[-165, 0.36, 0.3, 0], [-115, 0.32, 1.9, 1], [-62, 0.38, 3.6, 0], [-18, 0.33, 5.1, -1], [28, 0.36, 0.9, 0], [78, 0.32, 2.6, 1], [128, 0.37, 4.4, 0]],   // (angle, length, its writhe's phase, a rootlet to one side)
  rootR: 0.14, rootY: 0.05, rootR0: 0.036, rootR1: 0.013, rootWave: 0.05, rootCurl: 0.05, rootCurlSide: 0.035,   // (out from under the body, as an octopus's arms from under its mantle)
  stemBase: [0.07, -0.16], stemVia: [[0, 0.15, -0.34], [0, 0.5, -0.42], [0, 0.9, -0.22]], stemR0: 0.03, stemR1: 0.016,   // (the stem: from the bottom of the barrel's back (pot y, z), then by these points (x, y, z), to the flower)
  flowerY: 0.93, flowerZ: 0.3,
});
// 909: the owner on 908 (2026-11-08): "I like everything but the cauldron-like body. Can we make it look more like a flower that has teeth? Like a wilted flower that has
// teeth": 908 with its body a wilted flower with teeth (_sdWilted), tipped forward a little more, the stem's arc lower to suit the lower body
const _sdD = Object.assign({}, _sdC, {
  body: 'flower', tilt: 0.5, lift: 0.04, lightK: 0.45,
  petals: 6, petalL: 0.44, petalW: 0.14, cup: 0.05, p0r: 0.06, p0y: 0.1, pRise: 0.44, phi0: 0.36, phi1: 0.72, wilt: 2.7, recR: 0.1,   // (the petals: how many, long, wide, cupped; the spine's start, its rise, its wilt (radians))
  teethRim: 12, rimR: 0.14, rimY: 0.26, teethThroat: 9, throatR: 0.075, throatY: 0.19, necR: 0.07, necY: 0.165,
  budH: 0.4, budR: 0.31, budTip: 0.012, consumeHold: 5,
  witherVia: [[0, 0.045, -0.3], [0.27, 0.045, -0.12], [0.29, 0.045, 0.13]], witherTop: [0.1, 0.05, 0.31], witherYaw: -0.84,   // (CONSUME: the stem withered on the floor, round its right side to the front (x, y, z), and the way its flower and blade lie)   // (CONSUME: the closed bud (its height, its bulge's pull, its tip) and how long it holds its catch (docs/CONVERSION.md: 5 s))
  rootR: 0.08, rootY: 0.05,
  stemBase: [0.06, -0.09], stemVia: [[0, 0.1, -0.3], [0, 0.42, -0.38], [0, 0.74, -0.18]], flowerY: 0.74, flowerZ: 0.3,
});
fx(908, "SUNDEW, 906 as the owner chose it: the pitcher tilted forward, its glowing mouth to the front, its rim smooth; its stem from the bottom of the barrel, up behind it and over its top like a scorpion's tail to the flower and the blade-leaf; its feet seven long round roots, writhing like tentacles, their tips curling.", () => _sundewPitcher(_sdC));
// 910, 911: the owner on 909 (2026-11-08): "Dude, I like that. I just don't like the textures, really. So can we change the textures a little bit?": 909 in two finishes.
// 910: velvet petals, plum-black and matte, veined from the base, mottled, darker at the edges and tips, creased lengthwise; the roots, stem, base and blade matte, the
// roots ringed. 911: 910 with its petals' veins glowing BLOOM's pink.
const _sdE = Object.assign({}, _sdD, { tex: 'velvet', matte: true, pleat: 0.012, rootN: 48, rootRing: 0.16, rootRingN: 13 });
const _sdF = Object.assign({}, _sdE, { tex: 'glow' });
fx(909, "SUNDEW, 908 with a new body: a wilted flower with teeth, its black petals cupped round a mouth of pale fangs and wilting outward and down, their inner faces glowing pink, the nectar deep in its throat; tipped forward on its roots, its stem from its base arching over it to the flower and the blade-leaf.", () => _sundewPitcher(_sdD));
fx(910, "SUNDEW, 909 textured: velvet petals, plum-black and matte, veined from the base and mottled, darker at their wilted edges and tips, creased lengthwise; the roots, stem and blade matte, the roots ringed like tentacles.", () => _sundewPitcher(_sdE));
fx(911, "SUNDEW, the approved look (2026-11-08): 910 with the veins of its petals glowing BLOOM's pink.", () => _sundewPitcher(_sdF));

// ── 907 · THE SNAIL (from the snail drawn below it) ────────────────────────────────────────────────────────────────────────
// the shell: a tube coiled in the y-z plane (its eye toward the back, its mouth at the front of its foot), growing as it coils; its growth lines glow nectar pink
function _sdShell(m, o) {
  const N = 120, RG = 22, k = Math.log(o.Rend / o.R0) / o.turns, pos = new Float32Array(N * RG * 3), col = new Float32Array(N * RG * 3), idx = [];
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < RG; j++) { const a = i * RG + j, b2 = i * RG + (j + 1) % RG, c = (i + 1) * RG + j, d = (i + 1) * RG + (j + 1) % RG; idx.push(a, c, b2, b2, c, d); }
  const C = V(0, o.shellY, o.shellZ), P = V(0, 0, 0), Q = V(0, 0, 0), tg = V(0, 0, 0), nr = V(0, 0, 0), X = V(1, 0, 0);
  const at = (th, out) => { const R = o.R0 * Math.exp(k * th), psi = o.psiA + (o.turns - th); return out.set(0, C.y + R * Math.sin(psi), C.z + R * Math.cos(psi)); };
  for (let i = 0; i < N; i++) {
    const th = o.turns * i / (N - 1), R = o.R0 * Math.exp(k * th), r = o.fill * R;
    at(th, P); at(Math.min(o.turns, th + 0.01), Q); tg.copy(Q).sub(at(Math.max(0, th - 0.01), Q)).normalize(); nr.copy(tg).cross(X).normalize();   // (a steady frame: x across the coil)
    const line = (th / o.lineEvery) % 1, glow = (line < 0.07 || line > 0.97) && th > 0.6 ? 0.85 : 0;
    for (let j = 0; j < RG; j++) { const a = j / RG * TAU, cx = Math.cos(a) * r * o.wide, cy = Math.sin(a) * r, q = (i * RG + j) * 3;
      pos[q] = X.x * cx + nr.x * cy + P.x; pos[q + 1] = X.y * cx + nr.y * cy + P.y; pos[q + 2] = X.z * cx + nr.z * cy + P.z;
      col[q] = m.pink.r * glow; col[q + 1] = m.pink.g * glow; col[q + 2] = m.pink.b * glow; }
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new T.MeshStandardMaterial({ color: _sdSkin.color, vertexColors: true, metalness: 0.25, roughness: 0.3, emissive: 0xffffff, toneMapped: false, side: T.DoubleSide }); mat.envMapIntensity = 0.5;
  mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '').replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;'); };   // (the vertex colour is its glow only: black shell, pink lines)
  return new T.Mesh(geo, mat);
}
function _sundewSnail(o) {
  const m = _sdMats(), g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  // THE FOOT: long, low and flat along z, its edge a frill of rounded lobes rippling back as it glides
  const NFT = 20, foot = _taper32(b, _sdSkin, NFT, 14), fpts = Array.from({ length: NFT }, (_, i) => V(0, o.footY, o.footZ0 + (o.footZ1 - o.footZ0) * i / (NFT - 1)));
  foot.set(fpts, 0, 0, u => o.footR * Math.pow(Math.sin(PI * (0.06 + 0.88 * u)), 0.45), o.footFx, o.footFy);
  const lobes = Array.from({ length: o.lobes }, (_, k) => { const a = k / o.lobes * TAU, l = new T.Mesh(new T.SphereGeometry(1, 14, 8), _sdSkin);
    l.position.set(Math.sin(a) * o.frillX, 0.015, o.frillZc + Math.cos(a) * o.frillZ); l.scale.set(0.045, 0.014, 0.05); b.add(l); return l; });   // (black as the foot: its edge frilled)
  // THE SHELL, on the back of the foot
  const shell = _sdShell(m, o); b.add(shell);
  // THE NECK: an S from the front of the foot up to the flower; THE FLOWER; THE BLADE-LEAF, from the flower, forward and down, its lower edge a sawtooth
  const NN = 18, neck = _taper32(b, _sdSkin, NN, 12), npts = Array.from({ length: NN }, () => V(0, 0, 0));
  const flower = _sdFlower(m, o.flowerR); b.add(flower);
  const bladeP = G(); b.add(bladeP); const blade = _sdBlade(m, o.bladeL, o.bladeW, o.teeth, false, o.bend); blade.position.z = 0.02; bladeP.add(blade);
  const N0 = V(0, o.neckY0, o.neckZ0), C1 = V(0, 0, 0), C2 = V(0, 0, 0), TOP = V(0, 0, 0);
  const Ls = new T.PointLight(0xffffff, 0.5, 0.8, 2); Ls.color.copy(m.pink); Ls.position.set(0.12, o.shellY, o.shellZ); b.add(Ls); LIGHTS.push(Ls);
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, pr = _prog31(t, act), rear = _sdS(0, 0.3, pr) * (1 - _sdS(0.34, 0.5, pr)), strike = _sdS(0.34, 0.5, pr) * (1 - _sdS(0.62, 1, pr)), calm = 1 - 0.7 * Math.min(1, act || 0);
    lobes.forEach((l, k) => { const w = Math.sin(2 * ph + k * 0.9); l.position.y = 0.015 + 0.005 * w * calm; l.scale.y = 0.012 * (1 + 0.25 * w * calm); });
    shell.position.y = 0.006 * Math.sin(2 * ph); shell.rotation.x = 0.015 * Math.sin(2 * ph + 0.5);
    Ls.intensity = 0.5 * (0.85 + 0.15 * Math.sin(2 * ph)) * (1 + 0.8 * strike);
    TOP.set(0.03 * Math.sin(ph) * calm, o.topY + 0.015 * Math.sin(2 * ph) + 0.05 * rear - 0.1 * strike, o.topZ - 0.1 * rear + 0.13 * strike);
    C1.set(0, N0.y + 0.22, N0.z + 0.17); C2.set(0.018 * Math.sin(ph - 0.8) * calm, TOP.y - 0.2, TOP.z - 0.26 + 0.08 * strike);
    neck.set(_sdBez(npts, N0, C1, C2, TOP), 0, 0, u => o.neckR0 + (o.neckR1 - o.neckR0) * u, 1, 1);
    flower.position.copy(TOP); flower.rotation.set(-0.25 + 0.4 * rear - 0.3 * strike, 0.12 * Math.sin(ph) * calm, 0);
    bladeP.position.copy(TOP); bladeP.rotation.set(o.droop + 0.05 * Math.sin(ph + 1) - 1.1 * rear + 1.0 * strike, 0.08 * Math.sin(ph + 0.6) * calm, 0);
  } };
}
const _sdB = {
  S: 1, coreY: 0.28,
  footY: 0.075, footZ0: -0.36, footZ1: 0.3, footR: 0.08, footFx: 1.55, footFy: 1,
  lobes: 26, frillX: 0.115, frillZ: 0.35, frillZc: -0.03,
  shellY: 0.33, shellZ: -0.12, R0: 0.035, Rend: 0.185, turns: 2.2 * PI, psiA: -60 * PI / 180, fill: 0.72, wide: 1.15, lineEvery: PI / 4,
  neckY0: 0.1, neckZ0: 0.22, neckR0: 0.05, neckR1: 0.022, topY: 0.7, topZ: 0.38,
  flowerR: 0.075, bladeL: 0.42, bladeW: 0.1, teeth: 6, bend: 0.04, droop: 0.55,
};
fx(907, "SUNDEW draft B, from the snail on the owner's page: a black spiral shell, its growth lines glowing nectar pink, on a frilled foot; a long S-curved neck to a four-petal pink flower, and from the flower a long blade-leaf, its lower edge a sawtooth.", () => _sundewSnail(_sdB));
