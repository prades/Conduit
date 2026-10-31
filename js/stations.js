// ─────────────────────────────────────────────────────────
//  CLASS STATIONS — furniture the player can use (docs/TUTORIAL.md, phase 4)
// ─────────────────────────────────────────────────────────
// A station is a prop in the facility (F.stations in js/facilitymap.js names the prop) with a KIND, a row of STATION_KINDS below. The kind says who may use it, what it costs and what it does. Every class has one in the
// rooms it works in, and each one earns the class a PERK (CLASS_PERKS in js/classes.js) that the rest of the game reads through classStat():
//   the Armory's weapon locker       Gunslinger     the service rifle: shots hit harder and come faster
//   the Security Room's console      Gunslinger     CCTV sweeps: every enemy in the facility is marked for a while (and again after a cooldown)
//   the console in Teleport Room 1   Technomancer   a tuned monitor lamp: it reaches further, and an overcharge lasts longer
//   a test chamber in the lab        Mutator        a sequenced sample: a mutagen sample raises a follower two levels, not one
//   the hallway's charging station   anyone         once its relay is online: refills the gun (and gives a Technomancer a cell)
//   the relays (docs/TUTORIAL.md, phase 5) are stations too: see the electrical network at the end of this file
// A station can be used by walking up and pressing E, by tapping the plate that appears, or by tapping the station (the player walks to it first). Another class's station shows its ring dimmed and refuses, saying who it is for.
//   STATION_KINDS[kind] = { name, verb, classes, perk, once, cost, cooldown, use }

const STATION_KINDS = {
    weapon_locker: { name: "WEAPON LOCKER", verb: "TAKE THE MACHINE GUN", classes: ["gunslinger"], perk: "machinegun", once: true,
        use: () => { invAdd("ammo_pack", 4); return { ok: true, msg: "MACHINE GUN \u2014 IN YOUR TENTACLES: FOUR TIMES THE FIRE", equip: "machinegun" }; } },
    // the armory terminal (js/weapons.js): scrap into ammunition, equip, upgrade and assemble weapons. It needs the Armory's relay online.
    armory_terminal: { name: "ARMORY TERMINAL", verb: "OPEN THE WEAPON BENCH", classes: null, panel: true, needsRelay: "relay_armory" },
    cctv: { name: "SECURITY CONSOLE", verb: "RUN A CCTV SWEEP", classes: ["gunslinger"], perk: "cctv", cooldown: 3600,
        use: () => { _fp.cctvUntil = frame + 1500; return { ok: true, msg: "CCTV SWEEP — ENEMIES MARKED FOR 25 SECONDS" }; } },
    tune_bench: { name: "TUNING CONSOLE", verb: "TUNE YOUR MONITOR LAMP", classes: ["technomancer"], perk: "tuned", once: true,
        use: () => ({ ok: true, msg: "LAMP TUNED — 25% FURTHER, OVERCHARGES LAST 50% LONGER" }) },
    sequencer: { name: "SEQUENCER", verb: "SEQUENCE A MUTAGEN SAMPLE", classes: ["mutator"], perk: "sequenced", once: true, cost: [["mutagen_sample", 1]],
        use: () => ({ ok: true, msg: "SAMPLES SEQUENCED \u2014 A SAMPLE NOW RAISES A FOLLOWER ONE LEVEL MORE" }) },
    // the mech bay (the show room): the Technomancer builds the spider mech here from four legs and a core. A BUILD takes seven seconds at the pad (a progress bar; walk away and it stops, nothing is spent), and the mech is theirs for good.
    mech_bay: { name: "MECH BAY", verb: "BUILD THE SPIDER MECH", classes: ["technomancer"], perk: "mech", once: true, cost: [["mech_leg", 4], ["mech_core", 1]], build: 420,
        use: () => ({ ok: true, msg: "THE SPIDER MECH IS BUILT" }) },
    // the Mutator's LABORATORY (the Experiment Lab's fume hood: js/serum.js): COLLECT the serum it has made, or with none waiting CRAFT one for DNA. Its words and whether it can are the serum's (verbFn, canFn).
    serum_hood: { name: "SERUM HOOD", verb: "COLLECT OR CRAFT SERUM", classes: ["mutator"],
        verbFn: () => typeof serumHoodVerb === "function" ? serumHoodVerb() : "SERUM", canFn: () => typeof serumHoodCan === "function" ? serumHoodCan() : { ok: false, why: "NO LAB" },
        use: () => typeof serumHoodUse === "function" ? serumHoodUse() : { ok: false, why: "NO LAB" } },
    // THE SEWER PURIFICATION QUEST (js/quests.js; docs/SEWER-QUEST.md), for any class: the ANALYSIS BENCH takes the four samples and then sells the module; the BOSS GATE's seal breaks for the module; the PURIFIER MOUNT
    // is a BUILD (the mech bay's kind: the progress bar, walk away and it stops, nothing spent) that takes the module when it is done, and its start wakes the boss (onStart)
    analysis_bench: { name: "ANALYSIS BENCH", classes: null, verbFn: () => typeof questBenchVerb === "function" ? questBenchVerb() : "ANALYSE", canFn: () => typeof questBenchCan === "function" ? questBenchCan() : { ok: false, why: "NO QUEST" },
        use: () => typeof questBenchUse === "function" ? questBenchUse() : { ok: false, why: "NO QUEST" } },
    gate_seal: { name: "BOSS GATE", classes: null, verbFn: () => "BREAK THE SEAL ON THE GATE", canFn: () => typeof questGateCan === "function" ? questGateCan() : { ok: false, why: "NO QUEST" },
        use: () => typeof questGateUse === "function" ? questGateUse() : { ok: false, why: "NO QUEST" } },
    purifier_mount: { name: "PURIFIER MOUNT", classes: null, build: 1200, cost: [["purification_module", 1]], buildMsg: "MOUNTING THE MODULE… STAY AT THE CONSOLE", verbFn: () => typeof questMountVerb === "function" ? questMountVerb() : "INSTALL",
        canFn: () => typeof questMountCan === "function" ? questMountCan() : { ok: false, why: "NO QUEST" }, onStart: () => { if (typeof questMountStart === "function") questMountStart(); },
        use: () => typeof questMountUse === "function" ? questMountUse() : { ok: false, why: "NO QUEST" } },
    relay: { name: "POWER RELAY", classes: null, dynamic: true },
    charger: { name: "CHARGING STATION", classes: null, cooldown: 5400, powered: true,
        use: () => { const was = playerAmmo; playerAmmo = PLAYER_AMMO_MAX; let cell = 0; if (playerClassKey === "technomancer") cell = invAdd("power_cell", 1); _fp.chargerReady = frame + 5400; return { ok: true, msg: "CHARGED \u2014 " + (PLAYER_AMMO_MAX - was) + " ROUNDS" + (cell ? ", +1 POWER CELL" : "") }; } },
};
const STATION_RANGE = 1.8;

