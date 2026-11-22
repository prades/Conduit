// MORE MENACING INSECTS: drafts for the owner (2026-11-22; Proposed, nothing in the game). The owner: "I want to make the insects look a bit more menacing.
// Let me draw inspiration from other titles and give our predators a overall better and more intimidating, less generic look."
// Injected by design/insects/render.js into the game's 3D view (dist/view3d.js, served changed, never written) inside the view's own scope, after the
// round 2 chamber (design/style-evolution/round2/chamber.js buildAnt): with ?draft=X on the page it replaces buildAnt for that look. Without it, nothing.
// It also lets the view draw THE ANT QUEEN (class boss) as an ant body, for the pictures (the game today leaves her to its 2D drawing).
const DRAFTS = {};   // (each look: DRAFTS.X = (P, o, base) => a THREE.Group, as buildAnt makes; below)
(function () {
  const m = /[?&]draft=(\w+)/.exec(String(location.search || '')), D = m ? m[1] : null;
  if (/[?&]queen3d=1/.test(String(location.search || ''))) { ANT_W.boss = 26; ANT_JAW_LEN.boss = 1.35; }
  if (!D || D === "0") { const b0 = buildAnt; buildAnt = function (P, o) { window.__antP = P; return b0(P, o); }; return; }
  const base = buildAnt;
  buildAnt = function (P, o) { window.__antP = P; const f = DRAFTS[D]; return f ? f(P, o || {}, base) : base(P, o); };
})();

