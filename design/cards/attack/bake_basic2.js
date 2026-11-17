// THE BASIC ATTACK CARDS, ROUND 2: OPTIONS FOR SLASHING (docs/ATTACK-CARD-ART.md §2b and §4). The owner, 2026-11-17: the first set "Those need some work for sure. I don't really
// like them"; "Have one for each attack type in each element and we should eventually just combine those because we have basic attacks that are elementally infused"; "Show me
// options"; then: "You don't come up with three ice slashing cards, you come up with three slashing cards. And we can actually just reuse the elemental stuff that we had created
// earlier for the cards."
// So a basic card = ONE ATTACK-TYPE DESIGN (the shape: drawn here) + ONE ELEMENT (not designed again: its energy card's world, js/energygem.js, the same world the approved follower
// cards use far behind, and its colour from js/config.js ELEMENTS), combined. Three designs of SLASHING (the agent's, provisional), each element-neutral in shape:
//   A  "THE SWEEP": one huge blade arc swept across the card in motion, its tail fading, its head white-hot, sparks of the element's colour flung off its edge; the world tilted behind.
//   B  "THE CLAW MARKS": three huge rakes torn across the card, each a dark gash with a glowing lip in the element's colour and a white-hot edge, chips of the card knocked out.
//   C  "THE PICTURE CUT OPEN": the element's world itself cut in two along one diagonal stroke, the two halves pushed apart, the cut pouring the element's light, pieces of the
//      picture flung out of it.
// No follower on any of them. Painted flat on a 2-D canvas in Chromium (no 3-D), 450 x 630 (the card's .cd-art, 225 x 315, at 2x), from fixed seeds: the same picture every bake.
// Its glows are gradients and blur: a picture baked once, not an effect drawn every frame (docs/EFFECTS.md's flat-colour rule is for those).
//   node design/cards/attack/bake_basic2.js <type> <A|B|C> <element> <out.png>      (<type>: slashing; <element>: ice, fire)
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path');
const [TYN, OPT, ELN, OUT] = process.argv.slice(2);
const ROOT = path.join(__dirname, '..', '..', '..');
const worldSrc = fs.readFileSync(path.join(ROOT, 'js', 'energygem.js'), 'utf8');

// THE ELEMENTS: nothing new. `col` is the element's colour (js/config.js ELEMENTS); `hot` and `mid` the light and middle tones of its own world's glow (js/energygem.js),
// `night` its world's darkest tone. Another element is another entry of the same four.
const ELS = {
  ice:  { world: 'ice',  col: '#99ddff', mid: '#5ad8ff', hot: '#f2fbff', night: '#020818' },
  fire: { world: 'fire', col: '#ff3300', mid: '#ff8a1e', hot: '#fff0c8', night: '#120201' },
};
// THE TYPES: only slashing is drawn (the other four wait for the owner's choice of design)
const TYPES = { slashing: { seed: 101 } };
if (!TYPES[TYN] || !/^[ABC]$/.test(OPT || '') || !ELS[ELN] || !OUT) {
  console.error('usage: node design/cards/attack/bake_basic2.js <' + Object.keys(TYPES).join('|') + '> <A|B|C> <' + Object.keys(ELS).join('|') + '> <out.png>'); process.exit(1); }

