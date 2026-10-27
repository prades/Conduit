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
//                  when the gun is put away: its picture, its kind (SPIDER STRIKER), level and element, a health bar with its numbers and bite. TAP IT and the units the tool is set to (WHO: ALL, one element, or the selected
//                  roster cards, which win) are sent at THAT creature (an attack order, js/npc.js attackOrderTarget): they go for it whatever is nearer, calm or not, until it is dead, thirty seconds have
//                  gone, it is out of reach of you, or they are given another order (RETREAT, HOLD, COME).
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
// The card: the picture, the kind (SPIDER STRIKER), level · element, the health bar with its numbers and the button strip (who goes); what it is in words is the dial's INFO. `fresh`: it has just popped up.
function mixToolFoeHTML(foe, pool, fresh) {
    const c = targetCardInfo(foe), img = typeof targetPortraitURL === "function" ? targetPortraitURL(foe) : "", going = mixToolOrdered(foe);
    const sub = [c.level !== null ? "LV " + c.level : "", c.element].filter(Boolean).join(" \u00b7 "), go = !pool.length ? "NO ONE TO SEND" : going ? "ATTACKING \u00b7 " + going + " OF " + pool.length : "ATTACK \u00b7 " + mixToolTarget(pool);
    return '<button class="mt-foe' + (fresh ? ' pop' : '') + (going ? ' going' : '') + (!pool.length ? ' idle' : '') + '" data-act="attack" style="--c:' + c.col + '" aria-label="Attack ' + _mtEsc(c.name) + '">'
        + '<span class="mt-foe-pic">' + (img ? '<img alt="" src="' + img + '">' : '') + '</span>'
        + '<span class="mt-foe-txt"><b class="mt-foe-name">' + _mtEsc(c.title) + '</b><i class="mt-foe-sub">' + _mtEsc(sub) + '</i><span class="mt-foe-hp"><u></u></span><em class="mt-foe-num"></em></span>'
        + '<span class="mt-foe-go">' + _mtEsc(go) + '</span></button>';
}
// the health bar and its numbers follow the creature without rebuilding the card (a rebuild between a press and its release loses the tap)
function mixToolFoeLive(slot, foe) {
    const u = slot.querySelector ? slot.querySelector(".mt-foe-hp u") : null, n = slot.querySelector ? slot.querySelector(".mt-foe-num") : null; if (!u || !n || !foe) return;
    const c = targetCardInfo(foe), w = Math.round(c.frac * 100) + "%", cls = c.frac > 0.5 ? "" : c.frac > 0.25 ? "mid" : "low", t = "HP " + c.hp + "/" + c.max + (c.bite !== null ? " \u00b7 BITE " + c.bite : "");
    if (u.style.width !== w) u.style.width = w; if (u.className !== cls) u.className = cls; if (n.textContent !== t) n.textContent = t;
}
let _mtFoeSig = "", _mtFoeId = 0, _mtFoeShown = null;   // (the creature on the card: a tap sends them at THAT one, whoever the card is about by the next frame)
function mixToolFoeRender(root, slot, force) {
    const foe = mixToolFoe(), id = foe ? targetIndexId(foe) : 0, pool = foe ? mixToolAttackPool() : [], sig = id ? [id, pool.length, mixToolTarget(pool), mixToolOrdered(foe)].join("|") : "";
    if (!force && sig === _mtFoeSig) { mixToolFoeLive(slot, foe); return; }
    const fresh = id !== _mtFoeId; _mtFoeSig = sig; _mtFoeId = id; _mtFoeShown = foe;
    slot.innerHTML = foe ? mixToolFoeHTML(foe, pool, fresh) : "";
    if (foe) mixToolFoeLive(slot, foe);
}

// ── drawing it ──
const _MT_GEM = (c, s) => '<svg viewBox="0 0 20 20" width="' + (s || 18) + '" height="' + (s || 18) + '"><polygon points="10,1 18,8 10,19 2,8" fill="' + c + '"/><polygon points="10,1 18,8 10,8" fill="rgba(255,255,255,0.45)"/><polygon points="2,8 10,8 10,19" fill="rgba(0,0,0,0.25)"/></svg>';
function mixToolSignature() {
    const tot = typeof followers !== "undefined" ? followers.filter(f => f && !f.dead).length : 0;
    const f0 = typeof frame !== "undefined" ? frame : 0, pool = mixToolPool();
    return [mixToolIsOpen(), squadMode, player.selectedElement, mixToolTarget(), tot, battleFocus, mixToolPostureNow(), pool.some(a => a.retreatUntil > f0), mixToolCorners() ? mixToolWho() : ""].join("|");
}
// who the orders go to, in words, for the corners layout's caption: how many follow, the one member picked, or how many are picked
function mixToolWho() {
    const sel = typeof selectedUnits !== "undefined" && selectedUnits.size && typeof ccSelectionList === "function" ? ccSelectionList() : [];
    if (!sel.length) return (typeof partyMembers === "function" ? partyMembers().length : 0) + " FOLLOWING";
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
        if (mixToolCorners()) {   // the corners layout: who the orders go to, and ONE button, ALL (lit while nobody's card is picked)
            h += '<div class="mt-to"><span>ORDERS TO</span><b>' + _mtEsc(mixToolWho()) + '</b></div><button class="mt-all' + (!sel ? ' on' : '') + '" data-scope="all" aria-label="Orders to all of the squad"><b>ALL</b></button>';
        } else {
        // WHO: the orders go to ALL, one element, or the selected roster cards (which win)
        h += '<div class="mt-who"><span class="mt-lab">' + (sel ? 'SEL ' + mixToolPool().length : 'WHO') + '</span><button class="mt-chip' + (!sel && squadMode === "all" ? ' on' : '') + '" data-scope="all" style="--c:#fff"><span>ALL</span></button>';
        ELEMENTS.filter(e => unlockedElements.has(e.id)).forEach(e => { h += '<button class="mt-chip gem' + (!sel && squadMode !== "all" && player.selectedElement === e.id ? ' on' : '') + '" data-scope="' + e.id + '" style="--c:' + e.color + '" aria-label="' + e.label + '">' + _MT_GEM(e.color, 14) + '</button>'; });
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
    if (q("[data-act=retreat]")) { mixToolRetreat(); return; }
    const atk = q("[data-act=attack]"); if (atk) { if (atk.blur) atk.blur(); mixToolAttack(_mtFoeShown && !_mtFoeShown.dead ? _mtFoeShown : null); return; }   // (blurred: a key pressed afterwards does not tap it again)
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
