# The permanent facility (authored map)

**Status: traced and validated, shown in a debug view, NOT yet wired into play.** The game still runs on the zone strip until the geometry below is confirmed.

Source: the hand-drawn top-down floor plan and `conduit_facility_map_spec.json`. The plan is traced into `js/facilitymap.js` (data only); `js/facility.js` compiles it into collision and
navigation, validates it, and draws the debug view. Edit the data file to change the facility; no gameplay code names a room or a coordinate.

## Data (`FACILITY_MAP`)
- Coordinates are **sketch pixels** (the photo, origin top-left). `scale.px_per_tile` (first guess: 20) turns them into world tiles: calibrating is one number. The sketch grid is not a tile size.
- `rooms`: explicit polygons with a `level` and a `status` (`traced` / `approximate` / `unconfirmed`). Every edge is a wall unless a CONFIRMED opening is cut into it.
- `props`: solid things in rooms (benches; the arena's **semi-truck carrying three missiles**; and the two circular structures, which are **giant reserves of ooze or liquid**: solid tanks, deliberately small enough to leave walkways: about 3 tiles between them and 5 to the right-hand side, tested).
- The **nest area is one completely open room**; the long double lines in the sketch are its outside edges (its walls), not tunnels or a path. Its bottom wall is provisional (the sketch stops drawing). Nothing outside every room is walkable. (`outer_path` is still supported by the logic for a separate boundary band, and is `null` now.)
- **Teleport Room 1 / 2** are placeholders for a teleport feature to be added later; no teleport object is in the data.
- **Every door is a sliding access door** (`door_type`); a confirmed opening is one.
- The zone to the right of the arena (the **catwalks**) is `blocked_off_for_now`: not being developed; the player can reach its edge, not enter.
- `openings`, `connections`, `ramps`: **confirmed only.** So far: a **sliding door from the Crystal Chamber onto the hallway** (on their shared wall, near its middle), and the **Teleport Stair Room** (raised, leads to Teleport Room 2 through a sliding access door) and its **curved staircase leading DOWN to the hallway** that passes the experiment lab (`r_teleport_stairs`, levels 1 to 0, an open stair mouth with no door). Their positions on the walls are approximate. Every other room is sealed.
- The experiment lab's gridded floor is both the lab and the hallway past it (not split yet). The lab bench was pulled in from the walls so the hallway runs all the way round it (at least 2.5 tiles wide on every side).
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
