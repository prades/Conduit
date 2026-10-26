// ─────────────────────────────────────────────────────────
//  FIRE BOMBS — bouncing fire, and the ground it leaves burning (docs/FIRE-BOMBS.md)
// ─────────────────────────────────────────────────────────
// ASKED: "fire is mostly about little fire bombs that actually use projectile geometry and bounce off walls and off the ground a few times [...] the fireballs burn the ground where they land. If you get
// touched by that fire you take a little hit of damage. The hazard stays on the map for 10 or 15 seconds."
//   A FIRE BOMB   a ball with a position and a HEIGHT (x, y, z) moved by the frame loop under gravity. It lands and BOUNCES (each bounce keeps part of its upward speed, up to its bounce count), it
//                 reflects off anything that is not floor in its way (the facility's walls and props), splashes whoever is hostile where it lands, and sets the ground there alight.
//   BURNING GROUND  a tile on fire for FIRE_BURN_MIN to FIRE_BURN_MAX frames (10 to 15 seconds; it fades in its last second). Anything standing on it, EVERYONE, followers and you included, takes a little
//                 hit every half second and is set burning. Bounces that land on the same tile refresh it rather than stacking.
//   WHO THROWS THEM  a fire follower's special (js/elements.js) and the evolved fire forms' FIRE BOMBS move (fireBombBarrage, js/moves.js).
const FIRE_GRAVITY = 0.014;        // tiles of height a frame, squared
const FIRE_BOUNCE_KEEP = 0.62;     // the share of its upward speed a bounce keeps
const FIRE_WALL_KEEP = 0.85;       // the share of its sideways speed a wall bounce keeps
const FIRE_BOUNCES = 3;            // ground bounces before it bursts
const FIRE_Z_PX = 40;              // screen pixels in a tile of height
const FIRE_MUZZLE_Z = 0.7;         // the height a thrower lets go of it
const FIRE_BURN_MIN = 600, FIRE_BURN_MAX = 900;   // frames the ground burns: 10 to 15 seconds
const FIRE_BURN_FADE = 60;         // the last second fades
const FIRE_BURN_TICK = 30;         // the little hit comes every half second
const FIRE_BURN_CAP = 160;         // burning tiles at most (the oldest go first)
const FIRE_SPLASH_R = 0.95;        // tiles: who a landing bomb hurts directly
const FIRE_WALL_Z = 3;             // tiles of height: a bomb lower than this is stopped by a wall (the facility's walls are about that tall)
let fireBombs = [];
let fireTiles = new Map();         // "x,y" -> { x, y, until, born, dmg }

