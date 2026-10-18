// ─────────────────────────────────────────────────────────
//  THE COMMAND CENTER — the tablet and desktop menu (docs/UI-STYLE.md)
// ─────────────────────────────────────────────────────────
// REPORTED: "make the iPad and browser version have a menu at the bottom that has all the different menus and rosters and all that. It can take
// up the screen when accessing the roster and command center. I want the player to be able to select their creatures by clicking their card and
// changing their attack and play style. This replaces the current index."
//
// The bottom dock (game.html #topToggles) has ONE button, ROSTER, that opens this full-screen overlay (the old COMMAND page is merged into its right-hand
// panel: "the command center and roster are really the same thing"). Its tabs:
//
//   ROSTER   every follower and clone as a CARD. Clicking a card selects it (click again to let it go); the right-hand panel then changes the
//            whole selection at once: ATTACK STYLE (brawler / mage / technician), PLAY STYLE (defensive / balanced / aggressive), STANCE (follow me
//            / hold here), DUTY (fight / work) and RE-ROLL.
//   COMMAND  squad-wide orders: who the world commands go to, switch roles, all to work, all to fight, and quick "select …" buttons.
//   SQUAD    analytics: counts, health and the role split, per element.
//
// The selection is REAL: while any selected unit is alive, getCommandPool() (js/helpers.js) is the selection, so a long-press move or attack order
// in the world goes to exactly those units. A teal ring marks them on the ground. The old canvas index (ELEM / UNITS / CLONES, ui.js) is no
// longer drawn or tapped: this replaces it.
//
// PLAY STYLE is an engagement reach (PLAY_STYLES): a DEFENSIVE unit only takes on enemies close to it, an AGGRESSIVE one goes after enemies much
// further out (npc.js multiplies its role's reach by playReach()). It is saved with the follower.

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

