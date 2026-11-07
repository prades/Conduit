// FAULTLINE TALON (the Brawler's opportunity card at Precision: "splits"): the Brawlers' knuckle-duster (design/cards/models/_knuckle.js) with three curved steel talons rising out of its
// striking bar and hooking forward, the middle one the longest, a glowing fault line split up the front of each. A PROPOSED look, for the owner's approval.
(function () {
  const { std, at, steel, bright, accent, TOP, mount } = KNUCKLE;
  const blade = std('#8a929c', 1, 0.2), hot = STY.glow('#ffb347', 1.7);
  function talon(len, curve) {   // rising up (+y) and hooking forward (+z), tapering; the crack up its front
    const g = G(), n = 8, pts = [], r = k => 0.042 * (1 - k / n) + 0.005;
    for (let k = 0; k <= n; k++) { const t = k / n; pts.push([0, Math.sin(t * curve) * len / curve, (1 - Math.cos(t * curve)) * len / curve]); }
    for (let k = 0; k < n; k++) g.add(tube([pts[k], [(pts[k][0] + pts[k + 1][0]) / 2, (pts[k][1] + pts[k + 1][1]) / 2, (pts[k][2] + pts[k + 1][2]) / 2], pts[k + 1]], r(k), k < 1 ? steel : blade));
    const crack = []; for (let k = 1; k < n; k++) { const p = pts[k], t = k / n, nz = Math.cos(t * curve), ny = -Math.sin(t * curve); crack.push([p[0] + (k % 2 ? 0.007 : -0.007), p[1] + ny * r(k) * 0.95, p[2] + nz * r(k) * 0.95]); }
    for (let k = 0; k < crack.length - 1; k++) g.add(tube([crack[k], crack[k + 1]], 0.0055, k % 2 ? hot : accent));
    return g;
  }
  ITEMS.faultline_talon = { exposure: 1.0, az: 0.55, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(mount());
    [[-0.16, 0.32, 1.2], [0, 0.42, 1.3], [0.16, 0.32, 1.2]].forEach(([x, len, c]) => {
      const t = talon(len, c); t.position.set(x, TOP, -0.02); P.add(t);
      P.add(at(cyl(0.05, 0.056, 0.035, bright, 18), x, TOP, -0.02));
    });
    return { g };
  } };
})();
