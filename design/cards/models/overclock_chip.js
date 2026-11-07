// OVERCLOCK CHIP (Series 2, Drone, Prototype: Overclock; docs/SERIES-2.md, drafted look: "a circuit chip with heat sinks, glowing hot"): a square gunmetal chip package on a dark board with
// steel pins down its sides and glowing traces running off them, a finned heat sink on top glowing orange-hot between its fins, a white-hot core showing through a window.
// The Drones' look: design/cards/models/_drone.js. A PROPOSED look, for the owner's approval.
(function () {
  const { std, at, gun, gunDark, steel, cyan, hot, hotCore } = DRONE;
  const board = std('#1c2a24', 0.2, 0.6), trace = STY.glow('#ffb347', 1.4);
  ITEMS.overclock_chip = { exposure: 1.0, az: 0.5, el: 0.45, build() {
    const g = G(), P = G(); g.add(P);
    P.add(at(cbox(0.82, 0.04, 0.82, 0.02, board), 0, -0.1, 0));
    P.add(at(cbox(0.46, 0.08, 0.46, 0.02, gun), 0, -0.04, 0));
    for (let s = 0; s < 4; s++) for (let k = 0; k < 6; k++) {   // the pins, and a trace off each
      const t = (k - 2.5) * 0.065, a = s * PI / 2, dx = Math.cos(a), dz = Math.sin(a), px = dx * 0.25 - dz * t, pz = dz * 0.25 + dx * t;
      const pin = cbox(0.05, 0.015, 0.025, 0.004, steel); pin.rotation.y = -a; P.add(at(pin, px, -0.07, pz));
      const ex = px + dx * (0.08 + (k % 3) * 0.03), ez = pz + dz * (0.08 + (k % 3) * 0.03);
      P.add(tube([[px + dx * 0.03, -0.078, pz + dz * 0.03], [(px + ex) / 2 + dx * 0.02, -0.078, (pz + ez) / 2 + dz * 0.02], [ex, -0.078, ez]], 0.005, k % 2 ? trace : hot));
    }
    // the heat sink: a base plate and fins, glowing hot between them
    P.add(at(cbox(0.4, 0.03, 0.4, 0.01, gunDark), 0, 0.015, 0));
    for (let k = 0; k < 7; k++) { const x = (k - 3) * 0.055; P.add(at(cbox(0.016, 0.16, 0.38, 0.004, steel), x, 0.11, 0)); if (k < 6) P.add(at(cbox(0.02, 0.1, 0.34, 0.004, hot), x + 0.0275, 0.08, 0)); }
    P.add(at(cbox(0.1, 0.012, 0.1, 0.004, hotCore), 0, 0.2, 0));
    P.add(at(sphere(0.016, cyan, 10), 0.34, -0.07, 0.34));
    return { g };
  } };
})();
