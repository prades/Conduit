// ─────────────────────────────────────────────────────────
//  SHIELD CELLS — the CORE tech's shields
// ─────────────────────────────────────────────────────────
// REPORTED: "get rid of the shield generator idea as a standalone object;
// rather it be part of the core tech strategy" — and: "The pylons should drop
// shield cells; they're used to build up a shield cell collection used to fuel
// individual shields for followers and the shield barrier."
//
//   MADE     A powered CORE pylon or turret (in a zone with a generator) makes
//            a cell every SHIELD_CELL_EVERY frames — a MK II twice as fast —
//            and drops it on a free floor tile beside it. At most
//            SHIELD_CELL_DROP_MAX of one pylon's cells lie on the floor; past
//            that it waits for you to pick them up.
//   KEPT     Walk over one (or let a follower walk over it) and it goes into
//            your store, shieldCells, up to SHIELD_CELL_CAP. Kept between
//            sessions; a new game starts with none.
//   SPENT    A follower or clone with no shield, not hit for SHIELD_GEN_DELAY,
//            spends ONE cell for a full shield (SHIELD_GEN_SHARE of its max
//            health, at least SHIELD_GEN_MIN). The FORCE WALL burns cells to
//            rise again and to mend (js/modules.js).
//
// The cells on the floor are groundItems of type "shieldCell": they are drawn
// in the world's depth pass and you pick them up in its pickup pass (game.js).

let shieldCells = 0;
const SHIELD_CELLS_KEY = "conduit_shieldcells";
let _cellFullSaid = -1e9;

function loadShieldCells() {
    try { const n = parseInt(localStorage.getItem(SHIELD_CELLS_KEY) || "0", 10); shieldCells = Number.isFinite(n) ? Math.max(0, Math.min(SHIELD_CELL_CAP, n)) : 0; }
    catch (e) { shieldCells = 0; }
}
function saveShieldCells() { try { localStorage.setItem(SHIELD_CELLS_KEY, String(shieldCells)); } catch (e) {} }
function clearShieldCells() { shieldCells = 0; try { localStorage.removeItem(SHIELD_CELLS_KEY); } catch (e) {} }
loadShieldCells();

// Does this pylon make cells right now?
function makesShieldCells(t) {
    return !!t && t.pillar && !t.destroyed && t.health > 0 && t.pillarTeam === "green"
        && t.attackModeElement === "core" && !!(t.attackMode || t.waveMode)
        && !t.isBattery && !(typeof isRelayPylon === "function" && isRelayPylon(t))
        && t.powered !== false && !t.zoneDark && !t.constructing;
}
function _cellsOnFloorFrom(t) {
    let n = 0;
    for (const g of groundItems) if (g.type === "shieldCell" && g.from === t) n++;
    return n;
}
// A free floor tile beside it to drop one on.
function _cellDropTile(t) {
    const spots = [[1, 0], [0, 1], [-1, 0], [0, -1], [1, 1], [-1, 1], [1, -1], [-1, -1]];
    for (const [dx, dy] of spots) {
        const q = typeof getTile === "function" ? getTile(t.x + dx, t.y + dy) : null;
        if (!q || q.type !== "floor" || (q.pillar && !q.destroyed) || q.nest || q._module) continue;
        if (groundItems.some(g => g.type === "shieldCell" && g.x === q.x && g.y === q.y)) continue;
        return q;
    }
    return null;
}
// Into the store. False when it is full (the cell stays where it is).
function collectShieldCell(item, by) {
    if (shieldCells >= SHIELD_CELL_CAP) {
        const f = typeof frame !== "undefined" ? frame : 0;
        if (f - _cellFullSaid > 240) {
            _cellFullSaid = f;
            floatingTexts.push({ x: canvas.width / 2 + 2, y: canvas.height / 2 - 70, text: "SHIELD CELLS FULL (" + SHIELD_CELL_CAP + ")", color: "#88a", life: 70, vy: -0.05, size: 10 });
        }
        return false;
    }
    shieldCells++;
    saveShieldCells();
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: item.x, y: item.y, color: SHIELD_CELL_COLOR, radius: 0.35, life: 14 });
    floatingTexts.push({ x: canvas.width / 2 + 2, y: canvas.height / 2 - 70, text: "+1 SHIELD CELL · " + shieldCells, color: SHIELD_CELL_COLOR, life: 55, vy: -0.06, size: 10 });
    return true;
}

