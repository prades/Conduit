# The domains (the map's expansion)

- **Status:** Designed in part (decisions of 2026-11-11; the stairwell was replaced the same day by a little door); the look and the layout are proposed (drafts); nothing is built.
- **Owner:** the user (creative direction); the agent (implementation support)
- **Last updated:** 2026-11-11
- **Branch/build context:** `claude/start-game-project-HSh7Z`, after build `2026-11-11c`
- **Related docs:** `FACILITY.md` (the map, interiors and portals), `NEST.md`, `TECHNICIANS.md` (the ice bridge), `SEWER-QUEST.md` (the Sewers, built empty first), `TUTORIAL.md` (the junction)

## 1. Intent

The owner, 2026-11-11: "We're going to need some map expansions to fully integrate the map. So in the server room, there's going to be a downward staircase that stretches the entirety of the length of the room that goes into a new, deeper electrical domain that, as you get further down into it, the server room of it, it's the server racks get are like tossed on the ground and strawn about, and then there's a big open area where there's like circuitry everywhere, and then in the arena, there's going to be, or not the arena, in the nest, there's going to be a lot more development in the nest, and it's going to lead to layers, new layers, like a volcanic layer, and that'll be the fire domain, and you can convert the lava to stone, and create a path to the crystalline area, which just so happens to be the home of the flux domain."

Three new places:
1. **The electrical domain**, down a staircase from the Server Room: a deeper server room whose racks lie tossed and strewn the further in you go, then a big open area with circuitry everywhere.
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

## 3. Must-have requirements, by phase

**Phase 1, the electrical domain** (layout pending: §5)
- [ ] A little door in the Server Room's north wall, beside the junction (a doorway alcove, as the Armory's are).
- [ ] Until the junction is repaired, walking into it does nothing. After it, it is a doorway: a fade, and you arrive in the electrical domain with your following squad, as through every doorway.
- [ ] The electrical domain is an interior (as the Armory, the Cold Storage, the Sewers and the Ant Nest are), with a way back that brings you out in front of the door.
- [ ] Inside: the deep server room (racks standing near the stairs, toppled and strewn further in), then a big open area with circuitry everywhere.

**Phase 2, the Nest developed and the volcanic layer** (to design with the owner: §11)
- [ ] The Ant Nest leads down to the volcanic layer, without stairs.
- [ ] The volcanic layer has lava that nobody walks on; an ice technician's bridge over lava sets as stone and stays (saved).

**Phase 3, the crystalline area** (to design with the owner: §11)
- [ ] Reached from the volcanic layer by the stone path.

## 4. Non-goals

- Creatures, bosses, quests, rewards and recruit posts in the domains (later, with the owner).
- Moving the Server Room's racks, console, junction or doors (the relay node on the wall beside the junction moves aside for the door); changing the Ant Nest's queen or console.
- Phones (not supported).

## 5. Proposed, not approved

- **The electrical domain's shape: toward the camera** (draft 2B, and the arrangement of look draft 3A, which the owner chose): you come in at the north end through the door back up; walking south, racks standing, then toppled and strewn; wide steps down into the circuitry, a big open hall in front of you. The deep server room about 24 × 18 tiles, the circuitry about 32 × 23 (the arena's size). Sizes provisional. (The other looks, B live yellow current and C a giant circuit board, were not chosen.)
- **The door before and after the repair:** its light red, then green, and ▼ ELECTRICAL DOMAIN over it.
- **Names:** Electrical Domain, The Deep Server Room, The Circuitry (all provisional).

## 6. Dependencies and affected systems

- Map data: `js/facilitymap.js` (rooms, `interiors`, `portals`, props, decor); `js/facilitygrow.js` (the door's re-placement, as the other doors'); `js/facilityportals.js` (`facilityPortalShut` learns the junction); the door's look (`portal_door` wall decor, as the Armory's).
- Art: new baked props (toppled server racks; the circuitry's pieces), `design/props`, `img/props`; the circuitry floor.
- Power: which relay lights the domain.
- Save: nothing new for the stairs (the junction's repair is saved); stone over lava will need saving (phase 2).

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

None yet.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| Nothing built yet | Not run | |

## 11. Open questions

1. The names (§5).
2. What "a lot more development in the nest" holds, and where its sloping tunnel down to the volcanic layer starts. (The original sketch has a "further nests" arrow pointing down at the Nest's south-west.)
4. The volcanic layer's and the crystalline area's look and size.
5. Which relay powers the electrical domain, and how dark it is.
6. Later: each domain's creatures, boss and quest.

## 12. History

- 2026-11-11: the owner's direction (§1); the four decisions (§2), chosen from options; layout drafts 1 (the Server Room's stairs), 2A and 2B (the electrical domain). Decision record: `DECISION-LOG.md`, "The domains".
- 2026-11-11, later: the stairwell replaced by a little door beside the junction (§2, 1a); the nests to descend without stairs (§2, 5); look drafts 3A to 3C and the door's spots (draft 4). Decision record: `DECISION-LOG.md`, "The electrical domain's way in: a little door".
- 2026-11-11, later: look A chosen (§2, 6); the nests' sloping tunnels (§2, 5). Decision record: `DECISION-LOG.md`, "The electrical domain's look; the nests' tunnels; the catwalks swap sides".
