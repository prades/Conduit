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
