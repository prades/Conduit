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
    // THE SEWERS' (as js/facilitysewers.js draws them, its sizes in the game's px; the looks the agent's, provisional): the big barred arch and the stream out under its bars, the outfall and its
    // pour, a brood hole, the colony's resin, the sealed hatch. A stream's colours and a hole's glow are set a frame by the view (P.flows, P.glows: the sewers' tick, below)
    else if (d.kind === 'sewer_arch' || d.kind === 'outfall' || d.kind === 'brood_hole' || d.kind === 'resin' || d.kind === 'sealed_hatch') {
      const L = h.len, px = v => v / UH, hr = (a, b) => { const q = Math.sin(seed * 0.001 + a * 78.233 + b * 37.719) * 43758.5453; return q - Math.floor(q); }, dyn = m => { m.userData.dynamic = true; m.userData.noInk = true; return m; };
      const ribbon = (pts, wd, cols, tex) => { const pos = [], uv = [], col = [], idx = []; pts.forEach((p, i) => { pos.push(p[0] - wd / 2, p[1], p[2], p[0] + wd / 2, p[1], p[2]); uv.push(0, (pts.length - 1 - i) * 0.5, 1, (pts.length - 1 - i) * 0.5); for (let k = 0; k < 2; k++) col.push(...cols(i / (pts.length - 1))); if (i) idx.push(i * 2 - 2, i * 2, i * 2 - 1, i * 2 - 1, i * 2, i * 2 + 1); });
        const geo = new T.BufferGeometry(); geo.setIndex(idx); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 4));
        return dyn(new T.Mesh(geo, new T.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide }))); };
      const streaks = () => canvasTex(16, 64, (g, w2, hh) => { g.fillStyle = '#c8c8c8'; g.fillRect(0, 0, w2, hh); for (let i = 0; i < 6; i++) { g.fillStyle = 'rgba(255,255,255,0.75)'; g.fillRect(hr(i, 1) * w2, hr(i, 2) * hh, 1.5, 8 + hr(i, 3) * 10); } }, { repeat: true });
      const lin4 = (c, a) => { const q = new T.Color(`rgb(${c[0]},${c[1]},${c[2]})`).convertSRGBToLinear(); return [q.r, q.g, q.b, a]; }, mix4 = (A, B, t) => A.map((v, i) => v + (B[i] - v) * t);
      if (d.kind === 'sewer_arch') { const H = px(168), h0 = px(92), arch = (A, s1, top, path) => { const p = path ? new T.Path() : new T.Shape(); p.moveTo(-A, 0); p.lineTo(-A, s1); p.absellipse(0, s1, A, top - s1, Math.PI, 0, true); p.lineTo(A, 0); p.lineTo(-A, 0); return p; };
        const head = arch(0.54 * L, px(100), px(184)); head.holes.push(arch(0.42 * L, h0, H, true)); add(new T.Mesh(new T.ExtrudeGeometry(head, { depth: 0.08, bevelEnabled: false, curveSegments: 20 }), std('#61666d', { roughness: 0.85 })), 0, 0, 0);   // the headwall, past the wall's top
        const dk = canvasTex(4, 64, (g, w2, hh) => { const gr = g.createLinearGradient(0, hh, 0, 0); gr.addColorStop(0, '#4a1f86'); gr.addColorStop(0.28, '#140a26'); gr.addColorStop(1, '#020103'); g.fillStyle = gr; g.fillRect(0, 0, w2, hh); }); dk.repeat.set(1 / L, 1 / H);
        const mouth = new T.Mesh(new T.ShapeGeometry(arch(0.42 * L, h0, H), 20), new T.MeshBasicMaterial({ map: dk })); mouth.userData.noInk = true; add(mouth, 0, 0, 0.004);   // the old tunnel, dark behind the bars
        const bar = std('#6f7c89', { roughness: 0.45, metalness: 0.5 }), rail = std('#7d8a97', { roughness: 0.45, metalness: 0.5 });
        for (let k = 1; k < 10; k++) { const u = 0.08 + k * 0.84 / 10, dd = (u - 0.5) / 0.42, zt = h0 + Math.sqrt(Math.max(0, 1 - dd * dd)) * (H - h0) - px(2); add(box(0.05, zt, 0.05, bar), (u - 0.5) * L, zt / 2, 0.05); }   // the bars, down
        for (const y of [px(26), h0 - px(6)]) add(box(0.84 * L, 0.07, 0.06, rail), 0, y, 0.06);
        add(box(0.16 * L, px(14), 0.03, std('#c8962e', { roughness: 0.6 })), 0, h0 + px(15), 0.1); add(box(0.12 * L, px(18), 0.11, std('#71767d', { roughness: 0.85 })), 0, H + px(7), 0.04);   // a rusted plate, the keystone
        const tex = streaks(), m = ribbon([[0, px(2), 0.08], [0, -px(4), 0.35], [0, -px(12), 0.62]], 0.6 * L, t => [1, 1, 1, 1], tex); add(m, 0, 0, 0);   // the stream, out over the sill and down into the reservoir
        if (P.flows) P.flows.push({ tex, col: m.geometry.attributes.color, speed: 0.02, stops: [[[214, 170, 255], [170, 236, 248], 0.92], [[167, 110, 238], [115, 203, 229], 0.86], [[120, 50, 220], [60, 170, 210], 0.8]] });
        h.onWall(w, h.tm, 0, 0.03, setShadows(gp)); }
      else if (d.kind === 'outfall') { const zc = px(32), cyl = (r, dep, mat, z) => { const m = new T.Mesh(new T.CylinderGeometry(r, r, dep, 24), mat); m.rotation.x = Math.PI / 2; add(m, 0, zc, z); return m; };
        cyl(0.43, 0.1, std('#6b6f75', { roughness: 0.85 }), 0.05); cyl(0.31, 0.24, std('#2a2f36', { roughness: 0.55, metalness: 0.3 }), 0.12); const hole = new T.Mesh(new T.CircleGeometry(0.25, 20), glowMat('#090510', 1)); hole.userData.noInk = true; add(hole, 0, zc, 0.242);
        const A = [0, px(14), 0.26], B = [0, px(4), 0.5], C = [0, -px(12), 0.76], pts = []; for (let i = 0; i <= 6; i++) { const t = i / 6; pts.push([0, 1, 2].map(k => (1 - t) * (1 - t) * A[k] + 2 * (1 - t) * t * B[k] + t * t * C[k])); }
        const c0 = lin4([206, 150, 255], 0.95), c1 = lin4([130, 60, 230], 0.85), tex = streaks(); add(ribbon(pts, 0.26, t => mix4(c0, c1, t), tex), 0, 0, 0); if (P.flows) P.flows.push({ tex, speed: 0.03 });   // (its pour stays violet: the tanks leak what they leak)
        h.onWall(w, h.tm, 0, 0.02, setShadows(gp)); }
      else if (d.kind === 'brood_hole') { const n = 12, js = []; for (let k = 0; k < n; k++) js.push(0.78 + 0.22 * hr(k, 4));
        const outline = e => { const s = new T.Shape(); for (let k = 0; k <= n; k++) { const a = (k % n) / n * Math.PI * 2, j = js[k % n] + e, x = Math.cos(a) * 0.36 * L * j, y = Math.max(0, px(17) + Math.sin(a) * px(15) * j); k ? s.lineTo(x, y) : s.moveTo(x, y); } return s; };
        add(new T.Mesh(new T.ShapeGeometry(outline(0.18)), std('#7a8c3a', { roughness: 0.3 })), 0, 0, 0.004); const hole = new T.Mesh(new T.ShapeGeometry(outline(0)), glowMat('#050604', 1)); hole.userData.noInk = true; add(hole, 0, 0, 0.008);   // the resin round it, the gallery
        const gl = dyn(new T.Mesh(new T.PlaneGeometry(0.5 * L, px(16)), new T.MeshBasicMaterial({ map: canvasTex(32, 16, (g, w2, hh) => { const r = g.createRadialGradient(w2 / 2, hh / 2, 0, w2 / 2, hh / 2, w2 / 2); r.addColorStop(0, 'rgba(255,255,255,1)'); r.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = r; g.fillRect(0, 0, w2, hh); }), color: 0x8cff5a, transparent: true, opacity: 0, blending: T.AdditiveBlending, depthWrite: false })));
        add(gl, 0, px(14), 0.012); if (P.glows) P.glows.push({ m: gl, k: 0.6, ph: seed % 7 });   // the brood's green deep in it, with the Nest's state
        h.onWall(w, h.tm, 0, 0.005, gp); }
      else if (d.kind === 'resin') { const mat = std('#7a8a38', { roughness: 0.3, transparent: true, opacity: 0.62 });
        for (let k = 0; k < 5; k++) { const u0 = k / 5 + hr(k, 1) * 0.05, u1 = Math.min(1, u0 + 0.16 + hr(k, 2) * 0.08), z1 = px(24 + hr(k, 3) * 60); add(new T.Mesh(new T.PlaneGeometry((u1 - u0) * L, z1), mat), ((u0 + u1) / 2 - 0.5) * L, z1 / 2, 0.004 + k * 0.001); }
        h.onWall(w, h.tm, 0, 0.004, gp); }
      else { const Hh = px(112), rail = std('#8e9cab', { roughness: 0.4, metalness: 0.5 }), rung = std('#b9c6d3', { roughness: 0.4, metalness: 0.5 }), rust = std('#c26a2e', { roughness: 0.5 });   // the sealed hatch
        for (const u of [0.18, 0.82]) add(box(0.045, Hh - px(26), 0.045, rail), (u - 0.5) * L, (Hh - px(26)) / 2, 0.1);
        for (let z = 10; z < 82; z += 11) add(box(0.64 * L, 0.03, 0.03, rung), 0, px(z), 0.1);
        add(box(1.5 * L, px(28), 0.06, std('#3b434c', { roughness: 0.7 })), 0, Hh - px(14), 0.03); add(box(1.24 * L, px(20), 0.07, std('#252b31', { roughness: 0.7 })), 0, Hh - px(14), 0.032);
        for (const s of [1, -1]) { const b = box(Math.hypot(1.2 * L, px(16)), 0.045, 0.045, rust); b.rotation.z = s * Math.atan2(px(16), 1.2 * L); add(b, 0, Hh - px(14), 0.08); }   // its lid welded shut
        add(box(0.6 * L, px(10), 0.02, std('#f0b030', { roughness: 0.5 })), 0, px(75), 0.075); h.onWall(w, h.tm, 0, 0.005, setShadows(gp)); } }
  };
}

