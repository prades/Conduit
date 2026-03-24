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
//  CRYSTAL BUILD ITEMS  (activate by buying; one active at a time)
// ─────────────────────────────────────────────────────────
const CRYSTAL_BUILD_ITEMS = [
    // ── TIER I — Elemental Resonance Builds (60–75 shards) ──────────────
    { id:"ember_core",    label:"Ember Core",    cost:60, tier:"I",
      desc:"Fire followers +20% ATK. Crystal radiates heat: enemies within 2 tiles take 2 fire dmg/s",
      apply() { activeCrystalBuild="ember_core"; }
    },
    { id:"frost_lattice", label:"Frost Lattice", cost:65, tier:"I",
      desc:"Ice freeze proc chance ×2. Slowed enemies take +15% damage from all sources",
      apply() { activeCrystalBuild="frost_lattice"; }
    },
    { id:"voltage_surge", label:"Voltage Surge", cost:70, tier:"I",
      desc:"Chain Lightning hits 2 extra targets. Arc Flash stun proc rate +10%",
      apply() { activeCrystalBuild="voltage_surge"; }
    },
    { id:"toxic_bloom",   label:"Toxic Bloom",   cost:65, tier:"I",
      desc:"Toxic DoT damage ×1.5. Enemies killed under Toxic proc burst a poison cloud (2-tile radius)",
      apply() { activeCrystalBuild="toxic_bloom"; }
    },
    { id:"flux_resonance",label:"Flux Resonance",cost:70, tier:"I",
      desc:"Flux procs drain 10% of enemy max HP on hit. Resonance charge fills 25% faster",
      apply() { activeCrystalBuild="flux_resonance"; }
    },
    // ── TIER II — Tactical Field Builds (80–110 shards) ─────────────────
    { id:"shard_harvest", label:"Shard Harvest", cost:85, tier:"II",
      desc:"+1 shard per enemy kill. Pylon-assisted kills yield an extra shard on top",
      apply() { activeCrystalBuild="shard_harvest"; }
    },
    { id:"bastion_form",  label:"Bastion Form",  cost:90, tier:"II",
      desc:"Crystal +150 max HP immediately. Passive regen: crystal heals 3 HP every 10 sec",
      apply() { activeCrystalBuild="bastion_form"; crystal.maxHealth+=150; crystal.health=Math.min(crystal.health+150,crystal.maxHealth); }
    },
    { id:"warden_pact",   label:"Warden Pact",   cost:95, tier:"II",
      desc:"Followers never permanently die — always queue for respawn regardless of HP stat",
      apply() { activeCrystalBuild="warden_pact"; }
    },
    { id:"echo_shell",    label:"Echo Shell",    cost:100, tier:"II",
      desc:"Respawning followers return at 50% max HP instead of base 1. Resilient revival",
      apply() { activeCrystalBuild="echo_shell"; }
    },
    { id:"predator_mark", label:"Predator Mark", cost:110, tier:"II",
      desc:"All enemies in your zone are marked on entry: receive +20% damage from all sources",
      apply() { activeCrystalBuild="predator_mark"; }
    },
    // ── TIER III — Advanced Warfare Builds (120–155 shards) ─────────────
    { id:"spectral_veil", label:"Spectral Veil", cost:120, tier:"III",
      desc:"All followers: 15% dodge chance. A successful dodge grants +5 resonance charge",
      apply() { activeCrystalBuild="spectral_veil"; }
    },
    { id:"neural_web",    label:"Neural Web",    cost:130, tier:"III",
      desc:"20% of any HP heal received by a follower spreads to all nearby followers (3-tile radius)",
      apply() { activeCrystalBuild="neural_web"; }
    },
    { id:"siege_engine",  label:"Siege Engine",  cost:140, tier:"III",
      desc:"Pylon shots deal 0.5× bonus splash to adjacent tiles. Pylons gain +1 max range",
      apply() { activeCrystalBuild="siege_engine";
          world.forEach(t => { if (t.pillar && !t.destroyed && t.attackMode) t.attackRange=(t.attackRange||2.5)+1; });
      }
    },
    { id:"void_rift",     label:"Void Rift",     cost:130, tier:"III",
      desc:"Cleared zones emit a rift: all enemy kills in that zone yield +50% shard value",
      apply() { activeCrystalBuild="void_rift"; }
    },
    { id:"twin_souls",    label:"Twin Souls",    cost:150, tier:"III",
      desc:"Each follower spawned from the crystal also spawns a spectral clone at 60% stats",
      apply() { activeCrystalBuild="twin_souls"; }
    },
    // ── TIER IV — Apex Ascendancy Builds (160–220 shards) ───────────────
    { id:"bloodthorn",    label:"Bloodthorn",    cost:160, tier:"IV",
      desc:"Followers deal bonus damage equal to 8% of current HP per hit. Risk & reward",
      apply() { activeCrystalBuild="bloodthorn"; }
    },
    { id:"overcharge",    label:"Overcharge",    cost:175, tier:"IV",
      desc:"Pylons store up to 3 idle charges. Each stored charge adds +40% bonus to the next shot",
      apply() { activeCrystalBuild="overcharge"; }
    },
    { id:"crystal_mind",  label:"Crystal Mind",  cost:180, tier:"IV",
      desc:"Followers charge ultimates 2× faster. All ultimates deal +25% damage globally",
      apply() { activeCrystalBuild="crystal_mind"; }
    },
    { id:"nova_burst",    label:"Nova Burst",    cost:200, tier:"IV",
      desc:"Crystal unleashes a 25-dmg nova in 6-tile radius when struck for 20%+ max HP in one hit",
      apply() { activeCrystalBuild="nova_burst"; }
    },
    { id:"ghostphage_ii", label:"Ghostphage II", cost:220, tier:"IV",
      desc:"Upgraded Ghostphage: ghosts return as half-strength fighters, immune to ALL hazards and slow",
      apply() { activeCrystalBuild="ghostphage_ii"; }
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
