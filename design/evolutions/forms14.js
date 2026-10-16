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

// ── The Snorunt shape (Nos. 233–242): a small squat round body under a big pointed cone hood, stubby arms, the face in the hood's
// opening. The lightning vipers rise from the back of the cone, and two shards hover close. ──
function _snorMage(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const R = o.R, footH = o.foot, cy = footH + R * o.sy * 0.92;
  const body = new T.Mesh(new T.IcosahedronGeometry(1, 1), _cloakMat); body.scale.set(R * (o.wide || 1), R * o.sy, R * (o.deep || 1)); body.position.y = cy; b.add(body);
  for (const s of [-1, 1]) { const ft = new T.Mesh(new T.IcosahedronGeometry(1, 0), _cloakMat); ft.scale.set(R * 0.34, footH * 0.9, R * 0.42); ft.position.set(s * R * 0.42, footH * 0.5, R * 0.2); b.add(ft); }
  const top = cy + R * o.sy * 0.78, hoodR = R * o.hoodW, hh = o.hoodH;
  const hood = new T.Mesh(new T.ConeGeometry(hoodR, hh, o.seg || 8), _cloakMat); hood.position.set(0, top + hh / 2 - 0.1, -0.03); hood.rotation.x = -(o.hoodTilt || 0.12); b.add(hood);
  const brim = new T.Mesh(new T.TorusGeometry(hoodR * 0.96, 0.025, 4, o.seg || 8), M.steel); brim.rotation.x = PI / 2 - 0.1; brim.position.set(0, top - 0.08, 0.0); b.add(brim);   // a silver rim to the hood
  const face = sphere(hoodR * 0.62, new T.MeshBasicMaterial({ color: 0x000103 }), 10); face.scale.set(1, 0.8, 0.55); face.position.set(0, top + hh * 0.17, hoodR * 0.52); b.add(face);
  const heart = hexCrystal(0.06, 0.12, 0.11, M.crystal); heart.position.set(0, top + hh * 0.17, hoodR * 0.7); b.add(heart);
  for (const s of [-1, 1]) { const arm = new T.Mesh(new T.IcosahedronGeometry(1, 0), _cloakMat); arm.scale.set(R * 0.3, R * 0.42, R * 0.3); arm.position.set(s * R * 0.98 * (o.wide || 1), cy - R * 0.05 + (o.armUp || 0), R * 0.18); arm.rotation.z = s * -0.5; b.add(arm);
    const hand = sphere(R * 0.17, M.steel, 7); hand.position.set(s * R * 1.12 * (o.wide || 1), cy - R * 0.32 + (o.armUp || 0), R * 0.3); b.add(hand); }
  const chest = hexCrystal(0.06, 0.11, 0.1, M.crystal); chest.position.set(0, cy - R * 0.1, R * (o.deep || 1) * 0.96); b.add(chest);
  for (const s of [-1, 1]) { const ed = cbox(0.012, R * 0.7, 0.018, 0.003, M.glow); ed.position.set(s * R * 0.22, cy + R * 0.12, R * (o.deep || 1) * 0.93); ed.rotation.z = s * -0.5; b.add(ed); }   // the silver V, small
  const bolt = new T.MeshBasicMaterial({ color: new T.Color(EL.color).multiplyScalar(0.42), toneMapped: false }); const vipers = [];
  for (let i = 0; i < o.vipers; i++) { const v = _viper(o, bolt, i); b.add(v.tt.mesh); b.add(v.head); vipers.push(v); }
  const shards = []; for (const s of [-1, 1]) { const c = hexCrystal(0.09, 0.2, 0.27, M.crystal); const hg = G(); hg.add(c); b.add(hg); shards.push({ hg, s }); }
  const L = new T.PointLight(0xffffff, 0.3, 4, 2); L.color.set(EL.color); L.position.set(0, top, 0.5); b.add(L); LIGHTS.push(L);
  return { g, core: top * (o.S || 1), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    b.position.y = 0.02 * Math.abs(Math.sin(ph)); body.scale.set(R * (o.wide || 1) * (1 + 0.02 * Math.sin(ph * 2)), R * o.sy * (1 - 0.02 * Math.sin(ph * 2)), R * (o.deep || 1)); hood.rotation.z = 0.03 * Math.sin(ph);
    for (const v of vipers) { const a = (v.i - (o.vipers - 1) / 2) * o.fan, N = o.vn, base = new T.Vector3(Math.sin(a) * 0.06, top + hh * 0.5, -hoodR * 0.55);
      const len = o.vlen * (0.75 + 0.5 * _hz(v.i, o.seed, 1)) * (1 + 0.25 * ac); let px = base.x, py = base.y, pz = base.z, dx = Math.sin(a) * o.out, dy = 0.8, dz = -o.back - 0.5 + ac * 1.1;
      for (let k = 0; k < N; k++) { const u = k / (N - 1), zig = (k % 2 ? 1 : -1) * o.amp * (0.5 + 0.5 * Math.sin(ph * 3 + v.i * 2 + k * 0.9)) * (1 - 0.3 * u), r = o.vr * (1 - 0.85 * Math.pow(u, 1.1)) + 0.004;
        v.rad[k] = r; v.pts[k].set(px + zig * Math.cos(a + 1.2), py, pz + zig * Math.sin(a + 1.2) * 0.6);
        const st = len / N, L2 = Math.hypot(dx, dy, dz); px += dx / L2 * st; py += dy / L2 * st; pz += dz / L2 * st; dx += Math.sin(a) * o.curl * st; dz += (o.lean + ac * 1.2) * st; dy -= o.bend * st; }
      v.tt.set(v.pts, v.rad); const e = v.pts[N - 1], e2 = v.pts[N - 2]; v.head.position.copy(e); v.head.lookAt(e.x * 2 - e2.x, e.y * 2 - e2.y, e.z * 2 - e2.z); v.head.rotateX(PI / 2); }
    for (const s of shards) { const a = ph + (s.s > 0 ? 0 : PI); s.hg.position.set(s.s * o.shardR + Math.sin(a) * 0.05, o.shardY + 0.06 * Math.sin(ph * 2 + s.s) - 0.1 * ac, 0.08 + 0.1 * Math.cos(a)); s.hg.rotation.set(0.2 * Math.sin(ph), a, s.s * 0.25); } } };
}
const _sb = { R: 0.42, sy: 0.9, foot: 0.1, hoodW: 1.12, hoodH: 0.95, hoodTilt: 0.12, seg: 8, vipers: 4, vn: 11, vr: 0.06, vlen: 0.8, fan: 0.5, out: 0.7, back: 0.2, lean: 0.9, curl: 0.5, bend: 0.2, amp: 0.06, seed: 3, shardR: 0.66, shardY: 0.62 };
fx(233, "Snorunt-shaped mage, four vipers.", () => _snorMage(Object.assign({}, _sb)));
fx(234, "Round little body, huge cone.", () => _snorMage(Object.assign({}, _sb, { R: 0.38, hoodW: 1.3, hoodH: 1.15, vipers: 4, seed: 5 })));
fx(235, "Tall narrow cone.", () => _snorMage(Object.assign({}, _sb, { hoodW: 0.95, hoodH: 1.3, vipers: 3, vlen: 0.9, seed: 7 })));
fx(236, "Wide body, arms out.", () => _snorMage(Object.assign({}, _sb, { wide: 1.2, armUp: 0.06, shardR: 0.74, vipers: 4, seed: 9 })));
fx(237, "Two big vipers.", () => _snorMage(Object.assign({}, _sb, { vipers: 2, vlen: 0.9, vr: 0.09, fan: 1.0, out: 1.0, amp: 0.09, seed: 11 })));
fx(238, "Five short vipers, a crown of bolts.", () => _snorMage(Object.assign({}, _sb, { vipers: 5, vlen: 0.62, vr: 0.05, fan: 0.4, seed: 13 })));
fx(239, "Shards low, by the feet.", () => _snorMage(Object.assign({}, _sb, { shardR: 0.6, shardY: 0.3, seed: 15 })));
fx(240, "Shards high, by the hood.", () => _snorMage(Object.assign({}, _sb, { shardR: 0.5, shardY: 1.1, vipers: 3, seed: 17 })));
fx(241, "Pear-shaped body, thick-set cone.", () => _snorMage(Object.assign({}, _sb, { sy: 1.05, R: 0.45, hoodW: 1.0, hoodH: 0.9, wide: 1.1, vipers: 4, seed: 19 })));
fx(242, "Small and cute: tiny body, bolts thrown back.", () => _snorMage(Object.assign({}, _sb, { R: 0.34, hoodH: 0.85, back: 0.7, lean: 0.2, vipers: 5, vlen: 0.75, shardR: 0.56, shardY: 0.55, seed: 21 })));

