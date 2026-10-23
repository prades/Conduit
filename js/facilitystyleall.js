// ─────────────────────────────────────────────────────────
//  THE CRYSTAL LABORATORY STYLE, FOR THE WHOLE FACILITY (js/facilitystyle.js defines the palette and the rules)
// ─────────────────────────────────────────────────────────
// Every room uses the one style: the same walls, floors, outlines and shapes. A room keeps its identity through its layout, its equipment, its lighting and ONE accent colour (and a floor and
// wainscot tint): the rest of the palette is shared. Furniture is drawn from the same few shapes (a toon prism, a toon cylinder), with the same bold ink outline round the silhouette,
// flat faces separated by value, and a shine on the lit edges. Nothing here changes the map, collision or navigation.

const FP_ACC = { cyan: "#31e8ff", blue: "#3a7bff", violet: "#9a5cff", amber: "#f2b13a", mint: "#43e0a8" };
// per room: its accent, the wainscot band of its walls, and its two floor tiles
const FP_ROOM_STYLE = {
    crystal_chamber:     { acc: FP_ACC.cyan,   wain: "#3d93a0", fa: "#d8e8ec", fb: "#b4cdd5" },
    teleport_room_1:     { acc: FP_ACC.violet, wain: "#7a62c0", fa: "#e0dcf0", fb: "#bfb8de" },
    teleport_room_2:     { acc: FP_ACC.violet, wain: "#7a62c0", fa: "#e0dcf0", fb: "#bfb8de" },
    teleport_stair_room: { acc: FP_ACC.blue,   wain: "#4a7fb0", fa: "#d9e6f2", fb: "#b6cbe0" },
    front_lobby:         { acc: FP_ACC.blue,   wain: "#4a7fb0", fa: "#dde6ee", fb: "#bccbd9" },
    bathroom:            { acc: FP_ACC.cyan,   wain: "#3aa59a", fa: "#d3ecec", fb: "#aed6d6" },
    show_room:           { acc: FP_ACC.violet, wain: "#7a62c0", fa: "#e4e2f2", fb: "#c6c3de" },
    lab_hallway:         { acc: FP_ACC.cyan,   wain: "#3d93a0", fa: "#d6e0e3", fb: "#b2c2c8" },
    experiment_lab:      { acc: FP_ACC.mint,   wain: "#2fa383", fa: "#dff0ea", fb: "#b9d9cd" },
    lab_passage:         { acc: FP_ACC.cyan,   wain: "#3d93a0", fa: "#cfdadd", fb: "#a9bcc2" },
    observation_deck:    { acc: FP_ACC.blue,   wain: "#4a7fb0", fa: "#dae5ef", fb: "#b8c9da" },
    arena:               { acc: FP_ACC.amber,  wain: "#3a3532", fa: "#4a4540", fb: "#3f3a36", dark: true },
    catwalks:            { acc: FP_ACC.amber,  wain: "#6d8791", fa: "#9db1ba", fb: "#869ba5" },
    nest_area:           { acc: FP_ACC.violet, wain: "#3a3532", fa: "#4a4540", fb: "#3f3a36", dark: true },
};
function _fpRoomStyle(id) { return FP_ROOM_STYLE[id] || FP_ROOM_STYLE.crystal_chamber; }
function _fpAcc(id) { return _fpRoomStyle(id).acc; }

// the floor of a room: its two tiles, fine seams, and a NEON SEAM in the room's accent on every fourth tile line (the arena's and the catwalks' are quieter)
function _fpStyleFloorFor(id) {
    const R = _fpRoomStyle(id), dark = !!R.dark;
    // a SIMPLE floor: one flat tone per room (no checker), faint tile lines, and (only in the dark earth floors) a few pits. No neon seams and no hazard stripes on floors.
    return { base: R.fa, alt: null, a: 1, mark: (h, o, x, y) => {
        if (dark) { if (h % 4 === 0) o.push({ t: "C", c: "rgba(20,16,14,0.28)", u: ((h >>> 2) % 9 - 4) / 10, v: ((h >>> 5) % 9 - 4) / 10, r: 0.06 + (h % 4) * 0.02 }); if (h % 13 === 0) o.push({ t: "L", c: "rgba(15,12,10,0.4)", w: 2, p: [-0.35, -0.2, -0.05, 0.1] }, { t: "L", c: "rgba(15,12,10,0.4)", w: 2, p: [-0.05, 0.1, 0.25, 0.35] }); return; }
        o.push({ t: "L", c: "rgba(61,120,135,0.2)", w: 1, p: [-0.5, -0.5, 0.5, -0.5] }, { t: "L", c: "rgba(61,120,135,0.2)", w: 1, p: [-0.5, -0.5, -0.5, 0.5] });
        if (h % 19 === 0) o.push({ t: "C", c: "rgba(105,135,125,0.14)", u: ((h >>> 3) % 7 - 3) / 10, v: ((h >>> 6) % 7 - 3) / 10, r: 0.22 });   // a faint discoloration
    } };
}

