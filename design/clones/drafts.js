// THE CLONES IN 3D: drafts for the owner (2026-11-22; Proposed, pictures only, nothing in the game). Asked whether THE ANT QUEEN should be drawn in 3D now, the owner: "Need
// clones to be drawn first". Today the 3D view leaves a clone to the 2D drawing (docs/VIEW-3D.md §4.4), and only the ant has a 3D body.
// Injected by design/clones/render.js into the game's 3D view (dist/view3d.js, served changed, never written) inside the view's own scope, after the round 2 chamber
// (design/style-evolution/round2/chamber.js buildAnt), where it replaces buildAnt. The served view is also changed (in memory) so that its ant() draws every species this
// file builds, and a clone too (render.js: PATCHES). Two questions, as pictures:
//   1. how a clone shows it is yours (?mark=A, B or C on the page): A teal eyes and a teal stripe, B a teal ring at its feet, C teal-tinted armour (each with teal eyes,
//      as the 2D game gives a clone its team's colour in its eyes: js/bugs3d.js _bugFrame `accent`)
//   2. a first 3D body for each species that can be cloned and has none: the beetle, the scorpion, the spider, the mantis, the moth (in the Stalker D's family: the owner,
//      2026-11-22, "the Stalker variation D": earthy rust and sand, a heavier plated body, short thick jointed legs with knee thorns and hooked feet, big raised serrated
//      weapons in a sand shade with pale points, thorns), and the roly-poly in its approved look B (docs/ELECTRIC-BREED.md §2.2; textures made vertex colours)
// Each body takes only the poses the view already asks of an ant (js/bugs3d.js and view3d/gameview.js ant(): four steps of the walk, the bite with `open`, every foot down),
// each species' bite being what its 2D drawing does on its attack (the scorpion's tail strikes and its pincers snap, the mantis's forelegs shoot forward, the beetle's horn
// lifts, the spider's fangs spread). Every shape, size and colour here is the agent's, provisional.

