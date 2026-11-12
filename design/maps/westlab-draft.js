// DRAFTS (2026-11-12), for the owner; not the game. The owner: "I want to make the part where the experiment lab is ... a little hangout area that has couches, beanbag chairs, a wall along ...
// the south side, that's a divider wall, and it also has like a whiteboard that's on a stand, on its own stand, that's tilted towards the beanbag chairs ... there's a rug ... maybe some like equations drawn
// on the whiteboard. And the new experiment lab will be on ... the west side. ... It'll be connected to the teleporter lab. It'll be a little ... slope staircase droop into the experiment lab, which will
// be rather large, like kind of 3 times the size as the normal, the present one, and have giant holding tanks and stuff."
// Top-down plans (north at the top; a tile = T px; the map's own sketch coordinates / 20): 1 the west side now and proposed, 2 the new lab's two layouts, 3 the lounge.
//   node design/maps/westlab-draft.js <out-dir>        writes 1_west.png, 2_lab.png, 3_lounge.png (and their .html) there
const fs = require('fs'), path = require('path'), os = require('os');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'westlab-'));
fs.mkdirSync(OUT, { recursive: true });

const CSS = `body{margin:0;background:#0b0f16;color:#d7e3ef;font-family:"DejaVu Sans",sans-serif}
.sheet{padding:26px 32px;width:var(--w)} h1{font-size:27px;margin:0 0 4px;color:#fff} .sub{font-size:15px;color:#9fb3c8;margin:0 0 16px;max-width:1500px}
.row{display:flex;gap:26px;align-items:flex-start} .col{display:flex;flex-direction:column;gap:8px} .cap{font-size:17px;font-weight:bold;color:#fff;margin:4px 0 2px}
.notes{font-size:15px;line-height:1.45;color:#c4d2df;width:var(--nw)} .notes b{color:#fff} .notes ul{margin:0;padding-left:18px} .notes li{margin-bottom:7px}
.notes h3{font-size:14px;letter-spacing:1px;color:#8fa6bd;margin:16px 0 8px} .q{color:#f0b429} svg text{font-family:"DejaVu Sans",sans-serif}`;
const page = (w, nw, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="sheet" style="--w:${w}px;--nw:${nw}px">${body}</div></body></html>`;

// ── an SVG kit in tiles (x0, y0: the tile at the plan's top-left) ──
function kit(T, x0, y0, PAD) {
  const X = x => PAD + (x - x0) * T, Y = y => PAD + (y - y0) * T, F = v => +v.toFixed(1);
  const k = {
    X, Y, T,
    rect: (a, b, c, d, at) => `<rect x="${F(X(a))}" y="${F(Y(b))}" width="${F((c - a) * T)}" height="${F((d - b) * T)}" ${at || ''}/>`,
    poly: (pts, at) => `<polygon points="${pts.map(p => F(X(p[0])) + ',' + F(Y(p[1]))).join(' ')}" ${at || ''}/>`,
    line: (pts, at) => `<polyline points="${pts.map(p => F(X(p[0])) + ',' + F(Y(p[1]))).join(' ')}" fill="none" ${at || ''}/>`,
    circle: (x, y, r, at) => `<circle cx="${F(X(x))}" cy="${F(Y(y))}" r="${F(r * T)}" ${at || ''}/>`,
    text: (x, y, t, o) => { o = o || {}; return `<text x="${F(X(x))}" y="${F(Y(y))}" font-size="${o.size || 13}" fill="${o.col || '#cfe2f5'}" text-anchor="${o.anchor || 'middle'}" ${o.bold ? 'font-weight="bold"' : ''} ${o.italic ? 'font-style="italic"' : ''} ${o.rot ? `transform="rotate(${o.rot} ${F(X(x))} ${F(Y(y))})"` : ''} paint-order="stroke" stroke="#0b0f16" stroke-width="${o.halo === undefined ? 4 : o.halo}" stroke-linejoin="round">${t}</text>`; },
    arrow: (a, b, col) => { const ang = Math.atan2(Y(b[1]) - Y(a[1]), X(b[0]) - X(a[0])), h = 8, bx = X(b[0]), by = Y(b[1]);
      return `<line x1="${F(X(a[0]))}" y1="${F(Y(a[1]))}" x2="${F(bx - Math.cos(ang) * 4)}" y2="${F(by - Math.sin(ang) * 4)}" stroke="${col}" stroke-width="2.6"/><polygon points="${F(bx)},${F(by)} ${F(bx - Math.cos(ang - 0.45) * h * 1.6)},${F(by - Math.sin(ang - 0.45) * h * 1.6)} ${F(bx - Math.cos(ang + 0.45) * h * 1.6)},${F(by - Math.sin(ang + 0.45) * h * 1.6)}" fill="${col}"/>`; },
    scale: (x, y, n) => `<g>${k.line([[x, y], [x + n, y]], 'stroke="#9fb3c8" stroke-width="2"')}${k.line([[x, y - 0.25], [x, y + 0.25]], 'stroke="#9fb3c8" stroke-width="2"')}${k.line([[x + n, y - 0.25], [x + n, y + 0.25]], 'stroke="#9fb3c8" stroke-width="2"')}${k.text(x + n / 2, y - 0.45, n + ' tiles', { size: 12, col: '#9fb3c8' })}</g>`,
    // furniture, seen from above
    tank: (x, y, r, glow) => `<g>${k.circle(x, y, r + 0.18, 'fill="#1b2433" stroke="#8fa6bd" stroke-width="2.5"')}${k.circle(x, y, r, `fill="${glow || '#1e8f7a'}" fill-opacity="0.55" stroke="#9ff5df" stroke-width="2"`)}${k.circle(x - r * 0.25, y - r * 0.25, r * 0.38, 'fill="#c9fff2" fill-opacity="0.35"')}${k.circle(x + r * 0.15, y + r * 0.1, r * 0.3, 'fill="#0b0f16" fill-opacity="0.45"')}</g>`,
    bench: (a, b, c, d) => k.rect(a, b, c, d, 'fill="#9fb3c8" stroke="#16303a" stroke-width="2" rx="2"'),
    station: (a, b, c, d, col) => k.rect(a, b, c, d, `fill="#16303a" stroke="${col}" stroke-width="2.5" rx="3"`),
    couch: (a, b, c, d) => k.rect(a, b, c, d, 'fill="#3a7bff" stroke="#1a2c5a" stroke-width="2" rx="4"'),
    beanbag: (x, y, col) => `<ellipse cx="${F(X(x))}" cy="${F(Y(y))}" rx="${F(T * 0.62)}" ry="${F(T * 0.55)}" fill="${col}" stroke="#0b0f16" stroke-width="2"/>`,
    plant: (x, y) => `${k.circle(x, y, 0.42, 'fill="#3e2a1c" stroke="#0b0f16" stroke-width="1.5"')}${k.circle(x, y, 0.32, 'fill="#3fae5a"')}`,
    whiteboard: (x, y, w, ang) => `<g transform="rotate(${ang} ${F(X(x))} ${F(Y(y))})"><rect x="${F(X(x) - w * T / 2)}" y="${F(Y(y) - T * 0.16)}" width="${F(w * T)}" height="${F(T * 0.32)}" fill="#f4f8fb" stroke="#5a6b7c" stroke-width="2"/>` +
      `<line x1="${F(X(x) - w * T / 2 + 4)}" y1="${F(Y(y) + T * 0.5)}" x2="${F(X(x) + w * T / 2 - 4)}" y2="${F(Y(y) + T * 0.5)}" stroke="#5a6b7c" stroke-width="2" stroke-dasharray="3 3"/></g>`,
    stair: (a, b, c, d, dir, n) => { let o = k.rect(a, b, c, d, 'fill="#6c7a8a" stroke="#0b0f16" stroke-width="2"'); const W = c - a, H = d - b;
      for (let i = 1; i < n; i++) o += dir === 'w' || dir === 'e' ? k.line([[a + W * i / n, b], [a + W * i / n, d]], 'stroke="#0b0f16" stroke-width="1.5"') : k.line([[a, b + H * i / n], [c, b + H * i / n]], 'stroke="#0b0f16" stroke-width="1.5"');
      return o; },
  };
  return k;
}
// a room: its walls (a thick stroke), its floor, its name; glass edges drawn over as light blue, a divider as a heavy dark line
function room(k, pts, o) {
  o = o || {}; let s = k.poly(pts, `fill="${o.wall || '#33415a'}" stroke="${o.wall || '#33415a'}" stroke-width="${k.T * 0.55}" stroke-linejoin="miter"`);
  s += k.poly(pts, `fill="${o.floor || '#1c2534'}"`);
  return s;
}
const glass = (k, a, b) => k.line([a, b], 'stroke="#7fd8ff" stroke-width="5" stroke-opacity="0.85"');
const divider = (k, a, b) => k.line([a, b], 'stroke="#c9a46a" stroke-width="7"');
const door = (k, a, b) => k.line([a, b], 'stroke="#1c2534" stroke-width="9"');

// the map's rooms near the lab (the sketch's own outlines, in tiles: sketch px / 20)
const R = {
  chamber: [[9.25, 13.1], [18.5, 13.1], [18.5, 25], [9.25, 25]],
  tr1: [[9.25, 25], [18.5, 25], [18.5, 26.5], [21.5, 26.5], [21.5, 28.25], [15.5, 28.25], [15.5, 38], [9.25, 38]],
  passage: [[15.5, 28.25], [21.5, 28.25], [21.5, 30.25], [15.5, 30.25]],
  lab: [[21.5, 26.5], [37.5, 26.5], [37.5, 32], [21.5, 32]],
  hall: [[15.5, 20.5], [46.5, 20.5], [46.5, 38], [15.5, 38], [15.5, 30.25], [21.5, 30.25], [21.5, 32], [37.5, 32], [37.5, 26.5], [21.5, 26.5], [21.5, 25], [18.5, 25], [18.5, 20.5]],
  deck: [[8, 38], [17, 38], [17, 47.5], [8, 47.5]],
  lobby: [[19, 10.1], [41.2, 10.1], [41.2, 20.5], [19, 20.5]],
  arena: [[16, 37.5], [50, 37.5], [50, 49], [16, 49]],
};
const LAB_A = [[-7.75, 22], [9.25, 22], [9.25, 38], [-7.75, 38]];           // 17 x 16 tiles
const LAB_B = [[-13.75, 26], [9.25, 26], [9.25, 38], [-13.75, 38]];         // 23 x 12 tiles

function context(k, now) {
  let s = '';
  s += room(k, R.arena, { floor: '#241c19' }) + k.text(33, 42.5, 'ARENA (1.8 tiles down)', { size: 14, col: '#a08c7a' });
  s += room(k, R.lobby) + k.text(30, 15.6, 'SERVER ROOM', { size: 14, col: '#8fa6bd' });
  s += room(k, R.hall) + k.text(41.5, 23.2, 'HALLWAY', { size: 14, col: '#8fa6bd' });
  s += room(k, R.deck, { floor: '#202a3a' }) + k.text(12.5, 43, 'OBSERVATION', { size: 13, col: '#8fa6bd' }) + k.text(12.5, 44.2, 'DECK', { size: 13, col: '#8fa6bd' });
  s += room(k, R.chamber, { floor: '#16263a' }) + k.text(13.9, 19.2, 'CRYSTAL', { size: 14, col: '#7fd8ff', bold: true }) + k.text(13.9, 20.5, 'CHAMBER', { size: 14, col: '#7fd8ff', bold: true });
  s += room(k, R.tr1, { floor: '#221d33' }) + k.text(12.4, 31.2, 'TELEPORT', { size: 14, col: '#c39bff', bold: true }) + k.text(12.4, 32.5, 'ROOM 1', { size: 14, col: '#c39bff', bold: true });
  for (const [x, y] of [[11, 27], [13.6, 27], [11, 35.8], [13.6, 35.8]]) s += k.circle(x, y, 0.75, 'fill="#3a2a6a" stroke="#c39bff" stroke-width="2"');   // its four teleporters
  s += room(k, R.passage) + door(k, [21.5, 28.4], [21.5, 30.1]) + door(k, [15.5, 28.4], [15.5, 30.1]);
  s += door(k, [11.25, 25], [13.25, 25]) + door(k, [12.5, 38], [14.5, 38]);
  return s;
}
// THE LOUNGE in the old lab's place (or the lab as it is now)
function lounge(k, big) {
  let s = room(k, R.lab, { floor: '#2a2236' });
  glass(k, [21.5, 26.5], [37.5, 26.5]); s += glass(k, [21.5, 26.5], [37.5, 26.5]) + glass(k, [37.5, 26.5], [37.5, 32]) + glass(k, [21.5, 26.5], [21.5, 28.3]) + glass(k, [21.5, 30.2], [21.5, 32]);
  s += divider(k, [21.5, 32], [37.5, 32]);   // the south divider wall
  s += door(k, [21.5, 28.4], [21.5, 30.1]);
  s += k.rect(27, 27.4, 35.4, 31.2, 'fill="#5a2a3a" stroke="#ffd34d" stroke-width="2.5" rx="3"');   // the rug
  s += k.couch(22.3, 28.6, 23.1, 31.2) + k.couch(23.4, 31.0, 26.4, 31.7) + k.rect(23.8, 29.0, 25.6, 30.2, 'fill="#6e5238" stroke="#0b0f16" stroke-width="1.5" rx="2"');   // two couches, a low table
  s += k.beanbag(28.6, 29.9, '#ff7ab8') + k.beanbag(30.2, 28.4, '#ffd34d') + k.beanbag(32.2, 28.2, '#43e0a8') + k.beanbag(33.6, 29.7, '#9a5cff');
  s += k.whiteboard(35.9, 30.4, 2.4, -38);   // on its stand, tilted towards the beanbags
  s += k.plant(36.8, 27.3) + k.plant(22.2, 27.3);
  if (big) {
    s += k.text(36.6, 31.6, 'whiteboard on a stand,', { size: 11, col: '#f4f8fb', anchor: 'end' }) + k.text(36.6, 32.6, 'tilted at the beanbags', { size: 11, col: '#f4f8fb', anchor: 'end' });
    s += k.text(31.2, 31.8, 'rug', { size: 11, col: '#ffd34d' }) + k.text(29.7, 33.3, 'the divider wall (south)', { size: 12, col: '#c9a46a' });
  }
  s += k.text(29.5, 26.0, 'THE LOUNGE', { size: big ? 16 : 14, col: '#ff9ccc', bold: true });
  return s;
}
function labNow(k) {
  let s = room(k, R.lab, { floor: '#1a2a2e' }) + glass(k, [21.5, 26.5], [37.5, 26.5]) + glass(k, [37.5, 26.5], [37.5, 32]) + glass(k, [21.5, 32], [37.5, 32]) + door(k, [21.5, 28.4], [21.5, 30.1]);
  s += k.bench(23, 27.2, 28, 27.9) + k.bench(23, 30.8, 28, 31.5) + k.station(29, 27.2, 30.6, 28.3, '#43e0a8') + k.station(31.5, 30.6, 33.2, 31.6, '#ffb347') + k.station(34.5, 27.3, 36.6, 28.4, '#9a5cff') + k.tank(35.8, 30.2, 0.6);
  s += k.rect(22, 28.6, 23.4, 30, 'fill="#0b0f16" stroke="#8fe3ff" stroke-width="2"') + k.text(29.5, 26.0, 'EXPERIMENT LAB', { size: 14, col: '#43e0a8', bold: true });
  return s;
}
// THE NEW EXPERIMENT LAB: A (a square hall, the tanks round two walls) or B (a long gallery, the tanks in two rows)
function newLab(k, which, big) {
  const P = which === 'B' ? LAB_B : LAB_A; let s = room(k, P, { floor: '#14262a', wall: '#2c4048' });
  s += door(k, [9.25, 30], [9.25, 33]);   // the opening in Teleport Room 1's west wall
  s += k.stair(4.25, 30, 9.25, 33, 'w', 6) + k.arrow([8.6, 31.5], [4.9, 31.5], '#ffe733');
  if (big) s += k.text(6.75, 29.5, 'sloping stair down', { size: 11, col: '#ffe733' }) + k.text(6.75, 34.1, '(1.8 tiles: the arena\'s level)', { size: 10, col: '#ffe733' });
  const col = { clone: '#43e0a8', seq: '#3a7bff', serum: '#ffb347', bench: '#9a5cff', cold: '#8fe3ff' };
  if (which === 'A') {
    for (const [x, y] of [[-5.4, 25], [-5.4, 30], [-5.4, 35], [-1, 24.6], [3.6, 24.6]]) s += k.tank(x, y, 1.25);
    s += k.bench(-2.5, 28.4, 2.5, 29.2) + k.bench(-2.5, 31.6, 2.5, 32.4);
    s += k.station(-2.6, 35, -0.4, 36.6, col.seq) + k.station(0.6, 35, 2.8, 36.6, col.serum) + k.station(5.2, 35, 7.6, 36.8, col.clone) + k.station(5.2, 23.2, 7.8, 25, col.bench);
    s += k.rect(-7.1, 36.5, -5.7, 37.6, 'fill="#0b0f16" stroke="#8fe3ff" stroke-width="2"');
    if (big) { s += k.text(-1.5, 37.6, 'SEQUENCER', { size: 10, col: col.seq }) + k.text(1.7, 37.6, 'SERUM HOOD', { size: 10, col: col.serum }) + k.text(6.4, 37.6, 'CLONE BAY', { size: 10, col: col.clone }) + k.text(6.5, 26.1, 'ANALYSIS BENCH', { size: 10, col: col.bench });
      s += k.text(-7.1, 39.2, '↑ to the Cold Storage', { size: 10, col: col.cold, anchor: 'start' }) + k.text(-0.8, 22.8, 'giant holding tanks', { size: 12, col: '#9ff5df' }); }
    s += k.text(0.75, 30.6, 'EXPERIMENT LAB', { size: big ? 17 : 14, col: '#43e0a8', bold: true });
  } else {
    for (const x of [-11.6, -7.1, -2.6, 1.9]) s += k.tank(x, 27.9, 1.2);
    for (const x of [-11.6, -7.1, -2.6]) s += k.tank(x, 36.1, 1.2);
    s += k.bench(-9.4, 31.3, -4.6, 32.1) + k.bench(-3.9, 31.3, 0.9, 32.1);
    s += k.station(-13.2, 29.4, -11.8, 31.4, col.seq) + k.station(-13.2, 32.2, -11.8, 34.2, col.serum) + k.station(1.8, 35.4, 4.0, 37.3, col.clone) + k.station(4.6, 26.8, 7.6, 28.4, col.bench);
    s += k.rect(5.0, 36.4, 6.4, 37.6, 'fill="#0b0f16" stroke="#8fe3ff" stroke-width="2"');
    if (big) { s += k.text(-11.4, 30.7, 'SEQUENCER', { size: 10, col: col.seq, anchor: 'start' }) + k.text(-11.4, 33.5, 'SERUM HOOD', { size: 10, col: col.serum, anchor: 'start' }) + k.text(2.9, 35.05, 'CLONE BAY', { size: 10, col: col.clone }) + k.text(6.1, 25.6, 'ANALYSIS BENCH', { size: 10, col: col.bench });
      s += k.text(6.9, 38.9, 'to the Cold Storage', { size: 10, col: col.cold }) + k.text(-4.9, 25.6, 'giant holding tanks, in two rows', { size: 12, col: '#9ff5df' }); }
    s += k.text(-4.7, 30.2, 'EXPERIMENT LAB', { size: big ? 17 : 14, col: '#43e0a8', bold: true });
  }
  return s;
}
function svg(w, h, body) { return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="background:#0b0f16">${body}</svg>`; }

