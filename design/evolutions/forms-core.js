const ELEMENTS = [
  { id: "fire", label: "Fire", color: "#ff5522" }, { id: "electric", label: "Electric", color: "#ffe033" },
  { id: "ice", label: "Ice", color: "#9fe8ff" }, { id: "flux", label: "Flux", color: "#b455ff" },
  { id: "core", label: "Core", color: "#00ccaa" }, { id: "toxic", label: "Toxic", color: "#5cff5c" },
];
const REDUCED = window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
if (!window.THREE) { document.getElementById("roles").innerHTML = '<p class="nogl">The 3D library did not load. Reload the page to try again.</p>'; return; }
const T = THREE, TAU = Math.PI * 2, PI = Math.PI;
let EL = ELEMENTS[4];

// ── MATERIALS (shared by every bay; element ones recoloured in one place) ──
const M = {
  armor:   new T.MeshStandardMaterial({ color: 0x1c2027, metalness: 0.88, roughness: 0.36 }),
  dark:    new T.MeshStandardMaterial({ color: 0x0c0e12, metalness: 0.7, roughness: 0.55 }),
  steel:   new T.MeshStandardMaterial({ color: 0x8a929e, metalness: 1, roughness: 0.22 }),
  gun:     new T.MeshStandardMaterial({ color: 0x3a4049, metalness: 1, roughness: 0.3 }),
  bronze:  new T.MeshStandardMaterial({ color: 0x5a4428, metalness: 1, roughness: 0.42 }),
  rubber:  new T.MeshStandardMaterial({ color: 0x060708, metalness: 0.1, roughness: 0.85 }),
  glow:    new T.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }),
  glowSoft:new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, side: T.DoubleSide }),
  wash:    new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.08, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false, side: T.DoubleSide }),
  crystal: new T.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffffff, emissiveIntensity: 0.85, metalness: 0.15, roughness: 0.12, flatShading: true }),
  glass:   new T.MeshStandardMaterial({ color: 0xdfeeff, transparent: true, opacity: 0.22, metalness: 0, roughness: 0.04, depthWrite: false }),
  shard:   new T.MeshStandardMaterial({ color: 0xdfeeff, transparent: true, opacity: 0.55, metalness: 0, roughness: 0.05, side: T.DoubleSide }),
  black:   new T.MeshStandardMaterial({ color: 0x050505, metalness: 0.6, roughness: 0.35 }),
};
// Dark machine: armour reflects the shop's lights only dimly; bare steel catches them.
M.armor.envMapIntensity = 0.5; M.dark.envMapIntensity = 0.45; M.gun.envMapIntensity = 0.8; M.bronze.envMapIntensity = 0.7;
// a radial glow for sprites and floor light
const glowTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 128; const g = c.getContext("2d");
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, "rgba(255,255,255,1)"); gr.addColorStop(0.25, "rgba(255,255,255,0.5)"); gr.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128); const t = new T.CanvasTexture(c); return t; })();
M.sprite = new T.SpriteMaterial({ map: glowTex, color: 0xffffff, blending: T.AdditiveBlending, depthWrite: false, transparent: true, toneMapped: false });
M.floorGlow = new T.MeshBasicMaterial({ map: glowTex, color: 0xffffff, transparent: true, opacity: 0.55, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false });
const LIGHTS = [];
function setElementColour(hex) {
  const c = new T.Color(hex);
  for (const k of ["glow", "glowSoft", "wash", "sprite", "floorGlow"]) M[k].color.copy(c);
  M.crystal.color.copy(c); M.crystal.emissive.copy(c);
  for (const l of LIGHTS) l.color.copy(c);
}
// the floor: the game's dark tiles with a faint diamond grid
const floorTex = (() => { const c = document.createElement("canvas"); c.width = c.height = 512; const g = c.getContext("2d");
  g.fillStyle = "#0b0d12"; g.fillRect(0, 0, 512, 512); g.strokeStyle = "rgba(90,130,180,0.18)"; g.lineWidth = 2;
  for (let i = -8; i <= 8; i++) { g.beginPath(); g.moveTo(i * 64, 0); g.lineTo(i * 64 + 512, 512); g.stroke(); g.beginPath(); g.moveTo(i * 64 + 512, 0); g.lineTo(i * 64, 512); g.stroke(); }
  const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(5, 5); t.anisotropy = 4; return t; })();

// ── GEOMETRY HELPERS ─────────────────────────────────────────────────────
const G = () => new T.Group();
function mesh(geo, mat, x, y, z) { const m = new T.Mesh(geo, mat); m.position.set(x || 0, y || 0, z || 0); return m; }
function cbox(w, h, d, b, mat) {   // a chamfered box
  b = Math.min(b == null ? 0.035 : b, w / 3, h / 3, d / 3);
  const s = new T.Shape(), hw = w / 2 - b, hh = h / 2 - b;
  s.moveTo(-hw, -hh); s.lineTo(hw, -hh); s.lineTo(hw, hh); s.lineTo(-hw, hh); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: Math.max(0.002, d - 2 * b), bevelEnabled: true, bevelThickness: b, bevelSize: b, bevelSegments: 1, steps: 1 });
  g.center(); return new T.Mesh(g, mat || M.armor);
}
function plate(pts, depth, b, mat) {   // a 2D outline in x-y, extruded along z
  const s = new T.Shape(); pts.forEach(([x, y], i) => i ? s.lineTo(x, y) : s.moveTo(x, y)); s.closePath();
  const g = new T.ExtrudeGeometry(s, { depth: Math.max(0.002, depth - 2 * (b || 0)), bevelEnabled: !!b, bevelThickness: b || 0, bevelSize: b || 0, bevelSegments: 1, steps: 1 });
  g.translate(0, 0, -depth / 2 + (b || 0)); return new T.Mesh(g, mat || M.armor);
}
function cyl(rt, rb, h, mat, seg) { return new T.Mesh(new T.CylinderGeometry(rt, rb, h, seg || 24), mat || M.armor); }
function torus(r, tube, mat, seg) { return new T.Mesh(new T.TorusGeometry(r, tube, 10, seg || 48), mat || M.steel); }
function tube(pts, r, mat) { const curve = new T.CatmullRomCurve3(pts.map(p => new T.Vector3(p[0], p[1], p[2]))); return new T.Mesh(new T.TubeGeometry(curve, 28, r, 8, false), mat || M.rubber); }
function sphere(r, mat, ws) { return new T.Mesh(new T.SphereGeometry(r, ws || 24, (ws || 24) / 2), mat || M.steel); }
function bolts(parent, r, n, y, size, horizontal) {   // rivets round a circle
  for (let i = 0; i < n; i++) { const a = i * TAU / n; const b = sphere(size || 0.025, M.steel, 8);
    if (horizontal) b.position.set(Math.cos(a) * r, y, Math.sin(a) * r); else b.position.set(Math.cos(a) * r, Math.sin(a) * r + y, 0);
    parent.add(b); }
}
function gear(R, r, teeth, depth, mat) {   // a toothed ring (a saw), lying in x-y
  const s = new T.Shape(), n = teeth * 4;
  for (let i = 0; i <= n; i++) { const a = i / n * TAU, k = i % 4, rr = k === 1 ? R : k === 2 ? R * 0.93 : r + (R - r) * 0.55;
    const x = Math.cos(a) * rr, y = Math.sin(a) * rr; i ? s.lineTo(x, y) : s.moveTo(x, y); }
  const hole = new T.Path(); hole.absarc(0, 0, r, 0, TAU, true); s.holes.push(hole);
  const g = new T.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 6 }); g.translate(0, 0, -depth / 2);
  return new T.Mesh(g, mat || M.steel);
}
function glowSprite(size) { const s = new T.Sprite(M.sprite); s.scale.set(size, size, 1); return s; }
// the reactor: the element crystal, its inner light, its glow and its lamp
function reactor(size, lamp) {
  const g = G();
  const c = mesh(new T.OctahedronGeometry(size, 0), M.crystal); c.scale.set(1, 1.4, 1); g.add(c);
  const inner = mesh(new T.OctahedronGeometry(size * 0.45, 0), M.glow); inner.scale.set(1, 1.4, 1); g.add(inner);
  g.add(glowSprite(size * 6));
  const L = new T.PointLight(0xffffff, lamp == null ? 2.2 : lamp, 4.5, 2); g.add(L); LIGHTS.push(L); L.color.set(EL.color);
  return { g, spin(t) { c.rotation.y = t * 0.9; inner.rotation.y = -t * 1.4; } };
}
// a ducted rotor; blows down; the glow and downwash in the element colour
function rotor(r, wash) {
  const g = G(), duct = torus(r, r * 0.16, M.armor, 40); duct.rotation.x = PI / 2; g.add(duct);
  const lip = torus(r * 1.02, r * 0.035, M.glow, 40); lip.rotation.x = PI / 2; lip.position.y = -r * 0.14; g.add(lip);
  const hub = cyl(r * 0.18, r * 0.22, r * 0.3, M.gun); g.add(hub);
  const fan = G(); for (let i = 0; i < 4; i++) { const bl = cbox(r * 0.85, 0.018, r * 0.2, 0.004, M.steel); bl.position.x = r * 0.45; bl.rotation.x = 0.35; const arm = G(); arm.rotation.y = i * TAU / 4; arm.add(bl); fan.add(arm); } g.add(fan);
  for (const a of [0, PI / 2]) { const st = cbox(r * 2, 0.03, 0.03, 0.006, M.gun); st.rotation.y = a; g.add(st); }
  if (wash !== false) { const w = mesh(new T.CylinderGeometry(r * 0.9, r * 1.6, r * 2.2, 24, 1, true), M.wash); w.position.y = -r * 1.25; g.add(w);
    const d = mesh(new T.CircleGeometry(r * 0.85, 24), M.glowSoft); d.rotation.x = PI / 2; d.position.y = -r * 0.12; g.add(d); }
  return { g, fan };
}
// a hydraulic piston from a to b: sleeve + chrome rod (extension 0..1)
function piston(len, r) {
  const g = G(), sleeve = cyl(r, r, len * 0.55, M.armor, 16); sleeve.position.y = -len * 0.275; g.add(sleeve);
  const band = torus(r * 1.02, r * 0.18, M.glow, 20); band.rotation.x = PI / 2; band.position.y = -len * 0.5; g.add(band);
  const rod = cyl(r * 0.5, r * 0.5, len * 0.6, M.steel, 12); g.add(rod);
  return { g, set(k) { rod.position.y = -len * 0.55 - k * len * 0.3; } };
}
// a bronze glyph plate with a lit glyph cut into it
function glyphPlate(w, h) {
  const g = G(); g.add(cbox(w, h, 0.03, 0.008, M.bronze));
  const ln = (x1, y1, x2, y2) => { const L = Math.hypot(x2 - x1, y2 - y1), m = cbox(L, 0.018, 0.012, 0.002, M.glow); m.position.set((x1 + x2) / 2, (y1 + y2) / 2, 0.018); m.rotation.z = Math.atan2(y2 - y1, x2 - x1); g.add(m); };
  ln(0, -h * 0.32, 0, h * 0.32); ln(-w * 0.28, h * 0.1, w * 0.28, h * 0.1); ln(-w * 0.2, -h * 0.18, 0, -h * 0.32); ln(w * 0.2, -h * 0.18, 0, -h * 0.32);
  return g;
}
function shadowsOn(o) { o.traverse(m => { if (m.isMesh && !(m.material.isMeshBasicMaterial) && m.material !== M.glass && m.material !== M.shard) { m.castShadow = true; m.receiveShadow = true; } }); }
const bob = (t, ph, a) => Math.sin(t * 1.6 + (ph || 0)) * (a == null ? 0.05 : a);
const ease = k => 1 - Math.pow(1 - Math.max(0, Math.min(1, k)), 3);

