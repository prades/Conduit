// ─────────────────────────────────────────────────────────
//  FLUX MOVE: the Flux technician's object tool (docs/FLUX-MOVEMENT.md; the roadmap's Milestone One, docs/NEXT-PHASE-ROADMAP.md §2)
// ─────────────────────────────────────────────────────────
// ASKED (the roadmap, the owner's): "The Flux Technician manipulates eligible existing environmental objects. [...] The ability allows the player to select an object, reposition it within its movement
// allowance, and rotate it to create useful environmental arrangements. This is an object manipulation tool, not a terrain-editing tool." Then the owner's answers (2026-11-06): "Retire it now" (Telegrab goes),
// "Test room + arena", "60 s cooldown", "Prompt buttons" (⟳ ROTATE, ✓ PLACE), "FLUX MOVE" (its name), "Square" (the reach).
// This file is the RULES: what can move, where to, and the check of a place; js/facilityplay.js facilitySolidMove carries a move out in one transaction; js/techabilities.js is the ability (the chip, the aim,
// the prompt's buttons, the cooldown).
//   WHAT MOVES  a prop with a `flux` field (js/facilitymap.js): the arena's loose crates, barrels and barriers (and, with ?fluxlab, the test room's: FLUX_LAB_MAP, js/fluxlab.js). Nothing else can be picked: a tap on
//               any other prop says it does not move.
//   HOW FAR     every tile of where it goes is within `range` tiles (2) of a tile it stands on at the start of that move, a diagonal counting as one step (the owner: "Square"; a 5 x 5 area round a one-tile
//               object). Measured afresh for each move, so moves never add up, and one move has no steps in it to chain.
//   WHERE       whole tiles of floor in its own room, at that room's height (never on a stair); not on a doorway's floor or the spot in front of it, a launcher site, a rubble's work spot, a follower
//               spot, an item or a capsule on the floor, or the Crystal; under no body (the player, a follower, a clone, a creature, one in the air coming down there); and never cutting the walkable floor in
//               two (the owner's default, FLUX-MOVEMENT.md §11: every room and door stays reachable).
//   TURNING     a two-tile object with `turn` (the barriers) turns in 90° steps: along x, or along y. A one-tile object looks the same turned (§11): it has nothing to turn.
//   THE PLACE   is checked as it is shown and again the moment it is placed (bodies move between the two): one that fails then is refused, and nothing changes.
//   KEPT        each moved object's place and turn (the save's `moved`), put back when a saved game loads; NEW GAME puts everything back where it was built.
const FLUX = {
    col: "#c77dff",      // the flux technician's violet (Telegrab's chip)
    body: 0.4,           // tiles: a body's reach into a tile (js/facilityplay.js FP_BODY)
    near: 6,             // tiles: how far round a place the floor's stretches are first checked (further only when they do not meet within it)
};

// ── what can move, and where it stands ──
function _fluxF() { return typeof _fp !== "undefined" && _fp && _fp.F ? _fp.F : null; }
function fluxMovable(s) { return !!s && !!s.flux && s.shape === "rect" && !s.open && !s.tilted; }
function fluxObjects() { const F = _fluxF(); return F ? F.solids.filter(fluxMovable) : []; }
function fluxObject(id) { const F = _fluxF(); const s = F ? F.solids.find(q => q.id === id) : null; return fluxMovable(s) ? s : null; }
// the tiles it stands on now ("x,y"), its corner tile and its size along x and y
function fluxHere(s) { const b = s.bb; return { x0: Math.round(b[0] + 0.5), y0: Math.round(b[1] + 0.5), w: Math.round(b[2] - b[0]), h: Math.round(b[3] - b[1]) }; }
function fluxCellsOf(x0, y0, w, h) { const out = []; for (let x = x0; x < x0 + w; x++) for (let y = y0; y < y0 + h; y++) out.push(x + "," + y); return out; }
// its size for a place: turned (a quarter turn from how it stands now) swaps the two
function fluxSize(s, turn) { const H = fluxHere(s); return turn && s.flux.turn ? { w: H.h, h: H.w } : { w: H.w, h: H.h }; }
function fluxCanTurn(s) { if (!fluxMovable(s) || !s.flux.turn) return false; const H = fluxHere(s); return H.w !== H.h; }
// THE REACH: every tile within `range` of a tile it stands on (diagonals count as one): the area the grid shows
function fluxRegion(s) {
    const H = fluxHere(s), r = s.flux.range, out = new Set();
    for (let x = H.x0 - r; x < H.x0 + H.w + r; x++) for (let y = H.y0 - r; y < H.y0 + H.h + r; y++) out.add(x + "," + y);
    return out;
}

