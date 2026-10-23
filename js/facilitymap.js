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
//   - `openings` and `connections` hold ONLY what is confirmed (see the lists below). Everything the sketch merely suggests is in
//     `candidates` with the evidence, and does nothing until it is moved into `openings` + `connections` by hand;
//   - the nest area is one open room; the long lines round it are its outside edges (walls). Nothing outside every room is walkable;
//   - the arena's perimeter is solid wall / rock and blocks movement;
//   - nothing here is a ramp or a shortcut unless it is in `ramps` (also empty).
// `status` says how sure the tracing is: "traced" (read straight off the sketch), "approximate" (drawn loosely), "unconfirmed" (a guess about what it is).
const FACILITY_MAP = {
    id: "conduit_facility_01",
    // 20 px to a tile. The hallway round the lab is 120 px = SIX tiles wide, matching the strip's lane: the other rooms were pushed outward to make room for it (wide enough to fight in).
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
          polygon: [[185, 262], [370, 262], [370, 500], [185, 500]],
          objects: [{ id: "crystal", type: "objective", at: [255, 335], radius: 40, status: "traced" }] },
        { id: "teleport_room_1", label: "Teleport Room 1", level: 0, status: "traced", wall_material: "solid",
          note: "The sketch's faint 'TELE ROOM'. The teleport itself is a feature to be added later: the room is a placeholder for it. It takes in the little nook that used to sit between the Crystal Chamber, the hallway and the lab passage, so that corner is now a tidy alcove of this room (not a dead-end pocket of the hallway).",
          polygon: [[185, 500], [370, 500], [370, 530], [430, 530], [430, 565], [310, 565], [310, 760], [185, 760]] },
        { id: "front_lobby", label: "Front Lobby", level: 0, status: "approximate",
          dressing: "The big headquarters lobby: a BIG SIGN on the north wall and a reception desk area that leads through to the hallway at the back (which looks onto the experiment lab). Rundown 2010s startup.",
          note: "The sketch's faint 'FRONT OFFICE', now the Front Lobby. An arrow points in at the top-left: an entrance from outside is indicated but not drawn as an opening.",
          polygon: [[380, 222], [824, 222], [824, 410], [380, 410]] },
        { id: "bathroom", label: "Bathroom", level: 0, status: "approximate", wall_material: "solid",
          note: "The sketch's unlabelled room beside the show room: a bathroom. It has a door to the Front Lobby and a door to the hallway.",
          polygon: [[824, 270], [930, 270], [930, 410], [824, 410]] },
        { id: "show_room", label: "Show Room", level: 0, status: "traced", wall_material: "glass",
          contents: "A glass case showcasing a bunch of different products. BLANK for now: nothing is placed in it yet.",
          polygon: [[930, 275], [1090, 275], [1090, 600], [930, 600]] },
        { id: "lab_hallway", label: "Hallway past the Experiment Lab", level: 0, status: "approximate",
          note: "The gridded floor round the lab: it runs from the arena's top-left corner up the lab's west side, along its north edge and down its east side, ending at the Crystal Chamber's door. The lab (and the passage to Teleport Room 1) cuts the ring open on the west, so this is a C, not a closed loop. Its north-west end is a clean dead end at the Crystal Chamber's door (the old nook there now belongs to Teleport Room 1).",
          polygon: [[370, 410], [930, 410], [930, 600], [870, 600], [870, 760], [310, 760], [310, 605], [430, 605], [430, 640], [750, 640], [750, 530], [430, 530], [370, 530]] },
        { id: "experiment_lab", label: "Experiment Lab", level: 0, status: "approximate", wall_material: "glass",
          note: "The enclosed lab in the middle of the gridded floor: WINDOWED OFF from the hallway round it (glass, not walkable). Its only way out is the narrow passage to Teleport Room 1. The interior furniture is not traced yet.",
          polygon: [[430, 530], [750, 530], [750, 640], [430, 640]] },
        { id: "lab_passage", label: "Narrow passage (lab to Teleport Room 1)", level: 0, status: "approximate",
          note: "The lab's little narrow hallway: it crosses the west side of the gridded floor from the lab's west wall to Teleport Room 1 (the arm of the lab drawn reaching the left wall in the sketch).",
          polygon: [[310, 565], [430, 565], [430, 605], [310, 605]] },
        { id: "teleport_stair_room", label: "Teleport Stair Room", level: 1, status: "approximate", name_confirmed: false,
          note: "The room that leads to Teleport Room 2: a curved staircase in it leads DOWN to the hallway past the experiment lab. Footprint and name are first guesses.",
          polygon: [[870, 600], [945, 600], [945, 760], [870, 760]] },
        { id: "teleport_room_2", label: "Teleport Room 2", level: 1, status: "traced", wall_material: "solid",
          note: "The sketch's labelled TELEPORT. Raised: reached from the stair room, whose staircase leads down to the hallway. The teleport itself is a feature to be added later: the room is a placeholder for it.",
          polygon: [[945, 600], [1090, 600], [1090, 790], [945, 790]] },
        { id: "observation_deck", label: "Observation Deck", level: 0, status: "traced",
          note: "Steps are drawn along its west side (seating or a raised floor: unconfirmed). It is treated as ground level for now so its door to Teleport Room 1 needs no ramp; change `level` if it is raised.",
          polygon: [[180, 760], [340, 760], [340, 1165], [180, 1165]] },
        { id: "catwalks", label: "Catwalks", level: 1, status: "traced", development: "blocked_off_for_now",
          note: "The zone to the right of the arena. It is BLOCKED OFF for now (not being developed): the player can walk up to it, not into it. Raised walkway with railing posts along its west side. Height unknown.",
          polygon: [[1005, 810], [1100, 810], [1100, 1210], [1005, 1210]] },
        { id: "arena", label: "Arena", level: 0, status: "traced",
          boundary_type: "solid_walls_or_rock_formations", boundary_blocks_movement: true,
          // The floor outline, clockwise from the top-left. Every edge is solid; `edge_kinds[i]` is the edge from point i to point i+1.
          polygon: [[340, 760], [530, 760], [545, 805], [600, 825], [690, 805], [715, 778], [778, 808], [935, 795], [1000, 810],
                    [1000, 1180], [805, 1155], [640, 1135], [560, 1138], [520, 1180], [440, 1215], [380, 1190], [340, 1165]],
          edge_kinds: ["rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "railing_wall",
                       "rock", "rock", "rock", "rock", "rock", "rock", "rock", "deck_wall"] },
        { id: "nest_area", label: "Nest area", level: 0, status: "approximate",
          boundary_type: "outer_edge", boundary_blocks_movement: true,
          note: "One completely open room. The long double lines in the sketch are its OUTSIDE EDGES (walls), not tunnels or a path. The sketch stops drawing at the bottom, so the bottom wall is provisional.",
          polygon: [[205, 1250], [1120, 1250], [1120, 1705], [205, 1705]],
          edge_kinds: ["outer_wall", "outer_wall", "outer_wall_provisional", "outer_wall"] },
    ],

    // Solid things standing in a room. Collision is on for all of them; the arena's two circular structures are giant reserves of ooze or liquid (solid tanks).
    props: [
        { id: "lobby_desk", room: "front_lobby", shape: "rect", rect: [475, 325, 735, 410], status: "approximate", kind: "reception_desk",
          note: "The reception desk area. It leads through (past its east end) to the hallway at the back." },
        { id: "lab_tank", room: "experiment_lab", shape: "circle", at: [715, 575], radius: 25, status: "approximate", kind: "tank" },

        // ── THE COMPUTER LAB (the Front Lobby's floor, beside the reception desk): rows of computer desks along the north wall and server racks down the west and east walls.
        //    Everything stands clear of the doors, the reception desk and the bathroom door, so the lobby stays walkable. (Placed in the amber old-tech look of the lab wall.)
        { id: "computers_1", room: "front_lobby", shape: "rect", rect: [420, 222, 520, 252], status: "placed", kind: "computer_desk", note: "A row of computer desks with monitors, facing the aisle." },
        { id: "computers_2", room: "front_lobby", shape: "rect", rect: [545, 222, 665, 252], status: "placed", kind: "computer_desk" },
        { id: "computers_3", room: "front_lobby", shape: "rect", rect: [690, 222, 790, 252], status: "placed", kind: "computer_desk" },
        { id: "racks_west", room: "front_lobby", shape: "rect", rect: [380, 262, 410, 378], status: "placed", kind: "server_rack", note: "Server racks down the west wall." },
        { id: "racks_east", room: "front_lobby", shape: "rect", rect: [794, 222, 824, 296], status: "placed", kind: "server_rack", note: "Server racks in the north-east corner (the bathroom door below them stays clear)." },

        // ── THE SCIENCE LAB (the Experiment Lab): benches along the north and south walls, a fume hood, glass test chambers beside the big tank. A two-and-a-half tile aisle runs between the benches
        //    from the passage door to the tank.
        { id: "lab_bench_north", room: "experiment_lab", shape: "rect", rect: [450, 530, 610, 560], status: "placed", kind: "lab_bench", note: "A long bench: microscope, glassware, sample racks." },
        { id: "lab_hood", room: "experiment_lab", shape: "rect", rect: [630, 530, 690, 560], status: "placed", kind: "fume_hood", note: "A fume hood on the north wall." },
        { id: "lab_bench_south", room: "experiment_lab", shape: "rect", rect: [450, 612, 610, 640], status: "placed", kind: "lab_bench" },
        { id: "chamber_1", room: "experiment_lab", shape: "circle", at: [668, 622], radius: 17, status: "placed", kind: "test_chamber", note: "A glass test chamber." },
        { id: "chamber_2", room: "experiment_lab", shape: "circle", at: [708, 624], radius: 15, status: "placed", kind: "test_chamber" },
        { id: "arena_truck", room: "arena", shape: "rect", rect: [410, 850, 500, 1070], status: "traced", kind: "semi_truck", cargo: [{ type: "missile", count: 3 }],
          note: "A semi-truck carrying three missiles, parked along the arena's west side. Solid." },
        { id: "arena_structure_01", room: "arena", shape: "circle", at: [824, 905], radius: 45, status: "traced", kind: "liquid_reserve", contents: "ooze_or_liquid (type to be decided)",
          note: "A giant reserve of ooze or liquid. Solid, but sized to leave walkways round it (about 3 tiles between the two, 5 to the right-hand wall): the player walks between them toward the zone on the right. Stairs are drawn on its west side." },
        { id: "arena_structure_02", room: "arena", shape: "circle", at: [842, 1060], radius: 45, status: "traced", kind: "liquid_reserve", contents: "ooze_or_liquid (type to be decided)",
          note: "A giant reserve of ooze or liquid. Solid, with walkways round it. Stairs are drawn on its west side." },
    ],

    // (There is no separate outer path: the long lines round the nest area are that room's outside edges, drawn as its walls. Anything outside every room is not walkable.)
    outer_path: null,

    // WINDOWS: a stretch of wall that is glass. See-through (a debug/render feature), SOLID to movement exactly like a wall. The lab is windowed off from the hallway round it.
    windows: [
        { id: "lab_window_north", a: [430, 530], b: [750, 530], rooms: ["experiment_lab", "lab_hallway"] },
        { id: "lab_window_east", a: [750, 530], b: [750, 640], rooms: ["experiment_lab", "lab_hallway"] },
        { id: "lab_window_south", a: [750, 640], b: [430, 640], rooms: ["experiment_lab", "lab_hallway"] },
        { id: "deck_window_arena", a: [340, 760], b: [340, 1165], rooms: ["observation_deck", "arena"] },   // the observation deck looks down into the arena through glass (solid to movement like every window)
        { id: "show_window_north", a: [930, 275], b: [1090, 275], rooms: ["show_room"] },
        { id: "show_window_east", a: [1090, 275], b: [1090, 600], rooms: ["show_room"] },
        { id: "show_window_west", a: [930, 600], b: [930, 410], rooms: ["show_room"] },   // the hallway side only: its north part is the bathroom's wall
        { id: "lab_window_west_lower", a: [430, 605], b: [430, 640], rooms: ["experiment_lab", "lab_hallway"] },
    ],

    // EVERY DOOR in the facility is a sliding access door. A confirmed opening below is one (its `door` defaults to this).
    door_type: "sliding_access_door",

    // WALL FIXTURES: things mounted on a wall. `wall` names the room and the edge (0 = the edge from its first point to its second, and so on); `span` is where along the wall,
    // in sketch pixels. Positions are approximate until checked in the debug view.
    fixtures: [
        { id: "power_pack_area", type: "power_pack_area", room: "crystal_chamber", edge: 0, a: [275, 262], b: [360, 262], status: "approximate",
          note: "The power / battery pack area on the Crystal Chamber's north wall (somewhere on the wall: this is a first placement). The wall power unit's cells and machine go here." },
        { id: "lobby_sign", type: "wall_sign", room: "front_lobby", edge: 0, a: [520, 222], b: [680, 222], status: "approximate",
          note: "The big headquarters sign over the lobby. Its wording is not decided." },
    ],

    // CONFIRMED only. An opening is a gap cut into the walls along the segment a -> b; a connection says which two rooms it joins (and the ramp, if their levels differ).
    // The stair room: confirmed by the user. The positions on the walls are APPROXIMATE (centred on the shared wall) until checked in the debug view.
    openings: [
        { id: "door_chamber_teleport_1", a: [225, 500], b: [265, 500], rooms: ["crystal_chamber", "teleport_room_1"], position_status: "approximate",
          note: "A sliding access door between the Crystal Chamber and Teleport Room 1 (at the notch the sketch shows in their dividing wall)." },
        { id: "door_teleport_1_deck", a: [250, 760], b: [290, 760], rooms: ["teleport_room_1", "observation_deck"], position_status: "approximate",
          note: "A sliding access door between Teleport Room 1 and the Observation Deck (at the notch at the top of the deck)." },
        { id: "door_lobby_hallway_west", a: [400, 410], b: [455, 410], rooms: ["front_lobby", "lab_hallway"], position_status: "approximate",
          note: "The lobby's west sliding door to the hallway at the back, on the near side of the reception desk." },
        { id: "door_lobby_hallway_east", a: [748, 410], b: [820, 410], rooms: ["front_lobby", "lab_hallway"], position_status: "approximate",
          note: "The lobby's east sliding door to the hallway at the back, just past the reception desk's east end." },
        { id: "door_bathroom_lobby", a: [824, 315], b: [824, 355], rooms: ["bathroom", "front_lobby"], position_status: "approximate",
          note: "The bathroom's sliding door to the Front Lobby." },
        { id: "door_bathroom_hallway", a: [875, 410], b: [905, 410], rooms: ["bathroom", "lab_hallway"], position_status: "approximate",
          note: "The bathroom's sliding door to the hallway." },
        { id: "door_showroom_hallway", a: [930, 490], b: [930, 550], rooms: ["show_room", "lab_hallway"], position_status: "approximate",
          note: "A sliding access door in the show room's glass west wall onto the hallway." },
        { id: "door_arena_hallway", a: [370, 760], b: [440, 760], rooms: ["arena", "lab_hallway"], position_status: "approximate",
          note: "A sliding access door from the arena's top-left corner onto the hallway that circles round the lab into the Crystal Chamber." },
        { id: "door_passage_teleport_1", a: [310, 565], b: [310, 605], rooms: ["lab_passage", "teleport_room_1"], position_status: "approximate",
          note: "A sliding access door between the narrow passage and Teleport Room 1." },
        { id: "door_lab_passage", a: [430, 565], b: [430, 605], rooms: ["experiment_lab", "lab_passage"], position_status: "approximate",
          note: "A sliding access door between the lab and the narrow passage." },
        { id: "door_crystal_hallway", a: [370, 422], b: [370, 486], rooms: ["crystal_chamber", "lab_hallway"], position_status: "approximate",
          note: "A sliding access door from the Crystal Chamber onto the hallway that passes the experiment lab (on the shared wall, near its middle)." },
        { id: "open_stair_mouth", a: [870, 610], b: [870, 740], rooms: ["teleport_stair_room", "lab_hallway"], door: null, position_status: "approximate",
          note: "The open foot of the curved staircase, onto the hallway. No door." },
        { id: "door_stair_teleport_2", a: [945, 625], b: [945, 690], rooms: ["teleport_stair_room", "teleport_room_2"], position_status: "approximate",
          note: "A sliding access door between the stair room and Teleport Room 2." },
    ],
    connections: [
        { id: "conn_chamber_teleport_1", rooms: ["crystal_chamber", "teleport_room_1"], opening: "door_chamber_teleport_1" },
        { id: "conn_teleport_1_deck", rooms: ["teleport_room_1", "observation_deck"], opening: "door_teleport_1_deck" },
        { id: "conn_lobby_hallway_west", rooms: ["front_lobby", "lab_hallway"], opening: "door_lobby_hallway_west" },
        { id: "conn_lobby_hallway_east", rooms: ["front_lobby", "lab_hallway"], opening: "door_lobby_hallway_east" },
        { id: "conn_bathroom_lobby", rooms: ["bathroom", "front_lobby"], opening: "door_bathroom_lobby" },
        { id: "conn_bathroom_hallway", rooms: ["bathroom", "lab_hallway"], opening: "door_bathroom_hallway" },
        { id: "conn_showroom_hallway", rooms: ["show_room", "lab_hallway"], opening: "door_showroom_hallway" },
        { id: "conn_arena_hallway", rooms: ["arena", "lab_hallway"], opening: "door_arena_hallway" },
        { id: "conn_lab_passage", rooms: ["experiment_lab", "lab_passage"], opening: "door_lab_passage" },
        { id: "conn_passage_teleport_1", rooms: ["lab_passage", "teleport_room_1"], opening: "door_passage_teleport_1" },
        { id: "conn_crystal_hallway", rooms: ["crystal_chamber", "lab_hallway"], opening: "door_crystal_hallway" },
        { id: "conn_stair_hallway", rooms: ["teleport_stair_room", "lab_hallway"], opening: "open_stair_mouth", ramp: "r_teleport_stairs" },
        { id: "conn_stair_teleport_2", rooms: ["teleport_stair_room", "teleport_room_2"], opening: "door_stair_teleport_2" },
    ],
    ramps: [
        { id: "r_teleport_stairs", rooms: ["teleport_stair_room", "lab_hallway"], shape: "curved", centre: [945, 660], r_inner: 20, r_outer: 50, from_deg: 90, to_deg: 270,
          between_levels: [1, 0], descends_toward: "lab_hallway", position_status: "approximate",
          note: "A rounded (curved) staircase leading DOWN from the stair room to the hallway that passes the experiment lab." },
    ],

    // What the sketch SUGGESTS and the user has not confirmed. None of these is a gap, a link or a ramp until it is moved above.
    candidates: {
        connections: [
            { id: "c_crystal_lobby", rooms: ["crystal_chamber", "front_lobby"], at: [370, 340], evidence: "the stepped wall between them" },
            { id: "c_teleport_catwalks", rooms: ["teleport_room_2", "catwalks"], at: [1045, 805], evidence: "the catwalks begin right under the teleport room" },
            { id: "c_catwalks_arena", rooms: ["catwalks", "arena"], at: [1000, 960], evidence: "railing posts along the catwalks' west side" },
            { id: "c_deck_arena", rooms: ["observation_deck", "arena"], at: [340, 860], evidence: "the deck wall is drawn with breaks" },
            { id: "c_arena_nest", rooms: ["arena", "nest_area"], at: [470, 1240], evidence: "an arrow points from 'FURTHER NESTS' down into the nest area; no opening is drawn" },
        ],
        ramps: [
            { id: "r_structure_01_stairs", at: [745, 905], between_levels: [0, 1], evidence: "stairs up the side of the upper liquid reserve (to its rim?)" },
            { id: "r_structure_02_stairs", at: [759, 1060], between_levels: [0, 1], evidence: "stairs up the side of the lower liquid reserve (to its rim?)" },
            { id: "r_deck_steps", at: [202, 960], between_levels: [0, 1], evidence: "hatched steps along the observation deck's west edge" },
        ],
    },

    // Where the sketch points off the map. Neither is a connection.
    external_exits: [
        { id: "further_dungeons", at: [1100, 975], room: "catwalks", status: "indicated_by_arrow", walkable: false, note: "an arrow leaves the catwalks to the east" },
        { id: "blocked_path", at: [1100, 1060], room: "catwalks", status: "traced", blocked: true, note: "labelled BLOCKED PATH" },
        { id: "front_entrance", at: [300, 250], room: "front_lobby", status: "indicated_by_arrow", walkable: false, note: "an arrow points in at the top-left" },
        { id: "further_nests", at: [470, 1380], room: "nest_area", status: "indicated_by_arrow", walkable: false, note: "an arrow points down into the nest area" },
    ],

    unresolved: [
        "The scale (20 px a tile) and the room sizes: the main hallway is 6 tiles wide (the strip's lane) with the lab and the other rooms pushed outward to fit it; the rooms may need tuning in play",
        "Every other door (they will be sliding access doors): the doors listed under `openings` are confirmed and their positions on the walls are approximate",
        "Elevation heights (only the ORDER ground < raised is known) and every ramp or stair",
        "What the two liquid reserves contain (ooze or another liquid), and whether the stairs lead onto their rims",
        "The zone to the right of the arena (the catwalks) is blocked off for now and not being developed",
        "Whether the nest area has any entrance from the arena (the arrow points down into it), and whether its bottom edge is closed",
        "The teleport feature itself (to be added later): Teleport Room 1 and 2 are placeholders",
        "What goes in the show room (blank for now); the lobby sign's wording; where exactly the power pack sits on the chamber wall",
        "The CARRIER NPC drawn beside the map is a creature design, not map geometry: it is not part of this file",
    ],
};
