# The domains (the map's expansion)

- **Status:** The electrical domain's step 1 is **implemented and verified by tests** in build `2026-11-11d` (the door and the place, empty; not playtested). **2026-11-12, the owner's new direction (§2, 7 to 9):** the domains are narrow passages, rooms, nests, caves and instances, not big open halls; the electrical domain is to be rebuilt that way and the Nest grown out into tunnels, both with ways through that use the technicians' utilities; and a default chest. The layouts, the ways through and the chest were proposed (drafts 5 to 9, §5 and `CHESTS.md`); **approved the same day: draft 6, the Ant Nest grown out, with a spot for the volcanic layer in it (§2, 10 and 11), and the chest's look C (`CHESTS.md`)**. **Built in `2026-11-12a`: the Nest grown out (§2, 10 and 11), its ways through, low walls in its tunnels (draft 8, A) and the default chest (`CHESTS.md`)**, after the owner's "Build it" on the agent's picks for what was open (§2, 12). The electrical domain's layout (draft 5) is still open. The volcanic layer and the crystalline area are designed in part, not built.
- **Owner:** the user (creative direction); the agent (implementation support)
- **Last updated:** 2026-11-13
- **Branch/build context:** `claude/start-game-project-HSh7Z`, build `2026-11-11d` (step 1); drafts 5 to 9 after build `2026-11-11x` (nothing built for them)
- **Related docs:** `FACILITY.md` (the map, interiors and portals; the hazard containers), `NEST.md`, `TECHNICIANS.md` (the ice bridge, the launcher, REEF, the drill), `FLUX-MOVEMENT.md`, `CHESTS.md` (the default chest), `SEWER-QUEST.md` (the Sewers, built empty first), `TUTORIAL.md` (the junction)

## 1. Intent

The owner, 2026-11-11: "We're going to need some map expansions to fully integrate the map. So in the server room, there's going to be a downward staircase that stretches the entirety of the length of the room that goes into a new, deeper electrical domain that, as you get further down into it, the server room of it, it's the server racks get are like tossed on the ground and strawn about, and then there's a big open area where there's like circuitry everywhere, and then in the arena, there's going to be, or not the arena, in the nest, there's going to be a lot more development in the nest, and it's going to lead to layers, new layers, like a volcanic layer, and that'll be the fire domain, and you can convert the lava to stone, and create a path to the crystalline area, which just so happens to be the home of the flux domain."

The owner, 2026-11-12: "Okay, so the way we did the electrical domain, I'm starting to realize that that is not the way that I want my game to be designed. I want it to be narrow passages and rooms and nests and caves and instances. Also would like to create a default chest that players can find booster packs and other miscellaneous items within. But the electrical domain and the nests, I would like to expand those out with narrow passages and ways for the player to use their utilities from their technicians to get around." Then: "including but not limited to blowing up barrels to bring down or break through different obstacles, or using flux move to move an object to get it out the way."

