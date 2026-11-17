// THE BASIC ATTACK CARDS' PICTURES (docs/ATTACK-CARD-ART.md §2b; the owner, 2026-11-17: "Now do a different card for followers' basic attacks. You can use basically generic
// looking cards for this, but make them have a little bit of character for the different types of attacks that we have in the game.").
// One generic card per attack type of the followers' basic attacks (js/damage.js DMG_FORM `main`): slashing, piercing, crushing, projectile, elemental. No follower on them
// (the one family without a follower's model). Painted flat on a 2-D canvas in Chromium, 450 x 630 (the card's .cd-art, 225 x 315, at 2x), from a fixed seed, so a card bakes the same every time.
// The family (the agent's, provisional): the same calm, level card for all five: the game's navy, its faint hex grid and slanted light streaks, a vignette; in the middle of the upper
// half the same hexagonal plate (the game's six-sided crystal shape), and on it the type's own kind of hit, in the type's own colour (the game gives the types a face each,
// js/battleview.js BV_FACES, but no colour: these colours are the agent's). No tilted camera and nothing in the very front: calmer than the follower cards.
//   node design/cards/attack/bake_basic.js <type> <out.png>      (<type>: slashing, piercing, crushing, projectile, elemental)
// Its glows are gradients and blur: a picture baked once, not an effect drawn every frame (docs/EFFECTS.md's flat-colour rule is for those).
const { chromium } = require('playwright');
const fs = require('fs');
const TYPE = process.argv[2], OUT = process.argv[3];

// THE TYPES (the agent's colours, provisional; the elements' colours from js/config.js ELEMENTS)
const TYPES = {
  slashing:   { col: '#ff4d6d', hot: '#ffe3e9', seed: 101 },   // crimson: three claw rakes torn across the plate
  piercing:   { col: '#9fb4ff', hot: '#f2f5ff', seed: 202 },   // steel periwinkle: a needle thrust clean through the plate's middle
  crushing:   { col: '#ffa04a', hot: '#fff0dc', seed: 303 },   // amber: the plate dented in, cracked, a shockwave rolling out
  projectile: { col: '#19e6c1', hot: '#eafffa', seed: 404 },   // the game's teal: a shot streaking in on its trail, just striking the plate
  elemental:  { col: '#ffffff', hot: '#ffffff', seed: 505,     // every element at once: it is the same type for every element
                els: ['#ff3300', '#ffee33', '#66ff66', '#00ccaa', '#99ddff', '#9933ff', '#ff7ab8'] },
};
if (!TYPES[TYPE] || !OUT) { console.error('usage: node design/cards/attack/bake_basic.js <' + Object.keys(TYPES).join('|') + '> <out.png>'); process.exit(1); }

