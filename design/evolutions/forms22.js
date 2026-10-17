// ── THE WALKING VOLCANO · the toxic brawler, redesign Nos. 544–548: a black faceted shell with a cone on its back, goo oozing out of its sides,
// and four jointed legs that really walk (a diagonal gait: each foot lifts, swings forward and plants), not a bowl on blocks. ──
const _leg = new T.MeshStandardMaterial({ color: 0x010102, metalness: 0.2, roughness: 0.8, flatShading: true }); _leg.envMapIntensity = 0.3;
function _bone(a, b, r0, r1, mat) {   // a tapered faceted bone from a to b (rebuilt as a cylinder oriented each frame)
  const m = new T.Mesh(new T.CylinderGeometry(r1, r0, 1, 6, 1), mat); m.userData.a = a; return m;
}
function _setBone(m, p0, p1) { const d = new T.Vector3().subVectors(p1, p0), L = d.length(); m.position.copy(p0).addScaledVector(d, 0.5); m.scale.set(1, L, 1); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); }
function _footGeo(o) {   // the foot: never a block. pad = a flat round pad, hoof = a rounded hoof, claw = a toe-claw, ball = the leg just ends in a ball, paw = a round paw
  const r = o.legR, f = o.foot;
  if (f === 'pad') { const g = new T.SphereGeometry(r * 1.9, 12, 8); g.scale(1, 0.38, 1.25); return g; }
  if (f === 'hoof') { const g = new T.CylinderGeometry(r * 1.3, r * 1.9, r * 1.6, 10, 1); return g; }
  if (f === 'claw') { const g = new T.ConeGeometry(r * 1.3, r * 3.2, 7, 1); g.rotateX(PI / 2 + 0.5); g.translate(0, 0, r * 0.8); return g; }
  if (f === 'ball') return new T.SphereGeometry(r * 1.25, 10, 8);
  if (f === 'paw') { const g = new T.SphereGeometry(r * 1.7, 12, 8); g.scale(1.05, 0.62, 1.3); return g; }
  return o.plainLegs ? new T.BoxGeometry(r * 2.4, r * 1.2, r * 3) : new T.OctahedronGeometry(r * 1.5, 0);
}
function _walker(o) {
  const g = G(), b = G(); g.add(b); if (o.S) b.scale.setScalar(o.S);
  const body = G(); b.add(body); const hipY = o.legH;
  const shell = new T.Mesh(new T.SphereGeometry(1, o.facets || 9, 6, 0, TAU, 0, PI / 2), _obsidian); shell.scale.set(o.rx, o.ry, o.rz); body.add(shell);
  const belly = new T.Mesh(new T.CylinderGeometry(o.rx * 0.9, o.rx * 0.7, 0.12, 9), _blackGloss); belly.scale.z = o.rz / o.rx; belly.position.y = -0.04; body.add(belly);
  const vol = volcanoMesh(o.vr, o.vh, o.rimR, o.seed || 3, _obsidian, o.seg || 9); vol.position.y = o.ry * 0.78; body.add(vol);
  const gm = new T.MeshStandardMaterial({ color: 0x02100a, emissive: new T.Color(EL.color).multiplyScalar(0.07), emissiveIntensity: 1.0, roughness: 1, metalness: 0 }); gm.envMapIntensity = 0;   // darker than the volcano's own goo: it is a lot of it
  const _g0 = _goo; _goo = () => gm; _drips(body, 0, o.ry * 0.78, 0, o.vr, o.vh, o.rimR, o.drips == null ? 3 : o.drips, o.seed || 3); let bub = o.noBub ? () => {} : _bubbling(body, 0, o.ry * 0.78 + o.vh * 0.86, 0, o.rimR * 0.92, 4, { noHeart: true, bubH: 0.16 }); _goo = _g0;
  if (o.noBub) { const cr = new T.Mesh(new T.CircleGeometry(o.rimR * 0.95, 10), gm); cr.rotation.x = -PI / 2; cr.position.y = o.ry * 0.78 + o.vh * 0.97; body.add(cr); }   // just a green crater, no bubbling
  // goo oozing out of the sides: swollen lobes bulging from under the shell's rim, sagging, each with a bead that gathers and falls
  const oozes = []; for (let i = 0; i < o.ooze; i++) { const a = (i + 0.5) * TAU / o.ooze + (_hz(i, o.seed || 3, 1) - 0.5) * 0.5, sz = o.oozeR * (0.7 + 0.6 * _hz(i, o.seed || 3, 2));
    const lobe = new T.Mesh(new T.IcosahedronGeometry(1, 1), gm); lobe.scale.set(sz * 1.1, sz * 1.2, sz * 0.8); body.add(lobe);
    const strand = new T.Mesh(new T.CylinderGeometry(sz * 0.3, sz * 0.42, 1, 6), gm); body.add(strand);
    const bead = new T.Mesh(new T.IcosahedronGeometry(1, 1), gm); body.add(bead); oozes.push({ lobe, strand, bead, a, sz, i }); }
  // a leak: a seam in the shell's flank, a swollen lobe where it breaks out, and a stream down to the floor with beads running along it
  const leaks = []; (o.leaks || []).forEach((lk, li) => { const az = lk.az, big = lk.size || 1, lobe = new T.Mesh(new T.IcosahedronGeometry(1, 1), gm), seam = new T.Mesh(new T.BoxGeometry(0.022, 0.26, 0.022), gm), stream = new T.Mesh(new T.CylinderGeometry(1, 1.3, 1, 6), gm), beads = [];
    for (let k = 0; k < 3; k++) { const bd = new T.Mesh(new T.IcosahedronGeometry(1, 1), gm); body.add(bd); beads.push(bd); } body.add(lobe); if (!o.noSeam) body.add(seam); body.add(stream);
    leaks.push({ az, big, lobe, seam, stream, beads, li }); });
  // the eye: one big round oozing eye on the shell (or the cone), a socket, a lid that droops, and a tear that runs from it
  let eye = null; if (o.eye) { const E = o.eye, eg = G(), eMat = new T.MeshStandardMaterial({ color: 0x041a08, emissive: new T.Color(EL.color).multiplyScalar(0.2), emissiveIntensity: 1.0, roughness: 1, metalness: 0 }); eMat.envMapIntensity = 0;
    const sock = new T.Mesh(new T.TorusGeometry(E.r * 1.1, E.r * 0.28, 6, 14), _obsidian); eg.add(sock);
    const orb = new T.Mesh(new T.SphereGeometry(E.r, 14, 10), eMat); orb.position.z = -E.r * 0.1; eg.add(orb);
    const slit = E.slit ? new T.Mesh(new T.BoxGeometry(E.r * 0.28, E.r * 1.5, 0.02), _blackGloss) : null; if (slit) { slit.position.z = E.r * 0.9; eg.add(slit); }
    const lid = new T.Mesh(new T.SphereGeometry(E.r * 1.12, 12, 8, 0, TAU, 0, PI / 2), _obsidian); lid.position.z = -E.r * 0.05; lid.rotation.x = -PI / 2 + 0.2; eg.add(lid);   // a cap over the top of the orb
    eg.position.set(0, E.y, E.z); eg.rotation.x = -(E.up == null ? 0.3 : E.up); body.add(eg);
    const tb = new T.Mesh(new T.IcosahedronGeometry(1, 1), gm); body.add(tb); const tear = []; for (let k = 0; k < 9; k++) { const q = new T.Mesh(new T.IcosahedronGeometry(1, 1), gm); body.add(q); tear.push(q); }
    eye = { eg, orb, slit, lid, tear, tb, E, eMat }; }
  // the legs: hip on the shell's flank, thigh, knee, shin, foot; the foot walks an oval (back on the ground, forward in the air) and the leg follows
  const legs = []; for (let i = 0; i < 4; i++) { const sx = i % 2 ? -1 : 1, sz = i < 2 ? 1 : -1, th = _bone(null, null, o.legR, o.legR * 0.8, _leg), sh = _bone(null, null, o.legR * 0.8, o.legR * 0.5, _leg), ft = new T.Mesh(_footGeo(o), _leg);
    if (!o.foot) ft.scale.set(o.plainLegs ? 1 : 1.2, o.plainLegs ? 1 : 0.55, o.plainLegs ? 1 : 1.5); b.add(th); b.add(sh); b.add(ft); const kn = new T.Mesh(new T.IcosahedronGeometry(o.legR * 0.95, 0), gm); if (!o.plainLegs) b.add(kn);
    legs.push({ sx, sz, th, sh, ft, kn, ph: (i === 0 || i === 3) ? 0 : PI }); }
  const L = new T.PointLight(0xffffff, 0.2, 3.5, 2); L.color.set(EL.color); L.position.set(0, o.ry + o.vh + 0.3, 0.5); b.add(L); LIGHTS.push(L);
  // the puddle it walks through: flat on the floor, drifting behind its feet
  const pool = G(); pool.userData.ground = true; const pm = new T.Mesh(new T.ShapeGeometry(blobShape(o.poolR, o.seed || 3, 1, 0, 0, 0.9)), gm); pm.rotation.x = -PI / 2; pm.position.y = 0.01; pool.add(pm); b.add(pool);
  const puds = []; if (o.puddles) leaks.forEach(Lk => { const m = new T.Mesh(new T.ShapeGeometry(blobShape(0.2 * Lk.big, 5 + Lk.li, 1, 0, 0, 0)), gm); m.rotation.x = -PI / 2; m.position.set(Math.sin(Lk.az) * (o.rx + 0.05), 0.013, Math.cos(Lk.az) * (o.rz + 0.05)); pool.add(m); puds.push({ m, Lk }); });
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
    leaks.forEach(Lk => { const az = Lk.az, big = Lk.big, px = Math.sin(az) * o.rx * 0.97, pz = Math.cos(az) * o.rz * 0.97, y0 = 0.14, yb = -hipY + 0.03, flow = 1 + 0.2 * Math.sin(ph * 2 + Lk.li * 2) + 0.4 * ac, sw = 1 + 0.1 * Math.sin(ph * 2 + Lk.li);
      Lk.lobe.position.set(px, y0, pz); Lk.lobe.scale.set(0.12 * big * sw, 0.15 * big * sw, 0.08 * big); Lk.lobe.rotation.y = az;
      const dir = new T.Vector3(Math.sin(az) * Math.cos(1.0), Math.sin(1.0), Math.cos(az) * Math.cos(1.0)).normalize(); Lk.seam.position.set(px * 0.86, y0 + 0.17, pz * 0.86); Lk.seam.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
      const sx = Math.sin(az) * (o.rx + 0.03), sz2 = Math.cos(az) * (o.rz + 0.03); Lk.stream.position.set(sx, (y0 + yb) / 2, sz2); Lk.stream.scale.set(0.017 * big * flow, y0 - yb, 0.009 * big * flow); Lk.stream.rotation.y = az;
      Lk.beads.forEach((bd, k) => { const u = ((ph / TAU + k / 3 + Lk.li * 0.37) % 1 + 1) % 1; bd.position.set(sx, y0 - u * (y0 - yb), sz2); bd.scale.setScalar((0.03 + 0.016 * Math.sin(PI * u)) * big + 0.001); }); });
    if (eye) { const E = eye.E, blink = Math.sin(ph * 2 + 0.6) > 0.96 ? 1 : 0, droop = (E.lid == null ? 0.35 : E.lid) + 0.3 * blink + 0.1 * Math.sin(ph * 2), pulse = 1 + 0.06 * Math.sin(ph * 3) + 0.2 * ac;
      eye.orb.scale.setScalar(pulse); eye.lid.rotation.x = -PI / 2 + 0.2 + droop * 1.1 + 0.4 * 0; eye.eMat.emissive.copy(new T.Color(EL.color)).multiplyScalar(0.2 + 0.08 * Math.sin(ph * 3) + 0.2 * ac);
      // the tear hugs the shell: down the curve of the dome (z follows the shell's profile), thickest in the middle, then a bead falls off the rim to the floor
      const u = ((ph / TAU) % 1 + 1) % 1, top = E.y - E.r * 1.05, rimY = 0.02, bot = -hipY + 0.03, run = Math.min(1, u * 1.5), sy = o.ry * (1 - 0.1 * ac), surf = y => o.rz * Math.sqrt(Math.max(0, 1 - (y / sy) * (y / sy))) + 0.025;
      eye.tear.forEach((q, k) => { const w = k / (eye.tear.length - 1), y = top - (top - rimY) * w * run; q.position.set(0, y, surf(y)); q.scale.setScalar((E.tearW || 0.034) * (0.5 + 0.8 * Math.sin(PI * Math.min(1, w * 0.9 + 0.1))) * (w <= 1 ? 1 : 0) * (run > w * 0.2 ? 1 : 0.2) + 0.001); q.scale.z *= 0.6; });
      const fall = u > 0.6 ? (u - 0.6) / 0.4 : 0; eye.tb.position.set(0, fall ? rimY - fall * (rimY - bot) : top - (top - rimY) * run, fall ? o.rz + 0.05 : surf(top - (top - rimY) * run)); eye.tb.scale.setScalar(E.tearW ? E.tearW * 1.5 : 0.05); }
    puds.forEach(P => { P.m.geometry.dispose(); P.m.geometry = new T.ShapeGeometry(blobShape(0.22 * P.Lk.big, 5 + P.Lk.li, 1, 0, 0, t)); });
    pm.geometry.dispose(); pm.geometry = new T.ShapeGeometry(blobShape(o.poolR, o.seed || 3, 1, 0, 0, t)); } };
}
const _wk = { rx: 0.52, ry: 0.34, rz: 0.64, legH: 0.42, legR: 0.065, vr: 0.38, vh: 0.42, rimR: 0.15, step: 0.17, lift: 0.12, out: 0.12, ooze: 5, oozeR: 0.1, oozeY: 0.1, poolR: 0.78, S: 1.3 };
fx(544, "A walking volcano: a black faceted shell with a cone on its back, goo oozing out of its sides, four jointed legs that lift and step.", () => _walker(Object.assign({}, _wk)));
fx(545, "Higher on its legs, a taller cone, long thin legs with a bigger stride: a spider-ish stride.", () => _walker(Object.assign({}, _wk, { legH: 0.58, vh: 0.5, vr: 0.34, step: 0.22, lift: 0.17, legR: 0.052 })));
fx(546, "Low and heavy: stubby thick legs, a wide shell, lots of ooze rolling off the flanks.", () => _walker(Object.assign({}, _wk, { legH: 0.32, legR: 0.085, rx: 0.58, rz: 0.68, ooze: 7, oozeR: 0.11, step: 0.16, lift: 0.1, poolR: 0.9 })));
fx(547, "A tall narrow cone and a small shell, goo overflowing the crater and running down the sides as well as out of them.", () => _walker(Object.assign({}, _wk, { vh: 0.7, vr: 0.32, rimR: 0.12, rx: 0.46, rz: 0.56, drips: 5, ooze: 4, oozeR: 0.1 })));
fx(548, "Wide-stanced: legs set further out, the shell sitting between them, a long puddle behind.", () => _walker(Object.assign({}, _wk, { out: 0.26, step: 0.2, ooze: 6, poolR: 0.95, legH: 0.44 })));