// ── THE STALKER D (copied from design/insects/drafts.js on claude/menacing-insects, 2026-11-22: variation D only; the eyes tagged for the clone marks) ──
const STALKER_D = { lift: 1.5, knee: 6, ankle: 3.5, reach: 0.82, scythe: 1.05, jaw: 1.25, spines: 0.8, bk: 1.38, head: 1.08, legW: 1.75, sw: 1.4, antW: 1.6, spread: 0.45, antH: 5, tipAt: 0.6, pal: ['#5a3418', '#b8874a', '#1a0f07'], tip: '#f2e2bd', leg: '#2b1a0d', sick: '#c99c5e', mottle: 0.9 };
const CD_ANT_W = { worker: 20, scout: 22, striker: 28, tank: 36, boss: 26 }, CD_JAW = { worker: 0.9, scout: 1.05, striker: 1.15, tank: 1.3, boss: 1.35 };
function stalkerAnt(P, o, V) {
  const cls = o.cls || 'scout', queen = cls === 'boss', soldier = cls === 'tank' || queen, s = (CD_ANT_W[cls] || 22) / 22 * (o.size || 1), U = 0.4 * s, BK = V.bk || 1, UB = U * BK, zk = o.zk || ANT_ZK, Z = z => z / UH * s * zk;
  const hsz = (queen ? 1.25 : soldier ? 1.3 : 1) * (V.head || 1), ml = (CD_JAW[cls] || 1.05) * V.jaw, open = o.open === undefined ? 0.01 : o.open, strike = Math.min(1, open / 0.3), walk = o.walk === undefined ? 0.6 : o.walk;
  const accent = o.accent || ANT_COLOUR, eye = glowMat(accent, 1.0), g = new T.Group();
  const lin = h => new T.Color(h).convertSRGBToLinear(), C0 = lin(V.pal[0]), C1 = lin(V.pal[1]), C2 = lin(V.pal[2]);
  const armour = std('#ffffff', { roughness: 0.42, metalness: 0.25 }); armour.vertexColors = true;
  const legM = std(V.leg, { roughness: 0.45, metalness: 0.3 }), tipM = std(V.tip, { roughness: 0.3, metalness: 0.45 }), sickM = V.sick ? std(V.sick, { roughness: 0.35, metalness: 0.35 }) : null, LW = V.legW || 1, SW = V.sw || 1, TA = V.tipAt || 0.72;
  tipM.userData.tip = true; if (sickM) sickM.userData.weapon = true;
  const mot = (x, y, z) => { const n = Math.sin(x * 23.1 + z * 7.3) * Math.sin(z * 19.7 - x * 5.1 + 1.3) + 0.6 * Math.sin(x * 41 + y * 37 + z * 29) + 0.35 * Math.sin((x - z) * 61 + y * 13); return Math.max(0, Math.min(1, (n - 0.15) * 1.4)); };
  const paint = (mesh, edge) => { const geo = mesh.geometry, p = geo.attributes.position, n = p.count, c = new Float32Array(n * 3), box = (geo.computeBoundingBox(), geo.boundingBox), tc = new T.Color();
    for (let i = 0; i < n; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = mot(x / s, y / s, z / s) * V.mottle, h = (y - box.min.y) / Math.max(1e-6, box.max.y - box.min.y);
      tc.copy(C0).lerp(C1, k); if (edge) tc.lerp(C2, edge(x, y, z, h)); tc.lerp(C2, Math.max(0, 0.45 - h) * 0.9); c[i * 3] = tc.r; c[i * 3 + 1] = tc.g; c[i * 3 + 2] = tc.b; }
    geo.setAttribute('color', new T.BufferAttribute(c, 3)); return mesh; };
  const NR = 20, ring = (f0, L, W, z, K, tilt) => { const r = []; for (let i = 0; i < NR; i++) { const t = i / NR * Math.PI * 2, k = K ? K[i] : 1, f = L * Math.cos(t) * k; r.push([(f0 + f) * UB, Z(z + (tilt || 0) * f / Math.max(1e-6, L) * L * 10), W * Math.sin(t) * k * UB]); } return r; };
  const blob = (f0, L, W, z0, rz, o2) => { o2 = o2 || {}; const rings = [], nr = o2.rings || 9; for (let i = 0; i <= nr; i++) { const ph = -Math.PI / 2 + Math.PI * (i + 0.5) / (nr + 1), k = Math.sin(ph), sc = Math.cos(ph);
      const top = k > 0 && o2.ridge ? 1 + o2.ridge * k * k : 1; rings.push(ring(f0, L * sc, W * sc / top, z0 + rz * BK * k * top, o2.K, o2.tilt)); } return paint(loft(rings, armour), o2.edge); };
  const cone = (a, b, r, mat) => { const m = rodBetween(a, b, 1, mat || armour, 6), d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); m.geometry.dispose(); m.geometry = new T.ConeGeometry(r, d, 6); if (!mat) paint(m); return m; };
  const L = V.lift * (queen ? 0.7 : 1), zb = 8 + L;
  const gq = queen ? 1.5 : 1, segs = [[-0.6, 0.17, 0.78], [-0.78, 0.2, 1], [-0.97, 0.19, 0.94], [-1.14, 0.15, 0.72]];
  for (const [f, l, k] of segs) { const zz = zb + 1.2 + (-0.6 - f) * 3.2; g.add(blob(f * (queen ? 1.08 : 1) - (queen ? 0.05 : 0), l * gq * 1.15, 0.36 * k * gq, zz, 5 * k * gq, { ridge: 0.12, edge: (x, y, z, h) => Math.pow(Math.abs(Math.cos(((x / U) - f) / (l * gq * 1.15) * Math.PI / 2)), 0.3) < 0.6 ? 0.7 : 0 })); }
  const tipF = (-1.14 - 0.17) * (queen ? 1.08 : 1) - (queen ? 0.12 : 0), tipZ = zb + 1.2 + 0.54 * 3.2;
  g.add(cone([tipF * UB, Z(tipZ), 0], [(tipF - 0.25) * UB, Z(tipZ - 1.5), 0], 0.05 * UB, tipM));
  g.add(blob(-0.38, 0.09, 0.08, zb, 2.6, { rings: 5 })); g.add(cone([-0.38 * UB, Z(zb + 2.2), 0], [-0.44 * UB, Z(zb + 2.2 + 4 * V.spines), 0], 0.035 * UB));
  g.add(blob(0.0, 0.34, 0.17, zb + 1.2, 3.2, { tilt: 0.25, ridge: 0.25 }));
  for (const [f, h] of [[-0.18, 3], [0.02, 4.2], [0.2, 3.4]]) g.add(cone([f * UB, Z(zb + 1.2 + 3.2 + f * 2.5 - 0.4), 0], [(f - 0.08) * UB, Z(zb + 1.2 + 3.2 + f * 2.5 + h * V.spines), 0], 0.045 * UB));
  const hf = 0.4 + 0.22 * hsz, hL = 0.22 * hsz, hW = 0.25 * hsz, hz = zb + 3.2 * BK, hr = 3.4 * hsz * BK, lobe = soldier ? 0.18 : 0.12, notch = soldier ? 0.26 : 0.18;
  const K = []; for (let i = 0; i < NR; i++) { const t = i / NR * Math.PI * 2, c = Math.cos(t), a = Math.abs(Math.atan2(Math.sin(t), c)); K.push((c > 0 ? 1 - 0.18 * c : 1) + lobe * Math.exp(-(a - 2.3) * (a - 2.3) / 0.12) - notch * Math.exp(-(a - Math.PI) * (a - Math.PI) / 0.05)); }
  g.add(blob(hf, hL, hW, hz, hr, { K, ridge: 0.1 }));
  for (const side of [-1, 1]) {
    g.add(cone([(hf - hL * 0.55) * UB, Z(hz + hr * 0.6), side * hW * 0.7 * UB], [(hf - hL * 1.45) * UB, Z(hz + hr * (0.9 + 0.5 * V.spines)), side * hW * 0.95 * UB], 0.05 * UB * hsz));
    const a = [(hf + hL * 0.02) * UB, Z(hz + hr * 0.5), side * hW * 0.9 * UB], b = [(hf + hL * 0.5) * UB, Z(hz + hr * 0.32), side * hW * 0.62 * UB], e = rodBetween(a, b, Z(1.05) * hsz, eye, 8); e.userData.noInk = true; e.userData.eye = true; g.add(e);
    g.add(rodBetween([(hf - hL * 0.1) * UB, Z(hz + hr * 0.82), side * hW * 0.95 * UB], [(hf + hL * 0.6) * UB, Z(hz + hr * 0.6), side * hW * 0.28 * UB], Z(1.0), legM, 6));
    const p0 = [(hf + hL * 0.6) * UB, Z(hz + hr * 0.6), side * 0.09 * UB], p1 = [(hf + hL * 0.5 + 0.1) * UB, Z(hz + (V.antH || 8)), side * 0.3 * UB], p2 = [(hf + hL + 0.42) * UB, Z(hz + 3), side * 0.32 * UB]; g.add(rodBetween(p0, p1, 0.009 * s * (V.antW || 1), legM, 6)); g.add(rodBetween(p1, p2, 0.007 * s * (V.antW || 1), legM, 6)); }
  for (const side of [-1, 1]) { const op = open * 1.2, b0 = hf + hL * 0.7, b1 = side * 0.12 * hsz, c0 = hf + hL + 0.12 * ml, c1 = side * (0.24 * hsz + op), d0 = hf + hL + 0.38 * ml, d1 = side * (0.22 * hsz + op), t0 = hf + hL + 0.5 * ml, t1 = side * (0.03 + op * 1.1);
    const bez = u => { const v = 1 - u, A = v * v * v, B = 3 * v * v * u, C = 3 * v * u * u, D = u * u * u; return [A * b0 + B * c0 + C * d0 + D * t0, A * b1 + B * c1 + C * d1 + D * t1]; };
    const outer = [], inner = [], tipO = [], tipI = []; for (let i = 0; i <= 10; i++) { const u = i / 10, p = bez(u), q = bez(Math.min(1, u + 0.01)), r = bez(Math.max(0, u - 0.01)); let nx = r[1] - q[1], ny = q[0] - r[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl; if (ny * side < 0) { nx = -nx; ny = -ny; }
      const w = 0.09 * hsz * Math.pow(1 - u, 0.8) * (u < 0.15 ? 0.7 + 2 * u : 1), oo = [p[0] + nx * w, p[1] + ny * w], ii = [p[0] - nx * w, p[1] - ny * w]; outer.push(oo); inner.push(ii); if (u >= 0.6) { tipO.push(oo); tipI.push(ii); }
      if (i === 3 || i === 6) inner.push([p[0] - nx * (w + 0.07 * ml) + 0.03 * ml, p[1] - ny * (w + 0.07 * ml)]); }
    const blade = (pts, mat, lift, th) => { const sh = new T.Shape(pts.map(p => new T.Vector2(p[0] * UB, p[1] * UB))), m = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: Z(th || 1.8), bevelEnabled: false }), mat); m.rotation.x = Math.PI / 2; m.position.y = Z(hz - 0.8) + (lift || 0); if (mat === armour) paint(m); return m; };
    const tipPts = tipO.map(p => [p[0] + 0.004, p[1] + side * 0.004]).concat(tipI.slice().reverse().map(p => [p[0] + 0.004, p[1] - side * 0.004]));
    g.add(blade(outer.concat(inner.slice().reverse()), armour)); g.add(blade(tipPts, tipM, Z(0.15), 2.1)); }
  const sc = V.scythe * (queen ? 1.15 : 1);
  for (const side of [-1, 1]) {
    const sh = [0.24 * UB, Z(zb + 2.6), side * 0.13 * UB];
    const ex = (0.3 + 0.18 * strike) * sc, ey = (zb + (5.5 * sc + 1.5) * BK - 2.5 * strike * sc), elbow = [(0.24 + ex) * UB, Z(ey), side * 0.3 * UB];
    g.add(paint(rodBetween(sh, elbow, 0.026 * s * Math.max(1, sc) * SW, armour, 7))); g.add(at3(new T.Mesh(new T.SphereGeometry(0.028 * s * Math.max(1, sc) * SW, 8, 6), legM), elbow[0], elbow[1], elbow[2]));
    const len = 0.9 * sc, pts = [], N = 9; for (let i = 0; i <= N; i++) { const u = i / N, w = 0.075 * sc * SW * (1 - u * 0.85); pts.push([u * len, 0.12 * sc * Math.sin(u * Math.PI) + w]); }
    const inn = []; for (let i = N; i >= 0; i--) { const u = i / N, w = 0.075 * sc * SW * (1 - u * 0.85), bump = i > 0 && i < N && i % 2 === 0 ? 0.05 * sc : 0; inn.push([u * len, 0.12 * sc * Math.sin(u * Math.PI) - w - bump]); }
    const shp = new T.Shape(pts.concat(inn).map(p => new T.Vector2(p[0] * UB, p[1] * UB))), bm = new T.Mesh(new T.ExtrudeGeometry(shp, { depth: Z(1.2 * SW), bevelEnabled: false }), sickM || armour); if (!sickM) paint(bm);
    const tipShp = new T.Shape([[len * TA, 0.12 * sc * Math.sin(TA * Math.PI) + 0.075 * sc * SW * (1 - TA * 0.85) * 1.08], [len, 0.075 * sc * SW * 0.17], [len, -0.075 * sc * SW * 0.17], [len * TA, 0.12 * sc * Math.sin(TA * Math.PI) - 0.075 * sc * SW * (1 - TA * 0.85) * 1.08]].map(p => new T.Vector2(p[0] * UB, p[1] * UB))), tm = new T.Mesh(new T.ExtrudeGeometry(tipShp, { depth: Z(1.2 * SW + 0.4), bevelEnabled: false }), tipM);
    const pivot = new T.Group(); pivot.position.set(elbow[0], elbow[1], elbow[2] - Z(0.6)); bm.position.z = 0; tm.position.z = -Z(0.2); pivot.add(bm); pivot.add(tm);
    pivot.rotation.z = -0.3 - 0.75 * strike; pivot.rotation.y = -side * ((V.spread || 0.32) - 0.22 * strike); pivot.updateMatrixWorld(true);
    for (const q of [bm, tm]) { q.geometry.applyMatrix4(q.matrixWorld); q.position.set(0, 0, 0); q.rotation.set(0, 0, 0); q.updateMatrix(); g.add(q); } }
  const LEGS = [{ f: 0.06, hs: 0.15, kf: 0.18, ks: 0.66, af: 0.3, as: 1.1, tf: 0.42, ts: 1.28 }, { f: -0.14, hs: 0.14, kf: -0.36, ks: 0.66, af: -0.7, as: 1.06, tf: -0.92, ts: 1.22 }];
  LEGS.forEach((Lg, i) => { for (const side of [-1, 1]) { const ph = walk * Math.PI * 2 + ((i % 2 === 0) === (side > 0) ? 0 : Math.PI), sw = o.stand ? 0 : Math.sin(ph) * 0.42, up = o.stand ? 0 : Math.pow(Math.max(0, Math.cos(ph)), 0.5) * 5;
    const R = V.reach * (queen ? 1.1 : 1), hip = [Lg.f * UB, Z(zb + 0.6), side * Lg.hs * UB], knee = [(Lg.f + Lg.kf * R + sw * 0.4) * U, Z(zb + V.knee * (queen ? 0.75 : 1) + up * 0.6), side * Lg.ks * R * U], ank = [(Lg.f + Lg.af * R + sw * 0.75) * U, Z(V.ankle + up), side * Lg.as * R * U], foot = [(Lg.f + Lg.tf * R + sw) * U, Z(up * 0.4) + 0.012, side * Lg.ts * R * U];
    g.add(rodBetween(hip, knee, 0.024 * s * LW, legM, 7)); g.add(rodBetween(knee, ank, 0.017 * s * LW, legM, 7)); g.add(rodBetween(ank, foot, 0.011 * s * LW, legM, 6));
    g.add(at3(new T.Mesh(new T.SphereGeometry(0.026 * s * LW, 8, 6), legM), knee[0], knee[1], knee[2])); g.add(cone(knee, [knee[0] - 0.02 * U, knee[1] + Z(1.2 + 1.6 * V.spines), knee[2] + side * 0.05 * U], 0.022 * s * LW, legM)); } });
  setShadows(g); g.userData.ant = { cls, s, len: 2.95 * UB, top: Z(Math.max(hz + hr + 3, zb + 5.5 * sc + 4)), headAt: [hf * UB, Z(hz), 0], jawTip: [(hf + hL + 0.5 * ml) * UB, Z(hz - 0.8), 0] };
  return g;
}

