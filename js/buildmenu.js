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
//
// LEVELS. "you can create the level two turrets and the ultra turrets by
// increasing the factor level on the build mode menu itself … and the
// batteries … a pod of four batteries or a pod of six." A LEVEL row under the
// tabs sets what one placement makes:
//   TURRETS  1 a turret · 2 a turret already at MK II · 3 a 2×2 of four that
//            fuses into an ULTRA turret
//   WAVE     1 a pylon  · 2 a pylon at MK II        · 3 a 2×2 of four that forms
//            the element's formation (fire, ice, flux, toxic)
//   POWER    batteries: 1 one · 2 a pod of four (2×2) · 3 a pod of six (3×2);
//            the connector and the shield generator are always one.
// Level 2 needs a tier I network of that element where it goes, and an Ultra
// tier II, exactly as the upgrade and the fusion already do.
//
// POWER. "It should have everything greyed out if you're not able to power it
// to the grid and have it powered on." An item is greyed while your grid has
// no live power for it (no shield generator or connector drawing on a held
// nest, nothing routed, no charged battery); and a placement is refused, red,
// "NO POWER HERE", where nothing would feed it. The relays themselves are the
// way in — a shield generator by a held nest — so they are never greyed.

let buildMenuOpen = false;
let buildMenuTab  = "turrets";
let buildMenuMin  = false;
let buildTool     = null;    // null | { kind, elId, label, colour } | { kind: "demolish" }
let buildGhost    = null;    // { x, y } — the tile the tool is over
let _bmArmedKey   = null;    // touch: the tile tapped once, waiting for the second tap
let _bmPointerType = "touch";
let _bmLast       = null;    // the layout last drawn (for the taps)
let buildLevel    = { turrets: 1, wave: 1, power: 1 };
const BUILD_LEVELS = {
    turrets: ["TURRET", "MK II", "ULTRA 2\u00d72"],
    wave:    ["PYLON", "MK II", "FORMATION 2\u00d72"],
    power:   ["\u00d71", "POD \u00d74", "POD \u00d76"],
};
const _BM_LVL = 22;

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
        for (const e of els) out.push({ tab, kind: "attack", elId: e.id, label: e.label.toUpperCase(), sub: "TURRET", icon: ELEMENT_ICON[e.id] || e.id, colour: e.color });
    } else if (tab === "wave") {
        for (const e of els) {
            const role = typeof waveRole === "function" ? waveRole(e.id) : "disruption";
            out.push({ tab, kind: role, elId: e.id, label: e.label.toUpperCase(), sub: role === "support" ? "SUPPORT" : "DISRUPT", icon: ELEMENT_ICON[e.id] || e.id, colour: e.color });
        }
    } else if (tab === "power") {
        for (const e of els) out.push({ tab, kind: "battery", elId: e.id, label: e.label.toUpperCase(), sub: "BATTERY", icon: "battery", colour: e.color });
        out.push({ tab, kind: "connector", elId: typeof CONNECTOR_ID !== "undefined" ? CONNECTOR_ID : "connector", label: "CONNECTOR", sub: "RELAY", icon: "connector", colour: "#ffd24a" });
        out.push({ tab, kind: "generator", elId: typeof GENERATOR_ID !== "undefined" ? GENERATOR_ID : "generator", label: "SHIELD GEN", sub: "RELAY", icon: "generator", colour: "#cdd6e0" });
    } else if (tab === "camp" && typeof CAMP_BUILDINGS !== "undefined") {
        for (const b of CAMP_BUILDINGS) out.push({ tab, kind: "camp", id: b.id, label: b.label.toUpperCase(), sub: b.effect, icon: _CAMP_ICON[b.id] || "crystal", colour: "#ffcc44", cost: b.cost });
    }
    return out;
}
function _bmIsRelayKind(kind) { return kind === "connector" || kind === "generator"; }
// The level a tool builds at (a relay is always one).
function buildToolLevel(tool) {
    if (!tool || tool.kind === "demolish" || tool.kind === "camp" || _bmIsRelayKind(tool.kind)) return 1;
    return buildLevel[tool.tab] || 1;
}
// The tiles one placement covers, from the tapped (north-west) tile.
function buildToolFootprint(tool, x, y) {
    const lv = buildToolLevel(tool);
    let w = 1, h = 1;
    if (tool && tool.kind === "battery") { if (lv === 2) { w = 2; h = 2; } else if (lv === 3) { w = 3; h = 2; } }
    else if (lv === 3) { w = 2; h = 2; }
    const out = [];
    for (let dy = 0; dy < h; dy++) for (let dx = 0; dx < w; dx++) out.push({ x: x + dx, y: y + dy });
    return out;
}
function buildToolCount(tool) { return buildToolFootprint(tool, 0, 0).length; }
function buildToolCost(tool) {
    const n = buildToolCount(tool), lv = buildToolLevel(tool);
    return n * PYLON_BUILD_COST + (lv === 2 && tool.kind !== "battery" ? (typeof MK2_COST !== "undefined" ? MK2_COST : 15) : 0);
}
// What an item costs at its tab's current level.
function buildItemCost(it) {
    if (it.kind === "camp") return it.cost;
    return buildToolCost({ kind: it.kind, elId: it.elId, tab: it.tab });
}
function _bmTierAt(el, x, y) { return typeof networkTierAt === "function" ? networkTierAt(el, x, y) : 0; }
function _bmBestTier(el) { return typeof networkStrength !== "undefined" ? (networkStrength[el] || 0) : 0; }