// ── THE EGG: today's follower, for the molt ──────────────────────────────
function makeEgg() {
  const g = G(), body = G(); g.add(body);
  const glass = G();
  const tubeG = mesh(new T.CylinderGeometry(0.42, 0.42, 0.75, 32, 1, true), M.glass, 0, 1.25); glass.add(tubeG);
  const dome = mesh(new T.SphereGeometry(0.42, 32, 16, 0, TAU, 0, PI / 2), M.glass, 0, 1.62); glass.add(dome);
  body.add(glass);
  const base = cyl(0.46, 0.46, 0.12, M.black); base.position.y = 0.84; body.add(base);
  const r = reactor(0.18, 1.2); r.g.position.y = 1.3; body.add(r.g);
  const legs = [0, 1, 2].map(i => { const a = i * TAU / 3 + PI / 6, x = Math.cos(a), z = Math.sin(a);
    const L = tube([[x * 0.3, 0.84, z * 0.3], [x * 0.85, 0.75, z * 0.85], [x * 0.95, 0.02, z * 0.95]], 0.045, M.black); body.add(L); return L; });
  return { g, body, glass, legs, reactor: r };
}
function makeShards(parent) {
  const out = [];
  for (let i = 0; i < 18; i++) {
    const m = mesh(new T.TetrahedronGeometry(0.07 + Math.random() * 0.07, 0), M.shard); m.visible = false; parent.add(m);
    const a = Math.random() * TAU, up = Math.random();
    out.push({ m, p0: new T.Vector3(Math.cos(a) * 0.35, 1.1 + up * 0.7, Math.sin(a) * 0.35), v: new T.Vector3(Math.cos(a) * (1.2 + Math.random() * 1.6), 1.5 + Math.random() * 2.2, Math.sin(a) * (1.2 + Math.random() * 1.6)), r: new T.Vector3(Math.random() * 8, Math.random() * 8, Math.random() * 8) });
  }
  return out;
}

// ── THE FORMS ────────────────────────────────────────────────────────────
// Each returns { g, core (height of its reactor), update(t, act) }. act runs
// 0→1 over its action cycle (every `every` seconds); 1 is the hit / the shot.
const FORMS = {};
function form(key, meta, build) { FORMS[key] = Object.assign({ key, build }, meta); }

form("mender", { role: "worker", name: "Mender", legs: "Three articulated tool-arms",
  blurb: "A split armoured sphere with the reactor showing in the gap, held up by a ducted rotor. Three tool-arms hang beneath it: a welder, a clamp and a drill. It floats over a broken pylon and rebuilds it." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.75;
  const top = mesh(new T.SphereGeometry(0.58, 40, 20, 0, TAU, 0, PI / 2), M.armor, 0, Y + 0.09); b.add(top);
  const bot = mesh(new T.SphereGeometry(0.58, 40, 20, 0, TAU, PI / 2, PI / 2), M.dark, 0, Y - 0.09); b.add(bot);
  for (const y of [Y + 0.09, Y - 0.09]) { const t = torus(0.585, 0.03, M.steel, 48); t.rotation.x = PI / 2; t.position.y = y; b.add(t); }
  for (let i = 0; i < 6; i++) { const p = cbox(0.06, 0.16, 0.06, 0.01, M.gun); const a = i * TAU / 6; p.position.set(Math.cos(a) * 0.5, Y, Math.sin(a) * 0.5); b.add(p); }
  const visor = cbox(0.32, 0.05, 0.05, 0.01, M.glow); visor.position.set(0, Y + 0.32, 0.5); visor.rotation.x = -0.55; b.add(visor);
  const plateG = glyphPlate(0.18, 0.18); plateG.position.set(0, Y + 0.16, 0.55); plateG.rotation.x = -0.25; b.add(plateG);
  const r = reactor(0.2); r.g.position.y = Y; b.add(r.g);
  const rt = rotor(0.36, false); rt.g.position.y = Y + 0.72; b.add(rt.g);
  const mast = cyl(0.05, 0.08, 0.18, M.gun); mast.position.y = Y + 0.6; b.add(mast);
  const arms = [0, 1, 2].map(i => {
    const a = i * TAU / 3 + PI / 2, sh = G(); sh.position.set(Math.cos(a) * 0.32, Y - 0.45, Math.sin(a) * 0.32); sh.rotation.y = -a; b.add(sh);
    sh.add(sphere(0.075, M.steel)); const s = G(); sh.add(s);
    const up = cbox(0.08, 0.42, 0.08, 0.015, M.armor); up.position.y = -0.21; s.add(up);
    const e = G(); e.position.y = -0.42; s.add(e); e.add(sphere(0.06, M.steel));
    const lo = cbox(0.06, 0.42, 0.06, 0.012, M.dark); lo.position.y = -0.21; e.add(lo);
    const tip = G(); tip.position.y = -0.44; e.add(tip);
    let fx = null;
    if (i === 0) { const c = mesh(new T.ConeGeometry(0.05, 0.14, 12), M.steel, 0, -0.06); c.rotation.x = PI; tip.add(c); fx = glowSprite(0.32); fx.position.y = -0.16; tip.add(fx); }
    if (i === 1) for (const sx of [-1, 1]) { const j = cbox(0.03, 0.14, 0.05, 0.006, M.steel); j.position.set(sx * 0.04, -0.07, 0); j.rotation.z = sx * 0.3; tip.add(j); }
    if (i === 2) { const d = mesh(new T.ConeGeometry(0.045, 0.18, 6), M.gun, 0, -0.08); d.rotation.x = PI; tip.add(d); }
    return { s, e, tip, fx, i };
  });
  return { g, core: Y, update(t) {
    b.position.y = bob(t); r.spin(t); rt.fan.rotation.y = t * 22;
    arms.forEach(A => { A.s.rotation.z = 0.55 + Math.sin(t * 1.2 + A.i * 2) * 0.12; A.e.rotation.z = -1.0 + Math.sin(t * 1.6 + A.i) * 0.2; if (A.i === 2) A.tip.rotation.y = t * 12;
      if (A.fx) A.fx.material.opacity = 1; if (A.fx) A.fx.scale.setScalar(Math.sin(t * 27) > 0.2 ? 0.34 : 0.12); });
  } };
});

form("hauler", { role: "worker", name: "Lantern Hauler", legs: "Bent up into the cage ribs",
  blurb: "An octagonal cage of armoured ribs with the reactor hanging inside like a lamp, two rotor pods on its flanks and a charge canister slung underneath. It ferries power between your pylons." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.55;
  const capT = cyl(0.42, 0.5, 0.16, M.armor, 8); capT.position.y = Y + 0.52; b.add(capT);
  const capB = cyl(0.5, 0.4, 0.16, M.armor, 8); capB.position.y = Y - 0.52; b.add(capB);
  for (const y of [Y + 0.6, Y - 0.6]) { const t = torus(0.38, 0.02, M.glow, 8); t.rotation.x = PI / 2; t.rotation.z = PI / 8; t.position.y = y + (y > Y ? 0.02 : -0.02); b.add(t); }
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6; const c = Math.cos(a), s = Math.sin(a);
    b.add(tube([[c * 0.4, Y - 0.45, s * 0.4], [c * 0.55, Y, s * 0.55], [c * 0.4, Y + 0.45, s * 0.4]], 0.04, M.dark)); }
  const r = reactor(0.24, 2.8); r.g.position.y = Y; b.add(r.g);
  const fin = cyl(0.03, 0.08, 0.3, M.gun); fin.position.y = Y + 0.75; b.add(fin);
  const pods = [-1, 1].map(sx => { const strut = cbox(0.5, 0.06, 0.08, 0.012, M.gun); strut.position.set(sx * 0.72, Y + 0.25, 0); b.add(strut);
    const rt = rotor(0.26); rt.g.position.set(sx * 1.02, Y + 0.25, 0); b.add(rt.g); return rt; });
  const can = G(); can.position.y = Y - 1.0; b.add(can);
  const body = cyl(0.17, 0.17, 0.62, M.armor); body.rotation.z = PI / 2; can.add(body);
  for (const x of [-0.33, 0.33]) { const cap = cyl(0.19, 0.19, 0.06, M.steel); cap.rotation.z = PI / 2; cap.position.x = x; can.add(cap); }
  const band = torus(0.175, 0.02, M.glow, 24); band.rotation.y = PI / 2; can.add(band);
  for (const x of [-0.2, 0.2]) b.add(tube([[x, Y - 0.6, 0], [x * 1.1, Y - 0.78, 0.02], [x, Y - 0.85, 0]], 0.012, M.rubber));
  return { g, core: Y, update(t) { b.position.y = bob(t, 1); r.spin(t); pods.forEach((p, i) => p.fan.rotation.y = t * 24 * (i ? -1 : 1)); can.rotation.z = Math.sin(t * 1.3) * 0.06; } };
});

form("mason", { role: "worker", name: "Forge Mason", legs: "Two piston crane-arms",
  blurb: "A heavy industrial block. The reactor burns behind a front grille, vents glow on its back, and two piston-driven crane arms swing stone in clamp jaws. It builds your formations." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.3;
  const body = cbox(1.0, 0.7, 0.8, 0.07, M.armor); body.position.y = Y; b.add(body);
  const roof = cbox(0.8, 0.12, 0.6, 0.03, M.dark); roof.position.y = Y + 0.41; b.add(roof);
  const frame = cbox(0.62, 0.42, 0.06, 0.015, M.dark); frame.position.set(0, Y, 0.4); b.add(frame);
  const back = mesh(new T.PlaneGeometry(0.54, 0.36), M.glowSoft, 0, Y, 0.425); b.add(back);
  for (let i = 0; i < 5; i++) { const s = cbox(0.58, 0.035, 0.05, 0.008, M.steel); s.position.set(0, Y - 0.16 + i * 0.08, 0.45); b.add(s); }
  const r = reactor(0.16, 2.6); r.g.position.set(0, Y, 0.22); b.add(r.g);
  for (let i = 0; i < 3; i++) { const v = cbox(0.12, 0.05, 0.36, 0.01, M.glow); v.position.set(-0.22 + i * 0.22, Y + 0.48, -0.05); b.add(v); }
  const gp = glyphPlate(0.22, 0.22); gp.position.set(0.51, Y + 0.08, 0); gp.rotation.y = PI / 2; b.add(gp);
  for (const [x, z] of [[-0.35, -0.25], [0.35, -0.25], [-0.35, 0.25], [0.35, 0.25]]) { const rt = rotor(0.15); rt.g.position.set(x, Y - 0.43, z); b.add(rt.g); }
  const arms = [-1, 1].map(sx => {
    const sh = G(); sh.position.set(sx * 0.56, Y + 0.12, 0.1); b.add(sh); sh.add(sphere(0.09, M.steel));
    const s = G(); sh.add(s);
    const p = piston(0.7, 0.05); p.g.rotation.z = 0; s.add(p.g);
    const fore = cbox(0.1, 0.42, 0.1, 0.02, M.armor); fore.position.set(0, -0.62, 0.12); fore.rotation.x = -0.5; s.add(fore);
    const jaw = G(); jaw.position.set(0, -0.82, 0.25); s.add(jaw);
    for (const jx of [-1, 1]) { const j = cbox(0.03, 0.14, 0.1, 0.006, M.steel); j.position.set(jx * 0.1, -0.05, 0); jaw.add(j); }
    const stone = cbox(0.16, 0.14, 0.14, 0.03, M.dark); stone.position.y = -0.08; jaw.add(stone);
    const seam = cbox(0.17, 0.012, 0.15, 0.002, M.glow); seam.position.y = -0.08; jaw.add(seam);
    return { s, p, sx };
  });
  return { g, core: Y, update(t) { b.position.y = bob(t, 2, 0.03); r.spin(t);
    arms.forEach((A, i) => { const k = 0.5 + 0.5 * Math.sin(t * 1.4 + i * PI); A.s.rotation.x = -0.25 - k * 0.5; A.s.rotation.z = A.sx * 0.12; A.p.set(k); }); } };
});

