// ─────────────────────────────────────────────────────────
//  THE COMMAND CENTER — the tablet and desktop menu (docs/UI-STYLE.md)
// ─────────────────────────────────────────────────────────
// REPORTED: "make the iPad and browser version have a menu at the bottom that has all the different menus and rosters and all that. It can take
// up the screen when accessing the roster and command center. I want the player to be able to select their creatures by clicking their card and
// changing their attack and play style. This replaces the current index."
//
// The bottom dock (game.html #topToggles) now has ROSTER, COMMAND and SQUAD buttons. Each opens this full-screen overlay on its tab:
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
        playStyle: ps.id, selected: selectedUnits.has(a),
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
function drawSelectedUnitRings() {
    if (!selectedUnits.size || typeof ctx === "undefined" || typeof player === "undefined") return;
    const W = canvas.width / 2, H = canvas.height / 2, t = (typeof frame !== "undefined" ? frame : 0) * 0.08;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const a of selectedUnits) {
        if (!a || a.dead) continue;
        const px = (a.x - player.visualX - (a.y - player.visualY)) * TILE_W + W, py = (a.x - player.visualX + (a.y - player.visualY)) * TILE_H + H + TILE_H;
        if (px < -60 || px > canvas.width + 60 || py < -60 || py > canvas.height + 60) continue;
        // (no shadowBlur: the game keeps it off the canvas for speed. A wider, fainter ring under the sharp one gives the glow.)
        ctx.lineWidth = 7; ctx.strokeStyle = "rgba(25,230,193,0.22)"; ctx.beginPath(); ctx.ellipse(px, py, 26, 12, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 2.5; ctx.strokeStyle = "rgba(25,230,193," + (0.7 + 0.25 * Math.sin(t + a.x)) + ")"; ctx.beginPath(); ctx.ellipse(px, py, 26, 12, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
}

// ═════════ THE OVERLAY (DOM) ═════════
let ccOpenTab = null, ccFilter = { element: null, role: null, duty: null, kind: null }, ccRerollArmed = false, _ccTimer = 0;
const _ccCards = new Map();   // unit → its card element (updated in place, so a click is never lost to a redraw)

function _ccEl(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function _ccClick(el, fn) { el.addEventListener("click", ev => { ev.stopPropagation(); fn(ev); }); }
function _ccColour(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.color : "#8aa0c8"; }
function _ccElLabel(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.label : String(id || "").toUpperCase(); }

function ccOpen(tab) {
    ccOpenTab = tab || "roster"; ccRerollArmed = false;
    const root = document.getElementById("ccRoot"); if (!root) return;
    root.classList.add("open"); document.body.classList.add("ccOpen");
    clearInterval(_ccTimer); _ccTimer = setInterval(ccRender, CC_REFRESH_MS);
    ccBuildFrame(); ccRender();
}
function ccClose() {
    ccOpenTab = null; ccRerollArmed = false; clearInterval(_ccTimer); _ccTimer = 0;
    const root = document.getElementById("ccRoot"); if (root) root.classList.remove("open");
    if (document.body) document.body.classList.remove("ccOpen");
    _ccCards.clear();
    const grid = document.getElementById("ccGrid"); if (grid) grid.textContent = "";
    ccRefreshChip();
}
function ccToggleOpen(tab) { if (ccOpenTab === tab) ccClose(); else ccOpen(tab); }

function ccBuildFrame() {
    const root = document.getElementById("ccRoot"); if (!root || root.getAttribute("data-built")) return;
    root.setAttribute("data-built", "1");
    const head = _ccEl("div", "cc-head"); head.appendChild(_ccEl("div", "cc-title", "COMMAND CENTER"));
    const tabs = _ccEl("div", "cc-tabs"); tabs.id = "ccTabs";
    [["roster", "ROSTER"], ["command", "COMMAND"], ["squad", "SQUAD"]].forEach(t => { const b = _ccEl("button", "cc-tab", t[1]); b.setAttribute("data-tab", t[0]); _ccClick(b, () => { ccOpenTab = t[0]; ccRerollArmed = false; _ccCards.clear(); const g = document.getElementById("ccGrid"); if (g) g.textContent = ""; ccRender(); }); tabs.appendChild(b); });
    head.appendChild(tabs);
    // RECRUIT: a follower at the Crystal for RECRUIT_COST shards (clone.js recruitFollower), on the ROSTER tab only. It dims when the shards are short.
    const rec = _ccEl("button", "cc-recruit"); rec.id = "ccRecruit"; rec.appendChild(_ccEl("span", "cc-rl", "+ RECRUIT")); rec.appendChild(_ccEl("span", "cc-rs", ""));
    _ccClick(rec, () => { recruitFollower(); ccRender(); }); head.appendChild(rec);
    const x = _ccEl("button", "cc-close", "✕ CLOSE"); x.id = "ccClose"; _ccClick(x, ccClose); head.appendChild(x); root.appendChild(head);
    const body = _ccEl("div", "cc-body"); body.id = "ccBody";
    const main = _ccEl("div", "cc-main"); main.id = "ccMain"; main.appendChild(_ccEl("div", "cc-filters")); main.lastChild.id = "ccFilters";
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
    if (rec) { rec.style.display = ccOpenTab === "roster" ? "" : "none"; const cost = typeof RECRUIT_COST !== "undefined" ? RECRUIT_COST : 30, can = shardCount >= cost; rec.classList.toggle("dim", !can); const rs = rec.querySelector(".cc-rs"); if (rs) rs.textContent = "\u25c6" + cost; }
    root.querySelectorAll("#ccTabs .cc-tab").forEach(t => t.classList.toggle("on", t.getAttribute("data-tab") === ccOpenTab));
    const filters = document.getElementById("ccFilters"), grid = document.getElementById("ccGrid"), page = document.getElementById("ccPage"), side = document.getElementById("ccSide");
    if (!filters || !grid || !page || !side) return;
    const roster = ccOpenTab === "roster";
    grid.style.display = roster ? "grid" : "none"; filters.style.display = roster ? "flex" : "none"; page.style.display = roster ? "none" : "block";
    side.style.display = ccOpenTab === "squad" ? "none" : "flex";
    if (roster) { _ccDrawFilters(filters); _ccDrawGrid(grid); }
    else { page.textContent = ""; try { if (ccOpenTab === "command") _ccDrawCommand(page); else _ccDrawSquad(page); } catch (e) { /* never take the game down */ } }
    if (ccOpenTab !== "squad") { try { _ccDrawSide(side); } catch (e) {} }
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
    mid.appendChild(_ccEl("div", "cc-name")); mid.appendChild(_ccEl("div", "cc-sub"));
    const bar = _ccEl("div", "cc-bar"); bar.appendChild(_ccEl("i")); mid.appendChild(bar);
    mid.appendChild(_ccEl("div", "cc-tags")); card.appendChild(mid);
    card.appendChild(_ccEl("div", "cc-tick", "✓"));
    _ccClick(card, () => { ccToggle(r.unit); ccRender(); });
    return card;
}
function _ccUpdateCard(card, r) {
    card.style.setProperty("--c", _ccColour(r.element)); card.classList.toggle("sel", r.selected); card.classList.toggle("clone", r.clone);
    card.querySelector(".cc-name").textContent = r.name;
    card.querySelector(".cc-sub").textContent = (r.clone ? "CLONE" : _ccElLabel(r.element)) + " · LV " + r.level;
    card.querySelector(".cc-bar i").style.width = Math.round(r.hp * 100) + "%";
    const tags = card.querySelector(".cc-tags"), want = [];
    if (!r.clone) want.push(({ brawler: "BRAWL", sniper: "MAGE", camper: "TECH" })[r.role] || "BRAWL");
    if (!r.clone) want.push(r.playStyle === "defensive" ? "DEF" : r.playStyle === "aggressive" ? "AGG" : "BAL");
    if (r.holding) want.push("HOLD"); if (r.working) want.push("WORK"); if (r.evolved) want.push("EVOLVED");
    const sig = want.join("|"); if (tags._sig !== sig) { tags._sig = sig; tags.textContent = ""; want.forEach(w => tags.appendChild(_ccEl("span", "cc-tag " + w.toLowerCase(), w))); }
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
    const S = ccSelectionSummary();
    side.appendChild(_ccEl("div", "cc-sel-title", "SELECTED " + S.count));
    side.appendChild(_ccEl("div", "cc-sel-sub", S.count ? S.followers + " FOLLOWERS · " + S.clones + " CLONES · ORDERS IN THE WORLD GO TO THEM" : "CLICK A CARD TO SELECT IT"));
    const sel = ccSelectionList();
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
}

function _ccDrawCommand(page) {
    page.appendChild(_ccEl("div", "cc-page-title", "SQUAD ORDERS"));
    page.appendChild(_ccEl("div", "cc-sub2", (ccSelectionList().length ? ccSelectionList().length + " SELECTED RECEIVE WORLD ORDERS" : (typeof getCommandPool === "function" ? getCommandPool().filter(f => !f.dead).length : 0) + " IN THE COMMAND POOL")));
    const grp = (t, kids) => { page.appendChild(_ccEl("div", "cc-sec", t)); const r = _ccEl("div", "cc-row wrap"); kids.forEach(k => r.appendChild(k)); page.appendChild(r); };
    grp("WHO GETS WORLD ORDERS (WHEN NOBODY IS SELECTED)", [
        _ccBtn("ALL ELEMENTS", "#19e6c1", squadMode === "all", () => radialSetScope(true), "wide", "THE WHOLE SQUAD"),
        _ccBtn("SELECTED ELEMENT: " + _ccElLabel(player.selectedElement), "#19e6c1", squadMode !== "all", () => radialSetScope(false), "wide", "ONE ELEMENT"),
    ]);
    grp("PICK AN ELEMENT", (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).filter(e => typeof unlockedElements !== "undefined" && unlockedElements.has(e.id)).map(el => _ccBtn(el.label, el.color, player.selectedElement === el.id, () => radialSelectElement(el.id), "small")));
    grp("QUICK SELECT", [
        _ccBtn("EVERYONE", "#ffe733", false, () => ccSetSelection(ccUnits({})), "small"), _ccBtn("ALL FIGHTERS", "#ff4a1c", false, () => ccSetSelection(ccUnits({ duty: "fighter" })), "small"),
        _ccBtn("ALL WORKERS", "#00ccaa", false, () => ccSetSelection(ccUnits({ duty: "worker" })), "small"), _ccBtn("ALL BRAWLERS", "#ff4a1c", false, () => ccSetSelection(ccUnits({ role: "brawler" })), "small"),
        _ccBtn("ALL MAGES", "#a64dff", false, () => ccSetSelection(ccUnits({ role: "sniper" })), "small"), _ccBtn("ALL TECHNICIANS", "#8fe3ff", false, () => ccSetSelection(ccUnits({ role: "camper" })), "small"), _ccBtn("NOBODY", "#8aa0c8", false, () => ccClearSelection(), "small"),
    ]);
    grp("COMMANDS FOR THE POOL", [
        _ccBtn("SWITCH ROLES", "#ffe733", false, () => cycleCommandPoolRoles(), "wide", "BRAWLER → MAGE → TECHNICIAN"),
        _ccBtn("ALL TO WORK", "#00ccaa", false, () => radialSetAllWork(true), "wide", "ELECTRIC, FLUX, CORE, TOXIC, ICE"),
        _ccBtn("ALL TO FIGHT", "#ff4a1c", false, () => radialSetAllWork(false), "wide", "BACK ON THE LINE"),
    ]);
}

function _ccDrawSquad(page) {
    const st = radialSquadStats("all");
    page.appendChild(_ccEl("div", "cc-page-title", "SQUAD ANALYTICS"));
    page.appendChild(_ccEl("div", "cc-sub2", st.total + " UNITS · " + st.working + " WORKING · AVERAGE LEVEL " + st.avgLevel + " · " + st.evolved + " EVOLVED"));
    const tbl = _ccEl("div", "cc-table");
    (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).forEach(el => {
        if (typeof unlockedElements !== "undefined" && !unlockedElements.has(el.id)) return;
        const e = st.byElement[el.id] || { n: 0, hp: 0 }, row = _ccEl("div", "cc-trow" + (player.selectedElement === el.id ? " sel" : "")); row.style.setProperty("--c", el.color);
        row.appendChild(_ccEl("span", "cc-tname", el.label)); row.appendChild(_ccEl("span", "cc-tcount", String(e.n)));
        const bar = _ccEl("div", "cc-bar"), i = _ccEl("i"); i.style.width = Math.round(e.hp * 100) + "%"; bar.appendChild(i); row.appendChild(bar);
        _ccClick(row, () => { radialSelectElement(el.id); ccSetSelection(ccUnits({ element: el.id })); ccRender(); }); tbl.appendChild(row);
    });
    page.appendChild(tbl);
    page.appendChild(_ccEl("div", "cc-sec", "ROLES"));
    const chips = _ccEl("div", "cc-row wrap");
    [["BRAWLERS", st.roles.brawler, "#ff4a1c"], ["MAGES", st.roles.mage, "#a64dff"], ["TECHNICIANS", st.roles.technician, "#8fe3ff"], ["WORKERS", st.roles.worker, "#19e6c1"]].forEach(r => { const c = _ccEl("div", "cc-chip", r[0] + "  " + r[1]); c.style.setProperty("--c", r[2]); chips.appendChild(c); });
    page.appendChild(chips);
    page.appendChild(_ccEl("div", "cc-note", "CLICK AN ELEMENT TO SELECT ALL OF ITS UNITS"));
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
