// ─────────────────────────────────────────────────────────
//  THE CRYSTAL LABORATORY STYLE (a drawing style; PROTOTYPE: one room)
// ─────────────────────────────────────────────────────────
// A bright, clean, cartoon-inspired lab: big simple shapes, smooth matte surfaces, a controlled cool palette, a few saturated crystal accents, glowing neon seams, a little wear.
// It changes only HOW things are drawn. The map, the walls, the collision, the doors and the furniture are untouched: it restyles what is already there and invents nothing.
//
// THE RULES (the same for every room once the prototype is approved):
//   PALETTE   cool laboratory grays and muted teals for every surface; saturated colour ONLY for crystal energy (cyan, electric blue, violet) and one warning amber.
//   SHAPES    flat smooth fills, no texture; every solid is a plain box or cylinder with a lit top, a lit +x side and a darker +y side (value separates surfaces, not outlines).
//   OUTLINES  one ink colour (deep teal, never black): 2 px on a silhouette's top edge and vertical corners, 1.5 px round furniture, none between adjacent wall pieces.
//   WALLS     three bands: a darker base (wainscot), a body, a light cap; a NEON SEAM where the base meets the body; panel joins every two tiles; a post at every room corner.
//   FLOORS    pale two-tone tiles with fine seams; a NEON SEAM along every fourth tile line.
//   LIGHT     emissive only on energy sources and things you use (the crystal, power cells, screens, seams); everything else is flat, so floors, steps and obstacles stay easy to read.
//   WEAR      rare, muted, desaturated stains and one rust streak: old, not dirty.
// Which rooms use it is FP_STYLE_ROOMS: the prototype is the Crystal Chamber alone.

const FP_PAL = {
    ink: "#1b3640", cap: "#e8f3f6", wallLit: "#b5ccd4", wallDark: "#93b0ba", wallBase: "#70939f", floorA: "#cadde1", floorB: "#bcd2d8", seam: "#8fb6bf",
    teal: "#4f9aa0", tealLit: "#6cb3bb", tealDark: "#2f6a73", case: "#a9c4cc", caseLit: "#dbeaee",
    cyan: "#31e8ff", blue: "#3a7bff", violet: "#9a5cff", amber: "#f2b13a", white: "#eaffff", leaf: "#4fa58a",
};
const FP_STYLE_ROOMS = new Set(["crystal_chamber"]);
function facilityStyleRoom(id) { return !!id && FP_STYLE_ROOMS.has(id); }

// floor decals keep their kind and place; their colours are brought into the palette
function _fpStyleCol(kind, col) {
    const M = { "#ffb347": FP_PAL.cyan, "#ff6a4a": FP_PAL.violet, "#ffd34d": FP_PAL.violet, "#ffe9a0": FP_PAL.white, "#6adfff": FP_PAL.cyan, "#2a1a10": "#7a8f89", "#0c0c10": "#7a8f89", "#1a1008": "#7a8f89", "#10121a": "#7a8f89" };
    if (col === "#ffffff") return kind === "cables" ? FP_PAL.cyan : FP_PAL.amber;
    return M[col] || col;
}
const FP_STYLE_FLOOR = {
    base: FP_PAL.floorA, alt: FP_PAL.floorB, a: 1,
    mark: (h, o, x, y) => {
        o.push({ t: "L", c: "rgba(111,150,160,0.55)", w: 1, p: [-0.5, -0.5, 0.5, -0.5] }, { t: "L", c: "rgba(111,150,160,0.55)", w: 1, p: [-0.5, -0.5, -0.5, 0.5] });
        if ((x & 3) === 0) o.push({ t: "L", c: "rgba(49,232,255,0.22)", w: 5, p: [-0.5, -0.5, -0.5, 0.5] }, { t: "L", c: "rgba(49,232,255,0.95)", w: 2, p: [-0.5, -0.5, -0.5, 0.5] });   // a neon seam every fourth tile line
        if ((y & 3) === 0) o.push({ t: "L", c: "rgba(49,232,255,0.22)", w: 5, p: [-0.5, -0.5, 0.5, -0.5] }, { t: "L", c: "rgba(49,232,255,0.95)", w: 2, p: [-0.5, -0.5, 0.5, -0.5] });
        if (h % 19 === 0) o.push({ t: "C", c: "rgba(105,135,125,0.18)", u: ((h >>> 3) % 7 - 3) / 10, v: ((h >>> 6) % 7 - 3) / 10, r: 0.22 });   // a faint discoloration
    },
};