// ── THE KIT for the other species, in the Stalker D's family: the same mottle, plate edges and dark underside, the same materials (armour by vertex colour; legs, weapons
// and pale points plain), cones for thorns, rods for legs. A species' own numbers are its 2D drawing's (js/bugs3d.js, js/beetle3d.js): f forward and sd to its side in its
// ground units, z up in its pixels, all at its scale s (its width over its species' reference width, BUG_REF_WIDTH), so a body is as long and as tall as its 2D drawing.
const CD_REF = { ant: 22, beetle: 26, scorpion: 30, spider: 22, mantis: 20, moth: 22, rolypoly: 26 };
const CD_W = { beetle: { scout: 26, striker: 32, tank: 42 }, scorpion: { scout: 30, striker: 36, tank: 48 }, spider: { scout: 22, striker: 26, tank: 34 }, mantis: { scout: 20, striker: 26, tank: 34 }, moth: { scout: 22, striker: 30, tank: 40 }, rolypoly: { scout: 26, striker: 32, tank: 42 } };
// the species' looks, in the family (earthy; each its own shade so the six read apart): body dark, mottle light, edges and underside, legs, weapons (sand), points (pale)
const CD_LOOK = {
  beetle:   { pal: ['#4a2512', '#9a5f2c', '#140904'], leg: '#26150a', sick: '#c4955a', tip: '#f2e2bd', mottle: 0.75, rough: 0.32, metal: 0.4 },
  scorpion: { pal: ['#6a4a24', '#c8a163', '#1c1208'], leg: '#2e1f10', sick: '#d1aa6c', tip: '#f4e7c8', mottle: 0.85, rough: 0.42, metal: 0.25 },
  spider:   { pal: ['#2f1b0d', '#7b5232', '#0c0603'], leg: '#1d1108', sick: '#b98c55', tip: '#f0dfb8', mottle: 0.8, rough: 0.45, metal: 0.2 },
  mantis:   { pal: ['#4a4420', '#a99a5a', '#15130a'], leg: '#2a2612', sick: '#cdb070', tip: '#f4e8c4', mottle: 0.85, rough: 0.42, metal: 0.22 },
  moth:     { pal: ['#4a2f17', '#a77f48', '#130b05'], leg: '#24180c', sick: '#c49a60', tip: '#efdcb4', mottle: 0.95, rough: 0.6, metal: 0.08 },
};
const CD_TEAL = '#19e6c1';   // your side's colour in the game's UI (js/draw.js drawHealthBar, js/levels.js drawUnitTag)
function cdKit(o, sp, look) {
  const cls = o.cls || 'scout', W = (CD_W[sp] && CD_W[sp][cls]) || CD_REF[sp], s = W / CD_REF[sp] * (o.size || 1), U = 0.4 * s, zk = o.zk || ANT_ZK, Z = z => z / UH * s * zk;
  const lin = h => new T.Color(h).convertSRGBToLinear(), C0 = lin(look.pal[0]), C1 = lin(look.pal[1]), C2 = lin(look.pal[2]);
  const armour = std('#ffffff', { roughness: look.rough, metalness: look.metal }); armour.vertexColors = true;
  const legM = std(look.leg, { roughness: 0.45, metalness: 0.3 }), weap = std(look.sick, { roughness: 0.35, metalness: 0.35 }), tipM = std(look.tip, { roughness: 0.3, metalness: 0.45 });
  weap.userData.weapon = true; tipM.userData.tip = true;
  const accent = o.accent || '#aa55ff', eyeM = glowMat(accent, 1.0);
  const mot = (x, y, z) => { const n = Math.sin(x * 23.1 + z * 7.3) * Math.sin(z * 19.7 - x * 5.1 + 1.3) + 0.6 * Math.sin(x * 41 + y * 37 + z * 29) + 0.35 * Math.sin((x - z) * 61 + y * 13); return Math.max(0, Math.min(1, (n - 0.15) * 1.4)); };
  const paint = (mesh, edge, under) => { const geo = mesh.geometry, p = geo.attributes.position, n = p.count, c = new Float32Array(n * 3), box = (geo.computeBoundingBox(), geo.boundingBox), tc = new T.Color();
    for (let i = 0; i < n; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = mot(x / s, y / s, z / s) * look.mottle, h = (y - box.min.y) / Math.max(1e-6, box.max.y - box.min.y);
      tc.copy(C0).lerp(C1, k); if (edge) tc.lerp(C2, edge(x / U, y, z / U, h)); tc.lerp(C2, Math.max(0, 0.45 - h) * (under === undefined ? 0.9 : under)); c[i * 3] = tc.r; c[i * 3 + 1] = tc.g; c[i * 3 + 2] = tc.b; }
    geo.setAttribute('color', new T.BufferAttribute(c, 3)); return mesh; };
  // a dome of stacked outlines (the 2D's _bugBlob): centred f0, half-length L, half-width W, from z0 up rz (its lower half under z0); K shapes its outline, so moves it aside
  const NR = 16;
  const blob = (f0, L, W, z0, rz, q) => { q = q || {}; const nr = q.rings || 7, rings = [];
    for (let i = 0; i <= nr; i++) { const ph = -Math.PI / 2 + Math.PI * (i + 0.5) / (nr + 1), k = Math.sin(ph), sc = Math.cos(ph), top = k > 0 && q.ridge ? 1 + q.ridge * k * k : 1, r = [];
      for (let j = 0; j < (q.nr || NR); j++) { const t = j / (q.nr || NR) * Math.PI * 2, kk = q.K ? q.K(t) : 1, f = L * sc * Math.cos(t) * kk; r.push([(f0 + f) * U, Z(z0 + rz * k * top * (k < 0 ? (q.flat || 1) : 1) + (q.tilt || 0) * f * 10), ((q.so || 0) + W * sc * Math.sin(t) * kk / top) * U]); }
      rings.push(r); }
    const m = loft(rings, q.mat || armour); return q.mat ? m : paint(m, q.edge, q.under); };
  const rod = (a, b, r, mat, seg) => rodBetween(a, b, r, mat || legM, seg || 6);
  const cone = (a, b, r, mat) => { const m = rodBetween(a, b, 1, mat || armour, 6), d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); m.geometry.dispose(); m.geometry = new T.ConeGeometry(r, d, 6); if (!mat) paint(m); return m; };
  const ball = (r, p, mat, seg) => at3(new T.Mesh(new T.SphereGeometry(r, seg || 8, 6), mat || legM), p[0], p[1], p[2]);
  const pt = (f, sd, z) => [f * U, Z(z), sd * U];   // a point of its ground frame in the view's
  const eye = (p, r) => { const e = ball(r, p, eyeM, 8); e.userData.noInk = true; e.userData.eye = true; return e; };
  // a flat serrated blade (a sickle, a fang, a claw's finger) in its own plane: u along it from its root (0) to its point (len), its back curve `bow`, widest `w` at the root;
  // teeth on its inner edge every other step; its last part (from tipAt) a pale point. Turned by the matrix `M` (from its root) into place. Its sand shade (weap) or armour.
  const blade = (g, len, w, bow, th, M, o2) => { o2 = o2 || {}; const N = o2.n || 8, TA = o2.tipAt || 0.62, teeth = o2.teeth === undefined ? 0.45 : o2.teeth, top = [], bot = [];
    for (let i = 0; i <= N; i++) { const u = i / N, ww = w * (1 - u * 0.88), y = bow * Math.sin(u * Math.PI); top.push([u * len, y + ww]); bot.push([u * len, y - ww - (teeth && i > 0 && i < N && i % 2 === 0 ? teeth * w : 0)]); }
    const fl = o2.flip ? -1 : 1, mk = (pts, mat, dz, d) => { const sh = new T.Shape(pts.map(p => new T.Vector2(p[0], p[1] * fl))), geo = new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: false, curveSegments: 1 }); geo.translate(0, 0, -d / 2 + (dz || 0)); geo.applyMatrix4(M); const m = new T.Mesh(geo, mat); if (mat === armour) paint(m); g.add(m); return m; };
    mk(top.concat(bot.slice().reverse()), o2.mat || weap, 0, th);
    const a = Math.floor(TA * N), tp = top.slice(a).map(p => [p[0] + len * 0.004, p[1] + w * 0.04]), bp = bot.slice(a).map(p => [p[0] + len * 0.004, p[1] - w * 0.04]);
    mk(tp.concat(bp.reverse()), tipM, 0, th * 1.25); };
  // the matrix that puts a blade's root at p, its length along dir, its flat face's normal `n`
  const frame = (p, dir, n) => { const d = new T.Vector3(...dir).normalize(), nn = new T.Vector3(...n), y = new T.Vector3().crossVectors(nn, d).normalize(), z = new T.Vector3().crossVectors(d, y).normalize(); return new T.Matrix4().makeBasis(d, y, z).setPosition(p[0], p[1], p[2]); };
  // a jointed leg: hip, knee, (ankle,) foot, thick to thin, a ball on the knee and a thorn up off it, a hook at the foot (the family's: short thick legs, knee thorns, hooked feet)
  const leg = (g, pts, w, o2) => { o2 = o2 || {}; for (let i = 0; i + 1 < pts.length; i++) g.add(rod(pts[i], pts[i + 1], w * (1 - 0.28 * i), legM, 6));
    const kn = pts[1]; g.add(ball(w * 1.12, kn)); if (o2.thorn !== false) g.add(cone(kn, [kn[0] - 0.03 * U, kn[1] + Z(2.6 * (o2.thorn || 1)), kn[2] + (o2.side || 1) * 0.06 * U], w * 0.9, legM));
    const ft = pts[pts.length - 1], an = pts[pts.length - 2], dx = ft[0] - an[0], dz = ft[2] - an[2], dl = Math.hypot(dx, dz) || 1; g.add(cone(ft, [ft[0] + dx / dl * 0.1 * U, ft[1] - Z(0.4), ft[2] + dz / dl * 0.1 * U], w * 0.6, legM)); };
  // the step of a leg (walk: 0 to 1; its pair's phase): its foot's swing along f and its lift (px), as the 2D's tripod gait; every foot down when it stands
  const step = (walk, odd, stand) => { if (stand) return [0, 0]; const ph = walk * Math.PI * 2 + (odd ? Math.PI : 0); return [Math.sin(ph), Math.pow(Math.max(0, Math.cos(ph)), 0.5)]; };
  return { cls, s, U, Z, pt, armour, legM, weap, tipM, eyeM, paint, blob, rod, cone, ball, eye, blade, frame, leg, step, open: o.open === undefined ? 0.01 : o.open, walk: o.walk === undefined ? 0.6 : o.walk, stand: !!o.stand };
}

