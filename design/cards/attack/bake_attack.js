// THE ATTACK CARDS' PICTURES (docs/ATTACK-CARD-ART.md; the owner's brief, 2026-11-17). One card's art, 450 x 630 (the card's .cd-art, 225 x 315, at 2x).
// A Brawler card (the impact style): BRAWLER, below: the same 3-D model and camera, then the card's glass shattered from the blow and the card roughed up.
// A Mage card (the elemental style): the follower's OWN 3-D model (design/evolutions/forms*.js), posed mid-cast, under a tilted perspective camera (a Dutch angle),
// its body charged with its element, its element's world far behind it (js/energygem.js, the energy cards' worlds), and its element in the very front of the card as the focus.
//   node design/cards/attack/bake_attack.js <three-dir> <sample> <out.png> [--model]
//     <three-dir>: an unpacked three@0.128.0 npm package (its package/build/three.min.js)
//     <sample>:    a key of SAMPLES below
//     --model:     the 3-D render alone on grey (to look at the pose and the camera)
// Its glows are gradients and blur: a picture baked once, not an effect drawn every frame (docs/EFFECTS.md's flat-colour rule is for those).
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const THREE_DIR = process.argv[2], SAMPLE = process.argv[3], OUT = process.argv[4], MODEL_ONLY = process.argv.includes('--model');
const ROOT = path.join(__dirname, '..', '..', '..'), EVO = path.join(ROOT, 'design', 'evolutions');
const files = ['forms-core.js'].concat(fs.readdirSync(EVO).filter(f => /^forms\d+\.js$/.test(f)).sort((a, b) => parseInt(a.slice(5)) - parseInt(b.slice(5))));
const formsSrc = files.map(f => fs.readFileSync(path.join(EVO, f), 'utf8')).join('\n');
const worldSrc = fs.readFileSync(path.join(ROOT, 'js', 'energygem.js'), 'utf8');

// THE SAMPLES. Each is a style sample of an existing attack (no card's name, stats or effect: those are not drawn here).
const SAMPLES = {
  // THE EMBER HOOD (fire Mage, evolved form 'embercowl', design No. 938: design/evolutions/bake.js JOBS) casting HEXFIRE: its "lighting up" (the sheet's second extra block,
  // columns 24-31: its hood swells, glows hot, its diamond and gems blaze; the owner, 2026-11-12: "he lights up and then a crater erupts lava"). The pose: the block's full
  // swell (sw 1.2) with its heat held at 0.35 (at the block's full heat, 1, the hood's faces glow one flat orange and its shape is lost at a card's size).
  // The front of the card is the crater erupting under the camera (the enemy's place): a lava jet, blobs and sparks near the lens, flames at its edge.
  embercowl_hexfire: {
    form: 938, color: '#ff3300', rim: '#ff6a3a', world: 'fire', seed: 938,
    pose: { t: 0.55, act: 0, v: { sw: 1.2, ball: 0, heat: 0.35 } },
    yaw: 0.3,                   // the model turned so its open front (+z), the diamond in its hollow, faces the camera
    cam: { pos: [2.2, 0.8, 9.0], look: [-0.3, 0.72, 0], fov: 33, roll: -0.27 },   // low, looking up at it a little; roll: the Dutch angle (radians; negative tilts the horizon up to the right)
  },
  // THE FROST MAW (ice Brawler, evolved form 'maw', design No. 934: design/evolutions/bake.js JOBS, forms10.js) biting with CHOMP: the bite's own frame (the sheet's second extra block,
  // its first column: "the bite is its first frame": the swollen body slamming forward over the enemy, the fangs down). The camera is the enemy: the jaws close on the lens,
  // and the card's glass shatters from that point (the brawler style: an impact, the screen shattered, the card roughed up). Its 3-D model sits ON the floor (sunk into it, as the game's).
  maw_chomp: {
    style: 'brawler', form: 934, color: '#7fd6ff', rim: '#99ddff', fx: '#99ddff', world: 'ice', seed: 934,
    pose: { t: 0.3, act: 0, v: { sw: 0.6, rot: 0.1, z: 0.45, y: 0.2, fang: 0.24 } },   // (between its sheet's last rearing frame and the bite's first (sw 0.55, rot 0.32): the mouth still facing the lens as the fangs come down; at the bite's own frame the mouth tips to the floor and hides)
    yaw: -0.2, impact: [0, 0.95, 1.9],   // impact: the point of the bite, in the world (the front of its open mouth, between the fangs): the glass breaks there
    lights: { hemi: [0x8aa8d0, 0x061426, 0.3], key: [0xe8f4ff, 0.6], low: [0x9fe8ff, 0, 0, 0.3, 3.0] },
    cam: { pos: [0.5, 0.4, 8.6], look: [0, 0.8, 0.5], fov: 36, roll: -0.22 },   // low, close, square to its mouth; a lighter tilt than the Mage's (about 12.6 degrees)
  },
};