The owner, later on 2026-11-12, of drafts 5 to 9: "I like the sea chess and I like the nest. Just make a spot for the volcanic layer to be included in the nest." ("The sea chess" read as **the C chest**, draft 9's C, the hex cache: `CHESTS.md`.)

Three new places:
1. **The electrical domain**, down a staircase from the Server Room: a deeper server room whose racks lie tossed and strewn the further in you go, then ~~a big open area with circuitry everywhere~~ (the big open area **superseded 2026-11-12**: §2, 7; the circuitry stays, in passages and rooms).
2. **The volcanic layer** (the fire domain), below the Ant Nest, which is developed further and leads down to it.
3. **The crystalline area** (the flux domain), reached across the volcanic layer's lava, turned to stone to make a path.

## 2. Approved design (2026-11-11, chosen from options)

1. ~~**The Server Room's stairs are a stairwell you fade down**, the room 3 tiles deeper, its whole north side one wide flight.~~ **Superseded the same day** by 1a.
1a. **A little door in the Server Room leads to the electrical domain** (the owner: "instead of like a long staircase in the server room that's room length long or wide, we should make it to where there's a little door in the server room that goes to the electric domain"). It is **beside the junction**, in the north wall (spot 1 of the door draft; the owner picked "1"). The Server Room keeps its size; its racks, console and junction stay where they are. Going through it fades you into the electrical domain, as every doorway does.
2. **The way down opens after the junction repair** (decided for the stairs; kept for the door): the tutorial's one repair, the MAIN POWER JUNCTION beside it (`junctionRepaired()`, js/tutorial.js).
3. **Lava turns to stone by the ice Technician's bridge.** Its ICE BRIDGE works on lava too (the owner's connected rule, `TECHNICIANS.md`). Over lava the bridge sets as stone and stays, so a path can be built pool by pool. The volcanic layer therefore needs an ice technician, as the Nest's rubble needs a fire one.
4. **Empty at first.** Each domain is built as a place first, with no creatures, as the Sewers were. Creatures, bosses and quests come next, designed with the owner.
5. **The nests descend without stairs: sloping tunnels** (the owner: "I want the nests to descend without stairs"; asked how, chose "Sloping tunnels"): the layers are joined by dirt ramps you walk straight down, with no stairs and no fade between them.
6. **The electrical domain's look is A, the cold blue server graveyard** (draft 3A, chosen from three): the Server Room's blue carried down; dark racks with blue and cyan lights, the fallen ones mostly dead; torn cables and orange sparks where they fell; the circuitry as bundles of thin blue light running through dark steel out of a few big chips.
7. **Narrow passages, rooms, nests, caves and instances** (the owner, 2026-11-12, §1): the domains are made of these, not of big open halls. "The way we did the electrical domain" (two big rooms, the circuitry a 32 × 23 hall: build `2026-11-11d`) "is not the way that I want my game to be designed". Supersedes the big open area of §1 and the shape of §5 (2026-11-11).
8. **Ways through by the technicians' utilities** (the owner, 2026-11-12): the electrical domain and the nests are expanded "with narrow passages and ways for the player to use their utilities from their technicians to get around", "including but not limited to blowing up barrels to bring down or break through different obstacles, or using flux move to move an object to get it out the way". Which obstacles, where, and their rules: proposed (§5).
9. **A default chest** (the owner, 2026-11-12): "a default chest that players can find booster packs and other miscellaneous items within". Its look is C, the hex cache (approved the same day); its rules: proposed (`CHESTS.md`).
10. **The Ant Nest grows out as draft 6** (approved 2026-11-12: "I like the nest"; drawn by `design/maps/passages-draft.js`; its sizes and names are the agent's, provisional). The queen's cavern stays as built (the test ground, the console, the queen, who stays in it; ~~superseded~~ 2026-11-12, build `2026-11-12d`: the queen lives in the Deep Brood and the console is removed, `NEST.md`); 3-tile tunnels wind out of its west and south walls to a brood chamber, the shelf (high ground), a stream cave, the old burrow, the deep brood and the larder, and to **the way down** (the sloping tunnel of §2, 5) at the south-west, where the first sketch's "further nests" arrow points. **The main way:** ① drill a collapsed tunnel (fire: the Nest's key, as its way in already is); ② shoot a flask the ants dragged down beside a cracked wall (anyone). **Side pockets, each ending in a chest:** A a REEF climb up to the shelf; B an ice bridge over the stream; C FLUX MOVE a boulder into the hollow beside it; D a resin seal that an acid flask's pool eats through (the agent's idea, in the draft as approved).
11. **The volcanic layer is part of the Nest** (the owner, 2026-11-12: "Just make a spot for the volcanic layer to be included in the nest"): the sloping tunnel goes down from the deep brood into it, inside the Nest itself (one place: no stairs and no fade, §2, 5). A spot is kept for it at the Nest's foot (draft 6, redrawn). Its lava and the ice bridge that sets as stone over it (§2, 3) are decided; its passages, caves, size and look are to design with the owner; the crystalline area lies beyond it (phase 3).
12. **Walls on the camera's side are low in tunnels and small caves** (draft 8, A, the agent's pick, taken with the owner's "Build it", 2026-11-12): in the Nest's new rooms every rock wall is a low rim, the far walls too (a tall far wall of one cave hid the tunnel behind it), and the queen's cavern's west wall, where the tunnels leave; nothing reacts. The heights are the agent's, provisional.

