// ─────────────────────────────────────────────────────────
//  PREDATOR RANDOMIZER
//  Generates elite mutant variants for later zones that are
//  increasingly more powerful. Zone 3+ can spawn elites;
//  chance and mutation count scale with zone depth.
// ─────────────────────────────────────────────────────────

// Per-zone chance to spawn an elite (zones 0-2 stay clean)
const ELITE_ZONE_CHANCES = [0, 0, 0, 0.20, 0.38, 0.55];

// Max number of mutations an elite can receive per zone
const ELITE_MAX_MUTATIONS = [0, 0, 0, 1, 2, 3];

// ── Helpers ───────────────────────────────────────────────

// Blend two hex colors by factor t (0=base, 1=tint)
function _tintColor(baseHex, tintHex, t) {
    const p = h => [
        parseInt(h.slice(1,3),16),
        parseInt(h.slice(3,5),16),
        parseInt(h.slice(5,7),16)
    ];
    const [r1,g1,b1] = p(baseHex);
    const [r2,g2,b2] = p(tintHex);
    return '#' + [
        Math.round(r1 + (r2-r1)*t),
        Math.round(g1 + (g2-g1)*t),
        Math.round(b1 + (b2-b1)*t)
    ].map(v => v.toString(16).padStart(2,'0')).join('');
}

// ── Def mutations (applied to stat block BEFORE Predator()) ───────────────
// Each entry has: id, color (tint applied to species color), apply(def)

const _DEF_MUTATIONS = [
    {
        id: "armored",
        label: "Armored",
        color: "#999999",
        apply(def) {
            def.health   *= 1.65;
            def.moveSpeed *= 0.88;
        }
    },
    {
        id: "berserker",
        label: "Berserker",
        color: "#ff3300",
        apply(def) {
            def.power        *= 1.75;
            def.moveSpeed    *= 1.30;
            def.reactionSpeed = Math.max(2, (def.reactionSpeed ?? 10) - 6);
        }
    },
    {
        id: "venomous",
        label: "Venomous",
        color: "#33ff66",
        apply(def) {
            def.abdomenAttack   = true;
            def.rangeDamage     = Math.max(def.rangeDamage ?? 0, 22) * 1.55;
            def.abdomenCooldown = Math.min(def.abdomenCooldown ?? 90, 62);
        }
    },
    {
        id: "giant",
        label: "Giant",
        color: "#cc7700",
        apply(def) {
            def.width    *= 1.38;
            def.height   *= 1.38;
            def.health   *= 1.45;
            def.power    *= 1.22;
            def.moveSpeed *= 0.78;
        }
    },
    {
        id: "swift",
        label: "Swift",
        color: "#ffff00",
        apply(def) {
            def.moveSpeed    *= 1.50;
            def.reactionSpeed = Math.max(2, (def.reactionSpeed ?? 10) - 7);
        }
    },
    {
        id: "charged",
        label: "Charged",
        color: "#ff66ff",
        apply(def) {
            def.power       *= 1.42;
            def.rangeDamage  = (def.rangeDamage ?? 0) + 22;
            if (def.abdomenCooldown) def.abdomenCooldown = Math.max(40, def.abdomenCooldown * 0.80);
        }
    }
];

// ── Instance mutations (applied to Predator AFTER construction) ───────────
// Each entry has: id, color, apply(predator)

const _INST_MUTATIONS = [
    {
        id: "reflective",
        label: "Reflective",
        color: "#88ccff",
        apply(predator) {
            predator.armorPlated  = true;
            predator.reflectDamage = true;
        }
    },
    {
        id: "shielded",
        label: "Shielded",
        color: "#eeeeff",
        apply(predator) {
            predator.shieldAura       = true;
            predator.shieldAuraRadius = 4;
            predator.shieldAuraPulse  = 0;
            // Boost health on the live instance to match the pre-creation def boost
            predator.health    = Math.round(predator.health    * 1.38);
            predator.maxHealth = Math.round(predator.maxHealth * 1.38);
        }
    }
];

