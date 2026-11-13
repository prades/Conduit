// ─────────────────────────────────────────────────────────
//  THE HAZARD CONTAINERS: explosive and corrosive flasks on the map (docs/FACILITY.md, "The hazard containers")
// ─────────────────────────────────────────────────────────
// ASKED (the owner, 2026-11-10): "I want there to be containers on the map that contain explosives ... and some that contain acid, I guess, or like corrosive material, and the flux move can work on it. And
// we're going to put one in the sewer, at least for now, and then two explosive ones in the arena". Of the behaviour offered: the compressed air one dropped ("Maybe no compressed air"), the rest as offered: a shot
// from anyone sets one off and FLUX MOVE carries it safely; the EXPLOSIVE one's blast hurts everything within about 2 tiles, your side included, and sets off any other container caught in it; the CORROSIVE one
// bursts and leaves a pool about 1.5 tiles across that eats at anything standing in it for about 10 seconds. After: "Comes back" (where it stood, after about a minute). The sewer's: "Corrosive". The look:
// designs 8 and 10 combined, "4 Flask in hex armour" (design/props/models/hazard.js).
//   ON THE MAP   solids of kind hazard_explosive (the arena's two) and hazard_corrosive (the sewer's), with a `flux` field (js/facilitymap.js): FLUX MOVE moves them as it moves a crate (js/fluxmove.js). They
//                give cover and stop shots (js/facility.js FAC_COVER), and sight passes over them (FAC_LOW).
//   SET OFF      by a shot that stops on one (js/game.js, where a travelling shot stops at cover; js/weapons.js, where the laser's beam does), whoever fired it, and by another container's blast (a moment
//                later, so a chain goes off one after another). FLUX MOVE never sets one off.
//   GONE         the container is taken off its tile (js/facilityplay.js facilitySolidSet: its floor is floor, it stops nothing and is not drawn) until it COMES BACK, HAZARD.back frames later, on the same tile
//                (it waits while anyone stands there). Nothing of this is saved: a loaded game has every container in place.
// The numbers are the agent's, provisional (docs/OPEN-QUESTIONS.md).
const HAZARD = {
    blastR: 2,          // tiles: the explosive one's blast reaches this far
    blastDmg: 30,       // its hit at the middle, falling to half at the edge (to creatures, followers and clones; the player loses a heart, as from any hit)
    chainDelay: 12,     // frames before a container caught in a blast goes off itself
    poolR: 0.75,        // tiles: the corrosive one's pool (about 1.5 tiles across)
    poolFrames: 600,    // how long the pool lasts: 10 s
    poolTick: 30,       // a hit every half second to everyone standing in it
    poolDmg: 3,         // each hit
    back: 3600,         // frames until a container that went off comes back: 60 s
    blastFrames: 42,    // how long the blast and the splash are drawn
};
const HAZARD_LOOK = { hazard_explosive: { rgb: "255,122,26", hot: "255,224,138" }, hazard_corrosive: { rgb: "140,255,58", hot: "232,255,208" } };
let _hz = { st: new Map(), pools: [], blasts: [] };   // st: id -> { fuse, back }; pools: { x, y, r, until, born }; blasts: { x, y, t0, kind }

function hazardsReset() { _hz = { st: new Map(), pools: [], blasts: [] }; }
function hazardKind(s) { return s && (s.kind === "hazard_explosive" || s.kind === "hazard_corrosive") ? s.kind : null; }
function hazardSolids() { return typeof _fp !== "undefined" && _fp && _fp.F ? _fp.F.solids.filter(hazardKind) : []; }
function hazardCentre(s) { return [(s.bb[0] + s.bb[2]) / 2, (s.bb[1] + s.bb[3]) / 2]; }
function hazardState(id) { let st = _hz.st.get(id); if (!st) { st = { fuse: null, back: null }; _hz.st.set(id, st); } return st; }
function _hzFrame() { return typeof frame !== "undefined" ? frame : 0; }

