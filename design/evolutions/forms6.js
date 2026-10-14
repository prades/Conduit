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

// ── THE BARE LIQUID BLOB · the flux brawler, Nos. 110–112 ─────────────────
// No glass: the blob is the liquid itself, glossy and wobbling, held together by revolving metal hoops.
// Three flat black triangles: one orbits, the others revolve (110, 111: round that one; 112: round the blob).
function liquidMass(R) {
  const geo = new T.SphereGeometry(R, 44, 28), base = geo.attributes.position.array.slice();
  const mat = new T.MeshStandardMaterial({ color: 0x070110, emissive: new T.Color(EL.color).multiplyScalar(0.2), emissiveIntensity: 1.0, metalness: 0.3, roughness: 0.06 }); mat.envMapIntensity = 1.6;
  const m = new T.Mesh(geo, mat), p = geo.attributes.position;
  // Drops land on the surface and send a ring of swell out across the mass and back to rest, like rain on water. The
  // blob keeps its shape (the swell is a few percent of its radius); nothing juts out. Each drop repeats once per
  // loop (2π/1.6 s), the four staggered, so the idle loop closes.
  const DROPS = [[0.55, 0.5, 0.67], [-0.3, 0.85, 0.4], [0.9, 0.1, 0.25], [-0.55, 0.05, 0.83]].map(v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; });
  m.wobble = t => {
    for (let i = 0; i < p.count; i++) { const x = base[i * 3] / R, y = base[i * 3 + 1] / R, z = base[i * 3 + 2] / R;
      let k = 1 + 0.012 * Math.sin(1.6 * t + y * 2);   // a slow breath
      for (let d = 0; d < DROPS.length; d++) { const c = DROPS[d], u = ((1.6 * t / TAU + d / DROPS.length) % 1 + 1) % 1, ang = Math.acos(Math.max(-1, Math.min(1, x * c[0] + y * c[1] + z * c[2]))), front = u * 1.5, e = ang - front;
        k += 0.11 * Math.pow(1 - u, 1.2) * Math.cos(e * 7) * Math.exp(-e * e / 0.2); }
      p.setXYZ(i, x * R * k, y * R * k, z * R * k); }
    p.needsUpdate = true; geo.computeVertexNormals(); };
  m.wobble(0.9); return m;
}
function triShard(r) {   // a flat black triangle with a glowing edge
  const g = G(), pr = new T.Mesh(new T.CylinderGeometry(r, r, 0.07, 3), M.black); g.add(pr);
  const ed = new T.Mesh(new T.TorusGeometry(r * 0.8, 0.02, 4, 3), M.glow); ed.rotation.x = PI / 2; ed.position.y = 0.04; g.add(ed);
  const ed2 = ed.clone(); ed2.position.y = -0.04; g.add(ed2);
  g.rotation.x = PI / 2;   // stood up: its face toward +z, like a flat blade
  const holder = G(); holder.add(g); return holder;
}
function _blob2Design(o) {
  const g = G(), b = G(); g.add(b); const Y = o.Y, R = o.R;
  const hov = G(); hov.position.y = Y; b.add(hov);
  const mass = liquidMass(R); hov.add(mass);
  const hoops = []; for (let i = 0; i < 3; i++) { const h = new T.Mesh(new T.TorusGeometry(R * 1.14, 0.028, 6, 24, 1.7), i % 2 ? M.steel : M.gun); const gimbal = G(); gimbal.rotation.set(i * 1.05, 0, i * 0.5); gimbal.add(h); hov.add(gimbal); hoops.push(h); }
  const th = thr(0.09); th.position.y = -R * 1.25; hov.add(th);
  const drops = []; for (let i = 0; i < 2; i++) { const d = new T.Mesh(new T.SphereGeometry(0.05 - i * 0.012, 14, 10), mass.material); hov.add(d); drops.push(d); }
  const A = triShard(o.sr), B = triShard(o.sr * 0.8), C = triShard(o.sr * 0.8); hov.add(A); hov.add(B); hov.add(C);
  let cres = null; if (o.cs) { cres = crescent(o.cs, o.cs * 0.8, o.cs * 0.42, 0.045, M.gold); cres.position.y = R + o.csY; hov.add(cres); if (o.csFlat) cres.rotation.x = -PI / 2 + 0.55; else cres.position.z = -0.1; }
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, Y + 0.2, 0.7); b.add(L); LIGHTS.push(L);
  return { g, core: Y, update(t, act) {
    hov.position.y = Y + bob(t, 0, 0.035) + 0.05 * (act || 0); mass.wobble(t);
    hoops.forEach((h, i) => { h.rotation.z = t * 1.6 * (i % 2 ? -1 : 1) + i * 2; });
    drops.forEach((d, i) => { const a = t * 1.6 * (i ? -1 : 1) + i * 3, rr = R * 1.25; d.position.set(Math.sin(a) * rr, -R * 0.35 + 0.1 * Math.sin(t * 3.2 + i), Math.cos(a) * rr); });
    const a = t * 1.6, ax = Math.sin(a) * o.oR, az = Math.cos(a) * o.oR, ay = R + o.oUp;
    A.position.set(ax, ay, az); A.rotation.y = a;
    if (o.round === 'A') {   // the other two revolve round the first, one turn and a half faster, opposite ways
      const bb = -t * 3.2;
      B.position.set(ax + Math.sin(bb) * o.rR, ay + Math.cos(bb) * o.rR * 0.5, az + Math.cos(bb) * o.rR * 0.8);
      C.position.set(ax - Math.sin(bb) * o.rR, ay - Math.cos(bb) * o.rR * 0.5, az - Math.cos(bb) * o.rR * 0.8);
      B.rotation.y = C.rotation.y = a + bb;
    } else {   // the other two revolve round the blob on an upright orbit, opposite each other
      const bb = t * 3.2 / 2 * 2;
      for (const [S, ph] of [[B, 0], [C, PI]]) { S.position.set(Math.sin(bb + ph) * (R * 1.5) * 0.35, Math.cos(bb + ph) * R * 1.5, Math.sin(bb + ph) * R * 1.5 * 0.94); S.rotation.set(0, bb, 0); }
    }
    if (cres) { if (o.csFlat) cres.rotation.z = t * 1.6; else cres.rotation.y = t * 1.6; } } };
}
fx(110, "Bare liquid blob, triangle with two satellites.", () => _blob2Design({ Y: 0.95, R: 0.6, sr: 0.3, oR: 0.75, oUp: 0.25, rR: 0.42, round: 'A' }));
fx(111, "Bare liquid blob, high orbit, no crescent.", () => _blob2Design({ Y: 0.95, R: 0.6, sr: 0.3, oR: 0.45, oUp: 0.62, rR: 0.42, round: 'A' }));
fx(112, "Bare liquid blob, triangles round the blob.", () => _blob2Design({ Y: 0.95, R: 0.55, sr: 0.28, oR: 0.85, oUp: 0.1, round: 'B' }));