// Light a tile: a floor tile only (nothing burns where there is no floor).
// frames: how long it burns (default FIRE_BURN_MIN to FIRE_BURN_MAX, 10 to 15 seconds).
function igniteFireTile(tx, ty, dmg, frames) {
    tx = Math.round(tx); ty = Math.round(ty);
    const t = typeof getTile === "function" ? getTile(tx, ty) : null;
    if (!t || (t.type && t.type.indexOf("wall") >= 0)) return false;
    const f0 = typeof frame !== "undefined" ? frame : 0, until = f0 + (frames || (FIRE_BURN_MIN + Math.floor(Math.random() * (FIRE_BURN_MAX - FIRE_BURN_MIN + 1)))), key = tx + "," + ty, old = fireTiles.get(key);
    if (old) { old.until = Math.max(old.until, until); old.dmg = Math.max(old.dmg, dmg || 3); return true; }
    if (fireTiles.size >= FIRE_BURN_CAP) fireTiles.delete(fireTiles.keys().next().value);
    fireTiles.set(key, { x: tx, y: ty, until, born: f0, dmg: dmg || 3 });
    return true;
}
// Where a bomb of height z at (x, y) is blocked: anything that is not floor (the facility's walls and props stand where there is no floor tile), below FIRE_WALL_Z.
function _fireBlocked(x, y, z) {
    if (z > FIRE_WALL_Z) return false;
    const t = typeof getTile === "function" ? getTile(Math.round(x), Math.round(y)) : null;
    return !t || !!(t.type && t.type.indexOf("wall") >= 0);
}
// Throw a bomb from (x, y) toward a point `dist` tiles away in the direction (dx, dy): it first lands there, then bounces on (a bounce keeps FIRE_BOUNCE_KEEP of its speed up).
// opts: { dmg (the splash of each landing), burn (the little hit of the fire it leaves), bounces, big (a bigger burst), src }
function throwFireBomb(x, y, dx, dy, dist, opts) {
    const o = opts || {}, len = Math.hypot(dx, dy) || 1, vz = 0.2, z0 = FIRE_MUZZLE_Z;
    const T = (vz + Math.sqrt(vz * vz + 2 * FIRE_GRAVITY * z0)) / FIRE_GRAVITY;   // frames until it first lands
    const sp = Math.max(0.02, dist) / T;
    const b = { x, y, z: z0, vx: dx / len * sp, vy: dy / len * sp, vz, bounces: o.bounces === undefined ? FIRE_BOUNCES : o.bounces, dmg: o.dmg || 8, burn: o.burn || 3, big: !!o.big, src: o.src || null, life: 420, walls: 0, px: x, py: y };
    fireBombs.push(b); return b;
}
function _fireSplash(b) {
    const near = typeof unitsNear === "function" ? unitsNear(b.x, FIRE_SPLASH_R + 1) : actors;
    for (const a of near) { if (!a || a.dead || !(typeof isHostileTarget === "function" && isHostileTarget(a))) continue; if (Math.hypot(a.x - b.x, a.y - b.y) <= FIRE_SPLASH_R) { applyDamage(a, b.dmg, b.src, "fire"); a.burning = Math.max(a.burning || 0, 90); a.burnDamage = Math.max(a.burnDamage || 0, b.burn * 0.1); } }
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: b.x, y: b.y, color: "#ff7a1a", radius: b.big ? 0.8 : 0.5, life: 14, element: "fire" });
}
function _fireBurst(b) {
    _fireSplash(b);
    igniteFireTile(b.x, b.y, b.burn);
    if (b.big) for (const [ox, oy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) igniteFireTile(b.x + ox, b.y + oy, b.burn);   // a plus of fire
    else if (Math.random() < 0.5) { const s = Math.random() < 0.5 ? 1 : -1; if (Math.random() < 0.5) igniteFireTile(b.x + s, b.y, b.burn); else igniteFireTile(b.x, b.y + s, b.burn); }
}
function fireBombsTick() {
    const f0 = typeof frame !== "undefined" ? frame : 0;
    // the bombs
    for (let i = fireBombs.length - 1; i >= 0; i--) {
        const b = fireBombs[i];
        b.px = b.x; b.py = b.y; b.vz -= FIRE_GRAVITY; b.life--;
        let nx = b.x + b.vx, ny = b.y + b.vy;
        // a wall (or a prop) in the way: bounce off the face it crossed
        if (_fireBlocked(nx, ny, b.z)) {
            if (!_fireBlocked(nx, b.y, b.z)) { b.vy = -b.vy * FIRE_WALL_KEEP; ny = b.y; }
            else if (!_fireBlocked(b.x, ny, b.z)) { b.vx = -b.vx * FIRE_WALL_KEEP; nx = b.x; }
            else { b.vx = -b.vx * FIRE_WALL_KEEP; b.vy = -b.vy * FIRE_WALL_KEEP; nx = b.x; ny = b.y; }
            b.walls++;
        }
        b.x = nx; b.y = ny; b.z += b.vz;
        if (b.z <= 0 && b.vz < 0) {
            b.z = 0;
            if (b.bounces > 0 && b.life > 0) { _fireSplash(b); igniteFireTile(b.x, b.y, b.burn); b.bounces--; b.vz = -b.vz * FIRE_BOUNCE_KEEP; if (b.vz < 0.03) { _fireBurst(b); fireBombs.splice(i, 1); } }
            else { _fireBurst(b); fireBombs.splice(i, 1); }
        } else if (b.life <= 0) { b.z = 0; _fireBurst(b); fireBombs.splice(i, 1); }
    }
    // the ground: expire, and the little hit every half second to everyone standing in it
    if (fireTiles.size) {
        for (const [k, t] of fireTiles) if (t.until <= f0) fireTiles.delete(k);
        if (f0 % FIRE_BURN_TICK === 0 && fireTiles.size) {
            const hit = a => fireTiles.get(Math.round(a.x) + "," + Math.round(a.y));
            for (const a of actors) {
                if (!a || a.dead) continue;
                const t = hit(a); if (!t) continue;
                applyDamage(a, t.dmg, null, "fire"); a.burning = Math.max(a.burning || 0, 60); a.burnDamage = Math.max(a.burnDamage || 0, t.dmg * 0.05);
                if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: a.x, y: a.y, text: "BURN", color: "#ff8a3a", life: 25, vy: -0.04 });
            }
            const pt = hit({ x: player.x, y: player.y });
            if (pt && typeof hurtPlayer === "function") hurtPlayer(Math.max(2, pt.dmg));
        }
    }
}
// ── FIRE FOLLOWERS ──
// `n` bombs from a follower at a target, fanned `spread` radians apart, landing at (or just short of) it. `dmg` is each landing's splash; the little hit of the fire it leaves is a tenth of it.
function throwFireBombsAt(actor, target, n, spread, dmg) {
    if (!actor || !target) return 0;
    const dx = target.x - actor.x, dy = target.y - actor.y, d = Math.hypot(dx, dy) || 1, dist = Math.max(1.5, Math.min(8, d)), L = n > 1 ? spread : 0;
    for (let i = 0; i < n; i++) {
        const th = (i - (n - 1) / 2) * L, c = Math.cos(th), s = Math.sin(th);
        throwFireBomb(actor.x, actor.y, (dx * c - dy * s) / d, (dx * s + dy * c) / d, dist, { dmg, burn: Math.max(2, Math.min(10, dmg * 0.1)), bounces: FIRE_BOUNCES - 1, src: actor });
    }
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: actor.x, y: actor.y, color: "#ff7a1a", radius: 0.4, life: 10, element: "fire" });
    actor.fireOrbitTimer = 30; return n;
}
// The move FIRE BOMBS (js/moves.js), for the evolved fire forms that can use it: three bombs fanned at the nearest foe in reach.
const FIRE_BARRAGE_RANGE = 7, FIRE_BARRAGE_EVERY = 300;
function fireBombBarrage(f) {
    const foes = typeof _evoFoes === "function" ? _evoFoes(f.x, f.y, FIRE_BARRAGE_RANGE) : [];
    if (!foes.length) return false;
    foes.sort((a, b) => Math.hypot(a.x - f.x, a.y - f.y) - Math.hypot(b.x - f.x, b.y - f.y));
    const f0 = typeof frame !== "undefined" ? frame : 0;
    throwFireBombsAt(f, foes[0], 3, 0.3, (f.power || 10) * 0.9);
    f._sigAt = f0; f._sigCd = FIRE_BARRAGE_EVERY;
    { const dx = foes[0].x - f.x, dy = foes[0].y - f.y, L = Math.hypot(dx, dy) || 1; f.dirX = dx / L; f.dirY = dy / L; }
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ x: f.x, y: f.y - 1.2, text: "FIRE BOMBS", color: "#ff8a3a", life: 50, vy: -0.06, size: 10 });
    return true;
}
// ── DRAWING ──
function _fireScr(x, y, z) { const W = canvas.width / 2, H = canvas.height / 2; return [(x - player.visualX - (y - player.visualY)) * TILE_W + W, (x - player.visualX + (y - player.visualY)) * TILE_H + H + TILE_H - (z || 0) * FIRE_Z_PX]; }
// The burning ground, painted by each floor tile as it is drawn (under whoever stands there): called with the tile's top corner (px, py).
function drawFireOnTile(tx, ty, px, py) {
    if (!fireTiles.size) return;
    const t = fireTiles.get(tx + "," + ty); if (!t) return;
    // SUBTLE (reported: "make the fire more subtle"): a soft ember glow on the floor, edges feathered by a smaller inner diamond, and two or three small low flames that flicker; nothing solid or bright.
    const f0 = typeof frame !== "undefined" ? frame : 0, left = t.until - f0, a = Math.min(1, left / FIRE_BURN_FADE), seed = (tx * 7 + ty * 13) & 15, fl = 0.5 + 0.5 * Math.sin(f0 * 0.17 + seed);
    ctx.save();
    const cx = px, cy = py + TILE_H, g = ctx.createRadialGradient(cx, cy, 2, cx, cy, TILE_W * 0.95); g.addColorStop(0, "rgba(255,120,40," + (0.3 * a * (0.8 + 0.2 * fl)).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,90,20,0)");
    ctx.beginPath(); ctx.moveTo(px, py + 2); ctx.lineTo(px + TILE_W - 2, py + TILE_H); ctx.lineTo(px, py + 2 * TILE_H - 2); ctx.lineTo(px - TILE_W + 2, py + TILE_H); ctx.closePath(); ctx.fillStyle = g; ctx.fill();
    // a few small flames, low and translucent
    for (let k = 0; k < 3; k++) {
        const ph = f0 * 0.13 + seed + k * 2.3, bx = px + (k - 1) * TILE_W * 0.4 + Math.sin(ph * 0.6) * 2, by = py + TILE_H + (k % 2 ? 5 : -3), h = 6 + 4 * (0.5 + 0.5 * Math.sin(ph)), w = 3 + Math.sin(ph * 1.3), sw = Math.sin(ph * 1.7) * 2;
        ctx.globalAlpha = a * 0.5; ctx.fillStyle = "#ff7a2a"; ctx.beginPath(); ctx.moveTo(bx - w, by); ctx.quadraticCurveTo(bx - w * 0.6, by - h * 0.5, bx + sw, by - h); ctx.quadraticCurveTo(bx + w * 0.6, by - h * 0.45, bx + w, by); ctx.closePath(); ctx.fill();
        ctx.globalAlpha = a * 0.4; ctx.fillStyle = "#ffd27a"; ctx.beginPath(); ctx.moveTo(bx - w * 0.4, by); ctx.quadraticCurveTo(bx, by - h * 0.55, bx + sw * 0.5, by - h * 0.6); ctx.quadraticCurveTo(bx + w * 0.3, by - h * 0.25, bx + w * 0.4, by); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
}
function drawFireBombs() {
    if (!fireBombs.length) return;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const b of fireBombs) {
        const [gx, gy] = _fireScr(b.x, b.y, 0), [sx, sy] = _fireScr(b.x, b.y, b.z), r = b.big ? 5.5 : 4;
        // its shadow on the floor shrinks as it rises
        ctx.globalAlpha = 0.35 / (1 + b.z); ctx.fillStyle = "#000"; ctx.beginPath(); ctx.ellipse(gx, gy, r * 1.6 / (1 + b.z * 0.5), r * 0.7 / (1 + b.z * 0.5), 0, 0, Math.PI * 2); ctx.fill();
        // a short trail, a glow, a hot core
        const [tx, ty] = _fireScr(b.px, b.py, Math.max(0, b.z - b.vz));
        ctx.globalAlpha = 0.3; ctx.strokeStyle = "#ff7a1a"; ctx.lineWidth = r * 1.1; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(tx, ty); ctx.lineTo(sx, sy); ctx.stroke();
        ctx.globalAlpha = 0.22; ctx.fillStyle = "#ff6a10"; ctx.beginPath(); ctx.arc(sx, sy, r * 1.8, 0, Math.PI * 2); ctx.fill();
        ctx.globalAlpha = 0.9; ctx.fillStyle = "#ff8a1c"; ctx.beginPath(); ctx.arc(sx, sy, r, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = "#ffe08a"; ctx.beginPath(); ctx.arc(sx, sy, r * 0.45, 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
}
