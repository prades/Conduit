// THE SEWER DUNGEON, TRACED (docs/SEWER-DUNGEON.md): the owner's skeleton (skeleton-2026-11-20.png) traced by hand, shape for shape, on a grid of 80 tiles across by 72 down laid over the
// picture's map (its top-left at pixel 95, 70; a tile 12.44 px). Every point is in tiles; walls run on diagonals and at part tiles as the picture draws them. A draft: the agent's
// reading of the picture, for the owner to check against it (node trace.js prints the overlay's drawing for ImageMagick). Supersedes layout.js (the rectangles).
// lvl: its floor's height in storeys, the agent's reading of the picture (0 the walkways; -2 a channel's bed; -1 the rooms the picture's stairs go down to and the drain; 1 the gallery and wing the
// stairs go up to; 2 the High Ledge)
// kind: water (a channel), drain (floor at LOW, under water at HIGH), walk (a walkway or passage), floor (a room), upper (a floor a storey up), ring (the junction's walkway), nest (its dam)
const C = [43, 47], disc = (r, n, a0, a1) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([+(C[0] + Math.cos(a) * r).toFixed(2), +(C[1] + Math.sin(a) * r).toFixed(2)]); } return p; };
const RO = 12, RI = 9.5, PI = Math.PI;
// where something meets the ring's outer edge: a chord between two points of the circle, an edge of the ring exactly (so a doorway can lie on it). on(x) / at(y): the circle's point at that x (north half) or y
const cN = x => [x, +(C[1] - Math.sqrt(RO * RO - (x - C[0]) ** 2)).toFixed(2)], cW = y => [+(C[0] - Math.sqrt(RO * RO - (y - C[1]) ** 2)).toFixed(2), y], cE = y => [+(C[0] + Math.sqrt(RO * RO - (y - C[1]) ** 2)).toFixed(2), y];
const ang = p => Math.atan2(p[1] - C[1], p[0] - C[0]), onC = a => [+(C[0] + Math.cos(a) * RO).toFixed(2), +(C[1] + Math.sin(a) * RO).toFixed(2)];
const K = { wwA: cN(37.2), wwB: cN(40.4), top: [C[0], C[1] - RO], weA: cN(46.2), weB: cN(48.6), plA: cW(42.5), plB: cW(45), puA: cE(44.5), puB: cE(49.5), sdA: onC(Math.atan2(7.6, -9.4)), sdB: onC(Math.atan2(9.2, -8.2)) };
// the ring's outer edge from angle a0 to a1 (a0 < a1), its arc in steps with every chord's ends among its points and no arc point between a chord's two ends
function outer(a0, a1, chords) { const pts = []; for (let i = 0; i <= 28; i++) pts.push(a0 + (a1 - a0) * i / 28); const norm = a => { while (a < a0 - 1e-9) a += 2 * PI; return a; };
  const cs = chords.map(([p, q]) => [norm(ang(p)), norm(ang(q))].sort((x, y) => x - y)); let as = pts.filter(a => !cs.some(c => a > c[0] - 0.02 && a < c[1] + 0.02)); for (const c of cs) as.push(c[0], c[1]);
  return as.sort((x, y) => x - y).map(a => onC(a)); }
