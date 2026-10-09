// ─────────────────────────────────────────────────────────
//  WAVE FORMATIONS — four wave pylons of one element in a square
//
//  REPORTED: "Whenever 4 flux wave pylons are constructed together it creates
//  a black hole in the middle of the four connected pylons (now transparent
//  pylons) and lights up when enemies are entangled. When 4 fire wave pylons
//  are constructed it creates a small fire wall and gets bigger when enemies
//  enter it and damages them."
//
//   - Found like the Ultra turret (js/ultra.js): every cache rebuild claims
//     each 2x2 square of your finished wave pylons of the same element. Only
//     FLUX squares form anything. Nothing is saved; break the square
//     and it is gone, rebuild it and it is back. The four pylons keep doing
//     what wave pylons do.
//   - BLACK HOLE (flux): a vortex opens in the floor where the four meet —
//     "black hole vortex on the ground, 3D looking" — and the pylons go
//     see-through. Every enemy within BH_RADIUS is ENTANGLED — dragged in,
//     slowed, and crushed a little each half second — and the hole lights up
//     with how many it holds.
//   (A FIRE WALL from four fire wave pylons was tried and taken out: "the
//   fire wall was a bad idea, it looks wonky". Fire squares form nothing.)
//   - Only while all four are powered: a dark square forms nothing.
// ─────────────────────────────────────────────────────────

const FORM_KINDS = { flux: "blackhole" };
const FORM_TICK        = 30;     // frames between damage ticks
const FORM_TIER_BONUS  = 0.25;   // + damage per network tier
const BH_RADIUS        = 2.5;    // tiles: what it entangles
const BH_PULL          = 0.03;   // tiles a frame at the rim's edge, more nearer in
const BH_CORE          = 0.35;   // not pulled closer than this
const BH_DMG           = 6;      // per tick
const BH_SLOW          = 0.5;
const BH_ON_VORTEX     = 0.9;    // tiles: standing on the vortex itself
const FORM_MAXHP_SHARE = 0.01;   // + this much of the target's max HP a tick

let _formations = [];            // anchors
let _formState = new Map();      // "x,y" → { glow, size }, kept across rebuilds

function _formPylonOk(t, el) {
    return !!t && t.pillar && !t.destroyed && t.health > 0 && t.waveMode && !t.attackMode
        && t.pillarTeam === "green" && !t.constructing && t.attackModeElement === el
        && !(typeof isRelayPylon === "function" && isRelayPylon(t));
}

function rebuildFormations() {
    for (const t of _formations) if (t._wform) for (const p of t._wform.tiles) p._wformOf = null;
    for (const t of world) if (t._wform || t._wformOf) { t._wform = null; t._wformOf = null; }
    _formations = [];
    const pool = (typeof _pillarCache !== "undefined" ? _pillarCache : world)
        .filter(t => FORM_KINDS[t.attackModeElement] && _formPylonOk(t, t.attackModeElement))
        .sort((a, b) => a.x - b.x || a.y - b.y);
    const used = new Set(), state = new Map();
    for (const t of pool) {
        if (used.has(t)) continue;
        const el = t.attackModeElement;
        const sq = [t, getTile(t.x + 1, t.y), getTile(t.x, t.y + 1), getTile(t.x + 1, t.y + 1)];
        if (!sq.every(p => _formPylonOk(p, el) && !used.has(p))) continue;
        sq.forEach(p => used.add(p));
        const key = t.x + "," + t.y, kind = FORM_KINDS[el], old = _formState.get(key);
        const s = old || { glow: 0, size: 0 };
        state.set(key, s);
        t._wform = { kind, el, tiles: sq, front: sq[3], col: t.attackModeColor || "#9933ff", s,
                     wx: t.x + 1, wy: t.y + 1, x0: t.x, y0: t.y, caught: [] };
        for (const p of sq) if (p !== t) p._wformOf = t;
        _formations.push(t);
        if (!old && typeof floatingTexts !== "undefined") {
            floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, color: t._wform.col, life: 130, vy: -0.2, size: 14,
                                 text: "◆ BLACK HOLE FORMED" });
        }
    }
    _formState = state;
    return _formations.length;
}

