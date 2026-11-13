// EXAMPLES, NOT A DESIGN (the owner, 2026-11-13: "Begin work on a new breed of insect using 3D graphics. It's going to be a roly-poly type character that is immune to crushing, immune to slashing, and
// resistant to piercing. That will be electric type and will inhabit the electric domain, and a boss creature will be a predaceous diving beetle larva. Show me pictures and examples of that before you
// design it."). Quick 3D studies in the game's own style kit, light and camera (design/props/models/_style.js, design/props/bake_props.js), for the owner to react to before anything is designed:
//   the roly-poly (a pill bug, Armadillidium: seven overlapping back plates, a small head with two jointed antennae, fourteen short legs, the plates rolling it into a ball), in three ways it could read
//   as electric: A "live seams" (slate plates, current glowing in the gaps between them), B "insulator morph" (glossy black plates with electric-yellow bands, copper antennae: like the hobby's yellow
//   isopod morphs), C "capacitor shell" (blue-steel plates engraved with glowing circuit traces, copper contacts on their edges); each walking and rolled up.
//   the boss, a predaceous diving beetle larva (a water tiger, Dytiscus: a long tapering body of eleven segments, a flat head with huge hollow sickle jaws, six long fringed legs, two tail filaments),
//   as a natural study and as an electric boss (dark plates with glowing seams, crackling jaws, glowing eyes).
//   node design/creatures/electric_breed_examples.js <three-dir> <out-dir>   ->  <out-dir>/rolypoly_examples.png, <out-dir>/larva_examples.png
// Nothing in the game reads this.
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
  const ELEC = '#ffe733', CYAN = '#5ff7ff';
  // a surface from f(u, v) over a grid (u, v in 0..1)
  const psurf = (nu, nv, f, mat) => { const pos = [], idx = [];
    for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) { const p = f(i / nu, j / nv); pos.push(p[0], p[1], p[2]); }
    for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) { const a = i * (nv + 1) + j, b = a + nv + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
    const uv = []; for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) uv.push(i / nu, j / nv);
    const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals(); return new T.Mesh(g, mat); };
  // a tube along points, its radius from r0 to r1
  const ptube = (pts, r0, r1, mat, seg) => { const g = G(); for (let i = 0; i < pts.length - 1; i++) { const a = new T.Vector3(...pts[i]), b = new T.Vector3(...pts[i + 1]), d = b.clone().sub(a), L = d.length(), r = r0 + (r1 - r0) * (i + 0.5) / (pts.length - 1);
      const m = new T.Mesh(new T.CylinderGeometry(r * 0.94, r, L, seg || 10), mat); m.position.copy(a.clone().add(b).multiplyScalar(0.5)); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); g.add(m);
      const j = new T.Mesh(new T.SphereGeometry(r, seg || 10, 6), mat); j.position.copy(a); g.add(j); } return g; };
  const cpts = (ctrl, n) => new T.CatmullRomCurve3(ctrl.map(p => new T.Vector3(...p))).getPoints(n).map(v => [v.x, v.y, v.z]);
  const pbolt = (a, b, k, mat, seed) => { const pts = [a]; for (let i = 1; i < k; i++) { const t = i / k, s = Math.sin(seed * 12.9898 + i * 78.233) * 43758.5453 % 1; pts.push([a[0] + (b[0] - a[0]) * t + s * 0.025, a[1] + (b[1] - a[1]) * t + (s - 0.5) * 0.03, a[2] + (b[2] - a[2]) * t - s * 0.02]); } pts.push(b); return ptube(pts, 0.005, 0.003, mat, 6); };
  const tex = (w, h, draw) => { const c = document.createElement('canvas'); c.width = w; c.height = h; draw(c.getContext('2d'), w, h); const t = new T.CanvasTexture(c); t.encoding = T.sRGBEncoding; t.anisotropy = 8; return t; };

  // ── THE ROLY-POLY ──
  const STYLES = {
    A: { name: 'A · LIVE SEAMS', plate: STY.std('#4a5260', 0.35, 0.45), plate2: STY.std('#3c434f', 0.35, 0.48), leg: STY.std('#8a909a', 0.3, 0.5), ant: STY.std('#5a616c', 0.4, 0.45), seam: STY.glow(ELEC, 1.25), tip: STY.glow(ELEC, 1.4) },
    B: { name: 'B · INSULATOR MORPH', plate: STY.std('#16171c', 0.25, 0.22), plate2: STY.std('#16171c', 0.25, 0.22), leg: STY.std('#3a3a40', 0.3, 0.45), ant: STY.std('#c87a3a', 0.85, 0.3), band: STY.std('#ffd21a', 0.15, 0.35, { side: T.DoubleSide }), tip: STY.std('#e09a52', 0.9, 0.25) },
    C: { name: 'C · CAPACITOR SHELL', plate: null, plate2: null, leg: STY.std('#6a7480', 0.6, 0.4), ant: STY.std('#5a6470', 0.7, 0.35), contact: STY.std('#d08a4a', 0.9, 0.28), tip: STY.glow(CYAN, 1.3) },
  };
  const traceTex = tex(512, 256, (c, w, h) => { c.fillStyle = '#2c3a4e'; c.fillRect(0, 0, w, h); const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.10)'); gr.addColorStop(1, 'rgba(0,0,0,0.25)'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = '#7ff6ff'; c.lineWidth = 5; c.lineCap = 'round'; for (let i = 0; i < 9; i++) { const y = 20 + i * 27, x0 = (i * 53) % 90; c.beginPath(); c.moveTo(x0, y); c.lineTo(x0 + 120, y); c.lineTo(x0 + 150, y + 18); c.lineTo(x0 + 300, y + 18); c.stroke(); c.fillStyle = '#c8ffff'; c.beginPath(); c.arc(x0 + 300, y + 18, 8, 0, 7); c.fill(); } });
  const traceMat = new T.MeshStandardMaterial({ map: traceTex, emissive: new T.Color(0xffffff), emissiveMap: traceTex, emissiveIntensity: 0.55, metalness: 0.75, roughness: 0.3, side: T.DoubleSide });
  const L = 1.0, W = 0.62, H = 0.33, LIFT = 0.075;
  const prof = x => Math.sqrt(Math.max(0, 1 - Math.pow(x / (L / 2), 2)));
  const plateMat = (S, i) => S === STYLES.C ? traceMat : (i % 2 ? S.plate2 : S.plate);
  function rolyWalk(key) { const S = STYLES[key], g = G();
    // the back plates, front to back: seven big ones (the pereon), five small (the pleon), the telson
    const cuts = [0.44, 0.335, 0.235, 0.14, 0.05, -0.04, -0.125, -0.205, -0.26, -0.31, -0.355, -0.395, -0.43, -0.47];
    for (let i = 0; i < cuts.length - 1; i++) {
      const xa = cuts[i + 1] - (i < cuts.length - 2 ? 0.035 : 0), xb = cuts[i], k = 1 + 0.014 * (cuts.length - i), lift = 0.02;
      const m = psurf(10, 28, (u, v) => { const x = xb - (xb - xa) * u, p = prof(x * 0.985), th = -0.32 + v * (Math.PI + 0.64); return [x, LIFT + (H * p * Math.sin(th)) * k + lift * u * Math.max(0, Math.sin(th)), (W / 2) * p * Math.cos(th) * k]; }, plateMat(S, i));
      m.material = m.material.clone(); m.material.side = T.DoubleSide; g.add(m);
      const edge = []; for (let j = 0; j <= 28; j++) { const th = -0.32 + j / 28 * (Math.PI + 0.64), p = prof(xa * 0.985); edge.push([xa, LIFT + (H * p * Math.sin(th)) * k + lift * Math.max(0, Math.sin(th)), (W / 2) * p * Math.cos(th) * k]); }
      if (S.seam) g.add(ptube(edge.map(q => [q[0] - 0.006, q[1] - 0.004, q[2]]), 0.0075, 0.0075, S.seam, 6));
      else g.add(ptube(edge, 0.006, 0.006, S === STYLES.C ? S.contact : S.plate, 6));
      if (S.band && i < 7) { const bm = psurf(4, 20, (u, v) => { const x = xb - (xb - xa) * (0.25 + u * 0.3), p = prof(x * 0.985), th = 0.9 + v * (Math.PI - 1.8); return [x, LIFT + (H * p * Math.sin(th)) * k + 0.003, (W / 2) * p * Math.cos(th) * k]; }, S.band); g.add(bm);
        for (const sg of [-1, 1]) { const th = sg > 0 ? 0.25 : Math.PI - 0.25, x = (xa + xb) / 2, p = prof(x); g.add(at(new T.Mesh(new T.SphereGeometry(0.022, 10, 8), S.band), x, LIFT + H * p * Math.sin(th) * k, (W / 2) * p * Math.cos(th) * k)); } }
      if (S === STYLES.C && i < 7) for (const sg of [-1, 1]) { const th = sg > 0 ? -0.2 : Math.PI + 0.2, p = prof(xa); g.add(at(cbox(0.03, 0.012, 0.018, 0.003, S.contact), xa + 0.01, LIFT + H * p * Math.sin(th) * k + 0.01, (W / 2) * p * Math.cos(th) * k)); }
    }
    // the head, its eyes, its two jointed antennae
    const hm = new T.Mesh(new T.SphereGeometry(1, 20, 14), S === STYLES.C ? STY.std('#3a4658', 0.7, 0.35) : S.plate); hm.scale.set(0.07, 0.065, 0.15); g.add(at(hm, 0.455, LIFT + 0.06, 0));
    for (const sg of [-1, 1]) { g.add(at(new T.Mesh(new T.SphereGeometry(0.018, 10, 8), STY.std('#050507', 0.2, 0.15)), 0.48, LIFT + 0.085, sg * 0.105));
      const a = cpts([[0.5, LIFT + 0.07, sg * 0.07], [0.6, LIFT + 0.11, sg * 0.16], [0.7, LIFT + 0.09, sg * 0.25], [0.78, LIFT + 0.03, sg * 0.31]], 7); g.add(ptube(a, 0.017, 0.009, S.ant, 8));
      g.add(at(new T.Mesh(new T.SphereGeometry(0.015, 10, 8), S.tip), a[a.length - 1][0], a[a.length - 1][1], a[a.length - 1][2]));
      if (S.seam) g.add(pbolt(a[a.length - 1], [a[a.length - 1][0] + 0.06, a[a.length - 1][1] + 0.05, a[a.length - 1][2] + sg * 0.03], 5, S.tip, sg + 3));
      // seven legs a side, tucked under the plates' side flaps
      for (let k = 0; k < 7; k++) { const x = 0.34 - k * 0.09, p = prof(x), y0 = LIFT + 0.02, z0 = sg * (W / 2) * p * 0.82, z1 = sg * ((W / 2) * p + 0.06), x1 = x + 0.02 - k * 0.006;
        g.add(ptube([[x, y0, z0], [x1, y0 + 0.02, z1 * 0.92], [x1 - 0.012, 0.004, z1]], 0.011, 0.006, S.leg, 6)); } }
    // two little tail prongs (uropods)
    for (const sg of [-1, 1]) { const u = at(new T.Mesh(new T.ConeGeometry(0.014, 0.05, 8), S.plate || STY.std('#3a4658', 0.7, 0.35)), -0.49, LIFT + 0.015, sg * 0.03); u.rotation.set(0, 0, Math.PI / 2 + 0.2); g.add(u); }
    return g; }
  function rolyBall(key) { const S = STYLES[key], g = G(), R = 0.27, y0 = R + 0.004;
    // rolled up: the plates wrap round the roll's axis (side to side), the head and tail tucked in where they meet underneath
    const n = 12, start = -0.55 * Math.PI, span = 1.86 * Math.PI;
    for (let i = 0; i < n; i++) { const big = i < 7, d = span / (7 * 1.0 + 5 * 0.55), w = big ? d : d * 0.55, f0 = start + (i < 7 ? i * d : 7 * d + (i - 7) * d * 0.55), k = 1 + 0.01 * (n - i);
      const m = psurf(6, 26, (u, v) => { const ph = f0 + u * (w + 0.06), th = 0.1 * Math.PI + v * 0.8 * Math.PI, r = R * k * (1 + 0.03 * u); return [Math.cos(ph) * Math.sin(th) * r, y0 + Math.sin(ph) * Math.sin(th) * r, Math.cos(th) * r * 1.02]; }, plateMat(S, i).clone()); m.material.side = T.DoubleSide; g.add(m);
      const edge = []; for (let j = 0; j <= 24; j++) { const th = 0.1 * Math.PI + j / 24 * 0.8 * Math.PI, ph = f0 + w + 0.06, r = R * k * 1.03; edge.push([Math.cos(ph) * Math.sin(th) * r, y0 + Math.sin(ph) * Math.sin(th) * r, Math.cos(th) * r * 1.02]); }
      if (S.seam) g.add(ptube(edge.map(q => [q[0] * 0.985, y0 + (q[1] - y0) * 0.985, q[2] * 0.985]), 0.008, 0.008, S.seam, 6)); else g.add(ptube(edge, 0.006, 0.006, S === STYLES.C ? S.contact : S.plate, 6));
      if (S.band && big) { const bm = psurf(3, 18, (u, v) => { const ph = f0 + w * (0.3 + u * 0.35), th = 0.3 * Math.PI + v * 0.4 * Math.PI, r = R * k * 1.035; return [Math.cos(ph) * Math.sin(th) * r, y0 + Math.sin(ph) * Math.sin(th) * r, Math.cos(th) * r * 1.02]; }, S.band); g.add(bm); } }
    // the side flaps' rims, and the antennae's tips poking out of the seam
    for (const sg of [-1, 1]) { const rim = new T.Mesh(new T.TorusGeometry(R * 0.33, 0.012, 8, 28), S === STYLES.C ? S.contact : (S.plate || S.leg)); rim.position.set(0, y0, sg * R * 0.98); g.add(rim);
      const tipA = [Math.cos(-0.56 * Math.PI) * R * 1.02, y0 + Math.sin(-0.56 * Math.PI) * R * 1.02 + 0.02, sg * 0.05]; g.add(at(new T.Mesh(new T.SphereGeometry(0.014, 10, 8), S.tip), tipA[0] + 0.04, tipA[1] + 0.03, tipA[2]));
      if (S.seam) g.add(pbolt([tipA[0] + 0.04, tipA[1] + 0.03, tipA[2]], [tipA[0] + 0.12, tipA[1] + 0.02, tipA[2] + sg * 0.05], 5, S.tip, sg + 7)); }
    if (S === STYLES.C) for (let i = 0; i < 6; i++) { const ph = start + i * 0.55, r = R * 1.05; g.add(at(new T.Mesh(new T.SphereGeometry(0.012, 8, 6), STY.glow(CYAN, 1.3)), Math.cos(ph) * r, y0 + Math.sin(ph) * r, 0)); }
    return g; }

  // ── THE BOSS: A PREDACEOUS DIVING BEETLE LARVA (a water tiger) ──
  function larva(electric) { const g = G();
    const bodyA = electric ? STY.std('#1a2030', 0.45, 0.35) : STY.std('#7a6c3a', 0.15, 0.5), bodyB = electric ? STY.std('#10141e', 0.45, 0.4) : STY.std('#463c20', 0.15, 0.6);
    const headM = electric ? STY.std('#151b28', 0.5, 0.3) : STY.std('#6a5a2c', 0.2, 0.45), jawM = electric ? STY.std('#30384a', 0.75, 0.25) : STY.std('#4a2414', 0.4, 0.3), legM = electric ? STY.std('#2c3445', 0.5, 0.35) : STY.std('#9a8a52', 0.15, 0.5);
    const seamM = STY.glow(ELEC, 1.2), eyeM = electric ? STY.glow(CYAN, 1.4) : STY.std('#070707', 0.2, 0.15), hairM = new T.MeshStandardMaterial({ color: STY.col(electric ? '#9fe6ff' : '#e0d6a8'), transparent: true, opacity: 0.7, roughness: 0.6 });
    // its spine, head to tail: the head raised to strike, the body low along the floor in a gentle S, the tail lifting a little
    const spine = new T.CatmullRomCurve3([[0.62, 0.17, 0.0], [0.4, 0.13, 0.03], [0.12, 0.1, 0.0], [-0.2, 0.09, -0.04], [-0.55, 0.085, -0.01], [-0.85, 0.09, 0.04], [-1.08, 0.12, 0.05]].map(p => new T.Vector3(...p)));
    const N = 11, T0 = 0.0, T1 = 0.96, segT = i => T0 + (i + 0.5) * (T1 - T0) / N, len = spine.getLength() * (T1 - T0) / N;
    const rad = i => i < 3 ? 0.085 + i * 0.008 : Math.max(0.028, 0.112 - Math.pow(Math.max(0, i - 4) / 6.5, 1.6) * 0.085);
    for (let i = 0; i < N; i++) { const t = segT(i), p = spine.getPointAt(t), tg = spine.getTangentAt(t), r = rad(i);
      const m = new T.Mesh(new T.SphereGeometry(1, 26, 16), i % 2 ? bodyB : bodyA); m.scale.set(len * 0.72, r * 0.8, r); m.position.copy(p); m.position.y = Math.max(p.y, r * 0.78); m.quaternion.setFromUnitVectors(new T.Vector3(1, 0, 0), tg); g.add(m);
      const rp = m.position.clone().add(tg.clone().multiplyScalar(-len * 0.5)), ring = new T.Mesh(new T.TorusGeometry(r * 0.93, electric ? 0.007 : 0.01, 8, 30), electric ? seamM : bodyB);
      ring.position.copy(rp); ring.quaternion.setFromUnitVectors(new T.Vector3(0, 0, 1), tg); ring.scale.set(1, 0.84, 1); g.add(ring);
      if (electric) g.add(at(new T.Mesh(new T.SphereGeometry(0.012, 8, 6), seamM), m.position.x, m.position.y + r * 0.8, m.position.z));
      else g.add(at(new T.Mesh(new T.SphereGeometry(r * 0.2, 10, 8), STY.std('#b8a45a', 0.1, 0.5)), m.position.x, m.position.y + r * 0.7, m.position.z)); }
    // the head: big, flat and wide, six small eyes a side, short antennae, and the huge hollow sickle jaws reaching forward to meet
    const hp = spine.getPointAt(0), head = new T.Mesh(new T.SphereGeometry(1, 28, 18), headM); head.scale.set(0.2, 0.075, 0.16); head.position.set(hp.x + 0.12, hp.y + 0.01, hp.z); head.rotation.z = 0.12; g.add(head);
    const hx = head.position.x, hy = head.position.y, hz = head.position.z;
    for (const sg of [-1, 1]) { for (let e = 0; e < 6; e++) g.add(at(new T.Mesh(new T.SphereGeometry(electric ? 0.014 : 0.012, 8, 6), eyeM), hx + 0.04 + (e % 3) * 0.026, hy + 0.035 + Math.floor(e / 3) * 0.018, hz + sg * (0.128 - (e % 3) * 0.012)));
      const jaw = cpts([[hx + 0.15, hy - 0.004, hz + sg * 0.085], [hx + 0.33, hy + 0.035, hz + sg * 0.15], [hx + 0.5, hy + 0.045, hz + sg * 0.12], [hx + 0.6, hy + 0.035, hz + sg * 0.04], [hx + 0.62, hy + 0.025, hz - sg * 0.01]], 16);
      g.add(ptube(jaw, 0.03, 0.005, jawM, 12));
      if (electric) { g.add(ptube(jaw.slice(4).map(q => [q[0] - 0.004, q[1] + 0.016, q[2] - sg * 0.012]), 0.006, 0.003, seamM, 6)); g.add(pbolt(jaw[jaw.length - 1], [jaw[jaw.length - 1][0] + 0.08, jaw[jaw.length - 1][1] + 0.07, jaw[jaw.length - 1][2] + sg * 0.05], 6, seamM, sg + 11)); }
      g.add(ptube(cpts([[hx + 0.14, hy + 0.035, hz + sg * 0.06], [hx + 0.22, hy + 0.09, hz + sg * 0.1], [hx + 0.28, hy + 0.1, hz + sg * 0.14]], 5), 0.007, 0.003, legM, 6));
      // six long legs from the three thoracic segments, splayed and reaching back, a fringe of fine swimming hairs on each shin
      for (let k = 0; k < 3; k++) { const t = segT(k), p = spine.getPointAt(t), r = rad(k), x0 = p.x, y0 = Math.max(p.y, r * 0.7), z0 = p.z + sg * r * 0.85, reach = 0.3 + k * 0.1;
        const knee = [x0 + 0.06 - k * 0.1, y0 + 0.12, z0 + sg * reach * 0.62], ankle = [x0 + 0.04 - k * 0.24, 0.035, z0 + sg * reach], foot = [x0 - 0.02 - k * 0.28, 0.004, z0 + sg * reach * 1.08];
        g.add(ptube([[x0, y0, z0], knee, ankle, foot], 0.013, 0.004, legM, 6));
        for (let h = 1; h <= 7; h++) { const u = h / 8, a = [knee[0] + (ankle[0] - knee[0]) * u, knee[1] + (ankle[1] - knee[1]) * u, knee[2] + (ankle[2] - knee[2]) * u]; g.add(ptube([a, [a[0] - 0.03, a[1] + 0.012, a[2] + sg * 0.006]], 0.0025, 0.0015, hairM, 4)); } } }
    // the tail: the last segment tapers to a point, and two feathery tail filaments
    const tp = spine.getPointAt(1), tt = spine.getTangentAt(1);
    for (const sg of [-1, 1]) { const f = cpts([[tp.x, tp.y, tp.z], [tp.x - 0.1, tp.y + 0.04, tp.z + sg * 0.04], [tp.x - 0.22, tp.y + 0.05, tp.z + sg * 0.1]], 6); g.add(ptube(f, 0.009, 0.003, electric ? seamM : legM, 6));
      for (let h = 1; h < 5; h++) { const a = f[h]; g.add(ptube([a, [a[0] - 0.01, a[1] + 0.02, a[2] + sg * 0.012]], 0.002, 0.0012, hairM, 4)); } }
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
  for (const k of ['A', 'B', 'C']) tiles.push({ label: STYLES[k].name + ' · WALKING', cv: pshoot(rolyWalk(k), TW, TH, 0.14, 0.25) });
  for (const k of ['A', 'B', 'C']) tiles.push({ label: STYLES[k].name + ' · ROLLED UP', cv: pshoot(rolyBall(k), TW, TH, 0.5, 0.2) });
  const roly = psheet('THE ROLY-POLY · three examples of an electric look', 'A pill bug: seven overlapping back plates, a small head, two jointed antennae, fourteen short legs; it rolls into a plated ball. Examples to react to, not a design.', 3, 2, tiles, TW, TH);
  const LW = 700, LH = 470, lt = [{ label: 'A NATURAL STUDY (a water tiger, Dytiscus larva)', cv: pshoot(larva(false), LW, LH, 0.08, Math.PI / 4 - 0.28) }, { label: 'AN ELECTRIC BOSS (dark plates, live seams, crackling jaws)', cv: pshoot(larva(true), LW, LH, 0.08, Math.PI / 4 - 0.28) }];
  const lar = psheet('THE BOSS · a predaceous diving beetle larva', 'Eleven segments tapering to two tail filaments; a flat head with six small eyes a side and huge hollow sickle jaws; six long fringed legs. Examples, not a design.', 2, 1, lt, LW, LH);
  return { roly, lar };
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
  fs.writeFileSync(path.join(OUTDIR, 'rolypoly_examples.png'), Buffer.from(res.roly.split(',')[1], 'base64'));
  fs.writeFileSync(path.join(OUTDIR, 'larva_examples.png'), Buffer.from(res.lar.split(',')[1], 'base64'));
  console.log('wrote', path.join(OUTDIR, 'rolypoly_examples.png'), path.join(OUTDIR, 'larva_examples.png'), errs.length ? 'PAGE ERRORS ' + JSON.stringify(errs.slice(0, 3)) : '');
  await b.close();
})();
