// ============================================================
//  THE PLAYER'S PART IN A FIGHT (docs/PLAYER-COMBAT.md)
// ============================================================
// The owner, 2026-11-11: "I feel like the 3-hit rule is a bit harsh [...] it would be cool maybe to have the player use items to recharge the bars, but at the same time maybe it would be better if they had
// more of a role within the combat, and they could block shots for the followers, or swoop in to stun the target. But I don't want to make it too easy." Chosen: "B built on A".
// STEP 1 (build 2026-11-11e): the bars come back, and the repair kit.
//   THE REFILL      out of danger (no creature near you: js/facilityplay.js facilityEnemyNear; no hit) for `refill.after` frames, a bar comes back, then one every `refill.every`, up to PLAYER_HITS.
//                   The owner chose "Slow": 10 s, then a bar every 8 s. A hit, or a creature coming near, starts the wait again. The knockout is as it was (three gone: back at the Crystal).
//   THE REPAIR KIT  an item of the pack (js/inventory.js ITEMS.repair_kit): one bar back, mid-fight too; refused when the bars are full. Used from the pack, the KIT pill by the dial, or H.
//                   Creatures sometimes drop one (`drop.chance`; it lies there `drop.life` frames, as the scrap does); some lie at spots in the facility (js/facilitymap.js pickups with `respawn`), back a while
//                   after they are taken (js/facilitytutorial.js facilityPickupTick).
// STEP 2 (build 2026-11-11f): GUARD and STUN DIVE (the owner chose "Guard stance" and "Chip, then tap").
//   GUARD           the GUARD button by the dial (or G) holds up a guard, on until pressed again: a creature's shot that would hit one of your squad within `guard.reach` tiles of you stops at your
//                   guard and hits YOU instead (one bar; inside the grace after a hit it costs nothing, so one a second at most); you move at `guard.speed` while it is up. A knockout drops it.
//   STUN DIVE       the STUN button by the dial (or V), then a creature within `dive.reach` tiles that you can see, with a clear way to it: you swoop to its side in `dive.frames` (nothing hits you on the
//                   way) and it is stunned `dive.stun` frames (js/combat.js applyStun); then the button rests `dive.rest` frames. A tap anywhere else puts the dive away.
// Every number here is the agent's, provisional, but the refill's (the owner's).
const PLAYER_COMBAT = {
    refill: { after: 600, every: 480 },          // the owner: "Slow": after 10 s out of danger, one bar every 8 s
    kit: { item: "repair_kit", key: "h" },
    drop: { chance: 0.08, life: 3600 },           // (provisional) one kill in twelve or so drops a kit; it lies there a minute
    nearEvery: 15,                                // the danger test is asked every quarter second, not every frame (it is a sight test for each creature near)
    guard: { reach: 2.5, speed: 0.5, key: "g" },  // (provisional) how near you a squad member is guarded (tiles); the owner: half speed while guarding
    dive: { reach: 5, frames: 12, stun: 90, rest: 720, stop: 0.9, key: "v" },   // (provisional) reach (tiles), the swoop (frames), the stun (1.5 s), the rest (12 s), how far from the creature you stop
};
let playerGuardOn = false, playerDiveArmed = false, _pcDive = null, _pcDiveReady = 0;

function _pcFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _pcSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof player !== "undefined" && player) floatingTexts.push({ world: true, x: player.x, y: player.y, text, color: col || "#7dffa8", life: 70, vy: -0.035, size: 13 }); }

