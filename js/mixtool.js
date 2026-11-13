// ─────────────────────────────────────────────────────────
//  THE BATTLE TOOL — quick decisions in a fight: one small tool at the bottom left
// ─────────────────────────────────────────────────────────
// ASKED: "the menu should stay open, it shouldn't close unless it's on mobile. This menu is for quick, decisive decisions in battle, like withdrawing from the fight, selecting certain
// types to attack. Not too much, not too boxy."
//   ON A TABLET OR DESKTOP it is always open (no pod, no close button, a tap on the world never puts it away). On a PHONE it is a BATTLE chip that opens it (the Crystal's flag, crystalMenuOpen).
//   THE ORDERS   WHO the orders go to (ALL or one element: the ELEMENT SELECTOR; selected roster cards win; the corners layout says ALL or the member picked), RETREAT (the picked units break off and
//                fall back to you for six seconds: they see no enemy and fire no signature move), HOLD and COME. (It used to carry a POSTURE and a TARGET focus too: the functions are still here, the rows are gone: docs/TUTORIAL.md, "Targeting".)
//   What a follower IS (a brawler, a mage, a technician) and its element are how it was found: the player does not choose them (js/species.js FOLLOWER_TYPES), and every element is online from the start.
// THE ENEMY CARD   ASKED: "whenever you get near an enemy, a little index pops up in that little corner as well, and you can have your followers attack that creature if you tap it, and depending on what creatures you
//                  have selected or what followers you have selected, they'll attack it." It is the creature the gun is locked on (js/targeting.js: the dial at the top left is the same one), or the nearest in range
//                  when the gun is put away: its picture, its race's emblem and its kind (SPIDER STRIKER), level and element, a health bar with its numbers and bite, and under them the row of what its race is weak to
//                  and resists (the following update's Part 2, below: mixToolFoeRow). TAP IT and the units the tool is set to (WHO: ALL, one element, or the selected
//                  roster cards, which win) are sent at THAT creature (an attack order, js/npc.js attackOrderTarget): they go for it whatever is nearer, calm or not, until it is dead, thirty seconds have
//                  gone, it is out of reach of you, or they are given another order (RETREAT, HOLD, COME).
// THE CARD AT THE LEFT (build 2026-11-11m, the corners layout: a tablet or a desktop; the owner, 2026-11-11: "move the HUD enemy pop-up window to the left to cover up the squad command HUD window under the
//                  roster card squad feature ... it's gonna have an all button it's gonna have a run button ... basically like the retreat button and then we'll have a attack button"): while a creature
//                  is on it the card stands where the orders stood, over them, with three buttons: ALL (as the orders' ALL), RUN (the RETREAT order) and ATTACK (as tapping the card did). HOLD and COME
//                  are the orders' again as soon as there is no creature to show. The other layout keeps the card as it was (a button, above the orders).
//                  ITS LOOK (build 2026-11-11n; the owner circled design 5, "the trading card", of ten drafts): a card tilted in 3-D wearing its creature's element texture (js/cardart.js
//                  cardArtFaceClass), the picture at its left with the level and element on it, the name, HP, the bite and the race's row at its right; ALL, RUN and ATTACK flat under it, each
//                  with its emblem (js/cardart.js cardArtOrderClass: the three cards, the chevrons back, the claws). The numbers are written by mixToolFoeLive.
//                  THEN (build 2026-11-11o; the owner's picks of three more rounds of drafts: the full art, the cards tucked behind, "1 with 4's ATTACK drawn out"): the creature fills the
//                  card, large and sharp (js/targeting.js targetBigPortraitURL), its numbers on a dark panel at the right; ALL and RUN are cards tucked behind it, showing at its side;
//                  ATTACK is a card drawn out in front of it, the claws for its picture and its count on a badge (game.html).
//                  THEN (build 2026-11-11r; the owner, playtesting: "I wasn't able to retrieve my team that was holding a position. Make sure that you have some way to retrieve your team as
//                  well within that kit"): COME is a card tucked behind it too, under RUN: the orders' COME (MIXTOOL_ORDERS "follow", mixToolComePool), which the card covers.
// The Crystal's flag is how everything else opens it: a tap on the Crystal. On a wide screen the flag is just put down; on a phone it is "the tool is open".
let _mtSig = "";
// A wide screen keeps the tool open for good; a phone opens and closes it.
function mixToolWide() { return typeof innerWidth === "number" ? innerWidth > 700 : true; }
function mixToolIsOpen() { return mixToolWide() || !!crystalMenuOpen; }

function mixToolEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("mixTool") : null; }
function mixToolSetOpen(o) { if (mixToolWide()) return; crystalMenuOpen = !!o; if (o && typeof cloneMenuOpen !== "undefined") cloneMenuOpen = false; mixToolRender(true); }
function mixToolSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: col || "#19e6c1", life: 90, vy: -0.25, size: 12 }); }

function mixToolPodLabel() { return "BATTLE"; }
// ── the field orders (the dial's old COMMAND module) ──
const MIXTOOL_ORDERS = [
    { id: "hold",   label: "HOLD", sub: "STAND HERE",   col: "#8fe3ff", run: p => ccApplyStance(p, "hold") },
    { id: "follow", label: "COME", sub: "FOLLOW ME",    col: "#19e6c1", run: p => ccApplyStance(p, "follow"), pool: () => mixToolComePool() },
];
function mixToolPool() { return typeof getCommandPool === "function" ? getCommandPool().filter(a => a && !a.dead) : []; }
// COME is the way back from HOLD. Whoever is selected (they win, as for every order); else the squad AND the followers holding rooms that the WHO row reaches, the one held last first: the squad has room for as many as it has room for, the rest keep holding and it
// says so (REPORTED: "I click hold with just one of my followers [...] But then whenever I have it selected and I click come, it doesn't come. It still holds": COME reached the squad only, and nothing said so).
function mixToolComePool() {
    const sel = typeof selectedUnits !== "undefined" && selectedUnits.size && typeof ccSelectionList === "function" && ccSelectionList().length;
    if (sel || !(typeof partyOn === "function" && partyOn())) return mixToolPool();
    const all = getCommandPool(true).filter(a => a && !a.dead);
    return all.filter(a => !a.post).concat(all.filter(a => a.post).sort((a, b) => (b.postAt || 0) - (a.postAt || 0)));
}
// Who the orders go to, in words.
function mixToolTarget(pool) {
    const n = (pool || mixToolPool()).length;
    if (typeof selectedUnits !== "undefined" && selectedUnits.size && ccSelectionList().length) return "SELECTED " + n;
    if (squadMode === "all" || mixToolCorners()) return "EVERYONE " + n;   // (the corners layout has no element picker: it is ALL, or the cards that are picked)
    return String(player.selectedElement || "").toUpperCase() + " " + n;
}
function mixToolOrder(id) {
    const o = MIXTOOL_ORDERS.find(x => x.id === id), pool = o && o.pool ? o.pool() : mixToolPool();
    if (!o || !pool.length) { mixToolSay("NOBODY TO ORDER", "#8aa0c8"); return 0; }
    const n = o.run(pool); if (!(typeof partyOn === "function" && partyOn())) mixToolSay(o.label + " · " + n + " OF " + pool.length, o.col); return n;   // (in the facility HOLD and COME say what they did themselves: which room, or SQUAD FULL, js/party.js)
}
// RETREAT: the picked units break off. For BATTLE_RETREAT_FRAMES they see no enemy (npc.js) and fire no signature move (evolution.js); they fall back to the player, who is where they follow.
function mixToolRetreat() {
    const pool = mixToolPool().filter(a => (!a.isClone || a.primary) && !a.post); if (!pool.length) { mixToolSay("NOBODY TO PULL BACK", "#8aa0c8"); return 0; }   // (not a follower holding a room: it is not in the fight; the Mutator's clone falls back too, js/mutator.js)
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const a of pool) { a.retreatUntil = f0 + BATTLE_RETREAT_FRAMES; a.attackOrder = null; if (a.job && a.job.type === "move") a.job = null; a.stance = "follow"; a._nearestEnemy = null; a._enemyCacheFrame = 0; }
    mixToolSay("RETREAT \u00b7 " + pool.length + " FALLING BACK", "#ff7755"); mixToolRender(true); return pool.length;
}
// FOCUS: the enemy class to go for first (the same one again, or ANY, lets it go).
function mixToolFocus(c) {
    battleFocus = c === "any" || battleFocus === c || BATTLE_FOCUS_CLASSES.indexOf(c) < 0 ? null : c;
    mixToolSay(battleFocus ? "FOCUS: " + battleFocus.toUpperCase() + "S" : "TARGET: WHOEVER IS NEAREST", battleFocus ? "#ff8a5c" : "#8aa0c8"); mixToolRender(true); return battleFocus;
}
// POSTURE: the play style of the picked followers (js/commandcenter.js PLAY_STYLES: how far each goes after an enemy).
const MIXTOOL_POSTURES = [["defensive", "DEFEND"], ["balanced", "STEADY"], ["aggressive", "PUSH"]];
function mixToolPosture(id) {
    const pool = mixToolPool().filter(a => !a.isClone); if (!pool.length) { mixToolSay("NOBODY TO ORDER", "#8aa0c8"); return 0; }
    const n = ccApplyPlayStyle(pool, id), p = MIXTOOL_POSTURES.find(x => x[0] === id); mixToolSay((p ? p[1] : id.toUpperCase()) + " \u00b7 " + n, "#ffe733"); mixToolRender(true); return n;
}
function mixToolPostureNow() { const pool = mixToolPool().filter(a => !a.isClone); return pool.length ? ccCommon(pool, a => a.playStyle || "balanced") : null; }
// A scope chip: ALL, or one element (it also lets go of the selected cards, which would otherwise win).
// THE CORNERS LAYOUT (js/party.js hudCorners) has no element picker: the tool says ALL, or the member whose card is picked on the squad bar; the ALL button lets go of whoever is picked (and the card beside the bar goes: js/squadfly.js).
function mixToolCorners() { return typeof hudCorners === "function" && hudCorners(); }
function mixToolScope(id) {
    if (typeof ccClearSelection === "function") ccClearSelection();
    if (id === "all" || mixToolCorners()) radialSetScope(true); else radialSelectElement(id);
    if (typeof partyBarRender === "function") partyBarRender(true); mixToolRender(true);
}

