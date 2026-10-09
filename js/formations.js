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
//     each 2x2 square of your finished wave pylons of the same element. FLUX
//     and FIRE squares form something; the rest form nothing. Nothing is saved; break the square
//     and it is gone, rebuild it and it is back. The four pylons keep doing
//     what wave pylons do.
//   - BLACK HOLE (flux): a vortex opens in the floor where the four meet —
//     "black hole vortex on the ground, 3D looking" — and the pylons go
//     see-through. Every enemy within BH_RADIUS is ENTANGLED — dragged in,
//     slowed, and crushed a little each half second — and the hole lights up
//     with how many it holds.
//   - SPINNING FIREWALL (fire): "how about the ultra turret for the fire wave
//     is a spinning firewall". Three standing walls of flame radiate from a
//     glowing core and turn, inside the square (a straight wall across the
//     tunnel was tried first and taken out: "it looks wonky"). Every enemy a
//     wall sweeps over burns; it spins faster and burns hotter with enemies
//     close. Kept inside its four tiles so it is drawn on the floor in depth
//     order like the vortex, never over the tiles in front of it.
//   - ICE GENERATOR (ice): "make an ice generator when 4 ice wave pylons are
//     put together and make an ice effect on the ground near them". A cluster
//     of ice crystals grows where the four meet and FROST spreads over the
//     floor round it (ICE_RADIUS). Enemies on the frost are slowed and
//     chilled; every ICE_PULSE frames it sends out a pulse that roots them
//     where they stand for a moment. The frost is painted by each floor tile
//     it covers (drawFrostOnTile, from the floor pass), so it lies under
//     pylons and units however far it reaches.
//   - TOXIC TOWER (toxic): "an ultra pylon for toxic that has exhaust and a
//     dark vibe ... a thick tower with multiple levels and glowing exhaust
//     coming from each layer ... boxy design." A squat four-level block
//     tower of dark metal rises where the four meet; every level has lit
//     grilles on its faces and vents glowing exhaust that cools to black
//     smoke. Its fumes haze the floor for TT_RADIUS round it (painted per tile,
//     like the frost): enemies in them are poisoned and their armour stripped;
//     your clones in them are mended. It runs hotter with enemies close.
//   - Only while all four are powered: a dark square forms nothing.
// ─────────────────────────────────────────────────────────

const FORM_KINDS = { flux: "blackhole", fire: "firespin", ice: "icegen", toxic: "toxtower" };
const FORM_TICK        = 30;     // frames between damage ticks
const FORM_TIER_BONUS  = 0.25;   // + damage per network tier
const BH_RADIUS        = 2.5;    // tiles: what it entangles
const BH_PULL          = 0.03;   // tiles a frame at the rim's edge, more nearer in
const BH_CORE          = 0.35;   // not pulled closer than this
const BH_DMG           = 6;      // per tick
const BH_SLOW          = 0.5;
const BH_ON_VORTEX     = 0.9;    // tiles: standing on the vortex itself
const FORM_MAXHP_SHARE = 0.01;   // + this much of the target's max HP a tick
const FS_ARMS          = 3;      // walls of flame
const FS_LEN           = 1.0;    // tiles from the core: inside the square
const FS_HALF          = 0.35;   // tiles either side of a wall that burn
const FS_SPIN          = 0.045;  // radians a frame …
const FS_SPIN_HOT      = 0.05;   // … plus this much more when it is hot
const FS_DMG           = 14;     // per sweep
const FS_HIT_EVERY     = 15;     // frames before the same enemy burns again
const FS_HEAT_REACH    = 2.2;    // tiles: enemies this close heat it up
const ICE_RADIUS       = 2.5;    // tiles of frost round the generator
const ICE_SLOW         = 0.45;   // speed on the frost
const ICE_DMG          = 4;      // chill, per tick
const ICE_PULSE        = 240;    // frames between root pulses
const ICE_ROOT         = 50;     // frames a pulse holds them
const ICE_ROOT_SLOW    = 0.05;
const TT_RADIUS        = 2.5;    // tiles of fumes round the toxic tower
const TT_DMG           = 10;     // poison per tick on an enemy in the fumes
const TT_SHRED         = 0.6;    // its armour while poisoned (×1/this damage taken)
const TT_HEAL          = 8;      // mend per tick on a clone in the fumes …
const TT_HEAL_SHARE    = 0.01;   // … plus this share of its max HP

