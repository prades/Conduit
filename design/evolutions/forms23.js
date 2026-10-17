// ── THE ZIGGURAT CRAB · the electric brawler, Nos. 580–: a little stepped-pyramid body that sits on the ground, and just TWO big shard arms that float
// ahead of it, NOT attached, pulling it along. Nothing else: no legs, no extra parts. ──
const _zigBlack = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.5, roughness: 0.36, flatShading: true }); _zigBlack.envMapIntensity = 0.7;
function _zigLit() { const m = new T.MeshStandardMaterial({ color: 0x0a0800, emissive: new T.Color(EL.color).multiplyScalar(0.11), emissiveIntensity: 1.0, roughness: 1, metalness: 0 }); m.envMapIntensity = 0; return m; }
function _glintCol() { const hx = typeof EL !== 'undefined' && EL.color ? String(EL.color).toLowerCase() : '#ffee33'; if (hx === '#ffee33' || hx === '#ffe033') return 0xfff6b0; const c = new T.Color(hx); return new T.Color(0.55 + 0.45 * c.r, 0.55 + 0.45 * c.g, 0.55 + 0.45 * c.b).getHex(); }
function _clawShard(len, r, bend, seed, sides) {   // a big polished-black blade: a faceted cone that curls at the tip, crests glinting
  const geo = new T.ConeGeometry(r, len, sides || 6, 6), p = geo.attributes.position;
  for (let v = 0; v < p.count; v++) { const y = p.getY(v), u = (y + len / 2) / len, k = 1 + 0.18 * (_hz(Math.round(p.getX(v) * 200) + seed, Math.round(y * 200), Math.round(p.getZ(v) * 200)) - 0.5); p.setX(v, p.getX(v) * k + bend * u * u * len * 0.5); p.setZ(v, p.getZ(v) * k); }
  geo.translate(0, len / 2, 0); geo.computeVertexNormals();
  const pm = new T.MeshStandardMaterial({ color: 0x000001, metalness: 0.9, roughness: 0.2, flatShading: true }); pm.envMapIntensity = 2.0;
  const eg = new T.EdgesGeometry(geo, 25), ep = eg.attributes.position, ec = new Float32Array(ep.count * 3); let y0 = 1e9, y1 = -1e9; for (let v = 0; v < ep.count; v++) { y0 = Math.min(y0, ep.getY(v)); y1 = Math.max(y1, ep.getY(v)); }
  for (let v = 0; v < ep.count; v++) { const u = (ep.getY(v) - y0) / Math.max(1e-6, y1 - y0), k = (0.25 + 0.75 * u) * (0.55 + 0.45 * _hz(Math.floor(v / 2), 3, 5)); ec[v * 3] = ec[v * 3 + 1] = ec[v * 3 + 2] = k; }
  eg.setAttribute('color', new T.BufferAttribute(ec, 3));
  const gg = G(); gg.add(new T.Mesh(geo, pm)); gg.add(new T.LineSegments(eg, new T.LineBasicMaterial({ vertexColors: true, color: _glintCol(), transparent: true, opacity: 0.8, blending: T.AdditiveBlending }))); return gg;
}
function _cicadaArm(A, sx, seed) {   // a cicada's fore-arm: a stout spined upper segment, an elbow, a slimmer hooked lower segment. Not attached to anything.
  const grp = G(), femur = G(), elbow = G(), fm = _clawShard(A.fLen, A.fR, 0.0, seed, 6); fm.rotation.x = PI / 2; femur.add(fm);
  // spines down the underside of the upper segment, pointing down and forward
  for (let i = 0; i < A.spines; i++) { const u = (i + 0.8) / (A.spines + 0.4), sp = _clawShard(A.spineLen, A.spineR, 0.2, seed + i, 4); sp.position.set(0, -A.fR * (1 - 0.6 * u) * 0.9, A.fLen * u); sp.rotation.x = PI / 2 + 0.9; femur.add(sp); }
  const ball = new T.Mesh(new T.IcosahedronGeometry(A.fR * 0.75, 0), _zigBlack); ball.position.z = A.fLen; femur.add(ball);   // the elbow
  elbow.position.z = A.fLen; const tb = _clawShard(A.tLen, A.tR, A.hook * -1, seed + 11, 5); tb.rotation.x = PI / 2; elbow.add(tb);
  if (A.tarsus) { const ts = _clawShard(A.tLen * 0.35, A.tR * 0.5, A.hook * -1.5, seed + 13, 4); ts.rotation.x = PI / 2; ts.position.z = A.tLen * 0.95; elbow.add(ts); }
  femur.add(elbow); grp.add(femur); return { grp, femur, elbow };
}
const _zigStone = new T.MeshStandardMaterial({ color: 0x08090c, metalness: 0.1, roughness: 0.95, flatShading: true }); _zigStone.envMapIntensity = 0.12;
const _swordMat = new T.MeshStandardMaterial({ color: 0x050507, metalness: 0.85, roughness: 0.28, flatShading: true }); _swordMat.envMapIntensity = 1.6;
function _sword(L, w, th, bend, jag, seed, E) {   // a sword that points along +z: a hilt at the origin (cross-guard, grip, pommel), a long diamond-section blade tapering to a point
  const g = G(), rings = [[0.0, 1.0], [0.12, 1.0], [0.55, 0.9], [0.86, 0.55], [1.0, 0.0]], pos = [], idx = [];
  rings.forEach(([u, k], i) => { const j = jag ? 1 + jag * (_hz(i, seed, 3) - 0.5) : 1, ww = w * k * j, tt = th * (k * 0.8 + 0.2), z = u * L, x = bend * u * u * L * 0.3;
    pos.push(x + ww, 0, z, x, tt, z, x - ww, 0, z, x, -tt, z); });
  for (let i = 0; i < rings.length - 1; i++) for (let k = 0; k < 4; k++) { const a = i * 4 + k, b = i * 4 + (k + 1) % 4, c = (i + 1) * 4 + k, d = (i + 1) * 4 + (k + 1) % 4; idx.push(a, c, b, b, c, d); }
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(new Float32Array(pos), 3)); geo.setIndex(idx); geo.computeVertexNormals();
  const blade = new T.Mesh(geo.toNonIndexed(), _swordMat); blade.position.z = 0.0; blade.geometry.computeVertexNormals(); g.add(blade);
  const eg = new T.EdgesGeometry(geo, 12), ep = eg.attributes.position, ec = new Float32Array(ep.count * 3); for (let v = 0; v < ep.count; v++) { const u = ep.getZ(v) / L; ec[v * 3] = ec[v * 3 + 1] = ec[v * 3 + 2] = (0.2 + 0.8 * Math.min(1, u * 1.3)) * (0.6 + 0.4 * _hz(Math.floor(v / 2), 3, 7)); }
  eg.setAttribute('color', new T.BufferAttribute(ec, 3)); g.add(new T.LineSegments(eg, new T.LineBasicMaterial({ vertexColors: true, color: 0xd8deea, transparent: true, opacity: 0.55, blending: T.AdditiveBlending })));
  const guard = new T.Mesh(new T.BoxGeometry(w * 3.4, th * 1.6, 0.05), _zigStone); guard.position.z = -0.01; g.add(guard);
  const grip = new T.Mesh(new T.CylinderGeometry(th * 0.9, th * 0.9, 0.26, 6), _zigStone); grip.rotation.x = PI / 2; grip.position.z = -0.15; g.add(grip);
  const pom = new T.Mesh(new T.OctahedronGeometry(th * 1.5, 0), _zigStone); pom.position.z = -0.31; g.add(pom);
  // ELECTRIC: hot edges, a glowing fuller down the blade, lightning crawling along it, a halo of charge
  if (E) {
    const lines = g.children.filter(c => c.isLineSegments); if (E.edge) lines.forEach(l => { l.material.color.set(0xfff2a0); l.material.opacity = 1.0; });
    let fuller = null; if (E.fuller) { fuller = new T.Mesh(new T.BoxGeometry(th * 0.5, th * 0.5, L * 0.72), new T.MeshBasicMaterial({ color: 0xfff2a0, toneMapped: false, transparent: true })); fuller.position.set(0, th * 0.55, L * 0.5); g.add(fuller); }
    const arcs = []; for (let i = 0; i < (E.arcs || 0); i++) { const ln = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xfff6c0, transparent: true, opacity: 0.95 })); ln.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(10 * 3), 3)); ln.frustumCulled = false; g.add(ln); arcs.push(ln); }
    let halo = null; if (E.halo) { halo = glowSprite(L * 0.9); halo.material = halo.material.clone(); halo.material.opacity = 0.3; halo.position.z = L * 0.5; g.add(halo); }
    g.userData.tick = (ph, ac) => { const f = Math.floor(ph * 9);
      if (fuller) fuller.material.opacity = 0.55 + 0.35 * Math.sin(ph * 3 + seed) + 0.3 * ac;
      if (halo) halo.material.opacity = 0.18 + 0.12 * Math.sin(ph * 3 + seed * 2) + 0.3 * ac;
      arcs.forEach((ln, i) => { const on = ac > 0.2 || Math.sin(ph * 4 + seed + i * 2.1) * Math.sin(ph * 7 + i) > 0.1; ln.visible = on; if (!on) return; const pa = ln.geometry.attributes.position.array;
        for (let k = 0; k < 10; k++) { const u = k / 9, z = 0.05 * L + u * 0.9 * L, j = (_hz(k, seed + i, f) - 0.5) * 0.16 * Math.sin(u * PI) * (1 + ac), j2 = (_hz(k, seed + i + 5, f) - 0.5) * 0.12 * Math.sin(u * PI); pa[k * 3] = j + (i ? 0.02 : -0.02); pa[k * 3 + 1] = th + 0.02 + j2; pa[k * 3 + 2] = z; }
        ln.geometry.attributes.position.needsUpdate = true; }); };
  }
  return g;
}
function _prong(len, r, mode, seed) {   // a sharp shard, base at the origin pointing +y: "electric" = bright and faceted, "black" = polished black with a lit tip
  let geo = new T.ConeGeometry(r, len, 5, 1); const p = geo.attributes.position; for (let v = 0; v < p.count; v++) { const k = 1 + 0.25 * (_hz(Math.round(p.getX(v) * 300) + seed, Math.round(p.getY(v) * 300), Math.round(p.getZ(v) * 300)) - 0.5); p.setX(v, p.getX(v) * k); p.setZ(v, p.getZ(v) * k); }
  geo.translate(0, len / 2, 0); geo = geo.toNonIndexed(); geo.computeVertexNormals();
  const g = G();
  if (mode === 'black') { g.add(new T.Mesh(geo, _swordMat)); const tip = new T.Mesh(new T.OctahedronGeometry(r * 0.9, 0), new T.MeshBasicMaterial({ color: 0xfff2a0, toneMapped: false })); tip.position.y = len; tip.scale.y = 1.6; g.add(tip); g.userData.tip = tip; }
  else g.add(new T.Mesh(_litFacets(geo), new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false })));
  return g;
}
function _clumpArm(A, sx, seed) {   // an arm that is a solid clump (not a limb) bristling with sharp electric prongs, some long and thin like antennae
  const g = G(), lump = G(); g.add(lump);
  A.lumps.forEach((Lm, li) => { const geo = new T.IcosahedronGeometry(1, 1), p = geo.attributes.position; for (let v = 0; v < p.count; v++) { const x = p.getX(v), y = p.getY(v), z = p.getZ(v), n = 1 + 0.22 * (_hz(Math.round(x * 100) + seed + li, Math.round(y * 100), Math.round(z * 100)) - 0.5); p.setXYZ(v, x * n, y * n, z * n); } geo.computeVertexNormals();
    const m = new T.Mesh(geo, _zigStone); m.scale.set(Lm[3], Lm[4], Lm[5]); m.position.set(Lm[0], Lm[1], Lm[2]); lump.add(m); });
  const prongs = [], V = new T.Vector3(), Y = new T.Vector3(0, 1, 0);
  A.prongs.forEach((Pr, i) => { const [az, el, len, r] = Pr, d = new T.Vector3(Math.sin(az) * Math.cos(el) * sx, Math.sin(el), Math.cos(az) * Math.cos(el)).normalize(), pr = _prong(len, r, A.mode, seed + i);
    const base = d.clone().multiplyScalar(0.9).multiply(new T.Vector3(A.rx, A.ry, A.rz)); pr.position.copy(base); const q0 = new T.Quaternion().setFromUnitVectors(Y, d); pr.quaternion.copy(q0); lump.add(pr); prongs.push({ pr, q0, i, tip: pr.userData.tip }); });
  const spark = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xfff6c0, transparent: true, opacity: 0.95 })); spark.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(8 * 3), 3)); spark.frustumCulled = false; if (A.sparks) lump.add(spark);
  const E = new T.Euler(), Q = new T.Quaternion();
  g.userData.tick = (ph, ac) => { const f = Math.floor(ph * 9);
    prongs.forEach(P => { E.set(0.12 * Math.sin(ph * 2 + P.i * 1.7 + seed) * (1 + ac), 0, 0.12 * Math.sin(ph * 3 + P.i * 2.3) * (1 + ac)); Q.setFromEuler(E); P.pr.quaternion.copy(P.q0).multiply(Q); P.pr.scale.setScalar(1 + 0.15 * ac + 0.05 * Math.sin(ph * 4 + P.i)); if (P.tip) P.tip.scale.setScalar(1 + 0.4 * Math.sin(ph * 5 + P.i) + 0.6 * ac); });
    if (A.sparks) { const a = prongs[0], b = prongs[Math.min(prongs.length - 1, 1 + (f % 2))], pa = spark.geometry.attributes.position.array; const ta = new T.Vector3(0, A.prongs[0][2], 0).applyQuaternion(a.pr.quaternion).add(a.pr.position), tb = new T.Vector3(0, A.prongs[b.i][2], 0).applyQuaternion(b.pr.quaternion).add(b.pr.position);
      spark.visible = ac > 0.2 || Math.sin(ph * 4 + seed) * Math.sin(ph * 7) > 0; for (let k = 0; k < 8; k++) { const u = k / 7, j = (_hz(k, seed, f) - 0.5) * 0.14 * Math.sin(u * PI), j2 = (_hz(k, seed + 3, f) - 0.5) * 0.14 * Math.sin(u * PI); pa[k * 3] = ta.x + (tb.x - ta.x) * u + j; pa[k * 3 + 1] = ta.y + (tb.y - ta.y) * u + j2; pa[k * 3 + 2] = ta.z + (tb.z - ta.z) * u; } spark.geometry.attributes.position.needsUpdate = true; } };
  g.position.z = A.fwd || 0.35; return g;
}
function _zig(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1.3);
  const gp = _glowPool(o.glowR, 0.02); b.add(gp.g);
  const body = G(); b.add(body); const lit = _zigLit(), tierMat = o.dull ? _zigStone : _zigBlack;
  // the tiers, widest at the bottom; a lit band round the top edge of each step
  let y = 0; const tiers = []; o.tiers.forEach((T0, i) => { const [w, d, h] = T0, bx = new T.Mesh(new T.BoxGeometry(w, h, d), tierMat); bx.position.y = y + h / 2; body.add(bx);
    const band = new T.Mesh(new T.BoxGeometry(w + 0.012, 0.022, d + 0.012), lit); band.position.y = y + h + 0.012; body.add(band); tiers.push({ bx, band }); y += h + 0.03; });
  const topY = y;
  // a lamp on the roof, and (optionally) a lit slit across the front of the second step
  const lamp = new T.Mesh(new T.OctahedronGeometry(o.lampR, 0), new T.MeshBasicMaterial({ color: o.dull ? 0x4a4024 : 0xfff2a0, toneMapped: false })); lamp.scale.y = 1.4; lamp.position.y = topY + o.lampR * 1.2; body.add(lamp);
  let slit = null; if (o.slit) { const t1 = o.tiers[o.slit.tier || 1]; slit = new T.Mesh(new T.BoxGeometry(t1[0] * 0.62, 0.035, 0.02), new T.MeshBasicMaterial({ color: o.dull ? 0x3d351c : 0xfff2a0, toneMapped: false })); const ty = o.tiers.slice(0, (o.slit.tier || 1)).reduce((a, q) => a + q[2] + 0.03, 0) + t1[2] * 0.55; slit.position.set(0, ty, t1[1] / 2 + 0.012); body.add(slit); }
  // the two arms: big shards that float ahead, apart from the body
  const arms = []; for (const sx of [-1, 1]) { const A = o.arm, arm = G(); let ca = null; if (A.clump) { const cl = _clumpArm(A, sx, sx + 9); arm.add(cl); arm.userData.sw = cl; } else if (A.sword) { const sw = _sword(A.len, A.w, A.th, A.bend * sx, A.jag, sx + 5, A.elec); arm.add(sw); arm.userData.sw = sw; } else if (A.cicada) { ca = _cicadaArm(A, sx, sx + 3); arm.add(ca.grp); arm.scale.setScalar(A.size || 1); } else { const blade = _clawShard(A.len, A.r, A.bend * sx * -1, sx + 3, A.sides); blade.rotation.x = PI / 2; arm.add(blade); }
    if (A.second && !A.cicada) { const b2 = _clawShard(A.len * 0.6, A.r * 0.7, -A.bend * sx * -1, sx + 7, A.sides); b2.rotation.x = PI / 2 - 0.35; b2.position.y = -0.12; arm.add(b2); }
    b.add(arm); arms.push({ arm, sx, ca }); }
  let tipArc = null; if (o.arm.elec && o.arm.elec.between) { tipArc = new T.Line(new T.BufferGeometry(), new T.LineBasicMaterial({ color: 0xfff6c0, transparent: true, opacity: 0.95 })); tipArc.geometry.setAttribute('position', new T.BufferAttribute(new Float32Array(12 * 3), 3)); tipArc.frustumCulled = false; b.add(tipArc); }
  const L = new T.PointLight(0xffffff, 0.3, 3.5, 2); L.color.set(EL.color); L.position.set(0, topY + 0.4, 0.5); b.add(L); LIGHTS.push(L);
  return { g, core: (topY * 0.6) * (o.S || 1.3), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    const pull = Math.sin(ph), reach = o.arm.reach * (1 + 0.8 * ac);
    // the arms reach forward and haul; the body follows a beat behind, so it is dragged along; both settle again
    arms.forEach(A => { const a = A.arm; a.position.set(A.sx * o.arm.x, o.arm.y + 0.04 * Math.sin(ph * 2 + A.sx) + 0.1 * ac, o.arm.z + reach * (0.5 + 0.5 * pull) * 0.5 + 0.1 * Math.sin(ph + A.sx * 0.6)); a.rotation.set(0.05 * pull, A.sx * (o.arm.toe + 0.12 * Math.sin(ph * 2 + A.sx)), A.sx * (0.06 + 0.05 * Math.sin(ph)));
      if (a.userData.sw && a.userData.sw.userData.tick) a.userData.sw.userData.tick(ph, ac);
      if (A.ca) { const Q = o.arm; A.ca.femur.rotation.x = -(Q.lift + 0.22 * pull) - 0.15 * ac; A.ca.elbow.rotation.x = Q.fold + Q.flex * Math.sin(ph - 0.8) + 0.4 * ac; } });
    if (tipArc) { const fr = Math.floor(ph * 9), pa = tipArc.geometry.attributes.position.array, on = ac > 0.2 || Math.sin(ph * 3) > -0.3; tipArc.visible = on; const t0 = new T.Vector3(0, 0, o.arm.len).applyEuler(arms[0].arm.rotation).add(arms[0].arm.position), t1 = new T.Vector3(0, 0, o.arm.len).applyEuler(arms[1].arm.rotation).add(arms[1].arm.position);
      for (let k = 0; k < 12; k++) { const u = k / 11, jx = (_hz(k, 3, fr) - 0.5) * 0.2 * Math.sin(u * PI), jy = (_hz(k, 9, fr) - 0.5) * 0.2 * Math.sin(u * PI); pa[k * 3] = t0.x + (t1.x - t0.x) * u + jx; pa[k * 3 + 1] = t0.y + (t1.y - t0.y) * u + jy + 0.1 * Math.sin(u * PI); pa[k * 3 + 2] = t0.z + (t1.z - t0.z) * u; } tipArc.geometry.attributes.position.needsUpdate = true; }
    body.position.z = 0.1 * Math.sin(ph - 1.1) * (1 + 0.5 * ac) - 0.05 * ac; body.position.y = 0.012 * Math.abs(Math.sin(ph - 1.1)) - 0.03 * ac; body.rotation.x = -0.03 * Math.sin(ph - 1.1);
    const glow = 0.45 + 0.35 * Math.sin(ph * 2) * Math.sin(ph) + 0.4 * ac; lit.emissive.copy(new T.Color(EL.color)).multiplyScalar((0.09 + 0.1 * glow) * (o.dull ? 0.1 : 1)); lamp.scale.setScalar(1 + 0.2 * Math.sin(ph * 3) + 0.4 * ac); lamp.scale.y *= 1.4;
    gp.m.material.opacity = Math.max(0.15, Math.min(0.5, glow * 0.6)) * (o.dull ? 0.45 : 1); gp.m.scale.setScalar(1 + 0.1 * Math.sin(ph * 2) + 0.2 * ac); L.intensity = 0.4 + 1.0 * glow; } };
}
const _zb = { glowR: 0.7, lampR: 0.07, S: 1.15, tiers: [[1.0, 0.8, 0.2], [0.8, 0.62, 0.2], [0.6, 0.44, 0.2], [0.38, 0.28, 0.2]], arm: { len: 0.8, r: 0.13, bend: 0.5, x: 0.74, y: 0.4, z: 0.3, reach: 0.3, toe: 0.2, sides: 6 }, slit: { tier: 1 } };
fx(580, "A little ziggurat crab: a four-tier stepped body, a lit slit and a lamp on top, and two big blade arms floating ahead of it, not attached, hauling it along.", () => _zig(Object.assign({}, _zb)));
fx(581, "Low and wide, like a crab: three broad tiers, big curved pincer arms with a second claw each.", () => _zig(Object.assign({}, _zb, { tiers: [[1.2, 0.85, 0.2], [0.92, 0.62, 0.2], [0.6, 0.4, 0.2]], arm: { len: 0.85, r: 0.14, bend: 0.8, x: 0.84, y: 0.32, z: 0.3, reach: 0.34, toe: 0.28, sides: 6, second: true }, lampR: 0.08 })));
fx(582, "Tall and narrow: five tiers, long thin blade arms held high like antennae, pulling it forward.", () => _zig(Object.assign({}, _zb, { tiers: [[0.86, 0.7, 0.18], [0.7, 0.56, 0.18], [0.54, 0.42, 0.18], [0.4, 0.3, 0.18], [0.26, 0.2, 0.18]], arm: { len: 1.0, r: 0.09, bend: 0.3, x: 0.6, y: 0.78, z: 0.2, reach: 0.3, toe: 0.1, sides: 5 }, slit: { tier: 2 } })));
fx(583, "Chunky: thick hexagonal crystal arms, short and heavy, a body of fat steps.", () => _zig(Object.assign({}, _zb, { tiers: [[1.05, 0.9, 0.24], [0.82, 0.68, 0.24], [0.56, 0.44, 0.24]], arm: { len: 0.7, r: 0.19, bend: 0.2, x: 0.82, y: 0.38, z: 0.3, reach: 0.3, toe: 0.18, sides: 6 }, lampR: 0.09 })));
fx(584, "Swept sickles: the arms curve right round like crab claws; the body is turned a quarter so a corner leads.", () => { const f = _zig(Object.assign({}, _zb, { arm: { len: 0.9, r: 0.12, bend: 1.0, x: 0.78, y: 0.42, z: 0.25, reach: 0.34, toe: 0.38, sides: 6 }, slit: null })); return f; });

