// ── SUNDEW, THE BLOOM BRAWLER · drafts No. 906 (the pitcher) and No. 907 (the snail) (2026-11-08) ────────────────────────────────
// The approved concept (docs/CONVERSION.md §2, "BLOOM's creatures"): SUNDEW, "a black pitcher-shaped shell holding a pool of pink nectar"; a mollusk; its main attack
// slashing (its barbed lip); its move CONSUME (it swallows an enemy whole). BLOOM's colour: blossom pink #ff7ab8. The owner's pencil page (sent 2026-11-07; marked "BRAWLY",
// "MOLLUSK", "BLOOM (PINK)", with the lotus lantern and the coral crab) has two mollusks, drawn here one each:
//   906  from the one marked BRAWLY: a round sac body on splayed, flat feet, a Y on its front; a stalk from its top to a four-petal flower; from the flower a long
//        blade-leaf, its edge jagged. Drawn as a black pitcher (its mouth on top, rim barbed, holding the glowing nectar), its feet a mollusk's flat arms.
//   907  from the snail below it: a spiral shell on a frilled foot; a long S-curved neck to a four-petal flower; from the flower a long blade-leaf, its lower edge a
//        sawtooth. Drawn with the shell's growth lines glowing nectar pink.
// Drafts for the owner's choice (2026-11-08: "draft me some designs for the brawler next", "The bloom one."): not in the game.
// Uses forms31.js (_c31, _prog31) and forms32.js (_taper32, _aim32). +z is the front; ph = 1.6 t runs once round the idle loop.
const _sdS = (a, b, x) => { const u = Math.min(1, Math.max(0, (x - a) / (b - a))); return u * u * (3 - 2 * u); };
const _sdSkin = new T.MeshStandardMaterial({ color: 0x040405, metalness: 0.25, roughness: 0.3, side: T.DoubleSide }); _sdSkin.envMapIntensity = 0.5;   // (wet black, as the Electro Skink's)
// BLOOM's pink from the colour the page is set to (EL.color), and the parts that glow with it
function _sdMats() {
  const pink = _c31(EL.color).convertSRGBToLinear(), white = _c31(0xffffff);
  return {
    pink,
    petal: (() => { const p = new T.MeshStandardMaterial({ color: pink.clone().multiplyScalar(0.75), emissive: pink, emissiveIntensity: 0.28, metalness: 0.05, roughness: 0.55, side: T.DoubleSide, toneMapped: false }); p.envMapIntensity = 0.25; return p; })(),   // (saturated: lit pink, not washed to white)
    nectar: new T.MeshBasicMaterial({ color: pink.clone().multiplyScalar(1.1), toneMapped: false }),
    heart: new T.MeshBasicMaterial({ color: pink.clone().lerp(white, 0.4), toneMapped: false }),
    vein: new T.MeshBasicMaterial({ color: pink.clone().multiplyScalar(0.85), toneMapped: false }),
  };
}
// a flower of four rounded petals round a bright heart, facing +z
function _sdFlower(m, r) {
  const f = G();
  for (let i = 0; i < 4; i++) { const a = PI / 4 + i * PI / 2, p = new T.Mesh(new T.SphereGeometry(1, 18, 12), m.petal);
    p.scale.set(r * 0.58, r * 0.46, r * 0.13); p.position.set(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, -r * 0.05); p.rotation.set(0, 0, a); p.rotateY(-0.3); f.add(p); }   // (cupped a little forward)
  const h = new T.Mesh(new T.SphereGeometry(r * 0.26, 16, 12), m.heart); h.position.z = r * 0.06; f.add(h);
  return f;
}
// a flat leaf-blade along +z from its root at the origin, curving down like a scythe (bend): one edge (top: +y, else -y) sharp triangle teeth, the other smooth; a
// glowing vein down its middle
function _sdBlade(m, L, W, teeth, top, bend) {
  const s = top ? 1 : -1, h = u => W / 2 * Math.pow(Math.sin(PI * Math.min(1, 0.1 + 0.9 * u)), 0.6), c = u => -(bend || 0) * u * u, P = [];
  for (let i = 0; i <= 20; i++) { const u = i / 20; P.push([u * L, c(u) - s * h(u) * 0.7]); }   // (the smooth edge, root to tip)
  for (let k = teeth; k >= 1; k--) { const u1 = k / teeth, um = (k - 0.5) / teeth;   // (the toothed edge, tip to root: a notch, then a sharp tooth)
    P.push([u1 * L, c(u1) + s * h(u1) * 0.75]); P.push([um * L, c(um) + s * (h(um) * 0.75 + W * 0.3)]); }
  P.push([0, c(0) + s * h(0) * 0.75]);
  const sh = new T.Shape(); P.forEach(([x, y], i) => i ? sh.lineTo(x, y) : sh.moveTo(x, y)); sh.closePath();
  const geo = new T.ExtrudeGeometry(sh, { depth: 0.012, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 4 });
  geo.translate(0, 0, -0.006); geo.rotateY(-PI / 2); geo.computeVertexNormals();
  const bl = G(); bl.add(new T.Mesh(geo, _sdSkin));
  const vp = Array.from({ length: 12 }, (_, i) => { const u = 0.04 + 0.8 * i / 11; return V(0, c(u), u * L); });   // (the vein follows the curve)
  _taper32(bl, m.vein, 12, 6).set(vp, 0.007, 0.004, null, 1.7, 0.6);
  return bl;
}
// a cubic Bézier from p0 to p3 (controls c1, c2) into n points, written into pts
function _sdBez(pts, p0, c1, c2, p3) {
  const n = pts.length;
  for (let i = 0; i < n; i++) { const u = i / (n - 1), a = (1 - u) * (1 - u) * (1 - u), b = 3 * (1 - u) * (1 - u) * u, c = 3 * (1 - u) * u * u, d = u * u * u;
    pts[i].set(p0.x * a + c1.x * b + c2.x * c + p3.x * d, p0.y * a + c1.y * b + c2.y * c + p3.y * d, p0.z * a + c1.z * b + c2.z * c + p3.z * d); }
  return pts;
}