// ── POWER ─────────────────────────────────────────────────
// Would something placed at (x, y) be fed? The same routes recomputePower
// takes (power.js): a relay or connector reaching it, a powered pylon or
// battery within link range to chain from, or — for anything but a battery,
// which needs a route to charge — a charged battery within supply range.
// A relay needs a held nest (or the home portal) within its reach.
function buildPowerAt(x, y, kind) {
    if (_bmIsRelayKind(kind)) return typeof nearestDrawableNest === "function" ? !!nearestDrawableNest({ x, y }) : true;
    const r = typeof powerRoute === "function" ? powerRoute({ x, y }) : null;
    if (r && r.source) return true;
    const R = typeof getPylonRange === "function" ? getPylonRange() : 3;
    const cache = typeof _pillarCache !== "undefined" ? _pillarCache : [];
    for (const q of cache) {
        if (!q.powerSource || q.pillarTeam !== "green") continue;
        if (!((typeof needsPower === "function" && needsPower(q)) || (typeof isBatteryPylon === "function" && isBatteryPylon(q)))) continue;
        if (Math.hypot(q.x - x, q.y - y) <= R) return true;
    }
    if (kind !== "battery" && typeof _batteryList !== "undefined") {
        const S = typeof BATTERY_SUPPLY_RANGE !== "undefined" ? BATTERY_SUPPLY_RANGE : 12;
        const cost = typeof POWER_SHOT_COST !== "undefined" ? POWER_SHOT_COST : 1;
        for (const b of _batteryList)
            if (_liveBattery(b) && Math.hypot(b.x - x, b.y - y) <= S && batteryCharge(b) >= cost) return true;
    }
    return false;
}
// Is there any live power on your grid at all, for this kind of thing?
function buildGridLive(kind) {
    if (_bmIsRelayKind(kind)) return true;
    const cache = typeof _pillarCache !== "undefined" ? _pillarCache : [];
    for (const q of cache) {
        if (q.pillarTeam !== "green" || q.destroyed || !(q.health > 0)) continue;
        if (q.powerSource) return true;
        if (typeof isRelayPylon === "function" && isRelayPylon(q) && q.circuitOn !== false
            && typeof nearestDrawableNest === "function" && nearestDrawableNest(q)) return true;
    }
    if (kind !== "battery" && typeof _batteryList !== "undefined") {
        for (const b of _batteryList) if (_liveBattery(b) && batteryCharge(b) > 0) return true;
    }
    return false;
}
// Can this item be picked at all right now, at its tab's level? (Greyed if not.)
function buildItemState(it) {
    if (it.kind === "camp") return { ok: true };
    if (typeof isPylonTypeUnlocked === "function" && !isPylonTypeUnlocked(it.elId)) return { ok: false, why: "LOCKED" };
    if (_bmIsRelayKind(it.kind)) return { ok: true };
    const lv = buildLevel[it.tab] || 1;
    if (it.tab === "wave" && lv === 3 && !(typeof FORM_KINDS !== "undefined" && FORM_KINDS[it.elId])) return { ok: false, why: "NO FORMATION" };
    if (!buildGridLive(it.kind)) return { ok: false, why: "NO POWER" };
    if (lv === 2 && it.kind !== "battery" && _bmBestTier(it.elId) < (typeof MK2_MIN_TIER !== "undefined" ? MK2_MIN_TIER : 1)) return { ok: false, why: "NEEDS TIER I" };
    if (lv === 3 && it.tab === "turrets" && _bmBestTier(it.elId) < (typeof ULTRA_MIN_TIER !== "undefined" ? ULTRA_MIN_TIER : 2)) return { ok: false, why: "NEEDS TIER II" };
    return { ok: true };
}
function _bmLocked(it) {
    if (it.kind === "camp") return false;
    return typeof isPylonTypeUnlocked === "function" ? !isPylonTypeUnlocked(it.elId) : false;
}
function _bmOwned(it) { return it.kind === "camp" && typeof campBuildings !== "undefined" && campBuildings.has(it.id); }
function _bmSame(a, b) { return !!a && !!b && a.kind === b.kind && a.elId === b.elId && (a.tab || "") === (b.tab || ""); }

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
    buildTool = { tab: it.tab, kind: it.kind, elId: it.elId, label: it.label + (it.sub ? " " + it.sub : ""), colour: it.colour, icon: it.icon };
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
// One tile's own problems (anything that is not about the tool).
function _bmTileProblem(t) {
    if (!t) return "NOTHING THERE";
    if (t.type !== "floor") return "NOT FLOOR";
    if (t.pillar && !t.destroyed) return "OCCUPIED";
    if (t.nest || t.nodeType || t.capturable) return "OCCUPIED";
    if (typeof crystal !== "undefined" && Math.round(t.x) === Math.round(crystal.x) && Math.round(t.y) === Math.round(crystal.y)) return "THE CRYSTAL";
    // Behind the Crystal is the camp: its floor is drawn as the camp's and a
    // pylon there would never be drawn at all (game.js, the floor branch).
    if (t.x < 0) return "CAMP \u2014 BUILD PAST THE CRYSTAL";
    if (typeof HOME_NODE_TILE !== "undefined" && t.x === HOME_NODE_TILE.x && t.y === HOME_NODE_TILE.y) return "CAMP GROUND";
    if (typeof campBuildingAt === "function" && campBuildingAt(t.x, t.y)) return "CAMP GROUND";
    return null;
}
// One answer, used by the ghost's colour, its reason, and the build itself.
// `t` is the tile tapped: the north-west corner of a 2×2 or 3×2.
function canBuildAt(t, tool) {
    tool = tool || buildTool;
    if (!tool) return { ok: false, why: "PICK SOMETHING TO BUILD" };
    if (tool.kind === "demolish") {
        if (t && typeof canDemolishPylon === "function" && canDemolishPylon(t)) return { ok: true, why: "DEMOLISH +" + DEMOLISH_REFUND + " \u25c6" };
        return { ok: false, why: t && t.pillar && !t.destroyed ? "NOT YOURS" : "NO PYLON HERE" };
    }
    if (!t) return { ok: false, why: "NOTHING THERE" };
    const tiles = buildToolFootprint(tool, t.x, t.y).map(p => (typeof getTile === "function" ? getTile(p.x, p.y) : null));
    for (const q of tiles) { const why = _bmTileProblem(q); if (why) return { ok: false, why: tiles.length > 1 && q !== t ? "NO ROOM: " + why : why }; }
    if (typeof isPylonTypeUnlocked === "function" && !isPylonTypeUnlocked(tool.elId)) return { ok: false, why: "LOCKED" };
    if (typeof isRelayId === "function" && isRelayId(tool.elId) && typeof canPlaceGenerator === "function" && !canPlaceGenerator(t).ok)
        return { ok: false, why: "NEEDS A NEST WITHIN " + (typeof GENERATOR_NEST_RANGE !== "undefined" ? GENERATOR_NEST_RANGE : 6) };
    const lv = buildToolLevel(tool), el = tool.elId, name = String(el || "").toUpperCase();
    if (tool.tab === "wave" && lv === 3 && !(typeof FORM_KINDS !== "undefined" && FORM_KINDS[el])) return { ok: false, why: "NO FORMATION FOR " + name };
    // Powered: it has to reach the grid (any tile of a pod or square will do —
    // the rest chain from it).
    if (!tiles.some(q => buildPowerAt(q.x, q.y, tool.kind)))
        return { ok: false, why: _bmIsRelayKind(tool.kind) ? "NO HELD NEST IN REACH" : "NO POWER HERE" };
    if (lv === 2 && tool.kind !== "battery" && _bmTierAt(el, t.x, t.y) < (typeof MK2_MIN_TIER !== "undefined" ? MK2_MIN_TIER : 1))
        return { ok: false, why: "MK II NEEDS " + name + " TIER I HERE" };
    if (lv === 3 && tool.tab === "turrets" && _bmTierAt(el, t.x + 0.5, t.y + 0.5) < (typeof ULTRA_MIN_TIER !== "undefined" ? ULTRA_MIN_TIER : 2))
        return { ok: false, why: "ULTRA NEEDS " + name + " TIER II HERE" };
    const cost = buildToolCost(tool);
    if (shardCount < cost) return { ok: false, why: "NEED " + cost + " \u25c6" };
    return { ok: true, why: "\u25c6" + cost };
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
    const before = shardCount, lv = buildToolLevel(tool);
    const kind = _bmIsRelayKind(tool.kind) ? null : tool.kind;
    const tiles = buildToolFootprint(tool, t.x, t.y).map(p => getTile(p.x, p.y));
    let built = 0;
    for (const q of tiles) {
        const s0 = shardCount;
        _executeBuildInstant(el, q, kind);
        if (shardCount === s0) break;   // it refused (and said why)
        built++;
        // Level 2: straight to MK II (the upgrade's own rules and price).
        if (lv === 2 && tool.kind !== "battery" && typeof upgradeToMk2 === "function") upgradeToMk2(q);
    }
    if (built === 0 || shardCount === before) return false;
    if (typeof _cacheAge !== "undefined") _cacheAge = -999;   // the network sees it at once
    if (typeof savePylons === "function") savePylons();
    if (typeof elementEffects !== "undefined")
        for (const q of tiles) for (let i = 0; i < 3; i++) elementEffects.push({ type: "impact", x: q.x + (Math.random() - 0.5) * 0.5, y: q.y + (Math.random() - 0.5) * 0.5, color: tool.colour || "#0f8", radius: 0.35, life: 18 });
    if (tiles.length > 1) _bmSay((lv === 3 && tool.tab === "turrets" ? "ULTRA TURRET" : lv === 3 && tool.tab === "wave" ? "FORMATION" : "BATTERY POD \u00d7" + built) + " BUILT \u2014 " + (before - shardCount) + " \u25c6", tool.colour || "#0f8");
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
    const hasLv = !!BUILD_LEVELS[buildMenuTab];
    const H = buildMenuMin ? _BM_HEAD : _BM_HEAD + _BM_TABS + (hasLv ? _BM_LVL : 0) + gridH + _BM_STATUS;
    const x = narrow ? 8 : Math.round((canvas.width - W) / 2);
    const y = Math.round(canvas.height - (typeof SAFE_BOTTOM !== "undefined" ? SAFE_BOTTOM : 0) - (narrow ? 72 : 48) - H);
    const head = { close: { x: x + W - 26, y: y + 3, w: 22, h: 20 },
                   min:   { x: x + W - 52, y: y + 3, w: 22, h: 20 },
                   demo:  { x: x + W - 140, y: y + 3, w: 84, h: 20 } };
    const tabs = [], cells = [], levels = [];
    const lvH = hasLv ? _BM_LVL : 0;
    if (!buildMenuMin) {
        if (hasLv) {
            const lw = (W - 70) / 3;
            BUILD_LEVELS[buildMenuTab].forEach((label, i) => levels.push({ n: i + 1, label, x: x + 64 + i * lw, y: y + _BM_HEAD + _BM_TABS, w: lw - 4, h: _BM_LVL - 4 }));
        }
        const tw = (W - 12) / BUILD_MENU_TABS.length;
        BUILD_MENU_TABS.forEach((tb, i) => tabs.push({ tab: tb, x: x + 6 + i * tw, y: y + _BM_HEAD, w: tw - 2, h: _BM_TABS - 2 }));
        const gx0 = x + Math.round((W - (cols * (_BM_CELL + _BM_GAP) - _BM_GAP)) / 2);
        items.forEach((it, i) => cells.push({ it, x: gx0 + (i % cols) * (_BM_CELL + _BM_GAP),
            y: y + _BM_HEAD + _BM_TABS + lvH + _BM_GAP + Math.floor(i / cols) * (_BM_CELL + _BM_GAP), w: _BM_CELL, h: _BM_CELL }));
    }
    return { x, y, w: W, h: H, head, tabs, cells, levels, statusY: y + H - _BM_STATUS / 2 - 2 };
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
    for (const lv of L.levels) if (_bmIn(lv, x, y)) {
        buildLevel[buildMenuTab] = lv.n; _bmArmedKey = null;
        // The tool in hand, if it cannot be had at this level, is put down.
        if (buildTool && buildTool.tab === buildMenuTab) {
            const it = buildMenuItems(buildMenuTab).find(i => _bmSame(i, buildTool));
            if (it && !buildItemState(it).ok) setBuildTool(null);
        }
        return true;
    }
    for (const c of L.cells) {
        if (!_bmIn(c, x, y)) continue;
        const it = c.it;
        if (it.kind === "camp") {
            if (_bmOwned(it)) { _bmSay(it.label + " IS ALREADY BUILT", "#8a8"); return true; }
            if (typeof purchaseCampBuilding === "function") purchaseCampBuilding(it.id);
            return true;
        }
        if (_bmLocked(it)) { _bmSay(it.label + " IS NOT UNLOCKED YET", "#f88"); return true; }
        const st = buildItemState(it);
        if (!st.ok) {
            _bmSay(it.label + ": " + (st.why === "NO POWER" ? "NO POWER \u2014 BUILD A SHIELD GEN BY A HELD NEST FIRST"
                                     : st.why === "NEEDS TIER I" ? "MK II NEEDS A TIER I NETWORK \u2014 2 LINKED " + it.label + " BATTERIES"
                                     : st.why === "NEEDS TIER II" ? "ULTRA NEEDS A TIER II NETWORK \u2014 4 LINKED " + it.label + " BATTERIES"
                                     : st.why), "#f88");
            if (_bmSame(buildTool, it)) setBuildTool(null);
            return true;
        }
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
        // Level: what one placement makes on this tab.
        if (L.levels.length) {
            ctx.fillStyle = "#7a8a99"; ctx.font = "bold 9px monospace"; ctx.textAlign = "left";
            ctx.fillText("LEVEL", L.x + 12, L.levels[0].y + L.levels[0].h / 2 + 1);
            for (const lv of L.levels) {
                const on = (buildLevel[buildMenuTab] || 1) === lv.n;
                ctx.fillStyle = on ? "rgba(0,255,136,0.18)" : "rgba(0,0,0,0.45)"; ctx.fillRect(lv.x, lv.y, lv.w, lv.h);
                ctx.strokeStyle = on ? "#0f8" : "#345"; ctx.lineWidth = on ? 2 : 1; ctx.strokeRect(lv.x + 0.5, lv.y + 0.5, lv.w - 1, lv.h - 1);
                ctx.fillStyle = on ? "#0f8" : "#7a8a99"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
                ctx.fillText(lv.n + "  " + lv.label, lv.x + lv.w / 2, lv.y + lv.h / 2 + 1);
            }
        }
        // Items: picture, name, price — greyed when they cannot be had.
        for (const c of L.cells) {
            const it = c.it, owned = _bmOwned(it), sel = _bmSame(buildTool, it);
            const st = buildItemState(it), locked = !st.ok;
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
                const lvName = BUILD_LEVELS[it.tab] && !_bmIsRelayKind(it.kind) && (buildLevel[it.tab] || 1) > 1
                    ? BUILD_LEVELS[it.tab][(buildLevel[it.tab] || 1) - 1].replace(" 2\u00d72", "") : it.sub;
                ctx.globalAlpha = 1;
                ctx.fillStyle = locked ? "#8a6a6a" : poor ? "#f66" : "#ffcc44";
                // Short, to fit the cell; the full reason is said when it is tapped.
                const shortWhy = { "NEEDS TIER I": "TIER I", "NEEDS TIER II": "TIER II", "NO FORMATION": "NO FORM" }[st.why] || st.why;
                ctx.fillText(locked ? shortWhy : lvName + " \u25c6" + cost, c.x + c.w / 2, c.y + 47);
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
            else {
                const lv = buildToolLevel(buildTool), lvName = BUILD_LEVELS[buildTool.tab] && !_bmIsRelayKind(buildTool.kind) ? " \u00b7 " + BUILD_LEVELS[buildTool.tab][lv - 1] : "";
                msg = buildTool.label + lvName + (buildTool.kind === "demolish" ? " — " : " \u25c6" + buildToolCost(buildTool) + " — ") + how + ". Tap it again to stop.";
            }
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
    const pulse = 0.5 + 0.5 * Math.sin((frame || 0) * 0.15);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const col = v.ok ? (buildTool.kind === "demolish" ? "255,102,68" : "0,255,136") : "255,60,60";
    ctx.fillStyle = "rgba(" + col + "," + (0.18 + 0.12 * pulse) + ")";
    ctx.strokeStyle = "rgba(" + col + ",0.9)"; ctx.lineWidth = 2;
    // Every tile one placement covers (a pod, a 2×2 square).
    const foot = buildTool.kind === "demolish" ? [{ x: t.x, y: t.y }] : buildToolFootprint(buildTool, t.x, t.y);
    for (const f of foot) {
        const fs = buildTileToScreen(f), fy = fs.top;
        ctx.beginPath(); ctx.moveTo(fs.x, fy); ctx.lineTo(fs.x + TILE_W, fy + TILE_H); ctx.lineTo(fs.x, fy + 2 * TILE_H); ctx.lineTo(fs.x - TILE_W, fy + TILE_H); ctx.closePath();
        ctx.fill(); ctx.stroke();
    }
    // The picture and the label sit over the middle of the footprint.
    const fx = foot.reduce((a, f) => a + f.x, 0) / foot.length, fyw = foot.reduce((a, f) => a + f.y, 0) / foot.length;
    const s = buildTileToScreen({ x: fx, y: fyw }), py = s.top;
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