13. **One place to hold per domain** (2026-11-12, build `2026-11-12o`; the owner's "one checkpoint per domain and the nest": "just another place where you can have followers hold it that aren't a part of your squad"): each domain is one place to hold, as the Ant Nest is, two followers at most across its rooms (`TECHNICIANS.md`, "Rooms and recruitment"). The electrical domain's two rooms are one place now.
14. **The electrical domain's creatures** (the owner, 2026-11-13: "Begin work on a new breed of insect using 3D graphics. It's going to be a roly-poly type character that is immune to crushing, immune to slashing, and resistant to piercing. That will be electric type and will inhabit the electric domain, and a boss creature will be a predaceous diving beetle larva. Show me pictures and examples of that before you design it."): a new breed, a **roly-poly** (a pill bug), electric, in 3D; immune to Crushing and Slashing, resistant to Piercing; its domain's **boss** a **predaceous diving beetle larva** (a water tiger). **Mechs** (the owner, the same day, of the first studies: "Okay, so I want them to look more like mechs now. Like take inspiration from Zoids and get rid of the wiry aesthetics from your sketches."): armour over a mechanical frame, joints, pistons, lenses, nothing thin. **The larva boss's look is A, live seams** (the owner: "A for the larva": pale gunmetal armour, yellow energy in its joints, yellow lenses, lit jaw edges). **The roly-poly is redrawn longer, with fewer plates and more character** ("redesign the roll poly with a longer body less plates, but more character"; round 3: seven plates, a core on its back; then **no eyes and no face** (the owner: "The roly-poly should not have eyes and a face, bro. But, I mean, we're looking good on the larva for now."; round 4: a rounded armoured head); **its look B, insulator** (the owner: "B": glossy black plates, hazard-striped side panels, copper joints, amber lights)). The studies: `design/creatures/electric_breed_examples.js` (round 1, the animals, in commit `e73521a`). Nothing designed or built. Immunity is a new rule: the damage table has weak ×1.3 and resist ×0.7 only (`COMBAT.md` §7.3, js/damage.js). **Its rules: `ELECTRIC-BREED.md`** (the owner's answers: clone potential, the physical half does 0, it curls up to defend).

## 3. Must-have requirements, by phase

**Phase 1, the electrical domain** (layout pending: §5)
- [x] A little door in the Server Room's north wall, beside the junction (a doorway alcove, as the Armory's are). *(step 1)*
- [x] Until the junction is repaired, walking into it does nothing. After it, it is a doorway: a fade, and you arrive in the electrical domain with your following squad, as through every doorway. *(step 1)*
- [x] The electrical domain is an interior (as the Armory, the Cold Storage, the Sewers and the Ant Nest are), with a way back that brings you out in front of the door. *(step 1)*
- [ ] ~~Inside: the deep server room (racks standing near the door: *step 1*; toppled and strewn further in: *step 2*), then a big open area with circuitry everywhere (*step 3*).~~ **Superseded 2026-11-12** (§2, 7): inside, passages and rooms in the same order (racks standing, then toppled, then the circuitry), with ways through (§2, 8). The layout is proposed (§5, draft 5); steps 2 and 3 wait for it. The two rooms built in `11d` are replaced when it is approved.

**Phase 2, the Nest developed and the volcanic layer** (the Nest's layout approved: §2, 10 and 11; the volcanic layer's own layout to design with the owner: §11)
- [ ] The Nest's tunnels, nests, main way and four side pockets as draft 6 (§2, 10).
- [ ] The Ant Nest leads down to the volcanic layer without stairs; the layer is part of the Nest, one place with no fade (§2, 11).
- [ ] The volcanic layer has lava that nobody walks on; an ice technician's bridge over lava sets as stone and stays (saved).

**Phase 3, the crystalline area** (to design with the owner: §11)
- [ ] Reached from the volcanic layer by the stone path.

## 4. Non-goals

