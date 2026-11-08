// ─────────────────────────────────────────────────────────
//  THE MOVES — every signature attack an evolved follower can use, as a table (docs/PLAYER-CLASSES.md, stage 0)
// ─────────────────────────────────────────────────────────
// An evolved form used to have exactly one move, picked by an if/else chain on the form's id inside evolutionTick. Now the move is a ROW HERE and the tick looks it up, so
// that a form can have several moves, the player can choose between them, and a move can belong to one player class only (the plan's later stages). Nothing about play changes:
// each form's first (default) move is the one it always had, and until a follower is given another it uses that.
//   id        the key (saved with a follower as f.move once a choice exists)
//   name      what the form calls it (EVOLUTIONS[x].move, the floating text, MOVE_INFO in js/unitinfo.js)
//   windup    its WIND-UP, in seconds: the charge between two firings. Once it is full the move fires the moment an enemy is in reach. It is the attack's own stat, so a
//             form with two moves charges each at its own pace; change a number here and the move, its INFO and the bible all follow (the owner, 2026-11-07: "make it
//             another stat ... it needs to be adjustable ... it's on the attack not the follower"). The values were the moves' old waits, unchanged. PINBALL's counts from
//             the end of a roll.
//   fn        the function that fires it: fn(f) -> true when it fired (it sets f._sigCd itself, to moveWindupFrames(id))
//   classes   (optional) the player classes whose followers may use it; absent = everyone's
const MOVES = {
    petal_blaze:       { id: "petal_blaze",       name: "PETAL BLAZE",       windup: 6, fn: f => petalBlaze(f) },
    quill_burst:       { id: "quill_burst",       name: "QUILL BURST",       windup: 4, fn: f => quillBurst(f) },
    arc_volley:        { id: "arc_volley",        name: "ARC VOLLEY",        windup: 5, fn: f => arcVolley(f) },
    singularity_shot:  { id: "singularity_shot",  name: "SINGULARITY SHOT",  windup: 5.5, fn: f => singularityShot(f) },
    static_rush:       { id: "static_rush",       name: "SONIC ROLL",        windup: 5, fn: f => staticRush(f) },   // (it was STATIC RUSH: renamed by the owner, 2026-11-02; the id stays, a saved choice)
    hexfire:           { id: "hexfire",           name: "HEXFIRE",           windup: 5.5, fn: f => hexfire(f) },
    corrode_shot:      { id: "corrode_shot",      name: "CORRODE SHOT",      windup: 5.33, fn: f => corrodeShot(f) },
    gravity_slam:      { id: "gravity_slam",      name: "GRAVITY SLAM",      windup: 5.5, fn: f => gravitySlam(f) },
    // (AEGIS BURST and AEGIS BLOOM, the core forms' moves, went with the followers' shield: js/evolution.js "THE CORE FORMS HAVE NO MOVE NOW")
    eruption:          { id: "eruption",          name: "ERUPTION",          windup: 5.5, fn: f => eruption(f) },
    chomp:             { id: "chomp",             name: "CHOMP",             windup: 5, fn: f => chomp(f) },
    // A second move for the fire forms (js/firebombs.js): three bouncing bombs fanned at the nearest foe. Chosen on the unit's INFO tab; a fire form's own move stays its default.
    // THE FOLLOWER COMBAT REDESIGN (docs/FOLLOWER-COMBAT-REDESIGN.md): the Static Orb's second move, chosen on its INFO tab (SONIC ROLL stays its default), and the Thunderhead's move.
    pinball:           { id: "pinball",           name: "PINBALL",           windup: 5, fn: f => pinball(f) },
    static_vortex:     { id: "static_vortex",     name: "STATIC VORTEX",     windup: 5.5, fn: f => staticVortex(f) },
    // the Thermite Burrower's alternate (the owner, 2026-11-06: "Short and hot"; js/evolution.js magmaVent)
    magma_vent:        { id: "magma_vent",        name: "MAGMA VENT",        windup: 20, fn: f => magmaVent(f) },
    // the Rotshard's second move, picked on its INFO (the owner, 2026-11-07: "Short lure"; js/evolution.js rottenDecoy)
    rotten_decoy:      { id: "rotten_decoy",      name: "ROTTEN DECOY",      windup: 14, fn: f => rottenDecoy(f) },
    // the THORNWHIP's alternate (BLOOM's Mage, build 2026-11-08j; js/evolution.js seedfall): its wind-up is the agent's, provisional (HEXFIRE's and STATIC VORTEX's)
    seedfall:          { id: "seedfall",          name: "SEEDFALL",          windup: 5.5, fn: f => seedfall(f) },
    // BASH (build 2026-11-07ss; the owner: "Ram and knock back", then "BASH for now" as the second attack of the eight forms the design notes give none, and of every follower before it
    // evolves: js/evolution.js bash). `close`: a Mage locked on it closes in to use it (js/npc.js), as a Brawler does.
    bash:              { id: "bash",              name: "BASH",              windup: 4, close: true, fn: f => bash(f) },
    // STAKE RING (STONEPETAL's own, build 2026-11-08n: the owner picked it of four drafts, in place of BASH; js/evolution.js stakeRing): its wind-up the agent's, provisional (BASH's)
    stake_ring:        { id: "stake_ring",        name: "STAKE RING",        windup: 4, fn: f => stakeRing(f) },
    // SWEET SCENT (SUNDEW's own, build 2026-11-08n: the owner's design, in place of BASH; js/evolution.js sweetScent): a puff that lures the enemies near it, or, its stockpile full, a heal. Its wind-up the
    // agent's, provisional (the owner: "having the wind up that'll be fine")
    sweet_scent:       { id: "sweet_scent",       name: "SWEET SCENT",       windup: 5, fn: f => sweetScent(f) },
    // CAPACITOR DISCHARGE (build 2026-11-07ss; the design notes, docs/NEXT-PHASE-ROADMAP.md §12.3: the Static Orb's alternate, PINBALL superseded; js/evolution.js capacitorTick). `manual`: no
    // wind-up cycle: it stores charges, standing still, and the player releases them (its squad card's chip, its INFO). `windup` is the time one charge takes.
    capacitor_discharge: { id: "capacitor_discharge", name: "CAPACITOR DISCHARGE", windup: 1.5, manual: true, fn: f => capacitorRelease(f) },
};
// A move's wind-up in frames (60 a second). A row without one waits 5 s.
function moveWindupFrames(id) { const m = MOVES[id]; return Math.round((m && m.windup > 0 ? m.windup : 5) * 60); }
const MOVE_BY_NAME = {};
for (const id in MOVES) MOVE_BY_NAME[MOVES[id].name] = MOVES[id];