// ── the spots kept clear: doorways and the spot in front of each, launcher sites, rubble work spots, items and capsules on the floor, the Crystal ──
function fluxKept() {
    const F = _fluxF(), out = new Map(); if (!F) return out;
    const put = (x, y, why) => { if (Number.isFinite(x) && Number.isFinite(y)) { const k = Math.round(x) + "," + Math.round(y); if (!out.has(k)) out.set(k, why); } };
    for (const p of ((_fp && _fp.portals) || [])) { for (const k of (typeof facilityRectCells === "function" ? facilityRectCells(p.rect) : [])) if (!out.has(k)) out.set(k, "NOT IN A DOORWAY"); put(p.ax, p.ay, "NOT IN FRONT OF A DOORWAY"); }
    for (const s of (F.launchSites || [])) for (const q of [s.at, s.land, s.drop, s.dropTo]) if (q) put(q[0], q[1], "NOT ON A LAUNCHER SITE");
    for (const l of (F.ledges || [])) for (const q of [l.at, l.to]) put(q[0], q[1], "NOT ON THE LEDGE");
    for (const r of (F.rubble || [])) if (r.work) put(r.work[0], r.work[1], "NOT ON THE RUBBLE'S WORK SPOT");
    for (const it of ((_fp && _fp.items) || [])) if (it.fp === "pickup" && !it.taken) put(it.x, it.y, "NOT ON AN ITEM");
    if (typeof cloneBodies !== "undefined") for (const b of cloneBodies) if (b) put(b.x, b.y, "NOT ON A BODY OR A CAPSULE");
    if (typeof crystal !== "undefined" && crystal) for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) put(crystal.x + dx, crystal.y + dy, "NOT ON THE CRYSTAL");
    return out;
}
// a body on any of these tiles (its reach into a tile: FLUX.body): the player, every unit and creature, one in the air (where it comes down too), one under the floor
function fluxBodyOn(keys) {
    const cells = keys.map(k => k.split(",").map(Number)), R = FLUX.body;
    const hit = (x, y) => cells.some(([cx, cy]) => { const dx = Math.max(0, Math.abs(x - cx) - 0.5), dy = Math.max(0, Math.abs(y - cy) - 0.5); return dx * dx + dy * dy < R * R; });
    const all = (typeof actors !== "undefined" ? actors : []).concat(typeof player !== "undefined" && player ? [player] : []);
    for (const a of all) {
        if (!a || a.dead || !Number.isFinite(a.x)) continue;
        if (hit(a.x, a.y)) return a;
        if (a._flight && Number.isFinite(a._flight.x1) && hit(a._flight.x1, a._flight.y1)) return a;
    }
    return null;
}

// ── THE CHECK of a place: the object at corner tile (x0, y0), turned or not. { ok, cells, w, h, turned } or { ok: false, why, cells }. opts.bodies false: the bodies are not asked about (the grid shows them
// live); opts.reach false: anywhere in its room (a saved game's place). The place it stands now is no place to go.
function fluxCheck(s, x0, y0, turn, opts) {
    opts = opts || {};
    const F = _fluxF(), P = _fp && _fp.P; if (!F || !fluxMovable(s)) return { ok: false, why: "IT DOES NOT MOVE", cells: [] };
    if (!Number.isInteger(x0) || !Number.isInteger(y0)) return { ok: false, why: "NOT A PLACE", cells: [] };
    const sz = opts.size ? { w: opts.size[0], h: opts.size[1] } : fluxSize(s, turn), cells = fluxCellsOf(x0, y0, sz.w, sz.h), H = fluxHere(s), turned = opts.size ? sz.h > sz.w : turn && fluxCanTurn(s) ? !s.flux.turned : !!s.flux.turned;   // (opts.size: the tiles under its hexes, ON THE HEXES below)
    const res = (why) => ({ ok: false, why, cells, w: sz.w, h: sz.h, turned });
    if (x0 === H.x0 && y0 === H.y0 && sz.w === H.w && sz.h === H.h) return res("IT IS THERE NOW");
    if (opts.reach !== false) { const R = fluxRegion(s); if (!cells.every(k => R.has(k))) return res("TOO FAR · " + s.flux.range + " TILES AT MOST"); }
    const own = new Set(fluxCellsOf(H.x0, H.y0, H.w, H.h)), h0 = facilityHeightAt(H.x0, H.y0, F);
    const kept = fluxKept();
    for (const k of cells) {
        const [x, y] = k.split(",").map(Number), room = facilityRoomAt(x, y, F);
        if (!room || room.id !== s.room) return res("NOT IN ITS ROOM");
        if (Math.abs(facilityHeightAt(x, y, F) - h0) > 0.01) return res("NOT ON A STAIR");
        if (kept.has(k)) return res(kept.get(k));
        if (own.has(k)) continue;   // (where it stands now: floor again once it goes)
        if (!_fp.cells.has(k) || !_fp.cellsP.has(k)) { const o = facilitySolidAt(x, y, F); return res(o && o !== s ? "SOMETHING STANDS THERE" : "NOT ON THE FLOOR"); }
    }
    for (const k of cells) if (own.has(k)) {   // its own tiles: floor once it goes (asked of the map with it taken away for a moment: facilitySolidAt passes an open solid by)
        const [x, y] = k.split(",").map(Number), p = P ? P.solids.find(q => q.id === s.id) : null; s.open = true; if (p) p.open = true;
        let ok = false; try { ok = facilityFloorAt(x, y, F) && (!P || facilityFloorAt(x, y, P)); } finally { s.open = false; if (p) p.open = false; }
        if (!ok) return res("NOT ON THE FLOOR");
    }
    if (opts.bodies !== false) { const b = fluxBodyOn(cells); if (b) return res(b === (typeof player !== "undefined" ? player : null) ? "YOU ARE STANDING THERE" : "SOMEONE IS STANDING THERE"); }
    if (_fluxSplits(s, cells)) return res("IT WOULD SHUT A WAY THROUGH");
    return { ok: true, cells, w: sz.w, h: sz.h, turned };
}

