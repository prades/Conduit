// THE LAB FLOOR (design/style-evolution/live; the live test page, lab3d/, not the game). The owner, 2026-11-16, asked what to see next in the 3D test page: "Walk the lab floor".
// The eight rooms of the lab's ground floor in the look of picture 1, from the game's own map (round2/export.js --lab). Each room's floor marks, wall fittings and props are
// round 2's room builder (chamber.js buildRoom); what is built here is ONE SHELL for all of them:
//   THE WALLS   the game spaces its rooms a tile apart and that gap is the wall (js/facilityplay.js FP_WALL_T). Here every tile of the gap is a block a tile thick: one wall between
//               two rooms. A block knows which rooms it stands in front of, seen from the camera's side (the rooms to its north and west). The blocks in front of the same rooms are
//               one piece, and it SINKS INTO THE FLOOR when one of those rooms is opened (the viewer opens the room you are in), leaving a cut stub: picture 1's cut-down near walls.
//               Where two rooms touch with no gap the wall is thin: glass (a sill, a pane, a rail, posts) or a solid divider (the Lounge's south side).
//   THE DOORS   stand in the middle of the wall's thickness, slid open, and the wall goes on over them. The door out to the deck is shut; the arena's, where a raid comes up, is
//               open onto a dark apron; the stairs' open mouths end in a dark apron too. None of what lies beyond is built here.
//   THE FLOORS  a square a tile, each room in its own two tile colours (the game's FP_ROOM_STYLE); the Lounge is wood and the narrow passage a grate.
// It also says WHERE ONE CAN WALK: the rooms' tiles, less the props' footprints and the Crystal's pad; a thin wall stops a step across it.
// In scope: T, the kit, chamber.js (roomOf, buildRoom, PAL, WALL_H, CUT_H, DOOR_H, UH, cellKey, at3, setShadows, rodBetween) and `map.lab` (the rooms and the openings).

const hexMix = (a, b, t) => '#' + new T.Color(a).lerp(new T.Color(b), t).getHexString();
const seedOf = s => { let h = 7; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };

// ── quads, gathered and made one mesh (a material a list) ──
function quads() { return { pos: [], nor: [], uv: [], col: [] }; }
function putQuad(q, a, b, c, d, n, col, uv) { const U = uv || [[0, 0], [1, 0], [1, 1], [0, 1]], P = [a, b, c, d]; for (const i of [0, 1, 2, 0, 2, 3]) { q.pos.push(P[i][0], P[i][1], P[i][2]); q.nor.push(n[0], n[1], n[2]); q.uv.push(U[i][0], U[i][1]); q.col.push(col[0], col[1], col[2]); } }
// the side of a tile's block that faces (dx, dy), from y0 up to y1, seen from outside; `half`: how far that side is from the tile's middle (0.5: the tile's edge)
function sideQuad(q, x, y, dx, dy, y0, y1, col, v0, v1, half) { const h = half === undefined ? 0.5 : half, cx = x + dx * h, cz = y + dy * h, rx = dy / 2, rz = -dx / 2;
  putQuad(q, [cx - rx, y0, cz - rz], [cx + rx, y0, cz + rz], [cx + rx, y1, cz + rz], [cx - rx, y1, cz - rz], [dx, 0, dy], col, [[0, v0], [1, v0], [1, v1], [0, v1]]); }
function topQuad(q, x, y, h, col, sx, sz) { sx = sx === undefined ? 0.5 : sx; sz = sz === undefined ? sx : sz; putQuad(q, [x - sx, h, y + sz], [x + sx, h, y + sz], [x + sx, h, y - sz], [x - sx, h, y - sz], [0, 1, 0], col); }
function quadMesh(parts) { const pos = [], nor = [], uv = [], col = [], geo = new T.BufferGeometry(), mats = []; let n = 0;
  parts.forEach((p, i) => { for (const v of p.q.pos) pos.push(v); for (const v of p.q.nor) nor.push(v); for (const v of p.q.uv) uv.push(v); for (const v of p.q.col) col.push(v); geo.addGroup(n, p.q.pos.length / 3, i); n += p.q.pos.length / 3; mats.push(p.mat); });
  geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new T.Float32BufferAttribute(nor, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); return new T.Mesh(geo, mats); }

// ── the floors' pictures: the Lounge's boards, the passage's grate (the plate is the chamber's own tile, chamber.js floorTexture) ──
function plankTexture(fa, fb) { return canvasTex(256, 256, (g, w, h) => { const rows = 4, ph = h / rows; for (let r = 0; r < rows; r++) { const off = (r * 97) % w; for (let k = 0; k < 2; k++) { const x0 = (off + k * w / 2) % w, t = ((r * 5 + k * 3) % 4) / 3;
      g.fillStyle = hexMix(fa, fb, 0.25 + t * 0.6); g.fillRect(x0, r * ph, w / 2, ph); if (x0 + w / 2 > w) g.fillRect(x0 - w, r * ph, w / 2, ph); g.fillStyle = 'rgba(70,40,30,0.3)'; g.fillRect(x0, r * ph, 2, ph); }
    g.fillStyle = 'rgba(70,40,30,0.32)'; g.fillRect(0, r * ph, w, 2); g.fillStyle = 'rgba(255,255,255,0.22)'; g.fillRect(0, r * ph + 2, w, 1.5); } }, { repeat: true }); }
function grateTexture(fa, fb) { return canvasTex(128, 128, (g, w, h) => { g.fillStyle = hexMix(fa, fb, 0.5); g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(22,48,58,0.55)'; for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { g.beginPath(); const x = 10 + i * 30, y = 8 + j * 30; g.moveTo(x + 4, y); g.lineTo(x + 14, y); g.arcTo(x + 18, y, x + 18, y + 4, 4); g.lineTo(x + 18, y + 12); g.arcTo(x + 18, y + 16, x + 14, y + 16, 4); g.lineTo(x + 4, y + 16); g.arcTo(x, y + 16, x, y + 12, 4); g.lineTo(x, y + 4); g.arcTo(x, y, x + 4, y, 4); g.fill(); }
    g.strokeStyle = 'rgba(60,110,125,0.45)'; g.lineWidth = 3; g.strokeRect(0, 0, w, h); }); }

