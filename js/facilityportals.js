// ─────────────────────────────────────────────────────────
//  THE PORTALS: doorways into a room that is a part of the map of its own (docs/FACILITY.md, "Interiors and portals")
// ─────────────────────────────────────────────────────────
// ASKED: "little rooms you can go into that load in. That way I can put different rooms under different rooms [...] a room under the observation deck, and that would be the armory, through a doorway that you
// have to go into, and it loads in a new part of the map."
// A flat plan cannot put one room under another, so a room that lies under or inside another is an INTERIOR (`interiors` in js/facilitymap.js): the building pass (js/facilitygrow.js) keeps it in a part of
// the map of its own, far from everything else, and a pair of PORTALS joins it to the room it is under. A portal is a doorway: an alcove in a wall with a stairwell door at the end of it (the style
// `portal_door`, js/facilitystyleall.js). Walk into the alcove and the screen fades to black, the other room is loaded round you (you are put in front of the doorway at the other end) and it fades back.
//   - the followers that are following you come with you (those within FP_PORTAL.carry tiles are put round you at once); the others walk to the doorway by themselves and go through it (`_fpPortalGoal`, which
//     js/npc.js followPlayer walks to), so a squad scattered over the facility joins you in the armory. A follower holding a room and anyone on an order stay where they are.
//   - nothing else uses a portal: the arena's creatures and the assault's cannot go through (an interior has no door onto any other room).
//   - while it fades the player cannot be told to walk (facilityWalkTo refuses), and for FP_PORTAL.cool frames after arriving the doorway at the arrival end does not take you straight back.
const FP_PORTAL = { out: 14, hold: 14, in: 18, cool: 70, carry: 16, pocket: 30 };   // pocket: a stretch of floor of this many cells or fewer, with no doorway and no landing, is one nobody can walk out of