// ── THE GROUND BLOB · the flux brawler, Nos. 113–115 ─────────────────────
// A Ditto-style lump of purple liquid sitting on the ground, flat underneath, squashing and rippling, with solid
// black shards stuck in it and standing round it. No glass, no hoops, nothing floating.
function groundBlob(R, o) {
  const ax = 1.15, ay = o.flat || 0.62, az = 1.05;
  const geo = new T.SphereGeometry(1, 52, 34), base = geo.attributes.position.array.slice(), p = geo.attributes.position;
  const mat = new T.MeshStandardMaterial({ color: 0x1c0630, emissive: new T.Color(EL.color).multiplyScalar(0.3), emissiveIntensity: 1.0, metalness: 0.2, roughness: 0.08, transparent: !!o.clear, opacity: o.clear ? 0.8 : 1 }); mat.envMapIntensity = 1.5;
  const bump = (() => { const v = o.bump || [0.9, 0.05, -0.4], l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; })();
  const DROPS = [[0.4, 0.8, 0.45], [-0.5, 0.7, 0.5], [0.8, 0.45, 0.2]].map(v => { const l = Math.hypot(v[0], v[1], v[2]); return [v[0] / l, v[1] / l, v[2] / l]; });
  const m = new T.Mesh(geo, mat); if (o.clear) m.renderOrder = 2;
  m.wobble = (t, act) => {
    const sq = Math.sin(1.6 * t), ac = act || 0;   // it squashes down and swells out, and back; firing, it slams flat
    for (let i = 0; i < p.count; i++) { const x = base[i * 3], y = base[i * 3 + 1], z = base[i * 3 + 2], az0 = Math.atan2(x, z);
      const bd = Math.acos(Math.max(-1, Math.min(1, x * bump[0] + y * bump[1] + z * bump[2])));
      let k = 1 + 0.09 * Math.sin(2 * az0 + 1) + 0.06 * Math.sin(3 * az0 - 1) * Math.max(0, y + 0.3) + 0.2 * Math.exp(-bd * bd / 0.2);   // lumpy, with one pseudopod
      for (let d = 0; d < DROPS.length; d++) { const c = DROPS[d], u = ((1.6 * t / TAU + d / DROPS.length) % 1 + 1) % 1, ang = Math.acos(Math.max(-1, Math.min(1, x * c[0] + y * c[1] + z * c[2]))), e = ang - u * 1.4;
        k += 0.05 * Math.pow(1 - u, 1.2) * Math.cos(e * 7) * Math.exp(-e * e / 0.2); }
      p.setXYZ(i, x * R * ax * k * (1 - 0.03 * sq + 0.14 * ac), Math.max(0, y) * R * ay * k * (1 + 0.06 * sq - 0.3 * ac), z * R * az * k * (1 - 0.03 * sq + 0.14 * ac)); }   // below the ground it is flat
    p.needsUpdate = true; geo.computeVertexNormals(); };
  m.wobble(0.9); m.dims = [R * ax, R * ay, R * az]; return m;
}
const _bladeMat = new T.MeshStandardMaterial({ color: 0x0b0b10, metalness: 0.9, roughness: 0.22 }); _bladeMat.envMapIntensity = 1.6;   // black, but it catches the light along its edges
function blade(w, h, d) {   // a solid black triangular shard, standing on its base
  const sh = new T.Shape(); sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w * 0.12, h); sh.lineTo(-w / 2, 0);
  const geo = new T.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 1 }); geo.translate(0, 0, -d / 2);
  const m = new T.Mesh(geo, _bladeMat); const g = G(); g.add(m); return g;
}
function _groundDesign(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);   // (the game sprite wants it bigger in its cell)
  const R = o.R, mass = groundBlob(R, o); mass.position.y = 0.03; b.add(mass);
  // A flat skirt of the same liquid spread round the lump: it lies on the floor (tagged ground, so the game paints it under every unit).
  const skirt = o.skirt ? slurryPool(o.skirt, o.skirtSeed || 1.7, 1, mass.material, new T.MeshStandardMaterial({ color: 0x0c0218, metalness: 0.2, roughness: 0.3 })) : null; if (skirt) b.add(skirt);
  const parts = [];   // [shard, x, y, z, rotX, rotY, rotZ]
  for (const s of o.shards) { const sh = blade(s.w * 1.2, s.h, s.d || 0.1); sh.position.set(s.x, s.y, s.z); sh.rotation.set(s.rx || 0, s.ry || 0, s.rz || 0); b.add(sh); parts.push({ sh, y0: s.y, inBlob: !!s.inBlob, rz: s.rz || 0 }); }
  const eyes = []; if (o.face) for (const sx of [-1, 1]) { const e = sphere(0.045, M.black, 12); e.scale.set(1, 1.3, 0.5); b.add(e); eyes.push([e, sx]); }
  const mouth = o.face ? cbox(0.2, 0.018, 0.02, 0.004, M.black) : null; if (mouth) b.add(mouth);
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, 0.9, 0.9); b.add(L); LIGHTS.push(L);
  return { g, core: R * 0.4 * (o.S || 1), update(t, act) {
    mass.wobble(t, act); if (skirt) skirt.shift(t); const sq = Math.sin(1.6 * t), up = 1 + 0.06 * sq - 0.3 * (act || 0);
    parts.forEach((q, i) => { if (q.inBlob) { q.sh.position.y = q.y0 * up; q.sh.rotation.z = q.rz + 0.04 * Math.sin(1.6 * t + i); } });
    const [dx, dy, dz] = mass.dims;   // the face sits on the front of the lump
    eyes.forEach(([e, sx]) => { e.position.set(sx * dx * 0.28, dy * 0.72 * up, dz * 0.82); });
    if (mouth) mouth.position.set(0, dy * 0.52 * up, dz * 0.9); } };
}
const _SH_A = [   // shards stuck in the top, and standing round the base
  { x: 0.05, y: 0.12, z: -0.05, w: 0.28, h: 0.85, rx: 0.1, rz: 0.22, inBlob: true }, { x: -0.38, y: 0.14, z: 0.15, w: 0.22, h: 0.62, rx: -0.2, rz: -0.45, inBlob: true }, { x: 0.38, y: 0.14, z: 0.2, w: 0.22, h: 0.55, rx: 0.25, rz: 0.5, inBlob: true },
  { x: 1.12, y: 0, z: 0.2, w: 0.2, h: 0.55, rz: 0.12, ry: 0.4 }, { x: -1.0, y: 0, z: -0.5, w: 0.24, h: 0.7, rz: -0.18, ry: -0.5 }, { x: 0.2, y: 0, z: -1.05, w: 0.2, h: 0.45, rz: 0.3, ry: 1.2 },
  { x: -0.55, y: 0.05, z: 1.0, w: 0.2, h: 0.4, rz: 1.45, ry: 0.3 }];