// ---------- (run in the page) ----------
function KIT(W, H, seed) {
  let s = seed >>> 0 || 1; const R = () => (s = (s * 16807) % 2147483647) / 2147483647;   // (the design's seed alone: the same shape on every element)
  const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w || W; c.height = h || H; return c; };
  const A = (h, a) => 'rgba(' + [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16)).join(',') + ',' + a + ')';
  const rad = (g, x, y, r, stops) => { const gr = g.createRadialGradient(x, y, 0, x, y, r); stops.forEach(([q, c]) => gr.addColorStop(q, c)); return gr; };
  const blob = (g, x, y, r, stops) => { g.fillStyle = rad(g, x, y, r, stops); g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); };
  // the element's world, as its energy card paints it (its own seed), with its motes
  const world = (el) => { const ws = cv(450, 630), wm = cv(450, 630); let q = 7; for (const ch of 'world' + el) q = (q * 31 + ch.charCodeAt(0)) % 2147483647; const RW = () => (q = (q * 16807) % 2147483647) / 2147483647;
    _EW_PAINT[el](ws.getContext('2d'), wm.getContext('2d'), wm.getContext('2d'), 450, 630, RW); const c = cv(450, 630), g = c.getContext('2d'); g.drawImage(ws, 0, 0); g.globalAlpha = 0.7; g.drawImage(wm, 0, 0); return c; };
  // a tapered crescent on a circle: centre (cx, cy), radius r, angle a0 to a1, widest (w) at t = peak; its outline both sides (each point: x, y, angle, half-width)
  const crescent = (cx, cy, r, a0, a1, w, peak, n) => { n = n || 60; const out = [], inn = [];
    for (let i = 0; i <= n; i++) { const t = i / n, a = a0 + (a1 - a0) * t, k = t < peak ? Math.pow(t / peak, 0.7) : Math.pow((1 - t) / (1 - peak), 0.9), hw = w * k / 2;
      out.push([cx + Math.cos(a) * (r + hw), cy + Math.sin(a) * (r + hw), a, hw]); inn.push([cx + Math.cos(a) * (r - hw), cy + Math.sin(a) * (r - hw), a, hw]); }
    return { out, inn, path: (g) => { g.beginPath(); out.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); for (let i = inn.length - 1; i >= 0; i--) g.lineTo(inn[i][0], inn[i][1]); g.closePath(); } }; };
  const streak = (g, x, y, a, l, w, col) => { g.save(); g.translate(x, y); g.rotate(a); const lg = g.createLinearGradient(-l, 0, l, 0); lg.addColorStop(0, A(col, 0)); lg.addColorStop(0.5, A(col, 1)); lg.addColorStop(1, A(col, 0)); g.fillStyle = lg; g.fillRect(-l, -w / 2, 2 * l, w); g.restore(); };
  const spark = (g, x, y, a, l, w, hot, col) => { const lg = g.createLinearGradient(x, y, x - Math.cos(a) * l, y - Math.sin(a) * l); lg.addColorStop(0, A(hot, 1)); lg.addColorStop(0.35, A(col, 0.85)); lg.addColorStop(1, A(col, 0));
    g.strokeStyle = lg; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x, y); g.lineTo(x - Math.cos(a) * l, y - Math.sin(a) * l); g.stroke(); };
  // the grade, the same on every design: a vignette, the foot darkened so the name reads
  const grade = (g, E) => { g.fillStyle = rad(g, W * 0.5, H * 0.38, H * 0.8, [[0.45, 'rgba(0,0,0,0)'], [1, A(E.night, 0.7)]]); g.fillRect(0, 0, W, H);
    const fl = g.createLinearGradient(0, H * 0.6, 0, H); fl.addColorStop(0, A(E.night, 0)); fl.addColorStop(1, A(E.night, 0.65)); g.fillStyle = fl; g.fillRect(0, H * 0.6, W, H * 0.4); };
  return { R, cv, A, rad, blob, world, crescent, streak, spark, grade };
}

