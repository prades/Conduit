// ── THE BLOOM MAGE, a little shrub (working name) · drafts No. 919 and No. 920 (2026-11-08) ─────────────────────────────────────────
// The owner's pencil sketch (2026-11-08; asked what it was for: "BLOOM's Mage") and words: "It's a little shrub that has vines coming out the bottom of it that inch it
// along to cover ground, and it has the rot shard poking out the back, which is now converted into pink for the bloom. It's mage." It replaces the lotus lantern as
// BLOOM's Mage (docs/CONVERSION.md §2). From the sketch: a round, bushy body, its outline all jagged points; a tall shard out of its upper back (the
// Rotshard's: the toxic Mage's eaten crystal, design No. 101, js/evolution.js EVOLUTIONS.rotshard), now in BLOOM's pink, without the Rotshard's black shell shard (the
// owner: "The crystal by itself is enough of a character"); two vines from its underside, their tips pointed, now thorny and out in front of it (the owner: "They need
// to be vines that have thorns on them. And they need to whip out in front of the character."; they trailed behind). In BLOOM's finish (SUNDEW's No. 911, the coral crab's No. 914): velvet plum-black, the pink glowing round the shard's
// root as round the crab's crystals, the shard's crystal coloured facet by facet as theirs (_gemCol32, forms32.js).
//   919  as sketched: the bush a round mass of short pointed spikes (its outline jagged, as drawn).
//   920  the same, but mostly leaves: a mass of pointed leaves growing out from deep inside it (the owner, 2026-11-08), its round core only a shadow among them.
// It holds its vines out in front of it and does not crawl on them; it SHUFFLES about to move, and it ATTACKS WITH ITS VINES (the owner, 2026-11-08). Idle (also its walk):
// it rocks from side to side, lifting the side it rocks off, turning a little, its vines held out and swaying. Its ACTION (its attack): the bush leans back and bristles and
// both vines rear as it charges, the crystal flaring, drawing their tips together round a glowing pink seed; it rocks forward as it strikes, both vines whipping out in
// front together and flinging the seed like a sling (SEED SHOT, its everyday shot: the owner's pick, 2026-11-08), then they come back up. Drafts for the owner's choice: not in the game. Uses forms5.js (corroded), forms31.js (_c31, _prog31) and forms32.js
// (_taper32, _aim32, _gemCol32).
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
  const body = G(); b.add(body);   // (the bush and all it carries: it bobs, leans back as it charges and rocks forward as it strikes)
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
  // ── THE CRYSTAL out of its back: the Rotshard's eaten crystal (No. 101: r 0.34, h 1.5, its point 0.55, eaten up to half way) at the shrub's size, in BLOOM's pink,
  // leaning back; its foot sunk in the bush. The Rotshard's black shell shard on it is gone (the owner: "It doesn't need that little shard at the top anymore. The
  // crystal by itself is enough of a character") ──
  const k = o.shard.len / 1.5, ax = V(...o.shard.dir).normalize(), rs = G(); rs.position.copy(sRoot).addScaledVector(ax, -o.shard.sink * o.shard.len); _aim32(rs, ax, V(0, 0, 1)); rs.scale.setScalar(k); body.add(rs); rs.updateMatrix();
  const cgeo = corroded(0.34, 1.5, 0.55, o.shard.eaten, M.crystal, 0.5).geometry; cgeo.translate(0, 0.75, 0); cgeo.applyMatrix4(rs.matrix);
  const gems = [_gemCol32(cgeo, pink.clone().multiplyScalar(o.gemK))]; body.add(gems[0]);
  // ── THE VINES: two black thorny vines from under the front of the bush (the owner: "They need to be vines that have thorns on them. And they need to whip out in front
  // of the character."; "Make the vines and the thorns black."). It holds them out in front of it and does not crawl on them (the owner: "it doesn't crawl with its
  // tentacles. It attacks with them", then "I like the idea of him holding his tentacles out, but not using them to crawl. He kind of shuffles around to move.").
  // Idle: held out, arching up and drooping at their tips, swaying as it shuffles. As it attacks: both rear up as it charges and whip out together as it strikes
  // (straightening from root to tip, their tips slapping down ahead), hold there a moment, then come back up to held out. ──
  const vineM = new T.MeshStandardMaterial({ color: _c31(o.vine).convertSRGBToLinear(), metalness: 0.3, roughness: 0.4 }); vineM.envMapIntensity = 0.4;   // (black, with a sheen so their shape reads on a dark floor: the owner, "Make the vines and the thorns black.")
  const thornM = new T.MeshStandardMaterial({ color: _c31(o.thorn).convertSRGBToLinear(), metalness: 0.3, roughness: 0.35, flatShading: true }); thornM.envMapIntensity = 0.4;   // (black, as the vines)
  const thornGeo = new T.ConeGeometry(0.35, 1, 5); thornGeo.translate(0, 0.5, 0);   // (a thorn: its foot at its origin, its point 1 out along +y)
  const NV = 28, vR = u => o.vineR * (1 - 0.9 * Math.pow(u, 1.2)) + 0.0015;   // (a vine's radius along it, root to tip)
  const vines = o.vines.map(([x, spread], i) => ({ x, spread, ph: i * PI, tube: _taper32(b, vineM, NV, 10), pts: Array.from({ length: NV }, () => V(0, 0, 0)),
    thorns: Array.from({ length: o.thorns }, (_, j) => { const m = new T.Mesh(thornGeo, thornM); b.add(m);
      return { m, u: 0.12 + 0.82 * j / Math.max(1, o.thorns - 1), a: (j % 2 ? 1 : -1) * (0.35 + 0.95 * ((j * 0.618 + i * 0.3) % 1)) }; }) }));   // (along it on alternate sides, each at its own angle over its top: none into the floor)
  const Lt = new T.PointLight(0xffffff, 0.5, o.S || 1, 2); Lt.color.copy(_c31(EL.color));   /* (its reach grows with the model: the game's sprite is 3.4 ×) */ Lt.position.copy(sRoot).addScaledVector(ax, 0.1); body.add(Lt); LIGHTS.push(Lt);
  const R0 = V(0, 0, 0), D = V(0, 0, 0), Dp = V(0, 0, 0), dir = V(0, 0, 0), tg = V(0, 0, 0), n1 = V(0, 0, 0), n2 = V(0, 0, 0), out = V(0, 0, 0);
  // ── SEED SHOT, its everyday shot (the owner's pick, 2026-11-08): as it charges, its vines rear and draw their tips together in front of it, a glowing pink seed growing
  // between them; at the crack the seed is flung forward. (Shown leaving it only: in the game its flight is drawn as every Mage's shot is.) ──
  const seedM = new T.MeshBasicMaterial({ color: _c31(EL.color).convertSRGBToLinear().multiplyScalar(1.5), toneMapped: false });
  const seed = new T.Mesh(new T.SphereGeometry(1, 14, 10), seedM), seedGlow = glowSprite(1); seedGlow.scale.set(5, 5, 1); seed.add(seedGlow); b.add(seed); seed.visible = false;
  const sP = V(0, 0, 0), sRel = V(0, 0, 0), REL = 0.51, GONE = o.seedLeave === false ? REL : 0.68;   // (REL: the crack, when it lets go; GONE: when the game's shot takes over: at once in the game's sprite, No. 921)
  // a vine's points from its root at R0, each segment at its own angle up (phi) and to the side (psi), a blend of three poses: held out (h), reared (a: an arch up and over,
  // its tip hanging down in front) and struck out (b: down along the floor, at its full length). pr: its attack's progress (0 when idle): it rears (to 0.42), whips out
  // (to 0.55: the whipping front runs from its root to its tip; ahead of it the vine is still reared, behind it struck out), holds, then comes back (0.62 to 1). w: the sway.
  const shape = (v, pr, w) => {
    const e = _bsS(0, 0.42, pr), f = _bsS(0.42, 0.55, pr), back = _bsS(0.62, 1, pr), c = -0.15 + 1.4 * f, lashing = pr >= 0.42 && pr < 0.55, struck = pr >= 0.55;
    const Hk = o.hold[2], len = o.vineL * (pr < 0.42 ? Hk + (o.rear[2] - Hk) * e : pr < 0.55 ? o.rear[2] + (1 - o.rear[2]) * f : 1 + (Hk - 1) * back), seg = len / (NV - 1);
    const gather = pr < 0.55 ? e : 1 - back, sp = v.spread + (-Math.sign(v.spread) * o.cradle - v.spread) * gather;   // (attacking, the two draw their tips together in front of it, a sling round the seed)
    D.set(Math.sin(sp), 0, Math.cos(sp)); Dp.set(Math.cos(sp), 0, -Math.sin(sp)); v.pts[0].copy(R0);
    for (let i = 1; i < NV; i++) {
      const u = (i - 0.5) / (NV - 1);
      const wa = lashing ? _bsS(c, c + 0.25, u) : pr < 0.42 ? e : 0, wb = lashing ? 1 - wa : struck ? 1 - back : 0, wh = 1 - wa - wb;   // (how much of each pose, here along it)
      const phH = o.hold[0] - o.hold[1] * u + o.sway[0] * Math.sin(w + v.ph - 2 * u), phA = o.rear[0] - o.rear[1] * u, phB = -0.35 * (1 - _bsS(0, 0.12, u));
      const phi = wh * phH + wa * phA + wb * phB, psi = wh * o.sway[1] * Math.sin(w + v.ph + 0.8) + wb * o.wiggle * Math.sin(TAU * u + v.ph);   // (held, they bob and swing a little; struck out, they snake a little)
      dir.copy(D).multiplyScalar(Math.cos(psi)).addScaledVector(Dp, Math.sin(psi)).multiplyScalar(Math.cos(phi)); dir.y = Math.sin(phi);
      v.pts[i].copy(v.pts[i - 1]).addScaledVector(dir, seg);
    }
    for (let i = 1; i < NV; i++) v.pts[i].y = Math.max(v.pts[i].y, vR(i / (NV - 1)) * 0.9);   // (never through the floor)
  };
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, pr = _prog31(t, act), charge = _bsS(0, 0.35, pr) * (1 - _bsS(0.42, 0.55, pr)), fire = _bsS(0.42, 0.52, pr) * (1 - _bsS(0.6, 1, pr)), calm = 1 - 0.7 * Math.min(1, act || 0);
    // it SHUFFLES about (its idle, which is also its walk): it rocks from side to side, lifting the side it rocks off so the other stays on the floor, turning a little each time
    const rock = Math.sin(2 * ph) * calm;
    b.rotation.set(0, o.shuffle[2] * Math.sin(2 * ph + 0.6) * calm, o.shuffle[0] * rock); b.position.set(0, o.shuffle[1] * (o.S || 1) * Math.abs(rock), 0);
    body.position.set(0, o.bodyY + o.bob * Math.abs(Math.sin(2 * ph)) * calm, -0.02 * charge + 0.03 * fire);
    body.rotation.x = -0.14 * charge + 0.12 * fire; body.scale.set(1 + 0.03 * charge, 1 - 0.03 * Math.abs(Math.sin(2 * ph)) * calm + 0.05 * charge, 1 + 0.03 * charge);
    const glow = (0.85 + 0.15 * Math.sin(2 * ph)) * (1 + 1.2 * Math.max(charge, fire)); coreM.U.value = leafM.U.value = glow; Lt.intensity = 0.5 * glow;
    const gk = 1.4 * Math.max(0, glow - 0.85); gems.forEach(m => m.userData.relight(gk));   // (the crystal flares as it charges and fires)
    const seedOn = act > 0 && pr > 0.03 && pr < GONE;
    if (seedOn && pr >= REL) { for (const v of vines) { R0.set(v.x, o.vineRoot[0], body.position.z + o.vineRoot[1]); shape(v, REL, 2 * ph); }   // (where the tips let it go)
      sRel.addVectors(vines[0].pts[NV - 1], vines[1].pts[NV - 1]).multiplyScalar(0.5); }
    for (const v of vines) {
      R0.set(v.x, o.vineRoot[0], body.position.z + o.vineRoot[1]); shape(v, pr, 2 * ph);
      v.tube.set(v.pts, 0, 0, vR, 1, 1);
      for (const th of v.thorns) {   // (each thorn on the vine's surface, pointing out from it and hooked back toward its root, as a bramble's)
        const fi = th.u * (NV - 1), i0 = Math.min(NV - 2, Math.floor(fi)), f = fi - i0, r = vR(th.u);
        tg.subVectors(v.pts[i0 + 1], v.pts[i0]).normalize();
        n1.copy(up).addScaledVector(tg, -tg.y); if (n1.lengthSq() < 0.01) n1.copy(D).negate(); n1.normalize(); n2.crossVectors(tg, n1);   // (n1: the vine's side nearest up; n2: across it)
        out.copy(n1).multiplyScalar(Math.cos(th.a)).addScaledVector(n2, Math.sin(th.a)); dir.copy(out).addScaledVector(tg, -o.hook).normalize();
        th.m.position.lerpVectors(v.pts[i0], v.pts[i0 + 1], f).addScaledVector(out, r * 0.6);
        const h = o.thornL * (0.45 + 0.55 * (1 - th.u)) + r * 0.8, w = r * 1.5 + 0.004; th.m.scale.set(w, h, w); _aim32(th.m, dir, tg);
      }
    }
    seed.visible = seedOn;
    if (seedOn) {   // (cradled just under the tips as it charges, growing; then flung forward, a little up and down again)
      if (pr < REL) { sP.addVectors(vines[0].pts[NV - 1], vines[1].pts[NV - 1]).multiplyScalar(0.5); sP.y -= o.seedR * 0.6; }
      else { const k = (pr - REL) / (GONE - REL); sP.copy(sRel); sP.y += o.seedR * -0.6 + 0.04 * Math.sin(PI * k); sP.z += o.seedFly * k; }
      const r = o.seedR * _bsS(0.5, 0.9, _bsS(0, 0.42, pr)) * (1 - _bsS(GONE - 0.06, GONE, pr)); seed.position.copy(sP); seed.scale.set(r, r, r * 1.4); seed.visible = r > 1e-4;   // (it grows once the tips have closed round it)
    }
  } };
}
const _bsA = {
  S: 1, coreY: 0.22, seed: 23, bodyY: 0.15, w: 0.17, h: 0.145, l: 0.16, rough: 0.92,
  dark: 0x120a10, light: 0x4a2540,   // (velvet plum-black; its points paler toward their tips)
  leafN: 64, leafBottom: -0.55, leafSink: 0.86, leafL: 0.1, leafW: 0.04, flatten: 0.45, sweep: 0.3,
  shard: { at: [0.05, 0.8, -0.6], dir: [0.15, 1, -0.6], len: 0.19, sink: 0.2, eaten: 1 }, gemK: 1,   // (the Rotshard's crystal: where it comes out, its lean, its length, how much of it is sunk, how eaten its foot is)
  glowK: 0.9, glowR: 0.09,   // (the pink round its root)
  vine: 0x050505, vineR: 0.022, vineL: 0.5, vines: [[-0.05, -0.38], [0.05, 0.38]], vineRoot: [0.035, 0.12],   // (its vines: black; how thick and long (whipped out); where each comes out and how far it splays to the front; their root's height and how far forward under the bush)
  hold: [0.9, 1.4, 0.8], sway: [0.1, 0.12], rear: [1.6, 2.2, 1], wiggle: 0.25,   // (held out: how steeply it rises from its root, how far it droops toward its tip, how much of its length is out; how much it
  // bobs and swings; reared: the same; struck out along the floor, how much it snakes)
  cradle: 0.14, seedR: 0.028, seedFly: 0.6,   // (SEED SHOT: how far in the vines turn to bring their tips together; the seed's size; how far it is shown flying)
  thorn: 0x050505, thorns: 9, thornL: 0.03, hook: 0.5,   // (its thorns: black; how many on each vine, how long, how far hooked back toward the root)
  bob: 0.006, shuffle: [0.06, 0.018, 0.08],   // (its shuffle: how far it rocks to each side, how much it lifts the side it rocks off, how far it turns)
};
// 919: RETIRED 2026-11-08: the owner went on with the leaves (No. 920), approved as BLOOM's Mage when it was sent to the game ("Shrub into the game").
fx(919, "(Retired: No. 920 was chosen.) BLOOM MAGE draft A, the little shrub as sketched: a round bush of short pointed spikes all over in velvet plum-black (no eyes, no face), the Rotshard's eaten crystal now pink poking out of its back, the pink glowing round its root; two black thorny vines from under its front, held out in front of it: it does not crawl on them but shuffles about to move, and it attacks with them: SEED SHOT, both rearing round a glowing seed and whipping out together to fling it like a sling.", () => _bloomShrub(_bsA));
// 920 since the owner's "I can still see the round shape of the creature when it should be mostly leaves" (2026-11-08; it had 70 leaves on a round core, then 210
// lying over it; very thin leaves were tried and dropped: "Not this direction, forget thin"): a mass of pointed leaves, folded down their midribs (`mass`: n of them),
// each growing from deep inside out past the core (`foot`, how deep), a little up (`rise`) and its own way (`jit`), arching a little (`droop`), longer in tufts (`tuft`)
// so the outline is ragged, not round, the lowest lying on the floor; the core smaller (`coreK`) and near black (`coreDark`), only the shadow among them.
const _bsB = Object.assign({}, _bsA, {
  coreK: 0.6, coreDark: 0x060306, glowR: 0.11, shard: Object.assign({}, _bsA.shard, { len: 0.24 }), vineRoot: [0.035, 0.16],
  mass: { n: 240, foot: [0.4, 0.75], len: 0.14, vary: [0.7, 1.3], wid: 0.042, droop: 0.2, rise: 0.35, jit: 0.6, tuft: 0.3, fold: 0.35, shade: 1, prof: [0.8, 0.9], seg: 6, bottom: -0.75, clear: 0.96 },
});
fx(920, "BLOOM MAGE draft B: the same little shrub, but mostly leaves: a mass of pointed leaves growing out from deep inside it at their own angles, ragged at its edges, each its own shade, the round core only a shadow deep among them; the same pink crystal and black thorny vines, held out in front, that fling its SEED SHOT like a sling; it shuffles about to move.", () => _bloomShrub(_bsB));
// 921, THE GAME'S SPRITE OF No. 920 (BLOOM's Mage, the LITTLE SHRUB, approved 2026-11-08: "Shrub into the game"): No. 920 a little smaller than the other Mages, a little shrub (3.4 ×: its crystal's tip about
// 2.1 units up, about seven tenths of their height), baked alone in a 192 px cell so its vines' whip is not cut off (design/evolutions/bake.js, the 'shrub' job; js/evolution.js EVOLUTIONS.shrub). Its seed is gone the moment it is flung:
// the game draws SEED SHOT's flight (js/game.js), as every Mage's shot.
fx(921, "BLOOM MAGE, the LITTLE SHRUB: the game's sprite of No. 920, a little smaller than the other Mages; its seed gone as it is flung (the game draws the shot).", () => _bloomShrub(Object.assign({}, _bsB, { S: 3.4, vineL: 0.46, seedLeave: false })));   // (its vines a touch shorter, so struck out they stay in the cell)
