// VOLTAIC SIGIL (the electric Mage's aura at Precision): the sigils' medallion (design/cards/models/_sigil.js) in bright steel, a lightning-bolt rune glowing yellow, copper terminals set round
// its rim with arcs crackling between them, a yellow gem. A PROPOSED look, for the owner's approval.
(function () {
  const { std, at, R, D, medallion, rune } = SIGIL;
  const copper = std('#c0703c', 1, 0.28), ceramic = std('#eef0f2', 0.05, 0.25), arc = STY.glow('#fff27a', 1.8), arcDim = STY.glow('#ffd400', 1.5);
  ITEMS.voltaic_sigil = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(medallion({ face: '#4c545e', faceMetal: 0.9, faceRough: 0.28, rim: '#c4cbd4', gem: '#fff27a', gemGlow: '#e6c200' }));
    P.add(rune([[[0.14, 0.56], [-0.18, 0.06], [0.04, 0.06], [-0.14, -0.56], [0.2, -0.02], [-0.02, -0.02], [0.14, 0.56]]], '#fff27a', 1.7));
    // terminals round the rim, and arcs between neighbours
    const T6 = [-2.4, -1.6, -0.8, 0.8, 1.6, 2.4].map(a => { const x = (R + 0.05) * Math.sin(a), y = (R + 0.05) * Math.cos(a), t = G(); t.position.set(x, y, 0); t.rotation.z = -a;
      t.add(at(cyl(0.03, 0.034, 0.05, ceramic, 14), 0, 0, 0)); t.add(at(sphere(0.024, copper, 12), 0, 0.035, 0)); P.add(t); return [(R + 0.09) * Math.sin(a), (R + 0.09) * Math.cos(a)]; });
    const zig = (p, q, n, amp, seed) => { const pts = [[p[0], p[1], 0]]; for (let k = 1; k < n; k++) { const t = k / n, m = 1 + 0.18 * Math.sin(PI * t); pts.push([(p[0] + (q[0] - p[0]) * t) * m + Math.sin(seed + k * 2.1) * amp, (p[1] + (q[1] - p[1]) * t) * m + Math.cos(seed + k * 1.7) * amp, Math.sin(seed + k) * amp]); } pts.push([q[0], q[1], 0]); return pts; };
    for (const [i, j] of [[0, 1], [1, 2], [3, 4], [4, 5]]) { const pts = zig(T6[i], T6[j], 6, 0.022, i * 1.7); for (let k = 0; k < pts.length - 1; k++) P.add(tube([pts[k], pts[k + 1]], (i + k) % 2 ? 0.0055 : 0.0042, (i + k) % 3 ? arc : arcDim)); }
    P.rotation.y = 0.35;
    return { g };
  } };
})();
