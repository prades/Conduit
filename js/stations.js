// ─────────────────────────────────────────────────────────
//  CLASS STATIONS — furniture the player can use (docs/TUTORIAL.md, phase 4)
// ─────────────────────────────────────────────────────────
// A station is a prop in the facility (F.stations in js/facilitymap.js names the prop) with a KIND, a row of STATION_KINDS below. The kind says who may use it, what it costs and what it does. Every class has one in the
// rooms it works in, and each one earns the class a PERK (CLASS_PERKS in js/classes.js) that the rest of the game reads through classStat():
//   the Armory's weapon locker       Gunslinger     the service rifle: shots hit harder and come faster
//   the Security Room's console      Gunslinger     CCTV sweeps: every enemy in the facility is marked for a while (and again after a cooldown)
//   the console in Teleport Room 1   Technomancer   a tuned monitor lamp: it reaches further, and an overcharge lasts longer
//   a test chamber in the lab        Mutator        a sequenced sample: a mutagen sample raises a follower two levels, not one
// A station can be used by walking up and pressing E, by tapping the plate that appears, or by tapping the station (the player walks to it first). Another class's station shows its ring dimmed and refuses, saying who it is for.
//   STATION_KINDS[kind] = { name, verb, classes, perk, once, cost, cooldown, use }

const STATION_KINDS = {
    weapon_locker: { name: "WEAPON LOCKER", verb: "REQUISITION THE SERVICE RIFLE", classes: ["gunslinger"], perk: "rifle", once: true,
        use: () => { invAdd("ammo_pack", 2); return { ok: true, msg: "SERVICE RIFLE — SHOTS HIT 60% HARDER, 25% FASTER" }; } },
    cctv: { name: "SECURITY CONSOLE", verb: "RUN A CCTV SWEEP", classes: ["gunslinger"], perk: "cctv", cooldown: 3600,
        use: () => { _fp.cctvUntil = frame + 1500; return { ok: true, msg: "CCTV SWEEP — ENEMIES MARKED FOR 25 SECONDS" }; } },
    tune_bench: { name: "TUNING CONSOLE", verb: "TUNE YOUR MONITOR LAMP", classes: ["technomancer"], perk: "tuned", once: true,
        use: () => ({ ok: true, msg: "LAMP TUNED — 25% FURTHER, OVERCHARGES LAST 50% LONGER" }) },
    sequencer: { name: "SEQUENCER", verb: "SEQUENCE A MUTAGEN SAMPLE", classes: ["mutator"], perk: "sequenced", once: true, cost: [["mutagen_sample", 1]],
        use: () => ({ ok: true, msg: "SAMPLES SEQUENCED — A SAMPLE NOW RAISES A FOLLOWER TWO LEVELS" }) },
};
const STATION_RANGE = 1.8;

function facilityStationsStart(F) {
    if (!_fp || !_fp.items) return;
    _fp.items = _fp.items.filter(i => i.fp !== "station"); _fp.stations = []; _fp.stationGoal = null; _fp.stationNear = null; _fp.cctvUntil = 0; _fp.cctvReadyAt = 0;
    for (const st of (F.stations || [])) {
        const pr = F.solids.find(p => p.id === st.prop), k = STATION_KINDS[st.kind]; if (!pr || !k) continue;
        const s = { id: st.id, kind: st.kind, room: st.room, bb: pr.bb.slice(), x: (pr.bb[0] + pr.bb[2]) / 2, y: (pr.bb[1] + pr.bb[3]) / 2 };
        _fp.stations.push(s);
        _fp.items.push({ type: "fp", fp: "station", id: st.id, kind: st.kind, room: st.room, bb: s.bb, x: s.x, y: s.y, depth: s.bb[2] + s.bb[3] - 0.45, base: facilityRoomHeight(st.room, F) * FP_ELEV_PX, seed: _fpHash(Math.round(s.x * 3), Math.round(s.y * 7)) });
    }
}
function stationDist(s) { const dx = Math.max(s.bb[0] - player.visualX, 0, player.visualX - s.bb[2]), dy = Math.max(s.bb[1] - player.visualY, 0, player.visualY - s.bb[3]); return Math.hypot(dx, dy); }
function stationNearest() { let best = null, bd = STATION_RANGE; for (const s of (_fp && _fp.stations) || []) { const d = stationDist(s); if (d < bd) { bd = d; best = s; } } return best; }

