// ── THE ORB BRAWLER · the electric brawler, Nos. 727–: from the reference sheet: a sphere with an EXPOSED glowing diamond core, ONE sparse band of big square tread blocks rolling round its middle, curved segmented shell plates on each side with gaps that show the core, and two forward-slanted ear housings on top with lit faces and a bolt of static between them. ──
const _obBlackL = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.2, roughness: 0.8, flatShading: true }); _obBlackL.envMapIntensity = 0.15;
const _obTreadL = new T.MeshStandardMaterial({ color: 0x050507, metalness: 0.25, roughness: 0.7, flatShading: true }); _obTreadL.envMapIntensity = 0.25;
const _obBlackD = new T.MeshStandardMaterial({ color: 0x000001, metalness: 0.05, roughness: 1, flatShading: true }); _obBlackD.envMapIntensity = 0.04;
const _obTreadD = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.05, roughness: 1, flatShading: true }); _obTreadD.envMapIntensity = 0.06;
function _bpod(o, sx, lit, dim, lc, frame, R, _obBlack, _obTread) {   // one booster bracket: its housing, its nozzle(s), coil lights and ion stream(s); rear anchor at z = -len*0.62 for every kind
  const B = o.boost, K = B.kind || 'barrel', bl = B.len, br = B.r, eg2 = G(); eg2.position.set(sx * o.earX, R + 0.02, o.earZ); eg2.rotation.set(-o.earTilt, 0, -sx * o.earSplay); frame.add(eg2);
  const rearZ = K === 'trap' ? -B.L1 * 0.62 : K === 'strap' ? -B.T * 0.5 - 0.03 : K === 'drop' ? Math.sin(B.th1 * (B.back ? -1 : 1)) * (R + B.T * 0.4) : -bl * 0.62, coils = [], plumes = [];
  const addPlume = (x, y, rr, kk) => { [[1.0, 0.35], [0.55, 0.6]].forEach(([k, op], pi) => { const pl = new T.Mesh(new T.ConeGeometry(rr * k, B.plume * k * kk, 8, 1, true), new T.MeshBasicMaterial({ color: pi ? lit.clone().lerp(new T.Color(1, 1, 1), 0.5).getHex() : lc.getHex(), transparent: true, opacity: op, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, side: T.DoubleSide })); pl.rotation.x = -PI / 2; pl.position.set(x, y, rearZ - B.plume * k * kk * 0.5); eg2.add(pl); plumes.push({ pl, k, op, len: B.plume * k * kk }); }); };
  const litMat = () => new T.MeshBasicMaterial({ color: lit.getHex(), toneMapped: false });
  const ring = (z, rad, tube) => { const co = new T.Mesh(new T.TorusGeometry(rad, tube || 0.016, 4, 12), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); co.position.z = z; eg2.add(co); coils.push(co); return co; };
  let face = new T.Mesh(new T.BoxGeometry(0.01, 0.01, 0.01), litMat()); face.visible = false; eg2.add(face);
  if (K === 'barrel') {
    const pts = [[br * 0.45, 0], [br * 0.8, bl * 0.12], [br, bl * 0.4], [br, bl * 0.8], [br * 0.7, bl], [0.001, bl * 1.02]].map(q => new T.Vector2(q[0], q[1] - bl / 2)), bar = new T.Mesh(new T.LatheGeometry(pts, 8), _obTread); bar.rotation.x = PI / 2; eg2.add(bar);
    const bell = new T.Mesh(new T.CylinderGeometry(br * 0.72, br * 1.25, bl * 0.24, 8, 1, true), _obBlack); bell.rotation.x = PI / 2; bell.position.z = -bl * 0.52; bell.material.side = T.DoubleSide; eg2.add(bell);
    const mouth = new T.Mesh(new T.CircleGeometry(br * 1.15, 8), litMat()); mouth.rotation.y = PI; mouth.position.z = rearZ; eg2.add(mouth);
    for (let i = 0; i < B.coils; i++) ring(-bl * 0.3 + i * bl * 0.62 / Math.max(1, B.coils), br * 1.02);
    for (const fy of [-1, 1]) { const fin = new T.Mesh(new T.BoxGeometry(0.014, br * 1.1, bl * 0.34), _obBlack); fin.position.set(fy * br * 0.95, 0, -bl * 0.3); eg2.add(fin); }
    face = new T.Mesh(new T.BoxGeometry(br * 0.8, 0.012, bl * 0.45), litMat()); face.position.set(0, br * 0.98, bl * 0.12); eg2.add(face); addPlume(0, 0, br * 1.0, 1);
  } else if (K === 'twin') {   // a fat pod with TWO small tail nozzles side by side
    const bar = new T.Mesh(new T.CylinderGeometry(br * 0.7, br * 1.1, bl * 0.9, 6, 1), _obTread); bar.rotation.x = PI / 2; bar.position.z = 0; bar.scale.x = 1.3; eg2.add(bar);
    for (const nx of [-1, 1]) { const nz = new T.Mesh(new T.CylinderGeometry(br * 0.34, br * 0.55, bl * 0.28, 6, 1, true), _obBlack); nz.rotation.x = PI / 2; nz.position.set(nx * br * 0.6, 0, -bl * 0.52); nz.material.side = T.DoubleSide; eg2.add(nz); const mo = new T.Mesh(new T.CircleGeometry(br * 0.5, 6), litMat()); mo.rotation.y = PI; mo.position.set(nx * br * 0.6, 0, rearZ); eg2.add(mo); addPlume(nx * br * 0.6, 0, br * 0.55, 0.9); }
    for (let i = 0; i < 3; i++) { const bd = new T.Mesh(new T.BoxGeometry(br * 2.7, 0.014, 0.03), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); bd.position.set(0, br * 0.78, -bl * 0.25 + i * bl * 0.2); eg2.add(bd); coils.push(bd); }
    face = new T.Mesh(new T.BoxGeometry(br * 1.6, 0.012, bl * 0.4), litMat()); face.position.set(0, br * 0.9, bl * 0.2); eg2.add(face);
  } else if (K === 'cradle') {   // an open frame: a U-shaped cradle holding a slim thruster tube, struts and cross-braces showing
    const tube = new T.Mesh(new T.CylinderGeometry(br * 0.55, br * 0.55, bl, 8, 1), _obTread); tube.rotation.x = PI / 2; eg2.add(tube);
    for (const fx of [-1, 1]) { const rail = new T.Mesh(new T.BoxGeometry(0.03, 0.03, bl * 1.05), _obBlack); rail.position.set(fx * br * 1.2, -br * 0.4, 0); eg2.add(rail); const up = new T.Mesh(new T.BoxGeometry(0.03, br * 1.0, 0.03), _obBlack); up.position.set(fx * br * 1.2, 0, bl * 0.4); eg2.add(up); const up2 = up.clone(); up2.position.z = -bl * 0.3; eg2.add(up2); }
    for (let i = 0; i < 3; i++) { const bar = new T.Mesh(new T.BoxGeometry(br * 2.5, 0.025, 0.025), _obBlack); bar.position.set(0, -br * 0.4, -bl * 0.4 + i * bl * 0.4); eg2.add(bar); }
    const bell = new T.Mesh(new T.CylinderGeometry(br * 0.8, br * 1.5, bl * 0.3, 8, 1, true), _obBlack); bell.rotation.x = PI / 2; bell.position.z = -bl * 0.55; bell.material.side = T.DoubleSide; eg2.add(bell); const mo = new T.Mesh(new T.CircleGeometry(br * 1.4, 8), litMat()); mo.rotation.y = PI; mo.position.z = rearZ; eg2.add(mo);
    for (let i = 0; i < B.coils; i++) ring(-bl * 0.3 + i * bl * 0.6 / Math.max(1, B.coils), br * 0.6, 0.02); addPlume(0, 0, br * 1.3, 1);
  } else if (K === 'prism') {   // the reference's ear: a faceted slab housing with a big lit face, and a flat ion-grid disc for a nozzle
    const slab = new T.Mesh(new T.BoxGeometry(br * 2.2, br * 1.3, bl), _obTread); eg2.add(slab); const wedge = new T.Mesh(new T.CylinderGeometry(br * 0.2, br * 1.1, bl * 0.25, 4, 1), _obBlack); wedge.rotation.x = PI / 2; wedge.rotation.z = PI / 4; wedge.position.z = bl * 0.62; eg2.add(wedge);
    face = new T.Mesh(new T.BoxGeometry(br * 1.7, 0.014, bl * 0.8), litMat()); face.position.set(0, br * 0.66, 0); eg2.add(face);
    const grid = new T.Mesh(new T.CircleGeometry(br * 1.0, 10), litMat()); grid.rotation.y = PI; grid.position.z = rearZ + 0.005; grid.scale.y = 0.75; eg2.add(grid); const gr = new T.Mesh(new T.TorusGeometry(br * 0.95, 0.02, 4, 10), _obBlack); gr.position.z = rearZ; gr.scale.y = 0.75; eg2.add(gr);
    for (let i = 0; i < B.coils; i++) { const sl = new T.Mesh(new T.BoxGeometry(br * 2.3, 0.01, 0.025), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); sl.position.set(0, -br * 0.66, -bl * 0.3 + i * bl * 0.2); eg2.add(sl); coils.push(sl); } addPlume(0, 0, br * 0.95, 1);
  } else if (K === 'rocket') {   // a proper rocket engine: a mount plate, a chamber, a ribbed bell nozzle, collars, a feed pipe and an optional propellant tank, SRB nose and fins
    const mount = new T.Mesh(new T.CylinderGeometry(br * 0.7, br * 1.0, 0.03, 8), _obBlack); mount.rotation.x = PI / 2; mount.position.z = bl * 0.24; eg2.add(mount);
    const ch = new T.Mesh(new T.SphereGeometry(br * 0.95, 10, 8), _obTread); ch.position.z = bl * 0.12; ch.scale.z = 1.25; eg2.add(ch); const seam = new T.Mesh(new T.TorusGeometry(br * 0.95, 0.016, 4, 14), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); seam.position.z = bl * 0.12; eg2.add(seam); coils.push(seam);
    const bp = [[br * 0.3, 0], [br * 0.42, bl * 0.06], [br * 0.8, bl * 0.2], [br * 1.35, bl * 0.34], [br * 1.7, bl * 0.4]].map(q => new T.Vector2(q[0], q[1] - bl * 0.1)), bell = new T.Mesh(new T.LatheGeometry(bp, 14), _obBlack); bell.rotation.x = PI / 2; bell.scale.set(1, 1, 1); bell.position.z = -bl * 0.1; bell.rotation.y = 0; bell.material.side = T.DoubleSide; eg2.add(bell);
    for (let i = 1; i <= 3; i++) { const rr = br * (0.55 + 0.42 * i), rg = new T.Mesh(new T.TorusGeometry(rr, 0.012, 4, 16), _obTread); rg.position.z = -bl * 0.1 - bl * 0.075 * i * 1.15; eg2.add(rg); }
    const mo = new T.Mesh(new T.CircleGeometry(br * 1.62, 14), litMat()); mo.rotation.y = PI; mo.position.z = rearZ + 0.02; mo.material.transparent = true; mo.material.opacity = 0.55; eg2.add(mo);
    if (B.tank) { const tk = G(); const tcy = new T.Mesh(new T.CylinderGeometry(br * 0.55, br * 0.55, bl * 0.5, 8), _obTread); tcy.rotation.x = PI / 2; tk.add(tcy); for (const e of [-1, 1]) { const cap = new T.Mesh(new T.SphereGeometry(br * 0.55, 8, 6), _obTread); cap.position.z = e * bl * 0.25; tk.add(cap); } tk.position.set(br * 1.6, -br * 0.2, bl * 0.12); eg2.add(tk); const tb = new T.Mesh(new T.TorusGeometry(br * 0.56, 0.015, 4, 12), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); tb.position.set(br * 1.6, -br * 0.2, bl * 0.12); eg2.add(tb); coils.push(tb); const pipe = new T.Mesh(new T.CylinderGeometry(0.014, 0.014, br * 1.6, 5), _obBlack); pipe.rotation.z = PI / 2; pipe.position.set(br * 0.8, -br * 0.15, bl * 0.12); eg2.add(pipe); }
    if (B.nose) { const nz = new T.Mesh(new T.ConeGeometry(br * 0.95, bl * 0.4, 10), _obBlack); nz.rotation.x = PI / 2; nz.position.z = bl * 0.62; eg2.add(nz); for (let i = 0; i < 3; i++) { const fn = new T.Mesh(new T.BoxGeometry(0.014, br * 1.1, bl * 0.28), _obBlack); fn.rotation.z = i * TAU / 3; fn.geometry.translate(0, br * 1.0, 0); fn.position.z = bl * 0.05; eg2.add(fn); } }
    face = new T.Mesh(new T.BoxGeometry(br * 0.7, 0.012, bl * 0.25), litMat()); face.position.set(0, br * 1.2, bl * 0.12); eg2.add(face);
    for (let i = 0; i < (B.cluster || 1); i++) addPlume(0, 0, br * 1.5, 1);
  } else if (K === 'trap') {   // THICK TRAPEZOID booster brackets: a chunky trapezoidal prism, a lit panel, vents; they accelerate it (streaks of ions at the back that grow when it rushes)
    const L1 = B.L1, L2 = B.L2, H = B.H, Tt = B.T, sh = B.shear || 0, shp = new T.Shape();
    shp.moveTo(-L1 / 2, 0); shp.lineTo(L1 / 2, 0); shp.lineTo(L2 / 2 + sh, H); shp.lineTo(-L2 / 2 + sh, H); shp.closePath();
    const eo = { depth: Tt, bevelEnabled: true, bevelThickness: B.bevel || 0.03, bevelSize: B.bevel || 0.03, bevelSegments: 1 }, geo = new T.ExtrudeGeometry(shp, eo); geo.translate(0, 0, -Tt / 2);
    const blk = new T.Mesh(geo, _obTread); blk.rotation.y = -PI / 2; eg2.add(blk);   // the trapezoid in the z-y plane, thick along x
    const lv = Math.hypot(sh + (L2 - L1) / 2, H);
    // the lit panel: a trapezoid plate on the slanted front face (or the top), inset
    if (B.lit === 'top') { face = new T.Mesh(new T.BoxGeometry(Tt * 0.7, 0.016, L2 * 0.8), litMat()); face.position.set(0, H + 0.02, sh); eg2.add(face); }
    else { const fs = new T.Shape(); fs.moveTo(-Tt * 0.36, 0); fs.lineTo(Tt * 0.36, 0); fs.lineTo(Tt * 0.26, lv * 0.78); fs.lineTo(-Tt * 0.26, lv * 0.78); fs.closePath(); face = new T.Mesh(new T.ShapeGeometry(fs), litMat()); face.material.side = T.DoubleSide; const ang = Math.atan2(sh + (L2 - L1) / 2, H); face.position.set(0, H * 0.12, L1 / 2 - (L1 - L2) * 0.12 + 0.02); face.rotation.set(-(PI / 2 - Math.atan2(H, -((L2 - L1) / 2 + sh) )) , 0, 0); face.rotation.set(Math.atan2((L2 - L1) / 2 + sh, H) * 0 + (PI / 2 - Math.atan2(H, (L1 - L2) / 2 - sh)), 0, 0); eg2.add(face); }
    // rear: vents, and the ion slits the streaks come out of
    for (let i = 0; i < 3; i++) { const vs = new T.Mesh(new T.BoxGeometry(Tt * 0.62, 0.024, 0.02), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); vs.position.set(0, H * (0.22 + 0.22 * i), -L1 / 2 + (L1 - L2) / 2 * (0.22 + 0.22 * i) - 0.015 + (sh * (0.22 + 0.22 * i)) ); eg2.add(vs); coils.push(vs); addPlume(0, H * (0.22 + 0.22 * i), Tt * 0.2, 0.55); }
    if (B.joint) { const jt = new T.Mesh(new T.CylinderGeometry(Tt * 0.42, Tt * 0.42, Tt * 1.15, 8), _obBlack); jt.rotation.z = PI / 2; jt.position.set(0, -0.02, 0); eg2.add(jt); const jl = new T.Mesh(new T.TorusGeometry(Tt * 0.43, 0.012, 4, 12), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); jl.rotation.y = PI / 2; jl.position.set(Tt * 0.58, -0.02, 0); eg2.add(jl); coils.push(jl); }
    if (B.second) { const g2 = new T.Shape(); g2.moveTo(-L2 * 0.5, 0); g2.lineTo(L2 * 0.5, 0); g2.lineTo(L2 * 0.32 + sh * 0.6, H * 0.5); g2.lineTo(-L2 * 0.32 + sh * 0.6, H * 0.5); g2.closePath(); const b2 = new T.Mesh(new T.ExtrudeGeometry(g2, { depth: Tt * 0.7, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 }), _obBlack); b2.geometry.translate(0, 0, -Tt * 0.35); b2.rotation.y = -PI / 2; b2.position.set(0, H + 0.04 + (B.bevel || 0.03), sh * 0.5); eg2.add(b2); }
  } else if (K === 'strap') {   // THICK TRAPEZOID brackets that run DOWN the ball's flank: a chain of trapezoid blocks following the sphere from near the top down toward the equator, narrowing as they go
    eg2.position.set(0, 0, o.earZ); eg2.rotation.set(0, 0, 0); eg2.position.y = 0;
    const n = B.n, th0 = B.th0, th1 = B.th1, last = n - 1;
    for (let i = 0; i < n; i++) { const th = th0 + (th1 - th0) * i / Math.max(1, last), u = i / Math.max(1, last), len = B.L0 * (1 - 0.35 * u), h = B.H0 * (1 - 0.25 * u), W = B.T * (1 - 0.3 * u);
      const sh = new T.Shape(); sh.moveTo(-len / 2, 0); sh.lineTo(len / 2, 0); sh.lineTo(len * 0.36, h); sh.lineTo(-len * 0.36, h); sh.closePath();
      const bk = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: W, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 }), (i % 2) ? _obBlack : _obTread); bk.geometry.translate(0, 0, -W / 2);
      const hold = G(); hold.position.set(sx * Math.sin(th) * (R * 1.0), Math.cos(th) * (R * 1.0), 0); hold.rotation.z = -sx * th; hold.add(bk); eg2.add(hold);
      if (i === 0) { const fp = new T.Mesh(new T.BoxGeometry(len * 0.55, 0.014, W * 0.7), litMat()); fp.position.set(0, h + 0.03, 0); hold.add(fp); face = fp; }
      if (i === last) { for (let k = 0; k < 3; k++) { const vs = new T.Mesh(new T.BoxGeometry(len * 0.5, 0.02, 0.02), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); vs.position.set(0, h * (0.25 + 0.25 * k), -W / 2 - 0.012); hold.add(vs); coils.push(vs); const wp2 = new T.Vector3(0, h * (0.25 + 0.25 * k), 0); hold.localToWorld(wp2.clone()); addPlume(sx * Math.sin(th) * R + Math.cos(th) * sx * 0 * 0, Math.cos(th) * R + h * (0.25 + 0.25 * k) * Math.cos(th), len * 0.12, 0.5); } }
      if (i > 0 && i < last) { const ln = new T.Mesh(new T.BoxGeometry(len * 0.5, 0.012, W * 1.02), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); ln.position.set(0, h * 0.5, 0); hold.add(ln); coils.push(ln); }
    }
  } else if (K === 'drop') {   // ONE thick trapezoid, longer: it starts at the top of the ball and runs DOWN its front, bent to follow the sphere, wide at the top and narrowing to the bottom
    eg2.position.set(sx * o.earX, 0, 0); eg2.rotation.set(0, 0, -sx * (B.lean || 0)); const dirK = B.back ? -1 : 1, th0 = B.th0 * dirK, th1 = B.th1 * dirK, Wt = B.Wt, Wb = B.Wb, Tt = B.T, nSeg = 10;
    const sh = new T.Shape(); sh.moveTo(-Wt / 2, 0); sh.lineTo(Wt / 2, 0); sh.lineTo(Wb / 2, 1); sh.lineTo(-Wb / 2, 1); sh.closePath();   // x = width, y = 0..1 along the run (top to bottom)
    const ex = new T.ExtrudeGeometry(sh, { depth: Tt, bevelEnabled: true, bevelThickness: B.bevel || 0.03, bevelSize: B.bevel || 0.03, bevelSegments: 1, steps: 1 });
    const pos = ex.attributes.position; for (let i = 0; i < pos.count; i++) { const x = pos.getX(i), yy = Math.max(0, Math.min(1, pos.getY(i))), zz = pos.getZ(i), th = th0 + (th1 - th0) * yy, rr = R * 0.99 + zz; pos.setXYZ(i, x, Math.cos(th) * rr, Math.sin(th) * rr); }
    ex.computeVertexNormals(); const bl2 = new T.Mesh(ex, _obTread); bl2.material = _obTread; eg2.add(bl2);
    // lit panel on the upper part, and vent slits low down
    const fs = new T.Mesh(new T.BoxGeometry(Wt * 0.5, 0.016, 0.16), litMat()); fs.position.set(0, Math.cos(th0 + (th1 - th0) * 0.2) * (R + Tt + 0.035), Math.sin(th0 + (th1 - th0) * 0.2) * (R + Tt + 0.035)); fs.rotation.x = th0 + (th1 - th0) * 0.2; face = fs; eg2.add(fs);
    for (let k = 0; k < 3; k++) { const t2 = 0.45 + 0.17 * k, rr2 = R + Tt + 0.03, vs = new T.Mesh(new T.BoxGeometry((Wt + (Wb - Wt) * t2) * 0.55, 0.014, 0.024), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); const tt = th0 + (th1 - th0) * t2; vs.position.set(0, Math.cos(tt) * rr2, Math.sin(tt) * rr2); vs.rotation.x = tt; eg2.add(vs); coils.push(vs); }
    const tb = th1 + 0.02, rb = R + Tt * 0.4; for (let k = 0; k < 3; k++) addPlume((k - 1) * Wb * 0.28, Math.cos(tb) * rb, Wb * 0.16, 0.45);
    // plumes point back (−z) from the rear anchor: put the anchor at the bottom edge
    eg2.userData.dropY = Math.cos(tb) * rb; eg2.userData.dropZ = Math.sin(tb) * rb;
  } else if (K === 'needle') {   // a slim spear of a thruster: a long thin cone, three fins, a hot band, a long ion stream
    const nd = new T.Mesh(new T.ConeGeometry(br * 0.6, bl * 1.35, 8), _obTread); nd.rotation.x = PI / 2; nd.position.z = bl * 0.1; eg2.add(nd);
    for (let i = 0; i < 3; i++) { const fn = new T.Mesh(new T.BoxGeometry(0.012, br * 1.5, bl * 0.34), _obBlack); fn.rotation.z = i * TAU / 3; fn.geometry.translate(0, br * 0.9, 0); fn.position.z = -bl * 0.35; eg2.add(fn); }
    for (let i = 0; i < B.coils; i++) ring(-bl * 0.25 + i * bl * 0.3, br * (0.5 - 0.1 * i) + 0.01, 0.012);
    const mo = new T.Mesh(new T.CircleGeometry(br * 0.55, 8), litMat()); mo.rotation.y = PI; mo.position.z = rearZ + 0.04; eg2.add(mo); addPlume(0, 0, br * 0.7, 1.2);
  } else if (K === 'horn') {   // a curved horn: rises from the ball then bends back, the ions leaving from its tip
    const pts = []; for (let i = 0; i <= 9; i++) { const u = i / 9, a = u * PI * 0.5; pts.push(new T.Vector3(0, Math.sin(a) * bl * 0.55, bl * 0.2 - (1 - Math.cos(a)) * bl * 0.8)); }
    for (let i = 0; i < 9; i++) { const a = pts[i], b2 = pts[i + 1], r0 = br * (1.0 - 0.7 * i / 9), seg = new T.Mesh(new T.CylinderGeometry(br * (1.0 - 0.7 * (i + 1) / 9), r0, a.distanceTo(b2) * 1.05, 7), _obTread); seg.position.copy(a).add(b2).multiplyScalar(0.5); seg.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), b2.clone().sub(a).normalize()); eg2.add(seg); }
    const tipP = pts[9]; const nz = new T.Mesh(new T.CylinderGeometry(br * 0.5, br * 0.3, bl * 0.12, 7, 1, true), _obBlack); nz.rotation.x = PI / 2; nz.position.copy(tipP).add(new T.Vector3(0, 0, -bl * 0.05)); eg2.add(nz);
    for (let i = 2; i < 8; i += 2) { const q = pts[i], co = new T.Mesh(new T.TorusGeometry(br * (1.05 - 0.7 * i / 9), 0.014, 4, 10), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); co.position.copy(q); co.lookAt(q.clone().add(pts[i + 1].clone().sub(pts[i - 1]))); eg2.add(co); coils.push(co); }
    const mo = new T.Mesh(new T.CircleGeometry(br * 0.5, 7), litMat()); mo.rotation.y = PI; mo.position.copy(tipP).add(new T.Vector3(0, 0, -bl * 0.1)); eg2.add(mo); addPlume(tipP.x, tipP.y, br * 0.6, 1);
  } else if (K === 'fin') {   // a thin tall curved blade, like a shark's fin, a lit edge down its back and three thrust slits at its trailing edge
    const sh = new T.Shape(); sh.moveTo(-bl * 0.5, 0); sh.lineTo(bl * 0.4, 0); sh.quadraticCurveTo(bl * 0.2, bl * 0.5, -bl * 0.5, bl * 0.75); sh.quadraticCurveTo(-bl * 0.4, bl * 0.35, -bl * 0.5, 0);
    const fn = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: br * 0.5, bevelEnabled: false }), _obTread); fn.rotation.y = -PI / 2; fn.position.set(-br * 0.25, 0, 0); eg2.add(fn); fn.geometry.translate(0, 0, 0);
    const edge = new T.Mesh(new T.BoxGeometry(0.012, 0.012, bl * 0.9), litMat()); edge.position.set(0, bl * 0.34, -bl * 0.05); edge.rotation.x = 0.55; face = edge; eg2.add(edge);
    for (let i = 0; i < 3; i++) { const sl = new T.Mesh(new T.BoxGeometry(br * 0.6, 0.02, 0.03), litMat()); sl.position.set(0, bl * (0.1 + 0.15 * i), rearZ + 0.18 - 0.02 * i); eg2.add(sl); coils.push(sl); sl.material = new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false }); addPlume(0, bl * (0.1 + 0.15 * i), br * 0.45, 0.6); }
  } else if (K === 'orbs') {   // an unattached thruster orb hovering above each side, a halo ring and an ion stream
    const ob = new T.Mesh(new T.SphereGeometry(br * 1.2, 12, 8), _obTread); ob.position.y = bl * 0.35; eg2.add(ob); const hr = new T.Mesh(new T.TorusGeometry(br * 1.7, 0.018, 4, 18), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); hr.position.y = bl * 0.35; hr.rotation.x = PI / 2 - 0.3; eg2.add(hr); coils.push(hr);
    const cr = new T.Mesh(new T.OctahedronGeometry(br * 0.7, 0), litMat()); cr.position.y = bl * 0.35; cr.position.z = br * 0.2; cr.scale.y = 1.4; face = cr; eg2.add(cr);
    const nz = new T.Mesh(new T.CylinderGeometry(br * 0.7, br * 0.4, bl * 0.14, 8, 1, true), _obBlack); nz.rotation.x = PI / 2; nz.position.set(0, bl * 0.35, -br * 1.3); nz.material.side = T.DoubleSide; eg2.add(nz); addPlume(0, bl * 0.35, br * 0.9, 0.8);
  } else if (K === 'coil') {   // an ion column: a stack of narrowing lit rings round a thin rod, rising like a tesla coil; the arc jumps between the two tops
    const rod = new T.Mesh(new T.CylinderGeometry(0.014, 0.02, bl * 1.1, 5), _obBlack); rod.position.y = bl * 0.5; eg2.add(rod);
    for (let i = 0; i < 6; i++) { const rr = br * (1.3 - 0.17 * i), co = new T.Mesh(new T.TorusGeometry(rr, br * 0.18, 5, 14), i % 2 ? _obTread : _obBlack); co.rotation.x = PI / 2; co.position.y = bl * (0.1 + 0.14 * i); eg2.add(co); const lr = new T.Mesh(new T.TorusGeometry(rr, 0.01, 4, 14), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); lr.rotation.x = PI / 2; lr.position.y = bl * (0.1 + 0.14 * i) + br * 0.2; eg2.add(lr); coils.push(lr); }
    const top = new T.Mesh(new T.OctahedronGeometry(br * 0.4, 0), litMat()); top.position.y = bl * 1.1; face = top; eg2.add(top); eg2.userData.noPlume = true;
  } else if (K === 'ring') {   // an annular engine: a fat torus with a core cone, the ions streaming through the ring
    const tor = new T.Mesh(new T.TorusGeometry(br * 1.2, br * 0.42, 6, 14), _obTread); tor.position.z = 0; eg2.add(tor); const cone = new T.Mesh(new T.ConeGeometry(br * 0.7, bl * 0.9, 8), _obBlack); cone.rotation.x = -PI / 2; cone.position.z = bl * 0.05; eg2.add(cone);
    const hub = new T.Mesh(new T.OctahedronGeometry(br * 0.45, 0), litMat()); hub.position.z = -bl * 0.3; hub.scale.z = 1.5; eg2.add(hub); face = hub;
    for (let i = 0; i < B.coils; i++) ring(-bl * 0.1 - i * 0.05, br * 1.2 + 0.02 * i, 0.014); const mo = new T.Mesh(new T.CircleGeometry(br * 1.1, 14), litMat()); mo.rotation.y = PI; mo.position.z = rearZ + 0.1; mo.material.transparent = true; mo.material.opacity = 0.5; eg2.add(mo); addPlume(0, 0, br * 1.3, 1);
  } else if (K === 'fan') {   // a ducted fan: a cylinder with spinning blades at the rear and a lit ring round the duct
    const duct = new T.Mesh(new T.CylinderGeometry(br * 1.1, br * 1.1, bl * 0.8, 10, 1, true), _obTread); duct.rotation.x = PI / 2; duct.material.side = T.DoubleSide; eg2.add(duct); const nose = new T.Mesh(new T.ConeGeometry(br * 0.9, bl * 0.3, 10), _obBlack); nose.rotation.x = PI / 2; nose.position.z = bl * 0.5; eg2.add(nose);
    const fanG = G(); fanG.position.z = -bl * 0.2; eg2.add(fanG); for (let i = 0; i < 6; i++) { const bd = new T.Mesh(new T.BoxGeometry(br * 0.22, br * 1.0, 0.012), _obBlack); bd.position.y = 0; bd.rotation.z = i * TAU / 6; bd.geometry.translate(0, br * 0.55, 0); bd.rotation.x = 0.4; fanG.add(bd); } eg2.userData.fan = fanG;
    ring(-bl * 0.4, br * 1.12, 0.02); ring(bl * 0.3, br * 1.12, 0.02); ring(-bl * 0.05, br * 1.12, 0.02); const mo = new T.Mesh(new T.CircleGeometry(br * 1.0, 12), litMat()); mo.material.transparent = true; mo.material.opacity = 0.45; mo.rotation.y = PI; mo.position.z = rearZ + 0.05; eg2.add(mo); addPlume(0, 0, br * 1.05, 1);
  }
  const exit = new T.Mesh(new T.OctahedronGeometry(0.03, 0), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); exit.position.set(0, 0, rearZ - B.plume * 0.35); if (K === 'coil') exit.position.set(0, bl * 1.1, 0); eg2.add(exit);
  return { eg2, face, tip: exit, sx, coils, plumes, boost: true, rz: rearZ };
}
function _orbBrawler(o) {
  const _obBlack = o.dark ? _obBlackD : _obBlackL, _obTread = o.dark ? _obTreadD : _obTreadL;
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1.25);
  const lc = new T.Color(EL.color), lit = lc.clone().lerp(new T.Color(1, 1, 1), o.dark ? 0.1 : 0.35).multiplyScalar(o.dark ? o.dark.lit : 1), dim = lc.clone().multiplyScalar(o.dark ? 0.14 : 0.25);
  const frame = G(); frame.position.y = o.r; b.add(frame);
  const R = o.r;
  // the exposed core: a big faceted diamond in the middle with a hot white heart and a soft haze, inside a dark inner ball
  const core = G(); frame.add(core);
  const dm = new T.Mesh(o.dark ? _shadeCrystal(_litFacets(new T.OctahedronGeometry(R * o.coreK, 0)), o.dark.core, true, -R * o.coreK * 1.35, R * o.coreK * 1.35) : _litFacets(new T.OctahedronGeometry(R * o.coreK, 0)), new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })); dm.scale.set(1, 1.35, 1); core.add(dm);
  const heart = new T.Mesh(new T.OctahedronGeometry(R * o.coreK * 0.4, 0), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); heart.scale.y = 1.35; core.add(heart);
  const haze = glowSprite(R * 2.4); haze.material = haze.material.clone(); haze.material.opacity = 0.4; haze.renderOrder = 3; frame.add(haze);
  // a ring of small lit segments round the core (the inner machinery)
  const segs = []; for (let i = 0; i < 12; i++) { const a = i * TAU / 12, sg = new T.Mesh(new T.BoxGeometry(0.05, 0.05, R * 0.17), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); sg.position.set(0, Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66); sg.rotation.x = a; frame.add(sg); segs.push({ sg, a }); }
  // the tread band: a sparse ring of big square blocks round the middle (axle along x); two thin dark rims either side
  // FLUSH (a true ball silhouette): a dark belt on the sphere's own surface round the equator, the tread blocks sunk into it with their faces level with the ball
  if (o.flush) { const a = Math.asin(Math.min(0.95, (o.bandW / 2 + 0.05) / R)), belt = new T.Mesh(new T.SphereGeometry(R * 0.995, 28, 6, 0, TAU, PI / 2 - a, 2 * a), _obBlack); belt.rotation.z = PI / 2; belt.material.side = T.DoubleSide; frame.add(belt); }
  const band = G(); frame.add(band); const N = o.blocks;
  for (let i = 0; i < N; i++) { const a = i * TAU / N, w = o.bandW, bl = TAU * R / N * 0.78, bx = new T.Mesh(new T.BoxGeometry(w, o.tread, bl), (i % 2) ? _obTread : _obBlack); const rb = o.flush ? R - o.tread * 0.5 + 0.004 : R + o.tread * 0.5; bx.position.set(0, Math.cos(a) * rb, Math.sin(a) * rb); bx.rotation.x = a; band.add(bx);
    const stripe = new T.Mesh(new T.BoxGeometry(w * 0.55, 0.012, bl * 0.5), new T.MeshBasicMaterial({ color: dim.getHex(), toneMapped: false })); const rs = o.flush ? R + 0.008 : R + o.tread + 0.008; stripe.position.set(0, Math.cos(a) * rs, Math.sin(a) * rs); stripe.rotation.x = a; if (o.stripes) band.add(stripe); }
  for (const sx of [-1, 1]) { const rim = new T.Mesh(new T.TorusGeometry(o.flush ? R * 0.985 : R + 0.02, 0.03, 5, 32), _obBlack); rim.rotation.y = PI / 2; rim.position.x = sx * (o.bandW / 2 + 0.03); frame.add(rim); }
  // the shell plates: on each side, curved bowl segments with gaps between them, standing off the ball so the core and its light show
  const shells = []; const glass = o.glass ? new T.MeshStandardMaterial({ color: 0x120d03, metalness: 0.0, roughness: 0.12, transparent: true, opacity: o.glass, depthWrite: false, side: T.DoubleSide }) : null; if (glass) glass.envMapIntensity = 1.6;
  const edgeMat = new T.LineBasicMaterial({ color: lit.getHex(), transparent: true, opacity: 0.7, blending: T.AdditiveBlending });
  for (const sx of [-1, 1]) for (let k = 0; k < o.plates; k++) { const t0 = o.shellT0, t1 = o.shellT1, ph0 = k * TAU / o.plates + 0.15, span = TAU / o.plates * 0.84;
      const geo = new T.SphereGeometry(R * o.shellK, 14, 6, ph0, span, t0, t1 - t0), mesh = new T.Mesh(geo, glass || _obBlack); if (!glass) mesh.material = _obBlack; mesh.material.side = T.DoubleSide;
      const holder = G(); holder.rotation.z = -sx * PI / 2; holder.add(mesh); holder.position.x = sx * 0.04; frame.add(holder);
      const eg = new T.LineSegments(new T.EdgesGeometry(geo, 18), edgeMat); holder.add(eg); shells.push({ holder, mesh, k, sx }); }
  // the ears: two forward-slanted housings on top of the band, each with a lit face, and static between them
  const ears = []; for (const sx of [-1, 1]) { if (o.boost) { ears.push(_bpod(o, sx, lit, dim, lc, frame, R, _obBlack, _obTread)); continue; }
    const eg2 = G(); eg2.position.set(sx * o.earX, R + o.tread + 0.02, o.earZ); eg2.rotation.set(-o.earTilt, 0, -sx * o.earSplay); frame.add(eg2);
    const hs = new T.Mesh(new T.BoxGeometry(o.earW, o.earH, o.earL), _obTread); hs.position.y = o.earH / 2; eg2.add(hs);
    const face = new T.Mesh(new T.BoxGeometry(o.earW * 0.7, 0.012, o.earL * 0.75), new T.MeshBasicMaterial({ color: lit.getHex(), toneMapped: false })); face.position.set(0, o.earH + 0.008, 0); eg2.add(face);
    const tip = new T.Mesh(new T.OctahedronGeometry(0.04, 0), new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); tip.position.set(0, o.earH * 0.9, o.earL * 0.55); eg2.add(tip); ears.push({ eg2, face, tip, sx }); }
  const arc = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: lit.getHex(), transparent: true, opacity: 0.95 })); arc.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(10 * 3), 3)); arc.frustumCulled = false; frame.add(arc);
  const arc2 = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.8 })); arc2.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(10 * 3), 3)); arc2.frustumCulled = false; frame.add(arc2);
  const pool = _glowPool(R * 1.0, 0.02); b.add(pool.g);
  const L = new T.PointLight(0xffffff, 0.8, 4, 2); L.color.set(EL.color); L.position.set(0, R, 0); b.add(L); LIGHTS.push(L);
  const wp = new T.Vector3();
  return { g, core: R * 1.0 * (o.S || 1.25), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    band.rotation.x = -(ph / TAU) * (TAU / N) * o.turns * (1 + 1.2 * ac); frame.position.y = R + 0.012 * Math.sin(ph * 2) - 0.03 * ac; frame.position.z = 0.1 * ac; frame.rotation.x = 0.02 * Math.sin(ph) - 0.07 * ac;
    const fk = 0.6 + 0.25 * Math.sin(ph * 3) * Math.sin(ph * 2 + 1) + 0.5 * ac; core.rotation.y = ph * 0.6; core.rotation.z = 0.1 * Math.sin(ph); heart.scale.setScalar(1 + 0.2 * Math.sin(ph * 4) + 0.5 * ac); heart.scale.y *= 1.35; haze.material.opacity = (0.3 + 0.25 * fk) * (o.dark ? o.dark.haze : 1); pool.m.material.opacity = (0.15 + 0.2 * fk) * (o.dark ? o.dark.haze : 1); L.intensity = (0.5 + 1.0 * fk) * (o.dark ? 0.6 : 1);
    segs.forEach(S => { const on = (Math.sin(ph * 2 - S.a * 2) + 1) / 2; S.sg.material.color.copy(dim).lerp(lit, Math.min(1, on * 0.9 + 0.4 * ac)); });
    shells.forEach(S => { const s = 1 + 0.04 * ac; S.holder.scale.setScalar(s); S.holder.position.x = S.sx * (0.04 + 0.05 * ac); });
    ears.forEach(E => { E.face.material.color.copy(lit).multiplyScalar(0.7 + 0.3 * fk); E.tip.scale.setScalar(1 + 0.4 * Math.sin(ph * 5 + E.sx) + 0.8 * ac); });
    ears.forEach(E => { if (E.boost && E.eg2.userData.fan) E.eg2.userData.fan.rotation.z = ph * 14 * (1 + 2 * ac); });
    ears.forEach(E => { if (!E.boost) return; E.plumes.forEach(P => { const fl = 0.85 + 0.15 * Math.sin(ph * 14 + P.k * 5 + E.sx) + 0.5 * ac; P.pl.scale.set(1 + 0.12 * Math.sin(ph * 11 + E.sx), fl, 1 + 0.12 * Math.sin(ph * 11 + E.sx)); P.pl.position.z = E.rz - P.len * fl * 0.5; P.pl.material.opacity = P.op * (0.7 + 0.3 * fk) + 0.2 * ac; }); E.coils.forEach((C, i) => C.material.color.copy(dim).lerp(lit, Math.min(1, (Math.sin(ph * 4 - i * 1.4) + 1) / 2 + 0.4 * ac))); if ((o.boost.kind || 'barrel') !== 'coil') E.tip.position.z = E.rz - o.boost.plume * 0.35 * (0.85 + 0.5 * ac); });
    const cyc = (ph / TAU * o.zaps) % 1, on = ac > 0.2 || cyc < 0.22, fr = Math.floor(ph * 12); arc.visible = on; arc2.visible = on && fr % 2 === 0;
    if (on) { ears[0].tip.getWorldPosition(wp); frame.worldToLocal(wp); const p0 = wp.clone(); ears[1].tip.getWorldPosition(wp); frame.worldToLocal(wp); const p1 = wp.clone();
      [arc, arc2].forEach((ln, li) => { const pa = ln.geometry.attributes.position.array; for (let k = 0; k < 10; k++) { const u = k / 9, jx = (_hz(k, li + 3, fr) - 0.5) * 0.16 * Math.sin(u * PI) * (1 + ac), jy = (_hz(k, li + 9, fr) - 0.5) * 0.16 * Math.sin(u * PI) * (1 + ac); pa[k * 3] = p0.x + (p1.x - p0.x) * u + jx; pa[k * 3 + 1] = p0.y + (p1.y - p0.y) * u + jy; pa[k * 3 + 2] = p0.z + (p1.z - p0.z) * u; } ln.geometry.attributes.position.needsUpdate = true; }); } } };
}
const _ob0 = { S: 1.25, r: 0.62, coreK: 0.5, blocks: 12, bandW: 0.34, tread: 0.14, turns: 1, plates: 3, shellT0: 0.62, shellT1: 1.32, shellK: 1.02, earX: 0.2, earZ: 0.1, earW: 0.22, earH: 0.2, earL: 0.42, earTilt: 0.6, earSplay: 0.22, zaps: 2, stripes: true };
fx(727, "The electric brawler from the reference: a sphere with an exposed glowing diamond core, one band of big square tread blocks round the middle, three curved shell plates a side with gaps that show the core, two forward-slanted lit ear housings with static between them. The shells are smoked glass, dark amber.", () => _orbBrawler(Object.assign({}, _ob0, { glass: 0.45 })));
fx(728, "The same in matte black: opaque shell plates edged in light, a wide open hole at each side showing the core.", () => _orbBrawler(Object.assign({}, _ob0, { shellT0: 0.95, shellT1: 1.5, coreK: 0.56 })));
fx(729, "Sparser, bigger tread: eight huge square blocks, two shell plates a side, a bigger core.", () => _orbBrawler(Object.assign({}, _ob0, { blocks: 8, tread: 0.18, bandW: 0.4, plates: 2, coreK: 0.55, glass: 0.4, shellT0: 0.7 })));
fx(730, "More open: the plates thin and pulled apart so the core shows more, longer ears, a static bolt every beat.", () => _orbBrawler(Object.assign({}, _ob0, { plates: 4, shellT0: 0.7, shellT1: 1.2, glass: 0.4, earL: 0.55, earH: 0.24, zaps: 4 })));
fx(731, "Armoured: the plates wrap further round, the core a glow in the gaps, thick short ears.", () => _orbBrawler(Object.assign({}, _ob0, { shellT0: 0.85, shellT1: 1.55, plates: 3, shellK: 1.06, coreK: 0.56, earW: 0.28, earL: 0.34, earH: 0.22, earTilt: 0.45 })));