function facilityStationsStart(F) {
    if (!_fp || !_fp.items) return;
    _fp.items = _fp.items.filter(i => i.fp !== "station"); _fp.stations = []; _fp.stationGoal = null; _fp.stationNear = null; _fp.cctvUntil = 0; _fp.cctvReadyAt = 0;
    for (const st of (F.stations || [])) {
        const pr = F.solids.find(p => p.id === st.prop), k = STATION_KINDS[st.kind]; if (!pr || !k) continue;
        const s = { id: st.id, kind: st.kind, room: st.room, prop: st.prop, bb: pr.bb.slice(), x: (pr.bb[0] + pr.bb[2]) / 2, y: (pr.bb[1] + pr.bb[3]) / 2 };
        _fp.stations.push(s);
        _fp.items.push({ type: "fp", fp: "station", id: st.id, kind: st.kind, room: st.room, bb: s.bb, x: s.x, y: s.y, depth: s.bb[2] + s.bb[3] - 0.45, base: facilityRoomHeight(st.room, F) * FP_ELEV_PX, seed: _fpHash(Math.round(s.x * 3), Math.round(s.y * 7)) });
    }
    facilityRelaysStart(F);
}
function stationDist(s) { const dx = Math.max(s.bb[0] - player.visualX, 0, player.visualX - s.bb[2]), dy = Math.max(s.bb[1] - player.visualY, 0, player.visualY - s.bb[3]); return Math.hypot(dx, dy); }
function stationNearest() { let best = null, bd = STATION_RANGE; for (const s of (_fp && _fp.stations) || []) { if (STATION_KINDS[s.kind].classes && !playerClassKey) continue; const d = stationDist(s); if (d < bd) { bd = d; best = s; } } return best; }

