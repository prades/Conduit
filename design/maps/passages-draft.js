// DRAFTS (2026-11-12), for the owner; not the game. The owner: "I want it to be narrow passages and rooms and nests and caves and instances. [...] the electrical domain and the nests, I would like
// to expand those out with narrow passages and ways for the player to use their utilities from their technicians to get around", "including but not limited to blowing up barrels to bring down or break
// through different obstacles, or using flux move to move an object to get it out the way." Top-down layout sheets (north at the top, a tile = T px), the ways through, and seeing into a passage.
//   node design/maps/passages-draft.js <out-dir>        writes 1_elec.png, 2_nest.png, 3_ways.png, 4_seeing.png (and their .html) there
const fs = require('fs'), path = require('path'), os = require('os');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require('/opt/node22/lib/node_modules/playwright'); } })();
const OUT = process.argv[2] || fs.mkdtempSync(path.join(os.tmpdir(), 'passages-'));
fs.mkdirSync(OUT, { recursive: true });

const CSS = `body{margin:0;background:#0b0f16;color:#d7e3ef;font-family:"DejaVu Sans",sans-serif}
.sheet{padding:26px 32px;width:var(--w)} h1{font-size:27px;margin:0 0 4px;color:#fff} .sub{font-size:15px;color:#9fb3c8;margin:0 0 16px;max-width:1400px}
.row{display:flex;gap:26px;align-items:flex-start} .notes{font-size:15px;line-height:1.45;color:#c4d2df;width:var(--nw)} .notes b{color:#fff} .notes ul{margin:0;padding-left:18px} .notes li{margin-bottom:7px}
.notes h3{font-size:14px;letter-spacing:1px;color:#8fa6bd;margin:16px 0 8px} .tag{display:inline-block;font-size:12px;padding:2px 8px;border:1px solid #f0b429;color:#f0b429;border-radius:3px;margin-left:8px;vertical-align:middle}
.lg{display:flex;align-items:center;gap:9px;margin:5px 0;font-size:14px} .lg svg{flex:none} .q{color:#f0b429} svg text{font-family:"DejaVu Sans",sans-serif}`;
const page = (w, nw, body) => `<!doctype html><html><head><meta charset="utf-8"><style>${CSS}</style></head><body><div class="sheet" style="--w:${w}px;--nw:${nw}px">${body}</div></body></html>`;

// ── who opens what: the technicians' colours (the game's own) and their chips' marks ──
const WHO = {
  any:   { c: '#ff9a3c', g: '✸', name: 'ANYONE · shoot the barrel' },
  flux:  { c: '#c39bff', g: '✦', name: 'FLUX · FLUX MOVE' },
  fire:  { c: '#ff6a3a', g: '✹', name: 'FIRE · THERMITE DRILL' },
  ice:   { c: '#8fe3ff', g: '❄', name: 'ICE · ICE BRIDGE' },
  elec:  { c: '#ffe14d', g: '⚡', name: 'ELECTRIC · KINETIC LAUNCHER' },
  bloom: { c: '#ff7ad9', g: '◆', name: 'BLOOM · REEF climb' },
  acid:  { c: '#8cff3a', g: '☣', name: 'ANYONE · the acid flask (new idea)' },
};

