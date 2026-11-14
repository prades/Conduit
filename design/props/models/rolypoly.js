// THE ROLY-POLY, the electric breed's species (docs/ELECTRIC-BREED.md): its mech in look B, insulator (the owner, 2026-11-13: glossy black plates, hazard-striped side panels,
// copper joints, amber lights), round 4's body (no eyes and no face), from design/creatures/electric_breed_examples.js (rolyWalk, rolyWheel), baked for the game.
// Variants: 'w<d>_<f>' walking, facing d (the game's heading d * 45 degrees; 0 is the game's +x, down-right on the screen), walk frame f of RP_FRAMES; 'c<d>' curled up
// into its wheel, facing d. The legs ripple down each side, a quarter of a step a frame. Baked at twice the tank's size on the screen (RP_RES: sharp on an iPad's screen and on the enemy
// card's big picture); the game draws it at half that, and a scout and a striker smaller still (js/rolypoly.js ROLYPOLY.res).
// Everything is inside one scope: the baker joins every family's file into one script.
PROPS.rolypoly = (() => {
  const RP_FRAMES = 4, RP_SCALE = 0.62, RP_RES = 2;   // RP_SCALE: the model's 1.3-tile body at a tank's size (the agent's, provisional: about a beetle tank's length on the floor); RP_RES: baked at 2x
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const UPV = new T.Vector3(0, 1, 0), V3 = a => new T.Vector3(a[0], a[1], a[2]), arrOf = v => [v.x, v.y, v.z];
  const psurf = (nu, nv, f, mat) => { const pos = [], idx = [], uv = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const p = f(i / nu, j / nv); pos.push(p[0], p[1], p[2]); uv.push(i / nu, j / nv); }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return new T.Mesh(g, mat); };
  const ptube = (pts, r, mat, seg) => { const g = G(); for (let i = 0; i < pts.length - 1; i++) { const a = V3(pts[i]), b = V3(pts[i + 1]), d = b.clone().sub(a), L = d.length();
      const m = new T.Mesh(new T.CylinderGeometry(r * 0.94, r, L, seg || 8), mat); m.position.copy(a.clone().add(b).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(UPV, d.normalize()); g.add(m);
      const j = new T.Mesh(new T.SphereGeometry(r, seg || 8, 6), mat); j.position.copy(a); g.add(j); } return g; };
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };
  // a bar from a to b (a chamfered box w across and d deep), its d side turned toward up
  const pbarN = (a, b, w, d, mat, up) => { const A = V3(a), B = V3(b), dir = B.clone().sub(A), len = dir.length(); dir.normalize();
    const m = cbox(w, len, d, Math.min(w, d) * 0.25, mat); const side = new T.Vector3().crossVectors(dir, up || UPV); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
    const nz = new T.Vector3().crossVectors(side, dir).normalize(); m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(side, dir, nz)); m.position.copy(A).add(B).multiplyScalar(0.5); return m; };
  const pbar = (a, b, w, d, mat) => pbarN(a, b, w, d, mat, UPV);
  const pseg = (a, b, r0, r1, mat, seg) => { const A = V3(a), B = V3(b), d = B.clone().sub(A), L = d.length(); const m = new T.Mesh(new T.CylinderGeometry(r1, r0, L, seg || 12), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UPV, d.normalize()); return m; };
  const ball = (r, mat, p) => at(new T.Mesh(new T.SphereGeometry(r, 12, 8), mat), p[0], p[1], p[2]);
  const dbl = m => { const c = m.clone(); c.side = T.DoubleSide; return c; };

  // look B: the armour's panels (shade where a plate tucks under the one before, seams round the arc, hazard-striped side panels)
  const panel = tex(128, 512, (c, w, h) => { c.fillStyle = '#1e1f24'; c.fillRect(0, 0, w, h);
    const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0.3)'); gr.addColorStop(0.45, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.07)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    for (const [y0, y1] of [[0.08, 0.27], [0.73, 0.92]]) { c.save(); c.beginPath(); c.rect(w * 0.32, y0 * h, w * 0.6, (y1 - y0) * h); c.clip(); c.fillStyle = '#121317'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2b13a';
      for (let y = -w; y < h + w; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + w * 0.7); c.lineTo(w, y + w * 0.7 + 15); c.lineTo(0, y + 15); c.closePath(); c.fill(); } c.restore(); }
    c.fillStyle = '#0a0b0e'; for (const v of [0.08, 0.27, 0.5, 0.73, 0.92]) c.fillRect(0, v * h - 2.5, w, 5); });
  const armor = new T.MeshStandardMaterial({ map: panel, metalness: 0.45, roughness: 0.3, side: T.DoubleSide }); armor.envMapIntensity = 0.6;
  const S = { armor, solid: STY.std('#1e1f24', 0.45, 0.3), dark: STY.std('#121317', 0.5, 0.35), frame: STY.std('#4f5660', 0.85, 0.35), frame2: STY.std('#3a4049', 0.85, 0.38),
    joint: STY.std('#c87a3a', 0.88, 0.28), glow: STY.glow('#ffae1a', 1.2), keelTop: STY.std('#f2b13a', 0.3, 0.4), haz: STY.hazard(22, 22) };

  // the body: 1.3 long, 0.56 wide; seven plates, front to back (five big ones, the tail section, the telson), each overlapping the next by 0.04; the middle one carries the core
  const L = 1.3, W = 0.56, H = 0.3, LIFT = 0.15, TH0 = -0.22, TH1 = Math.PI + 0.22;
  const prof = x => Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(x) / (L / 2)), 2.5)), 0.4);
  const CUTS = [0.58, 0.36, 0.14, -0.08, -0.29, -0.47, -0.58, -0.66], NPL = CUTS.length - 1, OVL = 0.04, CORE = 2;
  const plA = i => CUTS[i + 1] - (i < NPL - 1 ? OVL : 0), plB = i => CUTS[i], plK = i => 1 + 0.016 * (NPL - i);
  const flare = th => { const a = Math.min(th, Math.PI - th), f = Math.max(0, (0.4 - a) / (0.4 - TH0)); return 1 + 0.12 * f * f; };   // the skirts flare out at the bottom of each side
  const plPt = (i, u, v, km) => { const xb = plB(i), xa = plA(i), x = xb - (xb - xa) * u, th = TH0 + v * (TH1 - TH0), p = prof(x * 0.99), k = plK(i) * (km || 1);
    return [x, LIFT + H * p * Math.sin(th) * k + 0.024 * u * Math.max(0, Math.sin(th)), (W / 2) * p * Math.cos(th) * k * flare(th)]; };
  // the core on its back: an armoured housing, its base hazard-striped, three lit vents, two exhaust stacks behind
  const coreHousing = (g, P, n, t) => { t = t.clone().sub(n.clone().multiplyScalar(t.dot(n))).normalize(); const s = new T.Vector3().crossVectors(t, n).normalize();
    const q = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(t, n, s)), put = (m, a, h, c) => { m.quaternion.copy(q); m.position.copy(P).addScaledVector(t, a).addScaledVector(n, h).addScaledVector(s, c); g.add(m); };
    put(cbox(0.17, 0.06, 0.19, 0.018, S.dark), 0, 0.022, 0); put(cbox(0.176, 0.02, 0.196, 0.006, S.haz), 0, 0.002, 0);
    for (const a of [-0.06, -0.024, 0.012]) put(cbox(0.022, 0.014, 0.15, 0.004, S.glow), a, 0.055, 0);
    for (const c of [-0.066, 0.066]) { put(cyl(0.018, 0.021, 0.075, S.joint, 12), 0.06, 0.062, c); put(cyl(0.012, 0.012, 0.077, S.frame, 10), 0.06, 0.064, c); } };
  // the seven plates by pt(i, u, v, km): each with its lip, rivets and a ridge (capped yellow) on the big ones, the core on the middle one
  const shell = (g, pt, center, uAfter) => {
    const nrm = (i, u, v) => { const e = 0.01, P = V3(pt(i, u, v)), du = V3(pt(i, Math.min(1, u + e), v)).sub(V3(pt(i, Math.max(0, u - e), v))), dv = V3(pt(i, u, Math.min(1, v + e))).sub(V3(pt(i, u, Math.max(0, v - e))));
      const n = new T.Vector3().crossVectors(du, dv).normalize(); if (n.dot(P.clone().sub(V3(center(P)))) < 0) n.negate(); return n; };
    const on = (i, u, v, h) => arrOf(V3(pt(i, u, v)).addScaledVector(nrm(i, u, v), h));
    for (let i = 0; i < NPL; i++) { const big = i < 5, uF = i ? uAfter(i - 1) : 0.06;
      g.add(psurf(10, 32, (u, v) => pt(i, u, v), S.armor));
      const lip = []; for (let j = 0; j <= 32; j++) lip.push(pt(i, 1, j / 32, 1.003)); g.add(ptube(lip, 0.014, S.solid));
      if (big) for (let j = 4; j <= 28; j += 4) g.add(ball(0.009, S.joint, pt(i, 0.9, j / 32, 1.012)));
      if (big && i !== CORE) for (let sgm = 0; sgm < 3; sgm++) { const ua = uF + 0.06 + (0.86 - uF) * sgm / 3, ub = uF + 0.06 + (0.86 - uF) * (sgm + 1) / 3, n = nrm(i, (ua + ub) / 2, 0.5);
        g.add(pbarN(on(i, ua, 0.5, 0.013), on(i, ub, 0.5, 0.013), 0.058, 0.026, S.dark, n)); g.add(pbarN(on(i, ua + 0.01, 0.5, 0.03), on(i, ub - 0.01, 0.5, 0.03), 0.022, 0.008, S.keelTop, n)); }
      if (i === CORE) { const um = (uF + 0.95) / 2; coreHousing(g, V3(pt(i, um, 0.5)), nrm(i, um, 0.5), V3(pt(i, Math.min(1, um + 0.05), 0.5)).sub(V3(pt(i, um - 0.05, 0.5))).normalize()); } } };
  // the head: a rounded armoured capsule under the first plate's brim, a ridge along its crown, cheek guards; the antennae as jointed sensor booms, the far one raised, the near one reaching forward
  const head = () => { const h = G(), skull = new T.Mesh(new T.SphereGeometry(1, 24, 16), S.solid); skull.scale.set(0.125, 0.095, 0.17); h.add(skull);
    h.add(at(cbox(0.15, 0.02, 0.042, 0.007, S.dark), -0.012, 0.088, 0)); h.add(at(cbox(0.12, 0.007, 0.018, 0.003, S.keelTop), -0.012, 0.1, 0));
    const pose = [[[0.03, 0.06, -0.1], [0.07, 0.17, -0.15], [0.12, 0.31, -0.2], [0.21, 0.39, -0.24]], [[0.03, 0.06, 0.1], [0.12, 0.13, 0.17], [0.26, 0.15, 0.25], [0.37, 0.09, 0.3]]];
    for (const sg of [-1, 1]) { const ch = cbox(0.1, 0.06, 0.026, 0.01, S.dark); ch.rotation.y = sg * 0.25; h.add(at(ch, 0.0, -0.02, sg * 0.152));
      const P = pose[sg > 0 ? 1 : 0]; h.add(pseg(P[0], P[1], 0.03, 0.027, S.solid)); h.add(pseg(P[1], P[2], 0.026, 0.023, S.dark)); h.add(pseg(P[2], P[3], 0.022, 0.018, S.solid));
      h.add(ball(0.035, S.joint, P[0])); h.add(ball(0.031, S.joint, P[1])); h.add(ball(0.027, S.joint, P[2])); h.add(ball(0.027, S.glow, P[3])); }
    return h; };
  // walking, at frame f: seven legs a side, each a quarter of a step behind the one in front of it, the two sides half a step apart (a foot swings forward lifted, then pushes back on the floor)
  const walk = f => { const g = G();
    g.add(at(cbox(L * 0.84, 0.06, 0.28, 0.02, S.frame), -0.03, LIFT - 0.05, 0));
    for (let k = 0; k < 7; k++) g.add(at(cbox(0.03, 0.04, 0.34, 0.008, S.frame2), 0.47 - k * 0.15, LIFT - 0.07, 0));
    shell(g, plPt, P => [P.x, LIFT - 0.15, 0], i => (plB(i + 1) - plA(i)) / (plB(i + 1) - plA(i + 1)));
    const hd = head(); hd.scale.setScalar(1.12); hd.position.set(0.655, LIFT + 0.045, 0); hd.rotation.set(0, -0.12, 0.12); g.add(hd);
    for (const sg of [-1, 1]) for (let k = 0; k < 7; k++) { const x = 0.47 - k * 0.15, p = prof(x), zs = (W / 2) * p, lean = (3 - k) * 0.014;
      const ph = (f / RP_FRAMES + k * 0.25 + (sg > 0 ? 0.5 : 0)) % 1, sw = Math.cos(ph * 2 * Math.PI) * 0.05, lift = Math.max(0, Math.sin(ph * 2 * Math.PI)) * 0.035;
      const hip = [x, LIFT - 0.04, sg * zs * 0.6], knee = [x + lean + sw * 0.5, 0.155 + lift * 0.5, sg * (zs * 1.3 + 0.05)], foot = [x + lean * 2.4 + sw, 0.004 + lift, sg * (zs * 1.3 + 0.1)];
      g.add(pbar(hip, knee, 0.04, 0.036, S.dark)); g.add(ball(0.03, S.joint, knee)); g.add(pbar(knee, [knee[0], knee[1] + 0.034, knee[2] + sg * 0.014], 0.046, 0.04, S.solid));
      g.add(pbar(knee, [foot[0], foot[1] + 0.034, foot[2]], 0.034, 0.03, S.solid)); g.add(pseg([foot[0], foot[1] + 0.038, foot[2]], foot, 0.016, 0.005, S.dark)); }
    for (const sg of [-1, 1]) { const a = [-0.6, LIFT - 0.02, sg * 0.05], b = [-0.74, LIFT - 0.05, sg * 0.12], d = V3(b).sub(V3(a)).normalize(); g.add(pbar(a, b, 0.042, 0.036, S.dark));
      const nz = cyl(0.026, 0.021, 0.034, S.joint, 12); nz.quaternion.setFromUnitVectors(UPV, d); nz.position.copy(V3(b)); g.add(nz);
      const gl = cyl(0.017, 0.017, 0.036, S.glow, 12); gl.quaternion.copy(nz.quaternion); gl.position.copy(V3(b)).addScaledVector(d, 0.003); g.add(gl); }
    return g; };
  // curled up: the plates wrap round the roll's axis (side to side) into a wheel; head and tail meet at a seam, closed by the head's armour; a hub on each side
  const wheel = () => { const g = G(), R0 = 0.1, HW = 0.24, WW = 0.5, gap = 0.6, phG = 0.2, OV = 0.08, y0 = R0 + HW * 1.1 * 1.04 + 0.006;
    const ws = [1, 1, 1, 1, 1, 0.5, 0.32], unit = (2 * Math.PI - gap) / ws.reduce((a, b) => a + b, 0), a0 = []; ws.reduce((a, w, i) => { a0[i] = a; return a + w * unit; }, phG + gap / 2);
    const wk = i => 1 + 0.012 * (NPL - i);
    const wPt = (i, u, v, km) => { const ph = a0[i] + u * (ws[i] * unit + OV), th = TH0 + v * (TH1 - TH0), k = wk(i) * (km || 1), rr = R0 + HW * Math.sin(th) * k * (1 + 0.04 * u);
      return [Math.cos(ph) * rr, y0 + Math.sin(ph) * rr, (WW / 2) * Math.cos(th) * k * flare(th)]; };
    const core = cyl(R0 + 0.13, R0 + 0.13, WW * 0.84, S.frame, 28); core.rotation.x = Math.PI / 2; g.add(at(core, 0, y0, 0));
    shell(g, wPt, P => [0, y0, P.z], i => (a0[i] + ws[i] * unit + OV - a0[i + 1]) / (ws[i + 1] * unit + OV));
    const hs0 = phG - gap / 2 + OV - 0.06, hs1 = phG + gap / 2 + 0.06, hPt = (u, v, km) => { const ph = hs0 + u * (hs1 - hs0), th = TH0 + v * (TH1 - TH0), k = 0.995 * (km || 1), rr = R0 + HW * Math.sin(th) * k;
      return [Math.cos(ph) * rr, y0 + Math.sin(ph) * rr, (WW / 2) * Math.cos(th) * k * flare(th)]; };
    g.add(psurf(8, 32, hPt, dbl(S.solid)));
    for (let j = 0; j < 4; j++) { const a = V3(hPt(0.15 + 0.7 * j / 4, 0.5, 1.06)), b = V3(hPt(0.15 + 0.7 * (j + 1) / 4, 0.5, 1.06)), m = a.clone().add(b).multiplyScalar(0.5); g.add(pbarN(arrOf(a), arrOf(b), 0.024, 0.009, S.keelTop, new T.Vector3(m.x, m.y - y0, 0).normalize())); }
    for (const sg of [-1, 1]) { const hz = sg * 0.3; const hub = cyl(R0 + 0.06, R0 + 0.06, 0.05, S.dark, 28); hub.rotation.x = Math.PI / 2; g.add(at(hub, 0, y0, hz));
      const cap = cyl(R0 * 0.62, R0 * 0.62, 0.062, S.joint, 20); cap.rotation.x = Math.PI / 2; g.add(at(cap, 0, y0, hz));
      for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4; g.add(ball(0.012, S.joint, [Math.cos(a) * (R0 + 0.028), y0 + Math.sin(a) * (R0 + 0.028), hz + sg * 0.026])); } }
    return g; };
  const variants = []; for (let d = 0; d < 8; d++) { for (let f = 0; f < RP_FRAMES; f++) variants.push('w' + d + '_' + f); variants.push('c' + d); }
  return { variants, canvas: [520, 440], exposure: 1.05,
    build(name) { const g = G(), d = +name[1], body = name[0] === 'c' ? wheel() : walk(+name.split('_')[1]);
      body.scale.setScalar(RP_SCALE * RP_RES); body.rotation.y = -d * Math.PI / 4; g.add(body); return { g, marks: {} }; } };
})();
