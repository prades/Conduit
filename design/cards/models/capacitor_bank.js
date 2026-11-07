// CAPACITOR BANK (Series 2, Technician, Refined: −14% ability cooldown; docs/SERIES-2.md, drafted look: "a block of capacitors with a charge gauge"): six tall capacitors in two rows (gunmetal
// cans with yellow bands and ice-blue lit tops) on a dark block, copper bus bars across their terminals, and a charge gauge on the block's face: a row of ice-blue segments, most of them lit.
// The Technicians' look: design/cards/models/_tech.js. A PROPOSED look, for the owner's approval.
(function () {
  const { std, at, yellow, gun, dark, steel, charge, chargeDim } = TECH;
  const copper = std('#c0703c', 1, 0.28), off = std('#1d3440', 0.3, 0.5);
  ITEMS.capacitor_bank = { exposure: 1.0, az: 0.5, el: 0.35, build() {
    const g = G(), P = G(); g.add(P);
    P.add(at(cbox(0.64, 0.14, 0.4, 0.03, dark), 0, -0.2, 0));
    const tops = [];
    for (const z of [-0.08, 0.08]) for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.19; P.add(at(cyl(0.075, 0.075, 0.32, gun, 32), x, 0.03, z)); P.add(at(cyl(0.077, 0.077, 0.04, yellow, 32), x, -0.06, z));
      P.add(at(cyl(0.06, 0.06, 0.012, charge, 28), x, 0.195, z)); for (const dx of [-0.03, 0.03]) P.add(at(cyl(0.01, 0.01, 0.04, steel, 10), x + dx, 0.215, z)); tops.push([x, z]);
    }
    for (const z of [-0.08, 0.08]) for (const dx of [-0.03, 0.03]) P.add(at(cbox(0.44, 0.012, 0.02, 0.003, copper), dx, 0.235, z));   // the bus bars
    // the gauge on the front face: 8 segments, 6 lit
    P.add(at(cbox(0.44, 0.07, 0.01, 0.006, std('#0f1418', 0.4, 0.5)), 0, -0.2, 0.205));
    for (let k = 0; k < 8; k++) P.add(at(cbox(0.042, 0.042, 0.008, 0.004, k < 6 ? (k > 4 ? chargeDim : charge) : off), -0.18 + k * 0.051, -0.2, 0.212));
    return { g };
  } };
})();