// ── THE LAB FLOOR ──
// how.live (the game's own view, view3d/gameview.js):
//   every door's two leaves are made whole and can slide (door.leaves, door.set(k): 0 shut, 1 open): the game's doors open and shut as someone comes near; no door is the raid's
//   rooms on many levels: a tile stands at its own height (a cell [x, y, h], h in the game's px of height: a room's floor, a staircase's treads), with the risers between; a room's
//   things stand on its floor (rec.base, px); a wall's block stands from the lowest floor beside it to a wall's height over the highest (as the game's: js/facilityplay.js base2),
//   its stub over the highest; a door on its floor; and a deck's railing (a wall of kind deck_rail or railing_wall) is a railing, not a wall
//   a ROCK wall (the arena's, kind rock) is a block of layered rock in sand, after the owner's reference picture (below; in the game's 3D view since build 2026-11-17e, a draft behind ?draft=arena before: docs/VIEW-3D.md); a wall facing a
//   dark room (the arena's style) is dark; a ledge between two floors (the catwalk spur's over the arena) has no wall over it, its railing on the higher floor
// the wall's things the 3D builds (round2/chamber.js and moreFittings above; the game's view, view3d/gameview.js, leaves the others undrawn): only these keep a rock face flat
const BUILT_WALL_DECOR = new Set(['board', 'cable_run', 'exit_sign', 'graffiti', 'monitor_bank', 'portal_door', 'poster', 'hazard_sign', 'panel', 'pipe', 'relay_node', 'screen', 'vent', 'wall_light']);
function buildLabFloor(lab, P0, how) {
  const live = !!(how && how.live), liveDoors = live, g = new T.Group(), rest = new T.Group(), recs = lab.rooms, rooms = {}, roomAt = new Map(), K = cellKey, DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]], WHITE = [1, 1, 1], vD = DOOR_H / WALL_H;
  const B0 = live ? -0.5 : -0.12, cellH = new Map();   // (B0: how far under the floor a wall's face and a floor's edge go; cellH: a tile higher or lower than its room, in world units)
  g.add(rest);   // (what belongs to no one room: the stubs, the aprons, the ground)
  // THE SEWER DUNGEON'S ROUND JUNCTION, ROUND (the owner, 2026-11-22, circling it in the 3D view: "Can you make this area actually look circular"). The game walks it on tiles and its map's outline
  // is put on half-tile lines, so the ring came out a lumpy many-sided shape. Here, for the drawing only: the corners of the ring's and the nest's outlines that lie on its outer or its inner
  // circle are put on that circle, and every edge between two of them is an arc of short pieces (its walls and rails the same). A corner another room shares (where a walkway, a passage or
  // the channel meets the ring) stays where it is, so nothing gapes there. Nothing of the map or of where one walks changes.
  let ROUND = null;   // (the Round Junction's centre, its inner circle and its pool's room, for the pool's bowl: below)
  if (live) { const RING = recs.filter(r => /^sd_junction_(ring_[we]|nest)$/.test(r.id) && r.poly), nest = RING.find(r => /nest$/.test(r.id));
    if (nest && RING.length > 1) { const bb = nest.poly.reduce((q, p) => [Math.min(q[0], p[0]), Math.min(q[1], p[1]), Math.max(q[2], p[0]), Math.max(q[3], p[1])], [1e9, 1e9, -1e9, -1e9]), C = [(bb[0] + bb[2]) / 2, (bb[1] + bb[3]) / 2];
      const dist = p => Math.hypot(p[0] - C[0], p[1] - C[1]), med = a => a.slice().sort((x, y) => x - y)[Math.floor(a.length / 2)], RI = med(nest.poly.map(dist)), RO = med(RING.filter(r => r !== nest).flatMap(r => r.poly.map(dist)).filter(d => d > RI + 1.2));
      const pk = p => p[0].toFixed(2) + ',' + p[1].toFixed(2), shared = new Set(); for (const r of recs) if (RING.indexOf(r) < 0 && r.poly && typeof r.id === 'string' && r.id.slice(0, 3) === 'sd_') for (const p of r.poly) shared.add(pk(p));
      const cls = p => Math.abs(dist(p) - RO) < 0.95 ? RO : Math.abs(dist(p) - RI) < 0.95 ? RI : 0, moved = new Map();   // (which circle a corner lies on, or 0; where each corner goes)
      const put = p => { const k = pk(p); if (moved.has(k)) return moved.get(k); const R = cls(p), d = dist(p), q = !R || shared.has(k) || d < 1e-6 ? p : [C[0] + (p[0] - C[0]) * R / d, C[1] + (p[1] - C[1]) * R / d]; moved.set(k, q); return q; };
      const arc = (a, b) => { if (!cls(a) || cls(a) !== cls(b)) return [put(a), put(b)]; const A = put(a), B = put(b), a0 = Math.atan2(A[1] - C[1], A[0] - C[0]); let da = Math.atan2(B[1] - C[1], B[0] - C[0]) - a0; while (da > Math.PI) da -= 2 * Math.PI; while (da < -Math.PI) da += 2 * Math.PI;
        const r0 = dist(A), r1 = dist(B), n = Math.max(1, Math.ceil(Math.abs(da) * cls(a) / 1.0)), out = []; for (let i = 0; i <= n; i++) { const t = i / n, r = r0 + (r1 - r0) * t; out.push(i === 0 ? A : i === n ? B : [C[0] + Math.cos(a0 + da * t) * r, C[1] + Math.sin(a0 + da * t) * r]); } return out; };
      for (const r of RING) { const P = [], src = r.poly.filter((p, i, a) => Math.hypot(p[0] - a[(i + a.length - 1) % a.length][0], p[1] - a[(i + a.length - 1) % a.length][1]) > 1e-6);
        for (let i = 0; i < src.length; i++) { const seg = arc(src[i], src[(i + 1) % src.length]); for (let j = 0; j < seg.length - 1; j++) P.push(seg[j]); }
        const W = []; for (const w0 of r.walls) { if (Math.hypot(w0.b[0] - w0.a[0], w0.b[1] - w0.a[1]) < 1e-6) continue; const seg = arc(w0.a, w0.b); for (let j = 0; j < seg.length - 1; j++) W.push(Object.assign({}, w0, { a: seg[j], b: seg[j + 1] })); }
        r.poly = P; r.walls = W; } ROUND = { C, RI, nest: nest.id, ring: RING.find(r => r !== nest).id }; } }
  for (const rec of recs) { rooms[rec.id] = { id: rec.id, rec, R: roomOf(rec), g: new T.Group(), label: rec.label || rec.id, style: rec.style || { acc: PAL.cyan, wain: PAL.wallBase, fa: PAL.floorA, fb: PAL.floorB } }; g.add(rooms[rec.id].g); for (const c of rec.cells) { roomAt.set(K(c[0], c[1]), rec.id); if (live && c[2]) cellH.set(K(c[0], c[1]), c[2] / UH); } }
  const hAt = (x, y) => cellH.get(K(x, y)) || 0, baseOf = id => live && rooms[id] ? (rooms[id].rec.base || 0) / UH : 0;
  let minH = 0; for (const v of cellH.values()) minH = Math.min(minH, v);   // (the lowest floor: what stands over the void goes down past it)
  const at = (x, y) => roomAt.get(K(Math.round(x), Math.round(y))) || null;
  // THE SEWER DUNGEON'S SLANTED EDGES (the owner, 2026-11-22, of its first 3D pass: "some spots look really messed up. I really want to have like a smooth looking game"). Its rooms have walls and
  // edges that run on a slant (the ring, the chamfered corners, the Subway passage); the builder made every wall of tile blocks, so a slanted one came out as a staircase of blocks, loose panels
  // and posts, and the floor under it as a zigzag. For a room of the dungeon (id sd_), live: a slanted wall is one straight wall along its line, a tile thick, mitred into the walls beside it;
  // the floor is cut along the room's own outline, tile by tile. Nothing of any other room changes.
  const isSd = id => typeof id === 'string' && id.slice(0, 3) === 'sd_', diag = [];
  const inP = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  // a wall's face on any line: from p0 to p1, seen from nrm's side
  const segQuad = (q, p0, p1, nrm, y0, y1, col, v0, v1) => { if ((p1[0] - p0[0]) * nrm[1] - (p1[1] - p0[1]) * nrm[0] < 0) { const t = p0; p0 = p1; p1 = t; }
    putQuad(q, [p0[0], y0, p0[1]], [p1[0], y0, p1[1]], [p1[0], y1, p1[1]], [p0[0], y1, p0[1]], [nrm[0], 0, nrm[1]], col, [[0, v0], [1, v0], [1, v1], [0, v1]]); };
  // a flat top of any (convex) outline at height h; uv: each point's place in the picture, or none
  const polyTop = (q, pts, h, col, uv) => { let S = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; S += a[0] * b[1] - b[0] * a[1]; } if (S > 0) pts = pts.slice().reverse();
    const U = uv || (() => [0.5, 0.5]); for (let i = 1; i + 1 < pts.length; i++) { const A = pts[0], B = pts[i], C = pts[i + 1]; putQuad(q, [A[0], h, A[1]], [B[0], h, B[1]], [C[0], h, C[1]], [C[0], h, C[1]], [0, 1, 0], col, [U(A), U(B), U(C), U(C)]); } };
  // a room's outline inside one tile (the tile's square cut out of it), or null
  const clipCell = (P, x, y) => { let pts = P; for (const [ax, sg, v] of [[0, 1, x - 0.5], [0, -1, x + 0.5], [1, 1, y - 0.5], [1, -1, y + 0.5]]) { const out = [], ins = p => sg * (p[ax] - v) >= -1e-9;
      for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length], ia = ins(a), ib = ins(b); if (ia) out.push(a); if (ia !== ib) { const t = (v - a[ax]) / (b[ax] - a[ax]); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); } }
      pts = out; if (pts.length < 3) return null; }
    pts = pts.filter((p, i) => { const o = pts[(i + pts.length - 1) % pts.length]; return Math.hypot(p[0] - o[0], p[1] - o[1]) > 1e-6; }); if (pts.length < 3) return null;
    let S = 0; for (let i = 0; i < pts.length; i++) { const a = pts[i], b = pts[(i + 1) % pts.length]; S += a[0] * b[1] - b[0] * a[1]; } return Math.abs(S) / 2 > 0.003 ? pts : null; };

  // the walls: a block a tile of the gap between rooms (band), or a thin wall on the line where two rooms touch (thin)
  const band = new Map(), thin = [], thinSeen = new Set(), rails = [], spills = [];
  for (const rec of recs) { const R = rooms[rec.id].R; rec.walls.forEach((w0, wi) => { if (w0.kind === 'open') return; const w = R.WALLS[wi]; if (live && w0.kind === 'spill') { spills.push({ w, room: rec.id }); return; }   /* (a spill lip: the sewers' own, below) */ if (live && (w0.kind === 'deck_rail' || w0.kind === 'railing_wall')) { rails.push({ w, room: rec.id }); return; }
    if (live && isSd(rec.id)) { if (!(w.L > 1e-6)) return; if (Math.abs(w.u[0]) > 1e-6 && Math.abs(w.u[1]) > 1e-6) { diag.push({ w, rec, wi }); return; } }   /* (a slanted wall: one straight wall, below) */
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
  if (live) for (const rec of recs) for (const d of rec.decor || []) { if (!d.a || !d.b || !BUILT_WALL_DECOR.has(d.kind)) continue;   // (one drawn in 3D: since 2026-11-16 the others are not drawn there)
    const L = Math.hypot(d.b[0] - d.a[0], d.b[1] - d.a[1]); for (let i = 0; i <= Math.ceil(L * 2); i++) { const t = L ? i / Math.ceil(L * 2) : 0, px = d.a[0] + (d.b[0] - d.a[0]) * t, py = d.a[1] + (d.b[1] - d.a[1]) * t;
      for (const [ox, oy] of [[0.5, 0], [-0.5, 0], [0, 0.5], [0, -0.5]]) { const b = band.get(K(Math.round(px + ox), Math.round(py + oy))); if (b && b.rock) b.flat = true; } } }

  // which rooms a block stands in front of (seen from the camera's side), and the pieces that sink together. LIVE (the game's view), for each of the camera's four quarter turns (the owner,
  // 2026-11-17: "rotate the camera", "90° steps"; js/config.js VIEW_TURN): as it looks from there. A world offset turned is (tu, tv), as the game turns it; fromT turns one back.
  const TURNS = live ? [0, 1, 2, 3] : [0];
  const tu = (t, dx, dy) => t === 0 ? dx : t === 1 ? -dy : t === 2 ? -dx : dy, tv = (t, dx, dy) => t === 0 ? dy : t === 1 ? dx : t === 2 ? -dy : -dx;
  const fromT = (t, u, v) => t === 0 ? [u, v] : t === 1 ? [v, -u] : t === 2 ? [-u, -v] : [-v, u];
  const AWAY = [[0, -1], [-1, 0], [-1, -1]];   // (away from the camera at the game's own angle: north, west and between; turned with it)
  const hideOf = (x, y, t) => { const s = [], aw = AWAY.map(d => fromT(t, d[0], d[1])); for (const [dx, dy] of aw) { const r = roomAt.get(K(x + dx, y + dy)); if (r && !s.includes(r)) s.push(r); }
    // (live: a wall more than a tile thick, the arena's north wall: a block with a room on its camera side stands in front of the room behind the wall too, straight or diagonally, and sinks with it)
    if (live) for (const [dx, dy] of aw) if (roomAt.has(K(x - dx, y - dy))) for (let k = 1; k <= 3 && band.has(K(x + dx * k, y + dy * k)); k++) { const r = roomAt.get(K(x + dx * (k + 1), y + dy * (k + 1))); if (r) { if (!s.includes(r)) s.push(r); break; } }
    return s; };
  const groups = new Map(), groupOf = hides => { const k = hides.map(h => h.join('|')).join('/'); let G = groups.get(k); if (!G) { G = { key: k, hide: hides[0], hides, g: new T.Group(), face: quads(), cap: quads(), rface: quads(), rcap: quads(), down: 0, want: 0 }; G.g.userData.dynamic = true; groups.set(k, G); g.add(G.g); } return G; };   // (hide: the game's own angle's; hides: each turn's)
  let SD_HI = -1e9; const SD_CUT = 0.03, cutT = b => b.cutTop !== undefined ? b.cutTop : b.hi + CUT_H; for (const rec of recs) if (isSd(rec.id)) SD_HI = Math.max(SD_HI, baseOf(rec.id));   // (the dungeon's highest floor; how far over its floor a cut wall of the dungeon stands)
  for (const b of band.values()) {
    let lo = 1e9, hi = -1e9; const see = list => { for (const [dx, dy] of list) if (roomAt.has(K(b.x + dx, b.y + dy))) { const h = hAt(b.x + dx, b.y + dy); lo = Math.min(lo, h); hi = Math.max(hi, h); } };
    see(DIRS); if (lo > hi) see([[1, 1], [-1, -1], [1, -1], [-1, 1]]); if (lo > hi) lo = hi = 0; b.lo = lo; b.hi = hi;
    // (THE SEWER DUNGEON: a wall beside a flight of stairs keeps one height, its room's own floor's, and does not step down with the treads. The owner, 2026-11-22, circling the stepped stubs beside
    // a flight: "Looks junk here the walls dont need to descend too")
    if (live && isSd(b.own)) { let top = -1e9; for (const [dx, dy] of DIRS.concat([[1, 1], [-1, -1], [1, -1], [-1, 1]])) { const r = roomAt.get(K(b.x + dx, b.y + dy)); if (r) top = Math.max(top, baseOf(r)); } if (top > -1e8) b.hi = Math.max(b.hi, top);
      // (EVEN TOPS: the owner, 2026-11-22: "the rooftops of these little walls and everything are not even. They're jagged and all over the place and uneven". Every wall of the dungeon stands to ONE
      // height, a wall's height over its highest floor; and a wall cut down in front of the camera is cut flush with the floor beside it, so no row of stubs of different heights is left standing.)
      b.cutTop = b.hi + SD_CUT; b.hi = SD_HI; } }   // (a corner piece: its diagonal neighbours)
  // (live: a block that could hide someone standing in a room sinks with that room too: the owner, 2026-11-16, "the rock that is obscuring the player should sink in". The camera sees a block over
  // the tiles behind it on the screen (smaller x + y, its x - y within one), as far back as its top, from that tile's floor, climbs on the screen: TILE_H 30 px of screen a step of x + y, UH px a
  // unit of height. Its top: a wall's height over its highest floor, a rock's skyline at its tallest. Measured from the feet of whoever stands there, a little over the floor.)
  const TOP_ROCK = (120 + (WALL_H * UH - 74) + 50) / UH, SEE = UH / 30, FEET = 0.15;
  const hideMore = (b, t, list) => { const top = b.hi + (b.rock ? TOP_ROCK : WALL_H), U = tu(t, b.x, b.y), V = tv(t, b.x, b.y), s0 = U + V, d0 = U - V;   // (in the turned view's x + y and x - y)
    for (let D = 1; D <= Math.ceil((top - minH) * SEE) + 1; D++) for (const sd of D % 2 ? [-1, 1] : [0]) { const [cx, cy] = fromT(t, (s0 - D + d0 + sd) / 2, (s0 - D - d0 - sd) / 2), r = roomAt.get(K(cx, cy));
      if (r && !list.includes(r) && D <= (top - hAt(cx, cy) - FEET) * SEE + 1) list.push(r); }   // (+ 1: from its back corner, a step nearer the tiles behind it than its middle)
    return list; };
  // (and a thin wall, glass or a divider, on its line m: the tiles behind it on the screen, its x - y within half a tile of the line's)
  const hideThin = (m, top, list, t) => { const U = tu(t, m[0], m[1]), V = tv(t, m[0], m[1]), s0 = U + V, d0 = U - V;
    for (let D = 0.5; D <= (top - minH) * SEE + 0.5; D += 1) for (const sd of [-0.5, 0.5]) { const [cx, cy] = fromT(t, (s0 - D + d0 + sd) / 2, (s0 - D - d0 - sd) / 2); if (Math.abs(cx - Math.round(cx)) > 1e-6 || Math.abs(cy - Math.round(cy)) > 1e-6) continue;
      const r = roomAt.get(K(cx, cy)); if (r && !list.includes(r) && D <= (top - hAt(cx, cy) - FEET) * SEE + 0.5) list.push(r); }
    return list.sort(); };
  // THE SEWER DUNGEON'S EMPTY SPACE, FILLED (the owner, 2026-11-23: "all the empty spaces, like behind walls that don't have any rooms to it. You should make that completely solid color"; of the
  // spaces only darkened, still pits: "Nope it looks incomplete"). Every tile of the dungeon's area that is no room and no wall is a block of wall too, as tall as the walls and cut down as low as
  // the wall it lies behind, so the space between rooms is one solid mass, level with the wall tops. Not a tile a slanted wall crosses (the slanted wall stands there, and part of it is floor).
  if (live && SD_HI > -1e8) { const sdR = recs.filter(r => isSd(r.id)), skip = new Set(); let bx = [1e9, 1e9, -1e9, -1e9];
    for (const r of sdR) { for (const c of r.cells) bx = [Math.min(bx[0], c[0]), Math.min(bx[1], c[1]), Math.max(bx[2], c[0]), Math.max(bx[3], c[1])];
      const P = r.poly || []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if (Math.abs(a[0] - b[0]) < 1e-6 || Math.abs(a[1] - b[1]) < 1e-6) continue; for (let x = Math.round(Math.min(a[0], b[0]) + 0.5); x <= Math.round(Math.max(a[0], b[0]) - 0.5); x++) for (let y = Math.round(Math.min(a[1], b[1]) + 0.5); y <= Math.round(Math.max(a[1], b[1]) - 0.5); y++) skip.add(K(x, y)); } }
    bx = [bx[0] - 3, bx[1] - 3, bx[2] + 3, bx[3] + 3]; let front = [...band.values()].filter(b => isSd(b.own) && !b.header);
    while (front.length) { const next = []; for (const s0 of front) for (const [dx, dy] of DIRS) { const x = s0.x + dx, y = s0.y + dy, k = K(x, y); if (x < bx[0] || y < bx[1] || x > bx[2] || y > bx[3] || band.has(k) || roomAt.has(k) || skip.has(k) || aprons.has(k)) continue;
        const b = { x, y, own: s0.own, rock: false, fill: true, lo: s0.lo, hi: s0.hi, cutTop: s0.cutTop }; band.set(k, b); next.push(b); } front = next; } }
  for (const b of band.values()) { b.hides = TURNS.map(t => { const s = hideOf(b.x, b.y, t); if (live) hideMore(b, t, s); return s.sort(); }); b.hide = b.hides[0]; b.G = groupOf(b.hides); }
  for (const G of groups.values()) G.sink = WALL_H + 0.16;
  if (live) for (const b of band.values()) b.G.sink = Math.max(b.G.sink, b.hi + WALL_H - (b.lo + B0) + 0.16);   // (how far a group sinks: past its lowest floor)

  // one picture for every room's wall face: the body, the groove the neon seam sits in, a join, the line under the cap; its base band is white, and takes each room's own colour
  const faceMat = new T.MeshStandardMaterial({ map: wallTexture({ base: '#ffffff' }), roughness: 0.62, metalness: 0.05, vertexColors: true }), seams = {}, seamOf = id => seams[id] || (seams[id] = id === 'crystal_chamber' && P0.seam ? P0.seam : glowMat(rooms[id].style.acc, 1.0));
  const wain = id => { const c = lin((rooms[id] && rooms[id].style.wain) || PAL.wallBase); return [c.r, c.g, c.b]; };
  const face = (q, b, dx, dy, y0, y1, c, z, body) => { z = z || 0; body = body || WHITE; const yb = z + WALL_H * 0.2, yt = z + WALL_H; if (y0 < yb) sideQuad(q, b.x, b.y, dx, dy, y0, Math.min(y1, yb), c, 0, (Math.min(y1, yb) - z) / WALL_H);
    if (y1 > yb && y0 < yt) sideQuad(q, b.x, b.y, dx, dy, Math.max(y0, yb), Math.min(y1, yt), body, (Math.max(y0, yb) - z) / WALL_H, (Math.min(y1, yt) - z) / WALL_H); if (y1 > yt + 1e-4) sideQuad(q, b.x, b.y, dx, dy, Math.max(y0, yt), y1, body, 0.45, 0.85); };
  const face2 = (q, p0, p1, nrm, y0, y1, c, z, body) => { body = body || WHITE; const yb = z + WALL_H * 0.2, yt = z + WALL_H; if (y0 < yb) segQuad(q, p0, p1, nrm, y0, Math.min(y1, yb), c, 0, (Math.min(y1, yb) - z) / WALL_H);   // (face, on any line: a slanted wall's)
    if (y1 > yb && y0 < yt) segQuad(q, p0, p1, nrm, Math.max(y0, yb), Math.min(y1, yt), body, (Math.max(y0, yb) - z) / WALL_H, (Math.min(y1, yt) - z) / WALL_H); if (y1 > yt + 1e-4) segQuad(q, p0, p1, nrm, Math.max(y0, yt), y1, body, 0.45, 0.85); };
  const bodyOf = id => { const st = live && rooms[id] && rooms[id].style; if (!st || !st.dark) return WHITE; const k = lin(hexMix(st.wain || '#3a3532', '#ffffff', 0.25)); return [k.r, k.g, k.b]; };   // (a face looking into a dark room, the arena's: the game draws its walls dark)   // (z: the floor it rises from; over a storey's height, between two floors, it goes on plain)
  // ROCK (the arena's rock walls; in the game's 3D view since build 2026-11-17e, a draft behind ?draft=arena before: docs/VIEW-3D.md). The owner's reference, 2026-11-16, a picture of layered cave walls: "These are nice walls"
  // (the first draft, faceted blocks, was not liked). From it, our own rock: wavy horizontal strata in lighter and darker stone, speckled with small pits, big low-poly faces pushed in
  // and out, flat facets with no smooth shading. As tall as the game's far drawn rock (168 px over its floor and up to 50 more: js/facilitydecor.js _fpRockHeights), its top a jagged
  // skyline (each corner's height from where it is, so the blocks beside it share it). In sand, the owner's pick of two (2026-11-16, of brown and sand: "I like the sand"); then, of the sand:
  // "Kind of want to switch to where the rock walls match the floor color. So I like the texture. I just want to change the color": each stratum is the cave floor's own colour (the two
  // tiles of its room's floor, a dark room's, else the arena's), as much lighter or darker as the sand's was, so the texture is the same
  const SAND = ['#9c7a4a', '#b38d58', '#c9a46a', '#a8834f', '#d6b67e', '#a07d4c', '#bd9862'], RH = (120 + (WALL_H * UH - 74)) / UH, ROWS = 7, COLS = 4, JUT_P = 0.6, JUT_MIN = 0.16, JUT_MORE = 0.26;   // (at most a little under half a tile out, so no slab overhangs the middle of the floor's first row, where someone stands against the wall)   // (JUT_: how often a stratum's slab juts out of a tile's face, and how far: the agent's, provisional)
  const sumOf = h => { const c = new T.Color(h); return c.r + c.g + c.b; }, sandMean = SAND.reduce((t, h) => t + sumOf(h), 0) / SAND.length, strataBy = {};
  // (an ICE room's own, the Cold Storage's cave, 2026-11-17: its strata in its own blues, half its walls' and half its floor's, so the rock reads as rock glazed with frost and not as its white
  //  floor; its top frost-white, and icicles under the bits that jut out, as the 2D game hangs icicles on that rock: the agent's, provisional)
  const iceOf = id => !!(rooms[id] && rooms[id].style && rooms[id].style.ice), FROST = lin('#eef9ff'), ICICLE = lin('#e2f6ff');
  const STRATA = id => { const own = rooms[id] && rooms[id].style, st = own && (own.dark || own.ice) ? own : rooms.arena && rooms.arena.style && rooms.arena.style.dark ? rooms.arena.style : null, ice = !!(st && st.ice), key = st ? st.fa + st.fb + (ice ? st.wain : '') : '';
    return strataBy[key] || (strataBy[key] = SAND.map(h => { if (!st) return lin(h); const c = new T.Color(ice ? hexMix(st.wain, hexMix(st.fa, st.fb, 0.5), 0.45) : hexMix(st.fa, st.fb, 0.5)).multiplyScalar(sumOf(h) / sandMean); return lin('#' + new T.Color(Math.min(1, c.r), Math.min(1, c.g), Math.min(1, c.b)).getHexString()); })); };
  const rnd = (x, z, k) => { let h = Math.sin(x * 12.9898 + z * 78.233 + (k || 0) * 37.719) * 43758.5453; return h - Math.floor(h); }, jag = (x, z) => rnd(x, z) * 50 / UH;
  const swell = (x, z, y) => Math.sin(x * 1.31 + z * 0.73 + y * 1.9) * 0.5 + Math.sin(x * 0.37 - z * 1.13 + y * 0.81 + 1.3) * 0.35 + Math.sin(-x * 0.93 + z * 0.47 - y * 2.6 + 4.1) * 0.15;   // (smooth, from where it is)
  const wave = (x, z) => Math.sin(x * 0.9 + z * 0.61) * 0.11 + Math.sin(x * 2.1 - z * 1.7 + 0.7) * 0.05;   // (how a stratum's edge rises and falls along the wall)
  const pits = ink => live ? canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h); g.fillStyle = ink; for (let i = 0; i < 16; i++) { const x = rnd(i, 3, 1) * w, y = rnd(i, 7, 2) * h, r = 1.2 + rnd(i, 9, 3) * 1.8; g.beginPath(); g.ellipse(x, y, r * 1.3, r, 0, 0, 6.2832); g.fill(); } }, { repeat: true }) : null;
  const speck = pits('rgba(40,26,16,0.55)'), speckIce = pits('rgba(36,78,104,0.32)');   // (small pits in the stone; in an ice room's rock, cold blue-grey ones)
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
    for (let r = 0; r < ROWS; r++) { const col = pal[r % pal.length]; for (let c = 0; c < COLS; c++) { const A = V[r][c], B = V[r][c + 1], C = V[r + 1][c + 1], D = V[r + 1][c]; tri3(A, B, C, col); tri3(A, C, D, col); } }
    // THE BITS THAT JUT OUT (the owner, 2026-11-16, of the rock in the floor's colour: "it lacks depth and it lacks three-dimensionality. It should have like little bits of wall that's hanging
    // out, irregularly"): here and there a slab of a stratum stands out of the face, part or all of the tile wide and as tall as its stratum, its front corners uneven, its top lighter and its
    // underside darker; none at the foot or the top, or where a door or a sign hangs. Its back is inside the face (past the deepest the face swells in), so no gap shows behind it.
    if (!b.flat) for (let r = 1; r < ROWS - 1; r++) { if (rnd(cx * 3.1 + r, cz * 2.7 - r, 11) > JUT_P) continue;
      const s0 = rnd(cx, cz + r, 12) * 0.55, s1 = Math.min(1, s0 + 0.3 + rnd(cx + r, cz, 13) * 0.7), e = JUT_MIN + rnd(cx - r, cz, 14) * JUT_MORE, j = k => rnd(cx + k, cz - k, r + 15) - 0.5, up = r < ROWS - 2 && rnd(cx + r, cz + r, 16) < 0.3 ? 2 : 1;   // (up: one stratum tall, or now and then two)
      const yAt = (rr, s3) => { const x = p[0] + (q[0] - p[0]) * s3, zz = p[1] + (q[1] - p[1]) * s3; let y = y0 + (ta + (tb - ta) * s3 - y0) * rr / ROWS; if (rr > 0 && rr < ROWS) y += wave(x, zz); return y; };
      const P = (s3, y, e2) => { const x = p[0] + (q[0] - p[0]) * s3 + dx * e2, zz = p[1] + (q[1] - p[1]) * s3 + dy * e2; return [x, y, zz, x * dy - zz * dx, y]; };
      const yb0 = yAt(r, s0), yb1 = yAt(r, s1), yt0 = yAt(r + up, s0), yt1 = yAt(r + up, s1), back = -0.2;
      const B0 = P(s0, yb0, back), B1 = P(s1, yb1, back), T0 = P(s0, yt0, back), T1 = P(s1, yt1, back);
      const F0 = P(s0, yb0 + j(1) * 0.06, e + j(2) * 0.08), F1 = P(s1, yb1 + j(3) * 0.06, e + j(4) * 0.08), U0 = P(s0, yt0 + j(5) * 0.05, e * (0.85 + j(6) * 0.2)), U1 = P(s1, yt1 + j(7) * 0.05, e * (0.85 + j(8) * 0.2));
      const col = pal[r % pal.length], tone = k => ({ r: col.r * k, g: col.g * k, b: col.b * k }), quad4 = (a, bb, c, d, cc) => { tri3(a, bb, c, cc); tri3(a, c, d, cc); };
      quad4(F0, F1, U1, U0, col); quad4(U0, U1, T1, T0, iceOf(b.own) ? FROST : tone(1.18)); quad4(B0, B1, F1, F0, tone(0.7)); quad4(B0, F0, U0, T0, tone(0.9)); quad4(F1, B1, T1, U1, tone(0.9));   // (its face, top, underside and two ends)
      if (iceOf(b.own)) for (let i = 0, n = 2 + Math.floor(rnd(cx + r, cz - r, 17) * 3); i < n; i++) {   // ICICLES under its front edge: a cross of two thin blades each, so they show from every quarter turn
        const s3 = s0 + (s1 - s0) * (i + 0.5) / n, w2 = 0.025 + rnd(cx + i, cz + r, 18) * 0.025, L2 = 0.1 + rnd(cx - i, cz + r, 19) * 0.22, f = P(s3, yAt(r, s3), e * 0.85), tip = [f[0], f[1] - L2, f[2], f[3], f[4] - L2];
        const along = [(q[0] - p[0]) * w2, (q[1] - p[1]) * w2], out2 = [dx * w2, dy * w2], pt = (o, k) => [f[0] + o[0] * k, f[1], f[2] + o[1] * k, f[3], f[4]];
        tri3(pt(along, -1), pt(along, 1), tip, ICICLE); tri3(pt(out2, -1), pt(out2, 1), tip, ICICLE); } } };
  // the top: the skyline's four corners, in the top stratum's colour
  const rockCap = (G, b, top) => { const x = b.x, z = b.y, h = (px, pz) => top + jag(px, pz), C = [[x - 0.5, z + 0.5], [x + 0.5, z + 0.5], [x + 0.5, z - 0.5], [x - 0.5, z - 0.5]].map(c => [c[0], h(c[0], c[1]), c[1]]), pal = STRATA(b.own), col = iceOf(b.own) ? FROST : pal[ROWS % pal.length];
    putQuad(G.rcap, C[0], C[1], C[2], C[3], [0, 1, 0], [col.r, col.g, col.b], C.map(c => [c[0] / 0.9, c[2] / 0.9])); };
  for (const b of band.values()) { const G = b.G, top = b.rock ? b.hi + RH : b.hi + WALL_H; if (b.rock) { rockCap(G, b, top); if (iceOf(b.own)) { G.ice = true; rooms[b.own].iceRock = (rooms[b.own].iceRock || 0) + 1; } } else if (typeof b.own === 'string' && b.own.slice(0, 3) === 'sd_') topQuad(G.sdCap || (G.sdCap = quads()), b.x, b.y, top, WHITE); else topQuad(G.cap, b.x, b.y, top, WHITE);   // (THE SEWER DUNGEON's wall tops: dark concrete, not the lab's white cap)
    for (const [dx, dy] of DIRS) { const k = K(b.x + dx, b.y + dy), nb = band.get(k), rid = roomAt.get(k), c = wain(rid || b.own), same = !!nb && nb.G === G, z = rid ? hAt(b.x + dx, b.y + dy) : nb ? b.lo : minH;   // (z: the floor this face rises from; over the void, the lowest)
      if (b.header) { if (!same) face(G.face, b, dx, dy, b.lo + DOOR_H, top, c, b.lo); continue; }
      if (nb && nb.header) { face(G.face, b, dx, dy, nb.lo + B0, nb.lo + DOOR_H, c, nb.lo); if (!same) face(G.face, b, dx, dy, nb.lo + DOOR_H, top, c, nb.lo); continue; }   // (the tunnel's side, under the wall that goes on over the door)
      // (THE SEWER DUNGEON: a wall's side over empty space, where no room is, is the one dark colour of its top and of the ground, not stone: so the space behind the walls reads as one solid mass.
      // The owner, 2026-11-23: "all the empty spaces, like behind walls that don't have any rooms to it. You should make that completely solid color")
      if (!same && !rid && !nb && !b.rock && isSd(b.own)) { sideQuad(G.sdCap || (G.sdCap = quads()), b.x, b.y, dx, dy, z + B0, top, WHITE, 0, 1); continue; }
      if (same) continue; if (b.rock) { if (!(nb && nb.rock && nb.G === G)) rockFace(G, b, dx, dy, z + B0, z); continue; } face(G.face, b, dx, dy, z + B0, top, c, z, bodyOf(rid || b.own));
      if (!nb && rid && (live || dx === 1 || dy === 1)) { const s = new T.Mesh(new T.BoxGeometry(dx ? 0.03 : 1, 0.028, dy ? 0.03 : 1), seamOf(rid)); s.position.set(b.x + dx * 0.512, z + WALL_H * 0.2 + 0.012, b.y + dy * 0.512); s.userData.noInk = true; G.g.add(s); } } }   // (the neon seam, on the faces the camera sees)

  // the cut stubs the sunk walls leave (under every block that can sink): their sides lie in the walls' own faces, so they are one solid with the walls for the ink line
  // (THE SEWER DUNGEON's stubs: the dark concrete of its walls, not the lab's pale cut. The owner, 2026-11-22, of the first 3D pass: "some spots look really messed up. I really want to have like a smooth looking game")
  const labFace = quads(), labTop = quads(), sdFace = quads(), sdTop = quads(); let sFace = labFace, sTop = labTop;
  for (const b of band.values()) { if (!b.hides.some(h => h.length) || b.header) continue; sFace = isSd(b.own) ? sdFace : labFace; sTop = isSd(b.own) ? sdTop : labTop; topQuad(sTop, b.x, b.y, cutT(b), WHITE); for (const [dx, dy] of DIRS) { const nb = band.get(K(b.x + dx, b.y + dy)), rid = roomAt.get(K(b.x + dx, b.y + dy));
      if (nb && !nb.header) { if (live && nb.hides.some(h => h.length) && cutT(nb) < cutT(b) - 0.01) sideQuad(sFace, b.x, b.y, dx, dy, cutT(nb), cutT(b), WHITE, 0, 1); continue; }   // (live: down to a lower stub beside it, a thick wall's between two floors)
      sideQuad(!rid && sFace === sdFace ? sdTop : sFace, b.x, b.y, dx, dy, (rid ? hAt(b.x + dx, b.y + dy) : minH) + B0, cutT(b), WHITE, 0, 1); } }   // (over the highest floor beside it)

  // THE SEWER DUNGEON'S SLANTED WALLS: each a straight wall a tile thick outside its line, in pieces a tile long (each sinks with the rooms it stands in front of, as a block does, and leaves
  // its stub). Its ends: where the room's next wall is a wall too, the two meet on the mitre (and, that one being of blocks, a wedge fills up to its last block's end); else square.
  for (const { w, rec, wi } of diag) { const P = rec.poly; let n = w.n.slice(); if (inP(w.mid[0] + n[0] * 0.3, w.mid[1] + n[1] * 0.3, P)) n = [-n[0], -n[1]];
    const endAt = (E, other) => { const sq = { o: [E[0] + n[0], E[1] + n[1]] }, e1 = [(other[0] - E[0]) / w.L, (other[1] - E[1]) / w.L];
      const k = rec.walls.findIndex((w2, j) => j !== wi && w2.kind !== 'open' && w2.kind !== 'deck_rail' && w2.kind !== 'railing_wall' && w2.kind !== 'spill' && Math.hypot(w2.b[0] - w2.a[0], w2.b[1] - w2.a[1]) > 1e-6 && (Math.hypot(w2.a[0] - E[0], w2.a[1] - E[1]) < 0.02 || Math.hypot(w2.b[0] - E[0], w2.b[1] - E[1]) < 0.02));
      if (k < 0) return sq; const w2 = rec.walls[k], V = Math.hypot(w2.a[0] - E[0], w2.a[1] - E[1]) < 0.02 ? w2.b : w2.a, dl = Math.hypot(V[0] - E[0], V[1] - E[1]), d = [(V[0] - E[0]) / dl, (V[1] - E[1]) / dl], nd = n[0] * d[0] + n[1] * d[1];
      if (Math.abs(nd) < 1e-3) return sq; let nO = [d[1], -d[0]]; if (Math.sign(nO[0] * e1[0] + nO[1] * e1[1]) !== Math.sign(nd)) nO = [-nO[0], -nO[1]];
      const kk = 1 + n[0] * nO[0] + n[1] * nO[1]; if (kk < 0.3) return sq; const o = [E[0] + (n[0] + nO[0]) / kk, E[1] + (n[1] + nO[1]) / kk], axis = Math.abs(d[0]) < 1e-6 || Math.abs(d[1]) < 1e-6;
      return { o, mitred: true, wedge: nd < 0 && axis && band.has(K(Math.round(E[0] + d[0] * 0.5 + nO[0] * 0.5), Math.round(E[1] + d[1] * 0.5 + nO[1] * 0.5))) ? [E[0] + nO[0], E[1] + nO[1]] : null }; };
    const eA = endAt(w.a, w.b), eB = endAt(w.b, w.a), N = Math.max(1, Math.round(w.L)), lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t], c = wain(rec.id), body = bodyOf(rec.id), m1 = [-n[0], -n[1]], ua = [(w.a[0] - w.b[0]) / w.L, (w.a[1] - w.b[1]) / w.L], ub = [-ua[0], -ua[1]];
    const pcs = []; for (let i = 0; i < N; i++) { const a = lerp(w.a, w.b, i / N), b = lerp(w.a, w.b, (i + 1) / N), oa = lerp(eA.o, eB.o, i / N), ob = lerp(eA.o, eB.o, (i + 1) / N), pm = lerp(a, b, 0.5);
      const ci = [Math.round(pm[0] - n[0] * 0.5), Math.round(pm[1] - n[1] * 0.5)], z = roomAt.get(K(ci[0], ci[1])) === rec.id ? hAt(ci[0], ci[1]) : baseOf(rec.id);
      const pb = { x: Math.round(pm[0] + n[0] * 0.5), y: Math.round(pm[1] + n[1] * 0.5), hi: SD_HI, rock: false }, hides = TURNS.map(t => hideMore(pb, t, hideOf(pb.x, pb.y, t)).sort()), G = groupOf(hides); G.sink = Math.max(G.sink || 0, WALL_H - B0 + 0.16);
      pcs.push({ a, b, oa, ob, pm, z, G, stub: hides.some(h => h.length) }); }
    // (a piece is a closed solid: its two long faces, its top, and an end wherever what stands beside it can sink apart from it: the wall's own end, or a piece of another group or floor)
    const away = (p, q, from) => { const dx = q[0] - p[0], dy = q[1] - p[1], L2 = Math.hypot(dx, dy) || 1; let nn = [dy / L2, -dx / L2]; if (nn[0] * ((p[0] + q[0]) / 2 - from[0]) + nn[1] * ((p[1] + q[1]) / 2 - from[1]) < 0) nn = [-nn[0], -nn[1]]; return nn; };
    pcs.forEach((pc, i) => { const { a, b, oa, ob, pm, z, G } = pc, top = SD_HI + WALL_H, zc = z + SD_CUT, mid = [(a[0] + b[0] + oa[0] + ob[0]) / 4, (a[1] + b[1] + oa[1] + ob[1]) / 4], plans = [[a, b, ob, oa]], outs = [[oa, ob, n]];   // (plans: the outlines of its top; outs: its faces over the outside, each [from, to, its normal])
      for (const [e, E, O, end, nbr, ue] of [[eA, a, oa, i === 0, pcs[i - 1], ua], [eB, b, ob, i === N - 1, pcs[i + 1], ub]]) {
        if (!end) { if (nbr.G !== G || Math.abs(nbr.z - z) > 1e-4) outs.push([E, O, ue]); continue; }
        if (e.wedge) { plans.push([E, e.o, e.wedge]); outs.push([e.o, e.wedge, away(e.o, e.wedge, mid)], [e.wedge, E, away(e.wedge, E, mid)]); } else outs.push([E, e.o, away(E, e.o, mid)]); }
      face2(G.face, a, b, m1, z + B0, top, c, z, body); for (const [p, q, nn] of outs) segQuad(G.sdCap || (G.sdCap = quads()), p, q, nn, minH + B0, top, WHITE, 0, 1);
      for (const pl of plans) { polyTop(G.sdCap || (G.sdCap = quads()), pl, top, WHITE); if (pc.stub) polyTop(sdTop, pl, zc, WHITE); }
      if (pc.stub) { segQuad(sdFace, a, b, m1, z + B0, zc, WHITE, 0, 1); for (const [p, q, nn] of outs) segQuad(sdTop, p, q, nn, minH + B0, zc, WHITE, 0, 1); }
      const L1 = Math.hypot(b[0] - a[0], b[1] - a[1]), sm = new T.Mesh(new T.BoxGeometry(L1, 0.028, 0.03), seamOf(rec.id)); sm.rotation.y = -Math.atan2(w.u[1], w.u[0]); sm.position.set(pm[0] - n[0] * 0.012, z + WALL_H * 0.2 + 0.012, pm[1] - n[1] * 0.012); sm.userData.noInk = true; G.g.add(sm); }); }

  // thin walls: glass or a divider, on the line; each sinks when the room behind it (to its north or west) is opened
  const edges = new Set(), glassMat = new T.MeshStandardMaterial({ color: lin('#96e6f2'), transparent: true, opacity: 0.2, roughness: 0.1, depthWrite: false, side: T.DoubleSide });
  for (const t of thin) { const nr = [t.u[1], t.u[0]], back = at(t.m[0] - nr[0] * 0.5, t.m[1] - nr[1] * 0.5), front = at(t.m[0] + nr[0] * 0.5, t.m[1] + nr[1] * 0.5), ax = t.u[0] ? 1 : 0; sFace = isSd(front || back) ? sdFace : labFace; sTop = isSd(front || back) ? sdTop : labTop;
    const z0 = live ? Math.max(front ? hAt(Math.round(t.m[0] + nr[0] * 0.5), Math.round(t.m[1] + nr[1] * 0.5)) : -1e9, back ? hAt(Math.round(t.m[0] - nr[0] * 0.5), Math.round(t.m[1] - nr[1] * 0.5)) : -1e9) : 0;   // (its floor)
    const behindT = tt => { const pa = [t.m[0] - nr[0] * 0.5, t.m[1] - nr[1] * 0.5], pb = [t.m[0] + nr[0] * 0.5, t.m[1] + nr[1] * 0.5]; return tu(tt, pa[0], pa[1]) + tv(tt, pa[0], pa[1]) < tu(tt, pb[0], pb[1]) + tv(tt, pb[0], pb[1]) ? at(pa[0], pa[1]) : at(pb[0], pb[1]); };   // (the side away from the camera, turned)
    const G = groupOf(TURNS.map(tt => { const bk = live ? behindT(tt) : back; return live ? hideThin(t.m, z0 + WALL_H, bk ? [bk] : [], tt) : bk ? [bk] : []; }));   // (live: and with the rooms it could hide someone in, each turn)
    const box = (len, h, dep, mat) => new T.Mesh(new T.BoxGeometry(ax ? len : dep, h, ax ? dep : len), mat), put = (par, m, y, off) => { m.position.set(t.m[0] + nr[0] * (off || 0), z0 + y, t.m[1] + nr[1] * (off || 0)); par.add(m); return m; };
    t.back = back; t.front = front; t.G = G; edges.add(K(Math.round(t.m[0] - nr[0] * 0.5), Math.round(t.m[1] - nr[1] * 0.5)) + '|' + K(Math.round(t.m[0] + nr[0] * 0.5), Math.round(t.m[1] + nr[1] * 0.5)));
    if (live && front && back && Math.abs(hAt(Math.round(t.m[0] + nr[0] * 0.5), Math.round(t.m[1] + nr[1] * 0.5)) - hAt(Math.round(t.m[0] - nr[0] * 0.5), Math.round(t.m[1] - nr[1] * 0.5))) > 0.05) continue;   // (a ledge between two floors, the catwalk spur's over the arena: the floor's riser is its face, a railing on it if the map has one, as the game draws it)
    if (t.glass) { const sill = 0.19, rail = 0.095;   // (the sill stays when the glass sinks; the rail and the posts are one solid along the whole window)
      const s = put(rooms[front || back].g, box(1, sill, 0.16, P0.frame), sill / 2); s.castShadow = s.receiveShadow = true; s.userData.inkKey = 'sill';
      const pane = put(G.g, box(1, WALL_H - sill - rail, 0.03, glassMat), sill + (WALL_H - sill - rail) / 2); pane.userData.noInk = true; pane.renderOrder = 3;
      const r = put(G.g, box(1, rail, 0.14, P0.frame), WALL_H - rail / 2); r.castShadow = true; r.userData.inkKey = 'rail';
      if (Math.round(t.m[0] * t.u[0] + t.m[1] * t.u[1] - 0.5) % 2 === 0) { const p = new T.Mesh(new T.BoxGeometry(ax ? 0.07 : 0.18, WALL_H - sill, ax ? 0.18 : 0.07), P0.frame); p.position.set(t.m[0] - t.u[0] * 0.5, z0 + sill + (WALL_H - sill) / 2, t.m[1] - t.u[1] * 0.5); p.castShadow = true; p.userData.inkKey = 'rail'; G.g.add(p); }
      if (front) { const a = put(rooms[front].g, box(1, 0.028, 0.02, seamOf(front)), sill - 0.03, 0.085); a.userData.noInk = true; } }
    else { const c = wain(front || back), hw = 0.08, x = t.m[0], y = t.m[1], sdT = isSd(front || back), tBody = sdT ? bodyOf(front || back) : undefined; topQuad(sdT ? G.sdCap || (G.sdCap = quads()) : G.cap, x, y, z0 + WALL_H, WHITE, ax ? 0.5 : hw, ax ? hw : 0.5);   /* (the dungeon's: dark, as its walls are) */ topQuad(sTop, x, y, z0 + CUT_H, WHITE, ax ? 0.5 : hw, ax ? hw : 0.5);
      for (const s of [1, -1]) { face(G.face, { x: x + nr[0] * s * (hw - 0.5), y: y + nr[1] * s * (hw - 0.5) }, nr[0] * s, nr[1] * s, z0 + B0, z0 + WALL_H, c, z0, tBody); sideQuad(sFace, x + nr[0] * s * (hw - 0.5), y + nr[1] * s * (hw - 0.5), nr[0] * s, nr[1] * s, z0 + B0, z0 + CUT_H, WHITE, 0, 1);
        if (!thin.some(q => !q.glass && Math.abs(q.m[0] - x - t.u[0] * s) < 0.01 && Math.abs(q.m[1] - y - t.u[1] * s) < 0.01)) for (const [q, h] of [[G.face, z0 + WALL_H], [sFace, z0 + CUT_H]]) {   // (its end, where it does not go on)
          const ex = x + t.u[0] * s * 0.5, ez = y + t.u[1] * s * 0.5, rx = t.u[1] * s * hw, rz = -t.u[0] * s * hw; putQuad(q, [ex - rx, z0 + B0, ez - rz], [ex + rx, z0 + B0, ez + rz], [ex + rx, h, ez + rz], [ex - rx, h, ez - rz], [t.u[0] * s, 0, t.u[1] * s], q === G.face && tBody ? tBody : WHITE, [[0.4, 0.3], [0.6, 0.3], [0.6, 0.9], [0.4, 0.9]]); } } } }
  const rockMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.95, metalness: 0, vertexColors: true, map: speck, flatShading: true });
  const iceRockMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0.05, vertexColors: true, map: speckIce, flatShading: true });   // (glazed: a little sheen)
  for (const G of groups.values()) { const m = quadMesh([{ q: G.face, mat: faceMat }, { q: G.cap, mat: P0.wallCap }, { q: G.sdCap || quads(), mat: P0.sdCap || (P0.sdCap = std('#0b0f12', { roughness: 0.9 })) }, { q: G.rface, mat: G.ice ? iceRockMat : rockMat }, { q: G.rcap, mat: G.ice ? iceRockMat : rockMat }]); m.castShadow = m.receiveShadow = true; m.userData.inkKey = 'wall'; m.userData.inkIds = [0, 1, 2, 2]; G.g.add(m); G.mesh = m; }   // (rock its own solid for the ink line)
  const cutFace = P0.cutFace.clone(), stubs = quadMesh([{ q: labFace, mat: cutFace }, { q: labTop, mat: P0.cutTop }, { q: sdFace, mat: P0.sdSide || (P0.sdSide = std('#3b4448', { roughness: 0.8 })) }, { q: sdTop, mat: P0.sdCap || (P0.sdCap = std('#0b0f12', { roughness: 0.9 })) }]); stubs.receiveShadow = true; stubs.userData.inkKey = 'wall'; stubs.userData.inkIds = [0, 1, 0, 1]; rest.add(stubs);

  // the floors, each room in its own colours; the dark aprons beyond the ways out; the ground outside
  const plate = new T.MeshStandardMaterial({ map: floorTexture(), roughness: 0.42, metalness: 0.08, vertexColors: true }), F0 = lin('#c9dce1'), floorMats = {};
  const rocky = new Set(live ? recs.filter(r => r.walls.some(w => w.kind === 'rock')).map(r => r.id) : []);   // (live: the rooms with rock walls, the arena's cave; a drop into one from a floor that is not steel is a cliff of its rock)
  // THE SEWERS' WATER (the sewers' own, below): a room's river and pools (solids of kind river and pool) have no floor, nor a bridge's tiles (decor bridge_deck: a grating over the water)
  const inPoly = (x, y, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const a = P[i], b = P[j]; if ((a[1] > y) !== (b[1] > y) && x < (b[0] - a[0]) * (y - a[1]) / (b[1] - a[1]) + a[0]) c = !c; } return c; };
  const wet = new Map(), banks = [];   // (wet: a tile's key -> { room, deck, body, h }; banks: a floor tile's edge onto water, [x, y, dx, dy, h, room])
  if (live) for (const rec of recs) { const waters = rec.solids.filter(s => (s.kind === 'river' || s.kind === 'pool') && s.poly), decks = (rec.decor || []).filter(d => d.kind === 'bridge_deck' && d.rect);
    if (!waters.length) continue;
    for (const c of rec.cells) { const x = c[0], y = c[1], w = waters.find(s => inPoly(x, y, s.poly)), dk = decks.find(d => x > d.rect[0] && x < d.rect[2] && y > d.rect[1] && y < d.rect[3]);
      if (w || dk) wet.set(K(x, y), { room: rec.id, deck: !!dk, body: w ? w.id : 'river', h: hAt(x, y) }); } }
  // and their falls (decor falls), on the line of the spill lip nearest each, as the 2D puts them (js/facilitysewers.js); n: out of the room, the way they pour
  const fallsAt = []; if (live) for (const rec of recs) for (const d of rec.decor || []) { if (d.kind !== 'falls' || !d.a || !d.b) continue;
    const vert = Math.abs(d.b[0] - d.a[0]) < Math.abs(d.b[1] - d.a[1]), lip = spills.filter(sp => vert ? Math.abs(sp.w.u[0]) < 1e-6 : Math.abs(sp.w.u[1]) < 1e-6).sort((p, q) => vert ? Math.abs(p.w.a[0] - d.a[0]) - Math.abs(q.w.a[0] - d.a[0]) : Math.abs(p.w.a[1] - d.a[1]) - Math.abs(q.w.a[1] - d.a[1]))[0];
    const A = lip ? (vert ? [lip.w.a[0], d.a[1]] : [d.a[0], lip.w.a[1]]) : d.a, B = lip ? (vert ? [lip.w.a[0], d.b[1]] : [d.b[0], lip.w.a[1]]) : d.b, L = Math.hypot(B[0] - A[0], B[1] - A[1]) || 1, u = [(B[0] - A[0]) / L, (B[1] - A[1]) / L];
    let n = lip ? lip.w.n : [u[1], -u[0]]; if (!lip && roomAt.has(K(Math.round((A[0] + B[0]) / 2 + n[0] * 0.6), Math.round((A[1] + B[1]) / 2 + n[1] * 0.6)))) n = [-n[0], -n[1]];
    fallsAt.push({ room: rec.id, A, B, L, u, n }); }
  for (const rec of recs) { const rm = rooms[rec.id], st = rm.style, kind = (rec.floor && rec.floor.style) || 'plate', own = kind === 'wood' || kind === 'grate', top = quads(), side = quads(), base = live && isSd(rec.id) && rec.floor && rec.floor.colour ? lin(rec.floor.colour) : lin(hexMix(st.fa, st.fb, 0.4)), cliff = { rface: quads() };   /* (THE SEWER DUNGEON: each room's floor in the colour its map gives it, pale walkways and darker rooms, so a floor is told from a wall's top, which is near black as a cut wall is on a plan. The owner, 2026-11-22, of floors and wall tops in one dark grey: "Those don't even look like rooms or tunnels anymore") */
    const mat = own ? (floorMats[rec.id] = new T.MeshStandardMaterial({ map: kind === 'wood' ? plankTexture(st.fa, st.fb) : grateTexture(st.fa, st.fb), roughness: 0.5, metalness: 0.05, vertexColors: true })) : plate, k = own ? [1, 1, 1] : [base.r / F0.r, base.g / F0.g, base.b / F0.b];
    // (THE SEWER DUNGEON: the tiles a slanted edge of the room's outline crosses are cut along it, the floor and its sides; a room that is all water has none)
    const cut = new Map(); if (live && isSd(rec.id) && rec.poly && !(rec.cells.length && rec.cells.every(c => wet.has(K(c[0], c[1]))))) { const P = rec.poly; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; if (Math.abs(a[0] - b[0]) < 1e-6 || Math.abs(a[1] - b[1]) < 1e-6) continue;
        for (let x = Math.round(Math.min(a[0], b[0]) + 0.5); x <= Math.round(Math.max(a[0], b[0]) - 0.5); x++) for (let y = Math.round(Math.min(a[1], b[1]) + 0.5); y <= Math.round(Math.max(a[1], b[1]) - 0.5); y++) cut.set(K(x, y), [x, y]); } }
    for (const [x, y] of cut.values()) { const kk = K(x, y), own = roomAt.get(kk) === rec.id; if (wet.has(kk) && own) continue; const pts = clipCell(rec.poly, x, y); if (!pts) continue;
      let h = own ? hAt(x, y) : null; if (h === null) { for (const [dx, dy] of DIRS.concat([[1, 1], [-1, -1], [1, -1], [-1, 1]])) if (roomAt.get(K(x + dx, y + dy)) === rec.id && !wet.has(K(x + dx, y + dy))) { h = hAt(x + dx, y + dy); break; } if (h === null) h = baseOf(rec.id); }
      const v = ((x * 7 + y * 13) % 5) / 5; polyTop(top, pts, h, [k[0] * (1 - v * 0.035), k[1] * (1 - v * 0.03), k[2] * (1 - v * 0.025)], p => [p[0] - x + 0.5, y + 0.5 - p[1]]);
      for (let i = 0; i < pts.length; i++) { const p = pts[i], q = pts[(i + 1) % pts.length], mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2, dx = Math.abs(mx - x - 0.5) < 1e-6 ? 1 : Math.abs(mx - x + 0.5) < 1e-6 ? -1 : 0, dy = dx ? 0 : Math.abs(my - y - 0.5) < 1e-6 ? 1 : Math.abs(my - y + 0.5) < 1e-6 ? -1 : 0;
        if (!dx && !dy) { const L2 = Math.hypot(q[0] - p[0], q[1] - p[1]); let nn = [(q[1] - p[1]) / L2, -(q[0] - p[0]) / L2]; if (inP(mx + nn[0] * 0.02, my + nn[1] * 0.02, rec.poly)) nn = [-nn[0], -nn[1]]; segQuad(side, p, q, nn, minH + B0, h, WHITE, 0, 1); continue; }   // (along the slanted edge: down past the lowest floor; what lies beyond hides it or not)
        const qk = K(x + dx, y + dy), nb = band.get(qk); if (roomAt.get(qk) === rec.id) continue; if (roomAt.has(qk) || aprons.has(qk)) { const h2 = roomAt.has(qk) ? hAt(x + dx, y + dy) : 0; if (h2 < h - 1e-4 || wet.has(qk)) segQuad(side, p, q, [dx, dy], wet.has(qk) ? minH + B0 : h2, h, WHITE, 0, 1); continue; }
        if (nb && !nb.header) continue; segQuad(side, p, q, [dx, dy], minH + B0, h, WHITE, 0, 1); } }
    for (const c of rec.cells) { if (wet.has(K(c[0], c[1])) || cut.has(K(c[0], c[1]))) continue; const v = ((c[0] * 7 + c[1] * 13) % 5) / 5, h = hAt(c[0], c[1]); topQuad(top, c[0], c[1], h, [k[0] * (1 - v * 0.035), k[1] * (1 - v * 0.03), k[2] * (1 - v * 0.025)]);
      for (const [dx, dy] of DIRS) { const q = K(c[0] + dx, c[1] + dy), nb = band.get(q); if (wet.has(q)) { banks.push([c[0], c[1], dx, dy, h, rec.id]); continue; } if (roomAt.has(q) || aprons.has(q)) { const h2 = roomAt.has(q) ? hAt(c[0] + dx, c[1] + dy) : 0, low = roomAt.get(q);
          if (h2 < h - 0.6 && low && low !== rec.id && rocky.has(low) && rec.structure !== 'scaffold') rockFace(cliff, { x: c[0], y: c[1], hi: h, own: low }, dx, dy, h2 + B0, h2, h); else if (h2 < h - 1e-4) sideQuad(side, c[0], c[1], dx, dy, h2, h, WHITE, 0, 1); continue; } if (nb && !nb.header) continue; sideQuad(side, c[0], c[1], dx, dy, minH + B0, h, WHITE, 0, 1); } }   // (a riser down to a lower tread; an edge over the void, down past the lowest floor)
    const fm = quadMesh([{ q: top, mat }, { q: side, mat: rec.id.slice(0, 3) === 'sd_' ? (P0.sdSide || (P0.sdSide = std('#3b4448', { roughness: 0.8 }))) : P0.floorSide }]);   /* (THE SEWER DUNGEON's risers, the sides of its steps and ledges: the dark concrete, not the lab's pale) */ fm.receiveShadow = true; fm.userData.inkKey = 'floor'; rm.g.add(fm); rm.floor = fm;
    if (cliff.rface.pos.length) { const cm = quadMesh([{ q: cliff.rface, mat: rockMat }]); cm.castShadow = cm.receiveShadow = true; cm.userData.inkKey = 'wall'; rm.g.add(cm); } }
  if (aprons.size && P0.outside) { const top = quads(), side = quads(); for (const a of aprons.values()) { const ah = live ? a.h : 0; topQuad(top, a.x, a.y, ah - 0.004, WHITE); for (const [dx, dy] of DIRS) { const q = K(a.x + dx, a.y + dy), nb = band.get(q); if (roomAt.has(q) || aprons.has(q) || (nb && !nb.header)) continue; sideQuad(side, a.x, a.y, dx, dy, minH + B0, ah - 0.004, WHITE, 0, 1); } }
    const am = quadMesh([{ q: top, mat: P0.outside }, { q: side, mat: P0.outside }]); am.receiveShadow = true; am.userData.inkKey = 'apron'; rest.add(am); }
  let bb = [1e9, 1e9, -1e9, -1e9]; for (const rec of recs) bb = [Math.min(bb[0], rec.bb[0]), Math.min(bb[1], rec.bb[1]), Math.max(bb[2], rec.bb[2]), Math.max(bb[3], rec.bb[3])];
  // the ground: none where the sewers' water lies (sunk under it) nor where their falls pour (out to three tiles past the lip), so they show; the falls' pit dark far down, under the room's edge too
  let groundAt = () => null;   // (for the tests: the ground's height under a tile, or null where there is none)
  if (P0.ground) { const gy = minH - 0.13, cx = (bb[0] + bb[2]) / 2, cz = (bb[1] + bb[3]) / 2, hole = new Set(wet.keys()), pit = new Set();
    for (const f of fallsAt) for (let t = -0.5; t <= f.L + 0.5; t += 0.5) for (let s = 0.5; s <= 3; s += 0.5) { const k = K(Math.round(f.A[0] + f.u[0] * t + f.n[0] * s), Math.round(f.A[1] + f.u[1] * t + f.n[1] * s)); if (!roomAt.has(k)) { hole.add(k); pit.add(k); } }
    groundAt = (x, y) => { const k = K(Math.round(x), Math.round(y)); return pit.has(k) ? gy - 2.6 : hole.has(k) ? null : gy; };
    if (!hole.size) { const gr = new T.Mesh(new T.PlaneGeometry(260, 260), P0.ground); gr.rotation.x = -Math.PI / 2; gr.position.set(cx, gy, cz); gr.receiveShadow = true; rest.add(gr); }
    else { const q = quads(), sq = (x0, z0, x1, z1, y) => putQuad(q, [x0, y, z1], [x1, y, z1], [x1, y, z0], [x0, y, z0], [0, 1, 0], WHITE), box = s => { let b = [1e9, 1e9, -1e9, -1e9]; for (const k of s) { const [x, y] = k.split(',').map(Number); b = [Math.min(b[0], x), Math.min(b[1], y), Math.max(b[2], x), Math.max(b[3], y)]; } return b; };
      const hb = box(hole), x0 = hb[0] - 0.5, z0 = hb[1] - 0.5, x1 = hb[2] + 0.5, z1 = hb[3] + 0.5;   // (the plane in four pieces round the holes' box, and in that box a tile at a time)
      sq(cx - 130, cz - 130, cx + 130, z0, gy); sq(cx - 130, z1, cx + 130, cz + 130, gy); sq(cx - 130, z0, x0, z1, gy); sq(x1, z0, cx + 130, z1, gy);
      for (let x = hb[0]; x <= hb[2]; x++) for (let y = hb[1]; y <= hb[3]; y++) if (!hole.has(K(x, y))) topQuad(q, x, y, gy, WHITE);
      if (pit.size) { const pb = box(pit); sq(pb[0] - 4, pb[1] - 4, pb[2] + 4, pb[3] + 4, gy - 2.6); }
      const gr = quadMesh([{ q, mat: P0.ground }]); gr.receiveShadow = true; rest.add(gr); } }

  // the doors
  for (const d of doors) { if (d.kind === 'mouth') continue; const th = -Math.atan2(d.u[1], d.u[0]), fs = d.u[0] ? 1 : -1, shut = d.kind === 'shut', L = d.L, low = new T.Group(), tall = new T.Group(), thinDoor = !d.side;
    const G = d.over.length ? d.over[0].G : groupOf(TURNS.map(tt => { const pa = [d.m[0] - Math.abs(d.nr[0]) * 0.5, d.m[1] - Math.abs(d.nr[1]) * 0.5], pb = [d.m[0] + Math.abs(d.nr[0]) * 0.5, d.m[1] + Math.abs(d.nr[1]) * 0.5], r = tu(tt, pa[0], pa[1]) + tv(tt, pa[0], pa[1]) <= tu(tt, pb[0], pb[1]) + tv(tt, pb[0], pb[1]) ? at(pa[0], pa[1]) : at(pb[0], pb[1]); return r ? [r] : []; })), Pd = d.room === 'crystal_chamber' ? P0 : Object.assign({}, P0, { lampOpen: seamOf(d.room) });
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
    for (const [y, th] of [[RH, 0.05], [RH * 0.5, 0.03]]) { const b = new T.Mesh(new T.BoxGeometry(w.L, th, th), P0.frame); b.rotation.y = -Math.atan2(w.u[1], w.u[0]); b.position.set(w.mid[0] + sd * w.n[0] * 0.08, z + y, w.mid[1] + sd * w.n[1] * 0.08); gp.add(b); }   // (along the edge, whichever way it runs: a diagonal one, the sewer dungeon's ring, had been a flat slab L by L)
    gp.userData.inkKey = 'rail'; setShadows(gp); rooms[r.room].g.add(gp); }

  // each room's own things: its floor marks, wall fittings (which go with the wall they hang on) and props
  const props = {}, sentries = [], flows = [], glows = [];   // (flows, glows: the sewers' streams and the brood holes' glow, which their tick sets a frame: below)
  for (const rec of recs) { const rm = rooms[rec.id], chamber = rec.id === 'crystal_chamber', hi = hexMix(rm.style.acc, '#ffffff', 0.35), Pr = Object.assign({}, P0, { puddle: ['#3a7a90', 0.2] });
    if (!chamber) Object.assign(Pr, { seam: seamOf(rec.id), lampOpen: seamOf(rec.id), screen: glowMat(hi, 0.95), ringGlow: [rm.style.acc, 0.85], ringDash: [hi, 0.55] });
    if (live) Object.assign(Pr, { flows, glows }); Pr.more = moreFittings(Pr, rm.style.acc); const B = buildRoom(rm.R, Pr, { shell: false }); rm.parts = B.parts; rm.g.add(B.g); B.g.position.y = baseOf(rec.id);   // (on its floor)
    for (const f of B.parts.fittings.children.slice()) { const w = f.userData.wall, b = w && band.get(K(Math.round(f.position.x + w.n[0] * 0.56), Math.round(f.position.z + w.n[1] * 0.56))); if (b) { f.position.y += B.g.position.y; b.G.g.add(f); } }
    for (const id of Object.keys(B.parts.props)) { const p = B.parts.props[id]; props[id] = p; if (p.s.kind === 'sentry') { const head = p.g.children.find(c => c.isGroup && Math.abs(c.position.y - 47 / UH) < 1e-3); if (head) { head.userData.dynamic = true; sentries.push({ id, at: p.s.c, room: rec.id, g: p.g, head, muzzle: p.marks.muzzle || [0.6, 0.72, 0] }); } } } }

  // THE COLD STORAGE'S OWN (the owner, 2026-11-17: "The next places to upgrade to the 3D design are the sewers ... and the cold storage"): its ice cave's glassy floor (decor ice_sheet, the look
  // only) and a flight of stairs up (decor stairwell, up: its stairs to the Experiment Lab), built as the 2D game draws them (js/facilitydecor.js _fpDrawStairwell: five steps of 12 px rising to
  // the far, north end, a frame 64 px tall on the top step with the dark way up in it, a post at each corner and a rail down each side). The game leaves them to the view (view3d/gameview.js keeps)
  if (live) for (const rec of recs) for (const d of rec.decor || []) { const rm = rooms[rec.id], y0 = baseOf(rec.id);
    if (d.kind === 'ice_sheet' && d.path && d.path.length > 2) {
      const m = new T.Mesh(new T.ShapeGeometry(new T.Shape(d.path.map(p => new T.Vector2(p[0], -p[1])))), std('#9fdcf3', { roughness: 0.06, metalness: 0.1, transparent: true, opacity: 0.5, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
      m.rotation.x = -Math.PI / 2; m.position.y = y0 + 0.006; m.receiveShadow = true; m.userData.noInk = true; rm.g.add(m); }
    else if (d.kind === 'stairwell' && d.up && d.rect) {
      const [x0, z0, x1, z1] = d.rect, N = 5, L = z1 - z0, W = x1 - x0, cx = (x0 + x1) / 2, gp = new T.Group(), top = N * 12 / UH, fh = 64 / UH, ink = std('#1d2a33', { roughness: 0.5 }), tread = std('#dbe8ee', { roughness: 0.55 });
      for (let k = 0; k < N; k++) { const h = (k + 1) * 12 / UH, za = z1 - (k + 1) * L / N, zb = z1 - k * L / N, s = new T.Mesh(new T.BoxGeometry(W, h, zb - za), tread); s.position.set(cx, y0 + h / 2, (za + zb) / 2); gp.add(s); }
      const frame = new T.Mesh(new T.BoxGeometry(W, fh, 0.1), std('#2f4553', { roughness: 0.6 })); frame.position.set(cx, y0 + top + fh / 2, z0 + 0.05); gp.add(frame);
      const dark = new T.Mesh(new T.PlaneGeometry(W - 0.36, 54 / UH), glowMat('#05080d', 1)); dark.position.set(cx, y0 + top + 27 / UH, z0 + 0.104); dark.userData.noInk = true; gp.add(dark);
      const lit = new T.Mesh(new T.PlaneGeometry(W - 0.5, 0.05), glowMat(d.colour || '#9be8ff', 0.8)); lit.position.set(cx, y0 + top + 0.02, z0 + 0.106); lit.userData.noInk = true; gp.add(lit);   // (the cold light from the way up)
      for (const x of [x0, x1]) { gp.add(rodBetween([x, y0, z1], [x, y0 + 16 / UH, z1], 0.03, ink, 6)); gp.add(rodBetween([x, y0 + top, z0], [x, y0 + top + 16 / UH, z0], 0.03, ink, 6)); gp.add(rodBetween([x, y0 + 16 / UH, z1], [x, y0 + top + 16 / UH, z0], 0.025, ink, 6)); }
      gp.userData.inkKey = 'stairs'; setShadows(gp); rm.g.add(gp); } }

  // THE SEWERS' OWN (the owner, 2026-11-17: "The next places to upgrade to the 3D design are the sewers"; their 2D drawing: js/facilitysewers.js): the water of their river and pools, sunk 12 px
  // (FP_SEWER.sink) under the floor, its current drifting the way it flows (the river east, a pool its FP_POOL_FLOW), its colour the 2D's: a toxic green clearing to a cold blue-green as the
  // purification runs (set a frame by the view: sewer.tick, view3d/gameview.js); the banks down to it, a hazard stripe along their lips; a bridge's tiles a steel grating over it, a rail each side;
  // the broken bridge's two stumps bent down into it; the gates' bars (104 px); the pumps' and the valves' housings (drawn in code in 2D: js/facilitydecor.js); the Nest end's low spill lips and the
  // falls pouring over them into the dark. Sizes are the 2D's; the looks the agent's, provisional. (Not built yet: the walls' sections, lintels and lamps, the Nest's eggs and junk, the outfall,
  // the other things on the walls.)
  const sewer = { tick: null };
  if (live && (wet.size || spills.length)) {
    const S = 12 / UH, px = v => v / UH, waters = [], lin3 = h => { const c = lin(h); return [c.r, c.g, c.b]; };
    const FALLS = [[[214, 170, 255], [170, 236, 248], 0.9], [[150, 80, 235], [80, 190, 220], 0.72], [[60, 20, 120], [20, 70, 90], 0]];   // (the falls' colours down it, foul and clean, and how much of it shows: the 2D's)
    const steel = std('#3b4652', { roughness: 0.5, metalness: 0.35 }), steelDk = std('#2a323b', { roughness: 0.55, metalness: 0.35 }), steelLt = std('#9aa8b6', { roughness: 0.4, metalness: 0.4 }), amber = std('#f2b13a', { roughness: 0.45 }), rust = std('#8a2e22', { roughness: 0.6 }), curb = std('#4a524f', { roughness: 0.9 });
    const box = (w, h, d, mat, x, y, z, par) => { const m = new T.Mesh(new T.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); par.add(m); return m; };
    const glowAt = (w, h, hex, x, y, z, ry, par) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), glowMat(hex, 0.95)); m.position.set(x, y, z); m.rotation.y = ry || 0; m.userData.noInk = true; par.add(m); return m; };
    const floorAt = (x, y, room) => { const k = K(Math.round(x), Math.round(y)); return roomAt.has(k) && !wet.has(k) ? hAt(Math.round(x), Math.round(y)) : wet.has(k) ? wet.get(k).h : baseOf(room); };
    // the water: a mesh a body, its streaks (world-scaled: a picture three tiles across) drifting the way it flows
    const streaks = () => canvasTex(64, 64, (g, w, h) => { g.fillStyle = '#b8b8b8'; g.fillRect(0, 0, w, h); for (let i = 0; i < 18; i++) { const x = rnd(i, 1, 21) * w, y = rnd(i, 2, 22) * h, L = 8 + rnd(i, 3, 23) * 16; g.fillStyle = 'rgba(255,255,255,' + (0.3 + rnd(i, 4, 24) * 0.5).toFixed(2) + ')'; g.fillRect(x, y, L, 1.6); g.fillRect(x - w, y, L, 1.6); } }, { repeat: true });
    const bodies = new Map(); for (const [k, v] of wet) { const [x, y] = k.split(',').map(Number); let b = bodies.get(v.body); if (!b) bodies.set(v.body, b = { cells: [], room: v.room }); b.cells.push([x, y, v.h]); }
    const sdLo = new Map(), SD_FILL = 15 / UH;   // (sdLo: a dungeon water tile's key -> its body's lowest height; SD_FILL: how far over that its water stands)
    for (const [id, b] of bodies) { const q = quads(), tex = streaks(), mat = new T.MeshBasicMaterial({ map: tex, color: 0x2e7a1e }), f = id !== 'river' && typeof FP_POOL_FLOW !== 'undefined' && FP_POOL_FLOW[id] ? FP_POOL_FLOW[id] : [1, 0], fL = Math.hypot(f[0], f[1]) || 1;
      // (THE SEWER DUNGEON: one flat sheet of water a body, part way up its sloped sides, not a step a tile following the bank's heights. The owner, 2026-11-22: "the channels don't need to look like
      // they have stairs under them, under the water. It needs to be flat looking. It needs to have like an inverted trapezoid look". How full it stands, SD_FILL, is the agent's, provisional.)
      const sdB = isSd(b.room), lo = sdB ? Math.min(...b.cells.map(c => c[2])) : 0; if (sdB) for (const c of b.cells) sdLo.set(K(c[0], c[1]), lo);
      const fill = sdB ? Math.max(SD_FILL, (Math.max(...b.cells.map(c => c[2])) - lo) * 0.45) : 0;   /* (a channel with banks stands a little under half full, however deep it is: "a really deep channel that is not all the way full") */
      for (const [x, y, h] of b.cells) { const y0 = sdB ? lo + fill : h - S, C = [[x - 0.5, y0, y + 0.5], [x + 0.5, y0, y + 0.5], [x + 0.5, y0, y - 0.5], [x - 0.5, y0, y - 0.5]]; putQuad(q, C[0], C[1], C[2], C[3], [0, 1, 0], WHITE, C.map(c => [c[0] / 3, -c[2] / 3])); }
      const m = quadMesh([{ q, mat }]); m.userData.noInk = true; m.userData.dynamic = true; m.userData.water = true; rooms[b.room].g.add(m); waters.push({ mat, tex, fl: [f[0] / fL, f[1] / fL], m, id, sd: sdB }); }
   // (dynamic: left out of the view's merging, so its colour can change)
    // THE SEWER DUNGEON'S BEDS: under every body of its water one smooth concrete surface, a flat bottom and sloped sides (the inverted trapezoid), always there: seen above the water's
    // line, and whole when the water is gone ("Empty: walk the bed"). A tile's corner is as high as the tiles round it: the mean of the water tiles there; at a bank's lip, the walkway's own height.
    { const bt = quads(), by2 = new Map(), cornerH = (cx, cy) => { let sum = 0, n = 0, fl = -1e9, bank = true; for (const [ox, oy] of [[-0.5, -0.5], [0.5, -0.5], [0.5, 0.5], [-0.5, 0.5]]) { const k = K(cx + ox, cy + oy), w = wet.get(k);
          if (w && sdLo.has(k)) { sum += w.h; n++; if (w.h < sdLo.get(k) + 1e-3) bank = false; } else if (roomAt.has(k) && !w) fl = Math.max(fl, hAt(cx + ox, cy + oy)); } return fl > -1e8 && bank ? fl : n ? sum / n : 0; };
      for (const [k, lo] of sdLo) { const [x, y] = k.split(',').map(Number), room = wet.get(k).room; if (ROUND && room === ROUND.nest) continue; let q = by2.get(room); if (!q) by2.set(room, q = quads());
        putQuad(q, [x - 0.5, cornerH(x - 0.5, y + 0.5), y + 0.5], [x + 0.5, cornerH(x + 0.5, y + 0.5), y + 0.5], [x + 0.5, cornerH(x + 0.5, y - 0.5), y - 0.5], [x - 0.5, cornerH(x - 0.5, y - 0.5), y - 0.5], [0, 1, 0], WHITE); }
      // THE BOWL (the owner, 2026-11-22, of the pool's bed drawn a tile at a time: "It looks like a inverted pyramid, sort of stacked, sort of stepped [...] I want a more smooth look for the middle. Round,
      // spherical edge"): the Round Junction's pool has one smooth bed, a cap of a sphere from the ring's floor at its rim down to its depth in the middle, as the game's own heights have it
      // (js/facility.js facilityHeightAt), drawn as rings of a round mesh with smooth shading, not as tiles.
      if (ROUND && rooms[ROUND.nest]) { const nc = [...sdLo].filter(([k]) => wet.get(k).room === ROUND.nest); if (nc.length) { const lo = nc[0][1], rim = baseOf(ROUND.ring), r0 = ROUND.RI, D = Math.max(1e-6, (rim - lo) * UH / 34), Rs = (r0 * r0 + D * D) / (2 * D), SEG = 64, RNG = 21;
          const yAt = d => lo + (rim - lo) * (Rs - Math.sqrt(Math.max(0, Rs * Rs - d * d))) / D, pos = [], uv = [], col = [], idx = [];
          // (pale stone, darker towards the middle and in a ring every tile and a half, as courses of stone: so it reads as a sunken bowl of stone and not as the murky water. The owner: "It does not look like it's really sunken in there at all. Looks like the player is standing on water")
          const cA = lin('#8f8b78');
          for (let i = 0; i <= RNG; i++) for (let j = 0; j <= SEG; j++) { const d = r0 * i / RNG, a = j / SEG * Math.PI * 2, x = ROUND.C[0] + Math.cos(a) * d, z = ROUND.C[1] + Math.sin(a) * d, cS = cA; pos.push(x, yAt(d), z); uv.push(x / 3, z / 3); col.push(cS.r, cS.g, cS.b); }   /* (ONE colour, the stone's: rings and a darker middle were tried and the owner, 2026-11-22: "that looks really weird. Make it a solid color, please") */
          for (let i = 0; i < RNG; i++) for (let j = 0; j < SEG; j++) { const a = i * (SEG + 1) + j, b = a + 1, c = a + SEG + 1, d2 = c + 1; idx.push(a, d2, c, a, b, d2); }
          const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx); geo.setAttribute('normal', new T.Float32BufferAttribute(pos.map((v, i) => i % 3 === 1 ? 1 : 0), 3));   /* (every normal straight up: one even colour over the whole bowl, and no bands from the outline pass, which reads the normals) */
          const bowl = new T.Mesh(geo, new T.MeshStandardMaterial({ color: lin('#8f8b78'), roughness: 0.9, side: T.DoubleSide })); bowl.userData.inkKey = 'bowl'; bowl.userData.dynamic = true;   /* (a key of its own: the Sewers' look lays its bank picture, rows of blocks dark at the waterline, on a 'floor' piece with its own colours, which drew bands round the bowl) */   /* (its own piece, left out of the view's merging of still things, which shaded its curve in bands; and it takes no cast shadow) */ rooms[ROUND.nest].g.add(bowl); sewer.bowl = bowl; } }
      for (const [room, q] of by2) { const bed = quadMesh([{ q, mat: P0.sdBed || (P0.sdBed = std('#46555b', { roughness: 0.9 })) }]); bed.receiveShadow = true; bed.userData.inkKey = 'floor'; rooms[room].g.add(bed); } }
    // the banks down to it, and the hazard stripe along their lips (yellow and black, four a tile)
    const stripes = canvasTex(64, 8, (g, w, h) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? '#141414' : '#f2c11a'; g.beginPath(); g.moveTo(i * 8, h); g.lineTo(i * 8 + 8, h); g.lineTo(i * 8 + 12, 0); g.lineTo(i * 8 + 4, 0); g.fill(); } g.fillStyle = '#f2c11a'; g.beginPath(); g.moveTo(-4, h); g.lineTo(4, h); g.lineTo(8, 0); g.lineTo(0, 0); g.fill(); }, { repeat: true });
    const bankMat = new T.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, vertexColors: true }), lipMat = new T.MeshStandardMaterial({ map: stripes, roughness: 0.7 }), BANK = lin3('#1d2422');
    const damOf = new Set(recs.flatMap(r => r.dam || [])), TRASH = ['#4a3c2c', '#3a3f3a', '#55432f', '#33403d', '#4b4a44'].map(lin3);   // (the dam's pools: their banks the dam's face of compacted trash, no stripe: the rim's junk along them, below)
    const byRoomBanks = new Map(); for (const bk of banks) { let e = byRoomBanks.get(bk[5]); if (!e) byRoomBanks.set(bk[5], e = { side: quads(), lip: quads() }); const [x, y, dx, dy, h] = bk, wq = wet.get(K(x + dx, y + dy));
      if (wq && damOf.has(wq.body)) { sideQuad(e.side, x, y, dx, dy, h - S - 0.1, h, TRASH[Math.abs(x * 7 + y * 13 + dx * 3 + dy * 5) % 5], 0, 1); continue; }
      sideQuad(e.side, x, y, dx, dy, h - S - 0.1, h, BANK, 0, 1);
      const W = 0.1, ex = x + dx * 0.5, ez = y + dy * 0.5, ax = dy !== 0, cx = ex - dx * W / 2, cz = ez - dy * W / 2, hx = ax ? 0.5 : W / 2, hz = ax ? W / 2 : 0.5, yy = h + 0.004;   // (the stripe along the edge, on the floor)
      const C = [[cx - hx, yy, cz + hz], [cx + hx, yy, cz + hz], [cx + hx, yy, cz - hz], [cx - hx, yy, cz - hz]]; putQuad(e.lip, C[0], C[1], C[2], C[3], [0, 1, 0], WHITE, ax ? [[0, 0], [1, 0], [1, 1], [0, 1]] : [[0, 1], [0, 0], [1, 0], [1, 1]]); }
    for (const [room, e] of byRoomBanks) { const m = quadMesh([{ q: e.side, mat: bankMat }, { q: e.lip, mat: lipMat }]); m.receiveShadow = true; m.userData.inkKey = 'floor'; rooms[room].g.add(m); }
    // a bridge's grating, with a rail each side (posts every half tile, 30 px: the amber rail on top, a grey one halfway) and the girder under each side down to the water
    const grate = canvasTex(64, 64, (g, w, h) => { g.clearRect(0, 0, w, h); g.fillStyle = '#5c6873'; for (let i = 0; i < 8; i++) { g.fillRect(i * 8, 0, 2.5, h); g.fillRect(0, i * 8, w, 2.5); } g.fillRect(0, 0, w, 3); g.fillRect(0, 0, 3, h); }, { repeat: true });
    const grateMat = new T.MeshStandardMaterial({ map: grate, alphaTest: 0.5, transparent: false, side: T.DoubleSide, roughness: 0.5, metalness: 0.4 });
    for (const rec of recs) { const decks = (rec.decor || []).filter(d => d.kind === 'bridge_deck' && d.rect), rm = rooms[rec.id];
      if (decks.length) { const q = quads(); for (const [k, v] of wet) { if (!v.deck || v.room !== rec.id) continue; const [x, y] = k.split(',').map(Number); topQuad(q, x, y, v.h, WHITE); } const m = quadMesh([{ q, mat: grateMat }]); m.receiveShadow = true; m.castShadow = true; m.userData.inkKey = 'rail'; rm.g.add(m); }
      for (const d of decks) { const r = d.rect, along = (r[3] - r[1]) >= (r[2] - r[0]), L = along ? r[3] - r[1] : r[2] - r[0], h = floorAt((r[0] + r[2]) / 2, (r[1] + r[3]) / 2, rec.id), gp = new T.Group(), H = px(30);
        for (const s2 of [0, 1]) { const at = (u, y) => along ? [s2 ? r[2] : r[0], y, r[1] + u] : [r[0] + u, y, s2 ? r[3] : r[1]];
          for (let u = 0; u <= L + 1e-6; u += 0.5) gp.add(rodBetween(at(u, h), at(u, h + H), 0.022, steelLt, 6));
          gp.add(rodBetween(at(0, h + H), at(L, h + H), 0.026, amber, 6)); gp.add(rodBetween(at(0, h + H / 2), at(L, h + H / 2), 0.016, steelLt, 6));
          const mid = at(L / 2, h - (S - px(2)) / 2); box(along ? 0.06 : L, S - px(2), along ? L : 0.06, steel, mid[0], mid[1], mid[2], gp); }
        gp.userData.inkKey = 'rail'; setShadows(gp); rm.g.add(gp); }
      // the broken bridge: a stump out from each bank, flat for most of it and bent down where it tore, a rail on its flat part
      for (const d of (rec.decor || []).filter(d => d.kind === 'bridge_broken' && d.rect)) { const r = d.rect, L = Math.min(1.7, (r[3] - r[1]) * 0.3), W = r[2] - r[0], cx = (r[0] + r[2]) / 2, gp = new T.Group();
        for (const dir of [1, -1]) { const yb = dir > 0 ? r[1] : r[3], h = floorAt(cx, yb - dir * 0.6, rec.id), Lf = L * 0.62, Lb = L - Lf, drop = S - px(3), H = px(30);
          const flat = new T.Mesh(new T.BoxGeometry(W, 0.04, Lf), grateMat); flat.position.set(cx, h - 0.02, yb + dir * Lf / 2); gp.add(flat);
          const bent = new T.Mesh(new T.BoxGeometry(W, 0.04, Math.hypot(Lb, drop)), grateMat); bent.position.set(cx, h - 0.02 - drop / 2, yb + dir * (Lf + Lb / 2)); bent.rotation.x = dir * Math.atan2(drop, Lb); gp.add(bent);
          for (const x of [r[0], r[2]]) { const p0 = [x, h, yb], p1 = [x, h, yb + dir * Lf]; gp.add(rodBetween(p0, [x, h + H, yb], 0.022, steelLt, 6)); gp.add(rodBetween([p1[0], h, p1[2]], [p1[0], h + H * (x === r[2] ? 0.7 : 1), p1[2]], 0.022, steelLt, 6)); gp.add(rodBetween([x, h + H, yb], [x, h + H * (x === r[2] ? 0.7 : 1), p1[2]], 0.026, amber, 6)); } }
        gp.userData.inkKey = 'rail'; setShadows(gp); rm.g.add(gp); }
      // the gates: posts at the ends, bars (five a tile; a boss gate's six), three cross rails, 104 px tall, on their wall line
      for (const s2 of rec.solids.filter(s => (s.kind === 'gate' || s.kind === 'boss_gate'))) { const b = s2.bb, along = (b[2] - b[0]) >= (b[3] - b[1]), L = along ? b[2] - b[0] : b[3] - b[1], mx = (b[0] + b[2]) / 2, mz = (b[1] + b[3]) / 2, H = px(104), boss = s2.kind === 'boss_gate';
        const h = floorAt(mx, mz + (along ? 0.6 : 0), rec.id), n = Math.max(4, Math.round(L * (boss ? 6 : 5))), gp = new T.Group(), at = u => along ? [b[0] + u, mz] : [mx, b[1] + u];
        for (const u of [0.04, L - 0.04]) { const p = at(u); box(0.08, H, 0.08, steelDk, p[0], h + H / 2, p[1], gp); }
        for (let i = 1; i < n; i++) { const p = at(L * i / n); box(0.035, H, 0.035, steel, p[0], h + H / 2, p[1], gp); }
        for (const t of [0.08, 0.5, 0.94]) { const p = at(L / 2); box(along ? L : 0.05, 0.045, along ? 0.05 : L, steelDk, p[0], h + H * t, p[1], gp); }
        gp.userData.inkKey = 'rail'; setShadows(gp); rooms[rec.id].g.add(gp); }
      // the pumps' and the valves' housings, as the 2D draws them: a squat dark-steel box (28 px) with a motor drum on top and a toxic-green gauge; a low block (18 px), a stub of pipe and a rust-red
      // handwheel, a green tell-tale
      for (const s2 of rec.solids.filter(s => s.kind === 'pump' || s.kind === 'valve')) { const b = s2.bb, w = b[2] - b[0] - 0.12, d = b[3] - b[1] - 0.12, cx = (b[0] + b[2]) / 2, cz = (b[1] + b[3]) / 2, h = floorAt(cx, cz, rec.id), gp = new T.Group();
        if (s2.kind === 'pump') { const Hb = px(28); box(w, Hb, d, steelDk, cx, h + Hb / 2, cz, gp); const drum = new T.Mesh(new T.CylinderGeometry(0.32, 0.32, px(14), 20), steel); drum.position.set(cx, h + Hb + px(7), cz); gp.add(drum);
          glowAt(Math.min(0.28, w * 0.3), px(9), '#7dff4a', cx - w * 0.2, h + px(16.5), cz + d / 2 + 0.002, 0, gp); glowAt(Math.min(0.28, d * 0.3), px(9), '#7dff4a', cx + w / 2 + 0.002, h + px(16.5), cz + d * 0.2, Math.PI / 2, gp); }
        else { const Hb = px(18); box(w, Hb, d, steelDk, cx, h + Hb / 2, cz, gp); gp.add(rodBetween([cx, h + Hb, cz], [cx, h + px(34), cz], 0.05, steel, 10));
          const wheel = new T.Mesh(new T.TorusGeometry(0.28, 0.025, 6, 20), rust); wheel.rotation.x = Math.PI / 2; wheel.position.set(cx, h + px(34), cz); gp.add(wheel);
          for (let i = 0; i < 3; i++) { const an = i * Math.PI / 3; gp.add(rodBetween([cx - Math.cos(an) * 0.28, h + px(34), cz - Math.sin(an) * 0.28], [cx + Math.cos(an) * 0.28, h + px(34), cz + Math.sin(an) * 0.28], 0.014, rust, 5)); }
          glowAt(Math.min(0.18, w * 0.25), px(5), '#7dff4a', cx + w * 0.2, h + px(10.5), cz + d / 2 + 0.002, 0, gp); }
        setShadows(gp); rooms[rec.id].g.add(gp); }
      // the falls (decor falls: the Nest end's, over its spill lip into the dark): a sheet of the water pouring down, from 9 px over the floor to 170 px under it, in the 2D's colours (light at the
      // lip, the water's own a third of the way down, then dark and gone: js/facilitysewers.js _fpNestFalls, set a frame by sewer.tick, as the purification runs), its streaks running down
      for (const fa of fallsAt.filter(fa => fa.room === rec.id)) { const L = fa.L, nx = fa.n[0], nz = fa.n[1], X = (fa.A[0] + fa.B[0]) / 2 + nx * 0.06, Z = (fa.A[1] + fa.B[1]) / 2 + nz * 0.06, ux = fa.u[0] * L / 2, uz = fa.u[1] * L / 2;
        const h = floorAt(X - nx * 0.66, Z - nz * 0.66, rec.id), top = h + px(9), bot = h - px(170), ys = [top, top - (top - bot) * 0.3, bot], pos = [], uv = [], geo = new T.BufferGeometry();
        for (const y of ys) { const v = (y - bot) / (top - bot) * 3; pos.push(X - ux, y, Z - uz, X + ux, y, Z + uz); uv.push(0, v, L, v); }   // (its streaks a third of its height long, a tile across)
        geo.setIndex([0, 2, 1, 1, 2, 3, 2, 4, 3, 3, 4, 5]); geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); geo.setAttribute('color', new T.Float32BufferAttribute(new Array(24).fill(1), 4));
        const tex = canvasTex(32, 64, (g, w, hh) => { g.fillStyle = '#c4c4c4'; g.fillRect(0, 0, w, hh); for (let i = 0; i < 9; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.4 + rnd(i, 5, 31) * 0.5).toFixed(2) + ')'; const x = rnd(i, 6, 32) * w, y = rnd(i, 7, 33) * hh, l = 10 + rnd(i, 8, 34) * 14; g.fillRect(x, y, 1.6, l); g.fillRect(x, y - hh, 1.6, l); } }, { repeat: true });
        const mat = new T.MeshBasicMaterial({ map: tex, vertexColors: true, transparent: true, depthWrite: false, side: T.DoubleSide }), m = new T.Mesh(geo, mat); m.userData.noInk = true; m.userData.dynamic = true; rooms[rec.id].g.add(m); flows.push({ tex, col: geo.attributes.color, speed: 0.012, stops: FALLS }); } }
    // the spill lips (a wall of kind spill is no wall): a low curb (9 px) on the edge the water spills over, inside the line, from under the water's top, and under it the edge's face down into
    // the dark (to 54 px under the floor, darkening, as the 2D's: js/facilitysewers.js _fpDrawSpillLip)
    const lipFace = new Map(); for (const sp of spills) { const w = sp.w, L = w.L, mx = w.a[0] + w.u[0] * L / 2, mz = w.a[1] + w.u[1] * L / 2, h = floorAt(mx - w.n[0] * 0.4, mz - w.n[1] * 0.4, sp.room), H = px(9), lo = h - S - 0.05, gp = new T.Group();
      box(w.u[0] ? L : 0.14, h + H - lo, w.u[1] ? L : 0.14, curb, mx - w.n[0] * 0.07, (lo + h + H) / 2, mz - w.n[1] * 0.07, gp); setShadows(gp); rooms[sp.room].g.add(gp);
      let q = lipFace.get(sp.room); if (!q) lipFace.set(sp.room, q = quads()); const ox = mx + w.n[0] * 0.002, oz = mz + w.n[1] * 0.002, rx = w.n[1] * L / 2, rz = -w.n[0] * L / 2;
      for (const [y1, y0, c] of [[lo, h - px(30), '#2b3331'], [h - px(30), h - px(42), '#1a201f'], [h - px(42), h - px(54), '#0c0f0f']]) putQuad(q, [ox - rx, y0, oz - rz], [ox + rx, y0, oz + rz], [ox + rx, y1, oz + rz], [ox - rx, y1, oz - rz], [w.n[0], 0, w.n[1]], lin3(c)); }
    for (const [room, q] of lipFace) { const m = quadMesh([{ q, mat: bankMat }]); m.userData.inkKey = 'floor'; rooms[room].g.add(m); }
    // THE NEST'S OWN (rec.nest: the 2D's eggs, the dam's junk and its rim, js/facilitysewers.js; sizes the 2D's, the looks the agent's, provisional): an egg a pale shell, its brood's green glowing
    // through it as the Nest stands (the tick); a piece of junk a crate, a barrel, a tyre, a pipe or a bag; the rim's crest a small crate, a barrel on its side, a plank or a bag along the dam's edge
    const eggMeshes = [], wood = std('#6a5238', { roughness: 0.8 }), woodDk = std('#5a452f', { roughness: 0.8 }), teal = std('#3f6b66', { roughness: 0.6, metalness: 0.2 }), tyre = std('#161616', { roughness: 0.9 }), pipeM = std('#6b7580', { roughness: 0.5, metalness: 0.4 }), bag = std('#2b3527', { roughness: 0.45 });
    for (const rec of recs) { if (!rec.nest || !rec.nest.length) continue; const eggs = [], junkG = new T.Group();
      for (const it of rec.nest) { const s = it.s || 0.2, k = it.seed % 5, h = floorAt(it.x, it.y, rec.id);
        if (it.what === 'egg') eggs.push([it.x, h, it.y, s * 0.78, s * 0.92]);
        else if (it.what === 'junk') { const gp = new T.Group(); gp.position.set(it.x, h, it.y); gp.rotation.y = (it.seed % 628) / 100;
          if (k === 0) box(s * 0.9, s * 46 / UH, s * 0.72, wood, 0, s * 23 / UH, 0, gp); else if (k === 1) { const b = new T.Mesh(new T.CylinderGeometry(s * 0.39, s * 0.39, s * 58 / UH, 14), teal); b.position.y = s * 29 / UH; gp.add(b); }
          else if (k === 2) { const t = new T.Mesh(new T.TorusGeometry(s * 0.42, s * 0.16, 8, 16), tyre); t.rotation.x = Math.PI / 2; t.position.y = s * 0.16; gp.add(t); } else if (k === 3) box(s * 1.8, s * 26 / UH, s * 0.36, pipeM, 0, s * 13 / UH, 0, gp);
          else { const b = new T.Mesh(new T.SphereGeometry(s * 0.45, 12, 8), bag); b.scale.y = 0.6; b.position.y = s * 0.22; gp.add(b); } junkG.add(gp); }
        else if (it.what === 'rim' && it.u && it.w) { const q = it.seed % 4, zc = (4 + it.seed % 5) / UH, gp = new T.Group(); gp.position.set(it.x - it.w[0] * 0.08, h, it.y - it.w[1] * 0.08); gp.rotation.y = -Math.atan2(it.u[1], it.u[0]);
          if (q === 0) box(0.3, zc + 4 / UH, 0.3, wood, 0, (zc + 4 / UH) / 2, 0, gp); else if (q === 1) { const b = new T.Mesh(new T.CylinderGeometry(0.13, 0.13, 0.36, 12), teal); b.rotation.z = Math.PI / 2; b.position.y = 0.13; gp.add(b); }
          else if (q === 2) box((it.half || 0.25) * 2 + 0.1, 4 / UH, 0.16, woodDk, 0, 2 / UH, 0, gp); else { const b = new T.Mesh(new T.SphereGeometry(0.15, 10, 7), bag); b.scale.y = 0.55; b.position.y = 0.06; gp.add(b); } junkG.add(gp); } }
      if (junkG.children.length) { setShadows(junkG); junkG.userData.inkKey = 'props'; rooms[rec.id].g.add(junkG); }
      if (eggs.length) { const em = new T.InstancedMesh(new T.SphereGeometry(1, 14, 10), std('#d3e6ae', { roughness: 0.45 }), eggs.length), m4 = new T.Matrix4(), q4 = new T.Quaternion(), v3 = new T.Vector3(), s3 = new T.Vector3();   // (one draw for a room's eggs)
        eggs.forEach((e, i) => em.setMatrixAt(i, m4.compose(v3.set(e[0], e[1] + e[4], e[2]), q4, s3.set(e[3], e[4], e[3])))); em.castShadow = em.receiveShadow = true; em.userData.dynamic = true; rooms[rec.id].g.add(em); eggMeshes.push(em); } }
    // A FRAME: the water's current and the streams' and falls' streaks run; their colours only when the purification has moved them on (the 2D's: colOf, toneOf); the eggs' and the brood
    // holes' green as the Nest stands (nestOf: infested, stirred, calmed, cleared)
    const cc = new T.Color(); let was = null, nestWas = null;
    // THE SEWER DUNGEON'S CULVERTS (the owner, 2026-11-22: "I want giant openings", culverts, an "Arch", at "Every channel end"; "a button that closes the pipe or the door from inside"): a solid of
    // kind culvert is a thin slab on the wall line a channel ends against. On that line, facing the water: a concrete arch as wide as the channel, from under the water's surface up to just under
    // the wall's top (or the floor's, where the channel comes in under a floor), dark inside; a ribbed steel door in the mouth, seen when the game says it is shut. It sinks with its wall.
    // Its proportions and colours are the agent's, provisional.
    const culverts = []; for (const rec of recs) for (const s2 of rec.solids.filter(s => s.kind === 'culvert')) { const b = s2.bb, along = (b[2] - b[0]) >= (b[3] - b[1]), L = along ? b[2] - b[0] : b[3] - b[1], mx = (b[0] + b[2]) / 2, mz = (b[1] + b[3]) / 2;
      const line = Math.round((along ? mz : mx) - 0.5) + 0.5, cellAt = sg => along ? [Math.round(mx), Math.round(line + sg * 0.5)] : [Math.round(line + sg * 0.5), Math.round(mz)], sg = wet.has(K(...cellAt(1))) ? 1 : wet.has(K(...cellAt(-1))) ? -1 : 0; if (!sg) continue;
      const ci = cellAt(sg), co = cellAt(-sg), bed = wet.get(K(ci[0], ci[1])).h - S - 0.3, bk = band.get(K(co[0], co[1])), top = bk ? bk.hi + WALL_H : roomAt.has(K(co[0], co[1])) ? hAt(co[0], co[1]) : bed + 2.2;
      const W = L - 0.6, H = bk ? Math.max(top - bed - 0.16, W * 0.55) : Math.max(0.5, Math.min(top - bed - 0.16, W * 0.8)),   /* (GIANT: against a wall it rises past the wall's top, a concrete headwall round it; under a floor, as tall as fits) */ arch = (w, h) => { const sh = new T.Shape(), sp = h * 0.5; sh.moveTo(-w / 2, 0); sh.lineTo(w / 2, 0); sh.lineTo(w / 2, sp); sh.absellipse(0, sp, w / 2, h - sp, 0, Math.PI, false, 0); sh.lineTo(-w / 2, 0); return sh; };
      const gp = new T.Group(), ring = arch(W + 0.5, H + 0.25); if (bk) { const hw = new T.Mesh(new T.BoxGeometry(W + 1.3, H + 0.55, 0.6), std('#3b4448', { roughness: 0.85 })); hw.position.set(0, (H + 0.55) / 2, -0.3); hw.castShadow = hw.receiveShadow = true; gp.add(hw); } ring.holes.push(arch(W, H));
      const frame = new T.Mesh(new T.ExtrudeGeometry(ring, { depth: 0.34, bevelEnabled: false, curveSegments: 20 }), std('#8b979d', { roughness: 0.9 })); frame.castShadow = frame.receiveShadow = true; gp.add(frame);
      const dark = new T.Mesh(new T.ShapeGeometry(arch(W, H), 20), new T.MeshBasicMaterial({ color: 0x020506 })); dark.position.z = 0.16; dark.userData.noInk = true; gp.add(dark);
      const door = new T.Group(), plate = new T.Mesh(new T.ShapeGeometry(arch(W, H), 20), std('#7d8a90', { roughness: 0.55, metalness: 0.35 })); plate.position.z = 0.2; door.add(plate);
      const wAt = y => y <= H * 0.5 ? W : W * Math.sqrt(Math.max(0, 1 - Math.pow((y - H * 0.5) / (H * 0.5), 2)));   // (the mouth's width at a height)
      for (let y = 0.75; y < H - 0.15; y += 0.36) { const rib = new T.Mesh(new T.BoxGeometry(Math.max(0.1, wAt(y) - 0.08), 0.06, 0.05), std('#39444a', { roughness: 0.6, metalness: 0.4 })); rib.position.set(0, y, 0.22); door.add(rib); }
      const hz = new T.Mesh(new T.BoxGeometry(W - 0.08, 0.16, 0.05), std('#e0a81e', { roughness: 0.6 })); hz.position.set(0, 0.5, 0.22); door.add(hz);
      door.visible = false; gp.add(door);
      gp.position.set(along ? mx : line, bed, along ? line : mz); gp.rotation.y = along ? (sg > 0 ? 0 : Math.PI) : (sg > 0 ? Math.PI / 2 : -Math.PI / 2); gp.userData.dynamic = true;   /* (its own piece: its door shows and hides, so it is not merged with the still things) */
      (bk && bk.G ? bk.G.g : rooms[rec.id].g).add(gp); culverts.push({ id: s2.id, door, gp }); }
    sewer.culverts = culverts;
    sewer.tick = (f0, gm) => { for (const c of culverts) c.door.visible = !!(gm && gm.culvert && gm.culvert(c.id));
      if (gm && gm.waterLow) for (const w of waters) if (w.sd) { const low = !!gm.waterLow(w.id); if (w.m.visible === low) w.m.visible = !low; }   /* (THE SEWER DUNGEON: a body of water whose culvert is shut, or that is drained, is gone, its bed bare; it is back when the culvert is opened) */
      for (const w of waters) w.tex.offset.set(-w.fl[0] * f0 * 0.004, w.fl[1] * f0 * 0.004); for (const fl of flows) fl.tex.offset.y = f0 * fl.speed;
      const T0 = gm && gm.nest ? gm.nest(f0) : null; if (T0) { const ph = Math.sin(f0 * T0.p * 2);
        for (const gl of glows) gl.m.material.opacity = T0.g * gl.k * (0.7 + 0.3 * Math.sin(f0 * T0.p * 2 + gl.ph));
        if (T0.s !== nestWas || T0.g > 0.05) { nestWas = T0.s; for (const em of eggMeshes) { const M = em.material; if (T0.s === 'cleared') { M.color.set('#5e6356').convertSRGBToLinear(); M.emissive.setRGB(0, 0, 0); } else { M.color.set('#d3e6ae').convertSRGBToLinear(); M.emissive.set('#8cff5a').convertSRGBToLinear().multiplyScalar(T0.g * (0.3 + 0.1 * ph)); } } } }
      const c = gm ? gm.col('#6b2cc4') : null; if (!c || c === was) return; was = c;
      for (const w of waters) w.mat.color.setStyle(c).convertSRGBToLinear();
      for (const fl of flows) if (fl.stops && fl.col) { fl.stops.forEach((st, r) => { cc.setStyle(gm.tone(st[0], st[1])).convertSRGBToLinear(); fl.col.setXYZW(r * 2, cc.r, cc.g, cc.b, st[2]); fl.col.setXYZW(r * 2 + 1, cc.r, cc.g, cc.b, st[2]); }); fl.col.needsUpdate = true; } };
    // (for the tests, tests/view3d.js: what was built, and the water's colour as the screen shows it)
    sewer.waterAt = (x, y) => { const v = wet.get(K(Math.round(x), Math.round(y))); return v ? v.h - S : null; };
    sewer.parts = () => ({ waters: waters.length, flows: flows.length, glows: glows.length, eggs: eggMeshes.reduce((a, m) => a + m.count, 0) }); sewer.colour = () => waters.length ? '#' + waters[0].mat.color.clone().convertLinearToSRGB().getHexString() : null;
  }

  // where one can walk
  const blocked = new Set(), ch = rooms.crystal_chamber, crystal = ch ? ch.rec.crystal : null;
  for (const rec of recs) for (const s of rec.solids) for (let x = Math.ceil(s.bb[0] + 0.01); x <= Math.floor(s.bb[2] - 0.01); x++) for (let y = Math.ceil(s.bb[1] + 0.01); y <= Math.floor(s.bb[3] - 0.01); y++) blocked.add(K(x, y));
  let padR = 1.2; if (ch && ch.parts.pad) { const box = new T.Box3().setFromObject(ch.parts.pad); padR = Math.max(box.max.x - box.min.x, box.max.z - box.min.z) / 2; }
  if (crystal) for (let x = Math.floor(crystal[0] - padR); x <= Math.ceil(crystal[0] + padR); x++) for (let y = Math.floor(crystal[1] - padR); y <= Math.ceil(crystal[1] + padR); y++) if (Math.hypot(x - crystal[0], y - crystal[1]) < padR - 0.15) blocked.add(K(x, y));

  return { g, rest, rooms, sewer, groundAt, order: recs.map(r => r.id), parts: ch ? ch.parts : {}, props, sentries, doors, groups: [...groups.values()], band, aprons, stubs, crystal, padR, bb, roomAt: (x, y) => roomAt.get(K(Math.round(x), Math.round(y))) || null,
    blocked, edges, walkable: (x, y) => roomAt.has(K(x, y)) && !blocked.has(K(x, y)),
    // (after the look has changed the materials: the stubs' sides lie in the walls' faces, and give way to them)
    settle() { const m = stubs.material[0]; m.polygonOffset = true; m.polygonOffsetFactor = 1; m.polygonOffsetUnits = 1; } };
}