// ── NEVER CUTTING THE FLOOR IN TWO: the floor round the new place stays one stretch. The floor's graph is the routes' own (js/facilityplay.js: eight ways, no corner cut, nothing in the way): the cells the
// object would cover come out of it, the cells it would leave go in. Every cell beside the new place that was in one stretch with the others must still reach them without crossing it: first within FLUX.near
// tiles of it (nearly always enough), else anywhere. True when it would cut a stretch in two.
function _fluxSplits(s, cells) {
    if (!_fp || !_fp.cellsP) return false;
    const P = _fp.P, F = _fp.F, p = P ? P.solids.find(q => q.id === s.id) : null, H = fluxHere(s), N = new Set(cells), own = fluxCellsOf(H.x0, H.y0, H.w, H.h);
    // the cells it leaves that a body can stand on once it has gone
    const freed = new Set();
    s.open = true; if (p) p.open = true;
    try { for (const k of own) if (!N.has(k)) { const [x, y] = k.split(",").map(Number); if (facilityFloorAt(x, y, F) && (!P || facilityFloorAt(x, y, P))) freed.add(k); } } finally { s.open = false; if (p) p.open = false; }
    const has = k => !N.has(k) && (_fp.cellsP.has(k) || freed.has(k));
    const los = (ax, ay, bx, by) => {   // the routes' own sight between two neighbouring cells: cached for cells that were floor already; with the object taken away for one it leaves
        const ka = ax + "," + ay, kb = bx + "," + by;
        if (freed.has(ka) || freed.has(kb)) { s.open = true; if (p) p.open = true; try { return _fpLos(ax, ay, bx, by); } finally { s.open = false; if (p) p.open = false; } }
        const key = ka + ">" + kb; let v = _fp.edges.get(key); if (v === undefined) { v = _fpLos(ax, ay, bx, by); _fp.edges.set(key, v); }
        return v;
    };
    const edge = (ax, ay, bx, by) => has(bx + "," + by) && (ax === bx || ay === by || (has(bx + "," + ay) && has(ax + "," + by))) && los(ax, ay, bx, by);
    // the cells beside the new place, by the stretch each was in (the floor before the move: _fpComps)
    const cm = _fpComps(), groups = new Map();
    for (const k of cells) {
        if (!_fp.cellsP.has(k)) continue;   // (a tile under the object now was no part of any stretch)
        const [x, y] = k.split(",").map(Number);
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
            if (!dx && !dy) continue; const nx = x + dx, ny = y + dy, nk = nx + "," + ny;
            if (N.has(nk) || !_fp.cellsP.has(nk) || !_fpEdgeOk(x, y, nx, ny)) continue;
            const c = cm.get(nk); if (c === undefined) continue; if (!groups.has(c)) groups.set(c, new Set()); groups.get(c).add(nk);
        }
    }
    const reach = (start, want, box) => {   // from one cell: are all of `want` reached (within box, when given)?
        const seen = new Set([start]), q = [start]; let left = want.size - (want.has(start) ? 1 : 0);
        while (q.length && left > 0) {
            const k = q.pop(), [x, y] = k.split(",").map(Number);
            for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
                if (!dx && !dy) continue; const nx = x + dx, ny = y + dy, nk = nx + "," + ny; if (seen.has(nk)) continue;
                if (box && (nx < box[0] || nx > box[2] || ny < box[1] || ny > box[3])) continue;
                if (!edge(x, y, nx, ny)) continue;
                seen.add(nk); q.push(nk); if (want.has(nk)) left--;
            }
        }
        return left <= 0;
    };
    const xs = cells.map(k => +k.split(",")[0]), ys = cells.map(k => +k.split(",")[1]), box = [Math.min(...xs) - FLUX.near, Math.min(...ys) - FLUX.near, Math.max(...xs) + FLUX.near, Math.max(...ys) + FLUX.near];
    for (const want of groups.values()) {
        if (want.size < 2) continue;
        const start = want.values().next().value;
        if (!reach(start, want, box) && !reach(start, want, null)) return true;
    }
    return false;
}

// ── THE MOVE: checked again (bodies and all), then carried out in one transaction (js/facilityplay.js facilitySolidMove) and kept for the save ──
function fluxMoveTo(s, x0, y0, turn, opts) {
    const c = fluxCheck(s, x0, y0, turn, opts); if (!c.ok) return c;
    const from = fluxHere(s), r = typeof facilitySolidMove === "function" ? facilitySolidMove(s.id, x0, y0, c.w, c.h, c.turned) : { ok: false, why: "NO MAP" };
    if (!r.ok) return { ok: false, why: r.why, cells: c.cells };
    if (!_fp.moved) _fp.moved = [];
    _fp.moved = _fp.moved.filter(m => m.id !== s.id); _fp.moved.push({ id: s.id, x: x0, y: y0, t: c.turned ? 1 : 0 });
    _fluxHexSet(s, null);   // (moved by tiles: its hex is its tile's from now, fluxHexOf)
    if (typeof elementEffects !== "undefined" && !(opts && opts.quiet)) for (const q of [[from.x0 + (from.w - 1) / 2, from.y0 + (from.h - 1) / 2], [x0 + (c.w - 1) / 2, y0 + (c.h - 1) / 2]]) elementEffects.push({ type: "ring", x: q[0], y: q[1], radius: 0.6 + 0.3 * Math.max(c.w, c.h), color: FLUX.col, life: 30 });
    return { ok: true, cells: c.cells, turned: c.turned, from };
}

