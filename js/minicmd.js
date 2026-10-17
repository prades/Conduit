// ─────────────────────────────────────────────────────────
//  THE MINI COMMAND RADIAL — a small radial menu, always at the bottom left (tablet and desktop)
// ─────────────────────────────────────────────────────────
// REPORTED: "Have the crystal menu at the bottom left always visible to switch elements or menu that's a mini command tab ... so that we can free up the SEL button
// from the main bottom menu. Make it a small radial menu."
// A RUGGED, MODULAR SPORTS-WATCH DIAL (Neo Future, not a classic watch: no ticks, no hands, no little dials): a chunky octagonal matte bezel with hi-vis notches and a digital
// readout in the middle, tilted in 3D. The ring round the readout is SEGMENTS (thick wedges, each a button) that turn like a rotary dial. Closed it is a small rugged pod that
// names who your orders go to (ALL, an element's three letters, or SEL for selected cards) and how many. Tap it and it spins open. The segments are a MODULE: the tabs on the
// lower bezel switch which module the dial runs (MINI_MODULES: COMMAND and ELEMENTS now; the table is where another would go):
//     COMMAND   just three: SEL / ALL (the dock's old squad button: orders go to the picked element, or to everyone), HOLD and COME (the two field orders). Fight, work and roles are in the roster
//     ELEMENTS  ALL and the unlocked elements, the crystal's element selector: the one picked turns to the top (it replaces the dock's SEL button)
// Whoever the orders go to: the selected roster cards if any, else the element picked, else everyone. The module you leave it on is remembered. A tap anywhere else, or the
// readout, puts the dial away. Phones have the radial menu.
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
// The rugged face (SVG, 210 units square; scaled by CSS): a chunky octagonal bezel with hi-vis notches and corner guards, and a flat dark face.
function _mcOct(r, rot) { let pts = ""; for (let i = 0; i < 8; i++) { const a = (rot + i * 45) * Math.PI / 180; pts += (MC_C + r * Math.sin(a)).toFixed(1) + "," + (MC_C - r * Math.cos(a)).toFixed(1) + " "; } return pts.trim(); }
function _mcFaceSVG(col) {
    let notches = "", guards = "";
    for (let i = 0; i < 8; i++) { const a = (22.5 + i * 45) * Math.PI / 180, x = MC_C + 98 * Math.sin(a), y = MC_C - 98 * Math.cos(a); notches += '<rect x="' + (x - 7).toFixed(1) + '" y="' + (y - 2.5).toFixed(1) + '" width="14" height="5" rx="1.5" transform="rotate(' + (22.5 + i * 45 + 90) + " " + x.toFixed(1) + " " + y.toFixed(1) + ')" fill="' + (i % 2 ? col : "#ffe733") + '" opacity="0.95"/>'; }
    for (let i = 0; i < 4; i++) { const a = (45 + i * 90) * Math.PI / 180, x = MC_C + 100 * Math.sin(a), y = MC_C - 100 * Math.cos(a); guards += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="9" fill="url(#mcRub)" stroke="#0a0e1a" stroke-width="2"/><circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.6" fill="#05070d"/>'; }
    return '<svg class="mc-face" viewBox="0 0 ' + MC_D + " " + MC_D + '" aria-hidden="true">' +
        '<defs><linearGradient id="mcMat" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#2e3548"/><stop offset="0.5" stop-color="#0d111c"/><stop offset="1" stop-color="#232a3d"/></linearGradient><radialGradient id="mcRub" cx="0.35" cy="0.3" r="0.8"><stop offset="0" stop-color="#3a4258"/><stop offset="1" stop-color="#0b0f1a"/></radialGradient></defs>' +
        '<polygon points="' + _mcOct(104, 22.5) + '" fill="url(#mcMat)" stroke="#05070d" stroke-width="3" stroke-linejoin="round"/>' +
        '<polygon points="' + _mcOct(96, 22.5) + '" fill="#06080f" stroke="' + col + '" stroke-width="2.5" stroke-linejoin="round" opacity="0.95"/>' +
        '<polygon points="' + _mcOct(92, 22.5) + '" fill="#090d18" stroke="#1a2238" stroke-width="1.5" stroke-linejoin="round"/>' + notches + guards + '</svg>';
}
// A wedge of the ring (angles in degrees, 0 = up, clockwise; radii in dial units) as a css clip-path polygon: the button IS the wedge, so only the wedge takes the tap.
function _mcWedge(a0, a1, r0, r1) {
    const pt = (r, a) => { const t = a * Math.PI / 180; return ((MC_C + r * Math.sin(t)) / MC_D * 100).toFixed(2) + "% " + ((MC_C - r * Math.cos(t)) / MC_D * 100).toFixed(2) + "%"; }, steps = Math.max(3, Math.round((a1 - a0) / 6)), out = [];
    for (let i = 0; i <= steps; i++) out.push(pt(r1, a0 + (a1 - a0) * i / steps));
    for (let i = steps; i >= 0; i--) out.push(pt(r0, a0 + (a1 - a0) * i / steps));
    return "polygon(" + out.join(",") + ")";
}
const MC_R0 = 40, MC_R1 = 88, MC_GAP = 5;   // the ring of segments: inner and outer radius, the gap between them (degrees)
function _mcSegment(btn, lab, i, n) {
    const span = 360 / n, a0 = i * span + MC_GAP / 2 - span / 2, a1 = i * span + span - MC_GAP / 2 - span / 2, mid = (a0 + a1) / 2 * Math.PI / 180, rm = (MC_R0 + MC_R1) / 2 + 2;
    btn.setAttribute("style", "clip-path:" + _mcWedge(a0, a1, MC_R0, MC_R1) + ";" + (btn._col ? "--c:" + btn._col + ";" : "") + "animation-delay:" + (60 + i * 35) + "ms;");
    const inner = btn.querySelector(".mc-in"); if (inner) inner.setAttribute("style", "clip-path:" + _mcWedge(a0 + 1.6, a1 - 1.6, MC_R0 + 3, MC_R1 - 3) + ";");
    lab._x = Math.round(MC_C + rm * Math.sin(mid)); lab._y = Math.round(MC_C - rm * Math.cos(mid));
}
// THE MODULES the dial can run: each is the items round it ([label, colour, lit, tooltip, action, id]). The tabs on the bezel are made from this table.
const MINI_MODULES = [
    { id: "command", label: "COMMAND", tip: "Orders for the squad", items: () => {
        const out = [];
        // the dock's old SEL / ALL button: orders go to the picked element (SEL) or to everyone (ALL)
        out.push([squadMode === "all" ? "ALL" : "SEL", squadMode === "all" ? "#ffffff" : "#19e6c1", squadMode === "all", squadMode === "all" ? "Orders go to everyone: tap for the picked element only" : "Orders go to the picked element: tap for everyone", () => { if (typeof toggleSquad === "function") toggleSquad(); miniCmdRender(true); }, "scope"]);
        for (const o of MINI_CMD_ORDERS) out.push([o.label, o.col, false, (o.id === "follow" ? "FOLLOW ME: " : o.label + ": ") + "the " + miniCmdTarget().toLowerCase(), () => { miniCmdOrder(o.id); miniCmdRender(true); }, o.id]);
        return out; } },
    { id: "elements", label: "ELEMENTS", tip: "Pick who the orders go to", items: () => {
        const out = [], tot = {}; for (const f of (typeof followers !== "undefined" ? followers : [])) if (f && !f.dead) tot[f.element] = (tot[f.element] || 0) + 1;
        out.push(["ALL", "#ffffff", squadMode === "all", "Orders go to everyone", () => miniCmdPickElement("all"), "all"]);
        for (const e of (typeof ELEMENTS !== "undefined" ? ELEMENTS : [])) if (unlockedElements.has(e.id)) out.push([e.label.slice(0, 3).toUpperCase(), e.color, squadMode !== "all" && player.selectedElement === e.id, e.label + ": " + (tot[e.id] || 0) + " followers", () => miniCmdPickElement(e.id), e.id]);
        return out; } },
];
function miniCmdRender(force) {
    const root = miniCmdEl(); if (!root || !root.appendChild) return;
    const sig = miniCmdSignature(); if (!force && sig === _miniCmdSig) return; _miniCmdSig = sig;
    const wasOpen = root._wasOpen; root._wasOpen = _miniCmdOpen;
    if (root.classList) { root.classList.toggle("open", _miniCmdOpen); root.classList.toggle("opening", _miniCmdOpen && !wasOpen); }
    const w = miniCmdWho(), n = miniCmdPool().length;
    const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
    const click = (e, fn) => { e.addEventListener("click", ev => { ev.stopPropagation(); fn(ev); }); return e; };
    const mod = MINI_MODULES.find(m => m.id === _miniCmdMode) || MINI_MODULES[0];
    const items = _miniCmdOpen ? mod.items() : [];
    const holder = el("div", "mc-holder"); holder.innerHTML = _mcFaceSVG(w.col);
    root.textContent = ""; root.appendChild(holder);
    // THE RING TURNS: on the element module the picked element is brought to the top (12 o'clock); the commands rest with the first at the top. Moving to another turn (a pick, or the other
    // module) spins the whole ring there (a css animation from the old turn to the new); each label turns back so it stays upright.
    let rot = 0;
    if (_miniCmdOpen && _miniCmdMode === "elements") { const k = items.findIndex(p => p[2]); rot = k > 0 ? -360 * k / items.length : 0; }
    const from = wasOpen ? _mcRot : rot - 140, modeChanged = _mcLastMode !== _miniCmdMode; _mcLastMode = _miniCmdMode;
    _mcRot = rot;
    const ring = el("div", "mc-ring" + (from !== rot || modeChanged ? " spin" : ""));
    ring.setAttribute("style", "--r0:" + Math.round(from + (modeChanged && wasOpen ? 90 : 0)) + "deg;--r1:" + Math.round(rot) + "deg;transform:rotate(" + Math.round(rot) + "deg);");
    items.forEach((p, i) => {
        const b = click(el("button", "mc-pet" + (p[2] ? " on" : "")), p[4]); b._col = p[1]; b.title = p[3]; b.setAttribute("data-id", p[5]);
        b.appendChild(el("span", "mc-in"));
        const lab = el("span", "mc-pl" + (p[0].length === 1 ? " glyph" : ""), p[0]); b.appendChild(lab);
        _mcSegment(b, lab, i, items.length);
        lab.setAttribute("style", "left:" + (lab._x - 24) + "px;top:" + (lab._y - 15) + "px;transform:rotate(" + (-Math.round(rot)) + "deg);");
        ring.appendChild(b);
    });
    root.appendChild(ring);
    // the tabs on the lower bezel: one per module
    if (_miniCmdOpen) MINI_MODULES.forEach((t, i) => {
        const b = click(el("button", "mc-tab" + (_miniCmdMode === t.id ? " on" : ""), t.label), () => miniCmdSetMode(t.id)); b.setAttribute("data-id", "tab-" + t.id); b.title = t.tip;
        b.setAttribute("style", "left:" + Math.round(MC_C - MINI_MODULES.length * 45 + i * 90 + 3) + "px;"); root.appendChild(b);
    });
    // the readout: the whole closed pod, and the centre of the open dial
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
