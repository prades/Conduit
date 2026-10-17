// ── THE WALKING VOLCANO · the toxic brawler, redesign Nos. 544–548: a black faceted shell with a cone on its back, goo oozing out of its sides,
// and four jointed legs that really walk (a diagonal gait: each foot lifts, swings forward and plants), not a bowl on blocks. ──
const _leg = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.2, roughness: 0.8, flatShading: true }); _leg.envMapIntensity = 0.3;
function _bone(a, b, r0, r1, mat) {   // a tapered faceted bone from a to b (rebuilt as a cylinder oriented each frame)
  const m = new T.Mesh(new T.CylinderGeometry(r1, r0, 1, 6, 1), mat); m.userData.a = a; return m;
}
function _setBone(m, p0, p1) { const d = new T.Vector3().subVectors(p1, p0), L = d.length(); m.position.copy(p0).addScaledVector(d, 0.5); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); }
function _walker(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const body = G(); b.add(body); const hipY = o.legH;
  const shell = new T.Mesh(new T.SphereGeometry(1, o.facets || 9, 6, 0, TAU, 0, PI / 2), _obsidian); shell.scale.set(o.rx, o.ry, o.rz); body.add(shell);
  const belly = new T.Mesh(new T.CylinderGeometry(o.rx * 0.9, o.rx * 0.7, 0.12, 9), _blackGloss); belly.scale.z = o.rz / o.rx; belly.position.y = -0.04; body.add(belly);
  const vol = volcanoMesh(o.vr, o.vh, o.rimR, o.seed || 3, _obsidian, o.seg || 9); vol.position.y = o.ry * 0.78; body.add(vol);
  const gm = new T.MeshStandardMaterial({ color: 0x02100a, emissive: new T.Color(EL.color).multiplyScalar(0.07), emissiveIntensity: 1.0, roughness: 1, metalness: 0 }); gm.envMapIntensity = 0;   // darker than the volcano's own goo: it is a lot of it
  const _g0 = _goo; _goo = () => gm; _drips(body, 0, o.ry * 0.78, 0, o.vr, o.vh, o.rimR, o.drips == null ? 3 : o.drips, o.seed || 3); const bub = _bubbling(body, 0, o.ry * 0.78 + o.vh * 0.86, 0, o.rimR * 0.92, 4, { noHeart: true, bubH: 0.16 }); _goo = _g0;
  // goo oozing out of the sides: swollen lobes bulging from under the shell's rim, sagging, each with a bead that gathers and falls
  const oozes = []; for (let i = 0; i < o.ooze; i++) { const a = (i + 0.5) * TAU / o.ooze + (_hz(i, o.seed || 3, 1) - 0.5) * 0.5, sz = o.oozeR * (0.7 + 0.6 * _hz(i, o.seed || 3, 2));
    const lobe = new T.Mesh(new T.IcosahedronGeometry(1, 1), gm); lobe.scale.set(sz * 1.1, sz * 1.2, sz * 0.8); body.add(lobe);
    const strand = new T.Mesh(new T.CylinderGeometry(sz * 0.3, sz * 0.42, 1, 6), gm); body.add(strand);
    const bead = new T.Mesh(new T.IcosahedronGeometry(1, 1), gm); body.add(bead); oozes.push({ lobe, strand, bead, a, sz, i }); }
  // the legs: hip on the shell's flank, thigh, knee, shin, foot; the foot walks an oval (back on the ground, forward in the air) and the leg follows
  const legs = []; for (let i = 0; i < 4; i++) { const sx = i % 2 ? -1 : 1, sz = i < 2 ? 1 : -1, th = _bone(null, null, o.legR, o.legR * 0.8, _leg), sh = _bone(null, null, o.legR * 0.8, o.legR * 0.5, _leg), ft = new T.Mesh(new T.OctahedronGeometry(o.legR * 1.5, 0), _leg);
    ft.scale.set(1.2, 0.55, 1.5); b.add(th); b.add(sh); b.add(ft); const kn = new T.Mesh(new T.IcosahedronGeometry(o.legR * 0.95, 0), gm); b.add(kn);
    legs.push({ sx, sz, th, sh, ft, kn, ph: (i === 0 || i === 3) ? 0 : PI }); }
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, o.ry + o.vh + 0.3, 0.5); b.add(L); LIGHTS.push(L);
  // the puddle it walks through: flat on the floor, drifting behind its feet
  const pool = G(); pool.userData.ground = true; const pm = new T.Mesh(new T.ShapeGeometry(blobShape(o.poolR, o.seed || 3, 1, 0, 0, 0.9)), gm); pm.rotation.x = -PI / 2; pm.position.y = 0.01; pool.add(pm); b.add(pool);
  const U1 = new T.Vector3(), U2 = new T.Vector3(), U3 = new T.Vector3();
  return { g, core: (o.legH + o.ry + o.vh * 0.5) * (o.S || 1), update(t, act) { const ph = 1.6 * t, ac = act || 0, step = o.step * (1 + 0.3 * ac);
    body.position.y = hipY + 0.035 * Math.abs(Math.sin(ph)) * -1 + 0.02 * Math.sin(2 * ph) - 0.07 * ac; body.rotation.z = 0.04 * Math.sin(ph); body.rotation.x = 0.03 * Math.sin(2 * ph);
    shell.scale.y = o.ry * (1 - 0.1 * ac); bub(t, ac);
    legs.forEach(l => { const cyc = ph + l.ph, fz = l.sz * o.rz * 0.55 + step * Math.cos(cyc), lift = Math.max(0, Math.sin(cyc)) * o.lift, fx = l.sx * (o.rx * 0.95 + o.out), fy = 0.04 + lift;
      const hip = U1.set(l.sx * o.rx * 0.74, hipY + 0.05 + body.position.y * 0 + 0.0, l.sz * o.rz * 0.5);   // hip (in the body's frame, roughly: the body bob is small)
      hip.y = body.position.y + 0.06; const foot = U2.set(fx, fy, fz);
      const d = hip.distanceTo(foot), A = o.legH * 0.62, Bn = o.legH * 0.62, c = Math.max(0.05, Math.min(A + Bn - 0.001, d)), k = Math.acos(Math.max(-1, Math.min(1, (A * A + c * c - Bn * Bn) / (2 * A * c))));
      const mid = U3.copy(hip).add(foot).multiplyScalar(0.5), dir = new T.Vector3().subVectors(foot, hip).normalize(), out = new T.Vector3(l.sx, 0.35, 0).normalize(); out.addScaledVector(dir, -out.dot(dir)).normalize();
      const knee = mid.clone().addScaledVector(out, Math.sin(k) * A * 0.95 - (c * 0.0));
      _setBone(l.th, hip, knee); _setBone(l.sh, knee, foot); l.kn.position.copy(knee); l.ft.position.copy(foot).add(new T.Vector3(0, 0.02, 0.03)); });
    oozes.forEach(O => { const sw = 1 + 0.12 * Math.sin(ph * 2 + O.i * 1.9) + 0.25 * ac, ra = O.a, rr = o.rx * 0.98, y = o.oozeY;
      const px = Math.sin(ra) * o.rx * 0.96, pz = Math.cos(ra) * o.rz * 0.96; O.lobe.position.set(px, y, pz); O.lobe.scale.set(O.sz * 1.1 * sw, O.sz * 1.3 * sw, O.sz * 0.8 * sw); O.lobe.rotation.y = ra;
      const u = ((ph / TAU + O.i * 0.31) % 1 + 1) % 1, sag = 0.12 + 0.2 * u, dropY = y - 0.02 - (u < 0.8 ? sag : 0.32 * (u - 0.8) / 0.2 * 3);
      O.strand.position.set(px * 1.04, y - sag * 0.5, pz * 1.04); O.strand.scale.set(1, sag, 1) ; O.strand.scale.x = O.strand.scale.z = O.sz * 0.6;
      O.bead.position.set(px * 1.06, (u < 0.8 ? y - sag : y - 0.2 - (u - 0.8) * 4 * hipY * 0.8), pz * 1.06); O.bead.scale.setScalar(O.sz * (u < 0.8 ? 0.45 + 0.4 * u : 0.8 - 2 * (u - 0.8)) + 0.001); });
    pm.geometry.dispose(); pm.geometry = new T.ShapeGeometry(blobShape(o.poolR, o.seed || 3, 1, 0, 0, t)); } };
}
const _wk = { rx: 0.52, ry: 0.34, rz: 0.64, legH: 0.42, legR: 0.065, vr: 0.38, vh: 0.42, rimR: 0.15, step: 0.17, lift: 0.12, out: 0.12, ooze: 5, oozeR: 0.1, oozeY: 0.1, poolR: 0.78, S: 1.3 };
fx(544, "A walking volcano: a black faceted shell with a cone on its back, goo oozing out of its sides, four jointed legs that lift and step.", () => _walker(Object.assign({}, _wk)));
fx(545, "Higher on its legs, a taller cone, long thin legs with a bigger stride: a spider-ish stride.", () => _walker(Object.assign({}, _wk, { legH: 0.58, vh: 0.5, vr: 0.34, step: 0.22, lift: 0.17, legR: 0.052 })));
fx(546, "Low and heavy: stubby thick legs, a wide shell, lots of ooze rolling off the flanks.", () => _walker(Object.assign({}, _wk, { legH: 0.32, legR: 0.085, rx: 0.58, rz: 0.68, ooze: 7, oozeR: 0.11, step: 0.16, lift: 0.1, poolR: 0.9 })));
fx(547, "A tall narrow cone and a small shell, goo overflowing the crater and running down the sides as well as out of them.", () => _walker(Object.assign({}, _wk, { vh: 0.7, vr: 0.32, rimR: 0.12, rx: 0.46, rz: 0.56, drips: 5, ooze: 4, oozeR: 0.1 })));
fx(548, "Wide-stanced: legs set further out, the shell sitting between them, a long puddle behind.", () => _walker(Object.assign({}, _wk, { out: 0.26, step: 0.2, ooze: 6, poolR: 0.95, legH: 0.44 })));