function facilityPortalsStart(F) {
    if (!_fp) return;
    _fp.portals = []; _fp.portal = { phase: "idle", t0: 0, from: null, to: null }; _fp.portalCool = 0; _fp.portalsOpen = new Set();
    for (const p of (F.portals || [])) {
        const cx = (p.rect[0] + p.rect[2]) / 2, cy = (p.rect[1] + p.rect[3]) / 2;
        let a = _fpNearestCell(p.arrive[0], p.arrive[1]); const rm = a ? facilityRoomAt(a[0], a[1], F) : null;
        if (!rm || rm.id !== p.room) a = _fpNearestCell(cx, cy) || [Math.round(cx), Math.round(cy)];
        _fp.portals.push({ id: p.id, room: p.room, to: p.to, label: p.label, kind: p.kind, rect: p.rect.slice(), x: cx, y: cy, ax: a[0], ay: a[1], up: p.kind === "stairs_up", well: !!p.well, shut: !!p.shut, rubble: p.rubble || null });
    }
}
// A SHUT doorway (`shut` in the map: the Sewers' drain pipe's ledge end, the owner, 2026-11-07: "Pipe shortcut"): a grate that opens only from inside. Nobody goes in at it until someone has come out of it;
// then it is open for good (_fp.portalsOpen, saved as `pipes`), a shortcut both ways.
function facilityPortalShut(p) { return !!(p && ((p.shut && !(_fp && _fp.portalsOpen && _fp.portalsOpen.has(p.id))) || (p.rubble && !(typeof techRubbleOpen === "function" && typeof _techRubble === "function" && techRubbleOpen(_techRubble(p.rubble)))))); }
// A doorway through RUBBLE (`rubble` in the map: the Ant Nest's, through the arena's south rubble, docs/NEST.md) is shut until a fire technician has drilled that rubble through; drilled rubble stays drilled (saved).
function _pOpened(dest) { if (!facilityPortalShut(dest)) return; _fp.portalsOpen.add(dest.id); if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: dest.ax, y: dest.ay, text: "THE GRATE SWINGS OPEN · A SHORTCUT", color: "#ffe733", life: 120, vy: -0.05, size: 13 }); }
function facilityPortalsSnapshot() { return _fp && _fp.portalsOpen ? Array.from(_fp.portalsOpen) : []; }
function facilityPortalsApply(list) { if (!_fp) return; _fp.portalsOpen = new Set((Array.isArray(list) ? list : []).filter(id => typeof id === "string" && facilityPortal(id))); }
function facilityPortal(id) { return (_fp && _fp.portals || []).find(p => p.id === id) || null; }
function _pIn(x, y, r) { return x > r[0] && x < r[2] && y > r[1] && y < r[3]; }
// the portal whose doorway a point is in
function facilityPortalAt(x, y) { for (const p of (_fp && _fp.portals) || []) if (_pIn(x, y, p.rect)) return p; return null; }
function _pComp(x, y) { const c = typeof _fpNearestCellOpen === "function" ? _fpNearestCellOpen(x, y) : _fpNearestCell(x, y); return c ? _fpComps().get(c[0] + "," + c[1]) : undefined; }   // (the cell the body can step to: one pressed against a thin solid is on its own side of it, not the nearer cell beyond: js/facilityplay.js)
// a spot in front of a doorway for someone to be put at: the arrival tile itself first, then round it, on the arrival tile's own stretch of floor (REPORTED: "when I enter the sewers with a full squad, the game
// puts my followers inside of that little gated off section and they get stuck there forever": the first barred stub off the north ledge is two tiles from the culvert's arrival tile, floor of the room, and
// nobody put behind its gate could walk out; _fpComps tells the stretches apart)
function _pSpot(dest, k) {
    if (!k) return [dest.ax, dest.ay];
    const cm = _fpComps(), dc = cm.get(dest.ax + "," + dest.ay);
    const c = []; for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) { const x = dest.ax + dx, y = dest.ay + dy, key = x + "," + y; if ((dx || dy) && !_pIn(x, y, dest.rect) && _fp.cellsP.has(key) && (dc === undefined || cm.get(key) === dc)) { const rm = facilityRoomAt(x, y, _fp.F); if (rm && rm.id === dest.room) c.push([x, y]); } }
    return c.length ? c[Math.floor(Math.random() * c.length)] : [dest.ax, dest.ay];
}
// put a unit beside the player, on the player's own stretch: a cell within two tiles that is on it, else the player's cell
function _pBeside(a) {
    const c = typeof _fpNearestCellOpen === "function" ? _fpNearestCellOpen(player.x, player.y) : _fpNearestCell(player.x, player.y); if (!c) return false;   // (the player's own side of a thin solid)
    const cm = _fpComps(), pc = cm.get(c[0] + "," + c[1]), opts = [];
    for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) { if (!dx && !dy) continue; const key = (c[0] + dx) + "," + (c[1] + dy); if (_fp.cellsP.has(key) && cm.get(key) === pc) opts.push([c[0] + dx, c[1] + dy]); }
    const s = opts.length ? opts[Math.floor(Math.random() * opts.length)] : c;
    a.x = s[0] + (Math.random() - 0.5) * 0.3; a.y = s[1] + (Math.random() - 0.5) * 0.3; a._fpPath = null; a._fpGoalAt = null; a._fpStuck = 0; a._fpPortalGoal = null; a._fpPortalAt = typeof frame !== "undefined" ? frame : 0;
    return true;
}
// put a unit through a doorway: out of the partner's end
function facilityPortalSend(a, p, k) {
    const dest = facilityPortal(p.to); if (!dest) return false;
    const s = _pSpot(dest, k || 0); a.x = s[0] + (k ? (Math.random() - 0.5) * 0.3 : 0); a.y = s[1] + (k ? (Math.random() - 0.5) * 0.3 : 0);
    if (a !== player) { a._fpPath = null; a._fpGoalAt = null; a._fpStuck = 0; a._fpPortalGoal = null; a._fpPortalAt = typeof frame !== "undefined" ? frame : 0; }
    return true;
}