// can the player use it now? { ok, why }
function stationCan(s) {
    const k = STATION_KINDS[s.kind], now = typeof frame !== "undefined" ? frame : 0;
    if (!playerClassId) return { ok: false, why: "CHOOSE A CLASS FIRST" };
    if (!classAllows(k.classes)) return { ok: false, why: "ONLY A " + k.classes.map(className).join(" / ") + " CAN USE THIS" };
    if (k.once && classHas(k.perk)) return { ok: false, why: "ALREADY DONE", done: true };
    if (k.cooldown && _fp.cctvReadyAt > now && s.kind === "cctv") return { ok: false, why: "CAMERAS RESETTING — " + Math.ceil((_fp.cctvReadyAt - now) / 60) + " S" };
    for (const [id, n] of (k.cost || [])) if (!invHas(id, n)) return { ok: false, why: "NEEDS " + n + " " + itemDef(id).name };
    return { ok: true };
}
function stationUse(s) {
    s = s || stationNearest(); if (!s) return { ok: false, why: "NOTHING TO USE HERE" };
    const k = STATION_KINDS[s.kind], can = stationCan(s); if (!can.ok) { invSay(can.why, false); return can; }
    if (stationDist(s) > STATION_RANGE + 0.6) { invSay("TOO FAR AWAY", false); return { ok: false, why: "TOO FAR AWAY" }; }
    for (const [id, n] of (k.cost || [])) invRemove(id, n);
    const r = k.use(s), first = !classHas(k.perk), got = classGrant(k.perk);
    if (k.cooldown) _fp.cctvReadyAt = frame + k.cooldown;
    invSay(r.msg + (got ? "   ▲ RANK " + classRank() : ""), true);
    return Object.assign({ perk: got ? k.perk : null, first }, r);
}

// each frame: who is in range, and a station we were walking to
function facilityStationTick() {
    if (!_fp || !_fp.stations) return;
    _fp.stationNear = stationNearest();
    const g = _fp.stationGoal && _fp.stations.find(s => s.id === _fp.stationGoal);
    if (g) { if (stationDist(g) <= STATION_RANGE) { _fp.stationGoal = null; stationUse(g); } else if (!player.fpPath || !player.fpPath.length) _fp.stationGoal = null; }
}
// a tap: on the plate, or on a station (use it if close, walk to it if not). Returns true when it was ours.
function facilityStationTap(ex, ey) {
    if (!_fp || !_fp.stations || !_fp.stations.length) return false;
    const r = _stPlate();
    if (_fp.stationNear && r && ex >= r.x && ex <= r.x + r.w && ey >= r.y && ey <= r.y + r.h) { stationUse(_fp.stationNear); return true; }
    for (const s of _fp.stations) {
        const p = _stScreen(s); if (Math.hypot(ex - p.x, ey - p.y) > 46) continue;
        if (stationDist(s) <= STATION_RANGE) stationUse(s);
        else { const g = _stApproach(s); if (g && typeof facilityWalkTo === "function") { facilityWalkTo(g[0], g[1]); _fp.stationGoal = s.id; } }
        return true;
    }
    return false;
}
function _stScreen(s) { return { x: (s.x - player.visualX - (s.y - player.visualY)) * TILE_W + canvas.width / 2, y: (s.x - player.visualX + (s.y - player.visualY)) * TILE_H + canvas.height / 2 - (typeof facilityLiftRel === "function" ? facilityLiftRel(s.x, s.y) : 0) - 18 }; }
// where to walk to use it: the walkable tile round the prop nearest the player (js/facilityplay.js knows the walls)
function _stApproach(s) { return typeof facilityApproachTile === "function" ? facilityApproachTile(s.bb, STATION_RANGE - 0.3) : null; }