// ── THE SAVE (js/facilitysave.js): each moved object's place and turn, in the order they were moved; put back before the player's spot ──
function fluxSnapshot() { return typeof _fp !== "undefined" && _fp && Array.isArray(_fp.moved) ? _fp.moved.map(m => Number.isFinite(m.hx) ? { id: m.id, x: m.x, y: m.y, t: m.t ? 1 : 0, hx: m.hx, hy: m.hy, d: m.d | 0 } : { id: m.id, x: m.x, y: m.y, t: m.t ? 1 : 0 }) : []; }   // (hx, hy, d: its hex's middle and its turn, ON THE HEXES)
// a saved game's places: each checked as a move is (its room's floor, kept spots, the floor's stretches), but from anywhere in its room, and without the bodies (nobody stands anywhere yet). One that cannot
// go where it was saved stays where it was built. A few passes, so two objects that changed places both come back.
function fluxApply(list) {
    if (typeof _fp === "undefined" || !_fp) return 0;
    _fp.moved = [];
    let todo = (Array.isArray(list) ? list : []).filter(m => m && typeof m.id === "string" && Number.isInteger(m.x) && Number.isInteger(m.y) && fluxObject(m.id));
    const seen = new Set(); todo = todo.reverse().filter(m => !seen.has(m.id) && seen.add(m.id)).reverse();   // (the last place of each, in the order they were moved)
    let n = 0;
    for (let pass = 0; pass < 3 && todo.length; pass++) {
        todo = todo.filter(m => {   // (kept for the next pass while it does not fit)
            const s = fluxObject(m.id); if (!s) return false;
            if (Number.isFinite(m.hx) && Number.isFinite(m.hy) && fluxHexOn()) {   // (a place on the hexes: ON THE HEXES below)
                const r = fluxMoveToHex(s, m.hx, m.hy, m.d | 0, { reach: false, bodies: false, quiet: true, same: true });
                if (r.ok) { n++; return false; } return true; }
            const turn = !!m.t !== !!s.flux.turned, H = fluxHere(s), sz = fluxSize(s, turn);   // (t: turned from how it was built; turn it when it is not so now)
            if (H.x0 === m.x && H.y0 === m.y && sz.w === H.w && sz.h === H.h) { _fp.moved.push({ id: s.id, x: m.x, y: m.y, t: m.t ? 1 : 0 }); n++; return false; }
            const r = fluxMoveTo(s, m.x, m.y, turn, { reach: false, bodies: false, quiet: true });
            if (r.ok) { n++; return false; }
            return true;
        });
    }
    return n;
}

