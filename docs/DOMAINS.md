# The domains (the map's expansion)

- **Status:** Designed in part (four decisions, 2026-11-11); the layouts are proposed (drafts); nothing is built.
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

1. **The Server Room's stairs are a stairwell you fade down.** The room grows 3 tiles north and its whole north side becomes one wide flight dropping out of sight. Stepping onto it fades you down into the electrical domain, as the lab's stairs take you to the Cold Storage. The racks, the console and the junction stay where they are.
2. **The stairs open after the junction repair**: the tutorial's one repair, the MAIN POWER JUNCTION in the same room (`junctionRepaired()`, js/tutorial.js).
3. **Lava turns to stone by the ice Technician's bridge.** Its ICE BRIDGE works on lava too (the owner's connected rule, `TECHNICIANS.md`). Over lava the bridge sets as stone and stays, so a path can be built pool by pool. The volcanic layer therefore needs an ice technician, as the Nest's rubble needs a fire one.
4. **Empty at first.** Each domain is built as a place first, with no creatures, as the Sewers were. Creatures, bosses and quests come next, designed with the owner.

## 3. Must-have requirements, by phase

**Phase 1, the electrical domain** (layout pending: §5)
- [ ] The Server Room is 3 tiles deeper to the north; a stairwell runs its whole length (22 tiles) along the new north side.
- [ ] Until the junction is repaired, stepping onto the stairs does nothing. After it, the stairs are a doorway down: a fade, and you arrive in the electrical domain with your following squad, as through every doorway.
- [ ] The electrical domain is an interior (as the Armory, the Cold Storage, the Sewers and the Ant Nest are), with stairs back up that bring you out in front of the stairwell.
- [ ] Inside: the deep server room (racks standing near the stairs, toppled and strewn further in), then a big open area with circuitry everywhere.

**Phase 2, the Nest developed and the volcanic layer** (to design with the owner: §11)
- [ ] The Ant Nest leads down to the volcanic layer.
- [ ] The volcanic layer has lava that nobody walks on; an ice technician's bridge over lava sets as stone and stays (saved).

**Phase 3, the crystalline area** (to design with the owner: §11)
- [ ] Reached from the volcanic layer by the stone path.

## 4. Non-goals

- Creatures, bosses, quests, rewards and recruit posts in the domains (later, with the owner).
- Moving the Server Room's racks, console, junction or doors; changing the Ant Nest's queen or console.
- Phones (not supported).

## 5. Proposed, not approved

- **The electrical domain's shape** (drafts, 2026-11-11): **A**, you walk away from the camera (arrive at the south end; the circuitry lies beyond, further from the camera) or **B**, toward it (arrive at the north end; the circuitry opens out below you, in view). Both: the deep server room about 24 × 18 tiles, wide steps down, the circuitry about 32 × 23 tiles (the arena's size). Sizes provisional.
- **The stairs before and after the repair:** before, dark, a chain and a NO POWER sign across their top; after, the chain gone, blue light up the stairs, and ▼ ELECTRICAL DOMAIN over them.
- **Names:** Electrical Domain, The Deep Server Room, The Circuitry (all provisional).

## 6. Dependencies and affected systems

- Map data: `js/facilitymap.js` (rooms, `interiors`, `portals`, props, decor); `js/facilitygrow.js` (the Server Room's growth); `js/facilityportals.js` (`facilityPortalShut` learns the junction); `js/facilitydecor.js` (`_fpDrawStairwell` for a 22-tile flight).
- Art: new baked props (toppled server racks; the circuitry's pieces), `design/props`, `img/props`; the circuitry floor.
- Power: which relay lights the domain.
- Save: nothing new for the stairs (the junction's repair is saved); stone over lava will need saving (phase 2).

## 7. Edge cases

- A save from before the change loads into the grown Server Room (nothing movable lives in it).
- The junction repaired while you stand by the stairs: they open at once.
- `?attract` (the website's background) uses no doorways.
- Creatures cannot use a doorway (as now).

## 8. Acceptance criteria (phase 1)

- [ ] Before the junction repair the stairs do nothing; after it they take you and your following squad down, and the stairs up bring you back.
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

1. The electrical domain's shape: draft A or B (§5), or another.
2. The names (§5).
3. What "a lot more development in the nest" holds, and where its way down to the volcanic layer is. (The original sketch has a "further nests" arrow pointing down at the Nest's south-west.)
4. The volcanic layer's and the crystalline area's look and size.
5. Which relay powers the electrical domain, and how dark it is.
6. Later: each domain's creatures, boss and quest.

## 12. History

- 2026-11-11: the owner's direction (§1); the four decisions (§2), chosen from options; layout drafts 1 (the Server Room's stairs), 2A and 2B (the electrical domain). Decision record: `DECISION-LOG.md`, "The domains".
