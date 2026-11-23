// ROUND 2 · THE CRYSTAL CHAMBER IN 3D (design/style-evolution/round2; Proposed, drafts for the owner, nothing in the game). One moment of play, the same in every
// direction: ants raid the Crystal and the squad holds them off. Built from the game's own map (export.js): the room's tiles, walls, doors, wall fittings and floor marks;
// its props are the game's own 3D models (design/props/models, the variants the game picks); the squad are the forms' own models (design/evolutions); the Crystal's pad and
// tank are the game's models, with the crystal, the liquid and the bubbles (which the game paints live) modelled here. THE ANT is modelled here after the game's drawing of it
// (js/bugs3d.js: the same parts and measures; its heights raised by half, because the drawing is seen from above and a model is seen from every side): a stand-in.
// World units: a tile is 1; game (x, y) is three.js (x, z); a height of H game pixels is H / 73.5 (as the bakers have it).
// In scope: T, FORMS, FORMS2, M, EL, setElementColour, G, cbox, cyl, torus (forms-core.js), PROPS, px (the props), the kit, and `map` (export.js's JSON).

const UH = 73.48469228349533, WALL_H = map.wallH / UH, WALL_T = 0.8, CUT_H = 0.26, DOOR_H = 1.32;
const TANK = map.tank || { r: 0.56, z0: 26, z1: 192, fill: 0.84, gemZ: 104 }, cellKey = (x, y) => x + ',' + y;
const PAL = Object.assign({ ink: '#16303a', cap: '#f1f8fa', wallLit: '#c6dae1', wallDark: '#a3c0ca', wallBase: '#3d93a0', floorA: '#d8e8ec', floorB: '#b4cdd5', cyan: '#31e8ff', blue: '#3a7bff', violet: '#9a5cff', amber: '#f2b13a', teal: '#4f9aa0' }, map.pal || {});
const ANT_COLOUR = map.antColour || '#aa55ff';

// ── a room's record (export.js) made ready: its tiles, and its walls and doors with which way is out of the room ──
function roomOf(rec) {
  const CELLS = new Set(rec.cells.map(c => cellKey(c[0], c[1]))), inRoom = (x, y) => CELLS.has(cellKey(Math.round(x), Math.round(y)));
  const WALLS = rec.walls.map(w => { const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L; let nx = uy, ny = -ux; const mx = (w.a[0] + w.b[0]) / 2, my = (w.a[1] + w.b[1]) / 2;
    if (inRoom(mx + nx * 0.5, my + ny * 0.5)) { nx = -nx; ny = -ny; } return { a: w.a, b: w.b, L, u: [ux, uy], n: [nx, ny], mid: [mx, my] }; });   // n: out of the room
  const DOORS = rec.doors.map(d => { const mx = (d.a[0] + d.b[0]) / 2, my = (d.a[1] + d.b[1]) / 2, dx = d.b[0] - d.a[0], dy = d.b[1] - d.a[1], L = Math.hypot(dx, dy); let nx = dy / L, ny = -dx / L; if (inRoom(mx + nx * 0.5, my + ny * 0.5)) { nx = -nx; ny = -ny; } return { id: d.id, a: d.a, b: d.b, L, u: [dx / L, dy / L], n: [nx, ny], mid: [mx, my] }; });
  return { CH: rec, CRYSTAL: rec.crystal, CELLS, inRoom, WALLS, DOORS };
}
// the Crystal Chamber, the room of the ten pictures: its walls (which are cut down so the camera sees in is the look's, cutDir)
const ROOM0 = roomOf(map.chamber), CH = ROOM0.CH, CRYSTAL = ROOM0.CRYSTAL, CELLS = ROOM0.CELLS, inRoom = ROOM0.inRoom, WALLS = ROOM0.WALLS, DOORS = ROOM0.DOORS;

// ── the room's own colours and materials (a look replaces what it wants) ──
function wallTexture(o) {   // one tile of wall: the dark base, the groove the neon seam sits in, the body, a join, the line under the cap
  o = Object.assign({ base: PAL.wallBase, body: '#c3d8df', join: 'rgba(22,48,58,0.16)', groove: '#1d5560', line: 'rgba(22,48,58,0.55)', baseShade: 'rgba(0,0,0,0.12)' }, o);
  return canvasTex(128, 212, (g, w, h) => { const b = Math.round(h * 0.2); g.fillStyle = o.body; g.fillRect(0, 0, w, h); g.fillStyle = o.base; g.fillRect(0, h - b, w, b); g.fillStyle = o.baseShade; g.fillRect(0, h - 8, w, 8);
    g.fillStyle = o.groove; g.fillRect(0, h - b - 5, w, 5); g.fillStyle = o.join; g.fillRect(0, 0, 2, h - b - 5); g.fillStyle = o.line; g.fillRect(0, 0, w, 4); });
}
function floorTexture(o) { o = Object.assign({ a: '#c9dce1', line: 'rgba(60,110,125,0.32)', shine: 'rgba(255,255,255,0.35)' }, o);
  return canvasTex(128, 128, (g, w, h) => { g.fillStyle = o.a; g.fillRect(0, 0, w, h); g.strokeStyle = o.line; g.lineWidth = 3; g.strokeRect(0, 0, w, h); g.strokeStyle = o.shine; g.lineWidth = 1.5; g.beginPath(); g.moveTo(3, h - 3); g.lineTo(3, 3); g.lineTo(w - 3, 3); g.stroke(); }); }
function hazardTexture(a, b) { return canvasTex(128, 128, (g, w, h) => { g.fillStyle = b || '#1a2026'; g.fillRect(0, 0, w, h); g.fillStyle = a || PAL.amber; for (let i = -2; i < 4; i++) { g.beginPath(); g.moveTo(i * 64, h); g.lineTo(i * 64 + 32, h); g.lineTo(i * 64 + 32 + h, 0); g.lineTo(i * 64 + h, 0); g.closePath(); g.fill(); } }, { repeat: true }); }
function basePalette() {
  const floorMat = new T.MeshStandardMaterial({ map: floorTexture(), roughness: 0.42, metalness: 0.08 }), steel = std('#aeb8c4', { metalness: 0.85, roughness: 0.32 });
  return {
    floor: floorMat, floorSide: std('#8fb0ba', { roughness: 0.7 }), outside: std('#1a2a36', { roughness: 0.8 }), ground: std('#0b141b', { roughness: 0.95 }),
    wallFace: new T.MeshStandardMaterial({ map: wallTexture(), roughness: 0.62, metalness: 0.05 }), wallCap: std(PAL.cap, { roughness: 0.5 }), wallBack: std('#7f9aa5', { roughness: 0.8 }),
    cutFace: std('#9db8c2', { roughness: 0.7 }), cutTop: std(PAL.ink, { roughness: 0.6 }), seam: glowMat(PAL.cyan, 1.0),
    steel, steelDk: std('#5d6874', { metalness: 0.8, roughness: 0.4 }), frame: std('#dfeaee', { roughness: 0.5 }), doorWindow: glowMat(PAL.cyan, 0.9), lampOpen: glowMat(PAL.cyan, 1), hazard: new T.MeshStandardMaterial({ map: hazardTexture(), roughness: 0.6 }),
    teal: std(PAL.teal, { roughness: 0.45, metalness: 0.25 }), tealDk: std('#2f6a73', { roughness: 0.5, metalness: 0.3 }), graphite: std('#1c2027', { roughness: 0.45, metalness: 0.7 }), pipe: std('#e0a23a', { roughness: 0.4, metalness: 0.5 }),
    screen: glowMat('#6adfff', 0.95), screenBlue: glowMat(PAL.blue, 1.0), lightBar: glowMat('#eaffff', 1.0), amber: std(PAL.amber, { roughness: 0.5 }), amberGlow: glowMat(PAL.amber, 1), violetGlow: glowMat('#b57bff', 1), white: std('#f4f8fa', { roughness: 0.6 }),
    ringGlow: [PAL.cyan, 0.85], ringDash: ['#6adfff', 0.55], ringAmber: ['#ffd34d', 0.5], scorch: ['#0c0c10', 0.12], stain: ['#2a1a10', 0.1],
    crystal: new T.MeshStandardMaterial({ color: lin('#2f8cff'), emissive: lin('#1f6dff'), emissiveIntensity: 1.1, roughness: 0.12, metalness: 0.1, flatShading: true }), crystalCore: glowMat('#bfe9ff', 1.0),
    liquid: new T.MeshStandardMaterial({ color: lin('#58d8ff'), emissive: lin('#1fa8e0'), emissiveIntensity: 0.55, transparent: true, opacity: 0.3, roughness: 0.1, depthWrite: false, side: T.DoubleSide }), bubble: glowMat('#d8f6ff', 0.9, { transparent: true, opacity: 0.75 }),
    crystalLight: { hex: '#6adfff', intensity: 1.6, dist: 9 },
    chitin: tint => { const c = new T.Color('#17171c').lerp(new T.Color(tint), 0.14); const m = new T.MeshStandardMaterial({ roughness: 0.34, metalness: 0.35 }); m.color = c.convertSRGBToLinear(); return m; }, jawTip: std('#a59cb2', { roughness: 0.3, metalness: 0.5 }), leg: std('#141416', { roughness: 0.4, metalness: 0.3 }),
    cutDir: [1, 1],   // walls and doors on this side of the room are cut down (towards the camera, in plan)
  };
}

