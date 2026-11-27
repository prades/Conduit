// THE SEWER DUNGEON'S MAP ON ONE SHEET (docs/SEWER-DUNGEON.md; the owner, 2026-11-24: "I would like to look at a sewer map right now ... we can work on some points together").
// The whole dungeon from above, drawn from the game's own map (js/sewerdungeonmap.js, made from trace.js by tools/sewerdungeon.js), in the plan format the owner liked for part of it
// (planpic.js, 2026-11-22: "this is an excellent format"): each piece in its kind's colour (a little lighter the higher its floor), its walls thick, its open sides thin, the stairs striped,
// the placed props marked, every named place labelled, and a lettered grid (a square every 5 tiles) so a spot can be named ("D7"). A picture to talk over, not a part of the game.
//   node design/sewer-dungeon/mapsheet.js <out.png> [--marks marks.json]
//     marks.json (optional): [{ "at": "D7" or [x, y] in tiles, "n": "1", "text": "a note" }, ...]: numbered pins and their notes, listed beside the map
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..', '..'), OUT = process.argv[2];
if (!OUT) { console.error('usage: node design/sewer-dungeon/mapsheet.js <out.png> [--marks marks.json]'); process.exit(1); }
const mi = process.argv.indexOf('--marks'), MARKS = mi > 0 ? JSON.parse(fs.readFileSync(process.argv[mi + 1], 'utf8')) : [];
const ctx = {}; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, 'js/sewerdungeonmap.js'), 'utf8') + ';this.M = SEWER_DUNGEON_MAP;', ctx);
const M = ctx.M, TILE = 20, CELL = 5 * TILE;   // (the map's pixels: 20 to a tile; a grid square is 5 tiles)
const build = ((fs.readFileSync(path.join(ROOT, 'js/config.js'), 'utf8').match(/BUILD_VERSION = "([^"]+)"/) || [])[1]) || '?';

// THE SHEET'S MEASURES (CSS px; the picture is taken at 2x)
const K = 0.72, PAD = 44, TOP = 86, X0 = 0, Y0 = 0, X1 = 1600, Y1 = 1300, MW = (X1 - X0) * K, MH = (Y1 - Y0) * K, SIDE = 410, W = PAD + MW + 30 + SIDE + 20, H = TOP + MH + PAD + 20;
const sx = x => (PAD + (x - X0) * K).toFixed(1), sy = y => (TOP + (y - Y0) * K).toFixed(1);
const HEIGHT = {}; for (const l of M.levels) HEIGHT[l.id] = l.height;
const COL = { water: '#1f9fb4', drain: '#2a7f96', walk: '#8a949b', floor: '#5a646c', ring: '#8a949b', nest: '#6a3f86', upper: '#7a6a3a', steps: '#8a949b' };
const shade = (hex, k) => { const n = parseInt(hex.slice(1), 16), f = c => Math.max(0, Math.min(255, Math.round(c * k))); return 'rgb(' + f(n >> 16) + ',' + f((n >> 8) & 255) + ',' + f(n & 255) + ')'; };
const fillOf = r => { const k = r.sewer_dungeon, base = COL[k] || '#5a646c'; if (k === 'water' || k === 'drain') return base; return shade(base, 1 + ((HEIGHT[r.level] || -1.8) + 1.8) * 0.22); };   // (higher floors a little lighter)
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
let svg = '';
// the background and the grid's squares (under the map)
svg += `<rect width="${W}" height="${H}" fill="#0b0f16"/>`;
svg += `<text x="${PAD}" y="36" fill="#e8eef6" font-size="26" font-weight="700" letter-spacing="1">SEWER DUNGEON · THE MAP AS BUILT</text>`;
svg += `<text x="${PAD}" y="62" fill="#8fa0b4" font-size="15">From the game's own map (js/sewerdungeonmap.js), build ${esc(build)}. In the game only with ?sewerdungeon in the address. North is up; a grid square is 5 tiles.</text>`;
for (let x = X0; x <= X1; x += CELL) svg += `<line x1="${sx(x)}" y1="${sy(Y0)}" x2="${sx(x)}" y2="${sy(Y1)}" stroke="#1c2635" stroke-width="1"/>`;
for (let y = Y0; y <= Y1; y += CELL) svg += `<line x1="${sx(X0)}" y1="${sy(y)}" x2="${sx(X1)}" y2="${sy(y)}" stroke="#1c2635" stroke-width="1"/>`;
const LET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
for (let i = 0; (X0 + i * CELL) < X1; i++) { const cx = sx(X0 + (i + 0.5) * CELL); svg += `<text x="${cx}" y="${TOP - 8}" fill="#7f90a6" font-size="15" font-weight="700" text-anchor="middle">${LET[i]}</text><text x="${cx}" y="${(+sy(Y1) + 20).toFixed(1)}" fill="#7f90a6" font-size="15" font-weight="700" text-anchor="middle">${LET[i]}</text>`; }
for (let j = 0; (Y0 + j * CELL) < Y1; j++) { const cy = (+sy(Y0 + (j + 0.5) * CELL) + 5).toFixed(1); svg += `<text x="${PAD - 12}" y="${cy}" fill="#7f90a6" font-size="15" font-weight="700" text-anchor="end">${j + 1}</text><text x="${(+sx(X1) + 10).toFixed(1)}" y="${cy}" fill="#7f90a6" font-size="15" font-weight="700">${j + 1}</text>`; }
// the rooms, filled (lowest first, so a higher floor's edge is drawn over a lower one's)
const rooms = M.rooms.slice().sort((a, b) => (HEIGHT[a.level] || 0) - (HEIGHT[b.level] || 0));
for (const r of rooms) svg += `<polygon points="${r.polygon.map(p => sx(p[0]) + ',' + sy(p[1])).join(' ')}" fill="${fillOf(r)}"/>`;
// the stairs: a stripe at each step, across the way the flight runs
for (const rp of M.ramps) { if (rp.shape !== 'steps' || !rp.zone || !rp.zone.rect) continue; const [a, b, c, d] = rp.zone.rect, n = Math.max(2, rp.zone.steps || 4);
  svg += `<rect x="${sx(Math.min(a, c))}" y="${sy(Math.min(b, d))}" width="${(Math.abs(c - a) * K).toFixed(1)}" height="${(Math.abs(d - b) * K).toFixed(1)}" fill="#b8c2ca" opacity="0.35"/>`;
  for (let i = 1; i < n; i++) { if (rp.zone.axis === 'x') { const x = a + (c - a) * i / n; svg += `<line x1="${sx(x)}" y1="${sy(b)}" x2="${sx(x)}" y2="${sy(d)}" stroke="#e8eef2" stroke-width="1.6" opacity="0.8"/>`; }
    else { const y = b + (d - b) * i / n; svg += `<line x1="${sx(a)}" y1="${sy(y)}" x2="${sx(c)}" y2="${sy(y)}" stroke="#e8eef2" stroke-width="1.6" opacity="0.8"/>`; } } }
// the edges: a wall thick and dark, an open side a faint hairline (the way through)
for (const r of M.rooms) { const P = r.polygon, E = r.edge_kinds || [];
  for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], wall = E[i] === 'wall';
    svg += `<line x1="${sx(a[0])}" y1="${sy(a[1])}" x2="${sx(b[0])}" y2="${sy(b[1])}" stroke="${wall ? '#05070b' : '#0b0f16'}" stroke-width="${wall ? 3.4 : 0.8}" stroke-linecap="round" opacity="${wall ? 1 : 0.45}"/>`; } }