// ── THE BEETLE (js/beetle3d.js: a dome shell with the elytra seam, the pronotum, the head and its curving horn, mandibles, six legs in a tripod; its bite lifts the horn forward) ──
// In the family: the dome as two plated wing cases with a dark seam and thorns along their edges, a heavier pronotum with two forward thorns, the horn thick and serrated in
// sand with a pale point, short thick legs with knee thorns and hooked feet.
function cdBeetle(o) { const K = cdKit(o, 'beetle', CD_LOOK.beetle), { U, Z, pt, blob, cone, eye, blade, frame, leg, step } = K, g = new T.Group(), atk = Math.min(1, K.open / 0.3);
  const sf = -0.25, sL = 1.08, sW = 0.74, z0 = 6, rz = 10;
  // the wing cases: two domes meeting at the seam (dark), their rims dark
  for (const side of [-1, 1]) g.add(blob(sf, sL, sW * 0.52, z0, rz, { so: side * sW * 0.48, K: t => 1 - 0.1 * Math.max(0, Math.cos(t)), edge: (f, y, sd, h) => Math.abs(sd) < 0.05 ? 0.85 : 0, ridge: 0.08, flat: 0.5 }));
  for (const side of [-1, 1]) for (const u of [0.55, 0.05, -0.45]) { const f = sf + sL * u, sdw = sW * 0.96 * Math.sqrt(Math.max(0, 1 - u * u)); g.add(cone(pt(f, side * sdw, z0 + 3), pt(f - 0.08, side * (sdw + 0.12), z0 + 7), 0.05 * U)); }
  for (const u of [-0.2, 0.3]) g.add(cone(pt(sf + sL * u, 0, z0 + rz * 0.98), pt(sf + sL * u - 0.1, 0, z0 + rz + 4), 0.045 * U));
  // the pronotum, heavier, two thorns forward
  const prF = sf + sL + 0.2, hdF = prF + 0.44; g.add(blob(prF, 0.34, 0.52, 7, 6, { ridge: 0.12, K: t => 1 + 0.08 * Math.cos(t * 2) }));
  for (const side of [-1, 1]) g.add(cone(pt(prF + 0.18, side * 0.3, 11), pt(prF + 0.5, side * 0.34, 14), 0.06 * U));
  // the head, eyes in its colour
  g.add(blob(hdF, 0.22, 0.3, 6, 4.5, { K: t => 1 - 0.15 * Math.max(0, Math.cos(t)) }));
  for (const side of [-1, 1]) g.add(eye(pt(hdF + 0.1, side * 0.24, 8.5), 0.035 * U));
  // the horn: thick at its root, up and forward, serrated on its top, a pale point; the bite lifts it forward (the 2D's charge)
  const hr = pt(hdF + 0.12, 0, 9), ang = 0.85 + 0.25 * atk, len = (0.72 + 0.12 * atk) * U;
  blade(g, len, 0.09 * U, -0.06 * U, 0.1 * U, frame(hr, [Math.cos(ang), Math.sin(ang) * 0.9, 0], [0, 0, 1]), { teeth: 0.5, tipAt: 0.66 });
  // the mandibles: two short sickles either side under the horn, closing on the bite
  for (const side of [-1, 1]) { const r = pt(hdF + 0.14, side * 0.15, 5), a = side * (0.5 - 0.35 * atk); blade(g, 0.34 * U, 0.045 * U, side * 0.05 * U, Z(1.4), frame(r, [Math.cos(a), 0, Math.sin(a)], [0, 1, 0]), { teeth: 0.4, n: 6, flip: side > 0 }); }
  // six legs, a tripod (the 2D's f 0.6, 0, -0.6), short and thick
  [0.6, 0.0, -0.6].forEach((f0, i) => { for (const side of [-1, 1]) { const [sw, up] = step(K.walk, (i % 2 === 0) !== (side > 0), K.stand);
    leg(g, [pt(f0, side * 0.6, 5), pt(f0 + sw * 0.18 + (i - 1) * -0.15, side * 1.06, 12 + up * 3), pt(f0 + sw * 0.28 + (i - 1) * -0.3, side * 1.28, 4 + up * 2), pt(f0 + sw * 0.32 + (i - 1) * -0.35, side * 1.42, up * 1.5 + 0.3)], 0.07 * U, { side }); } });
  setShadows(g); g.userData.ant = { cls: K.cls, s: K.s, len: 2.4 * U, top: Z(24) }; return g; }

// ── THE SCORPION (js/bugs3d.js: a low carapace, a plated back, eight legs, pincers that snap and a segmented tail arched over its back to the sting, which strikes forward) ──
// In the family: the tail's segments plated, a thorn on each, the sting a big hooked point in sand with a pale tip and its vesicle in its colour; the pincers heavy and serrated.
function cdScorpion(o) { const K = cdKit(o, 'scorpion', CD_LOOK.scorpion), { U, Z, pt, blob, cone, eye, blade, frame, leg, step, ball } = K, g = new T.Group(), atk = Math.min(1, K.open / 0.3);
  g.add(blob(0.32, 0.38, 0.38, 5, 3.6, { K: t => 1 - 0.2 * Math.max(0, Math.cos(t)), ridge: 0.1 }));   // the carapace
  for (const side of [-1, 1]) g.add(eye(pt(0.5, side * 0.08, 8.6), 0.03 * U));
  [[0.0, 0.46], [-0.25, 0.48], [-0.5, 0.44], [-0.74, 0.36]].forEach(([f, w]) => { g.add(blob(f, 0.17, w, 5, 3.4, { rings: 5, edge: (ff, y, sd, h) => Math.abs(ff - f) > 0.13 ? 0.7 : 0 })); g.add(cone(pt(f, 0, 8.2), pt(f - 0.06, 0, 11), 0.04 * U)); });
  // the tail: the 2D's five segments (length, angle up from backward), striking forward on the bite
  const TL = [[0.28, 0.35], [0.28, 0.95], [0.28, 1.55], [0.28, 2.15], [0.24, 2.7]]; let tf = -0.88, tz = 0.5; const P0 = [[tf, tz]];
  TL.forEach(([l, th], i) => { const a = th + atk * i * 0.16; tf -= Math.cos(a) * l; tz += Math.sin(a) * l; P0.push([tf, tz]); });
  for (let i = 0; i + 1 < P0.length; i++) { const a = P0[i], b = P0[i + 1], r = 0.11 - i * 0.012, m = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    g.add(blob(m[0], Math.hypot(b[0] - a[0], (b[1] - a[1]) * 0.6) * 0.62, r, m[1] * 12 - r * 12 * 0.6, r * 18, { rings: 5, nr: 10, tilt: (b[1] - a[1]) / Math.max(0.05, Math.abs(b[0] - a[0])) * 0.06 * (b[0] < a[0] ? -1 : 1) }));
    g.add(cone(pt(m[0], 0, m[1] * 12 + r * 9), pt(m[0] + 0.05, 0, m[1] * 12 + r * 9 + 3), 0.03 * U)); }
  // the vesicle (a bulb, in its colour's light at its base) and the sting: a hooked point forward and down
  const e = P0[P0.length - 1], v = pt(e[0], 0, e[1] * 12); g.add(blob(e[0], 0.12, 0.09, e[1] * 12 - 1, 2.6, { rings: 5, nr: 10 }));
  const ring = ball(0.06 * U, [v[0] + 0.05 * U, v[1] - Z(0.5), v[2]], K.eyeM, 8); ring.userData.noInk = true; ring.userData.eye = true; g.add(ring);
  const la = TL[4][1] + atk * 0.64 + 0.5; blade(g, 0.36 * U, 0.06 * U, 0.05 * U, 0.05 * U, frame([v[0] + 0.04 * U, v[1], v[2]], [-Math.cos(la), -Math.sin(la) * 0.5, 0], [0, 0, 1]), { teeth: 0, tipAt: 0.4, n: 6 });
  // the pincers: an arm out to a heavy claw, two serrated fingers that open on the bite (the 2D's snap)
  const op = K.stand && !atk ? 0.35 : atk ? 0.9 : 0.35;
  for (const side of [-1, 1]) { const a0 = pt(0.55, side * 0.26, 5), el = pt(0.84, side * 0.6, 7), wr = pt(1.04, side * 0.5, 6);
    g.add(K.rod(a0, el, 0.05 * U, K.armour)); K.paint(g.children[g.children.length - 1]); g.add(K.ball(0.055 * U, el)); g.add(K.rod(el, wr, 0.045 * U, K.armour)); K.paint(g.children[g.children.length - 1]);
    g.add(blob(1.2, 0.26, 0.18, 6, 4.4, { so: side * 0.47, rings: 6 }));
    blade(g, 0.46 * U, 0.08 * U, side * 0.03 * U, Z(3.0), frame(pt(1.38, side * 0.42, 6), [1, 0, -side * 0.15], [0, 1, 0]), { teeth: 0.55, n: 6, flip: side < 0 });
    const oa = side * (0.15 + op * 0.55); blade(g, 0.42 * U, 0.07 * U, -side * 0.03 * U, Z(2.6), frame(pt(1.36, side * 0.54, 6.6), [Math.cos(oa), 0, Math.sin(oa)], [0, 1, 0]), { teeth: 0.5, n: 6, flip: side > 0 }); }
  // eight legs (the 2D's), short and thick, knee thorns, hooked feet
  const LG = [[0.42, 0.3, 0.15, 0.78, 0.42, 1.05], [0.24, 0.33, 0.03, 0.85, 0.12, 1.15], [0.04, 0.33, -0.08, 0.85, -0.2, 1.15], [-0.16, 0.3, -0.2, 0.78, -0.55, 1.05]];
  LG.forEach(([f, hs, kf, ks, tf2, ts], i) => { for (const side of [-1, 1]) { const [sw, up] = step(K.walk, (i % 2 === 0) !== (side > 0), K.stand);
    leg(g, [pt(f, side * hs, 4), pt(f + kf + sw * 0.1, side * ks, 11 + up * 3), pt(f + tf2 * 0.85 + sw * 0.22, side * ts * 0.95, 3 + up * 2), pt(f + tf2 + sw * 0.26, side * ts * 1.08, up * 1.2 + 0.3)], 0.055 * U, { side, thorn: 0.8 }); } });
  setShadows(g); g.userData.ant = { cls: K.cls, s: K.s, len: 2.6 * U, top: Z(32) }; return g; }