form("reaver", { role: "brawler", name: "Reaver", legs: "Six servo blade-arms",
  blurb: "A wedge-shaped armoured hull with the reactor behind a round port and a lit visor slit. Six blade arms on servo hubs fan out from its sides, edges lit, and swing forward together when it strikes." , every: 2.4 },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const hull = plate([[-0.3, 0.42], [0.3, 0.42], [0.42, 0], [0.22, -0.46], [-0.22, -0.46], [-0.42, 0]], 0.62, 0.05, M.armor); hull.position.y = Y; b.add(hull);
  const spine = cbox(0.12, 0.7, 0.7, 0.03, M.dark); spine.position.y = Y + 0.06; b.add(spine);
  const port = torus(0.16, 0.035, M.steel, 32); port.position.set(0, Y + 0.02, 0.34); b.add(port);
  const r = reactor(0.12, 2.4); r.g.position.set(0, Y + 0.02, 0.28); b.add(r.g);
  const visor = cbox(0.34, 0.04, 0.04, 0.008, M.glow); visor.position.set(0, Y + 0.3, 0.32); b.add(visor);
  const arms = [];
  for (const sx of [-1, 1]) [[0.28, 0.75, 1.0], [0.0, 0.2, 0.85], [-0.28, -0.35, 0.65]].forEach(([dy, ang, len], k) => {
    const hub = G(); hub.position.set(sx * 0.44, Y + dy, 0); b.add(hub);
    const h = cyl(0.08, 0.08, 0.1, M.steel, 16); h.rotation.z = PI / 2; hub.add(h);
    const swing = G(); hub.add(swing);
    const arm = G(); arm.rotation.z = sx * ang; swing.add(arm);
    const bladeShape = [[0, -0.06], [len * 0.55, -0.1], [len, 0.02], [len * 0.55, 0.07], [0, 0.05]];
    const bl = plate(bladeShape.map(([x, y]) => [x * sx, y]), 0.035, 0.008, M.armor); arm.add(bl);
    const edge = plate([[len * 0.15, -0.075], [len * 0.55, -0.112], [len, 0.02], [len * 0.97, 0.005], [len * 0.55, -0.09], [len * 0.15, -0.06]].map(([x, y]) => [x * sx, y]), 0.04, 0, M.glow); arm.add(edge);
    arms.push({ swing, sx, k });
  });
  for (const sx of [-1, 1]) { const ex = cyl(0.07, 0.1, 0.18, M.gun); ex.rotation.x = PI / 2; ex.position.set(sx * 0.18, Y - 0.2, -0.38); b.add(ex); const f = glowSprite(0.3); f.position.set(sx * 0.18, Y - 0.2, -0.5); b.add(f); }
  return { g, core: Y + 0.02, update(t, act) { b.position.y = bob(t, 0, 0.04); r.spin(t);
    const strike = act > 0.8 ? Math.sin((act - 0.8) / 0.2 * PI) : 0;
    arms.forEach(A => { A.swing.rotation.y = -A.sx * (0.15 + Math.sin(t * 2 + A.k) * 0.06 + strike * 1.1); }); } };
});

form("ram", { role: "brawler", name: "Ram", legs: "Two hydraulic slab fists",
  blurb: "A compact reactor block between two great armoured slabs, each on a pair of hydraulic rams. The slabs slam shut on whatever is in front of it. Its vents flash and the reactor flares on impact.", every: 2.0 },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.35;
  const core = cbox(0.5, 0.55, 0.5, 0.06, M.armor); core.position.y = Y; b.add(core);
  const port = torus(0.14, 0.03, M.steel, 32); port.position.set(0, Y, 0.26); b.add(port);
  const r = reactor(0.11, 2.4); r.g.position.set(0, Y, 0.2); b.add(r.g);
  const rt = rotor(0.22); rt.g.position.y = Y - 0.42; b.add(rt.g);
  const crown = cbox(0.3, 0.08, 0.3, 0.02, M.dark); crown.position.y = Y + 0.32; b.add(crown);
  const gp = glyphPlate(0.18, 0.18); gp.position.set(0, Y + 0.12, 0.26); b.add(gp); gp.position.y = Y + 0.17; gp.scale.setScalar(0.8);
  const slabs = [-1, 1].map(sx => {
    const s = G(); b.add(s);
    const sl = cbox(0.2, 1.1, 0.9, 0.06, M.armor); s.add(sl);
    const face = cbox(0.04, 0.9, 0.7, 0.01, M.dark); face.position.x = -sx * 0.11; s.add(face);
    const seam = cbox(0.045, 0.9, 0.025, 0.004, M.glow); seam.position.x = -sx * 0.11; s.add(seam);
    for (const [y, z] of [[0.45, 0.35], [-0.45, 0.35], [0.45, -0.35], [-0.45, -0.35]]) { const bo = sphere(0.03, M.steel, 8); bo.position.set(-sx * 0.1, y, z); s.add(bo); }
    const rams = [0.22, -0.22].map(y => { const p = cyl(0.045, 0.045, 0.5, M.steel, 12); p.rotation.z = PI / 2; p.position.set(sx * 0.32, Y + y, 0); b.add(p);
      const sleeve = cyl(0.07, 0.07, 0.22, M.gun, 14); sleeve.rotation.z = PI / 2; sleeve.position.set(sx * 0.3, Y + y, 0); b.add(sleeve); return p; });
    return { s, sx, rams };
  });
  const flash = glowSprite(1.4); flash.position.set(0, Y, 0.5); b.add(flash);
  return { g, core: Y, update(t, act) { b.position.y = bob(t, 1, 0.03); r.spin(t); rt.fan.rotation.y = t * 26;
    const k = act < 0.75 ? 0 : act < 0.9 ? (act - 0.75) / 0.15 : 1 - (act - 0.9) / 0.1;
    slabs.forEach(S => { const X = 0.78 - 0.32 * ease(k), inner = X - 0.1, len = Math.max(0.05, inner - 0.25);
      S.s.position.set(S.sx * X, Y, 0.05); S.rams.forEach(p => { p.position.x = S.sx * (0.25 + len / 2); p.scale.y = len / 0.5; }); });
    flash.scale.setScalar(k > 0.9 ? 1.6 : 0.01); } };
});

form("gyro", { role: "brawler", name: "Saw Gyro", legs: "Melted into two counter-spinning saws",
  blurb: "The saw teeth that grew on its legs become two toothed rings that spin round an armoured gimbal in opposite directions, with the reactor caged at the centre. They spin faster the closer it gets.", every: 3 },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.45;
  const r = reactor(0.15, 2.6); r.g.position.y = Y; b.add(r.g);
  const cage = G(); cage.position.y = Y; b.add(cage);
  const g1 = torus(0.3, 0.04, M.armor, 40); cage.add(g1); const g2 = torus(0.3, 0.04, M.armor, 40); g2.rotation.y = PI / 2; cage.add(g2);
  for (const y of [0.32, -0.32]) { const cap = sphere(0.07, M.steel); cap.position.y = y; cage.add(cap); }
  const saw1 = G(); saw1.position.y = Y; saw1.rotation.x = PI / 2; b.add(saw1);
  saw1.add(gear(0.92, 0.72, 28, 0.05, M.steel)); const s1g = torus(0.74, 0.025, M.glow, 48); saw1.add(s1g);
  const s1r = torus(0.7, 0.05, M.armor, 48); saw1.add(s1r);
  for (let i = 0; i < 4; i++) { const sp = cbox(0.42, 0.05, 0.05, 0.01, M.gun); sp.position.set(Math.cos(i * PI / 2) * 0.48, Math.sin(i * PI / 2) * 0.48, 0); sp.rotation.z = i * PI / 2; saw1.add(sp); }
  const saw2 = G(); saw2.position.y = Y; saw2.rotation.set(PI / 2 - 0.5, 0, 0); b.add(saw2);
  saw2.add(gear(0.6, 0.46, 18, 0.04, M.steel)); saw2.add(torus(0.47, 0.03, M.glow, 40)); saw2.add(torus(0.45, 0.04, M.armor, 40));
  const rt = rotor(0.22); rt.g.position.y = Y - 0.62; b.add(rt.g);
  const mast = cyl(0.04, 0.06, 0.28, M.gun); mast.position.y = Y - 0.4; b.add(mast);
  return { g, core: Y, update(t, act) { b.position.y = bob(t, 2, 0.04); r.spin(t); rt.fan.rotation.y = t * 25;
    const sp = 1.5 + act * 6; saw1.rotation.z = t * sp; saw2.rotation.z = -t * sp * 1.3; cage.rotation.y = t * 0.8; cage.rotation.x = Math.sin(t) * 0.3; } };
});

form("bulwark", { role: "brawler", name: "Bulwark", legs: "Folded back into a shield frame",
  blurb: "A sentinel. A tall riveted tower shield on an armoured arm, a turret behind it with the reactor in a vertical slot, and rotor pods at its back. It braces the shield forward when it is hit and holds a lane for the squad.", every: 3.4 },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.4;
  const tur = cyl(0.3, 0.34, 0.6, M.armor, 10); tur.position.set(0, Y + 0.1, -0.2); b.add(tur);
  const dome = mesh(new T.SphereGeometry(0.3, 20, 10, 0, TAU, 0, PI / 2), M.dark, 0, Y + 0.4, -0.2); b.add(dome);
  const slot = cbox(0.06, 0.42, 0.06, 0.01, M.glow); slot.position.set(0, Y + 0.1, 0.12); b.add(slot);
  const r = reactor(0.1, 2.2); r.g.position.set(0, Y + 0.12, -0.05); b.add(r.g);
  const sh = G(); sh.position.set(0, Y - 0.05, 0.42); b.add(sh);
  const shield = plate([[-0.42, 0.62], [0.42, 0.62], [0.48, 0.1], [0, -0.78], [-0.48, 0.1]], 0.12, 0.03, M.armor); sh.add(shield);
  const face = plate([[-0.34, 0.54], [0.34, 0.54], [0.39, 0.1], [0, -0.66], [-0.39, 0.1]], 0.02, 0, M.dark); face.position.z = 0.065; sh.add(face);
  const seam = cbox(0.03, 1.1, 0.02, 0.004, M.glow); seam.position.set(0, -0.06, 0.08); sh.add(seam);
  const gp = glyphPlate(0.26, 0.26); gp.position.set(0, 0.22, 0.085); sh.add(gp);
  for (const [x, y] of [[-0.36, 0.55], [0.36, 0.55], [-0.42, 0.1], [0.42, 0.1], [-0.2, -0.36], [0.2, -0.36]]) { const bo = sphere(0.028, M.steel, 8); bo.position.set(x, y, 0.08); sh.add(bo); }
  const armL = cbox(0.08, 0.08, 0.5, 0.015, M.gun); armL.position.set(0, Y, 0.15); b.add(armL);
  for (const sx of [-1, 1]) { b.add(tube([[sx * 0.25, Y + 0.3, -0.3], [sx * 0.55, Y + 0.65, -0.45], [sx * 0.5, Y - 0.3, -0.5]], 0.035, M.dark));
    const rt = rotor(0.17); rt.g.position.set(sx * 0.35, Y - 0.35, -0.42); b.add(rt.g); }
  return { g, core: Y + 0.12, update(t, act) { b.position.y = bob(t, 3, 0.025); r.spin(t);
    const brace = act > 0.8 ? Math.sin((act - 0.8) / 0.2 * PI) : 0; sh.position.z = 0.42 + brace * 0.18; sh.rotation.x = -brace * 0.12; } };
});

