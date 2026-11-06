# The Flux Technician's object movement (replacing Telegrab)

- **Status:** **Designed** (the owner's roadmap, `NEXT-PHASE-ROADMAP.md` §2, §3, §8, §9, §11). **Not built.** Registered with the roadmap as a future update, 2026-11-06.
  - This document holds the approved rules in brief, with the roadmap as their source, and **the study of the code** the owner asked for on 2026-11-06 ("do extensive work to understand the flux technician's new mechanic"): what the game already has for this tool, what it lacks, what would break, and what must be decided.
  - Nothing here is a decision unless it is quoted from the owner or the roadmap.
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-06
- **Branch/build context:** studied on `claude/start-game-project-HSh7Z` at build `2026-11-06a` (commit 7a9f992, with the roadmap merged from main). Read-only: no code was changed. Four code audits, each checked against the code; three of them backed by in-memory probes of the real map (marked **[probe]**). **[code]** means read in the source; **[inference]** means reasoned from it.
- **Related docs:** `NEXT-PHASE-ROADMAP.md` (the plan), `TECHNICIANS.md` (the technicians' abilities, Telegrab today), `FACILITY.md` (the map, movement), `SEWER-QUEST.md` (the Sewers' puzzle that uses Telegrab), `DECISION-LOG.md`, `OPEN-QUESTIONS.md`

## 1. Intent

The roadmap (§1, §2.1): "establish a reusable environmental manipulation system for the Flux Technician." Flux "should give the player tactical control over existing environmental objects. It should support navigation, route manipulation, defensive positioning, and environmental puzzle-solving." It is "an object manipulation tool, not a terrain-editing tool", and it "should provide tactical options without becoming a universal solution to every obstacle." It is built and proven in a neutral test room first, then the Sewers are designed around it ("Build the tool first. Prove its tactical value second. Design the environment around it third.").

## 2. Approved design (the roadmap; the owner's)

- **The flow** (§2.2): activate, then select an eligible object (an ineligible one is not selectable), then a **placement grid** shows the valid and invalid positions, the movement allowance, the object's footprint and its rotation options; choose a destination; rotate in 90° steps where allowed; validate the whole footprint and every collision; confirm. **Cancelling, or choosing an invalid destination, leaves the object where it was**: "Invalid placement must never partially move or corrupt an object."
- **The rules** (§2.3): up to **2 tiles** from the object's original position; certain authored objects up to **3**, assigned object by object and never a general increase; rotation in 90° steps; measured from the original position for that move; no chaining moves to extend the range; the entire footprint must fit; occupied tiles, blocked terrain and actor collisions are invalid.
- **Footprints** (§2.4): one-tile and two-tile objects; for two tiles, the first tile chosen shows the new footprint and the second required tile, with a fragmented or flashing preview, and the move commits only when both form a valid placement. The validation is designed to take larger objects later.
- **Properties** (§2.5; "proposed data-contract names. Adapt them to the existing code architecture"): `movable`, `rotatable`, `footprint`, `movementRange`, `blocksMovement`, `blocksLineOfSight`, `providesCover`, `traversable`. Not every object is movable; structural walls, fixed architecture, major infrastructure and oversized objects normally are not. "A movable object does not automatically provide cover, block enemies, or create a traversal route."
- **Transactional placement** (§8.2): save the original, compute the proposal, validate the footprint, check the world and the actors, commit, update every affected system; otherwise keep the original. Never an intermediate state.
- **Limits** (§2.1, §11): "Flux does not create bridges, alter terrain, manufacture objects, or retrieve arbitrary distant items." No movement chaining; no one-off logic for the Queen; not every object movable.
- **Telegrab is retired** from the design (§12.6: "Do not reintroduce Telegrab"). Flux damage has "a separate design direction involving percentage-of-target-health scaling; its scope and exact values remain open."

## 3. Must-have requirements (from the roadmap's acceptance criteria)

- [ ] Flux reliably selects, moves and rotates eligible objects; ineligible ones cannot be selected.
- [ ] The standard 2-tile and authored 3-tile ranges are enforced, measured from the original spot, with no chaining.
- [ ] One-tile and two-tile footprints validate as a whole; the two-tile placement is atomic.
- [ ] Invalid placement and cancelling never change the object.
- [ ] Collision, sight, cover and pathfinding update correctly after a move; actors are never left inside an object.
- [ ] Enemies recover from a blocked route; no unintended permanent trap.
- [ ] Repeated use does not accumulate range or destabilise pathfinding; save and load do not corrupt positions.
- [ ] It is useful without trivialising every obstacle.

## 4. Non-goals

Creating terrain, bridges or new objects (bridges are the Ice Technician's: `NEXT-PHASE-ROADMAP.md` §14); making every object movable; a Sewers-only or Queen-only mechanic; stealth (removed 2026-11-06).

## 5. Optional / future ideas

None approved. The options in §11 are for the owner to choose from.

## 6. What the game has today, and what it lacks (the study, 2026-11-06)

### 6.1 The objects

- **[code]** Every solid object is one entry in `FACILITY_MAP.props` (`js/facilitymap.js` from line 162): **164 in all**, each `{ id, room, shape: rect | circle | poly, … kind, status, note?, cargo? }` in sketch pixels (20 to a tile). They are compiled into snapped solids at start (`js/facility.js` 113–144). **No entry stores a facing, a sprite, a footprint or any flag**: the sprite is chosen from `kind` and size (`js/propsprites.js` 114–137).
- **[code]** "Collision is on for all of them" (`js/facilitymap.js` 161): **every prop blocks walking**.
- Solids by room **[probe]**:
  - **the arena**: 21 (the truck, 5 × 11; two liquid tanks; 9 floodlights; 3 barrels; 3 crates; a crate stack; two 2 × 1 barriers);
  - **the Sewers**: 11, and **none of them loose furniture**: three river pieces and two pools (the water is solid), three gates, the boss gate, the rubble choke and the purifier mount;
  - **Cold Storage**: 3 (the freezer bank, 10 × 3; two toppled racks, tilted polygons);
  - the rest: the lobby 19, the hallway 21, the Armory 16, the catwalks 14, the Crystal Chamber 11, the lab 9, the show room 9, the teleport rooms 8 and 6, Security 8, the deck 8.
- **[code]** Not solid: the 389 decor entries (debris, junk, eggs, stains, lights), the rubble piles (drill targets) and the tank bridges.
- **Footprints [code]:** there is no footprint field; occupied cells are found by testing which cell centres fall inside the shape (`js/facilityplay.js` 486–490). 38 solids cover more than one cell. The two-cell ones are the two barriers, `table_1`, `vending_5`, `cabinet_1`, `generator_1`, the Armory terminal, the Armory cart and the purifier mount (three of those are stations). Circles and the tilted racks do not fit a tile footprint.
- **Anchored objects [inference]:** stations, relays, the sentries, the tanks under their bridges and the purifier mount (which also fixes the Queen's post, `js/bosses.js` 37) would break if moved, so they would be immovable.

### 6.2 Collision, sight and cover

- **Walking [code]:** a point stands when it is inside a room, outside every solid not marked `open`, and 0.4 tiles from a wall (`facilityStandOk` → `facilityWalkable`, `js/facilityplay.js` 407; `js/facility.js` 178–190), looked up through a 4 × 4-tile bucket index built once (`_ix`, `js/facility.js` 159–171). Play builds two copies of the map: F for bodies (`FP_BODY` 0.4) and P for planning routes (`FP_PLAN` 0.45) (`js/facilityplay.js` 17–18, 372–373).
- **Sight is walking [code]:** `_fpLos` samples a line every 0.25 tiles for walkable floor (`js/facilityplay.js` 40–45). **Every solid blocks sight exactly as it blocks movement**: a low barrel, glass and the river alike. Sight gates the auto-lock, prey choice, the technicians' abilities (aims, the drill, FAULTLINE's start), BURROW STRIKE, the Technomancer's and Player cards' checks, the clone's pounce and PINBALL.
- **Shots ignore objects [code]:** projectiles never test walls or props; only a Photonic Shield stops enemy shots (`js/game.js` 1157–1193). A bite reaches 1.5 tiles (`js/combat.js` 8), so **it reaches across a one-tile object**.
- **No cover system [code].** The nearest things are the Photonic Shield (timed lines that block enemy steps, shots and bites) and the spiders' hiding spots behind crates and barrels (`js/facilityspawn.js` 156–190).
- **So [inference]:** the roadmap's distinction between blocking movement, blocking sight, giving cover and being passable (§3.3: "Do not treat these properties as interchangeable") has nothing to build on today; it would be new.

### 6.3 Movement and pathfinding

- **The player [code]:** a tap is snapped to the nearest planning cell; the route is **A\*** over tile centres, eight directions, no corner cutting, refused at once if start and goal are on different stretches of floor, then pulled tight by line of sight (`js/facilityplay.js` 46–119). The route is never re-checked during a walk, and the player has no stuck recovery.
- **Followers and creatures [code]** share `facilitySteer` (`js/facilityplay.js` 126–149): straight at the target when in sight; otherwise the route, replanned when the next waypoint drops out of sight, the goal moves, or after 360 frames, at most three plans a frame. A unit pressed against something drops its route after 40 frames and is moved to the nearest open cell after 100 (`_fpUnstick`). A follower shut in a pocket of 30 cells or fewer is moved beside the player (`js/facilityportals.js` 94–110). Raid ants go for the nearest standing turret by straight-line distance (`js/antraids.js` 93–98); a rooted boss never steps.
- **Built once and stale after a move [code]:** the bucket indexes of F and P; `cells` and `cellsP`; the route caches `edges`, `comp` (the floor's stretches) and `paths`; `spawnCells`, `roomCells`, `fromCells`; the spiders' cover; the portal arrival cells; the stations' and relays' copies of prop boxes; the prop draw items; the floor build; every route in flight.
- **The probes [probe]**, on the real map in memory:
  - a crate moved three tiles **was intangible at its new spot** (read as walkable) until its bucket index was rebuilt;
  - a two-tile object across a two-tile doorway **sealed two of the three doors tried**: with stale caches the replanned route still ran through the object; with the caches cleared there was no route at all, or an eight-waypoint detour at the third door;
  - a body placed inside the object was **pushed out to the nearest floor, which was the far side of it**;
  - re-labelling the floor's stretches took 52 to 84 ms (3,295 cells, Node on a desktop; an order of magnitude, not an iPad figure).
- **What each would do if a door were sealed [inference]:** the player presses against it until the next tap; followers and hunting creatures loop (press, replan the same route, a move to the nearest cell at 100 frames) while the caches are stale, and detour once cleared; a **raid ant with no route is stuck indefinitely** (the clearest permanent failure); only a follower in a small pocket is rescued.
- **The one runtime change that exists [code]:** `facilitySolidOpen` (`js/facilityplay.js` 75–87; the rubble choke, the boss gate, Side Quest's gate) marks a solid open on both copies, adds the newly walkable cells and clears `comp`, `edges`, `paths`, `spawnCells` and `roomCells`. **It only opens**: nothing closes a solid, moves one or removes floor.

### 6.4 Drawing

- **[code]** Each occupied cell of a prop is one draw item, built once with its neighbour faces, floor lift and a seed (`_fpPlaceStatics`, `js/facilityplay.js` 468–521), re-sorted by depth every frame. The floor build (`floorOps`, `underOps`, fills, the painted tiles) skips solid cells (`js/facilitydecor.js` 63–148, 401–416). The world's column index only handles appends (`js/game.js` 374–394).
- **No rotated art [code]:** each prop sprite is baked facing one way, front to the camera, back undetailed (`design/props/BRIEF.md`); the sprite is picked by the box's size, and a size with no variant falls back to any variant (`js/propsprites.js` 134, 142), so a turned couch would draw the wrong sprite. Only the console has a long-x and a long-y variant (1 × 3 and 3 × 1). **[inference]** Four facings need new baked variants (`design/props/bake_props.js` could turn the models; it needs three.js and a browser).

### 6.5 The ability framework, and where the tool would fit

- **[code]** `TECH_ABILITIES` (one row an element: `id, name, short, icon, col, aim[], use(f, picks), ask`), `TECH_ABILITY2` (a second ability by form: FAULTLINE), `techAbilityCan` / `techAbilityUse`, `techCooldown` (the cards' ABILITY COOLDOWN and DOUBLE CELL), the join wait; the aim state `techAim { mode, f, ab, site, step, picks }` (+ `stroke` for a path); five aim kinds: follower, enemy, spot, item, path; the prompt bar `#techAim` with ✕ CALL OFF; chips on the squad cards; INFO's ABILITY section (`js/techabilities.js`, `js/party.js`, `js/unitinfo.js`).
- **[inference]** FAULTLINE's path aim is the model: an aim kind that takes its own taps and does not fire on its last pick. The tool would be new aim kinds (an object, then a place), with the chosen object, destination, rotation, second tile and a cached set of valid tiles **kept in the aim, never on the object**, so every way out (✕, the chip again, Escape, a cancelled touch, a reset) leaves the world untouched. The cooldown would start only at commit, as the launcher's does. The grid would draw through the per-tile hook (`techDrawOnTile`, which today returns early unless a frost patch or a pool exists; and the floor hook runs only on walkable tiles, so blocked tiles need another draw path), with validity computed once per object and rotation, not per tile per frame.
- **Rotate and confirm need new controls [code: none exists].** Today an aim has no confirm step (the last pick fires); confirm patterns exist elsewhere (the launcher tag tapped twice, EXILE's two taps, the class picker's CONFIRM). No two-finger gesture exists.

### 6.6 Input on touch

- **[code]** `js/input.js` keeps **one global press**: no `pointerId` or `isPrimary` tracking beyond `setPointerCapture`.
- **[inference, from the code; not run]** A second finger re-runs the press handler. During a FAULTLINE stroke that restarts the stroke, and the other finger's release then falls through to an ordinary tap (`handleInput`). This touches the build now on main, not only the future tool. A likely small fix: follow only the pointer that started an aim's press.
- For the tool, the rotate options (§11) avoid gestures unless the input learns to track pointers.

### 6.7 Telegrab today, and what retiring it touches

- **[code]** Telegrab is the flux technician's ability (`TECH_ABILITIES.flux`, `TECH_AB.grab`; `techItemAtScreen`, `techGrabAt`, `_techGrabTick`; its drawing and INFO).
- **It is route A of the Sewers' water-sample puzzle** (`js/puzzles.js` 16, 32–33, 41–43, 88), whose other routes are the electric technician's launcher and the fire technician's drill. Old saves can hold `how: "telegrab"` in the puzzle's record (accepted as any string; a solution row that is gone reads as none).
- **Tests that pin it:** tests/techlevel1.js (its numbers and chip), tests/sewerquest.js (the solution table and its functions), tests/series2.js and tests/series2abilities.js (as the vehicle for the cooldown cards), tests/bible.js (the Bible's live numbers). Player-facing words: the in-game guide (the START and SQUAD tabs), the Bible, `TECHNICIANS.md`, `TUTORIAL.md`, `SEWER-QUEST.md`, `COMBAT.md`.
- **No card is tied to it**; no percentage-of-health damage exists anywhere in the code (the only health-scaled number caps the hits *your* units take); **ADAPTIVE ARMOR** exists only in the roadmap.

### 6.8 Saving

- **[code]** One key, `conduit_fp_save`, version 1 (any other version is thrown away), written every 180 frames and when the page hides (`js/facilitysave.js` 11–16). **It saves no object positions.** Runtime world changes it does save: items taken, launchers, rubble hits (re-opening the choke on load), the blight pools, the quest and Side Quest (re-opening their gates), the sentries' health, the player's spot (checked and restored last).
- **[inference]** Moved objects would need a new optional key (by prop id: tile and turn), applied before the player's spot is restored, with malformed entries ignored, without bumping the version. Interiors are teleports within one map, so moves already persist across room changes; only reloads need the save.

### 6.9 The Flux follower forms (identity)

- **[code]** The flux technician's evolved form is the **GOO PROXY**, a violet goo head with two diamond-iris eyes in a spiked ring (subclass jelly; `js/evolution.js` 208–212). It is **not a saucer with legs**.
- The only saucer with legs is `img/evo/hauler.png`, the old flux worker (VOID HAULER), removed from the forms and, **since build `2026-11-02f`, Side Quest's look at the owner's word**. The roadmap's "The saucer-with-legs creature is the new Flux worker" (§12.3, item 9) conflicts with that unless the owner means a new design (`NEXT-PHASE-ROADMAP.md` §15).

## 7. Edge cases and failure behavior (what a build must handle)

- **Cancel and refusal:** nothing changes; the cooldown is not spent.
- **Actors on or entering the destination:** refuse a footprint that covers any body (the player, a follower, a clone, a creature, the Crystal); at commit, re-check, since bodies move between preview and confirm.
- **Splitting the floor:** a two-tile object can seal a standard door ([probe]). Either refuse placements that cut a stretch of floor in two (a connectivity check on the proposal), or give enemies and the player a fallback; the roadmap: "The system must not allow Flux to trap enemies indefinitely."
- **The player boxed in:** the player has no stuck recovery; a placement that cuts the player off from the rest of the map, the Crystal or a quest objective needs refusing or a recovery.
- **Rooms, doorways and heights:** a two-tile move can cross a doorway or land on stairs; each object's room, light and floor height are fixed when it is built.
- **Anchored objects:** stations, relays, sentries (whose state lives on their draw items), the purifier mount, the tanks: immovable.
- **Rotation:** non-rectangular objects (circles, the tilted racks) do not snap; objects with no turned art cannot turn until it exists.
- **Units in tunnels or flight:** BURROW STRIKE, FAULTLINE and launcher flights skip the wall checks while they run; their landing spot can become covered.
- **Spawns:** spawners prefer cells out of the player's sight, and a covered cell would qualify until the caches are refreshed.
- **Repeated use:** each move measured from that move's start; no accumulation.
- **Save and load:** applied before the player's spot; malformed or overlapping saved positions ignored; an old save has none.
- **Performance:** update only the affected tiles and caches; a full rebuild per move (3,194 draw items, about 3,420 floor tiles, a full re-labelling) would hitch on an iPad.

## 8. Acceptance criteria (the roadmap's Milestone Two)

- [ ] Valid movement works consistently.
- [ ] Invalid placement never changes the object.
- [ ] Multi-tile placement is atomic.
- [ ] Rotation preserves footprint and collision correctness.
- [ ] Enemy pathfinding updates after movement.
- [ ] The player can use objects tactically without creating permanent navigation failures.
- [ ] The ability remains useful without trivializing every obstacle.

The neutral test room (§3.5) holds a one-tile, a two-tile, a rotatable, an immovable, a movement-blocking and a cover-giving object, several enemies, a narrow passage and an objective behind an obstruction.

## 9. Implementation notes

**Not built.** What a build would need, from the study (a plan to approve, not a decision):
1. **Data:** per-prop fields in `FACILITY_MAP.props` for movable, rotatable and range; the footprint read from the cells a prop covers; sight, cover and passability as fields of their own (new behaviour: today all three are "solid").
2. **One move in the map:** a transactional `move` beside `facilitySolidOpen`: validate (range from the original, footprint, rooms and heights, bodies, the floor's connectivity), then update both map copies and both bucket indexes, remove the newly covered cells and add the freed ones (and replace the world's tile list rather than splice it, for the append-only column index), clear the route and spawn caches, drop routes in flight that cross the footprint, rebuild the prop's draw items (keeping a sentry's state) and the floor under the vacated cells. The reverse of `facilitySolidOpen` does not exist and would be part of this.
3. **The aim:** two new aim kinds (an object, then a place), the grid drawn from a cached set of valid tiles, rotate and confirm controls, the chip's states and INFO; Telegrab's block, tick, item aim and INFO removed in the same change.
4. **Art:** turned variants for the objects that may rotate, or rotation limited to symmetric ones.
5. **Save:** the optional key of §6.8.
6. **The neutral test room:** new map content (the owner's approval).
7. **Everything that pins Telegrab** updated in one change (§6.7), with the puzzle's route A settled first.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| The tool | Not built | — |
| The study's claims | Checked against the code | four read-only audits; the stale bucket index and the sealed doors reproduced by re-running their probes (scratch scripts, not in the repo) |

## 11. Open questions (the owner's)

From the roadmap (§9): the cost (charge, cooldown or a limited use); weight or size limits; which objects get 3 tiles; the rotate control on touch; the preview's look for an incomplete footprint; which materials and shapes give cover; which objects can be stepped over or used to get around; how enemies respond to a permanently blocked route; how moves persist; how followers respond to newly blocked tiles.

Found by the study:
1. **Replace Telegrab, or sit beside it?** The roadmap retires it; a second-ability slot exists (FAULTLINE's) if both were wanted.
2. **The Sewers' puzzle without Telegrab:** drop its route A, or wait for the Sewers' redesign; and what an old save's "telegrab" record shows.
3. **Which objects may move:** the arena's crates, barrels and barriers are the likeliest today; the Sewers have none, so the redesign would add authored ones (the roadmap's masonry, machinery, chitin plates).
4. **Sealing doors:** refuse placements that cut the floor in two, or let them and give enemies a fallback.
5. **Sight and cover:** today every solid blocks sight and shots ignore props; the roadmap's separate properties are new behaviour. Which objects stop shots, and does sight become separate from walking?
6. **Rotation art:** bake turned variants (which objects?), or allow turning only for symmetric ones.
7. **The rotate and confirm controls** on an iPad: buttons in the prompt bar (simplest: ⟳ ROTATE, ✓ PLACE; also a key), a tag beside the preview, tapping the preview again (clashes with the second tile's tap), or a two-finger twist (needs pointer tracking; the riskiest).
8. **The neutral test room:** a new room in the map (new content).
9. **Flux damage** as a share of the target's health: its scope (which Flux moves) and values.
10. **The saucer with legs:** Side Quest's look today, or a new Flux follower design?

## 12. History

- 2026-11-06: the owner's roadmap (PR #19, `NEXT-PHASE-ROADMAP.md`) set the design; the owner asked for this study and registered the roadmap as a future update (`DECISION-LOG.md`). Written from four code audits on build `2026-11-06a`.
