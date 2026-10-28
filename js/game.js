// ─────────────────────────────────────────────────────────
//  FOLLOWER PROJECTILE RENDERING (element-specific visuals)
// ─────────────────────────────────────────────────────────
function _drawFollowerProjectile(ctx, p, sx, sy) {
    const r = p.radius || 4;
    const el = p.element;
    const f  = p.frame || 0;

    // Apply parabolic arc height for bomb-style projectiles
    if (p.arcData && p.arcData.screenOffset) {
        sy -= p.arcData.screenOffset;
    }

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    if (el === 'fire') {
        // Fireball — flickering orange/red core with white-hot centre
        const flicker = 1 + Math.sin(f * 0.45) * 0.14;
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.6 * flicker);
        grad.addColorStop(0,   '#ffffff');
        grad.addColorStop(0.18,'#ffee44');
        grad.addColorStop(0.45,'#ff6600');
        grad.addColorStop(0.75,'#cc2200');
        grad.addColorStop(1,   'rgba(160,0,0,0)');
        ctx.shadowColor = '#ff5500';
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2.6 * flicker, 0, Math.PI * 2);
        ctx.fill();
        // bright inner core
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = '#ffffff';
        ctx.beginPath();
        ctx.arc(sx, sy, r * 0.55, 0, Math.PI * 2);
        ctx.fill();

    } else if (el === 'electric') {
        // Electric orb — yellow-green with radiating arc spikes
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.2);
        grad.addColorStop(0,   '#ffffff');
        grad.addColorStop(0.25,'#eeff44');
        grad.addColorStop(0.65,'#aacc00');
        grad.addColorStop(1,   'rgba(100,200,0,0)');
        ctx.shadowColor = '#ffff00';
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        // arc spikes
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = 'rgba(255,255,180,0.9)';
        ctx.lineWidth   = 1.5;
        for (let i = 0; i < 5; i++) {
            const ang = f * 0.18 + i * (Math.PI * 2 / 5);
            const len = r * (1.8 + Math.sin(f * 0.35 + i * 1.3) * 0.6);
            ctx.beginPath();
            ctx.moveTo(sx + Math.cos(ang) * r * 0.6, sy + Math.sin(ang) * r * 0.6);
            ctx.lineTo(sx + Math.cos(ang) * len * 2,  sy + Math.sin(ang) * len * 2);
            ctx.stroke();
        }

    } else if (el === 'ice') {
        // Ice crystal — six-pointed frost shard
        ctx.shadowColor = '#aaeeff';
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = 'rgba(180,230,255,0.85)';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth   = 1;
        const spikes = 6;
        for (let i = 0; i < spikes; i++) {
            const ang  = (i / spikes) * Math.PI * 2 + f * 0.025;
            const tip  = r * 2.4;
            const base = r * 0.75;
            const bAng = Math.PI / spikes;
            ctx.beginPath();
            ctx.moveTo(sx + Math.cos(ang) * tip,            sy + Math.sin(ang) * tip);
            ctx.lineTo(sx + Math.cos(ang + bAng) * base,    sy + Math.sin(ang + bAng) * base);
            ctx.lineTo(sx + Math.cos(ang - bAng) * base,    sy + Math.sin(ang - bAng) * base);
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        }
        // core
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 1.1);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.5, '#99ddff');
        grad.addColorStop(1,   '#2288bb');
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 1.1, 0, Math.PI * 2);
        ctx.fill();

    } else if (el === 'flux') {
        // Black hole — void centre, bright purple event horizon, rotating distortion arcs
        const grad = ctx.createRadialGradient(sx, sy, r * 0.4, sx, sy, r * 3.2);
        grad.addColorStop(0,   '#000000');
        grad.addColorStop(0.35,'#330066');
        grad.addColorStop(0.6, '#7722cc');
        grad.addColorStop(0.85,'#9933ff');
        grad.addColorStop(1,   'rgba(80,0,180,0)');
        ctx.shadowColor = '#aa44ff';
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 3.2, 0, Math.PI * 2);
        ctx.fill();
        // event horizon ring
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = '#dd88ff';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 1.7, 0, Math.PI * 2);
        ctx.stroke();
        // rotating distortion arcs
        for (let i = 0; i < 3; i++) {
            const ang = f * 0.09 + i * (Math.PI * 2 / 3);
            ctx.strokeStyle = `rgba(200,100,255,${0.35 + i * 0.12})`;
            ctx.lineWidth   = 1;
            ctx.shadowBlur  = 0;
            ctx.beginPath();
            ctx.arc(sx, sy, r * (2.1 + i * 0.35), ang, ang + Math.PI * 1.1);
            ctx.stroke();
        }
        // pure black void centre
        ctx.shadowBlur  =0;
        ctx.fillStyle   = '#000000';
        ctx.beginPath();
        ctx.arc(sx, sy, r * 0.75, 0, Math.PI * 2);
        ctx.fill();

    } else if (el === 'core') {
        // Energy orb — teal with rotating hexagon shield ring
        const grad = ctx.createRadialGradient(sx, sy, 0, sx, sy, r * 2.2);
        grad.addColorStop(0,   '#ffffff');
        grad.addColorStop(0.28,'#44ffdd');
        grad.addColorStop(0.65,'#00aaaa');
        grad.addColorStop(1,   'rgba(0,140,120,0)');
        ctx.shadowColor = '#00ffcc';
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2.2, 0, Math.PI * 2);
        ctx.fill();
        // rotating hexagon ring
        ctx.shadowBlur  = 0;
        ctx.strokeStyle = 'rgba(180,255,240,0.9)';
        ctx.lineWidth   = 1.5;
        ctx.save();
        ctx.translate(sx, sy);
        ctx.rotate(f * 0.06);
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const ang = (i / 6) * Math.PI * 2;
            i === 0
                ? ctx.moveTo(Math.cos(ang) * r * 1.9, Math.sin(ang) * r * 1.9)
                : ctx.lineTo(Math.cos(ang) * r * 1.9, Math.sin(ang) * r * 1.9);
        }
        ctx.closePath();
        ctx.stroke();
        ctx.restore();

    } else if (el === 'toxic') {
        if (p.isBomb) {
            // Smoke grenade — dark canister tumbling through the air with a smoke trail
            ctx.shadowColor = '#55ff22';
            ctx.shadowBlur  = 0;
            // Canister body (rotates as it flies)
            const angle = f * 0.22;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(angle);
            ctx.fillStyle = '#2a5c18';
            ctx.beginPath();
            ctx.ellipse(0, 0, r * 1.1, r * 1.7, 0, 0, Math.PI * 2);
            ctx.fill();
            // Dark band across middle
            ctx.fillStyle = '#1a3c0e';
            ctx.fillRect(-r * 1.1, -r * 0.28, r * 2.2, r * 0.56);
            ctx.restore();
            // Fuse spark
            ctx.fillStyle = '#ffee44';
            ctx.shadowColor = '#ffaa00';
            ctx.shadowBlur  = 0;
            ctx.beginPath();
            ctx.arc(sx, sy - r * 1.6, r * 0.45, 0, Math.PI * 2);
            ctx.fill();
            // Smoke trail puffs behind it
            ctx.shadowBlur =0;
            for (let i = 0; i < 3; i++) {
                const pT  = ((f + i * 9) % 27) / 27;
                const pSx = sx + Math.sin(f * 0.2 + i * 1.2) * 5;
                const pSy = sy + pT * 22;
                ctx.globalAlpha = (1 - pT) * 0.38;
                ctx.fillStyle   = '#99cc77';
                ctx.beginPath();
                ctx.arc(pSx, pSy, r * (0.5 + pT * 0.9), 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.globalAlpha = 1;
        } else {
        // Toxic bubble — wobbly translucent green sphere with highlight
        const wobble = 1 + Math.sin(f * 0.28) * 0.11;
        const grad = ctx.createRadialGradient(
            sx - r * 0.3, sy - r * 0.3, 0,
            sx, sy, r * 2.3 * wobble
        );
        grad.addColorStop(0,    '#ddffdd');
        grad.addColorStop(0.28, '#66ff44');
        grad.addColorStop(0.6,  '#22aa00');
        grad.addColorStop(0.85, '#115500');
        grad.addColorStop(1,    'rgba(0,50,0,0)');
        ctx.shadowColor = '#44ff00';
        ctx.shadowBlur  = 0;
        ctx.fillStyle   = grad;
        ctx.beginPath();
        ctx.arc(sx, sy, r * 2.3 * wobble, 0, Math.PI * 2);
        ctx.fill();
        // specular highlight
        ctx.shadowBlur  =0;
        ctx.fillStyle   = 'rgba(200,255,200,0.35)';
        ctx.beginPath();
        ctx.arc(sx - r * 0.55, sy - r * 0.55, r * 0.55, 0, Math.PI * 2);
        ctx.fill();
        }

    } else {
        // Fallback — plain glowing circle (predator shots, unknown element)
        ctx.fillStyle  = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur  = 0;
        ctx.beginPath();
        ctx.arc(sx, sy, r, 0, Math.PI * 2);
        ctx.fill();
    }

    ctx.shadowBlur =0;
    ctx.restore();
}


// ── THE FLOOR TILE ───────────────────────────────────────
// One floor tile's look at a given distance from the camera, drawn at (px, py)
// — the tile's top corner. Used to fill the tile sprites below, and directly
// if a sprite cannot be made.
const FLOOR_DIST_STEP   = 0.5;   // tiles: distances this close share a look
const FLOOR_SPRITE_CAP  = 700;
let _floorSprites = new Map();
function _drawFloorTile(c, px, py, dist) {
    const amb=Math.max(0.1,0.8-dist/RENDER_DIST), glo=Math.max(0,1.0-dist/5);
    // Dexter's Lab steel-blue/teal panels (the facility's own floors are painted over them: js/facilitydecor.js)
    const tR = (16*amb +  8*glo)|0, tG = (26*amb + 20*glo)|0, tB = (42*amb + 52*glo)|0;
    c.fillStyle=`rgb(${tR},${tG},${tB})`;
    c.beginPath(); c.moveTo(px,py); c.lineTo(px+TILE_W,py+TILE_H); c.lineTo(px,py+TILE_W); c.lineTo(px-TILE_W,py+TILE_H); c.closePath(); c.fill();
    // ── Steel panel bevel — highlight top two edges, shadow bottom two ──
    c.strokeStyle = `rgba(80,130,180,${0.55*amb})`;
    c.lineWidth = 1;
    c.beginPath(); c.moveTo(px,py+1); c.lineTo(px-TILE_W+1,py+TILE_H); c.stroke();
    c.beginPath(); c.moveTo(px,py+1); c.lineTo(px+TILE_W-1,py+TILE_H); c.stroke();
    c.strokeStyle = `rgba(0,0,0,${0.35*amb})`;
    c.beginPath(); c.moveTo(px-TILE_W+1,py+TILE_H); c.lineTo(px,py+TILE_W-1); c.stroke();
    c.beginPath(); c.moveTo(px+TILE_W-1,py+TILE_H); c.lineTo(px,py+TILE_W-1); c.stroke();
}
// THE TILE IS A SPRITE: its look depends only on the distance to the camera (in steps of FLOOR_DIST_STEP), so each look is drawn once and stamped.
function _floorTileSprite(dq) {
    let cv = _floorSprites.get(dq);
    if (cv !== undefined) return cv;
    cv = null;
    const el = typeof document !== "undefined" && document.createElement ? document.createElement("canvas") : null;
    const g = el && el.getContext ? el.getContext("2d") : null;
    if (g && typeof g.drawImage === "function") {
        el.width = TILE_W * 2 + 2; el.height = TILE_W + 2;
        _drawFloorTile(g, TILE_W + 1, 1, dq * FLOOR_DIST_STEP);
        cv = el;
    }
    if (_floorSprites.size >= FLOOR_SPRITE_CAP) _floorSprites.delete(_floorSprites.keys().next().value);
    _floorSprites.set(dq, cv);
    return cv;
}

// THE RESPAWN TICKER, over the Crystal: every unit of yours that is coming back, soonest first, with its wait. A clone takes CLONE_RESPAWN_FRAMES (twenty seconds), a follower three;
// without this the player has no way to know whether one is coming or whether it is gone for good (docs/COMBAT.md: a defeat is said, and so is the return).
function drawCloneRespawnTicker(cx, topY) {
    if (typeof respawnQueue === "undefined") return;
    const waiting = respawnQueue.filter(e => e && (e.isClone || e.element));
    if (waiting.length === 0) return;
    // Soonest first, so the top line is the one about to land.
    waiting.sort((a, b) => a.timer - b.timer);

    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";

    const rowH = 13;
    let y = topY - (waiting.length - 1) * rowH;
    for (const e of waiting) {
        const secs  = Math.max(0, Math.ceil(e.timer / 60));
        const total = e.totalTimer || CLONE_RESPAWN_FRAMES;
        const done  = Math.max(0, Math.min(1, 1 - e.timer / total));
        const name  = e.isClone ? ((e.speciesName || "clone") + " " + (e.className || "")).toUpperCase().trim() : ((e.element || "") + " " + (typeof roleLabel === "function" ? roleLabel(e.role || "brawler") : "")).toUpperCase().trim(), col = e.isClone ? "#22ff88" : "#19e6c1";

        // A bar that fills as it comes back, so the wait is legible at a glance
        // and the number is the detail rather than the whole message.
        const bw = 56, bh = 3;
        ctx.fillStyle = "rgba(0,0,0,0.55)";
        ctx.fillRect(cx - bw / 2 - 1, y - 9, bw + 2, bh + 2);
        ctx.fillStyle = col;
        ctx.fillRect(cx - bw / 2, y - 8, bw * done, bh);

        ctx.font = "bold 8px monospace";
        ctx.fillStyle = col;
        ctx.fillText(name + "  " + secs + "s", cx, y);
        y += rowH;
    }
    ctx.restore();
}

// ─────────────────────────────────────────────────────────
//  DRAW DEPTH
// ─────────────────────────────────────────────────────────
// One place decides what draws in front of what: depth is x + y (a bigger sum draws lower and in front).
function drawDepthOf(o) {
    if ((o.type === 'fp' || o.type === 'crystal') && o.depth !== undefined) return o.depth;   // facility wall decor sorts just after the wall pieces under it; the crystal after its pad (js/facilitydecor.js)
    return o.x + o.y;
}

// ─────────────────────────────────────────────────────────
//  DRAW CULLING
// ─────────────────────────────────────────────────────────
// Whether anything anchored at this world position can touch the screen.
//
// The draw list used to be `world.filter(t => Math.abs(t.x - player.visualX) <
// RENDER_DIST)` — column distance, not screen position. But the isometric
// projection is horizontal in (x - y): a tile twenty columns away at the same y
// lands 1200px right of centre. Measured on a 900x700 view that filter selected
// 304 tiles of which 150 were on screen, so half of every frame's tile work and
// the canvas calls that go with it were spent outside the viewport. Actors were
// not culled at all, and one actor costs around 200 canvas operations.
//
// The margins are asymmetric because sprites are drawn UPWARD from their tile
// anchor. Something below the bottom edge can still poke into view, so that
// side is generous; a tile above the top edge only ever shows its floor
// diamond, so that side can be tight. Getting these wrong shows up as objects
// popping in and out at the edges, which is why they are named constants with a
// test rather than numbers inline.
const DRAW_CULL_SIDE   = TILE_W * 2.5;   // 150px — wider than any sprite
const DRAW_CULL_TOP    = TILE_H * 5;     // 150px — floor diamonds only
const DRAW_CULL_BOTTOM = TILE_H * 7;     // 210px — the tallest sprite, and then some
// Tiles indexed by column, built straight off `world` as it grows. Derived
// rather than maintained: anything pushed into world by anybody is picked up on
// the next call, so the index cannot drift out of step with the list.
//
// A restart replaces `world` with a fresh array, which the identity check
// catches — keying on length alone would miss a new array of the same size.
let _colIndex = new Map(), _colIndexedLen = 0, _colIndexWorld = null;
let _lastDrawScan = 0;   // candidates examined by the last visibleTilesForDraw()
function tileColumns() {
    if (_colIndexWorld !== world) {
        _colIndex = new Map(); _colIndexedLen = 0; _colIndexWorld = world;
    }
    for (let i = _colIndexedLen; i < world.length; i++) {
        const t = world[i];
        let col = _colIndex.get(t.x);
        if (col === undefined) { col = []; _colIndex.set(t.x, col); }
        col.push(t);
    }
    _colIndexedLen = world.length;
    return _colIndex;
}

// Only the columns that could possibly be on screen.
//
// The draw list was `world.filter(visibleForDraw)` — every tile in the world,
// every frame. `world` is appended to as the player walks, so that scan grows
// without bound while the number of visible tiles does not: measured at 1256
// tiles scanned to find 158, and twice the scan for the same picture after
// walking twice as far.
//
// A cache keyed on the camera was tried first and was worthless: the camera
// moves further in one frame than any lag small enough to be safe, so it
// rebuilt every frame and hit 0% of the time.
//
// The cull is a screen-space box, so it bounds both isometric axes — (dx-dy)
// from the horizontal test and (dx+dy) from the vertical one. Half their sum
// bounds dx, which is the column. For a 900x700 view that is 28 columns rather
// than the whole map, and the resulting set is IDENTICAL to the old filter
// because every candidate still goes through visibleForDraw.
function visibleTilesForDraw() {
    const cols = tileColumns();
    const halfW = canvas.width / 2, halfH = canvas.height / 2;
    const aMin = (-DRAW_CULL_SIDE - halfW) / TILE_W;                    // min (dx-dy)
    const aMax = (canvas.width + DRAW_CULL_SIDE - halfW) / TILE_W;      // max (dx-dy)
    const bMin = (-DRAW_CULL_TOP - halfH) / TILE_H;                     // min (dx+dy)
    const bMax = (canvas.height + DRAW_CULL_BOTTOM - halfH) / TILE_H;   // max (dx+dy)
    const xMin = Math.floor(player.visualX + (aMin + bMin) / 2);
    const xMax = Math.ceil (player.visualX + (aMax + bMax) / 2);
    const out = [];
    let scanned = 0;
    for (let x = xMin; x <= xMax; x++) {
        const col = cols.get(x);
        if (col === undefined) continue;
        scanned += col.length;
        for (let i = 0; i < col.length; i++) {
            const t = col[i];
            if (visibleForDraw(t.x, t.y)) out.push(t);
        }
    }
    // How many candidates that took. The whole point of the index is that this
    // stays flat as `world` grows, and it is the only way to tell a working
    // index from one whose window has quietly widened to the whole map —
    // a too-wide window still produces the correct set, just slowly.
    _lastDrawScan = scanned;
    return out;
}

function visibleForDraw(x, y) {
    const dx = x - player.visualX, dy = y - player.visualY;
    const px = (dx - dy) * TILE_W + canvas.width / 2;
    if (px < -DRAW_CULL_SIDE || px > canvas.width + DRAW_CULL_SIDE) return false;
    const py = (dx + dy) * TILE_H + canvas.height / 2;
    return py >= -DRAW_CULL_TOP && py <= canvas.height + DRAW_CULL_BOTTOM;
}

// ─────────────────────────────────────────────────────────
//  MAIN RENDER / GAME LOOP
// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
//  THE CLOCK — the game runs at 60 steps a second, whatever the screen manages
// ─────────────────────────────────────────────────────────
// REPORTED: "Changing the graphics to high does nothing to slow it down, and it
// is slow. I believe there is something else that is slowing it down."
//
// There was. Everything in the game moves a fixed amount per call of render(),
// and render() was called once per screen refresh. A device that could only
// draw 30 frames a second therefore ran the whole GAME at half speed — slow
// motion, not just choppy — and nothing in the graphics settings could change
// that, because the slowdown was the clock, not the picture.
//
// Now gameLoop keeps time. Each screen refresh it works out how many 1/60 s
// steps are owed and runs them: all but the last with drawing switched off
// (ctx is swapped for a canvas that ignores every call, so the game logic that
// lives in the draw pass — shots, vents, respawns, effect lifetimes — still
// runs exactly once a step), and the last one drawn. A step without the
// picture costs about a third of a drawn one. It catches up at most
// SIM_MAX_STEPS steps and SIM_BUDGET_MS of work a refresh, so a device that is
// struggling slows down gently instead of stalling. On a 120 Hz screen a
// refresh with no step owed is skipped and the last picture stays up (the game
// used to run at DOUBLE speed there).
//
// Calling render() directly is still exactly one step and one picture (the
// tests and the boot use that).
const SIM_STEP_MS   = 1000 / 60;
const SIM_MAX_STEPS = 4;      // most steps run for one picture (15 fps still plays at full speed)
const SIM_BUDGET_MS = 30;     // …and stop catching up once a refresh has cost this much
let _simLast = 0, _simDebt = 0, _simGhost = false, _nullCtx = null, _simStepsShown = 0, _simStepsCount = 0, _simStepsAt = 0;
function _makeNullCtx() {
    // Every method of the real 2D context, doing nothing; the few whose result
    // the code reads return something harmless. Its settings (fillStyle,
    // globalAlpha …) are plain fields, starting at the real context's values.
    const P = typeof CanvasRenderingContext2D !== "undefined" ? CanvasRenderingContext2D.prototype : null;
    if (!P || typeof Proxy === "undefined") return null;
    const noop = function () {};
    const n = {};
    for (const k of Object.getOwnPropertyNames(P)) {
        let d = null; try { d = Object.getOwnPropertyDescriptor(P, k); } catch (e) {}
        if (!d) continue;
        if (typeof d.value === "function") n[k] = noop;
        else if (d.get) { try { const v = ctx[k]; if (typeof v !== "function") n[k] = v; } catch (e) {} }
    }
    const grad = { addColorStop() {} };
    n.createRadialGradient = n.createLinearGradient = n.createConicGradient = () => grad;
    n.createPattern = () => null;
    n.measureText = t => ({ width: String(t).length * 6 });
    n.getLineDash = () => [];
    n.isPointInPath = n.isPointInStroke = () => false;
    n.canvas = canvas;
    // Anything the prototype did not list (a method this browser lacks, which
    // the game feature-tests for): a do-nothing too, never a crash mid-step.
    return new Proxy(n, { get: (t, k) => (k in t ? t[k] : noop) });
}
function _simStep(draw) {
    if (draw) { render(); return; }
    if (_nullCtx === null) _nullCtx = _makeNullCtx() || false;
    const keep = ctx;
    let swapped = false;
    if (_nullCtx) { try { ctx = _nullCtx; swapped = true; } catch (e) { _nullCtx = false; } }
    _simGhost = true;
    try { render(); }
    finally { _simGhost = false; if (swapped) ctx = keep; }
}
function gameLoop() {
    requestAnimationFrame(gameLoop); // schedule next frame first so the loop never stops
    const now = _perfNow();
    let dt = _simLast ? now - _simLast : SIM_STEP_MS;
    _simLast = now;
    // Paused (buy screen, game over), or back from another tab: no debt.
    if (!gameState.running || dt > 1000) { _simDebt = 0; render(); return; }
    _simDebt += dt;
    if (typeof attractSkip === "function" && attractSkip(now)) return;   // the website's background draws every other frame; the steps it skipped are run with the next one (js/attract.js)
    // Rounded, not floored: a 60 Hz screen's refreshes jitter either side of
    // 16.7 ms, and flooring would turn that jitter into 0-step / 2-step stutter.
    let steps = Math.round(_simDebt / SIM_STEP_MS);
    if (steps < 1) return;                 // a 120 Hz refresh between steps
    if (steps > SIM_MAX_STEPS) { steps = SIM_MAX_STEPS; _simDebt = 0; }
    else _simDebt -= steps * SIM_STEP_MS;
    for (let i = 1; i < steps; i++) {
        _simStep(false);
        _simStepsCount++;
        if (!gameState.running) return;
        if (_perfNow() - now > SIM_BUDGET_MS) { _simDebt = 0; break; }
    }
    _perf.ghost += (Math.max(0, _perfNow() - now) - _perf.ghost) * 0.05;   // (the readout's 'catch-up': the steps with no picture that this refresh owed)
    _simStep(true);
    _simStepsCount++;
    if (now - _simStepsAt >= 1000) { _simStepsShown = Math.round(_simStepsCount * 1000 / Math.max(1, now - _simStepsAt)); _simStepsCount = 0; _simStepsAt = now; }
}

// The frame's clear: black (the facility's floors, walls and dark are painted over it).
function clearFrame() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.fillStyle = "#000"; ctx.fillRect(0, 0, canvas.width, canvas.height); }