// can the player use it now? { ok, why }
function stationCan(s) {
    const k = STATION_KINDS[s.kind], now = typeof frame !== "undefined" ? frame : 0;
    if (s.kind === "relay") return relayCan(s);
    if (k.classes && !playerClassKey) return { ok: false, why: "CLASSES COME AFTER THE TUTORIAL" };
    if (k.needsRelay && !relayOnline(k.needsRelay)) return { ok: false, why: "NO POWER \u2014 REPAIR THE ARMORY RELAY" };
    if (k.powered && !facilityFeedOn(s.prop)) return { ok: false, why: "NO POWER \u2014 REPAIR THE HALLWAY RELAY" };
    if (k.powered && _fp.chargerReady > now) return { ok: false, why: "CHARGING \u2014 " + Math.ceil((_fp.chargerReady - now) / 60) + " S" };
    if (!classAllows(k.classes)) return { ok: false, why: "ONLY A " + k.classes.map(className).join(" / ") + " CAN USE THIS" };
    if (k.once && classHas(k.perk)) return { ok: false, why: "ALREADY DONE", done: true };
    if (k.build && _fp.channel && _fp.channel.station === s.id) return { ok: false, why: "BUILDING \u2014 " + Math.min(99, Math.floor((frame - _fp.channel.t0) / _fp.channel.frames * 100)) + "%" };
    if (k.cooldown && _fp.cctvReadyAt > now && s.kind === "cctv") return { ok: false, why: "CAMERAS RESETTING — " + Math.ceil((_fp.cctvReadyAt - now) / 60) + " S" };
    for (const [id, n] of (k.cost || [])) if (!invHas(id, n)) return { ok: false, why: "NEEDS " + n + " " + itemDef(id).name };
    if (typeof k.canFn === "function") { const r = k.canFn(s); if (!r || !r.ok) return r || { ok: false, why: "NOT NOW" }; }   // (a station whose readiness is its own: the serum hood)
    return { ok: true };
}
function stationUse(s) {
    s = s || stationNearest(); if (!s) return { ok: false, why: "NOTHING TO USE HERE" };
    const k = STATION_KINDS[s.kind], can = stationCan(s); if (!can.ok) { invSay(can.why, false); return can; }
    if (stationDist(s) > STATION_RANGE + 0.6) { invSay("TOO FAR AWAY", false); return { ok: false, why: "TOO FAR AWAY" }; }
    if (s.kind === "relay") return relayStart(s);
    if (k.build) return buildStart(s);
    if (k.panel) { if (typeof armoryOpenNow === "function") armoryOpenNow(); return { ok: true, msg: "", panel: true }; }
    for (const [id, n] of (k.cost || [])) invRemove(id, n);
    const r = k.use(s), first = !classHas(k.perk), got = classGrant(k.perk);
    if (r && r.ok === false) { invSay(r.why, false); return r; }   // (a use that turned out not to work says why)
    if (k.cooldown) _fp.cctvReadyAt = frame + k.cooldown;
    if (r.equip && typeof weaponEquip === "function") weaponEquip(r.equip);   // (a weapon taken is a weapon in hand)
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
        if (STATION_KINDS[s.kind].classes && !playerClassKey) continue;   // (a class's station is not there for you until you have a class)
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
    if (STATION_KINDS[it.kind].classes && !playerClassKey) return;   // (no ring: the tutorial has no classes)
    const k = STATION_KINDS[it.kind], rel = it.kind === "relay" ? _fp.relays[it.id] : null, mine = playerClassKey && classAllows(k.classes), done = (k.once && (typeof classOwns === "function" ? classOwns(k.perk) : classHas(k.perk))) || !!(rel && rel.online), live = (mine || !k.classes) && !done, col = done ? (rel ? "#43e0a8" : "#5a6a8a") : !k.classes ? (rel ? "#ffb347" : "#31e8ff") : mine ? classColour(k.classes[0]) : "#4a5675", f = _fpFrame(), pul = 0.6 + 0.4 * Math.sin(f * 0.07 + it.seed), b = it.bb, e = 0.12;
    const pts = [_fpP(b[0] - e, b[1] - e, 0), _fpP(b[2] + e, b[1] - e, 0), _fpP(b[2] + e, b[3] + e, 0), _fpP(b[0] - e, b[3] + e, 0)];
    ctx.save(); ctx.lineJoin = "round"; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath();
    ctx.globalAlpha = (live ? 0.35 : 0.2) * (live ? pul : 1); ctx.fillStyle = col; ctx.fill(); ctx.globalAlpha = live ? 0.55 + 0.4 * pul : 0.5; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.stroke(); ctx.restore();
    if (live) { const c = _fpP(it.x, it.y, 74 + Math.sin(f * 0.08 + it.seed) * 3); ctx.save(); ctx.fillStyle = col; ctx.strokeStyle = FP_PAL.ink; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(c[0], c[1] + 8); ctx.lineTo(c[0] - 7, c[1] - 3); ctx.lineTo(c[0] + 7, c[1] - 3); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore(); _fpGlow(c[0], c[1], 22, col, 0.3); }
}