const INNER = []; for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * 2 * PI; INNER.push([+(C[0] + Math.cos(a) * RI / Math.cos(PI / 16)).toFixed(2), +(C[1] + Math.sin(a) * RI / Math.cos(PI / 16)).toFixed(2)]); }   // (its flat sides touch the circle of radius RI)
// the inner edge between two of the ring's cuts (north, at angle 1.5 PI, and south, at 0.5 PI), going from a0 to a1: the cut's point, the sixteen-gon's corners between, the other cut's point
function inner(a0, a1) { const cut = a => [C[0], +(C[1] + Math.sin(a) * RI).toFixed(2)], dir = a1 < a0 ? -1 : 1, lo = Math.min(a0, a1), hi = Math.max(a0, a1); let pts = INNER.map((p, i) => ({ p, a: (i + 0.5) / 16 * 2 * PI })).flatMap(o => [o, { p: o.p, a: o.a - 2 * PI }]).filter(o => o.a > lo + 1e-6 && o.a < hi - 1e-6).sort((x, y) => dir * (x.a - y.a)).map(o => o.p); return [cut(a0)].concat(pts, [cut(a1)]); }
const SHAPES = [
  { id: 'west_channel', lvl: -2, kind: 'water', p: [[0, 16.2], [37.2, 16.2], [37.2, 19.3], [0, 19.3]] },
  { id: 'central_channel', lvl: -2, kind: 'water', p: [[40.4, 0], [46.2, 0], K.weA, K.top, K.wwB] },
  { id: 'low_drain', lvl: -1, kind: 'drain', p: [[48.6, 33.4], [55, 33.4], [57, 35], [62, 35], [64, 36.5], [64, 38.6], [60.5, 38.6], [58.5, 37], [55, 37], [53.5, 35.8], [48.6, 35.8]] },
  { id: 'central_walk_w', lvl: 0, kind: 'walk', p: [[37.2, 0], [40.4, 0], K.wwB, K.wwA] },
  { id: 'central_walk_e', lvl: 0, kind: 'walk', p: [[46.2, 0], [48.6, 0], K.weB, K.weA] },
  { id: 'west_walk_n', lvl: 0, kind: 'walk', p: [[0, 14.4], [37.2, 14.4], [37.2, 16.2], [0, 16.2]] },
  { id: 'west_walk_s', lvl: 0, kind: 'walk', p: [[0, 19.3], [37.2, 19.3], [37.2, 21], [0, 21]] },
  { id: 'nw_gallery', lvl: 1, kind: 'floor', p: [[1.5, 12.2], [3, 10.8], [13.5, 10.8], [16.2, 12.6], [29.5, 12.6], [29.5, 14.4], [1.5, 14.4]] },
  { id: 'nw_wing', lvl: 1, kind: 'floor', p: [[23.6, 4], [25.2, 2.5], [34.6, 2.5], [36.2, 4], [36.2, 5.4], [36.9, 5.9], [36.9, 7.9], [36.4, 9.6], [36.4, 13], [31, 13], [31, 11], [29.5, 11], [29.5, 12.6], [25, 12.6], [23.6, 11]] },
  { id: 'west_cell', lvl: -1, kind: 'floor', p: [[2.5, 22], [3.5, 21], [7.5, 21], [8.5, 22.5], [10.5, 24.5], [11.5, 28], [14, 30.5], [14, 32.5], [12.5, 31], [9.5, 27], [8, 24.8], [3.5, 24.8], [2.5, 23.8]] },
  { id: 'hall_stair', lvl: 0, kind: 'walk', p: [[14.5, 21], [16.5, 21], [16.5, 29.5], [14.5, 29.5]] },
  { id: 'west_hall', lvl: -1, kind: 'floor', p: [[14, 30.5], [15, 29.5], [27, 29.5], [27.5, 30], [27.5, 34], [26, 35.5], [15, 35.5], [14, 34.5]] },
  // (no passage from the West Hall's east side up to the Central Channel's walkway: the owner, 2026-11-21, circling it on the overlay: "No hallway here")
  { id: 'hall_south', lvl: -1, kind: 'walk', p: [[23.5, 35.5], [25, 35.5], [25, 41.5], [23.5, 41.5]] },
  { id: 'sw_storage', lvl: -1, kind: 'floor', p: [[14.5, 43.5], [16, 42], [16, 40.5], [17, 39.5], [20, 39.5], [20.5, 41.5], [22.5, 41.5], [22.5, 48], [15.5, 48], [14.5, 47]] },
  { id: 'sw_plaza', lvl: -1, kind: 'floor', p: [[22.5, 41.5], [26.5, 41.5], [26.5, 40.3], [29.6, 40.3], [29.6, 45], [27, 45], [27, 48], [22.5, 48]] },
  { id: 'plaza_ring', lvl: -1, kind: 'walk', p: [[29.6, 42.5], K.plA, K.plB, [29.6, 45]] },
  { id: 'south_loop', lvl: -1, kind: 'walk', p: [[24, 48], [26.5, 48], [26.5, 51.5], [28.5, 53.5], [28.5, 58], [26.5, 58], [26.5, 54.5], [24, 52]] },
  { id: 'subway_exit', lvl: -1, kind: 'floor', p: [[15, 61], [17, 59], [24, 59], [25, 58], [28.5, 58], [28.5, 59.5], [23, 64], [15.5, 64], [14.5, 63]] },
  { id: 'subway_diag', lvl: -1, kind: 'walk', p: [[28.5, 58], K.sdA, K.sdB, [28.5, 59.5]] },
  { id: 'junction_ring_w', lvl: -1, kind: 'ring', p: outer(PI / 2, PI * 1.5, [[K.sdB, K.sdA], [K.plB, K.plA], [K.wwA, K.wwB], [K.wwB, K.top]]).concat(inner(PI * 1.5, PI / 2)) },
  { id: 'junction_ring_e', lvl: -1, kind: 'ring', p: outer(-PI / 2, PI / 2, [[K.top, K.weA], [K.weA, K.weB], [K.puA, K.puB]]).concat(inner(PI / 2, -PI / 2)) },
  { id: 'junction_nest', lvl: -2, kind: 'nest', p: INNER.slice() },
  { id: 'pur_pass', lvl: 0, kind: 'walk', p: [K.puA, [60.5, 44.5], [61.5, 45.5], [64.5, 45.5], [64.5, 48.5], [61.5, 48.5], [60.5, 49.5], K.puB] },
  { id: 'purification', lvl: 0, kind: 'floor', p: [[64.5, 42.5], [65.5, 41.5], [66.5, 40.5], [70, 40.5], [71, 41.5], [76.5, 41.5], [77.5, 42.5], [77.5, 50.5], [76.5, 51.5], [66, 51.5], [64.5, 50]] },
  { id: 'ne_door', lvl: 0, kind: 'walk', p: [[48.6, 6.5], [52.5, 6.5], [52.5, 9], [48.6, 9]] },
  { id: 'ne_offices', lvl: 0, kind: 'floor', p: [[52.5, 3.8], [54, 2.6], [64, 2.6], [64.8, 3.4], [64.8, 10.6], [58, 10.6], [56.5, 9], [52.5, 9]] },
  { id: 'ne_crack', lvl: 0, kind: 'walk', p: [[60, 10.6], [62, 10.6], [62, 13.8], [60, 13.8]] },
  { id: 'high_ledge', lvl: 2, kind: 'upper', p: [[52, 14], [53, 13], [57.5, 13], [58, 13.8], [61.5, 13.8], [62.5, 15], [64.8, 15], [64.8, 18.5], [63.5, 20], [63.5, 21], [57.5, 21], [57.5, 23], [55, 23], [53.5, 21.5], [51, 21.5], [51, 16]] },
  { id: 'hl_approach', lvl: 0, kind: 'walk', p: [[48.6, 22], [51, 22], [51, 24], [48.6, 24]] },
  { id: 'hl_foot', lvl: 0, kind: 'floor', p: [[51, 21.5], [53.5, 21.5], [55, 23], [57.5, 23], [57.5, 24], [51, 24]], note: 'the launcher stands here and throws you up to the ledge' },
  { id: 'er_approach', lvl: 0, kind: 'walk', p: [[48.6, 26.5], [54, 26.5], [54, 29], [48.6, 29]] },
  { id: 'east_rubble', lvl: 0, kind: 'floor', p: [[54, 26], [55, 25], [58.5, 25], [59, 25.6], [60, 25.6], [60.8, 24.5], [63, 24.5], [63.5, 23.5], [66, 23.5], [66.5, 24.5], [66.5, 30.5], [65.5, 31.2], [61, 31.2], [60, 30.5], [55.5, 30.5], [54, 29]] },
];
// THE STAIRS (the owner, 2026-11-21: "I see a lot of places where stairs are there, but you're not putting them in"): every flight the picture draws, found on a second pass over it enlarged.
// p: its outline; from, to: the heights it joins (storeys); note: what it is. The agent's reading of the picture's hatching; where a flight goes is its guess from what lies at each end.
const STAIRS = [
  { id: 'st_channel_n', from: 1, to: -2, p: [[9.3, 14.3], [11.7, 14.3], [11.7, 18], [9.3, 18]], note: 'from the gallery down past the north walkway into the West Channel\'s bed' },
  { id: 'st_hall', from: 0, to: -1, p: [[14.5, 21], [16.5, 21], [16.5, 27.5], [14.5, 27.5]], note: 'from the south walkway down to the West Hall' },
  // (no flight between the south-west plaza and the ring: the owner, 2026-11-21, circling it on the overlay: "Not stairs")
  { id: 'st_subway', from: -1, to: -1, p: [[31, 58.3], [33.6, 54.6], [34.8, 56.2], [32.2, 59.8]], note: 'the diagonal flight between the Subway Exit\'s passage and the ring (both read as a storey down now: how far it rises is not clear)' },
  { id: 'st_offices', from: 0, to: 0, p: [[48.6, 6.5], [52.5, 6.5], [52.5, 9], [48.6, 9]], note: 'steps at the Offices\' locked door (how far they rise is not clear from the picture)' },
  { id: 'st_ledge', from: 2, to: 0, p: [[55, 21], [57.5, 21], [57.5, 23.6], [55, 23.6]], note: 'inside the High Ledge Room, down to its foot' },
  { id: 'st_rubble', from: 0, to: 0, p: [[49, 26.5], [53.8, 26.5], [53.8, 29], [49, 29]], note: 'steps on the approach to the East Rubble (how far they rise is not clear)' },
  { id: 'st_bank_w', from: 0, to: -2, p: [[39.3, 0], [40.4, 0], [40.4, 36], [39.3, 36]], note: 'the stepped bank along the Central Channel\'s west side, down to the water' },
  { id: 'st_bank_e', from: 0, to: -2, p: [[46.2, 0], [47.4, 0], [47.4, 36], [46.2, 36]], note: 'the stepped bank along its east side' },
  { id: 'st_ring', from: -1, to: -2, p: disc(RI + 1.3, 40, 0, PI * 2).concat(disc(RI, 40, PI * 2, 0)), note: 'the ring\'s inner steps, all the way round, down to the nest' },
  { id: 'st_ramp_w', from: 0, to: -1, p: [[37.2, 33], [40.4, 33], [40.4, 36.4], [37.2, 36.4]], note: 'the stepped curve where the Central Channel\'s west walkway comes down onto the ring' },
  { id: 'st_ramp_e', from: 0, to: -1, p: [[46.2, 33], [48.6, 33], [48.6, 36.4], [46.2, 36.4]], note: 'the same on its east side' },
  { id: 'st_pur', from: -1, to: 0, p: [[54.3, 44.5], [55.6, 44.5], [55.6, 49.5], [54.3, 49.5]], note: 'steps up from the ring to the Purification Chamber\'s passage' },
];
module.exports = { STAIRS, SHAPES, W: 80, H: 72, C, RO, RI };
if (require.main === module) {
  const S = +(process.argv[2] || 3), T = 995 / 80 * S, COL = { water: '0,220,255', drain: '0,255,160', walk: '255,230,0', floor: '255,255,255', upper: '255,150,0', ring: '255,230,0', nest: '255,0,255' };
  const mid = p => [p.reduce((a, q) => a + q[0], 0) / p.length * T, p.reduce((a, q) => a + q[1], 0) / p.length * T];
  if (process.argv[3] === 'stairs') { console.log(STAIRS.map(s => `fill rgba(255,40,40,0.45) stroke rgba(255,60,60,1) stroke-width 3 polygon ${s.p.map(q => (q[0] * T).toFixed(1) + ',' + (q[1] * T).toFixed(1)).join(' ')}`).join(' ')); return; }
  if (process.argv[3] === 'levels') { console.log(SHAPES.filter(s => !/ring_e/.test(s.id)).map(s => { const m = mid(s.p); return `fill black stroke black stroke-width 4 text ${m[0] - 14},${m[1] + 8} '${s.lvl > 0 ? '+' + s.lvl : s.lvl}' fill white stroke none text ${m[0] - 14},${m[1] + 8} '${s.lvl > 0 ? '+' + s.lvl : s.lvl}'`; }).join(' ')); return; }
  console.log(SHAPES.map(s => `fill rgba(${COL[s.kind]},0.28) stroke rgba(${COL[s.kind]},1) stroke-width 3 polygon ${s.p.map(q => (q[0] * T).toFixed(1) + ',' + (q[1] * T).toFixed(1)).join(' ')}`).join(' '));
}