// ── THE ENEMY CARD: tap it and the picked units go for that creature ──
// Who is sent: whoever the tool is set to (the pool the other orders use).
function mixToolAttackPool() { return mixToolPool().filter(a => a && !a.dead); }
function mixToolFoe() { return typeof targetIndexSubject === "function" ? targetIndexSubject() : null; }   // (js/targeting.js loads after this file, and the first render is at its end)
function mixToolOrdered(foe) { const f0 = typeof frame !== "undefined" ? frame : 0; return foe ? mixToolAttackPool().filter(a => a.attackOrder && a.attackOrder.target === foe && f0 <= a.attackOrder.until).length : 0; }
function mixToolAttack(foe) {
    foe = foe || mixToolFoe(); if (!foe || foe.dead) { mixToolSay("NOTHING TO ATTACK", "#8aa0c8"); return 0; }
    const pool = mixToolAttackPool(); if (!pool.length) { mixToolSay("NOBODY TO SEND", "#8aa0c8"); return 0; }
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const a of pool) { a.attackOrder = { target: foe, until: f0 + BATTLE_ATTACK_FRAMES }; a.retreatUntil = 0; if (a.job && a.job.type === "move") a.job = null; if (!a.post) a.stance = "follow"; a._nearestEnemy = foe; a._enemyCacheFrame = f0; }   // (a follower holding a room goes, and goes back to its round afterwards)
    mixToolSay("ATTACK \u00b7 " + pool.length + " AT " + (typeof targetName === "function" ? targetName(foe) : "IT"), "#ff7755"); mixToolRender(true); return pool.length;
}
const _mtEsc = t => String(t).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
// THE RACE'S ROW (the following update's Part 2; approved 2026-11-06, docs/UI-STYLE.md): WEAK and the types its race is weak to in green chips, then RESISTS and those it resists in grey ones, from the game's own
// table (js/damage.js dmgRow: DMG_RACE, docs/COMBAT.md §7.3; a boss uses its race's), in the approved short words (DMG_SHORT: SLASH, PIERCE, SHOT, CRUSH, QUAKE, ELEM). A longer row wraps to a second line and
// the card grows upward (it stands on its foot in every layout). "" for a creature with no row.
function mixToolFoeRow(foe) {
    const row = typeof dmgRow === "function" ? dmgRow(foe) : null; if (!row || !(row.weak.length || row.resist.length)) return "";
    const say = t => _mtEsc((typeof DMG_SHORT !== "undefined" && DMG_SHORT[t]) || String(t).toUpperCase());
    const part = (list, cls, label) => list.length ? '<b class="' + cls + '">' + label + '</b>' + list.map(t => '<i class="' + cls + '">' + say(t) + '</i>').join('') : '';
    return '<span class="mt-foe-dmg">' + part(row.weak, 'wk', 'WEAK') + part(row.resist, 'rs', 'RESISTS') + '</span>';
}
// The card: the picture, the race's emblem (Part 2: js/cardart.js cardArtRaceEmblemClass) and the kind (SPIDER STRIKER), level · element, the health bar with its numbers, the race's row and the button
// strip (who goes); what it is in words is the dial's INFO. `fresh`: it has just popped up.
function mixToolFoeHTML(foe, pool, fresh) {
    const c = targetCardInfo(foe), img = typeof targetPortraitURL === "function" ? targetPortraitURL(foe) : "", going = mixToolOrdered(foe), emb = typeof cardArtRaceEmblemClass === "function" ? cardArtRaceEmblemClass(foe) : "";
    const sub = [c.level !== null ? "LV " + c.level : "", c.element].filter(Boolean).join(" \u00b7 "), go = !pool.length ? "NO ONE TO SEND" : going ? "ATTACKING \u00b7 " + going + " OF " + pool.length : "ATTACK \u00b7 " + mixToolTarget(pool);
    if (mixToolCorners()) {   // at the left, over the orders: the trading card (its level and element on its picture), and ALL, RUN and ATTACK flat under it
        const f0 = typeof frame !== "undefined" ? frame : 0, sel = typeof selectedUnits !== "undefined" && selectedUnits.size && typeof ccSelectionList === "function" && ccSelectionList().length, run = mixToolPool().some(a => a.retreatUntil > f0);
        const aw = !pool.length ? "NO ONE" : going ? "ATTACKING" : "ATTACK", an = !pool.length ? "" : going ? going + "/" + pool.length : String(pool.length);   // (reads "ATTACK \u00b7 3": the count on its badge, build 2026-11-11o)
        const atk = aw + (an ? '<i class="mt-fa-n"><s> \u00b7 </s>' + an + '</i>' : '');
        const tex = typeof cardArtFaceClass === "function" ? cardArtFaceClass({ kind: "element", match: foe.element }) : "", ord = k => typeof cardArtOrderClass === "function" ? cardArtOrderClass(k) : "";
        const big = typeof targetBigPortraitURL === "function" ? targetBigPortraitURL(foe) : "";   // (the full art: the creature large and sharp; else the small portrait)
        const tags = [c.level !== null ? '<i class="lv">LV ' + c.level + '</i>' : '', c.element ? '<i class="el">' + _mtEsc(c.element) + '</i>' : ''].filter(Boolean).join('<s> \u00b7 </s>');   // (reads "LV 7 \u00b7 FIRE")
        // THE ATTACK CARD (build 2026-11-13a; the owner: "the attack is on the card itself. At the bottom of the card, thick, bold button", "It's mostly an attack card. Like, you should be able to press this
        // card and it should attack", "All run and come should be on the right side of this card", and an info tab "on the right side to replace attack"): a press anywhere on the creature's card sends them
        // (the stage is the button: data-act="attack"), ATTACK a thick bar across its foot; INFO, RUN, COME and ALL tucked behind its right side, top to bottom ("Info goes at the top right of that tab, and then all goes at the bottom of it").
        return '<div class="mt-foe at-left' + (fresh ? ' pop' : '') + (going ? ' going' : '') + (!pool.length ? ' idle' : '') + '" style="--c:' + c.col + '"><span class="mt-foe-stage" data-act="attack" role="button" tabindex="0" aria-label="Attack ' + _mtEsc(c.name) + '"><span class="mt-foe-slab' + (tex ? ' ' + tex : '') + '">'
            + '<span class="mt-foe-pic' + (big ? ' full' : '') + '">' + (big || img ? '<img alt="" src="' + (big || img) + '">' : '') + '<i class="mt-foe-sub">' + tags + '</i></span>'
            + '<span class="mt-foe-txt"><b class="mt-foe-name' + (emb ? ' ' + emb : '') + '">' + _mtEsc(c.title) + '</b><em class="mt-foe-num"></em><span class="mt-foe-hp"><u></u></span><span class="mt-foe-bite"></span>' + mixToolFoeRow(foe) + '</span><span class="mt-foe-atk"><b class="' + ord("attack") + '">' + atk + '</b></span></span></span>'
            + '<span class="mt-foe-acts"><button class="mt-fa info" data-act="foeinfo" aria-label="Info on ' + _mtEsc(c.name) + '"><b><i>i</i>INFO</b></button>'   // (top right, then RUN, COME, and ALL at the foot: the owner, build 2026-11-13a)
            + '<button class="mt-fa run' + (run ? ' going' : '') + '" data-act="retreat" aria-label="Run: the squad falls back"><b class="' + ord("run") + '">' + (run ? 'RUNNING' : 'RUN') + '</b></button>'
            + '<button class="mt-fa come" data-order="follow" aria-label="Come: the squad, and anyone holding a room, comes back to you"><b class="' + ord("come") + '">COME</b></button>'   // (the orders' COME, hidden under the card: the way back from HOLD, build 2026-11-11r)
            + '<button class="mt-fa all' + (!sel ? ' on' : '') + '" data-scope="all" aria-label="Orders to all of the squad"><b class="' + ord("all") + '">ALL</b></button></span></div>';
    }
    return '<button class="mt-foe' + (fresh ? ' pop' : '') + (going ? ' going' : '') + (!pool.length ? ' idle' : '') + '" data-act="attack" style="--c:' + c.col + '" aria-label="Attack ' + _mtEsc(c.name) + '">'
        + '<span class="mt-foe-pic">' + (img ? '<img alt="" src="' + img + '">' : '') + '</span>'
        + '<span class="mt-foe-txt"><b class="mt-foe-name' + (emb ? ' ' + emb : '') + '">' + _mtEsc(c.title) + '</b><i class="mt-foe-sub">' + _mtEsc(sub) + '</i><span class="mt-foe-hp"><u></u></span><em class="mt-foe-num"></em>' + mixToolFoeRow(foe) + '</span>'
        + '<span class="mt-foe-go">' + _mtEsc(go) + '</span></button>';
}
// THE ATTACK CARD'S INFO (build 2026-11-13a): the creature's own INFO card, the one THE CORE's creature slab and the dial open (js/targeting.js infoOpen, _tgInfo: what it is in words), not a
// follower's panel. The INFO card is about the creature the gun is locked on, so the card's creature is locked first if the gun is on another or on none (a manual lock, as a tap on a creature makes).
function mixToolFoeInfo(foe) {
    if (!foe || foe.dead || typeof infoOpen === "undefined") return false;
    const cur = typeof targetCurrent === "function" ? targetCurrent() : null;
    if (cur !== foe) { if (typeof targetSet !== "function" || !targetSet(foe, true)) return false; infoOpen = true; }
    else infoOpen = !infoOpen;
    return true;
}
// the health bar and its numbers follow the creature without rebuilding the card (a rebuild between a press and its release loses the tap)
function mixToolFoeLive(slot, foe) {
    const u = slot.querySelector ? slot.querySelector(".mt-foe-hp u") : null, n = slot.querySelector ? slot.querySelector(".mt-foe-num") : null; if (!u || !n || !foe) return;
    const c = targetCardInfo(foe), w = Math.round(c.frac * 100) + "%", cls = c.frac > 0.5 ? "" : c.frac > 0.25 ? "mid" : "low", t = "HP " + c.hp + "/" + c.max + (c.bite !== null ? " \u00b7 " + (c.biteLabel || "BITE") + " " + c.bite : "");
    if (u.style.width !== w) u.style.width = w; if (u.className !== cls) u.className = cls;
    const bt = slot.querySelector(".mt-foe-bite");
    if (bt) {   // the card at the left: HP and its numbers on one line (reads "HP 80/120"), the bite on its own (each written only when it changes)
        const h = '<i>HP</i> <b>' + c.hp + '<small>/' + c.max + '</small></b>', k = c.bite !== null ? '<i>' + _mtEsc(c.biteLabel || "BITE") + '</i> <b>' + c.bite + '</b>' : "";
        if (n._mt !== h) { n._mt = h; n.innerHTML = h; } if (bt._mt !== k) { bt._mt = k; bt.innerHTML = k; }
        return;
    }
    if (n.textContent !== t) n.textContent = t;
}
let _mtFoeSig = "", _mtFoeId = 0, _mtFoeShown = null;   // (the creature on the card: a tap sends them at THAT one, whoever the card is about by the next frame)
function mixToolFoeRender(root, slot, force) {
    const foe = mixToolFoe(), id = foe ? targetIndexId(foe) : 0, pool = foe ? mixToolAttackPool() : [], f0 = typeof frame !== "undefined" ? frame : 0, corners = mixToolCorners();
    const sig = id ? [id, pool.length, mixToolTarget(pool), mixToolOrdered(foe), corners, corners ? mixToolPool().some(a => a.retreatUntil > f0) : "", corners && typeof selectedUnits !== "undefined" ? selectedUnits.size : ""].join("|") : "";   // (at the left: RUN while they run, ALL while it is lit)
    if (root.classList) root.classList.toggle("foe", !!foe);   // (at the left the card stands over the orders: game.html)
    if (typeof document !== "undefined" && document.body && document.body.classList && document.body.classList.contains("foe-up") !== !!foe) document.body.classList.toggle("foe-up", !!foe);   // (the squad strip makes room for it: game.html "THE BOTTOM ROW", build 2026-11-12g)
    if (!force && sig === _mtFoeSig) { mixToolFoeLive(slot, foe); return; }
    const fresh = id !== _mtFoeId; _mtFoeSig = sig; _mtFoeId = id; _mtFoeShown = foe;
    slot.innerHTML = foe ? mixToolFoeHTML(foe, pool, fresh) : "";
    if (foe) mixToolFoeLive(slot, foe);
    if (typeof partyFlyRender === "function") partyFlyRender();   // (a squad member's card keeps clear of this one: js/squadfly.js)
}

