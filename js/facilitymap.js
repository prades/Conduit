// ─────────────────────────────────────────────────────────
//  THE PERMANENT FACILITY — authored map DATA (no logic: js/facility.js reads it)
// ─────────────────────────────────────────────────────────
// Source of truth: the hand-drawn top-down floor plan (the clipboard photo) and conduit_facility_map_spec.json. Edit THIS file to change the facility; nothing in
// the game code names a room or a coordinate.
//
// UNITS. Every coordinate here is in SKETCH PIXELS: the photo's pixels, origin top-left, x right, y down (the photo is 1500 x 2000). `scale.px_per_tile` turns them
// into world tiles, so calibrating the facility against the game is ONE number. The sketch's grid is a visual guide only and does not define it.
//
// RULES (from the spec):
//   - a room's outline is an explicit polygon; every edge of it is a wall unless a CONFIRMED opening is cut into it;
//   - `openings` and `connections` hold ONLY what is confirmed (both are empty: nothing has been confirmed yet). Everything the sketch merely suggests is in
//     `candidates` with the evidence, and does nothing until it is moved into `openings` + `connections` by hand;
//   - `outer_path` is a boundary only: not walkable, never part of navigation;
//   - the arena's perimeter is solid wall / rock and blocks movement;
//   - nothing here is a ramp or a shortcut unless it is in `ramps` (also empty).
// `status` says how sure the tracing is: "traced" (read straight off the sketch), "approximate" (drawn loosely), "unconfirmed" (a guess about what it is).
const FACILITY_MAP = {
    id: "conduit_facility_01",
    scale: { px_per_tile: 20 },
    // Elevation: separate metadata from the outlines. Heights are unknown (the sketch is flat), so only the ORDER is recorded.
    levels: [
        { id: 0, label: "ground" },
        { id: 1, label: "raised", height_status: "unknown: needs a value in tiles" },
    ],

    rooms: [
        { id: "crystal_chamber", label: "Crystal Chamber", level: 0, status: "traced",
          polygon: [[245, 322], [400, 322], [400, 515], [245, 515]],
          objects: [{ id: "crystal", type: "objective", at: [315, 395], radius: 40, status: "traced" }] },
        { id: "left_side_room", label: "Tele Room (faint label)", level: 0, status: "unconfirmed", name_confirmed: false,
          note: "The sketch has a faint 'TELE ROOM' here with a figure-in-a-frame icon; the spec puts the TELEPORT by the catwalks (see teleport_room). Which is the teleport is unconfirmed.",
          polygon: [[245, 515], [370, 515], [370, 700], [245, 700]],
          objects: [{ id: "pod_icon", type: "unknown", at: [300, 640], status: "unconfirmed" }] },
        { id: "front_office", label: "Front Office (faint label)", level: 0, status: "approximate",
          note: "Labelled above the top edge with an arrow pointing in at the top-left: an entrance from outside is indicated but not drawn as an opening.",
          polygon: [[405, 322], [790, 322], [790, 470], [405, 470]] },
        { id: "upper_annex", label: "Unlabelled room beside the show room", level: 0, status: "unconfirmed", name_confirmed: false,
          polygon: [[795, 330], [875, 330], [875, 460], [795, 460]] },
        { id: "show_room", label: "Show Room", level: 0, status: "traced",
          polygon: [[880, 335], [1035, 335], [1035, 600], [880, 600]] },
        { id: "experiment_lab", label: "Experiment Lab", level: 0, status: "traced",
          polygon: [[400, 470], [875, 470], [875, 700], [375, 700], [370, 515], [400, 515]] },
        { id: "teleport_room", label: "Teleport", level: 0, status: "traced",
          polygon: [[890, 600], [1035, 600], [1035, 730], [890, 730]],
          objects: [{ id: "teleport", type: "teleport_point", at: [972, 685], size: 24, status: "traced" }] },
        { id: "observation_deck", label: "Observation Deck", level: 1, status: "traced",
          note: "Raised by the look of it (steps drawn along its west side). Height unknown.",
          polygon: [[240, 710], [385, 710], [385, 1105], [240, 1105]] },
        { id: "catwalks", label: "Catwalks", level: 1, status: "traced",
          note: "Raised walkway with railing posts along its west side. Height unknown.",
          polygon: [[950, 750], [1045, 750], [1045, 1150], [950, 1150]] },
        { id: "arena", label: "Arena", level: 0, status: "traced",
          boundary_type: "solid_walls_or_rock_formations", boundary_blocks_movement: true,
          // The floor outline, clockwise from the top-left. Every edge is solid; `edge_kinds[i]` is the edge from point i to point i+1.
          polygon: [[385, 712], [530, 705], [545, 745], [600, 765], [690, 745], [715, 718], [765, 748], [880, 735], [945, 750],
                    [945, 1120], [780, 1095], [640, 1075], [560, 1078], [520, 1120], [440, 1155], [405, 1130], [385, 1105]],
          edge_kinds: ["rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "railing_wall",
                       "rock", "rock", "rock", "rock", "rock", "rock", "rock", "deck_wall"] },
        { id: "nest_area", label: "Nest area", level: 0, status: "approximate",
          note: "The space inside the U-shaped outer path. Its bottom edge is open in the sketch (the legs just stop); whether it is closed, and any entrance from the arena, is unconfirmed.",
          polygon: [[345, 1275], [1010, 1275], [1010, 1640], [345, 1640]] },
    ],

    // Solid things standing in a room. Collision is on for all of them, but the circular structures are PROVISIONAL (their real role is unresolved).
    props: [
        { id: "front_office_bench", room: "front_office", shape: "rect", rect: [475, 385, 735, 470], status: "approximate" },
        { id: "lab_bench", room: "experiment_lab", shape: "rect", rect: [380, 512, 745, 628], status: "approximate" },
        { id: "lab_tank", room: "experiment_lab", shape: "circle", at: [740, 570], radius: 30, status: "approximate" },
        { id: "arena_machine", room: "arena", shape: "rect", rect: [420, 790, 500, 1010], status: "unconfirmed",
          note: "A capsule-shaped machine on the arena's west side; not labelled." },
        { id: "arena_structure_01", room: "arena", shape: "circle", at: [810, 845], radius: 90, status: "unconfirmed", provisional_collision: true,
          note: "The upper circular structure; stairs drawn on its west side. Role unresolved." },
        { id: "arena_structure_02", room: "arena", shape: "circle", at: [850, 1010], radius: 88, status: "unconfirmed", provisional_collision: true,
          note: "The lower circular structure; stairs drawn on its west side. Role unresolved." },
    ],

    // THE OUTER PATH: the long band round the nest area. Boundary only. Rendered, solid to movement, and in NO navigation link.
    outer_path: {
        id: "outer_path", label: "Outer path (boundary only)", walkable: false, navigation_link: false, status: "traced",
        polygon: [[265, 1190], [1065, 1190], [1065, 1645], [1015, 1645], [1015, 1270], [340, 1270], [340, 1645], [265, 1645]],
    },

    // CONFIRMED only. An opening is a gap cut into the walls along the segment a -> b; a connection says which two rooms it joins (and the ramp, if their levels differ).
    openings: [],
    connections: [],
    ramps: [],

    // What the sketch SUGGESTS and the user has not confirmed. None of these is a gap, a link or a ramp until it is moved above.
    candidates: {
        connections: [
            { id: "c_crystal_left", rooms: ["crystal_chamber", "left_side_room"], at: [300, 515], evidence: "a notch in the dividing wall" },
            { id: "c_crystal_office", rooms: ["crystal_chamber", "front_office"], at: [400, 400], evidence: "the stepped wall between them" },
            { id: "c_left_lab", rooms: ["left_side_room", "experiment_lab"], at: [370, 600], evidence: "a gap in the wall beside the lab's small bench" },
            { id: "c_office_lab", rooms: ["front_office", "experiment_lab"], at: [600, 470], evidence: "the gridded floor runs straight up to the office benches" },
            { id: "c_annex_office", rooms: ["upper_annex", "front_office"], at: [792, 400], evidence: "the annex's west wall is drawn broken" },
            { id: "c_annex_lab", rooms: ["upper_annex", "experiment_lab"], at: [835, 465], evidence: "the annex's door-like stalls open toward the lab" },
            { id: "c_show_lab", rooms: ["show_room", "experiment_lab"], at: [878, 540], evidence: "the show room's west wall meets the lab's grid" },
            { id: "c_lab_teleport", rooms: ["experiment_lab", "teleport_room"], at: [870, 650], evidence: "a curved stair drawn between them", ramp_candidate: "r_lab_teleport_stairs" },
            { id: "c_lab_arena", rooms: ["experiment_lab", "arena"], at: [460, 705], evidence: "the lab's grid spills into rubble at the arena's top-left" },
            { id: "c_teleport_catwalks", rooms: ["teleport_room", "catwalks"], at: [990, 745], evidence: "the catwalks begin right under the teleport room" },
            { id: "c_catwalks_arena", rooms: ["catwalks", "arena"], at: [945, 900], evidence: "railing posts along the catwalks' west side" },
            { id: "c_deck_arena", rooms: ["observation_deck", "arena"], at: [385, 800], evidence: "the deck wall is drawn with breaks" },
            { id: "c_deck_left", rooms: ["observation_deck", "left_side_room"], at: [355, 705], evidence: "a notch at the top of the deck" },
            { id: "c_arena_nest", rooms: ["arena", "nest_area"], at: [470, 1180], evidence: "an arrow points from 'FURTHER NESTS' down into the nest area; no opening is drawn" },
        ],
        ramps: [
            { id: "r_lab_teleport_stairs", at: [840, 650], between_levels: [0, 0], evidence: "curved stair between the lab and the teleport room (same level as far as the sketch shows)" },
            { id: "r_structure_01_stairs", at: [752, 885], between_levels: [0, 1], evidence: "stairs on the upper circular structure's west side" },
            { id: "r_structure_02_stairs", at: [790, 1010], between_levels: [0, 1], evidence: "stairs on the lower circular structure's west side" },
            { id: "r_deck_steps", at: [262, 900], between_levels: [0, 1], evidence: "hatched steps along the observation deck's west edge" },
        ],
    },

    // Where the sketch points off the map. Neither is a connection.
    external_exits: [
        { id: "further_dungeons", at: [1045, 915], room: "catwalks", status: "indicated_by_arrow", walkable: false, note: "an arrow leaves the catwalks to the east" },
        { id: "blocked_path", at: [1045, 1000], room: "catwalks", status: "traced", blocked: true, note: "labelled BLOCKED PATH" },
        { id: "front_entrance", at: [360, 310], room: "front_office", status: "indicated_by_arrow", walkable: false, note: "an arrow points in at the top-left" },
        { id: "further_nests", at: [470, 1320], room: "nest_area", status: "indicated_by_arrow", walkable: false, note: "an arrow points down into the nest area" },
    ],

    unresolved: [
        "The scale: px_per_tile is a first guess, to be calibrated in the game",
        "Every doorway / opening: none is confirmed, so every room is currently sealed (see candidates.connections)",
        "Elevation heights (only the ORDER ground < raised is known) and every ramp or stair",
        "The role of the two circular arena structures and the arena's machine (their collision is provisional)",
        "Whether the nest area has any entrance from the arena, and whether its bottom edge is closed",
        "Which room holds the teleport: the faint 'TELE ROOM' on the left or the labelled TELEPORT beside the catwalks",
        "The names of the faint 'FRONT OFFICE' and the unlabelled rooms",
        "The CARRIER NPC drawn beside the map is a creature design, not map geometry: it is not part of this file",
    ],
};
