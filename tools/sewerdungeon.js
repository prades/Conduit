// THE SEWER DUNGEON'S MAP, MADE FROM ITS TRACE (docs/SEWER-DUNGEON.md): node tools/sewerdungeon.js writes js/sewerdungeonmap.js (SEWER_DUNGEON_MAP: the rooms, the doorways between those
// on one floor, the flights between floors, the water) from design/sewer-dungeon/trace.js, the owner's picture traced by hand. Never edit js/sewerdungeonmap.js by hand: change the trace.
// A traced piece is a room of its own (a room has one floor height); two that share a wall on one floor get a doorway its whole length (they read as one space); two on different floors
// get a doorway and a flight only where FLIGHTS says the picture draws stairs. Tiles to the map's sketch pixels: 20 to a tile.
const fs = require('fs'), path = require('path'), ROOT = path.resolve(__dirname, '..');
const { SHAPES, snap, VALVES } = require(path.join(ROOT, 'design/sewer-dungeon/trace.js')), { joins } = require(path.join(ROOT, 'design/sewer-dungeon/joins.js'));
const G = 20, OFFSET = [-5000, 5000], P = 'sd_', px = p => [Math.round(p[0] * G), Math.round(p[1] * G)];
const LABEL = { drain_pool: 'Drain Pool', west_entrance: 'West Entrance', west_channel: 'West Channel', central_channel: 'Central Channel', low_drain: 'Low Drain Tunnel', nw_gallery: 'Northwest Wing', nw_wing: 'Northwest Wing', west_cell: 'West Hall', west_hall: 'West Hall', sw_storage: 'Southwest Storage',
  subway_exit: 'Subway Exit', junction_ring_w: 'Round Junction', junction_ring_e: 'Round Junction', junction_nest: 'Toxic Nest', purification: 'Purification Chamber', ne_offices: 'Northeast Offices', high_ledge: 'High Ledge Room', hl_foot: 'High Ledge Room', east_rubble: 'East Rubble' };
