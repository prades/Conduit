// THE DIVING BEETLE LARVA, the electric breed's boss (docs/ELECTRIC-BREED.md §5; the owner, 2026-11-13: "A for the larva"; 2026-11-14: "The larva boss should be big", then "Build it"):
// round 2's mech in look A, live seams (pale gunmetal armour, yellow energy in its joints, yellow lenses, lit jaw edges), from design/creatures/electric_breed_examples.js (larvaMech), baked for the game.
// Variants, facing d (the game's heading d * 45 degrees; 0 is the game's +x, down-right on the screen):
//   'w<d>_<f>' walking, frame f of LV_FRAMES: its six legs paddle in two tripods (a quarter of a stroke a frame) and its body sways a little;
//   'o<d>' its jaws wide and their edges bright (SICKLE SNAP's warning); 's<d>' its jaws snapped shut (the snap); 'z<d>' its seams flashing, sparks over its back (SHOCK RING's warning).
// THE SIZE (the agent's, provisional): LV_SCALE makes it about twice THE ANT QUEEN's length on the floor (about 4.5 tiles, jaws to tail); its armoured body, head to tail, is 3.6 tiles, so the
// boss's body reach (bodyR 1.8 tiles, js/bosses.js) is half of it. The model is shifted so the ground point (the creature's place) is under the middle of that body (LV_MID).
// Baked at the game's own size (LV_RES 1: it is big on the screen already, and its enemy card shows it smaller).
// Everything is inside one scope: the baker joins every family's file into one script.
PROPS.larva = (() => {
  const LV_FRAMES = 4, LV_SCALE = 1.6, LV_RES = 1, LV_MID = 0.11;
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const UPV = new T.Vector3(0, 1, 0), V3 = a => new T.Vector3(a[0], a[1], a[2]), arr = v => [v.x, v.y, v.z];
  const psurf = (nu, nv, f, mat) => { const pos = [], idx = [], uv = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const p = f(i / nu, j / nv); pos.push(p[0], p[1], p[2]); uv.push(i / nu, j / nv); }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return new T.Mesh(g, mat); };
  // a thick rounded edge along points (a plate's lip, a lit edge, a spark)
  const ptube = (pts, r0, r1, mat, seg) => { const g = G(); for (let i = 0; i < pts.length - 1; i++) { const a = V3(pts[i]), b = V3(pts[i + 1]), d = b.clone().sub(a), L = d.length(), r = r0 + (r1 - r0) * (i + 0.5) / (pts.length - 1);
      const m = new T.Mesh(new T.CylinderGeometry(r * 0.94, r, L, seg || 10), mat); m.position.copy(a.clone().add(b).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(UPV, d.normalize()); g.add(m);
      const j = new T.Mesh(new T.SphereGeometry(r, seg || 10, 6), mat); j.position.copy(a); g.add(j); } return g; };
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };
  // a bar from a to b (a chamfered box w across and d deep), its d side turned up as far as it can be
  const pbar = (a, b, w, d, mat, bev) => { const A = V3(a), B = V3(b), dir = B.clone().sub(A), len = dir.length(); dir.normalize();
    const m = cbox(w, len, d, bev == null ? Math.min(w, d) * 0.25 : bev, mat); const side = new T.Vector3().crossVectors(dir, UPV); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
    const nz = new T.Vector3().crossVectors(side, dir).normalize(); m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(side, dir, nz)); m.position.copy(A).add(B).multiplyScalar(0.5); return m; };
  // a round part from a (radius r0) to b (radius r1)
  const pseg = (a, b, r0, r1, mat, seg) => { const A = V3(a), B = V3(b), d = B.clone().sub(A), L = d.length(); const m = new T.Mesh(new T.CylinderGeometry(r1, r0, L, seg || 14), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UPV, d.normalize()); return m; };
  const ball = (r, mat, p) => at(new T.Mesh(new T.SphereGeometry(r, 14, 10), mat), p[0], p[1], p[2]);
  // a piston from a to b: a sleeve, a bright rod, a cap at each end
  const ppiston = (g, a, b, r, S) => { const A = V3(a), m = A.clone().lerp(V3(b), 0.58), mid = [m.x, m.y, m.z]; g.add(pseg(a, mid, r, r, S.frame2)); g.add(pseg(mid, b, r * 0.55, r * 0.55, S.joint)); g.add(ball(r * 1.3, S.joint, a)); g.add(ball(r * 1.15, S.joint, b)); };
  const dbl = m => { const c = m.clone(); c.side = T.DoubleSide; return c; };

  // LOOK A, LIVE SEAMS: pale gunmetal armour panels (shade where a plate tucks under the one before, seams round the arc), yellow energy in the joints, yellow lenses
  const ELEC = '#ffe733';
  const panel = tex(128, 512, (c, w, h) => { c.fillStyle = '#8c95a4'; c.fillRect(0, 0, w, h);
    const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0.3)'); gr.addColorStop(0.45, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.07)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = '#3c434f'; for (const v of [0.08, 0.27, 0.5, 0.73, 0.92]) c.fillRect(0, v * h - 2.5, w, 5); });
  const armor = new T.MeshStandardMaterial({ map: panel, metalness: 0.7, roughness: 0.34, side: T.DoubleSide }); armor.envMapIntensity = 0.6;
  const A = { armor, solid: STY.std('#7f8897', 0.72, 0.32), dark: STY.std('#3b424e', 0.75, 0.4), frame: STY.std('#1d2128', 0.8, 0.45), frame2: STY.std('#2c323c', 0.8, 0.4),
    joint: STY.std('#b3bcc7', 0.92, 0.26), jaw: STY.std('#c3cad3', 0.92, 0.24), glow: STY.glow(ELEC, 1.25), lens: STY.glow(ELEC, 1.6), keelTop: STY.glow(ELEC, 1.1), edge: STY.glow(ELEC, 1.25) };
  A.glowD = dbl(A.glow);
  // charged (SHOCK RING's warning): the same armour with every light turned up
  const HOT = Object.assign({}, A, { glow: STY.glow('#fff4a0', 2.2), lens: STY.glow('#fff4a0', 2.2), keelTop: STY.glow('#fff4a0', 2.2), edge: STY.glow('#fff4a0', 2.2), spark: STY.glow('#ffffff', 3) });   // (white-hot: the yellow at full is the same yellow)
  HOT.glowD = dbl(HOT.glow);
  const EDGE_HOT = STY.glow(ELEC, 2.8);   // the jaws' edges as they open (SICKLE SNAP's warning)
  // the keel standing on a segment's back at p, along the normal n, its top lit
  const keel = (g, S, p, n, size) => { const q = new T.Quaternion().setFromUnitVectors(UPV, n), put = (m, h) => { m.quaternion.copy(q); m.position.copy(V3(p)).addScaledVector(n, h); g.add(m); };
    put(cbox(0.055 * size, 0.032 * size, 0.03 * size, 0.008, S.dark), 0.014 * size); put(cbox(0.045 * size, 0.008 * size, 0.032 * size, 0.003, S.keelTop), 0.032 * size); };

  // THE LARVA: S its materials, ph its walk (0..1), jawA its jaws' turn on their hinges (0 at rest, + wider, - shut), edge its jaws' lit edges' material, sparks over its back
  function larva(S, ph, jawA, edge, sparks) { const g = G(), TAU = Math.PI * 2;
    // its spine, head to tail: the head raised, the body low along the floor in a gentle S, the tail lifting a little; the S sways as it walks
    const base = [[0.62, 0.22, 0.0], [0.4, 0.18, 0.03], [0.12, 0.15, 0.0], [-0.2, 0.14, -0.04], [-0.55, 0.135, -0.01], [-0.85, 0.14, 0.04], [-1.08, 0.17, 0.05]];
    const spine = new T.CatmullRomCurve3(base.map((p, j) => V3([p[0], p[1], p[2] + (j ? 0.016 : 0.006) * Math.sin(TAU * ph - j * 0.9)])));
    const N = 11, T1 = 0.96, segT = i => (i + 0.5) * T1 / N, len = spine.getLength() * T1 / N;
    const rad = i => i < 3 ? 0.088 + i * 0.008 : Math.max(0.03, 0.115 - Math.pow(Math.max(0, i - 4) / 6.5, 1.6) * 0.085);
    // a segment's own frame: x forward (toward the head), y up, z to the side
    const frameAt = t => { const p = spine.getPointAt(t), fwd = spine.getTangentAt(t).negate(), side = new T.Vector3().crossVectors(fwd, UPV).normalize(), up = new T.Vector3().crossVectors(side, fwd).normalize(); return { p, fwd, side, up }; };
    const lp = (f, x, y, z) => f.p.clone().addScaledVector(f.fwd, x).addScaledVector(f.up, y).addScaledVector(f.side, z);
    const inFrame = f => { const grp = G(); grp.position.copy(f.p); grp.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(f.fwd, f.up, f.side)); g.add(grp); return grp; };
    for (let i = 0; i < N; i++) { const f = frameAt(segT(i)), r = rad(i), grp = inFrame(f);
      // the frame: a dark barrel with bevelled ends, flattened
      const lg = new T.LatheGeometry([[0.001, -0.5], [0.8, -0.5], [0.92, -0.38], [0.92, 0.38], [0.8, 0.5], [0.001, 0.5]].map(([a, b]) => new T.Vector2(a * r, b * len)), 28); lg.rotateZ(-Math.PI / 2);
      const bar = new T.Mesh(lg, S.frame); bar.scale.set(1, 0.8, 1); grp.add(bar);
      // the armour: a shell over its back and flanks with thick edges
      const R = r * 1.1, sx0 = -len * 0.41, sx1 = len * 0.41, shPt = (u, v, km) => { const x = sx1 - (sx1 - sx0) * u, th = -0.3 + v * (Math.PI + 0.6), k = (km || 1) * (1 - 0.05 * u); return [x, R * 0.8 * Math.sin(th) * k, R * Math.cos(th) * k]; };
      grp.add(psurf(6, 30, shPt, S.armor));
      for (const u of [0, 1]) { const e = []; for (let j = 0; j <= 30; j++) e.push(shPt(u, j / 30, 1.004)); grp.add(ptube(e, 0.011, 0.011, S.dark, 8)); }
      // the joint behind it: a band of light
      if (i < N - 1) { const bg = new T.CylinderGeometry(r * 0.88, r * 0.88, len * 0.22, 28, 1, true); bg.rotateZ(Math.PI / 2); const band = new T.Mesh(bg, S.glowD); band.scale.set(1, 0.8, 1); band.position.x = -len * 0.5; grp.add(band); }
      // the keel along its back
      keel(grp, S, [0, R * 0.8, 0], UPV, 1.1); }
    // pistons under the armour's edge, segment to segment
    for (let i = 1; i < N - 2; i++) { const fa = frameAt(segT(i)), fb = frameAt(segT(i + 1)), ra = rad(i), rb = rad(i + 1);
      for (const sg of [-1, 1]) ppiston(g, arr(lp(fa, len * 0.12, -ra * 0.36, sg * ra * 1.06)), arr(lp(fb, len * 0.12, -rb * 0.36, sg * rb * 1.06)), 0.013, S); }
    // the head: a flat armoured wedge, a crest, six lenses a side in two rows, two stubby sensor horns, and the sickle jaws on hinges
    const f0 = frameAt(0), hg = G(); hg.position.copy(lp(f0, 0.12, 0.03, 0)); hg.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(f0.fwd, f0.up, f0.side)); g.add(hg);
    const outline = [[-0.13, 0.085], [-0.06, 0.15], [0.05, 0.175], [0.15, 0.155], [0.21, 0.09], [0.225, 0], [0.21, -0.09], [0.15, -0.155], [0.05, -0.175], [-0.06, -0.15], [-0.13, -0.085]];
    hg.scale.setScalar(1.15); const hm = plate(outline, 0.09, 0.024, S.solid); hm.rotation.x = Math.PI / 2; hg.add(hm);
    hg.add(at(cbox(0.26, 0.03, 0.07, 0.01, S.dark), -0.01, 0.055, 0));
    for (const sg of [-1, 1]) { hg.add(at(cbox(0.15, 0.024, 0.045, 0.008, S.dark), 0.06, 0.052, sg * 0.07));
      for (let row = 0; row < 2; row++) for (let c = 0; c < 3; c++) { const ex = 0.03 + c * 0.045, ez = sg * (0.112 + row * 0.034 - c * 0.006); hg.add(at(cyl(0.02, 0.02, 0.016, S.frame, 16), ex, 0.047, ez)); hg.add(ball(0.0145, S.lens, [ex, 0.057, ez])); }
      const h0 = [0.16, 0.04, sg * 0.055], h1 = [0.23, 0.09, sg * 0.085], h2 = [0.3, 0.11, sg * 0.095]; hg.add(pseg(h0, h1, 0.02, 0.017, S.dark)); hg.add(ball(0.021, S.joint, h1)); hg.add(pseg(h1, h2, 0.016, 0.013, S.solid)); hg.add(ball(0.015, S.glow, h2));
      // a jaw: a heavy sickle blade on a hinge, broad at the root and sharp at the tip, a tooth on its inner edge, that edge lit; it turns on its hinge (jawA: wider, or snapped shut)
      hg.add(at(cyl(0.046, 0.046, 0.075, S.joint, 20), 0.18, 0, sg * 0.105)); hg.add(at(cyl(0.022, 0.022, 0.082, S.dark, 14), 0.18, 0, sg * 0.105));
      const hinge = G(); hinge.position.set(0.18, 0, sg * 0.105); hinge.rotation.y = -sg * jawA; hg.add(hinge);
      const blade = G(); blade.position.set(-0.18, 0, -sg * 0.105); hinge.add(blade);
      const jaw = [[0.14, 0.12], [0.25, 0.205], [0.39, 0.245], [0.52, 0.225], [0.62, 0.16], [0.685, 0.07], [0.6, 0.11], [0.55, 0.125], [0.515, 0.098], [0.48, 0.14], [0.39, 0.165], [0.29, 0.155], [0.2, 0.1]].map(([x, z]) => [x, z * sg]);
      const jm = plate(jaw, 0.055, 0.014, S.jaw); jm.rotation.x = Math.PI / 2; blade.add(jm);
      blade.add(ptube([[0.665, 0.029, 0.082 * sg], [0.6, 0.029, 0.118 * sg], [0.55, 0.029, 0.133 * sg], [0.48, 0.029, 0.148 * sg], [0.39, 0.029, 0.172 * sg], [0.3, 0.029, 0.163 * sg]], 0.0095, 0.0095, edge, 8)); }
    // six legs from the three front segments: a hip, an armoured thigh with a piston, a knee joint, a paddle shin (a swimming fin with a spine), a claw.
    // THE WALK: two tripods (the front and back legs of one side with the middle leg of the other), half a stroke apart; each leg swings about its hip, its foot lifted as it comes forward
    for (let k = 0; k < 3; k++) { const f = frameAt(segT(k)), r = rad(k);
      for (const sg of [-1, 1]) { const kF = [0.07, 0, -0.07][k], aF = [0.15, -0.04, -0.2][k], kS = [0.19, 0.22, 0.22][k], aS = [0.31, 0.37, 0.39][k];
        const lph = TAU * ((ph + ((k + (sg > 0 ? 1 : 0)) % 2) * 0.5) % 1), sw = 0.26 * Math.sin(lph), lift = Math.max(0, Math.cos(lph)) * 0.035, hz = sg * r * 0.85;
        const turn = (x, z) => { const dx = x, dz = z - hz, b = -sw * sg; return [dx * Math.cos(b) - dz * Math.sin(b), hz + dx * Math.sin(b) + dz * Math.cos(b)]; };
        const kn = turn(kF, sg * kS), an = turn(aF, sg * aS), fo = turn(aF + (aF - kF) * 0.35, sg * (aS + 0.05));
        const hip = lp(f, 0, -r * 0.35, hz), knee = lp(f, kn[0], 0.09 + lift * 0.6, kn[1]), ankle = lp(f, an[0], 0, an[1]), foot = lp(f, fo[0], 0, fo[1]); ankle.y = 0.07 + lift; foot.y = 0.004 + lift;
        g.add(ball(0.036, S.joint, arr(hip))); g.add(pbar(arr(hip), arr(knee), 0.054, 0.054, S.solid)); ppiston(g, arr(hip.clone().add(new T.Vector3(0, 0.046, 0))), arr(knee.clone().add(new T.Vector3(0, 0.04, 0))), 0.012, S);
        const kj = cyl(0.034, 0.034, 0.07, S.joint, 16); kj.quaternion.setFromUnitVectors(UPV, f.fwd); kj.position.copy(knee); g.add(kj); g.add(pbar(arr(knee), arr(knee.clone().add(new T.Vector3(0, 0.05, 0))), 0.056, 0.05, S.dark));
        g.add(pbar(arr(knee), arr(ankle), 0.095, 0.026, S.solid)); g.add(pbar(arr(knee), arr(ankle), 0.032, 0.042, S.dark)); g.add(ball(0.028, S.joint, arr(ankle)));
        g.add(pseg(arr(ankle), arr(foot.clone().lerp(ankle, 0.35)), 0.027, 0.007, S.dark)); } }
    // the tail: twin armoured spikes, a light at each tip
    const ft = frameAt(T1);
    for (const sg of [-1, 1]) { const a = lp(ft, -0.02, 0.004, sg * 0.03), b = lp(ft, -0.19, 0.045, sg * 0.08); g.add(ball(0.032, S.joint, arr(lp(ft, 0, 0, sg * 0.022))));
      g.add(pbar(arr(a), arr(b), 0.046, 0.042, S.solid)); g.add(pbar(arr(a), arr(b.clone().lerp(a, 0.25)), 0.054, 0.05, S.joint)); g.add(ball(0.02, S.glow, arr(b))); }
    // SPARKS (charged): crooked arcs of current jumping from the armour's edge, segment to segment, down both sides
    if (sparks) for (let i = 1; i < N - 2; i += 2) for (const sg of [-1, 1]) { const fa = frameAt(segT(i)), fb = frameAt(segT(i + 1)), ra = rad(i) * 1.1, rb = rad(i + 1) * 1.1, s = (i * 7 + (sg > 0 ? 3 : 0)) % 5;
      const p0 = lp(fa, 0, ra * 0.5, sg * ra * 0.95), p3 = lp(fb, 0, rb * 0.5, sg * rb * 0.95), m1 = p0.clone().lerp(p3, 0.33), m2 = p0.clone().lerp(p3, 0.66);
      m1.addScaledVector(fa.side, sg * (0.07 + 0.012 * s)).addScaledVector(UPV, 0.05 + 0.01 * s); m2.addScaledVector(fb.side, sg * (0.04 + 0.01 * (4 - s))).addScaledVector(UPV, 0.08 - 0.008 * s);
      g.add(ptube([arr(p0), arr(m1), arr(m2), arr(p3)], 0.011, 0.007, S.spark, 6)); }
    return g; }

  const variants = [];
  for (let d = 0; d < 8; d++) { for (let f = 0; f < LV_FRAMES; f++) variants.push('w' + d + '_' + f); variants.push('o' + d, 's' + d, 'z' + d); }
  return { variants, canvas: [560, 400],
    build(name) { const m = /^([wosz])(\d)(?:_(\d))?$/.exec(name), kind = m[1], d = +m[2], f = m[3] ? +m[3] : 0;
      const inner = kind === 'z' ? larva(HOT, 0, 0, HOT.edge, true) : larva(A, f / LV_FRAMES, kind === 'o' ? 0.35 : kind === 's' ? -0.2 : 0, kind === 'o' ? EDGE_HOT : A.edge, false);
      inner.position.x = LV_MID;   // (the middle of its armoured body over the ground point)
      const body = G(); body.add(inner); body.scale.setScalar(LV_SCALE * LV_RES); body.rotation.y = -d * Math.PI / 4;
      const g = G(); g.add(body); return { g, marks: {} }; } };
})();
