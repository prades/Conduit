// ─────────────────────────────────────────────────────────
//  THE RADIAL MENU — the phone's menu (docs/UI-STYLE.md)
// ─────────────────────────────────────────────────────────
// REPORTED: "for mobile it should be a left radial menu with squad analytics and roster and commands." On a phone the top row of buttons
// is gone; one thumb-sized HUB sits on the left edge. Tapping it fans out five slabs:
//
//   SQUAD   analytics: the count, health and role split of the squad, per element (tap a row to select that element)
//   ROSTER  every follower as a card: its form, level, health and duty (tap its WORK switch to put it on or take it off the crew)
//   ORDERS  commands for the squad: all elements or the selected one, a role filter, switch roles, all to work / all to fight
//   BUILD   toggles build mode (the same as the BUILD button)
//   AUTO    toggles autoplay (the same as the AUTO button)
//
// It is DOM, shown only at phone widths (css in game.html); on a desktop the bottom dock does the same job. Everything reads the live game:
// radialSquadStats() / radialRosterRows() are plain functions of followers[] (no DOM), so the numbers can be tested without a page.

const RADIAL_PETALS = [
    { id: "squad",  label: "SQUAD",  col: "#19e6c1", icon: "◉" },
    { id: "roster", label: "ROSTER", col: "#a64dff", icon: "▦" },
    { id: "orders", label: "ORDERS", col: "#ffe733", icon: "➤" },
    { id: "build",  label: "BUILD",  col: "#ff4a1c", icon: "⚒" },
    { id: "auto",   label: "AUTO",   col: "#8fe3ff", icon: "⚙" },
];
const RADIAL_REFRESH_MS = 400;
let radialOpen = false, radialPanel = null, radialFilter = "all", _radialTimer = 0;

// The roles as the player sees them (js/config.js roleLabel): brawler, mage ("sniper" in the code), technician ("camper").
function _radialRoleKey(f) { return f.duty === "worker" ? "worker" : f.role === "sniper" ? "mage" : f.role === "camper" ? "technician" : "brawler"; }

// A plain summary of the squad, optionally narrowed ("all" | "work" | "fight"). No DOM.
function radialSquadStats(filter) {
    const list = (typeof followers !== "undefined" ? followers : []).filter(f => f && !f.dead && f.isFollower !== false && !f.isClone);
    const keep = list.filter(f => filter === "work" ? f.duty === "worker" : filter === "fight" ? f.duty !== "worker" : true);
    const out = { total: keep.length, working: 0, evolved: 0, avgLevel: 0, byElement: {}, roles: { brawler: 0, mage: 0, technician: 0, worker: 0 } };
    let lv = 0;
    for (const f of keep) {
        if (f.duty === "worker") out.working++;
        if (f.evolved) out.evolved++;
        lv += f.level || 1;
        const e = out.byElement[f.element] || (out.byElement[f.element] = { n: 0, hp: 0 });
        e.n++; e.hp += Math.max(0, Math.min(1, (f.health || 0) / (f.maxHealth || 1)));
        out.roles[_radialRoleKey(f)]++;
    }
    for (const k in out.byElement) out.byElement[k].hp = out.byElement[k].hp / out.byElement[k].n;
    out.avgLevel = keep.length ? Math.round(lv / keep.length) : 0;
    return out;
}

// One row per follower for the ROSTER, best first (evolved, then level).
function radialRosterRows() {
    const list = (typeof followers !== "undefined" ? followers : []).filter(f => f && !f.dead && !f.isClone);
    return list.map(f => ({
        f, element: f.element, name: typeof unitTypeLabel === "function" ? unitTypeLabel(f) : (f.evolved ? String(f.evolved).toUpperCase() : "EGG"),
        level: f.level || 1, hp: Math.max(0, Math.min(1, (f.health || 0) / (f.maxHealth || 1))), role: _radialRoleKey(f),
        evolved: !!f.evolved, working: f.duty === "worker", canWork: typeof canWorkMass === "function" ? canWorkMass(f) : false,
    })).sort((a, b) => (b.evolved - a.evolved) || (b.level - a.level));
}

function _radialElementColour(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.color : "#8aa0c8"; }
function _radialElementLabel(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.label : String(id).toUpperCase(); }