// ── an SVG kit in tiles ──
function kit(T, PAD) {
  const X = x => PAD + x * T, Y = y => PAD + y * T, F = v => +v.toFixed(1);
  const k = {
    X, Y, T,
    rect: (x0, y0, x1, y1, a) => `<rect x="${F(X(x0))}" y="${F(Y(y0))}" width="${F((x1 - x0) * T)}" height="${F((y1 - y0) * T)}" ${a || ''}/>`,
    poly: (pts, a) => `<polygon points="${pts.map(p => F(X(p[0])) + ',' + F(Y(p[1]))).join(' ')}" ${a || ''}/>`,
    line: (pts, a) => `<polyline points="${pts.map(p => F(X(p[0])) + ',' + F(Y(p[1]))).join(' ')}" fill="none" ${a || ''}/>`,
    // a smooth closed outline through the points (a cave), Catmull-Rom as cubic Beziers
    blobD: pts => { const n = pts.length, P = i => pts[(i + n) % n]; let d = `M${F(X(P(0)[0]))},${F(Y(P(0)[1]))}`;
      for (let i = 0; i < n; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += ` C${F(X(p1[0] + (p2[0] - p0[0]) / 6))},${F(Y(p1[1] + (p2[1] - p0[1]) / 6))} ${F(X(p2[0] - (p3[0] - p1[0]) / 6))},${F(Y(p2[1] - (p3[1] - p1[1]) / 6))} ${F(X(p2[0]))},${F(Y(p2[1]))}`; }
      return d + 'Z'; },
    // a smooth open path through the points (a winding tunnel's middle)
    pathD: pts => { const n = pts.length, P = i => pts[Math.max(0, Math.min(n - 1, i))]; let d = `M${F(X(pts[0][0]))},${F(Y(pts[0][1]))}`;
      for (let i = 0; i < n - 1; i++) { const p0 = P(i - 1), p1 = P(i), p2 = P(i + 1), p3 = P(i + 2);
        d += ` C${F(X(p1[0] + (p2[0] - p0[0]) / 6))},${F(Y(p1[1] + (p2[1] - p0[1]) / 6))} ${F(X(p2[0] - (p3[0] - p1[0]) / 6))},${F(Y(p2[1] - (p3[1] - p1[1]) / 6))} ${F(X(p2[0]))},${F(Y(p2[1]))}`; }
      return d; },
    text: (x, y, t, o) => { o = o || {}; return `<text x="${F(X(x))}" y="${F(Y(y))}" font-size="${o.size || 13}" fill="${o.col || '#cfe2f5'}" text-anchor="${o.anchor || 'middle'}" ${o.bold ? 'font-weight="bold"' : ''} ${o.italic ? 'font-style="italic"' : ''} paint-order="stroke" stroke="#0b0f16" stroke-width="${o.halo === undefined ? 4 : o.halo}" stroke-linejoin="round">${t}</text>`; },
    badge: (x, y, who, num) => { const w = WHO[who], r = T * 0.78; return `<g><circle cx="${F(X(x))}" cy="${F(Y(y))}" r="${F(r)}" fill="#0b0f16" stroke="${w.c}" stroke-width="3"/>` +
      `<text x="${F(X(x))}" y="${F(Y(y) + r * 0.36)}" font-size="${F(r * 1.05)}" fill="${w.c}" text-anchor="middle">${w.g}</text>` +
      (num ? `<g><circle cx="${F(X(x) + r * 0.85)}" cy="${F(Y(y) - r * 0.85)}" r="${F(r * 0.48)}" fill="${w.c}"/><text x="${F(X(x) + r * 0.85)}" y="${F(Y(y) - r * 0.85 + r * 0.17)}" font-size="${F(r * 0.5)}" font-weight="bold" fill="#0b0f16" text-anchor="middle">${num}</text></g>` : '') + `</g>`; },
    chest: (x, y, letter) => { const cx = X(x), cy = Y(y), w = T * 1.1, h = T * 0.8; return `<g><rect x="${F(cx - w / 2)}" y="${F(cy - h / 2)}" width="${F(w)}" height="${F(h)}" rx="2" fill="#ffcf4a" stroke="#6b4c08" stroke-width="2"/>` +
      `<line x1="${F(cx - w / 2)}" y1="${F(cy - h * 0.12)}" x2="${F(cx + w / 2)}" y2="${F(cy - h * 0.12)}" stroke="#6b4c08" stroke-width="2"/><rect x="${F(cx - 2.5)}" y="${F(cy - h * 0.24)}" width="5" height="${F(h * 0.32)}" fill="#6b4c08"/>` +
      `<text x="${F(cx + w * 0.62)}" y="${F(cy - h * 0.45)}" font-size="${F(T * 0.62)}" fill="#ffe9a8" font-weight="bold" paint-order="stroke" stroke="#0b0f16" stroke-width="3">${letter}</text></g>`; },
    barrel: (x, y, acid) => { const cx = X(x), cy = Y(y), r = T * 0.42; let p = ''; for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; p += F(cx + Math.cos(a) * r) + ',' + F(cy + Math.sin(a) * r) + ' '; }
      return `<polygon points="${p}" fill="${acid ? '#5e7a1e' : '#c4441c'}" stroke="${acid ? '#c6f03a' : '#ffb070'}" stroke-width="2"/><circle cx="${F(cx)}" cy="${F(cy)}" r="${F(r * 0.45)}" fill="${acid ? '#8cff3a' : '#ff9a3c'}"/>`; },
    rack: (x, y, w, h, rot, fallen) => `<rect x="${F(X(x) - w * T / 2)}" y="${F(Y(y) - h * T / 2)}" width="${F(w * T)}" height="${F(h * T)}" fill="${fallen ? '#2a3346' : '#2b3a50'}" stroke="${fallen ? '#ff9a3c' : '#7d93b0'}" stroke-width="1.6" transform="rotate(${rot || 0} ${F(X(x))} ${F(Y(y))})"/>`,
    rubble: (x0, y0, x1, y1, seed) => { let s = seed || 1, o = ''; const r = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
      o += k.rect(x0, y0, x1, y1, 'fill="#3a2a1c"'); for (let i = 0; i < 26; i++) { const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0); o += `<circle cx="${F(X(x))}" cy="${F(Y(y))}" r="${F(T * (0.14 + r() * 0.2))}" fill="${['#8a6a48', '#6e5238', '#a07c56'][i % 3]}" stroke="#2a1c10" stroke-width="1"/>`; } return o; },
    water: (x0, y0, x1, y1, col) => { let o = k.rect(x0, y0, x1, y1, `fill="${col || '#17507a'}"`); const vert = (y1 - y0) > (x1 - x0);
      for (let i = 0.5; i < (vert ? (y1 - y0) : (x1 - x0)); i += 1.1) o += vert ? `<path d="M${F(X(x0 + 0.3))},${F(Y(y0 + i))} q${F(T * 0.35)},${F(-T * 0.25)} ${F(T * 0.7)},0 t${F(T * 0.7)},0 t${F(T * 0.7)},0" fill="none" stroke="#5fb8e8" stroke-width="1.4" opacity="0.7" clip-path=""/>` : `<path d="M${F(X(x0 + i))},${F(Y(y0 + 0.3))} q${F(-T * 0.25)},${F(T * 0.35)} 0,${F(T * 0.7)} t0,${F(T * 0.7)} t0,${F(T * 0.7)}" fill="none" stroke="#5fb8e8" stroke-width="1.4" opacity="0.7"/>`;
      return o; },
    crack: (pts, col) => { let o = '', d = ''; for (let i = 0; i < pts.length - 1; i++) { const [ax, ay] = pts[i], [bx, by] = pts[i + 1], n = 7; for (let j = 0; j <= n; j++) { const t = j / n, x = ax + (bx - ax) * t, y = ay + (by - ay) * t, nx = -(by - ay), ny = bx - ax, L = Math.hypot(nx, ny) || 1, w = (j % 2 ? 0.28 : -0.28) * (j && j < n ? 1 : 0); d += (d ? ' L' : 'M') + F(X(x + nx / L * w)) + ',' + F(Y(y + ny / L * w)); } }
      return `<path d="${d}" fill="none" stroke="${col || '#ffb070'}" stroke-width="3" stroke-linejoin="miter"/>`; },
    arrow: (a, b, col, dash) => { const ang = Math.atan2(Y(b[1]) - Y(a[1]), X(b[0]) - X(a[0])), h = 7, bx = X(b[0]), by = Y(b[1]);
      return `<line x1="${F(X(a[0]))}" y1="${F(Y(a[1]))}" x2="${F(bx - Math.cos(ang) * 3)}" y2="${F(by - Math.sin(ang) * 3)}" stroke="${col}" stroke-width="2.4" ${dash ? 'stroke-dasharray="5 4"' : ''}/><polygon points="${F(bx)},${F(by)} ${F(bx - Math.cos(ang - 0.45) * h * 1.6)},${F(by - Math.sin(ang - 0.45) * h * 1.6)} ${F(bx - Math.cos(ang + 0.45) * h * 1.6)},${F(by - Math.sin(ang + 0.45) * h * 1.6)}" fill="${col}"/>`; },
    scale: (x, y, n) => `<g>${k.line([[x, y], [x + n, y]], 'stroke="#9fb3c8" stroke-width="2"')}${k.line([[x, y - 0.25], [x, y + 0.25]], 'stroke="#9fb3c8" stroke-width="2"')}${k.line([[x + n, y - 0.25], [x + n, y + 0.25]], 'stroke="#9fb3c8" stroke-width="2"')}${k.text(x + n / 2, y - 0.45, n + ' tiles', { size: 12, col: '#9fb3c8' })}</g>`,
  };
  return k;
}
// the main way: a bright dashed line, drawn under the badges
const mainWay = (k, pts) => `<path d="${k.pathD(pts)}" fill="none" stroke="#7dffa8" stroke-width="3" stroke-dasharray="9 6" opacity="0.85"/>`;
const legendRow = (svg, txt) => `<div class="lg"><svg width="30" height="30" viewBox="0 0 30 30">${svg}</svg><span>${txt}</span></div>`;
function legend() {
  const b = who => { const w = WHO[who]; return `<circle cx="15" cy="15" r="12" fill="#0b0f16" stroke="${w.c}" stroke-width="3"/><text x="15" y="19.5" font-size="13" fill="${w.c}" text-anchor="middle">${w.g}</text>`; };
  return `<h3>WHO OPENS THE WAY</h3>` + ['any', 'flux', 'fire', 'ice', 'elec', 'bloom', 'acid'].map(w => legendRow(b(w), WHO[w].name)).join('') +
    legendRow(`<path d="M2,15 H28" stroke="#7dffa8" stroke-width="3" stroke-dasharray="7 5"/>`, 'the main way through') +
    legendRow(`<rect x="7" y="9" width="16" height="12" rx="2" fill="#ffcf4a" stroke="#6b4c08" stroke-width="2"/><line x1="7" y1="14" x2="23" y2="14" stroke="#6b4c08" stroke-width="2"/>`, 'a chest (A, B, C, D)') +
    legendRow(`<polygon points="21,19 15,22.5 9,19 9,11 15,7.5 21,11" fill="#c4441c" stroke="#ffb070" stroke-width="2"/><circle cx="15" cy="15" r="3.4" fill="#ff9a3c"/>`, 'an explosive flask (the hazard container)');
}

