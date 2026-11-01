// ─────────────────────────────────────────────────────────
//  THE ANT RAIDS, AND THE TURRETS THEY WRECK (the owner's playtest answers, 2026-11-01; docs/FACILITY.md "Raids and turrets")
// ─────────────────────────────────────────────────────────
// ASKED, playtesting the ants-only arena: "The ants need to invade and go for the crystal and the turrets"; and on the turrets: "Buildable turrets were removed now the facility has permanent turrets that are
// already located on the map. There's about three of them. Now they become destructible but repairable." The owner's answers, asked the same day: RAIDS ON A TIMER, every THREE MINUTES, THREE ants; they go for
// the TURRETS FIRST, then the Crystal; the turrets STURDY; a broken one is repaired by standing at it for TEN SECONDS, FREE; the raids start ONCE THE SEWERS ARE FOUND; JUST THE ALARM, no warning; and while you
// are away they ATTACK ANYWAY (the turrets and the followers posted in the rooms defend).
//   A RAID         RAID.size ants of the arena (the arena's own first, the rest up out of its overflow grates: js/facilityspawn.js) march on the main building: a.raid is set, they HUNT (js/predator.js), alarmed
//                  as if an alarm were up for them alone (predatorAlarm), so a fight on the way does not turn them back; the alarm triangle shows while one lives (js/game.js) and the Crystal does not refill.
//                  (The facility's own alarm, js/alarm.js, is not raised: it would rouse every creature, the Sewers' brood too, and its end calms them all.)
//   THE GOAL       the nearest turret still standing, then the next, then the Crystal (raidGoal). They bite a turret as they bite the Crystal (js/predator.js bite).
//   THE CLOCK      the first raid RAID.every frames after the Sewers are found (js/quests.js discoveredAt), then every RAID.every; a load starts the clock again (PROVISIONAL: the clock is not saved).
//   THE TURRETS    the three automatic sentries of the map (two in the Crystal Chamber, one in the Main Hallway: js/facilitymap.js kind "sentry"); they fire at the nearest creature in range while the
//                  Crystal has power (js/stations.js facilitySentryTick, js/crystalpower.js: each shot is paid from it), each with SENTRY.hp: a raid's bites wear it down and at 0 it is BROKEN: it
//                  stops, smokes, and a REPAIR station is on it (stand there SENTRY.repair frames, nothing paid: STATION_KINDS.sentry_repair, a build). The damage is saved (js/facilitysave.js).
// SENTRY.hp is PROVISIONAL (the owner's "Sturdy": "a raid of 3 needs a good while to wreck one; it's often still shooting when you arrive"). MEASURED (2026-11-01, the real loop, nobody defending, you away
// in the Sewers; fourteen raids, eight random and six built around tanks): the six without a tank were killed by the hallway turret alone, which lost 6 to 158 of its 500; of the eight with a tank, six wrecked
// it (after 35 to 45 s of biting) and two left it at 55, and the Crystal Chamber's two finished what was left, two tanks and a striker too. The Crystal was not bitten in any. Unrepaired, a turret falls within a few raids.
const RAID = { every: 10800, size: 3, label: "ANT RAID" };
const SENTRY = { hp: 500, repair: 600 };

function _rdFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _rdSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: col || "#ff2200", life: 180, vy: -0.25, size: 16 }); }

