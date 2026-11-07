// KEYSTONE SIGIL (the core Mage's aura at Precision): the sigils' medallion (design/cards/models/_sigil.js) in dark wrought iron, a keystone rune (an arch with its keystone) glowing teal, an arch
// of rough stone blocks set round the top of its rim with the keystone in the middle under the gem, teal veins, a teal gem. A PROPOSED look, for the owner's approval.
(function () {
  const { at, R, D, medallion, rune } = SIGIL;
  const stone = new T.MeshStandardMaterial({ color: STY.col('#5a5e64'), metalness: 0.2, roughness: 0.75, flatShading: true }); stone.envMapIntensity = 0.8;
  const key = new T.MeshStandardMaterial({ color: STY.col('#6d7279'), metalness: 0.25, roughness: 0.6, flatShading: true }); key.envMapIntensity = 0.9;
  const vein = STY.glow('#19e6c1', 1.5);
  ITEMS.keystone_sigil = { exposure: 1.05, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(medallion({ face: '#34383e', faceMetal: 0.7, faceRough: 0.5, rim: '#8b939c', gem: '#7fffe6', gemGlow: '#00b894' }));
    // the rune: an arch of stones (two arcs, the joints between the stones) on a base line, its keystone at the top drawn proud
    const arc = (r, a0, a1, n) => { const o = []; for (let k = 0; k <= n; k++) { const a = a0 + (a1 - a0) * k / n; o.push([r * Math.cos(a), -0.22 + r * Math.sin(a)]); } return o; };
    const strokes = [arc(0.56, 0, PI, 24), arc(0.32, 0, PI, 16), [[-0.62, -0.22], [0.62, -0.22]]];
    for (const a of [PI / 6, PI / 3, 2 * PI / 3, 5 * PI / 6]) strokes.push([[0.32 * Math.cos(a), -0.22 + 0.32 * Math.sin(a)], [0.56 * Math.cos(a), -0.22 + 0.56 * Math.sin(a)]]);
    const k0 = 5 * PI / 12, k1 = 7 * PI / 12, kp = (r, a) => [r * Math.cos(a), -0.22 + r * Math.sin(a)];
    strokes.push([kp(0.3, k0), kp(0.64, k0 - 0.04), kp(0.64, k1 + 0.04), kp(0.3, k1), kp(0.3, k0)]);
    P.add(rune(strokes, '#5fffe0', 1.6));
    // the arch of stone blocks round the top of the rim; the middle one (the keystone) larger
    for (let k = -3; k <= 3; k++) {
      const a = k * 0.36, big = k === 0, w = big ? 0.13 : 0.1, h = big ? 0.12 : 0.085, b = new T.Mesh(new T.BoxGeometry(w, h, 0.1), big ? key : stone);
      const r = R + 0.04 + h / 2; b.position.set(r * Math.sin(a), r * Math.cos(a), 0); b.rotation.set(0.05 * k, 0.04 * k, -a); P.add(b);
      if (k % 2 === 0) { const v = tube([[-w * 0.4, -h * 0.1, 0.052], [0, h * 0.2, 0.053], [w * 0.4, -h * 0.25, 0.052]], 0.004, vein); v.position.copy(b.position); v.rotation.copy(b.rotation); P.add(v); }
    }
    P.rotation.y = 0.35;
    return { g };
  } };
})();
