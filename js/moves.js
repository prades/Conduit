// ─────────────────────────────────────────────────────────
//  THE MOVES — every signature attack an evolved follower can use, as a table (docs/PLAYER-CLASSES.md, stage 0)
// ─────────────────────────────────────────────────────────
// An evolved form used to have exactly one move, picked by an if/else chain on the form's id inside evolutionTick. Now the move is a ROW HERE and the tick looks it up, so
// that a form can have several moves, the player can choose between them, and a move can belong to one player class only (the plan's later stages). Nothing about play changes:
// each form's first (default) move is the one it always had, and until a follower is given another it uses that.
//   id        the key (saved with a follower as f.move once a choice exists)
//   name      what the form calls it (EVOLUTIONS[x].move, the floating text, MOVE_INFO in js/unitinfo.js)
//   fn        the function that fires it: fn(f) -> true when it fired (it sets f._sigCd itself)
//   classes   (optional) the player classes whose followers may use it; absent = everyone's
const MOVES = {
    petal_blaze:       { id: "petal_blaze",       name: "PETAL BLAZE",       fn: f => petalBlaze(f) },
    quill_burst:       { id: "quill_burst",       name: "QUILL BURST",       fn: f => petalBlaze(f) },
    arc_volley:        { id: "arc_volley",        name: "ARC VOLLEY",        fn: f => arcVolley(f) },
    singularity_shot:  { id: "singularity_shot",  name: "SINGULARITY SHOT",  fn: f => singularityShot(f) },
    aegis_burst:       { id: "aegis_burst",       name: "AEGIS BURST",       fn: f => aegisBurst(f) },
    static_rush:       { id: "static_rush",       name: "STATIC RUSH",       fn: f => staticRush(f) },
    hexfire:           { id: "hexfire",           name: "HEXFIRE",           fn: f => hexfire(f) },
    corrode_shot:      { id: "corrode_shot",      name: "CORRODE SHOT",      fn: f => corrodeShot(f) },
    gravity_slam:      { id: "gravity_slam",      name: "GRAVITY SLAM",      fn: f => gravitySlam(f) },
    aegis_bloom:       { id: "aegis_bloom",       name: "AEGIS BLOOM",       fn: f => aegisBloom(f) },
    eruption:          { id: "eruption",          name: "ERUPTION",          fn: f => eruption(f) },
    chomp:             { id: "chomp",             name: "CHOMP",             fn: f => chomp(f) },
    // A second move for the fire forms (js/firebombs.js): three bouncing bombs fanned at the nearest foe. Chosen on the unit's INFO tab; a fire form's own move stays its default.
    bomb_lob:          { id: "bomb_lob",          name: "FIRE BOMBS",        fn: f => fireBombBarrage(f) },
    // The worker forms' moves are job bonuses (js/mass.js asks), not attacks: listed so every form's move has a row, with nothing to fire.
    rewire:            { id: "rewire",            name: "REWIRE",            fn: null },
    rapid_discharge:   { id: "rapid_discharge",   name: "RAPID DISCHARGE",   fn: null },
    heavy_haul:        { id: "heavy_haul",        name: "HEAVY HAUL",        fn: null },
};
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
// The move this follower fires now: the one it was given if that is still allowed, else its form's default. null for a form with none.
function evoMoveOf(f, d) {
    d = d || (typeof evolvedDef === "function" ? evolvedDef(f) : null);
    if (!d) return null;
    if (f && f.move && evoMoveAllowed(f, d, f.move)) return MOVES[f.move];
    const ids = evoMoveIds(d).filter(id => evoMoveAllowed(f, d, id));
    return ids.length ? MOVES[ids[0]] : null;
}
