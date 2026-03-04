// ─────────────────────────────────────────────────────────
//  PERSONALITIES
// ─────────────────────────────────────────────────────────
const PERSONALITIES = {
    aggressive: { attack:2.0, defense:0.5, speed:1.2, specialAttack:1.0, accuracy:0.8,  will:1.0, hp:1.0, resonance:1.0 },
    cautious:   { attack:0.8, defense:2.0, speed:0.7, specialAttack:0.8, accuracy:1.2,  will:1.2, hp:1.5, resonance:0.8 },
    cunning:    { attack:1.0, defense:0.8, speed:1.5, specialAttack:1.5, accuracy:1.5,  will:0.8, hp:0.8, resonance:1.2 },
    stoic:      { attack:1.0, defense:1.5, speed:0.8, specialAttack:0.8, accuracy:1.0,  will:1.5, hp:1.5, resonance:0.5 },
    wild:       { attack:1.8, defense:0.6, speed:1.8, specialAttack:0.6, accuracy:0.6,  will:0.6, hp:0.8, resonance:1.5 }
};

const PERSONALITY_KEYS = Object.keys(PERSONALITIES);

// Base stat block — all followers start from this
const BASE_STATS = {
    hp:            20,
    defense:       10,
    attack:        10,
    speed:         10,
    specialAttack: 10,
    accuracy:      10,
    will:          20,
    resonance:     0    // always starts at 0, builds in play
};

function applyPersonality(personalityKey) {
    const p = PERSONALITIES[personalityKey];
    if (!p) return { ...BASE_STATS };
    return {
        hp:            Math.round(BASE_STATS.hp            * p.hp),
        defense:       Math.round(BASE_STATS.defense       * p.defense),
        attack:        Math.round(BASE_STATS.attack        * p.attack),
        speed:         Math.round(BASE_STATS.speed         * p.speed),
        specialAttack: Math.round(BASE_STATS.specialAttack * p.specialAttack),
        accuracy:      Math.round(BASE_STATS.accuracy      * p.accuracy),
        will:          Math.round(BASE_STATS.will          * p.will),
        resonance:     0
    };
}

// Role is derived automatically from stat branch dominance
// Physical branch: hp + defense + attack + speed
// Magic branch:    specialAttack + accuracy + will
// Hybrid: high attack AND high will — uses both branches
function assignRole(stats) {
    // Hybrid: high in both attack AND specialAttack
    if (stats.attack >= 14 && stats.specialAttack >= 12) return "hybrid";
    // Brawler: attack-dominant — lax threshold
    if (stats.attack >= 14) return "brawler";
    // Sniper: accuracy or specialAttack dominant
    if (stats.specialAttack >= 12 || stats.accuracy >= 12) return "sniper";
    // Camper: defensive/will dominant
    if (stats.defense >= 14 || stats.will >= 24) return "camper";
    // Fallback — split between brawler and sniper randomly
    return Math.random() < 0.45 ? "brawler" : "sniper";
}

// ─────────────────────────────────────────────────────────
//  PREDATOR TYPES & POOLS
// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
//  SPECIES SYSTEM
//  Each species has 3 classes: scout, striker, tank
//  Species rank up as waves progress (front zone first)
// ─────────────────────────────────────────────────────────
const SPECIES = {
    ant: {
        rank: 1,
        color: "#aa55ff",
        nymph:   { width:14, height:7,  moveSpeed:0.030, health:30,  power:6,  dnaDrops:1, shardDrop:2  },
        scout:   { width:22, height:10, moveSpeed:0.022, health:60,  power:12, dnaDrops:1, shardDrop:3  },
        striker: { width:28, height:12, moveSpeed:0.018, health:100, power:18, dnaDrops:1, shardDrop:5  },
        tank:    { width:36, height:16, moveSpeed:0.012, health:180, power:25, dnaDrops:2, shardDrop:8  },
        boss:    { width:52, height:24, moveSpeed:0.008, health:500, power:40, dnaDrops:4, shardDrop:20 }
    },
    beetle: {
        rank: 2,
        color: "#cc44ff",
        nymph:   { width:16, height:8,  moveSpeed:0.028, health:45,  power:8,  dnaDrops:1, shardDrop:4  },
        scout:   { width:26, height:12, moveSpeed:0.020, health:100, power:18, dnaDrops:1, shardDrop:6  },
        striker: { width:32, height:14, moveSpeed:0.016, health:160, power:26, dnaDrops:2, shardDrop:9  },
        tank:    { width:42, height:18, moveSpeed:0.010, health:280, power:35, dnaDrops:2, shardDrop:14 },
        boss:    { width:62, height:28, moveSpeed:0.007, health:800, power:60, dnaDrops:5, shardDrop:30 }
    },
    scorpion: {
        rank: 3,
        color: "#8844ff",
        nymph:   { width:18, height:9,  moveSpeed:0.026, health:65,  power:12, dnaDrops:2, shardDrop:6  },
        scout:   { width:30, height:13, moveSpeed:0.019, health:150, power:25, dnaDrops:2, shardDrop:10 },
        striker: { width:36, height:15, moveSpeed:0.015, health:240, power:36, dnaDrops:3, shardDrop:15 },
        tank:    { width:48, height:20, moveSpeed:0.009, health:400, power:50, dnaDrops:3, shardDrop:22 },
        boss:    { width:70, height:32, moveSpeed:0.006, health:1200, power:80, dnaDrops:6, shardDrop:45 }
    },
    spider: {
        rank: 4,
        color: "#cc2244",
        nymph:   { width:20, height:10, moveSpeed:0.032, health:80,  power:15, dnaDrops:2, shardDrop:8  },
        scout:   { width:34, height:15, moveSpeed:0.024, health:200, power:32, dnaDrops:3, shardDrop:14 },
        striker: { width:40, height:18, moveSpeed:0.020, health:300, power:48, dnaDrops:3, shardDrop:20 },
        tank:    { width:52, height:22, moveSpeed:0.014, health:520, power:62, dnaDrops:4, shardDrop:28 },
        boss:    { width:80, height:36, moveSpeed:0.008, health:1800, power:100, dnaDrops:8, shardDrop:60 }
    }
};

