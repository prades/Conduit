// ─────────────────────────────────────────────────────────
//  THE BUILD WINDOW  —  pick it, see it, place it, place another
// ─────────────────────────────────────────────────────────
// REPORTED: "building things is difficult, can we make a build menu that is
// more akin to roller coaster tycoon?"
//
// Building was: BUILD on, long-press a tile, BUILD on the ring, pick a kind,
// pick an element, SUBMIT — six steps for one pylon, and all six again for the
// next. RollerCoaster Tycoon's way is a construction window: tabs of things
// with their pictures and prices, pick one, and a ghost of it follows you over
// the ground — green where it can go, red (and why) where it cannot — and each
// click builds one more until you put the tool down.
//
// So the BUILD button now opens this window (docked at the bottom):
//   TURRETS  — an attack turret of each element
//   WAVE     — support pylons (electric, core) and disruption pylons
//   POWER    — batteries, the connector and the shield generator
//   CAMP     — the home-base buildings, bought outright (they have fixed lots)
// and in its title bar a DEMOLISH tool (refunds as the ring's DESTROY does),
// a minimise button and a close. Pick an item and it is the tool:
//   with a MOUSE the ghost follows the pointer and a click builds;
//   on TOUCH the first tap shows the ghost on that tile, a second tap on the
//   same tile builds it (so a stray tap never spends shards).
// The tool stays in hand for the next one. Tap the item again, or ✕, to stop.
//
// Everything is built by _executeBuildInstant — the same call the picker's
// SUBMIT makes — so a pylon from the window is exactly a pylon from the ring.
// The long-press ring still works as before (upgrades, convert, destroy).

let buildMenuOpen = false;
let buildMenuTab  = "turrets";
let buildMenuMin  = false;
let buildTool     = null;    // null | { kind, elId, label, colour } | { kind: "demolish" }
let buildGhost    = null;    // { x, y } — the tile the tool is over
let _bmArmedKey   = null;    // touch: the tile tapped once, waiting for the second tap
let _bmPointerType = "touch";
let _bmLast       = null;    // the layout last drawn (for the taps)

const BUILD_MENU_TABS = [
    { id: "turrets", label: "TURRETS" },
    { id: "wave",    label: "WAVE" },
    { id: "power",   label: "POWER" },
    { id: "camp",    label: "CAMP" },
];
const _BM_CELL = 56, _BM_GAP = 6, _BM_HEAD = 26, _BM_TABS = 22, _BM_STATUS = 20;
const _CAMP_ICON = { command_node: "tier", dna_sequencer: "clone", fabricator: "worker",
                     power_conduit: "power", signal_relay: "connector", repair_station: "shield" };

// What a tab offers. Built when asked, so it follows the unlocks.
function buildMenuItems(tab) {
    const els = typeof ELEMENTS !== "undefined" ? ELEMENTS : [];
    const out = [];
    if (tab === "turrets") {
        for (const e of els) out.push({ kind: "attack", elId: e.id, label: e.label.toUpperCase(), sub: "TURRET", icon: ELEMENT_ICON[e.id] || e.id, colour: e.color });
    } else if (tab === "wave") {
        for (const e of els) {
            const role = typeof waveRole === "function" ? waveRole(e.id) : "disruption";
            out.push({ kind: role, elId: e.id, label: e.label.toUpperCase(), sub: role === "support" ? "SUPPORT" : "DISRUPT", icon: ELEMENT_ICON[e.id] || e.id, colour: e.color });
        }
    } else if (tab === "power") {
        for (const e of els) out.push({ kind: "battery", elId: e.id, label: e.label.toUpperCase(), sub: "BATTERY", icon: "battery", colour: e.color });
        out.push({ kind: "connector", elId: typeof CONNECTOR_ID !== "undefined" ? CONNECTOR_ID : "connector", label: "CONNECTOR", sub: "RELAY", icon: "connector", colour: "#ffd24a" });
        out.push({ kind: "generator", elId: typeof GENERATOR_ID !== "undefined" ? GENERATOR_ID : "generator", label: "SHIELD GEN", sub: "RELAY", icon: "generator", colour: "#cdd6e0" });
    } else if (tab === "camp" && typeof CAMP_BUILDINGS !== "undefined") {
        for (const b of CAMP_BUILDINGS) out.push({ kind: "camp", id: b.id, label: b.label.toUpperCase(), sub: b.effect, icon: _CAMP_ICON[b.id] || "crystal", colour: "#ffcc44", cost: b.cost });
    }
    return out;
}
function buildItemCost(it) { return it.kind === "camp" ? it.cost : PYLON_BUILD_COST; }
function _bmLocked(it) {
    if (it.kind === "camp") return false;
    return typeof isPylonTypeUnlocked === "function" ? !isPylonTypeUnlocked(it.elId) : false;
}
function _bmOwned(it) { return it.kind === "camp" && typeof campBuildings !== "undefined" && campBuildings.has(it.id); }
function _bmSame(a, b) { return !!a && !!b && a.kind === b.kind && a.elId === b.elId; }