// ─────────────────────────────────────────────────────────
//  THE FRAME: one step of the game, and its picture
// ─────────────────────────────────────────────────────────
// The order is the order things need: the page's controls first, then the logic (the player, the creatures, the dead, the effects), then the drawing (the floor and everything standing on it, depth-sorted,
// then the overlays, then the panels). gameLoop runs it 60 times a second; a step with no picture (a slow device catching up) runs the logic into a null context (_simStep).
function render() {
    if (typeof toolboxTick === "function" && typeof frame !== "undefined" && frame % 30 === 0) toolboxTick();
    if (typeof mixToolRender === "function" && typeof frame !== "undefined" && frame % 6 === 0) mixToolRender(false);   // the battle tool follows its flag (js/mixtool.js)
    if (typeof partyTick === "function" && typeof frame !== "undefined" && frame % 6 === 0) partyTick();   // the squad of three and its bar (js/party.js)
    if (typeof ccPrune === "function" && typeof frame !== "undefined" && frame % 30 === 0) ccPrune();   // the dead leave the selection
    if (typeof checkVisibleArea === "function" && (typeof frame === "undefined" || frame % VISIBLE_AREA_POLL_FRAMES === 0)) checkVisibleArea();   // the browser's real visible size, polled (js/config.js)
    if (!gameState.running) { return; } // skip all logic while paused (game over)
    perfFrameStart();

    frame++;

    // ── LONG HOLD DETECT ──
    if (isPressing&&!longHoldFired&&!touchMoved&&!_gunPressed&&!_targetPressed&&!commandPendingTap) {   // (a ring that is open and waiting for its tap: a slow tap on it is still that tap, not a new long press that closed it with nothing done)
        if (performance.now()-pressStartTime>LONG_HOLD_MS) {
            longHoldFired=true; handleLongHold(pressX,pressY);
        }
    }

    if (typeof ringHintTick === 'function') ringHintTick();

    // Health is a count of hits (PLAYER_HITS); it does not decay.
    const hpPct=health/PLAYER_HITS;
    // ── HUD updates — only write DOM when values actually change (avoids layout thrashing) ──
    const _hpInt = Math.round(health);
    if (_hpInt !== _lastHpInt) {
        _lastHpInt = _hpInt;
        hpBar.style.width = (hpPct * 100) + "%";
        // All three green, two yellow, the last one red.
        hpBar.style.background = health >= PLAYER_HITS ? "#0f8" : health >= PLAYER_HITS - 1 ? "#ff0" : "#f22";
    }

    // ── PLAYER ULTIMATE ──
    tickArmySurge();
    siphonTick();
    const _ultInt = armySurgeTimer > 0
        ? Math.ceil(armySurgeTimer / 60)          // counting the surge down
        : Math.round(playerUltimate);              // filling
    const _ultState = armySurgeTimer > 0 ? "surging"
                    : playerUltimateReady() ? "ready"
                    : (siphonEnabled && _siphonInRange === 0) ? "stalled" : "";
    // The in-range count is part of the change key, not just the label: a bar
    // stalled at the same percentage would otherwise keep its old caption when
    // the player walks away from the squad, which is the one moment the caption
    // matters.
    if (_ultInt !== _lastUltInt || _ultState !== _lastUltState) {
        _lastUltInt = _ultInt; _lastUltState = _ultState;
        if (armySurgeTimer > 0) {
            ultBar.style.width = (armySurgeTimer / ARMY_SURGE_FRAMES * 100) + "%";
            ultLabel.textContent = "SURGE " + _ultInt + "s";
        } else {
            ultBar.style.width = (playerUltimate / PLAYER_ULT_MAX * 100) + "%";
            ultLabel.textContent =
                  playerUltimateReady()            ? "TAP — ARMY SURGE"
                : !siphonEnabled                   ? "SIPHON OFF · " + _ultInt + "%"
                // The range gate has to announce itself, or a bar that has
                // stopped filling because the squad is elsewhere reads as broken.
                : _siphonInRange === 0             ? "NO SQUAD IN RANGE · " + _ultInt + "%"
                                                   : "ULTIMATE " + _ultInt + "%";
        }
        ultWrap.classList.toggle("ready",   _ultState === "ready");
        ultWrap.classList.toggle("surging", _ultState === "surging");
    }
    // The switch is its own cache: it changes on a tap, not with the bar.
    if (siphonEnabled !== _lastSiphonOn) {
        _lastSiphonOn = siphonEnabled;
        siphonBtn.classList.toggle("off", !siphonEnabled);
        _lastUltInt = -1;            // force the label to catch up
    }

    // ── PLAYER KNOCKDOWN ──
    // No stun. Being dropped to zero puts you back at the Crystal, but control
    // is never taken away. A short damage-immune window takes its place, purely
    // so a creature parked by the Crystal cannot chain-kill you on arrival.
    if (player.invuln > 0) player.invuln--;
    if (health <= 0) {
        health = PLAYER_HITS; // knocked back to the Crystal: all three hits again
        player.x = crystal.x + 2; player.y = crystal.y;
        player.targetX = player.x; player.targetY = player.y;
        player.visualX  = player.x; player.visualY  = player.y;
        player.invuln = PLAYER_RESPAWN_GRACE;
        floatingTexts.push({x:canvas.width/2, y:canvas.height/2-60, text:"◈ KNOCKED BACK TO THE CRYSTAL", color:"#ffaa33", life:100, vy:-0.25, size:14});
        shake = Math.max(shake, 8);
    }

    // ── PLAYER ATTACK COOLDOWN ──
    if (player.attackCooldown > 0) player.attackCooldown--;
    if (typeof gunTick === "function") gunTick();   // click or hold to fire: js/gunfire.js
    if (typeof mutatorTick === "function") mutatorTick();   // the Mutator's lash: walk into reach, draw back, strike (js/mutator.js)
    if (typeof mutatorBodiesTick === "function") mutatorBodiesTick();   // a fallen clone's body (js/mutator.js)
    if (typeof specimenTick === "function") specimenTick();   // the Ice Mage preserving a body; the capsule taken (js/specimen.js)
    if (typeof techAbilityTick === "function") techAbilityTick();   // the technicians' abilities: throws, launchers, broken sections (js/techabilities.js)
    if (typeof serumTick === "function") serumTick();   // the serum's pools heal; the Mutator's laboratory makes serum (js/serum.js)
    if (typeof technoTick === "function") technoTick();   // the grid charges the Technomancer's gauntlet; its arcs fade (js/technomancer.js)
    if (typeof targetTick === "function") targetTick();   // the aim meter and the selection: js/targeting.js
    // The crystals, at the top left: only the change touches the page.
    if (shardCount !== _lastShardCount) { _lastShardCount = shardCount; shardUI.textContent = String(shardCount); }
    // The ALARM is a red triangle beside the room tag (css: body.alarm-on). Only the change touches the page.
    const _alarmOn = !!alertActive;
    if (_alarmOn !== _lastAlarmOn) { _lastAlarmOn = _alarmOn; if (document.body && document.body.classList) document.body.classList.toggle("alarm-on", _alarmOn); }
    const _panelOpen = !!(cloneMenuOpen || settingsPanelOpen || infoPanelOpen || (typeof invPanelOpen !== "undefined" && invPanelOpen) || (typeof armoryPanelOpen !== "undefined" && armoryPanelOpen) || (typeof classPickerOpen !== "undefined" && classPickerOpen));
    if (document.body && document.body.classList && document.body.classList.contains("info-open") !== !!infoPanelOpen) document.body.classList.toggle("info-open", !!infoPanelOpen);
    if (_panelOpen !== _lastPanelOpen) { _lastPanelOpen = _panelOpen; if (document.body && document.body.classList) document.body.classList.toggle("panel-open", _panelOpen); }
    // The room tag names the room the player is in (js/facilitynet.js): cached element, written only on a change.
    const _fpz = typeof facilityZoneName === "function" ? facilityZoneName() : null;
    if (_fpz !== null && _fpz !== _lastZoneName) { _lastZoneName = _fpz; if (!_zoneEl) _zoneEl = document.getElementById("zoneInfo"); if (_zoneEl) _zoneEl.textContent = _fpz; }

    // ── CRYSTAL DEATH CHECK ──
    if (crystal.health<=0) { showGameOver(); return; }
    // Slow recovery while no alarm is up (see CRYSTAL_REGEN).
    if (!alertActive && crystal.health < crystal.maxHealth) crystal.health = Math.min(crystal.maxHealth, crystal.health + CRYSTAL_REGEN);

    // ── THE ALARM runs down, unless something keeps feeding it (the tutorial's assault does: js/tutorial.js) ──
    if (alertActive) { alertTimer--; if (alertTimer <= 0) clearAlarm(); }

    // ── CLEAR SCREEN ──
    clearFrame();
    ctx.save();
    if (shake>0) { ctx.translate((Math.random()-0.5)*shake,(Math.random()-0.5)*shake); shake*=0.9; }

    // ── THE PLAYER: a path of waypoints and real walls (js/facilityplay.js) ──
    facilityPlayerStep();

    // ── UPDATE HAZARDS ──

    // ── UPDATE ACTORS ──
    actors.forEach(a=>updateNPC(a));

    // ── FOLLOWER SEPARATION — push overlapping followers apart ──
    // Uses `followers` (already filtered live followers) instead of actors.filter every frame.
    // Squared-distance early exit avoids sqrt for non-overlapping pairs (the common case).
    // Swept in x order: two followers further apart along x than the push distance cannot
    // overlap, so each one only meets its neighbours.
    const _SEP2 = FOLLOWER_SEP * FOLLOWER_SEP;
    const _fl = followers.slice().sort((p, q) => p.x - q.x);
    for (let _i = 0; _i < _fl.length; _i++) {
        for (let _j = _i+1; _j < _fl.length; _j++) {
            const _a = _fl[_i], _b = _fl[_j], _ax0 = _a.x, _ay0 = _a.y, _bx0 = _b.x, _by0 = _b.y;
            if (_b.x - _a.x >= FOLLOWER_SEP) break;
            if (_a._flight || _b._flight) continue;   // (one in the air, thrown by a Kinetic Launcher, is not jostled: js/techabilities.js)
            const _dx = _b.x - _a.x, _dy = _b.y - _a.y;
            const _d2 = _dx*_dx + _dy*_dy;
            if (_d2 >= _SEP2 || _d2 < 0.000001) continue;
            const _d = Math.sqrt(_d2);
            const _p = (1/_d) * (FOLLOWER_SEP - _d) * 0.5;
            _a.x -= _dx*_p; _a.y -= _dy*_p;
            _b.x += _dx*_p; _b.y += _dy*_p;
            // Jostling is still bounded by the walls. This pass runs AFTER the
            // per-actor constraint in updateNPC, so without this a crowd pressed up
            // against a wall pushed itself straight through it.
            facilityConstrain(_a, _ax0, _ay0); facilityConstrain(_b, _bx0, _by0);
        }
    }

    if (typeof fireBombsTick === "function") fireBombsTick();   // the bouncing fire bombs and the ground they burn (js/firebombs.js)

    // ── RED HEALTH DECAY ──
    // Skips a neutral recruit. The decay bleeds enemies that have wandered off; a recruit is on team red only for bookkeeping until it joins.
    actors.forEach(a=>{ if(a.team==="red" && !isNeutralBystander(a)){a.health-=0.01; if(a.health<=0){a.health=0;a.dead=true;}} });

    // ── REMOVE DEAD NPCs, respawn ──
    actors.forEach(a=>{
        if (a.dead&&a.team==="green"&&!a.queuedForRespawn&&!a.sacrificed) {
            a.queuedForRespawn=true;
            if (typeof bondOnDeath === "function") bondOnDeath(a);   // the partner rages; the bond ends
            // A clone DISMISSED at the Clone Bay is gone: it does not come back (it did, 20 seconds later, and filled the slot DISMISS had just freed).
            if (a.isClone && a.dismissed) return;
            // The Mutator's clone does not come back by itself: its body stays where it fell (js/mutator.js).
            if (a.isClone && a.primary) { if (typeof cloneFallen === "function") cloneFallen(a); return; }
            // The HP stat that wears down with each death is the BASE one
            // (js/levels.js); its level scales it back up.
            const oldHp = a.base?.hp ?? a.stats?.hp ?? 1;
            const newHp = oldHp - 1;
            // A clone has no HP stat to wear down: it always comes back. Running out of HP stat is permanent: the follower's body stays where it fell, and an Ice Mage can preserve it (js/specimen.js).
            if (newHp<=0 && !a.isClone) { if (typeof specimenFollowerFell === "function") specimenFollowerFell(a); return; } // permanent death — don't queue
            // A clone takes far longer to come back than a follower: it is
            // worth three times as much in a fight and cost crystals and DNA, so
            // losing one has to be felt. The Crystal shows the countdown.
            const _respawnFrames = a.isClone ? CLONE_RESPAWN_FRAMES : 180;
            respawnQueue.push({ element:a.element, role:a.role, combatTrait:a.combatTrait, naturalTrait:a.naturalTrait, perk:a.perk, personality:a.personality, timer:_respawnFrames, totalTimer:_respawnFrames, isClone:a.isClone||false, speciesName:a.speciesName, className:a.className, hpStat:Math.max(1,newHp), uid:a.uid,
                // Its level comes back with it, less some XP (js/levels.js).
                base: a.base ? Object.assign({}, a.base, { hp: Math.max(1, newHp) }) : undefined,
                level: a.level, xp: typeof xpAfterDeath === "function" ? xpAfterDeath(a) : a.xp,
                evolved: a.evolved || undefined, evoWait: a._evoOnLevelUp || undefined, post: a.post || undefined, playStyle: a.playStyle || undefined, move: a.move || undefined });
        }
        // A kill, once: XP to whoever killed it and those fighting near it (js/levels.js).
        // isEnemyUnit, NOT isHostileTarget: the latter refuses anything dead. What is being asked here is whose side the corpse was on.
        if (a.dead && isEnemyUnit(a) && !a.progressCounted) {
            a.progressCounted = true;
            if (typeof awardKillXp === "function") awardKillXp(a);
        }
    });

    // Every dead creature exactly once: what it leaves (js/drops.js)
    actors.forEach(a => {
        if (a instanceof Predator && a.dead && !a.deathProcessed && a.team !== "green") { a.deathProcessed = true; lifetimeKills++; onPredatorDeath(a); }
    });
    actors=actors.filter(a=>!a.dead);
    const _prevFL=followers.length;
    followers=followers.filter(a=>!a.dead&&a.team==="green");
    if (followers.length!==_prevFL) rebuildFollowerTable();

    if (typeof evolutionTick === "function") evolutionTick();     // the level-10 egg sheds (js/evolution.js EVOLVE_LEVEL)

    updateStatusEffects();
    if (typeof bondTick === "function") bondTick();
    updateElementEffects();
    updateFloatingTexts();

    // ── THE FOLLOWERS' ULTIMATE CHARGE ── every 60 frames: 1 a tick, twice that near the Crystal
    if (frame % 60 === 0 && followers.length > 0) {
        const nearCrystal = Math.hypot(player.x - crystal.x, player.y - crystal.y) < 3.0, chargeGain = nearCrystal ? 2 : 1;
        followers.forEach(f => {
            if (f.dead) return;
            if (typeof f.ultimateCharge !== "number") f.ultimateCharge = 0;
            f.ultimateCharge = Math.min(100, f.ultimateCharge + chargeGain);
        });
    }

    // ── TANK SHIELD PULSE — tanks pulse 1 shield to nearby allies every 3s ──
    // ── BOSS SHIELD AURA — bosses continuously shield all nearby allies ──
    actors.forEach(actor => {
        if (actor.dead || actor.team === "green" || actor.isClone) return;
        const isTank = actor.className === "tank";
        const isBoss = actor.isBoss;
        if (!isTank && !isBoss) return;

        // Tank: pulse shield every 180 frames to 1 nearby ally
        if (isTank) {
            if (!actor.shieldPulseTimer) actor.shieldPulseTimer = 0;
            actor.shieldPulseTimer++;
            if (actor.shieldPulseTimer >= 180) {
                actor.shieldPulseTimer = 0;
                // Find nearest ally (red team, not self)
                let nearest = null, bd = Infinity;
                actors.forEach(a => {
                    if (a === actor || a.dead || a.team !== "red") return;
                    const d = Math.hypot(a.x - actor.x, a.y - actor.y);
                    if (d < 4 && d < bd) { bd = d; nearest = a; }
                });
                if (nearest) {
                    nearest.shielded = true;
                    nearest.shieldAmount = (nearest.shieldAmount||0) + 1;
                }
            }
        }

        // Boss: continuously shield all nearby allies
        if (isBoss) {
            if (!actor.shieldAuraPulse) actor.shieldAuraPulse = 0;
            actor.shieldAuraPulse++;
            if (actor.shieldAuraPulse >= 60) { // every 1s
                actor.shieldAuraPulse = 0;
                actors.forEach(a => {
                    if (a === actor || a.dead || a.team !== "red") return;
                    const d = Math.hypot(a.x - actor.x, a.y - actor.y);
                    if (d < (actor.shieldAuraRadius || 5)) {
                        a.shielded = true;
                        a.shieldAmount = Math.min((a.shieldAmount||0) + 3, 15);
                    }
                });
            }
        }
    });

    // ── BUILD DRAW LIST ──
    // The toxic ultimate's smoke, drawn per tile in the depth pass (there is rarely more than one)
    const smokeFx = elementEffects.filter(e => e.type === "smokeScreen");

    // Culled in SCREEN space by visibleForDraw — see its comment for why the
    // old column-distance filter kept half the frame's work off screen. The
    // player and the crystal are never culled: the player IS the camera, and
    // the crystal is a fixed landmark other code expects in the list.
    perfDrawStart();   // the logic is done; from here on it is drawing
    // A step with NO PICTURE (gameLoop: a device that is behind runs several a frame) draws no floor tile and no item: the walls, doors, props and floors were ~7 ms of drawing into a null context, three
    // times a frame at 15 fps, which made the frame longer and so owed more of them. Nothing in them is logic (audited): the facility's per-step logic (the light, the tick, the doors) runs in facilityDrawItems (js/facilityplay.js).
    let drawList=_simGhost?[]:visibleTilesForDraw();
    drawList.push({type:'player',x:player.visualX,y:player.visualY});
    // A catch-up step (gameLoop) draws nothing, and drawing a unit changes
    // nothing — so its units are not even laid out: the predators' body maths
    // was the biggest share of a step with no picture.
    if (!_simGhost) actors.forEach(a=>{ if(visibleForDraw(a.x,a.y)) drawList.push({type:'npc',x:a.x,y:a.y,actor:a}); });
    if (!_simGhost && typeof cloneBodiesDrawItems === "function") cloneBodiesDrawItems(drawList);   // a fallen clone's body (js/mutator.js)
    if (!_simGhost && typeof techDrawItems === "function") techDrawItems(drawList);   // a Kinetic Launcher set up at a site, and the broken section the site's room is left by (js/techabilities.js)
    drawList.push({type:'crystal',x:crystal.x,y:crystal.y});
    facilityDrawItems(drawList);   // walls, props, doors and fixtures (js/facilityplay.js)
    // Each item's depth once, not twice per comparison (n log n calls).
    for (let i = 0; i < drawList.length; i++) drawList[i]._dd = drawDepthOf(drawList[i]);
    drawList.sort((a,b)=>a._dd-b._dd);

    // The pools of material evolved followers stand in (js/evolution.js GROUND): painted by the floor tiles below.
    if (!_simGhost && typeof evoGroundBegin === "function") evoGroundBegin();

    // ── DRAW EACH OBJECT ──
    drawList.forEach(obj=>{
        const px=(obj.x-player.visualX-(obj.y-player.visualY))*TILE_W+canvas.width/2;
        let py=(obj.x-player.visualX+(obj.y-player.visualY))*TILE_H+canvas.height/2;
        if (obj.type !== 'fp') py -= facilityLiftRel(obj.x, obj.y);   // the facility's floors rise and fall (js/facilityplay.js)

        if (obj.type==='player') {
            if (!(typeof attractOn === "function" && attractOn())) drawPlayer({x:px,y:py});   // (the website's background has no one standing in it: the player is only its camera, js/attract.js)
        }
        else if (obj.type==='fp') {
            drawFacilityItem(obj);
        }
        else if (obj.type==='npc') {
            if (typeof facilityEnemyGlow === "function") facilityEnemyGlow(obj.actor, px, py);   // an enemy in a blackout shows a hostile glow on the floor under it (js/facilitytutorial.js)
            drawNPC(obj.actor, px, obj.actor._flight && typeof techFlightLift === "function" ? py - techFlightLift(obj.actor) : py);   // (one thrown by a Kinetic Launcher is drawn up in the air: js/techabilities.js)
        }
        else if (obj.type==='tech') {
            if (typeof techDrawItem === "function") techDrawItem(obj, px, py);
        }
        else if (obj.type==='body') {
            if (typeof drawCloneBody === "function") drawCloneBody(obj.body, px, py);
        }
        else if (obj.type==='crystal') {
            // ── FLOATING GEM ──
            // A faceted octahedron hovering over its own light pool, turning
            // slowly. Colour tracks health: cyan-blue while healthy, amber when
            // hurt, red when critical, with the spin and flicker getting more
            // agitated as it fails.
            const hpR   = Math.max(0, Math.min(1, crystal.health / crystal.maxHealth));
            const hurt  = 1 - hpR;
            const bob   = Math.sin(frame * 0.028) * 6;
            const rot   = frame * (0.010 + hurt * 0.012);
            const pulse = 0.72 + 0.28 * Math.sin(frame * 0.06);
            // A failing crystal stutters; a healthy one burns steady.
            const flick = hpR < 0.5
                ? (Math.sin(frame * 0.37) > 0.72 ? 0.45 + 0.55 * Math.abs(Math.sin(frame * 2.1)) : 1)
                : 1;

            const rgb  = hpR > 0.5 ? [ 90, 200, 255]
                       : hpR > 0.2 ? [255, 168,  60]
                                   : [255,  70,  70];
            const deep = hpR > 0.5 ? [ 20,  70, 160]
                       : hpR > 0.2 ? [150,  70,   0]
                                   : [130,  16,  16];
            const rs = (v, m) => `rgba(${rgb[0]},${rgb[1]},${rgb[2]},${v * m})`;

            const cx  = px;
            const gy  = py - 64 + bob;   // gem centre (a dozen px higher than it once hovered, over the facility's taller pad, js/facilitystyle.js FP_PAD)
            const rx  = 27, ry = 13.5;               // equator radii (2:1 iso)
            const topY = 42, botY = 32;              // apex heights

            ctx.save();

            // ── Light pool on the floor, so it reads as hovering ──
            const poolY = py + TILE_H * 0.4;
            const poolR = 46 + pulse * 6;
            const pool  = ctx.createRadialGradient(cx, poolY, 2, cx, poolY, poolR);
            pool.addColorStop(0,   rs(0.30 * flick, 1));
            pool.addColorStop(0.45,rs(0.10 * flick, 1));
            pool.addColorStop(1,   rs(0, 1));
            ctx.save();
            ctx.translate(cx, poolY); ctx.scale(1, 0.4); ctx.translate(-cx, -poolY);
            ctx.fillStyle = pool;
            ctx.beginPath(); ctx.arc(cx, poolY, poolR, 0, Math.PI * 2); ctx.fill();
            ctx.restore();

            // ── Outer halo ──
            const halo = ctx.createRadialGradient(cx, gy, 4, cx, gy, 62);
            halo.addColorStop(0, rs(0.26 * pulse * flick, 1));
            halo.addColorStop(1, rs(0, 1));
            ctx.fillStyle = halo;
            ctx.beginPath(); ctx.arc(cx, gy, 62, 0, Math.PI * 2); ctx.fill();

            // ── The gem itself: four equator points, an apex above and below ──
            const eq = [];
            for (let k = 0; k < 4; k++) {
                const a = rot + k * Math.PI / 2;
                eq.push({ x: cx + Math.cos(a) * rx, y: gy + Math.sin(a) * ry, a });
            }
            const apexT = { x: cx, y: gy - topY };
            const apexB = { x: cx, y: gy + botY };

            // Each face is one equator edge plus an apex. Sorting by the edge's
            // screen depth draws the far side first, so the near facets sit on top.
            const faces = [];
            for (let k = 0; k < 4; k++) {
                const p1 = eq[k], p2 = eq[(k + 1) % 4];
                const mid = (p1.y + p2.y) * 0.5;
                const lit = 0.5 + 0.5 * Math.cos((p1.a + p2.a) * 0.5 - Math.PI * 0.75);
                faces.push({ pts: [p1, p2, apexT], depth: mid, lit, up: true });
                faces.push({ pts: [p1, p2, apexB], depth: mid, lit: lit * 0.55, up: false });
            }
            faces.sort((a, b) => a.depth - b.depth);

            for (const f of faces) {
                const base = f.up ? 0.30 : 0.16;
                const v    = (base + f.lit * 0.62) * flick;
                ctx.beginPath();
                ctx.moveTo(f.pts[0].x, f.pts[0].y);
                ctx.lineTo(f.pts[1].x, f.pts[1].y);
                ctx.lineTo(f.pts[2].x, f.pts[2].y);
                ctx.closePath();
                ctx.fillStyle = `rgba(${(deep[0] + (rgb[0] - deep[0]) * v) | 0},` +
                                `${(deep[1] + (rgb[1] - deep[1]) * v) | 0},` +
                                `${(deep[2] + (rgb[2] - deep[2]) * v) | 0},0.93)`;
                ctx.fill();
                ctx.strokeStyle = rs(0.42 + f.lit * 0.52, flick);
                ctx.lineWidth = 1.2;
                ctx.stroke();
            }

            // ── Inner core, seen through the facets ──
            ctx.globalCompositeOperation = 'lighter';
            const core = ctx.createRadialGradient(cx, gy, 0, cx, gy, 22);
            core.addColorStop(0, `rgba(255,255,255,${0.55 * pulse * flick})`);
            core.addColorStop(0.4, rs(0.30 * pulse * flick, 1));
            core.addColorStop(1, rs(0, 1));
            ctx.fillStyle = core;
            ctx.beginPath(); ctx.arc(cx, gy, 22, 0, Math.PI * 2); ctx.fill();
            ctx.globalCompositeOperation = 'source-over';

            // ── Motes orbiting the gem ──
            for (let m = 0; m < 5; m++) {
                const ma = frame * 0.02 + m * (Math.PI * 2 / 5);
                const mr = 30 + Math.sin(frame * 0.05 + m) * 5;
                const mx = cx + Math.cos(ma) * mr;
                const my = gy + Math.sin(ma) * mr * 0.42 + Math.sin(frame * 0.04 + m * 2) * 4;
                ctx.fillStyle = rs(0.30 + 0.35 * Math.sin(frame * 0.09 + m), flick);
                ctx.beginPath(); ctx.arc(mx, my, 1.7, 0, Math.PI * 2); ctx.fill();
            }

            // ── Fracture lines once it is badly hurt ──
            if (hpR < 0.55) {
                const ca = Math.min(1, (0.55 - hpR) * 2.2);
                ctx.strokeStyle = `rgba(255,${(90 * (1 - ca)) | 0},60,${ca * 0.8})`;
                ctx.lineWidth = 1.2;
                for (let c = 0; c < 3; c++) {
                    const a0 = rot * 0.4 + c * 2.1;
                    ctx.beginPath();
                    ctx.moveTo(cx + Math.cos(a0) * 4, gy + Math.sin(a0) * 2);
                    ctx.lineTo(cx + Math.cos(a0) * rx * 0.8, gy + Math.sin(a0) * ry * 0.8 - 6);
                    ctx.lineTo(cx + Math.cos(a0 + 0.5) * rx * 0.6, gy + Math.sin(a0) * ry - topY * 0.35);
                    ctx.stroke();
                }
            }

            ctx.restore();

            drawHealthBar(px - 25, py - 118 + bob, 50, 7, crystal.health, crystal.maxHealth);
            drawCloneRespawnTicker(px, py - 130 + bob);
            if (hpR < 0.3 && frame % 30 < 15) {
                ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
                ctx.fillStyle = "rgba(255,0,0,0.08)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.restore();
            }
        }
        else if (obj.type==='floor') {
            const dist=Math.sqrt((obj.x-player.visualX)**2+(obj.y-player.visualY)**2);
            // THE TILE IS A SPRITE (_floorTileSprite): its look depends only on the distance to the camera, so each look is drawn once and stamped.
            const _spr = _floorTileSprite(Math.round(dist / FLOOR_DIST_STEP));
            if (_spr) ctx.drawImage(_spr, px - TILE_W - 1, py - 1);
            else _drawFloorTile(ctx, px, py, dist);
            if (typeof drawEvoGroundOnTile === "function") drawEvoGroundOnTile(obj.x, obj.y, px, py);   // pools of evolved followers lie on the floor
            if (typeof drawFireOnTile === "function") drawFireOnTile(obj.x, obj.y, px, py);   // burning ground (js/firebombs.js)
            facilityDrawFloorOn(obj, px, py);   // the facility's floor coverings and decals (js/facilitydecor.js)
            if (typeof drawSerumOnTile === "function") drawSerumOnTile(obj.x, obj.y, px, py);   // a healing serum's pool (js/serum.js)
            if (typeof techDrawOnTile === "function") techDrawOnTile(obj.x, obj.y, px, py);   // a Frost Patch's ice, a Blight Spider's pool (js/techabilities.js)

            // ── 3D SMOKE TILES — toxic ultimate: creeping raised slabs + single wisp ──
            for (const sE of smokeFx) {
                const elapsed        = sE.maxLife - sE.life;
                const distFromCaster = Math.hypot(obj.x - sE.x, obj.y - sE.y);
                const spreadRadius   = Math.min(elapsed / 5, SMOKE_SCREEN_REACH); // ~1 tile per 5 frames, out to its reach
                if (distFromCaster < spreadRadius) {
                    const arrivalT = Math.min(1, (spreadRadius - distFromCaster) / 4);
                    const fadeOut  = Math.min(1, sE.life / 90);
                    const factor   = arrivalT * fadeOut;
                    // A 0.08 tint on the tile and a slow wisp on one tile in three.
                    const seed     = obj.x * 17.3 + obj.y * 11.7;
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(px, py); ctx.lineTo(px + TILE_W, py + TILE_H);
                    ctx.lineTo(px, py + TILE_W); ctx.lineTo(px - TILE_W, py + TILE_H);
                    ctx.closePath();
                    ctx.fillStyle = `rgba(150, 130, 220, ${0.08 * factor})`;
                    ctx.fill();
                    if ((Math.round(obj.x) + Math.round(obj.y) * 2) % 3 === 0) {
                        const u = ((frame * 0.5 + seed * 3) % 90) / 90;
                        const wy = py + TILE_H - u * 20;
                        ctx.strokeStyle = `rgba(200, 180, 255, ${0.35 * factor * (1 - u)})`;
                        ctx.lineWidth = 1.2;
                        ctx.beginPath(); ctx.moveTo(px - 8, wy);
                        ctx.bezierCurveTo(px - 2, wy - 8, px + 4, wy + 4, px + 10, wy - 6); ctx.stroke();
                    }
                    ctx.restore();
                }
            }

            // The tile a long-press ring was opened on (js/input.js handleLongHold): lit while the ring is up
            if (commandMode&&commandTarget===obj) {
                ctx.save();
                ctx.strokeStyle="rgba(0,255,136,0.9)"; ctx.lineWidth=3;
                ctx.beginPath(); ctx.moveTo(px,py); ctx.lineTo(px+TILE_W,py+TILE_H); ctx.lineTo(px,py+TILE_W); ctx.lineTo(px-TILE_W,py+TILE_H); ctx.closePath(); ctx.stroke();
                ctx.strokeStyle="rgba(0,255,136,0.25)"; ctx.lineWidth=8; ctx.stroke();
                ctx.restore();
            }
        }
    });

    // ── THE NETWORK PANEL: the relays and the rooms with power (js/facilitynet.js) ──
    drawFacilityNetworkHUD();

    // ── SMOKE ──
    // Smoke is stored as world anchor (wx,wy) + screen offset (ox,oy) so particles
    // stay fixed to their position regardless of camera movement.
    // Iterate backwards so splice doesn't skip elements.
    if (gfxLow && smoke.length) smoke.length = 0;          // LOW graphics: no smoke
    for (let i=smoke.length-1; i>=0; i--) {
        const sm=smoke[i];
        sm.ox+=sm.vox; sm.oy+=sm.voy; sm.life-=0.025; sm.size+=0.25;
        if(sm.life<=0){smoke.splice(i,1);continue;}
        const bpx=(sm.wx-player.visualX-(sm.wy-player.visualY))*TILE_W+canvas.width/2;
        const bpy=(sm.wx-player.visualX+(sm.wy-player.visualY))*TILE_H+canvas.height/2;
        ctx.save(); ctx.globalAlpha=sm.life; ctx.fillStyle=cfg.smokeColor;
        ctx.beginPath(); ctx.ellipse(bpx+sm.ox,bpy+sm.oy,sm.size,sm.size*0.5,0,0,Math.PI*2); ctx.fill();
        ctx.restore();
    }

    // ── FRAGMENTS ──
    // Iterate backwards so splice doesn't skip elements.
    if (gfxLow && fragments.length) fragments.length = 0;  // …and no debris
    for (let i=fragments.length-1; i>=0; i--) {
        const f=fragments[i];
        f.x+=f.vx; f.y+=f.vy; f.vy+=0.5; f.life-=0.02;
        ctx.fillStyle=f.col; ctx.globalAlpha=f.life; ctx.fillRect(f.x,f.y,6,6);
        if(f.life<=0) fragments.splice(i,1);
    }
    ctx.globalAlpha=1;

    // ── RESPAWN QUEUE ──
    for(let i=respawnQueue.length-1;i>=0;i--) {
        const entry=respawnQueue[i]; entry.timer--;
        if(entry.timer<=0){
            if (entry.isClone && entry.speciesName) {
                // Respawn as clone: makeClone, so a respawned clone is the same thing the summon built.
                const clone = makeClone(entry.speciesName, entry.className, crystal.x, crystal.y, undefined, { level: entry.level, xp: entry.xp });
                if (!clone) { respawnQueue.splice(i,1); continue; }
            } else {
                // Respawn as a follower — apply HP stat degradation
                const def         = NPC_TYPES["virus"];
                const personality = entry.personality || PERSONALITY_KEYS[Math.floor(Math.random()*PERSONALITY_KEYS.length)];
                const stats       = applyPersonality(personality);
                if (entry.hpStat!==undefined) stats.hp = entry.hpStat;
                // The same follower comes back: its element, and an EVOLVED one as the same machine (its element and role are its form's).
                const rElement    = entry.element || "fire";
                const _evo        = entry.evolved && typeof EVOLUTIONS !== "undefined" ? EVOLUTIONS[entry.evolved] : null;
                const role        = _evo && _evo.role ? _evo.role : assignRole(stats);
                const npc = {
                    type:"virus", element:rElement, x:crystal.x, y:crystal.y, team:"green",
                    health: stats.hp, maxHealth: stats.hp,
                    moveSpeed: def.moveSpeed + (stats.speed - 10) * 0.001,
                    power: stats.attack,
                    stats, personality, role,
                    currentResonance: 0,
                    currentWill: stats.will,
                    walkCycle:0, moveCooldown:0, stance:"follow", isFollower:true, isHealing:false,
                    hitFlash:0, dead:false, attackAnim:0, state:"idle",
                    combatTrait:entry.combatTrait, naturalTrait:entry.naturalTrait, perk:entry.perk
                };
                // The same person back — same uid — but the bond did not survive.
                if (typeof bondRestoreFields === "function") bondRestoreFields(npc, { uid: entry.uid });
                if (entry.playStyle) npc.playStyle = entry.playStyle;   // its play style (js/commandcenter.js)
                if (entry.move) npc.move = entry.move;   // the signature move it was given (js/moves.js)
                if (_evo) npc.evolved = _evo.id;   // before its level, so the evolved stats apply
                if (entry.evoWait) npc._evoOnLevelUp = true;   // an egg again until it next levels up (js/evolution.js)
                // Its level and XP (less what dying cost) — js/levels.js.
                if (typeof initFollowerLevel === "function") initFollowerLevel(npc, { base: entry.base, level: entry.level, xp: entry.xp, hpStat: entry.hpStat });
                if (entry.post) { npc.post = entry.post; npc.stance = "hold"; }   // a follower that held a room goes back to it (js/party.js)
                actors.push(npc); followers.push(npc);
                if(!followerByElement[rElement]) followerByElement[rElement]=[];
                followerByElement[rElement].push(npc);
                if (typeof partyAdmit === "function") partyAdmit(npc);   // (the squad's slot may have been taken while it was gone: then it is posted where it stands)
            }
            respawnQueue.splice(i,1);
        }
    }

    // ── FOLLOWER PROJECTILES ──
    followerProjectiles = followerProjectiles.filter(p => {
        p.x += p.vx; p.y += p.vy; p.life--;
        if (p.targetsGreen && typeof techShieldStopsShot === "function" && techShieldStopsShot(p)) return false;   // an enemy's shot stops at a Photonic Shield (js/techabilities.js); yours go through
        p.frame = (p.frame || 0) + 1;
        // Arc height for parabolic bombs (screen-space offset only)
        if (p.arcData) {
            const arcT = Math.max(0, 1 - p.life / p.arcData.totalFrames);
            p.arcData.screenOffset = p.arcData.peakHeight * Math.sin(arcT * Math.PI);
        }
        // Screen coords
        const sx=(p.x-player.visualX-(p.y-player.visualY))*TILE_W+canvas.width/2;
        const sy=(p.x-player.visualX+(p.y-player.visualY))*TILE_H+canvas.height/2 - 40;
        // Draw element-specific projectile
        _drawFollowerProjectile(ctx, p, sx, sy);
        // Landing callback for arc bombs when they expire
        if (p.life <= 0 && p.onLand) p.onLand();
        // Hit detection (skipped for bombs that trigger onLand instead)
        let hit = false;
        if (!p.noHitDetect) {
            actors.forEach(a => {
                if (hit || a.dead) return;
                const isTarget = p.targetsGreen
                    ? a.team === "green" && !(typeof techShieldBetween === "function" && techShieldBetween(p.x, p.y, a.x, a.y))   // (an enemy's shot hits nothing on the far side of a Photonic Shield: js/techabilities.js)
                    : isHostileTarget(a);
                if (isTarget) {
                    const dx=(p.x-a.x)*TILE_W, dy=(p.y-a.y)*TILE_H;
                    if (Math.hypot(dx,dy) < 30) {
                        applyDamage(a, p.damage, p.source);
                        if (p.onHit) p.onHit(a);
                        hit = true;
                    }
                }
            });
            // A creature's shot never hits the player — it hurts you only by biting you up close (js/predator.js). The round passes you by.
        }
        return !hit && p.life > 0;
    });
    if (typeof drawFireBombs === "function") drawFireBombs();   // fire bombs in flight (js/firebombs.js)
    if (typeof facilityDrawOverlay === "function") facilityDrawOverlay();   // the monitor lamp's colour, flares, CCTV marks and the station plate (js/facilitytutorial.js)

    ctx.restore();

    // ── OVERLAYS ──
    drawElementEffects();
    if (!gfxLow) drawSiphonWisps();
    if (typeof drawSelectedUnitRings === "function") drawSelectedUnitRings();   // the units picked in the Command Center
    if (typeof drawBonds === "function") drawBonds();
    if (typeof drawBiteTelegraphs === "function") drawBiteTelegraphs();   // a creature rearing back to bite, and whom (js/combat.js)
    if (typeof drawMutatorFx === "function") drawMutatorFx();   // the Mutator's lash, the Technomancer's punch (js/mutator.js)
    if (typeof drawTechnoFx === "function") drawTechnoFx();   // the Technomancer's arc (js/technomancer.js)
    if (typeof drawSpecimenOverlay === "function") drawSpecimenOverlay();   // the Ice Mage's beam; the Resurrection Zone and its plate (js/specimen.js)
    if (typeof drawSerumOverlay === "function") drawSerumOverlay();   // the allies a serum's pool is healing (js/serum.js)
    if (typeof techDrawOverlay === "function") techDrawOverlay();   // a launcher site's highlight and label, the arc a launcher throws on, the aim's rings, a flyer's shadow (js/techabilities.js)
    drawFloatingTexts();
    // The clone bay first, then its button over it, so the button that
    // opened the bay (and closes it) is never dimmed by the bay's backdrop.
    drawCloneMenu();
    if (!dockHasMenus()) drawClonesBlob();
    drawRadialMenu();
    drawInfoPanel();
    if (typeof drawInvPanel === "function") { drawInvPanel(); drawClassPicker(); if (typeof drawArmoryPanel === "function") drawArmoryPanel(); }   // the pack and the class picker (js/inventory.js, js/classes.js)
    if (typeof drawLockReticle === "function") drawLockReticle();   // the lock-on's corners (js/gunfire.js)
    if (typeof drawTargetUI === "function") drawTargetUI();   // the selection, the aim meter and the index card (js/targeting.js)
    if (!dockHasMenus() && !infoPanelOpen) drawSettingsButton();   // a phone has no dock: its round SETTINGS button (js/settings.js)
    drawSettingsPanel();
    perfFrameEnd();
}

