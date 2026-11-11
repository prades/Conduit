// THE CORE · a DRAFT for the owner (2026-11-11; not built; docs/UI-STYLE.md, "The HUD", PROPOSED): the player cube, tucked into the bottom-right corner, holding what the HUD shows of the player:
// the three bars and the shards (today at the top left with the surge bar), ARMY SURGE, GUARD and STUN (today round buttons by the dial) and the PACK (today a button in that corner).
// node design/ui-mocks/core/render.js [states] [--out=dir] [--three=three.min.js] [--form=814|840|842|843] [--cls=none|gunslinger|technomancer|mutator]   the states as transparent PNGs, 2x
// node design/ui-mocks/core/composite.js [WxH] [state] [--out=dir]   the real page (game.html) before and after, at an iPad's size
// node design/ui-mocks/core/sheet.js [--out=dir]   the review sheet (run the two above first)
// three.js r128 (an unpacked three@0.128.0, as design/evolutions/bake.js); the model code is design/evolutions/forms-core.js, forms2.js, forms29.js (the cube, No. 814), forms30.js (the class gear).
// This file runs in the page, inside the model code's scope.
// Runs inside the model code's scope (forms-core.js, forms2.js, forms29.js, forms30.js: T, G, cbox, cyl, V, FORMS2, _pBlack, _pPanel, _pPeg).
// One cube: its face shows how the player is (calm, hit, last bar, healed, happy, surge, guard, stun, knocked out); its lid is the PACK;
// GUARD and STUN are held on two of its cables; the gold arc behind it is ARMY SURGE; the slab under it carries the three bars and the shards.
const BOX_W = window.__BOX_W || 320, BOX_H = window.__BOX_H || 250;
const cv = document.getElementById('cv'), DPR = window.devicePixelRatio || 1;
const R3 = new T.WebGLRenderer({ canvas: cv, antialias: true, alpha: true, preserveDrawingBuffer: true });
R3.setPixelRatio(DPR); R3.setSize(BOX_W, BOX_H, false); cv.style.width = BOX_W + 'px'; cv.style.height = BOX_H + 'px';
R3.outputEncoding = T.sRGBEncoding; R3.toneMapping = T.ACESFilmicToneMapping; R3.toneMappingExposure = 1.05; R3.setClearColor(0x000000, 0);
// the shop's lights, for reflections (as design/evolutions/bake.js)
const es = new T.Scene(); es.background = new T.Color(0x020203);
es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
const soft = (w, h, x, y, z, c, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); };
soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
const env = new T.PMREMGenerator(R3).fromScene(es, 0.03).texture;
const scene = new T.Scene(); scene.environment = env;
scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.45));
const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim);
const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
const goldLight = new T.PointLight(0xffd23a, 0, 7); goldLight.position.set(0.4, 2.4, 2.4); scene.add(goldLight);
const redLight = new T.PointLight(0xff3020, 0, 6); redLight.position.set(-0.6, 1.9, 2.2); scene.add(redLight);
const cam = new T.PerspectiveCamera(window.__FOV || 25, BOX_W / BOX_H, 0.1, 100);
const CAM = window.__CAM || { pos: [0.05, 2.5, 8.6], at: [-0.42, 1.56, 0] };
cam.position.set(...CAM.pos); cam.lookAt(...CAM.at);

const CY = 1.75, W = 1.5, H = 1.22, D = 1.3;
const glow = c => new T.MeshBasicMaterial({ color: c, toneMapped: false });
const glowA = (c, o) => new T.MeshBasicMaterial({ color: c, toneMapped: false, transparent: true, opacity: o, depthWrite: false });   // (normal blending: the canvas is transparent, where additive light would vanish)
const dark = new T.MeshStandardMaterial({ color: 0x0b0f1a, metalness: 0.7, roughness: 0.35 }); dark.envMapIntensity = 0.8;

