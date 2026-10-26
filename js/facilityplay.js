// ─────────────────────────────────────────────────────────
//  FACILITY PLAY — the authored facility (js/facility.js) as a place you can walk
// ─────────────────────────────────────────────────────────
// THE GAME IS THE FACILITY: the page opens it (js/init.js). You start in the Crystal Chamber with a small squad; you, your followers and your clones walk the real rooms: walls, glass, the desk,
// the truck and the liquid vats block, the sliding doors let you through, and tapping the floor finds a path through the doors. The arena's creatures (js/facilityspawn.js) and the tutorial
// (js/facilitytutorial.js, js/tutorial.js) are the game; one save key keeps it (js/facilitysave.js).
//
// How the engine hooks in (each hook is a guarded one-liner where the engine already decides the thing):
//   world         the floor tiles are built from the facility's rooms (_fpBuildWorld)
//   movement      facilityConstrain puts any mover back if it would cross a wall; the player follows a path of waypoints (facilityPlayerStep)
//   steering      a follower walking toward a target around a wall steers to the next waypoint (_walkStep, _moveToward, followPlayer)
//   drawing       wall pieces, prop cells, doors and fixtures are depth-sorted into the game's own draw list (facilityDrawItems / drawFacilityItem)
// The geometry is the SNAPPED copy (facilityBuild({ snap: true })): every wall runs along tile edges, so a floor tile is wholly inside or outside a room.

let facilityPlay = false;
let _fp = null;
const FP_BODY = 0.4;              // tiles: how far a body keeps from a wall (what the walls enforce)
const FP_PLAN = 0.45;             // tiles: how far a PLANNED path keeps from a wall: wider than the body, so a route never grazes a corner or a door post the walls would then snag it on
const FP_PLAYER_SPEED = 0.13;     // tiles a frame
const FP_ELEV_PX = 34;            // px of screen height per tile of height (the map's levels: js/facilitymap.js)
const FP_WALL_H = 122;            // px: how tall a wall stands on screen (a door is FP_DOOR_H: two tiles; the wall above it is a header)
const FP_DOOR_H = 108;            // px: how tall a door is
const FP_WALL_X = FP_WALL_H - 74;
const FP_WALL_T = 1.0;            // tiles: a wall's thickness = the gap the building was spaced out by (js/facilitygrow.js) // px: how much taller the walls are than when the decor was laid out
const FP_ROOM_COL = { crystal_chamber: "#2b6a8a", teleport_room_1: "#5a3a8a", teleport_room_2: "#5a3a8a", front_lobby: "#8a6a2a", security_room: "#2a7a6a", show_room: "#3a8aa0", lab_hallway: "#2a4a8a", experiment_lab: "#2a8a7a", lab_passage: "#2a8a7a", observation_deck: "#6a5a3a", armory: "#6a5a2a", arena: "#8a3a2a", catwalks: "#7a6a2a", nest_area: "#6a2a4a", teleport_stair_room: "#6a4a9a" };

// ── the world ──
function _fpFloorTile(x, y, room) { return { x, y, type: "floor", facility: true, room }; }
function _fpBuildWorld(F) {
    world = []; worldTileMap = new Map(); const cells = new Map();
    for (let x = Math.floor(F.bounds.minX); x <= Math.ceil(F.bounds.maxX); x++) for (let y = Math.floor(F.bounds.minY); y <= Math.ceil(F.bounds.maxY); y++) {
        if (!facilityWalkable(x, y, F)) continue;
        const room = facilityRoomAt(x, y, F), t = _fpFloorTile(x, y, room.id);
        world.push(t); worldTileMap.set(x + "," + y, t); cells.set(x + "," + y, [x, y]);
    }
    return cells;
}

