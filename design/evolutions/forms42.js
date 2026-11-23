// ── THE MANTA RAY · No. 948 (draft, 2026-11-23) ───────────────────────────────────────────────────────────────────────────────────────────────────────────────
// The owner, 2026-11-23, with a concept sheet (MANTA RAY, Electric Technician): "I want to switch out the electric technician for this creature, which is a manta ray. I don't know why
// but the AI agent I was using made it look like he has ears on its back, but those are tails that should be more towards the back of the creature".
// The sheet: a body of jet black gel, a smooth mound with two wide wings, their tips turned up; its edges see-through violet, glowing; a cluster of electric yellow crystal tucked
// under each wing; three wavy tails, violet going to yellow at their tips. The sheet draws the tails rising out of the middle of its back (its note: "Tail Origin (High on Back)").
//   948  THE MANTA RAY: the sheet's creature with THE TAILS AT ITS REAR, as the owner asked: all three leave the point its trailing edges meet in, and stream out behind it, low,
//        so they read as tails. A DRAFT for the owner's yes or corrections (docs/ART-PROCESS.md: one piece first). The Hover Shell (No. 882) is still the game's electric technician.
//        Its idle is a glide: one slow beat of its wings a loop, a wave running out to their tips; it banks and bobs a little; the tails ripple from root to tip.
//        Its action (the agent's, for the owner to change): its wings lift, then beat down hard; the crystals flare and an arc jumps between them under its belly; the tails spread and go stiff behind it (they never stand up).
// Every measure in _mr0 is the agent's, from the sheet by eye. Smooth, not faceted: the sheet's gel has no facets (the game's other forms are cut in flat faces).
// Uses forms21/29/31's helpers (_glowPool, _limb, _lin31, _c31, _hot31, _prog31). +z is the front; ph = 1.6 t runs once round the idle loop.

