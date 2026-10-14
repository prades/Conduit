// ── ANCIENT RELIC · ANGELIC · SENTINEL, Nos. 73–92 ───────────────────────
// Gold and bronze alongside the dark armour: idols, masks, gates, bells, wings, halos.
M.gold = new T.MeshStandardMaterial({ color: 0x9a7a35, metalness: 1, roughness: 0.34 }); M.gold.envMapIntensity = 0.8;
M.stone = new T.MeshStandardMaterial({ color: 0x3a3a42, metalness: 0.25, roughness: 0.85 });
function haloRing(R, tube, mat) { const m = new T.Mesh(new T.TorusGeometry(R, tube, 8, 40), mat || M.gold); m.rotation.x = PI / 2; return m; }
function wings(parent, pos, specs, mat, edge) {   // specs: [[len, deg], ...] per side
  for (const side of [1, -1]) specs.forEach(([len, deg], i) => { const f = feather(len, 0.11 - i * 0.008, i === 1 ? (mat || M.gold) : (mat || M.armor)); const pv = G(); pv.position.set(side * pos[0], pos[1] - i * 0.1, pos[2] - i * 0.03); pv.rotation.z = (side > 0 ? deg : 180 - deg) * PI / 180; pv.add(f); parent.add(pv); });
}
function mask(w, h, mat) { const g = G(); g.add(plate([[-w * 0.5, h * 0.4], [w * 0.5, h * 0.4], [w * 0.42, -h * 0.2], [0, -h * 0.5], [-w * 0.42, -h * 0.2]], 0.08, 0.02, mat || M.gold));
  for (const s of [-1, 1]) { const e = cbox(w * 0.26, 0.035, 0.03, 0.006, M.glow); e.position.set(s * w * 0.22, h * 0.08, 0.06); e.rotation.z = -s * 0.2; g.add(e); }
  const nose = cbox(0.03, h * 0.45, 0.04, 0.006, M.dark); nose.position.set(0, -h * 0.02, 0.06); g.add(nose); return g; }

