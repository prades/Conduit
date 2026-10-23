// ─────────────────────────────────────────────────────────
//  THE FACILITY'S DRESSING: floors, light, wall decor and furniture (drawing only)
// ─────────────────────────────────────────────────────────
// The data is `floors` and `decor` in js/facilitymap.js (and the solid pieces in `props`); js/facility.js compiles and validates it; js/facilityplay.js calls this file.
//   FLOORS  are painted by the floor tile itself (facilityDrawFloorOn, called from the tile's own draw), so a unit standing on a tile is always drawn over its decals. Everything on the
//           floor (a style for the room, rugs, rings, cables, stains, light) is cut into small per-tile ops once, when play starts.
//   WALL DECOR  (posters, pipes, lights, signs, screens) are items in the draw list, drawn flat on the visible (+y / +x facing) side of a wall, just after the wall pieces under them.
//   FURNITURE   (couches, plants, vending machines, crates, barriers, consoles...) are the solid `props`, drawn here by kind (_fpDecorProp).
// Nothing here is saved, and nothing here changes movement: the solid pieces are collision because they are `props`; the rest is paint.

// ── small helpers ──
function _fpRgba(hex, a) { const n = parseInt(hex.slice(1), 16); return "rgba(" + (n >>> 16) + "," + ((n >>> 8) & 255) + "," + (n & 255) + "," + a + ")"; }
function _fpShade(hex, k) { const n = parseInt(hex.slice(1), 16), c = v => Math.max(0, Math.min(255, Math.round(v * k))); return "rgb(" + c(n >>> 16) + "," + c((n >>> 8) & 255) + "," + c(n & 255) + ")"; }
// a box from world (x0,y0) to (x1,y1), z0..z1 px up: the faces the camera sees (the +y face, the +x face, the top)
function _fpBox(x0, y0, x1, y1, z0, z1, top, sideY, sideX, rim) {
    const P = _fpP, t = [P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], b = [P(x0, y0, z0), P(x1, y0, z0), P(x1, y1, z0), P(x0, y1, z0)];
    _fpQuad([t[3], t[2], b[2], b[3]], sideY, "rgba(5,7,15,0.5)", 1);
    _fpQuad([t[2], t[1], b[1], b[2]], sideX, "rgba(5,7,15,0.5)", 1);
    _fpQuad(t, top, rim || "rgba(255,255,255,0.2)", 1);
    return { t, b };
}
function _fpDisc(x, y, z, r, fill, stroke) {   // a flat circle of radius r tiles in the floor plane
    const c = _fpP(x, y, z); ctx.beginPath(); ctx.ellipse(c[0], c[1], r * TILE_W * 1.4142, r * TILE_H * 1.4142, 0, 0, 6.2832);
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke(); }
}
function _fpFrame() { return typeof frame !== "undefined" ? frame : 0; }

