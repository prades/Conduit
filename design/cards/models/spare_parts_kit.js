// SPARE PARTS KIT (Series 2, Technician, Unrefined: −8% ability cooldown; docs/SERIES-2.md, drafted look: "an open tool case of parts"): a safety-yellow tool case with its lid swung open, a
// gunmetal tray of compartments full of parts (bolts, nuts, a gear, a spring, a fuse lit ice-blue), a small wrench laid across the top, brass latches. The Technicians' look:
// design/cards/models/_tech.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, yellow, gun, dark, steel, brass, charge } = TECH;
  ITEMS.spare_parts_kit = { exposure: 1.0, az: 0.5, el: 0.55, build() {
    const g = G(), P = G(); g.add(P);
    const W = 0.7, D = 0.42, H = 0.18;
    P.add(at(cbox(W, H, D, 0.03, yellow), 0, 0, 0));
    P.add(at(cbox(W - 0.06, 0.02, D - 0.06, 0.005, dark), 0, H / 2 - 0.005, 0));   // the inside
    // the tray's walls (compartments)
    for (const x of [-0.12, 0.1]) P.add(at(cbox(0.012, 0.08, D - 0.08, 0.003, gun), x, H / 2 + 0.02, 0));
    P.add(at(cbox(W - 0.08, 0.08, 0.012, 0.003, gun), 0, H / 2 + 0.02, 0.02));
    // the lid, swung open behind
    const lid = G(); lid.position.set(0, H / 2, -D / 2); lid.rotation.x = -1.95; lid.add(at(cbox(W, 0.05, D, 0.03, yellow), 0, 0.025, D / 2)); P.add(lid);
    for (const s of [-1, 1]) P.add(at(cbox(0.06, 0.05, 0.02, 0.006, brass), s * 0.22, 0.02, D / 2 + 0.008));
    // the parts
    const nut = (x, z) => { const n = cyl(0.026, 0.026, 0.016, steel, 6); P.add(at(n, x, H / 2 + 0.02, z)); };
    const bolt = (x, z, a) => { const b = G(); b.add(cyl(0.008, 0.008, 0.09, steel, 8)); b.add(at(cyl(0.018, 0.018, 0.014, steel, 6), 0, 0.045, 0)); b.rotation.set(PI / 2, 0, a); P.add(at(b, x, H / 2 + 0.03, z)); };
    [[-0.27, 0.1], [-0.22, 0.12], [-0.25, 0.06], [-0.2, 0.08]].forEach(([x, z]) => nut(x, z));
    bolt(-0.24, -0.08, 0.4); bolt(-0.2, -0.1, -0.3); bolt(-0.26, -0.12, 1.2);
    const gear = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.02, 14), brass); P.add(at(gear, 0.0, H / 2 + 0.03, 0.1));
    for (let k = 0; k < 14; k++) { const a = k * TAU / 14, t = cbox(0.018, 0.02, 0.018, 0.002, brass); t.rotation.y = -a; P.add(at(t, 0.07 * Math.cos(a), H / 2 + 0.03, 0.1 + 0.07 * Math.sin(a))); }
    const spring = []; for (let k = 0; k <= 40; k++) { const t = k / 40, a = t * TAU * 6; spring.push([0.0 + 0.02 * Math.cos(a), H / 2 + 0.03 + 0.02 * Math.sin(a), -0.13 + t * 0.12]); }
    P.add(tube(spring, 0.004, steel));
    const fuse = cyl(0.016, 0.016, 0.08, charge, 14); fuse.rotation.z = PI / 2; P.add(at(fuse, 0.22, H / 2 + 0.03, 0.1)); for (const s of [-1, 1]) { const c = cyl(0.018, 0.018, 0.016, brass, 14); c.rotation.z = PI / 2; P.add(at(c, 0.22 + s * 0.045, H / 2 + 0.03, 0.1)); }
    [[0.18, -0.08], [0.24, -0.12], [0.26, -0.05]].forEach(([x, z]) => nut(x, z));
    // the wrench, across the top
    const wr = G(); wr.position.set(0.02, H / 2 + 0.08, -0.02); wr.rotation.set(0, 0.5, 0);
    wr.add(cbox(0.36, 0.014, 0.03, 0.005, steel)); const jaw = new T.Mesh(new T.TorusGeometry(0.035, 0.012, 6, 20, PI * 1.4), steel); jaw.rotation.set(PI / 2, 0, -0.5); wr.add(at(jaw, 0.2, 0, 0)); P.add(wr);
    return { g };
  } };
})();
