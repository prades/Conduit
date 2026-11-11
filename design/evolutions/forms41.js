// ── SIX DESIGNS OF THE THUNDERHEAD'S STATIC VORTEX AS A TORNADO · Nos. 928 to 933 (draft, 2026-11-11) ──────────────────────────────────────────────────────────
// The owner, 2026-11-11, of the Thunderhead's second attack: "a whirlwind vortex, and I kind of want to make it a like a tornado sort of look, and remove the highlighted floor effect"; then "Give me 6 different
// designs of that hurricane or tornado", and on the first, flat canvas drafts: "This needs three.js graphics". So these are modelled in 3D, in the game's own camera, and baked as the forms are.
// Of the agent's earlier questions: tall and narrow (the funnel about 3 tiles across at its top, 4 units tall), and NO disc or ring on the floor: nothing here lies flat on the ground.
//   928 WIND FUNNEL       a pale see-through funnel, turning dashed rings, yellow sparks spiralling up it, a little dust at its foot
//   929 LIGHTNING FUNNEL  a faint funnel with three jagged bolts winding up it and a white bolt in its core
//   930 DARK STORM        a dark grey funnel under a small storm cloud, lightning flickering from the cloud
//   931 HURRICANE         a spiral of cloud arms turning overhead round a dark eye, a thin funnel dropping from it
//   932 DEBRIS TORNADO    a dusty brown funnel, dust at its foot, scraps and rocks flung round it
//   933 ENERGY BRAID      two glowing ribbons wound as a double helix with beads running up them
// Each loops in its idle block (8 frames, one loop of the turn: its arms are evenly spaced, so a loop is one arm's turn); the action block repeats it. The sheet's rows (facings) all look alike: it is round.
// Bake each alone to look at it: node design/evolutions/bake.js <three> <out> tornadoA 256 3.0222 (a 256 px cell: 4 units tall does not fit in 192)
const _twH = 4.0, _twTop = 1.5, _twBase = 0.14;
const _twU = t => { const u = (t / (2 * PI / 1.6)) % 1; return u < 0 ? u + 1 : u; };   // where in its loop (0 to 1)
const _twRad = (s, top, base, p) => (base == null ? _twBase : base) + ((top == null ? _twTop : top) - (base == null ? _twBase : base)) * Math.pow(s, p == null ? 1.7 : p);
const _twHash = (a, b, c) => { const x = Math.sin(a * 127.1 + b * 311.7 + c * 74.7) * 43758.5453; return x - Math.floor(x); };
const _twC = hex => new T.Color(hex).convertSRGBToLinear();   // (the hex as it reads on the screen: the renderer takes linear)
const _twStd = (hex, rough, metal) => new T.MeshStandardMaterial({ color: _twC(hex), roughness: rough, metalness: metal || 0 });
const _twGlass = (color, opacity, rough) => new T.MeshStandardMaterial({ color: _twC(color), transparent: true, opacity, roughness: rough == null ? 0.9 : rough, metalness: 0, side: T.DoubleSide, depthWrite: false });
const _twLight = (color, opacity) => new T.MeshBasicMaterial({ color: _twC(color), transparent: opacity != null && opacity < 1, opacity: opacity == null ? 1 : opacity, toneMapped: false, side: T.DoubleSide, depthWrite: opacity == null || opacity >= 1 });
// a funnel: a lathe round the up axis, foot (s = 0) to top (s = 1)
function _twFunnel(mat, rad, H, n) { const pts = []; for (let i = 0; i <= (n || 16); i++) { const s = i / (n || 16); pts.push(new T.Vector2(rad(s), H * s)); } return new T.Mesh(new T.LatheGeometry(pts, 40), mat); }
// turning arcs: `count` rings up the funnel, each two arcs opposite one another, each turning k times a loop (an integer: it loops cleanly), the foot faster
function _twRings(parent, rad, H, count, color, opacity, tube, arc) {
  const rings = [];
  for (let i = 1; i <= count; i++) { const s = i / count, gr = G(); gr.position.y = H * s; parent.add(gr);
    for (let k = 0; k < 2; k++) { const half = G(); half.rotation.y = k * PI; gr.add(half); const m = new T.Mesh(new T.TorusGeometry(rad(s), tube, 5, 22, arc), _twLight(typeof color === 'function' ? color(i) : color, opacity)); m.rotation.x = PI / 2; half.add(m); }
    rings.push({ gr, k: s < 0.4 ? 2 : 1 }); }
  return rings;
}
function _twSway(root, u) { root.rotation.z = 0.05 * Math.sin(u * TAU); root.rotation.x = 0.035 * Math.sin(u * TAU + 1); }
function _twDust(parent, color, n, r, opacity) {
  const dust = []; for (let i = 0; i < n; i++) { const m = new T.Mesh(new T.SphereGeometry(0.2, 8, 6), _twGlass(color, opacity, 1)); m.scale.set(1.5, 0.45, 1.2); parent.add(m); dust.push(m); }
  return { dust, put(u) { dust.forEach((m, i) => { const a = i / n * TAU + u * TAU / n; m.position.set(Math.cos(a) * r, 0.08, Math.sin(a) * r); m.rotation.y = -a; }); } };
}

