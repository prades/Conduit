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
// STEP 2 (next): GUARD and STUN DIVE.
// Every number here is the agent's, provisional, but the refill's (the owner's).
const PLAYER_COMBAT = {
    refill: { after: 600, every: 480 },          // the owner: "Slow": after 10 s out of danger, one bar every 8 s
    kit: { item: "repair_kit", key: "h" },
    drop: { chance: 0.08, life: 3600 },           // (provisional) one kill in twelve or so drops a kit; it lies there a minute
    nearEvery: 15,                                // the danger test is asked every quarter second, not every frame (it is a sight test for each creature near)
};

function _pcFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _pcSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof player !== "undefined" && player) floatingTexts.push({ world: true, x: player.x, y: player.y, text, color: col || "#7dffa8", life: 70, vy: -0.035, size: 13 }); }

// ── THE REFILL (every frame of the facility: js/facilitytutorial.js facilityTutorialTick) ──
function playerCombatTick() {
    if (typeof facilityPlay === "undefined" || !facilityPlay || typeof player === "undefined" || !player || typeof health === "undefined") return;
    if (typeof attractOn === "function" && attractOn()) return;
    const f = _pcFrame(), R = PLAYER_COMBAT.refill, P = player;
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
try { if (typeof window !== "undefined" && window.addEventListener) window.addEventListener("keydown", e => {
    if (!e || e.repeat || String(e.key || "").toLowerCase() !== PLAYER_COMBAT.kit.key || typeof facilityPlay === "undefined" || !facilityPlay || (e.target && /INPUT|TEXTAREA/.test(e.target.tagName || ""))) return;
    _pcKitUseNow();
}); } catch (err) { /* no keyboard: the pill and the pack */ }