// ─────────────────────────────────────────────────────────
//  PUBLIC API
// ─────────────────────────────────────────────────────────

/**
 * Optionally mutate a predator stat-def before Predator instantiation.
 *
 * - Only activates for zone 3+ (earlier zones are not affected).
 * - Probability and mutation count scale with zone depth.
 * - Writes elite metadata onto def for use by applyEliteInstance().
 *
 * @param   {object} def        Stat def built in spawnPredatorForZone (mutated in-place)
 * @param   {number} zoneIndex  Zone being spawned into
 * @returns {string[]|null}     Array of instance-mutation ids to apply post-creation, or null
 */
function maybeApplyEliteDef(def, zoneIndex) {
    const chance = zoneIndex < ELITE_ZONE_CHANCES.length
        ? ELITE_ZONE_CHANCES[zoneIndex]
        : 0.68; // zones beyond defined range get 68% chance
    if (chance === 0 || Math.random() > chance) return null;

    // How many def-mutations to apply
    const maxMuts = zoneIndex < ELITE_MAX_MUTATIONS.length
        ? ELITE_MAX_MUTATIONS[zoneIndex]
        : 4;
    const count = 1 + Math.floor(Math.random() * maxMuts);

    // Draw without replacement from the def pool
    const defPool  = [..._DEF_MUTATIONS];
    const appliedDef = [];

    for (let i = 0; i < count && defPool.length > 0; i++) {
        const idx = Math.floor(Math.random() * defPool.length);
        const mut = defPool.splice(idx, 1)[0];
        mut.apply(def);
        appliedDef.push(mut);
        def.color = _tintColor(def.color, mut.color, 0.32);
    }

    // 40% chance to also roll one instance mutation
    const instPool = [..._INST_MUTATIONS];
    const appliedInst = [];
    if (Math.random() < 0.40) {
        const idx = Math.floor(Math.random() * instPool.length);
        const mut = instPool.splice(idx, 1)[0];
        appliedInst.push(mut.id);
        def.color = _tintColor(def.color, mut.color, 0.22);
    }

    // Stash metadata for applyEliteInstance
    const allIds = [...appliedDef.map(m => m.id), ...appliedInst];
    def._eliteMutationIds  = allIds;
    def._eliteDnaBonus     = allIds.length;
    def._eliteShardBonus   = allIds.length * 5;

    return appliedInst; // instance mutation ids to apply after Predator()
}