// the plate that appears beside a station in range
function _stPlate() { const W = canvas.width, H = canvas.height; return { x: Math.round(W / 2 - 190), y: Math.round(H / 2 + 74), w: 380, h: 56 }; }
function facilityDrawStationPrompt() {
    const s = _fp && _fp.stationNear; if (!s || (typeof invPanelOpen !== "undefined" && invPanelOpen) || (typeof classPickerOpen !== "undefined" && classPickerOpen) || typeof uiButton !== "function") return;
    const k = STATION_KINDS[s.kind], can = stationCan(s), r = _stPlate(), mine = playerClassKey && classAllows(k.classes), col = !k.classes ? (s.kind === "relay" ? "#ffb347" : "#31e8ff") : mine ? classColour(k.classes[0]) : "#6d7fa6";
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const nm = s.kind === "relay" ? _relayName(s) : k.name, verb = s.kind === "relay" ? relayVerb(s, can) : typeof k.verbFn === "function" ? k.verbFn(s) : k.verb;
    uiButton(r, can.ok ? verb : can.done ? nm + " \u2014 DONE" : nm, col, false, can.ok ? 16 : 15, can.ok ? nm + "   \u00b7   TAP OR PRESS E" : can.why, !can.ok);
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
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => { if (e && !e.repeat && (e.key === "e" || e.key === "E") && typeof facilityPlay !== "undefined" && facilityPlay && _fp && _fp.stationNear && !(e.target && /INPUT|TEXTAREA/.test(e.target.tagName || ""))) stationUse(_fp.stationNear); }); } catch (e) { /* no page (the test sandbox) */ }