// ── 544 with one oozing eye and a leak or two down its sides (Nos. 549–553) ──
const _wk2 = Object.assign({}, _wk, { ooze: 0 });
const _eyeF = { y: 0.2, z: 0.58, r: 0.1, up: 0.25, lid: 0.3 };
fx(549, "544 with one big oozing eye on the front of the shell and a leak on each side, streaming down to the puddle.", () => _walker(Object.assign({}, _wk2, { eye: _eyeF, leaks: [{ az: PI / 2 }, { az: -PI / 2, size: 0.8 }] })));
fx(550, "A bigger eye set a little higher, and one big leak on one side only.", () => _walker(Object.assign({}, _wk2, { eye: { y: 0.24, z: 0.56, r: 0.13, up: 0.3, lid: 0.3 }, leaks: [{ az: PI / 2, size: 1.3 }] })));
fx(551, "A sleepy eye, the lid half down, a heavy tear, and a leak on each side.", () => _walker(Object.assign({}, _wk2, { eye: { y: 0.2, z: 0.58, r: 0.11, up: 0.25, lid: 0.75 }, leaks: [{ az: PI / 2 }, { az: -PI / 2 }] })));
fx(552, "The eye on the cone itself, a cyclops volcano, its tear running down the cone, and a leak on each side.", () => _walker(Object.assign({}, _wk2, { eye: { y: 0.48, z: 0.3, r: 0.1, up: 0.5, lid: 0.3, tearTo: 0.2 }, leaks: [{ az: PI / 2 }, { az: -PI / 2 }] })));
fx(553, "A slit-pupil eye, glaring, and two leaks, one bigger than the other.", () => _walker(Object.assign({}, _wk2, { eye: Object.assign({}, _eyeF, { slit: true, lid: 0.5 }), leaks: [{ az: PI / 2, size: 1.2 }, { az: -PI / 2, size: 0.7 }] })));

