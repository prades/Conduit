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
// A cut gem for a shell: a lathe of [radius, height] points with few sides, so its facets are flat planes; edges drawn along them.
const _gemMatGloss = new T.MeshStandardMaterial({ color: 0x000001, metalness: 0.15, roughness: 0.55, flatShading: true, side: T.DoubleSide }); _gemMatGloss.envMapIntensity = 0.3;   // a sheen, not a mirror: flat tables otherwise reflect the studio light white
const _gemMatMatte = new T.MeshStandardMaterial({ color: 0x000000, metalness: 0, roughness: 1, flatShading: true, side: T.DoubleSide }); _gemMatMatte.envMapIntensity = 0.05;
const _GEMS = {
  rose:     [[0, 0.6], [0.34, 0.58], [0.62, 0.42], [0.92, 0.18], [1.0, 0.0], [0.92, -0.1], [0.0001, -0.1]],
  brilliant:[[0, 0.55], [0.5, 0.55], [0.72, 0.4], [1.0, 0.22], [1.04, 0.14], [1.0, 0.1], [0.0001, 0.1]],
  step:     [[0, 0.62], [0.42, 0.62], [0.42, 0.5], [0.72, 0.5], [0.72, 0.34], [0.94, 0.34], [0.94, 0.14], [1.0, 0.1], [1.0, 0.0], [0.0001, 0.0]],
  kite:     [[0, 1.0], [0.18, 0.86], [0.55, 0.48], [0.92, 0.14], [1.0, 0.04], [0.0001, 0.0]],
  barrel:   [[0, 0.7], [0.4, 0.7], [0.82, 0.5], [1.0, 0.28], [1.0, 0.04], [0.0001, 0.0]],
  open:     [[0.34, 0.6], [0.62, 0.42], [0.92, 0.18], [1.0, 0.0], [0.92, -0.1], [0.0001, -0.1]],
};
function _gemMesh(kind, seg, sx, sy, sz, glossy, edges) {
  const prof = _GEMS[kind].map(p => new T.Vector2(Math.max(0.0001, p[0] * sx), p[1] * sy)), geo = new T.LatheGeometry(prof, seg), g = G();
  const m = new T.Mesh(geo, glossy ? _gemMatGloss : _gemMatMatte); m.rotation.y = PI / seg; m.scale.z = sz / sx; g.add(m);   // a facet faces front; squashed to the rock's depth
  if (edges !== false) { const le = new T.LineSegments(new T.EdgesGeometry(geo, 12), new T.LineBasicMaterial({ color: edges || 0x3a4252, transparent: true, opacity: 0.8 })); le.rotation.y = PI / seg; le.scale.z = sz / sx; g.add(le); }
  // the pavilion: the gem's underside tapers down to the floor, so the feet stay hidden
  const gp = _GEMS[kind][_GEMS[kind].length - 2], pav = new T.Mesh(new T.LatheGeometry([[0.0001, -0.42], [0.55, -0.42], [gp[0] * 0.98, gp[1]]].map(p => new T.Vector2(Math.max(0.0001, p[0] * sx), p[1] * sy)), seg), glossy ? _gemMatGloss : _gemMatMatte); pav.rotation.y = PI / seg; pav.scale.z = sz / sx; g.add(pav);
  if (kind === 'open') { const core = new T.Mesh(new T.IcosahedronGeometry(0.55 * sx, 1), new T.MeshBasicMaterial({ color: new T.Color(0xff3300).multiplyScalar(0.8), toneMapped: false })); core.position.y = 0.22 * sy; g.add(core); }
  return g;
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
  const rock = o.gem ? _gemMesh(o.gem, o.seg || 8, sx, sy, sz, o.glossy, o.edges) : _rockMesh(sx, sy, sz, o.lump, o.seed); body.add(rock);
  const hitMesh = o.gem ? rock.children[0] : rock, ray = new T.Raycaster();
  // the hidden feet: little dark stubs under the rock's rim, mostly out of sight
  const feet = []; for (let i = 0; i < 4; i++) { const fx = (i % 2 ? -1 : 1) * sx * 0.36, fz = (i < 2 ? 1 : -1) * sz * 0.36, ft = cbox(0.14, 0.1, 0.18, 0.03, _rockBlack); ft.position.set(fx, -cy + 0.07, fz); body.add(ft); feet.push(ft); }
  const mat = _redShardMat(o.glow), UPV2 = new T.Vector3(0, 1, 0), quills = [];
  const rn = (i, k) => _hz(i * 7 + 3, o.seed + k * 13, k);
  for (let i = 0; i < o.n; i++) { const u = Math.pow(rn(i, 1), o.top || 1), phi = rn(i, 2) * TAU, up = Math.cos(u * PI * 0.5 * (o.cover || 0.95));
    // a point on the rock's upper hemisphere (angle from the top: u*cover), the front-bias pushes some toward +z
    const polar = u * PI * 0.5 * (o.cover || 0.95) + 0.05, dirN = new T.Vector3(Math.sin(polar) * Math.sin(phi), Math.cos(polar), Math.sin(polar) * Math.cos(phi));
    if (o.back) dirN.z -= o.back * (0.4 + 0.6 * rn(i, 3)); dirN.normalize();
    let pos = new T.Vector3(dirN.x * sx * 0.93, dirN.y * sy * 0.93, dirN.z * sz * 0.93);
    if (o.gem) { rock.updateMatrixWorld(true); const org = dirN.clone().multiplyScalar(4), wO = body.localToWorld(org.clone()), wC = body.localToWorld(new T.Vector3(0, 0, 0)); ray.set(wO, wC.sub(wO).normalize()); const hit = ray.intersectObject(hitMesh, false)[0]; if (hit) pos = body.worldToLocal(hit.point.clone()).addScaledVector(dirN, -0.03); }
    const len = o.len[0] + (o.len[1] - o.len[0]) * Math.pow(rn(i, 4), o.skew || 1), r = len * (o.fat || 0.16) * (0.8 + 0.5 * rn(i, 5));
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

// ── 333 with a gem for a shell (Nos. 342–347): a few big red shards, on a pitch-black cut gem. ──
const _p333 = Object.assign({}, _pc, { n: 11, len: [0.3, 0.65], fat: 0.2, seed: 5, top: 1.2, cover: 0.9 });
fx(342, "333 on a rose-cut black gem.", () => _porcupine(Object.assign({}, _p333, { gem: 'rose', sx: 0.9, sy: 0.75, sz: 0.85, seg: 8, glossy: true })));
fx(343, "333 on a brilliant-cut black gem, flat table.", () => _porcupine(Object.assign({}, _p333, { gem: 'brilliant', sx: 0.95, sy: 0.9, sz: 0.9, seg: 8, glossy: true, seed: 6 })));
fx(344, "333 on a step-cut (emerald) black gem.", () => _porcupine(Object.assign({}, _p333, { gem: 'step', sx: 0.9, sy: 0.9, sz: 0.85, seg: 8, glossy: true, seed: 7 })));
fx(345, "333 on a tall pointed black gem.", () => _porcupine(Object.assign({}, _p333, { gem: 'kite', sx: 0.8, sy: 0.9, sz: 0.8, seg: 6, glossy: true, seed: 8 })));
fx(346, "333 on a matte black cut gem.", () => _porcupine(Object.assign({}, _p333, { gem: 'rose', sx: 0.9, sy: 0.75, sz: 0.85, seg: 8, glossy: false, edges: 0x4a2a2a, seed: 9 })));
fx(347, "333 on a cut gem split open, a red core inside.", () => _porcupine(Object.assign({}, _p333, { gem: 'open', sx: 0.95, sy: 0.85, sz: 0.9, seg: 8, glossy: true, seed: 10, cover: 0.8 })));