// ── small builders ──
const at3 = (m, x, y, z) => { m.position.set(x, y, z); return m; };
function rodBetween(a, b, r, mat, seg) { const d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]), l = d.length() || 1e-4, m = new T.Mesh(new T.CylinderGeometry(r, r, l, seg || 8), mat); m.position.set((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); return m; }
// a skin over rings of points (each ring the same count), closed at both ends: the game's "dome of stacked outlines" as a surface
function loft(rings, mat) {
  const n = rings[0].length, pos = [], idx = []; for (const r of rings) for (const p of r) pos.push(p[0], p[1], p[2]);
  for (let i = 0; i + 1 < rings.length; i++) for (let j = 0; j < n; j++) { const a = i * n + j, b = i * n + (j + 1) % n, c = (i + 1) * n + j, d = (i + 1) * n + (j + 1) % n; idx.push(a, c, b, b, c, d); }
  const cap = (ri, flip) => { const r = rings[ri], c = [0, 0, 0]; for (const p of r) { c[0] += p[0] / n; c[1] += p[1] / n; c[2] += p[2] / n; } const ci = pos.length / 3; pos.push(c[0], c[1], c[2]); for (let j = 0; j < n; j++) { const a = ri * n + j, b = ri * n + (j + 1) % n; if (flip) idx.push(ci, a, b); else idx.push(ci, b, a); } };
  cap(0, true); cap(rings.length - 1, false);
  const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setIndex(idx); geo.computeVertexNormals(); const m = new T.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m;
}
function setShadows(root, cast, recv) { root.traverse(o => { if (o.isMesh) { o.castShadow = cast !== false; o.receiveShadow = recv !== false; } }); return root; }