- Creatures, bosses, quests, rewards and recruit posts in the domains (later, with the owner; the electrical domain's breed and boss named 2026-11-13, §2, 14, not designed).
- Moving the Server Room's racks, console, junction or doors (the relay node on the wall beside the junction moves aside for the door); changing the Ant Nest's queen or console.
- Phones (not supported).

## 5. Proposed, not approved

**The new direction's drafts (2026-11-12; `design/maps/passages-draft.js` draws 5 to 8, `design/props/drafts/chest.js` 9; every size, name, place and number in them is the agent's):**
- **Draft 5, the electrical domain as passages and rooms.** You come down the little door (as built) and work south, toward the camera: **1 The Landing** (racks standing), a corridor lined with racks, **2 The Fallen Rows** (racks toppled, strewn, sparking), a crawlway, **3 The Riser** (a raised platform), steps down to **4 The Trace Hall**, **5 Chip West** and **6 The Deep Chamber** (its one huge chip; for later: a boss or a quest, not designed). Corridors 3 tiles wide, 2 at a squeeze; rooms 8 to 18 tiles across. **The main way:** ① shoot the flask beside a heap of fallen racks choking the corridor (anyone); ② FLUX MOVE a fallen rack lying across the crawlway into a niche beside it; ③ FLUX MOVE a flask that stands out of reach up to a cracked wall, then shoot it. **Four side pockets**, each ending in a chest: A drill the rubble in a side vault's doorway (fire), B ice-bridge the coolant flooding a corridor to the cooling plant (ice), C ride the launcher or climb a REEF up to the platform (electric or BLOOM), D bring down a leaning stack of racks in Chip East's doorway (anyone). It replaces the two rooms built in `11d` (`elec_servers`, `elec_circuitry`); the little door, look A and its order stay.
- ~~**Draft 6, the Ant Nest grown out into tunnels and nests.**~~ **Approved 2026-11-12, with a spot for the volcanic layer in it:** now §2, 10 and 11.
- **Draft 7, the ways through** (each obstacle and who opens it):

  | Way | Who | What | State |
  |---|---|---|---|
  | BREAK THROUGH | anyone (a shot) | a flask's blast breaks a cracked wall within its reach | new |
  | BRING IT DOWN | anyone (a shot) | a flask's blast brings down a leaning stack (racks; in the Nest, a hanging rock?) | new |
  | OUT OF THE WAY | Flux | FLUX MOVE an object lying across a passage into a niche beside it | built, a new use |
  | BRING THE BLAST | Flux, then anyone | FLUX MOVE a flask within reach of a cracked wall, then shoot it | new (the move and the shot are built) |
  | DRILL THROUGH | fire | the THERMITE DRILL through rubble or a collapsed tunnel | built |
  | BRIDGE IT | ice | an ICE BRIDGE over water (a stream; coolant in the electrical domain) | built |
  | GET UP THERE | electric or BLOOM | the KINETIC LAUNCHER's ride, or a REEF climb, up to high ground | built |
  | EAT THROUGH | anyone (a shot) | an acid flask's pool eats a resin seal | the agent's idea |

  Proposed rules for the new ones: a blast (the explosive flask's, 2 tiles, as built) opens a cracked wall or a leaning stack within its reach, **for good** (saved, as drilled rubble is); a flask comes back 60 s after it goes off (as built), so a missed shot can be tried again; a FLUX MOVE blocker has its niche within the move's 2 tiles, stays where it is moved (saved, as built) and cannot be moved back across (a place that cuts the floor in two is refused, as built). **Each domain's main way needs at most one technician, its key** (FLUX in the electrical domain, fire in the Nest); the side pockets need the others and end in chests.
- **Draft 8, seeing into a narrow passage.** A wall stands 122 px on the screen (`FP_WALL_H`, js/facilityplay.js) and the camera looks from the bottom right, so the wall on the camera's side of a 3-tile passage covers all its floor and nearly all of whoever is in it (big rooms never showed it). **A** low near walls in passages and small rooms, the far walls full height, nothing reacting (the agent's pick); **B** the near wall fades whenever you or your squad are behind it (the battle view's ghost, build `11r`, used everywhere in the tight places; walls react, which the owner turned down for the facility in `09uu`); **C** walls stay, and you, your squad and creatures show as outlines through them (the floor behind stays hidden).
- **Draft 9, the default chest:** `CHESTS.md`.
- **"Instances"**, as the agent reads the word: a place of its own behind a doorway, as the game's interiors are (the Armory, the Sewers, the Ant Nest, the electrical domain). Open (§11, 11).

**Earlier (2026-11-11):**
- ~~**The electrical domain's shape: toward the camera** (draft 2B, and the arrangement of look draft 3A, which the owner chose): you come in at the north end through the door back up; walking south, racks standing, then toppled and strewn; wide steps down into the circuitry, a big open hall in front of you. The deep server room about 24 × 18 tiles, the circuitry about 32 × 23 (the arena's size). Sizes provisional. (The other looks, B live yellow current and C a giant circuit board, were not chosen.)~~ **Superseded 2026-11-12** (§2, 7): built in `11d` as two big rooms; draft 5 keeps its direction (toward the camera) in passages and rooms.
- **The door before and after the repair:** its light red, then green, and ▼ ELECTRICAL DOMAIN over it.
- **Names:** Electrical Domain, The Deep Server Room, The Circuitry (all provisional).

