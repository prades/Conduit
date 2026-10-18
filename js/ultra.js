// ─────────────────────────────────────────────────────────
//  THE ULTRA TURRET — four turrets in a square become one
//
//  REPORTED: "When you build 4 turrets next to each other it should
//  automatically fuse into an Ultra turret. That takes up 4 tiles. And sprites
//  have to move around it."
//
//   - FUSING is derived, not stored: every cache rebuild (rebuildUltras, from
//     the 60-frame block in game.js) finds each 2x2 square of your finished
//     attack turrets and makes it one Ultra. Lose any of the four — destroyed,
//     demolished, taken, switched to a wave pylon — and the rest are four
//     ordinary turrets again at the next rebuild. Nothing new is saved: a
//     reload rebuilds the same squares.
//   - The ANCHOR (the square's top-left turret) fires for all four, from the
//     square's centre: every round is the four turrets' rounds together times
//     ULTRA_DAMAGE_BONUS, reaches ULTRA_RANGE_BONUS tiles further, and bursts
//     on the target for ULTRA_SPLASH_SHARE of it to everything within
//     ULTRA_SPLASH tiles. The other three stop firing and drawing.
//   - COMPACT (REPORTED: "make the ultra pylons a little smaller and more
//     compact, and let the followers move freely in between them"): it is
//     drawn at ULTRA_SCALE on the middle of its square, and your squad, your
//     clones and you walk straight through and between them. Only predators
//     are kept off its core (ULTRA_CORE_R round the centre, ultraBlockTick).
// ─────────────────────────────────────────────────────────

const ULTRA_DAMAGE_BONUS  = 1.5;    // × the four turrets' rounds added together
const ULTRA_RANGE_BONUS   = 2;      // tiles past a single turret's reach
const ULTRA_SPLASH        = 1.2;    // tiles round the target the round bursts over
const ULTRA_SPLASH_SHARE  = 0.5;    // of the round, to each one caught in the burst
const ULTRA_SCALE         = 0.55;   // drawn this size on its square (was the whole 2x2)
const ULTRA_MUZZLE_Z      = 50;     // px above the floor its bolt leaves from (the Tesla crown, scaled)
const ULTRA_CORE_R        = 0.6;    // tiles round its centre a predator cannot stand in

let _ultras = [];                   // anchors, rebuilt with the caches
let _ultraPending = [];             // squares that would fuse but for the tier: { x0, y0, el, tier, col }
let _ultraKeys = new Set();         // to tell a NEW fusion (announced) from one that stands
let _ultraBorn = new Map();         // square key → the frame it fused, for the rise

function _ultraTurretOk(t) {
    return !!t && t.pillar && !t.destroyed && t.health > 0 && t.attackMode && !t.waveMode
        && t.pillarTeam === "green" && !t.constructing && !(typeof isRelayPylon === "function" && isRelayPylon(t));
}

