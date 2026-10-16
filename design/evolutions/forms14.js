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
