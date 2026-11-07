# The Ant Nest

A cavern beyond the arena's south rubble where THE ANT QUEEN lives: a place to test the player and squad combinations, and the different moves, against a huge boss ant.

Status: **Implemented and tested** (not playtested): step A in build `2026-11-07ll`, step B in `2026-11-07mm`, step C in `2026-11-07nn`. Built in three steps, each its own build on `claude/start-game-project-HSh7Z`; this file says which step is built.

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
| B | THE ANT QUEEN: huge, her three attacks, her health for a medium fight, held to the room | Implemented and tested, `2026-11-07mm` |
| C | The console in the Nest: boss reset (full health, a level you pick), the test squad builder, the damage meter | Implemented and tested, `2026-11-07nn` |

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

## Step B as built (`2026-11-07mm`)

THE ANT QUEEN is the `nest` row of `BOSS_ENCOUNTERS` (js/bosses.js), the same boss framework as the Toxic Queen's, with rules of her own (`test`, `moves`). **Every number below is the agent's, provisional, the owner's to change.**

- **Her:** the ant species' boss class at **level 10**; drawn **3 times** the Toxic Queen's size; a **body 1.2 tiles** round (`bodyR`): a brawler strikes her at her edge, a technician stops at her edge instead of walking into her, a shot hits anywhere on her body. **Health 1.6 times** the boss block at her level (1,067 at level 10).
- **How long she lasts (measured in the browser):** three evolved followers at level 15, her moves off, deal her 15 to 18 a second (a fire Quillstone, an electric Thunderhead and a Thermite Burrower: 15; a Static Orb, an Ember Hood and a Hammer Slug: 18). With her moves on, the second squad, at twice the health she has now (1,334), killed her in 141 seconds without the player's own attacks, losing a follower twice (revived at the Crystal and walked back). At 1.6 times, with the player shooting too, the fight is about one and a half minutes.
- **There whenever you come down:** coming into the Nest when she is not alive (killed, or never armed) arms a fresh queen, asleep at her post in the middle of the cavern, a little south. She wakes when hit, or when one of yours comes within **2.5 tiles** of her body.
- **Held to the Nest:** when you leave it, she lets go, walks back to her post and sleeps again there, her wounds kept.
- **Her moves** (independent timers; no plain bite, no species special):
  - **MANDIBLE CRUSH**: when one of yours is within **2 tiles** of her body, at most every **6 s**: she stands rooted for **0.9 s** with a red wedge on the floor in front of her (**115 degrees**, out to 2 tiles past her body), then her jaws close on everyone of yours in it: **0.4 times her power**, crushing (32 at level 10); you lose one of your hits.
  - **TREMOR STOMP**: when one of yours is within **3 tiles** of her body, at most every **12 s**: she rears up for **1.2 s**, an amber ring on the floor out to **3.6 tiles** past her body, then the ground shakes: everyone of yours inside is hurt (**0.25 times her power**, earthquake: 20 at level 10) and thrown back; you lose one of your hits.
  - **BROOD CALL**: **15 s** after she wakes, then every **25 s**: **3 ants** (scouts and the odd striker, 5 to 3 levels under her) climb out of the Nest's brood holes and go for you; never more than **6** of hers alive.
- **Nothing paid, nothing unlocked:** she and her brood pay no shards, DNA or XP (`noReward`), and beating her does not count as a first boss for Booster Pack 2 (`bossAnyResolved` leaves a test boss out).
- **Her enemy card** reads CRUSH and her crush's strength where a creature's says BITE.
- **A knock never carries you through a doorway** (js/helpers.js `hurtPlayer`): the tunnel mouth is beside where she fights, and her hits used to shove you up it, out of the fight.
- **Tests:** `tests/nest.js` (her arming, size, body and health; waking; the crush, the stomp and the brood; held to the Nest; killed, nothing paid, a fresh queen; the knock rule; her enemy card); `tests/sewerquest.js` (the nest row now arms).

## Step C as built (`2026-11-07nn`)

The **NEST CONSOLE** (js/nestconsole.js): a console prop by the tunnel mouth, east of it (`nest_console`), a station for any class, free (`STATION_KINDS.nest_console`, js/stations.js). Walk up to it and tap it (or press E) to open its panel. Every number is the agent's, provisional.

- **THE ANT QUEEN:** what she is doing (asleep or awake, her level and health); **LEVEL** with −5, −1, +1, +5 (from 1 to 30); **RESET THE QUEEN**: whatever was left of her and her brood is cleared (nothing paid) and a fresh queen sleeps at her post, whole, at that level. The damage meter starts again with her. The level is the console's setting for this session (a reload brings her back at 10).
- **TEST SQUAD:** three slots, each a **form** (every element's Brawler, Mage and Technician unevolved, and every evolved form) and a **level** (1 to 30). Defaults: a Quillstone, a Thunderhead and a Hammer Slug at level 15. **SEND IN THE TEST SQUAD:** your squad (the followers following you; those holding rooms stay where they are) is set aside, out of the world and untouched, and the three test followers come in beside you as your squad. A form picked unevolved stays unevolved at any level. **END THE TEST**, or leaving the Nest (by the tunnel, or a fall that sends you back to the Crystal), sends them away and puts your squad back beside you as it was. Test followers are **never saved** (a save while they are in keeps your real squad), **never revived** (one that falls is gone) and pay nothing. **SEND IN AGAIN** replaces them with the picks as they stand.
- **DAMAGE METER:** on from the start. It counts what each of yours deals to the creatures of the Nest: its total, its damage a second over the fight, and by kind: **P** its primary (everyday hit or shot), **A** its alternate, **S** its special (a card attack or an Ultimate), and your own hits. It is shown on the screen at the top right while you are in the Nest, and in the panel with **TURN OFF** and **RESET**. A test follower's name carries **·T**.
- **Tests:** `tests/nest.js` (5 new checks: the console, the boss reset, the test squad sent in and saved right, the test ending, the meter); `tests/facilityplay.js` (17 stations) and `tests/fluxlab.js` (165 props) updated.

## Open questions

- Rewards for beating THE ANT QUEEN, if any (none while the Nest is a test ground: built so in step B).
- Her numbers (all provisional): her level, health, the moves' strength, timing and reach, the brood's size.
- A follower that falls in the Nest is revived at the Crystal, as anywhere, and walks all the way back: should the Nest revive it closer (a test ground)? (A test follower is not revived at all.)
- Should the console also let you pick the Ant Queen's moves to test one at a time, or the player's own class and level? (Not asked for; not built.)
- Whether the Nest's brood joins the arena's spawn tables.
