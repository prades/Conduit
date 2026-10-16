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
  const R = o.R, sy = o.sy, mAng = o.mouth, md = [0, 0.22, 1];
  const dome = _facetDome(R, sy, md, mAng, o.shade, o.seed || 3); b.add(dome);
  // the cave: the inside of a slightly smaller dome, a dark glow
  const cave = new T.Mesh(new T.IcosahedronGeometry(R * 0.93, 2), new T.MeshBasicMaterial({ color: new T.Color(EL.color).multiplyScalar(0.07), side: T.BackSide })); cave.scale.y = sy; b.add(cave);
  const floorGlow = new T.Mesh(new T.CircleGeometry(R * 0.7, 10), new T.MeshBasicMaterial({ color: new T.Color(EL.color).multiplyScalar(0.07) })); floorGlow.rotation.x = -PI / 2; floorGlow.position.set(0, 0.02, R * 0.25); b.add(floorGlow);
  for (let i = 0; i < 3; i++) { const sp = hexCrystal(0.05, 0.14 + 0.06 * i, 0.12, M.crystal); sp.position.set((i - 1) * 0.22, 0.1, R * 0.45 + 0.05 * i); sp.rotation.set(0.15 * (i - 1), 0, 0.2 * (i - 1)); b.add(sp); }
  // the fangs hang from the upper lip; casting, they swing forward and down
  const a = R * Math.sin(mAng), lipY = R * sy * 0.28 + a * 0.92, lipZ = R * 0.9;
  const jaw = G(); jaw.position.set(0, lipY, lipZ - 0.1); b.add(jaw);
  const fangs = []; for (const s of [-1, 1]) { const f = hexCrystal(o.fang, 0.1, o.fangH, M.crystal); f.position.set(s * a * 0.5, -(0.1 + o.fangH * 1.7) / 2 + 0.07, 0.05); f.rotation.z = PI + s * 0.18; jaw.add(f); fangs.push(f); }   // point down, a little inward
  const rub = _iceRubble(R, o.rubble || 12, o.seed || 3, o.rubbleColour); b.add(rub);
  const L = new T.PointLight(0xffffff, 0.5, 3.5, 2); L.color.set(EL.color); L.position.set(0, 0.5, R * 0.5); b.add(L); LIGHTS.push(L);
  return { g, core: 0.5 * (o.S || 1), update(t, act) { const ac = act || 0;
    dome.scale.y = 1 + 0.015 * Math.sin(1.6 * t) - 0.04 * ac; jaw.rotation.x = -0.6 * ac; L.intensity = 0.5 + 0.2 * Math.sin(1.6 * t) + 0.5 * ac; } };
}
// shade(cy, edge): cy = height up the dome (0..1), edge = how far past the mouth's rim this face is (radians).
const _hexc = h => [((h >> 16) & 255) / 255, ((h >> 8) & 255) / 255, (h & 255) / 255];
fx(145, "Ice maw, dark shell, frost rim.", () => { const dark = _hexc(0x010204), frost = _hexc(0x0e1830), top = _hexc(0x050a16);
  return _iceMaw({ R: 0.95, sy: 1.0, mouth: 0.66, fang: 0.15, fangH: 0.42, seed: 3, rubble: 12, rubbleColour: 0x060a14,
    shade: (cy, e) => e < 0.3 ? frost : cy > 0.7 ? top : dark }); });
fx(146, "Ice maw, pale frost shell.", () => { const pale = _hexc(0x0e1830), pale2 = _hexc(0x16223e);
  return _iceMaw({ R: 0.95, sy: 1.0, mouth: 0.66, fang: 0.15, fangH: 0.42, seed: 5, rubble: 14, rubbleColour: 0x0c1428,
    shade: (cy, e) => e < 0.3 ? pale2 : pale }); });
fx(147, "Ice maw, dark below, frosted on top.", () => { const dark = _hexc(0x010204), mid = _hexc(0x060c1a), snow = _hexc(0x101c36);
  return _iceMaw({ R: 0.95, sy: 1.02, mouth: 0.7, fang: 0.16, fangH: 0.46, seed: 7, rubble: 12, rubbleColour: 0x060c1a,
    shade: (cy, e) => cy > 0.62 ? snow : cy > 0.32 ? mid : dark }); });