// ── ON THE HEXES (build 2026-11-17ee; the owner, 2026-11-27: "the interactable systems within the map, like moving objects around [...] is all relayed through the hexagon tile grid [...] the player can
// maneuver the object or find a highlighted hexagon tile under whenever they activate their utility ability"; asked: "2 hexes, turn 60°"; 2026-11-28: "I like the simple way of objects blocking the floor";
// docs/FOLLOWER-UTILITIES.md §2, §4.4). FLUX MOVE as the player uses it works on the floor's hexes (js/cardbattle.js THE HEXES, fixed to the world), over the tiles' rules above:
//   WHERE IT STANDS  on a hex's middle (`hexAt`), a two-hex object (a barrier) on that hex and the one beside it in one of the six ways (`hexDir`, 0 = along x, each next a sixth of a turn).
//   WHAT IT BLOCKS   THE SIMPLE WAY: the tile of the game's grid under each of its hexes' middles (one tile; a barrier two in a row or a column, or one where both middles lie over the same tile; where
//                    they lie over tiles corner to corner, the second is taken in the first's column). Everything a place must be (its room's floor, the kept spots, bodies, never cutting the floor in
//                    two) is asked of those tiles by fluxCheck, as ever.
//   HOW FAR          every hex it would stand on is within `range` (2) hexes of one it stands on now, counted hex to hex (the six round each).
//   TURNING          a two-hex object turns a sixth of a turn at a time (⟳ ROTATE), six ways; a one-hex object has nothing to turn.
//   KEPT             its hex and its turn with its tiles (the save's `moved`: hx, hy, d); a save from before has tiles only and loads as it was.
const _FLUX_HEX_DIR = [0, 1, 2, 3, 4, 5].map(i => [Math.cos(i * Math.PI / 3), Math.sin(i * Math.PI / 3)]);
function fluxHexOn() { return typeof cardHex === "function" && typeof cardHexNb === "function" && typeof cardHexKey === "function"; }
function fluxTwo(s) { if (!s || !s.flux) return false; if (s.flux.two === undefined) { const H = fluxHere(s); s.flux.two = H.w * H.h === 2; } return s.flux.two; }   // (a barrier: two hexes; asked first as it is built)
function _fluxHexTile(h) { return [Math.round(h[0]), Math.round(h[1])]; }
function fluxHexB(at, dir) { const d = _FLUX_HEX_DIR[((dir | 0) % 6 + 6) % 6]; return cardHex(at[0] + d[0], at[1] + d[1]); }   // a two-hex object's second hex
// the map's own place for it (js/facilitymap.js: the movable cargo stands on hexes' middles there; the game's grid snaps it to a tile): the raw middle, moved by the map's shift to the game's grid
let _fluxShift = null;
function _fluxRaw(id) {
    if (typeof FACILITY_MAP === "undefined" || typeof facilityScale !== "function") return null;
    const sc = facilityScale(), F = _fluxF(); if (!F) return null;
    if (!_fluxShift) for (const pr of FACILITY_MAP.props || []) { if (!pr.rect) continue; const cx = (pr.rect[0] + pr.rect[2]) / 2 / sc, cy = (pr.rect[1] + pr.rect[3]) / 2 / sc; if (Math.abs(cx - Math.round(cx)) > 1e-6 || Math.abs(cy - Math.round(cy)) > 1e-6 || pr.rect[2] - pr.rect[0] !== sc || pr.rect[3] - pr.rect[1] !== sc) continue;
        const so = F.solids.find(q => q.id === pr.id); if (!so || !so.bb || (_fp.moved || []).some(m => m.id === pr.id)) continue; _fluxShift = [(so.bb[0] + so.bb[2]) / 2 - cx, (so.bb[1] + so.bb[3]) / 2 - cy]; break; }
    const pr = (FACILITY_MAP.props || []).find(q => q.id === id); if (!pr || !pr.rect || !_fluxShift) return null;
    return [(pr.rect[0] + pr.rect[2]) / 2 / sc + _fluxShift[0], (pr.rect[1] + pr.rect[3]) / 2 / sc + _fluxShift[1]];
}
// where it stands: { at: [x, y] its (first) hex's middle, dir, b: its second hex's middle or null }
function fluxHexOf(s) {
    if (!s || !fluxHexOn()) return null;
    if (!s.hexAt) {
        const H = fluxHere(s), two = fluxTwo(s), raw = s.hexSq ? null : _fluxRaw(s.id); let at, dir = 0;
        if (two) { dir = H.w >= H.h ? 0 : 1; const mid = raw && H.w >= H.h ? raw : null; at = mid ? cardHex(mid[0] - 0.5, mid[1]) : cardHex(H.x0, H.y0); }
        else at = raw ? cardHex(raw[0], raw[1]) : cardHex(H.x0, H.y0);
        s.hexAt = at; s.hexDir = dir;
    }
    return { at: s.hexAt, dir: s.hexDir | 0, b: fluxTwo(s) ? fluxHexB(s.hexAt, s.hexDir) : null };
}
function _fluxHexSet(s, at, dir) { const P = _fp && _fp.P, p = P ? P.solids.find(q => q.id === s.id) : null; for (const q of [s, p]) if (q) { q.hexAt = at ? at.slice() : null; q.hexDir = dir | 0; q.hexSq = !at; } if (_fp) { _fp._pss = null; _fp._psc = null; _fp.fluxStamp = (_fp.fluxStamp || 0) + 1; } }   // (fluxStamp: the 3D view places it again, view3d/gameview.js)
// the tiles under a place on the hexes: { x0, y0, w, h }
function fluxHexRect(s, at, dir) {
    const a = _fluxHexTile(at); if (!fluxTwo(s)) return { x0: a[0], y0: a[1], w: 1, h: 1 };
    const b = _fluxHexTile(fluxHexB(at, dir)); if (b[0] !== a[0] && b[1] !== a[1]) b[0] = a[0];   // (corner to corner: the second in the first's column)
    return { x0: Math.min(a[0], b[0]), y0: Math.min(a[1], b[1]), w: Math.abs(a[0] - b[0]) + 1, h: Math.abs(a[1] - b[1]) + 1 };
}
// THE REACH on the hexes: every hex within `range` hexes of one it stands on. A Map of its key to its middle.
function fluxHexRegion(s) {
    const out = new Map(), H = fluxHexOf(s); if (!H) return out; let ring = [H.at].concat(H.b ? [H.b] : []);
    for (const h of ring) out.set(cardHexKey(h[0], h[1]), h);
    for (let i = 0; i < s.flux.range; i++) { const next = []; for (const h of ring) for (const n of cardHexNb(h[0], h[1])) { const k = cardHexKey(n[0], n[1]); if (!out.has(k)) { out.set(k, n); next.push(n); } } ring = next; }
    return out;
}
// THE CHECK of a place on the hexes: its (first) hex's middle and its turn. { ok, at, dir, b, rect, cells } or { ok: false, why, ... }. opts as fluxCheck's; opts.same: where it stands now is a place (a save).
function fluxCheckHex(s, hx, hy, dir, opts) {
    opts = opts || {};
    if (!fluxHexOn() || !fluxMovable(s)) return { ok: false, why: "IT DOES NOT MOVE", cells: [] };
    if (!Number.isFinite(hx) || !Number.isFinite(hy)) return { ok: false, why: "NOT A PLACE", cells: [] };
    const two = fluxTwo(s), at = cardHex(hx, hy), d = two ? ((dir | 0) % 6 + 6) % 6 : 0, b = two ? fluxHexB(at, d) : null, cur = fluxHexOf(s), rect = fluxHexRect(s, at, d), cells = fluxCellsOf(rect.x0, rect.y0, rect.w, rect.h);
    const res = (why) => ({ ok: false, why, at, dir: d, b, rect, cells }), key = h => cardHexKey(h[0], h[1]);
    if (key(at) === key(cur.at) && d === cur.dir) return opts.same ? { ok: true, at, dir: d, b, rect, cells, stay: true } : res("IT IS THERE NOW");
    if (opts.reach !== false) { const R = fluxHexRegion(s); if (!R.has(key(at)) || (b && !R.has(key(b)))) return res("TOO FAR · " + s.flux.range + " HEXES AT MOST"); }
    const H = fluxHere(s);
    if (rect.x0 === H.x0 && rect.y0 === H.y0 && rect.w === H.w && rect.h === H.h) {   // (another hex over its own tiles: nothing of the floor changes)
        return { ok: true, at, dir: d, b, rect, cells, stay: true };
    }
    const c = fluxCheck(s, rect.x0, rect.y0, false, { reach: false, bodies: opts.bodies, size: [rect.w, rect.h] });
    if (!c.ok) return res(c.why === "IT IS THERE NOW" ? "NOT A PLACE" : c.why);
    return { ok: true, at, dir: d, b, rect, cells };
}
// THE MOVE on the hexes: checked again, its tiles moved in one transaction when they change (facilitySolidMove), its hex and its turn set, kept for the save
function fluxMoveToHex(s, hx, hy, dir, opts) {
    const c = fluxCheckHex(s, hx, hy, dir, opts); if (!c.ok) return c;
    const from = fluxHexOf(s), fromAt = from.at.slice();
    if (!c.stay) { const r = typeof facilitySolidMove === "function" ? facilitySolidMove(s.id, c.rect.x0, c.rect.y0, c.rect.w, c.rect.h, c.rect.h > c.rect.w) : { ok: false, why: "NO MAP" }; if (!r.ok) return { ok: false, why: r.why, cells: c.cells }; }
    _fluxHexSet(s, c.at, c.dir);
    if (_fp.items && typeof _fpPropItems === "function") { _fp.items = _fp.items.filter(it => !(it.fp === "prop" && it.id === s.id)); for (const it of _fpPropItems(s)) _fp.items.push(it); }
    if (!_fp.moved) _fp.moved = [];
    _fp.moved = _fp.moved.filter(m => m.id !== s.id); _fp.moved.push({ id: s.id, x: c.rect.x0, y: c.rect.y0, t: c.rect.h > c.rect.w ? 1 : 0, hx: c.at[0], hy: c.at[1], d: c.dir });
    if (typeof elementEffects !== "undefined" && !(opts && opts.quiet)) for (const q of [fromAt, c.at]) elementEffects.push({ type: "ring", x: q[0], y: q[1], radius: 0.7, color: FLUX.col, life: 30 });
    return { ok: true, at: c.at, dir: c.dir, cells: c.cells, from: fromAt };
}
// THE GRID on the hexes, for one turn: every hex of the reach it could be put on (its first hex), and whether it could go there (the bodies are asked live as it is drawn). A Map of the hex's key to its check.
function fluxHexGrid(s, dir) { const out = new Map(); for (const [k, h] of fluxHexRegion(s)) out.set(k, fluxCheckHex(s, h[0], h[1], dir, { bodies: false })); return out; }
// where the 3D view and the sprites draw it: the middle of its hex (of its two hexes), and its turn in sixths
function fluxPlace(s) { const H = fluxHexOf(s); if (!H) return null; return H.b ? { x: (H.at[0] + H.b[0]) / 2, y: (H.at[1] + H.b[1]) / 2, dir: H.dir, two: true } : { x: H.at[0], y: H.at[1], dir: 0, two: false }; }
// the hex of the floor under a tap
function fluxHexAtScreen(ex, ey) { if (typeof techScreenToWorld !== "function" || !fluxHexOn()) return null; const p = techScreenToWorld(ex, ey); return p && Number.isFinite(p.x) ? cardHex(p.x, p.y) : null; }

