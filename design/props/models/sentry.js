// THE SENTRY TURRET (one tile: the prop is 1 x 1; solid). Variants a00..a15: the head aims at world angle i * 22.5 degrees (0 = +x, increasing towards +z, the game's +y): the barrels point along (cos a, 0, sin a).
// The base, the pedestal and the cables are the same in every variant; only the head turns. marks: lamp (the status lamp, a dark socket on a stalk at the back of the head: the game paints the lit lamp over it) and
// muzzle (the middle of the twin barrels' tips). A bolted plate with hazard stripes, a hydraulic pedestal, a turntable, and an armoured head with a sensor eye, an ammo box and belt, and twin cannons.
(function () {
  const mat = (c, m, r, extra) => { const x = new T.MeshStandardMaterial(Object.assign({ color: c, metalness: m, roughness: r, flatShading: true }, extra || {})); x.envMapIntensity = 0.6; return x; };
  const steelDk = mat(0x11151b, 0.8, 0.5), panel = mat(0x1b222c, 0.75, 0.45), panelLt = mat(0x28323f, 0.7, 0.45), teal = mat(0x10505b, 0.6, 0.45), olive = mat(0x2a352b, 0.5, 0.6), steel = mat(0x808a98, 1, 0.3), gun = mat(0x21272f, 0.95, 0.35), black = mat(0x07090c, 0.4, 0.6);
  const hzY = mat(0xc0900f, 0.2, 0.6), hzK = mat(0x0b0b0e, 0.2, 0.7);
  const cyan = new T.MeshBasicMaterial({ color: 0x31e8ff, toneMapped: false }), cyanDim = new T.MeshBasicMaterial({ color: 0x1d8fa3, toneMapped: false }), glass = mat(0x03090c, 0.9, 0.08);
  const rubber = new T.MeshStandardMaterial({ color: 0x050607, metalness: 0.1, roughness: 0.8 });
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const flat = (m) => { m.rotation.x = PI / 2; return m; };   // a torus lies in x-y by default: lay it on the floor

  PROPS.sentry = { variants: Array.from({ length: 16 }, (_, i) => 'a' + String(i).padStart(2, '0')), canvas: [400, 400], exposure: 0.85, build(name) {
    const a = parseInt(name.slice(1), 10) * PI / 8, g = G();
    // ── the fixed part: plate, bolts, hazard stripes, a conduit box and a cable; the pedestal, the turntable and the head are a group scaled up (K) about the plate so the turret has presence at the game's tile size ──
    const K = 1.2, top = G(); top.scale.set(K, K, K); top.position.y = px(4) * (1 - K); g.add(top);
    g.add(at(cbox(0.92, px(4), 0.92, 0.03, steelDk), 0, px(2), 0));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const bolt = cyl(0.045, 0.045, px(3), steel, 6); g.add(at(bolt, sx * 0.39, px(5.2), sz * 0.39)); }
    for (let i = 0; i < 8; i++) {   // hazard stripes along the two edges the camera sees (+z and +x)
      const t = -0.39 + i * 0.78 / 7 + 0.0, m = i % 2 ? hzK : hzY;
      g.add(at(cbox(0.1, px(0.8), 0.07, 0.005, m), t, px(4.4), 0.415)); g.add(at(cbox(0.07, px(0.8), 0.1, 0.005, m), 0.415, px(4.4), t));
    }
    top.add(at(cyl(0.3, 0.34, px(6), panel, 20), 0, px(7), 0));                            // the flange the pedestal bolts to
    for (let i = 0; i < 8; i++) { const b = cyl(0.028, 0.028, px(2), steel, 6); top.add(at(b, Math.cos(i * PI / 4) * 0.27, px(10.4), Math.sin(i * PI / 4) * 0.27)); }
    top.add(at(cyl(0.17, 0.21, px(25), steelDk, 14), 0, px(23), 0));                       // the column
    top.add(at(flat(torus(0.185, 0.014, cyan, 28)), 0, px(30), 0));                         // a lit collar
    for (const [ang, h] of [[0.5, 20], [2.6, 20], [4.7, 20]]) {   // three hydraulic rams: a sleeve below, a bright rod above
      const x = Math.cos(ang) * 0.22, z = Math.sin(ang) * 0.22;
      top.add(at(cyl(0.032, 0.032, px(11), panelLt, 8), x, px(17), z)); top.add(at(cyl(0.017, 0.017, px(12), steel, 6), x, px(27), z));
      top.add(at(cbox(0.07, px(3), 0.07, 0.01, steelDk), x, px(11.5), z)); top.add(at(cbox(0.07, px(3), 0.07, 0.01, steelDk), x, px(33), z));
    }
    top.add(at(cyl(0.022, 0.022, px(28), steelDk, 8), 0.2, px(21), -0.12));                // a conduit up the column's side
    g.add(at(cbox(0.1, px(4), 0.1, 0.015, olive), 0.24, px(6), -0.12));                  // its box on the plate
    top.add(at(cyl(0.34, 0.34, px(3), panel, 24), 0, px(37), 0));                           // the turntable
    top.add(at(flat(torus(0.335, 0.012, cyan, 36)), 0, px(38.6), 0));
    top.add(at(flat(torus(0.34, 0.01, steel, 36)), 0, px(35.6), 0));
    // a cable from the conduit's box across the plate and down onto the floor, ending in a plug
    g.add(tube([[0.26, px(5.5), -0.12], [0.4, px(4.6), -0.04], [0.55, px(3), 0.04], [0.66, px(1), 0.12]], 0.03, rubber));
    g.add(at(cbox(0.1, px(4), 0.08, 0.01, steelDk), 0.68, px(2), 0.14));
    // ── the head: turns about the turntable ──
    const head = G(); head.position.y = px(38.5); head.rotation.y = -a; top.add(head);
    head.add(at(cbox(0.4, px(7), 0.5, 0.04, steelDk), 0, px(3.5), 0));                    // the swivel yoke
    head.add(at(cbox(0.56, px(21), 0.46, 0.06, panel), 0.02, px(17), 0));                // the main housing
    head.add(at(cbox(0.5, px(2.5), 0.4, 0.03, panelLt), 0.02, px(28.5), 0));             // its top plate
    head.add(at(cbox(0.13, px(17), 0.4, 0.04, teal), 0.31, px(16.5), 0));                // the armoured front
    for (const sz of [-1, 1]) {
      const sp = cbox(0.4, px(15), 0.03, 0.01, panelLt); head.add(at(sp, 0.0, px(17), sz * 0.245));
      for (let i = 0; i < 4; i++) head.add(at(cbox(0.06, px(1.2), 0.01, 0.002, cyanDim), -0.14 + i * 0.08, px(12), sz * 0.262));   // vent slots
    }
    // the ammunition box on the +z side of the head, a belt into the guns
    head.add(at(cbox(0.3, px(14), 0.14, 0.02, olive), -0.02, px(13), 0.34));
    head.add(at(cbox(0.3, px(2), 0.145, 0.01, hzY), -0.02, px(8.5), 0.34)); head.add(at(cbox(0.3, px(2), 0.145, 0.01, hzY), -0.02, px(17.5), 0.34));
    for (let i = 0; i < 7; i++) { const t = i / 6; head.add(at(cbox(0.045, px(2.4), 0.06, 0.006, steel), 0.14 + t * 0.12, px(16 - Math.sin(t * PI) * 2.5 + t * 3), 0.28 - t * 0.12)); }
    // the sensor: a pod on the top front with a recessed dark lens in a lit ring
    head.add(at(cbox(0.2, px(9), 0.24, 0.03, panel), 0.2, px(33), 0));
    const ring = torus(0.062, 0.012, cyan, 24); ring.rotation.y = PI / 2; head.add(at(ring, 0.31, px(33), 0));
    const lens = cyl(0.052, 0.052, px(3), glass, 16); lens.rotation.z = PI / 2; head.add(at(lens, 0.3, px(33), 0));
    // the lamp: a dark socket on a stalk at the back of the head
    head.add(at(cyl(0.012, 0.012, px(12), steel, 6), -0.22, px(34), 0));
    head.add(at(cyl(0.05, 0.055, px(4), steelDk, 12), -0.22, px(41), 0));
    head.add(at(cyl(0.036, 0.036, px(1.6), glass, 12), -0.22, px(43.3), 0));
    // the guns: two receivers, shrouds, barrels and brakes along +x
    for (const sz of [-1, 1]) {
      const z = sz * 0.1;
      head.add(at(cbox(0.3, px(10), 0.13, 0.02, gun), 0.45, px(17), z));                   // the receiver
      head.add(at(cbox(0.06, px(3), 0.12, 0.01, hzY), 0.36, px(23), z));
      const shroud = cyl(0.045, 0.045, 0.38, gun, 10); shroud.rotation.z = PI / 2; head.add(at(shroud, 0.76, px(17), z));
      for (const x of [0.64, 0.74, 0.84]) { const r2 = cyl(0.055, 0.055, 0.012, steelDk, 10); r2.rotation.z = PI / 2; head.add(at(r2, x, px(17), z)); }
      const barrel = cyl(0.024, 0.024, 0.3, steel, 8); barrel.rotation.z = PI / 2; head.add(at(barrel, 1.05, px(17), z));
      const brake = cyl(0.04, 0.04, 0.07, gun, 8); brake.rotation.z = PI / 2; head.add(at(brake, 1.2, px(17), z));
      const bore = cyl(0.022, 0.022, 0.012, black, 8); bore.rotation.z = PI / 2; head.add(at(bore, 1.24, px(17), z));
    }
    head.add(at(cbox(0.1, px(9), 0.32, 0.02, panelLt), 0.62, px(17), 0));                 // the cross-brace that holds the two guns together
    // marks, in the world: the head's yaw is -a
    const ca = Math.cos(a), sa = Math.sin(a), w = (lx, ly, lz) => [K * (lx * ca - lz * sa), K * (px(38.5) + ly) + px(4) * (1 - K), K * (lx * sa + lz * ca)];
    return { g, marks: { lamp: w(-0.22, px(44.2), 0), muzzle: w(1.26, px(17), 0) } };
  } };
})();