// The moves a form may use, first = its default. A form lists them as `moves: [ids]`; one that does not has the single move it is named for.
function evoMoveIds(d) {
    if (!d) return [];
    if (d.moves && d.moves.length) return d.moves.filter(id => MOVES[id]);
    const m = MOVE_BY_NAME[d.move]; return m ? [m.id] : [];
}
// Whether move `id` is open to this follower: on its form's list (class-only moves: when the player's class is on the move's list too, wired in a later stage).
function evoMoveAllowed(f, d, id) {
    const m = MOVES[id]; if (!m || evoMoveIds(d).indexOf(id) < 0) return false;
    if (m.classes && typeof playerClassId === "function" && m.classes.indexOf(playerClassId()) < 0) return false;
    return true;
}
// THE ALTERNATE ATTACK IS A CHOSEN MODE (the owner, 2026-11-07: "these alternate abilities, when chosen, are like control abilities, and they're locked into that ability or that attack until
// switched out of it and they can't use any of their other attacks [...] the wind up makes it balanced, and whenever the effect ends is when another wind up occurs, and when the wind up is occurring the
// [...] follower cannot move"; then "Yes, exactly" and "Stays on the alternate"). A follower fights with its NORMAL ATTACK (the default) or with ONE of its form's moves, chosen (`f.alt`: on its INFO, its
// squad card on the HUD, or the Command Center's setter). On a move it is LOCKED to it until switched back: no everyday hit, no shot, no card attack, an attack order included (js/combat.js followerAttack,
// js/npc.js). The cycle (js/evolution.js altTick): an enemy it can see within the move's reach → its WIND-UP (moveWindupFrames; it stands still, js/npc.js) → the move → its EFFECT (what the move left in the
// world) → when that is over, the next wind-up.
// BEFORE IT EVOLVES (build 2026-11-07ss; the owner: "inherit second attacks on all the followers"): a follower that has not evolved has a second attack too, BASH. Its moves, as a form's.
const UNEVOLVED_MOVES = { id: "unevolved", name: "IT", moves: ["bash"] };
// The moves a follower may use: its form's, or UNEVOLVED_MOVES before it evolves; null for a clone or anything not a follower
function followerMoveDef(f) {
    if (!f || f.isClone) return null;
    if (f.evolved) return typeof evolvedDef === "function" ? evolvedDef(f) : null;   // (an evolved form's, as before: anything with `evolved`)
    return f.isFollower === true ? UNEVOLVED_MOVES : null;
}
// The move it is locked to now: its chosen one if that is still open to it; null on its normal attack (and for a form with none).
function evoMoveOf(f, d) {
    d = d || followerMoveDef(f);
    if (!d || !f || !f.alt) return null;
    return evoMoveAllowed(f, d, f.alt) ? MOVES[f.alt] : null;
}
function followerAltLocked(f) { return !!(f && f.alt && evoMoveOf(f)); }
// locked on a move that needs it close (BASH): the reach it closes to, else 0 (js/npc.js: a Mage locked on one walks in, as a Brawler does)
function followerAltCloseReach(f) { const m = f && f.alt ? evoMoveOf(f) : null; return m && m.close ? moveReach(m.id) : 0; }
// Switch a follower's attack: a move id it may use, or null (its normal attack). True when it changed. A switch starts the move's cycle afresh (no wind-up carried over).
function followerAltSet(f, id) {
    if (!f) return false;
    const d = followerMoveDef(f);
    if (id && !(d && evoMoveAllowed(f, d, id))) return false;   // (a move that is not open to it changes nothing)
    const next = id || null;
    if ((f.alt || null) === next) return false;
    f.alt = next; f._altWind = 0; f._altLive = null; f._cap = 0; f._capT = 0;   // (a CAPACITOR DISCHARGE's stored charges go with a switch)
    return true;
}
// A move's reach (tiles): it winds up only with an enemy it can see this close, the reach the move itself looks in
const MOVE_REACH = { petal_blaze: () => BLOOM_RADIUS, quill_burst: () => QUILL_RANGE, arc_volley: () => REAVER_RANGE, singularity_shot: () => SERPENT_RANGE, static_rush: () => MANTA_RANGE, hexfire: () => HALO_RANGE,
    corrode_shot: () => ROT_RANGE, gravity_slam: () => MIMIC_RADIUS, eruption: () => CALDERA_RADIUS, chomp: () => MAW_RANGE, pinball: () => PIN_RANGE,
    static_vortex: () => VORTEX_RANGE, magma_vent: () => MAGMA_RANGE, rotten_decoy: () => ROT_RANGE, seedfall: () => SEEDFALL_RANGE, bash: () => BASH_RANGE, stake_ring: () => STAKE_RADIUS, sweet_scent: () => SCENT_RADIUS, capacitor_discharge: () => CAP_REACH };
function moveReach(id) { try { const r = MOVE_REACH[id] ? MOVE_REACH[id]() : 0; return r > 0 ? r : 5; } catch (e) { return 5; } }
