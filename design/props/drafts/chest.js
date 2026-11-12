// DRAFT (2026-11-12), for the owner; not baked into the game. The owner: "Also would like to create a default chest that players can find booster packs and other miscellaneous items within."
// Three looks for the default chest, each shut and open, one tile each (front on +z, as a W >= L prop's), built from the facility's style kit (design/props/models/_style.js):
//   chest_a   SUPPLY CHEST  the classic chest shape: a domed lid on a box, pale laminate, steel corners, amber bands, a green lamp on its latch while it is full
//   chest_b   FIELD CASE    a rugged hard case: two shells, rubber corners, two latches, a handle on top, a cyan seam
//   chest_c   HEX CACHE     a squat six-sided cache in the hazard flasks' and THE CORE's hex language, its lid lifting off on a violet light
// `_open`: the lid open, a light inside, a booster pack standing in it and an item or two beside it. Baked only by design/props/drafts/bake_draft.js (a copy of the baker in a scratch folder).
{
  const ROT = PI / 12, FACE = PI / 4;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const mat = STY.mat;
  const amber = STY.std('#f2b13a', 0.55, 0.32), amberDk = STY.std('#b07a1a', 0.5, 0.4), inside = STY.std('#10141a', 0.2, 0.8);
  // a booster pack: a foil packet, its face a gradient with a diamond on it, a crimped silver top
  const packTex = (a, b) => { const c = document.createElement('canvas'); c.width = 64; c.height = 96; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 64, 96); gr.addColorStop(0, a); gr.addColorStop(1, b);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 96); g.fillStyle = '#c9d4de'; g.fillRect(0, 0, 64, 9); g.fillRect(0, 88, 64, 8); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(32, 26); g.lineTo(48, 48); g.lineTo(32, 70); g.lineTo(16, 48); g.closePath(); g.fill();
    g.fillStyle = '#f2b13a'; g.beginPath(); g.moveTo(32, 36); g.lineTo(41, 48); g.lineTo(32, 60); g.lineTo(23, 48); g.closePath(); g.fill(); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; };
  const packMats = (a, b) => { const side = STY.std('#c9d4de', 0.6, 0.3), face = new T.MeshStandardMaterial({ map: packTex(a, b), metalness: 0.35, roughness: 0.3, emissive: STY.col('#3a2a6a'), emissiveIntensity: 0.25 }); return [side, side, side, side, face, side]; };
  const pack = (a, b) => new T.Mesh(new T.BoxGeometry(0.2, px(16), 0.025), packMats(a || '#9a5cff', b || '#3a7bff'));
  const ammo = () => { const g = G(); g.add(at(cbox(0.16, px(5), 0.1, 0.01, STY.std('#c98a4a', 0.2, 0.6)), 0, px(2.5), 0)); g.add(at(cbox(0.165, px(1.2), 0.105, 0.003, mat.graphite), 0, px(3.4), 0)); return g; };
  const vial = (hex) => { const g = G(); g.add(at(cyl(0.035, 0.035, px(9), STY.glow(hex || '#43e0a8', 0.85), 12), 0, px(4.5), 0)); g.add(at(cyl(0.04, 0.04, px(2), mat.steel, 12), 0, px(9.5), 0)); return g; };
  const sparkle = (g, pts) => { for (const [x, y, z, r] of pts) g.add(at(new T.Mesh(new T.SphereGeometry(r || 0.018, 8, 6), STY.glow('#fff4c8', 1.2)), x, px(y), z)); };
  const lightIn = (w, d, y, hex) => { const m = new T.Mesh(new T.PlaneGeometry(w, d), STY.glow(hex || '#ffd98a', 0.8)); m.rotation.x = -PI / 2; return at(m, 0, px(y), 0); };

  // ── A · SUPPLY CHEST ──
  function chestA(open) {
    const g = G(), W = 0.84, D = 0.54, TOP = 18;
    g.add(at(cbox(0.9, px(3), 0.6, 0.012, mat.graphite), 0, px(1.5), 0));                       // the plinth
    g.add(at(cbox(W, px(TOP - 3), D, 0.025, mat.laminate), 0, px(3 + (TOP - 3) / 2), 0));        // the body
    g.add(at(cbox(W * 0.72, px(8), 0.01, 0.003, mat.laminateDk), 0, px(9.5), D / 2 + 0.002));      // a panel on its front
    g.add(at(cbox(0.012, px(8), D * 0.7, 0.003, mat.laminateDk), W / 2 + 0.002, px(9.5), 0));      // and on its side
    for (const [x, z] of [[W / 2, D / 2], [W / 2, -D / 2], [-W / 2, D / 2]]) g.add(at(cbox(0.07, px(TOP - 2), 0.07, 0.012, mat.steelDk), x * 0.97, px(2 + (TOP - 2) / 2), z * 0.97));   // steel corners
    g.add(at(cbox(W + 0.02, px(1.6), D + 0.02, 0.004, amber), 0, px(TOP - 0.8), 0));              // the amber band at the seam
    g.add(at(cbox(W * 0.9, px(0.7), 0.006, 0.001, STY.glow('#ffcf6a', 0.9)), 0, px(TOP - 2.1), D / 2 + 0.004)); g.add(at(cbox(0.006, px(0.7), D * 0.8, 0.001, STY.glow('#ffcf6a', 0.9)), W / 2 + 0.004, px(TOP - 2.1), 0));   // a gold light under it
    // the side handle (+x)
    g.add(at(cbox(0.03, px(2.4), 0.24, 0.008, mat.steel), W / 2 + 0.035, px(12), 0)); for (const z of [-0.1, 0.1]) g.add(at(cbox(0.04, px(2), 0.03, 0.006, mat.steelDk), W / 2 + 0.018, px(12), z));
    // the lid: a dome along x, on a hinge at the back of the body's top
    const lid = G(), r = D / 2, sy = 0.55;
    const dome = new T.Mesh(new T.CylinderGeometry(r, r, W, 28, 1, false, 0, PI), mat.laminate); dome.rotation.z = PI / 2; dome.scale.set(1, 1, 1); const dg = G(); dg.add(dome); dg.scale.y = sy; lid.add(at(dg, 0, 0, r));
    lid.add(at(cbox(W - 0.01, 0.006, D - 0.01, 0.002, inside), 0, 0.003, r));                    // its underside
    for (const x of [-W * 0.36, W * 0.36]) { const b = new T.Mesh(new T.CylinderGeometry(r + 0.012, r + 0.012, 0.06, 28, 1, false, 0, PI), amber); b.rotation.z = PI / 2; const bg = G(); bg.add(b); bg.scale.y = sy; lid.add(at(bg, x, 0, r)); }
    // the latch on the front, its lamp green while the chest is full
    const latch = G(); latch.add(at(cbox(0.15, px(7), 0.035, 0.008, mat.graphite), 0, 0, 0)); latch.add(at(new T.Mesh(new T.SphereGeometry(0.026, 12, 8), open ? mat.steelDk : STY.glow('#43e0a8', 1.2)), 0, px(1), 0.022));
    g.add(at(latch, 0, px(TOP - 1.5), D / 2 + 0.02));
    const pivot = G(); pivot.add(lid); pivot.position.set(0, px(TOP), -D / 2);
    if (open) pivot.rotation.x = -1.85;
    g.add(pivot);
    if (open) {
      g.add(lightIn(W - 0.08, D - 0.08, TOP - 1.2));
      const p = pack(); p.rotation.set(-0.32, 0.35, 0.05); g.add(at(p, -0.12, px(TOP + 2), 0.02));
      const p2 = pack('#31e8ff', '#3a7bff'); p2.rotation.set(-0.42, -0.2, -0.12); g.add(at(p2, 0.1, px(TOP + 0.5), -0.04));
      g.add(at(ammo(), 0.27, px(TOP - 3), 0.1)); g.add(at(vial('#43e0a8'), -0.3, px(TOP - 6), 0.12));
      sparkle(g, [[-0.05, TOP + 13, 0.12, 0.02], [0.22, TOP + 9, 0.02, 0.016], [-0.28, TOP + 8, -0.05, 0.014]]);
    }
    return { g, marks: { lamp: [0, px(TOP - 0.5), D / 2 + 0.045] } };
  }

  // ── B · FIELD CASE ──
  function chestB(open) {
    const g = G(), W = 0.9, D = 0.58, LO = 10, HI = 7;
    const shellLo = STY.std('#a9c4cc', 0.08, 0.5), shellHi = mat.laminate;
    g.add(at(cbox(W, px(LO), D, 0.05, shellLo), 0, px(LO / 2), 0));
    for (let i = 0; i < 6; i++) g.add(at(cbox(0.022, px(LO - 3), 0.012, 0.004, STY.std('#8fb0ba', 0.1, 0.55)), -0.3 + i * 0.12, px(LO / 2), D / 2 + 0.004));   // ribs on the front
    for (let i = 0; i < 3; i++) g.add(at(cbox(0.012, px(LO - 3), 0.022, 0.004, STY.std('#8fb0ba', 0.1, 0.55)), W / 2 + 0.004, px(LO / 2), -0.14 + i * 0.14));
    const CORN = [[W / 2, D / 2], [W / 2, -D / 2], [-W / 2, D / 2]];
    for (const [x, z] of CORN) g.add(at(cbox(0.085, px(LO + 0.3), 0.085, 0.025, mat.rubber), x * 0.96, px((LO + 0.3) / 2), z * 0.96));   // rubber corners (the body's half)
    // the seam's light
    g.add(at(cbox(W * 0.86, px(0.9), 0.006, 0.001, STY.glow('#31e8ff', 0.75)), 0, px(LO), D / 2 + 0.006)); g.add(at(cbox(0.006, px(0.9), D * 0.8, 0.001, STY.glow('#31e8ff', 0.75)), W / 2 + 0.006, px(LO), 0));
    // the lid on its hinge at the back
    const lid = G();
    lid.add(at(cbox(W, px(HI), D, 0.05, shellHi), 0, px(HI / 2), D / 2));
    for (const [x, z] of CORN) lid.add(at(cbox(0.085, px(HI + 0.3), 0.085, 0.025, mat.rubber), x * 0.96, px((HI + 0.3) / 2), z * 0.96 + D / 2));   // (and the lid's)
    lid.add(at(cbox(0.3, px(2.6), 0.06, 0.02, mat.graphite), 0, px(HI + 1.6), D / 2)); for (const x of [-0.13, 0.13]) lid.add(at(cbox(0.04, px(2), 0.05, 0.01, mat.graphite), x, px(HI + 0.6), D / 2));   // the handle
    lid.add(at(cbox(0.2, px(2.6), 0.006, 0.001, amber), 0, px(HI / 2), D + 0.004));               // an amber label
    lid.add(at(cbox(W - 0.04, 0.006, D - 0.04, 0.002, STY.std('#1c2027', 0.1, 0.95)), 0, 0.004, D / 2));   // its foam
    const pivot = G(); pivot.add(lid); pivot.position.set(0, px(LO), -D / 2);
    if (open) pivot.rotation.x = -1.75;
    g.add(pivot);
    // the two latches across the seam (shut) or hanging open
    for (const x of [-0.24, 0.24]) { const l = at(cbox(0.1, px(7), 0.04, 0.012, mat.graphite), x, px(LO + (open ? -2.5 : 0)), D / 2 + 0.022); if (open) l.rotation.x = 0.5; g.add(l); g.add(at(cbox(0.06, px(1.2), 0.012, 0.003, mat.steel), x, px(LO + (open ? -4.5 : 2)), D / 2 + 0.045)); }
    g.add(at(new T.Mesh(new T.SphereGeometry(0.022, 12, 8), open ? mat.steelDk : STY.glow('#43e0a8', 1.2)), 0, px(LO + 2.5), D / 2 + 0.03));   // the lamp: full
    if (open) {
      g.add(at(cbox(W - 0.08, px(1), D - 0.08, 0.004, STY.std('#1c2027', 0.1, 0.95)), 0, px(LO - 1.5), 0));   // the foam bed
      g.add(lightIn(W - 0.14, D - 0.14, LO - 0.9, '#9fe8ff'));
      const p = pack(); p.rotation.set(-1.25, 0, 0.12); g.add(at(p, -0.16, px(LO + 0.4), 0.02));
      g.add(at(ammo(), 0.13, px(LO - 1.2), -0.08)); const v = vial('#ff6a4a'); v.rotation.z = PI / 2; g.add(at(v, 0.2, px(LO + 0.2), 0.12));
      sparkle(g, [[-0.12, LO + 9, 0.1, 0.018], [0.16, LO + 6, 0, 0.014]]);
    }
    return { g, marks: { lamp: [0, px(LO + 2.5), D / 2 + 0.05] } };
  }

  // ── C · HEX CACHE ──
  function chestC(open) {
    const g = G(), R = 0.4, BODY = 14;
    const hex = (rt, rb, y0, y1, m) => { const c = new T.Mesh(new T.CylinderGeometry(rt, rb, px(y1 - y0), 6), m); c.rotation.y = ROT; return at(c, 0, px((y0 + y1) / 2), 0); };
    g.add(hex(R + 0.03, R + 0.05, 0, 4, mat.graphite));                                         // the foot
    g.add(hex(R, R + 0.02, 4, 4 + BODY, mat.laminate));                                          // the body
    // teal panels on the three faces the camera sees, each with an amber diamond on the middle one
    for (let i = 0; i < 3; i++) { const a = FACE + (i - 1) * PI / 3, pl = cbox(0.3, px(BODY - 5), 0.01, 0.003, i === 1 ? mat.tealDk : mat.teal); pl.rotation.y = a; const rr = R * Math.cos(PI / 6) + 0.012; g.add(at(pl, Math.sin(a) * rr, px(4 + BODY / 2), Math.cos(a) * rr)); }
    { const d = cbox(0.07, 0.07, 0.01, 0.002, amber); d.rotation.set(0, FACE, PI / 4); const rr = R * Math.cos(PI / 6) + 0.02; g.add(at(d, Math.sin(FACE) * rr, px(4 + BODY / 2), Math.cos(FACE) * rr)); }
    g.add(hex(R + 0.025, R + 0.025, 4 + BODY, 5.4 + BODY, amber));                               // the amber rim
    // the lid: a six-sided cap, a violet ring of light on top; open, it hovers above the cache on its light
    const lid = G(); const lh = (rt, rb, y0, y1, m) => { const c = new T.Mesh(new T.CylinderGeometry(rt, rb, px(y1 - y0), 6), m); c.rotation.y = ROT; return at(c, 0, px((y0 + y1) / 2), 0); };
    lid.add(lh(R * 0.72, R + 0.01, 0, 6, mat.laminate)); lid.add(lh(R * 0.5, R * 0.56, 6, 7.4, STY.glow('#b57bff', 1.1))); lid.add(lh(R * 0.36, R * 0.4, 7.4, 8.2, mat.steelDk));
    const lidY = 5.4 + BODY; lid.position.set(open ? -0.08 : 0, px(open ? lidY + 22 : lidY), open ? -0.12 : 0); if (open) lid.rotation.set(-0.45, 0.3, 0.12);
    g.add(lid);
    if (open) {
      g.add(lightIn(R * 1.5, R * 1.5, lidY - 1, '#d9b8ff'));
      const beam = new T.Mesh(new T.CylinderGeometry(R * 0.62, R * 0.82, px(18), 6, 1, true), new T.MeshBasicMaterial({ color: STY.col('#b57bff'), transparent: true, opacity: 0.32, side: T.DoubleSide, depthWrite: false, toneMapped: false })); beam.rotation.y = ROT; g.add(at(beam, 0, px(lidY + 9), 0));
      const p = pack(); p.rotation.set(0, 0.55, 0.06); g.add(at(p, 0, px(lidY + 4.5), 0.02));
      g.add(at(ammo(), 0.17, px(lidY - 3.5), 0.08)); g.add(at(vial('#43e0a8'), -0.18, px(lidY - 7), 0.1));
      sparkle(g, [[0.12, lidY + 11, 0.1, 0.018], [-0.16, lidY + 7, 0.05, 0.014], [0.05, lidY + 15, -0.08, 0.012]]);
    } else g.add(at(new T.Mesh(new T.SphereGeometry(0.026, 12, 8), STY.glow('#43e0a8', 1.2)), Math.sin(FACE) * (R * Math.cos(PI / 6) + 0.025), px(4 + BODY - 2.5), Math.cos(FACE) * (R * Math.cos(PI / 6) + 0.025)));
    return { g, marks: {} };
  }

  PROPS.chest = { variants: ['chest_a', 'chest_a_open', 'chest_b', 'chest_b_open', 'chest_c', 'chest_c_open'], canvas: [260, 300], exposure: 1.0, build(name) {
    const open = /_open$/.test(name), k = name.split('_')[1];
    return k === 'a' ? chestA(open) : k === 'b' ? chestB(open) : chestC(open);
  } };
}