fx(73, "Cherub drone.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.45;
  const hull = sphere(0.34, M.armor, 24); hull.position.y = Y; b.add(hull); const eq = torus(0.345, 0.014, M.gold, 32); eq.rotation.x = PI / 2; eq.position.y = Y + 0.04; b.add(eq);
  const fr = frame(0.14); fr.position.set(0, Y - 0.02, 0.31); b.add(fr); const e = eye(0.06, 0.18, 0.3); e.position.set(0, Y - 0.02, 0.28); b.add(e);
  const vz = visor(0.24); vz.position.set(0, Y + 0.18, 0.3); b.add(vz);
  wings(b, [0.28, Y + 0.12, -0.12], [[0.75, 55], [0.6, 20]], M.gold);
  const h = haloRing(0.22, 0.018); h.position.y = Y + 0.56; b.add(h); const t = thr(0.1); t.position.y = Y - 0.42; b.add(t);
  return { g, core: Y, update(t) { b.position.y = bob(t, 0, 0.05); } };
});
fx(74, "Seraph sentinel.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.65;
  const torso = cyl(0.2, 0.14, 0.95, M.armor, 6); torso.position.y = Y; b.add(torso); const fr = frame(0.1); fr.position.set(0, Y + 0.1, 0.18); b.add(fr); const e = eye(0.05, 0.22, 0.3); e.position.set(0, Y + 0.1, 0.16); b.add(e);
  const m = mask(0.28, 0.34, M.gold); m.position.set(0, Y + 0.7, 0.04); b.add(m);
  const ring = new T.Mesh(new T.TorusGeometry(0.42, 0.022, 8, 40), M.gold); ring.position.set(0, Y + 0.7, -0.12); b.add(ring);
  wings(b, [0.14, Y + 0.38, -0.2], [[1.2, 75], [1.05, 38], [0.9, 2]], M.armor); wings(b, [0.14, Y + 0.2, -0.26], [[0.8, -30]], M.gold);
  const h = haloRing(0.34, 0.016, M.glow); h.position.y = Y + 1.1; b.add(h);
  const rob = plate([[-0.18, 0], [0.18, 0], [0.1, -0.7], [0, -0.95], [-0.1, -0.7]], 0.03, 0.006, M.gun); rob.position.y = Y - 0.5; b.add(rob); const t = thr(0.08); t.position.y = Y - 1.5; b.add(t);
  return { g, core: Y + 0.1, update(t) { b.position.y = bob(t, 1, 0.04); h.rotation.z = t; } };
});
fx(75, "Obelisk watcher.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.75, orb = G(); orb.position.y = Y + 0.75; b.add(orb);
  const ob = cyl(0.16, 0.28, 1.5, M.gold, 4); ob.rotation.y = PI / 4; ob.position.y = Y + 0.75; b.add(ob); const tip = mesh(new T.ConeGeometry(0.16, 0.26, 4), M.gold, 0, Y + 1.63); tip.rotation.y = PI / 4; b.add(tip);
  const fr = frame(0.14); fr.position.set(0, Y + 1.0, 0.2); b.add(fr); const e = eye(0.06, 0.2, 0.3); e.position.set(0, Y + 1.0, 0.16); b.add(e);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6, s = cbox(0.34, 0.14, 0.1, 0.02, M.stone); const h = G(); h.position.set(Math.cos(a) * 0.72, (i % 2 ? 0.2 : -0.2), Math.sin(a) * 0.72); h.rotation.y = -a + PI / 2; s.rotation.x = 0.3; h.add(s); orb.add(h); const gl = cbox(0.3, 0.02, 0.02, 0.004, M.glow); gl.position.y = 0.07; s.add(gl); }
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3, t = thr(0.08); t.position.set(Math.sin(a) * 0.28, Y - 0.05, Math.cos(a) * 0.28); b.add(t); }
  const base = hexPlate(0.4, 0.08, M.dark); base.position.y = Y + 0.03; b.add(base);
  return { g, core: Y + 1.0, update(t) { orb.rotation.y = t * 0.6; b.position.y = bob(t, 2, 0.03); } };
});
fx(76, "Gatekeeper arch.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.2;
  for (const s of [-1, 1]) { const p = cbox(0.2, 1.7, 0.22, 0.04, M.gold); p.position.set(s * 0.62, Y + 0.95, 0); b.add(p); const cap = cbox(0.28, 0.1, 0.3, 0.02, M.stone); cap.position.set(s * 0.62, Y + 1.85, 0); b.add(cap);
    const t = thr(0.12); t.position.set(s * 0.62, Y + 0.0, 0); b.add(t); const door = sheet(0.42, 1.4, M.armor); door.position.set(s * 0.3, Y + 0.95, 0.1); door.rotation.y = s * 0.7; b.add(door); }
  const lin = cbox(1.7, 0.22, 0.3, 0.04, M.gold); lin.position.set(0, Y + 1.95, 0); b.add(lin); const sun = cyl(0.2, 0.2, 0.05, M.gold, 20); sun.rotation.x = PI / 2; sun.position.set(0, Y + 2.1, 0.12); b.add(sun); const sr = torus(0.2, 0.018, M.glow, 20); sr.position.set(0, Y + 2.1, 0.15); b.add(sr);
  const e = eye(0.13, 0.46, 0.6); e.position.set(0, Y + 1.05, 0); b.add(e); const hr = hexRing(0.3, 0.025, M.steel); hr.rotation.x = 0; hr.position.set(0, Y + 1.05, 0); b.add(hr); const cb = limb(0.01, M.rubber); setLink(cb, V(0, Y + 1.84, 0), V(0, Y + 1.4, 0)); b.add(cb);
  return { g, core: Y + 1.05, update(t) { b.position.y = 0.12 + bob(t, 0, 0.04); } };
});
fx(77, "Reliquary bearer.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.85;
  const hull = hexPlate(0.55, 0.2, M.armor); hull.position.y = Y; b.add(hull); const hr = hexRing(0.56, 0.02, M.glow); hr.position.y = Y + 0.08; b.add(hr);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + PI / 6, c = Math.cos(a), s = Math.sin(a); leg3(b, V(c * 0.42, Y - 0.05, s * 0.42), V(c * 0.75, Y + 0.12, s * 0.75), V(c * 0.82, 0.02, s * 0.82), 0.035); }
  const tube = new T.Mesh(new T.CylinderGeometry(0.2, 0.2, 0.8, 6), M.glass); tube.position.y = Y + 0.55; b.add(tube); for (const y of [0.15, 0.95]) { const cap = cyl(0.24, 0.24, 0.07, M.gold, 6); cap.position.y = Y + y; b.add(cap); }
  const e = eye(0.11, 0.5, 0.5); e.position.y = Y + 0.55; b.add(e);
  const hd = cbox(0.28, 0.22, 0.26, 0.05, M.dark); hd.position.set(0, Y + 0.18, 0.5); b.add(hd); const vz = visor(0.2); vz.position.set(0, Y + 0.2, 0.64); b.add(vz);
  for (const s of [-1, 1]) { const p = sheet(0.3, 0.5, M.gold); p.position.set(s * 0.45, Y + 0.5, 0); p.rotation.set(0, s * 1.3, s * -0.2); b.add(p); }
  return { g, core: Y + 0.55, update() {} };
});
fx(78, "Lantern drone.", () => {
  const g = G(), b = G(); g.add(b); const Y = 2.3;
  const hub = cyl(0.22, 0.26, 0.2, M.armor, 10); hub.position.y = Y; b.add(hub); const rt = rotor(0.4); rt.g.position.y = Y + 0.18; b.add(rt.g); const vz = visor(0.3); vz.position.set(0, Y, 0.27); b.add(vz);
  const lan = G(); lan.position.y = Y - 1.0; b.add(lan);
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3, p = [V(Math.sin(a) * 0.2, Y - 0.1, Math.cos(a) * 0.2), V(Math.sin(a) * 0.18, Y - 0.6, Math.cos(a) * 0.18)]; const ch = limb(0.012, M.steel); setLink(ch, p[0], p[1]); b.add(ch); }
  for (const y of [0.34, -0.34]) { const cap = cyl(0.22, 0.26, 0.07, M.gold, 6); cap.position.y = y; lan.add(cap); }
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6, rib = cbox(0.03, 0.62, 0.03, 0.006, M.gold); rib.position.set(Math.sin(a) * 0.24, 0, Math.cos(a) * 0.24); lan.add(rib); }
  const e = eye(0.1, 0.4, 0.8); lan.add(e); const ring = hexRing(0.25, 0.02, M.glow); lan.add(ring); const base = cyl(0.04, 0.06, 0.14, M.gold, 8); base.position.y = -0.46; lan.add(base);
  return { g, core: Y - 1.0, update(t) { b.position.y = bob(t, 0, 0.04); rt.fan.rotation.y = t * 22; lan.rotation.z = Math.sin(t * 1.6) * 0.08; } };
});
fx(79, "Six-armed idol.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.2;
  const lap = sheet(0.9, 0.5, M.stone, false); lap.rotation.x = PI / 2; lap.position.y = Y; b.add(lap); const lap2 = hexPlate(0.5, 0.1, M.gold); lap2.position.y = Y - 0.05; b.add(lap2);
  const torso = cbox(0.5, 0.7, 0.34, 0.07, M.armor); torso.position.y = Y + 0.45; b.add(torso); const fr = frame(0.13); fr.position.set(0, Y + 0.5, 0.18); b.add(fr); const e = eye(0.06, 0.2, 0.3); e.position.set(0, Y + 0.5, 0.15); b.add(e);
  const m = mask(0.3, 0.34, M.gold); m.position.set(0, Y + 1.05, 0.05); b.add(m); const jem = hexCrystal(0.04, 0.1, 0.06, M.crystal); jem.position.set(0, Y + 1.2, 0.12); b.add(jem);
  const h = haloRing(0.4, 0.02); h.rotation.x = 0; h.position.set(0, Y + 1.05, -0.14); b.add(h);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const f = feather(0.55 - i * 0.05, 0.05, i === 1 ? M.gold : M.gun); const pv = G(); pv.position.set(s * 0.26, Y + 0.7 - i * 0.18, 0.02); pv.rotation.z = (s > 0 ? 25 - i * 35 : 155 + i * 35) * PI / 180; pv.rotation.y = s * 0.3; pv.add(f); b.add(pv); }
  const t = thr(0.14); t.position.y = Y - 0.35; b.add(t);
  return { g, core: Y + 0.5, update(t) { b.position.y = bob(t, 1, 0.04); } };
});
fx(80, "Winged lancer.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const fus = cyl(0.14, 0.1, 1.3, M.armor, 6); fus.rotation.x = PI / 2; fus.position.set(0, Y, -0.1); b.add(fus);
  const lance = hexCrystal(0.07, 1.0, 0.5, M.crystal); lance.rotation.x = PI / 2; lance.position.set(0, Y, 1.1); b.add(lance); const lm = new T.PointLight(0xffffff, 0.4, 3, 2); lm.color.set(EL.color); lm.position.set(0, Y + 0.2, 1.0); b.add(lm); LIGHTS.push(lm);
  const col = cyl(0.16, 0.16, 0.12, M.gold, 6); col.rotation.x = PI / 2; col.position.set(0, Y, 0.5); b.add(col);
  const cp = cbox(0.18, 0.1, 0.3, 0.03, M.dark); cp.position.set(0, Y + 0.12, 0.1); b.add(cp); const vz = visor(0.12); vz.position.set(0, Y + 0.14, 0.26); b.add(vz);
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++) { const w = feather(1.1 - i * 0.15, 0.13, i === 1 ? M.gold : M.armor); const p = G(); p.position.set(s * 0.14, Y + 0.02, 0.2 - i * 0.25); p.rotation.y = s > 0 ? -0.7 - i * 0.12 : PI + 0.7 + i * 0.12; p.rotation.z = s * 0.1; p.add(w); b.add(p); }
  for (const s of [-1, 1]) { const f = sheet(0.2, 0.4, M.gun); f.position.set(s * 0.1, Y + 0.22, -0.65); f.rotation.z = s * 0.4; b.add(f); }
  const t = thr(0.12); t.rotation.x = PI / 2; t.position.set(0, Y, -0.85); b.add(t);
  return { g, core: Y, update(t) { b.position.y = bob(t, 2, 0.04); b.rotation.z = Math.sin(t * 0.8) * 0.05; } };
});
fx(81, "Armillary sentinel.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5, rings = [];
  const core = sphere(0.22, M.dark, 20); core.position.y = Y; b.add(core); const e = eye(0.1, 0.32, 0.6); e.position.set(0, Y, 0.0); b.add(e);
  [[0.0, 0.8, M.gold], [PI / 2, 0.66, M.armor], [PI / 4, 0.52, M.gold], [-PI / 4, 0.4, M.steel]].forEach(([tilt, R, mat], k) => { const r = new T.Mesh(new T.TorusGeometry(R, 0.03 + (k === 0 ? 0.01 : 0), 6, 48), mat); r.position.y = Y; r.rotation.set(tilt, k * 0.5, 0); b.add(r); rings.push(r);
    for (let i = 0; i < 4; i++) { const a = i * PI / 2, st = hexPlate(0.05, 0.05, M.glow); st.rotation.z = PI / 2; st.position.set(Math.cos(a) * R, Math.sin(a) * R, 0); r.add(st); } });
  const t = thr(0.1); t.position.y = Y - 0.9; b.add(t);
  return { g, core: Y, update(t) { rings.forEach((r, i) => r.rotation.z = t * (0.4 + i * 0.25) * (i % 2 ? -1 : 1)); b.position.y = bob(t, 1, 0.03); } };
});
fx(82, "Chalice drone.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.9;
  const prof = [[0.0, 0.0], [0.08, 0.02], [0.1, 0.2], [0.07, 0.4], [0.2, 0.56], [0.42, 0.78], [0.5, 1.0], [0.46, 1.02], [0.38, 0.8], [0.18, 0.6], [0.0, 0.58]].map(([x, y]) => new T.Vector2(x, y));
  const cup = mesh(new T.LatheGeometry(prof, 6), M.gold, 0, Y); b.add(cup);
  const rim = new T.Mesh(new T.TorusGeometry(0.47, 0.02, 4, 6), M.glow); rim.rotation.x = PI / 2; rim.position.y = Y + 1.0; b.add(rim);
  const e = eye(0.16, 0.6, 0.8); e.position.y = Y + 1.2; b.add(e);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6, s = sheet(0.22, 0.5, M.armor); const h = G(); h.position.set(Math.sin(a) * 0.52, Y + 1.02, Math.cos(a) * 0.52); h.rotation.y = a; s.position.y = 0.2; const pv = G(); pv.add(s); pv.rotation.x = 0.55; h.add(pv); b.add(h); }
  for (const s of [-1, 1]) { const hd = new T.Mesh(new T.TorusGeometry(0.2, 0.025, 6, 20, PI), M.gold); hd.position.set(s * 0.32, Y + 0.65, 0); hd.rotation.z = s > 0 ? -PI / 2 : PI / 2; b.add(hd); }
  const t = thr(0.14); t.position.y = Y - 0.12; b.add(t);
  return { g, core: Y + 1.2, update(t) { b.position.y = bob(t, 0, 0.03); } };
});
fx(83, "Mask guardian.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.6;
  const m = mask(0.9, 1.0, M.gold); m.position.y = Y; b.add(m); const gem = hexCrystal(0.09, 0.22, 0.12, M.crystal); gem.position.set(0, Y + 0.34, 0.08); b.add(gem); const gl = new T.PointLight(0xffffff, 0.4, 3, 2); gl.color.set(EL.color); gl.position.set(0, Y + 0.4, 0.4); b.add(gl); LIGHTS.push(gl);
  for (const s of [-1, 1]) { const ck = sheet(0.3, 0.55, M.armor); ck.position.set(s * 0.5, Y - 0.08, 0.02); ck.rotation.set(0, s * 0.7, s * -0.2); b.add(ck); }
  const bd = plate([[-0.14, 0], [0.14, 0], [0.06, -0.55], [0, -0.7], [-0.06, -0.55]], 0.04, 0.008, M.gun); bd.position.set(0, Y - 0.58, 0.04); b.add(bd);
  for (let i = 0; i < 7; i++) { const ang = (-72 + i * 24) * PI / 180, f = feather(0.95 - Math.abs(i - 3) * 0.06, 0.07, i % 2 ? M.armor : M.gold); const pv = G(); pv.position.set(0, Y + 0.1, -0.12); pv.rotation.z = PI / 2 - ang; pv.add(f); b.add(pv); }
  const t = thr(0.14); t.position.set(0, Y - 1.25, 0); b.add(t);
  return { g, core: Y + 0.34, update(t) { b.position.y = bob(t, 2, 0.04); } };
});
fx(84, "Bell sentinel.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.0;
  const prof = [[0.0, 1.2], [0.1, 1.18], [0.2, 1.1], [0.3, 0.92], [0.38, 0.6], [0.5, 0.25], [0.62, 0.0], [0.58, -0.04], [0.46, 0.2], [0.34, 0.58], [0.26, 0.88], [0.0, 1.0]].map(([x, y]) => new T.Vector2(x, y));
  const bell = mesh(new T.LatheGeometry(prof, 8), M.gold, 0, Y); b.add(bell);
  for (const y of [0.35, 0.7]) { const bd = torus(0.5 - (y - 0.35) * 0.6, 0.014, M.glow, 8); bd.rotation.x = PI / 2; bd.position.y = Y + y; b.add(bd); }
  const e = eye(0.09, 0.4, 0.8); e.position.y = Y + 0.15; b.add(e);
  const h = haloRing(0.3, 0.02); h.position.y = Y + 1.5; b.add(h); const kn = sphere(0.07, M.steel, 10); kn.position.y = Y + 1.24; b.add(kn);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, s = sheet(0.22, 0.8, M.armor); const hh = G(); hh.position.set(Math.sin(a) * 0.5, Y + 0.45, Math.cos(a) * 0.5); hh.rotation.y = a; s.position.y = -0.1; const pv = G(); pv.add(s); pv.rotation.x = 0.3; hh.add(pv); b.add(hh); }
  const t = thr(0.12); t.position.y = Y - 0.15; b.add(t);
  return { g, core: Y + 0.15, update(t) { b.position.y = bob(t, 1, 0.03); h.rotation.z = t; } };
});
fx(85, "Stele turret.", () => {
  const g = G(), b = G(); g.add(b);
  const base = hexPlate(0.6, 0.12, M.armor); base.position.y = 0.15; b.add(base); const br = hexRing(0.61, 0.02, M.glow); br.position.y = 0.22; b.add(br);
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3, t = thr(0.1); t.position.set(Math.sin(a) * 0.45, 0.06, Math.cos(a) * 0.45); b.add(t); }
  const st = cbox(0.9, 1.5, 0.24, 0.05, M.stone); st.position.y = 1.0; b.add(st); const cap = mesh(new T.ConeGeometry(0.5, 0.3, 4), M.gold, 0, 1.9); cap.rotation.y = PI / 4; cap.scale.z = 0.3; b.add(cap);
  for (const x of [-0.32, 0.32]) { const gl = cbox(0.025, 1.1, 0.03, 0.004, M.glow); gl.position.set(x, 0.95, 0.13); b.add(gl); }
  const fr = frame(0.22); fr.position.set(0, 1.25, 0.14); b.add(fr); const e = eye(0.1, 0.34, 0.5); e.position.set(0, 1.25, 0.1); b.add(e);
  for (const s of [-1, 1]) { const w = sheet(0.3, 1.2, M.armor); w.position.set(s * 0.56, 0.95, 0.04); w.rotation.set(0, s * 0.4, s * 0.1); b.add(w); const em = mesh(new T.ConeGeometry(0.05, 0.2, 8), M.steel, s * 0.3, 2.08, 0); b.add(em); }
  return { g, core: 1.25, update() {} };
});
fx(86, "Jackal hound.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.85;
  const body = cbox(0.5, 0.36, 1.0, 0.08, M.armor); body.position.set(0, Y, 0); b.add(body); const fr = frame(0.12); fr.rotation.y = PI / 2; fr.position.set(0.26, Y + 0.02, 0.05); b.add(fr); const e = eye(0.05, 0.18, 0.3); e.position.set(0.24, Y + 0.02, 0.05); b.add(e);
  const nk = cbox(0.26, 0.5, 0.2, 0.05, M.gun); nk.position.set(0, Y + 0.35, 0.5); nk.rotation.x = -0.4; b.add(nk);
  const hd = G(); hd.position.set(0, Y + 0.6, 0.72); b.add(hd); hd.add(cbox(0.24, 0.22, 0.3, 0.05, M.dark)); const sn = plate([[-0.08, 0.06], [0.08, 0.06], [0.05, -0.06], [-0.05, -0.06]], 0.4, 0.01, M.gold); sn.rotation.x = PI / 2; sn.position.z = 0.3; hd.add(sn);
  for (const s of [-1, 1]) { const ear = plate([[-0.06, 0], [0.06, 0], [0, 0.4]], 0.03, 0.006, M.gold); ear.position.set(s * 0.1, 0.12, -0.05); ear.rotation.z = -s * 0.15; hd.add(ear); const ey = cbox(0.06, 0.025, 0.02, 0.004, M.glow); ey.position.set(s * 0.07, 0.04, 0.16); hd.add(ey); }
  const col = torus(0.18, 0.025, M.gold, 18); col.position.set(0, Y + 0.4, 0.55); col.rotation.x = 0.8; b.add(col);
  for (let i = 0; i < 4; i++) { const sx = i % 2 ? -1 : 1, z = i < 2 ? 0.35 : -0.35; leg3(b, V(sx * 0.2, Y - 0.1, z), V(sx * 0.3, Y - 0.3, z - 0.12), V(sx * 0.26, 0.02, z + 0.05), 0.04); }
  for (let i = 0; i < 4; i++) { const t = sheet(0.1, 0.18, i % 2 ? M.gold : M.armor, false); t.rotation.x = PI / 2; t.position.set(0, Y + 0.1 - i * 0.03, -0.62 - i * 0.16); b.add(t); }
  b.rotation.y = -0.4;
  return { g, core: Y, update() {} };
});
fx(87, "Scarab drone.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.1;
  const sh = mesh(new T.SphereGeometry(0.55, 24, 10, 0, TAU, 0, PI / 2), M.gold, 0, Y); sh.scale.set(1, 0.7, 1.25); b.add(sh);
  const open = G(); open.position.y = Y; b.add(open);
  for (const s of [-1, 1]) { const w = mesh(new T.SphereGeometry(0.58, 20, 8, s < 0 ? PI : 0, PI, 0, PI / 2), M.gold); w.scale.set(1, 0.7, 1.25); const pv = G(); pv.position.y = 0.38; pv.rotation.z = s * 0.7; w.position.y = -0.38; pv.add(w); open.add(pv); const ed = new T.Mesh(new T.TorusGeometry(0.58, 0.014, 4, 30, PI), M.glow); ed.rotation.set(PI / 2, 0, s < 0 ? PI / 2 : -PI / 2); ed.scale.set(1, 1.25, 1); ed.position.y = -0.38; pv.add(ed); }
  const disc = cyl(0.34, 0.34, 0.04, M.gun, 20); disc.rotation.x = PI / 2; disc.position.set(0, Y + 0.3, 0.0); b.add(disc); const e = eye(0.12, 0.5, 0.8); e.position.set(0, Y + 0.25, 0.02); b.add(e);
  const hd = plate([[-0.18, 0.1], [0.18, 0.1], [0.12, -0.12], [-0.12, -0.12]], 0.14, 0.03, M.dark); hd.rotation.x = PI / 2; hd.position.set(0, Y + 0.05, 0.75); b.add(hd); for (const s of [-1, 1]) { const hn = mesh(new T.ConeGeometry(0.03, 0.24, 6), M.steel, s * 0.1, Y + 0.12, 0.92); hn.rotation.x = PI / 2 - 0.4; b.add(hn); }
  for (let i = 0; i < 6; i++) { const sx = i % 2 ? -1 : 1, z = 0.3 - Math.floor(i / 2) * 0.3; leg3(b, V(sx * 0.4, Y - 0.05, z), V(sx * 0.7, Y + 0.1, z), V(sx * 0.78, 0.02, z + 0.1), 0.03); }
  return { g, core: Y + 0.3, update(t) { b.position.y = bob(t, 0, 0.03); } };
});
fx(88, "Heron stalker.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.7;
  const body = mesh(new T.SphereGeometry(0.3, 20, 12), M.armor, 0, Y); body.scale.set(0.8, 0.8, 1.2); b.add(body); const fr = frame(0.1); fr.rotation.y = PI / 2; fr.position.set(0.24, Y, 0); b.add(fr); const e = eye(0.05, 0.16, 0.3); e.position.set(0.22, Y, 0); b.add(e);
  for (const s of [-1, 1]) { leg3(b, V(s * 0.12, Y - 0.2, -0.05), V(s * 0.2, Y - 0.7, 0.1), V(s * 0.16, 0.02, 0.0), 0.03); const k = V(s * 0.2, 0.5, 0.18); leg3(b, V(s * 0.16, 0.6, 0.06), k, V(s * 0.16, 0.02, 0.12), 0.025); }
  let prev = V(0, Y + 0.15, 0.3); for (let i = 1; i <= 6; i++) { const t = i / 6, p = V(0, Y + 0.15 + Math.sin(t * 2.0) * 0.55, 0.3 + Math.sin(t * PI) * 0.3 + t * 0.15); const l = limb(0.04 - t * 0.008, i % 2 ? M.armor : M.gold); setLink(l, prev, p); b.add(l); const j = sphere(0.045, M.steel, 8); j.position.copy(p); b.add(j); prev = p; }
  const hd = cbox(0.14, 0.12, 0.2, 0.03, M.dark); hd.position.copy(prev).add(V(0, 0, 0.05)); b.add(hd); const bk = mesh(new T.ConeGeometry(0.045, 0.4, 6), M.glow, 0, 0, 0); bk.rotation.x = PI / 2; bk.position.copy(prev).add(V(0, -0.02, 0.3)); b.add(bk);
  wings(b, [0.28, Y + 0.05, -0.1], [[0.8, -25], [0.65, -50]], M.gold);
  b.rotation.y = -0.5;
  return { g, core: Y, update(t) { b.position.y = bob(t, 0, 0.02); } };
});
fx(89, "Sphinx guard.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.75;
  const body = cbox(0.7, 0.45, 1.2, 0.09, M.armor); body.position.set(0, Y, -0.15); b.add(body); const fr = frame(0.14); fr.rotation.y = PI / 2; fr.position.set(0.36, Y + 0.04, -0.15); b.add(fr); const e = eye(0.06, 0.2, 0.3); e.position.set(0.34, Y + 0.04, -0.15); b.add(e);
  for (const s of [-1, 1]) { const paw = cbox(0.2, 0.18, 0.7, 0.05, M.gold); paw.position.set(s * 0.24, Y - 0.12, 0.65); b.add(paw); const shl = cbox(0.22, 0.34, 0.3, 0.05, M.gun); shl.position.set(s * 0.26, Y + 0.02, 0.3); b.add(shl); }
  const ch = cbox(0.36, 0.5, 0.3, 0.07, M.gun); ch.position.set(0, Y + 0.45, 0.42); ch.rotation.x = -0.15; b.add(ch);
  const m = mask(0.34, 0.4, M.gold); m.position.set(0, Y + 0.85, 0.52); b.add(m); const gem = hexCrystal(0.05, 0.12, 0.07, M.crystal); gem.position.set(0, Y + 1.05, 0.58); b.add(gem); const gl = new T.PointLight(0xffffff, 0.35, 3, 2); gl.color.set(EL.color); gl.position.set(0, Y + 1.1, 0.8); b.add(gl); LIGHTS.push(gl);
  for (const s of [-1, 1]) { const ne = sheet(0.22, 0.6, M.gold); ne.position.set(s * 0.26, Y + 0.7, 0.5); ne.rotation.set(0, s * 0.3, s * -0.2); b.add(ne); }
  wings(b, [0.2, Y + 0.3, -0.35], [[0.9, 65], [0.75, 40]], M.armor);
  for (const [x, z] of [[0.3, 0.2], [-0.3, 0.2], [0.3, -0.6], [-0.3, -0.6]]) { const t = thr(0.1); t.position.set(x, Y - 0.35, z); b.add(t); }
  return { g, core: Y + 0.04, update(t) { b.position.y = 0.05 + bob(t, 1, 0.025); } };
});
fx(90, "Ring drone.", () => {
  // The ring (with its spokes, crystals and thrusters) turns about the hub; it is six-fold, so a turn of 60 degrees loops.
  const g = G(), b = G(), rot = G(), cs = []; g.add(b); b.add(rot); const Y = 1.35;
  const ring = new T.Mesh(new T.TorusGeometry(0.85, 0.1, 8, 6), M.gold); ring.rotation.x = PI / 2; ring.position.y = Y; rot.add(ring); const rg = torus(0.85, 0.02, M.glow, 6); rg.rotation.x = PI / 2; rg.position.y = Y + 0.1; rot.add(rg);
  const hub = cyl(0.24, 0.28, 0.2, M.armor, 6); hub.position.y = Y; b.add(hub); const vz = visor(0.26); vz.position.set(0, Y + 0.02, 0.28); b.add(vz); const e = eye(0.12, 0.36, 0.6); e.position.y = Y + 0.3; b.add(e);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6, sp = cbox(0.56, 0.03, 0.05, 0.008, M.gun); sp.position.set(Math.sin(a) * 0.55, Y, Math.cos(a) * 0.55); sp.rotation.y = a - PI / 2; rot.add(sp); const c = hexCrystal(0.055, 0.2, 0.1, M.crystal); c.position.set(Math.sin(a) * 0.85, Y + 0.25, Math.cos(a) * 0.85); rot.add(c); cs.push(c); const t = thr(0.07); t.position.set(Math.sin(a) * 0.85, Y - 0.1, Math.cos(a) * 0.85); rot.add(t); }
  return { g, core: Y + 0.3, update(t, act) { b.position.y = bob(t, 2, 0.03); rot.rotation.y = t * 1.6 / 6; for (const c of cs) c.scale.setScalar(1 + 0.6 * (act || 0)); } };
});
fx(91, "Hand of protection.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.35;
  const palm = cbox(0.55, 0.6, 0.14, 0.04, M.gold); palm.position.y = Y; b.add(palm); const fr = new T.Mesh(new T.TorusGeometry(0.2, 0.03, 4, 6), M.steel); fr.position.set(0, Y, 0.09); b.add(fr); const e = eye(0.09, 0.3, 0.5); e.position.set(0, Y, 0.1); b.add(e);
  for (let i = 0; i < 4; i++) { const x = -0.2 + i * 0.133, len = [0.45, 0.58, 0.55, 0.42][i], lean = (i - 1.5) * 0.14; const f1 = sheet(0.1, len, i % 2 ? M.armor : M.gun, false); f1.position.set(x + lean * 0.2, Y + 0.3 + len / 2, 0); f1.rotation.z = -lean; b.add(f1); const tip = mesh(new T.ConeGeometry(0.05, 0.12, 4), M.glow, x + lean * len * 0.9, Y + 0.3 + len + 0.04, 0); b.add(tip); }
  const th = sheet(0.1, 0.4, M.gun, false); th.position.set(0.36, Y + 0.08, 0); th.rotation.z = -1.0; b.add(th);
  const wr = cyl(0.16, 0.2, 0.18, M.armor, 6); wr.position.y = Y - 0.4; b.add(wr); const t = thr(0.12); t.position.y = Y - 0.62; b.add(t);
  const h = haloRing(0.4, 0.016, M.glow); h.rotation.x = 0; h.position.set(0, Y + 0.45, -0.15); b.add(h);
  return { g, core: Y, update(t) { b.position.y = bob(t, 0, 0.04); } };
});
fx(92, "Totem bot.", () => {
  const g = G(), b = G(); g.add(b);
  const base = hexPlate(0.5, 0.12, M.armor); base.position.y = 0.2; b.add(base); for (let i = 0; i < 3; i++) { const a = i * TAU / 3, t = thr(0.09); t.position.set(Math.sin(a) * 0.38, 0.1, Math.cos(a) * 0.38); b.add(t); }
  for (let i = 0; i < 3; i++) { const w = 0.56 - i * 0.1, y = 0.65 + i * 0.55; const hd = cbox(w, 0.46, w * 0.7, 0.07, i % 2 ? M.gold : M.armor); hd.position.y = y; hd.rotation.y = (i - 1) * 0.35; b.add(hd);
    const vz = visor(w * 0.6); vz.position.set(Math.sin((i - 1) * 0.35) * w * 0.36, y + 0.06, Math.cos((i - 1) * 0.35) * w * 0.36 + 0.0); vz.rotation.y = (i - 1) * 0.35; b.add(vz); }
  wings(b, [0.3, 1.2, -0.05], [[0.8, 50], [0.65, 15]], M.armor);
  const crown = cyl(0.2, 0.26, 0.12, M.gold, 6); crown.position.y = 2.0; b.add(crown); const e = eye(0.12, 0.4, 0.7); e.position.y = 2.35; b.add(e);
  const h = haloRing(0.3, 0.016, M.glow); h.position.y = 2.55; b.add(h);
  return { g, core: 2.35, update(t) { h.rotation.z = t; } };
});