// ── THE ROOM ──
function buildChamber(P, opt) { return buildRoom(ROOM0, P, opt); }
// a room (roomOf) built: R's tiles, walls and doors, its floor marks, wall fittings and props. opt.shell === false leaves out the ground, the floor, the walls and the doors, and puts
// fittings on every far wall (the live page's lab floor builds one shell for all its rooms: design/style-evolution/live/floor.js)
function buildRoom(R, P, opt) {
  opt = opt || {}; const CH = R.CH, CRYSTAL = R.CRYSTAL, inRoom = R.inRoom, WALLS = R.WALLS, DOORS = R.DOORS, shell = opt.shell !== false, g = new T.Group(), parts = { props: {} };
  const cutN = n => n[0] * P.cutDir[0] + n[1] * P.cutDir[1] > 0.01, same = (p, q) => Math.abs(p[0] - q[0]) < 0.01 && Math.abs(p[1] - q[1]) < 0.01;
  const cut = (n, w) => cutN(n) || (shell && !!w && DOORS.some(d => cutN(d.n) && (same(d.a, w.a) || same(d.a, w.b) || same(d.b, w.a) || same(d.b, w.b))));   // (a door's alcove is cut down with its door)
  if (shell) {
  // the ground outside, and a dark apron of floor beyond each door
  if (P.ground) { const gr = new T.Mesh(new T.PlaneGeometry(120, 120), P.ground); gr.rotation.x = -Math.PI / 2; gr.position.set(13, -0.13, 18.5); gr.receiveShadow = true; g.add(gr); parts.ground = gr; }
  // the floor: a slab a tile
  const fl = new T.InstancedMesh(new T.BoxGeometry(1, 0.12, 1), [P.floorSide, P.floorSide, P.floor, P.floorSide, P.floorSide, P.floorSide], CH.cells.length), m4 = new T.Matrix4(), col = new T.Color();
  CH.cells.forEach((c, i) => { m4.makeTranslation(c[0], -0.06, c[1]); fl.setMatrixAt(i, m4); const v = ((c[0] * 7 + c[1] * 13) % 5) / 5; col.setRGB(1 - v * 0.035, 1 - v * 0.03, 1 - v * 0.025); if (P.floorTint) P.floorTint(c, col, v); fl.setColorAt(i, col); });
  fl.receiveShadow = true; g.add(fl); parts.floor = fl;
  if (P.outside) for (const d of DOORS) { const ap = new T.Mesh(new T.BoxGeometry(d.u[0] ? d.L + 1.6 : 2.6, 0.12, d.u[1] ? d.L + 1.6 : 2.6), P.outside); ap.position.set(d.mid[0] + d.n[0] * 1.3, -0.065, d.mid[1] + d.n[1] * 1.3); ap.receiveShadow = true; g.add(ap); }
  // the walls: a piece a tile, full height where the camera sees their face, cut down where it would look through their back; a corner piece where two turn outwards
  const full = [], low = []; const convexEnd = (w, E, dir) => !inRoom(E[0] + w.u[0] * dir * 0.5 - w.n[0] * 0.5, E[1] + w.u[1] * dir * 0.5 - w.n[1] * 0.5);
  for (const w of WALLS) { const list = cut(w.n, w) ? low : full, n = Math.round(w.L);
    for (let i = 0; i < n; i++) { const t = (i + 0.5) / n; list.push({ x: w.a[0] + (w.b[0] - w.a[0]) * t + w.n[0] * WALL_T / 2, z: w.a[1] + (w.b[1] - w.a[1]) * t + w.n[1] * WALL_T / 2, rot: w.u[0] ? 0 : Math.PI / 2, len: w.L / n }); }
    for (const [E, dir] of [[w.a, -1], [w.b, 1]]) if (convexEnd(w, E, dir)) list.push({ x: E[0] + w.u[0] * dir * WALL_T / 2 + w.n[0] * WALL_T / 2, z: E[1] + w.u[1] * dir * WALL_T / 2 + w.n[1] * WALL_T / 2, rot: w.u[0] ? 0 : Math.PI / 2, len: WALL_T, corner: true }); }
  const lay = (list, h, mats, y0) => { if (!list.length) return null; const im = new T.InstancedMesh(new T.BoxGeometry(1, h, WALL_T), mats, list.length), q = new T.Quaternion(), s = new T.Vector3(), p = new T.Vector3();
    list.forEach((e, i) => { q.setFromAxisAngle(new T.Vector3(0, 1, 0), e.rot); s.set(e.len, 1, 1); p.set(e.x, (y0 || 0) + h / 2, e.z); m4.compose(p, q, s); im.setMatrixAt(i, m4); }); im.castShadow = true; im.receiveShadow = true; g.add(im); return im; };
  parts.walls = lay(full, opt.wallH || WALL_H, [P.wallFace, P.wallFace, P.wallCap, P.wallCap, P.wallFace, P.wallFace]);
  parts.cutWalls = lay(low, CUT_H, [P.cutFace, P.cutFace, P.cutTop, P.cutTop, P.cutFace, P.cutFace]);
  if (opt.upper && P.wallUpper) { parts.upper = lay(full, opt.upper, [P.wallUpper, P.wallUpper, P.wallCap, P.wallUpper, P.wallUpper, P.wallUpper], WALL_H);   // (seen from inside the room, a wall goes on up: a plain upper tier with a strip of light)
    if (P.lightBar) for (const w of WALLS) if (!cut(w.n, w)) { const s2 = new T.Mesh(new T.BoxGeometry(w.u[0] ? w.L - 0.4 : 0.05, 0.06, w.u[1] ? w.L - 0.4 : 0.05), P.lightBar); s2.position.set(w.mid[0] - w.n[0] * 0.03, WALL_H + opt.upper - 0.5, w.mid[1] - w.n[1] * 0.03); s2.userData.noInk = true; g.add(s2); } }
  for (const w of [parts.walls, parts.cutWalls]) if (w) w.userData.inkIds = [0, 0, 1, 1, 0, 0];   // (the ink line: along a wall's top edge, never between its pieces)
  // the neon seam where the base meets the body, on the faces the camera sees
  if (P.seam) for (const w of WALLS) if (!cut(w.n, w)) { const s = new T.Mesh(new T.BoxGeometry(w.u[0] ? w.L : 0.03, 0.028, w.u[1] ? w.L : 0.03), P.seam); s.position.set(w.mid[0] - w.n[0] * 0.012, WALL_H * 0.2 + 0.012, w.mid[1] - w.n[1] * 0.012); s.userData.noInk = true; g.add(s); }
  // the doors: steel access doors, slid open (the raid is coming through them); cut down with their wall
  parts.doors = []; for (const d of DOORS) { const dg = new T.Group(), low2 = cutN(d.n), H = low2 ? CUT_H : WALL_H, ph = low2 ? CUT_H * 0.9 : DOOR_H, along = d.u[0] ? 'x' : 'z', depth = WALL_T * 0.55;
    const box = (len, h, dep, mat) => new T.Mesh(new T.BoxGeometry(along === 'x' ? len : dep, h, along === 'x' ? dep : len), mat), put = (m, t, y, off) => { m.position.set(d.mid[0] + d.u[0] * t + d.n[0] * (off || 0), y, d.mid[1] + d.u[1] * t + d.n[1] * (off || 0)); dg.add(m); return m; };
    const fh = low2 ? CUT_H + 0.06 : WALL_H;   // (the frame's posts stand inside the opening, a hair off the alcove's walls; cut down, they stand a little proud of the cut)
    for (const s of [-1, 1]) { put(box(0.15, fh, depth, P.frame), s * (d.L / 2 - 0.085), fh / 2, depth / 2 - 0.06); put(box(d.L * 0.2, ph, 0.09, P.steel), s * (d.L / 2 - 0.16 - d.L * 0.1), ph / 2, depth / 2 - 0.06); put(box(0.05, ph, 0.1, P.hazard), s * (d.L / 2 - 0.16 - d.L * 0.2 - 0.025), ph / 2, depth / 2 - 0.06); }
    if (!low2) { put(box(d.L - 0.02, WALL_H - DOOR_H, depth, P.frame), 0, DOOR_H + (WALL_H - DOOR_H) / 2, depth / 2 - 0.06); const lamp = put(box(0.5, 0.07, 0.04, P.lampOpen), 0, DOOR_H + 0.14, -0.08); lamp.userData.noInk = true; }
    const th = put(box(d.L, 0.012, 0.5, P.hazard), 0, 0.008, 0.1); th.receiveShadow = true; const line = put(box(d.L, 0.014, 0.05, P.lampOpen), 0, 0.012, -0.2); line.userData.noInk = true;
    setShadows(dg); dg.userData.inkGroup = true; g.add(dg); parts.doors.push(dg); }
  }
  // the floor's marks: the rings round the Crystal, the cables, the hazard zones by the doors, a scorch, a stain, papers, debris
  const marks = new T.Group(); marks.userData.inkGroup = true; g.add(marks); parts.marks = marks;
  for (const d of CH.decor) {
    if (d.kind === 'ring') { const st = d.glow ? P.ringGlow : (d.colour === '#ffd34d' ? P.ringAmber : P.ringDash); if (!st) continue; if (d.dashed) { const n = Math.round(d.radius * 9); for (let i = 0; i < n; i++) decalRing(marks, d.at, d.radius, 0.035, st[0], st[1], i / n, (i + 0.55) / n); } else decalRing(marks, d.at, d.radius, 0.06, st[0], st[1]); }
    else if (d.kind === 'cables' && P.cable !== null) { const mat = std(d.colour, { roughness: 0.6 }); for (let i = 0; i + 1 < d.path.length; i++) { const a = d.path[i], b = d.path[i + 1], r = rodBetween([a[0], 0.03, a[1]], [b[0], 0.03, b[1]], 0.03, mat, 8); r.castShadow = true; marks.add(r); marks.add(at3(new T.Mesh(new T.SphereGeometry(0.03, 8, 6), mat), b[0], 0.03, b[1])); } }
    else if (d.kind === 'hazard' && P.hazard) { const w = d.rect[2] - d.rect[0], h = d.rect[3] - d.rect[1], mat = P.hazard.clone(); if (mat.map) { mat.map = mat.map.clone(); mat.map.needsUpdate = true; mat.map.repeat.set(w, h); } mat.transparent = true; mat.opacity = P.hazardFloor === undefined ? 0.22 : P.hazardFloor; mat.depthWrite = false; mat.polygonOffset = true; mat.polygonOffsetFactor = -1;
      const q = new T.Mesh(new T.PlaneGeometry(w, h), mat); q.rotation.x = -Math.PI / 2; q.position.set((d.rect[0] + d.rect[2]) / 2, 0.006, (d.rect[1] + d.rect[3]) / 2); q.userData.noInk = true; q.receiveShadow = true; marks.add(q);
      const edge = [[d.rect[0], d.rect[1]], [d.rect[2], d.rect[1]], [d.rect[2], d.rect[3]], [d.rect[0], d.rect[3]], [d.rect[0], d.rect[1]]]; decalLine(marks, edge, 0.07, PAL.amber, 0.8); }
    else if (d.kind === 'scorch' && P.scorch) decalDisc(marks, d.at, d.radius, P.scorch[0], P.scorch[1]);
    else if (d.kind === 'stain' && P.stain) decalDisc(marks, d.at, d.radius, P.stain[0], P.stain[1]);
    else if (d.kind === 'papers' && P.white) for (let i = 0; i < (d.n || 5); i++) { const a = i * 2.4, r = d.radius * (0.25 + (i * 37 % 10) / 14), q = new T.Mesh(new T.BoxGeometry(0.2, 0.006, 0.27), P.white); q.position.set(d.at[0] + Math.cos(a) * r, 0.004, d.at[1] + Math.sin(a) * r); q.rotation.y = i * 1.3; q.receiveShadow = true; marks.add(q); }
    else if (d.kind === 'debris' && P.steelDk) for (let i = 0; i < (d.n || 5); i++) { const a = i * 1.9 + 0.4, r = d.radius * (0.2 + (i * 53 % 10) / 13), q = new T.Mesh(new T.BoxGeometry(0.1 + (i % 3) * 0.04, 0.05, 0.07), P.steelDk); q.position.set(d.at[0] + Math.cos(a) * r, 0.025, d.at[1] + Math.sin(a) * r); q.rotation.y = i * 0.9; q.castShadow = true; marks.add(q); }
    // (the other rooms' marks, as the game's style draws them: a rug with its border, a puddle. It draws no lane lines or arrows on a styled floor, so none here)
    else if (d.kind === 'rug' && P.rug !== null) { const r = d.rect, k = 0.08; decalPoly(marks, [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]], d.colour || '#1d2b3f', 0.6, 0.011); decalLine(marks, [[r[0] + k, r[1] + k], [r[2] - k, r[1] + k], [r[2] - k, r[3] - k], [r[0] + k, r[3] - k], [r[0] + k, r[1] + k]], 0.06, d.border || '#ffd34d', 0.8, 0.0125); }
    else if (d.kind === 'puddle' && P.puddle) { decalDisc(marks, d.at, d.radius, d.colour || P.puddle[0], P.puddle[1]); decalDisc(marks, [d.at[0] + d.radius * 0.45, d.at[1] - d.radius * 0.2], d.radius * 0.5, d.colour || P.puddle[0], P.puddle[1]); }
  }
  // the fittings on the far walls: pipes, a panel, vents, the relay's node, screens, light bars, a hazard sign, and the power pack's unit
  const fit = new T.Group(); g.add(fit); parts.fittings = fit;
  const tOf = (w, p) => (p[0] - w.a[0]) * w.u[0] + (p[1] - w.a[1]) * w.u[1];
  const onLine = (w, a, b) => Math.abs((a[0] + b[0]) / 2 * w.n[0] + (a[1] + b[1]) / 2 * w.n[1] - (w.mid[0] * w.n[0] + w.mid[1] * w.n[1])) < 0.01 && Math.abs(w.u[0] * (b[0] - a[0]) + w.u[1] * (b[1] - a[1])) > 0.5;
  const wallOf = (a, b) => (shell ? null : WALLS.find(w => { if (!onLine(w, a, b)) return false; const t = tOf(w, [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]); return t > -0.01 && t < w.L + 0.01; })) || WALLS.find(w => onLine(w, a, b));   // (a room of many walls: the one the stretch lies on)
  const onWall = (w, t, y, off, m) => { m.userData.inkGroup = true; m.userData.wall = w; m.position.set(w.a[0] + w.u[0] * t - w.n[0] * off, y, w.a[1] + w.u[1] * t - w.n[1] * off); m.rotation.y = Math.atan2(-w.n[0], -w.n[1]); fit.add(m); return m; };   // (a fitting is built facing +z, its width along x)
  for (const d of CH.decor) { if (!d.a || !d.b) continue; const w = wallOf(d.a, d.b); if (!w || cut(w.n, w)) continue; const t0 = Math.min(tOf(w, d.a), tOf(w, d.b)), t1 = Math.max(tOf(w, d.a), tOf(w, d.b)), tm = (t0 + t1) / 2, len = t1 - t0;
    if (d.kind === 'pipe' && P.pipe) { const y = (d.z || 60) / UH + 0.75, p = new T.Mesh(new T.CylinderGeometry(0.035, 0.035, len - 0.1, 10), P.pipe); p.rotation.z = Math.PI / 2; const gp = new T.Group(); gp.add(p); for (let i = 0; i < len; i += 1.5) gp.add(at3(new T.Mesh(new T.BoxGeometry(0.05, 0.1, 0.09), P.steelDk), -len / 2 + 0.4 + i, 0, -0.03)); onWall(w, tm, y, 0.06, setShadows(gp)); }
    else if (d.kind === 'panel' && P.tealDk) { const gp = new T.Group(); gp.add(new T.Mesh(new T.BoxGeometry(0.72, 0.5, 0.03), P.tealDk)); gp.add(at3(new T.Mesh(new T.BoxGeometry(0.6, 0.06, 0.035), P.steel), 0, 0.14, 0.004)); for (const x of [-0.22, 0, 0.22]) { const l = at3(new T.Mesh(new T.BoxGeometry(0.07, 0.07, 0.03), x ? P.screen : P.amberGlow), x, -0.08, 0.012); l.userData.noInk = true; gp.add(l); } onWall(w, tm, 0.92, 0.02, setShadows(gp)); }
    else if (d.kind === 'vent' && P.graphite) { const gp = new T.Group(); gp.add(new T.Mesh(new T.BoxGeometry(0.78, 0.36, 0.03), P.steelDk)); for (let i = 0; i < 5; i++) gp.add(at3(new T.Mesh(new T.BoxGeometry(0.68, 0.035, 0.035), P.graphite), 0, -0.12 + i * 0.06, 0.006)); onWall(w, tm, 1.18, 0.02, setShadows(gp)); }
    else if (d.kind === 'relay_node' && P.graphite) { const gp = new T.Group(); gp.add(new T.Mesh(new T.BoxGeometry(0.5, 0.62, 0.12), P.graphite)); gp.add(at3(new T.Mesh(new T.BoxGeometry(0.4, 0.08, 0.13), P.teal), 0, 0.2, 0.005)); const l = at3(new T.Mesh(new T.SphereGeometry(0.075, 14, 10), P.seam || P.screen), 0, -0.02, 0.07); l.userData.noInk = true; gp.add(l); gp.add(at3(new T.Mesh(new T.CylinderGeometry(0.012, 0.012, 0.3, 6), P.steel), 0.17, 0.44, 0)); onWall(w, tm, 0.86, 0.06, setShadows(gp)); parts.relayNode = gp; }
    else if (d.kind === 'screen' && P.screen) for (let i = 0; i < Math.round(len); i++) { const gp = new T.Group(); gp.add(new T.Mesh(new T.BoxGeometry(0.88, 0.52, 0.05), P.graphite || P.steelDk)); const f = at3(new T.Mesh(new T.PlaneGeometry(0.78, 0.42), P.screen), 0, 0, 0.027); f.userData.noInk = true; gp.add(f); for (let k = 0; k < 4; k++) { const b = at3(new T.Mesh(new T.PlaneGeometry(0.1, 0.06 + ((k * 7 + i * 3) % 5) * 0.05), P.screenBlue), -0.26 + k * 0.17, -0.06, 0.029); b.userData.noInk = true; gp.add(b); } onWall(w, t0 + 0.5 + i, 1.02, 0.03, setShadows(gp)); }
    else if (d.kind === 'wall_light' && P.lightBar) for (let i = 0; i < Math.round(len); i++) { const gp = new T.Group(); gp.add(new T.Mesh(new T.BoxGeometry(0.7, 0.07, 0.05), P.steelDk)); const l = at3(new T.Mesh(new T.BoxGeometry(0.62, 0.035, 0.03), P.lightBar), 0, -0.03, 0.02); l.userData.noInk = true; gp.add(l); onWall(w, t0 + 0.5 + i, WALL_H - 0.17, 0.03, gp); }
    else if (d.kind === 'hazard_sign' && P.amber) { const gp = new T.Group(), s = new T.Mesh(new T.BoxGeometry(0.3, 0.3, 0.02), P.amber); s.rotation.z = Math.PI / 4; gp.add(s); gp.add(at3(new T.Mesh(new T.BoxGeometry(0.04, 0.13, 0.025), P.graphite), 0, 0.025, 0.004)); gp.add(at3(new T.Mesh(new T.BoxGeometry(0.04, 0.04, 0.025), P.graphite), 0, -0.085, 0.004)); onWall(w, tm, 1.16, 0.015, setShadows(gp)); }
    else if (P.more) P.more(d, w, { t0, t1, tm, len, onWall, at3 });   // (the other rooms' fittings, which the chamber has none of: the live page's lab floor, design/style-evolution/live/floor.js)
  }
  for (const f of CH.fixtures) if (f.type === 'power_pack_area' && P.graphite) { const w = wallOf(f.a, f.b); if (!w || cut(w.n, w)) continue; const tm = (tOf(w, f.a) + tOf(w, f.b)) / 2, gp = new T.Group();   // "four charging capsules under a shard" (docs/STYLE-CRYSTAL-LAB.md)
    gp.add(at3(new T.Mesh(new T.BoxGeometry(2.3, 0.86, 0.2), P.graphite), 0, 0, 0)); gp.add(at3(new T.Mesh(new T.BoxGeometry(2.4, 0.1, 0.24), P.teal), 0, 0.46, 0)); gp.add(at3(new T.Mesh(new T.BoxGeometry(2.4, 0.08, 0.24), P.teal), 0, -0.45, 0));
    for (let i = 0; i < 4; i++) { const cap = at3(new T.Mesh(new T.CylinderGeometry(0.11, 0.11, 0.56, 16), P.screen), -0.78 + i * 0.52, 0, 0.1); cap.userData.noInk = true; gp.add(cap); gp.add(at3(new T.Mesh(new T.CylinderGeometry(0.125, 0.125, 0.07, 16), P.steel), -0.78 + i * 0.52, 0.31, 0.1)); gp.add(at3(new T.Mesh(new T.CylinderGeometry(0.125, 0.125, 0.07, 16), P.steel), -0.78 + i * 0.52, -0.31, 0.1)); }
    const shard = at3(new T.Mesh(new T.OctahedronGeometry(0.13, 0), P.violetGlow), 0, 0.68, 0.06); shard.scale.set(0.75, 1.5, 0.6); shard.userData.noInk = true; gp.add(shard); onWall(w, tm, 0.98, 0.1, setShadows(gp)); parts.powerPack = gp; }
  // the props: the game's own models, each the variant the game draws
  const props = new T.Group(); g.add(props); parts.propsGroup = props;
  for (const s of CH.solids) { const fam = PROPS[s.fam]; if (!fam) continue; let v = s.variant;
    if (s.kind === 'sentry' && opt.sentryAim) { const a = Math.atan2(opt.sentryAim[1] - s.c[1], opt.sentryAim[0] - s.c[0]); v = 'a' + String(((Math.round(a / (Math.PI / 8)) % 16) + 16) % 16).padStart(2, '0'); }
    if (s.states) {   // A PROP WITH STATES (the sewer kit's: view3d/gamemap.js): every state's model under one holder, the one it is in shown; each is a thing of its own (dynamic), so the room's merge leaves them and the view shows another at a call (view3d/gameview.js propState)
      const H = new T.Group(), by = {}; H.position.set(s.c[0], 0, s.c[1]); H.userData.inkGroup = true; for (const [st, vn] of s.states) { const Bs = fam.build(vn); Bs.g.traverse(o => { if (o.isSprite) o.visible = false; }); setShadows(Bs.g); Bs.g.userData.dynamic = true; Bs.g.visible = st === s.state; H.add(Bs.g); by[st] = Bs.g; }
      props.add(H); parts.props[s.id] = { g: H, marks: {}, s, states: by }; continue; }
    const B = fam.build(v); B.g.traverse(o => { if (o.isSprite) o.visible = false; }); setShadows(B.g); B.g.userData.inkGroup = true; B.g.position.set(s.c[0], 0, s.c[1]); props.add(B.g); parts.props[s.id] = { g: B.g, marks: B.marks || {}, s }; }
  // the Crystal: the pad on the floor, the glass tank standing in its well, and in it the liquid, the bubbles and the crystal
  if (CRYSTAL && PROPS.crystalpad) { const rig = new T.Group(); rig.position.set(CRYSTAL[0], 0, CRYSTAL[1]); g.add(rig); parts.rig = rig;
    const pad = PROPS.crystalpad.build('pad'); pad.g.traverse(o => { if (o.isSprite) o.visible = false; }); setShadows(pad.g); pad.g.userData.inkGroup = true; rig.add(pad.g); parts.pad = pad.g;
    const zc = (TANK.z0 + TANK.z1) / 2 / UH, hz = (TANK.z1 - TANK.z0) / 2 / UH, rAt = y => { const t = (y - zc) / hz; return t * t >= 1 ? 0.0001 : TANK.r * Math.sqrt(1 - t * t); };
    const yFill = (TANK.z0 + (TANK.z1 - TANK.z0) * (TANK.fill || 0.84)) / UH, pts = []; for (let i = 0; i <= 40; i++) { const y = TANK.z0 / UH + (yFill - TANK.z0 / UH) * i / 40; pts.push(new T.Vector2(rAt(y) * 0.95, y)); } pts.push(new T.Vector2(0.0001, yFill));
    const liquid = new T.Mesh(new T.LatheGeometry(pts, 48), P.liquid); liquid.userData.noInk = true; liquid.renderOrder = 2; rig.add(liquid); parts.liquid = liquid;
    const gem = new T.Group(), gy = (TANK.gemZ || 104) / UH; gem.position.y = gy; gem.userData.dynamic = true; const oct = new T.Mesh(new T.OctahedronGeometry(1, 0), P.crystal); oct.scale.set(0.27, 0.52, 0.27); oct.rotation.y = 0.5; gem.userData.inkGroup = true; gem.add(oct);
    const core = new T.Mesh(new T.OctahedronGeometry(1, 0), P.crystalCore); core.scale.set(0.11, 0.3, 0.11); core.rotation.y = 0.5; core.userData.noInk = true; gem.add(core); rig.add(gem); parts.gem = gem; parts.gemAt = [CRYSTAL[0], gy, CRYSTAL[1]];
    parts.bubbles = []; parts.tankSpan = [TANK.z0 / UH + 0.12, yFill - 0.08];
    if (P.bubble) for (let i = 0; i < 16; i++) { const y = TANK.z0 / UH + 0.12 + ((i * 0.37) % 1) * (yFill - TANK.z0 / UH - 0.2), a = i * 2.39, r = rAt(y) * (0.3 + (i * 0.29 % 1) * 0.55), b = new T.Mesh(new T.SphereGeometry(0.018 + (i % 3) * 0.009, 8, 6), P.bubble); b.position.set(Math.cos(a) * r, y, Math.sin(a) * r); b.userData.noInk = true; b.userData.dynamic = true; rig.add(b); parts.bubbles.push(b); }
    const tb = PROPS.crystaltank.build('back'), tf = PROPS.crystaltank.build('front'); for (const q of [tb.g, tf.g]) { q.traverse(o => { if (o.isMesh) { o.renderOrder = 3; if ([].concat(o.material).some(m => m.transparent)) o.userData.noInk = true; } }); rig.add(q); } parts.tank = [tb.g, tf.g];
  }
  return { g, parts };
}