// ───────────── 1. THE ELECTRICAL DOMAIN, as passages and rooms ─────────────
function elec() {
  const T = 17, PAD = 18, k = kit(T, PAD), W = 54, H = 64;
  // the walkable shapes (rects in tiles). Drawn twice: every wall stroke first, then every floor over it, so where shapes meet the wall between them disappears (one floor).
  const servers = [[21, 3, 31, 9], [25, 1.2, 27, 3], [24.5, 9, 27.5, 22.6], [27.5, 18.4, 29.6, 20.6], [13, 11, 21, 16.6], [21, 12.6, 24.5, 14.6], [17, 22.5, 35, 30.6], [35, 24.6, 41, 27.6], [41, 22, 49, 30.6],
    [25, 30.5, 27.6, 37.1], [27.6, 31.1, 29.2, 34.3], [19, 37, 34, 44.1], [23.5, 44, 27.5, 46.6]];
  const circuit = [[20, 46.5, 31, 50], [11, 45.5, 20.1, 53], [30.9, 45.5, 40, 53], [40, 47.4, 41.6, 50.6], [41.5, 46.8, 47.5, 51.6], [12.5, 52.9, 15.5, 55.1], [8, 55, 26, 62.6]];
  let s = '';
  const wallPass = (L, col) => L.map(r => k.rect(...r, `fill="${col}" stroke="${col}" stroke-width="${T * 0.55}" stroke-linejoin="miter"`)).join('');
  const floorPass = (L, col) => L.map(r => k.rect(...r, `fill="${col}"`)).join('');
  s += wallPass(servers, '#5d7390') + wallPass(circuit, '#3f8f6a') + floorPass(servers, '#121a26') + floorPass(circuit, '#0c1712');
  // the side pockets, lit a little warmer so they read as optional
  // the door up
  s += k.rect(25, 1.2, 27, 1.9, 'fill="#3fd0ff"') + k.text(26, 0.75, '▲ THE LITTLE DOOR · up to the Server Room (as built)', { size: 12, col: '#7fe3ff', bold: true });
  // standing racks (the approved beat: standing near the door)
  for (const [x, y, w, h] of [[23, 3.75, 3, 0.8], [29, 3.75, 3, 0.8], [21.75, 6.4, 0.8, 4.2], [30.25, 6.4, 0.8, 4.2], [25.1, 12.5, 0.8, 4], [25.1, 17.3, 0.8, 3.4], [14, 14.2, 0.8, 3.6], [20, 14.2, 0.8, 3.6]]) s += k.rack(x, y, w, h);
  // 1 · the heap of fallen racks choking the corridor, the flask in its bay beside it
  for (const [x, y, rot] of [[25.4, 21.1, 20], [26.6, 21.7, -25], [25.9, 22.2, 8], [26.8, 20.8, 60]]) s += k.rack(x, y, 1.9, 0.75, rot, true);
  s += k.barrel(28.6, 19.5) + k.badge(31.6, 20.6, 'any', 1);
  s += k.text(23.9, 19.4, 'a heap of fallen racks', { size: 12, col: '#ffcf9a', anchor: 'end' }) + k.text(23.9, 20.4, 'chokes it: shoot the', { size: 12, col: '#ffcf9a', anchor: 'end' }) + k.text(23.9, 21.4, 'flask beside it', { size: 12, col: '#ffcf9a', anchor: 'end' });
  // the side vault: its doorway full of rubble from the ceiling
  s += k.rubble(21.4, 12.7, 23.4, 14.5, 11) + k.badge(22.4, 10.8, 'fire') + k.chest(17, 14.9, 'A');
  // 2 · THE FALLEN ROWS: racks toppled and strewn, sparking
  const fall = [[19.5, 24.3, 35], [22.4, 25.2, -20], [20.4, 28.4, 70], [23.6, 28.9, 15], [29.5, 24.2, -40], [31.8, 26, 25], [29.2, 28.8, -65], [33, 29.2, 10], [27.5, 26.9, 100], [21.9, 26.8, 85]];
  for (const [x, y, r] of fall) s += k.rack(x, y, 2.6, 0.85, r, true);
  for (const [x, y] of [[20.8, 23.6], [24.8, 27.2], [30.6, 27.6], [33.6, 23.8], [18.4, 29.8], [28.6, 24.9]]) s += `<text x="${k.X(x)}" y="${k.Y(y)}" font-size="13" fill="#ffe14d">⚡</text>`;
  // the coolant run: a burst cooling line floods the corridor east (water: an ice bridge freezes across it)
  s += k.water(36.6, 24.6, 39.6, 27.6, '#145a6e') + `<rect x="${k.X(36.4)}" y="${k.Y(25.35)}" width="${3.4 * T}" height="${1.5 * T}" fill="none" stroke="#bff3ff" stroke-width="2" stroke-dasharray="5 4"/>`;
  s += k.badge(38.1, 23.2, 'ice') + k.text(38.1, 29.3, 'coolant floods it', { size: 11, col: '#8fe3ff' });
  for (const [x, y] of [[43, 23.8], [46.6, 23.8]]) s += `<circle cx="${k.X(x)}" cy="${k.Y(y)}" r="${T * 0.9}" fill="#1c3340" stroke="#4fd1ff" stroke-width="2"/>`;
  s += k.chest(46.4, 28.4, 'B');
  // 3 · the crawlway: a toppled rack across it, a niche beside it
  s += k.rack(26.3, 32.7, 2.6, 0.9, 0, true) + k.arrow([27.1, 32.7], [28.5, 32.7], '#c39bff') + `<rect x="${k.X(27.75)}" y="${k.Y(31.3)}" width="${1.25 * T}" height="${2.8 * T}" fill="none" stroke="#c39bff" stroke-width="1.6" stroke-dasharray="4 3"/>`;
  s += k.badge(31.1, 32.6, 'flux', 2) + k.text(32.6, 34.0, 'a rack across the crawlway:', { size: 12, col: '#dcc8ff', anchor: 'start' }) + k.text(32.6, 35.0, 'FLUX MOVE it into the niche', { size: 12, col: '#dcc8ff', anchor: 'start' });
  // 4 · THE RISER: a raised platform on the east side; the launcher sends you up (or a REEF climb)
  s += k.rect(29, 37, 34, 40.6, 'fill="#22324a" stroke="#9fc4ff" stroke-width="3"') + k.text(34.7, 38.9, 'raised platform', { size: 11, col: '#bcd6ff', anchor: 'start' });
  s += `<circle cx="${k.X(30.6)}" cy="${k.Y(42.4)}" r="${T * 0.75}" fill="none" stroke="#ffe14d" stroke-width="2" stroke-dasharray="4 3"/>` + k.arrow([30.6, 41.7], [31.4, 39.4], '#ffe14d', true);
  s += k.badge(26.2, 41.5, 'elec') + k.badge(28.0, 39.0, 'bloom') + k.chest(32.4, 38.3, 'C');
  // the steps down into the circuitry
  for (let i = 0; i < 4; i++) s += k.line([[23.7, 44.4 + i * 0.55], [27.3, 44.4 + i * 0.55]], 'stroke="#2a8fb8" stroke-width="2"');
  // the circuitry: thin blue light traces through dark steel, out of chips
  const rnd = (() => { let q = 5; return () => ((q = (q * 1664525 + 1013904223) >>> 0) / 4294967296); })();
  for (const [x0, y0, x1, y1, n] of [[20.4, 46.9, 30.6, 49.6, 7], [11.4, 45.9, 19.7, 52.6, 9], [31.3, 45.9, 39.6, 52.6, 9], [8.4, 55.4, 25.6, 62.2, 14], [41.9, 47.2, 47.1, 51.2, 4]])
    for (let i = 0; i < n; i++) { let x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0); const pts = [[x, y]]; for (let j = 0; j < 3; j++) { if (rnd() < 0.5) x = Math.min(x1, Math.max(x0, x + rnd() * 5 - 2.5)); else y = Math.min(y1, Math.max(y0, y + rnd() * 4 - 2)); pts.push([x, y]); }
      const col = ['#41c7ff', '#2f9fe0', '#7fe3ff'][i % 3]; s += k.line(pts, `stroke="${col}" stroke-width="1.6" opacity="0.6"`) + `<circle cx="${k.X(x)}" cy="${k.Y(y)}" r="2.6" fill="${col}" opacity="0.8"/>`; }
  const chip = (x0, y0, x1, y1, t) => k.rect(x0, y0, x1, y1, 'fill="#13202a" stroke="#7fe3ff" stroke-width="2"') + k.text((x0 + x1) / 2, (y0 + y1) / 2 + 0.3, t || 'chip', { size: 11, col: '#9fe8ff' });
  s += chip(16.6, 46.4, 19.2, 49) + chip(34, 47.8, 37, 50.4) + chip(13, 57.2, 21, 61.2, 'THE CORE CHIP');
  // 5 · the cracked wall into the last chamber; the flask is too far: FLUX MOVE it within reach, then shoot it
  s += k.crack([[12.6, 53], [15.4, 53]]) + k.barrel(13.6, 49) + k.arrow([13.6, 49.6], [13.6, 51.2], '#c39bff') + `<circle cx="${k.X(13.6)}" cy="${k.Y(51.6)}" r="${T * 0.42}" fill="none" stroke="#c39bff" stroke-width="1.6" stroke-dasharray="3 3"/>`;
  s += k.badge(9.6, 50.6, 'flux', 3) + k.badge(9.6, 53.4, 'any') + k.text(9.6, 55.9, 'move the flask in reach,', { size: 11, col: '#dcc8ff', anchor: 'end' }) + k.text(9.6, 56.9, 'then shoot it', { size: 11, col: '#dcc8ff', anchor: 'end' });
  // chip east's side pocket: a leaning stack of racks in the doorway, a flask at its foot (bring it down)
  for (const [x, y, r] of [[40.8, 48.1, 70], [40.7, 49.2, 105], [40.9, 50.1, 80]]) s += k.rack(x, y, 1.6, 0.6, r, true);
  s += k.barrel(38.9, 51.4) + k.badge(43.6, 45.0, 'any') + k.chest(45.4, 49.2, 'D') + k.text(44.5, 53.0, 'a leaning stack: bring it down', { size: 11, col: '#ffcf9a' });
  // the main way
  s += mainWay(k, [[26, 2.6], [26, 10], [26.3, 19.2], [26, 24], [26.3, 31], [26.3, 36.4], [25.6, 44.6], [25, 48.2], [19, 48.6], [14.6, 51], [14, 54.2], [14.6, 57]]);
  // re-draw the badges on top of the way (the way is drawn last for clarity of its line, the badges above it)
  s += k.badge(31.6, 20.6, 'any', 1) + k.badge(31.1, 32.6, 'flux', 2) + k.badge(9.6, 50.6, 'flux', 3);
  // the names
  const nm = (x, y, t, sub, col) => k.text(x, y, t, { size: 13, col: col || '#e8f2fc', bold: true }) + (sub ? k.text(x, y + 1.05, sub, { size: 11, col: '#9fb6d0' }) : '');
  s += nm(26, 6.6, '1 · THE LANDING', 'racks standing') + nm(17, 12.6, 'SIDE VAULT', '', '#ffd9a0') + nm(26, 30.2, '', '') ;
  s += k.text(18.2, 23.5, '2 · THE FALLEN ROWS', { size: 13, col: '#e8f2fc', bold: true, anchor: 'start' }) + k.text(18.2, 30.1, 'racks toppled, strewn, sparking', { size: 11, col: '#ff9a3c', anchor: 'start' });
  s += nm(45, 26.1, 'COOLING PLANT', '', '#ffd9a0') + k.text(19.8, 38.3, '3 · THE RISER', { size: 13, col: '#e8f2fc', bold: true, anchor: 'start' }) + k.text(19.8, 45.6, 'steps down ▼', { size: 11, col: '#7fe3ff', anchor: 'start' });
  s += k.text(25.5, 47.6, '4 · THE TRACE HALL', { size: 12, col: '#bfffe0', bold: true }) + k.text(15.4, 45.0, '5 · CHIP WEST', { size: 12, col: '#bfffe0', bold: true }) + k.text(35.5, 45.0, 'CHIP EAST', { size: 12, col: '#ffd9a0', bold: true });
  s += k.text(17, 56.4, '6 · THE DEEP CHAMBER', { size: 13, col: '#bfffe0', bold: true }) + k.text(17, 62.0, 'for later: a boss or a quest (not designed)', { size: 11, col: '#9fd8bf' });
  s += k.scale(40, 61.5, 5);
  s += k.text(53.6, 63.6, 'the camera looks from the bottom right ↖', { size: 11, col: '#7f93a8', anchor: 'end', halo: 0 });
  const Wp = W * T + PAD * 2, Hp = H * T + PAD * 2;
  const svg = `<svg width="${Wp}" height="${Hp}" viewBox="0 0 ${Wp} ${Hp}">${s}</svg>`;
  const notes = `<div class="notes"><ul>
    <li><b>Rebuilt as passages and rooms.</b> The two big rooms built in <code>11d</code> go; kept: the little door beside the junction, look A (the cold blue server graveyard) and its order: racks standing by the door, toppled further in, then the circuitry.</li>
    <li><b>Corridors 3 tiles wide</b>, 2 at a squeeze; rooms 8 to 18 tiles across.</li>
    <li><b>The main way</b> (the green line): <b>①</b> shoot the flask by the heap (anyone), <b>②</b> FLUX MOVE the fallen rack into its niche, <b>③</b> FLUX MOVE a flask up to the cracked wall and shoot it.</li>
    <li><b>Four side pockets</b>, each opened by another technician (or a sharp eye) and each ending in a chest: <b>A</b> drill the rubble, <b>B</b> ice-bridge the coolant, <b>C</b> launch or climb up to the platform, <b>D</b> bring the leaning stack down.</li>
    <li>Empty at first, as decided: no creatures yet.</li>
    <li class="q">Every size, name and placement is mine, for you to change.</li></ul>${legend()}</div>`;
  return page(Wp + 470 + 26, 440, `<h1>1 · The electrical domain, as passages and rooms <span class="tag">DRAFT</span></h1><p class="sub">Seen from above, north at the top; one square of the grid would be a tile. You come down the little door at the top and work your way south, toward the camera.</p><div class="row">${svg}${notes}</div>`);
}