// ── Open / close ──────────────────────────────────────────
function openBuildMenu() {
    buildMenuOpen = true; buildMenuMin = false;
    if (!buildMode) { buildMode = true; if (typeof updateBuildButton === "function") updateBuildButton(); }
}
function closeBuildMenu() {
    buildMenuOpen = false; buildTool = null; buildGhost = null; _bmArmedKey = null;
}
// Called whenever buildMode changes: the window follows the BUILD button. Not
// during the tutorial, which teaches the ring and must not be covered.
function syncBuildMenu() {
    if (buildMode && !(typeof tutorialMode !== "undefined" && tutorialMode)) { if (!buildMenuOpen) openBuildMenu(); }
    else if (!buildMode) closeBuildMenu();
}
function setBuildTool(it) {
    if (!it) { buildTool = null; buildGhost = null; _bmArmedKey = null; return; }
    if (_bmSame(buildTool, it)) { buildTool = null; buildGhost = null; _bmArmedKey = null; return; }   // tap again: put it down
    buildTool = { kind: it.kind, elId: it.elId, label: it.label + (it.sub ? " " + it.sub : ""), colour: it.colour, icon: it.icon };
    _bmArmedKey = null;
}

// ── Where a tile is ───────────────────────────────────────
function _bmTileAt(ex, ey) {
    const dx = ex - canvas.width / 2, dy = ey - canvas.height / 2 - TILE_H;
    const gx = Math.round((dy / TILE_H + dx / TILE_W) / 2 + player.visualX);
    const gy = Math.round((dy / TILE_H - dx / TILE_W) / 2 + player.visualY);
    return typeof getTile === "function" ? getTile(gx, gy) : null;
}
// The screen centre of a tile (the middle of its diamond).
function buildTileToScreen(t) {
    const px = (t.x - player.visualX - (t.y - player.visualY)) * TILE_W + canvas.width / 2;
    const py = (t.x - player.visualX + (t.y - player.visualY)) * TILE_H + canvas.height / 2;
    return { x: px, y: py + TILE_H, top: py };
}

