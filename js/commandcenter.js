// ─────────────────────────────────────────────────────────
//  THE COMMAND CENTER — the tablet and desktop menu (docs/UI-STYLE.md)
// ─────────────────────────────────────────────────────────
// REPORTED: "make the iPad and browser version have a menu at the bottom that has all the different menus and rosters and all that. It can take
// up the screen when accessing the roster and command center. I want the player to be able to select their creatures by clicking their card and
// changing their attack and play style. This replaces the current index."
//
// The bottom dock (game.html #topToggles) has ONE button, ROSTER, that opens this full-screen overlay (the old COMMAND page is merged into its right-hand
// panel: "the command center and roster are really the same thing"). One page, and one window over it:
//
//   ROSTER   every follower and clone as a CARD. On a phone, clicking a card selects it (click again to let it go); the right-hand panel then changes the
//            whole selection at once: ADD TO / REMOVE FROM / SWAP into THE SQUAD (js/party.js), ATTACK STYLE (brawler / mage / technician), PLAY STYLE
//            (defensive / balanced / aggressive) and RE-ROLL. A tablet or a desktop shows it as THE CAROUSEL (below).
//   SQUADS   the button at the top opens YOUR SQUAD: the squad's three cards (REMOVE on each), DISBAND SQUAD, and the squad's orders (who the world
//            commands go to, SWITCH ROLES).
//
// The selection is REAL: while any selected unit is alive, getCommandPool() (js/helpers.js) is the selection, so a long-press move or attack order
// in the world goes to exactly those units. A teal ring marks them on the ground. The old canvas index (ELEM / UNITS / CLONES) is gone with ui.js:
// game.js and input.js still ask indexReplaced() before drawing or tapping it.
// (The ZONES page, the roster squads A / B / C, the DUTY setting and the build order picker were the strip game's: gone with it. Nobody works.)
//
// PLAY STYLE is an engagement reach (PLAY_STYLES): a DEFENSIVE unit only takes on enemies close to it, an AGGRESSIVE one goes after enemies much
// further out (npc.js multiplies its role's reach by playReach()). It is saved with the follower.
//
// THE CAROUSEL (the facility on a tablet or a desktop: hudCorners(), js/party.js; ASKED: the "Roster 5 · CAROUSEL" layout, "but no recruit button at the top"). The roster is ONE creature at a time: the squad's three slots across the top (a tap
// looks at that member, ✕ REMOVE takes it out, DISBAND the lot), the creature in view big in the middle with ◂ ▸ to walk the roster and its settings beside it (ATTACK STYLE, PLAY STYLE, RE-ROLL, INFO and its base stats), the filters and a strip
// of everyone under that (the squad first, a RECRUIT tile at its end), and one bar at the foot: ADD TO SQUAD, SWAP IN FOR one of the three, or REMOVE. What is in view is the roster's own FOCUS (_ccFocus): looking at a creature does not change
// who the orders in the world go to (that is the squad bar's pick: js/squadfly.js), and the settings and the squad buttons are for the one in view. A phone keeps the grid of cards and the side panel below.

const PLAY_STYLES = [
    { id: "defensive",  label: "DEFENSIVE",  reach: 0.6, blurb: "ONLY FIGHTS WHAT COMES CLOSE" },
    { id: "balanced",   label: "BALANCED",   reach: 1.0, blurb: "THE USUAL REACH" },
    { id: "aggressive", label: "AGGRESSIVE", reach: 1.7, blurb: "GOES AFTER ENEMIES FAR OUT" },
];
const ATTACK_STYLES = [
    { id: "brawler", label: "BRAWLER",    col: "#ff4a1c", blurb: "CLOSES IN AND FIGHTS" },
    { id: "sniper",  label: "MAGE",       col: "#a64dff", blurb: "FIRES FROM A DISTANCE" },
    { id: "camper",  label: "TECHNICIAN", col: "#8fe3ff", blurb: "HOLDS A POST" },
];
const CC_REFRESH_MS = 400;

// The reach multiplier of a unit's play style (1 when it has none). npc.js asks.
function playReach(actor) {
    const s = actor && actor.playStyle, p = s && PLAY_STYLES.find(x => x.id === s);
    return p ? p.reach : 1;
}

// ── THE SELECTION ──
let selectedUnits = new Set();
function ccSelectionList() { return [...selectedUnits].filter(a => a && !a.dead && a.team === "green"); }
function ccPrune() {
    for (const a of [...selectedUnits]) if (!a || a.dead || a.team !== "green" || (a.isFollower === false && !a.isClone)) selectedUnits.delete(a);
}
function ccToggle(a) { if (!a) return false; if (selectedUnits.has(a)) { selectedUnits.delete(a); return false; } selectedUnits.add(a); return true; }
function ccSetSelection(list) { selectedUnits = new Set((list || []).filter(Boolean)); }
function ccClearSelection() { selectedUnits.clear(); }

// Everyone on your side, as the roster shows them (followers, then clones). `filter` narrows: { element, role, kind, squad } (squad: "in" or "out" of the squad of three, js/party.js).
function ccUnits(filter) {
    const f = filter || {};
    const fol = (typeof followers !== "undefined" ? followers : []).filter(a => a && !a.dead && !a.isClone && a.team === "green");
    const clo = (typeof actors !== "undefined" ? actors : []).filter(a => a && a.isClone && !a.dead && a.team === "green");
    let list = f.kind === "clone" ? clo : f.kind === "follower" ? fol : fol.concat(clo);
    if (f.element) list = list.filter(a => a.element === f.element);
    if (f.role) list = list.filter(a => !a.isClone && a.role === f.role);
    if (f.squad) list = list.filter(a => !a.isClone && (f.squad === "in") === (typeof partyIsMember === "function" && partyIsMember(a)));
    return list;
}
function ccRow(a) {
    const hp = Math.max(0, Math.min(1, (a.health || 0) / (a.maxHealth || 1)));
    const ps = PLAY_STYLES.find(p => p.id === a.playStyle) || PLAY_STYLES[1];
    return {
        unit: a, clone: !!a.isClone, element: a.element, hp, level: a.level || 1, evolved: !!a.evolved,
        name: typeof unitTypeLabel === "function" ? unitTypeLabel(a) : String(a.speciesName || a.element || "UNIT").toUpperCase(),
        role: a.isClone ? null : a.role, holding: !!(a.job && a.job.type === "move") || a.stance === "hold",
        playStyle: ps.id, selected: selectedUnits.has(a), status: typeof unitStatus === "function" ? unitStatus(a) : null,
    };
}

// ── THE ORDERS (each is the existing game action) ──
// Attack style: a follower's role. An evolved form keeps its role (js/evolution.js), a clone has none. Returns how many changed.
function ccApplyRole(units, role) {
    if (!ATTACK_STYLES.some(s => s.id === role)) return 0;
    let n = 0;
    for (const a of units) { if (!a || a.dead || a.isClone || a.evolved || a.role === role) continue; a.role = role; n++; }
    return n;
}
function ccApplyPlayStyle(units, id) {
    if (!PLAY_STYLES.some(p => p.id === id)) return 0;
    let n = 0;
    for (const a of units) { if (!a || a.dead || a.isClone) continue; a.playStyle = id; n++; }
    return n;
}
// Stance (the battle tool's HOLD and COME, js/mixtool.js): HOLD posts each follower in the room it is in, COME calls it back to the squad (js/party.js partyApplyStance, which
// hands the clones to _ccApplyStanceUnits: a clone has no post, it holds where it stands).
function ccApplyStance(units, stance) { return partyApplyStance(units, stance); }
// HOLD stands each unit where it is (a standing post, like the move order); FOLLOW lets it go back to following you.
function _ccApplyStanceUnits(units, stance) {
    let n = 0;
    for (const a of units) {
        if (!a || a.dead) continue;
        if (stance === "hold") { a.attackOrder = null; a.job = { type: "move", target: { x: a.x, y: a.y } }; a.stance = "hold"; n++; }
        else if (stance === "follow") { a.attackOrder = null; if (a.job && a.job.type === "move") a.job = null; a.stance = "follow"; n++; }   // (either one ends an ATTACK order from the enemy card, js/mixtool.js)
    }
    return n;
}
function ccApplyReroll(units) {
    let n = 0;
    for (const a of units) if (typeof startFollowerReroll === "function" && !a.isClone && startFollowerReroll(a, true)) { selectedUnits.delete(a); n++; }
    if (n && typeof floatingTexts !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: n + " RE-ROLLING AT THE CRYSTAL", color: "#0df", life: 100, vy: -0.25, size: 12 });
    return n;
}
// What the whole selection has in common: the value when all agree, "mixed" when they do not, null with nobody.
function ccCommon(units, get) {
    const vals = units.map(get); if (!vals.length) return null;
    return vals.every(v => v === vals[0]) ? vals[0] : "mixed";
}
function ccSelectionSummary(list) {   // (of the units picked, or of `list`: the carousel's settings are for the creature in view, js/commandcenter.js ccCarousel)
    const sel = list || ccSelectionList(), fol = sel.filter(a => !a.isClone);
    return {
        count: sel.length, followers: fol.length, clones: sel.length - fol.length,
        role: ccCommon(fol.filter(a => !a.evolved), a => a.role), lockedRole: fol.filter(a => a.evolved).length,
        playStyle: ccCommon(fol, a => a.playStyle || "balanced"),
        stance: ccCommon(sel, a => (a.job && a.job.type === "move") || a.stance === "hold" ? "hold" : "follow"),
    };
}

