// ─────────────────────────────────────────────────────────
//  NPC TYPES
// ─────────────────────────────────────────────────────────
const NPC_TYPES = {
    virus:   { maxHealth:10, moveSpeed:0.025, color:"#888", power:5  },
    lobster: { maxHealth:25, moveSpeed:0.03,  color:"#f55", power:10 },
    turtle:  { maxHealth:40, moveSpeed:0.02,  color:"#5af", power:15 }
};

// ─────────────────────────────────────────────────────────
//  WAVE ESCALATION CONFIG
// ─────────────────────────────────────────────────────────
const WAVE_CONFIG = {
    baseEnemies: 3,
    enemiesPerWave: 2,       // extra per wave
    predatorsPerWave: 1,     // predators that spawn per night
    predatorExtraPerWave: 1  // extra predators per wave
};

// kills needed to clear the night — based on alarm zone, not wave count
// Zone 1 = short waves (3 kills), deeper zones = more kills
// Gentle +1 per 5 nights so zone-1 farming eventually gets slightly harder
function enemiesThisWave() {
    const alarmZone = (alertSource && typeof getZoneIndex === "function")
        ? getZoneIndex(Math.floor(alertSource.x))
        : 1;
    const zoneBase   = 2 + Math.max(1, alarmZone);          // zone1=3, z2=4, z3=5, z4=6
    const nightBonus = Math.floor((gameState.nightNumber - 1) / 5); // +1 per 5 nights
    return zoneBase + nightBonus;
}
function predatorsThisWave() {
    // Zone-based count: emphasis on strength (via class), not raw numbers
    const alarmZone = (alertSource && typeof getZoneIndex === "function")
        ? getZoneIndex(Math.floor(alertSource.x))
        : 1;
    return 1 + Math.floor(alarmZone / 3); // zone1-2=1, zone3-4=2
}

let nightKillCount    = 0;
let nightPredatorsRemaining = 0;
let nightEnemiesTarget = 0;

// Per-zone predator tracking — array of predator actors per zone
// zonePredators[zoneIndex] = [ predator, ... ]
let zonePredators = {};
let zoneRespawnTimers = {}; // zoneIndex -> frames until respawn

// ─────────────────────────────────────────────────────────
//  SHOP
// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
//  DEPTH PROGRESSION
//
//  Elements used to be bought from the shop. They come from depth now: kill a
//  zone's nest and you take the element that zone's species fight with. The
//  tunnel is the progression — you do not get stronger, you get deeper.
//
//  A dead nest is permanent (restoreWorldBetweenWaves deliberately keeps them
//  dead), so this is a one-way ratchet and needs no bookkeeping of its own —
//  unlockedElements IS the record, and it already persists.
// ─────────────────────────────────────────────────────────
const DEPTH_ELEMENT_UNLOCKS = { 1: "ice", 2: "flux", 3: "core", 4: "toxic" };

// The element a zone's nest hands over, if any. Zone 0 is home and gives
// nothing; past the last entry there is nothing left to unlock.
function depthUnlockFor(zoneIndex) {
    return DEPTH_ELEMENT_UNLOCKS[zoneIndex] || null;
}

// Watches for newly dead nests rather than hooking each place that damages one
// — nestHealth is written from several element effects and the destroy_nest
// job, and a watcher cannot be forgotten when a seventh site is added.
function checkDepthUnlocks() {
    if (typeof _nestCache === "undefined") return;
    for (const t of _nestCache) {
        if (!t.nest || t.nestHealth > 0) continue;
        const el = depthUnlockFor(t.nestZone);
        if (!el || unlockedElements.has(el)) continue;
        unlockedElements.add(el);
        saveUnlocks();
        const def = ELEMENTS.find(e => e.id === el);
        floatingTexts.push({
            x: t.x, y: t.y - 1.5,
            text: (def ? def.label : el.toUpperCase()) + " TAKEN FROM ZONE " + t.nestZone,
            color: def ? def.color : "#0f8", life: 220, vy: -0.16, size: 14,
        });
    }
}

// The shop is gone — all four panes (Supply, Pylons, Armaments, Builds) and
// every item in them. Progression is depth now, not purchases: see
// DEPTH_ELEMENT_UNLOCKS above. The four lists held element unlocks, permanent
// pylon buffs, one-shot armaments and the 21 crystal builds.
//
// activeCrystalBuild was ONLY ever assigned from the Builds pane and one tab in
// clone.js. With both gone it stays null for good, so the branches that read it
// never fire. Those dead branches are a separate sweep, not silently left as
// working code.