// 928 · THE WIND FUNNEL
fx(928, "STATIC VORTEX tornado, design A: a pale wind funnel, turning dashed rings, yellow sparks spiralling up it, dust at its foot.", () => {
  const g = G(), root = G(); g.add(root); const rad = s => _twRad(s);
  root.add(_twFunnel(_twGlass(0xdfe8f4, 0.2), rad, _twH));
  const rings = _twRings(root, rad, _twH, 12, i => i % 4 === 0 ? 0xfff6c8 : 0xe8f0fa, 0.85, 0.022, 1.25);
  const NS = 14, sparks = []; for (let i = 0; i < NS; i++) { const m = new T.Mesh(new T.SphereGeometry(0.075, 8, 6), _twLight(i % 3 === 0 ? 0xffffff : 0xffee33)); root.add(m); sparks.push(m); }
  const dust = _twDust(root, 0xcfd6dc, 5, 0.42, 0.55);
  return { g, core: 1.2, update(t) { const u = _twU(t); _twSway(root, u);
    rings.forEach(R => { R.gr.rotation.y = u * PI * R.k; });
    sparks.forEach((m, i) => { const s = ((i + u) / NS) % 1, a = s * TAU * 3 + i * 2.4, r = rad(s) * 0.96; m.position.set(Math.cos(a) * r, _twH * s, Math.sin(a) * r); });
    dust.put(u); } };
});
// 929 · THE LIGHTNING FUNNEL
fx(929, "STATIC VORTEX tornado, design B: a faint funnel with three jagged bolts winding up it and a white bolt in its core.", () => {
  const g = G(), root = G(); g.add(root); const rad = s => _twRad(s, 1.45, 0.12), N = 44;
  root.add(_twFunnel(_twGlass(0xffe566, 0.1), rad, _twH));
  const bolts = [0, 1, 2].map(i => { const core = new T.Mesh(new T.BufferGeometry(), _twLight(i === 0 ? 0xffffff : 0xfff0a0)), halo = new T.Mesh(new T.BufferGeometry(), _twLight(0xffd21a, 0.35)); root.add(halo); root.add(core); return { core, halo }; });
  const axis = { core: new T.Mesh(new T.BufferGeometry(), _twLight(0xffffff)), halo: new T.Mesh(new T.BufferGeometry(), _twLight(0xfff0a0, 0.3)) }; root.add(axis.halo); root.add(axis.core);
  const foot = new T.Mesh(new T.SphereGeometry(0.1, 10, 8), _twLight(0xfff6b0)); foot.position.y = 0.05; root.add(foot);
  const tube = (pts, r) => new T.TubeGeometry(new T.CatmullRomCurve3(pts), N, r, 5, false);
  return { g, core: 1.2, update(t, act) { const u = _twU(t), fr = Math.round(u * 8); _twSway(root, u);
    bolts.forEach((B, bi) => { const pts = []; for (let i = 0; i <= N; i++) { const s = i / N, a = u * TAU / 3 + bi * TAU / 3 + s * TAU * 2.6, r = rad(s) * 0.86, j = 0.11 * (s > 0.02 ? 1 : 0);
        pts.push(new T.Vector3(Math.cos(a) * r + (_twHash(i, fr, bi) - 0.5) * j * 2, _twH * s + (_twHash(i, fr + 9, bi) - 0.5) * j, Math.sin(a) * r + (_twHash(i, fr + 4, bi) - 0.5) * j * 2)); }
      B.core.geometry.dispose(); B.core.geometry = tube(pts, 0.032); B.halo.geometry.dispose(); B.halo.geometry = tube(pts, 0.09); });
    const ap = []; for (let i = 0; i <= 20; i++) { const s = i / 20; ap.push(new T.Vector3((_twHash(i, fr, 7) - 0.5) * 0.16 * Math.min(1, s * 4), _twH * s * 0.95, (_twHash(i, fr + 3, 7) - 0.5) * 0.16 * Math.min(1, s * 4))); }
    axis.core.geometry.dispose(); axis.core.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(ap), 20, 0.025, 4, false); axis.halo.geometry.dispose(); axis.halo.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(ap), 20, 0.07, 4, false); } };
});
// 930 · THE DARK STORM, REVISED (the owner chose C of the six, then: "Need design fix for tornado": the funnel "bigger and twistier", the cloud "swirling", the colour "lighter grey-blue"): a long narrow stem flaring wide at the
// top and bending in an S as it turns, spiral bands winding up it, a swirling cloud of curling arms round a dark eye on top (the hurricane's, No. 931), lightning flickering from the cloud. Bigger than the first C (4.2 tall, 1.45 across
// at the top, was 3.5 and 1.2). The idle block (act 0) is its loop with the lightning on frames 1 and 2; the action block (act > 0) the same loop with none (js/evolution.js staticVortexCol).
fx(930, "STATIC VORTEX tornado, design C (revised): a bigger, twistier grey-blue funnel with spiral bands under a swirling cloud, lightning flickering from it.", () => {
  const g = G(), root = G(); g.add(root); const H = 4.2, rTop = 1.45, rFoot = 0.13, N = 56;
  const rad = s => rFoot + (rTop - rFoot) * Math.pow(s, 2.2);   // a long narrow stem, flaring wide at the top
  const bx = (s, u) => 0.24 * s * Math.sin(u * TAU + s * 4.2), bz = (s, u) => 0.17 * s * Math.sin(u * TAU + s * 3.1 + 1.3);   // the axis bends in an S that turns with the loop
  const funnel = _twFunnel(new T.MeshStandardMaterial({ color: _twC(0x7d8fae), roughness: 0.85, metalness: 0.05, transparent: true, opacity: 0.78, side: T.DoubleSide }), rad, H, 24); root.add(funnel);
  const base = funnel.geometry.attributes.position.array.slice();
  // the spiral bands: four, alternately pale and dark, wound 2.4 times up the funnel
  const bandMat = [_twLight(0xe3ecf8), _twLight(0x4a5b7a), _twLight(0xe3ecf8), _twLight(0x4a5b7a)], bands = bandMat.map(m => { const t = new T.Mesh(new T.BufferGeometry(), m); root.add(t); return t; });
  // the cloud: a dark underside, four curling arms of flat puffs round a dark eye, the funnel running into it
  const cloud = G(); cloud.position.y = H; root.add(cloud);
  const under = new T.Mesh(new T.CylinderGeometry(1.95, 1.55, 0.12, 40), _twGlass(0x3a465e, 0.85, 1)); under.position.y = -0.05; cloud.add(under);
  const puffG = new T.SphereGeometry(1, 10, 8), pale = _twStd(0x6f80a0, 1), mid = _twStd(0x566688, 1), dim = _twStd(0x445370, 1);   // (the scene's lights brighten the cloud's top: these read as a soft grey-blue, not white)
  for (let a = 0; a < 4; a++) for (let i = 0; i < 18; i++) { const q = i / 17, an = a * PI / 2 + q * 3.5, r = 1.95 * (0.13 + 0.87 * q), sz = 0.15 + 0.3 * Math.sin(PI * Math.min(1, q * 1.1));
    for (let layer = 0; layer < 2; layer++) { const m = new T.Mesh(puffG, layer ? pale : (q > 0.55 ? dim : mid)); m.position.set(Math.cos(an) * r, 0.04 + layer * 0.1 + 0.04 * Math.sin(q * PI), Math.sin(an) * r); m.scale.set(sz * 1.5, sz * (layer ? 0.42 : 0.55), sz * (layer ? 0.8 : 1)); m.rotation.y = -an - 0.5; cloud.add(m); } }
  const eye = new T.Mesh(new T.CylinderGeometry(0.3, 0.3, 0.2, 18), _twStd(0x1d2535, 1)); eye.position.y = 0.06; cloud.add(eye);
  const bolt = new T.Mesh(new T.BufferGeometry(), _twLight(0xfff6b0)), halo = new T.Mesh(new T.BufferGeometry(), _twLight(0xffd21a, 0.4)); root.add(halo); root.add(bolt);
  const tube = (pts, r) => new T.TubeGeometry(new T.CatmullRomCurve3(pts), pts.length * 3, r, 5, false);
  // (the idle block, act 0, is the loop with its lightning on frames 1 and 2; the action block, act > 0, is the same loop with none, frame i at act (i + 0.5) / 8: the game flashes only every few loops)
  return { g, core: 1.2, update(t, act) { const calm = act > 0, u = calm ? Math.floor(act * 8) / 8 : _twU(t), fr = Math.round(u * 8);
    const pos = funnel.geometry.attributes.position, arr = pos.array; for (let i = 0; i < arr.length; i += 3) { const s = Math.min(1, Math.max(0, base[i + 1] / H)); arr[i] = base[i] + bx(s, u); arr[i + 2] = base[i + 2] + bz(s, u); } pos.needsUpdate = true;
    bands.forEach((m, bi) => { const pts = []; for (let i = 0; i <= N; i++) { const s = i / N, a = bi * PI / 2 + u * PI + s * TAU * 2.4, r = rad(s) * 1.02; pts.push(new T.Vector3(Math.cos(a) * r + bx(s, u), H * s, Math.sin(a) * r + bz(s, u))); }
      m.geometry.dispose(); m.geometry = tube(pts, 0.04 + 0.03 * (bi % 2)); });
    cloud.position.x = bx(1, u); cloud.position.z = bz(1, u); cloud.rotation.y = -u * TAU / 4;
    const on = !calm && (fr === 1 || fr === 2); bolt.visible = halo.visible = on;
    if (on) { const pts = []; let x = 0.9 + bx(1, u), y = H - 0.05, z = 0.3 + bz(1, u); for (let i = 0; i < 8; i++) { pts.push(new T.Vector3(x, y, z)); x += (_twHash(i, fr, 1) - 0.5) * 0.5 - 0.1; y -= 0.46; z += (_twHash(i, fr, 2) - 0.5) * 0.4; }
      bolt.geometry.dispose(); bolt.geometry = tube(pts, 0.045); halo.geometry.dispose(); halo.geometry = tube(pts, 0.12); } } };
});
// 931 · THE HURRICANE
fx(931, "STATIC VORTEX tornado, design D: a spiral of cloud arms turning overhead round a dark eye, a thin funnel dropping from it.", () => {
  const g = G(), root = G(); g.add(root); const HY = _twH - 0.45, rad = s => 0.08 + 0.16 * s;
  root.add(_twFunnel(_twGlass(0xb8c8dc, 0.55), rad, HY));
  const rings = _twRings(root, rad, HY, 8, 0xe8f0fa, 0.6, 0.012, 1.3);
  const disc = G(); disc.position.y = HY; root.add(disc);
  const under = new T.Mesh(new T.CylinderGeometry(1.9, 1.7, 0.08, 40), _twGlass(0x2a3348, 0.55, 1)); under.position.y = -0.06; disc.add(under);
  const armG = new T.SphereGeometry(1, 10, 8), armM = _twStd(0xf2f6fc, 1), armM2 = _twStd(0xc9d4e4, 1);
  for (let a = 0; a < 4; a++) for (let i = 0; i < 16; i++) { const q = i / 15, an = a * PI / 2 + q * 3.3, r = 1.8 * (0.16 + 0.84 * q), m = new T.Mesh(armG, i > 9 ? armM2 : armM), sz = 0.1 + 0.2 * Math.sin(PI * Math.min(1, q * 1.1));
    m.position.set(Math.cos(an) * r, 0.04 * Math.sin(q * PI), Math.sin(an) * r); m.scale.set(sz * 1.5, sz * 0.5, sz); m.rotation.y = -an - 0.5; disc.add(m); }
  const eye = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.14, 18), _twStd(0x141a28, 1)); eye.position.y = 0.03; disc.add(eye);
  const bolt = new T.Mesh(new T.BufferGeometry(), _twLight(0xfff6b0)); root.add(bolt);
  return { g, core: 1.2, update(t) { const u = _twU(t), fr = Math.round(u * 8); _twSway(root, u * 0.5);
    rings.forEach(R => { R.gr.rotation.y = u * PI * R.k; }); disc.rotation.y = -u * TAU / 4;
    const on = fr === 1; bolt.visible = on; if (on) { const pts = []; let x = -0.9, y = HY + 0.1, z = 0.2; for (let i = 0; i < 5; i++) { pts.push(new T.Vector3(x, y, z)); x += 0.12 * (i % 2 ? -1 : 1); y -= 0.16; z += 0.05; } bolt.geometry.dispose(); bolt.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(pts), 12, 0.035, 5, false); } } };
});
// 932 · THE DEBRIS TORNADO
fx(932, "STATIC VORTEX tornado, design E: a dusty brown funnel, dust at its foot, scraps and rocks flung round it.", () => {
  const g = G(), root = G(); g.add(root); const rad = s => _twRad(s, 1.55, 0.2, 1.6);
  root.add(_twFunnel(_twGlass(0x8a7a64, 0.32), rad, _twH));
  const rings = _twRings(root, rad, _twH, 11, i => i % 2 ? 0xc9b99a : 0x6a5d4a, 0.45, 0.045, 1.2);
  const dust = _twDust(root, 0xa89877, 6, 0.55, 0.5);
  const mats = [0x2b2f38, 0xd9642a, 0x9aa4b4, 0x4a3b2c].map((c, i) => _twStd(c, 0.5, i === 0 || i === 2 ? 0.8 : 0.1));
  const NP = 18, pieces = []; for (let i = 0; i < NP; i++) { const w = 0.1 + 0.07 * (i % 3), geo = i % 4 === 3 ? new T.OctahedronGeometry(w * 0.7) : i % 2 ? new T.BoxGeometry(w * 1.5, w * 0.4, w) : new T.BoxGeometry(w, w, w), m = new T.Mesh(geo, mats[i % 4]); root.add(m); pieces.push({ m, k: 1 + (i % 2), a0: i * 2.3, s: 0.1 + 0.85 * ((i * 0.618) % 1) }); }
  return { g, core: 1.2, update(t) { const u = _twU(t); _twSway(root, u);
    rings.forEach(R => { R.gr.rotation.y = u * PI * R.k; });
    pieces.forEach((P, i) => { const a = P.a0 + u * TAU * P.k, r = rad(P.s) * 1.12 + 0.12; P.m.position.set(Math.cos(a) * r, _twH * P.s + 0.06 * Math.sin(u * TAU * 2 + i), Math.sin(a) * r); P.m.rotation.set(u * TAU * 2 + i, u * TAU * (1 + (i % 3)), i); });
    dust.put(u); } };
});
// 933 · THE ENERGY BRAID
fx(933, "STATIC VORTEX tornado, design F: two glowing ribbons wound as a double helix, beads running up them.", () => {
  const g = G(), root = G(); g.add(root); const rad = s => _twRad(s, 1.4, 0.1, 1.65), N = 90;
  const mats = [_twLight(0xfff3a0), _twLight(0x9fe8ff)];
  const ribbons = [0, 1].map(side => { const m = new T.Mesh(new T.BufferGeometry(), mats[side]); root.add(m); return m; });
  const NB = 5, beads = []; for (let side = 0; side < 2; side++) for (let k = 0; k < NB; k++) { const m = new T.Mesh(new T.SphereGeometry(0.075, 8, 6), _twLight(0xffffff)); root.add(m); beads.push({ m, side, k }); }
  const rings = _twRings(root, rad, _twH, 6, 0xbfefff, 0.22, 0.014, 6.2);
  root.add(_twFunnel(_twGlass(0xbfefff, 0.07), rad, _twH));
  const at = (s, side, u) => { const a = side * PI + u * TAU / 2 + s * TAU * 1.5, r = rad(s); return new T.Vector3(Math.cos(a) * r, _twH * s, Math.sin(a) * r); };
  return { g, core: 1.2, update(t) { const u = _twU(t); _twSway(root, u);
    ribbons.forEach((m, side) => { const pts = []; for (let i = 0; i <= N; i++) pts.push(at(i / N, side, u)); m.geometry.dispose(); m.geometry = new T.TubeGeometry(new T.CatmullRomCurve3(pts), N, 0.075, 6, false); });
    beads.forEach(B => { const s = ((B.k + u) / NB + B.side * 0.1) % 1; B.m.position.copy(at(s, B.side, u)); }); } };
});