// ── THE SPIDER (js/bugs3d.js: a round abdomen held high with its mark on it, eight long legs with high knees, a cluster of eyes, fangs and palps; its bite spreads the fangs) ──
// In the family: the abdomen plated in bands with thorns along its top and its mark in its colour's light, the fangs two sand sickles with pale points, the legs thick and jointed.
function cdSpider(o) { const K = cdKit(o, 'spider', CD_LOOK.spider), { U, Z, pt, blob, cone, eye, blade, frame, leg, step } = K, g = new T.Group(), bite = Math.min(1, K.open / 0.3);
  g.add(blob(-0.62, 0.52, 0.46, 13, 8, { ridge: 0.1, edge: (f, y, sd, h) => { const b = ((-f - 0.2) / 0.22) % 1; return b > 0.86 || b < 0.05 ? 0.75 : 0; } }));
  for (const f of [-0.35, -0.6, -0.85]) for (const side of [-1, 1]) g.add(cone(pt(f, side * 0.18, 19.5 - Math.abs(f + 0.6) * 4), pt(f - 0.05, side * 0.24, 23.5 - Math.abs(f + 0.6) * 4), 0.04 * U));
  // its mark (the 2D's hourglass), in its colour, a raised plate on the top
  const mk = new T.Shape([[-0.42, 0], [-0.56, 0.1], [-0.62, 0.02], [-0.68, 0.1], [-0.84, 0], [-0.68, -0.1], [-0.62, -0.02], [-0.56, -0.1]].map(p => new T.Vector2(p[0] * U, p[1] * U)));
  const mg = new T.ShapeGeometry(mk); mg.rotateX(Math.PI / 2); const mm = new T.Mesh(mg, K.eyeM); mm.position.y = Z(22.6); mm.userData.noInk = true; mm.userData.eye = true; mm.material.side = T.DoubleSide; g.add(mm);
  // the front: the cephalothorax, plated; eyes (two big, four small) in its colour
  g.add(blob(0.2, 0.3, 0.28, 10, 4.5, { ridge: 0.18, K: t => 1 - 0.15 * Math.max(0, Math.cos(t)) }));
  for (const side of [-1, 1]) { g.add(eye(pt(0.44, side * 0.06, 14), 0.035 * U)); for (const [f, sd, z] of [[0.38, 0.14, 15.5], [0.32, 0.08, 16.5]]) g.add(eye(pt(f, side * sd, z), 0.022 * U)); }
  // the fangs: two sickles down from under the face, spread on the bite; the palps beside them
  for (const side of [-1, 1]) { const r = pt(0.45, side * 0.07, 9.5), a = side * (0.12 + bite * 0.45);
    blade(g, 0.3 * U, 0.05 * U, -side * 0.02 * U, Z(2.0), frame(r, [Math.cos(a) * 0.55, -0.8, Math.sin(a) * 0.55], [-Math.sin(a), 0, Math.cos(a)]), { teeth: 0.3, n: 6, tipAt: 0.55 });
    g.add(K.rod(pt(0.42, side * 0.14, 9), pt(0.62, side * 0.24, 11), 0.022 * U)); g.add(K.rod(pt(0.62, side * 0.24, 11), pt(0.72, side * 0.2, 4), 0.018 * U)); }
  // eight legs: hip, the high knee, the ankle, the foot (the 2D's), thick, a thorn on each knee, hooked feet
  const LG = [[0.34, 0.2, 0.45, 0.85, 20, 0.95, 1.15, 1.1, 1.25], [0.24, 0.24, 0.18, 1.05, 21, 0.38, 1.45, 0.42, 1.6], [0.12, 0.24, -0.18, 1.05, 21, -0.38, 1.45, -0.42, 1.6], [0.02, 0.2, -0.45, 0.88, 20, -0.95, 1.15, -1.15, 1.3]];
  LG.forEach(([f, hs, kf, ks, kz, af, as, tf2, ts], i) => { for (const side of [-1, 1]) { const [sw, up] = step(K.walk, (i % 2 === 0) !== (side > 0), K.stand);
    leg(g, [pt(f, side * hs, 9), pt(f + kf + sw * 0.12, side * ks, kz + up * 3), pt(f + af + sw * 0.25, side * as, 7 + up * 2), pt(f + tf2 + sw * 0.3, side * ts, up * 1.5 + 0.3)], 0.052 * U, { side }); } });
  setShadows(g); g.userData.ant = { cls: K.cls, s: K.s, len: 2.4 * U, top: Z(30) }; return g; }

// ── THE MANTIS (js/bugs3d.js: a long abdomen under folded wings, a raised neck, a triangular head with big eyes, the raptorial forelegs folded in prayer that shoot forward on
// the strike, four walking legs). In the family: the forelegs the big serrated sickles in sand with pale points, held up; the thorax plated with a thorn, the wings stiff plates. ──
// (The code gift "Emotional Support" is a mantis tank clone: docs/CODES.md.)
function cdMantis(o) { const K = cdKit(o, 'mantis', CD_LOOK.mantis), { U, Z, pt, blob, cone, eye, blade, frame, leg, step } = K, g = new T.Group(), k = Math.min(1, K.open / 0.3), ht = 25;
  // the abdomen, plated in bands, its tip; the folded wings over it as two stiff plates
  g.add(blob(-0.72, 0.62, 0.23, 11, 3.8, { edge: (f, y, sd, h) => { const b = ((-f - 0.25) / 0.3) % 1; return b > 0.85 ? 0.8 : 0; } })); g.add(blob(-1.28, 0.22, 0.14, 12, 2.6, { rings: 5 }));
  for (const side of [-1, 1]) { const sh = new T.Shape([[-0.05, 0], [-0.5, side * 0.27], [-1.2, side * 0.1], [-1.32, 0]].map(p => new T.Vector2(p[0] * U, p[1] * U))), geo = new T.ExtrudeGeometry(sh, { depth: Z(1.0), bevelEnabled: false, curveSegments: 1 });
    geo.rotateX(Math.PI / 2); geo.translate(0, Z(16.2), 0); const w = new T.Mesh(geo, K.armour); K.paint(w, (f, y, sd, h) => Math.abs(sd) > 0.2 ? 0.6 : 0, 0.3); g.add(w); }
  // the thorax low, the neck raised (a plated prothorax), a thorn on it
  g.add(blob(0.05, 0.2, 0.15, 11, 3.2, { rings: 5 }));
  const nk0 = pt(0.12, 0, 13), nk1 = pt(0.6, 0, ht - 1); const nm = K.rod(nk0, nk1, 0.07 * U, K.armour, 7); K.paint(nm); g.add(nm);
  g.add(cone(pt(0.36, 0, 19.5), pt(0.3, 0, 24), 0.04 * U));
  // the head: the 2D's triangle (its point down and forward) as a wedge, big eyes at its corners in its colour, a short crest; antennae
  const hd = blob(0.74, 0.17, 0.3, ht, 4.2, { rings: 6, ridge: 0.15, K: t => { const c = Math.cos(t); return c > 0 ? 1 - 0.5 * c : 1 + 0.12 * Math.abs(Math.sin(t)); } }); g.add(hd);
  for (const side of [-1, 1]) { g.add(eye(pt(0.7, side * 0.27, ht + 3), 0.085 * U)); g.add(cone(pt(0.64, side * 0.12, ht + 5), pt(0.54, side * 0.17, ht + 10.5), 0.035 * U));
    g.add(K.rod(pt(0.76, side * 0.06, ht + 5), pt(0.9, side * 0.2, ht + 13), 0.014 * U)); g.add(K.rod(pt(0.9, side * 0.2, ht + 13), pt(1.1, side * 0.34, ht + 16), 0.011 * U)); }
  // the raptorial forelegs (the 2D's shoulder, elbow and tip): the femur a big serrated sickle in sand from the shoulder to the elbow, its spines down; the tibia a hooked pale
  // blade from the elbow, folded back up against it in prayer, both shot forward on the strike
  const lerp = (a, b) => a + (b - a) * k;
  for (const side of [-1, 1]) { const sh = pt(0.55, side * 0.13, 21), el = pt(lerp(0.9, 1.05), side * lerp(0.22, 0.18), lerp(12, 22)), tp = pt(lerp(0.72, 1.6), side * lerp(0.18, 0.1), lerp(21, 15));
    g.add(K.ball(0.05 * U, sh)); g.add(K.ball(0.055 * U, el)); const n = [0, 0, side];
    const d1 = [el[0] - sh[0], el[1] - sh[1], el[2] - sh[2]], d2 = [tp[0] - el[0], tp[1] - el[1], tp[2] - el[2]];
    blade(g, Math.hypot(...d1) * 1.05, 0.1 * U, (lerp(0.08, -0.04)) * U, 0.08 * U, frame(sh, d1, [0, 0, 1]), { teeth: 0.6, n: 8, tipAt: 0.9 });
    blade(g, Math.hypot(...d2) * 1.08, 0.06 * U, lerp(-0.06, 0.05) * U, 0.06 * U, frame(el, d2, [0, 0, 1]), { teeth: 0.45, n: 7, tipAt: 0.55 }); }
  // four walking legs (the 2D's), thin but jointed, knee thorns, hooked feet
  const LG = [[0.12, 0.12, 0.2, 0.62, 0.55, 0.85], [-0.04, 0.12, -0.3, 0.68, -0.95, 0.9]];
  LG.forEach(([f, hs, kf, ks, tf2, ts], i) => { for (const side of [-1, 1]) { const [sw, up] = step(K.walk, (i % 2 === 0) !== (side > 0), K.stand);
    leg(g, [pt(f, side * hs, 10), pt(f + kf + sw * 0.12, side * ks, 19 + up * 3), pt(f + tf2 * 0.9 + sw * 0.25, side * ts * 0.96, 3 + up * 2), pt(f + tf2 + sw * 0.28, side * ts * 1.05, up * 1.5 + 0.3)], 0.042 * U, { side, thorn: 0.8 }); } });
  setShadows(g); g.userData.ant = { cls: K.cls, s: K.s, len: 2.8 * U, top: Z(42) }; return g; }