// ── The storm cloak (Nos. 243–252): the electric mage. The Snorunt shape, hovering (no legs or feet), a glossy robe, and the lightning
// is ARMOUR: shiny silver bolt-shaped plates on the hood, shoulders and chest, a bright core in each, and glowing bolt seams on the robe. ──
const _stormCloak = new T.MeshStandardMaterial({ color: 0x03061a, metalness: 0.7, roughness: 0.25, flatShading: true }); _stormCloak.envMapIntensity = 1.1;
const _boltSilver = new T.MeshStandardMaterial({ color: 0xc8d0e0, metalness: 1, roughness: 0.14, flatShading: true }); _boltSilver.envMapIntensity = 2.0;
function boltPlate(len, w, th, mat) {   // a lightning bolt, point down, standing in x-y
  const P = [[0.18, 1], [-0.38, 0.46], [-0.04, 0.46], [-0.3, 0], [0.4, 0.58], [0.06, 0.58], [0.32, 1]].map(p => [p[0] * w, p[1] * len]);
  return plate(P, th, th * 0.25, mat || _boltSilver);
}
function boltArmour(len, w, th) { const g = G(); g.add(boltPlate(len, w, th, _boltSilver)); const c = boltPlate(len * 0.8, w * 0.55, th * 0.6, M.glow); c.position.set(0.0, len * 0.09, th * 0.7); g.add(c); return g; }   // silver, with a glowing core
function _stormMage(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const R = o.R, hover = o.hover, cy = hover + R * o.sy * 0.95;
  const body = new T.Mesh(new T.IcosahedronGeometry(1, 1), _stormCloak); body.scale.set(R * (o.wide || 1), R * o.sy, R * (o.deep || 1)); body.position.y = cy; b.add(body);
  const tail = new T.Mesh(new T.ConeGeometry(R * 0.78 * (o.wide || 1), o.tail, 7), _stormCloak); tail.rotation.x = PI; tail.position.set(0, hover + o.tail * 0.5 - 0.02, 0); b.add(tail);   // the robe tapers to a point: it hovers
  const top = cy + R * o.sy * 0.78, hoodR = R * o.hoodW, hh = o.hoodH;
  const hood = new T.Mesh(new T.ConeGeometry(hoodR, hh, 8), _stormCloak); hood.position.set(0, top + hh / 2 - 0.1, -0.03); hood.rotation.x = -0.12; b.add(hood);
  const brim = new T.Mesh(new T.TorusGeometry(hoodR * 0.96, 0.025, 4, 8), _boltSilver); brim.rotation.x = PI / 2 - 0.1; brim.position.set(0, top - 0.08, 0); b.add(brim);
  const face = sphere(hoodR * 0.62, new T.MeshBasicMaterial({ color: 0x000103 }), 10); face.scale.set(1, 0.8, 0.55); face.position.set(0, top + hh * 0.17, hoodR * 0.52); b.add(face);
  const heart = hexCrystal(0.07, 0.14, 0.12, M.crystal); heart.position.set(0, top + hh * 0.17, hoodR * 0.68); b.add(heart); const hg = glowSprite(0.45); hg.position.copy(heart.position); b.add(hg);
  // lightning as armour: a big bolt plate on the chest, bolts on the shoulders, bolt seams down the robe, bolt marks up the hood
  const chest = boltArmour(R * 1.0 * o.chest, R * 0.55 * o.chest, 0.03); chest.rotation.z = PI; chest.position.set(R * 0.07, cy + R * 0.42 * o.chest, R * (o.deep || 1) * 0.95); b.add(chest);
  for (const s of [-1, 1]) { const sh = boltArmour(R * 0.7, R * 0.42, 0.028); sh.position.set(s * R * 0.92 * (o.wide || 1), cy + R * 0.45, R * 0.15); sh.rotation.set(0.15, s * 1.1, s * 0.55 + PI * (s > 0 ? 0 : 0)); b.add(sh);
    const seam = boltPlate(R * 1.2, R * 0.3, 0.012, M.glow); seam.position.set(s * R * 0.55 * (o.wide || 1), cy - R * 0.35, R * (o.deep || 1) * 0.84); seam.rotation.set(0, s * 0.5, s * 0.12); b.add(seam);
    const hm = boltPlate(hh * 0.5, hoodR * 0.32, 0.012, M.glow); hm.position.set(s * hoodR * 0.62, top + hh * 0.2, hoodR * 0.35); hm.rotation.set(0, s * 0.95, s * 0.1 + PI); b.add(hm);
    const arm = new T.Mesh(new T.IcosahedronGeometry(1, 0), _stormCloak); arm.scale.set(R * 0.28, R * 0.4, R * 0.28); arm.position.set(s * R * 1.1 * (o.wide || 1), cy - R * 0.1, R * 0.2); arm.rotation.z = s * -0.6; b.add(arm);
    const hand = sphere(R * 0.16, _boltSilver, 7); hand.position.set(s * R * 1.22 * (o.wide || 1), cy - R * 0.36, R * 0.32); b.add(hand); }
  // the vipers: lightning armour that rises from the back of the hood, silver and glowing, each its own bolt
  const vipers = []; for (let i = 0; i < o.vipers; i++) { const v = G(), bt = boltArmour(o.vlen * (0.75 + 0.5 * _hz(i, o.seed, 1)), o.vw, 0.035); v.add(bt); b.add(v); vipers.push({ v, i, bt }); }
  const shards = []; for (const s of [-1, 1]) { const c = hexCrystal(0.09, 0.2, 0.27, M.crystal); const sg = G(); sg.add(c); b.add(sg); shards.push({ sg, s }); }
  const L = new T.PointLight(0xffffff, 0.45, 4, 2); L.color.set(EL.color); L.position.set(0, top, 0.6); b.add(L); LIGHTS.push(L);
  return { g, core: top * (o.S || 1), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    b.position.y = 0.03 * Math.sin(ph); tail.rotation.z = 0.06 * Math.sin(ph + 1); body.scale.set(R * (o.wide || 1) * (1 + 0.02 * Math.sin(ph * 2)), R * o.sy * (1 - 0.02 * Math.sin(ph * 2)), R * (o.deep || 1)); hood.rotation.z = 0.03 * Math.sin(ph);
    for (const V of vipers) { const a = (V.i - (o.vipers - 1) / 2) * o.fan; V.v.position.set(Math.sin(a) * hoodR * 0.4, top + hh * 0.35, -hoodR * 0.6);
      V.v.rotation.set(-o.back + 0.5 * ac - 0.12 * Math.sin(ph * 2 + V.i), 0, -a * 1.1 + 0.1 * Math.sin(ph * 3 + V.i * 2)); V.v.rotation.order = 'ZXY'; V.v.scale.setScalar(1 + 0.2 * ac + 0.04 * Math.sin(ph * 6 + V.i)); }
    for (const s of shards) { const a = ph + (s.s > 0 ? 0 : PI); s.sg.position.set(s.s * o.shardR + Math.sin(a) * 0.05, o.shardY + 0.06 * Math.sin(ph * 2 + s.s) - 0.1 * ac, 0.08 + 0.1 * Math.cos(a)); s.sg.rotation.set(0.2 * Math.sin(ph), a, s.s * 0.25); } } };
}
const _st = { R: 0.4, sy: 0.9, hover: 0.55, tail: 0.42, chest: 1, hoodW: 1.12, hoodH: 0.95, vipers: 4, vlen: 0.85, vw: 0.34, fan: 0.55, back: 0.5, seed: 3, shardR: 0.66, shardY: 0.95 };
fx(243, "Storm cloak, four bolt vipers.", () => _stormMage(Object.assign({}, _st)));
fx(244, "Storm cloak, round body, huge hood.", () => _stormMage(Object.assign({}, _st, { R: 0.37, hoodW: 1.3, hoodH: 1.15, seed: 5 })));
fx(245, "Storm cloak, tall narrow hood, three long bolts.", () => _stormMage(Object.assign({}, _st, { hoodW: 0.95, hoodH: 1.3, vipers: 3, vlen: 1.05, seed: 7 })));
fx(246, "Storm cloak, wide body.", () => _stormMage(Object.assign({}, _st, { wide: 1.22, shardR: 0.76, seed: 9 })));
fx(247, "Storm cloak, two huge bolts.", () => _stormMage(Object.assign({}, _st, { vipers: 2, vlen: 1.1, vw: 0.5, fan: 1.0, seed: 11 })));
fx(248, "Storm cloak, five short bolts, a crown.", () => _stormMage(Object.assign({}, _st, { vipers: 5, vlen: 0.62, vw: 0.26, fan: 0.42, seed: 13 })));
fx(249, "Storm cloak, shards low.", () => _stormMage(Object.assign({}, _st, { shardR: 0.6, shardY: 0.5, seed: 15 })));
fx(250, "Storm cloak, shards high by the hood.", () => _stormMage(Object.assign({}, _st, { shardR: 0.5, shardY: 1.2, vipers: 3, seed: 17 })));
fx(251, "Storm cloak, long tail, high hover.", () => _stormMage(Object.assign({}, _st, { hover: 0.8, tail: 0.6, sy: 0.95, seed: 19 })));
fx(252, "Storm cloak, bolts thrown back like a mane.", () => _stormMage(Object.assign({}, _st, { vipers: 5, back: 1.0, vlen: 0.95, vw: 0.3, fan: 0.5, seed: 21 })));

