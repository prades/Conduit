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
