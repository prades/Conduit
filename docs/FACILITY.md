# The permanent facility (authored map)

**Status: traced, validated, shown in a debug view, and WALKABLE (stage 1 of the wiring, `js/facilityplay.js`).** The zone strip game is untouched; the facility is a separate play mode (see *Play* below) that the strip's systems move onto one at a time.

Source: the hand-drawn top-down floor plan and `conduit_facility_map_spec.json`. The plan is traced into `js/facilitymap.js` (data only); `js/facility.js` compiles it into collision and
navigation, validates it, and draws the debug view. Edit the data file to change the facility; no gameplay code names a room or a coordinate.

## Theme
A **rundown facility that used to be a 2010s tech startup's headquarters**. The **Front Lobby** is the big-headquarters entrance: a big sign on its north wall and a reception desk area that leads (through a sliding door past the desk's east end) to the hallway at the back, which looks onto the glass Experiment Lab. The **Show Room** is a glass case showcasing a range of products (blank for now). The **Crystal Chamber** and both **Teleport Rooms** are walled off (solid, no glass). The Crystal Chamber has the **power / battery pack area** on its north wall.

## Furniture and glass
- **Computer lab = the Front Lobby:** rows of computer desks (keyboards, amber-screened monitors) along the north wall and server racks (blinking amber/red LEDs) down the west wall and in the north-east corner, beside the reception desk. The lobby was made two tiles taller to fit the rows; the doors, the bathroom door and a walkable aisle all stay clear.
- **Science lab = the Experiment Lab:** a long bench on each of the north and south walls (steel tops with beakers, flasks, a microscope and sample racks), a fume hood with a glass front, two glass test chambers (liquid, bubbles) beside the big tank, and a 2.5-tile aisle between the benches from the passage door to the tank.
- **Glass windows:** a window now draws a solid sill, glass with a reflection streak, a top rail and a mullion post every two tiles. The **Observation Deck** looks down into the arena through glass on its whole east wall (solid to movement, like every window). Everything is drawn procedurally in the amber old-tech look of the lab wall (`_fpDrawProp`, `_fpDrawWall`); no image files.
- Props are data (`props` in `facilitymap.js`: `kind`, `rect` / `circle`): add a piece by adding a line. A new `kind` needs a drawing in `_fpDrawProp`.

