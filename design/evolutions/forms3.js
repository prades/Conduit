// ── SENTINELS, ROBOTS AND DRONES, Nos. 53–72 ─────────────────────────────
// Machines first: hulls, joints, thrusters, visors. The six-sided crystal is built in
// (an eye, a chest reactor, a lens) and the metal sheets are plating, wings and shields.
function thr(r) {   // a thruster pod pointing down, with its glow and exhaust wash
  const g = G(); g.add(cyl(r, r * 1.2, r * 1.3, M.dark, 14));
  const d = mesh(new T.CircleGeometry(r * 1.0, 16), M.glow, 0, -r * 0.66, 0); d.rotation.x = PI / 2; g.add(d);
  g.add(mesh(new T.CylinderGeometry(r * 0.9, r * 1.7, r * 3, 16, 1, true), M.wash, 0, -r * 2.2, 0));
  return g;
}
function eye(r, h, lamp) {   // the crystal as an eye or reactor: hex prism, lit from within, a small lamp
  const g = G(); g.add(hexCrystal(r, h, r * 1.1, M.crystal));
  g.add(glowSprite(r * 7));
  const L = new T.PointLight(0xffffff, lamp == null ? 0.35 : lamp, 3, 2); L.position.z = 0.5; L.color.set(EL.color); g.add(L); LIGHTS.push(L);
  return g;
}
function frame(R) { return new T.Mesh(new T.TorusGeometry(R, 0.03, 4, 6), M.steel); }   // a hex window frame facing +z
function visor(w, mat) { return cbox(w, 0.045, 0.04, 0.008, mat || M.glow); }
function arm(parent, a, k, h, r, mat) {   // shoulder → elbow → hand, with joints
  const u = limb(r, mat || M.armor), l = limb(r * 0.85, M.gun); setLink(u, a, k); setLink(l, k, h); parent.add(u, l);
  for (const p of [a, k, h]) { const j = sphere(r * 1.25, M.steel, 10); j.position.copy(p); parent.add(j); }
}
function leg3(parent, hip, knee, foot, r) { arm(parent, hip, knee, foot, r, M.armor); const f = cyl(r * 1.8, r * 2.2, 0.05, M.dark, 8); f.position.copy(foot); parent.add(f); }
function fx(no, desc, build) { f2(no, desc, build); }