// ── SETTING ONE OFF ──
// light its fuse: it goes off `delay` frames from now (at the next step when 0); one already lit keeps the sooner time, and one that is away cannot be set off
function hazardTrigger(s, delay) {
    if (!hazardKind(s) || s.open) return false;
    const st = hazardState(s.id), at = _hzFrame() + (delay || 0); st.fuse = st.fuse == null ? at : Math.min(st.fuse, at); return true;
}
// a travelling shot stopped on a solid (js/game.js): a container goes off
function hazardShot(solid) { return hazardKind(solid) ? hazardTrigger(solid, 0) : false; }
// the laser's beam stopped short at (x, y) (js/weapons.js): a container there goes off
function hazardShotNear(x, y) {
    for (const s of hazardSolids()) if (!s.open && Math.max(s.bb[0] - x, 0, x - s.bb[2]) <= 0.35 && Math.max(s.bb[1] - y, 0, y - s.bb[3]) <= 0.35) return hazardTrigger(s, 0);
    return false;
}
// ── A CONTAINER AS A TARGET (the owner, 2026-11-13, at the Nest's cracked rock: "Whenever the player clicks on a flask, it should show up at the bottom right as a target and for the mini command as a
// card"; build 2026-11-13m) ──
// A tap on one locks it as a tap on a creature does (js/targeting.js targetPress): THE CORE's slab at the bottom right shows it and its FIRE fires at it (a tap on it again fires too), and the enemy card
// at the left shows it, its ATTACK sending the squad's MAGES, who shoot from out of its blast (js/mixtool.js mixToolAttack; a brawler or a technician would walk up to it and be caught: they stay back; the
// agent's choice, provisional). It is no creature: a stand-in where the container is (it follows FLUX MOVE), dead while the container is away, and whatever hits it sets it off (js/helpers.js applyDamage).
// A shot at it stops on it anyway (it is cover) and sets it off, as before.
const _hzTargets = new Map();
function hazardTarget(s) {
    if (!hazardKind(s)) return null;
    const t0 = _hzTargets.get(s.id); if (t0 && t0.solid === s) return t0;
    const ex = s.kind === "hazard_explosive", t = {
        isHazardTarget: true, solid: s, team: "hazard", speciesName: null, className: s.kind, element: null, level: null, health: 1, maxHealth: 1, dirX: 0, dirY: 1,
        power: ex ? HAZARD.blastDmg : HAZARD.poolDmg, color: ex ? "#ff8a3a" : "#8cff3a", dimensions: { width: 18, height: 18 },
        get x() { const b = this.solid.bb; return (b[0] + b[2]) / 2; }, get y() { const b = this.solid.bb; return (b[1] + b[3]) / 2; },
        get visualX() { return this.x; }, get visualY() { return this.y; }, get dead() { return !!this.solid.open; },
    };
    _hzTargets.set(s.id, t); return t;
}
function hazardTargetName(t) { return t && t.solid && t.solid.kind === "hazard_corrosive" ? "ACID FLASK" : "EXPLOSIVE FLASK"; }
// the container under a press on the screen (found as js/input.js findEnemyAtScreen finds a creature: near its middle, a little over the floor), or null
function hazardTargetAtScreen(ex, ey) {
    if (typeof player === "undefined" || !player || typeof canvas === "undefined" || !canvas) return null;
    let best = null, bd = typeof PICK_RADIUS !== "undefined" ? PICK_RADIUS : 44;
    for (const s of hazardSolids()) {
        if (s.open) continue; const [x, y] = hazardCentre(s);
        const px = (x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, py = (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0);
        const q = typeof bvZoomPt === "function" ? bvZoomPt(px, py - 30) : [px, py - 30], d = Math.hypot(ex - q[0], ey - q[1]);   // (the battle view's zoom: js/battleview.js)
        if (d < bd) { bd = d; best = s; }
    }
    return best ? hazardTarget(best) : null;
}
// whatever hits the stand-in sets the container off (js/helpers.js applyDamage)
function hazardTargetHit(t) { return !!(t && t.isHazardTarget && hazardTrigger(t.solid, 0)); }
// its picture for the slab and the card: the container's own sprite (img/props/hazard.png), or null while that sheet is on its way
function hazardTargetPicture(t) {
    const img = typeof _psImg === "function" ? _psImg("hazard") : null, A = typeof PROP_ATLAS !== "undefined" ? PROP_ATLAS.hazard : null, c = A && t && t.solid ? A.cells[t.solid.kind] : null;
    return img && c ? { img, sx: c.x, sy: c.y, sw: c.w, sh: c.h } : null;
}
// what the INFO card says of it
function hazardTargetLines(t) {
    const ex = !t || !t.solid || t.solid.kind !== "hazard_corrosive";
    return [ex ? "A SHOT SETS IT OFF · ITS BLAST HURTS EVERYONE WITHIN " + HAZARD.blastR + " TILES, YOURS TOO" : "A SHOT SETS IT OFF · IT BURSTS INTO ACID FOR " + Math.round(HAZARD.poolFrames / 60) + " S",
            ex ? "IT BREAKS CRACKED ROCK NEAR IT, AND SETS OFF OTHER FLASKS" : "THE ACID EATS RESIN AWAY", "IT COMES BACK AFTER A MINUTE"];
}
// whether a body (a creature, a follower, a clone, the player) stands on its tile
function _hzBodyOn(s) {
    const on = (x, y) => Math.max(s.bb[0] - x, 0, x - s.bb[2]) < 0.4 && Math.max(s.bb[1] - y, 0, y - s.bb[3]) < 0.4;
    if (typeof player !== "undefined" && player && on(player.x, player.y)) return true;
    for (const a of (typeof actors !== "undefined" ? actors : [])) if (a && !a.dead && on(a.x, a.y)) return true;
    return false;
}
// it goes off: taken off its tile, then its blast or its spill
function _hzGoOff(s) {
    const st = hazardState(s.id), [cx, cy] = hazardCentre(s), f = _hzFrame();
    st.fuse = null; st.back = f + HAZARD.back;
    if (typeof facilitySolidSet === "function") facilitySolidSet(s.id, true); else s.open = true;
    _hz.blasts.push({ x: cx, y: cy, t0: f, kind: s.kind });
    if (s.kind === "hazard_explosive") _hzBlast(cx, cy, s);
    else {
        const pool = { x: cx, y: cy, r: HAZARD.poolR, until: f + HAZARD.poolFrames, born: f }; _hz.pools.push(pool);
        if (typeof nestWaysPool === "function") nestWaysPool(pool);   // a resin seal it touches is eaten away, for good (js/nestways.js)
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: cx, y: cy, color: "#8cff3a", radius: 0.9, life: 18, element: "toxic" });
    }
}
// THE BLAST: everyone within reach is hurt, more near the middle (your side too), and any other container in it goes off a moment later
function _hzBlast(cx, cy, from) {
    const R = HAZARD.blastR;
    for (const a of (typeof actors !== "undefined" ? actors.slice() : [])) {
        if (!a || a.dead || a.untargetable || a._swallowedBy) continue;
        const d = Math.hypot(a.x - cx, a.y - cy); if (d > R) continue;
        applyDamage(a, Math.round(HAZARD.blastDmg * (1 - 0.5 * d / R)), null, null);
    }
    if (typeof player !== "undefined" && player && Math.hypot(player.x - cx, player.y - cy) <= R && typeof hurtPlayer === "function") hurtPlayer(HAZARD.blastDmg, 10);
    for (const o of hazardSolids()) { if (o === from || o.open) continue; const [ox, oy] = hazardCentre(o); if (Math.hypot(ox - cx, oy - cy) <= R + 0.5) hazardTrigger(o, HAZARD.chainDelay); }
    if (typeof nestWaysBlast === "function") nestWaysBlast(cx, cy, R);   // a cracked wall within reach breaks, for good (js/nestways.js)
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 12);
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: cx, y: cy, color: "#ff7a1a", radius: 1.4, life: 22, element: "fire" });
}

