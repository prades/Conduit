// ─────────────────────────────────────────────────────────
//  MODULES  —  structures you build anywhere, that work while powered
// ─────────────────────────────────────────────────────────
// REPORTED: "I don't know if I like the current camp modules … give them
// actual purpose. They shouldn't be just at the base camp, though. We should
// be able to build them wherever the player wants to."
//
// Asked: LOCAL and POWERED. A module is a structure placed from the build
// window's MODULES tab on any free floor tile the grid reaches. It works only
// while it has power — a route to a held nest (a shield generator or connector,
// or a powered pylon or battery beside it to chain from) or a charged battery
// in reach — and its effect covers the ground around it. Build as many as you
// like. The six old camp buildings are retired and refunded (js/camp.js).
//
// The first three, picked from twenty:
//
//   MED BAY        A healing aura. Followers and clones within MEDBAY_RADIUS
//                  regain MEDBAY_RATE HP a frame plus MEDBAY_PCT of their max
//                  (so a big clone pool fills too). It pays MODULE_DRAW every
//                  MODULE_PAY_FRAMES while it is healing someone.
//
//   FORCE WALL     A wall of energy across the whole tunnel at the emitter's
//                  column. Predators cannot cross it: they stop at it and beat
//                  on it; your own units walk through. It holds FW_HP. It is
//                  the SHIELD BARRIER, fuelled by SHIELD CELLS (js/shieldcells.js):
//                  mending burns one cell per FW_CELL_HP, and when it breaks it
//                  is down for FW_DOWN frames and then needs FW_RISE_CELLS
//                  cells to rise again.
//
//   OVERCLOCK HUB  Pylons within OC_RADIUS fire OC_FIRE_MULT× as fast and
//                  each round costs OC_COST_MULT× the power; wave links with an
//                  overclocked end hit OC_WAVE_MULT× as hard and count double
//                  in their network's drain. Always on while powered.

const MODULE_DEFS = {
    medbay:    { label: "MED BAY",       cost: 40, colour: "#66ffaa", icon: "medbay",
                 note: "Followers and clones within 3 tiles heal while it is powered." },
    forcewall: { label: "FORCE WALL",    cost: 50, colour: "#66ccff", icon: "forcewall",
                 note: "A shield barrier across the tunnel; runs on shield cells. Predators must break it." },
    overclock: { label: "OVERCLOCK HUB", cost: 45, colour: "#ffaa33", icon: "overclock",
                 note: "Pylons within 3 tiles fire 50% faster; each round costs double power." },
};
const MODULE_IDS        = Object.keys(MODULE_DEFS);
const MODULE_PAY_FRAMES = 30;     // how often a working module pays …
const MODULE_DRAW       = 1;      // … this much power
const MODULE_REFRESH    = 30;     // frames between power / reach refreshes
const MODULE_REFUND     = 0.5;    // demolished: this share of its price back

const MEDBAY_RADIUS = 3;
const MEDBAY_RATE   = 0.1;           // HP a frame (6/s) …
const MEDBAY_PCT    = 0.01 / 60;     // … plus 1% of max HP a second

const FW_HP       = 400;
const FW_REGEN    = 0.5;      // HP a frame while powered and hurt
const FW_DOWN     = 600;      // frames down after it breaks (10 s)
const FW_RISE_HP  = 0.25;     // it rises again at this share of FW_HP
const FW_HIT_EVERY = 45;      // frames between one predator's blows
const FW_HIT_MULT  = 1.0;     // × the predator's power per blow
const FW_GAP       = 0.36;    // tiles: how far from the wall a predator is held
const FW_RISE_CELLS = 2;      // shield cells to raise it again after it breaks
const FW_CELL_HP    = 100;    // wall HP one shield cell mends
const FW_Y_MIN = -1, FW_Y_MAX = 4;   // the tunnel's floor rows it spans

const OC_RADIUS     = 3;
const OC_FIRE_MULT  = 1.5;
const OC_COST_MULT  = 2;
const OC_WAVE_MULT  = 1.5;

let modules = [];             // { kind, x, y, powered, powerSource, _bats, wallHp, wallDownUntil, _payAt, _healing }
const MODULES_KEY = "conduit_modules";

