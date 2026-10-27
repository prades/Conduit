// ─────────────────────────────────────────────────────────
//  THE MUTATOR'S KIT: the lash, and the one clone (docs/MUTATOR.md)
// ─────────────────────────────────────────────────────────
// ASKED (the brief): "Mutator: melee-focused summoner and biological specialist. Fights alongside a single primary cloned creature." "The Mutator normally has only one active primary clone." "If the clone
// dies, its accumulated upgrades are lost and a replacement must be created."
//   THE LASH       the Mutator's own weapon (WEAPONS.lash, js/weapons.js), put in hand when the class is chosen. It is aimed the way the gun is (js/targeting.js, js/gunfire.js: the dial at the top left, a tap on
//                  the locked creature, hold to keep going): a creature out of reach is WALKED TO, and the lash comes in two beats like a creature's bite (docs/COMBAT.md): the tentacle draws back for
//                  MUTATOR.lash.windup frames, then lands for the weapon's damage (the number over the creature). A creature that got out of reach in the wind-up is missed (MISS). It spends no ammunition. A tap on
//                  the floor, or putting the weapon away, calls the attack off.
//   THE CLONE      cloning is the Mutator's (CLASS_RULES.clone, js/classes.js): one at a time, and that one is its PRIMARY clone (c.primary). The Clone Bay makes it as it makes every clone (js/clone.js makeClone); it
//                  follows the Mutator, takes the battle tool's orders (HOLD, COME, RETREAT, the enemy card's ATTACK) and fights as the creature it is (js/clone.js cloneFight). It does NOT come back by itself:
//                  when it falls it leaves its BODY where it fell (cloneBodies, below), and a new clone has to be grown.
// Every number here is a knob, not a decision (docs/MUTATOR.md, "Tentative").
const MUTATOR = {
    lash: { windup: 9, slack: 0.3, replan: 12, fx: 14 },   // the strike's wind-up (frames); how far past its reach a creature may slip in the wind-up and still be hit (tiles); how often the walk into reach is planned again (frames); how long the lash is drawn (frames)
    body: { life: 0, near: 2.4 },                          // a fallen clone's body: how long it lies (frames; 0 = until it is dealt with); how near (tiles) the player must be for its plate to say more than its name
};

