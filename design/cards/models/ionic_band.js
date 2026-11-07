// IONIC BAND (the electric Mage's aura at Refined): the band in bright steel, on each flank a row of little copper-wound posts with white ceramic insulators, live arcs jumping between their tops,
// a yellow gem. The bands' family look: design/cards/models/_band.js (KINDLING BAND, approved 2026-11-07). A PROPOSED look, for the owner's approval.
(function () {
  const { std, ring, at, R1, FLANKS, onBand } = BAND;
  const postM = std('#6d747e', 0.9, 0.3), copper = std('#c0703c', 1, 0.28), ceramic = std('#eef0f2', 0.05, 0.25), arc = STY.glow('#fff27a', 1.8), arcDim = STY.glow('#ffd400', 1.5);
  function post(h) {   // a post: a steel rod wound with copper, an insulator stack, a cap
    const g = G();
    g.add(at(cyl(0.022, 0.026, h, postM, 10), 0, h / 2, 0));
    for (let k = 0; k < 7; k++) { const w = new T.Mesh(new T.TorusGeometry(0.03, 0.009, 6, 16), copper); w.rotation.x = PI / 2; g.add(at(w, 0, 0.03 + k * (h * 0.5) / 7, 0)); }
    for (let k = 0; k < 3; k++) g.add(at(cyl(0.045 - k * 0.006, 0.045 - k * 0.006, 0.018, ceramic, 16), 0, h * 0.62 + k * 0.034, 0));
    g.add(at(sphere(0.026, copper, 12), 0, h + 0.01, 0));
    return g;
  }
  ITEMS.ionic_band = { exposure: 1.0, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    P.add(ring({ body: '#5f6873', bodyMetal: 0.9, bodyRough: 0.28, lip: '#c4cbd4', bezel: '#d9dee5', gem: '#fff27a', gemGlow: '#e6c200', gemK: 0.9 }));
    const tops = [];
    FLANKS.forEach((a, i) => {
      const h = 0.3 + (i % 2) * 0.06, p = post(h), q = onBand(R1 + 0.035, a, -0.15);
      p.position.set(q[0], q[1], q[2]); P.add(p); tops.push([q[0], q[1] + h + 0.01, q[2]]);
    });
    // arcs between neighbouring posts on each flank (jagged, glowing)
    const zig = (p, q, n, amp, seed) => { const pts = [p]; for (let k = 1; k < n; k++) { const t = k / n; pts.push([p[0] + (q[0] - p[0]) * t + Math.sin(seed + k * 2.3) * amp, p[1] + (q[1] - p[1]) * t + 0.03 + Math.cos(seed + k * 1.7) * amp, p[2] + (q[2] - p[2]) * t + Math.sin(seed * 1.3 + k) * amp]); } pts.push(q); return pts; };
    for (const [i, j] of [[0, 1], [1, 2], [2, 3], [4, 5], [5, 6], [6, 7]]) {
      const pts = zig(tops[i], tops[j], 5, 0.018, i * 1.9);
      for (let k = 0; k < pts.length - 1; k++) P.add(tube([pts[k], pts[k + 1]], (i + j) % 2 ? 0.006 : 0.0045, (i + j) % 3 ? arc : arcDim));
    }
    P.rotation.x = 0.05;
    return { g };
  } };
})();