let _formations = [];            // anchors
let _formState = new Map();      // "x,y" → { glow, size }, kept across rebuilds
let _frostTiles = new Map();     // "x,y" of a floor tile → the ice generator frosting it

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
        const s = old || { glow: 0, size: 0, spin: 0 };
        state.set(key, s);
        t._wform = { kind, el, tiles: sq, front: sq[3], col: t.attackModeColor || ({ blackhole: "#9933ff", firespin: "#ff3300", icegen: "#99ddff", toxtower: "#66ff66" })[kind], s,
                     wx: t.x + 1, wy: t.y + 1, x0: t.x, y0: t.y, caught: [] };
        for (const p of sq) if (p !== t) p._wformOf = t;
        _formations.push(t);
        if (!old && typeof floatingTexts !== "undefined") {
            floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 80, color: t._wform.col, life: 130, vy: -0.2, size: 14,
                                 text: "\u25c6 " + ({ blackhole: "BLACK HOLE", firespin: "SPINNING FIREWALL", icegen: "ICE GENERATOR", toxtower: "TOXIC TOWER" })[kind] + " FORMED" });
        }
    }
    _formState = state;
    // The floor tiles each ice generator frosts.
    _frostTiles = new Map();
    for (const t of _formations) {
        const F = t._wform; if (F.kind !== "icegen" && F.kind !== "toxtower") continue;
        const RAD = F.kind === "icegen" ? ICE_RADIUS : TT_RADIUS, R = Math.ceil(RAD) + 1;
        for (let x = F.x0 - R; x <= F.x0 + R + 1; x++) for (let y = F.y0 - R; y <= F.y0 + R + 1; y++) {
            const tile = getTile(x, y);
            if (!tile || tile.type !== "floor") continue;
            if (Math.hypot(x + 0.5 - F.wx, y + 0.5 - F.wy) < RAD + 0.75) _frostTiles.set(x + "," + y, F);
        }
    }
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
        if (F.kind === "firespin") { _fireSpinTick(F, src); continue; }
        if (F.kind === "icegen") { _iceGenTick(F, src, hit); continue; }
        if (F.kind === "toxtower") { _toxTowerTick(F, src, hit); continue; }
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

// The walls' angles now: evenly round, turning.
function fireSpinArms(F) { const o = []; for (let k = 0; k < FS_ARMS; k++) o.push(F.s.spin + k * Math.PI * 2 / FS_ARMS); return o; }
// Does a wall at angle `a` sweep over this point (world)?
function _fireSpinOn(F, a, x, y) {
    const dx = x - F.wx, dy = y - F.wy, ux = Math.cos(a), uy = Math.sin(a);
    const along = dx * ux + dy * uy;
    if (along < 0 || along > FS_LEN + FS_HALF) return false;
    return Math.abs(dx * uy - dy * ux) < FS_HALF;
}
function _fireSpinTick(F, src) {
    let near = 0;
    for (const a of actors) if (isHostileTarget(a) && Math.hypot(a.x - F.wx, a.y - F.wy) < FS_HEAT_REACH) near++;
    F.s.glow += (Math.min(1, near / 2) - F.s.glow) * 0.06;
    F.s.spin = (F.s.spin + FS_SPIN + FS_SPIN_HOT * F.s.glow) % (Math.PI * 2);
    const arms = fireSpinArms(F), f = typeof frame !== "undefined" ? frame : 0;
    for (const a of actors) {
        if (!isHostileTarget(a)) continue;
        if (!arms.some(ang => _fireSpinOn(F, ang, a.x, a.y))) continue;
        F.caught.push(a);
        if (a._fsHitAt !== undefined && f - a._fsHitAt < FS_HIT_EVERY) continue;
        a._fsHitAt = f;
        applyDamage(a, _formDamage(F, FS_DMG * (1 + F.s.glow), a), src, "fire");
    }
}

