// THE SEWER DUNGEON, TRACED (docs/SEWER-DUNGEON.md): the owner's skeleton (skeleton-2026-11-20.png) traced by hand, shape for shape, on a grid of 80 tiles across by 72 down laid over the
// picture's map (its top-left at pixel 95, 70; a tile 12.44 px). Every point is in tiles; walls run on diagonals and at part tiles as the picture draws them. A draft: the agent's
// reading of the picture, for the owner to check against it (node trace.js prints the overlay's drawing for ImageMagick). Supersedes layout.js (the rectangles).
// kind: water (a channel), drain (floor at LOW, under water at HIGH), walk (a walkway or passage), floor (a room), upper (a floor a storey up), ring (the junction's walkway), nest (its dam)
const C = [43, 47], disc = (r, n, a0, a1) => { const p = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; p.push([+(C[0] + Math.cos(a) * r).toFixed(2), +(C[1] + Math.sin(a) * r).toFixed(2)]); } return p; };
const RO = 12, RI = 9.5, PI = Math.PI;
const SHAPES = [
  { id: 'west_channel', kind: 'water', p: [[0, 16.2], [37.2, 16.2], [37.2, 19.3], [0, 19.3]] },
  { id: 'central_channel', kind: 'water', p: [[40.4, 0], [46.2, 0], [46.2, 36], [40.4, 36]] },
  { id: 'low_drain', kind: 'drain', p: [[48.6, 33.4], [55, 33.4], [57, 35], [62, 35], [64, 36.5], [64, 38.6], [60.5, 38.6], [58.5, 37], [55, 37], [53.5, 35.8], [48.6, 35.8]] },
  { id: 'central_walk_w', kind: 'walk', p: [[37.2, 0], [40.4, 0], [40.4, 36.4], [37.2, 36.4]] },
  { id: 'central_walk_e', kind: 'walk', p: [[46.2, 0], [48.6, 0], [48.6, 36.4], [46.2, 36.4]] },
  { id: 'west_walk_n', kind: 'walk', p: [[0, 14.4], [37.2, 14.4], [37.2, 16.2], [0, 16.2]] },
  { id: 'west_walk_s', kind: 'walk', p: [[0, 19.3], [37.2, 19.3], [37.2, 21], [0, 21]] },
  { id: 'nw_gallery', kind: 'floor', p: [[1.5, 12.2], [3, 10.8], [13.5, 10.8], [16.2, 12.6], [25, 12.6], [25, 14.4], [1.5, 14.4]] },
  { id: 'nw_wing', kind: 'floor', p: [[23.6, 4], [25.2, 2.5], [34.6, 2.5], [36.2, 4], [36.2, 5.4], [38, 5.9], [38, 7.9], [36.4, 9.6], [36.4, 13], [31, 13], [31, 11], [29.5, 11], [29.5, 12.6], [25, 12.6], [23.6, 11]] },
  { id: 'west_cell', kind: 'floor', p: [[2.5, 22], [3.5, 21], [7.5, 21], [8.5, 22.5], [10.5, 24.5], [11.5, 28], [14, 30.5], [12.5, 31], [9.5, 27], [8, 24.8], [3.5, 24.8], [2.5, 23.8]] },
  { id: 'hall_stair', kind: 'walk', p: [[14.5, 21], [16.5, 21], [16.5, 29.5], [14.5, 29.5]] },
  { id: 'west_hall', kind: 'floor', p: [[14, 30.5], [15, 29.5], [27, 29.5], [27.5, 30], [27.5, 34], [26, 35.5], [15, 35.5], [14, 34.5]] },
  { id: 'hall_diag', kind: 'walk', p: [[27.5, 32.8], [35, 25.5], [37.2, 25.5], [37.2, 27.5], [36, 27.5], [29, 34.5], [27.5, 34.5]] },
  { id: 'hall_south', kind: 'walk', p: [[23.5, 35.5], [25, 35.5], [25, 41.5], [23.5, 41.5]] },
  { id: 'sw_storage', kind: 'floor', p: [[14.5, 43.5], [16, 42], [16, 40.5], [17, 39.5], [20, 39.5], [20.5, 41.5], [22.5, 41.5], [22.5, 48], [15.5, 48], [14.5, 47]] },
  { id: 'sw_plaza', kind: 'floor', p: [[22.5, 41.5], [26.5, 41.5], [26.5, 40.3], [29.6, 40.3], [29.6, 45], [27, 45], [27, 48], [22.5, 48]] },
  { id: 'plaza_ring', kind: 'walk', p: [[29.6, 42.5], [31.4, 42.5], [31.4, 45], [29.6, 45]] },
  { id: 'south_loop', kind: 'walk', p: [[24, 48], [26.5, 48], [26.5, 51.5], [28.5, 53.5], [28.5, 58], [26.5, 58], [26.5, 54.5], [24, 52]] },
  { id: 'subway_exit', kind: 'floor', p: [[15, 61], [17, 59], [24, 59], [25, 58], [28.5, 58], [28.5, 59.5], [23, 64], [15.5, 64], [14.5, 63]] },
  { id: 'subway_diag', kind: 'walk', p: [[28.5, 58], [33.6, 54.6], [34.8, 56.2], [28.5, 60.5]] },
  { id: 'junction_ring_w', kind: 'ring', p: disc(RO, 20, PI / 2, PI * 1.5).concat(disc(RI, 20, PI * 1.5, PI / 2)) },
  { id: 'junction_ring_e', kind: 'ring', p: disc(RO, 20, -PI / 2, PI / 2).concat(disc(RI, 20, PI / 2, -PI / 2)) },
  { id: 'junction_nest', kind: 'nest', p: disc(RI, 40, 0, PI * 2) },
  { id: 'pur_pass', kind: 'walk', p: [[54.8, 44.5], [60.5, 44.5], [61.5, 45.5], [64.5, 45.5], [64.5, 48.5], [61.5, 48.5], [60.5, 49.5], [54.5, 49.5]] },
  { id: 'purification', kind: 'floor', p: [[64.5, 42.5], [65.5, 41.5], [66.5, 40.5], [70, 40.5], [71, 41.5], [76.5, 41.5], [77.5, 42.5], [77.5, 50.5], [76.5, 51.5], [66, 51.5], [64.5, 50]] },
  { id: 'ne_door', kind: 'walk', p: [[48.6, 6.5], [52.5, 6.5], [52.5, 9], [48.6, 9]] },
  { id: 'ne_offices', kind: 'floor', p: [[52.5, 3.8], [54, 2.6], [64, 2.6], [64.8, 3.4], [64.8, 10.6], [58, 10.6], [56.5, 9], [52.5, 9]] },
  { id: 'ne_crack', kind: 'walk', p: [[60, 10.6], [62, 10.6], [62, 13.8], [60, 13.8]] },
  { id: 'high_ledge', kind: 'upper', p: [[52, 14], [53, 13], [57.5, 13], [58, 13.8], [61.5, 13.8], [62.5, 15], [64.8, 15], [64.8, 18.5], [63.5, 20], [63.5, 21], [57.5, 21], [57.5, 23], [55, 23], [53.5, 21.5], [51, 21.5], [51, 16]] },
  { id: 'hl_approach', kind: 'walk', p: [[48.6, 17], [51, 17], [51, 19], [48.6, 19]] },
  { id: 'er_approach', kind: 'walk', p: [[48.6, 28], [54, 28], [54, 30.5], [48.6, 30.5]] },
  { id: 'east_rubble', kind: 'floor', p: [[54, 26], [55, 25], [58.5, 25], [59, 25.6], [60, 25.6], [60.8, 24.5], [63, 24.5], [63.5, 23.5], [66, 23.5], [66.5, 24.5], [66.5, 30.5], [65.5, 31.2], [61, 31.2], [60, 30.5], [55.5, 30.5], [54, 29]] },
];
module.exports = { SHAPES, W: 80, H: 72, C, RO, RI };
if (require.main === module) {
  const S = +(process.argv[2] || 3), T = 995 / 80 * S, COL = { water: '0,220,255', drain: '0,255,160', walk: '255,230,0', floor: '255,255,255', upper: '255,150,0', ring: '255,230,0', nest: '255,0,255' };
  console.log(SHAPES.map(s => `fill rgba(${COL[s.kind]},0.28) stroke rgba(${COL[s.kind]},1) stroke-width 3 polygon ${s.p.map(q => (q[0] * T).toFixed(1) + ',' + (q[1] * T).toFixed(1)).join(' ')}`).join(' '));
}