// ── shapes ──
function _fpFill(pts, col, edge, lw) { _fpQuad(pts, col, edge || col, lw || 1); }   // a smooth fill (the stroke is the fill colour, so neighbours leave no hairline)
function _fpSBox(x0, y0, x1, y1, z0, z1, top, sideY, sideX, lw) {   // a box: lit top, lit +x side, darker +y side, one ink outline
    const P = _fpP, t = [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], b = [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)], ink = FP_PAL.ink;
    _fpQuad([t[3], t[2], b[2], b[3]], sideY, ink, lw || 1.5); _fpQuad([t[2], t[1], b[1], b[2]], sideX, ink, lw || 1.5); _fpQuad(t, top, ink, lw || 1.5);
    return { t, b };
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
function _fpStyleWall(it, Hd) {
    const ax = it.a[0], ay = it.a[1], bx = it.b[0], by = it.b[1], dx = bx - ax, dy = by - ay, L = Math.hypot(dx, dy) || 1; let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
    const P = (u, z) => _fpP(ax + dx * u, ay + dy * u, z), lit = nx > ny, body = lit ? FP_PAL.wallLit : FP_PAL.wallDark, wain = Math.min(24, Hd), capH = Math.min(8, Math.max(0, Hd - wain));
    _fpFill([P(0, 0), P(1, 0), P(1, wain), P(0, wain)], lit ? FP_PAL.wallBase : _fpShade(FP_PAL.wallBase, 0.9));
    if (Hd > wain) _fpFill([P(0, wain), P(1, wain), P(1, Hd - capH), P(0, Hd - capH)], body);
    if (capH > 0) _fpFill([P(0, Hd - capH), P(1, Hd - capH), P(1, Hd), P(0, Hd)], FP_PAL.cap);
    const h = _fpHash(Math.round(ax * 2), Math.round(ay * 2));
    if (Hd > wain + 10) {
        if (h % 9 === 0) _fpFill([P(0.1, wain), P(0.9, wain), P(0.8, wain + 14 + h % 10), P(0.2, wain + 12)], "rgba(115,140,128,0.16)", "rgba(115,140,128,0)");   // a discoloration
        if (h % 13 === 1) _fpFill([P(0.4, Hd - capH), P(0.46, Hd - capH), P(0.45, wain + 4), P(0.41, wain + 4)], "rgba(176,132,108,0.24)", "rgba(176,132,108,0)");     // a rust streak
        const sa = Math.floor((ax + ay) / 2), sb = Math.floor((bx + by) / 2); if (sa !== sb) { const u = (((sa > sb ? sa : sb) * 2) - (ax + ay)) / ((bx + by) - (ax + ay) || 1); if (u > 0 && u < 1) { const p = P(u, wain), q = P(u, Hd - capH); ctx.strokeStyle = "rgba(27,54,64,0.28)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } }   // a panel join every two tiles
    }
    if (Hd >= 26) { const p = P(0, wain), q = P(1, wain); ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = "rgba(49,232,255,0.16)"; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.globalCompositeOperation = "source-over";
        ctx.strokeStyle = FP_PAL.cyan; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }   // the neon seam
    const t0 = P(0, Hd), t1 = P(1, Hd), s0 = P(0, 0), s1 = P(1, 0); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(t0[0], t0[1]); ctx.lineTo(t1[0], t1[1]); ctx.stroke();
    ctx.globalAlpha = 0.6; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke(); ctx.globalAlpha = 1;
}
// a post at every corner of a styled room (the same corner treatment everywhere)
function _fpStylePillars(F) {
    const items = [];
    for (const r of F.rooms) { if (!facilityStyleRoom(r.id)) continue; for (const v of r.poly) items.push({ type: "fp", fp: "pillar", x: v[0], y: v[1], room: r.id, base: facilityRoomHeight(r.id, F) * FP_ELEV_PX, depth: v[0] + v[1] + 0.15 }); }
    return items;
}
function _fpStylePillar(it) {
    const H = _fpWallCutH([it.x, it.y], [it.x, it.y], FP_WALL_H + 4), w = 0.13;
    _fpSBox(it.x - w, it.y - w, it.x + w, it.y + w, 0, H, FP_PAL.cap, _fpShade(FP_PAL.wallDark, 0.92), FP_PAL.caseLit, 2);
    if (H > 30) { const p = _fpP(it.x, it.y + w, 24), q = _fpP(it.x + w, it.y, 24); ctx.strokeStyle = FP_PAL.cyan; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p[0] - 1, p[1]); ctx.lineTo(q[0] + 1, q[1]); ctx.stroke(); }
}

// ── doors ──
function _fpStyleDoor(it) {
    const H = FP_WALL_H, a0 = _fpP(it.a[0], it.a[1], 0), b0 = _fpP(it.b[0], it.b[1], 0), a1 = _fpP(it.a[0], it.a[1], H), b1 = _fpP(it.b[0], it.b[1], H), near = Math.hypot(it.x - player.visualX, it.y - player.visualY) < 3.4;
    for (const [p0, p1] of [[a0, a1], [b0, b1]]) { ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); ctx.strokeStyle = FP_PAL.cap; ctx.lineWidth = 4.5; ctx.stroke(); }
    ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke(); ctx.strokeStyle = FP_PAL.cyan; ctx.lineWidth = 3.5; ctx.stroke();
    _fpGlow((a1[0] + b1[0]) / 2, (a1[1] + b1[1]) / 2, 40, FP_PAL.cyan, 0.2);
    if (it.door) { const k = near ? 0.18 : 0.5, lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; _fpQuad([lerp(a1, b1, 1 - k), b1, b0, lerp(a0, b0, 1 - k)], "rgba(49,232,255,0.2)", FP_PAL.cyan, 1.5); }
}