// ── the toon prism for a cell of a solid prop: only the exposed faces, one bold outline round the exposed silhouette ──
function _fpSPrism(it, h, top, sideY, sideX, lw) {
    const x = it.x, y = it.y, P = _fpP, w = lw || 3.5, ink = FP_PAL.ink, t = [P(x - 0.5, y - 0.5, h), P(x + 0.5, y - 0.5, h), P(x + 0.5, y + 0.5, h), P(x - 0.5, y + 0.5, h)], b = [P(x - 0.5, y - 0.5, 0), P(x + 0.5, y - 0.5, 0), P(x + 0.5, y + 0.5, 0), P(x - 0.5, y + 0.5, 0)];
    if (it.sy) _fpQuad([t[3], t[2], b[2], b[3]], sideY, sideY, 1); if (it.sx) _fpQuad([t[2], t[1], b[1], b[2]], sideX, sideX, 1); _fpQuad(t, top, top, 1);
    const seg = (p, q, col, lw2) => { ctx.strokeStyle = col; ctx.lineWidth = lw2; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); };
    ctx.lineJoin = "round"; ctx.lineCap = "round";
    if (it.sy) seg([t[3][0] + 1, t[3][1] + 1], [t[2][0], t[2][1] + 1], "rgba(255,255,255,0.7)", Math.max(1.5, w * 0.45)); if (it.sx) seg([t[2][0], t[2][1] + 1], [t[1][0] - 1, t[1][1] + 1], "rgba(255,255,255,0.7)", Math.max(1.5, w * 0.45));   // the shine
    if (it.sx && it.sy) seg(t[2], b[2], "rgba(27,54,64,0.35)", Math.max(1.5, w * 0.5));   // the front corner crease
    if (it.top) seg(t[0], t[1], ink, w); if (it.lf) seg(t[0], t[3], ink, w);
    if (it.sx) { seg(t[1], t[2], ink, w); seg(b[1], b[2], ink, w); if (it.top) seg(t[1], b[1], ink, w); }
    if (it.sy) { seg(t[3], t[2], ink, w); seg(b[3], b[2], ink, w); if (it.lf) seg(t[3], b[3], ink, w); }
    ctx.lineJoin = "miter"; ctx.lineCap = "butt";
}
function _fpShine(x1, y1, x2, y2) { ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 2.5; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); ctx.lineCap = "butt"; }
function _fpBlob(cx, cy, rx, ry, col, lw) { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(cx, cy, rx, ry, 0, 0, 6.2832); ctx.fill(); ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = lw || 2.5; ctx.stroke(); }

