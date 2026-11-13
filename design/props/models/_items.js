// THE ITEMS IN 3D (build 2026-11-13u; the owner, 2026-11-13: "I want to redo the items in the game make them have 3-D looking assets"; shown the AMMO PACK, one piece first, design/items/icon_draft.js,
// then: "Also change that item menu ..."). One model for each of the PACK's items (js/inventory.js ITEMS, in ITEM_ORDER), shared by two families: `pickups` (each on the floor, at the game's size) and
// `itemicons` (each framed to fill an icon: the PACK's tiles and stage and wherever an item is drawn, js/inventory.js invDrawIcon). Twelve keep the floor designs of build 2026-11-09zz (the owner's "A A
// heap" for the scrap; the rest the agent's), made at icon detail; six are new, each from its own lore: the healing serum, the specimen capsule, the rock, the purification module and the two potions.
// A shared file (its name starts with "_"), loaded before _style.js: so nothing is built until a family asks (ITEMS3D(id) returns a new THREE.Group, its footprint's middle at the origin, the floor at 0).
const ITEM_3D_IDS = ["ammo_pack", "repair_kit", "flare", "power_cell", "mutagen_sample", "power_module", "mech_leg", "mech_core", "scrap_metal", "fuel_cell",
                     "healing_serum", "specimen_capsule", "rock", "toxic_sample", "sewer_sample", "purification_module", "sleeping_potion", "sleeping_potion_copy"];