// ---------- A BRAWLER'S PICTURE (the impact style): the follower's world behind it, the follower, the blow coming at the lens, and then the card itself HIT: its glass
// shattered from the point of impact (cracks radiating out, rings of cracks round it, the shards knocked out of line, the middle crushed and a few pieces knocked out),
// and the card roughed up (scratches, scuffs, grit, chipped edges, dust). Run in the page (its source is put there with toString), after the 3-D renders.
function BRAWLER(o) {
  const { W, H, R, cv, model, floorCv, hzAt, slope, up, info, P } = o, PI = Math.PI, TAU = 2 * PI;
  const FX = P.fx, rgb = (h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)])(FX), fxa = a => 'rgba(' + rgb.join(',') + ',' + a + ')';
  const out = cv(), g = out.getContext('2d');
  const rad = (G, x, y, r, stops) => { const gr = G.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([q, c]) => gr.addColorStop(q, c)); return gr; };
  const blob = (G, x, y, r, stops) => { G.fillStyle = rad(G, x, y, r, stops); G.beginPath(); G.arc(x, y, r, 0, TAU); G.fill(); };
  const HIT = P.impact ? o.mouthAt.slice() : [P.hit[0] * W, P.hit[1] * H];   // the point of impact on the glass (where the bite lands: at its mouth, in front of the fangs)
  // 1. FAR: its element's world (the ice energy card's glacier under an aurora: js/energygem.js, with that card's own seed), tilted with the horizon, softened
  const ws = cv(450, 630), wm = cv(450, 630); { let s = 7; for (const ch of 'world' + P.world) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; const RW = () => (s = (s * 16807) % 2147483647) / 2147483647;
    _EW_PAINT[P.world](ws.getContext('2d'), wm.getContext('2d'), wm.getContext('2d'), 450, 630, RW); }
  g.fillStyle = '#020818'; g.fillRect(0, 0, W, H);
  // (the world's glacier and aurora fill the sky from the card's top down to the horizon: drawn wider than it is tall, as the tilted sky needs the width; its blur hides the stretch)
  { const hz = hzAt(W / 2), top = -(hz + 60), hh = hz + 110, kx = 1.7;
    g.save(); g.translate(W / 2, hz); g.rotate(slope); g.filter = 'blur(2px)'; g.drawImage(ws, -225 * kx, top, 450 * kx, hh); g.filter = 'none';
    g.globalAlpha = 0.5; g.drawImage(wm, -225 * kx, top, 450 * kx, hh); g.restore(); g.globalAlpha = 1; }
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); let lg = g.createLinearGradient(0, -120, 0, 30); lg.addColorStop(0, 'rgba(12,42,74,0)'); lg.addColorStop(0.8, 'rgba(20,60,100,0.85)'); lg.addColorStop(1, '#0c2a4a');
  g.fillStyle = lg; g.fillRect(-W, -120, 2 * W, 150); g.restore();
  // 2. THE FLOOR (3-D), a cold line of light along the horizon (so the tilt reads)
  g.drawImage(floorCv, 0, 0);
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.globalCompositeOperation = 'lighter';
  for (const [h, a] of [[26, 0.12], [8, 0.25], [2, 0.6]]) { const lb = g.createLinearGradient(0, -h, 0, h); lb.addColorStop(0, fxa(0)); lb.addColorStop(0.5, h < 4 ? 'rgba(220,245,255,' + a + ')' : fxa(a)); lb.addColorStop(1, fxa(0)); g.fillStyle = lb; g.fillRect(-W, -h, 2 * W, 2 * h); }
  g.restore();
  // 3. THE FOLLOWER: a cold glow round its silhouette (its element), then its own render, darkened a touch at its foot so the snow shell stands off the floor
  const mask = (blur, col) => { const c = cv(), m = c.getContext('2d'); m.filter = 'blur(' + blur + 'px)'; m.drawImage(model, 0, 0); m.filter = 'none'; m.globalCompositeOperation = 'source-in'; m.fillStyle = col; m.fillRect(0, 0, W, H); return c; };
  g.save(); g.globalAlpha = 0.85; g.drawImage(mask(14, 'rgba(0,6,16,1)'), 0, 6); g.restore();   // (a dark halo behind it: its outline reads against the bright aurora and floor)
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.5; g.drawImage(mask(18, FX), 0, 0); g.restore();
  g.drawImage(model, 0, 0);
  // 4. THE BITE AT THE LENS: a burst of powder and ice chips thrown out of its mouth at the camera, a cold flash where the fangs strike
  g.save(); g.globalCompositeOperation = 'lighter';
  blob(g, HIT[0], HIT[1], 160, [[0, 'rgba(230,250,255,0.3)'], [0.25, fxa(0.16)], [1, fxa(0)]]);
  for (let i = 0; i < 26; i++) { const a = R() * TAU, d = 20 + R() * 120; blob(g, HIT[0] + Math.cos(a) * d, HIT[1] + Math.sin(a) * d * 0.8, 18 + R() * 40, [[0, 'rgba(230,245,255,0.16)'], [1, 'rgba(200,235,255,0)']]); }   // (the powder)
  g.restore();
  const chip = (G, x, y, r, ang, alpha) => {   // a faceted chip of ice: a lit face and a shaded one, a white edge
    const n = 4 + Math.floor(R() * 3), pts = []; for (let i = 0; i < n; i++) { const a = ang + i / n * TAU + (R() - 0.5) * 0.6, rr = r * (0.55 + R() * 0.6) * (i % 2 ? 1 : 1.6); pts.push([x + Math.cos(a) * rr, y + Math.sin(a) * rr * 0.75]); }
    G.save(); G.globalAlpha = alpha; G.beginPath(); pts.forEach(([px, py], i) => i ? G.lineTo(px, py) : G.moveTo(px, py)); G.closePath();
    G.fillStyle = rad(G, x - r * 0.3, y - r * 0.3, r * 1.8, [[0, '#f4fcff'], [0.5, '#a8dcf6'], [1, '#3a7cb0']]); G.fill(); G.strokeStyle = 'rgba(255,255,255,0.9)'; G.lineWidth = 1; G.stroke();
    G.beginPath(); G.moveTo(x, y); G.lineTo(pts[0][0], pts[0][1]); G.lineTo(pts[1][0], pts[1][1]); G.closePath(); G.fillStyle = 'rgba(20,70,120,0.45)'; G.fill(); G.restore(); };
  const chips = cv(), cg = chips.getContext('2d');
  for (let i = 0; i < 18; i++) { const a = R() * TAU, d = 40 + Math.pow(R(), 0.8) * 200, x = HIT[0] + Math.cos(a) * d, y = HIT[1] + Math.sin(a) * d * 0.9; if (y > H * 0.66) continue; chip(cg, x, y, 2.5 + R() * 6 * (d / 200), a, 0.9); }
  g.drawImage(chips, 0, 0);
  { const big = cv(), bg = big.getContext('2d'); [[W * 0.08, H * 0.12, 20], [W * 0.92, H * 0.2, 16], [W * 0.86, H * 0.05, 11], [W * 0.15, H * 0.42, 12]].forEach(([x, y, r]) => chip(bg, x, y, r, R() * TAU, 0.85));
    g.save(); g.filter = 'blur(4px)'; g.drawImage(big, 0, 0); g.restore(); }   // (the nearest chips, flying past the lens, out of focus)
  // 5. THE GRADE before the hit: a vignette, darker at the foot (the name plate reads over it)
  g.save(); g.fillStyle = rad(g, W * 0.5, H * 0.42, H * 0.78, [[0.45, 'rgba(0,0,0,0)'], [1, 'rgba(0,4,12,0.65)']]); g.fillRect(0, 0, W, H);
  lg = g.createLinearGradient(0, H * 0.62, 0, H); lg.addColorStop(0, 'rgba(2,8,18,0)'); lg.addColorStop(1, 'rgba(2,8,18,0.7)'); g.fillStyle = lg; g.fillRect(0, H * 0.62, W, H * 0.38); g.restore();

  // ---------- 6. THE GLASS SHATTERED ----------
  // The crack pattern: lines radiating from the point of impact (jagged), crossed by rings of cracks round it; each cell between them is a shard. Cells merge where a ring's crack
  // is missing (real glass does not break into a perfect web). The inner shards are knocked further out of line and turned more; a few of the second ring are knocked out.
  const snap = cv(); snap.getContext('2d').drawImage(out, 0, 0);
  const md = model.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : md[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
  const NR = P.cracks || 13, RINGS = [0, 22, 52, 96, 160, 250, 380, 1100];
  const angs = []; for (let i = 0; i < NR; i++) angs.push((i + (R() - 0.5) * 0.7) / NR * TAU); angs.sort((a, b) => a - b);
  const V = angs.map((a, i) => RINGS.map((r, k) => { if (k === 0) return HIT.slice(); const aa = a + (R() - 0.5) * 0.12 * (k < 3 ? 1.5 : 1), rr = r * (0.85 + R() * 0.3); return [HIT[0] + Math.cos(aa) * rr, HIT[1] + Math.sin(aa) * rr]; }));
  const ringOn = angs.map(() => RINGS.map((r, k) => k === 0 || k === RINGS.length - 1 || R() < (k < 3 ? 0.9 : k < 5 ? 0.7 : 0.45)));   // (is the ring's crack there between line i and i+1)
  const ringMid = angs.map((a, i) => RINGS.map((r, k) => { const p = V[i][k], q = V[(i + 1) % NR][k]; const m = [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2], dx = m[0] - HIT[0], dy = m[1] - HIT[1], L = Math.hypot(dx, dy) || 1, b = (R() - 0.3) * 0.18 * r; return [m[0] + dx / L * b, m[1] + dy / L * b]; }));
  const shards = [];
  for (let i = 0; i < NR; i++) { const j = (i + 1) % NR; let k0 = 0;
    for (let k = 1; k < RINGS.length; k++) { if (!ringOn[i][k]) continue;
      const poly = []; for (let q = k0; q <= k; q++) poly.push(V[i][q]); poly.push(ringMid[i][k]); for (let q = k; q >= k0; q--) poly.push(V[j][q]); if (k0 > 0) poly.push(ringMid[i][k0]);
      shards.push({ poly, k0, k, i }); k0 = k; } }
  // the dark behind the glass (what shows in the gaps and the holes)
  g.fillStyle = '#01040a'; g.fillRect(0, 0, W, H);
  const holes = [];
  { const cand = shards.filter(s => s.k0 >= 1 && s.k0 <= 3 && s.k <= 4 && Math.max(...s.poly.map(p => p[1])) < H * 0.6 && A(...s.poly.reduce((a, p) => [a[0] + p[0] / s.poly.length, a[1] + p[1] / s.poly.length], [0, 0])) <= 20);   // (one cluster of pieces knocked out, off the follower: one hole, not two, which would read as eyes)
    if (cand.length) { const c0 = cand[Math.floor(R() * cand.length)]; c0.out = true; cand.forEach(s => { if (s !== c0 && (s.i === (c0.i + 1) % NR) && R() < 0.7) s.out = true; }); } }
  shards.forEach(s => {
    const c = s.poly.reduce((a, p) => [a[0] + p[0] / s.poly.length, a[1] + p[1] / s.poly.length], [0, 0]), dx = c[0] - HIT[0], dy = c[1] - HIT[1], L = Math.hypot(dx, dy) || 1;
    const f = Math.pow(Math.max(0, 1 - s.k0 / 6), 1.6);   // (how hard this shard was hit: the nearer the middle, the harder)
    const onIt = A(c[0], c[1]) > 20;   // (over the follower: never knocked out, so it reads)
    if (s.out) { holes.push(s); return; }   // (knocked out)
    s.on = onIt;
    const calm = onIt ? 0.6 : 1, push = (1.2 + 6 * f) * (0.5 + R()) * calm, side = (R() - 0.5) * 4 * f * calm, rot = (R() - 0.5) * 0.06 * f * calm;
    s.d = [dx / L * push - dy / L * side, dy / L * push + dx / L * side]; s.rot = rot; s.c = c;
    g.save(); g.beginPath(); s.poly.forEach(([x, y], q) => { const X = x + s.d[0], Y = y + s.d[1]; q ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.clip();
    g.translate(c[0] + s.d[0], c[1] + s.d[1]); g.rotate(rot); g.translate(-c[0], -c[1]); g.drawImage(snap, 0, 0); g.restore();
    // each shard catches the light a little differently (a sheen across it), so the pieces read as glass
    g.save(); g.beginPath(); s.poly.forEach(([x, y], q) => { const X = x + s.d[0], Y = y + s.d[1]; q ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); g.clip();
    const a = R() * TAU, sh = g.createLinearGradient(c[0] - Math.cos(a) * 80, c[1] - Math.sin(a) * 80, c[0] + Math.cos(a) * 80, c[1] + Math.sin(a) * 80);
    const st = 0.03 + 0.09 * R() * (0.4 + f); sh.addColorStop(0, 'rgba(220,245,255,0)'); sh.addColorStop(0.5, 'rgba(220,245,255,' + st + ')'); sh.addColorStop(1, 'rgba(220,245,255,0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = sh; g.fillRect(0, 0, W, H); g.restore();
  });
  // the crack lines: each shard's edge as a bevel (a dark line, a bright edge where the glass's thickness catches the light), heavier near the middle and thinner going out
  const fade = y => y > H * 0.7 ? 0.45 : 1;   // (lighter over the name plate)
  shards.forEach(s => { if (!s.d) return; const f = Math.max(0, 1 - s.k0 / 6);
    const path = (ox, oy) => { g.beginPath(); s.poly.forEach(([x, y], q) => { const X = x + s.d[0] + ox, Y = y + s.d[1] + oy; q ? g.lineTo(X, Y) : g.moveTo(X, Y); }); g.closePath(); };
    g.save(); g.lineJoin = 'round'; const al = fade(s.c[1]) * (s.on ? 0.75 : 1);
    g.strokeStyle = 'rgba(0,4,12,' + (0.75 * al) + ')'; g.lineWidth = 1.4 + 1.6 * f; path(0, 0); g.stroke();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(200,240,255,' + ((0.35 + 0.4 * f) * al) + ')'; g.lineWidth = 0.9; path(-0.7, -0.7); g.stroke();
    g.restore(); });
  // the holes: pieces knocked out, black behind, their broken edge glinting
  holes.forEach(s => { g.save(); g.beginPath(); s.poly.forEach(([x, y], q) => q ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fillStyle = '#010309'; g.fill();
    g.globalCompositeOperation = 'lighter'; g.strokeStyle = 'rgba(220,248,255,0.8)'; g.lineWidth = 1.2; g.stroke(); g.restore(); });
  // the middle crushed: a white star of fine fractures and powdered glass right at the point of impact, with a cold flash
  g.save(); g.globalCompositeOperation = 'lighter';
  blob(g, HIT[0], HIT[1], 34, [[0, 'rgba(255,255,255,0.7)'], [0.3, 'rgba(210,245,255,0.25)'], [1, fxa(0)]]);
  for (let i = 0; i < 90; i++) { const a = R() * TAU, r0 = R() * 8, r1 = r0 + 5 + Math.pow(R(), 1.5) * 36; g.strokeStyle = 'rgba(235,250,255,' + (0.25 + R() * 0.5) + ')'; g.lineWidth = 0.5 + R() * 0.8;
    g.beginPath(); g.moveTo(HIT[0] + Math.cos(a) * r0, HIT[1] + Math.sin(a) * r0); g.lineTo(HIT[0] + Math.cos(a + (R() - 0.5) * 0.2) * r1, HIT[1] + Math.sin(a + (R() - 0.5) * 0.2) * r1); g.stroke(); }
  for (let i = 0; i < 120; i++) { const a = R() * TAU, d = Math.pow(R(), 2) * 60; g.fillStyle = 'rgba(240,252,255,' + (0.3 + R() * 0.6) + ')'; g.fillRect(HIT[0] + Math.cos(a) * d, HIT[1] + Math.sin(a) * d, 1 + R() * 1.5, 1 + R() * 1.5); }
  g.restore();
  // hairline cracks branching off the main ones, out toward the edges
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 60; i++) { const s = shards[Math.floor(R() * shards.length)]; if (!s.d || s.k0 < 2) continue; const p = s.poly[Math.floor(R() * s.poly.length)];
    let x = p[0] + s.d[0], y = p[1] + s.d[1], a = Math.atan2(y - HIT[1], x - HIT[0]) + (R() - 0.5) * 1.6; const pts = [[x, y]]; for (let q = 0; q < 4; q++) { a += (R() - 0.5) * 0.6; x += Math.cos(a) * (6 + R() * 14); y += Math.sin(a) * (6 + R() * 14); pts.push([x, y]); }
    const al = fade(y); g.strokeStyle = 'rgba(0,4,12,' + (0.5 * al) + ')'; g.lineWidth = 0.9; g.beginPath(); pts.forEach(([X, Y], q) => q ? g.lineTo(X, Y) : g.moveTo(X, Y)); g.stroke();
    g.strokeStyle = 'rgba(210,240,255,' + (0.3 * al) + ')'; g.lineWidth = 0.5; g.beginPath(); pts.forEach(([X, Y], q) => q ? g.lineTo(X - 0.6, Y - 0.6) : g.moveTo(X - 0.6, Y - 0.6)); g.stroke(); }
  g.restore();
  // a few glints: bright points where the broken edges catch the light
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 16; i++) { const s = shards[Math.floor(R() * shards.length)]; if (!s.d || s.k0 > 4) continue; const p = s.poly[Math.floor(R() * s.poly.length)], x = p[0] + s.d[0], y = p[1] + s.d[1]; if (y > H * 0.7) continue;
    blob(g, x, y, 7 + R() * 7, [[0, 'rgba(255,255,255,0.85)'], [0.3, 'rgba(200,240,255,0.3)'], [1, 'rgba(200,240,255,0)']]);
    g.strokeStyle = 'rgba(255,255,255,0.5)'; g.lineWidth = 0.7; const L = 8 + R() * 10; g.beginPath(); g.moveTo(x - L, y); g.lineTo(x + L, y); g.moveTo(x, y - L * 0.6); g.lineTo(x, y + L * 0.6); g.stroke(); }
  g.restore();

  // ---------- 7. ROUGHED UP: scratches, scuffs, grit, dust, chipped edges ----------
  // scuffs: rubbed patches (lighter, soft) and grime (darker, soft), mostly toward the edges and corners
  g.save();
  for (let i = 0; i < 22; i++) { const edge = R() < 0.7, x = edge ? (R() < 0.5 ? R() * W * 0.25 : W - R() * W * 0.25) : R() * W, y = R() * H, r = 20 + R() * 60, light = R() < 0.55;
    g.save(); g.translate(x, y); g.rotate(R() * PI); g.scale(1, 0.3 + R() * 0.5); blob(g, 0, 0, r, light ? [[0, 'rgba(200,220,235,0.1)'], [1, 'rgba(200,220,235,0)']] : [[0, 'rgba(10,8,6,0.28)'], [1, 'rgba(10,8,6,0)']]); g.restore(); }
  g.restore();
  // scratches: fine bright lines, some alone, some in parallel bunches (a scrape), a few long ones across the card
  const scratch = (x, y, a, L, w, al) => { const bend = (R() - 0.5) * L * 0.15, ex = x + Math.cos(a) * L, ey = y + Math.sin(a) * L, mx = (x + ex) / 2 - Math.sin(a) * bend, my = (y + ey) / 2 + Math.cos(a) * bend;
    const gr = g.createLinearGradient(x, y, ex, ey); gr.addColorStop(0, 'rgba(230,240,250,0)'); gr.addColorStop(0.2, 'rgba(230,240,250,' + al + ')'); gr.addColorStop(0.75, 'rgba(230,240,250,' + al * 0.7 + ')'); gr.addColorStop(1, 'rgba(230,240,250,0)');
    g.strokeStyle = gr; g.lineWidth = w; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(mx, my, ex, ey); g.stroke();
    g.strokeStyle = 'rgba(0,0,0,' + al * 0.5 + ')'; g.lineWidth = w * 0.8; g.beginPath(); g.moveTo(x + 0.8, y + 0.8); g.quadraticCurveTo(mx + 0.8, my + 0.8, ex + 0.8, ey + 0.8); g.stroke(); };
  g.save(); g.lineCap = 'round';
  for (let i = 0; i < 7; i++) { const x = R() * W, y = R() * H, a = -0.4 + (R() - 0.5) * 1.2, n = 3 + Math.floor(R() * 5); for (let q = 0; q < n; q++) scratch(x + q * 2.2 + R(), y + q * 3 + R() * 2, a + (R() - 0.5) * 0.04, 30 + R() * 70, 0.6 + R() * 0.5, 0.26 + R() * 0.24); }
  for (let i = 0; i < 40; i++) scratch(R() * W, R() * H, R() * TAU, 6 + R() * 30, 0.5 + R() * 0.6, 0.15 + R() * 0.25);
  for (let i = 0; i < 3; i++) scratch(R() * W * 0.3, R() * H, -0.3 + (R() - 0.5) * 0.5, 200 + R() * 200, 0.8, 0.22);
  g.restore();
  // grit: a fine speckle of dark and light specks all over, thicker at the edges
  { const id = g.getImageData(0, 0, W, H), d = id.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const e = Math.min(x, y, W - 1 - x, H - 1 - y), edge = e < 30 ? 1 - e / 30 : 0, n = R(), i4 = (y * W + x) * 4, j = (R() - 0.5) * 14;   // (a light grain over everything)
      d[i4] += j; d[i4 + 1] += j; d[i4 + 2] += j;
      if (n < 0.006 + 0.03 * edge) { const v = R() < 0.6 ? -70 - R() * 60 : 60 + R() * 60; d[i4] += v; d[i4 + 1] += v; d[i4 + 2] += v; } }
    g.putImageData(id, 0, 0); }
  // dust: soft motes in the air and a haze of grit settled along the bottom and in the corners
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 60; i++) { const x = R() * W, y = R() * H, r = 0.6 + Math.pow(R(), 3) * 3; blob(g, x, y, r * 2.5, [[0, 'rgba(220,235,250,' + (0.25 + R() * 0.35) + ')'], [1, 'rgba(220,235,250,0)']]); }
  g.restore();
  // chipped edges: bites knocked out of the card's edge (the dark card stock showing, a pale broken rim), more at the corners
  g.save();
  const chipEdge = (x, y, nx, ny, r) => { const tx = -ny, ty = nx, pts = [[x - tx * r, y - ty * r]]; const n = 4 + Math.floor(R() * 3);
    for (let q = 1; q < n; q++) { const t = q / n, dep = r * (0.4 + R() * 0.7) * Math.sin(t * PI); pts.push([x + tx * r * (2 * t - 1) + nx * -dep + (R() - 0.5) * 2, y + ty * r * (2 * t - 1) + ny * -dep]); } pts.push([x + tx * r, y + ty * r]);
    pts.push([x + tx * r + nx * 4, y + ty * r + ny * 4]); pts.push([x - tx * r + nx * 4, y - ty * r + ny * 4]);
    g.beginPath(); pts.forEach(([X, Y], q) => q ? g.lineTo(X, Y) : g.moveTo(X, Y)); g.closePath(); g.fillStyle = '#05070c'; g.fill();
    g.strokeStyle = 'rgba(190,215,235,0.55)'; g.lineWidth = 0.9; g.beginPath(); pts.slice(0, n + 1).forEach(([X, Y], q) => q ? g.lineTo(X, Y) : g.moveTo(X, Y)); g.stroke(); };
  for (let i = 0; i < 26; i++) { const side = Math.floor(R() * 4), t = R() < 0.4 ? (R() < 0.5 ? R() * 0.12 : 1 - R() * 0.12) : R(), r = 2 + Math.pow(R(), 2) * 9;
    if (side === 0) chipEdge(t * W, 0, 0, -1, r); else if (side === 1) chipEdge(t * W, H, 0, 1, r); else if (side === 2) chipEdge(0, t * H, -1, 0, r); else chipEdge(W, t * H, 1, 0, r); }
  // the corners worn: rounded off and rubbed pale
  for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H]]) blob(g, cx, cy, 28 + R() * 14, [[0, 'rgba(200,215,230,0.22)'], [1, 'rgba(200,215,230,0)']]);
  g.restore();
  info.hit = HIT.map(Math.round); info.shards = shards.length; info.holes = holes.length;
  return { png: out.toDataURL('image/png'), info };
}

