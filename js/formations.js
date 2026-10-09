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
//     FLUX and FIRE squares form anything. Nothing is saved; break the square
//     and it is gone, rebuild it and it is back. The four pylons keep doing
//     what wave pylons do.
//   - BLACK HOLE (flux): a hole hangs where the four meet; the pylons go
//     see-through. Every enemy within BH_RADIUS is ENTANGLED — dragged in,
//     slowed, and crushed a little each half second — and the hole lights up
//     with how many it holds.
//   - FIRE WALL (fire): a short wall of flame across the square, across the
//     tunnel. Enemies in it burn every half second; while any are in it, it
//     grows longer (to the whole tunnel) and taller and burns harder; empty,
//     it dies back down.
//   - Only while all four are powered: a dark square forms nothing.
// ─────────────────────────────────────────────────────────

const FORM_KINDS = { flux: "blackhole", fire: "firewall" };
const FORM_TICK        = 30;     // frames between damage ticks
const FORM_TIER_BONUS  = 0.25;   // + damage per network tier
const BH_RADIUS        = 2.5;    // tiles: what it entangles
const BH_PULL          = 0.03;   // tiles a frame at the rim's edge, more nearer in
const BH_CORE          = 0.35;   // not pulled closer than this
const BH_DMG           = 6;      // per tick
const BH_SLOW          = 0.5;
const FW_LEN_MIN       = 1.6;    // tiles long when nothing is in it …
const FW_LEN_MAX       = 4;      // … up to the whole tunnel
const FW_THICK         = 0.7;    // tiles through
const FW_DMG           = 10;     // per tick, × (1 + its size)
const FW_GROW          = 0.02;   // size a frame while something burns in it
const FW_SHRINK        = 0.004;  // size a frame while it is empty
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
                                 text: kind === "blackhole" ? "◆ BLACK HOLE FORMED" : "◆ FIRE WALL FORMED" });
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
function fireWallLength(F) { return FW_LEN_MIN + (FW_LEN_MAX - FW_LEN_MIN) * F.s.size; }
function inFireWall(F, a) {
    const half = fireWallLength(F) / 2;
    return Math.abs(a.x - F.wx) < FW_THICK / 2 + 0.15 && Math.abs(a.y - F.wy) < half;
}

// Once a frame from the game loop.
function formationTick() {
    if (!_formations.length) return;
    const hit = typeof frame !== "undefined" && frame % FORM_TICK === 0;
    for (const t of _formations) {
        const F = t._wform; if (!F) continue;
        F.caught = [];
        if (!formationActive(F)) { F.s.glow *= 0.9; F.s.size = Math.max(0, F.s.size - FW_SHRINK); continue; }
        const src = { x: F.wx, y: F.wy, team: "green", element: F.el };
        if (F.kind === "blackhole") {
            for (const a of actors) {
                if (!isHostileTarget(a)) continue;
                const dx = F.wx - a.x, dy = F.wy - a.y, d = Math.hypot(dx, dy);
                if (d > BH_RADIUS) continue;
                F.caught.push(a);
                if (d > BH_CORE && !a.isMachine) {
                    const step = Math.min(d - BH_CORE, BH_PULL * (0.4 + (1 - d / BH_RADIUS)));
                    a.x += dx / d * step; a.y += dy / d * step;
                }
                if (typeof applySlow === "function" && !(a.slowed > 0 && a.slowFactor < BH_SLOW)) applySlow(a, 20, BH_SLOW);
                if (hit) applyDamage(a, _formDamage(F, BH_DMG, a), src, "flux");
            }
            F.s.glow += (Math.min(1, F.caught.length / 3) - F.s.glow) * 0.08;
        } else {
            for (const a of actors) if (isHostileTarget(a) && inFireWall(F, a)) F.caught.push(a);
            F.s.size = Math.max(0, Math.min(1, F.s.size + (F.caught.length ? FW_GROW : -FW_SHRINK)));
            if (hit) for (const a of F.caught) applyDamage(a, _formDamage(F, FW_DMG * (1 + F.s.size), a), src, "fire");
            F.s.glow += ((F.caught.length ? 1 : 0) - F.s.glow) * 0.08;
        }
    }
}

// ── DRAWING (screen space, after the world) ────────────────
function _formScr(x, y) {
    return [(x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2,
            (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2];
}
function _formRgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }

function drawFormations() {
    if (!_formations.length) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const t of _formations) {
        const F = t._wform; if (!F) continue;
        const [cx, cy] = _formScr(F.wx, F.wy);
        if (cx < -200 || cx > canvas.width + 200 || cy < -200 || cy > canvas.height + 200) continue;
        if (F.kind === "blackhole") drawBlackHole(F, cx, cy);
        else drawFireWall(F, cx, cy);
        // A square with a dark pylon forms nothing, and says why.
        if (!formationActive(F)) {
            ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(200,200,210,0.8)";
            ctx.fillText((F.kind === "blackhole" ? "BLACK HOLE" : "FIRE WALL") + " \u00b7 NEEDS POWER", cx, cy - 60);
        }
    }
    ctx.restore();
}

