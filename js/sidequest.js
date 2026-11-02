// ─────────────────────────────────────────────────────────
//  SIDE QUEST: the void walker on the Sewers' maintenance platform (docs/SEWER-QUEST.md, "Side Quest and the Sleeping Potion")
// ─────────────────────────────────────────────────────────
// ASKED (the Game Design Archive, 2026-10-31): "Side Quest is a small flying robot drone and nomadic outlander who has left the facility and no longer wants to be part of it. He serves as an optional side-quest giver,
// merchant, technician, and source of hints [...] Position Side Quest in a safe side passage or maintenance platform roughly halfway along the route toward the sewer boss/dam blockage [...] he appears only after the
// required samples have been collected and returned to the Experiment Lab, including the provisional Toxic Ant sample target [about 10] [...] Suggested opening: 'Oh no, it's clogging everything. Look, please, there has
// to be a way to fix this without killing it.' [...] He asks the player to promise not to destroy the Queen and to give him a chance to solve the problem. He hints that a creature like this is worth understanding
// [...] The promise should frame a moral choice, not silently invalidate the quest if the player later defeats the Queen [...] Side Quest does not tell the player to reverse-engineer his sleeping potion." And the
// user (2026-10-31): his post-encounter dialogue, whether the player spares or kills the queen, is the placeholder "…" for now.
//   WHERE          SIDE QUEST'S MAINTENANCE PLATFORM off the Sewers' north ledge (js/facilitymap.js: x 600 to 700, five tiles across and three deep, behind the wide gate `sewer_gate_n2`), halfway between the
//                  culvert and the Nest's gate (2026-11-01: "Make Side Quest easier to locate [...] not an NPC hidden behind awkward environmental geometry"; he was in the side passage off the south ledge,
//                  whose walls the camera hides). Its back wall faces you: the platform is seen through the bars from both ledges and the bridges, its lamp in his colour. Out of the queen's reach (she roams within
//                  15 tiles of her post in the Nest: js/bosses.js) and out of the brood's spawns (js/facilityspawn.js keeps them 3 tiles off him). When he appears the gate opens (facilitySolidOpen: he is a
//                  technician) and he hovers two tiles in, with a STATION on him (js/stations.js STATION_KINDS.sidequest, made here, not a prop of the map): the plate, E, a tap, as any station.
//   WHEN           sqUnlocked: the samples turned in at the lab AND QUEST_PURIFY.antTarget toxic ants of the Sewers killed (js/quests.js antKills). Not location, not the samples alone, not the count alone.
//   THE TALK       four lines, one a press (the archive's opening verbatim, then his name and the Queen blocking the system, his idea that she only needs to be moved, and the PROMISE he asks for), then a choice of two
//                  buttons: I PROMISE or NO PROMISES (sqChoose: recorded in `promised`, 1 or −1; it changes nothing of the quest line, and killing her later invalidates nothing: the archive). Either way he sells
//                  the potion after. Come back and he gives the hint. Once the queen's fate is decided (the quest line's bossResolvedAt), everything he says is "…" (SIDEQUEST.lines.after), and he still sells.
//   THE SHOP       one thing: the SLEEPING POTION (js/potion.js potionBuy: ◆100, ◆50 the next once it has put the queen to sleep). His "gadgets and gizmos" and his later role are open (the archive).
//   SAVED          `sidequest` (js/facilitysave.js): that he appeared, how far the talk got, the promise, that he called you over. A load opens the gate again and puts him back.
//   HIS LOOK       the void walker, the old flux worker's form (the owner, 2026-11-02): see "drawing" below. (Until build 2026-11-02f he was a small black saucer drawn here in code.)
//   PROVISIONAL    the platform as his spot, and every line but the archive's opening (its wording "can be polished during implementation").
const SIDEQUEST = {
    id: "sidequest", name: "SIDE QUEST", room: "sewers", gate: "sewer_gate_n2", into: -2, col: "#9fd8ff",   // (into: tiles from the gate's line to his spot, north: the platform is behind the north ledge's wall)
    callNear: 8,   // tiles: the first time you come this near, he calls you over (once)
    lines: {
        call: "PSST. UP HERE, ON THE MAINTENANCE PLATFORM.",
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
// (what he says is said through the dialogue box, js/dialogue.js: sqDrawOverlay feeds it; his two choice buttons are the box's, and sqTap hands a tap on his line to it)
function _sqFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _sqNow() { return typeof techClock === "number" ? techClock : _sqFrame(); }
function sqState() {
    if (typeof _fp === "undefined" || !_fp) return null;
    if (!_fp.sidequest) _fp.sidequest = { appearedAt: 0, talk: 0, promised: 0, promisedAt: 0, calledAt: 0, metAt: 0, replyUntil: 0 };
    return _fp.sidequest;
}
function sqReset() {
    if (typeof _fp !== "undefined" && _fp) { _fp.sidequest = null; _fp._sqSpot = null; if (_fp.items) _fp.items = _fp.items.filter(i => !(i.fp === "sidequest" || (i.fp === "station" && i.id === "st_sidequest"))); if (_fp.stations) _fp.stations = _fp.stations.filter(s => s.id !== "st_sidequest"); }   // (a load from before he appeared: nobody there)
    if (typeof dialogueDismiss === "function") dialogueDismiss("sq");
}
function _sqQuest() { return typeof questState === "function" ? questState("purify") : null; }
// may he appear? the lab turn-in done AND about ten toxic ants killed (js/quests.js)
function sqUnlocked() { const Q = _sqQuest(); return !!Q && Q.turnedInAt > 0 && (Q.antKills || 0) >= (typeof QUEST_PURIFY !== "undefined" ? QUEST_PURIFY.antTarget : 10); }
function sqPresent() { const S = sqState(); return !!(S && S.appearedAt); }
// the queen's fate is decided (spared or killed): his line is the placeholder
function sqAfter() { const Q = _sqQuest(); return !!(Q && Q.bossResolvedAt > 0); }
// his spot: two tiles in from the gate's line (SIDEQUEST.into: the platform is north of it), on floor, once the gate is open
function sqSpot() {
    if (typeof _fp === "undefined" || !_fp || !_fp.F) return null;
    if (_fp._sqSpot) return _fp._sqSpot;
    const g = _fp.F.solids.find(q => q.id === SIDEQUEST.gate); if (!g || !g.bb || typeof facilitySolidIsOpen !== "function" || !facilitySolidIsOpen(SIDEQUEST.gate)) return null;
    const cx = (g.bb[0] + g.bb[2]) / 2, cy = (g.bb[1] + g.bb[3]) / 2, c = typeof _fpNearestCell === "function" ? _fpNearestCell(cx, cy + SIDEQUEST.into) : null; if (!c) return null;
    return (_fp._sqSpot = [c[0], c[1]]);
}
function _sqStation() { return typeof _fp !== "undefined" && _fp && _fp.stations ? _fp.stations.find(s => s.id === "st_sidequest") || null : null; }
// he appears (or is put back by a load): the gate opens, he hovers on the platform, his station is on him
function sqPlace(announce) {
    const S = sqState(); if (!S || typeof _fp === "undefined" || !_fp || !_fp.items || !_fp.stations) return false;
    if (typeof facilitySolidOpen === "function") facilitySolidOpen(SIDEQUEST.gate);
    _fp._sqSpot = null; const at = sqSpot(); if (!at) return false;
    const x = at[0], y = at[1], room = SIDEQUEST.room, base = typeof facilityRoomHeight === "function" ? facilityRoomHeight(room, _fp.F) * FP_ELEV_PX : 0, seed = typeof _fpHash === "function" ? _fpHash(Math.round(x * 3), Math.round(y * 7)) : 1;
    _fp.items = _fp.items.filter(i => !(i.fp === "sidequest" || (i.fp === "station" && i.id === "st_sidequest"))); _fp.stations = _fp.stations.filter(s => s.id !== "st_sidequest");
    const bb = [x - 0.45, y - 0.45, x + 0.45, y + 0.45], st = { id: "st_sidequest", kind: "sidequest", room, prop: null, bb, x, y };
    _fp.stations.push(st);
    // (his station's ring is a mark on the floor under his feet: it sorts just before him, so the void walker stands on it rather than behind its film; a unit nearer the camera still sorts after both)
    _fp.items.push({ type: "fp", fp: "station", id: st.id, kind: st.kind, room, bb: bb.slice(), x, y, depth: x + y + 0.01, base, seed });
    _fp.items.push({ type: "fp", fp: "sidequest", id: "sidequest", room, x, y, depth: x + y + 0.02, base, seed });
    sqSheet();   // (his sheet starts on its way now, so it is in by the time you reach him: js/evolution.js _evoImg)
    if (!S.appearedAt) S.appearedAt = Math.max(1, _sqNow());
    if (announce && typeof dialogueSay === "function") dialogueSay("player", "◈ SOMETHING HAS OPENED THE MAINTENANCE PLATFORM OFF THE SEWERS' NORTH LEDGE", { key: "sq:opened" });   // (your note of it: the dialogue box)
    return true;
}
// each frame (js/facilitytutorial.js facilityTutorialTick): he appears when he may; he is put back if the stations were rebuilt; he calls you over the first time you come near
function sqTick() {
    const S = sqState(); if (!S) return;
    if (!S.appearedAt) { if (sqUnlocked()) sqPlace(true); return; }
    if (!_sqStation()) sqPlace(false);
    if (!S.calledAt && typeof player !== "undefined" && typeof partyRoomAt === "function" && partyRoomAt(player.x, player.y) === SIDEQUEST.room) {
        const p = sqSpot(); if (p && Math.hypot(p[0] - player.x, p[1] - player.y) <= SIDEQUEST.callNear) { S.calledAt = Math.max(1, _sqNow()); if (typeof dialogueSay === "function") dialogueSay("sidequest", SIDEQUEST.lines.call, { key: "sq:call" }); }   // (his call, in the dialogue box with his picture)
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
    S.promised = yes ? 1 : -1; S.promisedAt = Math.max(1, _sqNow()); S.replyUntil = _sqFrame() + SIDEQUEST.replyFrames;
    return true;
}
// a tap on his line in the dialogue box (js/input.js, before the stations): one of his choice buttons, or NEXT on the words; true when it was his
function sqTap(ex, ey) { const L = typeof dialogueCurrent === "function" ? dialogueCurrent() : null; return !!(L && L.group === "sq" && typeof dialogueTap === "function" && dialogueTap(ex, ey)); }
// ── drawing ──
// HIS LOOK, the void walker (the owner, 2026-11-02: "he's a recycled asset from before ... he should be the void walker character ... that used to be the flux worker"; confirmed from a picture of the sheet): the old
// flux worker's form, a dark saucer with violet lights on four jointed legs, from its sheet img/evo/hauler.png (the HOVER HAULER's; its numbers are img/evo/hauler.json's: 8 facings × 16 frames of 144 px, 8 idle then
// 8 action). He is drawn as an evolved follower is (js/evolution.js: _evoImg loads the sheet, EVO_SCALE, the same idle beat, the same facings), standing on his legs on the platform and turned toward you. It
// replaced the small black saucer that was drawn here (build 2026-11-02f). The sheet is asked for when he appears (sqPlace); until it has arrived, his shadow and his plate stand there alone.
const SQ_LOOK = { id: "sidequest", sheet: "img/evo/hauler.png", cell: 144, anchor: [72, 114.2], core: [72, 84.8],
    plate: 52,         // px over his feet for his plate, at game size (the sheet's top is 46 px over them)
    portrait: 0.84 };  // his width in the dialogue box's square, as a share of it (the sheet's legs reach the cell's edges)
const _sqFace = { dirX: 1, dirY: 1 };   // his facing, kept between frames: toward you ((1, 1) faces the screen, as the dialogue box shows him)
const _SQ_FRONT = { dirX: 1, dirY: 1 };
function sqSheet() { return typeof _evoImg === "function" ? _evoImg(SQ_LOOK) : null; }
function _sqIdleCol(f) { return Math.floor(f / 7) % 8; }   // the idle beat of an evolved follower (js/evolution.js _evoFrame)
function _sqRow(dx, dy) {
    if (Math.abs(dx) + Math.abs(dy) > 0.05) { _sqFace.dirX = dx; _sqFace.dirY = dy; }   // (standing on him: the last facing)
    return typeof _evoFacing === "function" ? _evoFacing(_sqFace) : 1;
}
// one frame of the sheet with its feet (the anchor) on (gx, gy), at scale s
function _sqBlit(img, col, row, gx, gy, s) { const C = SQ_LOOK.cell; ctx.drawImage(img, col * C, row * C, C, C, gx - SQ_LOOK.anchor[0] * s, gy - SQ_LOOK.anchor[1] * s, C * s, C * s); }
// him, in the world (js/facilityplay.js drawFacilityItem): his shadow on the floor, the void walker over it turned toward you, a soft glow in his colour at his core, his plate over him
function sqDraw(it) {
    if (typeof ctx === "undefined" || typeof _fpP !== "function") return;
    const f = _sqFrame(), g = _fpP(it.x, it.y, 0), col = SIDEQUEST.col, s = typeof EVO_SCALE === "number" ? EVO_SCALE : 96 / 144, img = sqSheet();
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.beginPath(); ctx.ellipse(g[0], g[1], 22, 9, 0, 0, Math.PI * 2); ctx.fill();   // the shadow on the floor (an evolved follower's)
    if (img) {
        const P = typeof player !== "undefined" && player ? player : null;
        _sqBlit(img, _sqIdleCol(f), _sqRow(P ? P.x - it.x : 0, P ? P.y - it.y : 0), g[0], g[1], s);
        if (typeof _fpGlow === "function") _fpGlow(g[0], g[1] + (SQ_LOOK.core[1] - SQ_LOOK.anchor[1]) * s, 26, col, 0.22);
    }
    ctx.restore();
    if (typeof drawPlate === "function") drawPlate(SIDEQUEST.name, col, g[0], g[1] - SQ_LOOK.plate);
}
// his picture in the dialogue box (js/dialogue.js _dlgPortrait, the square s wide centred on (cx, cy)): the same void walker facing you, as wide as SQ_LOOK.portrait of the square and centred in it, over his shadow, with his glow
function sqPortrait(cx, cy, s, f) {
    const C = SQ_LOOK.cell, k = s * SQ_LOOK.portrait / C, top = SQ_LOOK.anchor[1] - 45, below = C - 1 - SQ_LOOK.anchor[1], gy = cy + (top - below) / 2 * k;   // (the sheet's sprite runs from y 45 to the cell's foot)
    ctx.fillStyle = "rgba(0,0,0,0.35)"; ctx.beginPath(); ctx.ellipse(cx, gy, 33 * k, 13.5 * k, 0, 0, Math.PI * 2); ctx.fill();
    const img = sqSheet(); if (!img) return;
    _sqBlit(img, _sqIdleCol(f), typeof _evoFacing === "function" ? _evoFacing(_SQ_FRONT) : 1, cx, gy, k);
    if (typeof _fpGlow === "function") _fpGlow(cx, gy + (SQ_LOOK.core[1] - SQ_LOOK.anchor[1]) * k, s * 0.4, SIDEQUEST.col, 0.25);
}
// each frame (js/facilitytutorial.js facilityDrawOverlay; the name stays from when it drew a slab over his plate): what he is saying, while you are at his station, is a HELD line of the dialogue box (js/dialogue.js) with his
// picture: a tap on it is NEXT while the talk is going (the station's use), the two choice buttons are in the box when it is time to choose, and away from him his line goes. Nothing is drawn here: the box draws itself.
function sqDrawOverlay() {
    const S = sqState(); if (!S || !S.appearedAt || typeof dialogueSay !== "function") return;
    if ((typeof invPanelOpen !== "undefined" && invPanelOpen) || (typeof classPickerOpen !== "undefined" && classPickerOpen)) return;
    const st = _sqStation(), near = !!st && typeof stationDist === "function" && stationDist(st) <= STATION_RANGE + 1.2, text = near ? sqSpeech() : null;
    if (!text) { if (typeof dialogueDismiss === "function") dialogueDismiss("sq"); return; }
    const choosing = sqChoosing(), next = !sqAfter() && S.talk < SIDEQUEST.lines.talk.length;
    dialogueSay("sidequest", text, { key: "sq:" + S.talk + ":" + (choosing ? "choose" : S.promised) + ":" + text, group: "sq", hold: true, now: true,
        onTap: next ? () => { if (typeof stationUse === "function") stationUse(st); else sqUse(); } : null,
        choices: choosing ? [{ label: "I PROMISE", col: "#9dffb6", yes: true, fn: () => sqChoose(true) }, { label: "NO PROMISES", col: "#ff9c8a", yes: false, fn: () => sqChoose(false) }] : null });
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