// ── the player's trip ──
function facilityPortalBusy() { return !!(_fp && _fp.portal && _fp.portal.phase !== "idle"); }
function facilityPortalStart(p) {
    const P = _fp.portal; if (P.phase !== "idle") return false;
    P.phase = "out"; P.t0 = frame; P.from = p.id; P.to = p.to; player.fpPath = null; player.targetX = player.x; player.targetY = player.y; _fp.stationGoal = null;
    return true;
}
// at the moment of black: the player comes out of the other end, and the squad with them
function _pMove() {
    const P = _fp.portal, from = facilityPortal(P.from), dest = facilityPortal(P.to); if (!from || !dest) return;
    const pc = _pComp(player.x, player.y);
    facilityPortalSend(player, from, 0); player.targetX = player.visualX = player.x; player.targetY = player.visualY = player.y; player.fpPath = null;
    let n = 0; const ids = [];
    for (const a of followers.concat(typeof actors !== "undefined" ? actors.filter(q => q && q.isClone && q.team === "green") : [])) {
        if (!a || a.dead || a.team !== "green" || a === player || ids.indexOf(a) >= 0 || !_pCarries(a)) continue;
        ids.push(a); if (Math.hypot(a.x - from.x, a.y - from.y) > FP_PORTAL.carry || _pComp(a.x, a.y) !== pc) continue;
        facilityPortalSend(a, from, ++n);
    }
    _fp.zoneRoom = dest.room; _fp.portalCool = frame + FP_PORTAL.cool; _pOpened(dest);
}
// who comes through on their own: a follower that is following (no post, no order)
function _pCarries(a) { return !a.returningToCrystal && !a.job && !a.post && (a.stance === "follow" || (a.isClone && !a.stance)) && (a.role !== "camper" || (typeof partyOn === "function" && partyOn())); }   // (a technician in the squad comes with you: it is not tied to the Crystal. A clone that has had no order has no stance: it is following, and it comes too; it used to be left behind at every doorway, found 2026-11-01)

// each frame (from facilityTutorialTick)
function facilityPortalTick() {
    if (!_fp || !_fp.portals || !_fp.portals.length) return;
    const P = _fp.portal, f = typeof frame !== "undefined" ? frame : 0;
    if (P.phase === "idle") {
        if (f >= _fp.portalCool) { const p = facilityPortalAt(player.x, player.y); if (p && !facilityPortalShut(p)) facilityPortalStart(p); }
    } else if (P.phase === "out") { if (f - P.t0 >= FP_PORTAL.out) { _pMove(); P.phase = "hold"; P.t0 = f; } }
    else if (P.phase === "hold") { if (f - P.t0 >= FP_PORTAL.hold) { P.phase = "in"; P.t0 = f; } }
    else if (P.phase === "in") { if (f - P.t0 >= FP_PORTAL.in) { P.phase = "idle"; P.from = P.to = null; } }
    if (f % 15 === 7) _pFollowScan();
}
// the followers on another stretch of floor than the player's: walk to the doorway that comes out on the player's. One on a POCKET (a stretch of FP_PORTAL.pocket cells or fewer with no doorway out and no landing:
// the floor behind a barred gate, which it cannot walk out of and no route will come to; a saved game from before _pSpot kept off the gated stubs may hold one) is put beside the player on the second scan in a
// row that finds it so. A big stretch cut off for the moment (the building while the arena's door is shut) is not a pocket: its followers wait, as they did. A stretch a launcher lands on (the catwalks: a launched
// follower walks to its drop, js/techabilities.js) is not one either, nor is a follower in the air or carrying a launcher's load.
function _pFollowScan() {
    const pc = _pComp(player.x, player.y); if (pc === undefined) return;
    let landings = null;
    for (const a of followers) {
        if (!a || a.dead || a.team !== "green") continue;
        a._fpPortalGoal = null; if (!_pCarries(a) || (a._fpPortalAt && frame - a._fpPortalAt < 90)) { a._fpSealed = 0; continue; }
        const ac = _pComp(a.x, a.y); if (ac === undefined || ac === pc) { a._fpSealed = 0; continue; }
        let best = null, bd = 1e9;   // the nearest doorway on its own floor that comes out on the player's
        for (const p of _fp.portals) { if (_pComp(p.x, p.y) !== ac || facilityPortalShut(p)) continue; const q = facilityPortal(p.to); if (q && _pComp(q.ax, q.ay) === pc) { const d = Math.hypot(p.x - a.x, p.y - a.y); if (d < bd) { bd = d; best = p; } } }
        if (best) { a._fpPortalGoal = best.id; a._fpSealed = 0; continue; }
        if (!landings) { landings = new Set(); for (const s of ((_fp.F && _fp.F.launchSites) || [])) if (s.land) landings.add(_pComp(s.land[0], s.land[1])); }
        const cells = _fp.compSize ? (_fp.compSize.get(ac) || 0) : 0;
        if (!cells || cells > FP_PORTAL.pocket || landings.has(ac) || a._flight || a._launchLoad || a._dropSite || (typeof actors !== "undefined" && actors.indexOf(a) < 0)) { a._fpSealed = 0; continue; }   // (a follower that is not in the world's list is not simulated: left alone)
        a._fpSealed = (a._fpSealed || 0) + 1;
        if (a._fpSealed >= 2) { _pBeside(a); a._fpSealed = 0; }
    }
}
// the point a follower walks to while it is going through a doorway (js/npc.js followPlayer), or null
function facilityPortalGoal(a) { const p = a && a._fpPortalGoal ? facilityPortal(a._fpPortalGoal) : null; return p ? { x: p.x, y: p.y } : null; }
// after a follower's step (js/npc.js updateNPC): in the doorway it was walking to? Through it.
function facilityPortalActorTick(a) {
    if (!a._fpPortalGoal || a.dead) return;
    const p = facilityPortal(a._fpPortalGoal); if (p && _pIn(a.x, a.y, p.rect) && !facilityPortalShut(p)) { facilityPortalSend(a, p, 1); _pOpened(facilityPortal(p.to)); }
}