// Everyone on your side, as the roster shows them (followers, then clones). `filter` narrows: { element, role, duty, kind }.
function ccUnits(filter) {
    const f = filter || {};
    const fol = (typeof followers !== "undefined" ? followers : []).filter(a => a && !a.dead && !a.isClone && a.team === "green");
    const clo = (typeof actors !== "undefined" ? actors : []).filter(a => a && a.isClone && !a.dead && a.team === "green");
    let list = f.kind === "clone" ? clo : f.kind === "follower" ? fol : fol.concat(clo);
    if (f.element) list = list.filter(a => a.element === f.element);
    if (f.role) list = list.filter(a => !a.isClone && a.duty !== "worker" && a.role === f.role);
    if (f.duty) list = list.filter(a => (a.duty === "worker") === (f.duty === "worker"));
    return list;
}
function ccRow(a) {
    const hp = Math.max(0, Math.min(1, (a.health || 0) / (a.maxHealth || 1)));
    const ps = PLAY_STYLES.find(p => p.id === a.playStyle) || PLAY_STYLES[1];
    return {
        unit: a, clone: !!a.isClone, element: a.element, hp, level: a.level || 1, evolved: !!a.evolved,
        name: typeof unitTypeLabel === "function" ? unitTypeLabel(a) : String(a.speciesName || a.element || "UNIT").toUpperCase(),
        role: a.isClone ? null : a.role, working: a.duty === "worker", holding: !!(a.job && a.job.type === "move") || a.stance === "hold",
        squad: typeof squadOf === "function" ? squadOf(a) : null, playStyle: ps.id, selected: selectedUnits.has(a), status: typeof unitStatus === "function" ? unitStatus(a) : null,
        canWork: a.isClone ? (typeof canCloneWork === "function" && canCloneWork(a)) : (typeof canWorkMass === "function" && canWorkMass(a)),
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
// Stance: HOLD stands each unit where it is (a standing post, like the move order); FOLLOW lets it go back to following you.
function ccApplyStance(units, stance) {
    let n = 0;
    for (const a of units) {
        if (!a || a.dead) continue;
        if (stance === "hold") { if (a.duty === "worker") continue; a.job = { type: "move", target: { x: a.x, y: a.y } }; a.stance = "hold"; n++; }
        else if (stance === "follow") { if (a.job && a.job.type === "move") a.job = null; a.stance = "follow"; n++; }
    }
    return n;
}
// Duty: the work crew or the line. Followers use the real duty rules (only some elements can work); clones need a job for their species.
function ccApplyDuty(units, duty) {
    let n = 0;
    for (const a of units) {
        if (!a || a.dead) continue;
        if (a.isClone) { if (typeof setCloneDuty === "function" && setCloneDuty(a, duty === "worker" ? "worker" : null)) n++; }
        else if (typeof setFollowerDuty === "function" && setFollowerDuty(a, duty === "worker" ? "worker" : "fighter", true)) n++;
    }
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined")
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: n ? (duty === "worker" ? n + " TO THE WORK CREW" : n + " BACK ON THE LINE") : (duty === "worker" ? "NONE OF THEM CAN WORK" : "NONE WERE WORKING"), color: duty === "worker" ? "#00ccaa" : "#0f8", life: 100, vy: -0.25, size: 12 });
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
function ccSelectionSummary() {
    const sel = ccSelectionList(), fol = sel.filter(a => !a.isClone);
    return {
        count: sel.length, followers: fol.length, clones: sel.length - fol.length,
        role: ccCommon(fol.filter(a => !a.evolved), a => a.role), lockedRole: fol.filter(a => a.evolved).length,
        playStyle: ccCommon(fol, a => a.playStyle || "balanced"),
        stance: ccCommon(sel, a => (a.job && a.job.type === "move") || a.stance === "hold" ? "hold" : "follow"),
        duty: ccCommon(sel, a => a.duty === "worker" ? "worker" : "fighter"),
        canWork: sel.filter(a => a.isClone ? (typeof canCloneWork === "function" && canCloneWork(a)) : (typeof canWorkMass === "function" && canWorkMass(a))).length,
    };
}

// The old canvas index (ELEM / UNITS / CLONES) is replaced by all of the above: game.js and input.js skip it while this is true.
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
let _ccSideSig = "", _ccSqSigS = "";   // the side panel and the squad strip are redrawn only when what they show changes: a redraw every tick lost taps and sent the panel back to its top
let _ccPageSig = "";   // the analytics page is redrawn only when what it shows changes (a click is never lost to a redraw)
let ccOpenTab = null, ccFilter = { element: null, role: null, duty: null, kind: null }, ccRerollArmed = false, _ccTimer = 0;
const _ccCards = new Map();   // unit → its card element (updated in place, so a click is never lost to a redraw)

function _ccEl(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function _ccClick(el, fn) { el.addEventListener("click", ev => { ev.stopPropagation(); fn(ev); }); }
function _ccColour(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.color : "#8aa0c8"; }
function _ccElLabel(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.label : String(id || "").toUpperCase(); }

function ccOpen(tab) {
    // Two menus share this overlay: the ROSTER (the creature cards and the command panel) and the ZONES page (opened from the zone plate at the top, js/zones.js).
    // ("command" was a tab of its own: it is the roster's right-hand panel now; "squad" was the old analytics tab.)
    ccOpenTab = tab === "zones" || tab === "squad" ? "zones" : "roster"; ccRerollArmed = false;
    const root = document.getElementById("ccRoot"); if (!root) return;
    root.classList.add("open"); document.body.classList.add("ccOpen");
    clearInterval(_ccTimer); _ccTimer = setInterval(ccRender, CC_REFRESH_MS);
    ccBuildFrame(); ccRender();
}
function ccClose() {
    buildOrderPickerClose();
    ccOpenTab = null; ccRerollArmed = false; clearInterval(_ccTimer); _ccTimer = 0;
    const root = document.getElementById("ccRoot"); if (root) root.classList.remove("open");
    if (document.body) document.body.classList.remove("ccOpen");
    _ccCards.clear();
    const grid = document.getElementById("ccGrid"); if (grid) grid.textContent = "";
    ccRefreshChip();
}
function ccToggleOpen(tab) { const want = tab === "squad" ? "zones" : tab === "zones" ? "zones" : "roster"; if (ccOpenTab === want) ccClose(); else ccOpen(want); }

function ccBuildFrame() {
    const root = document.getElementById("ccRoot"); if (!root || root.getAttribute("data-built")) return;
    root.setAttribute("data-built", "1");
    const head = _ccEl("div", "cc-head"); const tb = _ccEl("div", "cc-titlebox"); const ttl = _ccEl("div", "cc-title", "COMMAND CENTER"); ttl.id = "ccTitle"; tb.appendChild(ttl);
    const sum = _ccEl("div", "cc-summary"); sum.id = "ccSummary"; tb.appendChild(sum); head.appendChild(tb);   // the squad at a glance, under the title, on the roster
    // RECRUIT: a follower at the Crystal for RECRUIT_COST shards (clone.js recruitFollower), on the ROSTER tab only. It dims when the shards are short.
    const rec = _ccEl("button", "cc-recruit"); rec.id = "ccRecruit"; rec.appendChild(_ccEl("span", "cc-rl", "+ RECRUIT")); rec.appendChild(_ccEl("span", "cc-rs", ""));
    _ccClick(rec, () => { recruitDo(); });   // straight away, as picked on the crystal (js/recruitcrystal.js)
    const rcx = recruitCrystalBuild(false); rcx.id = "ccRecruitCrystal"; head.appendChild(rcx);
    // THE SHARD TOTAL, so a recruit is never a shot in the dark: what you have, what a recruit costs, how many you can afford (red when you cannot afford one)
    const sh = _ccEl("div", "cc-shards"); sh.id = "ccShards"; sh.appendChild(_ccEl("div", "cc-sh-n")); sh.appendChild(_ccEl("div", "cc-sh-c")); head.appendChild(sh);
    head.appendChild(rec);
    const x = _ccEl("button", "cc-close", "✕ CLOSE"); x.id = "ccClose"; _ccClick(x, ccClose); head.appendChild(x); root.appendChild(head);
    const body = _ccEl("div", "cc-body"); body.id = "ccBody";
    const main = _ccEl("div", "cc-main"); main.id = "ccMain"; main.appendChild(_ccEl("div", "cc-filters")); main.lastChild.id = "ccFilters";
    const sqs = _ccEl("div", "cc-squads"); sqs.id = "ccSquads"; main.appendChild(sqs);   // roster squads (js/squads.js)
    const grid = _ccEl("div", "cc-grid"); grid.id = "ccGrid"; main.appendChild(grid);
    const page = _ccEl("div", "cc-page"); page.id = "ccPage"; main.appendChild(page);
    body.appendChild(main);
    const side = _ccEl("div", "cc-side"); side.id = "ccSide"; body.appendChild(side);
    root.appendChild(body);
    window.addEventListener("keydown", e => { if (e && e.key === "Escape" && ccOpenTab) ccClose(); });
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
    const rec = document.getElementById("ccRecruit");
    const rcx = document.getElementById("ccRecruitCrystal"); if (rcx) { rcx.style.display = ccOpenTab === "roster" ? "" : "none"; recruitCrystalUpdate(rcx); }
    const shp = document.getElementById("ccShards"); if (shp) { shp.style.display = ccOpenTab === "roster" ? "" : "none"; ccShardsUpdate(shp); }
    if (rec) { rec.style.display = ccOpenTab === "roster" ? "" : "none"; const cost = typeof RECRUIT_COST !== "undefined" ? RECRUIT_COST : 30, can = shardCount >= cost; rec.classList.toggle("dim", !can); const rs = rec.querySelector(".cc-rs"); if (rs) rs.textContent = "\u25c6" + cost; }
    const ttl = document.getElementById("ccTitle"); if (ttl) ttl.textContent = ccOpenTab === "zones" ? "ZONES" : "COMMAND CENTER";
    const sum = document.getElementById("ccSummary");
    if (sum) { sum.style.display = ccOpenTab === "roster" ? "" : "none"; if (ccOpenTab === "roster") { const st = radialSquadStats("all"); sum.textContent = st.total + " UNITS \u00b7 " + st.working + " WORKING \u00b7 AVG LEVEL " + st.avgLevel + " \u00b7 " + st.evolved + " EVOLVED"; } }
    const sqBox = document.getElementById("ccSquads"); if (sqBox) { sqBox.style.display = ccOpenTab === "roster" ? "flex" : "none"; if (ccOpenTab === "roster") { const sg = _ccSqSig(); if (sg !== _ccSqSigS || !sqBox.firstChild) { _ccSqSigS = sg; try { _ccDrawSquads(sqBox); } catch (e) { /* never take the game down */ } } } }
    const filters = document.getElementById("ccFilters"), grid = document.getElementById("ccGrid"), page = document.getElementById("ccPage"), side = document.getElementById("ccSide");
    if (!filters || !grid || !page || !side) return;
    const roster = ccOpenTab === "roster";
    grid.style.display = roster ? "grid" : "none"; filters.style.display = roster ? "flex" : "none"; page.style.display = roster ? "none" : "block";
    side.style.display = ccOpenTab === "zones" ? "none" : "flex";
    if (roster) { _ccDrawFilters(filters); _ccDrawGrid(grid); }
    else { const sig = _ccZonesSig(); if (sig !== _ccPageSig || !page.firstChild) { _ccPageSig = sig; const keep = page.scrollTop; page.textContent = ""; try { _ccDrawSquad(page); } catch (e) { /* never take the game down */ } page.scrollTop = keep; } }
    if (ccOpenTab !== "zones") { const sg = _ccSideSigNow(); if (sg !== _ccSideSig || !side.firstChild) { _ccSideSig = sg; const keep = side.scrollTop; try { _ccDrawSide(side); } catch (e) {} side.scrollTop = keep; } }
    ccRefreshChip();
}

function _ccDrawFilters(box) {
    box.textContent = "";
    const unlocked = typeof unlockedElements !== "undefined" ? unlockedElements : new Set();
    const add = (label, col, on, fn) => box.appendChild(_ccBtn(label, col, on, fn, "small"));
    add("ALL", "#19e6c1", !ccFilter.element && !ccFilter.role && !ccFilter.duty && !ccFilter.kind, () => { ccFilter = { element: null, role: null, duty: null, kind: null }; });
    (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).forEach(el => { if (unlocked.has(el.id)) add(el.label, el.color, ccFilter.element === el.id, () => { ccFilter.element = ccFilter.element === el.id ? null : el.id; }); });
    [["BRAWL", "brawler", "#ff4a1c"], ["MAGE", "sniper", "#a64dff"], ["TECH", "camper", "#8fe3ff"]].forEach(r => add(r[0], r[2], ccFilter.role === r[1], () => { ccFilter.role = ccFilter.role === r[1] ? null : r[1]; }));
    [["WORKING", "worker", "#19e6c1"], ["FIGHTING", "fighter", "#ffe733"]].forEach(r => add(r[0], r[2], ccFilter.duty === r[1], () => { ccFilter.duty = ccFilter.duty === r[1] ? null : r[1]; }));
    add("CLONES", "#99ddff", ccFilter.kind === "clone", () => { ccFilter.kind = ccFilter.kind === "clone" ? null : "clone"; });
    const sp = _ccEl("span", "cc-spacer"); box.appendChild(sp);
    box.appendChild(_ccBtn("SELECT SHOWN", "#ffe733", false, () => ccSetSelection(ccUnits(ccFilter)), "small"));
    box.appendChild(_ccBtn("CLEAR", "#ff4a1c", false, () => ccClearSelection(), "small"));
}

function _ccDrawGrid(grid) {
    const rows = ccUnits(ccFilter).map(ccRow).sort((a, b) => (b.evolved - a.evolved) || (b.level - a.level));
    const keep = new Set(rows.map(r => r.unit));
    for (const [u, el] of _ccCards) if (!keep.has(u)) { el.remove(); _ccCards.delete(u); }
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
    if (!rows.length) { if (!grid.querySelector(".cc-empty")) grid.appendChild(_ccEl("div", "cc-empty", "NOBODY HERE: TAP + RECRUIT ABOVE TO CALL A FOLLOWER")); }
    else { const e = grid.querySelector(".cc-empty"); if (e) e.remove(); }
}
function _ccMakeCard(r) {
    const card = _ccEl("div", "cc-card"); card._unit = r.unit;
    const cv = _ccEl("canvas", "cc-thumb"); cv.width = 72; cv.height = 72; card.appendChild(cv); card._cv = cv;
    const mid = _ccEl("div", "cc-mid");
    mid.appendChild(_ccEl("div", "cc-name")); mid.appendChild(_ccEl("div", "cc-sub")); mid.appendChild(_ccEl("div", "cc-status"));
    const bar = _ccEl("div", "cc-bar"); bar.appendChild(_ccEl("i")); mid.appendChild(bar);
    mid.appendChild(_ccEl("div", "cc-tags")); card.appendChild(mid);
    card.appendChild(_ccEl("div", "cc-tick", "✓"));
    // INFO on the card: this unit's attacks, jobs and stats (js/unitinfo.js). It does not select the card.
    const inf = _ccEl("button", "cc-info", "INFO"); inf.setAttribute("aria-label", "Info"); _ccClick(inf, () => { if (typeof unitInfoOpen === "function") unitInfoOpen(r.unit); }); card.appendChild(inf);
    _ccClick(card, () => { ccToggle(r.unit); ccRender(); });
    return card;
}
function _ccUpdateCard(card, r) {
    card.style.setProperty("--c", _ccColour(r.element)); card.classList.toggle("sel", r.selected); card.classList.toggle("clone", r.clone);
    card.querySelector(".cc-name").textContent = r.name;
    card.querySelector(".cc-sub").textContent = (r.clone ? "CLONE" : _ccElLabel(r.element)) + " · LV " + r.level;
    card.querySelector(".cc-bar i").style.width = Math.round(r.hp * 100) + "%";
    const st = card.querySelector(".cc-status"); if (st) { st.textContent = r.status ? r.status.text : ""; st.setAttribute("style", r.status ? "--c:" + r.status.col + ";" : "display:none;"); }
    const tags = card.querySelector(".cc-tags"), want = [];
    if (!r.clone) want.push(({ brawler: "BRAWL", sniper: "MAGE", camper: "TECH" })[r.role] || "BRAWL");
    if (!r.clone) want.push(r.playStyle === "defensive" ? "DEF" : r.playStyle === "aggressive" ? "AGG" : "BAL");
    if (r.squad) want.push("SQ " + r.squad);
    if (r.holding) want.push("HOLD"); if (r.working) want.push("WORK"); if (r.evolved) want.push("EVOLVED");
    const sig = want.join("|"); if (tags._sig !== sig) { tags._sig = sig; tags.textContent = ""; want.forEach(w => { const t = _ccEl("span", "cc-tag " + (w.indexOf("SQ ") === 0 ? "sq" : w.toLowerCase()), w); if (w.indexOf("SQ ") === 0) { const c = squadColour(w.slice(3)); t.style.color = c; t.style.borderColor = c; } tags.appendChild(t); }); }
    const key = r.unit.evolved + "|" + r.unit.element; if (card._thumbKey !== key) { card._thumbKey = key; _ccThumb(card._cv, r.unit); }
    if (!card._thumbDone) { const d = r.unit.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[r.unit.evolved] : null; if (d && d._img && d._img.complete) { card._thumbDone = true; _ccThumb(card._cv, r.unit); } }
}
function _ccThumb(cv, f) {
    const g = cv.getContext && cv.getContext("2d"); if (!g) return; g.clearRect(0, 0, cv.width, cv.height);
    const d = f.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[f.evolved] : null, im = d && typeof _evoImg === "function" ? _evoImg(d) : null;
    if (im) { try { g.drawImage(im, 8, 2 * 144 + 6, 128, 128, 0, 0, cv.width, cv.height); return; } catch (e) {} }
    g.fillStyle = _ccColour(f.element); g.globalAlpha = 0.85; g.beginPath();
    if (f.isClone) { g.ellipse(36, 44, 22, 14, 0, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; g.fillStyle = "#05070f"; g.font = "900 22px sans-serif"; g.textAlign = "center"; g.fillText(String(f.speciesName || "?").charAt(0).toUpperCase(), 36, 52); }
    else { g.ellipse(36, 42, 18, 24, 0, 0, Math.PI * 2); g.fill(); }
}

// The right-hand panel: what the SELECTION does.
function _ccDrawSide(side) {
    side.textContent = "";
    const S = ccSelectionSummary(), exactSq = _ccExactSquad(ccSelectionList());
    if (exactSq) {
        // the selection IS a squad: its own menu, with the members, then the orders below as for any selection
        const col = squadColour(exactSq), mem = squadMembers(exactSq);
        const t = _ccEl("div", "cc-sel-title", "SQUAD " + exactSq); t.style.color = col; t.style.textShadow = "0 0 12px " + col; side.appendChild(t);
        side.appendChild(_ccEl("div", "cc-sel-sub", mem.length + " OF " + SQUAD_MAX + " \u00b7 ORDERS IN THE WORLD GO TO THE SQUAD \u00b7 GEAR FOR A SQUAD WILL REACH ALL OF THEM"));
        const box = _ccEl("div", "cc-sqm"); mem.forEach(m => { const r = _ccEl("div", "cc-sqm-row"); r.style.setProperty("--c", _ccColour(m.element)); r.appendChild(_ccEl("span", "cc-sqm-n", (typeof unitTypeLabel === "function" ? unitTypeLabel(m) : "UNIT") + " \u00b7 LV " + (m.level || 1))); const st = typeof unitStatus === "function" ? unitStatus(m) : null; if (st) r.appendChild(_ccEl("span", "cc-sqm-s", st.text)); box.appendChild(r); }); side.appendChild(box);
        const dr = _ccEl("div", "cc-row"); dr.appendChild(_ccBtn("DISBAND SQUAD", "#8aa0c8", false, () => squadDisband(exactSq), "wide")); side.appendChild(dr);
    } else {
    side.appendChild(_ccEl("div", "cc-sel-title", "SELECTED " + S.count));
    side.appendChild(_ccEl("div", "cc-sel-sub", S.count ? S.followers + " FOLLOWERS · " + S.clones + " CLONES · ORDERS IN THE WORLD GO TO THEM" : "CLICK A CARD TO SELECT IT"));
    }
    _ccQuickSelect(side);
    const sel = ccSelectionList();
    _ccDrawSquadControls(side, sel);
    const sec = t => { const d = _ccEl("div", "cc-sec", t); side.appendChild(d); return d; };
    const row = () => { const d = _ccEl("div", "cc-row"); side.appendChild(d); return d; };
    const dis = n => n === 0;
    sec("ATTACK STYLE"); let r = row();
    ATTACK_STYLES.forEach(s => { const b = _ccBtn(s.label, s.col, S.role === s.id ? true : S.role === "mixed" ? "mixed" : false, () => ccApplyRole(sel, s.id), "wide", s.blurb); if (S.followers - S.lockedRole - 0 <= 0) b.disabled = true; r.appendChild(b); });
    if (S.lockedRole) side.appendChild(_ccEl("div", "cc-note", S.lockedRole + " EVOLVED FORM" + (S.lockedRole > 1 ? "S" : "") + " KEEP THEIR ROLE"));
    sec("PLAY STYLE"); r = row();
    PLAY_STYLES.forEach(p => { const b = _ccBtn(p.label, "#ffe733", S.playStyle === p.id ? true : S.playStyle === "mixed" ? "mixed" : false, () => ccApplyPlayStyle(sel, p.id), "wide", p.blurb); if (!S.followers) b.disabled = true; r.appendChild(b); });
    sec("STANCE"); r = row();
    [["FOLLOW ME", "follow", "#19e6c1", "GOES WHERE YOU GO"], ["HOLD HERE", "hold", "#8fe3ff", "STANDS ITS GROUND"]].forEach(s => { const b = _ccBtn(s[0], s[2], S.stance === s[1] ? true : S.stance === "mixed" ? "mixed" : false, () => ccApplyStance(sel, s[1]), "wide", s[3]); if (!S.count) b.disabled = true; r.appendChild(b); });
    sec("DUTY"); r = row();
    [["FIGHT", "fighter", "#ff4a1c", "ON THE LINE"], ["WORK", "worker", "#00ccaa", S.canWork + " OF " + S.count + " CAN WORK"]].forEach(s => { const b = _ccBtn(s[0], s[2], S.duty === s[1] ? true : S.duty === "mixed" ? "mixed" : false, () => ccApplyDuty(sel, s[1]), "wide", s[3]); if (!S.count) b.disabled = true; r.appendChild(b); });
    sec("OTHER"); r = row();
    const rr = _ccBtn(ccRerollArmed ? "TAP AGAIN: RE-ROLL " + S.followers : "RE-ROLL", "#ff4a1c", ccRerollArmed, () => { if (!S.followers) return; if (!ccRerollArmed) ccRerollArmed = true; else { ccApplyReroll(sel); ccRerollArmed = false; } }, "wide", "BACK TO THE CRYSTAL, MADE AGAIN"); if (!S.followers) rr.disabled = true; r.appendChild(rr);
    r.appendChild(_ccBtn("CLEAR SELECTION", "#8aa0c8", false, () => { ccClearSelection(); ccRerollArmed = false; }, "wide", "BACK TO THE USUAL SQUAD"));
    _ccDrawSquadOrders(side);
}

// The shard readout beside RECRUIT: "◆ 200" and "30 PER RECRUIT · 6 AFFORDABLE" (or "NEED 10 MORE" in red).
function ccShardsUpdate(el) {
    const cost = typeof RECRUIT_COST !== "undefined" ? RECRUIT_COST : 30, have = typeof shardCount !== "undefined" ? shardCount : 0, n = Math.floor(have / cost);
    const sig = have + "|" + cost; if (el._sig === sig) return; el._sig = sig;
    el.classList.toggle("short", have < cost);
    el.querySelector(".cc-sh-n").textContent = "\u25c6 " + have;
    el.querySelector(".cc-sh-c").textContent = have < cost ? "NEED " + (cost - have) + " MORE" : cost + " EACH \u00b7 " + n + " AFFORDABLE";
}
// What the squad strip shows: each squad, its members and whether each is selected.
function _ccSqSig() {
    if (typeof squadsLive !== "function") return "";
    return squadsLive().map(s => s.id + ":" + s.members.map(m => (m.level || 1) + (selectedUnits.has(m) ? "*" : "") + (m.evolved || "")).join(",")).join("|") + "#" + selectedUnits.size;
}
// Everything the side panel shows: the selection summary, the squads, the scope, the element, who would get world orders.
function _ccSideSigNow() {
    const pool = typeof getCommandPool === "function" ? getCommandPool().filter(f => !f.dead).length : 0;
    return JSON.stringify(ccSelectionSummary()) + "|" + _ccSqSig() + "|" + squadMode + "|" + (typeof player !== "undefined" ? player.selectedElement : "") + "|" + ccRerollArmed + "|" + pool + "|" + (typeof unlockedElements !== "undefined" ? unlockedElements.size : 0);
}
// The squad the selection IS (every member of one squad and nobody else), else null.
function _ccExactSquad(sel) {
    if (typeof squadOf !== "function" || !sel.length || sel.some(a => a.isClone)) return null;
    const id = squadOf(sel[0]); if (!id || sel.some(a => squadOf(a) !== id)) return null;
    return squadMembers(id).length === sel.length ? id : null;
}
// ROSTER SQUADS (js/squads.js): the strip above the cards, one chip per squad with its members, SELECT and DISBAND.
function _ccDrawSquads(box) {
    box.textContent = "";
    const live = typeof squadsLive === "function" ? squadsLive() : [];
    if (!live.length) { box.appendChild(_ccEl("div", "cc-sq-hint", "SQUADS: 1) TAP UP TO 3 CARDS  2) TAP MAKE SQUAD (RIGHT)  3) TAP THE SQUAD HERE TO SELECT IT AGAIN")); return; }
    live.forEach(sq => {
        const c = _ccEl("div", "cc-sq"); c.style.setProperty("--c", sq.col);
        c.appendChild(_ccEl("div", "cc-sq-badge", sq.id));
        const mem = _ccEl("div", "cc-sq-mem"); sq.members.forEach(m => { const l = _ccEl("div", "", (typeof unitTypeLabel === "function" ? unitTypeLabel(m) : "UNIT")); l.appendChild(_ccEl("i", "", " LV " + (m.level || 1))); mem.appendChild(l); }); c.appendChild(mem);
        const on = sq.members.every(m => selectedUnits.has(m)) && selectedUnits.size === sq.members.length;
        if (on) c.classList.add("on");
        // the whole chip selects the squad (tap it again to let it go); DISBAND is the small button
        _ccClick(c, () => { if (on) ccClearSelection(); else squadSelect(sq.id); ccRender(); });
        c.appendChild(_ccBtn(on ? "SELECTED" : "SELECT", sq.col, on, () => { if (on) ccClearSelection(); else squadSelect(sq.id); }, "small"));
        const dis = _ccBtn("DISBAND", "#8aa0c8", false, () => squadDisband(sq.id), "small"); c.appendChild(dis);
        box.appendChild(c);
    });
}
// The side panel's squad controls for the selection: MAKE SQUAD, ADD TO a squad with room, LEAVE.
function _ccDrawSquadControls(side, sel) {
    if (typeof squadMake !== "function") return;
    const fol = sel.filter(a => !a.isClone), inSq = fol.filter(a => squadOf(a));
    side.appendChild(_ccEl("div", "cc-sec", "SQUADS (UP TO " + SQUAD_MAX + ")"));
    const r = _ccEl("div", "cc-row wrap"); side.appendChild(r);
    const mk = _ccBtn("MAKE SQUAD", "#19e6c1", false, () => squadMake(fol), "wide", fol.length ? fol.length + " SELECTED" : "SELECT FOLLOWERS"); if (!fol.length || fol.length > SQUAD_MAX) mk.disabled = true; r.appendChild(mk);
    squadsLive().forEach(sq => { const room = SQUAD_MAX - sq.members.length, joining = fol.filter(a => a.squadId !== sq.id).length;
        if (!fol.length || !joining || joining > room) return; r.appendChild(_ccBtn("ADD TO " + sq.id, sq.col, false, () => squadAssign(sq.id, fol), "small", sq.members.length + " OF " + SQUAD_MAX)); });
    if (inSq.length) r.appendChild(_ccBtn("LEAVE SQUAD", "#8aa0c8", false, () => squadLeave(inSq), "small"));
}
// QUICK SELECT: pick a whole group in one tap, at the top of the panel, so the orders under it are for them.
function _ccQuickSelect(side) {
    const grp = (t, kids) => { side.appendChild(_ccEl("div", "cc-sec", t)); const r = _ccEl("div", "cc-row wrap"); kids.forEach(k => r.appendChild(k)); side.appendChild(r); };
    grp("QUICK SELECT", [
        _ccBtn("EVERYONE", "#ffe733", false, () => ccSetSelection(ccUnits({})), "small"), _ccBtn("ALL FIGHTERS", "#ff4a1c", false, () => ccSetSelection(ccUnits({ duty: "fighter" })), "small"),
        _ccBtn("ALL WORKERS", "#00ccaa", false, () => ccSetSelection(ccUnits({ duty: "worker" })), "small"), _ccBtn("ALL BRAWLERS", "#ff4a1c", false, () => ccSetSelection(ccUnits({ role: "brawler" })), "small"),
        _ccBtn("ALL MAGES", "#a64dff", false, () => ccSetSelection(ccUnits({ role: "sniper" })), "small"), _ccBtn("ALL TECHNICIANS", "#8fe3ff", false, () => ccSetSelection(ccUnits({ role: "camper" })), "small"), _ccBtn("NOBODY", "#8aa0c8", false, () => ccClearSelection(), "small"),
    ]);
}
// The squad-wide orders (they were the COMMAND page): who world orders go to, quick selects, and orders for the whole pool. Appended to the side panel.
function _ccDrawSquadOrders(side) {
    side.appendChild(_ccEl("div", "cc-sel-title ccs", "SQUAD ORDERS"));
    side.appendChild(_ccEl("div", "cc-sel-sub", (ccSelectionList().length ? ccSelectionList().length + " SELECTED RECEIVE WORLD ORDERS" : (typeof getCommandPool === "function" ? getCommandPool().filter(f => !f.dead).length : 0) + " IN THE COMMAND POOL")));
    const grp = (t, kids) => { side.appendChild(_ccEl("div", "cc-sec", t)); const r = _ccEl("div", "cc-row wrap"); kids.forEach(k => r.appendChild(k)); side.appendChild(r); };
    grp("WHO GETS WORLD ORDERS (WHEN NOBODY IS SELECTED)", [
        _ccBtn("ALL ELEMENTS", "#19e6c1", squadMode === "all", () => radialSetScope(true), "wide", "THE WHOLE SQUAD"),
        _ccBtn("SELECTED ELEMENT: " + _ccElLabel(player.selectedElement), "#19e6c1", squadMode !== "all", () => radialSetScope(false), "wide", "ONE ELEMENT"),
    ]);
    grp("PICK AN ELEMENT", (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).filter(e => typeof unlockedElements !== "undefined" && unlockedElements.has(e.id)).map(el => _ccBtn(el.label, el.color, player.selectedElement === el.id, () => radialSelectElement(el.id), "small")));
    grp("COMMANDS FOR THE POOL", [
        _ccBtn("SWITCH ROLES", "#ffe733", false, () => cycleCommandPoolRoles(), "wide", "BRAWLER → MAGE → TECHNICIAN"),
        _ccBtn("ALL TO WORK", "#00ccaa", false, () => radialSetAllWork(true), "wide", "ELECTRIC, FLUX, CORE, TOXIC, ICE"),
        _ccBtn("ALL TO FIGHT", "#ff4a1c", false, () => radialSetAllWork(false), "wide", "BACK ON THE LINE"),
    ]);
}

// ZONES (the tab was ANALYTICS; it is zones, teleports, crews and orders now): the squad at a glance, then every zone: its status, network and equipment, with TELEPORT and CLEAR BROKEN (js/zones.js).
function _ccZonesSig() {
    const rep = typeof zoneReport === "function" ? zoneReport() : [], st = radialSquadStats("all");
    return JSON.stringify([rep.map(z => [z.z, z.status, z.held, z.generator, z.energy, z.network.map(n => n.el + n.tier + n.batteries).join(), z.equipment, z.modules, z.broken, z.offline, z.here, z.crew, z.orders, z.autoKit]), shardCount, typeof zoneFreeCrew === "function" ? zoneFreeCrew().total : 0, st.total, st.working, st.avgLevel, st.evolved]);
}
function _ccDrawSquad(page) {
    if (typeof zoneReport !== "function") return;
    const rep = zoneReport();
    page.appendChild(_ccEl("div", "cc-sub2", "EVERY ZONE'S STATUS, NETWORK AND EQUIPMENT \u00b7 TELEPORT TO A ZONE YOU HOLD \u00b7 CLEAR ITS BROKEN EQUIPMENT FOR A FEE"));
    for (const z of rep) page.appendChild(_ccZoneCard(z));
}
function _ccZoneCard(z) {
    const card = _ccEl("div", "cc-zone" + (z.here ? " here" : "")); card.style.setProperty("--c", z.statusColour);
    const head = _ccEl("div", "cz-head");
    head.appendChild(_ccEl("div", "cz-name", z.name)); head.appendChild(_ccEl("div", "cz-status", z.statusLabel));
    if (z.here) head.appendChild(_ccEl("div", "cz-here", "YOU ARE HERE"));
    card.appendChild(head);
    const body = _ccEl("div", "cz-body");
    const line = (k, kids) => { const r = _ccEl("div", "cz-line"); r.appendChild(_ccEl("span", "cz-k", k)); const v = _ccEl("span", "cz-v"); kids.forEach(x => v.appendChild(x)); r.appendChild(v); body.appendChild(r); };
    const chip = (text, col, cls) => { const c = _ccEl("span", "cz-chip" + (cls ? " " + cls : ""), text); if (col) c.style.setProperty("--c", col); return c; };
    line("NEST", [chip(z.held ? "HELD" : z.z === 0 ? "NO PORTAL" : "NOT HELD", z.held ? "#19e6c1" : "#6a7aa0")]);
    line("NETWORK", z.network.length ? z.network.map(n => chip(_ccElLabel(n.el) + " T" + n.tier + " \u00d7" + n.batteries, _ccColour(n.el))) : [chip(z.total ? "NO BANK \u2014 LINK 2 BATTERIES" : "NONE", "#6a7aa0")]);
    line("POWER", [chip(z.generator ? "POWER UNIT" : "NO POWER UNIT", z.generator ? "#cdd6e0" : "#ff9966"), chip("NESTS " + z.energy + " / " + z.energyMax, "#5fe0c8")]);
    const e = z.equipment, items = [["TURRET", "TURRETS", e.turrets, "#ff8a5c"], ["WAVE PYLON", "WAVE PYLONS", e.wave, "#a64dff"], ["BATTERY", "BATTERIES", e.batteries, "#ffd34d"], ["GENERATOR", "GENERATORS", e.generators, "#cdd6e0"], ["CONNECTOR", "CONNECTORS", e.connectors, "#ffd24a"], ["ULTRA", "ULTRAS", e.ultras, "#ffe733"], ["DORMANT PYLON", "DORMANT PYLONS", e.other, "#6a7aa0"]].filter(i => i[2] > 0).map(i => chip(i[2] + " " + (i[2] === 1 ? i[0] : i[1]), i[3]));
    Object.keys(z.modules).forEach(k => items.push(chip(z.modules[k] + " " + k, "#19e6c1")));
    line("EQUIPMENT", items.length ? items : [chip("NOTHING BUILT", "#6a7aa0")]);
    if (z.broken || z.offline) line("BROKEN", [chip((z.broken ? z.broken + " WRECKED" : "") + (z.broken && z.offline ? " \u00b7 " : "") + (z.offline ? z.offline + " OFFLINE" : ""), "#ff4a1c", "bad")]);
    // THE CREW and the BUILD ORDERS (js/zones.js)
    if (z.autoKit) line("AUTO KIT", [chip(z.autoKit.name + " \u00b7 " + z.autoKit.have + " OF " + z.autoKit.total + " \u00b7 " + z.autoKit.cls.toUpperCase() + " ZONE", "#19e6c1")]);
    line("CREW", z.crew.total ? [chip(z.crew.ants + " ANT" + (z.crew.ants === 1 ? "" : "S") + " \u00b7 " + z.crew.core + " CORE", "#8fe3ff")] : [chip("NONE SENT", "#6a7aa0")]);
    const oc = z.orders.map((o, i) => { const c = chip(o.label + " \u00b7 " + o.status, i === 0 ? "#8fe3ff" : "#6a7aa0", "order"); c.title = "Click to cancel"; _ccClick(c, () => { zoneCancelOrder(z.z, i); _ccPageSig = ""; ccRender(); }); return c; });
    const add = chip("+ ORDER", "#19e6c1", "add"); _ccClick(add, () => buildOrderPickerOpen(z.z)); oc.push(add);
    line("ORDERS", oc);
    card.appendChild(body);
    const acts = _ccEl("div", "cz-acts");
    const tp = _ccEl("button", "cz-btn" + (z.held ? "" : " dim"), "TELEPORT"); tp.style.setProperty("--c", "#8fe3ff"); if (!z.held) tp.appendChild(_ccEl("span", "cz-sub", z.z === 0 ? "NO PORTAL" : "HOLD A NEST HERE"));
    _ccClick(tp, () => { if (zoneTeleport(z.z)) ccClose(); }); acts.appendChild(tp);
    const free = typeof zoneFreeCrew === "function" ? zoneFreeCrew() : { total: 0, ants: 0, core: 0 };
    const sc = _ccEl("button", "cz-btn" + (z.held && free.total ? "" : " dim"), "SEND CREW"); sc.style.setProperty("--c", "#19e6c1");
    sc.appendChild(_ccEl("span", "cz-sub", !z.held ? "HOLD A NEST HERE" : free.total ? free.ants + " ANTS + " + free.core + " CORE FREE" : "NO FREE ANTS / CORE"));
    _ccClick(sc, () => { zoneSendCrew(z.z); _ccPageSig = ""; ccRender(); }); acts.appendChild(sc);
    if (z.crew.total) { const rc = _ccEl("button", "cz-btn", "RECALL CREW"); rc.style.setProperty("--c", "#ffe733"); rc.appendChild(_ccEl("span", "cz-sub", z.crew.total + " IN THE ZONE")); _ccClick(rc, () => { zoneRecallCrew(z.z); _ccPageSig = ""; ccRender(); }); acts.appendChild(rc); }
    const fee = z.fee, can = fee > 0, cb = _ccEl("button", "cz-btn" + (can && shardCount >= fee ? "" : " dim"), "CLEAR BROKEN"); cb.style.setProperty("--c", "#ff4a1c");
    cb.appendChild(_ccEl("span", "cz-sub", can ? "REMOVES WRECKS \u00b7 EST. \u25c6" + fee : "NOTHING BROKEN"));
    _ccClick(cb, () => { zoneClearBroken(z.z); _ccPageSig = ""; ccRender(); }); acts.appendChild(cb);
    card.appendChild(acts);
    return card;
}

// A chip above the dock while anyone is selected: how many, and a way to let them go.
function ccRefreshChip() {
    if (typeof document === "undefined" || !document.body) return;
    let chip = document.getElementById("selChip"); const n = ccSelectionList().length;
    if (!chip) {
        chip = _ccEl("div"); chip.id = "selChip"; chip.appendChild(_ccEl("span")); chip.firstChild.id = "selChipLabel";
        const b = _ccEl("button", null, "✕"); b.setAttribute("aria-label", "Clear the selection"); _ccClick(b, () => { ccClearSelection(); ccRefreshChip(); if (ccOpenTab) ccRender(); }); chip.appendChild(b);
        const o = _ccEl("button", null, "ROSTER"); _ccClick(o, () => ccOpen("roster")); chip.appendChild(o); document.body.appendChild(chip);
    }
    chip.style.display = n && !ccOpenTab ? "flex" : "none";
    const l = document.getElementById("selChipLabel"); if (l) l.textContent = n + " SELECTED";
}

function initCommandCenter() {
    if (typeof document === "undefined" || !document.body || document.getElementById("ccRoot")) return;
    const root = _ccEl("div"); root.id = "ccRoot"; document.body.appendChild(root);
    ccRefreshChip();
}
try { initCommandCenter(); } catch (e) { /* no page (the test sandbox): the logic above still works */ }

// ── THE BUILD ORDER PICKER ──
// What to queue in a zone: a GENERATOR, a BATTERY (an element, and ×1 / a pod of four / a pod of six) or a TURRET (an element). It is added to the zone's
// queue (js/zones.js zoneAddOrder); its cost is shown, and paid when the builders put it up.
function buildOrderPickerClose() { const r = document.getElementById("orderPicker"); if (r && r.parentNode) r.parentNode.removeChild(r); }
function buildOrderPickerOpen(z) {
    buildOrderPickerClose();
    const st = { mode: "piece", kind: "attack", elId: null, level: 1, kit: "strongpoint" };
    const els = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).filter(e => unlockedElements.has(e.id)); st.elId = els.length ? els[0].id : "fire";
    const root = _ccEl("div", "rp-pick"); root.id = "orderPicker"; root.classList.add("op"); _ccClick(root, () => buildOrderPickerClose());
    const card = _ccEl("div", "rpk-card"); _ccClick(card, () => {});
    card.appendChild(_ccEl("div", "rpk-title", "QUEUE A BUILD \u00b7 " + (z === 0 ? "HOME" : "ZONE " + z)));
    const sub = _ccEl("div", "rpk-sub", ""); card.appendChild(sub);
    const rows = _ccEl("div", "op-rows"); card.appendChild(rows);
    const row = _ccEl("div", "rpk-row"); const add = _ccEl("button", "rpk-btn mix", "QUEUE IT"), cancel = _ccEl("button", "rpk-btn", "CANCEL"); row.appendChild(add); row.appendChild(cancel); card.appendChild(row);
    const draw = () => {
        rows.textContent = "";
        const mk = (label, on, col, fn) => { const b = _ccEl("button", "rpk-el op-btn" + (on ? " on" : "")); b.style.setProperty("--c", col); b.appendChild(_ccEl("span", "rpk-name", label)); _ccClick(b, () => { fn(); draw(); }); return b; };
        const r0 = _ccEl("div", "op-row"); [["piece", "ONE PIECE"], ["kit", "A LAYOUT KIT"]].forEach(m => r0.appendChild(mk(m[1], st.mode === m[0], "#8fe3ff", () => { st.mode = m[0]; }))); rows.appendChild(r0);
        if (st.mode === "kit") {
            const kit = kitById(st.kit), okEls = kitElements(kit);
            if (okEls.indexOf(st.elId) < 0) st.elId = okEls[0] || st.elId;
            const rk = _ccEl("div", "op-row kits"); KITS.forEach(k => rk.appendChild(mk(k.name, st.kit === k.id, KIT_FAMILY_COLOUR[k.family], () => { st.kit = k.id; }))); rows.appendChild(rk);
            const re = _ccEl("div", "op-row"); okEls.forEach(id => { const e = ELEMENTS.find(x => x.id === id); re.appendChild(mk(e.label.toUpperCase(), st.elId === id, e.color, () => { st.elId = id; })); }); rows.appendChild(re);
            const nest = zoneTeleportNest(z) || world.find(t => t.nest && (z === 0 ? isHomePortal(t) : (!isHomePortal(t) && getZoneIndex(t.x) === z))), plan = nest && okEls.length ? kitFindPlacement(kit, st.elId, nest) : null;
            sub.textContent = !plan ? "NO ROOM OR NO NEST FOR " + kit.name : plan.blocked ? kit.name + ": " + plan.blocked + " PIECES BLOCKED (" + plan.pieces.find(p => p.state === "blocked").why + ")" : !plan.free ? kit.name + " IS ALREADY BUILT THERE" : kit.name + ": +" + plan.free + " PIECES \u00b7 \u25c6" + plan.cost + " WHEN PUT UP \u00b7 NEEDS AN ANT CREW IN THE ZONE";
            return;
        }
        const r1 = _ccEl("div", "op-row"); [["attack", "TURRET"]].forEach(k => r1.appendChild(mk(k[1], st.kind === k[0], "#ffe733", () => { st.kind = k[0]; if (k[0] !== "battery") st.level = 1; }))); rows.appendChild(r1);
        if (st.kind !== "generator") { const r2 = _ccEl("div", "op-row"); els.forEach(e => r2.appendChild(mk(e.label.toUpperCase(), st.elId === e.id, e.color, () => { st.elId = e.id; }))); rows.appendChild(r2); }
        if (st.kind === "battery") { const r3 = _ccEl("div", "op-row"); BUILD_LEVELS.power.forEach((l, i) => r3.appendChild(mk(l, st.level === i + 1, "#19e6c1", () => { st.level = i + 1; }))); rows.appendChild(r3); }
        const o = { kind: st.kind, elId: st.kind === "generator" ? GENERATOR_ID : st.elId, level: st.level };
        sub.textContent = "COSTS \u25c6" + zoneOrderCost(o) + " WHEN THE BUILDERS PUT IT UP \u00b7 NEEDS AN ANT CREW IN THE ZONE";
    };
    _ccClick(add, () => { if (st.mode === "kit") zoneQueueKit(z, st.kit, st.elId); else zoneAddOrder(z, { kind: st.kind, elId: st.elId, level: st.level }); buildOrderPickerClose(); _ccPageSig = ""; ccRender(); });
    _ccClick(cancel, () => buildOrderPickerClose());
    draw(); root.appendChild(card); document.body.appendChild(root); return root;
}