// ── navigation: A* over tile centres, with line-of-sight smoothing ──
function _fpLos(x0, y0, x1, y1) {
    const F = _fp.P, d = Math.hypot(x1 - x0, y1 - y0), n = Math.max(1, Math.ceil(d / 0.25));
    for (let i = 1; i <= n; i++) { const t = i / n; if (!facilityWalkable(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, F)) return false; }
    return facilityCanStep(x0, y0, x1, y1, F);
}
function facilityLosFrom(x0, y0, x1, y1) { return !_fp || _fpLos(x0, y0, x1, y1); }
function _fpNearestCell(x, y) {
    const c = _fp.cellsP, rx = Math.round(x), ry = Math.round(y);
    if (c.has(rx + "," + ry)) return [rx, ry];
    for (let r = 1; r <= 4; r++) { let best = null, bd = Infinity; for (let dx = -r; dx <= r; dx++) for (let dy = -r; dy <= r; dy++) { if (c.has((rx + dx) + "," + (ry + dy))) { const d = (rx + dx - x) ** 2 + (ry + dy - y) ** 2; if (d < bd) { bd = d; best = [rx + dx, ry + dy]; } } } if (best) return best; }
    return null;
}
function _fpEdgeOk(ax, ay, bx, by) {
    if (!_fp.cellsP.has(bx + "," + by)) return false;
    if (ax !== bx && ay !== by && !(_fp.cellsP.has(bx + "," + ay) && _fp.cellsP.has(ax + "," + by))) return false;   // no cutting a corner
    const k = ax + "," + ay + ">" + bx + "," + by; let v = _fp.edges.get(k);
    if (v === undefined) { v = _fpLos(ax, ay, bx, by); _fp.edges.set(k, v); }   // sampled, so a diagonal cannot slip through a wall's corner
    return v;
}
// Which stretch of floor each cell is part of (the cells that can walk to one another): labelled once, the first time a route is asked for. A route between two stretches is refused at once instead of
// by searching the whole of one for a way into the other (the nest area is one stretch, the catwalks another).
function _fpComps() {
    if (_fp.comp) return _fp.comp;
    const comp = new Map(); let n = 0;
    for (const [k, c] of _fp.cellsP) {
        if (comp.has(k)) continue; n++; comp.set(k, n); const q = [c];
        while (q.length) { const [x, y] = q.pop(); for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) { if (!dx && !dy) continue; const nk = (x + dx) + "," + (y + dy); if (comp.has(nk) || !_fpEdgeOk(x, y, x + dx, y + dy)) continue; comp.set(nk, n); q.push([x + dx, y + dy]); } }
    }
    return (_fp.comp = comp);
}
// The cells from (x0,y0) to (x1,y1), or null if there is no way.
function _fpCellPath(sx, sy, gx, gy) {
    const key = sx + "," + sy + ">" + gx + "," + gy; if (_fp.paths.has(key)) return _fp.paths.get(key);
    { const cm = _fpComps(); if (cm.get(sx + "," + sy) !== cm.get(gx + "," + gy)) { if (_fp.paths.size > 600) _fp.paths.clear(); _fp.paths.set(key, null); return null; } }
    const heap = [[0, sx, sy]], g = new Map([[sx + "," + sy, 0]]), from = new Map(), done = new Set();
    const push = (n) => { heap.push(n); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { let l = 2 * i + 1, r = l + 1, m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
    let found = false;
    while (heap.length) {
        const [, x, y] = pop(), k = x + "," + y; if (done.has(k)) continue; done.add(k);
        if (x === gx && y === gy) { found = true; break; }
        for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) {
            if (!dx && !dy) continue; const nx = x + dx, ny = y + dy, nk = nx + "," + ny; if (done.has(nk) || !_fpEdgeOk(x, y, nx, ny)) continue;
            const ng = g.get(k) + (dx && dy ? 1.4142 : 1); if (g.has(nk) && g.get(nk) <= ng) continue;
            g.set(nk, ng); from.set(nk, k); push([ng + 1.05 * Math.hypot(gx - nx, gy - ny), nx, ny]);   // (a slightly greedy heuristic: a route on a map this size need not be the very shortest)
        }
    }
    let out = null;
    if (found) { out = []; let k = gx + "," + gy; while (k) { const [x, y] = k.split(",").map(Number); out.push([x, y]); k = from.get(k); } out.reverse(); }
    if (_fp.paths.size > 600) _fp.paths.clear();
    _fp.paths.set(key, out); return out;
}
// Waypoints from the mover's exact position to the exact target: the cell path pulled tight wherever the line of sight allows it.
function facilityPath(x0, y0, x1, y1) {
    if (!_fp) return null;
    const s = _fpNearestCell(x0, y0), e = _fpNearestCell(x1, y1); if (!s || !e) return null;
    const cp = _fpCellPath(s[0], s[1], e[0], e[1]); if (!cp) return null;
    const pts = [[x0, y0]].concat(cp).concat([[x1, y1]]), out = []; let i = 0;   // (the start cell's centre too: the mover is rarely exactly on it, and a door's edge is tight)
    while (i < pts.length - 1) { let j = pts.length - 1; while (j > i + 1 && !_fpLos(pts[i][0], pts[i][1], pts[j][0], pts[j][1])) j--; out.push(pts[j]); i = j; }
    return out;
}
// Where should a mover head, to get to (tx,ty)? The target itself if it can see it, else the next waypoint round the wall.
// A route is KEPT: it is replanned only when it no longer works (the next waypoint has dropped out of sight, the goal has moved FP_NAV.goalTol tiles (more when it is far off) from where it was planned, or it is FP_NAV.maxAge frames old),
// never merely because the goal moved to the next cell (a squad following you replanned on every step you took: ten routes at once, many times a second) and never for a goal that stands still (two routes of
// about the same length are a coin toss, and a unit that flips between them walks neither). A goal that moves a little is followed by turning the route's last leg to the new spot. Plans are also
// rationed: at most FP_NAV.perFrame a frame, so a crowd that needs routes at once gets them over a few frames instead of one long one; the rest keep walking the old route, or straight on.
const FP_NAV = { goalTol: 2.5, goalFar: 0.3, maxAge: 360, perFrame: 3, retry: 30 };   // (a goal may move 2.5 tiles, or a third of the way to it if that is more: the far ones need no exact route)
function facilitySteer(a, tx, ty) {
    if (!_fp) return [tx, ty];
    if (_fpLos(a.x, a.y, tx, ty)) { a._fpPath = null; return [tx, ty]; }
    const f = typeof frame !== "undefined" ? frame : 0; let p = a._fpPath;
    let why = !p || !p.length ? 1 : 0;
    if (!why) {
        const g = a._fpGoalAt, moved = g ? Math.hypot(tx - g[0], ty - g[1]) : 1e9;
        if (moved > Math.max(FP_NAV.goalTol, FP_NAV.goalFar * Math.hypot(tx - a.x, ty - a.y)) || f - (a._fpAt || 0) > FP_NAV.maxAge || !_fpLos(a.x, a.y, p[0][0], p[0][1])) why = 2;
        else if (moved > 0.02) { const k = p.length - 1, from = k > 0 ? p[k - 1] : [a.x, a.y]; if (_fpLos(from[0], from[1], tx, ty)) p[k] = [tx, ty]; else why = 2; }   // (turn the last leg to where the goal is now)
    }
    if (why) {
        if (_fp.planFrame !== f) { _fp.planFrame = f; _fp.planN = 0; }
        if (why === 1 && a._fpFail && f - a._fpFail < FP_NAV.retry && a._fpFailGoal === Math.round(tx) + "," + Math.round(ty)) return [tx, ty];   // (no way there, found a moment ago: straight on, and not another search every frame)
        if (_fp.planN < FP_NAV.perFrame) {
            _fp.planN++; p = a._fpPath = facilityPath(a.x, a.y, tx, ty); a._fpGoalAt = [tx, ty]; a._fpAt = f;
            if (!p) { a._fpFail = f; a._fpFailGoal = Math.round(tx) + "," + Math.round(ty); } else a._fpFail = 0;
        } else if (why === 2 && p && p.length && _fpLos(a.x, a.y, p[0][0], p[0][1])) { /* rationed: on along the old route */ }
        else return [tx, ty];   // (rationed and no route to go on with: straight on for a frame, and a plan the next)
    }
    if (!p || !p.length) return [tx, ty];
    // a waypoint is passed only when the one after it is in sight (or the unit is on it): turning early cut the corner inside the planning margin and snagged on the wall
    while (p.length > 1) { const d = Math.hypot(p[0][0] - a.x, p[0][1] - a.y); if (d < 0.12 || (d < 0.6 && _fpLos(a.x, a.y, p[1][0], p[1][1]))) p.shift(); else break; }
    return p[0];
}
// THE NAVIGATION LAYER. The AI (follow, fight, jobs, return, hold) walks in straight lines toward whatever it wants; the facility has walls. After each unit has moved, this works out WHAT it
// was heading for (the goal its step points at best: you, the crystal, its job's target, its enemy, a foe or friend nearby) and, if walls stand between it and that goal, takes the same
// length of step along the planned route instead. A step with a clear line to its goal, a step that points at nothing, a flee or a lunge are left as the AI made them.
function _fpGoals(a) {
    const gs = a.post ? [] : [player]; if (crystal && !a.post) gs.push(crystal);   // (a posted follower's round is its own: the player and the Crystal are not what it is walking to)
    if (a.job && a.job.target && Number.isFinite(a.job.target.x)) gs.push(a.job.target);
    if (a._nearestEnemy && !a._nearestEnemy.dead) gs.push(a._nearestEnemy);
    if (a._fpPortalGoal && typeof facilityPortalGoal === "function") { const g = facilityPortalGoal(a); if (g) gs.push(g); }   // (the doorway it is on its way through: js/facilityportals.js)
    const foes = a.team === "green" ? actors : followers;   // the nearest of the other side, within a chase
    let nb = null, nd = 144; for (const o of foes) { if (!o || o.dead || o === a || (a.team === "green" ? o.team === "green" : false)) continue; const d = (o.x - a.x) ** 2 + (o.y - a.y) ** 2; if (d < nd) { nd = d; nb = o; } }
    if (nb) gs.push(nb);
    return gs;
}
function facilityReroute(a, px, py) {
    if (!_fp || !a || a.dead) return;
    if (a.team !== "green" && typeof Predator !== "undefined" && a instanceof Predator && (a.state === "wander" || a.state === "hunt")) return;   // (a wandering or hunting creature walks the route by itself, js/predator.js: its goal is its own, not the player or the Crystal)
    const dx = a.x - px, dy = a.y - py, d = Math.hypot(dx, dy);
    if (d < 1e-4 || d > 1.5) return;
    // The goal the step points at best. A step that points straight at a goal (within 28 degrees) with a wall in between is rerouted. A step that runs into a wall is a unit pushing at a goal it cannot walk
    // straight to, and the AI's weave, lean or turning circle can have swung it far off the line (a hunter weaves up to 40 degrees each way): the goal it points nearest to (within 70) is the one it means.
    let best = null, bc = 0, g0 = _fpGoals(a);
    for (const g of g0) { if (!g || !Number.isFinite(g.x)) continue; const gx = g.x - px, gy = g.y - py, gl = Math.hypot(gx, gy); if (gl < 0.6) continue; const c = (dx * gx + dy * gy) / (d * gl); if (c > bc) { bc = c; best = g; } }
    if (!best || bc < 0.34 || _fpLos(px, py, best.x, best.y)) return;
    if (bc < 0.88 && (a._fpStuck || 0) < 3 && facilityCanStep(px, py, a.x, a.y, _fp.F)) return;   // (a free step that does not point at a goal is a flee, a lunge or a weave: left as the AI made it)
    const sx = a.x, sy = a.y; a.x = px; a.y = py; const w = facilitySteer(a, best.x, best.y); a.x = sx; a.y = sy;
    const wx = w[0] - px, wy = w[1] - py, wl = Math.hypot(wx, wy); if (wl < 1e-6) return;
    a.x = px + wx / wl * d; a.y = py + wy / wl * d;
}
// The facility is big: a squad walking at its own pace would be a minute behind you. A follower or clone far from you (and not on an order of its own) hurries, up to about four times, and eases back to its own speed as it closes in.
function facilityCatchUp(a, px, py) {
    if (!_fp || !a || a.team !== "green" || a.dead || a.job || a.post || a.returningToCrystal) return;   // (a posted follower holds its room)
    const d = Math.hypot(player.x - a.x, player.y - a.y); if (d <= 8) return;
    const k = Math.min(4, 1 + (d - 8) / 6); a.x = px + (a.x - px) * k; a.y = py + (a.y - py) * k;
}
// A unit that keeps being put back (it is trying to go somewhere and the walls say no) for a second: replan; for two: move it onto the nearest open cell of its route.
function _fpUnstick(a, px, py, intended) {
    const moved = Math.hypot(a.x - px, a.y - py);
    if (intended > 0.004 && moved < intended * 0.25) {
        a._fpStuck = (a._fpStuck || 0) + 1;
        if (a._fpStuck === 40) { a._fpPath = null; a._fpAt = 0; a._fpGoalAt = null; }
        if (a._fpStuck >= 100) { const c = _fpNearestCell(a.x, a.y); if (c) { a.x = c[0]; a.y = c[1]; } a._fpStuck = 0; a._fpPath = null; }
    } else if (moved > intended * 0.6) a._fpStuck = 0;
}
// A mover that moved from (px,py) to (a.x,a.y): back it up, or slide it along the wall.
function facilityConstrain(a, px, py) {
    if (!_fp || !a) return a;
    if (facilityWalkable(a.x, a.y, _fp.F) && facilityCanStep(px, py, a.x, a.y, _fp.F)) return a;
    if (facilityWalkable(a.x, py, _fp.F) && facilityCanStep(px, py, a.x, py, _fp.F)) { a.y = py; return a; }
    if (facilityWalkable(px, a.y, _fp.F) && facilityCanStep(px, py, px, a.y, _fp.F)) { a.x = px; return a; }
    if (facilityWalkable(px, py, _fp.F)) { a.x = px; a.y = py; return a; }
    const c = _fpNearestCell(px, py); if (c) { a.x = c[0]; a.y = c[1]; }   // it was somewhere impossible (a spawn on a wall): onto the nearest floor
    return a;
}

// ── the player ──
function facilityWalkTo(gx, gy) {
    if (!_fp || (typeof facilityPortalBusy === "function" && facilityPortalBusy())) return false;   // (nobody is told where to walk while the screen fades through a doorway)
    const c = _fpNearestCell(gx, gy); if (!c || Math.hypot(c[0] - gx, c[1] - gy) > 1.6) return false;
    const p = facilityPath(player.x, player.y, c[0], c[1]); if (!p) return false;
    player.fpPath = p; player.targetX = c[0]; player.targetY = c[1]; return true;
}
function facilityPlayerStep() {
    const px = player.x, py = player.y;
    const p = player.fpPath;
    if (p && p.length) {
        const w = p[0], d = Math.hypot(w[0] - player.x, w[1] - player.y);
        const sp = FP_PLAYER_SPEED * (typeof classStat === "function" ? classStat("playerSpeed", 1) : 1);   // (the spider mech is faster: js/classes.js)
        if (d <= sp) { player.x = w[0]; player.y = w[1]; p.shift(); } else { player.x += (w[0] - player.x) / d * sp; player.y += (w[1] - player.y) / d * sp; }
    }
    facilityConstrain(player, px, py);
    if (!p || !p.length) { player.targetX = player.x; player.targetY = player.y; }
    player.visualX += (player.x - player.visualX) * 0.2; player.visualY += (player.y - player.visualY) * 0.2;
}

// ── start / stop ──
// the facility writes only its own keys (js/facilitysave.js): nothing else reaches storage
const FP_STORE_OK = /^conduit_fp_/;
let _fpStoreFiltered = false;
function _fpNoStorage() {
    if (_fpStoreFiltered) return;
    try { if (typeof Storage !== "undefined" && Storage.prototype) { _fpStoreFiltered = true; const set = Storage.prototype.setItem, rm = Storage.prototype.removeItem; const ok = k => FP_STORE_OK.test(String(k)) && !(typeof attractOn === "function" && attractOn()); Storage.prototype.setItem = function (k, v) { if (ok(k)) return set.call(this, k, v); }; Storage.prototype.removeItem = function (k) { if (ok(k)) return rm.call(this, k); }; } } catch (e) {}
}
// the state of a game, fresh: every list emptied, every pointer into the last world let go, the player and the Crystal as they begin (the facility itself is built after this)
function facilityResetState() {
    world = []; worldTileMap = new Map(); actors = []; followers = []; ELEMENTS.forEach(el => { followerByElement[el.id] = []; });
    projectiles = []; fragments = []; smoke = []; shards = []; elementEffects = []; floatingTexts = []; followerProjectiles = []; respawnQueue = [];
    if (typeof clearDNA === "function") clearDNA();
    if (typeof activeFireEruption !== "undefined") activeFireEruption = null; if (typeof activeEmpEffect !== "undefined") activeEmpEffect = null;
    if (typeof fireBombs !== "undefined") { fireBombs = []; fireTiles = new Map(); }
    frame = 0; shake = 0; shardCount = STARTING_SHARDS; unlockedElements = new Set(ELEMENTS.map(e => e.id)); lifetimeKills = 0;
    playerUltimate = 0; armySurgeTimer = 0; _lastUltInt = -1; _lastUltState = "";
    siphonEnabled = true; siphonWisps = []; _lastSiphonOn = null; _siphonInRange = 0;
    crystal = { x: 0, y: 2, health: 300, maxHealth: 300, radius: 0.8 };
    player = { x: 2, y: 1, visualX: 2, visualY: 1, targetX: 2, targetY: 1, rotY: Math.PI * 0.75, baseRot: Math.PI * 0.75, angryTimer: 0, selectedElement: "fire", siphonHold: 0, attackCooldown: 0, invuln: 0 };
    gameState = { running: true };
    alertActive = false; alertTimer = 0; alertType = null; alertSource = null;
    cloneMenuOpen = false; crystalMenuOpen = false; infoPanelOpen = false; infoPanelTarget = null; infoPanelPage = null; infoPanelSubject = null;
    commandMode = false; commandPendingTap = false; commandTarget = null; selectedRadialAction = null; commandEnemyTarget = null; commandFollowerTarget = null;
    playerAttackMode = false; if (typeof gunStow === "function") gunStow();
    isPressing = false; longHoldFired = false; touchMoved = false;
    health = PLAYER_HITS; playerAmmo = PLAYER_AMMO_START;
    if (typeof document !== "undefined") { const ov = document.getElementById("overlay"); if (ov && ov.classList) ov.classList.remove("active"); }
}
function facilityPlayStart() {
    if (facilityPlay) return true;
    _fpNoStorage();                                  // only the facility's own save is written
    facilityPlay = true;
    if (typeof facilityDebugSet === "function") facilityDebugSet(false);
    const F = facilityBuild({ snap: true, margin: FP_BODY });
    const P = facilityBuild({ snap: true, margin: FP_PLAN });   // the planning copy: the same map, a wider margin
    _fp = { F, P, cells: null, cellsP: null, edges: new Map(), paths: new Map(), gfxSaved: typeof facilityGfxSaved === "function" ? facilityGfxSaved() : null };
    if (_fp.gfxSaved === "low") gfxLow = true; else if (_fp.gfxSaved === "high") gfxLow = false;   // (a slow device was found slow before, or the player chose: js/propsprites.js)
    facilityResetState();                            // a fresh game's state
    unlockedElements = new Set(ELEMENTS.map(e => e.id));   // ASKED: "make the crystal have access to all the colors from the beginning": all six are online from the first frame
    squadMode = "all";   // the battle tool's orders (RETREAT, HOLD, COME, and the enemy card's ATTACK) go to EVERYONE until the player narrows them (WHO, or selected roster cards); there is no element to "start" with here, and the old default was whichever element came first
    _fp.cells = _fpBuildWorld(F);
    _fp.cellsP = new Map(); for (const [k, c] of _fp.cells) if (facilityWalkable(c[0], c[1], P)) _fp.cellsP.set(k, c);
    // the crystal in its chamber, the player beside it, a small squad
    const ob = F.byId.get("crystal_chamber").objects.find(o => o.id === "crystal");
    const cx = Math.round(ob.at[0]), cy = Math.round(ob.at[1]);
    crystal.x = cx; crystal.y = cy;
    player.x = player.targetX = player.visualX = cx + 2; player.y = player.targetY = player.visualY = cy + 1; player.fpPath = null;
    const away = typeof attractOn === "function" && attractOn();   // the website's background (js/attract.js): no saved game, no squad, no tutorial, no creatures
    const saved = typeof facilitySaveLoad === "function" ? facilitySaveLoad() : null;   // a game left earlier (js/facilitysave.js): its followers come back, else the three to start
    if (saved && saved.followers && saved.followers.length && typeof spawnFollowerFromSave === "function") saved.followers.forEach(e => spawnFollowerFromSave(e));
    else if (!away) for (const el of ["electric", "core", "fire"]) { if (typeof spawnFollowerAtCrystal === "function") spawnFollowerAtCrystal(el); }
    for (const f of followers) { f.x = cx + 1 + Math.random(); f.y = cy + 2 + Math.random(); f.returningToCrystal = false; }
    _fpPlaceStatics(F);
    if (typeof facilityPortalsStart === "function") facilityPortalsStart(F);   // the doorways into the interiors (js/facilityportals.js)
    if (typeof facilityTutorialStart === "function") facilityTutorialStart(F);   // the tutorial opens in a blackout (js/facilitytutorial.js)
    if (!away && typeof facilityFollowerSpotsStart === "function") facilityFollowerSpotsStart(F);   // the eggs that wait where they are (js/followerspots.js)
    if (away) facilityBlackoutSet(false);
    else if (typeof facilityTutorialClass === "function") facilityTutorialClass();   // an empty pack, and the class picker (js/classes.js, js/inventory.js)
    if (saved && typeof facilitySaveApply === "function") { try { facilitySaveApply(saved); } catch (e) { console.error("the saved game could not be put back", e); } }   // (the pack, class, cases, relays, tutorial and place it was left in)
    if (away) attractStart(F);                       // the background: the camera, and the searchers that come now and again (js/attract.js)
    else facilitySpawnInitial();                     // the arena's creatures (js/facilityspawn.js)
    document.body.classList && document.body.classList.add("facility-play");
    if (typeof facilityPropsPreload === "function") facilityPropsPreload();   // the 3D prop sheets start loading now (js/propsprites.js)
    _fp.saveReady = !away;                           // from here the game is saved as it goes (the background keeps nothing)
    return true;
}
// is this a spot a unit can stand on (js/facilitysave.js puts the player back where they were left)
function facilityStandOk(x, y) { return !!(_fp && _fp.F) && facilityWalkable(Math.round(x), Math.round(y), _fp.F); }
// a walkable tile of the player's own room, between r0 and r1 tiles from (x, y) (a spot to put something where the player can see it); null if there is none
function facilitySpotNear(x, y, r0, r1) {
    const here = facilityRoomAt(x, y, _fp.F); let best = null, bd = 1e9;
    for (const [k, c] of _fp.cellsP) { const d = Math.hypot(c[0] - x, c[1] - y); if (d < r0 || d > r1) continue; const rm = facilityRoomAt(c[0], c[1], _fp.F); if (here && (!rm || rm.id !== here.id)) continue; const sc = Math.abs(d - (r0 + r1) / 2) + Math.max(0, (x + y) - (c[0] + c[1])) * 0.6; if (sc < bd) { bd = sc; best = [c[0], c[1]]; } }
    return best;
}
// a walkable tile in a named room, `r0`..`r1` from (x, y) (the middle of that band by preference; the room's tile nearest it when none is in the band); null if the room has no floor
function facilitySpotIn(roomId, x, y, r0, r1) {
    let best = null, bs = 1e9, near = null, nd = 1e9;
    for (const [k, c] of _fp.cellsP) {
        const rm = facilityRoomAt(c[0], c[1], _fp.F); if (!rm || rm.id !== roomId) continue;
        const d = Math.hypot(c[0] - x, c[1] - y); if (d < nd) { nd = d; near = [c[0], c[1]]; }
        if (d < r0 || d > r1) continue; const sc = Math.abs(d - (r0 + r1) / 2); if (sc < bs) { bs = sc; best = [c[0], c[1]]; }
    }
    return best || near;
}
// a walkable tile within `range` of a box (a prop a unit wants to use), the one nearest the player; null if there is none
function facilityApproachTile(b, range) {
    let best = null, bd = 1e9;
    for (let x = Math.floor(b[0]) - 1; x <= Math.ceil(b[2]) + 1; x++) for (let y = Math.floor(b[1]) - 1; y <= Math.ceil(b[3]) + 1; y++) {
        if (!facilityWalkable(x, y, _fp.F)) continue; const dx = Math.max(b[0] - x, 0, x - b[2]), dy = Math.max(b[1] - y, 0, y - b[3]); if (Math.hypot(dx, dy) > range) continue;
        const d = Math.hypot(x - player.visualX, y - player.visualY); if (d < bd) { bd = d; best = [x, y]; }
    }
    return best;
}
// ── the static things to draw: wall pieces, prop cells, doors, fixtures ──
// the room whose light a wall piece takes: the room on its camera-facing side (the face you see), else its own room
// a door's header slab runs over the tunnel: towards the side that is walkable
function _fpDoorOut(o, F) {
    const dx = o.b[0] - o.a[0], dy = o.b[1] - o.a[1], L = Math.hypot(dx, dy) || 1; let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
    const mx = (o.a[0] + o.b[0]) / 2, my = (o.a[1] + o.b[1]) / 2; return facilityWalkable(mx + nx * 0.6, my + ny * 0.6, F) && !facilityWalkable(mx - nx * 0.6, my - ny * 0.6, F) ? 1 : -1;
}
// a door in a THIN wall: both ends of its opening are on glass (the show room's west window), where the rooms touch with no band of wall between them: there is no tunnel for a thick top to run over, and the glass beside it has a rail and nothing more
function _fpDoorThin(o, F) {
    const glass = p => F.walls.some(w => w.window && _facSegPointDist(w.a, w.b, p[0], p[1]) < 0.05);
    return glass(o.a) && glass(o.b);
}
// which way a wall's thickness runs from this piece: +1 towards the camera (the room is behind the face the camera sees: a south or east wall), -1 away from it (a north or west wall)
function _fpWallOut(w, a, b, F) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
    const r = facilityRoomAt((a[0] + b[0]) / 2 - nx * 0.4, (a[1] + b[1]) / 2 - ny * 0.4, F); return r && r.id === w.room ? 1 : -1;
}
// a south or east wall piece whose band has another room's wall on the far side: its face is never seen (the neighbour's face stands in front of it), so only its slab is drawn
function _fpWallBand(w, a, b, F) {
    if (_fpWallOut(w, a, b, F) !== 1) return false;
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
    const mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2, r = facilityRoomAt(mx + nx * 1.5, my + ny * 1.5, F), q = facilityRoomAt(mx + nx * 0.5, my + ny * 0.5, F); return !!r && r.id !== w.room && !q;
}
// whether a wall's slab has an ink line along its far edge: only where that edge is the boundary of the whole top (a room beyond it, or open air beyond the band), never across another slab
function _fpWallInk(w, a, b, F) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
    const o = _fpWallOut(w, a, b, F), mx = (a[0] + b[0]) / 2 + nx * o * FP_WALL_T, my = (a[1] + b[1]) / 2 + ny * o * FP_WALL_T;
    return !!facilityRoomAt(mx + nx * o * 0.5, my + ny * o * 0.5, F) || !facilityRoomAt(mx + nx * o * 1.5, my + ny * o * 1.5, F);
}
function _fpWallLightRoom(w, a, b, F) {
    const dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
    for (const t of [0.4, 0.9, 1.5, 2.2, 3.0]) { const r = facilityRoomAt((a[0] + b[0]) / 2 + nx * t, (a[1] + b[1]) / 2 + ny * t, F); if (r) return r.id; }   // (the room that shows its face; the pocket of void behind the arena's rock belongs to the arena)
    return w.room;
}
function _fpPlaceStatics(F) {
    const items = [], seg = 0.5;
    for (const w of F.walls) {
        const dx = w.b[0] - w.a[0], dy = w.b[1] - w.a[1], len = Math.hypot(dx, dy), n = Math.max(1, Math.ceil(len / seg));
        for (let i = 0; i < n; i++) {
            const a = [w.a[0] + dx * i / n, w.a[1] + dy * i / n], b = [w.a[0] + dx * (i + 1) / n, w.a[1] + dy * (i + 1) / n];
            items.push({ type: "fp", fp: "wall", x: (a[0] + b[0]) / 2, y: (a[1] + b[1] + 0) / 2, a, b, kind: w.window ? "glass" : w.kind, win: w.window || null, room: w.room, lroom: _fpWallLightRoom(w, a, b, F), out: _fpWallOut(w, a, b, F), nbBand: _fpWallBand(w, a, b, F), inkBack: _fpWallInk(w, a, b, F), i, n, along: Math.round((Math.hypot(a[0], a[1])) * 2), base: facilityRoomHeight(w.room, F) * FP_ELEV_PX });
        }
    }
    // a wall between two floors of different heights stands from its own floor up past the HIGHER floor, so a step down is a retaining wall and not a gap
    const at = new Map(); for (const it of items) { if (it.fp !== "wall") continue; const k = Math.round(it.x * 4) + "," + Math.round(it.y * 4); if (!at.has(k)) at.set(k, []); at.get(k).push(it); }
    for (const list of at.values()) for (const it of list) { let top = it.base; for (const o of list) if (o !== it && o.room !== it.room && o.base > top) top = o.base; it.base2 = top; }
    for (const o of F.openings) { if (F.connections.some(c => c.opening === o.id && c.ramp)) continue;   // a stairway has no door: the steps run through the gap (the arena door, the deck door, the stair mouth)
        const mx = (o.a[0] + o.b[0]) / 2, my = (o.a[1] + o.b[1]) / 2, st = { open: 0 }, base = facilityLiftPx(mx, my), lroom = _fpWallLightRoom({ room: (o.rooms || [])[0] }, o.a, o.b, F), thin = _fpDoorThin(o, F);   // (lroom: the room whose face the wall round the door shows, which the door's header takes its light from; thin: a door in glass)
        for (const [part, d] of [["a", o.a[0] + o.a[1]], ["b", o.b[0] + o.b[1]], ["m", Math.max(o.a[0] + o.a[1], o.b[0] + o.b[1]) + 0.88]]) items.push({ type: "fp", fp: "door", part, st, out: _fpDoorOut(o, F), lroom, thin, id: o.id, depth: d + 0.02, x: mx, y: my, a: o.a, b: o.b, door: o.door, rooms: o.rooms, base }); }
    for (const s of F.solids) {
        const box = s.bb, cells = new Set();
        for (let x = Math.floor(box[0]); x <= Math.ceil(box[2]); x++) for (let y = Math.floor(box[1]); y <= Math.ceil(box[3]); y++) {
            if (s.shape === "circle" ? Math.hypot(x - s.at[0], y - s.at[1]) < s.r : facilityPointInPoly(x, y, s.poly)) cells.add(x + "," + y);
        }
        if (s.shape === "circle" && !cells.size) cells.add(Math.round(s.at[0]) + "," + Math.round(s.at[1]));   // a small chamber is at least one cell
        for (const k of cells) {
            const [x, y] = k.split(",").map(Number);
            // sides are drawn only where no neighbour hides them: the faces toward +y (lower left) and +x (lower right)
            items.push({ type: "fp", fp: "prop", room: s.room, base: facilityLiftPx(x, y), x, y, kind: s.kind || (s.shape === "circle" ? "tank" : "bench"), cargo: s.cargo, id: s.id, sy: !cells.has(x + "," + (y + 1)), sx: !cells.has((x + 1) + "," + y), top: !cells.has(x + "," + (y - 1)), lf: !cells.has((x - 1) + "," + y), seed: _fpHash(x, y) });
        }
    }
    if (typeof _psRimItems === "function") { for (const it of _psRimItems(F, items)) items.push(it); for (const it of _psBridgeItems(F)) items.push(it); }   // the 3D tanks' rim cells and the catwalk bridges (js/propsprites.js)
    for (const r of F.ramps) {   // a staircase: one prism per tread tile, from the lower floor up to the tread (the risers the camera sees)
        const z = r.zone; if (!z || !z.steps) continue; const lo = Math.min(z.hA, z.hB);
        for (let x = Math.ceil(z.x0 - 0.5); x <= z.x1 - 0.5; x++) for (let y = Math.ceil(z.y0 - 0.5); y <= z.y1 - 0.5; y++) {
            const h = facilityHeightAt(x, y, F); if (h - lo < 0.02) continue;
            items.push({ type: "fp", fp: "stair", room: (facilityRoomAt(x, y, F) || {}).id, x, y, base: lo * FP_ELEV_PX, h: (h - lo) * FP_ELEV_PX, sx: true, sy: true });
        }
    }
    for (const f of F.fixtures) items.push({ type: "fp", fp: "fixture", room: f.room, base: facilityRoomHeight(f.room, F) * FP_ELEV_PX, x: (f.a[0] + f.b[0]) / 2, y: (f.a[1] + f.b[1]) / 2, a: f.a, b: f.b, kind: f.type });
    for (const it of _fpWallPlace(F)) items.push(it);   // wall decor (js/facilitydecor.js)
    for (const it of _fpStylePillars(F)) items.push(it);   // the corner posts of a styled room (js/facilitystyle.js)
    for (const it of _fpStyleRigs(F)) items.push(it);      // the crystal's pad machine (js/facilitystyle.js)
    _fp.floorOps = _fpFloorBuild(F);                     // the floors' coverings and decals, cut into tiles
    for (const it of _fpFillItems()) items.push(it);     // floor that runs in under the walls (no black where a wall meets the floor)
    _fpSkirts(items);                                    // a wall above a lower floor reaches down to it
    _fp.items = items; _fpRockSides(items); _fpScaffoldMarks(items);   // which rock walls are formations the arena is in front of, and which are behind; which walls are scaffolding
    _fp.items = items;
}
// a TALL item (the Crystal's crown and its struts, 640 px up) is on screen while its foot is anywhere from just above the top of the screen to `tall` px below the bottom (visibleForDraw only allows 210)
function _fpTallVisible(it) {
    const dx = it.x - player.visualX, dy = it.y - player.visualY, px = (dx - dy) * TILE_W + canvas.width / 2; if (px < -DRAW_CULL_SIDE || px > canvas.width + DRAW_CULL_SIDE) return false;
    const py = (dx + dy) * TILE_H + canvas.height / 2; return py >= -DRAW_CULL_TOP && py <= canvas.height + it.tall;
}
function facilityDrawItems(drawList) {
    if (!_fp || !_fp.items) return;
    _fpCam = facilityLiftPx(player.visualX, player.visualY);   // the camera rides the player's floor (input and targeting read it: it is kept in a step with no picture)
    if (typeof facilityDoorsTick === "function") facilityDoorsTick();   // the doors ease towards open or shut, once a STEP (js/facilitystyle.js)
    if (typeof _fpLightUpdate === "function") _fpLightUpdate(_fp.F);   // the rooms' light levels and the pools at open doors
    if (typeof facilityTutorialTick === "function") facilityTutorialTick();
    if (typeof _simGhost !== "undefined" && _simGhost) return;   // a step with no picture draws nothing: no item is added to the draw list (see render(), js/game.js)
    for (const it of _fp.items) if ((visibleForDraw(it.x, it.y) || (it.tall && _fpTallVisible(it))) && (it.fp !== "wall" || _fpWallOnScreen(it))) drawList.push(it);
    if (_fp.crystalDepth !== undefined) for (const o of drawList) if (o.type === "crystal") o.depth = _fp.crystalDepth;   // the crystal is drawn after the pad machine it rests in
}

