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
//   - It is SOLID (ultraBlockTick): nothing stands on its four tiles — your
//     squad, predators and you are pushed off and slide round it.
// ─────────────────────────────────────────────────────────

const ULTRA_DAMAGE_BONUS  = 1.5;    // × the four turrets' rounds added together
const ULTRA_RANGE_BONUS   = 2;      // tiles past a single turret's reach
const ULTRA_SPLASH        = 1.2;    // tiles round the target the round bursts over
const ULTRA_SPLASH_SHARE  = 0.5;    // of the round, to each one caught in the burst
const ULTRA_MUZZLE_Z      = 96;     // px above the floor its bolt leaves from
const ULTRA_SLIDE         = 0.06;   // how fast a blocked unit slides along a face

let _ultras = [];                   // anchors, rebuilt with the caches
let _ultraKeys = new Set();         // to tell a NEW fusion (announced) from one that stands

function _ultraTurretOk(t) {
    return !!t && t.pillar && !t.destroyed && t.health > 0 && t.attackMode && !t.waveMode
        && t.pillarTeam === "green" && !t.constructing && !(typeof isRelayPylon === "function" && isRelayPylon(t));
}

// Once per cache rebuild. Squares are claimed left to right, top to bottom,
// so a 2x3 block of six makes one Ultra and leaves two ordinary turrets.
function rebuildUltras() {
    for (const t of _ultras) { if (t._ultra) for (const p of t._ultra.tiles) p._ultraOf = null; t._ultra = null; }
    for (const t of world) if (t._ultraOf || t._ultra) { t._ultraOf = null; t._ultra = null; }
    _ultras = [];
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
        t._ultra = { tiles: sq, front: sq[3], el, col: colourOf.attackModeColor || "#0f8",
                     cx: t.x + 0.5, cy: t.y + 0.5, x0: t.x, y0: t.y };
        for (const p of sq) if (p !== t) p._ultraOf = t;
        _ultras.push(t);
        const key = t.x + "," + t.y;
        keys.add(key);
        if (!_ultraKeys.has(key) && typeof floatingTexts !== "undefined") {
            floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, color: t._ultra.col, life: 130, vy: -0.2, size: 14,
                                 text: "◆ ULTRA TURRET FUSED · " + el.toUpperCase() });
            for (const p of sq) elementEffects.push({ type: "impact", x: p.x + 0.5, y: p.y + 0.5, color: t._ultra.col, radius: 0.7, life: 26 });
            if (typeof shake !== "undefined") shake = Math.max(shake || 0, 5);
        }
    }
    _ultraKeys = keys;
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

// ── SOLID ─────────────────────────────────────────────────
// A unit inside a square is put back out at the nearest face it can stand
// beyond (one that is still on the floor). Stopped at a side face, it also
// slides along it toward the nearer open end, so it walks round instead of
// pressing against the wall forever. The player gets a detour: their walk
// target is moved to that open lane until they are past, then put back.
function _ultraPushOut(a, U, isPlayer) {
    const m = 0.04, x0 = U.x0, x1 = U.x0 + 2, y0 = U.y0, y1 = U.y0 + 2;
    if (a.x <= x0 || a.x >= x1 || a.y <= y0 || a.y >= y1) return false;
    const yMax = isPlayer ? FLOOR_Y_MAX - 0.5 : 3;
    const opts = [["L", a.x - x0], ["R", x1 - a.x]];
    if (y0 - m >= 0) opts.push(["T", a.y - y0]);
    if (y1 + m <= yMax) opts.push(["B", y1 - a.y]);
    opts.sort((p, q) => p[1] - q[1]);
    const side = opts[0][0];
    if (side === "L") a.x = x0 - m; else if (side === "R") a.x = x1 + m;
    else if (side === "T") a.y = y0 - m; else a.y = y1 + m;
    if (side === "L" || side === "R") {
        // Slide toward the open end nearer to it.
        const up = y0 - m >= 0, down = y1 + m <= yMax;
        const goUp = up && (!down || (a.y - y0) < (y1 - a.y));
        a.y += (goUp ? -1 : 1) * ULTRA_SLIDE;
        if (isPlayer) {
            const across = side === "L" ? player.targetX > x1 : player.targetX < x0;
            if (across && player._ultraTY === undefined) {
                player._ultraTY = player.targetY; player._ultraU = U;
                player.targetY = player._ultraLane = goUp ? y0 - 0.4 : y1 + 0.4;
            }
        }
    }
    return true;
}
function ultraBlockTick() {
    // The player's detour ends once they are past the square (or they have
    // tapped somewhere new, which replaces it).
    if (player._ultraTY !== undefined) {
        const U = player._ultraU;
        const retapped = player.targetY !== player._ultraLane;
        const past = !U || (player.targetX > U.x0 + 2 ? player.x > U.x0 + 2.05
                          : player.targetX < U.x0 ? player.x < U.x0 - 0.05 : true);
        if (retapped || past) {
            if (!retapped) player.targetY = player._ultraTY;
            player._ultraTY = undefined; player._ultraU = null; player._ultraLane = undefined;
        }
    }
    if (!_ultras.length) return;
    for (const t of _ultras) {
        const U = t._ultra; if (!U) continue;
        for (const a of actors) if (!a.dead) _ultraPushOut(a, U, false);
        _ultraPushOut(player, U, true);
    }
}

