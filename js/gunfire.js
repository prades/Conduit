// ─────────────────────────────────────────────────────────
//  THE PLAYER'S GUN: lock on, click as often as you like, or hold to keep firing
// ─────────────────────────────────────────────────────────
// ASKED: "click on an enemy, and once you click attack on it, then you can click it as many times as you want to shoot it. Or hold down to fire repeatedly."
// The way in is unchanged: a long press on an enemy opens its ring and ATTACK arms the gun (js/commands.js), and that enemy is now LOCKED ON (a red reticle on it). Once armed:
//   CLICK   a press on an enemy fires at it, at once if the gun is ready; a click while it is still cycling is kept and fires the moment it is ready (any number of clicks: each one is a shot, within the gun's rate)
//   HOLD    keep the press down and the gun keeps firing at the cooldown rate, aiming at whatever enemy is under the finger (or at the locked one when the finger drifts a little: the locked enemy is easier to hit)
// No ring opens and no move order starts under a press that began on an enemy while armed. Out of ammunition the hold stops (one "OUT OF AMMO"). STOW (the ammo chip) puts the gun away and ends the lock.
// The shot itself is firePlayerShot (js/input.js): 10 damage, the class's rate (classStat), one round.

const GUN = { lockPick: 90, buffer: 30 };   // how far (px) from a locked enemy still counts as on it; the least time (frames) a click made while the gun cycles is kept (it is kept until the gun is ready)
let playerLockTarget = null;                // the enemy the player locked on (the ring's ATTACK), or null
let gunHold = null;                         // a press that began on an enemy while armed: { x, y, pending, released, until }; button: true when it is the targeting dial's (js/targeting.js), which fires at the locked enemy wherever the finger is

function _gunScreen(a) { return { x: (a.x - player.visualX - (a.y - player.visualY)) * TILE_W + canvas.width / 2, y: (a.x - player.visualX + (a.y - player.visualY)) * TILE_H + canvas.height / 2 + TILE_H - (typeof facilityPlay !== "undefined" && facilityPlay && typeof facilityLiftRel === "function" ? facilityLiftRel(a.x, a.y) : 0) - 55 }; }
function _gunLive(a) { return !!a && !a.dead && a.team !== "green" && !a.isClone; }
// the enemy a press at (ex, ey) means: the one under it, else the locked one if it is near
function gunTargetAt(ex, ey) {
    const f = typeof findEnemyAtScreen === "function" ? findEnemyAtScreen(ex, ey) : null; if (f) return f;
    if (_gunLive(playerLockTarget)) { const p = _gunScreen(playerLockTarget); if (Math.hypot(ex - p.x, ey - p.y) <= GUN.lockPick) return playerLockTarget; }
    return null;
}
function gunLock(enemy) { playerLockTarget = _gunLive(enemy) ? enemy : null; }
function gunStow() { playerLockTarget = null; gunHold = null; if (typeof mutatorCancel === "function") mutatorCancel(); }   // (the Mutator's lash is called off with it: js/mutator.js)
// a press: true when it is the gun's (the caller then starts nothing else)
function gunPress(ex, ey) {
    if (!playerAttackMode) return false;
    const foe = gunTargetAt(ex, ey); if (!foe) return false;
    playerLockTarget = foe; gunHold = { x: ex, y: ey, pending: true, released: false, until: 0 };
    gunTick();   // (a ready gun fires on the press itself)
    return true;
}
function gunMove(ex, ey) { if (gunHold && !gunHold.button) { gunHold.x = ex; gunHold.y = ey; } }
function gunRelease() { if (gunHold) { gunHold.released = true; gunHold.until = (typeof frame !== "undefined" ? frame : 0) + Math.max(GUN.buffer, (player.attackCooldown || 0) + 3); } }
// each frame, after the gun's cooldown has ticked
function gunTick() {
    if (!_gunLive(playerLockTarget)) playerLockTarget = null;
    if (!gunHold) return;
    if (!playerAttackMode) { gunHold = null; return; }
    const now = typeof frame !== "undefined" ? frame : 0, held = !gunHold.released;
    if (player.attackCooldown <= 0 && (held || gunHold.pending)) {
        const foe = gunHold.button ? playerLockTarget : gunTargetAt(gunHold.x, gunHold.y) || (held ? playerLockTarget : null);
        if (foe) {
            if (typeof weaponDry === "function" ? weaponDry() : playerAmmo <= 0) { firePlayerShot(foe); gunHold = null; return; }   // (says OUT OF AMMO once, and the hold ends)
            if (firePlayerShot(foe)) gunHold.pending = false;
        } else if (!held) gunHold.pending = false;
    }
    if (gunHold && gunHold.released && (!gunHold.pending || now > gunHold.until)) gunHold = null;
}
// the lock's reticle: four red corners round the locked enemy, turning in and out
function drawLockReticle() {
    if (!playerAttackMode || !_gunLive(playerLockTarget) || typeof ctx === "undefined") return;
    const p = _gunScreen(playerLockTarget), f = typeof frame !== "undefined" ? frame : 0, r = 26 + 3 * Math.sin(f * 0.15), k = 9;
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.strokeStyle = "#ff4a3a"; ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.globalAlpha = 0.9;
    for (const [sx, sy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { ctx.beginPath(); ctx.moveTo(p.x + sx * r, p.y + sy * (r - k)); ctx.lineTo(p.x + sx * r, p.y + sy * r); ctx.lineTo(p.x + sx * (r - k), p.y + sy * r); ctx.stroke(); }
    ctx.restore();
}
