// ─────────────────────────────────────────────────────────
//  THE FACILITY — compiles the authored map (js/facilitymap.js) into collision and navigation, validates it, and draws the debug overlay
// ─────────────────────────────────────────────────────────
// Data and logic are apart on purpose: this file never names a room. It reads FACILITY_MAP and builds, in WORLD TILES (sketch pixels / px_per_tile):
//   walls       every edge of every room outline, minus the CONFIRMED openings cut into it
//   solids      props with collision (benches, machines, the arena's circular structures), the outer path (as a no-go region)
//   rooms       the walkable outlines; a point is walkable only inside one, and outside every solid
//   nav graph   rooms joined by CONFIRMED connections (candidates can be switched in to look at, never by default)
// The arena's and the nest area's perimeters are real collision, and nothing outside every room is walkable. Nothing here invents a doorway.
// Nothing in the game calls the movement helpers yet: this is the map, its rules and its debug view, for the facility to be wired into play once its
// geometry has been confirmed (docs/FACILITY.md).

const FAC_EPS = 1e-6;
let _facility = null, _facilitySig = "";

function facilityScale() { return (FACILITY_MAP.scale && FACILITY_MAP.scale.px_per_tile) || 20; }
// SNAP (play): every corner is moved onto the tile grid (a tile's centre is an integer, so its edges are at k + 0.5), so a wall always runs along tile edges and a floor tile is
// wholly inside or outside a room. The authored data is never changed; this only affects the copy built with { snap: true }.
let _facSnap = false;
function _facP(pt) { const s = facilityScale(); let x = pt[0] / s, y = pt[1] / s; if (_facSnap) { x = Math.round(x - 0.5) + 0.5; y = Math.round(y - 0.5) + 0.5; } return [x, y]; }
function _facPoly(poly) { return poly.map(_facP); }

// ── geometry ──
function facilityPointInPoly(x, y, poly) {
    let inside = false;
    for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
        const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
        if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
}
function _facCross(ax, ay, bx, by, cx, cy) { return (bx - ax) * (cy - ay) - (by - ay) * (cx - ax); }
// A proper crossing: the two segments cross at a point interior to both (touching, or running along one another, is not a crossing).
function facilitySegmentsCross(a, b, c, d) {
    const d1 = _facCross(a[0], a[1], b[0], b[1], c[0], c[1]), d2 = _facCross(a[0], a[1], b[0], b[1], d[0], d[1]);
    const d3 = _facCross(c[0], c[1], d[0], d[1], a[0], a[1]), d4 = _facCross(c[0], c[1], d[0], d[1], b[0], b[1]);
    return ((d1 > FAC_EPS && d2 < -FAC_EPS) || (d1 < -FAC_EPS && d2 > FAC_EPS)) && ((d3 > FAC_EPS && d4 < -FAC_EPS) || (d3 < -FAC_EPS && d4 > FAC_EPS));
}
function _facDistToLine(a, b, p) { const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1; return Math.abs((p[0] - a[0]) * dy - (p[1] - a[1]) * dx) / l; }
function _facSegPointDist(a, b, x, y) {
    const dx = b[0] - a[0], dy = b[1] - a[1], l2 = dx * dx + dy * dy;
    const t = l2 ? Math.max(0, Math.min(1, ((x - a[0]) * dx + (y - a[1]) * dy) / l2)) : 0;
    return Math.hypot(a[0] + dx * t - x, a[1] + dy * t - y);
}
function _facPolyArea(poly) { let s = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) s += poly[j][0] * poly[i][1] - poly[i][0] * poly[j][1]; return s / 2; }

// Cut the CONFIRMED openings out of a wall segment: an opening is a segment lying on the wall's line; the part of the wall it covers is removed.
function _facTrim(a, b, openings) {
    let pieces = [[0, 1]];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy) || 1;
    for (const o of openings) {
        const oa = o.a, ob = o.b;
        if (_facSegPointDist(a, b, oa[0], oa[1]) > 0.05 || _facSegPointDist(a, b, ob[0], ob[1]) > 0.05) continue;   // not on this wall
        let t0 = ((oa[0] - a[0]) * dx + (oa[1] - a[1]) * dy) / (len * len), t1 = ((ob[0] - a[0]) * dx + (ob[1] - a[1]) * dy) / (len * len);
        if (t0 > t1) [t0, t1] = [t1, t0];
        const next = [];
        for (const [p0, p1] of pieces) {
            if (t1 <= p0 || t0 >= p1) { next.push([p0, p1]); continue; }
            if (t0 > p0) next.push([p0, t0]);
            if (t1 < p1) next.push([t1, p1]);
        }
        pieces = next;
    }
    return pieces.filter(p => (p[1] - p[0]) * len > 0.02).map(p => [[a[0] + dx * p[0], a[1] + dy * p[0]], [a[0] + dx * p[1], a[1] + dy * p[1]]]);
}