function _toxTowerTick(F, src, hit) {
    let foes = 0;
    for (const a of actors) {
        if (a.dead || Math.hypot(a.x - F.wx, a.y - F.wy) > TT_RADIUS) continue;
        if (isHostileTarget(a)) {
            foes++; F.caught.push(a);
            if (hit) {
                applyDamage(a, _formDamage(F, TT_DMG, a), src, "toxic");
                a.defenseShredded = Math.max(a.defenseShredded || 0, 60); a.defenseShredFactor = TT_SHRED;
            }
        } else if (hit && a.isClone && a.team === "green" && a.health < a.maxHealth) {
            a.health = Math.min(a.maxHealth, a.health + TT_HEAL + (a.maxHealth || 0) * TT_HEAL_SHARE);
        }
    }
    F.s.glow += (Math.min(1, foes / 3) - F.s.glow) * 0.08;
}

function _iceGenTick(F, src, hit) {
    const f = typeof frame !== "undefined" ? frame : 0;
    const pulse = f % ICE_PULSE === 0;
    for (const a of actors) {
        if (!isHostileTarget(a) || Math.hypot(a.x - F.wx, a.y - F.wy) > ICE_RADIUS) continue;
        F.caught.push(a);
        if (typeof applySlow === "function") {
            if (pulse) applySlow(a, ICE_ROOT, ICE_ROOT_SLOW);
            else if (!(a.slowed > 0 && a.slowFactor < ICE_SLOW)) applySlow(a, 20, ICE_SLOW);
        }
        if (hit) applyDamage(a, _formDamage(F, ICE_DMG, a), src, "ice");
    }
    if (pulse) { F.s.pulseAt = f; if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: F.wx, y: F.wy, color: F.col, radius: ICE_RADIUS * 0.8, life: 30, element: "ice" }); }
    F.s.glow += (Math.min(1, F.caught.length / 3) - F.s.glow) * 0.08;
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

