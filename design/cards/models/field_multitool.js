// FIELD MULTITOOL (Series 2, Technician, Precision: −10% ability cooldown and +10% maximum HP; docs/SERIES-2.md, drafted look: "a folding multitool with glowing bits"): a folding multitool,
// its two yellow-and-rubber handle scales opened out, its tools fanned from the pivot (a blade, a screwdriver, a saw, a probe) with ice-blue lit bits at their tips, a brass pivot.
// The Technicians' look: design/cards/models/_tech.js. A PROPOSED look, for the owner's approval.
(function () {
  const { at, yellow, dark, steel, brass, rubber, charge, white } = TECH;
  ITEMS.field_multitool = { exposure: 1.0, az: 0.3, el: 0.5, build() {
    const g = G(), P = G(); g.add(P);
    // the handle: two scales from the pivot, the body of the tool
    const handle = G(); handle.rotation.z = -0.25; P.add(handle);
    for (const z of [-0.035, 0.035]) { handle.add(at(cbox(0.5, 0.09, 0.03, 0.02, yellow), -0.25, 0, z)); handle.add(at(cbox(0.3, 0.07, 0.035, 0.015, rubber), -0.3, 0, z)); }
    handle.add(at(cbox(0.48, 0.08, 0.04, 0.01, dark), -0.25, 0, 0));
    const pv = cyl(0.04, 0.04, 0.11, brass, 20); pv.rotation.x = PI / 2; P.add(pv);
    // the tools, fanned
    const tool = (len, ang, tip) => { const t = G(); t.rotation.z = ang; t.add(at(cbox(len, 0.03, 0.012, 0.006, steel), len / 2, 0, 0)); t.add(tip(len)); P.add(t); };
    tool(0.42, 0.25, L => { const g2 = G(); const b = new T.Mesh(new T.ConeGeometry(0.03, 0.12, 3), steel); b.rotation.z = -PI / 2; g2.add(at(b, L + 0.05, 0, 0)); g2.add(at(sphere(0.012, charge, 10), L + 0.1, 0, 0)); return g2; });   // the blade
    tool(0.36, 0.7, L => { const g2 = G(); g2.add(at(cbox(0.08, 0.016, 0.01, 0.003, steel), L + 0.04, 0, 0)); g2.add(at(cbox(0.02, 0.022, 0.014, 0.003, charge), L + 0.085, 0, 0)); return g2; });   // the screwdriver
    tool(0.3, 1.1, L => { const g2 = G(); for (let k = 0; k < 6; k++) { const s = new T.Mesh(new T.ConeGeometry(0.008, 0.02, 4), steel); s.rotation.z = PI; g2.add(at(s, L * 0.4 + k * 0.03, -0.022, 0)); } g2.add(at(sphere(0.011, charge, 10), L + 0.01, 0, 0)); return g2; });   // the saw
    tool(0.26, 1.5, L => { const g2 = G(); const p = cyl(0.006, 0.006, 0.09, steel, 8); p.rotation.z = PI / 2; g2.add(at(p, L + 0.045, 0, 0)); g2.add(at(sphere(0.014, white, 10), L + 0.095, 0, 0)); g2.add(at(sphere(0.024, charge, 10), L + 0.095, 0, 0)).children; return g2; });   // the probe
    P.rotation.set(-0.2, 0.15, 0);
    return { g };
  } };
})();