// ── Build / remove ────────────────────────────────────────
function moduleAt(x, y) { for (const m of modules) if (m.x === x && m.y === y) return m; return null; }
function placeModule(kind, t) {
    const def = MODULE_DEFS[kind];
    if (!def || !t) return null;
    if (shardCount < def.cost) return null;
    shardCount -= def.cost;
    if (typeof saveShards === "function") saveShards();
    const m = { kind, x: t.x, y: t.y, powered: false, powerSource: null, _bats: [],
                wallHp: kind === "forcewall" ? FW_HP : 0, wallDownUntil: 0, _payAt: 0, _healing: false, bornAt: frame || 0 };
    modules.push(m);
    t._module = m;
    _moduleRefresh(m);
    saveModules();
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: def.label + " BUILT", color: def.colour, life: 100, vy: -0.22, size: 13 });
    return m;
}
function removeModule(m, refund) {
    const i = modules.indexOf(m);
    if (i < 0) return false;
    modules.splice(i, 1);
    const t = typeof getTile === "function" ? getTile(m.x, m.y) : null;
    if (t && t._module === m) t._module = null;
    if (m.kind === "overclock") _overclockMark();
    if (refund) {
        const back = Math.round(MODULE_DEFS[m.kind].cost * MODULE_REFUND);
        shardCount += back; if (typeof saveShards === "function") saveShards();
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, text: MODULE_DEFS[m.kind].label + " REMOVED +" + back + " ◆", color: "#ffcc44", life: 100, vy: -0.2 });
    }
    saveModules();
    return true;
}

// ── Power ─────────────────────────────────────────────────
// What feeds it, worked out like a pylon's route (power.js), and the
// batteries in reach.
function _moduleRefresh(m) {
    let src = null;
    if (typeof powerRoute === "function") { const r = powerRoute(m); src = r && r.source; }
    if (!src && typeof _pillarCache !== "undefined") {
        const R = typeof getPylonRange === "function" ? getPylonRange() : 3;
        for (const q of _pillarCache) {
            if (!q.powerSource || q.pillarTeam !== "green") continue;
            if (!((typeof needsPower === "function" && needsPower(q)) || (typeof isBatteryPylon === "function" && isBatteryPylon(q)))) continue;
            if (Math.hypot(q.x - m.x, q.y - m.y) <= R) { src = q.powerSource; break; }
        }
    }
    // No generator in its zone (power.js): offline.
    m.zoneDark = typeof zoneGenerated === "function" && !zoneGenerated(m);
    if (m.zoneDark) { m.powerSource = null; m._bats = []; m.powered = false; return; }
    m.powerSource = src || null;
    m._bats = typeof batteriesNear === "function" ? batteriesNear(m) : [];
    const batOk = m._bats.some(b => typeof _liveBattery === "function" && _liveBattery(b) && batteryCharge(b) >= MODULE_DRAW);
    const gridOk = !!m.powerSource && (typeof gridCan !== "function" || gridCan(m.powerSource, MODULE_DRAW));
    m.powered = batOk || gridOk;
}
// Take `amount` from a battery in reach, else the grid. False if neither can.
function modulePay(m, amount) {
    if (m._bats && m._bats.length && typeof batteryPay === "function" && batteryPay(m, amount)) return true;
    if (m.powerSource && typeof gridPay === "function" && gridPay(m.powerSource, amount)) return true;
    return false;
}
// Pays every MODULE_PAY_FRAMES while working; goes dark when it cannot.
function _moduleDraws(m) {
    const f = frame || 0;
    if (f - (m._payAt || -1e9) < MODULE_PAY_FRAMES) return m.powered;
    m._payAt = f;
    if (!modulePay(m, MODULE_DRAW)) m.powered = false;
    return m.powered;
}

// ── The effects ───────────────────────────────────────────
function _medbayTick(m) {
    m._healing = false;
    if (!m.powered) return;
    const near = typeof unitsNear === "function" ? unitsNear(m.x, MEDBAY_RADIUS) : actors;
    let any = false;
    for (const a of near) {
        if (!a || a.dead || a.team !== "green" || !(a.isFollower || a.isClone)) continue;
        if (!(a.health < (a.maxHealth || 0))) continue;
        if (Math.hypot(a.x - m.x, a.y - m.y) > MEDBAY_RADIUS) continue;
        if (!any && !_moduleDraws(m)) return;   // pays as it starts healing, then every MODULE_PAY_FRAMES
        any = true;
        a.health = Math.min(a.maxHealth, a.health + MEDBAY_RATE + a.maxHealth * MEDBAY_PCT);
        if ((frame || 0) % 20 === 0 && typeof elementEffects !== "undefined")
            elementEffects.push({ type: "impact", x: a.x, y: a.y, color: "#66ffaa", radius: 0.3, life: 14 });
    }
    m._healing = any;
}

