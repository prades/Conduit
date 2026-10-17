// ─────────────────────────────────────────────────────────
//  THE MINI COMMAND RADIAL — a small radial menu, always at the bottom left (tablet and desktop)
// ─────────────────────────────────────────────────────────
// REPORTED: "Have the crystal menu at the bottom left always visible to switch elements or menu that's a mini command tab ... so that we can free up the SEL button
// from the main bottom menu. Make it a small radial menu."
// A WATCH FACE, in the Neo Future style: a 3D bezel (lit metal, teal rim, a glass glint), sixty tick marks, a slow second hand. Closed it is a small watch at the bottom left
// that names who your orders go to (ALL, an element's three letters, or SEL for selected cards) and how many. Tap it and the dial opens (a spin-in) to a full face: the centre
// hub names the target, and seven buttons sit round the dial like complications. TWO DIAL TABS on the lower bezel, COMMAND and ELEMENTS, switch what the dial does:
//     COMMAND   HOLD / COME / FIGHT / WORK / ROLE (brawler > mage > technician) / ROSTER (the full command center) / CRYSTAL (the element mix menu)
//     ELEMENTS  ALL and the unlocked elements, the crystal's element selector: the hand swings to the one picked (it replaces the dock's SEL button)
// Whoever the orders go to: the selected roster cards if any, else the element picked, else everyone. The tab you leave it on is remembered. A tap anywhere else, or the
// centre hub, puts the dial away. Phones have the radial menu.
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
let _mcRot = 0, _mcLastMode = "";   // the ring's turn: the picked element is turned to the top, like a rotary dial; the ring spins between turns
const MC_D = 210, MC_C = 105, MC_R = 70, MC_BTN = 40;   // the open dial: its size, centre, the ring the buttons sit on, the button size
// Who the hub names: SEL (cards selected), ALL, or the element's three letters; and its colour.
function miniCmdWho() {
    if (typeof selectedUnits !== "undefined" && selectedUnits.size && ccSelectionList().length) return { label: "SEL", col: "#19e6c1" };
    if (squadMode === "all") return { label: "ALL", col: "#ffffff" };
    const e = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(x => x.id === player.selectedElement);
    return { label: e ? e.label.slice(0, 3).toUpperCase() : "---", col: e ? e.color : "#8aa0c8" };
}
// The watch face itself (SVG, 210 units square; scaled by CSS): bezel, glass, ticks, rim, and the hand.
function _mcFaceSVG(col, handAngle) {
    let ticks = "";
    for (let i = 0; i < 60; i++) {
        const a = i * 6 * Math.PI / 180, major = i % 5 === 0, r0 = 93, r1 = major ? 85 : 89, x0 = MC_C + r0 * Math.sin(a), y0 = MC_C - r0 * Math.cos(a), x1 = MC_C + r1 * Math.sin(a), y1 = MC_C - r1 * Math.cos(a);
        ticks += '<line x1="' + x0.toFixed(1) + '" y1="' + y0.toFixed(1) + '" x2="' + x1.toFixed(1) + '" y2="' + y1.toFixed(1) + '" stroke="' + (major ? "#19e6c1" : "#4a5a88") + '" stroke-width="' + (major ? 2.4 : 1) + '"/>';
    }
    return '<svg class="mc-face" viewBox="0 0 ' + MC_D + " " + MC_D + '" aria-hidden="true">' +
        '<defs><linearGradient id="mcBez" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7d8fc4"/><stop offset="0.22" stop-color="#1b2748"/><stop offset="0.55" stop-color="#070b18"/><stop offset="0.85" stop-color="#2c3b6c"/><stop offset="1" stop-color="#0c1226"/></linearGradient>' +
        '<radialGradient id="mcFace" cx="0.34" cy="0.28" r="0.85"><stop offset="0" stop-color="#1c2c58"/><stop offset="0.6" stop-color="#0a1226"/><stop offset="1" stop-color="#03050d"/></radialGradient>' +
        '<linearGradient id="mcGlass" x1="0" y1="0" x2="0.9" y2="1"><stop offset="0" stop-color="#ffffff" stop-opacity="0.30"/><stop offset="0.38" stop-color="#ffffff" stop-opacity="0.05"/><stop offset="0.39" stop-color="#ffffff" stop-opacity="0"/></linearGradient></defs>' +
        '<circle cx="105" cy="105" r="103" fill="url(#mcBez)"/><circle cx="105" cy="105" r="99" fill="none" stroke="' + col + '" stroke-width="2.2" opacity="0.9"/><circle cx="105" cy="105" r="96" fill="#02040a" opacity="0.7"/>' +
        '<circle cx="105" cy="105" r="94" fill="url(#mcFace)"/>' + ticks +
        '<circle cx="105" cy="105" r="50" fill="none" stroke="#2a3a6c" stroke-width="1"/><circle cx="105" cy="105" r="34" fill="#070b18" stroke="' + col + '" stroke-width="1.5" opacity="0.95"/>' +
        '<g class="mc-hand" style="transform-origin:105px 105px;transform:rotate(' + handAngle + 'deg)"><line x1="105" y1="105" x2="105" y2="16" stroke="' + col + '" stroke-width="2" stroke-linecap="round"/><polygon points="105,10 100,24 110,24" fill="' + col + '"/><line x1="105" y1="105" x2="105" y2="122" stroke="' + col + '" stroke-width="3" stroke-linecap="round"/></g>' +
        '<ellipse cx="78" cy="58" rx="64" ry="46" transform="rotate(-32 105 105)" fill="url(#mcGlass)"/></svg>';
}
function _mcPlace(btn, i, n) {
    const a = (-90 + 360 * i / n) * Math.PI / 180;
    btn.setAttribute("style", "left:" + Math.round(MC_C + MC_R * Math.cos(a) - MC_BTN / 2) + "px;top:" + Math.round(MC_C + MC_R * Math.sin(a) - MC_BTN / 2) + "px;" + (btn._col ? "--c:" + btn._col + ";" : "") + "animation-delay:" + (60 + i * 35) + "ms;");
}
function miniCmdRender(force) {
    const root = miniCmdEl(); if (!root || !root.appendChild) return;
    const sig = miniCmdSignature(); if (!force && sig === _miniCmdSig) return; _miniCmdSig = sig;
    const wasOpen = root._wasOpen; root._wasOpen = _miniCmdOpen;
    if (root.classList) { root.classList.toggle("open", _miniCmdOpen); root.classList.toggle("opening", _miniCmdOpen && !wasOpen); }
    const w = miniCmdWho(), n = miniCmdPool().length;
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const click = (e, fn) => { e.addEventListener("click", ev => { ev.stopPropagation(); fn(ev); }); return e; };
    // the items round the dial
    const items = [];   // [label, colour, lit, tooltip, action, id]
    if (_miniCmdOpen) {
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
    }
    // the hand: on the element face it points at the one picked; on the command face it sweeps
    let hand = 0, sweep = _miniCmdMode === "command" || !_miniCmdOpen;
    if (_miniCmdOpen && _miniCmdMode === "elements") { const k = items.findIndex(p => p[2]); hand = 0; }
    const holder = el("div", "mc-holder"); holder.innerHTML = _mcFaceSVG(_miniCmdOpen ? w.col : w.col, hand);
    root.textContent = ""; root.appendChild(holder);
    if (holder.classList && sweep) holder.classList.add("sweep");
    // THE RING TURNS: on the element tab the picked element is brought to the top (12 o'clock) and the hand points up; the commands rest with the first at the top.
    // Moving to another turn (a pick, or the other tab) spins the whole ring there (a css animation, from the old turn to the new); each label turns back so it stays upright.
    let rot = 0;
    if (_miniCmdOpen && _miniCmdMode === "elements") { const k = items.findIndex(p => p[2]); rot = k > 0 ? -360 * k / items.length : 0; }
    const from = wasOpen ? _mcRot : rot - 140, modeChanged = _mcLastMode !== _miniCmdMode; _mcLastMode = _miniCmdMode;
    _mcRot = rot;
    const ring = el("div", "mc-ring" + (from !== rot || modeChanged ? " spin" : ""));
    ring.setAttribute("style", "--r0:" + Math.round(from + (modeChanged && wasOpen ? 90 : 0)) + "deg;--r1:" + Math.round(rot) + "deg;transform:rotate(" + Math.round(rot) + "deg);");
    items.forEach((p, i) => { const b = click(el("button", "mc-pet" + (p[2] ? " on" : "")), p[4]); const lab = el("span", "mc-pl", p[0]); lab.setAttribute("style", "transform:rotate(" + (-Math.round(rot)) + "deg);"); b.appendChild(lab); b._col = p[1]; b.title = p[3]; b.setAttribute("data-id", p[5]); _mcPlace(b, i, items.length); ring.appendChild(b); });
    root.appendChild(ring);
    // the two dial tabs, on the lower bezel
    if (_miniCmdOpen) {
        [["command", "COMMAND"], ["elements", "ELEMENTS"]].forEach((t, i) => {
            const b = click(el("button", "mc-tab" + (_miniCmdMode === t[0] ? " on" : ""), t[1]), () => miniCmdSetMode(t[0])); b.setAttribute("data-id", "tab-" + t[0]); b.title = t[0] === "command" ? "Orders for the squad" : "Pick who the orders go to"; root.appendChild(b);
        });
    }
    // the hub: the whole closed watch, and the centre of the open dial
    const hub = click(el("button", "mc-hub" + (_miniCmdOpen ? " open" : "")), () => miniCmdSetOpen(!_miniCmdOpen)); hub.id = "mcHub"; hub.setAttribute("style", "--c:" + w.col + ";"); hub.title = "Mini command: orders go to " + miniCmdTarget();
    hub.appendChild(el("span", "mc-hl", w.label)); hub.appendChild(el("span", "mc-hn", String(n)));
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
