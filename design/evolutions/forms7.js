// ── SHIELDS AND PLATING · the core sniper, Nos. 116–125 ───────────────────
// Core's trade is shields: armour plate, kite and tower shields, bucklers, shells. Each of these is a sniper behind
// its own plating: a barrel or lance through a slit, a crystal lens as the scope, the hex crystal built in.
function kitePlate(w, h, d, mat) { return plate([[-w / 2, h / 2], [w / 2, h / 2], [w / 2, h * 0.05], [0, -h / 2], [-w / 2, h * 0.05]], d, 0.012, mat || M.armor); }
function hexShield(R, d, mat) { const pts = []; for (let i = 0; i < 6; i++) { const a = PI / 6 + i * PI / 3; pts.push([Math.cos(a) * R, Math.sin(a) * R]); } return plate(pts, d, 0.012, mat || M.armor); }
function hexTrim(R, mat) { const t = new T.Mesh(new T.TorusGeometry(R, 0.012, 4, 6), mat || M.glow); t.rotation.z = PI / 6; return t; }   // a glowing hex outline facing +z
function barrel(len, r) {   // a long barrel along +z from the origin, glowing muzzle ring, a crystal lens near the end
  const g = G(), t = cyl(r, r * 1.2, len, M.gun, 12); t.rotation.x = PI / 2; t.position.z = len / 2; g.add(t);
  const mz = cyl(r * 1.6, r * 1.6, 0.1, M.dark, 12); mz.rotation.x = PI / 2; mz.position.z = len; g.add(mz);
  const ring = new T.Mesh(new T.TorusGeometry(r * 1.6, 0.01, 4, 12), M.glow); ring.position.z = len - 0.04; g.add(ring);
  const lens = hexCrystal(r * 1.1, len * 0.18, r * 1.2, M.crystal); lens.rotation.x = PI / 2; lens.position.z = len * 0.5; g.add(lens);
  return g;
}
const _light = (b, y, z) => { const L = new T.PointLight(0xffffff, 0.15, 3.5, 2); L.color.set(EL.color); L.position.set(0, y, z); b.add(L); LIGHTS.push(L); };

