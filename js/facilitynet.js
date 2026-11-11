// ─────────────────────────────────────────────────────────
//  THE FACILITY'S ROOM TAG AND NETWORK PANEL (docs/TUTORIAL.md, "The network and the room tag")
// ─────────────────────────────────────────────────────────
// In the facility the two readouts at the top right of the screen mean the facility:
//   THE ROOM TAG (the plate at the top right; its element is still #zoneInfo) names the room the player is in, at each moment (a doorway keeps the room just left).
//   THE NETWORK PANEL (the dial and the lines under it) is the power grid: each RELAY feeds a few rooms, and is online once it is repaired. The dial's OUTER RING is THE CRYSTAL'S CHARGE (the owner, 2026-11-01:
//   "it's tied to the network meter at the top now"; js/crystalpower.js: 24 segments lit by its share, a tick at the reserve, the middle its percent); its inner ring the ROOMS that have power again. The state is
//   OFFLINE (no relay), PARTIAL (some) or ONLINE (all, and the blackout is over), and the relays and rooms are lines under it; below them one line for the room the player stands in (it has power or it has none).
//   A TAP on the panel charges the Crystal: ◆50 for +75% (crystalBuyCharge). (The outer ring was the relays online, and the panel was not tapped.)
// Both read the same data as the rest of the facility: F.relays (js/facilitymap.js), relayOnline (js/stations.js) and the powered rooms (_fp.tut.powered, js/facilitytutorial.js).
const FP_ROOM_TAG = {
    crystal_chamber: "Crystal Chamber", teleport_room_1: "Teleport Room 1", front_lobby: "Server Room", security_room: "Security Room", show_room: "Warehouse", lab_hallway: "Main Hallway",
    experiment_lab: "Experiment Lab", lab_passage: "Lab Passage", teleport_stair_room: "Stair Room", teleport_room_2: "Teleport Room 2", observation_deck: "Observation Deck", armory: "Armory",
    catwalks: "Catwalks", arena: "Arena", nest_area: "Ant Nest", cold_storage: "Cold Storage", sewers: "Sewers",
    elec_servers: "Deep Server Room", elec_circuitry: "The Circuitry",   // (the electrical domain's two rooms: docs/DOMAINS.md; the names provisional)
};
const FP_NET_STATES = {
    offline: { label: "OFFLINE", col: "#6a7aa0" },
    partial: { label: "PARTIAL", col: "#ffe733" },
    online:  { label: "ONLINE",  col: "#19e6c1" },
};
// text with a dark outline, so it reads over the floor (there is no box behind the panel); and the same shrunk until it fits maxW
function _netText(text, x, y, size, col, align, mono) {
    ctx.save(); ctx.font = mono ? uiMono(size) : uiFont(size); ctx.textAlign = align || "left"; ctx.textBaseline = "middle"; ctx.lineJoin = "round";
    ctx.lineWidth = Math.max(3, size * 0.3); ctx.strokeStyle = "rgba(4,6,14,0.92)"; ctx.strokeText(text, x, y);
    ctx.fillStyle = col; ctx.fillText(text, x, y); ctx.restore();
}
function _netTextFit(text, x, y, size, col, align, maxW, mono) {
    ctx.save(); ctx.font = mono ? uiMono(size) : uiFont(size); const w = ctx.measureText(text).width; ctx.restore();
    _netText(text, x, y, w > maxW ? Math.max(9, Math.floor(size * maxW / w)) : size, col, align, mono);
}
// The room tag's box on the page (the HUD is page elements over the canvas), or null.
function _netZoneRect() {
    try { const e = document.getElementById("zoneInfo"); if (!e) return null; const r = e.getBoundingClientRect(); return r.height > 0 && isFinite(r.bottom) && r.bottom < canvas.height * 0.5 ? r : null; } catch (err) { return null; }
}
function facilityRoomName(id) { return FP_ROOM_TAG[id] || String(id || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }
// the room the player is in now (a doorway keeps the last), as the tag says it
function facilityZoneName() {
    if (typeof facilityPlay === "undefined" || !facilityPlay || !_fp || !_fp.F) return null;
    const r = facilityRoomAt(player.visualX, player.visualY, _fp.F); if (r) _fp.zoneRoom = r.id;
    const area = _fp.zoneRoom ? facilityAreaAt(player.visualX, player.visualY, _fp.zoneRoom) : null;   // (a named part of a room: the Sewers' Nest)
    return area ? area.label : _fp.zoneRoom ? facilityRoomName(_fp.zoneRoom) : null;
}
// a named AREA of a room the point is in (decor of kind `area`: a rectangle with a label; the Sewers' east end is THE NEST, js/population.js), or null
function facilityAreaAt(x, y, room) {
    if (!_fp || !_fp.F) return null;
    for (const d of _fp.F.decor || []) if (d.kind === "area" && d.rect && (!room || d.room === room) && x >= d.rect[0] && x <= d.rect[2] && y >= d.rect[1] && y <= d.rect[3]) return d;
    return null;
}
// the grid as numbers: the relays with their state, and the rooms that have power
function facilityNetState() {
    const F = _fp.F, zones = (F.relays || []).map(r => ({ id: r.id, name: String(r.name || r.id).replace(/ RELAY$/, ""), on: relayOnline(r.id) })), rooms = F.rooms.map(r => r.id);
    const key = id => (typeof _fpLightKey === "function" ? _fpLightKey(id) : id), lit = id => !facilityBlackout() || _fp.tut.powered.has(key(id));
    const here = _fp.zoneRoom || null, on = zones.filter(z => z.on).length, powered = rooms.filter(lit).length;
    const state = !zones.length || on === 0 ? "offline" : on < zones.length ? "partial" : "online";
    return { zones, on, rooms: rooms.length, powered, state, here, herePowered: here ? lit(here) : false, charge: typeof crystalCharge === "function" ? crystalCharge() : 1 };
}

function _fnDial(cx, cy, N, S) {
    const TAU = Math.PI * 2, top = -Math.PI / 2, R1 = 40, R2 = 28, SEGS = 24, seg = TAU * R1 / SEGS;
    const g = ctx.createRadialGradient(cx, cy, R2 * 0.4, cx, cy, R1 + 18); g.addColorStop(0, "rgba(4,6,14,0.62)"); g.addColorStop(0.75, "rgba(4,6,14,0.38)"); g.addColorStop(1, "rgba(4,6,14,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R1 + 18, 0, TAU); ctx.fill();
    ctx.save(); ctx.lineCap = "butt"; ctx.lineWidth = 9; ctx.setLineDash([seg * 0.78, seg * 0.22]);
    ctx.strokeStyle = "rgba(14,22,46,0.85)"; ctx.beginPath(); ctx.arc(cx, cy, R1, top, top + TAU); ctx.stroke();
    const ch = Math.max(0, Math.min(1, N.charge)), lit = Math.ceil(SEGS * ch - 1e-6), rv = typeof CRYSTAL_POWER !== "undefined" ? CRYSTAL_POWER.reserve : 0.1;   // THE CRYSTAL'S CHARGE (js/crystalpower.js)
    const cc = ch > 0.5 ? "#5fe0c8" : ch > 0.25 ? "#ffd34d" : ch > rv ? "#ff9a4a" : "#ff4a3a";
    if (lit > 0) { ctx.strokeStyle = cc; ctx.beginPath(); ctx.arc(cx, cy, R1, top, top + lit * TAU / SEGS); ctx.stroke(); }
    ctx.setLineDash([]); ctx.lineWidth = 2; ctx.strokeStyle = "#ff4a3a"; const ra = top + rv * TAU; ctx.beginPath(); ctx.moveTo(cx + Math.cos(ra) * (R1 - 7), cy + Math.sin(ra) * (R1 - 7)); ctx.lineTo(cx + Math.cos(ra) * (R1 + 7), cy + Math.sin(ra) * (R1 + 7)); ctx.stroke();   // (the reserve)
    ctx.setLineDash([]); ctx.lineWidth = 5; ctx.strokeStyle = "rgba(14,22,46,0.85)"; ctx.beginPath(); ctx.arc(cx, cy, R2, 0, TAU); ctx.stroke();
    const rf = N.rooms ? N.powered / N.rooms : 0; if (rf > 0) { ctx.strokeStyle = "#ffd34d"; ctx.beginPath(); ctx.arc(cx, cy, R2, top, top + rf * TAU); ctx.stroke(); }
    ctx.lineWidth = 1.5; ctx.strokeStyle = S.col; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(cx, cy, R1 + 6.5, 0, TAU); ctx.stroke(); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(cx, cy, R2 - 5, 0, TAU); ctx.stroke();
    ctx.restore();
    _netText(Math.round(ch * 100) + "%", cx, cy - 3, 17, ch > rv ? "#fff" : "#ff6a4a", "center"); _netText("CRYSTAL", cx, cy + 12, 8, "#9fb4d8", "center", true);
}
let _fnBottom = 0;   // where the panel ends on screen (0: not drawn): on a phone the round button (js/targeting.js) goes under it
let _fnRect = null;   // the panel on screen, for a tap (facilityNetTap)
function drawFacilityNetworkHUD() {
    _fnBottom = 0;
    const N = facilityNetState(), S = FP_NET_STATES[N.state], narrow = canvas.width < 600;
    const W = narrow ? Math.min(canvas.width - 16, 230) : 236, IW = W - 8, DIAL = 104, H = DIAL + 24;
    const zr = narrow ? null : _netZoneRect(), X = zr ? Math.max(8, Math.round(zr.right - W)) : canvas.width - W - 10, Y = zr ? Math.round(zr.bottom - 2) : uiTopSafe(), mx = X + 4, right = X + W - 4;
    _fnBottom = Y + H; _fnRect = { x: X, y: Y, w: W, h: H };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dcx = right - 52, dcy = Y + DIAL / 2, lw = dcx - 52 - mx;
    _fnDial(dcx, dcy, N, S);
    _netText("NETWORK", mx, Y + 16, 15, "#cfe0ff", "left");
    ctx.save(); ctx.fillStyle = S.col; ctx.beginPath(); ctx.moveTo(mx + 6, Y + 28); ctx.lineTo(mx + Math.min(lw, 118), Y + 28); ctx.lineTo(mx + Math.min(lw, 118) - 5, Y + 31); ctx.lineTo(mx + 1, Y + 31); ctx.closePath(); ctx.globalAlpha = 0.9; ctx.fill(); ctx.restore();
    _netTextFit(S.label, mx, Y + 51, 26, S.col, "left", lw);
    _netTextFit("\u26a1 ROOMS " + N.powered + " / " + N.rooms, mx, Y + 76, 13, "#ffd34d", "left", lw, true);
    _netText("RELAYS " + N.on + " / " + N.zones.length, mx, Y + 92, 12, N.on ? "#9fe8c0" : "#8a93a8", "left", true);
    // the room you are in, and whether it has power: one line (the tag above names the room, this says its state)
    const col = N.here ? (N.herePowered ? "#5fe0c8" : "#ff7755") : "#8a93a8";
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(mx + 5, Y + DIAL + 10, 4, 0, 6.2832); ctx.fill();
    _netTextFit(N.here ? (N.herePowered ? "THIS ROOM HAS POWER" : "THIS ROOM HAS NO POWER") : "NO POWER ANYWHERE", mx + 15, Y + DIAL + 10, 12, col, "left", IW - 16, true);
    ctx.restore();
}
// A TAP ON THE NETWORK PANEL (js/input.js): it charges the Crystal (js/crystalpower.js crystalBuyCharge: ◆50 for +75%); true when the tap was the panel's
function facilityNetTap(tx, ty) {
    const r = _fnRect; if (!r || !_fnBottom || typeof crystalBuyCharge !== "function") return false;
    if (tx < r.x || tx > r.x + r.w || ty < r.y || ty > r.y + r.h) return false;
    crystalBuyCharge(); return true;
}
