// THE ITEMS ON THE GROUND (build 2026-11-09zz; the owner, 2026-11-10: "We need to redesign the items, like the scrap metal design on the ground"; of three ways for scrap, "A A heap"). Each pickup is drawn as
// the thing itself, small on the floor, instead of the white supply case (js/facilitytutorial.js _fpDrawPickup; the case stays for an item with no model here). Variants, named by the item's id (js/inventory.js):
//   scrap_metal    a heap: bent plates (steel, rust, a scrap of the facility's teal), one leaning up, a short pipe across them, a gear and three nuts
//   ammo_pack      a paper sleeve with an orange band, its top torn open on a row of brass rounds
//   power_cell     an upright capsule: steel caps, a glass middle with a glowing cyan core, two steel rings
//   power_module   a chunky dark module with an amber lit face, two brass contacts, a handle and a hazard-striped side
//   toxic_sample, sewer_sample   a capped vial in a little two-ring stand, its liquid glowing green or violet
//   repair_kit     a small grey hard case with a carry handle and a green plus on its lid (build 2026-11-11e, docs/PLAYER-COMBAT.md; provisional)
//   and, in the same style, the class kits and the fuel (the same build): fuel_cell a square glass-and-steel canister glowing green; flare two red security flares lying crossed; mech_leg a spider mech's leg
//   lying on the floor, jointed twice, with a cyan strip; mech_core a hexagonal housing, its cyan heart lit; mutagen_sample a stoppered flask of cloudy violet (its pack icon's shape)
// Footprints well inside a tile (about half), 6 to 26 px high. Everything is in a block: the helpers must not collide with the other families'.
{
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const rot = (m, x, y, z) => { m.rotation.set(x || 0, y || 0, z || 0); return m; };
  const steel = STY.std('#9aa4b4', 0.85, 0.35), steelDk = STY.std('#4a525e', 0.8, 0.42), rust = STY.std('#8a5a3a', 0.4, 0.7), teal = STY.std('#4f9aa0', 0.3, 0.45), rubber = STY.mat.rubber;
  const orange = STY.std('#ffb070', 0.25, 0.55), paper = STY.std('#d8c49a', 0.05, 0.8), brass = STY.std('#d9a441', 0.9, 0.3), amber = STY.glow('#ffb347', 1.1);
  const glass = new T.MeshStandardMaterial({ color: STY.col('#e4f3fa'), transparent: true, opacity: 0.3, metalness: 0.1, roughness: 0.03, depthWrite: false, envMapIntensity: 2.0, side: T.DoubleSide });
  const plate = (w, d, mat, t) => cbox(w, px(t || 1.4), d, 0.004, mat);
  // a small gear: a flat disc with a hole and eight teeth
  const gear = (r, mat) => { const g = G(); g.add(cyl(r, r, px(1.6), mat, 20)); for (let i = 0; i < 8; i++) { const a = i * PI / 4, t = cbox(r * 0.42, px(1.6), r * 0.3, 0.002, mat); t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); t.rotation.y = -a; g.add(t); } g.add(at(cyl(r * 0.35, r * 0.35, px(1.8), steelDk, 12), 0, 0.001, 0)); return g; };
  const nut = (mat) => new T.Mesh(new T.CylinderGeometry(0.03, 0.03, px(1.6), 6), mat);

  const B = {
    // A HEAP: bent plates lying and leaning, a short pipe across them, a gear and a few nuts; steel, rust and a scrap of the facility's teal paint
    scrap_metal() { const g = G();
      g.add(at(rot(plate(0.34, 0.22, steelDk), 0, 0.3, 0), -0.02, px(0.7), 0.02)); g.add(at(rot(plate(0.28, 0.2, rust), 0.08, -0.5, 0.05), 0.08, px(2), -0.06)); g.add(at(rot(plate(0.26, 0.16, teal), -0.1, 1.1, 0.12), -0.1, px(2.6), 0.06));
      g.add(at(rot(plate(0.22, 0.18, steel), 0.9, 0.4, 0), 0.02, px(6), -0.02));   // one leaning up
      g.add(at(rot(cyl(0.03, 0.03, 0.36, steel, 12), 0, 0.6, PI / 2), 0.02, px(5.2), 0.08)); g.add(at(rot(cyl(0.034, 0.034, 0.03, steelDk, 12), 0, 0.6, PI / 2), 0.17, px(5.2), -0.02));
      g.add(at(rot(gear(0.07, steel), 0.25, 0, 0.2), -0.13, px(4.5), -0.08));
      for (const [x, z] of [[0.17, 0.12], [-0.18, 0.15], [0.12, -0.16]]) g.add(at(nut(steelDk), x, px(0.9), z));
      return g; },
    // AN AMMO PACK: a paper sleeve with an orange band, its top torn open on a row of brass rounds
    ammo_pack() { const g = G(), s = G(); s.rotation.y = 0.3; g.add(s);
      s.add(at(cbox(0.34, px(9), 0.17, 0.01, paper), 0, px(4.5), 0)); s.add(at(cbox(0.345, px(2.6), 0.175, 0.004, orange), 0, px(5), 0));
      for (let i = 0; i < 6; i++) { const x = -0.13 + i * 0.052; s.add(at(cyl(0.017, 0.017, px(5), brass, 12), x, px(10.5), 0.02)); s.add(at(new T.Mesh(new T.ConeGeometry(0.017, px(3), 12), STY.std('#b07a3a', 0.85, 0.35)), x, px(14.4), 0.02)); }
      s.add(at(rot(cbox(0.2, 0.003, 0.08, 0.001, paper), 0.9, 0, 0.15), 0.08, px(10), -0.08));   // the torn flap
      return g; },
    // A POWER CELL: an upright capsule, steel caps, a glass middle with a glowing cyan core and a ring of lights
    power_cell() { const g = G();
      g.add(at(cyl(0.085, 0.095, px(4), steelDk, 20), 0, px(2), 0)); g.add(at(cyl(0.06, 0.06, px(13), STY.glow('#31e8ff', 1.15), 20), 0, px(10.5), 0)); g.add(at(cyl(0.075, 0.075, px(14), glass, 20), 0, px(10.5), 0));
      g.add(at(cyl(0.085, 0.08, px(4), steelDk, 20), 0, px(19.5), 0)); g.add(at(cyl(0.03, 0.03, px(3), steel, 10), 0, px(23), 0));
      for (const y of [7, 14]) { const r = torus(0.078, 0.008, steel, 20); r.rotation.x = PI / 2; g.add(at(r, 0, px(y), 0)); }
      return g; },
    // THE POWER MODULE: a chunky dark module with an amber lit face, two contact prongs, a handle and a hazard-striped side
    power_module() { const g = G(), s = G(); s.rotation.y = 0.25; g.add(s);
      s.add(at(cbox(0.32, px(12), 0.22, 0.02, steelDk), 0, px(6), 0)); s.add(at(cbox(0.2, px(6), 0.01, 0.004, amber), 0, px(6.5), 0.111));
      s.add(at(cbox(0.012, px(12), 0.2, 0.002, STY.hazard(1, 3)), 0.161, px(6), 0));
      for (const x of [-0.06, 0.06]) s.add(at(cbox(0.03, px(4), 0.03, 0.004, brass), x, px(14), 0));
      s.add(at(cbox(0.16, px(1.4), 0.03, 0.006, steel), 0, px(16.5), -0.06)); for (const x of [-0.08, 0.08]) s.add(at(cbox(0.02, px(4), 0.03, 0.004, steel), x, px(14.5), -0.06));
      return g; },
    // A FUEL CELL: a square canister, steel caps top and bottom, four corner posts, a glass body with the green fuel glowing in it (square, where the power cell is round)
    fuel_cell() { const g = G(), s = G(); s.rotation.y = 0.35; g.add(s);
      s.add(at(cbox(0.2, px(3), 0.2, 0.01, steelDk), 0, px(1.5), 0)); s.add(at(cbox(0.13, px(11), 0.13, 0.004, STY.glow('#5dffb0', 1.05)), 0, px(8.5), 0)); s.add(at(cbox(0.16, px(13), 0.16, 0.004, glass), 0, px(9.5), 0));
      s.add(at(cbox(0.2, px(3), 0.2, 0.01, steelDk), 0, px(17.5), 0)); s.add(at(cyl(0.035, 0.035, px(2.5), steel, 10), 0, px(20), 0));
      for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) s.add(at(cbox(0.022, px(13), 0.022, 0.003, steel), x * 0.085, px(9.5), z * 0.085));
      return g; },
    // FLARES: two security-issue flares lying crossed on the floor, red casings with a cream band, dark caps, a striker end
    flare() { const g = G();
      const stick = (y, ry) => { const s = G(); s.rotation.y = ry; s.add(at(rot(cyl(0.028, 0.028, 0.34, STY.std('#c8321e', 0.2, 0.5), 14), 0, 0, PI / 2), 0, 0, 0)); s.add(at(rot(cyl(0.029, 0.029, 0.05, STY.std('#f4e2c0', 0.05, 0.7), 14), 0, 0, PI / 2), 0.04, 0, 0));
        s.add(at(rot(cyl(0.03, 0.03, 0.04, STY.std('#2a2a30', 0.5, 0.5), 14), 0, 0, PI / 2), 0.18, 0, 0)); s.add(at(rot(cyl(0.022, 0.03, 0.03, STY.std('#3a2a20', 0.2, 0.8), 14), 0, 0, PI / 2), -0.185, 0, 0)); s.position.y = y; return s; };
      g.add(stick(0.028, 0.35)); g.add(stick(0.075, -0.55));
      return g; },
    // A MECH LEG: a spider mech's leg lying on the floor, jointed twice: the hip's socket, the long thigh, the knee, the shin and its claw; titanium with a cyan strip along it
    mech_leg() { const g = G(), s = G(); s.rotation.y = 0.5; g.add(s); const ti = STY.std('#b8c2cc', 0.85, 0.3), stripe = STY.glow('#31e8ff', 1.0);
      const seg = (x0, z0, x1, z1, r) => { const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), a = Math.atan2(dz, dx), m = G(); m.position.set((x0 + x1) / 2, r, (z0 + z1) / 2); m.rotation.y = -a;
        m.add(rot(cyl(r, r * 0.85, L, ti, 12), 0, 0, PI / 2)); m.add(at(cbox(L * 0.8, 0.008, r * 0.5, 0.002, stripe), 0, r * 0.98, 0)); return m; };
      s.add(seg(-0.2, -0.04, 0.02, 0.05, 0.034)); s.add(seg(0.02, 0.05, 0.22, -0.06, 0.026));
      s.add(at(cyl(0.045, 0.045, px(2.4), steelDk, 16), -0.21, px(1.2) + 0.012, -0.045)); s.add(at(new T.Mesh(new T.SphereGeometry(0.04, 14, 10), steelDk), 0.02, 0.036, 0.05));
      s.add(at(rot(new T.Mesh(new T.ConeGeometry(0.024, 0.07, 10), steelDk), 0, 0, -PI / 2), 0.25, 0.022, -0.075));
      return g; },
    // THE MECH CORE: a hexagonal housing lying flat, dark teal, steel rim and bolts, its cyan heart lit on top in a ring
    mech_core() { const g = G(), s = G(); s.rotation.y = 0.2; g.add(s);
      s.add(at(cyl(0.16, 0.17, px(7), STY.std('#16404a', 0.6, 0.4), 6), 0, px(3.5), 0)); s.add(at(cyl(0.165, 0.165, px(1.2), steel, 6), 0, px(7.2), 0));
      s.add(at(cyl(0.075, 0.075, px(2), STY.glow('#31e8ff', 1.2), 24), 0, px(8), 0)); const r = torus(0.095, 0.01, steel, 24); r.rotation.x = PI / 2; s.add(at(r, 0, px(8.4), 0));
      for (let i = 0; i < 6; i++) { const a = i * PI / 3 + PI / 6; s.add(at(cyl(0.012, 0.012, px(1.6), steelDk, 6), Math.cos(a) * 0.13, px(7.8), Math.sin(a) * 0.13)); }
      return g; },
    // A MUTAGEN SAMPLE: a stoppered flask (its pack icon's shape), wide at the foot, the violet stuff cloudy and glowing in it, two bubbles
    mutagen_sample() { const g = G(), vio = '#c06bff';
      g.add(at(new T.Mesh(new T.CylinderGeometry(0.03, 0.1, px(11), 20), STY.glow(vio, 1.0)), 0, px(5.5), 0)); g.add(at(new T.Mesh(new T.CylinderGeometry(0.04, 0.12, px(14), 20, 1, true), glass), 0, px(7), 0));
      g.add(at(cyl(0.04, 0.04, px(6), glass, 16), 0, px(16), 0)); g.add(at(cyl(0.045, 0.04, px(4), STY.std('#3a2e26', 0.1, 0.8), 14), 0, px(20), 0));
      for (const [x, y, z, r] of [[0.03, 9, 0.02, 0.016], [-0.02, 6, -0.03, 0.012]]) g.add(at(new T.Mesh(new T.SphereGeometry(r, 10, 8), STY.glow('#f0dcff', 1.1)), x, px(y), z));
      return g; },
  };
  // A SAMPLE VIAL in a little two-ring stand, its liquid glowing in the item's colour, a dark cap with a band of it
  const vial = (hex) => () => { const g = G(), V = G(); V.rotation.z = 0.08; g.add(V);
    V.add(at(cyl(0.035, 0.035, px(14), STY.glow(hex, 1.05), 16), 0, px(8), 0)); V.add(at(cyl(0.045, 0.045, px(17), glass, 16), 0, px(9), 0));
    V.add(at(cyl(0.05, 0.05, px(4), STY.std('#2c333c', 0.6, 0.45), 16), 0, px(19), 0)); V.add(at(cyl(0.051, 0.051, px(1.2), STY.glow(hex, 0.9), 16), 0, px(18), 0));
    for (const y of [1.5, 10]) { const r = torus(0.06, 0.008, steelDk, 20); r.rotation.x = PI / 2; g.add(at(r, 0, px(y), 0)); }
    for (let i = 0; i < 3; i++) { const a = i * TAU / 3; g.add(at(cyl(0.006, 0.006, px(10), steelDk, 4), Math.cos(a) * 0.06, px(5.5), Math.sin(a) * 0.06)); }
    return g; };
  B.toxic_sample = vial('#8cff5a'); B.sewer_sample = vial('#c77dff');
  // A REPAIR KIT (docs/PLAYER-COMBAT.md, step 1, build 2026-11-11e; the look the agent's, provisional): a small grey hard case lying a little turned, a carry handle on top, a raised green plus on its lid
  // that glows like the HUD's bars, two latches on its front
  B.repair_kit = () => { const g = G(), s = G(); s.rotation.y = -0.3; g.add(s); const green = STY.glow('#7dffa8', 1.1), shell = STY.std('#5a6270', 0.55, 0.45);
    s.add(at(cbox(0.3, px(8), 0.2, 0.02, shell), 0, px(4), 0)); s.add(at(cbox(0.305, px(1.4), 0.205, 0.004, steelDk), 0, px(5.6), 0));   // the case and the seam of its lid
    s.add(at(cbox(0.13, px(1.2), 0.035, 0.004, green), 0, px(8.6), 0)); s.add(at(cbox(0.035, px(1.2), 0.13, 0.004, green), 0, px(8.6), 0));   // the plus
    s.add(at(cbox(0.12, px(1.2), 0.022, 0.004, steelDk), 0, px(11.2), -0.07)); for (const x of [-0.055, 0.055]) s.add(at(cbox(0.018, px(3), 0.022, 0.003, steelDk), x, px(9.6), -0.07));   // the handle
    for (const x of [-0.09, 0.09]) s.add(at(cbox(0.03, px(2.2), 0.012, 0.003, steel), x, px(5.2), 0.104));   // the latches
    return g; };

  PROPS.pickups = { variants: Object.keys(B), canvas: [200, 200], exposure: 1.0, build(name) { return { g: B[name](), marks: {} }; } };
}