// Legacy pools + types kept for Predator class compatibility
const PREDATOR_POOLS = {
    1: ["scout"],
    2: ["scout","striker"],
    3: ["scout","striker","tank"]
};
const PREDATOR_TYPES = {
    nymph:   { width:14, height:7,  moveSpeed:0.030, health:30,  power:6,  color:"#aa55ff" },
    scout:   { width:22, height:10, moveSpeed:0.022, health:60,  power:12, color:"#aa55ff" },
    striker: { width:28, height:12, moveSpeed:0.018, health:100, power:18, color:"#cc44ff" },
    tank:    { width:36, height:16, moveSpeed:0.012, health:180, power:25, color:"#8844ff" },
    boss:    { width:52, height:24, moveSpeed:0.008, health:500, power:40, color:"#8844ff" }
    // Spider uses SPECIES lookup directly — no legacy entry needed
};

// Get species for a given zone on a given night
function getZoneSpecies(zoneIndex, nightNumber) {
    const speciesOrder = ["ant","beetle","scorpion","spider"];
    const frontZone = activeDayZones - 1; // max index = 4

    let rank = 1;
    if (nightNumber > 5) {
        // Each night after 5 upgrades one more zone to beetle, front-first
        const upgradeNights = Math.min(nightNumber - 5, frontZone); // clamp so threshold never goes below 1
        const upgradeThreshold = Math.max(1, frontZone - upgradeNights + 1);
        if (zoneIndex >= upgradeThreshold) rank = 2;
    }
    if (nightNumber > 10) {
        const scorpionNights = Math.min(nightNumber - 10, frontZone);
        const scorpionThreshold = Math.max(1, frontZone - scorpionNights + 1);
        if (zoneIndex >= scorpionThreshold) rank = 3;
    }
    if (nightNumber > 15) {
        // Spider tier: front zone first, cascades back each night
        const spiderNights = Math.min(nightNumber - 15, frontZone);
        const spiderThreshold = Math.max(1, frontZone - spiderNights + 1);
        if (zoneIndex >= spiderThreshold) rank = 4;
    }

    // Clamp rank to valid index
    rank = Math.max(1, Math.min(rank, speciesOrder.length));
    const baseSpecies = speciesOrder[rank - 1];

    // 15% chance to spawn one tier lower (never below ant)
    if (rank > 1 && Math.random() < 0.15) {
        return speciesOrder[rank - 2];
    }
    return baseSpecies;
}

// Get class for a zone based on night (harder zones get strikers/tanks sooner)
function getZoneClass(zoneIndex) {
    const roll = Math.random();
    if (zoneIndex >= activeDayZones - 1) {
        // Front zone: full class range + rare boss
        if (roll < 0.08) return "boss";
        if (roll < 0.20) return "nymph";
        if (roll < 0.46) return "scout";
        if (roll < 0.73) return "striker";
        return "tank";
    }
    // Back zones: mostly scouts and nymphs
    if (roll < 0.15) return "nymph";
    if (roll < 0.55) return "scout";
    if (roll < 0.85) return "striker";
    return "tank";
}

// Clone cost table
const CLONE_COSTS = {
    ant:      { base:1, tankExtra:1, bossExtra:4, splicesNeeded:3  },
    beetle:   { base:2, tankExtra:1, bossExtra:5, splicesNeeded:5  },
    scorpion: { base:3, tankExtra:1, bossExtra:6, splicesNeeded:8  },
    spider:   { base:4, tankExtra:2, bossExtra:8, splicesNeeded:10 }
};