// ── THE ANT: THE STALKER, variation D (earthy). The owner, 2026-11-22: "Earthy and the sewers look good" (docs/VIEW-3D.md, docs/DECISION-LOG.md). Drafted in design/insects/drafts.js
// (STALKER_V.D); it supersedes the look of 2026-11-13 ("Very right direction"), whose heart-shaped head, sickle jaws and slanted eyes it keeps. It faces +x; cls: worker, scout, striker,
// tank (a soldier: a bigger head and jaws). A heavy plated body in rust and sand, mottled (a colour on each vertex: no picture), short thick legs with high knees, thorns and hooked feet,
// and its front pair of legs made sickles held up, swung forward and down on a bite (`open`). Look only ("Look only for now"): the poses are the game's own (walk, open, stand).
// (size 0.5 with zk 2 is the game's own ant, measure for measure: the game's 3D view, view3d/gameview.js. As the pictures and the test page have it, it is twice as long and half as tall again.)
const ANT_W = { worker: 20, scout: 22, striker: 28, tank: 36 }, ANT_JAW_LEN = { worker: 0.9, scout: 1.05, striker: 1.15, tank: 1.3 }, ANT_ZK = 1.5;
const ANT_LOOK = { lift: 1.5, knee: 6, ankle: 3.5, reach: 0.82, scythe: 1.05, jaw: 1.25, spines: 0.8, bk: 1.38, head: 1.08, legW: 1.75, sw: 1.4, antW: 1.6, spread: 0.45, antH: 5, tipAt: 0.6,
  pal: ['#5a3418', '#b8874a', '#1a0f07'], tip: '#f2e2bd', leg: '#2b1a0d', sick: '#c99c5e', mottle: 0.9 };   // (pal: the armour's rust, its sand blotches, its dark plate edges and underside)