// A black core hanging over the floor, a photon ring round it, an accretion
// disk swirling past it (the back half behind the core, the front half in
// front), and a dark lensing pool on the floor. Brighter, wider and faster
// with every enemy it holds, each tied to it by a dashed tether.
function drawBlackHole(F, cx, cy) {
    const f = typeof frame !== "undefined" ? frame : 0, g = F.s.glow, col = F.col, on = formationActive(F);
    const hy = cy - 36, R = 14;
    ctx.fillStyle = "rgba(0,0,0,0.45)"; ctx.beginPath(); ctx.ellipse(cx, cy, 36, 18, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = _formRgba(col, 0.25 + 0.4 * g); ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.ellipse(cx, cy, 36 + 6 * g, 18 + 3 * g, 0, 0, Math.PI * 2); ctx.stroke();
    // Tethers to what it has caught.
    ctx.setLineDash([4, 5]); ctx.lineDashOffset = f % 9;
    for (const a of F.caught) {
        const [ax, ay] = _formScr(a.x, a.y);
        ctx.strokeStyle = _formRgba(col, 0.55); ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(ax, ay - 16); ctx.lineTo(cx, hy); ctx.stroke();
    }
    ctx.setLineDash([]);
    if (g > 0.02) {
        const h = ctx.createRadialGradient(cx, hy, R, cx, hy, 60);
        h.addColorStop(0, _formRgba(col, 0.35 * g)); h.addColorStop(1, _formRgba(col, 0));
        ctx.fillStyle = h; ctx.beginPath(); ctx.arc(cx, hy, 60, 0, Math.PI * 2); ctx.fill();
    }
    const DR = 28 + 10 * g, spin = f * (0.03 + 0.05 * g);
    const disk = (from, to) => {
        for (let k = 0; k < 9; k++) {
            const a0 = spin + k * Math.PI * 2 / 9, a1 = a0 + 0.45;
            let s = ((a0 % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
            if (s < from || s > to) continue;
            ctx.strokeStyle = k % 3 === 0 ? "rgba(255,255,255," + (0.35 + 0.5 * g) + ")" : _formRgba(col, (on ? 0.45 : 0.2) + 0.5 * g);
            ctx.lineWidth = 2 + 1.5 * g;
            ctx.beginPath(); ctx.ellipse(cx, hy, DR - (k % 3) * 4, (DR - (k % 3) * 4) * 0.28, -0.15, a0, a1); ctx.stroke();
        }
    };
    disk(Math.PI, Math.PI * 2);                    // behind the core
    ctx.strokeStyle = _formRgba(col, 0.5 + 0.5 * g); ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.arc(cx, hy, R + 2.5, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = "rgba(255,255,255," + (0.3 + 0.6 * g) + ")"; ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.arc(cx, hy, R + 1, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "#000"; ctx.beginPath(); ctx.arc(cx, hy, R, 0, Math.PI * 2); ctx.fill();
    disk(0, Math.PI);                               // in front of it
}

// A line of flame across the tunnel through the square's middle: tongues
// that flicker, a glowing seam on the floor, embers rising. Longer, taller
// and denser the more it has grown.
function drawFireWall(F, cx, cy) {
    const f = typeof frame !== "undefined" ? frame : 0, sz = F.s.size, on = formationActive(F);
    const half = fireWallLength(F) / 2;
    const y0 = Math.max(0, F.wy - half), y1 = Math.min(FLOOR_Y_MAX, F.wy + half);
    const [ax, ay] = _formScr(F.wx, y0), [bx, by] = _formScr(F.wx, y1);
    ctx.lineCap = "round";
    ctx.strokeStyle = on ? "rgba(255,120,30,0.55)" : "rgba(120,60,30,0.4)"; ctx.lineWidth = 7 + 4 * sz;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    ctx.strokeStyle = on ? "rgba(255,230,150,0.8)" : "rgba(160,110,70,0.5)"; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
    if (!on) return;
    const n = Math.round(6 + 10 * sz);
    for (let i = 0; i < n; i++) {
        const q = (i + 0.5) / n, x = ax + (bx - ax) * q, y = ay + (by - ay) * q;
        const fl = 0.65 + 0.35 * Math.sin(f * 0.3 + i * 2.1) * Math.sin(f * 0.17 + i);
        const h = (16 + 38 * sz) * fl, w = 7 + 3 * sz, sway = Math.sin(f * 0.12 + i) * 3;
        const g = ctx.createLinearGradient(x, y, x, y - h);
        g.addColorStop(0, "rgba(255,240,170,0.95)"); g.addColorStop(0.35, "rgba(255,150,30,0.9)"); g.addColorStop(1, "rgba(255,51,0,0)");
        ctx.fillStyle = g;
        ctx.beginPath(); ctx.moveTo(x - w, y);
        ctx.bezierCurveTo(x - w, y - h * 0.5, x + sway - 2, y - h * 0.7, x + sway, y - h);
        ctx.bezierCurveTo(x + sway + 2, y - h * 0.7, x + w, y - h * 0.5, x + w, y);
        ctx.closePath(); ctx.fill();
    }
    // Embers.
    ctx.fillStyle = "rgba(255,200,90,0.85)";
    for (let i = 0; i < 4 + 6 * sz; i++) {
        const along = (i * 0.618) % 1, up = (f * 0.02 + i * 0.29) % 1;
        ctx.fillRect(ax + (bx - ax) * along + Math.sin(f * 0.1 + i) * 4, ay + (by - ay) * along - up * (40 + 40 * sz), 2, 2);
    }
}