// the ways through, as the game has them (M.openings: where it lets you walk from one piece to the next): each cut through whatever wall was drawn there, in the higher piece's colour
// (a piece's own edge flags say "wall" on 84 sides that hold a way through, the Round Junction's walkway seams among them: the openings are what the game walks by)
const byId = {}; for (const r of M.rooms) byId[r.id] = r;
for (const o of M.openings) { const rs = o.rooms.map(id => byId[id]).filter(Boolean); if (!rs.length) continue; const hi = rs.slice().sort((p, q) => (HEIGHT[q.level] || 0) - (HEIGHT[p.level] || 0))[0];
  svg += `<line x1="${sx(o.a[0])}" y1="${sy(o.a[1])}" x2="${sx(o.b[0])}" y2="${sy(o.b[1])}" stroke="${fillOf(hi)}" stroke-width="5"/>`; }
// a railing (a deck's edge: you see over it, you do not walk through)
for (const r of M.rooms) { const P = r.polygon, E = r.edge_kinds || []; for (let i = 0; i < P.length; i++) if (E[i] === 'deck_rail') { const a = P[i], b = P[(i + 1) % P.length];
  svg += `<line x1="${sx(a[0])}" y1="${sy(a[1])}" x2="${sx(b[0])}" y2="${sy(b[1])}" stroke="#e8d9a8" stroke-width="2.2" stroke-dasharray="5 3"/>`; } }
