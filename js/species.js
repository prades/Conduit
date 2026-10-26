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

// THE FOLLOWER TYPES. What a follower IS (its role) comes from its personality's stat block (assignRole below): aggressive and wild are BRAWLERS, cautious and cunning are MAGES (the code's
// "sniper"), stoic is the TECHNICIAN (the code's "camper"). A follower has its type and its element when it is found (or recruited at the Crystal, js/clone.js: a draw), and keeps them: the player can neither
// choose nor change them, and makes a follower better by evolving it (js/evolution.js). The ids are the roles', which saves and tests know them by; the label is roleLabel (js/config.js).
const FOLLOWER_TYPES = {
    brawler: { id: "brawler", colour: "#ff6a3d", personalities: ["aggressive", "wild"] },
    sniper:  { id: "sniper",  colour: "#b46bff", personalities: ["cautious", "cunning"] },
    camper:  { id: "camper",  colour: "#19e6c1", personalities: ["stoic"] },
};
const FOLLOWER_TYPE_ORDER = ["brawler", "sniper", "camper"];
// A personality of the type (random among its few), or any personality when the type is none of the three.
function personalityForType(type) {
    const t = FOLLOWER_TYPES[type]; if (!t) return PERSONALITY_KEYS[Math.floor(Math.random() * PERSONALITY_KEYS.length)];
    return t.personalities[Math.floor(Math.random() * t.personalities.length)];
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
//  SPECIES SYSTEM
//  Each species has its classes: nymph, worker, scout, striker, tank, boss (the arena's spawner uses worker, scout, striker and tank: js/facilityspawn.js)
// ─────────────────────────────────────────────────────────
// reactionSpeed: frames before a hit predator retaliates (lower = faster)
// abdomenAttack: fires ranged shots from the rear; won't turn when hit from behind
// rangeDamage / abdomenCooldown: dry-shot stats (special shot scales up when charged)
const SPECIES = {
    ant: {
        rank: 1,
        color: "#aa55ff",
        nymph:   { width:14, height:7,  moveSpeed:0.030, health:30,  power:9,  dnaDrops:1, shardDrop:2,  reactionSpeed:15 },
        worker:  { width:20, height:9,  moveSpeed:0.024, health:45,  power:7,  dnaDrops:1, shardDrop:3,  reactionSpeed:25 },
        scout:   { width:22, height:10, moveSpeed:0.022, health:60,  power:18, dnaDrops:1, shardDrop:3,  reactionSpeed:5  },
        striker: { width:28, height:12, moveSpeed:0.018, health:100, power:27, dnaDrops:1, shardDrop:5,  reactionSpeed:10 },
        tank:    { width:36, height:16, moveSpeed:0.012, health:180, power:38, dnaDrops:2, shardDrop:8,  reactionSpeed:22 },
        boss:    { width:26, height:12, moveSpeed:0.008, health:500, power:60, dnaDrops:4, shardDrop:20, reactionSpeed:8  }
    },
    // THE BEETLE: three times an ant's health and about two thirds of its bite.
    beetle: {
        rank: 2,
        color: "#cc44ff",
        nymph:   { width:16, height:8,  moveSpeed:0.026, health:90,   power:6,  dnaDrops:1, shardDrop:4,  reactionSpeed:15 },
        worker:  { width:23, height:11, moveSpeed:0.020, health:135,  power:5,  dnaDrops:1, shardDrop:5,  reactionSpeed:25 },
        scout:   { width:26, height:12, moveSpeed:0.018, health:180,  power:13, dnaDrops:1, shardDrop:6,  reactionSpeed:5  },
        striker: { width:32, height:14, moveSpeed:0.015, health:300,  power:19, dnaDrops:2, shardDrop:9,  reactionSpeed:10 },
        tank:    { width:42, height:18, moveSpeed:0.010, health:540,  power:27, dnaDrops:2, shardDrop:14, reactionSpeed:22 },
        boss:    { width:31, height:14, moveSpeed:0.007, health:1500, power:42, dnaDrops:5, shardDrop:30, reactionSpeed:8  }
    },
    scorpion: {
        rank: 3,
        color: "#8844ff",
        nymph:   { width:18, height:9,  moveSpeed:0.026, health:65,  power:18, dnaDrops:2, shardDrop:6,  reactionSpeed:15 },
        worker:  { width:26, height:12, moveSpeed:0.021, health:105, power:13, dnaDrops:2, shardDrop:8,  reactionSpeed:25 },
        scout:   { width:30, height:13, moveSpeed:0.019, health:150, power:38, dnaDrops:2, shardDrop:10, reactionSpeed:5  },
        // striker/tank/boss: stinger tail — abdomen ranged attacker
        striker: { width:36, height:15, moveSpeed:0.015, health:240, power:54, dnaDrops:3, shardDrop:15, reactionSpeed:10, abdomenAttack:true, rangeDamage:30, abdomenCooldown:90 },
        tank:    { width:48, height:20, moveSpeed:0.009, health:400, power:75, dnaDrops:3, shardDrop:22, reactionSpeed:22, abdomenAttack:true, rangeDamage:53, abdomenCooldown:75 },
        boss:    { width:35, height:16, moveSpeed:0.006, health:1200, power:120, dnaDrops:6, shardDrop:45, reactionSpeed:8,  abdomenAttack:true, rangeDamage:83, abdomenCooldown:60 }
    },
    spider: {
        rank: 4,
        color: "#cc2244",
        nymph:   { width:13, height:10, moveSpeed:0.032, health:80,  power:23, dnaDrops:2, shardDrop:8,  reactionSpeed:15 },
        worker:  { width:20, height:13, moveSpeed:0.026, health:140, power:17, dnaDrops:2, shardDrop:11, reactionSpeed:25 },
        scout:   { width:22, height:15, moveSpeed:0.024, health:200, power:48, dnaDrops:3, shardDrop:14, reactionSpeed:5  },
        // striker/tank/boss: spinneret venom — abdomen ranged attacker
        striker: { width:26, height:18, moveSpeed:0.020, health:300, power:72, dnaDrops:3, shardDrop:20, reactionSpeed:10, abdomenAttack:true, rangeDamage:27, abdomenCooldown:85 },
        tank:    { width:34, height:22, moveSpeed:0.014, health:520, power:93, dnaDrops:4, shardDrop:28, reactionSpeed:22, abdomenAttack:true, rangeDamage:45, abdomenCooldown:75 },
        boss:    { width:40, height:18, moveSpeed:0.008, health:1800, power:150, dnaDrops:8, shardDrop:60, reactionSpeed:8,  abdomenAttack:true, rangeDamage:72, abdomenCooldown:65 }
    },
    // ── Mantis — raised prothorax, angled abdomen, raptorial forelegs ──────
    mantis: {
        rank: 4,
        color: "#44dd55",
        nymph:   { width:14, height:8,  moveSpeed:0.032, health:40,  power:12,  dnaDrops:1, shardDrop:4,  reactionSpeed:10 },
        worker:  { width:18, height:9,  moveSpeed:0.028, health:78,  power:12, dnaDrops:2, shardDrop:7,  reactionSpeed:25 },
        scout:   { width:20, height:10, moveSpeed:0.026, health:110, power:34,  dnaDrops:2, shardDrop:9,  reactionSpeed:4  },
        // striker+ use raptorial foreleg strike as ranged/abdomen attack
        striker: { width:26, height:12, moveSpeed:0.022, health:180, power:52,  dnaDrops:3, shardDrop:14, reactionSpeed:8,  abdomenAttack:true, rangeDamage:28, abdomenCooldown:80 },
        tank:    { width:34, height:15, moveSpeed:0.014, health:320, power:70,  dnaDrops:3, shardDrop:20, reactionSpeed:18, abdomenAttack:true, rangeDamage:48, abdomenCooldown:70 },
        boss:    { width:30, height:14, moveSpeed:0.009, health:1100, power:110, dnaDrops:6, shardDrop:40, reactionSpeed:7,  abdomenAttack:true, rangeDamage:80, abdomenCooldown:55 }
    },
    // ── Moth — vertical stance, compound rounded-triangular wings, wing-dust ranged ──
    moth: {
        rank: 5,
        color: "#dd8822",
        nymph:   { width:12, height:9,  moveSpeed:0.031, health:85,  power:25,  dnaDrops:2, shardDrop:8,  reactionSpeed:12 },
        worker:  { width:20, height:12, moveSpeed:0.025, health:154, power:19, dnaDrops:2, shardDrop:13, reactionSpeed:25 },
        scout:   { width:22, height:13, moveSpeed:0.023, health:220, power:55,  dnaDrops:3, shardDrop:16, reactionSpeed:5  },
        // striker+ fire wing-dust powder as ranged abdomen attack
        striker: { width:30, height:16, moveSpeed:0.018, health:340, power:80,  dnaDrops:4, shardDrop:22, reactionSpeed:9,  abdomenAttack:true, rangeDamage:32, abdomenCooldown:78 },
        tank:    { width:40, height:20, moveSpeed:0.011, health:560, power:102, dnaDrops:4, shardDrop:30, reactionSpeed:20, abdomenAttack:true, rangeDamage:55, abdomenCooldown:66 },
        boss:    { width:46, height:22, moveSpeed:0.007, health:2000, power:162, dnaDrops:9, shardDrop:65, reactionSpeed:7,  abdomenAttack:true, rangeDamage:92, abdomenCooldown:52 }
    }
};

// The classes' plain numbers, by class (js/predator.js reads a speed from them when a creature has no def of its own).
const PREDATOR_TYPES = {
    nymph:   { width:14, height:7,  moveSpeed:0.030, health:30,  power:9,  color:"#aa55ff", reactionSpeed:15 },
    scout:   { width:22, height:10, moveSpeed:0.022, health:60,  power:18, color:"#aa55ff", reactionSpeed:5  },
    striker: { width:28, height:12, moveSpeed:0.018, health:100, power:27, color:"#cc44ff", reactionSpeed:10 },
    tank:    { width:36, height:16, moveSpeed:0.012, health:180, power:38, color:"#8844ff", reactionSpeed:22 },
    boss:    { width:26, height:12, moveSpeed:0.008, health:500, power:60, color:"#8844ff", reactionSpeed:8  }
    // Spider uses SPECIES lookup directly — no legacy entry needed
};

// A species' class block; a species with no block for a class (every natural species has all six, but a table
// entry can be partial) gets one derived from its scout rather than letting speciesDef[className] come back undefined.
function getClassDef(speciesDef, className) {
    if (speciesDef && speciesDef[className]) return speciesDef[className];
    if (!speciesDef) return null;
    const s = speciesDef.scout || speciesDef.nymph;
    if (className !== 'worker' || !s) return s || null;
    return {
        width:  Math.max(8, Math.round(s.width  * 0.88)),
        height: Math.max(6, Math.round(s.height * 0.90)),
        moveSpeed: s.moveSpeed * 1.10,
        health: Math.max(10, Math.round(s.health * 0.70)),
        power:  Math.max(2,  Math.round(s.power  * 0.35)),
        dnaDrops:  Math.max(1, (s.dnaDrops || 1) - 1),
        shardDrop: Math.max(1, Math.round((s.shardDrop || 4) * 0.8)),
        reactionSpeed: 25,
        abdomenAttack: false, rangeDamage: 0,
    };
}

// ── Clone cost table ─────────────────────────────────────
// A clone costs SHARDS and DNA SPLICES. It used to cost splices and FOLLOWERS —
// up to five of them, killed outright at the Crystal — which made the whole
// mechanic something you avoided rather than used: trading your squad for one
// unit of a squad is not a trade anyone takes twice.
//
// The splices stay. They are what makes a clone specific to something you
// actually fought and killed, and no amount of shards substitutes for that.
//
// The shard price runs from 5 for the lowest grade to 25 for the highest, and
// cloneShardCost() CLAMPS to those two numbers, so the range is a guarantee
// rather than something that happens to fall out of the table.
const CLONE_SHARD_MIN = 5;
const CLONE_SHARD_MAX = 25;

// What the class adds on top of the species price. A scout is the baseline.
const CLONE_CLASS_SHARDS = { nymph: -2, scout: 0, striker: 2, tank: 5, boss: 10 };

const CLONE_COSTS = {
    ant:      { shards:5,  splicesNeeded:3  },
    beetle:   { shards:7,  splicesNeeded:5  },
    mantis:   { shards:9,  splicesNeeded:8  },
    scorpion: { shards:10, splicesNeeded:8  },
    spider:   { shards:12, splicesNeeded:10 },
    moth:     { shards:14, splicesNeeded:12 },
};

// The one place the price is decided. An unknown species costs the maximum
// rather than nothing, so a DNA key the table has never heard of cannot be
// cloned for free.
function cloneShardCost(speciesName, className) {
    const c = CLONE_COSTS[speciesName];
    if (!c) return CLONE_SHARD_MAX;
    const extra = CLONE_CLASS_SHARDS[className] || 0;
    return Math.max(CLONE_SHARD_MIN, Math.min(CLONE_SHARD_MAX, c.shards + extra));
}