// ── picking one on the screen: the prop under a tap (its tiles, or its body standing over them), movable or not; the nearest when two are close ──
function fluxPropAtScreen(ex, ey) {
    if (typeof bvUnzoom === "function") [ex, ey] = bvUnzoom(ex, ey);   // (the battle view's zoom: js/battleview.js)
    const F = _fluxF(); if (!F || typeof _techScr !== "function") return null;
    let best = null, bd = Infinity;
    for (const s of F.solids) {
        if (s.open || !s.bb || (s.kind && typeof FP_SELF_SOLIDS !== "undefined" && FP_SELF_SOLIDS.has(s.kind))) continue;
        const cx = (s.bb[0] + s.bb[2]) / 2, cy = (s.bb[1] + s.bb[3]) / 2;
        if (typeof player !== "undefined" && Math.hypot(cx - player.visualX, cy - player.visualY) > 30) continue;
        for (const k of _fpSolidCells(s)) {
            const [x, y] = k.split(",").map(Number), p = _techScr(x, y), mx = p.x, my = p.y + TILE_H;
            const dx = Math.abs(ex - mx), dy = ey - my;
            const onTile = dx / TILE_W + Math.abs(dy) / TILE_H <= 1, onBody = dx <= TILE_W * 0.75 && dy <= 0 && dy >= -56;
            if (!onTile && !onBody) continue;
            const d = Math.hypot(ex - mx, ey - (my - 14)); if (d < bd) { bd = d; best = s; }
        }
    }
    return best;
}
// the tile of the floor under a tap (as a tap walks you there)
function fluxTileAtScreen(ex, ey) { if (typeof techScreenToWorld !== "function") return null; const p = techScreenToWorld(ex, ey); return [Math.round(p.x), Math.round(p.y)]; }