const ITEMS3D = (function () {
  let B = null;
  return function (id) { if (!B) B = make(); if (!B[id]) throw new Error('no 3D model for the item ' + id); return B[id](); };
  function make() {
    const at = (m, x, y, z) => { m.position.set(x, y, z); return m; }, rot = (m, x, y, z) => { m.rotation.set(x || 0, y || 0, z || 0); return m; };
    const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };
    const decal = (w, h, t, extra) => new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial(Object.assign({ map: t, transparent: true, metalness: 0, roughness: 0.7, depthWrite: false }, extra || {})));
    const lathe = (pts, mat, seg) => new T.Mesh(new T.LatheGeometry(pts.map(p => new T.Vector2(p[0], p[1])), seg || 28), mat);
    const ring = (r, tube, mat, seg) => { const m = torus(r, tube, mat, seg || 24); m.rotation.x = PI / 2; return m; };
    const word = (txt, w, h, col, font, bg) => tex(w, h, (c, W, H) => { if (bg) { c.fillStyle = bg; c.fillRect(0, 0, W, H); } c.fillStyle = col; c.font = font; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, W / 2, H / 2 + 2); });
    const steel = STY.std('#9aa4b4', 0.85, 0.35), steelDk = STY.std('#4a525e', 0.8, 0.42), rust = STY.std('#8a5a3a', 0.4, 0.7), teal = STY.std('#4f9aa0', 0.3, 0.45), rubber = STY.mat.rubber;
    const brass = STY.std('#f4c65c', 0.72, 0.27), brassDk = STY.std('#c9963c', 0.72, 0.32), copper = STY.std('#e38a4e', 0.68, 0.3), cork = STY.std('#8a6440', 0.05, 0.85);
    const glass = new T.MeshStandardMaterial({ color: STY.col('#e4f3fa'), transparent: true, opacity: 0.3, metalness: 0.1, roughness: 0.03, depthWrite: false, envMapIntensity: 2.0, side: T.DoubleSide });
    const frost = new T.MeshStandardMaterial({ color: STY.col('#dff4ff'), transparent: true, opacity: 0.55, metalness: 0, roughness: 0.6, depthWrite: false, side: T.DoubleSide });
    const plate = (w, d, mat, t) => cbox(w, px(t || 1.4), d, 0.004, mat);
    const gear = (r, mat) => { const g = G(); g.add(cyl(r, r, px(1.6), mat, 20)); for (let i = 0; i < 8; i++) { const a = i * PI / 4, t = cbox(r * 0.42, px(1.6), r * 0.3, 0.002, mat); t.position.set(Math.cos(a) * r, 0, Math.sin(a) * r); t.rotation.y = -a; g.add(t); } return g; };
    const nut = (mat) => new T.Mesh(new T.CylinderGeometry(0.03, 0.03, px(1.6), 6), mat);

    const B = {
      // THE AMMO PACK (the approved draft): a kraft paper sleeve with an orange band (AMMO · 10 RDS, the item's +10 rounds), the lore's stamped rota, its top torn open on two rows of brass rounds, the flap folded back
      ammo_pack() {
        const paper = STY.std('#b48f5c', 0, 0.85), paperDk = STY.std('#7e6240', 0, 0.88), paperIn = STY.std('#cfb07a', 0, 0.85), inside = STY.std('#140e08', 0, 0.95), SW = 0.3, SH = 0.15, SD = 0.17, ink = '#1e0f05';
        const tipGeo = new T.LatheGeometry([[0, 0.036], [0.004, 0.034], [0.009, 0.028], [0.013, 0.019], [0.0155, 0.009], [0.0158, 0]].map(p => new T.Vector2(p[0], p[1])), 18);
        const round = () => { const r = G(); r.add(at(cyl(0.0172, 0.0172, 0.072, brass, 18), 0, 0.036, 0)); r.add(at(cyl(0.0185, 0.0185, 0.006, brassDk, 18), 0, 0.003, 0));
          r.add(at(cyl(0.0164, 0.0172, 0.006, brassDk, 18), 0, 0.072, 0)); r.add(at(new T.Mesh(tipGeo, copper), 0, 0.074, 0)); return r; };
        const g = G(), s = G(); s.rotation.y = 0.45; g.add(s);
        s.add(at(cbox(SW, SH, SD, 0.008, paper), 0, SH / 2, 0)); s.add(at(cbox(SW + 0.004, 0.012, SD + 0.004, 0.003, paperDk), 0, 0.006, 0));
        s.add(at(cbox(SW + 0.005, 0.056, SD + 0.005, 0.004, STY.std('#e9771f', 0.02, 0.6)), 0, 0.074, 0));
        const front = tex(512, 96, (c, w, h) => { c.fillStyle = ink; c.font = 'bold 64px DejaVu Sans Condensed, DejaVu Sans, sans-serif'; c.textBaseline = 'middle'; c.fillText('AMMO', 22, h / 2 + 3);
          c.font = 'bold 34px DejaVu Sans Mono, monospace'; c.fillText('10 RDS', 296, h / 2 + 4); for (let i = 0; i < 9; i++) c.fillRect(444 + i * 6, 24, i % 3 ? 3 : 5, 48); });
        s.add(at(decal(SW * 0.94, 0.05, front), 0, 0.074, SD / 2 + 0.0035));
        s.add(at(rot(decal(SD * 0.9, 0.046, word('10 RDS', 192, 96, ink, 'bold 40px DejaVu Sans Mono, monospace')), 0, PI / 2, 0), SW / 2 + 0.0035, 0.074, 0));
        const rota = tex(256, 160, (c, w, h) => { c.strokeStyle = 'rgba(40,52,90,0.75)'; c.lineWidth = 4; c.strokeRect(8, 8, w - 16, h - 16); c.lineWidth = 2;
          for (let i = 1; i < 5; i++) { c.beginPath(); c.moveTo(8 + i * (w - 16) / 5, 8); c.lineTo(8 + i * (w - 16) / 5, h - 8); c.stroke(); } for (let j = 1; j < 3; j++) { c.beginPath(); c.moveTo(8, 8 + j * (h - 16) / 3); c.lineTo(w - 8, 8 + j * (h - 16) / 3); c.stroke(); }
          c.lineWidth = 5; for (const x0 of [24, 68]) { c.beginPath(); c.moveTo(x0, 30); c.lineTo(x0 + 9, 42); c.lineTo(x0 + 26, 18); c.stroke(); } });
        s.add(at(rot(decal(0.07, 0.044, rota, { opacity: 0.85 }), 0, 0, -0.06), -0.085, 0.124, SD / 2 + 0.0032));
        s.add(at(rot(new T.Mesh(new T.PlaneGeometry(SW - 0.022, SD - 0.022), inside), -PI / 2, 0, 0), 0, SH + 0.0015, 0));
        const fs = new T.Shape(); fs.moveTo(-SW / 2 + 0.004, 0); fs.lineTo(SW / 2 - 0.004, 0);
        for (let i = 0; i <= 14; i++) { const x = SW / 2 - 0.004 - i * (SW - 0.008) / 14; fs.lineTo(x, 0.03 + (i % 2 ? 0.01 : 0) + Math.sin(i * 1.7) * 0.004); }
        const flapMat = paperIn.clone(); flapMat.side = T.DoubleSide; s.add(at(rot(new T.Mesh(new T.ExtrudeGeometry(fs, { depth: 0.002, bevelEnabled: false }), flapMat), -0.95, 0, 0), 0, SH - 0.002, -SD / 2 + 0.002));
        for (let row = 0; row < 2; row++) for (let i = 0; i < 5; i++) { if (row === 1 && i === 3) continue;
          const lift = (row === 0 && i === 1) ? 0.016 : (row === 1 && i === 4) ? 0.009 : 0; s.add(at(round(), -SW / 2 + 0.042 + i * 0.054 + (row ? 0.012 : 0), SH - 0.06 + lift, row ? -0.03 : 0.032)); }
        return g; },
      // THE REPAIR KIT ("a pocket repair kit for your shell"; its floor look of build 2026-11-11e): a grey hard case lying a little turned, a lighter lid on a rubber seam, a raised green plus that glows
      // like the HUD's bars on a dark plate, a carry handle, two latches, rubber feet, REPAIR stencilled on its front
      repair_kit() { const g = G(), s = G(); s.rotation.y = -0.3; g.add(s); const green = STY.glow('#7dffa8', 1.1), shell = STY.std('#5a6270', 0.55, 0.42), lid = STY.std('#707a88', 0.5, 0.4);
        s.add(at(cbox(0.3, px(5.4), 0.2, 0.018, shell), 0, px(2.9), 0)); s.add(at(cbox(0.306, px(1), 0.206, 0.004, rubber), 0, px(5.7), 0)); s.add(at(cbox(0.3, px(3.4), 0.2, 0.022, lid), 0, px(7.6), 0));
        s.add(at(cbox(0.16, px(0.8), 0.16, 0.01, steelDk), 0, px(9.4), 0.005)); s.add(at(cbox(0.13, px(1.6), 0.036, 0.006, green), 0, px(10), 0.005)); s.add(at(cbox(0.036, px(1.6), 0.13, 0.006, green), 0, px(10), 0.005));
        const h = new T.Mesh(new T.TorusGeometry(0.055, 0.011, 8, 18, PI), steelDk); s.add(at(h, 0, px(9.3), -0.065));   // the handle, an arch over the lid's back
        for (const x of [-0.055, 0.055]) s.add(at(cbox(0.026, px(1.4), 0.03, 0.004, steel), x, px(9.4), -0.065));
        for (const x of [-0.09, 0.09]) { s.add(at(cbox(0.034, px(3.2), 0.014, 0.004, steel), x, px(5.8), 0.104)); s.add(at(cbox(0.018, px(1), 0.004, 0.001, rubber), x, px(6.4), 0.112)); }   // the latches
        for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) s.add(at(cyl(0.016, 0.018, px(1), rubber, 10), x * 0.12, px(0.5), z * 0.075));
        s.add(at(decal(0.1, 0.024, word('REPAIR', 256, 64, '#d8ffe6', 'bold 44px DejaVu Sans, sans-serif'), { opacity: 0.85 }), 0, px(3.2), 0.1012));
        return g; },
      // FLARES: two security-issue flares lying crossed, red casings with a cream band and a dark cap; the top one lit, a small flame off its striker end
      flare() { const g = G(), red = STY.std('#c8321e', 0.2, 0.5);
        const stick = (y, ry, lit) => { const s = G(); s.rotation.y = ry; s.add(rot(cyl(0.028, 0.028, 0.34, red, 16), 0, 0, PI / 2)); s.add(at(rot(cyl(0.029, 0.029, 0.05, STY.std('#f4e2c0', 0.05, 0.7), 16), 0, 0, PI / 2), 0.04, 0, 0));
          s.add(at(rot(cyl(0.031, 0.031, 0.04, STY.std('#2a2a30', 0.5, 0.5), 16), 0, 0, PI / 2), 0.18, 0, 0)); s.add(at(rot(cyl(0.022, 0.03, 0.03, lit ? STY.glow('#ffb347', 1.4) : STY.std('#3a2a20', 0.2, 0.8), 16), 0, 0, PI / 2), -0.185, 0, 0));
          if (lit) { s.add(at(rot(new T.Mesh(new T.ConeGeometry(0.034, 0.12, 14), STY.glow('#ff6a2a', 1.25)), 0, 0, PI / 2 - 0.5), -0.24, 0.03, 0)); s.add(at(rot(new T.Mesh(new T.ConeGeometry(0.018, 0.08, 12), STY.glow('#fff1b0', 1.4)), 0, 0, PI / 2 - 0.5), -0.226, 0.022, 0)); }
          s.position.y = y; return s; };
        g.add(stick(0.028, 0.35, false)); g.add(stick(0.084, -0.55, true));
        return g; },
      // A POWER CELL: an upright capsule, steel caps, a glass middle with the glowing cyan core, two steel rings, a contact on top, a dark label band
      power_cell() { const g = G();
        g.add(at(cyl(0.085, 0.095, px(4), steelDk, 24), 0, px(2), 0)); g.add(at(cyl(0.06, 0.06, px(13), STY.glow('#31e8ff', 1.15), 24), 0, px(10.5), 0)); g.add(at(cyl(0.075, 0.075, px(14), glass, 24), 0, px(10.5), 0));
        g.add(at(cyl(0.085, 0.08, px(4), steelDk, 24), 0, px(19.5), 0)); g.add(at(cyl(0.03, 0.03, px(3), steel, 12), 0, px(23), 0)); g.add(at(cyl(0.04, 0.04, px(0.8), steelDk, 12), 0, px(21.8), 0));
        for (const y of [7, 14]) g.add(at(ring(0.078, 0.008, steel), 0, px(y), 0));
        g.add(at(cyl(0.0905, 0.0905, px(1.4), STY.std('#1a2a33', 0.5, 0.5), 24), 0, px(2.6), 0));
        return g; },
      // A MUTAGEN SAMPLE: a stoppered flask, wide at the foot (the pack icon's shape), the violet stuff cloudy and glowing in it, three bubbles rising, a cork in its neck
      mutagen_sample() { const g = G(), vio = '#c06bff';
        g.add(lathe([[0, 0], [0.098, 0], [0.104, 0.008], [0.06, px(9.5)], [0.034, px(10.6)], [0, px(10.6)]], STY.glow(vio, 1.0)));
        g.add(lathe([[0.104, 0], [0.112, 0.006], [0.112, 0.012], [0.042, px(15)], [0.04, px(19)], [0.046, px(19.6)]], glass));
        g.add(at(cyl(0.046, 0.04, px(4), cork, 16), 0, px(20), 0));
        for (const [x, y, z, r] of [[0.03, 9, 0.02, 0.016], [-0.02, 6, -0.03, 0.012], [0.012, 12.5, 0.005, 0.009]]) g.add(at(new T.Mesh(new T.SphereGeometry(r, 12, 9), STY.glow('#f0dcff', 1.1)), x, px(y), z));
        return g; },
      // THE POWER MODULE ("a heavy cartridge with a cracked status window and a sticker: SPARE — DO NOT REMOVE"): a chunky dark module, its amber status window cracked, two brass contacts, a
      // handle, a hazard-striped end, the sticker
      power_module() { const g = G(), s = G(); s.rotation.y = 0.25; g.add(s);
        s.add(at(cbox(0.32, px(12), 0.22, 0.02, steelDk), 0, px(6), 0)); s.add(at(cbox(0.22, px(7), 0.012, 0.004, STY.std('#1c2027', 0.6, 0.4)), 0, px(6.5), 0.11)); s.add(at(cbox(0.2, px(6), 0.01, 0.004, STY.glow('#ffb347', 1.1)), 0, px(6.5), 0.113));
        const crack = tex(256, 96, (c, w, h) => { c.strokeStyle = 'rgba(30,14,0,0.9)'; c.lineWidth = 4; c.beginPath(); c.moveTo(150, 0); c.lineTo(138, 30); c.lineTo(158, 52); c.lineTo(132, 96); c.moveTo(138, 30); c.lineTo(100, 44); c.stroke(); });
        s.add(at(decal(0.2, px(6), crack), 0, px(6.5), 0.1188));
        s.add(at(cbox(0.012, px(12), 0.2, 0.002, STY.hazard(1, 3)), 0.161, px(6), 0));
        for (const x of [-0.06, 0.06]) s.add(at(cbox(0.03, px(4), 0.03, 0.004, brass), x, px(14), 0));
        s.add(at(cbox(0.16, px(1.4), 0.03, 0.006, steel), 0, px(16.5), -0.06)); for (const x of [-0.08, 0.08]) s.add(at(cbox(0.02, px(4), 0.03, 0.004, steel), x, px(14.5), -0.06));
        const sticker = tex(320, 96, (c, w, h) => { c.fillStyle = '#efe9da'; c.fillRect(0, 0, w, h); c.fillStyle = '#b8261a'; c.fillRect(0, 0, w, 16); c.fillStyle = '#1a1a1a'; c.font = 'bold 40px DejaVu Sans, sans-serif'; c.textAlign = 'center'; c.fillText('SPARE', w / 2, 58); c.font = 'bold 18px DejaVu Sans, sans-serif'; c.fillText('DO NOT REMOVE', w / 2, 84); });
        s.add(at(rot(decal(0.1, 0.03, sticker, { transparent: false }), 0, 0, 0.04), -0.09, px(9.8), 0.1112));
        return g; },
      // A MECH LEG: a spider mech's leg lying on the floor, jointed twice (the hip's socket, the long thigh, the knee, the shin and its claw); titanium with a cyan strip, a braided cable along the thigh
      mech_leg() { const g = G(), s = G(); s.rotation.y = 0.5; g.add(s); const ti = STY.std('#b8c2cc', 0.85, 0.3), stripe = STY.glow('#31e8ff', 1.0);
        const seg = (x0, z0, x1, z1, r) => { const dx = x1 - x0, dz = z1 - z0, L = Math.hypot(dx, dz), a = Math.atan2(dz, dx), m = G(); m.position.set((x0 + x1) / 2, r, (z0 + z1) / 2); m.rotation.y = -a;
          m.add(rot(cyl(r, r * 0.85, L, ti, 16), 0, 0, PI / 2)); m.add(at(cbox(L * 0.8, 0.008, r * 0.5, 0.002, stripe), 0, r * 0.98, 0)); for (const u of [-0.42, 0.42]) m.add(at(rot(cyl(r * 1.08, r * 1.08, 0.012, steelDk, 16), 0, 0, PI / 2), u * L, 0, 0)); return m; };
        s.add(seg(-0.2, -0.04, 0.02, 0.05, 0.034)); s.add(seg(0.02, 0.05, 0.22, -0.06, 0.026));
        s.add(at(cyl(0.045, 0.045, px(2.4), steelDk, 18), -0.21, px(1.2) + 0.012, -0.045)); s.add(at(new T.Mesh(new T.SphereGeometry(0.04, 16, 12), steelDk), 0.02, 0.036, 0.05));
        s.add(at(rot(cyl(0.012, 0.012, 0.09, steel, 10), PI / 2, 0, 0), 0.02, 0.036, 0.05));   // the knee's pin
        s.add(at(rot(new T.Mesh(new T.ConeGeometry(0.024, 0.07, 12), steelDk), 0, 0, -PI / 2), 0.25, 0.022, -0.075));
        const cable = new T.CatmullRomCurve3([V(-0.2, 0.05, -0.02), V(-0.12, 0.072, 0.012), V(-0.04, 0.07, 0.04), V(0.01, 0.06, 0.058)]);
        s.add(new T.Mesh(new T.TubeGeometry(cable, 24, 0.008, 6, false), STY.std('#2a3038', 0.4, 0.6)));
        return g; },
      // THE MECH CORE ("a hexagonal housing humming faintly ... DO NOT DROP"): lying flat, dark teal, steel rim and bolts, its cyan heart lit on top in a ring, vents round its sides, the label
      mech_core() { const g = G(), s = G(); s.rotation.y = 0.2; g.add(s);
        s.add(at(cyl(0.16, 0.17, px(7), STY.std('#16404a', 0.6, 0.4), 6), 0, px(3.5), 0)); s.add(at(cyl(0.165, 0.165, px(1.2), steel, 6), 0, px(7.2), 0));
        s.add(at(cyl(0.075, 0.075, px(2), STY.glow('#31e8ff', 1.2), 28), 0, px(8), 0)); s.add(at(ring(0.095, 0.01, steel, 28), 0, px(8.4), 0)); s.add(at(cyl(0.035, 0.035, px(2.4), STY.glow('#eaffff', 1.2), 18), 0, px(8.3), 0));
        for (let i = 0; i < 6; i++) { const a = i * PI / 3 + PI / 6; s.add(at(cyl(0.012, 0.012, px(1.6), steelDk, 6), Math.cos(a) * 0.13, px(7.8), Math.sin(a) * 0.13)); }
        for (let i = 0; i < 6; i++) { if (i === 1) continue; const a = i * PI / 3, m = G(); m.rotation.y = -a; m.position.y = px(3.5); for (let k = -1; k <= 1; k++) m.add(at(cbox(0.004, px(0.7), 0.07, 0.001, STY.std('#0b1a1f', 0.5, 0.6)), 0.157, k * px(1.6), 0)); s.add(m); }
        const lab = G(); lab.rotation.y = -PI / 3; lab.add(at(rot(decal(0.1, px(3.2), word('DO NOT DROP', 320, 80, '#eaffff', 'bold 40px DejaVu Sans, sans-serif')), 0, PI / 2, 0), 0.142, px(3.6), 0)); s.add(lab);
        return g; },
      // SCRAP METAL (the owner's "A A heap"): bent plates lying and leaning (steel, rust, a scrap of the facility's teal), a short pipe across them, a gear and three nuts
      scrap_metal() { const g = G();
        g.add(at(rot(plate(0.34, 0.22, steelDk), 0, 0.3, 0), -0.02, px(0.7), 0.02)); g.add(at(rot(plate(0.28, 0.2, rust), 0.08, -0.5, 0.05), 0.08, px(2), -0.06)); g.add(at(rot(plate(0.26, 0.16, teal), -0.1, 1.1, 0.12), -0.1, px(2.6), 0.06));
        g.add(at(rot(plate(0.22, 0.18, steel), 0.9, 0.4, 0), 0.02, px(6), -0.02));
        g.add(at(rot(cyl(0.03, 0.03, 0.36, steel, 16), 0, 0.6, PI / 2), 0.02, px(5.2), 0.08)); g.add(at(rot(cyl(0.034, 0.034, 0.03, steelDk, 16), 0, 0.6, PI / 2), 0.17, px(5.2), -0.02));
        g.add(at(rot(gear(0.07, steel), 0.25, 0, 0.2), -0.13, px(4.5), -0.08));
        for (const [x, z] of [[0.17, 0.12], [-0.18, 0.15], [0.12, -0.16]]) g.add(at(nut(steelDk), x, px(0.9), z));
        return g; },
      // A FUEL CELL ("a glass-and-steel canister with a green glow that does not flicker. The label says THIS SIDE UP"): square, steel caps top and bottom, four corner posts, the green fuel glowing
      // in its glass, the label on its cap
      fuel_cell() { const g = G(), s = G(); s.rotation.y = 0.35; g.add(s);
        s.add(at(cbox(0.2, px(3), 0.2, 0.01, steelDk), 0, px(1.5), 0)); s.add(at(cbox(0.13, px(11), 0.13, 0.004, STY.glow('#5dffb0', 1.05)), 0, px(8.5), 0)); s.add(at(cbox(0.16, px(13), 0.16, 0.004, glass), 0, px(9.5), 0));
        s.add(at(cbox(0.2, px(3), 0.2, 0.01, steelDk), 0, px(17.5), 0)); s.add(at(cyl(0.035, 0.035, px(2.5), steel, 12), 0, px(20), 0));
        for (const [x, z] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) s.add(at(cbox(0.022, px(13), 0.022, 0.003, steel), x * 0.085, px(9.5), z * 0.085));
        s.add(at(decal(0.16, px(2.4), word('▲ THIS SIDE UP', 384, 64, '#dfffee', 'bold 34px DejaVu Sans, sans-serif')), 0, px(17.5), 0.1012));
        return g; },
      // THE HEALING SERUM ("a green serum ... brewed under the fume hood"): a squat medical bottle, the green serum glowing in it, a white rubber dropper, a white label with a green cross
      healing_serum() { const g = G(), s = G(); s.rotation.y = 0.3; g.add(s); const grn = '#7dffb0';
        s.add(lathe([[0, 0], [0.078, 0], [0.084, 0.01], [0.084, px(8.5)], [0.05, px(10.6)], [0, px(10.6)]], STY.glow(grn, 0.95)));
        s.add(lathe([[0.088, 0], [0.093, 0.008], [0.093, px(10)], [0.052, px(13.2)], [0.034, px(14.2)], [0.034, px(15.6)]], glass));
        s.add(at(cyl(0.04, 0.04, px(2.4), STY.std('#e8eef2', 0.1, 0.5), 18), 0, px(16.6), 0)); s.add(lathe([[0, px(17.6)], [0.034, px(17.6)], [0.036, px(20)], [0.03, px(22.6)], [0.014, px(23.6)], [0, px(23.8)]], STY.std('#f2f4f6', 0, 0.55), 20));
        const label = tex(256, 160, (c, w, h) => { c.fillStyle = '#f4f6f2'; c.fillRect(0, 0, w, h); c.fillStyle = '#2bd679'; c.fillRect(w / 2 - 22, 22, 44, 116); c.fillRect(w / 2 - 58, h / 2 - 22, 116, 44); });
        const lb = new T.Mesh(new T.CylinderGeometry(0.0945, 0.0945, px(5.6), 28, 1, true, -0.85, 1.7), new T.MeshStandardMaterial({ map: label, metalness: 0, roughness: 0.7 })); s.add(at(lb, 0, px(5), 0));
        return g; },
      // THE SPECIMEN CAPSULE ("frost on the inside of the glass, and something very still behind it. The seal hums"): a containment capsule lying on two cradles, frosted glass, steel end caps with
      // their seals glowing ice blue, a curled dark shape asleep inside
      specimen_capsule() { const g = G(), s = G(); s.rotation.y = 0.4; g.add(s); const ice = '#aeeaff', L = 0.3, R = 0.068, y0 = 0.085;
        for (const x of [-0.09, 0.09]) { s.add(at(cbox(0.03, px(3.2), 0.11, 0.006, steelDk), x, px(1.6), 0)); }
        const body = G(); body.position.y = y0; s.add(body);
        const inner = G(); inner.add(at(new T.Mesh(new T.SphereGeometry(0.038, 16, 12), STY.std('#20262e', 0.2, 0.7)), 0, -0.006, 0)); inner.children[0].scale.set(1.5, 0.75, 0.9);
        for (const [x, z, a] of [[0.035, 0.03, 0.6], [-0.03, 0.032, -0.5], [0.02, -0.03, 2.4], [-0.025, -0.028, -2.3]]) inner.add(at(rot(cyl(0.005, 0.004, 0.05, STY.std('#20262e', 0.2, 0.7), 6), PI / 2, a, 0.3), x, -0.016, z));
        body.add(inner);
        body.add(rot(cyl(R, R, L, frost, 28, 1, true), 0, 0, PI / 2)); body.add(rot(cyl(R * 1.01, R * 1.01, L, glass, 28), 0, 0, PI / 2));
        for (const sg of [-1, 1]) { body.add(at(rot(cyl(R * 1.12, R * 1.12, 0.05, steel, 28), 0, 0, PI / 2), sg * (L / 2 + 0.02), 0, 0)); body.add(at(rot(ring(R * 1.13, 0.008, STY.glow(ice, 1.2), 28), 0, 0, 0), sg * (L / 2 - 0.004), 0, 0)); body.children[body.children.length - 1].rotation.set(0, PI / 2, 0);
          body.add(at(rot(cyl(R * 0.6, R * 0.6, 0.012, steelDk, 20), 0, 0, PI / 2), sg * (L / 2 + 0.05), 0, 0)); }
        return g; },
      // THE ROCK ("scorched on one side where the thermite went through. Something has been scratching at the other"): a rough faceted lump, charred and glowing with embers on its front, scratched on its end
      rock() { const g = G(), geo = new T.IcosahedronGeometry(0.11, 1), p = geo.attributes.position, col = [], v = new T.Vector3();
        const n3 = (x, y, z) => Math.sin(x * 37.1 + y * 11.7) * 0.5 + Math.sin(y * 23.3 + z * 41.9) * 0.3 + Math.sin(z * 17.7 + x * 29.3) * 0.2;
        for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const k = 1 + 0.16 * n3(v.x * 9, v.y * 9, v.z * 9); v.multiplyScalar(k); v.y *= 0.72; p.setXYZ(i, v.x, v.y, v.z); }
        geo.computeVertexNormals(); const nrm = geo.attributes.normal, stone = new T.Color('#5f4f3e'), char = new T.Color('#140d08'), cc = new T.Color();
        for (let i = 0; i < p.count; i++) { const t = Math.max(0, Math.min(1, (nrm.getZ(i) * 0.9 - nrm.getX(i) * 0.25 + 0.05) * 1.9)); cc.copy(stone).lerp(char, t); col.push(cc.r, cc.g, cc.b); }
        geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); const m = new T.Mesh(geo, new T.MeshStandardMaterial({ vertexColors: true, metalness: 0.05, roughness: 0.92, flatShading: true }));
        m.rotation.y = 0.5; m.position.y = 0.08; g.add(m); m.updateMatrix();
        // the embers in the charred side and the scratches on the other: at its own corners (vertices) there, a little sunk into the surface
        const ember = STY.glow('#ff7a2a', 1.3), scratch = STY.std('#2e2219', 0, 0.9), seen = new Set(); let ne = 0, ns = 0;
        for (let i = 0; i < p.count && (ne < 7 || ns < 3); i++) { v.fromBufferAttribute(p, i); const key = v.x.toFixed(3) + v.y.toFixed(3) + v.z.toFixed(3); if (seen.has(key)) continue; seen.add(key);
          const w = v.clone().multiplyScalar(0.97).applyMatrix4(m.matrix), d = w.clone().setY(0).normalize();
          if (ne < 7 && d.z > 0.6 && w.y > 0.04 && i % 2 === 0) { g.add(at(new T.Mesh(new T.SphereGeometry(0.0095 - ne * 0.0007, 8, 6), ember), w.x, w.y, w.z)); ne++; }
          else if (ns < 3 && d.x > 0.85 && w.y > 0.06) { g.add(at(rot(cbox(0.004, 0.006, 0.07, 0.001, scratch), 0.5, 0, 0.35), w.x * 1.01, w.y, w.z)); ns++; } }
        return g; },
      // THE PURIFICATION MODULE ("a canister of membranes and a pump, and a chalk mark on it: THE DRAIN"): an upright teal canister, a window down its front with the membranes stacked and lit in it,
      // a pump on its side piped in at the top and the foot, a handle, THE DRAIN in chalk
      purification_module() { const g = G(), s = G(); s.rotation.y = 0.15; g.add(s); const shell = STY.std('#2f6a73', 0.5, 0.42), lit = STY.glow('#5ff7e0', 1.05), R = 0.1, H = px(19);
        s.add(at(cyl(R, R, H, shell, 28), -0.03, H / 2 + px(1.2), 0)); s.add(at(cyl(R * 1.06, R * 1.06, px(1.6), steelDk, 28), -0.03, px(0.8), 0)); s.add(at(cyl(R * 1.06, R * 1.06, px(1.6), steelDk, 28), -0.03, H + px(1.8), 0));
        const win = G(); win.position.set(-0.03, 0, 0); win.rotation.y = 0.55; s.add(win);
        win.add(at(cbox(0.06, px(10.5), 0.012, 0.004, STY.std('#0b1a1f', 0.4, 0.5)), 0, px(8.75), R - 0.002)); for (let i = 0; i < 5; i++) win.add(at(cbox(0.046, px(0.9), 0.006, 0.001, lit), 0, px(4.8 + i * 1.95), R + 0.004));
        win.add(at(cbox(0.06, px(10.5), 0.006, 0.003, glass), 0, px(8.75), R + 0.009));
        s.add(at(cbox(0.07, px(6), 0.08, 0.01, steelDk), 0.1, px(3.4), 0.03)); s.add(at(rot(cyl(0.03, 0.03, 0.06, steel, 16), 0, 0, PI / 2), 0.1, px(6.6), 0.03)); s.add(at(cyl(0.008, 0.008, px(2), STY.glow('#5ff7e0', 1.2), 8), 0.13, px(7.4), 0.06));
        const pipe = new T.CatmullRomCurve3([V(0.1, px(7.4), 0.0), V(0.1, px(16), -0.01), V(0.04, px(19.5), -0.02), V(-0.0, px(19.6), -0.03)]); s.add(new T.Mesh(new T.TubeGeometry(pipe, 20, 0.009, 8, false), steel));
        s.add(at(rot(new T.Mesh(new T.TorusGeometry(0.04, 0.008, 8, 16, PI), steel), 0, 0.3, 0), -0.03, H + px(2.6), 0));
        const chalk = tex(320, 96, (c, w, h) => { c.fillStyle = 'rgba(240,244,236,0.92)'; c.font = 'bold 46px DejaVu Sans, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.translate(w / 2, h / 2); c.rotate(-0.06); c.fillText('THE DRAIN', 0, 2);
          for (let i = 0; i < 260; i++) { c.clearRect((Math.sin(i * 12.9898) * 43758.5453 % 1) * w - w / 2, (Math.sin(i * 78.233) * 12345.678 % 1) * h - h / 2, 3, 2); } });
        const ch = G(); ch.position.set(-0.03, 0, 0); ch.rotation.y = 0.55; ch.add(at(new T.Mesh(new T.CylinderGeometry(R + 0.0015, R + 0.0015, px(4.2), 28, 1, true, -0.55, 1.1), new T.MeshStandardMaterial({ map: chalk, transparent: true, metalness: 0, roughness: 0.9, depthWrite: false })), 0, px(16.9), 0)); s.add(ch);
        return g; },
      // THE SLEEPING POTION ("a round flask of something blue that settles slowly ... it smells of cold rain"): a round flask, the blue settled deep at its foot and paler above, a cork and a wax seal, a cord at its neck
      sleeping_potion() { return potion('#3b6cff', '#9ab6ff', false); },
      // THE COPIED POTION ("paler, and it does not settle"): the same flask, its blue pale and cloudy all through, and the Experiment Lab's paper tag tied at its neck: COPY
      sleeping_potion_copy() { return potion('#c9d6ff', '#c9d6ff', true); },
    };
    function potion(deep, pale, copy) { const g = G(), s = G(); s.rotation.y = 0.2; g.add(s); const R = 0.105;
      const prof = (r, top, n) => { const pts = [[0, 0.004]]; for (let i = 0; i <= n; i++) { const a = -PI / 2 + i / n * (PI / 2 + Math.asin(Math.min(1, Math.max(-1, (top - r) / r)))); pts.push([Math.cos(a) * r, r + Math.sin(a) * r]); } pts.push([0, top]); return pts; };
      if (copy) s.add(lathe(prof(R - 0.006, R * 1.2, 16), STY.glow(pale, 0.85)));
      else { s.add(lathe(prof(R - 0.006, R * 0.62, 14), STY.glow(deep, 1.0))); s.add(at(lathe(prof(R - 0.0065, R * 1.18, 16).map(([r, y]) => [r, y]), new T.MeshStandardMaterial({ color: STY.col(pale), transparent: true, opacity: 0.45, metalness: 0, roughness: 0.2, depthWrite: false })), 0, 0.0005, 0)); }
      const shell = []; for (let i = 0; i <= 20; i++) { const a = -PI / 2 + i / 20 * (PI * 0.86); shell.push([Math.cos(a) * R, R + Math.sin(a) * R]); } shell.push([0.032, R * 1.92], [0.03, R * 2.45], [0.036, R * 2.52]);
      s.add(lathe(shell, glass, 32));
      s.add(at(cyl(0.03, 0.026, px(3.6), cork, 16), 0, R * 2.5 + px(1.4), 0)); s.add(at(cyl(0.038, 0.036, px(1.6), STY.std(copy ? '#8a93a8' : '#24307a', 0.2, 0.5), 16), 0, R * 2.5 + px(3.2), 0));
      s.add(at(ring(0.033, 0.004, STY.std('#c9b48a', 0, 0.8), 16), 0, R * 2.28, 0));
      if (copy) { const tag = tex(192, 112, (c, w, h) => { c.fillStyle = '#efe6cf'; c.fillRect(0, 0, w, h); c.strokeStyle = '#9a8a6a'; c.lineWidth = 6; c.strokeRect(3, 3, w - 6, h - 6); c.fillStyle = '#2a2a3a'; c.font = 'bold 54px DejaVu Sans, sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('COPY', w / 2, h / 2 + 3); c.fillStyle = '#9a8a6a'; c.beginPath(); c.arc(18, h / 2, 7, 0, 7); c.fill(); });
        s.add(at(rot(new T.Mesh(new T.PlaneGeometry(0.075, 0.044), new T.MeshStandardMaterial({ map: tag, side: T.DoubleSide, metalness: 0, roughness: 0.8 })), -0.25, 0.25, -0.35), 0.06, R * 2.02, 0.04)); }
      return g; }
    B.toxic_sample = vial('#8cff5a'); B.sewer_sample = vial('#c77dff');
    // A SAMPLE VIAL in a little two-ring stand, its liquid glowing in the item's colour, a dark cap with a band of it
    function vial(hex) { return () => { const g = G(), Vl = G(); Vl.rotation.z = 0.08; g.add(Vl);
      Vl.add(at(cyl(0.035, 0.035, px(14), STY.glow(hex, 1.05), 20), 0, px(8), 0)); Vl.add(lathe([[0, px(1)], [0.032, px(1.2)], [0.036, px(2)], [0.036, px(15)]], STY.glow(hex, 1.05), 20));
      Vl.add(at(cyl(0.045, 0.045, px(17), glass, 20), 0, px(9), 0));
      Vl.add(at(cyl(0.05, 0.05, px(4), STY.std('#2c333c', 0.6, 0.45), 20), 0, px(19), 0)); Vl.add(at(cyl(0.051, 0.051, px(1.2), STY.glow(hex, 0.9), 20), 0, px(18), 0));
      for (const y of [1.5, 10]) g.add(at(ring(0.06, 0.008, steelDk, 22), 0, px(y), 0));
      for (let i = 0; i < 3; i++) { const a = i * TAU / 3; g.add(at(cyl(0.006, 0.006, px(10), steelDk, 6), Math.cos(a) * 0.06, px(5.5), Math.sin(a) * 0.06)); }
      return g; }; }
    return B;
  }
})();