// ── Can it go here? ───────────────────────────────────────
// One answer, used by the ghost's colour, its reason, and the build itself.
function canBuildAt(t, tool) {
    tool = tool || buildTool;
    if (!tool) return { ok: false, why: "PICK SOMETHING TO BUILD" };
    if (tool.kind === "demolish") {
        if (t && typeof canDemolishPylon === "function" && canDemolishPylon(t)) return { ok: true, why: "DEMOLISH +" + DEMOLISH_REFUND + " ◆" };
        return { ok: false, why: t && t.pillar && !t.destroyed ? "NOT YOURS" : "NO PYLON HERE" };
    }
    if (!t) return { ok: false, why: "NOTHING THERE" };
    if (t.type !== "floor") return { ok: false, why: "NOT FLOOR" };
    if (t.pillar && !t.destroyed) return { ok: false, why: "OCCUPIED" };
    if (t.nest || t.nodeType || t.capturable) return { ok: false, why: "OCCUPIED" };
    if (typeof crystal !== "undefined" && Math.round(t.x) === Math.round(crystal.x) && Math.round(t.y) === Math.round(crystal.y)) return { ok: false, why: "THE CRYSTAL" };
    // Behind the Crystal is the camp: its floor is drawn as the camp's and a
    // pylon there would never be drawn at all (game.js, the floor branch).
    if (t.x < 0) return { ok: false, why: "CAMP — BUILD PAST THE CRYSTAL" };
    if (typeof HOME_NODE_TILE !== "undefined" && t.x === HOME_NODE_TILE.x && t.y === HOME_NODE_TILE.y) return { ok: false, why: "CAMP GROUND" };
    if (typeof campBuildingAt === "function" && campBuildingAt(t.x, t.y)) return { ok: false, why: "CAMP GROUND" };
    if (typeof isPylonTypeUnlocked === "function" && !isPylonTypeUnlocked(tool.elId)) return { ok: false, why: "LOCKED" };
    if (typeof isRelayId === "function" && isRelayId(tool.elId) && typeof canPlaceGenerator === "function" && !canPlaceGenerator(t).ok)
        return { ok: false, why: "NEEDS A NEST WITHIN " + (typeof GENERATOR_NEST_RANGE !== "undefined" ? GENERATOR_NEST_RANGE : 6) };
    if (shardCount < PYLON_BUILD_COST) return { ok: false, why: "NEED " + PYLON_BUILD_COST + " ◆" };
    return { ok: true, why: "◆" + PYLON_BUILD_COST };
}

function _bmSay(text, color) {
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color, life: 90, vy: -0.22, size: 12 });
}

// Build (or demolish) on a tile with the tool in hand. True when it did.
function buildToolPlaceAt(t) {
    const tool = buildTool;
    if (!tool) return false;
    const v = canBuildAt(t, tool);
    if (!v.ok) { _bmSay("CAN'T BUILD: " + v.why, "#f66"); return false; }
    if (tool.kind === "demolish") return demolishPylon(t);
    const el = PYLON_PICKER_TYPES.find(e => e.id === tool.elId);
    if (!el) return false;
    const before = shardCount;
    const kind = (tool.kind === "connector" || tool.kind === "generator") ? null : tool.kind;
    _executeBuildInstant(el, t, kind);
    if (shardCount === before) return false;   // it refused (and said why)
    if (typeof _cacheAge !== "undefined") _cacheAge = -999;   // the network sees it at once
    if (typeof savePylons === "function") savePylons();
    if (typeof elementEffects !== "undefined")
        for (let i = 0; i < 5; i++) elementEffects.push({ type: "impact", x: t.x + (Math.random() - 0.5) * 0.5, y: t.y + (Math.random() - 0.5) * 0.5, color: tool.colour || "#0f8", radius: 0.35, life: 18 });
    return true;
}

// ── The world tap while a tool is in hand ─────────────────
// True when it took the tap. Mouse: one click builds. Touch: the first tap
// shows the ghost there, a second tap on the same tile builds it.
function handleBuildToolTap(ex, ey) {
    if (!buildMenuOpen || !buildTool) return false;
    let t = _bmTileAt(ex, ey);
    // Demolish aims at a pylon's BODY too, which stands above its tile.
    if (buildTool.kind === "demolish" && !(t && t.pillar) && typeof findPylonAtScreen === "function") t = findPylonAtScreen(ex, ey) || t;
    if (!t) return false;
    const key = t.x + "," + t.y;
    buildGhost = { x: t.x, y: t.y };
    if (_bmPointerType === "mouse" || _bmArmedKey === key) {
        buildToolPlaceAt(t);
        _bmArmedKey = _bmPointerType === "mouse" ? null : key;   // the ghost stays put for the next
        return true;
    }
    _bmArmedKey = key;
    return true;
}