// ── The pyramid brawler (Nos. 253–262): the electric BRAWLER. A pyramid helmet shelters a diamond crystal, which is its head and body; below it a
// pyramid dress; shocking tentacle arms come off the dress and do the attacking. Glossy dark pyramids, silver edges and bolt armour, hovering. ──
const _arcMat = () => new T.MeshBasicMaterial({ color: new T.Color(EL.color).lerp(new T.Color(0xffffff), 0.25), toneMapped: false, side: T.DoubleSide });
function _pyrEdges(parent, rT, rB, yT, yB, th, mat) {   // silver edge bars along a 4-sided pyramid / frustum whose corners sit at 45 degrees
  for (let k = 0; k < 4; k++) { const a = PI / 4 + k * PI / 2, bar = limb(th, mat || _boltSilver); setLink(bar, new T.Vector3(Math.sin(a) * rB, yB, Math.cos(a) * rB), new T.Vector3(Math.sin(a) * rT, yT, Math.cos(a) * rT)); parent.add(bar); }
}
function _pyramidBrawler(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const y0 = o.hover, sH = o.skirtH, yTop = y0 + sH, cY = yTop + o.crystalLift;
  // the dress: a hollow four-sided frustum, wide at the hem; ragged by being cut into a few teeth at the bottom
  const skirt = new T.Mesh(new T.CylinderGeometry(o.skirtTop, o.skirtBot, sH, 4, 1, true), _stormCloak); skirt.rotation.y = PI / 4; skirt.position.y = y0 + sH / 2; b.add(skirt);
  _pyrEdges(b, o.skirtTop * 1.0, o.skirtBot * 1.0, yTop, y0, 0.022);
  const hem = new T.Mesh(new T.TorusGeometry(o.skirtBot * 1.0, 0.02, 4, 4), _boltSilver); hem.rotation.set(PI / 2, 0, PI / 4); hem.position.y = y0; b.add(hem);
  // the lightning bolt armour on the dress's front faces, and glowing seams
  for (const s of [-1, 1]) { const ba = boltArmour(sH * 0.8, o.skirtBot * 0.5, 0.03); ba.position.set(s * o.skirtBot * 0.42, y0 + sH * 0.88, o.skirtBot * 0.5 + 0.02); ba.rotation.set(0.12, s * 0.5, PI + s * 0.12); b.add(ba); }
  // the crystal: the creature's head and body, a diamond
  const cr = hexCrystal(o.crystalR * 1.15, o.crystalR * 0.7, o.crystalR * 1.7, M.crystal); cr.position.y = cY; b.add(cr);   // a fat diamond
  const core2 = hexCrystal(o.crystalR * 0.6, o.crystalR * 0.4, o.crystalR * 1.0, M.glow); core2.position.y = cY; b.add(core2); const cg = glowSprite(o.crystalR * 6); cg.position.y = cY; b.add(cg);
  // the helmet: a four-sided pyramid over the crystal, open at the front so the crystal shows; silver edges; a pyramid frame
  const hy = cY + o.helmGap, helm = new T.Mesh(new T.ConeGeometry(o.helmR, o.helmH, 4, 1, true, PI / 4, o.helmOpen ? 3 * PI / 2 : TAU), _stormCloak); helm.position.set(0, hy + o.helmH / 2, 0); b.add(helm);
  const hc = G(); hc.position.y = hy; b.add(hc);
  for (let k = 0; k < 4; k++) { const a = k * PI / 2 + (o.helmOpen ? 0 : 0); if (o.helmOpen && Math.abs(Math.sin(a - 0)) < 0.01 && Math.cos(a) > 0) continue; const ang = a, bar = limb(0.018, _boltSilver); setLink(bar, new T.Vector3(Math.sin(ang) * o.helmR, 0, Math.cos(ang) * o.helmR), new T.Vector3(0, o.helmH, 0)); hc.add(bar); }
  const vb = new T.Mesh(new T.TorusGeometry(o.helmR * 0.7, 0.02, 4, 4), _boltSilver); vb.rotation.set(PI / 2, 0, PI / 4); vb.position.y = o.helmH * 0.0; hc.add(vb);
  const tip = hexCrystal(0.035, 0.06, 0.1, M.crystal); tip.position.y = o.helmH + 0.06; hc.add(tip);
  // the shocking arms: tapered tubes of electric light, each a jagged path that crackles; two big ones in front strike
  const arms = []; const am = _arcMat(); for (let i = 0; i < o.arms; i++) { const a = -o.armArc / 2 + (o.arms > 1 ? i / (o.arms - 1) : 0.5) * o.armArc + (o.armCentre || 0) + (_hz(i, o.seed, 1) - 0.5) * 0.5; const tt = _taperTube(am, o.an, 5); b.add(tt.mesh);
    const sp = hexCrystal(0.025, 0.05, 0.09, M.crystal); b.add(sp);
    arms.push({ tt, sp, a, big: i < o.bigArms, ph: i * 1.7, len: o.armLen * (0.75 + 0.5 * _hz(i, o.seed, 2)), pts: Array.from({ length: o.an }, () => new T.Vector3()), rad: new Array(o.an) }); }
  const shards = []; if (o.shards) for (const s of [-1, 1]) { const c = hexCrystal(0.08, 0.18, 0.24, M.crystal); const sg = G(); sg.add(c); b.add(sg); shards.push({ sg, s }); }
  const L = new T.PointLight(0xffffff, 0.5, 4, 2); L.color.set(EL.color); L.position.set(0, cY, 0.7); b.add(L); LIGHTS.push(L);
  return { g, core: cY * (o.S || 1), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    b.position.y = 0.03 * Math.sin(ph); cr.rotation.y = ph * 0.5; core2.rotation.y = -ph * 0.5; helm.position.y = hy + o.helmH / 2 + 0.025 * Math.sin(ph * 2); hc.position.y = hy + 0.025 * Math.sin(ph * 2);
    for (const A of arms) { const sa = Math.sin(A.a), ca = Math.cos(A.a), N = o.an, bx = sa * o.skirtBot * 0.75, by = y0 + sH * (A.big ? 0.62 : 0.3), bz = ca * o.skirtBot * 0.75;
      // each arm leaves the dress, reaches out and forward, and lashes: a jagged path with a flickering zigzag, lengthening when it strikes
      const reach = A.len * (1 + 0.55 * ac * (A.big ? 1.4 : 1)), fwd = (A.big ? 0.85 : 0.35) + 0.9 * ac * (A.big ? 1 : 0.5);
      let px = bx, py = by, pz = bz, dx = sa * 0.8, dy = (A.big ? 0.15 : -0.15), dz = ca * 0.6 + fwd;
      for (let k = 0; k < N; k++) { const u = k / (N - 1), zig = (k % 2 ? 1 : -1) * o.armAmp * (0.55 + 0.45 * Math.sin(ph * 4 + A.ph + k * 1.3)) * (0.4 + u), r = o.armR * (A.big ? 1.25 : 1) * (1 - 0.88 * Math.pow(u, 1.05)) + 0.006;
        A.rad[k] = r; A.tt.mesh && A.pts[k].set(px + zig * Math.cos(A.a + 1.4), Math.max(0.02, py + zig * 0.4), pz + zig * Math.sin(A.a + 1.4));
        const st = reach / N, Lh = Math.hypot(dx, dy, dz); px += dx / Lh * st; py += dy / Lh * st; pz += dz / Lh * st; dy -= o.armDroop * st; }
      A.tt.set(A.pts, A.rad); const e = A.pts[N - 1]; A.sp.position.copy(e); A.sp.rotation.set(ph * 5 + A.ph, ph * 3, 0); A.sp.scale.setScalar(1 + 0.4 * Math.sin(ph * 6 + A.ph) + 0.8 * ac); }
    for (const s of shards) { const a = ph + (s.s > 0 ? 0 : PI); s.sg.position.set(s.s * o.shardR + Math.sin(a) * 0.05, cY + 0.06 * Math.sin(ph * 2 + s.s) - 0.1 * ac, 0.1 + 0.1 * Math.cos(a)); s.sg.rotation.set(0.2 * Math.sin(ph), a, s.s * 0.25); } } };
}
const _pb = { hover: 0.42, skirtH: 0.62, skirtTop: 0.24, skirtBot: 0.62, crystalR: 0.15, crystalLift: 0.16, helmR: 0.36, helmH: 0.62, helmGap: 0.14, helmOpen: true, arms: 6, bigArms: 2, armArc: 4.6, armCentre: 0, an: 12, armLen: 0.95, armR: 0.055, armAmp: 0.07, armDroop: 0.35, seed: 3, shards: true, shardR: 0.7 };
fx(253, "Pyramid brawler, six shock arms.", () => _pyramidBrawler(Object.assign({}, _pb)));
fx(254, "Pyramid brawler, four heavy arms.", () => _pyramidBrawler(Object.assign({}, _pb, { arms: 4, bigArms: 2, armR: 0.075, armLen: 0.85, armArc: 3.4, seed: 5 })));
fx(255, "Pyramid brawler, eight thin arms.", () => _pyramidBrawler(Object.assign({}, _pb, { arms: 8, bigArms: 2, armR: 0.04, armLen: 1.05, armArc: 5.4, an: 14, seed: 7 })));
fx(256, "Pyramid brawler, tall pyramid helmet.", () => _pyramidBrawler(Object.assign({}, _pb, { helmR: 0.32, helmH: 0.95, helmGap: 0.12, seed: 9 })));
fx(257, "Pyramid brawler, closed helmet, crystal glowing through the dress.", () => _pyramidBrawler(Object.assign({}, _pb, { helmOpen: false, helmGap: 0.04, crystalR: 0.17, helmR: 0.4, helmH: 0.7, seed: 11 })));
fx(258, "Pyramid brawler, wide low dress.", () => _pyramidBrawler(Object.assign({}, _pb, { skirtBot: 0.82, skirtH: 0.5, skirtTop: 0.3, hover: 0.34, armLen: 1.05, seed: 13 })));
fx(259, "Pyramid brawler, narrow tall dress.", () => _pyramidBrawler(Object.assign({}, _pb, { skirtBot: 0.46, skirtH: 0.85, skirtTop: 0.18, hover: 0.5, seed: 15 })));
fx(260, "Pyramid brawler, big crystal.", () => _pyramidBrawler(Object.assign({}, _pb, { crystalR: 0.21, crystalLift: 0.2, helmR: 0.42, helmH: 0.68, helmGap: 0.18, seed: 17 })));
fx(261, "Pyramid brawler, no shards, long lashing arms.", () => _pyramidBrawler(Object.assign({}, _pb, { shards: false, arms: 5, armLen: 1.3, an: 16, armAmp: 0.09, seed: 19 })));
fx(262, "Pyramid brawler, high hover, arms hanging.", () => _pyramidBrawler(Object.assign({}, _pb, { hover: 0.75, armDroop: 0.9, armLen: 1.15, bigArms: 0, arms: 6, seed: 21 })));

