// THE ELECTRIC BREED AS MECHS: EXAMPLES, NOT A DESIGN. Round 1 (commit e73521a) drew a pill bug and a water tiger as animals. Round 2 (the owner, 2026-11-13: "Okay, so I want them
// to look more like mechs now. Like take inspiration from Zoids and get rid of the wiry aesthetics from your sketches.") drew them as machines in the mechanical-animal genre: armour
// plates over a dark frame, joints and pistons, lenses, energy in the seams, nothing thin (no wire legs, hairs, filaments or bolts of lightning); the genre's cues, no existing design
// copied. Round 3 (the owner: "A for the larva, redesign the roll poly with a longer body less plates, but more character") keeps the larva and redraws the roly-poly; round 4 its head.
// In the game's style kit, light and camera (design/props/models/_style.js, design/props/bake_props.js), in three electric looks: A "live seams" (pale gunmetal, yellow energy in the
// seams), B "insulator" (glossy black, hazard-striped panels, copper joints, amber lights), C "capacitor shell" (blue steel traced with glowing circuits, capacitor cells, cyan lights):
//   the roly-poly (the owner's: electric; immune to Crushing and Slashing, resists Piercing), round 3: longer (1.3 long, 0.56 wide), seven plates (five big, a tail section, the telson),
//     antennae posed one raised and one forward, a core housing on its back (lit vents; C's capacitor cells), tail thrusters; round 4 (the owner: "The roly-poly should not have
//     eyes and a face") took round 3's face off: a rounded armoured head capsule. Walking, and rolled up into a closed wheel. Its look is open;
//   the boss, a predaceous diving beetle larva (a water tiger), round 2 (the owner chose look A): armoured segments on a frame with lit joints and side pistons, a flat wedge head
//     with six lenses a side, heavy sickle jaws on hinges (open, a tooth on each), paddle legs, twin tail prongs.
//   node design/creatures/electric_breed_examples.js <three-dir> <out-dir>   ->  <out-dir>/rolypoly_mech.png, larva_mech.png, electric_breed_chosen.png (the owner's picks: the roly-poly B, the larva A)
// Every part and proportion here is the agent's, provisional. Nothing in the game reads this.
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const fs = require('fs'), path = require('path');
const [THREE_DIR, OUTDIR] = process.argv.slice(2);
if (!THREE_DIR || !OUTDIR) { console.error('usage: node design/creatures/electric_breed_examples.js <three-dir> <out-dir>'); process.exit(1); }
const ROOT = path.join(__dirname, '..', '..'), rd = f => fs.readFileSync(path.join(ROOT, f), 'utf8');
const PX = 60 / Math.sin(Math.PI / 4), UH = PX * Math.cos(Math.asin(0.5));

