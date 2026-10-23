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
//   - the nest area is one open room; the long lines round it are its outside edges (walls). Nothing outside every room is walkable;
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
        { id: "teleport_room_1", label: "Teleport Room 1", level: 0, status: "traced",
          note: "The sketch's faint 'TELE ROOM'. The teleport itself is a feature to be added later: the room is a placeholder for it.",
          polygon: [[245, 515], [370, 515], [370, 700], [245, 700]] },
        { id: "front_office", label: "Front Office (faint label)", level: 0, status: "approximate",
          note: "Labelled above the top edge with an arrow pointing in at the top-left: an entrance from outside is indicated but not drawn as an opening.",
          polygon: [[405, 322], [790, 322], [790, 470], [405, 470]] },
        { id: "upper_annex", label: "Unlabelled room beside the show room", level: 0, status: "unconfirmed", name_confirmed: false,
          polygon: [[795, 330], [875, 330], [875, 460], [795, 460]] },
        { id: "show_room", label: "Show Room", level: 0, status: "traced",
          polygon: [[880, 335], [1035, 335], [1035, 600], [880, 600]] },
        { id: "experiment_lab", label: "Experiment Lab", level: 0, status: "traced",
          polygon: [[400, 470], [875, 470], [875, 700], [375, 700], [370, 515], [400, 515]] },
        { id: "teleport_room_2", label: "Teleport Room 2", level: 0, status: "traced",
          note: "The sketch's labelled TELEPORT. The teleport itself is a feature to be added later: the room is a placeholder for it.",
          polygon: [[890, 600], [1035, 600], [1035, 730], [890, 730]] },
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
          boundary_type: "outer_edge", boundary_blocks_movement: true,
          note: "One completely open room. The long double lines in the sketch are its OUTSIDE EDGES (walls), not tunnels or a path. The sketch stops drawing at the bottom, so the bottom wall is provisional.",
          polygon: [[265, 1190], [1065, 1190], [1065, 1645], [265, 1645]],
          edge_kinds: ["outer_wall", "outer_wall", "outer_wall_provisional", "outer_wall"] },
    ],

    // Solid things standing in a room. Collision is on for all of them; the arena's two circular structures are giant reserves of ooze or liquid (solid tanks).
    props: [
        { id: "front_office_bench", room: "front_office", shape: "rect", rect: [475, 385, 735, 470], status: "approximate" },
        { id: "lab_bench", room: "experiment_lab", shape: "rect", rect: [380, 512, 745, 628], status: "approximate" },
        { id: "lab_tank", room: "experiment_lab", shape: "circle", at: [740, 570], radius: 30, status: "approximate" },
        { id: "arena_machine", room: "arena", shape: "rect", rect: [420, 790, 500, 1010], status: "unconfirmed",
          note: "A capsule-shaped machine on the arena's west side; not labelled." },
        { id: "arena_structure_01", room: "arena", shape: "circle", at: [810, 845], radius: 90, status: "traced", kind: "liquid_reserve", contents: "ooze_or_liquid (type to be decided)",
          note: "A giant reserve of ooze or liquid. Solid. Stairs are drawn on its west side." },
        { id: "arena_structure_02", room: "arena", shape: "circle", at: [850, 1010], radius: 88, status: "traced", kind: "liquid_reserve", contents: "ooze_or_liquid (type to be decided)",
          note: "A giant reserve of ooze or liquid. Solid. Stairs are drawn on its west side." },
    ],

    // (There is no separate outer path: the long lines round the nest area are that room's outside edges, drawn as its walls. Anything outside every room is not walkable.)
    outer_path: null,

    // CONFIRMED only. An opening is a gap cut into the walls along the segment a -> b; a connection says which two rooms it joins (and the ramp, if their levels differ).
    openings: [],
    connections: [],
    ramps: [],

    // What the sketch SUGGESTS and the user has not confirmed. None of these is a gap, a link or a ramp until it is moved above.
    candidates: {
        connections: [
            { id: "c_crystal_left", rooms: ["crystal_chamber", "teleport_room_1"], at: [300, 515], evidence: "a notch in the dividing wall" },
            { id: "c_crystal_office", rooms: ["crystal_chamber", "front_office"], at: [400, 400], evidence: "the stepped wall between them" },
            { id: "c_left_lab", rooms: ["teleport_room_1", "experiment_lab"], at: [370, 600], evidence: "a gap in the wall beside the lab's small bench" },
            { id: "c_office_lab", rooms: ["front_office", "experiment_lab"], at: [600, 470], evidence: "the gridded floor runs straight up to the office benches" },
            { id: "c_annex_office", rooms: ["upper_annex", "front_office"], at: [792, 400], evidence: "the annex's west wall is drawn broken" },
            { id: "c_annex_lab", rooms: ["upper_annex", "experiment_lab"], at: [835, 465], evidence: "the annex's door-like stalls open toward the lab" },
            { id: "c_show_lab", rooms: ["show_room", "experiment_lab"], at: [878, 540], evidence: "the show room's west wall meets the lab's grid" },
            { id: "c_lab_teleport", rooms: ["experiment_lab", "teleport_room_2"], at: [870, 650], evidence: "a curved stair drawn between them", ramp_candidate: "r_lab_teleport_stairs" },
            { id: "c_lab_arena", rooms: ["experiment_lab", "arena"], at: [460, 705], evidence: "the lab's grid spills into rubble at the arena's top-left" },
            { id: "c_teleport_catwalks", rooms: ["teleport_room_2", "catwalks"], at: [990, 745], evidence: "the catwalks begin right under the teleport room" },
            { id: "c_catwalks_arena", rooms: ["catwalks", "arena"], at: [945, 900], evidence: "railing posts along the catwalks' west side" },
            { id: "c_deck_arena", rooms: ["observation_deck", "arena"], at: [385, 800], evidence: "the deck wall is drawn with breaks" },
            { id: "c_deck_left", rooms: ["observation_deck", "teleport_room_1"], at: [355, 705], evidence: "a notch at the top of the deck" },
            { id: "c_arena_nest", rooms: ["arena", "nest_area"], at: [470, 1180], evidence: "an arrow points from 'FURTHER NESTS' down into the nest area; no opening is drawn" },
        ],
        ramps: [
            { id: "r_lab_teleport_stairs", at: [840, 650], between_levels: [0, 0], evidence: "curved stair between the lab and the teleport room (same level as far as the sketch shows)" },
            { id: "r_structure_01_stairs", at: [752, 885], between_levels: [0, 1], evidence: "stairs up the side of the upper liquid reserve (to its rim?)" },
            { id: "r_structure_02_stairs", at: [790, 1010], between_levels: [0, 1], evidence: "stairs up the side of the lower liquid reserve (to its rim?)" },
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
        "What the two liquid reserves contain (ooze or another liquid), whether the stairs lead onto their rims, and the arena's machine",
        "Whether the nest area has any entrance from the arena (the arrow points down into it), and whether its bottom edge is closed",
        "The teleport feature itself (to be added later): Teleport Room 1 and 2 are placeholders",
        "The names of the faint 'FRONT OFFICE' and the unlabelled rooms",
        "The CARRIER NPC drawn beside the map is a creature design, not map geometry: it is not part of this file",
    ],
};