// the ring on the floor round a station: its class's colour and pulsing for the class that can use it, a dim grey for everyone else
function _fpDrawStation(it) {
    const k = STATION_KINDS[it.kind], mine = playerClassId && classAllows(k.classes), done = k.once && classHas(k.perk), col = done ? "#5a6a8a" : mine ? classColour(k.classes[0]) : "#4a5675", f = _fpFrame(), pul = 0.6 + 0.4 * Math.sin(f * 0.07 + it.seed), b = it.bb, e = 0.12;
    const pts = [_fpP(b[0] - e, b[1] - e, 0), _fpP(b[2] + e, b[1] - e, 0), _fpP(b[2] + e, b[3] + e, 0), _fpP(b[0] - e, b[3] + e, 0)];
    ctx.save(); ctx.lineJoin = "round"; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
    ctx.globalAlpha = (mine && !done ? 0.35 : 0.2) * (mine && !done ? pul : 1); ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = mine && !done ? 0.55 + 0.4 * pul : 0.5; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    if (mine && !done) { const c = _fpP(it.x, it.y, 74 + Math.sin(f * 0.08 + it.seed) * 3); ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c[0], c[1] + 8); ctx.lineTo(c[0] - 7, c[1] - 3); ctx.lineTo(c[0] + 7, c[1] - 3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); _fpGlow(c[0], c[1], 22, col, 0.3); }
}

// the plate that appears beside a station in range
function _stPlate() { const W = canvas.width, H = canvas.height; return { x: Math.round(W / 2 - 190), y: Math.round(H / 2 + 74), w: 380, h: 56 }; }
function facilityDrawStationPrompt() {
    const s = _fp && _fp.stationNear; if (!s || (typeof invPanelOpen !== "undefined" && invPanelOpen) || (typeof classPickerOpen !== "undefined" && classPickerOpen) || typeof uiButton !== "function") return;
    const k = STATION_KINDS[s.kind], can = stationCan(s), r = _stPlate(), mine = playerClassId && classAllows(k.classes), col = mine ? classColour(k.classes[0]) : "#6d7fa6";
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    uiButton(r, can.ok ? k.verb : can.done ? k.name + " — DONE" : k.name, col, false, can.ok ? 16 : 15, can.ok ? k.name + "   ·   TAP OR PRESS E" : can.why, !can.ok);
    ctx.restore();
}
// CCTV: every hostile in the facility, marked while a sweep runs: a pulsing diamond on it, an arrow at the screen's edge when it is out of view
function facilityDrawCctv() {
    if (!_fp || !_fp.cctvUntil || _fp.cctvUntil < frame || typeof actors === "undefined") return;
    const W = canvas.width, H = canvas.height, f = frame, fade = Math.min(1, (_fp.cctvUntil - frame) / 90), pul = 0.6 + 0.4 * Math.sin(f * 0.2);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const a of actors) {
        if (!a || a.dead || a.team !== "red") continue;
        const p = _stScreen({ x: a.x, y: a.y }), inside = p.x > 14 && p.x < W - 14 && p.y > 14 && p.y < H - 14;
        ctx.globalAlpha = fade * (0.55 + 0.45 * pul); ctx.fillStyle = "#ff4a3a"; ctx.strokeStyle = "#fff"; ctx.lineWidth = 2;
        if (inside) { const y = p.y - 52; ctx.beginPath(); ctx.moveTo(p.x, y - 9); ctx.lineTo(p.x + 8, y); ctx.lineTo(p.x, y + 9); ctx.lineTo(p.x - 8, y); ctx.closePath(); ctx.fill(); ctx.stroke(); }
        else { const cx = W / 2, cy = H / 2, ang = Math.atan2(p.y - cy, p.x - cx), r = Math.min(W, H) / 2 - 40, ax = cx + Math.cos(ang) * r * (W / H > 1 ? 1.4 : 1), ay = cy + Math.sin(ang) * r; const x = Math.max(24, Math.min(W - 24, ax)), y = Math.max(24, Math.min(H - 24, ay)); ctx.translate(x, y); ctx.rotate(ang); ctx.beginPath(); ctx.moveTo(10, 0); ctx.lineTo(-8, -8); ctx.lineTo(-8, 8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.rotate(-ang); ctx.translate(-x, -y); }
    }
    ctx.restore();
}
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (e && (e.key === "e" || e.key === "E") && typeof facilityPlay !== "undefined" && facilityPlay && _fp && _fp.stationNear && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName || ""))) stationUse(_fp.stationNear); }); } catch (e) { /* no page (the test sandbox) */ }
