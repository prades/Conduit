// REGROWTH SAC (Series 2, Mollusk, Prototype: Regrowth; docs/SERIES-2.md, drafted look: "a pulsing translucent sac with veins"): a soft, lumpy, see-through sac in pearly pink, red veins
// branching over it, a glowing sea-green heart beating inside, a puckered nacre neck at its top. The Mollusks' look: design/cards/models/_mollusk.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, nacreM, glow, glowDim, nacre, lathe } = MOLL;
  const skin = new T.MeshStandardMaterial({ color: STY.col('#f4b8c4'), emissive: STY.col('#d0607a'), emissiveIntensity: 0.4, metalness: 0, roughness: 0.25, transparent: true, opacity: 0.7 }); skin.envMapIntensity = 1.3;
  const vein = new T.MeshStandardMaterial({ color: STY.col('#b8203a'), emissive: STY.col('#6a0f1e'), emissiveIntensity: 0.4, metalness: 0, roughness: 0.4 });
  ITEMS.regrowth_sac = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    // the sac: a sphere pushed into soft lumps
    const geo = new T.SphereGeometry(0.3, 64, 48), pos = geo.attributes.position, lump = (x, y, z) => 1 + 0.06 * Math.sin(x * 11 + y * 4) * Math.sin(z * 9 - y * 7) + 0.05 * Math.sin(y * 13);
    for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), k = lump(x, y, z); pos.setXYZ(i, x * k, y * k * 1.08 - (y > 0.2 ? (y - 0.2) * 0.3 : 0), z * k); }
    geo.computeVertexNormals(); P.add(new T.Mesh(geo, skin));
    // the heart inside, glowing
    P.add(at(sphere(0.13, glowDim, 24), 0, -0.02, 0)); P.add(at(sphere(0.08, glow, 20), 0.01, -0.01, 0.02));
    // veins: branching curves over the surface (pushed out to just above it)
    const onSac = (th, ph, r) => { const x = Math.sin(th) * Math.cos(ph), y = Math.cos(th), z = Math.sin(th) * Math.sin(ph), k = lump(x * 0.3, y * 0.3, z * 0.3) * (r || 0.305); return [x * k, y * k * 1.08, z * k]; };
    const trunk = (ph0, len) => { const p = []; for (let j = 0; j <= 10; j++) { const t = j / 10; p.push(onSac(0.35 + t * len, ph0 + Math.sin(t * 5) * 0.25)); } return p; };
    [0.6, 1.5, 2.3, 3.4, 4.4, 5.4].forEach((ph, i) => {
      const tr = trunk(ph, 1.9 + (i % 2) * 0.4); P.add(tube(tr, 0.009, vein));
      for (const b of [3, 6]) { const s = tr[b], th = 0.35 + b / 10 * 2, br = []; for (let j = 0; j <= 4; j++) br.push(onSac(th + j * 0.12, ph + (i % 2 ? 1 : -1) * j * 0.12)); br[0] = s; P.add(tube(br, 0.005, vein)); }
    });
    // the neck: a puckered nacre knot at the top
    P.add(new T.Mesh(nacre(lathe([[0.07, 0.28], [0.1, 0.31], [0.06, 0.35], [0.08, 0.39], [0.05, 0.42], [0, 0.43]], 32), 12), nacreM));
    return { g };
  } };
})();