// ── THE TURRETS ──
function sentryItems() { return (typeof _fp !== "undefined" && _fp && _fp.items || []).filter(i => i.fp === "prop" && i.kind === "sentry"); }
function sentryName(it) { const r = it && typeof FP_ROOM_TAG !== "undefined" ? FP_ROOM_TAG[it.room] : null; return ((r || "THE") + " TURRET").toUpperCase(); }
// a fresh facility: every turret whole (js/stations.js facilityRelaysStart)
function sentriesStart() { for (const it of sentryItems()) { it.sentry = true; it.maxHp = SENTRY.hp; it.hp = SENTRY.hp; it.broken = false; } if (typeof _fp !== "undefined" && _fp && _fp.stations) _fp.stations = _fp.stations.filter(s => s.kind !== "sentry_repair"); if (typeof _fp !== "undefined" && _fp && _fp.items) _fp.items = _fp.items.filter(i => !(i.fp === "station" && i.kind === "sentry_repair")); }
// does it fire? whole, and the Crystal has power for it (in the tutorial: always)
function sentryOn(it) { if (!it || it.broken) return false; return typeof crystalPowerOn === "function" && crystalPowerOn() ? crystalCanDraw() : true; }
// a bite (js/predator.js bite): its hp worn down; at 0 it breaks
function sentryDamage(it, n, by) {
    if (!it || it.broken || !(n > 0)) return false;
    if (!Number.isFinite(it.hp)) { it.maxHp = SENTRY.hp; it.hp = SENTRY.hp; }
    it.hp = Math.max(0, it.hp - n); it.hitAt = _rdFrame();
    if (it.hp <= 0) sentryBreak(it);
    return true;
}
function _sentryStationId(it) { return "st_repair_" + it.id; }
function sentryBreak(it, quiet) {
    it.broken = true; it.hp = 0;
    if (typeof _fp === "undefined" || !_fp || !_fp.stations) return;
    const id = _sentryStationId(it); if (_fp.stations.some(s => s.id === id)) return;
    const bb = [it.x - 0.6, it.y - 0.6, it.x + 0.6, it.y + 0.6], st = { id, kind: "sentry_repair", room: it.room, prop: it.id, bb, x: it.x, y: it.y, sentry: it.id };
    _fp.stations.push(st);
    _fp.items.push({ type: "fp", fp: "station", id, kind: "sentry_repair", room: it.room, bb: bb.slice(), x: it.x, y: it.y, depth: bb[2] + bb[3] - 0.45, base: it.base || 0, seed: 1 });
    if (!quiet) { _rdSay("◈ " + sentryName(it) + " IS WRECKED — STAND BY IT TO REPAIR IT", "#ffb347"); if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: it.x, y: it.y, color: "#ffb347", radius: 1.6, life: 36 }); }
}
function sentryRepairCan(s) { const it = s && sentryItems().find(i => i.id === s.sentry); return it && it.broken ? { ok: true } : { ok: false, why: "THE TURRET IS WHOLE" }; }
// the repair's build done (js/stations.js buildComplete): whole again, the station gone
function sentryRepairDone(s) {
    const it = s && sentryItems().find(i => i.id === s.sentry); if (!it) return { ok: false, why: "NO TURRET HERE" };
    it.broken = false; it.hp = it.maxHp || SENTRY.hp; it.cd = 0;
    _fp.stations = _fp.stations.filter(q => q.id !== s.id); _fp.items = _fp.items.filter(i => !(i.fp === "station" && i.id === s.id));
    return { ok: true, msg: sentryName(it) + " IS REPAIRED" };
}
// the save: the damaged turrets' hp, by id (a whole one is not written)
function sentrySnapshot() { const o = {}; for (const it of sentryItems()) if (Number.isFinite(it.hp) && it.hp < (it.maxHp || SENTRY.hp)) o[it.id] = Math.max(0, Math.round(it.hp)); return o; }
function sentryApply(d) {
    sentriesStart(); if (!d || typeof d !== "object") return;
    for (const it of sentryItems()) if (Number.isFinite(d[it.id])) { it.hp = Math.max(0, Math.min(it.maxHp, d[it.id])); if (it.hp <= 0) sentryBreak(it, true); }
}