// ── compile ──
// `extra` lets a test (or the debug view) add openings/connections WITHOUT touching the authored data: { openings: [...], connections: [...] }.
function facilityBuild(extra) {
    const ex = extra || {}; _facSnap = !!ex.snap;
    try { return _facilityBuild(ex); } finally { _facSnap = false; }
}
function _facilityBuild(ex) {
    const M = FACILITY_MAP;
    const closed = ex.closed || [];   // rooms whose openings are CLOSED in this copy (the validator's sealed-room test)
    const widen = (o) => { const pa = _facP(o.a), pb = _facP(o.b), l = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]); if (_facSnap && l > 0 && l < 2) { pb[0] = pa[0] + (pb[0] - pa[0]) / l * 2; pb[1] = pa[1] + (pb[1] - pa[1]) / l * 2; } return [pa, pb]; };   // a door is at least two tiles wide on the grid
    const openings = (M.openings || []).concat(ex.openings || []).filter(o => !closed.some(id => (o.rooms || []).includes(id))).map(o => { const [wa, wb] = widen(o); return { id: o.id, a: wa, b: wb, rooms: o.rooms || [], door: ("door" in o) ? o.door : (M.door_type || "sliding_access_door") }; });
    const rooms = M.rooms.map(r => ({ id: r.id, label: r.label, level: r.level, status: r.status, poly: _facPoly(r.polygon), edgeKinds: r.edge_kinds || null, boundary: r.boundary_type || null, objects: (r.objects || []).map(o => Object.assign({}, o, { at: _facP(o.at) })), raw: r }));
    const walls = [];
    for (const r of rooms) {
        const p = r.poly;
        for (let i = 0; i < p.length; i++) {
            const a = p[i], b = p[(i + 1) % p.length], kind = r.edgeKinds ? r.edgeKinds[i] : "wall";
            for (const seg of _facTrim(a, b, openings)) walls.push({ a: seg[0], b: seg[1], room: r.id, kind, arena: !!r.raw.boundary_blocks_movement });
        }
    }
    // windows: glass stretches of wall. They stay in `walls` (solid to movement); a piece lying on a window is marked so the debug view can draw it as glass.
    const windows = (M.windows || []).map(w => ({ id: w.id, a: _facP(w.a), b: _facP(w.b), rooms: w.rooms || [] }));
    // Split any wall piece a window only partly covers, so the glass part is its own piece (a long wall can be glass along one stretch only).
    for (let i = walls.length - 1; i >= 0; i--) {
        const wl = walls[i], dx = wl.b[0] - wl.a[0], dy = wl.b[1] - wl.a[1], len = Math.hypot(dx, dy) || 1;
        for (const w of windows) {
            if (w.rooms.length && !w.rooms.includes(wl.room)) continue;
            if (_facDistToLine(wl.a, wl.b, w.a) > 0.05 || _facDistToLine(wl.a, wl.b, w.b) > 0.05) continue;
            let t0 = ((w.a[0] - wl.a[0]) * dx + (w.a[1] - wl.a[1]) * dy) / (len * len), t1 = ((w.b[0] - wl.a[0]) * dx + (w.b[1] - wl.a[1]) * dy) / (len * len);
            if (t0 > t1) [t0, t1] = [t1, t0]; t0 = Math.max(0, t0); t1 = Math.min(1, t1); if ((t1 - t0) * len < 0.02) continue;
            const at = t => [wl.a[0] + dx * t, wl.a[1] + dy * t], parts = [];
            if (t0 > 1e-6) parts.push(Object.assign({}, wl, { a: at(0), b: at(t0), window: undefined }));
            parts.push(Object.assign({}, wl, { a: at(t0), b: at(t1), window: w.id }));
            if (t1 < 1 - 1e-6) parts.push(Object.assign({}, wl, { a: at(t1), b: at(1), window: undefined }));
            walls.splice(i, 1, ...parts); break;
        }
    }
    const fixtures = (M.fixtures || []).map(f => ({ id: f.id, type: f.type, room: f.room, edge: f.edge, a: _facP(f.a), b: _facP(f.b), status: f.status, note: f.note }));
    const s = facilityScale();
    // the dressing: floor coverings and decor (paint and light), compiled to tiles; positions are snapped like every other point
    const floors = (M.floors || []).map(f => ({ room: f.room, style: f.style, colour: f.colour || null }));
    const rawP = p => [p[0] / facilityScale(), p[1] / facilityScale()];   // floor decor is not snapped to the grid (a ring or a cable can lie across it); wall decor and rugs are, to lie on an edge / fill whole tiles
    const decor = (M.decor || []).map(d => { const o = Object.assign({}, d), wall = FAC_WALL_DECOR.has(d.kind), axis = d.a && d.b && (Math.abs(d.a[0] - d.b[0]) < 1e-6 || Math.abs(d.a[1] - d.b[1]) < 1e-6), pt = wall && axis ? _facP : rawP;   // (decor on a diagonal wall is given on the line itself, not snapped)
        for (const k of ["at", "a", "b"]) if (Array.isArray(d[k])) o[k] = pt(d[k]);   // (a ring or a light also has a number `a`: its alpha)
        if (d.rect) { const a = _facP([d.rect[0], d.rect[1]]), b = _facP([d.rect[2], d.rect[3]]); o.rect = [Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.max(a[0], b[0]), Math.max(a[1], b[1])]; }
        if (d.path) o.path = d.path.map(pt); if (d.radius) o.radius = d.radius / s; return o; });
    const solids = (M.props || []).map(pr => {
        if (pr.shape === "circle") return { id: pr.id, room: pr.room, shape: "circle", at: _facP(pr.at), r: pr.radius / s, cargo: pr.cargo || null, provisional: !!pr.provisional_collision, status: pr.status, kind: pr.kind || null };
        const [x0, y0, x1, y1] = pr.rect; return { id: pr.id, room: pr.room, shape: "rect", poly: [[x0, y0], [x1, y0], [x1, y1], [x0, y1]].map(_facP), provisional: false, status: pr.status, kind: pr.kind || null, cargo: pr.cargo || null };
    });
    const bridges = (M.bridges || []).map(b => ({ id: b.id, from: b.from, to: b.to, note: b.note }));
    const pickups = (M.pickups || []).map(p => ({ id: p.id, room: p.room, at: rawP(p.at), items: (p.items || []).map(i => i.slice()), class: p.class || null, needs: p.needs || null, note: p.note }));   // (a tile's middle, not snapped; `needs` is a relay that must be online before the case is there)
    const relays = (M.relays || []).map(r => ({ id: r.id, name: r.name, room: r.room, prop: r.prop, powers: (r.powers || []).slice(), feeds: (r.feeds || []).slice() }));
    const stations = (M.stations || []).map(st => ({ id: st.id, room: st.room, prop: st.prop, kind: st.kind }));
    const outer = M.outer_path ? { id: M.outer_path.id, poly: _facPoly(M.outer_path.polygon), walkable: M.outer_path.walkable === true, navigation_link: M.outer_path.navigation_link === true } : null;
    const conns = (M.connections || []).concat(ex.connections || []).filter(c => !c.opening || openings.some(o => o.id === c.opening)).map(c => ({ id: c.id, rooms: c.rooms, opening: c.opening || null, ramp: c.ramp || null, confirmed: true }));
    const cands = ((M.candidates && M.candidates.connections) || []).map(c => ({ id: c.id, rooms: c.rooms, at: _facP(c.at), evidence: c.evidence, ramp: c.ramp_candidate || null, confirmed: false }));
    // heights: tiles above the ground floor, per level; a ramp's zone is where the floor slopes between the heights of the two levels it joins
    const levelH = new Map((M.levels || []).map(l => [l.id, l.height || 0]));
    const one = (v) => { let t = v / s; if (_facSnap) t = Math.round(t - 0.5) + 0.5; return t; };
    const ramps = (M.ramps || []).concat(ex.ramps || []).map(r => {
        const o = r.centre ? Object.assign({}, r, { centre: _facP(r.centre), r_inner: r.r_inner / s, r_outer: r.r_outer / s }) : Object.assign({}, r);
        if (r.zone) { const a = _facP([r.zone.rect[0], r.zone.rect[1]]), b = _facP([r.zone.rect[2], r.zone.rect[3]]); const bl = r.between_levels || [0, 0];
            o.zone = { x0: Math.min(a[0], b[0]), y0: Math.min(a[1], b[1]), x1: Math.max(a[0], b[0]), y1: Math.max(a[1], b[1]), axis: r.zone.axis, c0: one(r.zone.c0), c1: one(r.zone.c1), steps: r.zone.steps | 0, hA: levelH.get(bl[0]) || 0, hB: levelH.get(bl[1]) || 0 }; }
        return o; });
    const candRamps = ((M.candidates && M.candidates.ramps) || []).map(r => Object.assign({}, r, { at: _facP(r.at) }));
    // bounding boxes, so a query only looks at the walls and rooms near it (the validator walks thousands of steps)
    const bbox = pts => { let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity; for (const q of pts) { x0 = Math.min(x0, q[0]); y0 = Math.min(y0, q[1]); x1 = Math.max(x1, q[0]); y1 = Math.max(y1, q[1]); } return [x0, y0, x1, y1]; };
    for (const r of rooms) r.bb = bbox(r.poly);
    for (const w of walls) w.bb = bbox([w.a, w.b]);
    for (const so of solids) so.bb = so.shape === "circle" ? [so.at[0] - so.r, so.at[1] - so.r, so.at[0] + so.r, so.at[1] + so.r] : bbox(so.poly);
    if (outer) outer.bb = bbox(outer.poly);
    const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
    for (const poly of rooms.map(r => r.poly).concat(outer ? [outer.poly] : [])) for (const q of poly) { b.minX = Math.min(b.minX, q[0]); b.minY = Math.min(b.minY, q[1]); b.maxX = Math.max(b.maxX, q[0]); b.maxY = Math.max(b.maxY, q[1]); }
    return { margin: ex.margin || FAC_WALL_MARGIN, snapped: !!ex.snap, levelH, rooms, walls, windows, fixtures, floors, decor, solids, pickups, bridges, stations, relays, outer, openings, connections: conns, candidates: cands, ramps, candidateRamps: candRamps, exits: (M.external_exits || []).map(e => Object.assign({}, e, { at: _facP(e.at) })), bounds: b, byId: new Map(rooms.map(r => [r.id, r])) };
}
// The compiled map of the authored data (built once, again if the data changes).
function facilityGet() {
    const sig = JSON.stringify([FACILITY_MAP.scale, FACILITY_MAP.openings, FACILITY_MAP.connections, FACILITY_MAP.rooms.length]);
    if (!_facility || sig !== _facilitySig) { _facility = facilityBuild(); _facilitySig = sig; }
    return _facility;
}