function formationActive(F) { return F.tiles.every(p => p.powered !== false); }
function _formDamage(F, base, a) {
    const tier = typeof networkStrength !== "undefined" ? (networkStrength[F.el] || 0) : 0;
    return base * (1 + FORM_TIER_BONUS * tier) + FORM_MAXHP_SHARE * (a.maxHealth || 0);
}
// Once a frame from the game loop.
function formationTick() {
    if (!_formations.length) return;
    const hit = typeof frame !== "undefined" && frame % FORM_TICK === 0;
    for (const t of _formations) {
        const F = t._wform; if (!F) continue;
        F.caught = [];
        if (!formationActive(F)) { F.s.glow *= 0.9; continue; }
        const src = { x: F.wx, y: F.wy, team: "green", element: F.el };
        for (const a of actors) {
            if (!isHostileTarget(a)) continue;
            const dx = F.wx - a.x, dy = F.wy - a.y, d = Math.hypot(dx, dy);
            if (d > BH_RADIUS) continue;
            F.caught.push(a);
            // Standing in the vortex: drawn over it, not under (drawDepthOf).
            if (d < BH_ON_VORTEX) a._onVortex = frame;
            if (d > BH_CORE && !a.isMachine) {
                const step = Math.min(d - BH_CORE, BH_PULL * (0.4 + (1 - d / BH_RADIUS)));
                a.x += dx / d * step; a.y += dy / d * step;
            }
            if (typeof applySlow === "function" && !(a.slowed > 0 && a.slowFactor < BH_SLOW)) applySlow(a, 20, BH_SLOW);
            if (hit) applyDamage(a, _formDamage(F, BH_DMG, a), src, "flux");
        }
        F.s.glow += (Math.min(1, F.caught.length / 3) - F.s.glow) * 0.08;
    }
}

// ── DRAWING ───────────────────────────────────────────────
// Drawn from the square's front tile, after its floor and before its pylon
// (the pylon pass in game.js), so it lies ON the floor: under the pylons and
// the units, and an enemy standing in it is drawn over it.
function _formRgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
// The colour `t` of the way from hex to the bottom of the pit.
function _formMix(hex, t) {
    const n = parseInt(hex.slice(1), 16), k = 1 - t;
    const r = Math.round((n >> 16 & 255) * k + 5 * t), g = Math.round((n >> 8 & 255) * k + 2 * t), b = Math.round((n & 255) * k + 10 * t);
    return `rgb(${r},${g},${b})`;
}