// YOUR CLONE (o.clone): MARK C, TEAL-TINTED ARMOUR. The owner, 2026-11-23, asked which of three marks a clone should wear (design/clones/drafts.js: A teal eyes and a stripe, B a ring at
// its feet, C teal-tinted armour): "C teal mint". Its whole body tinted teal as if grown in the lab (each colour's hue made the teal's, its saturation and lightness kept in part: the
// mottle, the plate edges and the sand sickles still read), its eyes teal (#19e6c1, your side's colour in the game's UI: js/draw.js drawHealthBar). Done once to each pose as it is built.
// The draft's C read a deep sea green on the lab's pale floor: its hue moved a little toward mint (169 to 161 degrees) and its lightness raised (x1.1 to x1.3), the agent's reading of "mint".
const ANT_CLONE = { eye: '#19e6c1', hue: '#3ee6b0', sat: [0.55, 0.25], light: 1.3 };   // (hue and light: the draft's C, #19e6c1 at 1.1, nudged a little toward mint: "teal mint")
function antCloneTint(g) { const V = ANT_CLONE, th = {}, hsl = {}, tc = new T.Color(), done = new Set(); lin(V.hue).getHSL(th);
  const tint = c => { c.getHSL(hsl); c.setHSL(th.h, Math.min(1, hsl.s * V.sat[0] + V.sat[1]), Math.min(1, hsl.l * V.light)); };
  g.traverse(m => { if (!m.isMesh) return; const mat = m.material; if (!mat || mat.isMeshBasicMaterial) return;   // (the eyes: already teal)
    const col = m.geometry.attributes.color; if (mat.vertexColors && col) { if (done.has(col)) return; done.add(col); for (let i = 0; i < col.count; i++) { tc.setRGB(col.getX(i), col.getY(i), col.getZ(i)); tint(tc); col.setXYZ(i, tc.r, tc.g, tc.b); } col.needsUpdate = true; }
    else if (!done.has(mat)) { done.add(mat); tint(mat.color); } }); }