## 6. Dependencies and affected systems

- Map data: `js/facilitymap.js` (rooms, `interiors`, `portals`, props, decor); `js/facilitygrow.js` (the door's re-placement, as the other doors'); `js/facilityportals.js` (`facilityPortalShut` learns the junction); the door's look (`portal_door` wall decor, as the Armory's).
- Art: new baked props (toppled server racks; the circuitry's pieces), `design/props`, `img/props`; the circuitry floor.
- Power: which relay lights the domain.
- Save: nothing new for the stairs (the junction's repair is saved); stone over lava will need saving (phase 2).
- **For the new direction (drafts 5 to 9), when approved:** the two layouts in `js/facilitymap.js` (rooms of one interior joined by their open edges; the map's validator); a blast that opens a solid (js/hazards.js, `facilitySolidOpen`, saved as drilled rubble is); FLUX MOVE blockers (a `flux` field, js/fluxmove.js) and their niches; the walls on the camera's side of a passage (draft 8); THE ANT QUEEN held to her cavern, not just the Nest (js/bosses.js); the chests (`CHESTS.md`); `tests/elecdomain.js` and `tests/nest.js` rewritten for the new rooms.

## 7. Edge cases

- A save from before the change loads as before (the Server Room keeps its size).
- The junction repaired while you stand at the door: it opens at once.
- `?attract` (the website's background) uses no doorways.
- Creatures cannot use a doorway (as now).

## 8. Acceptance criteria (phase 1)

- [ ] Before the junction repair the door does nothing; after it, it takes you and your following squad into the electrical domain, and the way back brings you out at the door.
- [ ] The map's validator passes (doorways in pairs, the domain reached from its doorway, nothing walkable outside a room).
- [ ] The Server Room's racks, console, junction, doors and pickups are where they were.
- [ ] The full test run passes.

## 9. Implementation notes

**Step 1, build `2026-11-11d`: the door and the place, empty.**
- **The door**: `portal_lobby_elec`, an alcove in the Server Room's north wall at x 680 to 720 (sketch px), its east side against the junction; `needs: "junction"` keeps it shut until `junctionRepaired()` (js/facilityportals.js `facilityPortalShut`), and its tag then reads ▣ ELECTRICAL DOMAIN · NO POWER: REPAIR THE JUNCTION. The pipe on that wall is in two and the relay node moved west, clear of the alcove. Walking to use a station never ends on a doorway's floor (js/facilityplay.js `facilityApproachTile`): the junction's repair spot could have been the doorway, and the repair would have taken you down at once.
- **The place**: two rooms of one interior (`interiors`, both `under: "front_lobby"`, the same `offset`, 128 tiles east, beyond the Armory's part of the map): `elec_servers`, the Deep Server Room (24 × 18 tiles, the arena's level, -1.8), and `elec_circuitry`, The Circuitry (32 × 23 tiles, a new level -2 at -3.0), joined by `open_elec_steps`, twelve tiles across, and the ramp `r_elec_steps` (4 steps over 4 tiles). The deep server room's south edge is a ledge with a rail (`deck_rail`), the circuitry's under it open.
- **The look so far**: dark steel and blue light (`FP_ROOM_STYLE`), as dim as the Server Room (`FP_ROOM_DIM` 0.42), on the Server Room's relay; six racks standing near the door (the office family's `server_rack.1x5`, as upstairs), blue lights, cables, pipes and screens on the north wall. Nothing lives there.
- **The map's rules** (js/facilitygrow.js, js/facility.js): a door or steps between two rooms of one interior are carried with it; such rooms may join each other, never a room outside, and one doorway into any of them does for all.
- **Chosen by the agent, provisional**: the sizes, where the domain lies in the map, the circuitry's height, the four steps, the dimness, the relay, the racks' places, the names on the zone tag.

**The Nest grown out, build `2026-11-12a`** (js/facilitymap.js; the agent's sizes and names, provisional):
- **Rooms** (`nest: true`, one interior with `nest_area`, offset 112 tiles south, 96 before): `nest_t1` (west tunnel; the collapsed tunnel `rubble_nest_choke`), `nest_brood`, `nest_shelf` (level 1; its cliff is the brood chamber's edge of kind `cliff`, a REEF face; `ledge_nest_shelf` down), `nest_t3` (south tunnel; the cracked wall `nest_cracked`, the flask `hazard_x3` in a hollow beside it), `nest_t4` (the stream `nest_stream_water`, a `pool`), `nest_stream`, `nest_t6` (the boulder `nest_boulder` in its one-row squeeze, a two-tile hollow beside it), `nest_burrow`, `nest_deep`, `nest_t7` (the resin seal `nest_resin_seal`, the acid flask `hazard_c2` in front of it), `nest_larder`, `nest_down` and `nest_down_low` (the slope `r_nest_down`, a zone with no steps, level −1 to −2). Mouths: twelve `openings` with `cave: true` (no door drawn).
- **Code**: `FP_NEST_ROOMS` (the Nest's rooms: their style, colour, zone tag, one light, taps across them, the console's and the queen's arming); edge kinds `rock_low` and `cliff` (js/facility.js: rock with `low`, and `face` for REEF); js/nestways.js (the cracked wall and resin seal: drawn, opened by a blast within `HAZARD.blastR` or an acid pool touching them, saved as `nestWays`; the boulder's look); js/chests.js (`CHESTS.md`).
- **The cracked rock** (build `2026-11-13r`; the owner, 2026-11-13, of the flat cracked wall: "3D rock, blast or drill"): the cracked wall across the south tunnel is drawn as the cave's modelled rubble (`rubble_nest_cracked`, a choke of the solid `nest_cracked`; baked by design/cave/bake_rubble.js), and **either** way opens it: the explosive flask's blast (as built) **or** a fire technician's THERMITE DRILL from the north, six hits. Its sign: CRACKED ROCK · SHOOT THE FLASK · PRESS AND HOLD IT: THERMITE DRILL. The flask beside it can be tapped as a target (`FACILITY.md`, the hazard containers). Tested: `tests/nest.js`.
- **Not built**: the volcanic layer itself (the way down ends where it will begin).
- **Build `2026-11-12d`**: THE ANT QUEEN in the Deep Brood (`BOSS_ENCOUNTERS.nest.room`, her post its middle; armed on coming down into any of the Nest's rooms, held to hers); the test console removed (`NEST.md`).

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| `node tests/elecdomain.js` (8 checks: the door and its place, shut before the repair, the trip down and back with the squad, the junction's approach never in the doorway, the two rooms, the steps and the ledge, the look and power, the map's rules) | Pass | build `2026-11-11d` |
| The facility suites (facility, facilityplay, fluxlab, nest, sewers) with the new rooms, doorways and counts | Pass | build `2026-11-11d` |
| The real page at iPad size: the door in the Server Room, the deep server room, the steps, the circuitry; no page error | Looked at (screenshots) | not playtested |
| `node tests/nest.js` (four new checks: the rooms, mouths, low walls, shelf and slope; the ways through, opened and saved; the queen kept to her cavern; the chest) and the suites whose counts changed | Pass | build `2026-11-12a` |
| The real page: the tunnels, the cracked wall, the boulder, the stream; no page error | Looked at (screenshots) | not playtested |

## 11. Open questions

1. The names (§5).
2. ~~What "a lot more development in the nest" holds, and where its sloping tunnel down to the volcanic layer starts.~~ **Answered 2026-11-12:** draft 6 (§2, 10); the way down at the south-west, from the deep brood into the volcanic layer, part of the Nest (§2, 11).
4. The volcanic layer's and the crystalline area's look and size (the volcanic layer now has its spot in the Nest: §2, 11; its passages and caves are still to design).
5. Which relay powers the electrical domain, and how dark it is.
6. Later: each domain's creatures, boss and quest. (The electrical domain's: a roly-poly breed and a diving beetle larva boss, the owner's, 2026-11-13: §2, 14; their design is open.)
7. **Draft 5**, the electrical domain as passages and rooms: build it as drawn, or change it (the rooms, the order, the ways through, the chests' places)?
8. ~~**Draft 6**, the Ant Nest grown out: as drawn, or changed?~~ **Answered 2026-11-12:** as drawn, with a spot for the volcanic layer (§2, 10 and 11).
9. **The ways through** (draft 7): which obstacles a blast breaks (a cracked wall and a leaning stack; in the Nest a hanging rock?); a key technician for each domain's main way (FLUX in the electrical domain), or none. (The Nest's are in its approved draft: the cracked wall, the drill as its key, the acid flask eating resin.)
10. **Seeing into a passage** (draft 8): A low near walls (the agent's pick), B the near wall fades, or C outlines through the walls.
11. **"Instances"**: a place of its own behind a doorway (the agent's reading)? And does an instance reset when you leave (its creatures back, once it has some), while what you opened and the chests you emptied stay done?
12. **"The nests"**: the Ant Nest only, or the Sewers' toxic nest too?

- **The volcanic layer and the Nest's place to hold** (2026-11-12): the layer is inside the Nest (rule 11) and each domain is one place to hold (rule 13). Is the layer part of the Nest's place, or one of its own?

## 12. History

- 2026-11-11: the owner's direction (§1); the four decisions (§2), chosen from options; layout drafts 1 (the Server Room's stairs), 2A and 2B (the electrical domain). Decision record: `DECISION-LOG.md`, "The domains".
- 2026-11-11, later: the stairwell replaced by a little door beside the junction (§2, 1a); the nests to descend without stairs (§2, 5); look drafts 3A to 3C and the door's spots (draft 4). Decision record: `DECISION-LOG.md`, "The electrical domain's way in: a little door".
- 2026-11-11, later: look A chosen (§2, 6); the nests' sloping tunnels (§2, 5). Decision record: `DECISION-LOG.md`, "The electrical domain's look; the nests' tunnels; the catwalks swap sides".
- 2026-11-12: the owner's new direction (§1; §2, 7 to 9): narrow passages, rooms, nests, caves and instances; ways through by the technicians' utilities; a default chest. The big open area superseded. Drafts 5 to 9 (§5, `CHESTS.md`). Decision record: `DECISION-LOG.md`, "The domains are passages, rooms, nests, caves and instances".
- 2026-11-12, later: draft 6 approved, with a spot for the volcanic layer in the Nest (§2, 10 and 11); the chest's look C. Decision record: `DECISION-LOG.md`, "The Ant Nest grows out as drawn, the volcanic layer in it; the chest is the hex cache".
- 2026-11-13: the electrical domain's breed and boss named by the owner (§2, 14); reference photos and 3D example studies shown; nothing designed. Decision record: `DECISION-LOG.md`, "The electrical domain's breed: a roly-poly; its boss a diving beetle larva".
