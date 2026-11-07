// GEL MEMBRANE (Series 2, Jelly, Unrefined: +8% maximum HP; docs/SERIES-2.md, drafted look: "a wobbling translucent membrane stretched on a hoop"): a silver hoop with a see-through orchid
// membrane stretched across it and bellied out, rippled as if it wobbles, small silver clips round the hoop. The Jellies' look: design/cards/models/_jelly.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, gel, silver } = JELLY;
  ITEMS.gel_membrane = { exposure: 1.0, az: 0.45, el: 0.2, build() {
    const g = G(), P = G(); g.add(P);
    const R = 0.34;
    P.add(new T.Mesh(new T.TorusGeometry(R, 0.024, 12, 72), silver));
    // the membrane: a disc pushed out into a belly, with rings of ripple
    const geo = new T.CircleGeometry(R, 72, 0, TAU), pos = geo.attributes.position;
    const seg = new T.RingGeometry(0.001, R, 72, 24), sp = seg.attributes.position;
    for (let i = 0; i < sp.count; i++) { const x = sp.getX(i), y = sp.getY(i), r = Math.hypot(x, y) / R, a = Math.atan2(y, x); sp.setZ(i, (1 - r * r) * 0.16 + Math.sin(r * 14 + a * 2) * 0.008 * (1 - r)); }
    seg.computeVertexNormals(); P.add(new T.Mesh(seg, gel));
    for (let k = 0; k < 8; k++) { const a = k * TAU / 8, c = cbox(0.04, 0.03, 0.05, 0.008, silver); c.rotation.z = a; P.add(at(c, R * Math.cos(a), R * Math.sin(a), 0)); }
    P.rotation.set(0, -0.35, 0.1);
    return { g };
  } };
})();