// ── furniture of the other rooms ──
function _fpStylePropMore(it) {
    const k = it.kind, f = _fpFrame(), seed = it.seed || 0, x = it.x, y = it.y, P = _fpP, acc = _fpAcc(it.room), A = FP_PAL;
    if (k === "reception_desk") {   // a long front desk: a pale top, a teal front with a glowing accent strip
        _fpSPrism(it, 36, A.caseLit, A.teal, A.tealLit, 3.5); if (it.sy) { _fpFaceY(it, 0.02, 0.98, 6, 30, "rgba(27,54,64,0.12)", null); _fpFaceY(it, 0.02, 0.98, 24, 28, acc, null); }
    } else if (k === "computer_desk") {   // a desk with chunky monitors (every third cell) on it
        _fpSPrism(it, 30, A.cap, A.case, A.caseLit, 3.5);
        if (it.sy) { _fpFaceY(it, 0.08, 0.92, 4, 12, "#12323a", null); const kb = P(x, y + 0.22, 31); ctx.fillStyle = A.wallLit; ctx.fillRect(kb[0] - 9, kb[1] - 2, 18, 4); ctx.strokeStyle = A.ink; ctx.lineWidth = 1.5; ctx.strokeRect(kb[0] - 9, kb[1] - 2, 18, 4); }
        if (seed % 3 === 0) { _fpSBox(x - 0.32, y - 0.2, x + 0.32, y + 0.12, 30, 56, A.caseLit, A.case, _fpShade(A.caseLit, 0.93), 3); const q = [P(x - 0.27, y + 0.12, 34), P(x + 0.27, y + 0.12, 34), P(x + 0.27, y + 0.12, 52), P(x - 0.27, y + 0.12, 52)], pul = 0.8 + 0.2 * Math.sin(f * 0.05 + seed); _fpQuad(q, A.ink, A.ink, 1); _fpQuad([P(x - 0.23, y + 0.12, 36), P(x + 0.23, y + 0.12, 36), P(x + 0.23, y + 0.12, 50), P(x - 0.23, y + 0.12, 50)], _fpRgba(acc, 0.45 + 0.2 * pul), null); _fpShine(q[3][0] + 4, q[3][1] + 4, q[3][0] + 11, q[3][1] + 2); }
    } else if (k === "server_rack") {   // a tall dark rack: panel lines and blinking lamps in the accent colours
        _fpSPrism(it, 66, A.tealLit, A.tealDark, _fpShade(A.tealDark, 1.15), 3.5);
        const blink = (n) => (Math.floor(f / 18 + seed + n * 5) % 5 === 0);
        if (it.sy) for (let r = 0; r < 4; r++) { _fpFaceY(it, 0.1, 0.9, 8 + r * 13, 17 + r * 13, "rgba(255,255,255,0.08)", "rgba(10,30,38,0.7)"); _fpFaceY(it, 0.68, 0.8, 11 + r * 13, 14 + r * 13, blink(r) ? A.amber : acc, null); _fpFaceY(it, 0.16, 0.5, 12 + r * 13, 14 + r * 13, "rgba(10,30,38,0.6)", null); }
        if (it.sx) for (let r = 0; r < 4; r++) _fpFaceX(it, 0.12, 0.88, 8 + r * 13, 17 + r * 13, "rgba(255,255,255,0.06)", "rgba(10,30,38,0.6)");
    } else if (k === "lab_bench") {   // a bench with a white top and toon glassware
        _fpSPrism(it, 34, A.cap, A.case, A.caseLit, 3.5); const m = seed % 7, tp = P(x, y, 35);
        if (m === 0) { _fpBlob(tp[0], tp[1] - 5, 5, 8, _fpRgba(acc, 0.8)); _fpShine(tp[0] - 2, tp[1] - 9, tp[0] - 2, tp[1] - 3); }
        else if (m === 2) { _fpBlob(tp[0], tp[1] - 5, 7, 6, A.violet); _fpBlob(tp[0], tp[1] - 12, 2.5, 5, A.cap, 2); }
        else if (m === 4) { ctx.fillStyle = A.tealDark; ctx.fillRect(tp[0] - 6, tp[1] - 15, 12, 12); ctx.strokeStyle = A.ink; ctx.lineWidth = 2; ctx.strokeRect(tp[0] - 6, tp[1] - 15, 12, 12); ctx.fillStyle = acc; ctx.fillRect(tp[0] - 2, tp[1] - 19, 4, 5); }
        else if (m === 5) for (let i = 0; i < 4; i++) { ctx.fillStyle = [A.cyan, A.violet, FP_ACC.mint, A.amber][i]; ctx.fillRect(tp[0] - 9 + i * 5, tp[1] - 8, 4, 8); ctx.strokeStyle = A.ink; ctx.lineWidth = 1.5; ctx.strokeRect(tp[0] - 9 + i * 5, tp[1] - 8, 4, 8); }
    } else if (k === "fume_hood") {   // a hood: a teal body, a big glass front with a shine, a vent on top
        _fpSPrism(it, 72, A.tealLit, A.teal, A.tealLit, 3.5); if (it.sy) { _fpFaceY(it, 0.08, 0.92, 10, 58, A.ink, null); _fpFaceY(it, 0.13, 0.87, 13, 55, "rgba(170,240,250,0.55)", null); _fpFaceY(it, 0.2, 0.34, 40, 52, "rgba(255,255,255,0.65)", null); _fpFaceY(it, 0.08, 0.92, 58, 68, A.tealDark, null); }
    } else if (k === "test_chamber") {   // a glass tube of glowing liquid on a dark base, bubbles rising
        const col = [FP_ACC.mint, A.cyan, A.violet][(it.id === "chamber_2" ? 1 : 0) + (seed & 1)];
        _fpStyleCyl(x, y, 0.4, 0, 8, A.tealDark, A.teal, A.tealLit, 3); const g = _fpStyleCyl(x, y, 0.34, 8, 70, _fpRgba(col, 0.55), "rgba(255,255,255,0.5)", _fpRgba(col, 0.35), 3.5);
        for (let i = 0; i < 2; i++) { const bt = P(x + (i ? 0.1 : -0.1), y + 0.05, 14 + ((f * 0.6 + seed * 7 + i * 25) % 40)); ctx.fillStyle = "rgba(255,255,255,0.8)"; ctx.beginPath(); ctx.arc(bt[0], bt[1], 2, 0, 6.2832); ctx.fill(); }
        _fpGlow(g.c1[0], g.c1[1] + 20, 26, col, 0.22);
    } else if (k === "tank" || k === "liquid_reserve") {   // a big glass vessel: a lit liquid, a glowing surface, a bold outline round the whole body
        const col = k === "tank" ? FP_ACC.mint : A.violet; _fpSPrism(it, 78, _fpRgba(col, 0.8), _fpShade(col, 0.7), _fpShade(col, 0.95), 4);
        const c = P(x, y, 78); ctx.fillStyle = "rgba(255,255,255," + (0.2 + 0.08 * Math.sin(f * 0.05 + x)) + ")"; ctx.beginPath(); ctx.ellipse(c[0], c[1], 18, 8, 0, 0, 6.2832); ctx.fill(); if (seed % 3 === 0) _fpGlow(c[0], c[1], 24, col, 0.22);
    } else if (k === "semi_truck") {   // a pale truck: a blue-gray body with a cyan stripe; missiles on the cargo cells
        _fpSPrism(it, 52, "#d2dde2", "#8fa3ad", "#aebdc5", 3.5); if (it.sy) _fpFaceY(it, 0, 1, 20, 26, A.cyan, null); if (it.sx) _fpFaceX(it, 0, 1, 20, 26, _fpShade(A.cyan, 0.7), null);
        if (it.cargo && Math.round(x * 3 + y * 5) % 4 === 0) { const q = P(x, y, 58); _fpBlob(q[0], q[1], 14, 6, A.cap, 2.5); ctx.fillStyle = A.amber; ctx.beginPath(); ctx.moveTo(q[0] + 14, q[1]); ctx.lineTo(q[0] + 24, q[1] + 2); ctx.lineTo(q[0] + 14, q[1] + 4); ctx.closePath(); ctx.fill(); ctx.strokeStyle = A.ink; ctx.lineWidth = 2; ctx.stroke(); }
    } else if (k === "pingpong") {   // a teal table with a white centre line, a net
        _fpSPrism(it, 26, A.tealLit, A.tealDark, A.teal, 3.5); if (it.sx) { const a = P(x, y - 0.5, 26), b = P(x, y + 0.5, 26); ctx.strokeStyle = A.cap; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); }
        const p = P(x + 0.5, y, 26), q = P(x + 0.5, y, 38); ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke();
    } else if (k === "couch") {   // a long sofa: seat cushions in the room's accent, a lighter back along the far side
        const col = [A.blue, A.violet][seed % 2]; _fpSPrism(it, 18, _fpShade(col, 1.1), _fpShade(col, 0.7), _fpShade(col, 0.9), 3.5); _fpSBox(x - 0.5, y - 0.5, x + 0.5, y - 0.26, 18, 40, _fpShade(col, 1.2), _fpShade(col, 0.8), _fpShade(col, 1), 3.5);
    } else if (k === "table") {   // a low table: a slab on four legs
        for (const [a, b] of [[-0.42, -0.42], [0.42, -0.42], [0.42, 0.42], [-0.42, 0.42]]) { const p = P(x + a, y + b, 0), q = P(x + a, y + b, 20); ctx.strokeStyle = A.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); ctx.strokeStyle = A.tealLit; ctx.lineWidth = 2; ctx.stroke(); }
        _fpSBox(x - 0.5, y - 0.5, x + 0.5, y + 0.5, 20, 26, A.cap, A.case, A.caseLit, 3.5);
    } else if (k === "beanbag") {   // a slouched beanbag in an accent colour
        const c = P(x, y, 8); _fpBlob(c[0], c[1], 20, 12, [A.cyan, A.violet, A.amber, FP_ACC.mint][seed % 4], 3); _fpShine(c[0] - 8, c[1] - 5, c[0] - 2, c[1] - 8);
    } else if (k === "vending") {   // a vending machine: a lit window of products in palette colours
        _fpSPrism(it, 66, A.tealLit, A.teal, A.tealLit, 3.5); if (it.sy) { _fpFaceY(it, 0.08, 0.92, 6, 62, A.ink, null); _fpFaceY(it, 0.12, 0.88, 28, 58, "#12323a", null); for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) _fpFaceY(it, 0.16 + c * 0.17, 0.27 + c * 0.17, 31 + r * 9, 37 + r * 9, [A.cyan, A.violet, A.amber, FP_ACC.mint, A.blue][(r * 4 + c + seed) % 5], null); _fpFaceY(it, 0.2, 0.8, 9, 18, A.ink, null); const g = P(x, y + 0.5, 44); _fpGlow(g[0], g[1], 30, acc, 0.16); }
    } else if (k === "cooler") {   // a water cooler: a pale body, a cyan bottle
        _fpSBox(x - 0.3, y - 0.3, x + 0.3, y + 0.3, 0, 30, A.caseLit, A.case, A.cap, 3); const b0 = P(x, y, 30), b1 = P(x, y, 58); _fpBlob(b0[0], (b0[1] + b1[1]) / 2, 11, 15, _fpRgba(A.cyan, 0.6), 3); _fpShine(b0[0] - 5, b1[1] + 8, b0[0] - 5, b1[1] + 18);
    } else if (k === "bin") { _fpStyleCyl(x, y, 0.24, 0, 22, A.teal, A.tealLit, A.tealDark, 3);
    } else if (k === "sink") {   // a washroom counter: a white top, a basin, a tap
        _fpSPrism(it, 34, A.cap, A.case, A.caseLit, 3.5); const t = P(x, y, 35); _fpBlob(t[0], t[1], 12, 6, A.tealLit, 2.5); ctx.strokeStyle = A.ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(t[0], t[1] - 6); ctx.lineTo(t[0], t[1] - 13); ctx.lineTo(t[0] + 4, t[1] - 13); ctx.stroke(); ctx.strokeStyle = A.cap; ctx.lineWidth = 1.5; ctx.stroke();
    } else if (k === "stall") {   // a stall: a teal partition with a door line and a lock lamp
        _fpSPrism(it, 58, A.tealLit, A.teal, A.tealLit, 3.5); if (it.sy) { _fpFaceY(it, 0.1, 0.9, 6, 52, "rgba(255,255,255,0.1)", "rgba(10,30,38,0.7)"); _fpFaceY(it, 0.42, 0.58, 28, 34, seed % 2 ? A.amber : acc, null); }
    } else if (k === "cart") {   // a lab trolley: two shelves, glassware, wheels
        _fpSBox(x - 0.4, y - 0.25, x + 0.4, y + 0.25, 0, 4, A.tealDark, A.tealDark, A.teal, 2.5); _fpSBox(x - 0.4, y - 0.25, x + 0.4, y + 0.25, 24, 28, A.cap, A.case, A.caseLit, 3); const t = P(x, y, 28); _fpBlob(t[0] - 6, t[1] - 6, 4, 7, _fpRgba(A.cyan, 0.8), 2); _fpBlob(t[0] + 6, t[1] - 5, 4, 6, A.violet, 2);
    } else if (k === "display_case") {   // a plinth, a glass case, a crystal exhibit in the case's own colour
        const col = it.id === "case_b" ? A.amber : it.id === "case_c" ? A.violet : A.cyan; _fpSPrism(it, 18, A.tealLit, A.tealDark, A.teal, 3.5); _fpSBox(x - 0.4, y - 0.4, x + 0.4, y + 0.4, 18, 56, "rgba(180,235,245,0.3)", "rgba(180,235,245,0.38)", "rgba(180,235,245,0.26)", 3.5);
        const c = P(x, y, 22); _fpCrystal(c[0], c[1], 22, 7, col, f, seed); _fpShine(c[0] - 14, P(x, y, 50)[1] + 4, c[0] - 11, P(x, y, 50)[1] + 14);
    } else if (k === "teleporter") {   // a pylon: a base, rings of light spinning round it, a glow
        _fpStyleCyl(x, y, 0.3, 0, 14, A.tealDark, A.teal, A.tealLit, 3.5); for (let i = 0; i < 3; i++) { const z = 22 + i * 14 + Math.sin(f * 0.05 + i) * 3, c = P(x, y, z); ctx.strokeStyle = A.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.ellipse(c[0], c[1], 14 - i * 2, 6 - i, 0, 0, 6.2832); ctx.stroke(); ctx.strokeStyle = _fpRgba(A.violet, 0.9); ctx.lineWidth = 3; ctx.stroke(); }
        const g = P(x, y, 40); _fpGlow(g[0], g[1], 26, A.violet, 0.2);
    } else if (k === "locker") {   // a tall locker: two doors, slits, handles
        _fpSPrism(it, 66, A.tealLit, A.teal, A.tealLit, 3.5); if (it.sy) for (let i = 0; i < 2; i++) { _fpFaceY(it, 0.04 + i * 0.5, 0.46 + i * 0.5, 4, 62, "rgba(255,255,255,0.1)", "rgba(10,30,38,0.7)"); _fpFaceY(it, 0.1 + i * 0.5, 0.4 + i * 0.5, 50, 55, "rgba(10,30,38,0.65)", null); _fpFaceY(it, 0.38 + i * 0.5, 0.42 + i * 0.5, 28, 36, A.cap, null); }
    } else if (k === "cabinet") {   // a cabinet: three drawers with handles
        _fpSPrism(it, 46, A.caseLit, A.case, A.cap, 3.5); if (it.sy) for (let r = 0; r < 3; r++) { _fpFaceY(it, 0.06, 0.94, 3 + r * 14, 15 + r * 14, "rgba(255,255,255,0.06)", "rgba(27,54,64,0.55)"); _fpFaceY(it, 0.4, 0.6, 8 + r * 14, 10 + r * 14, A.tealDark, null); }
    } else if (k === "speaker") {   // a PA speaker stack: a dark cabinet with two cones
        _fpSPrism(it, 52, A.tealLit, A.tealDark, _fpShade(A.tealDark, 1.15), 3.5); if (it.sy) for (const [z, r] of [[14, 1], [36, 0.75]]) { const c = P(x, y + 0.5, z); _fpBlob(c[0], c[1], 13 * r, 8.5 * r, A.ink, 2.5); ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(c[0], c[1], 8 * r, 5 * r, 0, 0, 6.2832); ctx.stroke(); }
    } else if (k === "spool") {   // a cable drum on its side
        const g = _fpStyleCyl(x, y, 0.42, 0, 26, A.tealLit, A.cap, A.caseLit, 3.5); const c = g.c1; _fpBlob(c[0], c[1], g.rx * 0.62, g.ry * 0.62, seed % 2 ? A.violet : A.cyan, 2.5); _fpBlob(c[0], c[1], g.rx * 0.18, g.ry * 0.18, A.ink, 1);
    } else if (k === "floodlight") {   // a pole with a bright lamp head
        const b = P(x, y, 0), t = P(x, y, 96); ctx.strokeStyle = A.ink; ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(t[0], t[1]); ctx.stroke(); ctx.strokeStyle = A.tealLit; ctx.lineWidth = 3; ctx.stroke(); _fpSBox(x - 0.26, y - 0.26, x + 0.26, y + 0.26, 0, 8, A.tealLit, A.tealDark, A.teal, 3);
        ctx.fillStyle = A.tealDark; ctx.fillRect(t[0] - 13, t[1] - 8, 26, 12); ctx.strokeStyle = A.ink; ctx.lineWidth = 3; ctx.strokeRect(t[0] - 13, t[1] - 8, 26, 12); for (let i = 0; i < 4; i++) { ctx.fillStyle = A.white; ctx.fillRect(t[0] - 10 + i * 6, t[1] - 5, 4, 6); } _fpGlow(t[0], t[1], 40, A.white, 0.4);
    } else if (k === "barrier") {   // a white barrier with amber stripes
        _fpSPrism(it, 30, A.cap, A.caseLit, A.case, 3.5); if (it.sy) for (let i = 0; i < 3; i++) _fpFaceY(it, 0.05 + i * 0.32, 0.25 + i * 0.32, 4, 26, i & 1 ? A.caseLit : A.amber, null);
    } else if (k === "telescope") {   // a scope on a stand
        const b = P(x, y, 0), t = P(x, y, 40); ctx.strokeStyle = A.ink; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(b[0] - 8, b[1] + 2); ctx.lineTo(t[0], t[1]); ctx.lineTo(b[0] + 8, b[1] + 2); ctx.stroke(); ctx.strokeStyle = A.tealLit; ctx.lineWidth = 2.5; ctx.stroke();
        ctx.strokeStyle = A.ink; ctx.lineWidth = 10; ctx.beginPath(); ctx.moveTo(t[0] - 14, t[1] - 4); ctx.lineTo(t[0] + 8, t[1] + 8); ctx.stroke(); ctx.strokeStyle = A.caseLit; ctx.lineWidth = 6; ctx.stroke(); ctx.strokeStyle = acc; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(t[0] + 8, t[1] + 8); ctx.lineTo(t[0] + 12, t[1] + 10); ctx.stroke(); ctx.lineCap = "butt";
    } else if (k === "toolbox") { _fpSBox(x - 0.32, y - 0.22, x + 0.32, y + 0.22, 0, 14, A.amber, _fpShade(A.amber, 0.7), _fpShade(A.amber, 0.88), 3);
    } else if (k === "chair") {   // a swivel chair: a star base, a seat, a backrest
        const b = P(x, y, 0), t = P(x, y, 20); ctx.strokeStyle = A.ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(b[0], b[1]); ctx.lineTo(t[0], t[1]); for (const a of [0, 1.26, 2.5, 3.8, 5.0]) { ctx.moveTo(b[0], b[1]); ctx.lineTo(b[0] + Math.cos(a) * 11, b[1] + Math.sin(a) * 5); } ctx.stroke();
        _fpSBox(x - 0.28, y - 0.28, x + 0.28, y + 0.28, 18, 23, A.tealLit, A.teal, A.tealLit, 3); _fpSBox(x - 0.28, y - 0.3, x + 0.28, y - 0.18, 23, 44, A.tealLit, A.teal, A.tealLit, 3);
    } else if (k === "desk") { _fpSPrism(it, 28, A.cap, A.case, A.caseLit, 3.5);
    } else if (k === "pallet") { _fpSPrism(it, 26, A.caseLit, A.case, A.cap, 3.5);
    } else if (k === "rail") { return false;
    } else return false;
    return true;
}

