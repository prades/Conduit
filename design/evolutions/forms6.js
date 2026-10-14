// ── THE WARPING CRYSTAL · the flux brawler, Nos. 104–106 ──────────────────
// A crystal that holds a ball of invisible energy under it. The ball pushes the floor up into a dome, the
// grid on it stretched over the curve and rippling out past the edge. A crescent halo crowns it.
// (The floor bulges up rather than dipping down: a dip would sit under the ground the sheets draw.)
function warpTex() {   // the floor's grid: lines of longitude and latitude, drawn white for an emissive map
  const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d");
  g.fillStyle = "#000"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "#fff"; g.lineWidth = 3;
  for (let i = 0; i < 16; i++) { const x = (i + 0.5) * 32; g.beginPath(); g.moveTo(x, 0); g.lineTo(x, 512); g.stroke(); }
  for (let j = 0; j < 10; j++) { const y = j * 512 / 10 + 8; g.beginPath(); g.moveTo(0, y); g.lineTo(512, y); g.stroke(); }
  g.lineWidth = 7; g.beginPath(); g.moveTo(0, 505); g.lineTo(512, 505); g.stroke();
  const t = new T.CanvasTexture(c); t.anisotropy = 4; return t;
}
// The floor warped by the ball: a dome of radius R and height H, then ripples running out to 1.35 R.
function warpedFloor(R, H, ripple) {
  const pts = [], N = 56, edge = R * 1.35;
  for (let i = 0; i <= N; i++) { const r = Math.max(0.0001, i / N * edge); let y = r < R ? H * Math.pow(1 - (r / R) * (r / R), 0.7) : (ripple || 0.035) * Math.sin((r - R) * 20) * Math.exp(-(r - R) * 4.5); pts.push(new T.Vector2(r, y + 0.01)); }
  const geo = new T.LatheGeometry(pts, 64);
  const mat = new T.MeshStandardMaterial({ color: 0x040308, emissive: new T.Color(EL.color), emissiveMap: warpTex(), emissiveIntensity: 0.85, metalness: 0.3, roughness: 0.6, side: T.DoubleSide });
  mat.envMapIntensity = 0.25; return new T.Mesh(geo, mat);
}
// A crescent moon: the outer circle (radius R) less a circle shifted up by e (radius R2). Horns up, in the x-y plane.
function crescent(R, R2, e, depth, mat) {
  const yt = (R * R - R2 * R2 + e * e) / (2 * e), xt = Math.sqrt(Math.max(0, R * R - yt * yt)), aR = Math.atan2(yt, xt), N = 28, sh = new T.Shape();
  for (let k = 0; k <= N; k++) { const a = aR - k / N * (PI + 2 * aR); const x = Math.cos(a) * R, y = Math.sin(a) * R; if (k) sh.lineTo(x, y); else sh.moveTo(x, y); }
  const a0 = Math.atan2(yt - e, -xt); let a1 = Math.atan2(yt - e, xt); if (a1 < a0) a1 += TAU;   // the inner arc goes the long way, through the bottom of the cut-out circle
  for (let k = 0; k <= N; k++) { const a = a0 + k / N * (a1 - a0); sh.lineTo(Math.cos(a) * R2, e + Math.sin(a) * R2); }
  const geo = new T.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.008, bevelThickness: 0.008, bevelSegments: 1 }); geo.translate(0, 0, -depth / 2);
  return new T.Mesh(geo, mat || M.gold);
}
function ghostBall(R) {   // three faint great circles: the invisible ball, hinted at
  const g = G(); for (let i = 0; i < 3; i++) { const r = torus(R, 0.006, M.glow, 48); r.rotation.set(i === 0 ? PI / 2 : 0, i === 2 ? PI / 2 : 0, 0); g.add(r); } return g;
}
function _warpDesign(o) {
  const g = G(), b = G(); g.add(b);
  const fl = warpedFloor(o.R, o.H, o.ripple); b.add(fl);
  const top = o.H + o.gap, hov = G(); hov.position.y = top; b.add(hov);
  const cr = hexCrystal(o.cr, o.crh, o.cr * 1.5, M.crystal); cr.position.y = o.crh / 2 + 0.2; hov.add(cr); const cg = glowSprite(0.9); cg.position.y = o.crh / 2 + 0.2; hov.add(cg);
  const collar = hexRing(o.cr * 1.12, 0.035, M.steel); collar.position.y = o.crh * 0.55; hov.add(collar);
  if (o.ghost) { const gb = ghostBall(o.R * 0.95); gb.position.y = -o.gap * 0.2; hov.add(gb); o.ghostRef = gb; }
  const arms = []; for (let i = 0; i < (o.fists || 0); i++) { const f = G(), blk = cbox(0.26, 0.3, 0.34, 0.05, M.armor); f.add(blk); const st = cbox(0.2, 0.02, 0.2, 0.004, M.glow); st.position.y = 0.16; f.add(st); hov.add(f); arms.push(f); }
  const plates = []; for (let i = 0; i < (o.plates || 0); i++) { const p = sheet(0.2, 0.34, i % 2 ? M.armor : M.gun, true); hov.add(p); plates.push(p); }
  const cres = crescent(o.cs, o.cs * 0.8, o.cs * 0.42, 0.045, M.gold); cres.position.y = o.crh + 0.2 + o.csUp; hov.add(cres);
  if (o.csFlat) cres.rotation.x = -PI / 2 + 0.25;
  const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, top + 0.6, 0.7); b.add(L); LIGHTS.push(L);
  return { g, core: top + o.crh / 2 + 0.2, update(t, act) {
    fl.rotation.y = t * 1.6 / 16; hov.position.y = top + bob(t, 0, 0.03) + 0.04 * (act || 0);
    arms.forEach((f, i) => { const a = t * 1.6 * (o.fistSpin || 1) + i * TAU / arms.length; f.position.set(Math.sin(a) * o.fistR, o.crh * 0.35 + 0.1, Math.cos(a) * o.fistR); f.rotation.y = a; });
    plates.forEach((p, i) => { const a = -t * 1.6 + i * TAU / plates.length; p.position.set(Math.sin(a) * 0.5, o.crh * 0.5 + 0.2, Math.cos(a) * 0.5); p.rotation.set(0, a, 0.15); });
    if (o.csFlat) cres.rotation.z = t * 1.6; else cres.rotation.y = t * 1.6 * 0.5 * 2;   // a turn per loop
    if (o.ghostRef) o.ghostRef.rotation.y = t * 1.6 / 4; } };
}
fx(104, "Warped-floor crystal, gauntlets.", () => _warpDesign({ R: 0.95, H: 0.55, gap: 0.25, cr: 0.3, crh: 0.8, cs: 0.5, csUp: 0.35, fists: 2, fistR: 0.62 }));
fx(105, "Warped-floor crystal, ghost ball.", () => _warpDesign({ R: 1.0, H: 0.6, gap: 0.3, cr: 0.32, crh: 0.75, cs: 0.5, csUp: 0.3, ghost: true, plates: 3 }));
fx(106, "Warped-floor crystal, shallow swell.", () => _warpDesign({ R: 1.1, H: 0.35, gap: 0.2, cr: 0.34, crh: 0.85, cs: 0.6, csUp: 0.25, csFlat: true, fists: 2, fistR: 0.7, ripple: 0.05 }));