// ── THE CUBE (No. 814, the game's own model) or a class's (840 gunslinger, 842 mech, 843 coat) ──
const FORM = window.__FORM || 814;
const P = FORMS2[FORM].build(); scene.add(P.g);
let B = P.b || P.g;
// its two eye dashes (green, on the screen) give way to a face drawn on the screen; its top plate and ribs become a lid on a hinge (the PACK)
const eyes = [], lidParts = []; let screen = null, body = null;
P.g.traverse(o => { if (!o.isMesh) return; const m = o.material;
  if (m && m.isMeshBasicMaterial && m.color && (m.color.getHex() === 0x00ff88 || m.color.getHex() === 0xff2222)) { o.geometry.computeBoundingBox(); const s = o.geometry.boundingBox.getSize(new T.Vector3()); if (s.x > 0.2 && s.x < 0.4 && s.y < 0.2) eyes.push(o); }
  if (m && m.isMeshStandardMaterial && m.color && m.color.getHex() === 0x010501) screen = o; });
B = screen ? screen.parent : B;
B.children.slice().forEach(o => { if (o.isMesh && o.position.y > CY + H / 2 - 0.02 && Math.abs(o.position.x) < 0.5) lidParts.push(o); });
eyes.forEach(e => e.visible = false);
const hinge = G(); hinge.position.set(0, CY + H / 2, -D / 2 + 0.06); B.add(hinge);
lidParts.forEach(o => { B.remove(o); o.position.sub(hinge.position); hinge.add(o); });
const hole = new T.Mesh(new T.PlaneGeometry(W * 0.84, D * 0.82), glowA(0x19e6c1, 0)); hole.rotation.x = -PI / 2; hole.position.set(0, CY + H / 2 + 0.004, 0.02); B.add(hole);
const holeDk = new T.Mesh(new T.PlaneGeometry(W * 0.86, D * 0.84), new T.MeshBasicMaterial({ color: 0x020306, transparent: true, opacity: 0 })); holeDk.rotation.x = -PI / 2; holeDk.position.set(0, CY + H / 2 + 0.002, 0.02); B.add(holeDk);
// the face: a canvas on the screen
const faceCv = document.createElement('canvas'); faceCv.width = 512; faceCv.height = 320; const fg = faceCv.getContext('2d');
const faceTex = new T.CanvasTexture(faceCv); faceTex.encoding = T.sRGBEncoding; faceTex.anisotropy = 4;
const face = new T.Mesh(new T.PlaneGeometry(W * 0.76, H * 0.66), new T.MeshBasicMaterial({ map: faceTex, transparent: true, toneMapped: false, depthWrite: false }));
face.position.set(0, CY - 0.01, D / 2 + 0.0965); B.add(face);

// ── GUARD AND STUN, held out on two cables from its left flank ──
function shieldShape(s) { const sh = new T.Shape(); sh.moveTo(0, 0.95 * s); sh.lineTo(0.78 * s, 0.62 * s); sh.lineTo(0.68 * s, -0.25 * s); sh.lineTo(0, -1.0 * s); sh.lineTo(-0.68 * s, -0.25 * s); sh.lineTo(-0.78 * s, 0.62 * s); sh.closePath(); return sh; }
function boltShape(s) { const sh = new T.Shape(); sh.moveTo(0.22 * s, 1.0 * s); sh.lineTo(-0.52 * s, -0.08 * s); sh.lineTo(-0.06 * s, -0.08 * s); sh.lineTo(-0.24 * s, -1.0 * s); sh.lineTo(0.52 * s, 0.1 * s); sh.lineTo(0.06 * s, 0.1 * s); sh.closePath(); return sh; }
function emblem(shape, col, r) {
  const g = G(), disc = cyl(r, r, 0.1, dark, 6); disc.rotation.x = PI / 2; disc.rotation.y = PI / 2; g.add(disc);
  const ring = new T.Mesh(new T.TorusGeometry(r, 0.032, 6, 6), glow(col)); ring.rotation.z = PI / 2; g.add(ring);
  const glyphMat = glow(col), glyph = new T.Mesh(new T.ExtrudeGeometry(shape, { depth: 0.035, bevelEnabled: false }), glyphMat); glyph.position.z = 0.055; g.add(glyph);
  const halo = new T.Mesh(new T.CircleGeometry(r * 1.55, 32), glowA(col, 0)); halo.position.z = -0.08; g.add(halo);
  const sweep = new T.Mesh(new T.CircleGeometry(r * 0.96, 40, 0, 1), new T.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.62, depthWrite: false })); sweep.position.z = 0.11; sweep.visible = false; g.add(sweep);
  return { g, ring, glyph, glyphMat, halo, sweep, col: new T.Color(col), r };
}
const guard = emblem(shieldShape(0.2), 0x7dffa8, 0.3), stun = emblem(boltShape(0.2), 0xffe14d, 0.3);
B.add(guard.g); B.add(stun.g);
const GUARD_AT = V(-1.5, CY + 0.36, 0.3), STUN_AT = V(-1.44, CY - 0.5, 0.38), GUARD_UP = V(-1.0, CY + 0.34, D / 2 + 0.42);
let guardArm = null, stunArm = null;
function armTo(from, to, sag, old) { if (old) { B.remove(old); old.geometry.dispose(); } const mid = from.clone().lerp(to, 0.5); mid.y -= sag; mid.x -= 0.05;
  const m = new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3([from, from.clone().add(V(-0.18, -0.08, 0.04)), mid, to]), 24, 0.04, 8, false), _pPeg); B.add(m); return m; }