// ─────────────────────────────────────────────────────────
//  SYNTHETIC SPECIES — Deep Zone Constructs (zones 7–12+)
//
//  Each species was reverse-engineered from a base insect
//  by stacking fixed mutation loads. The cryptic ID encodes
//  the mod origin:
//    XV-09  →  eXo + Venom          (beetle carapace + stinger)
//    RS-a4  →  Rapid Strike α4      (mantis frame + swift/berserker)
//    HG-b2  →  HyperGiant β2        (spider chassis + giant/charged)
//    NX-w7  →  Necro eXo w7         (moth wings + berserker/venom)
//    AB-p3  →  Armor Berserk φ3     (scorpion shell + armored/berserker)
//    QX-z1  →  Quad eXo ζ1          (all six fused — full-stack chimera)
// ─────────────────────────────────────────────────────────
const SYNTHETIC_SPECIES = {
    "XV-09": {
        rank: 6,
        color: "#bb55aa",
        bodyStyle: "beetle",
        nymph:   { width:17, height:9,  moveSpeed:0.026, health:95,   power:30,  dnaDrops:3,  shardDrop:10,  reactionSpeed:14 },
        scout:   { width:28, height:13, moveSpeed:0.019, health:280,  power:68,  dnaDrops:4,  shardDrop:18,  reactionSpeed:5  },
        striker: { width:35, height:16, moveSpeed:0.015, health:420,  power:98,  dnaDrops:5,  shardDrop:26,  reactionSpeed:9,  abdomenAttack:true, rangeDamage:44, abdomenCooldown:72 },
        tank:    { width:46, height:21, moveSpeed:0.009, health:720,  power:130, dnaDrops:5,  shardDrop:36,  reactionSpeed:20, abdomenAttack:true, rangeDamage:70, abdomenCooldown:60 },
        boss:    { width:42, height:19, moveSpeed:0.006, health:2700, power:195, dnaDrops:11, shardDrop:85,  reactionSpeed:7,  abdomenAttack:true, rangeDamage:112,abdomenCooldown:46 }
    },
    "RS-a4": {
        rank: 7,
        color: "#44ddbb",
        bodyStyle: "mantis",
        nymph:   { width:15, height:8,  moveSpeed:0.038, health:105,  power:38,  dnaDrops:3,  shardDrop:12,  reactionSpeed:8  },
        scout:   { width:22, height:11, moveSpeed:0.030, health:380,  power:95,  dnaDrops:5,  shardDrop:22,  reactionSpeed:3  },
        striker: { width:28, height:14, moveSpeed:0.025, health:560,  power:140, dnaDrops:6,  shardDrop:32,  reactionSpeed:6,  abdomenAttack:true, rangeDamage:60, abdomenCooldown:65 },
        tank:    { width:38, height:18, moveSpeed:0.016, health:960,  power:180, dnaDrops:6,  shardDrop:44,  reactionSpeed:15, abdomenAttack:true, rangeDamage:90, abdomenCooldown:55 },
        boss:    { width:35, height:16, moveSpeed:0.010, health:3600, power:260, dnaDrops:13, shardDrop:105, reactionSpeed:5,  abdomenAttack:true, rangeDamage:145,abdomenCooldown:40 }
    },
    "HG-b2": {
        rank: 8,
        color: "#cc3366",
        bodyStyle: "spider",
        nymph:   { width:18, height:14, moveSpeed:0.022, health:130,  power:50,  dnaDrops:4,  shardDrop:14,  reactionSpeed:16 },
        scout:   { width:30, height:20, moveSpeed:0.016, health:520,  power:130, dnaDrops:6,  shardDrop:28,  reactionSpeed:6  },
        striker: { width:36, height:24, moveSpeed:0.013, health:780,  power:190, dnaDrops:7,  shardDrop:40,  reactionSpeed:11, abdomenAttack:true, rangeDamage:78, abdomenCooldown:60 },
        tank:    { width:47, height:30, moveSpeed:0.008, health:1320, power:248, dnaDrops:7,  shardDrop:55,  reactionSpeed:24, abdomenAttack:true, rangeDamage:118,abdomenCooldown:50 },
        boss:    { width:55, height:25, moveSpeed:0.005, health:5000, power:360, dnaDrops:15, shardDrop:135, reactionSpeed:8,  abdomenAttack:true, rangeDamage:190,abdomenCooldown:38 }
    },
    "NX-w7": {
        rank: 9,
        color: "#ff8833",
        bodyStyle: "moth",
        nymph:   { width:14, height:10, moveSpeed:0.040, health:150,  power:62,  dnaDrops:5,  shardDrop:16,  reactionSpeed:10 },
        scout:   { width:25, height:15, moveSpeed:0.030, health:710,  power:175, dnaDrops:7,  shardDrop:35,  reactionSpeed:4  },
        striker: { width:34, height:18, moveSpeed:0.024, health:1060, power:255, dnaDrops:8,  shardDrop:50,  reactionSpeed:7,  abdomenAttack:true, rangeDamage:105,abdomenCooldown:55 },
        tank:    { width:44, height:22, moveSpeed:0.015, health:1800, power:330, dnaDrops:8,  shardDrop:68,  reactionSpeed:18, abdomenAttack:true, rangeDamage:158,abdomenCooldown:45 },
        boss:    { width:52, height:26, moveSpeed:0.008, health:6800, power:480, dnaDrops:18, shardDrop:165, reactionSpeed:6,  abdomenAttack:true, rangeDamage:255,abdomenCooldown:32 }
    },
    "AB-p3": {
        rank: 10,
        color: "#9944ff",
        bodyStyle: "scorpion",
        nymph:   { width:20, height:11, moveSpeed:0.024, health:200,  power:80,  dnaDrops:6,  shardDrop:20,  reactionSpeed:12 },
        scout:   { width:34, height:15, moveSpeed:0.018, health:960,  power:238, dnaDrops:8,  shardDrop:44,  reactionSpeed:4  },
        striker: { width:42, height:18, moveSpeed:0.014, health:1440, power:346, dnaDrops:9,  shardDrop:62,  reactionSpeed:8,  abdomenAttack:true, rangeDamage:142,abdomenCooldown:48 },
        tank:    { width:55, height:24, moveSpeed:0.009, health:2440, power:450, dnaDrops:9,  shardDrop:84,  reactionSpeed:22, abdomenAttack:true, rangeDamage:214,abdomenCooldown:40 },
        boss:    { width:50, height:22, moveSpeed:0.005, health:9200, power:650, dnaDrops:22, shardDrop:200, reactionSpeed:6,  abdomenAttack:true, rangeDamage:345,abdomenCooldown:28 }
    },
    "QX-z1": {
        rank: 11,
        color: "#ff33bb",
        bodyStyle: "spider",
        nymph:   { width:22, height:16, moveSpeed:0.028, health:270,   power:108, dnaDrops:7,  shardDrop:25,  reactionSpeed:10 },
        scout:   { width:38, height:22, moveSpeed:0.020, health:1300,  power:320, dnaDrops:10, shardDrop:55,  reactionSpeed:4  },
        striker: { width:46, height:28, moveSpeed:0.016, health:1950,  power:468, dnaDrops:12, shardDrop:78,  reactionSpeed:7,  abdomenAttack:true, rangeDamage:192,abdomenCooldown:42 },
        tank:    { width:60, height:35, moveSpeed:0.010, health:3300,  power:610, dnaDrops:12, shardDrop:105, reactionSpeed:20, abdomenAttack:true, rangeDamage:290,abdomenCooldown:34 },
        boss:    { width:70, height:32, moveSpeed:0.004, health:12500, power:880, dnaDrops:28, shardDrop:250, reactionSpeed:5,  abdomenAttack:true, rangeDamage:465,abdomenCooldown:22 }
    }
};

