// ─────────────────────────────────────────────────────────
//  THE RADIAL MENU — the phone's menu (docs/UI-STYLE.md)
// ─────────────────────────────────────────────────────────
// REPORTED: "for mobile it should be a left radial menu with squad analytics and roster and commands." On a phone the top row of buttons
// is gone; one thumb-sized HUB sits on the left edge. Tapping it fans out three slabs:
//
//   SQUAD   YOUR SQUAD (js/party.js): its three cards (an open slot says so), REMOVE on each, DISBAND SQUAD
//   ROSTER  RECRUIT, the squad strip (a tap on a chip selects that member), then every follower as a card: its form, level, health and state, with
//           ADD TO / REMOVE FROM SQUAD and INFO (a tap on the card selects it)
//   ORDERS  commands for the squad: all elements or the selected one, a role filter, switch roles
//
// (The squad analytics, the WORK switches, ALL TO WORK / ALL TO FIGHT, and the BUILD and AUTO petals were the old strip game's, and went with it.)
// It is DOM, shown only at phone widths (css in game.html); on a desktop the bottom dock does the same job. Everything reads the live game:
// radialSquadStats() / radialRosterRows() are plain functions of followers[] (no DOM), so the numbers can be tested without a page.

const RADIAL_PETALS = [
    { id: "squad",  label: "SQUAD",  col: "#19e6c1", icon: "◉" },
    { id: "roster", label: "ROSTER", col: "#a64dff", icon: "▦" },
    { id: "orders", label: "ORDERS", col: "#ffe733", icon: "➤" },
];
const RADIAL_REFRESH_MS = 400;
let radialOpen = false, radialPanel = null, _radialTimer = 0;

// The roles as the player sees them (js/config.js roleLabel): brawler, mage ("sniper" in the code), technician ("camper").
function _radialRoleKey(f) { return f.role === "sniper" ? "mage" : f.role === "camper" ? "technician" : "brawler"; }

// A plain summary of your followers: how many (the roster's header line, js/commandcenter.js), how many evolved, the average level, each element's count and health, the role split. No DOM.
function radialSquadStats() {
    const keep = (typeof followers !== "undefined" ? followers : []).filter(f => f && !f.dead && f.isFollower !== false && !f.isClone);
    const out = { total: keep.length, evolved: 0, avgLevel: 0, byElement: {}, roles: { brawler: 0, mage: 0, technician: 0 } };
    let lv = 0;
    for (const f of keep) {
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
        evolved: !!f.evolved,
    })).sort((a, b) => (b.evolved - a.evolved) || (b.level - a.level));
}

function _radialElementColour(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.color : "#8aa0c8"; }
function _radialElementLabel(id) { const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === id); return e ? e.label : String(id).toUpperCase(); }

// ── the commands (each is the existing game action, so the menu and the rest of the game cannot disagree) ──
function radialSetScope(all) { squadMode = all ? "all" : "selected"; }
function radialSetRole(role) { squadMode = "selected"; selectedRole = (selectedRole === role) ? null : role; }
function radialSelectElement(id) { player.selectedElement = id; selectedRole = null; squadMode = "selected"; }

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
    radialPanel = radialPanel === id ? null : id;
    radialRender();
    clearInterval(_radialTimer);
    if (radialPanel) _radialTimer = setInterval(radialRender, RADIAL_REFRESH_MS);
}