// the guard's dome and the stun's crackle
const dome = new T.Mesh(new T.IcosahedronGeometry(1.32, 1), new T.MeshBasicMaterial({ color: 0x7dffa8, wireframe: true, transparent: true, opacity: 0, toneMapped: false, depthWrite: false })); dome.position.set(0, CY, 0); scene.add(dome);
const crackle = G(); B.add(crackle);
function makeCrackle(at, n, R, seed) { crackle.clear(); let s = seed || 7; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let k = 0; k < n; k++) { const pts = [], a0 = rnd() * TAU; let p = at.clone().add(V(Math.cos(a0) * R * 0.8, Math.sin(a0) * R * 0.8, 0.12));
    for (let i = 0; i < 5; i++) { pts.push(p.clone()); p = p.clone().add(V(Math.cos(a0) * 0.09 + (rnd() - 0.5) * 0.14, Math.sin(a0) * 0.09 + (rnd() - 0.5) * 0.14, 0)); }
    crackle.add(new T.Line(new T.BufferGeometry().setFromPoints(pts), new T.LineBasicMaterial({ color: 0xfff7b0, toneMapped: false, transparent: true, opacity: 0.95 }))); } }

// ── ARMY SURGE: a gold arc behind it, filled left to right over the top ──
const ARC_R = window.__ARC_R || 1.16, ARC_FROM = PI * 0.88, ARC_SPAN = PI * 0.8, arc = G(); arc.position.set(0, CY + 0.02, -0.5); scene.add(arc);
const arcTrack = new T.Mesh(new T.TorusGeometry(ARC_R, 0.05, 8, 96, ARC_SPAN), new T.MeshBasicMaterial({ color: 0x1a1d29, transparent: true, opacity: 0.9 })); arcTrack.rotation.z = ARC_FROM - ARC_SPAN; arc.add(arcTrack);
let arcFill = null, arcGlow = null;
function setArc(f, ready, surging) {
  for (const m of [arcFill, arcGlow]) if (m) { arc.remove(m); m.geometry.dispose(); }
  arcFill = arcGlow = null; if (f <= 0.001) return;
  const span = ARC_SPAN * Math.min(1, f), col = surging ? 0xffe680 : 0xffb800;
  arcFill = new T.Mesh(new T.TorusGeometry(ARC_R, ready || surging ? 0.075 : 0.058, 8, 96, span), glow(col)); arcFill.rotation.z = ARC_FROM - span; arc.add(arcFill);
  arcGlow = new T.Mesh(new T.TorusGeometry(ARC_R, ready || surging ? 0.22 : 0.13, 8, 96, span), glowA(0xff9d00, ready || surging ? 0.3 : 0.1)); arcGlow.rotation.z = ARC_FROM - span; arc.add(arcGlow);
}
const arcEnd = a => V(Math.cos(a) * ARC_R, CY + 0.02 + Math.sin(a) * ARC_R, -0.5);
// the surge's shell round the cube
const shell = new T.Mesh(new T.BoxGeometry(W * 1.16, H * 1.18, D * 1.14), glowA(0xffd84a, 0)); shell.position.set(0, CY, 0); B.add(shell);
const shellEdge = new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(W * 1.16, H * 1.18, D * 1.14)), new T.LineBasicMaterial({ color: 0xffe680, toneMapped: false, transparent: true, opacity: 0 })); shellEdge.position.set(0, CY, 0); B.add(shellEdge);

