// ─────────────────────────────────────────────────────────
//  THE BATTLE TOOL — quick decisions in a fight, and the elements online: one small tool at the bottom left (it replaced the Crystal menu and the old dial)
// ─────────────────────────────────────────────────────────
// REPORTED: "I kind of just wanted to replace the crystal menu with this little selector tool, so that you can have a mix of elements for spawning the right followers." Look: docs/images/mix-selector.png
// No. 2, the honeycomb. Then: "the menu should stay open, it shouldn't close unless it's on mobile. This menu is for quick, decisive decisions in battle, like withdrawing from the fight, selecting certain
// types to attack. Not too much, not too boxy."
//   ON A TABLET OR DESKTOP it is always open (no pod, no close button, a tap on the world never puts it away). On a PHONE it is a CRYSTAL chip that opens it (the Crystal's flag, crystalMenuOpen).
//   BATTLE TAB   WHO the orders go to (ALL or one element: the ELEMENT SELECTOR; selected roster cards win), RETREAT (the picked units break off and fall back to you for six seconds: they see no enemy and fire
//                no signature move), HOLD and COME. (It used to carry a POSTURE and a TARGET focus too: the functions are still here, the rows are gone: docs/TUTORIAL.md, "Targeting".)
//   ELEMENTS TAB six hex cells round a centre hex, one for each element: a lit cell is an element that is online, a dark one is locked, and one you have earned the unlock for is a gold UNLOCK cell (tap it:
//                that is how an earned element is brought online). There is no mix to narrow: every element online makes followers (an even draw, js/clone.js modulationPick), and what a follower IS
//                (a brawler, a mage, a technician) is how it was found: the player does not choose it (js/species.js FOLLOWER_TYPES).
// The Crystal's flag is how everything else opens it: a tap on the Crystal or the home portal. On a wide screen the flag is taken (it shows the ELEMENTS tab and
// goes back down); on a phone it is "the tool is open".
const MIXTOOL_TAB_KEY = "conduit_mixtool_tab";
let _mtTab = "battle", _mtSig = "";
try { const v = localStorage.getItem(MIXTOOL_TAB_KEY); if (v === "mix" || v === "elements") _mtTab = "elements"; } catch (e) {}
// A wide screen keeps the tool open for good; a phone opens and closes it.
function mixToolWide() { return typeof innerWidth === "number" ? innerWidth > 700 : true; }
function mixToolIsOpen() { return mixToolWide() || !!crystalMenuOpen; }

function mixToolEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("mixTool") : null; }
function mixToolSetTab(t) { _mtTab = t === "elements" ? "elements" : "battle"; try { localStorage.setItem(MIXTOOL_TAB_KEY, _mtTab); } catch (e) {} mixToolRender(true); }
function mixToolSetOpen(o) { if (mixToolWide()) return; crystalMenuOpen = !!o; if (o && typeof cloneMenuOpen !== "undefined") cloneMenuOpen = false; mixToolRender(true); }
function mixToolSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: col || "#19e6c1", life: 90, vy: -0.25, size: 12 }); }

