# The permanent facility (authored map)

**Status: traced and validated, shown in a debug view, NOT yet wired into play.** The game still runs on the zone strip until the geometry below is confirmed.

Source: the hand-drawn top-down floor plan and `conduit_facility_map_spec.json`. The plan is traced into `js/facilitymap.js` (data only); `js/facility.js` compiles it into collision and
navigation, validates it, and draws the debug view. Edit the data file to change the facility; no gameplay code names a room or a coordinate.

## Data (`FACILITY_MAP`)
- Coordinates are **sketch pixels** (the photo, origin top-left). `scale.px_per_tile` (first guess: 20) turns them into world tiles: calibrating is one number. The sketch grid is not a tile size.
- `rooms`: explicit polygons with a `level` and a `status` (`traced` / `approximate` / `unconfirmed`). Every edge is a wall unless a CONFIRMED opening is cut into it.
- `props`: solid things in rooms (benches, the arena machine, the two circular structures; the structures' collision is provisional).
- `outer_path`: the band round the nest area. Boundary only: drawn, solid to movement, `walkable: false`, `navigation_link: false`, in no connection.
- `openings`, `connections`, `ramps`: **confirmed only, and all three are empty.** Nothing has been confirmed, so every room is sealed.
- `candidates`: what the sketch suggests (14 connections, 4 ramps/stairs) with the evidence. They do nothing until moved into the lists above by hand.
- `levels`: ground < raised (observation deck, catwalks). Heights are unknown.
- `external_exits`: arrows leaving the map (further dungeons, front entrance, further nests) and the BLOCKED PATH. None is a connection.
- `unresolved`: the list of what still needs the user.

## Rules enforced (`facilityValidate`)
no overlapping rooms; the outer path walkable nowhere and in no link; the arena has a wall on every edge and 1200 agent walks from inside it never leave; a flood of the floor from each room reaches nothing
that no confirmed connection joins; a connection between two levels needs a ramp; an opening with no connection is flagged.
Queries for when it is wired in: `facilityWalkable`, `facilityCanStep`, `facilityMove` (slides along walls), `facilityRoomAt`, `facilityComponents`, `facilityReachable`.

## Debug view
The **MAP** button on the dock, **F3**, or `?facility` in the URL. An isometric overlay with its own camera (drag to pan, wheel or pinch to zoom, FIT) and layers: OUTLINES, COLLISION (the arena perimeter is
pink), OPENINGS (`?` = an unconfirmed candidate, `R` = a possible ramp; tap one for its evidence), ELEVATION, NAV (green = confirmed link, dashed amber = candidate).

## To confirm before it is wired into play
see `FACILITY_MAP.unresolved`: the scale, every doorway, elevation heights and ramps, the role of the arena's circular structures, the nest area's entrances, which room holds the teleport, the room names.
Then: re-home zones, nests, the power unit, spawns, hunters and saves onto the rooms (decisions for each), and replace the row-clamp movement bounds with `facilityMove`.
