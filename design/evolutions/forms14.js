// ── THE CLOAK AND ITS LIGHTNING VIPERS · Nos. 223–232 ─────────────────────
// From a pixel-art mock-up: a dark cloaked figure with a silver V of armour over its chest and a crystal at its heart,
// jagged lightning bolts rising from behind the hood like vipers, and two shards hovering close by.
// Needs forms13.js (_taperTube).
const _cloakMat = new T.MeshStandardMaterial({ color: 0x010208, metalness: 0.0, roughness: 1, flatShading: true, side: T.DoubleSide }); _cloakMat.envMapIntensity = 0.1;
function _robe(o) {   // a flared robe with a ragged hem, narrowing to the shoulders; low-poly
  const pts = [[o.hem, 0], [o.hem * 0.82, 0.18], [o.waist * 1.5, 0.5], [o.waist, 0.78], [o.shoulder, 1.05], [o.neck, 1.2], [0.0001, 1.22]].map(p => new T.Vector2(Math.max(0.0001, p[0]), p[1] * o.h));
  const geo = new T.LatheGeometry(pts, o.seg || 9), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); if (y > 0.25 * o.h) continue; const n = _hz(Math.round(x * 90), Math.round(y * 90), Math.round(z * 90)); p.setXYZ(i, x * (1 + (n - 0.5) * 0.3), y + (n - 0.3) * 0.1, z * (1 + (n - 0.5) * 0.3)); }   // the hem is torn
  geo.computeVertexNormals(); return new T.Mesh(geo, _cloakMat);
}
function _viper(o, mat, i) {   // one bolt: a zigzag path, tapered, a sharp head
  const N = o.vn, tt = _taperTube(mat, N, 4); const head = new T.Mesh(new T.ConeGeometry(o.vr * 1.6, o.vr * 7, 4), mat);
  return { tt, head, pts: Array.from({ length: N }, () => new T.Vector3()), rad: new Array(N), i };
}
function _cloakMage(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const H = o.h; b.add(_robe(o));
  // the hood: a pointed cowl, a dark void for a face with the crystal in it
  const hood = new T.Mesh(new T.ConeGeometry(o.hoodR, o.hoodH, 7), _cloakMat); hood.position.set(0, H * 1.2 + o.hoodH * 0.35, -0.04); hood.rotation.x = -0.2; b.add(hood);
  const face = sphere(o.hoodR * 0.62, new T.MeshBasicMaterial({ color: 0x000103 }), 10); face.scale.set(1, 1.1, 0.7); face.position.set(0, H * 1.2 + 0.2, o.hoodR * 0.42); b.add(face);
  const heart = hexCrystal(0.075, 0.16, 0.14, M.crystal); heart.position.set(0, H * 1.2 + 0.2, o.hoodR * 0.62); b.add(heart);
  // the silver V of armour over the chest, and a crystal where it meets
  for (const s of [-1, 1]) { const bl = plate([[0, 0], [0.09, 0], [0.42, 0.55], [0.3, 0.6]], 0.03, 0.006, M.steel); bl.position.set(s * 0.03, H * 0.55, o.shoulder + 0.1); bl.scale.x = s; bl.rotation.z = 0; b.add(bl);
    const ed = cbox(0.014, 0.6, 0.02, 0.003, M.glow); ed.position.set(s * 0.17, H * 0.82, o.shoulder + 0.125); ed.rotation.z = s * -0.55; b.add(ed); }
  const chest = hexCrystal(0.08, 0.16, 0.12, M.crystal); chest.position.set(0, H * 0.58, o.shoulder + 0.14); b.add(chest);
  for (const s of [-1, 1]) { const pd = plate([[0, 0], [0.3 * s, 0.05], [0.42 * s, 0.22], [0.12 * s, 0.14]], 0.04, 0.006, M.armor); pd.position.set(s * 0.2, H * 1.04, 0.04); pd.rotation.z = s * 0.25; b.add(pd); }   // pauldrons
  // the vipers: lightning bolts from the back of the hood
  const bolt = new T.MeshBasicMaterial({ color: new T.Color(EL.color).multiplyScalar(0.42), toneMapped: false }); const vipers = [];
  for (let i = 0; i < o.vipers; i++) { const v = _viper(o, bolt, i); b.add(v.tt.mesh); b.add(v.head); vipers.push(v); }
  // two shards hovering close
  const shards = []; for (const s of [-1, 1]) { const c = hexCrystal(0.1, 0.22, 0.3, M.crystal); const hg = G(); hg.add(c); b.add(hg); shards.push({ hg, s }); }
  const L = new T.PointLight(0xffffff, 0.3, 4, 2); L.color.set(EL.color); L.position.set(0, H * 1.3, 0.5); b.add(L); LIGHTS.push(L);
  return { g, core: H * 1.2 * (o.S || 1), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    b.position.y = 0.01 * Math.sin(ph * 2);
    for (const v of vipers) { const a = (v.i - (o.vipers - 1) / 2) * o.fan, N = o.vn, base = new T.Vector3(Math.sin(a) * 0.07, H * 1.2 + o.hoodH * 0.22, -o.hoodR * 0.7);
      const len = o.vlen * (0.75 + 0.5 * _hz(v.i, o.seed, 1)) * (1 + 0.25 * ac); let px = base.x, py = base.y, pz = base.z, dx = Math.sin(a) * o.out, dy = 0.8, dz = -o.back - 0.5 + ac * 1.1;
      for (let k = 0; k < N; k++) { const u = k / (N - 1), zig = (k % 2 ? 1 : -1) * o.amp * (0.5 + 0.5 * Math.sin(ph * 3 + v.i * 2 + k * 0.9)) * (1 - 0.3 * u), r = o.vr * (1 - 0.85 * Math.pow(u, 1.1)) + 0.004;
        v.rad[k] = r; v.pts[k].set(px + zig * Math.cos(a + 1.2), py, pz + zig * Math.sin(a + 1.2) * 0.6);
        const st = len / N, L2 = Math.hypot(dx, dy, dz); px += dx / L2 * st; py += dy / L2 * st; pz += dz / L2 * st; dx += Math.sin(a) * o.curl * st; dz += (o.lean + ac * 1.2) * st; dy -= o.bend * st; }
      v.tt.set(v.pts, v.rad); const e = v.pts[N - 1], e2 = v.pts[N - 2]; v.head.position.copy(e); v.head.lookAt(e.x * 2 - e2.x, e.y * 2 - e2.y, e.z * 2 - e2.z); v.head.rotateX(PI / 2); }
    for (const s of shards) { const a = ph + (s.s > 0 ? 0 : PI), r = o.shardR; s.hg.position.set(s.s * r + Math.sin(a) * 0.05, o.shardY + 0.06 * Math.sin(ph * 2 + s.s) - 0.1 * ac, 0.08 + 0.1 * Math.cos(a)); s.hg.rotation.set(0.2 * Math.sin(ph), a, s.s * 0.25); } } };
}
const _cb = { h: 1.15, hem: 0.5, waist: 0.24, shoulder: 0.3, neck: 0.16, hoodR: 0.27, hoodH: 0.62, seg: 9, vipers: 4, vn: 11, vr: 0.07, vlen: 0.85, fan: 0.55, out: 0.8, back: 0.2, lean: 0.9, curl: 0.5, bend: 0.2, amp: 0.07, seed: 3, shardR: 0.78, shardY: 1.05 };
fx(223, "Cloak, four lightning vipers, two shards.", () => _cloakMage(Object.assign({}, _cb)));
fx(224, "Cloak, three long vipers arching forward.", () => _cloakMage(Object.assign({}, _cb, { vipers: 3, vlen: 1.15, vn: 13, lean: 1.4, bend: 0.4, fan: 0.7, vr: 0.075, seed: 5 })));
fx(225, "Cloak, five short vipers, a crown of bolts.", () => _cloakMage(Object.assign({}, _cb, { vipers: 5, vlen: 0.65, vn: 9, fan: 0.42, vr: 0.06, seed: 7 })));
fx(226, "Cloak, two big vipers.", () => _cloakMage(Object.assign({}, _cb, { vipers: 2, vlen: 1.1, vn: 13, vr: 0.095, fan: 1.0, out: 1.1, amp: 0.1, seed: 9 })));
fx(227, "Wide-hooded cloak, vipers straight up.", () => _cloakMage(Object.assign({}, _cb, { hoodR: 0.34, hoodH: 0.5, out: 0.35, lean: 0.3, bend: 0.05, vlen: 1.0, vn: 12, vr: 0.075, seed: 11 })));
fx(228, "Tall narrow cloak, long thin vipers.", () => _cloakMage(Object.assign({}, _cb, { h: 1.3, hem: 0.45, shoulder: 0.26, vipers: 4, vlen: 1.05, vr: 0.05, vn: 13, amp: 0.09, seed: 13 })));
fx(229, "Cloak, vipers thrown back like a mane.", () => _cloakMage(Object.assign({}, _cb, { vipers: 5, back: 0.8, lean: 0.2, bend: 0.2, vlen: 0.95, fan: 0.5, seed: 15 })));
fx(230, "Cloak, shards held lower, near the hem.", () => _cloakMage(Object.assign({}, _cb, { shardR: 0.62, shardY: 0.55, vipers: 4, seed: 17 })));
fx(231, "Cloak, shards high, beside the hood.", () => _cloakMage(Object.assign({}, _cb, { shardR: 0.55, shardY: 1.5, vipers: 3, vlen: 0.95, seed: 19 })));
fx(232, "Broad-shouldered cloak, six bolts.", () => _cloakMage(Object.assign({}, _cb, { hem: 0.62, shoulder: 0.38, waist: 0.28, vipers: 6, vlen: 0.8, fan: 0.4, vn: 10, vr: 0.055, seed: 21 })));