function forceWallUp(m) { return m.kind === "forcewall" && m.powered && m.wallHp > 0 && (frame || 0) >= (m.wallDownUntil || 0); }
function _forcewallTick(m) {
    const f = frame || 0;
    if (m.wallHp <= 0 && f >= (m.wallDownUntil || 0) && m.powered) {
        // Back up — for FW_RISE_CELLS shield cells. Without them it stays down.
        m._needsCells = !(typeof spendShieldCells === "function" && spendShieldCells(FW_RISE_CELLS));
        if (m._needsCells) return;
        m.wallHp = FW_HP * FW_RISE_HP;
        if (typeof elementEffects !== "undefined") for (let y = FW_Y_MIN; y <= FW_Y_MAX; y++)
            elementEffects.push({ type: "impact", x: m.x, y, color: "#66ccff", radius: 0.4, life: 18 });
    }
    // Mending burns cells: one buys FW_CELL_HP of wall, paid out at FW_REGEN a frame.
    if (m.powered && m.wallHp > 0 && m.wallHp < FW_HP) {
        if (!(m._cellHp > 0) && typeof spendShieldCells === "function" && spendShieldCells(1)) m._cellHp = FW_CELL_HP;
        if (m._cellHp > 0 && _moduleDraws(m)) {
            const add = Math.min(FW_REGEN, m._cellHp, FW_HP - m.wallHp);
            m.wallHp += add; m._cellHp -= add;
        }
    }
}
// Called from a predator's update, after it has moved: a predator that would
// cross an up wall is held on its own side and beats on it instead.
function forceWallBlock(p) {
    if (!p || p.dead || p.team === "green" || p.isClone || !modules.length) return false;
    const px = p.lastX === undefined ? p.x : p.lastX;
    for (const m of modules) {
        if (!forceWallUp(m)) continue;
        const X = m.x;
        const side = px === X ? (p.x < X ? -1 : 1) : Math.sign(px - X);
        // On the far side of the plane now, or inside the wall's thickness.
        if (Math.sign(p.x - X) === side && Math.abs(p.x - X) >= FW_GAP) continue;
        p.x = X + side * FW_GAP;
        const f = frame || 0;
        if (f - (p._wallHitAt || -1e9) >= FW_HIT_EVERY) {
            p._wallHitAt = f;
            m.wallHp -= Math.max(1, (p.power || 5) * FW_HIT_MULT);
            m._hitAt = f;
            if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: X, y: p.y, color: "#aee8ff", radius: 0.45, life: 14 });
            if (m.wallHp <= 0) {
                m.wallHp = 0; m.wallDownUntil = f + FW_DOWN;
                floatingTexts.push({ x: m.x, y: m.y - 1, text: "FORCE WALL DOWN", color: "#66ccff", life: 90, vy: -0.08 });
                if (typeof shake !== "undefined") shake = Math.max(shake || 0, 3);
            }
        }
        p._wallBlocked = f;
        return true;
    }
    return false;
}

// Which pylons an overclock hub reaches. Marked on the pylons, for the firing
// loop (game.js), the price of a round (payForShot) and the wave links.
function _overclockMark() {
    const cache = typeof _pillarCache !== "undefined" ? _pillarCache : [];
    for (const t of cache) t._oc = false;
    for (const m of modules) {
        if (m.kind !== "overclock" || !m.powered) continue;
        for (const t of cache) {
            if (t.pillarTeam !== "green" || t.destroyed || (typeof isRelayPylon === "function" && isRelayPylon(t)) || t.isBattery) continue;
            const ox = t._ultra ? t._ultra.cx : t.x, oy = t._ultra ? t._ultra.cy : t.y;
            if (Math.hypot(ox - m.x, oy - m.y) <= OC_RADIUS) t._oc = true;
        }
    }
}
function overclockFireMult(t) { return t && t._oc ? OC_FIRE_MULT : 1; }
function overclockCostMult(t) { return t && t._oc ? OC_COST_MULT : 1; }

