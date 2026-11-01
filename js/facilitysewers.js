// ─────────────────────────────────────────────────────────
//  THE SEWERS: their drawing (the map is js/facilitymap.js: the room `sewers`, its solids, its decor; docs/FACILITY.md "The Sewers")
// ─────────────────────────────────────────────────────────
// ASKED: "make it look like the little liquid holding tanks have some sort of runoff into the sewers [...] make the sewers another location as well, that have a deep sort of river that cuts across two narrow
// paths, with room to have more areas later and a boss fight, and make it also have cut off entrances with gated areas." Chosen with the user: in the arena, the subtle little OVERFLOW GRATES where the tanks'
// pipes go into the floor (no words on the floor) and an arched SEWER CULVERT in the north rock as the way down; below, layout A (two narrow ledges, the deep river between them), empty for now.
//   - THE WATER (solids of kind `river` and `pool`): the tanks' violet runoff, sunk below the ledges, flowing east from the outfall at its head into the cistern's sump. Nothing walks in it. It is drawn first of
//     everything in its room (one item, depth far below the rest): the ledges' tiles, the bridge, the walls and anyone standing about are all drawn over it, and the near ledge's edge hides its last few pixels.
//   - THE BRIDGE (decor `bridge_deck`): its floor tiles are a steel grating with nothing under them (js/facilitydecor.js), so the water shows through; rails either side. The BROKEN BRIDGE (`bridge_broken`): a
//     bent stump on each bank over the water, the middle gone.
//   - THE GATES (solids of kind `gate`, `boss_gate`): barred grilles standing on the line of the wall they close. Shut for now.
//   - On the walls: the CULVERT (a portal door with `culvert`), the OUTFALL, the COLLAPSED tunnel and the SEALED HATCH. In the arena: the OVERFLOW GRATES.
// Everything here is the look only: the map (collision, navigation) is the solids and the room's outline.

const FP_SEWER = { sink: 12, poolSink: 20, violet: "#a64dff", deep: "#3a1670", gateH: 104 };
const FP_WATER_KINDS = new Set(["river", "pool"]);

// the tiles a rectangle on the grid covers: those whose middles are inside it (a bridge's grating)
function facilityRectCells(r) { const out = []; for (let x = Math.round(r[0] + 0.5); x <= Math.round(r[2] - 0.5); x++) for (let y = Math.round(r[1] + 0.5); y <= Math.round(r[3] - 0.5); y++) out.push(x + "," + y); return out; }
// the items: the water (one per room that has any), the bridge's rails, the broken bridge's stumps, the gates, the arena's overflow grates
function facilitySewerItems(F) {
    const items = [], base = r => facilityRoomHeight(r, F) * FP_ELEV_PX;
    const byRoom = new Map(); for (const s of F.solids) if (FP_WATER_KINDS.has(s.kind)) { if (!byRoom.has(s.room)) byRoom.set(s.room, []); byRoom.get(s.room).push(s); }
    for (const [room, list] of byRoom) {
        const bb = [Infinity, Infinity, -Infinity, -Infinity]; for (const s of list) { bb[0] = Math.min(bb[0], s.bb[0]); bb[1] = Math.min(bb[1], s.bb[1]); bb[2] = Math.max(bb[2], s.bb[2]); bb[3] = Math.max(bb[3], s.bb[3]); }
        items.push({ type: "fp", fp: "sewer", what: "water", room, base: base(room), x: (bb[0] + bb[2]) / 2, y: (bb[1] + bb[3]) / 2, bb, depth: -1e6, span: true, ...facilityWaterShape(list) });
    }
    for (const d of (F.decor || [])) {
        const k = d.kind;
        if (k === "bridge_deck" && d.rect) {   // the rails along the deck's two long sides, a piece a tile long each (drawn among the people on the bridge)
            const r = d.rect, along = (r[3] - r[1]) >= (r[2] - r[0]);
            if (along) for (let y = r[1]; y < r[3] - 1e-6; y += 1) for (const [x, side] of [[r[0], -1], [r[2], 1]]) items.push({ type: "fp", fp: "sewer", what: "rail", room: d.room, base: base(d.room), x, y: y + 0.5, a: [x, y], b: [x, Math.min(y + 1, r[3])], side, depth: x + y + 0.5 + (side > 0 ? 0.6 : -0.6) });
            else for (let x = r[0]; x < r[2] - 1e-6; x += 1) for (const [y, side] of [[r[1], -1], [r[3], 1]]) items.push({ type: "fp", fp: "sewer", what: "rail", room: d.room, base: base(d.room), x: x + 0.5, y, a: [x, y], b: [Math.min(x + 1, r[2]), y], side, depth: x + y + 0.5 + (side > 0 ? 0.6 : -0.6) });
        } else if (k === "bridge_broken" && d.rect) {   // a stump on each bank: the end that is still standing, bent down where it broke
            const r = d.rect, L = Math.min(1.7, (r[3] - r[1]) * 0.3);
            items.push({ type: "fp", fp: "sewer", what: "stump", room: d.room, base: base(d.room), x: (r[0] + r[2]) / 2, y: r[1] + L / 2, rect: [r[0], r[1], r[2], r[1] + L], dir: 1, depth: r[2] + r[1] + L + 0.05, seed: _fpHash(Math.round(r[0] * 3), Math.round(r[1] * 3)) });
            items.push({ type: "fp", fp: "sewer", what: "stump", room: d.room, base: base(d.room), x: (r[0] + r[2]) / 2, y: r[3] - L / 2, rect: [r[0], r[3] - L, r[2], r[3]], dir: -1, depth: r[2] + r[3] + 0.05, seed: _fpHash(Math.round(r[2] * 3), Math.round(r[3] * 3)) });
        } else if (k === "overflow_grate" && d.at) {   // the arena's: the grate in the floor (a piece in each tile it lies over, so the floor never covers it), the sight glass on the pipe, a breath of violet mist
            const h = 0.45, e = h + 0.12, x0 = d.at[0] - e, y0 = d.at[1] - e, x1 = d.at[0] + e, y1 = d.at[1] + e;   // (e: to the frame's outer edge)
            for (let x = Math.round(x0); x <= Math.round(x1); x++) for (let y = Math.round(y0); y <= Math.round(y1); y++) items.push({ type: "fp", fp: "sewer", what: "grate", room: d.room, base: base(d.room), x, y, at: d.at, h, cell: [x, y], depth: x + y + 0.004 });
            if (d.pipe && d.glass) items.push({ type: "fp", fp: "sewer", what: "glass", room: d.room, base: base(d.room), x: d.pipe[0], y: d.pipe[1], at: d.pipe, glass: d.glass, depth: d.pipe[0] + d.pipe[1] + 1.5 });
            items.push({ type: "fp", fp: "sewer", what: "mist", room: d.room, base: base(d.room), x: d.at[0], y: d.at[1], at: d.at, r: h, depth: d.at[0] + d.at[1] + 0.9 });
        } else if ((k === "egg_cluster" || k === "junk") && d.at) {   // THE NEST: eggs, or the dam's junk, a piece at a time (so each sorts with whoever walks among them), on floor only
            const n = d.n || 5, R = d.radius || 0.8, seed = _fpHash(Math.round(d.at[0] * 7), Math.round(d.at[1] * 7));
            for (let i = 0; i < n; i++) {
                const a = _fpSwHash(seed % 997 + i * 3.1) * 6.2832, rr = Math.sqrt(_fpSwHash(seed % 991 + i * 7.7)) * R, x = d.at[0] + Math.cos(a) * rr, y = d.at[1] + Math.sin(a) * rr;
                if (!facilityFloorAt(x, y, F)) continue;
                items.push({ type: "fp", fp: "sewer", what: k === "junk" ? "junk" : "egg", room: d.room, base: base(d.room), x, y, s: k === "junk" ? 0.22 + _fpSwHash(seed % 983 + i) * 0.16 : 0.13 + _fpSwHash(seed % 983 + i) * 0.07, seed: (seed % 9973) + i * 17, depth: x + y + 0.04 });
            }
        } else if (k === "falls" && d.a && d.b) {   // THE WATERFALL: the moat spilling over the Nest's east edge (on the line of the spill lip nearest it), a tile of it at a time, drawn after the lip
            const vert = Math.abs(d.b[0] - d.a[0]) < Math.abs(d.b[1] - d.a[1]), lip = F.walls.filter(w => w.kind === "spill" && (vert ? Math.abs(w.a[0] - w.b[0]) < 1e-6 : Math.abs(w.a[1] - w.b[1]) < 1e-6)).sort((p, q) => (vert ? Math.abs(p.a[0] - d.a[0]) - Math.abs(q.a[0] - d.a[0]) : Math.abs(p.a[1] - d.a[1]) - Math.abs(q.a[1] - d.a[1])))[0];
            let A = d.a, B = d.b; if (lip) { if (vert) { A = [lip.a[0], d.a[1]]; B = [lip.a[0], d.b[1]]; } else { A = [d.a[0], lip.a[1]]; B = [d.b[0], lip.a[1]]; } }   // (the decor itself is left as it is: it is checked inside its room)
            const L = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.round(L));
            for (let k2 = 0; k2 < n; k2++) { const p0 = [A[0] + (B[0] - A[0]) * k2 / n, A[1] + (B[1] - A[1]) * k2 / n], p1 = [A[0] + (B[0] - A[0]) * (k2 + 1) / n, A[1] + (B[1] - A[1]) * (k2 + 1) / n];
                items.push({ type: "fp", fp: "sewer", what: "falls", room: d.room, base: base(d.room), x: (p0[0] + p1[0]) / 2, y: (p0[1] + p1[1]) / 2, a: p0, b: p1, i: k2, n, depth: Math.max(p0[0] + p0[1], p1[0] + p1[1]) + 2.2 }); }
        }
    }
    // THE DAM'S RIM: compacted trash along every edge where the Nest's floor drops into the reservoir or the moat (FP_DAM_POOLS), a piece every half tile; where the water side faces the camera, its face runs down into the water
    for (const s of F.solids) if (FP_DAM_POOLS.has(s.id) && s.poly) {
        const P = s.poly;
        for (let i = 0; i < P.length; i++) {
            const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1e-6) continue;
            const ux = (b[0] - a[0]) / L, uy = (b[1] - a[1]) / L; let wx = -uy, wy = ux; if (!facilityPointInPoly((a[0] + b[0]) / 2 + wx * 0.2, (a[1] + b[1]) / 2 + wy * 0.2, P)) { wx = -wx; wy = -wy; }   // (w: from the floor into the water)
            const n = Math.max(1, Math.round(L * 2));
            for (let k2 = 0; k2 < n; k2++) { const t = (k2 + 0.5) / n, x = a[0] + (b[0] - a[0]) * t, y = a[1] + (b[1] - a[1]) * t; if (!facilityFloorAt(x - wx * 0.7, y - wy * 0.7, F)) continue;   // (only where floor meets it)
                const face = wx + wy > 0.01; items.push({ type: "fp", fp: "sewer", what: "rim", room: s.room, base: base(s.room), x, y, u: [ux, uy], w: [wx, wy], half: L / n / 2, face, seed: _fpHash(Math.round(x * 9), Math.round(y * 9)), depth: x + y + (face ? 0.45 : 0.02) }); }
        }
    }
    for (const s of F.solids) if (s.kind === "gate" || s.kind === "boss_gate") {   // a gate: on the long middle line of its thin outline
        const xs = s.poly.map(q => q[0]), ys = s.poly.map(q => q[1]), x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys), alongX = x1 - x0 >= y1 - y0;
        const a = alongX ? [x0, (y0 + y1) / 2] : [(x0 + x1) / 2, y0], b = alongX ? [x1, (y0 + y1) / 2] : [(x0 + x1) / 2, y1];
        items.push({ type: "fp", fp: "sewer", what: "gate", room: s.room, base: base(s.room), x: (a[0] + b[0]) / 2, y: (a[1] + b[1]) / 2, a, b, boss: s.kind === "boss_gate", id: s.id, depth: Math.max(a[0] + a[1], b[0] + b[1]) + 0.03, seed: _fpHash(Math.round(a[0] * 3), Math.round(a[1] * 3)) });
    }
    return items;
}
// the water's outline: the river's band (from the west end of the westmost length to the east end of the eastmost: the bridges' gaps are water too, under the grating), the round pools, and the POOLS OF ANY
// OUTLINE (the Nest's reservoir and moat, 2026-11-01): each with the banks the camera sees (its edges whose inside faces +x / +y, but not where other water lies beyond the edge) and the way it flows
const FP_DAM_POOLS = new Set(["nest_reservoir", "nest_moat"]);   // the water the Nest's trash dam stands in: its rim runs along every edge of them that floor drops into
const FP_POOL_FLOW = { nest_reservoir: [0.35, 1], nest_moat: [1, 0] };   // (the reservoir runs south from the arch's stream and the river's mouth; the moat east, to the falls)
function facilityWaterShape(list) {
    const rivers = list.filter(s => s.kind === "river" && s.poly), pools = list.filter(s => s.kind === "pool" && s.shape === "circle"), polys = list.filter(s => s.kind === "pool" && s.shape !== "circle" && s.poly);
    let band = null; if (rivers.length) { const xs = rivers.flatMap(s => s.poly.map(q => q[0])), ys = rivers.flatMap(s => s.poly.map(q => q[1])); band = [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
    const wet = (x, y, self) => list.some(s => s !== self && (s.shape === "circle" ? Math.hypot(x - s.at[0], y - s.at[1]) < s.r : !!s.poly && facilityPointInPoly(x, y, s.poly)));
    return { band, pools: pools.map(p => ({ at: p.at.slice(), r: p.r })), polys: polys.map(s => _fpWaterPoly(s, wet)) };
}
function _fpWaterPoly(s, wet) {
    const P = s.poly, banks = [];
    for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length], dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy); if (L < 1e-6) continue;
        let nx = -dy / L, ny = dx / L; if (!facilityPointInPoly((a[0] + b[0]) / 2 + nx * 0.2, (a[1] + b[1]) / 2 + ny * 0.2, P)) { nx = -nx; ny = -ny; }   // (the normal into the water)
        if (nx + ny <= 0.01) continue;   // a bank facing away from the camera: not seen
        const n = Math.max(1, Math.round(L * 2)); let run = null;   // (half-tile steps: no bank where more water lies beyond the edge, the river running in)
        for (let k = 0; k <= n; k++) { const t = k / n, x = a[0] + dx * t, y = a[1] + dy * t, open = k < n && !wet(x + dx / L * 0.25 - nx * 0.3, y + dy / L * 0.25 - ny * 0.3, s);
            if (open && !run) run = [x, y]; else if (!open && run) { banks.push([run, [x, y], nx, ny]); run = null; } }
        if (run) banks.push([run, [b[0], b[1]], nx, ny]);
    }
    const fl = FP_POOL_FLOW[s.id] || [0, 1], fL = Math.hypot(fl[0], fl[1]) || 1;
    return { id: s.id, poly: P.map(q => q.slice()), bb: s.bb.slice(), banks, flow: [fl[0] / fL, fl[1] / fL] };
}
// is a long item on the screen (its whole box, not its middle)
function _fpSpanVisible(it) {
    const b = it.bb, cx = player.visualX, cy = player.visualY, sx0 = (b[0] - b[3] - (cx - cy)) * TILE_W + canvas.width / 2, sx1 = (b[2] - b[1] - (cx - cy)) * TILE_W + canvas.width / 2;
    const sy0 = (b[0] + b[1] - (cx + cy)) * TILE_H + canvas.height / 2 - 200, sy1 = (b[2] + b[3] - (cx + cy)) * TILE_H + canvas.height / 2 + 200;
    return sx1 > -120 && sx0 < canvas.width + 120 && sy1 > -120 && sy0 < canvas.height + 120;
}
function facilitySewerDraw(it) {
    const f = _fpFrame();
    if (it.what === "water") _fpSewerWater(it, f); else if (it.what === "rail") _fpSewerRail(it); else if (it.what === "stump") _fpSewerStump(it, f);
    else if (it.what === "gate") _fpSewerGate(it, f); else if (it.what === "grate") _fpOverflowGrate(it, f); else if (it.what === "glass") _fpSightGlass(it, f); else if (it.what === "mist") _fpSewerMist(it, f);
    else if (it.what === "egg") _fpNestEgg(it, f); else if (it.what === "junk") _fpNestJunk(it, f); else if (it.what === "rim") _fpNestRim(it, f); else if (it.what === "falls") _fpNestFalls(it, f);
}
const _fpSwLine = (p, q) => { ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
const _fpSwPath = (pts) => { ctx.beginPath(); pts.forEach((q, i) => i ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1])); };
const _fpSwHash = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };
// THE WATER'S COLOUR: the violet runoff, clearing to a cold blue-green as the purification module's cycle runs (js/quests.js questWaterClean: 0 foul, 1 clean). The river, the sump and their glow clear;
// the outfall's pour, the arena's grates and the tanks' sight glasses stay violet: the tanks still leak what they leak, the module cleans what is down here.
const FP_SEWER_CLEAN = { "#6b2cc4": "#2a8aa8", "#4a1f8c": "#1f6079", "#2c1660": "#143d4f", "#8a46e0": "#3aa6c4", "#3c1878": "#1d5b72", "#1c0c38": "#0f2f3d", "#a64dff": "#4fd0e8" };
function _fpSwClean() { return typeof questWaterClean === "function" ? questWaterClean() : 0; }
function _fpSwCol(hex) { const t = _fpSwClean(), to = FP_SEWER_CLEAN[hex]; if (!(t > 0) || !to) return hex; const A = parseInt(hex.slice(1), 16), B = parseInt(to.slice(1), 16), ch = s => Math.round(((A >> s) & 255) + (((B >> s) & 255) - ((A >> s) & 255)) * t); return "rgb(" + ch(16) + "," + ch(8) + "," + ch(0) + ")"; }
function _fpSwRgba(foul, clean, a) { const t = _fpSwClean(), c = foul.map((v, i) => Math.round(v + (clean[i] - v) * (t > 0 ? t : 0))); return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")"; }