// ---------- A: THE SWEEP ----------
// The element's world tilted (about 11 degrees, the follower cards' Dutch angle) and dimmed; one huge crescent swept across the upper two thirds, from the upper left round to the
// right, as if at the lens: its glow, its body from the element's middle tone into its colour, a white-hot inner edge and head, speed lines inside its sweep, sparks of the element
// flung off its outer edge, a flash where its head tears through. The same for every element; only the colours and the world change.
// Other types, the same way (the move itself in motion, in front of the world): piercing a straight thrust at the lens and the ring of its burst; crushing a downward smash and the
// shockwave it throws; projectile a shot on its trail coming at the lens; elemental a burst of the element at the lens.
function OPTION_A(E, TY, W, H) {
  const K = KIT(W, H, TY.seed * 10 + 1), { R, cv, A, blob, crescent } = K, PI = Math.PI;
  const out = cv(), g = out.getContext('2d'); g.fillStyle = E.night; g.fillRect(0, 0, W, H);
  g.save(); g.translate(W / 2, H / 2); g.rotate(-0.19); g.filter = 'blur(2px)'; g.drawImage(K.world(E.world), -W * 0.66, -H * 0.62, W * 1.32, H * 1.24); g.restore();
  g.fillStyle = A(E.night, 0.35); g.fillRect(0, 0, W, H);
  const CX = -70, CY = 545, RR = 540, N = 90, S = crescent(CX, CY, RR, -1.42, -0.42, 120, 0.62, N);
  const along = (g2, cols) => { const lg = g2.createLinearGradient(S.out[0][0], S.out[0][1], S.out[N][0], S.out[N][1]); cols.forEach(([q, c]) => lg.addColorStop(q, c)); return lg; };
  const sl = cv(), sg = sl.getContext('2d');
  sg.save(); sg.filter = 'blur(24px)'; S.path(sg); sg.fillStyle = along(sg, [[0, A(E.col, 0)], [0.5, A(E.mid, 0.6)], [1, A(E.col, 0.95)]]); sg.fill(); sg.restore();
  S.path(sg); sg.fillStyle = along(sg, [[0, A(E.mid, 0)], [0.35, A(E.mid, 0.5)], [0.75, A(E.col, 0.92)], [1, A(E.hot, 1)]]); sg.fill();
  const inner = crescent(CX, CY, RR + 26, -1.28, -0.44, 40, 0.72, N); inner.path(sg); sg.fillStyle = along(sg, [[0, A(E.hot, 0)], [0.45, A(E.hot, 0.55)], [1, A(E.hot, 1)]]); sg.fill();
  sg.lineCap = 'round'; for (let i = 0; i < 20; i++) { const r = RR - 40 - R() * 130, a0 = -1.38 + R() * 0.45, a1 = a0 + 0.12 + R() * 0.35; sg.strokeStyle = A(E.col, 0.15 + R() * 0.35); sg.lineWidth = 1 + R() * 2.5; sg.beginPath(); sg.arc(CX, CY, r, a0, a1); sg.stroke(); }
  g.save(); g.globalCompositeOperation = 'lighter'; g.drawImage(sl, 0, 0); g.restore(); g.drawImage(sl, 0, 0);
  // sparks flung off its outer edge, along the sweep (the element's colours)
  g.save(); g.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 90; i++) { const t = 0.2 + Math.pow(R(), 0.6) * 0.8, p = S.out[Math.floor(t * N)], a = p[2] + 0.5 + R() * 0.7, d = R() * 90 * t, x = p[0] + Math.cos(p[2]) * d, y = p[1] + Math.sin(p[2]) * d;
    K.spark(g, x, y, a, 6 + R() * 26 * t, 0.8 + R() * 1.8, E.hot, E.col); }
  const hd = S.out[82]; blob(g, hd[0] - 34, hd[1] + 18, 130, [[0, A(E.hot, 0.65)], [0.3, A(E.col, 0.32)], [1, A(E.col, 0)]]);
  K.streak(g, hd[0] - 34, hd[1] + 18, -0.45, 120, 3, E.hot); K.streak(g, hd[0] - 34, hd[1] + 18, 1.12, 60, 2, E.hot);
  for (let i = 0; i < 8; i++) { const x = R() * W, y = R() * H * 0.6, r = 7 + R() * 16; blob(g, x, y, r, [[0, A(E.hot, 0.2)], [0.7, A(E.col, 0.1)], [1, A(E.col, 0)]]); }   // (soft motes at the lens)
  g.restore();
  K.grade(g, E); return out;
}