// ── 551 worked on (Nos. 554–558): the tear now hugs the shell, thicker legs, thicker leaks, little puddles where the leaks land ──
const _w551 = Object.assign({}, _wk2, { eye: { y: 0.2, z: 0.58, r: 0.11, up: 0.25, lid: 0.75, tearW: 0.034 }, leaks: [{ az: PI / 2 }, { az: -PI / 2 }] });
fx(554, "551 with the tear running down the front of the shell, thicker legs, thicker leak streams.", () => _walker(Object.assign({}, _w551, { legR: 0.085, leaks: [{ az: PI / 2, size: 1.2 }, { az: -PI / 2, size: 1.2 }] })));
fx(555, "A heavier weeping eye: a fat tear from the eye down over the shell, the leaks as before, thicker legs.", () => _walker(Object.assign({}, _w551, { legR: 0.085, eye: { y: 0.2, z: 0.58, r: 0.11, up: 0.25, lid: 0.75, tearW: 0.05 } })));
fx(556, "Little goo puddles where each leak lands, thicker legs, the tear down the shell.", () => _walker(Object.assign({}, _w551, { legR: 0.085, puddles: true, leaks: [{ az: PI / 2, size: 1.2 }, { az: -PI / 2, size: 1.2 }] })));
fx(557, "Stubby, heavier legs and a lower shell: more weight, same eye and leaks, puddles under the leaks.", () => _walker(Object.assign({}, _w551, { legH: 0.36, legR: 0.1, ry: 0.3, puddles: true, step: 0.14, lift: 0.1, leaks: [{ az: PI / 2, size: 1.3 }, { az: -PI / 2, size: 1.3 }] })));
fx(558, "A leak at the back as well as the sides, three streams in all, puddles, the sleepy eye weeping.", () => _walker(Object.assign({}, _w551, { legR: 0.085, puddles: true, eye: { y: 0.2, z: 0.58, r: 0.11, up: 0.25, lid: 0.75, tearW: 0.042 }, leaks: [{ az: PI / 2, size: 1.2 }, { az: -PI / 2, size: 1.0 }, { az: PI + 0.5, size: 0.9 }] })));