fx(113, "Ground blob with a face.", () => _groundDesign({ R: 0.75, S: 1.3, face: true, shards: _SH_A }));
fx(114, "Ground blob, bigger shards.", () => _groundDesign({ R: 0.78, S: 1.3, skirt: 0.8, flat: 0.55, bump: [-0.8, 0.05, 0.5], shards: [
  { x: -0.1, y: 0.1, z: 0, w: 0.34, h: 1.1, rx: 0.08, rz: 0.15, inBlob: true }, { x: 0.45, y: 0.12, z: -0.2, w: 0.28, h: 0.78, rx: -0.2, rz: 0.55, inBlob: true },
  { x: -1.1, y: 0, z: 0.3, w: 0.28, h: 0.8, rz: -0.15, ry: 0.4 }, { x: 0.9, y: 0, z: 0.75, w: 0.26, h: 0.65, rz: 0.2, ry: -0.6 }] }));
fx(115, "Ground blob, see-through, shards inside.", () => _groundDesign({ R: 0.8, flat: 0.7, clear: true, face: true, shards: [
  { x: 0, y: 0.04, z: 0, w: 0.3, h: 0.7, rz: 0.2, inBlob: true }, { x: -0.4, y: 0.04, z: 0.1, w: 0.24, h: 0.5, rz: -0.5, inBlob: true }, { x: 0.4, y: 0.04, z: -0.15, w: 0.24, h: 0.5, rz: 0.6, inBlob: true },
  { x: 1.1, y: 0, z: 0.3, w: 0.22, h: 0.6, rz: 0.1, ry: 0.5 }, { x: -1.05, y: 0, z: -0.4, w: 0.24, h: 0.65, rz: -0.2, ry: -0.4 }, { x: 0.3, y: 0, z: 1.1, w: 0.2, h: 0.4, rz: 0.25, ry: 2.2 }] }));
