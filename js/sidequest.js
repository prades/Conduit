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
//   WHEN           sqUnlocked (since build 2026-11-09tt; the owner, 2026-11-09: "The queen takes out the player, upon returning side quest talks to you"; seen "Only when she" does): once the queen's ambush has
//                  taken you out (js/quests.js queenOutAt), he is waiting BY THE CRYSTAL (SIDEQUEST.crystal), where it sent you, and calls you over there; the talk over (or the queen's fate decided) and you gone
//                  from the Crystal Chamber, he is back on his platform (WHERE), his gate open, your note of it. Until build 2026-11-09tt: the samples turned in at the lab AND about ten toxic ants of the Sewers killed.
//   THE TALK       four lines, one a press (the archive's opening verbatim, then his name and the Queen blocking the system, his idea that she only needs to be moved, and the PROMISE he asks for), then a choice of two
//                  buttons: I PROMISE or NO PROMISES (sqChoose: recorded in `promised`, 1 or −1; it changes nothing of the quest line, and killing her later invalidates nothing: the archive). Either way he sells
//                  the potion after. Come back and he gives the hint. Once the queen's fate is decided (the quest line's bossResolvedAt), everything he says is "…" (SIDEQUEST.lines.after), and he still sells.
//   THE SHOP       the SLEEPING POTION (js/potion.js potionBuy: ◆100, ◆50 the next once it has put the queen to sleep), on his station; and, after each quest, its quest line's three PLAYER CARDS (below, "his cards":
//                  the following update's Part 1d), on buttons in his line. His "gadgets and gizmos" and his later role are open (the archive).
//   SAVED          `sidequest` (js/facilitysave.js): that he appeared, where (`w`: "crystal" or the platform), how far the talk got, the promise, that he called you over. A load puts him back there (on the
//                  platform: the gate open again; a save from before build 2026-11-09tt, with no `w`: the platform).
//   HIS LOOK       the void walker, the old flux worker's form (the owner, 2026-11-02): see "drawing" below. (Until build 2026-11-02f he was a small black saucer drawn here in code.)
//   PROVISIONAL    the platform as his spot, his spot by the Crystal and when he goes back down, and every line but the archive's opening (its wording "can be polished during implementation").
const SIDEQUEST = {
    id: "sidequest", name: "SIDE QUEST", room: "sewers", gate: "sewer_gate_n2", into: -2, col: "#9fd8ff",   // (into: tiles from the gate's line to his spot, north: the platform is behind the north ledge's wall)
    callNear: 8,   // tiles: the first time you come this near, he calls you over (once)
    // AT THE CRYSTAL (the owner, 2026-11-09: "The queen takes out the player, upon returning side quest talks to you"; seen "Only when she" does): he first appears by the Crystal, where the queen's ambush sends you
    // (js/quests.js questQueenTakesYou): the first of these offsets (tiles) from the Crystal that is Crystal Chamber floor. He talks and sells there; once the talk is over and you have left the chamber, he is back on
    // his platform in the Sewers (as he told you in the tutorial: "I'M GOING BACK DOWN BELOW"). The spots and his call there are the agent's (provisional).
    crystal: { room: "crystal_chamber", spots: [[-2, 1.5], [-2.5, -1], [0, 2.5], [2, 2.5], [-1, 3]] },
    lines: {
        call: "PSST. UP HERE, ON THE MAINTENANCE PLATFORM.",
        callCrystal: "OVER HERE. I SAW WHAT SHE DID TO YOU DOWN THERE. WE NEED TO TALK.",
        gone: "◈ SIDE QUEST HAS GONE BACK DOWN TO HIS MAINTENANCE PLATFORM OFF THE SEWERS' NORTH LEDGE",
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
    // HIS CARDS (the owner, 2026-11-02: "side quest should sell them after each quest for the quest lines elements"; approved with the following update's Part 1: "◆1,000 each, kept for good"): a quest line and its element.
    // The Sewers' line (js/quests.js "purify") is toxic: BLIGHT SHOOTER, SMOG ENGINEER and PLAGUE DOCTOR. A later quest line adds a row here (which elements they have is open).
    stock: [{ quest: "purify", el: "toxic", after: "THE PURIFICATION" }, { quest: "purify", el: "blossom", after: "THE PURIFICATION" }],   // (after: what a refusal says it waits for; BLOOM's three since build 2026-11-09a, once the purification module has run: the same quest)
    cardPrice: 1000,       // shards a card (the owner: "◆1,000 each")
    cardCol: "#ffe733",    // the buttons' gold: a Player card's colour (js/cardsui.js _cdKindCol)
};
// (what he says is said through the dialogue box, js/dialogue.js: sqDrawOverlay feeds it; his two choice buttons are the box's, and sqTap hands a tap on his line to it)
function _sqFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _sqNow() { return typeof techClock === "number" ? techClock : _sqFrame(); }
function sqState() {
    if (typeof _fp === "undefined" || !_fp) return null;
    if (!_fp.sidequest) _fp.sidequest = { appearedAt: 0, talk: 0, promised: 0, promisedAt: 0, calledAt: 0, metAt: 0, replyUntil: 0, where: "" };   // (where: "crystal" or "platform", once he has appeared)
    return _fp.sidequest;
}
function sqReset() {
    if (typeof _fp !== "undefined" && _fp) { _fp.sidequest = null; _fp._sqSpot = null; if (_fp.items) _fp.items = _fp.items.filter(i => !(i.fp === "sidequest" || (i.fp === "station" && i.id === "st_sidequest"))); if (_fp.stations) _fp.stations = _fp.stations.filter(s => s.id !== "st_sidequest"); }   // (a load from before he appeared: nobody there)
    if (typeof dialogueDismiss === "function") dialogueDismiss("sq");
}
function _sqQuest() { return typeof questState === "function" ? questState("purify") : null; }
// may he appear? once the queen has taken you out (js/quests.js, the ambush: the owner, 2026-11-09, "Only when she" does). Until build 2026-11-09tt: the lab turn-in done AND about ten toxic ants killed.
function sqUnlocked() { const Q = _sqQuest(); return !!Q && Q.queenOutAt > 0; }
function sqPresent() { const S = sqState(); return !!(S && S.appearedAt); }
function sqAtCrystal() { const S = sqState(); return !!(S && S.appearedAt && S.where === "crystal"); }
// where he is, for a hint (js/quests.js: the install step's): null before he appears
function sqWhereSaid() { return !sqPresent() ? null : sqAtCrystal() ? "BY THE CRYSTAL" : "ON THE MAINTENANCE PLATFORM OFF THE NORTH LEDGE"; }
// his spot at the Crystal (SIDEQUEST.crystal)
function sqCrystalSpot() {
    if (typeof crystal === "undefined" || !crystal || typeof _fpNearestCell !== "function" || typeof facilityRoomAt !== "function") return null;
    for (const d of SIDEQUEST.crystal.spots) { const p = _fpNearestCell(crystal.x + d[0], crystal.y + d[1]); if (p && (facilityRoomAt(p[0], p[1], _fp.F) || {}).id === SIDEQUEST.crystal.room) return p; }
    return null;
}
// the queen's fate is decided (spared or killed): his line is the placeholder
function sqAfter() { const Q = _sqQuest(); return !!(Q && Q.bossResolvedAt > 0); }
// his spot: two tiles in from the gate's line (SIDEQUEST.into: the platform is north of it), on floor, once the gate is open
function sqSpot() {
    if (typeof _fp === "undefined" || !_fp || !_fp.F) return null;
    if (_fp._sqSpot) return _fp._sqSpot;
    if ((sqState() || {}).where === "crystal") { const p = sqCrystalSpot(); return p ? (_fp._sqSpot = [p[0], p[1]]) : null; }   // (by the Crystal, the first time: SIDEQUEST.crystal; asked as he is placed, before he has appeared)
    const g = _fp.F.solids.find(q => q.id === SIDEQUEST.gate); if (!g || !g.bb || typeof facilitySolidIsOpen !== "function" || !facilitySolidIsOpen(SIDEQUEST.gate)) return null;
    const cx = (g.bb[0] + g.bb[2]) / 2, cy = (g.bb[1] + g.bb[3]) / 2, c = typeof _fpNearestCell === "function" ? _fpNearestCell(cx, cy + SIDEQUEST.into) : null; if (!c) return null;
    return (_fp._sqSpot = [c[0], c[1]]);
}
function _sqStation() { return typeof _fp !== "undefined" && _fp && _fp.stations ? _fp.stations.find(s => s.id === "st_sidequest") || null : null; }
// he appears (or is put back by a load): the gate opens, he hovers on the platform, his station is on him
function sqPlace(announce) {
    const S = sqState(); if (!S || typeof _fp === "undefined" || !_fp || !_fp.items || !_fp.stations) return false;
    const atC = S.where === "crystal";   // (by the Crystal, the first time; else his platform, whose gate opens)
    if (!atC && typeof facilitySolidOpen === "function") facilitySolidOpen(SIDEQUEST.gate);
    _fp._sqSpot = null; const at = sqSpot(); if (!at) return false;
    const x = at[0], y = at[1], room = atC ? SIDEQUEST.crystal.room : SIDEQUEST.room, base = typeof facilityRoomHeight === "function" ? facilityRoomHeight(room, _fp.F) * FP_ELEV_PX : 0, seed = typeof _fpHash === "function" ? _fpHash(Math.round(x * 3), Math.round(y * 7)) : 1;
    _fp.items = _fp.items.filter(i => !(i.fp === "sidequest" || (i.fp === "station" && i.id === "st_sidequest"))); _fp.stations = _fp.stations.filter(s => s.id !== "st_sidequest");
    const bb = [x - 0.45, y - 0.45, x + 0.45, y + 0.45], st = { id: "st_sidequest", kind: "sidequest", room, prop: null, bb, x, y };
    _fp.stations.push(st);
    // (his station's ring is a mark on the floor under his feet: it sorts just before him, so the void walker stands on it rather than behind its film; a unit nearer the camera still sorts after both)
    _fp.items.push({ type: "fp", fp: "station", id: st.id, kind: st.kind, room, bb: bb.slice(), x, y, depth: x + y + 0.01, base, seed });
    _fp.items.push({ type: "fp", fp: "sidequest", id: "sidequest", room, x, y, depth: x + y + 0.02, base, seed });
    sqSheet();   // (his sheet starts on its way now, so it is in by the time you reach him: js/evolution.js _evoImg)
    if (!S.appearedAt) S.appearedAt = Math.max(1, _sqNow());
    if (announce && typeof dialogueSay === "function") dialogueSay("player", atC ? "◈ SIDE QUEST IS WAITING BY THE CRYSTAL" : SIDEQUEST.lines.gone, { key: atC ? "sq:crystal" : "sq:opened" });   // (your note of it: the dialogue box)
    return true;
}
// each frame (js/facilitytutorial.js facilityTutorialTick): he appears when he may (by the Crystal); he is put back if the stations were rebuilt; he calls you over the first time you come near; his talk over and you
// gone from the Crystal Chamber, he goes back down to his platform
function sqTick() {
    sqTutTick();   // (the tutorial: he waits under the catwalks and flies up for the power module, below)
    const S = sqState(); if (!S) return;
    if (!S.appearedAt) { if (sqUnlocked()) { S.where = "crystal"; sqPlace(false); } return; }
    if (!S.where) S.where = "platform";
    if (!_sqStation()) sqPlace(false);
    const here = typeof player !== "undefined" && typeof partyRoomAt === "function" ? partyRoomAt(player.x, player.y) : null, atC = S.where === "crystal";
    if (atC && (S.talk >= SIDEQUEST.lines.talk.length && S.promised !== 0 || sqAfter()) && here && here !== SIDEQUEST.crystal.room) { S.where = "platform"; sqPlace(true); return; }   // (back down below: the talk over, or the queen's fate decided without it)
    if (!S.calledAt && here === (atC ? SIDEQUEST.crystal.room : SIDEQUEST.room)) {
        const p = sqSpot(); if (p && Math.hypot(p[0] - player.x, p[1] - player.y) <= SIDEQUEST.callNear) { S.calledAt = Math.max(1, _sqNow()); if (typeof dialogueSay === "function") dialogueSay("sidequest", atC ? SIDEQUEST.lines.callCrystal : SIDEQUEST.lines.call, { key: atC ? "sq:callCrystal" : "sq:call" }); }   // (his call, in the dialogue box with his picture)
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
    if (S.talk === 0) return S.calledAt ? (S.where === "crystal" ? SIDEQUEST.lines.callCrystal : SIDEQUEST.lines.call) : null;
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
// ── his cards (the following update's Part 1d) ──
// AFTER EACH QUEST he sells the Player cards of its quest line's element (SIDEQUEST.stock: one for each of the three classes), SIDEQUEST.cardPrice shards each, KEPT FOR GOOD: in the collection for good, and found for this
// run so it can be worn at once (js/cards.js equipGrant, as a card bought from the market's shelf). Readings taken where the design did not say (docs/OPEN-QUESTIONS.md §1u): "after the quest" is once the quest is done
// (js/quests.js questDone: the Sewers' water purified, when Series 2 opens too); they are bought on buttons in his line in the dialogue box, the potion staying on his station; a card you keep for good already is not
// offered; shards only; not on a phone (it has no cards screen yet, as js/cards.js equipRunStart).
function sqStock() {
    const cards = typeof equipCards === "function" ? Object.values(equipCards()) : [];
    return (SIDEQUEST.stock || []).filter(s => typeof questDone === "function" && questDone(s.quest)).flatMap(s => cards.filter(c => c.kind === "player" && !c.test && c.kit && c.kit.el === s.el));
}
function _sqPhone() { return typeof hudCorners === "function" && !hudCorners(); }
function _sqNear() { const st = _sqStation(); return !!st && typeof stationDist === "function" && stationDist(st) <= STATION_RANGE + 1.2; }   // (where his line shows: sqDrawOverlay)
// the cards on sale now: his stock, less those you keep for good already (none on a phone)
function sqCardsForSale() {
    if (!sqPresent() || _sqPhone()) return [];
    return sqStock().filter(c => !(typeof equipOwns === "function" && equipOwns(c.id)));
}
// why a card cannot be bought from him now, or null when it can
function sqCardWhyNot(id) {
    if (!sqPresent()) return "NOBODY HERE";
    const c = typeof equipCard === "function" ? equipCard(id) : null;
    if (!c || !sqStock().some(s => s.id === id)) {
        const row = c && c.kind === "player" && c.kit ? (SIDEQUEST.stock || []).find(s => s.el === c.kit.el) : null;   // (one of his, its quest not done yet)
        return row ? "HE SELLS " + c.name + " AFTER " + row.after : "HE DOES NOT SELL THAT";
    }
    if (_sqPhone()) return "NOT ON A PHONE YET: IT HAS NO CARDS SCREEN";
    if (!_sqNear()) return "TOO FAR AWAY";
    if (equipOwns(id)) return "YOU KEEP " + c.name + " FOR GOOD ALREADY";
    const have = typeof shardCount === "number" ? shardCount : 0;
    return have < SIDEQUEST.cardPrice ? "NEED ◆" + (SIDEQUEST.cardPrice - have) + " MORE FOR " + c.name + " (◆" + SIDEQUEST.cardPrice + ")" : null;
}
// buy one: the price from the run's shards; the card kept for good and found; what happened is said (js/inventory.js invSay)
function sqCardBuy(id) {
    const why = sqCardWhyNot(id); if (why) { if (typeof invSay === "function") invSay(why, false); return { ok: false, why }; }
    const c = equipCard(id); shardCount -= SIDEQUEST.cardPrice; equipGrant(id);
    const msg = c.name + " — ◆" + SIDEQUEST.cardPrice + ". KEPT FOR GOOD: YOUR SLOTS CAN TAKE IT NOW";
    if (typeof invSay === "function") invSay(msg, true);
    return { ok: true, id, price: SIDEQUEST.cardPrice, msg };
}
// a tap on his line in the dialogue box (js/input.js, before the stations): one of his choice buttons, or NEXT on the words; true when it was his
function sqTap(ex, ey) { const L = typeof dialogueCurrent === "function" ? dialogueCurrent() : null; return !!(L && (L.group === "sq" || L.group === "sqt") && typeof dialogueTap === "function" && dialogueTap(ex, ey)); }
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
function _sqBlit(img, col, row, gx, gy, s) { const C = SQ_LOOK.cell, cell = typeof spriteCell === "function" ? spriteCell(img, col * C, row * C, C, C) : null;   // (its own small canvas, cut once: js/draw.js)
    if (cell) ctx.drawImage(cell, gx - SQ_LOOK.anchor[0] * s, gy - SQ_LOOK.anchor[1] * s, C * s, C * s); else ctx.drawImage(img, col * C, row * C, C, C, gx - SQ_LOOK.anchor[0] * s, gy - SQ_LOOK.anchor[1] * s, C * s, C * s); }
// him, in the world (js/facilityplay.js drawFacilityItem): his shadow on the floor, the void walker over it turned toward you, a soft glow in his colour at his core, his plate over him
function sqDraw(it) {
    if (typeof ctx === "undefined" || typeof _fpP !== "function") return;
    const f = _sqFrame(), lift = it.lift || 0, g = _fpP(it.x, it.y, lift), col = SIDEQUEST.col, s = typeof EVO_SCALE === "number" ? EVO_SCALE : 96 / 144, img = sqSheet();
    const ground = lift && typeof facilityHeightAt === "function" && typeof FP_ELEV_PX === "number" ? facilityHeightAt(it.x, it.y, _fp.F) * FP_ELEV_PX - (it.base || 0) : 0, sh = _fpP(it.x, it.y, ground), far = Math.max(0, lift - ground);   // (in the air: his shadow on whatever is under him, smaller the higher he is)
    ctx.save(); if (it.alpha !== undefined) ctx.globalAlpha *= Math.max(0, it.alpha);
    const sk = Math.max(0.35, 1 - far / 260); ctx.fillStyle = "rgba(0,0,0," + (0.4 * sk).toFixed(3) + ")"; ctx.beginPath(); ctx.ellipse(sh[0], sh[1], 22 * sk, 9 * sk, 0, 0, Math.PI * 2); ctx.fill();   // the shadow (an evolved follower's)
    if (it.flying) { const b = 0.5 + 0.5 * Math.sin(f * 0.3); if (typeof _fpGlow === "function") _fpGlow(g[0], g[1] - 4, 20 + 4 * b, col, 0.35); }   // (his thrust while he flies; walking on the catwalks he has none)
    if (it.carry && typeof invDrawIcon === "function") invDrawIcon("power_module", g[0], g[1] + 4, 24, f);   // the module he carries, under him
    if (img) {
        const P = typeof player !== "undefined" && player ? player : null;
        const fc = it.face; _sqBlit(img, _sqIdleCol(f), _sqRow(fc ? fc[0] : P ? P.x - it.x : 0, fc ? fc[1] : P ? P.y - it.y : 0), g[0], g[1], s);   // (toward you; walking, the way he goes)
        if (typeof _fpGlow === "function") _fpGlow(g[0], g[1] + (SQ_LOOK.core[1] - SQ_LOOK.anchor[1]) * s, 26, col, 0.22);
    }
    ctx.restore();
    if (!lift && typeof drawPlate === "function") drawPlate(SIDEQUEST.name, col, g[0], g[1] - SQ_LOOK.plate);
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
// After a quest his cards on sale are buttons in his line (each card's name, its price and KEPT FOR GOOD under it); a card bought leaves the row, and the line is said again with what is left.
function sqDrawOverlay() {
    sqTutOverlay();   // (the tutorial's talk under the catwalks, below)
    const S = sqState(); if (!S || !S.appearedAt || typeof dialogueSay !== "function") return;
    if ((typeof invPanelOpen !== "undefined" && invPanelOpen) || (typeof classPickerOpen !== "undefined" && classPickerOpen)) return;
    const st = _sqStation(), near = _sqNear(), text = near ? sqSpeech() : null;
    if (!text) { if (typeof dialogueDismiss === "function") dialogueDismiss("sq"); return; }
    const choosing = sqChoosing(), next = !sqAfter() && S.talk < SIDEQUEST.lines.talk.length, sale = choosing || next ? [] : sqCardsForSale();
    dialogueSay("sidequest", text, { key: "sq:" + S.talk + ":" + (choosing ? "choose" : S.promised) + ":" + text + (sale.length ? ":" + sale.map(c => c.id).join(",") : ""), group: "sq", hold: true, now: true,
        onTap: next ? () => { if (typeof stationUse === "function") stationUse(st); else sqUse(); } : null,
        choices: choosing ? [{ label: "I PROMISE", col: "#9dffb6", yes: true, fn: () => sqChoose(true) }, { label: "NO PROMISES", col: "#ff9c8a", yes: false, fn: () => sqChoose(false) }]
            : sale.length ? sale.map(c => ({ label: c.name, sub: "◆" + SIDEQUEST.cardPrice + " · KEPT FOR GOOD", col: SIDEQUEST.cardCol, card: c.id, fn: () => sqCardBuy(c.id) })) : null });
}
// ── saving (js/facilitysave.js) ──
function sqSnapshot() { const S = sqState(); return S ? { at: S.appearedAt, talk: S.talk, promised: S.promised, pAt: S.promisedAt, called: S.calledAt, met: S.metAt, w: S.where } : null; }
function sqApply(d) {
    sqReset(); const S = sqState(); if (!S || !d || typeof d !== "object") return false;
    S.appearedAt = Number.isFinite(d.at) ? Math.max(0, d.at) : 0; S.talk = Math.max(0, Math.min(SIDEQUEST.lines.talk.length, d.talk | 0)); S.promised = d.promised === 1 || d.promised === -1 ? d.promised : 0;
    S.promisedAt = Number.isFinite(d.pAt) ? d.pAt : 0; S.calledAt = Number.isFinite(d.called) ? d.called : 0; S.metAt = Number.isFinite(d.met) ? d.met : 0; S.replyUntil = 0;
    S.where = S.appearedAt ? (d.w === "crystal" ? "crystal" : "platform") : "";   // (a game from before build 2026-11-09tt: he is on his platform)
    if (S.appearedAt) sqPlace(false);
    return true;
}

// ── THE TUTORIAL: SIDE QUEST FLIES UP FOR THE POWER MODULE ──
// (build 2026-11-07qq; the owner: "you have to get the help of a NPC like side quest to retrieve the item, and I'm thinking the item could be in the catwalks, and side quest's ability is to fly"; where you meet him:
// "Under the catwalks"). While the tutorial runs and its POWER MODULE is still up on the catwalks (the case js/facilitymap.js pk_power_module, which you cannot take: `fetch`), Side Quest waits on the arena floor below
// it, a station on him as in the Sewers (STATION_KINDS.sidequest_tut). The first time you come near he calls you over; his talk is two lines (a tap on each: NEXT), and then he FLIES: up to the catwalks, along to the
// module, and takes it. Then he comes down THE WAY YOU WOULD (the owner, 2026-11-07: "I want side quest to utilize that walk as he gets down after retrieving the item to show the player how it works"): he lands on the
// catwalks, walks to their LEDGE (js/facilitymap.js `ledges`), says what it is, steps off it, and walks over to you on the floor; the module is in your pack. Then he flies off, back to the Sewers' platform, where he is met
// later as before (sqUnlocked; his lines there as they were: the owner chose him "with his shop and lines as today"). His flight is not saved: a game saved while he is up there has him waiting below again, the module
// still up there. The words and the timings are the agent's (provisional).
const SQ_TUT = {
    pickup: "pk_power_module", room: "arena", callNear: 7,
    spots: [[0, -1], [-1, -1], [-1, 0], [0, 0], [-1, -2]],   // where he waits: the first of these offsets (tiles) from the ledge's landing that is arena floor, where the camera sees him (the floor within about three tiles of the
                                                             // catwalks' edge is hidden behind the raised deck); with no ledge, the same offsets from three tiles west of the module's case
    over: 11,   // drawn this much later than his place says (depth): from where the camera looks, the raised catwalks would cover anyone standing below them, and he must be seen
    t: { up: 45, over: 60, grab: 30, jump: 30, down: 70, give: 16, away: 80 },   // frames for each part of the flight (`down`: straight down to you, only if the catwalks had no ledge); the walks take as long as they are long
    walk: 0.06,   // tiles a frame he walks: along the catwalks to the ledge, and over the floor to you
    giveNear: 10,   // tiles: you farther off than this when he lands, and he hands it over from where he is (he does not chase you round the facility)
    rise: 30,   // px he flies over the catwalks' deck
    lines: {
        call: "LOOKING FOR THAT? THE GLOWING THING UP ON THE CATWALKS. YOU CAN'T CLIMB UP THERE.",
        talk: ["I'M SIDE QUEST. I DON'T WORK FOR THIS PLACE ANY MORE, BUT I CAN FLY.", "STAY THERE. I'LL BRING IT DOWN."],
        ledge: "THIS LEDGE IS THE ONLY WAY DOWN FROM THE CATWALKS. YOU JUST WALK OFF IT.",
        give: "ONE POWER MODULE. YOUR JUNCTION IS IN THE SERVER ROOM. I'M GOING BACK DOWN BELOW: FIND ME THERE SOMETIME.",
    },
};
function _sqtState() { if (typeof _fp === "undefined" || !_fp) return null; if (!_fp.sqtut) _fp.sqtut = { phase: "none", talk: 0, t0: 0, called: false }; return _fp.sqtut; }
function _sqtCase() { return typeof _fp !== "undefined" && _fp && _fp.items ? _fp.items.find(i => i.fp === "pickup" && i.id === SQ_TUT.pickup) || null : null; }
function _sqtItem() { return typeof _fp !== "undefined" && _fp && _fp.items ? _fp.items.find(i => i.id === "sidequest_tut") || null : null; }
function _sqtStation() { return typeof _fp !== "undefined" && _fp && _fp.stations ? _fp.stations.find(s => s.id === "st_sidequest_tut") || null : null; }
// is he wanted: the tutorial not over, the module's case still up there, and the module neither in your pack nor in the junction
function sqTutWanted() {
    const S = typeof _fp !== "undefined" && _fp && _fp.tut && _fp.tut.script, c = _sqtCase();
    if (!S || S.doneAt || S.step >= (typeof TUT_STEPS !== "undefined" ? TUT_STEPS.length : 0) || !c || c.taken) return false;
    return !(typeof invHas === "function" && invHas("power_module")) && !(typeof junctionRepaired === "function" && junctionRepaired());
}
// where he waits: arena floor below the module
function sqTutSpot() {
    const c = _sqtCase(); if (!c || typeof _fpNearestCell !== "function" || typeof facilityRoomAt !== "function") return null;
    const L = _sqtLedge(), o = L ? L.to : [c.x - 3, c.y + 0.5];
    for (const d of SQ_TUT.spots) { const p = _fpNearestCell(o[0] + d[0], o[1] + d[1]); if (p && (facilityRoomAt(p[0], p[1], _fp.F) || {}).id === SQ_TUT.room) return p; }
    return null;
}
function _sqtRemove() {
    _fp.items = _fp.items.filter(i => !(i.id === "sidequest_tut" || (i.fp === "station" && i.id === "st_sidequest_tut"))); _fp.stations = _fp.stations.filter(s => s.id !== "st_sidequest_tut");
    if (typeof dialogueDismiss === "function") { dialogueDismiss("sqt"); dialogueDismiss("sqtc"); }
}
function _sqtPlace() {
    const T = _sqtState(), at = sqTutSpot(); if (!T || !at || !_fp.items || !_fp.stations) return false;
    _sqtRemove();
    const x = at[0], y = at[1], base = typeof facilityRoomHeight === "function" ? facilityRoomHeight(SQ_TUT.room, _fp.F) * FP_ELEV_PX : 0, seed = typeof _fpHash === "function" ? _fpHash(Math.round(x * 3), Math.round(y * 7)) : 1;
    const bb = [x - 0.45, y - 0.45, x + 0.45, y + 0.45], st = { id: "st_sidequest_tut", kind: "sidequest_tut", room: SQ_TUT.room, prop: null, bb, x, y };
    _fp.stations.push(st);
    _fp.items.push({ type: "fp", fp: "station", id: st.id, kind: st.kind, room: SQ_TUT.room, bb: bb.slice(), x, y, depth: x + y + 0.01, base, seed });
    _fp.items.push({ type: "fp", fp: "sidequest", id: "sidequest_tut", tut: true, room: SQ_TUT.room, x, y, depth: x + y + SQ_TUT.over, base, seed });
    T.phase = "wait"; T.talk = 0; return true;
}
// each frame (sqTick): he is put under the catwalks while he is wanted and taken away when he is not; he calls you over once; his flight runs
function sqTutTick() {
    const T = _sqtState(); if (!T) return;
    const c = _sqtCase();
    if (c && !c.taken && typeof junctionRepaired === "function" && junctionRepaired()) c.taken = true;   // (the junction repaired already, an old save brought up to date: the spare is not wanted)
    if (T.phase === "fly") return _sqtFly(T);
    if (T.phase === "away") return _sqtAway(T);
    const want = sqTutWanted();
    if (want && T.phase !== "wait") _sqtPlace();
    else if (!want && T.phase === "wait") { _sqtRemove(); T.phase = "none"; }
    if (T.phase === "wait" && !_sqtStation()) _sqtPlace();   // (the stations were rebuilt: put him back)
    if (T.phase === "wait" && !T.called && typeof player !== "undefined") { const it = _sqtItem(); if (it && Math.hypot(it.x - player.x, it.y - player.y) <= SQ_TUT.callNear) { T.called = true; if (typeof dialogueSay === "function") dialogueSay("sidequest", SQ_TUT.lines.call, { key: "sqt:call", group: "sqtc" }); } }
}
// his station (js/stations.js STATION_KINDS.sidequest_tut): TALK, then NEXT on each line; after the last he flies
function sqTutVerb() { const T = _sqtState(); return T && T.talk > 0 ? "NEXT" : "TALK TO SIDE QUEST"; }
function sqTutCan() { const T = _sqtState(); return T && T.phase === "wait" ? { ok: true } : { ok: false, why: "HE IS FLYING" }; }
function sqTutUse() {
    const T = _sqtState(); if (!T || T.phase !== "wait") return { ok: false, why: "HE IS FLYING" };
    if (typeof dialogueDismiss === "function") dialogueDismiss("sqtc");   // (his call is answered: it does not come back after the talk)
    if (T.talk < SQ_TUT.lines.talk.length) { T.talk++; return { ok: true, quiet: true, talk: T.talk }; }
    _sqtStart(); return { ok: true, quiet: true, fly: true };
}
// what he is saying while you are at his station: a HELD line of the dialogue box with his picture, a tap on it is NEXT (as in the Sewers)
function sqTutOverlay() {
    const T = _sqtState(), st = _sqtStation(); if (!T || typeof dialogueSay !== "function") return;
    if ((typeof invPanelOpen !== "undefined" && invPanelOpen) || (typeof classPickerOpen !== "undefined" && classPickerOpen)) return;
    const near = !!st && T.phase === "wait" && T.talk > 0 && typeof stationDist === "function" && stationDist(st) <= STATION_RANGE + 1.2;
    if (!near) { if (typeof dialogueDismiss === "function") dialogueDismiss("sqt"); return; }
    const text = SQ_TUT.lines.talk[T.talk - 1];
    dialogueSay("sidequest", text, { key: "sqt:" + T.talk, group: "sqt", hold: true, now: true, onTap: () => { if (typeof stationUse === "function") stationUse(st); else sqTutUse(); } });
}
// the trip: up, over to the module, take it, down onto the catwalks, walk to the ledge, step off it, walk to you, give it; then away (T.leg is the part he is on, from T.t0; sqDraw draws him at it.lift over the arena floor)
function _sqtLedge() { const c = _sqtCase(); return c && typeof _fp !== "undefined" && _fp && _fp.F && _fp.F.ledges ? _fp.F.ledges.find(l => l.room === c.room) || null : null; }
function _sqtLeg(T, leg) { T.leg = leg; T.t0 = _sqFrame(); }
function _sqtStart() {
    const T = _sqtState(), it = _sqtItem(); if (!T || !it) return false;
    T.phase = "fly"; T.from = [it.x, it.y]; T.dn = null; T.given = false; T.saidLedge = false; _sqtLeg(T, "up");
    _fp.stations = _fp.stations.filter(s => s.id !== "st_sidequest_tut"); _fp.items = _fp.items.filter(i => !(i.fp === "station" && i.id === "st_sidequest_tut"));
    if (typeof dialogueDismiss === "function") dialogueDismiss("sqt");
    return true;
}
function _sqtFly(T) {
    const it = _sqtItem(), c = _sqtCase(); if (!it || !c) { T.phase = "none"; return; }
    const D = SQ_TUT.t, deck = (c.base || 0) - (it.base || 0), up = deck + SQ_TUT.rise, ease = k => k * k * (3 - 2 * k), t = _sqFrame() - T.t0, L = _sqtLedge(), P = typeof player !== "undefined" ? player : null;
    let x = it.x, y = it.y, z = it.lift || 0, flying = true;
    if (T.leg === "up") { const k = Math.min(1, t / D.up); x = T.from[0]; y = T.from[1]; z = up * ease(k); if (k >= 1) _sqtLeg(T, "over"); }
    else if (T.leg === "over") { const k = Math.min(1, t / D.over), e = ease(k); x = T.from[0] + (c.x - T.from[0]) * e; y = T.from[1] + (c.y - T.from[1]) * e; z = up; if (k >= 1) _sqtLeg(T, "grab"); }
    else if (T.leg === "grab") {   // he comes down onto the catwalks where the module is, and takes it
        const k = Math.min(1, t / D.grab); x = c.x; y = c.y; z = up - (up - deck) * ease(k); if (k > 0.5) c.carried = true;
        if (k >= 1) { T.walkFrom = [c.x, c.y]; T.dn = [c.x, c.y]; _sqtLeg(T, L ? "deck" : "down"); }
    }
    else if (T.leg === "deck") {   // along the catwalks to the ledge, on foot
        const a = T.walkFrom, b = L.at, len = Math.hypot(b[0] - a[0], b[1] - a[1]), k = len > 1e-6 ? Math.min(1, t * SQ_TUT.walk / len) : 1;
        x = a[0] + (b[0] - a[0]) * k; y = a[1] + (b[1] - a[1]) * k; z = deck; flying = false; it.face = [b[0] - a[0], b[1] - a[1]];
        if (k >= 1) { if (!T.saidLedge && typeof dialogueSay === "function") dialogueSay("sidequest", SQ_TUT.lines.ledge, { key: "sqt:ledge" }); T.saidLedge = true; _sqtLeg(T, "jump"); }
    }
    else if (T.leg === "jump") {   // off the ledge: a little hop out, and down to the floor under it
        const k = Math.min(1, t / D.jump), a = L.at, b = L.to; x = a[0] + (b[0] - a[0]) * k; y = a[1] + (b[1] - a[1]) * k; z = deck * (1 - k * k) + 14 * Math.sin(k * Math.PI); flying = false; it.face = [b[0] - a[0], b[1] - a[1]];
        if (k >= 1) { z = 0; _sqtLeg(T, "floor"); }
    }
    else if (T.leg === "floor") {   // over the floor to you (from where you are now: he stops a step short, on his side of you); you far off, and he hands it over from where he is
        const pd = P ? Math.hypot(x - P.x, y - P.y) : 0, to = P && pd > 1e-6 ? [P.x + (x - P.x) / pd * 0.9, P.y + (y - P.y) / pd * 0.9] : [x, y], dx = to[0] - x, dy = to[1] - y, d = Math.hypot(dx, dy); z = 0; flying = false;
        if (d <= SQ_TUT.walk || !P || Math.hypot(P.x - x, P.y - y) > SQ_TUT.giveNear) { if (d <= SQ_TUT.walk) { x = to[0]; y = to[1]; } it.face = null; _sqtLeg(T, "give"); }
        else { x += dx / d * SQ_TUT.walk; y += dy / d * SQ_TUT.walk; it.face = [dx, dy]; }
    }
    else if (T.leg === "down") {   // (no ledge in the data: he flies straight down to you)
        const k = Math.min(1, t / D.down), e = ease(k), to = P ? [P.x + 0.8, P.y - 0.4] : T.from; x = T.dn[0] + (to[0] - T.dn[0]) * e; y = T.dn[1] + (to[1] - T.dn[1]) * e; z = deck * (1 - e); if (k >= 1) _sqtLeg(T, "give");
    }
    else { flying = false; z = 0; it.face = null; if (!T.given) _sqtGive(T, c); if (t >= D.give) { T.phase = "away"; T.t0 = _sqFrame(); T.from = [x, y]; } }
    it.x = x; it.y = y; it.lift = Math.max(0, z); it.flying = flying; it.depth = x + y + SQ_TUT.over; it.carry = !!c.carried && !T.given;
}
function _sqtGive(T, c) {
    T.given = true; c.carried = false;
    if (typeof invRoom === "function" && invRoom("power_module") < 1) {   // (no room in the pack: he sets it down at your feet, a case you can take)
        const P = typeof player !== "undefined" ? player : null; if (P) { c.x = P.x; c.y = P.y; c.room = SQ_TUT.room; c.base = typeof facilityRoomHeight === "function" ? facilityRoomHeight(SQ_TUT.room, _fp.F) * FP_ELEV_PX : 0; c.depth = c.x + c.y; }
        c.fetch = null;
    } else { c.taken = true; if (typeof invAdd === "function") invAdd("power_module", 1); }   // (his line says what it is: no text in the middle of the screen)
    if (typeof dialogueSay === "function") dialogueSay("sidequest", SQ_TUT.lines.give, { key: "sqt:give" });
}
function _sqtAway(T) {
    const it = _sqtItem(); if (!it) { T.phase = "gone"; return; }
    const k = Math.min(1, (_sqFrame() - T.t0) / SQ_TUT.t.away); it.lift = 260 * k * k; it.alpha = 1 - k; it.y = T.from[1] - 3 * k; it.depth = it.x + it.y + SQ_TUT.over; it.flying = true; it.face = null;
    if (k >= 1) { _sqtRemove(); T.phase = "gone"; }
}