// ── THE MANTIS, SECOND PASS (2026-11-23; Proposed, pictures only). Asked for after the first drafts: their forelegs read as flat boards from 3/4. Here the raptorial forelegs are
// solid: coxa, femur and tibia each a tapered prism with a triangular cross-section (its flat, grasping face toward the part it closes on), two rows of spines along that face's edges,
// long and short by turns, pale at their points; the tibia folded back against the femur's underside (the raptorial fold) and ending in a hooked claw; on the strike the femur swings up
// and forward and the tibia opens out ahead of it. The head a true mantis triangle seen from the front (wide at the top, narrow at the mouth, thin front to back), big bulging eyes on
// its top corners, palps at the mouth, long antennae; the prothorax a long keeled neck flaring at the shoulders, a thorn on the keel; the wings leaf-shaped with a raised vein. The
// Stalker D's family: earthy olive mottle, dark plate edges, the weapons in sand with pale points. (design/clones/render.js: ?mantis=1 draws the first pass.)
function cdMantis2(o) { const K = cdKit(o, 'mantis', CD_LOOK.mantis), { U, Z, pt, blob, cone, eye, leg, step } = K, g = new T.Group(), k = Math.min(1, K.open / 0.3), ht = 25;
  const V = (a) => new T.Vector3(a[0], a[1], a[2]), lerp = (a, b) => a + (b - a) * k, sub = (a, b) => [a[0] - b[0], a[1] - b[1], a[2] - b[2]], mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2];
  // a tapered prism from A to B: its cross-section a rounded triangle, the flat face (two edges, `e`) toward `toward` (a point it faces), the apex away; r(u): its size along it
  const prism = (A, B, toward, r, mat, w) => { const d = V(sub(B, A)).normalize(), t = V(sub(toward, mid(A, B))), gd = t.sub(d.clone().multiplyScalar(t.dot(d))); if (gd.lengthSq() < 1e-9) gd.set(0, -1, 0); gd.normalize();
    const sd = new T.Vector3().crossVectors(d, gd).normalize(), N = 7, rings = [], edges = [[], []];
    const sec = [[0.55, -1], [0.62, -0.35], [0.62, 0.35], [0.55, 1], [-0.1, 0.62], [-0.85, 0.12], [-0.85, -0.12], [-0.1, -0.62]];   // (gd, side) in units of r: the flat face at +gd
    for (let i = 0; i <= N; i++) { const u = i / N, rr = r(u), c = V(A).lerp(V(B), u), ring = [];
      for (const [a, b] of sec) { const q = c.clone().addScaledVector(gd, a * rr).addScaledVector(sd, b * rr * (w || 1)); ring.push([q.x, q.y, q.z]); }
      rings.push(ring); edges[0].push(c.clone().addScaledVector(gd, 0.55 * rr).addScaledVector(sd, -rr * (w || 1))); edges[1].push(c.clone().addScaledVector(gd, 0.55 * rr).addScaledVector(sd, rr * (w || 1))); }
    const m = loft(rings, mat); if (mat === K.armour) K.paint(m); g.add(m); return { gd, sd, d, edges, N }; };
  // the spines along a prism's two grasping edges, from u0 to u1, pointing out of its flat face (and a little out and on), long and short by turns; pale points
  const spines = (P, u0, u1, n, len, r) => { for (let e = 0; e < 2; e++) for (let i = 0; i < n; i++) { const u = u0 + (u1 - u0) * (i + 0.5 * e) / Math.max(1, n - 1), j = Math.min(P.N, u * P.N), j0 = Math.floor(j), j1 = Math.min(P.N, j0 + 1), base = P.edges[e][j0].clone().lerp(P.edges[e][j1], j - j0);
      const L = len * (i % 2 ? 0.55 : 1), dir = P.gd.clone().addScaledVector(P.sd, (e ? 0.35 : -0.35)).addScaledVector(P.d, 0.45).normalize(), tip = base.clone().addScaledVector(dir, L);
      g.add(cone([base.x, base.y, base.z], [tip.x, tip.y, tip.z], r * (i % 2 ? 0.75 : 1), i % 2 ? K.weap : K.tipM)); } };
  // THE ABDOMEN, long, plated in bands, its tip; THE WINGS folded over it, leaf-shaped, a raised vein each
  g.add(blob(-0.74, 0.62, 0.22, 11, 3.6, { edge: (f) => { const b = ((-f - 0.25) / 0.3) % 1; return b > 0.85 ? 0.8 : 0; } })); g.add(blob(-1.3, 0.22, 0.13, 12, 2.4, { rings: 5 }));
  for (const side of [-1, 1]) { const pts = []; for (let i = 0; i <= 10; i++) { const u = i / 10; pts.push([-0.05 - 1.3 * u, side * (0.04 + 0.24 * Math.sin(Math.PI * Math.pow(u, 0.8)))]); } pts.push([-1.36, 0]);
    const sh = new T.Shape(pts.map(p => new T.Vector2(p[0] * U, p[1] * U))), geo = new T.ExtrudeGeometry(sh, { depth: Z(0.9), bevelEnabled: false, curveSegments: 1 });
    geo.rotateX(Math.PI / 2); geo.rotateZ(-0.05); geo.translate(0, Z(16.4), 0); const w = new T.Mesh(geo, K.armour); K.paint(w, (f, y, sd) => Math.abs(sd) > 0.2 ? 0.65 : 0, 0.25); g.add(w);
    g.add(K.rod(pt(-0.12, side * 0.08, 16.9), pt(-1.15, side * 0.1, 17.6), 0.016 * U, K.legM, 5)); }
  // THE THORAX low; THE PROTHORAX a long keeled neck, raised, flaring at the shoulders where the forelegs hang; a thorn on its keel
  g.add(blob(0.04, 0.2, 0.15, 11, 3.0, { rings: 5 }));
  const nk0 = pt(0.1, 0, 13.5), nk1 = pt(0.64, 0, ht - 1.5);
  prism(nk0, nk1, [nk0[0] + 0.3 * U, nk0[1] - 10, 0], u => U * (0.07 - 0.03 * Math.sin(u * Math.PI * 0.9) + 0.035 * Math.max(0, (u - 0.7) / 0.3)), K.armour, 1.15);
  g.add(cone(pt(0.36, 0, 21.2), pt(0.3, 0, 25), 0.035 * U)); g.add(cone(pt(0.5, 0, 23.2), pt(0.46, 0, 25.8), 0.025 * U));
  // THE HEAD: the triangle, seen from the front: rings up from the mouth, each wider (thin front to back), rounded over the top; the face tipped forward and down
  const hr = []; for (let i = 0; i <= 9; i++) { const u = i / 9, z = ht - 1.8 + u * 5.2, W0 = 0.07 + 0.22 * Math.pow(u, 0.6) * (u > 0.8 ? Math.sqrt(Math.max(0, 1 - Math.pow((u - 0.8) / 0.22, 2))) : 1), D0 = 0.08 + 0.05 * Math.sin(u * Math.PI * 0.9), f0 = 0.82 - 0.06 * u, ring = [];
    for (let j = 0; j < 14; j++) { const t = j / 14 * Math.PI * 2; ring.push(pt(f0 + D0 * Math.cos(t), W0 * Math.sin(t) * (Math.abs(Math.sin(t)) > 0.7 ? 1 : 0.92), z)); } hr.push(ring); }
  g.add(K.paint(loft(hr, K.armour), (f, y, sd, h) => h > 0.9 ? 0.4 : 0, 0.5));
  for (const side of [-1, 1]) { const e = eye(pt(0.77, side * 0.29, ht + 2.4), 0.1 * U); e.scale.set(1.0, 1.25, 0.9); g.add(e);
    g.add(K.rod(pt(0.86, side * 0.03, ht - 1.6), pt(0.92, side * 0.06, ht - 4.5), 0.016 * U, K.weap)); g.add(K.rod(pt(0.8, side * 0.07, ht + 3.2), pt(0.97, side * 0.2, ht + 10), 0.011 * U)); g.add(K.rod(pt(0.97, side * 0.2, ht + 10), pt(1.2, side * 0.36, ht + 12.5), 0.008 * U)); }
  g.add(cone(pt(0.77, 0, ht + 3.2), pt(0.74, 0, ht + 5.2), 0.03 * U));   // (a short crest on the vertex)
  // THE RAPTORIAL FORELEGS: the coxa down and forward from the shoulder; the femur up from it, beside the head, its spiny face down; the tibia folded back up under it, its spines
  // meeting the femur's, ending in a hooked claw. The strike: the coxa swings forward, the femur up and out ahead, the tibia opened out in front
  for (const side of [-1, 1]) { const shl = pt(0.58, side * 0.12, 21.5), cx = pt(lerp(0.74, 0.88), side * lerp(0.18, 0.15), lerp(15, 17)), kn = pt(lerp(0.9, 1.35), side * lerp(0.25, 0.17), lerp(25.5, 21.5)), tb = pt(lerp(0.96, 1.75), side * lerp(0.23, 0.13), lerp(15.5, 14));
    const femTo = mid(cx, tb), tibTo = mid(cx, kn), awayFem = k > 0.5 ? pt(lerp(0.8, 1.4), side * 0.2, 6) : femTo;
    prism(shl, cx, pt(0.9, side * 0.4, 18), u => U * (0.07 - 0.025 * u), K.armour, 0.9); g.add(K.ball(0.052 * U, cx));
    const F = prism(cx, kn, k > 0.5 ? awayFem : femTo, u => U * (0.06 + 0.06 * Math.sin(Math.PI * Math.min(1, u * 1.4 + 0.05)) - 0.02 * u), K.weap, 0.85); spines(F, 0.2, 0.92, 5, 0.14 * U, 0.024 * U); g.add(K.ball(0.045 * U, kn, K.weap));
    const Tb = prism(kn, tb, k > 0.5 ? pt(lerp(0.8, 1.6), side * 0.2, 4) : tibTo, u => U * (0.05 - 0.02 * u), K.weap, 0.8); spines(Tb, 0.15, 0.85, 4, 0.09 * U, 0.017 * U);
    const hk = V(tb).addScaledVector(Tb.d, 0.07 * U), hk2 = hk.clone().addScaledVector(Tb.gd, 0.06 * U).addScaledVector(Tb.d, -0.02 * U);
    g.add(cone(tb, [hk.x, hk.y, hk.z], 0.02 * U, K.tipM)); g.add(cone([hk.x, hk.y, hk.z], [hk2.x, hk2.y, hk2.z], 0.012 * U, K.tipM)); }
  // four walking legs, thin but jointed, knee thorns, hooked feet
  const LG = [[0.12, 0.12, 0.2, 0.62, 0.55, 0.85], [-0.04, 0.12, -0.3, 0.68, -0.95, 0.9]];
  LG.forEach(([f, hs, kf, ks, tf2, ts], i) => { for (const side of [-1, 1]) { const [sw, up] = step(K.walk, (i % 2 === 0) !== (side > 0), K.stand);
    leg(g, [pt(f, side * hs, 10), pt(f + kf + sw * 0.12, side * ks, 19 + up * 3), pt(f + tf2 * 0.9 + sw * 0.25, side * ts * 0.96, 3 + up * 2), pt(f + tf2 + sw * 0.28, side * ts * 1.05, up * 1.5 + 0.3)], 0.042 * U, { side, thorn: 0.8 }); } });
  setShadows(g); g.userData.ant = { cls: K.cls, s: K.s, len: 2.8 * U, top: Z(42) }; return g; }

