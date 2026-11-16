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
//   a tile may stand higher or lower than its room (a cell [x, y, h], h in the game's px of height: the treads of a staircase), with the risers between; and the walls reach further
//   down under the floor, past the lowest tread
function buildLabFloor(lab, P0, how) {
  const live = !!(how && how.live), liveDoors = live, g = new T.Group(), rest = new T.Group(), recs = lab.rooms, rooms = {}, roomAt = new Map(), K = cellKey, DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]], WHITE = [1, 1, 1], vD = DOOR_H / WALL_H;
  const B0 = live ? -0.5 : -0.12, cellH = new Map();   // (B0: how far under the floor a wall's face and a floor's edge go; cellH: a tile higher or lower than its room, in world units)
  g.add(rest);   // (what belongs to no one room: the stubs, the aprons, the ground)
  for (const rec of recs) { rooms[rec.id] = { id: rec.id, rec, R: roomOf(rec), g: new T.Group(), label: rec.label || rec.id, style: rec.style || { acc: PAL.cyan, wain: PAL.wallBase, fa: PAL.floorA, fb: PAL.floorB } }; g.add(rooms[rec.id].g); for (const c of rec.cells) { roomAt.set(K(c[0], c[1]), rec.id); if (live && c[2]) cellH.set(K(c[0], c[1]), c[2] / UH); } }
  const hAt = (x, y) => cellH.get(K(x, y)) || 0;
  const at = (x, y) => roomAt.get(K(Math.round(x), Math.round(y))) || null;

  // the walls: a block a tile of the gap between rooms (band), or a thin wall on the line where two rooms touch (thin)
  const band = new Map(), thin = [], thinSeen = new Set();
  for (const rec of recs) { const R = rooms[rec.id].R; rec.walls.forEach((w0, wi) => { if (w0.kind === 'open') return; const w = R.WALLS[wi];
    for (let i = 0, n = Math.round(w.L); i < n; i++) { const m = [w.a[0] + w.u[0] * (i + 0.5), w.a[1] + w.u[1] * (i + 0.5)], bx = Math.round(m[0] + w.n[0] * 0.5), by = Math.round(m[1] + w.n[1] * 0.5);
      if (roomAt.has(K(bx, by))) { const k = m[0] + ',' + m[1]; if (!thinSeen.has(k)) { thinSeen.add(k); thin.push({ m, u: [Math.abs(w.u[0]), Math.abs(w.u[1])], glass: !!w0.window && !w0.divider }); } }
      else if (!band.has(K(bx, by))) band.set(K(bx, by), { x: bx, y: by, own: rec.id }); } }); }
  for (const rec of recs) for (const c of rec.cells) for (const sx of [-1, 1]) for (const sy of [-1, 1]) { const k = K(c[0] + sx, c[1] + sy); if (band.has(k) || roomAt.has(k)) continue; if (band.has(K(c[0] + sx, c[1])) && band.has(K(c[0], c[1] + sy))) band.set(k, { x: c[0] + sx, y: c[1] + sy, own: rec.id }); }   // (a corner piece where a room turns outwards)

  // the openings: a door stands in its tunnel through the wall (the side of the line where wall stands at both its ends), or on the line itself in a thin wall
  const doors = [], aprons = new Map();
  for (const o0 of lab.openings) { const flip = (o0.b[0] - o0.a[0]) + (o0.b[1] - o0.a[1]) < 0, o = { id: o0.id, door: o0.door, a: flip ? o0.b : o0.a, b: flip ? o0.a : o0.b };   // (a to b towards +x or +y, so a door's own axes are always the same way round)
    const dx = o.b[0] - o.a[0], dy = o.b[1] - o.a[1], L = Math.round(Math.hypot(dx, dy)), u = [dx / L, dy / L], nr = [u[1], -u[0]], m = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2];
    const rA = at(m[0] + nr[0] * 0.5 - u[0] * 0.01, m[1] + nr[1] * 0.5 - u[1] * 0.01), rB = at(m[0] - nr[0] * 0.5 - u[0] * 0.01, m[1] - nr[1] * 0.5 - u[1] * 0.01); if ((!rA && !rB) || (rA && rB && !o.door)) continue;   // (two rooms open to each other: nothing stands there)
    const end = (s, k, e) => { const p = e < 0 ? o.a : o.b; return K(Math.round(p[0] + u[0] * e * 0.5 + nr[0] * s * (k - 0.5)), Math.round(p[1] + u[1] * e * 0.5 + nr[1] * s * (k - 0.5))); };
    const depth = s => { let k = 0; while (k < 8 && band.has(end(s, k + 1, -1)) && band.has(end(s, k + 1, 1))) k++; return k; }, dA = depth(1), dB = depth(-1), side = dA && (!dB || dA <= dB) ? 1 : dB ? -1 : 0;
    const out = !rA ? 1 : !rB ? -1 : 0, kind = !o.door ? 'mouth' : !out ? 'open' : o.id === 'door_arena_hallway' && !live ? 'raid' : 'shut', cellOf = (i, s, k) => [Math.round(o.a[0] + u[0] * (i + 0.5) + nr[0] * s * (k - 0.5)), Math.round(o.a[1] + u[1] * (i + 0.5) + nr[1] * s * (k - 0.5))];
    const d = { id: o.id, kind, L, u, nr, m, side, out, room: rA || rB, rooms: [rA, rB], c: [m[0] + nr[0] * side * 0.5, m[1] + nr[1] * side * 0.5], over: [] };
    if (o.door && side) for (let i = 0; i < L; i++) { const c = cellOf(i, side, 1), b = { x: c[0], y: c[1], own: d.room, header: true }; band.set(K(c[0], c[1]), b); d.over.push(b); }   // (the wall goes on over the door)
    if (out) for (let k = 1, n = kind === 'raid' ? 3 : kind === 'shut' && !liveDoors ? 1 : 2; k <= n; k++) for (let i = 0; i < L; i++) { const c = cellOf(i, out, k); if (!roomAt.has(K(c[0], c[1]))) aprons.set(K(c[0], c[1]), { x: c[0], y: c[1] }); }
    doors.push(d); }

  // which rooms a block stands in front of (seen from the camera's side), and the pieces that sink together
  const hideOf = (x, y) => { const s = []; for (const [dx, dy] of [[0, -1], [-1, 0], [-1, -1]]) { const r = roomAt.get(K(x + dx, y + dy)); if (r && !s.includes(r)) s.push(r); } return s.sort(); };
  const groups = new Map(), groupOf = hide => { const k = hide.join('|'); let G = groups.get(k); if (!G) { G = { key: k, hide, g: new T.Group(), face: quads(), cap: quads(), down: 0, want: 0 }; G.g.userData.dynamic = true; groups.set(k, G); g.add(G.g); } return G; };
  for (const b of band.values()) { b.hide = hideOf(b.x, b.y); b.G = groupOf(b.hide); }

  // one picture for every room's wall face: the body, the groove the neon seam sits in, a join, the line under the cap; its base band is white, and takes each room's own colour
  const faceMat = new T.MeshStandardMaterial({ map: wallTexture({ base: '#ffffff' }), roughness: 0.62, metalness: 0.05, vertexColors: true }), seams = {}, seamOf = id => seams[id] || (seams[id] = id === 'crystal_chamber' && P0.seam ? P0.seam : glowMat(rooms[id].style.acc, 1.0));
  const wain = id => { const c = lin((rooms[id] && rooms[id].style.wain) || PAL.wallBase); return [c.r, c.g, c.b]; };
  const face = (q, b, dx, dy, y0, y1, c) => { const yb = WALL_H * 0.2; if (y0 < yb) sideQuad(q, b.x, b.y, dx, dy, y0, Math.min(y1, yb), c, 0, Math.min(y1, yb) / WALL_H); if (y1 > yb) sideQuad(q, b.x, b.y, dx, dy, Math.max(y0, yb), y1, WHITE, Math.max(y0, yb) / WALL_H, y1 / WALL_H); };
  for (const b of band.values()) { const G = b.G; topQuad(G.cap, b.x, b.y, WALL_H, WHITE);
    for (const [dx, dy] of DIRS) { const k = K(b.x + dx, b.y + dy), nb = band.get(k), rid = roomAt.get(k), c = wain(rid || b.own), same = !!nb && nb.G === G;
      if (b.header) { if (!same) face(G.face, b, dx, dy, DOOR_H, WALL_H, c); continue; }
      if (nb && nb.header) { face(G.face, b, dx, dy, B0, DOOR_H, c); if (!same) face(G.face, b, dx, dy, DOOR_H, WALL_H, c); continue; }   // (the tunnel's side, under the wall that goes on over the door)
      if (same) continue; face(G.face, b, dx, dy, B0, WALL_H, c);
      if (!nb && rid && (dx === 1 || dy === 1)) { const s = new T.Mesh(new T.BoxGeometry(dx ? 0.03 : 1, 0.028, dy ? 0.03 : 1), seamOf(rid)); s.position.set(b.x + dx * 0.512, WALL_H * 0.2 + 0.012, b.y + dy * 0.512); s.userData.noInk = true; G.g.add(s); } } }   // (the neon seam, on the faces the camera sees)

  // the cut stubs the sunk walls leave (under every block that can sink): their sides lie in the walls' own faces, so they are one solid with the walls for the ink line
  const sFace = quads(), sTop = quads();
  for (const b of band.values()) { if (!b.hide.length || b.header) continue; topQuad(sTop, b.x, b.y, CUT_H, WHITE); for (const [dx, dy] of DIRS) { const nb = band.get(K(b.x + dx, b.y + dy)); if (nb && !nb.header) continue; sideQuad(sFace, b.x, b.y, dx, dy, B0, CUT_H, WHITE, 0, 1); } }

  // thin walls: glass or a divider, on the line; each sinks when the room behind it (to its north or west) is opened
  const edges = new Set(), glassMat = new T.MeshStandardMaterial({ color: lin('#96e6f2'), transparent: true, opacity: 0.2, roughness: 0.1, depthWrite: false, side: T.DoubleSide });
  for (const t of thin) { const nr = [t.u[1], t.u[0]], back = at(t.m[0] - nr[0] * 0.5, t.m[1] - nr[1] * 0.5), front = at(t.m[0] + nr[0] * 0.5, t.m[1] + nr[1] * 0.5), G = groupOf(back ? [back] : []), ax = t.u[0] ? 1 : 0;
    const box = (len, h, dep, mat) => new T.Mesh(new T.BoxGeometry(ax ? len : dep, h, ax ? dep : len), mat), put = (par, m, y, off) => { m.position.set(t.m[0] + nr[0] * (off || 0), y, t.m[1] + nr[1] * (off || 0)); par.add(m); return m; };
    t.back = back; t.front = front; t.G = G; edges.add(K(Math.round(t.m[0] - nr[0] * 0.5), Math.round(t.m[1] - nr[1] * 0.5)) + '|' + K(Math.round(t.m[0] + nr[0] * 0.5), Math.round(t.m[1] + nr[1] * 0.5)));
    if (t.glass) { const sill = 0.19, rail = 0.095;   // (the sill stays when the glass sinks; the rail and the posts are one solid along the whole window)
      const s = put(rooms[front || back].g, box(1, sill, 0.16, P0.frame), sill / 2); s.castShadow = s.receiveShadow = true; s.userData.inkKey = 'sill';
      const pane = put(G.g, box(1, WALL_H - sill - rail, 0.03, glassMat), sill + (WALL_H - sill - rail) / 2); pane.userData.noInk = true; pane.renderOrder = 3;
      const r = put(G.g, box(1, rail, 0.14, P0.frame), WALL_H - rail / 2); r.castShadow = true; r.userData.inkKey = 'rail';
      if (Math.round(t.m[0] * t.u[0] + t.m[1] * t.u[1] - 0.5) % 2 === 0) { const p = new T.Mesh(new T.BoxGeometry(ax ? 0.07 : 0.18, WALL_H - sill, ax ? 0.18 : 0.07), P0.frame); p.position.set(t.m[0] - t.u[0] * 0.5, sill + (WALL_H - sill) / 2, t.m[1] - t.u[1] * 0.5); p.castShadow = true; p.userData.inkKey = 'rail'; G.g.add(p); }
      if (front) { const a = put(rooms[front].g, box(1, 0.028, 0.02, seamOf(front)), sill - 0.03, 0.085); a.userData.noInk = true; } }
    else { const c = wain(front || back), hw = 0.08, x = t.m[0], y = t.m[1]; topQuad(G.cap, x, y, WALL_H, WHITE, ax ? 0.5 : hw, ax ? hw : 0.5); topQuad(sTop, x, y, CUT_H, WHITE, ax ? 0.5 : hw, ax ? hw : 0.5);
      for (const s of [1, -1]) { face(G.face, { x: x + nr[0] * s * (hw - 0.5), y: y + nr[1] * s * (hw - 0.5) }, nr[0] * s, nr[1] * s, B0, WALL_H, c); sideQuad(sFace, x + nr[0] * s * (hw - 0.5), y + nr[1] * s * (hw - 0.5), nr[0] * s, nr[1] * s, B0, CUT_H, WHITE, 0, 1);
        if (!thin.some(q => !q.glass && Math.abs(q.m[0] - x - t.u[0] * s) < 0.01 && Math.abs(q.m[1] - y - t.u[1] * s) < 0.01)) for (const [q, h] of [[G.face, WALL_H], [sFace, CUT_H]]) {   // (its end, where it does not go on)
          const ex = x + t.u[0] * s * 0.5, ez = y + t.u[1] * s * 0.5, rx = t.u[1] * s * hw, rz = -t.u[0] * s * hw; putQuad(q, [ex - rx, B0, ez - rz], [ex + rx, B0, ez + rz], [ex + rx, h, ez + rz], [ex - rx, h, ez - rz], [t.u[0] * s, 0, t.u[1] * s], WHITE, [[0.4, 0.3], [0.6, 0.3], [0.6, 0.9], [0.4, 0.9]]); } } } }
  for (const G of groups.values()) { const m = quadMesh([{ q: G.face, mat: faceMat }, { q: G.cap, mat: P0.wallCap }]); m.castShadow = m.receiveShadow = true; m.userData.inkKey = 'wall'; m.userData.inkIds = [0, 1]; G.g.add(m); G.mesh = m; }
  const cutFace = P0.cutFace.clone(), stubs = quadMesh([{ q: sFace, mat: cutFace }, { q: sTop, mat: P0.cutTop }]); stubs.receiveShadow = true; stubs.userData.inkKey = 'wall'; stubs.userData.inkIds = [0, 1]; rest.add(stubs);

  // the floors, each room in its own colours; the dark aprons beyond the ways out; the ground outside
  const plate = new T.MeshStandardMaterial({ map: floorTexture(), roughness: 0.42, metalness: 0.08, vertexColors: true }), F0 = lin('#c9dce1'), floorMats = {};
  for (const rec of recs) { const rm = rooms[rec.id], st = rm.style, kind = (rec.floor && rec.floor.style) || 'plate', own = kind === 'wood' || kind === 'grate', top = quads(), side = quads(), base = lin(hexMix(st.fa, st.fb, 0.4));
    const mat = own ? (floorMats[rec.id] = new T.MeshStandardMaterial({ map: kind === 'wood' ? plankTexture(st.fa, st.fb) : grateTexture(st.fa, st.fb), roughness: 0.5, metalness: 0.05, vertexColors: true })) : plate, k = own ? [1, 1, 1] : [base.r / F0.r, base.g / F0.g, base.b / F0.b];
    for (const c of rec.cells) { const v = ((c[0] * 7 + c[1] * 13) % 5) / 5, h = hAt(c[0], c[1]); topQuad(top, c[0], c[1], h, [k[0] * (1 - v * 0.035), k[1] * (1 - v * 0.03), k[2] * (1 - v * 0.025)]);
      for (const [dx, dy] of DIRS) { const q = K(c[0] + dx, c[1] + dy), nb = band.get(q); if (roomAt.has(q) || aprons.has(q)) { const h2 = roomAt.has(q) ? hAt(c[0] + dx, c[1] + dy) : 0; if (h2 < h - 1e-4) sideQuad(side, c[0], c[1], dx, dy, h2, h, WHITE, 0, 1); continue; } if (nb && !nb.header) continue; sideQuad(side, c[0], c[1], dx, dy, B0, h, WHITE, 0, 1); } }   // (a riser down to a lower tread)
    const fm = quadMesh([{ q: top, mat }, { q: side, mat: P0.floorSide }]); fm.receiveShadow = true; fm.userData.inkKey = 'floor'; rm.g.add(fm); rm.floor = fm; }
  if (aprons.size && P0.outside) { const top = quads(), side = quads(); for (const a of aprons.values()) { topQuad(top, a.x, a.y, -0.004, WHITE); for (const [dx, dy] of DIRS) { const q = K(a.x + dx, a.y + dy), nb = band.get(q); if (roomAt.has(q) || aprons.has(q) || (nb && !nb.header)) continue; sideQuad(side, a.x, a.y, dx, dy, B0, -0.004, WHITE, 0, 1); } }
    const am = quadMesh([{ q: top, mat: P0.outside }, { q: side, mat: P0.outside }]); am.receiveShadow = true; am.userData.inkKey = 'apron'; rest.add(am); }
  let bb = [1e9, 1e9, -1e9, -1e9]; for (const rec of recs) bb = [Math.min(bb[0], rec.bb[0]), Math.min(bb[1], rec.bb[1]), Math.max(bb[2], rec.bb[2]), Math.max(bb[3], rec.bb[3])];
  if (P0.ground) { const gr = new T.Mesh(new T.PlaneGeometry(260, 260), P0.ground); gr.rotation.x = -Math.PI / 2; gr.position.set((bb[0] + bb[2]) / 2, -0.13, (bb[1] + bb[3]) / 2); gr.receiveShadow = true; rest.add(gr); }

  // the doors
  for (const d of doors) { if (d.kind === 'mouth') continue; const th = -Math.atan2(d.u[1], d.u[0]), fs = d.u[0] ? 1 : -1, shut = d.kind === 'shut', L = d.L, low = new T.Group(), tall = new T.Group(), thinDoor = !d.side;
    const G = d.over.length ? d.over[0].G : groupOf((() => { const r = at(d.m[0] - Math.abs(d.nr[0]) * 0.5, d.m[1] - Math.abs(d.nr[1]) * 0.5); return r ? [r] : []; })()), Pd = d.room === 'crystal_chamber' ? P0 : Object.assign({}, P0, { lampOpen: seamOf(d.room) });
    for (const q of [low, tall]) { q.position.set(d.c[0], 0, d.c[1]); q.rotation.y = th; q.userData.inkGroup = true; } rooms[d.room].g.add(low); G.g.add(tall);
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

  // each room's own things: its floor marks, wall fittings (which go with the wall they hang on) and props
  const props = {}, sentries = [];
  for (const rec of recs) { const rm = rooms[rec.id], chamber = rec.id === 'crystal_chamber', hi = hexMix(rm.style.acc, '#ffffff', 0.35), Pr = Object.assign({}, P0, { puddle: ['#3a7a90', 0.2] });
    if (!chamber) Object.assign(Pr, { seam: seamOf(rec.id), lampOpen: seamOf(rec.id), screen: glowMat(hi, 0.95), ringGlow: [rm.style.acc, 0.85], ringDash: [hi, 0.55] });
    Pr.more = moreFittings(Pr, rm.style.acc); const B = buildRoom(rm.R, Pr, { shell: false }); rm.parts = B.parts; rm.g.add(B.g);
    for (const f of B.parts.fittings.children.slice()) { const w = f.userData.wall, b = w && band.get(K(Math.round(f.position.x + w.n[0] * 0.56), Math.round(f.position.z + w.n[1] * 0.56))); if (b) b.G.g.add(f); }
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