// ── queries (all take an optional compiled map F, so tests can ask about a variant) ──
function _facIn(x, y, bb, m) { m = m || 0; return x >= bb[0] - m && x <= bb[2] + m && y >= bb[1] - m && y <= bb[3] + m; }
function facilityRoomAt(x, y, F) {
    F = F || facilityGet();
    if (F.outer && _facIn(x, y, F.outer.bb) && facilityPointInPoly(x, y, F.outer.poly)) return null;   // the outer path is never a room
    for (const r of F.rooms) if (_facIn(x, y, r.bb) && facilityPointInPoly(x, y, r.poly)) return r;
    return null;
}
function facilitySolidAt(x, y, F) {
    F = F || facilityGet();
    for (const s of F.solids) if (_facIn(x, y, s.bb) && (s.shape === "circle" ? Math.hypot(x - s.at[0], y - s.at[1]) < s.r : facilityPointInPoly(x, y, s.poly))) return s;
    return null;
}
// Walkable: inside a room, outside every solid, and not ON a wall (a body exactly on a wall line could slip along it into the next room).
const FAC_WALL_MARGIN = 0.02;
function facilityWalkable(x, y, F) {
    F = F || facilityGet();
    if (!facilityRoomAt(x, y, F) || facilitySolidAt(x, y, F)) return false;
    for (const w of F.walls) if (_facIn(x, y, w.bb, F.margin) && _facSegPointDist(w.a, w.b, x, y) < F.margin) return false;
    return true;
}
// Can a body go in a straight line from (x0,y0) to (x1,y1)? No if it ends somewhere unwalkable, crosses any wall, or cuts through a solid.
function facilityCanStep(x0, y0, x1, y1, F) {
    F = F || facilityGet();
    if (!facilityWalkable(x1, y1, F)) return false;
    const a = [x0, y0], b = [x1, y1], sx0 = Math.min(x0, x1), sx1 = Math.max(x0, x1), sy0 = Math.min(y0, y1), sy1 = Math.max(y0, y1);
    const near = bb => !(sx1 < bb[0] || sx0 > bb[2] || sy1 < bb[1] || sy0 > bb[3]);
    for (const w of F.walls) if (near(w.bb) && facilitySegmentsCross(a, b, w.a, w.b)) return false;
    for (const s of F.solids) {
        if (!near(s.bb)) continue;
        if (s.shape === "circle") { if (_facSegPointDist(a, b, s.at[0], s.at[1]) < s.r) return false; }
        else for (let i = 0; i < s.poly.length; i++) if (facilitySegmentsCross(a, b, s.poly[i], s.poly[(i + 1) % s.poly.length])) return false;
    }
    return true;
}
// The movement helper for when the facility is wired in: the furthest the body gets toward (x+dx, y+dy), sliding along a wall on one axis if the diagonal is blocked.
function facilityMove(x, y, dx, dy, F) {
    F = F || facilityGet();
    if (facilityCanStep(x, y, x + dx, y + dy, F)) return [x + dx, y + dy];
    if (dx && facilityCanStep(x, y, x + dx, y, F)) return [x + dx, y];
    if (dy && facilityCanStep(x, y, x, y + dy, F)) return [x, y + dy];
    return [x, y];
}

// HEIGHT: tiles above the ground floor at a point: the floor's level, or a slope between two levels inside a ramp's zone. (Drawing only: movement is flat.)
function facilityHeightAt(x, y, F) {
    F = F || facilityGet();
    for (const r of F.ramps) {
        const z = r.zone; if (!z || x < z.x0 || x > z.x1 || y < z.y0 || y > z.y1) continue;
        const v = z.axis === "x" ? x : y; let t = Math.max(0, Math.min(1, (v - z.c0) / ((z.c1 - z.c0) || 1)));
        if (z.steps) t = Math.round(t * z.steps) / z.steps;   // a staircase: flat treads, not a slope
        return z.hA + (z.hB - z.hA) * t;
    }
    const room = facilityRoomAt(x, y, F); return room ? (F.levelH.get(room.level) || 0) : 0;
}
function facilityRoomHeight(id, F) { F = F || facilityGet(); const r = F.byId.get(id); return r ? (F.levelH.get(r.level) || 0) : 0; }

// the kinds of decor that hang on a wall (the rest lie on the floor)
const FAC_WALL_DECOR = new Set(["poster", "vent", "pipe", "wall_light", "screen", "board", "whiteboard", "exit_sign", "clock", "graffiti", "panel", "banner", "mirror", "shelf", "sign", "hazard_sign", "cable_run", "window_blind", "crack", "vein", "beam", "chain", "claw", "ooze_drip", "lamp", "ladder", "scoreboard", "plate", "moss", "bulbs", "monitor_bank", "garage_door", "gun_rack"]);

