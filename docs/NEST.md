# The Ant Nest

A cavern beyond the arena's south rubble where THE ANT QUEEN lives: a place to test the player and squad combinations, and the different moves, against a huge boss ant.

Status: **In progress.** Step A **implemented and tested** in build `2026-11-07ll` (not playtested); steps B and C **designed**. Built in three steps, each its own build on `claude/start-game-project-HSh7Z`; this file says which step is built.

## The owner's words (2026-11-07)

- "Can we finally create the nest layer? [...] I want to use it to test the player and squad combinations and different moves against a boss ant that's huge."
- The way in: "the nest would be in the against the wall of the arena that the southernmost wall and it is beyond the rubble in a new room".
- The boss: **THE ANT QUEEN (new)** (the planned first-nest boss, `js/bosses.js` row `nest`).
- Her attacks: **Mandible crush, Tremor stomp, Brood call** (not the acid spray that was offered).
- Her size and toughness: **"Huge, medium fight"**: about three times the Toxic Queen's size, health for a fight of one to two minutes with a good squad.
- The testing tools: **Damage meter, Boss reset, Squad builder** (not "no deaths").
- The squad builder: **a temporary test squad**: any form, element and level for three test followers that exist only in the Nest and vanish when you leave; your real squad waits outside, untouched.
- The room: **a big egg cavern**: about 16 × 12 tiles of packed dirt and resin, egg clusters and brood holes round the edge, open floor in the middle.

## What is built where

| Step | What | Status |
|---|---|---|
| A | The room and the way in: the hole a fire technician drills through the arena's south rubble is the doorway down into the Nest; a tunnel mouth in the Nest's north wall leads back up | Implemented and tested, `2026-11-07ll` |
| B | THE ANT QUEEN: huge, her three attacks, her health for a medium fight, held to the room | Designed |
| C | The console in the Nest: boss reset (full health, a level you pick), the test squad builder, the damage meter | Designed |

## Rules (decided)

1. **The way in** is the arena's south rubble (`rubble_arena_south`, already there, drilled by a fire technician's THERMITE DRILL). Until it is drilled the Nest cannot be reached; once drilled it stays open (saved, as every drilled rubble is).
2. **THE ANT QUEEN** fights with a mandible crush, a tremor stomp and a brood call. She is about three times the Toxic Queen's size.
3. **The console's tools**: a boss reset, the test squad builder and a damage meter.
4. **The test squad** is temporary: it exists only in the Nest, is never saved, and leaves when you leave; your own squad is kept as it was.

## Chosen by the agent (provisional, the owner's to change)

- The room's name on the zone tag: **Ant Nest** (the Sewers' east end already reads *The Nest*).
- Where it lies in the map: drawn just beyond the arena's south rock and built 96 tiles south (the nest area's part of the map, far enough below the Sewers that neither is in sight of the other).
- It **takes the place of the sketch's "Nest area"** (the room id `nest_area`, which THE ANT QUEEN's row in js/bosses.js already names): an open outline south of the arena that nobody could reach, its bottom wall a guess. The owner's placement supersedes it.
- The burrow's look, the tunnel mouth's look, and every number of the queen and the tools (they are written in the step that builds them, marked provisional).

## Step A as built (`2026-11-07ll`)

- **The room** (`nest_area` in js/facilitymap.js, an interior under the arena): sixteen tiles across and twelve deep, rock walls, its corners cut on slopes; packed dirt underfoot (`FP_ROOM_STYLE.nest_area`); the colony's **eggs** in seven clusters round the edge, four **brood holes** and five sheets of **resin** on the north and west walls (the walls the camera sees), two resin pools, a dim warm light and the brood's green glow; the middle open. Zone tag: **Ant Nest**. Powered by the Armory relay, like the arena.
- **The way in**: the arena's south rubble (`rubble_arena_south`). Before it is drilled, the floor in front of it is a shut doorway: standing in it does nothing, and the rubble's own tag shows. Drilled through (a fire technician's THERMITE DRILL, as before), the hole is the doorway (`portal_arena_nest`, a portal with `rubble`): walking into it fades to black and puts you in front of the tunnel mouth inside, and **▼ ANT NEST** shows over the hole. The squad following you comes too, as through every doorway.
- **The way back**: the tunnel mouth in an alcove in the Nest's north wall (`portal_nest_arena`, drawn as a rough hole in the dirt ringed with resin, a chevron over it pointing up): you come out in front of the hole in the arena.
- **Saved**: the drilled rubble is saved (as before), so the way stays open; a new game has the rubble back.
- **Not in step A**: nothing lives in the Nest yet (no queen, no brood, no console).
- **Tests**: `tests/nest.js` (the room, its dressing, the gate shut and open, the trip down and back with the squad, the save); `tests/facility.js`, `tests/facilityplay.js`, `tests/fluxlab.js` and `tests/sewers.js` updated for the new room and doorways.

## Open questions

- Rewards for beating THE ANT QUEEN, if any (none planned while the Nest is a test ground).
- Whether the Nest's brood joins the arena's spawn tables.
