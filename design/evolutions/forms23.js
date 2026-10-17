// ── THE ZIGGURAT CRAB · the electric brawler, Nos. 580–: a little stepped-pyramid body that sits on the ground, and just TWO big shard arms that float
// ahead of it, NOT attached, pulling it along. Nothing else: no legs, no extra parts. ──
const _zigBlack = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.5, roughness: 0.36, flatShading: true }); _zigBlack.envMapIntensity = 0.7;
function _zigLit() { const m = new T.MeshStandardMaterial({ color: 0x0a0800, emissive: new T.Color(EL.color).multiplyScalar(0.11), emissiveIntensity: 1.0, roughness: 1, metalness: 0 }); m.envMapIntensity = 0; return m; }
function _clawShard(len, r, bend, seed, sides) {   // a big polished-black blade: a faceted cone that curls at the tip, crests glinting
  const geo = new T.ConeGeometry(r, len, sides || 6, 6), p = geo.attributes.position;
  for (let v = 0; v < p.count; v++) { const y = p.getY(v), u = (y + len / 2) / len, k = 1 + 0.18 * (_hz(Math.round(p.getX(v) * 200) + seed, Math.round(y * 200), Math.round(p.getZ(v) * 200)) - 0.5); p.setX(v, p.getX(v) * k + bend * u * u * len * 0.5); p.setZ(v, p.getZ(v) * k); }
  geo.translate(0, len / 2, 0); geo.computeVertexNormals();
  const pm = new T.MeshStandardMaterial({ color: 0x000001, metalness: 0.9, roughness: 0.2, flatShading: true }); pm.envMapIntensity = 2.0;
  const eg = new T.EdgesGeometry(geo, 25), ep = eg.attributes.position, ec = new Float32Array(ep.count * 3); let y0 = 1e9, y1 = -1e9; for (let v = 0; v < ep.count; v++) { y0 = Math.min(y0, ep.getY(v)); y1 = Math.max(y1, ep.getY(v)); }
  for (let v = 0; v < ep.count; v++) { const u = (ep.getY(v) - y0) / Math.max(1e-6, y1 - y0), k = (0.25 + 0.75 * u) * (0.55 + 0.45 * _hz(Math.floor(v / 2), 3, 5)); ec[v * 3] = ec[v * 3 + 1] = ec[v * 3 + 2] = k; }
  eg.setAttribute('color', new T.BufferAttribute(ec, 3));
  const gg = G(); gg.add(new T.Mesh(geo, pm)); gg.add(new T.LineSegments(eg, new T.LineBasicMaterial({ vertexColors: true, color: 0xfff6b0, transparent: true, opacity: 0.8, blending: T.AdditiveBlending }))); return gg;
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
function _zig(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1.3);
  const gp = _glowPool(o.glowR, 0.02); b.add(gp.g);
  const body = G(); b.add(body); const lit = _zigLit();
  // the tiers, widest at the bottom; a lit band round the top edge of each step
  let y = 0; const tiers = []; o.tiers.forEach((T0, i) => { const [w, d, h] = T0, bx = new T.Mesh(new T.BoxGeometry(w, h, d), _zigBlack); bx.position.y = y + h / 2; body.add(bx);
    const band = new T.Mesh(new T.BoxGeometry(w + 0.012, 0.022, d + 0.012), lit); band.position.y = y + h + 0.012; body.add(band); tiers.push({ bx, band }); y += h + 0.03; });
  const topY = y;
  // a lamp on the roof, and (optionally) a lit slit across the front of the second step
  const lamp = new T.Mesh(new T.OctahedronGeometry(o.lampR, 0), new T.MeshBasicMaterial({ color: 0xfff2a0, toneMapped: false })); lamp.scale.y = 1.4; lamp.position.y = topY + o.lampR * 1.2; body.add(lamp);
  let slit = null; if (o.slit) { const t1 = o.tiers[o.slit.tier || 1]; slit = new T.Mesh(new T.BoxGeometry(t1[0] * 0.62, 0.035, 0.02), new T.MeshBasicMaterial({ color: 0xfff2a0, toneMapped: false })); const ty = o.tiers.slice(0, (o.slit.tier || 1)).reduce((a, q) => a + q[2] + 0.03, 0) + t1[2] * 0.55; slit.position.set(0, ty, t1[1] / 2 + 0.012); body.add(slit); }
  // the two arms: big shards that float ahead, apart from the body
  const arms = []; for (const sx of [-1, 1]) { const A = o.arm, arm = G(); let ca = null; if (A.cicada) { ca = _cicadaArm(A, sx, sx + 3); arm.add(ca.grp); arm.scale.setScalar(A.size || 1); } else { const blade = _clawShard(A.len, A.r, A.bend * sx * -1, sx + 3, A.sides); blade.rotation.x = PI / 2; arm.add(blade); }
    if (A.second && !A.cicada) { const b2 = _clawShard(A.len * 0.6, A.r * 0.7, -A.bend * sx * -1, sx + 7, A.sides); b2.rotation.x = PI / 2 - 0.35; b2.position.y = -0.12; arm.add(b2); }
    b.add(arm); arms.push({ arm, sx, ca }); }
  const L = new T.PointLight(0xffffff, 0.3, 3.5, 2); L.color.set(EL.color); L.position.set(0, topY + 0.4, 0.5); b.add(L); LIGHTS.push(L);
  return { g, core: (topY * 0.6) * (o.S || 1.3), update(t, act) { const ph = 1.6 * t, ac = act || 0;
    const pull = Math.sin(ph), reach = o.arm.reach * (1 + 0.8 * ac);
    // the arms reach forward and haul; the body follows a beat behind, so it is dragged along; both settle again
    arms.forEach(A => { const a = A.arm; a.position.set(A.sx * o.arm.x, o.arm.y + 0.04 * Math.sin(ph * 2 + A.sx) + 0.1 * ac, o.arm.z + reach * (0.5 + 0.5 * pull) * 0.5 + 0.1 * Math.sin(ph + A.sx * 0.6)); a.rotation.set(0.05 * pull, A.sx * (o.arm.toe + 0.12 * Math.sin(ph * 2 + A.sx)), A.sx * (0.06 + 0.05 * Math.sin(ph)));
      if (A.ca) { const Q = o.arm; A.ca.femur.rotation.x = -(Q.lift + 0.22 * pull) - 0.15 * ac; A.ca.elbow.rotation.x = Q.fold + Q.flex * Math.sin(ph - 0.8) + 0.4 * ac; } });
    body.position.z = 0.1 * Math.sin(ph - 1.1) * (1 + 0.5 * ac) - 0.05 * ac; body.position.y = 0.012 * Math.abs(Math.sin(ph - 1.1)) - 0.03 * ac; body.rotation.x = -0.03 * Math.sin(ph - 1.1);
    const glow = 0.45 + 0.35 * Math.sin(ph * 2) * Math.sin(ph) + 0.4 * ac; lit.emissive.copy(new T.Color(EL.color)).multiplyScalar(0.09 + 0.1 * glow); lamp.scale.setScalar(1 + 0.2 * Math.sin(ph * 3) + 0.4 * ac); lamp.scale.y *= 1.4;
    gp.m.material.opacity = Math.max(0.15, Math.min(0.5, glow * 0.6)); gp.m.scale.setScalar(1 + 0.1 * Math.sin(ph * 2) + 0.2 * ac); L.intensity = 0.4 + 1.0 * glow; } };
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
