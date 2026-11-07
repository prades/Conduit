// GLACIAL SIGIL (the ice Mage's aura at Precision): the sigils' medallion (design/cards/models/_sigil.js) in pale silver, a six-armed snowflake rune glowing ice-blue, clear ice crystals growing
// off its rim, a glint of frost, an ice-blue gem. A PROPOSED look, for the owner's approval.
(function () {
  const { at, R, D, medallion, rune } = SIGIL;
  const ice = new T.MeshStandardMaterial({ color: STY.col('#d6f2ff'), emissive: STY.col('#3d8fc4'), emissiveIntensity: 0.35, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.86, flatShading: true }); ice.envMapIntensity = 1.4;
  const glint = STY.glow('#e8f8ff', 1.7);
  function shard(len, r) { const g = G(); g.add(at(new T.Mesh(new T.CylinderGeometry(r, r * 0.9, len * 0.72, 6), ice), 0, len * 0.36, 0)); g.add(at(new T.Mesh(new T.ConeGeometry(r, len * 0.28, 6), ice), 0, len * 0.86, 0)); return g; }
  ITEMS.glacial_sigil = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(medallion({ face: '#8796a8', faceMetal: 0.9, faceRough: 0.24, rim: '#e3edf6', gem: '#c4ecff', gemGlow: '#3aaef0' }));
    const arms = [];
    for (let k = 0; k < 6; k++) { const a = k * TAU / 6 + PI / 2, c = [Math.cos(a), Math.sin(a)], s = [-c[1], c[0]];
      arms.push([[0, 0], [c[0] * 0.55, c[1] * 0.55]]);
      arms.push([[c[0] * 0.3, c[1] * 0.3], [c[0] * 0.42 + s[0] * 0.12, c[1] * 0.42 + s[1] * 0.12]], [[c[0] * 0.3, c[1] * 0.3], [c[0] * 0.42 - s[0] * 0.12, c[1] * 0.42 - s[1] * 0.12]]); }
    P.add(rune(arms, '#bfeaff', 1.6));
    [-2.2, -1.5, -0.9, 0.9, 1.5, 2.2, 2.8].forEach((a, i) => {
      const cl = G(), x = (R + 0.02) * Math.sin(a), y = (R + 0.02) * Math.cos(a); cl.position.set(x, y, 0); cl.rotation.z = -a;
      [[0.2 + (i % 3) * 0.05, 0.034, 0], [0.12, 0.024, 0.5], [0.1, 0.02, -0.5]].forEach(([len, r, tilt]) => { const s = shard(len, r); s.rotation.z = tilt; s.rotation.x = (i % 2 ? 0.3 : -0.3); cl.add(s); });
      P.add(cl);
    });
    [[0.3, 0.5, 0.1, 0.012], [-0.34, 0.44, 0.08, 0.01], [0.48, -0.1, 0.06, 0.009]].forEach(([x, y, z, r]) => P.add(at(sphere(r, glint, 10), x, y, z)));
    P.rotation.y = 0.35;
    return { g };
  } };
})();