// Once per cache rebuild. Squares are claimed left to right, top to bottom,
// so a 2x3 block of six makes one Ultra and leaves two ordinary turrets.
function rebuildUltras() {
    for (const t of _ultras) { if (t._ultra) for (const p of t._ultra.tiles) p._ultraOf = null; t._ultra = null; }
    for (const t of world) if (t._ultraOf || t._ultra) { t._ultraOf = null; t._ultra = null; }
    _ultras = []; _ultraPending = [];
    const cands = (typeof _pillarCache !== "undefined" ? _pillarCache : world).filter(_ultraTurretOk)
        .sort((a, b) => a.x - b.x || a.y - b.y);
    const used = new Set(), keys = new Set();
    for (const t of cands) {
        if (used.has(t)) continue;
        const sq = [t, getTile(t.x + 1, t.y), getTile(t.x, t.y + 1), getTile(t.x + 1, t.y + 1)];
        if (!sq.every(p => _ultraTurretOk(p) && !used.has(p))) continue;
        sq.forEach(p => used.add(p));
        // Its element: the one most of the four carry (the anchor's on a tie).
        const count = {};
        for (const p of sq) { const e = p.attackModeElement || "core"; count[e] = (count[e] || 0) + 1; }
        let el = t.attackModeElement || "core";
        for (const e in count) if (count[e] > count[el]) el = e;
        const colourOf = sq.find(p => (p.attackModeElement || "core") === el) || t;
        // Only on a tier II network (ULTRA_MIN_TIER), at this square: below it
        // the four stay four ordinary turrets, and the square says what it needs.
        const tier = typeof networkTierAt === "function" ? networkTierAt(el, t.x + 0.5, t.y + 0.5) : 3;
        if (tier < ULTRA_MIN_TIER) { _ultraPending.push({ x0: t.x, y0: t.y, el, tier, col: colourOf.attackModeColor || "#0f8" }); continue; }
        t._ultra = { tiles: sq, front: sq[3], el, col: colourOf.attackModeColor || "#0f8",
                     cx: t.x + 0.5, cy: t.y + 0.5, x0: t.x, y0: t.y };
        for (const p of sq) if (p !== t) p._ultraOf = t;
        _ultras.push(t);
        const key = t.x + "," + t.y;
        keys.add(key);
        if (!_ultraKeys.has(key)) _ultraBorn.set(key, typeof frame !== "undefined" ? frame : 0);
        t._ultra.bornAt = _ultraBorn.get(key);
        if (!_ultraKeys.has(key) && typeof floatingTexts !== "undefined") {
            floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, color: t._ultra.col, life: 130, vy: -0.2, size: 14,
                                 text: "◆ ULTRA TURRET FUSED · " + el.toUpperCase() });
            for (const p of sq) elementEffects.push({ type: "impact", x: p.x + 0.5, y: p.y + 0.5, color: t._ultra.col, radius: 0.7, life: 26 });
            if (typeof shake !== "undefined") shake = Math.max(shake || 0, 5);
        }
    }
    _ultraKeys = keys;
    for (const k of [..._ultraBorn.keys()]) if (!keys.has(k)) _ultraBorn.delete(k);
    return _ultras.length;
}

function ultraHealth(t) {
    const U = t._ultra; if (!U) return [t.health, t.maxHealth];
    let h = 0, m = 0; for (const p of U.tiles) { h += Math.max(0, p.health || 0); m += p.maxHealth || 0; }
    return [h, m];
}
function ultraRange(t) { return (t.attackRange || TURRET_RANGE) + ULTRA_RANGE_BONUS; }
// One Ultra round: the four turrets' rounds together, times the bonus.
function ultraRoundDamage(t, target) {
    let d = 0;
    for (const p of t._ultra.tiles) d += turretRoundDamage(p, target);
    return d * ULTRA_DAMAGE_BONUS;
}
// The burst where an Ultra round lands (turretShotsTick).
function ultraSplash(s, hit) {
    if (!(s.splash > 0)) return 0;
    let n = 0;
    for (const a of actors) {
        if (a === hit || !isHostileTarget(a)) continue;
        if (Math.hypot(a.x - hit.x, a.y - hit.y) > s.splash) continue;
        applyDamage(a, s.dmg * ULTRA_SPLASH_SHARE, s.src, s.el); n++;
    }
    elementEffects.push({ type: "impact", x: hit.x, y: hit.y, color: s.col, radius: s.splash * 0.8, life: 18, element: s.el });
    return n;
}

// ── ITS CORE ──────────────────────────────────────────────
// Your followers, clones and you pass through freely. A predator inside the
// core is put back out at its edge, straight away from the centre.
function ultraBlockTick() {
    if (!_ultras.length) return;
    for (const t of _ultras) {
        const U = t._ultra; if (!U) continue;
        for (const a of unitsNear(U.cx, 2)) {
            if (a.dead || !(typeof Predator !== "undefined" && a instanceof Predator) || a.isClone || a.team === "green") continue;
            let dx = a.x - U.cx, dy = a.y - U.cy;
            const d = Math.hypot(dx, dy);
            if (d >= ULTRA_CORE_R) continue;
            if (d < 1e-4) { dx = 1; dy = 0; } else { dx /= d; dy /= d; }
            a.x = U.cx + dx * ULTRA_CORE_R; a.y = U.cy + dy * ULTRA_CORE_R;
        }
    }
}