// ── THE LASH ─────────────────────────────────────────────
// goal: the creature the Mutator is going for (walked to, then struck); target: the one the lash in its wind-up is for; fx: the lash being drawn; face*: the player turns to what it strikes (js/hdsprites.js)
const _mx = { goal: null, target: null, windup: 0, pathAt: -1e9, fx: null, faceTo: null, faceAt: -1e9 };
function _mxFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _mxDist(a) { return Math.hypot(a.x - player.x, a.y - player.y); }
function _mxHeld() { return typeof gunHold !== "undefined" && !!gunHold && !gunHold.released; }
function lashReach() { const w = typeof WEAPONS !== "undefined" ? WEAPONS.lash : null; return typeof classStat === "function" ? classStat("lashReach", w && w.reach ? w.reach : 1.45) : (w && w.reach) || 1.45; }
function mutatorLashing() { return _mx.windup > 0; }
// the creature the lash is going for or winding up at (the dial, the tests)
function mutatorLashGoal() { return _mx.target || _mx.goal || null; }
// stop where the player stands (in reach: no further)
function _mxStop() { player.fpPath = null; player.targetX = player.x; player.targetY = player.y; }
// walk toward a spot in reach of the creature, on the side the player is on (planned again every MUTATOR.lash.replan frames while it moves). In sight, straight to that spot: a tile's centre can be just
// out of reach (the walk stopped 1.5 tiles off a creature whose lash reaches 1.45, and planned the same tile again for good); round the walls, by the route to the nearest tile.
function _mxApproach(foe) {
    const f = _mxFrame(); if (f - _mx.pathAt < MUTATOR.lash.replan && player.fpPath && player.fpPath.length) return;
    if (typeof facilityPortalBusy === "function" && facilityPortalBusy()) return;   // (nobody walks while the screen fades through a doorway)
    _mx.pathAt = f;
    const d = _mxDist(foe) || 1, k = Math.min(1, lashReach() * 0.7 / d), tx = foe.x + (player.x - foe.x) * k, ty = foe.y + (player.y - foe.y) * k;
    if (typeof facilityLosFrom !== "function" || facilityLosFrom(player.x, player.y, tx, ty)) { player.fpPath = [[tx, ty]]; player.targetX = tx; player.targetY = ty; return; }
    if (typeof facilityWalkTo === "function" && !facilityWalkTo(Math.round(tx), Math.round(ty))) facilityWalkTo(Math.round(foe.x), Math.round(foe.y));
}
// THE ATTACK (js/input.js firePlayerShot, when the weapon in hand is a melee one): true when a strike has begun. Out of reach it walks the player in and the strike comes when it is in reach (mutatorTick).
function mutatorLash(foe) {
    if (!foe || foe.dead) return false;
    _mx.goal = foe;
    if (_mx.windup > 0) return false;   // (already drawing back)
    if (_mxDist(foe) > lashReach()) { _mxApproach(foe); return false; }
    _mx.windup = MUTATOR.lash.windup; _mx.target = foe; _mx.faceTo = foe; _mx.faceAt = _mxFrame();
    player.attackCooldown = MUTATOR.lash.windup + (typeof weaponCooldown === "function" ? weaponCooldown("lash") : 34);
    _mxStop();
    return true;
}
// the lash lands (or misses): the number, the flash on the creature, the lash drawn from the player to it
function _mxStrike(t) {
    const f = _mxFrame(), hit = !!t && !t.dead && _mxDist(t) <= lashReach() + MUTATOR.lash.slack;
    _mx.fx = { t0: f, x: t ? t.x : player.x, y: t ? t.y : player.y, hit };
    if (!t) return false;
    if (!hit) { if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: t.x, y: t.y, text: "MISS", color: "#d8c4f0", size: 12, life: 34, vy: -0.035 }); return false; }
    applyDamage(t, typeof weaponDamage === "function" ? weaponDamage("lash") : 18, { x: player.x, y: player.y, team: "green", element: null, isPlayer: true });
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: t.y, color: "#c06bff", radius: 0.55, life: 16 });
    if (typeof shake !== "undefined") shake = Math.max(shake, 2);
    return true;
}
// each step, after the gun's (js/game.js): the wind-up runs down and the lash lands; a creature that is being gone for is walked to and struck once it is in reach. A click is one strike; holding keeps striking.
function mutatorTick() {
    if (_mx.windup > 0) {
        const t = _mx.target;
        if (!t || t.dead) { _mx.windup = 0; _mx.target = null; return; }   // (it died first: nothing to land on)
        _mx.faceAt = _mxFrame();
        if (--_mx.windup <= 0) { _mx.target = null; _mxStrike(t); if (!_mxHeld()) _mx.goal = null; }
        return;
    }
    const g = _mx.goal; if (!g) return;
    if (g.dead || (typeof playerAttackMode !== "undefined" && !playerAttackMode) || _mxDist(g) > (typeof TARGET !== "undefined" ? TARGET.manualKeep : 18) || (typeof weaponMelee === "function" && !weaponMelee())) { _mx.goal = null; return; }
    if (_mxDist(g) <= lashReach()) { _mxStop(); if ((player.attackCooldown || 0) <= 0) mutatorLash(g); }
    else _mxApproach(g);
}
// a tap on the floor (js/input.js), putting the weapon away (js/gunfire.js gunStow): the attack is off, and a lash still drawing back is let go
function mutatorCancel() { _mx.goal = null; if (_mx.windup > 0) { _mx.windup = 0; _mx.target = null; } }
// the row of the player's sheet to face while it strikes (js/hdsprites.js hdPlayerState), or null
function mutatorFacing() {
    const t = _mx.faceTo; if (!t || _mxFrame() - _mx.faceAt > 18 || typeof hdRow !== "function") return null;
    return hdRow(t.x - player.x, t.y - player.y);
}
// THE LASH, DRAWN (over the scene, js/game.js): while it draws back, a tentacle curls up behind the player, away from the creature; when it lands, a whip from the player to the creature that fades, purple on a hit,
// grey on a miss. The player's own sheet is not changed (the brief: no redesign of an established character).
function _mxScr(x, y) { return [(x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0)]; }
function _mxCurve(x0, y0, cx, cy, x1, y1, t) {   // the first t of a quadratic curve, as a path
    const ax = x0 + (cx - x0) * t, ay = y0 + (cy - y0) * t, bx = cx + (x1 - cx) * t, by = cy + (y1 - cy) * t, ex = ax + (bx - ax) * t, ey = ay + (by - ay) * t;
    ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(ax, ay, ex, ey);
}
function drawMutatorFx() {
    if (typeof ctx === "undefined" || typeof canvas === "undefined") return;
    const f = _mxFrame(), col = "#c06bff";
    const [px, py0] = _mxScr(player.visualX, player.visualY), py = py0 - 46;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineCap = "round"; ctx.lineJoin = "round";
    if (_mx.windup > 0 && _mx.target && !_mx.target.dead) {   // drawing back
        const k = 1 - _mx.windup / MUTATOR.lash.windup, [tx, ty0] = _mxScr(_mx.target.x, _mx.target.y), ang = Math.atan2(ty0 - 30 - py, tx - px) + Math.PI, r = 10 + 16 * k;
        const ex = px + Math.cos(ang) * r, ey = py + Math.sin(ang) * r * 0.8 - 10 * k;
        ctx.globalAlpha = 0.5 + 0.5 * k; ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(px, py + 6); ctx.quadraticCurveTo(px + Math.cos(ang + 1.2) * r * 0.9, py + Math.sin(ang + 1.2) * r * 0.6, ex, ey); ctx.stroke();
        ctx.strokeStyle = "#f1e2ff"; ctx.lineWidth = 2; ctx.stroke();
        ctx.globalAlpha = 0.35 + 0.4 * k; ctx.strokeStyle = col; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(tx, ty0 - 30, 12 + 8 * (1 - k), 0, Math.PI * 2); ctx.stroke();   // and a ring closing on what it is for
    }
    const fx = _mx.fx;
    if (fx) {
        const age = f - fx.t0;
        if (age < 0 || age > MUTATOR.lash.fx) _mx.fx = null;
        else {
            const [tx, ty0] = _mxScr(fx.x, fx.y), ty = ty0 - 30, mx = (px + tx) / 2, my = (py + ty) / 2, dx = tx - px, dy = ty - py, dl = Math.hypot(dx, dy) || 1, bend = Math.min(40, dl * 0.35);
            const cx = mx - dy / dl * bend, cy = my + dx / dl * bend - 18, ext = Math.min(1, (age + 1) / 4), fade = 1 - Math.max(0, age - 3) / (MUTATOR.lash.fx - 3);
            ctx.globalAlpha = Math.max(0, fade) * 0.55; ctx.strokeStyle = fx.hit ? col : "#8f86a6"; ctx.lineWidth = 9; _mxCurve(px, py + 4, cx, cy, tx, ty, ext); ctx.stroke();
            ctx.globalAlpha = Math.max(0, fade); ctx.strokeStyle = fx.hit ? "#f1e2ff" : "#c9c3d8"; ctx.lineWidth = 3; ctx.stroke();
            if (fx.hit && age < 6) { ctx.globalAlpha = 1 - age / 6; ctx.fillStyle = "#f6ecff"; ctx.beginPath(); ctx.arc(tx, ty, 6 + age * 3, 0, Math.PI * 2); ctx.fill(); }
        }
    }
    ctx.restore();
}

