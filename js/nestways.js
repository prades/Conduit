// ─────────────────────────────────────────────────────────
//  THE NEST'S WAYS THROUGH: a cracked wall a blast breaks, a resin seal acid eats, a boulder FLUX MOVE moves (docs/DOMAINS.md §2, 10; build 2026-11-12a)
// ─────────────────────────────────────────────────────────
// The owner, 2026-11-12: "ways for the player to use their utilities from their technicians to get around [...] including but not limited to blowing up barrels to bring down or break through different
// obstacles, or using flux move to move an object to get it out the way"; the Nest grown out as drawn (draft 6: "I like the nest"), its rules as drafted (DOMAINS.md §5, draft 7):
//   A CRACKED WALL   a solid of kind cracked_wall (a sliver across a tunnel, js/facilitymap.js): an explosive flask's BLAST within its reach (HAZARD.blastR, js/hazards.js) breaks it, for good.
//   A RESIN SEAL     a solid of kind resin_seal: a corrosive flask's ACID POOL touching it eats it away, for good.
//   Opened, each is a solid opened (js/facilityplay.js facilitySolidOpen: the way joins the room) and kept (saved: `nestWays`); a new game has them back. A flask that went off comes back after a minute
//   (as built), so a missed shot is tried again.
//   THE BOULDER      a prop of kind boulder with a `flux` field: FLUX MOVE moves it as it moves a crate (js/fluxmove.js, saved as `moved`); it is drawn here (a heap of the cave's brown stone).
// The looks are the agent's, provisional (drawn in the facility's own way, not baked).
let _nw = { open: new Set(), fx: [] };   // open: the ids broken or eaten through; fx: { x, y, t0, kind } for the moment it gives way
const NEST_WAYS = { fxFrames: 48 };
function nestWaysReset() { _nw = { open: new Set(), fx: [] }; }
function _nwFrame() { return typeof frame !== "undefined" ? frame : 0; }
function nestWaySolids(kind) { return typeof _fp !== "undefined" && _fp && _fp.F ? _fp.F.solids.filter(s => s.kind === kind) : []; }
function _nwBox(s) { if (s.bb) return s.bb; const xs = s.poly.map(q => q[0]), ys = s.poly.map(q => q[1]); return [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]; }
function _nwDist(s, x, y) { const b = _nwBox(s); return Math.hypot(Math.max(b[0] - x, 0, x - b[2]), Math.max(b[1] - y, 0, y - b[3])); }
function nestWayOpen(id) { return _nw.open.has(id); }

// it gives way: the solid opens (the floor behind joins the room), it is kept, a burst where it stood and the words over it
function _nwGive(s, how) {
    if (!s || _nw.open.has(s.id)) return false;
    _nw.open.add(s.id); if (typeof facilitySolidOpen === "function") facilitySolidOpen(s.id); else s.open = true;
    const b = _nwBox(s), cx = (b[0] + b[2]) / 2, cy = (b[1] + b[3]) / 2, f = _nwFrame();
    _nw.fx.push({ x: cx, y: cy, t0: f, kind: s.kind });
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: cx, y: cy, text: how, color: s.kind === "resin_seal" ? "#9cff5a" : "#ffb070", life: 90, vy: -0.03 });
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: cx, y: cy, color: s.kind === "resin_seal" ? "#8cff3a" : "#c99a6a", radius: 1.2, life: 24, element: s.kind === "resin_seal" ? "toxic" : "earth" });
    if (typeof facilitySaveWrite === "function") try { facilitySaveWrite(); } catch (e) {}
    return true;
}
// an explosive flask's blast at (cx, cy) (js/hazards.js _hzBlast): every cracked wall within its reach breaks
function nestWaysBlast(cx, cy, R) { let n = 0; for (const s of nestWaySolids("cracked_wall")) if (!_nw.open.has(s.id) && !s.open && _nwDist(s, cx, cy) <= R) n += _nwGive(s, "THE ROCK GIVES WAY") ? 1 : 0; return n; }   // (one drilled through already is open: no blast gives it way again)
// an acid pool (js/hazards.js): every resin seal it touches is eaten away
function nestWaysPool(p) { let n = 0; for (const s of nestWaySolids("resin_seal")) if (!_nw.open.has(s.id) && _nwDist(s, p.x, p.y) <= p.r + 0.05) n += _nwGive(s, "THE ACID EATS THE RESIN") ? 1 : 0; return n; }

// ── SAVING ──
function nestWaysSnapshot() { return Array.from(_nw.open); }
function nestWaysApply(list) {   // (a game saved before has none open; an id the map no longer has is dropped)
    _nw.open = new Set(); _nw.fx = [];
    for (const id of (Array.isArray(list) ? list : [])) { if (typeof id !== "string") continue; const s = _fp && _fp.F ? _fp.F.solids.find(q => q.id === id && (q.kind === "cracked_wall" || q.kind === "resin_seal")) : null; if (!s) continue; _nw.open.add(id); if (typeof facilitySolidOpen === "function") facilitySolidOpen(id); else s.open = true; }
}

