// ─────────────────────────────────────────────────────────
//  THE CRYSTAL'S POWER (the owner, 2026-11-01; docs/FACILITY.md "The Crystal's power")
// ─────────────────────────────────────────────────────────
// ASKED: "make it to where the crystal powers the turrets, and also powers the revival of you and the followers, and it's tied to the network meter at the top now. And crystal can be charged up 75% by a 50 shard
// cost, or it'll heal up over time if it's idle." The owner's answers, asked the same day: ONE POOL, its health ("Ant bites, turret shots and revivals all draw on the same charge; if it hits zero the Crystal falls and
// the game is over"); the network meter's big ring shows it; a tap on the meter charges it; idle, it refills whole in about FIVE MINUTES; the costs "Light"; a RESERVE of 10%; a follower whose revival can't be paid
// WAITS; your own revival that can't be paid is GAME OVER; the turrets run on the Crystal ALONE (the relays only light rooms, and the charging station).
//   THE CHARGE        crystal.health / crystal.maxHealth (js/facilityplay.js makes the Crystal; js/facilitysave.js keeps its health).
//   A DRAW            a turret's shot (js/stations.js facilitySentryTick), a follower's return from the respawn queue and yours from the third hit (js/game.js) each take CRYSTAL_POWER.cost[kind] of its full
//                     charge, while it is ABOVE the reserve; at or below it they are not paid: the turrets go quiet, a follower waits at the Crystal, and your third hit ends the run. Only an ant's bite takes it
//                     lower. (A draw is allowed while above the reserve even when it ends a little under it: the costs are small.)
//   IDLE REFILL       with no alarm up, no ant raid on (js/antraids.js) and nothing drawn for CRYSTAL_POWER.refill.idleAfter frames it refills whole in refill.fullFrames (it was CRYSTAL_REGEN, 0.01 a frame while no alarm was up).
//   THE CHARGE AT ◆50 a tap on the network meter (js/facilitynet.js, js/input.js): CRYSTAL_POWER.charge.price shards for charge.amount of the full charge, up to the full.
//   THE TUTORIAL      while it runs (until _fp.tut.script.doneAt) nothing is paid from the Crystal: its assault keeps its own mercy (js/tutorial.js) and a knock-back there is never a loss.
// Every number is the owner's answer; the reserve and the idle wait are knobs.
const CRYSTAL_POWER = {
    reserve: 0.10,                                            // the owner: "Stop at 10%"
    cost: { shot: 0.001, follower: 0.03, player: 0.05 },     // the owner: "Light": a turret's shot 0.1%, a follower's revival 3%, yours 5%
    refill: { fullFrames: 18000, idleAfter: 180 },            // the owner: "Full in ~5 minutes" when idle; idle: no alarm up and nothing drawn for 3 s (PROVISIONAL)
    charge: { price: 50, amount: 0.75 },                      // the owner: "charged up 75% by a 50 shard cost"
};
let _crystalDrawnAt = -1e9;   // the frame of the last draw (for the idle refill)

function _cpFrame() { return typeof frame !== "undefined" ? frame : 0; }
function _cpSay(text, col) { if (typeof floatingTexts !== "undefined" && typeof canvas !== "undefined" && canvas) floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 90, text, color: col || "#9fe8ff", life: 150, vy: -0.25, size: 14 }); }
// is the Crystal's power in play? (not while the tutorial runs)
function crystalPowerOn() { const S = typeof _fp !== "undefined" && _fp && _fp.tut && _fp.tut.script; return !!(S && S.doneAt); }
// its charge, 0 to 1
function crystalCharge() { return typeof crystal !== "undefined" && crystal && crystal.maxHealth ? Math.max(0, Math.min(1, crystal.health / crystal.maxHealth)) : 0; }
// may it pay for something now? (above the reserve)
function crystalCanDraw() { return crystalCharge() > CRYSTAL_POWER.reserve + 1e-9; }
// pay for a use (kind: "shot", "follower", "player"): true when paid (or free: the tutorial), false when it is at or below the reserve
function crystalDraw(kind) {
    if (!crystalPowerOn()) return true;
    if (!crystalCanDraw()) return false;
    const c = CRYSTAL_POWER.cost[kind] || 0;
    crystal.health = Math.max(0, crystal.health - c * crystal.maxHealth);
    _crystalDrawnAt = _cpFrame();
    return true;
}
// THE IDLE REFILL (js/game.js, each frame): no alarm up and nothing drawn for a while
function crystalRefillTick() {
    if (typeof crystal === "undefined" || !crystal || !crystal.maxHealth || crystal.health <= 0 || crystal.health >= crystal.maxHealth) return;
    if (typeof alertActive !== "undefined" && alertActive) return;
    if (typeof raidActive === "function" && raidActive()) return;   // (nor while an ant raid is on: js/antraids.js)
    if (_cpFrame() - _crystalDrawnAt < CRYSTAL_POWER.refill.idleAfter) return;
    crystal.health = Math.min(crystal.maxHealth, crystal.health + crystal.maxHealth / CRYSTAL_POWER.refill.fullFrames);
}
// THE CHARGE AT ◆50 (a tap on the network meter): { ok, why }
function crystalChargeWhyNot() {
    if (typeof crystal === "undefined" || !crystal || !crystal.maxHealth) return "NO CRYSTAL";
    if (crystal.health >= crystal.maxHealth - 1e-6) return "THE CRYSTAL IS FULL";
    const have = typeof shardCount === "number" ? shardCount : 0;
    if (have < CRYSTAL_POWER.charge.price) return "NEED ◆" + (CRYSTAL_POWER.charge.price - have) + " MORE TO CHARGE THE CRYSTAL";
    return null;
}
function crystalBuyCharge() {
    const why = crystalChargeWhyNot(); if (why) { _cpSay(why, "#ff9a7a"); return { ok: false, why }; }
    shardCount -= CRYSTAL_POWER.charge.price;
    const before = crystal.health;
    crystal.health = Math.min(crystal.maxHealth, crystal.health + CRYSTAL_POWER.charge.amount * crystal.maxHealth);
    _cpSay("◈ THE CRYSTAL CHARGED +" + Math.round((crystal.health - before) / crystal.maxHealth * 100) + "% · ◆" + CRYSTAL_POWER.charge.price, "#9dffb6");
    if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: crystal.x, y: crystal.y, color: "#9fe8ff", radius: 2.2, life: 40 });
    return { ok: true };
}