// Zone 7→XV-09, 8→RS-a4, 9→HG-b2, 10→NX-w7, 11→AB-p3, 12+→QX-z1
const _SYNTHETIC_ORDER = ["XV-09","RS-a4","HG-b2","NX-w7","AB-p3","QX-z1"];

/**
 * Returns the synthetic species name for zones 7 and beyond.
 */
function getSyntheticZoneSpecies(zoneIndex) {
    const idx = Math.min(zoneIndex - 7, _SYNTHETIC_ORDER.length - 1);
    return _SYNTHETIC_ORDER[Math.max(0, idx)];
}

// ─────────────────────────────────────────────────────────

/**
 * Finalize elite status on the live Predator instance.
 * Call this AFTER applySpeciesBody().
 *
 * @param {Predator}  predator       The newly-created predator
 * @param {string[]}  instanceMutIds Ids returned by maybeApplyEliteDef
 * @param {object}    def            The (already mutated) stat def
 */
function applyEliteInstance(predator, instanceMutIds, def) {
    predator.isElite        = true;
    predator.eliteMutations = def._eliteMutationIds ?? [];
    predator.dnaDrops       = Math.min(12, (predator.dnaDrops  ?? 1) + (def._eliteDnaBonus  ?? 0));
    predator.shardDrop      = Math.min(100,(predator.shardDrop ?? 2) + (def._eliteShardBonus ?? 0));

    for (const id of instanceMutIds) {
        const mut = _INST_MUTATIONS.find(m => m.id === id);
        if (mut) mut.apply(predator);
    }
}