// 1 · THE WEST SIDE, NOW AND PROPOSED (A)
function sheet1() {
  const T = 15, x0 = -9, y0 = 8.5, PAD = 10, W = Math.round((50 - x0) * T + 2 * PAD), H = Math.round((49 - y0) * T + 2 * PAD);
  const a = kit(T, x0, y0, PAD), b = kit(T, x0, y0, PAD);
  const now = svg(W, H, context(a, true) + labNow(a) + a.scale(-7, 46.5, 5) + a.text(-1, 30.5, '(nothing here now)', { size: 13, col: '#5a6b7c', italic: true }));
  const prop = svg(W, H, context(b, false) + lounge(b, false) + newLab(b, 'A', false) + b.scale(-7, 46.5, 5));
  const notes = `<div class="notes"><h3>WHAT CHANGES</h3><ul>
<li><b>The old lab becomes THE LOUNGE</b>, a hangout: couches, beanbags, a rug, a whiteboard on its own stand tilted at the beanbags (equations on it), a <b>divider wall</b> along its south side. Its door to Teleport Room 1 stays.</li>
<li><b>The new EXPERIMENT LAB</b> is west of Teleport Room 1, about <b>3 times</b> the old one (17 by 16 tiles in A), down a <b>sloping stair</b> from Teleport Room 1's west wall.</li>
<li><b>Giant holding tanks</b> (a new 3D model, drafted after this), and the old lab's stations move with it: the Sequencer, the Serum Hood, the Clone Bay, the Analysis Bench.</li>
<li>The map grows west; nothing else moves.</li></ul>
<h3 class="q">FOR YOU TO PICK</h3><ul><li class="q">The lab's layout: A or B (sheet 2).</li><li class="q">The Cold Storage's stairs (now in the old lab's floor): move them to the new lab, or keep them in the lounge?</li><li class="q">The divider: a full wall, or a low half wall?</li><li class="q">The lounge's name.</li></ul></div>`;
  return page(W * 2 + 380, 320, `<h1>1 · The west side, now and proposed</h1><div class="sub">North is up. The lab is drawn in A, the square hall (sheet 2 has B). Draft: nothing here is in the game yet.</div>
<div class="row"><div class="col"><div class="cap">NOW</div>${now}</div><div class="col"><div class="cap">PROPOSED (A)</div>${prop}</div>${notes}</div>`);
}
// 2 · THE NEW LAB, TWO LAYOUTS
function sheet2() {
  const T = 24, PAD = 12;
  const A = kit(T, -9, 20.5, PAD), WA = Math.round((22 - -9) * T + 2 * PAD), HA = Math.round((39.5 - 20.5) * T + 2 * PAD);
  const B = kit(T, -15, 24.5, PAD), WB = Math.round((22 - -15) * T + 2 * PAD), HB = Math.round((39.5 - 24.5) * T + 2 * PAD);
  const tr = k => room(k, R.tr1, { floor: '#221d33' }) + k.text(12.4, 31.4, 'TELEPORT ROOM 1', { size: 13, col: '#c39bff', bold: true }) + room(k, R.passage);
  const svA = svg(WA, HA, tr(A) + newLab(A, 'A', true) + A.scale(12, 39.2, 5));
  const svB = svg(WB, HB, tr(B) + newLab(B, 'B', true) + B.scale(-13.5, 39, 5));
  return page(Math.max(WA, WB) * 2 + 120, 0, `<h1>2 · The new Experiment Lab: two layouts</h1><div class="sub">Both about 3 times the old lab (A 272 tiles, B 276; the old one 88), down a sloping stair 3 tiles wide to the arena's level. The tanks are drawn as glass cylinders seen from above: their look comes next, as 3D drafts.</div>
<div class="row"><div class="col"><div class="cap">A · THE SQUARE HALL: tanks round two walls, the work floor in the middle</div>${svA}</div><div class="col"><div class="cap">B · THE LONG GALLERY: tanks in two rows down its length</div>${svB}</div></div>`);
}
// 3 · THE LOUNGE
function sheet3() {
  const T = 34, PAD = 14, k = kit(T, 20.5, 25, PAD), W = Math.round((38.5 - 20.5) * T + 2 * PAD), H = Math.round((34 - 25) * T + 2 * PAD);
  const sv = svg(W, H, lounge(k, true) + k.text(21.0, 29.3, 'to', { size: 11, col: '#9fb3c8', anchor: 'end' }) + k.text(21.0, 30.3, 'TR 1', { size: 11, col: '#9fb3c8', anchor: 'end' }));
  const notes = `<div class="notes"><h3>THE LOUNGE</h3><ul><li>Glass on its north, east and west sides as now (you see in from the hallway); the <b>divider wall</b> along the south.</li>
<li>Two <b>couches</b> and a low table at the west end; four <b>beanbags</b> in an arc on the <b>rug</b>.</li><li>The <b>whiteboard</b> stands on its own frame at the east end, turned toward the beanbags, equations on it (a new 3D model).</li><li>Two plants. The couches, beanbags and rug are the game's own (the observation deck has them).</li></ul></div>`;
  return page(W + 420, 360, `<h1>3 · The lounge</h1><div class="sub">The old lab's room, 16 by 5.5 tiles, furnished as a hangout.</div><div class="row">${sv}${notes}</div>`);
}

(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ deviceScaleFactor: 1.5 });
  for (const [n, html] of [['1_west', sheet1()], ['2_lab', sheet2()], ['3_lounge', sheet3()]]) {
    const f = path.join(OUT, n + '.html'); fs.writeFileSync(f, html);
    await p.goto('file://' + f); const el = await p.$('.sheet'); await el.screenshot({ path: path.join(OUT, n + '.png') }); console.log('wrote', n);
  }
  await b.close();
})();
