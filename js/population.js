// ─────────────────────────────────────────────────────────
//  THE POPULATION: the races, the spawn tables and the Nest (2026-11-01; docs/FACILITY.md "Who lives where")
// ─────────────────────────────────────────────────────────
// ASKED (the phase brief "Stability, Nest Implementation, Ant Population & Sewer Expansion"): "The initial arena population should be entirely composed of the Ant race [...] The subsequent sewer spawn system should
// also initially be populated by the Ant race [...] Connect sewer infestation and spawning to the Nest and Queen Ant systems [...] Avoid hardcoding duplicate spawning logic for the arena and sewer. Where practical:
// reuse existing enemy spawn infrastructure; create or extend an Ant population configuration; keep spawn tables and encounter-specific rules separate; make future expansion to additional races possible without
// rewriting the system." And: "Only one queen in sewers for now" (the owner, 2026-11-01).
// A RACE (ENEMY_RACES) is a family of creatures: its species (js/species.js SPECIES, each with its classes from nymph to boss) and the Nest it comes from. A SPAWN TABLE (SPAWN_TABLES) is WHAT a place's spawner
// makes: the races it draws on, the classes by weight, the level band, an element, and whether they are a Nest's brood (a toxic ant of the Sewers drops samples and counts for Side Quest: js/quests.js). A table is a
// list of STAGES; the one in force is the first whose `until` (an event of SPAWN_WHEN) has not happened. The Sewers' brood has two (toxic until the purification, then plain ants: the owner's answer of 2026-11-01);
// the arena and the queen's call are in their first, "initially" ants, and a later one is a line of data here. THE SPAWNERS keep their own rules — when, how many, where, what is spared — and ask the table only what to make: the arena's (js/facilityspawn.js FP_SPAWN), the Sewers' brood (FP_SPAWN_SEWERS) and
// the queen's call (js/bosses.js, an encounter's `waves`). One more race is a row in ENEMY_RACES and its name in a table's `races`.
const ENEMY_RACES = {
    ant:      { label: "THE ANTS", species: ["ant"], nest: "sewer_nest" },   // the Toxic Ant Queen's colony: the Nest at the Sewers' east end (NESTS); the arena's ants come up from it through the overflow grates
    // the facility's other wild kinds: in the game (drawn, cloned, fought, js/species.js), on no spawn table now (the arena drew all six until 2026-11-01)
    beetle:   { label: "THE BEETLES", species: ["beetle"], nest: null },
    spider:   { label: "THE SPIDERS", species: ["spider"], nest: null },
    scorpion: { label: "THE SCORPIONS", species: ["scorpion"], nest: null },
    mantis:   { label: "THE MANTISES", species: ["mantis"], nest: null },
    moth:     { label: "THE MOTHS", species: ["moth"], nest: null },
    // THE ELECTRIC BREED (docs/ELECTRIC-BREED.md; the owner, 2026-11-13: "will inhabit the electric domain"): the electrical domain's, on its table only (js/facilityspawn.js FP_SPAWN_ELEC)
    rolypoly: { label: "THE ROLY-POLIES", species: ["rolypoly"], nest: null },
};
const SPAWN_TABLES = {
    arena:  [{ id: "ants", races: ["ant"], classes: { scout: 3, worker: 3, striker: 2, tank: 1 }, levels: [2, 4] }],   // THE ARENA: ants, in the classes and the level band the arena always had
    sewers: [{ id: "brood", until: "purified", races: ["ant"], classes: { worker: 3, scout: 3 }, levels: [3, 5], element: "toxic", brood: true },   // THE SEWERS' BROOD: the Nest's toxic workers and scouts, until the water is clean
             { id: "brood_clean", races: ["ant"], classes: { worker: 3, scout: 3 }, levels: [3, 5], element: null, brood: true }],   // then the same ants with no element: TOXIC ANTS BACK TO NORMAL (the owner, 2026-11-01: "lose the element")
    queen:  [{ id: "infantry", races: ["ant"], classes: { nymph: 1 }, levels: [2, 3], element: "toxic", brood: true }],   // THE QUEEN'S CALL: her toxic nymphs, the infantry of her waves (PROVISIONAL levels, js/bosses.js)
    electrical: [{ id: "rolypolies", races: ["rolypoly"], classes: { scout: 3, striker: 2, tank: 1 }, levels: [4, 6], element: "electric" }],   // THE ELECTRICAL DOMAIN: its roly-polies, always electric (PROVISIONAL classes and levels, the agent's: build 2026-11-13aa)
};
// the world's events a stage may wait for (`until`): the Sewers purified, the Toxic Ant Queen's fate decided
const SPAWN_WHEN = {
    purified: () => typeof questDone === "function" && questDone("purify"),
    queen:    () => { const S = typeof bossState === "function" ? bossState("sewer_cistern") : null; return !!(S && S.state === "resolved"); },
};
// the stage of a table in force now (null: no such table)
function spawnStage(id) {
    const T = SPAWN_TABLES[id]; if (!T || !T.length) return null;
    for (const s of T) if (!s.until || !(SPAWN_WHEN[s.until] && SPAWN_WHEN[s.until]())) return s;
    return T[T.length - 1];
}
// the species a stage draws on (its races', those the game has)
function spawnSpecies(stage) {
    const out = [];
    for (const r of (stage && stage.races) || []) for (const s of (ENEMY_RACES[r] && ENEMY_RACES[r].species) || []) if (!out.includes(s) && (typeof SPECIES === "undefined" || SPECIES[s])) out.push(s);
    return out;
}
// WHAT a spawner makes: its table's stage in force ({ species, classes, levels, element, brood, stage }); a spawner with no table says it itself (a test's, an old row's)
function spawnWhat(P) {
    const st = P && P.table ? spawnStage(P.table) : null;
    if (!st) return { species: (P && P.species) || [], classes: (P && P.classes) || {}, levels: (P && P.levels) || [1, 1], element: (P && P.element) || null, brood: !!(P && P.brood), stage: null };
    return { species: spawnSpecies(st), classes: st.classes, levels: st.levels, element: st.element || null, brood: !!st.brood, stage: st.id };
}
// the race a species belongs to (null: none)
function speciesRace(sp) { for (const k of Object.keys(ENEMY_RACES)) if (ENEMY_RACES[k].species.includes(sp)) return k; return null; }