// ── THE WATER: the far banks (the faces the camera sees, going down to it), its surface sunk below the ledges, the current, the sump's slow swirl, a violet glow ──
function _fpSewerWater(it, f) {
    const P = _fpP, S = FP_SEWER.sink, low = typeof gfxLow !== "undefined" && gfxLow, B = it.band;
    const circ = (cx, cy, r, z, a0, a1, n) => { const o = []; n = n || 40; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; o.push(P(cx + Math.cos(a) * r, cy + Math.sin(a) * r, z)); } return o; };
    // the far banks: the river's north side, its head (west end), the back half of each pool's wall
    if (B) {
        const x0 = B[0], x1 = B[2], y0 = B[1];
        _fpQuad([P(x0, y0, 0), P(x1, y0, 0), P(x1, y0, -S), P(x0, y0, -S)], "#1d2422", null);
        _fpQuad([P(x0, y0, 0), P(x0, B[3], 0), P(x0, B[3], -S), P(x0, y0, -S)], "#161c1b", null);
        ctx.strokeStyle = "rgba(170,140,220,0.35)"; ctx.lineWidth = 1.2; _fpSwLine(P(x0, y0, -S + 3), P(x1, y0, -S + 3));   // a tide mark
    }
    for (const p of it.pools) { const R = _fpRoomStyle(it.room); _fpQuad(circ(p.at[0], p.at[1], p.r + 0.75, 0, 0, Math.PI * 2, 48), R.fa || "#47504c", null); ctx.strokeStyle = "rgba(205,212,220,0.6)"; ctx.lineWidth = 2; _fpSwPath(circ(p.at[0], p.at[1], p.r, 0, 0, Math.PI * 2, 48)); ctx.stroke(); }   // the floor's rim round a pool (the square tiles leave its corners bare against the round edge), and the lit lip
    for (const p of it.pools) { const D = FP_SEWER.poolSink, top = circ(p.at[0], p.at[1], p.r, 0, Math.PI * 0.75, Math.PI * 1.75), bot = circ(p.at[0], p.at[1], p.r, -D, Math.PI * 1.75, Math.PI * 0.75); _fpQuad(top.concat(bot), "#1a1f1e", null); }
    for (const W of it.polys || []) for (const [a, b, nx, ny] of W.banks) { _fpQuad([P(a[0], a[1], 0), P(b[0], b[1], 0), P(b[0], b[1], -S), P(a[0], a[1], -S)], ny >= nx ? "#1d2422" : "#161c1b", null); ctx.strokeStyle = "rgba(170,140,220,0.3)"; ctx.lineWidth = 1.1; _fpSwLine(P(a[0], a[1], -S + 3), P(b[0], b[1], -S + 3)); }   // an outlined pool's far banks, a tide mark
    // the surface: deep violet, lighter down the middle of the current (clearing to a cold blue-green as the purification module runs: _fpSwCol)
    const g0 = B ? P(B[0], B[1], -S) : null, g1 = B ? P(B[2], B[1], -S) : null;
    if (B) {
        const gr = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]); gr.addColorStop(0, _fpSwCol("#6b2cc4")); gr.addColorStop(0.35, _fpSwCol("#4a1f8c")); gr.addColorStop(1, _fpSwCol("#2c1660"));
        _fpQuad([P(B[0], B[1], -S), P(B[2], B[1], -S), P(B[2], B[3], -S), P(B[0], B[3], -S)], gr, null);
        const m0 = B[1] + (B[3] - B[1]) * 0.32, m1 = B[1] + (B[3] - B[1]) * 0.68; _fpQuad([P(B[0], m0, -S), P(B[2], m0, -S), P(B[2], m1, -S), P(B[0], m1, -S)], _fpSwRgba([176, 104, 255], [140, 225, 240], 0.16), null);
    }
    // the current: flecks of light drifting east, in lanes, only those on the screen
    if (B) {
        const len = B[2] - B[0], W = B[3] - B[1], lanes = low ? 3 : 6, sp = 0.012;
        ctx.lineCap = "round";
        for (let l = 0; l < lanes; l++) {
            const y = B[1] + W * (l + 0.5) / lanes, gap = 0.9 + _fpSwHash(l) * 0.5, n = Math.ceil(len / gap) + 1;
            for (let k = 0; k < n; k++) {
                const x = B[0] + ((k * gap + _fpSwHash(l * 7 + k) * 0.4 + f * sp * (1 + 0.3 * Math.sin(l))) % (len + gap)) - gap * 0.5; if (x < B[0] || x > B[2]) continue;
                const a = P(x, y, -S), b = P(Math.min(B[2], x + 0.3 + _fpSwHash(k + l) * 0.25), y, -S); if (a[0] < -40 || a[0] > canvas.width + 40 || a[1] < -40 || a[1] > canvas.height + 40) continue;
                ctx.strokeStyle = "rgba(226,200,255," + (0.22 + _fpSwHash(k * 1.7 + l) * 0.4).toFixed(2) + ")"; ctx.lineWidth = 1 + _fpSwHash(k + l * 3); _fpSwLine(a, b);
            }
        }
    }
    for (const W of it.polys || []) _fpSewerPolyWater(W, f, low);
    for (const p of it.pools) { const D = FP_SEWER.poolSink, c = P(p.at[0], p.at[1], -D), e = P(p.at[0] + p.r, p.at[1] - p.r, -D), R = Math.abs(e[0] - c[0]) * 1.1, g = ctx.createRadialGradient(c[0], c[1], 2, c[0], c[1], R); g.addColorStop(0, _fpSwCol("#8a46e0")); g.addColorStop(0.55, _fpSwCol("#3c1878")); g.addColorStop(1, _fpSwCol("#1c0c38")); _fpQuad(circ(p.at[0], p.at[1], p.r, -D, 0, Math.PI * 2), g, null); }
    // the sump: slow arcs going round and down
    for (const p of it.pools) { const D = FP_SEWER.poolSink; for (let k = 0; k < (low ? 3 : 6); k++) { const a0 = -f * 0.01 + k * 1.05, r = p.r * (0.25 + 0.11 * k); ctx.strokeStyle = "rgba(220,190,255," + (0.28 - k * 0.03).toFixed(2) + ")"; ctx.lineWidth = 1.4; _fpSwPath(circ(p.at[0], p.at[1], r, -D + 1, a0, a0 + 1.4, 12)); ctx.stroke(); } }
    // the glow it gives off
    if (!low) {
        ctx.globalCompositeOperation = "lighter";
        if (B) { const mid = (B[1] + B[3]) / 2; ctx.lineCap = "round"; ctx.strokeStyle = _fpSwRgba([166, 77, 255], [79, 208, 232], 0.06); ctx.lineWidth = (B[3] - B[1]) * TILE_H * 1.6; _fpSwLine(P(B[0] + 0.5, mid, -S), P(B[2] - 0.5, mid, -S)); }
        for (const p of it.pools) { const c = P(p.at[0], p.at[1], -FP_SEWER.poolSink); _fpGlow(c[0], c[1], p.r * 70, _fpSwCol(FP_SEWER.violet), 0.22 + 0.06 * Math.sin(f * 0.03)); }
        for (const W of it.polys || []) { const b = W.bb, c = P((b[0] + b[2]) / 2, (b[1] + b[3]) / 2, -S); _fpGlow(c[0], c[1], Math.max(b[2] - b[0], b[3] - b[1]) * 22, _fpSwCol(FP_SEWER.violet), 0.12 + 0.04 * Math.sin(f * 0.03 + b[0])); }
        ctx.globalCompositeOperation = "source-over";
    }
}
// ── an outlined pool (the Nest's reservoir and moat): its surface sunk as the river's is, darker where it is deep, flecks of light drifting the way it flows (clipped to its outline), clearing as the river does ──
function _fpSewerPolyWater(W, f, low) {
    const P = _fpP, S = FP_SEWER.sink, pts = W.poly.map(q => P(q[0], q[1], -S)), b = W.bb, fl = W.flow;
    _fpQuad(pts, _fpSwCol("#5a27a8"), null);   // (the river's own violet: an outlined pool is narrow in places, so one even colour, not a gradient across its whole box)
    _fpQuad(pts, _fpSwRgba([176, 104, 255], [140, 225, 240], 0.12 + 0.04 * Math.sin(f * 0.02 + b[0])), null);   // a slow shimmer
    ctx.save(); _fpSwPath(pts); ctx.closePath(); ctx.clip(); ctx.lineCap = "round";
    const w = b[2] - b[0], h = b[3] - b[1], lanes = low ? 4 : 9, sp = 0.012, px = -fl[1], py = fl[0], cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, span = Math.hypot(w, h);
    for (let l = 0; l < lanes; l++) {
        const off = (l + 0.5) / lanes - 0.5, gap = 0.9 + _fpSwHash(l + b[0]) * 0.5, n = Math.ceil(span / gap) + 1;
        for (let k = 0; k < n; k++) {
            const t = ((k * gap + _fpSwHash(l * 7 + k) * 0.4 + f * sp) % (span + gap)) - span / 2 - gap * 0.5, x = cx + fl[0] * t + px * off * span, y = cy + fl[1] * t + py * off * span;
            if (x < b[0] || x > b[2] || y < b[1] || y > b[3]) continue;
            const a = P(x, y, -S), e = P(x + fl[0] * 0.32, y + fl[1] * 0.32, -S); if (a[0] < -40 || a[0] > canvas.width + 40 || a[1] < -40 || a[1] > canvas.height + 40) continue;
            ctx.strokeStyle = "rgba(226,200,255," + (0.2 + _fpSwHash(k * 1.7 + l) * 0.35).toFixed(2) + ")"; ctx.lineWidth = 1 + _fpSwHash(k + l * 3); _fpSwLine(a, e);
        }
    }
    ctx.restore();
}
// ── a piece of the bridge's rail: posts, a top rail in yellow, a mid rail; on the camera's side, the steel girder down to the water ──
function _fpSewerRail(it) {
    const P = _fpP, a = it.a, b = it.b, H = 30;
    if (it.side > 0) { _fpQuad([P(a[0], a[1], 0), P(b[0], b[1], 0), P(b[0], b[1], -FP_SEWER.sink + 2), P(a[0], a[1], -FP_SEWER.sink + 2)], "#3b4652", "#1b2027", 1); ctx.strokeStyle = "rgba(200,215,230,0.45)"; ctx.lineWidth = 1; _fpSwLine(P(a[0], a[1], -1), P(b[0], b[1], -1)); }
    ctx.lineCap = "round";
    for (const u of [0, 0.5]) { const x = a[0] + (b[0] - a[0]) * u, y = a[1] + (b[1] - a[1]) * u; ctx.strokeStyle = "#1b2027"; ctx.lineWidth = 3.4; _fpSwLine(P(x, y, 0), P(x, y, H)); ctx.strokeStyle = "#b9c6d3"; ctx.lineWidth = 1.6; _fpSwLine(P(x, y, 0), P(x, y, H)); }
    ctx.strokeStyle = "#1b2027"; ctx.lineWidth = 4; _fpSwLine(P(a[0], a[1], H), P(b[0], b[1], H)); ctx.strokeStyle = "#f2b13a"; ctx.lineWidth = 2.2; _fpSwLine(P(a[0], a[1], H), P(b[0], b[1], H));
    ctx.strokeStyle = "#9aa8b6"; ctx.lineWidth = 1.6; _fpSwLine(P(a[0], a[1], H * 0.5), P(b[0], b[1], H * 0.5));
}
// ── a stump of the broken bridge: its grating out over the water from the bank, bent down where it tore, a rail hanging ──
function _fpSewerStump(it, f) {
    const P = _fpP, r = it.rect, d = it.dir, yb = d > 0 ? r[1] : r[3], ye = d > 0 ? r[3] : r[1], ybend = yb + (ye - yb) * 0.62, drop = -FP_SEWER.sink + 3;
    const deck = (ya, yz, za, zb, col) => _fpQuad([P(r[0], ya, za), P(r[2], ya, za), P(r[2], yz, zb), P(r[0], yz, zb)], col, "#141a20", 1.2);
    deck(yb, ybend, 0, 0, "#59646f"); deck(ybend, ye, 0, drop, "#4a545e");
    ctx.strokeStyle = "rgba(20,24,30,0.85)"; ctx.lineWidth = 2;
    for (let k = 1; k < 6; k++) { const y = yb + (ybend - yb) * k / 6; _fpSwLine(P(r[0], y, 0.5), P(r[2], y, 0.5)); }
    for (let k = 1; k < 4; k++) { const t = k / 4, y = ybend + (ye - ybend) * t; _fpSwLine(P(r[0], y, drop * t + 0.5), P(r[2], y, drop * t + 0.5)); }
    // the torn end: jagged teeth of grating
    ctx.strokeStyle = "#8f9ba7"; ctx.lineWidth = 1.5; const n = 6; _fpSwPath(Array.from({ length: n + 1 }, (_, k) => P(r[0] + (r[2] - r[0]) * k / n, ye + (k & 1 ? 0.12 : -0.05) * d, drop - (k & 1 ? 3 : 0)))); ctx.stroke();
    // the girder on the camera's side, and the rails: one standing, one bent down into the water
    _fpQuad([P(r[2], yb, 0), P(r[2], ybend, 0), P(r[2], ye, drop), P(r[2], ye, drop - 6), P(r[2], ybend, -6), P(r[2], yb, -6)], "#36414c", "#141a20", 1);
    ctx.lineCap = "round";
    for (const x of [r[0], r[2]]) { for (const y of [yb, yb + (ybend - yb) * 0.5]) { ctx.strokeStyle = "#b9c6d3"; ctx.lineWidth = 1.8; _fpSwLine(P(x, y, 0), P(x, y, 30)); } }
    ctx.strokeStyle = "#f2b13a"; ctx.lineWidth = 2.2; _fpSwLine(P(r[0], yb, 30), P(r[0], ybend, 30)); _fpSwLine(P(r[2], yb, 30), P(r[2], ybend, 22));
    ctx.strokeStyle = "#c8962e"; ctx.lineWidth = 2; _fpSwPath([P(r[2], ybend, 22), P(r[2], ybend + (ye - ybend) * 0.5, 4), P(r[2], ye, drop - 4)]); ctx.stroke();   // the rail that went down with it
    const sp = P(r[2], ye, drop - 2), ph = (f * 0.03 + it.seed % 7) % 1; ctx.strokeStyle = "rgba(220,190,255," + (0.5 * (1 - ph)).toFixed(2) + ")"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(sp[0], sp[1], 6 + ph * 10, 3 + ph * 5, 0, 0, 6.2832); ctx.stroke();   // the water round it
}
// ── a gate: two posts, bars, three cross rails, a chain and padlock; the boss's heavier, with red lamps and a warning plate ──
function _fpSewerGate(it, f) {
    const P = _fpP, a = it.a, b = it.b, H = FP_SEWER.gateH, boss = !!it.boss, L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(4, Math.round(L * (boss ? 6 : 5)));
    const open = typeof facilitySolidIsOpen === "function" && facilitySolidIsOpen(it.id), z0 = open ? H * 0.64 : 0;   // OPEN (the boss gate's seal broken, js/quests.js): the grille is raised into the arch, the chain is off, the lamps are green
    const at = (u, z) => P(a[0] + (b[0] - a[0]) * u, a[1] + (b[1] - a[1]) * u, z);
    ctx.lineCap = "butt";
    const bar = (u, z0, z1, w, col) => { ctx.strokeStyle = "#0e1216"; ctx.lineWidth = w + 2; _fpSwLine(at(u, z0), at(u, z1)); ctx.strokeStyle = col; ctx.lineWidth = w; _fpSwLine(at(u, z0), at(u, z1)); };
    for (let k = 1; k < n; k++) bar(k / n, z0, H - 6, boss ? 3 : 2.2, boss ? "#6b3a40" : "#56636f");
    for (const z of (open ? [z0 + 4, H - 8] : [6, H * 0.5, H - 8])) { ctx.strokeStyle = "#0e1216"; ctx.lineWidth = boss ? 7 : 5.5; _fpSwLine(at(0, z), at(1, z)); ctx.strokeStyle = boss ? "#8a3a44" : "#6f7d8a"; ctx.lineWidth = boss ? 5 : 3.5; _fpSwLine(at(0, z), at(1, z)); ctx.strokeStyle = "rgba(255,255,255,0.25)"; ctx.lineWidth = 1; _fpSwLine(at(0, z + 1.5), at(1, z + 1.5)); }
    for (const u of [0, 1]) bar(u, 0, H + 4, boss ? 7 : 5, boss ? "#7a434a" : "#66737f");
    // a chain round the middle and a padlock (off an open gate)
    const c = at(0.5, H * 0.5); if (!open) { ctx.strokeStyle = "#a9b3bd"; ctx.lineWidth = 1.6; for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.ellipse(c[0] + k * 4, c[1] + (k & 1 ? 2 : -2), 3, 2, 0.6, 0, 6.2832); ctx.stroke(); }
    ctx.fillStyle = "#c8962e"; ctx.fillRect(c[0] - 4, c[1] + 3, 8, 8); ctx.strokeStyle = "#141414"; ctx.lineWidth = 1; ctx.strokeRect(c[0] - 4, c[1] + 3, 8, 8); }
    if (boss) {   // two red lamps on the posts, blinking in turn (steady green once it is open), and a black and yellow plate with a skull
        for (const u of [0, 1]) { const q = at(u, H + 9), on = open || Math.floor(f / 24 + u) % 2 === 0, lc = open ? "#4aff7a" : "#ff3a4a"; ctx.fillStyle = on ? lc : "#5a1018"; ctx.beginPath(); ctx.arc(q[0], q[1], 4, 0, 6.2832); ctx.fill(); if (on) _fpGlow(q[0], q[1], 22, lc, 0.35); }
        const s = at(0.5, H * 0.72); ctx.fillStyle = "#f0b030"; ctx.fillRect(s[0] - 13, s[1] - 9, 26, 18); ctx.strokeStyle = "#141414"; ctx.lineWidth = 1.5; ctx.strokeRect(s[0] - 13, s[1] - 9, 26, 18);
        ctx.fillStyle = "#141414"; ctx.beginPath(); ctx.arc(s[0], s[1] - 1, 5, 0, 6.2832); ctx.fill(); ctx.fillRect(s[0] - 3, s[1] + 2, 6, 4); ctx.fillStyle = "#f0b030"; ctx.fillRect(s[0] - 3, s[1] - 2, 2, 2); ctx.fillRect(s[0] + 1, s[1] - 2, 2, 2);
    }
}
// ── the arena's overflow grate, one tile's share of it (cut to the tile, so the floor drawn after never covers it): a steel frame, the violet runoff glowing under the bars and turning ──
function _fpOverflowGrate(it, f) {
    const P = _fpP, cx = it.at[0], cy = it.at[1], h = it.h, c = it.cell, low = typeof gfxLow !== "undefined" && gfxLow;
    ctx.save(); _fpSwPath([P(c[0] - 0.5, c[1] - 0.5, 0), P(c[0] + 0.5, c[1] - 0.5, 0), P(c[0] + 0.5, c[1] + 0.5, 0), P(c[0] - 0.5, c[1] + 0.5, 0)]); ctx.closePath(); ctx.clip();
    const sq = (e, z) => [P(cx - e, cy - e, z), P(cx + e, cy - e, z), P(cx + e, cy + e, z), P(cx - e, cy + e, z)];
    _fpQuad(sq(h + 0.1, 0), "#4b5662", "#a4b2c0", 1.2);
    const m = P(cx, cy, -8), e = P(cx + h, cy - h, 0), g = ctx.createRadialGradient(m[0], m[1], 1, m[0], m[1], Math.abs(e[0] - m[0]) * 1.4); const pul = 0.85 + 0.15 * Math.sin(f * 0.05 + cx);
    g.addColorStop(0, "rgba(226,186,255," + pul.toFixed(2) + ")"); g.addColorStop(0.35, "rgba(150,70,240,1)"); g.addColorStop(1, "rgba(16,7,26,1)"); _fpQuad(sq(h, 0), g, null);
    ctx.save(); _fpSwPath(sq(h, 0)); ctx.closePath(); ctx.clip(); ctx.lineCap = "round";
    for (let k = 0; k < (low ? 3 : 6); k++) { const s = ((k * 0.37 + f * 0.012) % 2.2) - 1.1; ctx.strokeStyle = "rgba(240,220,255,0.5)"; ctx.lineWidth = 1.3; _fpSwLine(P(cx + s - 0.25, cy - h + 0.15 + k * 0.12, -8), P(cx + s + 0.05, cy - h + 0.15 + k * 0.12, -8)); }
    ctx.lineCap = "butt"; for (let u = -h + 0.12; u < h; u += 0.17) { const p = P(cx + u, cy - h, 0), q = P(cx + u, cy + h, 0); ctx.strokeStyle = "#1d232b"; ctx.lineWidth = 3.5; _fpSwLine(p, q); ctx.strokeStyle = "#8e9cab"; ctx.lineWidth = 1.1; _fpSwLine([p[0], p[1] - 1.1], [q[0], q[1] - 1.1]); }
    ctx.restore();
    if (!low) { ctx.globalCompositeOperation = "lighter"; const gc = P(cx, cy, 0), gg = ctx.createRadialGradient(gc[0], gc[1], 2, gc[0], gc[1], h * 190); gg.addColorStop(0, "rgba(166,77,255,0.2)"); gg.addColorStop(1, "rgba(166,77,255,0)"); ctx.fillStyle = gg; ctx.beginPath(); ctx.ellipse(gc[0], gc[1], h * 190, h * 95, 0, 0, 6.2832); ctx.fill(); ctx.globalCompositeOperation = "source-over"; }
    ctx.restore();
}
// ── the sight glass in a tank's pipe, where it goes down into the floor: the violet runoff seen running down it ──
function _fpSightGlass(it, f) {
    const g = it.glass, a = _fpP(it.at[0], it.at[1], g[1]), b = _fpP(it.at[0], it.at[1], g[0]), w = g[2], hgt = b[1] - a[1];
    ctx.fillStyle = "#12081d"; ctx.fillRect(a[0] - w, a[1], w * 2, hgt);
    const gr = ctx.createLinearGradient(a[0] - w, 0, a[0] + w, 0); gr.addColorStop(0, "rgba(90,30,170,1)"); gr.addColorStop(0.45, "rgba(190,120,255,1)"); gr.addColorStop(1, "rgba(80,25,160,1)"); ctx.fillStyle = gr; ctx.fillRect(a[0] - w + 2, a[1], w * 2 - 4, hgt);
    ctx.save(); ctx.beginPath(); ctx.rect(a[0] - w + 2, a[1], w * 2 - 4, hgt); ctx.clip(); for (let k = 0; k < 6; k++) { const yy = a[1] + ((k * 7 + f * 0.9) % (hgt + 10)) - 5; ctx.fillStyle = "rgba(245,230,255,0.55)"; ctx.fillRect(a[0] - w + 3 + (k % 3) * 3, yy, 2, 4); } ctx.restore();
    ctx.strokeStyle = "rgba(255,255,255,0.35)"; ctx.lineWidth = 1; ctx.strokeRect(a[0] - w + 1.5, a[1], w * 2 - 3, hgt);
    if (typeof gfxLow === "undefined" || !gfxLow) _fpGlow(a[0], (a[1] + b[1]) / 2, 30, FP_SEWER.violet, 0.25);
}
// ── a breath of violet mist off the overflow grate ──
function _fpSewerMist(it, f) {
    if (typeof gfxLow !== "undefined" && gfxLow) return;
    ctx.globalCompositeOperation = "lighter";
    for (let k = 0; k < 4; k++) { const ph = ((f * 0.006 + _fpSwHash(k * 7.3 + it.x)) % 1), z = 6 + ph * 70, al = Math.sin(ph * 3.1416) * 0.11, q = _fpP(it.at[0] + (_fpSwHash(k) - 0.5) * it.r, it.at[1] + (_fpSwHash(k + 9) - 0.5) * it.r, z), R = 14 + ph * 22;
        const g = ctx.createRadialGradient(q[0], q[1], 1, q[0], q[1], R); g.addColorStop(0, "rgba(214,170,255," + al.toFixed(3) + ")"); g.addColorStop(1, "rgba(214,170,255,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(q[0], q[1], R, 0, 6.2832); ctx.fill(); }
    ctx.globalCompositeOperation = "source-over";
}

// ═════════════ ON THE WALLS ═════════════
// THE CULVERT (a portal door with `culvert`): an arched concrete mouth in the wall, its grating raised into the arch, dark inside with the violet runoff's glow coming up from below. Stepping into the alcove
// takes you through (js/facilityportals.js).
function _fpCulvertDoor(it, f) {
    const P = (u, z) => _fpWP(it, u, z), ink = _FPW.ink, pul = 0.6 + 0.4 * Math.sin(f * 0.05 + it.seed), H = 92, h0 = 48;
    const arch = (u0, u1, zTop, zSide, n) => { const o = [P(u0, -2), P(u0, zSide)]; for (let i = 1; i < n; i++) { const t = Math.PI - i / n * Math.PI; o.push(P((u0 + u1) / 2 + Math.cos(t) * (u1 - u0) / 2, zSide + Math.sin(t) * (zTop - zSide))); } o.push(P(u1, zSide), P(u1, -2)); return o; };
    _fpQuad(arch(0.02, 0.98, H + 14, h0 + 4, 18), "#6b6f75", ink, 3.5);                                // the concrete headwall
    for (let i = 1; i < 8; i++) { const t = Math.PI - i / 8 * Math.PI, u = 0.5 + Math.cos(t) * 0.4, z = h0 + Math.sin(t) * (H - h0), uo = 0.5 + Math.cos(t) * 0.48, zo = h0 + 4 + Math.sin(t) * (H + 14 - h0 - 4); _fpWLine(it, u, z, uo, zo, "#4c5056", 1.4); }   // its voussoirs
    const mouth = arch(0.1, 0.9, H, h0, 18), g0 = P(0.5, 0), g1 = P(0.5, H), gr = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]); gr.addColorStop(0, "#4a1f86"); gr.addColorStop(0.3, "#160a2c"); gr.addColorStop(1, "#030205");
    _fpQuad(mouth, gr, ink, 2.5);                                                                        // the dark mouth, the runoff's glow coming up the tunnel
    ctx.save(); _fpSwPath(mouth); ctx.closePath(); ctx.clip();
    for (let k = 0; k < 7; k++) { const u = 0.16 + k * 0.68 / 6, s = P(u, 2 + ((f * 0.4 + k * 9) % 12)); ctx.fillStyle = "rgba(200,150,255,0.35)"; ctx.fillRect(s[0] - 1.5, s[1] - 1, 3, 2); }   // the stream in the tunnel's floor
    for (let k = 1; k < 9; k++) { const u = 0.1 + k * 0.8 / 9; _fpWLine(it, u, H - 30, u, H + 2, "#1b2026", 4); _fpWLine(it, u, H - 30, u, H + 2, "#7f8c9a", 1.6); }   // the grating, raised into the arch
    _fpWLine(it, 0.1, H - 30, 0.9, H - 30, "#1b2026", 6); _fpWLine(it, 0.1, H - 30, 0.9, H - 30, "#8e9cab", 3);
    ctx.restore();
    for (const u of [0.13, 0.87]) _fpWLine(it, u, H - 30, u, H + 8, "#a9b3bd", 1.4);                     // its chains
    _fpWQuad(it, 0.1, 0.9, 0, 5, "rgba(166,77,255," + (0.35 * pul).toFixed(3) + ")", null);              // the lip, wet and lit from below
    const m = P(0.5, 8); _fpGlow(m[0], m[1], 44, it.colour || FP_SEWER.violet, 0.2 * pul);
    _fpWQuad(it, 0.12, 0.2, 10, 40, "rgba(40,70,40,0.35)", null); _fpWQuad(it, 0.82, 0.88, 6, 28, "rgba(40,70,40,0.3)", null);   // damp
    // (its name, SEWERS or ARENA, is the doorway's own yellow label over it: js/facilityportals.js)
}
Object.assign(FP_STYLE_WALL, {
    // THE OUTFALL: a big pipe mouth in a concrete collar, the runoff pouring out of it and down into the water below the ledges, a splash and a glow where it lands
    outfall: (it, f) => {
        const P = (u, z) => _fpWP(it, u, z), L = Math.hypot(it.b[0] - it.a[0], it.b[1] - it.a[1]) || 1, R = 22, zc = 32, ru = R / (L * 67), S = FP_SEWER.sink, low = typeof gfxLow !== "undefined" && gfxLow;
        const ring = (r, z0) => { const o = []; for (let i = 0; i < 28; i++) { const t = i / 28 * 6.2832; o.push(P(0.5 + Math.cos(t) * r * ru / R, z0 + Math.sin(t) * r)); } return o; };
        _fpQuad(ring(R + 8, zc), "#6b6f75", _FPW.ink, 3); _fpQuad(ring(R, zc), "#2a2f36", _FPW.ink, 2); _fpQuad(ring(R - 4, zc), "#090510", null);
        const in0 = P(0.5, zc - R + 6); _fpGlow(in0[0], in0[1], 26, FP_SEWER.violet, 0.3);
        // the stream: out of the lip, out from the wall and down into the water
        const dx = it.b[0] - it.a[0], dy = it.b[1] - it.a[1]; let nx = dy / L, ny = -dx / L; if (nx + ny < 0) { nx = -nx; ny = -ny; }
        const mx = (it.a[0] + it.b[0]) / 2, my = (it.a[1] + it.b[1]) / 2, out = d => [mx + nx * d, my + ny * d], q0 = out(0.05), q1 = out(0.55), z0 = zc - R + 4;
        const lip = _fpP(q0[0], q0[1], z0), mid = _fpP(out(0.35)[0], out(0.35)[1], z0 - 10), end = _fpP(q1[0], q1[1], -S);
        ctx.lineCap = "round"; const sg = ctx.createLinearGradient(lip[0], lip[1], end[0], end[1]); sg.addColorStop(0, "rgba(206,150,255,0.95)"); sg.addColorStop(1, "rgba(130,60,230,0.85)");
        ctx.strokeStyle = sg; ctx.lineWidth = 16; ctx.beginPath(); ctx.moveTo(lip[0], lip[1]); ctx.quadraticCurveTo(mid[0], mid[1], end[0], end[1]); ctx.stroke();
        ctx.strokeStyle = "rgba(245,230,255,0.55)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(lip[0] - 4, lip[1]); ctx.quadraticCurveTo(mid[0] - 4, mid[1], end[0] - 3, end[1]); ctx.stroke();
        for (let k = 0; k < 5; k++) { const t = ((f * 0.025 + k / 5) % 1), x = (1 - t) * (1 - t) * lip[0] + 2 * (1 - t) * t * mid[0] + t * t * end[0], y = (1 - t) * (1 - t) * lip[1] + 2 * (1 - t) * t * mid[1] + t * t * end[1]; ctx.fillStyle = "rgba(250,236,255,0.6)"; ctx.fillRect(x - 3 + (k % 3) * 2, y - 2, 2, 5); }
        // the splash
        for (let k = 0; k < 2; k++) { const ph = (f * 0.03 + k * 0.5) % 1; ctx.strokeStyle = "rgba(230,205,255," + (0.6 * (1 - ph)).toFixed(2) + ")"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(end[0], end[1], 10 + ph * 18, 5 + ph * 9, 0, 0, 6.2832); ctx.stroke(); }
        if (!low) { _fpGlow(end[0], end[1], 50, FP_SEWER.violet, 0.3); }
        // stains down the wall under it
        _fpWQuad(it, 0.42, 0.47, -S, zc - R - 2, "rgba(120,60,200,0.3)", null); _fpWQuad(it, 0.56, 0.6, -S, zc - R, "rgba(120,60,200,0.22)", null);
    },
    // THE COLLAPSED TUNNEL: an arched mouth in the wall, fallen in: broken slabs and rock piled up inside it nearly to the top, a bent bar sticking out, tape across it
    collapse: (it, f) => {
        const P = (u, z) => _fpWP(it, u, z), H = 86, h0 = 44, ink = _FPW.ink;
        const arch = (u0, u1, zTop, zSide) => { const o = [P(u0, 0), P(u0, zSide)]; for (let i = 1; i < 14; i++) { const t = Math.PI - i / 14 * Math.PI; o.push(P((u0 + u1) / 2 + Math.cos(t) * (u1 - u0) / 2, zSide + Math.sin(t) * (zTop - zSide))); } o.push(P(u1, zSide), P(u1, 0)); return o; };
        _fpQuad(arch(0.02, 0.98, H + 10, h0 + 4), "#5f6369", ink, 3); _fpQuad(arch(0.12, 0.88, H, h0), "#07080a", ink, 2);
        const rocks = [[[0.12, 0], [0.12, 30], [0.24, 46], [0.36, 34], [0.34, 0]], [[0.3, 0], [0.32, 40], [0.46, 62], [0.6, 50], [0.58, 0]], [[0.54, 0], [0.58, 46], [0.72, 70], [0.86, 52], [0.88, 0]],
                       [[0.2, 40], [0.28, 70], [0.42, 76], [0.44, 56]], [[0.5, 60], [0.56, 82], [0.7, 84], [0.74, 66]], [[0.36, 66], [0.4, 84], [0.52, 86], [0.5, 70]]];
        const cols = ["#6a6a66", "#5a5a57", "#727069", "#4f4f4c", "#66645e", "#585653"];
        for (let k = 0; k < rocks.length; k++) { _fpQuad(rocks[k].map(q => P(q[0], q[1])), cols[k], ink, 2); const r = rocks[k]; _fpQuad([P(r[1][0], r[1][1]), P(r[2][0], r[2][1]), P(r[2][0] + 0.02, r[2][1] - 6), P(r[1][0] + 0.02, r[1][1] - 4)].map(q => q), "rgba(255,255,255,0.08)", null); }
        _fpWLine(it, 0.62, 48, 0.74, 92, "#8a5a3a", 2.5); _fpWLine(it, 0.74, 92, 0.8, 88, "#8a5a3a", 2.5);   // a bent bar
        for (let k = 0; k < 6; k++) _fpWQuad(it, 0.08 + k * 0.14, 0.15 + k * 0.14, 50 + (k & 1) * 3, 56 + (k & 1) * 3, k & 1 ? "#141414" : "#f0b030", null);   // tape across it
    },
    // THE SEALED HATCH: rungs up the wall to a hatch at the top, its rim bolted and its lid welded shut with two bars across it, a plate on it
    sealed_hatch: (it, f) => {
        const H = FP_WALL_H - 10, ink = _FPW.ink;
        for (const u of [0.18, 0.82]) _fpWLine(it, u, 0, u, H - 26, "#8e9cab", 2.4);
        for (let z = 10; z < H - 30; z += 11) _fpWLine(it, 0.18, z, 0.82, z, "#b9c6d3", 1.8);
        _fpWQuad(it, -0.25, 1.25, H - 28, H, "#3b434c", ink, 2.5); _fpWQuad(it, -0.12, 1.12, H - 24, H - 4, "#252b31", ink, 1.5);
        for (const [u0, z0, u1, z1] of [[-0.1, H - 22, 1.1, H - 6], [-0.1, H - 6, 1.1, H - 22]]) { _fpWLine(it, u0, z0, u1, z1, "#141414", 5); _fpWLine(it, u0, z0, u1, z1, "#c26a2e", 3); }   // the bars welded across
        for (const u of [-0.18, 0.5, 1.18]) for (const z of [H - 26, H - 2]) { const q = _fpWP(it, u, z); ctx.fillStyle = "#a9b3bd"; ctx.beginPath(); ctx.arc(q[0], q[1], 1.6, 0, 6.2832); ctx.fill(); }
        _fpWQuad(it, 0.2, 0.8, H - 42, H - 32, "#f0b030", ink, 1.5); _fpWLine(it, 0.3, H - 40, 0.7, H - 34, "#141414", 1.5); _fpWLine(it, 0.3, H - 34, 0.7, H - 40, "#141414", 1.5);
    },
});
for (const k of ["outfall", "collapse", "sealed_hatch"]) FP_WALL_KINDS[k] = FP_STYLE_WALL[k];