// ── glass: a pale sill, a tinted pane with shine streaks, a rail on top with an ink line, posts every two tiles, a neon seam along the sill ──
function _fpStyleGlass(it, H) {
    const ax = it.a[0], ay = it.a[1], dx = it.b[0] - ax, dy = it.b[1] - ay, P = (u, z) => _fpP(ax + dx * u, ay + dy * u, z), acc = _fpAcc(it.room), A = FP_PAL, sill = 14, rail = H - 7;
    _fpFill([P(0, 0), P(1, 0), P(1, sill), P(0, sill)], A.caseLit);
    _fpFill([P(0, sill), P(1, sill), P(1, rail), P(0, rail)], "rgba(150,230,242,0.22)", "rgba(150,230,242,0)");
    _fpFill([P(0.2, sill), P(0.32, sill), P(0.44, rail), P(0.32, rail)], "rgba(255,255,255,0.18)", "rgba(255,255,255,0)");   // a shine streak
    _fpFill([P(0, rail), P(1, rail), P(1, H), P(0, H)], A.cap);
    const s0 = P(0, sill), s1 = P(1, sill), t0 = P(0, H), t1 = P(1, H), b0 = P(0, 0), b1 = P(1, 0); ctx.lineCap = "round";
    ctx.strokeStyle = _fpRgba(acc, 0.2); ctx.lineWidth = 6; ctx.globalCompositeOperation = "lighter"; ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke(); ctx.globalCompositeOperation = "source-over";
    ctx.strokeStyle = acc; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s0[0], s0[1]); ctx.lineTo(s1[0], s1[1]); ctx.stroke();                                        // the neon seam
    ctx.strokeStyle = A.ink; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.moveTo(t0[0], t0[1]); ctx.lineTo(t1[0], t1[1]); ctx.stroke(); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke();
    if (it.i === 0 && Math.round(it.along) % 2 === 0 || it.i % 4 === 0) { ctx.strokeStyle = A.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(b0[0], b0[1]); ctx.lineTo(t0[0], t0[1]); ctx.stroke(); ctx.strokeStyle = A.cap; ctx.lineWidth = 3; ctx.stroke(); }   // a post
    ctx.lineCap = "butt";
}
// ── the steps at a door: toon treads, a lit nosing ──
function _fpStyleStair(it) { _fpSBox(it.x - 0.5, it.y - 0.5, it.x + 0.5, it.y + 0.5, 0, it.h, FP_PAL.caseLit, FP_PAL.teal, FP_PAL.tealLit, 3); const t = _fpP(it.x, it.y + 0.5, it.h), u = _fpP(it.x + 0.5, it.y + 0.5, it.h); ctx.strokeStyle = _fpAcc(it.room || "lab_hallway"); ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(_fpP(it.x - 0.5, it.y + 0.5, it.h)[0], _fpP(it.x - 0.5, it.y + 0.5, it.h)[1] + 1); ctx.lineTo(u[0], u[1] + 1); ctx.stroke(); }

