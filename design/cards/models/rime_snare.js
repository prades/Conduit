// RIME SNARE (Pack 1, ice, Precision: 20% a hit to SLOW): a steel jaw trap, set: its two semicircular toothed jaws laid open into a ring on a base bar, pivoting on posts at its ends, two coil springs with
// levers bearing on them, a round trigger pan in the middle; all of it frozen over: ice crusted on the jaws, frost on the teeth and small icicles hanging off them, the pan glowing with a cold snowflake (the
// slow it puts on what steps in), a frosty chain looping down from the bar's end, and cold mist motes round it. Tipped toward the viewer, the bar turned across the view, so the ring of teeth reads as a trap.
// The ice family's Precision piece, the most intricate.
(function () {
  const std = (hex, metal, rough, extra) => { const m = new T.MeshStandardMaterial(Object.assign({ color: 0xffffff, metalness: metal, roughness: rough }, extra || {})); m.color = STY.col(hex); m.envMapIntensity = 0.9; return m; };
  const jawM = std('#9aa3ae', 0.9, 0.26), toothM = std('#d0d7e0', 0.92, 0.18), barM = std('#6d7684', 0.85, 0.3), springM = std('#b5bec9', 0.92, 0.22), panM = std('#2a3038', 0.8, 0.36), chainM = std('#a9b8c8', 0.88, 0.28);
  jawM.envMapIntensity = 1.1; barM.envMapIntensity = 1.05;
  const ice = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.08, roughness: 0.08, flatShading: true, transparent: true, opacity: 0.78 }); ice.color = STY.col('#c6ebff'); ice.emissive = STY.col('#2f7fb8'); ice.emissiveIntensity = 0.55; ice.envMapIntensity = 1.7;
  const frost = new T.MeshStandardMaterial({ color: 0xffffff, metalness: 0.0, roughness: 0.3, flatShading: true }); frost.color = STY.col('#e6f6ff'); frost.emissive = STY.col('#4f9fd4'); frost.emissiveIntensity = 0.35; frost.envMapIntensity = 1.2;
  const glowB = STY.glow('#99ddff', 1.2), glowHot = STY.glow('#e6f7ff', 1.6), glowDim = STY.glow('#4aa8d8', 1.0);
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const V = p => p.isVector3 ? p.clone() : new T.Vector3(p[0], p[1], p[2]), UP = new T.Vector3(0, 1, 0);
  function rod(a, b, r, mat, seg) { const A = V(a), d = V(b).sub(A), L = d.length(), m = new T.Mesh(new T.CylinderGeometry(r, r, L, seg || 6, 1), mat); m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(UP, d.normalize()); return m; }
  function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  // a jaw: a half-ring band standing HJ tall (radius R, thickness t), on the +z side (front) or the -z side (back)
  function jaw(R, t, HJ, front) {
    const s = new T.Shape(), a0 = front ? PI : 0, a1 = front ? TAU : PI, b = 0.006; s.absarc(0, 0, R + t / 2 - b, a0, a1, false); s.absarc(0, 0, R - t / 2 + b, a1, a0, true); s.closePath();
    const geo = new T.ExtrudeGeometry(s, { depth: HJ - 2 * b, bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 2, curveSegments: 48 }); geo.translate(0, 0, b);
    const m = new T.Mesh(geo, jawM); m.rotation.x = -PI / 2; return m;   // (shape y -> -z, extrusion -> +y)
  }
  // a lumpy sleeve of ice along a curve: a faceted tube, its every ring pushed in and out at random, tapering to nothing at its ends
  function sleeve(curve, r, mat, R) { const N = 22, S = 6, tg = new T.TubeGeometry(curve, N, r, S, false), p = tg.attributes.position, v = new T.Vector3();
    for (let i = 0; i <= N; i++) { const t = i / N, c = curve.getPointAt(t), k0 = 0.2 + 0.8 * Math.pow(Math.sin(PI * t), 0.6); let k1 = 0;
      for (let j = 0; j <= S; j++) { const id = i * (S + 1) + j, k = j === S ? k1 : k0 * (0.7 + R() * 0.6); if (!j) k1 = k; v.fromBufferAttribute(p, id).sub(c).multiplyScalar(k).add(c); p.setXYZ(id, v.x, v.y, v.z); } }
    tg.computeVertexNormals(); return new T.Mesh(tg, mat); }

  ITEMS.rime_snare = { exposure: 1.0, az: 0.55, el: 0.34, build() {
    const g = G(), R = rng(31), Q = G(), TR = G(); g.add(Q); Q.add(TR);
    Q.rotation.y = 0.55; TR.rotation.set(0.4, 0.7, 0);   // face the viewer's side, the bar turned across the ring (its -x end toward the viewer), then tipped up toward the viewer
    const RJ = 0.29, TJ = 0.026, HJ = 0.055, NT = 10, TH = 0.08;
    // THE BASE: a bar under the ring, a hinge post at each end of the ring with a pivot pin, a round pan on a post in the middle
    TR.add(at(cbox(0.86, 0.034, 0.075, 0.01, barM), 0, -0.032, 0));
    for (const s of [-1, 1]) { TR.add(at(cbox(0.05, 0.075, 0.07, 0.012, barM), s * RJ, 0.008, 0)); const pin = cyl(0.015, 0.015, 0.1, toothM, 12); pin.rotation.z = PI / 2; TR.add(at(pin, s * RJ, 0.024, 0)); }
    TR.add(at(cyl(0.02, 0.026, 0.05, barM, 12), 0, -0.005, 0)); TR.add(at(cyl(0.11, 0.115, 0.016, panM, 48), 0, 0.026, 0));
    // the pan's cold snowflake: six arms with side twigs, a ring round it
    const flake = G(); flake.position.y = 0.035; TR.add(flake);
    for (let i = 0; i < 6; i++) { const a = i * TAU / 6, d = [Math.cos(a), 0, Math.sin(a)], p = k => [d[0] * k, 0, d[2] * k];
      flake.add(rod(p(0.0), p(0.088), 0.006, glowB)); for (const tw of [-1, 1]) { const b0 = p(0.052), e = [b0[0] + Math.cos(a + tw * 0.75) * 0.032, 0, b0[2] + Math.sin(a + tw * 0.75) * 0.032]; flake.add(rod(b0, e, 0.0045, glowB)); } }
    flake.add(sphere(0.015, glowHot, 12)); { const t = new T.Mesh(new T.TorusGeometry(0.1, 0.005, 6, 48), glowDim); t.rotation.x = PI / 2; flake.add(t); }
    // THE JAWS, laid open into a ring, and their teeth (the back jaw's set half a tooth over, so they would mesh), leaning in a little
    TR.add(jaw(RJ, TJ, HJ, true)); TR.add(jaw(RJ, TJ, HJ, false));
    const tips = [], LEAN = 0.2;
    for (const front of [true, false]) for (let i = 0; i < NT; i++) {
      const f = (i + (front ? 0.5 : 0.75)) / (NT + 0.25), phi = front ? PI * f : PI + PI * f, tw = PI * RJ / NT * 0.92;
      const tooth = plate([[-tw / 2, 0], [tw / 2, 0], [0, TH]], 0.014, 0.003, toothM); tooth.rotation.order = 'YXZ'; tooth.rotation.set(LEAN, -phi - PI / 2, 0);
      tooth.position.set(RJ * Math.cos(phi), HJ - 0.008, RJ * Math.sin(phi)); TR.add(tooth);
      const k = 1 - Math.sin(LEAN) * TH / RJ; tips.push({ p: new T.Vector3(RJ * Math.cos(phi) * k, HJ - 0.008 + TH * Math.cos(LEAN), RJ * Math.sin(phi) * k), front, phi });
    }
    // THE SPRINGS: a coil on each end of the bar, a lever across its top to the jaw's end
    for (const s of [-1, 1]) {
      const x = s * 0.375, pts = []; for (let i = 0; i <= 90; i++) { const a = i / 90 * TAU * 4.5; pts.push(new T.Vector3(x + 0.042 * Math.cos(a), -0.016 + 0.1 * i / 90, 0.042 * Math.sin(a))); }
      TR.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts), 180, 0.0085, 6, false), springM));
      const lever = at(cbox(0.2, 0.02, 0.05, 0.006, barM), s * (RJ + 0.07), 0.083, 0); lever.rotation.z = s * 0.13; TR.add(lever);   // (resting on the spring, its inner end bearing on the jaw's end)
    }
    // ICE crusted on the jaws: lumpy sleeves of it along stretches of both, translucent faceted lumps on their outer faces, frost capping the teeth
    for (const [p0, p1] of [[0.35, 1.45], [2.1, 2.75], [3.55, 4.35], [5.2, 5.75]]) { const cp = []; for (let i = 0; i <= 8; i++) { const ph = p0 + (p1 - p0) * i / 8; cp.push(new T.Vector3((RJ + 0.006) * Math.cos(ph), HJ * 0.42, (RJ + 0.006) * Math.sin(ph))); }
      TR.add(sleeve(new T.CatmullRomCurve3(cp), 0.036, ice, R)); }
    for (let i = 0; i < 14; i++) {
      const phi = R() * TAU, r = 0.014 + R() * 0.018, m = new T.Mesh(new T.IcosahedronGeometry(1, 0), R() < 0.85 ? ice : frost), rr = RJ + TJ / 2 + r * 0.2, y = HJ * (0.25 + R() * 0.5);
      m.scale.set(r * (1.2 + R() * 0.8), r * (0.6 + R() * 0.4), r * (0.8 + R() * 0.4)); m.rotation.set(R() * 0.4, -phi + (R() - 0.5) * 0.4, R() * 0.4); TR.add(at(m, rr * Math.cos(phi), y, rr * Math.sin(phi)));
    }
    tips.forEach(t => { if (R() < 0.7) { const m = new T.Mesh(new T.OctahedronGeometry(1, 0), frost), s = 0.008 + R() * 0.005; m.scale.set(s, s * 1.6, s); TR.add(at(m, t.p.x, t.p.y - 0.016, t.p.z)); } });
    // frost along the bar and on the levers
    for (let i = 0; i < 14; i++) { const x = (R() - 0.5) * 0.8, m = new T.Mesh(new T.OctahedronGeometry(1, 0), R() < 0.5 ? frost : ice), s = 0.007 + R() * 0.008; m.scale.set(s, s * 1.5, s); m.rotation.set(R(), R(), R());
      TR.add(at(m, x, Math.abs(x) > RJ + 0.02 ? 0.106 : -0.014, (R() - 0.5) * 0.05)); }
    // ICICLES hanging (straight down, in the world) off the near jaw's teeth and its lower edge, each with a faint cold light inside
    g.updateMatrixWorld(true);
    const hang = (p, L, r) => { const c = new T.Mesh(new T.ConeGeometry(r, L, 6, 1), ice); c.rotation.x = PI; c.rotation.y = R() * PI; g.add(at(c, p.x, p.y - L / 2, p.z));
      const k = new T.Mesh(new T.ConeGeometry(r * 0.35, L * 0.7, 5, 1), glowB); k.rotation.x = PI; g.add(at(k, p.x, p.y - L * 0.35, p.z)); };
    tips.forEach((t, i) => { if (!t.front || i % 2 === 0) return; hang(TR.localToWorld(t.p.clone().add(new T.Vector3(0, -0.02, 0))), 0.05 + R() * 0.06, 0.01 + R() * 0.004); });
    [0.45, 1.0, 1.55, 2.1, 2.65].forEach(phi => hang(TR.localToWorld(new T.Vector3((RJ + TJ / 2) * Math.cos(phi), 0.004, (RJ + TJ / 2) * Math.sin(phi))), 0.05 + R() * 0.06, 0.012 + R() * 0.005));
    // THE CHAIN: from an eye on the bar's near end, looping down under the trap, frost on its links
    const eye = TR.localToWorld(new T.Vector3(-0.45, -0.032, 0));
    { const t = new T.Mesh(new T.TorusGeometry(0.028, 0.009, 8, 24), barM); t.position.copy(eye); t.rotation.y = 0.55 + 0.7; g.add(t); }
    const path = new T.CatmullRomCurve3([eye, eye.clone().add(new T.Vector3(-0.02, -0.09, 0.05)), eye.clone().add(new T.Vector3(0.07, -0.165, 0.08)), eye.clone().add(new T.Vector3(0.22, -0.19, 0.08)), eye.clone().add(new T.Vector3(0.36, -0.15, 0.04)), eye.clone().add(new T.Vector3(0.43, -0.07, 0.0))]);
    const Lc = path.getLength(), n = Math.floor(Lc / 0.056);
    for (let i = 1; i <= n; i++) {
      const u = i / n, p = path.getPointAt(Math.min(1, u)), tg = path.getTangentAt(Math.min(1, u)).normalize(), side = new T.Vector3().crossVectors(tg, UP).normalize(), nn = new T.Vector3().crossVectors(side, tg).normalize();
      const b = i % 2 ? nn : side, c = new T.Vector3().crossVectors(tg, b), m = new T.Mesh(new T.TorusGeometry(0.025, 0.0085, 8, 24), chainM);
      m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(tg, b, c)); m.scale.set(1.45, 1, 1); g.add(at(m, p.x, p.y, p.z));
      if (i % 2 === 0) for (let k = 0; k < 3; k++) g.add(at(new T.Mesh(new T.OctahedronGeometry(0.006 + R() * 0.006, 0), frost), p.x + (R() - 0.5) * 0.04, p.y + 0.01 + R() * 0.012, p.z + (R() - 0.5) * 0.04));
    }
    { const end = path.getPointAt(1), t = new T.Mesh(new T.TorusGeometry(0.045, 0.012, 8, 32), chainM); t.position.copy(end).add(new T.Vector3(0.02, 0.03, 0)); t.rotation.set(0.3, 0.9, 0.4); g.add(t); }
    // COLD MIST motes rising off the pan and drifting round it
    const c0 = TR.localToWorld(new T.Vector3(0, 0.04, 0));
    const motes = [[0.02, 0.16, 0.06, 0.012, 2], [-0.1, 0.22, 0.04, 0.01, 1], [0.12, 0.25, 0.0, 0.009, 0], [-0.03, 0.3, 0.02, 0.008, 2], [0.08, 0.35, 0.0, 0.007, 1], [-0.16, 0.33, 0.0, 0.006, 0],
                   [-0.42, 0.05, 0.1, 0.008, 1], [0.42, 0.1, 0.06, 0.008, 2], [-0.3, -0.3, 0.12, 0.007, 0], [0.38, -0.28, 0.1, 0.006, 1]];
    motes.forEach(([x, y, z, r, k]) => g.add(at(sphere(r, k === 2 ? glowHot : k === 1 ? glowB : glowDim, 8), c0.x + x, c0.y + y, c0.z + z)));
    return { g };
  } };
})();
