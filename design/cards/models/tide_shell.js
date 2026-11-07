// TIDE SHELL (Series 2, Crustacean, Prototype: Shell block; docs/SERIES-2.md, drafted look: "a spiral conch shell shield, glowing at its seams"): a great conch in banded coral chitin, its
// spire wound with a glowing sea-green seam, knobs round its shoulder, a pearl-pink flared lip at its mouth glowing faintly within. The Crustaceans' look: design/cards/models/_crust.js
// (CHITIN SCALE, approved). A PROPOSED look, for the owner's approval.
(function () {
  const { shell, spine, std, at, band } = CRUST;
  const seam = STY.glow('#6ff7e0', 1.6), seamDim = STY.glow('#25b8a0', 1.3);
  const lipM = new T.MeshStandardMaterial({ color: STY.col('#ffd2c4'), emissive: STY.col('#ff9a86'), emissiveIntensity: 0.25, metalness: 0.1, roughness: 0.25, side: T.DoubleSide }); lipM.envMapIntensity = 1.2;
  const PROF = [[0, 0.5], [0.05, 0.43], [0.09, 0.37], [0.1, 0.34], [0.14, 0.28], [0.17, 0.23], [0.18, 0.2], [0.23, 0.12], [0.29, 0.04], [0.31, 0.0], [0.3, -0.12], [0.24, -0.26], [0.15, -0.38], [0.07, -0.47], [0.03, -0.55], [0, -0.57]];
  const rAt = y => { for (let k = 0; k < PROF.length - 1; k++) { const [r0, y0] = PROF[k], [r1, y1] = PROF[k + 1]; if (y <= y0 && y >= y1) return r0 + (r1 - r0) * (y0 - y) / (y0 - y1 || 1); } return 0; };
  ITEMS.tide_shell = { exposure: 1.0, az: 0.5, el: 0.25, build() {
    const g = G(), P = G(); g.add(P);
    P.add(new T.Mesh(band(new T.LatheGeometry(PROF.map(p => new T.Vector2(p[0], p[1])), 64), 1, -0.57, 0.5, 7), shell));
    // the seam: a glowing spiral wound down the spire to the shoulder
    const pts = []; for (let k = 0; k <= 120; k++) { const t = k / 120, y = 0.46 - t * 0.48, a = t * TAU * 3.2, r = rAt(y) + 0.008; pts.push([r * Math.sin(a), y, r * Math.cos(a)]); }
    for (let k = 0; k < pts.length - 1; k += 4) { const seg = pts.slice(k, k + 5); if (seg.length > 1) P.add(tube(seg, 0.009, (k / 4) % 2 ? seam : seamDim)); }
    // knobs round its shoulder
    for (let k = 0; k < 9; k++) { const a = k * TAU / 9 + 0.3, kn = new T.Mesh(new T.ConeGeometry(0.035, 0.08, 10), spine), q = G(); q.position.set(0.31 * Math.sin(a), 0.01, 0.31 * Math.cos(a)); q.rotation.y = a; kn.rotation.x = PI / 2 - 0.4; kn.position.z = 0.03; q.add(kn); P.add(q); }
    // the mouth: a flared lip down its front, pearl-pink, glowing faintly inside
    const lip = new T.Mesh(new T.SphereGeometry(0.2, 32, 20, -0.9, 1.8, 0.35, 2.2), lipM); lip.scale.set(1.0, 1.6, 0.55); P.add(at(lip, 0.04, -0.18, 0.2));
    const glow = new T.Mesh(new T.SphereGeometry(0.11, 20, 14), seamDim); glow.scale.set(0.6, 1.5, 0.2); P.add(at(glow, 0.04, -0.18, 0.19));
    P.rotation.set(0.05, 0.3, -0.25);
    return { g };
  } };
})();