form("oculus", { role: "sniper", name: "Oculus", legs: "Shed; rebuilt as the lens housing",
  blurb: "A great armoured ring stood on edge, plated and bolted, with a six-bladed iris inside. The reactor is the lens behind it. The iris opens slowly as it takes aim, then one thin beam fires through.", every: 3.2 },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.55;
  const eye = G(); eye.position.y = Y; b.add(eye);
  const ringM = torus(0.72, 0.13, M.armor, 64); eye.add(ringM);
  const lip = torus(0.6, 0.025, M.glow, 64); lip.position.z = 0.05; eye.add(lip);
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8, p = cbox(0.22, 0.12, 0.3, 0.02, M.dark); p.position.set(Math.cos(a) * 0.74, Math.sin(a) * 0.74, 0); p.rotation.z = a + PI / 2; eye.add(p); }
  bolts(eye, 0.84, 16, 0, 0.022, false);
  const iris = G(); iris.position.z = 0.02; eye.add(iris);
  const blades = [];
  for (let i = 0; i < 6; i++) { const piv = G(); piv.rotation.z = i * TAU / 6; iris.add(piv); const arm = G(); arm.position.x = 0.58; piv.add(arm);
    const bl = plate([[0, 0], [-0.08, 0.3], [-0.3, 0.33], [-0.26, 0.05]], 0.015, 0, M.gun); arm.add(bl); blades.push(arm); }
  const lens = mesh(new T.CircleGeometry(0.5, 40), M.glowSoft, 0, 0, -0.04); eye.add(lens);
  const r = reactor(0.16, 3); r.g.position.set(0, 0, -0.15); eye.add(r.g);
  const back = cyl(0.36, 0.5, 0.3, M.dark, 24); back.rotation.x = PI / 2; back.position.z = -0.25; eye.add(back);
  for (const sx of [-1, 1]) { const rt = rotor(0.2); rt.g.position.set(sx * 0.98, Y - 0.12, -0.05); b.add(rt.g); const st = cbox(0.18, 0.06, 0.06, 0.01, M.gun); st.position.set(sx * 0.86, Y - 0.12, -0.05); b.add(st); }
  const beam = cyl(0.025, 0.025, 4, M.glow, 8); beam.rotation.x = PI / 2; beam.position.set(0, 0, 2.1); eye.add(beam);
  return { g, core: Y, update(t, act) { b.position.y = bob(t, 1, 0.035); r.spin(t);
    const open = 0.15 + 0.8 * Math.min(1, act / 0.8); blades.forEach(a => a.rotation.z = -0.15 - open * 0.75);
    beam.visible = act > 0.86; lens.material.opacity = 0.25 + 0.4 * act; eye.rotation.y = Math.sin(t * 0.4) * 0.15; } };
});

form("railgun", { role: "sniper", name: "Railgun Spire", legs: "Three stabiliser fins",
  blurb: "Two long rails wrapped in glowing coils, angled up from a breech block that holds the reactor behind a window. Three fins steady it. The round charges in the breech and leaves along the rails in a streak.", every: 2.6 },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.15;
  const gun = G(); gun.position.y = Y + 0.1; gun.rotation.x = -0.45; b.add(gun);
  const breech = cbox(0.46, 0.46, 0.6, 0.05, M.armor); breech.position.z = -0.25; gun.add(breech);
  const win = cbox(0.2, 0.2, 0.62, 0.02, M.glowSoft); win.position.set(0, 0.17, -0.25); gun.add(win);
  const r = reactor(0.11, 2.6); r.g.position.set(0, 0.0, -0.3); gun.add(r.g);
  for (const sx of [-1, 1]) { const rail = cbox(0.08, 0.14, 1.4, 0.02, M.dark); rail.position.set(sx * 0.15, 0, 0.65); gun.add(rail);
    const inner = cbox(0.015, 0.1, 1.32, 0.004, M.glow); inner.position.set(sx * 0.105, 0, 0.68); gun.add(inner); }
  const coils = [];
  for (let i = 0; i < 4; i++) { const c = torus(0.27, 0.035, M.steel, 28); c.position.z = 0.2 + i * 0.32; gun.add(c); const cg = torus(0.27, 0.012, M.glow, 28); cg.position.z = 0.2 + i * 0.32 + 0.04; gun.add(cg); coils.push(cg); }
  const round = glowSprite(0.5); gun.add(round);
  const trail = cyl(0.03, 0.03, 3, M.glow, 8); trail.rotation.x = PI / 2; trail.position.z = 3.2; gun.add(trail);
  for (let i = 0; i < 3; i++) { const fin = plate([[0, 0], [0.42, -0.1], [0.36, -0.42], [0.06, -0.2]], 0.03, 0.006, M.armor); const piv = G(); piv.rotation.z = i * TAU / 3 + PI / 2; piv.position.z = -0.5; piv.add(fin); fin.position.x = 0.2; gun.add(piv); }
  const rt = rotor(0.24); rt.g.position.y = Y - 0.45; b.add(rt.g);
  const mount = cyl(0.06, 0.1, 0.32, M.gun); mount.position.y = Y - 0.25; b.add(mount);
  return { g, core: Y, update(t, act) { b.position.y = bob(t, 2, 0.03); r.spin(t); rt.fan.rotation.y = t * 26;
    const fire = act > 0.88; round.position.z = fire ? -0.1 + (act - 0.88) / 0.12 * 2.2 : -0.3; round.scale.setScalar(0.3 + act * 0.5);
    trail.visible = fire && act > 0.92; coils.forEach((c, i) => c.visible = act * 4 > i); } };
});

form("trilens", { role: "sniper", name: "Tri-Lens Array", legs: "Three lens struts",
  blurb: "Three armoured lens pods on struts around a small reactor housing, all angled at one point ahead. Each lens lights in turn, and the three beams cross on the target.", every: 3 },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const hub = sphere(0.28, M.armor, 28); hub.position.y = Y; b.add(hub);
  const hubRing = torus(0.29, 0.03, M.steel, 32); hubRing.position.y = Y; b.add(hubRing);
  const r = reactor(0.1, 2.4); r.g.position.set(0, Y, 0.2); b.add(r.g);
  const port = torus(0.11, 0.025, M.glow, 24); port.position.set(0, Y, 0.27); b.add(port);
  const focus = new T.Vector3(0, Y, 2.4);
  const pods = [0, 1, 2].map(i => {
    const a = i * TAU / 3 + PI / 2, x = Math.cos(a) * 0.72, y = Y + Math.sin(a) * 0.72;
    b.add(tube([[0, Y, 0], [x * 0.5, (Y + y) / 2 + 0.05, -0.1], [x, y, 0]], 0.04, M.dark));
    const pod = G(); pod.position.set(x, y, 0); pod.lookAt(focus); b.add(pod);
    const body = cyl(0.14, 0.18, 0.4, M.armor, 16); body.rotation.x = PI / 2; pod.add(body);
    const lensRing = torus(0.14, 0.03, M.steel, 24); lensRing.position.z = 0.2; pod.add(lensRing);
    const lens = mesh(new T.CircleGeometry(0.12, 24), M.glowSoft, 0, 0, 0.21); pod.add(lens);
    const fin = cbox(0.02, 0.22, 0.2, 0.004, M.gun); fin.position.z = -0.2; pod.add(fin);
    const dist = focus.distanceTo(new T.Vector3(x, y, 0)) - 0.2;
    const beam = cyl(0.015, 0.015, 1, M.glow, 6); beam.rotation.x = PI / 2; beam.scale.y = dist; beam.position.z = 0.2 + dist / 2; pod.add(beam);
    return { pod, beam, x, y, lens };
  });
  const hit = glowSprite(0.8); hit.position.copy(focus); b.add(hit);
  return { g, core: Y, update(t, act) { b.position.y = bob(t, 0, 0.035); r.spin(t); b.rotation.z = Math.sin(t * 0.5) * 0.04;
    pods.forEach((p, i) => { p.beam.visible = act > 0.6 + i * 0.08; });
    hit.scale.setScalar(act > 0.84 ? 0.9 : 0.01); } };
});

form("anchor", { role: "camper", name: "Anchor Turret", legs: "Hydraulic stakes driven into the floor",
  blurb: "When it decides to stay, it digs in. Its legs become three hydraulic stakes that drive into the floor and pump, and the turret head they carry turns the reactor's light through a ring of slots. It cannot be moved.", every: 3 },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.45;
  const head = cyl(0.4, 0.46, 0.4, M.armor, 6); head.position.y = Y; b.add(head);
  const cap = cyl(0.26, 0.4, 0.16, M.dark, 6); cap.position.y = Y + 0.28; b.add(cap);
  const top = cyl(0.08, 0.12, 0.2, M.gun, 12); top.position.y = Y + 0.45; b.add(top);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6 + PI / 6, s = cbox(0.05, 0.22, 0.05, 0.008, M.glow); s.position.set(Math.cos(a) * 0.43, Y, Math.sin(a) * 0.43); b.add(s); }
  const r = reactor(0.15, 2.6); r.g.position.y = Y; b.add(r.g);
  const rim = torus(0.47, 0.03, M.steel, 6); rim.rotation.x = PI / 2; rim.position.y = Y - 0.21; b.add(rim);
  const legs = [0, 1, 2].map(i => {
    const a = i * TAU / 3 + PI / 6, c = Math.cos(a), s = Math.sin(a);
    const hip = new T.Vector3(c * 0.35, Y - 0.2, s * 0.35), foot = new T.Vector3(c * 0.95, 0, s * 0.95);
    const dir = foot.clone().sub(hip), L = dir.length();
    const piv = G(); piv.position.copy(hip); piv.quaternion.setFromUnitVectors(new T.Vector3(0, -1, 0), dir.clone().normalize()); b.add(piv);
    const sleeve = cyl(0.07, 0.07, L * 0.55, M.armor, 14); sleeve.position.y = -L * 0.27; piv.add(sleeve);
    const band = torus(0.072, 0.012, M.glow, 18); band.rotation.x = PI / 2; band.position.y = -L * 0.52; piv.add(band);
    const rod = cyl(0.035, 0.035, L * 0.55, M.steel, 10); piv.add(rod);
    const clamp = cyl(0.12, 0.06, 0.08, M.dark, 8); clamp.position.copy(foot).add(new T.Vector3(0, 0.04, 0)); b.add(clamp);
    const spike = mesh(new T.ConeGeometry(0.05, 0.3, 6), M.gun); spike.rotation.x = PI; spike.position.copy(foot).add(new T.Vector3(0, -0.1, 0)); b.add(spike);
    const ring = torus(0.18, 0.012, M.glow, 24); ring.rotation.x = PI / 2; ring.position.copy(foot).add(new T.Vector3(0, 0.005, 0)); b.add(ring);
    b.add(tube([[c * 0.4, Y + 0.05, s * 0.4], [c * 0.75, Y - 0.2, s * 0.75], [c * 0.92, 0.12, s * 0.92]], 0.018, M.rubber));
    return { rod, L };
  });
  return { g, core: Y, update(t, act) { r.spin(t); head.rotation.y = t * 0.4; cap.rotation.y = t * 0.4;
    legs.forEach((l, i) => l.rod.position.y = -l.L * 0.6 - Math.sin(t * 2 + i * 2) * 0.02 - (act > 0.85 ? 0.05 : 0)); } };
});

