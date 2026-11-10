// THE CRYSTAL'S TANK (build 2026-11-09xx; the owner, 2026-11-10, of the Crystal Chamber: "Remove the cap/roof and the columns. I want want oval tank that bubbles"; of the draft: "No hoops, plain glass"; and "The crystal
// should rise within it"). An upright oval of plain glass seated in the crystal pad's well (the crystalpad family's `pad`, under it). Two variants, so that the crystal, drawn live (js/game.js), is INSIDE it:
//   back    the glass's far wall (the inside of it, seen through the near wall) and the slim steel collar it sits in: drawn after the pad, before the liquid and the crystal (js/facilitystyle.js _fpTankBack;
//           the collar is under the liquid, which stands over its far half where the glass's foot goes into it)
//   front   the glass's near wall (its outside: the reflections, a highlight): drawn after the crystal and the bubbles (js/facilitystyle.js _fpStyleTankFront)
// The liquid, its surface and the bubbles are painted live between the two (js/facilitystyle.js FP_TANK, which keeps the same numbers as TK below). marks: top (the oval's top), mid (its middle).
// Everything is in a block: the helpers must not collide with the other families'.
{
  const TK = { r: 0.56, z0: 26, z1: 192 };   // the oval's half-width at its widest (tiles), its foot and its top (game px): js/facilitystyle.js FP_TANK has the same
  const zc = px((TK.z0 + TK.z1) / 2), hz = px((TK.z1 - TK.z0) / 2);
  const rAt = (y) => { const t = (y - zc) / hz; return t * t >= 1 ? 0 : TK.r * Math.sqrt(1 - t * t); };
  const lathe = (yA, yB, mat, n) => { const pts = []; n = n || 56; for (let i = 0; i <= n; i++) { const y = yA + (yB - yA) * i / n; pts.push(new T.Vector2(Math.max(0.0001, rAt(y)), y)); } return new T.Mesh(new T.LatheGeometry(pts, 64), mat); };
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const glassFar = new T.MeshStandardMaterial({ color: STY.col('#cfeff8'), transparent: true, opacity: 0.2, metalness: 0.15, roughness: 0.04, depthWrite: false, envMapIntensity: 1.5, side: T.BackSide });
  const glassNear = new T.MeshStandardMaterial({ color: STY.col('#e6faff'), transparent: true, opacity: 0.14, metalness: 0.2, roughness: 0.02, depthWrite: false, envMapIntensity: 2.4, side: T.FrontSide });
  const steelM = STY.std('#9aa6b4', 0.92, 0.28), darkM = STY.std('#20262e', 0.8, 0.4), bandM = STY.glow('#31e8ff', 1.0);
  const hiM = new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, toneMapped: false, depthWrite: false });

  PROPS.crystaltank = { variants: ['back', 'front'], canvas: [260, 480], exposure: 0.95, build(name) {
    const g = G();
    if (name === 'back') {
      g.add(lathe(px(TK.z0), px(TK.z1), glassFar));
      // the collar the glass sits in: a dark foot in the pad's well, a slim steel ring, a lit band
      g.add(at(cyl(TK.r * 0.78, TK.r * 0.84, px(5), darkM, 48), 0, px(TK.z0 - 1), 0));
      g.add(at(cyl(TK.r * 0.73, TK.r * 0.77, px(5), steelM, 48), 0, px(TK.z0 + 3.5), 0));
      const band = torus(TK.r * 0.735, 0.01, bandM, 56); band.rotation.x = PI / 2; g.add(at(band, 0, px(TK.z0 + 3.5), 0));
    } else {
      g.add(lathe(px(TK.z0), px(TK.z1), glassNear));
      // a long soft highlight down the near wall's left side (where the room's key light catches the glass), and a short one on its right
      for (const [ang, f0, f1, w] of [[1.95, 0.16, 0.86, 0.011], [0.42, 0.3, 0.62, 0.007]]) {
        const pts = []; for (let i = 0; i <= 24; i++) { const y = px(TK.z0 + (TK.z1 - TK.z0) * (f0 + (f1 - f0) * i / 24)), r = rAt(y) + 0.004; pts.push(new T.Vector3(Math.cos(ang) * r, y, Math.sin(ang) * r)); }
        g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 48, w, 6, false), hiM));
      }
    }
    return { g, marks: { top: [0, px(TK.z1), 0], mid: [0, zc, 0] } };
  } };
}
