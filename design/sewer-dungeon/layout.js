// THE SEWER DUNGEON'S TILE PLAN (docs/SEWER-DUNGEON.md §2): the owner's skeleton (skeleton-2026-11-20.png) laid on tiles, 90 across by 60 down (the owner, 2026-11-21: "Wider than tall, like the picture"), north up. The agent's reading of a picture
// that says of itself "rough skeleton, not final room-by-room": every measure here is provisional. node layout.js writes plan.html (both water levels) for a picture; the game's map is made
// from the same table when the plan is approved.
// A place: [x0, y0, x1, y1] in tiles, inclusive. kind: floor (a room), walk (a walkway or a passage), water (a channel: nothing walks in it), drain (under water at HIGH, floor at LOW),
// upper (a floor a storey up), round (the junction: a disc, [cx, cy, r])
const PLACES = [
  { id: 'central_channel', label: 'CENTRAL CHANNEL', kind: 'water', r: [44, 2, 49, 36] },
  { id: 'central_walk_w', kind: 'walk', r: [41, 2, 43, 36] }, { id: 'central_walk_e', kind: 'walk', r: [50, 2, 52, 36] },
  { id: 'west_channel', label: 'WEST CHANNEL', kind: 'water', r: [5, 14, 43, 17] },
  { id: 'west_walk_n', kind: 'walk', r: [5, 11, 40, 13] }, { id: 'west_walk_s', kind: 'walk', r: [5, 18, 40, 20] },
  { id: 'west_entrance', label: 'WEST ENTRANCE', kind: 'walk', r: [2, 11, 4, 20] },
  { id: 'round_junction', label: 'ROUND JUNCTION · TOXIC NEST / QUEEN', kind: 'round', c: [47, 45, 9] },
  { id: 'nw_wing', label: 'NORTHWEST WING', kind: 'floor', r: [8, 2, 36, 8] }, { id: 'nw_pass', kind: 'walk', r: [20, 9, 22, 10], door: 'secret door' },
  { id: 'west_hall', label: 'WEST HALL', kind: 'floor', r: [6, 24, 30, 33] }, { id: 'wh_pass', kind: 'walk', r: [14, 21, 16, 23] },
  { id: 'sw_storage', label: 'SOUTHWEST STORAGE', kind: 'floor', r: [14, 38, 32, 46] }, { id: 'sw_pass_n', kind: 'walk', r: [20, 34, 22, 37] }, { id: 'sw_pass_e', kind: 'walk', r: [33, 44, 37, 46] },
  { id: 'subway_exit', label: 'SUBWAY EXIT', kind: 'floor', r: [14, 52, 24, 58] }, { id: 'subway_pass', kind: 'walk', r: [18, 47, 20, 51], door: 'locked: the channel-bed key' },
  { id: 'ne_offices', label: 'NORTHEAST OFFICES', kind: 'floor', r: [58, 2, 84, 9] }, { id: 'ne_pass', kind: 'walk', r: [53, 5, 57, 7], door: 'locked door' }, { id: 'ne_crack', kind: 'walk', r: [68, 10, 70, 12], door: 'cracked wall' },
  { id: 'high_ledge', label: 'HIGH LEDGE ROOM', kind: 'upper', r: [58, 13, 82, 21] }, { id: 'hl_pass', kind: 'walk', r: [53, 16, 57, 18], door: 'Kinetic Launcher' },
  { id: 'east_rubble', label: 'EAST RUBBLE', kind: 'floor', r: [58, 25, 84, 31] }, { id: 'er_pass', kind: 'walk', r: [53, 27, 57, 29], door: 'rubble' },
  { id: 'low_drain', label: 'LOW DRAIN TUNNEL', kind: 'drain', r: [53, 33, 80, 35] }, { id: 'low_drain_n', kind: 'drain', r: [78, 32, 80, 32] },
  { id: 'purification', label: 'PURIFICATION CHAMBER', kind: 'floor', r: [68, 40, 84, 50] }, { id: 'pur_pass', kind: 'walk', r: [57, 44, 67, 46] },
];
const MARKS = [{ at: [22, 15], label: 'channel-bed key' }, { at: [3, 15], label: 'from the Arena' }, { at: [38, 12], label: 'water panel' }, { at: [51, 35], label: 'water panel' }];
const W = 90, H = 60;
function cells() { const g = []; for (let y = 0; y < H; y++) g.push(new Array(W).fill(null));
  for (const p of PLACES) { if (p.kind === 'round') { const [cx, cy, r] = p.c; for (let y = cy - r; y <= cy + r; y++) for (let x = cx - r; x <= cx + r; x++) if (Math.hypot(x - cx, y - cy) <= r + 0.3 && !g[y][x]) g[y][x] = p; }
    else { const [x0, y0, x1, y1] = p.r; for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) g[y][x] = p; } }
  return g; }
module.exports = { PLACES, MARKS, W, H, cells };
if (require.main === module) {
  const g = cells(), T = 12, COL = { floor: '#4a4f57', walk: '#6b6f52', upper: '#7a6a3a', round: '#5a2a6a' };
  const board = level => { let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W * T}" height="${H * T}" style="background:#0b0f16">`;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const p = g[y][x]; if (!p) continue; const c = p.kind === 'water' ? (level === 'HIGH' ? '#1fb6c9' : '#0f5560') : p.kind === 'drain' ? (level === 'HIGH' ? '#1fb6c9' : '#3d5a52') : COL[p.kind]; s += `<rect x="${x * T}" y="${y * T}" width="${T - 0.6}" height="${T - 0.6}" fill="${c}"/>`; }
    for (const p of PLACES) { if (p.label) { const [x, y] = p.kind === 'round' ? [p.c[0], p.c[1]] : [(p.r[0] + p.r[2] + 1) / 2, (p.r[1] + p.r[3] + 1) / 2]; s += `<text x="${x * T}" y="${y * T}" fill="#fff" font-size="11" font-family="sans-serif" font-weight="700" text-anchor="middle">${p.label}</text>`; }
      if (p.door) s += `<text x="${(p.r[2] + 1.4) * T}" y="${(p.r[1] + p.r[3] + 1) / 2 * T + 3}" fill="#ffd34a" font-size="10" font-family="sans-serif">${p.door}</text>`; }
    for (const m of MARKS) s += `<circle cx="${(m.at[0] + .5) * T}" cy="${(m.at[1] + .5) * T}" r="4" fill="#ffd34a"/><text x="${(m.at[0] + 1.4) * T}" y="${(m.at[1] + .9) * T}" fill="#ffd34a" font-size="10" font-family="sans-serif">${m.label}</text>`;
    return s + '</svg>'; };
  require('fs').writeFileSync(__dirname + '/plan.html', `<body style="margin:0;background:#0b0f16;color:#fff;font-family:sans-serif"><div style="display:flex;gap:24px;padding:16px">${['LOW', 'HIGH'].map(l => `<div><h3 style="margin:0 0 8px">Water ${l}${l === 'LOW' ? ' (as you enter)' : ''}</h3>${board(l)}</div>`).join('')}</div><p style="padding:0 16px 16px;margin:0;font-size:13px">90 × 60 tiles, north up. Grey: rooms. Olive: walkways and passages. Gold: the upper floor. Purple: the Round Junction's dam. Teal: water (nothing walks in it). The Low Drain Tunnel is floor at LOW and under water at HIGH.</p></body>`);
  console.log('plan.html written;', g.flat().filter(Boolean).length, 'tiles');
}