const page = `<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
window.__draw = async function (PX, UH) {
  ${rd('design/evolutions/forms-core.js')}
  ${rd('design/evolutions/forms2.js')}
  ${rd('design/evolutions/forms29.js')}
  const px = h => h / UH;
  ${rd('design/props/models/_style.js')}
  const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
  const ELEC = '#ffe733', CYAN = '#5ff7ff', AMBER = '#ffae1a', UPV = new T.Vector3(0, 1, 0);
  // a surface from f(u, v) over a grid (u, v in 0..1), with UVs
  const psurf = (nu, nv, f, mat) => { const pos = [], idx = [], uv = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const p = f(i / nu, j / nv); pos.push(p[0], p[1], p[2]); uv.push(i / nu, j / nv); }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return new T.Mesh(g, mat); };
  // a thick rounded edge along points (a plate's lip)
  const ptube = (pts, r0, r1, mat, seg) => { const g = G(); for (let i = 0; i < pts.length - 1; i++) { const a = new T.Vector3(...pts[i]), b = new T.Vector3(...pts[i + 1]), d = b.clone().sub(a), L = d.length(), r = r0 + (r1 - r0) * (i + 0.5) / (pts.length - 1);
      const m = new T.Mesh(new T.CylinderGeometry(r * 0.94, r, L, seg || 10), mat); m.position.copy(a.clone().add(b).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(UPV, d.normalize()); g.add(m);
      const j = new T.Mesh(new T.SphereGeometry(r, seg || 10, 6), mat); j.position.copy(a); g.add(j); } return g; };
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };
  const V3 = a => new T.Vector3(a[0], a[1], a[2]);
  // a bar from a to b (a chamfered box w across and d deep), its d side turned up as far as it can be
  const pbar = (a, b, w, d, mat, bev) => { const A = V3(a), B = V3(b), dir = B.clone().sub(A), len = dir.length(); dir.normalize();
    const m = cbox(w, len, d, bev == null ? Math.min(w, d) * 0.25 : bev, mat); const side = new T.Vector3().crossVectors(dir, UPV); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
    const nz = new T.Vector3().crossVectors(side, dir).normalize(); m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(side, dir, nz)); m.position.copy(A).add(B).multiplyScalar(0.5); return m; };
  // a round part from a (radius r0) to b (radius r1)
  const pseg = (a, b, r0, r1, mat, seg) => { const A = V3(a), B = V3(b), d = B.clone().sub(A), L = d.length(); const m = new T.Mesh(new T.CylinderGeometry(r1, r0, L, seg || 14), mat);
    m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(UPV, d.normalize()); return m; };
  const ball = (r, mat, p) => at(new T.Mesh(new T.SphereGeometry(r, 14, 10), mat), p[0], p[1], p[2]);
  // a piston from a to b: a sleeve, a bright rod, a cap at each end
  const ppiston = (g, a, b, r, S) => { const A = V3(a), m = A.clone().lerp(V3(b), 0.58), mid = [m.x, m.y, m.z]; g.add(pseg(a, mid, r, r, S.frame2)); g.add(pseg(mid, b, r * 0.55, r * 0.55, S.joint)); g.add(ball(r * 1.3, S.joint, a)); g.add(ball(r * 1.15, S.joint, b)); };
  const dbl = m => { const c = m.clone(); c.side = T.DoubleSide; return c; };

  // ── THE THREE ELECTRIC LOOKS, AS ARMOUR ──
  // armour panels: shade where a plate tucks under the one before, seams round the arc (canvas y), B's hazard-striped side panels
  const panelTex = (base, seam, hazard) => tex(128, 512, (c, w, h) => { c.fillStyle = base; c.fillRect(0, 0, w, h);
    const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, 'rgba(0,0,0,0.3)'); gr.addColorStop(0.45, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(255,255,255,0.07)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    if (hazard) for (const [y0, y1] of [[0.08, 0.27], [0.73, 0.92]]) { c.save(); c.beginPath(); c.rect(w * 0.32, y0 * h, w * 0.6, (y1 - y0) * h); c.clip(); c.fillStyle = '#121317'; c.fillRect(0, 0, w, h); c.fillStyle = '#f2b13a';
      for (let y = -w; y < h + w; y += 30) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + w * 0.7); c.lineTo(w, y + w * 0.7 + 15); c.lineTo(0, y + 15); c.closePath(); c.fill(); } c.restore(); }
    c.fillStyle = seam; for (const v of [0.08, 0.27, 0.5, 0.73, 0.92]) c.fillRect(0, v * h - 2.5, w, 5); });
  const tm = (t, metal, rough) => { const m = new T.MeshStandardMaterial({ map: t, metalness: metal, roughness: rough, side: T.DoubleSide }); m.envMapIntensity = 0.6; return m; };
  const traceTex = tex(512, 256, (c, w, h) => { c.fillStyle = '#2f3e55'; c.fillRect(0, 0, w, h); const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#7ff6ff'; c.lineWidth = 6; c.lineCap = 'round'; for (let i = 0; i < 9; i++) { const y = 20 + i * 27, x0 = (i * 53) % 90; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + 120, y); c.lineTo(x0 + 150, y + 18); c.lineTo(x0 + 300, y + 18); c.stroke(); c.fillStyle = '#c8ffff'; c.beginPath(); c.arc(x0 + 300, y + 18, 9, 0, 7); c.fill(); } });
  const traceMat = new T.MeshStandardMaterial({ map: traceTex, emissive: new T.Color(0xffffff), emissiveMap: traceTex, emissiveIntensity: 0.5, metalness: 0.75, roughness: 0.3, side: T.DoubleSide });
  const STYLES = {
    A: { name: 'A · LIVE SEAMS', armor: tm(panelTex('#8c95a4', '#3c434f'), 0.7, 0.34), solid: STY.std('#7f8897', 0.72, 0.32), dark: STY.std('#3b424e', 0.75, 0.4), frame: STY.std('#1d2128', 0.8, 0.45), frame2: STY.std('#2c323c', 0.8, 0.4),
      joint: STY.std('#b3bcc7', 0.92, 0.26), jaw: STY.std('#c3cad3', 0.92, 0.24), glow: STY.glow(ELEC, 1.25), lens: STY.glow(ELEC, 1.6), channel: true, dorsal: 'keel', keelTop: STY.glow(ELEC, 1.1), edge: true, face: 'twin' },
    B: { name: 'B · INSULATOR', armor: tm(panelTex('#1e1f24', '#0a0b0e', true), 0.45, 0.3), solid: STY.std('#1e1f24', 0.45, 0.3), dark: STY.std('#121317', 0.5, 0.35), frame: STY.std('#4f5660', 0.85, 0.35), frame2: STY.std('#3a4049', 0.85, 0.38),
      joint: STY.std('#c87a3a', 0.88, 0.28), jaw: STY.std('#9aa1aa', 0.9, 0.3), glow: STY.glow(AMBER, 1.2), lens: STY.glow('#ff8a1a', 1.5), channel: false, dorsal: 'keel', keelTop: STY.std('#f2b13a', 0.3, 0.4), edge: false, face: 'visor', haz: STY.hazard(22, 22) },
    C: { name: 'C · CAPACITOR SHELL', armor: traceMat, solid: STY.std('#3c4c66', 0.75, 0.32), dark: STY.std('#26324a', 0.75, 0.35), frame: STY.std('#161c26', 0.8, 0.42), frame2: STY.std('#222a36', 0.8, 0.4),
      joint: STY.std('#d08a4a', 0.9, 0.28), jaw: STY.std('#b9c6d6', 0.92, 0.24), glow: STY.glow(CYAN, 1.3), lens: STY.glow(CYAN, 1.6), channel: true, dorsal: 'cells', cell: STY.std('#2c6fd6', 0.55, 0.3), cellCap: STY.std('#d5dde6', 0.95, 0.2), edge: true, face: 'cluster' },
  };
  for (const S of Object.values(STYLES)) S.glowD = dbl(S.glow);
  // a dorsal piece standing on the armour at p, along the normal n: A and B a keel (B's capped in yellow), C a capacitor cell
  const dorsal = (g, S, p, n, size) => { const q = new T.Quaternion().setFromUnitVectors(UPV, n), put = (m, h) => { m.quaternion.copy(q); m.position.copy(V3(p)).addScaledVector(n, h); g.add(m); };
    if (S.dorsal === 'keel') { put(cbox(0.055 * size, 0.032 * size, 0.03 * size, 0.008, S.dark), 0.014 * size); put(cbox(0.045 * size, 0.008 * size, 0.032 * size, 0.003, S.keelTop), 0.032 * size); }
    else { put(cyl(0.027 * size, 0.027 * size, 0.05 * size, S.cell, 16), 0.022 * size); put(cyl(0.0275 * size, 0.0275 * size, 0.009 * size, S.glow, 16), 0.026 * size); put(cyl(0.028 * size, 0.028 * size, 0.01 * size, S.cellCap, 16), 0.05 * size); } };

  // ── THE ROLY-POLY, round 3 (the owner, of round 2's: "redesign the roll poly with a longer body less plates, but more character") ──
  // a bar like pbar, its d side turned toward the given up
  const pbarN = (a, b, w, d, mat, up, bev) => { const A = V3(a), B = V3(b), dir = B.clone().sub(A), len = dir.length(); dir.normalize();
    const m = cbox(w, len, d, bev == null ? Math.min(w, d) * 0.25 : bev, mat); const side = new T.Vector3().crossVectors(dir, up || UPV); if (side.lengthSq() < 1e-6) side.set(1, 0, 0); side.normalize();
    const nz = new T.Vector3().crossVectors(side, dir).normalize(); m.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(side, dir, nz)); m.position.copy(A).add(B).multiplyScalar(0.5); return m; };
  const arrOf = v => [v.x, v.y, v.z];
  const L = 1.3, W = 0.56, H = 0.3, LIFT = 0.15, TH0 = -0.22, TH1 = Math.PI + 0.22;
  const prof = x => Math.pow(Math.max(0, 1 - Math.pow(Math.min(1, Math.abs(x) / (L / 2)), 2.5)), 0.4);
  // seven plates, front to back: five big ones, the tail section, the telson; each overlaps the next by 0.04; the middle one carries the core
  const CUTS = [0.58, 0.36, 0.14, -0.08, -0.29, -0.47, -0.58, -0.66], NPL = CUTS.length - 1, OVL = 0.04, CORE = 2;
  const plA = i => CUTS[i + 1] - (i < NPL - 1 ? OVL : 0), plB = i => CUTS[i], plK = i => 1 + 0.016 * (NPL - i);
  // the plates' skirts flare out at the bottom of each side
  const flare = th => { const a = Math.min(th, Math.PI - th), f = Math.max(0, (0.4 - a) / (0.4 - TH0)); return 1 + 0.12 * f * f; };
  const plPt = (i, u, v, km) => { const xb = plB(i), xa = plA(i), x = xb - (xb - xa) * u, th = TH0 + v * (TH1 - TH0), p = prof(x * 0.99), k = plK(i) * (km || 1);
    return [x, LIFT + H * p * Math.sin(th) * k + 0.024 * u * Math.max(0, Math.sin(th)), (W / 2) * p * Math.cos(th) * k * flare(th)]; };
  // the core on its back: an armoured housing with lit vents (A, B; B's base hazard-striped) or three capacitor cells (C), two exhaust stacks behind
  const coreHousing = (g, S, P, n, t) => { t = t.clone().sub(n.clone().multiplyScalar(t.dot(n))).normalize(); const s = new T.Vector3().crossVectors(t, n).normalize();
    const q = new T.Quaternion().setFromRotationMatrix(new T.Matrix4().makeBasis(t, n, s)), put = (m, a, h, c) => { m.quaternion.copy(q); m.position.copy(P).addScaledVector(t, a).addScaledVector(n, h).addScaledVector(s, c); g.add(m); };
    put(cbox(0.17, 0.06, 0.19, 0.018, S.dark), 0, 0.022, 0); if (S.haz) put(cbox(0.176, 0.02, 0.196, 0.006, S.haz), 0, 0.002, 0);
    if (S.dorsal === 'cells') for (const c of [-0.062, 0, 0.062]) { put(cyl(0.028, 0.028, 0.08, S.cell, 16), -0.01, 0.075, c); put(cyl(0.0285, 0.0285, 0.01, S.glow, 16), -0.01, 0.08, c); put(cyl(0.029, 0.029, 0.012, S.cellCap, 16), -0.01, 0.118, c); }
    else for (const a of [-0.06, -0.024, 0.012]) put(cbox(0.022, 0.014, 0.15, 0.004, S.glow), a, 0.055, 0);
    for (const c of [-0.066, 0.066]) { put(cyl(0.018, 0.021, 0.075, S.joint, 14), 0.06, 0.062, c); put(cyl(0.012, 0.012, 0.077, S.frame, 12), 0.06, 0.064, c); } };
  // the seven plates by pt(i, u, v, km): each with its lip, its channel of light (A, C), rivets and a ridge on the big ones (lit in A and C, capped yellow in B), the core on the middle one
  function shell(g, S, pt, center, o) {
    const nrm = (i, u, v) => { const e = 0.01, P = V3(pt(i, u, v)), du = V3(pt(i, Math.min(1, u + e), v)).sub(V3(pt(i, Math.max(0, u - e), v))), dv = V3(pt(i, u, Math.min(1, v + e))).sub(V3(pt(i, u, Math.max(0, v - e))));
      const n = new T.Vector3().crossVectors(du, dv).normalize(); if (n.dot(P.clone().sub(V3(center(P)))) < 0) n.negate(); return n; };
    const on = (i, u, v, h) => arrOf(V3(pt(i, u, v)).addScaledVector(nrm(i, u, v), h));
    for (let i = 0; i < NPL; i++) { const big = i < 5, uF = i ? o.uAfter(i - 1) : 0.06;
      g.add(psurf(10, 32, (u, v) => pt(i, u, v), S.armor));
      const lip = []; for (let j = 0; j <= 32; j++) lip.push(pt(i, 1, j / 32, 1.003)); g.add(ptube(lip, 0.014, 0.014, S.solid, 8));
      if (S.channel && i < NPL - 1) { const u1 = o.uAfter(i), u2 = Math.min(1, u1 + 0.036 / o.span(i + 1)); g.add(psurf(3, 32, (u, v) => pt(i + 1, u1 + (u2 - u1) * u, v, 1.005), S.glowD)); }
      if (big) for (let j = 4; j <= 28; j += 4) g.add(ball(0.009, S.joint, pt(i, 0.9, j / 32, 1.012)));
      if (big && i !== CORE) for (let sgm = 0; sgm < 3; sgm++) { const ua = uF + 0.06 + (0.86 - uF) * sgm / 3, ub = uF + 0.06 + (0.86 - uF) * (sgm + 1) / 3, n = nrm(i, (ua + ub) / 2, 0.5);
        g.add(pbarN(on(i, ua, 0.5, 0.013), on(i, ub, 0.5, 0.013), 0.058, 0.026, S.dark, n)); g.add(pbarN(on(i, ua + 0.01, 0.5, 0.03), on(i, ub - 0.01, 0.5, 0.03), 0.022, 0.008, S.keelTop || S.glow, n)); }
      if (i === CORE) { const um = (uF + 0.95) / 2; coreHousing(g, S, V3(pt(i, um, 0.5)), nrm(i, um, 0.5), V3(pt(i, Math.min(1, um + 0.05), 0.5)).sub(V3(pt(i, um - 0.05, 0.5))).normalize()); } } }
  // the head (the owner, of round 3: "The roly-poly should not have eyes and a face"): a rounded armoured capsule under the first plate's brim, carrying the shell's lines, a ridge
  // with a lit stripe along its crown (B's painted yellow), cheek guards; the antennae as jointed sensor booms in a pose (far, near: four joints each)
  const rolyHead = (S, pose) => { const h = G(); const skull = new T.Mesh(new T.SphereGeometry(1, 28, 18), S.solid); skull.scale.set(0.125, 0.095, 0.17); h.add(skull);
    h.add(at(cbox(0.15, 0.02, 0.042, 0.007, S.dark), -0.012, 0.088, 0)); h.add(at(cbox(0.12, 0.007, 0.018, 0.003, S.keelTop || S.glow), -0.012, 0.1, 0));
    for (const sg of [-1, 1]) { const ch = cbox(0.1, 0.06, 0.026, 0.01, S.dark); ch.rotation.y = sg * 0.25; h.add(at(ch, 0.0, -0.02, sg * 0.152));
      const P = pose[sg > 0 ? 1 : 0]; h.add(pseg(P[0], P[1], 0.03, 0.027, S.solid)); h.add(pseg(P[1], P[2], 0.026, 0.023, S.dark)); h.add(pseg(P[2], P[3], 0.022, 0.018, S.solid));
      h.add(ball(0.035, S.joint, P[0])); h.add(ball(0.031, S.joint, P[1])); h.add(ball(0.027, S.joint, P[2])); h.add(ball(0.027, S.glow, P[3])); }
    return h; };
  function rolyWalk(key) { const S = STYLES[key], g = G();
    // the frame under the shell, its ribs between the legs
    g.add(at(cbox(L * 0.84, 0.06, 0.28, 0.02, S.frame), -0.03, LIFT - 0.05, 0));
    for (let k = 0; k < 7; k++) g.add(at(cbox(0.03, 0.04, 0.34, 0.008, S.frame2), 0.47 - k * 0.15, LIFT - 0.07, 0));
    shell(g, S, plPt, P => [P.x, LIFT - 0.15, 0], { uAfter: i => (plB(i + 1) - plA(i)) / (plB(i + 1) - plA(i + 1)), span: i => plB(i) - plA(i) });
    // the head, a little raised and turned toward you; the far antenna raised, the near one reaching forward
    const hd = rolyHead(S, [[[0.03, 0.06, -0.1], [0.07, 0.17, -0.15], [0.12, 0.31, -0.2], [0.21, 0.39, -0.24]], [[0.03, 0.06, 0.1], [0.12, 0.13, 0.17], [0.26, 0.15, 0.25], [0.37, 0.09, 0.3]]]);
    hd.scale.setScalar(1.12); hd.position.set(0.655, LIFT + 0.045, 0); hd.rotation.set(0, -0.12, 0.12); g.add(hd);
    // seven legs a side: out from under the flared skirt, the knee up and out, an armoured shin down to a claw
    for (const sg of [-1, 1]) for (let k = 0; k < 7; k++) { const x = 0.47 - k * 0.15, p = prof(x), zs = (W / 2) * p, lean = (3 - k) * 0.014;
      const hip = [x, LIFT - 0.04, sg * zs * 0.6], knee = [x + lean, 0.155, sg * (zs * 1.3 + 0.05)], foot = [x + lean * 2.4, 0.004, sg * (zs * 1.3 + 0.1)];
      g.add(pbar(hip, knee, 0.04, 0.036, S.dark)); g.add(ball(0.03, S.joint, knee)); g.add(pbar(knee, [knee[0], knee[1] + 0.034, knee[2] + sg * 0.014], 0.046, 0.04, S.solid));
      g.add(pbar(knee, [foot[0], foot[1] + 0.034, foot[2]], 0.034, 0.03, S.solid)); g.add(pseg([foot[0], foot[1] + 0.038, foot[2]], foot, 0.016, 0.005, S.dark)); }
    // the tail prongs (uropods) as two little thrusters, lit inside
    for (const sg of [-1, 1]) { const a = [-0.6, LIFT - 0.02, sg * 0.05], b = [-0.74, LIFT - 0.05, sg * 0.12], d = V3(b).sub(V3(a)).normalize(); g.add(pbar(a, b, 0.042, 0.036, S.dark));
      const nz = cyl(0.026, 0.021, 0.034, S.joint, 16); nz.quaternion.setFromUnitVectors(UPV, d); nz.position.copy(V3(b)); g.add(nz);
      const gl = cyl(0.017, 0.017, 0.036, S.glow, 16); gl.quaternion.copy(nz.quaternion); gl.position.copy(V3(b)).addScaledVector(d, 0.003); g.add(gl); }
    return g; }
  function rolyWheel(key) { const S = STYLES[key], g = G(), R0 = 0.1, HW = 0.24, WW = 0.5, gap = 0.6, phG = 0.2, OV = 0.08, y0 = R0 + HW * 1.1 * 1.04 + 0.006;
    // rolled up: the plates wrap round the roll's axis (side to side) into a wheel; head and tail meet at a seam, closed by the head's armour
    const ws = [1, 1, 1, 1, 1, 0.5, 0.32], unit = (2 * Math.PI - gap) / ws.reduce((a, b) => a + b, 0), a0 = []; ws.reduce((a, w, i) => { a0[i] = a; return a + w * unit; }, phG + gap / 2);
    const wk = i => 1 + 0.012 * (NPL - i);
    const wPt = (i, u, v, km) => { const ph = a0[i] + u * (ws[i] * unit + OV), th = TH0 + v * (TH1 - TH0), k = wk(i) * (km || 1), rr = R0 + HW * Math.sin(th) * k * (1 + 0.04 * u);
      return [Math.cos(ph) * rr, y0 + Math.sin(ph) * rr, (WW / 2) * Math.cos(th) * k * flare(th)]; };
    const core = cyl(R0 + 0.13, R0 + 0.13, WW * 0.84, S.frame, 32); core.rotation.x = Math.PI / 2; g.add(at(core, 0, y0, 0));
    shell(g, S, wPt, P => [0, y0, P.z], { uAfter: i => (a0[i] + ws[i] * unit + OV - a0[i + 1]) / (ws[i + 1] * unit + OV), span: i => (ws[i] * unit + OV) * (R0 + HW) });
    const hs0 = phG - gap / 2 + OV - 0.06, hs1 = phG + gap / 2 + 0.06, hPt = (u, v, km) => { const ph = hs0 + u * (hs1 - hs0), th = TH0 + v * (TH1 - TH0), k = 0.995 * (km || 1), rr = R0 + HW * Math.sin(th) * k;
      return [Math.cos(ph) * rr, y0 + Math.sin(ph) * rr, (WW / 2) * Math.cos(th) * k * flare(th)]; };
    g.add(psurf(8, 32, hPt, dbl(S.solid)));
    for (let j = 0; j < 4; j++) { const a = V3(hPt(0.15 + 0.7 * j / 4, 0.5, 1.06)), b = V3(hPt(0.15 + 0.7 * (j + 1) / 4, 0.5, 1.06)), m = a.clone().add(b).multiplyScalar(0.5); g.add(pbarN(arrOf(a), arrOf(b), 0.024, 0.009, S.keelTop || S.glow, new T.Vector3(m.x, m.y - y0, 0).normalize())); }
    // the hubs on its two sides: armoured discs, a lit cap (B a copper one), a ring of bolts
    for (const sg of [-1, 1]) { const hz = sg * 0.3; const hub = cyl(R0 + 0.06, R0 + 0.06, 0.05, S.dark, 32); hub.rotation.x = Math.PI / 2; g.add(at(hub, 0, y0, hz));
      const cap = cyl(R0 * 0.62, R0 * 0.62, 0.062, S.channel ? S.glow : S.joint, 24); cap.rotation.x = Math.PI / 2; g.add(at(cap, 0, y0, hz));
      for (let j = 0; j < 8; j++) { const a = j * Math.PI / 4; g.add(ball(0.012, S.joint, [Math.cos(a) * (R0 + 0.028), y0 + Math.sin(a) * (R0 + 0.028), hz + sg * 0.026])); } }
    return g; }

  // ── THE BOSS: A PREDACEOUS DIVING BEETLE LARVA (a water tiger) ──
  function larvaMech(key) { const S = STYLES[key], g = G();
    // its spine, head to tail: the head raised, the body low along the floor in a gentle S, the tail lifting a little
    const spine = new T.CatmullRomCurve3([[0.62, 0.22, 0.0], [0.4, 0.18, 0.03], [0.12, 0.15, 0.0], [-0.2, 0.14, -0.04], [-0.55, 0.135, -0.01], [-0.85, 0.14, 0.04], [-1.08, 0.17, 0.05]].map(V3));
    const N = 11, T1 = 0.96, segT = i => (i + 0.5) * T1 / N, len = spine.getLength() * T1 / N;
    const rad = i => i < 3 ? 0.088 + i * 0.008 : Math.max(0.03, 0.115 - Math.pow(Math.max(0, i - 4) / 6.5, 1.6) * 0.085);
    // a segment's own frame: x forward (toward the head), y up, z to the side
    const frameAt = t => { const p = spine.getPointAt(t), fwd = spine.getTangentAt(t).negate(), side = new T.Vector3().crossVectors(fwd, UPV).normalize(), up = new T.Vector3().crossVectors(side, fwd).normalize(); return { p, fwd, side, up }; };
    const lp = (f, x, y, z) => f.p.clone().addScaledVector(f.fwd, x).addScaledVector(f.up, y).addScaledVector(f.side, z), arr = v => [v.x, v.y, v.z];
    const inFrame = f => { const grp = G(); grp.position.copy(f.p); grp.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(f.fwd, f.up, f.side)); g.add(grp); return grp; };
    for (let i = 0; i < N; i++) { const f = frameAt(segT(i)), r = rad(i), grp = inFrame(f);
      // the frame: a dark barrel with bevelled ends, flattened
      const lg = new T.LatheGeometry([[0.001, -0.5], [0.8, -0.5], [0.92, -0.38], [0.92, 0.38], [0.8, 0.5], [0.001, 0.5]].map(([a, b]) => new T.Vector2(a * r, b * len)), 28); lg.rotateZ(-Math.PI / 2);
      const bar = new T.Mesh(lg, S.frame); bar.scale.set(1, 0.8, 1); grp.add(bar);
      // the armour: a shell over its back and flanks with thick edges
      const R = r * 1.1, sx0 = -len * 0.41, sx1 = len * 0.41, shPt = (u, v, km) => { const x = sx1 - (sx1 - sx0) * u, th = -0.3 + v * (Math.PI + 0.6), k = (km || 1) * (1 - 0.05 * u); return [x, R * 0.8 * Math.sin(th) * k, R * Math.cos(th) * k]; };
      grp.add(psurf(6, 30, shPt, S.armor));
      for (const u of [0, 1]) { const e = []; for (let j = 0; j <= 30; j++) e.push(shPt(u, j / 30, 1.004)); grp.add(ptube(e, 0.011, 0.011, S.dark, 8)); }
      // the joint behind it: a band of light (A, C) or bare frame (B)
      if (i < N - 1) { const bg = new T.CylinderGeometry(r * 0.88, r * 0.88, len * 0.22, 28, 1, true); bg.rotateZ(Math.PI / 2); const band = new T.Mesh(bg, S.channel ? S.glowD : S.frame2); band.scale.set(1, 0.8, 1); band.position.x = -len * 0.5; grp.add(band); }
      // the back: A and B a keel, C two capacitor cells
      if (S.dorsal === 'keel') dorsal(grp, S, [0, R * 0.8, 0], UPV, 1.1);
      else if (i >= 1 && i <= 9) for (const sz of [-1, 1]) { const cz = sz * r * 0.36; dorsal(grp, S, [0, R * 0.8 * Math.sqrt(1 - Math.pow(cz / R, 2)), cz], UPV, 0.85); } }
    // pistons under the armour's edge, segment to segment
    for (let i = 1; i < N - 2; i++) { const fa = frameAt(segT(i)), fb = frameAt(segT(i + 1)), ra = rad(i), rb = rad(i + 1);
      for (const sg of [-1, 1]) ppiston(g, arr(lp(fa, len * 0.12, -ra * 0.36, sg * ra * 1.06)), arr(lp(fb, len * 0.12, -rb * 0.36, sg * rb * 1.06)), 0.013, S); }
    // the head: a flat armoured wedge, a crest, six lenses a side in two rows, two stubby sensor horns, and the sickle jaws on hinges
    const f0 = frameAt(0), hg = G(); hg.position.copy(lp(f0, 0.12, 0.03, 0)); hg.quaternion.setFromRotationMatrix(new T.Matrix4().makeBasis(f0.fwd, f0.up, f0.side)); g.add(hg);
    const outline = [[-0.13, 0.085], [-0.06, 0.15], [0.05, 0.175], [0.15, 0.155], [0.21, 0.09], [0.225, 0], [0.21, -0.09], [0.15, -0.155], [0.05, -0.175], [-0.06, -0.15], [-0.13, -0.085]];
    hg.scale.setScalar(1.15); const hm = plate(outline, 0.09, 0.024, S.solid); hm.rotation.x = Math.PI / 2; hg.add(hm);
    hg.add(at(cbox(0.26, 0.03, 0.07, 0.01, S.dark), -0.01, 0.055, 0));
    for (const sg of [-1, 1]) { hg.add(at(cbox(0.15, 0.024, 0.045, 0.008, S.dark), 0.06, 0.052, sg * 0.07));
      for (let row = 0; row < 2; row++) for (let c = 0; c < 3; c++) { const ex = 0.03 + c * 0.045, ez = sg * (0.112 + row * 0.034 - c * 0.006); hg.add(at(cyl(0.02, 0.02, 0.016, S.frame, 16), ex, 0.047, ez)); hg.add(ball(0.0145, S.lens, [ex, 0.057, ez])); }
      const h0 = [0.16, 0.04, sg * 0.055], h1 = [0.23, 0.09, sg * 0.085], h2 = [0.3, 0.11, sg * 0.095]; hg.add(pseg(h0, h1, 0.02, 0.017, S.dark)); hg.add(ball(0.021, S.joint, h1)); hg.add(pseg(h1, h2, 0.016, 0.013, S.solid)); hg.add(ball(0.015, S.glow, h2));
      // a jaw: a heavy sickle blade on a hinge, open, broad at the root and sharp at the tip, a tooth on its inner edge; that edge lit (A, C) or a hazard band at its root (B)
      hg.add(at(cyl(0.046, 0.046, 0.075, S.joint, 20), 0.18, 0, sg * 0.105)); hg.add(at(cyl(0.022, 0.022, 0.082, S.dark, 14), 0.18, 0, sg * 0.105));
      const jaw = [[0.14, 0.12], [0.25, 0.205], [0.39, 0.245], [0.52, 0.225], [0.62, 0.16], [0.685, 0.07], [0.6, 0.11], [0.55, 0.125], [0.515, 0.098], [0.48, 0.14], [0.39, 0.165], [0.29, 0.155], [0.2, 0.1]].map(([x, z]) => [x, z * sg]);
      const jm = plate(jaw, 0.055, 0.014, S.jaw); jm.rotation.x = Math.PI / 2; hg.add(jm);
      if (S.edge) hg.add(ptube([[0.665, 0.029, 0.082 * sg], [0.6, 0.029, 0.118 * sg], [0.55, 0.029, 0.133 * sg], [0.48, 0.029, 0.148 * sg], [0.39, 0.029, 0.172 * sg], [0.3, 0.029, 0.163 * sg]], 0.0095, 0.0095, S.glow, 8));
      else hg.add(at(cbox(0.06, 0.06, 0.1, 0.01, S.haz), 0.25, 0, sg * 0.16)); }
    // six legs from the three front segments: a hip, an armoured thigh with a piston, a knee joint, a paddle shin (a swimming fin with a spine), a claw
    for (let k = 0; k < 3; k++) { const f = frameAt(segT(k)), r = rad(k);
      for (const sg of [-1, 1]) { const kF = [0.07, 0, -0.07][k], aF = [0.15, -0.04, -0.2][k], kS = [0.19, 0.22, 0.22][k], aS = [0.31, 0.37, 0.39][k];
        const hip = lp(f, 0, -r * 0.35, sg * r * 0.85), knee = lp(f, kF, 0.09, sg * kS), ankle = lp(f, aF, 0, sg * aS), foot = lp(f, aF + (aF - kF) * 0.35, 0, sg * (aS + 0.05)); ankle.y = 0.07; foot.y = 0.004;
        g.add(ball(0.036, S.joint, arr(hip))); g.add(pbar(arr(hip), arr(knee), 0.054, 0.054, S.solid)); ppiston(g, arr(hip.clone().add(new T.Vector3(0, 0.046, 0))), arr(knee.clone().add(new T.Vector3(0, 0.04, 0))), 0.012, S);
        const kj = cyl(0.034, 0.034, 0.07, S.joint, 16); kj.quaternion.setFromUnitVectors(UPV, f.fwd); kj.position.copy(knee); g.add(kj); g.add(pbar(arr(knee), arr(knee.clone().add(new T.Vector3(0, 0.05, 0))), 0.056, 0.05, S.dark));
        g.add(pbar(arr(knee), arr(ankle), 0.095, 0.026, S.solid)); g.add(pbar(arr(knee), arr(ankle), 0.032, 0.042, S.dark)); g.add(ball(0.028, S.joint, arr(ankle)));
        g.add(pseg(arr(ankle), arr(foot.clone().lerp(ankle, 0.35)), 0.027, 0.007, S.dark)); } }
    // the tail: twin armoured spikes, a light at each tip
    const ft = frameAt(T1);
    for (const sg of [-1, 1]) { const a = lp(ft, -0.02, 0.004, sg * 0.03), b = lp(ft, -0.19, 0.045, sg * 0.08); g.add(ball(0.032, S.joint, arr(lp(ft, 0, 0, sg * 0.022))));
      const prong = key === 'B' ? S.frame : S.solid;   // (a dark prong seen edge-on against the dark showed only its bevel's highlight, a thin line)
      g.add(pbar(arr(a), arr(b), 0.046, 0.042, prong)); g.add(pbar(arr(a), arr(b.clone().lerp(a, 0.25)), 0.054, 0.05, S.joint)); g.add(ball(0.02, S.glow, arr(b))); }
    return g; }

  // ── the light and the camera, as the props are baked ──
  const pshoot = (model, W, H, pad, az) => {
    const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
    renderer.setPixelRatio(1); renderer.setSize(W, H, false); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05; renderer.setClearColor(0x000000, 0);
    const es = new T.Scene(); es.background = new T.Color(0x020203); es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
    const soft = (w, h, x, y, z, c, ry) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(0, ry || 0, 0); es.add(m); };
    soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
    const scene = new T.Scene(); scene.environment = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
    scene.add(new T.HemisphereLight(0x7f8ea3, 0x050505, 0.5)); const key = new T.DirectionalLight(0xfff1e2, 2.4); key.position.set(3, 6, 4); scene.add(key);
    const rim = new T.DirectionalLight(0x6c8cff, 1.3); rim.position.set(-5, 1.2, 1.5); scene.add(rim); const back = new T.DirectionalLight(0x6c8cff, 0.6); back.position.set(2, 1, -5); scene.add(back);
    const floor = new T.Mesh(new T.CircleGeometry(1.5, 48), new T.MeshBasicMaterial({ map: tex(256, 256, (c, w, h) => { const r = c.createRadialGradient(w / 2, h / 2, 4, w / 2, h / 2, w / 2); r.addColorStop(0, 'rgba(0,0,0,0.55)'); r.addColorStop(0.5, 'rgba(0,0,0,0.25)'); r.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = r; c.fillRect(0, 0, w, h); }), transparent: true, depthWrite: false }));
    floor.rotation.x = -PI / 2; floor.position.y = 0.001; floor.scale.set(0.7, 0.5, 1); scene.add(floor);
    model.rotation.y = az || 0; scene.add(model); model.updateMatrixWorld(true);
    const elev = Math.asin(0.5), D = 40, cam = new T.OrthographicCamera(-1, 1, 1, -1, 0.1, 200);
    cam.position.set(D * Math.cos(elev) * Math.SQRT1_2, D * Math.sin(elev), D * Math.cos(elev) * Math.SQRT1_2); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9; const v = new T.Vector3();
    model.traverse(o => { if (!o.isMesh) return; const p = o.geometry.attributes.position; for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(o.matrixWorld).applyMatrix4(cam.matrixWorldInverse); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); } });
    if (![x0, x1, y0, y1].every(Number.isFinite)) throw new Error('a model has a vertex that is not a number');
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, half = Math.max((x1 - x0) / W, (y1 - y0) / H) / 2 * (1 + pad);
    cam.left = cx - half * W; cam.right = cx + half * W; cam.top = cy + half * H; cam.bottom = cy - half * H; cam.updateProjectionMatrix();
    renderer.render(scene, cam); const out = document.createElement('canvas'); out.width = W; out.height = H; out.getContext('2d').drawImage(renderer.domElement, 0, 0); renderer.dispose(); return out; };

  // ── the sheets ──
  const psheet = (title, sub, cols, rows, tiles, TW, TH) => { const pad = 26, head = 92, cv = document.createElement('canvas'); cv.width = pad + cols * (TW + pad); cv.height = head + rows * (TH + 44 + pad); const c = cv.getContext('2d');
    const bg = c.createLinearGradient(0, 0, 0, cv.height); bg.addColorStop(0, '#0d1424'); bg.addColorStop(1, '#05070e'); c.fillStyle = bg; c.fillRect(0, 0, cv.width, cv.height);
    c.fillStyle = '#ffffff'; c.font = 'bold 30px DejaVu Sans, sans-serif'; c.fillText(title, pad, 44); c.fillStyle = '#9fb0d0'; c.font = '17px DejaVu Sans, sans-serif'; c.fillText(sub, pad, 74);
    tiles.forEach((t, i) => { const x = pad + (i % cols) * (TW + pad), y = head + Math.floor(i / cols) * (TH + 44 + pad);
      const r = c.createRadialGradient(x + TW / 2, y + TH * 0.45, 10, x + TW / 2, y + TH / 2, TW * 0.7); r.addColorStop(0, '#1f2c48'); r.addColorStop(1, '#0a0f1c'); c.fillStyle = r; c.fillRect(x, y, TW, TH);
      c.drawImage(t.cv, x, y); c.strokeStyle = 'rgba(160,190,255,0.25)'; c.lineWidth = 1; c.strokeRect(x + 0.5, y + 0.5, TW - 1, TH - 1);
      c.fillStyle = '#ffe9a0'; c.font = 'bold 19px DejaVu Sans, sans-serif'; c.fillText(t.label, x + 4, y + TH + 26); });
    return cv.toDataURL('image/png'); };
  const TW = 470, TH = 380, tiles = [];
  for (const k of ['A', 'B', 'C']) tiles.push({ label: STYLES[k].name + ' · WALKING', cv: pshoot(rolyWalk(k), TW, TH, 0.1, -0.22) });
  for (const k of ['A', 'B', 'C']) tiles.push({ label: STYLES[k].name + ' · ROLLED UP', cv: pshoot(rolyWheel(k), TW, TH, 0.4, 0.1) });
  const roly = psheet('THE ROLY-POLY, ROUND 4 · longer, seven plates, no face', 'A rounded armoured head with no face, antennae with a pose, a core on its back, tail thrusters; rolled up, a closed armoured wheel. Examples, not a design.', 3, 2, tiles, TW, TH);
  const LW = 600, LH = 420, lt = ['A', 'B', 'C'].map(k => ({ label: STYLES[k].name, cv: pshoot(larvaMech(k), LW, LH, 0.06, 0.15) }));
  const lar = psheet('THE BOSS AS A MECH · a predaceous diving beetle larva', 'Armoured segments on a frame, lit joints, side pistons; a flat wedge head, six lenses a side; sickle jaws on hinges; paddle legs; twin tail spikes.', 3, 1, lt, LW, LH);
  // the chosen looks, side by side (the owner, 2026-11-13: the roly-poly B; the larva A)
  const CW = 560, CH = 420, chosen = psheet('THE ELECTRIC BREED · the chosen looks', 'The roly-poly in B, insulator (no face; rolled up, a closed wheel); its boss, the diving beetle larva, in A, live seams. Looks only: nothing designed or built yet.', 3, 1,
    [{ label: 'ROLY-POLY · B · WALKING', cv: pshoot(rolyWalk('B'), CW, CH, 0.1, -0.22) }, { label: 'ROLY-POLY · B · ROLLED UP', cv: pshoot(rolyWheel('B'), CW, CH, 0.45, 0.1) }, { label: 'THE BOSS · A', cv: pshoot(larvaMech('A'), CW, CH, 0.06, 0.15) }], CW, CH);
  return { roly, lar, chosen };
};
</script></body></html>`;

(async () => {
  const OLD_CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
  const b = await chromium.launch({ ...(fs.existsSync(OLD_CHROME) ? { executablePath: OLD_CHROME } : {}), args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://draw.local/', r => r.fulfill({ contentType: 'text/html; charset=utf-8', body: page }));
  await p.goto('http://draw.local/');
  let res; try { res = await p.evaluate(([a, b2]) => window.__draw(a, b2), [PX, UH]); } catch (e) { console.log('ERRORS', errs.slice(0, 5), e.message); await b.close(); process.exit(1); }
  fs.mkdirSync(OUTDIR, { recursive: true });
  fs.writeFileSync(path.join(OUTDIR, 'rolypoly_mech.png'), Buffer.from(res.roly.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(OUTDIR, 'larva_mech.png'), Buffer.from(res.lar.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(OUTDIR, 'electric_breed_chosen.png'), Buffer.from(res.chosen.split(',')[1], 'base64'));
  console.log('wrote', path.join(OUTDIR, 'rolypoly_mech.png'), path.join(OUTDIR, 'larva_mech.png'), path.join(OUTDIR, 'electric_breed_chosen.png'), errs.length ? 'PAGE ERRORS ' + JSON.stringify(errs.slice(0, 3)) : '');
  await b.close();
})();