// ═════════════ FLOORS ═════════════
// A style gives each tile its base and its little marks. (u, v) are inside the tile, -0.5..0.5.
const FP_FLOOR_STYLES = {
    carpet:   { base: "#4a2a38", a: 0.52, mark: (h, o) => { if (h % 5 === 0) o.push({ t: "C", c: "rgba(20,8,12,0.45)", u: ((h >>> 3) % 9 - 4) / 10, v: ((h >>> 6) % 9 - 4) / 10, r: 0.1 + (h % 3) * 0.04 }); if (h % 7 === 0) o.push({ t: "L", c: "rgba(255,190,120,0.10)", w: 1, p: [-0.3, -0.2, 0.3, -0.2] }); } },
    plate:    { base: "#2a3a4c", a: 0.62, mark: (h, o) => { o.push({ t: "L", c: "rgba(160,200,235,0.16)", w: 1, p: [-0.5, 0, 0.5, 0] }, { t: "L", c: "rgba(160,200,235,0.16)", w: 1, p: [0, -0.5, 0, 0.5] }); for (const [u, v] of [[-0.4, -0.4], [0.4, -0.4], [0.4, 0.4], [-0.4, 0.4]]) o.push({ t: "C", c: "rgba(190,215,240,0.35)", u, v, r: 0.04 }); if (h % 9 === 0) o.push({ t: "L", c: "rgba(255,255,255,0.12)", w: 1, p: [-0.3, 0.3, 0.1, -0.1] }); } },
    tile:     { base: "#a6d0d4", a: 0.34, alt: "#3f7e88", mark: (h, o) => { o.push({ t: "L", c: "rgba(20,50,60,0.45)", w: 1, p: [-0.5, -0.5, 0.5, -0.5] }, { t: "L", c: "rgba(20,50,60,0.45)", w: 1, p: [-0.5, -0.5, -0.5, 0.5] }); if (h % 13 === 0) o.push({ t: "L", c: "rgba(10,25,30,0.5)", w: 1, p: [-0.4, -0.1, 0.1, 0.3] }); } },
    labtile:  { base: "#c9e0e6", a: 0.3, alt: "#7fa5b0", mark: (h, o) => { o.push({ t: "L", c: "rgba(40,70,85,0.4)", w: 1, p: [-0.5, -0.5, 0.5, -0.5] }, { t: "L", c: "rgba(40,70,85,0.4)", w: 1, p: [-0.5, -0.5, -0.5, 0.5] }); } },
    concrete: { base: "#4d5666", a: 0.42, mark: (h, o) => { if (h % 3 === 0) o.push({ t: "C", c: "rgba(15,18,26,0.32)", u: ((h >>> 2) % 9 - 4) / 10, v: ((h >>> 5) % 9 - 4) / 10, r: 0.06 + (h % 4) * 0.02 }); if (h % 11 === 0) o.push({ t: "L", c: "rgba(10,12,18,0.5)", w: 1, p: [-0.4, -0.3, -0.1, 0.0], }, { t: "L", c: "rgba(10,12,18,0.5)", w: 1, p: [-0.1, 0.0, 0.2, 0.35] }); } },
    grate:    { base: "#0c1219", a: 0.7, mark: (h, o) => { for (const v of [-0.33, 0, 0.33]) o.push({ t: "L", c: "rgba(120,150,180,0.38)", w: 1, p: [-0.5, v, 0.5, v] }); o.push({ t: "L", c: "rgba(255,255,255,0.08)", w: 1, p: [-0.5, -0.5, -0.5, 0.5] }); } },
    polished: { base: "#1e2a4c", a: 0.6, mark: (h, o) => { o.push({ t: "L", c: "rgba(190,215,255,0.16)", w: 2, p: [-0.35, 0.2, 0.05, -0.2] }); if (h % 4 === 0) o.push({ t: "L", c: "rgba(255,225,150,0.18)", w: 1, p: [0.1, 0.4, 0.4, 0.1] }); } },
    wood:     { base: "#6d4a30", a: 0.62, mark: (h, o) => { for (const v of [-0.3, 0, 0.3]) o.push({ t: "L", c: "rgba(30,16,8,0.5)", w: 1, p: [-0.5, v, 0.5, v] }); o.push({ t: "L", c: "rgba(30,16,8,0.55)", w: 1, p: [((h % 7) - 3) / 7, -0.3, ((h % 7) - 3) / 7, 0] }); } },
    sand:     { base: "#84714c", a: 0.4, mark: (h, o) => { for (let k = 0; k < 2; k++) o.push({ t: "C", c: "rgba(255,235,190,0.16)", u: (((h >>> (k * 3)) % 9) - 4) / 10, v: (((h >>> (k * 3 + 2)) % 9) - 4) / 10, r: 0.035 }); if (h % 8 === 0) o.push({ t: "L", c: "rgba(40,28,14,0.35)", w: 1, p: [-0.35, 0.1, 0.25, 0.2] }); if (h % 17 === 0) o.push({ t: "C", c: "rgba(60,45,28,0.5)", u: 0.1, v: -0.1, r: 0.11 }); } },
};
function _fpCellOps(map, x, y) { const k = x + "," + y; let o = map.get(k); if (!o) { o = []; map.set(k, o); } return o; }
// a segment given in world tiles goes into every tile it touches, in that tile's own (u, v)
function _fpSeg(map, x0, y0, x1, y1, op, F) {
    const n = Math.max(1, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.4)), seen = new Set();
    for (let i = 0; i < n; i++) {
        const ax = x0 + (x1 - x0) * i / n, ay = y0 + (y1 - y0) * i / n, bx = x0 + (x1 - x0) * (i + 1) / n, by = y0 + (y1 - y0) * (i + 1) / n;
        for (const [px, py] of [[ax, ay], [bx, by], [(ax + bx) / 2, (ay + by) / 2]]) {
            const cx = Math.round(px), cy = Math.round(py), key = cx + "," + cy + "#" + i; if (seen.has(key) || !_fp.cells.has(cx + "," + cy)) continue; seen.add(key);
            _fpCellOps(map, cx, cy).push(Object.assign({}, op, { t: "L", p: [ax - cx, ay - cy, bx - cx, by - cy] }));
        }
    }
}
function _fpFloorBuild(F) {
    const map = new Map(), solid = new Set();
    for (const s of F.solids) { const box = s.bb; for (let x = Math.floor(box[0]); x <= Math.ceil(box[2]); x++) for (let y = Math.floor(box[1]); y <= Math.ceil(box[3]); y++) if (s.shape === "circle" ? Math.hypot(x - s.at[0], y - s.at[1]) < s.r : facilityPointInPoly(x, y, s.poly)) solid.add(x + "," + y); }
    // 1. the room's own floor
    const style = new Map(); for (const f of (F.floors || [])) style.set(f.room, f);
    const under = new Map();   // the floor under a solid cell: a small piece of furniture stands on it, and a bare black tile would show
    const cellsAll = new Map(_fp.cells); for (const k of solid) { const [x, y] = k.split(",").map(Number); if (facilityRoomAt(x, y, F)) cellsAll.set(k, [x, y]); }
    for (const [k, c] of cellsAll) {
        const room = facilityRoomAt(c[0], c[1], F), f = room && style.get(room.id), S = f && FP_FLOOR_STYLES[f.style]; if (!S) continue;
        const h = _fpHash(c[0], c[1]), o = _fpCellOps(solid.has(k) ? under : map, c[0], c[1]), alt = S.alt && ((c[0] + c[1]) & 1);
        o.push({ t: "D", c: _fpRgba(alt ? S.alt : (f.colour || S.base), (S.a || 0.5) * (0.82 + (h % 7) * 0.05)) });
        S.mark(h, o);
    }
    // 2. what lies on it
    const rect = (r, fn) => { for (let x = Math.ceil(r[0] - 0.5); x <= r[2] - 0.5; x++) for (let y = Math.ceil(r[1] - 0.5); y <= r[3] - 0.5; y++) if (_fp.cells.has(x + "," + y)) fn(x, y, _fpCellOps(map, x, y), r); };
    for (const d of (F.decor || [])) {
        const col = d.colour || "#ffffff", k = d.kind; if (FAC_WALL_DECOR.has(k)) continue;   // (wall decor is drawn as items; "plate" is both a wall patch and a floor style)
        if (k === "rug") {   // a rectangle with a border two strokes wide
            rect(d.rect, (x, y, o, r) => { o.push({ t: "D", c: _fpRgba(col, 0.6), k: 0.0 });
                if (x - 0.5 < r[0] + 0.01) o.push({ t: "L", c: _fpRgba(d.border || "#ffd34d", 0.8), w: 2, p: [-0.42, -0.42, -0.42, 0.42] }); if (y - 0.5 < r[1] + 0.01) o.push({ t: "L", c: _fpRgba(d.border || "#ffd34d", 0.8), w: 2, p: [-0.42, -0.42, 0.42, -0.42] });
                if (x + 0.5 > r[2] - 0.01) o.push({ t: "L", c: _fpRgba(d.border || "#ffd34d", 0.8), w: 2, p: [0.42, -0.42, 0.42, 0.42] }); if (y + 0.5 > r[3] - 0.01) o.push({ t: "L", c: _fpRgba(d.border || "#ffd34d", 0.8), w: 2, p: [-0.42, 0.42, 0.42, 0.42] }); });
        } else if (k === "hazard") {   // yellow and black bands across a threshold
            rect(d.rect, (x, y, o) => { for (let i = 0; i < 4; i++) { const u0 = -0.5 + i * 0.25; o.push({ t: "P", c: i & 1 ? "rgba(20,20,24,0.78)" : _fpRgba(col === "#ffffff" ? "#ffd21a" : col, 0.8), p: [u0, -0.5, u0 + 0.25, -0.5, u0 + 0.25, 0.5, u0, 0.5] }); } });
        } else if (k === "plate" || k === "grate" || k === "panel_floor") {
            rect(d.rect, (x, y, o) => { const S = FP_FLOOR_STYLES[k === "grate" ? "grate" : "plate"], h = _fpHash(x, y); o.push({ t: "D", c: _fpRgba(S.base, 0.85) }); S.mark(h, o); });
        } else if (k === "tint") {   // a plain wash of colour over a rectangle: a puddle of light, a painted zone
            rect(d.rect, (x, y, o) => o.push({ t: "D", c: _fpRgba(col, d.a || 0.25) }));
        } else if (k === "lane") {   // a painted line (dashed if asked)
            const a = d.a, b = d.b, len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = d.dashed ? Math.floor(len / 1.0) : 1;
            for (let i = 0; i < n; i++) { const t0 = d.dashed ? i / n : 0, t1 = d.dashed ? (i + 0.55) / n : 1; _fpSeg(map, a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0, a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1, { c: _fpRgba(col === "#ffffff" ? "#ffd21a" : col, 0.75), w: d.w || 3 }, F); }
        } else if (k === "cables") {   // cables on the floor: a dark core and a bright thread
            for (let i = 0; i + 1 < d.path.length; i++) { const a = d.path[i], b = d.path[i + 1]; _fpSeg(map, a[0], a[1], b[0], b[1], { c: "rgba(8,10,14,0.9)", w: 4 }, F); _fpSeg(map, a[0], a[1], b[0], b[1], { c: _fpRgba(col === "#ffffff" ? "#ffb347" : col, 0.55), w: 1 }, F); }
        } else if (k === "ring") {   // a painted ring (a pad, a circle of light): short segments round it
            const R = d.radius, steps = Math.max(24, Math.round(R * 14));
            for (let i = 0; i < steps; i++) { if (d.dashed && (i & 1)) continue; const a0 = i / steps * 6.2832, a1 = (i + 1) / steps * 6.2832; _fpSeg(map, d.at[0] + Math.cos(a0) * R, d.at[1] + Math.sin(a0) * R, d.at[0] + Math.cos(a1) * R, d.at[1] + Math.sin(a1) * R, { c: _fpRgba(col, d.a || 0.7), w: d.w || 2, glow: !!d.glow }, F); }
        } else if (k === "arrows") {   // chevrons along a line, pointing from a to b
            const a = d.a, b = d.b, len = Math.hypot(b[0] - a[0], b[1] - a[1]), ux = (b[0] - a[0]) / len, uy = (b[1] - a[1]) / len, n = Math.max(1, Math.floor(len / 1.6));
            for (let i = 0; i < n; i++) { const cx = a[0] + ux * (i + 0.5) * len / n, cy = a[1] + uy * (i + 0.5) * len / n, wx = -uy * 0.38, wy = ux * 0.38, tx = ux * 0.3, ty = uy * 0.3, c = { c: _fpRgba(col === "#ffffff" ? "#ffd21a" : col, 0.55), w: 2 };
                _fpSeg(map, cx - tx + wx, cy - ty + wy, cx + tx, cy + ty, c, F); _fpSeg(map, cx - tx - wx, cy - ty - wy, cx + tx, cy + ty, c, F); }
        } else if (k === "stain" || k === "puddle" || k === "scorch") {   // an irregular mark: a few overlapping blots
            const R = d.radius, seed = _fpHash(Math.round(d.at[0] * 7), Math.round(d.at[1] * 7)), n = 5 + (seed % 4);
            for (let i = 0; i < n; i++) { const a = ((seed >>> i) % 628) / 100, rr = ((seed >>> (i + 3)) % 100) / 100 * R * 0.7, bx = d.at[0] + Math.cos(a) * rr, by = d.at[1] + Math.sin(a) * rr, br = R * (0.32 + ((seed >>> (i + 5)) % 40) / 100), cx = Math.round(bx), cy = Math.round(by);
                for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { const tx = cx + dx, ty = cy + dy; if (!_fp.cells.has(tx + "," + ty) || Math.hypot(bx - tx, by - ty) > br + 0.75) continue; _fpCellOps(map, tx, ty).push({ t: "C", c: _fpRgba(col, k === "puddle" ? 0.38 : k === "scorch" ? 0.38 : 0.34), u: bx - tx, v: by - ty, r: br, shine: k === "puddle" }); } }
        } else if (k === "papers" || k === "debris") {   // scattered sheets (or rubble)
            const seed = _fpHash(Math.round(d.at[0] * 5), Math.round(d.at[1] * 5)), n = d.n || 5;
            for (let i = 0; i < n; i++) { const bx = d.at[0] + (((seed >>> i) % 21) - 10) / 10 * (d.radius || 1), by = d.at[1] + (((seed >>> (i + 4)) % 21) - 10) / 10 * (d.radius || 1), cx = Math.round(bx), cy = Math.round(by); if (!_fp.cells.has(cx + "," + cy)) continue;
                const u = bx - cx, v = by - cy; _fpCellOps(map, cx, cy).push(k === "papers" ? { t: "P", c: i & 1 ? "rgba(225,225,215,0.75)" : "rgba(200,215,230,0.7)", p: [u - 0.09, v - 0.06, u + 0.09, v - 0.1, u + 0.1, v + 0.06, u - 0.08, v + 0.09] } : { t: "C", c: i & 1 ? "rgba(88,92,104,0.85)" : "rgba(62,66,78,0.85)", u, v, r: 0.05 + (i % 3) * 0.03 }); }
        } else if (k === "light") {   // a pool of light: every tile within the radius is warmed, most at the middle
            const R = d.radius, a = d.a || 0.2, fl = d.flicker ? 1 + (_fpHash(Math.round(d.at[0]), Math.round(d.at[1])) % 7) : 0;
            for (let x = Math.floor(d.at[0] - R); x <= Math.ceil(d.at[0] + R); x++) for (let y = Math.floor(d.at[1] - R); y <= Math.ceil(d.at[1] + R); y++) { const q = Math.hypot(x - d.at[0], y - d.at[1]) / R; if (q >= 1 || !_fp.cells.has(x + "," + y) || solid.has(x + "," + y)) continue; _fpCellOps(map, x, y).push({ t: "G", c: col, a: a * 0.6 * Math.pow(1 - q, 1.4), fl }); }
        }
    }
    _fp.underOps = under; _fp.spr = new Map();
    return map;
}
// Called by every facility floor tile from the game's own tile draw: px, py are the tile's top-left corner as for the tile sprite.
// A tile's static marks are painted ONCE into a small sprite (cut to the tile's diamond) and stamped each frame; only the light (which flickers) is painted live.
function facilityDrawFloorOn(obj, px, py) {
    if (!_fp || !_fp.floorOps) return;
    const key = obj.x + "," + obj.y, ops = _fp.floorOps.get(key); if (!ops) return;
    _fpDrawOps(ops, px, py + TILE_H, key);
}
// (cx, cy) is the middle of the tile on screen; key names the tile's cached sprite
function _fpDrawOps(ops, cx, cy, key) {
    const W = TILE_W, H = TILE_H;
    let spr = _fp.spr.get(key);
    if (spr === undefined) {   // not painted yet: paint it (null if there is no canvas to paint on, as in the tests)
        spr = null;
        try {
            if (typeof document !== "undefined" && document.createElement) {
                const c = document.createElement("canvas"); c.width = W * 2 + 2; c.height = H * 2 + 2; const g = c.getContext("2d");
                if (g && g.clip) { g.beginPath(); g.moveTo(W + 1, 1); g.lineTo(W * 2 + 1, H + 1); g.lineTo(W + 1, H * 2 + 1); g.lineTo(1, H + 1); g.closePath(); g.clip(); _fpPaintOps(g, ops, W + 1, H + 1, true); spr = c; }
            }
        } catch (e) { spr = null; }
        _fp.spr.set(key, spr);
    }
    if (spr) ctx.drawImage(spr, cx - W - 1, cy - H - 1); else { ctx.save(); ctx.beginPath(); ctx.moveTo(cx, cy - H); ctx.lineTo(cx + W, cy); ctx.lineTo(cx, cy + H); ctx.lineTo(cx - W, cy); ctx.closePath(); ctx.clip(); _fpPaintOps(ctx, ops, cx, cy, true); ctx.restore(); }
    for (let i = 0; i < ops.length; i++) if (ops[i].t === "G" && ops[i].fl) _fpPaintOps(ctx, [ops[i]], cx, cy, false);
}
// staticPass: paint the marks (not the light); otherwise only the light
function _fpPaintOps(g, ops, cx, cy, staticPass) {
    const W = TILE_W, H = TILE_H, f = _fpFrame();
    const X = (u, v) => cx + (u - v) * W, Y = (u, v) => cy + (u + v) * H;
    for (let i = 0; i < ops.length; i++) {
        const o = ops[i], t = o.t;
        if (t === "G" && !o.fl) { if (!staticPass) continue; g.fillStyle = _fpRgba(o.c, o.a * 0.8); g.beginPath(); g.moveTo(cx, cy - H); g.lineTo(cx + W, cy); g.lineTo(cx, cy + H); g.lineTo(cx - W, cy); g.closePath(); g.fill(); continue; }   // a steady light is baked into the sprite as a warm wash
        if (t === "G") { if (staticPass) continue; const fl = o.fl ? 0.7 + 0.3 * Math.sin(f * 0.07 * o.fl + o.fl * 3) * (Math.sin(f * 0.013 * o.fl) > 0.2 ? 1 : 0.4) : 1; g.globalCompositeOperation = "lighter"; g.fillStyle = _fpRgba(o.c, o.a * fl); g.beginPath(); g.moveTo(cx, cy - H); g.lineTo(cx + W, cy); g.lineTo(cx, cy + H); g.lineTo(cx - W, cy); g.closePath(); g.fill(); g.globalCompositeOperation = "source-over"; continue; }
        if (!staticPass) continue;
        if (t === "D") { g.fillStyle = o.c; g.beginPath(); g.moveTo(cx, cy - H); g.lineTo(cx + W, cy); g.lineTo(cx, cy + H); g.lineTo(cx - W, cy); g.closePath(); g.fill(); }
        else if (t === "L") { g.strokeStyle = o.c; g.lineWidth = o.w || 1; g.beginPath(); g.moveTo(X(o.p[0], o.p[1]), Y(o.p[0], o.p[1])); g.lineTo(X(o.p[2], o.p[3]), Y(o.p[2], o.p[3])); g.stroke(); }
        else if (t === "P") { g.fillStyle = o.c; g.beginPath(); for (let j = 0; j < o.p.length; j += 2) j ? g.lineTo(X(o.p[j], o.p[j + 1]), Y(o.p[j], o.p[j + 1])) : g.moveTo(X(o.p[0], o.p[1]), Y(o.p[0], o.p[1])); g.closePath(); g.fill(); }
        else if (t === "C") { g.fillStyle = o.c; g.beginPath(); g.ellipse(X(o.u, o.v), Y(o.u, o.v), o.r * W * 1.4142, o.r * H * 1.4142, 0, 0, 6.2832); g.fill(); if (o.shine) { g.fillStyle = "rgba(255,255,255,0.12)"; g.beginPath(); g.ellipse(X(o.u - o.r * 0.25, o.v - o.r * 0.25), Y(o.u - o.r * 0.25, o.v - o.r * 0.25), o.r * W * 0.5, o.r * H * 0.5, 0, 0, 6.2832); g.fill(); } }
    }
}