// THE SPINNING FIREWALL. Three standing walls of flame radiate from a white-
// hot core on a scorched ring, each curving a little behind its turn. A wall
// is one smooth sheet of flame with a curved, flickering crest and a hotter
// lower sheet inside it, a hot seam where it meets the floor, drawn back to
// front round the core. Hotter (taller, brighter, faster) with enemies close.
function drawFireSpin(F, cx, cy) {
    const f = typeof frame !== "undefined" ? frame : 0, g = F.s.glow, on = formationActive(F);
    const scr = (dx, dy) => [cx + (dx - dy) * TILE_W, cy + (dx + dy) * TILE_H];
    const RX = FS_LEN * TILE_W * Math.SQRT2, RY = FS_LEN * TILE_H * Math.SQRT2;
    ctx.save();
    ctx.fillStyle = "rgba(28,8,2,0.55)"; ctx.beginPath(); ctx.ellipse(cx, cy, RX, RY, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = on ? `rgba(255,110,20,${0.3 + 0.45 * g})` : "rgba(120,60,30,0.35)"; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(cx, cy, RX, RY, 0, 0, Math.PI * 2); ctx.stroke();
    if (!on) {
        ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(200,200,210,0.8)";
        ctx.fillText("SPINNING FIREWALL · NEEDS POWER", cx, cy - RY - 8);
        ctx.restore(); return;
    }
    const N = 9, H0 = 30 * (1 + 0.35 * g);
    const walls = fireSpinArms(F).map((a, k) => {
        const pts = [];
        for (let i = 0; i <= N; i++) {
            const r = 0.1 + (FS_LEN - 0.1) * i / N, ang = a - 0.4 * r;
            const [x, y] = scr(Math.cos(ang) * r, Math.sin(ang) * r);
            const t = i / N, flick = 0.82 + 0.18 * Math.sin(f * 0.35 + i * 1.7 + k * 2.3) * Math.sin(f * 0.21 + i);
            pts.push({ x, y, h: H0 * (1 - 0.55 * t) * flick });
        }
        return { pts, mid: pts[Math.floor(N / 2)].y };
    });
    const core = () => {
        const cg = ctx.createRadialGradient(cx, cy - 4, 1, cx, cy - 4, 18 + 6 * g);
        cg.addColorStop(0, "rgba(255,255,235,1)"); cg.addColorStop(0.35, "rgba(255,210,90,0.95)");
        cg.addColorStop(0.7, "rgba(255,90,10,0.6)"); cg.addColorStop(1, "rgba(255,40,0,0)");
        ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy - 4, 18 + 6 * g, 12 + 4 * g, 0, 0, Math.PI * 2); ctx.fill();
    };
    const wall = w => {
        const P = w.pts;
        // The seam on the floor.
        ctx.lineCap = "round";
        ctx.strokeStyle = "rgba(255,120,20,0.55)"; ctx.lineWidth = 8;
        ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
        // The wall: one smooth sheet (a curved crest through the segment
        // tops), then a hotter, lower sheet inside it.
        const sheet = (k, stops) => {
            let lo = -Infinity, hi = Infinity;
            for (const p of P) { lo = Math.max(lo, p.y); hi = Math.min(hi, p.y - p.h * k); }
            const gr = ctx.createLinearGradient(0, lo, 0, hi);
            stops.forEach(([t, c]) => gr.addColorStop(t, c));
            ctx.fillStyle = gr;
            ctx.beginPath(); ctx.moveTo(P[0].x, P[0].y);
            for (const p of P) ctx.lineTo(p.x, p.y);
            const T = P.map(p => [p.x, p.y - p.h * k]).reverse();
            ctx.lineTo(T[0][0], T[0][1]);
            for (let i = 1; i < T.length - 1; i++) {
                const mx = (T[i][0] + T[i + 1][0]) / 2, my = (T[i][1] + T[i + 1][1]) / 2;
                ctx.quadraticCurveTo(T[i][0], T[i][1], mx, my);
            }
            ctx.lineTo(T[T.length - 1][0], T[T.length - 1][1]);
            ctx.closePath(); ctx.fill();
        };
        sheet(1, [[0, "rgba(255,200,90,0.85)"], [0.45, "rgba(255,110,10,0.7)"], [1, "rgba(255,40,0,0)"]]);
        sheet(0.55, [[0, "rgba(255,250,215,0.95)"], [0.6, "rgba(255,210,90,0.75)"], [1, "rgba(255,150,30,0)"]]);
        // The hot seam where it meets the floor.
        ctx.strokeStyle = "rgba(255,250,215,0.9)"; ctx.lineWidth = 2;
        ctx.beginPath(); P.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.stroke();
    };
    walls.sort((p, q) => p.mid - q.mid);
    const back = walls.filter(w => w.mid < cy), front = walls.filter(w => w.mid >= cy);
    back.forEach(wall); core(); front.forEach(wall);
    // Sparks thrown up off the walls.
    ctx.fillStyle = "rgba(255,210,110,0.9)";
    for (let i = 0; i < 8 + 6 * g; i++) {
        const w = walls[i % walls.length], p = w.pts[(i * 3) % w.pts.length], up = (f * 0.03 + i * 0.37) % 1;
        ctx.globalAlpha = 1 - up;
        ctx.fillRect(p.x + Math.sin(f * 0.1 + i) * 5, p.y - p.h - up * 30, 2, 2);
    }
    ctx.restore();
}

// The pylon pass calls this from the square's front tile (game.js).
function drawFormationGround(F, cx, cy) {
    if (F.kind === "blackhole") drawBlackHoleVortex(F, cx, cy);
    else if (F.kind === "firespin") drawFireSpin(F, cx, cy);
    else if (F.kind === "icegen") drawIceGenerator(F, cx, cy);
    else if (F.kind === "toxtower") drawToxicTower(F, cx, cy);
}

