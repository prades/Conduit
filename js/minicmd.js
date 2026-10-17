// ─────────────────────────────────────────────────────────
//  THE MINI COMMAND RADIAL — a small radial menu, always at the bottom left (tablet and desktop)
// ─────────────────────────────────────────────────────────
// REPORTED: "Have the crystal menu at the bottom left always visible to switch elements or menu that's a mini command tab ... so that we can free up the SEL button
// from the main bottom menu. Make it a small radial menu."
// ONE circle menu with two faces. A small hub (it names who your orders go to: ALL, an element, or the selected cards, and how many) is never put away. Tap it and ONE ring
// fans out up and to the right, with a switch petal at its start that flips the ring between:
//     COMMAND   HOLD / COME / FIGHT / WORK / ROLE (brawler > mage > technician) / ROSTER (the full command center) / CRYSTAL (the element mix menu)
//     ELEMENTS  ALL and the unlocked elements: the crystal's element selector: pick who the orders (and long-press commands) go to; it replaces the dock's SEL button
// Whoever the orders go to: the selected roster cards if any, else the element picked, else everyone. The face you leave it on is remembered. A tap anywhere else puts the ring away.
// Phones have the radial menu.
// (The dock's SEL button shows only during the tutorial, whose SQUAD lesson is about it.)
const MINI_CMD_MODE_KEY = "conduit_minicmd_mode";
let _miniCmdSig = "", _miniCmdOpen = false, _miniCmdMode = "command";
try { if (localStorage.getItem(MINI_CMD_MODE_KEY) === "elements") _miniCmdMode = "elements"; } catch (e) {}
function miniCmdSetMode(m) { _miniCmdMode = m === "elements" ? "elements" : "command"; try { localStorage.setItem(MINI_CMD_MODE_KEY, _miniCmdMode); } catch (e) {} miniCmdRender(true); }

function miniCmdPool() { return typeof getCommandPool === "function" ? getCommandPool().filter(a => a && !a.dead) : []; }
// Who the orders go to, in words.
function miniCmdTarget() {
    const n = miniCmdPool().length;
    if (typeof selectedUnits !== "undefined" && selectedUnits.size && ccSelectionList().length) return "SELECTED " + n;
    if (squadMode === "all") return "EVERYONE " + n;
    return String(player.selectedElement || "").toUpperCase() + " " + n;
}
function miniCmdSignature() {
    const counts = typeof followers !== "undefined" ? followers.filter(f => f && !f.dead).length : 0;
    const tot = {}; for (const f of (typeof followers !== "undefined" ? followers : [])) if (f && !f.dead) tot[f.element] = (tot[f.element] || 0) + 1;
    return [_miniCmdOpen, _miniCmdMode, squadMode, player.selectedElement, typeof unlockedElements !== "undefined" ? [...unlockedElements].join() : "", JSON.stringify(tot), counts, miniCmdTarget(), typeof crystalMenuOpen !== "undefined" && crystalMenuOpen].join("|");
}
function miniCmdSetOpen(o) { _miniCmdOpen = !!o; miniCmdRender(true); }
function miniCmdSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: col || "#19e6c1", life: 80, vy: -0.22, size: 12 }); }
// The orders. Each is the command center's own action on the same pool.
const MINI_CMD_ORDERS = [
    { id: "hold",   label: "HOLD",   col: "#8fe3ff", run: p => ccApplyStance(p, "hold") },
    { id: "follow", label: "COME", col: "#19e6c1", run: p => ccApplyStance(p, "follow") },
    { id: "fight",  label: "FIGHT",  col: "#ff4a1c", run: p => ccApplyDuty(p, "fighter") },
    { id: "work",   label: "WORK",   col: "#ffe733", run: p => ccApplyDuty(p, "worker") },
];
function miniCmdOrder(id) {
    const o = MINI_CMD_ORDERS.find(x => x.id === id), pool = miniCmdPool();
    if (!o || !pool.length) { miniCmdSay("NOBODY TO ORDER", "#8aa0c8"); return 0; }
    const n = o.run(pool); miniCmdSay(o.label + " · " + n + " OF " + pool.length, o.col); return n;
}
function miniCmdSwitchRoles() { const n = miniCmdPool().filter(f => !f.evolved && !f.isClone).length; if (typeof cycleCommandPoolRoles === "function") cycleCommandPoolRoles(); return n; }
// An element chip: that element, or ALL again to un-narrow.
function miniCmdPickElement(id) { if (id === "all") radialSetScope(true); else radialSelectElement(id); miniCmdRender(true); }

function miniCmdEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("miniCmd") : null; }
const MC_HUB = 56, MC_BTN = 36, MC_RING = 190;
// Who the hub names: SEL (cards selected), ALL, or the element's three letters; and its colour.
function miniCmdWho() {
    if (typeof selectedUnits !== "undefined" && selectedUnits.size && ccSelectionList().length) return { label: "SEL", col: "#19e6c1" };
    if (squadMode === "all") return { label: "ALL", col: "#ffffff" };
    const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === player.selectedElement);
    return { label: e ? e.label.slice(0, 3).toUpperCase() : "---", col: e ? e.color : "#8aa0c8" };
}
// A ring of `items` on a quarter fan from a0 to a1 degrees (0 = right, -90 = up), radius r round the hub's centre.
function _mcPlace(btn, r, a0, a1, i, n) {
    const a = (n === 1 ? (a0 + a1) / 2 : a0 + (a1 - a0) * i / (n - 1)) * Math.PI / 180;
    btn.setAttribute("style", "left:" + Math.round(MC_HUB / 2 + r * Math.cos(a) - MC_BTN / 2) + "px;top:" + Math.round(MC_HUB / 2 + r * Math.sin(a) - MC_BTN / 2) + "px;" + (btn._col ? "--c:" + btn._col + ";" : ""));
}
function miniCmdRender(force) {
    const root = miniCmdEl(); if (!root || !root.appendChild) return;
    const sig = miniCmdSignature(); if (!force && sig === _miniCmdSig) return; _miniCmdSig = sig;
    root.textContent = "";
    if (root.classList) root.classList.toggle("open", _miniCmdOpen);
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const click = (e, fn) => { e.addEventListener("click", ev => { ev.stopPropagation(); fn(ev); }); return e; };
    const pet = (label, col, on, tip, fn, ring, i, n, a0, a1, id) => {
        const b = click(el("button", "mc-pet" + (on ? " on" : ""), label), fn); b._col = col; b.title = tip; if (id) b.setAttribute("data-id", id); _mcPlace(b, ring, a0, a1, i, n); root.appendChild(b); return b;
    };
    if (_miniCmdOpen) {
        const items = [];   // [label, colour, lit, tooltip, action, id]
        const toElements = _miniCmdMode === "command";
        items.push([toElements ? "ELEM" : "CMD", "#ffe733", false, toElements ? "Switch to the element selector" : "Switch to the commands", () => miniCmdSetMode(toElements ? "elements" : "command"), "mode"]);
        if (_miniCmdMode === "command") {
            for (const o of MINI_CMD_ORDERS) items.push([o.label, o.col, false, (o.id === "follow" ? "FOLLOW ME: " : o.label + ": ") + "the " + miniCmdTarget().toLowerCase(), () => { miniCmdOrder(o.id); miniCmdRender(true); }, o.id]);
            items.push(["ROLE", "#a64dff", false, "Switch role: brawler, mage, technician", () => { miniCmdSwitchRoles(); }, "role"]);
            items.push(["ROST", "#8fe3ff", false, "The roster and command center", () => { miniCmdSetOpen(false); if (typeof ccToggleOpen === "function") ccToggleOpen("roster"); }, "roster"]);
            items.push(["\u25c6", "#19e6c1", typeof crystalMenuOpen !== "undefined" && crystalMenuOpen, "The crystal menu: the element mix", () => { if (typeof dockCrystal === "function") dockCrystal(); miniCmdSetOpen(false); }, "crystal"]);
        } else {
            const tot = {}; for (const f of (typeof followers !== "undefined" ? followers : [])) if (f && !f.dead) tot[f.element] = (tot[f.element] || 0) + 1;
            items.push(["ALL", "#ffffff", squadMode === "all", "Orders go to everyone", () => miniCmdPickElement("all"), "all"]);
            for (const e of (typeof ELEMENTS !== "undefined" ? ELEMENTS : [])) if (unlockedElements.has(e.id)) items.push([e.label.slice(0, 3).toUpperCase(), e.color, squadMode !== "all" && player.selectedElement === e.id, e.label + ": " + (tot[e.id] || 0) + " followers", () => miniCmdPickElement(e.id), e.id]);
        }
        items.forEach((p, i) => pet(p[0], p[1], p[2], p[3], p[4], MC_RING, i, items.length, -90, -2, p[5]));
    }
    // the hub
    const w = miniCmdWho(), n = miniCmdPool().length;
    const hub = click(el("button", "mc-hub" + (_miniCmdOpen ? " open" : "")), () => miniCmdSetOpen(!_miniCmdOpen)); hub.id = "mcHub"; hub.setAttribute("style", "--c:" + (_miniCmdOpen ? "#19e6c1" : w.col) + ";"); hub.title = "Mini command: orders go to " + miniCmdTarget();
    hub.appendChild(el("span", "mc-hl", _miniCmdOpen ? "\u2715" : w.label)); if (!_miniCmdOpen) hub.appendChild(el("span", "mc-hn", String(n)));
    root.appendChild(hub);
}
function miniCmdTick() {
    const root = miniCmdEl(); if (!root) return;
    const hide = typeof tutorialMode !== "undefined" && tutorialMode;
    if (root.classList) root.classList.toggle("tut", hide);
    if (document.body && document.body.classList) document.body.classList.toggle("tut-on", !!hide);   // the dock's SEL button shows while the tutorial teaches it
    if (!hide) miniCmdRender(false);
}
try {
    if (typeof document !== "undefined" && document.getElementById && document.getElementById("miniCmd")) {
        miniCmdRender(true);
        // a tap anywhere else (or Escape) puts the fan away
        document.addEventListener("pointerdown", e => { if (_miniCmdOpen && !(e.target && e.target.closest && e.target.closest("#miniCmd"))) miniCmdSetOpen(false); }, true);
        document.addEventListener("keydown", e => { if (e && e.key === "Escape" && _miniCmdOpen) miniCmdSetOpen(false); });
    }
} catch (e) { /* no page (the test sandbox) */ }
