// SEWER LOOK DRAFTS: the shared layer over the real game (injected after load, before the facility starts). A look file sets window.SL_LOOK first.
// Draft-only: nothing here is in the game. The tunnel (west of the Nest) gets the look; the Nest keeps its own.
// The structure every look shares (the fix for the jutting walls): wall tops drawn as the dark cut, the near walls cut clean as a section (no teeth), the jambs
// of the north wall's side passages showing only their tops, and a lintel over each passage's mouth, so the north wall reads as one wall with openings in it.
(function () {
    const L = window.SL_LOOK || {};
    const ROOM = "sewers", NEST_X = -10.5;
    for (const n of ["drawQuestBox", "drawFacilityNetworkHUD", "drawFloatingTexts", "dialogueDraw", "drawQuestButton", "drawSettingsButton", "drawClonesBlob", "drawTargetUI", "drawLockReticle", "drawRadialMenu", "drawInfoPanel", "drawCloneMenu", "drawPerfReadout"])
        if (typeof window[n] === "function") window[n] = function () {};
    const W = TILE_W, H = TILE_H;
    const SL = window.SL = {
        L, W, H, px: 1 / Math.hypot(W, H), water: new Set(), base: 0, CAP: L.cap || "#0b0d0e",
        rnd: (a, b, k) => { const h = _fpHash(Math.round(a * 8) + (k || 0) * 7919, Math.round(b * 8) - (k || 0) * 104729); return (h % 100000) / 100000; },
        rgba: (hex, a) => _fpRgba(hex, a),
        mix: (h1, h2, t) => { const A = parseInt(h1.slice(1), 16), B = parseInt(h2.slice(1), 16), c = s => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * t); return "#" + ((1 << 24) + (c(16) << 16) + (c(8) << 8) + c(0)).toString(16).slice(1); },
        inTunnel: (x) => x < NEST_X,
    };
    // ── a wall piece's face: u along it 0..1, z up in px; s: the coordinate along the wall (x or y), for patterns that run on across pieces ──
    SL.frame = function (it) {
        const ax = it.a[0], ay = it.a[1], bx = it.b[0], by = it.b[1], dx = bx - ax, dy = by - ay, Ln = Math.hypot(dx, dy) || 1; let nx = dy / Ln, ny = -dx / Ln; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
        const a0 = _fpP(ax, ay, 0), b0 = _fpP(bx, by, 0), X0 = a0[0], Y0 = a0[1], DX = b0[0] - X0, DY = b0[1] - Y0;
        const alongX = Math.abs(dy) < 1e-6, s0 = alongX ? ax : ay, s1 = alongX ? bx : by;
        return { ax, ay, bx, by, nx, ny, X0, Y0, DX, DY, lit: nx > ny, len: Ln, s0, s1, alongX, it,
            P: (u, z) => [X0 + DX * u, Y0 + DY * u - z], U: s => (s - s0) / ((s1 - s0) || 1), S: u => s0 + (s1 - s0) * u };
    };
    SL.quad = function (pts, fill) { ctx.fillStyle = fill; ctx.beginPath(); for (let i = 0; i < pts.length; i++) i ? ctx.lineTo(pts[i][0], pts[i][1]) : ctx.moveTo(pts[0][0], pts[0][1]); ctx.closePath(); ctx.fill(); };
    SL.line = function (p, q, col, w) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
    SL.band = function (f, z0, z1, col, u0, u1) { u0 = u0 === undefined ? -0.02 : u0; u1 = u1 === undefined ? 1.02 : u1; SL.quad([f.P(u0, z0), f.P(u1, z0), f.P(u1, z1), f.P(u0, z1)], col); };
    SL.hline = function (f, z, col, w, u0, u1) { SL.line(f.P(u0 === undefined ? 0 : u0, z), f.P(u1 === undefined ? 1 : u1, z), col, w); };
    SL.vline = function (f, u, z0, z1, col, w) { if (u < -0.001 || u > 1.001) return; SL.line(f.P(u, z0), f.P(u, z1), col, w); };
    // every joint at a multiple of `step` (tiles) along the wall that falls inside this piece: fn(u, index)
    SL.joints = function (f, step, off, fn) { const lo = Math.min(f.s0, f.s1), hi = Math.max(f.s0, f.s1); for (let k = Math.ceil((lo - (off || 0)) / step - 1e-6); k * step + (off || 0) <= hi + 1e-6; k++) { const s = k * step + (off || 0); fn(f.U(s), k); } };
    // things that sit on the wall every `step` tiles (offset `off`), up to `half` tiles either side of their centre: each piece draws its own part of each (clipped to itself)
    SL.each = function (f, step, off, half, fn) {
        const lo = Math.min(f.s0, f.s1), hi = Math.max(f.s0, f.s1), ks = [];
        for (let k = Math.ceil((lo - half - off) / step - 1e-6); k * step + off <= hi + half + 1e-6; k++) ks.push(k);
        if (!ks.length) return;
        ctx.save(); ctx.beginPath(); const q = [f.P(0, -40), f.P(1, -40), f.P(1, 200), f.P(0, 200)]; q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.clip();
        try { for (const k of ks) fn(k * step + off, k); } finally { ctx.restore(); }
    };
    // a rectangle on the face between two positions along the wall (s) and two heights
    SL.rect = function (f, s0, s1, z0, z1, col) { const u0 = Math.max(-0.02, Math.min(1.02, f.U(s0))), u1 = Math.max(-0.02, Math.min(1.02, f.U(s1))); if (Math.abs(u1 - u0) < 1e-4) return; SL.band(f, z0, z1, col, Math.min(u0, u1), Math.max(u0, u1)); };
    // the top of a wall: the dark cut, t tiles thick (out: -1 away from the camera, +1 towards it), a thin lit edge along the face
    SL.slab = function (f, Hd, out, t, col, edge) {
        const e = 0.02, mx = f.nx * (out || -1), my = f.ny * (out || -1), ux = (f.bx - f.ax) / f.len * e, uy = (f.by - f.ay) / f.len * e;
        const Q = (x, y) => _fpP(x, y, Hd), p0 = Q(f.ax - ux, f.ay - uy), p1 = Q(f.bx + ux, f.by + uy), p2 = Q(f.bx + ux + mx * t, f.by + uy + my * t), p3 = Q(f.ax - ux + mx * t, f.ay - uy + my * t);
        SL.quad([p0, p1, p2, p3], col || SL.CAP); if (edge) SL.line(p0, p1, edge, 1.5);
        return [p0, p1, p2, p3];
    };
    // a horizontal pipe run along the face at height z (px), radius r (px): a lit top stripe, a body, a shaded underside; flanges every `fl` tiles
    SL.pipe = function (f, z, r, body, lit, dark, fl, flCol) {
        SL.band(f, z - r, z + r, body); SL.band(f, z + r * 0.25, z + r * 0.8, lit); SL.band(f, z - r, z - r * 0.45, dark);
        if (fl) SL.joints(f, fl, 0.25, u => { const w = 0.05 / Math.max(0.1, f.len); SL.band(f, z - r - 1.5, z + r + 1.5, flCol || dark, u - w, u + w); SL.vline(f, u - w, z - r - 1.5, z + r + 1.5, lit, 1); });
    };
    // a lamp on the wall at s, z: a bracket, a lens and its glow on the wall
    SL.lamp = function (f, s, z, col, w, h) {
        const u = f.U(s); w = w || 0.12; h = h || 8; const du = w / Math.max(0.1, f.len) / 2;
        const g0 = f.P(u, z); const rg = ctx.createRadialGradient(g0[0], g0[1], 1, g0[0], g0[1], 46); rg.addColorStop(0, SL.rgba(col, 0.32)); rg.addColorStop(1, SL.rgba(col, 0));
        ctx.fillStyle = rg; ctx.beginPath(); ctx.arc(g0[0], g0[1], 46, 0, 6.2832); ctx.fill();
        SL.band(f, z - h / 2 - 2, z + h / 2 + 2, "#1b1d1f", u - du - 0.02, u + du + 0.02); SL.band(f, z - h / 2, z + h / 2, col, u - du, u + du); SL.hline(f, z + h / 2 - 1, "rgba(255,255,255,0.8)", 1, u - du, u + du);
    };
    // text on the wall's plane, centred at s, z
    SL.text = function (f, s, z, str, size, col, font) {
        const u = f.U(s); if (u < -0.3 || u > 1.3) return; const p = f.P(u, z), L2 = Math.hypot(f.DX, f.DY) || 1;
        ctx.save(); ctx.translate(p[0], p[1]); ctx.transform(f.DX / L2, f.DY / L2, 0, 1, 0, 0); ctx.font = (font || "bold ") + size + "px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = col; ctx.fillText(str, 0, 0); ctx.restore();
    };
    // ── floor helpers: in a tile's own (u, v) frame (u along x, v along y, -0.5..0.5); world = tile + (u, v) ──
    SL.fl = {
        // grid lines in world coordinates: every `step` tiles (offset `off`), along x (lines of constant x) and/or y
        grid(g, x, y, step, off, col, w, axis, stepY) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); const sy = stepY || step;
            if (axis !== "y") for (let k = Math.ceil((x - 0.6 - off) / step); k * step + off <= x + 0.6; k++) { const u = k * step + off - x; g.moveTo(u, -0.6); g.lineTo(u, 0.6); }
            if (axis !== "x") for (let k = Math.ceil((y - 0.6 - off) / sy); k * sy + off <= y + 0.6; k++) { const v = k * sy + off - y; g.moveTo(-0.6, v); g.lineTo(0.6, v); }
            g.stroke(); },
        // the cells of a grid (sx by sy tiles, rows shifted by `shift` of a cell) that touch this tile: fn(u0, v0, u1, v1, i, j) in the tile's frame
        cells(x, y, sx, sy, shift, fn) { const j0 = Math.floor((y - 0.6) / sy), j1 = Math.floor((y + 0.6) / sy);
            for (let j = j0; j <= j1; j++) { const o = (shift || 0) * sx * (((j % 2) + 2) % 2), i0 = Math.floor((x - 0.6 - o) / sx), i1 = Math.floor((x + 0.6 - o) / sx);
                for (let i = i0; i <= i1; i++) fn(i * sx + o - x, j * sy - y, (i + 1) * sx + o - x, (j + 1) * sy - y, i, j); } },
        // a strip along one side of the tile, `w` tiles wide, where that side meets `kind` (water, wall)
        strip(g, side, w, col, inset) { const a = -0.5 + (inset || 0); g.fillStyle = col;
            if (side === "n") g.fillRect(-0.6, a, 1.2, w); else if (side === "s") g.fillRect(-0.6, -a - w, 1.2, w); else if (side === "w") g.fillRect(a, -0.6, w, 1.2); else g.fillRect(-a - w, -0.6, w, 1.2); },
        // a line along one side, `d` in from the edge
        side(g, side, d, col, w) { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); const a = -0.5 + d;
            if (side === "n") { g.moveTo(-0.6, a); g.lineTo(0.6, a); } else if (side === "s") { g.moveTo(-0.6, -a); g.lineTo(0.6, -a); } else if (side === "w") { g.moveTo(a, -0.6); g.lineTo(a, 0.6); } else { g.moveTo(-a, -0.6); g.lineTo(-a, 0.6); } g.stroke(); },
        dot(g, u, v, r, col) { g.fillStyle = col; g.beginPath(); g.arc(u, v, r, 0, 6.2832); g.fill(); },
    };
    // ── which cells are water ──
    function waterCells(F) { for (const s of F.solids) if (s.water && s.poly) { const xs = s.poly.map(p => p[0]), ys = s.poly.map(p => p[1]); for (let x = Math.round(Math.min(...xs) + 0.5); x <= Math.round(Math.max(...xs) - 0.5); x++) for (let y = Math.round(Math.min(...ys) + 0.5); y <= Math.round(Math.max(...ys) - 0.5); y++) SL.water.add(x + "," + y); } }
    SL.kindAt = function (x, y) { const k = x + "," + y; if (_fp.cells.has(k)) { const r = facilityRoomAt(x, y, _fp.F); return r && r.id === ROOM ? "floor" : "other"; } return SL.water.has(k) ? "water" : "wall"; };
    // ── the floor: the look's tile under the decals, the lights and the edges' shade ──
    const origFloorFor = _fpStyleFloorFor;
    _fpStyleFloorFor = function (id) { if (id !== ROOM || !L.floor) return origFloorFor(id); const o = origFloorFor(id);   // (the Nest keeps its own marks; the tunnel's base is made clear below, SL.restyle)
        return { base: o.base, alt: null, a: 1, ao: L.ao === undefined ? 0.8 : L.ao, mark: (h, ops, x, y) => { if (!SL.inTunnel(x)) o.mark(h, ops, x, y); } }; };
    const tileSpr = new Map();
    const origFloorOn = facilityDrawFloorOn;
    facilityDrawFloorOn = function (obj, px, py) {
        if (obj.room === ROOM && !obj.deck && L.floor && SL.inTunnel(obj.x)) {
            const key = obj.x + "," + obj.y; let spr = tileSpr.get(key); const EX = 3, EY = 2;
            if (!spr) {
                spr = document.createElement("canvas"); spr.width = W * 2 + 2 + EX * 2; spr.height = H * 2 + 2 + EY * 2; const g = spr.getContext("2d"), mx = W + 1 + EX, my = H + 1 + EY;
                g.beginPath(); g.moveTo(mx, my - H - EY); g.lineTo(mx + W + EX, my); g.lineTo(mx, my + H + EY); g.lineTo(mx - W - EX, my); g.closePath(); g.clip();
                g.save(); g.transform(W, H, -W, H, mx, my); g.lineCap = "butt";
                const nb = { n: SL.kindAt(obj.x, obj.y - 1), s: SL.kindAt(obj.x, obj.y + 1), w: SL.kindAt(obj.x - 1, obj.y), e: SL.kindAt(obj.x + 1, obj.y) };
                try { L.floor(g, obj.x, obj.y, nb); } catch (e) { console.log("floor", e && e.message); }
                g.restore(); tileSpr.set(key, spr);
            }
            ctx.drawImage(spr, px - W - 1 - EX, py - 1 - EY);
        }
        return origFloorOn(obj, px, py);
    };
    // ── the walls ──
    const jambMaxY = 107.5;   // the north wall's main line (sketch y 860): a near wall running north-south north of it is a side passage's jamb, inside the wall's mass
    SL.isJamb = it => Math.abs(it.a[0] - it.b[0]) < 1e-6 && Math.max(it.a[1], it.b[1]) <= jambMaxY + 1e-6;
    SL.inTunnelWall = it => Math.max(it.a[0], it.b[0]) <= NEST_X + 1e-6 || (Math.abs(it.a[0] - it.b[0]) < 1e-6 && it.a[0] <= NEST_X + 1e-6);
    const origWall = _fpStyleWall;
    _fpStyleWall = function (it, Hd) {
        if (it.room !== ROOM || !L.wall || !SL.inTunnelWall(it)) return origWall(it, Hd);
        const f = SL.frame(it);
        if (it.out === 1) { if (SL.isJamb(it)) SL.slab(f, Hd, 1, 1.0, SL.CAP, null); return; }   // a near wall: cut as a section by the look's items (below); a passage's jamb: only its top
        SL.slab(f, Hd, -1, 1.0, SL.CAP, L.capEdge || "rgba(150,160,160,0.35)");
        L.wall(f, Hd, it);
    };
    // ── the look's own items, in the draw order with everything else ──
    const origItem = drawFacilityItem;
    drawFacilityItem = function (it) {
        if (it.fp !== "look") return origItem(it);
        _fpBase = it.base || 0; const real = ctx, lv = typeof _fpRoomLight === "function" && _fp.light ? _fpRoomLight(ROOM) : 1;
        if (lv < 0.98) ctx = _fpDimCtx(real, 1 - _fpDarkAmt() * (1 - lv));
        ctx.save(); try { it.draw(it); } catch (e) { console.log("item", e && e.message); } finally { ctx.restore(); ctx = real; }
    };
    // the near wall cut as a section: the dark cut on top, flush with the floor, and the outer face below it, in the look's material
    SL.near = function (f, it) {
        const t = L.nearT || 0.45, h = L.nearH || 0, D = 120, ox = f.nx * t, oy = f.ny * t;
        const iA = _fpP(f.ax, f.ay, h), iB = _fpP(f.bx, f.by, h), oA = _fpP(f.ax + ox, f.ay + oy, h), oB = _fpP(f.bx + ox, f.by + oy, h);
        const fo = SL.frame({ a: [f.ax + ox, f.ay + oy], b: [f.bx + ox, f.by + oy] });
        if (L.nearFace) L.nearFace(fo, h, -D); else SL.band(fo, -D, h, "#16191a");
        const gr = ctx.createLinearGradient(0, fo.Y0 - h, 0, fo.Y0 + D); gr.addColorStop(0, "rgba(0,0,0,0)"); gr.addColorStop(0.55, "rgba(0,0,0,0.35)"); gr.addColorStop(1, "rgba(0,0,0,1)");
        ctx.fillStyle = gr; ctx.beginPath(); const q = [fo.P(-0.02, h), fo.P(1.02, h), fo.P(1.02, -D), fo.P(-0.02, -D)]; q.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill();
        SL.quad([iA, iB, oB, oA], SL.CAP);
        SL.line(iA, iB, L.nearEdge || "rgba(170,180,180,0.45)", 1.4); SL.line(oA, oB, L.nearEdge2 || "rgba(170,180,180,0.25)", 1);
    };
    SL.addItems = function () {
        const F = _fp.F; waterCells(F); SL.base = facilityRoomHeight(ROOM, F) * FP_ELEV_PX; const items = [];
        const push = (o) => { o.type = "fp"; o.fp = "look"; o.base = SL.base; items.push(o); };
        for (const w of F.walls) {
            if (w.room !== ROOM || w.kind !== "wall" || !L.wall) continue; if (_fpWallOut(w, w.a, w.b, F) !== 1) continue; const it0 = { a: w.a, b: w.b }; if (SL.isJamb(it0) || !SL.inTunnelWall(it0)) continue;
            const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], len = Math.hypot(dx, dy), n = Math.max(1, Math.round(len));
            for (let i = 0; i < n; i++) { const a = [w.a[0] + dx * i / n, w.a[1] + dy * i / n], b = [w.a[0] + dx * (i + 1) / n, w.a[1] + dy * (i + 1) / n];
                const f0 = SL.frame({ a, b }), t = L.nearT || 0.45; push({ kind: "near", a, b, x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, depth: (a[0] + b[0]) / 2 + (a[1] + b[1]) / 2 + (f0.nx + f0.ny) * t + 0.05, draw: it => SL.near(SL.frame(it), it) }); }
        }
        if (L.lintel) for (const [x0, x1] of SL.mouths) push({ kind: "lintel", x0, x1, y0: jambMaxY, x: (x0 + x1) / 2, y: jambMaxY, span: true, bb: [x0, jambMaxY - 1, x1, jambMaxY + 1], depth: x1 + jambMaxY + 0.15,
            draw: it => { const f = SL.frame({ a: [it.x0, it.y0], b: [it.x1, it.y0] }); SL.slab(f, FP_WALL_H, -1, 1.0, SL.CAP, L.capEdge || "rgba(150,160,160,0.35)"); L.lintel(f, FP_WALL_H, it); } });
        if (L.items) for (const o of L.items(F)) push(o);
        _fp.items.push(...items); SL.items = items;
    };
    SL.mouths = [[-48.5, -46.5], [-45.5, -43.5], [-41.5, -35.5], [-33.5, -28.5], [-22.5, -16.5]];
    SL.restyle = function () {
        if (L.style) Object.assign(FP_ROOM_STYLE[ROOM], L.style);
        if (L.water) Object.assign(FP_SEWER, L.water);
        if (!L.floor) return;
        _fp.floorOps = _fpFloorBuild(_fp.F);   // (the facility was built once already as the page loaded, before the look: built again with it)
        if (_fp.spr) for (const key of Array.from(_fp.spr.keys())) _fpSprDrop(key);
        for (const [key, ops] of _fp.floorOps) { const [x, y] = key.split(",").map(Number), r = facilityRoomAt(x, y, _fp.F); if (!r || r.id !== ROOM || !SL.inTunnel(x)) continue;
            if (ops[0] && ops[0].t === "D") ops[0] = Object.assign({}, ops[0], { c: "rgba(0,0,0,0)" }); }
    };
})();
