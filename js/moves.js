// ─────────────────────────────────────────────────────────
//  THE MOVES — every signature attack an evolved follower can use, as a table (docs/PLAYER-CLASSES.md, stage 0)
// ─────────────────────────────────────────────────────────
// An evolved form used to have exactly one move, picked by an if/else chain on the form's id inside evolutionTick. Now the move is a ROW HERE and the tick looks it up, so
// that a form can have several moves, the player can choose between them, and a move can belong to one player class only (the plan's later stages). Nothing about play changes:
// each form's first (default) move is the one it always had, and until a follower is given another it uses that.
//   id        the key (saved with a follower as f.move once a choice exists)
//   name      what the form calls it (EVOLUTIONS[x].move, the floating text, MOVE_INFO in js/unitinfo.js)
//   windup    its TIME, in seconds, between two firings. A Mage or a Technician WINDS UP for it, standing still, and fires when it is over; a Brawler fires the moment an enemy is
//             in reach and then COOLS DOWN for it, free to move (build 2026-11-10a; the owner, 2026-11-10: "make it to where the brawlers have a cooldown time and the mages have
//             wind-up time and not vice versa", Technicians "Wind-up"; altCools below). It is the attack's own stat, so a form with two moves times each at its own pace; change
//             a number here and the move, its INFO and the bible all follow (the owner, 2026-11-07: "make it another stat ... it needs to be adjustable ... it's on the attack
//             not the follower"). The values are the moves' old waits HALVED in build 2026-11-10a ("and also make it half as slow"). PINBALL's counts from the end of a roll.
//   fn        the function that fires it: fn(f) -> true when it fired (it sets f._sigCd itself, to moveWindupFrames(id))
//   classes   (optional) the player classes whose followers may use it; absent = everyone's
const MOVES = {
    petal_blaze:       { id: "petal_blaze",       name: "PETAL BLAZE",       windup: 3, fn: f => petalBlaze(f) },
    quill_burst:       { id: "quill_burst",       name: "QUILL BURST",       windup: 2, fn: f => quillBurst(f) },
    arc_volley:        { id: "arc_volley",        name: "ARC VOLLEY",        windup: 2.5, fn: f => arcVolley(f) },
    singularity_shot:  { id: "singularity_shot",  name: "SINGULARITY SHOT",  windup: 2.75, fn: f => singularityShot(f) },   // (the legacy Serpent's now: the Voidstar's second attack is MAELSTROM)
    maelstrom:         { id: "maelstrom",         name: "MAELSTROM",         windup: 2.75, fn: f => maelstrom(f) },   // (the Voidstar's, build 2026-11-12r: the owner's own brief, replacing SINGULARITY SHOT)
    static_rush:       { id: "static_rush",       name: "SONIC ROLL",        windup: 2.5, fn: f => staticRush(f) },   // (it was STATIC RUSH: renamed by the owner, 2026-11-02; the id stays, a saved choice)
    hexfire:           { id: "hexfire",           name: "HEXFIRE",           windup: 2.75, fn: f => hexfire(f) },
    corrode_shot:      { id: "corrode_shot",      name: "CORRODE SHOT",      windup: 2.67, fn: f => corrodeShot(f) },
    gravity_slam:      { id: "gravity_slam",      name: "GRAVITY SLAM",      windup: 2.75, fn: f => gravitySlam(f) },
    // (AEGIS BURST and AEGIS BLOOM, the core forms' moves, went with the followers' shield: js/evolution.js "THE CORE FORMS HAVE NO MOVE NOW")
    eruption:          { id: "eruption",          name: "ERUPTION",          windup: 2.75, fn: f => eruption(f) },
    chomp:             { id: "chomp",             name: "CHOMP",             windup: 2.5, fn: f => chomp(f) },
    // A second move for the fire forms (js/firebombs.js): three bouncing bombs fanned at the nearest foe. Chosen on the unit's INFO tab; a fire form's own move stays its default.
    // THE FOLLOWER COMBAT REDESIGN (docs/FOLLOWER-COMBAT-REDESIGN.md): the Static Orb's second move, chosen on its INFO tab (SONIC ROLL stays its default), and the Thunderhead's move.
    pinball:           { id: "pinball",           name: "PINBALL",           windup: 2.5, fn: f => pinball(f) },
    static_vortex:     { id: "static_vortex",     name: "STATIC VORTEX",     windup: 2.75, fn: f => staticVortex(f) },
    // the Thermite Burrower's alternate (the owner, 2026-11-06: "Short and hot"; js/evolution.js magmaVent)
    magma_vent:        { id: "magma_vent",        name: "MAGMA VENT",        windup: 10, fn: f => magmaVent(f) },
    // the Rotshard's second move, picked on its INFO (the owner, 2026-11-07: "Short lure"; js/evolution.js rottenDecoy)
    rotten_decoy:      { id: "rotten_decoy",      name: "ROTTEN DECOY",      windup: 2.75, fn: f => rottenDecoy(f) },   // (2.75 s since build 2026-11-14c, the other Mages' time: the owner, 2026-11-14, "The rotten decoy cast time is too long"; it was 7 s)
    // the THORNWHIP's alternate (BLOOM's Mage, build 2026-11-08j; js/evolution.js seedfall): its wind-up is the agent's, provisional (HEXFIRE's and STATIC VORTEX's)
    seedfall:          { id: "seedfall",          name: "SEEDFALL",          windup: 2.75, fn: f => seedfall(f) },
    // BASH (build 2026-11-07ss; the owner: "Ram and knock back", then "BASH for now" as the second attack of the eight forms the design notes give none, and of every follower before it
    // evolves: js/evolution.js bash). `close`: a Mage locked on it closes in to use it (js/npc.js), as a Brawler does.
    bash:              { id: "bash",              name: "BASH",              windup: 2, close: true, fn: f => bash(f) },
    // STAKE RING (STONEPETAL's own, build 2026-11-08n: the owner picked it of four drafts, in place of BASH; js/evolution.js stakeRing): its wind-up the agent's, provisional (BASH's)
    stake_ring:        { id: "stake_ring",        name: "STAKE RING",        windup: 2, fn: f => stakeRing(f) },
    // SWEET SCENT (SUNDEW's own, build 2026-11-08n: the owner's design, in place of BASH; js/evolution.js sweetScent): a puff that lures the enemies near it, or, its stockpile full, a heal. Its wind-up the
    // agent's, provisional (the owner: "having the wind up that'll be fine")
    // `full` (build 2026-11-11s): ON A METER on BOTH (below): its turn comes when full(f) (SUNDEW's stockpile, filled by its stings), not on the timer
    sweet_scent:       { id: "sweet_scent",       name: "SWEET SCENT",       windup: 2.5, full: f => (f._nectar || 0) >= 100, fn: f => sweetScent(f) },
    // THE NINE SECOND ATTACKS (build 2026-11-09c; the owner picked each of the agent's drafts, one form at a time, in place of BASH: js/evolution.js "THE NINE SECOND ATTACKS"). Their wind-ups the agent's,
    // provisional (BASH's 4 s for the quick ones, more for the bigger ones). `close`: a Mage or a Technician locked on it walks in to use it, as on BASH.
    zigzag_dash:       { id: "zigzag_dash",       name: "ZIGZAG DASH",       windup: 2, fn: f => zigzagDash(f) },     // the Electro Skink's
    wobble_slam:       { id: "wobble_slam",       name: "WOBBLE SLAM",       windup: 2, close: true, fn: f => wobbleSlam(f) },   // the Jelly Ram's
    icicle_volley:     { id: "icicle_volley",     name: "ICICLE VOLLEY",     windup: 2.5, fn: f => icicleVolley(f) },   // the Rimestar's
    echo_pulse:        { id: "echo_pulse",        name: "ECHO PULSE",        windup: 2.5, fn: f => echoPulse(f) },      // the Hornshell's
    shell_guard:       { id: "shell_guard",       name: "SHELL GUARD",       windup: 3, fn: f => shellGuard(f) },     // the Hammer Slug's
    phase_swap:        { id: "phase_swap",        name: "PHASE SWAP",        windup: 2.5, fn: f => phaseSwap(f) },      // the Goo Proxy's
    venom_bite:        { id: "venom_bite",        name: "VENOM BITE",        windup: 2.5, close: true, fn: f => venomBite(f) },    // the Blight Spider's
    shock_zap:         { id: "shock_zap",         name: "SHOCK ZAP",         windup: 2, fn: f => shockZap(f) },       // the Hover Shell's
    skate_charge:      { id: "skate_charge",      name: "SKATE CHARGE",      windup: 2.25, fn: f => skateCharge(f) },  // the Igloo Skater's
    // THE FOUR EXTRA ATTACKS (build 2026-11-13v: js/evolution.js; each its form's SECOND move, open with two energy cards of its element, js/energy.js alt2Needs)
    ember_slash:       { id: "ember_slash",       name: "EMBER SLASH",       windup: 2, fn: f => emberSlash(f) },    // the Quillstone's (fire, Slashing)
    rift_impale:       { id: "rift_impale",       name: "RIFT IMPALE",       windup: 2.5, fn: f => riftImpale(f) },     // the Rift Mimic's (flux, Piercing)
    blade_roll:        { id: "blade_roll",        name: "BLADE ROLL",        windup: 2.5, fn: f => bladeRoll(f) },      // the Hammer Slug's (core, Slashing)
    briar_sweep:       { id: "briar_sweep",       name: "BRIAR SWEEP",       windup: 2.5, close: true, fn: f => briarSweep(f) },     // the Thornwhip's (bloom, Slashing); a close move since build 2026-11-13x (the owner: "Thornwhip should walk towards the enemies when it has that new attack on")
    toxic_stomp:       { id: "toxic_stomp",       name: "TOXIC STOMP",       windup: 2, close: true, fn: f => toxicStomp(f) },    // the Seeper's (toxic, Crushing; build 2026-11-13w)
    // CAPACITOR DISCHARGE (build 2026-11-07ss; the design notes, docs/NEXT-PHASE-ROADMAP.md §12.3: the Static Orb's alternate, PINBALL superseded; js/evolution.js capacitorTick). `manual`: no
    // wind-up cycle: it stores charges, standing still, and the player releases them (its squad card's chip, its INFO). `windup` is the time one charge takes.
    capacitor_discharge: { id: "capacitor_discharge", name: "CAPACITOR DISCHARGE", windup: 0.75, manual: true, fn: f => capacitorRelease(f) },
};
// A move's time in frames (60 a second): a Mage's or a Technician's wind-up, a Brawler's cooldown. A row without one takes 2.5 s.
function moveWindupFrames(id) { const m = MOVES[id]; return Math.round((m && m.windup > 0 ? m.windup : 2.5) * 60); }
// Whether its second attack COOLS DOWN after it fires (a Brawler) rather than winding up before it (a Mage, `sniper`, or a Technician, `camper`): build 2026-11-10a (js/evolution.js altTick)
function altCools(f) { return !!f && f.role !== "sniper" && f.role !== "camper"; }
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
    if (f && f.evolved && typeof energyAltOpen === "function" && !energyAltOpen(f)) return false;   // ENERGY CARDS (js/energy.js): an evolved follower's second attack is locked until it holds an energy card of its element
    if (f && f.evolved && evoMoveIds(d).indexOf(id) > 0 && typeof energyAlt2Open === "function" && !energyAlt2Open(f)) return false;   // (its form's EXTRA attack, a move after its first: two cards of its element, build 2026-11-13u)
    if (m.classes && typeof playerClassId === "function" && m.classes.indexOf(playerClassId()) < 0) return false;
    return true;
}
// THE ALTERNATE ATTACK IS A CHOSEN MODE (the owner, 2026-11-07: "these alternate abilities, when chosen, are like control abilities, and they're locked into that ability or that attack until
// switched out of it and they can't use any of their other attacks [...] the wind up makes it balanced, and whenever the effect ends is when another wind up occurs, and when the wind up is occurring the
// [...] follower cannot move"; then "Yes, exactly" and "Stays on the alternate"). A follower fights with its NORMAL ATTACK (the default) or with ONE of its form's moves, chosen (`f.alt`: on its INFO, its
// squad card on the HUD, or the Command Center's setter). On a move it is LOCKED to it until switched back: no everyday hit, no shot, no card attack, an attack order included (js/combat.js followerAttack,
// js/npc.js). The cycle (js/evolution.js altTick): an enemy it can see within the move's reach → its WIND-UP (moveWindupFrames; it stands still, js/npc.js) → the move → its EFFECT (what the move left in the
// world) → when that is over, the next wind-up. A BRAWLER's is the other way round since build 2026-11-10a (altCools): an enemy in reach → the move at once → its EFFECT → its COOLDOWN (moveWindupFrames, free to
// move) → ready again.
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
// A saved choice of BASH on a form whose own second attack has replaced it since (build 2026-11-09c: the nine forms of "THE NINE SECOND ATTACKS"): the form's own, so a follower the player had locked on its
// second attack stays on its second attack (js/facilitysave.js asks on load). Anything else is kept as it was.
function moveAltCarried(f, alt) { const d = followerMoveDef(f); if (alt === "singularity_shot" && d && evoMoveIds(d).indexOf(alt) < 0 && evoMoveIds(d).indexOf("maelstrom") >= 0) return "maelstrom";   // (a Voidstar locked on SINGULARITY SHOT before build 2026-11-12r: on its MAELSTROM, which replaced it)
    return alt === "bash" && d && !evoMoveAllowed(f, d, "bash") && evoMoveIds(d).length ? evoMoveIds(d)[0] : alt; }