// ── DRAWING ───────────────────────────────────────────────
// The game's runic stone, at four tiles: a stone platform over the whole
// square with rune lines round its rim, a squat tower at each corner (the
// four turrets it was) with its element light, a central keep, and on the
// keep a heavy ballista — four stone prongs and a big glyph-bolt.
function _ultraBox(c, x, y, hw, hh, h, top, left, right, edge) {
    c.fillStyle = left;  c.beginPath(); c.moveTo(x - hw, y - h); c.lineTo(x, y + hh - h); c.lineTo(x, y + hh); c.lineTo(x - hw, y); c.closePath(); c.fill();
    c.fillStyle = right; c.beginPath(); c.moveTo(x + hw, y - h); c.lineTo(x, y + hh - h); c.lineTo(x, y + hh); c.lineTo(x + hw, y); c.closePath(); c.fill();
    c.fillStyle = top;   c.beginPath(); c.moveTo(x, y - hh - h); c.lineTo(x + hw, y - h); c.lineTo(x, y + hh - h); c.lineTo(x - hw, y - h); c.closePath(); c.fill();
    if (edge) {
        c.strokeStyle = edge; c.lineWidth = 1;
        c.beginPath(); c.moveTo(x - hw, y - h); c.lineTo(x, y + hh - h); c.lineTo(x + hw, y - h); c.moveTo(x, y + hh - h); c.lineTo(x, y + hh); c.stroke();
    }
}
const ULTRA_STONE = { top: "#3a4352", left: "#232a35", right: "#161b23", edge: "#4c5668" };