// ── The pyramid shell (Nos. 263–272): the electric brawler, redone. One glossy pyramid SHELL raised off the floor; the diamond crystal hides
// UNDER it, glowing in the gap; thick shocking arms push out from beneath the rim and walk and lash. ──
function _shellBrawler(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const hv = o.hover, H = o.H, R = o.R, sy = hv + H / 2;
  const shell = new T.Mesh(new T.ConeGeometry(R, H, 4, 1, true), _stormCloak); shell.rotation.y = PI / 4; shell.position.y = sy; b.add(shell);
  _pyrEdges(b, 0.001, R, hv + H, hv, 0.026);
  const hem = new T.Mesh(new T.TorusGeometry(R, 0.028, 4, 4), _boltSilver); hem.rotation.set(PI / 2, 0, PI / 4); hem.position.y = hv; b.add(hem);
  // an inner ceiling so the underside is dark, not see-through
  const under = new T.Mesh(new T.ConeGeometry(R * 0.98, H * 0.98, 4, 1, true), new T.MeshBasicMaterial({ color: 0x010206, side: T.BackSide })); under.rotation.y = PI / 4; under.position.y = sy; b.add(under);
  for (const s of [-1, 1]) { const ba = boltArmour(H * 0.62, R * 0.36, 0.03); ba.position.set(s * R * 0.2, hv + H * 0.12, R * 0.34 + 0.02); ba.rotation.set(-0.35, s * 0.55, PI + s * 0.1); b.add(ba); }
  const apex = hexCrystal(0.04, 0.07, 0.12, M.crystal); apex.position.y = hv + H + 0.08; b.add(apex);
  // the diamond, hiding under the shell: it glows in the gap between the hem and the floor
  const dY = hv * 0.55, d = hexCrystal(o.dR * 1.1, o.dR * 0.7, o.dR * 1.7, M.crystal); d.position.y = dY; b.add(d); const dc = hexCrystal(o.dR * 0.55, o.dR * 0.4, o.dR * 1.0, M.glow); dc.position.y = dY; b.add(dc);
  const dg = glowSprite(o.dR * 9); dg.position.y = dY; b.add(dg);
  // the thick shocking arms, from under the rim
  const arms = []; const am = _arcMat(); for (let i = 0; i < o.arms; i++) { const a = -o.armArc / 2 + (o.arms > 1 ? i / (o.arms - 1) : 0.5) * o.armArc + (o.armCentre || 0) + (_hz(i, o.seed, 1) - 0.5) * 0.45; const tt = _taperTube(am, o.an, 6); b.add(tt.mesh);
    const sp = hexCrystal(0.04, 0.08, 0.14, M.crystal); b.add(sp);
    arms.push({ tt, sp, a, big: i < o.bigArms, ph: i * 1.9, len: o.armLen * (0.8 + 0.4 * _hz(i, o.seed, 2)), pts: Array.from({ length: o.an }, () => new T.Vector3()), rad: new Array(o.an) }); }
  const shards = []; if (o.shards) for (const s of [-1, 1]) { const c = hexCrystal(0.08, 0.18, 0.24, M.crystal); const sg = G(); sg.add(c); b.add(sg); shards.push({ sg, s }); }
  const L = new T.PointLight(0xffffff, 0.6, 4, 2); L.color.set(EL.color); L.position.set(0, dY, 0.4); b.add(L); LIGHTS.push(L);
  return { g, core: dY * (o.S || 1) + 0.15, update(t, act) { const ph = 1.6 * t, ac = act || 0;
    b.position.y = 0.025 * Math.sin(ph); shell.position.y = sy + 0.02 * Math.sin(ph * 2 + 1); d.rotation.y = ph * 0.6; dc.rotation.y = -ph * 0.6; dg.scale.setScalar(o.dR * (9 + 3 * Math.sin(ph * 3) + 5 * ac));
    for (const A of arms) { const sa = Math.sin(A.a), ca = Math.cos(A.a), N = o.an, bx = sa * R * 0.55, by = hv * 0.5, bz = ca * R * 0.55;
      const reach = A.len * (1 + 0.5 * ac * (A.big ? 1.4 : 1)), fwd = (A.big ? 0.8 : 0.3) + 0.9 * ac * (A.big ? 1 : 0.5);
      let px = bx, py = by, pz = bz, dx = sa * 0.9, dy = -0.35 + (A.big ? 0.25 : 0), dz = ca * 0.7 + fwd;
      for (let k = 0; k < N; k++) { const u = k / (N - 1), zig = (k % 2 ? 1 : -1) * o.armAmp * (0.5 + 0.5 * Math.sin(ph * 4 + A.ph + k * 1.3)) * (0.3 + u), r = o.armR * (A.big ? 1.25 : 1) * (1 - 0.86 * Math.pow(u, 1.0)) + 0.012;
        A.rad[k] = r; A.pts[k].set(px + zig * Math.cos(A.a + 1.4), Math.max(r, py + zig * 0.3), pz + zig * Math.sin(A.a + 1.4));
        const st = reach / N, Lh = Math.hypot(dx, dy, dz); px += dx / Lh * st; py += dy / Lh * st; pz += dz / Lh * st; if (py <= r + 0.02) { py = r + 0.02; dy = Math.max(0, dy) * 0.3; } else dy -= o.armDroop * st; }
      A.tt.set(A.pts, A.rad); const e = A.pts[N - 1]; A.sp.position.copy(e); A.sp.rotation.set(ph * 5 + A.ph, ph * 3, 0); A.sp.scale.setScalar(1 + 0.4 * Math.sin(ph * 6 + A.ph) + 0.8 * ac); }
    for (const s of shards) { const a = ph + (s.s > 0 ? 0 : PI); s.sg.position.set(s.s * o.shardR + Math.sin(a) * 0.05, hv + H * 0.7 + 0.06 * Math.sin(ph * 2 + s.s) - 0.1 * ac, 0.1 + 0.1 * Math.cos(a)); s.sg.rotation.set(0.2 * Math.sin(ph), a, s.s * 0.25); } } };
}
const _sbk = { hover: 0.4, H: 0.95, R: 0.62, dR: 0.13, arms: 5, bigArms: 2, armArc: 4.8, armCentre: 0, an: 11, armLen: 0.95, armR: 0.12, armAmp: 0.08, armDroop: 0.5, seed: 3, shards: true, shardR: 0.72 };
fx(263, "Pyramid shell, five thick arms.", () => _shellBrawler(Object.assign({}, _sbk)));
fx(264, "Pyramid shell, four very thick arms.", () => _shellBrawler(Object.assign({}, _sbk, { arms: 4, armR: 0.16, armLen: 0.85, armArc: 3.6, seed: 5 })));
fx(265, "Pyramid shell, six arms.", () => _shellBrawler(Object.assign({}, _sbk, { arms: 6, armR: 0.1, armLen: 1.0, armArc: 5.2, seed: 7 })));
fx(266, "Tall pyramid shell.", () => _shellBrawler(Object.assign({}, _sbk, { H: 1.3, R: 0.55, hover: 0.42, seed: 9 })));
fx(267, "Low wide pyramid shell.", () => _shellBrawler(Object.assign({}, _sbk, { H: 0.68, R: 0.82, hover: 0.34, armLen: 1.1, seed: 11 })));
fx(268, "Pyramid shell raised high, diamond showing.", () => _shellBrawler(Object.assign({}, _sbk, { hover: 0.62, dR: 0.17, seed: 13 })));
fx(269, "Pyramid shell, long reaching arms.", () => _shellBrawler(Object.assign({}, _sbk, { armLen: 1.4, an: 14, armR: 0.1, armAmp: 0.1, seed: 15 })));
fx(270, "Pyramid shell, no shards.", () => _shellBrawler(Object.assign({}, _sbk, { shards: false, arms: 5, seed: 17 })));
fx(271, "Pyramid shell, arms spread wide, drooping.", () => _shellBrawler(Object.assign({}, _sbk, { armArc: 5.6, bigArms: 0, armDroop: 0.9, armLen: 1.05, seed: 19 })));
fx(272, "Pyramid shell, big diamond, three giant arms.", () => _shellBrawler(Object.assign({}, _sbk, { arms: 3, bigArms: 2, armR: 0.2, armLen: 0.9, armArc: 2.8, dR: 0.18, hover: 0.5, seed: 21 })));

// ── Square and fun (Nos. 273–282): the pyramid shell again, with CHUNKY SQUARE tentacles: square-section tubes, shaded in flat facets, glowing collar rings at
// the joints, a bouncy wave instead of a zigzag, curling at the tip, and a blocky glowing fist. ──
const _UPV = new T.Vector3(0, 1, 0);
function _squareBrawler(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const hv = o.hover, H = o.H, R = o.R, sy = hv + H / 2;
  const shell = new T.Mesh(new T.ConeGeometry(R, H, 4, 1, true), _stormCloak); shell.rotation.y = PI / 4; shell.position.y = sy; b.add(shell);
  _pyrEdges(b, 0.001, R, hv + H, hv, 0.03);
  const hem = new T.Mesh(new T.TorusGeometry(R, 0.032, 4, 4), _boltSilver); hem.rotation.set(PI / 2, 0, PI / 4); hem.position.y = hv; b.add(hem);
  const under = new T.Mesh(new T.ConeGeometry(R * 0.98, H * 0.98, 4, 1, true), new T.MeshBasicMaterial({ color: 0x010206, side: T.BackSide })); under.rotation.y = PI / 4; under.position.y = sy; b.add(under);
  // bolt armour lying ON the faces (front and right): the face's apothem is 0.707 R at the base, shrinking to the apex
  const ap = R * Math.SQRT1_2, phi = Math.atan(ap / H);
  for (const az of [0, PI / 2]) { const fg = G(); fg.rotation.y = az; b.add(fg); const u = 0.62, bl = boltArmour(H * 0.5, ap * 0.5, 0.03);
    bl.position.set(ap * 0.04, hv + H * u, ap * (1 - u) + 0.015); bl.rotation.set(-phi, 0, PI); fg.add(bl);
    const seam = boltPlate(H * 0.4, ap * 0.28, 0.012, M.glow); seam.position.set(-ap * 0.32, hv + H * 0.4, ap * 0.6 + 0.012); seam.rotation.set(-phi, 0, PI); fg.add(seam); }
  const apex = hexCrystal(0.045, 0.08, 0.13, M.crystal); apex.position.y = hv + H + 0.09; b.add(apex);
  const dY = hv * 0.55, d = hexCrystal(o.dR * 1.1, o.dR * 0.7, o.dR * 1.7, M.crystal); d.position.y = dY; b.add(d); const dc = hexCrystal(o.dR * 0.55, o.dR * 0.4, o.dR * 1.0, M.glow); dc.position.y = dY; b.add(dc);
  const dg = glowSprite(o.dR * 9); dg.position.y = dY; b.add(dg);
  // the tentacles
  const flat = new T.MeshStandardMaterial({ color: new T.Color(0x7a5200), emissive: new T.Color(0xffa800).multiplyScalar(0.28), emissiveIntensity: 1.0, roughness: 0.6, metalness: 0.1, flatShading: true });
  const bandMat = new T.MeshStandardMaterial({ color: new T.Color(0xc89000), emissive: new T.Color(0xffd000).multiplyScalar(0.6), emissiveIntensity: 1.0, roughness: 0.5, flatShading: true });
  const arms = []; for (let i = 0; i < o.arms; i++) { const a = -o.armArc / 2 + (o.arms > 1 ? i / (o.arms - 1) : 0.5) * o.armArc + (o.armCentre || 0) + (_hz(i, o.seed, 1) - 0.5) * 0.35; const tt = _taperTube(flat, o.an, 4); b.add(tt.mesh);
    const fist = cbox(1, 1, 1, 0.12, bandMat); b.add(fist); const bands = []; for (let k = 0; k < o.bands; k++) { const bn = cbox(1, 0.5, 1, 0.08, bandMat); b.add(bn); bands.push(bn); }
    arms.push({ tt, fist, bands, a, big: i < o.bigArms, ph: i * 1.9, len: o.armLen * (0.85 + 0.3 * _hz(i, o.seed, 2)), pts: Array.from({ length: o.an }, () => new T.Vector3()), rad: new Array(o.an) }); }
  const shards = []; if (o.shards) for (const s of [-1, 1]) { const c = hexCrystal(0.08, 0.18, 0.24, M.crystal); const sg = G(); sg.add(c); b.add(sg); shards.push({ sg, s }); }
  const L = new T.PointLight(0xffffff, 0.6, 4, 2); L.color.set(EL.color); L.position.set(0, dY, 0.4); b.add(L); LIGHTS.push(L);
  const tan = new T.Vector3(), q = new T.Quaternion();
  return { g, core: dY * (o.S || 1) + 0.15, update(t, act) { const ph = 1.6 * t, ac = act || 0;
    b.position.y = 0.025 * Math.sin(ph); shell.position.y = sy + 0.02 * Math.sin(ph * 2 + 1); d.rotation.y = ph * 0.6; dc.rotation.y = -ph * 0.6; dg.scale.setScalar(o.dR * (9 + 3 * Math.sin(ph * 3) + 5 * ac));
    for (const A of arms) { const sa = Math.sin(A.a), ca = Math.cos(A.a), N = o.an, bx = sa * R * 0.55, by = hv * 0.5, bz = ca * R * 0.55;
      const reach = A.len * (1 + 0.45 * ac * (A.big ? 1.4 : 1)), fwd = (A.big ? 0.7 : 0.25) + 0.9 * ac * (A.big ? 1 : 0.5);
      let px = bx, py = by, pz = bz, dx = sa * 0.9, dy = -0.3 + (A.big ? 0.25 : 0), dz = ca * 0.7 + fwd;
      for (let k = 0; k < N; k++) { const u = k / (N - 1), wave = Math.sin(ph * 2 + A.ph + u * o.waves) * o.armAmp * (0.3 + u), r = o.armR * (A.big ? 1.2 : 1) * (1 - 0.6 * Math.pow(u, 1.2)) + 0.02;
        A.rad[k] = r; A.pts[k].set(px + wave * Math.cos(A.a + 1.4), Math.max(r, py + 0.4 * wave * Math.sin(ph + A.ph)), pz + wave * Math.sin(A.a + 1.4));
        const st = reach / N, Lh = Math.hypot(dx, dy, dz); px += dx / Lh * st; py += dy / Lh * st; pz += dz / Lh * st; if (py <= r + 0.02) { py = r + 0.02; dy = Math.max(0, dy) * 0.3; } else dy -= o.armDroop * st; if (u > o.curlFrom) dy += o.curl * st; }
      A.tt.set(A.pts, A.rad);
      for (let k = 0; k < A.bands.length; k++) { const idx = Math.round((k + 1) / (A.bands.length + 1) * (N - 2)), p = A.pts[idx], p2 = A.pts[idx + 1]; tan.subVectors(p2, p).normalize(); q.setFromUnitVectors(_UPV, tan);
        A.bands[k].position.copy(p); A.bands[k].quaternion.copy(q); const rr = A.rad[idx] * 1.2; A.bands[k].scale.set(rr * 2, rr * 0.7, rr * 2); }
      const e = A.pts[N - 1], e2 = A.pts[N - 2]; tan.subVectors(e, e2).normalize(); q.setFromUnitVectors(_UPV, tan); A.fist.position.copy(e); A.fist.quaternion.copy(q); const fr = (A.rad[N - 1] + 0.03) * (1.0 + 0.5 * ac + 0.08 * Math.sin(ph * 5 + A.ph)); A.fist.scale.set(fr * 1.7, fr * 1.5, fr * 1.7); }
    for (const s of shards) { const a = ph + (s.s > 0 ? 0 : PI); s.sg.position.set(s.s * o.shardR + Math.sin(a) * 0.05, hv + H * 0.7 + 0.06 * Math.sin(ph * 2 + s.s) - 0.1 * ac, 0.1 + 0.1 * Math.cos(a)); s.sg.rotation.set(0.2 * Math.sin(ph), a, s.s * 0.25); } } };
}
const _sq = { hover: 0.42, H: 0.95, R: 0.62, dR: 0.13, arms: 5, bigArms: 2, armArc: 4.8, armCentre: 0, an: 12, armLen: 1.0, armR: 0.16, armAmp: 0.14, waves: 6, armDroop: 0.45, curlFrom: 0.6, curl: 1.8, bands: 3, seed: 3, shards: true, shardR: 0.72 };
fx(273, "Square tentacles, five, collared.", () => _squareBrawler(Object.assign({}, _sq)));
fx(274, "Square tentacles, four fat ones.", () => _squareBrawler(Object.assign({}, _sq, { arms: 4, armR: 0.17, armLen: 0.9, armArc: 3.6, bands: 2, seed: 5 })));
fx(275, "Square tentacles, six, many collars.", () => _squareBrawler(Object.assign({}, _sq, { arms: 6, armR: 0.11, bands: 5, an: 14, armArc: 5.2, seed: 7 })));
fx(276, "Square tentacles, big curled tips.", () => _squareBrawler(Object.assign({}, _sq, { curl: 3.5, curlFrom: 0.5, armLen: 1.1, seed: 9 })));
fx(277, "Square tentacles, bouncy waves.", () => _squareBrawler(Object.assign({}, _sq, { armAmp: 0.24, waves: 9, armLen: 1.15, seed: 11 })));
fx(278, "Square tentacles, short and stubby.", () => _squareBrawler(Object.assign({}, _sq, { armLen: 0.7, armR: 0.16, bands: 2, curl: 2.5, seed: 13 })));
fx(279, "Square tentacles, tall shell.", () => _squareBrawler(Object.assign({}, _sq, { H: 1.25, R: 0.55, seed: 15 })));
fx(280, "Square tentacles, low wide shell.", () => _squareBrawler(Object.assign({}, _sq, { H: 0.7, R: 0.82, hover: 0.36, seed: 17 })));
fx(281, "Square tentacles, no shards, big fists.", () => _squareBrawler(Object.assign({}, _sq, { shards: false, armR: 0.15, seed: 19 })));
fx(282, "Square tentacles, three giant ones.", () => _squareBrawler(Object.assign({}, _sq, { arms: 3, bigArms: 2, armR: 0.21, armLen: 0.95, armArc: 2.8, bands: 3, dR: 0.17, seed: 21 })));