// ── THE PERFORMANCE READOUT (Settings → PERFORMANCE) ──────
// Measured on the device: frames a second, the game's logic and its drawing
// per frame (smoothed), the worst frame in the last second, and how much is
// on the map. The browser's own painting happens after the frame, so a low
// FPS with small logic and draw times points at the painting, not the game.
const _perf = { last: 0, fps: 0, logic: 0, draw: 0, ghost: 0, worst: 0, shownWorst: 0, winAt: 0, t0: 0, tDraw: 0 };   // (ghost: what the steps with no picture cost a refresh)
function _perfNow() { return (typeof performance !== "undefined" && performance.now) ? performance.now() : Date.now(); }
function perfFrameStart() {
    if (_simGhost) return;       // a step with no picture is not a frame
    const n = _perfNow();
    if (_perf.last) { const dt = n - _perf.last; if (dt > 0 && dt < 1000) _perf.fps += (1000 / dt - _perf.fps) * 0.05; }
    _perf.last = n; _perf.t0 = n; _perf.tDraw = 0;
}
function perfDrawStart() { if (!_simGhost) _perf.tDraw = _perfNow(); }
function perfFrameEnd() {
    if (_simGhost) return;
    const n = _perfNow();
    if (!_perf.tDraw) _perf.tDraw = n;
    const L = _perf.tDraw - _perf.t0, D = n - _perf.tDraw;
    _perf.logic += (L - _perf.logic) * 0.05; _perf.draw += (D - _perf.draw) * 0.05;
    _perf.worst = Math.max(_perf.worst, L + D);
    if (n - _perf.winAt > 1000) { _perf.shownWorst = _perf.worst; _perf.worst = 0; _perf.winAt = n; }
    if (perfReadout) drawPerfReadout();
}
function drawPerfReadout() {
    // Where a frame goes: the game's logic and the drawing of the step that is shown, the steps with no picture a slow refresh owes, and the rest (the browser painting, the page's own controls, waiting for the screen).
    const gap = _perf.fps > 0 ? 1000 / _perf.fps : 0, other = Math.max(0, gap - _perf.logic - _perf.draw - _perf.ghost);
    const lines = [
        "FPS " + Math.round(_perf.fps) + "   GAME " + (_simStepsShown || "-") + "/s   GFX " + (gfxLow ? "LOW" : "HIGH"),
        "frame " + gap.toFixed(0) + " ms = logic " + _perf.logic.toFixed(1) + " + draw " + _perf.draw.toFixed(1),
        "      + catch-up " + _perf.ghost.toFixed(1) + " + browser " + other.toFixed(1),
        "steps/frame " + (_simStepsShown && _perf.fps ? (_simStepsShown / _perf.fps).toFixed(1) : "-") + "   canvas " + canvas.width + "x" + canvas.height + "  (" + resizeCount + " sizings)",
        (typeof facilityBlackout === "function" && facilityBlackout() ? "DARK" : "LIT") + "   " + (typeof facilityZoneName === "function" ? facilityZoneName() : ""),
        "worst frame " + _perf.shownWorst.toFixed(0) + " ms",
        "units " + actors.length + "   tiles " + world.length,
    ];
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const x = 8, y = 96, w = 252, h = 12 * lines.length + 10;
    ctx.fillStyle = "rgba(0,0,0,0.78)"; ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = _perf.fps >= 50 ? "#0f8" : _perf.fps >= 30 ? "#fd4" : "#f64"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    ctx.font = "10px monospace"; ctx.textAlign = "left"; ctx.textBaseline = "top";
    lines.forEach((l, i) => { ctx.fillStyle = i === 0 ? ctx.strokeStyle : "#bfe"; ctx.fillText(l, x + 6, y + 5 + i * 12); });
    ctx.restore();
}
