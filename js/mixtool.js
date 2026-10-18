// ─────────────────────────────────────────────────────────
//  THE BATTLE TOOL — quick decisions in a fight, and the element mix: one small tool at the bottom left (it replaced the Crystal menu and the old dial)
// ─────────────────────────────────────────────────────────
// REPORTED: "I kind of just wanted to replace the crystal menu with this little selector tool, so that you can have a mix of elements for spawning the right followers." Look: docs/images/mix-selector.png
// No. 2, the honeycomb. Then: "the menu should stay open, it shouldn't close unless it's on mobile. This menu is for quick, decisive decisions in battle, like withdrawing from the fight, selecting certain
// types to attack. Not too much, not too boxy."
//   ON A TABLET OR DESKTOP it is always open (no pod, no close button, a tap on the world never puts it away). On a PHONE it is a small MIX chip that opens it (the Crystal's flag, crystalMenuOpen).
//   BATTLE TAB   WHO the orders go to (ALL or one element; selected roster cards win), RETREAT (the picked units break off and fall back to you for six seconds: they see no enemy and fire no signature
//                move), HOLD and COME, a POSTURE (DEFEND / STEADY / PUSH: the play style, how far each goes after an enemy), and a TARGET focus: STRIKER / TANK / SCOUT / BOSS makes your followers go for
//                that class of enemy first when one is within reach (npc.js), ANY puts it back to whoever is nearest.
//   MIX TAB      six hex cells round a centre hex, one for each element. TAP A CELL to put the element in the mix or take it out (a lit cell is in; at least one has to stay). The centre hex puts them
//                ALL back. A locked element is a dark cell; one you have earned the unlock for is a gold UNLOCK cell (how an earned element is brought online). Recruits, and a follower that dies after its
//                element was dropped (it comes back re-rolled, at half its level), draw from the mix (js/clone.js modulationPick); one whose element is still in the mix comes back as it was.
// The Crystal's flag is how everything else opens it: the dock's CRYSTAL button, a tap on the Crystal or the home portal, the tutorial. On a wide screen the flag is taken (it shows the MIX tab and
// goes back down); on a phone it is "the tool is open".
const MIXTOOL_TAB_KEY = "conduit_mixtool_tab";
let _mtTab = "battle", _mtSig = "";
try { if (localStorage.getItem(MIXTOOL_TAB_KEY) === "mix") _mtTab = "mix"; } catch (e) {}
// A wide screen keeps the tool open for good; a phone opens and closes it.
function mixToolWide() { return typeof innerWidth === "number" ? innerWidth > 700 : true; }
function mixToolIsOpen() { return mixToolWide() || !!crystalMenuOpen; }

function mixToolEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("mixTool") : null; }
function mixToolSetTab(t) { _mtTab = t === "mix" ? "mix" : "battle"; try { localStorage.setItem(MIXTOOL_TAB_KEY, _mtTab); } catch (e) {} mixToolRender(true); }
function mixToolSetOpen(o) { if (mixToolWide()) return; crystalMenuOpen = !!o; if (o) modulationDirty = false; if (o && typeof cloneMenuOpen !== "undefined") cloneMenuOpen = false; mixToolRender(true); }
function mixToolSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: col || "#19e6c1", life: 90, vy: -0.25, size: 12 }); }