// ═════════════ THE NEST (2026-11-01; js/population.js NESTS; the map: js/facilitymap.js, the Sewers' east end) ═════════════
// The Toxic Ant Queen's colony on its TRASH DAM over the water: eggs and brood holes that glow toxic green while the Nest is infested (brighter and quicker when her encounter has stirred it), dim once it is
// calmed and dark once it is cleared (js/population.js nestState); the dam's junk and its rim of compacted trash where it drops into the water; the WATERFALL where the moat spills over the east edge; the BIG
// BARRED ARCH in the north wall with the stream coming out under its bars (the user's sketch: "Make a waterfall and another big sewer gate tunnel entrance").
let _fpNestToneF = -1, _fpNestToneV = null;
function _fpNestTone(f) {
    if (_fpNestToneF === f && _fpNestToneV) return _fpNestToneV;
    const s = typeof nestState === "function" ? nestState() : "infested"; _fpNestToneF = f;
    return (_fpNestToneV = s === "stirred" ? { g: 1, p: 0.11, s } : s === "calmed" ? { g: 0.22, p: 0.02, s } : s === "cleared" ? { g: 0, p: 0, s } : { g: 0.8, p: 0.035, s });
}
// a small box on the floor: its top and the two faces the camera sees
function _fpNestBox(x0, y0, x1, y1, z0, z1, top, sx, sy, ink) {
    const P = _fpP;
    _fpQuad([P(x0, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x0, y1, z1)], sy, ink, 1);
    _fpQuad([P(x1, y0, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y0, z1)], sx, ink, 1);
    _fpQuad([P(x0, y0, z1), P(x1, y0, z1), P(x1, y1, z1), P(x0, y1, z1)], top, ink, 1);
}
// ── an egg: a pale, leathery shell with the brood's toxic green showing through it; broken open and dark once the Nest is cleared ──
function _fpNestEgg(it, f) {
    const T = _fpNestTone(f), s = it.s, H = s * 92, c = _fpP(it.x, it.y, H * 0.5), g = _fpP(it.x, it.y, 0), rx = s * TILE_W * 0.95, ry = H * 0.55, ph = Math.sin(f * T.p * 2 + it.seed);
    ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(g[0], g[1], rx * 1.1, rx * 0.5, 0, 0, 6.2832); ctx.fill();
    const gr = ctx.createRadialGradient(c[0] - rx * 0.3, c[1] - ry * 0.35, 1, c[0], c[1], Math.max(rx, ry) * 1.1), core = 0.25 + T.g * (0.45 + 0.2 * ph);
    gr.addColorStop(0, T.s === "cleared" ? "#8a8f80" : "#eef3dc"); gr.addColorStop(0.55, T.s === "cleared" ? "#5e6356" : "rgba(" + Math.round(150 + 60 * (1 - core)) + "," + Math.round(205 + 20 * core) + ",120,1)"); gr.addColorStop(1, T.s === "cleared" ? "#3a3d35" : "rgba(60,110,40,1)");
    ctx.fillStyle = gr; ctx.strokeStyle = "rgba(20,26,16,0.85)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, ry, 0, 0, 6.2832); ctx.fill(); ctx.stroke();
    if (T.s === "cleared") { ctx.fillStyle = "#14160f"; ctx.beginPath(); for (let k = 0; k <= 6; k++) { const a = Math.PI + k / 6 * Math.PI, rr = k & 1 ? 0.62 : 0.9; ctx.lineTo(c[0] + Math.cos(a) * rx * rr, c[1] - ry * 0.35 + Math.sin(a) * ry * 0.45 * rr); } ctx.closePath(); ctx.fill(); return; }   // (hatched or burst: an empty, torn top)
    ctx.fillStyle = "rgba(255,255,255,0.45)"; ctx.beginPath(); ctx.ellipse(c[0] - rx * 0.35, c[1] - ry * 0.4, rx * 0.25, ry * 0.18, -0.5, 0, 6.2832); ctx.fill();
    if (T.g > 0.05 && (typeof gfxLow === "undefined" || !gfxLow)) _fpGlow(c[0], c[1], rx * 3, "#8cff5a", 0.14 * T.g * (0.7 + 0.3 * ph));
}
// ── a piece of the dam's junk: a crate, a barrel, a tyre, a pipe or a bag, glued with resin ──
function _fpNestJunk(it, f) {
    const s = it.s, x = it.x, y = it.y, k = it.seed % 5, ink = "rgba(14,16,12,0.9)", T = _fpNestTone(f), P = _fpP;
    if (k === 0) { const h = s * 0.5; _fpNestBox(x - h, y - h * 0.8, x + h, y + h * 0.8, 0, s * 46, "#7b6346", "#5a452f", "#6a5238", ink); ctx.strokeStyle = "rgba(30,20,10,0.6)"; ctx.lineWidth = 1; for (const t of [0.33, 0.66]) _fpSwLine(P(x - h, y + h * 0.8, s * 46 * t), P(x + h, y + h * 0.8, s * 46 * t)); }   // a crate
    else if (k === 1) { const c = P(x, y, 0), t = P(x, y, s * 58), rx = s * TILE_W * 0.55, ry = rx * 0.5; ctx.fillStyle = "#2f5a55"; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(c[0] - rx, c[1]); ctx.lineTo(t[0] - rx, t[1]); ctx.ellipse(t[0], t[1], rx, ry, 0, Math.PI, 0, false); ctx.lineTo(c[0] + rx, c[1]); ctx.ellipse(c[0], c[1], rx, ry, 0, 0, Math.PI, false); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = "#3f6b66"; ctx.beginPath(); ctx.ellipse(t[0], t[1], rx, ry, 0, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.strokeStyle = "rgba(160,90,40,0.7)"; ctx.lineWidth = 2; for (const q of [0.3, 0.7]) { const m = P(x, y, s * 58 * q); ctx.beginPath(); ctx.ellipse(m[0], m[1], rx, ry, 0, 0, Math.PI); ctx.stroke(); } }   // a rusty barrel
    else if (k === 2) { const c = P(x, y, 3), rx = s * TILE_W * 0.7; ctx.strokeStyle = "#141414"; ctx.lineWidth = Math.max(3, rx * 0.45); ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, rx * 0.5, 0, 0, 6.2832); ctx.stroke(); ctx.strokeStyle = "rgba(90,90,90,0.5)"; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(c[0], c[1] - 1, rx, rx * 0.5, 0, 3.4, 5.9); ctx.stroke(); }   // a tyre, flat
    else if (k === 3) { const h = s * 0.9, w = s * 0.18; _fpNestBox(x - h, y - w, x + h, y + w, 0, s * 26, "#8a949e", "#5d6670", "#6b7580", ink); }   // a length of pipe
    else { const c = P(x, y, s * 20), rx = s * TILE_W * 0.6; ctx.fillStyle = "#2b3527"; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, rx * 0.62, 0.2, 0, 6.2832); ctx.fill(); ctx.stroke(); ctx.fillStyle = "rgba(255,255,255,0.18)"; ctx.beginPath(); ctx.ellipse(c[0] - rx * 0.3, c[1] - rx * 0.25, rx * 0.3, rx * 0.15, 0.2, 0, 6.2832); ctx.fill(); }   // a bag
    const r = P(x + 0.05, y + 0.05, s * 30), a = 0.25 + 0.35 * T.g; ctx.fillStyle = "rgba(140,170,60," + a.toFixed(2) + ")"; ctx.beginPath(); ctx.ellipse(r[0], r[1], s * TILE_W * 0.35, s * TILE_W * 0.18, 0.4, 0, 6.2832); ctx.fill();   // resin over it
}
// ── a half tile of the dam's rim: a crest of junk along the edge; where the water side faces the camera, the dam's face of compacted trash running down into the water ──
function _fpNestRim(it, f) {
    const P = _fpP, u = it.u, w = it.w, h = it.half, x = it.x, y = it.y, S = FP_SEWER.sink, sd = it.seed, ink = "rgba(12,14,10,0.9)", T = _fpNestTone(f);
    const at = (t, o, z) => P(x + u[0] * t + w[0] * o, y + u[1] * t + w[1] * o, z);
    if (it.face) {
        const cols = ["#4a3c2c", "#3a3f3a", "#55432f", "#33403d", "#4b4a44"];
        _fpQuad([at(-h - 0.02, 0, 1), at(h + 0.02, 0, 1), at(h + 0.02, 0.12, -S - 5), at(-h - 0.02, 0.12, -S - 5)], cols[sd % 5], ink, 1);   // the face: down past the water line
        for (let k = 0; k < 3; k++) { const t0 = -h + (2 * h) * ((sd >>> k) % 7) / 8, t1 = t0 + h * 0.5, z0 = -S + 1 + ((sd >>> (k + 3)) % 5) * 1.5, z1 = z0 + 3 + ((sd >>> (k + 5)) % 3); _fpQuad([at(t0, 0.07 + 0.12 * (z0 + S + 5) / (S + 6), z1), at(t1, 0.07 + 0.12 * (z0 + S + 5) / (S + 6), z1), at(t1, 0.07 + 0.12 * (z0 + S + 5) / (S + 6), z0), at(t0, 0.07 + 0.12 * (z0 + S + 5) / (S + 6), z0)], cols[(sd + k + 1) % 5], null); }   // things stuck in it
        ctx.strokeStyle = _fpSwRgba([200, 160, 255], [150, 230, 240], 0.45); ctx.lineWidth = 1.2; _fpSwLine(at(-h, 0.17, -S + 1), at(h, 0.17, -S + 1));   // where the water meets it
    }
    const k = sd % 4, zc = 4 + (sd % 5);   // the crest
    if (k === 0) _fpNestBox(x - 0.16 + u[0] * 0.05, y - 0.16 + u[1] * 0.05, x + 0.16, y + 0.16, 0, zc + 4, "#7b6346", "#5a452f", "#6a5238", ink);
    else if (k === 1) { const c = P(x + w[0] * 0.05, y + w[1] * 0.05, zc), rx = TILE_W * 0.18; ctx.fillStyle = "#3f6b66"; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, rx * 0.55, 0.3, 0, 6.2832); ctx.fill(); ctx.stroke(); }
    else if (k === 2) _fpNestBox(x - Math.abs(u[0]) * h - 0.05, y - Math.abs(u[1]) * h - 0.05, x + Math.abs(u[0]) * h + 0.05, y + Math.abs(u[1]) * h + 0.05, 0, 4, "#6e5a40", "#4e3e2b", "#5d4a33", ink);   // a plank along it
    else { const c = P(x, y, 3), rx = TILE_W * 0.2; ctx.fillStyle = "#2b3527"; ctx.strokeStyle = ink; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(c[0], c[1], rx, rx * 0.6, 0, 0, 6.2832); ctx.fill(); ctx.stroke(); }
    if (sd % 3 === 0) { const r = at(0, 0.02, 2); ctx.fillStyle = "rgba(140,170,60," + (0.25 + 0.3 * T.g).toFixed(2) + ")"; ctx.beginPath(); ctx.ellipse(r[0], r[1], TILE_W * 0.22, TILE_W * 0.1, 0, 0, 6.2832); ctx.fill(); }   // resin
}
// ── a tile of the waterfall: the moat's water over the lip and down the Nest's east face into the dark, streaks falling in it, foam along the lip, spray below ──
function _fpNestFalls(it, f) {
    const P = _fpP, a = it.a, b = it.b, x = a[0] + 0.06, D = 170, Z = 9, low = typeof gfxLow !== "undefined" && gfxLow;   // (just outside the spill lip, from its top)
    const top = P(x, (a[1] + b[1]) / 2, Z), bot = P(x, (a[1] + b[1]) / 2, -D), g = ctx.createLinearGradient(top[0], top[1], bot[0], bot[1]);
    g.addColorStop(0, _fpSwRgba([214, 170, 255], [170, 236, 248], 0.9)); g.addColorStop(0.3, _fpSwRgba([150, 80, 235], [80, 190, 220], 0.72)); g.addColorStop(1, _fpSwRgba([60, 20, 120], [20, 70, 90], 0));
    _fpQuad([P(x, a[1], Z), P(x, b[1], Z), P(x, b[1], -D), P(x, a[1], -D)], g, null);
    ctx.lineCap = "round";
    for (let k = 0; k < (low ? 3 : 6); k++) { const t = _fpSwHash(it.i * 13 + k), y = a[1] + (b[1] - a[1]) * t, z = Z - ((f * 1.6 + k * 29 + it.i * 11) % (D - 10)), q0 = P(x, y, z), q1 = P(x, y, z - 16 - 8 * _fpSwHash(k + it.i));
        ctx.strokeStyle = "rgba(244,232,255," + (0.5 * (1 - (Z - z) / D)).toFixed(2) + ")"; ctx.lineWidth = 1.4; _fpSwLine(q0, q1); }
    ctx.strokeStyle = "rgba(250,240,255,0.8)"; ctx.lineWidth = 2.2; ctx.beginPath(); for (let k = 0; k <= 6; k++) { const y = a[1] + (b[1] - a[1]) * k / 6, q = P(x, y, Z + Math.sin(f * 0.15 + k * 1.7 + it.i) * 1.2); k ? ctx.lineTo(q[0], q[1]) : ctx.moveTo(q[0], q[1]); } ctx.stroke();   // the foam on the lip
    if (!low) { ctx.globalCompositeOperation = "lighter"; for (let k = 0; k < 2; k++) { const ph = (f * 0.01 + k * 0.5 + it.i * 0.17) % 1, q = P(x + 0.2, (a[1] + b[1]) / 2, -D + 20 + ph * 30), R = 18 + ph * 26; const m = ctx.createRadialGradient(q[0], q[1], 1, q[0], q[1], R); m.addColorStop(0, _fpSwRgba([200, 160, 255], [160, 230, 240], 0.16 * (1 - ph))); m.addColorStop(1, "rgba(0,0,0,0)"); ctx.fillStyle = m; ctx.beginPath(); ctx.arc(q[0], q[1], R, 0, 6.2832); ctx.fill(); } ctx.globalCompositeOperation = "source-over"; }   // the spray below
}
Object.assign(FP_STYLE_WALL, {
    // THE BIG BARRED ARCH: a tall concrete arch in the Nest's north wall, rising past the wall's top, an old tunnel dark behind its bars, the stream running out under them and down into the reservoir
    sewer_arch: (it, f) => {
        const P = (u, z) => _fpWP(it, u, z), ink = _FPW.ink, H = FP_WALL_H + 46, h0 = 92, S = FP_SEWER.sink, low = typeof gfxLow !== "undefined" && gfxLow;
        const arch = (u0, u1, zTop, zSide, n) => { const o = [P(u0, 0), P(u0, zSide)]; for (let i = 1; i < n; i++) { const t = Math.PI - i / n * Math.PI; o.push(P((u0 + u1) / 2 + Math.cos(t) * (u1 - u0) / 2, zSide + Math.sin(t) * (zTop - zSide))); } o.push(P(u1, zSide), P(u1, 0)); return o; };
        const zAt = (u, u0, u1, zTop, zSide) => { const c = (u0 + u1) / 2, r = (u1 - u0) / 2, d = (u - c) / r; return Math.abs(d) >= 1 ? zSide : zSide + Math.sqrt(1 - d * d) * (zTop - zSide); };
        _fpQuad(arch(-0.04, 1.04, H + 16, h0 + 8, 22), "#61666d", ink, 3.5);   // the headwall
        for (let i = 1; i < 11; i++) { const t = Math.PI - i / 11 * Math.PI, u = 0.5 + Math.cos(t) * 0.42, z = h0 + Math.sin(t) * (H - h0), uo = 0.5 + Math.cos(t) * 0.54, zo = h0 + 8 + Math.sin(t) * (H + 16 - h0 - 8); _fpWLine(it, u, z, uo, zo, "#44494f", 1.6); }   // its voussoirs
        _fpWQuad(it, 0.44, 0.56, H - 2, H + 16, "#71767d", ink, 2);   // the keystone
        const mouth = arch(0.08, 0.92, H, h0, 22), g0 = P(0.5, 0), g1 = P(0.5, H), gr = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]); gr.addColorStop(0, _fpSwCol("#4a1f86")); gr.addColorStop(0.28, "#140a26"); gr.addColorStop(1, "#020103");
        _fpQuad(mouth, gr, ink, 2.5);
        ctx.save(); _fpSwPath(mouth); ctx.closePath(); ctx.clip();
        _fpQuad(arch(0.24, 0.76, H - 34, h0 - 18, 16), "rgba(0,0,0,0.55)", null);   // the tunnel going back
        for (let k = 0; k < 9; k++) { const u = 0.14 + k * 0.72 / 8, s = P(u, 2 + ((f * 0.5 + k * 7) % 14)); ctx.fillStyle = _fpSwRgba([210, 160, 255], [160, 230, 240], 0.4); ctx.fillRect(s[0] - 1.5, s[1] - 1, 3, 2); }   // the stream on its floor, coming
        ctx.restore();
        for (let k = 1; k < 10; k++) { const u = 0.08 + k * 0.84 / 10, zt = zAt(u, 0.08, 0.92, H, h0) - 2; _fpWLine(it, u, 0, u, zt, "#141a20", 5); _fpWLine(it, u, 0, u, zt, "#6f7c89", 2.2); }   // the bars, down
        for (const z of [26, h0 - 6]) { _fpWLine(it, 0.08, z, 0.92, z, "#141a20", 7); _fpWLine(it, 0.08, z, 0.92, z, "#7d8a97", 3.5); _fpWLine(it, 0.08, z + 1.5, 0.92, z + 1.5, "rgba(255,255,255,0.22)", 1); }
        _fpWQuad(it, 0.42, 0.58, h0 + 8, h0 + 22, "#c8962e", ink, 1.5); _fpWLine(it, 0.46, h0 + 15, 0.54, h0 + 15, "#141414", 2);   // a rusted plate, its number gone
        _fpWQuad(it, 0.02, 0.1, 6, 70, "rgba(40,70,40,0.35)", null); _fpWQuad(it, 0.9, 0.97, 10, 52, "rgba(40,70,40,0.3)", null);   // damp
        // the stream: out under the bars, over the sill and down into the reservoir
        const L = Math.hypot(it.b[0] - it.a[0], it.b[1] - it.a[1]) || 1, dx = it.b[0] - it.a[0], dy = it.b[1] - it.a[1]; let nx = dy / L, ny = -dx / L; if (nx + ny < 0) { nx = -nx; ny = -ny; }
        const on = (u, d, z) => _fpP(it.a[0] + dx * u + nx * d, it.a[1] + dy * u + ny * d, z), u0 = 0.2, u1 = 0.8;
        const sg = ctx.createLinearGradient(...on(0.5, 0, 2), ...on(0.5, 0.6, -S)); sg.addColorStop(0, _fpSwRgba([214, 170, 255], [170, 236, 248], 0.92)); sg.addColorStop(1, _fpSwRgba([120, 50, 220], [60, 170, 210], 0.8));
        _fpQuad([on(u0, 0, 2), on(u1, 0, 2), on(u1 + 0.02, 0.62, -S), on(u0 - 0.02, 0.62, -S)], sg, null);
        ctx.lineCap = "round"; for (let k = 0; k < (low ? 4 : 8); k++) { const u = u0 + (u1 - u0) * _fpSwHash(k * 3.3 + it.seed), t = (f * 0.03 + k / 8) % 1, q0 = on(u, t * 0.6, 2 - t * (S + 2)), q1 = on(u, Math.min(0.62, t * 0.6 + 0.12), 2 - Math.min(1, t + 0.2) * (S + 2)); ctx.strokeStyle = "rgba(248,236,255,0.6)"; ctx.lineWidth = 1.4; _fpSwLine(q0, q1); }
        for (let k = 0; k < 3; k++) { const ph = (f * 0.025 + k / 3) % 1, c = on(0.5, 0.66 + ph * 0.3, -S); ctx.strokeStyle = _fpSwRgba([230, 205, 255], [200, 240, 250], 0.55 * (1 - ph)); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(c[0], c[1], 20 + ph * 26, 9 + ph * 12, 0, 0, 6.2832); ctx.stroke(); }   // where it lands
        if (!low) { const m = on(0.5, 0.3, -S + 2); _fpGlow(m[0], m[1], 60, _fpSwCol(FP_SEWER.violet), 0.28); }
    },
    // A BROOD HOLE: a gallery the colony has bored through the wall, ringed with resin, the brood's toxic green glowing deep in it (a pair of feelers in it now and then) while the Nest is infested
    brood_hole: (it, f) => {
        const T = _fpNestTone(f), ink = _FPW.ink, sd = it.seed || 1, n = 12, pts = [], ring = [];
        for (let k = 0; k < n; k++) { const a = k / n * 6.2832, j = 0.78 + 0.22 * _fpSwHash(sd + k * 1.3), u = 0.5 + Math.cos(a) * 0.36 * j, z = 17 + Math.sin(a) * 15 * j; pts.push(_fpWP(it, u, Math.max(0, z))); const jr = j + 0.18; ring.push(_fpWP(it, 0.5 + Math.cos(a) * 0.36 * jr, Math.max(0, 17 + Math.sin(a) * 15 * jr))); }
        _fpQuad(ring, "rgba(122,140,58," + (0.55 + 0.25 * T.g).toFixed(2) + ")", ink, 1.5);   // the resin round it
        _fpQuad(pts, "#050604", ink, 1.5);
        if (T.g > 0.02) { const c = _fpWP(it, 0.5, 14), ph = 0.7 + 0.3 * Math.sin(f * T.p * 2 + sd); _fpGlow(c[0], c[1], 26, "#8cff5a", 0.35 * T.g * ph); ctx.fillStyle = "rgba(140,255,90," + (0.35 * T.g * ph).toFixed(2) + ")"; ctx.beginPath(); ctx.ellipse(c[0], c[1] + 2, 6, 3, 0, 0, 6.2832); ctx.fill(); }
        if (T.g > 0.5 && Math.floor((f + sd * 37) / 150) % 3 === 0) { const c = _fpWP(it, 0.5, 12); ctx.strokeStyle = "#1a1f12"; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(c[0] - 2, c[1]); ctx.quadraticCurveTo(c[0] - 7, c[1] - 9, c[0] - 11 + Math.sin(f * 0.3) * 2, c[1] - 14); ctx.moveTo(c[0] + 2, c[1]); ctx.quadraticCurveTo(c[0] + 6, c[1] - 10, c[0] + 10 + Math.sin(f * 0.27) * 2, c[1] - 13); ctx.stroke(); }   // feelers
        for (const [u, z] of [[0.1, 30], [0.86, 26], [0.2, 36]]) _fpWLine(it, u, z, u + 0.06, z - 6, "rgba(20,22,16,0.6)", 1.2);   // scratches
    },
    // RESIN: the colony's glossy amber-green resin run over the wall in sheets and drips, faintly lit from inside while the Nest is infested
    resin: (it, f) => {
        const T = _fpNestTone(f), sd = it.seed || 3;
        for (let k = 0; k < 5; k++) { const u0 = k / 5 + _fpSwHash(sd + k) * 0.05, u1 = u0 + 0.16 + _fpSwHash(sd + k * 2) * 0.08, z1 = 24 + _fpSwHash(sd + k * 3) * 60;
            _fpWQuad(it, u0, Math.min(1, u1), 0, z1, "rgba(" + (110 + Math.round(30 * T.g)) + "," + (128 + Math.round(40 * T.g)) + ",52,0.62)", null);
            _fpWLine(it, u0 + 0.04, z1 - 4, u0 + 0.04, 4, "rgba(230,255,170,0.25)", 1.2);   // its sheen
            _fpWQuad(it, u0 + 0.05, u0 + 0.08, z1 - 2, z1 + 6 + _fpSwHash(sd + k) * 8, "rgba(120,140,52,0.55)", null); }   // a drip above where it ran down from
    },
});
for (const k of ["sewer_arch", "brood_hole", "resin"]) FP_WALL_KINDS[k] = FP_STYLE_WALL[k];
// ── A SPILL LIP (an outline edge of kind `spill`: the Nest's east and south edges, where the moat runs): no wall, a low wet concrete lip the camera sees the moat over, its face running down into the dark ──
function _fpDrawSpillLip(it) {
    const P = _fpP, a = it.a, b = it.b, top = 8, foot = -54, R = _fpRoomCols ? _fpRoomCols(it.room) : null;
    _fpQuad([P(a[0], a[1], top), P(b[0], b[1], top), P(b[0], b[1], foot), P(a[0], a[1], foot)], "#2b3331", null);   // its face, down into the dark
    const g0 = P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, top), g1 = P((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, foot), g = ctx.createLinearGradient(g0[0], g0[1], g1[0], g1[1]); g.addColorStop(0, "rgba(0,0,0,0)"); g.addColorStop(1, "rgba(0,0,0,0.75)");
    _fpQuad([P(a[0], a[1], top), P(b[0], b[1], top), P(b[0], b[1], foot), P(a[0], a[1], foot)], g, null);
    ctx.strokeStyle = (R && R.cap) || "#4b5552"; ctx.lineWidth = 4; _fpSwLine(P(a[0], a[1], top), P(b[0], b[1], top));   // its top
    ctx.strokeStyle = "rgba(205,212,220,0.55)"; ctx.lineWidth = 1.2; _fpSwLine(P(a[0], a[1], top + 1.5), P(b[0], b[1], top + 1.5));
    ctx.strokeStyle = "rgba(60,90,60,0.35)"; ctx.lineWidth = 2; _fpSwLine(P(a[0], a[1], top - 6), P(b[0], b[1], top - 6));   // damp under it
}
// ── THE SEWERS MEASURED (for the Game Bible, bible.html, and the tests: by name, not by the outline's vertex numbers): tiles and counts on the grid the game plays on ──
function facilitySewerMeasures() {
    const F = _fp && _fp.F; if (!F) return null;
    const sol = id => F.solids.find(s => s.id === id), walk = (x, y) => facilityFloorAt(x, y, F), riv = F.solids.filter(s => s.room === "sewers" && s.kind === "river");
    const w = sol("sewer_river_w"), cx = Math.round((w.bb[0] + w.bb[2]) / 2) + 2, run = (x, y, dy) => { let n = 0; while (n < 20 && walk(x, y + dy * n)) n++; return n; };
    const gateIn = (id, dy) => { const g = sol(id); if (!g) return 0; const gx0 = Math.ceil(g.bb[0]), gx1 = Math.floor(g.bb[2]), gy = dy < 0 ? Math.floor(g.bb[1]) : Math.ceil(g.bb[3]); let n = 0; for (let x = gx0; x <= gx1; x++) for (let k = 0; k < 6; k++) { if (!walk(x, gy + dy * k)) break; n++; } return n; };
    const A = F.decor.find(d => d.kind === "area" && d.room === "sewers"), cm = typeof _fpComps === "function" ? _fpComps() : null, L = typeof bossLair === "function" ? bossLair(BOSS_ENCOUNTERS.sewer_cistern) : null, Lc = L && _fpNearestCell(L[0], L[1]);
    const nestCells = A ? [..._fp.cellsP.values()].filter(c => c[0] >= A.rect[0] && c[0] <= A.rect[2] && c[1] >= A.rect[1] && c[1] <= A.rect[3]) : [], dam = cm && Lc ? nestCells.filter(c => cm.get(c[0] + "," + c[1]) === cm.get(Lc[0] + "," + Lc[1])) : [];
    const wet = s => { let n = 0; if (s) for (let x = Math.ceil(s.bb[0]); x <= s.bb[2]; x++) for (let y = Math.ceil(s.bb[1]); y <= s.bb[3]; y++) if (facilityPointInPoly(x, y, s.poly)) n++; return n; };
    let far = 0; if (L) for (const c of dam) far = Math.max(far, Math.hypot(c[0] - L[0], c[1] - L[1]));
    const items = what => (_fp.items || []).filter(i => i.fp === "sewer" && i.what === what).length, deck = d => d ? d.rect[2] - d.rect[0] : 0;
    return {
        length: Math.max(...riv.map(s => s.bb[2])) - Math.min(...riv.map(s => s.bb[0])), riverWidth: w.bb[3] - w.bb[1],
        northLedge: run(cx, Math.floor(w.bb[1]), -1), southLedge: run(cx, Math.ceil(w.bb[3]), 1), passage: run(Math.round((sol("sewer_gate_n1").bb[0] + sol("sewer_gate_n1").bb[2]) / 2), Math.floor(sol("sewer_gate_n1").bb[1]), -1),
        platform: gateIn("sewer_gate_n2", -1), platformWide: Math.round(sol("sewer_gate_n2").bb[2] - sol("sewer_gate_n2").bb[0]),
        bridges: F.decor.filter(d => d.room === "sewers" && d.kind === "bridge_deck").length, bridgeWidth: deck(F.decor.find(d => d.id === "sewer_bridge")), serviceWidth: deck(F.decor.find(d => d.id === "sewer_bridge_east")),
        gates: F.solids.filter(s => s.room === "sewers" && s.kind === "gate").length, bossGates: F.solids.filter(s => s.room === "sewers" && s.kind === "boss_gate").length,
        nestW: A ? A.rect[2] - A.rect[0] : 0, nestH: A ? A.rect[3] - A.rect[1] : 0, dam: dam.length, reservoir: wet(sol("nest_reservoir")), moat: wet(sol("nest_moat")), farFromPost: Math.round(far * 10) / 10,
        falls: items("falls"), holes: F.decor.filter(d => d.room === "sewers" && d.kind === "brood_hole").length, eggs: items("egg"), cells: [..._fp.cellsP.values()].filter(c => { const r = facilityRoomAt(c[0], c[1], F); return r && r.id === "sewers"; }).length,
    };
}
