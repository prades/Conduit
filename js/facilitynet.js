// ─────────────────────────────────────────────────────────
//  THE FACILITY'S ROOM TAG AND NETWORK PANEL (docs/TUTORIAL.md, "The network and the room tag")
// ─────────────────────────────────────────────────────────
// In the facility the two readouts at the top right of the screen mean the facility:
//   THE ROOM TAG (the plate at the top right; its element is still #zoneInfo) names the room the player is in, at each moment (a doorway keeps the room just left).
//   THE NETWORK PANEL (the dial and the lines under it) is the power grid: each RELAY feeds a few rooms, and is online once it is repaired. The dial's outer ring is the relays online (24 segments lit by the fraction), its inner
//   ring the ROOMS that have power again, the middle "online / relays". The state is OFFLINE (no relay), PARTIAL (some) or ONLINE (all, and the blackout is over); below it is one line for the room the player stands in
//   (it has power or it has none). It is not tapped.
// Both read the same data as the rest of the facility: F.relays (js/facilitymap.js), relayOnline (js/stations.js) and the powered rooms (_fp.tut.powered, js/facilitytutorial.js).
const FP_ROOM_TAG = {
    crystal_chamber: "Crystal Chamber", teleport_room_1: "Teleport Room 1", front_lobby: "Computer Lab", security_room: "Security Room", show_room: "Show Room", lab_hallway: "Main Hallway",
    experiment_lab: "Experiment Lab", lab_passage: "Lab Passage", teleport_stair_room: "Stair Room", teleport_room_2: "Teleport Room 2", observation_deck: "Observation Deck", armory: "Armory",
    catwalks: "Catwalks", arena: "Arena", nest_area: "Nest Area", cold_storage: "Cold Storage",
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
    return _fp.zoneRoom ? facilityRoomName(_fp.zoneRoom) : null;
}
// the grid as numbers: the relays with their state, and the rooms that have power
function facilityNetState() {
    const F = _fp.F, zones = (F.relays || []).map(r => ({ id: r.id, name: String(r.name || r.id).replace(/ RELAY$/, ""), on: relayOnline(r.id) })), rooms = F.rooms.map(r => r.id);
    const key = id => (typeof _fpLightKey === "function" ? _fpLightKey(id) : id), lit = id => !facilityBlackout() || _fp.tut.powered.has(key(id));
    const here = _fp.zoneRoom || null, on = zones.filter(z => z.on).length, powered = rooms.filter(lit).length;
    const state = !zones.length || on === 0 ? "offline" : on < zones.length ? "partial" : "online";
    return { zones, on, rooms: rooms.length, powered, state, here, herePowered: here ? lit(here) : false };
}

function _fnDial(cx, cy, N, S) {
    const TAU = Math.PI * 2, top = -Math.PI / 2, R1 = 40, R2 = 28, SEGS = 24, seg = TAU * R1 / SEGS;
    const g = ctx.createRadialGradient(cx, cy, R2 * 0.4, cx, cy, R1 + 18); g.addColorStop(0, "rgba(4,6,14,0.62)"); g.addColorStop(0.75, "rgba(4,6,14,0.38)"); g.addColorStop(1, "rgba(4,6,14,0)");
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(cx, cy, R1 + 18, 0, TAU); ctx.fill();
    ctx.save(); ctx.lineCap = "butt"; ctx.lineWidth = 9; ctx.setLineDash([seg * 0.78, seg * 0.22]);
    ctx.strokeStyle = "rgba(14,22,46,0.85)"; ctx.beginPath(); ctx.arc(cx, cy, R1, top, top + TAU); ctx.stroke();
    const lit = N.zones.length ? Math.round(SEGS * N.on / N.zones.length) : 0;
    if (lit > 0) { ctx.strokeStyle = S.col; ctx.beginPath(); ctx.arc(cx, cy, R1, top, top + lit * TAU / SEGS); ctx.stroke(); }
    ctx.setLineDash([]); ctx.lineWidth = 5; ctx.strokeStyle = "rgba(14,22,46,0.85)"; ctx.beginPath(); ctx.arc(cx, cy, R2, 0, TAU); ctx.stroke();
    const rf = N.rooms ? N.powered / N.rooms : 0; if (rf > 0) { ctx.strokeStyle = "#ffd34d"; ctx.beginPath(); ctx.arc(cx, cy, R2, top, top + rf * TAU); ctx.stroke(); }
    ctx.lineWidth = 1.5; ctx.strokeStyle = S.col; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(cx, cy, R1 + 6.5, 0, TAU); ctx.stroke(); ctx.globalAlpha = 0.35; ctx.beginPath(); ctx.arc(cx, cy, R2 - 5, 0, TAU); ctx.stroke();
    ctx.restore();
    _netText(N.on + "/" + N.zones.length, cx, cy + 1, 18, N.on ? "#fff" : S.col, "center");
}
let _fnBottom = 0;   // where the panel ends on screen (0: not drawn): on a phone the round button (js/targeting.js) goes under it
function drawFacilityNetworkHUD() {
    _fnBottom = 0;
    const N = facilityNetState(), S = FP_NET_STATES[N.state], narrow = canvas.width < 600;
    const W = narrow ? Math.min(canvas.width - 16, 230) : 236, IW = W - 8, DIAL = 104, H = DIAL + 24;
    const zr = narrow ? null : _netZoneRect(), X = zr ? Math.max(8, Math.round(zr.right - W)) : canvas.width - W - 10, Y = zr ? Math.round(zr.bottom - 2) : uiTopSafe(), mx = X + 4, right = X + W - 4;
    _fnBottom = Y + H;
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