// ── 906 · THE PITCHER (from BRAWLY) ──────────────────────────────────────────────────────────────────────────────────────────
function _sundewPitcher(o) {
  const m = _sdMats(), g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  // THE PITCHER: round and black, its mouth on top, the rim barbed, holding the glowing nectar; a Y of pink vein on its front
  const pot = G(); b.add(pot);
  pot.add(new T.Mesh(new T.LatheGeometry(o.prof.map(([r, y]) => new T.Vector2(r, y)), 48), _sdSkin));
  const outer = o.prof.slice(0, o.lipAt + 1), rAt = y => { for (let i = 1; i < outer.length; i++) if (y <= outer[i][1]) { const [r0, y0] = outer[i - 1], [r1, y1] = outer[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return outer[outer.length - 1][0]; };
  const nec = new T.Mesh(new T.CircleGeometry(o.necR, 40), m.nectar); nec.rotation.x = -PI / 2; nec.position.y = o.necY; pot.add(nec);
  for (let k = 0; k < o.barbs; k++) { const a = k / o.barbs * TAU, c = new T.Mesh(new T.ConeGeometry(0.011, 0.045, 6), _sdSkin);   // (the barbed lip: teeth pointing in and down)
    c.position.set(Math.sin(a) * o.barbR, o.barbY, Math.cos(a) * o.barbR); _aim32(c, V(-Math.sin(a), -0.7, -Math.cos(a)), V(0, 1, 0)); pot.add(c); }
  const surf = (y, a) => { const r = rAt(y) + 0.002; return V(Math.sin(a) * r, y, Math.cos(a) * r); };
  [[[0.07, 0], [0.13, 0], [0.19, 0]], [[0.19, 0], [0.25, 0.12], [0.31, 0.3]], [[0.19, 0], [0.25, -0.12], [0.31, -0.3]]].forEach(seg => {   // (the Y, its stem low on the front)
    const pts = Array.from({ length: 8 }, () => V(0, 0, 0)); _sdBez(pts, surf(...seg[0]), surf(...seg[1]), surf(...seg[1]), surf(...seg[2]));
    _taper32(pot, m.vein, 8, 8).set(pts, 0.011, 0.008); });
  const Ln = new T.PointLight(0xffffff, 0.9, 0.9, 2); Ln.color.copy(m.pink); Ln.position.set(0, o.necY + 0.06, 0); pot.add(Ln); LIGHTS.push(Ln);
  // THE FEET: six flat arms splayed on the floor, their tips lifting in a slow wave round it
  const NF = 12, feet = o.feet.map(([deg, len]) => ({ a: deg * PI / 180, len, tb: _taper32(b, _sdSkin, NF, 10), pts: Array.from({ length: NF }, () => V(0, 0, 0)) }));
  // THE STALK, from the front of the rim up to the flower; THE FLOWER; THE BLADE-LEAF, from the flower, forward
  const NS = 16, stalk = _taper32(b, _sdSkin, NS, 10), spts = Array.from({ length: NS }, () => V(0, 0, 0));
  const flower = _sdFlower(m, o.flowerR); b.add(flower);
  const bladeP = G(); b.add(bladeP); const blade = _sdBlade(m, o.bladeL, o.bladeW, o.teeth, true, o.bend); blade.position.z = 0.02; bladeP.add(blade);
  const S0 = V(0, o.stalkY0, o.stalkZ0), C1 = V(0, 0, 0), C2 = V(0, 0, 0), TOP = V(0, 0, 0);
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, pr = _prog31(t, act), rear = _sdS(0, 0.3, pr) * (1 - _sdS(0.34, 0.5, pr)), strike = _sdS(0.34, 0.5, pr) * (1 - _sdS(0.62, 1, pr)), br = Math.sin(ph);
    pot.scale.set(1 - 0.012 * br, 1 + 0.02 * br, 1 - 0.012 * br);   // (it breathes)
    nec.position.y = o.necY + 0.004 * Math.sin(2 * ph); Ln.intensity = 0.9 * (0.85 + 0.15 * Math.sin(2 * ph)) * (1 + 0.8 * strike);
    feet.forEach((f, j) => { const lift = 0.03 * Math.max(0, Math.sin(ph - j * TAU / feet.length)) * (1 - 0.7 * Math.min(1, act || 0));
      for (let i = 0; i < NF; i++) { const u = i / (NF - 1), d = o.footR0 + f.len * u;
        f.pts[i].set(Math.sin(f.a) * d, o.footY * (1 - u) + 0.012 + lift * u * u + o.curl * Math.pow(u, 4), Math.cos(f.a) * d); }
      f.tb.set(f.pts, 0, 0, u => 0.05 * Math.sqrt(Math.max(0, 1 - u * u * u)) + 0.006, 2, 0.35); });   // (flat and wide, their ends blunt and round, as drawn)
    TOP.set(0.02 * Math.sin(ph + 0.5), o.flowerY + 0.012 * Math.sin(2 * ph) + 0.05 * rear - 0.07 * strike, o.flowerZ - 0.08 * rear + 0.1 * strike);
    C1.set(0, S0.y + 0.16, S0.z + 0.02); C2.set(TOP.x * 0.6, TOP.y - 0.12, TOP.z - 0.06);
    stalk.set(_sdBez(spts, S0, C1, C2, TOP), 0, 0, u => 0.024 - 0.009 * u, 1, 1);
    flower.position.copy(TOP); flower.rotation.set(-0.35 + 0.4 * rear - 0.3 * strike, 0.1 * Math.sin(ph + 0.5), 0);
    bladeP.position.copy(TOP); bladeP.rotation.set(o.droop + 0.05 * Math.sin(ph + 1) - 1.1 * rear + 1.0 * strike, 0.08 * Math.sin(ph + 0.9), 0);
  } };
}
const _sdA = {
  S: 1, coreY: 0.3,
  prof: [[0, 0.03], [0.1, 0.032], [0.17, 0.06], [0.215, 0.12], [0.235, 0.2], [0.23, 0.28], [0.205, 0.36], [0.17, 0.43], [0.142, 0.49], [0.136, 0.53], [0.15, 0.565], [0.163, 0.583],
         [0.152, 0.596], [0.13, 0.584], [0.118, 0.55], [0.112, 0.49]],   // (the outer wall from the floor up to the lip at index 11, then over the rim and down inside)
  lipAt: 11, necR: 0.116, necY: 0.515, barbs: 18, barbR: 0.142, barbY: 0.588,
  feet: [[-150, 0.3], [-95, 0.22], [-30, 0.3], [30, 0.26], [95, 0.32], [160, 0.22]], footR0: 0.13, footY: 0.05, curl: 0.02,
  stalkY0: 0.57, stalkZ0: 0.12, flowerY: 0.86, flowerZ: 0.2, flowerR: 0.075,
  bladeL: 0.4, bladeW: 0.1, teeth: 6, bend: 0.06, droop: 0.25,
};
fx(906, "SUNDEW draft A, from the owner's sketch marked BRAWLY: a black pitcher on six flat mollusk feet, a pink Y vein on its front, its barbed mouth holding glowing pink nectar; a stalk from the rim to a four-petal pink flower, and from the flower a long blade-leaf with a sawtooth top edge.", () => _sundewPitcher(_sdA));

