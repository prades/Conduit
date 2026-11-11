// ─────────────────────────────────────────────────────────
//  THE CRYSTAL LABORATORY STYLE (a drawing style; PROTOTYPE: one room)
// ─────────────────────────────────────────────────────────
// A bright, clean, cartoon-inspired lab: big simple shapes, smooth matte surfaces, a controlled cool palette, a few saturated crystal accents, glowing neon seams, a little wear.
// It changes only HOW things are drawn. The map, the walls, the collision, the doors and the furniture are untouched: it restyles what is already there and invents nothing.
//
// THE RULES (the same for every room once the prototype is approved):
//   PALETTE   cool laboratory grays and muted teals for every surface; saturated colour ONLY for crystal energy (cyan, electric blue, violet) and one warning amber.
//   SHAPES    flat smooth fills, no texture; every solid is a chunky box or cylinder with a lit top, a lit +x side and a darker +y side, a white shine on the lit edges, a flat toon shadow on the floor.
//   OUTLINES  one ink colour (deep teal, never black), BOLD (3-3.5 px, round joins) round the SILHOUETTE of every solid, wall top and post; faces inside a solid are separated by value, not outlines. (Reference: Dexter's Laboratory / The Powerpuff Girls.)
//   COMPUTERS 3-D equipment: a cabinet with big knobs and lamps, a CRT monitor with a thick bezel on a neck, a keyboard slab, a tape drive with two turning reels; it faces into the room.
//   WALLS     three bands: a darker base (wainscot), a body, a light cap; a NEON SEAM where the base meets the body; panel joins every two tiles; a post at every room corner.
//   FLOORS    pale two-tone tiles with fine seams; a NEON SEAM along every fourth tile line.
//   LIGHT     emissive only on energy sources and things you use (the crystal, power cells, screens, seams); everything else is flat, so floors, steps and obstacles stay easy to read.
//   WEAR      rare, muted, desaturated stains and one rust streak: old, not dirty.
// Which rooms use it is FP_STYLE_ROOMS: every room (js/facilitystyleall.js has the per-room accents and the rest of the furniture and decor).

const FP_PAL = {
    ink: "#16303a", cap: "#f1f8fa", wallLit: "#c6dae1", wallDark: "#a3c0ca", wallBase: "#3d93a0", floorA: "#d8e8ec", floorB: "#b4cdd5", seam: "#8fb6bf",
    teal: "#4f9aa0", tealLit: "#6cb3bb", tealDark: "#2f6a73", case: "#a9c4cc", caseLit: "#dbeaee",
    cyan: "#31e8ff", blue: "#3a7bff", violet: "#9a5cff", amber: "#f2b13a", white: "#eaffff", leaf: "#4fa58a",
};
const FP_STYLE_ROOMS = new Set(["crystal_chamber", "teleport_room_1", "teleport_room_2", "teleport_stair_room", "front_lobby", "security_room", "armory", "show_room", "lab_hallway", "experiment_lab", "lab_passage", "observation_deck", "catwalks", "arena", "nest_area", "cold_storage", "sewers", "elec_servers", "elec_circuitry"]);   // every room
function facilityStyleRoom(id) { return !!id && FP_STYLE_ROOMS.has(id); }

// floor decals keep their kind and place; their colours are brought into the palette
function _fpStyleCol(kind, col) {
    const M = { "#ffb347": FP_PAL.cyan, "#ff6a4a": FP_PAL.violet, "#ffd34d": FP_PAL.violet, "#ffe9a0": FP_PAL.white, "#6adfff": FP_PAL.cyan, "#2a1a10": "#7a8f89", "#0c0c10": "#7a8f89", "#1a1008": "#7a8f89", "#10121a": "#7a8f89",
        "#ff4a3a": FP_PAL.amber, "#8a1f2a": "#b49aa4", "#6dff5a": "#43e0a8", "#3a7a90": "#5fb0bd", "#14161c": "#7a8f99", "#fff2c0": FP_PAL.white, "#ffd9a0": FP_PAL.white, "#bfe8ff": FP_PAL.white, "#cfeaff": FP_PAL.white, "#ff9a8a": FP_PAL.amber,
        "#24345a": "#8fb0c9", "#2a2440": "#c6c0e6", "#5a2a3a": "#b6c4e0", "#2a2a30": "#9db1ba", "#888888": "#9db1ba", "#ffd21a": FP_PAL.amber, "#ffe733": FP_PAL.amber };
    if (col === "#ffffff") return kind === "cables" ? FP_PAL.cyan : FP_PAL.amber;
    if (M[col]) return M[col];
    if (typeof col === "string" && col[0] === "#" && col.length === 7) { const n = parseInt(col.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255; if (0.3 * r + 0.59 * g + 0.11 * b < 70) return "rgb(" + Math.round(r + (255 - r) * 0.55) + "," + Math.round(g + (255 - g) * 0.55) + "," + Math.round(b + (255 - b) * 0.55) + ")"; }   // anything dark is lightened into the palette
    return col;
}
// ── shapes ──
function _fpFillSoft(pts, col, edge, lw) { if (edge === FP_PAL.ink) { _fpQuad(pts, col, FP_EDGE.darker, Math.max(1, (lw || 1) * 0.4)); } else _fpQuad(pts, col, edge || col, lw || 1); }   // _fpFill, with the ink edge of the flat style softened (architecture: signs and wall units)
function _fpFill(pts, col, edge, lw) { _fpQuad(pts, col, edge || col, lw || 1); }   // a smooth fill (the stroke is the fill colour, so neighbours leave no hairline)
function _fpSBox(x0, y0, x1, y1, z0, z1, top, sideY, sideX, lw) {   // a toon box: three flat faces separated by VALUE, one bold ink outline round the SILHOUETTE only, a white shine on the lit top edges
    const P = _fpP, t = [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], b = [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], ink = FP_PAL.ink, w = lw || 3.5;
    _fpQuad([t[3], t[2], b[2], b[3]], sideY, sideY, 1); _fpQuad([t[2], t[1], b[1], b[2]], sideX, sideX, 1); _fpQuad(t, top, top, 1);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    ctx.strokeStyle = "rgba(27,54,64,0.35)"; ctx.lineWidth = Math.max(1.5, w * 0.5); ctx.beginPath(); ctx.moveTo(t[2][0], t[2][1]); ctx.lineTo(b[2][0], b[2][1]); ctx.stroke();   // the front corner crease
    ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = Math.max(1.5, w * 0.5); ctx.beginPath(); ctx.moveTo(t[3][0] + 1, t[3][1] + 1); ctx.lineTo(t[2][0], t[2][1] + 1); ctx.lineTo(t[1][0] - 1, t[1][1] + 1); ctx.stroke();   // the shine
    ctx.strokeStyle = ink; ctx.lineWidth = w; ctx.beginPath(); [t[3], t[0], t[1], b[1], b[2], b[3]].forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.stroke();
    ctx.lineJoin = "miter"; ctx.lineCap = "butt";
    return { t, b };
}
// a flat toon shadow on the floor under a piece of equipment
function _fpFootShadow(x, y, w) { const P = _fpP; _fpQuad([P(x - w + 0.12, y - w + 0.12, 0), P(x + w + 0.12, y - w + 0.12, 0), P(x + w + 0.12, y + w + 0.12, 0), P(x - w + 0.12, y + w + 0.12, 0)], "rgba(27,54,64,0.16)", null); }
// a toon box with rounded vertical corners (a chamfered footprint): flat faces separated by value, one bold silhouette outline, a shine along the lit top edge.
// c is the chamfer of all four corners, or [NW, NE, SE, SW]; skip lists the footprint edges (0 = north, 2 = east, 4 = south, 6 = west) that are shared with a neighbouring unit, which get no outline,
// so a run of units reads as one machine.
function _fpRBox(x0, y0, x1, y1, z0, z1, top, sideY, sideX, c, lw, skip) {
    const P = _fpP, w = lw || 3.5, ink = FP_PAL.ink, cc = Array.isArray(c) ? c : [c, c, c, c], sk = skip || [];
    const fp = [[x0 + cc[0], y0], [x1 - cc[1], y0], [x1, y0 + cc[1]], [x1, y1 - cc[2]], [x1 - cc[2], y1], [x0 + cc[3], y1], [x0, y1 - cc[3]], [x0, y0 + cc[0]]];
    const mixc = (a, b) => { const A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); return "rgb(" + (((A >> 16) + (B >> 16)) >> 1) + "," + ((((A >> 8) & 255) + ((B >> 8) & 255)) >> 1) + "," + (((A & 255) + (B & 255)) >> 1) + ")"; };
    const lo = (i, z) => P(fp[i][0], fp[i][1], z), nxt = i => (i + 1) % 8;
    for (const [i, col] of [[2, sideX], [3, mixc(sideX, sideY)], [4, sideY]]) _fpQuad([lo(i, z1), lo(nxt(i), z1), lo(nxt(i), z0), lo(i, z0)], col, col, 1);   // the +x face, the rounded front corner, the +y face
    _fpQuad(fp.map((q, i) => lo(i, z1)), top, top, 1);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (!sk.includes(4)) { ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = Math.max(1.5, w * 0.5); ctx.beginPath(); [5, 4, 3, 2].forEach((i, k) => { const q = lo(i, z1); k ? ctx.lineTo(q[0], q[1] + 1) : ctx.moveTo(q[0] + 1, q[1] + 1); }); ctx.stroke(); }   // the shine
    ctx.strokeStyle = ink; ctx.lineWidth = w;
    for (let i = 0; i < 8; i++) { if (sk.includes(i)) continue; const p0 = lo(i, z1), p1 = lo(nxt(i), z1); ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }   // the top outline, minus the shared edges
    for (const e of [4, 3, 2, 1]) { if (e === 4 && sk.includes(4)) continue; const q0 = lo(e, z0), q1 = lo(e + 1, z0); ctx.beginPath(); ctx.moveTo(q0[0], q0[1]); ctx.lineTo(q1[0], q1[1]); ctx.stroke(); }   // the base: edges 4 (south), 3 (rounded corner), 2 (east), 1 (rounded corner)
    if (!sk.includes(4)) { const a = lo(5, z1), b2 = lo(5, z0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke(); }
    if (!sk.includes(0)) { const a = lo(1, z1), b2 = lo(1, z0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b2[0], b2[1]); ctx.stroke(); }
    ctx.lineJoin = "miter"; ctx.lineCap = "butt";
}
// a rounded rectangle as a polygon in a vertical plane: u across, z up, at depth w, corners cut by ru (across) and rz (up)
function _fpRRectPts(pt, u0, u1, z0, z1, ru, rz, w) {
    const out = [], arc = (uc, zc, a0) => { for (let k = 0; k <= 4; k++) { const a = a0 + k * Math.PI / 8; out.push(pt(uc + Math.cos(a) * ru, w, zc + Math.sin(a) * rz)); } };
    arc(u1 - ru, z1 - rz, -Math.PI / 2 * 0); arc(u0 + ru, z1 - rz, Math.PI / 2); arc(u0 + ru, z0 + rz, Math.PI); arc(u1 - ru, z0 + rz, Math.PI * 1.5);
    return out;
}
function _fpDial(x, y, r, f, seed, col) {   // a big round gauge: bezel, face, ticks, a needle that wanders
    ctx.fillStyle = FP_PAL.ink; ctx.beginPath(); ctx.arc(x, y, r + 2.5, 0, 6.2832); ctx.fill(); ctx.fillStyle = FP_PAL.cap; ctx.beginPath(); ctx.arc(x, y, r, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = FP_PAL.tealDark; ctx.lineWidth = 1.5; for (let i = 0; i < 7; i++) { const a = 3.6 + i * 0.35; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62); ctx.lineTo(x + Math.cos(a) * r * 0.9, y + Math.sin(a) * r * 0.9); ctx.stroke(); }
    const a = 3.6 + 1.2 + Math.sin(f * 0.03 + seed) * 0.9; ctx.strokeStyle = col; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * r * 0.8, y + Math.sin(a) * r * 0.8); ctx.stroke(); ctx.lineCap = "butt";
    ctx.fillStyle = FP_PAL.ink; ctx.beginPath(); ctx.arc(x, y, 2, 0, 6.2832); ctx.fill();
}
function _fpGlow(x, y, r, col, a) { if (typeof gfxLow !== "undefined" && gfxLow) return;   // (LOW graphics: no soft glows)
    ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, _fpRgba(col, a)); g.addColorStop(1, _fpRgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.globalCompositeOperation = "source-over"; }