const page = `<!doctype html><html><body style="margin:0;background:#000"><script src="three.min.js"></script><script>
${worldSrc}
${BRAWLER.toString()}
window.__card = async function (P, W, H, modelOnly) {
  ${formsSrc}
  {   // (a block of its own: the forms' code above declares names of its own, mask among them)
  const SS = 2;   // rendered at twice the size and drawn down, for clean edges
  let seed = P.seed || 1; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };   // (a fixed seed: the same picture on every bake)
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w || W; c.height = h || H; return c; };
  // ---------- THE 3-D SCENE: the follower's own model and the floor it hovers over, under a perspective camera ----------
  const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true, premultipliedAlpha: false });
  renderer.setPixelRatio(1); renderer.setSize(W * SS, H * SS, false); renderer.outputEncoding = T.sRGBEncoding; renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  // the forms' baker's environment (design/evolutions/bake.js: "the shop's lights", for reflections), with the lava's warm light under it
  const es = new T.Scene(); es.background = new T.Color(0x020203);
  es.add(new T.Mesh(new T.BoxGeometry(20, 20, 20), new T.MeshBasicMaterial({ color: 0x0a0c10, side: T.BackSide })));
  const soft = (w, h, x, y, z, c, ry, rx) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: c, side: T.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx || 0, ry || 0, 0); es.add(m); };
  soft(3, 4, 9, 2, 2, 0x8a9bb0, -PI / 2); soft(2, 4, -9, 2, -3, 0x3c5478, PI / 2); soft(6, 1.2, 0, 2.5, 9, 0x5a6678, PI);
  const ICE = P.world === 'ice';   // (the ice world: cold light everywhere; the fire world's lava below is the Mage sample's)
  soft(14, 6, 0, -6, 3, ICE ? 0x1a4a70 : 0x8a2a08, 0, PI / 2);
  const env = new T.PMREMGenerator(renderer).fromScene(es, 0.03).texture;
  EL = { color: P.color }; setElementColour(P.color); M.crystal.color.multiplyScalar(0.5); M.crystal.emissive.multiplyScalar(0.8);   // (as the forms' baker sets a numbered form's crystal)
  const scene = new T.Scene(); scene.environment = env;
  const Lt = Object.assign(ICE ? { hemi: [0x8aa8d0, 0x061426, 0.45], key: [0xe8f4ff, 1.1], rim: 2.6, back: 1.4, low: [0x9fe8ff, 6, -0.6, 0.3, 3.0] } : { hemi: [0x8a6a60, 0x1a0602, 0.35], key: [0xffe6d0, 0.8], rim: 2.2, back: 1.2, low: [0xff5a14, 12, -2.4, 0.4, 3.2] }, P.lights || {});
  scene.add(new T.HemisphereLight(Lt.hemi[0], Lt.hemi[1], Lt.hemi[2]));
  const key = new T.DirectionalLight(Lt.key[0], Lt.key[1]); key.position.set(3, 6, 4); scene.add(key);
  const rim = new T.DirectionalLight(new T.Color(P.rim), Lt.rim); rim.position.set(-5, 1.6, -1); scene.add(rim);
  const back = new T.DirectionalLight(new T.Color(P.rim), Lt.back); back.position.set(3, 1, -5); scene.add(back);
  const lava = new T.PointLight(Lt.low[0], Lt.low[1], 10, 2); lava.position.set(Lt.low[2], Lt.low[3], Lt.low[4]); scene.add(lava);   // the fire sample: the eruption in front of it, lighting it from below; the ice sample: the impact's cold flash in front of its mouth
  const B = FORMS2[P.form].build(); scene.add(B.g); B.g.rotation.y = P.yaw;
  // (its glow sprites are kept: the diamond's blaze is the model's own; the game's sheets leave them to the game, design/evolutions/bake.js)
  B.update(P.pose.t, P.pose.act, P.pose.v);
  // THE FLOOR: dark lava crust split by glowing cracks, far into the haze (so the tilted horizon is a real one), and the hot glow under the follower
  const ft = cv(1024, 1024), fg = ft.getContext('2d'), fe = cv(1024, 1024), fge = fe.getContext('2d');
  const crack = (g, pts, w, c) => { g.strokeStyle = c; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
  if (ICE) {   // THE ICE FLOOR: packed snow and blue ice, frost cracks catching a faint cold light, far into the haze
    fg.fillStyle = '#121f33'; fg.fillRect(0, 0, 1024, 1024); fge.fillStyle = '#000'; fge.fillRect(0, 0, 1024, 1024);
    for (let k = 0; k < 500; k++) { const x = R() * 1024, y = R() * 1024, r = 8 + R() * 46; fg.fillStyle = 'rgba(' + (R() < 0.5 ? '70,100,140' : '14,30,52') + ',' + (0.25 + R() * 0.4) + ')'; fg.beginPath(); fg.arc(x, y, r, 0, 2 * PI); fg.fill(); }
    for (let k = 0; k < 30; k++) { let x = R() * 1024, y = R() * 1024, a = R() * 2 * PI; const pts = [[x, y]]; for (let j = 0; j < 8; j++) { a += (R() - 0.5) * 1.6; x += Math.cos(a) * 30; y += Math.sin(a) * 30; pts.push([x, y]); }
      const w = 1 + R() * 3; crack(fg, pts, w + 3, '#0a1626'); crack(fge, pts, w, 'rgba(120,200,255,0.35)'); }
  } else {
  fg.fillStyle = '#1a0805'; fg.fillRect(0, 0, 1024, 1024); fge.fillStyle = '#000'; fge.fillRect(0, 0, 1024, 1024);
  for (let k = 0; k < 400; k++) { const x = R() * 1024, y = R() * 1024, r = 10 + R() * 40; fg.fillStyle = 'rgba(' + (R() < 0.5 ? '40,16,10' : '10,4,3') + ',' + (0.3 + R() * 0.4) + ')'; fg.beginPath(); fg.arc(x, y, r, 0, 2 * PI); fg.fill(); }
  for (let k = 0; k < 34; k++) { let x = R() * 1024, y = R() * 1024, a = R() * 2 * PI; const pts = [[x, y]]; for (let j = 0; j < 9; j++) { a += (R() - 0.5) * 1.3; x += Math.cos(a) * 34; y += Math.sin(a) * 34; pts.push([x, y]); }
    const w = 2 + R() * 5; crack(fg, pts, w + 4, '#080202'); crack(fge, pts, w + 10, 'rgba(255,60,10,0.25)'); crack(fge, pts, w, '#ff6a1a'); crack(fge, pts, w * 0.4, '#ffd27a'); }
  }
  const tx = t => { const x = new T.CanvasTexture(t); x.encoding = T.sRGBEncoding; x.wrapS = x.wrapT = T.RepeatWrapping; x.repeat.set(6, 6); x.anisotropy = 8; return x; };
  const floor = new T.Mesh(new T.PlaneGeometry(60, 60), new T.MeshStandardMaterial({ map: tx(ft), emissiveMap: tx(fe), emissive: new T.Color(0xffffff), emissiveIntensity: 1.3, roughness: ICE ? 0.55 : 0.85, metalness: 0.1 }));
  floor.rotation.x = -PI / 2; scene.add(floor);
  const pool = cv(256, 256), pg = pool.getContext('2d'); const pgr = pg.createRadialGradient(128, 128, 0, 128, 128, 128); if (ICE) { pgr.addColorStop(0, 'rgba(150,220,255,0.5)'); pgr.addColorStop(0.4, 'rgba(90,170,255,0.2)'); pgr.addColorStop(1, 'rgba(60,140,255,0)'); } else { pgr.addColorStop(0, 'rgba(255,120,40,0.9)'); pgr.addColorStop(0.4, 'rgba(255,60,10,0.4)'); pgr.addColorStop(1, 'rgba(255,40,0,0)'); } pg.fillStyle = pgr; pg.fillRect(0, 0, 256, 256);
  const glowUnder = new T.Mesh(new T.PlaneGeometry(4.2, 4.2), new T.MeshBasicMaterial({ map: new T.CanvasTexture(pool), transparent: true, blending: T.AdditiveBlending, depthWrite: false }));
  glowUnder.rotation.x = -PI / 2; glowUnder.position.y = 0.02; scene.add(glowUnder);
  const HAZE = ICE ? '#0c2a4a' : '#3c0b05'; scene.fog = new T.Fog(new T.Color(HAZE), 5, 26);
  const cam = new T.PerspectiveCamera(P.cam.fov, W / H, 0.05, 80);
  cam.position.set(...P.cam.pos); cam.lookAt(new T.Vector3(...P.cam.look)); cam.rotateZ(P.cam.roll); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
  const grab = () => { renderer.render(scene, cam); const c = cv(); const g = c.getContext('2d'); g.imageSmoothingQuality = 'high'; g.drawImage(renderer.domElement, 0, 0, W, H); return c; };
  B.g.visible = false; const floorCv = grab();
  B.g.visible = true; glowUnder.visible = false;
  if (P.style === 'brawler') { floor.material.colorWrite = false; floor.renderOrder = -1; } else floor.visible = false;   // (a Brawler sits ON the floor, sunk into it: the floor hides what is under it (its cave's lower half) but is not drawn)
  const model = grab();
  // where things land on the picture: the heart (its diamond), its foot, the horizon (eye-level points far off, projected)
  const pr = v => { const p = new T.Vector3(...v).project(cam); return [(p.x * 0.5 + 0.5) * W, (1 - (p.y * 0.5 + 0.5)) * H]; };
  const heart = pr([0, B.core, 0]), foot = pr([0, 0, 0]);
  const fw = new T.Vector3(); cam.getWorldDirection(fw); fw.y = 0; fw.normalize(); const sideV = new T.Vector3(-fw.z, 0, fw.x), cp = cam.position;
  const far = s => pr([cp.x + (fw.x + sideV.x * s) * 500, cp.y, cp.z + (fw.z + sideV.z * s) * 500]);
  const hA = far(-0.6), hB = far(0.6), slope = Math.atan2(hB[1] - hA[1], hB[0] - hA[0]);
  const hzAt = x => hA[1] + (x - hA[0]) * Math.tan(slope);   // the horizon's height at x
  const up = [Math.sin(slope), -Math.cos(slope)];   // the world's up, on the picture (square to the horizon)
  const info = { heart: heart.map(Math.round), foot: foot.map(Math.round), horizonDeg: +(slope * 180 / PI).toFixed(1), horizonMid: Math.round(hzAt(W / 2)) };
  if (modelOnly) { const c = cv(), g = c.getContext('2d'); g.fillStyle = '#5a5f68'; g.fillRect(0, 0, W, H); g.drawImage(floorCv, 0, 0); g.drawImage(model, 0, 0); return { png: c.toDataURL('image/png'), info }; }
  if (P.style === 'brawler') return BRAWLER({ W, H, R, cv, model, floorCv, pr, hzAt, slope, up, info, P, B, mouthAt: P.impact ? pr(P.impact) : heart });

  // ---------- THE PICTURE, back to front ----------
  const out = cv(), g = out.getContext('2d');
  const rad = (x, y, r, stops) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); return gr; };
  const blob = (G, x, y, r, stops) => { const gr = G.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([o, c]) => gr.addColorStop(o, c)); G.fillStyle = gr; G.beginPath(); G.arc(x, y, r, 0, 2 * PI); G.fill(); };
  // 1. FAR: its element's world (the fire energy card's lava cave: js/energygem.js, painted with that card's own seed), tilted with the horizon, its floor line on the horizon, softened
  const ws = cv(450, 630), wm = cv(450, 630); { let s = 7; for (const ch of 'world' + P.world) s = (s * 31 + ch.charCodeAt(0)) % 2147483647; const RW = () => (s = (s * 16807) % 2147483647) / 2147483647;
    _EW_PAINT[P.world](ws.getContext('2d'), wm.getContext('2d'), wm.getContext('2d'), 450, 630, RW); }
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.filter = 'blur(2.5px)'; const k = 1.55; g.drawImage(ws, -225 * k, -630 * 0.74 * k, 450 * k, 630 * k); g.filter = 'none';
  g.globalAlpha = 0.6; g.drawImage(wm, -225 * k, -630 * 0.74 * k, 450 * k, 630 * k); g.restore(); g.globalAlpha = 1;
  // the haze along the horizon (the floor's fog, into the cave), and the glow of the lava beyond it
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); let lg = g.createLinearGradient(0, -160, 0, 40); lg.addColorStop(0, 'rgba(60,11,5,0)'); lg.addColorStop(0.75, 'rgba(90,20,6,0.85)'); lg.addColorStop(1, HAZE);
  g.fillStyle = lg; g.fillRect(-W, -160, 2 * W, 200); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(0, 0, W * 0.9, [[0, 'rgba(255,90,20,0.35)'], [1, 'rgba(255,60,10,0)']]); g.scale(1, 0.25); g.fillRect(-W, -W, 2 * W, 2 * W); g.restore();
  // 2. THE FLOOR (3-D), the far lava's glow along the horizon (so the tilt reads), and a heat glow round the follower
  g.drawImage(floorCv, 0, 0);
  g.save(); g.translate(W / 2, hzAt(W / 2)); g.rotate(slope); g.globalCompositeOperation = 'lighter';
  for (const [h, a] of [[34, 0.16], [12, 0.3], [3, 0.7]]) { const lb = g.createLinearGradient(0, -h, 0, h); lb.addColorStop(0, 'rgba(255,90,20,0)'); lb.addColorStop(0.5, 'rgba(255,' + (h < 5 ? 190 : 110) + ',' + (h < 5 ? 90 : 30) + ',' + a + ')'); lb.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = lb; g.fillRect(-W, -h, 2 * W, 2 * h); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(heart[0], heart[1], 230, [[0, 'rgba(255,110,30,0.55)'], [0.45, 'rgba(255,60,10,0.22)'], [1, 'rgba(255,40,0,0)']]); g.fillRect(0, 0, W, H); g.restore();
  // 3. THE FOLLOWER, CHARGED: its own silhouette glowing round it (wide and tight), flames licking up off its edges, its own render, its hollow and diamond blazing, embers rising off it
  const mask = (blur, col) => { const c = cv(), m = c.getContext('2d'); m.filter = 'blur(' + blur + 'px)'; m.drawImage(model, 0, 0); m.filter = 'none'; m.globalCompositeOperation = 'source-in'; m.fillStyle = col; m.fillRect(0, 0, W, H); return c; };
  g.save(); g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.9; g.drawImage(mask(22, '#ff3a08'), 0, 0); g.globalAlpha = 0.8; g.drawImage(mask(7, '#ff8a2a'), 0, 0); g.restore();
  // the flames off its edges: tongues rooted on the top of its silhouette, leaning up the world's up
  const md = model.getContext('2d').getImageData(0, 0, W, H).data, A = (x, y) => (x < 0 || y < 0 || x >= W || y >= H) ? 0 : md[(Math.floor(y) * W + Math.floor(x)) * 4 + 3];
  const edges = []; for (let x = 2; x < W - 2; x += 3) { for (let y = 0; y < H; y++) if (A(x, y) > 128) { edges.push([x, y]); break; } }
  const tongue = (G, x, y, len, wid, ang, bend, cols, alpha) => {   // a flame: a teardrop from its root (x, y) along ang, bending at its tip
    G.save(); G.translate(x, y); G.rotate(ang); G.globalAlpha = alpha;
    const gr = G.createLinearGradient(0, 0, 0, -len); cols.forEach(([o, c]) => gr.addColorStop(o, c)); G.fillStyle = gr;
    G.beginPath(); G.moveTo(-wid, 0); G.bezierCurveTo(-wid * 1.1, -len * 0.35, bend * 0.5 - wid * 0.4, -len * 0.7, bend, -len);
    G.bezierCurveTo(bend * 0.5 + wid * 0.4, -len * 0.7, wid * 1.1, -len * 0.35, wid, 0); G.quadraticCurveTo(0, wid * 0.8, -wid, 0); G.fill(); G.restore(); };
  const FIRE = [[0, 'rgba(255,240,190,1)'], [0.25, 'rgba(255,170,50,0.95)'], [0.6, 'rgba(255,70,10,0.7)'], [1, 'rgba(200,20,0,0)']];
  const upAng = Math.atan2(up[0], -up[1]);
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 70; k++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; tongue(g, e[0], e[1] + 4, 14 + R() * 30, 3 + R() * 5, upAng + (R() - 0.5) * 0.5, (R() - 0.5) * 14, FIRE, 0.35 + R() * 0.4); }
  g.restore();
  g.drawImage(model, 0, 0);
  g.save(); g.globalCompositeOperation = 'lighter'; blob(g, heart[0], heart[1], 70, [[0, 'rgba(255,230,160,0.55)'], [0.35, 'rgba(255,120,30,0.3)'], [1, 'rgba(255,60,10,0)']]); blob(g, heart[0], heart[1], 26, [[0, 'rgba(255,250,225,0.8)'], [1, 'rgba(255,200,120,0)']]);   // (the diamond blazing)

  for (let k = 0; k < 40; k++) { const e = edges[Math.floor(R() * edges.length)]; if (!e) continue; const d = 10 + R() * 90, x = e[0] + up[0] * d + (R() - 0.5) * 30, y = e[1] + up[1] * d + (R() - 0.5) * 10; blob(g, x, y, 1.5 + R() * 3, [[0, 'rgba(255,230,160,1)'], [0.4, 'rgba(255,120,30,0.8)'], [1, 'rgba(255,60,10,0)']]); }
  g.restore();
  // 4. NEAR: the crater erupting under the camera (HEXFIRE's crater opens where its enemy stands: here, at the lens). A fountain of lava bursts up the left, its spray arcing over
  //    toward the lens, sparks flying out of it; the crater's broken lip across the foot; flames at the very front, out of focus.
  const perp = [-up[1], up[0]];   // (across the world's up, on the picture: to the right)
  const at = (o, a, b) => [o[0] + up[0] * a + perp[0] * b, o[1] + up[1] * a + perp[1] * b];   // a point a along the world's up and b across from o
  const F0 = [W * 0.3, H * 0.84], FL = 470;   // the fountain's foot (behind the lip) and its height
  const fc = t => { const c = at(F0, FL * t, -18 * t * t + 10 * Math.sin(t * 7)); return c; };   // its middle line, leaning a little left as it rises
  const fw2 = t => 20 + 30 * t + 30 * Math.pow(t, 4);   // its half width: flaring at its top
  const lavaGrad = (G, x0, y0, x1, y1) => { const gr = G.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, 'rgba(150,20,0,0)'); gr.addColorStop(0.18, 'rgba(210,40,4,0.9)'); gr.addColorStop(0.38, '#ff7a14'); gr.addColorStop(0.5, '#ffe6a0'); gr.addColorStop(0.62, '#ff9a24'); gr.addColorStop(0.82, 'rgba(210,40,4,0.9)'); gr.addColorStop(1, 'rgba(150,20,0,0)'); return gr; };
  const drop = (G, x, y, ang, r, stretch) => { G.save(); G.translate(x, y); G.rotate(ang);
    const gr = G.createLinearGradient(-r * stretch, 0, r, 0); gr.addColorStop(0, 'rgba(200,30,0,0)'); gr.addColorStop(0.55, 'rgba(255,110,20,0.9)'); gr.addColorStop(0.85, '#ffd27a'); gr.addColorStop(1, '#fff4d0'); G.fillStyle = gr;
    G.beginPath(); G.moveTo(-r * stretch, 0); G.quadraticCurveTo(-r * 0.2, -r, r * 0.6, -r * 0.92); G.arc(r * 0.4, 0, r * 0.95, -PI / 2, PI / 2); G.quadraticCurveTo(-r * 0.2, r, -r * stretch, 0); G.fill();
    G.fillStyle = 'rgba(255,255,240,0.9)'; G.beginPath(); G.arc(r * 0.6, -r * 0.35, r * 0.22, 0, 2 * PI); G.fill(); G.restore(); };
  const fount = cv(), fo = fount.getContext('2d');
  // the plume: flames stacked up its middle line, rooted all the way up it and leaning with it (stacked light: white-hot where they crowd, at its heart and its foot)
  fo.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 230; k++) { const t = Math.pow(R(), 1.25) * 0.9, c = fc(t), w = fw2(t), p0 = at(c, 0, (R() - 0.5) * 1.5 * w), L = (50 + R() * 110) * (0.7 + 0.6 * t), wd = (8 + R() * 16) * (0.8 + 0.8 * t);
    tongue(fo, p0[0], p0[1], L, wd, upAng + (R() - 0.5) * 0.35, (R() - 0.5) * 30, FIRE, 0.11 + R() * 0.17); }
  fo.globalCompositeOperation = 'source-over';
  // the burst at its top and the drops flung out of it: arcs up and over, each drop stretched along its flight with a hot head and a glint
  const top = fc(0.86); const drops = [];
  for (let k = 0; k < 46; k++) { const a = Math.atan2(up[1], up[0]) + (R() - 0.35) * 2.4, sp = 40 + R() * 300, x = top[0] + Math.cos(a) * sp * (0.4 + R() * 0.6) + (R() - 0.5) * 30, y = top[1] + Math.sin(a) * sp * 0.5 + sp * sp * 0.0011 * R();
    const r = 2.5 + Math.pow(R(), 2) * 9; drops.push([x, y, a + 0.3 * R(), r, 2.5 + R() * 4]); }
  drops.forEach(d => drop(fo, ...d));
  for (let k = 0; k < 18; k++) { const a = Math.atan2(up[1], up[0]) + (R() - 0.5) * 1.2, d = R() * 50, p0 = [top[0] + Math.cos(a) * d, top[1] + Math.sin(a) * d]; blob(fo, p0[0], p0[1], 16 + R() * 22, [[0, 'rgba(255,240,190,0.95)'], [0.4, 'rgba(255,150,40,0.8)'], [1, 'rgba(220,40,4,0)']]); }   // (the burst's crown)
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(16px)'; g.drawImage(fount, 0, 0); g.filter = 'blur(5px)'; g.globalAlpha = 0.7; g.drawImage(fount, 0, 0); g.restore();   // (its heat: a wide glow and a near one)
  g.save(); g.filter = 'blur(0.6px)'; g.drawImage(fount, 0, 0); g.restore();
  // sparks: thin bright streaks thrown out of it, up and to the right, some across the follower
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
  for (let k = 0; k < 110; k++) { const t0 = 0.15 + R() * 0.75, s0 = fc(t0), a = Math.atan2(up[1], up[0]) + 0.25 + R() * 1.25, d = 20 + Math.pow(R(), 0.7) * 420, L = 6 + R() * 30;
    const x = s0[0] + Math.cos(a) * d, y = s0[1] + Math.sin(a) * d, ex = x - Math.cos(a) * L, ey = y - Math.sin(a) * L, lgS = g.createLinearGradient(x, y, ex, ey);
    lgS.addColorStop(0, 'rgba(255,248,215,1)'); lgS.addColorStop(0.3, 'rgba(255,170,50,0.85)'); lgS.addColorStop(1, 'rgba(255,60,10,0)'); g.strokeStyle = lgS; g.lineWidth = 0.8 + R() * 1.8; g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ey); g.stroke(); }
  g.restore();
  // the crater's lip: broken dark rock across the foot, tilted with the horizon, its edge glowing where the lava lights it, so the fountain bursts from behind it
  const lip = []; { let x = -20; while (x < W + 30) { const base = hzAt(x) + 170 + 26 * Math.sin(x * 0.011 + 1), y = base + (R() - 0.5) * 22 - (R() < 0.25 ? 18 * R() : 0); lip.push([x, y]); x += 8 + R() * 22; } }
  g.save(); g.beginPath(); g.moveTo(-20, H + 20); lip.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(W + 30, H + 20); g.closePath();
  const lyl = Math.min(...lip.map(q => q[1])); let lr = g.createLinearGradient(0, lyl, 0, H); lr.addColorStop(0, '#3a1208'); lr.addColorStop(0.18, '#160604'); lr.addColorStop(1, '#060202'); g.fillStyle = lr; g.fill();
  g.clip(); for (let k = 0; k < 40; k++) { const q = lip[Math.floor(R() * lip.length)], x = q[0], y = q[1] + 10 + R() * 120; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = 1 + R() * 2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (R() - 0.5) * 60, y + 20 + R() * 50); g.stroke(); }   // (its cracks and facets)
  g.globalCompositeOperation = 'lighter'; g.fillStyle = rad(F0[0], F0[1], 260, [[0, 'rgba(255,90,20,0.5)'], [1, 'rgba(255,60,10,0)']]); g.fillRect(0, 0, W, H); g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
  const lipPath = () => { g.beginPath(); lip.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); };
  g.restore();
  // its top face lit by the lava: a band under the edge, brightest near the fountain, and the edge itself catching the light there
  g.save(); g.beginPath(); g.moveTo(-20, H + 20); lip.forEach(([x, y]) => g.lineTo(x, y)); g.lineTo(W + 30, H + 20); g.closePath(); g.clip();
  for (let i = 1; i < lip.length; i++) { const [x0, y0] = lip[i - 1], [x1, y1] = lip[i], dF = Math.hypot((x0 + x1) / 2 - F0[0], (y0 + y1) / 2 - F0[1]), k = Math.max(0.12, 1 - dF / 300);
    const th = 8 + 10 * R(); g.fillStyle = 'rgba(' + Math.round(120 + 110 * k) + ',' + Math.round(30 + 40 * k) + ',8,' + (0.25 + 0.5 * k) + ')'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.lineTo(x1 - 2, y1 + th); g.lineTo(x0 + 2, y0 + th * (0.6 + 0.4 * R())); g.closePath(); g.fill(); }
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineJoin = 'round';
  for (let i = 1; i < lip.length; i++) { const [x0, y0] = lip[i - 1], [x1, y1] = lip[i], dF = Math.hypot((x0 + x1) / 2 - F0[0], (y0 + y1) / 2 - F0[1]), k = Math.max(0, 1 - dF / 260);
    if (k <= 0) continue; g.strokeStyle = 'rgba(255,170,70,' + (0.7 * k) + ')'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.restore();
  // flames at the lens: big soft tongues rising off the lip at the front left and right, out of focus (the nearest plane)
  const near = cv(), ng = near.getContext('2d'); ng.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 34; k++) { const x = -30 + Math.pow(R(), 1.4) * W * 0.5, y = H + 10 - R() * 60; tongue(ng, x, y, 80 + R() * 190 * (1 - x / W), 12 + R() * 22, upAng + (R() - 0.5) * 0.45, (R() - 0.5) * 50, FIRE, 0.22 + R() * 0.3); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(2.5px)'; g.drawImage(near, 0, 0); g.filter = 'none'; g.restore();
  // drops right at the lens: big, soft, flying past the top corners
  { const lens = cv(), lg2 = lens.getContext('2d'); [[W * 0.78, H * 0.1, 0.5, 15], [W * 0.95, H * 0.24, 0.9, 11], [W * 0.06, H * 0.05, -2.2, 13], [W * 0.62, H * 0.03, 0.2, 8]].forEach(([x, y, a, r]) => drop(lg2, x, y, a, r, 5));
    g.save(); g.filter = 'blur(5px)'; g.globalCompositeOperation = 'lighter'; g.drawImage(lens, 0, 0); g.filter = 'blur(2px)'; g.globalCompositeOperation = 'source-over'; g.globalAlpha = 0.8; g.drawImage(lens, 0, 0); g.restore(); }
  // bokeh: a few soft embers right at the lens
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 8; k++) { const x = R() * W, y = R() * H * 0.55, r = 10 + R() * 24; blob(g, x, y, r, [[0, 'rgba(255,170,70,0.18)'], [0.75, 'rgba(255,110,30,0.13)'], [1, 'rgba(255,80,20,0)']]); }
  g.restore();
  // 5. THE GRADE: a vignette, darker at the foot (the name plate reads over it)
  g.save(); g.fillStyle = rad(W * 0.55, H * 0.4, H * 0.75, [[0.5, 'rgba(0,0,0,0)'], [1, 'rgba(10,2,1,0.6)']]); g.fillRect(0, 0, W, H); g.restore();
  return { png: out.toDataURL('image/png'), info };
  }
};
</script></body></html>`;