const WATER = new Set(['water']);
// (so the prototype reads: walkways pale, rooms a little darker, a drain's bed and the nest their own colours; stand-ins till the approved concrete and checker plate are in: docs/SEWER-PROPS.md)
const FLOOR = { walk: '#7b858c', steps: '#7b858c', ring: '#7b858c', floor: '#5a646c', upper: '#6e6450', drain: '#3f6672', nest: '#5a3a70' };
// THE HEIGHTS (the owner, 2026-11-21, walking the bare rooms: "when I say it needs to be multiple stories, I'm not talking about actual stories. I'm talking about how it has stairs and whatnot to make it
// feel like it's underground"): a step of the trace's `lvl` is a short flight, STEP tiles, not a storey; the walkways lie where the old Sewers did (BASE). A channel's room lies DEEP below its
// walkways: its water is drawn below that again (js/facilitysewers.js), so the channel reads deep and not full. Levels of the dungeon's own (ids 47 to 52), so no other room's height moves.
const BASE = -1.8, STEP = 0.4, DEEP = 0.9, LV = l => 50 + l, WATER_LV = l => 40 + (l || 0);   // (a stretch of water `wl` flights up lies that much higher: the West Channel comes down with its tunnel)
// THE FLIGHTS: [upper piece, lower piece, where on their shared wall (a tile range along x or y, or null: all of it), the flight's zone (a rectangle, in tiles) and the way it runs]
const FLIGHTS = [
  { id: 'channel_steps', rooms: ['channel_steps', 'west_channel'], on: { y: [18.5, 18.5] }, zone: [9.3, 16.4, 11.7, 18.6], axis: 'y', steps: 6, wet: true },   // (THE FLOODED STAIRCASE: it runs down into the channel; nothing walks off its foot)
  { id: 'ent_n1', rooms: ['west_walk_n', 'west_walk_n2'], on: null, zone: [18.5, 13.5, 20.5, 16.5], axis: 'x', steps: 3 },   // (THE ENTRANCE TUNNEL'S TWO FLIGHTS, on each bank)
  { id: 'ent_n2', rooms: ['west_walk_n2', 'west_walk_n3'], on: null, zone: [28.5, 13.5, 30.5, 16.5], axis: 'x', steps: 3 },
  { id: 'ent_s1', rooms: ['west_walk_s', 'west_walk_s2'], on: null, zone: [18.5, 21.5, 20.5, 24.5], axis: 'x', steps: 3 },
  { id: 'ent_s2', rooms: ['west_walk_s2', 'west_walk_s3'], on: null, zone: [28.5, 21.5, 30.5, 24.5], axis: 'x', steps: 3 },
  { id: 'gallery', rooms: ['nw_gallery', 'west_walk_n'], on: { x: [9.5, 11.5] }, zone: [9.5, 11.5, 11.5, 13.5], axis: 'y', steps: 3 },
  { id: 'cell', rooms: ['west_walk_s', 'west_cell'], on: { x: [4.5, 7.5] }, zone: [4.5, 24.4, 7, 26.4], axis: 'y', steps: 5 },   // (the owner, 2026-11-21: "The room right under the main entrance tunnel is inaccessible from it. It should have access from the main entrance.")
  { id: 'hall', rooms: ['hall_stair', 'west_hall'], on: null, zone: [14.5, 25.5, 16.5, 29.5], axis: 'y', steps: 7 },
  { id: 'ring_w', rooms: ['central_walk_w_s', 'junction_ring_w'], on: null, zone: [37.2, 34.2, 40.4, 36.5], axis: 'y', steps: 3 },
  { id: 'ring_e', rooms: ['central_walk_e', 'junction_ring_e'], on: null, zone: [46.2, 34.2, 49.6, 36.4], axis: 'y', steps: 3 },
  { id: 'pur', rooms: ['pur_pass', 'junction_ring_e'], on: null, zone: [55, 44.8, 57.2, 49.2], axis: 'x', steps: 3, down: 'low' },
  { id: 'nest_w', rooms: ['junction_ring_w', 'junction_nest'], on: { x: [33.5, 33.5] }, zone: [33.5, 45.11, 35.6, 48.89], axis: 'x', steps: 3 },
  { id: 'nest_e', rooms: ['junction_ring_e', 'junction_nest'], on: { x: [52.5, 52.5] }, zone: [50.4, 45.11, 52.5, 48.89], axis: 'x', steps: 3, down: 'low' },
  { id: 'ledge', rooms: ['high_ledge', 'hl_foot'], on: { y: [23.5, 23.5] }, zone: [55, 20.6, 57.5, 23], axis: 'y', steps: 5 },
  { id: 'pool', rooms: ['low_drain', 'drain_pool'], on: null, zone: [60.5, 34.5, 62.5, 36.5], axis: 'x', steps: 3 },   // (down onto the pool's bed)
  { id: 'drain', rooms: ['central_walk_e', 'low_drain'], on: null, zone: [49.5, 34.5, 51.5, 36.5], axis: 'x', steps: 3 },
];
function build() {
  const S = SHAPES.map(s => Object.assign({}, s, { p: s.p.filter((q, i, a) => i === 0 || Math.hypot(q[0] - a[i - 1][0], q[1] - a[i - 1][1]) > 0.02) })), by = Object.fromEntries(S.map(s => [s.id, s])), J = joins();
  // every end of a shared wall is a corner of both rooms (an edge half shared with water and half with a room would be all wall: the owner, 2026-11-21, of the rail along the channel turned to a wall
  // when the steps were cut into it: "U added a wall lining the entire channel")
  for (const sh of S) { const pts = J.filter(j => j.rooms.includes(sh.id)).flatMap(j => [j.a, j.b]); let out = [];
    for (let i = 0; i < sh.p.length; i++) { const a0 = sh.p[i], a1 = sh.p[(i + 1) % sh.p.length], L = Math.hypot(a1[0] - a0[0], a1[1] - a0[1]); out.push(a0); if (L < 1e-6) continue;
      const mid = pts.map(q => ({ q, t: ((q[0] - a0[0]) * (a1[0] - a0[0]) + (q[1] - a0[1]) * (a1[1] - a0[1])) / (L * L), d: Math.abs((q[0] - a0[0]) * (a1[1] - a0[1]) - (q[1] - a0[1]) * (a1[0] - a0[0])) / L })).filter(o => o.d < 0.05 && o.t > 0.01 && o.t < 0.99).sort((x, y) => x.t - y.t);
      let last = -1; for (const o of mid) { if (o.t - last > 0.005) out.push(o.q); last = o.t; } }
    sh.p = out; }
  const wet = id => WATER.has(by[id].kind), sunk = id => wet(id) || by[id].kind === 'drain', rooms = [], interiors = [], openings = [], connections = [], ramps = [], props = [], floors = [];
  const along = (seg, j) => { const dx = seg[1][0] - seg[0][0], dy = seg[1][1] - seg[0][1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L; return [j.a, j.b].every(q => Math.abs((q[0] - seg[0][0]) * uy - (q[1] - seg[0][1]) * ux) < 0.09 && (q[0] - seg[0][0]) * ux + (q[1] - seg[0][1]) * uy > -0.09 && (q[0] - seg[0][0]) * ux + (q[1] - seg[0][1]) * uy < L + 0.09); };
  for (const s of S) {
    const n = s.p.length, kinds = [];
    for (let i = 0; i < n; i++) { const seg = [s.p[i], s.p[(i + 1) % n]];   // (a wall shared with water, or water's with a walkway: an open edge with a rail, the water in sight)
      const j = J.find(j => j.rooms.includes(s.id) && along(seg, j) && Math.hypot(seg[1][0] - seg[0][0], seg[1][1] - seg[0][1]) - j.len < 0.3 && (sunk(j.rooms[0]) || sunk(j.rooms[1]) || (j.rooms.includes('junction_nest') && j.lv[0] !== j.lv[1])));   // (water against water too: one channel running into another, nothing drawn between)
      kinds.push(s.kind === 'drain' ? 'open' : !j ? 'wall' : wet(s.id) || s.id === 'junction_nest' || s.kind === 'steps' ? 'open' : 'deck_rail'); }   /* (a drain room has no wall drawn at all: it is looked into from every side) */   // (ONE rail, the walkway's: the owner, "you don't need to have 2 or 4 sets of railings. It's one set of railing"; the water's own side of that edge draws nothing)
    rooms.push({ id: P + s.id, label: LABEL[s.id] || 'Sewers', level: wet(s.id) ? WATER_LV(s.wl) : LV(s.lvl), status: 'placed', wall_material: 'solid', interior: true, sewer_dungeon: s.kind, polygon: s.p.map(px), edge_kinds: kinds });
    interiors.push({ id: P + s.id, under: 'arena', offset: OFFSET });
    floors.push({ room: P + s.id, style: 'concrete', colour: FLOOR[s.kind] || '#59626a' });
    if (wet(s.id) || s.kind === 'drain') props.push({ id: P + s.id + '_water', room: P + s.id, shape: 'poly', poly: s.p.map(px), status: 'placed', kind: wet(s.id) ? 'river' : 'pool', sewer_dungeon: s.kind });
  }
  const open = (id, a, b, r) => { openings.push({ id: 'open_' + P + id, a: px(a), b: px(b), rooms: r.map(x => P + x), door: null, open: true, position_status: 'placed' }); };   // (open: a plain gap, no door frame drawn in it. The owner, 2026-11-22, circling a frame standing across a walkway: "Remove this dumb arc doorway")
  for (const j of J) { if (wet(j.rooms[0]) || wet(j.rooms[1]) || j.lv[0] !== j.lv[1]) continue; const id = j.rooms.join('__') + (openings.some(o => o.id === 'open_' + P + j.rooms.join('__')) ? '_2' : '');
    open(id, j.a, j.b, j.rooms); connections.push({ id: 'conn_' + P + id, rooms: j.rooms.map(x => P + x), opening: 'open_' + P + id }); }
  for (const f of FLIGHTS) { const cand = J.filter(j => f.rooms.every(r => j.rooms.includes(r)));
    const j = cand.find(j => !f.on || (f.on.x ? Math.min(j.a[0], j.b[0]) <= f.on.x[0] + 0.01 && Math.max(j.a[0], j.b[0]) >= f.on.x[1] - 0.01 && (f.on.x[0] !== f.on.x[1] || Math.abs(j.a[0] - j.b[0]) < 0.01) : Math.min(j.a[1], j.b[1]) <= f.on.y[0] + 0.01 && Math.max(j.a[1], j.b[1]) >= f.on.y[1] - 0.01 && Math.abs(j.a[1] - j.b[1]) < 0.01 && (f.id !== 'ledge' || Math.min(j.a[0], j.b[0]) <= 55.51)));
    if (!j) throw new Error('the flight ' + f.id + ' has no shared wall to stand on');
    let a = j.a, b = j.b; if (f.on && f.on.x && f.on.x[0] !== f.on.x[1]) { a = [f.on.x[0], j.a[1]]; b = [f.on.x[1], j.a[1]]; } if (f.id === 'ledge') { a = [55.5, 23.5]; b = [57.5, 23.5]; }
    const hi = LV(by[f.rooms[0]].lvl), lo = f.wet ? WATER_LV(by[f.rooms[1]].wl) : LV(by[f.rooms[1]].lvl), zA = snap([f.zone[0], f.zone[1]]), zB = snap([f.zone[2], f.zone[3]]), z = [zA[0], zA[1], zB[0], zB[1]], c = f.axis === 'x' ? [z[0], z[2]] : [z[1], z[3]];
    a = snap(a); b = snap(b); if (!f.wet) open('flight_' + f.id, a, b, f.rooms);   // (on the game's grid, as the trace is)
    // (c0 is the upper floor's end of the flight, c1 the lower's: the game reads the height from the first room to the second along the axis)
    const upFirst = f.down !== 'low', c0 = (upFirst ? c[0] : c[1]) * G, c1 = (upFirst ? c[1] : c[0]) * G;
    ramps.push({ id: 'r_' + P + f.id, rooms: f.rooms.map(x => P + x), shape: 'steps', between_levels: [hi, lo], descends_toward: P + f.rooms[1], position_status: 'placed', zone: { rect: [z[0] * G, z[1] * G, z[2] * G, z[3] * G].map(Math.round), axis: f.axis, c0: Math.round(c0), c1: Math.round(c1), steps: f.steps } });
    if (!f.wet) connections.push({ id: 'conn_' + P + 'flight_' + f.id, rooms: f.rooms.map(x => P + x), opening: 'open_' + P + 'flight_' + f.id, ramp: 'r_' + P + f.id }); }
  // THE CHANNEL'S SHAPE: AN INVERTED TRAPEZOID (the owner, 2026-11-22: "The shape of the channel should be like a inverted trapezoid"): each side of a channel slopes in from its walkway's edge down to the
  // bed, BANK tiles across (the bed between them narrower than the top). A slope along every straight edge a walkway shares with its water, the ring's and the landing's too; not at the flooded steps.
  const BANK = 1.5; let nb = 0;
  for (const j of J) { const w = wet(j.rooms[0]) ? j.rooms[0] : wet(j.rooms[1]) ? j.rooms[1] : null, d = w === j.rooms[0] ? j.rooms[1] : j.rooms[0]; if (!w || wet(d) || by[d].kind === 'steps' || j.len < 2) continue;
    const horiz = Math.abs(j.a[1] - j.b[1]) < 0.01, vert = Math.abs(j.a[0] - j.b[0]) < 0.01; if (!horiz && !vert) continue;
    const cx = by[w].p.reduce((t, q) => t + q[0], 0) / by[w].p.length, cy = by[w].p.reduce((t, q) => t + q[1], 0) / by[w].p.length, hi = LV(by[d].lvl), lo = WATER_LV(by[w].wl); if (hi === lo) continue;
    let rect, c0, c1; if (horiz) { const y = j.a[1], sg = cy > y ? 1 : -1; rect = [Math.min(j.a[0], j.b[0]), Math.min(y, y + sg * BANK), Math.max(j.a[0], j.b[0]), Math.max(y, y + sg * BANK)]; c0 = y; c1 = y + sg * BANK; }
    else { const x = j.a[0], sg = cx > x ? 1 : -1; rect = [Math.min(x, x + sg * BANK), Math.min(j.a[1], j.b[1]), Math.max(x, x + sg * BANK), Math.max(j.a[1], j.b[1])]; c0 = x; c1 = x + sg * BANK; }
    ramps.push({ id: 'r_' + P + 'bank_' + (++nb), rooms: [P + d, P + w], shape: 'slope', between_levels: [hi, lo], descends_toward: P + w, position_status: 'placed', zone: { rect: rect.map(v => Math.round(v * G)), axis: horiz ? 'y' : 'x', c0: Math.round(c0 * G), c1: Math.round(c1 * G) } }); }
  for (const v of VALVES) props.push({ id: P + v.id, room: P + v.room, shape: 'rect', rect: [(v.at[0] - 0.5) * G, (v.at[1] - 0.5) * G, (v.at[0] + 0.5) * G, (v.at[1] + 0.5) * G], status: 'placed', kind: 'valve', note: v.note });   // (the game's own valve housing, till the approved drain valve's model is in: docs/SEWER-PROPS.md)
  const levels = [0, 1, 2].map(l => ({ id: WATER_LV(l), label: 'sewer channel ' + l, height: +(BASE + l * STEP - DEEP).toFixed(2) })).concat([-2, -1, 0, 1, 2, 3].map(l => ({ id: LV(l), label: 'sewer ' + l, height: +(BASE + l * STEP).toFixed(2) })));
  return { levels, rooms, interiors, openings, connections, ramps, props, floors };
}
function text() { const M = build(), line = o => '        ' + JSON.stringify(o);
  return '// GENERATED by tools/sewerdungeon.js from design/sewer-dungeon/trace.js (docs/SEWER-DUNGEON.md): the sewer dungeon\'s rooms, doorways, flights and water. Do not edit: change the trace and run the tool.\n'
    + 'const SEWER_DUNGEON_MAP = {\n' + Object.keys(M).map(k => '    ' + k + ': [\n' + M[k].map(line).join(',\n') + '\n    ]').join(',\n') + '\n};\n'; }
module.exports = { build, text, OUT: 'js/sewerdungeonmap.js' };
if (require.main === module) { const t = text(); fs.writeFileSync(path.join(ROOT, 'js/sewerdungeonmap.js'), t); const M = build(); console.log('js/sewerdungeonmap.js:', M.rooms.length, 'rooms,', M.openings.length, 'doorways,', M.ramps.length, 'flights,', M.props.length, 'waters and valves'); }