// ── A true ball silhouette (Nos. 732–736): less tread, flush with the sphere; the shell plates flush too; only the antenna brackets stand off ──
const _fl = Object.assign({}, _ob0, { flush: true, blocks: 8, bandW: 0.24, tread: 0.1, shellK: 1.0, shellT0: 0.8, shellT1: 1.32, earW: 0.18, earH: 0.16, earL: 0.34, plates: 3 });
fx(732, "A true ball: a smooth sphere, a slim band of eight flat tread blocks sunk flush round the middle, flush shell plates in smoked glass with the diamond showing, and only the two lit antenna brackets standing off the top.", () => _orbBrawler(Object.assign({}, _fl, { glass: 0.45 })));
fx(733, "The same in matte black, a wide opening at each side showing the core.", () => _orbBrawler(Object.assign({}, _fl, { shellT0: 1.0, shellT1: 1.4, coreK: 0.55 })));
fx(734, "Even less tread: six blocks, a thin belt, the ball almost smooth, the plates in glass.", () => _orbBrawler(Object.assign({}, _fl, { blocks: 6, bandW: 0.2, tread: 0.09, glass: 0.4, shellT0: 0.72 })));
fx(735, "A smooth ball with the tread just a ring of eight lit studs, two plates a side, taller antenna brackets.", () => _orbBrawler(Object.assign({}, _fl, { blocks: 8, bandW: 0.12, tread: 0.08, plates: 2, glass: 0.42, earH: 0.22, earL: 0.4, earTilt: 0.7 })));
fx(736, "Eight tread blocks on a slim belt, the brackets thick and short, a static bolt every beat.", () => _orbBrawler(Object.assign({}, _fl, { glass: 0.42, earW: 0.24, earH: 0.14, earL: 0.3, zaps: 4 })));