// ── 556 simplified, like the other evolved followers (Nos. 559–563): fewer parts, bigger plain shapes ──
const _s556 = Object.assign({}, _w551, { legR: 0.085, puddles: true, leaks: [{ az: PI / 2, size: 1.2 }, { az: -PI / 2, size: 1.2 }] });
fx(559, "556 simpler: no bubbling crater or drips on the cone, no seams, plain legs with plain feet. The eye, the leaks and the puddles stay.", () => _walker(Object.assign({}, _s556, { noBub: true, drips: 0, noSeam: true, plainLegs: true, facets: 7, seg: 7 })));
fx(560, "Simpler again: the leaks are just a fat lobe and one drip each, the eye has a single drop for its tear.", () => _walker(Object.assign({}, _s556, { noBub: true, drips: 0, noSeam: true, plainLegs: true, facets: 7, seg: 7, eye: { y: 0.2, z: 0.58, r: 0.11, up: 0.25, lid: 0.75, tearW: 0.012 }, puddles: false })));
fx(561, "Simple and chunky: a lower, rounder shell, stubby plain legs, a short cone, the eye, one leak each side.", () => _walker(Object.assign({}, _s556, { noBub: true, drips: 0, noSeam: true, plainLegs: true, facets: 7, seg: 7, legH: 0.36, legR: 0.1, ry: 0.32, vh: 0.34, step: 0.14, lift: 0.1, puddles: false })));
fx(562, "The simplest: shell, cone, eye and two leaks, with the puddle: nothing else.", () => _walker(Object.assign({}, _s556, { noBub: true, drips: 0, noSeam: true, plainLegs: true, facets: 6, seg: 6, puddles: false, eye: { y: 0.2, z: 0.58, r: 0.12, up: 0.25, lid: 0.6, tearW: 0.012 } })));
fx(563, "Simple, with the green kept in the crater: a plain black cone glowing green at the top, plain legs, the eye and the two leaks.", () => _walker(Object.assign({}, _s556, { drips: 0, noSeam: true, plainLegs: true, facets: 7, seg: 7, puddles: false })));

// ── 559 without the square feet (Nos. 564–568): every foot is rounded ──
const _r559 = Object.assign({}, _s556, { noBub: true, drips: 0, noSeam: true, plainLegs: true, facets: 7, seg: 7 });
fx(564, "559 with flat round pads for feet.", () => _walker(Object.assign({}, _r559, { foot: 'pad' })));
fx(565, "Rounded hooves.", () => _walker(Object.assign({}, _r559, { foot: 'hoof' })));
fx(566, "Little toe-claws, pointing forward and down.", () => _walker(Object.assign({}, _r559, { foot: 'claw' })));
fx(567, "No feet at all: each leg just ends in a rounded blunt tip.", () => _walker(Object.assign({}, _r559, { foot: 'ball' })));
fx(568, "Round paws, a little wider than long.", () => _walker(Object.assign({}, _r559, { foot: 'paw' })));
