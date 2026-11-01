// PERMAFROST SHELL (Pack 1, ice, Refined: +10% defense): a round buckler of thick faceted ice: irregular chunks of it, each cut into facets, packed in two rings round the centre, cold light glowing up
// through the cracks between them and brightest at the rim; set in a dark steel rim with domed rivets, a steel boss at its centre opening on a glowing pale-blue core; frost growing over the rim in places
// and cold motes round it. Turned a little toward the viewer, so it is seen a little from the front-right. The ice family's Refined piece: more built up than FROST LINING.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const rimM = std('#5d6673', 0.88, 0.28, { side: T.DoubleSide }), backM = std('#262b33', 0.8, 0.4, { side: T.DoubleSide }), bossM = std('#a7b0bb', 0.92, 0.22, { side: T.DoubleSide }), rivetM = std('#d4dbe4', 0.92, 0.2);
  rimM.envMapIntensity = 1.05;
  const iceMat = (hex, em, vc) => { const m = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.1, roughness: 0.06, flatShading: true, transparent: true, opacity: 0.86, vertexColors: !!vc }); m.color = STY.col(hex); m.emissive = STY.col(em); m.emissiveIntensity = 0.45; m.envMapIntensity = 1.8; return m; };
  const ICE = [iceMat('#d8f1ff', '#24679c'), iceMat('#e8f7ff', '#2f78ad'), iceMat('#c4e6ff', '#1f5d93'), iceMat('#f0faff', '#3a86b8')];   // (frost spikes: plain)
  const ICEV = [iceMat('#e8f6ff', '#1f5d93', 1), iceMat('#f4fbff', '#2a6ea6', 1), iceMat('#dcefff', '#1a5288', 1), iceMat('#ffffff', '#3179b0', 1)];   // (the chunks: tinted facet by facet)
  const DEEP = STY.col('#2f84d2'), PALE = STY.col('#eef9ff');
  const frost = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.3, flatShading: true }); frost.color = STY.col('#e4f5ff'); frost.emissive = STY.col('#4f9fd4'); frost.emissiveIntensity = 0.35; frost.envMapIntensity = 1.2;
  const coreM = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.08, flatShading: true }); coreM.color = STY.col('#a8defc'); coreM.emissive = STY.col('#4fb4f0'); coreM.emissiveIntensity = 0.9; coreM.envMapIntensity = 1.6;
  const glowB = STY.glow('#99ddff', 1.2), glowHot = STY.glow('#e6f7ff', 1.6), glowDim = STY.glow('#4aa8d8', 1.0);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const UP = new T.Vector3(0, 1, 0);
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function lathe(pr, mat, seg) { const pts = []; pr.forEach(([r, y]) => pts.push(new T.Vector2(r, y), new T.Vector2(r, y))); const m = new T.Mesh(new T.LatheGeometry(pts, seg || 64), mat); m.rotation.x = PI / 2; return m; }   // (turned so the profile's y runs out along +z)
  // AN ICE CHUNK: a polygon (x-y) cut into a faceted lump: its sides rising to a smaller, tilted top ring and a fan of facets up to an off-centre peak
  function chunk(poly, h, R, mat) {
    let area = 0; poly.forEach(([x, y], i) => { const [x2, y2] = poly[(i + 1) % poly.length]; area += x * y2 - x2 * y; }); if (area < 0) poly = poly.slice().reverse();   // (wound counter-clockwise, so its facets face out)
    const n = poly.length, cx = poly.reduce((s, p) => s + p[0], 0) / n, cy = poly.reduce((s, p) => s + p[1], 0) / n, tx = (R() - 0.5) * 0.7, ty = (R() - 0.5) * 0.7, pos = [];
    const bot = poly.map(([x, y]) => [x, y, 0]), topR = poly.map(([x, y]) => { const k = 0.64 + R() * 0.16, X = cx + (x - cx) * k, Y = cy + (y - cy) * k; return [X, Y, h * (0.74 + R() * 0.2) + (X - cx) * tx + (Y - cy) * ty]; });
    const peak = [cx + (R() - 0.5) * 0.04, cy + (R() - 0.5) * 0.04, h * (1.25 + R() * 0.2)];
    // each facet its own shade of ice: the sides deep, the top facets pale, every one a little different
    const col = [], c = new T.Color(), tri = (a, b, cc, k) => { pos.push(a[0], a[1], a[2], b[0], b[1], b[2], cc[0], cc[1], cc[2]); c.copy(DEEP).lerp(PALE, Math.max(0, Math.min(1, k))); for (let q = 0; q < 3; q++) col.push(c.r, c.g, c.b); };
    for (let i = 0; i < n; i++) { const j = (i + 1) % n, ks = 0.2 + R() * 0.35, kt = 0.55 + R() * 0.45; tri(bot[i], bot[j], topR[j], ks); tri(bot[i], topR[j], topR[i], ks + 0.08); tri(topR[i], topR[j], peak, kt); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.computeVertexNormals(); return new T.Mesh(geo, mat);
  }

  ITEMS.permafrost_shell = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), R = rng(3), S = G(); g.add(S);
    const RO = 0.5, RI = 0.445, RB = 0.15;
    // THE BACK: a shallow steel dish the ice is packed into
    S.add(lathe([[0, -0.06], [RO - 0.01, -0.06], [RO, -0.045], [RO, -0.02], [0, -0.02]], backM, 72));
    // the cold light under the ice: a ring, brightest at the rim and round the boss, dimmer between (vertex colours)
    { const geo = new T.RingGeometry(RB - 0.01, RI + 0.004, 64, 6), pos = geo.attributes.position, col = new Float32Array(pos.count * 3), lo = STY.col('#2b7fb8'), hi = STY.col('#e6f7ff'), c = new T.Color();
      for (let i = 0; i < pos.count; i++) { const r = Math.hypot(pos.getX(i), pos.getY(i)), k = Math.max(Math.pow(Math.max(0, (r - 0.28) / (RI - 0.28)), 1.4), Math.pow(Math.max(0, 1 - (r - RB) / 0.1), 2) * 0.8, 0.12); c.copy(lo).lerp(hi, k); col.set([c.r, c.g, c.b], i * 3); }
      geo.setAttribute('color', new T.BufferAttribute(col, 3)); const m = new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); m.position.z = -0.018; S.add(m); }
    // THE ICE: two rings of irregular chunks, the cracks between them left open to the light
    const r1 = a => 0.3 + 0.022 * Math.sin(3 * a + 1) + 0.014 * Math.sin(7 * a + 2);
    const ring = (n, off, rIn, rOut, seed) => {
      const cuts = []; for (let k = 0; k < n; k++) cuts.push(off + k * TAU / n + (R() - 0.5) * 0.25);
      for (let k = 0; k < n; k++) {
        const a0 = cuts[k], a1 = k + 1 < n ? cuts[k + 1] : cuts[0] + TAU, poly = [], steps = Math.max(2, Math.round((a1 - a0) / 0.32));
        const kink0 = (seed + k) * 1.7, kink1 = (seed + k + 1) * 1.7;   // the radial cracks: a kink half-way, shared by the chunks either side
        const rad = (a, kk, f) => { const r = rIn(a) + (rOut(a) - rIn(a)) * f, aa = a + 0.06 * Math.sin(kk); return [r * Math.cos(aa), r * Math.sin(aa)]; };
        for (let i = 0; i <= steps; i++) { const a = a0 + (a1 - a0) * i / steps; poly.push([rIn(a) * Math.cos(a), rIn(a) * Math.sin(a)]); }
        poly.push(rad(a1, kink1, 0.5));
        for (let i = steps; i >= 0; i--) { const a = a0 + (a1 - a0) * i / steps; poly.push([rOut(a) * Math.cos(a), rOut(a) * Math.sin(a)]); }
        poly.push(rad(a0, kink0, 0.5));
        // open the crack: pull every corner a little toward the chunk's middle
        const cx = poly.reduce((s, p) => s + p[0], 0) / poly.length, cy = poly.reduce((s, p) => s + p[1], 0) / poly.length;
        const shr = poly.map(([x, y]) => { const dx = cx - x, dy = cy - y, d = Math.hypot(dx, dy) || 1; return [x + dx / d * 0.012, y + dy / d * 0.012]; });
        const r = Math.hypot(cx, cy), h = 0.07 + (1 - r / RI) * 0.05 + R() * 0.025, m = chunk(shr, h, R, ICEV[(k + seed) % ICEV.length]); m.position.z = -0.02; S.add(m);
      }
    };
    ring(5, 0.4, () => RB + 0.008, r1, 1);
    ring(8, 0.1, r1, () => RI - 0.004, 9);
    // THE RIM: a dark steel band with a lip over the ice, domed rivets round its face, a thin cold glow along its inner edge
    S.add(lathe([[RI - 0.012, -0.03], [RI - 0.012, 0.075], [RI + 0.004, 0.092], [RO - 0.008, 0.092], [RO + 0.012, 0.072], [RO + 0.012, -0.045], [RO - 0.005, -0.065], [RI, -0.065]], rimM, 96));
    for (let i = 0; i < 16; i++) { const a = i * TAU / 16 + 0.1, r = sphere(0.016, rivetM, 12); r.scale.z = 0.55; S.add(at(r, 0.473 * Math.cos(a), 0.473 * Math.sin(a), 0.093)); }
    { const t = new T.Mesh(new T.TorusGeometry(RI - 0.016, 0.008, 8, 120), glowB); t.position.z = 0.07; S.add(t); }
    // THE BOSS: a steel dome with a flanged foot and six rivets, open at its crown on a faceted glowing core
    S.add(lathe([[0.078, 0.14], [0.088, 0.153], [0.104, 0.151], [0.128, 0.126], [0.148, 0.076], [0.158, 0.03], [0.168, 0.02], [0.168, -0.03], [0.07, -0.03]], bossM, 64));
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.3, r = sphere(0.011, rivetM, 10); r.scale.z = 0.6; S.add(at(r, 0.16 * Math.cos(a), 0.16 * Math.sin(a), 0.032)); }
    { const well = cyl(0.079, 0.079, 0.01, glowB, 32); well.rotation.x = PI / 2; well.position.z = 0.125; S.add(well);   // (the opening lit from inside)
      const core = new T.Mesh(new T.IcosahedronGeometry(0.07, 0), coreM); core.position.z = 0.165; core.scale.z = 0.8; core.rotation.set(0.3, 0.5, 0.2); S.add(core);
      const inner = new T.Mesh(new T.OctahedronGeometry(0.032, 0), glowHot); inner.position.z = 0.215; inner.rotation.set(0.6, 0.3, 0.2); S.add(inner);
      const halo = new T.Mesh(new T.TorusGeometry(0.083, 0.009, 8, 48), glowB); halo.position.z = 0.152; S.add(halo); }
    // FROST growing over the rim in three places: clusters of small faceted spikes
    const frostAt = (a0, a1, n) => { for (let i = 0; i < n; i++) { const a = a0 + (a1 - a0) * R(), rr = RO - 0.03 + R() * 0.045, dir = new T.Vector3(Math.cos(a) * 0.55, Math.sin(a) * 0.55, 0.7 + R() * 0.4).add(new T.Vector3((R() - 0.5) * 0.7, (R() - 0.5) * 0.7, 0)).normalize(), s = 0.007 + R() * 0.012;
      const m = new T.Mesh(new T.OctahedronGeometry(1, 0), R() < 0.5 ? ICE[i % 4] : frost); m.scale.set(s, s * (1.6 + R() * 1.4), s); m.quaternion.setFromUnitVectors(UP, dir); m.position.set(rr * Math.cos(a), rr * Math.sin(a), 0.08).addScaledVector(dir, s * 0.8); S.add(m); } };
    frostAt(1.9, 2.75, 30); frostAt(-0.95, -0.3, 24); frostAt(4.25, 4.65, 10);
    // COLD MOTES round it
    const motes = [[-0.5, 0.42, 0.12, 0.012, 2], [-0.58, 0.2, 0.08, 0.009, 1], [0.52, -0.36, 0.14, 0.011, 2], [0.6, -0.15, 0.1, 0.008, 0], [0.42, 0.5, 0.06, 0.008, 1], [-0.4, -0.52, 0.12, 0.008, 0],
                   [0.2, 0.6, 0.1, 0.007, 2], [-0.2, -0.6, 0.14, 0.007, 1]];
    motes.forEach(([x, y, z, r, k]) => S.add(at(sphere(r, k === 2 ? glowHot : k === 1 ? glowB : glowDim, 8), x, y, z)));
    S.rotation.set(-0.14, 0.2, 0);
    return { g };
  } };
})();