// ── height: the floors rise and fall (drawing only: movement is flat) ──
// The arena is sunk a little below the hallway, the observation deck and the catwalks stand above it, and a short flight of steps joins each at its door. Every drawn thing is lifted by the
// height of the floor under it relative to the camera, which follows the player's floor, so the player stays at the centre of the screen as the ground goes up and down.
let _fpCam = 0, _fpBase = 0;
function facilityLiftPx(x, y) { return _fp ? facilityHeightAt(x, y, _fp.F) * FP_ELEV_PX : 0; }
function facilityLiftRel(x, y) { return facilityLiftPx(x, y) - _fpCam; }
// What to add to a screen y so a tap lands on the tile DRAWN there (the tile's own lift moves it up the screen): found by trying the tile under the tap and correcting.
function facilityPickLift(ex, ey) {
    let lift = 0; for (let i = 0; i < 4; i++) { const dx = ex - canvas.width / 2, dy = ey + lift - canvas.height / 2 - TILE_H, gx = Math.round((dy / TILE_H + dx / TILE_W) / 2 + player.visualX), gy = Math.round((dy / TILE_H - dx / TILE_W) / 2 + player.visualY); lift = facilityLiftRel(gx, gy); }
    return lift;
}

// ── drawing ──
// A point at height z above the current item's floor (_fpBase, in px of height), on screen.
function _fpP(x, y, z) { return [(x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - (z || 0) - (_fpBase - _fpCam)]; }
function _fpQuad(pts, fill, stroke, lw) {
    ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.lineWidth = lw || 1; ctx.strokeStyle = stroke; ctx.stroke(); }
}
const FP_WALL = { wall: ["#26324f", "#1a2340", "#8fa6d8"], outer_wall: ["#26324f", "#1a2340", "#8fa6d8"], outer_wall_provisional: ["#26324f", "#1a2340", "#8fa6d8"], rock: ["#4a3a30", "#2e241e", "#9a7a62"], railing_wall: ["#3a4258", "#262d40", "#ffd34d"], deck_wall: ["#3a3f52", "#262a3a", "#8fa6d8"] };
function drawFacilityItem(it) {
    _fpBase = it.base || 0;
    const lv = (typeof _fpItemLight === "function" && _fp.light) ? _fpItemLight(it) : 1, real = ctx;
    if (lv < 0.12 && (it.fp === "wdecor" || it.fp === "fixture")) return;   // (posters and signs in a dark room are all but invisible: not drawn)
    if (lv < 0.98 && typeof CanvasRenderingContext2D !== "undefined" && real instanceof CanvasRenderingContext2D) ctx = _fpDimCtx(real, 1 - _fpDarkAmt() * (1 - lv));   // (not on the null context of a simulation-only step): an unlit room's things are drawn through the dimmed pen (js/facilitystyle.js)
    ctx.save();
    try {
        if (it.fp === "wall") _fpDrawWall(it); else if (it.fp === "door") _fpDrawDoor(it); else if (it.fp === "prop") _fpDrawProp(it); else if (it.fp === "fixture") _fpDrawFixture(it); else if (it.fp === "wdecor") _fpDrawWDecor(it); else if (it.fp === "fill") _fpDrawFill(it); else if (it.fp === "pickup") _fpDrawPickup(it); else if (it.fp === "station") _fpDrawStation(it); else if (it.fp === "spot") _fpDrawSpot(it); else if (it.fp === "pillar") _fpStylePillar(it); else if (it.fp === "rig") _fpStyleRig(it); else if (it.fp === "rigpad") _fpStyleRigPad(it); else if (it.fp === "stair") _fpStyleStair(it);
    } finally { ctx.restore(); ctx = real; }
}
// A wall whose camera-facing side looks onto a LOWER floor (the pocket of floor behind the arena's rock, a fill cell) reaches down to it, so no gap shows under it.
function _fpSkirts(items) {
    for (const it of items) {
        if (it.fp !== "wall" || it.kind === "glass") continue;
        const dx = it.b[0] - it.a[0], dy = it.b[1] - it.a[1], L = Math.hypot(dx, dy) || 1; let nx = dy / L, ny = -dx / L; if (nx + ny < -1e-9 || (Math.abs(nx + ny) < 1e-9 && nx < 0)) { nx = -nx; ny = -ny; }
        const f = _fp.fills.get(Math.round(it.x + nx * 0.7) + "," + Math.round(it.y + ny * 0.7)); if (f && f.base < (it.base || 0) - 1) it.drop = (it.base || 0) - f.base;
        // a wall standing at a flight of steps (the tunnel's sides) reaches down to the sloping floor beside it, so it never hangs in the air above the steps
        const lo = Math.min(facilityHeightAt(it.a[0], it.a[1], _fp.F), facilityHeightAt(it.b[0], it.b[1], _fp.F), facilityHeightAt(it.x, it.y, _fp.F)) * FP_ELEV_PX; if ((it.base || 0) - lo > 2) it.drop = Math.max(it.drop || 0, (it.base || 0) - lo);
    }
}
function _fpDrawWall(it) {
    const glass = it.kind === "glass", c = FP_WALL[it.kind] || FP_WALL.wall, H = FP_WALL_H + Math.max(0, (it.base2 || it.base || 0) - (it.base || 0));
    // a wall is always drawn at its full height, whatever the player is doing: it never fades, shrinks or reacts when the player comes close
    if (it.kind === "rock") return _fpDrawRock(it, H);   // rock formations (js/facilitydecor.js)
    if (it.scaffold) return _fpDrawRail(it);                   // the catwalks: an open deck with a rail, not a room (js/facilitydecor.js)
    if (it.support) return _fpDrawSupport(it, H - FP_WALL_H);  // the arena's frame under the deck: open steel, you see through it
    const Hd = H;   // walls never react to the player
    if (!glass && facilityStyleRoom(it.room)) return _fpStyleWall(it, Hd);   // (the crystal laboratory style)
    if (/^deck_window_arena/.test(it.win || "") && it.room === "arena") return _fpDrawDeckCliff(it);   // the deck stands on a thick rock cliff (js/facilitydecor.js)
    if (glass && facilityStyleRoom(it.room)) return _fpStyleGlass(it, H);
    const a0 = _fpP(it.a[0], it.a[1], 0), b0 = _fpP(it.b[0], it.b[1], 0), a1 = _fpP(it.a[0], it.a[1], Hd), b1 = _fpP(it.b[0], it.b[1], Hd);
    if (glass) {
        // a window: a solid sill below, glass above with a faint reflection, a top rail, and a mullion post every two tiles
        const lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t], sa = _fpP(it.a[0], it.a[1], 14), sb = _fpP(it.b[0], it.b[1], 14), ta = _fpP(it.a[0], it.a[1], H - 7), tb = _fpP(it.b[0], it.b[1], H - 7);
        _fpQuad([a0, b0, sb, sa], "#2c3a52", "rgba(5,7,15,0.6)", 1);                                           // the sill
        _fpQuad([sa, sb, tb, ta], "rgba(120,220,255,0.20)", null);                                              // the glass
        ctx.fillStyle = "rgba(255,255,255,0.10)"; const q1 = lerp(sa, sb, 0.25), q2 = lerp(sa, sb, 0.5), r1 = lerp(ta, tb, 0.25), r2 = lerp(ta, tb, 0.5); ctx.beginPath(); ctx.moveTo(q1[0], q1[1]); ctx.lineTo(q2[0], q2[1]); ctx.lineTo(r2[0], r2[1]); ctx.lineTo(r1[0], r1[1]); ctx.closePath(); ctx.fill();   // a reflection streak
        ctx.strokeStyle = "rgba(143,227,255,0.8)"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sa[0], sa[1]); ctx.lineTo(sb[0], sb[1]); ctx.moveTo(ta[0], ta[1]); ctx.lineTo(tb[0], tb[1]); ctx.stroke();
        _fpQuad([ta, tb, b1, a1], "#2c3a52", "rgba(5,7,15,0.6)", 1);                                           // the top rail
        if (it.i === 0 && Math.round(it.along) % 2 === 0 || it.i % 4 === 0) { ctx.strokeStyle = "#c9d6f0"; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(a0[0], a0[1]); ctx.lineTo(a1[0], a1[1]); ctx.stroke(); }   // a mullion post
        return;
    }
    const g = ctx.createLinearGradient(0, a1[1], 0, a0[1]); g.addColorStop(0, c[0]); g.addColorStop(1, c[1]);
    if (it.drop > 0) _fpQuad([_fpP(it.a[0], it.a[1], -it.drop), _fpP(it.b[0], it.b[1], -it.drop), b0, a0], c[1], "rgba(5,7,15,0.6)", 1);   // the skirt: down to the lower floor beside it
    _fpQuad([a0, b0, b1, a1], g, "rgba(5,7,15,0.6)", 1);
    ctx.strokeStyle = c[2]; ctx.globalAlpha = 0.85; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke();
}
function _fpDrawDoor(it) {
    if (it.rooms && it.rooms.some(facilityStyleRoom)) return _fpStyleDoor(it);   // (the crystal laboratory style: js/facilitystyle.js)
    // two posts and a lintel round the gap, with a sliding panel drawn open (it never blocks: a sliding door is always open for the squad)
    const H = FP_WALL_H, a0 = _fpP(it.a[0], it.a[1], 0), b0 = _fpP(it.b[0], it.b[1], 0), a1 = _fpP(it.a[0], it.a[1], H), b1 = _fpP(it.b[0], it.b[1], H);
    const near = Math.hypot(it.x - player.visualX, it.y - player.visualY) < 3.4, glow = it.door ? "#19e6c1" : "#ffe733";
    for (const [p0, p1] of [[a0, a1], [b0, b1]]) { ctx.strokeStyle = "#c9d6f0"; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(p0[0], p0[1]); ctx.lineTo(p1[0], p1[1]); ctx.stroke(); }
    ctx.strokeStyle = glow; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(a1[0], a1[1]); ctx.lineTo(b1[0], b1[1]); ctx.stroke();
    if (it.door) {   // the panel, slid back to one side
        const k = near ? 0.18 : 0.5, pa = [a1[0] + (b1[0] - a1[0]) * (1 - k), a1[1] + (b1[1] - a1[1]) * (1 - k)], pb = b1, pa0 = [a0[0] + (b0[0] - a0[0]) * (1 - k), a0[1] + (b0[1] - a0[1]) * (1 - k)];
        _fpQuad([pa, pb, b0, pa0], "rgba(25,230,193,0.18)", glow, 1.5);
    }
}
function _fpHash(x, y) { return ((Math.imul(x | 0, 73856093) ^ Math.imul(y | 0, 19349663)) >>> 0); }
// One tile-sized prism: a top and the two sides the camera can see (only where no neighbouring cell of the same prop hides them).
function _fpPrism(it, h, top, sideY, sideX, rim) {
    const x = it.x, y = it.y, c = [_fpP(x - 0.5, y - 0.5, h), _fpP(x + 0.5, y - 0.5, h), _fpP(x + 0.5, y + 0.5, h), _fpP(x - 0.5, y + 0.5, h)], b = [_fpP(x - 0.5, y - 0.5, 0), _fpP(x + 0.5, y - 0.5, 0), _fpP(x + 0.5, y + 0.5, 0), _fpP(x - 0.5, y + 0.5, 0)];
    if (it.sy) _fpQuad([c[3], c[2], b[2], b[3]], sideY, "rgba(5,7,15,0.55)", 1);
    if (it.sx) _fpQuad([c[2], c[1], b[1], b[2]], sideX, "rgba(5,7,15,0.55)", 1);
    _fpQuad(c, top, rim || "rgba(255,255,255,0.22)", 1);
    return { c, b };
}
// A flat rectangle standing on the +y face of a prism (the side that faces the lower left): u 0..1 across, z0..z1 up. Used for screens, glass fronts, LED strips.
function _fpFaceY(it, u0, u1, z0, z1, fill, stroke) { const y = it.y + 0.5, x0 = it.x - 0.5 + u0, x1 = it.x - 0.5 + u1; _fpQuad([_fpP(x0, y, z0), _fpP(x1, y, z0), _fpP(x1, y, z1), _fpP(x0, y, z1)], fill, stroke, 1); }
function _fpFaceX(it, u0, u1, z0, z1, fill, stroke) { const x = it.x + 0.5, y0 = it.y - 0.5 + u0, y1 = it.y - 0.5 + u1; _fpQuad([_fpP(x, y0, z0), _fpP(x, y1, z0), _fpP(x, y1, z1), _fpP(x, y0, z1)], fill, stroke, 1); }
const FP_AMBER = "#ffb347";
function _fpDrawProp(it) {
    const kind = it.kind, seed = it.seed || 0, f = typeof frame !== "undefined" ? frame : 0;
    if (typeof facilitySpriteDraw === "function") { if (facilitySpriteDraw(it)) return; if (it.spriteOnly || kind === "bridge") return; }   // every prop in 3D (js/propsprites.js); a rim cell or a bridge piece is nothing without its sprite
    if (_fpDecorProp(it)) return;   // the dressing's furniture (js/facilitydecor.js)
    if (kind === "computer_desk") {
        _fpPrism(it, 30, "#8f7f5e", "#5a4a32", "#46391f");
        if (it.sy) {   // a keyboard on every cell, and a monitor on every third: a dark screen with an amber glow, facing the aisle
            const k = _fpP(it.x, it.y + 0.2, 31); ctx.fillStyle = "#cdbf9a"; ctx.fillRect(k[0] - 9, k[1] - 2, 18, 4);
            if (seed % 3 === 0) {
                _fpFaceY(it, 0.1, 0.9, 34, 62, "#0b1016", "#c9bfa0"); _fpFaceY(it, 0.18, 0.82, 38, 58, "rgba(255,179,71," + (0.55 + 0.2 * Math.sin(f * 0.04 + seed)) + ")", null);
                const t = _fpP(it.x, it.y + 0.5, 33); ctx.fillStyle = "#2b2f38"; ctx.fillRect(t[0] - 6, t[1] - 3, 12, 3);
            }
        }
    } else if (kind === "server_rack") {
        _fpPrism(it, 66, "#4a505e", "#1f232d", "#171a23");
        const blink = (n) => (Math.floor(f / 18 + seed + n * 5) % 5 === 0);
        if (it.sy) for (let k = 0; k < 4; k++) _fpFaceY(it, 0.12, 0.88, 8 + k * 13, 15 + k * 13, "rgba(255,255,255,0.05)", "rgba(200,210,230,0.25)"), _fpFaceY(it, 0.7, 0.8, 10 + k * 13, 13 + k * 13, blink(k) ? "#ff5a3a" : FP_AMBER, null);
        if (it.sx) for (let k = 0; k < 4; k++) _fpFaceX(it, 0.15, 0.85, 8 + k * 13, 15 + k * 13, "rgba(255,255,255,0.04)", "rgba(200,210,230,0.2)");
    } else if (kind === "lab_bench") {
        _fpPrism(it, 34, "#a9b8c6", "#5f7184", "#4a5a6c", "rgba(255,255,255,0.4)");
        const m = seed % 7, top = _fpP(it.x, it.y, 35);
        if (m === 0) { ctx.fillStyle = "rgba(120,230,255,0.75)"; ctx.fillRect(top[0] - 4, top[1] - 12, 8, 12); ctx.fillStyle = "rgba(160,255,200,0.8)"; ctx.fillRect(top[0] - 4, top[1] - 6, 8, 6); }                   // a beaker
        else if (m === 2) { ctx.fillStyle = "#ffb347"; ctx.beginPath(); ctx.ellipse(top[0], top[1] - 6, 7, 6, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,0.4)"; ctx.fillRect(top[0] - 2, top[1] - 16, 4, 8); }   // a flask
        else if (m === 4) { ctx.fillStyle = "#23303c"; ctx.fillRect(top[0] - 6, top[1] - 16, 12, 12); ctx.fillStyle = "#8fe3ff"; ctx.fillRect(top[0] - 2, top[1] - 20, 4, 6); }   // a microscope
        else if (m === 5) { ctx.fillStyle = "#3b4d5e"; ctx.fillRect(top[0] - 9, top[1] - 8, 18, 6); for (let k = 0; k < 4; k++) { ctx.fillStyle = ["#ff6a4a", "#6dff5a", "#8fe3ff", "#ffe733"][k]; ctx.fillRect(top[0] - 8 + k * 4.5, top[1] - 14, 3, 6); } }   // a sample rack
    } else if (kind === "fume_hood") {
        _fpPrism(it, 72, "#7a8c9a", "#4a5864", "#3a4650");
        if (it.sy) { _fpFaceY(it, 0.1, 0.9, 12, 56, "rgba(130,225,255,0.28)", "rgba(220,245,255,0.7)"); _fpFaceY(it, 0.1, 0.9, 56, 66, "#2a3640", null); }
    } else if (kind === "test_chamber") {
        const hue = [["#6dff5a", "rgba(109,255,90,0.55)"], ["#ffb347", "rgba(255,179,71,0.55)"], ["#a64dff", "rgba(166,77,255,0.55)"]][(it.id === "chamber_2" ? 1 : 0)];
        _fpPrism(it, 6, "#2a3440", "#202a34", "#1a222b");                         // the base
        // the glass cylinder, drawn as a tall prism: liquid below, empty glass above, a bright cap
        const lq = (h0, h1, col) => { const x = it.x, y = it.y, a = _fpP(x - 0.38, y + 0.38, h0), b = _fpP(x + 0.38, y + 0.38, h0), c2 = _fpP(x + 0.38, y + 0.38, h1), d = _fpP(x - 0.38, y + 0.38, h1), e = _fpP(x + 0.38, y - 0.38, h0), g = _fpP(x + 0.38, y - 0.38, h1); _fpQuad([a, b, c2, d], col, "rgba(220,245,255,0.6)", 1); _fpQuad([b, e, g, c2], col, "rgba(220,245,255,0.4)", 1); };
        lq(6, 52, hue[1]); lq(52, 78, "rgba(140,225,255,0.22)");
        const t = _fpP(it.x, it.y, 78); ctx.fillStyle = "rgba(220,245,255,0.55)"; ctx.beginPath(); ctx.ellipse(t[0], t[1], 12, 6, 0, 0, 6.2832); ctx.fill();
        for (let k = 0; k < 2; k++) { const bt = _fpP(it.x + (k ? 0.12 : -0.1), it.y + 0.05, 14 + ((f * 0.6 + seed * 7 + k * 25) % 34)); ctx.fillStyle = "rgba(255,255,255,0.65)"; ctx.beginPath(); ctx.arc(bt[0], bt[1], 1.8, 0, 6.2832); ctx.fill(); }   // bubbles
    } else if (kind === "reception_desk") {
        _fpPrism(it, 36, "#8a6a3a", "#5a4224", "#463318");
    } else if (kind === "semi_truck") {
        _fpPrism(it, 52, "#7a8aa8", "#4a566e", "#3a455c");
        if (it.cargo && Math.round(it.x * 3 + it.y * 5) % 4 === 0) { const q = _fpP(it.x, it.y, 58); ctx.fillStyle = "#d8dce8"; ctx.beginPath(); ctx.ellipse(q[0], q[1], 14, 6, 0, 0, 6.2832); ctx.fill(); ctx.fillStyle = "#ff4a1c"; ctx.beginPath(); ctx.ellipse(q[0] + 8, q[1] - 1, 6, 4, 0, 0, 6.2832); ctx.fill(); }
    } else {   // liquid reserves, the lab's big tank, anything else
        const tank = kind === "liquid_reserve" || kind === "tank", liq = kind === "liquid_reserve";
        const h = tank ? 78 : 40, top = liq ? "#7a4acf" : tank ? "#3acfa0" : "#6a7a9a", sy = liq ? "#4a2a8a" : tank ? "#1f8a6a" : "#3e4a64";
        const pr = _fpPrism(it, h, top, sy, sy); ctx.fillStyle = "rgba(0,0,0,0.2)"; if (it.sx) { _fpQuad([pr.c[2], pr.c[1], pr.b[1], pr.b[2]], "rgba(0,0,0,0.22)", null); }
        if (tank) { const c = _fpP(it.x, it.y, h); ctx.fillStyle = "rgba(255,255,255," + (0.12 + 0.06 * Math.sin(f * 0.05 + it.x)) + ")"; ctx.beginPath(); ctx.ellipse(c[0], c[1], 18, 8, 0, 0, 6.2832); ctx.fill(); }
    }
}
function _fpDrawFixture(it) {
    if (facilityStyleRoom(it.room)) return _fpStyleFixture(it);
    const power = it.kind === "power_pack_area", z0 = 18, z1 = power ? 58 : 66, a0 = _fpP(it.a[0], it.a[1], z0), b0 = _fpP(it.b[0], it.b[1], z0), a1 = _fpP(it.a[0], it.a[1], z1), b1 = _fpP(it.b[0], it.b[1], z1);
    _fpQuad([a0, b0, b1, a1], power ? "#3a2f10" : "#2a1030", power ? "#ffd34d" : "#ff9ad5", 2);
    const n = power ? 4 : 0;   // battery cells on the power pack area
    for (let i = 0; i < n; i++) { const t0 = (i + 0.15) / n, t1 = (i + 0.85) / n, lerp = (p, q, t) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; _fpQuad([lerp(a0, b0, t0), lerp(a0, b0, t1), lerp(a1, b1, t1), lerp(a1, b1, t0)], "rgba(255,211,77,0.35)", "#ffd34d", 1); }
}

// ── the controls: NEW GAME (throw the save away, after asking) ──
// The page opens the facility (js/init.js boots it); there is no other game to change to.
function facilityPlayChip() {
    if (typeof document === "undefined" || !document.createElement || !document.body) return;
    if (document.getElementById("facilityNewChip") || (typeof attractOn === "function" && attractOn())) return;
    const c = document.createElement("button"); c.id = "facilityNewChip"; c.textContent = "NEW GAME";
    c.addEventListener("click", () => { let ok = true; try { ok = typeof confirm !== "function" || confirm("Start a new facility game? Your saved progress will be lost."); } catch (e) {} if (ok) facilityNewGame(); });
    document.body.appendChild(c);
}
function initFacilityPlay() {
    if (typeof window === "undefined" || !window.addEventListener) return;
    _fpNoStorage();   // before the page boots: nothing but the facility's own keys is written
    facilityPlayChip();
}
try { initFacilityPlay(); } catch (e) { /* no page (the test sandbox) */ }