// The elements in the mix, in the cells' order.
function mixToolParts() { return ELEMENTS.filter(e => unlockedElements.has(e.id) && modulationIncludes(e.id)); }
function mixToolPodLabel() { const p = mixToolParts(); return p.length === 1 ? p[0].label.slice(0, 3).toUpperCase() : "MIX " + p.length; }
// ALL: every unlocked element back in the mix (an empty mask is "any").
function mixToolAll() { modulationMask = new Set(); modulationDirty = false; if (typeof saveProgress === "function") saveProgress(); mixToolSay("ALL ELEMENTS IN THE MIX", "#ffe733"); mixToolRender(true); }

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
    return [mixToolIsOpen(), _mtTab, [...modulationMask].join(), [...unlockedElements].join(), pendingElements.length, !!modulationDirty, squadMode, player.selectedElement, mixToolTarget(), tot, battleFocus, mixToolPostureNow(), pool.some(a => a.retreatUntil > f0)].join("|");
}
function mixToolHTML() {
    const parts = mixToolParts(), pend = pendingElements.length > 0, choices = typeof _modChoices === "function" && pend ? _modChoices() : [], open = mixToolIsOpen();
    const f0 = typeof frame !== "undefined" ? frame : 0, bang = (pend || modulationDirty) ? '<i class="mt-bang">!</i>' : '';
    // On a phone the pod: a gold ! on it when an element unlock is waiting, or a new element has made the mix stale (RE-MODULATE). Opening the tool is the acknowledgement: it clears the second.
    let h = '<button class="mt-pod" aria-label="Mix selector">' + _MT_GEM("#ffe733", 15) + '<span>' + mixToolPodLabel() + '</span>' + (bang && !open ? bang : '') + '</button>';
    if (!open) return h;
    h += '<div class="mt-panel"><div class="mt-tabs"><button class="mt-tab' + (_mtTab === "battle" ? ' on' : '') + '" data-tab="battle">BATTLE</button><button class="mt-tab' + (_mtTab === "mix" ? ' on' : '') + '" data-tab="mix">MIX' + bang + '</button><button class="mt-x" data-act="close" aria-label="Close">\u2715</button></div>';
    if (_mtTab === "mix") {
        h += '<div class="mt-comb">';
        ELEMENTS.forEach((e, i) => {
            const un = unlockedElements.has(e.id), on = un && modulationIncludes(e.id), pick = !un && choices.indexOf(e.id) >= 0, c = MT_CELLS[i % 6];
            h += '<button class="mt-hex' + (on ? ' on' : '') + (!un && !pick ? ' locked' : '') + (pick ? ' pick' : '') + '" data-id="' + e.id + '" style="--c:' + (pick ? '#ffe733' : e.color) + ';left:' + c[0] + '%;top:' + c[1] + '%"><span class="mt-hexin">'
                + _MT_GEM(un || pick ? e.color : "#3a4666", 18) + '<b>' + (pick ? "UNLOCK" : un ? e.label.slice(0, 3).toUpperCase() : "LOCKED") + '</b></span></button>';
        });
        h += '<button class="mt-hex mt-all' + (modulationUntouched() ? ' on' : '') + '" data-all="1" style="--c:#ffe733;left:50%;top:50%"><span class="mt-hexin"><b>ALL</b><em>' + parts.length + '</em></span></button></div>';
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
        h += '<div class="mt-seg3">' + MIXTOOL_POSTURES.map(x => '<button class="' + (post === x[0] ? 'on' : post === "mixed" ? 'mix' : '') + '" data-posture="' + x[0] + '">' + x[1] + '</button>').join('') + '</div>';
        h += '<div class="mt-who"><span class="mt-lab">AIM</span><button class="mt-chip' + (!battleFocus ? ' on' : '') + '" data-focus="any" style="--c:#fff"><span>ANY</span></button>'
            + BATTLE_FOCUS_CLASSES.map(c => '<button class="mt-chip' + (battleFocus === c ? ' on' : '') + '" data-focus="' + c + '" style="--c:#ff8a5c"><span>' + c.toUpperCase() + '</span></button>').join('') + '</div>';
    }
    return h + '</div>';
}
function mixToolRender(force) {
    const root = mixToolEl(); if (!root) return;
    // On a wide screen the tool is always open, so the Crystal's flag (the dock's CRYSTAL button, a tap on the Crystal, the tutorial) is a request to SHOW THE MIX: take it and put it back down.
    if (crystalMenuOpen && mixToolWide()) { crystalMenuOpen = false; _mtTab = "mix"; modulationDirty = false; try { localStorage.setItem(MIXTOOL_TAB_KEY, _mtTab); } catch (e) {} if (typeof tutCrystalOpened !== "undefined") tutCrystalOpened = true; force = true; }
    const sig = mixToolSignature(); if (!force && sig === _mtSig) return; _mtSig = sig;
    if (mixToolIsOpen() && _mtTab === "mix") modulationDirty = false;   // looking at the mix is the acknowledgement of a RE-MODULATE prompt
    root.innerHTML = mixToolHTML(); if (root.classList) root.classList.toggle("open", mixToolIsOpen());
}
function mixToolTick() {
    const root = mixToolEl(); if (!root) return;
    const tut = typeof tutorialMode !== "undefined" && tutorialMode;
    if (document.body && document.body.classList) document.body.classList.toggle("tut-on", !!tut);   // the dock's SEL button shows while the tutorial teaches it
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
    if (q("[data-all]")) { mixToolAll(); return; }
    const cell = q(".mt-hex[data-id]");
    if (cell) {
        const id = cell.getAttribute("data-id");
        if (!unlockedElements.has(id)) {
            if (pendingElements.length > 0 && typeof _modChoices === "function" && _modChoices().indexOf(id) >= 0 && typeof activatePendingElement === "function") activatePendingElement(id);
            else { const e = ELEMENTS.find(x => x.id === id); mixToolSay((e ? e.label.toUpperCase() : "") + " IS LOCKED", "#8aa0c8"); }
        } else modulationToggle(id);
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