// ── the commands (each is the existing game action, so the menu and the rest of the game cannot disagree) ──
function radialSetAllWork(on) {
    const pool = (typeof getCommandPool === "function" ? getCommandPool() : []).filter(f => !f.dead && f.isFollower);
    let n = 0;
    for (const f of pool) if (setFollowerDuty(f, on ? "worker" : "fighter", true)) n++;
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined")
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: n ? (on ? n + " TO THE WORK CREW" : n + " BACK ON THE LINE") : (on ? "NONE CAN WORK" : "NONE WORKING"), color: on ? "#00ccaa" : "#0f8", life: 100, vy: -0.25, size: 12 });
    return n;
}
function radialSetScope(all) { squadMode = all ? "all" : "selected"; if (typeof updateSquadButton === "function") updateSquadButton(); }
function radialSetRole(role) { squadMode = "selected"; selectedRole = (selectedRole === role) ? null : role; if (typeof updateSquadButton === "function") updateSquadButton(); }
function radialSelectElement(id) { player.selectedElement = id; selectedRole = null; squadMode = "selected"; if (typeof updateSquadButton === "function") updateSquadButton(); }

// ── the DOM ──
function _rEl(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
function _rClick(el, fn) { el.addEventListener("click", ev => { ev.stopPropagation(); fn(ev); }); }

function _radialPetalPath(r0, r1, a0, a1) {
    const p = (r, a) => (Math.cos(a) * r).toFixed(1) + " " + (Math.sin(a) * r).toFixed(1);
    return "M " + p(r0, a0) + " L " + p(r1, a0) + " A " + r1 + " " + r1 + " 0 0 1 " + p(r1, a1) + " L " + p(r0, a1) + " A " + r0 + " " + r0 + " 0 0 0 " + p(r0, a0) + " Z";
}

function radialToggle(open) {
    radialOpen = open == null ? !radialOpen : !!open;
    const root = document.getElementById("radialRoot"); if (!root) return;
    root.classList.toggle("open", radialOpen);
    if (!radialOpen) { radialPanel = null; clearInterval(_radialTimer); _radialTimer = 0; }
    radialRender();
}
function radialPick(id) {
    if (id === "build") { toggleBuild(); radialToggle(false); return; }
    if (id === "auto")  { toggleAutoplay(); radialToggle(false); return; }
    radialPanel = radialPanel === id ? null : id;
    radialRender();
    clearInterval(_radialTimer);
    if (radialPanel) _radialTimer = setInterval(radialRender, RADIAL_REFRESH_MS);
}

function radialRender() {
    const root = document.getElementById("radialRoot"); if (!root) return;
    const hub = document.getElementById("radialHub"); if (hub) hub.classList.toggle("open", radialOpen);
    root.querySelectorAll("[data-petal]").forEach(p => {
        const id = p.getAttribute("data-petal"), on = id === radialPanel || (id === "build" && typeof buildMode !== "undefined" && buildMode) || (id === "auto" && typeof autoplayOn !== "undefined" && autoplayOn);
        p.classList.toggle("on", !!on);
    });
    const panel = document.getElementById("radialPanel"); if (!panel) return;
    panel.style.display = radialOpen && radialPanel ? "block" : "none";
    if (!(radialOpen && radialPanel)) return;
    panel.textContent = "";
    try {   // a menu must never take the game down with it
        if (radialPanel === "squad") _radialDrawSquad(panel);
        else if (radialPanel === "roster") _radialDrawRoster(panel);
        else if (radialPanel === "orders") _radialDrawOrders(panel);
    } catch (e) { /* the numbers come from the plain functions above; a drawing fault just leaves the panel empty */ }
}

function _radialDrawSquad(panel) {
    const st = radialSquadStats(radialFilter);
    panel.appendChild(_rEl("div", "rp-title", "SQUAD"));
    { const z = _rEl("button", "rp-btn wide on", "ZONES \u00b7 TELEPORT \u00b7 REPAIR"); z.style.setProperty("--c", "#8fe3ff"); _rClick(z, () => { radialOpen = false; if (typeof radialRender === "function") radialRender(); if (typeof ccOpen === "function") ccOpen("squad"); }); panel.appendChild(z); }
    panel.appendChild(_rEl("div", "rp-sub", st.total + " UNITS · " + st.working + " WORKING · LV " + st.avgLevel));
    (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).forEach(el => {
        const e = st.byElement[el.id] || { n: 0, hp: 0 };
        if (typeof unlockedElements !== "undefined" && !unlockedElements.has(el.id)) return;
        const row = _rEl("div", "rp-row" + (typeof player !== "undefined" && player.selectedElement === el.id ? " sel" : ""));
        row.style.setProperty("--c", el.color);
        row.appendChild(_rEl("span", "rp-name", el.label)); row.appendChild(_rEl("span", "rp-count", String(e.n)));
        const bar = _rEl("div", "rp-bar"), fill = _rEl("i"); fill.style.width = Math.round(e.hp * 100) + "%"; bar.appendChild(fill); row.appendChild(bar);
        _rClick(row, () => { radialSelectElement(el.id); radialRender(); });
        panel.appendChild(row);
    });
    panel.appendChild(_rEl("div", "rp-label", "ROLES"));
    const roles = _rEl("div", "rp-chips");
    [["BRAWL", "brawler", "#ff4a1c"], ["MAGE", "mage", "#a64dff"], ["TECH", "technician", "#8fe3ff"], ["WORK", "worker", "#19e6c1"]].forEach(r => { const c = _rEl("div", "rp-chip", r[0] + " " + st.roles[r[1]]); c.style.setProperty("--c", r[2]); roles.appendChild(c); });
    panel.appendChild(roles);
    panel.appendChild(_rEl("div", "rp-label", "EVOLVED " + st.evolved + " / " + st.total));
    const filt = _rEl("div", "rp-chips");
    [["ALL", "all", "#19e6c1"], ["WORKERS", "work", "#ffe733"], ["FIGHTERS", "fight", "#a64dff"]].forEach(f => { const b = _rEl("button", "rp-btn" + (radialFilter === f[1] ? " on" : ""), f[0]); b.style.setProperty("--c", f[2]); _rClick(b, () => { radialFilter = f[1]; radialRender(); }); filt.appendChild(b); });
    panel.appendChild(filt);
}

function _radialDrawRoster(panel) {
    const rows = radialRosterRows();
    panel.appendChild(_rEl("div", "rp-title", "ROSTER"));
    panel.appendChild(_rEl("div", "rp-sub", rows.length + " FOLLOWERS"));
    { const cost = typeof RECRUIT_COST !== "undefined" ? RECRUIT_COST : 30, b = _rEl("button", "rp-btn wide" + (shardCount >= cost ? " on" : ""), "+ RECRUIT \u25c6" + cost); b.style.setProperty("--c", "#ffe733"); _rClick(b, () => { recruitPickerOpen(); }); panel.appendChild(b); }
    if (!rows.length) panel.appendChild(_rEl("div", "rp-sub", "NONE YET: RECRUIT ONE ABOVE"));
    rows.slice(0, 40).forEach(r => {
        const card = _rEl("div", "rp-card" + (typeof selectedUnits !== "undefined" && selectedUnits.has(r.f) ? " sel" : ""));
        card.style.setProperty("--c", _radialElementColour(r.element));
        const cv = _rEl("canvas", "rp-thumb"); cv.width = 44; cv.height = 44; cv.style.width = "36px"; cv.style.height = "36px"; _radialThumb(cv, r.f); card.appendChild(cv);
        const mid = _rEl("div", "rp-mid"); mid.appendChild(_rEl("div", "rp-cname", r.name)); mid.appendChild(_rEl("div", "rp-csub", ({ brawler: "BRAWL", mage: "MAGE", technician: "TECH", worker: "WORK" })[r.role] + " · LV " + r.level));
        const bar = _rEl("div", "rp-bar"), fill = _rEl("i"); fill.style.width = Math.round(r.hp * 100) + "%"; bar.appendChild(fill); mid.appendChild(bar); card.appendChild(mid);
        if (r.canWork) { const w = _rEl("button", "rp-btn small wide" + (r.working ? " on" : ""), "WORK"); w.style.setProperty("--c", "#19e6c1"); _rClick(w, () => { toggleFollowerDuty(r.f); radialRender(); }); mid.appendChild(w); }
        { const inf = _rEl("button", "rp-btn small wide", "INFO"); inf.style.setProperty("--c", "#8fe3ff"); _rClick(inf, () => { if (typeof unitInfoOpen === "function") unitInfoOpen(r.f); }); mid.appendChild(inf); }
        _rClick(card, () => { if (typeof ccToggle === "function") ccToggle(r.f); radialRender(); });   // tap a card: select it (the command pool, js/commandcenter.js)
        panel.appendChild(card);
    });
}

// The sprite of an evolved follower, else a plain coloured egg.
function _radialThumb(cv, f) {
    const g = cv.getContext && cv.getContext("2d"); if (!g) return;
    const d = f.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[f.evolved] : null, im = d && typeof _evoImg === "function" ? _evoImg(d) : null;
    if (im) { try { g.drawImage(im, 8, 2 * 144 + 6, 128, 128, 0, 0, 44, 44); return; } catch (e) {} }
    g.fillStyle = _radialElementColour(f.element); g.globalAlpha = 0.85; g.beginPath(); g.ellipse(22, 25, 12, 15, 0, 0, Math.PI * 2); g.fill();
}

function _radialDrawOrders(panel) {
    panel.appendChild(_rEl("div", "rp-title", "ORDERS"));
    const pool = typeof getCommandPool === "function" ? getCommandPool().filter(f => !f.dead) : [];
    panel.appendChild(_rEl("div", "rp-sub", pool.length + " IN THE COMMAND POOL"));
    const mk = (label, col, on, fn) => { const b = _rEl("button", "rp-btn wide" + (on ? " on" : ""), label); b.style.setProperty("--c", col); _rClick(b, () => { fn(); radialRender(); }); return b; };
    panel.appendChild(_rEl("div", "rp-label", "WHO"));
    panel.appendChild(mk("ALL ELEMENTS", "#19e6c1", squadMode === "all", () => radialSetScope(true)));
    panel.appendChild(mk("SELECTED ELEMENT: " + _radialElementLabel(player.selectedElement), "#19e6c1", squadMode !== "all", () => radialSetScope(false)));
    panel.appendChild(_rEl("div", "rp-label", "ROLE"));
    const roleRow = _rEl("div", "rp-chips");
    [["BRAWL", "brawler", "#ff4a1c"], ["MAGE", "sniper", "#a64dff"], ["TECH", "camper", "#8fe3ff"]].forEach(r => { const b = _rEl("button", "rp-btn" + (squadMode !== "all" && selectedRole === r[1] ? " on" : ""), r[0]); b.style.setProperty("--c", r[2]); _rClick(b, () => { radialSetRole(r[1]); radialRender(); }); roleRow.appendChild(b); });
    panel.appendChild(roleRow);
    panel.appendChild(_rEl("div", "rp-label", "COMMANDS"));
    panel.appendChild(mk("SWITCH ROLES", "#ffe733", false, () => cycleCommandPoolRoles()));
    panel.appendChild(mk("ALL TO WORK", "#00ccaa", false, () => radialSetAllWork(true)));
    panel.appendChild(mk("ALL TO FIGHT", "#ff4a1c", false, () => radialSetAllWork(false)));
}

function initRadialMenu() {
    if (typeof document === "undefined" || !document.body || document.getElementById("radialRoot")) return;
    const root = _rEl("div"); root.id = "radialRoot";
    const dim = _rEl("div"); dim.id = "radialDim"; _rClick(dim, () => radialToggle(false)); root.appendChild(dim);
    const hub = _rEl("button"); hub.id = "radialHub"; hub.setAttribute("aria-label", "Menu"); hub.appendChild(_rEl("span", "bars")); _rClick(hub, () => radialToggle()); root.appendChild(hub);
    // the fan: five petals round the hub, on the right-hand half-circle
    const NS = "http://www.w3.org/2000/svg", svg = document.createElementNS(NS, "svg"); svg.id = "radialFan"; svg.setAttribute("viewBox", "-10 -170 190 340");
    const a0 = -Math.PI / 2 - 0.02, span = Math.PI + 0.04, n = RADIAL_PETALS.length, gap = 0.05;
    RADIAL_PETALS.forEach((pt, i) => {
        const g2 = document.createElementNS(NS, "g"); g2.setAttribute("data-petal", pt.id); g2.style.setProperty("--c", pt.col);
        const a = a0 + span * i / n + gap, b = a0 + span * (i + 1) / n - gap, path = document.createElementNS(NS, "path"); path.setAttribute("d", _radialPetalPath(70, 150, a, b)); g2.appendChild(path);
        const am = (a + b) / 2, rm = 110, x = Math.cos(am) * rm, y = Math.sin(am) * rm;
        const ic = document.createElementNS(NS, "text"); ic.setAttribute("x", x.toFixed(1)); ic.setAttribute("y", (y - 4).toFixed(1)); ic.setAttribute("class", "pi"); ic.textContent = pt.icon; g2.appendChild(ic);
        const lb = document.createElementNS(NS, "text"); lb.setAttribute("x", x.toFixed(1)); lb.setAttribute("y", (y + 14).toFixed(1)); lb.setAttribute("class", "pl"); lb.textContent = pt.label; g2.appendChild(lb);
        g2.addEventListener("click", ev => { ev.stopPropagation(); radialPick(pt.id); });
        svg.appendChild(g2);
    });
    root.appendChild(svg);
    const panel = _rEl("div"); panel.id = "radialPanel"; panel.style.display = "none"; root.appendChild(panel);
    document.body.appendChild(root);
    radialRender();
}
try { initRadialMenu(); } catch (e) { /* no page (the test sandbox): the data functions above still work */ }