form("bunker", { role: "camper", name: "Bunker Bloom", legs: "Shed; armoured petals rise from a base ring",
  blurb: "An armoured base ring bolted to the floor with six hinged plates around it. The plates close like a bud. When enemies come near they swing open on their rams and the reactor rises out on a piston column.", every: 4 },
() => {
  const g = G(), b = G(); g.add(b);
  const base = cyl(0.78, 0.86, 0.18, M.armor, 6); base.position.y = 0.09; b.add(base);
  const bring = torus(0.8, 0.025, M.glow, 6); bring.rotation.x = PI / 2; bring.rotation.z = PI / 6; bring.position.y = 0.19; b.add(bring);
  bolts(b, 0.7, 12, 0.19, 0.025, true);
  const col = G(); b.add(col);
  const columnS = cyl(0.12, 0.16, 0.5, M.gun, 12); columnS.position.y = 0.4; b.add(columnS);
  const rod = cyl(0.07, 0.07, 0.6, M.steel, 12); rod.position.y = 0.6; col.add(rod);
  const cup = cyl(0.2, 0.1, 0.12, M.dark, 12); cup.position.y = 0.9; col.add(cup);
  const r = reactor(0.17, 2.8); r.g.position.y = 1.08; col.add(r.g);
  const petals = [];
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6, hinge = G(); hinge.position.set(Math.cos(a) * 0.62, 0.2, Math.sin(a) * 0.62); hinge.rotation.y = -a + PI / 2; b.add(hinge);
    const leaf = G(); hinge.add(leaf);
    const p = plate([[-0.3, 0], [0.3, 0], [0.24, 0.9], [0, 1.15], [-0.24, 0.9]], 0.07, 0.015, M.armor); p.position.z = 0; leaf.add(p);
    const seam = cbox(0.025, 0.8, 0.02, 0.004, M.glow); seam.position.set(0, 0.5, -0.04); leaf.add(seam);
    const gp = glyphPlate(0.16, 0.16); gp.position.set(0, 0.42, 0.045); leaf.add(gp);
    petals.push(leaf); }
  return { g, core: 1.08, update(t, act) { r.spin(t);
    const open = act < 0.5 ? 0 : act < 0.65 ? ease((act - 0.5) / 0.15) : act < 0.9 ? 1 : 1 - (act - 0.9) / 0.1;
    petals.forEach(p => p.rotation.x = -0.32 + open * 0.95); col.position.y = open * 0.45; } };
});

// ── TWENTY MORE (unassigned) ─────────────────────────────────────────────
const _UP = new T.Vector3(0, 1, 0);
function limb(r, mat) { return cyl(r, r, 1, mat || M.armor, 12); }
function setLink(m, a, b) { const d = new T.Vector3().subVectors(b, a), L = d.length(); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(_UP, d.multiplyScalar(1 / (L || 1))); m.scale.set(1, L || 0.001, 1); }
const V = (x, y, z) => new T.Vector3(x, y, z);

form("s13", { legs: "Gone; two hinged jaws in their place", every: 2.6,
  desc: "An armoured head with an upper and a lower jaw on hinges and two lit eye slits. The jaws part to show the reactor inside, then snap shut. A rotor holds it up." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const skull = cbox(0.62, 0.34, 0.62, 0.06, M.armor); skull.position.set(0, Y + 0.08, -0.2); b.add(skull);
  const crest = cbox(0.12, 0.14, 0.62, 0.03, M.dark); crest.position.set(0, Y + 0.3, -0.2); b.add(crest);
  for (const sx of [-1, 1]) { const e = cbox(0.16, 0.035, 0.03, 0.008, M.glow); e.position.set(sx * 0.18, Y + 0.18, 0.12); e.rotation.z = -sx * 0.25; b.add(e); }
  const jaw = (up) => { const h = G(); h.position.set(0, Y + (up ? 0.02 : -0.06), 0.08); b.add(h);
    const p = cbox(0.56, 0.09, 0.5, 0.025, up ? M.armor : M.dark); p.position.set(0, up ? 0.0 : -0.04, 0.25); h.add(p);
    for (let i = 0; i < 5; i++) { const tth = mesh(new T.ConeGeometry(0.035, 0.1, 4), M.steel); tth.position.set(-0.2 + i * 0.1, up ? -0.08 : 0.04, 0.46); if (up) tth.rotation.x = PI; h.add(tth); }
    return h; };
  const top = jaw(true), bot = jaw(false);
  const r = reactor(0.12, 2.4); r.g.position.set(0, Y - 0.02, 0.2); b.add(r.g);
  const rt = rotor(0.24); rt.g.position.y = Y - 0.42; b.add(rt.g);
  return { g, core: Y, update(t, act) { b.position.y = bob(t, 1, 0.04); r.spin(t); rt.fan.rotation.y = t * 24;
    const open = act < 0.6 ? 0.15 + 0.15 * Math.sin(t * 2) : act < 0.85 ? ease((act - 0.6) / 0.25) : 1 - ease((act - 0.85) / 0.15);
    top.rotation.x = -open * 0.55; bot.rotation.x = open * 0.45; } };
});

form("s14", { legs: "Straightened into a square frame",
  desc: "A square gate of girders that turns slowly. The reactor hangs in the middle of it on four cables. Rotors under its two lower corners." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.55, F = G(); F.position.y = Y; b.add(F);
  for (const y of [0.72, -0.72]) { const gi = cbox(1.36, 0.1, 0.14, 0.02, M.armor); gi.position.y = y; F.add(gi); }
  for (const x of [0.64, -0.64]) { const gi = cbox(0.1, 1.36, 0.14, 0.02, M.armor); gi.position.x = x; F.add(gi); }
  for (const x of [0.64, -0.64]) for (const y of [0.72, -0.72]) { const c = cbox(0.2, 0.2, 0.2, 0.03, M.gun); c.position.set(x, y, 0); F.add(c);
    const cab = limb(0.012, M.rubber); setLink(cab, V(x * 0.9, y * 0.88, 0), V(x * 0.12, y * 0.12, 0)); F.add(cab); }
  for (const s of [1, -1]) { const gl = cbox(1.1, 0.02, 0.02, 0.004, M.glow); gl.position.set(0, s * 0.64, 0.08); F.add(gl); const gv = cbox(0.02, 1.2, 0.02, 0.004, M.glow); gv.position.set(s * 0.56, 0, 0.08); F.add(gv); }
  const collar = torus(0.14, 0.03, M.steel, 24); F.add(collar);
  const r = reactor(0.14, 2.6); F.add(r.g);
  const rots = [0.64, -0.64].map(x => { const rt = rotor(0.17); rt.g.position.set(x, -0.95, 0); F.add(rt.g); return rt; });
  return { g, core: Y, update(t) { b.position.y = bob(t, 2, 0.04); r.spin(t); F.rotation.y = t * 0.45; collar.rotation.y = t; rots.forEach(rt => rt.fan.rotation.y = t * 25); } };
});

form("s15", { legs: "Unrolled into a segmented spine",
  desc: "A flying spine of six armoured hex segments that ripples as it moves, a fin on each. The reactor sits behind a port in the head segment." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.45, N = 6;
  const segs = [];
  for (let i = 0; i < N; i++) { const s = G(); b.add(s); const r0 = 0.27 - i * 0.03;
    const body = cyl(r0, r0 * 0.9, 0.3, i ? M.armor : M.dark, 6); body.rotation.x = PI / 2; s.add(body);
    const rim = torus(r0 * 0.95, 0.018, i ? M.steel : M.glow, 6); rim.position.z = 0.15; rim.rotation.z = PI / 6; s.add(rim);
    const fin = plate([[0, 0], [0.06, 0.2], [-0.12, 0.22], [-0.16, 0]], 0.025, 0, M.gun); fin.rotation.y = PI / 2; fin.position.set(0, r0 * 0.85, 0); s.add(fin);
    segs.push(s); }
  const r = reactor(0.12, 2.4); r.g.position.z = 0.16; segs[0].add(r.g);
  const port = torus(0.13, 0.03, M.steel, 24); port.position.z = 0.17; segs[0].add(port);
  // One beat (2.2 rad/s) drives the whole ripple and the bob, so the sheet loops; `act` rears the head up.
  return { g, core: Y, update(t, act) { r.spin(t); const a = act || 0, rear = a > 0.6 ? Math.sin(Math.min(1, (a - 0.6) / 0.4) * PI) : 0;
    segs.forEach((s, i) => { const ph = t * 2.2 - i * 0.75; s.position.set(Math.sin(ph) * 0.14 * (i / N + 0.2), Y + Math.sin(t * 2.2 - i * 0.6) * 0.07 + rear * 0.3 * (1 - i / N) * (1 - i / N), 0.75 - i * 0.32 - rear * 0.12 * (1 - i / N));
      s.rotation.y = Math.cos(ph) * 0.35 * (i / N + 0.2); s.rotation.x = -rear * 0.5 * (1 - i / N); }); } };
});

form("s16", { legs: "Kept, and stretched into stilts", every: 3,
  desc: "It keeps three legs and grows them long: a tripod on hydraulic stilts with an armoured head held high, a lit visor ring and the reactor in a front port. It steps one leg at a time." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 2.05;
  const head = sphere(0.3, M.armor, 28); head.scale.y = 0.75; head.position.y = Y; b.add(head);
  const brow = torus(0.3, 0.025, M.glow, 40); brow.rotation.x = PI / 2; brow.position.y = Y + 0.04; b.add(brow);
  const belly = cyl(0.2, 0.12, 0.14, M.dark, 12); belly.position.y = Y - 0.25; b.add(belly);
  const port = torus(0.1, 0.025, M.steel, 20); port.position.set(0, Y - 0.04, 0.28); b.add(port);
  const r = reactor(0.08, 2); r.g.position.set(0, Y - 0.04, 0.24); b.add(r.g);
  const legs = [0, 1, 2].map(i => { const a = i * TAU / 3 + PI / 2, thigh = limb(0.05, M.armor), shin = limb(0.035, M.steel), knee = sphere(0.06, M.gun), foot = cyl(0.09, 0.11, 0.05, M.dark, 8);
    b.add(thigh, shin, knee, foot); return { a, thigh, shin, knee, foot }; });
  return { g, core: Y - 0.04, update(t, act) { r.spin(t); const hy = Y + Math.sin(t * 2) * 0.03; head.position.y = hy; brow.position.y = hy + 0.04; belly.position.y = hy - 0.25; port.position.y = hy - 0.04; r.g.position.y = hy - 0.04;
    legs.forEach((L, i) => { const c = Math.cos(L.a), s = Math.sin(L.a);
      const lift = Math.max(0, Math.sin(t * 2.4 - i * 2.1)) * 0.22;
      const hip = V(c * 0.2, hy - 0.2, s * 0.2), foot = V(c * 1.05, lift, s * 1.05), knee = V(c * 0.82, hy + 0.32 + lift * 0.5, s * 0.82);
      setLink(L.thigh, hip, knee); setLink(L.shin, knee, foot); L.knee.position.copy(knee); L.foot.position.copy(foot).add(V(0, 0.025, 0)); }); } };
});

form("s17", { legs: "Flattened into six orbiting plates", every: 4,
  desc: "Six curved armour plates circle the bare reactor. Every few seconds they slam together into a closed sphere, lit seams showing between them, then spread open again." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const r = reactor(0.17, 2.8); r.g.position.y = Y; b.add(r.g);
  const gim = torus(0.24, 0.02, M.steel, 32); gim.position.y = Y; b.add(gim);
  const orbit = G(); orbit.position.y = Y; b.add(orbit);
  const plates = [];
  for (let p = 0; p < 3; p++) for (let q = 0; q < 2; q++) {
    const ps = p * TAU / 3 + 0.06, pl = TAU / 3 - 0.12, ts = q * PI / 2 + 0.06, tl = PI / 2 - 0.12;
    const m = mesh(new T.SphereGeometry(0.46, 18, 10, ps, pl, ts, tl), M.armor); m.material = M.armor;
    const pm = ps + pl / 2, tm = ts + tl / 2, dir = V(-Math.cos(pm) * Math.sin(tm), Math.cos(tm), Math.sin(pm) * Math.sin(tm));
    const h = G(); h.add(m); orbit.add(h);
    const seam = mesh(new T.SphereGeometry(0.465, 18, 2, ps + pl * 0.15, pl * 0.7, tm - 0.02, 0.04), M.glow); h.add(seam);
    plates.push({ h, dir });
  }
  return { g, core: Y, update(t, act) { b.position.y = bob(t, 0, 0.04); r.spin(t); gim.rotation.x = t;
    const shut = act > 0.6 && act < 0.85 ? 1 : act > 0.5 && act <= 0.6 ? ease((act - 0.5) / 0.1) : act >= 0.85 && act < 0.95 ? 1 - ease((act - 0.85) / 0.1) : 0;
    plates.forEach(P => P.h.position.copy(P.dir).multiplyScalar(0.42 * (1 - shut)));
    orbit.rotation.y = t * 0.7 * (1 - shut) + 0.3; } };
});

