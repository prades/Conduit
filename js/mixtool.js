// ─────────────────────────────────────────────────────────
//  THE MIX SELECTOR — one small tool that replaces the Crystal menu (bottom left, above the tutorial button, at every size)
// ─────────────────────────────────────────────────────────
// REPORTED: "I kind of just wanted to replace the crystal menu that's at the top with this little selector tool, so that you can activate and have a mix of different elements for spawning the
// right followers, whenever you're collecting them or whenever a bunch of them die, they'll respawn as the correct type." Look picked from docs/images/mix-selector.png: No. 2, the HONEYCOMB.
//   THE POD      a small slanted chip, "MIX 5" (how many elements are in the mix; an element's three letters when it is one). Tap it to open the tool; a gold ! on it when an element unlock is waiting.
//   MIX TAB      six hex cells round a centre hex, one for each element. TAP A CELL to put the element in the mix or take it out (a lit cell is in; at least one has to stay). The centre hex puts
//                them ALL back. A locked element is a dark cell; one you have earned the unlock for is a gold UNLOCK cell (it is how an earned element is brought online: the Crystal menu did that).
//                Recruits, and a follower that dies after its element was dropped (it comes back re-rolled, at half its level), draw from the mix (js/clone.js modulationPick); one whose element is
//                still in the mix comes back as it was.
//   COMMAND TAB  HOLD and COME (the two field orders), and who the orders go to: SELECTED cards, ALL, or one element (the old dial's element tab).
// The Crystal flag stays what it was: crystalMenuOpen is "the tool is open", so the dock's CRYSTAL button, a tap on the Crystal or the home portal, and the tutorial all open it as before.
const MIXTOOL_TAB_KEY = "conduit_mixtool_tab";
let _mtTab = "mix", _mtSig = "";
try { if (localStorage.getItem(MIXTOOL_TAB_KEY) === "command") _mtTab = "command"; } catch (e) {}

function mixToolEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("mixTool") : null; }
function mixToolSetTab(t) { _mtTab = t === "command" ? "command" : "mix"; try { localStorage.setItem(MIXTOOL_TAB_KEY, _mtTab); } catch (e) {} mixToolRender(true); }
function mixToolSetOpen(o) { crystalMenuOpen = !!o; if (o) modulationDirty = false; if (o && typeof cloneMenuOpen !== "undefined") cloneMenuOpen = false; mixToolRender(true); }
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
// A scope chip: ALL, or one element (it also lets go of the selected cards, which would otherwise win).
function mixToolScope(id) { if (typeof ccClearSelection === "function") ccClearSelection(); if (id === "all") radialSetScope(true); else radialSelectElement(id); mixToolRender(true); }

