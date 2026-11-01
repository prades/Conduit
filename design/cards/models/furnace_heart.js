// FURNACE HEART (Pack 1, fire, Refined: +10% attack): a fist-sized cast-iron furnace core shaped like a stylised anatomical heart: a rounded, lopsided body of riveted iron plates (tilted, its apex down to its
// left, an atrium swelling at its upper right, the seams between the plates running down it on a slant like the heart's grooves), molten inside, the glow coming through the cracks between the plates and the iron
// heat-tinted along them; a small arched furnace door on its front, white-orange behind its grate; two short stove-pipe flues out of its top like the aorta (arching over) and the pulmonary trunk, each with a
// flame licking out of it; embers rising. Refined: more worked than EMBER PLATING (the first of the card items, approved: its palette and finish).
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const heatM = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.74, roughness: 0.36, vertexColors: true, side: T.DoubleSide }); heatM.envMapIntensity = 1.0;
  const pipeM = std('#5f6772', 0.85, 0.3), bandM = std('#a7b0bb', 0.9, 0.26), rivetM = std('#c3cbd6', 0.9, 0.22), frameM = std('#98a1ac', 0.9, 0.27), grateM = std('#1b1f25', 0.7, 0.42), hingeM = std('#707883', 0.85, 0.3);
  const ember = STY.glow('#ff6a1a', 1.6), emberHot = STY.glow('#ffb347', 1.7), emberCore = STY.glow('#fff0c2', 1.8), emberDim = STY.glow('#d9480f', 1.2);
  const IRON = STY.col('#4c535e'), PIPE = STY.col('#5f6772'), HOT = STY.col('#9a3410');
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = (x, y, z) => new T.Vector3(x, y, z), UP = V(0, 1, 0);
  const AZ = 0.55, EL = 0.32, CAM = V(Math.cos(EL) * Math.sin(AZ), Math.sin(EL), Math.cos(EL) * Math.cos(AZ));   // toward the hero camera (the flames' hot cores are nudged this way)
  const R = 0.42, TH = 0.042, TW = 0.42, GAP = 0.03, TILT = 0.3;   // the shell's radius, the plates' thickness, the slant of the seams, the cracks' width, the lean of the whole heart
  const UPB = V(Math.sin(TILT), Math.cos(TILT), 0);   // world-up, seen from inside the tilted heart
  // THE HEART'S SHAPE: a unit direction deformed: taller than wide, flattened front to back, an atrium swelling at its upper right (-x), the lower half tapering to an apex that leans to its left (+x)
  function hdef(x, y, z, r) {
    const a = Math.max(0, (-0.75 * x + 0.55 * y + 0.35 * z) / 0.994 - 0.3) / 0.7, sw = 1 + 0.1 * a * a;
    const t = Math.max(0, -y), k = 1 - 0.5 * Math.pow(t, 1.35);
    const X = x * k * (1 + 0.07 * x) * sw + 0.16 * t * t, Y = y * (y > 0 ? 0.9 : 1.25) * (1 + 0.05 * a * a), Z = z * k * 0.84 * sw + 0.04 * t * t;
    return V(X * r, Y * r, Z * r);
  }
  // a point of the shell by polar angle th (0 = top) and azimuth ph (0 = front, toward +x), the azimuth slanted with the height so the seams run down on a diagonal
  function hp(th, ph, r) { const phi = ph + TW * (th - PI / 2), s = Math.sin(th); return hdef(s * Math.sin(phi), Math.cos(th), s * Math.cos(phi), r); }
  // the point and the outward normal of the shell in a direction
  const sp = (d, r) => { const n = d.clone().normalize(); return hdef(n.x, n.y, n.z, r == null ? R : r); };
  function sn(d) { const n = d.clone().normalize(), t1 = Math.abs(n.y) < 0.9 ? UP.clone().cross(n).normalize() : V(1, 0, 0).cross(n).normalize(), t2 = n.clone().cross(t1), e = 1e-3, p = sp(n);
    const a = sp(n.clone().addScaledVector(t1, e)).sub(p), b = sp(n.clone().addScaledVector(t2, e)).sub(p), m = a.cross(b).normalize(); return m.dot(n) < 0 ? m.negate() : m; }
  // set o on the shell at direction d, facing out, its +y as near `up` as the surface allows
  function onShell(o, d, up, sink) { const z = sn(d), x = up.clone().cross(z).normalize(), y = z.clone().cross(x); o.position.copy(sp(d, R - (sink || 0))); o.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(x, y, z)); return o; }
  // ONE CAST PLATE of the shell, between polar angles th0..th1 and azimuths ph0..ph1 (cap 'top' / 'bot': a round cap whose one edge is the pole): its outer face, its rim rolled down into its walls, and the
  // iron heat-tinted toward its edges, where the glow comes through
  function shell(th0, th1, ph0, ph1, cap) {
    const pos = [], col = [], idx = [], c = new T.Color(), BW = 0.02, HW = 0.1, rIn = R - TH;
    const Lu = (th1 - th0) * R * 1.1, Lv = (ph1 - ph0) * R * Math.max(0.3, Math.sin((th0 + th1) / 2));
    const nu = Math.max(6, Math.min(48, Math.ceil(Lu / 0.009))), nv = Math.max(6, Math.min(110, Math.ceil(Lv / 0.009)));
    const edgeD = (u, v) => Math.min(cap === 'top' ? Infinity : u * Lu, cap === 'bot' ? Infinity : (1 - u) * Lu, cap ? Infinity : Math.min(v * Lv, (1 - v) * Lv));
    const vert = (th, ph, r, heat) => { const p = hp(th, ph, r); pos.push(p.x, p.y, p.z); c.copy(IRON).lerp(HOT, heat); col.push(c.r, c.g, c.b); };
    const quads = (base, nI, nJ, flip) => { for (let j = 0; j < nJ; j++) for (let i = 0; i < nI; i++) { const a = base + j * (nI + 1) + i, b = a + 1, cc = a + nI + 1, d = cc + 1; if (flip) idx.push(a, cc, b, b, cc, d); else idx.push(a, b, cc, b, d, cc); } };
    for (let j = 0; j <= nv; j++) for (let i = 0; i <= nu; i++) {
      const u = i / nu, v = j / nv, d = edgeD(u, v), q = Math.min(1, d / BW), r = R - BW * (1 - Math.sqrt(Math.max(0, 1 - (1 - q) * (1 - q))));
      vert(th0 + (th1 - th0) * u, ph0 + (ph1 - ph0) * v, r, 0.95 * Math.pow(Math.max(0, 1 - d / HW), 1.7));
    }
    quads(0, nu, nv, false);
    const wall = (f, n, flip) => { const base = pos.length / 3; for (let j = 0; j <= n; j++) for (let i = 0; i <= 1; i++) { const [th, ph] = f(j / n); vert(th, ph, i ? rIn : R - BW, 1); } quads(base, 1, n, flip); };
    if (cap !== 'top') wall(t => [th0, ph0 + (ph1 - ph0) * t], nv, true);
    if (cap !== 'bot') wall(t => [th1, ph0 + (ph1 - ph0) * t], nv, false);
    if (!cap) { wall(t => [th0 + (th1 - th0) * t, ph0], nu, false); wall(t => [th0 + (th1 - th0) * t, ph1], nu, true); }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    return new T.Mesh(geo, heatM);
  }
  const line = (pts, closed, rad, mat) => new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, !!closed), pts.length * 4, rad, 6, !!closed), mat);
  // a pipe along `pts` (open, so it can be seen into), heat-tinted toward its end, with a rolled rim and a glow inside its mouth, and a riveted flange where it leaves the shell
  function pipe(pts, r) {
    const f = G(), curve = new T.CatmullRomCurve3(pts), TS = 40, RS = 28, geo = new T.TubeGeometry(curve, TS, r, RS, false);
    const p = geo.attributes.position, col = new Float32Array(p.count * 3), c = new T.Color();
    for (let i = 0; i < p.count; i++) { const u = Math.floor(i / (RS + 1)) / TS, k = Math.pow(Math.max(0, (u - 0.25) / 0.75), 1.5); c.copy(PIPE).lerp(HOT, k * 0.92); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); f.add(new T.Mesh(geo, heatM));
    const mouth = G(); mouth.position.copy(curve.getPoint(1)); mouth.quaternion.setFromUnitVectors(UP, curve.getTangent(1).normalize()); f.add(mouth);
    const rim = torus(r * 1.0, 0.018, bandM, 32); rim.rotation.x = PI / 2; mouth.add(rim);
    mouth.add(at(cyl(r * 0.97, r * 0.97, 0.008, emberHot, 28), 0, -0.035, 0));
    const fl = G(); fl.position.copy(curve.getPoint(0.18)); fl.quaternion.setFromUnitVectors(UP, curve.getTangent(0.18).normalize()); f.add(fl);
    const ring = torus(r * 1.16, 0.022, bandM, 36); ring.rotation.x = PI / 2; fl.add(ring);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + 0.3; fl.add(at(sphere(0.012, rivetM, 8), Math.sin(a) * r * 1.16, 0.024, Math.cos(a) * r * 1.16)); }
    return { f, mouth };
  }
  // A FLAME out of a mouth at B pointing d0: tongued teardrops (orange, amber, white-hot) that leave along d0 and curl upright; the inner ones nudged toward the camera so the hot core shows in the middle
  function flame(B, d0, h, r, seed) {
    const f = G();
    const layer = (hh, rr, mat, push, wob) => {
      const pts = []; for (let i = 0; i <= 20; i++) { const s = i / 20, rad = s < 0.2 ? rr * (0.86 + 0.14 * Math.sin(s / 0.2 * PI / 2)) : rr * Math.pow(1 - (s - 0.2) / 0.8, 1.1); pts.push(new T.Vector2(Math.max(0.0008, rad), s * hh)); }
      const geo = new T.LatheGeometry(pts, 30), p = geo.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i), z = p.getZ(i), s = y / hh, ang = Math.atan2(x, z), m = 1 + wob * Math.pow(s, 0.7) * Math.sin(2 * ang + 8 * s + seed), rr = Math.hypot(x, z) * m;
        const sx = hh * (d0.x * (s - s * s / 2)), sy = hh * (d0.y * (s - s * s / 2) + s * s / 2), sz = hh * (d0.z * (s - s * s / 2));
        p.setXYZ(i, B.x + sx + rr * Math.sin(ang) + CAM.x * push, B.y + sy + CAM.y * push, B.z + sz + rr * Math.cos(ang) + CAM.z * push);
      }
      f.add(new T.Mesh(geo, mat));
    };
    layer(h, r, ember, 0, 0.42); layer(h * 0.7, r * 0.64, emberHot, r * 0.5, 0.22); layer(h * 0.42, r * 0.36, emberCore, r * 0.8, 0.06);
    return f;
  }
  // an arched outline (flat foot, round head), w wide and h tall, centred
  const arch = (w, h, n) => { const r = w / 2, yc = h / 2 - r, pts = [[-r, -h / 2], [r, -h / 2]]; for (let i = 0; i <= n; i++) { const a = i / n * PI; pts.push([r * Math.cos(a), yc + r * Math.sin(a)]); } return pts; };
  const shapeOf = (pts, S) => { const s = S || new T.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); return s; };

  ITEMS.furnace_heart = { exposure: 1.0, az: AZ, el: EL, build() {
    const g = G(), P = G(); g.add(P);
    // THE CORE: the molten heart under the plates, seen through the cracks
    const cg = new T.SphereGeometry(1, 72, 54), cp = cg.attributes.position;
    for (let i = 0; i < cp.count; i++) { const v = hdef(cp.getX(i), cp.getY(i), cp.getZ(i), R - TH + 0.003); cp.setXYZ(i, v.x, v.y, v.z); }
    P.add(new T.Mesh(cg, ember));
    // THE PLATES: a top cap, two bands (four plates over five, their seams staggered) and the apex cap; a hot line down every crack; a rivet in each plate's corners
    const dth = GAP / (2 * R), dph = th => GAP / (2 * R * Math.sin(th)), BANDS = [0.62, 1.42, 2.2];
    P.add(shell(0, BANDS[0] - dth, 0, TAU, 'top'));
    P.add(shell(BANDS[2] + dth, PI, 0, TAU, 'bot'));
    const rows = [{ t0: BANDS[0], t1: BANDS[1], n: 4, o: -0.3 }, { t0: BANDS[1], t1: BANDS[2], n: 5, o: -0.95 }];
    for (const b of rows) {
      const tm = (b.t0 + b.t1) / 2;
      for (let k = 0; k < b.n; k++) {
        const p0 = b.o + k * TAU / b.n, p1 = p0 + TAU / b.n;
        P.add(shell(b.t0 + dth, b.t1 - dth, p0 + dph(tm), p1 - dph(tm)));
        for (const tt of [b.t0 + 0.055 / R, b.t1 - 0.055 / R]) for (const pp of [p0 + 0.06 / (R * Math.sin(tt)), p1 - 0.06 / (R * Math.sin(tt))]) P.add(at(sphere(0.015, rivetM, 10), ...hp(tt, pp, R - 0.007).toArray()));
        const pts = []; for (let q = 0; q <= 10; q++) pts.push(hp(b.t0 + (b.t1 - b.t0) * q / 10, p0, R - 0.017));
        P.add(line(pts, false, 0.008, emberHot));
      }
    }
    for (const tb of BANDS) { const pts = []; for (let q = 0; q < 64; q++) pts.push(hp(tb, q * TAU / 64, R - 0.017)); P.add(line(pts, true, 0.008, emberHot)); }
    for (const [tt, n] of [[BANDS[0] - 0.06 / R, 7], [BANDS[2] + 0.06 / R, 6]]) for (let q = 0; q < n; q++) P.add(at(sphere(0.015, rivetM, 10), ...hp(tt, q * TAU / n + 0.2, R - 0.007).toArray()));
    // THE DOOR: an arched cast frame on the front, upright, hinged on its left, latched on its right, white-orange behind its bars
    const D = onShell(G(), V(0.42, -0.02, 0.9), UPB, 0.012); P.add(D);
    const W = 0.25, H = 0.27, w = 0.16, h = 0.18;
    const fs = shapeOf(arch(W, H, 24)); fs.holes.push(shapeOf(arch(w, h, 24).reverse(), new T.Path()));
    const fgeo = new T.ExtrudeGeometry(fs, { depth: 0.02, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 12 }); fgeo.translate(0, 0, -0.004);
    D.add(new T.Mesh(fgeo, frameM));
    const back = new T.ExtrudeGeometry(shapeOf(arch(w + 0.03, h + 0.03, 24)), { depth: 0.012, bevelEnabled: false }); back.translate(0, 0, -0.016); D.add(new T.Mesh(back, ember));
    const glowA = at(sphere(1, emberHot, 32), 0, -0.012, 0.0); glowA.scale.set(0.066, 0.074, 0.02); D.add(glowA);
    const glowB = at(sphere(1, emberCore, 32), 0.004, -0.018, 0.008); glowB.scale.set(0.04, 0.046, 0.016); D.add(glowB);
    for (const x of [-0.042, 0, 0.042]) { const top = (h / 2 - w / 2) + Math.sqrt(Math.max(0, (w / 2) * (w / 2) - x * x)), len = top + h / 2; D.add(at(cyl(0.0085, 0.0085, len, grateM, 10), x, -h / 2 + len / 2, 0.016)); }
    const hb = cyl(0.0085, 0.0085, w, grateM, 10); hb.rotation.z = PI / 2; D.add(at(hb, 0, -0.02, 0.02));
    const sill = cbox(w - 0.01, 0.012, 0.01, 0.003, emberHot); D.add(at(sill, 0, -h / 2 + 0.004, 0.006));
    for (const y of [-0.075, 0.05]) D.add(at(cyl(0.016, 0.016, 0.05, hingeM, 12), -W / 2 - 0.004, y, 0.012));
    D.add(at(cbox(0.05, 0.022, 0.018, 0.005, hingeM), W / 2 + 0.006, -0.01, 0.022));
    D.add(at(sphere(0.014, rivetM, 10), W / 2 + 0.03, -0.01, 0.03));
    for (const [x, y] of [[-0.095, -0.115], [0.095, -0.115], [-0.1, 0.05], [0.1, 0.05], [0, 0.125]]) D.add(at(sphere(0.011, rivetM, 8), x, y, 0.016));
    // THE FLUES: the aorta (the bigger: up out of the top and arching over to the heart's left, +x) and the pulmonary trunk (a short stub, to its right and front)
    const aBase = sp(V(0.2, 1, -0.15), R - 0.05), aN = sn(V(0.2, 1, -0.15)), aUp = UPB.clone().lerp(aN, 0.3).normalize(), aSide = V(1, 0, 0.25).normalize();
    const aPts = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * 1.05; aPts.push(aBase.clone().addScaledVector(aUp, 0.1 + 0.15 * Math.sin(a)).addScaledVector(aSide, 0.15 * (1 - Math.cos(a)))); }
    aPts.unshift(aBase.clone());
    const A = pipe(aPts, 0.08); P.add(A.f);
    const pBase = sp(V(-0.3, 0.95, 0.35), R - 0.05), pN = sn(V(-0.3, 0.95, 0.35)), pUp = UPB.clone().lerp(pN, 0.45).normalize();
    const Pu = pipe([pBase, pBase.clone().addScaledVector(pUp, 0.09), pBase.clone().addScaledVector(pUp, 0.17)], 0.058); P.add(Pu.f);
    P.rotation.set(0.04, -0.12, TILT);
    g.updateMatrixWorld(true);
    const q = new T.Quaternion(), mA = A.mouth.getWorldPosition(V(0, 0, 0)), dA = UP.clone().applyQuaternion(A.mouth.getWorldQuaternion(q)), mP = Pu.mouth.getWorldPosition(V(0, 0, 0)), dP = UP.clone().applyQuaternion(Pu.mouth.getWorldQuaternion(q));
    g.add(flame(mA.clone().addScaledVector(dA, -0.02), dA, 0.36, 0.076, 0.4));
    g.add(flame(mP.clone().addScaledVector(dP, -0.015), dP, 0.23, 0.054, 2.1));
    // a lesser tongue beside each, leaning out
    g.add(flame(mA.clone().addScaledVector(dA, -0.02).add(V(0.035, 0, 0.02)), dA.clone().add(V(0.5, 0, 0.1)).normalize(), 0.17, 0.035, 1.7));
    g.add(flame(mP.clone().addScaledVector(dP, -0.015).add(V(-0.025, 0, 0.015)), dP.clone().add(V(-0.45, 0, 0.1)).normalize(), 0.11, 0.026, 0.9));
    // a wisp torn off the top of the aorta's flame
    g.add(flame(mA.clone().add(V(0.03 + dA.x * 0.3, 0.32, 0.01)), UP, 0.08, 0.02, 1.3));
    // EMBERS rising off the flames: bright motes, smaller and fainter as they rise
    const top = Math.max(mA.y, mP.y) + 0.16, cx = (mA.x + mP.x) / 2;
    const motes = [[0.06, 0.02, 0.03, 0.016, 2], [-0.12, 0.05, 0.06, 0.013, 1], [0.17, 0.08, -0.02, 0.012, 1], [-0.03, 0.11, 0.04, 0.011, 0], [0.1, 0.16, 0.03, 0.01, 2], [-0.16, 0.15, 0.0, 0.009, 1],
                   [0.02, 0.21, 0.0, 0.008, 0], [0.19, 0.2, 0.05, 0.007, 1], [-0.08, 0.25, 0.02, 0.006, 2], [0.09, 0.28, 0.0, 0.006, 0]];
    motes.forEach(([x, y, z, r, k]) => g.add(at(sphere(r, k === 2 ? emberHot : k === 1 ? ember : emberDim, 8), cx + x, top + y, (mA.z + mP.z) / 2 + z)));
    return { g };
  } };
})();