form("s18", { legs: "Twisted together into a drill",
  desc: "An octagonal armoured body over a long fluted drill bit that spins under it. A crown of prongs on top holds the reactor. Two side exhausts glow." , every: 3 },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.55;
  const body = cyl(0.42, 0.34, 0.42, M.armor, 8); body.position.y = Y; b.add(body);
  const band = torus(0.43, 0.025, M.glow, 8); band.rotation.x = PI / 2; band.rotation.z = PI / 8; band.position.y = Y + 0.12; b.add(band);
  const lid = cyl(0.3, 0.42, 0.1, M.dark, 8); lid.position.y = Y + 0.26; b.add(lid);
  for (let i = 0; i < 4; i++) { const a = i * PI / 2 + PI / 4, p = cbox(0.06, 0.32, 0.06, 0.012, M.gun); p.position.set(Math.cos(a) * 0.2, Y + 0.45, Math.sin(a) * 0.2); p.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3); b.add(p); }
  const r = reactor(0.12, 2.4); r.g.position.y = Y + 0.5; b.add(r.g);
  const drill = G(); drill.position.y = Y - 0.21; b.add(drill);
  const cone = mesh(new T.ConeGeometry(0.3, 0.95, 18), M.gun); cone.rotation.x = PI; cone.position.y = -0.47; drill.add(cone);
  const helix = []; for (let i = 0; i <= 40; i++) { const k = i / 40, a = k * TAU * 3, rr = 0.3 * (1 - k) + 0.02; helix.push([Math.cos(a) * rr, -k * 0.92, Math.sin(a) * rr]); }
  drill.add(tube(helix, 0.025, M.steel));
  for (const sx of [-1, 1]) { const ex = cyl(0.06, 0.09, 0.22, M.dark, 10); ex.rotation.z = sx * 1.2; ex.position.set(sx * 0.48, Y + 0.05, -0.1); b.add(ex); const f = glowSprite(0.35); f.position.set(sx * 0.6, Y + 0.12, -0.1); b.add(f); }
  return { g, core: Y + 0.5, update(t, act) { b.position.y = bob(t, 1, 0.03); r.spin(t); drill.rotation.y = t * (6 + act * 18); } };
});

form("s19", { legs: "Folded into turbine vanes", every: 3,
  desc: "A jet turbine stood on end: a thick armoured duct with fixed vanes and a spinning rotor, the reactor burning at the hub. It spools up and the rotor blurs." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.55, J = G(); J.position.y = Y; b.add(J);
  J.add(torus(0.66, 0.14, M.armor, 56)); const lip = torus(0.54, 0.02, M.glow, 56); lip.position.z = 0.1; J.add(lip);
  for (let i = 0; i < 8; i++) { const a = i * TAU / 8, v = cbox(0.5, 0.05, 0.08, 0.01, M.dark); v.position.set(Math.cos(a) * 0.32, Math.sin(a) * 0.32, -0.08); v.rotation.z = a; J.add(v); }
  const rot = G(); J.add(rot);
  for (let i = 0; i < 11; i++) { const a = i * TAU / 11, bl = cbox(0.42, 0.035, 0.12, 0.008, M.steel); const arm = G(); arm.rotation.z = a; bl.position.x = 0.32; bl.rotation.x = 0.5; arm.add(bl); rot.add(arm); }
  const hub = cyl(0.13, 0.17, 0.3, M.gun, 16); hub.rotation.x = PI / 2; J.add(hub);
  const r = reactor(0.09, 2.4); r.g.position.z = 0.18; J.add(r.g);
  const strut = cbox(0.08, 0.5, 0.08, 0.015, M.gun); strut.position.y = Y - 0.9; b.add(strut);
  const rt = rotor(0.2); rt.g.position.y = Y - 1.15; b.add(rt.g);
  return { g, core: Y, update(t, act) { b.position.y = bob(t, 3, 0.03); r.spin(t); rot.rotation.z = t * (3 + act * 20); rt.fan.rotation.y = t * 24; J.rotation.y = Math.sin(t * 0.5) * 0.3; } };
});

form("s20", { legs: "Kept as four folded landing legs",
  desc: "A flat armoured disc with a raised dome and the reactor floating in an open ring above it. Four jointed legs hang folded under it like landing gear and paddle the air. A rotor sits in its belly." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.4;
  const disc = cyl(0.55, 0.46, 0.18, M.armor, 16); disc.position.y = Y; b.add(disc);
  const rim = torus(0.55, 0.025, M.glow, 48); rim.rotation.x = PI / 2; rim.position.y = Y + 0.06; b.add(rim);
  const dome = mesh(new T.SphereGeometry(0.32, 24, 12, 0, TAU, 0, PI / 2), M.dark, 0, Y + 0.09); b.add(dome);
  const ring = torus(0.2, 0.03, M.steel, 28); ring.rotation.x = PI / 2; ring.position.y = Y + 0.52; b.add(ring);
  const r = reactor(0.12, 2.4); r.g.position.y = Y + 0.58; b.add(r.g);
  const rt = rotor(0.26); rt.g.position.y = Y - 0.18; b.add(rt.g);
  const legs = [0, 1, 2, 3].map(i => { const a = i * PI / 2 + PI / 4, up = limb(0.04, M.armor), lo = limb(0.03, M.steel), k = sphere(0.05, M.gun), toe = mesh(new T.ConeGeometry(0.04, 0.12, 6), M.dark);
    b.add(up, lo, k, toe); return { a, up, lo, k, toe }; });
  return { g, core: Y + 0.58, update(t) { b.position.y = bob(t, 2, 0.04); r.spin(t); rt.fan.rotation.y = t * 25; ring.rotation.z = t;
    legs.forEach((L, i) => { const c = Math.cos(L.a), s = Math.sin(L.a), sw = Math.sin(t * 2 + i) * 0.08;
      const hip = V(c * 0.45, Y - 0.05, s * 0.45), knee = V(c * (0.85 + sw), Y + 0.1, s * (0.85 + sw)), foot = V(c * 0.72, Y - 0.6, s * 0.72);
      setLink(L.up, hip, knee); setLink(L.lo, knee, foot); L.k.position.copy(knee); L.toe.position.copy(foot); L.toe.rotation.x = PI; }); } };
});

form("s21", { legs: "Melted down into a chain and a weight",
  desc: "A small four-rotor drone carrying the reactor on its back, with a spiked iron ball swinging under it on a chain. The ball has a lit seam round its middle." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 2.35;
  const body = cbox(0.5, 0.16, 0.5, 0.04, M.armor); body.position.y = Y; b.add(body);
  for (const [x, z] of [[0.38, 0.38], [-0.38, 0.38], [0.38, -0.38], [-0.38, -0.38]]) { const arm = cbox(0.3, 0.05, 0.06, 0.01, M.gun); arm.position.set(x * 0.6, Y, z * 0.6); arm.rotation.y = Math.atan2(-z, x); b.add(arm); const rt = rotor(0.15); rt.g.position.set(x, Y + 0.04, z); b.add(rt.g); body.userData[x + "," + z] = rt; }
  const ring = torus(0.15, 0.03, M.steel, 24); ring.rotation.x = PI / 2; ring.position.y = Y + 0.12; b.add(ring);
  const r = reactor(0.1, 2.2); r.g.position.y = Y + 0.24; b.add(r.g);
  const sw = G(); sw.position.y = Y - 0.08; b.add(sw);
  for (let i = 0; i < 7; i++) { const l = torus(0.045, 0.014, M.steel, 12); l.position.y = -0.06 - i * 0.11; l.rotation.y = i % 2 ? PI / 2 : 0; sw.add(l); }
  const ball = G(); ball.position.y = -1.05; sw.add(ball);
  ball.add(sphere(0.24, M.dark, 24)); const seam = torus(0.245, 0.018, M.glow, 40); seam.rotation.x = PI / 2; ball.add(seam);
  for (let i = 0; i < 10; i++) { const u = (i + 0.5) / 10, th = Math.acos(1 - 2 * u), ph = i * 2.4; const d = V(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    const sp = mesh(new T.ConeGeometry(0.05, 0.18, 6), M.steel); sp.position.copy(d).multiplyScalar(0.28); sp.quaternion.setFromUnitVectors(_UP, d); ball.add(sp); }
  const rotors = Object.values(body.userData);
  return { g, core: Y + 0.24, update(t) { b.position.y = bob(t, 1, 0.04); r.spin(t); rotors.forEach((rt, i) => rt.fan.rotation.y = t * 26 * (i % 2 ? 1 : -1));
    sw.rotation.z = Math.sin(t * 1.5) * 0.35; sw.rotation.x = Math.sin(t * 1.1) * 0.15; ball.rotation.y = t; } };
});

form("s22", { legs: "Cut down to three stubby feet", every: 3.2,
  desc: "It stays on the ground: a squat hexagonal body on three short feet, with a fat barrel on a turret ring angled up. The reactor glows in a port at its front. The barrel kicks back when it fires." },
() => {
  const g = G(), b = G(); g.add(b);
  const base = cyl(0.55, 0.62, 0.36, M.armor, 6); base.position.y = 0.5; b.add(base);
  const skirt = torus(0.6, 0.025, M.glow, 6); skirt.rotation.x = PI / 2; skirt.rotation.z = PI / 6; skirt.position.y = 0.36; b.add(skirt);
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + PI / 6, f = cbox(0.18, 0.34, 0.22, 0.03, M.dark); f.position.set(Math.cos(a) * 0.55, 0.17, Math.sin(a) * 0.55); f.rotation.y = -a; b.add(f); }
  const tring = torus(0.4, 0.04, M.steel, 40); tring.rotation.x = PI / 2; tring.position.y = 0.7; b.add(tring);
  const tur = G(); tur.position.y = 0.78; b.add(tur);
  const piv = G(); piv.rotation.x = -0.75; tur.add(piv);
  const barrel = G(); piv.add(barrel);
  const bar = cyl(0.2, 0.24, 0.9, M.gun, 20); bar.position.y = 0.4; barrel.add(bar);
  const muz = torus(0.21, 0.035, M.glow, 28); muz.rotation.x = PI / 2; muz.position.y = 0.86; barrel.add(muz);
  const hoop = torus(0.25, 0.04, M.steel, 28); hoop.rotation.x = PI / 2; hoop.position.y = 0.25; barrel.add(hoop);
  const flash = glowSprite(0.9); flash.position.y = 1.0; barrel.add(flash);
  for (const sx of [-1, 1]) { const ram = cyl(0.04, 0.04, 0.4, M.steel, 10); ram.position.set(sx * 0.28, 0.15, 0); barrel.add(ram); }
  const port = torus(0.11, 0.025, M.steel, 20); port.position.set(0, 0.52, 0.56); b.add(port);
  const r = reactor(0.09, 2.4); r.g.position.set(0, 0.52, 0.5); b.add(r.g);
  return { g, core: 0.52, update(t, act) { r.spin(t); tur.rotation.y = Math.sin(t * 0.4) * 0.6;
    const k = act > 0.85 ? 1 - (act - 0.85) / 0.15 : 0; barrel.position.y = -k * 0.18; flash.scale.setScalar(k > 0.6 ? 1.1 : 0.01); } };
});