// ── Layout (shared by the drawing and the taps) ───────────
function _bmLayout() {
    // On a narrow screen the right-hand column of round buttons (SET, SHOP …)
    // and the TUTORIAL button at the bottom stay clear of it.
    const narrow = canvas.width < 600;
    const W = Math.min(canvas.width - (narrow ? 70 : 16), 480);
    const cols = Math.max(3, Math.floor((W - _BM_GAP) / (_BM_CELL + _BM_GAP)));
    const items = buildMenuItems(buildMenuTab);
    const rows = Math.max(1, Math.ceil(items.length / cols));
    const gridH = rows * (_BM_CELL + _BM_GAP) + _BM_GAP;
    const H = buildMenuMin ? _BM_HEAD : _BM_HEAD + _BM_TABS + gridH + _BM_STATUS;
    const x = narrow ? 8 : Math.round((canvas.width - W) / 2);
    const y = Math.round(canvas.height - (typeof SAFE_BOTTOM !== "undefined" ? SAFE_BOTTOM : 0) - (narrow ? 72 : 48) - H);
    const head = { close: { x: x + W - 26, y: y + 3, w: 22, h: 20 },
                   min:   { x: x + W - 52, y: y + 3, w: 22, h: 20 },
                   demo:  { x: x + W - 140, y: y + 3, w: 84, h: 20 } };
    const tabs = [], cells = [];
    if (!buildMenuMin) {
        const tw = (W - 12) / BUILD_MENU_TABS.length;
        BUILD_MENU_TABS.forEach((tb, i) => tabs.push({ tab: tb, x: x + 6 + i * tw, y: y + _BM_HEAD, w: tw - 2, h: _BM_TABS - 2 }));
        const gx0 = x + Math.round((W - (cols * (_BM_CELL + _BM_GAP) - _BM_GAP)) / 2);
        items.forEach((it, i) => cells.push({ it, x: gx0 + (i % cols) * (_BM_CELL + _BM_GAP),
            y: y + _BM_HEAD + _BM_TABS + _BM_GAP + Math.floor(i / cols) * (_BM_CELL + _BM_GAP), w: _BM_CELL, h: _BM_CELL }));
    }
    return { x, y, w: W, h: H, head, tabs, cells, statusY: y + H - _BM_STATUS / 2 - 2 };
}
const _bmIn = (r, x, y) => !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
// Is a point on the window? (A long press there must not open the ring.)
function buildMenuHit(x, y) {
    if (!buildMenuOpen) return false;
    const L = _bmLast || _bmLayout();
    return _bmIn(L, x, y);
}

// ── Taps on the window ────────────────────────────────────
function handleBuildMenuTap(x, y) {
    if (!buildMenuOpen) return false;
    const L = _bmLayout();
    if (!_bmIn(L, x, y)) return false;
    if (_bmIn(L.head.close, x, y)) { buildMode = false; if (typeof updateBuildButton === "function") updateBuildButton(); closeBuildMenu(); return true; }
    if (_bmIn(L.head.min, x, y))   { buildMenuMin = !buildMenuMin; return true; }
    if (_bmIn(L.head.demo, x, y))  {
        if (buildTool && buildTool.kind === "demolish") setBuildTool(null);
        else { buildTool = { kind: "demolish", label: "DEMOLISH", colour: "#ff6644" }; _bmArmedKey = null; }
        return true;
    }
    for (const tb of L.tabs) if (_bmIn(tb, x, y)) { buildMenuTab = tb.tab.id; return true; }
    for (const c of L.cells) {
        if (!_bmIn(c, x, y)) continue;
        const it = c.it;
        if (it.kind === "camp") {
            if (_bmOwned(it)) { _bmSay(it.label + " IS ALREADY BUILT", "#8a8"); return true; }
            if (typeof purchaseCampBuilding === "function") purchaseCampBuilding(it.id);
            return true;
        }
        if (_bmLocked(it)) { _bmSay(it.label + " IS NOT UNLOCKED YET", "#f88"); return true; }
        setBuildTool(it);
        return true;
    }
    return true;   // the window's own body
}