// ── drawing it ──
const _MT_GEM = (c, s) => '<svg viewBox="0 0 20 20" width="' + (s || 18) + '" height="' + (s || 18) + '"><polygon points="10,1 18,8 10,19 2,8" fill="' + c + '"/><polygon points="10,1 18,8 10,8" fill="rgba(255,255,255,0.45)"/><polygon points="2,8 10,8 10,19" fill="rgba(0,0,0,0.25)"/></svg>';
function mixToolSignature() {
    const tot = typeof followers !== "undefined" ? followers.filter(f => f && !f.dead).length : 0;
    const f0 = typeof frame !== "undefined" ? frame : 0, pool = mixToolPool();
    return [mixToolIsOpen(), squadMode, player.selectedElement, mixToolTarget(), tot, battleFocus, mixToolPostureNow(), pool.some(a => a.retreatUntil > f0), mixToolCorners() ? mixToolWho() + "|" + mixToolRosterN() : ""].join("|");
}
// how many the roster shows (followers, then clones: js/commandcenter.js ccUnits), for the command card's ROSTER (build 2026-11-12l)
function mixToolRosterN() { return typeof ccUnits === "function" ? ccUnits().length : 0; }
// who the orders go to, in words, for the corners layout's caption: how many follow, the one member picked, or how many are picked
function mixToolWho() {
    const sel = typeof selectedUnits !== "undefined" && selectedUnits.size && typeof ccSelectionList === "function" ? ccSelectionList() : [];
    if (!sel.length) return (typeof partyMembers === "function" ? partyMembers().length : 0) + (typeof partyClone === "function" && partyClone() ? 1 : 0) + " FOLLOWING";   // (the Mutator's clone is one of them: js/party.js partyClone)
    return sel.length === 1 ? (typeof unitTypeLabel === "function" ? unitTypeLabel(sel[0]) : "1 SELECTED") : sel.length + " SELECTED";
}
function mixToolHTML() {
    const open = mixToolIsOpen(), f0 = typeof frame !== "undefined" ? frame : 0;
    // On a phone the pod opens it.
    let h = '<button class="mt-pod" aria-label="Battle orders">' + _MT_GEM("#ffe733", 15) + '<span>' + mixToolPodLabel() + '</span></button>';
    if (!open) return h;
    h += '<div class="mt-panel">';
    if (!mixToolWide()) h += '<div class="mt-tabs"><span class="mt-title">BATTLE</span><button class="mt-x" data-act="close" aria-label="Close">\u2715</button></div>';   // (a phone: the title and a way to put it away)
    {
        const sel = typeof selectedUnits !== "undefined" && selectedUnits.size && ccSelectionList().length, post = mixToolPostureNow(), pool = mixToolPool(), going = pool.some(a => a.retreatUntil > f0);
        if (mixToolCorners()) {
            // THE COMMAND CARD (build 2026-11-12l; the owner, 2026-11-12: "make that match the style of the little ... cards coming out of the battle phase little locked on card. So just make a little updated
            // command card that includes the roster as a part of the mix"; "Retreat can go away in calm mode"; then, of ten drafts, design 5, "This one with no little followers"): ROSTER a long tilted card
            // (a tap opens the roster), the roster's count and who the orders go to on it; ALL (lit while nobody's card is picked), HOLD and COME standing up behind its top edge, the enemy card's own cards.
            // With a creature locked the enemy card takes the box and this ROSTER card rises above it (game.html "THE COMMAND CARD").
            const ord = k => typeof cardArtOrderClass === "function" ? cardArtOrderClass(k) : "";
            h = h.replace('<div class="mt-panel">', '<div class="mt-panel mt-cmd">');
            h += '<span class="mt-cmd-tabs"><button class="mt-fa all' + (!sel ? ' on' : '') + '" data-scope="all" aria-label="Orders to all of the squad"><b class="' + ord("all") + '">ALL</b></button>'
                + '<button class="mt-fa hold" data-order="hold" aria-label="Hold: they stay and hold the room they are in"><b class="' + ord("hold") + '">HOLD</b></button>'
                + '<button class="mt-fa come" data-order="follow" aria-label="Come: back to you, and anyone holding a room"><b class="' + ord("come") + '">COME</b></button></span>'
                + '<button class="mt-cmd-roster" data-act="roster" aria-label="Roster and command center: pick your creatures by their cards and give them orders">'
                + '<span class="mt-cmd-name"><i class="mt-cmd-emb ' + ord("roster") + '"></i><b>ROSTER</b><i class="mt-cmd-n">' + mixToolRosterN() + '</i></span>'
                + '<span class="mt-to"><span>ORDERS TO</span><b>' + _mtEsc(mixToolWho()) + '</b></span></button>';
            return h + '</div>';
        } else {
        // WHO: the orders go to ALL, one element, or the selected roster cards (which win)
        h += '<div class="mt-who"><span class="mt-lab">' + (sel ? 'SEL ' + mixToolPool().length : 'WHO') + '</span><button class="mt-chip' + (!sel && squadMode === "all" ? ' on' : '') + '" data-scope="all" style="--c:#fff"><span>ALL</span></button>';
        ELEMENTS.filter(e => unlockedElements.has(e.id) && !e.none).forEach(e => { h += '<button class="mt-chip gem' + (!sel && squadMode !== "all" && player.selectedElement === e.id ? ' on' : '') + '" data-scope="' + e.id + '" style="--c:' + e.color + '" aria-label="' + e.label + '">' + _MT_GEM(e.color, 14) + '</button>'; });
        h += '</div>';
        }
        h += '<button class="mt-retreat' + (going ? ' going' : '') + '" data-act="retreat"><b>' + (going ? 'FALLING BACK' : 'RETREAT') + '</b></button>';
        h += '<div class="mt-orders">' + MIXTOOL_ORDERS.map(o => '<button class="mt-ord" data-order="' + o.id + '" style="--c:' + o.col + '"><b>' + o.label + '</b></button>').join('') + '</div>';
    }
    return h + '</div>';
}
// The tool is two places: the enemy card's (kept: a card that is rebuilt is a card that pops up again) and the controls' (rebuilt when they change).
function mixToolSlots(root) {
    let slot = root.querySelector(".mt-foe-slot"), main = root.querySelector(".mt-main");
    if (!slot || !main) { root.innerHTML = '<div class="mt-foe-slot"></div><div class="mt-main"></div>'; slot = root.querySelector(".mt-foe-slot"); main = root.querySelector(".mt-main"); _mtSig = ""; _mtFoeSig = ""; }
    return { slot, main };
}
function mixToolRender(force) {
    const root = mixToolEl(); if (!root) return;
    // On a wide screen the tool is always open, so the Crystal's flag (a tap on the Crystal) is just put back down.
    if (crystalMenuOpen && mixToolWide()) { crystalMenuOpen = false; force = true; }
    const { slot, main } = mixToolSlots(root), sig = mixToolSignature();
    if (force || sig !== _mtSig) {
        _mtSig = sig; main.innerHTML = mixToolHTML(); if (root.classList) root.classList.toggle("open", mixToolIsOpen());
        // on a phone the panel floats over the pod: the card goes above it
        if (!mixToolWide() && root.style) { const pn = main.querySelector(".mt-panel"); root.style.setProperty("--mt-lift", pn ? (pn.offsetHeight + 6) + "px" : "0px"); }
    }
    mixToolFoeRender(root, slot, force);
}
function mixToolTick() {
    const root = mixToolEl(); if (!root) return;
    mixToolRender(false);
}

