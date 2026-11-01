// EMBER PLATING (Pack 1, fire, Unrefined: +5% attack): a curved armour plate of three steel bands laid like shingles, each over the one below it, ember-hot along the seams where they overlap (the glow
// spills out from under each band, and the steel near the seam is heat-tinted), a rolled collar along its top, a raised spine down its middle with a glowing slot, riveted ends, two leather straps
// behind it, and embers rising off its top. The first of the card items (docs/ART-PROCESS.md: one piece first).
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const heatM = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.72, roughness: 0.36, vertexColors: true }); heatM.envMapIntensity = 1.0;
  const collarM = std('#a7b0bb', 0.9, 0.26), spineM = std('#8b939e', 0.7, 0.32), rivetM = std('#c3cbd6', 0.9, 0.22), slotM = std('#15181d', 0.6, 0.5);
  const leather = std('#4a2f1c', 0.05, 0.78), buckleM = std('#c0a466', 1, 0.3);
  const ember = STY.glow('#ff6a1a', 1.6), emberHot = STY.glow('#ffb347', 1.7), emberCore = STY.glow('#fff0c2', 1.8), emberDim = STY.glow('#d9480f', 1.2);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const STEEL = STY.col('#4c535e'), HOT = STY.col('#9a3410'), WARM = STY.col('#6a3c2a');
  // a band: an arc of radius R (outer) and thickness t about the vertical axis, spanning `span` radians centred on the front (+z), `h` tall, its top at y = 0; the steel heat-tinted toward its lower edge
  function band(R, t, span, h) {
    const a0 = PI / 2 - span / 2, a1 = PI / 2 + span / 2, s = new T.Shape(); s.absarc(0, 0, R, a0, a1, false); s.absarc(0, 0, R - t, a1, a0, true); s.closePath();
    const geo = new T.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: 0.014, bevelSize: 0.012, bevelSegments: 3, curveSegments: 56, steps: 12 });
    const pos = geo.attributes.position, col = new Float32Array(pos.count * 3), c = new T.Color();
    for (let i = 0; i < pos.count; i++) { const k = Math.max(0, Math.min(1, pos.getZ(i) / h)), heat = Math.pow(Math.max(0, (k - 0.62) / 0.38), 1.8); c.copy(STEEL).lerp(HOT, heat * 0.9); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; }
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const m = new T.Mesh(geo, heatM); m.rotation.x = PI / 2; return m;   // (the extrusion runs down: its top at y = 0, its foot at y = -h; the arc's middle faces +z)
  }
  // a glowing arc along a band's foot, just proud of the band below it
  function seam(r, tubeR, span, mat) { const m = new T.Mesh(new T.TorusGeometry(r, tubeR, 8, 64, span), mat); m.rotation.set(PI / 2, 0, PI / 2 - span / 2); return m; }
  const onBand = (R, a, y) => [R * Math.sin(a), y, R * Math.cos(a)];   // a = 0 is the front (+z)
  function rivet(R, a, y) { const m = cyl(0.024, 0.028, 0.03, rivetM, 10); const p = onBand(R + 0.008, a, y); m.position.set(p[0], p[1], p[2]); m.rotation.set(PI / 2, 0, 0); m.rotation.y = 0; const q = G(); q.add(m); m.position.set(0, 0, 0); q.position.set(p[0], p[1], p[2]); q.rotation.y = a; m.rotation.x = PI / 2; return q; }

  ITEMS.ember_plating = { exposure: 1.0, az: 0.5, el: 0.3, build() {
    const g = G(), P = G(); g.add(P);
    // the bands, top to bottom: each a little wider in its curve and laid over the top of the one below it (its foot over the next band's head)
    const B = [ { R: 0.78, span: 1.5, y: 0.3, h: 0.27 }, { R: 0.76, span: 1.38, y: 0.06, h: 0.27 }, { R: 0.74, span: 1.24, y: -0.18, h: 0.29 } ], T0 = 0.06;
    B.forEach((b, i) => {
      P.add(at(band(b.R, T0, b.span, b.h), 0, b.y, 0));
      for (const s of [-1, 1]) for (const dy of [0.075, b.h - 0.085]) P.add(rivet(b.R, s * (b.span / 2 - 0.09), b.y - dy));   // two rivets at each end
    });
    // THE EMBER SEAMS: under each band's foot, where it lies over the band below: a hot line and a broader dim glow
    for (let i = 0; i < B.length - 1; i++) {
      const b = B[i], n = B[i + 1], y = b.y - b.h - 0.004, sp = Math.min(b.span, n.span) - 0.06;
      P.add(at(seam(n.R + 0.008, 0.008, sp, emberCore), 0, y + 0.002, 0));
      P.add(at(seam(n.R + 0.003, 0.015, sp + 0.02, ember), 0, y - 0.01, 0));
      P.add(at(seam(n.R - 0.006, 0.016, sp + 0.04, emberDim), 0, y - 0.026, 0));
    }
    // the foot of the bottom band: a heat-glowing lip
    P.add(at(seam(B[2].R + 0.002, 0.013, B[2].span - 0.08, ember), 0, B[2].y - B[2].h - 0.012, 0));
    // THE COLLAR: a rolled rod along the top band's head
    P.add(at(seam(B[0].R - T0 / 2, 0.03, B[0].span + 0.02, collarM), 0, B[0].y + 0.022, 0));
    for (const s of [-1, 1]) { const cap = sphere(0.034, collarM, 16), p = onBand(B[0].R - T0 / 2, s * (B[0].span / 2 + 0.01), B[0].y + 0.022); P.add(at(cap, p[0], p[1], p[2])); }
    // THE SPINE: a raised ridge down the middle of each band, a glowing slot in the middle band
    B.forEach((b, i) => { const sp = cbox(0.085, b.h - 0.03, 0.05, 0.016, spineM); P.add(at(sp, 0, b.y - b.h / 2, b.R + 0.005)); });
    P.add(at(cbox(0.034, B[1].h - 0.1, 0.03, 0.008, slotM), 0, B[1].y - B[1].h / 2, B[1].R + 0.03));
    P.add(at(cbox(0.018, B[1].h - 0.12, 0.012, 0.004, emberHot), 0, B[1].y - B[1].h / 2, B[1].R + 0.043));
    // a hairline heat crack from the upper seam across the top band (short jagged glowing segments)
    const crack = [[0.32, 0.03], [0.36, 0.08], [0.33, 0.13], [0.39, 0.17], [0.37, 0.215]];
    for (let k = 0; k < crack.length - 1; k++) {
      const [a, d] = crack[k], [a2, d2] = crack[k + 1], y0 = B[0].y - B[0].h + d, y1 = B[0].y - B[0].h + d2, p = onBand(B[0].R + 0.004, a, y0), q = onBand(B[0].R + 0.004, a2, y1);
      P.add(tube([p, [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2, (p[2] + q[2]) / 2 + 0.002], q], 0.0055, emberHot));
    }
    // two leather straps behind it, their ends showing past its sides, one with a buckle
    for (const s of [-1, 1]) {
      const a = s * (B[1].span / 2 + 0.05), p = onBand(B[1].R - 0.12, a, B[1].y - 0.13);
      P.add(tube([[p[0] - s * 0.12, p[1] + 0.02, p[2] - 0.12], [p[0], p[1], p[2]], [p[0] + s * 0.07, p[1] - 0.08, p[2] + 0.05], [p[0] + s * 0.08, p[1] - 0.2, p[2] + 0.06]], 0.024, leather));
      if (s > 0) { const bk = G(); bk.position.set(p[0] + s * 0.07, p[1] - 0.09, p[2] + 0.06); bk.rotation.set(0.1, s * 0.9, 0.15); bk.add(cbox(0.09, 0.07, 0.022, 0.006, buckleM)); bk.add(at(cbox(0.05, 0.036, 0.026, 0.004, leather), 0, 0, 0.002)); P.add(bk); }
    }
    // EMBERS rising off its top: bright motes, smaller and fainter as they rise
    const motes = [[0.04, 0.4, 0.74, 0.02, 1], [-0.18, 0.43, 0.7, 0.016, 0], [0.22, 0.45, 0.69, 0.015, 2], [-0.06, 0.5, 0.72, 0.013, 0], [0.13, 0.55, 0.68, 0.012, 1], [-0.25, 0.53, 0.64, 0.01, 1],
                   [0.03, 0.61, 0.68, 0.009, 2], [0.28, 0.6, 0.62, 0.008, 0], [-0.13, 0.66, 0.66, 0.007, 1], [0.1, 0.71, 0.64, 0.006, 0]];
    motes.forEach(([x, y, z, r, k]) => g.add(at(sphere(r, k === 2 ? emberHot : k === 1 ? ember : emberDim, 8), x, y, z)));
    P.rotation.set(0.06, 0, 0);
    return { g };
  } };
})();