// ── THE STALKER: one direction (the owner, 2026-11-22, of the reference links: "OK Starship Troopers thing looks cool. Let's implement that, please"), taken from the
// Warrior Bug's PRINCIPLES only, never its creature: tall jointed stilt legs that lift the body, an armoured plated carapace, sickle forelimbs held up ready to strike,
// pincer jaws, a lean predatory stance, earthy mottled armour, skittering motion. Still an ant: a heart-shaped head with the approved sickle jaws and slanted eyes
// (2026-11-13, "Very right direction"), elbowed antennae, a thorax, a waist node and a banded gaster. Its front pair of legs is what becomes the sickles.
// Three variations of it (V): A measured, B full, C in today's colours. Every number here is the agent's, provisional.
const STALKER_V = {
  A: { lift: 4.5, knee: 10, ankle: 6, reach: 1.12, scythe: 0.85, jaw: 1.15, spines: 0.6, pal: ['#3b2b1d', '#86643a', '#16100b'], tip: '#d9c39a', leg: '#21180f', mottle: 0.8 },
  B: { lift: 7, knee: 15, ankle: 8, reach: 1.3, scythe: 1.2, jaw: 1.3, spines: 1, pal: ['#4e3219', '#b08848', '#170f08'], tip: '#ead6a8', leg: '#2a1b0e', mottle: 0.95 },
  // ROUND 2 (the owner: "a little bit confusing. I like it all"): every feature kept, the shape made clear: a heavier, bigger, plated body (bk), short thick legs
  // with the knees still high and the hooks, the sickles bigger, thicker and in a shade of their own so they read first; antennae thicker. D earthy, E today's colours
  D: { lift: 1.5, knee: 6, ankle: 3.5, reach: 0.82, scythe: 1.05, jaw: 1.25, spines: 0.8, bk: 1.38, head: 1.08, legW: 1.75, sw: 1.4, antW: 1.6, spread: 0.45, antH: 5, tipAt: 0.6, pal: ['#5a3418', '#b8874a', '#1a0f07'], tip: '#f2e2bd', leg: '#2b1a0d', sick: '#c99c5e', mottle: 0.9 },
  E: { lift: 1.5, knee: 6, ankle: 3.5, reach: 0.82, scythe: 1.05, jaw: 1.25, spines: 0.8, bk: 1.38, head: 1.08, legW: 1.75, sw: 1.4, antW: 1.6, spread: 0.45, antH: 5, tipAt: 0.6, pal: ['#1c1824', '#4a3466', '#0c0a10'], tip: '#ddd4ef', leg: '#141218', sick: '#7a6a9c', mottle: 0.85 },
  C: { lift: 4.5, knee: 10, ankle: 6, reach: 1.12, scythe: 0.85, jaw: 1.15, spines: 0.6, pal: ['#1c1824', '#4a3466', '#0c0a10'], tip: '#b9aed0', leg: '#141218', mottle: 0.85 },
};
function stalkerAnt(P, o, V) {
  const cls = o.cls || 'scout', queen = cls === 'boss', soldier = cls === 'tank' || queen, s = (ANT_W[cls] || 22) / 22 * (o.size || 1), U = 0.4 * s, BK = V.bk || 1, UB = U * BK, zk = o.zk || ANT_ZK, Z = z => z / UH * s * zk;
  const hsz = (queen ? 1.25 : soldier ? 1.3 : 1) * (V.head || 1), ml = (ANT_JAW_LEN[cls] || 1.05) * V.jaw, open = o.open === undefined ? 0.01 : o.open, strike = Math.min(1, open / 0.3), walk = o.walk === undefined ? 0.6 : o.walk;
  const accent = o.accent || ANT_COLOUR, eye = glowMat(accent, 1.0), g = new T.Group();
  const lin = h => new T.Color(h).convertSRGBToLinear(), C0 = lin(V.pal[0]), C1 = lin(V.pal[1]), C2 = lin(V.pal[2]);
  const armour = std('#ffffff', { roughness: 0.42, metalness: 0.25 }); armour.vertexColors = true;
  const legM = std(V.leg, { roughness: 0.45, metalness: 0.3 }), tipM = std(V.tip, { roughness: 0.3, metalness: 0.45 }), sickM = V.sick ? std(V.sick, { roughness: 0.35, metalness: 0.35 }) : null, LW = V.legW || 1, SW = V.sw || 1, TA = V.tipAt || 0.72;
  // the mottle: blotches from a few sines over the body's own space (no picture: a colour a vertex), plate edges and the underside darker
  const mot = (x, y, z) => { const n = Math.sin(x * 23.1 + z * 7.3) * Math.sin(z * 19.7 - x * 5.1 + 1.3) + 0.6 * Math.sin(x * 41 + y * 37 + z * 29) + 0.35 * Math.sin((x - z) * 61 + y * 13); return Math.max(0, Math.min(1, (n - 0.15) * 1.4)); };
  const paint = (mesh, edge) => { const geo = mesh.geometry, p = geo.attributes.position, n = p.count, c = new Float32Array(n * 3), box = (geo.computeBoundingBox(), geo.boundingBox), tc = new T.Color();
    for (let i = 0; i < n; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = mot(x / s, y / s, z / s) * V.mottle, h = (y - box.min.y) / Math.max(1e-6, box.max.y - box.min.y);
      tc.copy(C0).lerp(C1, k); if (edge) tc.lerp(C2, edge(x, y, z, h)); tc.lerp(C2, Math.max(0, 0.45 - h) * 0.9); c[i * 3] = tc.r; c[i * 3 + 1] = tc.g; c[i * 3 + 2] = tc.b; }
    geo.setAttribute('color', new T.BufferAttribute(c, 3)); return mesh; };
  const NR = 20, ring = (f0, L, W, z, K, tilt) => { const r = []; for (let i = 0; i < NR; i++) { const t = i / NR * Math.PI * 2, k = K ? K[i] : 1, f = L * Math.cos(t) * k; r.push([(f0 + f) * UB, Z(z + (tilt || 0) * f / Math.max(1e-6, L) * L * 10), W * Math.sin(t) * k * UB]); } return r; };
  const blob = (f0, L, W, z0, rz, o2) => { o2 = o2 || {}; const rings = [], nr = o2.rings || 9; for (let i = 0; i <= nr; i++) { const ph = -Math.PI / 2 + Math.PI * (i + 0.5) / (nr + 1), k = Math.sin(ph), sc = Math.cos(ph);
      const top = k > 0 && o2.ridge ? 1 + o2.ridge * k * k : 1; rings.push(ring(f0, L * sc, W * sc / top, z0 + rz * BK * k * top, o2.K, o2.tilt)); } return paint(loft(rings, armour), o2.edge); };
  const cone = (a, b, r, mat) => { const m = rodBetween(a, b, 1, mat || armour, 6), d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); m.geometry.dispose(); m.geometry = new T.ConeGeometry(r, d, 6); m.geometry.translate(0, 0, 0); if (!mat) paint(m); return m; };
  const L = V.lift * (queen ? 0.7 : 1), zb = 8 + L;   // the body's height: lifted on the stilts
  // THE GASTER: plates, overlapping, front to back, tipped up a little; a queen's swollen; a sting
  const gq = queen ? 1.5 : 1, segs = [[-0.6, 0.17, 0.78], [-0.78, 0.2, 1], [-0.97, 0.19, 0.94], [-1.14, 0.15, 0.72]];
  for (const [f, l, k] of segs) { const zz = zb + 1.2 + (-0.6 - f) * 3.2; g.add(blob(f * (queen ? 1.08 : 1) - (queen ? 0.05 : 0), l * gq * 1.15, 0.36 * k * gq, zz, 5 * k * gq, { ridge: 0.12, edge: (x, y, z, h) => Math.pow(Math.abs(Math.cos(((x / U) - f) / (l * gq * 1.15) * Math.PI / 2)), 0.3) < 0.6 ? 0.7 : 0 })); }
  const tipF = (-1.14 - 0.17) * (queen ? 1.08 : 1) - (queen ? 0.12 : 0), tipZ = zb + 1.2 + 0.54 * 3.2;
  g.add(cone([tipF * UB, Z(tipZ), 0], [(tipF - 0.25) * UB, Z(tipZ - 1.5), 0], 0.05 * UB, tipM));
  // THE WAIST: a node with a thorn
  g.add(blob(-0.38, 0.09, 0.08, zb, 2.6, { rings: 5 })); g.add(cone([-0.38 * UB, Z(zb + 2.2), 0], [-0.44 * UB, Z(zb + 2.2 + 4 * V.spines), 0], 0.035 * UB));
  // THE THORAX: long, its front raised (the lean stance), a plated back with thorns along the ridge
  g.add(blob(0.0, 0.34, 0.17, zb + 1.2, 3.2, { tilt: 0.25, ridge: 0.25 }));
  for (const [f, h] of [[-0.18, 3], [0.02, 4.2], [0.2, 3.4]]) g.add(cone([f * UB, Z(zb + 1.2 + 3.2 + f * 2.5 - 0.4), 0], [(f - 0.08) * UB, Z(zb + 1.2 + 3.2 + f * 2.5 + h * V.spines), 0], 0.045 * UB));
  // THE HEAD: the approved heart shape (a soldier's more so), raised, a crest of two back-swept horns over the lobes, the eyes under a heavy brow
  const hf = 0.4 + 0.22 * hsz, hL = 0.22 * hsz, hW = 0.25 * hsz, hz = zb + 3.2 * BK, hr = 3.4 * hsz * BK, lobe = soldier ? 0.18 : 0.12, notch = soldier ? 0.26 : 0.18;
  const K = []; for (let i = 0; i < NR; i++) { const t = i / NR * Math.PI * 2, c = Math.cos(t), a = Math.abs(Math.atan2(Math.sin(t), c)); K.push((c > 0 ? 1 - 0.18 * c : 1) + lobe * Math.exp(-(a - 2.3) * (a - 2.3) / 0.12) - notch * Math.exp(-(a - Math.PI) * (a - Math.PI) / 0.05)); }
  g.add(blob(hf, hL, hW, hz, hr, { K, ridge: 0.1 }));
  for (const side of [-1, 1]) {
    g.add(cone([(hf - hL * 0.55) * UB, Z(hz + hr * 0.6), side * hW * 0.7 * UB], [(hf - hL * 1.45) * UB, Z(hz + hr * (0.9 + 0.5 * V.spines)), side * hW * 0.95 * UB], 0.05 * UB * hsz));
    const a = [(hf + hL * 0.02) * UB, Z(hz + hr * 0.5), side * hW * 0.9 * UB], b = [(hf + hL * 0.5) * UB, Z(hz + hr * 0.32), side * hW * 0.62 * UB], e = rodBetween(a, b, Z(1.05) * hsz, eye, 8); e.userData.noInk = true; g.add(e);
    g.add(rodBetween([(hf - hL * 0.1) * UB, Z(hz + hr * 0.82), side * hW * 0.95 * UB], [(hf + hL * 0.6) * UB, Z(hz + hr * 0.6), side * hW * 0.28 * UB], Z(1.0), legM, 6));
    const p0 = [(hf + hL * 0.6) * UB, Z(hz + hr * 0.6), side * 0.09 * UB], p1 = [(hf + hL * 0.5 + 0.1) * UB, Z(hz + (V.antH || 8)), side * 0.3 * UB], p2 = [(hf + hL + 0.42) * UB, Z(hz + 3), side * 0.32 * UB]; g.add(rodBetween(p0, p1, 0.009 * s * (V.antW || 1), legM, 6)); g.add(rodBetween(p1, p2, 0.007 * s * (V.antW || 1), legM, 6)); }
  // THE JAWS: the approved sickles, longer, two teeth on the inner edge; `open` spreads them for the bite
  for (const side of [-1, 1]) { const op = open * 1.2, b0 = hf + hL * 0.7, b1 = side * 0.12 * hsz, c0 = hf + hL + 0.12 * ml, c1 = side * (0.24 * hsz + op), d0 = hf + hL + 0.38 * ml, d1 = side * (0.22 * hsz + op), t0 = hf + hL + 0.5 * ml, t1 = side * (0.03 + op * 1.1);
    const bez = u => { const v = 1 - u, A = v * v * v, B = 3 * v * v * u, C = 3 * v * u * u, D = u * u * u; return [A * b0 + B * c0 + C * d0 + D * t0, A * b1 + B * c1 + C * d1 + D * t1]; };
    const outer = [], inner = [], tipO = [], tipI = []; for (let i = 0; i <= 10; i++) { const u = i / 10, p = bez(u), q = bez(Math.min(1, u + 0.01)), r = bez(Math.max(0, u - 0.01)); let nx = r[1] - q[1], ny = q[0] - r[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl; if (ny * side < 0) { nx = -nx; ny = -ny; }
      const w = 0.09 * hsz * Math.pow(1 - u, 0.8) * (u < 0.15 ? 0.7 + 2 * u : 1), oo = [p[0] + nx * w, p[1] + ny * w], ii = [p[0] - nx * w, p[1] - ny * w]; outer.push(oo); inner.push(ii); if (u >= 0.6) { tipO.push(oo); tipI.push(ii); }
      if (i === 3 || i === 6) inner.push([p[0] - nx * (w + 0.07 * ml) + 0.03 * ml, p[1] - ny * (w + 0.07 * ml)]); }
    const blade = (pts, mat, lift, th) => { const sh = new T.Shape(pts.map(p => new T.Vector2(p[0] * UB, p[1] * UB))), m = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: Z(th || 1.8), bevelEnabled: false }), mat); m.rotation.x = Math.PI / 2; m.position.y = Z(hz - 0.8) + (lift || 0); if (mat === armour) paint(m); return m; };
    const tipPts = tipO.map(p => [p[0] + 0.004, p[1] + side * 0.004]).concat(tipI.slice().reverse().map(p => [p[0] + 0.004, p[1] - side * 0.004]));   // (the pale point a hair proud of the blade, all round: no two faces in one place)
    g.add(blade(outer.concat(inner.slice().reverse()), armour)); g.add(blade(tipPts, tipM, Z(0.15), 2.1)); }
  // THE SICKLES (its front legs): a thick arm up from the thorax's front to an elbow over the head, the blade hanging forward and down from it, serrated, its point
  // pale. At rest held high and folded (ready); on a bite (`open`) swung forward and down at what is in front
  const sc = V.scythe * (queen ? 1.15 : 1);
  for (const side of [-1, 1]) {
    const sh = [0.24 * UB, Z(zb + 2.6), side * 0.13 * UB];
    const ex = (0.3 + 0.18 * strike) * sc, ey = (zb + (5.5 * sc + 1.5) * BK - 2.5 * strike * sc), elbow = [(0.24 + ex) * UB, Z(ey), side * 0.3 * UB];
    g.add(paint(rodBetween(sh, elbow, 0.026 * s * Math.max(1, sc) * SW, armour, 7))); g.add(at3(new T.Mesh(new T.SphereGeometry(0.028 * s * Math.max(1, sc) * SW, 8, 6), legM), elbow[0], elbow[1], elbow[2]));
    // the blade, a flat curved shape in its own plane (u along it, v across), turned to hang from the elbow: down and forward at rest, out and forward on the strike
    const len = 0.9 * sc, pts = [], N = 9; for (let i = 0; i <= N; i++) { const u = i / N, w = 0.075 * sc * SW * (1 - u * 0.85); pts.push([u * len, 0.12 * sc * Math.sin(u * Math.PI) + w]); }
    const inn = []; for (let i = N; i >= 0; i--) { const u = i / N, w = 0.075 * sc * SW * (1 - u * 0.85), bump = i > 0 && i < N && i % 2 === 0 ? 0.05 * sc : 0; inn.push([u * len, 0.12 * sc * Math.sin(u * Math.PI) - w - bump]); }
    const shp = new T.Shape(pts.concat(inn).map(p => new T.Vector2(p[0] * UB, p[1] * UB))), bm = new T.Mesh(new T.ExtrudeGeometry(shp, { depth: Z(1.2 * SW), bevelEnabled: false }), sickM || armour); if (!sickM) paint(bm);
    const tipShp = new T.Shape([[len * TA, 0.12 * sc * Math.sin(TA * Math.PI) + 0.075 * sc * SW * (1 - TA * 0.85) * 1.08], [len, 0.075 * sc * SW * 0.17], [len, -0.075 * sc * SW * 0.17], [len * TA, 0.12 * sc * Math.sin(TA * Math.PI) - 0.075 * sc * SW * (1 - TA * 0.85) * 1.08]].map(p => new T.Vector2(p[0] * UB, p[1] * UB))), tm = new T.Mesh(new T.ExtrudeGeometry(tipShp, { depth: Z(1.2 * SW + 0.4), bevelEnabled: false }), tipM);
    const pivot = new T.Group(); pivot.position.set(elbow[0], elbow[1], elbow[2] - Z(0.6)); bm.position.z = 0; tm.position.z = -Z(0.2); pivot.add(bm); pivot.add(tm);
    pivot.rotation.z = -0.3 - 0.75 * strike; pivot.rotation.y = -side * ((V.spread || 0.32) - 0.22 * strike); pivot.updateMatrixWorld(true);
    for (const q of [bm, tm]) { q.geometry.applyMatrix4(q.matrixWorld); q.position.set(0, 0, 0); q.rotation.set(0, 0, 0); q.updateMatrix(); g.add(q); } }   // (baked in place: a body's poses are meshes only, view3d/core.js antBody)
  // THE STILTS: the middle and hind legs, long, each knee far up over the body and out to the side, an ankle, a hooked foot; a thorn on each knee
  const LEGS = [{ f: 0.06, hs: 0.15, kf: 0.18, ks: 0.66, af: 0.3, as: 1.1, tf: 0.42, ts: 1.28 }, { f: -0.14, hs: 0.14, kf: -0.36, ks: 0.66, af: -0.7, as: 1.06, tf: -0.92, ts: 1.22 }];
  LEGS.forEach((Lg, i) => { for (const side of [-1, 1]) { const ph = walk * Math.PI * 2 + ((i % 2 === 0) === (side > 0) ? 0 : Math.PI), sw = o.stand ? 0 : Math.sin(ph) * 0.42, up = o.stand ? 0 : Math.pow(Math.max(0, Math.cos(ph)), 0.5) * 5;
    const R = V.reach * (queen ? 1.1 : 1), hip = [Lg.f * UB, Z(zb + 0.6), side * Lg.hs * UB], knee = [(Lg.f + Lg.kf * R + sw * 0.4) * U, Z(zb + V.knee * (queen ? 0.75 : 1) + up * 0.6), side * Lg.ks * R * U], ank = [(Lg.f + Lg.af * R + sw * 0.75) * U, Z(V.ankle + up), side * Lg.as * R * U], foot = [(Lg.f + Lg.tf * R + sw) * U, Z(up * 0.4) + 0.012, side * Lg.ts * R * U];
    g.add(rodBetween(hip, knee, 0.024 * s * LW, legM, 7)); g.add(rodBetween(knee, ank, 0.017 * s * LW, legM, 7)); g.add(rodBetween(ank, foot, 0.011 * s * LW, legM, 6));
    g.add(at3(new T.Mesh(new T.SphereGeometry(0.026 * s * LW, 8, 6), legM), knee[0], knee[1], knee[2])); g.add(cone(knee, [knee[0] - 0.02 * U, knee[1] + Z(1.2 + 1.6 * V.spines), knee[2] + side * 0.05 * U], 0.022 * s * LW, legM)); } });
  // A QUEEN: the scars of her shed wings on the thorax, and a crown of short thorns along her head's back
  if (queen) { for (const side of [-1, 1]) g.add(cone([-0.05 * UB, Z(zb + 4.2), side * 0.12 * UB], [-0.45 * UB, Z(zb + 6.5), side * 0.32 * UB], 0.06 * UB, tipM));
    for (let k = -2; k <= 2; k++) g.add(cone([(hf - hL * 0.6) * UB, Z(hz + hr * 0.85), k * 0.06 * UB], [(hf - hL * 1.1) * UB, Z(hz + hr * 1.35 + (2 - Math.abs(k))), k * 0.09 * UB], 0.03 * UB)); }
  setShadows(g); g.userData.ant = { cls, s, len: 2.95 * UB, top: Z(Math.max(hz + hr + 3, zb + 5.5 * sc + 4)), headAt: [hf * UB, Z(hz), 0], jawTip: [(hf + hL + 0.5 * ml) * UB, Z(hz - 0.8), 0] };
  return g;
}
for (const k of Object.keys(STALKER_V)) DRAFTS[k] = (P, o) => stalkerAnt(P, o, STALKER_V[k]);
// for the pictures' own poses (design/insects/render.js: the clip): the builder, today's or the draft's, and the look's toon pass
window.__antKit = { build: o => buildAnt(window.__antP, o), toonify: (g, grad) => toonify(g, grad, { sat: 1.1 }) };
