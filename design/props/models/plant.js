// THE POTTED PLANTS (one tile). Variants p0..p3 are healthy (four different plants), d0 and d1 are dead and brown. Footprint within ~0.7 x 0.7 tile, 50-95 game-px tall. The leaves are real curved ribbon geometry (a
// centre fold, a taper, vertex colours from the vein to the edge), the pots are lathed or built from slabs, the soil is in the pot.
//   p0 a kentia palm in a round teal glazed pot, p1 a rubber plant in a square dark planter, p2 a snake plant in a low terracotta trough, p3 a peace lily in a terracotta pot with a saucer.
//   d0 a dead palm in a cracked pot, d1 a collapsed, dried-out snake plant in a trough.
(function () {
  const std = (c, m, r, x) => { const k = new T.MeshStandardMaterial(Object.assign({ color: c, metalness: m, roughness: r }, x || {})); k.color.convertSRGBToLinear(); k.envMapIntensity = 0.45; return k; };
  const leafMat = (rough) => { const k = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, side: T.DoubleSide, metalness: 0, roughness: rough == null ? 0.55 : rough }); k.envMapIntensity = 0.5; return k; };
  const potTeal = std(0x145f66, 0.1, 0.35), potTealLt = std(0x1f8a8c, 0.1, 0.35), terra = std(0x9a4e2b, 0, 0.85), terraDk = std(0x6e3419, 0, 0.9), greyDk = std(0x252a33, 0.35, 0.5), greyLt = std(0x3a414d, 0.35, 0.5);
  const soilWet = std(0x2a1a10, 0, 1), soilDry = std(0x4a3a26, 0, 1), crack = std(0x2b2216, 0, 1), stone = std(0x6c7077, 0.1, 0.8), wood = std(0x6a4a2a, 0, 0.8), woodDead = std(0x57493a, 0, 0.9), cream = std(0xe9ecd8, 0, 0.5, { emissive: 0x151812 });
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const col = (hex) => new T.Color(hex).convertSRGBToLinear();   // (the colours are written as the sRGB they should look like)
  // a deterministic little random, so a variant is always the same
  const rng = (seed) => { let s = seed * 9301 + 49297; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };

  // a leaf: a ribbon along +x (in its own frame) of length L and width W, bending down by `bend` (a droop that grows along it), folded along the vein, tapered by `prof(t)`; vertex colours from `vein` (centre) to `edge`.
  function leaf(L, W, bend, prof, vein, edge, mat, segs, fold, curl) {
    segs = segs || 6; fold = fold == null ? 0.012 : fold; curl = curl || 0;
    const pos = [], colr = [], idx = [], cv = col(vein), ce = col(edge);
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, pf = prof(t), w = W * pf / 2, x = L * t, y = -bend * t * t, side = (curl ? Math.sin(t * PI) * curl : 0), fy = fold * pf;
      // three verts across: left edge, vein, right edge (the edges rise a little: the fold)
      pos.push(x, y + fy, -w + side, x, y, side * 0.5, x, y + fy, w + side);
      colr.push(ce.r, ce.g, ce.b, cv.r, cv.g, cv.b, ce.r, ce.g, ce.b);
    }
    for (let i = 0; i < segs; i++) { const a = i * 3, b = a + 3; idx.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(colr, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    return new T.Mesh(geo, mat);
  }
  // put a leaf on a stem: at (x,y,z), pointing at azimuth `az` (about y) and elevated `el` radians above horizontal
  function place(m, x, y, z, az, el, roll) { const h = G(); h.position.set(x, y, z); h.rotation.y = -az; m.rotation.z = el; m.rotation.x = roll || 0; h.add(m); return h; }
  const taper = (p) => (t) => Math.pow(Math.sin(Math.PI * Math.min(1, Math.pow(t, 0.75 * p + 0.25))), 0.8) * (1 - 0.25 * t) + 0.02;   // fat in the middle, pointed tip
  const strap = (t) => (t < 0.12 ? 0.55 + 4 * t : 1 - Math.max(0, t - 0.7) * 3.2) + 0.03;                                                 // a strap leaf: even, then a point

  // ── pots ──
  function lathePot(rTop, rBot, h, rim, mat, matIn) {
    const pts = [[rBot * 0.7, 0], [rBot, 0.01], [rTop, h], [rTop + rim, h], [rTop + rim, h + 0.018], [rTop - 0.012, h + 0.018], [rTop - 0.012, h - 0.02]].map(p => new T.Vector2(p[0], p[1]));
    const m = new T.Mesh(new T.LatheGeometry(pts, 24), mat); m.material.side = T.DoubleSide; return m;
  }
  function soil(r, y, dry, seed) {
    const g = G(), d = cyl(r, r, 0.012, dry ? soilDry : soilWet, 20); d.position.y = y; g.add(d);
    if (dry) { const R = rng(seed || 3); for (let i = 0; i < 6; i++) { const a = R() * 6.28, l = r * (0.5 + R() * 0.45), c = cbox(l, 0.004, 0.012, 0.001, crack); c.position.set(Math.cos(a) * l * 0.3, y + 0.008, Math.sin(a) * l * 0.3); c.rotation.y = -a + (R() - 0.5) * 0.8; g.add(c); } }
    else { const R = rng(seed || 5); for (let i = 0; i < 5; i++) { const s = sphere(0.014 + R() * 0.012, stone, 6); s.position.set((R() - 0.5) * r * 1.5, y + 0.01, (R() - 0.5) * r * 1.5); g.add(s); } }
    return g;
  }

  // a palm frond: an arching rachis (a tube) with leaflets in pairs, drooping; `dead` makes them sparse, brown and limp
  function frond(az, h0, reach, rise, droop, nPairs, leafL, leafW, cA, cB, dead, R) {
    const g = G(), pts = [], mat = leafMat(0.5), N = 9;
    for (let i = 0; i <= N; i++) { const t = i / N; pts.push([Math.cos(az) * reach * Math.pow(t, 1.15), h0 + rise * t - droop * t * t, Math.sin(az) * reach * Math.pow(t, 1.15)]); }
    g.add(tube(pts, 0.012, dead ? woodDead : std(0x2a6a34, 0, 0.7)));
    for (let k = 0; k < nPairs; k++) {
      const t = 0.3 + 0.7 * k / (nPairs - 1), i = Math.min(N - 1, Math.floor(t * N)), f = t * N - i, p0 = pts[i], p1 = pts[i + 1], p = [p0[0] + (p1[0] - p0[0]) * f, p0[1] + (p1[1] - p0[1]) * f, p0[2] + (p1[2] - p0[2]) * f];
      const L = leafL * (1 - 0.55 * Math.abs(t - 0.62) / 0.7) * (dead ? 0.8 + R() * 0.3 : 1);
      for (const sd of [-1, 1]) {
        if (dead && R() < 0.4) continue;
        const lf = leaf(L, leafW, dead ? 0.2 : 0.07, strap, dead ? '#6b5a30' : cA, dead ? '#4a3f22' : cB, mat, 3, 0.004);
        g.add(place(lf, p[0], p[1], p[2], az + sd * (1.2 + (dead ? 0.3 * R() : 0.1 * R())), dead ? -0.55 : -0.35 + 0.1 * R(), 0.3 * sd));
      }
    }
    return g;
  }

  function build(name) {
    const g = G(), R = rng(name.charCodeAt(0) * 17 + name.charCodeAt(1) * 5);
    const dead = name[0] === 'd';
    if (name === 'p0' || name === 'd0') {            // ── a palm in a round pot ──
      const ph = px(22), pot = lathePot(0.27, 0.2, ph, 0.015, dead ? std(0x6a5a4a, 0.05, 0.8) : potTeal); g.add(pot);
      if (!dead) { const band = lathePot(0.2705, 0.2, ph * 0.3, 0.0, potTealLt); band.scale.set(1.001, 1, 1.001); g.add(band); }
      else { for (let i = 0; i < 3; i++) { const c = cbox(0.012, ph * 0.7, 0.01, 0.002, crack); c.position.set(Math.cos(i * 2.1) * 0.255, ph * 0.5, Math.sin(i * 2.1) * 0.255); c.rotation.y = -i * 2.1; c.rotation.z = 0.2; g.add(c); } }
      g.add(soil(0.245, ph - 0.012, dead, 7));
      const n = dead ? 5 : 9;
      for (let i = 0; i < n; i++) {
        const az = i * (6.283 / n) + 0.4 + (R() - 0.5) * 0.4, reach = dead ? 0.3 + R() * 0.12 : 0.34 + R() * 0.1, rise = px(dead ? 20 + R() * 12 : 38 + R() * 16), drop = dead ? px(26 + R() * 12) : px(14 + R() * 8);
        g.add(frond(az, ph, reach, rise, drop, dead ? 7 : 11, dead ? 0.17 : 0.2, 0.036, '#3f9a48', '#1a5a2a', dead, R));
      }
      if (!dead) g.add(at(cyl(0.012, 0.012, px(14), std(0x2a5a30, 0, 0.7), 5), 0, ph + px(7), 0));
    } else if (name === 'p1') {                      // ── a rubber plant in a square planter ──
      const ph = px(20), w = 0.5; const sl = (x, z, sx, sz) => g.add(at(cbox(sx, ph, sz, 0.012, greyDk), x, ph / 2, z));
      sl(0, w / 2 - 0.015, w, 0.03); sl(0, -w / 2 + 0.015, w, 0.03); sl(w / 2 - 0.015, 0, 0.03, w); sl(-w / 2 + 0.015, 0, 0.03, w); g.add(at(cbox(w, 0.02, w, 0.005, greyDk), 0, 0.01, 0));
      g.add(at(cbox(w + 0.03, px(2.2), w + 0.03, 0.01, greyLt), 0, ph, 0)); g.add(at(cbox(w - 0.02, px(0.6), 0.012, 0.002, cyanDimMat()), 0, ph * 0.55, w / 2 + 0.002));
      g.add(soil(0.21, ph - 0.01, false, 11)); g.children[g.children.length - 1].children.forEach(c => { c.scale.x = 1.15; });
      const stem = tube([[0, ph, 0], [0.012, ph + px(14), 0.01], [-0.01, ph + px(30), -0.008], [0.008, ph + px(46), 0.006]], 0.02, wood); g.add(stem);
      const lm = leafMat(0.25), gA = ['#16552a', '#124a24', '#1f6b34'];
      for (let i = 0; i < 15; i++) {
        const t = i / 14, y = ph + px(16 + 36 * t), az = i * 2.4 + 0.5, L = 0.36 - 0.1 * t + R() * 0.03, W = 0.2 - 0.05 * t;
        const lf = leaf(L, W, 0.07 + 0.06 * (1 - t), taper(1.1), '#5a9a48', gA[i % 3], lm, 6, 0.025);
        g.add(place(lf, 0, y, 0, az, 0.15 - 0.75 * t + (R() - 0.5) * 0.3, (R() - 0.5) * 0.3));
      }
      const top = leaf(0.2, 0.11, 0, taper(1), '#7cc060', '#2c7a3c', lm, 4, 0.01); g.add(place(top, 0, ph + px(48), 0, 0.6, Math.PI / 2 - 0.35, 0));
    } else if (name === 'p2' || name === 'd1') {     // ── a snake plant in a low trough ──
      const ph = px(15), w = 0.62, d = 0.34; const mt = dead ? std(0x6a5a48, 0, 0.9) : terra, mt2 = dead ? std(0x54473a, 0, 0.9) : terraDk;
      g.add(at(cbox(w, ph, d, 0.02, mt), 0, ph / 2, 0)); g.add(at(cbox(w + 0.03, px(2.4), d + 0.03, 0.01, mt2), 0, ph, 0));
      g.add(at(cbox(w - 0.1, 0.012, d - 0.08, 0.003, dead ? soilDry : soilWet), 0, ph + px(1.4), 0));
      const n = dead ? 8 : 11; const lm = leafMat(0.5);
      for (let i = 0; i < n; i++) {
        const u = (i + R() * 0.4) / n, x = (u - 0.5) * (w - 0.18), z = (R() - 0.5) * (d - 0.14), az = R() * 6.28, h = px(dead ? 22 + R() * 14 : 40 + R() * 28), Wd = 0.075 + R() * 0.025;
        const bend = dead ? 0.05 + R() * 0.15 : 0.01 + R() * 0.03, el = dead ? 1.15 - R() * 0.6 : 1.5 - R() * 0.18;
        const lf = leaf(h, Wd, bend * 1.4, strap, dead ? '#8a7a50' : '#1f5a30', dead ? '#5e5133' : '#9aab3c', lm, 8, 0.01, dead ? 0.05 : 0);
        g.add(place(lf, x, ph + px(1.6), z, az, el, dead ? (R() - 0.5) * 0.7 : (R() - 0.5) * 0.3));
      }
    } else if (name === 'p3') {                      // ── a peace lily in a terracotta pot with a saucer ──
      const ph = px(21); g.add(lathePot(0.26, 0.19, ph, 0.02, terra)); g.add(at(cyl(0.3, 0.27, px(3), terraDk, 22), 0, px(1.5), 0)); 
      g.add(soil(0.235, ph - 0.012, false, 13));
      const lm = leafMat(0.3);
      for (let i = 0; i < 9; i++) {
        const az = i * 2.4 + (R() - 0.5) * 0.4, L = 0.34 + R() * 0.1, W = 0.2 + R() * 0.04, up = 1.0 - 0.05 * (i % 4);
        const lf = leaf(L, W, 0.17 + 0.08 * R(), taper(0.9), '#4d9a48', '#16552a', lm, 6, 0.02);
        g.add(place(lf, Math.cos(az) * 0.03, ph + px(2), Math.sin(az) * 0.03, az, up - (i % 3) * 0.16, (R() - 0.5) * 0.25));
      }
      for (let i = 0; i < 3; i++) {                  // white spathes on tall stalks
        const az = 0.6 + i * 2.1, h = px(44 + 10 * i), x = Math.cos(az) * 0.07, z = Math.sin(az) * 0.07;
        g.add(tube([[0, ph + px(2), 0], [x * 0.5, ph + h * 0.5, z * 0.5], [x, ph + h, z]], 0.007, std(0x2f7a3a, 0, 0.7)));
        const sp = leaf(0.13, 0.075, -0.02, taper(1.2), '#ffffff', '#e8efe0', leafMat(0.35), 5, 0.012); sp.rotation.z = 1.2; g.add(place(sp, x, ph + h, z, az + 2.5, 1.15, 0));
        g.add(at(cyl(0.006, 0.01, 0.07, std(0xe8d878, 0, 0.6), 5), x + Math.cos(az) * 0.01, ph + h + 0.03, z + Math.sin(az) * 0.01));
      }
    }
    return { g };
  }
  function cyanDimMat() { return new T.MeshBasicMaterial({ color: 0x1d8fa3, toneMapped: false }); }
  PROPS.plant = { variants: ['p0', 'p1', 'p2', 'p3', 'd0', 'd1'], canvas: [300, 300], exposure: 0.88, build };
})();