// ── 733 with IONIC ROCKET BOOSTERS in place of the antenna brackets (Nos. 737–741): twin thruster pods on top, nose forward, a flared nozzle at the back, lit coil rings, and a stream of ions behind; the static arcs between the two nozzles ──
const _b733 = Object.assign({}, _fl, { shellT0: 1.0, shellT1: 1.4, coreK: 0.55, earX: 0.27, earZ: 0.0, earTilt: 0.8, earSplay: 0.14, boost: { len: 0.72, r: 0.12, coils: 3, plume: 0.8 } });
fx(737, "733 with twin ionic rocket boosters on top: short thruster barrels slanted nose forward, a flared nozzle at the back with a stream of ions flickering out behind, lit coil rings, and the static arcing between the two nozzles.", () => _orbBrawler(Object.assign({}, _b733)));
fx(738, "Bigger, heavier pods with long ion streams, four coil rings, a lit face on top of each barrel.", () => _orbBrawler(Object.assign({}, _b733, { boost: { len: 0.9, r: 0.15, coils: 4, plume: 1.2 }, earX: 0.3 })));
fx(739, "Splayed outward: the pods angled wide like a pair of vectored thrusters, medium streams.", () => _orbBrawler(Object.assign({}, _b733, { earSplay: 0.55, earX: 0.3, earTilt: 0.6, boost: { len: 0.76, r: 0.13, coils: 3, plume: 0.9 } })));
fx(740, "Slim and tall, nearly upright like a pair of rocket stacks, long thin ion streams going straight down their backs.", () => _orbBrawler(Object.assign({}, _b733, { earTilt: 1.15, earSplay: 0.1, boost: { len: 0.9, r: 0.1, coils: 4, plume: 1.2 } })));
fx(741, "Short, stubby pods with big nozzles and fat bright plumes, a bolt of static between the nozzles every beat.", () => _orbBrawler(Object.assign({}, _b733, { zaps: 4, boost: { len: 0.5, r: 0.16, coils: 2, plume: 0.8 } })));

