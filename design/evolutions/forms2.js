// ── CRYSTAL-ANATOMY DESIGNS, Nos. 33–52 ─────────────────────────────────
// The crystal is a six-sided hex prism with pointed ends and is part of the body.
// The metal comes as thin SHEETS: orbiting, hinged open, or shingled into plating.
// The crystal reads as the element colour with its six facets showing, not as a white blob.
M.crystal.emissiveIntensity = 0.32; M.crystal.roughness = 0.25; M.crystal.metalness = 0.05; M.sprite.opacity = 0.4;
const _edgeMat = new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.55 });
function hexCrystal(r, h, tip, mat) {
  const g = G(); mat = mat || M.crystal; const edges = mat === M.crystal;
  const part = (geo, y, rx) => { const m = new T.Mesh(geo, mat); m.position.y = y; if (rx) m.rotation.x = rx; g.add(m);
    if (edges) { const e = new T.LineSegments(new T.EdgesGeometry(geo), _edgeMat); e.position.y = y; if (rx) e.rotation.x = rx; g.add(e); } };
  part(new T.CylinderGeometry(r, r, h, 6, 1), 0);
  part(new T.ConeGeometry(r, tip, 6), h / 2 + tip / 2);
  part(new T.ConeGeometry(r, tip * 0.7, 6), -h / 2 - tip * 0.35, PI);
  return g;
}
function crystalCore(r, h, tip, lamp) {
  const g = G(); g.add(hexCrystal(r, h, tip, M.crystal));
  g.add(hexCrystal(r * 0.45, h * 0.9, tip * 0.6, M.glow));
  g.add(glowSprite((r + h * 0.5) * 2.4));
  const L = new T.PointLight(0xffffff, lamp == null ? 0.5 : lamp * 0.25, 4.5, 2); L.position.set(0, 0, 0.9); L.color.set(EL.color); g.add(L); LIGHTS.push(L);
  return g;
}
// A sheet of metal: a thin chamfered plate with a lit edge on its top.
function sheet(w, h, mat, edge) {
  const g = G(); g.add(cbox(w, h, 0.03, 0.009, mat || M.armor));
  if (edge !== false) { const e = cbox(w * 0.94, 0.014, 0.036, 0.003, M.glow); e.position.y = h / 2 - 0.004; g.add(e); }
  return g;
}
// A pointed blade/feather sheet extending along +x.
function feather(len, w, mat) {
  const g = G(); g.add(plate([[0, w * 0.7], [len * 0.82, w], [len, 0], [len * 0.82, -w], [0, -w * 0.7]], 0.03, 0.006, mat || M.armor));
  const e = cbox(len * 0.8, 0.012, 0.034, 0.002, M.glow); e.position.set(len * 0.45, w * 0.9, 0); g.add(e); return g;
}
function hexPlate(R, t, mat) { return new T.Mesh(new T.CylinderGeometry(R, R, t || 0.04, 6), mat || M.armor); }
function hexRing(R, tube, mat) { const m = new T.Mesh(new T.TorusGeometry(R, tube, 4, 6), mat || M.steel); m.rotation.x = PI / 2; return m; }
// Place a sheet on a sphere (outward-facing), tilted so its lower edge lifts away, like a scale.
function scaleOn(parent, p, w, h, tilt, mat) {
  const s = sheet(w, h, mat, false); const holder = G(); holder.position.copy(p); holder.lookAt(p.clone().multiplyScalar(2)); holder.add(s); s.rotation.x = -tilt; s.position.y = h * 0.1; parent.add(holder); return holder;
}
const FORMS2 = {};
function f2(no, desc, build) { FORMS2[no] = { no, desc, build }; }
const aroundY = (n, i, off) => (i * TAU / n) + (off || 0);

