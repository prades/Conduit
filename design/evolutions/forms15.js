// ── THE ROCK PORCUPINE · the fire brawler, Nos. 332–341 ───────────────────
// A pitch-black matte rock that crawls on little stubby feet hidden under it, red shards growing out of it like a porcupine's quills.
const _rockBlack = new T.MeshStandardMaterial({ color: 0x000000, metalness: 0, roughness: 1, flatShading: true }); _rockBlack.envMapIntensity = 0.04;
function _redShardMat(glow) { const m = new T.MeshStandardMaterial({ color: 0x3a0000, emissive: new T.Color(0xc01000).multiplyScalar(glow == null ? 0.5 : glow), emissiveIntensity: 1, roughness: 0.6, metalness: 0.05, flatShading: true }); m.envMapIntensity = 0.3; return m; }
function _rockMesh(sx, sy, sz, lump, seed, detail) {   // a lumpy boulder with a flat-ish underside
  const geo = new T.IcosahedronGeometry(1, detail || 2), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = _hz(Math.round(x * 60) + seed, Math.round(y * 60), Math.round(z * 60)), k = 1 + (n - 0.5) * lump;
    p.setXYZ(i, x * k * sx, Math.max(y * k, -0.28) * sy, z * k * sz); }
  geo.computeVertexNormals(); return new T.Mesh(geo, _rockBlack);
}
function _quillShard(len, r, sides, mat, seed) {   // an irregular faceted shard, its base at the origin, pointing up (+y)
  const geo = new T.ConeGeometry(r, len, sides, 1), p = geo.attributes.position;
  for (let v = 0; v < p.count; v++) { const x = p.getX(v), y = p.getY(v), z = p.getZ(v), n = _hz(Math.round(x * 300) + seed, Math.round(y * 300), Math.round(z * 300)); p.setXYZ(v, x * (0.65 + 0.7 * n), y, z * (0.65 + 0.7 * (1 - n))); }
  geo.translate(0, len / 2, 0); geo.computeVertexNormals(); return new T.Mesh(geo, mat);
}
function _porcupine(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const sx = o.sx, sy = o.sy, sz = o.sz, lift = o.lift == null ? 0.08 : o.lift, cy = lift + sy * 0.3;
  const body = G(); body.position.y = cy; b.add(body);
  const rock = _rockMesh(sx, sy, sz, o.lump, o.seed); body.add(rock);
  // the hidden feet: little dark stubs under the rock's rim, mostly out of sight
  const feet = []; for (let i = 0; i < 4; i++) { const fx = (i % 2 ? -1 : 1) * sx * 0.36, fz = (i < 2 ? 1 : -1) * sz * 0.36, ft = cbox(0.14, 0.1, 0.18, 0.03, _rockBlack); ft.position.set(fx, -cy + 0.07, fz); body.add(ft); feet.push(ft); }
  const mat = _redShardMat(o.glow), UPV2 = new T.Vector3(0, 1, 0), quills = [];
  const rn = (i, k) => _hz(i * 7 + 3, o.seed + k * 13, k);
  for (let i = 0; i < o.n; i++) { const u = Math.pow(rn(i, 1), o.top || 1), phi = rn(i, 2) * TAU, up = Math.cos(u * PI * 0.5 * (o.cover || 0.95));
    // a point on the rock's upper hemisphere (angle from the top: u*cover), the front-bias pushes some toward +z
    const polar = u * PI * 0.5 * (o.cover || 0.95) + 0.05, dirN = new T.Vector3(Math.sin(polar) * Math.sin(phi), Math.cos(polar), Math.sin(polar) * Math.cos(phi));
    if (o.back) dirN.z -= o.back * (0.4 + 0.6 * rn(i, 3)); dirN.normalize();
    const pos = new T.Vector3(dirN.x * sx * 0.93, dirN.y * sy * 0.93, dirN.z * sz * 0.93), len = o.len[0] + (o.len[1] - o.len[0]) * Math.pow(rn(i, 4), o.skew || 1), r = len * (o.fat || 0.16) * (0.8 + 0.5 * rn(i, 5));
    const dir = dirN.clone().add(new T.Vector3((rn(i, 6) - 0.5) * o.spread, (rn(i, 7) - 0.3) * o.spread, (rn(i, 8) - 0.5) * o.spread)).normalize();
    const sh = _quillShard(len, r, 4 + Math.floor(rn(i, 9) * 3), mat, i); sh.position.copy(pos); sh.quaternion.setFromUnitVectors(UPV2, dir); body.add(sh); quills.push({ m: sh, q: sh.quaternion.clone(), i }); }
  if (o.cracks) for (let k = 0; k < o.cracks; k++) { const a = rn(k, 20) * TAU, polar = 0.4 + 0.8 * rn(k, 21), c = cbox(0.02, 0.28 + 0.2 * rn(k, 22), 0.02, 0.004, M.glow), d = new T.Vector3(Math.sin(polar) * Math.sin(a), Math.cos(polar), Math.sin(polar) * Math.cos(a));
    c.position.set(d.x * sx * 0.97, d.y * sy * 0.97, d.z * sz * 0.97); c.quaternion.setFromUnitVectors(UPV2, d.clone().add(new T.Vector3(0.2, 0.0, 0.1)).normalize()); body.add(c); }
  const L = new T.PointLight(0xffffff, 0.35, 3, 2); L.color.set(EL.color); L.position.set(0, cy + sy, 0.3); b.add(L); LIGHTS.push(L);
  return { g, core: (cy + sy * 0.3) * (o.S || 1), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    body.position.y = cy + 0.012 * Math.sin(ph * 2) + 0.03 * ac; body.rotation.z = 0.035 * Math.sin(ph); body.rotation.x = 0.025 * Math.sin(ph * 2 + 1) - 0.12 * ac;   // a crawling waddle; it hunches when it attacks
    const q = new T.Quaternion(), e = new T.Euler(); for (const Q of quills) { e.set(0.05 * Math.sin(ph * 2 + Q.i) * (1 + 3 * ac), 0, 0.05 * Math.sin(ph * 3 + Q.i * 1.7) * (1 + 3 * ac)); q.setFromEuler(e); Q.m.quaternion.copy(Q.q).multiply(q); Q.m.scale.y = 1 + 0.25 * ac; }
    feet.forEach((f, i) => { f.position.z = (i < 2 ? 1 : -1) * sz * 0.36 + 0.04 * Math.sin(ph + (i % 2 ? PI : 0)); }); } };
}
const _pc = { sx: 0.85, sy: 0.7, sz: 0.85, lump: 0.25, seed: 3, n: 36, len: [0.14, 0.42], skew: 1.2, spread: 0.7, back: 0.3, cover: 0.95, fat: 0.16, glow: 0.5 };
fx(332, "Rock porcupine, a classic coat of red quills.", () => _porcupine(Object.assign({}, _pc)));
fx(333, "Rock porcupine, a few big red shards.", () => _porcupine(Object.assign({}, _pc, { n: 11, len: [0.3, 0.65], fat: 0.2, seed: 5 })));
fx(334, "Rock porcupine, dense short red thorns.", () => _porcupine(Object.assign({}, _pc, { n: 90, len: [0.08, 0.2], fat: 0.2, seed: 7, spread: 0.5 })));
fx(335, "Rock porcupine, long thin hedgehog quills.", () => _porcupine(Object.assign({}, _pc, { n: 46, len: [0.3, 0.7], fat: 0.08, seed: 9, back: 0.5 })));
fx(336, "Rock porcupine, low wide rock, shards fanning.", () => _porcupine(Object.assign({}, _pc, { sx: 1.05, sy: 0.5, sz: 0.9, n: 34, seed: 11, spread: 1.0 })));
fx(337, "Rock porcupine, tall boulder.", () => _porcupine(Object.assign({}, _pc, { sx: 0.7, sy: 1.0, sz: 0.7, n: 30, seed: 13 })));
fx(338, "Rock porcupine, cracked, glowing seams.", () => _porcupine(Object.assign({}, _pc, { cracks: 5, n: 26, seed: 15, glow: 0.5 })));
fx(339, "Rock porcupine, a crown of shards on top.", () => _porcupine(Object.assign({}, _pc, { n: 30, top: 2.2, cover: 0.6, len: [0.2, 0.55], seed: 17 })));
fx(340, "Rock porcupine, lumpy asymmetric, huge and small shards.", () => _porcupine(Object.assign({}, _pc, { lump: 0.5, sx: 0.95, sz: 0.75, n: 28, skew: 2.6, len: [0.1, 0.7], seed: 19 })));
fx(341, "Rock porcupine, shards swept back, a snout end.", () => _porcupine(Object.assign({}, _pc, { sx: 0.7, sz: 1.0, n: 40, back: 0.9, len: [0.16, 0.5], seed: 21 })));