// ── EVERY STEP ──
function hazardsTick() {
    if (typeof _fp === "undefined" || !_fp || !_fp.F) return;
    const f = _hzFrame();
    for (const s of hazardSolids()) {
        const st = _hz.st.get(s.id); if (!st) continue;
        if (!s.open && st.fuse != null && f >= st.fuse) _hzGoOff(s);
        else if (s.open && st.back != null && f >= st.back && !_hzBodyOn(s)) { if (typeof facilitySolidSet === "function") facilitySolidSet(s.id, false); else s.open = false; st.back = null; }
    }
    // the acid: gone when it is used up; a hit every half second to everyone standing in it
    if (_hz.pools.length) {
        _hz.pools = _hz.pools.filter(p => p.until > f);
        if (f % HAZARD.poolTick === 0) {
            const inPool = (x, y) => _hz.pools.some(p => Math.hypot(x - p.x, y - p.y) <= p.r);
            for (const a of (typeof actors !== "undefined" ? actors.slice() : [])) {
                if (!a || a.dead || a.untargetable || a._swallowedBy || !inPool(a.x, a.y)) continue;
                applyDamage(a, HAZARD.poolDmg, null, null);
                if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: a.x, y: a.y, text: "ACID", color: "#9cff5a", life: 25, vy: -0.04 });
            }
            if (typeof player !== "undefined" && player && inPool(player.x, player.y) && typeof hurtPlayer === "function") hurtPlayer(HAZARD.poolDmg);
        }
    }
    if (_hz.blasts.length) _hz.blasts = _hz.blasts.filter(b => f - b.t0 < HAZARD.blastFrames);
}

