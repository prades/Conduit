// THE CRUSTACEAN ITEMS (Series 2: CHITIN SCALE, BARNACLE BRACER, PINCER CLAMP, TIDE SHELL; docs/SERIES-2.md): one family. CHITIN SCALE (approved by the owner, 2026-11-07) set the look: glossy
// coral chitin with narrow dark bands in its grooves, pale at its crests, blunt darker spines. The rest share its colours and band through this.
const CRUST = (function () {
  const CORAL = STY.col('#f0997a'), BAND = STY.col('#8a2f1e'), PALE = STY.col('#fbd9c6');
  const shell = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.05, roughness: 0.32, vertexColors: true, side: T.DoubleSide }); shell.envMapIntensity = 1.1;
  const spine = new T.MeshStandardMaterial({ color: STY.col('#c8583c'), metalness: 0.05, roughness: 0.35 }); spine.envMapIntensity = 1.0;
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  // colour a geometry in chitin bands: n bands along axis 0/1/2 (x/y/z) between lo and hi
  function band(geo, axis, lo, hi, n) {
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color();
    for (let i = 0; i < pos.count; i++) {
      const v = ((axis === 0 ? pos.getX(i) : axis === 1 ? pos.getY(i) : pos.getZ(i)) - lo) / (hi - lo), k = ((v * n) % 1 + 1) % 1, b = Math.max(0, 1 - Math.abs(k - 0.5) * 3.2);
      c.copy(BAND).lerp(CORAL, Math.min(1, b * 2.6 + 0.08)); if (b > 0.75) c.lerp(PALE, (b - 0.75) * 1.4);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); return geo;
  }
  // a curved, tapering horn (a claw's finger): a smooth cone from the origin along +x, bending toward +y (bend > 0) or -y, its tip darker; userData.pts: points along its inner edge
  function horn(len, r0, bend, mat) {
    const geo = new T.ConeGeometry(r0, len, 18, 14), pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color(), tipC = STY.col('#8a2f1e'), baseC = STY.col('#f0997a');
    for (let i = 0; i < pos.count; i++) {
      const t = pos.getY(i) / len + 0.5, x = t * len, y0 = pos.getX(i), z0 = pos.getZ(i);
      pos.setXYZ(i, x, y0 + bend * t * t * len * 0.5, z0);   // the cone laid along +x, curved
      c.copy(baseC).lerp(tipC, Math.pow(t, 3)); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const m = new T.Mesh(geo, new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.05, roughness: 0.3, vertexColors: true })), g = G(); g.add(m);
    const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8; pts.push([t * len, bend * t * t * len * 0.5 - Math.sign(bend || 1) * r0 * (1 - t) * 0.9, 0]); }
    g.userData.pts = pts; return g;
  }
  return { CORAL, BAND, PALE, shell, spine, std, at, band, horn };
})();
