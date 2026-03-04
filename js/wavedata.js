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

// kills needed to clear the night — scales each wave
function enemiesThisWave() {
    // Night 1: kill 3, Night 2: kill 5, Night 3: kill 7 etc
    return WAVE_CONFIG.baseEnemies + (gameState.nightNumber - 1) * WAVE_CONFIG.enemiesPerWave;
}
function predatorsThisWave() {
    return WAVE_CONFIG.predatorsPerWave + Math.floor((gameState.nightNumber - 1) * WAVE_CONFIG.predatorExtraPerWave);
}

let nightKillCount    = 0;
let nightPredatorsRemaining = 0;
let nightEnemiesTarget = 0;

// Per-zone predator tracking — one predator slot per hostile zone
// zonePredators[zoneIndex] = predator actor or null
let zonePredators = {};
let zoneRespawnTimers = {}; // zoneIndex -> frames until respawn

// ─────────────────────────────────────────────────────────
//  SHOP
// ─────────────────────────────────────────────────────────
const SHOP_ITEMS = [
    { id:"unlock_ice",    label:"Unlock ICE",    cost:20,  element:"ice",
      apply() { unlockedElements.add("ice");   saveUnlocks(); } },
    { id:"unlock_flux",   label:"Unlock FLUX",   cost:25,  element:"flux",
      apply() { unlockedElements.add("flux");  saveUnlocks(); } },
    { id:"unlock_core",   label:"Unlock CORE",   cost:30,  element:"core",
      apply() { unlockedElements.add("core");  saveUnlocks(); } },
    { id:"unlock_toxic",  label:"Unlock TOXIC",  cost:35,  element:"toxic",
      apply() { unlockedElements.add("toxic"); saveUnlocks(); } },
    { id:"crystal_repair",label:"Repair Crystal",cost:15,
      apply() { crystal.health = Math.min(crystal.maxHealth, crystal.health + 80); } },
    { id:"spawn_follower",label:"+1 Follower",   cost:10,
      apply() { spawnFollowerAtCrystal("fire"); } },
    { id:"more_zones",    label:"+1 Zone",       cost:20,
      apply() { activeDayZones++; } }
];
let boughtItems = new Set();
