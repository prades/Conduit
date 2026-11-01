// BEDROCK MATRIX (Pack 1, core, Refined: +10% damage dealt): a chunk of dark bedrock split open. A faceted rough stone (lumpy, cleaved flat on several sides) split down its front in a jagged
// lens-shaped fissure, in which a honeycomb of glowing core-teal crystal cells is packed (taller toward the middle, most with a white-hot heart, a few dim, the dark floor showing between them as the
// lattice, teal light spilling up the walls of the split); jagged teal cracks running on from the split down the stone; a steel band clamped round its foot (bent tight over the stone, a clamp block
// and bolt on its side, rivets), chips of rock and teal motes lifting off the split.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const rockM = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.2, roughness: 0.72, flatShading: true, vertexColors: true }); rockM.envMapIntensity = 0.6;
  const chipM = std('#434954', 0.15, 0.78, { flatShading: true });
  const bandM = std('#a7b0bb', 0.85, 0.26), lugM = std('#6b737e', 0.85, 0.3), boltM = std('#c3cbd6', 0.95, 0.2);
  const cellM = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.25 }); cellM.color = STY.col('#0f8f7a'); cellM.emissive = STY.col('#00806a'); cellM.emissiveIntensity = 0.75; cellM.envMapIntensity = 1.0;
  const teal = STY.glow('#00ccaa', 1.5), tealHot = STY.glow('#8ffff0', 1.7), tealDim = STY.glow('#00806a', 1.2);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z), Yv = V(0, 1, 0);
  const rnd = (() => { let s = 20261101; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
  // a 2D convex hull ([x, y] points), counter-clockwise
  function hull(P) {
    const p = P.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]), cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]), lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }
  // a jagged glowing crack through the points (short straight segments, as Ember's heat crack)
  function crack(pts, r, mat, par) { for (let k = 0; k < pts.length - 1; k++) { const a = pts[k], b = pts[k + 1], d = b.clone().sub(a), L = d.length(), m = cyl(r, r, L, mat, 6); m.quaternion.setFromUnitVectors(Yv, d.normalize()); m.position.copy(a).add(b).multiplyScalar(0.5); par.add(m); } }

  ITEMS.bedrock_matrix = { exposure: 1.0, az: 0.58, el: 0.34, build() {
    const g = G();
    // THE ROCK: a jittered, lumpy icosphere, stretched upright, then cleaved flat on several sides (the big fracture facets of a broken stone)
    const NC = V(Math.sin(0.6) * Math.cos(0.3), Math.sin(0.3), Math.cos(0.6) * Math.cos(0.3)).normalize();   // the break faces the viewer
    const lump = d => 0.55 * Math.sin(3.3 * d.x + 1.1) * Math.cos(2.6 * d.y - 0.5) + 0.35 * Math.sin(4.1 * d.z + 2.3 * d.y + 0.7) + 0.25 * Math.cos(5.2 * d.x - 3.1 * d.z + 1.9);   // big slow lumps
    const ico = new T.IcosahedronGeometry(0.5, 3), ip = ico.attributes.position, J = {}, P = [], K = [];
    for (let i = 0; i < ip.count; i++) {
      const v = V(ip.getX(i), ip.getY(i), ip.getZ(i)), key = [v.x, v.y, v.z].map(x => x.toFixed(3)).join();
      if (!J[key]) J[key] = [1 + 0.12 * lump(v.clone().normalize()) + (rnd() - 0.5) * 0.14, (rnd() - 0.5) * 0.05, (rnd() - 0.5) * 0.05, (rnd() - 0.5) * 0.05];
      const j = J[key]; P.push(v.multiplyScalar(j[0]).add(V(j[1], j[2], j[3])).multiply(V(0.8, 1.14, 0.78))); K.push(key);
    }
    const press = (n, d) => P.forEach(v => { const k = v.dot(n) - d; if (k > 0) v.addScaledVector(n, -k); }), reach = n => P.reduce((m, v) => Math.max(m, v.dot(n)), -9);
    [[0, -1, 0, 0.86], [-0.35, 0.85, -0.4, 0.8], [0.45, 0.8, 0.3, 0.84], [-0.95, 0.15, 0.25, 0.82], [0.85, 0.2, -0.5, 0.82], [-0.5, -0.15, -0.85, 0.84], [0.62, -0.45, 0.64, 0.84], [-0.45, -0.35, 0.82, 0.86], [0.95, -0.1, 0.28, 0.86]]
      .forEach(([x, y, z, f]) => { const n = V(x, y, z).normalize(); press(n, reach(n) * f); });
    // THE SPLIT: a lens-shaped fissure down the stone's front, widest high up and closing to a crack below; every facet in it is knocked out, leaving a hole with a jagged rim. The stone keeps
    // the rest, a shade per facet (the same across a cleaved face)
    const SU = Yv.clone().cross(NC).normalize(), SY0 = -0.22, SY1 = 0.46, SW = 0.22;
    const out = f => { const m = P[f].clone().add(P[f + 1]).add(P[f + 2]).multiplyScalar(1 / 3), t = (m.y - SY0) / (SY1 - SY0); if (t <= 0 || t >= 1 || m.dot(NC) < 0.12) return false; return Math.abs(m.dot(SU) - 0.02) < SW * Math.pow(Math.sin(PI * Math.pow(t, 0.8)), 0.9); };
    const fn = new T.Vector3();
    const shade = f => { fn.subVectors(P[f + 1], P[f]).cross(V(0, 0, 0).subVectors(P[f + 2], P[f])).normalize(); const q = x => Math.round(x * 40) / 40, h = Math.sin(q(fn.x) * 12.99 + q(fn.y) * 78.23 + q(fn.z) * 37.72) * 43758.5; return h - Math.floor(h); };
    const pa = [], cols = [], c = new T.Color(), C0 = STY.col('#1c1f25'), C1 = STY.col('#363b44'), edges = {}, at3 = {};
    for (let f = 0; f < P.length; f += 3) {
      if (out(f)) { for (let k = 0; k < 3; k++) { const a = K[f + k], b = K[f + (k + 1) % 3], e = a < b ? a + '|' + b : b + '|' + a; edges[e] = (edges[e] || 0) + 1; at3[a] = P[f + k]; at3[b] = P[f + (k + 1) % 3]; } continue; }
      c.copy(C0).lerp(C1, shade(f)); for (let k = 0; k < 3; k++) { pa.push(P[f + k].x, P[f + k].y, P[f + k].z); cols.push(c.r, c.g, c.b); }
    }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pa, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(cols, 3)); geo.computeVertexNormals();
    const rock = new T.Mesh(geo, rockM); g.add(rock);
    const ray = new T.Raycaster(), surf = (a, y) => { const d = V(Math.sin(a), 0, Math.cos(a)); ray.set(V(d.x * 3, y, d.z * 3), d.clone().negate()); const h = ray.intersectObject(rock)[0]; return h ? h.point.addScaledVector(d, 0.004) : null; };
    // the rim: the hole's edge (the knocked-out facets' edges used once), chained into a loop
    const nb = {}; Object.keys(edges).filter(e => edges[e] === 1).forEach(e => { const [a, b] = e.split('|'); (nb[a] = nb[a] || []).push(b); (nb[b] = nb[b] || []).push(a); });
    const start = Object.keys(nb)[0], loop = []; let cur = start, prev = null; while (cur && loop.length <= Object.keys(nb).length) { loop.push(at3[cur]); const nx = nb[cur].find(k => k !== prev); prev = cur; cur = nx; if (cur === start) break; }
    // THE SOCKET: walls straight down from the rim to a flat floor (near black: the lattice between the cells), the teal light of the matrix spilling up their foot
    const DF = Math.min(...loop.map(v => v.dot(NC))) - 0.05, toF = v => v.clone().addScaledVector(NC, DF - v.dot(NC)), O = NC.clone().multiplyScalar(DF);
    const wp = [], wc = [], fp = [], GL = STY.col('#00a487'), DK = STY.col('#0a1614'), cen = loop.reduce((s, v) => s.add(toF(v)), V(0, 0, 0)).multiplyScalar(1 / loop.length);
    loop.forEach((a, i) => {
      const b = loop[(i + 1) % loop.length], af = toF(a), bf = toF(b);
      [a, b, bf, a, bf, af].forEach(v => { wp.push(v.x, v.y, v.z); const lit = v === af || v === bf; c.copy(lit ? GL : DK); wc.push(c.r, c.g, c.b); });
      [cen, af, bf].forEach(v => fp.push(v.x, v.y, v.z));
    });
    const wg = new T.BufferGeometry(); wg.setAttribute('position', new T.Float32BufferAttribute(wp, 3)); wg.setAttribute('color', new T.Float32BufferAttribute(wc, 3));
    g.add(new T.Mesh(wg, new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false, side: T.DoubleSide })));
    const flg = new T.BufferGeometry(); flg.setAttribute('position', new T.Float32BufferAttribute(fp, 3));
    g.add(new T.Mesh(flg, new T.MeshBasicMaterial({ color: STY.col('#03100d'), side: T.DoubleSide })));
    // THE MATRIX: the floor's frame (x along u, out along NC, z along w); the hex cells inside the rim, taller toward the middle, a few dim, most with a white-hot heart
    const u = Yv.clone().cross(NC).normalize(), w = u.clone().cross(NC).normalize();
    const F = G(); F.position.copy(O); F.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(u, NC, w)); g.add(F);
    const L2 = loop.map(v => { const d = toF(v).sub(O); return [d.dot(u), d.dot(w)]; }), RH = 0.046, RC = 0.039;
    const inPoly = (x, z) => { let k = false; L2.forEach((a, i) => { const b = L2[(i + 1) % L2.length]; if ((a[1] > z) !== (b[1] > z) && x < a[0] + (z - a[1]) / (b[1] - a[1]) * (b[0] - a[0])) k = !k; }); return k; };
    const edgeD = (x, z) => Math.min(...L2.map((a, i) => { const b = L2[(i + 1) % L2.length], ex = b[0] - a[0], ez = b[1] - a[1], t = Math.max(0, Math.min(1, ((x - a[0]) * ex + (z - a[1]) * ez) / (ex * ex + ez * ez))); return Math.hypot(x - a[0] - t * ex, z - a[1] - t * ez); }));
    let far = 0; L2.forEach(([x, z]) => { far = Math.max(far, Math.hypot(x, z)); });
    const c2 = L2.reduce((s, p) => [s[0] + p[0] / L2.length, s[1] + p[1] / L2.length], [0, 0]);
    for (let j = -9; j <= 9; j++) for (let i = -9; i <= 9; i++) {
      const x = c2[0] + Math.sqrt(3) * RH * (i + (j & 1) * 0.5), z = c2[1] + 1.5 * RH * j;
      if (!inPoly(x, z) || edgeD(x, z) < RC * 0.35) continue;
      const k = Math.max(0, 1 - Math.hypot(x - c2[0], z - c2[1]) / far), ht = 0.03 + 0.07 * k + rnd() * 0.02, cell = G(); cell.position.set(x, -0.01 + ht / 2, z); F.add(cell);
      const r = rnd(), top = r < 0.15 ? tealDim : teal;
      cell.add(new T.Mesh(new T.CylinderGeometry(RC, RC, ht, 6), [cellM, top, cellM]));
      if (r > 0.25) cell.add(at(new T.Mesh(new T.CylinderGeometry(RC * 0.48, RC * 0.48, 0.006, 6), tealHot), 0, ht / 2 + 0.002, 0));
    }
    // jagged teal cracks running from the rim down the stone: from its lowest, leftmost and rightmost points
    const pick = f => loop.reduce((b, p) => (f(p) > f(b) ? p : b), loop[0]);
    [[pick(p => -p.y), 0.0, -0.33], [pick(p => -p.x + p.z * 0.5), -0.25, -0.12], [pick(p => p.x - p.z * 0.5), 0.3, -0.2]].forEach(([s, da, yEnd]) => {
      const a0 = Math.atan2(s.x, s.z), pts = [s.clone()];
      for (let i = 1; i <= 7; i++) { const t = i / 7, y = s.y - 0.02 + (yEnd - s.y) * t, a = a0 + da * t + (i % 2 ? 0.07 : -0.05); const q = surf(a, y); if (q) pts.push(q); }
      if (pts.length > 2) { crack(pts.slice(0, 5), 0.007, teal, g); crack(pts.slice(4), 0.0055, tealDim, g); }
    });
    // THE BAND clamped round its foot: bent tight over the stone (the hull of its section), bevelled steel
    const YB = -0.37, BH = 0.1, sec = [];
    for (let i = 0; i < 90; i++) { const a = i / 90 * TAU; for (const y of [YB, YB + BH / 2, YB + BH]) { const p = surf(a, y); if (p) sec.push([p.x, -p.z]); } }
    const BS = hull(sec), sh = new T.Shape(), hp = new T.Path();
    BS.forEach(([x, y], i) => { const r = Math.hypot(x, y), k = (r + 0.01) / r; i ? sh.lineTo(x * k, y * k) : sh.moveTo(x * k, y * k); }); sh.closePath();
    BS.slice().reverse().forEach(([x, y], i) => { const r = Math.hypot(x, y), k = (r - 0.03) / r; i ? hp.lineTo(x * k, y * k) : hp.moveTo(x * k, y * k); }); hp.closePath(); sh.holes.push(hp);
    const bg = new T.ExtrudeGeometry(sh, { depth: BH - 0.016, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.006, bevelSegments: 2 });
    const band = new T.Mesh(bg, bandM); band.rotation.x = -PI / 2; band.position.y = YB + 0.008; g.add(band);
    // the clamp: a block and a bolt on the band's right-hand side, rivets round it
    const ca = 1.3, cp = surf(ca, YB + BH / 2), cl = G(); cl.position.copy(cp); cl.rotation.y = ca; g.add(cl);
    cl.add(at(cbox(0.15, BH + 0.03, 0.07, 0.012, lugM), 0, 0, 0.045));
    const bolt = cyl(0.022, 0.022, 0.22, boltM, 12); bolt.rotation.z = PI / 2; cl.add(at(bolt, 0, 0, 0.065));
    for (const s of [-1, 1]) { const nut = cyl(0.035, 0.035, 0.03, boltM, 6); nut.rotation.z = PI / 2; cl.add(at(nut, s * 0.1, 0, 0.065)); }
    for (const a of [0.15, 0.6, -0.35, -0.85]) { const p = surf(a, YB + BH / 2); if (!p) continue; const rv = cyl(0.017, 0.017, 0.03, boltM, 10); rv.rotation.x = PI / 2; const q = G(); q.position.copy(p); q.rotation.y = a; q.add(at(rv, 0, 0, 0.028)); g.add(q); }
    // CHIPS of rock and TEAL MOTES lifting off the split
    const up = O.clone().addScaledVector(NC, 0.1);
    [[0.3, 0.26, -0.12, 0.045, 0.4], [-0.3, 0.2, -0.04, 0.034, 1.3], [-0.02, 0.42, -0.12, 0.026, 2.2]].forEach(([x, y, z, r, a]) => {
      const ch = new T.Mesh(new T.IcosahedronGeometry(r, 0), chipM); ch.position.copy(up).add(V(x, y, z)); ch.scale.set(1.2, 0.7, 0.9); ch.rotation.set(a, a * 0.7, a * 0.4); g.add(ch);
    });
    [[0.05, 0.12, 0.12, 0.016, 2], [0.16, 0.3, 0.06, 0.013, 1], [-0.12, 0.28, 0.1, 0.012, 1], [0.1, 0.46, 0.02, 0.009, 0], [-0.26, 0.36, 0.0, 0.01, 0], [0.3, 0.12, 0.1, 0.011, 1]].forEach(([x, y, z, r, k]) => g.add(at(sphere(r, k === 2 ? tealHot : k === 1 ? teal : tealDim, 8), up.x + x, up.y + y, up.z + z)));
    return { g };
  } };
})();
