// THE WHITEBOARD ON ITS STAND (family 'whiteboard', kind whiteboard_stand; the owner, 2026-11-12: "a whiteboard that's on a stand, on its own stand, that's tilted towards the beanbag chairs ... maybe some
// like equations drawn on the whiteboard"; 2026-11-13, The Lounge mirrored: "the whiteboard is on the other side, pointing towards the player, looking at the slant"; of the one-piece draft, "Looks good").
// A rolling whiteboard: two steel posts on H feet with casters, the board between them on pivots, leaned back a little, a marker tray with markers and an eraser; equations in marker on it.
// Its front faces +z before it is turned: `yaw` (degrees) turns the whole stand (the camera sees fronts that face +x or +z: 0..90 shows the writing; 45 is square to the camera). Variant 'whiteboard_stand'
// (turned 55 degrees: facing the camera at a slant, toward the room's length). Mark: top.
{
  const wc = c => new T.Color(c).convertSRGBToLinear();
  const wStd = (c, m, r) => new T.MeshStandardMaterial({ color: wc(c), metalness: m, roughness: r });
  const WM = { frame: wStd('#c9d4de', 0.75, 0.35), post: wStd('#8a929e', 0.8, 0.35), foot: wStd('#2a3038', 0.5, 0.6), caster: wStd('#121418', 0.2, 0.8), back: wStd('#dfe6ec', 0.1, 0.6), tray: wStd('#aab6c2', 0.7, 0.4) };
  const writing = () => {   // the board's face: white, a faint grid, equations and a sketch in three markers
    const c = document.createElement('canvas'); c.width = 1024; c.height = 640; const g = c.getContext('2d');
    g.fillStyle = '#f7fafc'; g.fillRect(0, 0, 1024, 640); g.strokeStyle = 'rgba(120,150,180,0.12)'; g.lineWidth = 1; for (let x = 0; x < 1024; x += 32) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 640); g.stroke(); } for (let y = 0; y < 640; y += 32) { g.beginPath(); g.moveTo(0, y); g.lineTo(1024, y); g.stroke(); }
    const ink = (t, x, y, s, col, rot) => { g.save(); g.translate(x, y); g.rotate(rot || 0); g.font = 'italic bold ' + s + 'px "DejaVu Sans", sans-serif'; g.fillStyle = col; g.fillText(t, 0, 0); g.restore(); };
    ink('E = mc²', 60, 110, 64, '#1f4fd1', -0.03); ink('∇ · E = ρ / ε₀', 60, 220, 48, '#1f4fd1', -0.02); ink('∫ ψ* ψ dx = 1', 70, 320, 48, '#c62828', 0.01); ink('x = (−b ± √(b²−4ac)) / 2a', 60, 430, 40, '#222831', -0.01);
    // a sketch: axes and a curve, a crystal with its arrows, a circled answer
    g.strokeStyle = '#222831'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(640, 80); g.lineTo(640, 330); g.lineTo(950, 330); g.stroke();
    g.strokeStyle = '#c62828'; g.beginPath(); for (let i = 0; i <= 40; i++) { const x = 640 + i * 7.5, y = 320 - 220 * (1 - Math.exp(-i / 9)); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke();
    g.strokeStyle = '#1f4fd1'; g.lineWidth = 6; g.beginPath(); g.moveTo(800, 420); g.lineTo(850, 480); g.lineTo(800, 560); g.lineTo(750, 480); g.closePath(); g.stroke();
    g.beginPath(); g.moveTo(870, 470); g.lineTo(950, 440); g.moveTo(935, 432); g.lineTo(952, 440); g.lineTo(940, 455); g.stroke(); ink('?!', 960, 450, 44, '#1f4fd1', 0.1);
    g.strokeStyle = '#c62828'; g.lineWidth = 5; g.beginPath(); g.ellipse(250, 545, 190, 52, -0.03, 0, Math.PI * 2); g.stroke(); ink('ψ ≈ 0.42', 110, 562, 44, '#c62828', -0.02);
    const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 4; return new T.MeshBasicMaterial({ map: t, toneMapped: false });
  };
  const board = (yaw) => {
    const g = G(), s = G(), W = 2.0, bh = px(46), by0 = px(30), postH = px(84), lean = 0.18, footL = 0.9;
    // the two posts on H feet with casters
    for (const sx of [-W / 2 - 0.08, W / 2 + 0.08]) {
      const p = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, postH, 10), WM.post); p.position.set(sx, postH / 2 + px(4), 0); s.add(p);
      const f = new T.Mesh(new T.BoxGeometry(0.08, px(3), footL), WM.foot); f.position.set(sx, px(4.5), 0); s.add(f);
      for (const fz of [-footL / 2 + 0.06, footL / 2 - 0.06]) { const w = new T.Mesh(new T.CylinderGeometry(0.06, 0.06, 0.05, 12), WM.caster); w.rotation.z = PI / 2; w.position.set(sx, px(2), fz); s.add(w); }
      const cap = new T.Mesh(new T.SphereGeometry(0.045, 10, 8), WM.post); cap.position.set(sx, postH + px(4), 0); s.add(cap);
    }
    const bar = new T.Mesh(new T.CylinderGeometry(0.025, 0.025, W + 0.16, 8), WM.post); bar.rotation.z = PI / 2; bar.position.set(0, px(14), 0); s.add(bar);
    // the board on its pivots, leaned back: its frame, its back, its written face, the tray
    const piv = G(); piv.position.set(0, by0 + bh / 2, 0); piv.rotation.x = -lean; s.add(piv);
    const fr = new T.Mesh(new T.BoxGeometry(W, bh, 0.06), WM.frame); piv.add(fr);
    const bk = new T.Mesh(new T.PlaneGeometry(W - 0.06, bh - px(2)), WM.back); bk.position.z = -0.031; bk.rotation.y = PI; piv.add(bk);
    const face = new T.Mesh(new T.PlaneGeometry(W - 0.08, bh - px(2.5)), writing()); face.position.z = 0.032; piv.add(face);
    const tray = new T.Mesh(new T.BoxGeometry(W * 0.8, px(1.5), 0.12), WM.tray); tray.position.set(0, -bh / 2 - px(0.5), 0.07); piv.add(tray);
    [['#1f4fd1', -0.3], ['#c62828', -0.12], ['#222831', 0.05]].forEach(([col, x]) => { const m = new T.Mesh(new T.CylinderGeometry(0.018, 0.018, 0.16, 8), wStd(col, 0.2, 0.5)); m.rotation.z = PI / 2; m.position.set(x, -bh / 2 + px(0.6), 0.09); piv.add(m); });
    const er = new T.Mesh(new T.BoxGeometry(0.16, px(2), 0.06), wStd('#2a3038', 0.2, 0.7)); er.position.set(0.35, -bh / 2 + px(0.9), 0.09); piv.add(er);
    s.rotation.y = yaw * PI / 180; g.add(s);
    return { g, marks: { top: [0, postH + px(4), 0] } };
  };
  PROPS.whiteboard = { variants: ['whiteboard_stand'], canvas: [800, 700], exposure: 1.0, build() { return board(55); } };
}