function _mantaRay(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1);
  const yel = _c31(EL.color).convertSRGBToLinear(), vio = _lin31(o.violet), vioHi = _lin31(o.violetHi), blk = _lin31(o.black), deep = _lin31(o.deep);
  const unit = G(); unit.position.y = o.hover; b.add(unit);
  const NJ = o.nj, NK = o.nk, NR = 2 * NK, n = NJ * NR, W = o.W, cl = v => Math.min(1, Math.max(0, v)), sm = (a, b2, x) => { const u = cl((x - a) / (b2 - a)); return u * u * (3 - 2 * u); };
  // THE BODY: one skin. A wing section (round at its front edge, thin at its back) at every station across its span, tip to tip; thick in the middle (the mound), thin in the wings.
  // Seen from above it is a manta's diamond: a broad round front, the front edges swept back to the tips, the back edges drawn in to a point at its rear, where the tails leave it.
  const cT = 0.5 / (0.5 + o.topP), fTm = Math.sqrt(cT) * Math.pow(1 - cT, o.topP), cB = 0.5 / (0.5 + o.botP), fBm = Math.sqrt(cB) * Math.pow(1 - cB, o.botP);
  const fT = c => Math.sqrt(c) * Math.pow(1 - c, o.topP) / fTm, fB = c => Math.sqrt(c) * Math.pow(1 - c, o.botP) / fBm;
  const zLead = aX => o.zNose - o.sweep * Math.pow(aX, o.sweepP), zTrail = aX => Math.min(o.zTail + (o.zTipT - o.zTail) * Math.pow(aX, o.trailP), zLead(aX) - o.tipChord);
  const tTop = aX => o.hDome * Math.exp(-Math.pow(aX / o.domeW, 2)) + o.hWing * Math.pow(1 - aX, 0.8) + o.hEdge, tBot = aX => o.bDome * Math.exp(-Math.pow(aX / o.bellyW, 2)) + o.bWing * Math.pow(1 - aX, 0.8) + o.hEdge;
  const rest = aX => o.tipUp * Math.pow(aX, o.tipP) - o.droop * Math.sin(PI * aX);   // (the wings at rest: a shallow dip, the tips turned up)
  const P = { ph: 0, amp: o.flap, lift: 0 };
  const beat = (aX, c) => P.amp * Math.pow(aX, 1.5) * Math.sin(P.ph - o.lag * aX - o.lagC * c) + P.lift * Math.pow(aX, 1.3);
  const surf = (X, c, top, out) => { const aX = Math.abs(X), zL = zLead(aX), zT = zTrail(aX); out.x = X * W; out.z = zL + (zT - zL) * c; out.y = rest(aX) + beat(aX, c) + (top ? tTop(aX) * fT(c) : -tBot(aX) * fB(c)); return out; };
  // (what never changes of a vertex is worked out once: where it is across and along, its height at rest, how far the beat moves it and how late)
  const pos = new Float32Array(n * 3), y0 = new Float32Array(n), wB = new Float32Array(n), off = new Float32Array(n), wL = new Float32Array(n), colB = new Float32Array(n * 3), colG = new Float32Array(n * 4), q3 = V(0, 0, 0), k3 = new T.Color();
  for (let j = 0; j < NJ; j++) { const X = j / (NJ - 1) * 2 - 1, aX = Math.abs(X), zL = zLead(aX), zT = zTrail(aX), ch = zL - zT;
    for (let r = 0; r < NR; r++) { const i = j * NR + r, top = r <= NK, c = (1 - Math.cos(PI * (top ? r : NR - r) / NK)) / 2;
      pos[i * 3] = X * W; pos[i * 3 + 2] = zL - ch * c; y0[i] = rest(aX) + (top ? tTop(aX) * fT(c) : -tBot(aX) * fB(c)); wB[i] = Math.pow(aX, 1.5); off[i] = o.lag * aX + o.lagC * c; wL[i] = Math.pow(aX, 1.3);
      // how near the outline it is (1 on it): the gel is black, its skin goes to deep violet toward its edges, and a glow is laid over that, see-through violet, palest on the rim itself
      const e = Math.max(1 - cl(Math.min(c, 1 - c) * ch / o.margin), 1 - cl((1 - aX) * W / (o.margin * 1.3)));
      k3.copy(blk).lerp(deep, Math.pow(e, 1.4) * 0.9); colB[i * 3] = k3.r; colB[i * 3 + 1] = k3.g; colB[i * 3 + 2] = k3.b;
      // (the crystals light the skin round them yellow: all of it underneath, and the rim itself above)
      const gy = Math.exp(-(Math.pow((aX - o.cryX) / o.cryGlow[0], 2) + Math.pow((c - o.cryC) / o.cryGlow[1], 2))) * (top ? 1 - sm(0, 0.08, c) : 1), al = Math.pow(e, o.glowP) * o.glowA * (top ? 1 : 0.8), w = 1.6 * gy / (1.6 * gy + al + 1e-4);
      k3.copy(vio).lerp(vioHi, Math.pow(e, 6)).lerp(yel, w); colG[i * 4] = k3.r; colG[i * 4 + 1] = k3.g; colG[i * 4 + 2] = k3.b; colG[i * 4 + 3] = Math.max(al, 0.92 * gy); } }
  const idx = []; for (let j = 0; j < NJ - 1; j++) for (let r = 0; r < NR; r++) { const a = j * NR + r, b2 = j * NR + (r + 1) % NR, c = a + NR, d = b2 + NR; idx.push(a, c, b2, b2, c, d); }
  for (let r = 1; r < NR - 1; r++) { idx.push(0, r, r + 1); const e = (NJ - 1) * NR; idx.push(e, e + r + 1, e + r); }   // (the two tips closed)
  const aPos = new T.BufferAttribute(pos, 3); aPos.setUsage(T.DynamicDrawUsage);
  const geo = new T.BufferGeometry(); geo.setAttribute('position', aPos); geo.setAttribute('color', new T.BufferAttribute(colB, 3)); geo.setIndex(idx);
  const gelM = new T.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, metalness: 0, roughness: o.rough }); gelM.envMapIntensity = o.env;
  const body = new T.Mesh(geo, gelM); body.userData.dynamic = true; unit.add(body);   // (dynamic: its shape is written again every pose. Said outright, for the 3D view, which merges a body's still parts and finds them by sampling: view3d/core.js mergeRigid)
  const geoG = new T.BufferGeometry(); geoG.setAttribute('position', aPos); geoG.setAttribute('color', new T.BufferAttribute(colG, 4)); geoG.setIndex(idx);   // (the glow: the same skin, the same vertices)
  const glowM = new T.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -2 });
  const glow = new T.Mesh(geoG, glowM); glow.renderOrder = 1; glow.userData.dynamic = true; unit.add(glow);
  // a soft fringe of light out past its outline, fading to nothing: the sheet's see-through edge
  const NL = 2 * NJ, ring = [], zc = (o.zNose + o.zTail) / 2, hp = new Float32Array(NL * 6), hd = new Float32Array(NL * 2), hc = new Float32Array(NL * 8), hi = [];
  for (let j = 0; j < NJ; j++) ring.push(j * NR); for (let j = NJ - 1; j >= 0; j--) ring.push(j * NR + NK);
  for (let k = 0; k < NL; k++) { const i = ring[k], dx = pos[i * 3], dz = pos[i * 3 + 2] - zc, L = Math.hypot(dx, dz) || 1; hd[k * 2] = dx / L * o.halo; hd[k * 2 + 1] = dz / L * o.halo;
    hc[k * 8] = colG[i * 4]; hc[k * 8 + 1] = colG[i * 4 + 1]; hc[k * 8 + 2] = colG[i * 4 + 2]; hc[k * 8 + 3] = o.haloA; hc[k * 8 + 4] = vio.r; hc[k * 8 + 5] = vio.g; hc[k * 8 + 6] = vio.b; hc[k * 8 + 7] = 0;
    const a = k * 2, a2 = ((k + 1) % NL) * 2; hi.push(a, a + 1, a2, a2, a + 1, a2 + 1); }
  const aHalo = new T.BufferAttribute(hp, 3); aHalo.setUsage(T.DynamicDrawUsage);
  const geoH = new T.BufferGeometry(); geoH.setAttribute('position', aHalo); geoH.setAttribute('color', new T.BufferAttribute(hc, 4)); geoH.setIndex(hi);
  const haloM = new T.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, transparent: true, depthWrite: false, toneMapped: false, side: T.DoubleSide }); haloM.userData.noInk = true;
  const halo = new T.Mesh(geoH, haloM); halo.renderOrder = 2; halo.userData.dynamic = true; if (o.halo > 0) unit.add(halo);

  // THE TAILS: three, out of the point at its rear, streaming back behind it, low; thick where they leave it and drawn out to a point; black at the root, violet along, yellow at the tip
  const NQ = o.tailQ, NS = 7, STOPS = [[0, blk], [0.1, deep], [0.3, vio], [0.62, vio.clone().lerp(vioHi, 0.4)], [0.8, yel], [1, yel.clone().lerp(_c31(0xffffff), 0.4)]];
  const tailM = new T.MeshBasicMaterial({ color: 0xffffff, vertexColors: true, toneMapped: false, side: T.DoubleSide }); tailM.userData.noInk = true;   // (light, not a solid thing: the 3D view draws no ink line round them, which at their width would be all there was to see)
  const tails = o.tails.map(td => { const nv = (NQ + 1) * NS, tp = new Float32Array(nv * 3), tc = new Float32Array(nv * 3), ti = [];
    for (let i = 0; i <= NQ; i++) { const q = i / NQ; let s = 0; while (s < STOPS.length - 2 && q > STOPS[s + 1][0]) s++; k3.copy(STOPS[s][1]).lerp(STOPS[s + 1][1], cl((q - STOPS[s][0]) / (STOPS[s + 1][0] - STOPS[s][0])));
      for (let e = 0; e < NS; e++) { const v = (i * NS + e) * 3; tc[v] = k3.r; tc[v + 1] = k3.g; tc[v + 2] = k3.b; if (i < NQ) { const a = i * NS + e, b2 = i * NS + (e + 1) % NS; ti.push(a, a + NS, b2, b2, a + NS, b2 + NS); } } }
    const at = new T.BufferAttribute(tp, 3); at.setUsage(T.DynamicDrawUsage); const tg = new T.BufferGeometry(); tg.setAttribute('position', at); tg.setAttribute('color', new T.BufferAttribute(tc, 3)); tg.setIndex(ti);
    const m = new T.Mesh(tg, tailM); m.frustumCulled = false; m.userData.dynamic = true; unit.add(m); return { td, tp, at, m }; });
  // a tail's middle line at q (0 its root, 1 its tip): back from its root, rising a little, a wave running down it that grows toward the tip, its tip curled up
  const R0 = V(0, 0, 0), ctr = (td, q, whip, out) => { const wv = o.wave * (1 - 0.55 * whip) * sm(0, 0.4, q) * (0.45 + 0.55 * q);
    out.x = R0.x + td.fan * (1 + 0.5 * whip) * Math.pow(q, 1.3) * td.len + o.sway * q * Math.sin(P.ph + td.p2) + o.waveX * (1 - 0.55 * whip) * sm(0, 0.4, q) * Math.sin(TAU * td.k * 0.8 * q - 2 * P.ph + td.p + 1.7); out.z = R0.z + o.tailIn - td.len * q * (1 - 0.12 * whip);
    out.y = R0.y + td.rise * td.len * q + td.up * (1 - 0.5 * whip) * Math.pow(q, 2.4) + wv * Math.sin(TAU * td.k * q - 2 * P.ph + td.p); return out; };
  const c0 = V(0, 0, 0), c1 = V(0, 0, 0), tg3 = V(0, 0, 0), n3 = V(0, 0, 0), b3 = V(0, 0, 0), XA = V(1, 0, 0);

  // THE CRYSTALS: a cluster tucked up under each wing, its points hanging down; electric yellow, cut in facets
  const cryM = new T.MeshStandardMaterial({ color: yel, emissive: yel, emissiveIntensity: 0.9, roughness: 0.18, metalness: 0, flatShading: true }), crys = [], flares = [];
  const flareM = new T.MeshBasicMaterial({ color: yel.clone().lerp(_c31(0xffffff), 0.6), transparent: true, opacity: 0.6, depthWrite: false, toneMapped: false });   // (the flare: a pale shell over each shard while the zap is on; shown and hidden, so the 3D view, which gives a body its own copies of its materials, shows it too)
  for (const sx of [-1, 1]) { const cg = G(); unit.add(cg);
    for (const [x, y, z, s, lean, turn] of o.shards) { const m = new T.Mesh(new T.OctahedronGeometry(1, 0), cryM); m.scale.set(o.cry * 0.72 * s, o.cry * 0.66 * s, o.cry * 0.6 * s); m.position.set(x * sx, y, z); m.rotation.set(turn * 0.4, turn, lean * sx); cg.add(m);
      const f = new T.Mesh(m.geometry, flareM); f.scale.copy(m.scale).multiplyScalar(1.16); f.position.copy(m.position); f.rotation.copy(m.rotation); f.visible = false; cg.add(f); flares.push(f); }
    crys.push({ sx, cg }); }
  // the zap: an arc between the two clusters, under its belly
  const arcM = _hot31(yel.clone().lerp(_c31(0xffffff), 0.55)), arc = []; for (let i = 0; i < 7; i++) { const l = _limb(unit, 0.011, arcM, 4); l.m.visible = false; arc.push(l); }
  const fl = _glowPool(o.pool, 0.012); fl.m.material = fl.m.material.clone(); fl.m.material.color.copy(_c31(EL.color)); fl.m.material.opacity = o.poolA; b.add(fl.g);   // its light on the floor
  const Lt0 = new T.PointLight(0xffffff, 0.8, 3, 2); Lt0.color.copy(_c31(EL.color)); Lt0.position.set(0, -0.2, 0.05); unit.add(Lt0); LIGHTS.push(Lt0);
  const pa = V(0, 0, 0), pb = V(0, 0, 0), s0 = V(0, 0, 0), s1 = V(0, 0, 0);
  return { g, core: (o.hover + 0.05) * (o.S || 1), update(t, act) {
    const ph = 1.6 * t, a = act || 0, pr = _prog31(t, act);
    // the action, by how far through it is: the wings lift, beat down hard and come back; the zap between; (at its two ends it is the glide again)
    const up = sm(0, 0.32, pr) - 1.7 * sm(0.36, 0.5, pr) + 0.7 * sm(0.55, 1, pr), zap = pr > 0.38 && pr < 0.92 ? Math.sin(PI * (pr - 0.38) / 0.54) : 0, whip = pr > 0 ? sm(0.34, 0.52, pr) * (1 - sm(0.62, 1, pr)) : 0;
    P.ph = ph; P.amp = o.flap * (1 - 0.8 * a); P.lift = o.lift * up;
    for (let i = 0; i < n; i++) pos[i * 3 + 1] = y0[i] + P.amp * wB[i] * Math.sin(ph - off[i]) + P.lift * wL[i];
    aPos.needsUpdate = true; geo.computeVertexNormals();
    for (let k = 0; k < NL; k++) { const i = ring[k] * 3, v = k * 6; hp[v] = pos[i]; hp[v + 1] = pos[i + 1]; hp[v + 2] = pos[i + 2]; hp[v + 3] = pos[i] + hd[k * 2]; hp[v + 4] = pos[i + 1]; hp[v + 5] = pos[i + 2] + hd[k * 2 + 1]; }
    aHalo.needsUpdate = true;
    // the glide: it bobs against its wings' beat, noses up and down a little, and banks; the beat down lifts it and tips its nose up
    unit.position.set(0, o.hover + o.bob * Math.sin(ph + 2.4) * (1 - a) + 0.07 * Math.max(0, -up), 0); unit.rotation.set(0.035 * Math.sin(ph + 0.6) * (1 - a) - 0.05 * Math.max(0, up) - 0.08 * Math.max(0, -up), 0, 0.045 * Math.sin(ph) * (1 - a));
    for (const tl of tails) { const td = tl.td, tp = tl.tp; surf(td.x, o.tailC, true, R0); R0.y -= o.tailSink;
      for (let i = 0; i <= NQ; i++) { const q = i / NQ, rad = td.r * Math.pow(1 - q, o.tailP) * sm(-0.03, 0.09, q) + 0.0015;
        ctr(td, q, whip, c0); ctr(td, Math.min(1, q + 0.02), whip, c1); if (q + 0.02 > 1) { ctr(td, q - 0.02, whip, tg3); tg3.subVectors(c0, tg3); } else tg3.subVectors(c1, c0);
        tg3.normalize(); n3.crossVectors(tg3, XA).normalize(); b3.crossVectors(tg3, n3);
        for (let e = 0; e < NS; e++) { const th = e / NS * TAU, cs = Math.cos(th) * rad, sn = Math.sin(th) * rad, v = (i * NS + e) * 3; tp[v] = c0.x + n3.x * cs + b3.x * sn; tp[v + 1] = c0.y + n3.y * cs + b3.y * sn; tp[v + 2] = c0.z + n3.z * cs + b3.z * sn; } }
      tl.at.needsUpdate = true; }
    const kg = 0.92 + 0.08 * Math.sin(ph * 2) + 0.45 * zap; glow.material.color.setScalar(kg); halo.material.color.setScalar(kg); for (const tl of tails) tl.m.material.color.setScalar(0.94 + 0.06 * Math.sin(ph * 2 + 1.2) + 0.5 * zap);   // (each mesh's own material, whichever copy of it that is by now)
    cryM.emissiveIntensity = 0.85 + 0.15 * Math.sin(ph * 2 + 0.6) + 1.3 * zap; for (const f of flares) f.visible = zap > 0.15;
    for (const c of crys) { surf(c.sx * o.cryX, o.cryC, false, s0); surf(c.sx * (o.cryX + 0.06), o.cryC, false, s1); c.cg.position.set(s0.x, s0.y + o.cry * o.tuck, s0.z); c.cg.rotation.z = Math.atan2(s1.y - s0.y, s1.x - s0.x) - (c.sx < 0 ? PI : 0); }
    pa.copy(crys[0].cg.position); pa.y -= o.cry * 0.55; pb.copy(crys[1].cg.position); pb.y -= o.cry * 0.55;
    for (let i = 0; i < arc.length; i++) { const f0 = i / arc.length, f1 = (i + 1) / arc.length, jit = f => (f === 0 || f === 1) ? 0 : 0.045 * Math.sin(37 * f + 13 * t) + 0.03 * Math.sin(71 * f - 29 * t), sag = f => -0.07 * Math.sin(PI * f);
      s0.copy(pa).lerp(pb, f0); s0.y += jit(f0) + sag(f0); s0.z += jit(f0) * 0.7; s1.copy(pa).lerp(pb, f1); s1.y += jit(f1) + sag(f1); s1.z += jit(f1) * 0.7; arc[i].set(s0, s1); arc[i].m.visible = zap > 0.15; }
    fl.m.material.opacity = o.poolA * (1 + 0.6 * zap); Lt0.intensity = 0.8 + 1.4 * zap;
  } };
}
const _mr0 = { S: 1.4, hover: 0.55, W: 1.0, zNose: 0.6, sweep: 0.62, sweepP: 1.6, zTail: -0.55, zTipT: -0.05, trailP: 0.55, tipChord: 0.05, nj: 37, nk: 12,
  hDome: 0.27, domeW: 0.46, hWing: 0.05, bDome: 0.11, bellyW: 0.4, bWing: 0.025, hEdge: 0.014, topP: 0.75, botP: 0.9,
  tipUp: 0.3, tipP: 2.8, droop: 0.07, flap: 0.12, lag: 1.9, lagC: 0.5, lift: 0.3, bob: 0.028,
  black: 0x07060c, deep: 0x2b1a78, violet: 0x6b46ff, violetHi: 0xcdbfff, rough: 0.42, env: 0.45, margin: 0.19, glowP: 1.5, glowA: 0.92, halo: 0.05, haloA: 0.5,
  tailC: 0.93, tailIn: 0.05, tailSink: 0.02, tailQ: 18, tailP: 0.7, wave: 0.055, waveX: 0.075, sway: 0.05,
  tails: [{ x: 0, len: 1.0, r: 0.08, fan: 0, rise: 0.0, up: 0.08, k: 1.0, p: 0, p2: 0 }, { x: -0.06, len: 0.84, r: 0.066, fan: -0.36, rise: -0.03, up: 0.06, k: 0.95, p: 2.1, p2: 1.3 }, { x: 0.06, len: 0.84, r: 0.066, fan: 0.36, rise: -0.03, up: 0.06, k: 0.95, p: 4.2, p2: 2.6 }],
  cryX: 0.38, cryC: 0.17, cry: 0.15, tuck: -0.12, cryGlow: [0.17, 0.3], shards: [[0, 0, 0, 1, 0.12, 0.3], [0.1, 0.02, -0.04, 0.62, 0.5, 1.1], [-0.085, 0.022, 0.05, 0.5, -0.55, 2.2]], pool: 0.85, poolA: 0.3 };
fx(948, "DRAFT. THE MANTA RAY, the electric technician from the owner's concept sheet (2026-11-23), its tails moved to its rear as the owner asked: a smooth mound of jet black gel with two wide wings, their tips turned up, its edges see-through violet and glowing; a cluster of electric yellow crystal tucked under each wing; three wavy tails out of the point at its rear, violet going to yellow at their tips. It glides, its wings beating slowly; its action lifts its wings and beats them down, the crystals flaring, an arc between them, the tails spread and stiff behind it.", () => _mantaRay(_mr0));