// ── The arms like a cicada's (Nos. 585–589): a stout spined upper segment, an elbow, a slimmer hooked lower segment: still just two, floating ahead, unattached ──
const _ca = { cicada: true, size: 1.45, x: 0.8, y: 0.46, z: 0.2, reach: 0.3, toe: 0.12, fLen: 0.55, fR: 0.12, spines: 4, spineLen: 0.2, spineR: 0.035, tLen: 0.55, tR: 0.075, hook: 0.7, lift: 0.3, fold: 0.9, flex: 0.45 };
fx(585, "Cicada arms: a stout spined upper segment, an elbow, a slim hooked lower segment, floating ahead of the ziggurat and hauling it.", () => _zig(Object.assign({}, _zb, { arm: _ca })));
fx(586, "A big spined femur and a short stout hook folded back on it, like a cicada's jack-knifed fore leg.", () => _zig(Object.assign({}, _zb, { arm: Object.assign({}, _ca, { fLen: 0.62, fR: 0.16, spines: 5, tLen: 0.38, tR: 0.09, fold: 1.5, flex: 0.35, lift: 0.2 }) })));
fx(587, "Held high: the upper segments raised like a mantis, the hooks coming down in front.", () => _zig(Object.assign({}, _zb, { arm: Object.assign({}, _ca, { y: 0.62, lift: 0.75, fold: 1.6, flex: 0.4, tLen: 0.6 }) })));
fx(588, "Rowing: both arms swung wide forward like oars, long thin lower segments.", () => _zig(Object.assign({}, _zb, { arm: Object.assign({}, _ca, { x: 0.9, toe: 0.45, fLen: 0.5, tLen: 0.75, tR: 0.06, hook: 0.5, lift: 0.1, fold: 0.4, flex: 0.5, spines: 3 }) })));
fx(589, "Three big spines on the upper segment, and a tiny second claw at the tip of each hook.", () => _zig(Object.assign({}, _zb, { arm: Object.assign({}, _ca, { spines: 3, spineLen: 0.3, spineR: 0.05, tarsus: true, tLen: 0.5 }) })));