// ---------- B: THE CLAW MARKS ----------
// The element's world level and dimmed, as on its energy card; three huge rakes torn across it from the top right down to the left, bowed a little, stopping above the name: each a
// gash (its shadow, a lip in the element's colour with its glow, a white-hot edge, a dark floor cut into the card), and chips of the card knocked out at its ends. Bold enough to read
// at a glance; the same marks on every element.
// Other types, the same way (the mark the hit leaves on the card): piercing one deep puncture with short cracks; crushing a dent with cracks out from it; projectile a scorched impact
// with the streak it came on; elemental the element's light bursting out of a split.
function OPTION_B(E, TY, W, H) {
  const K = KIT(W, H, TY.seed * 10 + 2), { R, cv, A, crescent } = K, PI = Math.PI;
  const out = cv(), g = out.getContext('2d'); g.drawImage(K.world(E.world), 0, 0); g.fillStyle = A(E.night, 0.45); g.fillRect(0, 0, W, H);
  const ang = Math.atan2(410 - 20, 30 - 430), dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, C0 = [236, 180];
  const rakes = [[-82, 0.84], [0, 1], [82, 0.84]].map(([o, k]) => { const cx = C0[0] + nx * (o + 1000), cy = C0[1] + ny * (o + 1000), r = 1000, a = Math.atan2(C0[1] + ny * o - cy, C0[0] + nx * o - cx), half = 0.3 * k;
    return { cx, cy, r, a0: a - half, a1: a + half, w: 62 * k }; });
  const lips = cv(), lg = lips.getContext('2d');
  rakes.forEach(rk => { rk.S = crescent(rk.cx, rk.cy, rk.r, rk.a1, rk.a0, rk.w, 0.42, 80); });
  rakes.forEach(rk => { g.save(); g.translate(6, 8); rk.S.path(g); g.fillStyle = A(E.night, 0.6); g.filter = 'blur(3px)'; g.fill(); g.restore(); });
  rakes.forEach(rk => { rk.S.path(lg); lg.fillStyle = E.col; lg.fill(); });
  g.save(); g.globalCompositeOperation = 'lighter'; g.filter = 'blur(16px)'; g.drawImage(lips, 0, 0); g.filter = 'blur(5px)'; g.drawImage(lips, 0, 0); g.restore();
  rakes.forEach(rk => { const { cx, cy, r, a0, a1, w } = rk;
    rk.S.path(g); g.fillStyle = E.col; g.fill();
    const S2 = crescent(cx, cy, r, a1 - 0.01, a0 + 0.01, w * 0.7, 0.42, 80); S2.path(g); g.fillStyle = E.hot; g.fill();
    const S3 = crescent(cx, cy, r - w * 0.08, a1 - 0.025, a0 + 0.025, w * 0.4, 0.42, 80); S3.path(g); g.fillStyle = E.night; g.fill();
    const S4 = crescent(cx, cy, r - w * 0.12, a1 - 0.05, a0 + 0.05, w * 0.12, 0.42, 80); S4.path(g); g.fillStyle = A(E.col, 0.35); g.fill();   // (a faint glow in the gash's floor)
  });
  // chips knocked out at the rakes' ends and along their lips: small angular pieces, the element's colour on one face
  rakes.forEach(rk => { for (let i = 0; i < 9; i++) { const t = R() < 0.5 ? R() * 0.2 : 0.8 + R() * 0.2, p = rk.S.out[Math.floor(t * 80)], a = p[2] + (R() - 0.5) * 1.6, d = 10 + R() * 34, x = p[0] + Math.cos(a) * d, y = p[1] + Math.sin(a) * d, r = 3 + R() * 5;
    if (y > H * 0.68) continue; g.save(); g.translate(x, y); g.rotate(R() * PI); g.beginPath(); g.moveTo(-r, -r * 0.5); g.lineTo(r * 0.7, -r); g.lineTo(r, r * 0.6); g.lineTo(-r * 0.3, r * 0.9); g.closePath();
    g.fillStyle = E.hot; g.fill(); g.fillStyle = A(E.col, 0.9); g.beginPath(); g.moveTo(r * 0.7, -r); g.lineTo(r, r * 0.6); g.lineTo(-r * 0.3, r * 0.9); g.closePath(); g.fill(); g.restore(); } });
  g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < 30; i++) { const rk = rakes[i % 3], p = rk.S.out[10 + Math.floor(R() * 60)]; K.spark(g, p[0] + (R() - 0.5) * 20, p[1] + (R() - 0.5) * 20, p[2] + PI * 0.5 + (R() - 0.5), 8 + R() * 18, 1 + R(), E.hot, E.col); } g.restore();
  K.grade(g, E); return out;
}