// The old canvas index (ELEM / UNITS / CLONES) is gone with ui.js; game.js and input.js still ask this before drawing or tapping it, and skip it while this is true.
function indexReplaced() { return true; }

// ── a ring on the ground under each selected unit ──
// Where a unit's feet are, below the point the game draws it at (px, py): an evolved form stands ON that point (its sprite's anchor and its shadow), an
// egg's legs end about 18px below it, a clone's body sits a little below. The ring is centred there, not on the tile's middle (TILE_H lower).
function ccGroundOffset(a) { return a && a.evolved ? 2 : a && a.isClone ? 4 : 0; }
function drawSelectedUnitRings() {
    if (!selectedUnits.size || typeof ctx === "undefined" || typeof player === "undefined") return;
    const W = canvas.width / 2, H = canvas.height / 2, t = (typeof frame !== "undefined" ? frame : 0) * 0.08;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const a of selectedUnits) {
        if (!a || a.dead) continue;
        const px = (a.x - player.visualX - (a.y - player.visualY)) * TILE_W + W, py = (a.x - player.visualX + (a.y - player.visualY)) * TILE_H + H + ccGroundOffset(a), rx = a.evolved ? 34 : 26, ry = a.evolved ? 15 : 12;
        if (px < -60 || px > canvas.width + 60 || py < -60 || py > canvas.height + 60) continue;
        // (no shadowBlur: the game keeps it off the canvas for speed. A wider, fainter ring under the sharp one gives the glow.)
        ctx.lineWidth = 7; ctx.strokeStyle = "rgba(25,230,193,0.22)"; ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(25,230,193," + (0.7 + 0.25 * Math.sin(t + a.x)) + ")"; ctx.beginPath(); ctx.ellipse(px, py, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
}

// ═════════ THE OVERLAY (DOM) ═════════
let _ccSideSig = "";   // the side panel is redrawn only when what it shows changes: a redraw every tick lost taps and sent the panel back to its top
let ccSquadsOpen = false, _ccDD = null, _ccSqWinSig = "";   // the SQUADS window (YOUR SQUAD), redrawn the same way; the one settings drop-down that is open in the side panel
let ccOpenTab = null, ccFilter = { element: null, role: null, kind: null, squad: null }, ccRerollArmed = false, _ccTimer = 0;   // ccOpenTab: "roster" while the overlay is open (its one page), null when it is shut
const _ccCards = new Map();   // unit → its card element (updated in place, so a click is never lost to a redraw)