function _fpCrystal(x, y, h, w, col, f, seed) {   // a faceted crystal shard standing on (x, y): the accent that marks crystal energy
    const pul = 0.75 + 0.25 * Math.sin(f * 0.06 + seed);
    ctx.fillStyle = _fpShade(col, 0.62); ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w, y - h * 0.45); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - w, y - h * 0.45); ctx.lineTo(x, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x - w * 0.45, y - h * 0.58); ctx.lineTo(x, y - h * 0.5); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w, y - h * 0.45); ctx.lineTo(x, y); ctx.lineTo(x - w, y - h * 0.45); ctx.closePath(); ctx.stroke();
    _fpGlow(x, y - h * 0.5, h * 1.3, col, 0.35 * pul);
}

// ── walls ──
// per-room colour strings, built once (the wall is drawn hundreds of times a frame)
const _fpRoomCol = new Map();
function _fpRoomCols(id) {
    let c = _fpRoomCol.get(id); if (c) return c; const RS = _fpRoomStyle(id);
    c = { wainLit: RS.wain, wainDark: _fpShade(RS.wain, 0.9), skirt: _fpShade(RS.wain, 0.8), acc: RS.acc, wallLit: RS.wallLit || FP_PAL.wallLit, wallDark: RS.wallDark || FP_PAL.wallDark, cap: RS.cap || FP_PAL.cap }; _fpRoomCol.set(id, c); return c;   // (a room may have walls of its own colour: the sewers' damp concrete)
}
function _fpFlat(pts, col) { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[0][0], pts[0][1]); ctx.closePath(); ctx.fill(); }   // a flat fill: no outline pass
// ── ARCHITECTURE SHADING (docs/TUTORIAL.md, "Architecture shading") ──
// The walls, doors, glass, stairs, rock and floors are shaded like the 3D props (design/props/BRIEF.md): soft values instead of a bold ink outline: a light bevel on the edges the light hits, a soft dark crease
// where two surfaces meet, ambient darkening where a wall meets the floor and the ceiling cap, panel joints, trims and an emissive accent. The ink (FP_PAL.ink) stays for the flat fallback drawings of props.
const FP_EDGE = { dark: "rgba(14,36,46,0.5)", darker: "rgba(14,36,46,0.7)", light: "rgba(255,255,255,0.55)", lightSoft: "rgba(255,255,255,0.28)", ao: "rgba(8,26,34," };
// a stroke between two points
function _fpEdge(p, q, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
// a band of a wall piece (or a door: anything with a and b) filled with a VERTICAL gradient that follows the wall's slope: drawn in the piece's own frame (u along it, z up in px), so neighbouring pieces' gradients
// meet exactly. stops: [[t, colour], ...] with t from the band's bottom (0) to its top (1). The gradient lives in that frame, so it does not depend on where the piece is: ONE gradient object is made per `key` (a string
// naming the stops and the heights) and reused by every piece and every frame (made on the real context, never the dimmed pen, so its colours are not darkened: it is a shading overlay).
const _fpGradCache = new Map();
function _fpWallGrad(it, u0, u1, z0, z1, stops, key) {
    let g = key !== undefined ? _fpGradCache.get(key) : undefined;
    if (!g) { const c = ctx._k !== undefined && typeof _fpDimFor !== "undefined" && _fpDimFor ? _fpDimFor : ctx; g = c.createLinearGradient(0, z0, 0, z1); for (let i = 0; i < stops.length; i++) g.addColorStop(stops[i][0], stops[i][1]); if (key !== undefined) _fpGradCache.set(key, g); }
    const a = _fpP(it.a[0], it.a[1], 0), b = _fpP(it.b[0], it.b[1], 0);
    ctx.save(); ctx.transform(b[0] - a[0], b[1] - a[1], 0, -1, a[0], a[1]); ctx.fillStyle = g; ctx.fillRect(u0, z0, u1 - u0, z1 - z0); ctx.restore();
}
// shading stops used again and again (constants: nothing is allocated per piece)
const FP_GS = {
    leaf: [[0, "rgba(10,30,40,0.34)"], [0.14, "rgba(10,30,40,0.08)"], [0.55, "rgba(255,255,255,0.0)"], [1, "rgba(255,255,255,0.20)"]], seal: [[0, "rgba(10,30,40,0.25)"], [1, "rgba(255,255,255,0.12)"]],
    post: [[0, "rgba(10,30,40,0.30)"], [0.2, "rgba(10,30,40,0.06)"], [1, "rgba(10,30,40,0.0)"]], lintel: [[0, "rgba(10,30,40,0.26)"], [1, "rgba(255,255,255,0.14)"]],
    gsill: [[0, FP_EDGE.ao + "0.30)"], [0.5, FP_EDGE.ao + "0.06)"], [1, "rgba(255,255,255,0.10)"]], gglass: [[0, "rgba(20,70,90,0.14)"], [0.55, "rgba(20,70,90,0.0)"], [1, "rgba(220,250,255,0.14)"]], grail: [[0, "rgba(10,30,40,0.18)"], [1, "rgba(10,30,40,0.0)"]],
    foot: [[0, "rgba(0,0,0,0.4)"], [1, "rgba(0,0,0,0)"]], footSoft: [[0, "rgba(0,0,0,0.3)"], [1, "rgba(0,0,0,0)"]], fascia: [[0, "rgba(8,26,34,0.35)"], [1, "rgba(255,255,255,0.1)"]],
};
// the stops of a wall face's shading, for a wall of this height (one gradient covers the wainscot and the wall above it): darker at the floor, a lighter rail, a shadow under the chair rail and one under the cap
const _fpWallStopsCache = new Map();
function _fpWallStops(top, wain) {
    const k = top + "|" + wain; let r = _fpWallStopsCache.get(k); if (r) return r;
    const t = z => Math.max(0, Math.min(1, z / top)), ao = a => FP_EDGE.ao + a + ")", st = [[0, ao(0.34)], [t(5), ao(0.18)], [t(Math.min(14, wain)), ao(0.06)]];
    if (top > wain + 6) { st.push([t(wain) - 0.0005, "rgba(255,255,255,0.05)"], [t(wain), ao(0.12)], [t(wain + (top - wain) * 0.16), ao(0.02)], [t(wain + (top - wain) * 0.78), "rgba(255,255,255,0)"], [1, ao(0.16)]); } else st.push([1, "rgba(255,255,255,0.05)"]);
    return _fpWallStopsCache.set(k, r = { stops: st, key: "ws" + k }).get(k);
}
function _fpWallTop(ax, ay, bx, by, nx, ny, Hd, out, ink, cap) {   // the thick top of a wall: a slab FP_WALL_T deep over the band, running from the piece towards the other side of the wall (out: +1 towards the camera, -1 away). It runs half a tile past both ends (not on a short piece, a tunnel's side, where it would stick out), so the slab of a corner or of a row of pieces is continuous. A soft crease along its far edge (where `ink` allows: the boundary of the whole top), a light bevel along the edge towards the room.
    const t = FP_WALL_T, L = Math.hypot(bx - ax, by - ay) || 1, e = L < 1.6 ? 0 : 0.5, ex = (bx - ax) / L * e, ey = (by - ay) / L * e, Q = (x, y) => _fpP(x, y, Hd), mx = nx * (out || -1), my = ny * (out || -1);
    const p0 = Q(ax - ex, ay - ey), p1 = Q(bx + ex, by + ey), p2 = Q(bx + ex + mx * t, by + ey + my * t), p3 = Q(ax - ex + mx * t, ay - ey + my * t);
    if (cap === "rock" && typeof _fpRockSlab === "function") { _fpRockSlab(p0, p1, p2, p3); return; }   // (a wall built into the rock: the rock's roof, js/facilitydecor.js _fpInRock)
    _fpFlat([p0, p1, p2, p3], cap || FP_PAL.cap);
    _fpEdge(p0, p1, FP_EDGE.lightSoft, 1.5);   // the bevel on the edge the wall face hangs from
    if (ink === false) return;
    _fpEdge(p3, p2, FP_EDGE.dark, 1.6);        // the far edge of the slab
}
function _fpStyleWall(it, Hd) {
    const ax = it.a[0], ay = it.a[1], bx = it.b[0], by = it.b[1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1; let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
    const lit = nx > ny, wain = Math.min(24, Hd), capH = Math.min(8, Math.max(0, Hd - wain)), RC = _fpRoomCols(it.room), zb = Hd - capH;
    if (!it.underRock) {   // the wall's thickness: a slab over the band (the building is spaced out for it); none under the rock's roof (js/facilitydecor.js _fpUnderRock)
        const cap = it.inRock ? "rock" : RC.cap, o = it.slabFrom;   // (built into the rock: the rock's roof for a top)
        // (over a band another room's wall roofs: in that roof's light, js/facilityplay.js _fpSlabShare)
        const sl = o && _fp.light && typeof _fpWallLightAt === "function" ? _fpWallLightAt(o.room, o.x, o.y) : undefined;
        if (sl !== undefined && Math.abs(sl - _fpItemLight(it)) > 0.01) _fpWithLight(sl, () => _fpWallTop(ax, ay, bx, by, nx, ny, Hd, it.out, it.inkBack, cap));
        else _fpWallTop(ax, ay, bx, by, nx, ny, Hd, it.out, it.inkBack, cap);
    }
    if (it.nbBand) return;   // (only the slab: the neighbouring room's own wall face stands in front of this one)
    // the piece's frame on screen: a point at (u along the piece, z up) is (X0 + DX u, Y0 + DY u - z): no arrays per point
    const a0 = _fpP(ax, ay, 0), b0 = _fpP(bx, by, 0), X0 = a0[0], Y0 = a0[1], DX = b0[0] - X0, DY = b0[1] - Y0;
    // (each base band runs a hair past both ends, so neighbours overlap and leave no seam; the shading over it does not)
    const band = (u0, u1, z0, z1, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(X0 + DX * u0, Y0 + DY * u0 - z0); ctx.lineTo(X0 + DX * u1, Y0 + DY * u1 - z0); ctx.lineTo(X0 + DX * u1, Y0 + DY * u1 - z1); ctx.lineTo(X0 + DX * u0, Y0 + DY * u0 - z1); ctx.closePath(); ctx.fill(); };
    const seg = z => { ctx.moveTo(X0, Y0 - z); ctx.lineTo(X0 + DX, Y0 + DY - z); };
    if (it.drop > 0) { band(-0.02, 1.02, -it.drop, 0, RC.skirt); _fpWallGrad(it, 0, 1, -it.drop, 0, FP_GS.foot, "skirt" + it.drop); }   // a skirt down to a lower floor beside the wall
    const P = (u, z) => [X0 + DX * u, Y0 + DY * u - z], U0 = -0.02, U1 = 1.02;
    _fpFlat([P(U0, 0), P(U1, 0), P(U1, wain), P(U0, wain)], lit ? RC.wainLit : RC.wainDark);     // the wainscot: a recessed teal band with a skirting board at the floor and a chair rail on top (a flat fill: no outline pass)
    if (Hd > wain) band(-0.02, 1.02, wain, zb, lit ? RC.wallLit : RC.wallDark);                 // the wall face
    if (capH > 0) band(-0.02, 1.02, zb, Hd, RC.cap);                                              // the cap
    { const W = _fpWallStops(zb, wain); _fpWallGrad(it, 0, 1, 0, zb, W.stops, W.key); }           // the shading over the wainscot and the face: one gradient
    const h = _fpHash(Math.round(ax * 2), Math.round(ay * 2));
    if (Hd > wain + 10) {
        if (h % 9 === 0) band(0.1, 0.9, wain, wain + 13 + h % 10, "rgba(115,140,128,0.16)");   // a discoloration
        if (h % 13 === 1) band(0.4, 0.46, wain + 4, zb, "rgba(176,132,108,0.24)");             // a rust streak
        if (_fpRoomStyle(it.room).damp) { if (h % 3 === 0) band(0.2 + (h % 5) * 0.1, 0.26 + (h % 5) * 0.1, wain - 6, zb, "rgba(28,44,32,0.32)"); band(-0.02, 1.02, 0, wain * 0.7, "rgba(18,34,24,0.22)"); }   // DAMP (the sewers): a seep running down, the wet band along the foot
        // a panel joint at every tile: a dark crease and a light edge beside it (a recessed seam)
        const sa = Math.floor((ax + ay) / 2), sb = Math.floor((bx + by) / 2); if (sa !== sb) { const u = (((sa > sb ? sa : sb) * 2) - (ax + ay)) / ((bx + by) - (ax + ay) || 1); if (u > 0 && u < 1) { const u2 = Math.min(1, u + 0.035);
            ctx.lineCap = "butt"; ctx.strokeStyle = "rgba(22,48,58,0.30)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(X0 + DX * u, Y0 + DY * u - wain - 1); ctx.lineTo(X0 + DX * u, Y0 + DY * u - zb); ctx.stroke();
            ctx.strokeStyle = lit ? FP_EDGE.lightSoft : "rgba(255,255,255,0.16)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(X0 + DX * u2, Y0 + DY * u2 - wain - 1); ctx.lineTo(X0 + DX * u2, Y0 + DY * u2 - zb); ctx.stroke(); } }
    }
    ctx.lineCap = "round";
    // the trims, batched by colour: lit edges (the chair rail, the top edge), creases (under the rail, at the skirting board, under the cap), soft lights (above the skirting board, on the cap's lower edge)
    ctx.strokeStyle = FP_EDGE.light; ctx.lineWidth = 1.5; ctx.beginPath(); if (wain > 8) seg(wain); seg(Hd); ctx.stroke();
    ctx.strokeStyle = "rgba(8,26,34,0.3)"; ctx.lineWidth = 1.3; ctx.beginPath(); if (wain > 8) { seg(wain - 2); seg(5); } if (capH > 0) seg(zb); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255,0.2)"; ctx.lineWidth = 1; ctx.beginPath(); if (wain > 8) seg(6.5); if (capH > 0) seg(zb + 1.5); ctx.stroke();
    // the accent: a thin lit strip in the room's colour (a soft wide glow under a bright core: it is a light)
    if (Hd >= 26) { ctx.strokeStyle = RC.accGlow || (RC.accGlow = _fpRgba(RC.acc, 0.2)); ctx.lineWidth = 5; ctx.beginPath(); seg(wain + 3); ctx.stroke(); ctx.strokeStyle = RC.acc; ctx.lineWidth = 1.8; ctx.beginPath(); seg(wain + 3); ctx.stroke(); }
    ctx.strokeStyle = "rgba(8,26,34,0.55)"; ctx.lineWidth = 2; ctx.beginPath(); seg(0); ctx.stroke(); ctx.lineCap = "butt";   // the foot: a dark contact line
}
// a post at every corner of a styled room (the same corner treatment everywhere)
function _fpStylePillars(F) { return []; }   // no posts: walls join at corners and simply end where they end (a post at a wall end read as a random column)
function _fpStylePillar(it) {
    // the end cap of a wall: ONE whole column, flush with the wall (the wall's own height and colours), one outline, nothing stacked
    const H = FP_WALL_H, w = 0.1, A = FP_PAL;
    _fpSBox(it.x - w, it.y - w, it.x + w, it.y + w, 0, H, A.cap, A.wallLit, A.caseLit, 3);
}

// ── doors: cartoony steel access doors ──
// Two chunky steel panels that CLOSE across the gap and slide back into the frame when a unit comes near (the squad always walks through: a sliding door never blocks, this is how it looks).
// A bold ink outline, rivets, a hazard-striped lead edge, a small window slit, a lintel with a status lamp (amber closed, accent open) and a thick frame.
const FP_STEEL_DOOR = { lit: "#aebfca", mid: "#8ea3b0", dark: "#667c8a", rib: "#5a7080" };
function _fpDoorNear(x, y) {
    let d = Math.hypot(x - player.visualX, y - player.visualY);
    if (typeof followers !== "undefined") for (const f of followers) { const q = Math.hypot(x - f.x, y - f.y); if (q < d) d = q; }
    if (typeof actors !== "undefined") for (const a of actors) { if (a.dead) continue; const q = Math.hypot(x - a.x, y - a.y); if (q < d) d = q; }
    return d;
}
// How far open each door is: eased towards open when a unit is within 2.6 tiles, shut again beyond 3.4. Once a STEP (from facilityDrawItems), drawn or not, and for every door whether it is on screen or not
// (it was in the door's draw function, so it ran once a drawn frame, and only for a door in view: on a slow device doors and the pools of light they throw were four times slower).
function facilityDoorsTick() {
    if (!_fp || !_fp.items) return;
    if (_fp.doorMidsOf !== _fp.items) { _fp.doorMidsOf = _fp.items; _fp.doorMids = _fp.items.filter(i => i.fp === "door" && i.part === "m"); }
    for (const it of _fp.doorMids) {
        const st = it.st || (it.st = { open: 0 }), near = _fpDoorNear(it.x, it.y), want = near < 2.6 ? 1 : near > 3.4 ? 0 : (st.open >= 0.5 ? 1 : 0);
        st.open = (st.open || 0) + (want - (st.open || 0)) * 0.2; if (Math.abs(want - st.open) < 0.01) st.open = want;
    }
}
function _fpStyleDoor(it) {
    const acc = _fpAcc((it.rooms || [])[0]), H = FP_DOOR_H, A = FP_PAL, S = FP_STEEL_DOOR, P = (u, z) => _fpP(it.a[0] + (it.b[0] - it.a[0]) * u, it.a[1] + (it.b[1] - it.a[1]) * u, z);
    const part = it.part || "m"; it.st = it.st || { open: 0 };   // a door is three items sorted separately (the two jambs at their own ends, the rest at the middle), so a unit in the gap is never covered by a jamb that is behind it and a neighbouring wall piece never clips the frame
    // how far open is it.st.open, eased once a step by facilityDoorsTick (not here: a step with no picture draws no door)
    const o = it.st.open, f = _fpFrame(), q = it.door ? 1 : 0, fw = 0.06;   // fw: the frame post, as a fraction of the span
    const edge = (u0, z0, u1, z1, col, w) => _fpEdge(P(u0, z0), P(u1, z1), col, w);
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (part === "m" && q) for (const side of [0, 1]) {   // each panel slides toward its own post: its inner edge goes from the middle (closed) to the post (open)
        const e = side ? 0.5 + (0.5 - fw) * o : 0.5 - (0.5 - fw) * o, outer = side ? 1 - fw : fw, u0 = Math.min(e, outer), u1 = Math.max(e, outer), Ht = H - 8, w = u1 - u0;
        if (w < 0.012) continue;
        // the leaf: brushed steel, shaded darker at the foot and lighter at the top (one gradient in the door's own frame)
        _fpFill([P(u0, 0), P(u1, 0), P(u1, Ht), P(u0, Ht)], S.mid, S.mid);
        _fpWallGrad(it, u0, u1, 0, Ht, FP_GS.leaf, "leaf" + Ht);
        _fpFill([P(u0, 0), P(u1, 0), P(u1, 12), P(u0, 12)], S.dark, S.dark);                                                       // the kick plate
        edge(u0, 12, u1, 12, "rgba(255,255,255,0.3)", 1.2);
        if (w > 0.09) {
            // two recessed insets: a shadow along their top and left edges, a light along their bottom and right (they are pressed IN)
            for (const [z0, z1] of [[18, 44], [52, Ht - 12]]) { const i0 = u0 + w * 0.12, i1 = u1 - w * 0.12; if (z1 - z0 < 8) continue;
                _fpFill([P(i0, z0), P(i1, z0), P(i1, z1), P(i0, z1)], "rgba(10,30,40,0.10)", "rgba(0,0,0,0)");
                edge(i0, z1, i1, z1, "rgba(10,30,40,0.38)", 1.4); edge(i0, z0, i0, z1, "rgba(10,30,40,0.28)", 1.2); edge(i0, z0, i1, z0, "rgba(255,255,255,0.4)", 1.2); edge(i1, z0, i1, z1, "rgba(255,255,255,0.28)", 1.2); }
            // the vision panel (a window slit): dark tinted glass in a pale frame, with a streak of reflection and a lit line of the room's colour under it
            const wu0 = u0 + w * 0.2, wu1 = u0 + w * 0.8; _fpFill([P(wu0, 56), P(wu1, 56), P(wu1, 70), P(wu0, 70)], "#12323a", "rgba(0,0,0,0)"); _fpFill([P(wu0 + 0.012, 58), P(wu1 - 0.012, 58), P(wu1 - 0.012, 68), P(wu0 + 0.012, 68)], _fpRgba(acc, 0.32), "rgba(0,0,0,0)");
            _fpFill([P(wu0 + (wu1 - wu0) * 0.15, 58), P(wu0 + (wu1 - wu0) * 0.35, 58), P(wu0 + (wu1 - wu0) * 0.5, 68), P(wu0 + (wu1 - wu0) * 0.3, 68)], "rgba(255,255,255,0.22)", "rgba(0,0,0,0)");
            edge(wu0, 70, wu1, 70, "rgba(10,30,40,0.5)", 1.4); edge(wu0, 56, wu1, 56, FP_EDGE.light, 1.2); edge(wu0, 56, wu0, 70, "rgba(10,30,40,0.35)", 1.1); edge(wu1, 56, wu1, 70, FP_EDGE.lightSoft, 1.1);
        }
        const lead = side ? u0 : u1, du = 0.045 * (side ? 1 : -1);                                                               // the hazard-striped lead edge: a rubber seal and bevelled stripes
        for (let i = 0; i < 8; i++) { const z0 = i * Ht / 8, z1 = (i + 1) * Ht / 8; _fpFill([P(lead, z0), P(lead + du, z0), P(lead + du, z1), P(lead, z1)], i & 1 ? A.amber : "#26343b", "rgba(0,0,0,0)"); }
        _fpWallGrad(it, Math.min(lead, lead + du), Math.max(lead, lead + du), 0, Ht, FP_GS.seal, "seal" + Ht);
        for (const z of [8, Ht - 12]) { const r = P((u0 + u1) / 2, z); ctx.fillStyle = "rgba(60,78,88,0.8)"; ctx.beginPath(); ctx.arc(r[0], r[1], 1.5, 0, 6.2832); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.arc(r[0] - 0.5, r[1] - 0.6, 0.7, 0, 6.2832); ctx.fill(); }   // screws
        // the leaf's edges: a light bevel on top and on the leading edge, a soft crease round the rest
        edge(u0, Ht, u1, Ht, FP_EDGE.light, 1.6); edge(u0, 0, u1, 0, "rgba(10,30,40,0.5)", 1.8); edge(u0, 0, u0, Ht, side ? FP_EDGE.lightSoft : "rgba(10,30,40,0.35)", 1.3); edge(u1, 0, u1, Ht, side ? "rgba(10,30,40,0.35)" : FP_EDGE.lightSoft, 1.3);
    }
    if (part === "m" && q && o < 0.02) { edge(0.5, 0, 0.5, H - 8, "rgba(10,30,40,0.55)", 2.2); edge(0.5 + 0.008, 0, 0.5 + 0.008, H - 8, "rgba(255,255,255,0.3)", 1); }   // the gap where the panels meet
    // the frame: two thick posts (a light left edge, a shaded right one), a lintel with an emissive status strip and the lamp
    for (const u of (part === "a" ? [0] : part === "b" ? [1 - fw] : [])) { _fpFill([P(u, 0), P(u + fw, 0), P(u + fw, H), P(u, H)], A.cap, A.cap); _fpWallGrad(it, u, u + fw, 0, H, FP_GS.post, "post" + H);
        edge(u, 0, u, H, FP_EDGE.light, 1.4); edge(u + fw, 0, u + fw, H, "rgba(10,30,40,0.4)", 1.6); edge(u, H, u + fw, H, FP_EDGE.light, 1.2); }
    if (part !== "m") { ctx.lineJoin = "miter"; ctx.lineCap = "butt"; return; }
    _fpFill([P(0, H - 8), P(1, H - 8), P(1, H + 4), P(0, H + 4)], A.tealLit, A.tealLit);   // the lintel
    _fpWallGrad(it, 0, 1, H - 8, H + 4, FP_GS.lintel, "lintel" + H);
    edge(0, H + 4, 1, H + 4, FP_EDGE.light, 1.4); edge(0, H - 8, 1, H - 8, "rgba(10,30,40,0.5)", 1.6);
    { const on = o > 0.5, sc = on ? acc : A.amber; edge(0.06, H - 2, 0.94, H - 2, _fpRgba(sc, 0.25), 4.5); edge(0.06, H - 2, 0.94, H - 2, sc, 1.6); }   // the status strip: the room's colour when open, amber shut
    const lamp = P(0.5, H - 2), on = o > 0.5; ctx.fillStyle = on ? acc : A.amber; ctx.beginPath(); ctx.arc(lamp[0], lamp[1], 3.2, 0, 6.2832); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,0.55)"; ctx.beginPath(); ctx.arc(lamp[0] - 0.9, lamp[1] - 1, 1.1, 0, 6.2832); ctx.fill();
    // the HEADER: the wall continues above the door, from its lintel to the top of the wall (the same bands as the wall beside it). It is the WALL's, so it takes the wall's light (the room that shows its face, and the pool an open door throws on it), not the door's:
    // the door is lit from both sides so it can be found, but a bright header over a dark wall is not joined to the wall beside it. In a thin wall (glass) it has no thick top, as the glass beside it has a rail and nothing more.
    _fpWithLight(_fpWallLightAt(it.lroom, it.x, it.y), () => {
        const dx = it.b[0] - it.a[0], dy = it.b[1] - it.a[1], L = Math.hypot(dx, dy) || 1; let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
        const lit = nx > ny, zb = H + 4, zt = FP_WALL_H, capH = Math.min(8, zt - zb);
        if (zt > zb) { _fpFlat([P(-0.02, zb), P(1.02, zb), P(1.02, zt - capH), P(-0.02, zt - capH)], lit ? A.wallLit : A.wallDark); _fpFlat([P(-0.02, zt - capH), P(1.02, zt - capH), P(1.02, zt), P(-0.02, zt)], A.cap);
            if (!it.thin) _fpWallTop(it.a[0], it.a[1], it.b[0], it.b[1], nx, ny, zt, it.out);
            edge(0, zt, 1, zt, FP_EDGE.light, 1.5); edge(0, zt - capH, 1, zt - capH, "rgba(8,26,34,0.3)", 1.3); }
    });
    ctx.lineJoin = "miter"; ctx.lineCap = "butt";
}

// ── the wall unit: the power pack, crystal powered ──
function _fpStyleFixture(it) {
    if (it.kind !== "power_pack_area") {   // a lettered wall sign: a pale board in an ink frame with bars of the room's accent and a crystal (the wording is not decided)
        const P = (u, z) => _fpP(it.a[0] + (it.b[0] - it.a[0]) * u, it.a[1] + (it.b[1] - it.a[1]) * u, z), acc = _fpAcc(it.room), f = _fpFrame();
        _fpFillSoft([P(0, 24), P(1, 24), P(1, 64), P(0, 64)], FP_PAL.ink, FP_PAL.ink, 4); _fpFillSoft([P(0.02, 27), P(0.98, 27), P(0.98, 61), P(0.02, 61)], FP_PAL.cap, FP_PAL.ink, 2.5);
        for (let i = 0; i < 6; i++) _fpFillSoft([P(0.2 + i * 0.1, 36), P(0.27 + i * 0.1, 36), P(0.27 + i * 0.1, 52), P(0.2 + i * 0.1, 52)], _fpRgba(acc, 0.85 + 0.1 * Math.sin(f * 0.04 + i)), "rgba(0,0,0,0)");
        const c = P(0.08, 44); _fpCrystal(c[0], c[1] + 10, 18, 6, acc, f, 1); return;
    }
    const f = _fpFrame(), z0 = 16, z1 = 62, P = (u, z) => _fpP(it.a[0] + (it.b[0] - it.a[0]) * u, it.a[1] + (it.b[1] - it.a[1]) * u, z);
    _fpFillSoft([P(0, z0), P(1, z0), P(1, z1), P(0, z1)], FP_PAL.tealDark, FP_PAL.ink, 3.5);
    _fpFillSoft([P(0.03, z0 + 3), P(0.97, z0 + 3), P(0.97, z1 - 12), P(0.03, z1 - 12)], "#12323a", FP_PAL.ink, 2.5);
    const n = 4;   // the cells: tall capsules, charged from the bottom, cyan to blue, each pulsing in turn
    for (let i = 0; i < n; i++) { const u0 = 0.08 + i * 0.225, u1 = u0 + 0.17, ch = 0.55 + 0.4 * (0.5 + 0.5 * Math.sin(f * 0.03 + i * 1.7)), zt = z0 + 7 + (z1 - 12 - z0 - 10) * ch;
        _fpFillSoft([P(u0, z0 + 7), P(u1, z0 + 7), P(u1, z1 - 15), P(u0, z1 - 15)], "rgba(9,22,28,0.9)", "rgba(120,200,210,0.6)", 1); _fpFillSoft([P(u0 + 0.01, z0 + 8), P(u1 - 0.01, z0 + 8), P(u1 - 0.01, zt), P(u0 + 0.01, zt)], i & 1 ? FP_PAL.blue : FP_PAL.cyan, "rgba(0,0,0,0)");
        const c = P((u0 + u1) / 2, zt); _fpGlow(c[0], c[1], 22, i & 1 ? FP_PAL.blue : FP_PAL.cyan, 0.3); }
    const c = P(0.5, z1 - 5); _fpCrystal(c[0], c[1] + 6, 13, 6, FP_PAL.violet, f, 3);   // a crystal shard on the header: this unit is crystal powered
    const p = P(0, z0 + 2), q = P(1, z0 + 2); ctx.strokeStyle = FP_PAL.cyan; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
}

// ── wall decor, in the style (only the kinds the prototype room has; the rest still draw as before) ──
const FP_STYLE_WALL = {
    pipe: (it, f) => { const z = it.z || 60; _fpWQuad(it, 0, 1, z, z + 6, FP_PAL.tealLit, FP_PAL.ink, 2.5); _fpWLine(it, 0.01, z + 5, 0.99, z + 5, "rgba(255,255,255,0.55)", 1.5); for (const u of [0, 1]) _fpWQuad(it, Math.max(0, u - 0.012), Math.min(1, u + 0.012), z - 1, z + 7, FP_PAL.tealDark, FP_PAL.ink, 1); },
    panel: (it, f) => { const z0 = it.z || 22; _fpWQuad(it, 0.15, 0.85, z0, z0 + 30, FP_PAL.case, FP_PAL.ink, 2.5); _fpWQuad(it, 0.22, 0.78, z0 + 5, z0 + 17, "#12323a", null); _fpWLine(it, 0.28, z0 + 11, 0.72, z0 + 11, FP_PAL.cyan, 2); const l = _fpWP(it, 0.5, z0 + 24); ctx.fillStyle = Math.floor(f / 30 + it.seed) % 4 === 0 ? FP_PAL.amber : FP_PAL.cyan; ctx.beginPath(); ctx.arc(l[0], l[1], 3, 0, 6.2832); ctx.fill(); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 1; ctx.stroke(); },
    vent: (it, f) => { const z0 = it.z || 40; _fpWQuad(it, 0.1, 0.9, z0, z0 + 16, FP_PAL.case, FP_PAL.ink, 2.5); for (let k = 0; k < 3; k++) _fpWQuad(it, 0.18, 0.82, z0 + 3 + k * 4, z0 + 5 + k * 4, FP_PAL.tealDark, null); },
    screen: (it, f) => { const z0 = it.z || 34; _fpWQuad(it, 0.08, 0.92, z0, z0 + 28, FP_PAL.tealDark, FP_PAL.ink, 3); _fpWQuad(it, 0.14, 0.86, z0 + 4, z0 + 24, "#0d2a33", null); for (let k = 0; k < 6; k++) { const hh = 3 + 12 * (0.5 + 0.5 * Math.sin(f * 0.04 + k * 1.3 + it.seed)); _fpWQuad(it, 0.2 + k * 0.1, 0.27 + k * 0.1, z0 + 5, z0 + 5 + hh, k & 1 ? FP_PAL.blue : FP_PAL.cyan, null); } },
    wall_light: (it, f) => { const z = it.z || 62, fl = it.h ? (0.6 + 0.4 * Math.sin(f * 0.1 + it.seed) * (Math.sin(f * 0.017 + it.seed) > 0.1 ? 1 : 0.3)) : 1; _fpWQuad(it, 0.05, 0.95, z, z + 5, FP_PAL.tealDark, FP_PAL.ink, 1.5); _fpWQuad(it, 0.09, 0.91, z + 1, z + 4, _fpRgba(FP_PAL.white, 0.6 + 0.4 * Math.max(0, fl)), null); ctx.globalCompositeOperation = "lighter"; _fpWQuad(it, 0, 1, z - 20, z + 4, _fpRgba(FP_PAL.cyan, 0.07 * Math.max(0, fl)), null); ctx.globalCompositeOperation = "source-over"; },
    hazard_sign: (it, f) => { const c = _fpWP(it, 0.5, it.z || 44); ctx.fillStyle = FP_PAL.amber; ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c[0], c[1] - 11); ctx.lineTo(c[0] + 11, c[1]); ctx.lineTo(c[0], c[1] + 11); ctx.lineTo(c[0] - 11, c[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = FP_PAL.ink; ctx.fillRect(c[0] - 1.3, c[1] - 6, 2.6, 7); ctx.fillRect(c[0] - 1.3, c[1] + 3, 2.6, 2.6); },
};

// ── furniture, in the style: chunky boxes and cylinders, bold silhouette outline, flat value-separated faces, a white shine ──
function _fpStyleCyl(x, y, r, z0, z1, body, lit, top, lw) {   // a toon cylinder: flat side, a lit stripe, a top disc, one bold outline
    const c0 = _fpP(x, y, z0), c1 = _fpP(x, y, z1), rx = TILE_W * r * 1.4142, ry = TILE_H * r * 1.4142, w = lw || 3;
    ctx.lineJoin = "round"; ctx.fillStyle = body; ctx.beginPath(); ctx.ellipse(c0[0], c0[1], rx, ry, 0, 0, 3.1416); ctx.lineTo(c1[0] - rx, c1[1]); ctx.ellipse(c1[0], c1[1], rx, ry, 0, 3.1416, 0, true); ctx.closePath(); ctx.fill();
    ctx.fillStyle = lit; ctx.beginPath(); ctx.moveTo(c0[0] + rx * 0.45, c0[1] + ry * 0.9); ctx.lineTo(c1[0] + rx * 0.45, c1[1] + ry * 0.9); ctx.lineTo(c1[0] + rx * 0.8, c1[1] + ry * 0.6); ctx.lineTo(c0[0] + rx * 0.8, c0[1] + ry * 0.6); ctx.closePath(); ctx.fill();   // the lit stripe
    ctx.fillStyle = top; ctx.beginPath(); ctx.ellipse(c1[0], c1[1], rx, ry, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(c0[0], c0[1], rx, ry, 0, 0, 3.1416); ctx.lineTo(c1[0] - rx, c1[1]); ctx.ellipse(c1[0], c1[1], rx, ry, 0, 3.1416, 0, true); ctx.closePath(); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(c1[0], c1[1], rx, ry, 0, 0, 6.2832); ctx.stroke(); ctx.lineJoin = "miter";
    return { c0, c1, rx, ry };
}
function _fpStyleReel(x, y, z, r, f, seed, col) {   // a tape reel lying flat: a dark rim, a lit hub, spokes that turn
    const c = _fpP(x, y, z), rx = TILE_W * r * 1.4142, ry = TILE_H * r * 1.4142; ctx.fillStyle = FP_PAL.ink; ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, ry, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = FP_PAL.cap; ctx.beginPath(); ctx.ellipse(c[0], c[1], rx * 0.78, ry * 0.78, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = FP_PAL.tealDark; ctx.lineWidth = 2.5; for (let i = 0; i < 3; i++) { const a = f * 0.05 * (seed ? 1 : -1) + i * 2.0944; ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + Math.cos(a) * rx * 0.72, c[1] + Math.sin(a) * ry * 0.72); ctx.stroke(); }
    ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(c[0], c[1], rx * 0.24, ry * 0.24, 0, 0, 6.2832); ctx.fill(); return c;
}
// a piece of 3-D computer equipment, one per cell of the console bank: a chunky cabinet with knobs and lamps, and on top (by position in the bank) a CRT monitor with a thick bezel and a keyboard, or a tape drive with two turning reels
function _fpStyleComputer(it) {
    const x = it.x, y = it.y, f = _fpFrame(), seed = it.seed || 0, fx = x < 14, v = (((Math.round(fx ? y : x)) % 3) + 3) % 3, acc = v === 2 ? FP_PAL.violet : _fpAcc(it.room);   // a bank against the west wall faces east (+x); one against the north wall faces south (+y)
    const W = (u, w) => fx ? [x + w, y + u] : [x + u, y + w], pt = (u, w, z) => { const q = W(u, w); return _fpP(q[0], q[1], z); }, face = (u0, u1, z0, z1, fill, stroke) => fx ? _fpFaceX(it, u0, u1, z0, z1, fill, stroke) : _fpFaceY(it, u0, u1, z0, z1, fill, stroke), front = fx ? it.sx : it.sy;
    const rect = (u0, u1, w0, w1) => { const a = W(u0, w0), b = W(u1, w1); return [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; };
    // the bank is ONE machine: the units run into each other (no outline or rounded corner where two meet), the ends are rounded, and everything stands on the same continuous desk
    const first = fx ? it.top : it.lf, last = fx ? it.sy : it.sx, endC = 0.12, cs = [first ? endC : 0, first ? endC : 0, last ? endC : 0, last ? endC : 0], skip = fx ? (first ? [] : [0]).concat(last ? [] : [4]) : (first ? [] : [6]).concat(last ? [] : [2]);
    const rbox = (u0, u1, w0, w1, z0, z1, top, sy, sx, c, lw, joined) => { const r = rect(u0, u1, w0, w1); _fpRBox(r[0], r[1], r[2], r[3], z0, z1, top, sy, sx, c, lw, joined ? skip : []); };
    _fpFootShadow(x, y, 0.5);
    rbox(-0.5, 0.5, -0.5, 0.5, 0, 26, FP_PAL.caseLit, FP_PAL.case, _fpShade(FP_PAL.caseLit, 0.93), cs, 3.5, true);   // the cabinet run
    rbox(-0.5, 0.5, -0.5, -0.36, 26, 34, FP_PAL.tealLit, FP_PAL.teal, FP_PAL.tealLit, cs, 3.5, true);              // the back rail along the wall that ties the units together
    if (front) {   // the front: a vent slot, three big knobs, a row of lamps
        face(0.12, 0.88, 14, 21, "#12323a", null); for (let i = 0; i < 4; i++) face(0.16 + i * 0.2, 0.28 + i * 0.2, 16, 19, "rgba(49,232,255,0.5)", null);
        for (let i = 0; i < 3; i++) { const c = pt(-0.28 + i * 0.28, 0.5, 7); ctx.fillStyle = [FP_PAL.amber, acc, FP_PAL.violet][i]; ctx.beginPath(); ctx.arc(c[0], c[1], 3.6, 0, 6.2832); ctx.fill(); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 2.5; ctx.stroke(); }
    }
    if (v === 1) {   // the tape drive: a rounded block on the desk with two reels and a strip of tape between them
        rbox(-0.4, 0.4, -0.3, 0.38, 26, 40, FP_PAL.tealLit, FP_PAL.teal, FP_PAL.tealLit, 0.14, 3.5, false);
        const r0 = W(-0.2, 0.04), r1 = W(0.2, 0.04), a = _fpStyleReel(r0[0], r0[1], 40, 0.18, f, seed & 1, acc), b = _fpStyleReel(r1[0], r1[1], 40, 0.18, f, 0, FP_PAL.violet);
        ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(a[0] + 6, a[1] + 5); ctx.lineTo(a[0] + 18, a[1] + 14); ctx.lineTo(b[0] - 18, b[1] + 14); ctx.lineTo(b[0] - 6, b[1] + 5); ctx.stroke();
        if (front) face(0.2, 0.8, 28, 38, "rgba(10,30,38,0.55)", null);
    } else {         // a monitor on a plinth: a chunky rounded back, a rounded bezel plate, a flat rounded screen with one shine; and a real keyboard in front
        const wf = 0.12, wb = 0.0, pul = 0.8 + 0.2 * Math.sin(f * 0.05 + seed);
        rbox(-0.36, 0.36, -0.34, 0.06, 26, 32, FP_PAL.case, FP_PAL.wallDark, FP_PAL.case, 0.1, 3.5, false);              // the plinth the monitor stands on
        rbox(-0.4, 0.4, -0.36, wf, 32, 58, FP_PAL.caseLit, FP_PAL.case, _fpShade(FP_PAL.caseLit, 0.93), 0.13, 3.5, false);   // the SHELL: one chunky rounded-corner box the full depth of the monitor, like the cabinet
        const sd = (w, z) => pt(0.4, w, z), seam = (w0, z0, w1, z1, col, lw) => { const p0 = sd(w0, z0), p1 = sd(w1, z1); ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); };
        _fpQuad([sd(-0.28, 36), sd(-0.06, 36), sd(-0.06, 55), sd(-0.28, 55)], "rgba(27,54,64,0.1)", "rgba(27,54,64,0.55)", 2);   // THE SIDE PANEL: an inset panel with vent slats and a knob (the side the camera sees)
        for (let i = 0; i < 4; i++) seam(-0.24, 40 + i * 3.6, -0.1, 40 + i * 3.6, "rgba(27,54,64,0.6)", 2);
        const kn = sd(-0.17, 51.5); ctx.fillStyle = acc; ctx.beginPath(); ctx.arc(kn[0], kn[1], 2.6, 0, 6.2832); ctx.fill(); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 2; ctx.stroke();
        seam(-0.33, 34, -0.33, 56, "rgba(27,54,64,0.35)", 1.5);   // a panel join near the back
        _fpQuad(_fpRRectPts(pt, -0.4, 0.4, 31.5, 58, 0.11, 7, wf), FP_PAL.caseLit, FP_PAL.ink, 3.5);   // the shell's rounded front face
        _fpQuad(_fpRRectPts(pt, -0.335, 0.335, 34.5, 55, 0.1, 6, wf), "#bfd3da", FP_PAL.ink, 2.5);        // the recessed bezel inside the shell: a visible rim of outer shell all round
        _fpQuad(_fpRRectPts(pt, -0.3, 0.3, 35, 54, 0.12, 8, wf), FP_PAL.ink, FP_PAL.ink, 1);
        const cs2 = pt(0, wf, 44.5), g = ctx.createRadialGradient(cs2[0], cs2[1], 2, cs2[0], cs2[1], 24); g.addColorStop(0, _fpRgba(acc, 0.6 + 0.2 * pul)); g.addColorStop(1, _fpRgba(acc, 0.34));
        _fpQuad(_fpRRectPts(pt, -0.27, 0.27, 37, 52, 0.12, 7, wf), g, null);
        for (let i = 0; i < 2; i++) { const zz = 41 + i * 4.5, w = 0.12 + 0.14 * (0.5 + 0.5 * Math.sin(f * 0.04 + i * 1.7 + seed)), p0 = pt(-0.2, wf, zz), p1 = pt(-0.2 + w * 2, wf, zz); ctx.strokeStyle = FP_PAL.white; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
        ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); const hl = pt(-0.22, wf, 49), hm = pt(-0.2, wf, 51.5), hr = pt(-0.1, wf, 51.5); ctx.moveTo(hl[0], hl[1]); ctx.quadraticCurveTo(hm[0], hm[1], hr[0], hr[1]); ctx.stroke(); ctx.lineCap = "butt";
        _fpGlow(cs2[0], cs2[1], 36, acc, 0.2 * pul);
        // THE KEYBOARD: a rounded tray, a slight slope, four rows of keys with dark gaps, a long space bar, two lit keys
        rbox(-0.42, 0.42, 0.18, 0.5, 26, 28, FP_PAL.cap, FP_PAL.wallLit, FP_PAL.cap, 0.05, 2.5, false);
        const rows = 4, cols = 10, du = 0.8 / cols, dw = 0.26 / rows, kq = (u0, u1, w0, w1, z0, z1, col) => _fpQuad([pt(u0, w0, z0), pt(u1, w0, z0), pt(u1, w1, z1), pt(u0, w1, z1)], col, "rgba(27,54,64,0.7)", 1);
        for (let r = 0; r < rows; r++) { const w0 = 0.21 + r * dw + 0.006, w1 = 0.21 + (r + 1) * dw - 0.006, z0 = 29.6 - r * 0.5, z1 = 29.6 - (r + 1) * 0.5;   // (higher at the back, lower at the front)
            if (r === rows - 1) { kq(-0.3, 0.2, w0, w1, z0, z1, FP_PAL.wallLit); kq(0.22, 0.4, w0, w1, z0, z1, FP_PAL.wallDark); continue; }   // the space bar row
            for (let c = 0; c < cols; c++) kq(-0.4 + c * du + 0.004, -0.4 + (c + 1) * du - 0.004, w0, w1, z0, z1, (r === 0 && (c === 2 || c === 7)) ? acc : (c === 0 || c === cols - 1) ? FP_PAL.wallDark : FP_PAL.wallLit); }
    }
}
function _fpStyleProp(it) {
    const k = it.kind, f = _fpFrame(), seed = it.seed || 0, x = it.x, y = it.y;
    if (k === "generator") {   // crystal powered: a chunky case, a big dial, a glowing core behind glass, a mast with a blinking bulb, a shard on top
        _fpFootShadow(x, y, 0.5);
        _fpSBox(x - 0.5, y - 0.5, x + 0.5, y + 0.5, 0, 46, FP_PAL.caseLit, FP_PAL.teal, FP_PAL.tealLit, 3.5);
        if (it.sy) { _fpFaceY(it, 0.12, 0.88, 6, 40, FP_PAL.ink, null); _fpFaceY(it, 0.18, 0.82, 9, 37, "#12323a", null); const pul = 0.6 + 0.4 * Math.sin(f * 0.05 + seed); _fpFaceY(it, 0.3, 0.7, 12, 28, _fpRgba(FP_PAL.cyan, 0.4 + 0.35 * pul), null); _fpFaceY(it, 0.44, 0.56, 12, 28, _fpRgba(FP_PAL.white, 0.55 + 0.4 * pul), null); const g = _fpP(x, y + 0.5, 20); _fpGlow(g[0], g[1], 32, FP_PAL.cyan, 0.26 * pul);
            const d = _fpP(x, y + 0.5, 34); _fpDial(d[0] - 9, d[1], 7, f, seed, FP_PAL.violet); for (let i = 0; i < 3; i++) { ctx.fillStyle = (Math.floor(f / 20) + i) % 3 === 0 ? FP_PAL.white : [FP_PAL.amber, FP_PAL.cyan, FP_PAL.violet][i]; ctx.beginPath(); ctx.arc(d[0] + 6 + i * 7, d[1] + 1, 3, 0, 6.2832); ctx.fill(); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 2; ctx.stroke(); } }
        if (it.sx) _fpFaceX(it, 0.1, 0.9, 6, 12, FP_PAL.tealDark, null);
        if (it.top) { const c = _fpP(x, y, 46); _fpCrystal(c[0], c[1], 24, 9, FP_PAL.violet, f, seed); const m0 = _fpP(x + 0.3, y - 0.3, 46), m1 = _fpP(x + 0.3, y - 0.3, 66); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(m0[0], m0[1]); ctx.lineTo(m1[0], m1[1]); ctx.stroke(); ctx.fillStyle = Math.floor(f / 24) % 2 ? FP_PAL.amber : "#ffdf99"; ctx.beginPath(); ctx.arc(m1[0], m1[1], 4, 0, 6.2832); ctx.fill(); ctx.stroke(); _fpGlow(m1[0], m1[1], 14, FP_PAL.amber, Math.floor(f / 24) % 2 ? 0.4 : 0.1); }
    } else if (k === "crate" || k === "crate_stack") {   // storage cases: chunky, pale, an X brace and a cyan latch
        _fpFootShadow(x, y, 0.5);
        const h = k === "crate" ? 34 : 64; _fpSBox(x - 0.5, y - 0.5, x + 0.5, y + 0.5, 0, h, FP_PAL.caseLit, FP_PAL.case, _fpShade(FP_PAL.caseLit, 0.96), 3.5);
        if (it.sy) { for (let l = 0; l < (k === "crate" ? 1 : 2); l++) { const z0 = l * 32 + 4, z1 = l * 32 + 30, p = _fpP(x - 0.46, y + 0.5, z0), q = _fpP(x + 0.46, y + 0.5, z1), p2 = _fpP(x + 0.46, y + 0.5, z0), q2 = _fpP(x - 0.46, y + 0.5, z1); ctx.strokeStyle = "rgba(27,54,64,0.55)"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.moveTo(p2[0], p2[1]); ctx.lineTo(q2[0], q2[1]); ctx.stroke(); }
            _fpFaceY(it, 0.4, 0.6, h * 0.5 - 6, h * 0.5 + 6, FP_PAL.cyan, FP_PAL.ink); }
    } else if (k === "barrel") {   // a chunky drum with a violet band
        _fpFootShadow(x, y, 0.45); _fpStyleCyl(x, y, 0.45, 0, 38, FP_PAL.teal, FP_PAL.tealLit, FP_PAL.tealLit, 3.5);
        const b0 = _fpP(x, y, 12), b1 = _fpP(x, y, 22), rx = TILE_W * 0.45 * 1.4142, ry = TILE_H * 0.45 * 1.4142; ctx.fillStyle = FP_PAL.violet; ctx.beginPath(); ctx.ellipse(b0[0], b0[1], rx, ry, 0, 0, 3.1416); ctx.lineTo(b1[0] - rx, b1[1]); ctx.ellipse(b1[0], b1[1], rx, ry, 0, 3.1416, 0, true); ctx.closePath(); ctx.fill(); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 2.5; ctx.stroke();
    } else if (k === "console") { _fpStyleComputer(it);
    } else if (k === "plant") {   // a chunky pot, big simple leaves
        _fpStyleCyl(x, y, 0.28, 0, 16, FP_PAL.tealLit, FP_PAL.cap, FP_PAL.teal, 3); const b = _fpP(x, y, 16);
        for (let i = 0; i < 5; i++) { const a = i * 1.26 + seed, dx = Math.cos(a) * 11, dy = -14 - (i % 3) * 7; ctx.fillStyle = i & 1 ? FP_PAL.leaf : "#6cbf9f"; ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.ellipse(b[0] + dx, b[1] + dy, 6, 10, a * 0.3, 0, 6.2832); ctx.fill(); ctx.stroke(); }
    } else return _fpStylePropMore(it);
    return true;
}

// ── the crystal's pad and its tank ──
// The crystal floats in a glass tank of glowing liquid seated in a round pad machine on the floor. (Until build 2026-11-09xx it hung over the pad, hooked up to a machine in the ceiling by three posts and
// energy lines; the owner, 2026-11-10: "Remove the cap/roof and the columns. I want want oval tank that bubbles".) Two items in every styled room that has the objective, one each side of the crystal:
function _fpStyleRigs(F) {
    const out = [];
    for (const r of F.rooms) { if (!facilityStyleRoom(r.id)) continue; const ob = (r.objects || []).find(o => o.type === "objective"); if (!ob) continue; const x = Math.round(ob.at[0]), y = Math.round(ob.at[1]); const base = facilityRoomHeight(r.id, F) * FP_ELEV_PX;
        out.push({ type: "fp", fp: "rigpad", x, y, room: r.id, base, depth: x + y + 2.05 });   // the pad, the tank's far wall and the liquid: after every floor tile the pad covers (the nearest is two tiles on), then the crystal
        out.push({ type: "fp", fp: "tank", x, y, room: r.id, base, depth: x + y + 2.15 });     // the tank's near side, over the crystal: the liquid in front of it, the bubbles, the surface and the glass
        _fp.crystalDepth = x + y + 2.1; }
    return out;
}
function _fpStyleRigPadFlat(it) {
    const f = _fpFrame(), cx = typeof crystal !== "undefined" && crystal && typeof crystal.x === "number" ? crystal.x : it.x, cy = typeof crystal !== "undefined" && crystal && typeof crystal.y === "number" ? crystal.y : it.y, R = 1.5, P = _fpP;
    const line = (p, q, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }, ring = (x, y, z, r, col, w) => { const c = P(x, y, z); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(c[0], c[1], r * TILE_W * 1.4142, r * TILE_H * 1.4142, 0, 0, 6.2832); ctx.stroke(); };
    // 4. the pad: a raised round machine under the crystal, a bold outline, neon rings, an emitter, four clamps
    _fpDisc(cx + 0.12, cy + 0.12, 0, R + 0.1, "rgba(27,54,64,0.18)", null);
    _fpStyleCyl(cx, cy, R, 0, 10, FP_PAL.tealLit, FP_PAL.cap, FP_PAL.caseLit, 4);
    _fpDisc(cx, cy, 10, R * 0.84, FP_PAL.wallLit, FP_PAL.ink); ring(cx, cy, 10, R * 0.72, FP_PAL.cyan, 3.5); ring(cx, cy, 10, R * 0.5, FP_PAL.violet, 3);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + f * 0.004, p0 = P(cx + Math.cos(a) * R * 0.5, cy + Math.sin(a) * R * 0.5, 10), p1 = P(cx + Math.cos(a) * R * 0.72, cy + Math.sin(a) * R * 0.72, 10); line(p0, p1, "rgba(22,48,58,0.55)", 2); }   // the segment seams between the rings
    _fpDisc(cx, cy, 10, R * 0.26, "#12323a", FP_PAL.ink); const pc = P(cx, cy, 10), pul = 0.7 + 0.3 * Math.sin(f * 0.06); _fpGlow(pc[0], pc[1], 50, FP_PAL.cyan, 0.35 * pul);
    for (const a of [0.7, 2.27, 3.84, 5.41]) _fpStyleCyl(cx + Math.cos(a) * R * 0.96, cy + Math.sin(a) * R * 0.96, 0.11, 10, 15, FP_PAL.teal, FP_PAL.tealLit, FP_PAL.cyan, 2.5);
}

// ── THE CRYSTAL PAD, in 3D (design/props/models/crystalpad.js -> img/props/crystalpad.png): the pad on the floor is a baked sprite; what moves is painted live over it ──
// (The sheet's other cell, `rig`, the crown in the ceiling with its posts, is not drawn since build 2026-11-09xx.) The flat drawing above (_fpStyleRigPadFlat) is what is drawn until the sheet has arrived, and where
// there is no canvas to bake from.
const FP_PAD = { z: 23.2, rings: [0.951, 0.673, 0.441], pylonAt: [0.5, 1.5, 2.5, 3.5] };   // the deck's height in game px; the three inlaid rings' radii in tiles; the four pylons' angles (x PI/2, plus 1/4 PI in the model)
function _fpCrystalXY(it) { return [typeof crystal !== "undefined" && crystal && typeof crystal.x === "number" ? crystal.x : it.x, typeof crystal !== "undefined" && crystal && typeof crystal.y === "number" ? crystal.y : it.y]; }
// an arc of an ellipse on the floor plane's projection (radius r in tiles, at height z), from angle a0 to a1 (the ellipse's own parameter)
function _fpPadArc(cx, cy, z, r, a0, a1, col, w) { const c = _fpP(cx, cy, z); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(c[0], c[1], r * TILE_W * 1.4142, r * TILE_H * 1.4142, 0, a0, a1); ctx.stroke(); }
function _fpStyleRigPad(it) {
    const [cx, cy] = _fpCrystalXY(it), f = _fpFrame(), P = _fpP, pul = 0.7 + 0.3 * Math.sin(f * 0.06);
    const base = P(cx, cy, 0);
    // under it: a wide soft halo on the floor, so the pad lights the room's floor (not in LOW graphics)
    if (typeof gfxLow === "undefined" || !gfxLow) { ctx.save(); ctx.translate(base[0], base[1]); ctx.scale(1, 0.5); _fpGlow(0, 0, 150, FP_PAL.cyan, 0.16 + 0.05 * pul); ctx.restore(); }
    const spr = typeof _psBlit === "function" && typeof _psImg === "function" && _psImg("crystalpad") ? _psBlit("crystalpad", "pad", cx, cy) : null;
    if (!spr) { _fpStyleRigPadFlat(it); _fpTankBack(cx, cy); return; }
    const c = spr[2], well = c.marks && c.marks.well ? [spr[0] + c.marks.well[0], spr[1] + c.marks.well[1]] : P(cx, cy, FP_PAD.z);
    // the light running round the inlaid rings: a bright spot and a short tail on each, the violet one the other way round, never over a pylon (they stand on the rings)
    ctx.save(); ctx.lineCap = "round";
    [[0, 0.019], [1, -0.027], [2, 0.036]].forEach(([i, sp]) => {
        const r = FP_PAD.rings[i], rgb = i === 1 ? "200,160,255" : "150,245,255", th = f * sp;
        for (let k = 0; k < 7; k++) {
            const a = th - Math.sign(sp) * k * 0.07, aa = ((a % 6.2832) + 6.2832) % 6.2832; let near = false;
            for (const q of [0, 1.5708, 3.1416, 4.7124, 6.2832]) if (Math.abs(aa - q) < 0.17) near = true;   // (the ellipse's parameter at the four pylons)
            if (near) continue;
            _fpPadArc(cx, cy, FP_PAD.z, r, a - 0.05, a + 0.05, "rgba(" + rgb + "," + ((1 - k / 7) * 0.95).toFixed(3) + ")", 3.2 - k * 0.3);
        }
    });
    ctx.restore();
    // the emitter well and the lamps on the four pylons
    _fpGlow(well[0], well[1] - 4, 48, FP_PAL.cyan, 0.34 * pul);
    for (const q of FP_PAD.pylonAt) { const a = q * Math.PI / 2, lp = P(cx + Math.cos(a) * 0.98, cy + Math.sin(a) * 0.98, 36); _fpGlow(lp[0], lp[1], 15, FP_PAL.cyan, 0.38 * pul); }
    _fpTankBack(cx, cy);   // (the hover field that rose off the well to the crystal went with the tank: the tank stands in the well)
}

// ── THE CRYSTAL'S TANK (build 2026-11-09xx; the owner, 2026-11-10: "I want want oval tank that bubbles"; of the draft, "No hoops, plain glass"; "The crystal should rise within it") ──
// An upright oval of plain glass seated in the pad's well (design/props/models/crystaltank.js -> img/props/crystaltank.png: `back`, its far wall and the steel collar it sits in, and `front`, its near wall),
// full of glowing liquid with bubbles rising through it; the crystal floats in the middle, slowly rising and sinking (js/game.js). Drawn in two passes round the crystal: the pad item draws the far wall, the
// liquid and the bubbles behind the middle (_fpTankBack); the `tank` item, just after the crystal, a thin film of the liquid over it, the surface, the bubbles in front and the near wall (_fpStyleTankFront).
// Heights in game px over the floor, the radius in tiles; the model has the same r, z0 and z1. gemZ and rise: the crystal's middle and how far it rises and sinks (the agent's numbers, provisional).
const FP_TANK = { r: 0.56, z0: 26, z1: 192, fill: 0.84, gemZ: 104, rise: 12 };
function _fpTankR(z) { const T = FP_TANK, t = (z - (T.z0 + T.z1) / 2) / ((T.z1 - T.z0) / 2); return t * t >= 1 ? 0 : T.r * Math.sqrt(1 - t * t); }   // the oval's radius at a height
// the liquid as seen through the glass: the oval's outline (a little inside the glass) below the far edge of the surface, in a light-to-deep cyan
function _fpTankLiquid(cx, cy, a) {
    const T = FP_TANK, zc = (T.z0 + T.z1) / 2, zf = T.z0 + (T.z1 - T.z0) * T.fill, c = _fpP(cx, cy, zc), s = _fpP(cx, cy, zf), rf = _fpTankR(zf) * 0.96 * TILE_W * 1.4142;
    const hx = T.r * 0.96 * TILE_W * 1.4142, hy = Math.hypot(T.r * TILE_H * 1.4142, (T.z1 - T.z0) / 2) * 0.97, bot = c[1] + hy;   // (an upright oval's outline on screen is an ellipse this size round its middle)
    ctx.save(); ctx.beginPath(); ctx.ellipse(c[0], c[1], hx, hy, 0, 0, 6.2832); ctx.clip();
    const gr = ctx.createLinearGradient(0, s[1], 0, bot); gr.addColorStop(0, "rgba(80,220,255," + a + ")"); gr.addColorStop(1, "rgba(10,105,190," + a + ")"); ctx.fillStyle = gr;
    ctx.beginPath(); ctx.moveTo(s[0] - rf, s[1]); ctx.ellipse(s[0], s[1], rf, rf * TILE_H / TILE_W, 0, Math.PI, 2 * Math.PI); ctx.lineTo(c[0] + hx + 2, s[1]); ctx.lineTo(c[0] + hx + 2, bot + 2); ctx.lineTo(c[0] - hx - 2, bot + 2); ctx.lineTo(c[0] - hx - 2, s[1]); ctx.closePath(); ctx.fill();
    ctx.restore();
}
// the bubbles: each rises from the well to the surface, wobbling and growing a little as it climbs, and bursts there in a spreading ring; those behind the tank's middle are drawn behind the crystal (front false), the others over it
function _fpTankBubbles(cx, cy, front) {
    const T = FP_TANK, f = _fpFrame(), zs = T.z0 + 10, zf = T.z0 + (T.z1 - T.z0) * T.fill, n = typeof gfxLow !== "undefined" && gfxLow ? 8 : 16;
    ctx.lineWidth = 1;
    for (let i = 0; i < n; i++) {
        const cyc = (f * (0.0016 + (i % 5) * 0.00045) + i * 0.618) % 1, a = i * 2.4 + f * 0.004, rho = 0.25 + ((i * 7) % 11) / 11 * 0.6, k = Math.min(1, cyc / 0.92);
        const z = zs + (zf - 3 - zs) * k, rr = _fpTankR(z) * rho * 0.8, wob = Math.sin(f * 0.07 + i * 1.7) * 0.03, dx = Math.cos(a) * rr + wob, dy = Math.sin(a) * rr - wob;
        if (cyc < 0.92) { if ((dx + dy >= 0) !== front) continue; const p = _fpP(cx + dx, cy + dy, z), r = 1.4 + (i % 3) * 0.6 + k * 1.2;
            ctx.fillStyle = "rgba(225,255,255,0.25)"; ctx.strokeStyle = "rgba(235,255,255,0.85)"; ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, 6.2832); ctx.fill(); ctx.stroke();
            ctx.fillStyle = "#ffffff"; ctx.fillRect(Math.round(p[0] - r * 0.5), Math.round(p[1] - r * 0.6), 1, 1);
        } else if (front) { const b = (cyc - 0.92) / 0.08, p = _fpP(cx + dx, cy + dy, zf), w = (0.02 + 0.07 * b) * TILE_W * 1.4142;   // (a burst is on the surface, which is drawn over the crystal: every burst is drawn with the front)
            ctx.strokeStyle = "rgba(220,255,255," + (0.75 * (1 - b)).toFixed(3) + ")"; ctx.beginPath(); ctx.ellipse(p[0], p[1], w, w * TILE_H / TILE_W, 0, 0, 6.2832); ctx.stroke(); }
    }
}
// behind the crystal: the glass's far wall and its collar, the liquid, the bubbles behind the middle
function _fpTankBack(cx, cy) {
    if (typeof _psBlit === "function" && typeof _psImg === "function" && _psImg("crystaltank")) _psBlit("crystaltank", "back", cx, cy);
    _fpTankLiquid(cx, cy, 0.5); _fpTankBubbles(cx, cy, false);
}
// over the crystal: a thin film of the liquid (so the crystal is IN it), the surface with its lit rim, the bubbles in front and the bursts, and the glass's near wall (an outline until the sheet has arrived)
function _fpStyleTankFront(it) {
    const [cx, cy] = _fpCrystalXY(it), T = FP_TANK, zf = T.z0 + (T.z1 - T.z0) * T.fill, s = _fpP(cx, cy, zf), rf = _fpTankR(zf) * 0.96 * TILE_W * 1.4142;
    _fpTankLiquid(cx, cy, 0.16);
    ctx.fillStyle = "rgba(150,240,255,0.22)"; ctx.strokeStyle = "rgba(190,252,255,0.85)"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(s[0], s[1], rf, rf * TILE_H / TILE_W, 0, 0, 6.2832); ctx.fill(); ctx.stroke();
    _fpTankBubbles(cx, cy, true);
    if (typeof _psBlit === "function" && typeof _psImg === "function" && _psImg("crystaltank") && _psBlit("crystaltank", "front", cx, cy)) return;
    const c = _fpP(cx, cy, (T.z0 + T.z1) / 2); ctx.strokeStyle = "rgba(225,250,255,0.55)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(c[0], c[1], T.r * TILE_W * 1.4142, Math.hypot(T.r * TILE_H * 1.4142, (T.z1 - T.z0) / 2), 0, 0, 6.2832); ctx.stroke();
}

// ── room lighting: a room you are not in is not lit up ──
// Lighting is PER ITEM, in the item's own depth order (not a layer over the screen), so a wall or prop in front is never darkened by a room behind it:
//   - every wall piece, door, prop, post, fixture and decor is darkened right after it is drawn, by the light level of the room that shows its face (the room on its camera-facing side);
//   - every floor tile is darkened by its own tile level.
// Levels: the room the player stands in is fully lit (the stair room counts as part of the hallway: no change of light on the stairs); every other room is dark. When a door is OPEN (a unit is near it,
// or it is a stairway) the room beyond it is lit on the GROUND only, in a pool near the door; it lights up completely only when the player steps on one of its tiles. Levels ease.
var FP_DARK = 0.82, FP_POOL = 0.7, FP_POOL_R = 3.6, FP_LIGHT_EASE = 0.12;
// a room that stays DIM with you in it and the power on (the owner, 2026-11-07: "a dark server room"): its light level is held at this (the agent's number, provisional); its racks' lights blink over it (js/propsprites.js)
const FP_ROOM_DIM = { front_lobby: 0.42, elec_servers: 0.42, elec_circuitry: 0.42 };   // (the electrical domain under the Server Room as dim as it: look A, docs/DOMAINS.md)
// THE POWERED ROOM'S LEVEL (the owner, 2026-11-09: "the lighting in the facility is too bright, and the walls, it just looks way too bright for what I'm going for"; then, of four levels in pictures,
// "C · two fifths darker (0.5)"): the room you stand in, with power, is lit to this (1 was its palette as drawn): floor, walls, doors and props together; units, effects and the screen's controls are never
// dimmed. A dim room (FP_ROOM_DIM) is that much darker again. The preview ?lit=<0.4 to 1> tries another level (read once: location.search is slow in Safari).
const FP_LIT = 0.5;
let _fpLitPrev;
function _fpLit() {
    if (_fpLitPrev === undefined) { _fpLitPrev = null; try { const m = typeof location !== "undefined" && /[?&]lit=([\d.]+)/.exec(location.search || ""); const v = m ? parseFloat(m[1]) : NaN; if (v >= 0.4 && v <= 1) _fpLitPrev = v; } catch (e) {} }
    return _fpLitPrev !== null ? _fpLitPrev : FP_LIT;
}
function _fpLightKey(id) { return id === "teleport_stair_room" ? "lab_hallway" : id; }
function _fpLightUpdate(F) {
    _fp.light = _fp.light || new Map(); _fp.pool = _fp.pool || new Map();
    const pr = facilityRoomAt(player.visualX, player.visualY, F), here = pr ? _fpLightKey(pr.id) : (_fp.lastRoom || null); if (here) _fp.lastRoom = here; _fp.here = here;
    const bo = facilityBlackout(), away = typeof attractOn === "function" && attractOn();   // (a blackout: a room is lit, and a door throws a pool, only once it has power: js/facilitytutorial.js; the website's background: every room dim, js/attract.js)
    for (const r of F.rooms) { const k = _fpLightKey(r.id), v = away ? attractRoomLight(k, here) : k === here && (!bo || _fpPowered(k)) ? (FP_ROOM_DIM[k] || 1) * _fpLit() : 0, cur = _fp.light.has(k) ? _fp.light.get(k) : v; if (r.id === k || !_fp.light.has(k)) _fp.light.set(k, Math.abs(v - cur) < 0.01 ? v : cur + (v - cur) * FP_LIGHT_EASE); }
    const pools = [];
    if (!_fp.openings) { _fp.openings = F.openings.map(o => ({ id: o.id, x: (o.a[0] + o.b[0]) / 2, y: (o.a[1] + o.b[1]) / 2, rooms: (F.connections.find(c => c.opening === o.id) || { rooms: o.rooms || [] }).rooms.map(_fpLightKey), ramp: F.connections.some(c => c.opening === o.id && c.ramp) })); _fp.doorItems = new Map(_fp.items.filter(i => i.fp === "door").map(i => [i.id, i])); }
    for (const o of _fp.openings) {
        const di = _fp.doorItems.get(o.id), want = o.ramp ? 1 : (di && di.st && (di.st.open || 0) >= 0.5 ? 1 : 0), cur = _fp.pool.get(o.id) || 0, v = Math.abs(want - cur) < 0.01 ? want : cur + (want - cur) * FP_LIGHT_EASE; _fp.pool.set(o.id, v);
        // a doorway with no door (a stairway) always glows softly on both sides, near or far; a door throws light only when it is open and the room on one side is lit
        if (v > 0.02 && (o.rooms.some(k => (!bo || _fpPowered(k)) && (o.ramp || (_fp.light.get(k) || 0) > 0.5 * _fpLit())))) pools.push({ x: o.x, y: o.y, s: v, rooms: o.rooms, r: o.ramp ? 5.2 : FP_POOL_R, k: (o.ramp ? 0.55 : FP_POOL) * _fpLit() });   // (a pool is never brighter than the lit room it comes from)
    }
    if (away) attractPools(pools);
    _fp.pools = pools;
}
// how lit a floor tile is: its room's level, or (ground only) the pool of light from an open door near it
function _fpPoolAt(x, y, k) {
    let v = 0; const ps = _fp.pools; if (ps) for (const p of ps) { if (k !== null && !p.rooms.includes(k)) continue; const d = Math.hypot(x - p.x, y - p.y); if (d < p.r) v = Math.max(v, p.s * p.k * (1 - d / p.r)); }
    return v;
}
function _fpTileLight(x, y, roomId) {
    const k = _fpLightKey(roomId), v = (_fp.light && _fp.light.get(k)) || 0; if (v > 0.98) return v;
    return Math.max(v, _fpPoolAt(x, y, k), _fpExtraLight(x, y, [k]));   // (and, in a blackout, the monitor lamp and the emergency lights)
}
function _fpRoomLight(roomId) { return (_fp.light && _fp.light.get(_fpLightKey(roomId))) || 0; }
function _fpDarkFill(pts, lv) { _fpDarkFillA(pts, _fpDarkAmt() * (1 - lv)); }
function _fpDarkFillA(pts, a) { if (a < 0.02) return; ctx.fillStyle = "rgba(6,11,22," + a.toFixed(3) + ")"; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); }
// A FLOOR TILE'S OWN SPRITE CARRIES A LIT ROOM'S DARK (FP_LIT below 1): its marks are painted once with this much of the night blue over them (js/facilitydecor.js _fpDrawOps), so the room you stand in
// costs nothing more to darken than it did lit; a tile darker than that (an unlit room, a door's pool, a blackout) takes only the rest (_fpDarkTileOver). None on the website's background (its own lights).
function _fpFloorA0() { return typeof attractOn === "function" && attractOn() ? 0 : FP_DARK * (1 - _fpLit()); }
function _fpDarkTileOver(cx, cy, lv) {
    const a = _fpDarkAmt() * (1 - lv), A0 = _fpFloorA0(); if (a <= A0 + 0.02) return;
    const ex = FP_BASE_EX + 0.4, ey = FP_BASE_EY + 0.3; _fpDarkFillA([[cx, cy - TILE_H - ey], [cx + TILE_W + ex, cy], [cx, cy + TILE_H + ey], [cx - TILE_W - ex, cy]], 1 - (1 - a) / (1 - A0));   // (over A0, the rest: together, a)
}
// An unlit tile's dark covers the tile's opaque base (FP_BASE_EX / FP_BASE_EY, js/facilitydecor.js) and a little more: measured on an unlit pale floor at twice the pixel density, a margin of 1.2 px left a bright dotted line on every tile edge (the base's
// antialiased fringe, uncovered); 0.4 px beyond the base in x and 0.3 in y covers it and leaves a barely darker hair between tiles (more doubles the dark where two tiles overlap).
function _fpDarkTile(cx, cy, lv) { const ex = FP_BASE_EX + 0.4, ey = FP_BASE_EY + 0.3; _fpDarkFill([[cx, cy - TILE_H - ey], [cx + TILE_W + ex, cy], [cx, cy + TILE_H + ey], [cx - TILE_W - ex, cy]], lv); }
// THE DIMMED PEN: an unlit room's things are drawn through a stand-in for the canvas context that darkens every colour it is given (toward the night blue), so each item keeps its exact shape and
// its own place in the depth order. (A screen-wide dark layer, a canvas filter and per-item shadow shapes were all tried: they bleed onto, or show seams against, the rooms in front.)
const _fpDimCache = new Map();
function _fpDimColour(c, k) {
    if (typeof c !== "string") return c; const key = k + c, hit = _fpDimCache.get(key); if (hit) return hit;
    let r, g, b, a = 1, m;
    if ((m = /^#([0-9a-f]{6})$/i.exec(c))) { const n = parseInt(m[1], 16); r = n >> 16; g = (n >> 8) & 255; b = n & 255; }
    else if ((m = /^#([0-9a-f]{3})$/i.exec(c))) { const n = parseInt(m[1], 16); r = ((n >> 8) & 15) * 17; g = ((n >> 4) & 15) * 17; b = (n & 15) * 17; }
    else if ((m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i.exec(c))) { r = +m[1]; g = +m[2]; b = +m[3]; a = m[4] === undefined ? 1 : +m[4]; }
    else return c;
    const out = "rgba(" + Math.round(r * k + 6 * (1 - k)) + "," + Math.round(g * k + 11 * (1 - k)) + "," + Math.round(b * k + 22 * (1 - k)) + "," + a + ")"; if (_fpDimCache.size > 4000) _fpDimCache.clear(); _fpDimCache.set(key, out); return out;
}
// (built once per real context: every method bound once, every property forwarded, the colour setters darkening by the current factor `_k`)
let _fpDimW = null, _fpDimFor = null;
function _fpDimCtx(real, k) {
    if (_fpDimFor !== real) {
        const w = { _k: 1 }; _fpDimFor = real;
        const wrapGrad = (g) => { const add = g.addColorStop; g.addColorStop = function (o, c) { return add.call(g, o, _fpDimColour(c, w._k)); }; return g; };
        for (let o = Object.getPrototypeOf(real); o && o !== Object.prototype; o = Object.getPrototypeOf(o)) for (const n of Object.getOwnPropertyNames(o)) {
            if (n === "constructor" || n in w) continue; const d = Object.getOwnPropertyDescriptor(o, n);
            if (typeof d.value === "function") { const f = d.value.bind(real); w[n] = (n === "createLinearGradient" || n === "createRadialGradient") ? (...a) => wrapGrad(f(...a)) : f; }
            else if (n === "fillStyle" || n === "strokeStyle") Object.defineProperty(w, n, { get: () => real[n], set: (v) => { real[n] = _fpDimColour(v, w._k); } });
            else Object.defineProperty(w, n, { get: () => real[n], set: (v) => { real[n] = v; } });
        }
        _fpDimW = w;
    }
    _fpDimW._k = k; return _fpDimW;
}
// the light level that applies to a facility item (the room that shows its face)
function _fpItemLight(it) {
    if (it.fp === "pickup" || it.fp === "station" || it.fp === "sidequest" || it.fp === "spot") return 0.8;   // (a supply case is lit by its own beacon: it can be found in the dark; Side Quest by his own lamp)
    const lv = _fpItemRoomLight(it); if (lv > 0.98 || it.fp === "rigpad" || it.fp === "tank" || it.fp === "fill") return lv;
    const k = _fpLightKey(it.lroom || it.room || (it.rooms && it.rooms[0])); return Math.max(lv, _fpPoolAt(it.x, it.y, k), _fpExtraLight(it.x, it.y, it.rooms ? it.rooms.map(_fpLightKey) : [k]));   // (near a stairway or an open door, things share its light; in a blackout the monitor lamp and the emergency lights add theirs)
}
// the light on the wall at (x, y) that shows the face of room `roomId` (what a wall piece gets from _fpItemLight: the room's level, or the pool of an open door near it)
function _fpWallLightAt(roomId, x, y) {
    if (!roomId || !_fp || !_fp.light) return undefined;
    const lv = _fpRoomLight(roomId); if (lv > 0.98) return lv;
    const k = _fpLightKey(roomId); return Math.max(lv, _fpPoolAt(x, y, k), _fpExtraLight(x, y, [k]));
}
// draw `fn` with the light of something other than the item being drawn: the pen darkens for light level `lv` exactly as drawFacilityItem's does for an item (js/facilityplay.js); an undefined level draws with the item's own
function _fpWithLight(lv, fn) {
    const cur = ctx, wrapped = !!_fpDimW && cur === _fpDimW, real = wrapped ? _fpDimFor : cur;
    if (lv === undefined || typeof CanvasRenderingContext2D === "undefined" || !(real instanceof CanvasRenderingContext2D)) { fn(); return; }
    const k0 = wrapped ? cur._k : 1;
    ctx = lv < 0.98 ? _fpDimCtx(real, 1 - _fpDarkAmt() * (1 - lv)) : real;
    try { fn(); } finally { ctx = cur; if (wrapped) cur._k = k0; }
}
function _fpItemRoomLight(it) {
    if (it.fp === "door") return Math.max(...(it.rooms || []).map(_fpRoomLight), 0);
    if (it.fp === "wall") return _fpRoomLight(it.lroom || it.room);
    if (it.fp === "stair") return _fpRoomLight(it.room || "lab_hallway");
    if (it.fp === "pillar") { if (it.lt === undefined) { const ids = new Set(); for (const [dx, dy] of [[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7]]) { const r = facilityRoomAt(it.x + dx, it.y + dy, _fp.F); if (r) ids.add(r.id); } it.lt = Array.from(ids); } return it.lt.length ? Math.max(...it.lt.map(_fpRoomLight)) : _fpRoomLight(it.room); }   // a corner post takes the light of the brightest room its visible faces look onto (the three quadrants in front of it, not the one behind)
    if (it.fp === "rigpad" || it.fp === "tank" || it.fp === "fill") return 1;   // (the fill tile darkens itself)
    return _fpRoomLight(it.room);
}
