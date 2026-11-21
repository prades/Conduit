// THE SEWER DUNGEON'S TILE PLAN (docs/SEWER-DUNGEON.md §2): the owner's skeleton (skeleton-2026-11-20.png) laid on tiles, 60 across by 90 down, north up. The agent's reading of a picture
// that says of itself "rough skeleton, not final room-by-room": every measure here is provisional. node layout.js writes plan.html (both water levels) for a picture; the game's map is made
// from the same table when the plan is approved.
// A place: [x0, y0, x1, y1] in tiles, inclusive. kind: floor (a room), walk (a walkway or a passage), water (a channel: nothing walks in it), drain (under water at HIGH, floor at LOW),
// upper (a floor a storey up), round (the junction: a disc, [cx, cy, r])
const PLACES = [
  { id: 'central_channel', label: 'CENTRAL CHANNEL', kind: 'water', r: [27, 2, 32, 57] },
  { id: 'central_walk_w', kind: 'walk', r: [24, 2, 26, 57] }, { id: 'central_walk_e', kind: 'walk', r: [33, 2, 35, 57] },
  { id: 'west_channel', label: 'WEST CHANNEL', kind: 'water', r: [5, 26, 26, 29] },
  { id: 'west_walk_n', kind: 'walk', r: [5, 23, 23, 25] }, { id: 'west_walk_s', kind: 'walk', r: [5, 30, 23, 32] },
  { id: 'west_entrance', label: 'WEST ENTRANCE', kind: 'walk', r: [2, 23, 4, 32] },
  { id: 'round_junction', label: 'ROUND JUNCTION · TOXIC NEST / QUEEN', kind: 'round', c: [30, 67, 9] },
  { id: 'nw_wing', label: 'NORTHWEST WING', kind: 'floor', r: [4, 4, 20, 15] }, { id: 'nw_pass', kind: 'walk', r: [10, 16, 12, 22], door: 'secret door' },
  { id: 'west_hall', label: 'WEST HALL', kind: 'floor', r: [4, 37, 18, 50] }, { id: 'wh_pass', kind: 'walk', r: [8, 33, 10, 36] },
  { id: 'sw_storage', label: 'SOUTHWEST STORAGE', kind: 'floor', r: [6, 56, 18, 66] }, { id: 'sw_pass_n', kind: 'walk', r: [10, 51, 12, 55] }, { id: 'sw_pass_e', kind: 'walk', r: [19, 64, 21, 66] },
  { id: 'subway_exit', label: 'SUBWAY EXIT', kind: 'floor', r: [7, 78, 15, 86] }, { id: 'subway_pass', kind: 'walk', r: [10, 67, 12, 77], door: 'locked: the channel-bed key' },
  { id: 'ne_offices', label: 'NORTHEAST OFFICES', kind: 'floor', r: [40, 4, 56, 15] }, { id: 'ne_pass', kind: 'walk', r: [36, 8, 39, 10], door: 'locked door' }, { id: 'ne_crack', kind: 'walk', r: [46, 16, 48, 21], door: 'cracked wall' },
  { id: 'high_ledge', label: 'HIGH LEDGE ROOM', kind: 'upper', r: [40, 22, 54, 34] }, { id: 'hl_pass', kind: 'walk', r: [36, 27, 39, 29], door: 'Kinetic Launcher' },
  { id: 'east_rubble', label: 'EAST RUBBLE', kind: 'floor', r: [40, 38, 54, 48] }, { id: 'er_pass', kind: 'walk', r: [36, 42, 39, 44], door: 'rubble' },
  { id: 'low_drain', label: 'LOW DRAIN TUNNEL', kind: 'drain', r: [36, 52, 52, 55] }, { id: 'low_drain_n', kind: 'drain', r: [50, 49, 52, 51] },
  { id: 'purification', label: 'PURIFICATION CHAMBER', kind: 'floor', r: [45, 62, 56, 72] }, { id: 'pur_pass', kind: 'walk', r: [40, 66, 44, 68] },
];
const MARKS = [{ at: [15, 27], label: 'channel-bed key' }, { at: [3, 27], label: 'from the Arena' }, { at: [22, 24], label: 'water panel' }, { at: [34, 56], label: 'water panel' }];
const W = 60, H = 90;
function cells() { const g = []; for (let y = 0; y < H; y++) g.push(new Array(W).fill(null));
  for (const p of PLACES) { if (p.kind === 'round') { const [cx, cy, r] = p.c; for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (Math.hypot(x - cx, y - cy) <= r + 0.3 && !g[y][x]) g[y][x] = p; }
    else { const [x0, y0, x1, y1] = p.r; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = p; } }
  return g; }
module.exports = { PLACES, MARKS, W, H, cells };
if (require.main === module) {
  const g = cells(), T = 9, COL = { floor: '#4a4f57', walk: '#6b6f52', upper: '#7a6a3a', round: '#5a2a6a' };
  const board = level => { let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * T}" height="${H * T}" style="background:#0b0f16">`;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = g[y][x]; if (!p) continue; const c = p.kind === 'water' ? (level === 'HIGH' ? '#1fb6c9' : '#0f5560') : p.kind === 'drain' ? (level === 'HIGH' ? '#1fb6c9' : '#3d5a52') : COL[p.kind]; s += `<rect x="${x * T}" y="${y * T}" width="${T - 0.6}" height="${T - 0.6}" fill="${c}"/>`; }
    for (const p of PLACES) { if (p.label) { const [x, y] = p.kind === 'round' ? [p.c[0], p.c[1]] : [(p.r[0] + p.r[2] + 1) / 2, (p.r[1] + p.r[3] + 1) / 2]; s += `<text x="${x * T}" y="${y * T}" fill="#fff" font-size="9" font-family="sans-serif" font-weight="700" text-anchor="middle">${p.label}</text>`; }
      if (p.door) s += `<text x="${(p.r[2] + 1.4) * T}" y="${(p.r[1] + p.r[3] + 1) / 2 * T + 3}" fill="#ffd34a" font-size="8" font-family="sans-serif">${p.door}</text>`; }
    for (const m of MARKS) s += `<circle cx="${(m.at[0] + .5) * T}" cy="${(m.at[1] + .5) * T}" r="4" fill="#ffd34a"/><text x="${(m.at[0] + 1.4) * T}" y="${(m.at[1] + .9) * T}" fill="#ffd34a" font-size="8" font-family="sans-serif">${m.label}</text>`;
    return s + '</svg>'; };
  require('fs').writeFileSync(__dirname + '/plan.html', `<body style="margin:0;background:#0b0f16;color:#fff;font-family:sans-serif"><div style="display:flex;gap:24px;padding:16px">${['LOW', 'HIGH'].map(l => `<div><h3 style="margin:0 0 8px">Water ${l}${l === 'LOW' ? ' (as you enter)' : ''}</h3>${board(l)}</div>`).join('')}</div><p style="padding:0 16px 16px;margin:0;font-size:13px">60 × 90 tiles, north up. Grey: rooms. Olive: walkways and passages. Gold: the upper floor. Purple: the Round Junction's dam. Teal: water (nothing walks in it). The Low Drain Tunnel is floor at LOW and under water at HIGH.</p></body>`);
  console.log('plan.html written;', g.flat().filter(Boolean).length, 'tiles');
}
