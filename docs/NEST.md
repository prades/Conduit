# The Ant Nest

A cavern beyond the arena's south rubble where THE ANT QUEEN lives: a place to test the player and squad combinations, and the different moves, against a huge boss ant.

Status: **Designed** (2026-11-07). Built in three steps, each its own build on `claude/start-game-project-HSh7Z`; this file says which step is built.

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
| A | The room and the way in: the arena's south rubble, drilled by a fire technician, opens a burrow in the arena floor down into the Nest; a tunnel mouth in the Nest's north wall leads back up | Designed |
| B | THE ANT QUEEN: huge, her three attacks, her health for a medium fight, held to the room | Designed |
| C | The console in the Nest: boss reset (full health, a level you pick), the test squad builder, the damage meter | Designed |

## Rules (decided)

1. **The way in** is the arena's south rubble (`rubble_arena_south`, already there, drilled by a fire technician's THERMITE DRILL). Until it is drilled the Nest cannot be reached; once drilled it stays open (saved, as every drilled rubble is).
2. **THE ANT QUEEN** fights with a mandible crush, a tremor stomp and a brood call. She is about three times the Toxic Queen's size.
3. **The console's tools**: a boss reset, the test squad builder and a damage meter.
4. **The test squad** is temporary: it exists only in the Nest, is never saved, and leaves when you leave; your own squad is kept as it was.

## Chosen by the agent (provisional, the owner's to change)

- The room's name on the zone tag: **Ant Nest** (the Sewers' east end already reads *The Nest*).
- Where it lies in the map: drawn under the arena and carried 64 tiles south (the part of the map the Sewers' entry left for "the nest area").
- The burrow's look, the tunnel mouth's look, and every number of the queen and the tools (they are written in the step that builds them, marked provisional).

## Open questions

- Rewards for beating THE ANT QUEEN, if any (none planned while the Nest is a test ground).
- Whether the Nest's brood joins the arena's spawn tables.