// ── THE LIQUID BLOB · the flux brawler again, Nos. 107–109 ────────────────
// No ground distortion. A lumpy glass blob with liquid trapped in it, sloshing as it turns; curved armour plates
// revolve round it; three crystal shards float above. The liquid level stays level while the glass turns.
function liquidBlob(R, level) {
  const g = G(), Rin = R * 0.94;
  const glassM = new T.MeshStandardMaterial({ color: new T.Color(EL.color).multiplyScalar(0.5), transparent: true, opacity: 0.3, metalness: 0.1, roughness: 0.05, side: T.DoubleSide, depthWrite: false }); glassM.envMapIntensity = 0.9;
  const gg = new T.SphereGeometry(R, 36, 22), p = gg.attributes.position;
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), n = _hz(Math.round(x * 90), Math.round(y * 90), Math.round(z * 90)), k = 1 + 0.045 * Math.sin(x * 5 + 1) * Math.cos(z * 4) + 0.03 * (n - 0.5); p.setXYZ(i, x * k, y * k, z * k); }
  gg.computeVertexNormals(); const glass = new T.Mesh(gg, glassM); glass.renderOrder = 2; g.add(glass);
  // the liquid: the sphere's lower part up to `level` (relative to the centre), and its surface
  const cosL = Math.max(-1, Math.min(1, -level / Rin)), phiL = Math.acos(cosL), pts = [];
  for (let i = 0; i <= 24; i++) { const ph = i / 24 * phiL; pts.push(new T.Vector2(Math.max(0.0001, Math.sin(ph) * Rin), -Math.cos(ph) * Rin)); }
  const liqM = new T.MeshStandardMaterial({ color: 0x120420, emissive: new T.Color(EL.color).multiplyScalar(0.55), emissiveIntensity: 1.0, metalness: 0.2, roughness: 0.25 });
  const liq = G(); const body = new T.Mesh(new T.LatheGeometry(pts, 32), liqM); liq.add(body);
  const surfM = new T.MeshBasicMaterial({ color: new T.Color(EL.color).lerp(new T.Color(0xffffff), 0.35), toneMapped: false });
  const surf = new T.Mesh(new T.CircleGeometry(Math.sin(phiL) * Rin, 32), surfM); surf.rotation.x = -PI / 2; surf.position.y = level; liq.add(surf); g.add(liq);
  const bubbles = []; for (let i = 0; i < 5; i++) { const b = sphere(0.025 + 0.012 * (i % 3), surfM, 8); g.add(b); bubbles.push(b); }
  g.tick = t => {
    liq.rotation.set(0.12 * Math.sin(1.6 * t), 0, 0.12 * Math.cos(1.6 * t));   // slosh
    bubbles.forEach((b, i) => { const u = ((t * 1.6 / TAU * 1 + i / 5) % 1), a = i * 2.4 + t * 1.6; b.position.set(Math.sin(a) * Rin * 0.45 * (1 - u * 0.4), -Rin * 0.7 + u * (Rin * 0.7 + level - 0.04), Math.cos(a) * Rin * 0.45 * (1 - u * 0.4)); b.scale.setScalar(0.6 + 0.6 * Math.sin(u * PI)); });
  };
  g.tick(0.9); return g;
}
function _blobDesign(o) {
  const g = G(), b = G(); g.add(b); const Y = o.Y, R = o.R;
  const hov = G(); hov.position.y = Y; b.add(hov);
  const blob = liquidBlob(R, o.level); hov.add(blob);
  const plates = []; for (let i = 0; i < 3; i++) { const geo = new T.SphereGeometry(R * 1.07, 18, 8, 0, 0.8, 0.75, 1.25), pl = new T.Mesh(geo, i % 2 ? M.armor : M.gun); pl.material.side = T.DoubleSide; const rim = new T.Mesh(new T.SphereGeometry(R * 1.075, 18, 2, 0.03, 0.74, 1.15, 0.03), M.glow); pl.add(rim); hov.add(pl); plates.push(pl); }
  const cradle = hexRing(R * 0.75, 0.04, M.steel); cradle.position.y = -R * 1.0; hov.add(cradle); const th = thr(0.09); th.position.y = -R * 1.12; hov.add(th);
  const shards = []; for (let i = 0; i < 3; i++) { const s = hexCrystal(o.sr, o.sh, o.sh * 0.6, M.black); const h = G(); h.add(s); const ed = cbox(0.012, o.sh * 0.8, 0.012, 0.002, M.glow); ed.position.set(o.sr * 0.9, 0, 0); h.add(ed); hov.add(h); shards.push(h); }   // black, with a hairline of light down one edge
  let cres = null; if (o.cs) { cres = crescent(o.cs, o.cs * 0.8, o.cs * 0.42, 0.045, M.gold); cres.position.y = R + o.csY; hov.add(cres); if (o.csFlat) cres.rotation.x = -PI / 2 + 0.25; else cres.position.z = -0.1; }
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, Y + 0.2, 0.7); b.add(L); LIGHTS.push(L);
  return { g, core: Y, update(t, act) {
    hov.position.y = Y + bob(t, 0, 0.035) + 0.05 * (act || 0); blob.tick(t); blob.rotation.y = -t * 1.6 * 0.5;
    plates.forEach((p, i) => { p.rotation.y = t * 1.6 + i * TAU / 3; });
    shards.forEach((h, i) => { const a = -t * 1.6 + i * TAU / 3; h.position.set(Math.sin(a) * o.sOrbit, R + o.sUp + 0.04 * Math.sin(t * 3.2 + i * 2), Math.cos(a) * o.sOrbit); h.rotation.set(Math.cos(a) * 0.2, 0, -Math.sin(a) * 0.2); if (o.sDown) h.rotation.z += PI; });
    if (cres) { if (o.csFlat) cres.rotation.z = t * 1.6; else cres.rotation.y = t * 1.6; } } };
}
fx(107, "Liquid blob, shards, flat crescent.", () => _blobDesign({ Y: 0.95, R: 0.6, level: 0.08, sr: 0.07, sh: 0.34, sOrbit: 0.3, sUp: 0.5, cs: 0.45, csY: 0.95, csFlat: true }));
fx(108, "Liquid blob, crown of shards.", () => _blobDesign({ Y: 0.95, R: 0.62, level: -0.05, sr: 0.065, sh: 0.36, sOrbit: 0.26, sUp: 0.62, sDown: true }));
fx(109, "Liquid blob, tall shards, upright crescent.", () => _blobDesign({ Y: 0.9, R: 0.55, level: 0.15, sr: 0.07, sh: 0.4, sOrbit: 0.32, sUp: 0.55, cs: 0.5, csY: 0.95 }));