// THE FROST, painted by each floor tile it covers (the floor pass in game.js
// calls this right after the tile, before anything stands on it). One radial
// wash centred on the generator, squashed to the floor, clipped to the tile —
// so neighbouring tiles join seamlessly into one round frost patch — then
// frost feathers etched into it, and the root pulse's ring as it passes.
function drawFrostOnTile(obj, px, py) {
    if (!_frostTiles.size) return;
    const F = _frostTiles.get(Math.round(obj.x) + "," + Math.round(obj.y));
    if (!F) return;
    if (F.kind === "toxtower") { drawToxicHazeOnTile(F, obj, px, py); return; }
    const on = formationActive(F), g = F.s.glow, f = typeof frame !== "undefined" ? frame : 0;
    const cx = px + ((F.wx - obj.x) - (F.wy - obj.y)) * TILE_W, cy = py + ((F.wx - obj.x) + (F.wy - obj.y)) * TILE_H;
    const R = ICE_RADIUS * TILE_W * Math.SQRT2;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE_W, py + TILE_H); ctx.lineTo(px, py + 2 * TILE_H); ctx.lineTo(px - TILE_W, py + TILE_H); ctx.closePath(); ctx.clip();
    ctx.save();
    ctx.translate(cx, cy); ctx.scale(1, 0.5);
    const wash = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    const a0 = on ? 0.42 + 0.15 * g : 0.18;
    wash.addColorStop(0, `rgba(215,240,255,${a0})`); wash.addColorStop(0.6, `rgba(170,220,250,${a0 * 0.6})`); wash.addColorStop(1, "rgba(150,210,250,0)");
    ctx.fillStyle = wash; ctx.fillRect(-R, -R, R * 2, R * 2);
    // The pulse: a bright ring running out across the frost.
    const since = F.s.pulseAt === undefined ? Infinity : f - F.s.pulseAt;
    if (on && since < 30) {
        const r = R * (since / 30);
        ctx.strokeStyle = `rgba(255,255,255,${0.8 * (1 - since / 30)})`; ctx.lineWidth = 6;
        ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke();
    }
    ctx.restore();
    // Frost feathers: a stem and its barbs, fixed per tile, fainter further out.
    const d = Math.hypot(obj.x + 0.5 - F.wx, obj.y + 0.5 - F.wy), k = Math.max(0, 1 - d / ICE_RADIUS);
    if (k > 0) {
        const rnd = n => { const v = Math.sin((obj.x * 12.9898 + obj.y * 78.233 + n) * 43758.5453); return v - Math.floor(v); };
        ctx.strokeStyle = `rgba(255,255,255,${(on ? 0.55 : 0.25) * k})`; ctx.lineWidth = 1; ctx.lineCap = "round";
        for (let i = 0; i < 3; i++) {
            const sx = px + (rnd(i) - 0.5) * TILE_W * 1.1, sy = py + TILE_H + (rnd(i + 9) - 0.5) * TILE_H * 1.1;
            const ang = rnd(i + 3) * Math.PI * 2, L = 10 + rnd(i + 5) * 14, ux = Math.cos(ang), uy = Math.sin(ang) * 0.5;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + ux * L, sy + uy * L);
            for (let b = 1; b <= 3; b++) {
                const bx = sx + ux * L * b / 4, by = sy + uy * L * b / 4, bl = L * 0.35 * (1 - b / 5);
                for (const s of [-1, 1]) {
                    const ba = ang + s * 0.9;
                    ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(ba) * bl, by + Math.sin(ba) * bl * 0.5);
                }
            }
            ctx.stroke();
        }
        // A glint sliding across the ice.
        const gl = ((f * 0.004 + rnd(20)) % 1);
        if (on && gl < 0.25) {
            ctx.strokeStyle = `rgba(255,255,255,${0.35 * k * (1 - gl * 4)})`; ctx.lineWidth = 2;
            const gx = px - TILE_W + gl * 4 * TILE_W * 2;
            ctx.beginPath(); ctx.moveTo(gx, py + TILE_H * 0.4); ctx.lineTo(gx + 14, py + TILE_H * 1.6); ctx.stroke();
        }
    }
    ctx.restore();
}