// The dressing (floors and decor): floors name a room, floor decor lies inside its room, wall decor is flat on a real solid wall, on the side of it that the camera sees, and (but for signs over a door) not across a doorway.
function facilityValidateDressing(F) {
    const errors = [];
    // the dressing: floors name a room, floor decor lies inside its room, wall decor is flat on a real wall, on the side of it that the camera sees, and (but for signs over a door) not across a doorway
    for (const f of F.floors) { if (!F.byId.has(f.room)) errors.push("floor " + f.room + " names a room that does not exist"); }
    const FAC_OVER_DOOR = new Set(["exit_sign", "pipe", "banner", "wall_light", "sign"]);
    const FAC_ON_GLASS = new Set(["garage_door"]);   // set into the rock under the deck's window: the arena side of a wall that is glass above, a cliff below
    for (const d of (F.snapped ? F.decor : [])) {   // (the dressing is authored on the tile grid the game plays on, so it is checked on the snapped copy)
        const room = F.byId.get(d.room); if (!room) { errors.push("decor " + d.id + " names a room that does not exist"); continue; }
        if (FAC_WALL_DECOR.has(d.kind)) {
            if (!d.a || !d.b) { errors.push("wall decor " + d.id + " has no a and b"); continue; }
            const dx = d.b[0] - d.a[0], dy = d.b[1] - d.a[1], L = Math.hypot(dx, dy); if (L < 0.3) { errors.push("wall decor " + d.id + " is too short"); continue; }
            let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }   // the side of the wall the camera sees (towards larger x + y)
            const mx = (d.a[0] + d.b[0]) / 2, my = (d.a[1] + d.b[1]) / 2, front = facilityRoomAt(mx + nx * 0.4, my + ny * 0.4, F), behind = facilityRoomAt(mx - nx * 0.4, my - ny * 0.4, F);
            if (d.outside) { if (!behind || behind.id !== d.room) errors.push("wall decor " + d.id + " is flagged outside but " + d.room + " is not behind that wall"); }
            else { if (!front || front.id !== d.room) errors.push("wall decor " + d.id + " does not face " + d.room + " (the side of a wall the camera sees is its +y / +x side)"); if (behind && behind.id === d.room) errors.push("wall decor " + d.id + " is not on a wall of " + d.room); }
            if (!FAC_OVER_DOOR.has(d.kind) && !FAC_ON_GLASS.has(d.kind) && !F.walls.some(w => !w.window && _facSegPointDist(w.a, w.b, mx, my) < 0.06)) errors.push("wall decor " + d.id + " is not on a solid wall (it is across a gap or glass)");
            if (!FAC_OVER_DOOR.has(d.kind)) for (const o of F.openings) if (_facSegPointDist(d.a, d.b, (o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2) < 0.1 || _facSegPointDist(o.a, o.b, mx, my) < 0.6) errors.push("wall decor " + d.id + " (" + d.kind + ") is across the opening " + o.id);
        } else if (d.rect) {
            for (const c of [[d.rect[0] + 0.2, d.rect[1] + 0.2], [d.rect[2] - 0.2, d.rect[1] + 0.2], [d.rect[2] - 0.2, d.rect[3] - 0.2], [d.rect[0] + 0.2, d.rect[3] - 0.2]]) { const r = facilityRoomAt(c[0], c[1], F); if (!r || r.id !== d.room) { errors.push("floor decor " + d.id + " (" + d.kind + ") leaves " + d.room); break; } }
        } else if (d.at) { const r = facilityRoomAt(d.at[0], d.at[1], F); if (!r || r.id !== d.room) errors.push("floor decor " + d.id + " (" + d.kind + ") is not in " + d.room); }
        else if (d.path || (d.a && d.b)) { for (const c of (d.path || [d.a, d.b])) { const r = facilityRoomAt(c[0], c[1], F); if (!r || r.id !== d.room) { errors.push("floor decor " + d.id + " (" + d.kind + ") leaves " + d.room); break; } } }
    }
    // the pickups: a known room, a tile of that room's floor that a body can stand on, items that exist (when the item table is loaded)
    for (const b of (F.bridges || [])) { const t = F.solids.find(s => s.id === b.from); if (!t || t.shape !== "circle") errors.push("bridge " + b.id + " starts at " + b.from + ", which is not a round prop"); if (!F.byId.get(b.to)) errors.push("bridge " + b.id + " ends at " + b.to + ", which is not a room"); }
    for (const p of (F.pickups || [])) {
        const rm = F.byId.get(p.room); if (!rm) { errors.push("pickup " + p.id + " names a room that does not exist"); continue; }
        const r = facilityRoomAt(p.at[0], p.at[1], F); if (!r || r.id !== p.room) errors.push("pickup " + p.id + " is not in " + p.room);
        else if (F.snapped && !facilityWalkable(p.at[0], p.at[1], F)) errors.push("pickup " + p.id + " is not on a tile a body can stand on");
        if (!p.items.length) errors.push("pickup " + p.id + " holds nothing");
        if (p.class && typeof CLASSES !== "undefined" && !CLASSES[p.class]) errors.push("pickup " + p.id + " is for " + p.class + ", which is not a class");
        if (p.needs && !(F.relays || []).some(r => r.id === p.needs)) errors.push("pickup " + p.id + " waits for " + p.needs + ", which is not a relay");
        if (typeof ITEMS !== "undefined") for (const it of p.items) if (!ITEMS[it[0]] || !(it[1] > 0)) errors.push("pickup " + p.id + " holds " + it[0] + ", which is not an item");
    }
    for (const r of (F.relays || [])) {   // a relay is a relay box of its room, powering rooms that exist and feeding props that exist
        const pr = F.solids.find(p => p.id === r.prop); if (!pr) errors.push("relay " + r.id + " names a prop that does not exist"); else if (pr.room !== r.room || pr.kind !== "relay") errors.push("relay " + r.id + ": " + r.prop + " is not a relay box of " + r.room);
        if (!r.powers.length) errors.push("relay " + r.id + " powers nothing"); for (const id of r.powers) if (!F.byId.has(id)) errors.push("relay " + r.id + " powers " + id + ", which is not a room");
        for (const id of r.feeds) if (!F.solids.some(p => p.id === id)) errors.push("relay " + r.id + " feeds " + id + ", which is not a prop");
    }
    for (const st of (F.stations || [])) {   // a station is a prop of its room, and (when the kinds are loaded) a known kind
        const pr = F.solids.find(p => p.id === st.prop); if (!pr) errors.push("station " + st.id + " names a prop that does not exist"); else if (pr.room !== st.room) errors.push("station " + st.id + ": " + st.prop + " is not in " + st.room);
        if (typeof STATION_KINDS !== "undefined" && !STATION_KINDS[st.kind]) errors.push("station " + st.id + " is a " + st.kind + ", which is not a kind");
    }
    return errors;
}

// ── navigation ──
// Nodes are rooms; edges are CONFIRMED connections. `withCandidates` adds the unconfirmed ones (to see what they would join), never the default.
function facilityNavEdges(F, withCandidates) {
    F = F || facilityGet();
    const out = F.connections.map(c => ({ a: c.rooms[0], b: c.rooms[1], confirmed: true, id: c.id }));
    if (withCandidates) for (const c of F.candidates) out.push({ a: c.rooms[0], b: c.rooms[1], confirmed: false, id: c.id });
    return out;
}
function facilityComponents(F, withCandidates) {
    F = F || facilityGet();
    const parent = new Map(F.rooms.map(r => [r.id, r.id])), find = x => { while (parent.get(x) !== x) x = parent.get(x); return x; };
    for (const e of facilityNavEdges(F, withCandidates)) if (parent.has(e.a) && parent.has(e.b)) parent.set(find(e.a), find(e.b));
    const groups = new Map(); for (const r of F.rooms) { const k = find(r.id); if (!groups.has(k)) groups.set(k, []); groups.get(k).push(r.id); }
    return [...groups.values()];
}
function facilityReachable(from, to, F, withCandidates) { return facilityComponents(F, withCandidates).some(g => g.includes(from) && g.includes(to)); }

// Flood-fill the walkable floor on a fine grid, stepping only where facilityCanStep allows: what can an agent actually reach from a start point?
function facilityFlood(sx, sy, F, cell) {
    F = F || facilityGet(); cell = cell || (facilityScale() <= 12 ? 1 : 0.5);   // a cell is about half a metre of the sketch's floor either way
    const key = (i, j) => i + "," + j, seen = new Set(), q = [[Math.round(sx / cell), Math.round(sy / cell)]], cells = [];
    if (!facilityWalkable(q[0][0] * cell, q[0][1] * cell, F)) return cells;
    seen.add(key(q[0][0], q[0][1]));
    while (q.length) {
        const [i, j] = q.pop(); cells.push([i * cell, j * cell]);
        for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
            const ni = i + di, nj = j + dj, k = key(ni, nj); if (seen.has(k)) continue;
            if (facilityCanStep(i * cell, j * cell, ni * cell, nj * cell, F)) { seen.add(k); q.push([ni, nj]); }
        }
    }
    return cells;
}