// ── THE ONE CLONE ────────────────────────────────────────
// The Mutator's clone: the live primary clone, or null
function mutatorClone() { return typeof actors !== "undefined" ? actors.find(a => a && a.isClone && a.primary && !a.dead) || null : null; }
// The Clone Bay has just grown it (js/clone.js executeClone, when the class's clones are primary)
function mutatorCloneMade(c, option) {
    if (!c) return null;
    c.primary = true;   // (the bay says so: js/clone.js executeClone, "YOUR CLONE: ANT SCOUT · IT FOLLOWS YOU")
    return c;
}
// ── ITS BODY ──
// A primary clone that falls (the death sweep, js/game.js) does not come back: its body lies where it fell, with what it was (its kind, level and XP), until it is dealt with (the next steps of docs/MUTATOR.md:
// what can be recovered from it, and the Ice Mage's preservation) or MUTATOR.body.life runs out. A clone that was DISMISSED leaves none.
let cloneBodies = [];
let _bodyN = 0;
function cloneFallen(c) {
    if (!c) return null;
    const f = _mxFrame(), b = { id: ++_bodyN, sp: c.speciesName, cls: c.className || "scout", level: c.level, xp: c.xp, x: c.x, y: c.y, dirX: c.dirX || 1, dirY: c.dirY || 0, t0: f };
    cloneBodies.push(b);
    if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined") {
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 130, text: "YOUR " + String(b.sp).toUpperCase() + " " + String(b.cls).toUpperCase() + " CLONE HAS FALLEN", color: CLASSES.mutator.colour, life: 240, vy: -0.05, size: 16 });
        floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 104, text: "IT DOES NOT COME BACK — GROW A NEW ONE AT THE CLONE BAY", color: "#c8b6e6", life: 240, vy: -0.05, size: 12 });
    }
    return b;
}
// each step: a body whose time is up goes (with life 0 it stays)
function mutatorBodiesTick() {
    const L = MUTATOR.body.life; if (!(L > 0) || !cloneBodies.length) return;
    const f = _mxFrame(); cloneBodies = cloneBodies.filter(b => f - b.t0 < L);
}
// ── drawing a body: the creature's own drawing (js/bugs3d.js, the Clone Bay's picture: drawCloneArt), dimmed and still, on a ring of the Mutator's colour, with its name ──
function cloneBodiesDrawItems(drawList) {
    if (!cloneBodies.length || typeof visibleForDraw !== "function") return;
    for (const b of cloneBodies) if (visibleForDraw(b.x, b.y)) drawList.push({ type: "body", x: b.x, y: b.y, body: b });
}
function drawCloneBody(b, px, py) {
    if (!b || typeof ctx === "undefined") return;
    const f = _mxFrame(), col = typeof CLASSES !== "undefined" && CLASSES.mutator ? CLASSES.mutator.colour : "#c06bff", pul = 0.55 + 0.45 * Math.sin(f * 0.06 + b.id);
    ctx.save();
    ctx.translate(px, py + TILE_H); ctx.scale(1, TILE_H / TILE_W);   // the ring on the floor
    ctx.globalAlpha = 0.18 + 0.12 * pul; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 0.55 + 0.35 * pul; ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.setLineDash([9, 6]); ctx.beginPath(); ctx.arc(0, 0, 34, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
    ctx.restore();
    const a = typeof _cloneCardActor === "function" ? _cloneCardActor({ key: "body_" + b.sp + "_" + b.cls, speciesName: b.sp, className: b.cls }) : null;
    if (a && typeof drawNPC === "function") {
        a.dirX = b.dirX; a.dirY = b.dirY; a.walkCycle = 0; a.state = "idle"; a.attackAnim = 0;   // (still: it is not walking)
        const keep = [_drawPredatorBars, drawHealthBar, typeof drawUnitTag === "function" ? drawUnitTag : null];
        _drawPredatorBars = () => {}; drawHealthBar = () => {}; if (keep[2]) drawUnitTag = () => {};   // (no bar or plate over a body: drawCloneArt does the same for the Clone Bay's pictures)
        ctx.save(); ctx.globalAlpha = 0.5;
        try { drawNPC(a, px, py, ctx); } catch (e) { /* a picture must never take the frame down */ }
        finally { ctx.restore(); _drawPredatorBars = keep[0]; drawHealthBar = keep[1]; if (keep[2]) drawUnitTag = keep[2]; }
    }
    const near = typeof player !== "undefined" && Math.hypot(b.x - player.x, b.y - player.y) <= MUTATOR.body.near;
    ctx.save(); ctx.font = "bold 11px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const name = String(b.sp).toUpperCase() + " " + String(b.cls).toUpperCase() + " CLONE · FALLEN", w = ctx.measureText(name).width + 14, y = py - 54;
    ctx.globalAlpha = 0.9; ctx.fillStyle = "rgba(10,6,20,0.82)"; ctx.fillRect(px - w / 2, y - 9, w, 18); ctx.strokeStyle = col; ctx.lineWidth = 1.2; ctx.strokeRect(px - w / 2 + 0.5, y - 8.5, w - 1, 17);
    ctx.fillStyle = "#ead9ff"; ctx.fillText(name, px, y + 0.5);
    if (near) { ctx.font = "10px monospace"; ctx.fillStyle = "#c8b6e6"; ctx.fillText("LV " + (b.level || "?") + " · A NEW ONE IS GROWN AT THE CLONE BAY", px, y + 17); }
    ctx.restore();
}
// ── saving (js/facilitysave.js) ──
function cloneBodiesSnapshot() { return cloneBodies.map(b => ({ sp: b.sp, cls: b.cls, level: b.level, xp: b.xp, x: Math.round(b.x * 100) / 100, y: Math.round(b.y * 100) / 100, dx: Math.round((b.dirX || 1) * 100) / 100, dy: Math.round((b.dirY || 0) * 100) / 100 })); }
function cloneBodiesApply(list) {
    cloneBodies = []; if (!Array.isArray(list)) return 0;
    for (const s of list) {
        if (!s || typeof SPECIES === "undefined" || !SPECIES[s.sp] || !Number.isFinite(s.x) || !Number.isFinite(s.y)) continue;
        cloneBodies.push({ id: ++_bodyN, sp: s.sp, cls: s.cls || "scout", level: s.level, xp: s.xp, x: s.x, y: s.y, dirX: Number.isFinite(s.dx) ? s.dx : 1, dirY: Number.isFinite(s.dy) ? s.dy : 0, t0: _mxFrame() });
    }
    return cloneBodies.length;
}
// a fresh game (js/facilityplay.js facilityResetState)
function mutatorReset() { _mx.goal = null; _mx.target = null; _mx.windup = 0; _mx.fx = null; _mx.faceTo = null; _mx.pathAt = -1e9; cloneBodies = []; }
