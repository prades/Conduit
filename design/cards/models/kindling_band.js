// KINDLING BAND (the fire Mage's aura at Refined, +5% attack to the squad near it; docs/UNIVERSAL-AND-PLAYER-CARDS.md): a thick bronze arm-band with brass lips, a bundle of charred
// kindling sticks lashed round its front with copper wire, smouldering (glowing cracks, their tips catching), a faceted ember gem in a brass bezel at the front, and sparks rising.
// The first of the class-card items (docs/FOLLOWING-UPDATE.md Part 3, gate 3; docs/ART-PROCESS.md: one piece first). A PROPOSED look, for the owner's approval.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const bronze = std('#7a5634', 0.85, 0.34, { side: T.DoubleSide }), brass = std('#c9a35a', 1, 0.24), copper = std('#b8673a', 1, 0.3), bezelM = std('#d6b06a', 0.9, 0.3);
  const woodM = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.05, roughness: 0.85, vertexColors: true });
  const ember = STY.glow('#ff5a12', 1.6), emberHot = STY.glow('#ff9a2e', 1.7), emberDim = STY.glow('#c8400c', 1.3);
  const gemM = new T.MeshStandardMaterial({ color: STY.col('#ff8a2a'), emissive: STY.col('#ff4a0c'), emissiveIntensity: 0.85, metalness: 0.1, roughness: 0.22, flatShading: true }); gemM.envMapIntensity = 1.2;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const CHAR = STY.col('#1c1410'), WOOD = STY.col('#5a3a22'), SCORCH = STY.col('#8a3a12');
  // a stick of kindling: a slightly bent, tapering rod, raw wood at its foot charring to black toward its top
  function stick(len, r) {
    const geo = new T.CylinderGeometry(r * 0.8, r, len, 9, 8), pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color();
    for (let i = 0; i < pos.count; i++) {
      const k = (pos.getY(i) + len / 2) / len; pos.setX(i, pos.getX(i) + Math.sin(k * PI) * r * 0.5);
      c.copy(WOOD).lerp(CHAR, Math.min(1, k * 1.3)); if (k > 0.88) c.lerp(SCORCH, (k - 0.88) / 0.12 * 0.8);
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
    }
    geo.setAttribute('color', new T.BufferAttribute(col, 3)); geo.computeVertexNormals();
    const g = G(); g.add(new T.Mesh(geo, woodM));
    for (const y of [0.55, 0.75]) { const c2 = new T.Mesh(new T.TorusGeometry(r * 0.95, 0.007, 6, 18), y > 0.6 ? emberHot : ember); c2.rotation.x = PI / 2; g.add(at(c2, 0, len * (y - 0.5), 0)); }   // the glowing cracks
    g.add(at(sphere(r * 0.86, ember, 12), 0, len / 2, 0)); g.add(at(sphere(r * 0.5, emberHot, 10), 0, len / 2 + r * 0.45, 0));   // its tip, catching
    return g;
  }

  ITEMS.kindling_band = { exposure: 1.0, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    // THE BAND: a thick ring (a lathe of its cross-section), bronze, with rolled brass lips top and bottom
    const R0 = 0.36, R1 = 0.42, H = 0.17;
    const prof = [[R0, -H], [R1, -H], [R1, H], [R0, H], [R0, -H]].map(p => new T.Vector2(p[0], p[1]));
    P.add(new T.Mesh(new T.LatheGeometry(prof, 64), bronze));
    for (const y of [-H, H]) { const t = new T.Mesh(new T.TorusGeometry(R1 + 0.006, 0.026, 10, 72), brass); t.rotation.x = PI / 2; P.add(at(t, 0, y, 0)); }
    // THE KINDLING: sticks round its front half, on either side of the gem, leaning a little; lashed with two copper wires
    const ang = [-1.25, -1.02, -0.8, -0.58, 0.58, 0.8, 1.02, 1.25], lean = [0.12, -0.08, 0.1, -0.05, 0.06, -0.1, 0.08, -0.12];
    ang.forEach((a, i) => {
      const len = 0.5 + (i % 3) * 0.05, r = 0.036 + (i % 2) * 0.008, s = stick(len, r), RR = R1 + r + 0.01;
      s.position.set(RR * Math.sin(a), 0.03 + (i % 2) * 0.03, RR * Math.cos(a)); s.rotation.set(0, a, lean[i]); P.add(s);
    });
    for (const y of [-0.08, 0.1]) { const w = new T.Mesh(new T.TorusGeometry(R1 + 0.075, 0.011, 8, 80, 2.9), copper); w.rotation.set(PI / 2, 0, PI / 2 - 1.45); P.add(at(w, 0, y, 0)); }
    // THE EMBER GEM: faceted, glowing, in a brass bezel at the front
    const bz = G(); bz.position.set(0, 0, R1 + 0.02);
    const back = cyl(0.115, 0.115, 0.03, bronze, 32); back.rotation.x = PI / 2; bz.add(back);
    const rim = new T.Mesh(new T.TorusGeometry(0.112, 0.022, 10, 40), bezelM); rim.position.z = 0.02; bz.add(rim);
    for (let k = 0; k < 4; k++) { const pr = cbox(0.03, 0.05, 0.03, 0.006, brass), a = k * TAU / 4 + PI / 4; pr.position.set(0.1 * Math.cos(a), 0.1 * Math.sin(a), 0.05); pr.rotation.z = a - PI / 2; bz.add(pr); }   // its four prongs
    const gem = new T.Mesh(new T.OctahedronGeometry(0.1, 0), gemM); gem.scale.set(0.82, 1.15, 0.62); gem.rotation.z = PI / 4; gem.position.z = 0.06; bz.add(gem);
    P.add(bz);
    // sparks rising off the kindling
    [[0.22, 0.42, 0.42, 0.014], [-0.18, 0.5, 0.4, 0.011], [0.05, 0.58, 0.44, 0.008], [-0.3, 0.4, 0.3, 0.01], [0.32, 0.55, 0.3, 0.007]].forEach(([x, y, z, r], k) => P.add(at(sphere(r, k % 2 ? emberHot : ember, 10), x, y, z)));
    P.rotation.x = 0.05;
    return { g };
  } };
})();
