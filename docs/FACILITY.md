# The permanent facility (authored map)

**Status: traced and validated, shown in a debug view, NOT yet wired into play.** The game still runs on the zone strip until the geometry below is confirmed.

Source: the hand-drawn top-down floor plan and `conduit_facility_map_spec.json`. The plan is traced into `js/facilitymap.js` (data only); `js/facility.js` compiles it into collision and
navigation, validates it, and draws the debug view. Edit the data file to change the facility; no gameplay code names a room or a coordinate.

## Theme
A **rundown facility that used to be a 2010s tech startup's headquarters**. The **Front Lobby** is the big-headquarters entrance: a big sign on its north wall and a reception desk area that leads (through a sliding door past the desk's east end) to the hallway at the back, which looks onto the glass Experiment Lab. The **Show Room** is a glass case showcasing a range of products (blank for now). The **Crystal Chamber** and both **Teleport Rooms** are walled off (solid, no glass). The Crystal Chamber has the **power / battery pack area** on its north wall.

## Data (`FACILITY_MAP`)
- Coordinates are **sketch pixels** (the photo, origin top-left). `scale.px_per_tile` (first guess: 20) turns them into world tiles: calibrating is one number. The sketch grid is not a tile size.
- `rooms`: explicit polygons with a `level` and a `status` (`traced` / `approximate` / `unconfirmed`). Every edge is a wall unless a CONFIRMED opening is cut into it.
- `props`: solid things in rooms (benches; the arena's **semi-truck carrying three missiles**; and the two circular structures, which are **giant reserves of ooze or liquid**: solid tanks, deliberately small enough to leave walkways: about 3 tiles between them and 5 to the right-hand side, tested).
- The **nest area is one completely open room**; the long double lines in the sketch are its outside edges (its walls), not tunnels or a path. Its bottom wall is provisional (the sketch stops drawing). Nothing outside every room is walkable. (`outer_path` is still supported by the logic for a separate boundary band, and is `null` now.)
- **Teleport Room 1 / 2** are placeholders for a teleport feature to be added later; no teleport object is in the data.
- **Every door is a sliding access door** (`door_type`); a confirmed opening is one.
- The zone to the right of the arena (the **catwalks**) is `blocked_off_for_now`: not being developed; the player can reach its edge, not enter.
- `openings`, `connections`, `ramps`: **confirmed only.** So far (all wall positions approximate until checked in the MAP view):
  - the **arena's door** at its top-left corner onto the **hallway** (`lab_hallway`), which runs round the lab and ends at a **sliding door into the Crystal Chamber**;
  - the **Teleport Stair Room** (raised, door to Teleport Room 2) and its **curved staircase down to the hallway** (an open stair mouth, no door);
  - the **lobby's door** to the hallway, past the reception desk;
  - the **narrow passage** (`lab_passage`) joining the **Experiment Lab** to **Teleport Room 1** through two sliding doors.
  Every other room is sealed.
- `fixtures`: wall-mounted things (the Crystal Chamber's power pack area, the lobby's big sign), on a named edge of a room, validated to sit on that wall and clear of every doorway. `wall_material` (`solid` / `glass`) per room is checked against the `windows`.
- **The lab is windowed off:** the Experiment Lab is an enclosed room inside the gridded floor; its walls facing the hallway are `windows` (glass: see-through, solid to movement). Its only way out is the passage to Teleport Room 1. The hallway is a **C** (the lab and passage cut the ring open on the west): arena door, east side, north side, chamber door. The hallway is at least 2.5 tiles wide on every side of the lab.
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
