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
//  PROGRESSION — KILLS EARN ELEMENTS, THE CRYSTAL ACTIVATES THEM
//
//  Two steps on purpose. Killing things EARNS an element; it sits pending
//  until you walk back to the Crystal and activate it. That makes the Crystal
//  a place you return to rather than a thing you defend, and it gives the
//  modulation slider — which until now drew a label and nothing else — a real
//  job: it decides which of your activated elements new recruits draw from.
//
//  Earning is one-way and cumulative. Activating is the deliberate act.
// ─────────────────────────────────────────────────────────
const KILL_UNLOCKS = [
    { kills:  25, element: "ice"   },
    { kills:  60, element: "flux"  },
    { kills: 110, element: "core"  },
    { kills: 180, element: "toxic" },
];

// The next element still to be earned, with how many kills remain — drives the
// on-screen readout so the player can see what they are working toward.
function nextKillUnlock() {
    for (const u of KILL_UNLOCKS) {
        if (unlockedElements.has(u.element)) continue;
        if (pendingElements.includes(u.element)) continue;
        return { element: u.element, at: u.kills, remaining: Math.max(0, u.kills - lifetimeKills) };
    }
    return null;
}

// Called once per enemy killed. Earned elements go to pendingElements, NOT
// straight into unlockedElements — the Crystal is where they come online.
function noteKillForProgression() {
    lifetimeKills++;
    saveProgress();
    for (const u of KILL_UNLOCKS) {
        if (lifetimeKills < u.kills) break;               // the list is ordered
        if (unlockedElements.has(u.element)) continue;
        if (pendingElements.includes(u.element)) continue;
        pendingElements.push(u.element);
        saveProgress();
        const def = ELEMENTS.find(e => e.id === u.element);
        floatingTexts.push({
            x: canvas.width / 2, y: canvas.height / 2 - 90,
            text: (def ? def.label : u.element.toUpperCase()) + " EARNED — ACTIVATE AT THE CRYSTAL",
            color: def ? def.color : "#0f8", life: 260, vy: -0.16, size: 15,
        });
    }
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