// ── 739's positions, different brackets (Nos. 742–746) ──
const _p739 = Object.assign({}, _b733, { earSplay: 0.55, earX: 0.3, earTilt: 0.6 });
fx(742, "739's positions with a fat pod and TWO small tail nozzles side by side, two ion streams from each.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'twin', len: 0.74, r: 0.13, coils: 3, plume: 0.7 } })));
fx(743, "An open frame: a slim thruster tube held in a U-shaped cradle, rails, struts and cross-braces showing.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'cradle', len: 0.8, r: 0.1, coils: 3, plume: 0.8 } })));
fx(744, "Faceted slab housings like your reference's ears, a big lit face on top and a flat lit ion grid for the nozzle.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'prism', len: 0.7, r: 0.13, coils: 3, plume: 0.8 } })));
fx(745, "An annular engine: a fat ring with a core cone and a glowing hub, the ions streaming out through the ring.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'ring', len: 0.7, r: 0.12, coils: 3, plume: 0.8 } })));
fx(746, "A ducted fan: a cylinder with spinning blades at the back, lit rings round the duct, an ion stream.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'fan', len: 0.75, r: 0.12, coils: 3, plume: 0.8 } })));

// ── Real rocket engines, not trapezoids (Nos. 747–751): bells, chambers, tanks, in 739's positions ──
fx(747, "A rocket engine on a mount plate: a glowing seam round a round chamber, a big ribbed bell nozzle with a lit mouth, an ion stream, and a propellant tank alongside it with a feed pipe.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'rocket', len: 0.9, r: 0.13, coils: 3, plume: 0.9, tank: true } })));
fx(748, "A bare engine, no tank: a bigger chamber and a wider bell, short fat plume.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'rocket', len: 0.8, r: 0.17, coils: 3, plume: 0.75 } })));
fx(749, "A solid-rocket-booster style: a nose cone, three tail fins, and the bell at the back.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'rocket', len: 1.0, r: 0.12, coils: 3, plume: 0.9, nose: true } })));
fx(750, "A big engine with the tank and the nose cone both, longer plume: a little missile pod.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'rocket', len: 1.05, r: 0.13, coils: 3, plume: 1.0, nose: true, tank: true } })));
fx(751, "A cluster: the engine fires three streams at once.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'rocket', len: 0.9, r: 0.14, coils: 3, plume: 0.9, cluster: 3, tank: true } })));

// ── Silhouettes that are NOT blocks (Nos. 752–756): thin and long, curved, bladed, floating and stacked ──
fx(752, "Needle thrusters: slim spears, a long thin cone each with three small fins, glowing rings, and a long thin ion stream.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'needle', len: 0.9, r: 0.1, coils: 3, plume: 1.0 } })));
fx(753, "Curved horns: each rises from the ball and bends back like a bull's horn, the ions streaming from its tip.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'horn', len: 1.0, r: 0.1, coils: 3, plume: 0.8 } })));
fx(754, "Fin blades: a thin tall curved blade each, like a shark's fin, a lit edge down its back and three thrust slits at the trailing edge.", () => _orbBrawler(Object.assign({}, _p739, { boost: { kind: 'fin', len: 0.9, r: 0.12, coils: 3, plume: 0.6 } })));
fx(755, "Floating thruster orbs: an unattached glowing orb with a halo ring hovering above each side, a short ion stream from its back.", () => _orbBrawler(Object.assign({}, _p739, { earTilt: 0.1, boost: { kind: 'orbs', len: 0.8, r: 0.13, coils: 3, plume: 0.7 } })));
fx(756, "Ion columns: a stack of narrowing lit rings round a thin rod on each side, rising like a Tesla coil, the static arcing between the two tops.", () => _orbBrawler(Object.assign({}, _p739, { earTilt: 0.05, earSplay: 0.3, earX: 0.28, boost: { kind: 'coil', len: 0.8, r: 0.13, coils: 3, plume: 0.01 } })));

// ── Thick trapezoid boost brackets (Nos. 757–761): not rockets: chunky trapezoidal brackets that boost it, lit panels, rear vents; ion streaks behind them grow when it accelerates ──
const _pt = Object.assign({}, _p739, { earTilt: 0.5, earSplay: 0.4, earX: 0.3, boost: { kind: 'trap', len: 0.5, L1: 0.52, L2: 0.3, H: 0.3, T: 0.3, shear: 0.06, plume: 0.28, bevel: 0.035, coils: 3 } });
fx(757, "Thick trapezoid brackets, like your reference's ears: a chunky trapezoidal block leaning forward, a lit trapezoid panel on its slanted face, three vent slits at the back that streak ions when it boosts.", () => _orbBrawler(Object.assign({}, _pt)));
fx(758, "The lit panel on the top face instead, broad and flat, bigger blocks.", () => _orbBrawler(Object.assign({}, _pt, { boost: Object.assign({}, _pt.boost, { lit: 'top', L1: 0.58, L2: 0.34, T: 0.36 }) })));
fx(759, "Two stacked trapezoids: a big block and a smaller one on top of it, stepped.", () => _orbBrawler(Object.assign({}, _pt, { boost: Object.assign({}, _pt.boost, { second: true, H: 0.28 }) })));
fx(760, "Chunky and short: very thick, nearly a wedge, heavy bevels, the lit face large.", () => _orbBrawler(Object.assign({}, _pt, { boost: Object.assign({}, _pt.boost, { L1: 0.46, L2: 0.24, H: 0.28, T: 0.38, bevel: 0.05, shear: 0.1 }) })));
fx(761, "On a pivot: the trapezoid sits on a cylindrical hinge, so it can swing, a lit collar on the hinge, streaks at the back.", () => _orbBrawler(Object.assign({}, _pt, { boost: Object.assign({}, _pt.boost, { joint: true }) })));

// ── 758 way smaller (Nos. 762–766) ──
const _p758 = Object.assign({}, _pt, { boost: Object.assign({}, _pt.boost, { lit: 'top' }) });
const _sm758 = k => Object.assign({}, _p758, { boost: Object.assign({}, _p758.boost, { L1: 0.58 * k, L2: 0.34 * k, H: 0.3 * k, T: 0.36 * k, shear: 0.06 * k, bevel: 0.03 * k, plume: 0.28 * k, len: 0.5 * k }) });
fx(762, "758 at 60% of its size.", () => _orbBrawler(_sm758(0.6)));
fx(763, "758 at 50%.", () => _orbBrawler(_sm758(0.5)));
fx(764, "758 at 40%.", () => _orbBrawler(_sm758(0.4)));
fx(765, "758 at 50%, set a little further back and wider apart on the ball.", () => _orbBrawler(Object.assign({}, _sm758(0.5), { earX: 0.34, earZ: -0.12 })));
fx(766, "758 at 40%, the lit panels brighter and a touch more slant.", () => _orbBrawler(Object.assign({}, _sm758(0.4), { boost: Object.assign({}, _sm758(0.4).boost, { shear: 0.06 }) })));

// ── The brackets extend further down his body (Nos. 767–771): a chain of thick trapezoid blocks running down each flank over the shell plates, small like 763 ──
const _obst = Object.assign({}, _pt, { boost: { kind: 'strap', len: 0.5, n: 4, th0: 0.42, th1: 1.25, L0: 0.3, H0: 0.15, T: 0.2, plume: 0.14, coils: 3 } });
fx(767, "The 763-sized brackets extended down each flank: four thick trapezoid blocks chained down the ball's side, narrowing as they go, a lit panel on the top one and ion slits on the lowest.", () => _orbBrawler(Object.assign({}, _obst)));
fx(768, "Longer still: six blocks reaching right down to the equator.", () => _orbBrawler(Object.assign({}, _obst, { boost: Object.assign({}, _obst.boost, { n: 6, th1: 1.5, L0: 0.26 }) })));
fx(769, "Fewer, bigger blocks: three chunky trapezoids that stop at the middle of the flank.", () => _orbBrawler(Object.assign({}, _obst, { boost: Object.assign({}, _obst.boost, { n: 3, th1: 1.05, L0: 0.36, H0: 0.18, T: 0.24 }) })));
fx(770, "Starting higher, right at the top of the ball, running down a long way, thin and tall.", () => _orbBrawler(Object.assign({}, _obst, { boost: Object.assign({}, _obst.boost, { n: 5, th0: 0.2, th1: 1.3, L0: 0.22, H0: 0.14, T: 0.18 }) })));
fx(771, "A heavy shoulder block at the top that steps down into three narrower blocks.", () => _orbBrawler(Object.assign({}, _obst, { boost: Object.assign({}, _obst.boost, { n: 4, th0: 0.4, th1: 1.2, L0: 0.38, H0: 0.2, T: 0.26 }) })));

// ── ONE trapezoid, longer: starting at the top and running down his front (Nos. 772–776) ──
const _dp = Object.assign({}, _p739, { earTilt: 0, earSplay: 0, earX: 0.26, earZ: 0, boost: { kind: 'drop', len: 0.5, th0: 0.18, th1: 0.95, Wt: 0.3, Wb: 0.16, T: 0.11, plume: 0.2, bevel: 0.03, coils: 3 } });
fx(772, "The same thick trapezoid, but longer: it starts at the top of the ball and runs down his front, bent to follow the sphere, wide at the top and narrowing to the bottom, a lit panel near the top and vent slits low down.", () => _orbBrawler(Object.assign({}, _dp)));
fx(773, "Longer still, down past the middle of the ball.", () => _orbBrawler(Object.assign({}, _dp, { boost: Object.assign({}, _dp.boost, { th1: 1.3 }) })));
fx(774, "Wider and thicker: a broad plate, wide at the top, tapering to a blunt end.", () => _orbBrawler(Object.assign({}, _dp, { boost: Object.assign({}, _dp.boost, { Wt: 0.4, Wb: 0.22, T: 0.15, th1: 1.05 }) })));
fx(775, "Sharper taper: wide at the shoulder and narrowing to a point near the bottom.", () => _orbBrawler(Object.assign({}, _dp, { boost: Object.assign({}, _dp.boost, { Wt: 0.34, Wb: 0.08, th1: 1.2 }) })));
fx(776, "Further apart and angled out: the two plates splayed over the ball's shoulders and running down the front.", () => _orbBrawler(Object.assign({}, _dp, { earX: 0.34, boost: Object.assign({}, _dp.boost, { lean: 0.35, th1: 1.1 }) })));

// ── The other way: the trapezoid runs down the BACK of the ball instead (Nos. 777–781) ──
const _bk = b => Object.assign({}, _dp, { boost: Object.assign({}, _dp.boost, { back: true }, b) });
fx(777, "The same long trapezoid, but running down the back of the ball instead of the front.", () => _orbBrawler(_bk({})));
fx(778, "Longer, past the middle of the back.", () => _orbBrawler(_bk({ th1: 1.3 })));
fx(779, "Wide thick plates, blunt ends.", () => _orbBrawler(_bk({ Wt: 0.4, Wb: 0.22, T: 0.15, th1: 1.05 })));
fx(780, "Sharper taper down the back.", () => _orbBrawler(_bk({ Wt: 0.34, Wb: 0.08, th1: 1.2 })));
fx(781, "Splayed out over the shoulders and running down the back.", () => _orbBrawler(Object.assign({}, _bk({ lean: 0.35, th1: 1.1 }), { earX: 0.34 })));

// The back-running trapezoids as seen from BEHIND (the same Nos. 777–781, the creature turned round): 782–786
[777, 778, 779, 780, 781].forEach((n, i) => fx(782 + i, "No. " + n + " seen from behind.", () => { const B = FORMS2[n].build(); B.g.rotation.y = PI; return B; }));

// ── 781 darker, and the game sprite (Nos. 790, 791): everything near-black, the core a deep amber, the lit panels and plumes dimmed ──
const _obdk = { core: 1.0, lit: 0.8, haze: 0.95 };   // the FRAME is near-black; the diamond keeps its full brightness
fx(790, "781 darker: near-black tread, plates and brackets, a deep amber core, dim lit panels, a faint haze.", () => _orbBrawler(Object.assign({}, _bk({ lean: 0.35, th1: 1.1 }), { earX: 0.34, dark: _obdk })));
fx(791, "790, the game sprite (smaller).", () => _orbBrawler(Object.assign({}, _bk({ lean: 0.35, th1: 1.1 }), { earX: 0.34, dark: _obdk, S: 1.5 })));