// ── drawing: the name over a doorway you are near, and the fade ──
function facilityDrawPortals() {
    if (!_fp || !_fp.portals || !_fp.portals.length || typeof ctx === "undefined" || typeof _stScreen !== "function") return;
    const P = _fp.portal, f = typeof frame !== "undefined" ? frame : 0, W = canvas.width, H = canvas.height;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (P.phase === "idle") {
        const shown = [];   // (two doorways side by side, the arena culvert and the drain pipe's ledge end: only the nearer one's name, so the two tags do not overlap)
        for (const p of _fp.portals.slice().sort((a, b) => Math.hypot(a.x - player.visualX, a.y - player.visualY) - Math.hypot(b.x - player.visualX, b.y - player.visualY))) {
            const d = Math.hypot(p.x - player.visualX, p.y - player.visualY); if (d > 9 || (typeof invPanelOpen !== "undefined" && invPanelOpen)) continue;
            if (p.rubble && facilityPortalShut(p)) continue;   // (rubble not drilled yet: the rubble's own tag says what it is)
            if (shown.some(q => Math.hypot(q.x - p.x, q.y - p.y) < 3.5)) continue; shown.push(p);
            const s = _stScreen({ x: p.x, y: p.y }), a = Math.min(1, (9 - d) / 4), col = p.up || p.kind === "door" ? "#ffb347" : "#8fe3ff", txt = facilityPortalShut(p) ? "▣ " + String(p.label || "").toUpperCase() + " · ITS GRATE OPENS FROM INSIDE" : (p.kind === "door" ? "▶ " : p.up ? "▲ " : "▼ ") + String(p.label || "").toUpperCase();
            ctx.globalAlpha = a; ctx.font = (typeof uiFont === "function" ? uiFont(15) : "bold 15px sans-serif"); ctx.textAlign = "center"; ctx.textBaseline = "middle";
            const w = ctx.measureText(txt).width + 22, y = s.y - 92 + Math.sin(f * 0.07 + p.x) * 3;
            ctx.fillStyle = "rgba(5,8,18,0.82)"; ctx.fillRect(s.x - w / 2, y - 13, w, 26); ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.strokeRect(s.x - w / 2 + 1, y - 12, w - 2, 24); ctx.fillStyle = col; ctx.fillText(txt, s.x, y + 1);
        }
    } else {
        const t = f - P.t0; let k = P.phase === "out" ? Math.min(1, t / FP_PORTAL.out) : P.phase === "hold" ? 1 : Math.max(0, 1 - t / FP_PORTAL.in);
        k = k * k * (3 - 2 * k); ctx.globalAlpha = k; ctx.fillStyle = "#02040a"; ctx.fillRect(0, 0, W, H);
        const to = facilityPortal(P.to); const rm = to && _fp.F ? _fp.F.byId.get(to.room) : null;
        if (rm && k > 0.55) {
            ctx.globalAlpha = Math.min(1, (k - 0.55) / 0.45); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = to.up ? "#8fe3ff" : "#ffb347";
            ctx.font = (typeof uiFont === "function" ? uiFont(30) : "bold 30px sans-serif"); ctx.fillText(String(rm.label || to.room).toUpperCase(), W / 2, H / 2 - 4);
            ctx.font = (typeof uiMono === "function" ? uiMono(13) : "13px monospace"); ctx.fillStyle = "#6d7fa6"; ctx.fillText("LOADING" + ".".repeat(1 + Math.floor(f / 10) % 3), W / 2, H / 2 + 28);
        }
    }
    ctx.restore();
}
