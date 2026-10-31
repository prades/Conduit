// ─────────────────────────────────────────────────────────
//  SIDE QUEST: the drone in the Sewers' side passage (docs/SEWER-QUEST.md, "Side Quest and the Sleeping Potion")
// ─────────────────────────────────────────────────────────
// ASKED (the Game Design Archive, 2026-10-31): "Side Quest is a small flying robot drone and nomadic outlander who has left the facility and no longer wants to be part of it. He serves as an optional side-quest giver,
// merchant, technician, and source of hints [...] Position Side Quest in a safe side passage or maintenance platform roughly halfway along the route toward the sewer boss/dam blockage [...] he appears only after the
// required samples have been collected and returned to the Experiment Lab, including the provisional Toxic Ant sample target [about 10] [...] Suggested opening: 'Oh no, it's clogging everything. Look, please, there has
// to be a way to fix this without killing it.' [...] He asks the player to promise not to destroy the Queen and to give him a chance to solve the problem. He hints that a creature like this is worth understanding
// [...] The promise should frame a moral choice, not silently invalidate the quest if the player later defeats the Queen [...] Side Quest does not tell the player to reverse-engineer his sleeping potion." And the
// user (2026-10-31): his post-encounter dialogue, whether the player spares or kills the queen, is the placeholder "…" for now.
//   WHERE          the side passage off the Sewers' south ledge (js/facilitymap.js: x 600 to 640, three tiles deep, behind the gate `sewer_gate_s1`, "an area for later"): halfway along the south ledge between the bridge
//                  and the boss gate, out of the queen's reach (she roams within 12 tiles of the cistern's console: js/bosses.js) and out of the brood's spawns (js/facilityspawn.js keeps them 3 tiles off him). When
//                  he appears the gate opens (facilitySolidOpen: he is a technician) and he hovers at the passage's end, with a STATION on him (js/stations.js STATION_KINDS.sidequest, made here, not a prop of the map):
//                  the plate, E, a tap, as any station.
//   WHEN           sqUnlocked: the samples turned in at the lab AND QUEST_PURIFY.antTarget toxic ants of the Sewers killed (js/quests.js antKills). Not location, not the samples alone, not the count alone.
//   THE TALK       four lines, one a press (the archive's opening verbatim, then his name and the Queen blocking the system, his idea that she only needs to be moved, and the PROMISE he asks for), then a choice of two
//                  buttons: I PROMISE or NO PROMISES (sqChoose: recorded in `promised`, 1 or −1; it changes nothing of the quest line, and killing her later invalidates nothing: the archive). Either way he sells
//                  the potion after. Come back and he gives the hint. Once the queen's fate is decided (the quest line's bossResolvedAt), everything he says is "…" (SIDEQUEST.lines.after), and he still sells.
//   THE SHOP       one thing: the SLEEPING POTION (js/potion.js potionBuy: ◆100, ◆50 the next once it has put the queen to sleep). His "gadgets and gizmos" and his later role are open (the archive).
//   SAVED          `sidequest` (js/facilitysave.js): that he appeared, how far the talk got, the promise, that he called you over. A load opens the gate again and puts him back.
//   PROVISIONAL    the passage as his spot, his look (a small black saucer with chasing rim lights on four tiny legs, drawn here: the saucer design family, design/evolutions/forms26.js Nos. 661-683, is the candidate
//                  for a proper sheet once a piece of it is approved, docs/ART-PROCESS.md), and every line but the archive's opening (its wording "can be polished during implementation").
const SIDEQUEST = {
    id: "sidequest", name: "SIDE QUEST", room: "sewers", gate: "sewer_gate_s1", into: 2, col: "#9fd8ff",
    callNear: 8,   // tiles: the first time you come this near, he calls you over (once)
    lines: {
        call: "PSST. OVER HERE, IN THE SIDE PASSAGE.",
        talk: [
            "OH NO, IT'S CLOGGING EVERYTHING. LOOK, PLEASE, THERE HAS TO BE A WAY TO FIX THIS WITHOUT KILLING IT.",
            "I'M SIDE QUEST. I LEFT THE FACILITY; I DON'T WORK FOR IT ANY MORE. BUT THAT QUEEN IS BLOCKING THE WHOLE SYSTEM, AND THE SYSTEM IS ALL OF US.",
            "I THINK THERE'S ANOTHER WAY. SHE ONLY NEEDS TO BE MOVED, SO THE PURIFIER CAN GO IN. HELP ME FIND IT?",
            "PROMISE ME YOU WON'T DESTROY HER. GIVE ME A CHANCE TO SOLVE THIS. A CREATURE LIKE THAT IS WORTH UNDERSTANDING.",
        ],
        promised: "THANK YOU. I SELL A SLEEPING POTION: THROW IT AND SHE SLEEPS A FEW SECONDS. GET HER TO MOVE, THEN DO YOUR WORK.",
        declined: "…FINE. I'LL STILL SELL YOU THE POTION. GET HER TO MOVE. THAT'S ALL I ASK.",
        hint: "SHE SITS ROOTED AT THE CONSOLE. ASLEEP SHE LETS GO OF IT FOR A MOMENT; HURT ENOUGH, SHE PANICS AND ROAMS. LURE HER OFF, THEN WORK.",
        after: "…",   // (the user, 2026-10-31: after the queen's fate is decided, spared or killed, this and nothing else, for now)
    },
    replyFrames: 480,   // how long his answer to the promise stays before the hint takes its place
};
let _SQ_BTN = [];   // the two choice buttons, while they are shown (sqDrawOverlay sets them; sqTap reads them)
function _sqFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _sqNow() { return typeof techClock === "number" ? techClock : _sqFrame(); }
function sqState() {
    if (typeof _fp === "undefined" || !_fp) return null;
    if (!_fp.sidequest) _fp.sidequest = { appearedAt: 0, talk: 0, promised: 0, promisedAt: 0, calledAt: 0, metAt: 0, replyUntil: 0 };
    return _fp.sidequest;
}
function sqReset() {
    if (typeof _fp !== "undefined" && _fp) { _fp.sidequest = null; _fp._sqSpot = null; if (_fp.items) _fp.items = _fp.items.filter(i => !(i.fp === "sidequest" || (i.fp === "station" && i.id === "st_sidequest"))); if (_fp.stations) _fp.stations = _fp.stations.filter(s => s.id !== "st_sidequest"); }   // (a load from before he appeared: nobody there)
    _SQ_BTN = [];
}
function _sqQuest() { return typeof questState === "function" ? questState("purify") : null; }
// may he appear? the lab turn-in done AND about ten toxic ants killed (js/quests.js)
function sqUnlocked() { const Q = _sqQuest(); return !!Q && Q.turnedInAt > 0 && (Q.antKills || 0) >= (typeof QUEST_PURIFY !== "undefined" ? QUEST_PURIFY.antTarget : 10); }
function sqPresent() { const S = sqState(); return !!(S && S.appearedAt); }
// the queen's fate is decided (spared or killed): his line is the placeholder
function sqAfter() { const Q = _sqQuest(); return !!(Q && Q.bossResolvedAt > 0); }
// his spot: two tiles into the passage from the gate's line (the passage is south of the gate), on floor, once the gate is open
function sqSpot() {
    if (typeof _fp === "undefined" || !_fp || !_fp.F) return null;
    if (_fp._sqSpot) return _fp._sqSpot;
    const g = _fp.F.solids.find(q => q.id === SIDEQUEST.gate); if (!g || !g.bb || typeof facilitySolidIsOpen !== "function" || !facilitySolidIsOpen(SIDEQUEST.gate)) return null;
    const cx = (g.bb[0] + g.bb[2]) / 2, cy = (g.bb[1] + g.bb[3]) / 2, c = typeof _fpNearestCell === "function" ? _fpNearestCell(cx, cy + SIDEQUEST.into) : null; if (!c) return null;
    return (_fp._sqSpot = [c[0], c[1]]);
}
function _sqStation() { return typeof _fp !== "undefined" && _fp && _fp.stations ? _fp.stations.find(s => s.id === "st_sidequest") || null : null; }
// he appears (or is put back by a load): the gate opens, he hovers at the passage's end, his station is on him
function sqPlace(announce) {
    const S = sqState(); if (!S || typeof _fp === "undefined" || !_fp || !_fp.items || !_fp.stations) return false;
    if (typeof facilitySolidOpen === "function") facilitySolidOpen(SIDEQUEST.gate);
    _fp._sqSpot = null; const at = sqSpot(); if (!at) return false;
    const x = at[0], y = at[1], room = SIDEQUEST.room, base = typeof facilityRoomHeight === "function" ? facilityRoomHeight(room, _fp.F) * FP_ELEV_PX : 0, seed = typeof _fpHash === "function" ? _fpHash(Math.round(x * 3), Math.round(y * 7)) : 1;
    _fp.items = _fp.items.filter(i => !(i.fp === "sidequest" || (i.fp === "station" && i.id === "st_sidequest"))); _fp.stations = _fp.stations.filter(s => s.id !== "st_sidequest");
    const bb = [x - 0.45, y - 0.45, x + 0.45, y + 0.45], st = { id: "st_sidequest", kind: "sidequest", room, prop: null, bb, x, y };
    _fp.stations.push(st);
    _fp.items.push({ type: "fp", fp: "station", id: st.id, kind: st.kind, room, bb: bb.slice(), x, y, depth: bb[2] + bb[3] - 0.45, base, seed });
    _fp.items.push({ type: "fp", fp: "sidequest", id: "sidequest", room, x, y, depth: x + y + 0.02, base, seed });
    if (!S.appearedAt) S.appearedAt = Math.max(1, _sqNow());
    if (announce && typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 105, text: "◈ SOMETHING HAS OPENED THE SIDE PASSAGE OFF THE SEWERS' SOUTH LEDGE", color: SIDEQUEST.col, life: 300, vy: -0.04, size: 14 });
    return true;
}
// each frame (js/facilitytutorial.js facilityTutorialTick): he appears when he may; he is put back if the stations were rebuilt; he calls you over the first time you come near
function sqTick() {
    const S = sqState(); if (!S) return;
    if (!S.appearedAt) { if (sqUnlocked()) sqPlace(true); return; }
    if (!_sqStation()) sqPlace(false);
    if (!S.calledAt && typeof player !== "undefined" && typeof partyRoomAt === "function" && partyRoomAt(player.x, player.y) === SIDEQUEST.room) {
        const p = sqSpot(); if (p && Math.hypot(p[0] - player.x, p[1] - player.y) <= SIDEQUEST.callNear) { S.calledAt = Math.max(1, _sqNow()); if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 105, text: "A DRONE, FROM THE SIDE PASSAGE: “" + SIDEQUEST.lines.call + "”", color: SIDEQUEST.col, life: 300, vy: -0.04, size: 14 }); }
    }
}
// ── the talk, through his station (js/stations.js STATION_KINDS.sidequest) ──
function sqChoosing() { const S = sqState(); return !!S && S.talk >= SIDEQUEST.lines.talk.length && S.promised === 0 && !sqAfter(); }
function sqTalking() { const S = sqState(); return !!S && S.talk > 0 && S.talk < SIDEQUEST.lines.talk.length && !sqAfter(); }
// what he is saying now: the placeholder once the queen's fate is decided; his call before the first talk; the talk's line; his answer to the promise for a while; then the hint
function sqSpeech() {
    const S = sqState(); if (!S || !S.appearedAt) return null;
    if (sqAfter()) return SIDEQUEST.lines.after;
    const T = SIDEQUEST.lines.talk;
    if (S.talk === 0) return S.calledAt ? SIDEQUEST.lines.call : null;
    if (S.talk <= T.length && (S.talk < T.length || S.promised === 0)) return T[S.talk - 1];
    if (S.promised !== 0 && S.replyUntil > _sqFrame()) return S.promised > 0 ? SIDEQUEST.lines.promised : SIDEQUEST.lines.declined;
    return SIDEQUEST.lines.hint;
}
function _sqShopVerb() { return "BUY A SLEEPING POTION ◆" + (typeof potionPrice === "function" ? potionPrice() : 100); }
function sqVerb() {
    const S = sqState(); if (!S) return "TALK";
    if (sqAfter()) return _sqShopVerb();
    if (S.talk === 0) return "TALK TO SIDE QUEST";
    if (S.talk < SIDEQUEST.lines.talk.length) return "NEXT";
    if (S.promised === 0) return "CHOOSE";
    return _sqShopVerb();
}
function sqCan() {
    const S = sqState(); if (!S || !S.appearedAt) return { ok: false, why: "NOBODY HERE" };
    if (sqChoosing()) return { ok: false, why: "CHOOSE: I PROMISE, OR NO PROMISES" };
    if (sqAfter() || S.talk >= SIDEQUEST.lines.talk.length) return typeof potionBuyCan === "function" ? potionBuyCan() : { ok: false, why: "NO POTION" };
    return { ok: true };
}
function sqUse() {
    const S = sqState(), can = sqCan(); if (!can.ok) return can;
    if (!sqAfter() && S.talk < SIDEQUEST.lines.talk.length) { S.talk++; if (!S.metAt) S.metAt = Math.max(1, _sqNow()); return { ok: true, quiet: true, talk: S.talk }; }
    return typeof potionBuy === "function" ? potionBuy() : { ok: false, why: "NO POTION" };
}
// the choice: I PROMISE (1) or NO PROMISES (−1); nothing of the quest line changes with it
function sqChoose(yes) {
    const S = sqState(); if (!S || !sqChoosing()) return false;
    S.promised = yes ? 1 : -1; S.promisedAt = Math.max(1, _sqNow()); S.replyUntil = _sqFrame() + SIDEQUEST.replyFrames; _SQ_BTN = [];
    return true;
}
// a tap on one of the choice buttons (js/input.js, before the stations): true when it was ours
function sqTap(ex, ey) {
    if (!_SQ_BTN.length) return false;
    for (const b of _SQ_BTN) if (ex >= b.x && ex <= b.x + b.w && ey >= b.y && ey <= b.y + b.h) { sqChoose(b.yes); return true; }
    return false;
}
// ── drawing ──
// him, in the world (js/facilityplay.js drawFacilityItem): a small black saucer hovering over its shadow, sixteen rim lights chasing two on two off, a glass dome with a beacon, four tiny legs dangling
function sqDraw(it) {
    if (typeof ctx === "undefined" || typeof _fpP !== "function") return;
    const f = _sqFrame(), bob = Math.sin(f * 0.05 + it.seed) * 3, z = 26 + bob, g = _fpP(it.x, it.y, 0), c = _fpP(it.x, it.y, z), col = SIDEQUEST.col;
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.32)"; ctx.beginPath(); ctx.ellipse(g[0], g[1], 16, 7, 0, 0, Math.PI * 2); ctx.fill();   // the shadow on the floor
    ctx.strokeStyle = "#0b0d12"; ctx.lineWidth = 2; ctx.lineCap = "round";   // the legs
    for (let i = 0; i < 4; i++) { const lx = c[0] - 9 + i * 6, sw = Math.sin(f * 0.08 + i) * 1.5; ctx.beginPath(); ctx.moveTo(lx, c[1] + 4); ctx.lineTo(lx + sw, c[1] + 11); ctx.lineTo(lx + sw * 1.6, c[1] + 15); ctx.stroke(); }
    ctx.fillStyle = "#07080c"; ctx.beginPath(); ctx.ellipse(c[0], c[1] + 2, 17, 6.5, 0, 0, Math.PI * 2); ctx.fill();   // the hull, a black lens
    ctx.fillStyle = "#15181f"; ctx.beginPath(); ctx.ellipse(c[0], c[1] - 1, 15, 5, 0, 0, Math.PI * 2); ctx.fill();     // its lit top face
    for (let i = 0; i < 16; i++) { const a = i / 16 * Math.PI * 2, on = ((i + (f >> 2)) % 4) < 2; ctx.fillStyle = on ? col : "#2a3140"; ctx.beginPath(); ctx.arc(c[0] + Math.cos(a) * 15, c[1] + 1 + Math.sin(a) * 5.5, on ? 1.6 : 1.1, 0, Math.PI * 2); ctx.fill(); }   // the rim lights
    ctx.fillStyle = "rgba(159,216,255,0.22)"; ctx.beginPath(); ctx.ellipse(c[0], c[1] - 4, 7, 4.5, 0, Math.PI, 0); ctx.fill(); ctx.strokeStyle = "rgba(159,216,255,0.5)"; ctx.lineWidth = 1; ctx.stroke();   // the dome
    ctx.fillStyle = (f % 40) < 20 ? "#ffffff" : col; ctx.beginPath(); ctx.arc(c[0], c[1] - 8.5, 1.6, 0, Math.PI * 2); ctx.fill();   // the beacon
    if (typeof _fpGlow === "function") _fpGlow(c[0], c[1] + 2, 26, col, 0.22);
    ctx.restore();
    if (typeof drawPlate === "function") drawPlate(SIDEQUEST.name, col, c[0], c[1] - 18);
}
// over the scene (js/facilitytutorial.js facilityDrawOverlay, after the station's plate): what he is saying, above the plate, while you are near him; the two choice buttons when it is time to choose
function sqDrawOverlay() {
    _SQ_BTN = [];
    const S = sqState(); if (!S || !S.appearedAt || typeof uiSlab !== "function" || typeof ctx === "undefined" || typeof canvas === "undefined" || !canvas) return;
    if ((typeof invPanelOpen !== "undefined" && invPanelOpen) || (typeof classPickerOpen !== "undefined" && classPickerOpen)) return;
    const st = _sqStation(); if (!st || typeof stationDist !== "function" || stationDist(st) > STATION_RANGE + 1.2) return;
    const text = sqSpeech(); if (!text) return;
    const r = typeof _stPlate === "function" ? _stPlate() : { x: canvas.width / 2 - 190, y: canvas.height / 2 + 74, w: 380, h: 56 }, W = canvas.width, w = Math.min(W - 24, 540), x = Math.round(W / 2 - w / 2);
    const chars = Math.max(20, Math.floor((w - 28) / 8.2)), lines = typeof uiWrap === "function" ? uiWrap(text, chars) : [text], lh = 18, h = 34 + lines.length * lh, choosing = sqChoosing(), y = r.y - 12 - h - (choosing ? 54 : 0);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    uiSlab(x, y, w, h, SIDEQUEST.col, false, "#0b1226");
    if (typeof uiCaption === "function") uiCaption(SIDEQUEST.name, x + 14, y + 14, SIDEQUEST.col, "left", 11);
    lines.forEach((l, i) => { if (typeof uiCaptionFit === "function") uiCaptionFit(l, x + 14, y + 34 + i * lh, "#e6f2ff", "left", 13, w - 28); });
    if (choosing && typeof uiButton === "function") {
        const bw = Math.floor((w - 10) / 2), by = y + h + 8, A = { x, y: by, w: bw, h: 44, yes: true }, B = { x: x + bw + 10, y: by, w: bw, h: 44, yes: false };
        uiButton(A, "I PROMISE", "#9dffb6", false, 16); uiButton(B, "NO PROMISES", "#ff9c8a", false, 16); _SQ_BTN = [A, B];
    }
    ctx.restore();
}
// ── saving (js/facilitysave.js) ──
function sqSnapshot() { const S = sqState(); return S ? { at: S.appearedAt, talk: S.talk, promised: S.promised, pAt: S.promisedAt, called: S.calledAt, met: S.metAt } : null; }
function sqApply(d) {
    sqReset(); const S = sqState(); if (!S || !d || typeof d !== "object") return false;
    S.appearedAt = Number.isFinite(d.at) ? Math.max(0, d.at) : 0; S.talk = Math.max(0, Math.min(SIDEQUEST.lines.talk.length, d.talk | 0)); S.promised = d.promised === 1 || d.promised === -1 ? d.promised : 0;
    S.promisedAt = Number.isFinite(d.pAt) ? d.pAt : 0; S.calledAt = Number.isFinite(d.called) ? d.called : 0; S.metAt = Number.isFinite(d.met) ? d.met : 0; S.replyUntil = 0;
    if (S.appearedAt) sqPlace(false);
    return true;
}