// ── the wall unit: the power pack, crystal powered ──
function _fpStyleFixture(it) {
    const f = _fpFrame(), z0 = 16, z1 = 62, P = (u, z) => _fpP(it.a[0] + (it.b[0] - it.a[0]) * u, it.a[1] + (it.b[1] - it.a[1]) * u, z);
    _fpFill([P(0, z0), P(1, z0), P(1, z1), P(0, z1)], FP_PAL.tealDark, FP_PAL.ink, 2.5);
    _fpFill([P(0.03, z0 + 3), P(0.97, z0 + 3), P(0.97, z1 - 12), P(0.03, z1 - 12)], "#12323a", FP_PAL.ink, 1.5);
    const n = 4;   // the cells: tall capsules, charged from the bottom, cyan to blue, each pulsing in turn
    for (let i = 0; i < n; i++) { const u0 = 0.08 + i * 0.225, u1 = u0 + 0.17, ch = 0.55 + 0.4 * (0.5 + 0.5 * Math.sin(f * 0.03 + i * 1.7)), zt = z0 + 7 + (z1 - 12 - z0 - 10) * ch;
        _fpFill([P(u0, z0 + 7), P(u1, z0 + 7), P(u1, z1 - 15), P(u0, z1 - 15)], "rgba(9,22,28,0.9)", "rgba(120,200,210,0.6)", 1); _fpFill([P(u0 + 0.01, z0 + 8), P(u1 - 0.01, z0 + 8), P(u1 - 0.01, zt), P(u0 + 0.01, zt)], i & 1 ? FP_PAL.blue : FP_PAL.cyan, "rgba(0,0,0,0)");
        const c = P((u0 + u1) / 2, zt); _fpGlow(c[0], c[1], 22, i & 1 ? FP_PAL.blue : FP_PAL.cyan, 0.3); }
    const c = P(0.5, z1 - 5); _fpCrystal(c[0], c[1] + 6, 13, 6, FP_PAL.violet, f, 3);   // a crystal shard on the header: this unit is crystal powered
    const p = P(0, z0 + 2), q = P(1, z0 + 2); ctx.strokeStyle = FP_PAL.cyan; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
}

