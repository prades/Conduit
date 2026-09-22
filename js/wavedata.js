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
// ──────────────────────────────────────────────────────
//  PROGRESSION — A CLEARED WAVE EARNS AN ELEMENT
//
//  Two steps on purpose. Clearing a wave EARNS an element; it sits pending
//  until you walk back to the Crystal and activate it. That makes the Crystal
//  somewhere you return to rather than a thing you defend, and it is what gives
//  the modulation chip something to chew on: a new element arrives, the mix
//  goes stale, and you decide what your followers are made of next.
//
//  This replaced a kill ladder (25 / 60 / 110 / 180 lifetime kills). Kills are
//  still counted — they are the record of what you have fought, and the Crystal
//  shows the total — but they no longer gate anything.
//
//  ON LENGTH: there are six elements and two are granted at the start, so there
//  are exactly FOUR to earn. At one per cleared wave the ladder is spent after
//  four waves, and nextWaveUnlock() returns null from then on. That is the rate
//  asked for; carrying earnable rewards past wave four means more elements, or
//  something other than elements to earn.
// ──────────────────────────────────────────────────────

// The order they arrive in, one per cleared wave. Derived from ELEMENTS rather
// than written out again, so adding an element to that list extends the ladder
// instead of leaving the new element unreachable.
const WAVE_UNLOCK_ORDER = ELEMENTS
    .map(e => e.id)
    .filter(id => !STARTING_ELEMENTS.includes(id));

// The next element still to be earned, or null when the ladder is spent. It
// arrives on the next cleared wave, so there is no distance to report — the
// readout says which one is coming, not how far away it is.
function nextWaveUnlock() {
    for (const id of WAVE_UNLOCK_ORDER) {
        if (unlockedElements.has(id)) continue;
        if (pendingElements.includes(id)) continue;
        return { element: id };
    }
    return null;
}

// Called once per enemy killed. Kills are a running total now, not a gate.
function noteKillForProgression() {
    lifetimeKills++;
    saveProgress();
}

// Called once per cleared wave. The earned element goes to pendingElements,
// NOT straight into unlockedElements — the Crystal is where it comes online.
//
// Clearing another wave while one is still pending stacks a second: the reward
// is for the wave, so putting off the trip back does not forfeit it.
function noteWaveClearedForProgression() {
    const next = nextWaveUnlock();
    if (!next) return null;
    pendingElements.push(next.element);
    saveProgress();
    const def = ELEMENTS.find(e => e.id === next.element);
    floatingTexts.push({
        x: canvas.width / 2, y: canvas.height / 2 - 90,
        text: (def ? def.label : next.element.toUpperCase()) + " EARNED — ACTIVATE AT THE CRYSTAL",
        color: def ? def.color : "#0f8", life: 260, vy: -0.16, size: 15,
    });
    return next.element;
}

// The deliberate act at the Crystal. Returns the element activated, or null.
function activatePendingElement(elementId) {
    const at = pendingElements.indexOf(elementId);
    if (at < 0) return null;
    pendingElements.splice(at, 1);
    unlockedElements.add(elementId);
    saveUnlocks();
    saveProgress();
    const def = ELEMENTS.find(e => e.id === elementId);
    floatingTexts.push({
        x: canvas.width / 2, y: canvas.height / 2 - 70,
        text: (def ? def.label : elementId.toUpperCase()) + " ONLINE — RE-MODULATE THE CRYSTAL",
        color: def ? def.color : "#0f8", life: 260, vy: -0.16, size: 15,
    });
    // The pool just changed, so whatever the slider was pointing at is stale.
    modulationDirty = true;
    return elementId;
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

