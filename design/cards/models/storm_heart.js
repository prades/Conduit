// STORM HEART (Series 2, Elemental, Prototype: Nova; docs/SERIES-2.md, drafted look: "a crackling orb in a ring of fins"): a glowing white-blue orb in a clear shell, arcs crackling over it,
// ringed at its middle by a band of angled steel fins like a turbine's, a brass hub ring. The Elementals' look: design/cards/models/_elemental.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, glass, steel, brass, white, whiteDim } = ELEM;
  const arc = STY.glow('#e8d8ff', 1.8), arcB = STY.glow('#9fc4ff', 1.6);
  ITEMS.storm_heart = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    P.add(at(sphere(0.14, white, 28), 0, 0, 0));
    const halo = sphere(0.19, whiteDim, 28); halo.material = new T.MeshBasicMaterial({ color: STY.col('#a9c6ff'), transparent: true, opacity: 0.3 }); P.add(halo);
    P.add(at(sphere(0.22, glass, 36), 0, 0, 0));
    // arcs over the orb: jagged paths on a sphere just outside the glass
    const onS = (th, ph, r) => [r * Math.sin(th) * Math.cos(ph), r * Math.cos(th), r * Math.sin(th) * Math.sin(ph)];
    for (let k = 0; k < 6; k++) { const pts = []; for (let j = 0; j <= 6; j++) pts.push(onS(0.4 + j * 0.38 + Math.sin(k + j * 2.1) * 0.12, k * 1.05 + Math.sin(j * 1.7 + k) * 0.35, 0.23)); for (let j = 0; j < pts.length - 1; j++) P.add(tube([pts[j], pts[j + 1]], 0.006, (j + k) % 2 ? arc : arcB)); }
    // the ring of fins round its middle
    const hub = new T.Mesh(new T.TorusGeometry(0.25, 0.022, 10, 64), brass); hub.rotation.x = PI / 2; P.add(hub);
    for (let k = 0; k < 14; k++) { const a = k * TAU / 14, f = new T.Mesh(new T.BoxGeometry(0.14, 0.05, 0.012), steel); f.position.set(0.33 * Math.cos(a), 0, 0.33 * Math.sin(a)); f.rotation.set(0.5, -a, 0); P.add(f); }
    const outer = new T.Mesh(new T.TorusGeometry(0.4, 0.012, 8, 64), steel); outer.rotation.x = PI / 2; P.add(outer);
    P.rotation.set(0.25, 0, 0.1);
    return { g };
  } };
})();
