// THE DEFAULT CHEST (docs/CHESTS.md). The owner, 2026-11-12: "Also would like to create a default chest that players can find booster packs and other miscellaneous items within"; of three looks
// (design/props/drafts/chest.js), "I like the sea chess" (read as the C chest): THE HEX CACHE, a squat six-sided cache in the hazard flasks' and THE CORE's hex language. One tile. Variants:
//   chest          shut and full: a violet ring of light on its lid, a green lamp on its middle face
//   chest.open     the moment it opens: the lid lifted off, hovering on a violet light, a booster pack standing in the light, an item or two below it (the look the owner chose)
//   chest.empty    opened and emptied: the lid set back askew on the rim, its light and lamp out
// Everything is in a block: the helpers must not collide with the other families'.
{
  const ROT = PI / 12, FACE = PI / 4;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const mat = STY.mat, amber = STY.std('#f2b13a', 0.55, 0.32);
  // a booster pack: a foil packet, its face a gradient with a diamond on it, a crimped silver top
  const packTex = (a, b) => { const c = document.createElement('canvas'); c.width = 64; c.height = 96; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 64, 96); gr.addColorStop(0, a); gr.addColorStop(1, b);
    g.fillStyle = gr; g.fillRect(0, 0, 64, 96); g.fillStyle = '#c9d4de'; g.fillRect(0, 0, 64, 9); g.fillRect(0, 88, 64, 8); g.fillStyle = '#ffffff'; g.beginPath(); g.moveTo(32, 26); g.lineTo(48, 48); g.lineTo(32, 70); g.lineTo(16, 48); g.closePath(); g.fill();
    g.fillStyle = '#f2b13a'; g.beginPath(); g.moveTo(32, 36); g.lineTo(41, 48); g.lineTo(32, 60); g.lineTo(23, 48); g.closePath(); g.fill(); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; return t; };
  const pack = () => { const side = STY.std('#c9d4de', 0.6, 0.3), face = new T.MeshStandardMaterial({ map: packTex('#9a5cff', '#3a7bff'), metalness: 0.35, roughness: 0.3, emissive: STY.col('#3a2a6a'), emissiveIntensity: 0.25 });
    return new T.Mesh(new T.BoxGeometry(0.2, px(16), 0.025), [side, side, side, side, face, side]); };
  const ammo = () => { const g = G(); g.add(at(cbox(0.16, px(5), 0.1, 0.01, STY.std('#c98a4a', 0.2, 0.6)), 0, px(2.5), 0)); g.add(at(cbox(0.165, px(1.2), 0.105, 0.003, mat.graphite), 0, px(3.4), 0)); return g; };
  const vial = hex => { const g = G(); g.add(at(cyl(0.035, 0.035, px(9), STY.glow(hex, 0.85), 12), 0, px(4.5), 0)); g.add(at(cyl(0.04, 0.04, px(2), mat.steel, 12), 0, px(9.5), 0)); return g; };
  const sparkle = (g, pts) => { for (const [x, y, z, r] of pts) g.add(at(new T.Mesh(new T.SphereGeometry(r, 8, 6), STY.glow('#fff4c8', 1.2)), x, px(y), z)); };
  const lightIn = (w, d, y, hex) => { const m = new T.Mesh(new T.PlaneGeometry(w, d), STY.glow(hex, 0.8)); m.rotation.x = -PI / 2; return at(m, 0, px(y), 0); };

  function chest(state) {
    const g = G(), R = 0.4, BODY = 14, lidY = 5.4 + BODY, open = state === 'open', empty = state === 'empty';
    const hex = (rt, rb, y0, y1, m) => { const c = new T.Mesh(new T.CylinderGeometry(rt, rb, px(y1 - y0), 6), m); c.rotation.y = ROT; return at(c, 0, px((y0 + y1) / 2), 0); };
    g.add(hex(R + 0.03, R + 0.05, 0, 4, mat.graphite));                                          // the foot
    g.add(hex(R, R + 0.02, 4, 4 + BODY, mat.laminate));                                           // the body
    // teal panels on the three faces the camera sees, an amber diamond on the middle one
    for (let i = 0; i < 3; i++) { const a = FACE + (i - 1) * PI / 3, pl = cbox(0.3, px(BODY - 5), 0.01, 0.003, i === 1 ? mat.tealDk : mat.teal); pl.rotation.y = a; const rr = R * Math.cos(PI / 6) + 0.012; g.add(at(pl, Math.sin(a) * rr, px(4 + BODY / 2), Math.cos(a) * rr)); }
    { const d = cbox(0.07, 0.07, 0.01, 0.002, amber); d.rotation.set(0, FACE, PI / 4); const rr = R * Math.cos(PI / 6) + 0.02; g.add(at(d, Math.sin(FACE) * rr, px(4 + BODY / 2), Math.cos(FACE) * rr)); }
    g.add(hex(R + 0.025, R + 0.025, 4 + BODY, lidY, amber));                                      // the amber rim
    // the lid: a six-sided cap with a ring of light on top (violet while full, out when emptied)
    const lid = G(), lh = (rt, rb, y0, y1, m) => { const c = new T.Mesh(new T.CylinderGeometry(rt, rb, px(y1 - y0), 6), m); c.rotation.y = ROT; return at(c, 0, px((y0 + y1) / 2), 0); };
    lid.add(lh(R * 0.72, R + 0.01, 0, 6, mat.laminate)); lid.add(lh(R * 0.5, R * 0.56, 6, 7.4, empty ? mat.steelDk : STY.glow('#b57bff', 1.1))); lid.add(lh(R * 0.36, R * 0.4, 7.4, 8.2, mat.steelDk));
    if (open) { lid.position.set(-0.08, px(lidY + 22), -0.12); lid.rotation.set(-0.45, 0.3, 0.12); }
    else if (empty) { lid.position.set(-0.06, px(lidY + 2.2), -0.1); lid.rotation.set(-0.22, 0.42, 0.1); }   // set back askew on the rim
    else lid.position.set(0, px(lidY), 0);
    g.add(lid);
    const lampAt = [Math.sin(FACE) * (R * Math.cos(PI / 6) + 0.025), px(4 + BODY - 2.5), Math.cos(FACE) * (R * Math.cos(PI / 6) + 0.025)];
    if (open) {
      g.add(lightIn(R * 1.5, R * 1.5, lidY - 1, '#d9b8ff'));
      const beam = new T.Mesh(new T.CylinderGeometry(R * 0.62, R * 0.82, px(18), 6, 1, true), new T.MeshBasicMaterial({ color: STY.col('#b57bff'), transparent: true, opacity: 0.32, side: T.DoubleSide, depthWrite: false, toneMapped: false })); beam.rotation.y = ROT; g.add(at(beam, 0, px(lidY + 9), 0));
      const p = pack(); p.rotation.set(0, 0.55, 0.06); g.add(at(p, 0, px(lidY + 4.5), 0.02));
      g.add(at(ammo(), 0.17, px(lidY - 3.5), 0.08)); g.add(at(vial('#43e0a8'), -0.18, px(lidY - 7), 0.1));
      sparkle(g, [[0.12, lidY + 11, 0.1, 0.018], [-0.16, lidY + 7, 0.05, 0.014], [0.05, lidY + 15, -0.08, 0.012]]);
    } else g.add(at(new T.Mesh(new T.SphereGeometry(0.026, 12, 8), empty ? mat.steelDk : STY.glow('#43e0a8', 1.2)), ...lampAt));
    return { g, marks: { lamp: lampAt } };
  }

  PROPS.chest = { variants: ['chest', 'chest.open', 'chest.empty'], canvas: [220, 260], exposure: 1.0, build(name) {
    return chest(name === 'chest.open' ? 'open' : name === 'chest.empty' ? 'empty' : 'shut');
  } };
}