// ── validation ──
// Returns { errors, warnings, info }. errors are rule breaks; warnings are things waiting for the user (every candidate); info is counts.
function facilityValidate(F) {
    F = F || facilityGet();
    const errors = [], warnings = [], info = {};
    const M = FACILITY_MAP, ids = new Set();
    for (const r of F.rooms) {
        if (ids.has(r.id)) errors.push("duplicate room id " + r.id); ids.add(r.id);
        if (r.poly.length < 3 || Math.abs(_facPolyArea(r.poly)) < 1) errors.push(r.id + ": the outline has no area");
        if (r.edgeKinds && r.edgeKinds.length !== r.poly.length) errors.push(r.id + ": edge_kinds does not match the outline");
        if (!F.byId.has(r.id)) errors.push(r.id + ": missing");
    }
    // no two room outlines cross each other (rooms may share an edge or a corner, never overlap)
    for (let i = 0; i < F.rooms.length; i++) for (let j = i + 1; j < F.rooms.length; j++) {
        const A = F.rooms[i].poly, B = F.rooms[j].poly; let bad = false;
        for (let p = 0; p < A.length && !bad; p++) for (let q = 0; q < B.length && !bad; q++) if (facilitySegmentsCross(A[p], A[(p + 1) % A.length], B[q], B[(q + 1) % B.length])) bad = true;
        if (bad) errors.push(F.rooms[i].id + " and " + F.rooms[j].id + " overlap");
    }
    // an outer path, if the data has one: boundary only, in no link, touching no room's floor
    if (F.outer) {
        if (F.outer.walkable) errors.push("the outer path is marked walkable");
        if (F.outer.navigation_link) errors.push("the outer path is marked as a navigation link");
        for (const r of F.rooms) { const c = _facCentroid(r.poly); if (facilityPointInPoly(c[0], c[1], F.outer.poly)) errors.push(r.id + " sits inside the outer path"); }
        for (const e of facilityNavEdges(F, true)) if (e.a === F.outer.id || e.b === F.outer.id) errors.push("a navigation link uses the outer path: " + e.id);
    }
    // every room marked as a blocking boundary (the arena, the nest area): a wall on every edge
    const sealed = F.rooms.filter(r => r.raw.boundary_blocks_movement);
    if (!F.byId.get("arena")) errors.push("no arena");
    for (const r of sealed) {
        // (an edge that is a door's end, a tunnel's mouth, is open by design: a one-tile wall thickness is cut through the room's outline)
        let open = 0; for (let i = 0; i < r.poly.length; i++) { const p = r.poly[i], q = r.poly[(i + 1) % r.poly.length]; if (F.openings.some(o => o.rooms.includes(r.id) && _facSegPointDist(o.a, o.b, p[0], p[1]) < 0.06 && _facSegPointDist(o.a, o.b, q[0], q[1]) < 0.06)) open++; }
        const edges = r.poly.length - open, have = F.walls.filter(w => w.room === r.id).length;
        if (have < edges) errors.push(r.id + " perimeter has " + have + " wall pieces for " + edges + " edges: something is cut open");
        for (const o of F.openings) if ((o.rooms || []).includes(r.id) && !F.connections.some(c => c.opening === o.id)) warnings.push(r.id + " has an opening with no connection: check it is meant");
    }
    // nothing outside every room is walkable: sample the whole bounding box
    { let bad = 0; for (let t = 0; t < 3000; t++) { const x = F.bounds.minX - 2 + (F.bounds.maxX - F.bounds.minX + 4) * ((t * 0.6180339) % 1), y = F.bounds.minY - 2 + (F.bounds.maxY - F.bounds.minY + 4) * ((t * 0.4142135) % 1); if (!facilityRoomAt(x, y, F) && facilityWalkable(x, y, F)) bad++; } if (bad) errors.push(bad + " walkable points lie outside every room"); }
    // windows lie on the walls of the rooms they name
    for (const w of F.windows) {
        for (const id of w.rooms) { const room = F.byId.get(id); if (!room) { errors.push("window " + w.id + " names a room that does not exist"); continue; } let on = false; for (let i = 0; i < room.poly.length; i++) { const a = room.poly[i], b = room.poly[(i + 1) % room.poly.length]; if (_facSegPointDist(a, b, w.a[0], w.a[1]) < 0.05 && _facSegPointDist(a, b, w.b[0], w.b[1]) < 0.05) on = true; } if (!on) errors.push("window " + w.id + " is not on a wall of " + id); }
        if (!F.walls.some(wl => wl.window === w.id)) errors.push("window " + w.id + " has no wall under it");
    }
    // wall fixtures sit on the wall of their room, on the named edge, and not across a doorway
    for (const f of F.fixtures) {
        const room = F.byId.get(f.room); if (!room) { errors.push("fixture " + f.id + " names a room that does not exist"); continue; }
        const a = room.poly[f.edge], b = room.poly[(f.edge + 1) % room.poly.length];
        if (!a || _facSegPointDist(a, b, f.a[0], f.a[1]) > 0.05 || _facSegPointDist(a, b, f.b[0], f.b[1]) > 0.05) errors.push("fixture " + f.id + " is not on edge " + f.edge + " of " + f.room);
        for (const o of F.openings) if (_facSegPointDist(o.a, o.b, (f.a[0] + f.b[0]) / 2, (f.a[1] + f.b[1]) / 2) < 0.6 || _facSegPointDist(f.a, f.b, (o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2) < 0.1) errors.push("fixture " + f.id + " sits across the opening " + o.id);
    }
    for (const e of facilityValidateDressing(F)) errors.push(e);
    // wall material: a solid (walled-off) room has no glass on its own walls; a glass room has some
    for (const r of F.rooms) {
        const glass = F.walls.filter(w => w.room === r.id && w.window).length;
        if (r.raw.wall_material === "solid" && glass) errors.push(r.id + " is walled off (solid) but has " + glass + " glass wall pieces");
        if (r.raw.wall_material === "glass" && !glass) errors.push(r.id + " is a glass room but has no glass walls");
    }
    // openings and connections agree
    for (const c of F.connections) {
        if (!F.byId.has(c.rooms[0]) || !F.byId.has(c.rooms[1])) errors.push("connection " + c.id + " names a room that does not exist");
        if (c.opening && !F.openings.some(o => o.id === c.opening)) errors.push("connection " + c.id + " names an opening that does not exist");
        const A = F.byId.get(c.rooms[0]), B = F.byId.get(c.rooms[1]);
        if (A && B && A.level !== B.level && !c.ramp) errors.push("connection " + c.id + " joins two levels with no ramp");
        if (c.ramp && !F.ramps.some(r => r.id === c.ramp)) errors.push("connection " + c.id + " names a ramp that does not exist");
    }
    for (const o of F.openings) if (!F.connections.some(c => c.opening === o.id)) warnings.push("opening " + o.id + " has no connection (it joins nothing for navigation)");
    for (const r of F.ramps) if (!r.between_levels || r.between_levels[0] === r.between_levels[1]) errors.push("ramp " + r.id + " does not join two different levels");
    // every level a room stands on has a height; a ramp's slope runs between the heights of the two levels it joins, inside the two rooms it joins
    for (const room of F.rooms) if (!F.levelH.has(room.level)) errors.push(room.id + " is on level " + room.level + ", which has no height");
    for (const r of F.ramps) {
        if (!r.zone) { if (r.shape !== "curved" || r.id !== "r_teleport_stairs") if (!(r.zone)) warnings.push("ramp " + r.id + " has no zone: it draws no slope"); continue; }
        const z = r.zone;
        if (!(z.hA !== z.hB)) errors.push("ramp " + r.id + " joins two levels of the same height");
        if (z.steps && (z.steps < 1 || z.steps > Math.abs(z.c1 - z.c0))) errors.push("ramp " + r.id + " has " + z.steps + " steps over " + Math.abs(z.c1 - z.c0).toFixed(1) + " tiles");
        if (Math.abs(z.c1 - z.c0) < 0.5) errors.push("ramp " + r.id + " slopes over less than half a tile");
        const inside = (id) => { const rm = F.byId.get(id); return !!rm && !(z.x1 < rm.bb[0] || z.x0 > rm.bb[2] || z.y1 < rm.bb[1] || z.y0 > rm.bb[3]); };
        for (const id of (r.rooms || [])) if (!inside(id)) errors.push("ramp " + r.id + "'s slope does not reach " + id);
    }
    // the agents: nobody walks out of the arena or the nest area through a WALL, from any start, in any direction (a confirmed door is the one way out)
    info.arenaAgents = 0; info.arenaLeaks = 0;
    for (const room of sealed) {
        const Fs = facilityBuild({ closed: [room.id] });   // this room's doors shut: the walls alone must hold every agent in
        let seed = 12345, rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x7fffffff, leaks = 0, tried = 0;
        const rs = Fs.byId.get(room.id), b = { minX: rs.bb[0], maxX: rs.bb[2], minY: rs.bb[1], maxY: rs.bb[3] };
        for (let n = 0; n < 4000 && tried < 100; n++) {
            const x = b.minX + (b.maxX - b.minX) * rnd(), y = b.minY + (b.maxY - b.minY) * rnd();
            if (!facilityPointInPoly(x, y, rs.poly) || !facilityWalkable(x, y, Fs)) continue;
            tried++;
            for (let k = 0; k < 8; k++) {
                const ang = k * Math.PI / 4 + rnd() * 0.3; let px = x, py = y;
                for (let s = 0; s < 160; s++) { const m = facilityMove(px, py, Math.cos(ang) * 0.6, Math.sin(ang) * 0.6, Fs); px = m[0]; py = m[1]; }
                const at = facilityRoomAt(px, py, Fs);
                if (!at || at.id !== room.id) leaks++;
            }
        }
        info.arenaAgents += tried * 8; info.arenaLeaks += leaks;
        if (leaks) errors.push(leaks + " agent walks left " + room.id + " through its walls");
        if (tried < 40) errors.push("could not place agents in " + room.id + " (" + tried + ")");
    }
    // the route test: from any room, a flood of the floor never reaches another room unless a confirmed connection joins them, and never the outer path
    const comps = facilityComponents(F, false);
    info.rooms = F.rooms.length; info.confirmedOpenings = F.openings.length; info.confirmedConnections = F.connections.length; info.candidates = F.candidates.length; info.navComponents = comps.length;
    for (const r of F.rooms) {
        let start = null; const c = _facCentroid(r.poly);
        { const at = facilityRoomAt(c[0], c[1], F); if (at && at.id === r.id && facilityWalkable(c[0], c[1], F)) start = c; }   // (the centroid of a C-shaped room can lie in another room)
        if (!start) for (let t = 0; t < 400 && !start; t++) { const x = F.bounds.minX + (F.bounds.maxX - F.bounds.minX) * ((t * 0.6180339) % 1), y = F.bounds.minY + (F.bounds.maxY - F.bounds.minY) * ((t * 0.4142135) % 1); const rr = facilityRoomAt(x, y, F); if (rr && rr.id === r.id && facilityWalkable(x, y, F)) start = [x, y]; }
        if (!start) { warnings.push(r.id + ": no walkable floor found to test"); continue; }
        const cells = facilityFlood(start[0], start[1], F), reached = new Set();
        for (const q of cells) { const rr = facilityRoomAt(q[0], q[1], F); if (rr) reached.add(rr.id); else errors.push(r.id + ": a flood reached a cell outside every room"); if (F.outer && facilityPointInPoly(q[0], q[1], F.outer.poly)) errors.push(r.id + ": a flood reached the outer path"); }
        const comp = comps.find(g => g.includes(r.id)) || [r.id];
        for (const id of reached) if (!comp.includes(id)) errors.push(r.id + " can walk into " + id + " with no confirmed connection");
    }
    if (F.candidates.length) warnings.push(F.candidates.length + " candidate connections are unconfirmed, so " + (comps.length > 1 ? "the rooms are not joined: " + comps.length + " separate areas" : "all rooms are joined"));
    for (const u of (M.unresolved || [])) warnings.push("unresolved: " + u);
    return { errors, warnings, info };
}
let _facValid = null, _facValidSig = "";
function facilityValidateCached(F) { F = F || facilityGet(); if (!_facValid || _facValidSig !== _facilitySig) { _facValid = facilityValidate(F); _facValidSig = _facilitySig; } return _facValid; }
function _facCentroid(poly) { let x = 0, y = 0; for (const p of poly) { x += p[0]; y += p[1]; } return [x / poly.length, y / poly.length]; }

// ─────────────────────────────────────────────────────────
//  THE DEBUG VIEW — an isometric overlay of the facility with its own camera (pan, zoom) and layer switches
// ─────────────────────────────────────────────────────────
// Draws the authored map with the game's own isometric projection (TILE_W x TILE_H), on its own canvas over the page, so it needs nothing from the game loop.
// Layers: OUTLINES (rooms, the outer path), COLLISION (walls, solids), OPENINGS (confirmed gaps, and the candidates as ?), ELEVATION (raised rooms lifted),
// NAV (the connection graph: solid green = confirmed, dashed amber = candidate, and what is joined). Toggle: the MAP button on the dock, F3, or ?facility in the URL.
const facilityDebug = { on: false, layers: { outlines: true, collision: true, openings: true, elevation: true, nav: true }, cam: { x: 0, y: 0, z: 1 }, note: "", fitted: false, _hits: [] };
const FAC_ELEV_PX = 34;   // how far a room is lifted on screen per tile of height
const FAC_COLOURS = { ground: "#19e6c1", raised: "#ffe733", solid: "#ff8a5c", wall: "#ff4a1c", arena: "#ff2d95", outer: "#8a94b8", cand: "#ffb020", ok: "#6dff5a" };

function _facTW() { return typeof TILE_W === "number" ? TILE_W : 64; }
function _facTH() { return typeof TILE_H === "number" ? TILE_H : 32; }
// world (tiles) + level -> screen px
// a level (or a level part-way between two, on a stair) in screen pixels of height
function _facLevelPx(F, level) { level = level || 0; const lo = Math.floor(level), hi = Math.ceil(level), a = F.levelH.get(lo) || 0, b = F.levelH.get(hi) || 0; return (a + (b - a) * (level - lo)) * FAC_ELEV_PX; }
function _facProject(x, y, level, W, H) {
    const c = facilityDebug.cam, F = facilityGet(), cx = (F.bounds.minX + F.bounds.maxX) / 2 + c.x, cy = (F.bounds.minY + F.bounds.maxY) / 2 + c.y, z = c.z;
    return [(x - cx - (y - cy)) * _facTW() * z + W / 2, (x - cx + (y - cy)) * _facTH() * z + H / 2 - (facilityDebug.layers.elevation ? _facLevelPx(F, level) * z : 0)];
}
function facilityFit(W, H) {
    const F = facilityGet(), b = F.bounds; let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    for (const [x, y] of [[b.minX, b.minY], [b.maxX, b.minY], [b.maxX, b.maxY], [b.minX, b.maxY]]) { const sx = (x - y) * _facTW(), sy = (x + y) * _facTH(); minX = Math.min(minX, sx); maxX = Math.max(maxX, sx); minY = Math.min(minY, sy); maxY = Math.max(maxY, sy); }
    facilityDebug.cam = { x: 0, y: 0, z: Math.max(0.05, Math.min((W * 0.94) / (maxX - minX), (H - 190) / (maxY - minY))) }; facilityDebug.fitted = true;
}

function facilityDebugDraw() {
    const root = typeof document !== "undefined" ? document.getElementById("facilityDebug") : null; if (!root || !facilityDebug.on) return;
    const cv = root.querySelector("canvas"); if (!cv || !cv.getContext) return;
    const W = cv.width = Math.max(300, window.innerWidth), H = cv.height = Math.max(300, window.innerHeight), g = cv.getContext("2d"), L = facilityDebug.layers;
    if (!facilityDebug.fitted) facilityFit(W, H);
    const F = facilityGet(), P = (p, lv) => _facProject(p[0], p[1], lv, W, H), z = facilityDebug.cam.z;
    g.fillStyle = "#060914"; g.fillRect(0, 0, W, H); facilityDebug._hits = [];
    const path = (pts, lv) => { g.beginPath(); pts.forEach((p, i) => { const q = P(p, lv); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }); g.closePath(); };
    // the outer path: drawn, hatched, and labelled as NOT walkable
    if (F.outer && L.outlines) { path(F.outer.poly, 0); g.fillStyle = "rgba(138,148,184,0.16)"; g.fill(); g.setLineDash([8, 6]); g.lineWidth = 2; g.strokeStyle = FAC_COLOURS.outer; g.stroke(); g.setLineDash([]); const c = P(_facCentroidOfBand(F.outer.poly), 0); _facLabel(g, "OUTER PATH · BOUNDARY ONLY · NOT WALKABLE", c[0], c[1], FAC_COLOURS.outer, 11 * Math.max(0.8, Math.min(1.4, z * 3))); }
    // rooms, low to high, so a raised room covers what is behind it
    for (const r of F.rooms.slice().sort((a, b) => a.level - b.level)) {
        const col = r.level ? FAC_COLOURS.raised : FAC_COLOURS.ground;
        if (L.elevation && r.level) { for (let i = 0; i < r.poly.length; i++) { const a = r.poly[i], b = r.poly[(i + 1) % r.poly.length], a0 = P(a, 0), b0 = P(b, 0), a1 = P(a, r.level), b1 = P(b, r.level); g.beginPath(); g.moveTo(a0[0], a0[1]); g.lineTo(b0[0], b0[1]); g.lineTo(b1[0], b1[1]); g.lineTo(a1[0], a1[1]); g.closePath(); g.fillStyle = "rgba(255,231,51,0.10)"; g.fill(); } }
        if (L.outlines) { path(r.poly, r.level); g.fillStyle = r.id === "arena" ? "rgba(255,45,149,0.08)" : r.level && L.elevation ? "rgba(255,231,51,0.12)" : "rgba(25,230,193,0.09)"; g.fill(); g.lineWidth = 2; g.strokeStyle = col; g.stroke(); }
        const c = P(_facCentroid(r.poly), r.level);
        if (L.outlines) _facLabel(g, r.label.toUpperCase() + (L.elevation ? "  L" + r.level : "") + (r.raw.development === "blocked_off_for_now" ? " \u00b7 BLOCKED OFF" : ""), c[0], c[1], col, 11 * Math.max(0.8, Math.min(1.5, z * 3)));
    }
    if (L.collision) {
        for (const s of F.solids) { const lv = (F.byId.get(s.room) || {}).level || 0; if (s.shape === "circle") { const pts = []; for (let i = 0; i < 32; i++) pts.push([s.at[0] + Math.cos(i / 32 * 6.2832) * s.r, s.at[1] + Math.sin(i / 32 * 6.2832) * s.r]); path(pts, lv); } else path(s.poly, lv); const liq = s.kind === "liquid_reserve"; g.fillStyle = liq ? "rgba(140,90,255,0.38)" : s.provisional ? "rgba(255,138,92,0.18)" : "rgba(255,138,92,0.34)"; g.fill(); g.lineWidth = 1.5; g.setLineDash(s.provisional ? [4, 4] : []); g.strokeStyle = liq ? "#a64dff" : FAC_COLOURS.solid; g.stroke(); g.setLineDash([]); if (liq && L.outlines) { const q = P(s.at, lv); _facLabel(g, "LIQUID RESERVE", q[0], q[1], "#c9a0ff", 10 * Math.max(0.8, Math.min(1.4, z * 3))); } }
        for (const s of F.solids) if (s.kind === "semi_truck" && L.outlines) { const lv = (F.byId.get(s.room) || {}).level || 0, q = P(_facCentroid(s.poly), lv); _facLabel(g, "SEMI TRUCK \u00b7 " + (s.cargo ? s.cargo.map(c => c.count + " " + c.type.toUpperCase() + "S").join(", ") : ""), q[0], q[1], "#ffb48a", 9 * Math.max(0.8, Math.min(1.4, z * 3))); }
        for (const w of F.walls.filter(x => x.window)) { const lv = (F.byId.get(w.room) || {}).level || 0, a = P(w.a, lv), b = P(w.b, lv); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineWidth = 6; g.strokeStyle = "rgba(143,227,255,0.45)"; g.setLineDash([3, 4]); g.stroke(); g.setLineDash([]); }
        for (const w of F.walls) { const lv = (F.byId.get(w.room) || {}).level || 0, a = P(w.a, lv), b = P(w.b, lv); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineWidth = w.arena ? 4 : 2.5; g.strokeStyle = w.arena ? (w.room === "arena" ? FAC_COLOURS.arena : FAC_COLOURS.outer) : FAC_COLOURS.wall; g.stroke(); }
    }
    if (L.collision || L.outlines) {
        for (const f of F.fixtures) { const lv = (F.byId.get(f.room) || {}).level || 0, a = P(f.a, lv), b = P(f.b, lv), c = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineWidth = 7; g.strokeStyle = f.type === "power_pack_area" ? "#ffd34d" : "#ff9ad5"; g.stroke(); _facLabel(g, f.type === "power_pack_area" ? "POWER PACK AREA" : f.type === "wall_sign" ? "BIG SIGN" : f.id.toUpperCase(), c[0], c[1] - 9, f.type === "power_pack_area" ? "#ffd34d" : "#ff9ad5", 9 * Math.max(0.8, Math.min(1.4, z * 3))); facilityDebug._hits.push({ x: c[0], y: c[1], text: f.id.toUpperCase() + " \u2014 " + (f.note || "") }); }
    }
    if (L.openings) {
        for (const o of F.openings) { const a = P(o.a, 0), b = P(o.b, 0); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineWidth = 6; g.strokeStyle = FAC_COLOURS.ok; g.stroke(); }
        for (const c of F.candidates) { const lv = Math.max(...c.rooms.map(id => (F.byId.get(id) || {}).level || 0)), q = P(c.at, lv); g.beginPath(); g.arc(q[0], q[1], 8, 0, 6.2832); g.fillStyle = "rgba(255,176,32,0.25)"; g.fill(); g.lineWidth = 2; g.strokeStyle = FAC_COLOURS.cand; g.stroke(); g.fillStyle = FAC_COLOURS.cand; g.font = "bold 11px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("?", q[0], q[1] + 0.5); facilityDebug._hits.push({ x: q[0], y: q[1], text: c.rooms.join(" ↔ ").toUpperCase() + " — CANDIDATE SLIDING DOOR, UNCONFIRMED: " + c.evidence }); }
        // confirmed ramps: a curved staircase is drawn as stepped arcs, the low end heavier, with an arrow down
        for (const rp of F.ramps) {
            if (!rp.centre) continue; const from = (F.byId.get(rp.rooms[0]) || {}).level || 0, to = (F.byId.get(rp.rooms[1]) || {}).level || 0, steps = 8;
            for (let k = 0; k <= steps; k++) { const rad = rp.r_inner + (rp.r_outer - rp.r_inner) * k / steps, pts = [];
                for (let d = 0; d <= 12; d++) { const a = (rp.from_deg + (rp.to_deg - rp.from_deg) * d / 12) * Math.PI / 180, lv = from + (to - from) * k / steps; pts.push(_facProject(rp.centre[0] + Math.cos(a) * rad, rp.centre[1] + Math.sin(a) * rad, lv, W, H)); }
                g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); g.lineWidth = k === steps ? 3 : 1.5; g.strokeStyle = FAC_COLOURS.ok; g.stroke(); }
            const m = _facProject(rp.centre[0] + Math.cos(Math.PI) * (rp.r_inner + rp.r_outer) / 2, rp.centre[1], to, W, H); facilityDebug._hits.push({ x: m[0], y: m[1], text: rp.id.toUpperCase() + " \u2014 " + rp.note });
        }
        for (const r of F.candidateRamps) { const q = P(r.at, 0); g.strokeStyle = FAC_COLOURS.cand; g.lineWidth = 2; g.strokeRect(q[0] - 7, q[1] - 7, 14, 14); g.fillStyle = FAC_COLOURS.cand; g.font = "bold 10px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText("R", q[0], q[1] + 0.5); facilityDebug._hits.push({ x: q[0], y: q[1], text: "RAMP / STAIR? " + r.evidence + " (levels " + r.between_levels.join("→") + ")" }); }
        for (const e of F.exits) { const q = P(e.at, 0); g.fillStyle = e.blocked ? FAC_COLOURS.wall : FAC_COLOURS.outer; g.font = "bold 10px monospace"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(e.blocked ? "✖" : "→", q[0], q[1]); facilityDebug._hits.push({ x: q[0], y: q[1], text: e.id.toUpperCase() + " — " + e.note + " (not a connection)" }); }
    }
    if (L.nav) {
        const node = id => { const r = F.byId.get(id); return r ? P(_facCentroid(r.poly), r.level) : null; };
        for (const e of facilityNavEdges(F, true)) { const a = node(e.a), b = node(e.b); if (!a || !b) continue; g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.setLineDash(e.confirmed ? [] : [5, 6]); g.lineWidth = e.confirmed ? 3 : 1.2; g.strokeStyle = e.confirmed ? FAC_COLOURS.ok : "rgba(255,176,32,0.55)"; g.stroke(); g.setLineDash([]); }
        for (const r of F.rooms) { const q = node(r.id); g.beginPath(); g.arc(q[0], q[1], 5, 0, 6.2832); g.fillStyle = "#05070f"; g.fill(); g.lineWidth = 2; g.strokeStyle = FAC_COLOURS.ok; g.stroke(); }
    }
    // the readout
    const v = facilityValidateCached(F), comps = facilityComponents(F, false), compsC = facilityComponents(F, true);
    const lines = ["FACILITY · " + FACILITY_MAP.id + " · " + facilityScale() + " px/tile", "ROOMS " + F.rooms.length + " · CONFIRMED OPENINGS " + F.openings.length + " · CANDIDATES " + F.candidates.length,
        "NAV: " + comps.length + " separate area" + (comps.length === 1 ? "" : "s") + " (" + compsC.length + " if every candidate were real)", v.errors.length ? "ERRORS: " + v.errors.length + " — " + v.errors[0] : "RULES OK · arena and nest area sealed (" + (v.info.arenaAgents || 0) + " agent walks, " + (v.info.arenaLeaks || 0) + " leaks) "];
    g.textAlign = "left"; g.textBaseline = "top"; g.font = "bold 12px monospace";
    lines.forEach((t, i) => { g.fillStyle = i === 3 ? (v.errors.length ? "#ff6655" : FAC_COLOURS.ok) : "#9fb0d0"; g.fillText(t.slice(0, Math.floor((W - 24) / 7.3)), 12, H - 106 + i * 16); });
    if (facilityDebug.note) { g.fillStyle = FAC_COLOURS.cand; g.font = "bold 12px monospace"; g.fillText(facilityDebug.note.slice(0, Math.floor((W - 24) / 7.3)), 12, H - 36); }
}
function _facCentroidOfBand(poly) { const b = poly.reduce((m, p) => ({ x0: Math.min(m.x0, p[0]), x1: Math.max(m.x1, p[0]), y0: Math.min(m.y0, p[1]), y1: Math.max(m.y1, p[1]) }), { x0: Infinity, x1: -Infinity, y0: Infinity, y1: -Infinity }); return [(b.x0 + b.x1) / 2, b.y0 + 2.2]; }
function _facLabel(g, text, x, y, col, size) {
    g.save(); g.font = "italic 900 " + Math.round(size) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.lineWidth = 3; g.strokeStyle = "rgba(5,7,15,0.85)"; g.strokeText(text, x, y); g.fillStyle = col; g.fillText(text, x, y); g.restore();
}

function facilityDebugBuild() {
    if (typeof document === "undefined" || !document.createElement || !document.body) return null;
    let root = document.getElementById("facilityDebug"); if (root && root.getAttribute && root.getAttribute("data-built")) return root;
    if (!root) { root = document.createElement("div"); root.id = "facilityDebug"; document.body.appendChild(root); }
    root.setAttribute("data-built", "1");
    const cv = document.createElement("canvas"); root.appendChild(cv);
    const bar = document.createElement("div"); bar.className = "fd-bar"; root.appendChild(bar);
    const mk = (label, fn, id) => { const b = document.createElement("button"); b.textContent = label; if (id) b.setAttribute("data-layer", id); b.addEventListener("click", ev => { ev.stopPropagation(); fn(b); facilityDebugRender(); }); bar.appendChild(b); return b; };
    [["outlines", "OUTLINES"], ["collision", "COLLISION"], ["openings", "OPENINGS"], ["elevation", "ELEVATION"], ["nav", "NAV"]].forEach(([id, label]) => mk(label, () => { facilityDebug.layers[id] = !facilityDebug.layers[id]; }, id));
    mk("FIT", () => { facilityDebug.fitted = false; }); mk("+", () => { facilityDebug.cam.z *= 1.25; }); mk("−", () => { facilityDebug.cam.z /= 1.25; });
    mk("\u25b6 PLAY", () => { facilityDebugSet(false); if (typeof facilityPlayStart === "function") facilityPlayStart(); }).className = "fd-play";   // walk it (js/facilityplay.js)
    const x = mk("✕ CLOSE", () => facilityDebugSet(false)); x.className = "fd-close";
    // pan (drag), zoom (wheel, pinch), and a tap on a ? or R shows its evidence
    const ptr = new Map(); let moved = 0, pinch = 0;
    cv.addEventListener("pointerdown", e => { ptr.set(e.pointerId, [e.clientX, e.clientY]); moved = 0; pinch = 0; if (cv.setPointerCapture) { try { cv.setPointerCapture(e.pointerId); } catch (_) {} } });
    cv.addEventListener("pointermove", e => {
        if (!ptr.has(e.pointerId)) return; const p = ptr.get(e.pointerId), c = facilityDebug.cam, z = c.z; ptr.set(e.pointerId, [e.clientX, e.clientY]);
        if (ptr.size === 2) { const [a, b] = [...ptr.values()], d = Math.hypot(a[0] - b[0], a[1] - b[1]); if (pinch) c.z = Math.max(0.03, Math.min(6, c.z * d / pinch)); pinch = d; }
        else { const dx = e.clientX - p[0], dy = e.clientY - p[1]; moved += Math.abs(dx) + Math.abs(dy); const u = dx / (_facTW() * z), v = dy / (_facTH() * z); c.x -= (u + v) / 2; c.y -= (v - u) / 2; }
        facilityDebugRender();
    });
    const up = e => { if (ptr.size === 1 && moved < 6) facilityDebugTap(e.clientX, e.clientY); ptr.delete(e.pointerId); pinch = 0; };
    cv.addEventListener("pointerup", up); cv.addEventListener("pointercancel", e => { ptr.delete(e.pointerId); pinch = 0; });
    cv.addEventListener("wheel", e => { e.preventDefault(); facilityDebug.cam.z = Math.max(0.03, Math.min(6, facilityDebug.cam.z * (e.deltaY < 0 ? 1.15 : 1 / 1.15))); facilityDebugRender(); }, { passive: false });
    return root;
}
function facilityDebugTap(x, y) {
    let best = null, bd = 22;
    for (const h of facilityDebug._hits) { const d = Math.hypot(h.x - x, h.y - y); if (d < bd) { bd = d; best = h; } }
    facilityDebug.note = best ? best.text : ""; facilityDebugRender();
}
function facilityDebugRender() {
    const root = typeof document !== "undefined" ? document.getElementById("facilityDebug") : null;
    if (root && root.querySelectorAll) root.querySelectorAll("[data-layer]").forEach(b => { const on = facilityDebug.layers[b.getAttribute("data-layer")]; if (b.classList) b.classList.toggle("on", !!on); });
    facilityDebugDraw();
}
function facilityDebugSet(on) {
    facilityDebug.on = !!on;
    const root = on ? facilityDebugBuild() : (typeof document !== "undefined" ? document.getElementById("facilityDebug") : null);
    if (root && root.classList) root.classList.toggle("open", !!on);
    if (on) { facilityDebug.fitted = false; facilityDebugRender(); }
    return facilityDebug.on;
}
function facilityDebugToggle() { return facilityDebugSet(!facilityDebug.on); }
function initFacilityDebug() {
    if (typeof window === "undefined" || !window.addEventListener) return;
    window.addEventListener("keydown", e => { if (e && e.key === "F3") { if (e.preventDefault) e.preventDefault(); facilityDebugToggle(); } });
    window.addEventListener("resize", () => { if (facilityDebug.on) { facilityDebug.fitted = false; facilityDebugRender(); } });
    try { if (/[?&]facility\b/.test((window.location && window.location.search) || "")) facilityDebugSet(true); } catch (e) {}
}
try { initFacilityDebug(); } catch (e) { /* no page (the test sandbox) */ }