// ── Once a step, from render() ────────────────────────────
function moduleTick() {
    if (!modules.length) return;
    const f = frame || 0;
    if (f % MODULE_REFRESH === 0) {
        for (const m of modules) {
            _moduleRefresh(m);
            // A tile rebuilt between waves loses its marker; put it back.
            const t = typeof getTile === "function" ? getTile(m.x, m.y) : null;
            if (t) t._module = m;
        }
        _overclockMark();
    }
    for (const m of modules) {
        if (m.kind === "medbay") _medbayTick(m);
        else if (m.kind === "forcewall") _forcewallTick(m);
        else if (m.kind === "overclock" && m.powered && f % MODULE_PAY_FRAMES === 0) {
            // A small standing draw: it is a machine, not just a multiplier.
            if (!modulePay(m, MODULE_DRAW)) { m.powered = false; _overclockMark(); }
        }
    }
}

// ── Save ──────────────────────────────────────────────────
function saveModules() {
    try { localStorage.setItem(MODULES_KEY, JSON.stringify(modules.map(m => ({ k: m.kind, x: m.x, y: m.y, hp: Math.round(m.wallHp || 0) })))); } catch (e) {}
}
function loadModules() {
    let data = [];
    try { data = JSON.parse(localStorage.getItem(MODULES_KEY) || "[]") || []; } catch (e) { data = []; }
    modules = [];
    if (!Array.isArray(data) || !data.length) return;
    const maxX = Math.max(...data.map(d => d.x || 0));
    if (typeof ensureWorldTo === "function") ensureWorldTo(maxX + (typeof ZONE_LENGTH !== "undefined" ? ZONE_LENGTH : 15));
    for (const d of data) {
        if (!MODULE_DEFS[d.k]) continue;
        const t = typeof getTile === "function" ? getTile(d.x, d.y) : null;
        if (!t || t._module) continue;
        const m = { kind: d.k, x: d.x, y: d.y, powered: false, powerSource: null, _bats: [],
                    wallHp: d.k === "forcewall" ? (Number.isFinite(d.hp) ? d.hp : FW_HP) : 0, wallDownUntil: 0, _payAt: 0, _healing: false, bornAt: -1e9 };
        modules.push(m); t._module = m;
    }
}
function clearModules() {
    for (const m of modules) { const t = typeof getTile === "function" ? getTile(m.x, m.y) : null; if (t) t._module = null; }
    modules = [];
    try { localStorage.removeItem(MODULES_KEY); } catch (e) {}
}