// Once a step, from render().
function shieldCellTick() {
    const f = typeof frame !== "undefined" ? frame : 0;
    // ── MADE ──
    if (f % 30 === 0 && typeof _pillarCache !== "undefined") {
        for (const t of _pillarCache) {
            if (!makesShieldCells(t)) continue;
            t._cellT = Math.min(SHIELD_CELL_EVERY, (t._cellT || 0) + 30 * ((t.mk || 0) >= 2 ? SHIELD_CELL_MK2_MULT : 1));
            if (t._cellT < SHIELD_CELL_EVERY) continue;
            if (_cellsOnFloorFrom(t) >= SHIELD_CELL_DROP_MAX) continue;    // waits, ready
            const q = _cellDropTile(t);
            if (!q) continue;
            t._cellT = 0;
            groundItems.push({ type: "shieldCell", x: q.x, y: q.y, from: t, bornAt: f });
            if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: q.x, y: q.y, color: SHIELD_CELL_COLOR, radius: 0.3, life: 12 });
        }
    }
    // ── KEPT: a follower walking over one picks it up (you do, in game.js) ──
    if (f % 6 === 0 && groundItems.length) {
        for (let i = groundItems.length - 1; i >= 0; i--) {
            const g = groundItems[i];
            if (g.type !== "shieldCell") continue;
            const near = typeof unitsNear === "function" ? unitsNear(g.x, 1) : actors;
            const by = near.find(a => a && !a.dead && a.isFollower && a.team === "green" && Math.abs(a.x - g.x) < SHIELD_CELL_PICK && Math.abs(a.y - g.y) < SHIELD_CELL_PICK);
            if (by && collectShieldCell(g, by)) groundItems.splice(i, 1);
        }
    }
    // ── SPENT: one cell, one full shield ──
    if (f % 15 === 0 && shieldCells > 0) {
        for (const a of actors) {
            if (shieldCells <= 0) break;
            if (!a || a.dead || a.team !== "green" || !(a.isFollower || a.isClone)) continue;
            if (a.shielded && a.shieldAmount > 0) continue;
            if (a._shieldHitAt !== undefined && f - a._shieldHitAt < SHIELD_GEN_DELAY) continue;
            const cap = Math.max(SHIELD_GEN_MIN, Math.round((a.maxHealth || 0) * SHIELD_GEN_SHARE));
            shieldCells--;
            a.shielded = true; a.shieldAmount = cap; a._shieldMax = cap; a._cellShieldAt = f;
            if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: a.x, y: a.y, color: SHIELD_CELL_COLOR, radius: 0.4, life: 16 });
        }
        saveShieldCells();
    }
}
// Spend `n` cells if you have them (the force wall).
function spendShieldCells(n) {
    if (!(n > 0) || shieldCells < n) return false;
    shieldCells -= n; saveShieldCells();
    return true;
}

// A cell on the floor: a small glowing hexagon, bobbing.
function drawShieldCellItem(g, px, py) {
    const f = typeof frame !== "undefined" ? frame : 0;
    const bob = Math.sin(f * 0.07 + g.x * 1.7 + g.y) * 2.5;
    const cx = px, cy = py + TILE_H - 9 + bob, r = 5;
    ctx.save();
    ctx.globalAlpha = 0.25; ctx.fillStyle = SHIELD_CELL_COLOR;
    ctx.beginPath(); ctx.ellipse(px, py + TILE_H, 7, 3.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.95;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = Math.PI / 6 + i * Math.PI / 3; const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; if (i) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.closePath();
    ctx.fillStyle = "#123a48"; ctx.fill();
    ctx.strokeStyle = SHIELD_CELL_COLOR; ctx.lineWidth = 1.5; ctx.stroke();
    ctx.fillStyle = SHIELD_CELL_COLOR; ctx.globalAlpha = 0.6 + 0.3 * Math.sin(f * 0.12 + g.x);
    ctx.beginPath(); ctx.arc(cx, cy, 2, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
}