// ---------- C: THE PICTURE CUT OPEN ----------
// The element's world is the card's picture; one stroke cuts it in two along a diagonal from the top right down to the left: the two halves pushed apart across the cut and slid
// along it (as a thing sliced through), the gap between them pouring the element's light (a wide glow, its colour, a white-hot core), each half's cut edge lit, pieces of the
// picture flung out of the cut. The same cut on every element.
// Other types, the same way (the picture itself takes the hit): piercing a hole punched through the picture, the light behind it; crushing the picture caved in at a point, buckled
// round it; projectile a hole blown through, the picture scorched round it on the shot's side; elemental the picture dissolving into the element's light from the middle out.
function OPTION_C(E, TY, W, H) {
  const K = KIT(W, H, TY.seed * 10 + 3), { R, cv, A, blob } = K, PI = Math.PI;
  const wd = K.world(E.world);
  // the cut: a nearly straight line from off the top right to off the left, through the upper middle
  const P0 = [W + 40, 40], P1 = [-40, 400], CTL = [238, 238], NPT = 40;
  const pt = t => [(1 - t) * (1 - t) * P0[0] + 2 * (1 - t) * t * CTL[0] + t * t * P1[0], (1 - t) * (1 - t) * P0[1] + 2 * (1 - t) * t * CTL[1] + t * t * P1[1]];
  const line = []; for (let i = 0; i <= NPT; i++) line.push(pt(i / NPT));
  const dir = [P1[0] - P0[0], P1[1] - P0[1]], dl = Math.hypot(...dir), ux = dir[0] / dl, uy = dir[1] / dl, nx = -uy, ny = ux;   // (u along the cut, n across it)
  const MG = 80, half = (lower) => { const c = cv(W + 2 * MG, H + 2 * MG), q = c.getContext('2d'); q.translate(MG, MG); q.beginPath();   // (drawn with a margin round it: pushed apart, a half still covers the card)
    line.forEach(([x, y], i) => i ? q.lineTo(x, y) : q.moveTo(x, y));
    if (lower) { q.lineTo(-60, H + 60); q.lineTo(W + 60, H + 60); } else { q.lineTo(-60, -60); q.lineTo(W + 60, -60); } q.closePath(); q.clip(); q.drawImage(wd, -W * 0.15, -H * 0.1, W * 1.3, H * 1.3); return c; };   // (a little larger than the card: pushed apart, its halves still reach the card's edges)
  const sgnLow = (ny > 0 ? 1 : -1), GAP = 28, SLIDE = 40, TWIST = 0.035;
  const out = cv(), g = out.getContext('2d'); g.fillStyle = E.night; g.fillRect(0, 0, W, H);
  // the light in the cut (under both halves): wide, then near, then the core along the cut
  const light = cv(), lg = light.getContext('2d'); lg.lineCap = 'round'; lg.lineJoin = 'round';
  const trace = (q) => { q.beginPath(); line.forEach(([x, y], i) => i ? q.lineTo(x, y) : q.moveTo(x, y)); };
  for (const [w, c, b] of [[120, A(E.col, 0.5), 30], [46, A(E.mid, 0.85), 10], [22, A(E.hot, 1), 3]]) { lg.save(); lg.filter = 'blur(' + b + 'px)'; lg.strokeStyle = c; lg.lineWidth = w; trace(lg); lg.stroke(); lg.restore(); }
  g.drawImage(light, 0, 0);
  // the two halves, apart: the upper half up-left and slid back along the cut, the lower half down-right and slid forward
  const up = half(false), lo = half(true), dn = sgnLow;
  const offU = [-nx * dn * GAP - ux * SLIDE, -ny * dn * GAP - uy * SLIDE], offL = [nx * dn * GAP + ux * SLIDE, ny * dn * GAP + uy * SLIDE];
  const place = (c, off, tw) => { const pv = pt(0.5); g.save(); g.translate(pv[0] + off[0], pv[1] + off[1]); g.rotate(tw); g.translate(-pv[0], -pv[1]); g.drawImage(c, -MG, -MG); g.restore(); };
  const shade = (c) => { const k = cv(c.width, c.height), q = k.getContext('2d'); q.filter = 'blur(6px)'; q.drawImage(c, 0, 0); q.filter = 'none'; q.globalCompositeOperation = 'source-in'; q.fillStyle = A(E.night, 0.85); q.fillRect(0, 0, c.width, c.height); return k; };
  // (each half casts a soft shadow onto the light beside it: it lies over the gap, a sheet cut through)
  place(shade(up), [offU[0] + 2, offU[1] + 6], -TWIST); place(shade(lo), [offL[0] + 2, offL[1] + 6], TWIST);
  place(up, offU, -TWIST); place(lo, offL, TWIST);
  g.fillStyle = A(E.night, 0.3); g.fillRect(0, 0, W, H);   // (the picture dimmed a little: the cut is the focus)
  // the cut's light over the edges: each edge lit in the element's colour, the gap's core, a glow spilling over both halves
  g.save(); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [off, tw] of [[offU, -TWIST], [offL, TWIST]]) { const pv = pt(0.5); g.save(); g.translate(pv[0] + off[0], pv[1] + off[1]); g.rotate(tw); g.translate(-pv[0], -pv[1]); g.strokeStyle = A(E.hot, 0.9); g.lineWidth = 2.2; trace(g); g.stroke(); g.filter = 'blur(6px)'; g.strokeStyle = A(E.col, 0.7); g.lineWidth = 8; trace(g); g.stroke(); g.restore(); }
  g.filter = 'blur(30px)'; g.strokeStyle = A(E.col, 0.3); g.lineWidth = 90; trace(g); g.stroke(); g.filter = 'none';
  // the flash where the stroke is deepest, and sparks along the cut, thrown the way it went (down to the left)
  const mid = pt(0.45); blob(g, mid[0], mid[1], 140, [[0, A(E.hot, 0.55)], [0.3, A(E.col, 0.3)], [1, A(E.col, 0)]]); K.streak(g, mid[0], mid[1], Math.atan2(uy, ux), 150, 3, E.hot); K.streak(g, mid[0], mid[1], Math.atan2(uy, ux) + PI / 2, 50, 2, E.hot);
  for (let i = 0; i < 70; i++) { const t = R(), p = pt(t), a = Math.atan2(uy, ux) + (R() - 0.5) * 0.9, d = R() * 60; K.spark(g, p[0] + Math.cos(a) * d, p[1] + Math.sin(a) * d, a, 8 + R() * 26, 0.8 + R() * 1.6, E.hot, E.col); }
  g.restore();
  // pieces of the picture flung out of the cut: small slivers of the world, lit at one edge
  for (let i = 0; i < 16; i++) { const t = 0.12 + R() * 0.8, p = pt(t), side = R() < 0.5 ? 1 : -1, d = 22 + R() * 70, x = p[0] + nx * side * d + ux * R() * 30, y = p[1] + ny * side * d + uy * R() * 30, r = 5 + R() * 9, rot = R() * PI;
    if (y > H * 0.68 || x < 4 || x > W - 4) continue;
    g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(-r * 1.6, -r * 0.3); g.lineTo(r * 1.2, -r * 0.6); g.lineTo(r * 1.6, r * 0.4); g.lineTo(-r * 0.8, r * 0.5); g.closePath();
    g.save(); g.clip(); g.rotate(-rot); g.drawImage(wd, -x, -y); g.restore(); g.strokeStyle = A(E.hot, 0.9); g.lineWidth = 1.4; g.stroke(); g.restore(); }
  K.grade(g, E); return out;
}

const page = `<!doctype html><html><body style="margin:0;background:#000"><script>
${worldSrc}
${KIT.toString()}
${OPTION_A.toString()}
${OPTION_B.toString()}
${OPTION_C.toString()}
window.__card = function (opt, E, TY, W, H) { return ({ A: OPTION_A, B: OPTION_B, C: OPTION_C })[opt](E, TY, W, H).toDataURL('image/png'); };
</script></body></html>`;

(async () => {
  const W = 450, H = 630;
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.route('http://card.local/', r => r.fulfill({ contentType: 'text/html', body: page }));
  await p.goto('http://card.local/');
  const url = await p.evaluate(([o, E, TY, W, H]) => window.__card(o, E, TY, W, H), [OPT, ELS[ELN], TYPES[TYN], W, H]);
  if (errs.length) { console.error(errs.join('\n')); process.exit(1); }
  await b.close();
  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, Buffer.from(url.split(',')[1], 'base64')); console.log('wrote ' + OUT + '  ' + fs.statSync(OUT).size + ' bytes');
})();