function _ccEl(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function _ccClick(el, fn) { el.addEventListener("click", ev => { ev.stopPropagation(); fn(ev); }); }
function _ccColour(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.color : "#8aa0c8"; }
function _ccElLabel(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.label : String(id || "").toUpperCase(); }

// ── THE CAROUSEL: which creature is in view, and the order the strip and the arrows walk ──
function ccCarousel() { return typeof hudCorners === "function" && hudCorners(); }
let _ccFocus = null;   // the creature in view (the roster's own pick: not the selection the orders in the world follow)
let _ccSwapSig = "", _ccFiltSig = "", _ccUidN = 0;
function _ccUid(u) { return u._ccUid || (u._ccUid = ++_ccUidN); }
// the strip's order: the squad in its slots, then the rest (the most evolved, then the highest level, first), then the clones
function _ccStripSort(a, b) {
    const ma = partyIsMember(a), mb = partyIsMember(b);
    if (ma !== mb) return ma ? -1 : 1;
    if (ma) return (a.partySlot || 0) - (b.partySlot || 0);
    if (!!a.isClone !== !!b.isClone) return a.isClone ? 1 : -1;
    return (!!b.evolved - !!a.evolved) || ((b.level || 1) - (a.level || 1));
}
function _ccStripUnits() { return ccUnits(ccFilter).sort(_ccStripSort); }
// the creature in view stays the same one until it is gone (dead, made again): then the one that is picked on its own (the ring's ROSTER CARD), else the first the strip lists (a squad member first), else anyone
function _ccFocusEnsure() {
    const all = ccUnits({});
    if (_ccFocus && all.indexOf(_ccFocus) >= 0) return _ccFocus;
    const sel = ccSelectionList().filter(a => all.indexOf(a) >= 0);
    _ccFocus = (sel.length === 1 ? sel[0] : null) || _ccStripUnits()[0] || all.sort(_ccStripSort)[0] || null;
    return _ccFocus;
}
// the next one in the strip's order to the creature in view (`dir` 1), or the one before it (-1), going round; null when it is the only one
function _ccNeighbour(u, dir) {
    const list = _ccStripUnits(), n = list.length, i = list.indexOf(u); if (n < 2) return null;
    return list[i < 0 ? (dir > 0 ? 0 : n - 1) : (i + dir + n) % n];
}
// the strip scrolls only far enough to show the card in view (never the page)
function _ccScrollToFocus() {
    const grid = document.getElementById("ccGrid"), card = _ccFocus && _ccCards.get(_ccFocus); if (!grid || !card || typeof grid.getBoundingClientRect !== "function" || typeof card.getBoundingClientRect !== "function") return;
    const g = grid.getBoundingClientRect(), c = card.getBoundingClientRect();
    if (c.left < g.left + 8) grid.scrollLeft += c.left - g.left - 8; else if (c.right > g.right - 8) grid.scrollLeft += c.right - g.right + 8;
}
function ccFocusSet(u) {
    if (!u || u.dead) return false;
    _ccFocus = u; _ccDD = null; ccRerollArmed = false; if (ccOpenTab) ccRender(); _ccScrollToFocus(); return true;
}
function ccFocusStep(dir) { const nb = _ccNeighbour(_ccFocus, dir); return nb ? ccFocusSet(nb) : false; }

function ccOpen() {
    // The overlay has one page, the ROSTER (the creature cards and the command panel); the callers still say ccOpen("roster"). "command" was a tab of its own (it is the
    // roster's right-hand panel now); "squad" was the old analytics tab, then the ZONES page, which went with the zones.
    if (!ccOpenTab) _ccFocus = null;   // (the carousel opens on the creature picked on its own, else the squad's first)
    ccOpenTab = "roster"; ccRerollArmed = false;
    const root = document.getElementById("ccRoot"); if (!root) return;
    root.classList.add("open"); document.body.classList.add("ccOpen");
    clearInterval(_ccTimer); _ccTimer = setInterval(ccRender, CC_REFRESH_MS);
    ccBuildFrame(); ccRender();
}
function ccClose() {
    ccFilter.squad = null;   // (the list of who could fill an open slot is put away with the roster: the next ROSTER shows everyone)
    ccOpenTab = null; ccRerollArmed = false; ccSquadsOpen = false; _ccDD = null; clearInterval(_ccTimer); _ccTimer = 0;
    _ccFocus = null; _ccSwapSig = ""; _ccFiltSig = "";
    const root = document.getElementById("ccRoot"); if (root) root.classList.remove("open");
    if (document.body) document.body.classList.remove("ccOpen");
    _ccCards.clear();
    const grid = document.getElementById("ccGrid"); if (grid) grid.textContent = "";
}
// The roster with this unit picked and its card in view (the long-press ring's ROSTER CARD): the carousel shows it in the middle, the grid scrolls to its card.
function ccShowUnit(u) {
    if (!u || u.dead) return false;
    ccSetSelection([u]); ccOpen();
    if (ccCarousel()) { ccFocusSet(u); return true; }
    const card = _ccCards.get(u); if (card && card.scrollIntoView) card.scrollIntoView({ block: "center" });
    return true;
}
function ccToggleOpen() { if (ccOpenTab) ccClose(); else ccOpen(); }   // (the dock's ROSTER button)

function ccBuildFrame() {
    const root = document.getElementById("ccRoot"); if (!root || root.getAttribute("data-built")) return;
    root.setAttribute("data-built", "1");
    const head = _ccEl("div", "cc-head"); const tb = _ccEl("div", "cc-titlebox"); const ttl = _ccEl("div", "cc-title", "COMMAND CENTER"); ttl.id = "ccTitle"; tb.appendChild(ttl);
    const sum = _ccEl("div", "cc-summary"); sum.id = "ccSummary"; tb.appendChild(sum); head.appendChild(tb);   // the squad at a glance, under the title, on the roster
    // RECRUIT: a follower at the Crystal for RECRUIT_COST shards (clone.js recruitFollower). It dims when the shards are short. (A phone's: the carousel's RECRUIT is the strip's last tile.)
    const rec = _ccEl("button", "cc-recruit"); rec.id = "ccRecruit"; rec.appendChild(_ccEl("span", "cc-rl", "+ RECRUIT")); rec.appendChild(_ccEl("span", "cc-rs", ""));
    _ccClick(rec, () => { recruitDo(); });   // a follower at the Crystal: its type and its element are whatever it turns out to be (js/clone.js)
    // THE SHARD TOTAL, so a recruit is never a shot in the dark: what you have, what a recruit costs, how many you can afford (red when you cannot afford one)
    const sh = _ccEl("div", "cc-shards"); sh.id = "ccShards"; sh.appendChild(_ccEl("div", "cc-sh-n")); sh.appendChild(_ccEl("div", "cc-sh-c")); head.appendChild(sh);
    head.appendChild(rec);
    const sqb = _ccEl("button", "cc-close cc-sqbtn", "SQUADS"); sqb.id = "ccSquadsBtn"; _ccClick(sqb, () => { ccSquadsOpen = !ccSquadsOpen; ccRender(); }); head.appendChild(sqb);   // (opens YOUR SQUAD, the window below)
    const x = _ccEl("button", "cc-close", "✕ CLOSE"); x.id = "ccClose"; _ccClick(x, ccClose); head.appendChild(x); root.appendChild(head);
    const body = _ccEl("div", "cc-body"); body.id = "ccBody";
    const main = _ccEl("div", "cc-main"); main.id = "ccMain";
    // THE SQUAD BOX (the facility; js/party.js partyBoxRender): the squad's three cards at the top of the roster, so the whole squad is in view without opening SQUADS
    const sqx = _ccEl("div", "cc-sqbox"); sqx.id = "ccSquadBoxWrap"; const sqh = _ccEl("div", "cc-sqbox-h"); const sqc = _ccEl("span", null, "YOUR SQUAD"); sqc.id = "ccSquadCount"; sqh.appendChild(sqc); sqh.appendChild(_ccEl("i", null, "SELECT A FOLLOWER BELOW TO ADD, REMOVE OR SWAP IT")); sqx.appendChild(sqh);
    const sqr = _ccEl("div", "cc-sqbox-row"), sqb2 = _ccEl("div"); sqb2.id = "ccSquadBox"; sqr.appendChild(sqb2);
    const dis = _ccEl("button", "cc-disband", "DISBAND"); dis.id = "ccDisband"; _ccClick(dis, () => { if (typeof partyDisband === "function") partyDisband(); ccRender(); }); sqr.appendChild(dis);   // (the carousel's: every member holds the room it is in; the squad's slots are empty)
    sqx.appendChild(sqr); main.appendChild(sqx);
    const foc = _ccEl("div", "cc-focus"); foc.id = "ccFocus"; main.appendChild(foc);   // THE CAROUSEL: the creature in view, big (js/commandcenter.js ccCarousel)
    main.appendChild(_ccEl("div", "cc-filters")); main.lastChild.id = "ccFilters";
    const grid = _ccEl("div", "cc-grid"); grid.id = "ccGrid"; main.appendChild(grid);
    const swp = _ccEl("div", "cc-swap"); swp.id = "ccSwap"; main.appendChild(swp);   // THE CAROUSEL: add it to the squad, swap it in for one of the three, or take it out
    body.appendChild(main);
    const side = _ccEl("div", "cc-side"); side.id = "ccSide"; body.appendChild(side);
    root.appendChild(body);
    // THE SQUADS WINDOW: YOUR SQUAD (js/party.js; drawn by _ccDrawYourSquad), over the roster, so the squad's cards and its orders are not crammed into the card area
    const win = _ccEl("div", "cc-sqwin"); win.id = "ccSquadWin"; const card = _ccEl("div", "cc-sqcard yours"); const hd = _ccEl("div", "cc-sqhead"); const sqt = _ccEl("div", "cc-sel-title", "YOUR SQUAD"); sqt.id = "ccSquadTitle"; hd.appendChild(sqt);
    const xs = _ccEl("button", "cc-close", "✕ BACK TO ROSTER"); _ccClick(xs, () => { ccSquadsOpen = false; ccRender(); }); hd.appendChild(xs); card.appendChild(hd);
    const sb = _ccEl("div", "cc-sqbody"); sb.id = "ccSquadBody"; card.appendChild(sb); win.appendChild(card); root.appendChild(win);
    window.addEventListener("keydown", e => {
        if (!e || !ccOpenTab) return;
        if (e.key === "Escape") { if (ccSquadsOpen) { ccSquadsOpen = false; ccRender(); } else ccClose(); }
        else if ((e.key === "ArrowLeft" || e.key === "ArrowRight") && !ccSquadsOpen && ccCarousel() && !document.getElementById("unitInfo")) ccFocusStep(e.key === "ArrowRight" ? 1 : -1);   // (the arrows walk the roster)
    });
}

// An OPEN SLOT (in the roster's squad box, or on the bar over the dock) lists the followers that could fill it: the roster, filtered to NOT IN SQUAD, with nothing selected, so that the next tap picks exactly one.
function ccShowCandidates() {
    const car = ccCarousel();
    if (!car) ccClearSelection();   // (a phone: nothing selected, so the next tap picks exactly one)
    ccFilter = { element: null, role: null, kind: null, squad: "out" };
    if (!ccOpenTab) ccOpen();
    if (car) { const first = ccUnits({ squad: "out" }).sort(_ccStripSort)[0]; if (first) _ccFocus = first; }   // (the carousel puts the first of them in view, ADD TO SQUAD is for it; looking does not change the pick the orders follow)
    ccRender();
}

// A chip / button factory for the panels.
function _ccBtn(label, col, on, fn, cls, sub) {
    const b = _ccEl("button", "cc-btn" + (on === true ? " on" : on === "mixed" ? " mix" : "") + (cls ? " " + cls : ""));
    b.style.setProperty("--c", col || "#19e6c1"); b.appendChild(_ccEl("span", "cc-bl", label)); if (sub) b.appendChild(_ccEl("span", "cc-bs", sub));
    _ccClick(b, () => { fn(); ccRender(); }); return b;
}

function ccRender() {
    const root = document.getElementById("ccRoot"); if (!root || !ccOpenTab) return;
    ccPrune();
    const car = ccCarousel();   // the carousel: the header's slab buttons and the one-creature layout (a phone keeps the grid of cards and the side panel)
    if (root.classList) { root.classList.toggle("slabs", car); root.classList.toggle("carousel", car); }
    if (car) _ccFocusEnsure();
    const rec = document.getElementById("ccRecruit");
    const shp = document.getElementById("ccShards"); if (shp) ccShardsUpdate(shp, car);
    if (rec) { rec.style.display = ccOpenTab === "roster" && !car ? "" : "none"; const cost = typeof RECRUIT_COST !== "undefined" ? RECRUIT_COST : 30, can = shardCount >= cost; rec.classList.toggle("dim", !can); const rs = rec.querySelector(".cc-rs"); if (rs) rs.textContent = "\u25c6" + cost; }   // (the carousel has no recruit button at the top: its RECRUIT is the last tile of the strip)
    const sum = document.getElementById("ccSummary");
    if (sum) sum.textContent = "SQUAD " + partyMembers().length + "/" + PARTY.max + " \u00b7 " + partyPosted().length + " POSTED \u00b7 " + radialSquadStats().total + " UNITS";   // (how full the squad is, who holds rooms, how many followers there are)
    const sqBtn = document.getElementById("ccSquadsBtn"); if (sqBtn) sqBtn.classList.toggle("on", ccSquadsOpen);
    partyBoxRender(); { const c = document.getElementById("ccSquadCount"); if (c) c.textContent = "YOUR SQUAD \u00b7 " + partyMembers().length + " / " + PARTY.max; const dis = document.getElementById("ccDisband"); if (dis) dis.disabled = !partyMembers().length; }   // (the squad box: the squad at a glance, js/party.js)
    const sqWin = document.getElementById("ccSquadWin"); if (sqWin) {
        sqWin.style.display = ccSquadsOpen ? "flex" : "none";
        const body = document.getElementById("ccSquadBody");
        if (ccSquadsOpen && body) { const sg = _ccSqSig() + "|" + squadMode + "|" + (typeof player !== "undefined" ? player.selectedElement : ""); if (sg !== _ccSqWinSig || !body.firstChild) { _ccSqWinSig = sg; const keep = body.scrollTop; body.textContent = ""; try { _ccDrawYourSquad(body); } catch (e) { /* never take the game down */ } body.scrollTop = keep; } }
        else _ccSqWinSig = "";
    }
    const filters = document.getElementById("ccFilters"), grid = document.getElementById("ccGrid"), side = document.getElementById("ccSide"), foc = document.getElementById("ccFocus"), swp = document.getElementById("ccSwap");
    if (!filters || !grid || !side) return;
    grid.style.display = car ? "flex" : "grid"; filters.style.display = "flex"; side.style.display = "flex";
    if (foc) foc.style.display = car ? "flex" : "none"; if (swp) swp.style.display = car ? "flex" : "none";
    _ccDrawFilters(filters); _ccDrawGrid(grid); if (car) { try { _ccFocusDraw(foc); _ccSwapDraw(swp); } catch (e) { /* never take the game down */ } }
    { const sg = _ccSideSigNow(); if (sg !== _ccSideSig || !side.firstChild) { _ccSideSig = sg; const keep = side.scrollTop; try { if (car) _ccDrawSettings(side); else _ccDrawSide(side); } catch (e) {} side.scrollTop = keep; } }
}
function ccFocusUnit() { return _ccFocus; }   // (the squad box lights the slot of the creature in view: js/party.js)

function _ccDrawFilters(box) {
    // redrawn only when the filters change (a redraw under a finger loses the tap)
    const unlocked = typeof unlockedElements !== "undefined" ? unlockedElements : new Set(), car = ccCarousel();
    const sg = JSON.stringify(ccFilter) + "|" + unlocked.size + "|" + car; if (sg === _ccFiltSig && box.firstChild) return; _ccFiltSig = sg;
    box.textContent = "";
    const add = (label, col, on, fn) => box.appendChild(_ccBtn(label, col, on, fn, "small"));
    add("ALL", "#19e6c1", !ccFilter.element && !ccFilter.role && !ccFilter.kind && !ccFilter.squad, () => { ccFilter = { element: null, role: null, kind: null, squad: null }; });
    (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).forEach(el => { if (unlocked.has(el.id)) add(el.label, el.color, ccFilter.element === el.id, () => { ccFilter.element = ccFilter.element === el.id ? null : el.id; }); });
    const gap = () => { if (car && box.lastChild && box.lastChild.classList) box.lastChild.classList.add("sep"); };   // (the carousel sets the groups apart: the elements, the roles, who is in the squad, the clones)
    [["BRAWL", "brawler", "#ff4a1c"], ["MAGE", "sniper", "#a64dff"], ["TECH", "camper", "#8fe3ff"]].forEach((r, i) => { add(r[0], r[2], ccFilter.role === r[1], () => { ccFilter.role = ccFilter.role === r[1] ? null : r[1]; }); if (!i) gap(); });
    [["IN SQUAD", "in", "#19e6c1"], ["NOT IN SQUAD", "out", "#8fe3ff"]].forEach((r, i) => { add(r[0], r[2], ccFilter.squad === r[1], () => { ccFilter.squad = ccFilter.squad === r[1] ? null : r[1]; }); if (!i) gap(); });   // (who is in the squad, and who could be)
    add("CLONES", "#99ddff", ccFilter.kind === "clone", () => { ccFilter.kind = ccFilter.kind === "clone" ? null : "clone"; }); gap();
    if (car) return;   // (the carousel picks one creature at a time: no SELECT SHOWN, no CLEAR)
    const sp = _ccEl("span", "cc-spacer"); box.appendChild(sp);
    box.appendChild(_ccBtn("SELECT SHOWN", "#ffe733", false, () => ccSetSelection(ccUnits(ccFilter)), "small"));
    box.appendChild(_ccBtn("CLEAR", "#ff4a1c", false, () => ccClearSelection(), "small"));
}

function _ccDrawGrid(grid) {
    const car = ccCarousel(), rows = car ? _ccStripUnits().map(ccRow) : ccUnits(ccFilter).map(ccRow).sort((a, b) => (b.evolved - a.evolved) || (b.level - a.level));
    if (car) for (const r of rows) r.selected = r.unit === _ccFocus;   // (the card lit in the strip is the creature in view)
    const keep = new Set(rows.map(r => r.unit));
    for (const [u, el] of _ccCards) if (!keep.has(u)) { el.remove(); _ccCards.delete(u); }
    const tile = car ? _ccRecruitTile(grid) : null; if (!car) { const t = grid.querySelector(".cc-rtile"); if (t) t.remove(); }
    let prev = null;
    rows.forEach(r => {
        let card = _ccCards.get(r.unit);
        if (!card) { card = _ccMakeCard(r); _ccCards.set(r.unit, card); }
        _ccUpdateCard(card, r);
        // keep the order the sort gave, moving a card only when it is out of place (a click in progress is never on a moved card)
        const want = prev ? prev.nextSibling : grid.firstChild;
        if (card !== want) grid.insertBefore(card, want);
        prev = card;
    });
    if (tile && grid.lastChild !== tile) grid.appendChild(tile);   // (RECRUIT is the strip's last tile)
    if (!rows.length && !car) { if (!grid.querySelector(".cc-empty")) grid.appendChild(_ccEl("div", "cc-empty", "NOBODY HERE: TAP + RECRUIT ABOVE TO CALL A FOLLOWER")); }
    else { const e = grid.querySelector(".cc-empty"); if (e) e.remove(); }
}
// THE CAROUSEL'S RECRUIT: the strip's last tile (the carousel has no recruit button at the top). A follower at the Crystal for RECRUIT_COST shards, as the + RECRUIT button's: its type and element are whatever it turns out to be (js/clone.js). The new one is put in view.
function _ccRecruitTile(grid) {
    let t = grid.querySelector(".cc-rtile");
    if (!t) {
        t = _ccEl("div", "cc-card cc-rtile"); t.appendChild(_ccEl("div", "cc-rt-p", "+")); t.appendChild(_ccEl("div", "cc-rt-t")); t.appendChild(_ccEl("div", "cc-rt-s"));
        _ccClick(t, () => { const had = new Set(ccUnits({})); if (typeof recruitDo === "function") recruitDo(); const fresh = ccUnits({}).filter(u => !had.has(u)); if (fresh.length === 1) ccFocusSet(fresh[0]); });
    }
    const cost = typeof RECRUIT_COST !== "undefined" ? RECRUIT_COST : 30, have = typeof shardCount !== "undefined" ? shardCount : 0, can = have >= cost;
    t.classList.toggle("dim", !can);
    const a = t.querySelector(".cc-rt-t"), b = t.querySelector(".cc-rt-s"), ta = "RECRUIT ◆" + cost, tb = can ? Math.floor(have / cost) + " AFFORDABLE" : "NEED " + (cost - have) + " MORE";
    if (a.textContent !== ta) a.textContent = ta; if (b.textContent !== tb) b.textContent = tb;
    return t;
}
function _ccMakeCard(r) {
    const card = _ccEl("div", "cc-card"); card._unit = r.unit;
    const cv = _ccEl("canvas", "cc-thumb"); cv.width = 72; cv.height = 72; card.appendChild(cv); card._cv = cv;
    const mid = _ccEl("div", "cc-mid");
    mid.appendChild(_ccEl("div", "cc-name")); mid.appendChild(_ccEl("div", "cc-sub")); mid.appendChild(_ccEl("div", "cc-status"));
    const bar = _ccEl("div", "cc-bar"); bar.appendChild(_ccEl("i")); mid.appendChild(bar);
    mid.appendChild(_ccEl("div", "cc-tags")); card.appendChild(mid);
    card.appendChild(_ccEl("div", "cc-tick", "✓")); card.appendChild(_ccEl("div", "cc-no"));   // (cc-no: the slot number of a squad member, in the carousel's strip)
    // INFO on the card: this unit's attacks, jobs and stats (js/unitinfo.js). It does not select the card.
    const inf = _ccEl("button", "cc-info", "INFO"); inf.setAttribute("aria-label", "Info"); _ccClick(inf, () => { if (typeof unitInfoOpen === "function") unitInfoOpen(r.unit); }); card.appendChild(inf);
    _ccClick(card, () => { if (ccCarousel() && card.parentNode && card.parentNode.id === "ccGrid") ccFocusSet(r.unit); else { ccToggle(r.unit); ccRender(); } });   // (the carousel's strip puts the creature in view; a card in the SQUADS window, and the grid on a phone, pick it)
    return card;
}
function _ccUpdateCard(card, r) {
    card.style.setProperty("--c", _ccColour(r.element)); card.classList.toggle("sel", r.selected); card.classList.toggle("clone", r.clone);
    const no = card.querySelector(".cc-no"); if (no) { const n = !r.clone && typeof partyIsMember === "function" && partyIsMember(r.unit) && r.unit.partySlot !== undefined ? String(r.unit.partySlot + 1) : ""; if (no.textContent !== n) no.textContent = n; }
    card.querySelector(".cc-name").textContent = r.name;
    card.querySelector(".cc-sub").textContent = (r.clone ? "CLONE" : _ccElLabel(r.element)) + " · LV " + r.level;
    card.querySelector(".cc-bar i").style.width = Math.round(r.hp * 100) + "%";
    const st = card.querySelector(".cc-status"); if (st) { st.textContent = r.status ? r.status.text + (r.status.room ? " \u00b7 " + r.status.room : "") : ""; st.setAttribute("style", r.status ? "--c:" + r.status.col + ";" : "display:none;"); }   // (a follower holding a room says which)
    const tags = card.querySelector(".cc-tags"), want = [];
    if (!r.clone) want.push(({ brawler: "BRAWL", sniper: "MAGE", camper: "TECH" })[r.role] || "BRAWL");
    if (!r.clone) want.push(r.playStyle === "defensive" ? "DEF" : r.playStyle === "aggressive" ? "AGG" : "BAL");
    if (!r.clone && typeof partyIsMember === "function" && partyIsMember(r.unit)) want.push("SQUAD");   // (the squad's own tag, js/party.js)
    if (r.unit.post) want.push("POST"); else if (r.holding) want.push("HOLD"); if (r.evolved) want.push("EVOLVED");
    const sig = want.join("|"); if (tags._sig !== sig) { tags._sig = sig; tags.textContent = ""; want.forEach(w => tags.appendChild(_ccEl("span", "cc-tag " + w.toLowerCase(), w))); }
    const key = r.unit.evolved + "|" + r.unit.element; if (card._thumbKey !== key) { card._thumbKey = key; _ccThumb(card._cv, r.unit); }
    if (!card._thumbDone) { const d = r.unit.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[r.unit.evolved] : null; if (d && d._img && d._img.complete) { card._thumbDone = true; _ccThumb(card._cv, r.unit); } }
}
function _ccThumb(cv, f) {
    const g = cv.getContext && cv.getContext("2d"); if (!g) return; g.clearRect(0, 0, cv.width, cv.height);
    const d = f.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[f.evolved] : null, im = d && typeof _evoImg === "function" ? _evoImg(d) : null;
    if (im) { try { g.drawImage(im, 8, 2 * 144 + 6, 128, 128, 0, 0, cv.width, cv.height); return; } catch (e) {} }
    g.save(); const k = cv.width / 72; if (k !== 1) g.scale(k, k);   // (drawn for 72 px: the carousel's big picture is the same, scaled, and an egg's is a glossy orb)
    g.fillStyle = _ccColour(f.element); g.globalAlpha = 0.85; g.beginPath();
    if (f.isClone) { g.ellipse(36, 44, 22, 14, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; g.fillStyle = "#05070f"; g.font = "900 22px sans-serif"; g.textAlign = "center"; g.fillText(String(f.speciesName || "?").charAt(0).toUpperCase(), 36, 52); }
    else {
        if (k > 1 && typeof g.createRadialGradient === "function") { const gr = g.createRadialGradient(30, 32, 1, 36, 42, 26); gr.addColorStop(0, "rgba(255,255,255,0.85)"); gr.addColorStop(0.36, _ccColour(f.element)); gr.addColorStop(1, "rgba(0,0,0,0.55)"); g.globalAlpha = 1; g.fillStyle = gr; }
        g.ellipse(36, 42, 18, 24, 0, 0, Math.PI * 2); g.fill();
    }
    g.restore();
}

// The right-hand panel: the selected creature as a stat index, and its settings as one-line drop-downs.
// Each setting shows only what it is now; tap it to see the choices (one open at a time), pick one and it folds shut.
function _ccDropdown(side, key, title, value, col, options, off) {
    const open = _ccDD === key && !off;
    const b = _ccEl("button", "cc-dd" + (open ? " open" : "") + (off ? " off" : "")); b.style.setProperty("--c", col || "#19e6c1");
    b.appendChild(_ccEl("span", "cc-dd-k", title)); b.appendChild(_ccEl("span", "cc-dd-v", off || value)); b.appendChild(_ccEl("span", "cc-dd-a", open ? "\u25b4" : "\u25be"));
    if (off) b.disabled = true; else _ccClick(b, () => { _ccDD = open ? null : key; ccRender(); });
    side.appendChild(b);
    if (open) {
        const list = _ccEl("div", "cc-dd-list");
        options.forEach(o => { const ob = _ccBtn(o.label, o.col, o.on, () => { o.fn(); _ccDD = null; }, "wide", o.sub); if (o.off) ob.disabled = true; list.appendChild(ob); });
        side.appendChild(list);
    }
}
function _ccDrawSide(side) {
    side.textContent = "";
    const S = ccSelectionSummary(), sel = ccSelectionList();
    if (!S.count) {
        _ccDD = null;
        side.appendChild(_ccEl("div", "cc-sel-title", "NOTHING SELECTED"));
        side.appendChild(_ccEl("div", "cc-sel-sub", "TAP A FOLLOWER TO PUT IT IN THE SQUAD, TAKE IT OUT, OR SWAP IT \u00b7 " + ccUnits({}).length + " UNITS"));
        return;
    }
    const one = sel.length === 1 ? sel[0] : null; let statIdx = null;
    if (one) {
        const r = ccRow(one);
        const t = _ccEl("div", "cc-sel-title", r.name); t.style.color = _ccColour(one.element); t.style.textShadow = "0 0 10px " + _ccColour(one.element); side.appendChild(t);
        const sub = _ccElLabel(one.element) + " \u00b7 LV " + r.level + (partyIsMember(one) ? " \u00b7 IN THE SQUAD" : "") + (r.evolved ? " \u00b7 EVOLVED" : ""); side.appendChild(_ccEl("div", "cc-sel-sub", sub));
        const bar = _ccEl("div", "cc-bar big"); bar.style.setProperty("--c", _ccColour(one.element)); const fill = _ccEl("i"); fill.style.width = Math.round(r.hp * 100) + "%"; bar.appendChild(fill); side.appendChild(bar);
        // THE STAT INDEX: the same sheet as the unit's INFO card (js/unitinfo.js)
        const info = typeof unitInfo === "function" ? unitInfo(one) : null;
        const idx = _ccEl("div", "cc-stats");
        if (info) (info.stats || []).forEach(sec => { idx.appendChild(_ccEl("div", "cc-sec", sec.h)); (sec.rows || []).forEach(rw => { const row = _ccEl("div", "cc-stat"); row.appendChild(_ccEl("span", "cc-stat-k", rw[0])); row.appendChild(_ccEl("span", "cc-stat-v", rw[1])); idx.appendChild(row); }); });
        statIdx = idx;
    } else {
        side.appendChild(_ccEl("div", "cc-sel-title", "SELECTED " + S.count));
        side.appendChild(_ccEl("div", "cc-sel-sub", S.followers + " FOLLOWERS \u00b7 " + S.clones + " CLONES \u00b7 ORDERS IN THE WORLD GO TO THEM"));
    }
    _ccDrawSquadButtons(side, sel);   // (ADD TO SQUAD / REMOVE FROM SQUAD: REMOVE posts it in its room, so there is no STANCE setting here; nobody works, so no DUTY)
    side.appendChild(_ccEl("div", "cc-sec", "SETTINGS"));
    _ccDrawStyles(side, S, sel);
    const row = _ccEl("div", "cc-row"); side.appendChild(row);
    if (S.followers) row.appendChild(_ccBtn(ccRerollArmed ? "TAP AGAIN: RE-ROLL " + S.followers : "RE-ROLL", "#ff4a1c", ccRerollArmed, () => { if (!ccRerollArmed) ccRerollArmed = true; else { ccApplyReroll(sel); ccRerollArmed = false; } }, "wide", "BACK TO THE CRYSTAL, MADE AGAIN"));
    row.appendChild(_ccBtn("CLEAR SELECTION", "#8aa0c8", false, () => { ccClearSelection(); ccRerollArmed = false; _ccDD = null; }, "wide"));
    if (statIdx) side.appendChild(statIdx);   // the stat index sits under the settings, so the choices are never pushed off the panel
}
// ATTACK STYLE (the role) and PLAY STYLE for `sel`: a follower's; a clone has neither
function _ccDrawStyles(side, S, sel) {
    if (!S.followers) return;
    const lab = (list, id) => (list.find(x => x.id === id) || {}).label, mixed = v => v === "mixed", lockedAll = S.followers - S.lockedRole <= 0;
    _ccDropdown(side, "role", "ATTACK STYLE", mixed(S.role) ? "MIXED" : (lab(ATTACK_STYLES, S.role) || "—"), "#ff4a1c",
        ATTACK_STYLES.map(x => ({ label: x.label, col: x.col, sub: x.blurb, on: S.role === x.id, fn: () => ccApplyRole(sel, x.id) })), lockedAll ? "EVOLVED KEEPS ITS ROLE" : null);
    _ccDropdown(side, "play", "PLAY STYLE", mixed(S.playStyle) ? "MIXED" : (lab(PLAY_STYLES, S.playStyle) || "—"), "#ffe733",
        PLAY_STYLES.map(x => ({ label: x.label, col: "#ffe733", sub: x.blurb, on: S.playStyle === x.id, fn: () => ccApplyPlayStyle(sel, x.id) })));
}

// ── THE CAROUSEL'S PARTS (see the top of this file) ──
// The numbers on the card in view, each with how it stands against the best of your roster (a bar's length); the health bar is how much of its own health is left. A clone has no defense or attack.
function _ccFocusStats(f) {
    const all = ccUnits({}), top = get => Math.max(1, ...all.map(get)), pw = a => Math.round(a.power || 0), sp = a => Math.round((a.moveSpeed || 0) * 1000), df = a => a.stats ? Math.round(a.stats.defense || 0) : 0, at = a => a.stats ? Math.round(a.stats.attack || 0) : 0;
    const hp = Math.max(0, Math.round(f.health || 0)), mx = Math.max(1, Math.round(f.maxHealth || 1));
    const rows = [["HEALTH", hp / mx, hp + " / " + mx], ["POWER", pw(f) / top(pw), String(pw(f))], ["SPEED", sp(f) / top(sp), String(sp(f))]];
    if (f.stats) rows.push(["DEFENSE", df(f) / top(df), String(df(f))], ["ATTACK", at(f) / top(at), String(at(f))]);
    return rows;
}
// the creature in view: its picture, name, state and numbers, with ◂ ▸ to walk the roster; built once, updated in place
function _ccFocusBuild(box) {
    if (box._cf) return box._cf;
    box.textContent = "";
    const arrow = d => { const b = _ccEl("button", "cf-arrow " + (d < 0 ? "prev" : "next")); b.setAttribute("aria-label", d < 0 ? "Previous creature" : "Next creature"); b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + (d < 0 ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7") + '"/></svg>'; _ccClick(b, () => ccFocusStep(d)); return b; };
    const card = _ccEl("div", "cf-card"), art = _ccEl("div", "cf-art"), cv = _ccEl("canvas", "cf-cv"); cv.width = 128; cv.height = 128; art.appendChild(cv);
    const lv = _ccEl("span", "cf-lv"), el = _ccEl("span", "cf-el"); art.appendChild(lv); art.appendChild(el);
    const txt = _ccEl("div", "cf-txt"), name = _ccEl("div", "cf-name"), state = _ccEl("span", "cf-state"), bars = _ccEl("div", "cf-bars");
    const rows = ["HEALTH", "POWER", "SPEED", "DEFENSE", "ATTACK"].map(k => { const r = _ccEl("div", "cf-bar"); r.appendChild(_ccEl("span", "cf-k", k)); const i = _ccEl("i"); i.appendChild(_ccEl("b")); r.appendChild(i); r.appendChild(_ccEl("em")); bars.appendChild(r); return r; });
    txt.appendChild(name); txt.appendChild(state); txt.appendChild(bars);
    card.appendChild(art); card.appendChild(txt); card.appendChild(_ccEl("div", "cf-none", "NOBODY HERE: TAP RECRUIT, AT THE END OF THE STRIP, TO CALL A FOLLOWER"));
    const prev = arrow(-1), next = arrow(1); box.appendChild(prev); box.appendChild(card); box.appendChild(next);
    return box._cf = { card, cv, lv, el, name, state, rows, prev, next, key: null, done: false };
}
function _ccFocusDraw(box) {
    const E = _ccFocusBuild(box), f = _ccFocus, list = _ccStripUnits(), walk = list.length > (f && list.indexOf(f) >= 0 ? 1 : 0);
    E.card.classList.toggle("none", !f); E.prev.disabled = E.next.disabled = !walk;
    if (!f) return;
    const col = _ccColour(f.element), st = typeof unitStatus === "function" ? unitStatus(f) : null, set = (e, p, v) => { if (e[p] !== v) e[p] = v; };
    E.card.style.setProperty("--c", col);
    set(E.name, "textContent", typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER");
    set(E.lv, "textContent", "LV " + (f.level || 1)); set(E.el, "textContent", f.isClone ? "CLONE" : String(_ccElLabel(f.element)).toUpperCase());
    set(E.state, "textContent", st ? st.text + (st.room ? " · " + st.room : "") : "");
    E.state.style.display = st ? "" : "none"; if (st) E.state.style.setProperty("--tc", st.col);
    const rows = _ccFocusStats(f);
    E.rows.forEach((r, i) => {
        const v = rows[i]; r.style.display = v ? "" : "none"; if (!v) return;
        const w = Math.max(4, Math.round(Math.min(1, v[1]) * 100)) + "%", b = r.querySelector("b"), n = r.querySelector("em"), frac = v[1], cls = i === 0 ? (frac > 0.5 ? "" : frac > 0.25 ? "mid" : "low") : "";
        if (b.style.width !== w) b.style.width = w; if (r.className !== "cf-bar" + (cls ? " " + cls : "")) r.className = "cf-bar" + (cls ? " " + cls : "");
        set(n, "textContent", v[2]);
    });
    const key = _ccUid(f) + "|" + f.evolved + "|" + f.element; if (E.key !== key) { E.key = key; E.done = false; _ccThumb(E.cv, f); }
    if (!E.done && f.evolved && typeof EVOLUTIONS !== "undefined") { const d = EVOLUTIONS[f.evolved]; if (d && d._img && d._img.complete) { E.done = true; _ccThumb(E.cv, f); } }   // (an evolved form's picture may still have been loading)
}
// the settings column: ATTACK STYLE, PLAY STYLE, RE-ROLL and INFO for the creature in view, then its base stats
function _ccDrawSettings(side) {
    side.textContent = "";
    const one = _ccFocus; if (!one) { _ccDD = null; return; }
    const sel = [one], S = ccSelectionSummary(sel);
    _ccDrawStyles(side, S, sel);
    const row = _ccEl("div", "cc-row"); side.appendChild(row);
    if (S.followers) row.appendChild(_ccBtn(ccRerollArmed ? "TAP AGAIN" : "RE-ROLL", "#ff4a1c", ccRerollArmed, () => {
        if (!ccRerollArmed) { ccRerollArmed = true; return; }
        const nb = _ccNeighbour(one, 1); if (ccApplyReroll(sel) && nb) _ccFocus = nb;   // (made again at the Crystal: the next one comes into view)
        ccRerollArmed = false;
    }, "act"));
    row.appendChild(_ccBtn("INFO ▸", "#8fe3ff", false, () => { if (typeof unitInfoOpen === "function") unitInfoOpen(one); }, "act"));
    const exArmed = S.followers > 0 && partyExileArmed([one]);   // EXILE (js/party.js partyExileTap): let it go for good, to make room; the first tap arms it, the second does it, and the next one comes into view
    if (S.followers) row.appendChild(_ccBtn(exArmed ? "TAP AGAIN TO EXILE" : "EXILE", "#ff3a4a", exArmed, () => { const nb = _ccNeighbour(one, 1); if (partyExileTap([one]) === "exiled") _ccFocus = nb && nb !== one && !nb.dead ? nb : null; }, "act cc-exile"));
    if (ccRerollArmed) side.appendChild(_ccEl("div", "cc-note", "BACK TO THE CRYSTAL, MADE AGAIN AS SOMEONE NEW"));
    if (exArmed) side.appendChild(_ccEl("div", "cc-note", "EXILED: GONE FOR GOOD, NOTHING BACK · ITS PLACE IS FREE FOR SOMEONE NEW"));
    const info = typeof unitInfo === "function" ? unitInfo(one) : null;
    if (info) {   // (the card in view has VITALS, and the DEFENSE and ATTACK bars: the column lists the rest)
        const idx = _ccEl("div", "cc-stats"), onCard = (sec, rw) => sec.h.indexOf("BASE STATS") === 0 && (rw[0] === "DEFENSE" || rw[0] === "ATTACK");
        (info.stats || []).filter(sec => sec.h !== "VITALS").forEach(sec => { idx.appendChild(_ccEl("div", "cc-sec", sec.h)); (sec.rows || []).filter(rw => !onCard(sec, rw)).forEach(rw => { const r = _ccEl("div", "cc-stat"); r.appendChild(_ccEl("span", "cc-stat-k", rw[0])); r.appendChild(_ccEl("span", "cc-stat-v", rw[1])); idx.appendChild(r); }); });
        side.appendChild(idx);
    }
}
// the bar at the foot: what the creature in view can do about the squad, in one tap (ASKED: "SWAP … IN FOR", the three who could make room). Redrawn only when it changes.
function _ccSwapDraw(bar) {
    const f = _ccFocus, mem = partyOrdered(), free = PARTY.max - mem.length;
    const kind = !f ? "none" : f.isClone || f.isFollower !== true ? "clone" : partyIsMember(f) ? "member" : f.post ? (free > 0 ? "add" : "swap") : "away";
    const sg = kind + "|" + (f ? _ccUid(f) + "|" + f.partySlot : "") + "|" + free + "|" + mem.map(m => _ccUid(m) + ":" + m.partySlot + ":" + m.element).join(",");
    if (sg === _ccSwapSig && bar.firstChild) return; _ccSwapSig = sg; bar.textContent = "";
    const nm = u => typeof unitTypeLabel === "function" ? unitTypeLabel(u) : "FOLLOWER";
    const label = t => bar.appendChild(_ccEl("div", "cc-sw-l", t));
    const pick = (title, sub, col, fn) => { const b = _ccEl("button", "cc-pick"); b.style.setProperty("--c", col); b.appendChild(_ccEl("span", "orb")); const tx = _ccEl("span", "cc-pk-t", title); if (sub) tx.appendChild(_ccEl("small", null, sub)); b.appendChild(tx); _ccClick(b, () => { fn(); ccRender(); }); bar.appendChild(b); return b; };
    if (kind === "none") label("RECRUIT A FOLLOWER TO FILL THE SQUAD");
    else if (kind === "clone") label("A CLONE IS NOT A FOLLOWER: ONLY FOLLOWERS JOIN THE SQUAD");
    else if (kind === "away") label("NOT IN THE SQUAD, AND NOT HOLDING A ROOM: IT IS ON ITS WAY");
    else if (kind === "member") { label(nm(f) + " IS IN THE SQUAD · SLOT " + (f.partySlot + 1)); pick("✕ REMOVE FROM SQUAD", "IT HOLDS THE ROOM IT IS IN", "#8fe3ff", () => partyRemove([f])); }
    else if (kind === "add") { label("ADD " + nm(f) + " TO THE SQUAD"); pick("ADD TO SQUAD", free + (free === 1 ? " SLOT FREE" : " SLOTS FREE"), "#19e6c1", () => partyAdd([f])); }
    else { label("SWAP " + nm(f) + " IN FOR"); mem.forEach(m => pick(nm(m), "THAT ONE HOLDS ITS ROOM INSTEAD", _ccColour(m.element), () => partySwap(m, f))); }
}
// THE SQUAD'S BUTTONS in the side panel (the facility; ASKED: "when you click the creature on the roster, it should show on the side add to party or add to squad"): ADD TO SQUAD for a follower that holds a room, REMOVE FROM SQUAD for one that is
// in the squad (it holds the room it is in); with the squad full, SWAP WITH one of the three. With more than one selected each button NAMES the follower it is for and acts on exactly that one (REPORTED: "it ends up adding the same follower that was
// previously on the squad back"); when more are selected than the squad has room for, one ADD button per follower; with the squad full and one member and one follower holding a room selected, SWAP IN. A follower a button has dealt with leaves the selection
// (js/party.js), so the next tap is the only one selected.
function _ccDrawSquadButtons(side, sel) {
    const fol = sel.filter(a => a.isFollower === true && !a.isClone), mem = fol.filter(partyIsMember), out = fol.filter(a => !partyIsMember(a) && a.post), have = partyMembers().length, free = PARTY.max - have;
    const nm = f => typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER", many = sel.length > 1, slots = free + (free === 1 ? " SLOT FREE" : " SLOTS FREE");
    side.appendChild(_ccEl("div", "cc-sec", "SQUAD \u00b7 " + have + " OF " + PARTY.max));
    if (!fol.length) { side.appendChild(_ccEl("div", "cc-note", "ONLY FOLLOWERS JOIN THE SQUAD")); return; }
    const row = _ccEl("div", "cc-row wrap sqrow"); side.appendChild(row); const big = b => { b.classList.add("big", "full"); return b; };
    if (free === 0 && mem.length === 1 && out.length === 1) {   // the one to take out and the one to put in are both selected
        row.appendChild(big(_ccBtn("SWAP IN " + nm(out[0]), _ccColour(out[0].element), false, () => partySwap(mem[0], out[0]), "wide", "FOR " + nm(mem[0]) + " \u00b7 THAT ONE HOLDS ITS ROOM")));
    } else {
        if (out.length && free >= out.length) row.appendChild(big(_ccBtn(out.length > 1 ? "ADD " + out.length + " TO SQUAD" : many ? "ADD " + nm(out[0]) + " TO SQUAD" : "ADD TO SQUAD", "#19e6c1", false, () => partyAdd(out), "wide", slots)));
        else if (out.length && free > 0) out.forEach(f => row.appendChild(big(_ccBtn("ADD " + nm(f), _ccColour(f.element), false, () => partyAdd([f]), "wide", "ROOM FOR " + free + " \u00b7 PICK ONE"))));
        else if (out.length === 1 && !many) partyOrdered().forEach(m => row.appendChild(big(_ccBtn("SWAP WITH " + nm(m), _ccColour(m.element), false, () => partySwap(m, out[0]), "wide", "SQUAD FULL \u00b7 THAT ONE HOLDS ITS ROOM INSTEAD"))));
        else if (out.length) { const b = big(_ccBtn("ADD TO SQUAD", "#19e6c1", false, () => {}, "wide", "SQUAD FULL \u00b7 SELECT ONE TO SWAP")); b.disabled = true; row.appendChild(b); }
        if (mem.length) row.appendChild(big(_ccBtn(mem.length > 1 ? "REMOVE " + mem.length + " FROM SQUAD" : many ? "REMOVE " + nm(mem[0]) + " FROM SQUAD" : "REMOVE FROM SQUAD", "#8fe3ff", false, () => partyRemove(mem), "wide", mem.length > 1 ? "THEY HOLD THE ROOMS THEY ARE IN" : "HOLDS THE ROOM IT IS IN")));
    }
    if (!out.length && !mem.length) side.appendChild(_ccEl("div", "cc-note", "NOT IN THE SQUAD, AND NOT HOLDING A ROOM: IT IS ON ITS WAY"));
    // EXILE (js/party.js partyExileTap): the followers selected let go for good, to make room; the first tap arms it, the second does it
    const armed = partyExileArmed(fol), ex = _ccBtn(armed ? "TAP AGAIN TO EXILE" + (fol.length > 1 ? " " + fol.length : "") : fol.length > 1 ? "EXILE " + fol.length : many ? "EXILE " + nm(fol[0]) : "EXILE", "#ff3a4a", armed, () => partyExileTap(fol), "wide", armed ? "GONE FOR GOOD \u00b7 NOTHING BACK" : fol.length > 1 ? "LET THEM GO FOR GOOD \u00b7 MAKES ROOM" : "LET IT GO FOR GOOD \u00b7 MAKES ROOM");
    ex.classList.add("big", "full", "cc-exile"); side.appendChild(ex);
}
// THE SQUADS WINDOW: YOUR SQUAD (ASKED: "when you go at the top to squads, it should already show all three creatures in your squad [...] a little roster card of each of them. And here you can disband them"): the squad's three cards (an open slot is
// dashed), a REMOVE on each, DISBAND SQUAD (they all hold the rooms they are in), and the squad's orders. ccRender empties the body first.
function _ccDrawYourSquad(body) {
    const mem = partyOrdered(), n = mem.length;
    body.appendChild(_ccEl("div", "cc-sq-hint", n ? "THE SQUAD FOLLOWS YOU, UP TO " + PARTY.max + ". A FOLLOWER TAKEN OUT OF IT HOLDS THE ROOM IT IS IN." : "NOBODY IS IN THE SQUAD. TAP AN OPEN SLOT TO SEE WHO COULD JOIN IT."));
    const row = _ccEl("div", "cc-yoursquad"); body.appendChild(row);
    for (let i = 0; i < PARTY.max; i++) {
        const f = mem.find(m => m.partySlot === i) || null;
        if (!f) { const e = _ccEl("div", "cc-card cc-open"); e.appendChild(_ccEl("div", "cc-open-t", "+ OPEN SLOT")); e.appendChild(_ccEl("div", "cc-open-s", "TAP TO SEE WHO COULD FILL IT")); _ccClick(e, () => { ccSquadsOpen = false; ccShowCandidates(); }); row.appendChild(e); continue; }
        const r = ccRow(f), card = _ccMakeCard(r); _ccUpdateCard(card, r);
        card.querySelector(".cc-mid").appendChild(_ccBtn("REMOVE", "#8fe3ff", false, () => partyRemove([f]), "small"));
        row.appendChild(card);
    }
    const dis = _ccBtn("DISBAND SQUAD", "#ff4a1c", false, () => partyDisband(), "wide", n ? "THEY HOLD THE ROOMS THEY ARE IN" : "NOBODY TO DISBAND"); dis.classList.add("big", "full"); if (!n) dis.disabled = true; body.appendChild(dis);
    _ccDrawSquadOrders(body);
}

// The shard readout beside RECRUIT: "◆ 200" and "30 PER RECRUIT · 6 AFFORDABLE" (or "NEED 10 MORE" in red).
function ccShardsUpdate(el, car) {
    const cost = typeof RECRUIT_COST !== "undefined" ? RECRUIT_COST : 30, have = typeof shardCount !== "undefined" ? shardCount : 0, n = Math.floor(have / cost);
    const sig = have + "|" + cost + "|" + !!car; if (el._sig === sig) return; el._sig = sig;
    el.classList.toggle("short", have < cost && !car);   // (the carousel's total is only what you have: the RECRUIT tile says what a follower costs, and how many you can afford)
    el.querySelector(".cc-sh-n").textContent = "\u25c6 " + have;
    el.querySelector(".cc-sh-c").textContent = car ? "YOUR SHARDS" : have < cost ? "NEED " + (cost - have) + " MORE" : cost + " EACH \u00b7 " + n + " AFFORDABLE";
}
// What the squad window shows: the squad in its slots (each one's level, health, form, element and state), and whether each is selected.
function _ccSqSig() {
    return partyOrdered().map(m => [m.partySlot, m.level || 1, Math.round((m.health || 0) / Math.max(1, m.maxHealth || 1) * 20), m.evolved || "", m.element, selectedUnits.has(m) ? "*" : "", (typeof unitStatus === "function" && unitStatus(m) || {}).text || ""].join(",")).join("|") + "#" + selectedUnits.size + "/" + partyMembers().length;
}
// Everything the side panel shows: the selection summary, the squad, the scope, the element, who would get world orders.
function _ccSideSigNow() {
    if (ccCarousel()) {   // the carousel's settings are for the creature in view
        const f = _ccFocus; if (!f) return "F-";
        return "F" + _ccUid(f) + "|" + [f.level, Math.round((f.health || 0) / 5), f.evolved, f.element, f.role, f.playStyle, f.partySlot, f.post, f.stance, f.isFollower].join() + "|" + JSON.stringify(ccSelectionSummary([f])) + "|" + _ccDD + "|" + ccRerollArmed + "|" + partyExileArmed([f]);
    }
    const pool = typeof getCommandPool === "function" ? getCommandPool().filter(f => !f.dead).length : 0;
    const one = ccSelectionList().length === 1 ? ccSelectionList()[0] : null, snap = one ? [one.level, Math.round((one.health || 0) / 5), one.evolved, one.element].join() : "";
    return JSON.stringify(ccSelectionSummary()) + "|" + snap + "|" + _ccDD + "|" + _ccSqSig() + "|" + partyExileArmed(ccSelectionList().filter(a => a.isFollower === true && !a.isClone)) + "|" + squadMode + "|" + (typeof player !== "undefined" ? player.selectedElement : "") + "|" + ccRerollArmed + "|" + pool + "|" + (typeof unlockedElements !== "undefined" ? unlockedElements.size : 0);
}
// The squad-wide orders (they were the COMMAND page): who world orders go to, and orders for the whole pool. Appended to the side panel.
function _ccDrawSquadOrders(side) {
    side.appendChild(_ccEl("div", "cc-sel-title ccs", "SQUAD ORDERS"));
    side.appendChild(_ccEl("div", "cc-sel-sub", (ccSelectionList().length ? ccSelectionList().length + " SELECTED RECEIVE WORLD ORDERS" : (typeof getCommandPool === "function" ? getCommandPool().filter(f => !f.dead).length : 0) + " IN THE COMMAND POOL")));
    const grp = (t, kids) => { side.appendChild(_ccEl("div", "cc-sec", t)); const r = _ccEl("div", "cc-row wrap"); kids.forEach(k => r.appendChild(k)); side.appendChild(r); };
    if (!(typeof hudCorners === "function" && hudCorners())) grp("WHO GETS WORLD ORDERS (WHEN NOBODY IS SELECTED)", [   // (the corners layout has no element picker: the orders reach the whole squad, or the cards that are picked on the squad bar)
        _ccBtn("ALL ELEMENTS", "#19e6c1", squadMode === "all", () => radialSetScope(true), "wide", "THE WHOLE SQUAD"),
        _ccBtn("SELECTED ELEMENT: " + _ccElLabel(player.selectedElement), "#19e6c1", squadMode !== "all", () => radialSetScope(false), "wide", "ONE ELEMENT"),
    ]);
    grp("COMMANDS FOR THE POOL", [
        _ccBtn("SWITCH ROLES", "#ffe733", false, () => cycleCommandPoolRoles(), "wide", "BRAWLER → MAGE → TECHNICIAN"),
    ]);
}

function initCommandCenter() {
    if (typeof document === "undefined" || !document.body || document.getElementById("ccRoot")) return;
    const root = _ccEl("div"); root.id = "ccRoot"; document.body.appendChild(root);
}
try { initCommandCenter(); } catch (e) { /* no page (the test sandbox): the logic above still works */ }

