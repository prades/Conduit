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
//   - `openings` and `connections` hold ONLY what is confirmed (so far the stair room's two openings, the Crystal Chamber's door, the arena's door to the hallway, the lobby's door to the hallway, and the lab's passage to Teleport Room 1). Everything the sketch merely suggests is in
//     `candidates` with the evidence, and does nothing until it is moved into `openings` + `connections` by hand;
//   - the nest area is one open room; the long lines round it are its outside edges (walls). Nothing outside every room is walkable;
//   - the arena's perimeter is solid wall / rock and blocks movement;
//   - nothing here is a ramp or a shortcut unless it is in `ramps` (also empty).
// `status` says how sure the tracing is: "traced" (read straight off the sketch), "approximate" (drawn loosely), "unconfirmed" (a guess about what it is).
const FACILITY_MAP = {
    id: "conduit_facility_01",
    scale: { px_per_tile: 20 },
    // THE THEME: a rundown facility that used to be a 2010s tech startup's headquarters (big-lobby, glass-and-product vibe, now decayed).
    theme: { era: "2010s tech startup headquarters", condition: "rundown" },
    // Elevation: separate metadata from the outlines. Heights are unknown (the sketch is flat), so only the ORDER is recorded.
    levels: [
        { id: 0, label: "ground" },
        { id: 1, label: "raised", height_status: "unknown: needs a value in tiles" },
    ],

    rooms: [
        { id: "crystal_chamber", label: "Crystal Chamber", level: 0, status: "traced", wall_material: "solid",
          polygon: [[245, 322], [400, 322], [400, 515], [245, 515]],
          objects: [{ id: "crystal", type: "objective", at: [315, 395], radius: 40, status: "traced" }] },
        { id: "teleport_room_1", label: "Teleport Room 1", level: 0, status: "traced", wall_material: "solid",
          note: "The sketch's faint 'TELE ROOM'. The teleport itself is a feature to be added later: the room is a placeholder for it. It takes in the little nook that used to sit between the Crystal Chamber, the hallway and the lab passage, so that corner is now a tidy alcove of this room (not a dead-end pocket of the hallway).",
          polygon: [[245, 515], [400, 515], [400, 525], [430, 525], [430, 575], [370, 575], [370, 700], [245, 700]] },
        { id: "front_lobby", label: "Front Lobby", level: 0, status: "approximate",
          dressing: "The big headquarters lobby: a BIG SIGN on the north wall and a reception desk area that leads through to the hallway at the back (which looks onto the experiment lab). Rundown 2010s startup.",
          note: "The sketch's faint 'FRONT OFFICE', now the Front Lobby. An arrow points in at the top-left: an entrance from outside is indicated but not drawn as an opening.",
          polygon: [[405, 322], [790, 322], [790, 470], [405, 470]] },
        { id: "upper_annex", label: "Unlabelled room beside the show room", level: 0, status: "unconfirmed", name_confirmed: false,
          polygon: [[795, 330], [875, 330], [875, 460], [795, 460]] },
        { id: "show_room", label: "Show Room", level: 0, status: "traced", wall_material: "glass",
          contents: "A glass case showcasing a bunch of different products. BLANK for now: nothing is placed in it yet.",
          polygon: [[880, 335], [1035, 335], [1035, 600], [880, 600]] },
        { id: "lab_hallway", label: "Hallway past the Experiment Lab", level: 0, status: "approximate",
          note: "The gridded floor round the lab: it runs from the arena's top-left corner up the lab's west side, along its north edge and down its east side, ending at the Crystal Chamber's door. The lab (and the passage to Teleport Room 1) cuts the ring open on the west, so this is a C, not a closed loop. Its north-west end is a clean dead end at the Crystal Chamber's door (the old nook there now belongs to Teleport Room 1).",
          polygon: [[400, 470], [875, 470], [875, 600], [815, 600], [815, 700], [370, 700], [370, 615], [430, 615], [430, 625], [750, 625], [750, 525], [430, 525], [400, 525]] },
        { id: "experiment_lab", label: "Experiment Lab", level: 0, status: "approximate", wall_material: "glass",
          note: "The enclosed lab in the middle of the gridded floor: WINDOWED OFF from the hallway round it (glass, not walkable). Its only way out is the narrow passage to Teleport Room 1. The interior furniture is not traced yet.",
          polygon: [[430, 525], [750, 525], [750, 625], [430, 625]] },
        { id: "lab_passage", label: "Narrow passage (lab to Teleport Room 1)", level: 0, status: "approximate",
          note: "The lab's little narrow hallway: it crosses the west side of the gridded floor from the lab's west wall to Teleport Room 1 (the arm of the lab drawn reaching the left wall in the sketch).",
          polygon: [[370, 575], [430, 575], [430, 615], [370, 615]] },
        { id: "teleport_stair_room", label: "Teleport Stair Room", level: 1, status: "approximate", name_confirmed: false,
          note: "The room that leads to Teleport Room 2: a curved staircase in it leads DOWN to the hallway past the experiment lab. Footprint and name are first guesses.",
          polygon: [[815, 600], [890, 600], [890, 700], [815, 700]] },
        { id: "teleport_room_2", label: "Teleport Room 2", level: 1, status: "traced", wall_material: "solid",
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
          polygon: [[385, 700], [530, 700], [545, 745], [600, 765], [690, 745], [715, 718], [765, 748], [880, 735], [945, 750],
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
        { id: "lobby_desk", room: "front_lobby", shape: "rect", rect: [475, 385, 735, 470], status: "approximate", kind: "reception_desk",
          note: "The reception desk area. It leads through (past its east end) to the hallway at the back." },
        { id: "lab_tank", room: "experiment_lab", shape: "circle", at: [715, 575], radius: 25, status: "approximate" },
        { id: "arena_truck", room: "arena", shape: "rect", rect: [420, 790, 500, 1010], status: "traced", kind: "semi_truck", cargo: [{ type: "missile", count: 3 }],
          note: "A semi-truck carrying three missiles, parked along the arena's west side. Solid." },
        { id: "arena_structure_01", room: "arena", shape: "circle", at: [790, 845], radius: 45, status: "traced", kind: "liquid_reserve", contents: "ooze_or_liquid (type to be decided)",
          note: "A giant reserve of ooze or liquid. Solid, but sized to leave walkways round it (about 3 tiles between the two, 5 to the right-hand wall): the player walks between them toward the zone on the right. Stairs are drawn on its west side." },
        { id: "arena_structure_02", room: "arena", shape: "circle", at: [800, 1000], radius: 45, status: "traced", kind: "liquid_reserve", contents: "ooze_or_liquid (type to be decided)",
          note: "A giant reserve of ooze or liquid. Solid, with walkways round it. Stairs are drawn on its west side." },
    ],

    // (There is no separate outer path: the long lines round the nest area are that room's outside edges, drawn as its walls. Anything outside every room is not walkable.)
    outer_path: null,

    // WINDOWS: a stretch of wall that is glass. See-through (a debug/render feature), SOLID to movement exactly like a wall. The lab is windowed off from the hallway round it.
    windows: [
        { id: "lab_window_north", a: [430, 525], b: [750, 525], rooms: ["experiment_lab", "lab_hallway"] },
        { id: "lab_window_east", a: [750, 525], b: [750, 625], rooms: ["experiment_lab", "lab_hallway"] },
        { id: "lab_window_south", a: [750, 625], b: [430, 625], rooms: ["experiment_lab", "lab_hallway"] },
        { id: "show_window_north", a: [880, 335], b: [1035, 335], rooms: ["show_room"] },
        { id: "show_window_east", a: [1035, 335], b: [1035, 600], rooms: ["show_room"] },
        { id: "show_window_west", a: [880, 600], b: [880, 335], rooms: ["show_room"] },
        { id: "lab_window_west_lower", a: [430, 615], b: [430, 625], rooms: ["experiment_lab", "lab_hallway"] },
    ],

    // EVERY DOOR in the facility is a sliding access door. A confirmed opening below is one (its `door` defaults to this).
    door_type: "sliding_access_door",

    // WALL FIXTURES: things mounted on a wall. `wall` names the room and the edge (0 = the edge from its first point to its second, and so on); `span` is where along the wall,
    // in sketch pixels. Positions are approximate until checked in the debug view.
    fixtures: [
        { id: "power_pack_area", type: "power_pack_area", room: "crystal_chamber", edge: 0, a: [335, 322], b: [395, 322], status: "approximate",
          note: "The power / battery pack area on the Crystal Chamber's north wall (somewhere on the wall: this is a first placement). The wall power unit's cells and machine go here." },
        { id: "lobby_sign", type: "wall_sign", room: "front_lobby", edge: 0, a: [520, 322], b: [680, 322], status: "approximate",
          note: "The big headquarters sign over the lobby. Its wording is not decided." },
    ],

    // CONFIRMED only. An opening is a gap cut into the walls along the segment a -> b; a connection says which two rooms it joins (and the ramp, if their levels differ).
    // The stair room: confirmed by the user. The positions on the walls are APPROXIMATE (centred on the shared wall) until checked in the debug view.
    openings: [
        { id: "door_lobby_hallway", a: [748, 470], b: [788, 470], rooms: ["front_lobby", "lab_hallway"], position_status: "approximate",
          note: "A sliding access door from the reception desk area through to the hallway at the back, just past the desk's east end." },
        { id: "door_arena_hallway", a: [400, 700], b: [440, 700], rooms: ["arena", "lab_hallway"], position_status: "approximate",
          note: "A sliding access door from the arena's top-left corner onto the hallway that circles round the lab into the Crystal Chamber." },
        { id: "door_passage_teleport_1", a: [370, 578], b: [370, 612], rooms: ["lab_passage", "teleport_room_1"], position_status: "approximate",
          note: "A sliding access door between the narrow passage and Teleport Room 1." },
        { id: "door_lab_passage", a: [430, 578], b: [430, 612], rooms: ["experiment_lab", "lab_passage"], position_status: "approximate",
          note: "A sliding access door between the lab and the narrow passage." },
        { id: "door_crystal_hallway", a: [400, 476], b: [400, 508], rooms: ["crystal_chamber", "lab_hallway"], position_status: "approximate",
          note: "A sliding access door from the Crystal Chamber onto the hallway that passes the experiment lab (on the shared wall, near its middle)." },
        { id: "open_stair_mouth", a: [815, 610], b: [815, 690], rooms: ["teleport_stair_room", "lab_hallway"], door: null, position_status: "approximate",
          note: "The open foot of the curved staircase, onto the hallway. No door." },
        { id: "door_stair_teleport_2", a: [890, 625], b: [890, 665], rooms: ["teleport_stair_room", "teleport_room_2"], position_status: "approximate",
          note: "A sliding access door between the stair room and Teleport Room 2." },
    ],
    connections: [
        { id: "conn_lobby_hallway", rooms: ["front_lobby", "lab_hallway"], opening: "door_lobby_hallway" },
        { id: "conn_arena_hallway", rooms: ["arena", "lab_hallway"], opening: "door_arena_hallway" },
        { id: "conn_lab_passage", rooms: ["experiment_lab", "lab_passage"], opening: "door_lab_passage" },
        { id: "conn_passage_teleport_1", rooms: ["lab_passage", "teleport_room_1"], opening: "door_passage_teleport_1" },
        { id: "conn_crystal_hallway", rooms: ["crystal_chamber", "lab_hallway"], opening: "door_crystal_hallway" },
        { id: "conn_stair_hallway", rooms: ["teleport_stair_room", "lab_hallway"], opening: "open_stair_mouth", ramp: "r_teleport_stairs" },
        { id: "conn_stair_teleport_2", rooms: ["teleport_stair_room", "teleport_room_2"], opening: "door_stair_teleport_2" },
    ],
    ramps: [
        { id: "r_teleport_stairs", rooms: ["teleport_stair_room", "lab_hallway"], shape: "curved", centre: [890, 650], r_inner: 20, r_outer: 50, from_deg: 90, to_deg: 270,
          between_levels: [1, 0], descends_toward: "lab_hallway", position_status: "approximate",
          note: "A rounded (curved) staircase leading DOWN from the stair room to the hallway that passes the experiment lab." },
    ],

    // What the sketch SUGGESTS and the user has not confirmed. None of these is a gap, a link or a ramp until it is moved above.
    candidates: {
        connections: [
            { id: "c_crystal_left", rooms: ["crystal_chamber", "teleport_room_1"], at: [300, 515], evidence: "a notch in the dividing wall" },
            { id: "c_crystal_lobby", rooms: ["crystal_chamber", "front_lobby"], at: [400, 400], evidence: "the stepped wall between them" },
            { id: "c_annex_lobby", rooms: ["upper_annex", "front_lobby"], at: [792, 400], evidence: "the annex's west wall is drawn broken" },
            { id: "c_annex_lab", rooms: ["upper_annex", "lab_hallway"], at: [835, 465], evidence: "the annex's door-like stalls open toward the lab" },
            { id: "c_show_lab", rooms: ["show_room", "lab_hallway"], at: [878, 540], evidence: "the show room's west wall meets the lab's grid" },
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
        { id: "front_entrance", at: [360, 310], room: "front_lobby", status: "indicated_by_arrow", walkable: false, note: "an arrow points in at the top-left" },
        { id: "further_nests", at: [470, 1320], room: "nest_area", status: "indicated_by_arrow", walkable: false, note: "an arrow points down into the nest area" },
    ],

    unresolved: [
        "The scale: px_per_tile is a first guess, to be calibrated in the game",
        "Every other door (they will be sliding access doors): only the Crystal Chamber's door, the stair room's two openings, the arena's door, the lobby's door and the lab passage's two doors are confirmed, and their positions on the walls are approximate",
        "Elevation heights (only the ORDER ground < raised is known) and every ramp or stair",
        "What the two liquid reserves contain (ooze or another liquid), and whether the stairs lead onto their rims",
        "The zone to the right of the arena (the catwalks) is blocked off for now and not being developed",
        "Whether the nest area has any entrance from the arena (the arrow points down into it), and whether its bottom edge is closed",
        "The teleport feature itself (to be added later): Teleport Room 1 and 2 are placeholders",
        "The unlabelled room beside the show room; what goes in the show room (blank for now); the lobby sign's wording; where exactly the power pack sits on the chamber wall",
        "The CARRIER NPC drawn beside the map is a creature design, not map geometry: it is not part of this file",
    ],
};