// ── DRAWING ───────────────────────────────────────────────
// THE TESLA ARRAY (picked from a lineup of eight futuristic designs, U5;
// "that design sucks, just make it look futuristic" retired the stone keep):
// a dark metal plate over the four tiles with a lit trim ring, a coil tower
// in the middle crowned with a ring, a rod at each corner (the four turrets it
// was), and live arcs jumping from the crown to the rods — more of them as it
// charges. Its round leaves from the crown, toward the target.
const ULTRA_METAL = { top: "#3f3a2e", left: "#1b1913", right: "#27241c", edge: "#7a6a40", chrome: "#cdbb8a", dark: "#100e0a" };   // amber old-tech (js/labwall.js)
const ULTRA_CROWN_Z = 90;           // px from the floor to the crown ring
function _ultraRgba(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16 & 255},${n >> 8 & 255},${n & 255},${a})`; }
// A ground polygon extruded up by h: the faces toward you, then the top.
function _ultraPrism(c, cx, cy, pts, h, top) {
    const M = ULTRA_METAL, P = pts.map(([x, y]) => [cx + x, cy + y]), sides = [];
    for (let i = 0; i < P.length; i++) {
        const a = P[i], b = P[(i + 1) % P.length];
        const nx = b[1] - a[1], ny = -(b[0] - a[0]);
        const out = nx * ((a[0] + b[0]) / 2 - cx) + ny * ((a[1] + b[1]) / 2 - cy) > 0 ? 1 : -1;
        if (ny * out <= 0) continue;
        sides.push({ a, b, my: (a[1] + b[1]) / 2, left: (a[0] + b[0]) / 2 < cx });
    }
    sides.sort((p, q) => p.my - q.my);
    for (const s of sides) {
        c.fillStyle = s.left ? M.left : M.right;
        c.beginPath(); c.moveTo(s.a[0], s.a[1]); c.lineTo(s.b[0], s.b[1]); c.lineTo(s.b[0], s.b[1] - h); c.lineTo(s.a[0], s.a[1] - h); c.closePath(); c.fill();
    }
    c.fillStyle = top || M.top;
    c.beginPath(); P.forEach(([x, y], i) => i ? c.lineTo(x, y - h) : c.moveTo(x, y - h)); c.closePath(); c.fill();
    c.strokeStyle = M.edge; c.lineWidth = 1; c.stroke();
}
function _ultraNgon(n, rx, rot) { const o = []; for (let i = 0; i < n; i++) { const a = rot + i / n * Math.PI * 2; o.push([Math.cos(a) * rx, Math.sin(a) * rx * 0.5]); } return o; }
function _ultraDot(c, x, y, r, col) {
    c.fillStyle = _ultraRgba(col, 0.18); c.beginPath(); c.arc(x, y, r * 2.3, 0, Math.PI * 2); c.fill();
    c.fillStyle = col; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fff"; c.beginPath(); c.arc(x - r * 0.25, y - r * 0.25, r * 0.4, 0, Math.PI * 2); c.fill();
}

// (cx, cy): the screen point of the square's centre on the floor.
// It RISES out of the four turrets it fused from (FORM_RISE frames).
function drawUltraTurret(t, cx, cy) {
    const U = t._ultra; if (!U) return;
    const _rise = U.bornAt === undefined ? 1 : Math.min(1, ((typeof frame !== "undefined" ? frame : 0) - U.bornAt) / 40);
    if (_rise < 1) { ctx.save(); ctx.translate(cx, cy); ctx.scale(0.6 + 0.4 * _rise, Math.max(0.05, _rise)); ctx.translate(-cx, -cy); _drawUltraBody(t, cx, cy); ctx.restore(); return; }
    _drawUltraBody(t, cx, cy);
}
function _drawUltraBody(t, cx, cy) {
    const U = t._ultra; if (!U) return;
    const M = ULTRA_METAL, col = U.col, f = typeof frame !== "undefined" ? frame : 0;
    const pulse = 0.5 + 0.5 * Math.sin(f * 0.07 + U.x0);
    const ready = Math.min(1, (t.attackFireTimer || 0) / Math.max(1, TURRET_FIRE_FRAMES));
    const recoil = t._lastShotFrame !== undefined ? Math.max(0, 1 - (f - t._lastShotFrame) / 14) : 0;
    const c = ctx;
    c.save();
    // Range, only while you build or hold it.
    if ((typeof buildMode !== "undefined" && buildMode) || (typeof commandMode !== "undefined" && commandMode && commandTarget && (commandTarget === t || commandTarget._ultraOf === t))) {
        const rr = ultraRange(t) * TILE_W;
        c.globalAlpha = 0.3; c.strokeStyle = col; c.lineWidth = 1.2; c.setLineDash([3, 5]);
        c.beginPath(); c.ellipse(cx, cy, rr, rr * 0.5, 0, 0, Math.PI * 2); c.stroke();
        c.setLineDash([]); c.globalAlpha = 1;
    }
    // Everything below is the full-size array, drawn at ULTRA_SCALE round its centre.
    c.translate(cx, cy); c.scale(ULTRA_SCALE, ULTRA_SCALE); c.translate(-cx, -cy);
    // The plate, its trim ring and front lights.
    const PZ = 12, top = cy - PZ;
    _ultraPrism(c, cx, cy, _ultraNgon(8, 100, Math.PI / 8), PZ);
    c.strokeStyle = _ultraRgba(col, 0.35 + 0.3 * pulse); c.lineWidth = 1.6;
    c.beginPath(); c.ellipse(cx, top, 84, 42, 0, 0, Math.PI * 2); c.stroke();
    c.fillStyle = _ultraRgba(col, 0.7);
    for (let i = -3; i <= 3; i++) if (i) c.fillRect(cx + i * 13 - 2, cy + 46 - Math.abs(i) * 6.5 - PZ / 2 - 1, 4, 2);
    // Rods at the corners — the four turrets it was. The back two first.
    const ring = cy - ULTRA_CROWN_Z;
    const rods = _ultraNgon(4, 70, Math.PI / 4).map(([x, y]) => [cx + x, top + y]);
    const rod = ([x, y]) => { _ultraPrism(c, x, y, _ultraNgon(4, 6, Math.PI / 4), 34); _ultraDot(c, x, y - 38, 3.5, col); };
    rods.filter(p => p[1] <= top).forEach(rod);
    // The column, banded with copper coil.
    c.fillStyle = M.right; c.fillRect(cx - 10, ring + 6, 20, top - ring - 6);
    c.fillStyle = M.left; c.fillRect(cx - 10, ring + 6, 10, top - ring - 6);
    for (let k = 0; k < 6; k++) {
        c.strokeStyle = k % 2 ? "#b87333" : "#d08a45"; c.lineWidth = 3;
        c.beginPath(); c.ellipse(cx, ring + 14 + k * 10, 11, 4, 0, 0, Math.PI); c.stroke();
    }
    // The arcs: jagged, redrawn every few frames, more of them as it charges.
    const seed = Math.floor(f / 4) + U.x0 * 7;
    const rnd = n => { const x = Math.sin(n * 91.7 + seed * 13.1) * 43758.5; return x - Math.floor(x); };
    c.strokeStyle = col; c.lineWidth = 1.4; c.lineCap = "round";
    rods.forEach(([x, y], i) => {
        if (rnd(i) > 0.55 + 0.4 * (1 - ready) && recoil <= 0) return;
        c.beginPath(); c.moveTo(cx, ring);
        for (let k = 1; k <= 6; k++) {
            const q = k / 6, j = k < 6;
            c.lineTo(cx + (x - cx) * q + (j ? (rnd(i * 9 + k) - 0.5) * 14 : 0), ring + (y - 38 - ring) * q + (j ? (rnd(i * 7 + k) - 0.5) * 10 : 0));
        }
        c.stroke();
    });
    // The crown ring.
    c.strokeStyle = M.dark; c.lineWidth = 9; c.beginPath(); c.ellipse(cx, ring, 26, 11, 0, 0, Math.PI * 2); c.stroke();
    c.strokeStyle = M.chrome; c.lineWidth = 2; c.beginPath(); c.ellipse(cx, ring - 2, 26, 11, 0, Math.PI, Math.PI * 2); c.stroke();
    c.strokeStyle = _ultraRgba(col, 0.6 + 0.4 * Math.max(ready, recoil)); c.lineWidth = 2.5; c.beginPath(); c.ellipse(cx, ring, 26, 11, 0, 0, Math.PI * 2); c.stroke();
    // Where its round leaves the crown: the side facing its target.
    const tg = t._ultraTarget && !t._ultraTarget.dead ? t._ultraTarget : null;
    if (tg) {
        const dx = tg.x - U.cx, dy = tg.y - U.cy, a = Math.atan2((dx + dy) * TILE_H, (dx - dy) * TILE_W);
        if (ready > 0.6 || recoil > 0) _ultraDot(c, cx + Math.cos(a) * 26, ring + Math.sin(a) * 11, 2 + 4 * Math.max(ready, recoil), col);
    }
    rods.filter(p => p[1] > top).forEach(rod);
    c.restore();
    // Combined health and the name, over its (scaled) crown.
    const crownY = cy - ULTRA_CROWN_Z * ULTRA_SCALE;
    const [h, m] = ultraHealth(t);
    if (typeof drawHealthBar === "function") drawHealthBar(cx - 24, crownY - 22, 48, 5, h, m);
    c.save(); c.setTransform(1, 0, 0, 1, 0, 0);
    const tier = typeof networkTierAt === "function" ? networkTierAt(U.el, U.cx, U.cy) : 0;
    const label = "ULTRA · " + U.el.toUpperCase() + (tier > 0 ? [" T-I", " T-II", " T-III"][tier - 1] : "");
    if (typeof cachedText === "function") cachedText(label, "bold 10px monospace", col, cx, crownY - 28);
    else { c.fillStyle = col; c.font = "bold 10px monospace"; c.textAlign = "center"; c.fillText(label, cx, crownY - 28); }
    c.restore();
}

// A square of four turrets short of tier II: a dashed outline round it and a
// line saying what it needs, drawn over the world (the pass in game.js).
function drawUltraHints() {
    if (!_ultraPending.length) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const h of _ultraPending) {
        const sx = (h.x0 + 1 - player.visualX - (h.y0 + 1 - player.visualY)) * TILE_W + canvas.width / 2;
        const sy = (h.x0 + 1 - player.visualX + (h.y0 + 1 - player.visualY)) * TILE_H + canvas.height / 2;
        if (sx < -150 || sx > canvas.width + 150 || sy < -150 || sy > canvas.height + 150) continue;
        ctx.strokeStyle = h.col; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.5; ctx.setLineDash([5, 5]);
        ctx.beginPath(); ctx.moveTo(sx, sy - 2 * TILE_H); ctx.lineTo(sx + 2 * TILE_W, sy); ctx.lineTo(sx, sy + 2 * TILE_H); ctx.lineTo(sx - 2 * TILE_W, sy); ctx.closePath(); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
        // Under the square's front corner, on a dark plate, clear of the turrets' own labels.
        const msg = "ULTRA \u00b7 NEEDS " + h.el.toUpperCase() + " TIER II" + (h.tier ? " (HERE T-" + ["", "I"][h.tier] + ")" : "");
        ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        const w = ctx.measureText(msg).width + 12, ty = sy + 2 * TILE_H + 14;
        ctx.fillStyle = "rgba(5,8,14,0.82)"; ctx.fillRect(sx - w / 2, ty - 9, w, 18);
        ctx.fillStyle = h.col; ctx.fillText(msg, sx, ty);
    }
    ctx.restore();
}