// the props placed in the map: each by its kind
const PROP = {
  culvert: (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#7fe8ff" stroke="#05070b" stroke-width="2"/><path d="M ${x - 3.5} ${y - 2} L ${x} ${y + 3} L ${x + 3.5} ${y - 2}" stroke="#05070b" stroke-width="2" fill="none"/>`,
  sluice_switch: (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#ffd34a" stroke="#05070b" stroke-width="2"/>`,
  sluice_switch_turned: (x, y) => `<circle cx="${x}" cy="${y}" r="7" fill="#05070b" stroke="#ffd34a" stroke-width="3"/>`,
  drain_valve_turned: (x, y) => `<rect x="${x - 7}" y="${y - 7}" width="14" height="14" fill="#ff9a3a" stroke="#05070b" stroke-width="2" transform="rotate(45 ${x} ${y})"/>`,
  rubble_heap: (x, y) => `<path d="M ${x - 10} ${y + 7} L ${x - 4} ${y - 6} L ${x} ${y + 1} L ${x + 5} ${y - 8} L ${x + 11} ${y + 7} Z" fill="#a07a52" stroke="#05070b" stroke-width="2"/>`,
  secret_door: (x, y) => `<rect x="${x - 11}" y="${y - 5}" width="22" height="10" fill="none" stroke="#e08cff" stroke-width="3" stroke-dasharray="4 3"/>`,
  floor_drain: (x, y) => `<rect x="${x - 6}" y="${y - 6}" width="12" height="12" fill="#1a2430" stroke="#c8d4dc" stroke-width="1.5"/><line x1="${x - 2}" y1="${y - 6}" x2="${x - 2}" y2="${y + 6}" stroke="#c8d4dc"/><line x1="${x + 2}" y1="${y - 6}" x2="${x + 2}" y2="${y + 6}" stroke="#c8d4dc"/>`,
};
for (const p of M.props) { if (!PROP[p.kind] || !p.rect) continue; const [a, b, c, d] = p.rect; svg += PROP[p.kind](+sx((a + c) / 2), +sy((b + d) / 2)); }
// the named places: each at the middle of its pieces (by area), in capitals; the unnamed passages ("Sewers") are left unlabelled
const area = P => { let s = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; s += a[0] * b[1] - b[0] * a[1]; } return s / 2; };
const mid = P => { let A = 0, x = 0, y = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], f = a[0] * b[1] - b[0] * a[1]; A += f; x += (a[0] + b[0]) * f; y += (a[1] + b[1]) * f; } return A ? [x / (3 * A), y / (3 * A)] : P[0]; };
const groups = {}; for (const r of M.rooms) { if (!r.label || r.label === 'Sewers') continue; (groups[r.label] = groups[r.label] || []).push(r); }
const NUDGE = { 'West Channel': [0, 20], 'Central Channel': [0, -240], 'Round Junction': [0, -80], 'Drain Hall': [0, -30], 'High Ledge Room': [0, 0] };   // (where a label at its pieces' middle sits on a wall or another label)
for (const [label, rs] of Object.entries(groups)) { let A = 0, x = 0, y = 0; for (const r of rs) { const a = Math.abs(area(r.polygon)), m = mid(r.polygon); A += a; x += m[0] * a; y += m[1] * a; }
  const n = NUDGE[label] || [0, 0], px = +sx(x / A + n[0]), py = +sy(y / A + n[1]), words = label.toUpperCase().split(' '), lines = words.length > 2 ? [words.slice(0, 2).join(' '), words.slice(2).join(' ')] : label.length > 14 && words.length === 2 ? words : [label.toUpperCase()];
  lines.forEach((t, i) => { const yy = py + (i - (lines.length - 1) / 2) * 17 + 5; svg += `<text x="${px}" y="${yy}" text-anchor="middle" font-size="14" font-weight="800" fill="#ffffff" stroke="#05070b" stroke-width="4" paint-order="stroke" letter-spacing="0.5">${esc(t)}</text>`; }); }
