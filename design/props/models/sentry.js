// THE SENTRY: A SLEEK LASER SENTRY (build 2026-11-09ww; the owner, 2026-11-10: "make the sentries in the facility look less tough ... make it just look like a sleek laser sentry", and of the one-piece draft: "Use it").
// It replaced the armoured twin-cannon turret (a hazard-striped plate, hydraulic rams, an ammunition box and belt): git history has that model. One tile, 1 x 1, solid.
// Variants a00..a15: the head aims at world angle i * 22.5 degrees (0 = +x, increasing towards +z, the game's +y), as the old turret's did, so the game aims it the same way. marks: lamp (a small dark socket at the
// back of the head: the game paints the lit status lamp over it) and muzzle (the middle of the emitter's lens).
// The look: a low pale plinth on a graphite foot ring, a slender pale column with a lit cyan collar, and a smooth pale pod for a head, a graphite keel under it, a lit cyan visor slit, and ONE slim laser emitter:
// a graphite tube with two lit focusing rings and a glowing cyan lens. No hazard plate, no rams, no ammunition box, no twin cannons.
(function () {
  const S = STY.mat, shell = STY.std('#e8f2f5', 0.08, 0.32), shellDk = STY.std('#b9ccd3', 0.1, 0.4), keel = STY.std('#20252d', 0.75, 0.38), emit = STY.std('#262c35', 0.85, 0.3);
  const lens = STY.glow('#7ff7ff', 1.25), lensRing = STY.glow('#31e8ff', 1.0), slit = STY.glow('#31e8ff', 0.9), socket = STY.std('#05080b', 0.4, 0.5);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const flat = (m) => { m.rotation.x = PI / 2; return m; };                 // a torus lies in x-y by default: lay it on the floor
  const along = (m) => { m.rotation.z = PI / 2; return m; };                // a cylinder stands on y by default: lay it along x
  // a smooth pod along +x: a cylinder body with half-spheres at its ends, squashed a little in height
  const pod = (len, r, mat, sy) => { const g = G(); g.add(along(cyl(r, r, len, mat, 28))); for (const sx of [-1, 1]) { const s = new T.Mesh(new T.SphereGeometry(r, 28, 18, 0, TAU, 0, PI / 2), mat); s.rotation.z = -sx * PI / 2; s.position.x = sx * len / 2; g.add(s); } g.scale.y = sy || 1; return g; };

  PROPS.sentry = { variants: Array.from({ length: 16 }, (_, i) => 'a' + String(i).padStart(2, '0')), canvas: [360, 360], exposure: 0.9, build(name) {
    const a = parseInt(name.slice(1), 10) * PI / 8, g = G();
    // ── the plinth: a graphite foot ring on the floor, a low pale drum with a lit cyan line round its top ──
    g.add(at(cyl(0.3, 0.32, px(3), keel, 36), 0, px(1.5), 0));
    g.add(at(cyl(0.25, 0.28, px(7), shell, 36), 0, px(6.5), 0));
    g.add(at(flat(torus(0.252, 0.008, lensRing, 40)), 0, px(10.1), 0));
    g.add(at(cyl(0.2, 0.25, px(2), shellDk, 36), 0, px(11), 0));
    // ── the column: slender and pale, a graphite sleeve at its foot, a lit collar under the head ──
    g.add(at(cyl(0.1, 0.125, px(4), keel, 20), 0, px(14), 0));
    g.add(at(cyl(0.085, 0.1, px(26), shell, 20), 0, px(29), 0));
    for (const y of [20, 30]) g.add(at(flat(torus(0.093, 0.006, shellDk, 24)), 0, px(y), 0));   // two fine panel seams
    g.add(at(cyl(0.11, 0.1, px(3), keel, 24), 0, px(43.5), 0));
    g.add(at(flat(torus(0.112, 0.01, lensRing, 28)), 0, px(45.2), 0));
    // ── the head: turns about the collar ──
    const head = G(); head.position.y = px(47); head.rotation.y = -a; g.add(head);
    head.add(at(cyl(0.07, 0.09, px(4), keel, 20), 0, px(2), 0));                    // the swivel
    head.add(at(pod(0.42, 0.15, shell, 0.82), 0.02, px(12), 0));                     // the pod
    head.add(at(pod(0.34, 0.115, keel, 0.55), 0.0, px(6.6), 0));                      // its graphite keel underneath
    // the visor: a lit band round the pod's nose, so the sentry's eye shows whichever way it aims
    const band = new T.Mesh(new T.CylinderGeometry(0.153, 0.153, 0.05, 32, 1, true, 0, TAU), slit); band.rotation.z = PI / 2; band.scale.z = 1; band.scale.y = 1; head.add(at(band, 0.16, px(12), 0));
    head.add(at(cbox(0.3, px(1.2), 0.03, 0.004, shellDk), -0.04, px(12), 0.124));   // a fine side seam on the +z flank the camera sees
    // the emitter: a slim graphite tube out of the pod's nose, two lit focusing rings, a bright lens at its tip
    head.add(at(along(cyl(0.048, 0.058, 0.3, emit, 18)), 0.4, px(11), 0));
    for (const x of [0.34, 0.46]) { const fr = torus(0.058, 0.008, lensRing, 24); fr.rotation.y = PI / 2; head.add(at(fr, x, px(11), 0)); }   // (its axis along x, round the tube)
    const cap = along(cyl(0.064, 0.056, 0.055, emit, 18)); head.add(at(cap, 0.575, px(11), 0));
    const ln = along(cyl(0.05, 0.05, 0.014, lens, 20)); head.add(at(ln, 0.605, px(11), 0));
    // a short fin on the top, back of the pod, carrying the lamp's socket
    head.add(at(cbox(0.13, px(4), 0.03, 0.01, shellDk), -0.13, px(18.5), 0));
    head.add(at(cyl(0.034, 0.038, px(2.4), socket, 14), -0.16, px(21.2), 0));
    // marks, in the world: the head's yaw is -a
    const ca = Math.cos(a), sa = Math.sin(a), w = (lx, ly, lz) => [lx * ca - lz * sa, px(47) + ly, lx * sa + lz * ca];
    return { g, marks: { lamp: w(-0.16, px(22.6), 0), muzzle: w(0.612, px(11), 0) } };
  } };
})();