// ── wall decor in the style: flat shapes, one ink outline, the room's accent for lights and screens ──
const _FPW = FP_PAL;
Object.assign(FP_STYLE_WALL, {
    poster: (it, f) => { const z0 = it.z || 26, z1 = z0 + (it.h || 34), pal = [[_FPW.teal, _FPW.cap], [_FPW.violet, _FPW.cap], [_FPW.blue, _FPW.white], [FP_ACC.mint, _FPW.ink], [_FPW.amber, _FPW.ink]][it.seed % 5]; _fpWQuad(it, 0.12, 0.88, z0 - 2, z1 + 2, _FPW.cap, _FPW.ink, 3); _fpWQuad(it, 0.18, 0.82, z0 + 2, z1 - 2, pal[0], null); _fpWQuad(it, 0.26, 0.74, z1 - 11, z1 - 6, pal[1], null); _fpWQuad(it, 0.26, 0.6, z1 - 17, z1 - 14, _fpRgba(pal[1], 0.7), null); },
    board: (it, f) => { const z0 = it.z || 30; _fpWQuad(it, 0.06, 0.94, z0, z0 + 34, _FPW.caseLit, _FPW.ink, 3); for (let k = 0; k < 4; k++) { const u = 0.12 + ((it.seed >>> k) % 6) * 0.13, zz = z0 + 5 + ((it.seed >>> (k + 3)) % 3) * 9; _fpWQuad(it, u, u + 0.12, zz, zz + 10, [_FPW.cyan, _FPW.violet, _FPW.amber, FP_ACC.mint][k], _FPW.ink, 1.5); } },
    whiteboard: (it, f) => { const z0 = it.z || 30; _fpWQuad(it, 0.06, 0.94, z0, z0 + 32, _FPW.cap, _FPW.ink, 3); for (let k = 0; k < 3; k++) _fpWLine(it, 0.14, z0 + 7 + k * 8, 0.14 + ((it.seed >>> k) % 5) * 0.14 + 0.2, z0 + 7 + k * 8, k & 1 ? _FPW.blue : _FPW.violet, 2.5); },
    exit_sign: (it, f) => { const z0 = it.z || 62; _fpWQuad(it, 0.2, 0.8, z0, z0 + 11, _FPW.ink, _FPW.ink, 3); _fpWQuad(it, 0.27, 0.73, z0 + 3, z0 + 8, _fpRgba(FP_ACC.mint, 0.7 + 0.25 * Math.sin(f * 0.05 + it.seed)), null); },
    clock: (it, f) => { const c = _fpWP(it, 0.5, it.z || 46); _fpBlob(c[0], c[1], 9, 9, _FPW.cap, 3); const ha = it.seed * 0.7; ctx.strokeStyle = _FPW.ink; ctx.lineWidth = 2; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + Math.cos(ha) * 4.5, c[1] + Math.sin(ha) * 4.5); ctx.moveTo(c[0], c[1]); ctx.lineTo(c[0] + Math.cos(ha * 2.3) * 6.5, c[1] + Math.sin(ha * 2.3) * 6.5); ctx.stroke(); ctx.lineCap = "butt"; },
    graffiti: (it, f) => { const c = _fpAcc(it.room), z0 = it.z || 28; ctx.lineCap = "round"; for (let k = 0; k < 5; k++) { const u0 = 0.14 + k * 0.15, s = (it.seed >>> k) % 3; _fpWLine(it, u0, z0 + 6 + s * 6, u0 + 0.09, z0 + 24 - s * 4, _FPW.ink, 6); _fpWLine(it, u0, z0 + 6 + s * 6, u0 + 0.09, z0 + 24 - s * 4, c, 3); } ctx.lineCap = "butt"; },
    mirror: (it, f) => { const z0 = it.z || 34; _fpWQuad(it, 0.08, 0.92, z0, z0 + 30, "rgba(170,235,245,0.7)", _FPW.ink, 3); _fpWQuad(it, 0.14, 0.4, z0 + 4, z0 + 26, "rgba(255,255,255,0.28)", null); },
    shelf: (it, f) => { const z0 = it.z || 22; for (let r = 0; r < 2; r++) { const zz = z0 + r * 24; _fpWQuad(it, 0.04, 0.96, zz, zz + 4, _FPW.tealLit, _FPW.ink, 2.5); for (let k = 0; k < 5; k++) { const u = 0.1 + k * 0.17, hh = 8 + ((it.seed >>> (k + r * 3)) % 3) * 4; _fpWQuad(it, u, u + 0.12, zz + 4, zz + 4 + hh, [_FPW.cyan, _FPW.violet, FP_ACC.mint, _FPW.amber, _FPW.blue][(k + r * 2 + it.seed) % 5], _FPW.ink, 1.5); } } },
    sign: (it, f) => { const z0 = it.z || 40, c = _fpAcc(it.room); _fpWQuad(it, 0.05, 0.95, z0, z0 + 18, _FPW.ink, _FPW.ink, 3); for (let k = 0; k < 5; k++) _fpWQuad(it, 0.12 + k * 0.16, 0.12 + k * 0.16 + 0.1, z0 + 5, z0 + 13, _fpRgba(c, 0.75 + 0.2 * Math.sin(f * 0.04 + k)), null); },
    cable_run: (it, f) => { for (let k = 0; k < 3; k++) { const u0 = 0.15 + k * 0.28, p = _fpWP(it, u0, 74), q = _fpWP(it, u0 + 0.04, 30 + k * 8), m = _fpWP(it, u0 + 0.14, 20 + k * 8); ctx.strokeStyle = _FPW.ink; ctx.lineWidth = 6; ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.quadraticCurveTo(q[0], q[1] - 8, m[0], m[1]); ctx.stroke(); ctx.strokeStyle = [_FPW.cyan, _FPW.violet, _FPW.blue][k]; ctx.lineWidth = 2.5; ctx.stroke(); } },
    window_blind: (it, f) => { const z1 = it.z || 70; for (let k = 0; k < 6; k++) _fpWQuad(it, 0.05, 0.95, z1 - 3 - k * 5, z1 - 1 - k * 5, _FPW.caseLit, _FPW.ink, 1.5); },
    // rock, steel and cave dressing
    crack: (it, f) => { const n = 2 + it.seed % 2; for (let k = 0; k < n; k++) { let u = 0.12 + (k + ((it.seed >>> k) % 4) * 0.1) * 0.28, z = 70 - (it.seed >>> (k + 2)) % 12; const pts = [[u, z]]; for (let i = 0; i < 5; i++) { u += (((it.seed >>> (i + k)) % 7) - 3) * 0.015; z -= 9 + ((it.seed >>> (i + 2)) % 6); pts.push([u, Math.max(2, z)]); } ctx.strokeStyle = _FPW.ink; ctx.lineWidth = 3; ctx.lineJoin = "round"; ctx.beginPath(); pts.forEach((q, i) => { const p = _fpWP(it, q[0], q[1]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke(); ctx.lineJoin = "miter"; } },
    vein: (it, f) => { const c = it.colour || _fpAcc(it.room), pul = 0.55 + 0.35 * Math.sin(f * 0.04 + it.seed); let u = 0.04, z = (it.z || 26) + (it.seed % 20); const pts = [[u, z]]; for (let i = 0; i < 8; i++) { u += 0.11; z += (((it.seed >>> i) % 9) - 4) * 2.6; pts.push([Math.min(0.97, u), Math.max(6, Math.min(66, z))]); } const path = () => { ctx.beginPath(); pts.forEach((q, i) => { const p = _fpWP(it, q[0], q[1]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke(); };
        ctx.lineJoin = "round"; ctx.strokeStyle = _FPW.ink; ctx.lineWidth = 6; path(); ctx.strokeStyle = _fpRgba(c, 0.5 + 0.5 * pul); ctx.lineWidth = 3; path(); ctx.lineJoin = "miter"; },
    beam: (it, f) => { const H = 74; for (const u of [0.04, 0.93]) _fpWQuad(it, u, u + 0.04, 0, H, _FPW.tealLit, _FPW.ink, 3); _fpWQuad(it, 0.02, 0.98, H - 9, H - 2, _FPW.teal, _FPW.ink, 3); _fpWLine(it, 0.08, 6, 0.93, H - 9, _FPW.ink, 5); _fpWLine(it, 0.08, 6, 0.93, H - 9, _FPW.caseLit, 2.5); },
    chain: (it, f) => { const n = 2 + it.seed % 2; for (let k = 0; k < n; k++) { const u = 0.15 + k * 0.3, len = 26 + ((it.seed >>> k) % 22), sway = Math.sin(f * 0.03 + it.seed + k) * 2; for (let l = 0; l < len / 6; l++) { const p = _fpWP(it, u + sway * 0.002 * l, 74 - l * 6); ctx.strokeStyle = _FPW.ink; ctx.lineWidth = 3.5; ctx.beginPath(); if (l & 1) ctx.ellipse(p[0], p[1], 1.6, 3.2, 0, 0, 6.2832); else ctx.ellipse(p[0], p[1], 3.2, 1.6, 0, 0, 6.2832); ctx.stroke(); } } },
    claw: (it, f) => { const z0 = it.z || 22; for (let k = 0; k < 4; k++) { const u = 0.3 + k * 0.07; _fpWLine(it, u, z0 + 40 - k * 2, u + 0.1, z0, _FPW.ink, 4); _fpWLine(it, u + 0.01, z0 + 40 - k * 2, u + 0.11, z0, _FPW.caseLit, 1.5); } },
    ooze_drip: (it, f) => { const c = it.colour || _FPW.violet; for (let k = 0; k < 3; k++) { const u = 0.15 + k * 0.28 + ((it.seed >>> k) % 5) * 0.01, len = 20 + ((it.seed >>> (k + 1)) % 36), top = 74 - ((it.seed >>> k) % 8); _fpWQuad(it, u, u + 0.045, top - len, top, _fpRgba(c, 0.7), _FPW.ink, 2.5); const p = _fpWP(it, u + 0.0225, top - len); _fpBlob(p[0], p[1], 3.4, 3.4, c, 2.5); const ph = ((f * 0.6 + k * 17 + it.seed) % 60) / 60, b = _fpWP(it, u + 0.0225, top - len * ph); ctx.fillStyle = _FPW.white; ctx.beginPath(); ctx.arc(b[0], b[1], 2, 0, 6.2832); ctx.fill(); } },
    lamp: (it, f) => { const c = _FPW.white, fl = it.h ? (0.55 + 0.45 * Math.sin(f * 0.13 + it.seed) * (Math.sin(f * 0.019 + it.seed) > 0.05 ? 1 : 0.15)) : 1, z = it.z || 52, p = _fpWP(it, 0.5, z), q = _fpWP(it, 0.5, z - 12); ctx.strokeStyle = _FPW.ink; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(q[0], q[1]); ctx.lineTo(p[0], p[1]); ctx.stroke(); ctx.fillStyle = _FPW.tealDark; ctx.fillRect(p[0] - 9, p[1] - 8, 18, 14); ctx.strokeStyle = _FPW.ink; ctx.lineWidth = 3; ctx.strokeRect(p[0] - 9, p[1] - 8, 18, 14); ctx.fillStyle = _fpRgba(c, 0.6 + 0.4 * Math.max(0, fl)); ctx.fillRect(p[0] - 6, p[1] - 5, 12, 8); _fpGlow(p[0], p[1], 46, c, 0.38 * Math.max(0, fl)); },
    ladder: (it, f) => { _fpWQuad(it, 0.3, 0.34, 0, 70, _FPW.tealLit, _FPW.ink, 2.5); _fpWQuad(it, 0.66, 0.7, 0, 70, _FPW.tealLit, _FPW.ink, 2.5); for (let z = 8; z < 70; z += 9) { _fpWLine(it, 0.32, z, 0.68, z, _FPW.ink, 5); _fpWLine(it, 0.32, z, 0.68, z, _FPW.caseLit, 2.5); } },
    scoreboard: (it, f) => { const z0 = it.z || 22, c = _fpAcc(it.room); _fpWQuad(it, 0.03, 0.97, z0, z0 + 46, "#12323a", _FPW.ink, 4); _fpWQuad(it, 0.08, 0.92, z0 + 36, z0 + 42, _fpRgba(c, 0.8 + 0.15 * Math.sin(f * 0.05)), null); for (let side = 0; side < 2; side++) for (let d = 0; d < 3; d++) { const u0 = 0.1 + side * 0.44 + d * 0.12, on = ((Math.floor(f / 40) + d * 3 + side * 5 + it.seed) % 4) > 0; _fpWQuad(it, u0, u0 + 0.09, z0 + 6, z0 + 30, on ? _fpRgba(c, 0.95) : _fpRgba(c, 0.2), null); } _fpWQuad(it, 0.47, 0.53, z0 + 14, z0 + 22, _FPW.white, null); },
    plate: (it, f) => { const z0 = it.z || 18, hh = it.h || 36; _fpWQuad(it, 0.06, 0.94, z0, z0 + hh, _FPW.wallDark, _FPW.ink, 3); _fpWLine(it, 0.06, z0 + hh * 0.5, 0.94, z0 + hh * 0.5, "rgba(27,54,64,0.4)", 2); for (const u of [0.1, 0.9]) for (const z of [z0 + 5, z0 + hh - 5]) { const p = _fpWP(it, u, z); ctx.fillStyle = _FPW.cap; ctx.beginPath(); ctx.arc(p[0], p[1], 2, 0, 6.2832); ctx.fill(); } },
    moss: (it, f) => { for (let k = 0; k < 5; k++) { const p = _fpWP(it, 0.1 + k * 0.18 + ((it.seed >>> k) % 5) * 0.01, 5 + ((it.seed >>> (k + 2)) % 4) * 7); _fpBlob(p[0], p[1], 8 + (k % 3) * 3, 4 + (k % 2) * 2, k & 1 ? _FPW.leaf : "#6cbf9f", 2.5); } },
    bulbs: (it, f) => { const n = Math.max(4, Math.round(Math.hypot(it.b[0] - it.a[0], it.b[1] - it.a[1]) * 1.6)), cols = [_FPW.cyan, _FPW.violet, _FPW.amber, FP_ACC.mint, _FPW.blue]; ctx.strokeStyle = _FPW.ink; ctx.lineWidth = 2.5; ctx.beginPath(); for (let k = 0; k <= n; k++) { const u = k / n, p = _fpWP(it, u, 68 - Math.sin(u * 3.1416) * 7); k ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); } ctx.stroke();
        for (let k = 0; k <= n; k++) { const u = k / n, p = _fpWP(it, u, 68 - Math.sin(u * 3.1416) * 7 - 2), on = (Math.floor(f / 24) + k + it.seed) % 6 !== 0; ctx.fillStyle = on ? cols[(k + it.seed) % 5] : _FPW.tealDark; ctx.beginPath(); ctx.arc(p[0], p[1], 3, 0, 6.2832); ctx.fill(); ctx.strokeStyle = _FPW.ink; ctx.lineWidth = 1.5; ctx.stroke(); if (on) _fpGlow(p[0], p[1], 8, cols[(k + it.seed) % 5], 0.3); } },
});
// the first six (written for the Crystal Chamber) take their lights and screens from the room's accent
Object.assign(FP_STYLE_WALL, {
    panel: (it, f) => { const z0 = it.z || 22, c = _fpAcc(it.room); _fpWQuad(it, 0.15, 0.85, z0, z0 + 30, _FPW.case, _FPW.ink, 2.5); _fpWQuad(it, 0.22, 0.78, z0 + 5, z0 + 17, "#12323a", null); _fpWLine(it, 0.28, z0 + 11, 0.72, z0 + 11, c, 2); const l = _fpWP(it, 0.5, z0 + 24); ctx.fillStyle = Math.floor(f / 30 + it.seed) % 4 === 0 ? _FPW.amber : c; ctx.beginPath(); ctx.arc(l[0], l[1], 3, 0, 6.2832); ctx.fill(); ctx.strokeStyle = _FPW.ink; ctx.lineWidth = 1; ctx.stroke(); },
    screen: (it, f) => { const z0 = it.z || 34, c = it.colour && it.colour !== "#6dff5a" ? _fpStyleCol("x", it.colour) : _fpAcc(it.room); _fpWQuad(it, 0.08, 0.92, z0, z0 + 28, _FPW.tealDark, _FPW.ink, 3); _fpWQuad(it, 0.14, 0.86, z0 + 4, z0 + 24, "#0d2a33", null); for (let k = 0; k < 6; k++) { const hh = 3 + 12 * (0.5 + 0.5 * Math.sin(f * 0.04 + k * 1.3 + it.seed)); _fpWQuad(it, 0.2 + k * 0.1, 0.27 + k * 0.1, z0 + 5, z0 + 5 + hh, k & 1 ? _FPW.blue : c, null); } },
    wall_light: (it, f) => { const z = it.z || 62, c = _fpAcc(it.room), fl = it.h ? (0.6 + 0.4 * Math.sin(f * 0.1 + it.seed) * (Math.sin(f * 0.017 + it.seed) > 0.1 ? 1 : 0.3)) : 1; _fpWQuad(it, 0.05, 0.95, z, z + 5, _FPW.tealDark, _FPW.ink, 2.5); _fpWQuad(it, 0.09, 0.91, z + 1, z + 4, _fpRgba(_FPW.white, 0.6 + 0.4 * Math.max(0, fl)), null); ctx.globalCompositeOperation = "lighter"; _fpWQuad(it, 0, 1, z - 20, z + 4, _fpRgba(c, 0.07 * Math.max(0, fl)), null); ctx.globalCompositeOperation = "source-over"; },
});