fx(116, "Bastion lancer.", () => {   // a hover hull behind a big kite shield, a lance through the slit
  const g = G(), b = G(); g.add(b); const Y = 1.2;
  const hull = cbox(0.55, 0.6, 0.8, 0.07, M.armor); hull.position.y = Y; b.add(hull);
  const sh = kitePlate(0.95, 1.25, 0.07, M.gun); sh.position.set(0, Y - 0.02, 0.5); sh.rotation.x = -0.12; b.add(sh);
  const slit = cbox(0.34, 0.05, 0.1, 0.01, M.dark); slit.position.set(0, Y + 0.22, 0.52); b.add(slit);
  const trim = cbox(0.88, 0.02, 0.09, 0.004, M.glow); trim.position.set(0, Y + 0.6, 0.5); b.add(trim);
  const br = barrel(1.1, 0.045); br.position.set(0, Y + 0.22, 0.2); b.add(br);
  for (const s of [-1, 1]) { const p = hexShield(0.2, 0.06, M.armor); p.position.set(s * 0.5, Y + 0.1, 0.0); p.rotation.y = s * 0.7; b.add(p); }
  const cr = eye(0.11, 0.32, 0.5); cr.position.set(0, Y + 0.5, -0.1); b.add(cr);
  for (const s of [-1, 1]) { const t = thr(0.09); t.position.set(s * 0.2, Y - 0.42, -0.1); b.add(t); }
  _light(b, Y + 0.6, 0.8);
  return { g, core: Y + 0.5, update(t) { b.position.y = bob(t, 0, 0.035); } };
});
fx(117, "Aegis eye.", () => {   // a hex shield disc with the crystal as its lens, a barrel through the middle, bucklers orbiting
  const g = G(), b = G(), orb = G(); g.add(b); const Y = 1.3;
  const disc = hexShield(0.72, 0.09, M.armor); disc.position.set(0, Y, 0.1); b.add(disc); const tm = hexTrim(0.62); tm.position.set(0, Y, 0.16); b.add(tm); const tm2 = hexTrim(0.36); tm2.position.set(0, Y, 0.16); b.add(tm2);
  const back = cbox(0.4, 0.4, 0.4, 0.06, M.dark); back.position.set(0, Y, -0.16); b.add(back);
  const lens = hexCrystal(0.13, 0.28, 0.2, M.crystal); lens.rotation.x = PI / 2; lens.position.set(0, Y, 0.3); b.add(lens); const gs = glowSprite(0.8); gs.position.set(0, Y, 0.3); b.add(gs);
  const br = barrel(1.0, 0.04); br.position.set(0, Y, 0.35); b.add(br);
  orb.position.set(0, Y, 0.1); b.add(orb); for (let i = 0; i < 6; i++) { const a = i * TAU / 6, p = hexShield(0.17, 0.05, i % 2 ? M.gun : M.armor); const h = G(); h.position.set(Math.sin(a) * 0.95, Math.cos(a) * 0.95, 0); h.add(p); orb.add(h); }
  const t = thr(0.1); t.position.y = Y - 0.85; b.add(t);
  _light(b, Y, 0.9);
  return { g, core: Y, update(t) { b.position.y = bob(t, 0, 0.03); orb.rotation.z = t * 1.6 / 6; } };
});
fx(118, "Tower-shield sentinel.", () => {   // a tall slab with a slit window, the barrel out of it, two shield blades beside it
  const g = G(), b = G(), orb = G(); g.add(b); const Y = 0.95;
  const slab = cbox(0.6, 1.8, 0.22, 0.07, M.armor); slab.position.y = Y + 0.3; b.add(slab);
  for (let i = 0; i < 4; i++) { const st = cbox(0.64 - i * 0.02, 0.05, 0.26, 0.01, i % 2 ? M.gun : M.steel); st.position.y = Y - 0.35 + i * 0.5; b.add(st); }
  const cap = hexPlate(0.34, 0.1, M.gold); cap.position.y = Y + 1.25; b.add(cap); const pk = hexCrystal(0.11, 0.32, 0.3, M.crystal); pk.position.y = Y + 1.55; b.add(pk); const gs = glowSprite(0.7); gs.position.y = Y + 1.55; b.add(gs);
  const slit = cbox(0.34, 0.06, 0.1, 0.01, M.glow); slit.position.set(0, Y + 0.7, 0.12); b.add(slit);
  const br = barrel(1.0, 0.04); br.position.set(0, Y + 0.7, 0.1); b.add(br);
  orb.position.y = Y + 0.4; b.add(orb); for (let i = 0; i < 2; i++) { const a = i * PI, p = kitePlate(0.34, 0.9, 0.05, M.gun), h = G(); h.position.set(Math.sin(a) * 0.62, 0, Math.cos(a) * 0.62); h.rotation.y = a; h.add(p); orb.add(h); }
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3, t = thr(0.08); t.position.set(Math.sin(a) * 0.2, Y - 0.62, Math.cos(a) * 0.2); b.add(t); }
  _light(b, Y + 1.5, 0.6);
  return { g, core: Y + 1.55, update(t) { b.position.y = bob(t, 0, 0.03); orb.rotation.y = t * 1.6; } };
});
fx(119, "Scutum turtle.", () => {   // a dome of overlapping scale plates, a crystal periscope-rifle rising from the top
  const g = G(), b = G(); g.add(b); const Y = 0.95;
  const core = new T.Mesh(new T.SphereGeometry(0.46, 20, 10, 0, TAU, 0, PI / 2), M.dark); core.position.y = Y; core.scale.y = 0.8; b.add(core);
  for (let ring = 0; ring < 4; ring++) { const polar = 0.28 + ring * 0.34, n = 5 + ring * 3, rad = 0.5; for (let i = 0; i < n; i++) { const az = i * TAU / n + ring * 0.3;
    scaleOn(b, V(Math.sin(polar) * Math.sin(az) * rad, Y + Math.cos(polar) * rad * 0.8, Math.sin(polar) * Math.cos(az) * rad), 0.3 - ring * 0.02, 0.24, 0.35, (i + ring) % 3 ? M.armor : M.gun); } }
  const rim = hexRing(0.62, 0.035, M.steel); rim.position.y = Y; b.add(rim);
  const pivot = G(); pivot.position.set(0, Y + 0.42, 0); pivot.rotation.x = -0.25; b.add(pivot); const br = barrel(0.95, 0.04); pivot.add(br);
  const sc = hexCrystal(0.07, 0.2, 0.15, M.crystal); sc.position.set(0, 0.1, 0.3); pivot.add(sc); const gs = glowSprite(0.5); gs.position.set(0, Y + 0.55, 0.3); b.add(gs);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, t = thr(0.07); t.position.set(Math.sin(a) * 0.4, Y - 0.12, Math.cos(a) * 0.4); b.add(t); }
  _light(b, Y + 0.7, 0.7);
  return { g, core: Y + 0.5, update(t) { b.position.y = bob(t, 0, 0.025); pivot.rotation.x = -0.25 + 0.04 * Math.sin(t * 1.6); } };
});
fx(120, "Petal aegis.", () => {   // an angelic rosette of six plate-petals round a crystal, a halo above, a needle through the front
  const g = G(), b = G(), rose = G(); g.add(b); const Y = 1.3;
  const cr = hexCrystal(0.17, 0.6, 0.4, M.crystal); cr.position.y = Y; b.add(cr); const gs = glowSprite(1.1); gs.position.y = Y; b.add(gs);
  rose.position.y = Y; b.add(rose); for (let i = 0; i < 6; i++) { const a = i * TAU / 6, pl = G(); pl.rotation.y = a; const f = kitePlate(0.34, 0.95, 0.04, i % 2 ? M.gun : M.armor); f.position.set(0, 0, 0.55); f.rotation.x = -0.28; f.rotation.z = PI; pl.add(f); const tm = hexTrim(0.12); tm.position.set(0, -0.08, 0.6); tm.rotation.x = -0.28; pl.add(tm); rose.add(pl); }
  const nd = barrel(1.2, 0.03); nd.position.set(0, Y, 0.2); b.add(nd);
  const h = new T.Mesh(new T.TorusGeometry(0.34, 0.016, 8, 40), M.gold); h.rotation.x = PI / 2; h.position.y = Y + 0.78; b.add(h);
  const t = thr(0.1); t.position.y = Y - 0.55; b.add(t);
  _light(b, Y, 0.8);
  return { g, core: Y, update(t) { b.position.y = bob(t, 0, 0.03); rose.rotation.y = t * 1.6 / 6; h.rotation.z = t; } };
});
fx(121, "Reliquary shield.", () => {   // an ancient gold round shield on a floating stand, a crystal boss, the barrel from the boss
  const g = G(), b = G(); g.add(b); const Y = 1.25;
  const sh = cyl(0.7, 0.7, 0.09, M.gold, 6); sh.rotation.x = PI / 2; sh.position.set(0, Y, 0.1); b.add(sh);
  for (const r of [0.55, 0.38]) { const rg = new T.Mesh(new T.TorusGeometry(r, 0.018, 4, 6), M.dark); rg.rotation.z = PI / 6; rg.position.set(0, Y, 0.16); b.add(rg); }
  const boss = hexCrystal(0.13, 0.22, 0.18, M.crystal); boss.rotation.x = PI / 2; boss.position.set(0, Y, 0.3); b.add(boss); const gs = glowSprite(0.8); gs.position.set(0, Y, 0.35); b.add(gs);
  const br = barrel(1.0, 0.04); br.position.set(0, Y, 0.38); b.add(br);
  const stand = cbox(0.3, 0.7, 0.2, 0.05, M.armor); stand.position.set(0, Y - 0.2, -0.15); b.add(stand);
  for (const s of [-1, 1]) { const w = plate([[0, 0], [0.5, 0.1], [0.62, 0.5], [0.3, 0.38], [0.05, 0.3]], 0.03, 0.006, M.gold); w.position.set(s * 0.38, Y + 0.38, -0.2); if (s < 0) w.scale.x = -1; w.rotation.y = s * 0.5; b.add(w); }
  const t = thr(0.1); t.position.set(0, Y - 0.62, -0.15); b.add(t);
  _light(b, Y, 0.9);
  return { g, core: Y, update(t) { b.position.y = bob(t, 0, 0.03); } };
});
fx(122, "Pavise walker.", () => {   // a four-legged walker behind a wall of plate, the barrel over the top of it
  const g = G(), b = G(); g.add(b); const Y = 0.85;
  const body = cbox(0.55, 0.36, 0.9, 0.07, M.armor); body.position.y = Y; b.add(body);
  const wall = plate([[-0.55, 0], [0.55, 0], [0.55, 0.55], [0.35, 0.85], [-0.35, 0.85], [-0.55, 0.55]], 0.08, 0.012, M.gun); wall.position.set(0, Y - 0.15, 0.62); b.add(wall);
  const tm = new T.Mesh(new T.TorusGeometry(0.3, 0.012, 4, 6), M.glow); tm.position.set(0, Y + 0.22, 0.67); tm.rotation.z = PI / 6; b.add(tm);
  for (const s of [-1, 1]) { const sk = plate([[0, 0], [0.55, 0], [0.45, 0.3], [0, 0.34]], 0.04, 0.008, M.armor); sk.position.set(s * 0.3, Y - 0.12, 0.05); sk.rotation.y = s * PI / 2; b.add(sk); }
  const br = barrel(1.15, 0.045); br.position.set(0, Y + 0.45, 0.3); b.add(br);
  const mount = cbox(0.2, 0.3, 0.2, 0.04, M.dark); mount.position.set(0, Y + 0.28, 0.2); b.add(mount);
  const sc = eye(0.09, 0.22, 0.4); sc.position.set(0, Y + 0.6, 0.0); b.add(sc);
  for (let i = 0; i < 4; i++) { const sx = i % 2 ? -1 : 1, z = i < 2 ? 0.35 : -0.35; leg3(b, V(sx * 0.22, Y - 0.1, z), V(sx * 0.36, Y - 0.3, z - 0.1), V(sx * 0.3, 0.02, z + 0.06), 0.04); }
  _light(b, Y + 0.7, 0.6);
  return { g, core: Y + 0.5, update() {} };
});
fx(123, "Barrier needle.", () => {   // a long crystal needle floating level, three curved plates orbiting it as a barrier
  const g = G(), b = G(), orb = G(); g.add(b); const Y = 1.35;
  const nd = G(); nd.position.set(0, Y, 0); b.add(nd); const need = hexCrystal(0.13, 1.1, 0.4, M.crystal); need.rotation.x = PI / 2; need.position.z = 0.1; nd.add(need); const gs = glowSprite(1.0); nd.add(gs);
  const rear = cbox(0.26, 0.26, 0.4, 0.05, M.dark); rear.position.z = -0.6; nd.add(rear); for (const s of [-1, 1]) { const t = thr(0.07); t.position.set(s * 0.1, -0.1, -0.7); nd.add(t); }
  const col = hexRing(0.2, 0.03, M.steel); col.rotation.x = 0; col.rotation.set(PI / 2 * 0, 0, 0); col.position.z = 0.3; nd.add(col);
  orb.position.y = Y; b.add(orb); const mat = M.armor.clone(); mat.side = T.DoubleSide;
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3, m = new T.Mesh(new T.SphereGeometry(0.62, 14, 8, a - 0.55, 1.1, 0.9, 1.35), i % 2 ? M.gun : mat); orb.add(m);
    const ed = new T.Mesh(new T.SphereGeometry(0.622, 14, 1, a - 0.55, 1.1, 0.9, 0.025), M.glow); orb.add(ed); }
  _light(b, Y, 0.9);
  return { g, core: Y, update(t) { b.position.y = bob(t, 0, 0.03); orb.rotation.y = t * 1.6; orb.rotation.z = 0.35; } };
});
fx(124, "Cuirass sentinel.", () => {   // a hovering plated bust: breastplate and crystal chest, pauldron shields, a visored helm, a rifle arm
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const ch = kitePlate(0.62, 0.9, 0.2, M.armor); ch.position.y = Y; b.add(ch); const fr = frame(0.14); fr.position.set(0, Y + 0.1, 0.12); b.add(fr); const e = eye(0.06, 0.18, 0.4); e.position.set(0, Y + 0.1, 0.1); b.add(e);
  const hd = cbox(0.3, 0.28, 0.3, 0.06, M.dark); hd.position.set(0, Y + 0.65, 0); b.add(hd); const vz = visor(0.24); vz.position.set(0, Y + 0.68, 0.16); b.add(vz); const pk = hexCrystal(0.04, 0.2, 0.12, M.crystal); pk.position.set(0, Y + 0.94, -0.02); b.add(pk);
  for (const s of [-1, 1]) { const pd = hexShield(0.28, 0.07, s > 0 ? M.gun : M.armor); pd.position.set(s * 0.52, Y + 0.38, -0.02); pd.rotation.y = s * 0.5; pd.rotation.x = -0.2; b.add(pd); const tm = hexTrim(0.24); tm.position.copy(pd.position); tm.rotation.copy(pd.rotation); tm.translateZ(0.045); b.add(tm); }
  const ra = cbox(0.14, 0.14, 0.5, 0.03, M.armor); ra.position.set(0.4, Y + 0.0, 0.15); b.add(ra); const br = barrel(1.05, 0.04); br.position.set(0.4, Y, 0.35); b.add(br);
  const skirt = plate([[-0.3, 0], [0.3, 0], [0.1, -0.7], [0, -0.95], [-0.1, -0.7]], 0.12, 0.01, M.gun); skirt.position.y = Y - 0.45; b.add(skirt); const t = thr(0.09); t.position.y = Y - 1.5; b.add(t);
  _light(b, Y + 0.3, 0.8);
  return { g, core: Y + 0.1, update(t) { b.position.y = bob(t, 0, 0.04); } };
});
fx(125, "Hex bunker beetle.", () => {   // a low stepped hex bunker with a slit, a rifle and scope in it, small crawler feet
  const g = G(), b = G(); g.add(b); const Y = 0.55;
  [[0.78, 0.2, M.armor], [0.62, 0.2, M.gun], [0.44, 0.18, M.armor]].forEach(([R, h, m], i) => { const p = hexPlate(R, h, m); p.position.y = Y + i * 0.2; b.add(p); const tr = new T.Mesh(new T.TorusGeometry(R * 0.98, 0.012, 4, 6), M.glow); tr.rotation.x = PI / 2; tr.position.y = Y + i * 0.2 + h / 2; b.add(tr); });
  const cap = hexPlate(0.24, 0.1, M.gold); cap.position.y = Y + 0.68; b.add(cap); const pk = hexCrystal(0.09, 0.26, 0.22, M.crystal); pk.position.y = Y + 0.95; b.add(pk); const gs = glowSprite(0.7); gs.position.y = Y + 0.95; b.add(gs);
  const slit = cbox(0.36, 0.07, 0.1, 0.01, M.glow); slit.position.set(0, Y + 0.35, 0.5); b.add(slit);
  const br = barrel(1.0, 0.045); br.position.set(0, Y + 0.35, 0.3); b.add(br);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + PI / 6, ft = cbox(0.2, 0.12, 0.2, 0.03, M.dark); ft.position.set(Math.sin(a) * 0.68, 0.14, Math.cos(a) * 0.68); ft.rotation.y = a; b.add(ft); }
  _light(b, Y + 1.0, 0.6);
  return { g, core: Y + 0.5, update(t) { b.position.y = bob(t, 0, 0.012); } };
});
