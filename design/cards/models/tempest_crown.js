// TEMPEST CROWN (the electric Mage's aura at Prototype): the crowns' circlet (design/cards/models/_crown.js) in bright steel, its points zigzag lightning bolts in steel with glowing yellow
// tips, arcs leaping between the tips, a big yellow gem. A PROPOSED look, for the owner's approval.
(function () {
  const { std, at, R1, H, circlet, points } = CROWN;
  const steel = std('#c4cbd4', 1, 0.24), tip = STY.glow('#fff27a', 1.8), arc = STY.glow('#fff27a', 1.8), arcDim = STY.glow('#ffd400', 1.5);
  ITEMS.tempest_crown = { exposure: 1.0, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    P.add(circlet({ body: '#4c545e', bodyMetal: 0.9, bodyRough: 0.28, lip: '#c4cbd4', gem: '#fff27a', gemGlow: '#e6c200' }).g);
    const tips = [];
    points(P, (h, i) => {
      const t = G(), bolt = k => [[0.012, 0], [0.05, h * 0.52], [0.016, h * 0.5], [0.04, h], [-0.046, h * 0.4], [-0.012, h * 0.42], [-0.034, 0]].map(p => [p[0] * k, p[1] * (k < 1 ? 0.94 : 1) + (k < 1 ? h * 0.03 : 0)]);
      const outer = plate(bolt(1), 0.03, 0.006, steel); outer.position.z = -0.015; t.add(outer);   // a lightning bolt in steel, its heart glowing
      const inner = plate(bolt(0.5), 0.012, 0.002, tip); inner.position.z = 0.016; t.add(inner);
      t.add(at(sphere(0.02, tip, 12), 0, h, 0));
      return t;
    }, 0.2);
    for (let i = 0; i < 8; i++) { const a = i * TAU / 8, h = 0.2 * (i === 0 ? 1.45 : i % 2 ? 0.8 : 1.1), r = R1 - 0.02; tips.push([r * Math.sin(a), H + h, r * Math.cos(a)]); }
    const zig = (p, q, n, amp, seed) => { const o = [p]; for (let k = 1; k < n; k++) { const t = k / n; o.push([p[0] + (q[0] - p[0]) * t + Math.sin(seed + k * 2.3) * amp, p[1] + (q[1] - p[1]) * t + 0.03 + Math.cos(seed + k * 1.7) * amp, p[2] + (q[2] - p[2]) * t + Math.sin(seed * 1.3 + k) * amp]); } o.push(q); return o; };
    for (const [i, j] of [[0, 1], [1, 2], [7, 0], [6, 7], [3, 4]]) { const pts = zig(tips[i], tips[j], 5, 0.02, i * 1.9); for (let k = 0; k < pts.length - 1; k++) P.add(tube([pts[k], pts[k + 1]], (i + k) % 2 ? 0.0055 : 0.0042, (i + k) % 3 ? arc : arcDim)); }
    P.rotation.x = 0.06;
    return { g };
  } };
})();