const ANT_LEGS_3D = [{ f: 0.06, hs: 0.15, kf: 0.18, ks: 0.66, af: 0.3, as: 1.1, tf: 0.42, ts: 1.28 }, { f: -0.14, hs: 0.14, kf: -0.36, ks: 0.66, af: -0.7, as: 1.06, tf: -0.92, ts: 1.22 }];
function buildAnt(P, o) {
  o = o || {}; const V = ANT_LOOK, cls = o.cls || 'scout', soldier = cls === 'tank', s = (ANT_W[cls] || 22) / 22 * (o.size || 1), U = 0.4 * s, BK = V.bk, UB = U * BK, zk = o.zk || ANT_ZK, Z = z => z / UH * s * zk;
  const hsz = (soldier ? 1.3 : 1) * V.head, ml = (ANT_JAW_LEN[cls] || 1.05) * V.jaw, open = o.open === undefined ? 0.01 : o.open, strike = Math.min(1, open / 0.3), walk = o.walk === undefined ? 0.6 : o.walk;
  const accent = o.clone ? ANT_CLONE.eye : o.accent || ANT_COLOUR, eye = glowMat(accent, 1.0), g = new T.Group();   // (a clone's eyes teal: ANT_CLONE)
  const C0 = lin(V.pal[0]), C1 = lin(V.pal[1]), C2 = lin(V.pal[2]);
  const armour = std('#ffffff', { roughness: 0.42, metalness: 0.25 }); armour.vertexColors = true;
  const legM = std(V.leg, { roughness: 0.45, metalness: 0.3 }), tipM = std(V.tip, { roughness: 0.3, metalness: 0.45 }), sickM = std(V.sick, { roughness: 0.35, metalness: 0.35 }), LW = V.legW, SW = V.sw, TA = V.tipAt;
  // the mottle: blotches from a few sines over the body's own space (a colour a vertex), plate edges and the underside darker
  const mot = (x, y, z) => { const n = Math.sin(x * 23.1 + z * 7.3) * Math.sin(z * 19.7 - x * 5.1 + 1.3) + 0.6 * Math.sin(x * 41 + y * 37 + z * 29) + 0.35 * Math.sin((x - z) * 61 + y * 13); return Math.max(0, Math.min(1, (n - 0.15) * 1.4)); };
  const paint = (mesh, edge) => { const geo = mesh.geometry, p = geo.attributes.position, n = p.count, c = new Float32Array(n * 3), box = (geo.computeBoundingBox(), geo.boundingBox), tc = new T.Color();
    for (let i = 0; i < n; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = mot(x / s, y / s, z / s) * V.mottle, h = (y - box.min.y) / Math.max(1e-6, box.max.y - box.min.y);
      tc.copy(C0).lerp(C1, k); if (edge) tc.lerp(C2, edge(x, y, z, h)); tc.lerp(C2, Math.max(0, 0.45 - h) * 0.9); c[i * 3] = tc.r; c[i * 3 + 1] = tc.g; c[i * 3 + 2] = tc.b; }
    geo.setAttribute('color', new T.BufferAttribute(c, 3)); return mesh; };
  const NR = 20, ring = (f0, L, W, z, K, tilt) => { const r = []; for (let i = 0; i < NR; i++) { const t = i / NR * Math.PI * 2, k = K ? K[i] : 1, f = L * Math.cos(t) * k; r.push([(f0 + f) * UB, Z(z + (tilt || 0) * f * 10), W * Math.sin(t) * k * UB]); } return r; };
  const blob = (f0, L, W, z0, rz, o2) => { o2 = o2 || {}; const rings = [], nr = o2.rings || 9; for (let i = 0; i <= nr; i++) { const ph = -Math.PI / 2 + Math.PI * (i + 0.5) / (nr + 1), k = Math.sin(ph), sc = Math.cos(ph);
      const top = k > 0 && o2.ridge ? 1 + o2.ridge * k * k : 1; rings.push(ring(f0, L * sc, W * sc / top, z0 + rz * BK * k * top, o2.K, o2.tilt)); } return paint(loft(rings, armour), o2.edge); };
  const cone = (a, b, r, mat) => { const m = rodBetween(a, b, 1, mat || armour, 6), d = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]); m.geometry.dispose(); m.geometry = new T.ConeGeometry(r, d, 6); if (!mat) paint(m); return m; };
  const zb = 8 + V.lift;   // the body's height: low, on short thick legs
  // THE GASTER: four armour plates, overlapping, front to back, tipped up a little, their edges dark; a sting
  for (const [f, l, k] of [[-0.6, 0.17, 0.78], [-0.78, 0.2, 1], [-0.97, 0.19, 0.94], [-1.14, 0.15, 0.72]]) { const zz = zb + 1.2 + (-0.6 - f) * 3.2;
    g.add(blob(f, l * 1.15, 0.36 * k, zz, 5 * k, { ridge: 0.12, edge: x => Math.pow(Math.abs(Math.cos(((x / U) - f) / (l * 1.15) * Math.PI / 2)), 0.3) < 0.6 ? 0.7 : 0 })); }
  const tipF = -1.14 - 0.17, tipZ = zb + 1.2 + 0.54 * 3.2;
  g.add(cone([tipF * UB, Z(tipZ), 0], [(tipF - 0.25) * UB, Z(tipZ - 1.5), 0], 0.05 * UB, tipM));
  // THE WAIST: a node with a thorn
  g.add(blob(-0.38, 0.09, 0.08, zb, 2.6, { rings: 5 })); g.add(cone([-0.38 * UB, Z(zb + 2.2), 0], [-0.44 * UB, Z(zb + 2.2 + 4 * V.spines), 0], 0.035 * UB));
  // THE THORAX: long, its front raised (the lean stance), a plated back with three thorns along the ridge
  g.add(blob(0.0, 0.34, 0.17, zb + 1.2, 3.2, { tilt: 0.25, ridge: 0.25 }));
  for (const [f, h] of [[-0.18, 3], [0.02, 4.2], [0.2, 3.4]]) g.add(cone([f * UB, Z(zb + 1.2 + 3.2 + f * 2.5 - 0.4), 0], [(f - 0.08) * UB, Z(zb + 1.2 + 3.2 + f * 2.5 + h * V.spines), 0], 0.045 * UB));
  // THE HEAD: the approved heart shape (a soldier's more so), raised, two back-swept horns over the lobes, the eyes under a heavy brow, elbowed antennae held low
  const hf = 0.4 + 0.22 * hsz, hL = 0.22 * hsz, hW = 0.25 * hsz, hz = zb + 3.2 * BK, hr = 3.4 * hsz * BK, lobe = soldier ? 0.18 : 0.12, notch = soldier ? 0.26 : 0.18;
  const K = []; for (let i = 0; i < NR; i++) { const t = i / NR * Math.PI * 2, c = Math.cos(t), a = Math.abs(Math.atan2(Math.sin(t), c)); K.push((c > 0 ? 1 - 0.18 * c : 1) + lobe * Math.exp(-(a - 2.3) * (a - 2.3) / 0.12) - notch * Math.exp(-(a - Math.PI) * (a - Math.PI) / 0.05)); }
  g.add(blob(hf, hL, hW, hz, hr, { K, ridge: 0.1 }));
  for (const side of [-1, 1]) {
    g.add(cone([(hf - hL * 0.55) * UB, Z(hz + hr * 0.6), side * hW * 0.7 * UB], [(hf - hL * 1.45) * UB, Z(hz + hr * (0.9 + 0.5 * V.spines)), side * hW * 0.95 * UB], 0.05 * UB * hsz));
    const a = [(hf + hL * 0.02) * UB, Z(hz + hr * 0.5), side * hW * 0.9 * UB], b = [(hf + hL * 0.5) * UB, Z(hz + hr * 0.32), side * hW * 0.62 * UB], e = rodBetween(a, b, Z(1.05) * hsz, eye, 8); e.userData.noInk = true; g.add(e);
    g.add(rodBetween([(hf - hL * 0.1) * UB, Z(hz + hr * 0.82), side * hW * 0.95 * UB], [(hf + hL * 0.6) * UB, Z(hz + hr * 0.6), side * hW * 0.28 * UB], Z(1.0), legM, 6));
    const p0 = [(hf + hL * 0.6) * UB, Z(hz + hr * 0.6), side * 0.09 * UB], p1 = [(hf + hL * 0.5 + 0.1) * UB, Z(hz + V.antH), side * 0.3 * UB], p2 = [(hf + hL + 0.42) * UB, Z(hz + 3), side * 0.32 * UB]; g.add(rodBetween(p0, p1, 0.009 * s * V.antW, legM, 6)); g.add(rodBetween(p1, p2, 0.007 * s * V.antW, legM, 6)); }
  // THE JAWS: the approved sickles, longer, two teeth on the inner edge, a pale point; `open` spreads them for the bite
  for (const side of [-1, 1]) { const op = open * 1.2, b0 = hf + hL * 0.7, b1 = side * 0.12 * hsz, c0 = hf + hL + 0.12 * ml, c1 = side * (0.24 * hsz + op), d0 = hf + hL + 0.38 * ml, d1 = side * (0.22 * hsz + op), t0 = hf + hL + 0.5 * ml, t1 = side * (0.03 + op * 1.1);
    const bez = u => { const v = 1 - u, A = v * v * v, B = 3 * v * v * u, C = 3 * v * u * u, D = u * u * u; return [A * b0 + B * c0 + C * d0 + D * t0, A * b1 + B * c1 + C * d1 + D * t1]; };
    const outer = [], inner = [], tipO = [], tipI = []; for (let i = 0; i <= 10; i++) { const u = i / 10, p = bez(u), q = bez(Math.min(1, u + 0.01)), r = bez(Math.max(0, u - 0.01)); let nx = r[1] - q[1], ny = q[0] - r[0]; const nl = Math.hypot(nx, ny) || 1; nx /= nl; ny /= nl; if (ny * side < 0) { nx = -nx; ny = -ny; }
      const w = 0.09 * hsz * Math.pow(1 - u, 0.8) * (u < 0.15 ? 0.7 + 2 * u : 1), oo = [p[0] + nx * w, p[1] + ny * w], ii = [p[0] - nx * w, p[1] - ny * w]; outer.push(oo); inner.push(ii); if (u >= 0.6) { tipO.push(oo); tipI.push(ii); }
      if (i === 3 || i === 6) inner.push([p[0] - nx * (w + 0.07 * ml) + 0.03 * ml, p[1] - ny * (w + 0.07 * ml)]); }
    const blade = (pts, mat, lift, th) => { const sh = new T.Shape(pts.map(p => new T.Vector2(p[0] * UB, p[1] * UB))), m = new T.Mesh(new T.ExtrudeGeometry(sh, { depth: Z(th || 1.8), bevelEnabled: false }), mat); m.rotation.x = Math.PI / 2; m.position.y = Z(hz - 0.8) + (lift || 0); if (mat === armour) paint(m); return m; };
    const tipPts = tipO.map(p => [p[0] + 0.004, p[1] + side * 0.004]).concat(tipI.slice().reverse().map(p => [p[0] + 0.004, p[1] - side * 0.004]));   // (the pale point a hair proud of the blade, all round: no two faces in one place)
    g.add(blade(outer.concat(inner.slice().reverse()), armour)); g.add(blade(tipPts, tipM, Z(0.15), 2.1)); }
  // THE SICKLES (its front legs), in a sand shade of their own: a thick arm up from the thorax's front to an elbow over the head, the blade hanging forward and down from it,
  // serrated, its point pale. At rest (walking, standing) held high and folded, ready; on the bite (open 0.3, the game's bite pose) swung forward and down at what is in front
  const sc = V.scythe;
  for (const side of [-1, 1]) {
    const sh = [0.24 * UB, Z(zb + 2.6), side * 0.13 * UB], ex = (0.3 + 0.18 * strike) * sc, ey = zb + (5.5 * sc + 1.5) * BK - 2.5 * strike * sc, elbow = [(0.24 + ex) * UB, Z(ey), side * 0.3 * UB];
    g.add(paint(rodBetween(sh, elbow, 0.026 * s * Math.max(1, sc) * SW, armour, 7))); g.add(at3(new T.Mesh(new T.SphereGeometry(0.028 * s * Math.max(1, sc) * SW, 8, 6), legM), elbow[0], elbow[1], elbow[2]));
    // the blade, a flat curved shape in its own plane (u along it, v across), turned to hang from the elbow
    const len = 0.9 * sc, pts = [], N = 9, wAt = u => 0.075 * sc * SW * (1 - u * 0.85), cAt = u => 0.12 * sc * Math.sin(u * Math.PI); for (let i = 0; i <= N; i++) { const u = i / N; pts.push([u * len, cAt(u) + wAt(u)]); }
    const inn = []; for (let i = N; i >= 0; i--) { const u = i / N, bump = i > 0 && i < N && i % 2 === 0 ? 0.05 * sc : 0; inn.push([u * len, cAt(u) - wAt(u) - bump]); }
    const bm = new T.Mesh(new T.ExtrudeGeometry(new T.Shape(pts.concat(inn).map(p => new T.Vector2(p[0] * UB, p[1] * UB))), { depth: Z(1.2 * SW), bevelEnabled: false }), sickM);
    const tipShp = new T.Shape([[len * TA, cAt(TA) + wAt(TA) * 1.08], [len, wAt(0) * 0.17], [len, -wAt(0) * 0.17], [len * TA, cAt(TA) - wAt(TA) * 1.08]].map(p => new T.Vector2(p[0] * UB, p[1] * UB))), tm = new T.Mesh(new T.ExtrudeGeometry(tipShp, { depth: Z(1.2 * SW + 0.4), bevelEnabled: false }), tipM);
    const pivot = new T.Group(); pivot.position.set(elbow[0], elbow[1], elbow[2] - Z(0.6)); tm.position.z = -Z(0.2); pivot.add(bm); pivot.add(tm);
    pivot.rotation.z = -0.3 - 0.75 * strike; pivot.rotation.y = -side * (V.spread - 0.22 * strike); pivot.updateMatrixWorld(true);
    for (const q of [bm, tm]) { q.geometry.applyMatrix4(q.matrixWorld); q.position.set(0, 0, 0); q.rotation.set(0, 0, 0); q.updateMatrix(); g.add(q); } }   // (baked in place: a body's poses are meshes only, view3d/core.js antBody)
  // THE LEGS: the middle and hind pairs, short and thick, each knee up over the body and out to the side, an ankle, a hooked foot, a thorn on each knee; a tripod gait
  ANT_LEGS_3D.forEach((Lg, i) => { for (const side of [-1, 1]) { const ph = walk * Math.PI * 2 + ((i % 2 === 0) === (side > 0) ? 0 : Math.PI), sw = o.stand ? 0 : Math.sin(ph) * 0.42, up = o.stand ? 0 : Math.pow(Math.max(0, Math.cos(ph)), 0.5) * 5;   // (stand: every foot down, as the game draws one that is not walking)
    const R = V.reach, hip = [Lg.f * UB, Z(zb + 0.6), side * Lg.hs * UB], knee = [(Lg.f + Lg.kf * R + sw * 0.4) * U, Z(zb + V.knee + up * 0.6), side * Lg.ks * R * U], ank = [(Lg.f + Lg.af * R + sw * 0.75) * U, Z(V.ankle + up), side * Lg.as * R * U], foot = [(Lg.f + Lg.tf * R + sw) * U, Z(up * 0.4) + 0.012, side * Lg.ts * R * U];
    g.add(rodBetween(hip, knee, 0.024 * s * LW, legM, 7)); g.add(rodBetween(knee, ank, 0.017 * s * LW, legM, 7)); g.add(rodBetween(ank, foot, 0.011 * s * LW, legM, 6));
    g.add(at3(new T.Mesh(new T.SphereGeometry(0.026 * s * LW, 8, 6), legM), knee[0], knee[1], knee[2])); g.add(cone(knee, [knee[0] - 0.02 * U, knee[1] + Z(1.2 + 1.6 * V.spines), knee[2] + side * 0.05 * U], 0.022 * s * LW, legM)); } });
  if (o.clone) antCloneTint(g);
  setShadows(g); g.userData.ant = { cls, s, len: 2.95 * UB, top: Z(Math.max(hz + hr + 3, zb + 5.5 * sc + 4)), headAt: [hf * UB, Z(hz), 0], jawTip: [(hf + hL + 0.5 * ml) * UB, Z(hz - 0.8), 0] };
  return g;
}