// ── events (one listener on the tool; it is rebuilt, so nothing is bound to its parts) ──
function mixToolClick(ev) {
    const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return;
    const q = sel => t.closest(sel);
    if (q(".mt-pod")) { mixToolSetOpen(!crystalMenuOpen); return; }
    if (q("[data-act=close]")) { mixToolSetOpen(false); return; }
    if (q("[data-act=roster]")) { if (typeof ccToggleOpen === "function") ccToggleOpen(); return; }   // (the command card's ROSTER: build 2026-11-12l)
    if (q("[data-act=retreat]")) { mixToolRetreat(); return; }
    if (q("[data-act=foeinfo]")) { mixToolFoeInfo(_mtFoeShown); return; }   // (the attack card's INFO tab: build 2026-11-13a)
    const atk = q("[data-act=attack]");
    if (atk && typeof techAimNeed === "function" && techAimNeed() === "enemy") { if (atk.blur) atk.blur(); if (_mtFoeShown && !_mtFoeShown.dead) techAimPickEnemy(_mtFoeShown); return; }   // (a technician's ability waiting for an enemy: the card's creature is the pick, js/techabilities.js)
    if (atk) { if (atk.blur) atk.blur(); mixToolAttack(_mtFoeShown && !_mtFoeShown.dead ? _mtFoeShown : null); return; }   // (blurred: a key pressed afterwards does not tap it again)
    const ord = q("[data-order]"); if (ord) { mixToolOrder(ord.getAttribute("data-order")); return; }
    const po = q("[data-posture]"); if (po) { mixToolPosture(po.getAttribute("data-posture")); return; }
    const fo = q("[data-focus]"); if (fo) { mixToolFocus(fo.getAttribute("data-focus")); return; }
    const sc = q("[data-scope]"); if (sc) { mixToolScope(sc.getAttribute("data-scope")); return; }
}
try {
    const root = mixToolEl();
    if (root) {
        mixToolRender(true);
        root.addEventListener("click", mixToolClick);
        document.addEventListener("keydown", e => { if (e && e.key === "Escape" && crystalMenuOpen && !mixToolWide()) mixToolSetOpen(false); });
    }
} catch (e) { /* no page (the test sandbox) */ }