// ── Drawing ───────────────────────────────────────────────
function drawBuildMenu() {
    if (!buildMenuOpen) { _bmLast = null; return; }
    const L = _bmLayout(); _bmLast = L;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    // The window
    ctx.fillStyle = "rgba(6,10,16,0.94)"; ctx.strokeStyle = "#ffcc44"; ctx.lineWidth = 2;
    _epRoundRect(L.x, L.y, L.w, L.h, 6); ctx.fill(); ctx.stroke();
    // Title bar
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffcc44"; ctx.font = "bold 11px monospace"; ctx.textAlign = "left";
    ctx.fillText("⚒ BUILD", L.x + 10, L.y + _BM_HEAD / 2);
    ctx.fillStyle = "#9ab"; ctx.font = "10px monospace";
    ctx.fillText("◆ " + shardCount, L.x + 72, L.y + _BM_HEAD / 2);
    const demoOn = buildTool && buildTool.kind === "demolish";
    const btn = (r, label, on, col) => {
        ctx.fillStyle = on ? "rgba(255,102,68,0.25)" : "rgba(0,0,0,0.5)"; ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1);
        ctx.fillStyle = col; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
        ctx.fillText(label, r.x + r.w / 2, r.y + r.h / 2 + 1);
    };
    btn(L.head.demo, "✖ DEMOLISH", demoOn, "#ff6644");
    btn(L.head.min, buildMenuMin ? "▴" : "▾", false, "#9ab");
    btn(L.head.close, "✕", false, "#9ab");
    if (!buildMenuMin) {
        // Tabs
        for (const tb of L.tabs) {
            const on = tb.tab.id === buildMenuTab;
            ctx.fillStyle = on ? "rgba(255,204,68,0.18)" : "rgba(0,0,0,0.45)"; ctx.fillRect(tb.x, tb.y, tb.w, tb.h);
            ctx.strokeStyle = on ? "#ffcc44" : "#345"; ctx.lineWidth = 1; ctx.strokeRect(tb.x + 0.5, tb.y + 0.5, tb.w - 1, tb.h - 1);
            ctx.fillStyle = on ? "#ffcc44" : "#7a8a99"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
            ctx.fillText(tb.tab.label, tb.x + tb.w / 2, tb.y + tb.h / 2 + 1);
        }
        // Items: picture, name, price
        for (const c of L.cells) {
            const it = c.it, locked = _bmLocked(it), owned = _bmOwned(it), sel = _bmSame(buildTool, it);
            const cost = buildItemCost(it), poor = !owned && shardCount < cost;
            ctx.fillStyle = sel ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.55)"; ctx.fillRect(c.x, c.y, c.w, c.h);
            ctx.strokeStyle = sel ? "#ffffff" : locked ? "#333" : it.colour; ctx.lineWidth = sel ? 2 : 1;
            ctx.strokeRect(c.x + 0.5, c.y + 0.5, c.w - 1, c.h - 1);
            ctx.globalAlpha = locked ? 0.3 : 1;
            if (!(typeof drawIcon === "function" && drawIcon(ctx, it.icon, it.colour, c.x + c.w / 2, c.y + 18, 24))) {
                ctx.fillStyle = it.colour; ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + 18, 8, 0, Math.PI * 2); ctx.fill();
            }
            ctx.fillStyle = "#dde"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center";
            ctx.fillText(it.label.length > 10 ? it.label.slice(0, 9) + "…" : it.label, c.x + c.w / 2, c.y + 36);
            ctx.font = "8px monospace";
            if (it.kind === "camp") {
                ctx.fillStyle = owned ? "#0f8" : poor ? "#f66" : "#ffcc44";
                ctx.fillText(owned ? "✓ BUILT" : "◆" + cost, c.x + c.w / 2, c.y + 47);
            } else {
                ctx.fillStyle = locked ? "#666" : poor ? "#f66" : "#ffcc44";
                ctx.fillText(locked ? "LOCKED" : it.sub + " ◆" + cost, c.x + c.w / 2, c.y + 47);
            }
            ctx.globalAlpha = 1;
        }
        // Status line: what is in hand, and what to do with it.
        let msg, col = "#9ab";
        if (!buildTool) msg = buildMenuTab === "camp" ? "Tap a building to buy it — it goes on its own lot at home." : "Pick something to build.";
        else {
            const g = buildGhost && typeof getTile === "function" ? getTile(buildGhost.x, buildGhost.y) : null;
            const v = g ? canBuildAt(g, buildTool) : null;
            const how = _bmPointerType === "mouse" ? "click a tile" : "tap a tile, tap it again to build";
            if (v && !v.ok) { msg = buildTool.label + " — CAN'T BUILD HERE: " + v.why; col = "#f66"; }
            else msg = buildTool.label + (buildTool.kind === "demolish" ? " — " : " ◆" + PYLON_BUILD_COST + " — ") + how + ". Tap it again to stop.";
            if (!(v && !v.ok)) col = buildTool.colour || "#9ab";
        }
        ctx.fillStyle = col; ctx.font = "9px monospace"; ctx.textAlign = "center";
        let m = msg; while (m.length > 8 && ctx.measureText(m).width > L.w - 16) m = m.slice(0, -2);
        if (m !== msg) m = m.slice(0, -1) + "…";
        ctx.fillText(m, L.x + L.w / 2, L.statusY);
    }
    ctx.restore();
}

