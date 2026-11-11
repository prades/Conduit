// ── THE ICE MAW · Nos. 145–147 ────────────────────────────────────────────
// From a mock-up: a faceted dome of snow with a cave for a mouth, two ice fangs hanging from its upper lip, and
// rubble round its base. Restyled for the game: flat-shaded low-poly facets, dark mechanical shell, the six-sided
// crystal as the fangs, a glowing mouth, the rubble lying on the floor (tagged ground, so the game paints it
// under every unit).
function _facetDome(R, sy, mouthDir, mouthAng, shade, seed) {   // an icosphere dome with the mouth's faces left out; shade(cy, edge) -> a colour
  const src = new T.IcosahedronGeometry(R, 2).attributes.position.array, pos = [], col = [];
  const md = new T.Vector3(mouthDir[0], mouthDir[1], mouthDir[2]).normalize(), c = new T.Vector3(), a = new T.Vector3(), b = new T.Vector3(), d = new T.Vector3();
  for (let i = 0; i < src.length; i += 9) {
    a.set(src[i], src[i + 1], src[i + 2]); b.set(src[i + 3], src[i + 4], src[i + 5]); d.set(src[i + 6], src[i + 7], src[i + 8]);
    c.copy(a).add(b).add(d).multiplyScalar(1 / 3); const ch = c.clone().normalize();
    if (c.y < -0.02 * R) continue;                                  // a dome, not a ball
    const ang = Math.acos(Math.max(-1, Math.min(1, ch.dot(md))));
    if (ang < mouthAng) continue;                                   // the mouth
    const jit = 0.9 + 0.2 * _hz(Math.round(c.x * 60) + seed, Math.round(c.y * 60), Math.round(c.z * 60)), cc = shade(c.y / R, ang - mouthAng);
    for (const v of [a, b, d]) { const n = 1 + (_hz(Math.round(v.x * 70) + seed, Math.round(v.y * 70), Math.round(v.z * 70)) - 0.5) * 0.12; pos.push(v.x * n, Math.max(0, v.y) * sy * n, v.z * n); col.push(cc[0] * jit, cc[1] * jit, cc[2] * jit); }
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const m = new T.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0.0 }); m.envMapIntensity = 0.2;   // (the environment's bright panels would wash a pale shell out)
  return new T.Mesh(geo, m);
}
function _iceRubble(R, n, seed, colour) {   // chunks round the base: tagged ground
  const g = G(); g.userData.ground = true;
  const mat = new T.MeshStandardMaterial({ color: colour, flatShading: true, roughness: 0.95, metalness: 0.0 }); mat.envMapIntensity = 0.2;
  for (let i = 0; i < n; i++) { const a = i * TAU / n + (_hz(i, seed, 1) - 0.5) * 0.6, r = R * (1.0 + 0.32 * _hz(i, seed, 2)), s = 0.1 + 0.2 * _hz(i, seed, 3);
    const m = new T.Mesh(new T.IcosahedronGeometry(1, 0), mat); m.scale.set(s * 1.3, s * 0.38, s); m.position.set(Math.sin(a) * r, s * 0.2, Math.cos(a) * r); m.rotation.y = _hz(i, seed, 4) * 3; g.add(m); }
  return g;
}
function _iceMaw(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const bodyG = o.lunge ? G() : b; if (o.lunge) b.add(bodyG);   // (o.lunge, No. 934: the body (all but the rubble on the floor) moves as a whole)
  const R = o.R, sy = o.sy, mAng = o.mouth, md = o.md || [0, 0.22, 1];
  const dome = _facetDome(R, sy, md, mAng, o.shade, o.seed || 3); bodyG.add(dome);
  // the cave: the inside of a slightly smaller dome, a dark glow
  const cave = new T.Mesh(new T.IcosahedronGeometry(R * 0.93, 2), new T.MeshBasicMaterial({ color: new T.Color(EL.color).multiplyScalar(0.07), side: T.BackSide })); cave.scale.y = sy; bodyG.add(cave);
  const floorGlow = new T.Mesh(new T.CircleGeometry(R * 0.7, 10), new T.MeshBasicMaterial({ color: new T.Color(EL.color).multiplyScalar(0.07) })); floorGlow.rotation.x = -PI / 2; floorGlow.position.set(0, 0.02, R * 0.25); bodyG.add(floorGlow);
  // the fangs hang INSIDE the mouth, from its ceiling; casting, they swing forward and down
  const a = R * Math.sin(mAng), lipY = R * sy * 0.28 + a * 0.92, lipZ = R * 0.9;
  const jaw = G(); jaw.position.set(0, lipY - 0.08, R * 0.34); bodyG.add(jaw);   // inside the cave, hanging from the ceiling of the mouth
  const fangs = []; for (const s of [-1, 1]) { const f = hexCrystal(o.fang, 0.1, o.fangH, M.crystal); f.position.set(s * a * (o.fSp || 0.62), -(0.1 + o.fangH * 1.7) / 2 + 0.07, 0.05); f.rotation.z = PI + s * (o.fTilt == null ? 0.18 : o.fTilt); jaw.add(f); fangs.push(f); }   // point down, a little inward
  const rub = _iceRubble(R, o.rubble || 12, o.seed || 3, o.rubbleColour); b.add(rub);
  const L = new T.PointLight(0xffffff, 0.5, 3.5, 2); L.color.set(EL.color); L.position.set(0, 0.5, R * 0.5); bodyG.add(L); LIGHTS.push(L);
  return { g, core: 0.5 * (o.S || 1), update(t, act) { const ac = act || 0;
    dome.scale.y = 1 + 0.015 * Math.sin(1.6 * t) - 0.04 * ac; jaw.rotation.x = -(o.swing || 0.6) * ac; L.intensity = 0.5 + 0.2 * Math.sin(1.6 * t) + 0.5 * ac;
    if (o.lunge) { bodyG.position.z = o.lunge * ac; bodyG.rotation.x = 0.2 * ac; bodyG.position.y = -0.04 * ac; } } };
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

// ── THE FROST MAW'S ATTACKS · Nos. 934 and 935 (draft, 2026-11-11) ───────────────────────────────────────────────────────────────────────────────
// The owner, 2026-11-11, of the Frost Maw (picked from the agent's three ideas for each): "Lunge-bite for the hit, giant jaws for CHOMP".
// 934 THE LUNGE-BITE: No. 156 (the Maw as it is) whose action frames throw the whole body forward, leaning into it, with the fangs swinging down hard, and bring it back (the rubble stays on the floor). Looks only.
//   Bake it in place of the Maw: node design/evolutions/bake.js <three> img/evo maw   (job 'maw', form 934), then node design/evolutions/crop_sheets.js
fx(934, "The FROST MAW's lunge-bite: No. 156 throws its body forward, fangs swinging down, and back.", () => _iceMaw({ S: 1.15, R: 0.95, sy: 0.9, mouth: 0.68, fang: 0.14, fangH: 0.4, seed: 41, rubble: 9, rubbleColour: 0x0b1630, lunge: 0.8, swing: 1.0, shade: (cy, e) => e < 0.3 ? _pl3 : cy > 0.55 ? _mid2 : _mid }));
// 935 THE GIANT JAWS (CHOMP): a pair of ice jaws as wide as two tiles, dropped over the enemy from above and snapped shut. Each is a horseshoe of dark slate with a row of crystal fangs; they are hinged at the back
// (away from the camera), the upper jaw swinging down onto the lower one. update(t, act, v), v = { y, open, q, fl }: y how high the whole jaws hang above the floor, open how far the upper jaw is raised (1 wide, 0 shut),
// q how whole they are (1; less than 1 they break into pieces and fade), fl a white-blue flash at the bite. Baked in the blocks of job 'maw_jaws' (16 frames, one row: they have no facing).
//   node design/evolutions/bake.js <three> img/evo mawjaws 256 3.0222   then node design/evolutions/crop_sheets.js
function _mawJaw(up, mat) {   // one jaw: a horseshoe band of slate, open at the hinge's side (-z), with a row of crystal fangs along its rim, pointing down (up: false) or up (up: true)
  const g = G(), N = 17, R = 1.25, PM = PI * 0.72;
  const bandM = new T.MeshStandardMaterial({ color: 0x0b1630, roughness: 0.9, metalness: 0.05, flatShading: true });
  for (let i = 0; i < N; i++) {
    const a = -PM + i * (2 * PM) / (N - 1), x = Math.sin(a) * R, z = Math.cos(a) * R;
    const blk = new T.Mesh(new T.BoxGeometry(0.42, 0.34, 0.3), bandM); blk.position.set(x, 0, z); blk.rotation.y = a; g.add(blk);
    const big = i % 2 === 0, f = hexCrystal(big ? 0.17 : 0.11, 0.09, big ? 0.85 : 0.5, mat); f.position.set(x, (up ? -1 : 1) * (big ? 0.5 : 0.36), z); if (up) f.rotation.z = PI; g.add(f);
  }
  return { g };
}
fx(935, "The FROST MAW's CHOMP: giant ice jaws dropped over the enemy and snapped shut.", () => {
  const g = G(), jaws = G(); g.add(jaws); jaws.rotation.y = -PI / 4;   // (its front, +z, towards the camera: the bake turns row 0 by a quarter turn, so a quarter turn back, then the eighth that faces the camera)
  const mat = new T.MeshStandardMaterial({ color: 0xbfeaff, emissive: 0x7fd6ff, emissiveIntensity: 0.55, roughness: 0.12, metalness: 0.1, flatShading: true });
  const lo = _mawJaw(false, mat), hi = _mawJaw(true, mat);   // (the lower jaw's fangs point up, the upper's hang down)
  const lower = G(), upper = G(), hinge = G(); lower.add(lo.g); upper.add(hi.g);
  hinge.position.set(0, 0.05, -1.0); hinge.add(upper); upper.position.set(0, 0.0, 1.0);   // (the upper jaw turns about the hinge at the back)
  jaws.add(lower); jaws.add(hinge);
  lower.position.y = 0.45;
  const flash = new T.Mesh(new T.SphereGeometry(1.0, 14, 10), new T.MeshBasicMaterial({ color: 0xcff4ff, transparent: true, opacity: 0, depthWrite: false, toneMapped: false })); flash.scale.set(1.5, 0.5, 1.5); flash.position.y = 0.45; jaws.add(flash);
  const shards = []; for (let i = 0; i < 12; i++) { const m = new T.Mesh(new T.OctahedronGeometry(0.12 + (i % 3) * 0.04), mat); m.visible = false; jaws.add(m); shards.push(m); }
  return { g, core: 0.8, update(t, act, v) { v = v || { y: 0, open: 0, q: 1, fl: 0 };
    const y = v.y || 0, q = v.q == null ? 1 : v.q, br = 1 - q;
    jaws.position.y = y; hinge.rotation.x = -(v.open || 0) * 1.15; hinge.position.y = 0.05 + 0.0;   // (negative: the front of the upper jaw goes up)
    jaws.scale.setScalar(1 + br * 0.08);
    const sc = Math.max(0.001, q); lower.scale.setScalar(sc); upper.scale.setScalar(sc); lower.position.y = 0.45 - br * 0.25; upper.position.y = -br * 0.1;
    flash.material.opacity = Math.max(0, v.fl || 0) * 0.22; flash.scale.set(1.5 + (v.fl || 0), 0.5, 1.5 + (v.fl || 0));
    shards.forEach((m, i) => { m.visible = br > 0.05; const a = i / shards.length * TAU; m.position.set(Math.cos(a) * (0.7 + br * 1.3), 0.5 + (i % 3) * 0.3 + br * 0.5, Math.sin(a) * (0.7 + br * 1.3)); m.rotation.set(br * (3 + i), br * 4, 0); m.scale.setScalar(Math.max(0.01, 1 - br * 0.6)); }); } };
});
