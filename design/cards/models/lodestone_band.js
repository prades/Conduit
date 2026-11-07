// LODESTONE BAND (the core Mage's aura at Refined): the band in dark wrought iron, rough chunks of lodestone set on its flanks with iron filings standing up off them in tufts (the pull of a
// magnet), a teal gem. The bands' family look: design/cards/models/_band.js (KINDLING BAND, approved 2026-11-07). A PROPOSED look, for the owner's approval.
(function () {
  const { std, ring, at, R1, FLANKS, onBand } = BAND;
  const rock = new T.MeshStandardMaterial({ color: STY.col('#2b2d31'), metalness: 0.55, roughness: 0.5, flatShading: true }); rock.envMapIntensity = 1.0;
  const filing = std('#8a929c', 0.9, 0.35), vein = STY.glow('#19e6c1', 1.4);
  ITEMS.lodestone_band = { exposure: 1.05, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    P.add(ring({ body: '#3a3e44', bodyMetal: 0.7, bodyRough: 0.5, lip: '#8b939c', bezel: '#aab3bc', gem: '#7fffe6', gemGlow: '#00b894' }));
    FLANKS.forEach((a, i) => {
      const s = 0.07 + (i % 3) * 0.018, q = onBand(R1 + s * 0.55, a, -0.08 + (i % 2) * 0.1), c = G();
      const chunk = new T.Mesh(new T.DodecahedronGeometry(s, 0), rock); chunk.scale.set(1, 0.85, 0.75); chunk.rotation.set(i * 0.7, i * 1.3, i * 0.4); c.add(chunk);
      // a thin teal vein across it
      const v = new T.Mesh(new T.TorusGeometry(s * 0.82, 0.004, 4, 20, 2.2), vein); v.rotation.set(0.4 + i * 0.3, 0.2, i); c.add(v);
      // the filings: a tuft standing up and out off its top, fanned like field lines
      for (let k = 0; k < 9; k++) { const fa = (k - 4) * 0.16, len = 0.05 + (4 - Math.abs(k - 4)) * 0.012, f = cyl(0.0035, 0.0035, len, filing, 4); f.position.set(Math.sin(fa) * s * 0.5, s * 0.7 + len * 0.45, Math.cos(fa) * s * 0.2); f.rotation.set(0, 0, -fa * 1.4); c.add(f); }
      c.position.set(q[0], q[1], q[2]); c.rotation.set(0, a, 0); P.add(c);
    });
    P.rotation.x = 0.05;
    return { g };
  } };
})();