// BOTH (build 2026-11-11s; the owner: "We'll just make it to where you can select both of the moves and it will switch automatically"; asked first for a "switching" play style that "will
// switch back on a repeated timer"; then "if a follower has an attack or a meter that fills up for a different charged attack or different special attack move, then it will have it permanently
// selected until that condition is no longer met"). f.altBoth with f.alt: it fights with BOTH its normal attack and that move, switching on its own (js/evolution.js altTick, _altBothTurn):
//   ON A TIMER (every move but the two below): its everyday hits for BOTH_REST_SECONDS, then the move's TURN: locked on it while it winds up, fires and its effect lasts (with no enemy in the
//     move's reach yet it keeps hitting as usual, its turn still waiting; a move that needs it close, BASH, takes its turn once it has an enemy to fight, and it walks in to use it), then its
//     everyday hits again. A Brawler's rest lasts at least its cooldown.
//   ON A METER (the agent's reading of the owner's words, for the owner to confirm): a row with `full` (SWEET SCENT: SUNDEW's stings fill its stockpile): its everyday hits until full, then the
//     move until it has used it (the heal; on BOTH it does not puff). CAPACITOR DISCHARGE (`manual`, the Static Orb: it charges standing still): charging until it holds CAP_MAX, then its
//     everyday hits while it holds them, and charging again once you release them.
// The turn is a fight's, not saved; f.altBoth is saved with the follower.
const BOTH_REST_SECONDS = 5;   // the agent's, PROVISIONAL: its everyday hits between two turns of its move
function followerAltBoth(f) { return !!(f && f.altBoth && f.alt && evoMoveOf(f)); }
// the move it fights with THIS moment: its chosen one; on BOTH, the move only on its turn (else null: its normal attack)
function followerAltNow(f, d) { const m = evoMoveOf(f, d); return m && f.altBoth && !f._altTurn ? null : m; }
function followerAltLocked(f) { return !!(f && f.alt && followerAltNow(f)); }
// locked on a move that needs it close (BASH): the reach it closes to, else 0 (js/npc.js: a Mage locked on one walks in, as a Brawler does)
function followerAltCloseReach(f) { const m = f && f.alt ? followerAltNow(f) : null; return m && m.close ? moveReach(m.id) : 0; }
// Switch a follower's attack: a move id it may use, or null (its normal attack); `both`: that move AND its normal attack, switching on their own (BOTH, above). True when it changed. A switch starts
// the move's cycle afresh (no wind-up carried over); a Brawler's cooldown is kept (f._altReadyAt), so switching away and back does not skip it.
// The choice as the screens give it and show it (the Command Center, its squad card, its INFO): null (its normal attack), a move id (locked on it), or "both:" + a move id (BOTH).
function followerAltChoice(f) { const m = f ? evoMoveOf(f) : null; return m ? (f.altBoth ? "both:" : "") + m.id : null; }
function followerAltChoose(f, choice) { const both = typeof choice === "string" && choice.indexOf("both:") === 0; return followerAltSet(f, both ? choice.slice(5) : choice, both); }
// what BOTH does with move `id`, in the screens' short words
function moveBothText(id) {
    const m = MOVES[id]; if (!m) return "";
    if (m.full) return "ITS HITS FILL IT, FULL IT USES " + m.name;
    if (m.manual) return "CHARGES TO FULL, THEN ITS EVERYDAY HITS";
    return "EVERYDAY HITS " + BOTH_REST_SECONDS + " S, THEN " + m.name;
}
function followerAltSet(f, id, both) {
    if (!f) return false;
    const d = followerMoveDef(f);
    if (id && !(d && evoMoveAllowed(f, d, id))) return false;   // (a move that is not open to it changes nothing)
    const next = id || null, nb = !!(both && next);
    if ((f.alt || null) === next && !!f.altBoth === nb) return false;
    f.alt = next; f.altBoth = nb; f._altWind = 0; f._altLive = null; f._cap = 0; f._capT = 0;   // (a CAPACITOR DISCHARGE's stored charges go with a switch)
    f._altTurn = false; f._altRest = nb; f._altBackAt = (typeof frame !== "undefined" ? frame : 0) + Math.round(BOTH_REST_SECONDS * 60);   // (on BOTH it starts with its everyday hits)
    return true;
}
// A move's reach (tiles): it winds up only with an enemy it can see this close, the reach the move itself looks in
const MOVE_REACH = { petal_blaze: () => BLOOM_RADIUS, quill_burst: () => QUILL_RANGE, arc_volley: () => REAVER_RANGE, singularity_shot: () => SERPENT_RANGE, maelstrom: () => MAEL_RANGE, static_rush: () => MANTA_RANGE, hexfire: () => HALO_RANGE,
    corrode_shot: () => ROT_RANGE, gravity_slam: () => MIMIC_RADIUS, eruption: () => CALDERA_RADIUS, chomp: () => MAW_RANGE, pinball: () => PIN_RANGE,
    static_vortex: () => VORTEX_RANGE, magma_vent: () => MAGMA_RANGE, rotten_decoy: () => ROT_RANGE, seedfall: () => SEEDFALL_RANGE, bash: () => BASH_RANGE, stake_ring: () => STAKE_RADIUS, zigzag_dash: () => ZIG_RANGE, wobble_slam: () => WOBBLE_RADIUS, icicle_volley: () => ICICLE_RANGE, echo_pulse: () => ECHO_RADIUS,
    shell_guard: () => GUARD_LURE, phase_swap: () => SWAP_RANGE, venom_bite: () => VENOM_RANGE, shock_zap: () => ZAP_RANGE, skate_charge: () => SKATE_RANGE, sweet_scent: () => SCENT_RADIUS, capacitor_discharge: () => CAP_REACH,
    ember_slash: () => EMBER_RANGE, rift_impale: () => RIFT_RANGE, blade_roll: () => ROLL_RANGE, briar_sweep: () => BRIAR_RADIUS, toxic_stomp: () => STOMP_RADIUS };
function moveReach(id) { try { const r = MOVE_REACH[id] ? MOVE_REACH[id]() : 0; return r > 0 ? r : 5; } catch (e) { return 5; } }
