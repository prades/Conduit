// THE CATWALK BRIDGES (family 'bridge'): a footbridge from each liquid tank's roof deck to the catwalks' deck, along +x, drawn by the game as a row of one-tile pieces. Each piece is centred on the origin (x -0.5..0.5, z -0.6..0.6)
// with its grated walkway at 170 game-px above the ground (the arena floor; the catwalks' deck is that much above it), so a piece is a floating span: a Warren truss under each side, side channels with hazard edges, hand-rails
// on posts, cross-bracing. 'mid' repeats; 'tank' is the end on the tank's roof (-x end: landing plate, hinge bracket, gate posts with lamps); 'deck' is the end at the catwalk (+x end: a bolted bracket plate, gate posts, a chain
// with a hazard sign). Everything that repeats (grating bars, rails, truss members, hazard strips) meets the next piece at x = +-0.5 exactly (rails run 0.998 long: a hairline).
{
  const brCol = c => new T.Color(c).convertSRGBToLinear();   // (the renderer outputs sRGB: what is written is what is seen)
  const brStd = (c, m, r, e) => { const x = new T.MeshStandardMaterial({ color: brCol(c), metalness: m, roughness: r }); x.envMapIntensity = e == null ? 0.6 : e; return x; };
  const brBasic = c => new T.MeshBasicMaterial({ color: brCol(c), toneMapped: false });
  const BR = {
    steel: brStd(0x5a6a76, 0.7, 0.5), steel2: brStd(0x4a5864, 0.7, 0.55), steelLt: brStd(0x93a6b8, 0.75, 0.4, 0.9), dark: brStd(0x20272f, 0.6, 0.6, 0.3), grate: brStd(0x8798a8, 0.8, 0.4, 0.8), under: brStd(0x14181e, 0.5, 0.7, 0.2),
    rubber: brStd(0x14171c, 0.2, 0.8, 0.2), brass: brStd(0xb8923f, 1, 0.36, 0.9), teal: brBasic(0x31e8ff), vio: brBasic(0xa64dff), amber: brBasic(0xffb347),
  };
  const brHazard = (reps) => {
    const c = document.createElement('canvas'); c.width = 128; c.height = 32; const g = c.getContext('2d'); g.fillStyle = '#f0b030'; g.fillRect(0, 0, 128, 32); g.fillStyle = '#15171b';
    for (let i = -2; i < 7; i++) { g.beginPath(); g.moveTo(i * 24, 0); g.lineTo(i * 24 + 12, 0); g.lineTo(i * 24 - 20, 32); g.lineTo(i * 24 - 32, 32); g.closePath(); g.fill(); }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(reps, 1); t.encoding = T.sRGBEncoding; t.anisotropy = 4;
    const m = new T.MeshStandardMaterial({ map: t, color: 0xffffff, metalness: 0.2, roughness: 0.6 }); m.envMapIntensity = 0.5; return m;
  };
  const HZ = brHazard(4);
  const rod = (parent, a, b, r, mat, seg) => { const m = cyl(r, r, 1, mat, seg || 8), d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length() || 1e-4; m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.divideScalar(L)); m.scale.set(1, L, 1); parent.add(m); return m; };
  const add = (parent, m, x, y, z) => { m.position.set(x, y, z); parent.add(m); return m; };

  const piece = (name) => {
    const g = G(), D = px(170), HL = 0.499, ZW = 0.565;   // the walkway's height, the half length (a hairline short of the next piece), the side channels' z
    // the walkway: a dark underlay, cross bars (every 0.1: the next piece continues the rhythm) and three long bars: a grating
    add(g, cbox(HL * 2, px(2), 1.06, 0.004, BR.under), 0, D - px(3.2), 0);
    for (let i = 0; i < 10; i++) add(g, cbox(0.034, px(3), 1.06, 0.004, BR.grate), -0.45 + i * 0.1, D - px(1.5), 0);
    for (const z of [-0.3, 0, 0.3]) add(g, cbox(HL * 2, px(2.2), 0.02, 0.003, BR.steelLt), 0, D - px(1.2), z);
    // the side channels with a hazard-striped edge strip on top
    for (const s of [-1, 1]) {
      add(g, cbox(HL * 2, px(10), 0.07, 0.008, BR.steel), 0, D - px(4.2), s * ZW);
      add(g, new T.Mesh(new T.BoxGeometry(HL * 2, px(1.6), 0.07), HZ), 0, D + px(1.4), s * ZW);
    }
    // joists under the walkway, and cross braces between the two trusses (X rods in the plane under it)
    add(g, cbox(0.05, px(12), 1.1, 0.006, BR.dark), 0, D - px(9), 0); for (const x of [-0.5 + 0.03, 0.5 - 0.03]) add(g, cbox(0.03, px(10), 1.1, 0.004, BR.dark), x * 0.998, D - px(9), 0);
    rod(g, [-0.3, D - px(29), -ZW], [0.3, D - px(29), ZW], 0.011, BR.steel2, 5); rod(g, [-0.3, D - px(29), ZW], [0.3, D - px(29), -ZW], 0.011, BR.steel2, 5);
    // a Warren truss under each side: a bottom chord, diagonals, a vertical at the middle and at the joints
    for (const s of [-1, 1]) {
      const z = s * ZW, yT = D - px(8.5), yB = D - px(30);
      add(g, cbox(HL * 2, px(3.4), 0.045, 0.006, BR.steel), 0, yB, z);
      const pts = [[-HL, yT], [-0.25, yB], [0, yT], [0.25, yB], [HL, yT]];
      for (let i = 0; i < 4; i++) rod(g, [pts[i][0], pts[i][1], z], [pts[i + 1][0], pts[i + 1][1], z], 0.014, BR.steel2, 6);
      rod(g, [0, yT, z], [0, yB, z], 0.012, BR.steel2, 6);
      for (const x of [-0.25, 0.25]) { const gp = sphere(0.02, BR.steelLt, 6); gp.position.set(x, yB, z + s * 0.025); g.add(gp); }
    }
    // the hand-rails: a post in the middle of the piece on each side, a top rail, a mid rail, a toe board in hazard stripes
    for (const s of [-1, 1]) {
      const z = s * 0.582;
      add(g, cyl(0.02, 0.02, px(36), BR.steelLt, 8), 0, D + px(18), z);
      add(g, cbox(0.045, px(3), 0.045, 0.006, BR.steel), 0, D + px(2.5), z);
      const t = cyl(0.019, 0.019, HL * 2, BR.steelLt, 8); t.rotation.z = PI / 2; add(g, t, 0, D + px(36), z);
      const m = cyl(0.012, 0.012, HL * 2, BR.steelLt, 6); m.rotation.z = PI / 2; add(g, m, 0, D + px(20), z);
      add(g, new T.Mesh(new T.BoxGeometry(HL * 2, px(5), 0.012), HZ), 0, D + px(5.5), s * 0.597);
      const led = sphere(0.022, BR.amber, 8); add(g, led, 0, D + px(38), z);
      // two small balusters either side of the post, to read as a rail and not a wire
      for (const x of [-0.25, 0.25]) add(g, cyl(0.009, 0.009, px(16), BR.steelLt, 5), x, D + px(14), z);
    }
    if (name === 'tank') {
      // the end that lands on the tank's roof (at -x): a landing plate, a hinge bracket with its pin, gate posts with lamps, a sign
      add(g, cbox(0.13, px(2.4), 1.08, 0.006, BR.steelLt), -0.435, D + px(0.2), 0);
      add(g, cbox(0.1, px(20), 0.9, 0.01, BR.dark), -0.44, D - px(17), 0); const pin = cyl(0.032, 0.032, 1.02, BR.brass, 12); pin.rotation.x = PI / 2; add(g, pin, -0.44, D - px(21), 0);
      for (const s of [-1, 1]) {
        const post = add(g, cyl(0.035, 0.035, px(46), BR.steelLt, 10), -0.43, D + px(23), s * 0.6);
        add(g, cyl(0.055, 0.05, px(5), BR.dark, 10), -0.43, D + px(48.5), s * 0.6); add(g, sphere(0.05, s > 0 ? BR.teal : BR.vio, 10), -0.43, D + px(53), s * 0.6);
        add(g, cbox(0.06, px(4), 0.06, 0.006, BR.steel), -0.43, D + px(2), s * 0.6);
      }
      add(g, new T.Mesh(new T.BoxGeometry(0.012, px(16), 0.34), HZ), -0.1, D + px(18), 0.598);
      const sg = new T.Mesh(new T.BoxGeometry(0.28, px(14), 0.012), HZ); add(g, sg, 0.12, D + px(21), 0.597);
    } else if (name === 'deck') {
      // the end bolted to the catwalk's deck (at +x): a bracket plate with bolts, gate posts, a chain with a hazard sign
      add(g, cbox(0.07, px(30), 1.16, 0.01, BR.steelLt), 0.462, D - px(13), 0);
      for (const y of [-px(4), -px(22)]) for (const z of [-0.42, -0.14, 0.14, 0.42]) add(g, sphere(0.024, BR.steel, 8), 0.5, D + y, z);
      add(g, cbox(0.12, px(2.4), 1.08, 0.006, BR.steelLt), 0.43, D + px(0.2), 0);
      for (const s of [-1, 1]) {
        add(g, cyl(0.035, 0.035, px(46), BR.steelLt, 10), 0.42, D + px(23), s * 0.6);
        add(g, cyl(0.055, 0.05, px(5), BR.dark, 10), 0.42, D + px(48.5), s * 0.6); add(g, sphere(0.05, s > 0 ? BR.amber : BR.teal, 10), 0.42, D + px(53), s * 0.6);
        add(g, cbox(0.06, px(4), 0.06, 0.006, BR.steel), 0.42, D + px(2), s * 0.6);
      }
      g.add(tube([[0.42, D + px(30), -0.6], [0.42, D + px(16), -0.3], [0.42, D + px(12), 0], [0.42, D + px(16), 0.3], [0.42, D + px(30), 0.6]], 0.011, BR.rubber));
      const sg = new T.Mesh(new T.BoxGeometry(0.012, px(15), 0.28), HZ); add(g, sg, 0.42, D + px(6), 0);
      add(g, cbox(0.014, px(15), 0.01, 0.002, BR.dark), 0.425, D + px(6) + px(7), 0.09); add(g, cbox(0.014, px(15), 0.01, 0.002, BR.dark), 0.425, D + px(6) + px(7), -0.09);
    }
    return { g, marks: { deck: [0, D, 0] } };
  };
  PROPS.bridge = { variants: ['mid', 'tank', 'deck'], canvas: [500, 700], build: piece };
}
