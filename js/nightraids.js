// ─────────────────────────────────────────────────────────
//  NIGHT RAIDS — two more siege nights
// ─────────────────────────────────────────────────────────
// REPORTED: "make different types of night raid statuses. One where it's a
// lateral attack and all the nests start leaking predators into the map
// instead of just one at the very end of the tunnel. And one where it's like a
// really big boss monster."
//
//   LATERAL ATTACK  Every enemy nest in range sends at full alarm strength, not
//                   just the one at the far end (game.js, the spawner reads
//                   siegeIs("lateral")) — and the nests you have TAKEN leak
//                   too: each one keeps up to LATERAL_PER_NEST predators
//                   coming out of it, inside your own ground, so the night
//                   comes at you from the sides and behind as well as ahead.
//   BEHEMOTH        One huge boss predator stalks the night: the wave's main
//                   species at boss class, BEHEMOTH_LEVELS above the zone,
//                   BEHEMOTH_HP× health, BEHEMOTH_POWER× bite, twice the size,
//                   too heavy to drag. Its health is the bar across the top of
//                   the screen. The night cannot be cleared while it lives, and
//                   it drops a fortune (BEHEMOTH_REWARD×) and a lot of XP.

const LATERAL_PER_NEST = 2;      // predators each taken nest keeps out at once
const LATERAL_EVERY    = 240;    // frames between one nest's leaks
const BEHEMOTH_LEVELS  = 5;
const BEHEMOTH_HP      = 6;
const BEHEMOTH_POWER   = 1.5;
const BEHEMOTH_SIZE    = 2;
const BEHEMOTH_REWARD  = 5;      // × its shard and DNA drops

let behemoth = null, _behemothSpawned = false;

// ── LATERAL ATTACK ────────────────────────────────────────
// A nest you hold: a wall nest that is dead (taken), not the home portal.
function _heldNest(t) {
    return !!t && t.nest && !(t.nestHealth > 0) && t.nestZone >= 1
        && !(typeof isHomePortal === "function" && isHomePortal(t)) && !t._infestNest;
}
function lateralTick() {
    if (!(typeof siegeIs === "function" && siegeIs("lateral")) || !alertActive || gameState.phase !== "night") return 0;
    const f = typeof frame !== "undefined" ? frame : 0;
    let n = 0;
    for (const t of world) {
        if (!_heldNest(t)) continue;
        t._lateral = (t._lateral || []).filter(p => p && !p.dead);
        if (t._lateral.length >= LATERAL_PER_NEST) continue;
        if (f - (t._lateralAt || -1e9) < LATERAL_EVERY) continue;
        if (typeof livePredatorCount === "function" && typeof MAX_LIVE_PREDATORS !== "undefined" && livePredatorCount() >= MAX_LIVE_PREDATORS) return n;
        t._lateralAt = f;
        const p = spawnPredatorForZone(t.nestZone);
        if (!p) continue;
        // Out of the nest's mouth, into your ground, hostile at once.
        p.x = t.x + (Math.random() - 0.5) * 1.2; p.y = 0.2 + Math.random() * 0.6;
        p.isWanderer = false; p.state = "hunt"; p._lateral = true;
        t._lateral.push(p); n++;
        if (typeof elementEffects !== "undefined") elementEffects.push({ type: "impact", x: t.x, y: 0, color: "#ff5533", radius: 0.7, life: 24 });
        if (!t._lateralSaid) {
            t._lateralSaid = true;
            floatingTexts.push({ x: t.x, y: t.y - 1, text: "⚠ ZONE " + t.nestZone + " NEST IS LEAKING", color: "#ff7755", life: 150, vy: -0.05, size: 12 });
        }
    }
    return n;
}

