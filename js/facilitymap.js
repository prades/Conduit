// ─────────────────────────────────────────────────────────
//  THE PERMANENT FACILITY — authored map DATA (no logic: js/facility.js reads it)
// ─────────────────────────────────────────────────────────
// Source of truth: the hand-drawn top-down floor plan (the clipboard photo) and conduit_facility_map_spec.json. Edit THIS file to change the facility; nothing in
// the game code names a room or a coordinate.
//
// NOTE: this file is the SKETCH layout (rooms touch). js/facilitygrow.js runs at load and spaces the building out so every wall between rooms is a one-tile band; the built map is what the game and the tests see.
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
    // `height` is in tiles above the ground floor (the hallway). The arena is sunk a little below it; the observation deck and the catwalks stand well above the arena. Heights are for DRAWING
    // (the floor, walls and units rise and fall with them); movement is still flat, and the only way between two heights is a ramp below.
    levels: [
        { id: -2, label: "deep", height: -3.0 },     // (the electrical domain's circuitry, below its deep server room: docs/DOMAINS.md)
        { id: -1, label: "sunken", height: -1.8 },
        { id: 0, label: "ground", height: 0 },
        { id: 1, label: "raised", height: 1.6 },
        { id: 2, label: "high", height: 3.2 },
    ],

    rooms: [
        { id: "crystal_chamber", label: "Crystal Chamber", level: 0, status: "traced", wall_material: "solid",
          polygon: [[185, 262], [370, 262], [370, 500], [185, 500]],
          objects: [{ id: "crystal", type: "objective", at: [255, 335], radius: 40, status: "traced" }] },
        { id: "teleport_room_1", label: "Teleport Room 1", level: 0, status: "traced", wall_material: "solid",
          note: "The sketch's faint 'TELE ROOM'. The teleport itself is a feature to be added later: the room is a placeholder for it. It takes in the little nook that used to sit between the Crystal Chamber, the hallway and the lab passage, so that corner is now a tidy alcove of this room (not a dead-end pocket of the hallway).",
          polygon: [[185, 500], [370, 500], [370, 530], [430, 530], [430, 565], [310, 565], [310, 760], [185, 760]] },
        { id: "front_lobby", label: "Server Room", level: 0, status: "approximate",
          dressing: "THE SERVER ROOM (the owner, 2026-11-07: \"make that a server room, a dark server room\"; it was the Front Lobby's computer lab): rows of server racks, cables over the floor, the monitoring console, and the facility's main power junction. It stays dim with the power on: the racks' lights blink in the dark.",
          note: "The sketch's faint 'FRONT OFFICE', now the Front Lobby. An arrow points in at the top-left: an entrance from outside is indicated but not drawn as an opening.",
          // the alcove in the north wall beside the junction (x 680 to 720, one tile deep) is THE LITTLE DOOR down to the electrical domain (docs/DOMAINS.md; the owner, 2026-11-11: "a little door in the server room")
          polygon: [[380, 222], [680, 222], [680, 202], [720, 202], [720, 222], [824, 222], [824, 410], [380, 410]] },
        { id: "security_room", label: "Security Room", level: 0, status: "approximate", wall_material: "solid",
          note: "The sketch's unlabelled room beside the show room, once taken for a bathroom: the Security Room. Monitors line its walls (the camera feeds), with a console desk, a chair, filing cabinets and a locker. It has a door to the Front Lobby and a door to the hallway.",
          polygon: [[824, 270], [930, 270], [930, 410], [824, 410]] },
        { id: "show_room", label: "Warehouse", level: 0, status: "traced", wall_material: "glass",
          contents: "THE WAREHOUSE (the owner, 2026-11-07: \"the showroom, I want to convert that into a little warehouse\"): pallet racks, crate stacks, barrels, a cart and lockers. Its outer walls are solid now; the glass front onto the hallway stays, with its door.",
          polygon: [[930, 275], [1090, 275], [1090, 600], [930, 600]] },
        { id: "lab_hallway", label: "Hallway past the Experiment Lab", level: 0, status: "approximate",
          note: "The gridded floor round the lab: it runs from the arena's top-left corner up the lab's west side, along its north edge and down its east side, ending at the Crystal Chamber's door. The lab (and the passage to Teleport Room 1) cuts the ring open on the west, so this is a C, not a closed loop. Its north-west end is a clean dead end at the Crystal Chamber's door (the old nook there now belongs to Teleport Room 1).",
          polygon: [[370, 410], [930, 410], [930, 600], [870, 600], [870, 760], [310, 760], [310, 605], [430, 605], [430, 640], [750, 640], [750, 530], [430, 530], [370, 530]] },
        { id: "experiment_lab", label: "Experiment Lab", level: 0, status: "approximate", wall_material: "glass",
          note: "The enclosed lab in the middle of the gridded floor: WINDOWED OFF from the hallway round it (glass, not walkable). Its only DOOR is the narrow passage to Teleport Room 1; the stairwell in its north-west corner goes down to the Cold Storage (an interior: a doorway you go through, so with the passage shut no walk reaches the lab). The interior furniture is not traced yet.",
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
        { id: "observation_deck", label: "Observation Deck", level: 2, status: "traced",
          note: "Steps are drawn along its west side (seating or a raised floor: unconfirmed). It is RAISED above the arena (it looks down into it through glass) and is reached from Teleport Room 1 by a short flight of steps at its door.",
          // an ALCOVE in the west wall (two tiles wide, one deep, at y 870 to 910): the doorway down to the Armory, which lies under the deck (see `interiors` and `portals` below)
          polygon: [[180, 760], [340, 760], [340, 950], [180, 950], [180, 910], [160, 910], [160, 870], [180, 870]] },
        { id: "armory", label: "Armory", level: -1, status: "placed", wall_material: "solid", interior: true,
          note: "The armory, UNDER the Observation Deck, at the arena's floor level: a room can't sit under another on a flat plan, so it is an INTERIOR: it is drawn here, under the deck, and built in a part of the map of its own (`interiors`). There are two ways in, each a pair of doorways (`portals`): down the stairs from the alcove in the deck's west wall, and through the steel door in the alcove in the arena's west cave wall (where the armory's own door used to be); inside, two alcoves in its north wall lead back out. Weapon racks on the walls, lockers, ammunition crates and a workbench.",
          // two ALCOVES in the north wall (each two tiles wide and one deep): at x 200 to 240 the doorway to the arena (a steel door), at x 290 to 330 the stairs back up to the deck
          polygon: [[180, 950], [200, 950], [200, 930], [240, 930], [240, 950], [290, 950], [290, 930], [330, 930], [330, 950], [340, 950], [340, 1150], [180, 1150]] },
        { id: "catwalks", label: "Catwalks", level: 2, status: "traced", development: "blocked_off_for_now",
          structure: "scaffold",
          note: "The zone to the right of the arena: NOT a room but scaffolding at the top of the arena, an open steel deck with railings on legs along its east edge. It is BLOCKED OFF for now (not being developed): the player can walk up to it, not into it.",
          polygon: [[1005, 810], [1100, 810], [1100, 1210], [1005, 1210]] },
        { id: "arena", label: "Arena", level: -1, status: "traced",
          boundary_type: "solid_walls_or_rock_formations", boundary_blocks_movement: true,
          // The floor outline, clockwise from the top-left. Every edge is solid; `edge_kinds[i]` is the edge from point i to point i+1.
          // THE COLD STORAGE DOOR: the arena's north side, where the generator stood (its bay was cut back from a lobe of rock that ran down to y 825), is cave rock again, and in it an ALCOVE five tiles wide and one deep
          // (x 580 to 680) holds the Cold Storage's double door, set in boulders, on its middle three tiles (x 600 to 660): the doorway into the Cold Storage, which lies under the Experiment Lab (a portal: it is an interior,
          // see `interiors`). The door's wall is plain wall, built into the rock, with a tile of rock either side of it; the alcove's two sides are rock (the owner, 2026-11-09: "Rock curves into the alcove";
          // they were plain wall), the rock rounded round its corners (js/facilitydecor.js, rounded rock). It takes the one-tile band of wall between the arena
          // and the hallway above it, so the hallway gives up the tile behind it (a notch in its south side: js/facilitygrow.js) and a wall of full thickness still stands between the two. (Five wide, not three: the
          // camera looks at the north wall from the south-east, and the rock in front of an alcove's east corner hides the last tile of its back wall, so the door stops a tile short of it.)
          // THE SEWER CULVERT: a second alcove in the north rock, behind the north tank (three tiles wide, x 780 to 840, one deep): an arched concrete culvert with its grating raised, the way down to the Sewers
          // (a portal: the Sewers are an interior). The tanks' runoff goes down to them through the overflow grates at the tanks' feet (floor decor `overflow_grate`).
          polygon: [[340, 760], [540, 760], [580, 760], [580, 740], [600, 740], [660, 740], [680, 740], [680, 760], [715, 760], [778, 808], [780, 808], [780, 788], [840, 788], [840, 808], [935, 795], [1000, 810],
                    // THE ARMORY DOOR: an ALCOVE in the west cave wall just south of the two garage doors, where the Armory's own door used to be (two tiles wide at y 1090 to 1130, one deep): the doorway into the Armory
                    // from the arena (a portal: the Armory is an interior, see `interiors`). Its three sides are plain wall, built into the rock.
                    [1000, 1180], [805, 1155], [640, 1135], [560, 1138], [520, 1180], [440, 1215], [380, 1190], [340, 1165], [340, 1130], [320, 1130], [320, 1090], [340, 1090], [340, 950]],
          edge_kinds: ["rock", "rock", "rock", "rock", "wall", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "railing_wall",
                       "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "wall", "wall", "wall", "rock", "deck_wall"] },
        { id: "cold_storage", label: "Cold Storage", level: -1, status: "placed", wall_material: "solid", interior: true,
          note: "The cold storage, UNDER the Experiment Lab, at the arena's floor level: an INTERIOR like the armory (drawn here, under the lab, built in a part of the map of its own: `interiors`). Two ways in, each a pair of doorways (`portals`): the double freezer door in the arena's north cave wall (where the generator stood), and the stairwell in the Experiment Lab's floor, in its north-west corner by its door. Inside, from the user's floor plan: the entrance in the west wall at the top, a bank of freezers along the north wall, the stairs up in the floor at the west side, two storage racks toppled over in the middle, and in the south and east an ice cave with rough walls. ICE: the look only (frost, an icy floor, icicles); it plays like any floor.",
          // the room from the user's plan (20 px to a tile; its top-left at (440, 540)): the built part is twelve tiles wide; its east wall runs seven tiles down and its west wall eleven; between them the ICE CAVE's rough
          // edge bulges out to the south-east. The ENTRANCE is an alcove in the west wall at the top (three tiles, x 420 to 440): the freezer door back out to the arena.
          // (The cave's south-west edge zigzags, two tiles across to one down: a piece running at 45 degrees, north-west to south-east, would be seen exactly side-on and show no rock at all.)
          polygon: [[440, 540], [680, 540], [680, 680], [720, 700], [740, 740], [760, 780], [760, 820], [720, 860], [680, 880], [620, 900], [580, 880], [540, 860], [520, 820], [480, 800], [460, 760],
                    [440, 760], [440, 620], [420, 620], [420, 560], [440, 560]],
          edge_kinds: ["wall", "wall", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "wall", "wall", "wall", "wall", "wall"] },
        { id: "sewers", label: "Sewers", level: -1, status: "placed", wall_material: "solid", interior: true,
          note: "THE SEWERS, UNDER the arena: an INTERIOR (drawn here, under the arena, built in a part of the map of its own: `interiors`), the way in a culvert in the arena's north rock behind the north tank (a pair of portals). From the user's layout A ('two ledges, the river between'): one long tunnel, a LEDGE along each side of a DEEP RIVER (the tanks' violet runoff, pouring in from an outfall at its head; nothing walks in it: solids of kind `river`), a bridge across it, a broken one, and a service bridge by the Nest; side passages shut behind GATES (barred grilles you see through: solids of kind `gate`), one of them SIDE QUEST'S MAINTENANCE PLATFORM; a COLLAPSED TUNNEL off the north ledge: a broken-off stretch of an old side tunnel's floor, open onto the ledge and choked along its whole mouth with the collapse's rubble (a solid of kind `rubble`, drilled through from the ledge; a Kinetic Launcher there carries you over it, and its broken edge drops you back: the sample puzzle, docs/SEWER-QUEST.md) and a sealed hatch, a way in for later; and at the east end THE NEST (js/population.js NESTS): the Toxic Ant Queen's colony, built on a TRASH DAM over the water, behind the BOSS GATE (sealed until the purification module is brought to it). Its creatures: the Nest's toxic ants (js/population.js SPAWN_TABLES.sewers).",
          // the tunnel from the user's layout (20 px to a tile; its top-left at (300, 860)): thirty-eight tiles long to the Nest, the north ledge two tiles deep (y 860 to 900), the river six (900 to 1020), the south ledge
          // THREE (1020 to 1080: widened 2026-11-01, "Widen the left-side sewer areas. Open up the river-side sections"; it was two, and it is the way to the Nest). The way up is an alcove at the west end of the north
          // ledge (x 280 to 300): the culvert back to the arena. Off the north ledge: the first side passage (x 360 to 400, three tiles deep, gated: for later); SIDE QUEST'S MAINTENANCE PLATFORM (x 600 to 700, five
          // tiles across and three deep, behind a wide gate he opens: its back wall faces the camera, so it is seen from the ledges and the bridges); THE COLLAPSED TUNNEL (x 820 to 940: six tiles of floor across, four
          // deep, y 780 to 860), open onto the ledge along its whole width and choked along that whole mouth (the `sewer_choke` solid: the floor behind is its own stretch, walked into only once the choke is drilled
          // through; the launcher site on the ledge throws over it). Off the south ledge: a side passage (x 600 to 640, gated: for later). The north ledge stops at x 1020, where the SERVICE BRIDGE (x 980 to 1020)
          // crosses to the south ledge, so the two ledges, the two bridges and the Nest's gate make a loop and nobody walks back to the first bridge to reach the Nest. THE NEST (x 1060 to 1360, y 800 to 1120):
          // its reservoir (west, under the big barred arch in the north wall, where a stream comes out of an old tunnel), the CAUSEWAY from the boss gate east across the water, the DAM itself (a wide flat
          // platform of trash, nine tiles across and fourteen deep, its console and the queen's post at its north-west corner, the brood's eggs at its north-east), the moat round its south and east, and the
          // waterfall where the moat spills over the east edge.
          polygon: [[280, 860], [300, 860], [300, 840], [340, 840], [340, 860], [360, 860], [360, 800], [400, 800], [400, 860], [440, 860], [440, 780], [560, 780], [560, 860], [600, 860], [600, 800], [700, 800], [700, 860], [820, 860], [820, 780], [940, 780], [940, 860], [1020, 860], [1040, 860], [1040, 800],
                    [1060, 800], [1360, 800], [1360, 860], [1360, 1120], [1060, 1120], [1060, 1080], [640, 1080], [640, 1140], [600, 1140], [600, 1080], [300, 1080], [280, 1080], [280, 1040], [300, 1040], [300, 900], [280, 900]],
          // (the Nest's two edges on the camera's side where the moat runs, east and south, are a low SPILL lip, not a wall: the moat is seen over it, and over the east one the water pours: the waterfall)
          edge_kinds: ["wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "spill", "spill", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall", "wall"] },
        { id: "nest_area", label: "Ant Nest", level: -1, status: "placed", wall_material: "solid", interior: true,
          note: "THE ANT NEST (docs/NEST.md; the owner, 2026-11-07: \"the nest would be in the against the wall of the arena that the southernmost wall and it is beyond the rubble in a new room\"; \"Big egg cavern\"): an INTERIOR beyond the arena's south rock, reached through the hole a fire technician drills in the arena's south rubble (`rubble_arena_south`: the portal there is shut until it is drilled), and back up through a tunnel mouth in its north wall. A big egg cavern of packed dirt and resin, sixteen tiles across and twelve deep, the colony's eggs and brood holes round its edge and its middle open: the ground to test squads and moves against THE ANT QUEEN (step B). It replaces the sketch's open 'Nest area' south of the arena (an unreachable outline, its bottom wall a guess).",
          // drawn just beyond the arena's south rock, under the rubble: the TUNNEL MOUTH is an alcove in the north wall (x 570 to 610, one tile deep), right below the rubble's hole. The cave's corners are cut on slopes of
          // two tiles to one (a piece at 45 degrees running north-west to south-east would be seen side-on and show no rock); the north-west one at 45 degrees the other way, which the camera sees face on.
          polygon: [[480, 1180], [570, 1180], [570, 1160], [610, 1160], [610, 1180], [720, 1180], [760, 1200], [760, 1360], [740, 1400], [700, 1420], [500, 1420], [460, 1400], [440, 1360], [440, 1220]],
          edge_kinds: ["rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock", "rock_low", "rock"] },   // (its west wall, where the tunnels leave, a low rim since build 2026-11-12a: a tall back wall would hide the tunnel behind it)
        // THE ANT NEST GROWN OUT (docs/DOMAINS.md §2, 10 and 11; the owner, 2026-11-12: "I like the nest. Just make a spot for the volcanic layer to be included in the nest"): rooms of the Nest's one
        //   interior round the queen's cavern (`nest: true`), joined to it and each other by open mouths (`openings`); 3-tile tunnels, nests and side caves; the sloping tunnel down to the volcanic layer's spot.
        { id: "nest_t1", label: "Ant Nest", level: -1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "The tunnel west out of the queen's cavern to the brood chamber; a collapsed stretch in it (a choke) is drilled through by a fire technician.",
          polygon: [[260, 1260], [440, 1260], [440, 1320], [260, 1320]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low"] },
        { id: "nest_brood", label: "Brood Chamber", level: -1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "A nest chamber of eggs and brood holes west of the cavern; the shelf's cliff rises over its north side.",
          polygon: [[20, 1220], [60, 1180], [200, 1180], [220, 1180], [260, 1200], [260, 1340], [220, 1380], [60, 1380], [20, 1360]],
          edge_kinds: ["rock_low", "cliff", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low"] },   // (its north side under the shelf: a cliff a REEF climb goes up)
        { id: "nest_shelf", label: "Shelf", tag: "The Shelf", level: 1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "High ground over the brood chamber's north side, reached by a REEF climb up its cliff (or down from it).",
          polygon: [[0, 1100], [40, 1060], [160, 1060], [200, 1080], [200, 1180], [60, 1180], [20, 1160], [0, 1120]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low", "open", "rock_low", "rock_low", "rock_low"] },   // (its lip over the brood chamber: open, the cliff below it is the brood chamber's)
        { id: "nest_t3", label: "Ant Nest", level: -1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "The tunnel south from the brood chamber to the deep brood: a cracked wall across it, and a hollow beside it where the ants left a flask; the stream's tunnel goes east out of it.",
          polygon: [[110, 1380], [170, 1380], [170, 1560], [210, 1560], [210, 1600], [170, 1600], [170, 1660], [110, 1660]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low"] },
        { id: "nest_t4", label: "Ant Nest", level: -1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "The tunnel east to the stream cave, an underground stream across it (an ice bridge crosses it).",
          polygon: [[170, 1480], [350, 1480], [350, 1540], [170, 1540]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low"] },
        { id: "nest_stream", label: "Stream Cave", level: -1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "A side cave beyond the stream.",
          polygon: [[350, 1480], [390, 1440], [430, 1440], [470, 1460], [470, 1560], [430, 1600], [390, 1600], [350, 1580]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low"] },
        { id: "nest_t6", label: "Ant Nest", level: -1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "The tunnel south out of the queen's cavern to the old burrow; it narrows to two tiles for three (the boulder blocks the middle row), a two-tile hollow beside that row (FLUX MOVE moves the boulder into it).",
          polygon: [[510, 1420], [570, 1420], [570, 1450], [550, 1450], [550, 1470], [590, 1470], [590, 1490], [550, 1490], [550, 1510], [570, 1510], [570, 1540], [510, 1540]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low"] },
        { id: "nest_burrow", label: "The Old Burrow", level: -1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "A side cave south of the queen's cavern, beyond the boulder.",
          polygon: [[480, 1560], [500, 1540], [620, 1540], [660, 1560], [660, 1640], [620, 1680], [520, 1680], [480, 1660]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low"] },
        { id: "nest_deep", label: "The Deep Brood", level: -1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "The big nest chamber at the foot of the main way, eggs and brood holes round it; the larder's tunnel goes east out of it and the way down south-west.",
          polygon: [[20, 1700], [60, 1660], [380, 1660], [420, 1680], [420, 1860], [380, 1900], [20, 1900]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low"] },
        { id: "nest_t7", label: "Ant Nest", level: -1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "The short tunnel east from the deep brood to the larder, sealed with resin (an acid flask's pool eats it).",
          polygon: [[420, 1760], [520, 1760], [520, 1820], [420, 1820]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low"] },
        { id: "nest_larder", label: "The Larder", level: -1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "A side cave behind the resin seal.",
          polygon: [[520, 1720], [540, 1700], [620, 1700], [660, 1720], [660, 1820], [620, 1860], [560, 1860], [520, 1840]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low", "rock_low"] },
        { id: "nest_down", label: "The Way Down", level: -1, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "The sloping tunnel down from the deep brood (no stairs, no fade: docs/DOMAINS.md §2, 5), its upper half.",
          polygon: [[20, 1900], [80, 1900], [80, 2020], [20, 2020]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low"] },
        { id: "nest_down_low", label: "The Way Down", level: -2, status: "placed", wall_material: "solid", interior: true, nest: true,
          note: "The sloping tunnel's lower half, at the volcanic layer's level; it ends where the volcanic layer will begin (its spot kept: docs/DOMAINS.md §2, 11).",
          polygon: [[20, 2020], [80, 2020], [80, 2140], [20, 2140]],
          edge_kinds: ["rock_low", "rock_low", "rock_low", "rock_low"] },
        // THE ELECTRICAL DOMAIN (docs/DOMAINS.md; the owner, 2026-11-11): through the little door beside the Server Room's junction, which opens once the junction is repaired. Two rooms of one interior, drawn
        //   under the Server Room: the DEEP SERVER ROOM (racks standing near the door, toppled and strewn further in: step 2) and, down wide steps at its south side, THE CIRCUITRY, a big open hall (its
        //   circuitry: step 3). Look A, the cold blue server graveyard (chosen 2026-11-11). Empty at first: no creatures (decided). Sizes and names provisional.
        { id: "elec_servers", label: "Deep Server Room", level: -1, status: "placed", wall_material: "solid", interior: true,
          note: "The electrical domain's first room: 24 tiles across and 18 deep, the way back up to the Server Room in an alcove in its north wall (under the little door), wide steps down to the circuitry in the middle of its south side, whose edge is a ledge with a rail (deck_rail).",
          polygon: [[360, 240], [680, 240], [680, 220], [720, 220], [720, 240], [840, 240], [840, 600], [360, 600]],
          edge_kinds: ["wall", "wall", "wall", "wall", "wall", "wall", "deck_rail", "wall"] },
        { id: "elec_circuitry", label: "The Circuitry", level: -2, status: "placed", wall_material: "solid", interior: true,
          note: "The electrical domain's big open hall, 32 tiles across and 23 deep (about the arena's size), below the deep server room: its north edge under the room above is open (the ledge's rail is that room's), the rest wall.",
          polygon: [[280, 600], [360, 600], [840, 600], [920, 600], [920, 1060], [280, 1060]],
          edge_kinds: ["wall", "open", "wall", "wall", "wall", "wall"] },
    ],

    // INTERIORS: rooms that are not beside any other room but under or inside one. The data draws them where they belong (the armory under the Observation Deck); the building pass (js/facilitygrow.js) puts each in a part of
    // the map of its own, `offset` sketch pixels from there (64 tiles east), where nothing else is, and you reach it through a doorway (a PORTAL): walking into the doorway fades to black, loads you in the other room's
    // doorway and fades back (js/facilityportals.js). A room is a unit of the map; an interior is a room you have to go into.
    interiors: [
        { id: "armory", under: "observation_deck", offset: [1280, 0] },
        { id: "cold_storage", under: "experiment_lab", offset: [-1280, 0] },   // (64 tiles WEST: east of the building is the armory's, and a room as big as this one there would be in sight of it on a wide screen;
                                                                                //  out here, beside the crystal chamber's corner of the plan, nothing is within sight of it and the MAP stays as wide as it was)
        { id: "sewers", under: "arena", offset: [-1280, 1280] },               // (64 tiles west and 64 south: the west is the Cold Storage's and the south the nest area's; down here nothing is in sight of it)
        { id: "nest_area", under: "arena", offset: [0, 2240] },                 // THE ANT NEST (112 tiles south since build 2026-11-12a, 96 before: the nest area's part of the map, far enough below the Sewers that neither is in sight of the other, its new caves too)
        { id: "nest_t1", under: "arena", offset: [0, 2240] },   // (the Nest grown out: one interior with it)
        { id: "nest_brood", under: "arena", offset: [0, 2240] },
        { id: "nest_shelf", under: "arena", offset: [0, 2240] },
        { id: "nest_t3", under: "arena", offset: [0, 2240] },
        { id: "nest_t4", under: "arena", offset: [0, 2240] },
        { id: "nest_stream", under: "arena", offset: [0, 2240] },
        { id: "nest_t6", under: "arena", offset: [0, 2240] },
        { id: "nest_burrow", under: "arena", offset: [0, 2240] },
        { id: "nest_deep", under: "arena", offset: [0, 2240] },
        { id: "nest_t7", under: "arena", offset: [0, 2240] },
        { id: "nest_larder", under: "arena", offset: [0, 2240] },
        { id: "nest_down", under: "arena", offset: [0, 2240] },
        { id: "nest_down_low", under: "arena", offset: [0, 2240] },
        { id: "elec_servers", under: "front_lobby", offset: [2560, 0] },        // THE ELECTRICAL DOMAIN (128 tiles east, beyond the Armory's part of the map: nothing is in sight of it); its two rooms share one
        { id: "elec_circuitry", under: "front_lobby", offset: [2560, 0] },      //   offset, so the steps between them are one interior (js/facilitygrow.js carries their door and steps; js/facility.js lets them join)
    ],
    // PORTALS come in pairs. `rect` is the doorway's floor (the alcove's end: stepping into it takes you through), `arrive` a spot of the same room in front of the doorway, where you are put when you come out of the OTHER end,
    // `to` the portal at the other end, `label` what the other end is, shown over the doorway. Each pair also has a connection in `connections` (portal: ...), so the rooms count as joined.
    portals: [
        { id: "portal_arena_armory", room: "arena", rect: [320, 1090, 340, 1130], arrive: [385, 1110], to: "portal_armory_arena", label: "ARMORY", kind: "door",
          note: "The Armory's steel door onto the arena, in an alcove in the west cave wall just south of the two garage doors." },
        { id: "portal_armory_arena", room: "armory", rect: [200, 930, 240, 950], arrive: [220, 985], to: "portal_arena_armory", label: "ARENA", kind: "door",
          note: "The steel door back out to the arena, in an alcove in the armory's north wall." },
        { id: "portal_deck_armory", room: "observation_deck", rect: [160, 870, 180, 910], arrive: [230, 890], to: "portal_armory_deck", label: "ARMORY", kind: "stairs_down",
          note: "The stairs down to the Armory, in an alcove in the deck's west wall." },
        { id: "portal_armory_deck", room: "armory", rect: [290, 930, 330, 950], arrive: [310, 980], to: "portal_deck_armory", label: "OBSERVATION DECK", kind: "stairs_up",
          note: "The stairs back up to the Observation Deck, in an alcove in the armory's north wall." },
        { id: "portal_arena_cold", room: "arena", rect: [580, 740, 680, 760], arrive: [630, 790], to: "portal_cold_arena", label: "COLD STORAGE", kind: "door",
          note: "The Cold Storage's double freezer door, set in boulders in an alcove in the arena's north cave wall, where the generator stood." },
        { id: "portal_cold_arena", room: "cold_storage", rect: [420, 560, 440, 620], arrive: [470, 590], to: "portal_arena_cold", label: "ARENA", kind: "door",
          note: "The freezer door back out to the arena: the entrance, an alcove in the cold storage's west wall at the top." },
        { id: "portal_lab_cold", room: "experiment_lab", rect: [450, 530, 510, 560], arrive: [470, 600], to: "portal_cold_lab", label: "COLD STORAGE", kind: "stairs_down", well: true,
          note: "A STAIRWELL in the Experiment Lab's floor, in its north-west corner just inside the door from the passage (the north bench is three tiles shorter for it): steps going down to the north, to the Cold Storage under the lab, entered from the aisle. Not an alcove: an opening in the floor with a rail round three sides." },
        { id: "portal_cold_lab", room: "cold_storage", rect: [490, 660, 530, 720], arrive: [510, 750], to: "portal_lab_cold", label: "EXPERIMENT LAB", kind: "stairs_up", well: true,
          note: "The stairs up to the Experiment Lab: a flight standing in the floor at the cold storage's west side (the plan's STAIRS)." },
        { id: "portal_arena_sewers", room: "arena", rect: [780, 788, 840, 808], arrive: [810, 840], to: "portal_sewers_arena", label: "SEWERS", kind: "door",
          note: "The sewer culvert: an arched concrete mouth with its grating raised, in an alcove in the arena's north rock behind the north tank." },
        { id: "portal_sewers_arena", room: "sewers", rect: [280, 860, 300, 900], arrive: [330, 880], to: "portal_arena_sewers", label: "ARENA", kind: "door",
          note: "The culvert back up to the arena: an alcove at the west end of the north ledge, beside the outfall where the runoff pours in." },
        // THE DRAIN PIPE UNDER THE RIVER (the owner, 2026-11-07: "Pipe shortcut"): from the sample bank's back wall to the north ledge's, beside the arena culvert. Its ledge end is SHUT (`shut`: a grate that
        //   opens only from inside): nobody goes in there until someone has come out of it; then it stays open, a shortcut both ways (js/facilityportals.js facilityPortalShut; saved: pipes). `within`: a pair inside
        //   one room (js/facility.js facilityValidate lets it join the room to itself).
        { id: "portal_sewer_pipe_in", room: "sewers", rect: [280, 1040, 300, 1080], arrive: [320, 1060], to: "portal_sewer_pipe_out", label: "PIPE", kind: "door", within: true,
          note: "A drain pipe's mouth in the sample bank's west wall (the end wall): it runs under the river and comes out on the north ledge." },
        { id: "portal_sewer_pipe_out", room: "sewers", rect: [300, 840, 340, 860], arrive: [320, 885], to: "portal_sewer_pipe_in", label: "PIPE", kind: "door", within: true, shut: true,
          note: "The drain pipe's other end, in the north ledge's wall beside the arena culvert: its grate opens only from inside." },
        // THE ANT NEST (docs/NEST.md): the way in is the HOLE drilled through the arena's south rubble. `rubble`: the doorway is shut until that rubble is drilled through (js/facilityportals.js facilityPortalShut), and the
        //   rubble draws it (the hole); `rect` is the floor in front of the hole, the last row of floor under the rock. Drilled rubble stays drilled (saved), so the way stays open.
        { id: "portal_arena_nest", room: "arena", rect: [570, 1110, 610, 1130], arrive: [590, 1080], to: "portal_nest_arena", label: "ANT NEST", kind: "stairs_down", rubble: "rubble_arena_south",
          note: "The hole a fire technician drills through the arena's south rubble: a tunnel down to the Ant Nest. Shut until the rubble is drilled through." },
        { id: "portal_nest_arena", room: "nest_area", rect: [570, 1160, 610, 1180], arrive: [590, 1210], to: "portal_arena_nest", label: "ARENA", kind: "stairs_up",
          note: "The tunnel mouth back up to the arena, in an alcove in the Ant Nest's north wall." },
        // THE ELECTRICAL DOMAIN (docs/DOMAINS.md): `needs: "junction"`: the doorway is shut until the main power junction beside it is repaired (js/facilityportals.js facilityPortalShut).
        { id: "portal_lobby_elec", room: "front_lobby", rect: [680, 202, 720, 222], arrive: [700, 238], to: "portal_elec_lobby", label: "ELECTRICAL DOMAIN", kind: "stairs_down", needs: "junction",
          note: "The little door down to the electrical domain, in an alcove in the Server Room's north wall beside the junction. Shut until the junction is repaired." },
        { id: "portal_elec_lobby", room: "elec_servers", rect: [680, 220, 720, 240], arrive: [700, 262], to: "portal_lobby_elec", label: "SERVER ROOM", kind: "stairs_up",
          note: "The stairs back up to the Server Room, in an alcove in the deep server room's north wall." },
    ],

    // Solid things standing in a room. Collision is on for all of them; the arena's two circular structures are giant reserves of ooze or liquid (solid tanks).
    props: [
        { id: "lab_tank", room: "experiment_lab", shape: "circle", at: [715, 575], radius: 25, status: "approximate", kind: "tank" },

        // ── THE SERVER ROOM (the owner, 2026-11-07: "make that a server room, a dark server room"; it was the Front Lobby's computer lab): four rows of racks across the floor, racks down the west wall and in the
        //    north-east corner, the monitoring console on the south wall between the two doors, and THE MAIN POWER JUNCTION in the north-east corner, the tutorial's one repair (js/tutorial.js, js/stations.js
        //    STATION_KINDS.junction). The aisles keep the supply case, the three fuel-cell cases and the fire brawler's egg where they were; the doors (two south, one east) stay clear. The room stays dim with the
        //    power on (js/facilitystyle.js FP_ROOM_DIM) and its racks' lights blink (js/propsprites.js).
        { id: "racks_west", room: "front_lobby", shape: "rect", rect: [380, 262, 410, 378], status: "placed", kind: "server_rack", note: "Server racks down the west wall." },
        { id: "racks_east", room: "front_lobby", shape: "rect", rect: [794, 222, 824, 296], status: "placed", kind: "server_rack", note: "Server racks in the north-east corner (the security room door below them stays clear)." },
        { id: "srv_row_1", room: "front_lobby", shape: "rect", rect: [480, 242, 500, 342], status: "placed", kind: "server_rack", note: "A row of five racks across the floor." },
        { id: "srv_row_2", room: "front_lobby", shape: "rect", rect: [540, 242, 560, 342], status: "placed", kind: "server_rack" },
        { id: "srv_row_3", room: "front_lobby", shape: "rect", rect: [600, 242, 620, 342], status: "placed", kind: "server_rack" },
        { id: "srv_row_4", room: "front_lobby", shape: "rect", rect: [660, 242, 680, 342], status: "placed", kind: "server_rack" },
        { id: "srv_console", room: "front_lobby", shape: "rect", rect: [570, 390, 630, 410], status: "placed", kind: "console", note: "The monitoring console on the south wall, facing the racks." },
        { id: "junction", room: "front_lobby", shape: "rect", rect: [720, 222, 760, 262], status: "placed", kind: "junction", note: "THE MAIN POWER JUNCTION: broken at the start, its module slot empty. The tutorial's one repair puts the power module in it, and every relay in the facility comes on." },

        // ── THE SCIENCE LAB (the Experiment Lab): benches along the north and south walls, a fume hood, glass test chambers beside the big tank. A two-and-a-half tile aisle runs between the benches
        //    from the passage door to the tank.
        { id: "lab_bench_north", room: "experiment_lab", shape: "rect", rect: [510, 530, 610, 560], status: "placed", kind: "lab_bench", note: "A long bench: microscope, glassware, sample racks. Five tiles: its west end gave way to the Cold Storage's stairwell." },
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

        // ── THE DRESSING: furniture and clutter that fill the rooms out (solid pieces: they are collision like the rest; each stands clear of the doors, the aisles and the stairs). Drawn by js/facilitydecor.js.
        { id: "generator_1", room: "crystal_chamber", shape: "rect", rect: [190, 290, 210, 330], status: "placed", kind: "generator" },
        { id: "crate_stack_1", room: "crystal_chamber", shape: "rect", rect: [190, 450, 210, 470], status: "placed", kind: "crate_stack" },
        { id: "crate_1", room: "crystal_chamber", shape: "rect", rect: [190, 430, 210, 450], status: "placed", kind: "crate" },
        { id: "crate_2", room: "crystal_chamber", shape: "rect", rect: [210, 450, 230, 470], status: "placed", kind: "crate" },
        { id: "barrel_1", room: "crystal_chamber", shape: "rect", rect: [190, 470, 210, 490], status: "placed", kind: "barrel" },
        { id: "barrel_2", room: "crystal_chamber", shape: "rect", rect: [190, 490, 210, 510], status: "placed", kind: "barrel" },
        { id: "console_1", room: "crystal_chamber", shape: "rect", rect: [190, 350, 210, 410], status: "placed", kind: "console" },
        { id: "plant_1", room: "crystal_chamber", shape: "rect", rect: [350, 390, 370, 410], status: "placed", kind: "plant" },
        { id: "vending_1", room: "teleport_room_1", shape: "rect", rect: [190, 510, 210, 530], status: "placed", kind: "vending" },
        { id: "vending_2", room: "teleport_room_1", shape: "rect", rect: [190, 530, 210, 550], status: "placed", kind: "vending" },
        { id: "cooler_1", room: "teleport_room_1", shape: "rect", rect: [210, 530, 230, 550], status: "placed", kind: "cooler" },
        { id: "teleporter_1", room: "teleport_room_1", shape: "rect", rect: [190, 590, 210, 610], status: "placed", kind: "teleporter" },
        { id: "teleporter_2", room: "teleport_room_1", shape: "rect", rect: [190, 690, 210, 710], status: "placed", kind: "teleporter" },
        { id: "teleporter_3", room: "teleport_room_1", shape: "rect", rect: [290, 690, 310, 710], status: "placed", kind: "teleporter" },
        { id: "teleporter_4", room: "teleport_room_1", shape: "rect", rect: [290, 630, 310, 650], status: "placed", kind: "teleporter" },
        { id: "console_2", room: "teleport_room_1", shape: "rect", rect: [290, 510, 350, 530], status: "placed", kind: "console" },
        { id: "sec_desk", room: "security_room", shape: "rect", rect: [830, 270, 910, 290], status: "placed", kind: "computer_desk", note: "The console desk along the north wall, under the bank of monitors." },
        { id: "sec_locker", room: "security_room", shape: "rect", rect: [910, 270, 930, 290], status: "placed", kind: "locker" },
        { id: "sec_drawers_1", room: "security_room", shape: "rect", rect: [830, 350, 850, 370], status: "placed", kind: "cabinet", note: "A run of filing cabinets (three drawers each) along the west wall, under the monitors." },
        { id: "sec_drawers_2", room: "security_room", shape: "rect", rect: [830, 370, 850, 390], status: "placed", kind: "cabinet" },
        { id: "sec_drawers_3", room: "security_room", shape: "rect", rect: [830, 390, 850, 410], status: "placed", kind: "cabinet" },
        { id: "sec_chair", room: "security_room", shape: "rect", rect: [870, 290, 890, 310], status: "placed", kind: "chair" },
        { id: "sec_cooler", room: "security_room", shape: "rect", rect: [910, 370, 930, 390], status: "placed", kind: "cooler" },
        { id: "sec_bin", room: "security_room", shape: "rect", rect: [910, 390, 930, 410], status: "placed", kind: "bin" },
        { id: "plant_8", room: "lab_hallway", shape: "rect", rect: [470, 410, 490, 430], status: "placed", kind: "plant" },
        { id: "plant_9", room: "lab_hallway", shape: "rect", rect: [710, 410, 730, 430], status: "placed", kind: "plant" },
        { id: "cooler_3", room: "lab_hallway", shape: "rect", rect: [530, 410, 550, 430], status: "placed", kind: "cooler" },
        { id: "vending_5", room: "lab_hallway", shape: "rect", rect: [570, 410, 610, 430], status: "placed", kind: "vending" },
        { id: "bin_3", room: "lab_hallway", shape: "rect", rect: [670, 410, 690, 430], status: "placed", kind: "bin" },
        { id: "locker_1", room: "lab_hallway", shape: "rect", rect: [490, 750, 570, 770], status: "placed", kind: "locker" },   // (west of the notch behind the Cold Storage alcove, where it stood)
        { id: "crate_stack_2", room: "lab_hallway", shape: "rect", rect: [710, 750, 730, 770], status: "placed", kind: "crate_stack" },
        { id: "barrel_3", room: "lab_hallway", shape: "rect", rect: [750, 750, 770, 770], status: "placed", kind: "barrel" },
        { id: "barrel_4", room: "lab_hallway", shape: "rect", rect: [770, 750, 790, 770], status: "placed", kind: "barrel" },
        { id: "plant_10", room: "lab_hallway", shape: "rect", rect: [310, 630, 330, 650], status: "placed", kind: "plant" },
        { id: "cabinet_1", room: "experiment_lab", shape: "rect", rect: [430, 530, 450, 570], status: "placed", kind: "cabinet" },
        { id: "cart_2", room: "experiment_lab", shape: "rect", rect: [710, 590, 730, 610], status: "placed", kind: "cart" },
        { id: "console_3", room: "teleport_room_2", shape: "rect", rect: [990, 610, 1070, 630], status: "placed", kind: "console" },
        { id: "teleporter_5", room: "teleport_room_2", shape: "rect", rect: [1070, 650, 1090, 670], status: "placed", kind: "teleporter" },
        { id: "teleporter_6", room: "teleport_room_2", shape: "rect", rect: [990, 750, 1010, 770], status: "placed", kind: "teleporter" },
        { id: "teleporter_7", room: "teleport_room_2", shape: "rect", rect: [1050, 750, 1070, 770], status: "placed", kind: "teleporter" },
        { id: "teleporter_8", room: "teleport_room_2", shape: "rect", rect: [1070, 710, 1090, 730], status: "placed", kind: "teleporter" },
        { id: "crate_3", room: "teleport_room_2", shape: "rect", rect: [1070, 770, 1090, 790], status: "placed", kind: "crate" },
        { id: "couch_2", room: "observation_deck", shape: "rect", rect: [210, 910, 270, 930], status: "placed", kind: "couch" },
        { id: "beanbag_4", room: "observation_deck", shape: "rect", rect: [290, 850, 310, 870], status: "placed", kind: "beanbag" },
        { id: "telescope_1", room: "observation_deck", shape: "rect", rect: [330, 850, 350, 870], status: "placed", kind: "telescope" },
        { id: "telescope_2", room: "observation_deck", shape: "rect", rect: [330, 930, 350, 950], status: "placed", kind: "telescope" },
        { id: "plant_11", room: "observation_deck", shape: "rect", rect: [190, 810, 210, 830], status: "placed", kind: "plant" },
        { id: "plant_12", room: "observation_deck", shape: "rect", rect: [330, 810, 350, 830], status: "placed", kind: "plant" },
        { id: "plant_13", room: "observation_deck", shape: "rect", rect: [190, 790, 210, 810], status: "placed", kind: "plant" },
        { id: "cooler_4", room: "observation_deck", shape: "rect", rect: [190, 930, 210, 950], status: "placed", kind: "cooler" },
        // THE FLUX TECHNICIAN'S OBJECTS (FLUX MOVE, js/fluxmove.js; docs/FLUX-MOVEMENT.md): `flux` marks a prop the tool can move: `range` tiles a move (the owner: 2, diagonals counting as one), `turn` when it can be
        // turned (a two-tile object with art for both ways round). The arena's loose crates, barrels and barriers (the owner, 2026-11-06: "Test room + arena"); nothing else moves.
        { id: "floodlight_1", room: "arena", shape: "rect", rect: [530, 810, 550, 830], status: "placed", kind: "floodlight" },
        { id: "floodlight_2", room: "arena", shape: "rect", rect: [910, 810, 930, 830], status: "placed", kind: "floodlight" },
        { id: "floodlight_3", room: "arena", shape: "rect", rect: [910, 1150, 930, 1170], status: "placed", kind: "floodlight" },
        { id: "floodlight_4", room: "arena", shape: "rect", rect: [530, 1150, 550, 1170], status: "placed", kind: "floodlight" },
        { id: "barrier_1", room: "arena", shape: "rect", rect: [590, 910, 630, 930], status: "placed", kind: "barrier", flux: { range: 2, turn: true } },
        { id: "barrier_2", room: "arena", shape: "rect", rect: [670, 1050, 710, 1070], status: "placed", kind: "barrier", flux: { range: 2, turn: true } },
        { id: "barrel_5", room: "arena", shape: "rect", rect: [970, 830, 990, 850], status: "placed", kind: "barrel", flux: { range: 2 } },
        { id: "barrel_6", room: "arena", shape: "rect", rect: [970, 850, 990, 870], status: "placed", kind: "barrel", flux: { range: 2 } },
        { id: "barrel_7", room: "arena", shape: "rect", rect: [950, 850, 970, 870], status: "placed", kind: "barrel", flux: { range: 2 } },
        { id: "crate_4", room: "arena", shape: "rect", rect: [950, 1110, 970, 1130], status: "placed", kind: "crate", flux: { range: 2 } },
        { id: "crate_5", room: "arena", shape: "rect", rect: [970, 1110, 990, 1130], status: "placed", kind: "crate", flux: { range: 2 } },
        { id: "crate_6", room: "arena", shape: "rect", rect: [970, 1130, 990, 1150], status: "placed", kind: "crate", flux: { range: 2 } },
        { id: "crate_stack_3", room: "arena", shape: "rect", rect: [970, 970, 990, 990], status: "placed", kind: "crate_stack", flux: { range: 2 } },
        // THE HAZARD CONTAINERS (build 2026-11-09yy; the owner, 2026-11-10: "two explosive ones in the arena"; js/hazards.js): flasks in hex armour that FLUX MOVE carries like a crate; a shot sets one off
        { id: "hazard_x1", room: "arena", shape: "rect", rect: [690, 910, 710, 930], status: "placed", kind: "hazard_explosive", flux: { range: 2 }, note: "An explosive flask on the open floor between the north barrier and the north reserve." },
        { id: "hazard_x2", room: "arena", shape: "rect", rect: [750, 1050, 770, 1070], status: "placed", kind: "hazard_explosive", flux: { range: 2 }, note: "An explosive flask on the open floor between the south barrier and the south reserve." },
        { id: "console_4", room: "catwalks", shape: "rect", rect: [1030, 810, 1090, 830], status: "placed", kind: "console" },
        { id: "chair_1", room: "catwalks", shape: "rect", rect: [1050, 830, 1070, 850], status: "placed", kind: "chair" },
        { id: "toolbox_1", room: "catwalks", shape: "rect", rect: [1090, 810, 1110, 830], status: "placed", kind: "toolbox" },
        { id: "speaker_1", room: "catwalks", shape: "rect", rect: [1090, 850, 1110, 870], status: "placed", kind: "speaker" },
        { id: "speaker_2", room: "catwalks", shape: "rect", rect: [1090, 970, 1110, 990], status: "placed", kind: "speaker" },
        { id: "speaker_3", room: "catwalks", shape: "rect", rect: [1090, 1090, 1110, 1110], status: "placed", kind: "speaker" },
        { id: "floodlight_5", room: "catwalks", shape: "rect", rect: [1090, 890, 1110, 910], status: "placed", kind: "floodlight" },
        { id: "floodlight_6", room: "catwalks", shape: "rect", rect: [1090, 1010, 1110, 1030], status: "placed", kind: "floodlight" },
        { id: "floodlight_7", room: "catwalks", shape: "rect", rect: [1090, 1130, 1110, 1150], status: "placed", kind: "floodlight" },
        { id: "spool_1", room: "catwalks", shape: "rect", rect: [1090, 930, 1110, 950], status: "placed", kind: "spool" },
        { id: "barrel_8", room: "catwalks", shape: "rect", rect: [1090, 1050, 1110, 1070], status: "placed", kind: "barrel" },
        { id: "generator_2", room: "catwalks", shape: "rect", rect: [1090, 1170, 1110, 1190], status: "placed", kind: "generator" },
        { id: "crate_7", room: "catwalks", shape: "rect", rect: [1070, 1170, 1090, 1190], status: "placed", kind: "crate" },
        { id: "barrel_9", room: "catwalks", shape: "rect", rect: [1070, 1150, 1090, 1170], status: "placed", kind: "barrel" },
        // ── FLOODLIGHTS along the hallway and across the arena (the tutorial blackout's emergency lights stay on: js/facilitytutorial.js). Placed where they leave every path open, a tile or two off the walls, clear of the doors and the steps ──
        { id: "floodlight_hall_1", room: "lab_hallway", shape: "rect", rect: [830, 570, 850, 590], status: "placed", kind: "floodlight" },
        { id: "floodlight_hall_2", room: "lab_hallway", shape: "rect", rect: [490, 670, 510, 690], status: "placed", kind: "floodlight" },
        { id: "floodlight_hall_3", room: "lab_hallway", shape: "rect", rect: [470, 490, 490, 510], status: "placed", kind: "floodlight" },
        { id: "floodlight_hall_4", room: "lab_hallway", shape: "rect", rect: [690, 490, 710, 510], status: "placed", kind: "floodlight" },
        { id: "floodlight_hall_5", room: "lab_hallway", shape: "rect", rect: [710, 670, 730, 690], status: "placed", kind: "floodlight" },
        { id: "floodlight_hall_6", room: "lab_hallway", shape: "rect", rect: [350, 650, 370, 670], status: "placed", kind: "floodlight" },
        { id: "floodlight_hall_7", room: "lab_hallway", shape: "rect", rect: [830, 430, 850, 450], status: "placed", kind: "floodlight" },
        { id: "floodlight_hall_8", room: "lab_hallway", shape: "rect", rect: [810, 730, 830, 750], status: "placed", kind: "floodlight" },
        { id: "floodlight_arena_1", room: "arena", shape: "rect", rect: [690, 1090, 710, 1110], status: "placed", kind: "floodlight" },
        { id: "floodlight_arena_2", room: "arena", shape: "rect", rect: [650, 850, 670, 870], status: "placed", kind: "floodlight" },
        { id: "floodlight_arena_3", room: "arena", shape: "rect", rect: [370, 970, 390, 990], status: "placed", kind: "floodlight" },
        { id: "floodlight_arena_4", room: "arena", shape: "rect", rect: [970, 1010, 990, 1030], status: "placed", kind: "floodlight" },
        { id: "floodlight_arena_5", room: "arena", shape: "rect", rect: [370, 870, 390, 890], status: "placed", kind: "floodlight" },
        // ── THE ELECTRICAL NETWORK (docs/TUTORIAL.md, phase 5): the sentries and the charging station. (The relays are small nodes on the walls since build 2026-11-07qq: decor `relay_node`, below.) ──
        { id: "mech_bay", room: "show_room", shape: "rect", rect: [970, 390, 1010, 430], status: "placed", kind: "mech_bay", note: "The mech bay: a build pad in the warehouse where the Technomancer assembles the four-legged spider mech." },
        // ── THE WAREHOUSE (the owner, 2026-11-07: "convert that into a little warehouse"; it was the show room): pallet racks along the walls and down the middle, crate stacks, barrels, a cart and a run of lockers.
        //    The mech bay, the supply case, the mech core's case and the ice mage's egg keep their places; the door onto the hallway stays clear.
        { id: "rack_w1", room: "show_room", shape: "rect", rect: [930, 330, 950, 390], status: "placed", kind: "pallet_rack", note: "Pallet racks along the west wall (the Security Room side)." },
        { id: "rack_n1", room: "show_room", shape: "rect", rect: [950, 275, 1010, 295], status: "placed", kind: "pallet_rack" },
        { id: "rack_m1", room: "show_room", shape: "rect", rect: [1030, 360, 1050, 440], status: "placed", kind: "pallet_rack" },
        { id: "rack_e1", room: "show_room", shape: "rect", rect: [1070, 340, 1090, 440], status: "placed", kind: "pallet_rack" },
        { id: "rack_e2", room: "show_room", shape: "rect", rect: [1070, 460, 1090, 540], status: "placed", kind: "pallet_rack" },
        { id: "wh_crate_1", room: "show_room", shape: "rect", rect: [1070, 275, 1090, 295], status: "placed", kind: "crate" },
        { id: "wh_cart", room: "show_room", shape: "rect", rect: [990, 470, 1030, 490], status: "placed", kind: "cart" },
        { id: "wh_stack_1", room: "show_room", shape: "rect", rect: [1030, 470, 1050, 490], status: "placed", kind: "crate_stack" },
        { id: "wh_stack_2", room: "show_room", shape: "rect", rect: [950, 570, 970, 590], status: "placed", kind: "crate_stack" },
        { id: "wh_lockers", room: "show_room", shape: "rect", rect: [970, 580, 1050, 600], status: "placed", kind: "locker" },
        { id: "wh_barrel_1", room: "show_room", shape: "rect", rect: [1050, 580, 1070, 600], status: "placed", kind: "barrel" },
        { id: "wh_barrel_2", room: "show_room", shape: "rect", rect: [1070, 560, 1090, 580], status: "placed", kind: "barrel" },
        { id: "sentry_chamber_1", room: "crystal_chamber", shape: "rect", rect: [330, 430, 350, 450], status: "placed", kind: "sentry", note: "An automatic sentry guarding the chamber's door." },
        // (sentry_chamber_2, by the chamber's south wall, is gone: the owner, 2026-11-10, "I don't like how there's two inside of the crystal room. So maybe we can make one of those disappear"; build 2026-11-09ww)
        { id: "sentry_hall", room: "lab_hallway", shape: "rect", rect: [750, 490, 770, 510], status: "placed", kind: "sentry", note: "A sentry on the hallway's north-east corner." },
        { id: "charger_hall", room: "lab_hallway", shape: "rect", rect: [390, 630, 410, 650], status: "placed", kind: "charger", note: "A charging station: it refills your ammunition once the hallway has power." },
        // ── THE ARMORY (x 190-350, y 950-1150): a terminal and a workbench in the middle, crates in the corners, lockers and barrels along the south wall; the door's landing (x 310-350, y 1070-1110) stays clear ──
        { id: "armory_terminal", room: "armory", shape: "rect", rect: [190, 1030, 210, 1070], status: "placed", kind: "computer_desk", note: "The inventory terminal." },
        { id: "armory_bench", room: "armory", shape: "rect", rect: [230, 1030, 290, 1050], status: "placed", kind: "desk", note: "The workbench." },
        { id: "armory_toolbox", room: "armory", shape: "rect", rect: [270, 1050, 290, 1070], status: "placed", kind: "toolbox" },
        { id: "armory_cart", room: "armory", shape: "rect", rect: [250, 1090, 290, 1110], status: "placed", kind: "cart" },
        { id: "armory_crate_1", room: "armory", shape: "rect", rect: [320, 1000, 340, 1020], status: "placed", kind: "crate" },
        { id: "armory_crate_2", room: "armory", shape: "rect", rect: [300, 1000, 320, 1020], status: "placed", kind: "crate" },
        { id: "armory_crate_3", room: "armory", shape: "rect", rect: [320, 1020, 340, 1040], status: "placed", kind: "crate" },
        { id: "armory_crate_4", room: "armory", shape: "rect", rect: [300, 1020, 320, 1040], status: "placed", kind: "crate" },
        { id: "armory_crate_5", room: "armory", shape: "rect", rect: [320, 1040, 340, 1060], status: "placed", kind: "crate" },
        { id: "armory_barrel_1", room: "armory", shape: "rect", rect: [320, 1100, 340, 1120], status: "placed", kind: "barrel" },
        { id: "armory_barrel_2", room: "armory", shape: "rect", rect: [320, 1120, 340, 1140], status: "placed", kind: "barrel" },
        { id: "armory_locker_a", room: "armory", shape: "rect", rect: [190, 1130, 210, 1150], status: "placed", kind: "locker" },
        { id: "armory_locker_b", room: "armory", shape: "rect", rect: [210, 1130, 230, 1150], status: "placed", kind: "locker" },
        { id: "armory_locker_c", room: "armory", shape: "rect", rect: [230, 1130, 250, 1150], status: "placed", kind: "locker" },
        { id: "armory_locker_d", room: "armory", shape: "rect", rect: [250, 1130, 270, 1150], status: "placed", kind: "locker" },

        // ── THE COLD STORAGE (from the user's floor plan): the freezer bank along the north wall (five doors on its front), and two storage racks toppled over in the middle, lying at an angle against each other
        //    (a `poly` prop: its outline as drawn, not a box). The stairs up stand in the floor at the west side, between the bank and the racks (a portal, above).
        { id: "cold_freezers", room: "cold_storage", shape: "rect", rect: [480, 540, 680, 600], status: "placed", kind: "freezer_bank", note: "A bank of walk-in freezers along the north wall: five frosted doors on its front. Solid." },
        { id: "cold_rack_1", room: "cold_storage", shape: "poly", poly: [[557.4, 647.8], [584.4, 655.0], [562.6, 736.2], [535.6, 729.0]], status: "placed", kind: "toppled_rack", note: "A tall storage rack toppled over on its back, lying at an angle; its spilled boxes beside it." },
        { id: "cold_rack_2", room: "cold_storage", shape: "poly", poly: [[585.8, 640.0], [610.9, 646.7], [590.2, 724.0], [565.1, 717.3]], status: "placed", kind: "toppled_rack", note: "A second rack toppled over beside the first, against it." },

        // ── THE SEWERS: the DEEP RIVER between the two ledges (kind `river`: nothing walks in it; it draws itself, sunk below the ledges and flowing east, js/facilitysewers.js), in three lengths with two bridges between
        //    (THE RIVER NARROWED, 2026-11-07, the owner: "make the sewer river 3 tiles wide": it was 6, y 900 to 1020; the north ledge took the 3 tiles, so it is 5 deep now, the bridges and the outfall shortened to it.)
        //    them: the steel bridge (x 460 to 500) and the service bridge by the Nest (x 980 to 1020, 2026-11-01), where the floor is the bridge's grating (decor `bridge_deck`). It runs on into the NEST's RESERVOIR, the
        //    water the trash dam holds back (kind `pool`, a rectangle), and round the dam in the MOAT (an L of `pool`), which spills over the Nest's east edge: the WATERFALL. The GATES (kind `gate`, the boss's
        //    `boss_gate`): barred grilles across the side passages' mouths and the south ledge's way into the Nest, thin, on the line of the wall they close.
        // (the owner, 2026-11-07: "Just make that side of the bank bigger. I don't care if you move the river over": the whole river moved two tiles north, y 920 to 980; the north ledge is 3 deep, the south
        //  ledge 5, so the front wall hides less of it and of the sample bank)
        { id: "sewer_river_w", room: "sewers", shape: "poly", poly: [[300, 920], [460, 920], [460, 980], [300, 980]], status: "placed", kind: "river", note: "The deep river from the outfall at its head to the bridge. Not walkable." },
        { id: "sewer_river_e", room: "sewers", shape: "poly", poly: [[500, 920], [980, 920], [980, 980], [500, 980]], status: "placed", kind: "river", note: "The deep river from the bridge, under the broken bridge, to the service bridge. Not walkable." },
        { id: "sewer_river_mouth", room: "sewers", shape: "poly", poly: [[1020, 920], [1060, 920], [1060, 980], [1020, 980]], status: "placed", kind: "river", note: "The river's last length, from the service bridge into the Nest's reservoir. Not walkable." },
        { id: "nest_reservoir", room: "sewers", shape: "poly", poly: [[1060, 800], [1140, 800], [1140, 1020], [1060, 1020]], status: "placed", kind: "pool", note: "THE NEST'S RESERVOIR: the river and the stream from the big barred arch backed up behind the trash dam, west of it. Not walkable." },
        { id: "nest_moat", room: "sewers", shape: "poly", poly: [[1060, 1080], [1320, 1080], [1320, 860], [1360, 860], [1360, 1120], [1060, 1120]], status: "placed", kind: "pool", note: "THE MOAT round the dam's south and east sides, from under the causeway to the Nest's east edge, where it spills over: the waterfall. Not walkable." },
        { id: "sewer_gate_n1", room: "sewers", shape: "poly", poly: [[360, 856], [400, 856], [400, 864], [360, 864]], status: "placed", kind: "gate", note: "A barred gate across the first side passage off the north ledge: shut (an area for later)." },
        { id: "sewer_gate_n2", room: "sewers", shape: "poly", poly: [[600, 856], [700, 856], [700, 864], [600, 864]], status: "placed", kind: "gate", note: "A barred gate, five tiles wide, across SIDE QUEST'S MAINTENANCE PLATFORM off the north ledge (2026-11-01: he was in the south passage, behind walls the camera hides): its back wall faces you, so the platform is seen through the bars from the ledges and the bridge. Opened when he appears (js/sidequest.js)." },
        { id: "sewer_gate_s1", room: "sewers", shape: "poly", poly: [[600, 1076], [640, 1076], [640, 1084], [600, 1084]], status: "placed", kind: "gate", note: "A barred gate across the side passage off the south ledge: shut (an area for later)." },
        // THE CHOKE: the collapsed tunnel's whole mouth (x 820 to 940), filled with fallen concrete and rock (kind `rubble`: a thin solid across the mouth, like a gate; the rubble entry below is what a fire technician drills, from the
        //   LEDGE: the sample puzzle, docs/SEWER-QUEST.md). It lies a hair inside the mouth's line (y 852 to 858, not 856 to 864: the drill's work spot is on the ledge, and a spot half a tile in front of the pile must be clear
        //   floor for the rubble to be seen from it, js/facility.js). Drilled through it is OPEN for good (js/facilityplay.js facilitySolidOpen) and the tunnel is walked into.
        { id: "sewer_choke", room: "sewers", shape: "poly", poly: [[820, 852], [940, 852], [940, 858], [820, 858]], status: "placed", kind: "rubble", note: "The collapsed tunnel's mouth, choked along its whole width with broken concrete and rock: the way in on foot, once a fire technician has drilled it through from the ledge." },
        // THE PURIFIER MOUNT: a console on the trash dam, at the reservoir's edge below the big barred arch where the water comes in, where the purification module is installed (a station, js/quests.js; the
        // boss encounter's pressure, js/bosses.js: the queen's post is beside it)
        // THE ANT NEST GROWN OUT (docs/DOMAINS.md §2, 10; build 2026-11-12a): its ways through and its chests. Polys are slivers across a tunnel (they block a step across them, like the Sewers' choke);
        //   rects are whole tiles (a tile is [20k - 10, 20k + 10] sketch px).
        { id: "nest_choke", room: "nest_t1", shape: "poly", poly: [[337, 1260], [343, 1260], [343, 1320], [337, 1320]], status: "placed", kind: "rubble", note: "① THE COLLAPSED TUNNEL in the tunnel west of the queen's cavern: a fire technician's THERMITE DRILL opens it (rubble_nest_choke), from the cavern's side." },
        { id: "nest_cracked", room: "nest_t3", shape: "poly", poly: [[100, 1617], [160, 1617], [160, 1623], [100, 1623]], status: "placed", kind: "cracked_wall", note: "② A CRACKED WALL across the tunnel south to the deep brood: an explosive flask's blast within its reach breaks it, for good (js/hazards.js; saved)." },
        { id: "hazard_x3", room: "nest_t3", shape: "rect", rect: [170, 1590, 190, 1610], status: "placed", kind: "hazard_explosive", flux: { range: 2 }, note: "THE FLASK THE ANTS DRAGGED DOWN, in a hollow beside the cracked wall: shoot it and its blast breaks the wall (stand back: it hurts everyone within 2 tiles)." },
        { id: "nest_stream_water", room: "nest_t4", shape: "poly", poly: [[220, 1480], [280, 1480], [280, 1540], [220, 1540]], status: "placed", kind: "pool", note: "THE UNDERGROUND STREAM across the tunnel to the stream cave: three tiles of water an ice technician's ICE BRIDGE crosses." },
        { id: "nest_boulder", room: "nest_t6", shape: "rect", rect: [510, 1470, 550, 1490], status: "placed", kind: "boulder", flux: { range: 2 }, note: "A BOULDER filling the tunnel's narrow middle row south of the queen's cavern: FLUX MOVE it two tiles east into the hollow beside it, and the way to the old burrow is open (it cannot go back: FLUX MOVE never shuts a way)." },
        { id: "hazard_c2", room: "nest_t7", shape: "rect", rect: [450, 1790, 470, 1810], status: "placed", kind: "hazard_corrosive", flux: { range: 2 }, note: "AN ACID FLASK right in front of the resin seal: shoot it and its pool eats the seal away (the owner approved it with the Nest's layout, 2026-11-12; the idea was the agent's)." },
        { id: "nest_resin_seal", room: "nest_t7", shape: "poly", poly: [[461, 1760], [467, 1760], [467, 1820], [461, 1820]], status: "placed", kind: "resin_seal", note: "A RESIN SEAL across the tunnel to the larder: an acid pool that touches it eats it away, for good (js/hazards.js; saved)." },
        { id: "chest_nest_a", room: "nest_shelf", shape: "rect", rect: [70, 1110, 90, 1130], status: "placed", kind: "chest", note: "A CHEST on the shelf (A: a REEF climb up its cliff)." },
        { id: "chest_nest_b", room: "nest_stream", shape: "rect", rect: [410, 1510, 430, 1530], status: "placed", kind: "chest", note: "A CHEST in the stream cave (B: an ice bridge over the stream)." },
        { id: "chest_nest_c", room: "nest_burrow", shape: "rect", rect: [570, 1610, 590, 1630], status: "placed", kind: "chest", note: "A CHEST in the old burrow (C: FLUX MOVE the boulder)." },
        { id: "chest_nest_d", room: "nest_larder", shape: "rect", rect: [590, 1770, 610, 1790], status: "placed", kind: "chest", note: "A CHEST in the larder (D: the acid flask eats the resin seal)." },
        { id: "elec_rack_1", room: "elec_servers", shape: "rect", rect: [400, 280, 420, 380], status: "placed", kind: "server_rack", note: "THE ELECTRICAL DOMAIN's racks still standing, in rows near the door (docs/DOMAINS.md); the ones further in lie toppled (step 2)." },
        { id: "elec_rack_2", room: "elec_servers", shape: "rect", rect: [460, 280, 480, 380], status: "placed", kind: "server_rack" },
        { id: "elec_rack_3", room: "elec_servers", shape: "rect", rect: [520, 280, 540, 380], status: "placed", kind: "server_rack" },
        { id: "elec_rack_4", room: "elec_servers", shape: "rect", rect: [580, 280, 600, 380], status: "placed", kind: "server_rack" },
        { id: "elec_rack_5", room: "elec_servers", shape: "rect", rect: [760, 280, 780, 380], status: "placed", kind: "server_rack" },
        { id: "elec_rack_6", room: "elec_servers", shape: "rect", rect: [800, 280, 820, 380], status: "placed", kind: "server_rack" },
        { id: "purifier_mount", room: "sewers", shape: "rect", rect: [1150, 830, 1190, 850], status: "placed", kind: "console", note: "The Nest's control console, on the dam at the head of the reservoir, below the big barred arch: the purification module mounts here (the PURIFIER MOUNT station)." },
        // SEWER MACHINERY the Flux Technician can move (Milestone Four, docs/NEXT-PHASE-ROADMAP.md §5.3; the owner, 2026-11-07: "Sewer machinery" first): pump housings on the dam, low cover that stops shots, turned and moved by FLUX MOVE
        { id: "sewer_pump_1", room: "sewers", shape: "rect", rect: [1220, 1000, 1260, 1020], status: "placed", kind: "pump", flux: { range: 2, turn: true }, note: "A pump housing at the south end of the dam, well clear of the Queen's post: move it to make cover." },
        { id: "sewer_pump_2", room: "sewers", shape: "rect", rect: [1180, 1000, 1200, 1040], status: "placed", kind: "pump", flux: { range: 2, turn: true }, note: "A second pump housing, turned the other way, further south on the dam." },
        { id: "sewer_valve_1", room: "sewers", shape: "rect", rect: [1240, 980, 1260, 1000], status: "placed", kind: "valve", flux: { range: 2 }, note: "A valve housing beside the first pump (the owner, 2026-11-07: \"add valves\")." },
        { id: "sewer_valve_2", room: "sewers", shape: "rect", rect: [1200, 1020, 1220, 1040], status: "placed", kind: "valve", flux: { range: 2 }, note: "A valve housing beside the second pump." },
        { id: "hazard_c1", room: "sewers", shape: "rect", rect: [1200, 940, 1220, 960], status: "placed", kind: "hazard_corrosive", flux: { range: 2 }, note: "A corrosive flask on the open floor north of the dam's pumps (the owner, 2026-11-10: \"we're going to put one in the sewer\"; js/hazards.js)." },
        // THE PUMP ROOM (the owner, 2026-11-07: "Machinery elsewhere", then "Widen a section"): a chamber opened off the north walkway (x 440 to 560, y 780 to 860) with machinery to move for cover
        { id: "sewer_pump_3", room: "sewers", shape: "rect", rect: [440, 780, 480, 800], status: "placed", kind: "pump", flux: { range: 2, turn: true }, note: "A pump housing against the pump room's back wall." },
        { id: "sewer_valve_3", room: "sewers", shape: "rect", rect: [520, 780, 540, 800], status: "placed", kind: "valve", flux: { range: 2 }, note: "A valve housing against the pump room's back wall." },
        { id: "sewer_valve_4", room: "sewers", shape: "rect", rect: [480, 820, 500, 840], status: "placed", kind: "valve", flux: { range: 2 }, note: "A valve housing in the middle of the pump room." },
        // THE SAMPLE BANK'S ROCK FALL (the owner, 2026-11-07: "Ice or drill"): across the south ledge at x 380, walling the bank (x 300 to 380, the end wall its other side) off from the rest of the ledge; drilled
        //   from the ledge's side (its rubble entry below). Like the collapsed tunnel's choke it lies a hair inside its line (x 372 to 378 for x 380), so the work spot sees it
        { id: "sewer_bank_rock", room: "sewers", shape: "poly", poly: [[372, 980], [378, 980], [378, 1080], [372, 1080]], status: "placed", kind: "rubble", note: "A rock fall across the south ledge, walling the sample bank off from the rest of it: drilled through by a fire technician from the ledge." },
        { id: "sewer_gate_boss", room: "sewers", shape: "poly", poly: [[1056, 1020], [1064, 1020], [1064, 1080], [1056, 1080]], status: "placed", kind: "rubble", note: "THE RUBBLE ON THE WAY INTO THE NEST (a barred boss gate until build 2026-11-06l; the owner, 2026-11-06: \"I never wanted a gate. I wanted rubble\", \"Rubble, drilled\"): the south ledge's way onto the dam, three tiles across, choked with fallen concrete until a fire technician drills it through (rubble_sewer_gate). The other way onto the dam: an ice bridge across the water." },
    ],

    // PICKUPS: supply cases standing on the floor (docs/TUTORIAL.md). `at` is the middle of a tile (sketch pixels: 20 to a tile); `items` is [[item id, how many], ...] from the ITEMS table in js/inventory.js. The player walks over one to take
    // what it holds. The tutorial has NO classes: its cases (ammunition, power cells, the relay kit) hold what anyone can use. Classes are given when the tutorial is finished, and only then, and a case with a `class` is
    // not in the facility until that class is chosen: then the cases for that class enter the area (the Gunslinger's flares in the Armory, the Technomancer's cells in Teleport Room 1, the Mutator's samples in the lab and the Crystal Chamber).
    pickups: [
        { id: "pk_armory_ammo", room: "armory", at: [280, 1020], items: [["ammo_pack", 2]], note: "Ammunition in the Armory." },
        { id: "pk_security_cache", room: "security_room", at: [880, 360], items: [["ammo_pack", 1]], note: "A drawer's worth of ammunition in the Security Room." },
        { id: "pk_lab_cells", room: "experiment_lab", at: [620, 580], items: [["power_cell", 2]], note: "Charged cells on the lab bench." },
        { id: "pk_lobby_cell", room: "front_lobby", at: [700, 280], items: [["power_cell", 1]], note: "A cell among the server racks." },
        // REPAIR KITS (docs/PLAYER-COMBAT.md, step 1, build 2026-11-11e): spots that fill again (`respawn`, frames) a while after the kit is taken; where the fights are. The places and the wait are the agent's, provisional.
        { id: "pk_kit_arena_n", room: "arena", at: [520, 840], items: [["repair_kit", 1]], respawn: 10800, note: "A repair kit in the arena, by its door from the hallway: back three minutes after it is taken." },
        { id: "pk_kit_arena_s", room: "arena", at: [900, 1140], items: [["repair_kit", 1]], respawn: 10800, note: "A repair kit in the arena's south-east corner: back three minutes after it is taken." },
        { id: "pk_kit_sewers", room: "sewers", at: [460, 870], items: [["repair_kit", 1]], respawn: 10800, note: "A repair kit on the Sewers' north ledge, near the culvert: back three minutes after it is taken." },
        // FUEL CELLS: the laser rifle's fuel, in the server room (it was the computer lab). A case with `needs` is not in the facility until that relay is online (since build 2026-11-07qq: when the junction is
        // repaired, every relay comes on): then it arrives, in a column of light.
        { id: "pk_lobby_fuel_1", room: "front_lobby", at: [460, 260], items: [["fuel_cell", 2]], needs: "relay_lobby", note: "Fuel cells beside the west server racks (once the room has power)." },
        { id: "pk_lobby_fuel_2", room: "front_lobby", at: [640, 300], items: [["fuel_cell", 2]], needs: "relay_lobby", note: "Fuel cells in an aisle between the racks." },
        { id: "pk_lobby_fuel_3", room: "front_lobby", at: [780, 260], items: [["fuel_cell", 2]], needs: "relay_lobby", note: "Fuel cells beside the east server racks." },
        { id: "pk_security_cell", room: "security_room", at: [900, 330], items: [["power_cell", 1]], note: "A spare cell in the Security Room's drawers." },
        { id: "pk_hall_cell", room: "lab_hallway", at: [650, 450], items: [["power_cell", 1]], note: "A cell on the hallway floor." },
        { id: "pk_show_cells", room: "show_room", at: [1010, 320], items: [["power_cell", 2]], note: "Two cells in the warehouse, by the racks." },
        { id: "pk_armory_cell", room: "armory", at: [250, 990], items: [["power_cell", 1]], note: "A cell in the Armory." },
        { id: "pk_arena_cells", room: "arena", at: [700, 880], items: [["power_cell", 2]], note: "Two cells left in the arena." },
        { id: "pk_chamber_cell", room: "crystal_chamber", at: [260, 440], items: [["power_cell", 1]], note: "A cell in the Crystal Chamber. (It held the relay kit until build 2026-11-07qq: no relay is repaired now.)" },
        // THE POWER MODULE (the tutorial, build 2026-11-07qq; the owner: "you need to obtain a module to repair it somewhere on the map ... the item could be in the catwalks, and side quest's ability is to fly"): on the
        // catwalks over the arena, out of the player's reach (`fetch`: it is not taken by walking up to it). Side Quest, waiting under the catwalks, flies up and brings it down (js/sidequest.js).
        { id: "pk_power_module", room: "catwalks", at: [1030, 1060], items: [["power_module", 1]], fetch: "sidequest", note: "The power module the junction needs, glowing on the catwalks." },
        { id: "pk_armory_flare", room: "armory", at: [240, 1100], items: [["flare", 2]], class: "gunslinger", note: "Flares in the Armory (Gunslinger)." },
        { id: "pk_armory_flare_2", room: "armory", at: [320, 1080], items: [["flare", 2]], class: "gunslinger", note: "More flares in the Armory (Gunslinger)." },
        { id: "pk_tele_legs", room: "teleport_room_1", at: [260, 620], items: [["mech_leg", 2]], class: "technomancer", note: "Two spider-mech legs beside the teleporters (Technomancer)." },
        { id: "pk_tele_legs_2", room: "teleport_room_1", at: [260, 680], items: [["mech_leg", 2]], class: "technomancer", note: "Two more legs by the console (Technomancer)." },
        { id: "pk_show_core", room: "show_room", at: [1060, 520], items: [["mech_core", 1]], class: "technomancer", note: "A mech core, left in the warehouse (Technomancer)." },
        { id: "pk_lab_mutagen", room: "experiment_lab", at: [500, 580], items: [["mutagen_sample", 2]], class: "mutator", note: "Samples in the lab (Mutator)." },
        { id: "pk_chamber_mutagen", room: "crystal_chamber", at: [280, 400], items: [["mutagen_sample", 1]], class: "mutator", note: "A sample left by the crystal (Mutator)." },
        { id: "pk_chamber_mutagen_2", room: "crystal_chamber", at: [320, 320], items: [["mutagen_sample", 1]], class: "mutator", note: "Another sample in the chamber (Mutator)." },
        // THE SEWER SAMPLE (the sample puzzle, docs/SEWER-QUEST.md): a sealed vial of the river's water at the far end of the collapsed tunnel's broken-off floor, in sight from the north ledge and out of reach behind the choke.
        // Two ways to it, each on its own: the electric technician's Kinetic Launcher set up on the ledge, which carries YOU over the choke onto the floor (you take the vial and jump back down from the broken
        // edge); or a fire technician's Thermite Drill through the choke from the ledge, after which anyone walks in. (A third, the flux technician's Telegrab, went with Telegrab: the owner, 2026-11-06.)
        { id: "pk_sewer_sample", room: "sewers", at: [356, 1064], items: [["sewer_sample", 1]], note: "A water sample on the SAMPLE BANK (the owner, 2026-11-07: \"a little water sample is on the other side of the bank of the river\"): the west end of the south bank, walled off by the rock fall; reached by an ice bridge, the drill, or the launcher (and back through the drain pipe)." },
        // (The five hidden VITAL items, a Fleck, a Prism and a Core, were removed 2026-11-01 with the HP a death cost: the owner, "Remove them".)
    ],

    // FOLLOWER SPOTS (js/followerspots.js): a place where a follower waits, in its egg, as one thing and nothing else: its `type` (brawler, sniper = the MAGE, camper = the TECHNICIAN) and its `element` are fixed,
    // and so is where it is. Walk up to it and it joins, there, as that type and that element, free, and the post is claimed for good (it does not fill again: the archive's follow-up scope, 2026-10-31; free: the owner).
    // `at` is the middle of a tile (sketch pixels: 20 to a tile).
    // Seven spots, in the places the player marked on the facility's outline view: the server room's north-east corner (it was the computer lab), the warehouse's north end (it was the show room), the observation deck, the experiment lab, the second teleport
    // room, and two in the arena (its west end by the Armory's steel door, and its middle). Every element has one; core has two.
    followerSpots: [
        { id: "spot_lobby",   room: "front_lobby",      at: [770, 330],  type: "brawler", element: "fire",     note: "A fire brawler in the server room's north-east corner." },
        { id: "spot_show",    room: "show_room",        at: [1030, 310], type: "sniper",  element: "ice",      note: "An ice mage at the warehouse's north end." },
        { id: "spot_deck",    room: "observation_deck", at: [250, 850],  type: "camper",  element: "core",     note: "A core technician on the observation deck." },
        { id: "spot_lab",     room: "experiment_lab",   at: [650, 590],  type: "sniper",  element: "toxic",    note: "A toxic mage in the experiment lab." },
        { id: "spot_tele_2",  room: "teleport_room_2",  at: [1030, 710], type: "camper",  element: "flux",     note: "A flux technician in the second teleport room." },
        { id: "spot_arena_w", room: "arena",            at: [390, 1110], type: "brawler", element: "electric", note: "An electric brawler at the arena's west end, by the Armory's steel door." },
        { id: "spot_arena_c", room: "arena",            at: [750, 850],  type: "brawler", element: "core",     note: "A core brawler in the middle of the arena." },
        { id: "spot_cold",    room: "cold_storage",     at: [660, 800],  type: "camper",  element: "ice",      note: "An ice technician out on the ice in the Cold Storage's cave." },
    ],

    // KINETIC LAUNCHER SITES (the electric technician's ability, js/techabilities.js; docs/TECHNICIANS.md): a place where its launcher can be set up for good, to send followers where nobody can walk. ASKED: "you need to have some sort
    // of check for a spot where it can be deployed [...] whenever you enter a spot where it can be deployed, have a little notification or highlighted area near the catwalk, or in the future any sort of secret area".
    // `at`: where the launcher stands (on `room`'s floor); `land`: where a follower it throws comes down (on `to`'s floor). The way back down is the room's LEDGE (`ledges`, below; the catwalks' broken section, a site's
    // `drop`/`dropTo`, went in build 2026-11-07qq). Each is the middle of a tile (sketch pixels: 20 to a tile).
    launchSites: [
        { id: "site_arena_catwalk", room: "arena", label: "Arena Catwalk", to: "catwalks", at: [940, 1000], land: [1040, 1000],
          note: "The launcher stands on the arena floor under the catwalks' railing, between the two tanks' footbridges, and throws a follower up onto the catwalks; the catwalks' LEDGE (ledge_catwalks) is the way back down into the arena. (Its broken section, the old way down, went in build 2026-11-07qq: the owner chose \"Only its way back\".)" },
        // A POCKET SITE (`pocket`): the landing is a cut-off part of the SAME room, not another room, so a follower sent there keeps its place in the squad (no room post) and waits there for you. `rider`: the launcher carries
        //   YOU as well (tap its tag once for its aim and again to ride it: js/techabilities.js techSiteRide). A floor up there with a LEDGE (`ledges`, below) is left by it, one way (techLedgeJump); a pocket with none,
        //   by the way its rubble opens. (`only`, one ability the site is for, is no longer set here: anyone may be sent over: docs/SEWER-QUEST.md.)
        { id: "site_sewer_tunnel", room: "sewers", label: "Sample bank", to: "sewers", pocket: true, rider: true, at: [360, 897], land: [340, 1030],
          note: "On the north ledge across the river from the sample bank (the owner, 2026-11-07: \"Launch over the river\"; the id is the old one, kept for saves): it throws you, or a follower, over the river onto the bank; the drain pipe in the bank's back wall is the way back (\"Pipe shortcut\")" },
    ],

    // LEDGES (build 2026-11-07qq; the owner: "I want to make it to where there's like a ledge that goes down that the player can only move to jump off of to get down"): an edge of a raised floor that is the ONE WAY DOWN from it.
    // Whoever walks onto it (`at`: the floor tile at the edge, on `room`'s floor) jumps off and comes down on `to` (on `toRoom`'s floor), one way only: nobody climbs back up it (js/techabilities.js techLedgeTick). A follower
    // thrown up by the launcher comes down by it (COME), and SIDE QUEST shows it in the tutorial: he walks to it with the power module and jumps (js/sidequest.js). Sketch pixels, the middle of a tile.
    ledges: [
        { id: "ledge_catwalks", room: "catwalks", toRoom: "arena", label: "Catwalk ledge", at: [1020, 1120], to: [940, 1120],
          note: "The catwalks' west edge over the arena floor, just south of the power module's spot (where the owner's yellow line goes down, 2026-11-07): hazard paint on the lip, a gap in the railing, arrows pointing down. You land four tiles out, over the crates, where the camera sees you come down (the floor right under the edge is hidden behind the raised deck)." },
        { id: "ledge_nest_shelf", room: "nest_shelf", toRoom: "nest_brood", label: "Shelf ledge", at: [130, 1170], to: [130, 1250],
          note: "THE ANT NEST's shelf (docs/DOMAINS.md §2, 10): the one way down from it without a climb, into the brood chamber (up is a REEF climb)." },
    ],

    // RUBBLE (the fire technician's Thermite Drill, js/techabilities.js; docs/TECHNICIANS.md): a pile of broken rock in a room's edge that a fire technician can drill through. ASKED: "Place a distinctive rubble patch at the midpoint
    // of the southern wall [...] Treat it as a placeholder for a future insect burrow or dungeon entrance"; then the arena's south rock, on its nearest straight stretch (its exact middle is on a slant), the map not changed.
    // `a`-`b`: the stretch of the room's edge it covers (drawn on the edge's face, like a wall's decor); `work`: where the technician stands to drill it (the middle of a tile, out from under the rock's overhang so it is seen).
    // Drilled through it leaves a dark hole in the rock, sealed for now: nothing walks in (no wall changes).
    rubble: [
        { id: "rubble_nest_choke", room: "nest_t1", label: "Collapsed tunnel", a: [345, 1260], b: [345, 1320], work: [380, 1300], solid: "nest_choke",
          note: "THE ANT NEST's collapsed tunnel (docs/DOMAINS.md §2, 10: the main way's first step, fire the Nest's key): drilled from the queen's cavern's side." },
        { id: "rubble_arena_south", room: "arena", label: "Rubble", a: [570, 1130], b: [610, 1130], work: [590, 1080],
          note: "In the arena's south rock, on the west half of its straight stretch (the middle is on a slant; the east half has the red banner, banner_4). Behind it: the tunnel down to the Ant Nest (since build 2026-11-07ll: the hole it leaves is the doorway `portal_arena_nest`)." },
        // A CHOKE (`solid`): rubble that fills a passage's mouth instead of lying against a wall: the solid named is in the way until the rubble is drilled through, then it is open for good (the tunnel is walked into). Its work spot
        //   is on the LEDGE, in front of the pile's middle: a fire technician in the squad drills it from there, with nothing else needed (an `inside: true` choke, with its work spot behind it, would be drilled from the far side
        //   instead, and the order from outside refused: js/techabilities.js _techCanReach; none is so now).
        { id: "rubble_sewer_gate", room: "sewers", label: "Rubble", a: [1060, 1020], b: [1060, 1080], work: [1036, 1050], solid: "sewer_gate_boss",
          tag: "RUBBLE ON THE WAY TO THE DAM", say: "RUBBLE ON THE WAY ONTO THE DAM · A FIRE TECHNICIAN CAN DRILL IT THROUGH FROM HERE: PRESS AND HOLD IT (OR FREEZE A BRIDGE ACROSS THE WATER)", opened: "THE RUBBLE IS DRILLED THROUGH · THE WAY ONTO THE DAM IS OPEN",
          note: "The way onto the Nest's dam from the south ledge, choked with rubble (the owner, 2026-11-06: \"Rubble, drilled\"): drilled through from the ledge by a fire technician, and open for good. It replaced the boss gate and its seal." },
        { id: "rubble_sewer_bank", room: "sewers", label: "Rock fall", a: [380, 980], b: [380, 1080], work: [404, 1030], solid: "sewer_bank_rock",
          tag: "ROCK FALL", say: "A ROCK FALL WALLS THE BANK OFF · THE WATER SAMPLE IS BEHIND IT · A FIRE TECHNICIAN CAN DRILL IT THROUGH FROM HERE: PRESS AND HOLD IT", opened: "THE ROCK FALL IS DRILLED THROUGH · THE BANK IS OPEN",
          note: "The rock fall walling the sample bank off from the south ledge: drilled through from the ledge, the way onto the bank on foot (the owner, 2026-11-07: \"Ice or drill\")." },
        { id: "rubble_sewer_choke", room: "sewers", label: "Collapsed tunnel", a: [820, 860], b: [940, 860], work: [880, 880], solid: "sewer_choke",
          note: "The collapsed tunnel's mouth on the Sewers' north ledge, six tiles of fallen concrete and rock: drilled through from the ledge, the way in on foot to the sample and, later, further." },
    ],

    // BRIDGES: a footbridge from a liquid tank's top to the catwalks' deck (js/propsprites.js draws it, in 3D, at the deck's height: it is decoration, not floor to walk on). `from` is a prop (a circle), `to` a room.
    bridges: [
        { id: "bridge_1", from: "arena_structure_01", to: "catwalks", note: "From the north tank's top to the catwalks' deck." },
        { id: "bridge_2", from: "arena_structure_02", to: "catwalks", note: "From the south tank's top to the catwalks' deck." },
    ],

    // STATIONS: a piece of furniture the player can USE (docs/TUTORIAL.md, phase 4). `prop` is the id of a prop above and `kind` a row of STATION_KINDS in js/stations.js (what it does, who may use it). Each class has one in the
    // rooms it works in: the Armory's locker and the Security Room's console for the Gunslinger, the console in Teleport Room 1 for the Technomancer, a test chamber in the lab for the Mutator.
    stations: [
        { id: "st_armory_locker", room: "armory", prop: "armory_locker_b", kind: "weapon_locker" },
        { id: "st_security_console", room: "security_room", prop: "sec_desk", kind: "cctv" },
        { id: "st_tune_bench", room: "teleport_room_1", prop: "console_2", kind: "tune_bench" },
        { id: "st_sequencer", room: "experiment_lab", prop: "chamber_1", kind: "sequencer" },
        { id: "st_serum_hood", room: "experiment_lab", prop: "lab_hood", kind: "serum_hood" },   // the Mutator's laboratory: serum (js/serum.js)
        { id: "st_clone_bay", room: "experiment_lab", prop: "chamber_2", kind: "clone_bay" },   // THE CLONE BAY (build 2026-11-12i): the second glass test chamber opens it (js/stations.js), off the HUD
        { id: "st_charger", room: "lab_hallway", prop: "charger_hall", kind: "charger" },
        { id: "st_mech_bay", room: "show_room", prop: "mech_bay", kind: "mech_bay" },
        { id: "st_junction", room: "front_lobby", prop: "junction", kind: "junction" },   // the main power junction: the tutorial's one repair (js/stations.js, js/tutorial.js)
        { id: "st_armory_terminal", room: "armory", prop: "armory_terminal", kind: "armory_terminal" },
        { id: "st_chest_nest_a", room: "nest_shelf", prop: "chest_nest_a", kind: "chest" },   // THE DEFAULT CHEST (docs/CHESTS.md; js/chests.js): open once, a booster pack and two items
        { id: "st_chest_nest_b", room: "nest_stream", prop: "chest_nest_b", kind: "chest" },
        { id: "st_chest_nest_c", room: "nest_burrow", prop: "chest_nest_c", kind: "chest" },
        { id: "st_chest_nest_d", room: "nest_larder", prop: "chest_nest_d", kind: "chest" },
        // THE SEWER PURIFICATION QUEST (js/quests.js, docs/SEWER-QUEST.md): the samples are analysed and the module bought at the cabinet at the Experiment Lab's west end (cabinet_1: away from the sequencer and the serum hood, whose station plate a bench beside them would take over); the boss gate's seal is broken with the module in hand; the module is installed at the cistern's console
        { id: "st_analysis_bench", room: "experiment_lab", prop: "cabinet_1", kind: "analysis_bench" },
        { id: "st_purifier", room: "sewers", prop: "purifier_mount", kind: "purifier_mount" },
    ],

    // RELAYS: the electrical network (docs/TUTORIAL.md, phase 5). Since build 2026-11-07qq (the owner: "there's no relay stations that need to be repaired"; "Make them smaller wall nodes") each is a small NODE on a wall
    // (`node`: a decor of kind relay_node), not a box to repair: every one comes on when the MAIN POWER JUNCTION in the server room is repaired (js/stations.js facilityJunctionRepair). When one is online the rooms it
    // `powers` have power (the blackout lifts there), and what it `feeds` (props: sentries, the charging station) works.
    relays: [
        { id: "relay_chamber", name: "CRYSTAL CHAMBER RELAY", room: "crystal_chamber", node: "relay_node_chamber", powers: ["crystal_chamber"], feeds: [] },   // (its two sentries run on the Crystal's power since 2026-11-01: js/crystalpower.js)
        { id: "relay_hall", name: "HALLWAY RELAY", room: "lab_hallway", node: "relay_node_hall", powers: ["lab_hallway", "teleport_stair_room"], feeds: ["charger_hall"] },   // (its sentry runs on the Crystal's power since 2026-11-01)
        { id: "relay_lobby", name: "SERVER ROOM RELAY", room: "front_lobby", node: "relay_node_lobby", powers: ["front_lobby", "security_room", "elec_servers", "elec_circuitry"], feeds: [] },   // (and the electrical domain under it: its door opens with the junction, which turns every relay on)
        { id: "relay_lab", name: "LAB RELAY", room: "lab_passage", node: "relay_node_lab", powers: ["experiment_lab", "lab_passage", "teleport_room_1", "teleport_room_2", "cold_storage"], feeds: [] },   // (and the Cold Storage under the lab)
        { id: "relay_show", name: "WAREHOUSE RELAY", room: "show_room", node: "relay_node_show", powers: ["show_room"], feeds: [] },
        { id: "relay_armory", name: "ARMORY RELAY", room: "armory", node: "relay_node_armory", powers: ["armory", "arena", "observation_deck", "catwalks", "nest_area", "nest_t1", "nest_brood", "nest_shelf", "nest_t3", "nest_t4", "nest_stream", "nest_t6", "nest_burrow", "nest_deep", "nest_t7", "nest_larder", "nest_down", "nest_down_low", "sewers"], feeds: [] },   // (and the Sewers under the arena)
    ],

    // FLOORS: each room's floor covering (js/facilitydecor.js draws it over the tile). Styles: carpet, plate, tile, labtile, concrete, grate, polished, wood, sand.
    floors: [
        { room: "crystal_chamber", style: "plate", colour: "#2a4458" },
        { room: "teleport_room_1", style: "plate", colour: "#3a2f5a" },
        { room: "front_lobby", style: "plate" },
        { room: "security_room", style: "tile" },
        { room: "show_room", style: "concrete" },
        { room: "lab_hallway", style: "concrete" },
        { room: "experiment_lab", style: "labtile" },
        { room: "lab_passage", style: "grate" },
        { room: "teleport_stair_room", style: "plate", colour: "#33405a" },
        { room: "teleport_room_2", style: "plate", colour: "#3a2f5a" },
        { room: "observation_deck", style: "wood" },
        { room: "catwalks", style: "grate" },
        { room: "arena", style: "sand" },
        { room: "armory", style: "concrete", colour: "#5a5648" },
        { room: "cold_storage", style: "plate", colour: "#cfe6f0" },
        { room: "nest_area", style: "sand", colour: "#3b2e22" },   // (packed dirt: the room's own style, FP_ROOM_STYLE.nest_area, colours it)
        { room: "nest_t1", style: "sand", colour: "#3b2e22" },
        { room: "nest_brood", style: "sand", colour: "#3b2e22" },
        { room: "nest_shelf", style: "sand", colour: "#3b2e22" },
        { room: "nest_t3", style: "sand", colour: "#3b2e22" },
        { room: "nest_t4", style: "sand", colour: "#3b2e22" },
        { room: "nest_stream", style: "sand", colour: "#3b2e22" },
        { room: "nest_t6", style: "sand", colour: "#3b2e22" },
        { room: "nest_burrow", style: "sand", colour: "#3b2e22" },
        { room: "nest_deep", style: "sand", colour: "#3b2e22" },
        { room: "nest_t7", style: "sand", colour: "#3b2e22" },
        { room: "nest_larder", style: "sand", colour: "#3b2e22" },
        { room: "nest_down", style: "sand", colour: "#3b2e22" },
        { room: "nest_down_low", style: "sand", colour: "#3b2e22" },
        { room: "elec_servers", style: "plate" },     // THE ELECTRICAL DOMAIN: dark steel plate (its room style darkens it: js/facilitystyleall.js)
        { room: "elec_circuitry", style: "plate" },
        { room: "sewers", style: "concrete", colour: "#272d2c" },   // (darker since build 2026-11-07a: Milestone Four, docs/NEXT-PHASE-ROADMAP.md §5.1; it was #3e4744)
    ],

    // DECOR: paint and light, not solid. Floor kinds: rug, hazard, lane, arrows, cables, ring, stain / puddle / scorch, papers / debris, light, tint. Wall kinds (drawn flat on the wall between a and b, on its visible +y / +x face,
    // so `room` is the room on that side): poster, vent, pipe, wall_light, screen, board, whiteboard, exit_sign, clock, graffiti, panel, banner, mirror, shelf, sign, hazard_sign, cable_run, window_blind, crack, vein, beam, chain, claw, ooze_drip, lamp, ladder, scoreboard, plate, moss, bulbs. A decor entry on a diagonal wall gives its a and b on the line itself; `outside: true` puts it on the camera-facing face of a wall whose room is BEHIND it (the arena's south and east rock).
    // Positions are sketch pixels (a tile is 20 px; a cell k is [20k-10, 20k+10]).
    decor: [
        { id: "ring_1", room: "crystal_chamber", kind: "ring", at: [250, 330], radius: 68, colour: "#6adfff", a: 0.75, w: 3, glow: true },
        { id: "ring_2", room: "crystal_chamber", kind: "ring", at: [250, 330], radius: 44, colour: "#6adfff", a: 0.6, w: 2, dashed: true },
        { id: "ring_3", room: "crystal_chamber", kind: "ring", at: [250, 330], radius: 94, colour: "#ffd34d", a: 0.5, w: 2, dashed: true },
        { id: "light_1", room: "crystal_chamber", kind: "light", at: [250, 330], radius: 130, colour: "#6adfff", a: 0.3 },
        { id: "light_2", room: "crystal_chamber", kind: "light", at: [320, 460], radius: 80, colour: "#ffe9a0", a: 0.14, flicker: true },
        { id: "cables_1", room: "crystal_chamber", kind: "cables", path: [[320, 288], [320, 340], [284, 340]], colour: "#ffb347" },
        { id: "cables_2", room: "crystal_chamber", kind: "cables", path: [[340, 288], [340, 390], [260, 390], [260, 374]], colour: "#6adfff" },
        { id: "cables_3", room: "crystal_chamber", kind: "cables", path: [[356, 320], [310, 320], [310, 340]], colour: "#ff6a4a" },
        { id: "hazard_1", room: "crystal_chamber", kind: "hazard", rect: [330, 430, 370, 490] },
        { id: "hazard_2", room: "crystal_chamber", kind: "hazard", rect: [230, 490, 270, 510] },
        { id: "scorch_1", room: "crystal_chamber", kind: "scorch", at: [300, 420], radius: 20, colour: "#0c0c10" },
        { id: "stain_1", room: "crystal_chamber", kind: "stain", at: [220, 380], radius: 16, colour: "#2a1a10" },
        { id: "papers_1", room: "crystal_chamber", kind: "papers", at: [230, 410], radius: 20, n: 6 },
        { id: "debris_1", room: "crystal_chamber", kind: "debris", at: [330, 480], radius: 20, n: 5 },
        { id: "pipe_1", room: "crystal_chamber", kind: "pipe", a: [190, 270], b: [190, 510], colour: "#ffb347", z: 62 },
        { id: "panel_1", room: "crystal_chamber", kind: "panel", a: [190, 290], b: [190, 310] },
        { id: "vent_1", room: "crystal_chamber", kind: "vent", a: [190, 330], b: [190, 350] },
        { id: "relay_node_chamber", room: "crystal_chamber", kind: "relay_node", a: [190, 370], b: [190, 390] },   // the chamber's relay node (build 2026-11-07qq: the relays are nodes on the walls)
        { id: "screen_1", room: "crystal_chamber", kind: "screen", a: [190, 410], b: [190, 450], colour: "#6adfff" },
        { id: "wall_light_1", room: "crystal_chamber", kind: "wall_light", a: [190, 450], b: [190, 490], h: 1 },
        { id: "hazard_sign_1", room: "crystal_chamber", kind: "hazard_sign", a: [190, 270], b: [210, 270] },
        { id: "vent_2", room: "crystal_chamber", kind: "vent", a: [230, 270], b: [250, 270] },
        { id: "pipe_2", room: "crystal_chamber", kind: "pipe", a: [190, 270], b: [270, 270], colour: "#ffb347", z: 60 },
        { id: "wall_light_2", room: "crystal_chamber", kind: "wall_light", a: [210, 270], b: [270, 270], h: 1 },
        { id: "ring_4", room: "teleport_room_1", kind: "ring", at: [250, 650], radius: 48, colour: "#a64dff", a: 0.8, w: 3, glow: true },
        { id: "ring_5", room: "teleport_room_1", kind: "ring", at: [250, 650], radius: 26, colour: "#a64dff", a: 0.6, w: 2, dashed: true },
        { id: "ring_6", room: "teleport_room_1", kind: "ring", at: [250, 650], radius: 66, colour: "#ffd34d", a: 0.45, w: 2, dashed: true },
        { id: "light_3", room: "teleport_room_1", kind: "light", at: [250, 650], radius: 120, colour: "#a64dff", a: 0.3 },
        { id: "light_4", room: "teleport_room_1", kind: "light", at: [250, 560], radius: 60, colour: "#ffe9a0", a: 0.12, flicker: true },
        { id: "arrows_1", room: "teleport_room_1", kind: "arrows", a: [250, 530], b: [250, 592], colour: "#a64dff" },
        { id: "hazard_3", room: "teleport_room_1", kind: "hazard", rect: [230, 690, 310, 710] },
        { id: "cables_4", room: "teleport_room_1", kind: "cables", path: [[212, 560], [212, 650], [236, 650]], colour: "#a64dff" },
        { id: "cables_5", room: "teleport_room_1", kind: "cables", path: [[300, 690], [280, 690], [276, 676]], colour: "#6adfff" },
        { id: "scorch_2", room: "teleport_room_1", kind: "scorch", at: [280, 600], radius: 18, colour: "#0c0c10" },
        { id: "papers_2", room: "teleport_room_1", kind: "papers", at: [220, 680], radius: 20, n: 5 },
        { id: "debris_2", room: "teleport_room_1", kind: "debris", at: [340, 550], radius: 20, n: 4 },
        { id: "pipe_3", room: "teleport_room_1", kind: "pipe", a: [190, 510], b: [190, 770], colour: "#a64dff", z: 64 },
        { id: "poster_1", room: "teleport_room_1", kind: "poster", a: [190, 550], b: [190, 590] },
        { id: "panel_2", room: "teleport_room_1", kind: "panel", a: [190, 610], b: [190, 630] },
        { id: "screen_2", room: "teleport_room_1", kind: "screen", a: [190, 650], b: [190, 690], colour: "#a64dff" },
        { id: "vent_3", room: "teleport_room_1", kind: "vent", a: [190, 710], b: [190, 730] },
        { id: "wall_light_3", room: "teleport_room_1", kind: "wall_light", a: [190, 570], b: [190, 630], h: 1, colour: "#c9a0ff" },
        { id: "screen_3", room: "teleport_room_1", kind: "screen", a: [270, 510], b: [310, 510], colour: "#a64dff" },
        { id: "poster_2", room: "teleport_room_1", kind: "poster", a: [310, 510], b: [330, 510] },
        { id: "hazard_sign_2", room: "teleport_room_1", kind: "hazard_sign", a: [330, 510], b: [350, 510] },
        { id: "pipe_4", room: "teleport_room_1", kind: "pipe", a: [270, 510], b: [370, 510], colour: "#a64dff", z: 62 },
        { id: "wall_light_4", room: "teleport_room_1", kind: "wall_light", a: [270, 510], b: [370, 510], colour: "#c9a0ff" },
        // THE SERVER ROOM's dressing (build 2026-11-07qq): cool dim pools between the racks, cables over the floor to the junction, status screens and a vent on the north wall, the pipe along it, the cable run down the west
        // wall, and the room's relay node beside the junction
        { id: "light_5", room: "front_lobby", kind: "light", at: [520, 300], radius: 70, colour: "#3fa9ff", a: 0.14 },
        { id: "light_6", room: "front_lobby", kind: "light", at: [640, 300], radius: 70, colour: "#3fa9ff", a: 0.14, flicker: true },
        { id: "light_7", room: "front_lobby", kind: "light", at: [740, 300], radius: 64, colour: "#31e8ff", a: 0.16 },
        { id: "light_8", room: "front_lobby", kind: "light", at: [600, 370], radius: 60, colour: "#43e0a8", a: 0.12 },
        { id: "cables_6", room: "front_lobby", kind: "cables", path: [[500, 352], [690, 352], [690, 270], [720, 270]], colour: "#31e8ff" },
        { id: "cables_7", room: "front_lobby", kind: "cables", path: [[412, 352], [470, 352], [470, 342]], colour: "#6adfff" },
        { id: "cables_8", room: "front_lobby", kind: "cables", path: [[560, 352], [560, 380], [575, 380]], colour: "#43e0a8" },
        { id: "stain_2", room: "front_lobby", kind: "stain", at: [700, 300], radius: 18, colour: "#0a0e18" },
        { id: "pipe_5", room: "front_lobby", kind: "pipe", a: [390, 230], b: [674, 230], colour: "#3a4a66", z: 66 },   // (in two since the little door: it would cross the alcove)
        { id: "pipe_5b", room: "front_lobby", kind: "pipe", a: [726, 230], b: [830, 230], colour: "#3a4a66", z: 66 },
        { id: "srv_screen_1", room: "front_lobby", kind: "screen", a: [430, 230], b: [470, 230], colour: "#31e8ff", z: 36 },
        { id: "srv_screen_2", room: "front_lobby", kind: "screen", a: [580, 230], b: [620, 230], colour: "#43e0a8", z: 36 },
        { id: "vent_4", room: "front_lobby", kind: "vent", a: [790, 230], b: [830, 230] },
        { id: "relay_node_lobby", room: "front_lobby", kind: "relay_node", a: [634, 230], b: [654, 230] },   // (moved west of the little door's alcove, between the third and fourth rows)
        { id: "cable_run_1", room: "front_lobby", kind: "cable_run", a: [390, 270], b: [390, 370] },
        { id: "pipe_6", room: "lab_hallway", kind: "pipe", a: [410, 410], b: [830, 410], colour: "#7d8aa6", z: 64 },
        { id: "exit_sign_1", room: "lab_hallway", kind: "exit_sign", a: [410, 410], b: [450, 410] },
        { id: "relay_node_hall", room: "lab_hallway", kind: "relay_node", a: [630, 410], b: [650, 410] },
        { id: "exit_sign_2", room: "lab_hallway", kind: "exit_sign", a: [750, 410], b: [830, 410] },
        { id: "exit_sign_3", room: "lab_hallway", kind: "exit_sign", a: [870, 410], b: [910, 410] },
        { id: "poster_7", room: "lab_hallway", kind: "poster", a: [470, 410], b: [510, 410], z: 34 },
        { id: "vent_5", room: "lab_hallway", kind: "vent", a: [530, 410], b: [550, 410] },
        { id: "poster_8", room: "lab_hallway", kind: "poster", a: [570, 410], b: [610, 410], z: 34 },
        { id: "panel_3", room: "lab_hallway", kind: "panel", a: [630, 410], b: [650, 410] },
        { id: "poster_9", room: "lab_hallway", kind: "poster", a: [670, 410], b: [710, 410], z: 34 },
        { id: "hazard_sign_3", room: "lab_hallway", kind: "hazard_sign", a: [710, 410], b: [730, 410] },
        { id: "wall_light_7", room: "lab_hallway", kind: "wall_light", a: [470, 410], b: [590, 410], h: 1 },
        { id: "wall_light_8", room: "lab_hallway", kind: "wall_light", a: [610, 410], b: [730, 410], colour: "#bfe8ff" },
        { id: "graffiti_1", room: "lab_hallway", kind: "graffiti", a: [830, 410], b: [870, 410], colour: "#ff3da6", z: 26 },
        { id: "light_9", room: "security_room", kind: "light", at: [880, 340], radius: 64, colour: "#6adfff", a: 0.2, flicker: true },
        { id: "light_9b", room: "security_room", kind: "light", at: [850, 300], radius: 50, colour: "#6adfff", a: 0.16, flicker: true },
        { id: "rug_sec", room: "security_room", kind: "rug", rect: [850, 310, 910, 370], colour: "#1d2b3f", border: "#3a7bff" },
        { id: "papers_6", room: "security_room", kind: "papers", at: [880, 330], radius: 20, n: 5 },
        { id: "mon_n", room: "security_room", kind: "monitor_bank", a: [830, 270], b: [930, 270], note: "The wall of camera feeds along the north wall, three rows of monitors over the console desk." },
        { id: "mon_w1", room: "security_room", kind: "monitor_bank", a: [830, 270], b: [830, 310] },
        { id: "mon_w2", room: "security_room", kind: "monitor_bank", a: [830, 350], b: [830, 410] },
        // THE WAREHOUSE's dressing (build 2026-11-07qq): work lights over the floor, a hazard sign on the west wall, the room's relay node on the north wall, the old scuffs and papers
        { id: "relay_node_show", room: "show_room", kind: "relay_node", a: [930, 300], b: [930, 320] },
        { id: "hazard_sign_wh", room: "show_room", kind: "hazard_sign", a: [930, 380], b: [930, 400] },
        { id: "light_10", room: "show_room", kind: "light", at: [990, 360], radius: 80, colour: "#ffe2b0", a: 0.2 },
        { id: "light_11", room: "show_room", kind: "light", at: [1010, 520], radius: 90, colour: "#ffe2b0", a: 0.18, flicker: true },
        { id: "stain_6", room: "show_room", kind: "stain", at: [1050, 330], radius: 16, colour: "#10101a" },
        { id: "papers_7", room: "show_room", kind: "papers", at: [980, 560], radius: 24, n: 5 },
        { id: "debris_3", room: "show_room", kind: "debris", at: [1010, 540], radius: 20, n: 4 },
        { id: "lane_3", room: "lab_hallway", kind: "lane", a: [400, 470], b: [880, 470], colour: "#ffd21a", dashed: true, w: 2 },
        { id: "lane_4", room: "lab_hallway", kind: "lane", a: [820, 540], b: [820, 720], colour: "#ffd21a", dashed: true, w: 2 },
        { id: "lane_5", room: "lab_hallway", kind: "lane", a: [820, 710], b: [440, 710], colour: "#ffd21a", dashed: true, w: 2 },
        { id: "arrows_2", room: "lab_hallway", kind: "arrows", a: [400, 440], b: [880, 440], colour: "#ffd21a" },
        { id: "arrows_3", room: "lab_hallway", kind: "arrows", a: [834, 540], b: [834, 720], colour: "#ffd21a" },
        { id: "arrows_4", room: "lab_hallway", kind: "arrows", a: [800, 738], b: [460, 738], colour: "#ffd21a" },
        { id: "hazard_4", room: "lab_hallway", kind: "hazard", rect: [370, 730, 450, 750] },
        { id: "hazard_5", room: "lab_hallway", kind: "hazard", rect: [370, 430, 390, 490] },
        { id: "hazard_6", room: "lab_hallway", kind: "hazard", rect: [410, 410, 450, 430] },
        { id: "hazard_7", room: "lab_hallway", kind: "hazard", rect: [750, 410, 830, 430] },
        { id: "hazard_8", room: "lab_hallway", kind: "hazard", rect: [870, 410, 910, 430] },
        { id: "hazard_9", room: "lab_hallway", kind: "hazard", rect: [890, 490, 910, 550] },
        { id: "hazard_10", room: "lab_hallway", kind: "hazard", rect: [850, 610, 870, 750], colour: "#ffe733" },
        { id: "light_14", room: "lab_hallway", kind: "light", at: [500, 470], radius: 90, colour: "#ffe9a0", a: 0.2, flicker: true },
        { id: "light_15", room: "lab_hallway", kind: "light", at: [680, 470], radius: 90, colour: "#bfe8ff", a: 0.2 },
        { id: "light_16", room: "lab_hallway", kind: "light", at: [860, 560], radius: 90, colour: "#ffe9a0", a: 0.2 },
        { id: "light_17", room: "lab_hallway", kind: "light", at: [800, 680], radius: 90, colour: "#ffe9a0", a: 0.2, flicker: true },
        { id: "light_18", room: "lab_hallway", kind: "light", at: [600, 700], radius: 90, colour: "#bfe8ff", a: 0.2 },
        { id: "light_19", room: "lab_hallway", kind: "light", at: [420, 680], radius: 90, colour: "#ffe9a0", a: 0.2 },
        { id: "stain_7", room: "lab_hallway", kind: "stain", at: [560, 480], radius: 20, colour: "#1a1008" },
        { id: "stain_8", room: "lab_hallway", kind: "stain", at: [720, 440], radius: 16, colour: "#1a1008" },
        { id: "stain_9", room: "lab_hallway", kind: "stain", at: [800, 620], radius: 22, colour: "#1a1008" },
        { id: "stain_10", room: "lab_hallway", kind: "stain", at: [520, 720], radius: 18, colour: "#1a1008" },
        { id: "stain_11", room: "lab_hallway", kind: "stain", at: [660, 680], radius: 20, colour: "#10121a" },
        { id: "stain_12", room: "lab_hallway", kind: "stain", at: [400, 720], radius: 16, colour: "#1a1008" },
        { id: "stain_13", room: "lab_hallway", kind: "stain", at: [840, 680], radius: 18, colour: "#1a1008" },
        { id: "puddle_3", room: "lab_hallway", kind: "puddle", at: [760, 500], radius: 18, colour: "#3a7a90" },
        { id: "puddle_4", room: "lab_hallway", kind: "puddle", at: [480, 680], radius: 16, colour: "#3a7a90" },
        { id: "papers_8", room: "lab_hallway", kind: "papers", at: [620, 480], radius: 40, n: 7 },
        { id: "papers_9", room: "lab_hallway", kind: "papers", at: [540, 700], radius: 40, n: 6 },
        { id: "debris_4", room: "lab_hallway", kind: "debris", at: [860, 580], radius: 28, n: 5 },
        { id: "debris_5", room: "lab_hallway", kind: "debris", at: [440, 720], radius: 28, n: 5 },
        { id: "papers_10", room: "lab_hallway", kind: "papers", at: [720, 720], radius: 28, n: 4 },
        { id: "cables_9", room: "lab_hallway", kind: "cables", path: [[460, 426], [740, 426]], colour: "#3a3a48" },
        { id: "cables_10", room: "lab_hallway", kind: "cables", path: [[328, 620], [328, 752], [380, 752]], colour: "#3a3a48" },
        { id: "poster_11", room: "lab_hallway", kind: "poster", a: [310, 610], b: [310, 650] },
        { id: "vent_7", room: "lab_hallway", kind: "vent", a: [310, 670], b: [310, 690] },
        { id: "board_2", room: "lab_hallway", kind: "board", a: [310, 690], b: [310, 730] },
        { id: "wall_light_9", room: "lab_hallway", kind: "wall_light", a: [310, 630], b: [310, 750], h: 1 },
        { id: "pipe_7", room: "lab_hallway", kind: "pipe", a: [310, 610], b: [310, 770], colour: "#7d8aa6", z: 66 },
        { id: "poster_12", room: "lab_hallway", kind: "poster", a: [310, 610], b: [350, 610] },
        { id: "hazard_sign_4", room: "lab_hallway", kind: "hazard_sign", a: [370, 610], b: [390, 610] },
        { id: "pipe_8", room: "lab_hallway", kind: "pipe", a: [310, 610], b: [430, 610], colour: "#7d8aa6", z: 64 },
        { id: "exit_sign_4", room: "lab_hallway", kind: "exit_sign", a: [370, 430], b: [370, 490] },
        { id: "ring_9", room: "experiment_lab", kind: "ring", at: [700, 560], radius: 42, colour: "#ffd21a", a: 0.6, w: 2, dashed: true },
        { id: "light_20", room: "experiment_lab", kind: "light", at: [520, 590], radius: 90, colour: "#cfeaff", a: 0.22, flicker: true },
        { id: "light_21", room: "experiment_lab", kind: "light", at: [660, 600], radius: 72, colour: "#6dff5a", a: 0.18 },
        { id: "puddle_5", room: "experiment_lab", kind: "puddle", at: [640, 600], radius: 16, colour: "#6dff5a" },
        { id: "puddle_6", room: "experiment_lab", kind: "puddle", at: [540, 590], radius: 14, colour: "#6adfff" },
        { id: "papers_11", room: "experiment_lab", kind: "papers", at: [570, 590], radius: 24, n: 5 },
        { id: "cables_11", room: "experiment_lab", kind: "cables", path: [[690, 596], [660, 606], [600, 606]], colour: "#6dff5a" },
        { id: "cables_12", room: "experiment_lab", kind: "cables", path: [[720, 538], [720, 586]], colour: "#ffb347" },
        { id: "shelf_1", room: "experiment_lab", kind: "shelf", a: [430, 530], b: [430, 570] },
        { id: "hazard_11", room: "lab_passage", kind: "hazard", rect: [310, 570, 330, 610] },
        { id: "hazard_12", room: "lab_passage", kind: "hazard", rect: [410, 570, 430, 610] },
        { id: "light_22", room: "lab_passage", kind: "light", at: [370, 590], radius: 60, colour: "#ffe9a0", a: 0.18, flicker: true },
        { id: "pipe_9", room: "lab_passage", kind: "pipe", a: [310, 570], b: [430, 570], colour: "#ffb347", z: 60 },
        { id: "vent_8", room: "lab_passage", kind: "vent", a: [330, 570], b: [350, 570] },
        { id: "relay_node_lab", room: "lab_passage", kind: "relay_node", a: [390, 570], b: [410, 570] },   // the lab's relay (the lab's own walls are glass and its west wall full: the node is in the passage)
        { id: "wall_light_10", room: "lab_passage", kind: "wall_light", a: [350, 570], b: [390, 570], h: 1 },   // (shortened for the lab relay's node, build 2026-11-07qq)
        { id: "pipe_10", room: "teleport_stair_room", kind: "pipe", a: [870, 610], b: [950, 610], colour: "#7d8aa6", z: 62 },
        { id: "hazard_sign_5", room: "teleport_stair_room", kind: "hazard_sign", a: [890, 610], b: [910, 610] },
        { id: "wall_light_11", room: "teleport_stair_room", kind: "wall_light", a: [870, 610], b: [930, 610], colour: "#bfe8ff" },
        { id: "light_23", room: "teleport_stair_room", kind: "light", at: [900, 660], radius: 68, colour: "#bfe8ff", a: 0.16, flicker: true },
        { id: "ring_10", room: "teleport_room_2", kind: "ring", at: [1030, 710], radius: 46, colour: "#a64dff", a: 0.8, w: 3, glow: true },
        { id: "ring_11", room: "teleport_room_2", kind: "ring", at: [1030, 710], radius: 26, colour: "#a64dff", a: 0.6, w: 2, dashed: true },
        { id: "light_24", room: "teleport_room_2", kind: "light", at: [1030, 710], radius: 120, colour: "#a64dff", a: 0.3 },
        { id: "arrows_5", room: "teleport_room_2", kind: "arrows", a: [968, 660], b: [1000, 700], colour: "#a64dff" },
        { id: "cables_13", room: "teleport_room_2", kind: "cables", path: [[980, 632], [980, 710], [1004, 710]], colour: "#a64dff" },
        { id: "scorch_3", room: "teleport_room_2", kind: "scorch", at: [1060, 660], radius: 18, colour: "#0c0c10" },
        { id: "debris_6", room: "teleport_room_2", kind: "debris", at: [990, 750], radius: 20, n: 5 },
        // (screen_5, screen_6, pipe_11, vent_9 and wall_light_12 hung on Teleport Room 2's north wall, the wall between it and the warehouse: they went with it, build 2026-11-09uu: js/facilitygrow.js)
        { id: "poster_13", room: "teleport_room_2", kind: "poster", a: [950, 710], b: [950, 750] },
        { id: "vent_10", room: "teleport_room_2", kind: "vent", a: [950, 750], b: [950, 770] },
        { id: "panel_4", room: "teleport_room_2", kind: "panel", a: [950, 770], b: [950, 790] },
        { id: "rug_5", room: "observation_deck", kind: "rug", rect: [210, 870, 330, 930], colour: "#5a2a3a", border: "#ffd34d" },
        { id: "light_25", room: "observation_deck", kind: "light", at: [260, 940], radius: 68, colour: "#ffd9a0", a: 0.22, flicker: true },
        { id: "light_27", room: "observation_deck", kind: "light", at: [320, 920], radius: 60, colour: "#bfe8ff", a: 0.18 },
        { id: "stain_14", room: "observation_deck", kind: "stain", at: [300, 860], radius: 18, colour: "#1a1008" },
        { id: "papers_12", room: "observation_deck", kind: "papers", at: [240, 860], radius: 24, n: 5 },
        { id: "debris_7", room: "observation_deck", kind: "debris", at: [300, 930], radius: 20, n: 4 },
        { id: "pipe_12", room: "observation_deck", kind: "pipe", a: [190, 770], b: [190, 870], colour: "#7d8aa6", z: 66 },
        { id: "pipe_12b", room: "observation_deck", kind: "pipe", a: [190, 910], b: [190, 950], colour: "#7d8aa6", z: 66 },
        { id: "poster_14", room: "observation_deck", kind: "poster", a: [190, 810], b: [190, 850] },
        { id: "clock_2", room: "observation_deck", kind: "clock", a: [190, 840], b: [190, 860] },
        { id: "wall_light_13", room: "observation_deck", kind: "wall_light", a: [190, 910], b: [190, 930], colour: "#ffe9a0" },
        { id: "sign_4", room: "observation_deck", kind: "sign", a: [190, 770], b: [230, 770], colour: "#8fe3ff" },
        { id: "poster_17", room: "observation_deck", kind: "poster", a: [310, 770], b: [350, 770] },
        { id: "light_28", room: "catwalks", kind: "light", at: [1060, 920], radius: 68, colour: "#ff4a3a", a: 0.18, flicker: true },
        { id: "light_29", room: "catwalks", kind: "light", at: [1060, 1100], radius: 68, colour: "#ff4a3a", a: 0.16 },
        { id: "hazard_13", room: "catwalks", kind: "hazard", rect: [1010, 810, 1110, 830] },
        { id: "ring_12", room: "arena", kind: "ring", at: [650, 990], radius: 124, colour: "#ff4a3a", a: 0.55, w: 3 },
        { id: "ring_13", room: "arena", kind: "ring", at: [650, 990], radius: 72, colour: "#ff4a3a", a: 0.5, w: 2, dashed: true },
        { id: "ring_14", room: "arena", kind: "ring", at: [650, 990], radius: 16, colour: "#ffd21a", a: 0.6, w: 2 },
        { id: "lane_6", room: "arena", kind: "lane", a: [530, 990], b: [770, 990], colour: "#ffd21a", dashed: true, w: 2 },
        { id: "lane_7", room: "arena", kind: "lane", a: [650, 870], b: [650, 1110], colour: "#ffd21a", dashed: true, w: 2 },
        { id: "ring_15", room: "arena", kind: "ring", at: [830, 910], radius: 62, colour: "#ffd21a", a: 0.6, w: 2, dashed: true },
        { id: "ring_16", room: "arena", kind: "ring", at: [850, 1070], radius: 62, colour: "#ffd21a", a: 0.6, w: 2, dashed: true },
        { id: "pipe_13", room: "arena", kind: "pipe", a: [450, 770], b: [530, 770], colour: "#7d8aa6", z: 64 },
        { id: "banner_3", room: "arena", kind: "banner", a: [450, 770], b: [490, 770], colour: "#8a1f2a" },
        { id: "wall_light_15", room: "arena", kind: "wall_light", a: [490, 770], b: [530, 770], h: 1, colour: "#ffe9a0" },
        { id: "hazard_sign_6", room: "arena", kind: "hazard_sign", a: [510, 770], b: [530, 770] },
        { id: "debris_8", room: "arena", kind: "debris", at: [580, 880], radius: 32, n: 8 },
        { id: "debris_13", room: "arena", kind: "debris", at: [570, 850], radius: 24, n: 6 },
        { id: "light_30", room: "arena", kind: "light", at: [540, 830], radius: 140, colour: "#fff2c0", a: 0.2 },
        // ── the Cold Storage's door in the arena's north rock: its double freezer door set in boulders (`cold`), the cold breathing out of it (a frost on the floor in front, a pale blue glow) ──
        { id: "arena_cold_door", room: "arena", kind: "portal_door", a: [600, 740], b: [660, 740], colour: "#9be8ff", flat: true, cold: true },
        { id: "arena_cold_frost", room: "arena", kind: "ice_sheet", path: [[600, 772], [660, 772], [684, 795], [652, 818], [606, 818], [578, 795]] },
        { id: "arena_cold_light", room: "arena", kind: "light", at: [630, 775], radius: 90, colour: "#9be8ff", a: 0.18, flicker: true },
        { id: "light_31", room: "arena", kind: "light", at: [920, 840], radius: 140, colour: "#fff2c0", a: 0.2 },
        { id: "light_32", room: "arena", kind: "light", at: [920, 1150], radius: 140, colour: "#fff2c0", a: 0.2 },
        { id: "light_33", room: "arena", kind: "light", at: [540, 1150], radius: 140, colour: "#fff2c0", a: 0.2 },
        { id: "light_34", room: "arena", kind: "light", at: [650, 990], radius: 140, colour: "#ff6a4a", a: 0.1, flicker: true },
        { id: "scorch_4", room: "arena", kind: "scorch", at: [600, 920], radius: 22, colour: "#0c0c10" },
        { id: "scorch_5", room: "arena", kind: "scorch", at: [720, 1040], radius: 24, colour: "#0c0c10" },
        { id: "scorch_6", room: "arena", kind: "scorch", at: [560, 1080], radius: 20, colour: "#0c0c10" },
        { id: "scorch_7", room: "arena", kind: "scorch", at: [680, 880], radius: 18, colour: "#0c0c10" },
        { id: "puddle_7", room: "arena", kind: "puddle", at: [780, 950], radius: 20, colour: "#a64dff" },
        { id: "puddle_8", room: "arena", kind: "puddle", at: [800, 1020], radius: 26, colour: "#a64dff" },
        { id: "puddle_9", room: "arena", kind: "puddle", at: [880, 1120], radius: 20, colour: "#a64dff" },
        { id: "puddle_10", room: "arena", kind: "puddle", at: [760, 860], radius: 18, colour: "#a64dff" },
        { id: "stain_15", room: "arena", kind: "stain", at: [620, 940], radius: 18, colour: "#8a1f2a" },
        { id: "stain_16", room: "arena", kind: "stain", at: [680, 1060], radius: 20, colour: "#8a1f2a" },
        { id: "stain_17", room: "arena", kind: "stain", at: [540, 980], radius: 16, colour: "#8a1f2a" },
        { id: "stain_18", room: "arena", kind: "stain", at: [720, 920], radius: 16, colour: "#8a1f2a" },
        { id: "lane_8", room: "arena", kind: "lane", a: [530, 1050], b: [600, 1120], colour: "#14161c", dashed: false, w: 4 },
        { id: "lane_9", room: "arena", kind: "lane", a: [544, 1050], b: [614, 1126], colour: "#14161c", dashed: false, w: 4 },
        { id: "debris_9", room: "arena", kind: "debris", at: [700, 900], radius: 28, n: 6 },
        { id: "debris_10", room: "arena", kind: "debris", at: [600, 1100], radius: 32, n: 7 },
        { id: "debris_11", room: "arena", kind: "debris", at: [720, 1120], radius: 28, n: 6 },
        { id: "debris_12", room: "arena", kind: "debris", at: [920, 1000], radius: 28, n: 5 },
        { id: "beam_1", room: "arena", kind: "beam", a: [711.2, 770.8], b: [737.6, 788.4] },
        { id: "ooze_drip_1", room: "arena", kind: "ooze_drip", a: [742.4, 791.6], b: [768.8, 809.2], colour: "#a64dff" },
        { id: "moss_3", room: "arena", kind: "moss", a: [770, 810], b: [790, 810] },   // (the north rock either side of the sewer culvert's alcove, as built: a tile of it west of the alcove, then its slant east of it from (42.5, 40.5) to (46.5, 39.5) before the arena's shift)
        { id: "vein_2", room: "arena", kind: "vein", a: [772, 810], b: [790, 810], colour: "#ff6a4a" },
        { id: "lamp_2", room: "arena", kind: "lamp", a: [852, 809.5], b: [860, 807.5], h: 1 },
        { id: "scoreboard_1", room: "arena", kind: "scoreboard", a: [862, 807], b: [900, 797.5], z: 12 },   // (east of the sewer culvert's alcove, on the rock's slant as built: from (42.5, 40.5) to (46.5, 39.5) before the arena's shift)
        { id: "lamp_3", room: "arena", kind: "lamp", a: [902, 797], b: [910, 795] },
        { id: "bulbs_1", room: "arena", kind: "bulbs", a: [852, 809.5], b: [910, 795] },
        { id: "crack_2", room: "arena", kind: "crack", a: [914, 794], b: [928, 790.5] },
        { id: "plate_1", room: "arena", kind: "plate", a: [914.0, 792.0], b: [928.4, 790.2] },
        { id: "chain_2", room: "arena", kind: "chain", a: [934.8, 791.2], b: [957.2, 796.8] },
        { id: "hazard_sign_7", room: "arena", kind: "hazard_sign", a: [962.0, 798.0], b: [971.6, 800.4] },
        { id: "beam_2", room: "arena", kind: "beam", a: [974.0, 801.0], b: [1002.0, 808.0] },
        { id: "plate_2", room: "arena", kind: "plate", a: [1002.0, 1188.4], b: [974.0, 1182.8], outside: true },
        { id: "hazard_sign_8", room: "arena", kind: "hazard_sign", a: [970.0, 1182.0], b: [958.0, 1179.6], outside: true },
        { id: "lamp_4", room: "arena", kind: "lamp", a: [950.0, 1178.0], b: [938.0, 1175.6], outside: true, h: 1 },
        { id: "bulbs_2", room: "arena", kind: "bulbs", a: [934.0, 1174.8], b: [820.0, 1152.0], outside: true },
        { id: "graffiti_2", room: "arena", kind: "graffiti", a: [900.0, 1168.0], b: [854.0, 1158.8], outside: true, colour: "#6dff5a" },
        { id: "vein_3", room: "arena", kind: "vein", a: [1010.0, 1190.0], b: [950.0, 1178.0], outside: true, colour: "#a64dff" },
        { id: "crack_3", room: "arena", kind: "crack", a: [930.0, 1174.0], b: [910.0, 1170.0], outside: true },
        { id: "claw_2", room: "arena", kind: "claw", a: [846.0, 1157.2], b: [820.0, 1152.0], outside: true },
        { id: "ladder_1", room: "arena", kind: "ladder", a: [797.2, 1148.4], b: [781.2, 1146.4], outside: true },
        { id: "beam_3", room: "arena", kind: "beam", a: [770.0, 1145.0], b: [726.8, 1139.6], outside: true },
        { id: "moss_4", room: "arena", kind: "moss", a: [720.4, 1138.8], b: [682.0, 1134.0], outside: true },
        { id: "chain_3", room: "arena", kind: "chain", a: [675.6, 1133.2], b: [653.2, 1130.4], outside: true },
        { id: "banner_4", room: "arena", kind: "banner", a: [650.0, 1130.0], b: [606.0, 1130.0], outside: true, colour: "#8a1f2a" },
        { id: "vein_4", room: "arena", kind: "vein", a: [606.0, 1130.0], b: [570.0, 1130.0], outside: true, colour: "#6adfff" },
        { id: "plate_3", room: "arena", kind: "plate", a: [568.0, 1133.0], b: [554.0, 1154.0], outside: true },
        { id: "ooze_drip_2", room: "arena", kind: "ooze_drip", a: [552.0, 1157.0], b: [538.0, 1178.0], outside: true, colour: "#6dff5a" },
        { id: "lamp_5", room: "arena", kind: "lamp", a: [536.0, 1181.0], b: [530.8, 1188.8], outside: true },
        { id: "claw_3", room: "arena", kind: "claw", a: [526.0, 1191.0], b: [506.0, 1196.0], outside: true },
        { id: "crack_4", room: "arena", kind: "crack", a: [503.6, 1196.6], b: [486.0, 1201.0], outside: true },
        { id: "moss_5", room: "arena", kind: "moss", a: [482.0, 1202.0], b: [466.0, 1206.0], outside: true },
        { id: "hazard_sign_9", room: "arena", kind: "hazard_sign", a: [462.8, 1206.8], b: [452.4, 1209.4], outside: true },
        { id: "beam_4", room: "arena", kind: "beam", a: [447.0, 1209.0], b: [420.0, 1200.0], outside: true },
        { id: "chain_4", room: "arena", kind: "chain", a: [414.0, 1198.0], b: [394.8, 1191.6], outside: true },
        { id: "ladder_2", room: "arena", kind: "ladder", a: [386.0, 1188.0], b: [374.0, 1182.0], outside: true },
        { id: "vein_5", room: "arena", kind: "vein", a: [370.0, 1180.0], b: [352.0, 1171.0], outside: true, colour: "#ff6a4a" },
        { id: "light_35", room: "arena", kind: "light", at: [650, 856], radius: 84, colour: "#ffe9a0", a: 0.2, flicker: true },
        { id: "light_36", room: "arena", kind: "light", at: [850, 836], radius: 100, colour: "#ff4a3a", a: 0.16 },
        { id: "light_37", room: "arena", kind: "light", at: [940, 840], radius: 68, colour: "#ffe9a0", a: 0.14 },
        { id: "debris_14", room: "arena", kind: "debris", at: [730, 836], radius: 26, n: 6 },
        { id: "debris_15", room: "arena", kind: "debris", at: [860, 826], radius: 28, n: 6 },
        { id: "debris_16", room: "arena", kind: "debris", at: [960, 840], radius: 22, n: 6 },
        { id: "puddle_11", room: "arena", kind: "puddle", at: [600, 1104], radius: 16, colour: "#6dff5a" },
        { id: "puddle_12", room: "arena", kind: "puddle", at: [740, 1100], radius: 16, colour: "#a64dff" },
        { id: "puddle_13", room: "arena", kind: "puddle", at: [900, 1116], radius: 16, colour: "#6adfff" },
        { id: "debris_17", room: "arena", kind: "debris", at: [860, 1116], radius: 28, n: 6 },
        { id: "debris_18", room: "arena", kind: "debris", at: [540, 1110], radius: 24, n: 5 },
        { id: "lane_10", room: "catwalks", kind: "lane", a: [1044, 840], b: [1044, 1180], colour: "#ffd21a", dashed: false, w: 2 },
        { id: "lane_11", room: "catwalks", kind: "lane", a: [1076, 840], b: [1076, 1180], colour: "#ffd21a", dashed: true, w: 2 },
        { id: "arrows_6", room: "catwalks", kind: "arrows", a: [1060, 860], b: [1060, 1160], colour: "#ffd21a" },
        { id: "hazard_14", room: "catwalks", kind: "hazard", rect: [1010, 1170, 1070, 1190] },
        { id: "hazard_15", room: "catwalks", kind: "hazard", rect: [1010, 830, 1070, 850], colour: "#ffe733" },
        { id: "light_38", room: "catwalks", kind: "light", at: [1040, 940], radius: 72, colour: "#ff6a4a", a: 0.22, flicker: true },
        { id: "light_39", room: "catwalks", kind: "light", at: [1040, 1060], radius: 72, colour: "#ff4a3a", a: 0.22 },
        { id: "light_40", room: "catwalks", kind: "light", at: [1060, 1160], radius: 72, colour: "#ffe9a0", a: 0.22, flicker: true },
        { id: "light_41", room: "catwalks", kind: "light", at: [1060, 880], radius: 72, colour: "#ffe9a0", a: 0.22 },
        { id: "cables_14", room: "catwalks", kind: "cables", path: [[1090, 860], [1090, 1000], [1070, 1040], [1070, 1160]], colour: "#3a3a48" },
        { id: "cables_15", room: "catwalks", kind: "cables", path: [[1040, 848], [1040, 890], [1070, 890]], colour: "#ff6a4a" },
        { id: "stain_19", room: "catwalks", kind: "stain", at: [1050, 980], radius: 18, colour: "#4a2a10" },
        { id: "stain_20", room: "catwalks", kind: "stain", at: [1080, 1100], radius: 20, colour: "#4a2a10" },
        { id: "stain_21", room: "catwalks", kind: "stain", at: [1036, 1120], radius: 16, colour: "#1a1008" },
        { id: "puddle_14", room: "catwalks", kind: "puddle", at: [1060, 930], radius: 14, colour: "#a64dff" },
        { id: "debris_19", room: "catwalks", kind: "debris", at: [1050, 1020], radius: 26, n: 6 },
        { id: "papers_13", room: "catwalks", kind: "papers", at: [1080, 900], radius: 20, n: 4 },
        // ── THE GARAGE WALL: the arena's west cave wall south of the deck's glass. Two garage doors side by side, set into the rock ──
        { id: "garage_1", room: "arena", kind: "garage_door", a: [340, 950], b: [340, 1010], note: "The first of two garage doors. Shut: scenery, not an opening (the vehicle bay the semi-truck came out of)." },
        { id: "garage_2", room: "arena", kind: "garage_door", a: [340, 1010], b: [340, 1070], note: "The second garage door, right next to the first." },
        // ── the armory inside: weapon racks on the north and west walls, the stairs up beside them, a hazard stripe at the foot of the stairs, a pool of amber light ──
        { id: "armory_arena_door", room: "armory", kind: "portal_door", a: [200, 930], b: [240, 930], colour: "#ffb347", flat: true },
        { id: "arena_armory_door", room: "arena", kind: "portal_door", a: [320, 1090], b: [320, 1130], colour: "#ffb347", flat: true },
        { id: "armory_light_wall", room: "armory", kind: "wall_light", a: [250, 950], b: [270, 950], colour: "#ffe9a0" },
        { id: "gun_rack_2", room: "armory", kind: "gun_rack", a: [270, 950], b: [290, 950] },
        { id: "relay_node_armory", room: "armory", kind: "relay_node", a: [300, 930], b: [320, 930] },   // (in the recess in its north wall)
        { id: "armory_stairs_door", room: "armory", kind: "portal_door", a: [290, 930], b: [330, 930], colour: "#ffb347", up: true },
        { id: "deck_stairs_door", room: "observation_deck", kind: "portal_door", a: [160, 870], b: [160, 910], colour: "#8fe3ff" },
        // ── the Cold Storage: its freezer door at the entrance (the inside of the arena's), the stairwell down to it in the Experiment Lab's floor and the stairs up inside it, the ice cave's glassy floor, cold lights ──
        { id: "cold_arena_door", room: "cold_storage", kind: "portal_door", a: [420, 560], b: [420, 620], colour: "#9be8ff", flat: true, cold: true },
        { id: "lab_cold_stairwell", room: "experiment_lab", kind: "stairwell", rect: [450, 530, 510, 560], dir: "n", colour: "#9be8ff", note: "A stairwell in the lab's floor by its door: steps going down to the north, into the Cold Storage under it; a rail round three sides, open at the south where you step in from the aisle." },
        { id: "cold_lab_stairs", room: "cold_storage", kind: "stairwell", rect: [490, 660, 530, 720], dir: "n", up: true, colour: "#9be8ff", note: "The flight up to the Experiment Lab, standing in the floor: steps rising to the north." },
        { id: "cold_cave_ice", room: "cold_storage", kind: "ice_sheet", path: [[456, 748], [500, 745], [560, 752], [610, 724], [650, 712], [675, 690], [712, 708], [730, 745], [749, 782], [749, 818], [718, 850], [675, 872], [620, 890], [585, 870], [545, 852], [530, 812], [490, 794], [466, 754]],
          note: "The ice cave's floor: glassy ice over the rock (the look only: it plays like any floor)." },
        { id: "cold_light_1", room: "cold_storage", kind: "light", at: [560, 630], radius: 140, colour: "#bfefff", a: 0.16 },
        { id: "cold_light_2", room: "cold_storage", kind: "light", at: [640, 800], radius: 130, colour: "#8fdcff", a: 0.14, flicker: true },
        { id: "cold_wall_light", room: "cold_storage", kind: "wall_light", a: [440, 540], b: [480, 540], colour: "#dff6ff" },
        // ── the way down to the Sewers: the culvert in the arena's north rock (portal_door, `culvert`: an arched concrete mouth, its grating raised, a SEWER plate over it), and the tanks' RUNOFF: a small overflow
        //    grate where each tank's pipe goes into the floor (the north tank's fat manifold, the south tank's small line with its valve), the violet runoff glowing under the bars and seen running down a sight glass in
        //    the pipe (decor `overflow_grate`: `at` the grate, `pipe` the pipe's foot, `glass` the sight glass's [bottom, top, half-width] in px). Subtle: no words on the floor.
        { id: "arena_sewer_door", room: "arena", kind: "portal_door", a: [780, 788], b: [840, 788], colour: "#c08aff", culvert: true },
        { id: "overflow_grate_1", room: "arena", kind: "overflow_grate", at: [835, 962], pipe: [835, 954], glass: [22, 34, 7], note: "Under the north tank's fat manifold, where it goes into the floor." },
        { id: "overflow_grate_2", room: "arena", kind: "overflow_grate", at: [902, 1076], pipe: [894, 1075], glass: [13, 26, 5], note: "Under the south tank's small line, past its valve." },
        // ── THE SEWERS: the culvert up to the arena (the inside of the arena's), the OUTFALL where the runoff pours into the head of the river, the bridge's grating and the broken bridge's two stumps, the collapsed
        //    tunnel and the sealed hatch (ways in for later), pipes, lights, damp ──
        { id: "sewer_culvert_up", room: "sewers", kind: "portal_door", a: [280, 860], b: [280, 900], colour: "#c08aff", culvert: true },
        { id: "sewer_pipe_in_door", room: "sewers", kind: "portal_door", a: [280, 1040], b: [280, 1080], colour: "#c08aff", culvert: true, portal: "portal_sewer_pipe_in" },
        { id: "sewer_pipe_out_door", room: "sewers", kind: "portal_door", a: [300, 840], b: [340, 840], colour: "#c08aff", culvert: true, portal: "portal_sewer_pipe_out" },
        { id: "sewer_outfall", room: "sewers", kind: "outfall", a: [300, 925], b: [300, 975], colour: "#a64dff", note: "A big pipe in the west wall, the tanks' runoff pouring out of it into the head of the river." },
        { id: "sewer_bridge", room: "sewers", kind: "bridge_deck", rect: [460, 920, 500, 980], note: "A steel bridge across the river, two tiles wide: its grating, with the river seen through it, rails either side." },
        { id: "sewer_bridge_broken", room: "sewers", kind: "bridge_broken", rect: [760, 920, 800, 980], note: "A bridge fallen in: a stump of it on each bank, bent, the middle gone. Not crossable." },
        { id: "sewer_bridge_east", room: "sewers", kind: "bridge_deck", rect: [980, 920, 1020, 980], note: "THE SERVICE BRIDGE (2026-11-01: \"Improve room connectivity and navigation\"): a second steel grating across the river at the north ledge's east end, to the south ledge just short of the Nest's gate. The ledges, the two bridges and the gate make a loop: nobody walks back to the first bridge to reach the Nest, and the way back to the culvert is either ledge." },
        // (the collapsed tunnel on the north wall is an opening now, x 820 to 940: its fallen-in mouth is the `sewer_choke` solid and the `rubble_sewer_choke` entry, drawn as the pile across the whole mouth: js/techabilities.js
        //  techDrawRubbleOn; the wall decor that hung there moved east of it, and the floor beyond has its own damp and debris)
        { id: "sewer_hatch", room: "sewers", kind: "sealed_hatch", a: [570, 860], b: [590, 860], note: "Rungs up the wall to a hatch at the top, welded shut, a hazard plate on it (a way in for later)." },
        { id: "sewer_pipe_1", room: "sewers", kind: "pipe", a: [450, 780], b: [540, 780], colour: "#5d6a72", z: 60 },
        { id: "sewer_pipe_2", room: "sewers", kind: "pipe", a: [706, 860], b: [746, 860], colour: "#5d6a72", z: 64 },
        { id: "sewer_pipe_3", room: "sewers", kind: "pipe", a: [960, 860], b: [1000, 860], colour: "#5d6a72", z: 60 },
        { id: "sewer_drip_1", room: "sewers", kind: "ooze_drip", a: [300, 1010], b: [300, 1040], colour: "#a64dff" },
        { id: "sewer_moss_1", room: "sewers", kind: "moss", a: [460, 780], b: [500, 780] },
        { id: "sewer_moss_2", room: "sewers", kind: "moss", a: [970, 860], b: [1000, 860] },
        { id: "sewer_moss_3", room: "sewers", kind: "moss", a: [860, 780], b: [900, 780], note: "On the back wall of the collapsed tunnel's floor." },
        { id: "sewer_wall_light_1", room: "sewers", kind: "wall_light", a: [530, 780], b: [550, 780], colour: "#d8c8ff" },
        { id: "sewer_wall_light_2", room: "sewers", kind: "wall_light", a: [780, 860], b: [800, 860], colour: "#d8c8ff" },
        { id: "sewer_wall_light_3", room: "sewers", kind: "wall_light", a: [1200, 800], b: [1220, 800], colour: "#ff9aa8" },
        { id: "sewer_light_1", room: "sewers", kind: "light", at: [360, 880], radius: 110, colour: "#b07aff", a: 0.2 },
        { id: "sewer_light_2", room: "sewers", kind: "light", at: [600, 1040], radius: 110, colour: "#9a5cff", a: 0.14, flicker: true },
        { id: "sewer_light_3", room: "sewers", kind: "light", at: [780, 880], radius: 110, colour: "#b07aff", a: 0.14 },
        { id: "sewer_light_4", room: "sewers", kind: "light", at: [1170, 860], radius: 120, colour: "#ff6a7a", a: 0.12, flicker: true },
        { id: "sewer_light_5", room: "sewers", kind: "light", at: [880, 810], radius: 90, colour: "#b07aff", a: 0.12, flicker: true, note: "A failing lamp over the collapsed tunnel's floor: the vial is seen by it from the ledge." },
        { id: "sewer_puddle_1", room: "sewers", kind: "puddle", at: [520, 880], radius: 14, colour: "#a64dff" },
        { id: "sewer_puddle_2", room: "sewers", kind: "puddle", at: [700, 1040], radius: 16, colour: "#3a7a90" },
        { id: "sewer_puddle_3", room: "sewers", kind: "puddle", at: [960, 880], radius: 12, colour: "#a64dff" },
        { id: "sewer_puddle_4", room: "sewers", kind: "puddle", at: [860, 830], radius: 12, colour: "#3a7a90", note: "On the collapsed tunnel's floor." },
        { id: "sewer_stain_1", room: "sewers", kind: "stain", at: [420, 1040], radius: 18, colour: "#141a12" },
        { id: "sewer_stain_2", room: "sewers", kind: "stain", at: [880, 1040], radius: 16, colour: "#141a12" },
        { id: "sewer_stain_3", room: "sewers", kind: "stain", at: [920, 830], radius: 14, colour: "#141a12", note: "On the collapsed tunnel's floor, under the vial's end." },
        { id: "sewer_debris_1", room: "sewers", kind: "debris", at: [880, 878], radius: 18, n: 7, note: "At the foot of the choke, on the ledge." },
        { id: "sewer_debris_2", room: "sewers", kind: "debris", at: [900, 840], radius: 16, n: 6, note: "On the collapsed tunnel's floor, behind the choke: the collapse's spill." },
        // SIDE QUEST'S MAINTENANCE PLATFORM: a work lamp on its back wall, in his colour, and the pool of light it throws (seen through the bars before he comes, lit with him in it after)
        { id: "sewer_sq_lamp", room: "sewers", kind: "wall_light", a: [640, 800], b: [660, 800], colour: "#9fd8ff" },
        { id: "sewer_sq_light", room: "sewers", kind: "light", at: [650, 830], radius: 90, colour: "#9fd8ff", a: 0.16 },
        // THE NEST (2026-11-01; js/population.js NESTS): the Toxic Ant Queen's colony at the Sewers' east end. The AREA it is (the zone tag says THE NEST there: js/facilitynet.js facilityZoneName); the BIG BARRED ARCH in
        // its north wall (the user's sketch: "another big sewer gate tunnel entrance", behind the console, taller than the wall), the stream out of it running into the reservoir; BROOD HOLES (galleries the colony
        // has bored through the walls: its brood comes up out of them, js/facilityspawn.js FP_SPAWN_SEWERS.from), two along the north ledge and two in the Nest; RESIN on its walls; the EGG clusters; JUNK on the
        // dam; the dam's RIM of compacted trash along every edge it drops into the water (drawn from the water's own outline: js/facilitysewers.js FP_DAM_POOLS); and the WATERFALL where the moat spills over the east edge (the user's sketch). Drawn in js/facilitysewers.js; the
        // eggs, holes and resin glow while the Nest is infested and go dark when it is calmed or cleared (js/population.js nestState).
        { id: "nest_area", room: "sewers", kind: "area", rect: [1060, 800, 1360, 1120], label: "The Nest", nest: "sewer_nest" },
        { id: "nest_arch", room: "sewers", kind: "sewer_arch", a: [1060, 800], b: [1140, 800], note: "A big arched sewer gate in the Nest's north wall over the reservoir, taller than the wall, its bars down: an old tunnel from somewhere else (a way for later). The stream comes out under the bars." },
        { id: "nest_resin_1", room: "sewers", kind: "resin", a: [1160, 800], b: [1200, 800] },
        { id: "nest_resin_2", room: "sewers", kind: "resin", a: [1260, 800], b: [1300, 800] },
        { id: "nest_resin_3", room: "sewers", kind: "resin", a: [1040, 820], b: [1040, 860] },   // (on the wall west of the reservoir's new ledge, build 2026-11-06m)
        { id: "brood_hole_1", room: "sewers", kind: "brood_hole", a: [740, 860], b: [760, 860], note: "A gallery the colony has bored through the north ledge's wall." },
        { id: "brood_hole_2", room: "sewers", kind: "brood_hole", a: [1000, 860], b: [1020, 860], note: "A gallery bored through the wall at the north ledge's east end, by the service bridge." },
        { id: "brood_hole_3", room: "sewers", kind: "brood_hole", a: [1240, 800], b: [1260, 800], note: "A gallery into the Nest's north wall, among the eggs." },
        { id: "brood_hole_4", room: "sewers", kind: "brood_hole", a: [1300, 800], b: [1320, 800], note: "A gallery into the Nest's north wall, in the brood corner." },
        { id: "nest_eggs_1", room: "sewers", kind: "egg_cluster", at: [1300, 832], radius: 28, n: 11 },
        { id: "nest_eggs_2", room: "sewers", kind: "egg_cluster", at: [1246, 822], radius: 18, n: 6 },
        { id: "nest_eggs_3", room: "sewers", kind: "egg_cluster", at: [1342, 838], radius: 14, n: 5 },
        { id: "nest_eggs_4", room: "sewers", kind: "egg_cluster", at: [750, 876], radius: 10, n: 3, note: "A few eggs under the brood hole on the north ledge: the colony reaches out this far." },
        { id: "nest_junk_1", room: "sewers", kind: "junk", at: [1214, 958], radius: 22, n: 7 },
        { id: "nest_junk_2", room: "sewers", kind: "junk", at: [1276, 1036], radius: 18, n: 6 },
        { id: "nest_junk_3", room: "sewers", kind: "junk", at: [1172, 1052], radius: 14, n: 4 },
        { id: "nest_falls", room: "sewers", kind: "falls", a: [1359, 864], b: [1359, 1118], note: "THE WATERFALL: the moat spilling over the Nest's east edge, down its face into the dark." },
        { id: "nest_resin_pool_1", room: "sewers", kind: "puddle", at: [1222, 902], radius: 16, colour: "#6fbf3a" },
        { id: "nest_resin_pool_2", room: "sewers", kind: "puddle", at: [1288, 978], radius: 14, colour: "#6fbf3a" },
        { id: "nest_light_brood", room: "sewers", kind: "light", at: [1290, 840], radius: 120, colour: "#8cff5a", a: 0.12, flicker: true },
        { id: "nest_light_arch", room: "sewers", kind: "light", at: [1100, 830], radius: 100, colour: "#b07aff", a: 0.12 },
        { id: "nest_light_falls", room: "sewers", kind: "light", at: [1300, 1000], radius: 110, colour: "#a64dff", a: 0.1 },
        // ── THE ANT NEST (docs/NEST.md), the big egg cavern beyond the arena's south rock: the tunnel mouth back up (a portal door, `burrow`: a rough hole in the packed dirt ringed with resin), the colony's
        //    brood holes and resin on the two walls the camera sees (north and west), its eggs in clusters round the edge, the middle left open, a dim warm light and the brood's green glow
        { id: "nest_tunnel_up", room: "nest_area", kind: "portal_door", a: [570, 1160], b: [610, 1160], colour: "#ffb347", burrow: true, up: true },
        { id: "antnest_brood_1", room: "nest_area", kind: "brood_hole", a: [500, 1180], b: [520, 1180] },
        { id: "antnest_brood_2", room: "nest_area", kind: "brood_hole", a: [660, 1180], b: [680, 1180] },
        { id: "antnest_brood_3", room: "nest_area", kind: "brood_hole", a: [440, 1232], b: [440, 1252] },   // (moved 2026-11-12 for the west mouth to the tunnels)
        { id: "antnest_brood_4", room: "nest_area", kind: "brood_hole", a: [440, 1340], b: [440, 1360] },
        { id: "antnest_resin_1", room: "nest_area", kind: "resin", a: [525, 1180], b: [565, 1180] },
        { id: "antnest_resin_2", room: "nest_area", kind: "resin", a: [615, 1180], b: [655, 1180] },
        { id: "antnest_resin_3", room: "nest_area", kind: "resin", a: [685, 1180], b: [720, 1180] },
        { id: "antnest_eggs_1", room: "nest_area", kind: "egg_cluster", at: [722, 1222], radius: 28, n: 12 },
        { id: "antnest_eggs_2", room: "nest_area", kind: "egg_cluster", at: [740, 1300], radius: 16, n: 6 },
        { id: "antnest_eggs_3", room: "nest_area", kind: "egg_cluster", at: [705, 1385], radius: 26, n: 10 },
        { id: "antnest_eggs_4", room: "nest_area", kind: "egg_cluster", at: [600, 1404], radius: 16, n: 6 },
        { id: "antnest_eggs_5", room: "nest_area", kind: "egg_cluster", at: [486, 1384], radius: 24, n: 9 },
        { id: "antnest_eggs_6", room: "nest_area", kind: "egg_cluster", at: [460, 1300], radius: 14, n: 5 },
        { id: "antnest_eggs_7", room: "nest_area", kind: "egg_cluster", at: [492, 1214], radius: 16, n: 6 },
        { id: "antnest_resin_pool_1", room: "nest_area", kind: "puddle", at: [672, 1252], radius: 14, colour: "#6fbf3a" },
        { id: "antnest_resin_pool_2", room: "nest_area", kind: "puddle", at: [520, 1330], radius: 12, colour: "#6fbf3a" },
        { id: "antnest_light", room: "nest_area", kind: "light", at: [600, 1300], radius: 170, colour: "#d9a860", a: 0.16 },
        { id: "antnest_light_brood_n", room: "nest_area", kind: "light", at: [670, 1210], radius: 90, colour: "#8cff5a", a: 0.12, flicker: true },
        { id: "antnest_light_brood_w", room: "nest_area", kind: "light", at: [470, 1300], radius: 90, colour: "#8cff5a", a: 0.12, flicker: true },
        // THE ANT NEST GROWN OUT (build 2026-11-12a): the eggs, brood holes and resin of the cavern carried through its nests, a dim light in each tunnel, the stream's cool light, and at the way down's foot the warmth of the volcanic layer below
        { id: "antnest_eggs_b1", room: "nest_brood", kind: "egg_cluster", at: [74, 1214], radius: 22, n: 9 },
        { id: "antnest_eggs_b2", room: "nest_brood", kind: "egg_cluster", at: [206, 1336], radius: 18, n: 6 },
        { id: "antnest_eggs_b3", room: "nest_brood", kind: "egg_cluster", at: [58, 1338], radius: 15, n: 5 },
        { id: "antnest_brood_b1", room: "nest_brood", kind: "brood_hole", a: [20, 1250], b: [20, 1270] },
        { id: "antnest_resin_b1", room: "nest_brood", kind: "resin", a: [20, 1290], b: [20, 1330] },
        { id: "antnest_light_b", room: "nest_brood", kind: "light", at: [140, 1280], radius: 120, colour: "#d9a860", a: 0.14 },
        { id: "antnest_light_b_green", room: "nest_brood", kind: "light", at: [50, 1250], radius: 70, colour: "#8cff5a", a: 0.10, flicker: true },
        { id: "antnest_eggs_s1", room: "nest_shelf", kind: "egg_cluster", at: [150, 1092], radius: 14, n: 5 },
        { id: "antnest_light_s", room: "nest_shelf", kind: "light", at: [100, 1120], radius: 90, colour: "#d9a860", a: 0.12 },
        { id: "antnest_light_t1", room: "nest_t1", kind: "light", at: [350, 1290], radius: 70, colour: "#d9a860", a: 0.10 },
        { id: "antnest_light_t3", room: "nest_t3", kind: "light", at: [140, 1470], radius: 70, colour: "#d9a860", a: 0.10 },
        { id: "antnest_light_t4", room: "nest_t4", kind: "light", at: [270, 1510], radius: 70, colour: "#5fd0ff", a: 0.12, flicker: true },
        { id: "antnest_light_stream", room: "nest_stream", kind: "light", at: [420, 1520], radius: 80, colour: "#5fd0ff", a: 0.10 },
        { id: "antnest_light_t6", room: "nest_t6", kind: "light", at: [540, 1440], radius: 60, colour: "#d9a860", a: 0.10 },
        { id: "antnest_eggs_o1", room: "nest_burrow", kind: "egg_cluster", at: [520, 1650], radius: 16, n: 6 },
        { id: "antnest_light_burrow", room: "nest_burrow", kind: "light", at: [570, 1610], radius: 80, colour: "#d9a860", a: 0.10 },
        { id: "antnest_eggs_d1", room: "nest_deep", kind: "egg_cluster", at: [82, 1722], radius: 26, n: 10 },
        { id: "antnest_eggs_d2", room: "nest_deep", kind: "egg_cluster", at: [356, 1704], radius: 20, n: 8 },
        { id: "antnest_eggs_d3", room: "nest_deep", kind: "egg_cluster", at: [330, 1862], radius: 24, n: 9 },
        { id: "antnest_eggs_d4", room: "nest_deep", kind: "egg_cluster", at: [140, 1866], radius: 18, n: 6 },
        { id: "antnest_brood_d1", room: "nest_deep", kind: "brood_hole", a: [220, 1660], b: [240, 1660] },
        { id: "antnest_brood_d2", room: "nest_deep", kind: "brood_hole", a: [300, 1660], b: [320, 1660] },
        { id: "antnest_brood_d3", room: "nest_deep", kind: "brood_hole", a: [20, 1760], b: [20, 1780] },
        { id: "antnest_resin_d1", room: "nest_deep", kind: "resin", a: [250, 1660], b: [290, 1660] },
        { id: "antnest_resin_d2", room: "nest_deep", kind: "resin", a: [20, 1800], b: [20, 1840] },
        { id: "antnest_pool_d1", room: "nest_deep", kind: "puddle", at: [210, 1800], radius: 14, colour: "#6fbf3a" },
        { id: "antnest_light_d", room: "nest_deep", kind: "light", at: [220, 1780], radius: 170, colour: "#d9a860", a: 0.14 },
        { id: "antnest_light_d_green", room: "nest_deep", kind: "light", at: [260, 1690], radius: 90, colour: "#8cff5a", a: 0.10, flicker: true },
        { id: "antnest_light_t7", room: "nest_t7", kind: "light", at: [480, 1790], radius: 60, colour: "#d9a860", a: 0.10 },
        { id: "antnest_light_larder", room: "nest_larder", kind: "light", at: [590, 1780], radius: 80, colour: "#d9a860", a: 0.10 },
        { id: "antnest_light_down", room: "nest_down", kind: "light", at: [50, 1950], radius: 60, colour: "#d9a860", a: 0.10 },
        { id: "antnest_light_volcanic", room: "nest_down_low", kind: "light", at: [50, 2120], radius: 80, colour: "#ff6a2a", a: 0.22, flicker: true },
        // (and a little more of the colony's eggs and resin pools along its tunnels and side caves)
        { id: "antnest_dress_t1_1", room: "nest_t1", kind: "egg_cluster", at: [300, 1282], radius: 10, n: 3 },
        { id: "antnest_dress_t1_2", room: "nest_t1", kind: "puddle", at: [350, 1298], radius: 9, colour: "#6fbf3a" },
        { id: "antnest_dress_t1_3", room: "nest_t1", kind: "egg_cluster", at: [400, 1282], radius: 14, n: 5 },
        { id: "antnest_dress_shelf_1", room: "nest_shelf", kind: "egg_cluster", at: [44, 1112], radius: 10, n: 3 },
        { id: "antnest_dress_shelf_2", room: "nest_shelf", kind: "puddle", at: [100, 1128], radius: 9, colour: "#6fbf3a" },
        { id: "antnest_dress_t3_1", room: "nest_t3", kind: "egg_cluster", at: [152, 1442], radius: 10, n: 3 },
        { id: "antnest_dress_t3_2", room: "nest_t3", kind: "puddle", at: [168, 1520], radius: 9, colour: "#6fbf3a" },
        { id: "antnest_dress_t3_3", room: "nest_t3", kind: "egg_cluster", at: [152, 1598], radius: 14, n: 5 },
        { id: "antnest_dress_t4_1", room: "nest_t4", kind: "egg_cluster", at: [210, 1502], radius: 10, n: 3 },
        { id: "antnest_dress_t4_2", room: "nest_t4", kind: "puddle", at: [310, 1518], radius: 9, colour: "#6fbf3a" },
        { id: "antnest_dress_t4_3", room: "nest_t4", kind: "egg_cluster", at: [285, 1502], radius: 14, n: 5 },
        { id: "antnest_dress_stream_1", room: "nest_stream", kind: "egg_cluster", at: [402, 1475], radius: 10, n: 3 },
        { id: "antnest_dress_stream_2", room: "nest_stream", kind: "puddle", at: [418, 1520], radius: 9, colour: "#6fbf3a" },
        { id: "antnest_dress_stream_3", room: "nest_stream", kind: "egg_cluster", at: [402, 1565], radius: 14, n: 5 },
        { id: "antnest_dress_t6_1", room: "nest_t6", kind: "egg_cluster", at: [542, 1446], radius: 10, n: 3 },
        { id: "antnest_dress_t6_2", room: "nest_t6", kind: "puddle", at: [558, 1480], radius: 9, colour: "#6fbf3a" },
        { id: "antnest_dress_t6_3", room: "nest_t6", kind: "egg_cluster", at: [542, 1514], radius: 14, n: 5 },
        { id: "antnest_dress_burrow_1", room: "nest_burrow", kind: "egg_cluster", at: [520, 1602], radius: 10, n: 3 },
        { id: "antnest_dress_burrow_2", room: "nest_burrow", kind: "puddle", at: [570, 1618], radius: 9, colour: "#6fbf3a" },
        { id: "antnest_dress_t7_1", room: "nest_t7", kind: "egg_cluster", at: [442, 1782], radius: 10, n: 3 },
        { id: "antnest_dress_t7_2", room: "nest_t7", kind: "puddle", at: [470, 1798], radius: 9, colour: "#6fbf3a" },
        { id: "antnest_dress_t7_3", room: "nest_t7", kind: "egg_cluster", at: [498, 1782], radius: 14, n: 5 },
        { id: "antnest_dress_larder_1", room: "nest_larder", kind: "egg_cluster", at: [582, 1735], radius: 10, n: 3 },
        { id: "antnest_dress_larder_2", room: "nest_larder", kind: "puddle", at: [598, 1780], radius: 9, colour: "#6fbf3a" },
        { id: "antnest_dress_larder_3", room: "nest_larder", kind: "egg_cluster", at: [582, 1825], radius: 14, n: 5 },
        { id: "antnest_dress_down_1", room: "nest_down", kind: "egg_cluster", at: [42, 1926], radius: 10, n: 3 },
        { id: "antnest_dress_down_2", room: "nest_down", kind: "puddle", at: [58, 1960], radius: 9, colour: "#6fbf3a" },
        { id: "antnest_dress_down_3", room: "nest_down", kind: "egg_cluster", at: [42, 1994], radius: 14, n: 5 },
        { id: "antnest_dress_down_low_1", room: "nest_down_low", kind: "egg_cluster", at: [42, 2046], radius: 10, n: 3 },
        { id: "antnest_dress_down_low_2", room: "nest_down_low", kind: "puddle", at: [58, 2080], radius: 9, colour: "#6fbf3a" },
        { id: "antnest_dress_down_low_3", room: "nest_down_low", kind: "egg_cluster", at: [42, 2114], radius: 14, n: 5 },
        // THE ELECTRICAL DOMAIN: the little door and its stairs back up (blue, as the deck's), the cold blue lights, cables off the racks, pipes and screens on the north wall
        { id: "lobby_elec_door", room: "front_lobby", kind: "portal_door", a: [680, 202], b: [720, 202], colour: "#8fe3ff" },
        { id: "elec_stairs_door", room: "elec_servers", kind: "portal_door", a: [680, 220], b: [720, 220], colour: "#8fe3ff", up: true },
        { id: "elec_light_1", room: "elec_servers", kind: "light", at: [500, 330], radius: 70, colour: "#3fa9ff", a: 0.14 },
        { id: "elec_light_2", room: "elec_servers", kind: "light", at: [700, 300], radius: 64, colour: "#31e8ff", a: 0.16 },
        { id: "elec_light_3", room: "elec_servers", kind: "light", at: [790, 330], radius: 70, colour: "#3fa9ff", a: 0.12, flicker: true },
        { id: "elec_light_4", room: "elec_servers", kind: "light", at: [600, 500], radius: 90, colour: "#3fa9ff", a: 0.10, flicker: true },
        { id: "elec_light_5", room: "elec_circuitry", kind: "light", at: [460, 780], radius: 130, colour: "#2f9fe0", a: 0.12 },
        { id: "elec_light_6", room: "elec_circuitry", kind: "light", at: [740, 820], radius: 130, colour: "#41c7ff", a: 0.10 },
        { id: "elec_light_7", room: "elec_circuitry", kind: "light", at: [600, 960], radius: 150, colour: "#3fa9ff", a: 0.10 },
        { id: "elec_cables_1", room: "elec_servers", kind: "cables", path: [[590, 380], [600, 420], [640, 450], [700, 470]], colour: "#3fa9ff" },
        { id: "elec_cables_2", room: "elec_servers", kind: "cables", path: [[770, 380], [760, 430], [720, 500]], colour: "#6adfff" },
        { id: "elec_cables_3", room: "elec_servers", kind: "cables", path: [[470, 380], [480, 440], [530, 470]], colour: "#31e8ff" },
        { id: "elec_cables_4", room: "elec_circuitry", kind: "cables", path: [[520, 650], [500, 720], [420, 780], [340, 800]], colour: "#3fa9ff" },
        { id: "elec_cables_5", room: "elec_circuitry", kind: "cables", path: [[680, 650], [720, 740], [820, 790], [880, 900]], colour: "#6adfff" },
        { id: "elec_pipe_1", room: "elec_servers", kind: "pipe", a: [370, 248], b: [674, 248], colour: "#2c3a52", z: 66 },
        { id: "elec_pipe_2", room: "elec_servers", kind: "pipe", a: [726, 248], b: [830, 248], colour: "#2c3a52", z: 66 },
        { id: "elec_screen_1", room: "elec_servers", kind: "screen", a: [430, 248], b: [470, 248], colour: "#31e8ff", z: 36 },
        { id: "elec_screen_2", room: "elec_servers", kind: "screen", a: [560, 248], b: [600, 248], colour: "#3fa9ff", z: 36 },
        { id: "antnest_light_eggs", room: "nest_area", kind: "light", at: [705, 1370], radius: 80, colour: "#ffe9a0", a: 0.1 },
        { id: "armory_sign_in", room: "armory", kind: "hazard_sign", a: [190, 950], b: [190, 970] },
        { id: "gun_rack_3", room: "armory", kind: "gun_rack", a: [190, 970], b: [190, 1030] },
        { id: "gun_rack_4", room: "armory", kind: "gun_rack", a: [190, 1070], b: [190, 1130] },
        { id: "armory_light_1", room: "armory", kind: "light", at: [270, 1040], radius: 100, colour: "#ffd9a0", a: 0.22 },
        { id: "armory_light_2", room: "armory", kind: "light", at: [330, 1090], radius: 60, colour: "#ff6a4a", a: 0.12, flicker: true },
        { id: "armory_hazard", room: "armory", kind: "hazard", rect: [290, 950, 330, 970] },
        { id: "armory_hazard_door", room: "armory", kind: "hazard", rect: [200, 950, 240, 970] },
        { id: "armory_stain", room: "armory", kind: "stain", at: [250, 1110], radius: 14, colour: "#1a1008" },
        { id: "armory_debris", room: "armory", kind: "debris", at: [230, 990], radius: 14, n: 4 },
    ],

    // (There is no separate outer path: the long lines round the nest area are that room's outside edges, drawn as its walls. Anything outside every room is not walkable.)
    outer_path: null,

    // WINDOWS: a stretch of wall that is glass. See-through (a debug/render feature), SOLID to movement exactly like a wall. The lab is windowed off from the hallway round it.
    windows: [
        { id: "lab_window_north", a: [430, 530], b: [750, 530], rooms: ["experiment_lab", "lab_hallway"] },
        { id: "lab_window_east", a: [750, 530], b: [750, 640], rooms: ["experiment_lab", "lab_hallway"] },
        { id: "lab_window_south", a: [750, 640], b: [430, 640], rooms: ["experiment_lab", "lab_hallway"] },
        { id: "deck_window_arena", a: [340, 760], b: [340, 950], rooms: ["observation_deck", "arena"] },   // the observation deck looks down into the arena through glass (solid to movement like every window)
        { id: "show_window_west", a: [930, 600], b: [930, 410], rooms: ["show_room", "lab_hallway"] },   // the hallway side only (its north part is the security room's wall). Glass for BOTH rooms' pieces, as the lab's windows are: the hallway's own piece of this edge was an opaque wall standing in front of the glass (and its thick top ran over the show room's floor)
        { id: "lab_window_west_lower", a: [430, 605], b: [430, 640], rooms: ["experiment_lab", "lab_hallway"] },
    ],

    // EVERY DOOR in the facility is a sliding access door. A confirmed opening below is one (its `door` defaults to this).
    door_type: "sliding_access_door",

    // WALL FIXTURES: things mounted on a wall. `wall` names the room and the edge (0 = the edge from its first point to its second, and so on); `span` is where along the wall,
    // in sketch pixels. Positions are approximate until the user has checked them in the game.
    fixtures: [
        { id: "power_pack_area", type: "power_pack_area", room: "crystal_chamber", edge: 0, a: [275, 262], b: [360, 262], status: "approximate",
          note: "The power / battery pack area on the Crystal Chamber's north wall (somewhere on the wall: this is a first placement). The wall power unit's cells and machine go here." },
    ],

    // CONFIRMED only. An opening is a gap cut into the walls along the segment a -> b; a connection says which two rooms it joins (and the ramp, if their levels differ).
    // The stair room: confirmed by the user. The positions on the walls are APPROXIMATE (centred on the shared wall) until the user has checked them in the game.
    openings: [
        { id: "door_chamber_teleport_1", a: [225, 500], b: [265, 500], rooms: ["crystal_chamber", "teleport_room_1"], position_status: "approximate",
          note: "A sliding access door between the Crystal Chamber and Teleport Room 1 (at the notch the sketch shows in their dividing wall)." },
        { id: "door_teleport_1_deck", a: [250, 760], b: [290, 760], rooms: ["teleport_room_1", "observation_deck"], position_status: "approximate",
          note: "A sliding access door between Teleport Room 1 and the Observation Deck (at the notch at the top of the deck)." },
        { id: "door_lobby_hallway_west", a: [400, 410], b: [455, 410], rooms: ["front_lobby", "lab_hallway"], position_status: "approximate",
          note: "The lobby's west sliding door to the hallway at the back, on the near side of the reception desk." },
        { id: "door_lobby_hallway_east", a: [770, 410], b: [810, 410], rooms: ["front_lobby", "lab_hallway"], position_status: "approximate",
          note: "The lobby's east sliding door to the hallway at the back, just past the reception desk's east end." },
        { id: "door_security_lobby", a: [824, 315], b: [824, 355], rooms: ["security_room", "front_lobby"], position_status: "approximate",
          note: "The Security Room's sliding door to the Front Lobby." },
        { id: "door_security_hallway", a: [875, 410], b: [905, 410], rooms: ["security_room", "lab_hallway"], position_status: "approximate",
          note: "The Security Room's sliding door to the hallway." },
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
        { id: "open_stair_mouth", a: [870, 610], b: [870, 760], rooms: ["teleport_stair_room", "lab_hallway"], door: null, position_status: "approximate",
          note: "The open foot of the curved staircase, onto the hallway. No door." },
        { id: "door_stair_teleport_2", a: [945, 660], b: [945, 700], rooms: ["teleport_stair_room", "teleport_room_2"], position_status: "approximate",
          note: "A sliding access door between the stair room and Teleport Room 2." },
        // THE ANT NEST GROWN OUT (docs/DOMAINS.md §2, 10): its open mouths, no doors
        { id: "open_nest_t1", a: [440, 1260], b: [440, 1320], rooms: ["nest_area", "nest_t1"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: the queen's cavern's west mouth." },
        { id: "open_nest_t1_brood", a: [260, 1260], b: [260, 1320], rooms: ["nest_t1", "nest_brood"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: into the brood chamber." },
        { id: "open_nest_brood_t3", a: [110, 1380], b: [170, 1380], rooms: ["nest_brood", "nest_t3"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: the brood chamber's south mouth." },
        { id: "open_nest_t3_t4", a: [170, 1480], b: [170, 1540], rooms: ["nest_t3", "nest_t4"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: the stream's tunnel." },
        { id: "open_nest_t4_stream", a: [350, 1480], b: [350, 1540], rooms: ["nest_t4", "nest_stream"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: into the stream cave." },
        { id: "open_nest_t3_deep", a: [110, 1660], b: [170, 1660], rooms: ["nest_t3", "nest_deep"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: into the deep brood." },
        { id: "open_nest_t6", a: [510, 1420], b: [570, 1420], rooms: ["nest_area", "nest_t6"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: the queen's cavern's south mouth." },
        { id: "open_nest_t6_burrow", a: [510, 1540], b: [570, 1540], rooms: ["nest_t6", "nest_burrow"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: into the old burrow." },
        { id: "open_nest_deep_t7", a: [420, 1760], b: [420, 1820], rooms: ["nest_deep", "nest_t7"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: the larder's tunnel." },
        { id: "open_nest_t7_larder", a: [520, 1760], b: [520, 1820], rooms: ["nest_t7", "nest_larder"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: into the larder." },
        { id: "open_nest_deep_down", a: [20, 1900], b: [80, 1900], rooms: ["nest_deep", "nest_down"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: the way down's mouth." },
        { id: "open_nest_down", a: [20, 2020], b: [80, 2020], rooms: ["nest_down", "nest_down_low"], door: null, cave: true, position_status: "approximate", note: "THE ANT NEST: the way down, half way." },
        { id: "open_elec_steps", a: [480, 600], b: [720, 600], rooms: ["elec_servers", "elec_circuitry"], door: null, position_status: "approximate",
          note: "THE ELECTRICAL DOMAIN: the wide steps down from the deep server room into the circuitry (twelve tiles across), an open mouth with no door." },
    ],
    connections: [
        { id: "conn_chamber_teleport_1", rooms: ["crystal_chamber", "teleport_room_1"], opening: "door_chamber_teleport_1" },
        { id: "conn_teleport_1_deck", rooms: ["teleport_room_1", "observation_deck"], opening: "door_teleport_1_deck", ramp: "r_deck_door_steps" },
        { id: "conn_lobby_hallway_west", rooms: ["front_lobby", "lab_hallway"], opening: "door_lobby_hallway_west" },
        { id: "conn_lobby_hallway_east", rooms: ["front_lobby", "lab_hallway"], opening: "door_lobby_hallway_east" },
        { id: "conn_security_lobby", rooms: ["security_room", "front_lobby"], opening: "door_security_lobby" },
        { id: "conn_security_hallway", rooms: ["security_room", "lab_hallway"], opening: "door_security_hallway" },
        { id: "conn_showroom_hallway", rooms: ["show_room", "lab_hallway"], opening: "door_showroom_hallway" },
        { id: "conn_arena_hallway", rooms: ["arena", "lab_hallway"], opening: "door_arena_hallway", ramp: "r_arena_steps" },
        { id: "conn_lab_passage", rooms: ["experiment_lab", "lab_passage"], opening: "door_lab_passage" },
        { id: "conn_passage_teleport_1", rooms: ["lab_passage", "teleport_room_1"], opening: "door_passage_teleport_1" },
        { id: "conn_crystal_hallway", rooms: ["crystal_chamber", "lab_hallway"], opening: "door_crystal_hallway" },
        { id: "conn_stair_hallway", rooms: ["teleport_stair_room", "lab_hallway"], opening: "open_stair_mouth", ramp: "r_teleport_stairs" },
        { id: "conn_stair_teleport_2", rooms: ["teleport_stair_room", "teleport_room_2"], opening: "door_stair_teleport_2" },
        { id: "conn_deck_armory", rooms: ["observation_deck", "armory"], portal: "portal_deck_armory" },
        { id: "conn_arena_armory", rooms: ["arena", "armory"], portal: "portal_arena_armory" },
        { id: "conn_arena_cold", rooms: ["arena", "cold_storage"], portal: "portal_arena_cold" },
        { id: "conn_lab_cold", rooms: ["experiment_lab", "cold_storage"], portal: "portal_lab_cold" },
        { id: "conn_arena_sewers", rooms: ["arena", "sewers"], portal: "portal_arena_sewers" },
        { id: "conn_arena_nest", rooms: ["arena", "nest_area"], portal: "portal_arena_nest" },   // (the sketch's candidate c_arena_nest, made real: through the drilled rubble)
        { id: "conn_lobby_elec", rooms: ["front_lobby", "elec_servers"], portal: "portal_lobby_elec" },
        { id: "conn_elec_steps", rooms: ["elec_servers", "elec_circuitry"], opening: "open_elec_steps", ramp: "r_elec_steps" },
        { id: "conn_nest_t1", rooms: ["nest_area", "nest_t1"], opening: "open_nest_t1" },
        { id: "conn_nest_t1_brood", rooms: ["nest_t1", "nest_brood"], opening: "open_nest_t1_brood" },
        { id: "conn_nest_brood_t3", rooms: ["nest_brood", "nest_t3"], opening: "open_nest_brood_t3" },
        { id: "conn_nest_t3_t4", rooms: ["nest_t3", "nest_t4"], opening: "open_nest_t3_t4" },
        { id: "conn_nest_t4_stream", rooms: ["nest_t4", "nest_stream"], opening: "open_nest_t4_stream" },
        { id: "conn_nest_t3_deep", rooms: ["nest_t3", "nest_deep"], opening: "open_nest_t3_deep" },
        { id: "conn_nest_t6", rooms: ["nest_area", "nest_t6"], opening: "open_nest_t6" },
        { id: "conn_nest_t6_burrow", rooms: ["nest_t6", "nest_burrow"], opening: "open_nest_t6_burrow" },
        { id: "conn_nest_deep_t7", rooms: ["nest_deep", "nest_t7"], opening: "open_nest_deep_t7" },
        { id: "conn_nest_t7_larder", rooms: ["nest_t7", "nest_larder"], opening: "open_nest_t7_larder" },
        { id: "conn_nest_deep_down", rooms: ["nest_deep", "nest_down"], opening: "open_nest_deep_down" },
        { id: "conn_nest_down", rooms: ["nest_down", "nest_down_low"], opening: "open_nest_down", ramp: "r_nest_down" },
    ],
    ramps: [
        // `zone` is where the floor slopes: a rectangle, the axis it slopes along, and the two coordinates at which the height equals between_levels[0] and between_levels[1] (sketch pixels).
        { id: "r_arena_steps", rooms: ["lab_hallway", "arena"], shape: "steps", between_levels: [0, -1], descends_toward: "arena", position_status: "approximate",
          zone: { rect: [360, 715, 450, 835], axis: "y", c0: 725, c1: 825, steps: 5 },
          note: "A staircase (5 steps) down from the main hallway into the arena, at the arena's door." },
        { id: "r_deck_door_steps", rooms: ["teleport_room_1", "observation_deck"], shape: "steps", between_levels: [0, 2], descends_toward: "teleport_room_1", position_status: "approximate",
          zone: { rect: [235, 715, 305, 835], axis: "y", c0: 725, c1: 825, steps: 5 },
          note: "A staircase (5 steps) UP from Teleport Room 1 onto the raised Observation Deck, at the deck's door." },
        { id: "r_teleport_stairs", rooms: ["teleport_stair_room", "lab_hallway"], shape: "curved", centre: [945, 660], r_inner: 20, r_outer: 50, from_deg: 90, to_deg: 270,
          between_levels: [1, 0], descends_toward: "lab_hallway", position_status: "approximate",
          zone: { rect: [870, 600, 945, 760], axis: "x", c0: 940, c1: 880 },
          note: "A rounded (curved) staircase leading DOWN from the stair room to the hallway that passes the experiment lab." },
        { id: "r_elec_steps", rooms: ["elec_servers", "elec_circuitry"], shape: "steps", between_levels: [-1, -2], descends_toward: "elec_circuitry", position_status: "placed",
          zone: { rect: [480, 560, 720, 660], axis: "y", c0: 570, c1: 650, steps: 4 },
          note: "THE ELECTRICAL DOMAIN: four wide steps down from the deep server room into the circuitry." },
        { id: "r_nest_down", rooms: ["nest_down", "nest_down_low"], shape: "slope", between_levels: [-1, -2], descends_toward: "nest_down_low", position_status: "placed",
          zone: { rect: [20, 1920, 80, 2120], axis: "y", c0: 1930, c1: 2110 },
          note: "THE ANT NEST: the way down, a sloping tunnel you walk straight down (the owner: 'I want the nests to descend without stairs'; 'Sloping tunnels'): no steps, a slope of dirt over nine tiles, to the volcanic layer's level (a zone without `steps` is a slope: js/facility.js)." },
    ],

    // What the sketch SUGGESTS and the user has not confirmed. None of these is a gap, a link or a ramp until it is moved above.
    candidates: {
        connections: [
            { id: "c_crystal_lobby", rooms: ["crystal_chamber", "front_lobby"], at: [370, 340], evidence: "the stepped wall between them" },
            { id: "c_teleport_catwalks", rooms: ["teleport_room_2", "catwalks"], at: [1045, 805], evidence: "the catwalks begin right under the teleport room" },
            { id: "c_catwalks_arena", rooms: ["catwalks", "arena"], at: [1000, 960], evidence: "railing posts along the catwalks' west side" },
            { id: "c_deck_arena", rooms: ["observation_deck", "arena"], at: [340, 860], evidence: "the deck wall is drawn with breaks" },
        ],
        ramps: [
            { id: "r_structure_01_stairs", at: [745, 905], between_levels: [0, 1], evidence: "stairs up the side of the upper liquid reserve (to its rim?)" },
            { id: "r_structure_02_stairs", at: [759, 1060], between_levels: [0, 1], evidence: "stairs up the side of the lower liquid reserve (to its rim?)" },
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
        "The teleport feature itself (to be added later): Teleport Room 1 and 2 are placeholders",
        "What goes in the show room (blank for now); the lobby sign's wording; where exactly the power pack sits on the chamber wall",
        "The CARRIER NPC drawn beside the map is a creature design, not map geometry: it is not part of this file",
    ],
};
// THE ANT NEST'S ROOMS (docs/DOMAINS.md §2, 10): the queen's cavern and every room of the Nest grown out (`nest: true`), one place: the tables that colour, name and light a room, the Nest's console and
// the arming of THE ANT QUEEN take them all (THE ANT QUEEN herself keeps to her cavern, `nest_area`).
const FP_NEST_ROOMS = new Set(FACILITY_MAP.rooms.filter(r => r.id === "nest_area" || r.nest).map(r => r.id));
const FP_NEST_TAGS = Object.fromEntries(FACILITY_MAP.rooms.filter(r => r.nest).map(r => [r.id, r.tag || r.label]));   // (the zone tag of each: js/facilitynet.js FP_ROOM_TAG)

// ─────────────────────────────────────────────────────────
//  THE FLUX TEST ROOM (docs/FLUX-MOVEMENT.md §9.1, Build 2; the owner, 2026-11-06: "Test room + arena"): a room of its own for proving FLUX MOVE, in the map ONLY when the address carries ?fluxlab
// ─────────────────────────────────────────────────────────
// Not part of FACILITY_MAP: js/facilitygrow.js adds it, before the building pass, when the address says ?fluxlab, so the normal game's map is exactly as it was. js/fluxlab.js is the mode (the start in the room,
// nothing kept, its creatures). The roadmap's test room (docs/NEXT-PHASE-ROADMAP.md §3.5): a one-tile movable object, a two-tile one, a rotatable one, an immovable one, objects that block movement, several enemies,
// a narrow passage and an objective behind an obstruction, and (since Milestone Two, build 2026-11-06h) objects that give cover: its crates, barrel, barriers, desk and consoles (js/facility.js FAC_COVER). THE LAYOUT IS A
// READING, the owner's to change (docs/OPEN-QUESTIONS.md §1w).
// Drawn here under the Crystal Chamber (sketch pixels, as every room) and carried to a part of the map of its own; its tiles, from its top-left floor tile (0, 0), eighteen across and thirteen deep:
//   - THE DOORWAY BACK: an alcove in the north wall (x 2-3), stairs up to a stairwell in the Crystal Chamber's floor (its north-east corner), the way back into the room from the facility;
//   - THE OBJECTS TO TRY, near the doorway: a crate and an immovable generator; a crate, a barrier and a barrel by the divider's two ways;
//   - THE DIVIDER: a row of consoles and a desk (immovable) across the room (y 6, x 1-14), with a NARROW PASSAGE one tile wide at its west end (x 0) and a way three wide at its east end (x 15-17): a crate set in
//     the narrow passage sends anything coming round to the wide way; the last piece that would shut the wide way as well is refused (FLUX MOVE never cuts the floor in two);
//   - THE OBJECTIVE BEHIND AN OBSTRUCTION: a pocket in the east wall (y 2-3, three deep: x 18-20) with an ammunition pack in it, its mouth shut by a barrier standing along it: move or turn the barrier
//     to get in (in the east wall, not the north, so the walls in front of it do not hide it: the camera looks from the south-east);
//   - THE CREATURES: three ants on the far side of the divider (js/fluxlab.js puts them there).
const FLUX_LAB_MAP = {
    room: { id: "flux_lab", label: "Flux Test Room", level: -1, status: "placed", wall_material: "solid", interior: true,
            note: "The Flux test room (?fluxlab only): a neutral room for proving FLUX MOVE. Reached only with the flag, through the stairwell in the Crystal Chamber's floor; nothing in it is saved.",
            polygon: [[190, 270], [230, 270], [230, 250], [270, 250], [270, 270], [550, 270], [550, 310], [610, 310], [610, 350], [550, 350], [550, 530], [190, 530]] },
    interior: { id: "flux_lab", under: "crystal_chamber", offset: [1280, 1920] },   // (64 tiles east and 96 south: east of the Sewers, south of the armory, out of sight of every room)
    portals: [
        { id: "portal_lab_crystal", room: "flux_lab", rect: [230, 250, 270, 270], arrive: [250, 300], to: "portal_crystal_lab", label: "CRYSTAL CHAMBER", kind: "stairs_up",
          note: "The stairs up to the Crystal Chamber, in an alcove in the test room's north wall." },
        { id: "portal_crystal_lab", room: "crystal_chamber", rect: [330, 270, 370, 310], arrive: [350, 340], to: "portal_lab_crystal", label: "FLUX TEST ROOM", kind: "stairs_down", well: true,
          note: "A stairwell in the Crystal Chamber's floor, in its north-east corner beside the relay (?fluxlab only): steps going down to the north, to the test room." },
    ],
    connections: [{ id: "conn_crystal_lab", rooms: ["crystal_chamber", "flux_lab"], portal: "portal_crystal_lab" }],
    props: [
        // the objects that move (FLUX MOVE: js/fluxmove.js reads `flux`), as the arena's are
        { id: "lab_crate_1", room: "flux_lab", shape: "rect", rect: [310, 310, 330, 330], status: "placed", kind: "crate", flux: { range: 2 }, note: "A crate on the open floor by the doorway." },
        { id: "lab_crate_2", room: "flux_lab", shape: "rect", rect: [210, 350, 230, 370], status: "placed", kind: "crate", flux: { range: 2 }, note: "A crate two tiles from the narrow passage: it fits in it." },
        { id: "lab_barrel_1", room: "flux_lab", shape: "rect", rect: [530, 350, 550, 370], status: "placed", kind: "barrel", flux: { range: 2 }, note: "A barrel two tiles from the wide way (not one: standing in front of the way's east tile it would shut it from the north)." },
        { id: "lab_barrier_1", room: "flux_lab", shape: "rect", rect: [550, 310, 570, 350], status: "placed", kind: "barrier", flux: { range: 2, turn: true }, note: "The obstruction: the barrier standing across the pocket's mouth (along y: the barrier turned)." },
        { id: "lab_barrier_2", room: "flux_lab", shape: "rect", rect: [470, 350, 510, 370], status: "placed", kind: "barrier", flux: { range: 2, turn: true }, note: "A barrier two tiles from the wide way." },
        // the objects that do not
        { id: "lab_generator", room: "flux_lab", shape: "rect", rect: [370, 310, 390, 330], status: "placed", kind: "generator", note: "An immovable machine on the open floor (FLUX MOVE: it does not move)." },
        { id: "lab_console_1", room: "flux_lab", shape: "rect", rect: [210, 390, 290, 410], status: "placed", kind: "console", note: "The divider, west: the narrow passage is between it and the west wall." },
        { id: "lab_console_2", room: "flux_lab", shape: "rect", rect: [290, 390, 370, 410], status: "placed", kind: "console", note: "The divider, middle." },
        { id: "lab_desk", room: "flux_lab", shape: "rect", rect: [370, 390, 490, 410], status: "placed", kind: "computer_desk", note: "The divider, east: the way three tiles wide is beyond its end." },
    ],
    pickups: [
        { id: "pk_lab_objective", room: "flux_lab", at: [580, 320], items: [["ammo_pack", 1]], note: "The objective: in the pocket, two tiles behind the barrier's front (a pickup is taken within 1.25 tiles), clear of its back wall (a near wall: low, but it hides what lies right against it)." },
    ],
    floors: [{ room: "flux_lab", style: "plate", colour: "#3a2f5a" }],
    decor: [
        { id: "lab_crystal_door", room: "flux_lab", kind: "portal_door", a: [230, 250], b: [270, 250], colour: "#c77dff", up: true },
        { id: "crystal_lab_stairwell", room: "crystal_chamber", kind: "stairwell", rect: [330, 270, 370, 310], dir: "n", colour: "#c77dff", note: "The stairwell down to the test room (?fluxlab only)." },
        { id: "lab_wall_light_1", room: "flux_lab", kind: "wall_light", a: [290, 270], b: [330, 270], colour: "#e0c8ff" },
        { id: "lab_wall_light_2", room: "flux_lab", kind: "wall_light", a: [190, 430], b: [190, 470], colour: "#e0c8ff" },
        { id: "lab_light_1", room: "flux_lab", kind: "light", at: [300, 330], radius: 120, colour: "#e0c8ff", a: 0.22 },
        { id: "lab_light_2", room: "flux_lab", kind: "light", at: [420, 470], radius: 120, colour: "#e0c8ff", a: 0.2 },
    ],
};