// ── SHARDS FLYING INTO THE LID, SPARKS, SMOKE, ITEMS OUT OF THE OPEN LID ──
const fx = G(); scene.add(fx);
const goldMat = new T.MeshStandardMaterial({ color: 0xffd23a, metalness: 0.6, roughness: 0.2, emissive: 0xb37a00, emissiveIntensity: 0.9 });
function shardsIn() { const from = V(-2.3, CY + 0.55, 0.8), to = V(0.05, CY + H / 2 + 0.12, 0.2), mid = V(-1.2, CY + 1.25, 0.7), cur = new T.QuadraticBezierCurve3(from, mid, to);
  for (const [k, sz] of [[0.18, 0.07], [0.36, 0.085], [0.55, 0.08], [0.72, 0.075], [0.88, 0.06]]) { const p = cur.getPoint(k), m = new T.Mesh(new T.OctahedronGeometry(sz, 0), goldMat); m.scale.y = 1.6; m.position.copy(p); m.rotation.set(k * 3, k * 5, k * 2); fx.add(m);
    for (let i = 1; i <= 4; i++) { const q = cur.getPoint(Math.max(0, k - i * 0.025)), t2 = new T.Mesh(new T.OctahedronGeometry(sz * (1 - i * 0.18), 0), glowA(0xffcc33, 0.35 - i * 0.07)); t2.position.copy(q); fx.add(t2); } } }
function sparks(n, at, R, col) { let s = 11; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  for (let i = 0; i < n; i++) { const a = rnd() * TAU, r = R * (0.4 + rnd() * 0.6), p = at.clone().add(V(Math.cos(a) * r, Math.sin(a) * r * 0.8, rnd() * 0.3)), d = V(Math.cos(a), Math.sin(a), 0).multiplyScalar(0.07 + rnd() * 0.08);
    fx.add(new T.Line(new T.BufferGeometry().setFromPoints([p, p.clone().add(d)]), new T.LineBasicMaterial({ color: col || 0xfff0a0, toneMapped: false }))); } }
function smoke(at, n) { for (let i = 0; i < n; i++) { const m = new T.Mesh(new T.SphereGeometry(0.1 + i * 0.05, 12, 10), new T.MeshStandardMaterial({ color: 0x5b6070, transparent: true, opacity: 0.42 - i * 0.07, roughness: 1, depthWrite: false })); m.position.copy(at).add(V(0.14 + i * 0.16, 0.1 + i * 0.2, 0)); fx.add(m); } }
function items() { const kit = cbox(0.3, 0.2, 0.22, 0.03, new T.MeshStandardMaterial({ color: 0x8d97a8, metalness: 0.5, roughness: 0.4 })); kit.position.set(-0.3, CY + H / 2 + 0.36, 0.1); kit.rotation.set(0.3, 0.5, -0.2); fx.add(kit);
  const plus1 = new T.Mesh(new T.BoxGeometry(0.12, 0.035, 0.01), glow(0x33ff88)), plus2 = plus1.clone(); plus2.rotation.z = PI / 2; const pl = G(); pl.add(plus1); pl.add(plus2); pl.position.set(0, 0.105, 0); pl.rotation.x = -PI / 2; kit.add(pl);
  const vial = cyl(0.06, 0.06, 0.26, glow(0x7dff6b), 12); vial.position.set(0.12, CY + H / 2 + 0.5, 0.1); vial.rotation.z = -0.5; fx.add(vial);
  const cell = cyl(0.08, 0.08, 0.24, glow(0x5dffc8), 12); cell.position.set(0.4, CY + H / 2 + 0.3, 0.15); cell.rotation.z = 0.7; fx.add(cell);
  const cap = cyl(0.085, 0.085, 0.05, dark, 12); cap.position.set(0, 0.14, 0); cell.add(cap); }