// THE PAINTER (runs in the page)
function paint(type, T) {
  const W = 450, H = 630, CX = 225, CY = 232, R = 106;   // the plate: in the middle of the upper half, clear of the corner chips and the name plate
  const cv = document.createElement('canvas'); cv.width = W; cv.height = H; const g = cv.getContext('2d');
  let s = T.seed >>> 0; const rnd = () => { s = (s + 0x6D2B79F5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const rgba = (hex, a) => { const n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; };
  const hexPath = (x, y, r, rot = 0) => { g.beginPath(); for (let i = 0; i < 6; i++) { const a = rot + Math.PI / 6 + i * Math.PI / 3; g[i ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a)); } g.closePath(); };
  const glow = (col, blur, fn) => { g.save(); g.shadowColor = col; g.shadowBlur = blur; fn(); g.restore(); };

  // 1. THE GROUND (the same on all five): the game's navy, a wash of the type's colour behind the plate, the hex grid, two slanted streaks, a vignette
  let gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#0f1730'); gr.addColorStop(0.55, '#0b1124'); gr.addColorStop(1, '#05070f'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const washes = T.els ? T.els.map((c, i) => [c, CX + 150 * Math.cos(i * 2 * Math.PI / 7 - 1.2), CY + 150 * Math.sin(i * 2 * Math.PI / 7 - 1.2)]) : [[T.col, CX, CY]];
  g.save(); g.globalCompositeOperation = 'lighter';
  for (const [c, x, y] of washes) { gr = g.createRadialGradient(x, y, 0, x, y, T.els ? 210 : 300); gr.addColorStop(0, rgba(c, T.els ? 0.13 : 0.24)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(0, 0, W, H); }
  g.restore();
  g.save(); g.strokeStyle = 'rgba(140,175,230,0.07)'; g.lineWidth = 1; const hs = 21, hw = hs * Math.sqrt(3);
  for (let row = -1; row * hs * 1.5 < H + hs; row++) for (let col = -1; col * hw < W + hw; col++) hexPath(col * hw + (row & 1 ? hw / 2 : 0), row * hs * 1.5, hs), g.stroke();
  g.restore();
  g.save(); g.globalCompositeOperation = 'lighter'; g.translate(CX, CY); g.rotate(-0.42);
  for (const [off, w, a] of [[-170, 60, 0.05], [120, 34, 0.04], [200, 14, 0.05]]) { gr = g.createLinearGradient(off - w, 0, off + w, 0); gr.addColorStop(0, rgba(T.els ? '#9fb8ff' : T.col, 0)); gr.addColorStop(0.5, rgba(T.els ? '#9fb8ff' : T.col, a)); gr.addColorStop(1, rgba(T.els ? '#9fb8ff' : T.col, 0)); g.fillStyle = gr; g.fillRect(off - w, -700, 2 * w, 1400); }
  g.restore();

  // 2. THE PLATE (the same on all five): a six-sided plate, dark, with a bevel and an edge lit in the type's colour; its shadow on the card under it
  const plate = (dent) => {
    glow('rgba(0,0,0,0.7)', 30, () => { hexPath(CX, CY + 10, R); g.fillStyle = 'rgba(3,5,12,0.6)'; g.fill(); });
    hexPath(CX, CY, R); gr = g.createLinearGradient(CX - R, CY - R, CX + R, CY + R); gr.addColorStop(0, '#1d2a4c'); gr.addColorStop(0.5, '#121b36'); gr.addColorStop(1, '#0a1022'); g.fillStyle = gr; g.fill();
    hexPath(CX, CY, R * 0.84); gr = g.createLinearGradient(CX + R, CY + R, CX - R, CY - R); gr.addColorStop(0, '#18244a'); gr.addColorStop(1, '#0c1328'); g.fillStyle = gr; g.fill();
    g.save(); hexPath(CX, CY, R * 0.84); g.clip(); g.strokeStyle = 'rgba(150,185,240,0.07)'; g.lineWidth = 1; for (let k = -R; k < R; k += 9) { g.beginPath(); g.moveTo(CX - R, CY + k); g.lineTo(CX + R, CY + k - R * 0.6); g.stroke(); } g.restore();
    const ec = T.els ? '#cfe0ff' : T.col;
    glow(rgba(ec, 0.8), 16, () => { hexPath(CX, CY, R); g.strokeStyle = rgba(ec, 0.75); g.lineWidth = 3; g.stroke(); });
    hexPath(CX, CY, R * 0.84); g.strokeStyle = rgba(ec, 0.22); g.lineWidth = 1.5; g.stroke();
    hexPath(CX, CY, R - 1); g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 1; g.stroke();
  };
  const motes = (n, cols, rMin, rMax) => { g.save(); g.globalCompositeOperation = 'lighter'; for (let i = 0; i < n; i++) { const a = rnd() * Math.PI * 2, d = rMin + rnd() * (rMax - rMin), x = CX + Math.cos(a) * d, y = CY + Math.sin(a) * d * 0.95, r = 0.8 + rnd() * 1.8, c = cols[i % cols.length];
    if (y > 380) continue; gr = g.createRadialGradient(x, y, 0, x, y, r * 4); gr.addColorStop(0, rgba(c, 0.9)); gr.addColorStop(0.3, rgba(c, 0.35)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; g.fillRect(x - r * 4, y - r * 4, r * 8, r * 8); } g.restore(); };

  // 3. THE HIT, one per type
  if (type === 'slashing') {
    // three claw rakes torn across the plate from top right to bottom left: each a dark gash with a crimson glowing lip and a white-hot edge
    plate();
    const ang = 2.25, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, L = 138;
    const rake = (off, len, wid, bend) => {
      const ax = CX + nx * off - dx * len, ay = CY + ny * off - dy * len, bx = CX + nx * off + dx * len, by = CY + ny * off + dy * len;
      const mx = CX + nx * (off + bend), my = CY + ny * (off + bend);
      const shape = (w) => { g.beginPath(); g.moveTo(ax, ay); g.quadraticCurveTo(mx + nx * w, my + ny * w, bx, by); g.quadraticCurveTo(mx - nx * w, my - ny * w, ax, ay); g.closePath(); };
      g.save(); g.globalCompositeOperation = 'lighter'; glow(T.col, 34, () => { shape(wid * 1.5); g.fillStyle = rgba(T.col, 0.55); g.fill(); }); g.restore();
      shape(wid); g.fillStyle = T.col; g.fill();
      shape(wid * 0.62); g.fillStyle = T.hot; g.fill();
      g.save(); g.translate(-nx * wid * 0.18, -ny * wid * 0.18); shape(wid * 0.34); g.fillStyle = '#2a0710'; g.fill(); g.restore();   // the gash's dark floor, a little to one side: cut into the card
    };
    rake(-50, L * 0.8, 14, 10); rake(0, L, 19, 12); rake(50, L * 0.8, 14, 10);
    motes(18, [T.col, T.hot], 60, 190);
  } else if (type === 'piercing') {
    // a needle thrust straight through the plate's middle: its shaft in from the left, the hole it punched (a bright rim, short cracks), its point out on the right, glinting
    // faint speed lines along the line of the thrust behind it
    const ang = -0.22, dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < 9; i++) { const o = (rnd() - 0.5) * 150, st = -260 - rnd() * 60, en = -120 - rnd() * 90, x1 = CX + dx * st + nx * o, y1 = CY + dy * st + ny * o, x2 = CX + dx * en + nx * o, y2 = CY + dy * en + ny * o;
      gr = g.createLinearGradient(x1, y1, x2, y2); gr.addColorStop(0, rgba(T.col, 0)); gr.addColorStop(1, rgba(T.col, 0.35)); g.strokeStyle = gr; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
    g.restore();
    plate();
    const P = (t, o) => [CX + dx * t + nx * o, CY + dy * t + ny * o];
    // the hole: a dark puncture with a lit rim and six short cracks out from it
    g.save(); g.strokeStyle = rgba(T.hot, 0.75); g.lineWidth = 2; for (let i = 0; i < 7; i++) { const a = i * Math.PI * 2 / 7 + 0.3 + rnd() * 0.3, l1 = 22, l2 = 40 + rnd() * 34; g.beginPath(); g.moveTo(CX + Math.cos(a) * l1, CY + Math.sin(a) * l1);
      g.lineTo(CX + Math.cos(a + 0.12) * (l1 + l2) * 0.55, CY + Math.sin(a + 0.12) * (l1 + l2) * 0.55); g.lineTo(CX + Math.cos(a - 0.05) * (l1 + l2), CY + Math.sin(a - 0.05) * (l1 + l2)); g.stroke(); } g.restore();
    glow(T.col, 26, () => { g.beginPath(); g.ellipse(CX, CY, 21, 19, ang, 0, Math.PI * 2); g.fillStyle = '#050812'; g.fill(); g.strokeStyle = T.col; g.lineWidth = 3; g.stroke(); });
    // the needle: shaft and point one long taper, lit along its top edge
    const needle = (t0, t1, w0, w1) => { const [a1, a2] = [P(t0, w0), P(t0, -w0)], [b1, b2] = [P(t1, w1), P(t1, -w1)]; g.beginPath(); g.moveTo(a1[0], a1[1]); g.lineTo(b1[0], b1[1]); g.lineTo(b2[0], b2[1]); g.lineTo(a2[0], a2[1]); g.closePath(); };
    const steel = () => { const [p1, p2] = [P(0, -9), P(0, 9)]; const s2 = g.createLinearGradient(p1[0], p1[1], p2[0], p2[1]); s2.addColorStop(0, T.hot); s2.addColorStop(0.35, T.col); s2.addColorStop(0.75, '#36457a'); s2.addColorStop(1, '#151c38'); return s2; };
    glow(rgba(T.col, 0.9), 18, () => { needle(-300, -16, 8.5, 7.2); g.fillStyle = steel(); g.fill(); });
    const tip = [CX + dx * 205, CY + dy * 205];
    glow(rgba(T.col, 0.9), 18, () => { g.beginPath(); const [u1, u2] = [P(14, 7), P(14, -7)]; g.moveTo(u1[0], u1[1]); g.lineTo(tip[0], tip[1]); g.lineTo(u2[0], u2[1]); g.closePath(); g.fillStyle = steel(); g.fill(); });
    g.beginPath(); g.ellipse(CX, CY, 21, 19, ang, Math.PI * 0.05, Math.PI * 0.95); g.strokeStyle = T.col; g.lineWidth = 3; g.stroke();   // the hole's near lip over the needle: it goes through
    g.save(); g.globalCompositeOperation = 'lighter'; for (const [l, w, a] of [[44, 2.2, 0], [26, 1.6, Math.PI / 2]]) { g.save(); g.translate(tip[0], tip[1]); g.rotate(a + ang); gr = g.createLinearGradient(-l, 0, l, 0); gr.addColorStop(0, rgba(T.hot, 0)); gr.addColorStop(0.5, T.hot); gr.addColorStop(1, rgba(T.hot, 0)); g.fillStyle = gr; g.fillRect(-l, -w / 2, 2 * l, w); g.restore(); }
      gr = g.createRadialGradient(tip[0], tip[1], 0, tip[0], tip[1], 20); gr.addColorStop(0, rgba(T.hot, 0.95)); gr.addColorStop(1, rgba(T.col, 0)); g.fillStyle = gr; g.fillRect(tip[0] - 20, tip[1] - 20, 40, 40); g.restore();
    motes(10, [T.col, T.hot], 70, 180);
  } else if (type === 'crushing') {
    // a heavy blow: two rings of shockwave rolling out over the card, then the plate dented in at its middle (a bowl: its far side lit, its near side in shadow),
    // a few thick cracks out to its edges, chips of it knocked up, dust
    g.save(); g.globalCompositeOperation = 'lighter';
    for (const [r, w, a] of [[158, 7, 0.55], [134, 3, 0.4], [184, 2, 0.22]]) glow(T.col, 22, () => { g.beginPath(); g.ellipse(CX, CY + 4, r, r * 0.78, 0, 0, Math.PI * 2); g.strokeStyle = rgba(T.col, a); g.lineWidth = w; g.stroke(); });
    g.restore();
    plate();
    g.save(); hexPath(CX, CY, R * 0.98); g.clip();
    gr = g.createRadialGradient(CX - 8, CY - 10, 4, CX, CY, 74); gr.addColorStop(0, '#04060d'); gr.addColorStop(0.55, '#0b1226'); gr.addColorStop(0.85, 'rgba(30,40,72,0.6)'); gr.addColorStop(1, 'rgba(30,40,72,0)'); g.fillStyle = gr; g.beginPath(); g.arc(CX, CY, 78, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.arc(CX, CY, 62, Math.PI * 0.05, Math.PI * 0.95); g.strokeStyle = rgba(T.hot, 0.55); g.lineWidth = 3; g.stroke();   // the bowl's lit far rim (the light from above, the dent's lower inside facing it)
    g.beginPath(); g.arc(CX, CY, 64, Math.PI * 1.1, Math.PI * 1.9); g.strokeStyle = 'rgba(0,0,0,0.6)'; g.lineWidth = 5; g.stroke();
    g.strokeStyle = rgba(T.col, 0.85); g.lineCap = 'round';
    for (let i = 0; i < 6; i++) { let a = i * Math.PI / 3 + 0.35 + (rnd() - 0.5) * 0.4, d = 30, x = CX + Math.cos(a) * d, y = CY + Math.sin(a) * d; g.lineWidth = 3.2; g.beginPath(); g.moveTo(x, y);
      while (d < R * 1.05) { d += 16 + rnd() * 14; a += (rnd() - 0.5) * 0.35; x = CX + Math.cos(a) * d; y = CY + Math.sin(a) * d; g.lineTo(x, y); g.lineWidth = Math.max(1, g.lineWidth - 0.6); } glow(T.col, 10, () => g.stroke()); }
    g.restore();
    gr = g.createRadialGradient(CX, CY, 0, CX, CY, 46); gr.addColorStop(0, rgba(T.hot, 0.55)); gr.addColorStop(0.4, rgba(T.col, 0.25)); gr.addColorStop(1, rgba(T.col, 0)); g.save(); g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(CX - 50, CY - 50, 100, 100); g.restore();
    // chips of the plate knocked up and out
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (rnd() - 0.5) * 2.6, d = 115 + rnd() * 60, x = CX + Math.cos(a) * d, y = CY + Math.sin(a) * d * 0.78, r = 4 + rnd() * 6, rot = rnd() * 6;
      g.save(); g.translate(x, y); g.rotate(rot); g.beginPath(); g.moveTo(-r, -r * 0.4); g.lineTo(r * 0.6, -r); g.lineTo(r, r * 0.5); g.lineTo(-r * 0.3, r * 0.8); g.closePath(); g.fillStyle = '#1a2546'; g.fill(); g.strokeStyle = rgba(T.col, 0.8); g.lineWidth = 1.2; g.stroke(); g.restore(); }
    g.save(); for (let i = 0; i < 26; i++) { const a = rnd() * Math.PI * 2, d = 125 + rnd() * 60, x = CX + Math.cos(a) * d, y = CY + 4 + Math.sin(a) * d * 0.78, r = 6 + rnd() * 14; if (y > 380) continue; gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, rgba('#c9a27e', 0.13)); gr.addColorStop(1, 'rgba(201,162,126,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); } g.restore();
    motes(10, [T.col, T.hot], 90, 200);
  } else if (type === 'projectile') {
    // a shot streaking in from the right on its long trail, rings along the trail, just striking the plate: a small splash where it lands
    plate();
    const hx = CX - 18, hy = CY + 12, ang = Math.atan2(-120, 230), dx = Math.cos(ang), dy = Math.sin(ang), nx = -dy, ny = dx, Lt = 300;   // (the trail back up and to the right, under the top right chip's height)
    g.save(); g.globalCompositeOperation = 'lighter';
    const tx = hx + dx * Lt, ty = hy + dy * Lt;
    for (const [w, a] of [[26, 0.12], [14, 0.3], [5, 0.85]]) { g.beginPath(); g.moveTo(hx + nx * w, hy + ny * w); g.lineTo(tx, ty); g.lineTo(hx - nx * w, hy - ny * w); g.closePath(); gr = g.createLinearGradient(hx, hy, tx, ty); gr.addColorStop(0, rgba(w < 6 ? T.hot : T.col, a)); gr.addColorStop(1, rgba(T.col, 0)); g.fillStyle = gr; g.fill(); }
    for (let i = 1; i <= 3; i++) { const t = i * 58, x = hx + dx * t, y = hy + dy * t, r = 18 - i * 3; g.save(); g.translate(x, y); g.rotate(ang); g.beginPath(); g.ellipse(0, 0, r * 0.35, r, 0, 0, Math.PI * 2); g.strokeStyle = rgba(T.col, 0.55 - i * 0.12); g.lineWidth = 2; g.stroke(); g.restore(); }
    for (let i = 0; i < 9; i++) { const o = (rnd() - 0.5) * 70, t1 = 40 + rnd() * 160, t2 = t1 + 30 + rnd() * 50; g.strokeStyle = rgba(T.col, 0.35); g.lineWidth = 1; g.beginPath(); g.moveTo(hx + dx * t1 + nx * o, hy + dy * t1 + ny * o); g.lineTo(hx + dx * t2 + nx * o, hy + dy * t2 + ny * o); g.stroke(); }
    // the splash where it strikes: a flat ring on the plate and short sparks thrown back
    g.save(); g.translate(hx, hy); g.beginPath(); g.ellipse(0, 0, 44, 36, 0, 0, Math.PI * 2); g.strokeStyle = rgba(T.col, 0.6); g.lineWidth = 2.5; g.stroke(); g.beginPath(); g.ellipse(0, 0, 66, 54, 0, 0, Math.PI * 2); g.strokeStyle = rgba(T.col, 0.25); g.lineWidth = 1.5; g.stroke(); g.restore();
    for (let i = 0; i < 12; i++) { const a = ang + Math.PI + (rnd() - 0.5) * 2.4 + Math.PI, sp = 18 + rnd() * 34; g.strokeStyle = rgba(T.hot, 0.8); g.lineWidth = 1.5; g.beginPath(); g.moveTo(hx + Math.cos(a) * 14, hy + Math.sin(a) * 14); g.lineTo(hx + Math.cos(a) * (14 + sp), hy + Math.sin(a) * (14 + sp)); g.stroke(); }
    // the shot: a glowing bolt, its white core
    gr = g.createRadialGradient(hx, hy, 0, hx, hy, 46); gr.addColorStop(0, rgba(T.hot, 1)); gr.addColorStop(0.25, rgba(T.col, 0.9)); gr.addColorStop(1, rgba(T.col, 0)); g.fillStyle = gr; g.fillRect(hx - 46, hy - 46, 92, 92);
    g.restore();
    g.save(); g.translate(hx, hy); g.rotate(ang); glow(T.col, 20, () => { g.beginPath(); g.ellipse(6, 0, 18, 11, 0, 0, Math.PI * 2); g.fillStyle = T.hot; g.fill(); }); g.restore();
    motes(10, [T.col, T.hot], 80, 200);
  } else if (type === 'elemental') {
    // a burst of element energy out of the plate's middle, in every element's colour at once (it is the same type for every element): seven rays, seven arcs turning round it, a white core
    plate();
    const n = T.els.length;
    g.save(); g.globalCompositeOperation = 'lighter';
    for (let i = 0; i < n; i++) { const c = T.els[i], a = -Math.PI / 2 + i * Math.PI * 2 / n, L = 138 + (i % 2) * 20, w = 0.17;
      g.beginPath(); g.moveTo(CX, CY); g.lineTo(CX + Math.cos(a - w) * L * 0.55, CY + Math.sin(a - w) * L * 0.55); g.lineTo(CX + Math.cos(a) * L, CY + Math.sin(a) * L); g.lineTo(CX + Math.cos(a + w) * L * 0.55, CY + Math.sin(a + w) * L * 0.55); g.closePath();
      gr = g.createRadialGradient(CX, CY, 10, CX, CY, L); gr.addColorStop(0, rgba(c, 0.95)); gr.addColorStop(0.6, rgba(c, 0.5)); gr.addColorStop(1, rgba(c, 0)); g.fillStyle = gr; glow(c, 18, () => g.fill()); }
    for (let i = 0; i < n; i++) { const c = T.els[i], a0 = i * Math.PI * 2 / n + 0.2, r = 82 + (i % 3) * 9; glow(c, 12, () => { g.beginPath(); g.arc(CX, CY, r, a0, a0 + 0.62); g.strokeStyle = rgba(c, 0.9); g.lineWidth = 3; g.lineCap = 'round'; g.stroke(); }); }
    gr = g.createRadialGradient(CX, CY, 0, CX, CY, 58); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.3, 'rgba(255,250,240,0.8)'); gr.addColorStop(1, 'rgba(255,240,255,0)'); g.fillStyle = gr; g.fillRect(CX - 60, CY - 60, 120, 120);
    g.restore();
    glow('#ffffff', 22, () => { g.beginPath(); g.arc(CX, CY, 14, 0, Math.PI * 2); g.fillStyle = '#ffffff'; g.fill(); });
    motes(21, T.els, 70, 200);
  }

  // 4. THE VIGNETTE and the foot darkened for the name plate (the same on all five)
  gr = g.createRadialGradient(CX, CY + 40, 160, CX, CY + 40, 430); gr.addColorStop(0, 'rgba(2,3,8,0)'); gr.addColorStop(1, 'rgba(2,3,8,0.7)'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  gr = g.createLinearGradient(0, 400, 0, H); gr.addColorStop(0, 'rgba(5,7,15,0)'); gr.addColorStop(1, 'rgba(5,7,15,0.55)'); g.fillStyle = gr; g.fillRect(0, 400, W, H - 400);
  return cv.toDataURL('image/png');
}

(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const p = await b.newPage(); await p.setContent('<!doctype html><body style="margin:0;background:#000"></body>');
  const url = await p.evaluate('(' + paint.toString() + ')(' + JSON.stringify(TYPE) + ', ' + JSON.stringify(TYPES[TYPE]) + ')');
  await b.close();
  fs.writeFileSync(OUT, Buffer.from(url.split(',')[1], 'base64')); console.log('wrote ' + OUT + '  ' + fs.statSync(OUT).size + ' bytes');
})();