// ── 907 · THE SNAIL (from the snail drawn below it) ────────────────────────────────────────────────────────────────────────
// the shell: a tube coiled in the y-z plane (its eye toward the back, its mouth at the front of its foot), growing as it coils; its growth lines glow nectar pink
function _sdShell(m, o) {
  const N = 120, RG = 22, k = Math.log(o.Rend / o.R0) / o.turns, pos = new Float32Array(N * RG * 3), col = new Float32Array(N * RG * 3), idx = [];
  for (let i = 0; i < N - 1; i++) for (let j = 0; j < RG; j++) { const a = i * RG + j, b2 = i * RG + (j + 1) % RG, c = (i + 1) * RG + j, d = (i + 1) * RG + (j + 1) % RG; idx.push(a, c, b2, b2, c, d); }
  const C = V(0, o.shellY, o.shellZ), P = V(0, 0, 0), Q = V(0, 0, 0), tg = V(0, 0, 0), nr = V(0, 0, 0), X = V(1, 0, 0);
  const at = (th, out) => { const R = o.R0 * Math.exp(k * th), psi = o.psiA + (o.turns - th); return out.set(0, C.y + R * Math.sin(psi), C.z + R * Math.cos(psi)); };
  for (let i = 0; i < N; i++) {
    const th = o.turns * i / (N - 1), R = o.R0 * Math.exp(k * th), r = o.fill * R;
    at(th, P); at(Math.min(o.turns, th + 0.01), Q); tg.copy(Q).sub(at(Math.max(0, th - 0.01), Q)).normalize(); nr.copy(tg).cross(X).normalize();   // (a steady frame: x across the coil)
    const line = (th / o.lineEvery) % 1, glow = (line < 0.07 || line > 0.97) && th > 0.6 ? 0.85 : 0;
    for (let j = 0; j < RG; j++) { const a = j / RG * TAU, cx = Math.cos(a) * r * o.wide, cy = Math.sin(a) * r, q = (i * RG + j) * 3;
      pos[q] = X.x * cx + nr.x * cy + P.x; pos[q + 1] = X.y * cx + nr.y * cy + P.y; pos[q + 2] = X.z * cx + nr.z * cy + P.z;
      col[q] = m.pink.r * glow; col[q + 1] = m.pink.g * glow; col[q + 2] = m.pink.b * glow; }
  }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3)); geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const mat = new T.MeshStandardMaterial({ color: _sdSkin.color, vertexColors: true, metalness: 0.25, roughness: 0.3, emissive: 0xffffff, toneMapped: false, side: T.DoubleSide }); mat.envMapIntensity = 0.5;
  mat.onBeforeCompile = sh => { sh.fragmentShader = sh.fragmentShader.replace('#include <color_fragment>', '').replace('vec3 totalEmissiveRadiance = emissive;', 'vec3 totalEmissiveRadiance = emissive * vColor;'); };   // (the vertex colour is its glow only: black shell, pink lines)
  return new T.Mesh(geo, mat);
}
function _sundewSnail(o) {
  const m = _sdMats(), g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  // THE FOOT: long, low and flat along z, its edge a frill of rounded lobes rippling back as it glides
  const NFT = 20, foot = _taper32(b, _sdSkin, NFT, 14), fpts = Array.from({ length: NFT }, (_, i) => V(0, o.footY, o.footZ0 + (o.footZ1 - o.footZ0) * i / (NFT - 1)));
  foot.set(fpts, 0, 0, u => o.footR * Math.pow(Math.sin(PI * (0.06 + 0.88 * u)), 0.45), o.footFx, o.footFy);
  const lobes = Array.from({ length: o.lobes }, (_, k) => { const a = k / o.lobes * TAU, l = new T.Mesh(new T.SphereGeometry(1, 14, 8), _sdSkin);
    l.position.set(Math.sin(a) * o.frillX, 0.015, o.frillZc + Math.cos(a) * o.frillZ); l.scale.set(0.045, 0.014, 0.05); b.add(l); return l; });   // (black as the foot: its edge frilled)
  // THE SHELL, on the back of the foot
  const shell = _sdShell(m, o); b.add(shell);
  // THE NECK: an S from the front of the foot up to the flower; THE FLOWER; THE BLADE-LEAF, from the flower, forward and down, its lower edge a sawtooth
  const NN = 18, neck = _taper32(b, _sdSkin, NN, 12), npts = Array.from({ length: NN }, () => V(0, 0, 0));
  const flower = _sdFlower(m, o.flowerR); b.add(flower);
  const bladeP = G(); b.add(bladeP); const blade = _sdBlade(m, o.bladeL, o.bladeW, o.teeth, false, o.bend); blade.position.z = 0.02; bladeP.add(blade);
  const N0 = V(0, o.neckY0, o.neckZ0), C1 = V(0, 0, 0), C2 = V(0, 0, 0), TOP = V(0, 0, 0);
  const Ls = new T.PointLight(0xffffff, 0.5, 0.8, 2); Ls.color.copy(m.pink); Ls.position.set(0.12, o.shellY, o.shellZ); b.add(Ls); LIGHTS.push(Ls);
  return { g, core: o.coreY * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, pr = _prog31(t, act), rear = _sdS(0, 0.3, pr) * (1 - _sdS(0.34, 0.5, pr)), strike = _sdS(0.34, 0.5, pr) * (1 - _sdS(0.62, 1, pr)), calm = 1 - 0.7 * Math.min(1, act || 0);
    lobes.forEach((l, k) => { const w = Math.sin(2 * ph + k * 0.9); l.position.y = 0.015 + 0.005 * w * calm; l.scale.y = 0.012 * (1 + 0.25 * w * calm); });
    shell.position.y = 0.006 * Math.sin(2 * ph); shell.rotation.x = 0.015 * Math.sin(2 * ph + 0.5);
    Ls.intensity = 0.5 * (0.85 + 0.15 * Math.sin(2 * ph)) * (1 + 0.8 * strike);
    TOP.set(0.03 * Math.sin(ph) * calm, o.topY + 0.015 * Math.sin(2 * ph) + 0.05 * rear - 0.1 * strike, o.topZ - 0.1 * rear + 0.13 * strike);
    C1.set(0, N0.y + 0.22, N0.z + 0.17); C2.set(0.018 * Math.sin(ph - 0.8) * calm, TOP.y - 0.2, TOP.z - 0.26 + 0.08 * strike);
    neck.set(_sdBez(npts, N0, C1, C2, TOP), 0, 0, u => o.neckR0 + (o.neckR1 - o.neckR0) * u, 1, 1);
    flower.position.copy(TOP); flower.rotation.set(-0.25 + 0.4 * rear - 0.3 * strike, 0.12 * Math.sin(ph) * calm, 0);
    bladeP.position.copy(TOP); bladeP.rotation.set(o.droop + 0.05 * Math.sin(ph + 1) - 1.1 * rear + 1.0 * strike, 0.08 * Math.sin(ph + 0.6) * calm, 0);
  } };
}
const _sdB = {
  S: 1, coreY: 0.28,
  footY: 0.075, footZ0: -0.36, footZ1: 0.3, footR: 0.08, footFx: 1.55, footFy: 1,
  lobes: 26, frillX: 0.115, frillZ: 0.35, frillZc: -0.03,
  shellY: 0.33, shellZ: -0.12, R0: 0.035, Rend: 0.185, turns: 2.2 * PI, psiA: -60 * PI / 180, fill: 0.72, wide: 1.15, lineEvery: PI / 4,
  neckY0: 0.1, neckZ0: 0.22, neckR0: 0.05, neckR1: 0.022, topY: 0.7, topZ: 0.38,
  flowerR: 0.075, bladeL: 0.42, bladeW: 0.1, teeth: 6, bend: 0.04, droop: 0.55,
};
fx(907, "SUNDEW draft B, from the snail on the owner's page: a black spiral shell, its growth lines glowing nectar pink, on a frilled foot; a long S-curved neck to a four-petal pink flower, and from the flower a long blade-leaf, its lower edge a sawtooth.", () => _sundewSnail(_sdB));
