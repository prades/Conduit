// NACRE PEARL (Series 2, Mollusk, Refined: +14% defense; docs/SERIES-2.md, drafted look: "a large pearl set in a steel claw mount"): a big lustrous pearl in nacre colours held by four curved
// steel claws rising from a cup on a short fluted stem and foot. The Mollusks' look: design/cards/models/_mollusk.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, nacreM, steel, brass, nacre, lathe } = MOLL;
  ITEMS.nacre_pearl = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    const pearl = new T.Mesh(nacre(new T.SphereGeometry(0.24, 64, 48), 7), nacreM); P.add(at(pearl, 0, 0.12, 0));
    P.add(new T.Mesh(lathe([[0, -0.4], [0.2, -0.4], [0.21, -0.37], [0.12, -0.34], [0.06, -0.3], [0.05, -0.2], [0.07, -0.14], [0.14, -0.1], [0.17, -0.06], [0.16, -0.04], [0, -0.04]], 48), steel));
    const ring = new T.Mesh(new T.TorusGeometry(0.165, 0.016, 10, 48), brass); ring.rotation.x = PI / 2; P.add(at(ring, 0, -0.06, 0));
    for (let k = 0; k < 4; k++) {   // the claws: up the pearl's side and over its shoulder
      const a = k * TAU / 4 + PI / 4, c = Math.cos(a), s = Math.sin(a), pts = [];
      for (let j = 0; j <= 8; j++) { const t = j / 8, ang = -0.9 + t * 1.75, r = 0.255; pts.push([c * r * Math.cos(ang), 0.12 + r * Math.sin(ang), s * r * Math.cos(ang)]); }
      pts.unshift([c * 0.15, -0.06, s * 0.15]);
      P.add(tube(pts, 0.018, steel)); P.add(at(sphere(0.022, steel, 12), pts[pts.length - 1][0], pts[pts.length - 1][1], pts[pts.length - 1][2]));
    }
    return { g };
  } };
})();