// ── THE CAST ──
// a follower's form, posed by its own update (as design/evolutions/bake.js): its glow sprites and its pools on the floor left out; it is built facing +z
function buildForm(c) {
  EL = { color: c.color }; setElementColour(c.color);
  const B = (FORMS2[c.form] || FORMS[c.form]).build(), g = new T.Group();
  const ground = o => { for (let q = o; q; q = q.parent) if (q.userData && q.userData.ground) return true; return false; };
  if (B.update) B.update(c.t === undefined ? 0.6 : c.t, c.act || 0);
  const hidden = []; B.g.traverse(o => { if (o.isSprite || o.isLight || (M.rotWash && o.material === M.rotWash) || ground(o) || (o.isMesh && /^(Circle|Ring)/.test(o.geometry.type) && [].concat(o.material)[0].transparent)) { o.visible = false; hidden.push(o); } });   // (and its flat discs of light on the floor)
  B.g.traverse(o => { if (o.isMesh) { o.material = Array.isArray(o.material) ? o.material.map(m => m.clone()) : o.material.clone(); o.castShadow = true; o.receiveShadow = true; } });
  B.g.updateMatrixWorld(true); const box = new T.Box3();
  B.g.traverse(o => { if (o.isMesh && shownChain(o)) { o.geometry.computeBoundingBox(); box.union(o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld)); } });
  const h = box.max.y - box.min.y || 1, len = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) || 1, s = Math.min(c.h / h, (c.w || 1.2) / len);   // (as tall as c.h, no longer than c.w)
  B.g.scale.setScalar(s); B.g.position.set(-(box.min.x + box.max.x) / 2 * s, -box.min.y * s + (c.lift || 0), -(box.min.z + box.max.z) / 2 * s); g.add(B.g);
  g.userData.size = [(box.max.x - box.min.x) * s, h * s, (box.max.z - box.min.z) * s]; g.userData.form = { B, hidden }; return g;   // (form: its model's own update, and what of it is kept hidden: the live room poses it every frame)
}
// units: { key: { kind: 'form' | 'ant', at, face, ... } }; each stands at `at` facing `face`
function buildCast(P, units) {
  const g = new T.Group(), parts = {};
  for (const key of Object.keys(units)) { const c = units[key], holder = new T.Group(); let body;
    if (c.kind === 'ant') { body = buildAnt(P, c); holder.rotation.y = -Math.atan2(c.face[1] - c.at[1], c.face[0] - c.at[0]); c.top = body.userData.ant.top; }
    else { body = buildForm(c); holder.rotation.y = Math.atan2(c.face[0] - c.at[0], c.face[1] - c.at[1]); c.top = body.userData.size[1] + (c.lift || 0); }
    holder.add(body); holder.position.set(c.at[0], 0, c.at[1]); holder.userData.unit = c; holder.userData.inkGroup = true; holder.userData.form = body.userData.form || null; g.add(holder); parts[key] = holder; }
  return { g, parts };
}
// a unit's picture, alone, for the HUD (as the game's baked sprites: the studio's light, no background)
function portraitOf(renderer, env, obj, size, o) {
  o = o || {}; const sc = new T.Scene(); sc.environment = env; sc.add(new T.HemisphereLight(0xaab8cc, 0x10141a, 0.75)); const k = new T.DirectionalLight(0xfff1e2, 2.2); k.position.set(3, 6, 4); sc.add(k); const r = new T.DirectionalLight(0x6c8cff, 1.1); r.position.set(-5, 1.5, 1.5); sc.add(r);
  const c = obj.clone(true); c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); const turn = new T.Group(); turn.add(c); turn.rotation.y = o.turn === undefined ? (obj.userData.unit && obj.userData.unit.kind === 'ant' ? -2.2 : 0.7) : o.turn; sc.add(turn); sc.updateMatrixWorld(true);
  const box = new T.Box3().setFromObject(turn), ctr = box.getCenter(new T.Vector3()), sz = box.getSize(new T.Vector3()), span = Math.max(sz.x, sz.y, sz.z) * (o.fit || 1.12), el = (o.el === undefined ? 24 : o.el) * Math.PI / 180;
  const cam = new T.OrthographicCamera(-span / 2, span / 2, span / 2, -span / 2, 0.1, 100); cam.position.set(ctr.x + 0.001, ctr.y + 30 * Math.sin(el), ctr.z + 30 * Math.cos(el)); cam.lookAt(ctr); cam.updateMatrixWorld();
  const old = renderer.getSize(new T.Vector2()), oc = renderer.getClearColor(new T.Color()), oa = renderer.getClearAlpha(), sh = renderer.shadowMap.enabled; renderer.shadowMap.enabled = false;
  renderer.setSize(size, size, false); renderer.setClearColor(0x000000, 0); renderer.setRenderTarget(null); renderer.clear(); renderer.render(sc, cam);
  const cv = document.createElement('canvas'); cv.width = cv.height = size; cv.getContext('2d').drawImage(renderer.domElement, 0, 0, size, size);
  renderer.setSize(old.x, old.y, false); renderer.setClearColor(oc, oa); renderer.shadowMap.enabled = sh; return cv;
}