// ── DRAWING ──
// the container itself (js/facilityplay.js _fpDrawProp): its sprite and a slow pulse of its charge over the glass, a quick white blink while its fuse is lit; nothing while it is away
function hazardDrawProp(it) {
    const s = typeof _fp !== "undefined" && _fp && _fp.F ? _fp.F.solids.find(q => q.id === it.id) : null; if (!s) return false;
    if (s.open) return true;
    const L = HAZARD_LOOK[s.kind] || HAZARD_LOOK.hazard_explosive, [cx, cy] = hazardCentre(s), f = _hzFrame(), st = _hz.st.get(s.id), low = typeof gfxLow !== "undefined" && gfxLow;
    if (!(typeof facilitySpriteDraw === "function" && facilitySpriteDraw(it))) {   // (until the sheet has arrived: a plain flask in its colour)
        if (typeof _fpStyleCyl === "function") _fpStyleCyl(cx, cy, 0.3, 0, 20, "rgb(" + L.rgb + ")", "rgba(" + L.hot + ",0.9)", "rgb(" + L.rgb + ")", 2);
        return true;
    }
    const p = _fpP(cx, cy, 24), k = 0.5 + 0.5 * Math.sin(f * 0.08 + cx * 1.7 + cy);
    if (!low) { ctx.save(); ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(p[0], p[1], 1, p[0], p[1], 22); g.addColorStop(0, "rgba(" + L.rgb + "," + (0.12 + 0.18 * k).toFixed(3) + ")"); g.addColorStop(1, "rgba(" + L.rgb + ",0)"); ctx.fillStyle = g; ctx.fillRect(p[0] - 22, p[1] - 22, 44, 44); ctx.restore(); }
    if (st && st.fuse != null && (f >> 2) % 2 === 0) { ctx.save(); ctx.globalCompositeOperation = "lighter"; ctx.fillStyle = "rgba(255,255,255,0.35)"; ctx.beginPath(); ctx.ellipse(p[0], p[1] - 4, 18, 26, 0, 0, 6.2832); ctx.fill(); ctx.restore(); }
    return true;
}
// the acid, painted by each floor tile as it is drawn (under whoever stands there; js/game.js, as the burning ground is): the part of each pool on this tile, from the tile's top corner (px, py)
function drawAcidOnTile(tx, ty, px, py) {
    if (!_hz.pools.length) return;
    const f = _hzFrame();
    for (const P of _hz.pools) {
        if (Math.abs(P.x - tx) > P.r + 0.75 || Math.abs(P.y - ty) > P.r + 0.75) continue;
        const a = Math.max(0, Math.min(1, (P.until - f) / 60, (f - P.born + 1) / 8)), dx = P.x - tx, dy = P.y - ty, cx = px + (dx - dy) * TILE_W, cy = py + TILE_H + (dx + dy) * TILE_H, rx = P.r * TILE_W * 1.4142, ry = P.r * TILE_H * 1.4142;
        ctx.save();
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + TILE_W, py + TILE_H); ctx.lineTo(px, py + 2 * TILE_H); ctx.lineTo(px - TILE_W, py + TILE_H); ctx.closePath(); ctx.clip();
        // a soft puddle of a few overlapping lobes, drawn as circles in a space squashed to the floor's 2:1 (so it fades the same way to every side)
        ctx.save(); ctx.translate(cx, cy); ctx.scale(1, ry / rx);
        for (const [ox, oy, k] of [[0, 0, 0.92], [0.42, -0.18, 0.55], [-0.4, 0.22, 0.6], [0.12, 0.42, 0.5]]) {
            const x0 = ox * rx, y0 = oy * rx, R = k * rx, g = ctx.createRadialGradient(x0, y0, 1, x0, y0, R);
            g.addColorStop(0, "rgba(150,255,70," + (0.5 * a).toFixed(3) + ")"); g.addColorStop(0.65, "rgba(110,225,40," + (0.38 * a).toFixed(3) + ")"); g.addColorStop(1, "rgba(80,190,30,0)");
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x0, y0, R, 0, 6.2832); ctx.fill();
        }
        ctx.restore();
        // bubbles that rise in it and pop
        for (let i = 0; i < 6; i++) {
            const ph = ((f + i * 23) % 60) / 60, ang = i * 2.4 + Math.floor((f + i * 23) / 60) * 1.3, rr = 0.55 * ((i * 37) % 10) / 10, bx = cx + Math.cos(ang) * rx * rr, by = cy + Math.sin(ang) * ry * rr, br = 1.5 + 2.5 * ph;
            ctx.strokeStyle = "rgba(225,255,190," + (0.75 * a * (1 - ph)).toFixed(3) + ")"; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(bx, by, br, 0, 6.2832); ctx.stroke();
        }
        ctx.restore();
    }
}
function _hzScr(x, y, z) { return [(x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - (z || 0) - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0)]; }
// the blast and the splash, over everything (js/game.js, after the fire bombs in flight)
function drawHazardBlasts() {
    if (!_hz.blasts.length) return;
    const f = _hzFrame(), low = typeof gfxLow !== "undefined" && gfxLow;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    for (const b of _hz.blasts) {
        const t = (f - b.t0) / HAZARD.blastFrames; if (t < 0 || t > 1) continue;
        const [gx, gy] = _hzScr(b.x, b.y, 0), [sx, sy] = _hzScr(b.x, b.y, 22);
        if (b.kind === "hazard_explosive") {
            const R = HAZARD.blastR * TILE_W * 1.4142 * Math.min(1, t * 1.6);
            ctx.globalAlpha = 1 - t; ctx.strokeStyle = "#ffb04a"; ctx.lineWidth = 4 * (1 - t) + 1; ctx.beginPath(); ctx.ellipse(gx, gy, R, R * 0.5, 0, 0, 6.2832); ctx.stroke();   // the shock ring on the floor
            const fr = 26 + 70 * Math.min(1, t * 3), fa = Math.max(0, 1 - t * 2.2);
            if (fa > 0) { ctx.globalAlpha = 1; ctx.globalCompositeOperation = "lighter"; const g = ctx.createRadialGradient(sx, sy, 2, sx, sy, fr); g.addColorStop(0, "rgba(255,250,220," + fa.toFixed(3) + ")"); g.addColorStop(0.35, "rgba(255,160,50," + (0.85 * fa).toFixed(3) + ")"); g.addColorStop(1, "rgba(255,80,10,0)"); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(sx, sy, fr, 0, 6.2832); ctx.fill(); ctx.globalCompositeOperation = "source-over"; }
            if (!low) for (let i = 0; i < 7; i++) {   // smoke rising and spreading, and sparks flying out
                const a = i * 0.9 + b.x, d = 10 + 46 * t, px = sx + Math.cos(a) * d, py = sy - 8 - 40 * t + Math.sin(a) * d * 0.5;
                ctx.globalAlpha = 0.45 * (1 - t); ctx.fillStyle = "#3a3f47"; ctx.beginPath(); ctx.arc(px, py, 7 + 16 * t, 0, 6.2832); ctx.fill();
                if (t < 0.5) { const e = 20 + 120 * t; ctx.globalAlpha = 1 - t * 2; ctx.strokeStyle = "#ffe08a"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(sx + Math.cos(a) * e * 0.7, sy + Math.sin(a) * e * 0.35); ctx.lineTo(sx + Math.cos(a) * e, sy + Math.sin(a) * e * 0.5); ctx.stroke(); }
            }
        } else {
            const R = HAZARD.poolR * TILE_W * 1.4142 * Math.min(1, t * 2.5);   // the splash: a green ring out to the pool's edge and droplets flung up and out
            ctx.globalAlpha = 0.9 * (1 - t); ctx.strokeStyle = "#b9ff6a"; ctx.lineWidth = 3; ctx.beginPath(); ctx.ellipse(gx, gy, R, R * 0.5, 0, 0, 6.2832); ctx.stroke();
            for (let i = 0; i < (low ? 5 : 10); i++) { const a = i * 0.63 + b.y, d = 8 + 40 * t, h = 60 * t * (1 - t) * (0.6 + 0.4 * ((i * 7) % 5) / 5); ctx.globalAlpha = 1 - t; ctx.fillStyle = i % 2 ? "#8cff3a" : "#d8ffb0"; ctx.beginPath(); ctx.arc(gx + Math.cos(a) * d, gy + Math.sin(a) * d * 0.5 - h, 2.5, 0, 6.2832); ctx.fill(); }
        }
    }
    ctx.globalAlpha = 1; ctx.restore();
}