// ─────────────────────────────────────────────────────────
//  THE ELECTRICAL NETWORK (docs/TUTORIAL.md, phase 5)
// ─────────────────────────────────────────────────────────
// F.relays (js/facilitymap.js) are relay boxes, every one broken at the start. A relay is a station: the player repairs it by standing at it (press E or tap), which runs a REPAIR for a few seconds with a progress bar over the box.
// What a repair needs is a rule, CLASS_RULES.relay (js/classes.js), not an accident:
//   a class with the `repair` skill (the Technomancer)   one power cell, a short repair, and it STARTS BY ITSELF when they stand at a broken relay with a cell and keep still (the rule's `auto`)
//   anyone else                                         a RELAY KIT (a tool they find in the Crystal Chamber) and two power cells, a long repair: the kit is their way past the Technomancer's skill, by design
// A repair that is left (the player walks off) stops; the cost is paid when it completes. When a relay comes online: the rooms it `powers` have power (the blackout lifts there: lights, door pools), what it `feeds`
// (a sentry, the charging station) works, the relay box shows green, a ring of light spreads from it and the screen says so.
function _relayDef(id) { return _fp.F.relays.find(r => r.id === id) || null; }
function _relayName(s) { const d = _relayDef(s.relay); return d ? d.name : "RELAY"; }
function facilityRelaysStart(F) {
    _fp.relays = {}; _fp.channel = null; _fp.surge = null; _fp.chargerReady = 0;
    for (const r of (F.relays || [])) {
        const pr = F.solids.find(p => p.id === r.prop); if (!pr) continue; _fp.relays[r.id] = { id: r.id, online: false };
        const s = { id: r.id, kind: "relay", relay: r.id, room: r.room, prop: r.prop, bb: pr.bb.slice(), x: (pr.bb[0] + pr.bb[2]) / 2, y: (pr.bb[1] + pr.bb[3]) / 2 };
        _fp.stations.push(s); _fp.items.push({ type: "fp", fp: "station", id: r.id, kind: "relay", room: r.room, bb: s.bb, x: s.x, y: s.y, depth: s.bb[2] + s.bb[3] - 0.45, base: facilityRoomHeight(r.room, F) * FP_ELEV_PX, seed: _fpHash(Math.round(s.x * 3), Math.round(s.y * 7)) });
    }
    for (const it of _fp.items) if (it.fp === "prop" && it.kind === "sentry") { it.cd = 0; it.aim = 0; }
}
function relayOnline(id) { return !!(_fp && _fp.relays && _fp.relays[id] && _fp.relays[id].online); }
// is a prop that a relay feeds (a sentry, the charging station) working? it is when its relay is online, or once the blackout is over
function facilityFeedOn(propId) {
    if (typeof facilityBlackout === "function" && !facilityBlackout()) return true;
    for (const r of (_fp.F.relays || [])) if (r.feeds.includes(propId)) return relayOnline(r.id);
    return false;
}
// what a repair would take for this player: { ok, mode, cost, frames } or { ok: false, why }
function relayPlan() {
    const R = CLASS_RULES.relay, cls = playerClass();   // (no class, as in the tutorial: the kit and two cells, like every class without the skill)
    let plan;
    if (cls && cls.skills.includes(R.skill)) plan = { mode: "skill", cost: [["power_cell", R.skillCells]], frames: R.skillFrames };
    else if (invHas(R.kit)) plan = { mode: "kit", cost: [["power_cell", R.kitCells]], frames: R.kitFrames };
    else return { ok: false, why: "NEEDS A RELAY KIT (OR A TECHNOMANCER)" };
    for (const [id, n] of plan.cost) if (!invHas(id, n)) return { ok: false, why: "NEEDS " + n + " " + itemDef(id).name + (n > 1 ? "S" : ""), plan };
    plan.ok = true; return plan;
}
function relayCan(s) {
    const r = _fp.relays[s.relay]; if (!r) return { ok: false, why: "NOT A RELAY" };
    if (r.online) return { ok: false, why: "RELAY ONLINE", done: true };
    if (_fp.channel && _fp.channel.relay === s.relay) return { ok: false, why: "REPAIRING — " + Math.min(99, Math.floor((frame - _fp.channel.t0) / _fp.channel.frames * 100)) + "%" };
    const p = relayPlan(); return p.ok ? { ok: true, plan: p } : p;
}
function relayVerb(s, can) { const p = can.plan || relayPlan(); if (!p.cost) return "REPAIR THE RELAY"; return p.mode === "skill" ? "REPAIR THE RELAY — " + p.cost[0][1] + " POWER CELL" : "SPLICE THE RELAY — " + p.cost[0][1] + " POWER CELLS"; }
function relayStart(s) {
    const can = relayCan(s); if (!can.ok) { invSay(can.why, false); return can; }
    _fp.channel = { relay: s.relay, t0: frame, frames: can.plan.frames, cost: can.plan.cost, mode: can.plan.mode, x: s.x, y: s.y, bb: s.bb };
    invSay(can.plan.mode === "skill" ? "REPAIRING THE RELAY…" : "SPLICING THE RELAY WITH THE KIT… STAY AT IT", true);
    return { ok: true, msg: "REPAIR STARTED", channel: true };
}
function relayComplete(c) {
    const R = _fp.relays[c.relay], d = _relayDef(c.relay); _fp.channel = null;
    for (const [id, n] of c.cost) if (!invHas(id, n)) { invSay("YOU NO LONGER HAVE THE PARTS", false); return false; }
    for (const [id, n] of c.cost) invRemove(id, n);
    R.online = true; for (const room of d.powers) facilityPower(room, true);
    _fp.surge = { x: c.x, y: c.y, t0: frame, rooms: d.powers.slice() };
    if (typeof facilityNeedsEnter === "function") facilityNeedsEnter(c.relay);   // what waited for this relay arrives (the computer lab's fuel cells)
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 140, text: "◈ POWER RESTORED — " + d.name, color: "#9dffb6", life: 260, vy: -0.05, size: 16 });
    return true;
}
// each frame: a repair runs (and stops if the player leaves), a Technomancer's repair starts by itself, the sentries fire
function facilityRelayTick() {
    if (!_fp || !_fp.relays) return;
    const c = _fp.channel;
    if (c) {
        const near = Math.hypot(Math.max(c.bb[0] - player.visualX, 0, player.visualX - c.bb[2]), Math.max(c.bb[1] - player.visualY, 0, player.visualY - c.bb[3]));
        if (near > STATION_RANGE + 0.6) { _fp.channel = null; invSay(c.station ? "BUILD INTERRUPTED" : "REPAIR INTERRUPTED", false); }
        else if (frame - c.t0 >= c.frames) { if (c.station) buildComplete(c); else relayComplete(c); }
    } else if (playerClassKey && CLASS_RULES.relay.auto.includes(playerClassKey) && (!player.fpPath || !player.fpPath.length)) {
        const s = _fp.stationNear; if (s && s.kind === "relay" && relayCan(s).ok) relayStart(s);
    }
    facilitySentryTick();
}
// a sentry works while its relay feeds it: it fires at the nearest enemy within range
const SENTRY_RANGE = 9, SENTRY_CD = 50, SENTRY_DAMAGE = 8;
function facilitySentryTick() {
    for (const it of _fp.items) {
        if (it.fp !== "prop" || it.kind !== "sentry") continue;
        it.on = facilityFeedOn(it.id); if (it.flash > 0) it.flash--; if (!it.on) continue;
        if (it.cd > 0) { it.cd--; continue; }
        let best = null, bd = SENTRY_RANGE; for (const a of actors) { if (!a || a.dead || a.team !== "red") continue; const d = Math.hypot(a.x - it.x, a.y - it.y); if (d < bd) { bd = d; best = a; } }
        if (!best) continue;
        it.aim = Math.atan2(best.y - it.y, best.x - it.x); it.cd = SENTRY_CD; it.flash = 6;
        if (typeof spawnFollowerProjectile === "function") spawnFollowerProjectile({ x: it.x, y: it.y, element: "electric" }, best, "#7ff2ff", SENTRY_DAMAGE, 5, null);
    }
}
// over the scene: the progress bar of a repair, the ring of light from a relay that has just come online
function facilityDrawRelays() {
    if (!_fp || !_fp.relays) return;
    const c = _fp.channel, W = canvas.width, H = canvas.height;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    if (c) { const p = _stScreen({ x: c.x, y: c.y }), k = Math.min(1, (frame - c.t0) / c.frames), w = 90, x = p.x - w / 2, y = p.y - 66; ctx.fillStyle = "rgba(5,7,15,0.85)"; ctx.fillRect(x - 3, y - 3, w + 6, 14); ctx.fillStyle = c.station ? "#ffe733" : c.mode === "skill" ? "#31e8ff" : "#ffb347"; ctx.fillRect(x, y, w * k, 8); ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.5; ctx.strokeRect(x - 3, y - 3, w + 6, 14); }
    const g = _fp.surge;
    if (g) {
        const t = (frame - g.t0) / 90;
        if (t > 1) _fp.surge = null;
        else {
            const p = _stScreen({ x: g.x, y: g.y }), R = 40 + 520 * t, a = 1 - t;
            ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.translate(p.x, p.y + 18); ctx.scale(1, TILE_H / TILE_W);
            ctx.strokeStyle = "rgba(157,255,182," + (0.55 * a).toFixed(3) + ")"; ctx.lineWidth = 10 * a + 2; ctx.beginPath(); ctx.arc(0, 0, R, 0, 6.2832); ctx.stroke();
            ctx.strokeStyle = "rgba(49,232,255," + (0.35 * a).toFixed(3) + ")"; ctx.lineWidth = 4; ctx.beginPath(); ctx.arc(0, 0, R * 0.72, 0, 6.2832); ctx.stroke(); ctx.restore();
            ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "rgba(190,255,210," + (0.2 * a * a).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H);   // a flash of the lights coming on
        }
    }
    ctx.restore();
}

