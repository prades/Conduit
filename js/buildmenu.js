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
let buildFloorBatteries = false;   // OFF: a zone's batteries are the POWER UNIT in its back wall (js/wallunit.js), not a tool, and the unit is the zone's generator, so there is no generator or connector to place either: the POWER tab is gone. The placing mechanism (pods, levels, the chip's switches, the generator and connector) stays under this flag, and the tests that cover it turn it on
let buildMenuSimple = false;   // the POWER BUILD window opened from the network panel (js/nethud.js): only the generator and the batteries
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
const _BM_LVL = 44;

const BUILD_MENU_TABS_ALL = [
    { id: "turrets", label: "TURRETS" },
    { id: "wave",    label: "WAVE" },
    { id: "power",   label: "POWER" },
    { id: "modules", label: "MODULES" },
    { id: "kits",    label: "KITS" },
];
// Big slabs (js/uikit.js): the cell is the picture, the name and the price; nothing is smaller than 12px.
const _BM_CELL_W = 104, _BM_CELL_H = 108, _BM_GAP = 10, _BM_HEAD = 60, _BM_TABS = 48, _BM_STATUS = 38, _BM_PAD = 14;
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
        // Batteries are the POWER UNIT set into each zone's back wall (js/wallunit.js): tap it to boot and upgrade it. Only the placing tests turn the old tool back on.
        if (buildFloorBatteries) {
            for (const e of els) out.push({ tab, kind: "battery", elId: e.id, label: e.label.toUpperCase(), sub: "BATTERY", icon: "battery", colour: e.color });
            if (!buildMenuSimple) out.push({ tab, kind: "connector", elId: typeof CONNECTOR_ID !== "undefined" ? CONNECTOR_ID : "connector", label: "CONNECTOR", sub: "RELAY", icon: "connector", colour: "#ffd24a" });
            out.push({ tab, kind: "generator", elId: typeof GENERATOR_ID !== "undefined" ? GENERATOR_ID : "generator", label: "GENERATOR", sub: "ZONE POWER", icon: "generator", colour: "#cdd6e0" });
        }
    } else if (tab === "kits" && typeof KITS !== "undefined") {
        // The sixteen layout kits (js/kits.js): a whole zone layout in one placement.
        for (const k of KITS) out.push({ tab, kind: "kit", id: k.id, elId: null, label: k.name, sub: kitPieceCount(k) + " PCS", icon: null, colour: KIT_FAMILY_COLOUR[k.family] || "#19e6c1", cost: kitCost(k) });
    } else if (tab === "modules" && typeof MODULE_DEFS !== "undefined") {
        // Modules (js/modules.js): structures that work while powered.
        for (const id of MODULE_IDS) { const d = MODULE_DEFS[id]; out.push({ tab, kind: "module", id, label: d.label, sub: "MODULE", icon: d.icon, colour: d.colour, cost: d.cost }); }
    }
    return out;
}
function _bmIsRelayKind(kind) { return kind === "connector" || kind === "generator"; }
// The level a tool builds at (a relay is always one).
function buildToolLevel(tool) {
    if (!tool || tool.kind === "demolish" || tool.kind === "camp" || tool.kind === "module" || tool.kind === "kit" || _bmIsRelayKind(tool.kind)) return 1;
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
    if (tool && tool.kind === "kit") return kitCost(kitById(tool.id));
    if (tool && tool.kind === "module") return typeof MODULE_DEFS !== "undefined" && MODULE_DEFS[tool.id] ? MODULE_DEFS[tool.id].cost : 0;
    const n = buildToolCount(tool), lv = buildToolLevel(tool);
    return n * PYLON_BUILD_COST + (lv === 2 && tool.kind !== "battery" ? (typeof MK2_COST !== "undefined" ? MK2_COST : 15) : 0);
}
// What an item costs at its tab's current level.
function buildItemCost(it) {
    if (it.kind === "camp" || it.kind === "kit") return it.cost;
    return buildToolCost({ kind: it.kind, elId: it.elId, id: it.id, tab: it.tab });
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
// The zone you are standing in has a working generator (power.js) — what all
// tech in a zone needs. Asked for the window; the tile tapped is asked again.
function _bmZoneLive() {
    return typeof zoneHasGenerator !== "function" || typeof getZoneIndex !== "function" || zoneHasGenerator(getZoneIndex(Math.floor(player.x)));
}
function buildItemState(it) {
    if (it.kind === "camp") return { ok: true };
    if (it.kind === "kit") return kitElements(kitById(it.id)).length ? { ok: true } : { ok: false, why: "NO ELEMENT" };
    if (it.kind === "module") return !_bmZoneLive() ? { ok: false, why: "NO GENERATOR" } : buildGridLive("module") ? { ok: true } : { ok: false, why: "NO POWER" };
    if (typeof isPylonTypeUnlocked === "function" && !isPylonTypeUnlocked(it.elId)) return { ok: false, why: "LOCKED" };
    if (_bmIsRelayKind(it.kind)) return { ok: true };
    if (!_bmZoneLive()) return { ok: false, why: "NO GENERATOR" };
    const lv = buildLevel[it.tab] || 1;
    if (it.tab === "wave" && lv === 3 && !(typeof FORM_KINDS !== "undefined" && FORM_KINDS[it.elId])) return { ok: false, why: "NO FORMATION" };
    if (!buildGridLive(it.kind)) return { ok: false, why: "NO POWER" };
    if (lv === 2 && it.kind !== "battery" && _bmBestTier(it.elId) < (typeof MK2_MIN_TIER !== "undefined" ? MK2_MIN_TIER : 1)) return { ok: false, why: "NEEDS TIER I" };
    // An Ultra and a formation both need tier II to switch on (ultra.js, formations.js).
    if (lv === 3 && (it.tab === "turrets" || it.tab === "wave") && _bmBestTier(it.elId) < (typeof ULTRA_MIN_TIER !== "undefined" ? ULTRA_MIN_TIER : 2)) return { ok: false, why: "NEEDS TIER II" };
    return { ok: true };
}
function _bmLocked(it) {
    if (it.kind === "camp" || it.kind === "module" || it.kind === "kit") return false;
    return typeof isPylonTypeUnlocked === "function" ? !isPylonTypeUnlocked(it.elId) : false;
}
function _bmOwned(it) { return it.kind === "camp" && typeof campBuildings !== "undefined" && campBuildings.has(it.id); }
function _bmSame(a, b) { if (a && b && a.kind === "kit") return b.kind === "kit" && a.id === b.id; return !!a && !!b && a.kind === b.kind && a.elId === b.elId && (a.id || "") === (b.id || "") && (a.tab || "") === (b.tab || ""); }

// ── Open / close ──────────────────────────────────────────
function openBuildMenu() {
    buildMenuOpen = true; buildMenuMin = false; buildMenuSimple = false;
    if (!buildMode) { buildMode = true; if (typeof updateBuildButton === "function") updateBuildButton(); }
}
function closeBuildMenu() {
    buildMenuOpen = false; buildMenuSimple = false; buildTool = null; buildGhost = null; _bmArmedKey = null;
}
// Called whenever buildMode changes: the window follows the BUILD button.
function syncBuildMenu() {
    if (buildMode) { if (!buildMenuOpen) openBuildMenu(); }
    else if (!buildMode) closeBuildMenu();
}
// The tabs shown: no POWER tab unless the old power placing is switched on (buildFloorBatteries).
function buildMenuTabs() { return buildFloorBatteries ? BUILD_MENU_TABS_ALL : BUILD_MENU_TABS_ALL.filter(t => t.id !== "power"); }
const BUILD_MENU_TABS = BUILD_MENU_TABS_ALL;
// The MODULES button (the old CAMP button) and the home node open the window here.
function openModulesWindow() {
    buildMenuTab = "modules";
    if (!buildMenuOpen) openBuildMenu();
    buildMenuMin = false;
}
// THE POWER BUILD (a tap on the network panel): the build window cut down to the generator and the batteries, with their element and level
// rows, and nothing else. Picking a battery zooms out as any tool does, and the chip there (_placeChipSync) switches battery, element and level.
function openPowerBuild() {
    // A tap on the network panel opens the power unit's panel for the zone you are in (js/wallunit.js): that is the power build now.
    if (!buildFloorBatteries) return typeof wallUnitToggleHere === "function" ? wallUnitToggleHere() : false;
    if (typeof crystalMenuOpen !== "undefined") { crystalMenuOpen = false; }
    if (typeof cloneMenuOpen !== "undefined") { cloneMenuOpen = false; }
    if (typeof settingsPanelOpen !== "undefined") { settingsPanelOpen = false; }
    if (buildMenuOpen && buildMenuSimple) { closeBuildMenu(); buildMode = false; if (typeof updateBuildButton === "function") updateBuildButton(); return true; }   // the panel again puts it away
    buildMenuTab = "power";
    openBuildMenu();
    buildMenuSimple = true; buildTool = null; buildGhost = null; _bmArmedKey = null;
    return true;
}
function setBuildTool(it) {
    if (!it) { buildTool = null; buildGhost = null; _bmArmedKey = null; return; }
    if (_bmSame(buildTool, it)) { buildTool = null; buildGhost = null; _bmArmedKey = null; return; }   // tap again: put it down
    buildTool = { tab: it.tab, kind: it.kind, elId: it.elId, id: it.id, label: it.label + (it.sub ? " " + it.sub : ""), colour: it.colour, icon: it.icon };
    if (it.kind === "kit") { buildTool.label = it.label; buildTool.elId = kitDefaultElement(kitById(it.id)); }
    _bmArmedKey = null;
}

// ── Where a tile is ───────────────────────────────────────
function _bmTileAt(ex, ey) {
    const dx = ex - canvas.width / 2, dy = ey + (typeof facilityPlay !== "undefined" && facilityPlay ? facilityPickLift(ex, ey) : 0) - canvas.height / 2 - TILE_H;
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
    if (t._module) return "OCCUPIED";
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
        if (t && t._module && typeof MODULE_DEFS !== "undefined")
            return { ok: true, why: "REMOVE +" + Math.round(MODULE_DEFS[t._module.kind].cost * MODULE_REFUND) + " \u25c6" };
        if (t && typeof canDemolishPylon === "function" && canDemolishPylon(t)) return { ok: true, why: "DEMOLISH +" + DEMOLISH_REFUND + " \u25c6" };
        return { ok: false, why: t && t.pillar && !t.destroyed ? "NOT YOURS" : "NO PYLON HERE" };
    }
    if (!t) return { ok: false, why: "NOTHING THERE" };
    if (tool.kind === "kit") return kitToolVerdict(t, tool);
    const tiles = buildToolFootprint(tool, t.x, t.y).map(p => (typeof getTile === "function" ? getTile(p.x, p.y) : null));
    for (const q of tiles) { const why = _bmTileProblem(q); if (why) return { ok: false, why: tiles.length > 1 && q !== t ? "NO ROOM: " + why : why }; }
    // Every piece of tech needs a working generator in its zone (power.js).
    if (!_bmIsRelayKind(tool.kind) && typeof zoneHasGenerator === "function" && typeof getZoneIndex === "function") {
        const z = getZoneIndex(Math.floor(t.x));
        if (!zoneHasGenerator(z)) return { ok: false, why: "NO POWER UNIT IN " + (z === 0 ? "THE HOME ZONE" : "ZONE " + z) + ": BOOT IT" };
    }
    if (tool.kind === "module") {
        if (!buildPowerAt(t.x, t.y, "module")) return { ok: false, why: "NO POWER HERE" };
        const mc = buildToolCost(tool);
        if (shardCount < mc) return { ok: false, why: "NEED " + mc + " \u25c6" };
        return { ok: true, why: "\u25c6" + mc };
    }
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
    if (lv === 3 && (tool.tab === "turrets" || tool.tab === "wave") && _bmTierAt(el, t.x + 0.5, t.y + 0.5) < (typeof ULTRA_MIN_TIER !== "undefined" ? ULTRA_MIN_TIER : 2))
        return { ok: false, why: (tool.tab === "wave" ? "FORMATION" : "ULTRA") + " NEEDS " + name + " TIER II HERE" };
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
    if (tool.kind === "demolish") return t._module ? removeModule(t._module, true) : demolishPylon(t);
    if (tool.kind === "kit") return kitToolPlace(t, tool);
    if (tool.kind === "module") return !!placeModule(tool.id, t);
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
    const W = Math.min(canvas.width - (narrow ? 70 : 16), 660);
    const kitsTab = buildMenuTab === "kits";   // sixteen smaller cards, so the tab fits the screen
    const cw = kitsTab ? (narrow ? 76 : 100) : narrow ? 84 : _BM_CELL_W, ch = kitsTab ? (narrow ? 64 : 76) : narrow ? 96 : _BM_CELL_H;
    const cols = Math.max(3, Math.floor((W - _BM_PAD * 2 + _BM_GAP) / (cw + _BM_GAP)));
    const items = buildMenuItems(buildMenuTab);
    const rows = Math.max(1, Math.ceil(items.length / cols));
    const gridH = rows * (ch + _BM_GAP) + _BM_GAP;
    const hasLv = !!BUILD_LEVELS[buildMenuTab];
    const tabsH = buildMenuSimple ? 0 : _BM_TABS;
    const H = buildMenuMin ? _BM_HEAD : _BM_HEAD + tabsH + (hasLv ? _BM_LVL : 0) + gridH + _BM_STATUS;
    const x = narrow ? 8 : Math.round((canvas.width - W) / 2);
    const bottom = narrow ? canvas.height - (typeof SAFE_BOTTOM !== "undefined" ? SAFE_BOTTOM : 0) - 72 : uiBottomSafe();
    const y = Math.round(bottom - H);
    const bh = 40, by = y + (_BM_HEAD - bh) / 2;
    const head = { close: { x: x + W - 56, y: by, w: 46, h: bh },
                   min:   { x: x + W - 108, y: by, w: 46, h: bh },
                   demo:  { x: x + W - 108 - 8 - (narrow ? 96 : 150), y: by, w: narrow ? 96 : 150, h: bh } };
    const tabs = [], cells = [], levels = [];
    const lvH = hasLv ? _BM_LVL : 0;
    if (!buildMenuMin) {
        if (hasLv) {
            const lw = (W - _BM_PAD * 2 - 80) / 3;
            BUILD_LEVELS[buildMenuTab].forEach((label, i) => levels.push({ n: i + 1, label, x: x + _BM_PAD + 80 + i * lw, y: y + _BM_HEAD + tabsH + 2, w: lw - 6, h: _BM_LVL - 6 }));
        }
        const tw = (W - _BM_PAD * 2) / buildMenuTabs().length;
        if (!buildMenuSimple) buildMenuTabs().forEach((tb, i) => tabs.push({ tab: tb, x: x + _BM_PAD + i * tw, y: y + _BM_HEAD, w: tw - 6, h: _BM_TABS - 6 }));
        const gx0 = x + Math.round((W - (cols * (cw + _BM_GAP) - _BM_GAP)) / 2);
        items.forEach((it, i) => cells.push({ it, x: gx0 + (i % cols) * (cw + _BM_GAP),
            y: y + _BM_HEAD + tabsH + lvH + _BM_GAP + Math.floor(i / cols) * (ch + _BM_GAP), w: cw, h: ch }));
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

// Why an item cannot be had, in a sentence.
function _bmWhy(it, st) {
    return st.why === "NO GENERATOR" ? "NO POWER UNIT IN THIS ZONE \u2014 BOOT IT IN THE WALL FIRST"
         : st.why === "NO POWER" ? "NO POWER \u2014 BOOT THE POWER UNIT IN THE WALL FIRST"
         : st.why === "NEEDS TIER I" ? "MK II NEEDS A TIER I NETWORK \u2014 2 LINKED " + it.label + " BATTERIES"
         : st.why === "NEEDS TIER II" ? (it.tab === "wave" ? "FORMATION" : "ULTRA") + " NEEDS A TIER II NETWORK \u2014 4 LINKED " + it.label + " BATTERIES"
         : st.why;
}

// ── Taps on the window ────────────────────────────────────
function handleBuildMenuTap(x, y) {
    if (!buildMenuOpen) return false;
    const L = _bmLayout();
    if (!_bmIn(L, x, y)) return false;
    if (_bmIn(L.head.close, x, y)) { buildMode = false; if (typeof updateBuildButton === "function") updateBuildButton(); closeBuildMenu(); return true; }
    if (_bmIn(L.head.min, x, y))   { buildMenuMin = !buildMenuMin; return true; }
    if (!buildMenuSimple && _bmIn(L.head.demo, x, y))  {
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
            _bmSay(it.label + ": " + _bmWhy(it, st), "#f88");
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
    uiPanel(L.x, L.y, L.w, L.h, buildMenuSimple ? UI_TEAL : UI_GOLD);
    // Title bar
    uiText(buildMenuSimple ? "POWER" : "BUILD", L.x + (L.w > 360 ? 28 : 18), L.y + _BM_HEAD / 2 + 1, L.w > 360 ? 32 : 24, buildMenuSimple ? UI_TEAL : UI_GOLD, "left");
    if (L.w > 360) uiText("\u25c6 " + shardCount, L.x + (buildMenuSimple ? 170 : 150), L.y + _BM_HEAD / 2 + 1, 24, "#fff", "left", false);
    const demoOn = buildTool && buildTool.kind === "demolish";
    if (!buildMenuSimple) uiButton(L.head.demo, L.w > 360 ? "DEMOLISH" : "DEMO", UI_RED, demoOn, L.w > 360 ? 18 : 15);
    uiButton(L.head.min, buildMenuMin ? "\u25b4" : "\u25be", UI_ICE, false, 22);
    uiButton(L.head.close, "\u2715", UI_RED, false, 22);
    if (!buildMenuMin) {
        // Tabs
        for (const tb of L.tabs) uiButton(tb, tb.tab.label, UI_GOLD, tb.tab.id === buildMenuTab, 20);
        // Level: what one placement makes on this tab.
        if (L.levels.length) {
            uiText("LEVEL", L.x + 28, L.levels[0].y + L.levels[0].h / 2 + 1, 18, "#8aa0c8", "left", false);
            for (const lv of L.levels) uiButton(lv, lv.n + "  " + lv.label, UI_TEAL, (buildLevel[buildMenuTab] || 1) === lv.n, 15);
        }
        // Items: picture, name, price — greyed when they cannot be had.
        for (const c of L.cells) {
            if (c.it.kind === "kit") { drawKitCell(c, _bmSame(buildTool, c.it)); continue; }
            const it = c.it, owned = _bmOwned(it), sel = _bmSame(buildTool, it);
            const st = buildItemState(it), locked = !st.ok;
            const cost = buildItemCost(it), poor = !owned && shardCount < cost;
            uiSlab(c.x, c.y, c.w, c.h, sel ? "#ffffff" : it.colour, sel, sel ? null : "#101830", locked);
            ctx.globalAlpha = locked ? 0.3 : 1;
            if (!(typeof drawIcon === "function" && drawIcon(ctx, it.icon, sel ? UI_INK : it.colour, c.x + c.w / 2, c.y + 32, 38))) {
                ctx.fillStyle = sel ? UI_INK : it.colour; ctx.beginPath(); ctx.arc(c.x + c.w / 2, c.y + 32, 13, 0, Math.PI * 2); ctx.fill();
            }
            ctx.globalAlpha = locked ? 0.55 : 1;
            uiTextFit(it.label, c.x + c.w / 2, c.y + c.h - 40, 17, sel ? UI_INK : "#fff", "center", c.w - 14);
            ctx.globalAlpha = 1;
            if (it.kind === "camp") {
                uiCaption(owned ? "\u2713 BUILT" : "\u25c6" + cost, c.x + c.w / 2, c.y + c.h - 17, sel ? UI_INK : owned ? "#19e6c1" : poor ? "#ff7a6a" : UI_GOLD, "center", 14);
            } else {
                const lvName = BUILD_LEVELS[it.tab] && !_bmIsRelayKind(it.kind) && (buildLevel[it.tab] || 1) > 1
                    ? BUILD_LEVELS[it.tab][(buildLevel[it.tab] || 1) - 1].replace(" 2\u00d72", "") : it.sub;
                // Short, to fit the cell; the full reason is said when it is tapped.
                const shortWhy = { "NEEDS TIER I": "TIER I", "NEEDS TIER II": "TIER II", "NO FORMATION": "NO FORM", "NO GENERATOR": "NO UNIT" }[st.why] || st.why;
                uiCaptionFit(locked ? shortWhy : lvName + " \u25c6" + cost, c.x + c.w / 2, c.y + c.h - 17, sel ? UI_INK : locked ? "#b08a8a" : poor ? "#ff7a6a" : UI_GOLD, "center", 13, c.w - 10);
            }
        }
        // Status line: what is in hand, and what to do with it.
        let msg, col = "#8aa0c8";
        if (!buildTool) msg = buildMenuTab === "kits" ? "A kit is a whole zone layout. Pick one, then move it where you want (the ghost follows you; the arrows nudge it) and build it, or SNAP TO NEST." : buildMenuSimple ? "Pick a GENERATOR or a BATTERY, then tap the ground. You can switch it there." : buildMenuTab === "modules" ? "Modules work while powered, on the ground around them. Pick one." : "Pick something to build.";
        else {
            const g = buildGhost && typeof getTile === "function" ? getTile(buildGhost.x, buildGhost.y) : null;
            const v = g ? canBuildAt(g, buildTool) : null;
            const how = _bmPointerType === "mouse" ? "click a tile" : "tap a tile, tap it again to build";
            if (v && !v.ok) { msg = buildTool.label + " — CAN'T BUILD HERE: " + v.why; col = "#ff7a6a"; }
            else {
                const lv = buildToolLevel(buildTool), lvName = BUILD_LEVELS[buildTool.tab] && !_bmIsRelayKind(buildTool.kind) ? " \u00b7 " + BUILD_LEVELS[buildTool.tab][lv - 1] : "";
                msg = buildTool.label + lvName + (buildTool.kind === "demolish" ? " — " : " \u25c6" + buildToolCost(buildTool) + " — ") + how + ". Tap it again to stop.";
            }
            if (!(v && !v.ok)) col = buildTool.colour || "#8aa0c8";
        }
        uiCaptionFit(msg, L.x + L.w / 2, L.statusY, col, "center", 13, L.w - 28);
    }
    ctx.restore();
}

// The ghost on the ground: the tile tinted green (it can go) or red (it
// cannot), the item's picture above it, and on touch a "TAP AGAIN" while it
// waits for the second tap.
function drawBuildGhost() {
    if (!buildMenuOpen || !buildTool || !buildGhost) return;
    if (buildTool.kind === "kit") { drawKitGhost(); return; }
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
    const _fs = Math.round(10 / (typeof viewZoom !== "undefined" ? viewZoom : 1));   // readable when zoomed out
    ctx.font = "bold " + _fs + "px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const armed = _bmPointerType !== "mouse" && _bmArmedKey === t.x + "," + t.y;
    const label = !v.ok ? v.why : armed ? "TAP AGAIN: " + v.why : v.why;
    ctx.fillStyle = "rgba(0,0,0,0.7)"; const w = ctx.measureText(label).width + 10;
    ctx.fillRect(s.x - w / 2, py + 2 * TILE_H + 4, w, _fs * 1.5);
    ctx.fillStyle = v.ok ? "#fff" : "#f88"; ctx.fillText(label, s.x, py + 2 * TILE_H + 4 + _fs * 0.75);
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


// ─────────────────────────────────────────────────────────
//  PLACING: zoomed out, with the interface out of the way
// ─────────────────────────────────────────────────────────
// REPORTED: "on the build menu, on the phone especially, the user can see the entire battlefield or the entire zone whenever they're building
// stuff. It would be really helpful if it zoomed out just for the time being, and also hid all of the UI stuff whenever an item or generator or
// some other equipment is selected."
// While a build tool is in hand (buildTool) the picture zooms out (PLACING_ZOOM_PHONE / PLACING_ZOOM) and every control is hidden: the HUD,
// the radial menu, the dock, the build window and the other buttons. A small DONE chip stays, to put the tool down. Put the tool down and
// everything comes back at normal size.
const PLACING_ZOOM_PHONE = 0.45, PLACING_ZOOM = 0.7, PLACING_PHONE_W = 700;
let _placingWas = false;
function placingHidesUi() { return !!(buildMenuOpen && buildTool) || (typeof attractOn === "function" && attractOn()); }   // (and the website's background, js/attract.js, which has no interface at all)
function placingZoom() { return (typeof window !== "undefined" && window.innerWidth <= PLACING_PHONE_W) ? PLACING_ZOOM_PHONE : PLACING_ZOOM; }
// Once a frame: follows buildTool.
function placingTick() {
    if (typeof attractOn === "function" && attractOn()) return;   // (the website's background sets its own zoom)
    const on = placingHidesUi();
    if (on === _placingWas) { if (on) { _placeChipSync(); if (typeof viewZoom !== "undefined" && viewZoom !== placingZoom()) setViewZoom(placingZoom()); } return; }
    _placingWas = on;
    if (typeof setViewZoom === "function") setViewZoom(on ? placingZoom() : 1);
    if (typeof document !== "undefined" && document.body && document.body.classList) document.body.classList.toggle("placing", on);
    _placeChipSync();
}
// The chip over the zoomed-out view. For a POWER tool (a battery, the generator, the connector) it also carries the switches, so the type and the
// level change here, without going back into the build window: the tool (BATTERY / GENERATOR / CONNECTOR), the battery's element, and its level.
let _placeChipSig = null;
function _placeChipSwitchSig() {
    if (buildTool && buildTool.kind === "kit") return ["kit", buildTool.id, buildTool.elId, kitDir, typeof unlockedElements !== "undefined" ? unlockedElements.size : 0].join("|");
    if (!buildTool || buildTool.tab !== "power") return "";
    return [buildTool.kind, buildTool.elId, buildLevel.power, buildMenuSimple ? 1 : 0, typeof unlockedElements !== "undefined" ? unlockedElements.size : 0].join("|");
}
// Switch the tool in hand to a power tool (keeps the level). A battery keeps its element when it has one.
function placeSwitchTool(kind, elId) {
    const items = buildMenuItems("power");
    const keep = buildTool && buildTool.kind === "battery" ? buildTool.elId : null;
    const it = items.find(i => i.kind === kind && (kind !== "battery" || i.elId === (elId || keep || i.elId)));
    if (!it) return false;
    const st = buildItemState(it);
    if (!st.ok) { _bmSay(it.label + ": " + _bmWhy(it, st), "#f88"); return false; }
    buildTool = { tab: it.tab, kind: it.kind, elId: it.elId, id: it.id, label: it.label + (it.sub ? " " + it.sub : ""), colour: it.colour, icon: it.icon };
    _bmArmedKey = null;
    return true;
}
// The battery level (x1, pod of four, pod of six). Refused, with the reason, when the tool in hand cannot be had at it.
function placeSwitchLevel(n) {
    const was = buildLevel.power;
    buildLevel.power = n; _bmArmedKey = null;
    const it = buildTool && buildMenuItems("power").find(i => _bmSame(i, buildTool));
    if (it) { const st = buildItemState(it); if (!st.ok) { buildLevel.power = was; _bmSay(it.label + ": " + _bmWhy(it, st), "#f88"); return false; } }
    return true;
}
function _placeChipSync() {
    if (typeof document === "undefined" || !document.body || !document.createElement) return;
    let chip = document.getElementById("placeChip");
    if (!chip) {
        chip = document.createElement("div"); chip.id = "placeChip";
        const lab = document.createElement("span"); lab.id = "placeChipLabel"; chip.appendChild(lab);
        const done = document.createElement("button"); done.id = "placeChipDone"; done.textContent = "\u2715 DONE";
        done.addEventListener("click", e => { e.stopPropagation(); setBuildTool(null); });
        chip.appendChild(done);
        const tools = document.createElement("div"); tools.id = "placeChipTools"; chip.appendChild(tools);
        document.body.appendChild(chip);
    }
    const lab = document.getElementById("placeChipLabel");
    const cost = buildTool && buildTool.kind !== "demolish" ? " \u25c6" + buildToolCost(buildTool) : "";
    const text = buildTool ? buildTool.label + cost + " \u00B7 TAP A TILE, TAP AGAIN TO BUILD" : "";
    if (lab && lab.textContent !== text) lab.textContent = text;
    const sig = _placeChipSwitchSig();
    if (sig === _placeChipSig) return;
    _placeChipSig = sig;
    const tools = document.getElementById("placeChipTools");
    if (!tools) return;
    while (tools.firstChild) tools.removeChild(tools.firstChild);
    if (!sig) return;
    const row = (cls) => { const r = document.createElement("div"); r.className = "pc-row " + (cls || ""); tools.appendChild(r); return r; };
    const btn = (r, label, on, col, fn, dim) => {
        const b = document.createElement("button"); b.className = "pc-btn" + (on ? " on" : "") + (dim ? " dim" : ""); b.textContent = label; b.setAttribute("style", "--c:" + col);
        b.addEventListener("click", e => { e.stopPropagation(); fn(); }); r.appendChild(b); return b;
    };
    if (buildTool.kind === "kit") {
        // A kit in hand: SNAP TO NEST (build it at the zone's nest), MIRROR (face the other way), and its element.
        const kit = kitById(buildTool.id);
        const r1 = row("tools");
        btn(r1, "SNAP TO NEST", true, "#19e6c1", () => { kitSnapBuild(); });
        btn(r1, kitDir > 0 ? "FACING FRONT \u25b6" : "\u25c0 MIRRORED", kitDir < 0, "#8fe3ff", () => { kitDir = -kitDir; _bmArmedKey = null; _placeChipSig = null; });
        // MOVE IT: the arrows nudge the ghost a tile (back / front along the lane, up / down across it); BUILD HERE builds it where the ghost is
        const r3 = row("tools");
        for (const [lab, dx, dy] of [["\u25c0", -1, 0], ["\u25b6", 1, 0], ["\u25b2", 0, -1], ["\u25bc", 0, 1]]) btn(r3, lab, false, "#8fe3ff", () => { kitNudge(dx, dy); });
        btn(r3, "BUILD HERE", true, "#ffd34d", () => { kitBuildHere(); });
        const r2 = row("els");
        for (const e of kitElements(kit)) { const el = ELEMENTS.find(x => x.id === e); btn(r2, el.label.slice(0, 3).toUpperCase(), buildTool.elId === e, el.color, () => { buildTool.elId = e; _bmArmedKey = null; }); }
        return;
    }
    const items = buildMenuItems("power");
    // which tool: the battery, the generator, (the connector)
    const r1 = row("tools");
    for (const [kind, label, col] of [["battery", "BATTERY", "#ffd34d"], ["generator", "GENERATOR", "#cdd6e0"], ["connector", "CONNECTOR", "#ffd24a"]]) {
        if (!items.some(i => i.kind === kind)) continue;
        btn(r1, label, buildTool.kind === kind, col, () => placeSwitchTool(kind));
    }
    if (buildTool.kind === "battery") {
        // which element
        const r2 = row("els");
        for (const it of items.filter(i => i.kind === "battery")) {
            const st = buildItemState(it), locked = _bmLocked(it);
            btn(r2, it.label.slice(0, 3), it.elId === buildTool.elId, it.colour, () => placeSwitchTool("battery", it.elId), locked || !st.ok);
        }
        // which level
        const r3 = row("lvls");
        BUILD_LEVELS.power.forEach((label, i) => btn(r3, label, (buildLevel.power || 1) === i + 1, "#19e6c1", () => placeSwitchLevel(i + 1)));
    }
}