// ── BEHEMOTH ──────────────────────────────────────────────
function behemothAlive() { return !!behemoth && !behemoth.dead; }
function behemothTick() {
    const on = typeof siegeIs === "function" && siegeIs("behemoth") && alertActive && gameState.phase === "night";
    if (!(typeof siegeIs === "function" && siegeIs("behemoth"))) { behemoth = null; _behemothSpawned = false; return null; }
    if (!on || _behemothSpawned) return behemoth;
    const z = Number.isFinite(alertZone) && alertZone >= 1 ? alertZone : (typeof nextZoneToTake === "function" ? nextZoneToTake() : 1);
    const sp = typeof ladderMainSpecies === "function" ? ladderMainSpecies(gameState.nightNumber) : "ant";
    const p = spawnPredatorForZone(z, { species: sp, className: "boss" });
    if (!p) return null;
    _behemothSpawned = true;
    makeBehemoth(p);
    behemoth = p;
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 150, text: "☠ A BEHEMOTH RISES IN ZONE " + z, color: "#ff3355", life: 240, vy: -0.06, size: 18 });
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 10);
    return p;
}
// Turn a predator into the night's behemoth.
function makeBehemoth(p) {
    if (typeof setPredatorLevel === "function") setPredatorLevel(p, (p.level || 5) + BEHEMOTH_LEVELS, true);
    p.maxHealth = Math.round(p.maxHealth * BEHEMOTH_HP); p.health = p.maxHealth;
    p.power = Math.round(p.power * BEHEMOTH_POWER);
    if (p.dimensions) { p.dimensions.width = Math.round(p.dimensions.width * BEHEMOTH_SIZE); p.dimensions.height = Math.round(p.dimensions.height * BEHEMOTH_SIZE); }
    p.shardDrop = Math.round((p.shardDrop || 2) * BEHEMOTH_REWARD);
    p.dnaDrops  = Math.round((p.dnaDrops || 1) * BEHEMOTH_REWARD);
    p.isBoss = true; p.isBehemoth = true; p.isWanderer = false; p.state = "hunt";
    p.huntsPylons = false;
    return p;
}
// While it lives, the night is not over (checkWaveClear, waves.js).
function behemothBlocksClear() { return typeof siegeIs === "function" && siegeIs("behemoth") && _behemothSpawned && behemothAlive(); }
// Its passing.
function behemothDeathCheck() {
    if (!behemoth || !behemoth.dead || behemoth._mourned) return;
    behemoth._mourned = true;
    floatingTexts.push({ x: canvas.width / 2, y: canvas.height / 2 - 150, text: "☠ THE BEHEMOTH FALLS", color: "#ffd866", life: 220, vy: -0.08, size: 18 });
    if (typeof shake !== "undefined") shake = Math.max(shake || 0, 14);
    if (typeof updateKillProgressUI === "function") updateKillProgressUI();
}
// Its health, across the top of the screen.
function drawBehemothBar() {
    if (!behemothAlive()) return;
    const b = behemoth, W = Math.min(420, canvas.width - 40), x = Math.round((canvas.width - W) / 2), y = 132;
    const k = Math.max(0, b.health / b.maxHealth);
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.fillStyle = "rgba(0,0,0,0.75)"; ctx.fillRect(x - 4, y - 16, W + 8, 30);
    ctx.fillStyle = "#3a0612"; ctx.fillRect(x, y, W, 9);
    ctx.fillStyle = "#ff3355"; ctx.fillRect(x, y, Math.round(W * k), 9);
    ctx.strokeStyle = "#ff8899"; ctx.lineWidth = 1; ctx.strokeRect(x + 0.5, y + 0.5, W - 1, 8);
    ctx.fillStyle = "#ffd0d8"; ctx.font = "bold 10px monospace"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    const kind = (typeof unitTypeLabel === "function" ? unitTypeLabel(b) : (b.speciesName || "").toUpperCase());
    ctx.fillText("☠ BEHEMOTH · Lv " + (b.level || "?") + " " + kind + " · " + Math.ceil(b.health) + " / " + b.maxHealth, canvas.width / 2, y - 7);
    ctx.restore();
}