// THE BUILD (the mech bay): the cost is checked when it starts and paid when it is done
function buildStart(s) {
    const can = stationCan(s); if (!can.ok) { invSay(can.why, false); return can; }
    const k = STATION_KINDS[s.kind]; if (_fp.channel) return { ok: false, why: "BUSY" };
    _fp.channel = { station: s.id, kind: s.kind, t0: frame, frames: k.build, cost: k.cost, x: s.x, y: s.y, bb: s.bb };
    invSay(k.buildMsg || "BUILDING THE SPIDER MECH\u2026 STAY AT THE PAD", true);
    if (typeof k.onStart === "function") k.onStart(s);   // (the purifier mount: the install begins, and the boss is woken: js/quests.js)
    return { ok: true, msg: "BUILD STARTED", channel: true };
}
function buildComplete(c) {
    _fp.channel = null; const s = _fp.stations.find(q => q.id === c.station), k = STATION_KINDS[c.kind];
    for (const [id, n] of c.cost) if (!invHas(id, n)) { invSay("YOU NO LONGER HAVE THE PARTS", false); return false; }
    for (const [id, n] of c.cost) invRemove(id, n);
    const r = k.use(s), got = classGrant(k.perk); _fp.surge = { x: c.x, y: c.y, t0: frame, rooms: [] };
    invSay(r.msg + (got ? "   \u25b2 RANK " + classRank() : ""), true);
    return true;
}