// ── THE RAIDS ──
function _raidState() { if (typeof _fp === "undefined" || !_fp) return null; return _fp.raid || (_fp.raid = { nextAt: null, n: 0 }); }
function raidRaiders() { return (typeof actors !== "undefined" ? actors : []).filter(a => a && a.raid && !a.dead && a.team === "red"); }
// a raid on? (the alarm triangle shows, the Crystal does not refill: js/game.js, js/crystalpower.js)
function raidActive() { return raidRaiders().length > 0; }
// may raids come yet? once the Sewers are found (the owner's answer)
function raidsOn() { const Q = typeof questState === "function" ? questState("purify") : null; return !!(Q && Q.discoveredAt); }
// each frame (js/facilitytutorial.js facilityTutorialTick): the clock, a raid's start, and the raiders kept on their march
function raidTick() {
    const R = _raidState(); if (!R) return;
    const f = _rdFrame();
    for (const a of raidRaiders()) if (a.state !== "attack" && a.state !== "hunt") { a.state = "hunt"; a.provoked = true; }   // (after a fight on the way, back on the march)
    if (!raidsOn()) { R.nextAt = null; return; }
    if (R.nextAt === null) { R.nextAt = f + RAID.every; return; }
    if (f >= R.nextAt) { R.nextAt = f + RAID.every; raidStart(); }
}
// a raid now: RAID.size ants of the arena march on the building (the arena's own wanderers first, the rest up out of its grates); returns them
function raidStart() {
    const R = _raidState(); if (!R || typeof facilityCreatures !== "function") return [];
    R.n++;
    const room = typeof FP_SPAWN !== "undefined" ? FP_SPAWN.room : "arena";
    const pick = facilityCreatures(room).filter(a => !a.raid && !a.bossId && !a.isClone && a.state !== "attack").slice(0, RAID.size);
    while (pick.length < RAID.size && typeof facilitySpawnCreature === "function") { const a = facilitySpawnCreature(null, null, FP_SPAWN); if (!a) break; pick.push(a); }
    for (const a of pick) { a.raid = R.n; a.state = "hunt"; a.provoked = true; a.lastAttacker = null; a._raidGoal = null; a.spawnProtection = 0; }
    if (pick.length) _rdSay("⚠ " + RAID.label + " ⚠ — " + pick.length + " ANTS OUT OF THE ARENA");
    return pick;
}
// where a raider goes: the nearest turret still standing, then the Crystal (js/predator.js, its hunt)
function raidGoal(a) {
    if (!a || !a.raid) return null;
    let best = null, bd = Infinity;
    for (const it of sentryItems()) { if (it.broken) continue; const d = Math.hypot(it.x - a.x, it.y - a.y); if (d < bd) { bd = d; best = it; } }
    return best || (typeof crystal !== "undefined" ? crystal : null);
}
// how near it stands to bite its goal, and the floor it walks to (a turret is a solid prop: the cell beside it on the raider's side)
function raidReach(goal) { return goal && goal.sentry ? 1.3 : 0.8; }
function raidSteerAt(a, goal) {
    if (!goal || !goal.sentry) return goal;
    const k = goal.id + ":" + Math.round(a.x) + "," + Math.round(a.y);
    if (a._raidAt && a._raidAt.k === k) return a._raidAt;
    const d = Math.hypot(a.x - goal.x, a.y - goal.y) || 1, c = typeof _fpNearestCell === "function" ? _fpNearestCell(goal.x + (a.x - goal.x) / d * 1.0, goal.y + (a.y - goal.y) / d * 1.0) : null;
    a._raidAt = { k, x: c ? c[0] : goal.x, y: c ? c[1] : goal.y };
    return a._raidAt;
}

// ── THE DRAWING (js/propsprites.js and js/facilitystyleall.js call it after the sentry, at its head on screen): a bar over a hurt turret, smoke and sparks over a wrecked one ──
function drawSentryWear(it, hx, hy) {
    if (!it || typeof ctx === "undefined" || !Number.isFinite(it.hp)) return;
    const max = it.maxHp || SENTRY.hp, f = _rdFrame();
    if (it.broken) {
        for (let i = 0; i < 3; i++) {   // smoke rising off the head
            const t = ((f * 0.6 + i * 37) % 90) / 90, x = hx + Math.sin((f + i * 50) * 0.03) * 5 + (i - 1) * 4, y = hy - 6 - t * 26;
            ctx.fillStyle = "rgba(40,40,46," + (0.42 * (1 - t)).toFixed(3) + ")"; ctx.beginPath(); ctx.arc(x, y, 4 + t * 7, 0, 6.2832); ctx.fill();
        }
        if ((f + (it.x | 0) * 7) % 47 < 3) { ctx.fillStyle = "#ffd36b"; ctx.fillRect(hx - 1 + ((f * 13) % 9) - 4, hy - 2 - ((f * 7) % 6), 2, 2); }   // a spark
        return;
    }
    if (it.hp >= max) return;
    const w = 30, h = 4, k = Math.max(0, Math.min(1, it.hp / max)), x = hx - w / 2, y = hy - 20;
    ctx.fillStyle = "rgba(6,8,14,0.8)"; ctx.fillRect(x - 1, y - 1, w + 2, h + 2);
    ctx.fillStyle = k > 0.5 ? "#5fe0c8" : k > 0.25 ? "#ffd34d" : "#ff6a4a"; ctx.fillRect(x, y, w * k, h);
}