// ── drawing it ──
const _MT_GEM = (c, s) => '<svg viewBox="0 0 20 20" width="' + (s || 18) + '" height="' + (s || 18) + '"><polygon points="10,1 18,8 10,19 2,8" fill="' + c + '"/><polygon points="10,1 18,8 10,8" fill="rgba(255,255,255,0.45)"/><polygon points="2,8 10,8 10,19" fill="rgba(0,0,0,0.25)"/></svg>';
// Where the six cells sit round the centre, as percentages of the honeycomb's box: the first at the top, then clockwise.
const MT_CELLS = [[50, 18.9], [79.2, 34.4], [79.2, 65.6], [50, 81.1], [20.8, 65.6], [20.8, 34.4]];
function mixToolSignature() {
    const tot = typeof followers !== "undefined" ? followers.filter(f => f && !f.dead).length : 0;
    return [!!crystalMenuOpen, _mtTab, [...modulationMask].join(), [...unlockedElements].join(), pendingElements.length, !!modulationDirty, squadMode, player.selectedElement, mixToolTarget(), tot].join("|");
}
function mixToolHTML() {
    const parts = mixToolParts(), pend = pendingElements.length > 0, choices = typeof _modChoices === "function" && pend ? _modChoices() : [];
    // A gold ! on the pod: an element unlock is waiting, or a new element has made the mix stale (RE-MODULATE). Opening the tool is the acknowledgement: it clears the second.
    let h = '<button class="mt-pod" aria-label="Mix selector">' + _MT_GEM("#ffe733") + '<span>' + mixToolPodLabel() + '</span>' + ((pend || modulationDirty) && !crystalMenuOpen ? '<i class="mt-bang">!</i>' : '') + '</button>';
    if (!crystalMenuOpen) return h;
    h += '<div class="mt-panel"><div class="mt-tabs"><button class="mt-tab' + (_mtTab === "mix" ? ' on' : '') + '" data-tab="mix">MIX</button><button class="mt-tab' + (_mtTab === "command" ? ' on' : '') + '" data-tab="command">COMMAND</button><button class="mt-x" data-act="close" aria-label="Close">✕</button></div>';
    if (_mtTab === "mix") {
        const next = typeof nextWaveUnlock === "function" ? nextWaveUnlock() : null;
        h += '<div class="mt-comb">';
        ELEMENTS.forEach((e, i) => {
            const un = unlockedElements.has(e.id), on = un && modulationIncludes(e.id), pick = !un && choices.indexOf(e.id) >= 0, c = MT_CELLS[i % 6];
            h += '<button class="mt-hex' + (on ? ' on' : '') + (!un && !pick ? ' locked' : '') + (pick ? ' pick' : '') + '" data-id="' + e.id + '" style="--c:' + (pick ? '#ffe733' : e.color) + ';left:' + c[0] + '%;top:' + c[1] + '%"><span class="mt-hexin">'
                + _MT_GEM(un || pick ? e.color : "#3a4666", 26) + '<b>' + (pick ? "UNLOCK" : un ? e.label.slice(0, 3).toUpperCase() : "LOCKED") + '</b></span></button>';
        });
        h += '<button class="mt-hex mt-all' + (modulationUntouched() ? ' on' : '') + '" data-all="1" style="--c:#ffe733;left:50%;top:50%"><span class="mt-hexin"><b>ALL</b><em>' + parts.length + '</em></span></button></div>';
        h += '<div class="mt-hint gold">' + (pend ? (pendingElements.length > 1 ? pendingElements.length + ' UNLOCKS EARNED — CHOOSE' : 'UNLOCK EARNED — CHOOSE AN ELEMENT') : next ? 'NEXT UNLOCK: YOUR PICK — CLEAR A WAVE' : 'ALL ELEMENTS ONLINE') + '</div>'
            + '<div class="mt-hint">TAP A CELL TO PUT IT IN OR OUT · CENTRE: ALL</div>'
            + '<div class="mt-hint dim">' + (modulationUntouched() ? 'EVERYONE COMES BACK AS THEY WERE' : 'A DROPPED ELEMENT RE-ROLLS FROM THE MIX WHEN IT FALLS') + '</div>';
    } else {
        h += '<div class="mt-orders">' + MIXTOOL_ORDERS.map(o => '<button class="mt-ord" data-order="' + o.id + '" style="--c:' + o.col + '"><b>' + o.label + '</b><span>' + o.sub + '</span></button>').join('') + '</div>';
        const sel = typeof selectedUnits !== "undefined" && selectedUnits.size && ccSelectionList().length;
        h += '<div class="mt-hint">ORDERS GO TO: ' + mixToolTarget() + '</div><div class="mt-chips scope">';
        h += '<button class="mt-chip' + (!sel && squadMode === "all" ? ' on' : '') + '" data-scope="all" style="--c:#fff"><span>ALL</span></button>';
        ELEMENTS.filter(e => unlockedElements.has(e.id)).forEach(e => { h += '<button class="mt-chip' + (!sel && squadMode !== "all" && player.selectedElement === e.id ? ' on' : '') + '" data-scope="' + e.id + '" style="--c:' + e.color + '">' + _MT_GEM(e.color) + '<span>' + e.label.slice(0, 3).toUpperCase() + '</span></button>'; });
        h += '</div>';
    }
    return h + '</div>';
}
function mixToolRender(force) {
    const root = mixToolEl(); if (!root) return;
    const sig = mixToolSignature(); if (!force && sig === _mtSig) return; _mtSig = sig;
    if (crystalMenuOpen) modulationDirty = false;   // looking at the mix is the acknowledgement of a RE-MODULATE prompt
    root.innerHTML = mixToolHTML(); if (root.classList) root.classList.toggle("open", !!crystalMenuOpen);
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
    const ord = q("[data-order]"); if (ord) { mixToolOrder(ord.getAttribute("data-order")); return; }
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
        document.addEventListener("keydown", e => { if (e && e.key === "Escape" && crystalMenuOpen) mixToolSetOpen(false); });
    }
} catch (e) { /* no page (the test sandbox) */ }