(async () => {
  const P = SAMPLES[SAMPLE] && JSON.parse(JSON.stringify(SAMPLES[SAMPLE]));
  if (P && process.env.CARD_TRY) { const o = JSON.parse(process.env.CARD_TRY); for (const k in o) P[k] = (o[k] && typeof o[k] === 'object' && !Array.isArray(o[k])) ? Object.assign(P[k] || {}, o[k]) : o[k]; }   // (CARD_TRY: a JSON of settings to try in place of the sample's, for looking; never the baked card's)
  if (!THREE_DIR || !P || !OUT) { console.error('usage: node design/cards/attack/bake_attack.js <three-dir> <' + Object.keys(SAMPLES).join('|') + '> <out.png> [--model]'); process.exit(1); }
  const W = 450, H = 630;
  if (process.env.CARD_PAGE) fs.writeFileSync(process.env.CARD_PAGE, page);   // (CARD_PAGE: write the page out, to look for a slip in it)
  const b = await chromium.launch({ args: ['--no-sandbox', '--use-gl=swiftshader', '--enable-webgl', '--ignore-gpu-blocklist', '--enable-unsafe-swiftshader'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('**/three.min.js', r => r.fulfill({ contentType: 'application/javascript', body: fs.readFileSync(path.join(THREE_DIR, 'package/build/three.min.js'), 'utf8') }));
  await p.route('http://card.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://card.local/');
  const res = await p.evaluate(([P, W, H, m]) => window.__card(P, W, H, m), [P, W, H, MODEL_ONLY]);
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.from(res.png.split(',')[1], 'base64'));
  console.log('wrote ' + OUT + ' (' + W + ' x ' + H + ', ' + fs.statSync(OUT).size + ' bytes)  ' + JSON.stringify(res.info));
  await b.close();
})();