fx(53, "Sentry drone: hex hull disc, crystal eye on top in a frame, four rotor arms, two orbiting shield sheets.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5, orb = G(); orb.position.y = Y; b.add(orb);
  const hull = hexPlate(0.5, 0.26, M.armor); hull.position.y = Y; b.add(hull); const rim = hexRing(0.51, 0.02, M.glow); rim.position.y = Y + 0.02; b.add(rim);
  const dome = mesh(new T.SphereGeometry(0.3, 18, 8, 0, TAU, 0, PI / 2), M.dark, 0, Y + 0.13); b.add(dome);
  const e = eye(0.12, 0.3, 0.5); e.position.y = Y + 0.4; b.add(e); const ef = hexRing(0.2, 0.02, M.steel); ef.position.y = Y + 0.3; b.add(ef);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, c = Math.cos(a), s = Math.sin(a); const bm = cbox(0.5, 0.05, 0.07, 0.01, M.gun); bm.position.set(c * 0.6, Y + 0.02, s * 0.6); bm.rotation.y = -a; b.add(bm);
    const rt = rotor(0.2); rt.g.position.set(c * 0.88, Y + 0.06, s * 0.88); b.add(rt.g); }
  for (const s of [-1, 1]) { const sh = sheet(0.5, 0.34, M.armor); const h = G(); h.position.set(s * 0.95, 0.0, s * 0.2); h.rotation.y = s * 1.3; sh.rotation.x = 0.2; h.add(sh); orb.add(h); }
  const eyeB = cyl(0.1, 0.14, 0.16, M.dark, 12); eyeB.position.y = Y - 0.2; b.add(eyeB); const lens = mesh(new T.CircleGeometry(0.07, 14), M.glow, 0, Y - 0.29, 0); lens.rotation.x = PI / 2; b.add(lens);
  return { g, core: Y + 0.4, update(t) { orb.rotation.y = t * 0.6; b.position.y = bob(t, 0, 0.04); } };
});
fx(54, "Humanoid sentinel: boxy torso with a crystal chest window, visored head, sheet pauldrons, hover legs and floating sheet wings.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.75;
  const torso = cbox(0.7, 0.85, 0.46, 0.08, M.armor); torso.position.y = Y; b.add(torso);
  const win = cbox(0.36, 0.44, 0.05, 0.01, M.dark); win.position.set(0, Y + 0.04, 0.24); b.add(win); const fr = frame(0.2); fr.position.set(0, Y + 0.04, 0.27); b.add(fr);
  const c = eye(0.09, 0.3, 0.4); c.position.set(0, Y + 0.04, 0.22); b.add(c);
  const hip = cbox(0.5, 0.2, 0.36, 0.05, M.gun); hip.position.y = Y - 0.55; b.add(hip);
  const neck = cyl(0.07, 0.09, 0.12, M.gun, 8); neck.position.y = Y + 0.5; b.add(neck);
  const head = cbox(0.38, 0.3, 0.34, 0.07, M.armor); head.position.y = Y + 0.72; b.add(head); const vz = visor(0.28); vz.position.set(0, Y + 0.74, 0.18); b.add(vz);
  const ant = cyl(0.01, 0.01, 0.3, M.steel, 5); ant.position.set(0.14, Y + 1.0, 0); b.add(ant);
  for (const s of [-1, 1]) { const p = sheet(0.5, 0.42, M.armor); p.position.set(s * 0.56, Y + 0.42, 0); p.rotation.set(0.1, s * 1.25, s * -0.4); b.add(p);
    arm(b, V(s * 0.45, Y + 0.28, 0), V(s * 0.62, Y - 0.1, 0.08), V(s * 0.58, Y - 0.5, 0.3), 0.045);
    const t = thr(0.1); t.position.set(s * 0.15, Y - 0.78, 0); b.add(t);
    const w = feather(0.9, 0.12, M.gun); const wp = G(); wp.position.set(s * 0.2, Y + 0.3, -0.35); wp.rotation.set(0, s > 0 ? 2.5 : PI - 2.5, s * 0.5); wp.add(w); b.add(wp); }
  return { g, core: Y, update(t) { b.position.y = bob(t, 0, 0.03); } };
});
fx(55, "Gunship: a long hull with a crystal cockpit bay, four ducted rotors on outriggers, tail fin sheets and an underslung barrel.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const hull = plate([[-0.22, 0.6], [0.22, 0.6], [0.3, 0.1], [0.24, -0.7], [-0.24, -0.7], [-0.3, 0.1]], 0.3, 0.06, M.armor); hull.rotation.x = PI / 2; hull.position.y = Y; b.add(hull);
  const bay = cbox(0.3, 0.14, 0.5, 0.03, M.dark); bay.position.set(0, Y + 0.17, 0.1); b.add(bay);
  const c = hexCrystal(0.07, 0.4, 0.1, M.crystal); c.rotation.x = PI / 2; c.position.set(0, Y + 0.2, 0.1); b.add(c); const lamp = new T.PointLight(0xffffff, 0.4, 3, 2); lamp.color.set(EL.color); lamp.position.set(0, Y + 0.4, 0.1); b.add(lamp); LIGHTS.push(lamp);
  const vz = visor(0.3); vz.position.set(0, Y + 0.02, 0.62); b.add(vz);
  for (const [x, z] of [[0.62, 0.35], [-0.62, 0.35], [0.62, -0.4], [-0.62, -0.4]]) { const bm = cbox(0.5, 0.05, 0.06, 0.01, M.gun); bm.position.set(x / 2 + (x > 0 ? 0.04 : -0.04), Y, z); b.add(bm); const rt = rotor(0.2); rt.g.position.set(x, Y + 0.05, z); b.add(rt.g); }
  for (const s of [-1, 1]) { const f = sheet(0.3, 0.45, M.armor); f.position.set(s * 0.14, Y + 0.3, -0.62); f.rotation.set(0, 0, s * 0.25); b.add(f); }
  const brl = cyl(0.045, 0.045, 0.7, M.gun, 10); brl.rotation.x = PI / 2; brl.position.set(0, Y - 0.2, 0.45); b.add(brl); const mz = torus(0.05, 0.012, M.glow, 14); mz.position.set(0, Y - 0.2, 0.8); b.add(mz);
  return { g, core: Y + 0.2, update(t) { b.position.y = bob(t, 1, 0.03); } };
});
fx(56, "Spider-bot: a plated hull with a crystal reactor on its back and six jointed legs.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.95;
  const hull = cbox(0.9, 0.28, 0.72, 0.07, M.armor); hull.position.y = Y; b.add(hull); const hl = cbox(0.5, 0.2, 0.5, 0.05, M.dark); hl.position.y = Y + 0.18; b.add(hl);
  const e = eye(0.13, 0.36, 0.5); e.position.y = Y + 0.5; b.add(e); const ef = hexRing(0.22, 0.025, M.steel); ef.position.y = Y + 0.3; b.add(ef);
  const vz = visor(0.5); vz.position.set(0, Y + 0.05, 0.37); b.add(vz);
  for (let i = 0; i < 3; i++) { const s = sheet(0.5 - i * 0.05, 0.3, i % 2 ? M.armor : M.gun, false); s.rotation.x = -PI / 2 + 0.3; s.position.set(0, Y + 0.16, -0.12 - i * 0.12); b.add(s); }
  for (let i = 0; i < 6; i++) { const side = i % 2 ? -1 : 1, row = Math.floor(i / 2), z = 0.22 - row * 0.22; const hip = V(side * 0.45, Y, z), knee = V(side * 0.95, Y + 0.45, z + (row - 1) * 0.1), foot = V(side * 1.2, 0.02, z + (row - 1) * 0.25); leg3(b, hip, knee, foot, 0.04); }
  return { g, core: Y + 0.5, update() {} };
});
fx(57, "Gimbal warden: a dark sphere with the crystal as a forward eye, three gimbal rings round it, and four curved armour shells floating off it.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5, rings = [];
  const ball = sphere(0.34, M.dark, 28); ball.position.y = Y; b.add(ball); const eq = torus(0.345, 0.02, M.steel, 36); eq.position.y = Y; b.add(eq);
  const e = eye(0.1, 0.3, 0.6); e.rotation.x = PI / 2; e.position.set(0, Y, 0.34); b.add(e); const fr = frame(0.16); fr.position.set(0, Y, 0.36); b.add(fr);
  [[0, 0.52], [PI / 2, 0.58], [PI / 4, 0.64]].forEach(([tilt, R], k) => { const r = torus(R, 0.035, k % 2 ? M.gun : M.armor, 48); r.position.y = Y; r.rotation.set(tilt + (k ? 0 : PI / 2), k * 0.6, 0); b.add(r); rings.push(r); });
  const mat = M.armor.clone(); mat.side = T.DoubleSide;
  const shells = [];
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, m = mesh(new T.SphereGeometry(0.82, 12, 8, a - 0.5, 1.0, 1.0, 1.1), mat); m.position.y = Y; b.add(m); const ed = mesh(new T.SphereGeometry(0.822, 12, 1, a - 0.5, 1.0, 1.0, 0.025), M.glow); ed.position.y = Y; b.add(ed);
    shells.push({ m, ed, dir: V(-Math.cos(a) * Math.sin(1.55), Math.cos(1.55), Math.sin(a) * Math.sin(1.55)) }); }
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3, t = thr(0.07); t.position.set(Math.sin(a) * 0.22, Y - 0.38, Math.cos(a) * 0.22); b.add(t); }
  // One beat (1.6 rad/s) drives everything, so the baked sheet loops; the action flares the shells outward.
  return { g, core: Y, update(t, act) { const burst = act > 0.6 ? Math.sin(Math.min(1, (act - 0.6) / 0.4) * PI) : 0;
    rings.forEach((r, i) => r.rotation.z = t * 1.6 * (i === 2 ? 2 : 1) + burst * 0.8);
    shells.forEach(S => { const p = V(0, Y, 0).addScaledVector(S.dir, burst * 0.24); S.m.position.copy(p); S.ed.position.copy(p); }); b.position.y = bob(t, 2, 0.04); } };
});
fx(58, "Hover tank: a low sloped hull with side skirts, a turret whose barrel houses the crystal as a lens, and four hover pads.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.75;
  const hull = plate([[-0.62, 0.0], [-0.55, 0.28], [0.3, 0.3], [0.78, 0.1], [0.78, -0.02], [-0.62, -0.02]], 1.0, 0.05, M.armor); hull.rotation.y = PI / 2; hull.position.set(0, Y, 0); b.add(hull);
  for (const s of [-1, 1]) { const sk = sheet(1.3, 0.3, M.gun); sk.rotation.y = PI / 2; sk.position.set(s * 0.55, Y - 0.1, 0.05); b.add(sk); }
  const tur = G(); tur.position.set(0, Y + 0.3, -0.1); b.add(tur); const dome = cyl(0.3, 0.38, 0.22, M.armor, 10); tur.add(dome);
  const hs = cyl(0.17, 0.17, 0.6, M.dark, 12); hs.rotation.x = PI / 2; hs.position.set(0, 0.16, 0.35); tur.add(hs);
  const c = hexCrystal(0.08, 0.5, 0.12, M.crystal); c.rotation.x = PI / 2; c.position.set(0, 0.16, 0.38); tur.add(c); const lm = new T.PointLight(0xffffff, 0.4, 3, 2); lm.color.set(EL.color); lm.position.set(0, 0.3, 0.4); tur.add(lm); LIGHTS.push(lm);
  const mz = torus(0.17, 0.025, M.glow, 6); mz.position.set(0, 0.16, 0.68); tur.add(mz);
  for (const [x, z] of [[0.45, 0.6], [-0.45, 0.6], [0.45, -0.55], [-0.45, -0.55]]) { const t = thr(0.12); t.position.set(x, Y - 0.14, z); b.add(t); }
  const an = cyl(0.01, 0.01, 0.4, M.steel, 5); an.position.set(-0.3, Y + 0.6, -0.4); b.add(an);
  const beam = cyl(0.035, 0.035, 1.5, M.glow, 8); beam.rotation.x = PI / 2; beam.position.set(0, 0.16, 1.45); tur.add(beam);
  return { g, core: Y + 0.46, update(t, act) { b.position.y = bob(t, 0, 0.03); tur.rotation.y = Math.sin(t * 1.6) * 0.5; beam.visible = act > 0.55; } };
});
fx(59, "Scout: a small egg hull split by a glowing seam, a big visor, a crystal eye on its brow, folded sheet wings and rear rotors.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.35;
  const body = mesh(new T.SphereGeometry(0.42, 28, 16), M.armor, 0, Y); body.scale.set(0.9, 1.1, 1.05); b.add(body);
  const seam = torus(0.4, 0.016, M.glow, 40); seam.position.y = Y; seam.scale.set(0.9, 1.05, 1.0); b.add(seam);
  const vz = cbox(0.4, 0.12, 0.08, 0.025, M.dark); vz.position.set(0, Y + 0.12, 0.38); b.add(vz); const v2 = visor(0.3); v2.position.set(0, Y + 0.12, 0.43); b.add(v2);
  const e = eye(0.07, 0.2, 0.4); e.position.set(0, Y + 0.38, 0.3); e.rotation.x = 0.7; b.add(e);
  for (const s of [-1, 1]) { const w = feather(0.7, 0.1, M.gun); const p = G(); p.position.set(s * 0.32, Y + 0.12, -0.2); p.rotation.set(0.25, s > 0 ? PI - 0.4 : 0.4, s * -0.2); p.add(w); b.add(p);
    const rt = rotor(0.14); rt.g.position.set(s * 0.5, Y + 0.3, -0.3); b.add(rt.g); }
  const t = thr(0.12); t.position.y = Y - 0.5; b.add(t);
  return { g, core: Y + 0.38, update(t) { b.position.y = bob(t, 1, 0.05); } };
});
fx(60, "Colossus bust: a wide torso with stacked sheet pauldrons, a head with one vertical crystal eye, two big back thrusters and no legs.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.6;
  const torso = cbox(1.0, 0.6, 0.62, 0.1, M.armor); torso.position.y = Y; b.add(torso);
  const hip = cyl(0.36, 0.1, 0.4, M.gun, 6); hip.position.y = Y - 0.5; b.add(hip); const t0 = thr(0.14); t0.position.y = Y - 0.82; b.add(t0);
  const head = cbox(0.4, 0.34, 0.4, 0.08, M.dark); head.position.y = Y + 0.5; b.add(head);
  const fr = cbox(0.14, 0.26, 0.04, 0.01, M.gun); fr.position.set(0, Y + 0.5, 0.21); b.add(fr); const e = eye(0.045, 0.2, 0.3); e.position.set(0, Y + 0.5, 0.2); b.add(e);
  for (const s of [-1, 1]) { for (let k = 0; k < 3; k++) { const p = sheet(0.55 - k * 0.07, 0.3, k % 2 ? M.gun : M.armor); p.position.set(s * (0.62 + k * 0.05), Y + 0.34 - k * 0.12, 0); p.rotation.set(0, s * 1.35, s * (-0.25 - k * 0.1)); b.add(p); }
    const th = thr(0.17); th.position.set(s * 0.38, Y + 0.1, -0.5); th.rotation.x = PI / 2 - 0.3; b.add(th); }
  const chest = cbox(0.5, 0.3, 0.05, 0.01, M.dark); chest.position.set(0, Y - 0.02, 0.32); b.add(chest); const cv = visor(0.4); cv.position.set(0, Y - 0.02, 0.35); b.add(cv);
  return { g, core: Y + 0.5, update(t) { b.position.y = bob(t, 2, 0.03); } };
});
fx(61, "Angel-bot: a slim hex-prism body with a crystal chest, a floating halo ring, six sheet wings on back struts and long sheet robes ending in thrusters.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.7;
  const torso = cyl(0.27, 0.2, 0.9, M.armor, 6); torso.position.y = Y; b.add(torso);
  const fr = frame(0.14); fr.position.set(0, Y + 0.12, 0.25); b.add(fr); const e = eye(0.07, 0.24, 0.35); e.position.set(0, Y + 0.12, 0.22); b.add(e);
  const head = cbox(0.26, 0.24, 0.26, 0.06, M.gun); head.position.y = Y + 0.72; b.add(head); const vz = visor(0.2); vz.position.set(0, Y + 0.74, 0.14); b.add(vz);
  const halo = hexRing(0.28, 0.025, M.glow); halo.position.y = Y + 1.05; b.add(halo);
  for (const s of [-1, 1]) { arm(b, V(s * 0.3, Y + 0.35, 0), V(s * 0.38, Y, 0.1), V(s * 0.3, Y - 0.3, 0.3), 0.035);
    [[1.1, 60], [0.95, 28], [0.8, -4]].forEach(([len, deg], i) => { const f = feather(len, 0.12, i === 1 ? M.steel : M.armor); const pv = G(); pv.position.set(s * 0.15, Y + 0.3 - i * 0.14, -0.22 - i * 0.04); pv.rotation.z = (s > 0 ? deg : 180 - deg) * PI / 180; pv.add(f); b.add(pv); });
    const strut = limb(0.02, M.gun); setLink(strut, V(s * 0.2, Y + 0.3, -0.12), V(s * 0.3, Y + 0.3, -0.24)); b.add(strut); }
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, p = plate([[-0.1, 0], [0.1, 0], [0.05, -0.8], [0, -0.95], [-0.05, -0.8]], 0.03, 0.006, i % 2 ? M.armor : M.gun); const h = G(); h.position.set(Math.sin(a) * 0.2, Y - 0.45, Math.cos(a) * 0.2); h.rotation.y = a; const pv = G(); pv.add(p); pv.rotation.x = -0.12; h.add(pv); b.add(h); }
  const t = thr(0.1); t.position.y = Y - 1.45; b.add(t);
  return { g, core: Y + 0.12, update(t) { b.position.y = bob(t, 0, 0.03); halo.rotation.z = t * 0.5; } };
});
fx(62, "Carapace drone: a round hull under a domed back of overlapping sheets split open to show the crystal reactor, ringed by a big ducted fan.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.3;
  const hull = cyl(0.6, 0.5, 0.2, M.dark, 24); hull.position.y = Y; b.add(hull);
  const ring = torus(0.78, 0.1, M.armor, 40); ring.rotation.x = PI / 2; ring.position.y = Y + 0.02; b.add(ring); const rg = torus(0.7, 0.014, M.glow, 40); rg.rotation.x = PI / 2; rg.position.y = Y + 0.1; b.add(rg);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2, st = cbox(0.3, 0.05, 0.06, 0.01, M.gun); st.position.set(Math.cos(a) * 0.68, Y, Math.sin(a) * 0.68); st.rotation.y = -a; b.add(st); }
  const e = eye(0.15, 0.34, 0.5); e.position.y = Y + 0.38; b.add(e);
  for (let r = 0; r < 3; r++) { const n = 5 + r, R = 0.55 - r * 0.12; for (let i = 0; i < n; i++) { const a = i * TAU / n + r * 0.35, side = Math.sin(a) > 0 ? 1 : -1; const s = sheet(0.34 - r * 0.05, 0.34, r % 2 ? M.armor : M.gun, r === 0); const h = G(); h.position.set(Math.cos(a) * R, Y + 0.1 + r * 0.1, Math.sin(a) * R); h.rotation.y = -a + PI / 2; const pv = G(); pv.add(s); pv.rotation.x = -0.7 + r * 0.12 - 0.5; pv.position.y = 0.12; h.add(pv); b.add(h); } }
  for (const s of [-1, 1]) { const l = mesh(new T.CircleGeometry(0.07, 16), M.glow, s * 0.22, Y - 0.05, 0.5); b.add(l); }
  const t = thr(0.14); t.position.y = Y - 0.3; b.add(t);
  return { g, core: Y + 0.38, update(t) { b.position.y = bob(t, 0, 0.03); } };
});
fx(63, "Tripod walker: a domed head with a big visor and a forward crystal eye, three long three-joint legs, a hip skirt of sheets and a crystal tank on its back.", () => {
  const g = G(), b = G(); g.add(b); const Y = 2.05;
  const head = mesh(new T.SphereGeometry(0.36, 24, 12), M.armor, 0, Y); head.scale.set(1, 0.85, 1); b.add(head); const hr = torus(0.36, 0.02, M.steel, 30); hr.position.y = Y - 0.05; hr.rotation.x = PI / 2; b.add(hr);
  const vz = cbox(0.4, 0.14, 0.08, 0.03, M.dark); vz.position.set(0, Y + 0.02, 0.32); b.add(vz); const v2 = visor(0.32); v2.position.set(0, Y + 0.02, 0.37); b.add(v2);
  const e = eye(0.06, 0.18, 0.3); e.position.set(0, Y + 0.22, 0.3); e.rotation.x = 0.8; b.add(e);
  const hip = cyl(0.3, 0.34, 0.18, M.gun, 6); hip.position.y = Y - 0.4; b.add(hip);
  const tank = cyl(0.12, 0.12, 0.6, M.dark, 6); tank.position.set(0, Y - 0.05, -0.4); b.add(tank); const te = hexCrystal(0.06, 0.4, 0.08, M.crystal); te.position.set(0, Y - 0.05, -0.4); b.add(te);
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + PI / 2, c = Math.cos(a), s = Math.sin(a); leg3(b, V(c * 0.3, Y - 0.4, s * 0.3), V(c * 0.85, Y - 0.2, s * 0.85), V(c * 1.0, 0.03, s * 1.0), 0.04);
    const sh = sheet(0.26, 0.45, i % 2 ? M.armor : M.gun, false); const h = G(); h.position.set(c * 0.34, Y - 0.62, s * 0.34); h.rotation.y = PI / 2 - a; sh.rotation.x = -0.15; sh.position.y = -0.2; h.add(sh); b.add(h); }
  return { g, core: Y + 0.22, update() {} };
});
fx(64, "Twin-hull: two capsule pods joined by a crystal spine, each with a visor and a rotor ring, and sheet wings between them.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.45;
  for (const s of [-1, 1]) { const pod = cyl(0.22, 0.22, 1.1, M.armor, 16); pod.rotation.x = PI / 2; pod.position.set(s * 0.65, Y, 0); b.add(pod); const nose = mesh(new T.SphereGeometry(0.22, 14, 8, 0, TAU, 0, PI / 2), M.dark); nose.rotation.x = PI / 2; nose.position.set(s * 0.65, Y, 0.55); b.add(nose);
    const vz = visor(0.2); vz.rotation.y = PI / 2; vz.position.set(s * 0.65 + s * -0.0, Y + 0.12, 0.45); b.add(vz); vz.rotation.y = 0; vz.scale.x = 0.9;
    const rt = rotor(0.26); rt.g.position.set(s * 0.65, Y + 0.3, -0.1); b.add(rt.g); const bd = torus(0.223, 0.012, M.glow, 20); bd.position.set(s * 0.65, Y, 0.1); b.add(bd);
    const w = sheet(0.7, 0.5, M.gun); w.rotation.set(0, PI / 2, 0); w.position.set(s * 0.33, Y + 0.22, -0.2); w.rotation.z = s * 0.3; b.add(w); }
  const br = cbox(0.9, 0.12, 0.3, 0.03, M.dark); br.position.set(0, Y, 0.1); b.add(br);
  const e = hexCrystal(0.1, 0.8, 0.12, M.crystal); e.rotation.z = PI / 2; e.position.set(0, Y + 0.12, 0.1); b.add(e); const lm = new T.PointLight(0xffffff, 0.4, 3, 2); lm.color.set(EL.color); lm.position.set(0, Y + 0.4, 0.1); b.add(lm); LIGHTS.push(lm);
  for (const x of [-0.3, 0.3]) { const fr = cbox(0.04, 0.2, 0.34, 0.008, M.steel); fr.position.set(x, Y + 0.12, 0.1); b.add(fr); }
  return { g, core: Y + 0.12, update(t) { b.position.y = bob(t, 0, 0.03); } };
});
fx(65, "Pylon-bot: a tall slim hex tower with a turning head ring and crystal lens, four sheet blades circling its waist and a thruster ring at the base.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.95;
  const tw = cyl(0.22, 0.3, 1.5, M.armor, 6); tw.position.y = Y + 0.7; b.add(tw);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + PI / 6, sm = cbox(0.025, 1.2, 0.02, 0.003, M.glow); sm.position.set(Math.sin(a) * 0.255, Y + 0.7, Math.cos(a) * 0.255); sm.rotation.y = a; b.add(sm); }
  const head = G(); head.position.y = Y + 1.62; b.add(head); const hr = cyl(0.3, 0.3, 0.2, M.gun, 6); head.add(hr);
  const lens = G(); lens.position.set(0, 0, 0.26); head.add(lens); const fr = frame(0.15); lens.add(fr); const e = eye(0.07, 0.22, 0.4); e.position.z = -0.02; lens.add(e);
  const ant = cyl(0.012, 0.012, 0.5, M.steel, 5); ant.position.y = 0.5; head.add(ant);
  const blades = G(); blades.position.y = Y + 0.9; b.add(blades);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2, f = feather(0.55, 0.07, i % 2 ? M.steel : M.armor); const h = G(); h.rotation.y = a; f.position.x = 0.42; h.add(f); f.rotation.z = 0.0; blades.add(h); }
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3, t = thr(0.1); t.position.set(Math.sin(a) * 0.32, Y - 0.1, Math.cos(a) * 0.32); b.add(t); }
  const base = hexPlate(0.4, 0.08, M.dark); base.position.y = Y - 0.05; b.add(base);
  return { g, core: Y + 1.62, update(t) { blades.rotation.y = t * 1.2; head.rotation.y = Math.sin(t * 0.5) * 0.7; b.position.y = bob(t, 0, 0.03); } };
});
fx(66, "Shield bearer: a compact hull with a crystal chest port, a big hex shield plate floating in front of it in a lit frame, two rotor pods and side vanes.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.45;
  const hull = cbox(0.6, 0.7, 0.5, 0.09, M.armor); hull.position.y = Y; b.add(hull);
  const e = eye(0.09, 0.3, 0.3); e.position.set(0, Y + 0.05, 0.1); b.add(e); const vz = visor(0.4); vz.position.set(0, Y + 0.3, 0.26); b.add(vz);
  const sh = G(); sh.position.set(0, Y, 0.78); b.add(sh); const hp = hexPlate(0.62, 0.07, M.armor); hp.rotation.x = PI / 2; hp.rotation.y = PI / 6; sh.add(hp);
  const hr = new T.Mesh(new T.TorusGeometry(0.62, 0.03, 4, 6), M.glow); hr.rotation.z = PI / 6; hr.position.z = 0.04; sh.add(hr);
  const hr2 = new T.Mesh(new T.TorusGeometry(0.4, 0.02, 4, 6), M.steel); hr2.rotation.z = PI / 6; hr2.position.z = 0.045; sh.add(hr2);
  for (const s of [-1, 1]) { const rt = rotor(0.2); rt.g.position.set(s * 0.58, Y + 0.38, -0.05); b.add(rt.g); const st = cbox(0.3, 0.05, 0.06, 0.01, M.gun); st.position.set(s * 0.42, Y + 0.34, -0.05); b.add(st);
    const v = sheet(0.28, 0.5, M.gun); v.position.set(s * 0.42, Y - 0.15, -0.1); v.rotation.set(0, PI / 2, s * 0.15); b.add(v); }
  const t = thr(0.12); t.position.y = Y - 0.5; b.add(t);
  return { g, core: Y + 0.05, update(t) { b.position.y = bob(t, 0, 0.03); sh.position.z = 0.78 + Math.sin(t * 1.2) * 0.04; } };
});
fx(67, "Gunner-bot: a hex-prism torso with a crystal chest window, a domed visor head, two arm cannons, a jet-wing backpack and short thruster legs.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.7;
  const torso = cyl(0.36, 0.3, 0.8, M.armor, 6); torso.position.y = Y; b.add(torso);
  const fr = frame(0.17); fr.position.set(0, Y + 0.08, 0.31); b.add(fr); const e = eye(0.08, 0.28, 0.35); e.position.set(0, Y + 0.08, 0.27); b.add(e);
  const head = mesh(new T.SphereGeometry(0.2, 18, 10, 0, TAU, 0, PI * 0.75), M.dark, 0, Y + 0.6); b.add(head); const vz = visor(0.26); vz.position.set(0, Y + 0.6, 0.18); b.add(vz);
  for (const s of [-1, 1]) { const sp = sheet(0.38, 0.3, M.armor); sp.position.set(s * 0.45, Y + 0.34, 0); sp.rotation.set(0, s * 1.2, s * -0.35); b.add(sp);
    const arm1 = limb(0.05, M.armor); setLink(arm1, V(s * 0.45, Y + 0.28, 0), V(s * 0.55, Y - 0.1, 0.2)); b.add(arm1);
    const cn = cyl(0.08, 0.08, 0.6, M.gun, 12); cn.rotation.x = PI / 2; cn.position.set(s * 0.56, Y - 0.15, 0.5); b.add(cn); const mz = torus(0.08, 0.016, M.glow, 14); mz.position.set(s * 0.56, Y - 0.15, 0.82); b.add(mz);
    const hs = cbox(0.14, 0.2, 0.24, 0.04, M.dark); hs.position.set(s * 0.56, Y - 0.15, 0.25); b.add(hs);
    const wg = sheet(0.4, 0.9, M.gun); wg.position.set(s * 0.45, Y + 0.1, -0.5); wg.rotation.set(0.1, 0, s * 0.45); b.add(wg);
    const th = thr(0.1); th.position.set(s * 0.18, Y - 0.58, 0); b.add(th); const th2 = thr(0.13); th2.position.set(s * 0.25, Y + 0.2, -0.42); th2.rotation.x = PI - 0.4; b.add(th2); }
  const pack = cbox(0.5, 0.6, 0.2, 0.05, M.dark); pack.position.set(0, Y + 0.1, -0.38); b.add(pack);
  return { g, core: Y + 0.08, update(t) { b.position.y = bob(t, 1, 0.03); } };
});
fx(68, "Manta drone: a flat diamond hull with a visor, a crystal ridge in a raised frame along its spine, big swept wing sheets with a thruster at each tip, twin tail fins.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.35;
  const hull = plate([[0, 0.8], [0.3, 0.1], [0.22, -0.55], [0, -0.7], [-0.22, -0.55], [-0.3, 0.1]], 0.14, 0.04, M.armor); hull.rotation.x = PI / 2; hull.position.y = Y; b.add(hull);
  const ridge = cbox(0.14, 0.12, 0.7, 0.03, M.dark); ridge.position.set(0, Y + 0.12, 0.05); b.add(ridge); const c = hexCrystal(0.06, 0.55, 0.1, M.crystal); c.rotation.x = PI / 2; c.position.set(0, Y + 0.2, 0.05); b.add(c); const lm = new T.PointLight(0xffffff, 0.4, 3, 2); lm.color.set(EL.color); lm.position.set(0, Y + 0.5, 0.05); b.add(lm); LIGHTS.push(lm);
  const vz = visor(0.22); vz.position.set(0, Y + 0.05, 0.66); vz.rotation.x = 0; b.add(vz);
  const wings = [], tps = [];
  for (const s of [-1, 1]) { for (let i = 0; i < 3; i++) { const w = feather(1.0 - i * 0.18, 0.2 - i * 0.03, i % 2 ? M.gun : M.armor); const p = G(); p.position.set(s * 0.2, Y - 0.01 - i * 0.02, 0.3 - i * 0.22); const base = s > 0 ? -0.5 - i * 0.12 : PI + 0.5 + i * 0.12; p.rotation.y = base; p.add(w); b.add(p); wings.push({ p, base, s }); }
    const tp = thr(0.1); tp.rotation.z = s * 1.0; tp.position.set(s * 1.0, Y + 0.0, -0.35); tp.rotation.x = 0; b.add(tp); tps.push(tp);
    const fn = sheet(0.26, 0.4, M.armor); fn.position.set(s * 0.14, Y + 0.25, -0.6); fn.rotation.z = s * 0.3; b.add(fn); }
  return { g, core: Y + 0.2, update(t, act) { const burst = act > 0.5 ? Math.sin(Math.min(1, (act - 0.5) / 0.5) * PI) : 0;
    b.position.y = bob(t, 3, 0.05); b.rotation.z = Math.sin(t * 1.6) * 0.06;
    wings.forEach(W => { W.p.rotation.y = W.base - W.s * 0.3 * burst; }); tps.forEach(tp => tp.scale.setScalar(1 + burst * 0.9)); } };
});
fx(69, "Crown bust: head and shoulders with no body, a visored face, a crystal brow in a frame, a crown of five tall sheet fins and a thruster cone below.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.65;
  const sh = cbox(1.0, 0.3, 0.5, 0.08, M.armor); sh.position.y = Y - 0.1; b.add(sh); const cone = mesh(new T.ConeGeometry(0.3, 0.6, 6), M.gun, 0, Y - 0.55); cone.rotation.x = PI; b.add(cone); const t = thr(0.12); t.position.y = Y - 0.95; b.add(t);
  const head = cbox(0.46, 0.4, 0.42, 0.09, M.dark); head.position.y = Y + 0.3; b.add(head); const vz = visor(0.34); vz.position.set(0, Y + 0.28, 0.22); b.add(vz); const v2 = visor(0.2); v2.position.set(0, Y + 0.2, 0.22); b.add(v2);
  const fr = frame(0.12); fr.position.set(0, Y + 0.5, 0.21); b.add(fr); const e = eye(0.06, 0.16, 0.3); e.position.set(0, Y + 0.5, 0.2); b.add(e);
  for (let i = 0; i < 5; i++) { const ang = (-40 + i * 20) * PI / 180, s = sheet(0.18, 0.7 - Math.abs(i - 2) * 0.1, i % 2 ? M.gun : M.armor); const h = G(); h.position.set(Math.sin(ang) * 0.2, Y + 0.5, -0.12); h.rotation.z = -ang; s.position.y = 0.34; h.add(s); b.add(h); }
  for (const s of [-1, 1]) { const p = sheet(0.4, 0.34, M.gun); p.position.set(s * 0.62, Y + 0.12, 0); p.rotation.set(0, s * 1.2, s * -0.3); b.add(p); }
  return { g, core: Y + 0.5, update(t) { b.position.y = bob(t, 2, 0.03); } };
});
fx(70, "Claw-lifter: a spherical hull with a crystal belly window, two rotor booms, and two big jointed arms ending in three-fingered sheet claws.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.7;
  const hull = sphere(0.4, M.armor, 24); hull.position.y = Y; b.add(hull); const eq = torus(0.405, 0.02, M.glow, 36); eq.rotation.x = PI / 2; eq.position.y = Y; b.add(eq);
  const win = cyl(0.17, 0.17, 0.06, M.dark, 6); win.position.set(0, Y - 0.3, 0.14); win.rotation.x = 0.6; b.add(win); const e = eye(0.07, 0.22, 0.4); e.position.set(0, Y - 0.34, 0.14); b.add(e);
  const vz = visor(0.3); vz.position.set(0, Y + 0.12, 0.38); b.add(vz);
  for (const s of [-1, 1]) { const bm = cbox(0.6, 0.05, 0.06, 0.01, M.gun); bm.position.set(s * 0.5, Y + 0.38, 0); b.add(bm); const rt = rotor(0.22); rt.g.position.set(s * 0.82, Y + 0.42, 0); b.add(rt.g);
    arm(b, V(s * 0.4, Y - 0.05, 0.05), V(s * 0.78, Y - 0.35, 0.3), V(s * 0.6, Y - 0.78, 0.7), 0.055, M.armor);
    for (let i = -1; i <= 1; i++) { const f = sheet(0.07, 0.34, M.steel, false); f.position.set(s * 0.6 + i * 0.1, Y - 0.95, 0.72); f.rotation.z = i * 0.35; f.rotation.x = 0.2; b.add(f); }
    const pm = cyl(0.07, 0.07, 0.16, M.dark, 8); pm.position.set(s * 0.6, Y - 0.78, 0.7); b.add(pm); }
  return { g, core: Y - 0.34, update(t) { b.position.y = bob(t, 1, 0.04); } };
});
fx(71, "Hex-pod: a six-sided hull with a crystal in the middle of its top and six lit side windows, six sheet panels standing in an orbit round it, and six small thrusters.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.4, orb = G(); orb.position.y = Y; b.add(orb);
  const hull = cyl(0.55, 0.5, 0.55, M.armor, 6); hull.position.y = Y; b.add(hull); const top = hexPlate(0.45, 0.08, M.gun); top.position.y = Y + 0.3; b.add(top);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + PI / 6, w = cbox(0.3, 0.2, 0.04, 0.008, M.glow); w.position.set(Math.sin(a) * 0.5, Y + 0.02, Math.cos(a) * 0.5); w.rotation.y = a; b.add(w);
    const t = thr(0.08); t.position.set(Math.sin(a + PI / 6) * 0.38, Y - 0.36, Math.cos(a + PI / 6) * 0.38); b.add(t);
    const p = sheet(0.5, 0.7, i % 2 ? M.armor : M.gun); const h = G(); h.position.set(Math.sin(a - PI / 6) * 0.98, 0, Math.cos(a - PI / 6) * 0.98); h.rotation.y = a - PI / 6 + PI / 2; p.rotation.y = 0; h.add(p); orb.add(h); }
  const e = eye(0.13, 0.36, 0.5); e.position.y = Y + 0.55; b.add(e); const ef = hexRing(0.2, 0.025, M.steel); ef.position.y = Y + 0.38; b.add(ef);
  const an = cyl(0.01, 0.01, 0.4, M.steel, 5); an.position.set(0.2, Y + 0.55, 0); b.add(an);
  return { g, core: Y + 0.55, update(t) { orb.rotation.y = t * 0.5; b.position.y = bob(t, 2, 0.03); } };
});
fx(72, "Pulse-turret bot: a hex base on four stubby legs, a column, a rotating turret whose big barrel houses the crystal as a capacitor lens, armour wedges round it and a spinning sensor.", () => {
  const g = G(), b = G(); g.add(b);
  const base = hexPlate(0.62, 0.14, M.armor); base.position.y = 0.4; b.add(base); const br = hexRing(0.63, 0.02, M.glow); br.position.y = 0.48; b.add(br);
  for (const [x, z] of [[0.5, 0.4], [-0.5, 0.4], [0.5, -0.4], [-0.5, -0.4]]) { const l = cbox(0.16, 0.4, 0.2, 0.04, M.gun); l.position.set(x, 0.2, z); b.add(l); const ft = cbox(0.24, 0.05, 0.3, 0.01, M.dark); ft.position.set(x, 0.03, z); b.add(ft); }
  const col = cyl(0.26, 0.32, 0.5, M.dark, 6); col.position.y = 0.75; b.add(col);
  const tur = G(); tur.position.y = 1.2; b.add(tur); const th = cbox(0.7, 0.42, 0.7, 0.1, M.armor); tur.add(th);
  const hs = cyl(0.2, 0.2, 0.9, M.dark, 6); hs.rotation.x = PI / 2; hs.position.set(0, 0.04, 0.6); tur.add(hs);
  const c = hexCrystal(0.1, 0.8, 0.14, M.crystal); c.rotation.x = PI / 2; c.position.set(0, 0.04, 0.62); tur.add(c); const lm = new T.PointLight(0xffffff, 0.5, 3, 2); lm.color.set(EL.color); lm.position.set(0, 0.3, 0.6); tur.add(lm); LIGHTS.push(lm);
  const mz = new T.Mesh(new T.TorusGeometry(0.2, 0.03, 4, 6), M.glow); mz.position.set(0, 0.04, 1.06); tur.add(mz);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, wd = sheet(0.42, 0.4, i % 2 ? M.gun : M.armor); const h = G(); h.position.set(Math.sin(a) * 0.42, -0.02, Math.cos(a) * 0.42); h.rotation.y = a; wd.rotation.x = -0.35; h.add(wd); tur.add(h); }
  const rad = G(); rad.position.y = 0.4; tur.add(rad); rad.add(cyl(0.03, 0.03, 0.2, M.steel, 6)); const dish = sheet(0.4, 0.25, M.steel); dish.position.y = 0.16; dish.rotation.x = -0.4; rad.add(dish);
  return { g, core: 1.25, update(t) { tur.rotation.y = Math.sin(t * 0.5) * 0.5; rad.rotation.y = t * 1.5; } };
});