// ── the other rooms' wall fittings (the chamber has none of these), after the game's styled drawing of each (js/facilitystyleall.js FP_STYLE_WALL): flat shapes on the wall ──
function moreFittings(P, acc) {
  const box = (w, h, d, mat) => new T.Mesh(new T.BoxGeometry(w, h, d), mat), glow = (w, h, hex, k) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), glowMat(hex, k === undefined ? 1 : k)); m.userData.noInk = true; return m; };
  const paint = hex => std(hex, { roughness: 0.6 });
  return function (d, w, h) { const gp = new T.Group(), seed = seedOf(String(d.id)), add = (m, x, y, z) => gp.add(h.at3(m, x, y, z || 0));
    if (d.kind === 'poster') { const pal = [[PAL.teal, PAL.cap], [PAL.violet, PAL.cap], [PAL.blue, '#ffffff'], ['#43e0a8', PAL.ink], [PAL.amber, PAL.ink]][seed % 5]; add(box(0.76, 0.52, 0.03, P.frame), 0, 0); add(box(0.64, 0.4, 0.034, paint(pal[0])), 0, 0); add(box(0.48, 0.06, 0.038, paint(pal[1])), 0, 0.11); add(box(0.34, 0.035, 0.038, paint(pal[1])), -0.07, 0.03); h.onWall(w, h.tm, 0.98, 0.016, setShadows(gp)); }
    else if (d.kind === 'board') { const L = h.len * 0.88; add(box(L, 0.46, 0.03, P.frame), 0, 0); [PAL.cyan, PAL.violet, PAL.amber, '#43e0a8'].forEach((c, k) => add(box(L * 0.12, 0.14, 0.036, paint(c)), -L / 2 + L * (0.12 + ((seed >>> k) % 6) * 0.13), -0.12 + ((seed >>> (k + 3)) % 3) * 0.12)); h.onWall(w, h.tm, 1.0, 0.016, setShadows(gp)); }
    else if (d.kind === 'exit_sign') { add(box(0.6, 0.15, 0.05, P.graphite), 0, 0); add(glow(0.46, 0.07, '#43e0a8', 0.95), 0, 0, 0.027); h.onWall(w, h.tm, WALL_H - 0.12, 0.026, setShadows(gp)); }
    else if (d.kind === 'graffiti') { const m = paint(acc); for (let k = 0; k < 5; k++) { const s = (seed >>> k) % 3, b = box(0.055, 0.3 - s * 0.05, 0.012, m); b.rotation.z = -0.3; add(b, (-0.36 + k * 0.18) * h.len / 2, s * 0.03); } h.onWall(w, h.tm, 0.72, 0.008, gp); }
    else if (d.kind === 'cable_run') { [PAL.cyan, PAL.violet, PAL.blue].forEach((c, k) => { const x = (0.15 + k * 0.28 - 0.5) * h.len, y1 = 0.45 + k * 0.12, m = paint(c), pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([x + t * t * 0.14 * h.len, WALL_H - 0.04 - (WALL_H - 0.04 - y1) * (1 - (1 - t) * (1 - t)), 0.02]); } for (let i = 0; i + 1 < pts.length; i++) gp.add(rodBetween(pts[i], pts[i + 1], 0.022, m, 6)); }); h.onWall(w, h.tm, 0, 0.012, setShadows(gp)); }
    else if (d.kind === 'monitor_bank') { const cols = Math.max(1, Math.round(h.len / 0.95)), rows = 3, cw = h.len / cols, rh = 0.4, feed = ['#0c3140', '#12324a', '#183a30', '#2a3340', '#0e2a38']; add(box(h.len - 0.02, rows * rh + 0.08, 0.05, P.tealDk), 0, 0);
      for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) { const k = (seed + r * 5 + c * 3) % 7, x = -h.len / 2 + (c + 0.5) * cw, y = (r - 1) * rh; add(glow(cw * 0.86, rh - 0.06, feed[k % 5], 1.6), x, y, 0.027); if (k < 5) add(glow(cw * 0.5, 0.05, k % 2 ? '#6adfff' : '#3a7bff', 0.9), x - cw * 0.1, y + 0.08 - (k % 3) * 0.07, 0.029); if (k === 2) add(glow(cw * 0.16, 0.16, '#f2b13a', 0.9), x + cw * 0.26, y - 0.06, 0.029); }
      h.onWall(w, h.tm, 1.0, 0.026, setShadows(gp)); }
    else if (d.kind === 'portal_door') { const L = h.len, col = d.colour || PAL.amber; add(box(L - 0.04, 1.36, 0.08, P.tealDk), 0, 0.68); const dark = new T.Mesh(new T.PlaneGeometry(L * 0.82, 1.14), glowMat('#04070d', 1)); dark.userData.noInk = true; add(dark, 0, 0.6, 0.042);
      for (const s of [-1, 1]) add(glow(0.035, 1.14, col, 0.95), s * L * 0.41, 0.6, 0.044); add(glow(L * 0.82, 0.035, col, 0.95), 0, 1.17, 0.044); add(glow(L * 0.5, 0.07, col, 0.8), 0, 1.27, 0.044); h.onWall(w, h.tm, 0, 0.041, setShadows(gp)); }
  };
}

