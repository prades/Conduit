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
      apply() { const pool=[...unlockedElements]; spawnFollowerAtCrystal(pool[Math.floor(Math.random()*pool.length)]||"fire"); } },
    { id:"more_zones",    label:"+1 Zone",       cost:20,
      apply() { activeDayZones++; } },
    // ── CRYSTAL BUILDS ───────────────────────────────────
    { id:"ghostphage",    label:"◈ Ghostphage  [Crystal Build]",  cost:80,
      apply() { activeCrystalBuild="ghostphage"; } }
];
let boughtItems = new Set();

// ─────────────────────────────────────────────────────────
//  PERMANENT UPGRADE STATE  (persists across waves)
// ─────────────────────────────────────────────────────────
let permUpgrades         = new Set();   // IDs of one-time-per-game purchases
let pylonMaxHPBonus      = 0;           // added to new pylon maxHealth
let pylonRangeBonus      = 0;           // added to new attack pylon's attackRange
let pylonFireRateBonus   = 0;           // subtracted from 90-frame fire threshold
let followerPermPowerBonus = 0;         // added to every follower's power
let followerPermHPBonus    = 0;         // added to every follower's maxHealth/health

// Returns the number of zones the player controls (home + captured nodes)
function getControlledZones() {
    const captured = (typeof capturedNodes !== "undefined")
        ? capturedNodes.filter(n => n.type === 'capacitor_node' || n.type === 'signal_tower').length
        : 0;
    return 1 + captured;
}

// ─────────────────────────────────────────────────────────
//  PYLON SHOP ITEMS
// ─────────────────────────────────────────────────────────
const PYLON_SHOP_ITEMS = [
    { id:"pylon_reinforce", label:"Fortify Grid", cost:30, oneTimeGame:true,
      desc:"+40 max HP to all green pylons (permanent)",
      apply() {
          pylonMaxHPBonus += 40;
          world.forEach(t => {
              if (t.pillar && !t.destroyed && t.pillarTeam === "green") {
                  t.maxHealth += 40; t.health = Math.min(t.health + 40, t.maxHealth);
              }
          });
      }
    },
    { id:"pylon_repair", label:"Emergency Repair", cost:18,
      desc:"Restore all green pylons to full HP",
      apply() {
          world.forEach(t => {
              if (t.pillar && !t.destroyed && t.pillarTeam === "green" && t.health > 0)
                  t.health = t.maxHealth;
          });
      }
    },
    { id:"pylon_season", label:"Season Pylons", cost:25,
      desc:"Instantly +1 season level to all active pylons (+25% power each)",
      apply() {
          world.forEach(t => {
              if (t.pillar && !t.destroyed && t.pillarTeam === "green" && t.health > 0)
                  t.seasoned = Math.min(3, (t.seasoned||0) + 1);
          });
      }
    },
    { id:"pylon_extend_range", label:"Extended Reach", cost:35, oneTimeGame:true,
      desc:"+1 attack range tile to all attack-mode pylons (permanent)",
      apply() {
          pylonRangeBonus++;
          world.forEach(t => {
              if (t.pillar && !t.destroyed && t.attackMode)
                  t.attackRange = (t.attackRange || 2.5) + 1;
          });
      }
    },
    { id:"pylon_overclock", label:"Overclock", cost:45, oneTimeGame:true,
      desc:"Pylons fire ~35% faster (permanent)",
      apply() { pylonFireRateBonus = 32; }
    },
    { id:"pylon_upgrade_all", label:"Upgrade All", cost:55,
      desc:"Mark all green pylons as upgraded — no more energy decay",
      apply() {
          world.forEach(t => {
              if (t.pillar && !t.destroyed && t.pillarTeam === "green" && t.health > 0)
                  t.upgraded = true;
          });
      }
    }
];

// ─────────────────────────────────────────────────────────
//  ARMAMENT ITEMS
// ─────────────────────────────────────────────────────────
const ARMAMENT_ITEMS = [
    { id:"arm_field_medic", label:"Field Medic", cost:15,
      desc:"Heal all followers 35% HP",
      apply() {
          followers.forEach(a => {
              if (!a.dead) a.health = Math.min(a.maxHealth, a.health + a.maxHealth * 0.35);
          });
      }
    },
    { id:"arm_recon_buff", label:"Recon Buff", cost:30,
      desc:"All followers +30% speed & +40% power this wave",
      apply() {
          followers.forEach(a => {
              if (!a.dead && !a.reconBuffed) {
                  a.reconBuffed = true;
                  a.moveSpeed = +(a.moveSpeed * 1.3).toFixed(4);
                  a.power = Math.round(a.power * 1.4);
              }
          });
      }
    },
    { id:"arm_power_boost", label:"Power Boost", cost:50, oneTimeGame:true, reqZones:2,
      desc:"Permanently +6 power to all followers & new recruits",
      apply() {
          followerPermPowerBonus += 6;
          followers.forEach(a => { if (!a.dead) a.power += 6; });
      }
    },
    { id:"arm_armor_plating", label:"Armor Plating", cost:40, oneTimeGame:true, reqZones:2,
      desc:"Permanently +15 max HP to all followers & recruits",
      apply() {
          followerPermHPBonus += 15;
          followers.forEach(a => { if (!a.dead) { a.maxHealth += 15; a.health = Math.min(a.health + 15, a.maxHealth); } });
      }
    },
    { id:"arm_elite_vanguard", label:"Elite Vanguard", cost:75, reqZones:3,
      desc:"Deploy 3 elite followers with 2× stats",
      apply() {
          const pool = [...unlockedElements];
          for (let i = 0; i < 3; i++) {
              const el = pool[Math.floor(Math.random() * pool.length)] || "fire";
              spawnEliteFollowerAtCrystal(el, 2.0, 2.0);
          }
      }
    },
    { id:"arm_strike_force", label:"Strike Force", cost:130, reqZones:4,
      desc:"Deploy 5 hardened fighters with 2.5× stats",
      apply() {
          const pool = [...unlockedElements];
          for (let i = 0; i < 5; i++) {
              const el = pool[Math.floor(Math.random() * pool.length)] || "fire";
              spawnEliteFollowerAtCrystal(el, 2.5, 2.5);
          }
      }
    },
    { id:"arm_apex_unit", label:"Apex Unit", cost:200, reqZones:5,
      desc:"Deploy 1 supreme commander with 4× stats",
      apply() {
          const pool = [...unlockedElements];
          const el = pool[Math.floor(Math.random() * pool.length)] || "fire";
          spawnEliteFollowerAtCrystal(el, 4.0, 4.0);
      }
    }
];