// ── THE REFILL (every frame of the facility: js/facilitytutorial.js facilityTutorialTick) ──
function playerCombatTick() {
    if (typeof facilityPlay === "undefined" || !facilityPlay || typeof player === "undefined" || !player || typeof health === "undefined") return;
    if (typeof attractOn === "function" && attractOn()) return;
    const f = _pcFrame(), R = PLAYER_COMBAT.refill, P = player;
    if (_pcDive) _pcDiveStep(f);
    if (!Number.isFinite(P._pcSafe)) { P._pcSafe = f; P._pcHit = P.lastHitAt; }
    if (P._pcHit !== P.lastHitAt) { P._pcHit = P.lastHitAt; P._pcSafe = f; }   // a hit: the wait starts again
    if (f % PLAYER_COMBAT.nearEvery === 0 && typeof facilityEnemyNear === "function" && facilityEnemyNear()) P._pcSafe = f;   // a creature near you: and again
    if (health >= PLAYER_HITS) { P._pcNext = 0; return; }
    if (f >= Math.max(P._pcSafe + R.after, P._pcNext || 0)) {
        health = Math.min(PLAYER_HITS, health + 1); P._pcNext = f + R.every;
        _pcSay("+1 BAR", "#7dffa8");
    }
}

// ── THE REPAIR KIT ──
function playerKitUse() {
    if (typeof health === "undefined") return { ok: false, why: "NOT NOW" };
    if (health >= PLAYER_HITS) return { ok: false, why: "YOUR BARS ARE FULL" };
    health = Math.min(PLAYER_HITS, health + 1); _pcSay("+1 BAR", "#7dffa8");
    return { ok: true, msg: "REPAIRED: +1 BAR (" + health + " / " + PLAYER_HITS + ")" };
}
// a creature killed sometimes drops one where it fell (js/drops.js onPredatorDeath), as the scrap does (js/facilityspawn.js facilityScrapDrop): it lies there a while, then it is gone
function playerKitDrop(p) {
    if (typeof facilityPlay === "undefined" || !facilityPlay || typeof _fp === "undefined" || !_fp || !_fp.items || !p || p.team === "green" || p.isClone || p.noReward) return null;
    if (Math.random() >= PLAYER_COMBAT.drop.chance) return null;
    const room = facilityRoomAt(p.x, p.y, _fp.F); if (!room) return null;
    const f = _pcFrame(), it = _fpPickupItem({ id: "kitdrop_" + (_fp.dropN = (_fp.dropN || 0) + 1), room: room.id, at: [p.x, p.y], items: [[PLAYER_COMBAT.kit.item, 1]] });
    it.temp = true; it.expires = f + PLAYER_COMBAT.drop.life; it.arrive = f; _fp.items.push(it); return it;
}
function _pcKitUseNow() {
    if (typeof invCount !== "function" || typeof invUse !== "function") return false;
    if (invCount(PLAYER_COMBAT.kit.item) > 0) invUse(PLAYER_COMBAT.kit.item); else if (typeof invSay === "function") invSay("NO REPAIR KIT: CREATURES DROP THEM, AND SOME LIE AROUND THE FACILITY", false);
    return true;
}
// THE KIT PILL: beside the dial's other pills (js/targeting.js _tgAmmoIcon), while you carry a kit; a tap uses one. Returns the width it took.
let _KITCHIP = { x: 0, y: 0, w: 0, h: 0 };
function drawKitChip(x, y, alpha) {
    _KITCHIP.w = 0; if (typeof ctx === "undefined" || typeof invCount !== "function") return 0;
    const n = invCount(PLAYER_COMBAT.kit.item); if (n <= 0) return 0;
    const full = typeof health !== "undefined" && health >= PLAYER_HITS, txt = "KIT " + n, hh = 22, col = full ? "#6d8a7a" : "#7dffa8";
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.globalAlpha = alpha || 1; ctx.font = typeof uiMono === "function" ? uiMono(13) : "bold 13px monospace";
    const w = 24 + ctx.measureText(txt).width;
    ctx.fillStyle = "rgba(6,18,12,0.65)"; ctx.strokeStyle = col; ctx.lineWidth = 1; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(x, y - hh / 2, w, hh, 11); else ctx.rect(x, y - hh / 2, w, hh); ctx.fill(); ctx.stroke();
    ctx.fillStyle = col; ctx.fillRect(x + 9.5, y - 5, 3, 10); ctx.fillRect(x + 6, y - 1.5, 10, 3);   // a plus
    ctx.textAlign = "left"; ctx.textBaseline = "middle"; ctx.fillText(txt, x + 20, y + 1);
    ctx.restore();
    _KITCHIP = { x: x - 4, y: y - hh / 2 - 4, w: w + 8, h: hh + 8 };
    return w + 8;
}
// a tap on the pill (js/input.js): true when it was the pill's
function kitChipTap(ex, ey) {
    const c = _KITCHIP; if (!c.w || ex < c.x || ex > c.x + c.w || ey < c.y || ey > c.y + c.h) return false;
    return _pcKitUseNow();
}
// ── GUARD ──
function playerGuardToggle(on) {
    playerGuardOn = on === undefined ? !playerGuardOn : !!on;
    _pcSay(playerGuardOn ? "GUARD UP" : "GUARD DOWN", playerGuardOn ? "#7dffa8" : "#9fb3c8");
    return playerGuardOn;
}
// your pace while it is up (js/facilityplay.js, the player's step)
function playerGuardSpeed() { return playerGuardOn ? PLAYER_COMBAT.guard.speed : 1; }
// a creature's shot about to hit `a` (js/game.js, the shots' hit test): stopped by your guard when `a` is one of your squad near you, and you take the hit
function playerGuardBlocks(p, a) {
    if (!playerGuardOn || !p || !p.targetsGreen || !a || typeof player === "undefined" || a === player || !(a.isFollower || a.isClone)) return false;
    if (Math.hypot(a.x - player.x, a.y - player.y) > PLAYER_COMBAT.guard.reach) return false;
    if (typeof hurtPlayer === "function") hurtPlayer(1, 0, null);   // (one bar; inside the grace after a hit, nothing: one a second at most; no push)
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: p.x, y: p.y, color: "#7dffa8", radius: 0.45, life: 14 });
    if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: a.x, y: a.y, text: "BLOCKED", color: "#7dffa8", life: 45, vy: -0.04, size: 12 });
    return true;
}
// ── STUN DIVE ──
function playerDiveArm() {
    const f = _pcFrame(); if (f < _pcDiveReady) { _pcSay("STUN DIVE RESTING · " + Math.ceil((_pcDiveReady - f) / 60) + " S", "#9fb3c8"); return false; }
    playerDiveArmed = !playerDiveArmed; if (playerDiveArmed) _pcSay("TAP A CREATURE TO DIVE AT IT", "#ffe14d");
    return playerDiveArmed;
}
function playerDiveCancel() { playerDiveArmed = false; }
function playerDiveAt(foe) {
    playerDiveArmed = false; const f = _pcFrame(), D = PLAYER_COMBAT.dive;
    if (!foe || foe.dead || foe.team === "green" || foe.isClone || typeof player === "undefined") return { ok: false, why: "NOT A CREATURE" };
    if (f < _pcDiveReady || _pcDive) return { ok: false, why: "RESTING" };
    const d = Math.hypot(foe.x - player.x, foe.y - player.y), body = foe.bodyR || 0;   // (a huge body, THE ANT QUEEN's, is reached at its edge, and you stop outside it: js/bosses.js)
    if (d - body > D.reach) { _pcSay("TOO FAR TO DIVE", "#ff9c8a"); return { ok: false, why: "TOO FAR" }; }
    const F = typeof _fp !== "undefined" && _fp ? _fp.F : null;
    if (typeof facilitySeesFrom === "function" && F && !facilitySeesFrom(player.x, player.y, foe.x, foe.y)) { _pcSay("YOU CANNOT SEE IT", "#ff9c8a"); return { ok: false, why: "NO SIGHT" }; }
    const k = Math.max(0, (d - D.stop - body) / (d || 1)), tx = player.x + (foe.x - player.x) * k, ty = player.y + (foe.y - player.y) * k;
    if (typeof _fpLos === "function" && F && !_fpLos(player.x, player.y, tx, ty)) { _pcSay("NO CLEAR WAY TO IT", "#ff9c8a"); return { ok: false, why: "NO WAY" }; }   // (the walking line test, as the bosses' and the spawner's: js/facilityplay.js)
    _pcDive = { foe, x0: player.x, y0: player.y, x1: tx, y1: ty, t0: f };
    player.invuln = Math.max(player.invuln || 0, D.frames + 6); player.fpPath = null; _pcDiveReady = f + D.frames + D.rest;
    return { ok: true };
}
// the swoop, a frame at a time (from playerCombatTick); at its end the creature is stunned
function _pcDiveStep(f) {
    const D = PLAYER_COMBAT.dive, V = _pcDive, k = Math.min(1, (f - V.t0) / D.frames);
    player.x = player.targetX = V.x0 + (V.x1 - V.x0) * k; player.y = player.targetY = V.y0 + (V.y1 - V.y0) * k; player.fpPath = null;
    if (k < 1) return;
    _pcDive = null;
    if (V.foe && !V.foe.dead && typeof applyStun === "function") {
        applyStun(V.foe, D.stun);
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: V.foe.x, y: V.foe.y, color: "#ffe14d", radius: 0.7, life: 16 });
        if (typeof floatingTexts !== "undefined") floatingTexts.push({ world: true, x: V.foe.x, y: V.foe.y, text: "STUNNED", color: "#ffe14d", life: 60, vy: -0.04, size: 13 });
    }
}
// a knockout, or a new game: the guard down, no dive in hand or under way (js/game.js, js/facilityplay.js)
function playerCombatReset() { playerGuardOn = false; playerDiveArmed = false; _pcDive = null; }
// ── THE TWO BUTTONS BY THE DIAL (js/targeting.js drawTargetUI): GUARD above STUN, round, just left of the dial; a tap on either (js/input.js) ──
let _GUARDBTN = { x: 0, y: 0, r: 0 }, _DIVEBTN = { x: 0, y: 0, r: 0 };
function _pcButton(x, y, r, label, lit, col, glyph, rest) {
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = lit ? "rgba(10,40,26,0.85)" : "rgba(6,10,24,0.72)"; ctx.fill();
    ctx.lineWidth = lit ? 3 : 1.5; ctx.strokeStyle = lit ? col : "rgba(160,184,214,0.55)"; ctx.stroke();
    if (rest > 0) { ctx.beginPath(); ctx.moveTo(x, y); ctx.arc(x, y, r - 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * rest); ctx.closePath(); ctx.fillStyle = "rgba(0,0,0,0.55)"; ctx.fill(); }
    ctx.fillStyle = lit ? col : rest > 0 ? "#6d7a8c" : "#c8d6e8"; ctx.strokeStyle = ctx.fillStyle; glyph(x, y - 4);
    ctx.font = typeof uiMono === "function" ? uiMono(9) : "bold 9px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(label, x, y + r * 0.55);
}
function drawPlayerCombatChips(A) {
    _GUARDBTN.r = _DIVEBTN.r = 0; if (typeof coreOn === "function" && coreOn()) return;   // (THE CORE holds GUARD and STUN in the corners layout: js/corehud.js)
    if (typeof ctx === "undefined" || !A || typeof facilityPlay === "undefined" || !facilityPlay || (typeof attractOn === "function" && attractOn())) return;
    const r = 22, x = A.left - 30, f = _pcFrame(), restLeft = Math.max(0, _pcDiveReady - f), rest = restLeft > 0 && !_pcDive ? restLeft / (PLAYER_COMBAT.dive.frames + PLAYER_COMBAT.dive.rest) : 0;
    const shield = (cx, cy) => { ctx.beginPath(); ctx.moveTo(cx, cy - 8); ctx.lineTo(cx + 7, cy - 5); ctx.lineTo(cx + 6, cy + 3); ctx.lineTo(cx, cy + 8); ctx.lineTo(cx - 6, cy + 3); ctx.lineTo(cx - 7, cy - 5); ctx.closePath(); ctx.fill(); };
    const bolt = (cx, cy) => { ctx.beginPath(); ctx.moveTo(cx + 2, cy - 9); ctx.lineTo(cx - 5, cy + 1); ctx.lineTo(cx, cy + 1); ctx.lineTo(cx - 2, cy + 9); ctx.lineTo(cx + 5, cy - 1); ctx.lineTo(cx, cy - 1); ctx.closePath(); ctx.fill(); };
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    const pulse = playerDiveArmed ? 0.75 + 0.25 * Math.sin(f * 0.25) : 1;
    _pcButton(x, A.y - 26, r, "GUARD", playerGuardOn, "#7dffa8", shield, 0);
    ctx.globalAlpha = pulse; _pcButton(x, A.y + 26, r, rest > 0 ? Math.ceil(restLeft / 60) + " S" : "STUN", playerDiveArmed, "#ffe14d", bolt, rest); ctx.globalAlpha = 1;
    ctx.restore();
    _GUARDBTN = { x, y: A.y - 26, r: r + 4 }; _DIVEBTN = { x, y: A.y + 26, r: r + 4 };
}
// a tap (js/input.js): true when it was one of the two buttons
function playerCombatTap(ex, ey) {
    if (_GUARDBTN.r && Math.hypot(ex - _GUARDBTN.x, ey - _GUARDBTN.y) <= _GUARDBTN.r) { playerGuardToggle(); return true; }
    if (_DIVEBTN.r && Math.hypot(ex - _DIVEBTN.x, ey - _DIVEBTN.y) <= _DIVEBTN.r) { playerDiveArm(); return true; }
    return false;
}
// on the floor: the guard's reach round you while it is up; the swoop's streak (js/game.js, with the other overlays)
function drawPlayerCombatFx() {
    if (typeof ctx === "undefined" || typeof player === "undefined" || typeof facilityPlay === "undefined" || !facilityPlay || (typeof attractOn === "function" && attractOn())) return;
    const scr = (x, y) => [(x - player.visualX - (y - player.visualY)) * TILE_W + canvas.width / 2, (x - player.visualX + (y - player.visualY)) * TILE_H + canvas.height / 2 - (typeof facilityLiftRel === "function" ? facilityLiftRel(x, y) : 0)];
    ctx.save();
    if (playerGuardOn) {
        const c = scr(player.visualX, player.visualY), R = PLAYER_COMBAT.guard.reach * Math.SQRT2, f = _pcFrame();   // (where the player is drawn: the camera eases after a swoop)
        ctx.globalAlpha = 0.55 + 0.15 * Math.sin(f * 0.1); ctx.strokeStyle = "#7dffa8"; ctx.lineWidth = 2; ctx.setLineDash([10, 8]);
        ctx.beginPath(); ctx.ellipse(c[0], c[1], R * TILE_W, R * TILE_H, 0, 0, Math.PI * 2); ctx.stroke(); ctx.setLineDash([]);
        ctx.globalAlpha = 0.08; ctx.fillStyle = "#7dffa8"; ctx.fill();
    }
    if (_pcDive) {
        const a = scr(_pcDive.x0, _pcDive.y0), b = scr(player.visualX, player.visualY);
        ctx.globalAlpha = 0.8; ctx.strokeStyle = "#ffe14d"; ctx.lineWidth = 6; ctx.lineCap = "round"; ctx.beginPath(); ctx.moveTo(a[0], a[1] - 20); ctx.lineTo(b[0], b[1] - 20); ctx.stroke();
    }
    ctx.restore();
}
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => {
    const k = e && !e.repeat ? String(e.key || "").toLowerCase() : ""; if (!k || typeof facilityPlay === "undefined" || !facilityPlay || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName || ""))) return;
    if (k === PLAYER_COMBAT.guard.key) playerGuardToggle(); else if (k === PLAYER_COMBAT.dive.key) playerDiveArm();
}); } catch (err) { /* no keyboard: the buttons */ }
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => {
    if (!e || e.repeat || String(e.key || "").toLowerCase() !== PLAYER_COMBAT.kit.key || typeof facilityPlay === "undefined" || !facilityPlay || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName || ""))) return;
    _pcKitUseNow();
}); } catch (err) { /* no keyboard: the pill and the pack */ }
