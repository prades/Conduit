// MANTLE GEL (Series 2, Mollusk, Unrefined: +8% maximum HP; docs/SERIES-2.md, drafted look: "a stoppered jar of iridescent gel"): a squat glass jar with a rolled rim, full of nacre-coloured
// gel that catches the light, a cork stopper bound with a brass band, a wire bail. The Mollusks' look: design/cards/models/_mollusk.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, nacreM, glass, brass, cork, nacre, lathe } = MOLL;
  ITEMS.mantle_gel = { exposure: 1.0, az: 0.5, el: 0.32, build() {
    const g = G(), P = G(); g.add(P);
    const JAR = [[0, -0.32], [0.24, -0.32], [0.29, -0.28], [0.3, -0.1], [0.29, 0.12], [0.24, 0.2], [0.16, 0.24], [0.15, 0.3], [0.17, 0.32], [0.17, 0.34], [0.15, 0.34]];
    P.add(new T.Mesh(lathe(JAR, 64), glass));
    const gel = new T.Mesh(nacre(lathe([[0, -0.3], [0.22, -0.3], [0.27, -0.26], [0.28, -0.1], [0.27, 0.08], [0.22, 0.13], [0.12, 0.15], [0, 0.16]], 48), 9), nacreM); P.add(gel);
    const rim = new T.Mesh(new T.TorusGeometry(0.165, 0.014, 10, 40), glass); rim.rotation.x = PI / 2; P.add(at(rim, 0, 0.335, 0));
    P.add(at(cyl(0.135, 0.12, 0.12, cork, 32), 0, 0.37, 0));
    const band = cyl(0.142, 0.142, 0.03, brass, 32); P.add(at(band, 0, 0.35, 0));
    const bail = new T.Mesh(new T.TorusGeometry(0.19, 0.008, 6, 40, PI), brass); P.add(at(bail, 0, 0.36, 0));
    P.rotation.set(0.05, 0, -0.06);
    return { g };
  } };
})();