// ── THE FACE ──
function eye(g, kind, x, y, side, col) {
  g.fillStyle = col; g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round';
  const rr = (x0, y0, w, h, r) => { g.beginPath(); g.moveTo(x0 + r, y0); g.arcTo(x0 + w, y0, x0 + w, y0 + h, r); g.arcTo(x0 + w, y0 + h, x0, y0 + h, r); g.arcTo(x0, y0 + h, x0, y0, r); g.arcTo(x0, y0, x0 + w, y0, r); g.closePath(); g.fill(); };
  switch (kind) {
    case 'dash': rr(x - 58, y - 15, 116, 30, 14); break;
    case 'blink': rr(x - 58, y - 4, 116, 8, 4); break;
    case 'happy': g.lineWidth = 24; g.beginPath(); g.moveTo(x - 50, y + 20); g.lineTo(x, y - 22); g.lineTo(x + 50, y + 20); g.stroke(); break;
    case 'squeeze': g.lineWidth = 22; g.beginPath(); if (side < 0) { g.moveTo(x - 40, y - 30); g.lineTo(x + 34, y); g.lineTo(x - 40, y + 30); } else { g.moveTo(x + 40, y - 30); g.lineTo(x - 34, y); g.lineTo(x + 40, y + 30); } g.stroke(); break;
    case 'angry': g.save(); g.translate(x, y); g.rotate(-side * 0.38); rr(-56, -14, 112, 28, 12); g.restore(); break;
    case 'determined': rr(x - 54, y - 6, 108, 22, 10); g.lineWidth = 14; g.beginPath(); g.moveTo(x - side * 56, y - 40); g.lineTo(x + side * 50, y - 20); g.stroke(); break;
    case 'diamond': g.beginPath(); g.moveTo(x, y - 40); g.lineTo(x + 34, y); g.lineTo(x, y + 40); g.lineTo(x - 34, y); g.closePath(); g.fill(); break;
    case 'star': g.beginPath(); for (let i = 0; i < 8; i++) { const a = -PI / 2 + i * PI / 4, r = i % 2 ? 13 : 46; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fill(); break;
    case 'bolt': g.lineWidth = 15; g.beginPath(); g.moveTo(x - 58, y - 10); g.lineTo(x - 18, y + 14); g.lineTo(x + 14, y - 14); g.lineTo(x + 58, y + 10); g.stroke(); break;
    case 'x': g.lineWidth = 20; g.beginPath(); g.moveTo(x - 32, y - 32); g.lineTo(x + 32, y + 32); g.moveTo(x + 32, y - 32); g.lineTo(x - 32, y + 32); g.stroke(); break;
    case 'up': g.lineWidth = 16; g.beginPath(); g.arc(x, y, 28, 0, TAU); g.stroke(); g.beginPath(); g.arc(x, y - 6, 9, 0, TAU); g.fill(); break;
    case 'sleepy': g.lineWidth = 12; g.beginPath(); g.moveTo(x - 52, y + 6); g.quadraticCurveTo(x, y + 26, x + 52, y + 6); g.stroke(); break;
  }
}
function drawFace(s, t) {
  const w = faceCv.width, h = faceCv.height, g = fg; g.clearRect(0, 0, w, h);
  if (s.flash) { g.fillStyle = s.flash; g.fillRect(0, 0, w, h); }
  if (s.static) { let k = 5; for (let i = 0; i < 900; i++) { k = (k * 9301 + 49297) % 233280; const x = k % w, y = (k * 7) % h; g.fillStyle = `rgba(200,210,230,${0.08 + (k % 5) * 0.03})`; g.fillRect(x, y, 3, 2); } }
  g.globalAlpha = 0.1; g.fillStyle = s.col; for (let y = 0; y < h; y += 6) g.fillRect(0, y, w, 2); g.globalAlpha = 1;
  const look = s.look || [0, 0], lx = look[0] * 46, ly = look[1] * 34;
  g.save(); g.shadowColor = s.col; g.shadowBlur = 30;
  for (const side of [-1, 1]) { const x = w / 2 + side * 120 + lx + (s.glitch && side > 0 ? 18 : 0), y = h * 0.5 + ly; eye(g, s.eye || 'dash', x, y, side, s.col); }
  g.restore();
  if (s.glitch) { g.globalAlpha = 0.55; g.drawImage(faceCv, 0, 120, w, 40, 26, 120, w, 40); g.drawImage(faceCv, 0, 200, w, 22, -22, 200, w, 22); g.globalAlpha = 1; }
  if (s.crack) { g.save(); g.strokeStyle = 'rgba(235,245,255,0.92)'; g.lineWidth = 4; g.shadowColor = '#fff'; g.shadowBlur = 6; g.beginPath(); g.moveTo(30, 18); g.lineTo(150, 110); g.lineTo(196, 96); g.lineTo(290, 190); g.lineTo(350, 182); g.lineTo(490, 306);
    g.moveTo(196, 96); g.lineTo(226, 30); g.moveTo(290, 190); g.lineTo(262, 290); g.moveTo(150, 110); g.lineTo(96, 170); g.stroke(); g.restore(); }
  if (s.text) { g.save(); g.fillStyle = s.col; g.font = 'italic 900 44px "DejaVu Sans", sans-serif'; g.textAlign = 'center'; g.shadowColor = s.col; g.shadowBlur = 16; g.fillText(s.text, w / 2, h - 34); g.restore(); }
  faceTex.needsUpdate = true;
}

// ── THE STATES ──
const BASE = { eye: 'dash', col: '#00ff88', look: [-0.55, 0.05], hp: 3, surge: 0.62, lid: 0, count: '5,859' };
const STATES = window.__STATES = {
  calm:    {},
  blink:   { eye: 'blink' },
  hit:     { eye: 'squeeze', col: '#ff4b4b', flash: 'rgba(255,40,40,0.28)', glitch: true, hp: 2, hpLost: 3, jolt: 1, spark: 1, red: 1.2 },
  danger:  { eye: 'angry', col: '#ff2a2a', crack: true, hp: 1, spark: 2, smoke: 1, red: 1.6, tilt: 0.06 },
  heal:    { eye: 'happy', col: '#7dffa8', hp: 2, hpGain: 2, healRing: 1, look: [0, 0] },
  shards:  { eye: 'happy', col: '#00ff88', look: [-0.45, -0.35], lid: 0.16, shards: 1, plus: '+40', count: '5,899', surge: 0.7, hop: 0.06 },
  ready:   { eye: 'diamond', col: '#ffe733', surge: 1, ready: 1, look: [0, 0], gold: 1.2 },
  surging: { eye: 'star', col: '#fff3a0', surge: 0.55, surging: 1, flash: 'rgba(255,214,60,0.22)', gold: 2.6, look: [0, 0] },
  guard:   { eye: 'determined', col: '#7dffa8', guardOn: 1, look: [-0.5, 0] },
  stun:    { eye: 'bolt', col: '#ffe14d', stunOn: 1, look: [-0.7, 0.05], lean: 1 },
  rest:    { eye: 'dash', col: '#00ff88', stunRest: 0.62 },
  pack:    { eye: 'up', col: '#00ff88', look: [0, -0.85], lid: 1, items: 1 },
  ko:      { eye: 'x', col: '#ff6a6a', static: 1, hp: 0, ko: 1, surge: 0.62, text: 'REBOOT' },
  sleepy:  { eye: 'sleepy', col: '#00b870', look: [0, 0.3] },
};
let S = Object.assign({}, BASE);
function set(name) {
  S = Object.assign({}, BASE, STATES[name] || {}); S.name = name;
  fx.clear(); crackle.clear();
  // the body: the hop, the jolt, the lean, the tip of a knockout, the tremble
  B.rotation.set(0, 0, 0); P.g.rotation.set(0, -0.32, 0); P.g.position.set(0, 0, 0);
  if (S.jolt) { P.g.position.x = -0.1; P.g.rotation.z = 0.12; }
  if (S.tilt) P.g.rotation.z = S.tilt;
  if (S.lean) { P.g.rotation.x = 0.16; P.g.position.x = -0.06; }
  if (S.hop) P.g.position.y = S.hop;
  if (S.ko) { P.g.rotation.set(0.1, -0.5, 0.95); P.g.position.set(0.25, -0.45, 0); }
  // the lid
  hinge.rotation.x = -S.lid * 1.75; hole.material.opacity = S.lid > 0 ? 0.85 : 0; holeDk.material.opacity = S.lid > 0 ? 1 : 0;
  // GUARD: out at its side, or (on) swung up in front of the cube, with the dome; STUN: lit and crackling (armed) or dark with its rest swept round
  guard.g.position.copy(S.guardOn ? GUARD_UP : GUARD_AT); guard.g.scale.setScalar(S.guardOn ? 1.25 : 1); guard.g.rotation.set(0, S.guardOn ? 0.32 : 0.42, 0);
  guard.halo.material.opacity = S.guardOn ? 0.32 : 0; guard.glyphMat.color.set(S.guardOn ? 0x9dffbf : 0x7dffa8); guard.ring.material.color.set(S.guardOn ? 0xb6ffd0 : 0x7dffa8);
  dome.material.opacity = S.guardOn ? 0.3 : 0;
  guardArm = armTo(V(-W / 2 + 0.02, CY + 0.28, 0.15), guard.g.position.clone().add(V(0.2, -0.12, -0.1)), S.guardOn ? 0.05 : 0.28, guardArm);
  stun.g.position.copy(STUN_AT); stun.g.rotation.set(0, 0.42, 0); stun.g.scale.setScalar(S.stunOn ? 1.12 : 1);
  stun.halo.material.opacity = S.stunOn ? 0.38 : 0; stun.sweep.visible = !!S.stunRest;
  if (S.stunRest) { stun.sweep.geometry.dispose(); stun.sweep.geometry = new T.CircleGeometry(stun.r * 0.96, 40, PI / 2, TAU * S.stunRest); }
  const restCol = S.stunRest ? 0x5d6475 : 0xffe14d; stun.glyphMat.color.set(restCol); stun.ring.material.color.set(restCol);
  if (S.stunOn) makeCrackle(STUN_AT, 6, 0.42, 3);
  stunArm = armTo(V(-W / 2 + 0.02, CY - 0.3, 0.2), STUN_AT.clone().add(V(0.2, 0.06, -0.1)), 0.18, stunArm);
  // ARMY SURGE
  setArc(S.surge, S.ready, S.surging); shell.material.opacity = S.surging ? 0.07 : 0; shellEdge.material.opacity = S.surging ? 0.95 : S.ready ? 0.45 : 0;
  goldLight.intensity = S.gold || 0; redLight.intensity = S.red || 0;
  if (S.ready) sparks(14, V(0, CY + ARC_R + 0.05, -0.4), 0.9, 0xffe98a);
  if (S.surging) { sparks(22, V(0, CY, 0.4), 1.35, 0xfff1a0); }
  // damage
  if (S.spark) sparks(S.spark > 1 ? 16 : 10, V(W / 2 + 0.15, CY + 0.1, 0.3), 0.45);
  if (S.smoke) smoke(V(W / 2 + 0.12, CY + 0.24, D * 0.12), 4);
  if (S.shards) shardsIn();
  if (S.items) items();
  if (S.healRing) { const ring = new T.Mesh(new T.TorusGeometry(1.0, 0.03, 8, 64), glowA(0x7dffa8, 0.7)); ring.rotation.x = PI / 2; ring.position.set(0, CY - 0.2, 0); scene.add(ring); fx.add(ring); const r2 = ring.clone(); r2.position.y = CY + 0.3; r2.scale.setScalar(0.85); fx.add(r2); }
  drawFace(S, 0);
  P.update(1.3, 0);
  layout();
}
// the HTML under and round it: the slab (the three bars, the shards), the PACK tag at the lid, the words under GUARD and STUN, the surge's words, the siphon
const proj = v => { const p = v.clone(); p.project(cam); return [(p.x * 0.5 + 0.5) * BOX_W, (1 - (p.y * 0.5 + 0.5)) * BOX_H]; };
function layout() {
  scene.updateMatrixWorld(true); cam.updateMatrixWorld(true);
  const q = sel => document.querySelector(sel), put = (el, xy, dx, dy) => { if (!el) return; el.style.left = Math.round(xy[0] + (dx || 0)) + 'px'; el.style.top = Math.round(xy[1] + (dy || 0)) + 'px'; };
  const wp = (obj, v) => obj.localToWorld(v.clone());
  put(q('#lblGuard'), proj(guard.g.localToWorld(V(0, S.guardOn ? 0.66 : -0.42, 0)))); put(q('#lblStun'), proj(stun.g.localToWorld(V(0, -0.42, 0))));
  q('#lblGuard').style.display = q('#lblStun').style.display = S.ko ? 'none' : '';
  q('#lblGuard').textContent = S.guardOn ? 'GUARD ON' : 'GUARD'; q('#lblGuard').classList.toggle('on', !!S.guardOn);
  q('#lblStun').textContent = S.stunRest ? '4 S' : S.stunOn ? 'PICK A TARGET' : 'STUN'; q('#lblStun').classList.toggle('on', !!S.stunOn); q('#lblStun').classList.toggle('rest', !!S.stunRest);
  put(q('#pack'), proj(wp(B, V(W * 0.5, CY + H / 2 + 0.04, D / 2))), 2, 2);
  q('#pack').classList.toggle('open', S.lid > 0.6); q('#pack').style.display = S.ko ? 'none' : '';
  const top = proj(V(0, CY + 0.02 + ARC_R, -0.5)); put(q('#surge'), top, 0, -6);
  q('#surge').textContent = S.ready ? 'TAP — ARMY SURGE' : S.surging ? 'SURGE 12 S' : S.ko ? '' : 'ULTIMATE ' + Math.round(S.surge * 100) + '%';
  q('#surge').className = S.ready ? 'ready' : S.surging ? 'surging' : '';
  put(q('#siphon'), proj(arcEnd(ARC_FROM - ARC_SPAN)), 4, -2);
  // the slab
  const cells = document.querySelectorAll('.cell'); cells.forEach((c, i) => { const n = i + 1; c.className = 'cell' + (n <= S.hp ? (S.hp >= 3 ? ' g' : S.hp === 2 ? ' y' : ' r') : '') + (S.hpLost === n ? ' lost' : '') + (S.hpGain === n ? ' gain' : ''); });
  q('#count').textContent = S.count; q('#plus').textContent = S.plus || ''; q('#plus').style.display = S.plus ? '' : 'none';
  q('#core').className = S.name + (S.ready ? ' isready' : '') + (S.surging ? ' issurging' : '') + (S.hp === 1 ? ' islow' : '') + (S.ko ? ' isko' : '');
}
function render() { R3.render(scene, cam); }
function points() { scene.updateMatrixWorld(true); cam.updateMatrixWorld(true);
  return { guard: proj(guard.g.localToWorld(V(0, 0, 0))), stun: proj(stun.g.localToWorld(V(0, 0, 0))), lid: proj(B.localToWorld(V(0, CY + H / 2 + 0.05, 0.1))), face: proj(B.localToWorld(V(0, CY - 0.05, D / 2 + 0.1))),
    arc: proj(V(Math.cos(PI * 0.62) * ARC_R, CY + 0.02 + Math.sin(PI * 0.62) * ARC_R, -0.5)), siphon: proj(arcEnd(ARC_FROM - ARC_SPAN)) }; }
window.CORE = { set, render, layout, STATES, points };