// ── THE LAB FLOOR ──
// how.live (the game's own view, view3d/gameview.js):
//   every door's two leaves are made whole and can slide (door.leaves, door.set(k): 0 shut, 1 open): the game's doors open and shut as someone comes near; no door is the raid's
//   rooms on many levels: a tile stands at its own height (a cell [x, y, h], h in the game's px of height: a room's floor, a staircase's treads), with the risers between; a room's
//   things stand on its floor (rec.base, px); a wall's block stands from the lowest floor beside it to a wall's height over the highest (as the game's: js/facilityplay.js base2),
//   its stub over the highest; a door on its floor; and a deck's railing (a wall of kind deck_rail or railing_wall) is a railing, not a wall
//   a ROCK wall (the arena's, kind rock) is a block of layered rock in sand, after the owner's reference picture (below; a draft: ?draft=arena, docs/VIEW-3D.md); a wall facing a
//   dark room (the arena's style) is dark; a ledge between two floors (the catwalk spur's over the arena) has no wall over it, its railing on the higher floor
function buildLabFloor(lab, P0, how) {
  const live = !!(how && how.live), liveDoors = live, g = new T.Group(), rest = new T.Group(), recs = lab.rooms, rooms = {}, roomAt = new Map(), K = cellKey, DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]], WHITE = [1, 1, 1], vD = DOOR_H / WALL_H;
  const B0 = live ? -0.5 : -0.12, cellH = new Map();   // (B0: how far under the floor a wall's face and a floor's edge go; cellH: a tile higher or lower than its room, in world units)
  g.add(rest);   // (what belongs to no one room: the stubs, the aprons, the ground)
  for (const rec of recs) { rooms[rec.id] = { id: rec.id, rec, R: roomOf(rec), g: new T.Group(), label: rec.label || rec.id, style: rec.style || { acc: PAL.cyan, wain: PAL.wallBase, fa: PAL.floorA, fb: PAL.floorB } }; g.add(rooms[rec.id].g); for (const c of rec.cells) { roomAt.set(K(c[0], c[1]), rec.id); if (live && c[2]) cellH.set(K(c[0], c[1]), c[2] / UH); } }
  const hAt = (x, y) => cellH.get(K(x, y)) || 0, baseOf = id => live && rooms[id] ? (rooms[id].rec.base || 0) / UH : 0;
  let minH = 0; for (const v of cellH.values()) minH = Math.min(minH, v);   // (the lowest floor: what stands over the void goes down past it)
  const at = (x, y) => roomAt.get(K(Math.round(x), Math.round(y))) || null;

  // the walls: a block a tile of the gap between rooms (band), or a thin wall on the line where two rooms touch (thin)
  const band = new Map(), thin = [], thinSeen = new Set(), rails = [];
  for (const rec of recs) { const R = rooms[rec.id].R; rec.walls.forEach((w0, wi) => { if (w0.kind === 'open') return; const w = R.WALLS[wi]; if (live && (w0.kind === 'deck_rail' || w0.kind === 'railing_wall')) { rails.push({ w, room: rec.id }); return; }
    for (let i = 0, n = Math.round(w.L); i < n; i++) { const m = [w.a[0] + w.u[0] * (i + 0.5), w.a[1] + w.u[1] * (i + 0.5)], bx = Math.round(m[0] + w.n[0] * 0.5), by = Math.round(m[1] + w.n[1] * 0.5);
      if (roomAt.has(K(bx, by))) { const k = m[0] + ',' + m[1]; if (!thinSeen.has(k)) { thinSeen.add(k); thin.push({ m, u: [Math.abs(w.u[0]), Math.abs(w.u[1])], glass: !!w0.window && !w0.divider }); } }
      else if (!band.has(K(bx, by))) band.set(K(bx, by), { x: bx, y: by, own: rec.id, rock: live && w0.kind === 'rock' }); } }); }
  for (const rec of recs) for (const c of rec.cells) for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const k = K(c[0] + sx, c[1] + sy); if (band.has(k) || roomAt.has(k)) continue; if (band.has(K(c[0] + sx, c[1])) && band.has(K(c[0], c[1] + sy))) band.set(k, { x: c[0] + sx, y: c[1] + sy, own: rec.id, rock: band.get(K(c[0] + sx, c[1])).rock && band.get(K(c[0], c[1] + sy)).rock }); }   // (a corner piece where a room turns outwards)

  // the openings: a door stands in its tunnel through the wall (the side of the line where wall stands at both its ends), or on the line itself in a thin wall
  const doors = [], aprons = new Map();
  for (const o0 of lab.openings) { const flip = (o0.b[0] - o0.a[0]) + (o0.b[1] - o0.a[1]) < 0, o = { id: o0.id, door: o0.door, a: flip ? o0.b : o0.a, b: flip ? o0.a : o0.b };   // (a to b towards +x or +y, so a door's own axes are always the same way round)
    const dx = o.b[0] - o.a[0], dy = o.b[1] - o.a[1], L = Math.round(Math.hypot(dx, dy)), u = [dx / L, dy / L], nr = [u[1], -u[0]], m = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2];
    const rA = at(m[0] + nr[0] * 0.5 - u[0] * 0.01, m[1] + nr[1] * 0.5 - u[1] * 0.01), rB = at(m[0] - nr[0] * 0.5 - u[0] * 0.01, m[1] - nr[1] * 0.5 - u[1] * 0.01); if ((!rA && !rB) || (rA && rB && !o.door)) continue;   // (two rooms open to each other: nothing stands there)
    const end = (s, k, e) => { const p = e < 0 ? o.a : o.b; return K(Math.round(p[0] + u[0] * e * 0.5 + nr[0] * s * (k - 0.5)), Math.round(p[1] + u[1] * e * 0.5 + nr[1] * s * (k - 0.5))); };
    const depth = s => { let k = 0; while (k < 8 && band.has(end(s, k + 1, -1)) && band.has(end(s, k + 1, 1))) k++; return k; }, dA = depth(1), dB = depth(-1), side = dA && (!dB || dA <= dB) ? 1 : dB ? -1 : 0;
    const out = !rA ? 1 : !rB ? -1 : 0, kind = !o.door ? 'mouth' : !out ? 'open' : o.id === 'door_arena_hallway' && !live ? 'raid' : 'shut', cellOf = (i, s, k) => [Math.round(o.a[0] + u[0] * (i + 0.5) + nr[0] * s * (k - 0.5)), Math.round(o.a[1] + u[1] * (i + 0.5) + nr[1] * s * (k - 0.5))];
    const hA = rA ? hAt(Math.round(m[0] + nr[0] * 0.5 - u[0] * 0.01), Math.round(m[1] + nr[1] * 0.5 - u[1] * 0.01)) : -1e9, hB = rB ? hAt(Math.round(m[0] - nr[0] * 0.5 - u[0] * 0.01), Math.round(m[1] - nr[1] * 0.5 - u[1] * 0.01)) : -1e9;
    const d = { id: o.id, kind, L, u, nr, m, side, out, room: rA || rB, rooms: [rA, rB], c: [m[0] + nr[0] * side * 0.5, m[1] + nr[1] * side * 0.5], over: [], h: Math.max(hA, hB) };   // (h: its floor)
    if (o.door && side) for (let i = 0; i < L; i++) { const c = cellOf(i, side, 1), b = { x: c[0], y: c[1], own: d.room, header: true }; band.set(K(c[0], c[1]), b); d.over.push(b); }   // (the wall goes on over the door)
    if (out) for (let k = 1, n = kind === 'raid' ? 3 : kind === 'shut' && !liveDoors ? 1 : 2; k <= n; k++) for (let i = 0; i < L; i++) { const c = cellOf(i, out, k); if (!roomAt.has(K(c[0], c[1]))) aprons.set(K(c[0], c[1]), { x: c[0], y: c[1], h: d.h }); }
    doors.push(d); }

  // a rock block a door or a sign hangs on (a room's wall decor, from end to end) stays flat, so the thing sits flush on it
  if (live) for (const rec of recs) for (const d of rec.decor || []) { if (!d.a || !d.b) continue; const L = Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1]); for (let i = 0; i <= Math.ceil(L * 2); i++) { const t = L ? i / Math.ceil(L * 2) : 0, px = d.a[0] + (d.b[0] - d.a[0]) * t, py = d.a[1] + (d.b[1] - d.a[1]) * t;
      for (const [ox, oy] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) { const b = band.get(K(Math.round(px + ox), Math.round(py + oy))); if (b && b.rock) b.flat = true; } } }

  // which rooms a block stands in front of (seen from the camera's side), and the pieces that sink together
  const hideOf = (x, y) => { const s = []; for (const [dx, dy] of [[0, -1], [-1, 0], [-1, -1]]) { const r = roomAt.get(K(x + dx, y + dy)); if (r && !s.includes(r)) s.push(r); }
    // (live: a wall more than a tile thick, the arena's north wall: a block with a room on its camera side stands in front of the room behind the wall too, straight or diagonally, and sinks with it)
    if (live) for (const [dx, dy] of [[0, -1], [-1, 0], [-1, -1]]) if (roomAt.has(K(x - dx, y - dy))) for (let k = 1; k <= 3 && band.has(K(x + dx * k, y + dy * k)); k++) { const r = roomAt.get(K(x + dx * (k + 1), y + dy * (k + 1))); if (r) { if (!s.includes(r)) s.push(r); break; } }
    return s.sort(); };
  const groups = new Map(), groupOf = hide => { const k = hide.join('|'); let G = groups.get(k); if (!G) { G = { key: k, hide, g: new T.Group(), face: quads(), cap: quads(), rface: quads(), rcap: quads(), down: 0, want: 0 }; G.g.userData.dynamic = true; groups.set(k, G); g.add(G.g); } return G; };
  for (const b of band.values()) { b.hide = hideOf(b.x, b.y); b.G = groupOf(b.hide);
    let lo = 1e9, hi = -1e9; const see = list => { for (const [dx, dy] of list) if (roomAt.has(K(b.x + dx, b.y + dy))) { const h = hAt(b.x + dx, b.y + dy); lo = Math.min(lo, h); hi = Math.max(hi, h); } };
    see(DIRS); if (lo > hi) see([[1, 1], [-1, -1], [1, -1], [-1, 1]]); if (lo > hi) lo = hi = 0; b.lo = lo; b.hi = hi; }   // (a corner piece: its diagonal neighbours)
  for (const G of groups.values()) G.sink = WALL_H + 0.16;
  if (live) for (const b of band.values()) b.G.sink = Math.max(b.G.sink, b.hi + WALL_H - (b.lo + B0) + 0.16);   // (how far a group sinks: past its lowest floor)

  // one picture for every room's wall face: the body, the groove the neon seam sits in, a join, the line under the cap; its base band is white, and takes each room's own colour
  const faceMat = new T.MeshStandardMaterial({ map: wallTexture({ base: '#ffffff' }), roughness: 0.62, metalness: 0.05, vertexColors: true }), seams = {}, seamOf = id => seams[id] || (seams[id] = id === 'crystal_chamber' && P0.seam ? P0.seam : glowMat(rooms[id].style.acc, 1.0));
  const wain = id => { const c = lin((rooms[id] && rooms[id].style.wain) || PAL.wallBase); return [c.r, c.g, c.b]; };
  const face = (q, b, dx, dy, y0, y1, c, z, body) => { z = z || 0; body = body || WHITE; const yb = z + WALL_H * 0.2, yt = z + WALL_H; if (y0 < yb) sideQuad(q, b.x, b.y, dx, dy, y0, Math.min(y1, yb), c, 0, (Math.min(y1, yb) - z) / WALL_H);
    if (y1 > yb && y0 < yt) sideQuad(q, b.x, b.y, dx, dy, Math.max(y0, yb), Math.min(y1, yt), body, (Math.max(y0, yb) - z) / WALL_H, (Math.min(y1, yt) - z) / WALL_H); if (y1 > yt + 1e-4) sideQuad(q, b.x, b.y, dx, dy, Math.max(y0, yt), y1, body, 0.45, 0.85); };
  const bodyOf = id => { const st = live && rooms[id] && rooms[id].style; if (!st || !st.dark) return WHITE; const k = lin(hexMix(st.wain || '#3a3532', '#ffffff', 0.25)); return [k.r, k.g, k.b]; };   // (a face looking into a dark room, the arena's: the game draws its walls dark)   // (z: the floor it rises from; over a storey's height, between two floors, it goes on plain)
  // ROCK (the arena's rock walls; a draft for the owner, ?draft=arena: docs/VIEW-3D.md). The owner's reference, 2026-11-16, a picture of layered cave walls: "These are nice walls"
  // (the first draft, faceted blocks, was not liked). From it, our own rock: wavy horizontal strata in lighter and darker stone, speckled with small pits, big low-poly faces pushed in
  // and out, flat facets with no smooth shading. As tall as the game's far drawn rock (168 px over its floor and up to 50 more: js/facilitydecor.js _fpRockHeights), its top a jagged
  // skyline (each corner's height from where it is, so the blocks beside it share it). In sand, the owner's pick of two (2026-11-16, of brown and sand: "I like the sand"); then, of the sand:
  // "Kind of want to switch to where the rock walls match the floor color. So I like the texture. I just want to change the color": each stratum is the cave floor's own colour (the two
  // tiles of its room's floor, a dark room's, else the arena's), as much lighter or darker as the sand's was, so the texture is the same
  const SAND = ['#9c7a4a', '#b38d58', '#c9a46a', '#a8834f', '#d6b67e', '#a07d4c', '#bd9862'], RH = (120 + (WALL_H * UH - 74)) / UH, ROWS = 7, COLS = 4;
  const sumOf = h => { const c = new T.Color(h); return c.r + c.g + c.b; }, sandMean = SAND.reduce((t, h) => t + sumOf(h), 0) / SAND.length, strataBy = {};
  const STRATA = id => { const st = rooms[id] && rooms[id].style && rooms[id].style.dark ? rooms[id].style : rooms.arena && rooms.arena.style && rooms.arena.style.dark ? rooms.arena.style : null, key = st ? st.fa + st.fb : '';
    return strataBy[key] || (strataBy[key] = SAND.map(h => { if (!st) return lin(h); const c = new T.Color(hexMix(st.fa, st.fb, 0.5)).multiplyScalar(sumOf(h) / sandMean); return lin('#' + new T.Color(Math.min(1, c.r), Math.min(1, c.g), Math.min(1, c.b)).getHexString()); })); };
  const rnd = (x, z, k) => { let h = Math.sin(x * 12.9898 + z * 78.233 + (k || 0) * 37.719) * 43758.5453; return h - Math.floor(h); }, jag = (x, z) => rnd(x, z) * 50 / UH;
  const swell = (x, z, y) => Math.sin(x * 1.31 + z * 0.73 + y * 1.9) * 0.5 + Math.sin(x * 0.37 - z * 1.13 + y * 0.81 + 1.3) * 0.35 + Math.sin(-x * 0.93 + z * 0.47 - y * 2.6 + 4.1) * 0.15;   // (smooth, from where it is)
  const wave = (x, z) => Math.sin(x * 0.9 + z * 0.61) * 0.11 + Math.sin(x * 2.1 - z * 1.7 + 0.7) * 0.05;   // (how a stratum's edge rises and falls along the wall)
  const speck = live ? canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = 'rgba(40,26,16,0.55)'; for (let i = 0; i < 16; i++) { const x = rnd(i, 3, 1) * w, y = rnd(i, 7, 2) * h, r = 1.2 + rnd(i, 9, 3) * 1.8; g.beginPath(); g.ellipse(x, y, r * 1.3, r, 0, 0, 6.2832); g.fill(); } }, { repeat: true }) : null;   // (small pits in the stone)
  // a rock block's face, side (dx, dy), from y0 up to its skyline: ROWS rows of COLS columns; inside rows wave, inside points swell in and out (none at an edge where the face turns
  // a corner or ends, so faces meet with no gap); each row its stratum's colour; flat facets
  const rockFace = (G, b, dx, dy, y0, z, flatTop) => { const cx = b.x + dx * 0.5, cz = b.y + dy * 0.5, rx = dy / 2, rz = -dx / 2, p = [cx - rx, cz - rz], q = [cx + rx, cz + rz], pal = STRATA(b.own);   // (flatTop: a cliff's, up to a higher floor's edge)
    const goes = e => { const nb = band.get(K(b.x + (e < 0 ? -rx * 2 : rx * 2), b.y + (e < 0 ? -rz * 2 : rz * 2))); if (!nb || !nb.rock || nb.G !== b.G) return false; const out = band.get(K(nb.x + dx, nb.y + dy)); return !(out && out.rock && out.G === b.G); };
    const gp = goes(-1), gq = goes(1), ta = flatTop !== undefined ? flatTop : b.hi + RH + jag(p[0], p[1]), tb = flatTop !== undefined ? flatTop : b.hi + RH + jag(q[0], q[1]), V = [];   // (up to the block's own top, whichever floor the face rises from)
    for (let r = 0; r <= ROWS; r++) { const row = []; for (let c = 0; c <= COLS; c++) { const s2 = c / COLS, x = p[0] + (q[0] - p[0]) * s2, zz = p[1] + (q[1] - p[1]) * s2, t = r / ROWS, top = ta + (tb - ta) * s2;
      let y = y0 + (top - y0) * t; if (r > 0 && r < ROWS) y += wave(x, zz);   // (inside rows wave)
      const edge = (c === 0 && !gp) || (c === COLS && !gq), d = edge || b.flat || r === 0 || r === ROWS ? 0 : 0.18 * swell(x, zz, y) * Math.sin(Math.PI * t);   // (out and in, none at the top, the foot, a turning edge or where a door or a sign hangs)
      row.push([x + dx * d, y, zz + dy * d, x * dy - zz * dx, y]); } V.push(row); }   // (its last two: where the pits' picture is laid: along the wall, and up it)
    const tri3 = (a, bb, c, col) => { for (const v of [a, bb, c]) { G.rface.pos.push(v[0], v[1], v[2]); G.rface.nor.push(dx, 0, dy); G.rface.uv.push(v[3] / 0.9, v[4] / 0.9); G.rface.col.push(col.r, col.g, col.b); } };
    for (let r = 0; r < ROWS; r++) { const col = pal[r % pal.length]; for (let c = 0; c < COLS; c++) { const A = V[r][c], B = V[r][c + 1], C = V[r + 1][c + 1], D = V[r + 1][c]; tri3(A, B, C, col); tri3(A, C, D, col); } } };
  // the top: the skyline's four corners, in the top stratum's colour
  const rockCap = (G, b, top) => { const x = b.x, z = b.y, h = (px, pz) => top + jag(px, pz), C = [[x - 0.5, z + 0.5], [x + 0.5, z + 0.5], [x + 0.5, z - 0.5], [x - 0.5, z - 0.5]].map(c => [c[0], h(c[0], c[1]), c[1]]), pal = STRATA(b.own), col = pal[ROWS % pal.length];
    putQuad(G.rcap, C[0], C[1], C[2], C[3], [0, 1, 0], [col.r, col.g, col.b], C.map(c => [c[0] / 0.9, c[2] / 0.9])); };
  for (const b of band.values()) { const G = b.G, top = b.rock ? b.hi + RH : b.hi + WALL_H; if (b.rock) rockCap(G, b, top); else topQuad(G.cap, b.x, b.y, top, WHITE);
    for (const [dx, dy] of DIRS) { const k = K(b.x + dx, b.y + dy), nb = band.get(k), rid = roomAt.get(k), c = wain(rid || b.own), same = !!nb && nb.G === G, z = rid ? hAt(b.x + dx, b.y + dy) : nb ? b.lo : minH;   // (z: the floor this face rises from; over the void, the lowest)
      if (b.header) { if (!same) face(G.face, b, dx, dy, b.lo + DOOR_H, top, c, b.lo); continue; }
      if (nb && nb.header) { face(G.face, b, dx, dy, nb.lo + B0, nb.lo + DOOR_H, c, nb.lo); if (!same) face(G.face, b, dx, dy, nb.lo + DOOR_H, top, c, nb.lo); continue; }   // (the tunnel's side, under the wall that goes on over the door)
      if (same) continue; if (b.rock) { if (!(nb && nb.rock && nb.G === G)) rockFace(G, b, dx, dy, z + B0, z); continue; } face(G.face, b, dx, dy, z + B0, top, c, z, bodyOf(rid || b.own));
      if (!nb && rid && (dx === 1 || dy === 1)) { const s = new T.Mesh(new T.BoxGeometry(dx ? 0.03 : 1, 0.028, dy ? 0.03 : 1), seamOf(rid)); s.position.set(b.x + dx * 0.512, z + WALL_H * 0.2 + 0.012, b.y + dy * 0.512); s.userData.noInk = true; G.g.add(s); } } }   // (the neon seam, on the faces the camera sees)

  // the cut stubs the sunk walls leave (under every block that can sink): their sides lie in the walls' own faces, so they are one solid with the walls for the ink line
  const sFace = quads(), sTop = quads();
  for (const b of band.values()) { if (!b.hide.length || b.header) continue; topQuad(sTop, b.x, b.y, b.hi + CUT_H, WHITE); for (const [dx, dy] of DIRS) { const nb = band.get(K(b.x + dx, b.y + dy)), rid = roomAt.get(K(b.x + dx, b.y + dy));
      if (nb && !nb.header) { if (live && nb.hide.length && nb.hi < b.hi - 0.01) sideQuad(sFace, b.x, b.y, dx, dy, nb.hi + CUT_H, b.hi + CUT_H, WHITE, 0, 1); continue; }   // (live: down to a lower stub beside it, a thick wall's between two floors)
      sideQuad(sFace, b.x, b.y, dx, dy, (rid ? hAt(b.x + dx, b.y + dy) : minH) + B0, b.hi + CUT_H, WHITE, 0, 1); } }   // (over the highest floor beside it)

  // thin walls: glass or a divider, on the line; each sinks when the room behind it (to its north or west) is opened
  const edges = new Set(), glassMat = new T.MeshStandardMaterial({ color: lin('#96e6f2'), transparent: true, opacity: 0.2, roughness: 0.1, depthWrite: false, side: T.DoubleSide });
  for (const t of thin) { const nr = [t.u[1], t.u[0]], back = at(t.m[0] - nr[0] * 0.5, t.m[1] - nr[1] * 0.5), front = at(t.m[0] + nr[0] * 0.5, t.m[1] + nr[1] * 0.5), G = groupOf(back ? [back] : []), ax = t.u[0] ? 1 : 0;
    const z0 = live ? Math.max(front ? hAt(Math.round(t.m[0] + nr[0] * 0.5), Math.round(t.m[1] + nr[1] * 0.5)) : -1e9, back ? hAt(Math.round(t.m[0] - nr[0] * 0.5), Math.round(t.m[1] - nr[1] * 0.5)) : -1e9) : 0;   // (its floor)
    const box = (len, h, dep, mat) => new T.Mesh(new T.BoxGeometry(ax ? len : dep, h, ax ? dep : len), mat), put = (par, m, y, off) => { m.position.set(t.m[0] + nr[0] * (off || 0), z0 + y, t.m[1] + nr[1] * (off || 0)); par.add(m); return m; };
    t.back = back; t.front = front; t.G = G; edges.add(K(Math.round(t.m[0] - nr[0] * 0.5), Math.round(t.m[1] - nr[1] * 0.5)) + '|' + K(Math.round(t.m[0] + nr[0] * 0.5), Math.round(t.m[1] + nr[1] * 0.5)));
    if (live && front && back && Math.abs(hAt(Math.round(t.m[0] + nr[0] * 0.5), Math.round(t.m[1] + nr[1] * 0.5)) - hAt(Math.round(t.m[0] - nr[0] * 0.5), Math.round(t.m[1] - nr[1] * 0.5))) > 0.05) continue;   // (a ledge between two floors, the catwalk spur's over the arena: the floor's riser is its face, a railing on it if the map has one, as the game draws it)
    if (t.glass) { const sill = 0.19, rail = 0.095;   // (the sill stays when the glass sinks; the rail and the posts are one solid along the whole window)
      const s = put(rooms[front || back].g, box(1, sill, 0.16, P0.frame), sill / 2); s.castShadow = s.receiveShadow = true; s.userData.inkKey = 'sill';
      const pane = put(G.g, box(1, WALL_H - sill - rail, 0.03, glassMat), sill + (WALL_H - sill - rail) / 2); pane.userData.noInk = true; pane.renderOrder = 3;
      const r = put(G.g, box(1, rail, 0.14, P0.frame), WALL_H - rail / 2); r.castShadow = true; r.userData.inkKey = 'rail';
      if (Math.round(t.m[0] * t.u[0] + t.m[1] * t.u[1] - 0.5) % 2 === 0) { const p = new T.Mesh(new T.BoxGeometry(ax ? 0.07 : 0.18, WALL_H - sill, ax ? 0.18 : 0.07), P0.frame); p.position.set(t.m[0] - t.u[0] * 0.5, z0 + sill + (WALL_H - sill) / 2, t.m[1] - t.u[1] * 0.5); p.castShadow = true; p.userData.inkKey = 'rail'; G.g.add(p); }
      if (front) { const a = put(rooms[front].g, box(1, 0.028, 0.02, seamOf(front)), sill - 0.03, 0.085); a.userData.noInk = true; } }
    else { const c = wain(front || back), hw = 0.08, x = t.m[0], y = t.m[1]; topQuad(G.cap, x, y, z0 + WALL_H, WHITE, ax ? 0.5 : hw, ax ? hw : 0.5); topQuad(sTop, x, y, z0 + CUT_H, WHITE, ax ? 0.5 : hw, ax ? hw : 0.5);
      for (const s of [1, -1]) { face(G.face, { x: x + nr[0] * s * (hw - 0.5), y: y + nr[1] * s * (hw - 0.5) }, nr[0] * s, nr[1] * s, z0 + B0, z0 + WALL_H, c, z0); sideQuad(sFace, x + nr[0] * s * (hw - 0.5), y + nr[1] * s * (hw - 0.5), nr[0] * s, nr[1] * s, z0 + B0, z0 + CUT_H, WHITE, 0, 1);
        if (!thin.some(q => !q.glass && Math.abs(q.m[0] - x - t.u[0] * s) < 0.01 && Math.abs(q.m[1] - y - t.u[1] * s) < 0.01)) for (const [q, h] of [[G.face, z0 + WALL_H], [sFace, z0 + CUT_H]]) {   // (its end, where it does not go on)
          const ex = x + t.u[0] * s * 0.5, ez = y + t.u[1] * s * 0.5, rx = t.u[1] * s * hw, rz = -t.u[0] * s * hw; putQuad(q, [ex - rx, z0 + B0, ez - rz], [ex + rx, z0 + B0, ez + rz], [ex + rx, h, ez + rz], [ex - rx, h, ez - rz], [t.u[0] * s, 0, t.u[1] * s], WHITE, [[0.4, 0.3], [0.6, 0.3], [0.6, 0.9], [0.4, 0.9]]); } } } }
  const rockMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, vertexColors: true, map: speck, flatShading: true });
  for (const G of groups.values()) { const m = quadMesh([{ q: G.face, mat: faceMat }, { q: G.cap, mat: P0.wallCap }, { q: G.rface, mat: rockMat }, { q: G.rcap, mat: rockMat }]); m.castShadow = m.receiveShadow = true; m.userData.inkKey = 'wall'; m.userData.inkIds = [0, 1, 2, 2]; G.g.add(m); G.mesh = m; }   // (rock its own solid for the ink line)
  const cutFace = P0.cutFace.clone(), stubs = quadMesh([{ q: sFace, mat: cutFace }, { q: sTop, mat: P0.cutTop }]); stubs.receiveShadow = true; stubs.userData.inkKey = 'wall'; stubs.userData.inkIds = [0, 1]; rest.add(stubs);

  // the floors, each room in its own colours; the dark aprons beyond the ways out; the ground outside
  const plate = new T.MeshStandardMaterial({ map: floorTexture(), roughness: 0.42, metalness: 0.08, vertexColors: true }), F0 = lin('#c9dce1'), floorMats = {};
  const rocky = new Set(live ? recs.filter(r => r.walls.some(w => w.kind === 'rock')).map(r => r.id) : []);   // (live: the rooms with rock walls, the arena's cave; a drop into one from a floor that is not steel is a cliff of its rock)
  for (const rec of recs) { const rm = rooms[rec.id], st = rm.style, kind = (rec.floor && rec.floor.style) || 'plate', own = kind === 'wood' || kind === 'grate', top = quads(), side = quads(), base = lin(hexMix(st.fa, st.fb, 0.4)), cliff = { rface: quads() };
    const mat = own ? (floorMats[rec.id] = new T.MeshStandardMaterial({ map: kind === 'wood' ? plankTexture(st.fa, st.fb) : grateTexture(st.fa, st.fb), roughness: 0.5, metalness: 0.05, vertexColors: true })) : plate, k = own ? [1, 1, 1] : [base.r / F0.r, base.g / F0.g, base.b / F0.b];
    for (const c of rec.cells) { const v = ((c[0] * 7 + c[1] * 13) % 5) / 5, h = hAt(c[0], c[1]); topQuad(top, c[0], c[1], h, [k[0] * (1 - v * 0.035), k[1] * (1 - v * 0.03), k[2] * (1 - v * 0.025)]);
      for (const [dx, dy] of DIRS) { const q = K(c[0] + dx, c[1] + dy), nb = band.get(q); if (roomAt.has(q) || aprons.has(q)) { const h2 = roomAt.has(q) ? hAt(c[0] + dx, c[1] + dy) : 0, low = roomAt.get(q);
          if (h2 < h - 0.6 && low && low !== rec.id && rocky.has(low) && rec.structure !== 'scaffold') rockFace(cliff, { x: c[0], y: c[1], hi: h, own: low }, dx, dy, h2 + B0, h2, h); else if (h2 < h - 1e-4) sideQuad(side, c[0], c[1], dx, dy, h2, h, WHITE, 0, 1); continue; } if (nb && !nb.header) continue; sideQuad(side, c[0], c[1], dx, dy, minH + B0, h, WHITE, 0, 1); } }   // (a riser down to a lower tread; an edge over the void, down past the lowest floor)
    const fm = quadMesh([{ q: top, mat }, { q: side, mat: P0.floorSide }]); fm.receiveShadow = true; fm.userData.inkKey = 'floor'; rm.g.add(fm); rm.floor = fm;
    if (cliff.rface.pos.length) { const cm = quadMesh([{ q: cliff.rface, mat: rockMat }]); cm.castShadow = cm.receiveShadow = true; cm.userData.inkKey = 'wall'; rm.g.add(cm); } }
  if (aprons.size && P0.outside) { const top = quads(), side = quads(); for (const a of aprons.values()) { const ah = live ? a.h : 0; topQuad(top, a.x, a.y, ah - 0.004, WHITE); for (const [dx, dy] of DIRS) { const q = K(a.x + dx, a.y + dy), nb = band.get(q); if (roomAt.has(q) || aprons.has(q) || (nb && !nb.header)) continue; sideQuad(side, a.x, a.y, dx, dy, minH + B0, ah - 0.004, WHITE, 0, 1); } }
    const am = quadMesh([{ q: top, mat: P0.outside }, { q: side, mat: P0.outside }]); am.receiveShadow = true; am.userData.inkKey = 'apron'; rest.add(am); }
  let bb = [1e9, 1e9, -1e9, -1e9]; for (const rec of recs) bb = [Math.min(bb[0], rec.bb[0]), Math.min(bb[1], rec.bb[1]), Math.max(bb[2], rec.bb[2]), Math.max(bb[3], rec.bb[3])];
  if (P0.ground) { const gr = new T.Mesh(new T.PlaneGeometry(260, 260), P0.ground); gr.rotation.x = -Math.PI / 2; gr.position.set((bb[0] + bb[2]) / 2, minH - 0.13, (bb[1] + bb[3]) / 2); gr.receiveShadow = true; rest.add(gr); }

  // the doors
  for (const d of doors) { if (d.kind === 'mouth') continue; const th = -Math.atan2(d.u[1], d.u[0]), fs = d.u[0] ? 1 : -1, shut = d.kind === 'shut', L = d.L, low = new T.Group(), tall = new T.Group(), thinDoor = !d.side;
    const G = d.over.length ? d.over[0].G : groupOf((() => { const r = at(d.m[0] - Math.abs(d.nr[0]) * 0.5, d.m[1] - Math.abs(d.nr[1]) * 0.5); return r ? [r] : []; })()), Pd = d.room === 'crystal_chamber' ? P0 : Object.assign({}, P0, { lampOpen: seamOf(d.room) });
    for (const q of [low, tall]) { q.position.set(d.c[0], live ? d.h : 0, d.c[1]); q.rotation.y = th; q.userData.inkGroup = true; } rooms[d.room].g.add(low); G.g.add(tall);
    const box = (w, h, dep, mat) => new T.Mesh(new T.BoxGeometry(w, h, dep), mat), put = (par, m, x, y, z) => { m.position.set(x, y, z || 0); par.add(m); return m; }, ph = DOOR_H - 0.02;
    for (const s of [-1, 1]) { put(tall, box(0.15, DOOR_H, 0.44, P0.frame), s * (L / 2 - 0.085), DOOR_H / 2); put(low, box(0.13, CUT_H + 0.05, 0.42, P0.frame), s * (L / 2 - 0.085), (CUT_H + 0.05) / 2);
      if (liveDoors) { const lw = L / 2 - 0.17, lg = new T.Group(); lg.userData.dynamic = true; put(lg, box(lw, ph, 0.09, P0.steel), s * (lw / 2 + 0.01), ph / 2); put(lg, box(0.05, ph, 0.1, P0.hazard), s * 0.036, ph / 2); tall.add(lg); (d.leaves = d.leaves || []).push({ g: lg, s, slide: Math.max(0, L / 2 - 0.221 - L * 0.2) }); }   // (slid all the way, as much of it shows as an open door's leaf below; the rest is in the wall)
      else if (shut) { const lw = L / 2 - 0.17; put(tall, box(lw, ph, 0.09, P0.steel), s * (lw / 2 + 0.01), ph / 2); put(tall, box(0.05, ph, 0.1, P0.hazard), s * 0.036, ph / 2); const win = put(tall, box(lw * 0.5, 0.12, 0.1, P0.amberGlow), s * (lw / 2 + 0.03), 0.95); win.userData.noInk = true; }
      else { put(tall, box(L * 0.2, ph, 0.09, P0.steel), s * (L / 2 - 0.16 - L * 0.1), ph / 2); put(tall, box(0.05, ph, 0.1, P0.hazard), s * (L / 2 - 0.16 - L * 0.2 - 0.025), ph / 2); } }
    if (thinDoor) put(tall, box(L - 0.02, WALL_H - DOOR_H, 0.2, P0.frame), 0, DOOR_H + (WALL_H - DOOR_H) / 2);
    const lit = shut && !liveDoors ? P0.amberGlow : d.kind === 'raid' ? glowMat('#ff3b5c', 1) : Pd.lampOpen;   // (a shut door's lamp is amber; the door the raid comes up through, the ants' red)
    const lamp = put(tall, box(0.5, 0.06, 0.04, lit), 0, DOOR_H + 0.08, fs * (thinDoor ? 0.11 : 0.512)); lamp.userData.noInk = true;
    const thr = put(low, box(L, 0.012, 0.5, P0.hazard), 0, 0.008); const line = put(low, box(L, 0.014, 0.05, lit), 0, 0.012, fs * 0.3); line.userData.noInk = true;
    setShadows(tall); setShadows(low); thr.castShadow = false; d.G = G; d.open = 0; if (d.leaves) d.set = k => { if (k === d.open) return; d.open = k; for (const lf of d.leaves) lf.g.position.x = lf.s * k * lf.slide; }; }

  // a deck's railing (the game's deck_rail): posts and two rails on the room's floor, along the edge
  for (const r of rails) { const w = r.w, gp = new T.Group(), RH = 0.62, n = Math.max(1, Math.round(w.L)); let zIn = -1e9, zOut = -1e9;
    for (let i = 0; i < n; i++) { const mx = w.a[0] + w.u[0] * (i + 0.5) * w.L / n, my = w.a[1] + w.u[1] * (i + 0.5) * w.L / n, ci = [Math.round(mx - w.n[0] * 0.5), Math.round(my - w.n[1] * 0.5)], co = [Math.round(mx + w.n[0] * 0.5), Math.round(my + w.n[1] * 0.5)];
      if (roomAt.has(K(ci[0], ci[1]))) zIn = Math.max(zIn, hAt(ci[0], ci[1])); if (roomAt.has(K(co[0], co[1]))) zOut = Math.max(zOut, hAt(co[0], co[1])); }
    const z = Math.max(zIn, zOut, -1e8) > -1e8 ? Math.max(zIn, zOut) : baseOf(r.room), sd = zOut > zIn + 0.05 ? 1 : -1;   // (on the higher floor beside it, on that floor's side of the line)
    for (let i = 0; i <= n; i++) { const p = new T.Mesh(new T.BoxGeometry(0.06, RH, 0.06), P0.steelDk); p.position.set(w.a[0] + w.u[0] * w.L * i / n + sd * w.n[0] * 0.08, z + RH / 2, w.a[1] + w.u[1] * w.L * i / n + sd * w.n[1] * 0.08); gp.add(p); }
    for (const [y, th] of [[RH, 0.05], [RH * 0.5, 0.03]]) { const b = new T.Mesh(new T.BoxGeometry(w.u[0] ? w.L : th, th, w.u[1] ? w.L : th), P0.frame); b.position.set(w.mid[0] + sd * w.n[0] * 0.08, z + y, w.mid[1] + sd * w.n[1] * 0.08); gp.add(b); }
    gp.userData.inkKey = 'rail'; setShadows(gp); rooms[r.room].g.add(gp); }

  // each room's own things: its floor marks, wall fittings (which go with the wall they hang on) and props
  const props = {}, sentries = [];
  for (const rec of recs) { const rm = rooms[rec.id], chamber = rec.id === 'crystal_chamber', hi = hexMix(rm.style.acc, '#ffffff', 0.35), Pr = Object.assign({}, P0, { puddle: ['#3a7a90', 0.2] });
    if (!chamber) Object.assign(Pr, { seam: seamOf(rec.id), lampOpen: seamOf(rec.id), screen: glowMat(hi, 0.95), ringGlow: [rm.style.acc, 0.85], ringDash: [hi, 0.55] });
    Pr.more = moreFittings(Pr, rm.style.acc); const B = buildRoom(rm.R, Pr, { shell: false }); rm.parts = B.parts; rm.g.add(B.g); B.g.position.y = baseOf(rec.id);   // (on its floor)
    for (const f of B.parts.fittings.children.slice()) { const w = f.userData.wall, b = w && band.get(K(Math.round(f.position.x + w.n[0] * 0.56), Math.round(f.position.z + w.n[1] * 0.56))); if (b) { f.position.y += B.g.position.y; b.G.g.add(f); } }
    for (const id of Object.keys(B.parts.props)) { const p = B.parts.props[id]; props[id] = p; if (p.s.kind === 'sentry') { const head = p.g.children.find(c => c.isGroup && Math.abs(c.position.y - 47 / UH) < 1e-3); if (head) { head.userData.dynamic = true; sentries.push({ id, at: p.s.c, room: rec.id, g: p.g, head, muzzle: p.marks.muzzle || [0.6, 0.72, 0] }); } } } }

  // where one can walk
  const blocked = new Set(), ch = rooms.crystal_chamber, crystal = ch ? ch.rec.crystal : null;
  for (const rec of recs) for (const s of rec.solids) for (let x = Math.ceil(s.bb[0] + 0.01); x <= Math.floor(s.bb[2] - 0.01); x++) for (let y = Math.ceil(s.bb[1] + 0.01); y <= Math.floor(s.bb[3] - 0.01); y++) blocked.add(K(x, y));
  let padR = 1.2; if (ch && ch.parts.pad) { const box = new T.Box3().setFromObject(ch.parts.pad); padR = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2; }
  if (crystal) for (let x = Math.floor(crystal[0] - padR); x <= Math.ceil(crystal[0] + padR); x++) for (let y = Math.floor(crystal[1] - padR); y <= Math.ceil(crystal[1] + padR); y++) if (Math.hypot(x - crystal[0], y - crystal[1]) < padR - 0.15) blocked.add(K(x, y));

  return { g, rest, rooms, order: recs.map(r => r.id), parts: ch ? ch.parts : {}, props, sentries, doors, groups: [...groups.values()], band, aprons, stubs, crystal, padR, bb, roomAt: (x, y) => roomAt.get(K(Math.round(x), Math.round(y))) || null,
    blocked, edges, walkable: (x, y) => roomAt.has(K(x, y)) && !blocked.has(K(x, y)),
    // (after the look has changed the materials: the stubs' sides lie in the walls' faces, and give way to them)
    settle() { const m = stubs.material[0]; m.polygonOffset = true; m.polygonOffsetFactor = 1; m.polygonOffsetUnits = 1; } };
}