form("s23", { legs: "Split into two linked pods",
  desc: "Two armoured pods on the ends of a beam, each with its own rotor, turning slowly round the reactor at the centre like a pair of stars." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.5, S = G(); S.position.y = Y; b.add(S);
  const beam = cbox(1.5, 0.08, 0.1, 0.02, M.gun); S.add(beam);
  const hubR = torus(0.17, 0.035, M.steel, 28); hubR.rotation.y = PI / 2; S.add(hubR);
  const r = reactor(0.13, 2.6); S.add(r.g);
  const pods = [-1, 1].map(sx => { const p = G(); p.position.x = sx * 0.78; S.add(p);
    p.add(sphere(0.25, M.armor, 28)); const eq = torus(0.255, 0.02, M.glow, 40); eq.rotation.x = PI / 2; p.add(eq);
    const cap = cyl(0.12, 0.16, 0.1, M.dark, 12); cap.position.y = 0.24; p.add(cap);
    const rt = rotor(0.16); rt.g.position.y = -0.32; p.add(rt.g); return { p, rt }; });
  return { g, core: Y, update(t) { b.position.y = bob(t, 2, 0.04); r.spin(t); S.rotation.y = t * 0.8; hubR.rotation.x = t;
    pods.forEach((P, i) => { P.p.rotation.z = Math.sin(t * 1.3 + i) * 0.1; P.rt.fan.rotation.y = t * 25; }); } };
});

form("s24", { legs: "Fused into one tapered shaft",
  desc: "A tall black obelisk floating just off the floor, with a lit slit down one face. The reactor hovers in the gap between the shaft and a floating capstone. Armour plates on its sides slide up and down." },
() => {
  const g = G(), b = G(); g.add(b);
  const shaft = cyl(0.17, 0.3, 1.5, M.armor, 4); shaft.position.y = 1.05; b.add(shaft);
  for (let i = 0; i < 2; i++) { const a = i * PI + PI / 4, sl = cbox(0.04, 1.1, 0.04, 0.008, M.glow); sl.position.set(Math.cos(a) * 0.17, 1.0, Math.sin(a) * 0.17); sl.rotation.y = -a; sl.rotation.z = 0; b.add(sl); }
  const plates = [0, 1, 2, 3].map(i => { const a = i * PI / 2, p = cbox(0.24, 0.5, 0.03, 0.01, M.dark); p.position.set(Math.cos(a + PI / 4) * 0.24, 0.8, Math.sin(a + PI / 4) * 0.24); p.rotation.y = -(a + PI / 4) + PI / 2; p.rotation.x = 0; b.add(p); return p; });
  const cap = mesh(new T.ConeGeometry(0.2, 0.36, 4), M.armor); cap.position.y = 2.22; b.add(cap);
  const capR = torus(0.15, 0.015, M.glow, 4); capR.rotation.x = PI / 2; capR.position.y = 2.05; b.add(capR);
  const r = reactor(0.12, 2.6); r.g.position.y = 1.93; b.add(r.g);
  const base = cyl(0.3, 0.2, 0.08, M.dark, 4); base.position.y = 0.26; b.add(base);
  return { g, core: 1.93, update(t) { b.position.y = bob(t, 0, 0.05); r.spin(t); b.rotation.y = t * 0.2; cap.rotation.y = -t * 0.8; capR.rotation.z = t * 0.8;
    plates.forEach((p, i) => p.position.y = 0.85 + Math.sin(t * 1.5 + i * PI / 2) * 0.18); } };
});

form("s25", { legs: "Rebuilt as three crane fingers", every: 3,
  desc: "A boxy drone on two rotors, with a three-fingered claw hanging from it on a cable. The fingers open wide and close. The reactor rides on top in a ring." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 2.3;
  const body = cbox(0.6, 0.26, 0.42, 0.05, M.armor); body.position.y = Y; b.add(body);
  const vis = cbox(0.4, 0.04, 0.03, 0.008, M.glow); vis.position.set(0, Y + 0.02, 0.22); b.add(vis);
  const rots = [-1, 1].map(sx => { const st = cbox(0.2, 0.05, 0.06, 0.01, M.gun); st.position.set(sx * 0.4, Y + 0.05, 0); b.add(st); const rt = rotor(0.18); rt.g.position.set(sx * 0.58, Y + 0.08, 0); b.add(rt.g); return rt; });
  const ring = torus(0.14, 0.03, M.steel, 24); ring.rotation.x = PI / 2; ring.position.y = Y + 0.18; b.add(ring);
  const r = reactor(0.1, 2.2); r.g.position.y = Y + 0.28; b.add(r.g);
  const cable = limb(0.012, M.rubber); b.add(cable);
  const hub = G(); b.add(hub); hub.add(cyl(0.14, 0.18, 0.16, M.gun, 12)); const hr = torus(0.16, 0.015, M.glow, 20); hr.rotation.x = PI / 2; hub.add(hr);
  const fingers = [0, 1, 2].map(i => { const a = i * TAU / 3, l1 = limb(0.035, M.armor), l2 = limb(0.028, M.steel), k = sphere(0.04, M.gun); hub.add(l1, l2, k); return { a, l1, l2, k }; });
  return { g, core: Y + 0.28, update(t, act) { b.position.y = bob(t, 3, 0.04); r.spin(t); rots.forEach(rt => rt.fan.rotation.y = t * 25);
    const swing = Math.sin(t * 1.2) * 0.08, hy = Y - 1.0; hub.position.set(swing, hy, 0); setLink(cable, V(0, Y - 0.13, 0), V(swing, hy + 0.08, 0));
    const open = act < 0.7 ? 1 : act < 0.85 ? 1 - ease((act - 0.7) / 0.15) : ease((act - 0.85) / 0.15);
    fingers.forEach(F => { const c = Math.cos(F.a), s = Math.sin(F.a), knee = V(c * (0.2 + open * 0.18), -0.22, s * (0.2 + open * 0.18)), tip = V(c * (0.06 + open * 0.2), -0.5, s * (0.06 + open * 0.2));
      setLink(F.l1, V(c * 0.12, -0.06, s * 0.12), knee); setLink(F.l2, knee, tip); F.k.position.copy(knee); }); } };
});

form("s26", { legs: "Grown into a split carapace", every: 3.6,
  desc: "A beetle-backed shell in two halves over a dark belly. The halves lift apart like wing cases to show the reactor and two thrusters inside, then fold shut." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.35;
  const belly = mesh(new T.SphereGeometry(0.55, 28, 12, 0, TAU, PI / 2, PI / 2), M.dark, 0, Y); belly.scale.set(1, 0.5, 1.3); b.add(belly);
  const halves = [-1, 1].map(sx => { const h = G(); h.position.set(0, Y + 0.02, 0); b.add(h);
    const sh = mesh(new T.SphereGeometry(0.58, 28, 14, sx < 0 ? -PI / 2 : PI / 2, PI, 0, PI / 2), M.armor); sh.scale.set(1, 0.62, 1.3); h.add(sh);
    const edge = mesh(new T.TorusGeometry(0.58, 0.018, 6, 40, PI), M.glow); edge.rotation.set(PI / 2, 0, sx < 0 ? PI / 2 : -PI / 2); edge.scale.set(1, 1.3, 1); h.add(edge);
    return { h, sx }; });
  const r = reactor(0.15, 2.8); r.g.position.y = Y + 0.12; b.add(r.g);
  for (const sx of [-1, 1]) { const th = rotor(0.14, false); th.g.position.set(sx * 0.28, Y + 0.05, -0.25); b.add(th.g); }
  const rt = rotor(0.24); rt.g.position.y = Y - 0.36; b.add(rt.g);
  const horn = mesh(new T.ConeGeometry(0.06, 0.32, 8), M.steel); horn.position.set(0, Y + 0.15, 0.78); horn.rotation.x = PI / 2 - 0.4; b.add(horn);
  return { g, core: Y + 0.12, update(t, act) { b.position.y = bob(t, 1, 0.04); r.spin(t); rt.fan.rotation.y = t * 25;
    const open = act < 0.45 ? 0 : act < 0.6 ? ease((act - 0.45) / 0.15) : act < 0.85 ? 1 : 1 - ease((act - 0.85) / 0.15);
    halves.forEach(H => { H.h.rotation.z = -H.sx * open * 0.95; H.h.position.x = H.sx * open * 0.1; }); } };
});

form("s27", { legs: "Broken into the struts of a cage",
  desc: "A geodesic cage of armoured struts and steel nodes, some struts lit, tumbling slowly round the reactor at its centre. No rotor: it just hangs in the air." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.5, C = G(); C.position.y = Y; b.add(C);
  const ico = new T.IcosahedronGeometry(0.72, 0), pos = ico.attributes.position, verts = [];
  for (let i = 0; i < pos.count; i++) { const v = V(pos.getX(i), pos.getY(i), pos.getZ(i)); if (!verts.some(u => u.distanceTo(v) < 1e-4)) verts.push(v); }
  let n = 0; const edgeLen = verts[0].distanceTo(verts.reduce((m, v) => (v !== verts[0] && (m === verts[0] || verts[0].distanceTo(v) < verts[0].distanceTo(m)) ? v : m), verts[0]));
  for (let i = 0; i < verts.length; i++) for (let j = i + 1; j < verts.length; j++) if (Math.abs(verts[i].distanceTo(verts[j]) - edgeLen) < 0.01) {
    const s = limb(n % 4 === 0 ? 0.018 : 0.03, n % 4 === 0 ? M.glow : M.armor); setLink(s, verts[i], verts[j]); C.add(s); n++; }
  verts.forEach(v => { const k = sphere(0.055, M.steel, 12); k.position.copy(v); C.add(k); });
  const r = reactor(0.17, 2.8); r.g.position.y = Y; b.add(r.g);
  const inner = torus(0.28, 0.025, M.gun, 32); inner.position.y = Y; b.add(inner);
  return { g, core: Y, update(t) { b.position.y = bob(t, 2, 0.05); r.spin(t); C.rotation.set(t * 0.3, t * 0.45, 0); inner.rotation.set(t, 0, t * 0.6); } };
});

form("s28", { legs: "Coiled into three hex rings",
  desc: "Three thick hexagonal rings stacked on a steel spindle, each turning its own way, with the reactor in the widest one. Lit edges run round the inside of each ring." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.45;
  const spindle = cyl(0.05, 0.05, 1.5, M.steel, 10); spindle.position.y = Y; b.add(spindle);
  for (const y of [0.78, -0.78]) { const tip = mesh(new T.ConeGeometry(0.09, 0.2, 6), M.gun); tip.position.y = Y + y; if (y < 0) tip.rotation.x = PI; b.add(tip); }
  const r = reactor(0.15, 2.8); r.g.position.y = Y; b.add(r.g);
  const rings = [[0.36, 0.42], [0.58, 0], [0.36, -0.42]].map(([rad, dy], i) => { const h = G(); h.position.y = Y + dy; b.add(h);
    const ring = new T.Mesh(new T.TorusGeometry(rad, 0.09, 4, 6), M.armor); ring.rotation.x = PI / 2; h.add(ring);
    const gl = new T.Mesh(new T.TorusGeometry(rad - 0.09, 0.012, 4, 6), M.glow); gl.rotation.x = PI / 2; h.add(gl);
    for (let k = 0; k < 3; k++) { const sp = cbox(rad - 0.08, 0.03, 0.03, 0.006, M.gun); sp.position.x = (rad - 0.08) / 2; const a = G(); a.rotation.y = k * TAU / 3; a.add(sp); h.add(a); }
    return { h, dir: i === 1 ? -1 : 1 }; });
  return { g, core: Y, update(t) { b.position.y = bob(t, 1, 0.04); r.spin(t); rings.forEach((R, i) => { R.h.rotation.y = t * 0.8 * R.dir * (1 + i * 0.3); R.h.rotation.z = Math.sin(t + i) * 0.06; }); } };
});