// ── Drawing ───────────────────────────────────────────────
// The structure on its tile (from the depth-sorted draw pass, game.js).
function drawModule(m, px, py) {
    const def = MODULE_DEFS[m.kind];
    if (!def) return;
    const f = frame || 0, on = m.powered;
    const cy = py + TILE_H;                 // tile centre
    const rise = Math.min(1, (f - (m.bornAt || -1e9)) / 30);
    const h = 26 * rise, hw = 18, hd = 9;
    const top = cy - h;
    const col = on ? def.colour : "#5a6470";
    ctx.save();
    // A squat isometric block: two sides, a top.
    ctx.fillStyle = "#1e2630";
    ctx.beginPath(); ctx.moveTo(px - hw, cy); ctx.lineTo(px, cy + hd); ctx.lineTo(px, top + hd); ctx.lineTo(px - hw, top); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#151b23";
    ctx.beginPath(); ctx.moveTo(px, cy + hd); ctx.lineTo(px + hw, cy); ctx.lineTo(px + hw, top); ctx.lineTo(px, top + hd); ctx.closePath(); ctx.fill();
    ctx.fillStyle = "#2c3846";
    ctx.beginPath(); ctx.moveTo(px - hw, top); ctx.lineTo(px, top + hd); ctx.lineTo(px + hw, top); ctx.lineTo(px, top - hd); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.globalAlpha = on ? 0.9 : 0.5; ctx.stroke(); ctx.globalAlpha = 1;
    // Its emblem above it.
    const pulse = 0.5 + 0.5 * Math.sin(f * 0.08 + m.x);
    if (m.kind === "overclock" && on) {
        // A spinning rotor.
        ctx.save(); ctx.translate(px, top - 6); ctx.rotate(f * 0.25); ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 4.5); } ctx.stroke(); ctx.restore();
    } else if (m.kind === "forcewall") {
        ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(px, top); ctx.lineTo(px, top - 22); ctx.stroke();
        ctx.fillStyle = col; ctx.globalAlpha = on ? 0.6 + 0.4 * pulse : 0.5; ctx.beginPath(); ctx.arc(px, top - 24, 4, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1;
    }
    if (!(typeof drawIcon === "function" && drawIcon(ctx, def.icon, col, px, top - (m.kind === "forcewall" ? 38 : 18), 18))) {
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(px, top - 16, 5, 0, Math.PI * 2); ctx.fill();
    }
    if (!on) { ctx.fillStyle = "#f88"; ctx.font = "bold 8px monospace"; ctx.textAlign = "center"; ctx.fillText(m.zoneDark ? "NO GENERATOR IN ZONE" : "NO POWER", px, cy + hd + 12); }
    ctx.restore();
}
// The areas and the wall, over the world (from the overlay pass, game.js).
function drawModuleFields() {
    if (!modules.length) return;
    const f = frame || 0;
    const scr = (x, y) => ({ x: (x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2,
                             y: (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H });
    ctx.save();
    for (const m of modules) {
        const c = scr(m.x, m.y);
        if (c.x < -400 || c.x > canvas.width + 400) continue;
        const def = MODULE_DEFS[m.kind];
        if ((m.kind === "medbay" || m.kind === "overclock") && m.powered) {
            const R = m.kind === "medbay" ? MEDBAY_RADIUS : OC_RADIUS;
            const active = m.kind === "medbay" ? m._healing : true;
            ctx.globalAlpha = (active ? 0.35 : 0.15) + 0.1 * Math.sin(f * 0.06);
            ctx.strokeStyle = def.colour; ctx.lineWidth = 1.5; ctx.setLineDash([6, 6]); ctx.lineDashOffset = -f * 0.4;
            ctx.beginPath(); ctx.ellipse(c.x, c.y, R * TILE_W * 1.414, R * TILE_H * 1.414, 0, 0, Math.PI * 2); ctx.stroke();
            ctx.setLineDash([]);
        }
        if (m.kind === "forcewall" && forceWallUp(m)) {
            // A sheet of energy across the tunnel at its column.
            const hpK = m.wallHp / FW_HP, hit = f - (m._hitAt || -1e9) < 8;
            const a = scr(m.x, FW_Y_MIN - 0.5), b = scr(m.x, FW_Y_MAX + 0.5), H = 70;
            const g = ctx.createLinearGradient(0, Math.min(a.y, b.y) - H, 0, Math.max(a.y, b.y));
            g.addColorStop(0, "rgba(102,204,255,0)");
            g.addColorStop(1, "rgba(102,204,255," + ((hit ? 0.5 : 0.28) * (0.4 + 0.6 * hpK)) + ")");
            ctx.globalAlpha = 1; ctx.fillStyle = g;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(b.x, b.y - H); ctx.lineTo(a.x, a.y - H); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = hit ? "#ffffff" : "rgba(160,230,255,0.85)"; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
            // Scan lines climbing it.
            ctx.globalAlpha = 0.4; ctx.lineWidth = 1;
            for (let i = 0; i < 3; i++) { const k = ((f * 0.01 + i / 3) % 1) * H; ctx.beginPath(); ctx.moveTo(a.x, a.y - k); ctx.lineTo(b.x, b.y - k); ctx.stroke(); }
            // Its strength, by the emitter.
            ctx.globalAlpha = 1; ctx.fillStyle = "#000"; ctx.fillRect(c.x - 16, c.y + 14, 32, 4);
            ctx.fillStyle = "#66ccff"; ctx.fillRect(c.x - 16, c.y + 14, 32 * hpK, 4);
        } else if (m.kind === "forcewall" && m.powered && m.wallHp <= 0) {
            const left = Math.max(0, Math.ceil(((m.wallDownUntil || 0) - f) / 60));
            ctx.globalAlpha = 1; ctx.fillStyle = "#66ccff"; ctx.font = "bold 9px monospace"; ctx.textAlign = "center";
            ctx.fillText(left > 0 ? "RISING " + left + "s" : "NEEDS " + FW_RISE_CELLS + " SHIELD CELLS", c.x, c.y + 22);
        }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
}
