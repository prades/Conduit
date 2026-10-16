// ── THE REALISTIC CORE SLUG · Nos. 410–417: slug anatomy (a long muscular body, a raised mantle behind the head, a tapering tail and a keel, two long eye-stalks over two short feelers) with a
// HONEYCOMB of hexagon scutes on its back. A black crystal spike leans forward from the head; the eyes are a crystal rim round black. The scutes ride the body as it crawls. ──
function _slugReal(o) {
  const g = G(), b = G(); g.add(b); b.scale.setScalar(o.S || 1.15);
  const N = 30, SIDES = 18, L = o.len, mat = new T.MeshStandardMaterial({ color: o.blue || 0x04208f, emissive: o.glowBlue || 0x010824, emissiveIntensity: 1, roughness: 0.55, metalness: 0.04 }); mat.envMapIntensity = 0.2;
  const tube = _taperTube(mat, N, SIDES), body = tube.mesh; body.scale.y = o.flat; b.add(body); const pts = Array.from({ length: N }, () => new T.Vector3()), rad = new Array(N);
  // a real slug's outline: a blunt head, the body swelling behind it to the mantle, then a long taper to a point
  const prof = u => { if (u > 0.9) return o.rad * (0.62 + 3.8 * (1 - u)); const swell = Math.pow(Math.sin(Math.PI * (0.05 + 0.82 * Math.pow(u / 0.9, 0.85))), 0.7); const mantle = 1 + (o.mantle || 0.14) * Math.exp(-Math.pow((u - 0.66) / 0.12, 2)); return o.rad * (0.07 + 0.93 * swell) * mantle; };
  const foot = new T.Mesh(new T.CylinderGeometry(1, 1, 0.03, 24), new T.MeshStandardMaterial({ color: 0x0a3fd0, emissive: 0x020c34, roughness: 0.75 })); foot.scale.set(o.rad * 1.12, 1, L * 0.5); b.add(foot);
  // the keel: a low ridge down the back, as a real slug's tail has
  const keel = new T.Mesh(new T.BoxGeometry(0.03, 0.04, 1), mat); b.add(keel);
  // hexagon scutes: a honeycomb of raised black plates over the back, each with a teal edge
  const hexes = [], HR = o.hexRows, HC = o.hexCols; const edgeMat = new T.MeshBasicMaterial({ color: new T.Color(EL.color), toneMapped: false }), hexMat = o.hexMat || _armB;
  for (let j = 0; j < HR; j++) for (let i = 0; i < HC; i++) { const u = o.hexU0 + (i + 0.5 * (j % 2)) / HC * (o.hexU1 - o.hexU0), th = (j - (HR - 1) / 2) * o.hexTh; if (u > o.hexU1 + 0.001) continue;
    const hg = G(), plate = new T.Mesh(new T.CylinderGeometry(1, 1, 0.045, 6), hexMat); plate.position.y = 0.02; hg.add(plate); const ed = new T.Mesh(new T.TorusGeometry(0.9, 0.035, 4, 6), edgeMat); ed.rotation.x = PI / 2; ed.position.y = 0.046; hg.add(ed);
    if (o.hexFill) { const fl = new T.Mesh(new T.CylinderGeometry(0.62, 0.62, 0.02, 6), edgeMat); fl.position.y = 0.05; hg.add(fl); }
    b.add(hg); hexes.push({ hg, u, th, j }); }
  // the head: spike, two long eye-stalks (a crystal rim round a black centre), two short feelers
  const hg2 = G(); b.add(hg2); const horn = G(); hg2.add(horn); const hc = hexCrystal(o.hornR, o.horn * 0.8, o.horn * 0.4, _gemMatGloss); hc.position.y = o.horn * 0.4 + 0.03; horn.add(hc); horn.rotation.x = o.hornTilt;
  const stalks = []; for (const s of [-1, 1]) { const sp = G(), shaft = limb(o.stalkR, mat); sp.add(shaft); const eye = G(), ec = hexCrystal(o.eyeR * 1.15, o.eyeR * 1.2, o.eyeR, M.crystal); ec.rotation.x = PI / 2; eye.add(ec); const pu = new T.Mesh(new T.SphereGeometry(o.eyeR * 0.82, 12, 10), new T.MeshBasicMaterial({ color: 0x000102 })); pu.position.z = o.eyeR * 0.85; pu.scale.set(0.95, 1.05, 0.8); eye.add(pu); sp.add(eye); hg2.add(sp); stalks.push({ sp, shaft, eye, s }); }
  const feelers = []; for (const s of [-1, 1]) { const f = new T.Mesh(new T.ConeGeometry(o.stalkR * 1.5, 0.2, 8), mat); hg2.add(f); feelers.push({ f, s }); }
  const L2 = _lamp(b, 0.7, 0.6); const nrm = new T.Vector3(), up = new T.Vector3(0, 1, 0), q = new T.Quaternion(), tan = new T.Vector3();
  return { g, core: 0.4, update(t, act) { const ph = 1.6 * t, ac = act || 0, lunge = 0.25 * ac;
    for (let i = 0; i < N; i++) { const u = i / (N - 1), w = Math.sin(ph * 2 - u * 6.0) * (0.3 + 0.7 * (1 - u)); const r = prof(u); rad[i] = Math.max(0.01, r * (1 + 0.05 * w)); pts[i].set(0, Math.max(0.04, r * o.flat * 0.5 + 0.03 + o.arch * Math.sin(Math.PI * u) + 0.025 * w), -L / 2 + u * L + lunge * u); }
    tube.set(pts, rad);
    const at = u => { const f = Math.max(0, Math.min(N - 1.001, u * (N - 1))), i = Math.floor(f), k = f - i; return { y: pts[i].y * (1 - k) + pts[i + 1].y * k, z: pts[i].z * (1 - k) + pts[i + 1].z * k, r: rad[i] * (1 - k) + rad[i + 1] * k, i }; };
    for (const H of hexes) { const P = at(H.u), sn = Math.sin(H.th), cs = Math.cos(H.th), hs = Math.max(0.03, P.r * o.hexSize * (0.8 + 0.2 * cs));
      // the body is the tube squashed by o.flat in y, so a point on its skin is (r sin, flat * (centre + r cos)) and the outward normal is (sin, cos / flat)
      H.hg.position.set(sn * P.r, o.flat * (P.y + cs * P.r), P.z); nrm.set(sn, cs / o.flat, 0); const i2 = Math.min(N - 1, P.i + 1), sl = o.flat * (pts[i2].y - pts[P.i].y) / Math.max(0.001, pts[i2].z - pts[P.i].z); nrm.z = -sl * cs; nrm.normalize();
      q.setFromUnitVectors(up, nrm); H.hg.quaternion.copy(q); H.hg.scale.set(hs, 1, hs); }
    const k0 = at(0.5); keel.position.set(0, o.flat * (k0.y + k0.r) * 1.0, k0.z); keel.scale.z = L * 0.5 * (1 + 0.0); keel.visible = !!o.keel;
    const hd = pts[N - 1]; hg2.position.set(0, hd.y + rad[N - 1] * o.flat * 0.3, hd.z - 0.05); horn.rotation.x = o.hornTilt + 0.04 * Math.sin(ph * 2) + 0.2 * ac;
    stalks.forEach(K => { const base = new T.Vector3(K.s * 0.05, rad[N - 1] * 0.3, rad[N - 1] * 0.4), tip = new T.Vector3(K.s * o.stalkSep, rad[N - 1] * 0.3 + o.stalkLen * (1 + 0.05 * Math.sin(ph * 2 + K.s * 2)), rad[N - 1] * 0.4 + 0.16 + 0.1 * Math.sin(ph * 2 + K.s * 1.4) + 0.08 * ac); setLink(K.shaft, base, tip); K.eye.position.copy(tip); K.eye.rotation.set(0.15 * Math.sin(ph * 2 + K.s), K.s * -0.12, 0); });
    feelers.forEach(F => { F.f.position.set(F.s * rad[N - 1] * 0.5, -rad[N - 1] * 0.05, rad[N - 1] * 0.75); F.f.rotation.set(PI / 2 + 0.3 + 0.12 * Math.sin(ph * 3 + F.s), 0, F.s * 0.5); });
    foot.position.z = 0.01 + lunge * 0.4; L2.intensity = 0.5 + 0.4 * Math.sin(ph * 2) + 0.7 * ac; } };
}
const _rB = { len: 1.9, rad: 0.3, flat: 0.8, arch: 0.04, horn: 0.9, hornR: 0.11, hornTilt: 0.34, stalkLen: 0.34, stalkSep: 0.26, stalkR: 0.024, eyeR: 0.082, mantle: 0.14, hexRows: 5, hexCols: 9, hexU0: 0.12, hexU1: 0.84, hexTh: 0.34, hexSize: 0.2, keel: true };
fx(410, "Realistic slug: blue body, honeycomb of black hexagon scutes with teal edges down its back.", () => _slugReal(Object.assign({}, _rB)));
fx(411, "Realistic slug, large hexes: bigger, bolder scutes.", () => _slugReal(Object.assign({}, _rB, { hexRows: 3, hexCols: 6, hexTh: 0.5, hexSize: 0.34 })));
fx(412, "Realistic slug, fine hexes: a tight honeycomb over most of the body.", () => _slugReal(Object.assign({}, _rB, { hexRows: 7, hexCols: 14, hexTh: 0.26, hexSize: 0.13, hexU0: 0.08 })));
fx(413, "Realistic slug, glowing hexes: the scutes filled with teal light.", () => _slugReal(Object.assign({}, _rB, { hexFill: true })));
fx(414, "Realistic slug, stout: a shorter, fatter body, big mantle.", () => _slugReal(Object.assign({}, _rB, { len: 1.4, rad: 0.38, flat: 0.9, mantle: 0.22, hexCols: 7, hexSize: 0.24 })));
fx(415, "Realistic slug, long leopard slug: a stretched body, hexes along the whole length.", () => _slugReal(Object.assign({}, _rB, { len: 2.5, rad: 0.25, flat: 0.74, hexCols: 14, hexSize: 0.17, hexU0: 0.08 })));
fx(416, "Realistic slug, blue-on-blue hexes: raised scutes in a darker blue, no black.", () => _slugReal(Object.assign({}, _rB, { hexMat: new T.MeshStandardMaterial({ color: 0x010a50, roughness: 0.5, flatShading: true }), hexSize: 0.21 })));
fx(417, "Realistic slug, arched hunch: a raised back, a crouching slug.", () => _slugReal(Object.assign({}, _rB, { arch: 0.17, len: 1.7 })));