// ── what is in the air ──
function boltBetween(a, b, hex, o) { o = o || {}; const pts = [], n = o.n || 9, d = new T.Vector3(b[0] - a[0], b[1] - a[1], b[2] - a[2]); for (let i = 0; i <= n; i++) { const t = i / n, j = i === 0 || i === n ? 0 : (o.jag === undefined ? 0.12 : o.jag); pts.push(new T.Vector3(a[0] + d.x * t + Math.sin(i * 7.3 + 1) * j, a[1] + d.y * t + Math.cos(i * 5.1) * j, a[2] + d.z * t + Math.sin(i * 3.7 + 2) * j)); }
  const g = new T.Group(), curve = new T.CatmullRomCurve3(pts, false, 'catmullrom', o.tension === undefined ? 0.1 : o.tension), core = new T.Mesh(new T.TubeGeometry(curve, 64, o.r || 0.022, 6), glowMat('#ffffff', 1)), halo = new T.Mesh(new T.TubeGeometry(curve, 64, (o.r || 0.022) * 2.6, 6), glowMat(hex, 1, { transparent: true, opacity: 0.45, depthWrite: false }));
  core.userData.noInk = halo.userData.noInk = true; g.add(halo); g.add(core); return g; }
function glowBall(at, r, hex, o) { o = o || {}; const g = new T.Group(), c = new T.Mesh(new T.SphereGeometry(r * 0.55, 14, 10), glowMat(o.core || '#ffffff', 1)), h = new T.Mesh(new T.SphereGeometry(r, 16, 12), glowMat(hex, 1, { transparent: true, opacity: o.op === undefined ? 0.5 : o.op, depthWrite: false })); c.userData.noInk = h.userData.noInk = true; g.add(h); g.add(c); g.position.set(at[0], at[1], at[2]); return g; }
function burst(at, hex, n, r, o) { o = o || {}; const g = new T.Group(), mat = glowMat(hex, 1); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2 + 0.3, e = (i % 3 - 1) * 0.5 + 0.3, len = r * (0.5 + (i * 0.37 % 1) * 0.7), dir = [Math.cos(a) * Math.cos(e), Math.sin(e), Math.sin(a) * Math.cos(e)], s = rodBetween([dir[0] * r * 0.25, dir[1] * r * 0.25, dir[2] * r * 0.25], [dir[0] * (r * 0.25 + len), dir[1] * (r * 0.25 + len), dir[2] * (r * 0.25 + len)], o.w || 0.012, mat, 5); s.userData.noInk = true; g.add(s); } g.position.set(at[0], at[1], at[2]); return g; }