// ── THE NEST (ASKED: "Implement the Nest as a dedicated world location that houses the Queen Ant [...] the central origin point for the initial Ant population [...] Connect Queen Ant progression to the Nest's
// infestation state [...] Avoid duplicating the existing Queen Ant implementation"; the owner: "Only one queen in sewers for now"). ONE Nest: the Toxic Ant Queen's colony at the Sewers' east end, its trash dam over
// the cistern's water (js/facilitymap.js, the zone `nest`). The queen is the boss encounter's, unchanged (js/bosses.js sewer_cistern); the Nest adds no second boss and no second state machine: its INFESTATION is
// read from her encounter and the purification (nestState), and the spawners and the drawing ask it.
//   INFESTED  the colony thriving: the brood comes and goes (FP_SPAWN_SEWERS at its full numbers), the egg clusters glow; the queen asleep at her post, or not yet woken (her gate shut)
//   STIRRED   her encounter under way (awake, rooted or frantic): she calls her infantry (waves), the brood still comes
//   CALMED    the purification done with her alive: the brood thins to a straggler now and then (FP_SPAWN_SEWERS.after), the eggs go dark; she keeps her lair, calm
//   CLEARED   she is dead, the water clean or not: as CALMED, with no queen in the Nest. (The owner, 2026-11-01, asked whether killing her before the water is clean should thin the brood: "Yes, thin out".
//             Until then a queen killed early left the Nest INFESTED.)
// After the purification the brood is no longer toxic: the ants alive then lose the element (facilityBroodCleanse, js/facilityspawn.js) and the ones that come later have none (SPAWN_TABLES.sewers' second stage).
// The archive's planned first-nest queen (js/bosses.js row `nest`, THE ANT QUEEN, the map's Nest Area south of the arena) stays a planned row: a later Nest is a row here and one there.
const NESTS = {
    sewer_nest: { id: "sewer_nest", label: "THE NEST", room: "sewers", zone: "nest", race: "ant", queen: "sewer_cistern", quest: "purify",
        note: "The Toxic Ant Queen's colony: the trash dam over the cistern at the Sewers' east end, with her lair and the console on it, egg clusters and resin on the junk, brood galleries in the walls" },
};
const NEST_STATES = ["infested", "stirred", "calmed", "cleared"];
function nestDef(id) { return NESTS[id || "sewer_nest"] || null; }
function nestState(id) {
    const N = nestDef(id); if (!N) return null;
    const S = typeof bossState === "function" ? bossState(N.queen) : null, purified = !!(N.quest && typeof questDone === "function" && questDone(N.quest));
    const dead = !!(S && (S.outcome === "defeated" || S.defeated));   // (killed after she was calmed: `defeated` is set, the outcome stays "calm")
    if (dead) return "cleared";   // her death thins the brood, the water clean or not (the owner, 2026-11-01)
    if (purified) return "calmed";
    return S && S.state === "active" ? "stirred" : "infested";
}
// is the Nest's brood at its full numbers? (INFESTED or STIRRED; CALMED and CLEARED are its stragglers)
function nestInfested(id) { const s = nestState(id); return s === "infested" || s === "stirred"; }
// the Nest a creature is of (its race's), for its card and INFO ("OF THE NEST"); null for none
function nestOf(a) { if (!a || a.team === "green" || a.isClone) return null; const r = ENEMY_RACES[speciesRace(a.speciesName)]; return r && r.nest ? nestDef(r.nest) : null; }