// The ghost on the ground: the tile tinted green (it can go) or red (it
// cannot), the item's picture above it, and on touch a "TAP AGAIN" while it
// waits for the second tap.
function drawBuildGhost() {
    if (!buildMenuOpen || !buildTool || !buildGhost) return;
    const t = typeof getTile === "function" ? getTile(buildGhost.x, buildGhost.y) : null;
    if (!t) return;
    const v = canBuildAt(t, buildTool);
    const s = buildTileToScreen(t), py = s.top;
    const pulse = 0.5 + 0.5 * Math.sin((frame || 0) * 0.15);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const col = v.ok ? (buildTool.kind === "demolish" ? "255,102,68" : "0,255,136") : "255,60,60";
    ctx.fillStyle = "rgba(" + col + "," + (0.18 + 0.12 * pulse) + ")";
    ctx.strokeStyle = "rgba(" + col + ",0.9)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(s.x, py); ctx.lineTo(s.x + TILE_W, py + TILE_H); ctx.lineTo(s.x, py + 2 * TILE_H); ctx.lineTo(s.x - TILE_W, py + TILE_H); ctx.closePath();
    ctx.fill(); ctx.stroke();
    if (buildTool.kind !== "demolish") {
        ctx.globalAlpha = v.ok ? 0.85 : 0.45;
        if (!(typeof drawIcon === "function" && drawIcon(ctx, buildTool.icon || "pylon", buildTool.colour || "#0f8", s.x, py - 14, 30))) {
            ctx.fillStyle = buildTool.colour || "#0f8"; ctx.beginPath(); ctx.arc(s.x, py - 14, 10, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
    }
    ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const armed = _bmPointerType !== "mouse" && _bmArmedKey === t.x + "," + t.y;
    const label = !v.ok ? v.why : armed ? "TAP AGAIN: " + v.why : v.why;
    ctx.fillStyle = "rgba(0,0,0,0.7)"; const w = ctx.measureText(label).width + 10;
    ctx.fillRect(s.x - w / 2, py + 2 * TILE_H + 4, w, 15);
    ctx.fillStyle = v.ok ? "#fff" : "#f88"; ctx.fillText(label, s.x, py + 2 * TILE_H + 12);
    ctx.restore();
}

// ── Pointer type and mouse hover ──────────────────────────
// Registered before input.js's own listeners (this file loads first), so the
// type is known by the time its pointerup asks.
if (typeof canvas !== "undefined" && canvas && typeof canvas.addEventListener === "function") {
    canvas.addEventListener("pointerdown", e => { _bmPointerType = e.pointerType || "touch"; });
    canvas.addEventListener("pointermove", e => {
        if (e.pointerType !== "mouse") return;
        _bmPointerType = "mouse";
        if (!buildMenuOpen || !buildTool || e.buttons) return;
        const [x, y] = toCanvas(e.clientX, e.clientY);
        if (buildMenuHit(x, y)) return;
        let t = _bmTileAt(x, y);
        if (buildTool.kind === "demolish" && !(t && t.pillar) && typeof findPylonAtScreen === "function") t = findPylonAtScreen(x, y) || t;
        buildGhost = t ? { x: t.x, y: t.y } : null;
    });
}
if (typeof window !== "undefined" && typeof window.addEventListener === "function") {
    window.addEventListener("keydown", e => {
        if (e && e.key === "Escape" && buildMenuOpen && buildTool) setBuildTool(null);
    });
}