// ── DRAWING ──
// each sliver is drawn on its long middle line, as wall decor is (js/facilitydecor.js adds these items after the rubble's): the wall standing, or once it gave way what is left of it
function nestWaysItems(F) {
    const out = [];
    for (const s of F.solids) {
        if (s.kind !== "cracked_wall" && s.kind !== "resin_seal") continue;
        if ((F.rubble || []).some(r => r.solid === s.id)) continue;   // (cracked rock that is a rubble's choke too, the Nest's since build 2026-11-13o: drawn as the rubble's modelled rock, js/techabilities.js techDrawRubbleOn)
        const b = _nwBox(s), wide = b[2] - b[0] >= b[3] - b[1], my = (b[1] + b[3]) / 2, mx = (b[0] + b[2]) / 2, a = wide ? [b[0], my] : [mx, b[1]], c = wide ? [b[2], my] : [mx, b[3]], end = a[0] + a[1] > c[0] + c[1] ? a : c;
        out.push({ type: "fp", fp: "wdecor", room: s.room, kind: s.kind, solid: s.id, x: mx, y: my, a, b: c, id: s.id, base: facilityRoomHeight(s.room, F) * FP_ELEV_PX, depth: end[0] + end[1] + 0.03, seed: _fpHash(Math.round(mx * 4), Math.round(my * 4)) });
    }
    return out;
}
function _nwHash(n) { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); }
const NEST_WAY_KINDS = {
    // A CRACKED WALL: a slab of the cave's rock across the tunnel, its top broken, glowing seams of heat in its cracks (a blast will do it); broken, a spill of stones along its foot
    cracked_wall: (it, f) => {
        const open = _nw.open.has(it.solid), sd = it.seed || 7, H = 74;
        if (open) { for (let k = 0; k < 6; k++) { const u = 0.08 + k * 0.16 + _nwHash(sd + k) * 0.06, p = _fpWP(it, u, 0); ctx.fillStyle = k % 2 ? "#5a4636" : "#6e5238"; ctx.strokeStyle = "rgba(20,12,6,0.8)"; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 3, 7 + _nwHash(sd + k * 3) * 5, 4 + _nwHash(sd + k * 5) * 2, 0, 0, 6.2832); ctx.fill(); ctx.stroke(); }
            _nwGiveFx(it, f); return; }
        const top = []; for (let i = 0; i <= 10; i++) top.push([i / 10, H - (i % 2 ? 12 : 0) - _nwHash(sd + i) * 14]);
        const pts = [_fpWP(it, 0, 0), _fpWP(it, 1, 0)].concat(top.slice().reverse().map(q => _fpWP(it, q[0], q[1])));
        _fpQuad(pts, "#5c4733", "rgba(20,12,6,0.85)", 2);
        _fpWQuad(it, 0, 1, 0, 10, "rgba(30,20,12,0.35)", null);   // its foot in shadow
        for (let k = 0; k < 4; k++) { const u0 = 0.06 + k * 0.24 + _nwHash(sd + k * 7) * 0.08; _fpWQuad(it, u0, u0 + 0.12, 18 + _nwHash(sd + k) * 20, 30 + _nwHash(sd + k) * 26, "rgba(120,92,64,0.45)", null); }   // the rock's lighter faces
        const glow = 0.55 + 0.35 * Math.sin(f * 0.06 + sd);
        for (let k = 0; k < 3; k++) { let u = 0.2 + k * 0.3, z = H - 16; const c = [[u, z]]; for (let i = 0; i < 5; i++) { u += (_nwHash(sd + k * 11 + i) - 0.5) * 0.08; z -= 9 + _nwHash(sd + i * 3 + k) * 6; c.push([u, Math.max(4, z)]); }
            for (const [col, w] of [["rgba(0,0,0,0.85)", 3], ["rgba(255," + Math.round(120 + 60 * glow) + ",40," + (0.55 + 0.35 * glow).toFixed(2) + ")", 1.4]]) { ctx.strokeStyle = col; ctx.lineWidth = w; ctx.beginPath(); c.forEach((q, i) => { const p = _fpWP(it, q[0], q[1]); i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]); }); ctx.stroke(); } }
        if (typeof _fpGlow === "function") { const c = _fpWP(it, 0.5, 30); _fpGlow(c[0], c[1], 34, "#ff8a3a", 0.12 * glow); }
    },
    // A RESIN SEAL: the colony's resin run across the tunnel from floor to roof, glossy amber-green, faintly lit from inside; eaten through, a low ring of it left on the floor
    resin_seal: (it, f) => {
        const open = _nw.open.has(it.solid), sd = it.seed || 5, H = open ? 10 : 80, T = typeof _fpNestTone === "function" ? _fpNestTone(f) : { g: 0.5 };
        _fpWQuad(it, 0, 1, 0, H, "rgba(" + (96 + Math.round(30 * T.g)) + "," + (118 + Math.round(40 * T.g)) + ",46," + (open ? 0.45 : 0.82) + ")", "rgba(30,36,14,0.8)", 1.5);
        if (open) { _nwGiveFx(it, f); return; }
        for (let k = 0; k < 6; k++) { const u0 = k / 6 + _nwHash(sd + k) * 0.05, z1 = 40 + _nwHash(sd + k * 3) * 36; _fpWQuad(it, u0, Math.min(1, u0 + 0.12), 6, z1, "rgba(150,180,70,0.35)", null); _fpWLine(it, u0 + 0.03, z1 - 4, u0 + 0.03, 8, "rgba(230,255,170,0.3)", 1.2); }   // sheets and their sheen
        for (let k = 0; k < 4; k++) { const u = 0.15 + k * 0.23, z = H - 2; _fpWQuad(it, u, u + 0.03, z, z + 6 + _nwHash(sd + k) * 8, "rgba(120,140,52,0.6)", null); }   // drips at its top
        if (typeof _fpGlow === "function") { const c = _fpWP(it, 0.5, 36), ph = 0.7 + 0.3 * Math.sin(f * 0.05 + sd); _fpGlow(c[0], c[1], 40, "#8cff5a", 0.18 * ph); }
    },
};
for (const k in NEST_WAY_KINDS) FP_WALL_KINDS[k] = NEST_WAY_KINDS[k];
// the moment it gives way: a puff of dust (or a hiss of acid) rising from where it stood
function _nwGiveFx(it, f) {
    const e = _nw.fx.find(q => Math.abs(q.x - it.x) < 0.01 && Math.abs(q.y - it.y) < 0.01); if (!e) return;
    const t = (f - e.t0) / NEST_WAYS.fxFrames; if (t >= 1) { _nw.fx = _nw.fx.filter(q => q !== e); return; }
    const col = e.kind === "resin_seal" ? "140,255,90" : "190,160,120";
    for (let k = 0; k < 7; k++) { const u = 0.1 + k * 0.13, p = _fpWP(it, u, 10 + t * 50 + _nwHash(k) * 20); ctx.fillStyle = "rgba(" + col + "," + (0.5 * (1 - t)).toFixed(2) + ")"; ctx.beginPath(); ctx.arc(p[0], p[1], 6 + t * 10, 0, 6.2832); ctx.fill(); }
}
// THE BOULDER (drawn on the last of its tiles, so the floor under its other tile is not painted over it): a heap of dark stone filling the tunnel's narrow middle
function nestBoulderDraw(it) {
    const s = typeof _fp !== "undefined" && _fp && _fp.F ? _fp.F.solids.find(q => q.id === it.id) : null; if (!s || !s.bb) return false;
    const last = Math.abs(it.x + it.y - (s.bb[2] - 0.5 + s.bb[3] - 0.5)) < 0.01; if (!last) return true;
    const cx = (s.bb[0] + s.bb[2]) / 2, cy = (s.bb[1] + s.bb[3]) / 2, wide = s.bb[2] - s.bb[0] >= s.bb[3] - s.bb[1], sd = it.seed || 9;
    // a stone of the cave's brown rock (the coral crab's stones are its own: js/techabilities.js _techStone): its body in shade, its rounded top lit, a glint
    const stone = (x, y, rx, ry, k) => { const p = _fpP(x, y, 0), h = ry * 0.9, top = ["#6e5238", "#5f4630", "#7a5c40"][k % 3];
        ctx.strokeStyle = "rgba(14,9,5,0.9)"; ctx.lineWidth = 2; ctx.fillStyle = "#2e2218"; ctx.beginPath(); ctx.ellipse(p[0], p[1] - h * 0.45, rx, ry + h * 0.45, 0, 0, 6.2832); ctx.fill(); ctx.stroke();
        ctx.fillStyle = top; ctx.beginPath(); ctx.ellipse(p[0], p[1] - h, rx * 0.94, ry * 0.92, 0, 0, 6.2832); ctx.fill();
        ctx.fillStyle = "rgba(255,236,210,0.12)"; ctx.beginPath(); ctx.ellipse(p[0] - rx * 0.22, p[1] - h - ry * 0.25, rx * 0.5, ry * 0.4, 0, 0, 6.2832); ctx.fill(); };
    const sh = _fpP(cx, cy, 0); ctx.fillStyle = "rgba(8,6,4,0.45)"; ctx.beginPath(); ctx.ellipse(sh[0], sh[1], 44, 18, 0, 0, 6.2832); ctx.fill();   // its shadow
    const dx = wide ? 0.45 : 0, dy = wide ? 0 : 0.45;
    stone(cx - dx, cy - dy, 26, 22, 0); stone(cx + dx, cy + dy, 28, 24, 1); stone(cx + (_nwHash(sd) - 0.5) * 0.3, cy + (_nwHash(sd + 1) - 0.5) * 0.3, 22, 26, 0);
    return true;
}