// ───────────── 2. THE ANT NEST, grown out into tunnels and nests ─────────────
function nest() {
  const T = 17, PAD = 18, k = kit(T, PAD), W = 50, H = 52;
  // the queen's cavern as built (js/facilitymap.js nest_area, a tile = 20 sketch px), moved to this sheet's corner
  const Q = [[24, 59], [28.5, 59], [28.5, 58], [30.5, 58], [30.5, 59], [36, 59], [38, 60], [38, 68], [37, 70], [35, 71], [25, 71], [23, 70], [22, 68], [22, 61]].map(([x, y]) => [x + 8, y - 56]);
  const caves = {
    brood1: [[9.6, 6.2], [13.5, 4.4], [18.6, 5.2], [21.2, 8], [20.4, 12], [16.4, 13.8], [11.4, 12.8], [9, 9.6]],
    shelf: [[2.6, 2.4], [6.8, 0.8], [10.8, 1.8], [11.6, 4.4], [9.6, 6.3], [5, 6], [2.4, 4.6]],
    stream: [[25.6, 17.8], [29.6, 16.8], [32.6, 18.6], [32.4, 22.6], [29, 24.2], [25.4, 22.6]],
    burrow: [[33.6, 22.6], [38.6, 21.4], [42.6, 23.2], [42.4, 27.2], [38, 28.8], [33.8, 27.4]],
    deep: [[11.6, 27.8], [17.6, 26.4], [25.6, 27.6], [28.8, 31.6], [27, 36.8], [19, 38.6], [12, 36.6], [9.8, 32]],
    larder: [[33.2, 31.4], [37.6, 30.4], [41, 32.4], [40.4, 36.2], [36.4, 37.6], [33, 36]],
    hollow: [[35.9, 16.5], [37.7, 16.8], [37.8, 19.4], [36.1, 19.7]],          // the boulder's hollow, beside its tunnel
    flaskHollow: [[17.3, 21.6], [18.9, 21.4], [19.3, 23.1], [17.8, 23.6]],     // where the ants left the flask
  };
  const tunnels = [
    { pts: [[30.6, 8.6], [27, 8.4], [23.4, 8.9], [20.4, 9.4]], w: 3 },             // T1: the queen's cavern west to the first brood chamber
    { pts: [[15.2, 12.8], [14.4, 16.6], [16.2, 20], [15.2, 23.9]], w: 3 },         // T3: south to the cracked wall
    { pts: [[15.2, 24.6], [16.6, 26.6], [17.6, 28.4]], w: 3 },                       //     on, past it, into the deep brood
    { pts: [[16, 20], [19.6, 20.2], [23, 20.4], [26.4, 20.4]], w: 3 },            // T4: east, across the stream, to the stream cave
    { pts: [[33.8, 14.6], [34.2, 17.6], [35.4, 20.6], [36.2, 22.6]], w: 3 },      // T6: the queen's cavern south to the old burrow (the boulder)
    { pts: [[28.2, 33.2], [31, 33.6], [33.8, 33.8]], w: 3 },                       // T7: the deep brood east to the larder (the resin seal)
    { pts: [[12.6, 36.2], [10.2, 39.6], [7.8, 43.4], [6.6, 47.6], [6.4, 50.4]], w: 3.2 },   // the sloping tunnel down (later)
  ];
  let s = '';
  const rock = '#6e5238', dirt = '#2b2016', st = T * 0.55;
  const tun = (t, col, extra) => `<path d="${k.pathD(t.pts)}" fill="none" stroke="${col}" stroke-width="${t.w * T + extra}" stroke-linecap="round" stroke-linejoin="round"/>`;
  // walls (rock) first, then the dirt floors over them
  s += k.poly(Q, `fill="${rock}" stroke="${rock}" stroke-width="${st}" stroke-linejoin="round"`) + k.rect(20.6, 15.2, 23.6, 25.8, `fill="${rock}" stroke="${rock}" stroke-width="${st}" stroke-linejoin="round"`);
  for (const c of Object.values(caves)) s += `<path d="${k.blobD(c)}" fill="${rock}" stroke="${rock}" stroke-width="${st}"/>`;
  for (const t of tunnels) s += tun(t, rock, st);
  s += k.poly(Q, `fill="${dirt}"`);
  for (const c of Object.values(caves)) s += `<path d="${k.blobD(c)}" fill="${dirt}"/>`;
  for (const t of tunnels) s += tun(t, dirt, 0);
  // the shelf is high ground: its floor lighter, its face to the brood chamber a cliff
  s += `<path d="${k.blobD(caves.shelf)}" fill="#3b2d1f"/>` + k.line([[8.4, 6.25], [9.9, 5.9], [11.1, 4.6]], 'stroke="#d9a860" stroke-width="4" stroke-linecap="round"') + k.line([[8.4, 6.75], [10.2, 6.4], [11.6, 5]], 'stroke="#d9a860" stroke-width="1.6" stroke-dasharray="3 3"');
  // the queen's cavern, as it is: the mouth up to the arena, the console, her post, the eggs, the brood holes
  s += k.rect(36.5, 2, 38.5, 2.6, 'fill="#ffb347"') + k.text(37.5, 1.2, '▲ up to the arena (the drilled rubble, as built)', { size: 12, col: '#ffcf8a', bold: true });
  s += k.rect(39.6, 3.7, 41.6, 4.4, 'fill="#22303f" stroke="#7d93b0" stroke-width="1.5"') + k.text(40.6, 5.5, 'console', { size: 10, col: '#9fb6d0' });
  s += `<circle cx="${k.X(38)}" cy="${k.Y(10)}" r="${T * 1.25}" fill="#3a1f3a" stroke="#c06bff" stroke-width="2"/>` + k.text(38, 10.35, 'QUEEN', { size: 10, col: '#e9c8ff', bold: true });
  const eggs = (x, y, n, r) => { let o = ''; for (let i = 0; i < n; i++) { const a = i * 2.4, d = r * Math.sqrt((i + 0.5) / n); o += `<ellipse cx="${k.X(x + Math.cos(a) * d)}" cy="${k.Y(y + Math.sin(a) * d)}" rx="${T * 0.24}" ry="${T * 0.32}" fill="#e8e0c0" stroke="#8a7a50" stroke-width="1"/>`; } return o; };
  s += eggs(44.1, 5.1, 7, 1.1) + eggs(44.7, 9, 4, 0.7) + eggs(43, 12.1, 6, 1) + eggs(33.4, 12.1, 6, 1) + eggs(32.4, 5, 4, 0.7);
  s += eggs(12.5, 6.4, 7, 1.1) + eggs(18.6, 11.4, 6, 1) + eggs(13.6, 29.6, 8, 1.2) + eggs(24.6, 34.8, 8, 1.2) + eggs(19.4, 37, 5, 0.8) + eggs(24.6, 29.2, 5, 0.8);
  const hole = (x, y) => `<ellipse cx="${k.X(x)}" cy="${k.Y(y)}" rx="${T * 0.7}" ry="${T * 0.45}" fill="#0c0805" stroke="#8cff5a" stroke-width="1.4" opacity="0.9"/>`;
  s += hole(34.4, 3.6) + hole(41.4, 3.6) + hole(10.6, 9.8) + hole(21.2, 34.6) + hole(15.6, 35.6);
  // ① a collapsed tunnel: the drill again (the Nest's own key, as its way in)
  s += k.rubble(24.6, 7.1, 26.2, 10.2, 21) + k.badge(25.4, 5.4, 'fire', 1);
  s += k.text(25.4, 12.4, 'collapsed tunnel', { size: 11, col: '#ffb08a' });
  // ② a cracked wall, and a flask the ants dragged down, in a hollow beside it
  s += k.crack([[13.6, 24.2], [16.8, 24.2]]) + k.barrel(18.2, 22.5);
  s += k.badge(11.4, 23, 'any', 2) + k.text(11.0, 25.3, 'a cracked wall; a flask', { size: 11, col: '#ffcf9a', anchor: 'end' }) + k.text(11.0, 26.3, 'the ants dragged down', { size: 11, col: '#ffcf9a', anchor: 'end' });
  // the stream: ice-bridge it to the stream cave
  s += k.water(20.6, 15.6, 23.6, 25.4, '#145a6e') + `<rect x="${k.X(20.3)}" y="${k.Y(19.35)}" width="${3.6 * T}" height="${2.1 * T}" fill="none" stroke="#bff3ff" stroke-width="2" stroke-dasharray="5 4"/>`;
  s += k.badge(22.1, 13.7, 'ice') + k.text(22.1, 27, 'an underground stream', { size: 11, col: '#8fe3ff' }) + k.chest(29.6, 20.4, 'B');
  // the shelf: a REEF climb up its face (or the launcher)
  s += k.badge(13.6, 3.0, 'bloom') + k.chest(5.6, 3.4, 'A') + k.text(6.8, -0.1, 'THE SHELF · high ground', { size: 12, col: '#ffd9a0', bold: true });
  // the old burrow: a boulder in the tunnel, a hollow beside it (FLUX MOVE it in)
  s += `<circle cx="${k.X(34.4)}" cy="${k.Y(18.2)}" r="${T * 1.15}" fill="#5a4636" stroke="#2a1c10" stroke-width="2"/>` + `<circle cx="${k.X(36.85)}" cy="${k.Y(18.1)}" r="${T * 0.85}" fill="none" stroke="#c39bff" stroke-width="1.6" stroke-dasharray="4 3"/>` + k.arrow([35.4, 18.1], [36.6, 18.1], '#c39bff');
  s += k.badge(39.6, 17.4, 'flux') + k.chest(38.2, 24.4, 'C') + k.text(38.2, 27.3, 'THE OLD BURROW', { size: 12, col: '#ffd9a0', bold: true });
  // the larder: a resin seal; an acid flask beside it eats it (a new idea)
  s += k.rect(29.4, 32, 30.6, 35.2, 'fill="#4f8a2a" stroke="#a6f070" stroke-width="2"') + k.barrel(27.4, 35.3, true) + k.badge(31.1, 38.3, 'acid') + k.chest(37.2, 33.8, 'D');
  s += k.text(36.9, 36.3, 'THE LARDER', { size: 12, col: '#ffd9a0', bold: true });
  // the way down (later): a sloping tunnel, no stairs (decided 2026-11-11)
  for (let i = 0; i < 4; i++) { const y = 41 + i * 2.3, x = 9.1 - i * 0.6; s += k.text(x, y, '▼', { size: 13, col: '#ffb347', halo: 0 }); }
  s += k.text(9.4, 51.3, 'THE WAY DOWN · a sloping tunnel, no stairs (decided) · later: to the volcanic layer', { size: 12, col: '#ffcf8a', bold: true, anchor: 'start' });
  // the main way
  s += mainWay(k, [[37.5, 2.8], [37, 6.4], [32, 8.6], [25.4, 8.6], [19, 9.6], [15, 12.6], [14.6, 17], [15.6, 20], [15.2, 23.4], [16.4, 26.4], [17.2, 30.4], [13, 35.6], [9.8, 40.2], [7.6, 44.4], [6.6, 49.4]]);
  s += k.badge(25.4, 5.4, 'fire', 1) + k.badge(11.4, 23, 'any', 2);
  // the names
  s += k.text(38, 14.2, "THE QUEEN'S CAVERN · as built", { size: 13, col: '#ffe0b0', bold: true }) + k.text(38, 15.3, 'the test ground and its console stay', { size: 11, col: '#c9a982' });
  s += k.text(16.8, 6.9, 'BROOD CHAMBER', { size: 12, col: '#ffe0b0', bold: true }) + k.text(19.4, 31.6, 'THE DEEP BROOD', { size: 13, col: '#ffe0b0', bold: true }) + k.text(29, 16.2, 'STREAM CAVE', { size: 12, col: '#ffd9a0', bold: true });
  s += k.scale(41, 47, 5);
  const Wp = W * T + PAD * 2, Hp = H * T + PAD * 2;
  const svg = `<svg width="${Wp}" height="${Hp}" viewBox="0 0 ${Wp} ${Hp}">${s}</svg>`;
  const notes = `<div class="notes"><ul>
    <li><b>The queen's cavern stays as it is</b> (the test ground, the console, the queen); tunnels go out of its west and south walls. She stays in her cavern and does not follow you into them.</li>
    <li><b>Tunnels 3 tiles wide</b>, winding; nests (brood chambers) along them; the eggs, brood holes and resin of the cavern carried through.</li>
    <li><b>The main way</b> (the green line): <b>①</b> drill a collapsed tunnel (fire: the Nest's own key, as its way in), <b>②</b> shoot the flask the ants dragged down by a cracked wall (anyone), then through the deep brood to <b>the way down</b>: the sloping tunnel you decided on, to the volcanic layer (later).</li>
    <li><b>Four side pockets</b>, each ending in a chest: <b>A</b> a REEF climb up to the shelf, <b>B</b> an ice bridge over the stream, <b>C</b> FLUX MOVE the boulder into its hollow, <b>D</b> a resin seal an acid flask eats through (<span class="q">a new idea</span>).</li>
    <li class="q">Every size, name and placement is mine, for you to change.</li></ul>${legend()}</div>`;
  return page(Wp + 470 + 26, 440, `<h1>2 · The Ant Nest, grown out into tunnels and nests <span class="tag">DRAFT</span></h1><p class="sub">Seen from above, north at the top. You come down through the drilled rubble at the top, into the queen's cavern as it is now, and out through the new tunnels.</p><div class="row">${svg}${notes}</div>`);
}

module.exports = { WHO, kit, page, legend, CSS };
if (require.main === module) (async () => {
  const sheets = [['1_elec', elec()], ['2_nest', nest()]];
  const extra = (() => { try { return require('./passages-ways.js'); } catch (e) { if (e.code !== 'MODULE_NOT_FOUND') throw e; return null; } })();
  if (extra) sheets.push(...extra.sheets());
  const b = await chromium.launch();
  for (const [n, html] of sheets) {
    const f = path.join(OUT, n + '.html'); fs.writeFileSync(f, html);
    const p = await b.newPage({ viewport: { width: 1500, height: 900 }, deviceScaleFactor: 1.5 });
    await p.goto('file://' + f); await p.evaluate(() => document.fonts.ready); const el = await p.$('.sheet'); await el.screenshot({ path: path.join(OUT, n + '.png') }); await p.close();
  }
  await b.close(); console.log('drafts written to', OUT);
})();