// the owner's pins (marks.json), numbered
const at = a => { if (Array.isArray(a)) return [a[0] * TILE, a[1] * TILE]; const m = /^([A-Z])(\d+)$/.exec(String(a).toUpperCase()); return m ? [X0 + (LET.indexOf(m[1]) + 0.5) * CELL, Y0 + (+m[2] - 0.5) * CELL] : [0, 0]; };
for (const k of MARKS) { const [x, y] = at(k.at), px = +sx(x), py = +sy(y); svg += `<circle cx="${px}" cy="${py}" r="13" fill="#ff4f6a" stroke="#ffffff" stroke-width="2.5"/><text x="${px}" y="${py + 5}" text-anchor="middle" font-size="14" font-weight="800" fill="#ffffff">${esc(k.n)}</text>`; }
// the key, beside the map
let ky = TOP + 4; const kx = +sx(X1) + 40;
const head = t => { svg += `<text x="${kx}" y="${ky + 16}" fill="#e8eef6" font-size="17" font-weight="800" letter-spacing="1">${esc(t)}</text>`; ky += 30; };
const row = (draw, t) => { svg += draw(kx + 14, ky + 9) + `<text x="${kx + 38}" y="${ky + 14}" fill="#c9d3de" font-size="14">${esc(t)}</text>`; ky += 26; };
const sw = c => (x, y) => `<rect x="${x - 12}" y="${y - 9}" width="24" height="18" fill="${c}" stroke="#05070b" stroke-width="2"/>`;
head('THE GROUND');
row(sw(COL.water), 'Water: a channel, or the Junction\'s bowl');
row(sw(COL.drain), 'A drain: dry only when the water is low');
row(sw(COL.walk), 'Walkway or passage');
row(sw(COL.floor), 'A room\'s floor');
row(sw(COL.upper), 'An upper floor (the High Ledge)');
row((x, y) => `<rect x="${x - 12}" y="${y - 9}" width="24" height="18" fill="#8a949b"/><line x1="${x - 4}" y1="${y - 9}" x2="${x - 4}" y2="${y + 9}" stroke="#e8eef2" stroke-width="1.6"/><line x1="${x + 4}" y1="${y - 9}" x2="${x + 4}" y2="${y + 9}" stroke="#e8eef2" stroke-width="1.6"/>`, 'Stairs (a short flight)');
row((x, y) => `<line x1="${x - 12}" y1="${y}" x2="${x + 12}" y2="${y}" stroke="#05070b" stroke-width="4"/><rect x="${x - 13}" y="${y - 9}" width="26" height="18" fill="none" stroke="#3a4656"/>`, 'Wall (thick line)');
row((x, y) => `<rect x="${x - 12}" y="${y - 9}" width="24" height="18" fill="#8a949b"/><line x1="${x}" y1="${y - 9}" x2="${x}" y2="${y + 9}" stroke="#0b0f16" stroke-width="0.8" opacity="0.6"/>`, 'Open side: you can walk through');
row((x, y) => `<rect x="${x - 12}" y="${y - 9}" width="24" height="18" fill="#7a6a3a"/><line x1="${x - 12}" y1="${y + 6}" x2="${x + 12}" y2="${y + 6}" stroke="#e8d9a8" stroke-width="2.2" stroke-dasharray="5 3"/>`, 'Railing (an edge you see over)');
svg += `<text x="${kx}" y="${ky + 12}" fill="#8fa0b4" font-size="12.5">Lighter grey: a higher floor. The deepest is the bowl.</text>`; ky += 30;
head('WHAT IS PLACED');
row((x, y) => PROP.culvert(x, y), 'Culvert: where a channel\'s water comes in');
row((x, y) => PROP.sluice_switch(x, y), 'Sluice switch (a culvert\'s button)');
row((x, y) => PROP.sluice_switch_turned(x, y), 'Sluice switch, already turned');
row((x, y) => PROP.drain_valve_turned(x, y), 'Drain valve, already turned');
row((x, y) => PROP.rubble_heap(x, y), 'Rubble heap (in the way)');
row((x, y) => PROP.secret_door(x, y), 'Secret door');
row((x, y) => PROP.floor_drain(x, y), 'Floor drain');
if (MARKS.length) { ky += 6; head('OUR POINTS'); for (const k of MARKS) { svg += `<circle cx="${kx + 14}" cy="${ky + 9}" r="11" fill="#ff4f6a" stroke="#ffffff" stroke-width="2"/><text x="${kx + 14}" y="${ky + 14}" text-anchor="middle" font-size="12" font-weight="800" fill="#fff">${esc(k.n)}</text><text x="${kx + 38}" y="${ky + 14}" fill="#e8eef6" font-size="14">${esc(k.text || '')}</text>`; ky += 26; } }
ky += 10; head('SIZE');
svg += `<line x1="${kx}" y1="${ky + 6}" x2="${kx + CELL * K}" y2="${ky + 6}" stroke="#c9d3de" stroke-width="3"/><line x1="${kx}" y1="${ky}" x2="${kx}" y2="${ky + 12}" stroke="#c9d3de" stroke-width="2"/><line x1="${kx + CELL * K}" y1="${ky}" x2="${kx + CELL * K}" y2="${ky + 12}" stroke="#c9d3de" stroke-width="2"/><text x="${kx + CELL * K + 10}" y="${ky + 11}" fill="#c9d3de" font-size="14">5 tiles (one grid square)</text>`; ky += 26;
svg += `<text x="${kx}" y="${ky + 12}" fill="#8fa0b4" font-size="12.5">The whole dungeon: about 78 tiles across, 64 down.</text>`;
// north
{ const nx = +sx(X1) - 26, ny = +sy(Y1) - 60; svg += `<path d="M ${nx} ${ny - 22} L ${nx + 10} ${ny + 8} L ${nx} ${ny + 2} L ${nx - 10} ${ny + 8} Z" fill="#e8eef6"/><text x="${nx}" y="${ny + 28}" text-anchor="middle" fill="#e8eef6" font-size="15" font-weight="800">N</text>`; }

const page = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;background:#0b0f16}svg{display:block;font-family:"DejaVu Sans",Arial,sans-serif}</style></head><body><svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">${svg}</svg></body></html>`;
(async () => {
  const { chromium } = require('playwright'); const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: Math.ceil(W), height: Math.ceil(H) }, deviceScaleFactor: 2 });
  await p.setContent(page); await p.screenshot({ path: OUT, fullPage: true }); await b.close();
  console.log('wrote ' + OUT + ' (' + Math.ceil(W) + ' x ' + Math.ceil(H) + ' at 2x): ' + M.rooms.length + ' rooms, ' + M.ramps.filter(r => r.shape === 'steps').length + ' flights of stairs, ' + M.props.filter(p => PROP[p.kind]).length + ' props, ' + MARKS.length + ' pins');
})();