f2(33, "A tall hex crystal torso with six armour sheets hinged along its six faces, standing half open like petals.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5, spin = [];
  const c0 = crystalCore(0.34, 0.9, 0.42); c0.position.y = Y; b.add(c0);
  const base = hexPlate(0.5, 0.06, M.dark); base.position.y = Y - 0.82; b.add(base); const br = hexRing(0.5, 0.02, M.glow); br.position.y = Y - 0.78; b.add(br);
  for (let i = 0; i < 6; i++) { const a = aroundY(6, i, PI / 6), h = G(); h.position.set(Math.sin(a) * 0.36, Y - 0.5, Math.cos(a) * 0.36); h.rotation.y = a; b.add(h);
    const s = sheet(0.4, 1.2, i % 2 ? M.armor : M.gun); s.position.y = 0.6; const piv = G(); piv.add(s); piv.rotation.x = 0.55 + (i % 2) * 0.25; h.add(piv); }
  return { g, core: Y, update(t) { b.position.y = bob(t, 0, 0.04); } };
});
f2(34, "An egg-shaped body shingled in overlapping sheets, row on row like a pangolin, with a hex crystal growing out of its back.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.15;
  const core = mesh(new T.SphereGeometry(0.5, 24, 14), M.dark, 0, Y); core.scale.set(1, 1.1, 1.25); b.add(core);
  for (let r = 0; r < 6; r++) { const lat = 0.28 + r * 0.46, n = Math.max(3, Math.round(11 * Math.sin(lat)));
    for (let i = 0; i < n; i++) { const a = aroundY(n, i, r * 0.4), p = new T.Vector3(Math.sin(lat) * Math.cos(a) * 0.52, Math.cos(lat) * 0.58, Math.sin(lat) * Math.sin(a) * 0.65);
      const h = scaleOn(b, p.clone().add(V(0, Y, 0)), 0.27, 0.3, 0.5, r % 2 ? M.armor : M.gun); h.position.copy(p).add(V(0, Y, 0)); } }
  const c = crystalCore(0.17, 0.5, 0.3); c.position.set(0, Y + 0.7, 0); b.add(c);
  for (const s of [-1, 1]) { const c2 = crystalCore(0.08, 0.26, 0.16, 1); c2.position.set(s * 0.3, Y + 0.55, -0.2); c2.rotation.z = -s * 0.5; b.add(c2); }
  const eye = hexRing(0.12, 0.02, M.glow); eye.rotation.x = 0; eye.position.set(0, Y + 0.1, 0.72); b.add(eye);
  return { g, core: Y, update(t) { b.position.y = bob(t, 1, 0.04); } };
});
f2(35, "A hex pillar crystal with six big sheets circling it on tilted orbits, like a gyroscope slowly coming apart.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5, orb = G(); orb.position.y = Y; b.add(orb);
  const c = crystalCore(0.22, 1.0, 0.45); c.position.y = Y; b.add(c);
  for (let i = 0; i < 6; i++) { const a = aroundY(6, i), h = G(); h.position.set(Math.cos(a) * 0.82, (i % 3 - 1) * 0.42, Math.sin(a) * 0.82); h.rotation.y = -a; orb.add(h);
    const s = sheet(0.6, 0.26, i % 2 ? M.armor : M.steel); s.rotation.y = PI / 2; s.rotation.x = ((i % 2) ? 1 : -1) * 0.5; h.add(s); }
  for (const y of [-0.85, 0.85]) { const r = hexRing(0.26, 0.025, M.glow); r.position.y = Y + y; b.add(r); }
  return { g, core: Y, update(t) { orb.rotation.y = t * 0.5; b.position.y = bob(t, 0, 0.04); } };
});
f2(36, "A crystal that is the whole body, lying along its length like a fish, with a ridge of upright sheets down its back and two long fin sheets.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.4;
  const c = crystalCore(0.26, 1.2, 0.5); c.rotation.z = PI / 2; c.position.y = Y; b.add(c);
  for (let i = 0; i < 7; i++) { const s = sheet(0.24 - i * 0.015, 0.4 - i * 0.03, i % 2 ? M.armor : M.gun); s.rotation.y = PI / 2; s.position.set(0.62 - i * 0.2, Y + 0.34 + (6 - i) * 0.01, 0); s.rotation.z = 0.15; b.add(s); }
  for (const sz of [-1, 1]) { const f = feather(0.9, 0.17, M.armor); f.position.set(0.1, Y - 0.05, sz * 0.26); f.rotation.set(0, sz * 2.3, sz * -0.3); b.add(f); }
  const belly = sheet(1.0, 0.3, M.dark, false); belly.rotation.x = PI / 2; belly.position.set(0, Y - 0.27, 0); b.add(belly);
  b.scale.setScalar(1.5); b.position.y = -0.55;
  return { g, core: Y, update(t) { b.position.y = -0.55 + bob(t, 2, 0.04); } };
});
f2(37, "A floating hex crystal with a collar of six long pointed sheets hanging under it like a skirt, splayed and slightly twisted.", () => {
  const g = G(), b = G(); g.add(b); const Y = 2.0;
  const c = crystalCore(0.26, 0.7, 0.4); c.position.y = Y; b.add(c);
  const col = hexPlate(0.34, 0.08, M.gun); col.position.y = Y - 0.5; b.add(col); const cr = hexRing(0.34, 0.025, M.glow); cr.position.y = Y - 0.46; b.add(cr);
  for (let i = 0; i < 6; i++) { const a = aroundY(6, i), h = G(); h.position.set(Math.sin(a) * 0.32, Y - 0.52, Math.cos(a) * 0.32); h.rotation.y = a + 0.25; b.add(h);
    const p = plate([[-0.14, 0], [0.14, 0], [0.09, -0.9], [0, -1.15], [-0.09, -0.9]], 0.03, 0.007, i % 2 ? M.armor : M.gun); const piv = G(); piv.add(p); piv.rotation.x = -0.28; h.add(piv);
    const e = cbox(0.012, 0.9, 0.034, 0.002, M.glow); e.position.set(0, -0.5, 0.0); piv.add(e); }
  return { g, core: Y, update(t) { b.position.y = bob(t, 1, 0.05); } };
});
f2(38, "An angelic fan: a hex crystal body with six feather sheets spread as wings, three a side, and a hex halo above.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const c = crystalCore(0.22, 0.85, 0.42); c.position.y = Y; b.add(c);
  for (const side of [1, -1]) { const w = G(); w.scale.x = side; b.add(w);
    [[1.15, 55], [1.0, 22], [0.82, -10]].forEach(([len, deg], i) => { const f = feather(len, 0.14 - i * 0.01, i === 1 ? M.steel : M.armor); const pv = G(); pv.position.set(0.2, Y + 0.22 - i * 0.12, -0.04 - i * 0.03); pv.rotation.z = deg * PI / 180; pv.add(f); w.add(pv); }); }
  const h = hexRing(0.34, 0.03, M.glow); h.position.y = Y + 0.85; b.add(h);
  return { g, core: Y, update(t) { b.position.y = bob(t, 2, 0.05); } };
});
f2(39, "A hex crystal inside a six-panel cage of tall sheets, each slid up by a different amount and twisted a little, with hex plates top and bottom.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const c = crystalCore(0.2, 0.7, 0.38); c.position.y = Y; b.add(c);
  for (let i = 0; i < 6; i++) { const a = aroundY(6, i, PI / 6), s = sheet(0.42, 1.5, i % 2 ? M.armor : M.gun); const h = G(); h.position.set(Math.sin(a) * 0.52, Y + (i % 3 - 1) * 0.22, Math.cos(a) * 0.52); h.rotation.y = a + 0.22; h.add(s); b.add(h); }
  for (const y of [-0.95, 0.95]) { const p = hexPlate(0.46, 0.07, M.dark); p.position.y = Y + y; b.add(p); const r = hexRing(0.46, 0.02, M.glow); r.position.y = Y + y + 0.04; b.add(r); }
  return { g, core: Y, update(t) { b.rotation.y = t * 0.2; b.position.y = bob(t, 0, 0.03); } };
});
f2(40, "A low armoured shell of hex tiles, a carapace of six-sided plates, with a cluster of three crystals rising out of its middle and four sheet legs.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.7;
  const body = mesh(new T.SphereGeometry(0.62, 24, 10, 0, TAU, 0, PI / 2), M.dark, 0, Y); body.scale.set(1, 0.6, 1.2); b.add(body);
  for (let r = 0; r < 4; r++) { const lat = 0.2 + r * 0.3, n = Math.max(1, Math.round(9 * Math.sin(lat)));
    for (let i = 0; i < n; i++) { const a = aroundY(n, i, r * 0.5), p = V(Math.sin(lat) * Math.cos(a) * 0.62, Math.cos(lat) * 0.38 + 0.02, Math.sin(lat) * Math.sin(a) * 0.74).add(V(0, Y, 0));
      const t = hexPlate(0.15, 0.03, r % 2 ? M.armor : M.gun); t.position.copy(p); t.lookAt(p.clone().add(V(Math.cos(a) * Math.sin(lat) * 0.9, Math.cos(lat) * 1.2, Math.sin(a) * Math.sin(lat) * 0.9))); t.rotateX(PI / 2); b.add(t); } }
  const c = crystalCore(0.2, 0.6, 0.34); c.position.set(0, Y + 0.6, 0); b.add(c);
  for (const s of [-1, 1]) { const c2 = crystalCore(0.1, 0.34, 0.2, 1); c2.position.set(s * 0.26, Y + 0.45, 0.05); c2.rotation.z = -s * 0.45; b.add(c2); }
  for (const [x, z] of [[0.5, 0.55], [-0.5, 0.55], [0.5, -0.55], [-0.5, -0.55]]) { const s = sheet(0.18, 0.7, M.gun, false); const h = G(); h.position.set(x, 0.55, z); h.rotation.y = Math.atan2(x, z); const p = G(); p.add(s); p.rotation.x = 0.5; h.add(p); b.add(h); }
  return { g, core: Y + 0.6, update() {} };
});
f2(41, "A long hex crystal spear, tilted, with rings of small sheets circling its shaft at three different heights, each ring a different size.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5, sp = G(); sp.position.y = Y; sp.rotation.z = 0.35; b.add(sp);
  const c = crystalCore(0.13, 1.6, 0.65); sp.add(c);
  const rings = [];
  [[0.5, 0.42, 8], [0.0, 0.32, 7], [-0.5, 0.24, 6]].forEach(([y, R, n], k) => { const ring = G(); ring.position.y = y; sp.add(ring); rings.push(ring);
    for (let i = 0; i < n; i++) { const a = aroundY(n, i), s = sheet(R * 0.62, 0.13, k % 2 ? M.steel : M.armor); const h = G(); h.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); h.rotation.y = -a + PI / 2; h.add(s); ring.add(h); } });
  return { g, core: Y, update(t) { rings.forEach((r, i) => r.rotation.y = t * (0.8 + i * 0.4) * (i % 2 ? -1 : 1)); b.position.y = bob(t, 0, 0.04); } };
});
f2(42, "A flat crown: six crystals laid out like spikes round a hex core, a sheet between each pair forming a six-sided ring, all hovering.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.3;
  const c = crystalCore(0.2, 0.5, 0.3); c.position.y = Y; b.add(c);
  for (let i = 0; i < 6; i++) { const a = aroundY(6, i), s = crystalCore(0.1, 0.5, 0.26, 1); const h = G(); h.position.y = Y; h.rotation.y = a; s.position.set(0, 0.0, 0.62); s.rotation.x = PI / 2 - 0.5; h.add(s); b.add(h);
    const a2 = a + PI / 6, sh = sheet(0.5, 0.34, i % 2 ? M.armor : M.gun); const h2 = G(); h2.position.set(Math.sin(a2) * 0.55, Y - 0.05, Math.cos(a2) * 0.55); h2.rotation.y = a2 + PI / 2; sh.rotation.x = 0.35; h2.add(sh); b.add(h2); }
  const base = hexPlate(0.34, 0.06, M.dark); base.position.y = Y - 0.4; b.add(base);
  return { g, core: Y, update(t) { b.rotation.y = t * 0.25; b.position.y = bob(t, 1, 0.04); } };
});
f2(43, "A standing sentinel: a hex crystal chest, a small crystal head, two big sheet pauldrons, sheet arms and a skirt of hanging sheets.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.55;
  const chest = crystalCore(0.28, 0.6, 0.36); chest.position.y = Y; b.add(chest);
  const head = crystalCore(0.1, 0.14, 0.2, 1.2); head.position.y = Y + 0.95; b.add(head); const neck = cyl(0.04, 0.05, 0.2, M.gun, 8); neck.position.y = Y + 0.7; b.add(neck);
  for (const s of [-1, 1]) { const p = sheet(0.55, 0.5, M.armor); p.position.set(s * 0.6, Y + 0.45, 0); p.rotation.set(0, s * 1.2, s * -0.35); b.add(p);
    const arm = sheet(0.14, 1.0, M.gun); arm.position.set(s * 0.78, Y - 0.2, 0.05); arm.rotation.z = s * 0.15; b.add(arm); const hand = hexPlate(0.1, 0.05, M.steel); hand.position.set(s * 0.82, Y - 0.78, 0.05); b.add(hand); }
  for (let i = 0; i < 6; i++) { const a = aroundY(6, i), s = sheet(0.24, 0.7, i % 2 ? M.armor : M.dark); const h = G(); h.position.set(Math.sin(a) * 0.3, Y - 0.62, Math.cos(a) * 0.3); h.rotation.y = a; s.position.y = -0.34; const pv = G(); pv.add(s); pv.rotation.x = -0.2; h.add(pv); b.add(h); }
  const belt = hexRing(0.34, 0.03, M.glow); belt.position.y = Y - 0.55; b.add(belt);
  return { g, core: Y, update(t) { b.position.y = bob(t, 0, 0.03); } };
});
f2(44, "Two hex crystals stacked and twisted against each other, with a belt of eight tilted sheets circling between them.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5, belt = G(); belt.position.y = Y; b.add(belt);
  const lo = crystalCore(0.32, 0.45, 0.35); lo.position.y = Y - 0.62; b.add(lo);
  const hi = crystalCore(0.22, 0.45, 0.45); hi.position.y = Y + 0.62; hi.rotation.y = PI / 6; b.add(hi);
  for (let i = 0; i < 8; i++) { const a = aroundY(8, i), s = sheet(0.3, 0.13, i % 2 ? M.steel : M.armor); const h = G(); h.position.set(Math.cos(a) * 0.6, 0, Math.sin(a) * 0.6); h.rotation.y = -a + PI / 2; s.rotation.x = 0.45; h.add(s); belt.add(h); }
  const p1 = hexPlate(0.26, 0.05, M.dark); p1.position.y = Y - 0.1; b.add(p1);
  return { g, core: Y, update(t) { belt.rotation.y = t * 0.7; hi.rotation.y = PI / 6 - t * 0.3; b.position.y = bob(t, 2, 0.04); } };
});
f2(45, "A shell coming apart: a small hex crystal in the middle and a sphere of curved sheets split into patches, each floating a little out from the others.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const c = crystalCore(0.17, 0.4, 0.28); c.position.y = Y; b.add(c);
  const mat = M.armor.clone(); mat.side = T.DoubleSide; const mat2 = M.gun.clone(); mat2.side = T.DoubleSide;
  const bands = [[0.12, 0.95, 4], [1.05, 1.55, 6], [1.6, 2.1, 6], [2.2, 3.0, 4]];
  bands.forEach(([t0, t1, n], bi) => { for (let i = 0; i < n; i++) { const p0 = i * TAU / n + bi * 0.4, pl = TAU / n - 0.14;
    const m = mesh(new T.SphereGeometry(0.62, 10, 8, p0, pl, t0, t1 - t0), (i + bi) % 2 ? mat : mat2); const mid = V(Math.sin((t0 + t1) / 2) * Math.sin(p0 + pl / 2), Math.cos((t0 + t1) / 2), Math.sin((t0 + t1) / 2) * Math.cos(p0 + pl / 2));
    m.position.copy(mid).multiplyScalar(0.1 + ((i * 7 + bi * 3) % 4) * 0.05).add(V(0, Y, 0)); b.add(m); const e = mesh(new T.SphereGeometry(0.622, 10, 1, p0, pl, t0, 0.025), M.glow); e.position.copy(m.position); b.add(e); } });
  return { g, core: Y, update(t) { b.rotation.y = t * 0.2; } };
});
f2(46, "A flat crab: a hex plate body, a crystal spike through its middle, six sheet legs each in two plates, and two blade claws.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.75;
  const body = hexPlate(0.55, 0.14, M.armor); body.position.y = Y; b.add(body); const top = hexPlate(0.4, 0.06, M.gun); top.position.y = Y + 0.1; b.add(top); const r = hexRing(0.56, 0.02, M.glow); r.position.y = Y + 0.07; b.add(r);
  const c = crystalCore(0.16, 0.6, 0.38); c.position.y = Y + 0.62; b.add(c);
  for (let i = 0; i < 6; i++) { const a = aroundY(6, i, PI / 6), h = G(); h.position.set(Math.sin(a) * 0.5, Y, Math.cos(a) * 0.5); h.rotation.y = a; b.add(h);
    const u = sheet(0.18, 0.55, M.armor, false); const up = G(); up.add(u); up.rotation.x = 1.1; up.position.set(0, 0.12, 0.12); h.add(up);
    const l = sheet(0.14, 0.6, M.gun, false); const lo = G(); lo.add(l); lo.rotation.x = -0.35; lo.position.set(0, -0.15, 0.55); h.add(lo); }
  for (const s of [-1, 1]) { const cl = feather(0.7, 0.13, M.steel); cl.position.set(s * 0.3, Y + 0.05, 0.5); cl.rotation.set(0, s > 0 ? -0.9 : PI + 0.9, 0); b.add(cl); }
  return { g, core: Y + 0.6, update() {} };
});
f2(47, "A peacock: a hex crystal torso with six long sheets fanned behind it in an arc, and a small hex ring floating above.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.35;
  const c = crystalCore(0.2, 0.75, 0.4); c.position.y = Y; b.add(c);
  const fan = G(); fan.position.set(0, Y - 0.1, -0.18); b.add(fan);
  for (let i = 0; i < 6; i++) { const ang = (-75 + i * 30) * PI / 180, f = feather(1.15, 0.13, i % 2 ? M.steel : M.armor); const pv = G(); pv.rotation.z = PI / 2 - ang; pv.rotation.y = 0; pv.add(f); pv.position.z = -i * 0.012; fan.add(pv); }
  const h = hexRing(0.26, 0.025, M.glow); h.position.y = Y + 0.75; b.add(h);
  const base = hexPlate(0.3, 0.05, M.dark); base.position.y = Y - 0.62; b.add(base);
  return { g, core: Y, update(t) { b.rotation.y = Math.sin(t * 0.4) * 0.5 + 0.4; b.position.y = bob(t, 1, 0.04); } };
});
f2(48, "A floating totem of five slabs, each turned a little further than the last, with one long hex crystal running through all of them.", () => {
  const g = G(), b = G(); g.add(b); const Y = 0.55, slabs = [];
  const c = crystalCore(0.1, 2.0, 0.55); c.position.y = Y + 1.05; b.add(c);
  for (let i = 0; i < 5; i++) { const s = cbox(0.78 - i * 0.08, 0.12, 0.5 - i * 0.04, 0.025, i % 2 ? M.gun : M.armor); s.position.y = Y + 0.2 + i * 0.42; s.rotation.y = i * 0.45; b.add(s); slabs.push(s);
    const e = hexRing(0.2, 0.014, M.glow); e.position.y = Y + 0.2 + i * 0.42 + 0.07; b.add(e); }
  return { g, core: Y + 1.05, update(t) { slabs.forEach((s, i) => s.rotation.y = i * 0.45 + Math.sin(t * 0.6 + i) * 0.25); } };
});
f2(49, "A manta: a flat swept body of overlapping wing sheets with a hex crystal lying along its spine and a tail of small sheets.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.35;
  const c = crystalCore(0.15, 0.9, 0.4); c.rotation.x = PI / 2; c.position.y = Y; b.add(c);
  for (const s of [-1, 1]) for (let i = 0; i < 4; i++) { const w = feather(0.95 - i * 0.12, 0.22 - i * 0.02, i % 2 ? M.armor : M.gun); w.position.set(s * 0.12, Y - 0.02 - i * 0.02, 0.3 - i * 0.22); w.rotation.set(0, s > 0 ? -0.35 - i * 0.1 : PI + 0.35 + i * 0.1, s * 0.1); b.add(w); }
  for (let i = 0; i < 5; i++) { const t = sheet(0.14 - i * 0.015, 0.2, M.steel); t.rotation.x = PI / 2; t.position.set(0, Y - 0.02, -0.62 - i * 0.2); b.add(t); }
  const head = sheet(0.3, 0.3, M.dark, false); head.rotation.x = PI / 2; head.position.set(0, Y - 0.05, 0.62); b.add(head);
  b.scale.setScalar(1.35); b.rotation.y = 0.5;
  return { g, core: Y, update(t) { b.position.y = -0.3 + bob(t, 3, 0.05); b.rotation.z = Math.sin(t * 0.8) * 0.08; } };
});
f2(50, "A large hex crystal with six small crystals orbiting it, each carrying a sheet shield on its outer side.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5, orb = G(); orb.position.y = Y; b.add(orb);
  const c = crystalCore(0.2, 0.6, 0.38); c.position.y = Y; b.add(c);
  for (let i = 0; i < 6; i++) { const a = aroundY(6, i), h = G(); h.position.set(Math.cos(a) * 0.78, Math.sin(i * 1.7) * 0.28, Math.sin(a) * 0.78); h.rotation.y = -a + PI / 2; orb.add(h);
    const sc = crystalCore(0.07, 0.26, 0.16, 0.9); sc.rotation.z = 0.0; h.add(sc);
    const sh = sheet(0.34, 0.44, i % 2 ? M.armor : M.gun); sh.position.z = 0.16; sh.rotation.y = 0; h.add(sh); }
  return { g, core: Y, update(t) { orb.rotation.y = t * 0.5; b.position.y = bob(t, 0, 0.04); } };
});
f2(51, "A hex crystal head over a layered cloak: four tiers of sheets, each tier wider and offset by a half-turn, like a six-sided skirt of steps.", () => {
  const g = G(), b = G(); g.add(b); const Y = 2.1;
  const c = crystalCore(0.2, 0.5, 0.4); c.position.y = Y; b.add(c);
  const tiers = [[0.28, 0.5, 6], [0.4, 0.55, 6], [0.52, 0.55, 6], [0.64, 0.5, 6]];
  tiers.forEach(([R, hgt, n], k) => { for (let i = 0; i < n; i++) { const a = aroundY(n, i, k * PI / 6), s = sheet(R * 1.05, hgt, k % 2 ? M.armor : M.gun, k === 3); const h = G(); h.position.set(Math.sin(a) * R, Y - 0.45 - k * 0.38, Math.cos(a) * R); h.rotation.y = a; const pv = G(); pv.add(s); pv.position.y = -hgt / 2; pv.rotation.x = -0.12 - k * 0.04; h.add(pv); b.add(h); } });
  const col = hexRing(0.28, 0.03, M.glow); col.position.y = Y - 0.35; b.add(col);
  return { g, core: Y, update(t) { b.position.y = bob(t, 0, 0.04); } };
});
f2(52, "A vertical hex crystal inside three orbit rings, each ring a loop of separate sheets with gaps, tilted at different angles.", () => {
  const g = G(), b = G(); g.add(b); const Y = 1.5, rings = [];
  const c = crystalCore(0.2, 0.8, 0.42); c.position.y = Y; b.add(c);
  [[0, 0.78, 0.0], [PI / 3, 0.9, 0.0], [-PI / 3, 1.02, 0.0]].forEach(([tilt, R], k) => { const ring = G(); ring.position.y = Y; ring.rotation.z = tilt; ring.rotation.x = k * 0.4; b.add(ring); rings.push(ring);
    const n = 6 + k * 2; for (let i = 0; i < n; i++) { const a = aroundY(n, i), s = sheet(R * 0.62, 0.15, k % 2 ? M.steel : M.armor); const h = G(); h.position.set(Math.cos(a) * R, 0, Math.sin(a) * R); h.rotation.y = -a + PI / 2; s.rotation.x = PI / 2 - 0.0; h.add(s); ring.add(h); } });
  return { g, core: Y, update(t) { rings.forEach((r, i) => r.rotation.y = t * (0.5 + i * 0.3) * (i % 2 ? -1 : 1)); b.position.y = bob(t, 1, 0.03); } };
});
