// THE HAZARD CONTAINERS (build 2026-11-09yy; docs/FACILITY.md, "Hazard containers"). The owner, 2026-11-10: "containers on the map that contain explosives ... and some that contain acid, I guess, or like corrosive
// material, and the flux move can work on it"; of ten designs, "I like 8 and 10. Do you think you can combine those two together somehow?"; of the four combinations, "4 Flask in hex armour".
// One tile each (a barrel's footprint): a round glass flask full of a glowing charge, its lower half sunk in a six-sided armoured cup in the hazard colour (steel edges, a warning plate on the face the camera
// sees), its glass shoulder and neck above with a clamp, a stopper and a lamp. Variants (named by the prop's kind, js/propsprites.js PS_FAMILY):
//   hazard_explosive   a glowing orange charge with bright sparks, a red-orange cup, a warning plate with a black burst, a red lamp
//   hazard_corrosive   a glowing acid green with bubbles at the glass, an olive cup, a plate with a black drip, a green lamp
// marks: lamp (the lamp on the stopper), glass (the middle of the bulb, where the game paints the charge's pulse).
// Everything is in a block: the helpers must not collide with the other families'.
{
  const FACE = PI / 4, ROT = PI / 12, rnd = i => { const x = Math.sin(i * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const flat = m => { m.rotation.x = PI / 2; return m; };
  const ON = (r, a) => [Math.sin(a) * r, Math.cos(a) * r];
  const rod = (a, b, r, mat) => { const d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), L = d.length(); const m = new T.Mesh(new T.CylinderGeometry(r, r, L, 8), mat); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m; };
  const steel = STY.mat.steel, steelDk = STY.std('#2c333c', 0.8, 0.42);
  const flaskM = new T.MeshStandardMaterial({ color: STY.col('#e4f3fa'), transparent: true, opacity: 0.3, metalness: 0.1, roughness: 0.03, depthWrite: false, envMapIntensity: 2.0, side: T.DoubleSide });
  const lipM = STY.glow('#eaffff', 0.7);
  const bubbleM = new T.MeshStandardMaterial({ color: STY.col('#e8ffd0'), transparent: true, opacity: 0.85, metalness: 0, roughness: 0.1, emissive: STY.col('#8cff3a'), emissiveIntensity: 0.6 });
  // a warning plate: a diamond in the hazard colour with a black glyph (a burst, or a drip), on a canvas
  const plateTex = (hex, glyph) => { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); g.fillStyle = '#14181d'; g.fillRect(0, 0, 64, 64);
    g.fillStyle = hex; g.beginPath(); g.moveTo(32, 3); g.lineTo(61, 32); g.lineTo(32, 61); g.lineTo(3, 32); g.closePath(); g.fill(); g.fillStyle = '#14181d';
    if (glyph === 'burst') { g.beginPath(); for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 7 : 16; g.lineTo(32 + Math.cos(a) * r, 33 + Math.sin(a) * r); } g.closePath(); g.fill(); }
    else { g.beginPath(); g.moveTo(32, 14); g.bezierCurveTo(40, 28, 44, 34, 44, 40); g.arc(32, 40, 12, 0, Math.PI); g.bezierCurveTo(20, 34, 24, 28, 32, 14); g.fill(); }
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; };
  const KIND = {
    hazard_explosive: { fill: STY.glow('#ff7a1a', 1.05), hot: STY.glow('#ffe08a', 1.25), accent: STY.std('#c4441c', 0.45, 0.42), lamp: STY.glow('#ff4a3a', 1.25), plate: '#ff8a1a', glyph: 'burst' },
    hazard_corrosive: { fill: STY.glow('#8cff3a', 0.95), hot: bubbleM, accent: STY.std('#5e7a1e', 0.4, 0.45), lamp: STY.glow('#7dff3a', 1.15), plate: '#c6f03a', glyph: 'drip' },
  };
  // six-sided pieces, turned so a face looks at the camera: a prism or a frustum (rTop, rBottom, from y0 to y1 in game px)
  const hex = (rt, rb, y0, y1, m) => { const c = new T.Mesh(new T.CylinderGeometry(rt, rb, px(y1 - y0), 6), m); c.rotation.y = ROT; return at(c, 0, px((y0 + y1) / 2), 0); };
  const vert = (i, r, y) => { const [x, z] = ON(r, ROT + i * PI / 3); return [x, px(y), z]; };
  // the round flask (radius in tiles, height in game px): its glass, and the glow it holds
  const GLASS = [[0, 4.6], [0.19, 5], [0.29, 12], [0.305, 21], [0.27, 31], [0.17, 39], [0.1, 45], [0.09, 47]], FILL = [[0, 5.2], [0.18, 5.6], [0.262, 11.5], [0.284, 20], [0.25, 29], [0.18, 34], [0, 34]];
  const lathe = (q, m) => new T.Mesh(new T.LatheGeometry(q.map(([r, h]) => new T.Vector2(Math.max(0.0001, r), px(h))), 48), m);
  const bulbR = y => { for (let i = 1; i < GLASS.length; i++) if (y <= GLASS[i][1]) { const [r0, y0] = GLASS[i - 1], [r1, y1] = GLASS[i]; return r0 + (r1 - r0) * (y - y0) / (y1 - y0); } return 0.09; };

  PROPS.hazard = { variants: ['hazard_explosive', 'hazard_corrosive'], canvas: [300, 380], exposure: 0.95, build(name) {
    const k = KIND[name], g = G();
    // the charge, and its sparks (or bubbles) in the half the camera sees, over the cup
    g.add(lathe(FILL, k.fill));
    for (let i = 0; i < 7; i++) { const a = -0.3 + 2.2 * rnd(271 + i), y = 20 + 13 * rnd(311 + i), [x, z] = ON(Math.max(0.04, bulbR(y) - 0.02), a); g.add(at(new T.Mesh(new T.SphereGeometry(0.009 + 0.011 * rnd(351 + i), 8, 6), k.hot), x, px(y), z)); }
    g.add(lathe(GLASS, flaskM)); g.add(at(flat(torus(0.1, 0.008, lipM, 24)), 0, px(45), 0));
    // the armoured cup: a steel foot, the six-sided cup in the hazard colour, a steel rim, steel edges
    g.add(hex(0.33, 0.35, 0, 4, steelDk)); g.add(hex(0.335, 0.32, 4, 19, k.accent)); g.add(hex(0.345, 0.345, 18, 20.5, steelDk));
    for (let i = 0; i < 6; i++) g.add(rod(vert(i, 0.335, 4), vert(i, 0.335, 19), 0.014, steelDk));
    { const pl = new T.Mesh(new T.PlaneGeometry(0.15, px(11)), new T.MeshStandardMaterial({ map: plateTex(k.plate, k.glyph), metalness: 0.1, roughness: 0.6 })); pl.rotation.y = FACE; const [x, z] = ON(0.327 * Math.cos(PI / 6) + 0.006, FACE); g.add(at(pl, x, px(11.5), z)); }
    // the neck: glass, a clamp and its arm, the stopper in the hazard colour, a valve stem and the lamp
    g.add(at(new T.Mesh(new T.CylinderGeometry(0.09, 0.1, px(10), 24, 1, true), flaskM), 0, px(51), 0)); g.add(at(flat(torus(0.093, 0.008, lipM, 24)), 0, px(56), 0));
    g.add(at(flat(torus(0.105, 0.02, steel, 24)), 0, px(53), 0)); g.add(rod([0.1, px(53), 0.02], [0.3, px(53), -0.2], 0.018, steelDk));
    g.add(at(cyl(0.1, 0.085, px(6), k.accent, 20), 0, px(58), 0)); g.add(at(cyl(0.025, 0.025, px(5), steel, 8), 0, px(63), 0));
    g.add(at(new T.Mesh(new T.SphereGeometry(0.032, 14, 10), k.lamp), 0, px(66.5), 0));
    return { g, marks: { lamp: [0, px(66.5), 0], glass: [0, px(24), 0] } };
  } };
}