// ── THE GRID: every corner tile in the reach, and whether the object could go there (its own tiles, walls, kept spots, the floor's stretches; the bodies are asked live as it is drawn). Kept per turn in the aim. ──
function fluxGrid(s, turn) {
    const out = new Map(), sz = fluxSize(s, turn), R = fluxRegion(s), H = fluxHere(s);
    for (const k of R) {
        const [x, y] = k.split(",").map(Number);
        if (!fluxCellsOf(x, y, sz.w, sz.h).every(c => R.has(c))) continue;   // (a corner tile from which the object would reach out of the area)
        out.set(k, fluxCheck(s, x, y, turn, { bodies: false }));
    }
    out.delete(H.x0 + "," + H.y0);   // (where it stands now: the grid shows it as it is)
    return out;
}

// ── drawing ──
// THE GRID, ON THE FLOOR (js/techabilities.js techDrawOnTile, as each floor tile is drawn: walls and props in front of it cover it as they cover the floor): each tile of the reach, a faint violet edge; a tile the
// object can go to (its first tile), filled violet; one it cannot, red. Tiles that are not floor (walls, other objects) show nothing: what stands there is seen.
function fluxDrawOnTile(A, tx, ty, px, py) {
    const X = A.flux, k = tx + "," + ty; if (!X || !X.region || !X.region.has(k) || typeof ctx === "undefined") return;
    const g = ctx, W = TILE_W, H = TILE_H, grid = X.grid && X.grid[X.turn ? 1 : 0], c = grid ? grid.get(k) : null;
    g.save(); g.beginPath(); g.moveTo(px, py); g.lineTo(px + W, py + H); g.lineTo(px, py + 2 * H); g.lineTo(px - W, py + H); g.closePath();
    if (c) { const ok = c.ok && !fluxBodyOn(c.cells); g.fillStyle = ok ? "rgba(199,125,255,0.26)" : "rgba(255,74,74,0.2)"; g.fill(); g.strokeStyle = ok ? "rgba(222,184,255,0.8)" : "rgba(255,110,110,0.6)"; g.lineWidth = ok ? 1.5 : 1; }
    else { g.strokeStyle = "rgba(199,125,255,0.28)"; g.lineWidth = 1; }
    g.stroke(); g.restore();
}
// over the world (js/techabilities.js techDrawOverlay, while the tool is aimed):
function _fluxTile(g, x, y, fill, stroke, lw, dash) {
    const p = _techScr(x, y), cx = p.x, cy = p.y + TILE_H;
    g.beginPath(); g.moveTo(cx, cy - TILE_H); g.lineTo(cx + TILE_W, cy); g.lineTo(cx, cy + TILE_H); g.lineTo(cx - TILE_W, cy); g.closePath();
    if (fill) { g.fillStyle = fill; g.fill(); }
    if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1.5; if (dash) g.setLineDash(dash); g.stroke(); if (dash) g.setLineDash([]); }
}
// the movable objects on the screen, outlined in violet (the first pick); the one picked, its reach, the places it can go and cannot, where it stands, and the place chosen (a two-tile object's second tile flashing)
// ON THE HEXES: a point of the floor on the screen (through the 3D view's camera where it draws the frame, else the game's own), and a hex drawn there
function _fluxHexPath(g, h, V) {
    const L = V && typeof facilityLiftPx === "function" ? facilityLiftPx(h[0], h[1]) || 0 : 0, C = cardHexCorners(h[0], h[1], 0.03);
    g.beginPath(); for (let i = 0; i < 6; i++) { let x, y; if (V) { const q = V.screenNow(C[i][0], C[i][1], L); x = q[0]; y = q[1]; } else { const q = _techScr(C[i][0], C[i][1]); x = q.x; y = q.y + TILE_H; } if (!Number.isFinite(x) || !Number.isFinite(y)) return false; i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); return true;
}
function _fluxHexDraw(g, h, V, fill, stroke, lw, dash) { if (!_fluxHexPath(g, h, V)) return; if (fill) { g.fillStyle = fill; g.fill(); } if (stroke) { g.strokeStyle = stroke; g.lineWidth = lw || 1.5; if (dash) g.setLineDash(dash); g.stroke(); if (dash) g.setLineDash([]); } }
// the aim on the hexes: the movable objects' hexes outlined in violet (the first pick); then the picked one's reach (every hex of it edged), the hexes it can go to filled violet and those it cannot red,
// where it stands (white, dashed) and the place chosen (bright; a two-hex object's second hex flashing)
function fluxDrawAimHex(g, A, f0) {
    const X = A.flux, V = typeof VIEW3D !== "undefined" && VIEW3D.showing && VIEW3D.view && typeof VIEW3D.view.screenNow === "function" ? VIEW3D.view : null, pulse = 0.55 + 0.45 * Math.sin(f0 * 0.15);
    g.save(); if (V) g.setTransform(1, 0, 0, 1, 0, 0); g.lineJoin = "round";
    if (!X.s) {
        for (const s of fluxObjects()) { const H = fluxHexOf(s); if (!H || Math.hypot(H.at[0] - player.visualX, H.at[1] - player.visualY) > 16) continue; for (const h of [H.at].concat(H.b ? [H.b] : [])) _fluxHexDraw(g, h, V, "rgba(199,125,255," + (0.14 + 0.14 * pulse).toFixed(3) + ")", "#e2c4ff", 2); }
        g.restore(); return;
    }
    const s = X.s, grid = X.hgrid && X.hgrid[X.dir]; if (!grid) { g.restore(); return; }
    for (const [k, h] of X.hreg) { const c = grid.get(k); if (c && c.stay) { _fluxHexDraw(g, h, V, null, "rgba(199,125,255,0.4)", 1); continue; }
        const ok = !!c && c.ok && !fluxBodyOn(c.cells); _fluxHexDraw(g, h, V, ok ? "rgba(199,125,255,0.3)" : c ? "rgba(255,74,74,0.16)" : null, ok ? "rgba(226,196,255,0.9)" : c ? "rgba(255,110,110,0.55)" : "rgba(199,125,255,0.3)", ok ? 2 : 1); }
    const H = fluxHexOf(s); for (const h of [H.at].concat(H.b ? [H.b] : [])) _fluxHexDraw(g, h, V, null, "#ffffff", 2.5, [6, 5]);   // where it stands now
    if (X.at) {
        const c = fluxCheckHex(s, X.at[0], X.at[1], X.dir, { bodies: false }), ok = c.ok && !fluxBodyOn(c.cells), col = ok ? "#f0dcff" : "#ff6a6a";
        [c.at].concat(c.b ? [c.b] : []).forEach((h, i) => { if (!h) return; const a = i === 0 ? 0.6 : 0.25 + 0.4 * pulse; _fluxHexDraw(g, h, V, ok ? "rgba(199,125,255," + a.toFixed(3) + ")" : "rgba(255,74,74," + a.toFixed(3) + ")", col, 3, i === 0 ? null : [5, 4]); });
    }
    g.restore();
}
function fluxDrawAim(g, A, f0) {
    const X = A && A.flux; if (!X) return;
    if (typeof fluxHexOn === "function" && fluxHexOn() && (X.hex || !X.s)) return fluxDrawAimHex(g, A, f0);   // (ON THE HEXES)
    const pulse = 0.55 + 0.45 * Math.sin(f0 * 0.15);
    g.save();
    if (!X.s) {
        for (const s of fluxObjects()) { const cx = (s.bb[0] + s.bb[2]) / 2, cy = (s.bb[1] + s.bb[3]) / 2; if (Math.hypot(cx - player.visualX, cy - player.visualY) > 16) continue; for (const k of _fpSolidCells(s)) { const [x, y] = k.split(",").map(Number); _fluxTile(g, x, y, "rgba(199,125,255," + (0.12 + 0.12 * pulse).toFixed(3) + ")", FLUX.col, 2); } }
        g.restore(); return;
    }
    const s = X.s, grid = X.grid && X.grid[X.turn ? 1 : 0]; if (!grid) { g.restore(); return; }   // (the grid itself is drawn with the floor, fluxDrawOnTile: here only where it stands and the place chosen)
    const H = fluxHere(s); for (const k of fluxCellsOf(H.x0, H.y0, H.w, H.h)) { const [x, y] = k.split(",").map(Number); _fluxTile(g, x, y, null, "#ffffff", 2, [5, 4]); }   // where it stands now
    if (X.at) {
        const c = grid.get(X.at[0] + "," + X.at[1]) || fluxCheck(s, X.at[0], X.at[1], X.turn, { bodies: false }), ok = c.ok && !fluxBodyOn(c.cells), col = ok ? "#e8c8ff" : "#ff6a6a";
        (c.cells || []).forEach((k, i) => { const [x, y] = k.split(",").map(Number); const a = i === 0 ? 0.55 : 0.2 + 0.4 * pulse; _fluxTile(g, x, y, ok ? "rgba(199,125,255," + a.toFixed(3) + ")" : "rgba(255,74,74," + a.toFixed(3) + ")", col, 2.5, i === 0 ? null : [4, 3]); });
    }
    g.restore();
}