// THE ICE GENERATOR: a cluster of tall ice crystals where the four pylons
// meet — six-sided shards of pale translucent ice with lit and shaded faces
// and white edges, leaning out from a glowing frost core — with snow lifting
// off it. Brighter while it holds enemies; the core flashes on each pulse.
function drawIceGenerator(F, cx, cy) {
    const f = typeof frame !== "undefined" ? frame : 0, g = F.s.glow, on = formationActive(F);
    const since = F.s.pulseAt === undefined ? Infinity : f - F.s.pulseAt;
    const flash = on && since < 20 ? 1 - since / 20 : 0;
    ctx.save();
    // The core's light on the floor.
    const cg = ctx.createRadialGradient(cx, cy, 2, cx, cy, 34);
    cg.addColorStop(0, `rgba(230,250,255,${on ? 0.7 + 0.3 * flash : 0.25})`); cg.addColorStop(1, "rgba(160,220,255,0)");
    ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, cy, 34, 17, 0, 0, Math.PI * 2); ctx.fill();
    // The shards, back to front: [screen dx, dy, height, half-width, lean].
    const shards = [[-14, -8, 34, 6, -0.25], [12, -9, 40, 6.5, 0.2], [0, -4, 58, 8, 0], [-20, 4, 26, 5, -0.4], [19, 5, 30, 5.5, 0.35], [-4, 9, 20, 4.5, -0.1]];
    for (const [dx, dy, h, w, lean] of shards) {
        const bx = cx + dx, by = cy + dy, tx = bx + lean * h, ty = by - h;
        const L = [bx - w, by], M = [bx, by + w * 0.5], Rr = [bx + w, by];
        const tL = [tx - w * 0.8, ty + w], tM = [tx, ty + w * 1.3], tR = [tx + w * 0.8, ty + w];
        const lit = on ? 0.55 + 0.25 * g + 0.2 * flash : 0.35;
        ctx.fillStyle = `rgba(120,190,235,${lit})`;
        ctx.beginPath(); ctx.moveTo(L[0], L[1]); ctx.lineTo(M[0], M[1]); ctx.lineTo(tM[0], tM[1]); ctx.lineTo(tL[0], tL[1]); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(200,240,255,${lit + 0.1})`;
        ctx.beginPath(); ctx.moveTo(M[0], M[1]); ctx.lineTo(Rr[0], Rr[1]); ctx.lineTo(tR[0], tR[1]); ctx.lineTo(tM[0], tM[1]); ctx.closePath(); ctx.fill();
        ctx.fillStyle = `rgba(235,250,255,${lit + 0.2})`;
        ctx.beginPath(); ctx.moveTo(tL[0], tL[1]); ctx.lineTo(tM[0], tM[1]); ctx.lineTo(tR[0], tR[1]); ctx.lineTo(tx, ty); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = "rgba(255,255,255,0.75)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(M[0], M[1]); ctx.lineTo(tM[0], tM[1]); ctx.lineTo(tx, ty); ctx.moveTo(tL[0], tL[1]); ctx.lineTo(tx, ty); ctx.lineTo(tR[0], tR[1]); ctx.stroke();
        // A glint running up the lit face.
        const gp = (f * 0.01 + dx * 0.05) % 1;
        if (on && gp < 0.4) {
            const q = gp / 0.4;
            ctx.strokeStyle = `rgba(255,255,255,${0.7 * (1 - q)})`; ctx.lineWidth = 1.5;
            ctx.beginPath(); ctx.moveTo(M[0] + (Rr[0] - M[0]) * 0.3 + (tM[0] - M[0]) * q, M[1] + (tM[1] - M[1]) * q);
            ctx.lineTo(M[0] + (Rr[0] - M[0]) * 0.7 + (tM[0] - M[0]) * q, M[1] + (Rr[1] - M[1]) * 0.7 + (tM[1] - M[1]) * q - 2); ctx.stroke();
        }
    }
    // The frost core among their roots.
    const pr = 6 + 3 * g + 5 * flash;
    ctx.fillStyle = `rgba(160,230,255,${on ? 0.35 : 0.1})`; ctx.beginPath(); ctx.arc(cx, cy - 10, pr * 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = on ? "#eaffff" : "#8aa4b4"; ctx.beginPath(); ctx.arc(cx, cy - 10, pr * 0.6, 0, Math.PI * 2); ctx.fill();
    // Snow lifting off it.
    if (on) {
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        for (let i = 0; i < 10; i++) {
            const up = (f * 0.006 + i * 0.137) % 1, sx = cx + Math.sin(i * 2.3 + f * 0.02) * (14 + 18 * up), sy = cy - 10 - up * 60;
            ctx.globalAlpha = 1 - up; ctx.fillRect(sx, sy, 1.8, 1.8);
        }
        ctx.globalAlpha = 1;
    } else {
        ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(200,200,210,0.8)";
        ctx.fillText("ICE GENERATOR · NEEDS POWER", cx, cy - 70);
    }
    ctx.restore();
}

// ── THE TOXIC TOWER ───────────────────────────────────────
// The haze on the floor round it, painted by each tile it covers (as the
// frost is): one dark-green wash centred on the tower, clipped to the tile so
// tiles join seamlessly, with slow darker blotches drifting across it.
function drawToxicHazeOnTile(F, obj, px, py) {
    const on = formationActive(F), g = F.s.glow, f = typeof frame !== "undefined" ? frame : 0;
    const cx = px + ((F.wx - obj.x) - (F.wy - obj.y)) * TILE_W, cy = py + ((F.wx - obj.x) + (F.wy - obj.y)) * TILE_H;
    const R = TT_RADIUS * TILE_W * Math.SQRT2;
    ctx.save();
    ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE_W, py + TILE_H); ctx.lineTo(px, py + 2 * TILE_H); ctx.lineTo(px - TILE_W, py + TILE_H); ctx.closePath(); ctx.clip();
    ctx.translate(cx, cy); ctx.scale(1, 0.5);
    const a0 = on ? 0.32 + 0.18 * g : 0.12;
    const wash = ctx.createRadialGradient(0, 0, 0, 0, 0, R);
    wash.addColorStop(0, `rgba(70,140,40,${a0})`); wash.addColorStop(0.65, `rgba(40,90,25,${a0 * 0.7})`); wash.addColorStop(1, "rgba(30,60,20,0)");
    ctx.fillStyle = wash; ctx.fillRect(-R, -R, R * 2, R * 2);
    if (on) {
        for (let i = 0; i < 5; i++) {
            const a = f * 0.004 + i * 1.26, d = R * (0.25 + 0.5 * ((i * 0.37) % 1));
            ctx.fillStyle = `rgba(12,20,10,${0.18 + 0.1 * g})`;
            ctx.beginPath(); ctx.arc(Math.cos(a) * d, Math.sin(a) * d, R * 0.16, 0, Math.PI * 2); ctx.fill();
        }
    }
    ctx.restore();
}

// Exhaust: each puff leaves its vent bright toxic green and cools to dark
// smoke as it rises and spreads. (dx, dy) is the push out of the vent.
function _toxPuffs(x, y, f, seed, o) {
    const n = o.n || 6, len = o.len || 40, size = o.size || 3.5, dx = o.dx || 0, dy = o.dy == null ? -1 : o.dy, heat = o.heat || 0;
    for (let i = 0; i < n; i++) {
        const t = ((f * (o.speed || 0.014) + i / n + seed) % 1);
        const out = Math.min(t, 0.35) / 0.35;
        const px = x + dx * len * 0.35 * out + Math.sin(t * 5 + seed * 7 + i) * 3 * t;
        const py = y + dy * len * 0.35 * out - Math.max(0, t - 0.2) * len;
        const r = size * (1.1 + t * 2.8);
        const hot = Math.max(0, 1 - t * 2) * (0.75 + 0.25 * Math.min(1, heat));
        const gr = ctx.createRadialGradient(px, py, 0, px, py, r);
        if (hot > 0.02) {
            gr.addColorStop(0, `rgba(210,255,170,${hot})`); gr.addColorStop(0.45, `rgba(120,250,90,${0.75 * hot})`); gr.addColorStop(1, "rgba(58,72,52,0)");
        } else {
            const a = (1 - t) * 0.7;
            gr.addColorStop(0, `rgba(58,72,52,${a})`); gr.addColorStop(1, "rgba(58,72,52,0)");
        }
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(px, py, r, 0, Math.PI * 2); ctx.fill();
    }
}
// A square block centred on (x, y) on the floor: half-width hw, height h.
function _toxBlock(x, y, hw, h, top, left, right) {
    const hh = hw / 2;
    ctx.fillStyle = left;  ctx.beginPath(); ctx.moveTo(x - hw, y - h); ctx.lineTo(x, y + hh - h); ctx.lineTo(x, y + hh); ctx.lineTo(x - hw, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = right; ctx.beginPath(); ctx.moveTo(x + hw, y - h); ctx.lineTo(x, y + hh - h); ctx.lineTo(x, y + hh); ctx.lineTo(x + hw, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = top;   ctx.beginPath(); ctx.moveTo(x, y - hh - h); ctx.lineTo(x + hw, y - h); ctx.lineTo(x, y + hh - h); ctx.lineTo(x - hw, y - h); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = "#3a4743"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(x - hw, y - h); ctx.lineTo(x, y + hh - h); ctx.lineTo(x + hw, y - h); ctx.moveTo(x, y + hh - h); ctx.lineTo(x, y + hh); ctx.stroke();
}
// THE TOWER: four square levels of dark metal, each a little narrower, with
// a recessed lit band between them; lit grilles on both front faces of every
// level; glowing exhaust out of each grille and off every band; four corner
// blocks on the roof round a big plume. Hotter — brighter and faster — with
// enemies close; grey and still with no power.
function drawToxicTower(F, cx, cy) {
    const f = typeof frame !== "undefined" ? frame : 0, on = formationActive(F), heat = on ? F.s.glow : 0;
    const glow = on ? 0.45 + 0.5 * heat + 0.05 * Math.sin(f * 0.1) : 0.12;
    const TOP = "#1f2523", LEFT = "#0c100f", RIGHT = "#151a18", BAND = "#070908";
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.4)"; ctx.beginPath(); ctx.ellipse(cx, cy + 2, 40, 18, 0, 0, Math.PI * 2); ctx.fill();
    let y = cy;
    const levels = [[30, 22], [27, 22], [24, 22], [21, 20]];
    levels.forEach(([hw, h], i) => {
        _toxBlock(cx, y, hw, h, TOP, LEFT, RIGHT);
        const hh = hw / 2, mid = y - h * 0.5;
        // Grilles: three lit slats on each front face.
        for (const sd of [-1, 1]) {
            const gx = cx + sd * hw * 0.5, gy = mid + hh * 0.5;
            ctx.fillStyle = BAND; ctx.beginPath();
            ctx.moveTo(gx - sd * 8, gy - 6); ctx.lineTo(gx + sd * 8, gy - 10); ctx.lineTo(gx + sd * 8, gy + 4 - 4); ctx.lineTo(gx - sd * 8, gy + 4); ctx.closePath(); ctx.fill();
            ctx.strokeStyle = `rgba(125,255,106,${glow})`; ctx.lineWidth = 1.5;
            for (let k = 0; k < 3; k++) { ctx.beginPath(); ctx.moveTo(gx - sd * 7, gy - 4 + k * 3); ctx.lineTo(gx + sd * 7, gy - 8 + k * 3); ctx.stroke(); }
            if (on) _toxPuffs(gx + sd * 9, gy - 6, f, i * 0.29 + (sd > 0 ? 0.5 : 0), { dx: sd * 0.7, dy: 0.1, len: 36, size: 3.5, heat: heat, speed: 0.012 + 0.01 * heat });
        }
        y -= h;
        // The lit band between this level and the next.
        if (i < levels.length - 1) {
            _toxBlock(cx, y, hw - 4, 4, BAND, BAND, BAND);
            ctx.strokeStyle = `rgba(125,255,106,${glow * 0.9})`; ctx.lineWidth = 1.5;
            const bh = (hw - 4) / 2;
            ctx.beginPath(); ctx.moveTo(cx - (hw - 4), y - 2); ctx.lineTo(cx, y + bh - 2); ctx.lineTo(cx + (hw - 4), y - 2); ctx.stroke();
            y -= 4;
        }
    });
    // The roof: four corner blocks round a glowing mouth and a big plume.
    const rw = 21, rh = rw / 2;
    for (const [dx, dy] of [[0, -rh * 0.75], [-rw * 0.75, 0], [rw * 0.75, 0], [0, rh * 0.75]]) _toxBlock(cx + dx, y + dy, 4.5, 7, "#262e2b", LEFT, RIGHT);
    ctx.fillStyle = `rgba(125,255,106,${on ? 0.5 + 0.4 * heat : 0.1})`; ctx.beginPath(); ctx.ellipse(cx, y, 9, 4.5, 0, 0, Math.PI * 2); ctx.fill();
    if (on) _toxPuffs(cx, y - 2, f, 0.35, { n: 10, len: 90, size: 6, heat: 1, speed: 0.012 + 0.012 * heat });
    else {
        ctx.font = "bold 9px monospace"; ctx.textAlign = "center"; ctx.fillStyle = "rgba(200,200,210,0.8)";
        ctx.fillText("TOXIC TOWER · NEEDS POWER", cx, y - 20);
    }
    ctx.restore();
}
