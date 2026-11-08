// ── THE BLOOM MAGE, a little shrub (working name) · drafts No. 919 and No. 920 (2026-11-08) ─────────────────────────────────────────
// The owner's pencil sketch (2026-11-08; asked what it was for: "BLOOM's Mage") and words: "It's a little shrub that has vines coming out the bottom of it that inch it
// along to cover ground, and it has the rot shard poking out the back, which is now converted into pink for the bloom. It's mage." It replaces the lotus lantern as
// BLOOM's Mage (docs/CONVERSION.md §2). From the sketch: a round, bushy body, its outline all jagged points; a tall shard out of its upper back (the
// Rotshard's: the toxic Mage's eaten crystal with its black shell shard, design No. 101, js/evolution.js EVOLUTIONS.rotshard), now in BLOOM's pink; two long vines from
// its underside, trailing behind, their tips pointed. In BLOOM's finish (SUNDEW's No. 911, the coral crab's No. 914): velvet plum-black, the pink glowing round the shard's
// root as round the crab's crystals, the shard's crystal coloured facet by facet as theirs (_gemCol32, forms32.js).
//   919  as sketched: the bush a round mass of short pointed spikes (its outline jagged, as drawn).
//   920  the same, but mostly leaves: a mass of pointed leaves growing out from deep inside it (the owner, 2026-11-08), its round core only a shadow among them.
// It INCHES ALONG on its vines (its idle, which is its walk): each vine humps up as it draws in, then flattens and stretches as it pushes, the two in turn, and the bush
// lurches forward a little with each push. Its ACTION (a Mage's shot): the shard flares as it charges, the bush leans back and bristles, then rocks forward as it fires.
// Drafts for the owner's choice: not in the game. Uses forms5.js (corroded, shellShard), forms31.js (_c31, _prog31) and forms32.js (_taper32, _aim32, _gemCol32).
// The sketch's two squinting eyes were drawn on the first render; the owner: "No eyes. Just straight texture." So no eyes and no face: its foliage covers it all round.
// +z is the front; ph = 1.6 t runs once round the idle loop.
const _bsS = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const _bsRnd = s => () => (s = (s * 16807) % 2147483647) / 2147483647;   // (seeded: the bush comes out the same every time)
// a material whose glow is per vertex (aGlow, 0..1): BLOOM's pink, strongest round the shard's root, pulsing with glowK (the crab's way, forms38.js)
function _bsGlowMat(rough, flat, side, key) {
  const m = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, emissive: _c31(EL.color).convertSRGBToLinear(), metalness: 0, roughness: rough, flatShading: !!flat, side: side || T.FrontSide });
  m.envMapIntensity = 0.06; const U = { value: 1 };
  m.onBeforeCompile = sh => { sh.uniforms.glowK = U;
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nattribute float aGlow;\nvarying float vGlow;').replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = aGlow;');
    sh.fragmentShader = 'uniform float glowK;\nvarying float vGlow;\n' + sh.fragmentShader.replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vGlow * glowK;'); };
  m.customProgramCacheKey = () => 'bsGlow' + key;
  return { m, U };
}
// triangles gathered into one mesh's arrays: a, b, c (points), the colours at each and their glow
function _bsTris() {
  const pos = [], col = [], glw = [];
  return { pos, col, glw,
    tri(a, b, c, ca, cb, cc, ga, gb, gc) { pos.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z); col.push(ca.r, ca.g, ca.b, cb.r, cb.g, cb.b, cc.r, cc.g, cc.b); glw.push(ga, gb, gc); },
    geo() { const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new T.Float32BufferAttribute(col, 3)); g.setAttribute('aGlow', new T.Float32BufferAttribute(glw, 1)); g.computeVertexNormals(); return g; } };
}
function _bloomShrub(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const pink = _c31(EL.color).convertSRGBToLinear(), rnd = _bsRnd(o.seed || 23), up = V(0, 1, 0);
  const body = G(); b.add(body);   // (the bush and all it carries: it inches, lurches and bobs)
  const W = o.w, H = o.h, L = o.l;
  const onBush = (n, k, out) => out.set(n.x * W * k, n.y * H * k, n.z * L * k);   // the point of the bush at direction n, k times out from its middle
  const normal = n => V(n.x / W, n.y / H, n.z / L).normalize();   // the bush's outward normal there
  const sDir = V(...o.shard.at).normalize(), sRoot = onBush(sDir, o.coreK || 1, V(0, 0, 0));   // (the shard's root: on the core)
  const glowAt = P => o.glowK * Math.exp(-P.distanceToSquared(sRoot) / (o.glowR * o.glowR));   // (the pink round the shard's root)
  const dark = _c31(o.dark).convertSRGBToLinear(), light = _c31(o.light).convertSRGBToLinear(), C = new T.Color();
  // ── THE CORE: a smooth round mass under the foliage (920: smaller and near black, only the shadow deep among its leaves) ──
  const coreGeo = new T.SphereGeometry(1, 48, 32), cp = coreGeo.attributes.position, ccol = new Float32Array(cp.count * 3), cglw = new Float32Array(cp.count), n = V(0, 0, 0), P = V(0, 0, 0);
  const cdk = o.coreDark != null ? _c31(o.coreDark).convertSRGBToLinear() : dark;
  for (let i = 0; i < cp.count; i++) {
    n.set(cp.getX(i), cp.getY(i), cp.getZ(i)).normalize(); onBush(n, (o.coreK || 1) * (n.y < 0 ? 1 - 0.18 * n.y * n.y : 1), P); cp.setXYZ(i, P.x, P.y, P.z);   // (its underside a little flatter)
    ccol[i * 3] = cdk.r; ccol[i * 3 + 1] = cdk.g; ccol[i * 3 + 2] = cdk.b; cglw[i] = glowAt(P);
  }
  coreGeo.setAttribute('color', new T.BufferAttribute(ccol, 3)); coreGeo.setAttribute('aGlow', new T.BufferAttribute(cglw, 1)); coreGeo.computeVertexNormals();
  const coreM = _bsGlowMat(o.rough, false, null, 'core'); body.add(new T.Mesh(coreGeo, coreM.m));
  // ── THE FOLIAGE ──
  const F = _bsTris(), A = V(0, 0, 0), Q = V(0, 0, 0), t1 = V(0, 0, 0), t2 = V(0, 0, 0), dd = V(0, 0, 0);
  if (!o.mass) {   // 919: spikes at points all over the bush (a Fibonacci sphere, jostled), none under it or at the shard's root
    const spots = [];
    for (let i = 0; i < o.leafN; i++) {
      const y = 1 - 2 * (i + 0.5) / o.leafN, r = Math.sqrt(1 - y * y), a = i * 2.39996 + 0.5 * (rnd() - 0.5);
      const d = V(r * Math.cos(a), y, r * Math.sin(a)).add(V(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.16)).normalize();
      if (d.y < o.leafBottom || d.dot(sDir) > 0.96) continue;
      spots.push({ d, s: 0.75 + 0.5 * rnd(), w: 0.8 + 0.4 * rnd(), turn: rnd() * PI, sw: rnd() });
    }
    for (const sp of spots) {
      onBush(sp.d, o.leafSink, Q); const nn = normal(sp.d);
      dd.copy(nn).addScaledVector(up, o.sweep * (0.5 + sp.sw)).normalize();   // (each swept a little upward)
      t1.crossVectors(up, dd); if (t1.lengthSq() < 1e-6) t1.set(1, 0, 0); t1.normalize().applyAxisAngle(dd, sp.turn); t2.crossVectors(dd, t1).normalize();
      const len = o.leafL * sp.s, wid = o.leafW * sp.w, g0 = glowAt(Q);
      A.copy(Q).addScaledVector(dd, len);   // (a spike: a flattened four-sided point)
      const c = [Q.clone().addScaledVector(t1, wid), Q.clone().addScaledVector(t2, wid * o.flatten), Q.clone().addScaledVector(t1, -wid), Q.clone().addScaledVector(t2, -wid * o.flatten)], ax = Q.clone().addScaledVector(dd, len / 3);
      const tip = C.copy(dark).lerp(light, 0.85).clone(), g1 = glowAt(A);
      for (let k = 0; k < 4; k++) { const p0 = c[k], p1 = c[(k + 1) % 4], nrm = V(0, 0, 0).subVectors(p1, p0).cross(V(0, 0, 0).subVectors(A, p0)), mid = V(0, 0, 0).add(p0).add(p1).add(A).divideScalar(3);
        if (nrm.dot(mid.sub(ax)) < 0) F.tri(p1, p0, A, dark, dark, tip, g0, g0, g1); else F.tri(p0, p1, A, dark, dark, tip, g0, g0, g1); }
    }
  } else {   // 920 since the owner's "it should be mostly leaves": a mass of pointed leaves, each from deep in the bush out past its core, at its own angle, arching a little
    const B = o.mass, R = V(0, 0, 0), c = V(0, 0, 0), j = V(0, 0, 0), floorY = 0.004 - o.bodyY, rows = Array.from({ length: B.seg + 1 }, () => ({ l: V(0, 0, 0), m: V(0, 0, 0), r: V(0, 0, 0), u: 0 }));
    for (let i = 0; i < B.n; i++) {
      const y = 1 - 2 * (i + 0.5) / B.n, r = Math.sqrt(1 - y * y), a = i * 2.39996;
      const d = V(r * Math.cos(a), y, r * Math.sin(a)).add(j.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5).multiplyScalar(0.3)).normalize();
      const foot = B.foot[0] + (B.foot[1] - B.foot[0]) * rnd(), lenK = B.vary[0] + (B.vary[1] - B.vary[0]) * rnd(), wK = 0.7 + 0.6 * rnd(), droop = B.droop * (0.5 + rnd()), tone = 0.6 + 0.65 * rnd(), turn = (rnd() - 0.5) * PI;
      j.set(rnd() - 0.5, rnd() - 0.5, rnd() - 0.5);
      if (d.y < B.bottom || d.dot(sDir) > B.clear) continue;
      onBush(d, foot, R); dd.copy(normal(d)).addScaledVector(up, B.rise).addScaledVector(j, B.jit).normalize();   // (out from deep in the bush, a little up, each its own way)
      const tuft = 1 + B.tuft * Math.sin(5 * d.x + 2.3) * Math.sin(4 * d.y + 1.1) * Math.sin(5 * d.z + 0.7);   // (longer in tufts, shorter between: no round outline)
      const len = B.len * lenK * tuft, wid = B.wid * wK, lt = light.clone().multiplyScalar(tone);   // (lt: its tip's shade, each leaf its own)
      t1.crossVectors(up, dd); if (t1.lengthSq() < 1e-4) t1.set(1, 0, 0); t1.normalize().applyAxisAngle(dd, turn); t2.crossVectors(dd, t1).normalize();   // (t1 its width, turned its own way; t2 its face)
      for (let k = 0; k <= B.seg; k++) { const u = k / B.seg, half = wid * Math.pow(Math.sin(PI * Math.pow(Math.max(1e-4, u), B.prof[0])), B.prof[1]), w = rows[k];   // (pointed at both ends)
        c.copy(R).addScaledVector(dd, len * u); c.y -= droop * len * u * u; if (c.y < floorY) c.y = floorY;   // (arching over under its own weight; lying on the floor where it reaches it)
        w.u = u; w.l.copy(c).addScaledVector(t1, half); w.r.copy(c).addScaledVector(t1, -half); w.m.copy(c).addScaledVector(t2, B.fold * half); }
      for (let k = 0; k < B.seg; k++) { const a = rows[k], z = rows[k + 1], ca = C.copy(dark).lerp(lt, Math.pow(a.u, B.shade)).clone(), cz = C.copy(dark).lerp(lt, Math.pow(z.u, B.shade)).clone(), ga = glowAt(a.m), gz = glowAt(z.m);
        F.tri(a.l, a.m, z.l, ca, ca, cz, ga, ga, gz); F.tri(a.m, z.m, z.l, ca, cz, cz, ga, gz, gz); F.tri(a.m, a.r, z.m, ca, ca, cz, ga, ga, gz); F.tri(a.r, z.r, z.m, ca, cz, cz, ga, gz, gz); }
    }
  }
  const leafM = _bsGlowMat(o.rough, !o.mass, o.mass ? T.DoubleSide : null, o.mass ? 'leaf' : 'spike'); body.add(new T.Mesh(F.geo(), leafM.m));
  // ── THE SHARD out of its back: the Rotshard's eaten crystal (No. 101: r 0.34, h 1.5, its point 0.55, eaten up to half way) and its black shell shard, at the shrub's
  // size, in BLOOM's pink, leaning back; its foot sunk in the bush ──
  const k = o.shard.len / 1.5, ax = V(...o.shard.dir).normalize(), rs = G(); rs.position.copy(sRoot).addScaledVector(ax, -o.shard.sink * o.shard.len); _aim32(rs, ax, V(0, 0, 1)); rs.scale.setScalar(k); body.add(rs); rs.updateMatrix();
  const cgeo = corroded(0.34, 1.5, 0.55, o.shard.eaten, M.crystal, 0.5).geometry; cgeo.translate(0, 0.75, 0); cgeo.applyMatrix4(rs.matrix);
  const gems = [_gemCol32(cgeo, pink.clone().multiplyScalar(o.gemK))]; body.add(gems[0]);
  const shell = shellShard(0.8, 0.32, 0.05); shell.position.set(-0.05, 1.2, 0.28); shell.rotation.set(0.5, 0.25, 0.3); rs.add(shell);   // (where the Rotshard's is)
  // ── THE VINES: from its underside, trailing behind, their tips pointed; they hump and stretch in turn (it inches along on them) ──
  const vineM = new T.MeshStandardMaterial({ color: _c31(o.vine).convertSRGBToLinear(), emissive: pink.clone().multiplyScalar(o.vineGlow || 0), metalness: 0, roughness: 0.7 }); vineM.envMapIntensity = 0.12;   // (a faint pink in them, so they read on a dark floor)
  const vines = o.vines.map(([x, spread], i) => ({ x, spread, ph: i * PI, tube: _taper32(b, vineM, 24, 10), pts: Array.from({ length: 24 }, () => V(0, 0, 0)),
    leaves: Array.from({ length: o.vineLeaves }, (_, j) => { const m = new T.Mesh(new T.ConeGeometry(o.vineR * 1.6, o.vineR * 6, 4), vineM); m.scale.z = 0.35; b.add(m); return { m, u: 0.25 + 0.5 * j / Math.max(1, o.vineLeaves - 1), s: j % 2 ? 1 : -1 }; }) }));
  const Lt = new T.PointLight(0xffffff, 0.5, 1, 2); Lt.color.copy(_c31(EL.color)); Lt.position.copy(sRoot).addScaledVector(ax, 0.1); body.add(Lt); LIGHTS.push(Lt);
  const R0 = V(0, 0, 0), D = V(0, 0, 0), S = V(0, 0, 0);
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, pr = _prog31(t, act), charge = _bsS(0, 0.35, pr) * (1 - _bsS(0.42, 0.55, pr)), fire = _bsS(0.42, 0.52, pr) * (1 - _bsS(0.6, 1, pr)), calm = 1 - 0.7 * Math.min(1, act || 0);
    const push = Math.cos(2 * ph);   // (a push of its vines, twice round the loop: 1 at the end of one, -1 between)
    body.position.set(0, o.bodyY + o.bob * Math.abs(Math.sin(2 * ph)) * calm, o.lurch * push * calm - 0.02 * charge + 0.03 * fire);
    body.rotation.x = -0.14 * charge + 0.12 * fire + 0.03 * Math.sin(2 * ph) * calm; body.scale.set(1 + 0.03 * charge, 1 - 0.03 * Math.abs(Math.sin(2 * ph)) * calm + 0.05 * charge, 1 + 0.03 * charge);
    const glow = (0.85 + 0.15 * Math.sin(2 * ph)) * (1 + 1.2 * Math.max(charge, fire)); coreM.U.value = leafM.U.value = glow; Lt.intensity = 0.5 * glow;
    const gk = 1.4 * Math.max(0, glow - 0.85); gems.forEach(m => m.userData.relight(gk));   // (the shard flares as it charges and fires)
    for (const v of vines) {
      const e = 0.5 + 0.5 * Math.cos(2 * ph + v.ph), hump = o.hump * (1 - e) * calm + 0.01, len = o.vineL * (0.7 + 0.3 * (calm < 1 ? 0.5 : e));   // (e: 1 stretched out, 0 drawn in under a hump)
      R0.set(v.x, body.position.y - H * 0.75, body.position.z - L * 0.15); D.set(Math.sin(v.spread), 0, -Math.cos(v.spread));
      for (let i = 0; i < 24; i++) { const u = i / 23, drop = Math.min(1, u / 0.18);
        S.copy(R0).addScaledVector(D, len * u); S.x += Math.sin(v.spread) * 0.04 * Math.sin(PI * u);
        S.y = R0.y * (1 - _bsS(0, 1, drop)) + (o.vineR * 0.8 + hump * Math.sin(PI * Math.min(1, Math.max(0, (u - 0.12) / 0.8)))) * _bsS(0, 1, drop);   // (down from the bush to the floor, then the hump)
        v.pts[i].copy(S); }
      v.tube.set(v.pts, 0, 0, u => o.vineR * (1 - 0.92 * Math.pow(u, 1.3)) + 0.0015, 1, 1);
      for (const lf of v.leaves) { const i = Math.round(lf.u * 23), p = v.pts[i], q = v.pts[Math.min(23, i + 1)]; lf.m.position.copy(p); lf.m.position.y += o.vineR * 0.6;
        const dir = V(0, 0, 0).subVectors(q, p).normalize().applyAxisAngle(up, lf.s * 1.0); dir.y = 0.55; _aim32(lf.m, dir.normalize(), up); }
    }
  } };
}
const _bsA = {
  S: 1, coreY: 0.22, seed: 23, bodyY: 0.15, w: 0.17, h: 0.145, l: 0.16, rough: 0.92,
  dark: 0x120a10, light: 0x4a2540,   // (velvet plum-black; its points paler toward their tips)
  leafN: 64, leafBottom: -0.55, leafSink: 0.86, leafL: 0.1, leafW: 0.04, flatten: 0.45, sweep: 0.3,
  shard: { at: [0.05, 0.8, -0.6], dir: [0.15, 1, -0.6], len: 0.19, sink: 0.2, eaten: 1 }, gemK: 1,   // (the Rotshard's crystal: where it comes out, its lean, its length, how much of it is sunk, how eaten its foot is)
  glowK: 0.9, glowR: 0.09,   // (the pink round its root)
  vine: 0x2d1a2a, vineR: 0.022, vineL: 0.42, hump: 0.07, vineLeaves: 3, vines: [[-0.05, 0.45], [0.05, -0.45]],   // (its vines: dark green-black; how thick, how long, how high they hump, the leaves on each; where each comes out and how far it splays)
  vineGlow: 0.06, bob: 0.012, lurch: 0.018,
};
fx(919, "BLOOM MAGE draft A, the little shrub as sketched: a round bush of short pointed spikes all over in velvet plum-black (no eyes, no face), the Rotshard's eaten crystal now pink poking out of its back with its black shell shard, the pink glowing round its root; two long vines from its underside, trailing behind, that hump and stretch in turn to inch it along.", () => _bloomShrub(_bsA));
// 920 since the owner's "I can still see the round shape of the creature when it should be mostly leaves" (2026-11-08; it had 70 leaves on a round core, then 210
// lying over it; very thin leaves were tried and dropped: "Not this direction, forget thin"): a mass of pointed leaves, folded down their midribs (`mass`: n of them),
// each growing from deep inside out past the core (`foot`, how deep), a little up (`rise`) and its own way (`jit`), arching a little (`droop`), longer in tufts (`tuft`)
// so the outline is ragged, not round, the lowest lying on the floor; the core smaller (`coreK`) and near black (`coreDark`), only the shadow among them.
fx(920, "BLOOM MAGE draft B: the same little shrub, but mostly leaves: a mass of pointed leaves growing out from deep inside it at their own angles, ragged at its edges, each its own shade, the round core only a shadow deep among them; the same pink shard and inching vines.", () => _bloomShrub(Object.assign({}, _bsA, {
  coreK: 0.6, coreDark: 0x060306, glowR: 0.11, shard: Object.assign({}, _bsA.shard, { len: 0.24 }),
  mass: { n: 240, foot: [0.4, 0.75], len: 0.14, vary: [0.7, 1.3], wid: 0.042, droop: 0.2, rise: 0.35, jit: 0.6, tuft: 0.3, fold: 0.35, shade: 1, prof: [0.8, 0.9], seg: 6, bottom: -0.75, clear: 0.96 },
})));