// ═════════════ WALL DECOR ═════════════
// Each is drawn flat on the wall between a and b. u runs 0..1 along it, z is px up from the floor (the wall is FP_WALL_H = 74 tall).
function _fpWallPlace(F) {
    const items = [];
    for (const d of (F.decor || [])) {
        if (!FP_WALL_KINDS[d.kind]) continue;
        const a = d.a, b = d.b, h = Math.abs(a[1] - b[1]) < 1e-6, end = a[0] + a[1] > b[0] + b[1] ? a : b, mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
        items.push({ type: "fp", fp: "wdecor", kind: d.kind, x: mid[0], y: mid[1], a, b, colour: d.colour, text: d.text, z: d.z, h: d.h, id: d.id, base: facilityRoomHeight(d.room, F) * FP_ELEV_PX, depth: end[0] + end[1] + (h ? 0.3 : 0.3), seed: _fpHash(Math.round(mid[0] * 4), Math.round(mid[1] * 4)) });
    }
    return items;
}
function _fpWP(it, u, z) { return _fpP(it.a[0] + (it.b[0] - it.a[0]) * u, it.a[1] + (it.b[1] - it.a[1]) * u, z); }
function _fpWQuad(it, u0, u1, z0, z1, fill, stroke, lw) { _fpQuad([_fpWP(it, u0, z0), _fpWP(it, u1, z0), _fpWP(it, u1, z1), _fpWP(it, u0, z1)], fill, stroke, lw); }
function _fpWLine(it, u0, z0, u1, z1, col, w) { const p = _fpWP(it, u0, z0), q = _fpWP(it, u1, z1); ctx.strokeStyle = col; ctx.lineWidth = w || 1; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
const FP_WALL_KINDS = {
    poster: (it, f) => {   // a framed poster: a faded print, a title bar, a few lines of text
        const z0 = it.z || 26, z1 = z0 + (it.h || 34), pal = [["#2b5a8a", "#ffd34d"], ["#7a2f3f", "#f4e6c8"], ["#2f6a4a", "#e8ffd8"], ["#5a3a8a", "#8fe3ff"], ["#8a5a2a", "#fff1cf"]][it.seed % 5];
        _fpWQuad(it, 0.12, 0.88, z0 - 2, z1 + 2, "#0c0f16", "rgba(200,210,235,0.45)", 1); _fpWQuad(it, 0.17, 0.83, z0 + 1, z1 - 1, pal[0], null);
        _fpWQuad(it, 0.24, 0.76, z1 - 11, z1 - 5, pal[1], null); for (let k = 0; k < 3; k++) _fpWQuad(it, 0.24, 0.76 - (k === 2 ? 0.2 : 0), z1 - 17 - k * 5, z1 - 15 - k * 5, _fpRgba(pal[1], 0.5), null);
        if (it.seed % 3 === 0) _fpWLine(it, 0.3, z0 + 2, 0.7, z1 - 2, "rgba(0,0,0,0.25)", 1);   // a tear / crease
    },
    vent: (it, f) => {   // a louvred vent grille
        const z0 = it.z || 40; _fpWQuad(it, 0.1, 0.9, z0, z0 + 16, "#1b2230", "rgba(180,200,230,0.5)", 1); for (let k = 0; k < 4; k++) _fpWLine(it, 0.14, z0 + 3 + k * 3.4, 0.86, z0 + 3 + k * 3.4, "rgba(150,170,200,0.55)", 1);
    },
    pipe: (it, f) => {   // a run of pipe (or two) along the wall, with a flange at each end
        const z = it.z || 60, col = it.colour || "#7d8aa6"; _fpWQuad(it, 0, 1, z, z + 6, col, "rgba(5,7,15,0.5)", 1); _fpWLine(it, 0, z + 5, 1, z + 5, "rgba(255,255,255,0.35)", 1);
        const n = Math.max(1, Math.round(Math.hypot(it.b[0] - it.a[0], it.b[1] - it.a[1]) / 2.5)); for (let k = 0; k <= n; k++) _fpWQuad(it, Math.max(0, k / n - 0.012), Math.min(1, k / n + 0.012), z - 1, z + 7, "#4a566e", null);
        if (it.seed % 4 === 0) { const t = 0.3 + (it.seed % 5) * 0.1, d = (f * 0.4) % 18; _fpWQuad(it, t - 0.01, t + 0.01, z - d, z, "rgba(120,200,255,0.5)", null); }   // a drip from a joint
    },
    wall_light: (it, f) => {   // a strip light, flickering when the wall says so
        const z = it.z || 62, c = it.colour || "#fff2c0", fl = it.h ? (0.55 + 0.45 * Math.sin(f * 0.11 + it.seed) * (Math.sin(f * 0.017 + it.seed) > 0.1 ? 1 : 0.2)) : 1;
        _fpWQuad(it, 0.05, 0.95, z, z + 5, "#242b3a", "rgba(5,7,15,0.5)", 1); _fpWQuad(it, 0.08, 0.92, z + 1, z + 4, _fpRgba(c, 0.5 + 0.5 * Math.max(0, fl)), null);
        ctx.globalCompositeOperation = "lighter"; _fpWQuad(it, 0.0, 1.0, z - 22, z + 4, _fpRgba(c, 0.08 * Math.max(0, fl)), null); ctx.globalCompositeOperation = "source-over";
    },
    screen: (it, f) => {   // a wall monitor: dark glass, a glow, a scrolling bar chart
        const c = it.colour || "#6dff5a", z0 = it.z || 34; _fpWQuad(it, 0.08, 0.92, z0, z0 + 28, "#0a0e14", "rgba(200,210,235,0.55)", 1.5); _fpWQuad(it, 0.14, 0.86, z0 + 4, z0 + 24, _fpRgba(c, 0.14), null);
        for (let k = 0; k < 7; k++) { const hh = 4 + 14 * (0.5 + 0.5 * Math.sin(f * 0.04 + k * 1.3 + it.seed)); _fpWQuad(it, 0.18 + k * 0.095, 0.24 + k * 0.095, z0 + 5, z0 + 5 + hh, _fpRgba(c, 0.8), null); }
    },
    board: (it, f) => {   // a notice board: cork, pinned pages
        const z0 = it.z || 30; _fpWQuad(it, 0.06, 0.94, z0, z0 + 34, "#8a6a40", "#3a2a18", 2);
        for (let k = 0; k < 5; k++) { const u = 0.12 + ((it.seed >>> k) % 6) * 0.12, zz = z0 + 5 + ((it.seed >>> (k + 3)) % 3) * 9; _fpWQuad(it, u, u + 0.12, zz, zz + 10, k & 1 ? "#f0eadb" : "#cfe0f4", null); _fpWQuad(it, u + 0.05, u + 0.07, zz + 8, zz + 10, "#d94a3a", null); }
    },
    whiteboard: (it, f) => {
        const z0 = it.z || 30; _fpWQuad(it, 0.06, 0.94, z0, z0 + 32, "#dfe8ee", "#58687a", 2);
        for (let k = 0; k < 4; k++) _fpWLine(it, 0.12, z0 + 6 + k * 6, 0.12 + ((it.seed >>> k) % 5) * 0.14 + 0.2, z0 + 6 + k * 6 + ((k & 1) ? 1 : -1), k & 1 ? "#2a62d8" : "#d83a3a", 1.5);
    },
    exit_sign: (it, f) => {   // a green EXIT box over a door
        const z0 = it.z || 62; _fpWQuad(it, 0.2, 0.8, z0, z0 + 10, "#0d2a1a", "#3aff7a", 1.5); _fpWQuad(it, 0.28, 0.72, z0 + 3, z0 + 7, _fpRgba("#6dff9a", 0.55 + 0.25 * Math.sin(f * 0.05 + it.seed)), null);
    },
    clock: (it, f) => {   // a round wall clock (stopped on a wrong time: rundown)
        const c = _fpWP(it, 0.5, it.z || 46); ctx.fillStyle = "#e8e6dc"; ctx.beginPath(); ctx.ellipse(c[0], c[1], 9, 9, 0, 0, 6.2832); ctx.fill(); ctx.strokeStyle = "#2a2a30"; ctx.lineWidth = 2; ctx.stroke();
        const ha = it.seed * 0.7; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + Math.cos(ha) * 5, c[1] + Math.sin(ha) * 5); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + Math.cos(ha * 2.3) * 7, c[1] + Math.sin(ha * 2.3) * 7); ctx.stroke();
    },
    graffiti: (it, f) => {   // a sprayed scrawl
        const c = it.colour || "#ff3da6", z0 = it.z || 28; ctx.lineCap = "round"; for (let k = 0; k < 6; k++) { const u0 = 0.12 + k * 0.13, s = (it.seed >>> k) % 3; _fpWLine(it, u0, z0 + 6 + s * 6, u0 + 0.08, z0 + 24 - s * 4, c, 3); _fpWLine(it, u0 + 0.08, z0 + 24 - s * 4, u0 + 0.14, z0 + 8 + s * 5, c, 3); }
        ctx.lineCap = "butt"; _fpWLine(it, 0.1, z0 + 2, 0.9, z0 + 2, _fpRgba(c, 0.5), 1);
    },
    panel: (it, f) => {   // an access panel with a hazard stripe and a status lamp
        const z0 = it.z || 22; _fpWQuad(it, 0.15, 0.85, z0, z0 + 30, "#2b3446", "rgba(190,205,235,0.5)", 1.5); _fpWQuad(it, 0.15, 0.85, z0 + 22, z0 + 30, "rgba(255,210,26,0.55)", null);
        const lamp = _fpWP(it, 0.8, z0 + 10); ctx.fillStyle = Math.floor(f / 30 + it.seed) % 4 === 0 ? "#ff4a3a" : "#6dff5a"; ctx.beginPath(); ctx.arc(lamp[0], lamp[1], 2.5, 0, 6.2832); ctx.fill();
        _fpWLine(it, 0.25, z0 + 12, 0.65, z0 + 12, "rgba(200,215,240,0.5)", 1);
    },
    banner: (it, f) => {   // a hanging cloth banner with a stripe and a tattered hem
        const c = it.colour || "#8a1f2a", z1 = it.z || 70; _fpWQuad(it, 0.15, 0.85, z1 - 46, z1, c, "rgba(5,7,15,0.5)", 1); _fpWQuad(it, 0.15, 0.85, z1 - 24, z1 - 18, "#e8d8a8", null);
        _fpQuad([_fpWP(it, 0.15, z1 - 46), _fpWP(it, 0.32, z1 - 46), _fpWP(it, 0.235, z1 - 53)], c, null); _fpQuad([_fpWP(it, 0.5, z1 - 46), _fpWP(it, 0.68, z1 - 46), _fpWP(it, 0.59, z1 - 51)], c, null);
    },
    mirror: (it, f) => {   // a mirror with a crack across it
        const z0 = it.z || 34; _fpWQuad(it, 0.08, 0.92, z0, z0 + 30, "rgba(160,205,225,0.6)", "#aebbc8", 2); _fpWQuad(it, 0.14, 0.4, z0 + 3, z0 + 27, "rgba(255,255,255,0.14)", null); _fpWLine(it, 0.55, z0 + 28, 0.8, z0 + 4, "rgba(30,50,60,0.7)", 1); _fpWLine(it, 0.68, z0 + 17, 0.88, z0 + 21, "rgba(30,50,60,0.6)", 1);
    },
    shelf: (it, f) => {   // two shelves with jars and boxes
        const z0 = it.z || 22; for (let r = 0; r < 2; r++) { const zz = z0 + r * 24; _fpWQuad(it, 0.04, 0.96, zz, zz + 3, "#5a4a38", "rgba(5,7,15,0.5)", 1);
            for (let k = 0; k < 6; k++) { const u = 0.08 + k * 0.14, hh = 8 + ((it.seed >>> (k + r * 3)) % 3) * 4; _fpWQuad(it, u, u + 0.1, zz + 3, zz + 3 + hh, ["#6adfff", "#ffb347", "#a64dff", "#6dff5a", "#e8e0c8", "#ff6a4a"][(k + r * 2 + it.seed) % 6], "rgba(0,0,0,0.3)", 1); } }
    },
    sign: (it, f) => {   // a lettered sign: a bright plate and a few strokes of lettering (the wording is not decided)
        const z0 = it.z || 40, c = it.colour || "#8fe3ff"; _fpWQuad(it, 0.05, 0.95, z0, z0 + 18, "#101828", c, 1.5); for (let k = 0; k < 5; k++) _fpWQuad(it, 0.12 + k * 0.16, 0.12 + k * 0.16 + 0.1, z0 + 5, z0 + 13, _fpRgba(c, 0.6 + 0.2 * Math.sin(f * 0.04 + k)), null);
    },
    hazard_sign: (it, f) => {   // a yellow warning diamond
        const c = _fpWP(it, 0.5, it.z || 44); ctx.fillStyle = "#ffd21a"; ctx.strokeStyle = "#1b1b1f"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c[0], c[1] - 11); ctx.lineTo(c[0] + 11, c[1]); ctx.lineTo(c[0], c[1] + 11); ctx.lineTo(c[0] - 11, c[1]); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#1b1b1f"; ctx.fillRect(c[0] - 1.3, c[1] - 6, 2.6, 7); ctx.fillRect(c[0] - 1.3, c[1] + 3, 2.6, 2.6);
    },
    cable_run: (it, f) => {   // cables looping down a wall
        for (let k = 0; k < 3; k++) { const u0 = 0.15 + k * 0.28, p = _fpWP(it, u0, 74), q = _fpWP(it, u0 + 0.04, 30 + k * 8), m = _fpWP(it, u0 + 0.14, 20 + k * 8); ctx.strokeStyle = k & 1 ? "#2a2e3a" : "#3a2a2a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(q[0], q[1] - 8, m[0], m[1]); ctx.stroke(); }
    },
    // ── rock, steel and cave dressing (the arena's walls and the catwalks) ──
    crack: (it, f) => {   // a jagged crack running down the wall
        const n = 2 + it.seed % 2; for (let k = 0; k < n; k++) { let u = 0.12 + (k + ((it.seed >>> k) % 4) * 0.1) * 0.28, z = 70 - (it.seed >>> (k + 2)) % 12; const pts = [[u, z]]; for (let i = 0; i < 6; i++) { u += (((it.seed >>> (i + k)) % 7) - 3) * 0.012; z -= 8 + ((it.seed >>> (i + 2)) % 6); pts.push([u, Math.max(2, z)]); }
            for (const [col, w, du] of [["rgba(0,0,0,0.75)", 2, 0], ["rgba(255,235,200,0.18)", 1, 0.008]]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); pts.forEach((q, i) => { const p = _fpWP(it, q[0] + du, q[1]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke(); } }
    },
    vein: (it, f) => {   // a glowing mineral vein wandering across the rock, with a branch
        const c = it.colour || "#6adfff", pul = 0.55 + 0.35 * Math.sin(f * 0.04 + it.seed), z0 = it.z || 26; let u = 0.04, z = z0 + (it.seed % 20); const pts = [[u, z]]; for (let i = 0; i < 9; i++) { u += 0.1; z += (((it.seed >>> i) % 9) - 4) * 2.4; pts.push([Math.min(0.97, u), Math.max(6, Math.min(66, z))]); }
        const path = (a) => { ctx.beginPath(); a.forEach((q, i) => { const p = _fpWP(it, q[0], q[1]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke(); };
        ctx.globalCompositeOperation = "lighter"; ctx.strokeStyle = _fpRgba(c, 0.14 * pul); ctx.lineWidth = 8; path(pts); ctx.globalCompositeOperation = "source-over"; ctx.strokeStyle = _fpRgba(c, 0.9 * pul); ctx.lineWidth = 2; path(pts);
        const br = pts.slice(4, 7).map((q, i) => [q[0] + i * 0.05, q[1] - 6 - i * 7]); ctx.lineWidth = 1.5; path([pts[4]].concat(br));
    },
    beam: (it, f) => {   // a timber support: two posts, a lintel and a cross brace
        const H = 74; for (const u of [0.04, 0.93]) _fpWQuad(it, u, u + 0.04, 0, H, "#6a4a2c", "rgba(5,7,15,0.55)", 1); _fpWQuad(it, 0.02, 0.98, H - 9, H - 2, "#7a5a36", "rgba(5,7,15,0.55)", 1);
        _fpWLine(it, 0.08, 6, 0.93, H - 9, "#5a3e24", 3); _fpWLine(it, 0.93, 6, 0.08, H - 9, "rgba(90,62,36,0.6)", 2); for (const u of [0.05, 0.94]) for (const z of [14, 40]) { const p = _fpWP(it, u + 0.02, z); ctx.fillStyle = "#c9b890"; ctx.fillRect(p[0] - 1.5, p[1] - 1.5, 3, 3); }
    },
    chain: (it, f) => {   // hanging chains: links alternating, swaying a little, ending in a hook
        const n = 2 + it.seed % 2; for (let k = 0; k < n; k++) { const u = 0.15 + k * 0.3, len = 26 + ((it.seed >>> k) % 22), sway = Math.sin(f * 0.03 + it.seed + k) * 2; for (let l = 0; l < len / 5; l++) { const p = _fpWP(it, u + sway * 0.002 * l, 74 - l * 5); ctx.strokeStyle = l & 1 ? "#8a93a6" : "#5a6272"; ctx.lineWidth = 2; ctx.beginPath(); if (l & 1) ctx.ellipse(p[0], p[1], 1.5, 3, 0, 0, 6.2832); else ctx.ellipse(p[0], p[1], 3, 1.5, 0, 0, 6.2832); ctx.stroke(); }
            const h = _fpWP(it, u, 74 - len); ctx.strokeStyle = "#b8c0d0"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(h[0], h[1] + 3, 4, 0, 3.6); ctx.stroke(); }
    },
    claw: (it, f) => {   // four deep gouges: something very large lives here
        const z0 = it.z || 22; for (let k = 0; k < 4; k++) { const u = 0.3 + k * 0.07; _fpWLine(it, u, z0 + 40 - k * 2, u + 0.1, z0, "rgba(0,0,0,0.7)", 3); _fpWLine(it, u + 0.006, z0 + 40 - k * 2, u + 0.106, z0, "rgba(255,225,190,0.35)", 1); }
    },
    ooze_drip: (it, f) => {   // streaks of ooze running down the wall, a bead sliding down each
        const c = it.colour || "#8a4aff"; for (let k = 0; k < 4; k++) { const u = 0.12 + k * 0.22 + ((it.seed >>> k) % 5) * 0.01, len = 20 + ((it.seed >>> (k + 1)) % 40), top = 74 - ((it.seed >>> k) % 8);
            _fpWQuad(it, u, u + 0.035, top - len, top, _fpRgba(c, 0.42), null); const p = _fpWP(it, u + 0.0175, top - len); ctx.fillStyle = _fpRgba(c, 0.6); ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 6.2832); ctx.fill();
            const ph = ((f * 0.6 + k * 17 + it.seed) % 60) / 60, b = _fpWP(it, u + 0.0175, top - len * ph); ctx.fillStyle = _fpRgba(c, 0.85); ctx.beginPath(); ctx.arc(b[0], b[1], 2, 0, 6.2832); ctx.fill(); }
    },
    lamp: (it, f) => {   // a caged work lamp on a bracket, with a glare
        const c = it.colour || "#ffe9a0", fl = it.h ? (0.55 + 0.45 * Math.sin(f * 0.13 + it.seed) * (Math.sin(f * 0.019 + it.seed) > 0.05 ? 1 : 0.15)) : 1, z = it.z || 52, p = _fpWP(it, 0.5, z);
        ctx.strokeStyle = "#3a4050"; ctx.lineWidth = 3; ctx.beginPath(); const q = _fpWP(it, 0.5, z - 12); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke();
        ctx.fillStyle = "#1d222c"; ctx.fillRect(p[0] - 9, p[1] - 8, 18, 14); ctx.fillStyle = _fpRgba(c, 0.55 + 0.45 * Math.max(0, fl)); ctx.fillRect(p[0] - 7, p[1] - 6, 14, 10); ctx.strokeStyle = "rgba(10,12,18,0.8)"; ctx.lineWidth = 1; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(p[0] + i * 4, p[1] - 6); ctx.lineTo(p[0] + i * 4, p[1] + 4); ctx.stroke(); }
        ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(p[0], p[1], 2, p[0], p[1], 46); g.addColorStop(0, _fpRgba(c, 0.5 * Math.max(0, fl))); g.addColorStop(1, _fpRgba(c, 0)); ctx.fillStyle = g; ctx.fillRect(p[0] - 46, p[1] - 46, 92, 92); ctx.globalCompositeOperation = "source-over";
    },
    ladder: (it, f) => {   // a steel ladder bolted to the wall
        _fpWQuad(it, 0.3, 0.335, 0, 70, "#7d8aa6", "rgba(5,7,15,0.5)", 1); _fpWQuad(it, 0.665, 0.7, 0, 70, "#7d8aa6", "rgba(5,7,15,0.5)", 1); for (let z = 8; z < 70; z += 9) _fpWLine(it, 0.31, z, 0.69, z, "#aab6cc", 2);
    },
    scoreboard: (it, f) => {   // the arena scoreboard: a title bar and two lit counters ticking over
        const z0 = it.z || 22, c = it.colour || "#ff4a3a"; _fpWQuad(it, 0.03, 0.97, z0, z0 + 46, "#0a0c12", "rgba(200,210,235,0.6)", 2); _fpWQuad(it, 0.08, 0.92, z0 + 36, z0 + 42, _fpRgba(c, 0.7 + 0.2 * Math.sin(f * 0.05)), null);
        for (let side = 0; side < 2; side++) for (let d = 0; d < 3; d++) { const u0 = 0.1 + side * 0.44 + d * 0.12, on = ((Math.floor(f / 40) + d * 3 + side * 5 + it.seed) % 4) > 0; _fpWQuad(it, u0, u0 + 0.09, z0 + 6, z0 + 30, on ? _fpRgba(c, 0.85) : _fpRgba(c, 0.18), null); _fpWQuad(it, u0 + 0.02, u0 + 0.07, z0 + 16, z0 + 20, "#0a0c12", null); }
        _fpWQuad(it, 0.47, 0.53, z0 + 14, z0 + 22, _fpRgba("#ffd34d", 0.8), null);
    },
    plate: (it, f) => {   // a riveted, rusty metal patch bolted over the rock
        const z0 = it.z || 18, hh = it.h || 36; _fpWQuad(it, 0.06, 0.94, z0, z0 + hh, "#6a5a4a", "rgba(5,7,15,0.55)", 1.5); _fpWQuad(it, 0.06, 0.94, z0 + hh - 8, z0 + hh, "rgba(160,90,40,0.5)", null); _fpWLine(it, 0.06, z0 + hh * 0.5, 0.94, z0 + hh * 0.5, "rgba(10,10,12,0.4)", 1);
        for (const u of [0.1, 0.9]) for (const z of [z0 + 4, z0 + hh - 4]) { const p = _fpWP(it, u, z); ctx.fillStyle = "#c9b890"; ctx.beginPath(); ctx.arc(p[0], p[1], 1.6, 0, 6.2832); ctx.fill(); }
    },
    moss: (it, f) => {   // patches of moss and fungus in the damp low part of the wall
        for (let k = 0; k < 6; k++) { const p = _fpWP(it, 0.08 + k * 0.15 + ((it.seed >>> k) % 5) * 0.01, 4 + ((it.seed >>> (k + 2)) % 4) * 7); ctx.fillStyle = k & 1 ? "rgba(70,140,70,0.75)" : "rgba(50,110,60,0.75)"; ctx.beginPath(); ctx.ellipse(p[0], p[1], 8 + (k % 3) * 3, 4 + (k % 2) * 2, 0, 0, 6.2832); ctx.fill();
            if ((it.seed + k) % 4 === 0) { ctx.fillStyle = "rgba(150,255,180," + (0.5 + 0.3 * Math.sin(f * 0.05 + k)) + ")"; ctx.beginPath(); ctx.arc(p[0] + 2, p[1] - 3, 1.6, 0, 6.2832); ctx.fill(); } }
    },
    stalactite: (it, f) => {   // rock teeth hanging from the top of the wall
        const n = Math.max(3, Math.round(Math.hypot(it.b[0] - it.a[0], it.b[1] - it.a[1]) * 1.4)); for (let k = 0; k < n; k++) { const u = (k + 0.5) / n, w = 0.4 / n, l = 8 + ((it.seed >>> (k % 20)) + k * 5) % 16; _fpQuad([_fpWP(it, u - w, 74), _fpWP(it, u + w, 74), _fpWP(it, u + w * 0.15, 74 - l), _fpWP(it, u - w * 0.15, 74 - l)], "#4a3a2c", "rgba(5,7,15,0.4)", 1); _fpQuad([_fpWP(it, u, 74), _fpWP(it, u + w, 74), _fpWP(it, u + w * 0.15, 74 - l)], "rgba(255,255,255,0.08)", null); }
    },
    bulbs: (it, f) => {   // a string of coloured bulbs sagging along the top of the wall
        const n = Math.max(4, Math.round(Math.hypot(it.b[0] - it.a[0], it.b[1] - it.a[1]) * 1.6)), cols = ["#ff4a3a", "#ffd34d", "#6dff5a", "#6adfff", "#d94aff"]; ctx.strokeStyle = "#1a1d26"; ctx.lineWidth = 1.5; ctx.beginPath(); for (let k = 0; k <= n; k++) { const u = k / n, p = _fpWP(it, u, 68 - Math.sin(u * 3.1416) * 7); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
        for (let k = 0; k <= n; k++) { const u = k / n, p = _fpWP(it, u, 68 - Math.sin(u * 3.1416) * 7 - 2), on = (Math.floor(f / 24) + k + it.seed) % 6 !== 0; ctx.fillStyle = on ? cols[(k + it.seed) % 5] : "#2a2e3a"; ctx.beginPath(); ctx.arc(p[0], p[1], 2.4, 0, 6.2832); ctx.fill(); if (on) { ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = _fpRgba(cols[(k + it.seed) % 5], 0.18); ctx.beginPath(); ctx.arc(p[0], p[1], 7, 0, 6.2832); ctx.fill(); ctx.globalCompositeOperation = "source-over"; } }
    },
    window_blind: (it, f) => {   // hanging window blinds
        const z1 = it.z || 70; for (let k = 0; k < 7; k++) _fpWQuad(it, 0.05, 0.95, z1 - 3 - k * 5, z1 - 1 - k * 5, "#b8b098", "rgba(60,50,30,0.5)", 1);
    },
};
function _fpDrawWDecor(it) { const fn = FP_WALL_KINDS[it.kind]; if (fn) fn(it, _fpFrame()); }

// ═════════════ FURNITURE ═════════════
// Returns true if it drew the kind. `it` is one tile of a solid prop (sx / sy: whether its +x / +y face is exposed, as for the desks).
const FP_SMALL_PROPS = new Set(["plant", "cooler", "bin", "barrel", "beanbag", "telescope", "floodlight", "cart", "teleporter", "table", "pingpong", "rail", "spool", "toolbox", "chair", "scaffold"]);
function _fpDecorProp(it) {
    const k = it.kind, f = _fpFrame(), seed = it.seed || 0, x = it.x, y = it.y;
    if (FP_SMALL_PROPS.has(k)) {   // the floor the piece stands on (its tile is solid, so the tile itself is not drawn)
        const c = _fpP(x, y, 0); ctx.fillStyle = "#0d1424"; ctx.beginPath(); ctx.moveTo(c[0], c[1] - TILE_H); ctx.lineTo(c[0] + TILE_W, c[1]); ctx.lineTo(c[0], c[1] + TILE_H); ctx.lineTo(c[0] - TILE_W, c[1]); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(60,90,140,0.25)"; ctx.lineWidth = 1; ctx.stroke(); const u = _fp.underOps && _fp.underOps.get(x + "," + y); if (u) _fpDrawOps(u, c[0], c[1], "u" + x + "," + y);
    }
    if (k === "plant") {   // a potted plant: a pot, then fronds (dead and brown if the seed says)
        const dead = seed % 3 === 0; _fpBox(x - 0.28, y - 0.28, x + 0.28, y + 0.28, 0, 16, "#6a3a22", "#8a4a2a", "#6e3a20");
        const cols = dead ? ["#7a6a3a", "#5a4a28", "#8a7a46"] : ["#2f9a4a", "#1f7a3a", "#4ab85a"]; for (let i = 0; i < 7; i++) { const a = i * 0.9 + seed, b = _fpP(x, y, 16), dx = Math.cos(a) * (10 + (i % 3) * 3), dy = -18 - (i % 4) * 7; ctx.strokeStyle = cols[i % 3]; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.quadraticCurveTo(b[0] + dx, b[1] + dy, b[0] + dx * 1.5, b[1] + dy * 0.7 + 6); ctx.stroke(); } ctx.lineCap = "butt";
    } else if (k === "vending") {   // a vending machine: a lit window of products, a coin slot, a dispenser flap
        _fpPrism(it, 66, "#3a4560", "#1d2438", "#161c2e");
        if (it.sy) { _fpFaceY(it, 0.08, 0.92, 6, 62, "#0c1220", "rgba(190,205,235,0.5)"); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) _fpFaceY(it, 0.14 + c * 0.17, 0.26 + c * 0.17, 26 + r * 11, 33 + r * 11, ["#ff6a4a", "#ffd34d", "#6adfff", "#6dff5a", "#d94aff"][(r * 4 + c + seed) % 5], null);
            _fpFaceY(it, 0.2, 0.8, 8, 17, "#05070c", "rgba(180,190,210,0.4)"); const g = _fpP(x, y + 0.5, 58); ctx.fillStyle = "rgba(143,227,255," + (0.6 + 0.3 * Math.sin(f * 0.06 + seed)) + ")"; ctx.fillRect(g[0] - 10, g[1], 20, 2); }
    } else if (k === "cooler") {   // a water cooler
        _fpBox(x - 0.3, y - 0.3, x + 0.3, y + 0.3, 0, 30, "#cfd8e0", "#9fb0c0", "#7d8ea0"); const b = _fpP(x, y, 30), t = _fpP(x, y, 58); ctx.fillStyle = "rgba(120,200,255,0.55)"; ctx.beginPath(); ctx.ellipse(b[0], (b[1] + t[1]) / 2, 11, 14, 0, 0, 6.2832); ctx.fill(); ctx.strokeStyle = "rgba(220,245,255,0.8)"; ctx.lineWidth = 1.5; ctx.stroke();
        const d = _fpP(x, y + 0.3, 22); ctx.fillStyle = "#3a8ad0"; ctx.fillRect(d[0] - 3, d[1], 6, 3);
    } else if (k === "couch") {   // a long low sofa along +x: seat cushions, a backrest on the far (-y) side, arms at the ends
        _fpPrism(it, 18, it.seed % 2 ? "#6a3a4a" : "#3a4a6a", "#2a1a22", "#22141b");
        _fpBox(x - 0.5, y - 0.5, x + 0.5, y - 0.28, 18, 40, it.seed % 2 ? "#5a2f3e" : "#2f3d5a", "#241520", "#1c1018");
        const c = _fpP(x, y, 19); ctx.strokeStyle = "rgba(0,0,0,0.35)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c[0] - TILE_W * 0.5, c[1] - TILE_H * 0.5); ctx.lineTo(c[0] + TILE_W * 0.5, c[1] + TILE_H * 0.5); ctx.stroke();
    } else if (k === "table") {   // a low table: a slab on legs, a couple of things on it
        _fpBox(x - 0.5, y - 0.5, x + 0.5, y + 0.5, 20, 25, "#7a5a3a", "#4a3422", "#3a2818"); for (const [a, b] of [[-0.42, -0.42], [0.42, -0.42], [0.42, 0.42], [-0.42, 0.42]]) { const p = _fpP(x + a, y + b, 0), q = _fpP(x + a, y + b, 20); ctx.strokeStyle = "#2a1c10"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
        if (seed % 2) { const m = _fpP(x - 0.1, y, 26); ctx.fillStyle = "#e8e0c8"; ctx.fillRect(m[0] - 4, m[1] - 5, 8, 5); }
    } else if (k === "pingpong") {   // a table-tennis table: a green slab, a white centre line, a net
        _fpBox(x - 0.5, y - 0.5, x + 0.5, y + 0.5, 20, 26, "#1f6a4a", "#14402e", "#0f3022"); if (it.sx) { const a = _fpP(x, y - 0.5, 26), b = _fpP(x, y + 0.5, 26); ctx.strokeStyle = "rgba(255,255,255,0.7)"; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
        const p = _fpP(x + 0.5, y, 20), q = _fpP(x + 0.5, y, 0); ctx.strokeStyle = "#1a1a20"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    } else if (k === "crate") {   // a wooden crate with slats, stencilled
        _fpPrism(it, 34, "#9a7a4a", "#6a5030", "#54401f", "rgba(255,230,160,0.3)"); if (it.sy) { _fpFaceY(it, 0.0, 1.0, 14, 16, "rgba(40,24,10,0.6)", null); _fpFaceY(it, 0.0, 1.0, 26, 28, "rgba(40,24,10,0.6)", null); _fpFaceY(it, 0.06, 0.94, 3, 5, "rgba(40,24,10,0.45)", null); } if (it.sx) { _fpFaceX(it, 0.0, 1.0, 14, 16, "rgba(40,24,10,0.5)", null); }
        if (seed % 3 === 0 && it.sy) _fpFaceY(it, 0.3, 0.7, 14, 24, "rgba(255,210,26,0.65)", null);   // a hazard label
    } else if (k === "crate_stack") {   // two crates high
        _fpPrism(it, 64, "#8a6a40", "#5e4628", "#4a361c", "rgba(255,230,160,0.3)"); if (it.sy) { for (const z of [30, 32]) _fpFaceY(it, 0, 1, z, z + 2, "rgba(30,18,8,0.7)", null); _fpFaceY(it, 0, 1, 14, 16, "rgba(40,24,10,0.55)", null); _fpFaceY(it, 0, 1, 46, 48, "rgba(40,24,10,0.55)", null); }
    } else if (k === "barrel") {   // an oil drum: ribs, a coloured band, a rusty lid
        const c0 = _fpP(x, y, 0), c1 = _fpP(x, y, 38), rx = TILE_W * 0.45, ry = TILE_H * 0.45, col = ["#8a3a2a", "#2a5a8a", "#6a6a2a"][seed % 3];
        ctx.fillStyle = _fpShade(col, 0.7); ctx.beginPath(); ctx.ellipse(c0[0], c0[1], rx, ry, 0, 0, 3.1416); ctx.lineTo(c1[0] - rx, c1[1]); ctx.ellipse(c1[0], c1[1], rx, ry, 0, 3.1416, 0, true); ctx.closePath(); ctx.fill();
        ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(c1[0], c1[1], rx, ry, 0, 0, 6.2832); ctx.fill(); ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1; ctx.stroke(); for (const z of [10, 26]) { const q = _fpP(x, y, z); ctx.strokeStyle = "rgba(0,0,0,0.4)"; ctx.beginPath(); ctx.ellipse(q[0], q[1], rx, ry, 0, 0, 3.1416); ctx.stroke(); }
        if (seed % 4 === 0) { const q = _fpP(x, y, 38); ctx.fillStyle = "rgba(255,210,26,0.9)"; ctx.beginPath(); ctx.ellipse(q[0], q[1], rx * 0.45, ry * 0.45, 0, 0, 6.2832); ctx.fill(); }
    } else if (k === "locker") {   // a tall metal locker, a door slit, a handle, a dent
        _fpPrism(it, 66, "#5a6a7e", "#33404f", "#28323f"); if (it.sy) { for (let i = 0; i < 2; i++) { _fpFaceY(it, 0.04 + i * 0.5, 0.46 + i * 0.5, 4, 62, "rgba(255,255,255,0.05)", "rgba(10,14,22,0.7)"); _fpFaceY(it, 0.1 + i * 0.5, 0.4 + i * 0.5, 50, 56, "rgba(10,14,22,0.65)", null); _fpFaceY(it, 0.38 + i * 0.5, 0.42 + i * 0.5, 28, 36, "#c8d4e0", null); } }
    } else if (k === "cabinet") {   // a filing / lab cabinet: drawers with handles
        _fpPrism(it, 46, "#8a98a8", "#566272", "#454f5c", "rgba(255,255,255,0.3)"); if (it.sy) for (let r = 0; r < 3; r++) { _fpFaceY(it, 0.06, 0.94, 3 + r * 14, 15 + r * 14, "rgba(255,255,255,0.05)", "rgba(10,14,22,0.6)"); _fpFaceY(it, 0.4, 0.6, 8 + r * 14, 10 + r * 14, "#e0e6ee", null); }
    } else if (k === "bin") {   // a rubbish bin, overflowing
        _fpBox(x - 0.25, y - 0.25, x + 0.25, y + 0.25, 0, 22, "#3a4250", "#2a303c", "#222832"); const t = _fpP(x, y, 24); ctx.fillStyle = "rgba(225,225,215,0.8)"; ctx.fillRect(t[0] - 6, t[1] - 6, 6, 6); ctx.fillStyle = "rgba(180,190,200,0.8)"; ctx.fillRect(t[0] + 1, t[1] - 4, 5, 5);
    } else if (k === "sink") {   // a washroom counter with a basin and taps
        _fpPrism(it, 34, "#dfe8ec", "#9aaab2", "#7d8e98", "rgba(255,255,255,0.5)"); const t = _fpP(x, y, 35); ctx.fillStyle = "#6f8e9a"; ctx.beginPath(); ctx.ellipse(t[0], t[1], 12, 6, 0, 0, 6.2832); ctx.fill(); ctx.strokeStyle = "#c0ccd4"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(t[0], t[1] - 6); ctx.lineTo(t[0], t[1] - 13); ctx.lineTo(t[0] + 4, t[1] - 13); ctx.stroke();
    } else if (k === "stall") {   // a toilet stall: partition walls, a door with a lock
        _fpPrism(it, 58, "#4a8a96", "#2c5660", "#224650"); if (it.sy) { _fpFaceY(it, 0.1, 0.9, 6, 52, "rgba(255,255,255,0.06)", "rgba(10,30,36,0.7)"); _fpFaceY(it, 0.42, 0.58, 28, 34, seed % 2 ? "#ff4a3a" : "#6dff5a", null); }
    } else if (k === "pallet") {   // a loaded pallet: boxes wrapped in film
        _fpPrism(it, 26, "#b8b4a0", "#7e7a68", "#68644f", "rgba(255,255,255,0.4)"); if (it.sy) { _fpFaceY(it, 0.03, 0.97, 0, 6, "#6a5232", null); _fpFaceY(it, 0.05, 0.95, 10, 22, "rgba(255,255,255,0.1)", "rgba(20,20,20,0.3)"); }
    } else if (k === "barrier") {   // a concrete jersey barrier striped orange and white, scuffed
        _fpPrism(it, 30, "#a8a39a", "#6e6a60", "#585449", "rgba(255,255,255,0.3)"); if (it.sy) for (let i = 0; i < 3; i++) _fpFaceY(it, 0.05 + i * 0.32, 0.25 + i * 0.32, 4, 26, i & 1 ? "rgba(240,240,232,0.55)" : "rgba(255,106,26,0.7)", null);
    } else if (k === "generator") {   // a diesel generator: ribbed housing, a gauge, a running lamp, a puff of exhaust
        _fpPrism(it, 44, "#8a6a2a", "#5a4418", "#483510"); if (it.sy) { _fpFaceY(it, 0.1, 0.9, 6, 38, "rgba(0,0,0,0.25)", "rgba(10,10,10,0.5)"); for (let i = 0; i < 4; i++) _fpFaceY(it, 0.14 + i * 0.2, 0.2 + i * 0.2, 8, 34, "rgba(0,0,0,0.35)", null); _fpFaceY(it, 0.62, 0.88, 28, 36, "#0a1a12", "rgba(200,210,200,0.5)"); }
        const l = _fpP(x - 0.3, y + 0.45, 38); ctx.fillStyle = Math.floor(f / 20 + seed) % 5 ? "#6dff5a" : "#ff4a3a"; ctx.beginPath(); ctx.arc(l[0], l[1], 2.5, 0, 6.2832); ctx.fill();
        if (seed % 2 === 0) { const e = _fpP(x + 0.3, y - 0.3, 44); for (let i = 0; i < 3; i++) { const ph = ((f * 0.5 + i * 12 + seed * 5) % 36) / 36; ctx.fillStyle = "rgba(170,170,180," + 0.3 * (1 - ph) + ")"; ctx.beginPath(); ctx.arc(e[0] + Math.sin(ph * 6 + i) * 4, e[1] - ph * 26, 3 + ph * 5, 0, 6.2832); ctx.fill(); } }
    } else if (k === "console") {   // a control console: a sloped panel of screens and lit keys, scrolling data
        _fpPrism(it, 28, "#3a4258", "#222a3c", "#1a2030"); const t = _fpP(x, y, 29), c = it.seed % 3 === 0 ? "#ff6a4a" : it.seed % 3 === 1 ? "#6adfff" : "#6dff5a";
        ctx.fillStyle = "#07090e"; ctx.fillRect(t[0] - 13, t[1] - 17, 26, 13); ctx.fillStyle = _fpRgba(c, 0.18 + 0.08 * Math.sin(f * 0.05 + seed)); ctx.fillRect(t[0] - 11, t[1] - 15, 22, 9);
        for (let i = 0; i < 5; i++) { ctx.fillStyle = _fpRgba(c, 0.85); ctx.fillRect(t[0] - 10, t[1] - 14 + i * 1.8, 4 + ((f / 6 + i * 3 + seed) % 14), 1); }
        for (let i = 0; i < 4; i++) { ctx.fillStyle = Math.floor(f / 25 + i * 2 + seed) % 5 === 0 ? "#ffd34d" : "rgba(143,227,255,0.6)"; ctx.fillRect(t[0] - 9 + i * 5, t[1] - 1, 3, 2); }
    } else if (k === "display_case") {   // a plinth with a glass case and a glowing exhibit inside
        _fpPrism(it, 18, "#2a3040", "#1a2030", "#141a28"); const g = it.id === "case_b" ? "#ffb347" : it.id === "case_c" ? "#a64dff" : "#6adfff"; _fpBox(x - 0.4, y - 0.4, x + 0.4, y + 0.4, 18, 56, "rgba(160,225,255,0.14)", "rgba(160,225,255,0.2)", "rgba(160,225,255,0.12)", "rgba(220,245,255,0.7)");
        const c = _fpP(x, y, 34); ctx.fillStyle = _fpRgba(g, 0.8); ctx.beginPath(); ctx.moveTo(c[0], c[1] - 9); ctx.lineTo(c[0] + 6, c[1]); ctx.lineTo(c[0], c[1] + 9); ctx.lineTo(c[0] - 6, c[1]); ctx.closePath(); ctx.fill(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = _fpRgba(g, 0.15 + 0.08 * Math.sin(f * 0.06 + seed)); ctx.beginPath(); ctx.arc(c[0], c[1], 16, 0, 6.2832); ctx.fill(); ctx.globalCompositeOperation = "source-over";
    } else if (k === "telescope") {   // a viewing scope on a stand
        const b = _fpP(x, y, 0), t = _fpP(x, y, 40); ctx.strokeStyle = "#2a2e38"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b[0] - 8, b[1] + 2); ctx.lineTo(t[0], t[1]); ctx.lineTo(b[0] + 8, b[1] + 2); ctx.stroke();
        ctx.strokeStyle = "#c9d6f0"; ctx.lineWidth = 7; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(t[0] - 14, t[1] - 4); ctx.lineTo(t[0] + 8, t[1] + 8); ctx.stroke(); ctx.lineCap = "butt"; ctx.strokeStyle = "#8fe3ff"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(t[0] + 8, t[1] + 8); ctx.lineTo(t[0] + 12, t[1] + 10); ctx.stroke();
    } else if (k === "floodlight") {   // a tall floodlight on a pole with a glare
        const b = _fpP(x, y, 0), t = _fpP(x, y, 96); ctx.strokeStyle = "#3a4050"; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(t[0], t[1]); ctx.stroke(); _fpBox(x - 0.28, y - 0.28, x + 0.28, y + 0.28, 0, 8, "#2a303c", "#1d222c", "#161a22");
        ctx.fillStyle = "#222836"; ctx.fillRect(t[0] - 13, t[1] - 8, 26, 12); for (let i = 0; i < 4; i++) { ctx.fillStyle = "rgba(255,244,200,0.95)"; ctx.fillRect(t[0] - 11 + i * 6, t[1] - 5, 4, 6); }
        ctx.globalCompositeOperation = "lighter"; const gl = ctx.createRadialGradient(t[0], t[1], 2, t[0], t[1], 40); gl.addColorStop(0, "rgba(255,240,190,0.5)"); gl.addColorStop(1, "rgba(255,240,190,0)"); ctx.fillStyle = gl; ctx.fillRect(t[0] - 40, t[1] - 40, 80, 80); ctx.globalCompositeOperation = "source-over";
    } else if (k === "teleporter") {   // a teleport pad's emitter pylon: a post with a ring of light spinning
        _fpBox(x - 0.3, y - 0.3, x + 0.3, y + 0.3, 0, 14, "#3a2f6a", "#241d46", "#1a1534"); for (let i = 0; i < 3; i++) { const z = 22 + i * 14 + Math.sin(f * 0.05 + i) * 3, c = _fpP(x, y, z); ctx.strokeStyle = _fpRgba("#a64dff", 0.55 + 0.3 * Math.sin(f * 0.07 + i)); ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(c[0], c[1], 14 - i * 2, 6 - i, 0, 0, 6.2832); ctx.stroke(); }
        ctx.globalCompositeOperation = "lighter"; const g = _fpP(x, y, 40); ctx.fillStyle = "rgba(166,77,255,0.14)"; ctx.beginPath(); ctx.arc(g[0], g[1], 22, 0, 6.2832); ctx.fill(); ctx.globalCompositeOperation = "source-over";
    } else if (k === "rail") {   // a safety rail: posts and two bars
        const a = _fpP(x - 0.5, y, 0), b = _fpP(x + 0.5, y, 0); for (const z of [14, 28]) { const p = _fpP(x - 0.5, y, z), q = _fpP(x + 0.5, y, z); ctx.strokeStyle = z === 28 ? "#ffd21a" : "#c9d6f0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); } ctx.strokeStyle = "#3a4258"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(a[0], a[1] - 30); ctx.stroke();
    } else if (k === "desk") {   // an office desk with a lamp and a mug
        _fpPrism(it, 28, "#8a7a5a", "#5a4a30", "#463a20"); const t = _fpP(x, y, 29); if (seed % 3 === 0) { ctx.fillStyle = "#e8e0c8"; ctx.fillRect(t[0] - 3, t[1] - 5, 6, 5); } else if (seed % 3 === 1) { ctx.strokeStyle = "#2a2e38"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(t[0], t[1]); ctx.lineTo(t[0] - 3, t[1] - 12); ctx.stroke(); ctx.fillStyle = "#ffe9a0"; ctx.fillRect(t[0] - 8, t[1] - 15, 8, 3); }
    } else if (k === "beanbag") {   // a slouched beanbag
        const c = _fpP(x, y, 6); ctx.fillStyle = ["#d94a6a", "#4ab8d9", "#e0b83a", "#6ad94a"][seed % 4]; ctx.beginPath(); ctx.ellipse(c[0], c[1], 20, 12, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,0.2)"; ctx.beginPath(); ctx.ellipse(c[0] - 4, c[1] - 4, 10, 5, 0, 0, 6.2832); ctx.fill();
    } else if (k === "cart") {   // a lab trolley: two shelves of glassware on wheels
        _fpBox(x - 0.4, y - 0.25, x + 0.4, y + 0.25, 0, 3, "#2a303c", "#1d222c", "#161a22"); _fpBox(x - 0.4, y - 0.25, x + 0.4, y + 0.25, 24, 27, "#cfd8e0", "#8e9eae", "#6e7e8e"); const t = _fpP(x, y, 27); ctx.fillStyle = "rgba(120,230,255,0.7)"; ctx.fillRect(t[0] - 9, t[1] - 9, 5, 9); ctx.fillStyle = "rgba(160,255,150,0.7)"; ctx.fillRect(t[0] + 2, t[1] - 7, 5, 7);
    } else if (k === "speaker") {   // a PA speaker stack: a cabinet with two cones and a horn on top
        _fpPrism(it, 52, "#2a2e38", "#1b1e26", "#15171e"); if (it.sy) { for (const [u, z, r] of [[0.5, 14, 0.32], [0.5, 36, 0.24]]) { const c = _fpP(x, y + 0.5, z); ctx.fillStyle = "#0b0c10"; ctx.beginPath(); ctx.ellipse(c[0], c[1], 14 * r / 0.32 * 0.9, 9 * r / 0.32 * 0.9, 0, 0, 6.2832); ctx.fill(); ctx.strokeStyle = "rgba(160,170,190,0.55)"; ctx.lineWidth = 1.5; ctx.stroke(); ctx.fillStyle = "#3a3f4c"; ctx.beginPath(); ctx.ellipse(c[0], c[1], 5, 3, 0, 0, 6.2832); ctx.fill(); } }
        const h = _fpP(x, y, 56); ctx.fillStyle = "#4a505e"; ctx.beginPath(); ctx.moveTo(h[0] - 9, h[1]); ctx.lineTo(h[0] + 9, h[1]); ctx.lineTo(h[0] + 14, h[1] - 10); ctx.lineTo(h[0] - 14, h[1] - 10); ctx.closePath(); ctx.fill();
    } else if (k === "spool") {   // a cable drum on its side
        const c0 = _fpP(x, y, 0), c1 = _fpP(x, y, 26), rx = TILE_W * 0.42, ry = TILE_H * 0.42; ctx.fillStyle = "#6a4a2c"; ctx.beginPath(); ctx.ellipse(c0[0], c0[1], rx, ry, 0, 0, 3.1416); ctx.lineTo(c1[0] - rx, c1[1]); ctx.ellipse(c1[0], c1[1], rx, ry, 0, 3.1416, 0, true); ctx.closePath(); ctx.fill();
        ctx.fillStyle = "#8a6a40"; ctx.beginPath(); ctx.ellipse(c1[0], c1[1], rx, ry, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = seed % 2 ? "#d94a3a" : "#e0b83a"; ctx.beginPath(); ctx.ellipse(c1[0], c1[1], rx * 0.62, ry * 0.62, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = "#2a1c10"; ctx.beginPath(); ctx.ellipse(c1[0], c1[1], rx * 0.18, ry * 0.18, 0, 0, 6.2832); ctx.fill();
    } else if (k === "toolbox") {   // a red steel toolbox with a lid and a handle
        _fpBox(x - 0.32, y - 0.22, x + 0.32, y + 0.22, 0, 14, "#c0392b", "#8a281e", "#6e1f17", "rgba(255,200,190,0.35)"); const h = _fpP(x, y, 14); ctx.strokeStyle = "#2a2e38"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(h[0] - 7, h[1]); ctx.lineTo(h[0] - 5, h[1] - 6); ctx.lineTo(h[0] + 5, h[1] - 6); ctx.lineTo(h[0] + 7, h[1]); ctx.stroke();
    } else if (k === "chair") {   // a swivel chair: a seat, a backrest, a star base
        const b = _fpP(x, y, 0), t = _fpP(x, y, 20); ctx.strokeStyle = "#1a1d26"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(t[0], t[1]); for (const a of [0, 1.26, 2.5, 3.8, 5.0]) { ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] + Math.cos(a) * 11, b[1] + Math.sin(a) * 5); } ctx.stroke();
        _fpBox(x - 0.28, y - 0.28, x + 0.28, y + 0.28, 18, 23, "#3a4a6a", "#26324a", "#1c2538"); _fpBox(x - 0.28, y - 0.3, x + 0.28, y - 0.18, 23, 44, "#33425e", "#222c42", "#19212f");
    } else if (k === "scaffold") {   // a steel scaffold frame: four posts, cross braces and a plank deck
        const P = _fpP; for (const [a, b] of [[-0.45, -0.45], [0.45, -0.45], [0.45, 0.45], [-0.45, 0.45]]) { const p = P(x + a, y + b, 0), q = P(x + a, y + b, 70); ctx.strokeStyle = "#8a93a6"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
        for (const z of [20, 46]) { const a = P(x - 0.45, y + 0.45, z), b = P(x + 0.45, y + 0.45, z), c = P(x + 0.45, y - 0.45, z); ctx.strokeStyle = "#6e7686"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.lineTo(c[0], c[1]); ctx.stroke(); }
        const a = P(x - 0.45, y + 0.45, 6), b = P(x + 0.45, y + 0.45, 46); ctx.strokeStyle = "#6e7686"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); _fpBox(x - 0.5, y - 0.5, x + 0.5, y + 0.5, 68, 72, "#9a7a4a", "#6a5030", "#54401f");
    } else return false;
    return true;
}