function radialRender() {
    const root = document.getElementById("radialRoot"); if (!root) return;
    const hub = document.getElementById("radialHub"); if (hub) hub.classList.toggle("open", radialOpen);
    root.querySelectorAll("[data-petal]").forEach(p => p.classList.toggle("on", p.getAttribute("data-petal") === radialPanel));
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

// THE SQUAD PETAL: YOUR SQUAD (the Command Center's SQUADS window, js/commandcenter.js _ccDrawYourSquad): the squad's three cards (an open slot says so), a REMOVE on each, DISBAND SQUAD (they all hold the rooms they are in)
function _radialDrawSquad(panel) {
    const mem = partyOrdered(), n = mem.length, rows = radialRosterRows();
    panel.appendChild(_rEl("div", "rp-title", "YOUR SQUAD"));
    panel.appendChild(_rEl("div", "rp-sub", n + " / " + PARTY.max + " \u00b7 " + partyPosted().length + " HOLD ROOMS"));
    for (let i = 0; i < PARTY.max; i++) {
        const f = mem.find(m => m.partySlot === i) || null, r = f ? rows.find(x => x.f === f) : null;
        if (r) { panel.appendChild(_radialCard(r)); continue; }
        const o = _rEl("div", "rp-card rp-open"); o.style.setProperty("--c", "#6d7fa6"); const mid = _rEl("div", "rp-mid"); mid.appendChild(_rEl("div", "rp-cname", "+ OPEN SLOT")); mid.appendChild(_rEl("div", "rp-csub", "ADD A FOLLOWER FROM THE ROSTER")); o.appendChild(mid); panel.appendChild(o);
    }
    const d = _rEl("button", "rp-btn wide", "DISBAND SQUAD"); d.style.setProperty("--c", "#ff4a1c"); if (!n) d.disabled = true; _rClick(d, () => { partyDisband(); radialRender(); }); panel.appendChild(d);
}

function _radialDrawRoster(panel) {
    const rows = radialRosterRows();
    panel.appendChild(_rEl("div", "rp-title", "ROSTER"));
    panel.appendChild(_rEl("div", "rp-sub", rows.length + " FOLLOWERS"));
    { const cost = typeof RECRUIT_COST !== "undefined" ? RECRUIT_COST : 30, b = _rEl("button", "rp-btn wide" + (shardCount >= cost ? " on" : ""), "+ RECRUIT \u25c6" + cost); b.style.setProperty("--c", "#ffe733"); _rClick(b, () => { recruitDo(); });
      { const have = typeof shardCount !== "undefined" ? shardCount : 0, n = _rEl("div", "rp-sub", "\u25c6 " + have + (have < cost ? " \u00b7 NEED " + (cost - have) + " MORE" : " \u00b7 " + Math.floor(have / cost) + " AFFORDABLE")); if (have < cost) n.style.color = "#ff8a6a"; panel.appendChild(n); }
      panel.appendChild(b); }
    if (!rows.length) panel.appendChild(_rEl("div", "rp-sub", "NONE YET: RECRUIT ONE ABOVE"));
    _radialSquadStrip(panel);   // (the squad, at a glance)
    rows.slice(0, 40).forEach(r => panel.appendChild(_radialCard(r)));
}
// THE SQUAD STRIP at the top of the phone's roster (the Command Center's squad box, js/party.js): three chips, the follower in each (a tap selects it) or an open slot
function _radialSquadStrip(panel) {
    panel.appendChild(_rEl("div", "rp-label", "YOUR SQUAD \u00b7 " + partyMembers().length + " / " + PARTY.max));
    const strip = _rEl("div", "rp-chips"), mem = partyOrdered();
    for (let i = 0; i < PARTY.max; i++) {
        const f = mem.find(m => m.partySlot === i) || null;
        if (!f) { const o = _rEl("div", "rp-chip rp-open", "OPEN"); o.style.setProperty("--c", "#6d7fa6"); strip.appendChild(o); continue; }
        const on = typeof selectedUnits !== "undefined" && selectedUnits.has(f), c = _rEl("button", "rp-btn small" + (on ? " on" : ""), typeof unitTypeLabel === "function" ? unitTypeLabel(f) : "FOLLOWER"); c.style.setProperty("--c", _radialElementColour(f.element));
        _rClick(c, () => { if (typeof ccToggle === "function") ccToggle(f); radialRender(); }); strip.appendChild(c);
    }
    panel.appendChild(strip);
}
// one follower's card: its picture, name, status, level and health, and its buttons (ADD TO / REMOVE FROM SQUAD; INFO); a tap on the card selects it
function _radialCard(r) {
    const card = _rEl("div", "rp-card" + (typeof selectedUnits !== "undefined" && selectedUnits.has(r.f) ? " sel" : ""));
    card.style.setProperty("--c", _radialElementColour(r.element));
    const cv = _rEl("canvas", "rp-thumb"); cv.width = 44; cv.height = 44; cv.style.width = "36px"; cv.style.height = "36px"; _radialThumb(cv, r.f); card.appendChild(cv);
    const mid = _rEl("div", "rp-mid"); mid.appendChild(_rEl("div", "rp-cname", r.name)); { const st = typeof unitStatus === "function" ? unitStatus(r.f) : null; if (st) { const c = _rEl("div", "rp-cstat", st.text + (st.room ? " \u00b7 " + st.room : "")); c.setAttribute("style", "--c:" + st.col + ";"); mid.appendChild(c); } } mid.appendChild(_rEl("div", "rp-csub", ({ brawler: "BRAWL", mage: "MAGE", technician: "TECH" })[r.role] + " · LV " + r.level));
    const bar = _rEl("div", "rp-bar"), fill = _rEl("i"); fill.style.width = Math.round(r.hp * 100) + "%"; bar.appendChild(fill); mid.appendChild(bar); card.appendChild(mid);
    if (r.f.isFollower === true && !r.f.isClone) {   // ADD TO SQUAD for a follower holding a room, REMOVE FROM SQUAD for one in it
        const inSq = partyIsMember(r.f), free = PARTY.max - partyMembers().length;
        if (inSq || r.f.post) { const b = _rEl("button", "rp-btn small wide" + (!inSq && free ? " on" : ""), inSq ? "REMOVE FROM SQUAD" : free ? "ADD TO SQUAD" : "SQUAD FULL"); b.style.setProperty("--c", inSq ? "#8fe3ff" : "#19e6c1"); if (!inSq && !free) b.disabled = true; _rClick(b, () => { if (inSq) partyRemove([r.f]); else partyAdd([r.f]); radialRender(); }); mid.appendChild(b); }
    }
    { const inf = _rEl("button", "rp-btn small wide", "INFO"); inf.style.setProperty("--c", "#8fe3ff"); _rClick(inf, () => { if (typeof unitInfoOpen === "function") unitInfoOpen(r.f); }); mid.appendChild(inf); }
    _rClick(card, () => { if (typeof ccToggle === "function") ccToggle(r.f); radialRender(); });   // tap a card: select it (the command pool, js/commandcenter.js)
    return card;
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
}

function initRadialMenu() {
    if (typeof document === "undefined" || !document.body || document.getElementById("radialRoot")) return;
    const root = _rEl("div"); root.id = "radialRoot";
    const dim = _rEl("div"); dim.id = "radialDim"; _rClick(dim, () => radialToggle(false)); root.appendChild(dim);
    const hub = _rEl("button"); hub.id = "radialHub"; hub.setAttribute("aria-label", "Menu"); hub.appendChild(_rEl("span", "bars")); _rClick(hub, () => radialToggle()); root.appendChild(hub);
    // the fan: a petal for each of RADIAL_PETALS round the hub, on the right-hand half-circle
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
