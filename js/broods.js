// ─────────────────────────────────────────────────────────
//  THE WAVE LADDER — what comes out, wave by wave
// ─────────────────────────────────────────────────────────
// REPORTED: "make it to where the nymphs spawn as the first things that you
// see. The first waves have nymphs, rare spawn of an ant. The second wave,
// less nymphs, and then it becomes the next tier of predator — the ant. And
// then it keeps going up in tiers, but it's a 10% chance for the next to
// spawn, and double the amount of creatures in that spawn. Remove the grub
// completely. Just make it like a progressing simulator."
//
// Asked: a SPECIES ladder, stepping up every TWO waves, the rare next tier
// arriving in PAIRS, and nymphs not counting toward a wave's kills.
//
//   WAVE_LADDER: nymph → ant → beetle → scorpion → mantis → moth → spider,
//   then the synthetic chimeras of the deep zones.
//
//   tier k = floor((wave − 1) / 2)
//     an ODD wave  (1, 3, 5 …): 90% tier k, and 10% tier k+1 — the new one,
//                               and it comes as a pair;
//     an EVEN wave (2, 4, 6 …): half tier k, half tier k+1.
//   So wave 1 is nymphs with the odd pair of ants, wave 2 is half nymphs and
//   half ants, wave 3 is ants with the odd pair of beetles, and so on.
//
// Every zone sends the wave's mix (it used to be one species per zone, and
// zone 3 a nymph swarm, and zone 4 a grub that became the Brood Tyrant — all
// gone). How tough each one is still grows with the zone's depth
// (applyZoneDifficulty in config.js). A "nymph" is the nymph class; its DNA is
// the ant's (drops.js), so the first waves feed the ant clones.
// ─────────────────────────────────────────────────────────

const WAVE_LADDER        = ["nymph", "ant", "beetle", "scorpion", "mantis", "moth", "spider"];
const LADDER_WAVES       = 2;      // waves per step up the ladder
const LADDER_RARE        = 0.10;   // chance a spawn is the new, next tier (odd waves)
const LADDER_RARE_PAIR   = 2;      // …and it comes as this many
const LADDER_MIXED_NEXT  = 0.5;    // an even wave: this share is the next tier

function ladderTier(wave) { return Math.floor((Math.max(1, wave || 1) - 1) / LADDER_WAVES); }
// The wave's mix: [{ tier, share, rare }], shares summing to 1.
function ladderMix(wave) {
    const k = ladderTier(wave), odd = (Math.max(1, wave || 1) - 1) % LADDER_WAVES === 0;
    return odd ? [{ tier: k, share: 1 - LADDER_RARE }, { tier: k + 1, share: LADDER_RARE, rare: true }]
               : [{ tier: k, share: 1 - LADDER_MIXED_NEXT }, { tier: k + 1, share: LADDER_MIXED_NEXT }];
}
// The species a tier is. Past the spider, the deep zones' chimeras.
function ladderSpecies(tier) {
    if (tier < WAVE_LADDER.length) return WAVE_LADDER[tier] === "nymph" ? "ant" : WAVE_LADDER[tier];
    if (typeof getSyntheticZoneSpecies === "function") return getSyntheticZoneSpecies(7 + (tier - WAVE_LADDER.length));
    return "spider";
}
// What share of the wave is nymphs (the quota counts only the rest).
function ladderNymphShare(wave) {
    let s = ladderMix(wave).reduce((a, m) => a + (WAVE_LADDER[m.tier] === "nymph" ? m.share : 0), 0);
    // SWARM TIDE (a siege night): most spawns come as nymphs regardless.
    if (typeof siegeIs === "function" && siegeIs("swarm") && typeof SIEGE_SWARM_NYMPH !== "undefined") s = s + (1 - s) * SIEGE_SWARM_NYMPH;
    return s;
}
// One spawn: { species, className, rare }.
function ladderPick(wave, zoneIndex) {
    const mix = ladderMix(wave);
    let roll = Math.random(), m = mix[mix.length - 1];
    for (const e of mix) { if (roll < e.share) { m = e; break; } roll -= e.share; }
    let species = ladderSpecies(m.tier), className;
    if (WAVE_LADDER[m.tier] === "nymph") className = "nymph";
    else {
        // Its class from the zone's usual roll — but never a nymph: the nymph
        // is its own tier now.
        className = typeof getZoneClass === "function" ? getZoneClass(zoneIndex) : "scout";
        if (className === "nymph") className = "scout";
    }
    // SWARM TIDE: most of what comes out tonight is nymphs.
    if (typeof siegeIs === "function" && siegeIs("swarm") && typeof SIEGE_SWARM_NYMPH !== "undefined" && Math.random() < SIEGE_SWARM_NYMPH) {
        species = "ant"; className = "nymph";
    }
    return { species, className, rare: !!m.rare && className !== "nymph" };
}
// The main species of the wave (never a nymph): what a thief is, and what a
// nest hatches from its stolen stock.
function ladderMainSpecies(wave) { return ladderSpecies(Math.max(1, ladderTier(wave))); }

// What a species does by nature (it used to be what its ZONE did):
//   ants are plain attackers — no special, no hauling, no hunting;
//   beetles are the haulers that feed their nest (infest.js).
function applyLadderRole(pred) {
    if (pred.speciesName === "ant" && pred.className !== "worker") {
        pred.abilityKey = null; pred.abilityDef = null;
        pred.huntsPylons = false; pred.plainAttacker = true;
    }
    if (pred.speciesName === "beetle") pred.hauler = true;
}

// The tier below a species — what a beetle's hauled mass hatches.
function lesserSpecies(sp) {
    const order = ["ant", "beetle", "scorpion", "mantis", "moth", "spider"];
    const i = order.indexOf(sp);
    return i > 0 ? order[i - 1] : "ant";
}

// The TYRANT HEART was the reward for killing the Brood Tyrant (every pylon
// link a tile longer). The tyrant is gone; a heart already earned is kept.
const TYRANT_HEART_RANGE = 1;
const TYRANT_HEART_KEY   = "conduit_tyrant_heart";
let tyrantHeart = false;
try { tyrantHeart = typeof localStorage !== "undefined" && localStorage.getItem(TYRANT_HEART_KEY) === "1"; } catch (e) {}