// The elements online, in the cells' order.
function mixToolParts() { return ELEMENTS.filter(e => unlockedElements.has(e.id)); }
function mixToolPodLabel() { const p = mixToolParts(); return "CRYSTAL " + (p.length === 1 ? p[0].label.slice(0, 3).toUpperCase() : p.length); }
// ── the field orders (the dial's old COMMAND module) ──
const MIXTOOL_ORDERS = [
    { id: "hold",   label: "HOLD", sub: "STAND HERE",   col: "#8fe3ff", run: p => ccApplyStance(p, "hold") },
    { id: "follow", label: "COME", sub: "FOLLOW ME",    col: "#19e6c1", run: p => ccApplyStance(p, "follow") },
];
function mixToolPool() { return typeof getCommandPool === "function" ? getCommandPool().filter(a => a && !a.dead) : []; }
// Who the orders go to, in words.
function mixToolTarget() {
    const n = mixToolPool().length;
    if (typeof selectedUnits !== "undefined" && selectedUnits.size && ccSelectionList().length) return "SELECTED " + n;
    if (squadMode === "all") return "EVERYONE " + n;
    return String(player.selectedElement || "").toUpperCase() + " " + n;
}
function mixToolOrder(id) {
    const o = MIXTOOL_ORDERS.find(x => x.id === id), pool = mixToolPool();
    if (!o || !pool.length) { mixToolSay("NOBODY TO ORDER", "#8aa0c8"); return 0; }
    const n = o.run(pool); mixToolSay(o.label + " · " + n + " OF " + pool.length, o.col); return n;
}
// RETREAT: the picked units break off. For BATTLE_RETREAT_FRAMES they see no enemy (npc.js) and fire no signature move (evolution.js); they fall back to the player, who is where they follow.
function mixToolRetreat() {
    const pool = mixToolPool().filter(a => !a.isClone); if (!pool.length) { mixToolSay("NOBODY TO PULL BACK", "#8aa0c8"); return 0; }
    const f0 = typeof frame !== "undefined" ? frame : 0;
    for (const a of pool) { a.retreatUntil = f0 + BATTLE_RETREAT_FRAMES; if (a.job && a.job.type === "move") a.job = null; a.stance = "follow"; a._nearestEnemy = null; a._enemyCacheFrame = 0; }
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
function mixToolScope(id) { if (typeof ccClearSelection === "function") ccClearSelection(); if (id === "all") radialSetScope(true); else radialSelectElement(id); mixToolRender(true); }

// ── drawing it ──
const _MT_GEM = (c, s) => '<svg viewBox="0 0 20 20" width="' + (s || 18) + '" height="' + (s || 18) + '"><polygon points="10,1 18,8 10,19 2,8" fill="' + c + '"/><polygon points="10,1 18,8 10,8" fill="rgba(255,255,255,0.45)"/><polygon points="2,8 10,8 10,19" fill="rgba(0,0,0,0.25)"/></svg>';
// Where the six cells sit round the centre, as percentages of the honeycomb's box: the first at the top, then clockwise.
const MT_CELLS = [[50, 18.9], [79.2, 34.4], [79.2, 65.6], [50, 81.1], [20.8, 65.6], [20.8, 34.4]];
function mixToolSignature() {
    const tot = typeof followers !== "undefined" ? followers.filter(f => f && !f.dead).length : 0;
    const f0 = typeof frame !== "undefined" ? frame : 0, pool = mixToolPool();
    return [mixToolIsOpen(), _mtTab, [...unlockedElements].join(), pendingElements.length, squadMode, player.selectedElement, mixToolTarget(), tot, battleFocus, mixToolPostureNow(), pool.some(a => a.retreatUntil > f0)].join("|");
}
function mixToolHTML() {
    const parts = mixToolParts(), pend = pendingElements.length > 0, choices = typeof _modChoices === "function" && pend ? _modChoices() : [], open = mixToolIsOpen();
    const f0 = typeof frame !== "undefined" ? frame : 0, bang = pend ? '<i class="mt-bang">!</i>' : '';
    // On a phone the pod: a gold ! on it when an element unlock is waiting.
    let h = '<button class="mt-pod" aria-label="Battle orders and elements">' + _MT_GEM("#ffe733", 15) + '<span>' + mixToolPodLabel() + '</span>' + (bang && !open ? bang : '') + '</button>';
    if (!open) return h;
    h += '<div class="mt-panel"><div class="mt-tabs"><button class="mt-tab' + (_mtTab === "battle" ? ' on' : '') + '" data-tab="battle">BATTLE</button><button class="mt-tab' + (_mtTab === "elements" ? ' on' : '') + '" data-tab="elements">' + _MT_GEM("#ffe733", 15) + 'ELEMENTS' + bang + '</button><button class="mt-x" data-act="close" aria-label="Close">\u2715</button></div>';
    if (_mtTab === "elements") {
        h += '<div class="mt-comb">';
        ELEMENTS.forEach((e, i) => {
            const un = unlockedElements.has(e.id), on = un, pick = !un && choices.indexOf(e.id) >= 0, c = MT_CELLS[i % 6];
            h += '<button class="mt-hex' + (on ? ' on' : '') + (!un && !pick ? ' locked' : '') + (pick ? ' pick' : '') + '" data-id="' + e.id + '" style="--c:' + (pick ? '#ffe733' : e.color) + ';left:' + c[0] + '%;top:' + c[1] + '%"><span class="mt-hexin">'
                + _MT_GEM(un || pick ? e.color : "#3a4666", 18) + '<b>' + (pick ? "UNLOCK" : un ? e.label.slice(0, 3).toUpperCase() : "LOCKED") + '</b></span></button>';
        });
        h += '<span class="mt-hex mt-all on" style="--c:#ffe733;left:50%;top:50%"><span class="mt-hexin"><b>' + parts.length + '</b><em>ONLINE</em></span></span></div>';
        // one line, and only when there is something to say: an unlock is waiting
        if (pend) h += '<div class="mt-hint gold">' + (pendingElements.length > 1 ? pendingElements.length + ' UNLOCKS EARNED' : 'UNLOCK EARNED') + ' \u2014 TAP GOLD</div>';
    } else {
        const sel = typeof selectedUnits !== "undefined" && selectedUnits.size && ccSelectionList().length, post = mixToolPostureNow(), pool = mixToolPool(), going = pool.some(a => a.retreatUntil > f0);
        // WHO: the orders go to ALL, one element, or the selected roster cards (which win)
        h += '<div class="mt-who"><span class="mt-lab">' + (sel ? 'SEL ' + mixToolPool().length : 'WHO') + '</span><button class="mt-chip' + (!sel && squadMode === "all" ? ' on' : '') + '" data-scope="all" style="--c:#fff"><span>ALL</span></button>';
        ELEMENTS.filter(e => unlockedElements.has(e.id)).forEach(e => { h += '<button class="mt-chip gem' + (!sel && squadMode !== "all" && player.selectedElement === e.id ? ' on' : '') + '" data-scope="' + e.id + '" style="--c:' + e.color + '" aria-label="' + e.label + '">' + _MT_GEM(e.color, 14) + '</button>'; });
        h += '</div>';
        h += '<button class="mt-retreat' + (going ? ' going' : '') + '" data-act="retreat"><b>' + (going ? 'FALLING BACK' : 'RETREAT') + '</b></button>';
        h += '<div class="mt-orders">' + MIXTOOL_ORDERS.map(o => '<button class="mt-ord" data-order="' + o.id + '" style="--c:' + o.col + '"><b>' + o.label + '</b></button>').join('') + '</div>';
    }
    return h + '</div>';
}
function mixToolRender(force) {
    const root = mixToolEl(); if (!root) return;
    // On a wide screen the tool is always open, so the Crystal's flag (a tap on the Crystal) is a request to SHOW THE ELEMENTS: take it and put it back down.
    if (crystalMenuOpen && mixToolWide()) { crystalMenuOpen = false; _mtTab = "elements"; try { localStorage.setItem(MIXTOOL_TAB_KEY, _mtTab); } catch (e) {} force = true; }
    const sig = mixToolSignature(); if (!force && sig === _mtSig) return; _mtSig = sig;
    root.innerHTML = mixToolHTML(); if (root.classList) root.classList.toggle("open", mixToolIsOpen());
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
    const tab = q("[data-tab]"); if (tab) { mixToolSetTab(tab.getAttribute("data-tab")); return; }
    if (q("[data-act=retreat]")) { mixToolRetreat(); return; }
    const ord = q("[data-order]"); if (ord) { mixToolOrder(ord.getAttribute("data-order")); return; }
    const po = q("[data-posture]"); if (po) { mixToolPosture(po.getAttribute("data-posture")); return; }
    const fo = q("[data-focus]"); if (fo) { mixToolFocus(fo.getAttribute("data-focus")); return; }
    const sc = q("[data-scope]"); if (sc) { mixToolScope(sc.getAttribute("data-scope")); return; }
    const cell = q(".mt-hex[data-id]");
    if (cell) {
        const id = cell.getAttribute("data-id");
        if (!unlockedElements.has(id)) {
            if (pendingElements.length > 0 && typeof _modChoices === "function" && _modChoices().indexOf(id) >= 0 && typeof activatePendingElement === "function") activatePendingElement(id);
            else { const e = ELEMENTS.find(x => x.id === id); mixToolSay((e ? e.label.toUpperCase() : "") + " IS LOCKED", "#8aa0c8"); }
        }
        mixToolRender(true);
    }
}
try {
    const root = mixToolEl();
    if (root) {
        mixToolRender(true);
        root.addEventListener("click", mixToolClick);
        document.addEventListener("keydown", e => { if (e && e.key === "Escape" && crystalMenuOpen && !mixToolWide()) mixToolSetOpen(false); });
    }
} catch (e) { /* no page (the test sandbox) */ }