// ── Square wave (Nos. 283–292): the electric brawler's arms are conduits that run in a SQUARE-WAVE path, right-angle steps like a waveform on a scope, a dark steel
// housing with a glowing core strip along its top, the wave travelling down the arm. Square-wave traces on the shell too. Harder, less cartoony. ──
function _sqWaveBrawler(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const hv = o.hover, H = o.H, R = o.R, sy = hv + H / 2;
  const shell = new T.Mesh(new T.ConeGeometry(R, H, 4, 1, true), _stormCloak); shell.rotation.y = PI / 4; shell.position.y = sy; b.add(shell);
  _pyrEdges(b, 0.001, R, hv + H, hv, 0.03);
  const hem = new T.Mesh(new T.TorusGeometry(R, 0.032, 4, 4), _boltSilver); hem.rotation.set(PI / 2, 0, PI / 4); hem.position.y = hv; b.add(hem);
  const under = new T.Mesh(new T.ConeGeometry(R * 0.98, H * 0.98, 4, 1, true), new T.MeshBasicMaterial({ color: 0x010206, side: T.BackSide })); under.rotation.y = PI / 4; under.position.y = sy; b.add(under);
  const coreMat = new T.MeshBasicMaterial({ color: new T.Color(EL.color).lerp(new T.Color(0xffffff), 0.3), toneMapped: false });
  // square-wave traces etched on the front and right faces, and (option) the bolt armour
  const ap = R * Math.SQRT1_2, phi = Math.atan(ap / H);
  for (const az of [0, PI / 2]) { const fg = G(); fg.rotation.y = az; b.add(fg);
    for (let j = 0; j < o.traces; j++) { const u = 0.18 + j * (0.6 / Math.max(1, o.traces - 1)), wFace = 2 * ap * (1 - u) * 0.82, n = Math.max(2, Math.round(wFace / o.traceStep)), amp = 0.03, tg = G(); tg.position.set(0, hv + H * u, ap * (1 - u) + 0.012); tg.rotation.x = -phi; fg.add(tg);
      for (let k = 0; k < n; k++) { const x0 = -wFace / 2 + k * wFace / n, x1 = x0 + wFace / n, lv = (k % 2 ? 1 : -1) * amp;
        const run = new T.Mesh(new T.BoxGeometry(x1 - x0 + 0.012, 0.012, 0.012), coreMat); run.position.set((x0 + x1) / 2, lv, 0); tg.add(run);
        if (k) { const rs = new T.Mesh(new T.BoxGeometry(0.012, amp * 2 + 0.012, 0.012), coreMat); rs.position.set(x0, 0, 0); tg.add(rs); } } }
    if (o.bolts) { const bl = boltArmour(H * 0.4, ap * 0.4, 0.03); bl.position.set(ap * 0.02, hv + H * 0.66, ap * 0.34 + 0.015); bl.rotation.set(-phi, 0, PI); fg.add(bl); } }
  const apex = hexCrystal(0.045, 0.08, 0.13, M.crystal); apex.position.y = hv + H + 0.09; b.add(apex);
  const dY = hv * 0.55, d = hexCrystal(o.dR * 1.1, o.dR * 0.7, o.dR * 1.7, M.crystal); d.position.y = dY; b.add(d); const dc = hexCrystal(o.dR * 0.55, o.dR * 0.4, o.dR * 1.0, M.glow); dc.position.y = dY; b.add(dc);
  const dg = glowSprite(o.dR * 9); dg.position.y = dY; b.add(dg);
  // the arms: pools of boxes (housing + core strip), repositioned each frame as the wave travels
  const hous = _stormCloak.clone(); hous.color.set(0x070b1c); hous.metalness = 0.8; hous.roughness = 0.35;
  const NB = o.boxes, arms = []; for (let i = 0; i < o.arms; i++) { const a = -o.armArc / 2 + (o.arms > 1 ? i / (o.arms - 1) : 0.5) * o.armArc + (o.armCentre || 0) + (_hz(i, o.seed, 1) - 0.5) * 0.3, pool = [];
    for (let k = 0; k < NB; k++) { const hm = new T.Mesh(new T.BoxGeometry(1, 1, 1), hous), cm = new T.Mesh(new T.BoxGeometry(1, 1, 1), coreMat); b.add(hm); b.add(cm); pool.push({ hm, cm }); }
    const plug = cbox(1, 1, 1, 0.1, coreMat); b.add(plug), sp = hexCrystal(0.03, 0.06, 0.1, M.crystal); b.add(sp);
    arms.push({ a, pool, plug, sp, big: i < o.bigArms, ph: i * 1.3, len: o.armLen * (0.85 + 0.3 * _hz(i, o.seed, 2)) }); }
  const shards = []; if (o.shards) for (const s of [-1, 1]) { const c = hexCrystal(0.08, 0.18, 0.24, M.crystal); const sg = G(); sg.add(c); b.add(sg); shards.push({ sg, s }); }
  const L = new T.PointLight(0xffffff, 0.6, 4, 2); L.color.set(EL.color); L.position.set(0, dY, 0.4); b.add(L); LIGHTS.push(L);
  const dir = new T.Vector3(), P = new T.Vector3();
  const setBox = (m, cx, cy, cz, sx, sy2, sz, yaw) => { m.visible = true; m.position.set(cx, cy, cz); m.rotation.set(0, yaw, 0); m.scale.set(sx, sy2, sz); };
  return { g, core: dY * (o.S || 1) + 0.15, update(t, act) { const ph = 1.6 * t, ac = act || 0;
    b.position.y = 0.025 * Math.sin(ph); shell.position.y = sy + 0.02 * Math.sin(ph * 2 + 1); d.rotation.y = ph * 0.6; dc.rotation.y = -ph * 0.6; dg.scale.setScalar(o.dR * (9 + 3 * Math.sin(ph * 3) + 5 * ac));
    for (const A of arms) { const sa = Math.sin(A.a), ca = Math.cos(A.a); const fwd = (A.big ? 0.55 : 0.2) + 0.7 * ac * (A.big ? 1 : 0.5);
      dir.set(sa * 0.9, 0, ca * 0.7 + fwd).normalize(); const yaw = Math.atan2(dir.x, dir.z), sdx = dir.z, sdz = -dir.x, L2 = A.len * (1 + 0.4 * ac * (A.big ? 1.3 : 1)), lam = o.lam, wph = -ph * o.speed * 2 + A.ph;
      const bx = sa * R * 0.5, bz = ca * R * 0.5, y0 = hv * 0.55, th0 = o.armT * (A.big ? 1.3 : 1);
      const yAt = s => Math.max(th0 * 0.5, y0 * (1 - Math.min(1, s / 0.38)) + th0 * 0.5 * Math.min(1, s / 0.38));
      const ampAt = s => o.amp * (0.45 + 0.55 * Math.min(1, s / 0.4)) * (1 - 0.35 * s / L2), tAt = s => th0 * (1 - 0.45 * s / L2);
      // breakpoints: where the wave steps (sin changes sign), within (0, L2)
      const bp = [0]; for (let k = -2; k < 60; k++) { const s = lam * (k * PI + wph) / (2 * PI); if (s > 0.02 && s < L2 - 0.02) bp.push(s); } bp.push(L2); bp.sort((p, q) => p - q);
      let u = 0; for (const e of A.pool) { e.hm.visible = false; e.cm.visible = false; }
      const put = (cx, cy, cz, sx, sy2, sz, yw, topY) => { if (u >= NB) return; const e = A.pool[u++]; setBox(e.hm, cx, cy, cz, sx, sy2, sz, yw); setBox(e.cm, cx, cy + sy2 * 0.5 + 0.004, cz, sx * 0.4, 0.014, sz * 0.96, yw); };
      for (let i = 0; i < bp.length - 1; i++) { const sa2 = bp[i], sb = bp[i + 1], mid = (sa2 + sb) / 2, lv = Math.sin(2 * PI * mid / lam - wph) >= 0 ? 1 : -1, off = lv * ampAt(mid), tt = tAt(mid);
        put(bx + dir.x * mid + sdx * off, yAt(mid), bz + dir.z * mid + sdz * off, tt, tt, (sb - sa2) + tt, yaw);
        if (i > 0) { const sS = bp[i], ao = ampAt(sS), t2 = tAt(sS); put(bx + dir.x * sS, yAt(sS), bz + dir.z * sS, t2, t2, 2 * ao + t2, yaw + PI / 2); } }
      const sE = L2, offE = (Math.sin(2 * PI * sE / lam - wph) >= 0 ? 1 : -1) * ampAt(sE), pxE = bx + dir.x * sE + sdx * offE, pzE = bz + dir.z * sE + sdz * offE, tE = tAt(sE) * (1.6 + 0.6 * ac);
      A.plug.position.set(pxE, yAt(sE), pzE); A.plug.rotation.y = yaw; A.plug.scale.set(tE, tE, tE * 1.2); A.sp.position.set(pxE + dir.x * 0.06, yAt(sE) + 0.04, pzE + dir.z * 0.06); A.sp.rotation.set(ph * 5 + A.ph, ph * 3, 0); A.sp.scale.setScalar(1 + 0.4 * Math.sin(ph * 6 + A.ph) + 0.8 * ac); }
    for (const s of shards) { const a = ph + (s.s > 0 ? 0 : PI); s.sg.position.set(s.s * o.shardR + Math.sin(a) * 0.05, hv + H * 0.7 + 0.06 * Math.sin(ph * 2 + s.s) - 0.1 * ac, 0.1 + 0.1 * Math.cos(a)); s.sg.rotation.set(0.2 * Math.sin(ph), a, s.s * 0.25); } } };
}
const _sw = { hover: 0.42, H: 0.95, R: 0.62, dR: 0.13, arms: 5, bigArms: 2, armArc: 4.8, armCentre: 0, armLen: 1.05, armT: 0.075, amp: 0.15, lam: 0.42, speed: 1.0, boxes: 26, traces: 3, traceStep: 0.12, bolts: true, seed: 3, shards: true, shardR: 0.72 };
fx(283, "Square-wave arms, five, bolt armour.", () => _sqWaveBrawler(Object.assign({}, _sw)));
fx(284, "Square-wave arms, four thick conduits.", () => _sqWaveBrawler(Object.assign({}, _sw, { arms: 4, armT: 0.1, armArc: 3.6, armLen: 0.95, lam: 0.5, seed: 5 })));
fx(285, "Square-wave arms, six, tight wave.", () => _sqWaveBrawler(Object.assign({}, _sw, { arms: 6, armT: 0.06, lam: 0.3, amp: 0.1, armArc: 5.2, boxes: 34, seed: 7 })));
fx(286, "Square-wave arms, wide steps.", () => _sqWaveBrawler(Object.assign({}, _sw, { lam: 0.7, amp: 0.22, armLen: 1.2, seed: 9 })));
fx(287, "Square-wave arms, no bolts, traces only.", () => _sqWaveBrawler(Object.assign({}, _sw, { bolts: false, traces: 4, traceStep: 0.09, seed: 11 })));
fx(288, "Square-wave arms, fast wave, short.", () => _sqWaveBrawler(Object.assign({}, _sw, { speed: 2.0, armLen: 0.8, lam: 0.34, seed: 13 })));
fx(289, "Square-wave arms, tall shell.", () => _sqWaveBrawler(Object.assign({}, _sw, { H: 1.25, R: 0.55, seed: 15 })));
fx(290, "Square-wave arms, low wide shell.", () => _sqWaveBrawler(Object.assign({}, _sw, { H: 0.7, R: 0.82, hover: 0.36, seed: 17 })));
fx(291, "Square-wave arms, no shards, heavy front pair.", () => _sqWaveBrawler(Object.assign({}, _sw, { shards: false, bigArms: 2, armT: 0.085, seed: 19 })));
fx(292, "Square-wave arms, three giant conduits.", () => _sqWaveBrawler(Object.assign({}, _sw, { arms: 3, bigArms: 2, armT: 0.12, armLen: 0.95, armArc: 2.8, lam: 0.55, amp: 0.2, dR: 0.17, seed: 21 })));

