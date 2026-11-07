// STINGER TENDRIL (Series 2, Jelly, Refined: +14% attack; docs/SERIES-2.md, drafted look: "a coiled tendril, its tip glowing"): a see-through orchid tendril wound in a loose coil and tapering,
// beaded with small pink stinging nodes, its tip curling up and glowing white-pink. The Jellies' look: design/cards/models/_jelly.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, gel, gelDeep, sting, stingHot } = JELLY;
  ITEMS.stinger_tendril = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    const n = 64, pts = [];
    for (let k = 0; k <= n; k++) { const t = k / n, a = t * TAU * 2.3, r = 0.26 - t * 0.12; pts.push([r * Math.cos(a), -0.28 + t * 0.5 + Math.max(0, t - 0.85) * 1.2, r * Math.sin(a)]); }
    for (const [a0, a1, rad] of [[0, 26, 0.05], [24, 46, 0.038], [44, 65, 0.026]]) { const seg = pts.slice(a0, a1); P.add(tube(seg, rad, gel)); P.add(tube(seg, rad * 0.45, gelDeep)); }   // three lengths, thinning, overlapping so no joint shows
    for (let k = 4; k < n - 4; k += 5) P.add(at(sphere(0.014 + 0.012 * (1 - k / n), sting, 10), pts[k][0], pts[k][1] + 0.045 * (1 - k / n) + 0.012, pts[k][2]));
    const tip = pts[n]; P.add(at(sphere(0.026, stingHot, 14), tip[0], tip[1], tip[2])); P.add(at(sphere(0.045, sting, 14), tip[0], tip[1], tip[2])).children;
    P.children[P.children.length - 1].material = new T.MeshBasicMaterial({ color: STY.col('#ffb8e8'), transparent: true, opacity: 0.35 });
    return { g };
  } };
})();