// ── wall decor, in the style (only the kinds the prototype room has; the rest still draw as before) ──
const FP_STYLE_WALL = {
    pipe: (it, f) => { const z = it.z || 60; _fpWQuad(it, 0, 1, z, z + 6, FP_PAL.tealLit, FP_PAL.ink, 1.5); _fpWLine(it, 0.01, z + 5, 0.99, z + 5, "rgba(255,255,255,0.55)", 1.5); for (const u of [0, 1]) _fpWQuad(it, Math.max(0, u - 0.012), Math.min(1, u + 0.012), z - 1, z + 7, FP_PAL.tealDark, FP_PAL.ink, 1); },
    panel: (it, f) => { const z0 = it.z || 22; _fpWQuad(it, 0.15, 0.85, z0, z0 + 30, FP_PAL.case, FP_PAL.ink, 1.5); _fpWQuad(it, 0.22, 0.78, z0 + 5, z0 + 17, "#12323a", null); _fpWLine(it, 0.28, z0 + 11, 0.72, z0 + 11, FP_PAL.cyan, 2); const l = _fpWP(it, 0.5, z0 + 24); ctx.fillStyle = Math.floor(f / 30 + it.seed) % 4 === 0 ? FP_PAL.amber : FP_PAL.cyan; ctx.beginPath(); ctx.arc(l[0], l[1], 3, 0, 6.2832); ctx.fill(); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 1; ctx.stroke(); },
    vent: (it, f) => { const z0 = it.z || 40; _fpWQuad(it, 0.1, 0.9, z0, z0 + 16, FP_PAL.case, FP_PAL.ink, 1.5); for (let k = 0; k < 3; k++) _fpWQuad(it, 0.18, 0.82, z0 + 3 + k * 4, z0 + 5 + k * 4, FP_PAL.tealDark, null); },
    screen: (it, f) => { const z0 = it.z || 34; _fpWQuad(it, 0.08, 0.92, z0, z0 + 28, FP_PAL.tealDark, FP_PAL.ink, 2); _fpWQuad(it, 0.14, 0.86, z0 + 4, z0 + 24, "#0d2a33", null); for (let k = 0; k < 6; k++) { const hh = 3 + 12 * (0.5 + 0.5 * Math.sin(f * 0.04 + k * 1.3 + it.seed)); _fpWQuad(it, 0.2 + k * 0.1, 0.27 + k * 0.1, z0 + 5, z0 + 5 + hh, k & 1 ? FP_PAL.blue : FP_PAL.cyan, null); } },
    wall_light: (it, f) => { const z = it.z || 62, fl = it.h ? (0.6 + 0.4 * Math.sin(f * 0.1 + it.seed) * (Math.sin(f * 0.017 + it.seed) > 0.1 ? 1 : 0.3)) : 1; _fpWQuad(it, 0.05, 0.95, z, z + 5, FP_PAL.tealDark, FP_PAL.ink, 1.5); _fpWQuad(it, 0.09, 0.91, z + 1, z + 4, _fpRgba(FP_PAL.white, 0.6 + 0.4 * Math.max(0, fl)), null); ctx.globalCompositeOperation = "lighter"; _fpWQuad(it, 0, 1, z - 20, z + 4, _fpRgba(FP_PAL.cyan, 0.07 * Math.max(0, fl)), null); ctx.globalCompositeOperation = "source-over"; },
    hazard_sign: (it, f) => { const c = _fpWP(it, 0.5, it.z || 44); ctx.fillStyle = FP_PAL.amber; ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c[0], c[1] - 11); ctx.lineTo(c[0] + 11, c[1]); ctx.lineTo(c[0], c[1] + 11); ctx.lineTo(c[0] - 11, c[1]); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.fillStyle = FP_PAL.ink; ctx.fillRect(c[0] - 1.3, c[1] - 6, 2.6, 7); ctx.fillRect(c[0] - 1.3, c[1] + 3, 2.6, 2.6); },
};