// ── The hood pyramid (Nos. 293–302): the electric brawler, stripped back. A solid black HOLLOW pyramid, open on its front face like a hood, and a diamond
// crystal floating inside it, visible when the hood faces you. No lightning, no arms (for now). o.yaw only turns the mock-up sheet toward the camera. ──
const _hoodBlack = new T.MeshStandardMaterial({ color: 0x030308, metalness: 0.4, roughness: 0.5, flatShading: true, side: T.DoubleSide }); _hoodBlack.envMapIntensity = 0.45;   // glossy black: its faces show as highlights
// Diamond cuts: a faceted body with its facet lines drawn, and a glowing core inside it. r = size.
function _facetLathe(pts, seg, r, mat) { const geo = new T.LatheGeometry(pts.map(p => new T.Vector2(Math.max(0.0001, p[0] * r), p[1] * r)), seg), g = G(); g.add(new T.Mesh(geo, mat || M.crystal)); g.add(new T.LineSegments(new T.EdgesGeometry(geo, 15), _edgeMat)); return g; }
function _diamond(cut, r) {
  const core = (pts, seg) => _facetLathe(pts.map(p => [p[0] * 0.55, p[1] * 0.55]), seg, r, M.glow);
  if (cut === 'brilliant') { const P = [[0, -1.2], [1.0, 0], [0.98, 0.04], [0.7, 0.42], [0, 0.42]]; return { main: _facetLathe(P, 8, r), core: core(P, 8) }; }
  if (cut === 'kite') { const P = [[0, -1.8], [0.5, -0.1], [0.5, 0.2], [0, 1.4]]; return { main: _facetLathe(P, 6, r), core: core(P, 6) }; }
  if (cut === 'emerald') { const P = [[0, -0.95], [0.55, -0.7], [0.8, -0.35], [0.8, 0.25], [0.62, 0.5], [0.38, 0.65], [0, 0.65]]; return { main: _facetLathe(P, 8, r), core: core(P, 8) }; }
  if (cut === 'ring') { const P = [[0, -1.6], [0.9, 0], [0, 1.6]], m = _facetLathe(P, 6, r), ring = new T.Mesh(new T.TorusGeometry(r * 1.0, r * 0.07, 4, 6), _boltSilver); ring.rotation.x = PI / 2; m.add(ring); return { main: m, core: core(P, 6) }; }
  if (cut === 'cluster') { const m = G(); const c0 = hexCrystal(r * 0.8, r * 0.5, r * 1.5, M.crystal); m.add(c0); for (const [x, z, rz, sc] of [[-0.55, 0.05, 0.5, 0.6], [0.55, -0.05, -0.55, 0.6], [0.05, 0.4, 0.0, 0.5]]) { const c = hexCrystal(r * 0.8 * sc, r * 0.5 * sc, r * 1.5 * sc, M.crystal); c.position.set(x * r, -0.1 * r, z * r); c.rotation.z = rz; c.rotation.x = z > 0.2 ? 0.7 : 0; m.add(c); } return { main: m, core: hexCrystal(r * 0.4, r * 0.3, r * 0.8, M.glow) }; }
  if (cut === 'octa') { const geo = new T.OctahedronGeometry(r * 1.2, 0), m = G(), mm = new T.Mesh(geo, M.crystal); mm.scale.y = 1.35; m.add(mm); const le = new T.LineSegments(new T.EdgesGeometry(geo), _edgeMat); le.scale.y = 1.35; m.add(le); const cm = new T.Mesh(geo, M.glow); cm.scale.set(0.5, 0.7, 0.5); return { main: m, core: cm }; }
  return { main: hexCrystal(r * 1.1, r * 0.7, r * 1.7, M.crystal), core: hexCrystal(r * 0.55, r * 0.4, r * 1.0, M.glow) };
}
function _hoodPyramid(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S); b.rotation.y = o.yaw || 0;
  const hv = o.hover, H = o.H, R = o.R, tilt = o.tilt || 0;
  const pv = G(); pv.rotation.x = tilt; pv.position.set(0, hv, 0); b.add(pv);   // tips forward a little, like a hood bowed toward you
  // three faces: the front (+z) one is missing. A square pyramid cut into 3 segments of 90 degrees each.
  const hood = new T.Mesh(new T.ConeGeometry(R, H, 3, 1, true, PI / 4, 3 * PI / 2), _hoodBlack); hood.position.y = H / 2; pv.add(hood);
  // the open front's two edges, and the rim: dark steel, or silver
  const trim = o.silver ? _boltSilver : _hoodBlack;
  for (const k of [0, 1, 2, 3]) { const a = PI / 4 + k * PI / 2, bar = limb(o.trim || 0.022, trim); setLink(bar, new T.Vector3(Math.sin(a) * R, 0, Math.cos(a) * R), new T.Vector3(0, H, 0)); pv.add(bar); }
  for (const k of [0, 1, 2, 3]) { const a0 = PI / 4 + k * PI / 2, a1 = a0 + PI / 2; if (k === 3) continue; const p0 = new T.Vector3(Math.sin(a0) * R, 0, Math.cos(a0) * R), p1 = new T.Vector3(Math.sin(a1) * R, 0, Math.cos(a1) * R), bar = limb(o.trim || 0.022, trim); setLink(bar, p0, p1); pv.add(bar); }
  // a drooping brim: the front face comes back as a flap hanging from the apex, its lower edge sagging to a point, so the top of the hollow is covered
  if (o.flap) { const apex = new T.Vector3(0, H, 0), cL = new T.Vector3(-R * Math.SQRT1_2, 0, R * Math.SQRT1_2), cR = new T.Vector3(R * Math.SQRT1_2, 0, R * Math.SQRT1_2), f = o.flap;
    const pL = apex.clone().lerp(cL, f), pR = apex.clone().lerp(cR, f), pM = pL.clone().lerp(pR, 0.5).add(new T.Vector3(0, -(o.flapDrop || 0.14), o.flapBow || 0.08));
    pL.z += (o.flapBow || 0.08) * 0.4; pR.z += (o.flapBow || 0.08) * 0.4;
    const fg = new T.BufferGeometry(); fg.setAttribute('position', new T.Float32BufferAttribute([apex.x, apex.y, apex.z, pL.x, pL.y, pL.z, pM.x, pM.y, pM.z, apex.x, apex.y, apex.z, pM.x, pM.y, pM.z, pR.x, pR.y, pR.z], 3)); fg.computeVertexNormals();
    pv.add(new T.Mesh(fg, _hoodBlack)); const tb = limb(o.trim || 0.022, trim); setLink(tb, pL, pM); pv.add(tb); const tb2 = limb(o.trim || 0.022, trim); setLink(tb2, pM, pR); pv.add(tb2); }
  const tip = hexCrystal(0.04, 0.07, 0.12, M.crystal); tip.position.y = H + 0.08; if (o.tipCrystal) pv.add(tip);
  // the diamond inside, floating in the hollow, lit so it glows and lights the inner walls
  const dY = o.dY == null ? H * 0.34 : o.dY, dz = o.dZ == null ? 0.0 : o.dZ, dm = _diamond(o.cut, o.dR), d = dm.main; d.position.set(0, dY, dz); pv.add(d);
  const dc = dm.core; dc.position.set(0, dY, dz); pv.add(dc); const dg = glowSprite(o.dR * 8); dg.position.set(0, dY, dz); pv.add(dg);
  const L = new T.PointLight(0xffffff, 1.4, 3.2, 2); L.color.set(EL.color); L.position.set(0, dY, dz + 0.1); pv.add(L); LIGHTS.push(L);
  const shards = []; if (o.shards) for (const s of [-1, 1]) { const c = hexCrystal(0.07, 0.16, 0.22, M.crystal); const sg = G(); sg.add(c); b.add(sg); shards.push({ sg, s }); }
  // IRREGULAR BLACK SHARDS GROWN FROM THE COAT: rooted in the pyramid's faces and ridges, each its own size, angle and shape
  const jolts = [];   // the coat's shards, to be jolted
  if (o.attached) { const A = o.attached, UPV2 = new T.Vector3(0, 1, 0), faces = [PI / 2, PI, -PI / 2], A0 = R * Math.SQRT1_2, rn = (i, k) => _hz(i * 5 + 1, A.seed + k * 11, k);
    const shapeK = A.shape || 'cone', mkShard = (len, r, i) => { const geo = shapeK === 'hex' ? new T.CylinderGeometry(r * 0.3, r, len, 6, 1) : new T.ConeGeometry(r, len, 4 + Math.floor(rn(i, 40) * 3), 1), p = geo.attributes.position; for (let v = 0; v < p.count; v++) { const x = p.getX(v), y = p.getY(v), z = p.getZ(v), n = _hz(Math.round(x * 400) + i, Math.round(y * 400), Math.round(z * 400)); p.setXYZ(v, x * (0.7 + 0.6 * n) * (shapeK === 'blade' ? 2.4 : shapeK === 'needle' ? 0.5 : 1), y, z * (0.7 + 0.6 * (1 - n)) * (shapeK === 'blade' ? 0.3 : shapeK === 'needle' ? 0.5 : 1)); } geo.translate(0, len / 2, 0); geo.computeVertexNormals(); return new T.Mesh(geo, _hoodBlack); };
    for (let i = 0; i < A.n; i++) { const ridge = rn(i, 1) < (A.ridge || 0), u = A.uMin + (A.uMax - A.uMin) * rn(i, 2), len = A.len[0] + (A.len[1] - A.len[0]) * Math.pow(rn(i, 3), A.skew || 1), r = len * (0.16 + 0.14 * rn(i, 4)) * (A.fat || 1);
      let pos, nrm; if (ridge) { const a = [3 * PI / 4, 5 * PI / 4, PI / 4, -PI / 4][Math.floor(rn(i, 5) * (A.front ? 4 : 2))], rad = R * (1 - u); pos = new T.Vector3(Math.sin(a) * rad, u * H, Math.cos(a) * rad); nrm = new T.Vector3(Math.sin(a) * H * 0.7, A0 * 0.9, Math.cos(a) * H * 0.7).normalize(); }
      else { const az = faces[Math.floor(rn(i, 5) * faces.length)], a0 = A0 * (1 - u), t = (rn(i, 6) * 2 - 1) * a0 * 0.85, rv = new T.Vector3(Math.sin(az), 0, Math.cos(az)), lv = new T.Vector3(Math.cos(az), 0, -Math.sin(az));
        pos = rv.clone().multiplyScalar(a0).addScaledVector(lv, t).add(new T.Vector3(0, u * H, 0)); nrm = rv.clone().multiplyScalar(H).add(new T.Vector3(0, A0, 0)).normalize(); }
      const dirv = nrm.clone().add(new T.Vector3((rn(i, 7) - 0.5) * 0.9, (rn(i, 8) - 0.35) * 0.7, (rn(i, 9) - 0.5) * 0.9)).normalize(), sh = mkShard(len, r, i); sh.position.copy(pos).addScaledVector(nrm, -0.03); sh.quaternion.setFromUnitVectors(UPV2, dirv); pv.add(sh); jolts.push({ m: sh, q: sh.quaternion.clone(), i: jolts.length, az: Math.atan2(sh.position.x, sh.position.z), u: sh.position.y / H, rad: new T.Vector3(sh.position.x, 0, sh.position.z).normalize() });
      if (rn(i, 10) < (A.twin || 0.3)) { const sh2 = mkShard(len * (0.45 + 0.2 * rn(i, 11)), r * 0.7, i + 100), d2 = dirv.clone().add(new T.Vector3((rn(i, 12) - 0.5) * 1.3, (rn(i, 13) - 0.5) * 1.0, (rn(i, 14) - 0.5) * 1.3)).normalize(); sh2.position.copy(sh.position).addScaledVector(nrm, 0.01); sh2.quaternion.setFromUnitVectors(UPV2, d2); pv.add(sh2); jolts.push({ m: sh2, q: sh2.quaternion.clone(), i: jolts.length, az: Math.atan2(sh2.position.x, sh2.position.z), u: sh2.position.y / H, rad: new T.Vector3(sh2.position.x, 0, sh2.position.z).normalize() }); } } }
  // exterior shards are BLACK, the coat's own material: orbiting the hood, as horns on its corners, a crown above the apex, or lying round its base
  const bsh = [], blk = (r, h, t) => hexCrystal(r, h, t, _hoodBlack);
  if (o.black === 'orbit') for (let i = 0; i < (o.blackN || 2); i++) { const gg = G(); gg.add(blk(0.07, 0.14, 0.24)); b.add(gg); bsh.push({ g: gg, orbit: true, ph: i * TAU / (o.blackN || 2), rad: o.shardR, hy: 0.5 }); }
  if (o.black === 'horns') for (let k = 0; k < 4; k++) { const a = PI / 4 + k * PI / 2, hh = G(), c = blk(0.045, 0.1, 0.26); hh.add(c); hh.position.set(Math.sin(a) * R * 0.62, H * 0.28, Math.cos(a) * R * 0.62); hh.rotation.set(Math.cos(a) * 0.9, 0, -Math.sin(a) * 0.9); pv.add(hh); }
  if (o.black === 'crown') { const c = blk(0.06, 0.12, 0.4); c.position.y = H + 0.28; pv.add(c); }
  if (o.black === 'base') for (let k = 0; k < 7; k++) { const a = k * TAU / 7 + 0.3, c = blk(0.045 + 0.02 * _hz(k, 3, 1), 0.08 + 0.05 * _hz(k, 3, 2), 0.18 + 0.1 * _hz(k, 3, 3)), hh = G(); hh.add(c); hh.position.set(Math.sin(a) * R * 1.12, 0, Math.cos(a) * R * 1.12); hh.rotation.set(Math.cos(a) * 0.5, 0, -Math.sin(a) * 0.5); hh.position.y = 0.1; b.add(hh); }
  // LIGHTNING UNDER THE HOOD, as MOVEMENT: the black shards stay black but are shoved about from beneath: every beat each one snaps to a new angle and stretches
  // in a jerk, some popping hard, the rest settling (a hash of the beat, so the 8 baked frames loop). No light, no flicker of colour.
  const _qa = new T.Quaternion(), _qb = new T.Quaternion(), _ea = new T.Euler(), jolt = (ph, ac) => { const beat = Math.floor(ph / TAU * 8 + 0.0001) % 8;
    if (o.motion) { const E = new T.Euler(), Q = new T.Quaternion();
      for (const J of jolts) { let lean = 0, side = 0, sc = 1, sx = 1;   // lean = tilt outward (+) or inward (-) along the shard's radial direction; side = tilt across it
        if (o.motion === 'ripple') { const w = 0.5 + 0.5 * Math.sin(ph * 2 - J.az - J.u * 3); sc = 1 + 0.3 * w + 0.3 * ac; lean = 0.2 * (w - 0.5); }
        else if (o.motion === 'sway') { lean = 0.2 * Math.sin(ph + J.u * 1.6 + J.az * 0.35); side = 0.12 * Math.sin(ph * 2 + J.az + J.i * 0.4); sc = 1 + 0.08 * Math.sin(ph + J.i) + 0.2 * ac; }
        else if (o.motion === 'breathe') { const w = 0.5 + 0.5 * Math.sin(ph - J.u * 2); sc = 1 + 0.3 * w + 0.3 * ac; sx = 1 + 0.12 * w; lean = 0.05 * (w - 0.5); }
        else if (o.motion === 'sweep') { const w = Math.max(0, Math.sin(ph * 2 - J.u * 5)); sc = 1 + 0.4 * w + 0.3 * ac; sx = 1 + 0.2 * w; lean = 0.18 * w; }
        else if (o.motion === 'fan') { const w = 0.5 + 0.5 * Math.sin(ph); lean = 0.36 * (w - 0.3) + 0.35 * ac; side = 0.05 * Math.sin(ph * 3 + J.az * 2); sc = 1 + 0.12 * w; }
        // lean about the axis perpendicular to the radial direction (so it leans outward/inward), side about the radial axis
        const ax = new T.Vector3(J.rad.z, 0, -J.rad.x); Q.setFromAxisAngle(ax, lean); const Q2 = new T.Quaternion().setFromAxisAngle(J.rad, side); J.m.quaternion.copy(Q).multiply(Q2).multiply(J.q); J.m.scale.set(sx, sc, sx); } return; }
    for (const J of jolts) { const h1 = _hz(J.i * 7 + beat, 3, 1), h2 = _hz(J.i * 5, beat * 9 + 1, 2), h3 = _hz(J.i, beat * 3, 3), pop = h3 > 0.55 ? 1 : 0.4, k = (0.075 + 0.1 * ac) * pop;   // SUBTLE: a few degrees, not a jolt
      _ea.set((h1 - 0.5) * 2 * k, (h2 - 0.5) * 2 * k * 0.6, (h3 - 0.5) * 2 * k); _qa.setFromEuler(_ea); J.m.quaternion.copy(J.q).multiply(_qa);
      J.m.scale.set(1 + 0.04 * pop * h1, 1 + (0.09 * pop + 0.2 * ac) * h2 + 0.02, 1 + 0.04 * pop * h1); } };
  return { g, core: (hv + dY) * (o.S || 1), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    if (o.jolt) jolt(ph, ac);
    pv.position.y = hv + 0.03 * Math.sin(ph); pv.rotation.x = tilt - 0.12 * ac; d.rotation.y = ph * 0.7; dc.rotation.y = -ph * 0.7; d.position.y = dY + 0.02 * Math.sin(ph * 2); dc.position.y = d.position.y;
    dg.scale.setScalar(o.dR * (8 + 2 * Math.sin(ph * 3) + 5 * ac)); L.intensity = 1.4 + 0.4 * Math.sin(ph * 3) + 0.8 * ac;
    for (const s of shards) { const a = ph + (s.s > 0 ? 0 : PI); s.sg.position.set(s.s * o.shardR + Math.sin(a) * 0.05, hv + H * 0.55 + 0.06 * Math.sin(ph * 2 + s.s), 0.1 + 0.1 * Math.cos(a)); s.sg.rotation.set(0.2 * Math.sin(ph), a, s.s * 0.25); }
    for (const q of bsh) if (q.orbit) { const a = ph * 0.8 + q.ph; q.g.position.set(Math.sin(a) * q.rad, hv + H * q.hy + 0.05 * Math.sin(ph * 2 + q.ph), Math.cos(a) * q.rad * 0.7 + 0.05); q.g.rotation.set(0.15 * Math.sin(ph + q.ph), a, 0.2); } } };
}
const _hp = { yaw: 0.05, hover: 0.35, H: 1.0, R: 0.62, dR: 0.15, shardR: 0.72 };
fx(293, "Hood pyramid, diamond inside.", () => _hoodPyramid(Object.assign({}, _hp)));
fx(294, "Tall hood pyramid.", () => _hoodPyramid(Object.assign({}, _hp, { H: 1.35, R: 0.55, dR: 0.15 })));
fx(295, "Low wide hood pyramid.", () => _hoodPyramid(Object.assign({}, _hp, { H: 0.72, R: 0.82, hover: 0.3, dR: 0.18 })));
fx(296, "Hood pyramid, big diamond.", () => _hoodPyramid(Object.assign({}, _hp, { dR: 0.23, R: 0.7, H: 1.05 })));
fx(297, "Hood pyramid, small diamond deep inside.", () => _hoodPyramid(Object.assign({}, _hp, { dR: 0.11, dZ: -0.12 })));
fx(298, "Hood pyramid, silver edges.", () => _hoodPyramid(Object.assign({}, _hp, { silver: true, trim: 0.026, tipCrystal: true })));
fx(299, "Hood pyramid, bowed forward.", () => _hoodPyramid(Object.assign({}, _hp, { tilt: 0.22, H: 1.05, hover: 0.4 })));
fx(300, "Hood pyramid, two shards hovering.", () => _hoodPyramid(Object.assign({}, _hp, { shards: true, tipCrystal: true })));
fx(301, "Hood pyramid, sitting on the ground.", () => _hoodPyramid(Object.assign({}, _hp, { hover: 0.02, H: 0.95, R: 0.7 })));
fx(302, "Hood pyramid, thick black rim, big opening feel.", () => _hoodPyramid(Object.assign({}, _hp, { trim: 0.05, R: 0.7, H: 0.9, dR: 0.17 })));