// (cx, cy): the screen point of the square's centre on the floor.
function drawUltraTurret(t, cx, cy) {
    const U = t._ultra; if (!U) return;
    const col = U.col, f = typeof frame !== "undefined" ? frame : 0;
    const pulse = 0.5 + 0.5 * Math.sin(f * 0.07 + U.x0);
    const S = ULTRA_STONE;
    ctx.save();
    // Range, only while you build or hold it.
    if ((typeof buildMode !== "undefined" && buildMode) || (typeof commandMode !== "undefined" && commandMode && commandTarget && (commandTarget === t || commandTarget._ultraOf === t))) {
        const rr = ultraRange(t) * TILE_W;
        ctx.globalAlpha = 0.3; ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.setLineDash([3, 5]);
        ctx.beginPath(); ctx.ellipse(cx, cy, rr, rr * 0.5, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.setLineDash([]); ctx.globalAlpha = 1;
    }
    // The platform over all four tiles, with rune lines round its rim.
    const PW = 104, PH = 52, PZ = 14;
    _ultraBox(ctx, cx, cy, PW, PH, PZ, S.top, S.left, S.right, S.edge);
    ctx.strokeStyle = col; ctx.globalAlpha = 0.35 + 0.35 * pulse; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx, cy - PH - PZ + 9); ctx.lineTo(cx + PW - 18, cy - PZ); ctx.lineTo(cx, cy + PH - PZ - 9); ctx.lineTo(cx - PW + 18, cy - PZ); ctx.closePath();
    ctx.stroke();
    // Rune ticks on the two front faces.
    ctx.lineWidth = 2;
    for (let i = 1; i < 6; i++) {
        const k = i / 6;
        const lx = cx - PW + PW * k, ly = cy + PH * k - PZ / 2;
        const rx = cx + PW * k, ry = cy + PH - PH * k - PZ / 2;
        ctx.beginPath(); ctx.moveTo(lx, ly - 3); ctx.lineTo(lx, ly + 3); ctx.moveTo(rx, ry - 3); ctx.lineTo(rx, ry + 3); ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // Corner towers — the four turrets it was. Back three first, then the
    // keep, then the front one, so the keep sits between them.
    const top = cy - PZ, CT = [[0, -PH * 0.62], [-PW * 0.62, 0], [PW * 0.62, 0], [0, PH * 0.62]];
    const tower = ([ox, oy]) => {
        const x = cx + ox, y = top + oy;
        _ultraBox(ctx, x, y, 13, 6.5, 30, S.top, S.left, S.right, S.edge);
        // Merlons.
        ctx.fillStyle = S.top;
        ctx.fillRect(x - 11, y - 36, 5, 5); ctx.fillRect(x + 6, y - 36, 5, 5); ctx.fillRect(x - 2.5, y - 39, 5, 5);
        ctx.fillStyle = col; ctx.globalAlpha = 0.2 + 0.15 * pulse;
        ctx.beginPath(); ctx.arc(x, y - 30, 7, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.arc(x, y - 30, 3, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 1;
        // A conduit from the tower in to the keep.
        ctx.strokeStyle = col; ctx.globalAlpha = 0.45; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x, y - 2); ctx.lineTo(cx + ox * 0.45, top + oy * 0.45 - 2); ctx.stroke();
        ctx.globalAlpha = 1;
    };
    CT.slice(0, 3).forEach(tower);
    // The keep.
    const KZ = 40;
    _ultraBox(ctx, cx, top, 34, 17, KZ, S.top, S.left, S.right, S.edge);
    // Slit windows lit in the element's colour.
    ctx.fillStyle = col; ctx.globalAlpha = 0.55 + 0.35 * pulse;
    ctx.fillRect(cx - 20, top - 26 + 5, 3, 10); ctx.fillRect(cx + 17, top - 26 + 5, 3, 10);
    ctx.globalAlpha = 1;
    // Battlements round the keep's top.
    ctx.fillStyle = S.top;
    for (const [mx, my] of [[-28, -3], [-14, -10], [0, -17], [14, -10], [28, -3], [-14, 4], [14, 4], [0, 11]])
        ctx.fillRect(cx + mx - 3, top - KZ + my - 6, 6, 6);
    CT.slice(3).forEach(tower);
    // The heavy ballista on the keep, turning to its target.
    const gx = cx, gy = top - KZ - 8;
    const tg = t._ultraTarget && !t._ultraTarget.dead ? t._ultraTarget : null;
    let want = t._uAng === undefined ? -Math.PI / 4 : t._uAng;
    if (tg) { const dx = tg.x - U.cx, dy = tg.y - U.cy; want = Math.atan2((dx + dy) * TILE_H, (dx - dy) * TILE_W); }
    else want += 0.01;
    if (t._uAng === undefined) t._uAng = want;
    let d = want - t._uAng; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2;
    t._uAng += tg ? d * 0.2 : d;
    const ux = Math.cos(t._uAng), uy = Math.sin(t._uAng);
    const recoil = t._lastShotFrame !== undefined ? Math.max(0, 6 - (f - t._lastShotFrame)) : 0;
    _ultraBox(ctx, gx, gy + 6, 14, 7, 9, S.top, S.left, S.right, S.edge);
    const len = 34 - recoil;
    ctx.lineCap = "round";
    for (const off of [-9, -3.5, 3.5, 9]) {
        const ox = -uy * off, oy = ux * off * 0.5;
        ctx.strokeStyle = S.top; ctx.lineWidth = 5;
        ctx.beginPath(); ctx.moveTo(gx + ox, gy + oy); ctx.lineTo(gx + ox + ux * len, gy + oy + uy * len); ctx.stroke();
        ctx.strokeStyle = S.right; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(gx + ox, gy + oy + 2); ctx.lineTo(gx + ox + ux * len, gy + oy + uy * len + 2); ctx.stroke();
    }
    // The glyph-bolt laid between the prongs.
    const bx = gx + ux * (len * 0.55), by = gy + uy * (len * 0.55);
    ctx.fillStyle = col; ctx.globalAlpha = 0.22 + 0.2 * pulse;
    ctx.beginPath(); ctx.arc(bx, by, 13, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1; ctx.strokeStyle = col; ctx.lineWidth = 3.5;
    ctx.beginPath(); ctx.moveTo(gx + ux * 6, gy + uy * 6); ctx.lineTo(gx + ux * (len + 6), gy + uy * (len + 6)); ctx.stroke();
    ctx.strokeStyle = "#fff"; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(gx + ux * 10, gy + uy * 10); ctx.lineTo(gx + ux * (len + 2), gy + uy * (len + 2)); ctx.stroke();
    ctx.restore();
    // Combined health and the name.
    const [h, m] = ultraHealth(t);
    if (typeof drawHealthBar === "function") drawHealthBar(cx - 30, gy - 34, 60, 5, h, m);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const tier = typeof networkStrength !== "undefined" ? (networkStrength[U.el] || 0) : 0;
    const label = "ULTRA · " + U.el.toUpperCase() + (tier > 0 ? [" T-I", " T-II", " T-III"][tier - 1] : "");
    if (typeof cachedText === "function") cachedText(label, "bold 10px monospace", col, cx, gy - 40);
    else { ctx.fillStyle = col; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.fillText(label, cx, gy - 40); }
    ctx.restore();
}
