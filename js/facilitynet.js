// ─────────────────────────────────────────────────────────
//  THE FACILITY'S ZONE TAG AND NETWORK PANEL (docs/TUTORIAL.md, "The network and the zone tag")
// ─────────────────────────────────────────────────────────
// In the facility the two readouts at the top right of the screen mean the facility:
//   THE ZONE TAG ("Zone: Home" in the classic game) names the room the player is in, at each moment (a doorway keeps the room just left).
//   THE NETWORK PANEL (the dial and the lines under it) is the power grid: each RELAY is one ZONE of the facility (the rooms it feeds), and a zone is online once its relay is repaired. The dial's outer ring is the
//   zones online (24 segments lit by the fraction), its inner ring the ROOMS that have power again, the middle "online / zones". The state is OFFLINE (no zone), PARTIAL (some) or ONLINE (all, and the blackout is over);
//   below it are the line for the room the player stands in (powered or not) and one row per relay. It is not tapped: the classic game's power build is not part of the facility.
// Both read the same data as the rest of the facility: F.relays (js/facilitymap.js), relayOnline (js/stations.js) and the powered rooms (_fp.tut.powered, js/facilitytutorial.js).
const FP_ROOM_TAG = {
    crystal_chamber: "Crystal Chamber", teleport_room_1: "Teleport Room 1", front_lobby: "Computer Lab", security_room: "Security Room", show_room: "Show Room", lab_hallway: "Main Hallway",
    experiment_lab: "Experiment Lab", lab_passage: "Lab Passage", teleport_stair_room: "Stair Room", teleport_room_2: "Teleport Room 2", observation_deck: "Observation Deck", armory: "Armory",
    catwalks: "Catwalks", arena: "Arena", nest_area: "Nest Area",
};
const FP_NET_STATES = {
    offline: { label: "OFFLINE", col: "#6a7aa0" },
    partial: { label: "PARTIAL", col: "#ffe733" },
    online:  { label: "ONLINE",  col: "#19e6c1" },
};
function facilityRoomName(id) { return FP_ROOM_TAG[id] || String(id || "").replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()); }
// the room the player is in now (a doorway keeps the last), as the tag says it
function facilityZoneName() {
    if (typeof facilityPlay === "undefined" || !facilityPlay || !_fp || !_fp.F) return null;
    const r = facilityRoomAt(player.visualX, player.visualY, _fp.F); if (r) _fp.zoneRoom = r.id;
    return _fp.zoneRoom ? facilityRoomName(_fp.zoneRoom) : null;
}
// the grid as numbers: the zones (relays) with their state, and the rooms that have power
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
function drawFacilityNetworkHUD() {
    _netPanelRect = null;
    if (typeof placingHidesUi === "function" && placingHidesUi()) return;
    const N = facilityNetState(), S = FP_NET_STATES[N.state], narrow = canvas.width < 600;
    const W = narrow ? Math.min(canvas.width - 16, 230) : 236, IW = W - 8, DIAL = 104, WHERE = 20, BAR = 30, ROW_H = 20, rows = narrow ? 0 : N.zones.length, H = DIAL + WHERE + BAR + rows * ROW_H + 10;
    const zr = narrow ? null : _netZoneRect(), X = zr ? Math.max(8, Math.round(zr.right - W)) : canvas.width - W - 10, Y = zr ? Math.round(zr.bottom - 2) : uiTopSafe(), mx = X + 4, right = X + W - 4;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const dcx = right - 52, dcy = Y + DIAL / 2, lw = dcx - 52 - mx;
    _fnDial(dcx, dcy, N, S);
    _netText("NETWORK", mx, Y + 16, 15, "#cfe0ff", "left");
    ctx.save(); ctx.fillStyle = S.col; ctx.beginPath(); ctx.moveTo(mx + 6, Y + 28); ctx.lineTo(mx + Math.min(lw, 118), Y + 28); ctx.lineTo(mx + Math.min(lw, 118) - 5, Y + 31); ctx.lineTo(mx + 1, Y + 31); ctx.closePath(); ctx.globalAlpha = 0.9; ctx.fill(); ctx.restore();
    _netTextFit(S.label, mx, Y + 51, 26, S.col, "left", lw);
    _netTextFit("⚡ ROOMS " + N.powered + " / " + N.rooms, mx, Y + 76, 13, "#ffd34d", "left", lw, true);
    _netText("ZONES " + N.on + " / " + N.zones.length, mx, Y + 92, 12, N.on ? "#9fe8c0" : "#8a93a8", "left", true);
    // where you stand
    let y = Y + DIAL;
    const here = N.here ? facilityRoomName(N.here).toUpperCase() : "";
    _netTextFit(here ? here + " · " + (N.herePowered ? "POWERED" : "NO POWER") : "ALL ZONES DOWN", mx, y + 8, 12, N.herePowered ? "#a9bddf" : "#ff9a66", "left", IW, true);
    y += WHERE;
    // the bar: zones online
    { const nf = N.zones.length ? N.on / N.zones.length : 0, col = nf >= 1 ? "#5fe0c8" : "#ffe733", by = y + 14, bw = IW;
      ctx.beginPath(); ctx.moveTo(mx + 4, by); ctx.lineTo(mx + bw, by); ctx.lineTo(mx + bw - 3, by + 5); ctx.lineTo(mx, by + 5); ctx.closePath(); ctx.fillStyle = "rgba(4,6,14,0.7)"; ctx.fill();
      if (nf > 0) { const w = bw * nf; ctx.beginPath(); ctx.moveTo(mx + 4, by); ctx.lineTo(mx + w, by); ctx.lineTo(mx + w - 3, by + 5); ctx.lineTo(mx, by + 5); ctx.closePath(); ctx.fillStyle = col; ctx.fill(); }
      ctx.lineWidth = 1; ctx.strokeStyle = col; ctx.globalAlpha = 0.6; ctx.beginPath(); ctx.moveTo(mx + 4, by); ctx.lineTo(mx + bw, by); ctx.lineTo(mx + bw - 3, by + 5); ctx.lineTo(mx, by + 5); ctx.closePath(); ctx.stroke(); ctx.globalAlpha = 1; }
    y += BAR;
    // one row per zone
    if (!narrow) for (const z of N.zones) {
        _netTextFit(z.name, mx + 14, y + 8, 12, z.on ? "#e8f0ff" : "#8a93a8", "left", IW - 70, true);
        ctx.fillStyle = z.on ? "#5fe0c8" : "#ff5522"; ctx.beginPath(); ctx.arc(mx + 5, y + 8, 3.5, 0, 6.2832); ctx.fill();
        _netText(z.on ? "ONLINE" : "DOWN", right, y + 8, 11, z.on ? "#9fe8c0" : "#ff9a66", "right", true);
        y += ROW_H;
    }
    ctx.restore();
}
