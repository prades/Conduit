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
//   - `openings` and `connections` hold ONLY what is confirmed (so far the stair room's two openings and the Crystal Chamber's door to the hallway). Everything the sketch merely suggests is in
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
          note: "The gridded floor: the lab itself and the HALLWAY that passes by it (not split into two rooms yet).",
          polygon: [[400, 470], [875, 470], [875, 600], [815, 600], [815, 700], [375, 700], [370, 515], [400, 515]] },
        { id: "teleport_stair_room", label: "Teleport Stair Room", level: 1, status: "approximate", name_confirmed: false,
          note: "The room that leads to Teleport Room 2: a curved staircase in it leads DOWN to the hallway past the experiment lab. Footprint and name are first guesses.",
          polygon: [[815, 600], [890, 600], [890, 700], [815, 700]] },
        { id: "teleport_room_2", label: "Teleport Room 2", level: 1, status: "traced",
          note: "The sketch's labelled TELEPORT. Raised: reached from the stair room, whose staircase leads down to the hallway. The teleport itself is a feature to be added later: the room is a placeholder for it.",
          polygon: [[890, 600], [1035, 600], [1035, 730], [890, 730]] },
        { id: "observation_deck", label: "Observation Deck", level: 1, status: "traced",
          note: "Raised by the look of it (steps drawn along its west side). Height unknown.",
          polygon: [[240, 710], [385, 710], [385, 1105], [240, 1105]] },
        { id: "catwalks", label: "Catwalks", level: 1, status: "traced", development: "blocked_off_for_now",
          note: "The zone to the right of the arena. It is BLOCKED OFF for now (not being developed): the player can walk up to it, not into it. Raised walkway with railing posts along its west side. Height unknown.",
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
        { id: "lab_bench", room: "experiment_lab", shape: "rect", rect: [430, 530, 735, 615], status: "approximate",
          note: "Pulled in from the walls (it was drawn almost touching the lab's west wall) so the hallway runs all the way round it: about 2.7 tiles on the north and west, 4 on the south." },
        { id: "lab_tank", room: "experiment_lab", shape: "circle", at: [740, 570], radius: 30, status: "approximate" },
        { id: "arena_truck", room: "arena", shape: "rect", rect: [420, 790, 500, 1010], status: "traced", kind: "semi_truck", cargo: [{ type: "missile", count: 3 }],
          note: "A semi-truck carrying three missiles, parked along the arena's west side. Solid." },
        { id: "arena_structure_01", room: "arena", shape: "circle", at: [790, 845], radius: 45, status: "traced", kind: "liquid_reserve", contents: "ooze_or_liquid (type to be decided)",
          note: "A giant reserve of ooze or liquid. Solid, but sized to leave walkways round it (about 3 tiles between the two, 5 to the right-hand wall): the player walks between them toward the zone on the right. Stairs are drawn on its west side." },
        { id: "arena_structure_02", room: "arena", shape: "circle", at: [800, 1000], radius: 45, status: "traced", kind: "liquid_reserve", contents: "ooze_or_liquid (type to be decided)",
          note: "A giant reserve of ooze or liquid. Solid, with walkways round it. Stairs are drawn on its west side." },
    ],

    // (There is no separate outer path: the long lines round the nest area are that room's outside edges, drawn as its walls. Anything outside every room is not walkable.)
    outer_path: null,

    // EVERY DOOR in the facility is a sliding access door. A confirmed opening below is one (its `door` defaults to this).
    door_type: "sliding_access_door",

    // CONFIRMED only. An opening is a gap cut into the walls along the segment a -> b; a connection says which two rooms it joins (and the ramp, if their levels differ).
    // The stair room: confirmed by the user. The positions on the walls are APPROXIMATE (centred on the shared wall) until checked in the debug view.
    openings: [
        { id: "door_crystal_hallway", a: [400, 476], b: [400, 508], rooms: ["crystal_chamber", "experiment_lab"], position_status: "approximate",
          note: "A sliding access door from the Crystal Chamber onto the hallway that passes the experiment lab (on the shared wall, near its middle)." },
        { id: "open_stair_mouth", a: [815, 610], b: [815, 690], rooms: ["teleport_stair_room", "experiment_lab"], door: null, position_status: "approximate",
          note: "The open foot of the curved staircase, onto the hallway. No door." },
        { id: "door_stair_teleport_2", a: [890, 625], b: [890, 665], rooms: ["teleport_stair_room", "teleport_room_2"], position_status: "approximate",
          note: "A sliding access door between the stair room and Teleport Room 2." },
    ],
    connections: [
        { id: "conn_crystal_hallway", rooms: ["crystal_chamber", "experiment_lab"], opening: "door_crystal_hallway" },
        { id: "conn_stair_hallway", rooms: ["teleport_stair_room", "experiment_lab"], opening: "open_stair_mouth", ramp: "r_teleport_stairs" },
        { id: "conn_stair_teleport_2", rooms: ["teleport_stair_room", "teleport_room_2"], opening: "door_stair_teleport_2" },
    ],
    ramps: [
        { id: "r_teleport_stairs", rooms: ["teleport_stair_room", "experiment_lab"], shape: "curved", centre: [890, 650], r_inner: 20, r_outer: 50, from_deg: 90, to_deg: 270,
          between_levels: [1, 0], descends_toward: "experiment_lab", position_status: "approximate",
          note: "A rounded (curved) staircase leading DOWN from the stair room to the hallway that passes the experiment lab." },
    ],

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
            { id: "c_lab_arena", rooms: ["experiment_lab", "arena"], at: [460, 705], evidence: "the lab's grid spills into rubble at the arena's top-left" },
            { id: "c_teleport_catwalks", rooms: ["teleport_room_2", "catwalks"], at: [990, 745], evidence: "the catwalks begin right under the teleport room" },
            { id: "c_catwalks_arena", rooms: ["catwalks", "arena"], at: [945, 900], evidence: "railing posts along the catwalks' west side" },
            { id: "c_deck_arena", rooms: ["observation_deck", "arena"], at: [385, 800], evidence: "the deck wall is drawn with breaks" },
            { id: "c_deck_left", rooms: ["observation_deck", "teleport_room_1"], at: [355, 705], evidence: "a notch at the top of the deck" },
            { id: "c_arena_nest", rooms: ["arena", "nest_area"], at: [470, 1180], evidence: "an arrow points from 'FURTHER NESTS' down into the nest area; no opening is drawn" },
        ],
        ramps: [
            { id: "r_structure_01_stairs", at: [745, 845], between_levels: [0, 1], evidence: "stairs up the side of the upper liquid reserve (to its rim?)" },
            { id: "r_structure_02_stairs", at: [755, 1000], between_levels: [0, 1], evidence: "stairs up the side of the lower liquid reserve (to its rim?)" },
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
        "Every other door (they will be sliding access doors): only the Crystal Chamber's door and the stair room's two openings are confirmed, and their positions on the walls are approximate",
        "Elevation heights (only the ORDER ground < raised is known) and every ramp or stair",
        "What the two liquid reserves contain (ooze or another liquid), and whether the stairs lead onto their rims",
        "The zone to the right of the arena (the catwalks) is blocked off for now and not being developed",
        "Whether the nest area has any entrance from the arena (the arrow points down into it), and whether its bottom edge is closed",
        "The teleport feature itself (to be added later): Teleport Room 1 and 2 are placeholders",
        "The names of the faint 'FRONT OFFICE' and the unlabelled rooms",
        "The CARRIER NPC drawn beside the map is a creature design, not map geometry: it is not part of this file",
    ],
};