// A funnel sunk into the floor: terraced bands stepping down and in, each
// lit along its far edge, darker the deeper they go; spiral arms and specks
// turning down into a black pit; a lit rim with a white catch-light. It
// turns faster, glows brighter and opens wider the more it holds, and ties
// each enemy it holds to the pit with a dashed tether.
function drawBlackHoleVortex(F, cx, cy) {
    const f = typeof frame !== "undefined" ? frame : 0, g = F.s.glow, col = F.col, on = formationActive(F);
    const R = 50 + 6 * g, D = 26, N = 9, spin = f * (on ? 0.02 + 0.06 * g : 0.004);
    const ringAt = t => ({ rx: R * Math.pow(1 - t, 0.85), y: cy + D * Math.pow(t, 1.4) });
    ctx.save();
    if (g > 0.02) {
        ctx.strokeStyle = _formRgba(col, 0.3 * g); ctx.lineWidth = 5;
        ctx.beginPath(); ctx.ellipse(cx, cy, R + 7, (R + 7) * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.5, 0, 0, Math.PI * 2); ctx.clip();
    ctx.fillStyle = "#06030c"; ctx.fillRect(cx - R, cy - R * 0.5, R * 2, R + D);
    // The terraces.
    for (let k = 0; k < N; k++) {
        const t = k / N, { rx, y } = ringAt(t);
        ctx.fillStyle = _formMix(col, Math.min(1, 0.45 + t * 0.6 - (on ? 0.25 * g * (1 - t) : 0)));
        ctx.beginPath(); ctx.ellipse(cx, y, rx, rx * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = _formRgba(col, (0.25 + 0.35 * g) * (1 - t) + 0.08); ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.ellipse(cx, y, rx, rx * 0.5, 0, Math.PI * 1.05, Math.PI * 1.95); ctx.stroke();
    }
    // Spiral arms.
    ctx.lineCap = "round";
    for (let arm = 0; arm < 4; arm++) {
        ctx.beginPath();
        for (let j = 0; j <= 22; j++) {
            const t = j / 22 * 0.92, { rx, y } = ringAt(t), a = spin + arm * Math.PI / 2 + t * 5.5;
            const x = cx + Math.cos(a) * rx * 0.97, yy = y + Math.sin(a) * rx * 0.485;
            j ? ctx.lineTo(x, yy) : ctx.moveTo(x, yy);
        }
        ctx.strokeStyle = _formRgba(col, on ? 0.3 + 0.55 * g : 0.15); ctx.lineWidth = 1.8 + 1.2 * g; ctx.stroke();
    }
    // Specks being drawn down and in.
    for (let i = 0; i < 12; i++) {
        const t = (f * 0.006 * (1 + 2 * g) + i / 12) % 1, { rx, y } = ringAt(t), a = spin * 1.4 + i * 2.4 + t * 6;
        ctx.fillStyle = i % 3 ? _formRgba(col, 0.9 * (1 - t)) : `rgba(255,255,255,${0.8 * (1 - t)})`;
        ctx.fillRect(cx + Math.cos(a) * rx - 1, y + Math.sin(a) * rx * 0.5 - 1, 2.2 * (1 - t) + 0.6, 2.2 * (1 - t) + 0.6);
    }
    // The pit.
    const pitY = cy + D * 0.95, pg = ctx.createRadialGradient(cx, pitY, 1, cx, pitY, R * 0.32);
    pg.addColorStop(0, "#000"); pg.addColorStop(0.55, "rgba(0,0,0,0.9)"); pg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(cx, pitY, R * 0.32, R * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // The rim: the near lip in shadow, the far edge lit, a catch-light.
    ctx.save();
    ctx.strokeStyle = "rgba(0,0,0,0.55)"; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.ellipse(cx, cy + 1.5, R, R * 0.5, 0, 0.05, Math.PI - 0.05); ctx.stroke();
    ctx.strokeStyle = _formRgba(col, on ? 0.6 + 0.4 * g : 0.3); ctx.lineWidth = 2.2;
    ctx.beginPath(); ctx.ellipse(cx, cy, R, R * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255," + (0.3 + 0.4 * g) + ")"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(cx, cy - 0.5, R - 2, (R - 2) * 0.5, 0, Math.PI * 1.15, Math.PI * 1.6); ctx.stroke();
    // Tethers from what it holds down to the pit.
    if (F.caught.length) {
        ctx.setLineDash([4, 5]); ctx.lineDashOffset = f % 9;
        ctx.strokeStyle = _formRgba(col, 0.55); ctx.lineWidth = 1.5;
        for (const a of F.caught) {
            const ax = (a.x - player.visualX - (a.y - player.visualY)) * TILE_W + canvas.width / 2;
            const ay = (a.x - player.visualX + (a.y - player.visualY)) * TILE_H + canvas.height / 2;
            ctx.beginPath(); ctx.moveTo(ax, ay - 14); ctx.lineTo(cx, pitY); ctx.stroke();
        }
        ctx.setLineDash([]);
    }
    if (!on) {
        ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(200,200,210,0.8)";
        ctx.fillText("BLACK HOLE · NEEDS POWER", cx, cy - R * 0.5 - 8);
    }
    ctx.restore();
}