// ── 296 with the shell drooping over the top half of the diamond (Nos. 303–307) ──
const _hd = Object.assign({}, _hp, { dR: 0.23, R: 0.7, H: 1.05, dY: 0.4, dZ: 0.05, hover: 0.36 });
fx(303, "296, light droop.", () => _hoodPyramid(Object.assign({}, _hd, { tilt: 0.2, flap: 0.44, flapDrop: 0.1, flapBow: 0.06 })));
fx(304, "296, medium droop.", () => _hoodPyramid(Object.assign({}, _hd, { tilt: 0.32, flap: 0.5, flapDrop: 0.12, flapBow: 0.08 })));
fx(305, "296, heavy droop, hood pulled right down.", () => _hoodPyramid(Object.assign({}, _hd, { tilt: 0.42, flap: 0.55, flapDrop: 0.14, flapBow: 0.1, hover: 0.4 })));
fx(306, "296, medium droop, silver edges.", () => _hoodPyramid(Object.assign({}, _hd, { tilt: 0.32, flap: 0.5, flapDrop: 0.12, flapBow: 0.08, silver: true, trim: 0.026 })));
fx(307, "296, long pointed droop.", () => _hoodPyramid(Object.assign({}, _hd, { tilt: 0.28, flap: 0.46, flapDrop: 0.26, flapBow: 0.08 })));

