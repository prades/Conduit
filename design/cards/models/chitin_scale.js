// CHITIN SCALE (Series 2, Crustacean, Unrefined: +8% defense; docs/SERIES-2.md, drafted look: "a single curved ridged chitin plate, pale coral with darker banding"): one segment of a
// crustacean's shell, a broad curved plate with raised ridges across it in darker bands, a glossy lacquer, a row of small blunt spines along its upper edge and a lip rolled under its lower
// one. The first Series 2 item (docs/ART-PROCESS.md: one piece first). A PROPOSED look, for the owner's approval.
(function () {
  const shellM = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.05, roughness: 0.32, vertexColors: true, side: T.DoubleSide }); shellM.envMapIntensity = 1.1;
  const spineM = new T.MeshStandardMaterial({ color: STY.col('#c8583c'), metalness: 0.05, roughness: 0.35 }); spineM.envMapIntensity = 1.0;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const CORAL = STY.col('#f0997a'), BAND = STY.col('#8a2f1e'), PALE = STY.col('#fbd9c6');
  ITEMS.chitin_scale = { exposure: 1.0, az: 0.5, el: 0.35, build() {
    const g = G(), P = G(); g.add(P);
    // the plate: a patch of a curved surface (bent across x, bowed along y), thickened, its height carrying raised ridges; coloured in bands
    const W = 0.9, Hh = 0.62, NX = 48, NY = 36, R = 0.62, T0 = 0.05, geo = new T.BufferGeometry(), pos = [], col = [], idx = [], c = new T.Color();
    const ridge = v => { const k = (v * 5) % 1; return Math.pow(Math.max(0, 1 - Math.abs(k - 0.5) * 3.2), 2) * 0.03; };   // five raised bands down the plate
    const point = (u, v, side) => {   // u, v in 0..1; side 0 = outside, 1 = inside
      const a = (u - 0.5) * (W / R) * (1 - 0.32 * v), y = (v - 0.5) * Hh, bow = -Math.pow((v - 0.5) * 2, 2) * 0.08, r = R + (side ? -T0 : ridge(v));
      return [Math.sin(a) * r, y, Math.cos(a) * r - R + bow];
    };
    for (let side = 0; side < 2; side++) for (let j = 0; j <= NY; j++) for (let i = 0; i <= NX; i++) {
      const u = i / NX, v = j / NY, p = point(u, v, side); pos.push(p[0], p[1], p[2]);
      const k = (v * 5) % 1, band = Math.max(0, 1 - Math.abs(k - 0.5) * 3.2);
      const mott = 0.5 + 0.5 * Math.sin(u * 37 + v * 23) * Math.sin(u * 13 - v * 41);
      if (side) c.copy(PALE); else { c.copy(BAND).lerp(CORAL, Math.min(1, band * 2.6 + 0.08)); if (band > 0.75) c.lerp(PALE, (band - 0.75) * 1.4); c.lerp(BAND, mott * 0.1); } col.push(c.r, c.g, c.b);
    }
    const S = (NX + 1) * (NY + 1), id = (side, i, j) => side * S + j * (NX + 1) + i;
    for (let side = 0; side < 2; side++) for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      const a = id(side, i, j), b = id(side, i + 1, j), d = id(side, i, j + 1), e = id(side, i + 1, j + 1);
      if (side) idx.push(a, d, b, b, d, e); else idx.push(a, b, d, b, e, d);
    }
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.computeVertexNormals();
    P.add(new T.Mesh(geo, shellM));
    // the rim: a rolled lip along the bottom edge and up the sides
    const rimPts = []; for (let i = 0; i <= 40; i++) { const p = point(i / 40, 0, 0); rimPts.push([p[0], p[1] - 0.005, p[2] - 0.02]); }
    P.add(tube(rimPts, 0.022, spineM));
    // the spines: a row of short blunt cones along the top edge, leaning back
    for (let i = 0; i < 7; i++) { const u = 0.14 + i * 0.12, p = point(u, 1, 0), a = (u - 0.5) * (W / R) * 0.68, h = 0.045 + (i % 2) * 0.02, s = G(); s.add(at(new T.Mesh(new T.ConeGeometry(0.026, h, 12), spineM), 0, h / 2, 0)); s.add(at(sphere(0.012, spineM, 10), 0, h, 0)); s.position.set(p[0], p[1] - 0.005, p[2] - 0.012); s.rotation.set(-0.3, a, 0); P.add(s); }
    P.rotation.set(0.15, 0, 0);
    return { g };
  } };
})();
