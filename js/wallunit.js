// ─────────────────────────────────────────────────────────
//  THE WALL POWER UNIT — each zone's batteries are one machine set into its back wall (docs/WALL-GRID.md)
// ─────────────────────────────────────────────────────────
// ASKED: "I want the battery system to be interwoven into the wall, so there is not a whole bunch of clutter everywhere", then: "let's have interactive equipment on each zone's wall that you can boot up and
// upgrade." There are no batteries to place any more. A zone's back wall carries ONE power unit: six cells wide, at the zone's left end (WALL_UNIT_CELLS wall tiles, clear of the nest's vortex). It is dark until you
// BOOT it (an element, and the price of two batteries); then UPGRADE it (to tier II, then III, two more cells each) and RECONFIGURE it to another element. Tap the unit to open its panel.
// Its cells ARE batteries in every rule: each booted wall tile is a battery pylon of the unit's element (isBattery, charge, health), so the bank, the tier (2 / 4 / 6 cells = I / II / III), the reach, the charge
// and the supply are exactly what they were (js/game.js banks, js/power.js). Only where they stand, and how they are bought, changed. The cells are drawn as panels set into the wall face (game.js calls
// drawWallUnitCell), not as pylons.
const WALL_UNIT_CELLS = 6;         // wall tiles in a unit: the six cells of a tier III bank
const WALL_CELL_HP = 200;          // a cell's health (a floor pylon had 80): it is part of the wall
function wallUnitX0(zone) { return zone * ZONE_LENGTH; }
// The unit's wall tiles in a zone, left to right (those that exist yet).
function wallUnitTiles(zone) {
    const out = [], x0 = wallUnitX0(zone);
    for (let i = 0; i < WALL_UNIT_CELLS; i++) { const t = typeof getTile === "function" ? getTile(x0 + i, -2) : null; if (t && t.type === "wall_back") out.push(t); }
    return out;
}
function isWallUnitTile(t) { return !!t && t.type === "wall_back" && t.y === -2 && t.x >= 0 && ((t.x % ZONE_LENGTH) + ZONE_LENGTH) % ZONE_LENGTH < WALL_UNIT_CELLS; }
function _wallCellLive(t) { return !!t && t.pillar && t.isBattery && !t.destroyed && t.pillarTeam === "green"; }
// Booted cells (live or wrecked): the unit's level in cells, 0 / 2 / 4 / 6.
function wallUnitCells(zone) { return wallUnitTiles(zone).filter(t => t.pillar && t.isBattery && t.pillarTeam === "green").length; }
function wallUnitTier(zone) { const n = wallUnitCells(zone); return n >= WALL_UNIT_CELLS ? 3 : n >= 4 ? 2 : n >= 2 ? 1 : 0; }
function wallUnitElement(zone) { const t = wallUnitTiles(zone).find(q => q.pillar && q.isBattery); return t ? t.attackModeElement : null; }
function wallUnitCharge(zone) { let c = 0, cap = 0; for (const t of wallUnitTiles(zone)) if (_wallCellLive(t)) { c += Math.max(0, t.charge || 0); cap += BATTERY_CAPACITY; } return { charge: Math.round(c), cap }; }
// What the next step costs (BOOT, UPGRADE to II, UPGRADE to III): two batteries' worth each.
function wallUnitCost(zone) { return wallUnitTier(zone) >= 3 ? 0 : 2 * PYLON_BUILD_COST; }
const WALL_UNIT_RECONFIGURE_COST = () => PYLON_BUILD_COST;
// A cell is installed as a battery pylon on a wall tile (it is not paid for here: the unit's price is).
function _installWallCell(t, el) {
    t.pillar = true; t.pillarTeam = "green"; t.pillarCol = el.color; t.maxHealth = WALL_CELL_HP; t.demolished = false; t.pylonStyle = PYLON_STYLE;
    t.upgraded = false; t.mk = 0; t.destroyed = false; t.reconstructing = false; t.workers = []; t.constructing = false; t.constructProgress = 1; t.health = t.maxHealth;
    t.attackMode = false; t.waveMode = false; t.attackModeElement = el.id; t.attackModeColor = el.color; t.attackPower = TURRET_POWER; t.attackRange = TURRET_RANGE; t.chosenElement = el.id; t.chosenColor = el.color;
    t.isGenerator = false; t.isConnector = false; t.circuitOn = true; t.isBattery = true; t.charge = 0; t._wallCell = true;
    if (typeof _applyPylonKind === "function") _applyPylonKind(t, "battery");
}
function _wallUnitDone(zone, say, colour) {
    if (typeof _cacheAge !== "undefined") _cacheAge = -999;   // the network sees it at once
    if (typeof savePylons === "function") { try { savePylons(); } catch (e) {} }
    if (typeof saveShards === "function") saveShards();
    if (say && typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: say, color: colour || "#ffd34d", life: 100, vy: -0.22, size: 13 });
    if (typeof elementEffects !== "undefined") for (const t of wallUnitTiles(zone)) if (t.pillar) elementEffects.push({ type: "impact", x: t.x + 0.5, y: t.y + 1.2, color: colour || "#ffd34d", radius: 0.4, life: 20 });
}
function _wallUnitSay(text) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text, color: "#f66", life: 90, vy: -0.2, size: 12 }); }
// BOOT: a dark unit comes up as tier I in an element. Needs the zone's generator, an unlocked element and the shards.
function wallUnitBoot(zone, elId) {
    const el = (typeof ELEMENTS !== "undefined" ? ELEMENTS : []).find(e => e.id === elId);
    if (!el || !unlockedElements.has(elId)) { _wallUnitSay("PICK AN ELEMENT YOU HAVE"); return false; }
    if (wallUnitCells(zone) > 0) { _wallUnitSay("ALREADY BOOTED"); return false; }
    if (typeof zoneHasGenerator === "function" && !zoneHasGenerator(zone)) { _wallUnitSay("NO GENERATOR IN " + (zone === 0 ? "THE HOME ZONE" : "ZONE " + zone)); return false; }
    const cost = wallUnitCost(zone); if (shardCount < cost) { _wallUnitSay("NEED " + cost + " SHARDS"); return false; }
    const tiles = wallUnitTiles(zone); if (tiles.length < 2) { _wallUnitSay("NO WALL HERE YET"); return false; }
    shardCount -= cost;
    for (let i = 0; i < 2; i++) _installWallCell(tiles[i], el);
    _wallUnitDone(zone, "POWER UNIT BOOTED — " + el.label.toUpperCase() + " TIER I", el.color); return true;
}
// UPGRADE: two more cells (tier II, then III), in the unit's element.
function wallUnitUpgrade(zone) {
    const tier = wallUnitTier(zone); if (tier < 1) { _wallUnitSay("BOOT IT FIRST"); return false; } if (tier >= 3) { _wallUnitSay("ALREADY TIER III"); return false; }
    const cost = wallUnitCost(zone); if (shardCount < cost) { _wallUnitSay("NEED " + cost + " SHARDS"); return false; }
    const el = ELEMENTS.find(e => e.id === wallUnitElement(zone)); if (!el) return false;
    const tiles = wallUnitTiles(zone), have = wallUnitCells(zone); if (tiles.length < have + 2) { _wallUnitSay("NO WALL HERE YET"); return false; }
    shardCount -= cost;
    for (let i = have; i < have + 2; i++) _installWallCell(tiles[i], el);
    _wallUnitDone(zone, "POWER UNIT — TIER " + ["", "I", "II", "III"][wallUnitTier(zone)], el.color); return true;
}
// RECONFIGURE: the whole unit takes another element (its charge is lost).
function wallUnitReconfigure(zone, elId) {
    const el = ELEMENTS.find(e => e.id === elId), cur = wallUnitElement(zone);
    if (!el || !unlockedElements.has(elId)) { _wallUnitSay("PICK AN ELEMENT YOU HAVE"); return false; }
    if (!cur) { _wallUnitSay("BOOT IT FIRST"); return false; } if (cur === elId) return false;
    const cost = WALL_UNIT_RECONFIGURE_COST(); if (shardCount < cost) { _wallUnitSay("NEED " + cost + " SHARDS"); return false; }
    shardCount -= cost;
    for (const t of wallUnitTiles(zone)) if (t.pillar && t.isBattery) { t.attackModeElement = el.id; t.attackModeColor = el.color; t.pillarCol = el.color; t.chosenElement = el.id; t.chosenColor = el.color; t.charge = 0; }
    _wallUnitDone(zone, "POWER UNIT — NOW " + el.label.toUpperCase(), el.color); return true;
}
// ── DRAWING: a cell is a panel set into the wall face ──
// Called by the wall tile's draw (game.js) with its corner (px, py) and the light (amb). Lies on the wall with the same shear the server racks use.
function drawWallUnitCell(obj, px, py, amb) {
    if (!isWallUnitTile(obj)) return;
    const WH = 110, i = ((obj.x % ZONE_LENGTH) + ZONE_LENGTH) % ZONE_LENGTH, zone = Math.floor(obj.x / ZONE_LENGTH), tier = wallUnitTier(zone), live = _wallCellLive(obj), wreck = obj.pillar && obj.isBattery && !live;
    const el = live ? (ELEMENTS.find(e => e.id === obj.attackModeElement) || null) : null, col = el ? el.color : "#5a6a7a", f0 = typeof frame !== "undefined" ? frame : 0;
    const bay = i < tier * 2;   // inside the unit's current size
    const cx = px - TILE_W * 0.5, cy = py + TILE_H * 0.5 - WH * 0.42, w = 38, h = 58;
    ctx.save(); ctx.transform(1, 0.5, 0, 1, cx, cy);
    // the plate: dark metal with a bevelled frame, in line with the wall's panelling
    ctx.globalAlpha = 0.92 * amb; ctx.fillStyle = "#070a0d"; ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.globalAlpha = amb; ctx.lineWidth = live ? 2 : 1.2; ctx.strokeStyle = live ? col : wreck ? "#7a2a22" : bay ? "#6a8090" : "#2c3a46"; ctx.strokeRect(-w / 2 + 0.5, -h / 2 + 0.5, w - 1, h - 1);
    ctx.globalAlpha = 0.5 * amb; ctx.strokeStyle = live ? col : "#33424e"; ctx.lineWidth = 1; ctx.strokeRect(-w / 2 + 4.5, -h / 2 + 4.5, w - 9, h - 9);
    if (live) {
        // the charge: a column that fills from the bottom, in the element's colour
        const cap = typeof BATTERY_CAPACITY !== "undefined" ? BATTERY_CAPACITY : 120, fill = Math.max(0, Math.min(1, (obj.charge || 0) / cap)), ih = h - 14, ch = ih * fill;
        ctx.globalAlpha = 0.28 * amb; ctx.fillStyle = col; ctx.fillRect(-w / 2 + 7, -h / 2 + 7, w - 14, ih);
        ctx.globalAlpha = (0.85 + 0.1 * Math.sin(f0 * 0.08 + i)) * amb; ctx.fillStyle = col; ctx.fillRect(-w / 2 + 7, -h / 2 + 7 + ih - ch, w - 14, ch);
        ctx.globalAlpha = 0.9 * amb; ctx.fillStyle = "#fff"; ctx.fillRect(-w / 2 + 7, -h / 2 + 7 + ih - ch - 1, w - 14, 1.5);   // the surface
        // seams across the column, like cells in a pack
        ctx.globalAlpha = 0.5 * amb; ctx.fillStyle = "#070a0d"; for (let k = 1; k < 4; k++) ctx.fillRect(-w / 2 + 7, -h / 2 + 7 + (ih / 4) * k - 0.5, w - 14, 1);
    } else if (wreck) {
        ctx.globalAlpha = 0.8 * amb; ctx.strokeStyle = "#c03a2a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-w / 2 + 6, -h / 2 + 8); ctx.lineTo(w / 2 - 6, h / 2 - 8); ctx.moveTo(w / 2 - 6, -h / 2 + 8); ctx.lineTo(-w / 2 + 6, h / 2 - 8); ctx.stroke();
    } else {
        // dark: a power glyph on the middle of the unit that says "boot me" when it is the part of the unit the zone can use; the rest are bays
        ctx.globalAlpha = (bay ? 0.5 : 0.28) * amb; ctx.strokeStyle = "#8aa0b0"; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(0, 2, 7, -Math.PI * 0.35, Math.PI * 1.35); ctx.moveTo(0, -9); ctx.lineTo(0, 1); ctx.stroke();
    }
    ctx.restore();
}
// ── THE PANEL: tap the unit ──
function wallUnitHit(ex, ey) {
    const W = canvas.width / 2, H = canvas.height / 2, z0 = Math.floor(player.x / ZONE_LENGTH);
    for (let z = Math.max(0, z0 - 1); z <= z0 + 1; z++) for (const t of wallUnitTiles(z)) {
        const px = (t.x - player.visualX - (t.y - player.visualY)) * TILE_W + W, py = (t.x - player.visualX + (t.y - player.visualY)) * TILE_H + H, cx = px - TILE_W * 0.5, cy = py + TILE_H * 0.5 - 110 * 0.42;
        if (Math.abs(ex - cx) < TILE_W * 0.62 && Math.abs(ey - (cy + (ex - cx) * 0.5)) < 110 * 0.45) return { zone: z, x: cx, y: cy };
    }
    return null;
}
let _wuZone = null;
function wallUnitEl() { return typeof document !== "undefined" && document.getElementById ? document.getElementById("wallUnit") : null; }
function wallUnitClose() { _wuZone = null; const r = wallUnitEl(); if (r) { r.innerHTML = ""; r.classList.remove("open"); } }
function wallUnitHTML(zone) {
    const tier = wallUnitTier(zone), eln = wallUnitElement(zone), el = ELEMENTS.find(e => e.id === eln), ch = wallUnitCharge(zone), cost = wallUnitCost(zone), gen = typeof zoneHasGenerator !== "function" || zoneHasGenerator(zone);
    let h = '<div class="wu-head"><b>POWER UNIT</b><span>' + (zone === 0 ? "HOME" : "ZONE " + zone) + '</span><button class="wu-x" data-wu="close" aria-label="Close">\u2715</button></div>';
    if (!tier) {
        h += '<div class="wu-state off">OFFLINE</div>' + (gen ? '' : '<div class="wu-note">NEEDS A GENERATOR IN THIS ZONE</div>');
        h += '<div class="wu-chips">' + ELEMENTS.filter(e => unlockedElements.has(e.id)).map(e => '<button class="wu-chip' + (_wuPick === e.id ? ' on' : '') + '" data-pick="' + e.id + '" style="--c:' + e.color + '">' + e.label.slice(0, 3).toUpperCase() + '</button>').join('') + '</div>';
        h += '<button class="wu-btn" data-wu="boot"' + (_wuPick && gen ? '' : ' disabled') + '>BOOT \u25c6' + cost + '</button>';
    } else {
        h += '<div class="wu-state" style="color:' + (el ? el.color : '#fff') + '">TIER ' + ["", "I", "II", "III"][tier] + ' \u00b7 ' + (el ? el.label.toUpperCase() : '') + '</div>';
        h += '<div class="wu-pips">' + [1, 2, 3].map(n => '<i class="' + (n <= tier ? 'on' : '') + '" style="--c:' + (el ? el.color : '#ffd34d') + '"></i>').join('') + '</div>';
        h += '<div class="wu-bar"><i style="width:' + (ch.cap ? Math.round(100 * ch.charge / ch.cap) : 0) + '%;background:' + (el ? el.color : '#ffd34d') + '"></i></div><div class="wu-note">' + ch.charge + ' / ' + ch.cap + '</div>';
        h += tier < 3 ? '<button class="wu-btn" data-wu="upgrade">UPGRADE TO ' + ["", "II", "III"][tier] + ' \u25c6' + cost + '</button>' : '<div class="wu-note">FULLY UPGRADED</div>';
        h += '<div class="wu-note">RECONFIGURE \u25c6' + WALL_UNIT_RECONFIGURE_COST() + '</div><div class="wu-chips">' + ELEMENTS.filter(e => unlockedElements.has(e.id)).map(e => '<button class="wu-chip' + (eln === e.id ? ' on' : '') + '" data-re="' + e.id + '" style="--c:' + e.color + '">' + e.label.slice(0, 3).toUpperCase() + '</button>').join('') + '</div>';
    }
    return h;
}
let _wuPick = null;
function wallUnitRender() { const r = wallUnitEl(); if (!r || _wuZone === null) return; r.innerHTML = wallUnitHTML(_wuZone); }
function wallUnitOpen(zone, sx, sy) {
    const r = wallUnitEl(); if (!r) return false;
    _wuZone = zone; if (!wallUnitTier(zone)) _wuPick = unlockedElements.has(_wuPick) ? _wuPick : (typeof player !== "undefined" && unlockedElements.has(player.selectedElement) ? player.selectedElement : null);
    let cx = sx, cy = sy; try { const b = canvas.getBoundingClientRect(); cx = b.left + sx * b.width / canvas.width; cy = b.top + sy * b.height / canvas.height; } catch (e) {}
    r.style.left = Math.max(8, Math.min((typeof innerWidth === "number" ? innerWidth : 800) - 190, cx - 90)) + "px"; r.style.top = Math.max(8, cy + 44) + "px"; r.classList.add("open"); wallUnitRender(); return true;
}
// A tap at screen (ex, ey): on the unit it opens the panel (and the tap is spent).
function wallUnitTap(ex, ey) {
    const r = wallUnitEl(); if (r && r.classList && r.classList.contains("open")) wallUnitClose();
    const h = wallUnitHit(ex, ey); return h ? wallUnitOpen(h.zone, h.x, h.y) : false;
}
try {
    const r = wallUnitEl();
    if (r) {
        r.addEventListener("click", ev => {
            const t = ev.target && ev.target.closest ? ev.target : null; if (!t) return; const q = s => t.closest(s);
            if (q("[data-wu=close]")) { wallUnitClose(); return; }
            const pk = q("[data-pick]"); if (pk) { _wuPick = pk.getAttribute("data-pick"); wallUnitRender(); return; }
            const re = q("[data-re]"); if (re) { wallUnitReconfigure(_wuZone, re.getAttribute("data-re")); wallUnitRender(); return; }
            if (q("[data-wu=boot]")) { if (wallUnitBoot(_wuZone, _wuPick)) wallUnitRender(); return; }
            if (q("[data-wu=upgrade]")) { wallUnitUpgrade(_wuZone); wallUnitRender(); return; }
        });
        document.addEventListener("pointerdown", ev => { if (_wuZone !== null && !(ev.target && ev.target.closest && ev.target.closest("#wallUnit"))) wallUnitClose(); }, true);
    }
} catch (e) { /* no page (the test sandbox) */ }