// ── Swords, not claws, and a dull body (Nos. 590–594): the two floating arms are swords, hilts back, points forward, hauling the ziggurat; the body is stone, not bright ──
const _zsw = { sword: true, len: 1.1, w: 0.075, th: 0.03, bend: 0, jag: 0, x: 0.78, y: 0.42, z: 0.0, reach: 0.34, toe: 0.08 };
const _dz = Object.assign({}, _zb, { dull: true, glowR: 0.55, lampR: 0.05, slit: { tier: 1 } });
fx(590, "Dull stone ziggurat, two floating swords beside it, hilts back and points forward, hauling it along.", () => _zig(Object.assign({}, _dz, { arm: _zsw })));
fx(591, "Greatswords: broad heavy blades.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _zsw, { len: 1.25, w: 0.12, th: 0.04 }) })));
fx(592, "Curved blades, like sabres, the points swept inward.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _zsw, { bend: 1.6, w: 0.08 }) })));
fx(593, "The swords splay out in a V ahead of the body, wider and longer.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _zsw, { x: 0.6, toe: 0.4, len: 1.3 }) })));
fx(594, "Shard-swords: long blades with notched, uneven edges, like broken crystal.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _zsw, { jag: 0.7, len: 1.2, w: 0.09 }) })));

// ── ELECTRIC swords (Nos. 595–599) ──
fx(595, "Electric swords: the edges white-hot, a charge flickering along each blade.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _zsw, { elec: { edge: true, arcs: 1 } }) })));
fx(596, "Lightning crawling along each blade, two bolts a side, the edges hot.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _zsw, { elec: { edge: true, arcs: 2 } }) })));
fx(597, "A glowing core down the middle of each black blade, pulsing, like a lit fuller.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _zsw, { len: 1.2, w: 0.09, elec: { fuller: true, edge: true } }) })));
fx(598, "A bolt jumping between the two sword tips across the front of the body.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _zsw, { x: 0.62, toe: -0.12, elec: { edge: true, arcs: 1, between: true } }) })));
fx(599, "Charged: a halo of plasma round each blade, a glowing core, bolts along it.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _zsw, { len: 1.2, w: 0.09, elec: { fuller: true, edge: true, arcs: 1, halo: true } }) })));

// ── Clump arms with electric prongs (Nos. 600–604): "cicada" arms made as a solid clump, not a limb, bristling with sharp electric shards that could be antennae ──
const _clA = { clump: true, x: 0.78, y: 0.4, z: 0.0, reach: 0.3, toe: 0.1, fwd: 0.4, mode: 'electric', rx: 0.2, ry: 0.15, rz: 0.34,
  lumps: [[0, 0, 0, 0.2, 0.15, 0.34]],
  prongs: [[0.25, 0.25, 0.75, 0.025], [-0.15, 0.4, 0.7, 0.022], [0.55, 0.05, 0.62, 0.025], [0.0, 0.1, 0.9, 0.02], [0.9, 0.55, 0.22, 0.045], [-0.7, 0.6, 0.2, 0.045], [1.5, 0.0, 0.18, 0.05]] };
fx(600, "Fat clump arms: a solid faceted lump each, with long thin electric prongs fanning forward like antennae and a few short sharp spikes.", () => _zig(Object.assign({}, _dz, { arm: _clA })));
fx(601, "Spiked boulders: round heavy clumps with a crown of short sharp electric prongs all round, like a mace.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _clA, { lumps: [[0, 0, 0, 0.26, 0.24, 0.28]], rx: 0.26, ry: 0.24, rz: 0.28, prongs: [[0, 0.1, 0.34, 0.05], [1.05, 0.2, 0.3, 0.05], [-1.05, 0.2, 0.3, 0.05], [2.1, 0.1, 0.3, 0.05], [-2.1, 0.1, 0.3, 0.05], [0.5, 1.0, 0.3, 0.05], [-0.5, 1.0, 0.3, 0.05], [0.0, -0.9, 0.3, 0.05]] }) })));
fx(602, "Angular fists: a wedge-shaped solid block each, two very long antenna prongs with a spark crackling between the tips.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _clA, { sparks: true, lumps: [[0, 0, 0, 0.18, 0.18, 0.3], [0, 0.06, 0.22, 0.12, 0.12, 0.16]], prongs: [[0.2, 0.3, 1.05, 0.02], [-0.2, 0.35, 1.0, 0.02], [0.8, 0.5, 0.3, 0.04], [-0.8, 0.5, 0.3, 0.04]] }) })));
fx(603, "A bundle: several fused lumps with many fine antenna prongs fanning forward, a bristling cluster.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _clA, { lumps: [[0, 0, 0, 0.16, 0.14, 0.3], [0.1, 0.1, 0.12, 0.12, 0.12, 0.18], [-0.1, -0.05, 0.14, 0.1, 0.1, 0.16]], prongs: [[0.0, 0.2, 0.9, 0.016], [0.3, 0.3, 0.8, 0.016], [-0.3, 0.3, 0.8, 0.016], [0.55, 0.15, 0.7, 0.016], [-0.55, 0.15, 0.7, 0.016], [0.15, 0.55, 0.6, 0.018], [-0.15, 0.55, 0.6, 0.018], [0.8, 0.35, 0.5, 0.02]] }) })));
fx(604, "Black prongs: the clump and its prongs polished black, only the tips electric, lit like sparks on antenna ends.", () => _zig(Object.assign({}, _dz, { arm: Object.assign({}, _clA, { mode: 'black', sparks: true }) })));