// ── THE MOTH (js/bugs3d.js: it flies: the body hovers over its shadow, four wings beating with eyespots in its colour, feathered antennae, legs dangling). In the family: an
// armoured thorax with thorns, stiff wings in a mottled earthy pattern with a serrated back edge, hooked feet. Its wings beat with the walk's steps (the 2D beats them all the
// time; the view's poses are the walk's four, the bite and the stand: a moth standing still holds its wings half up). ──
function cdMoth(o) { const K = cdKit(o, 'moth', CD_LOOK.moth), { U, Z, pt, blob, cone, eye, step } = K, g = new T.Group();
  const h = 22, phi = K.stand ? 0.2 : Math.sin(K.walk * Math.PI * 2) * 0.75, cp = Math.cos(phi), sp = Math.sin(phi);
  const FW = [[0.25, 0], [0.15, 0.6], [0, 1.35], [-0.25, 1.6], [-0.36, 1.42], [-0.45, 1.25], [-0.38, 0.95], [-0.35, 0.6], [-0.15, 0]], HW = [[-0.1, 0], [-0.3, 0.55], [-0.55, 1.05], [-0.7, 1.04], [-0.85, 0.95], [-0.8, 0.5], [-0.45, 0]];
  const wing = (side, pts, z0, mottle) => { const geo = new T.BufferGeometry(), pos = [], idx = [], c0 = [0.05, 0];
    pos.push(...pt(c0[0], side * 0.08, z0)); for (const [f0, r0] of pts) { const f = 0.05 + (f0 - 0.05) * 1.7, r = r0 * 0.88; pos.push(f * U, Z(z0 + r * 12 * sp), side * (0.08 + r * cp) * U); }
    for (let i = 1; i < pts.length; i++) idx.push(0, i, i + 1); const n0 = pos.length / 3; pos.push(...pos.slice()); for (let i = 1; i < pts.length; i++) idx.push(n0, n0 + i + 1, n0 + i); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    const m = new T.Mesh(geo, K.armour); K.paint(m, (f, y, sd, hh) => Math.abs(sd) < 0.2 ? 0.5 : 0, 0); return m; };
  for (const side of [-1, 1]) { g.add(wing(side, HW, h - 0.5)); g.add(wing(side, FW, h));
    const e = [(0.05 - 0.2 * 1.7) * U, Z(h + 0.92 * 12 * sp) + 0.01, side * (0.08 + 0.92 * cp) * U], es = eye(e, 0.13 * U); es.scale.set(1, 0.3, 0.8); g.add(es); }
  // the body: the abdomen banded, the thorax armoured with thorns, the head with its eyes, feathered antennae
  g.add(blob(-0.42, 0.42, 0.18, h - 1, 4, { edge: (f, y, sd, hh) => { const b = ((-f - 0.15) / 0.2) % 1; return b > 0.82 ? 0.8 : 0; } }));
  g.add(blob(0.06, 0.23, 0.21, h, 5, { ridge: 0.2 })); for (const sd of [-0.08, 0.08]) g.add(cone(pt(0.06, sd, h + 4.5), pt(0.0, sd * 1.6, h + 8.5), 0.035 * U));
  g.add(blob(0.33, 0.12, 0.15, h, 3.5, { rings: 5 })); for (const side of [-1, 1]) g.add(eye(pt(0.38, side * 0.11, h + 1), 0.045 * U));
  for (const side of [-1, 1]) { const a = pt(0.38, side * 0.05, h + 3), b = pt(0.72, side * 0.32, h + 12); g.add(K.rod(a, b, 0.012 * U));
    for (let i = 1; i <= 4; i++) { const u = i / 5, c = pt(0.38 + 0.34 * u, side * (0.05 + 0.27 * u), h + 3 + 9 * u), d = pt(0.28 + 0.34 * u, side * (0.13 + 0.27 * u), h + 1.5 + 9 * u); g.add(K.rod(c, d, 0.008 * U)); } }
  // its legs dangle under it, hooked
  for (const side of [-1, 1]) for (const f of [0.14, 0.04, -0.06]) { const a = pt(f, side * 0.1, h - 3), b = pt(f + 0.06, side * 0.22, h - 7.5), c = pt(f + 0.12, side * 0.26, h - 10); g.add(K.rod(a, b, 0.016 * U)); g.add(K.rod(b, c, 0.012 * U)); g.add(K.cone(c, [c[0] + 0.05 * U, c[1] - Z(1), c[2]], 0.012 * U, K.legM)); }
  setShadows(g); g.userData.ant = { cls: K.cls, s: K.s, len: 1.8 * U, top: Z(40) }; return g; }

// ── THE ROLY-POLY in its approved look (docs/ELECTRIC-BREED.md §2.2, look B "insulator", round 4; design/creatures/electric_breed_examples.js rolyWalk): glossy black plates,
// hazard-striped side panels, copper joints, amber lights; longer (1.3 to its width's 0.56), seven plates (five big, a tail section, the telson), no eyes and no face (a rounded
// armoured head), two antennae, a core housing with lit vents on its back, tail thrusters. Here in fewer triangles, its stripes painted on its vertices (no picture). Not the
// earthy family: its look is approved as it is. (Rolled up into its wheel is the game's CURL, a state the 2D draws from its sheet: not drawn here.) ──
function cdRoly(o) { const cls = o.cls || 'scout', W0 = CD_W.rolypoly[cls] || 26, s = W0 / 26 * (o.size || 1), M = 1.05 * s, g = new T.Group();   // (M: the model's unit in the view's: its length ~ the 2D beetle's)
  const lin = h => new T.Color(h).convertSRGBToLinear(), BLK = lin('#1e1f24'), DK = lin('#121317'), YEL = lin('#f2b13a');
  const plate = std('#ffffff', { roughness: 0.3, metalness: 0.45 }); plate.vertexColors = true;
  const frameM = std('#4f5660', { roughness: 0.35, metalness: 0.85 }), dark = std('#121317', { roughness: 0.35, metalness: 0.5 }), joint = std('#c87a3a', { roughness: 0.28, metalness: 0.88 }), keel = std('#f2b13a', { roughness: 0.4, metalness: 0.3 });
  keel.userData.stripe = true; const glow = glowMat('#ffae1a', 1.2); glow.userData.light = true;
  const L = 1.3, Wd = 0.56, H = 0.3, LIFT = 0.15, TH0 = -0.22, TH1 = Math.PI + 0.22, prof = x => Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(x) / (L / 2)), 2.5)), 0.4);
  const CUTS = [0.58, 0.36, 0.14, -0.08, -0.29, -0.47, -0.58, -0.66], NPL = 7, OVL = 0.04;
  const flare = th => { const a = Math.min(th, Math.PI - th), f = Math.max(0, (0.4 - a) / (0.4 - TH0)); return 1 + 0.12 * f * f; };
  const P = (x, y, z) => [x * M, y * M, z * M];
  for (let i = 0; i < NPL; i++) { const xb = CUTS[i], xa = CUTS[i + 1] - (i < NPL - 1 ? OVL : 0), k = 1 + 0.016 * (NPL - i), nu = 5, nv = 22, grid = [];
    for (let a = 0; a <= nu; a++) for (let b = 0; b <= nv; b++) { const u = a / nu, v = b / nv, x = xb - (xb - xa) * u, th = TH0 + v * (TH1 - TH0), p = prof(x * 0.99);
      grid.push(P(x, LIFT + H * p * Math.sin(th) * k + 0.024 * u * Math.max(0, Math.sin(th)), (Wd / 2) * p * Math.cos(th) * k * flare(th))); }
    // a colour a face (no picture): the hazard panel low on each side of the five big plates in yellow and black diagonal checks (the approved stripes, as faces), the rest glossy black,
    // darker where a plate tucks under the one before
    const pos = [], col = [];
    for (let a = 0; a < nu; a++) for (let b = 0; b < nv; b++) { const v = (b + 0.5) / nv, sd = Math.min(v, 1 - v), inPanel = i < 5 && sd > 0.05 && sd < 0.24, c = inPanel ? ((a + b + (v > 0.5 ? 1 : 0)) % 2 ? YEL : DK) : BLK.clone().multiplyScalar(0.7 + 0.3 * (a + 0.5) / nu);
      const q = a * (nv + 1) + b, r = q + nv + 1; for (const j of [q, r, q + 1, r, r + 1, q + 1]) { pos.push(...grid[j]); col.push(c.r, c.g, c.b); } }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new T.Mesh(geo, plate); m.material.side = T.DoubleSide; g.add(m);
    // a ridge along the big plates' crown, capped yellow (B's keel), the core housing on the middle one with its lit vents and two exhaust stacks
    const xm = (xa + xb) / 2, top = LIFT + H * prof(xm) * k + 0.02;
    if (i < 5 && i !== 2) { const kb = new T.Mesh(new T.BoxGeometry((xb - xa) * 0.8 * M, 0.026 * M, 0.05 * M), dark); kb.position.set(...P(xm, top + 0.01, 0)); g.add(kb); const kt = new T.Mesh(new T.BoxGeometry((xb - xa) * 0.7 * M, 0.008 * M, 0.022 * M), keel); kt.position.set(...P(xm, top + 0.027, 0)); g.add(kt); }
    if (i === 2) { const hb = new T.Mesh(new T.BoxGeometry(0.17 * M, 0.06 * M, 0.19 * M), dark); hb.position.set(...P(xm, top + 0.03, 0)); g.add(hb);
      for (const a of [-0.06, -0.024, 0.012]) { const vb = new T.Mesh(new T.BoxGeometry(0.022 * M, 0.014 * M, 0.15 * M), glow); vb.position.set(...P(xm + a, top + 0.064, 0)); vb.userData.noInk = true; vb.userData.eye = true; g.add(vb); }
      for (const c of [-0.066, 0.066]) { const st = new T.Mesh(new T.CylinderGeometry(0.018 * M, 0.021 * M, 0.075 * M, 8), joint); st.position.set(...P(xm + 0.06, top + 0.06, c)); g.add(st); } } }
  // the frame under the shell
  { const fb = new T.Mesh(new T.BoxGeometry(L * 0.84 * M, 0.06 * M, 0.28 * M), frameM); fb.position.set(...P(-0.03, LIFT - 0.05, 0)); g.add(fb); }
  // the head: a rounded armoured capsule, no face; a ridge with a yellow stripe; two antennae in the approved pose, lit tips
  const hd = new T.Group(); { const sk = new T.Mesh(new T.SphereGeometry(1, 12, 8), std('#1e1f24', { roughness: 0.3, metalness: 0.45 })); sk.scale.set(0.125 * M, 0.095 * M, 0.17 * M); hd.add(sk);
    const rb = new T.Mesh(new T.BoxGeometry(0.15 * M, 0.02 * M, 0.042 * M), dark); rb.position.set(-0.012 * M, 0.088 * M, 0); hd.add(rb); const rt = new T.Mesh(new T.BoxGeometry(0.12 * M, 0.007 * M, 0.018 * M), keel); rt.position.set(-0.012 * M, 0.1 * M, 0); hd.add(rt);
    const pose = [[[0.03, 0.06, -0.1], [0.07, 0.17, -0.15], [0.12, 0.31, -0.2], [0.21, 0.39, -0.24]], [[0.03, 0.06, 0.1], [0.12, 0.13, 0.17], [0.26, 0.15, 0.25], [0.37, 0.09, 0.3]]];
    for (const Q of pose) { const q = Q.map(p => p.map(v => v * M)); for (let j = 0; j < 3; j++) hd.add(rodBetween(q[j], q[j + 1], (0.028 - j * 0.004) * M, j === 1 ? dark : std('#1e1f24', { roughness: 0.3, metalness: 0.45 }), 6));
      for (let j = 0; j < 3; j++) hd.add(at3(new T.Mesh(new T.SphereGeometry((0.033 - j * 0.003) * M, 8, 6), joint), ...q[j])); const tip = at3(new T.Mesh(new T.SphereGeometry(0.027 * M, 8, 6), glow), ...q[3]); tip.userData.noInk = true; tip.userData.eye = true; hd.add(tip); } }
  hd.scale.setScalar(1.12); hd.position.set(...P(0.655, LIFT + 0.045, 0)); hd.rotation.set(0, -0.12, 0.12); hd.updateMatrixWorld(true);
  for (const q of hd.children.slice()) { q.updateMatrixWorld(true); q.geometry = q.geometry.clone(); q.geometry.applyMatrix4(q.matrixWorld); q.position.set(0, 0, 0); q.rotation.set(0, 0, 0); q.scale.set(1, 1, 1); q.updateMatrix(); g.add(q); }
  // seven legs a side: out from under the skirt, the knee up and out, an armoured shin down to a claw; a step in the walk
  const walk = o.walk === undefined ? 0.6 : o.walk;
  for (const sg of [-1, 1]) for (let k = 0; k < 7; k++) { const x = 0.47 - k * 0.15, p = prof(x), zs = (Wd / 2) * p, lean = (3 - k) * 0.014, ph = walk * Math.PI * 2 + (k % 2 ? Math.PI : 0) + (sg > 0 ? 0 : Math.PI / 2), sw = o.stand ? 0 : Math.sin(ph) * 0.03, up = o.stand ? 0 : Math.max(0, Math.cos(ph)) * 0.025;
    const hip = P(x, LIFT - 0.04, sg * zs * 0.6), knee = P(x + lean + sw * 0.5, 0.155 + up, sg * (zs * 1.3 + 0.05)), foot = P(x + lean * 2.4 + sw, 0.004 + up * 0.5, sg * (zs * 1.3 + 0.1));
    g.add(rodBetween(hip, knee, 0.02 * M, dark, 6)); g.add(at3(new T.Mesh(new T.SphereGeometry(0.028 * M, 8, 6), joint), ...knee)); g.add(rodBetween(knee, foot, 0.016 * M, std('#1e1f24', { roughness: 0.3, metalness: 0.45 }), 6)); }
  // the tail thrusters, lit inside
  for (const sg of [-1, 1]) { const a = P(-0.6, LIFT - 0.02, sg * 0.05), b = P(-0.74, LIFT - 0.05, sg * 0.12); g.add(rodBetween(a, b, 0.02 * M, dark, 6)); const n = at3(new T.Mesh(new T.SphereGeometry(0.024 * M, 8, 6), glow), ...b); n.userData.noInk = true; n.userData.eye = true; g.add(n); }
  setShadows(g); g.userData.ant = { cls, s, len: 1.4 * M, top: 0.5 * M }; return g; }

