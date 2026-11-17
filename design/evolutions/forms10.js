// ── THE ICE MAW · Nos. 145–147 ────────────────────────────────────────────
// From a mock-up: a faceted dome of snow with a cave for a mouth, two ice fangs hanging from its upper lip, and
// rubble round its base. Restyled for the game: flat-shaded low-poly facets, dark mechanical shell, the six-sided
// crystal as the fangs, a glowing mouth, the rubble lying on the floor (tagged ground, so the game paints it
// under every unit).
function _facetDome(R, sy, mouthDir, mouthAng, shade, seed, detail, grain) {   // an icosphere dome with the mouth's faces left out; shade(cy, edge) -> a colour (detail: how finely it is cut, 2; grain: how much each face's lightness varies, 0.2: No. 934's powder)
  const src = new T.IcosahedronGeometry(R, detail || 2).attributes.position.array, pos = [], col = [];
  const md = new T.Vector3(mouthDir[0], mouthDir[1], mouthDir[2]).normalize(), c = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3(), d = new T.Vector3();
  for (let i = 0; i < src.length; i += 9) {
    a.set(src[i], src[i + 1], src[i + 2]); b.set(src[i + 3], src[i + 4], src[i + 5]); d.set(src[i + 6], src[i + 7], src[i + 8]);
    c.copy(a).add(b).add(d).multiplyScalar(1 / 3); const ch = c.clone().normalize();
    if (c.y < -0.02 * R) continue;                                  // a dome, not a ball
    const ang = Math.acos(Math.max(-1, Math.min(1, ch.dot(md))));
    if (ang < mouthAng) continue;                                   // the mouth
    const jit = 1 - (grain || 0.2) / 2 + (grain || 0.2) * _hz(Math.round(c.x * 60) + seed, Math.round(c.y * 60), Math.round(c.z * 60)), cc = shade(c.y / R, ang - mouthAng);
    for (const v of [a, b, d]) { const n = 1 + (_hz(Math.round(v.x * 70) + seed, Math.round(v.y * 70), Math.round(v.z * 70)) - 0.5) * 0.12; pos.push(v.x * n, Math.max(0, v.y) * sy * n, v.z * n); col.push(cc[0] * jit, cc[1] * jit, cc[2] * jit); }
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0.0 }); m.envMapIntensity = 0.2;   // (the environment's bright panels would wash a pale shell out)
  return new T.Mesh(geo, m);
}
// POWDER SNOW (No. 947, a draft for the owner, 2026-11-17: "He's supposed to have two icicles fangs and their within his Pac-Man looking body but it's made of powdered snow ... but instead right now it looks
// like it's a crystaline looking icy exterior"; of the first draft (smooth, round-mouthed, icicle fangs): "No, I like his old teeth and the powder material needs more of a snowy texture"). The same dome and the
// same mouth as No. 934 (cut on the same faces, so its jagged teeth are the same), each face split finely and rounded so it reads soft, with a snow texture over it: a grainy, sparkling surface (a colour map
// and a bump map painted once, wrapped round the dome) instead of flat facets of different brightness.
function _vn3(x, y, z, sd) {   // smooth 3-D value noise, 0..1 (a lattice of _hz, blended)
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z), tx = x - xi, ty = y - yi, tz = z - zi, s = t => t * t * (3 - 2 * t), u = s(tx), v = s(ty), w = s(tz), h = (i, j, k) => _hz(i + sd * 131, j + sd * 17, k);
  const L = (a, b, t) => a + (b - a) * t;
  return L(L(L(h(xi, yi, zi), h(xi + 1, yi, zi), u), L(h(xi, yi + 1, zi), h(xi + 1, yi + 1, zi), u), v), L(L(h(xi, yi, zi + 1), h(xi + 1, yi, zi + 1), u), L(h(xi, yi + 1, zi + 1), h(xi + 1, yi + 1, zi + 1), u), v), w);
}
function _powderDome(R, sy, mouthDir, mouthAng, seed, cols, detail, sub) {
  const src = new T.IcosahedronGeometry(1, detail || 3).attributes.position.array, pos = [], col = [], N = sub || 8;
  const md = new T.Vector3(mouthDir[0], mouthDir[1], mouthDir[2]).normalize(), lo = new T.Color(cols[0]), hi = new T.Color(cols[1]), lip = new T.Color(cols[2]), hollow = new T.Color(cols[3] || 0x8fa6c8), k = new T.Color();
  // THE SNOW: soft clumps over the dome, smaller lumps on them and a fine crust; the hollows between them faintly blue, the odd grain bright (a sparkle). It is in the shape, not a picture laid on it, so it has no seam.
  const snow = v => { const c1 = _vn3(v.x * 5 + 7, v.y * 5, v.z * 5, seed) - 0.5, c2 = _vn3(v.x * 13, v.y * 13 + 3, v.z * 13, seed + 1) - 0.5, c3 = _vn3(v.x * 31, v.y * 31, v.z * 31 + 5, seed + 2) - 0.5;
    return { d: 0.065 * c1 + 0.035 * c2 + 0.014 * c3, hol: Math.max(0, -(c1 * 0.6 + c2 + c3 * 0.6)), spark: _hz(Math.round(v.x * 90) + seed, Math.round(v.y * 90), Math.round(v.z * 90)) > 0.985 }; };
  const a = new T.Vector3(), b = new T.Vector3(), d = new T.Vector3(), c = new T.Vector3();
  const put = (v, edge) => { const S = snow(v), n = 1 + S.d, y = Math.max(0, v.y);
    pos.push(v.x * R * n, y * R * sy * n, v.z * R * n);
    k.copy(lo).lerp(hi, Math.min(1, Math.pow(y, 0.8) * 1.15)); if (edge < 0.3) k.lerp(lip, 1 - Math.max(0, edge) / 0.3);
    k.lerp(hollow, Math.min(0.8, S.hol * 2.2)); if (S.spark) k.setRGB(1, 1, 1); col.push(k.r, k.g, k.b); };
  for (let i = 0; i < src.length; i += 9) {
    a.set(src[i], src[i + 1], src[i + 2]); b.set(src[i + 3], src[i + 4], src[i + 5]); d.set(src[i + 6], src[i + 7], src[i + 8]);
    c.copy(a).add(b).add(d).multiplyScalar(1 / 3); const ch = c.clone().normalize();
    if (c.y < -0.02) continue;                                        // a dome, not a ball (as No. 934)
    const fa = Math.acos(Math.max(-1, Math.min(1, ch.dot(md))));
    if (fa < mouthAng) continue;                                      // the mouth: the same faces left out as No. 934, so its teeth are the same
    const edge = fa - mouthAng, P = (i2, j2) => a.clone().multiplyScalar(1 - (i2 + j2) / N).add(b.clone().multiplyScalar(i2 / N)).add(d.clone().multiplyScalar(j2 / N)).normalize();
    for (let i2 = 0; i2 < N; i2++) for (let j2 = 0; j2 < N - i2; j2++) {   // (the face split into little faces on the sphere, so the snow's lumps have room)
      for (const q of [P(i2, j2), P(i2 + 1, j2), P(i2, j2 + 1)]) put(q, edge);
      if (j2 < N - i2 - 1) for (const q of [P(i2 + 1, j2), P(i2 + 1, j2 + 1), P(i2, j2 + 1)]) put(q, edge); }
  }
  // smooth normals: each corner the average of the faces that meet at that point (the little faces are separate, so they are joined by their position)
  const nor = new Float32Array(pos.length), acc = new Map(), key = j => Math.round(pos[j] * 4000) + ',' + Math.round(pos[j + 1] * 4000) + ',' + Math.round(pos[j + 2] * 4000), e1 = new T.Vector3(), e2 = new T.Vector3();
  for (let j = 0; j < pos.length; j += 9) { e1.set(pos[j + 3] - pos[j], pos[j + 4] - pos[j + 1], pos[j + 5] - pos[j + 2]); e2.set(pos[j + 6] - pos[j], pos[j + 7] - pos[j + 1], pos[j + 8] - pos[j + 2]); const fn = e1.clone().cross(e2);
    for (let m = 0; m < 9; m += 3) { const kk = key(j + m), cur = acc.get(kk); if (cur) cur.add(fn); else acc.set(kk, fn.clone()); } }
  for (let j = 0; j < pos.length; j += 3) { const v = acc.get(key(j)).clone().normalize(); nor[j] = v.x; nor[j + 1] = v.y; nor[j + 2] = v.z; }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.BufferAttribute(nor, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
  const m = new T.MeshStandardMaterial({ vertexColors: true, flatShading: false, roughness: 1, metalness: 0, side: T.DoubleSide }); m.envMapIntensity = 0.1;
  return new T.Mesh(geo, m);
}
// AN ICICLE (No. 947's fangs): a long tapering spike of clear pale ice, its base at y = 0 and its point at -h, ridged a little where it dripped as it froze; glossy, faintly lit from within
function _icicle(r, h, seed) {
  const geo = new T.CylinderGeometry(r, 0.004, h, 10, 8), q = geo.attributes.position;
  for (let v = 0; v < q.count; v++) { const y = q.getY(v), u = 0.5 - y / h, rr = 1 + 0.13 * Math.sin(u * 19 + seed) * (1 - u) + 0.05 * Math.sin(Math.atan2(q.getZ(v), q.getX(v)) * 3 + seed); q.setX(v, q.getX(v) * rr); q.setZ(v, q.getZ(v) * rr); }
  geo.translate(0, -h / 2, 0); geo.computeVertexNormals();
  const m = new T.MeshStandardMaterial({ color: new T.Color(0xd8f4ff), emissive: new T.Color(0x5fb8e8), emissiveIntensity: 0.28, roughness: 0.08, metalness: 0.05, transparent: true, opacity: 0.92 }); m.envMapIntensity = 0.9;
  return new T.Mesh(geo, m);
}
function _iceRubble(R, n, seed, colour, soft) {   // chunks round the base: tagged ground (soft, No. 947: clumps of snow, not cut ice)
  const g = G(); g.userData.ground = true;
  const mat = new T.MeshStandardMaterial({ color: colour, flatShading: !soft, roughness: 0.95, metalness: 0.0 }); mat.envMapIntensity = 0.2;
  for (let i = 0; i < n; i++) { const a = i * TAU / n + (_hz(i, seed, 1) - 0.5) * 0.6, r = R * (1.0 + 0.32 * _hz(i, seed, 2)), s = 0.1 + 0.2 * _hz(i, seed, 3);
    const m = new T.Mesh(new T.IcosahedronGeometry(1, soft ? 2 : 0), mat); m.scale.set(s * 1.3, s * 0.38, s); m.position.set(Math.sin(a) * r, s * 0.2, Math.cos(a) * r); m.rotation.y = _hz(i, seed, 4) * 3; g.add(m); }
  return g;
}
function _iceMaw(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const bodyG = o.lunge ? G() : b; if (o.lunge) b.add(bodyG);   // (o.lunge, No. 934: the body (all but the rubble on the floor) moves as a whole)
  const R = o.R, sy = o.sy, mAng = o.mouth, md = o.md || [0, 0.22, 1];
  const dome = o.powder ? _powderDome(R, sy, md, mAng, o.seed || 3, o.powder, o.detail || 3, 8) : _facetDome(R, sy, md, mAng, o.shade, o.seed || 3, o.detail, o.grain); bodyG.add(dome);   // (o.powder, No. 947: smooth powder snow)
  // the cave: the inside of a slightly smaller dome, a dark glow
  const cave = new T.Mesh(new T.IcosahedronGeometry(R * 0.93, 2), new T.MeshBasicMaterial({ color: o.cave != null ? new T.Color(o.cave) : new T.Color(EL.color).multiplyScalar(0.07), side: T.BackSide })); cave.scale.y = sy; bodyG.add(cave);
  const floorGlow = new T.Mesh(new T.CircleGeometry(R * 0.7, 10), new T.MeshBasicMaterial({ color: o.caveFloor != null ? new T.Color(o.caveFloor) : new T.Color(EL.color).multiplyScalar(0.07) })); floorGlow.rotation.x = -PI / 2; floorGlow.position.set(0, 0.02, R * 0.25); bodyG.add(floorGlow);
  // the fangs hang INSIDE the mouth, from its ceiling; casting, they swing forward and down
  const a = R * Math.sin(mAng), lipY = R * sy * 0.28 + a * 0.92, lipZ = R * 0.9;
  const jaw = G(); jaw.position.set(0, lipY - 0.08, R * 0.34); bodyG.add(jaw);   // inside the cave, hanging from the ceiling of the mouth
  const fangs = []; for (const s of [-1, 1]) { if (o.icicle) { const f = _icicle(o.icicle[0], o.icicle[1], s + 2); f.position.set(s * a * (o.fSp || 0.62), 0.0, 0.14); f.rotation.z = s * (o.fTilt == null ? 0.12 : o.fTilt); jaw.add(f); fangs.push(f); continue; }   // (o.icicle, No. 947: [radius, length]: an icicle hanging from the mouth's ceiling)
    const f = hexCrystal(o.fang, 0.1, o.fangH, M.crystal); f.position.set(s * a * (o.fSp || 0.62), -(0.1 + o.fangH * 1.7) / 2 + 0.07, 0.05); f.rotation.z = PI + s * (o.fTilt == null ? 0.18 : o.fTilt); jaw.add(f); fangs.push(f); }   // point down, a little inward
  const rub = _iceRubble(R, o.rubble || 12, o.seed || 3, o.rubbleColour, o.powder); b.add(rub);
  if (o.snow) {   // (No. 934) a drift of powder heaped round its foot, in front of the body's layer and not moving with it: it sits sunk into the floor. Soft lumps, a little taller at the back.
    const sm = new T.MeshStandardMaterial({ color: o.snow, roughness: 1, metalness: 0, flatShading: !o.powder }); sm.envMapIntensity = 0.25;
    for (let i = 0; i < 26; i++) { const a = i * TAU / 26 + (_hz(i, o.seed || 3, 7) - 0.5) * 0.25, r = R * (0.98 + 0.14 * _hz(i, o.seed || 3, 8)), sz = 0.11 + 0.09 * _hz(i, o.seed || 3, 9);
      const m = new T.Mesh(new T.IcosahedronGeometry(1, o.powder ? 3 : 1), sm); m.scale.set(sz * 1.5, sz * (Math.cos(a) < 0 ? 0.7 : 0.4), sz * 1.2); m.position.set(Math.sin(a) * r, sz * 0.2, Math.cos(a) * r); m.rotation.y = _hz(i, 5, 6) * 3; b.add(m); } }
  const L = new T.PointLight(0xffffff, 0.5, 3.5, 2); L.color.set(EL.color); L.position.set(0, 0.5, R * 0.5); bodyG.add(L); LIGHTS.push(L);
  return { g, core: 0.5 * (o.S || 1), update(t, act, v) { const ac = act || 0;
    dome.scale.y = 1 + 0.015 * Math.sin(1.6 * t) - 0.04 * ac; jaw.rotation.x = -(o.swing || 0.6) * ac; L.intensity = 0.5 + 0.2 * Math.sin(1.6 * t) + 0.5 * ac;
    if (o.lunge) { bodyG.position.z = o.lunge * ac; bodyG.rotation.x = 0.2 * ac; bodyG.position.y = -0.04 * ac; }
    if (v && o.lunge) {   // CHOMP (the extra blocks): v = { sw, rot, z, y, fang } the body swelling over the enemy (sw), rearing back (rot < 0) and slamming forward (rot > 0), the fangs swinging (fang)
      bodyG.scale.setScalar(1 + v.sw); bodyG.rotation.x = v.rot; bodyG.position.z = v.z; bodyG.position.y = v.y; jaw.rotation.x = -v.fang; L.intensity = 0.5 + 1.2 * Math.max(0, v.sw); } } };
}
// shade(cy, edge): cy = height up the dome (0..1), edge = how far past the mouth's rim this face is (radians).
const _hexc = h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
fx(145, "Ice maw, dark shell, frost rim.", () => { const dark = _hexc(0x010204), frost = _hexc(0x0e1830), top = _hexc(0x050a16);
  return _iceMaw({ R: 0.95, sy: 1.0, mouth: 0.66, fang: 0.14, fangH: 0.36, seed: 3, rubble: 12, rubbleColour: 0x060a14,
    shade: (cy, e) => e < 0.3 ? frost : cy > 0.7 ? top : dark }); });
fx(146, "Ice maw, pale frost shell.", () => { const pale = _hexc(0x0e1830), pale2 = _hexc(0x16223e);
  return _iceMaw({ R: 0.95, sy: 1.0, mouth: 0.66, fang: 0.14, fangH: 0.36, seed: 5, rubble: 14, rubbleColour: 0x0c1428,
    shade: (cy, e) => e < 0.3 ? pale2 : pale }); });
fx(147, "Ice maw, dark below, frosted on top.", () => { const dark = _hexc(0x010204), mid = _hexc(0x060c1a), snow = _hexc(0x101c36);
  return _iceMaw({ R: 0.95, sy: 1.02, mouth: 0.7, fang: 0.15, fangH: 0.4, seed: 7, rubble: 12, rubbleColour: 0x060c1a,
    shade: (cy, e) => cy > 0.62 ? snow : cy > 0.32 ? mid : dark }); });

// ── More like 145 and 146 (Nos. 148–157): the same maw, varied. ──
const _dk = _hexc(0x010204), _dkFrost = _hexc(0x0e1830), _dkTop = _hexc(0x050a16), _pl = _hexc(0x0e1830), _pl2 = _hexc(0x16223e), _pl3 = _hexc(0x1c2c4c), _mid = _hexc(0x070e20), _mid2 = _hexc(0x0b1630);
fx(148, "Tall pale dome, narrow mouth.", () => _iceMaw({ R: 0.9, sy: 1.25, mouth: 0.55, fang: 0.13, fangH: 0.38, seed: 11, rubble: 12, rubbleColour: 0x0c1428, shade: (cy, e) => e < 0.3 ? _pl2 : _pl }));
fx(149, "Low wide dark dome, wide mouth.", () => _iceMaw({ R: 1.0, sy: 0.78, mouth: 0.82, fang: 0.15, fangH: 0.4, seed: 13, rubble: 14, rubbleColour: 0x060a14, shade: (cy, e) => e < 0.3 ? _dkFrost : cy > 0.7 ? _dkTop : _dk }));
fx(150, "Pale dome, mouth looking up, long fangs.", () => _iceMaw({ R: 0.95, sy: 1.0, mouth: 0.66, md: [0, 0.6, 1], fang: 0.14, fangH: 0.5, seed: 17, rubble: 12, rubbleColour: 0x0c1428, shade: (cy, e) => e < 0.3 ? _pl2 : _pl }));
fx(151, "Dark dome, mouth low and open, heavy rubble.", () => _iceMaw({ R: 0.95, sy: 0.95, mouth: 0.7, md: [0, -0.05, 1], fang: 0.14, fangH: 0.38, seed: 19, rubble: 20, rubbleColour: 0x060a14, shade: (cy, e) => e < 0.3 ? _dkFrost : cy > 0.7 ? _dkTop : _dk }));
fx(152, "Pale dome, mouth turned to one side.", () => _iceMaw({ R: 0.95, sy: 0.95, mouth: 0.66, md: [-0.45, 0.2, 1], fang: 0.14, fangH: 0.4, seed: 23, rubble: 14, rubbleColour: 0x0c1428, shade: (cy, e) => e < 0.3 ? _pl3 : cy > 0.7 ? _pl3 : _pl }));
fx(153, "Dark dome, frost cap, close-set fangs.", () => _iceMaw({ R: 0.95, sy: 0.95, mouth: 0.6, fang: 0.12, fangH: 0.34, fSp: 0.4, fTilt: 0.1, seed: 29, rubble: 12, rubbleColour: 0x060c1a, shade: (cy, e) => cy > 0.62 ? _pl2 : cy > 0.32 ? _mid : _dk }));
fx(154, "Pale dome, huge mouth, short thick fangs.", () => _iceMaw({ R: 1.0, sy: 0.9, mouth: 0.9, fang: 0.2, fangH: 0.3, fSp: 0.55, seed: 31, rubble: 14, rubbleColour: 0x0c1428, shade: (cy, e) => e < 0.3 ? _pl2 : _pl }));
fx(155, "Dark dome, frost patches, wide-set tall fangs.", () => _iceMaw({ R: 0.95, sy: 1.0, mouth: 0.72, fang: 0.13, fangH: 0.5, fSp: 0.8, fTilt: 0.28, seed: 37, rubble: 12, rubbleColour: 0x060c1a, shade: (cy, e) => (e < 0.5 || (cy > 0.45 && cy < 0.6)) ? _dkFrost : _dk }));
fx(156, "Slate-blue dome, big irregular rubble.", () => _iceMaw({ S: 1.15, R: 0.95, sy: 0.9, mouth: 0.68, fang: 0.14, fangH: 0.4, seed: 41, rubble: 9, rubbleColour: 0x0b1630, shade: (cy, e) => e < 0.3 ? _pl3 : cy > 0.55 ? _mid2 : _mid }));
fx(157, "Pale dome, narrow mouth, long thin fangs.", () => _iceMaw({ R: 0.95, sy: 1.05, mouth: 0.5, fang: 0.1, fangH: 0.5, fSp: 0.55, fTilt: 0.12, seed: 43, rubble: 16, rubbleColour: 0x0c1428, shade: (cy, e) => e < 0.3 ? _pl2 : _pl }));

// ── THE FROST MAW'S ATTACKS · No. 934 (draft, 2026-11-11) ───────────────────────────────────────────────────────────────────────────────
// The owner, 2026-11-11, of the Frost Maw (picked from the agent's three ideas for each): "Lunge-bite for the hit, giant jaws for CHOMP". Then, of the first CHOMP, whose separate jaws dropped on the enemy:
// "The jaws should not pop out of the character"; asked where they should come from: "Its own mouth, bigger". So there are no separate jaws: the Maw's own body does it.
// 934: No. 156 (the Maw as it is) with
//   the action block (cols 8-15), its everyday hit: a LUNGE-BITE: the whole body thrown forward, leaning into it, the fangs swinging down hard, and back (the rubble stays on the floor);
//   the two extra blocks (cols 16-31), CHOMP: block 1 REARS UP: the body swells (to about 1.65 times) and tips back, the mouth up and wide, the fangs long; block 2 SLAMS: the swollen body drops forward over the enemy
//   (the bite is its first frame) and shrinks back to its size. Values per frame: { sw: swell, rot: lean (negative back, positive forward), z, y, fang }.
//   Bake it in place of the Maw, in a 192 px cell (the swollen body needs room; the same pixels a unit): node design/evolutions/bake.js <three> img/evo maw 192 2.2667, then node design/evolutions/crop_sheets.js
// the powder snow of No. 934 (the owner, 2026-11-11: "a powdered snow Pac-Man with teeth that's sunken into the floor": keep the design, the shape; redo the texture): pale blue-white, the lip round the mouth the brightest
const _snowTop = _hexc(0x7a8fb0), _snowMid = _hexc(0x566b8e), _snowLip = _hexc(0xa8bbd8);
fx(934, "The FROST MAW's lunge-bite and CHOMP: No. 156 as powder snow, its body thrown forward and rearing up, its short fangs staying in its mouth.", () => _iceMaw({ S: 1.15, R: 0.95, sy: 0.9, mouth: 0.68, fang: 0.1, fangH: 0.2, seed: 41, rubble: 12, rubbleColour: 0xc4d3e8, lunge: 0.8, swing: 0.2, detail: 3, grain: 0.34, snow: 0x9db0cc, cave: 0x081c30, caveFloor: 0x143a56, shade: (cy, e) => e < 0.3 ? _snowLip : cy > 0.55 ? _snowTop : _snowMid }));
fx(947, "DRAFT (2026-11-17, not approved): the FROST MAW as No. 934, its teeth and shape the same, its body powder snow (soft and grainy, sparkling) instead of cut facets.", () => _iceMaw({ S: 1.15, R: 0.95, sy: 0.9, mouth: 0.68, fang: 0.1, fangH: 0.2, seed: 41, rubble: 12, rubbleColour: 0xc4d3e8, lunge: 0.8, swing: 0.2, detail: 3, snow: 0xb4c6de, cave: 0x081c30, caveFloor: 0x143a56,
  powder: [0x6a81a6, 0xc4d2e6, 0xe2eaf6, 0x7f98c2] }));