// ── furniture, in the style: plain boxes and cylinders from the palette ──
function _fpStyleProp(it) {
    const k = it.kind, f = _fpFrame(), seed = it.seed || 0, x = it.x, y = it.y;
    if (k === "generator") {   // crystal powered: a glowing core in a smooth case, a shard on top
        _fpSBox(x - 0.5, y - 0.5, x + 0.5, y + 0.5, 0, 46, FP_PAL.caseLit, FP_PAL.teal, FP_PAL.tealLit, 2);
        if (it.sy) { _fpFaceY(it, 0.14, 0.86, 8, 38, "#12323a", FP_PAL.ink); const pul = 0.6 + 0.4 * Math.sin(f * 0.05 + seed); _fpFaceY(it, 0.3, 0.7, 12, 34, _fpRgba(FP_PAL.cyan, 0.35 + 0.35 * pul), null); _fpFaceY(it, 0.44, 0.56, 12, 34, _fpRgba(FP_PAL.white, 0.5 + 0.4 * pul), null); const g = _fpP(x, y + 0.5, 23); _fpGlow(g[0], g[1], 30, FP_PAL.cyan, 0.25 * pul); }
        if (it.sx) _fpFaceX(it, 0.1, 0.9, 6, 12, FP_PAL.tealDark, null);
        if (it.top) { const c = _fpP(x, y, 46); _fpCrystal(c[0], c[1], 22, 8, FP_PAL.violet, f, seed); }
    } else if (k === "crate" || k === "crate_stack") {   // storage cases: pale, smooth, a cyan latch
        const h = k === "crate" ? 34 : 64; _fpSBox(x - 0.5, y - 0.5, x + 0.5, y + 0.5, 0, h, FP_PAL.caseLit, FP_PAL.case, _fpShade(FP_PAL.caseLit, 0.96), 2);
        if (it.sy) { _fpFaceY(it, 0.0, 1.0, h * 0.5 - 1, h * 0.5 + 1, "rgba(27,54,64,0.45)", null); _fpFaceY(it, 0.4, 0.6, h * 0.5 - 6, h * 0.5 + 6, FP_PAL.cyan, FP_PAL.ink); }
    } else if (k === "barrel") {   // a smooth drum, a violet band
        const c0 = _fpP(x, y, 0), c1 = _fpP(x, y, 38), rx = TILE_W * 0.45, ry = TILE_H * 0.45;
        ctx.fillStyle = FP_PAL.teal; ctx.beginPath(); ctx.ellipse(c0[0], c0[1], rx, ry, 0, 0, 3.1416); ctx.lineTo(c1[0] - rx, c1[1]); ctx.ellipse(c1[0], c1[1], rx, ry, 0, 3.1416, 0, true); ctx.closePath(); ctx.fill(); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 1.5; ctx.stroke();
        const b0 = _fpP(x, y, 12), b1 = _fpP(x, y, 22); ctx.fillStyle = FP_PAL.violet; ctx.beginPath(); ctx.ellipse(b0[0], b0[1], rx, ry, 0, 0, 3.1416); ctx.lineTo(b1[0] - rx, b1[1]); ctx.ellipse(b1[0], b1[1], rx, ry, 0, 3.1416, 0, true); ctx.closePath(); ctx.fill();
        ctx.fillStyle = FP_PAL.tealLit; ctx.beginPath(); ctx.ellipse(c1[0], c1[1], rx, ry, 0, 0, 6.2832); ctx.fill(); ctx.stroke();
    } else if (k === "console") {   // a plain console: a dark glass top lit from within
        _fpSBox(x - 0.5, y - 0.5, x + 0.5, y + 0.5, 0, 28, FP_PAL.caseLit, FP_PAL.teal, FP_PAL.tealLit, 2);
        const t = _fpP(x, y, 29), pul = 0.7 + 0.3 * Math.sin(f * 0.05 + seed); ctx.fillStyle = "#0d2a33"; ctx.fillRect(t[0] - 13, t[1] - 17, 26, 13); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 1.5; ctx.strokeRect(t[0] - 13, t[1] - 17, 26, 13);
        for (let i = 0; i < 4; i++) { ctx.fillStyle = _fpRgba(i & 1 ? FP_PAL.blue : FP_PAL.cyan, 0.9); ctx.fillRect(t[0] - 10, t[1] - 15 + i * 3, 5 + ((f / 7 + i * 4 + seed) % 12), 1.5); }
        for (let i = 0; i < 3; i++) { ctx.fillStyle = i === 1 ? FP_PAL.violet : FP_PAL.cyan; ctx.beginPath(); ctx.arc(t[0] - 7 + i * 7, t[1] + 1, 1.8, 0, 6.2832); ctx.fill(); }
        _fpGlow(t[0], t[1] - 10, 26, FP_PAL.cyan, 0.16 * pul);
    } else if (k === "plant") {   // a clean pot, smooth leaves
        _fpSBox(x - 0.28, y - 0.28, x + 0.28, y + 0.28, 0, 16, FP_PAL.tealLit, FP_PAL.teal, FP_PAL.tealLit, 1.5); const b = _fpP(x, y, 16);
        for (let i = 0; i < 5; i++) { const a = i * 1.26 + seed, dx = Math.cos(a) * 10, dy = -14 - (i % 3) * 7; ctx.fillStyle = i & 1 ? FP_PAL.leaf : "#6cbf9f"; ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(b[0] + dx, b[1] + dy, 5, 9, a * 0.3, 0, 6.2832); ctx.fill(); ctx.stroke(); }
    } else return false;
    return true;
}