// ── Different diamond cuts under the drooping hood, more of the facets showing (Nos. 308–313) ──
const _hc = Object.assign({}, _hd, { yaw: 0.6, tilt: 0.25, flap: 0.34, flapDrop: 0.06, flapBow: 0.06, dR: 0.27, dY: 0.56, dZ: 0.1, hover: 0.3 });   // turned to face the camera so the hollow and the stone show
fx(308, "Drooping hood, brilliant-cut diamond.", () => _hoodPyramid(Object.assign({}, _hc, { cut: 'brilliant' })));
fx(309, "Drooping hood, long kite-shaped diamond.", () => _hoodPyramid(Object.assign({}, _hc, { cut: 'kite', dR: 0.2, dY: 0.62 })));
fx(310, "Drooping hood, step-cut (emerald) diamond.", () => _hoodPyramid(Object.assign({}, _hc, { cut: 'emerald' })));
fx(311, "Drooping hood, a cluster of crystals.", () => _hoodPyramid(Object.assign({}, _hc, { cut: 'cluster', dR: 0.26 })));
fx(312, "Drooping hood with an arched brim, octahedron.", () => _hoodPyramid(Object.assign({}, _hc, { cut: 'octa', flapDrop: -0.12, flap: 0.38 })));
fx(313, "Drooping hood, arched brim, banded diamond.", () => _hoodPyramid(Object.assign({}, _hc, { cut: 'ring', flapDrop: -0.1, flap: 0.38, dR: 0.24 })));

// The game version of No. 312: its open front faces the way it faces (yaw 0), scaled to fill a sprite cell.
fx(314, "Drooping hood, arched brim, octahedron: the game sprite.", () => _hoodPyramid(Object.assign({}, _hc, { cut: 'octa', flapDrop: -0.12, flap: 0.38, yaw: 0, S: 1.45 })));

// ── No exterior crystals, except black ones that match the coat (Nos. 315–320). The diamond sits wholly INSIDE the hollow. ──
const _hi = Object.assign({}, _hp, { yaw: 0.6, R: 0.8, H: 1.0, tilt: 0.22, hover: 0.3, cut: 'octa', dR: 0.17, dY: 0.42, dZ: 0.02, flap: 0.36, flapDrop: -0.1, flapBow: 0.06 });
fx(315, "Diamond wholly inside the hood, no exterior shards.", () => _hoodPyramid(Object.assign({}, _hi)));
fx(316, "Two black shards orbiting the hood.", () => _hoodPyramid(Object.assign({}, _hi, { black: 'orbit', blackN: 2, shardR: 0.78 })));
fx(317, "Four black shards orbiting.", () => _hoodPyramid(Object.assign({}, _hi, { black: 'orbit', blackN: 4, shardR: 0.82 })));
fx(318, "Black shards as horns on the hood's corners.", () => _hoodPyramid(Object.assign({}, _hi, { black: 'horns' })));
fx(319, "A black crown shard above the apex.", () => _hoodPyramid(Object.assign({}, _hi, { black: 'crown' })));
fx(320, "Black shards lying round the base.", () => _hoodPyramid(Object.assign({}, _hi, { black: 'base' })));

// ── Irregular black shards grown out of the coat (Nos. 321–326) ──
const _ha = Object.assign({}, _hi, { yaw: 0.1 });
fx(321, "A few big irregular black shards from the coat.", () => _hoodPyramid(Object.assign({}, _ha, { attached: { n: 8, uMin: 0.08, uMax: 0.7, len: [0.12, 0.38], skew: 1.4, seed: 3, twin: 0.35 } })));
fx(322, "Dense small black shards all over the coat.", () => _hoodPyramid(Object.assign({}, _ha, { attached: { n: 26, uMin: 0.05, uMax: 0.8, len: [0.05, 0.18], skew: 1, seed: 5, twin: 0.2 } })));
fx(323, "Black spines along the ridges.", () => _hoodPyramid(Object.assign({}, _ha, { attached: { n: 12, ridge: 0.85, front: true, uMin: 0.05, uMax: 0.85, len: [0.1, 0.32], skew: 1.2, seed: 7, twin: 0.3 } })));
fx(324, "A cluster of black shards at the lower rim.", () => _hoodPyramid(Object.assign({}, _ha, { attached: { n: 14, uMin: 0.0, uMax: 0.22, len: [0.1, 0.34], skew: 1, seed: 9, twin: 0.5 } })));
fx(325, "Big black spikes along the back and sides.", () => _hoodPyramid(Object.assign({}, _ha, { attached: { n: 7, uMin: 0.1, uMax: 0.6, len: [0.22, 0.5], skew: 0.8, seed: 11, twin: 0.2, ridge: 0.3 } })));
fx(326, "Mixed irregular growths: bunches and singles.", () => _hoodPyramid(Object.assign({}, _ha, { attached: { n: 16, uMin: 0.04, uMax: 0.75, len: [0.06, 0.36], skew: 1.6, seed: 13, twin: 0.6, ridge: 0.25 } })));

// ── 325, fatter (Nos. 327–329) ──
const _h325 = { n: 7, uMin: 0.1, uMax: 0.6, len: [0.22, 0.5], skew: 0.8, seed: 11, twin: 0.2, ridge: 0.3 };
fx(327, "325, fatter shards.", () => _hoodPyramid(Object.assign({}, _ha, { attached: Object.assign({}, _h325, { fat: 1.8 }) })));
fx(328, "325, much fatter shards.", () => _hoodPyramid(Object.assign({}, _ha, { attached: Object.assign({}, _h325, { fat: 2.5 }) })));
fx(329, "325, chunky fat shards, slightly shorter.", () => _hoodPyramid(Object.assign({}, _ha, { attached: Object.assign({}, _h325, { fat: 3.0, len: [0.2, 0.42] }) })));

// ── The game version of 325, fatter (as 328), its black shards jolting about as if lightning were under the hood ──
const _h328 = { n: 7, uMin: 0.1, uMax: 0.6, len: [0.22, 0.5], skew: 0.8, seed: 11, twin: 0.2, ridge: 0.3, fat: 2.5 };
fx(330, "Jolting coat: lightning under the hood, as movement (mock sheet).", () => _hoodPyramid(Object.assign({}, _ha, { attached: _h328, jolt: true })));
fx(331, "Jolting coat: the game sprite.", () => _hoodPyramid(Object.assign({}, _ha, { attached: _h328, jolt: true, yaw: 0, S: 1.45 })));