// ── HOW A CLONE SHOWS IT IS YOURS (?mark=): done to any body above after it is built, so every species takes the same mark ──
//   A  TEAL EYES AND A TEAL STRIPE: its eyes (and the lights in its colour) teal, a teal stripe down the middle of its back, its pale points teal
//   B  A TEAL RING AT ITS FEET: its body the enemy's but its eyes teal, a ring of teal light on the floor round it
//   C  TEAL-TINTED ARMOUR: its whole body tinted teal (as if grown in the lab), its eyes teal
function cdMark(g, mark) { if (!mark) return g; const teal = new T.Color(CD_TEAL).convertSRGBToLinear(), tc = new T.Color(), hsl = {}, th = {}; teal.getHSL(th);
  if (mark === 'C' && typeof antCloneTint === 'function') { antCloneTint(g); g.traverse(m => { if (m.isMesh && m.userData.eye) m.material = glowMat(CD_TEAL, 1.0); }); return g; }   // (C as built, 2026-11-23: the game's own tint, chamber.js ANT_CLONE)
  const box = new T.Box3().setFromObject(g), cx = (box.min.z + box.max.z) / 2, halfW = (box.max.z - box.min.z) / 2, H = box.max.y - box.min.y;
  g.traverse(m => { if (!m.isMesh) return; const mat = m.material;
    if (m.userData.eye) { m.material = glowMat(CD_TEAL, 1.0); if (mat.side === T.DoubleSide) m.material.side = T.DoubleSide; return; }
    if (mark === 'A' && mat.userData && (mat.userData.tip || mat.userData.stripe)) { if (!mat.userData._teal) { mat.color.copy(teal).multiplyScalar(0.9); mat.userData._teal = true; } return; }
    if (mark === 'C') { if (mat.vertexColors && m.geometry.attributes.color) { const c = m.geometry.attributes.color; for (let i = 0; i < c.count; i++) { tc.setRGB(c.getX(i), c.getY(i), c.getZ(i)); tc.getHSL(hsl); tc.setHSL(th.h, Math.min(1, hsl.s * 0.55 + 0.25), hsl.l * 1.1); c.setXYZ(i, tc.r, tc.g, tc.b); } c.needsUpdate = true; }
      else if (!mat.isMeshBasicMaterial && !mat.userData._teal) { mat.color.getHSL(hsl); mat.color.setHSL(th.h, Math.min(1, hsl.s * 0.55 + 0.25), hsl.l * 1.1); mat.userData._teal = true; } return; }
    if (mark === 'A' && mat.vertexColors && m.geometry.attributes.color) {   // the stripe: the top of each armour part, near the middle of the back
      const p = m.geometry.attributes.position, c = m.geometry.attributes.color; m.geometry.computeBoundingBox(); const bb = m.geometry.boundingBox, top = bb.max.y, hh = Math.max(1e-6, bb.max.y - bb.min.y);
      for (let i = 0; i < p.count; i++) { const y = p.getY(i), z = p.getZ(i), near = Math.abs(z - cx) / Math.max(1e-6, halfW), up = (y - bb.min.y) / hh;
        if (near < 0.075 && up > 0.6 && y > box.min.y + H * 0.15) { const kk = Math.min(1, (0.075 - near) / 0.03); tc.setRGB(c.getX(i), c.getY(i), c.getZ(i)).lerp(teal, 0.85 * kk); c.setXYZ(i, tc.r, tc.g, tc.b); } }
      c.needsUpdate = true; } });
  if (mark === 'B') { const r = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) * 0.5 * 0.92, mk = (r0, r1, al) => { const mm = new T.Mesh(new T.RingGeometry(r0, r1, 40), glowMat(CD_TEAL, 1.0, { transparent: true, opacity: al, depthWrite: false, side: T.DoubleSide })); mm.rotation.x = -Math.PI / 2; mm.position.set((box.min.x + box.max.x) / 2, 0.006, cx); mm.userData.noInk = true; mm.castShadow = false; mm.receiveShadow = false; g.add(mm); };
    mk(r * 0.9, r, 0.95); mk(0.001, r * 0.9, 0.16); }
  return g; }

// ── THE HOOK: the view's buildAnt, for every species this file builds. The served view hands a creature's species and whether it is a clone in `accent` as
// "species|colour|mark" (render.js PATCHES); a plain colour is an ant, as before. ──
const CD_MARK = (/[?&]mark=([ABC])/.exec(String(location.search || '')) || [])[1] || null;
const CD_BUILD = { ant: (P, o) => stalkerAnt(P, o, STALKER_D), beetle: (P, o) => cdBeetle(o), scorpion: (P, o) => cdScorpion(o), spider: (P, o) => cdSpider(o), mantis: (P, o) => (/[?&]mantis=1/.test(String(location.search || '')) ? cdMantis(o) : cdMantis2(o)), moth: (P, o) => cdMoth(o), rolypoly: (P, o) => cdRoly(o) };
buildAnt = function (P, o) { o = Object.assign({}, o || {}); let sp = 'ant', mark = null; window.__antP = P;
  if (typeof o.accent === 'string' && o.accent.indexOf('|') >= 0) { const q = o.accent.split('|'); sp = q[0]; o.accent = q[1]; mark = q[2] || null; }
  const f = CD_BUILD[sp] || CD_BUILD.ant; return cdMark(f(P, o), mark); };
window.__CD = { mark: CD_MARK, species: Object.keys(CD_BUILD), W: CD_W, ref: CD_REF,
  ok: a => !!a && !window.__CD.off && !(a.untargetable && a._burrow) && !!CD_BUILD[a.speciesName] && (a.speciesName !== 'ant' || !!CD_ANT_W[a.className]),
  w: a => a.dimensions && a.dimensions.width > 0 ? a.dimensions.width : ((CD_W[a.speciesName] || CD_ANT_W)[a.className] || 22),
  size: a => { const cw = a.speciesName === 'ant' ? CD_ANT_W[a.className] : (CD_W[a.speciesName] || {})[a.className] || CD_REF[a.speciesName] || 22; return Math.round(50 * window.__CD.w(a) / cw) / 100; },
  accent: a => (a.speciesName || 'ant') + '|' + (a.color || ANT_COLOUR) + '|' + (a.isClone || a.team === 'green' ? (window.__CD.mark || 'A') : '') };
window.__antKit = { build: o => buildAnt(window.__antP, o), toonify: (g, grad) => toonify(g, grad, { sat: 1.1 }) };