## Data (`FACILITY_MAP`)
- Coordinates are **sketch pixels** (the photo, origin top-left). `scale.px_per_tile` (20) turns them into world tiles: calibrating is one number. The **main hallway round the lab is 6 tiles wide** (120 px), matching the strip's lane and wide enough to fight in: the lab keeps its size and every other room was pushed outward to make room for it (the passage to Teleport Room 1 is 2 tiles wide and 6 long). The sketch grid is not a tile size.
- `rooms`: explicit polygons with a `level` and a `status` (`traced` / `approximate` / `unconfirmed`). Every edge is a wall unless a CONFIRMED opening is cut into it.
- `props`: solid things in rooms (benches; the arena's **semi-truck carrying three missiles**; and the two circular structures, which are **giant reserves of ooze or liquid**: solid tanks, deliberately small enough to leave walkways: about 3 tiles between them and 5 to the right-hand side, tested).
- The **nest area is one completely open room**; the long double lines in the sketch are its outside edges (its walls), not tunnels or a path. Its bottom wall is provisional (the sketch stops drawing). Nothing outside every room is walkable. (`outer_path` is still supported by the logic for a separate boundary band, and is `null` now.)
- **Teleport Room 1 / 2** are placeholders for a teleport feature to be added later; no teleport object is in the data.
- **Every door is a sliding access door** (`door_type`); a confirmed opening is one.
- The zone to the right of the arena (the **catwalks**) is `blocked_off_for_now`: not being developed; the player can reach its edge, not enter.
- `openings`, `connections`, `ramps`: **confirmed only.** All doors are sliding access doors; wall positions are approximate until checked in the MAP view:
  - **Crystal Chamber ↔ Teleport Room 1**, and **Teleport Room 1 ↔ Observation Deck** (the deck is treated as ground level for now, so no ramp is needed);
  - the **Front Lobby** has **two doors to the hallway, one each side of the reception desk**; the **Bathroom** (the old unlabelled room) has a door to the lobby and a door to the hallway;
  - the **glass Show Room** has a door in its west glass onto the hallway;
  - the **arena's door** at its top-left corner onto the hallway, which runs round the lab and ends at a **door into the Crystal Chamber**;
  - the **Teleport Stair Room** (raised, door to Teleport Room 2) and its **curved staircase down to the hallway** (an open stair mouth, no door);
  - the **narrow passage** (`lab_passage`) joining the **Experiment Lab** to **Teleport Room 1** through two doors (the lab's only way in).
  The catwalks (blocked off) and the nest area are the only rooms with no door.
- **The lab is windowed off:** the Experiment Lab is an enclosed room inside the gridded floor; its walls facing the hallway are `windows` (glass: see-through, solid to movement). Its only way out is the passage to Teleport Room 1. **The nook where the Crystal Chamber, the hallway and the lab passage met is gone:** Teleport Room 1 took it in as a tidy alcove, so the hallway's north-west end is a clean dead end at the chamber's door. (A purpose-made nook for turrets can be carved there later.) The hallway is a **C** (the lab and passage cut the ring open on the west): arena door, east side, north side, chamber door. The hallway is at least 2.5 tiles wide on every side of the lab.
- `candidates`: what the sketch suggests (14 connections, 4 ramps/stairs) with the evidence. They do nothing until moved into the lists above by hand.
- `levels`: ground < raised (observation deck, catwalks). Heights are unknown.
- `external_exits`: arrows leaving the map (further dungeons, front entrance, further nests) and the BLOCKED PATH. None is a connection.
- `unresolved`: the list of what still needs the user.

## Rules enforced (`facilityValidate`)
no overlapping rooms; nothing outside every room walkable; the arena and the nest area have a wall on every edge and agent walks from inside them never leave; a flood of the floor from each room reaches nothing
that no confirmed connection joins; a connection between two levels needs a ramp; an opening with no connection is flagged.
Queries for when it is wired in: `facilityWalkable`, `facilityCanStep`, `facilityMove` (slides along walls), `facilityRoomAt`, `facilityComponents`, `facilityReachable`.

## Debug view
The **MAP** button on the dock, **F3**, or `?facility` in the URL. An isometric overlay with its own camera (drag to pan, wheel or pinch to zoom, FIT) and layers: OUTLINES, COLLISION (the arena perimeter is
pink, the nest area's edges grey-blue, liquid reserves violet), OPENINGS (`?` = an unconfirmed candidate, `R` = a possible ramp; tap one for its evidence), ELEVATION, NAV (green = confirmed link, dashed amber = candidate).

## To confirm before it is wired into play
see `FACILITY_MAP.unresolved`: the scale, every doorway, elevation heights and ramps, what the liquid reserves contain and whether their stairs lead to a rim, the nest area's entrances and bottom wall, the room names.
Then: re-home zones, nests, the power unit, spawns, hunters and saves onto the rooms (decisions for each), and replace the row-clamp movement bounds with `facilityMove`.

## Play (stage 1: a walkable facility)
Enter from the MAP view (**PLAY**) or with `?facilityplay` in the URL; **FACILITY · EXIT** (top left) reloads into the strip game. A facility session writes nothing to the save (storage writes are switched off for it), so the strip game's save is exactly as it was.
- **World:** one floor tile per walkable cell, from the **snapped** copy of the map (`facilityBuild({ snap: true })`: every corner moved onto the tile grid, doors at least two tiles wide; the authored data is never changed). The strip's world generation does nothing while it is on.
- **Movement:** a tap finds a path through the doors (A\* over tile centres, smoothed by line of sight); the player follows its waypoints; **every mover** (player, followers, clones, enemies) goes through `facilityConstrain`, so walls, glass, the desk, the truck and the vats hold; followers and clones steer round walls to the next waypoint (`facilitySteer`, hooked into `followPlayer`, `_walkStep` and `_moveToward`). A body keeps 0.3 tiles from a wall.
- **The navigation layer (how the squad moves):** the AI still walks in straight lines toward what it wants; after each unit moves, `facilityReroute` works out what it was heading for (you, the crystal, its job's target, its enemy, a foe or friend near) and, if walls stand between, takes the same step along the planned route instead. Routes are planned with a wider margin (0.45) than the walls enforce (0.3) so a unit never grazes a corner or a door post; a waypoint is passed only when the next one is in sight; a unit that is stuck for 40 frames replans and for 100 is moved onto the nearest open cell of its route. A follower is "near" you only if it can SEE you (a wall between means it keeps walking the route however close it measures), the EMPATHETIC lean is ignored where it would aim behind a wall, and a follower far from you hurries (up to ~4x) so the squad keeps up across the big map. A technician on its post, a worker and a unit on an order of its own do not hurry.
- **Drawing:** wall pieces (solid, rock, glass), sliding-door frames, prop cells (desk, semi-truck with its missiles, liquid vats, the lab tank) and the two wall fixtures are depth-sorted into the game's own draw list; a wall between the camera and the player turns see-through.
- **Spawn:** you and three followers start in the Crystal Chamber beside the crystal. Three ants wander the arena as a combat/wall test (they are not the facility's enemies).
- **Not running yet (they come over one at a time):** zones, nests, waves and enemy spawning, the wall power unit, build/zone kits on the facility, saves, the day/night clock. Each needs a decision about where it lives in the facility.
- **Known rough edges:** no per-room floor look yet; enemies chase straight (they slide along walls rather than path); jobs that walk (work, haul) only steer round walls where they use the shared step helpers.

## Elevation (drawing only)

`levels` in the map give each level a height in tiles: the arena is sunken (-1.8), the ground is 0, the stair room and Teleport Room 2 are raised (1.6), and the observation deck and catwalks are higher still (3.2). A `ramp` may carry a `zone` (a rectangle, the axis it slopes along, and the two coordinates where the height equals `between_levels[0]` and `[1]`); `facilityHeightAt(x, y)` returns the room's height, or the slope inside a zone. A zone with `steps: N` is a little staircase: the height is quantised into N flat treads, and each tread tile draws a prism from the lower floor up to the tread (so the risers show). The arena door has 5 steps down, the deck door 5 steps up; the curved stair room staircase stays smooth. Every connection across levels names its ramp (validated), and the validator rejects a level with no height or a bad zone.

Movement stays flat. Only drawing is lifted: floors, actors and facility items rise by `height * 34 px`, the camera rides the player's floor, taps are corrected for the lift (`facilityPickLift`), and a wall is drawn up to the higher of the two floors it separates. All lift hooks are guarded by `facilityPlay`, so the strip game never lifts.

Known limits: effects, projectiles and health bars still use the flat projection (they sit a little off on a sloped floor).

## The dressing (floors, decor, furniture)

The rooms are filled out so the facility does not read as a hollow shell. Everything here is data in `js/facilitymap.js` (`floors`, `decor`, and more `props`), compiled and validated by `js/facility.js`, and drawn by `js/facilitydecor.js`. It is paint and light plus solid furniture: nothing else about movement changes.

- **`floors`**: each room's floor covering (carpet, plate, tile, labtile, concrete, grate, polished, wood, sand), painted over the game's floor tile by the tile's own draw (`facilityDrawFloorOn`), so a unit standing on a tile is always drawn over it. A tile's static marks are painted once into a small sprite and stamped; steady lights are baked in, and only flickering lights are painted live.
- **`decor`, on the floor**: `rug`, `hazard` stripes, `lane` lines, `arrows`, `cables`, `ring`, `stain` / `puddle` / `scorch`, `papers` / `debris`, `light` pools, `tint`. Floor decor is not snapped to the grid.
- **`decor`, on a wall**: `poster`, `vent`, `pipe`, `wall_light`, `screen`, `board`, `whiteboard`, `exit_sign`, `clock`, `graffiti`, `panel`, `banner`, `mirror`, `shelf`, `sign`, `hazard_sign`, `cable_run`, `window_blind`, and the rock / steel kinds `crack`, `vein`, `beam`, `chain`, `claw`, `ooze_drip`, `lamp`, `ladder`, `scoreboard`, `plate`, `moss`, `bulbs`. The camera sees a wall's +y / +x face, so a piece of wall decor names the room on THAT side (the lobby's south wall faces the hallway). The validator checks the side, that it is on a real solid wall (not glass or a gap), and that it is not across a door (an exit sign, pipe, banner, light or sign may be). Wall decor sorts just after the wall pieces under it (`depth`).
- **Furniture** (solid, in `props`): plant, vending, cooler, couch, table, pingpong, crate, crate_stack, barrel, locker, cabinet, bin, sink, stall, pallet, barrier, generator, console, display_case, telescope, floodlight, teleporter, beanbag, cart, desk, rail. Small pieces draw the floor under them (their tile is solid, so the game draws none).
- **Authoring.** Positions are sketch pixels like everything else; on the 20 px grid a tile cell k is [20k-10, 20k+10]. The dressing is authored on the snapped tile grid the game plays on, so the decor checks run on the snapped copy (`facilityValidateDressing`). A piece that stands in an aisle or a door's clear zone fails the existing walkability and doorway tests, and a flood from the crystal must still reach nearly every floor tile of every room.
- **What is placeholder:** the products in the show room's display cases (a coloured glow), the wording on signs (a few bright bars), the poster art, and the lobby sign.

### The arena's walls and the catwalks

The arena's rock edge is diagonal on the tile grid, so decor on it is given on the wall line itself (not snapped); the validator takes the camera-facing side of any wall (towards larger x + y) and checks the room is there. The north rock faces the arena and carries moss, cracks, glowing veins, claw marks, chains, a timber support, caged lamps, string lights and the arena scoreboard. The south and east rock face away from the arena, but the camera sees that outer face in front of the arena, so it is dressed too: set `outside: true` and the validator checks the room is BEHIND the wall instead. The catwalks are scaffolding, not a room (see below): they carry painted lanes and arrows, light, a control booth (consoles, a chair), PA speakers, floodlights, cable drums and a generator on the deck, but no wall decor.

### Floor under the walls, and walls that do not fade

- **No holes.** Floor tiles are drawn only for walkable cells, so where a wall met the floor on a diagonal (the arena's rock) a black gap showed. `_fpFillCells` (js/facilitydecor.js) adds drawing-only FILL cells: any cell a room even partly covers gets that room's floor, which runs in under the wall and is hidden by it; and the pocket of void behind the arena's north rock (between the rock teeth and the hallway, up to 3 tiles) gets the arena's floor. The void beyond the south and east rock is NOT filled: it is in front of those walls. Fill cells are never walkable, are drawn as `fill` items sorted just before the walls (`depth`), and carry the room's floor marks. A wall whose camera-facing side looks onto a lower filled floor reaches down to it (`drop`, the skirt).
- **Walls never turn translucent.** A wall in front of the player used to fade out. It is now cut down, opaque, to a low parapet as the player comes within about 3 tiles (`_fpCut`: 0 beyond 3.2 tiles or behind the player, 1 within 2), so nothing behind it is hidden. Wall decor and fixtures on a wall that is cut down are not drawn while it is. Glass is left as it is.

### Rock formations; walls never react (supersedes the parapet and tall-rock rules above)

- **Walls do not react to the player.** They never fade, shrink or cut down when the player comes close. (An earlier version faded them, then cut them to a parapet, then towered the rock; all removed. A wall in front of the player can hide them, and that is accepted.) The floor-fill and skirt rules above still apply.
- **Rock** (`_fpDrawRock`) is a brown face with strata, boulders and cracks, and a ragged rocky top edge with a lighter lip. **Back rock** (the camera sees the arena in front of it: the north rock) stands 120-170 px, its top in shadow as if it overhangs. **Front rock** (the arena is behind it: the south and east rock) is lower, 70-130 px, and the rock carries on DOWN below its base, fading to black, so the void beyond it is rock too. Heights come from the position only (`_fpRockHeights`), so the skyline is ragged but identical every frame and for every viewer.
- **The cap (a burrow).** Back rock has a 3-D top: a flat rock roof running back, away from the camera, from the rocky lip to the wall behind it (`it.cap`, found in `_fpRockSides` by marching back until a room is reached: the hallway's south wall for the north teeth). Its far edge meets that wall at the wall's top, so the pocket behind the rock reads as covered, a burrow; a thin spur with the arena on both sides gets a short cap. Front rock has no cap.
- **Caps all round.** Front rock (the south and east rock) has a cap too: a 1-tile-thick rock roof running back toward the arena from its craggy lip, with the same pits and a dark seam on the inner edge. Every rock wall piece has a cap.

### The catwalks are scaffolding

The catwalks are not a room but an open steel deck at the top of the arena's east side, on legs. The map keeps their polygon (and so the collision) and marks the room `structure: "scaffold"`; the drawing then treats it as scaffolding (`_fpScaffoldMarks`, `_fpDrawRail`, `_fpDrawFrame` in js/facilitydecor.js):
- each wall piece of the catwalks is drawn as a deck edge: a fascia under the floor, a kickboard, a post every tile and two rails (yellow top rail), not a solid wall; so there is no wall decor on them (it was removed);
- legs: an open frame (posts every two tiles, beams, X braces) runs down from every deck edge to the arena floor, except the west edge, which the arena's own `railing_wall` carries: that wall is drawn as the same open frame from the arena floor up to the deck, so you see through it;
- the deck's floor, lanes, light and furniture are unchanged. The catwalks are still blocked off for now.

### The deck's cliff and the rock beside it

The observation deck is cut into the rock: the arena's own pane of the deck window (the lower glass the arena owns, seen below the deck's glass) is drawn as a THICK ROCK FACE (`_fpDrawDeckCliff`), from the arena floor up to the underside of the deck, with strata, boulders, a crack and a lit lip under the deck. The arena rock at each end of the window rises to the deck's wall top (`it.dk`, tapering back within 1.5 tiles), so there is no gap between the deck and the rock.

The cliff face is 3-D: a dark strata face with cavities (dark pits with a lit lower lip) and a crust of lumps and ledges standing out of it toward the camera (five-sided, low-poly: lit tops, mid sides, one flat lit facet, a shadow beneath), layered up the face, with a heavier overhang under the deck's lip and rubble at the foot. The lumps come from the wall piece's position, so they are the same every frame.