form("s29", { legs: "Bundled into six rotating barrels", every: 2.4,
  desc: "A compact armoured body with a six-barrel rotary cannon under its chin and an ammunition drum on its side. The barrels spin up and the muzzle flickers. A rotor on top, the reactor glowing through a rear hatch." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const body = cbox(0.5, 0.38, 0.62, 0.06, M.armor); body.position.y = Y; b.add(body);
  const hatch = cbox(0.22, 0.03, 0.22, 0.008, M.glowSoft); hatch.position.set(0, Y + 0.2, -0.14); b.add(hatch);
  const r = reactor(0.08, 2.2); r.g.position.set(0, Y + 0.08, -0.14); b.add(r.g);
  const rt = rotor(0.26); rt.g.position.y = Y + 0.38; b.add(rt.g);
  const mast = cyl(0.04, 0.06, 0.14, M.gun); mast.position.y = Y + 0.26; b.add(mast);
  const gun = G(); gun.position.set(0, Y - 0.2, 0.32); b.add(gun);
  const barrels = G(); gun.add(barrels);
  for (let i = 0; i < 6; i++) { const a = i * TAU / 6, br = cyl(0.04, 0.04, 0.75, M.gun, 10); br.rotation.x = PI / 2; br.position.set(Math.cos(a) * 0.1, Math.sin(a) * 0.1, 0.38); barrels.add(br); }
  for (const z of [0.12, 0.6]) { const cl = torus(0.15, 0.03, M.steel, 24); cl.position.z = z; barrels.add(cl); }
  const mz = torus(0.15, 0.015, M.glow, 24); mz.position.z = 0.76; barrels.add(mz);
  const flash = glowSprite(0.6); flash.position.z = 0.85; gun.add(flash);
  const drum = cyl(0.18, 0.18, 0.16, M.dark, 20); drum.rotation.z = PI / 2; drum.position.set(0.33, Y - 0.08, 0.05); b.add(drum);
  const db = torus(0.18, 0.015, M.glow, 24); db.rotation.y = PI / 2; db.position.set(0.42, Y - 0.08, 0.05); b.add(db);
  let spin = 0, last = 0;
  return { g, core: Y + 0.08, update(t, act) { b.position.y = bob(t, 0, 0.035); r.spin(t); rt.fan.rotation.y = t * 25;
    const dt = Math.min(0.1, Math.max(0, t - last)); last = t; spin += dt * (1 + act * act * 30); barrels.rotation.z = spin;
    flash.scale.setScalar(act > 0.75 && Math.sin(t * 60) > 0 ? 0.7 : 0.01); } };
});

form("s30", { legs: "Spread flat into a kite",
  desc: "A flat diamond of armour with a spine and a crossbar, lit along its edges, gliding and banking. The reactor sits at the crossing, and a jointed tail trails behind it." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.7, K = G(); K.position.y = Y; K.rotation.x = -1.05; b.add(K);
  const pts = [[0, 0.72], [0.52, 0], [0, -0.9], [-0.52, 0]];
  K.add(plate(pts, 0.06, 0.015, M.armor));
  const spine = cbox(0.07, 1.62, 0.1, 0.015, M.dark); spine.position.y = -0.09; K.add(spine);
  const bar = cbox(1.04, 0.06, 0.09, 0.015, M.dark); K.add(bar);
  for (let i = 0; i < 4; i++) { const a = pts[i], c = pts[(i + 1) % 4], e = limb(0.014, M.glow); setLink(e, V(a[0], a[1], 0.04), V(c[0], c[1], 0.04)); K.add(e); }
  const port = torus(0.1, 0.025, M.steel, 20); port.position.z = 0.06; K.add(port);
  const r = reactor(0.1, 2.4); r.g.position.z = 0.08; K.add(r.g);
  const tail = []; for (let i = 0; i < 6; i++) { const s = cbox(0.08 - i * 0.008, 0.14, 0.04, 0.01, i % 2 ? M.armor : M.gun); K.add(s); tail.push(s); }
  for (const sx of [-1, 1]) { const f = glowSprite(0.3); f.position.set(sx * 0.52, 0, -0.06); K.add(f); }
  return { g, core: Y, update(t) { b.position.y = bob(t, 2, 0.06); r.spin(t); K.rotation.z = Math.sin(t * 0.7) * 0.3; K.rotation.y = Math.sin(t * 0.5) * 0.2;
    tail.forEach((s, i) => { s.position.set(Math.sin(t * 2.4 - i * 0.6) * 0.04 * i, -0.98 - i * 0.16, 0); s.rotation.z = Math.cos(t * 2.4 - i * 0.6) * 0.2; }); } };
});

form("s31", { legs: "Hanging as chains and anchor weights",
  desc: "A riveted iron diving bell with three glowing portholes, lifted by a rotor on its crown. Chains with anchor weights hang from its rim, and the reactor's light spills out of its open bottom onto the floor." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.25;
  const prof = [[0.0, 0.9], [0.16, 0.88], [0.28, 0.82], [0.38, 0.62], [0.46, 0.3], [0.54, 0.04], [0.6, 0.0], [0.6, -0.04], [0.5, -0.04], [0.47, 0.02]].map(([x, y]) => new T.Vector2(x, y));
  const bell = mesh(new T.LatheGeometry(prof, 36), M.armor, 0, Y); b.add(bell);
  for (const [rr, y] of [[0.6, Y - 0.02], [0.43, Y + 0.48]]) { const band = torus(rr, 0.025, M.steel, 40); band.rotation.x = PI / 2; band.position.y = y; b.add(band); }
  bolts(b, 0.6, 18, Y + 0.01, 0.022, true);
  for (let i = 0; i < 3; i++) { const a = i * TAU / 3 + PI / 2, ph = G(); ph.position.set(Math.cos(a) * 0.44, Y + 0.34, Math.sin(a) * 0.44); ph.lookAt(V(Math.cos(a) * 2, Y + 0.25, Math.sin(a) * 2)); b.add(ph);
    ph.add(torus(0.09, 0.025, M.steel, 20)); const gl = mesh(new T.CircleGeometry(0.075, 20), M.glowSoft); gl.position.z = 0.005; ph.add(gl); }
  const r = reactor(0.14, 3); r.g.position.y = Y + 0.18; b.add(r.g);
  const rt = rotor(0.24, false); rt.g.position.y = Y + 1.04; b.add(rt.g);
  const hook = torus(0.08, 0.025, M.steel, 16); hook.position.y = Y + 0.95; b.add(hook);
  const chains = [0, 1, 2].map(i => { const a = i * TAU / 3 + PI / 6, c = Math.cos(a), s = Math.sin(a), ch = G(); ch.position.set(c * 0.56, Y - 0.04, s * 0.56); b.add(ch);
    for (let k = 0; k < 4; k++) { const l = torus(0.035, 0.011, M.steel, 10); l.position.y = -0.05 - k * 0.08; l.rotation.y = k % 2 ? PI / 2 : 0; ch.add(l); }
    const wgt = cyl(0.07, 0.09, 0.12, M.dark, 6); wgt.position.y = -0.42; ch.add(wgt); return ch; });
  return { g, core: Y + 0.18, update(t) { b.position.y = bob(t, 3, 0.05); r.spin(t); rt.fan.rotation.y = t * 22; chains.forEach((ch, i) => ch.rotation.z = Math.sin(t * 1.6 + i * 2) * 0.12); } };
});

form("s32", { legs: "Shattered into a swarm of blades",
  desc: "No body at all: the reactor in an open gimbal, with ten armoured blade-shards circling it on three tilted orbits. Each shard carries a thin lit edge." },
() => {
  const g = G(), b = G(); g.add(b); const Y = 1.5;
  const r = reactor(0.15, 2.8); r.g.position.y = Y; b.add(r.g);
  const g1 = torus(0.24, 0.018, M.steel, 32); g1.position.y = Y; b.add(g1); const g2 = torus(0.24, 0.018, M.steel, 32); g2.position.y = Y; b.add(g2);
  const shards = [];
  for (let i = 0; i < 10; i++) { const s = G(); b.add(s);
    const body = mesh(new T.OctahedronGeometry(0.1, 0), M.armor); body.scale.set(0.45, 1.9, 0.7); s.add(body);
    const edge = cbox(0.012, 0.3, 0.012, 0.002, M.glow); edge.position.z = 0.06; s.add(edge);
    shards.push({ s, plane: i % 3, ph: i * 0.63 * TAU / 3 + i, rad: 0.6 + (i % 3) * 0.14, sp: 0.9 + (i % 3) * 0.3 }); }
  const tilts = [new T.Euler(0.3, 0, 0.2), new T.Euler(-0.5, 0.8, 0), new T.Euler(1.2, -0.4, 0.3)].map(e => new T.Quaternion().setFromEuler(e));
  return { g, core: Y, update(t) { r.spin(t); g1.rotation.set(t, 0, 0); g2.rotation.set(0, t * 0.8, PI / 2);
    shards.forEach(S => { const a = S.ph + t * S.sp, p = V(Math.cos(a) * S.rad, 0, Math.sin(a) * S.rad).applyQuaternion(tilts[S.plane]);
      S.s.position.set(p.x, Y + p.y + bob(t, S.ph, 0.03), p.z); S.s.lookAt(V(0, Y, 0)); S.s.rotateX(PI / 2); }); } };
});

// The first twelve, described without a role (they are unassigned now).
const FIRST_DESC = {
  mender: "A split armoured sphere with the reactor showing in the gap between its halves, held up by a ducted rotor. Three jointed arms hang under it, ending in a welder, a clamp and a drill.",
  hauler: "An octagonal cage of armoured ribs with the reactor hanging inside like a lamp. Two rotor pods on its flanks and a canister slung underneath on cables.",
  mason: "A heavy industrial block with the reactor behind a front grille and lit vents on its roof. Two piston-driven arms swing a stone block in clamp jaws.",
  reaver: "A wedge-shaped armoured hull with the reactor behind a round port and a lit visor slit. Six blade-arms on servo hubs fan out from its sides and swing forward together.",
  ram: "A compact reactor block between two great armoured slabs, each on a pair of hydraulic rams. The slabs slam shut and the reactor flares.",
  gyro: "Two toothed rings spinning in opposite directions round an armoured gimbal, with the reactor caged at the centre. They spin faster in bursts.",
  bulwark: "A tall riveted tower shield on an armoured arm, a turret behind it with the reactor in a vertical slot, and rotor pods at its back. The shield braces forward.",
  oculus: "A great armoured ring stood on edge, plated and bolted, with a six-bladed iris and the reactor behind it as a lens. The iris opens, then a thin beam fires through.",
  railgun: "Two rails wrapped in glowing coils, angled up from a breech block with the reactor behind a window, and three fins. A round charges in the breech and streaks out along the rails.",
  trilens: "Three armoured lens pods on struts around a small reactor housing, all angled at one point ahead. Each lens lights in turn and the beams cross.",
  anchor: "A turret head on three hydraulic stakes driven into the floor, which pump. The reactor's light turns through a ring of slots in the head.",
  bunker: "An armoured base ring bolted to the floor with six hinged plates. The plates close like a bud, then swing open and the reactor rises out on a piston column.",
};
const ORDER = ["mender", "hauler", "mason", "reaver", "ram", "gyro", "bulwark", "oculus", "railgun", "trilens", "anchor", "bunker"].concat(Array.from({ length: 20 }, (_, i) => "s" + (13 + i)));
ORDER.forEach((k, i) => { FORMS[k].no = i + 1; if (FIRST_DESC[k]) FORMS[k].desc = FIRST_DESC[k]; });


