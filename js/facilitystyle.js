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
const FP_STYLE_ROOMS = new Set(["crystal_chamber", "teleport_room_1", "teleport_room_2", "teleport_stair_room", "front_lobby", "bathroom", "show_room", "lab_hallway", "experiment_lab", "lab_passage", "observation_deck", "catwalks", "arena", "nest_area"]);   // every room
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
function _fpGlow(x, y, r, col, a) { ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(x, y, 1, x, y, r); g.addColorStop(0, _fpRgba(col, a)); g.addColorStop(1, _fpRgba(col, 0)); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); ctx.globalCompositeOperation = "source-over"; }
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
    c = { wainLit: RS.wain, wainDark: _fpShade(RS.wain, 0.9), skirt: _fpShade(RS.wain, 0.8), acc: RS.acc }; _fpRoomCol.set(id, c); return c;
}
function _fpFlat(pts, col) { ctx.fillStyle = col; ctx.beginPath(); for (let i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[0][0], pts[0][1]); ctx.closePath(); ctx.fill(); }   // a flat fill: no outline pass
function _fpStyleWall(it, Hd) {
    const ax = it.a[0], ay = it.a[1], bx = it.b[0], by = it.b[1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1; let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
    const P = (u, z) => _fpP(ax + dx * u, ay + dy * u, z), lit = nx > ny, body = lit ? FP_PAL.wallLit : FP_PAL.wallDark, wain = Math.min(24, Hd), capH = Math.min(8, Math.max(0, Hd - wain)), RC = _fpRoomCols(it.room), U0 = -0.02, U1 = 1.02;   // (each band runs a hair past both ends, so neighbours overlap and leave no seam: no outline pass needed)
    if (it.drop > 0) _fpFlat([P(U0, -it.drop), P(U1, -it.drop), P(U1, 0), P(U0, 0)], RC.skirt);   // a skirt down to a lower floor beside the wall
    _fpFlat([P(U0, 0), P(U1, 0), P(U1, wain), P(U0, wain)], lit ? RC.wainLit : RC.wainDark);
    if (Hd > wain) _fpFlat([P(U0, wain), P(U1, wain), P(U1, Hd - capH), P(U0, Hd - capH)], body);
    if (capH > 0) _fpFlat([P(U0, Hd - capH), P(U1, Hd - capH), P(U1, Hd), P(U0, Hd)], FP_PAL.cap);
    const h = _fpHash(Math.round(ax * 2), Math.round(ay * 2));
    if (Hd > wain + 10) {
        if (h % 9 === 0) _fpFlat([P(0.1, wain), P(0.9, wain), P(0.8, wain + 14 + h % 10), P(0.2, wain + 12)], "rgba(115,140,128,0.16)");   // a discoloration
        if (h % 13 === 1) _fpFlat([P(0.4, Hd - capH), P(0.46, Hd - capH), P(0.45, wain + 4), P(0.41, wain + 4)], "rgba(176,132,108,0.24)");     // a rust streak
        const sa = Math.floor((ax + ay) / 2), sb = Math.floor((bx + by) / 2); if (sa !== sb) { const u = (((sa > sb ? sa : sb) * 2) - (ax + ay)) / ((bx + by) - (ax + ay) || 1); if (u > 0 && u < 1) { const p = P(u, wain), q = P(u, Hd - capH); ctx.strokeStyle = "rgba(27,54,64,0.28)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } }   // a panel join every two tiles
    }
    ctx.lineCap = "round";
    if (Hd >= 26) { const p = P(0, wain), q = P(1, wain); ctx.strokeStyle = RC.acc; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }   // the neon seam
    const t0 = P(0, Hd), t1 = P(1, Hd), s0 = P(0, 0), s1 = P(1, 0); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(t0[0], t0[1]); ctx.lineTo(t1[0], t1[1]); ctx.stroke();
    ctx.strokeStyle = "rgba(22,48,58,0.85)"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke(); ctx.lineCap = "butt";
}
// a post at every corner of a styled room (the same corner treatment everywhere)
function _fpStylePillars(F) {
    const items = [];
    for (const r of F.rooms) { if (!facilityStyleRoom(r.id) || r.id === "arena" || r.id === "catwalks" || r.id === "nest_area") continue; for (const v of r.poly) items.push({ type: "fp", fp: "pillar", x: v[0], y: v[1], room: r.id, base: facilityRoomHeight(r.id, F) * FP_ELEV_PX, depth: v[0] + v[1] + 0.5 }); }
    const seen = new Set(); return items.filter(i => { const k = i.x + "," + i.y; if (seen.has(k)) return false; seen.add(k); return true; });   // (one post per corner, even where two rooms share it)
}
function _fpStylePillar(it) {
    // ONE whole column: a single toon box from the floor to a cap, both visible faces in the same pale family (a lit side and a slightly darker one), one bold outline round its silhouette, one unbroken
    // highlight down its lit edge, and a thin neon line down its front corner; nothing stacked or banded
    const H = FP_WALL_H + 8, w = 0.17, A = FP_PAL, R = _fpRoomStyle(it.room);   // (it stands a little above the wall: a column, not a stub)
    _fpSBox(it.x - w, it.y - w, it.x + w, it.y + w, 0, H, A.cap, A.wallLit, A.caseLit, 3.5);
    const c0 = _fpP(it.x + w, it.y + w, 5), c1 = _fpP(it.x + w, it.y + w, H - 9); ctx.strokeStyle = R.acc; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(c0[0], c0[1]); ctx.lineTo(c1[0], c1[1]); ctx.stroke(); ctx.lineCap = "butt";   // the neon line down the front corner
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
function _fpStyleDoor(it) {
    const acc = _fpAcc((it.rooms || [])[0]), H = FP_DOOR_H, A = FP_PAL, S = FP_STEEL_DOOR, P = (u, z) => _fpP(it.a[0] + (it.b[0] - it.a[0]) * u, it.a[1] + (it.b[1] - it.a[1]) * u, z);
    const part = it.part || "m"; it.st = it.st || { open: 0 };   // a door is three items sorted separately (the two jambs at their own ends, the rest at the middle), so a unit in the gap is never covered by a jamb that is behind it and a neighbouring wall piece never clips the frame
    // how far open: eased towards open when a unit is within 2.6 tiles, shut again beyond 3.4
    if (part === "m") { const near = _fpDoorNear(it.x, it.y), want = near < 2.6 ? 1 : near > 3.4 ? 0 : (it.st.open >= 0.5 ? 1 : 0); it.st.open = (it.st.open || 0) + (want - (it.st.open || 0)) * 0.2; if (Math.abs(want - it.st.open) < 0.01) it.st.open = want; }
    const o = it.st.open, f = _fpFrame(), q = it.door ? 1 : 0, fw = 0.06;   // fw: the frame post, as a fraction of the span
    const line = (p0, p1, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); };
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (part === "m" && q) for (const side of [0, 1]) {   // each panel slides toward its own post: its inner edge goes from the middle (closed) to the post (open)
        const edge = side ? 0.5 + (0.5 - fw) * o : 0.5 - (0.5 - fw) * o, outer = side ? 1 - fw : fw, u0 = Math.min(edge, outer), u1 = Math.max(edge, outer);
        if (u1 - u0 < 0.012) continue;
        _fpFill([P(u0, 0), P(u1, 0), P(u1, H - 8), P(u0, H - 8)], S.mid, S.mid);
        _fpFill([P(u0, H * 0.46), P(u1, H * 0.46), P(u1, H - 8), P(u0, H - 8)], S.lit, S.lit);                                  // the lit upper half
        _fpFill([P(u0, 0), P(u1, 0), P(u1, 12), P(u0, 12)], S.dark, S.dark);                                                       // the kick plate
        for (const z of [26, 50]) line(P(u0, z), P(u1, z), S.rib, 2.5);                                                            // ribs
        if (u1 - u0 > 0.1) { const wu0 = u0 + (u1 - u0) * 0.2, wu1 = u0 + (u1 - u0) * 0.8; _fpFill([P(wu0, 36), P(wu1, 36), P(wu1, 46), P(wu0, 46)], "#12323a", A.ink, 2.5); _fpFill([P(wu0 + 0.01, 38), P(wu1 - 0.01, 38), P(wu1 - 0.01, 44), P(wu0 + 0.01, 44)], _fpRgba(acc, 0.35), "rgba(0,0,0,0)"); }   // a window slit
        const lead = side ? u0 : u1;                                                                                              // the hazard-striped lead edge
        for (let i = 0; i < 8; i++) { const z0 = i * (H - 8) / 8, z1 = (i + 1) * (H - 8) / 8, du = 0.045 * (side ? 1 : -1); _fpFill([P(lead, z0), P(lead + du, z0), P(lead + du, z1), P(lead, z1)], i & 1 ? A.amber : A.ink, "rgba(0,0,0,0)"); }
        for (const z of [8, H - 14]) { const r = P((u0 + u1) / 2, z); ctx.fillStyle = S.dark; ctx.beginPath(); ctx.arc(r[0], r[1], 1.8, 0, 6.2832); ctx.fill(); }   // rivets
        _fpShine(P(u0 + 0.01, H - 12)[0], P(u0 + 0.01, H - 12)[1], P(u0 + 0.01 + (u1 - u0) * 0.35, H - 12)[0], P(u0 + 0.01 + (u1 - u0) * 0.35, H - 12)[1]);
        const t = P(u0, H - 8), t2 = P(u1, H - 8), b0 = P(u0, 0), b1 = P(u1, 0);
        ctx.strokeStyle = A.ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(t[0], t[1]); ctx.lineTo(t2[0], t2[1]); ctx.lineTo(b1[0], b1[1]); ctx.closePath(); ctx.stroke();   // the panel's bold outline
    }
    if (part === "m" && q && o < 0.02) { const m0 = P(0.5, 0), m1 = P(0.5, H - 8); line(m0, m1, A.ink, 4); }   // the seam where the panels meet
    // the frame: two thick posts, a lintel with the status lamp
    for (const u of (part === "a" ? [0] : part === "b" ? [1 - fw] : [])) { const p0 = P(u, 0), p1 = P(u + fw, 0), p2 = P(u + fw, H), p3 = P(u, H); _fpFill([p0, p1, p2, p3], A.cap, A.ink, 3.5); }
    if (part !== "m") { ctx.lineJoin = "miter"; ctx.lineCap = "butt"; return; }
    _fpFill([P(0, H - 8), P(1, H - 8), P(1, H + 4), P(0, H + 4)], A.tealLit, A.ink, 3.5);
    const lamp = P(0.5, H - 2), on = o > 0.5; ctx.fillStyle = on ? acc : A.amber; ctx.beginPath(); ctx.arc(lamp[0], lamp[1], 4, 0, 6.2832); ctx.fill(); ctx.strokeStyle = A.ink; ctx.lineWidth = 2.5; ctx.stroke();
    // the HEADER: the wall continues above the door, from its lintel to the top of the wall (the same three bands, the ink line along its top)
    { const dx = it.b[0] - it.a[0], dy = it.b[1] - it.a[1], L = Math.hypot(dx, dy) || 1; let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
      const lit = nx > ny, zb = H + 4, zt = FP_WALL_H, capH = Math.min(8, zt - zb);
      if (zt > zb) { _fpFlat([P(-0.02, zb), P(1.02, zb), P(1.02, zt - capH), P(-0.02, zt - capH)], lit ? A.wallLit : A.wallDark); _fpFlat([P(-0.02, zt - capH), P(1.02, zt - capH), P(1.02, zt), P(-0.02, zt)], A.cap);
        const t0 = P(0, zt), t1 = P(1, zt); ctx.strokeStyle = A.ink; ctx.lineWidth = 4.5; ctx.beginPath(); ctx.moveTo(t0[0], t0[1]); ctx.lineTo(t1[0], t1[1]); ctx.stroke(); } }
    ctx.lineJoin = "miter"; ctx.lineCap = "butt";
}

// ── the wall unit: the power pack, crystal powered ──
function _fpStyleFixture(it) {
    if (it.kind !== "power_pack_area") {   // a lettered wall sign: a pale board in an ink frame with bars of the room's accent and a crystal (the wording is not decided)
        const P = (u, z) => _fpP(it.a[0] + (it.b[0] - it.a[0]) * u, it.a[1] + (it.b[1] - it.a[1]) * u, z), acc = _fpAcc(it.room), f = _fpFrame();
        _fpFill([P(0, 24), P(1, 24), P(1, 64), P(0, 64)], FP_PAL.ink, FP_PAL.ink, 4); _fpFill([P(0.02, 27), P(0.98, 27), P(0.98, 61), P(0.02, 61)], FP_PAL.cap, FP_PAL.ink, 2.5);
        for (let i = 0; i < 6; i++) _fpFill([P(0.2 + i * 0.1, 36), P(0.27 + i * 0.1, 36), P(0.27 + i * 0.1, 52), P(0.2 + i * 0.1, 52)], _fpRgba(acc, 0.85 + 0.1 * Math.sin(f * 0.04 + i)), "rgba(0,0,0,0)");
        const c = P(0.08, 44); _fpCrystal(c[0], c[1] + 10, 18, 6, acc, f, 1); return;
    }
    const f = _fpFrame(), z0 = 16, z1 = 62, P = (u, z) => _fpP(it.a[0] + (it.b[0] - it.a[0]) * u, it.a[1] + (it.b[1] - it.a[1]) * u, z);
    _fpFill([P(0, z0), P(1, z0), P(1, z1), P(0, z1)], FP_PAL.tealDark, FP_PAL.ink, 3.5);
    _fpFill([P(0.03, z0 + 3), P(0.97, z0 + 3), P(0.97, z1 - 12), P(0.03, z1 - 12)], "#12323a", FP_PAL.ink, 2.5);
    const n = 4;   // the cells: tall capsules, charged from the bottom, cyan to blue, each pulsing in turn
    for (let i = 0; i < n; i++) { const u0 = 0.08 + i * 0.225, u1 = u0 + 0.17, ch = 0.55 + 0.4 * (0.5 + 0.5 * Math.sin(f * 0.03 + i * 1.7)), zt = z0 + 7 + (z1 - 12 - z0 - 10) * ch;
        _fpFill([P(u0, z0 + 7), P(u1, z0 + 7), P(u1, z1 - 15), P(u0, z1 - 15)], "rgba(9,22,28,0.9)", "rgba(120,200,210,0.6)", 1); _fpFill([P(u0 + 0.01, z0 + 8), P(u1 - 0.01, z0 + 8), P(u1 - 0.01, zt), P(u0 + 0.01, zt)], i & 1 ? FP_PAL.blue : FP_PAL.cyan, "rgba(0,0,0,0)");
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

// ── the crystal's pad machine ──
// The crystal rests in a round pad machine on the floor and is hooked up to the ceiling: a matching round machine up in the ceiling, tied to the pad by three posts behind the crystal and by energy
// lines that run down to it. Drawn as one item just before the crystal, in every styled room that has the objective.
function _fpStyleRigs(F) {
    const out = [];
    for (const r of F.rooms) { if (!facilityStyleRoom(r.id)) continue; const ob = (r.objects || []).find(o => o.type === "objective"); if (!ob) continue; const x = Math.round(ob.at[0]), y = Math.round(ob.at[1]); const base = facilityRoomHeight(r.id, F) * FP_ELEV_PX;
        out.push({ type: "fp", fp: "rig", x, y, room: r.id, base, depth: x + y - 0.3 });      // the ceiling machine, the posts and the energy lines: behind everything
        out.push({ type: "fp", fp: "rigpad", x, y, room: r.id, base, depth: x + y + 2.05 });   // the pad: after every floor tile it covers (the nearest is two tiles on), then the crystal
        _fp.crystalDepth = x + y + 2.1; }
    return out;
}
function _fpStyleRig(it) {
    const f = _fpFrame(), cx = typeof crystal !== "undefined" && crystal && typeof crystal.x === "number" ? crystal.x : it.x, cy = typeof crystal !== "undefined" && crystal && typeof crystal.y === "number" ? crystal.y : it.y, R = 1.5, zc = 230, P = _fpP;
    const line = (p, q, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }, ring = (x, y, z, r, col, w) => { const c = P(x, y, z); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(c[0], c[1], r * TILE_W * 1.4142, r * TILE_H * 1.4142, 0, 0, 6.2832); ctx.stroke(); };
    // (back to front: the posts and energy lines first, then the ceiling machine over their tops, then its struts: every beam goes UNDER the machine it joins)
    // 2. three posts from the pad up to the ceiling machine, on the side away from the camera
    for (const a of [Math.PI, Math.PI * 1.25, Math.PI * 1.5]) { const px = cx + Math.cos(a) * R * 0.92, py = cy + Math.sin(a) * R * 0.92; _fpStyleCyl(px, py, 0.1, 9, zc, FP_PAL.tealLit, FP_PAL.cap, FP_PAL.cap, 3); for (const z of [60, 120, 180]) { const c0 = P(px, py, z); ctx.fillStyle = FP_PAL.cyan; ctx.fillRect(c0[0] - 6, c0[1] - 2, 12, 4); } }
    // 3. the energy lines: from the ceiling machine down to the crystal, with a pulse running down each
    const tip = P(cx, cy, 64);
    for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4, top = P(cx + Math.cos(a) * R * 0.5, cy + Math.sin(a) * R * 0.5, zc + 14), t = ((f * 0.012) + i * 0.25) % 1;
        line(top, tip, "rgba(49,232,255,0.28)", 6); line(top, tip, FP_PAL.cyan, 2.5); const px = top[0] + (tip[0] - top[0]) * t, py = top[1] + (tip[1] - top[1]) * t; ctx.fillStyle = FP_PAL.white; ctx.beginPath(); ctx.arc(px, py, 3.5, 0, 6.2832); ctx.fill(); _fpGlow(px, py, 12, FP_PAL.cyan, 0.5); }
    // 1. the ceiling machine: two struts running up out of the frame, a round housing with a lit neon ring and a core
    _fpStyleCyl(cx, cy, R, zc, zc + 14, FP_PAL.teal, FP_PAL.tealLit, FP_PAL.caseLit, 4);
    ring(cx, cy, zc + 14, R * 0.72, FP_PAL.cyan, 3); ring(cx, cy, zc + 14, R * 0.42, FP_PAL.violet, 3); _fpDisc(cx, cy, zc + 14, R * 0.2, "#12323a", FP_PAL.ink); const cc = P(cx, cy, zc + 14); _fpGlow(cc[0], cc[1], 46, FP_PAL.cyan, 0.3);
    // the struts rise from the top of the housing, over its rings
    for (const [dx, dy] of [[-0.8, -0.8], [0.8, 0.8]]) _fpStyleCyl(cx + dx, cy + dy, 0.13, zc + 14, zc + 330, FP_PAL.teal, FP_PAL.tealLit, FP_PAL.tealLit, 3);
}
function _fpStyleRigPad(it) {
    const f = _fpFrame(), cx = typeof crystal !== "undefined" && crystal && typeof crystal.x === "number" ? crystal.x : it.x, cy = typeof crystal !== "undefined" && crystal && typeof crystal.y === "number" ? crystal.y : it.y, R = 1.5, P = _fpP;
    const line = (p, q, col, w) => { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }, ring = (x, y, z, r, col, w) => { const c = P(x, y, z); ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.ellipse(c[0], c[1], r * TILE_W * 1.4142, r * TILE_H * 1.4142, 0, 0, 6.2832); ctx.stroke(); };
    // 4. the pad: a raised round machine under the crystal, a bold outline, neon rings, an emitter, four clamps
    _fpDisc(cx + 0.12, cy + 0.12, 0, R + 0.1, "rgba(27,54,64,0.18)", null);
    _fpStyleCyl(cx, cy, R, 0, 10, FP_PAL.tealLit, FP_PAL.cap, FP_PAL.caseLit, 4);
    _fpDisc(cx, cy, 10, R * 0.84, FP_PAL.wallLit, FP_PAL.ink); ring(cx, cy, 10, R * 0.72, FP_PAL.cyan, 3.5); ring(cx, cy, 10, R * 0.5, FP_PAL.violet, 3);
    for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4 + f * 0.004, p0 = P(cx + Math.cos(a) * R * 0.5, cy + Math.sin(a) * R * 0.5, 10), p1 = P(cx + Math.cos(a) * R * 0.72, cy + Math.sin(a) * R * 0.72, 10); line(p0, p1, "rgba(22,48,58,0.55)", 2); }   // the segment seams between the rings
    _fpDisc(cx, cy, 10, R * 0.26, "#12323a", FP_PAL.ink); const pc = P(cx, cy, 10), pul = 0.7 + 0.3 * Math.sin(f * 0.06); _fpGlow(pc[0], pc[1], 50, FP_PAL.cyan, 0.35 * pul);
    for (const a of [0.7, 2.27, 3.84, 5.41]) _fpStyleCyl(cx + Math.cos(a) * R * 0.96, cy + Math.sin(a) * R * 0.96, 0.11, 10, 15, FP_PAL.teal, FP_PAL.tealLit, FP_PAL.cyan, 2.5);
    // 5. the hover field: rings rising off the pad, fading as they climb to the crystal
    for (let i = 0; i < 3; i++) { const t = ((f * 0.01) + i / 3) % 1; ring(cx, cy, 12 + t * 44, R * (0.55 - t * 0.15), _fpRgba(FP_PAL.cyan, 0.7 * (1 - t)), 2.5); }
}

// ── room lighting: a room you are not in is not lit up ──
// Lighting is PER ITEM, in the item's own depth order (not a layer over the screen), so a wall or prop in front is never darkened by a room behind it:
//   - every wall piece, door, prop, post, fixture and decor is darkened right after it is drawn, by the light level of the room that shows its face (the room on its camera-facing side);
//   - every floor tile is darkened by its own tile level.
// Levels: the room the player stands in is fully lit (the stair room counts as part of the hallway: no change of light on the stairs); every other room is dark. When a door is OPEN (a unit is near it,
// or it is a stairway) the room beyond it is lit on the GROUND only, in a pool near the door; it lights up completely only when the player steps on one of its tiles. Levels ease.
var FP_DARK = 0.82, FP_POOL = 0.7, FP_POOL_R = 3.6, FP_LIGHT_EASE = 0.12;
function _fpLightKey(id) { return id === "teleport_stair_room" ? "lab_hallway" : id; }
function _fpLightUpdate(F) {
    _fp.light = _fp.light || new Map(); _fp.pool = _fp.pool || new Map();
    const pr = facilityRoomAt(player.visualX, player.visualY, F), here = pr ? _fpLightKey(pr.id) : (_fp.lastRoom || null); if (here) _fp.lastRoom = here;
    for (const r of F.rooms) { const k = _fpLightKey(r.id), v = k === here ? 1 : 0, cur = _fp.light.has(k) ? _fp.light.get(k) : v; if (r.id === k || !_fp.light.has(k)) _fp.light.set(k, Math.abs(v - cur) < 0.01 ? v : cur + (v - cur) * FP_LIGHT_EASE); }
    const pools = [];
    if (!_fp.openings) { _fp.openings = F.openings.map(o => ({ id: o.id, x: (o.a[0] + o.b[0]) / 2, y: (o.a[1] + o.b[1]) / 2, rooms: (F.connections.find(c => c.opening === o.id) || { rooms: o.rooms || [] }).rooms.map(_fpLightKey), ramp: F.connections.some(c => c.opening === o.id && c.ramp) })); _fp.doorItems = new Map(_fp.items.filter(i => i.fp === "door").map(i => [i.id, i])); }
    for (const o of _fp.openings) {
        const di = _fp.doorItems.get(o.id), want = o.ramp ? 1 : (di && di.st && (di.st.open || 0) >= 0.5 ? 1 : 0), cur = _fp.pool.get(o.id) || 0, v = Math.abs(want - cur) < 0.01 ? want : cur + (want - cur) * FP_LIGHT_EASE; _fp.pool.set(o.id, v);
        // a doorway with no door (a stairway) always glows softly on both sides, near or far; a door throws light only when it is open and the room on one side is lit
        if (v > 0.02 && (o.ramp || o.rooms.some(k => (_fp.light.get(k) || 0) > 0.5))) pools.push({ x: o.x, y: o.y, s: v, rooms: o.rooms, r: o.ramp ? 5.2 : FP_POOL_R, k: o.ramp ? 0.55 : FP_POOL });
    }
    _fp.pools = pools;
}
// how lit a floor tile is: its room's level, or (ground only) the pool of light from an open door near it
function _fpPoolAt(x, y, k) {
    let v = 0; const ps = _fp.pools; if (ps) for (const p of ps) { if (k !== null && !p.rooms.includes(k)) continue; const d = Math.hypot(x - p.x, y - p.y); if (d < p.r) v = Math.max(v, p.s * p.k * (1 - d / p.r)); }
    return v;
}
function _fpTileLight(x, y, roomId) {
    const k = _fpLightKey(roomId), v = (_fp.light && _fp.light.get(k)) || 0; if (v > 0.98) return v;
    return Math.max(v, _fpPoolAt(x, y, k));
}
function _fpRoomLight(roomId) { return (_fp.light && _fp.light.get(_fpLightKey(roomId))) || 0; }
function _fpDarkFill(pts, lv) { const a = FP_DARK * (1 - lv); if (a < 0.02) return; ctx.fillStyle = "rgba(6,11,22," + a.toFixed(3) + ")"; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); }
function _fpDarkTile(cx, cy, lv) { const e = 1.2; _fpDarkFill([[cx, cy - TILE_H - e], [cx + TILE_W + e, cy], [cx, cy + TILE_H + e], [cx - TILE_W - e, cy]], lv); }
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
    const lv = _fpItemRoomLight(it); if (lv > 0.98 || it.fp === "rig" || it.fp === "rigpad" || it.fp === "fill") return lv;
    const k = _fpLightKey(it.lroom || it.room || (it.rooms && it.rooms[0])); return Math.max(lv, _fpPoolAt(it.x, it.y, k));   // (near a stairway or an open door, things share its light)
}
function _fpItemRoomLight(it) {
    if (it.fp === "door") return Math.max(...(it.rooms || []).map(_fpRoomLight), 0);
    if (it.fp === "wall") return _fpRoomLight(it.lroom || it.room);
    if (it.fp === "stair") return _fpRoomLight(it.room || "lab_hallway");
    if (it.fp === "pillar") { if (it.lt === undefined) { const ids = new Set(); for (const [dx, dy] of [[0.7, 0.7], [-0.7, 0.7], [0.7, -0.7]]) { const r = facilityRoomAt(it.x + dx, it.y + dy, _fp.F); if (r) ids.add(r.id); } it.lt = Array.from(ids); } return it.lt.length ? Math.max(...it.lt.map(_fpRoomLight)) : _fpRoomLight(it.room); }   // a corner post takes the light of the brightest room its visible faces look onto (the three quadrants in front of it, not the one behind)
    if (it.fp === "rig" || it.fp === "rigpad" || it.fp === "fill") return 1;   // (the fill tile darkens itself)
    return _fpRoomLight(it.room);
}
