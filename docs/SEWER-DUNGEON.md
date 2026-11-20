# The Sewer Dungeon (the sewers rebuilt as a large exploration dungeon)

- **Status:** Designed (skeleton approved 2026-11-20); nothing built. The Sewers in the game today are still the one-tunnel layout in `SEWER-QUEST.md`.
- **Owner:** User (creative direction); agent (implementation support)
- **Last updated:** 2026-11-20
- **Branch/build context:** written on branch `claude/sewer-dungeon-spec` from main at `7b1d62d` (build `2026-11-17aq`). No code changed.
- **Related docs:** `SEWER-QUEST.md` (the quest line, the sample puzzle, the Toxic Queen, Side Quest: their rules carry over unless this page says otherwise), `FLUX-MOVEMENT.md`, `TECHNICIANS.md`, `ENERGY-CARDS.md`, `CHESTS.md`, `NEST.md`, `DOMAINS.md`, `VIEW-3D.md`.

## 1. Intent

The owner, 2026-11-20: "make a genuine dungeon located in the sewers ... make it ginormous compared to what it is now ... key items such as keys and maybe something else. Definitely energy cards and other upgrades scattered throughout the level, and have it to where the player has to use a personalized toolkit to help them navigate the sewers ... not one or two different requirements, but a multitude of different ways the player can navigate or traverse or complete the objective ... and avoid their idea of distasteful gameplay by either avoiding enemies or what?"

On approving the layout: "I can approve this layout for now, but I definitely think it's a rough skeleton of what in turn needs to be an elaborate sewer system with tons for the player to discover if he or she has the right tools or the right mindset."

The feel: a large, connected sewer the player explores, not a corridor to the boss. Side areas are worth visiting. Almost every obstacle has more than one way past it, and a player who would rather not fight can usually get around, distract, or non-lethally deal with enemies.

## 2. Approved design (2026-11-20)

### 2.1 Size and shape
1. **Much bigger than today.** Today's Sewers are about 54 × 18 tiles. The owner supplied a published hand-drawn sewer map as a **reference for structure and scale only**: a long central channel running north–south, a channel crossing it from the west, a round junction near the south, clusters of rooms off both sides, secret doors, a rubble-choked corridor and a cracked wall. The new layout is **inspired by it, not copied from it** (it is someone else's work; do not trace it or commit it). Working scale: roughly **60 × 90 tiles** (about 5–6× today); the exact size comes with the room-by-room pass.
2. **This page's layout is a skeleton.** The owner wants it elaborated into a much richer system. Every room's contents below are placeholders to be developed with the owner, not final.
3. **Supersedes** the Notion note "the entire existing sewer map is the playable dungeon boundary; do not expand the dungeon" (2026-11-19).

### 2.2 Layout and water flow (the owner, 2026-11-20)
- **The entrance is on the left (west) side of the dungeon map.** (Overall, the Sewers sit on the west side of the game's world map.) Today's entrance from the arena is also at the Sewers' west end.
- **Water flows in from the entrance side** and runs freely along the west channel into the central channel. **It is not blocked there.**
- The water runs **south down the central channel to the round junction**.
- **Past the round junction it is dammed up because of the Nest**: a **separate Toxic Nest inside the Sewers**, along the corridor running east from the junction.
- **The water purification chamber is in the bottom-right** of the map: where the purification module is installed and the Toxic Queen's encounter resolves.
- **Supersedes** the Notion note that water enters from the south (2026-11-19).

### 2.3 Skeleton zones (approved as a skeleton; contents are placeholders)

| Zone | Where | Placeholder role |
|---|---|---|
| Entrance | west edge, on the inflow channel | arrival; water flowing in freely |
| Northwest wing | top left | a secret door; a cache with an energy card |
| West hall | middle left | an optional mini-boss; Key 1; a battery pack |
| Northeast offices | top right | a locked door (Key 1) with an upgrade behind it; a cracked wall to break as another way in |
| High ledge room | right, below the offices | reachable only at high water (2.5) or another approved way |
| East rubble | end of an east corridor | a chest behind it; several ways through |
| Drain tunnel | east of the central channel, low | under water until the level is lowered (2.5) |
| Southwest storage | lower left | Key 2; a stash reached by moving crates |
| Round junction | bottom middle | where the water is seen backed up |
| Toxic Nest | east of the junction | the dam that backs the water up |
| Purification chamber | bottom right | the module, the Queen |
| Subway exit | bottom, south-west of the junction | the way on to the subway (today `portal_sewers_subway`) |

Key counts, which door each key opens, and what loot sits where are **open** (§11).

### 2.4 The personalized toolkit (the owner chose "Squad + charges", 2026-11-20)
The toolkit is **the squad the player brings**, with limited environmental uses in the dungeon:
- Each follower with a utility option has **one utility use per dungeon**.
- The Technomancer's mech has **3 charges per dungeon** for environment-changing actions.
- **Battery packs**, found in the dungeon, restore the mech's charges and every spent follower utility.
- The main path must never be impossible without one particular follower or class; tools change *how* the player gets through, not *whether*.

(These charge rules were approved in Notion before 2026-11-20 and are recorded here so agents have them. Costs per action, the display, and battery-pack counts and placement are open.)

### 2.5 Water level as a player tool (the owner, 2026-11-20: "because the water's backed up ... the player can move obstacles to raise the water levels and get to different places")
- The water level in parts of the dungeon **changes with what the player does**: moving obstacles into drains or the sluice **raises** it; opening a drain valve **lowers** it.
- Different levels reach different places. The skeleton's examples (proposed readings, to be confirmed room by room):
  - **High:** floating crates or debris rise to reach upper ledges and doorways (the high ledge room); low passages flood, which can wash out the ants patrolling them (a non-lethal way past).
  - **Low:** drain tunnels and lower floors are exposed, with loot and shortcuts.
  - **The ice bridge freezes the water at its current level**, so a higher level gives a higher crossing.
- Ways to move the obstacles use the existing or approved tools: the Flux Technician's FLUX MOVE (moves eligible existing objects only, `FLUX-MOVEMENT.md`), the Technomancer's mech, a fire technician drilling rubble loose.
- The main path to the Nest must not depend on one exact level.
- How many levels, which areas each one affects, and how water is simulated are **open** (§11).

### 2.5a Crossing the channel (the owner, 2026-11-20)
"I like the idea of not being able to cross the river or the channel unless the water is raised and they use an ice bridge or move a box into the water to create a bridge." Asked, the owner chose:
1. **No walk-across bridges** over the channel. (Today's Sewers have two steel bridges; in the dungeon they are gone or broken.)
2. **Raise the water first, then bridge it.** At the normal level neither bridge works.
3. **Two bridges:** the Ice Technician's **ice bridge**, or **a box pushed into the raised water**.
4. **Who can push a box in:** the **Flux Technician** (FLUX MOVE may place an eligible box in the water: a change to `FLUX-MOVEMENT.md`, whose rule today is that objects go only onto supported floor and that Flux "does not create bridges") and the **Technomancer's mech** (from its charges).
5. **The launcher is not a way across the channel.** It stays for smaller gaps and side spots (e.g. loot ledges).
6. **The launcher launches only vertically, and one cell over** (the owner, 2026-11-20: "the launcher can only launch vertically and one cell over"): it throws the player straight up and lands them one tile across from where they launched, onto a raised spot such as a ledge. It is a way **up**, not a way **across** a gap. Today's Kinetic Launcher throws an arc over the collapsed tunnel's choke (`SEWER-QUEST.md`, route B; `TECHNICIANS.md`); that changes. Answered the same day: it applies to the **Kinetic Launcher everywhere** in the game, and it reaches **up to 2 stories**. The owner's concern: "I feel like makes a design flaw when it comes to getting around the map if you can just jump over things." **Approved the same day** ("we can make it for only select spots on the map. That's fine"): the launcher works **only at select, authored spots** (the map's launcher sites), landing on an authored ledge, platform or upper floor within 2 stories and one tile over; walls run full height, so there is no wall top to land on (the wall rule is the agent's, taken with the approval). The owner also wants the launcher's **damage removed** ("That's where it does damage. That's ridiculous"): its Combat mode, which throws a follower at an enemy for damage, is to change (how: §11). Open: whether "one cell over" may be any direction; 

**Raised by the agent, to settle with the owner** (§11): the main path to the Nest and the purification chamber is on the far side of the channel, so every player must cross. As approved, crossing needs one of three helpers (Ice Technician, Flux Technician, Technomancer), and raising the water itself needs an obstacle moved; with one utility use per follower per dungeon, a crossing can cost two uses, and a way back is needed too. §2.4's rule that the main path is never impossible without one particular follower or class needs a fallback here.

### 2.5b The bully way: through the Nest (the owner, 2026-11-20)
"I kind of want to make the player able to take on the boss directly as the gunslinger. And that would be the hard alternative. The bully way of getting through the boss or the quest." Then: "it's open to anybody, not just the gunslinger. The bully way costs you the opportunity to obtain a bunch of loot."
1. **A direct, hard route to the objective by fighting**, the alternative to the clever routes (raising the water and bridging the channel, 2.5a). The Gunslinger is the class it suits; **any player may take it**.
2. **Its cost is loot:** the player who forces through misses the opportunity to get a lot of the loot the exploring routes reach.
3. **The agent's reading, to confirm** (proposed in the conversation, not yet answered): the Nest is the dam (2.2), and the trash dam is walkable, so the bully way is to fight straight through the Nest across the dam, the one crossing that needs no bridge, through the brood and the Queen. This also answers §11.10's fallback: a player without bridge helpers can always fight through.
4. The Queen's existing outcomes stay (`SEWER-QUEST.md`): killed, the purification still completes and the outcome is `defeated`.

**Open:** whether forcing through the Nest means the Queen must be killed, or she can still be slept, stunned and spared at the console; whether the missed loot is gone for good or can be gone back for later (and so what "costs you the opportunity" means in play).

### 2.6 Avoiding fights (the owner chose three, 2026-11-20)
- **Alternate routes:** most areas have more than one way in (secret doors, pipes, cracked walls, water-level routes), so patrols can be gone around.
- **Distraction and disguise:** e.g. the Toxic Mage's decoy, smoke, the Mutator's ant clone that matching ants treat as non-hostile.
- **Non-lethal tools:** sleep (the Sleeping Potion), freeze, stun, flooding a passage, or blocking a patrol's route with a moved object.
- **Not chosen:** sight-cone stealth. The 2026-11-06 removal ("We don't need to add stealth to the game") stands.

### 2.7 Keys and doors (approved in Notion, 2026-11-19; reaffirmed 2026-11-20)
- Locked doors, opened by a matching **key found in the dungeon**, or by **breaching** some of them another way.
- Some doors open from the far side to make **shortcuts**.
- Exact doors, keys and breach rules: open (§11).

### 2.8 Finds in the dungeon
- **Keys and other key items** (2.7, 2.9).
- **Energy cards** and **other upgrades** scattered through the level (the owner, 2026-11-20). Today energy cards come only from booster packs (`ENERGY-CARDS.md` rule 9); finding them in the world is new.
- **Battery packs** (2.4) and **chests** (`CHESTS.md`, the hex cache; its §4 lists "locks and keys" as a non-goal for the chest itself, which still stands: the keys here are for doors).
- Optional areas pay off; they are not empty dead ends. Mini-bosses are allowed in them.

### 2.9 Finding a key item (the owner, 2026-11-20)
"Whenever you find an item such as a key or any other key item, it will zoom in on it and the item will be floating and rotating vertically, a little bit of a slant."
- The camera **zooms in** on the item when it is found.
- The item **floats** and **turns about its upright axis, tilted slightly** off straight up (the agent's reading of "rotating vertically, a little bit of a slant"; to be confirmed).
- Kept from the earlier approved direction: brief, no long lock of the controls, shortened or skipped when the player is in danger or a fight is on. Ordinary pickups stay visually quieter.
- Tilt angle, spin speed and timings: open.

## 3. Must-have requirements
- [ ] A connected sewer of the approved shape (2.2) and roughly the approved scale (2.1), entered from the west.
- [ ] Water visibly flowing from the entrance, south to the junction, dammed past it by the Nest.
- [ ] The purification chamber in the bottom right, carrying over the module install and the Toxic Queen's encounter (`SEWER-QUEST.md`).
- [ ] Keys and locked doors, with at least some doors breachable instead.
- [ ] Energy cards and upgrades to find in the world.
- [ ] Follower utility uses, mech charges and battery packs (2.4).
- [ ] Water level the player can raise and lower to reach different places (2.5).
- [ ] Most obstacles with at least two credible ways past; non-fighting options (2.6).
- [ ] The key-item zoom (2.9).

## 4. Non-goals (for now)
- Sight-cone stealth (2.6).
- Copying the reference map.
- Changing the Toxic Queen's rules, the quest line's states or Side Quest beyond what moving them into the new layout needs.
- Phones (not supported).

## 5. Optional / future ideas (proposed, not approved)
- The top of the central channel as either a dead-end side area with loot or an upstream branch feeding more water (asked 2026-11-20, unanswered).
- A pipe shortcut from the northwest wing back to the entrance.
- The sluice gate on the junction's east side as one of the water-level controls.

## 6. Dependencies and affected systems
- Map: `js/facilitymap.js` (the `sewers` room, its solids, portals, decor and areas), `js/facilitysewers.js` (drawing the river, pools, rubble), the 3D view's map reader (`view3d/`), if the Sewers are brought into `?engine=3d`.
- Quest and boss: `js/quests.js`, `js/bosses.js`, `js/puzzles.js`, `js/sidequest.js`, `js/population.js` (`NESTS`, the brood's spawn rules).
- Tools: `js/techabilities.js` (launcher, drill, ice bridge), `FLUX-MOVEMENT.md` objects, the classes in `PLAYER-CLASSES.md`.
- New systems: keys and doors, world-placed energy cards and upgrades, utility charges and battery packs, water level, the key-item zoom.
- Save: a save from today's Sewers must load into the new one without breaking the quest line (positions inside the old Sewers will not exist).
- Performance: a map 5–6× larger on old iPads.

## 7. Edge cases and failure behavior
To be written with the room-by-room design. Known so far: old saves standing inside the Sewers; the water level's state on save and load; a player who spends every utility use before the Nest must still be able to finish; the boss guard in `SEWER-QUEST.md` (an ice bridge onto the dam must not let the module go in with no Queen).

## 8. Acceptance criteria
Written per build stage once the room-by-room plan is approved.

## 9. Implementation notes
Nothing implemented.

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| — | Not run | Design only |

## 11. Open questions
1. The room-by-room plan: every room's purpose, enemies, loot and routes (the skeleton is to be elaborated).
2. How many keys, which doors they open, which doors can be breached and how.
3. Water level: how many levels, which areas each affects, what controls it, whether it is saved, and whether it resets.
4. Utility charges: cost per action, the display, battery-pack count and placement, pickup or station.
5. Energy cards in the world: which elements, how many, and whether found cards are random or placed.
6. "Other upgrades": what they are.
7. The top of the central channel: dead end with loot, or upstream branch.
8. Where the Nest sits exactly: in the corridor as the dam itself, or beside it with only its dam in the corridor.
9. The key-item zoom: tilt, speed, timing.
10. Crossing the channel (2.5a): a player with none of the Ice Technician, Flux Technician or Technomancer can fight through the Nest (2.5b, to confirm); how the water is raised for the crossing without spending a use the crossing needs; the way back (one bridge both ways, or a second crossing); whether a box bridge lasts or sinks; whether creatures may cross a bridge.
11a. The launcher's Combat mode: removed entirely, or kept as a throw with no damage.
11. The bully way (2.5b): must the Queen die on it; is the missed loot lost for good.
12. Build order (suggested: bare layout and water flow first, then keys and doors, then water level, then finds and charges).

## 12. History
- 2026-11-19 (Notion): the sewer as a dungeon with keys, breachable doors, shortcuts and rewarding side areas; the map boundary kept; water from the south.
- 2026-11-20: the launcher launches only vertically and one cell over (2.5a.6).
- 2026-11-20: the bully way, fighting straight through, open to anyone, costing loot (2.5b).
- 2026-11-20: the channel is crossed only by raising the water and bridging it (ice, or a box pushed in by the Flux Technician or the mech); the launcher kept for side spots (2.5a).
- 2026-11-20: the owner asked for a much larger dungeon from a reference map; approved the skeleton in §2 (entrance west, water dammed past the junction by the Nest, purification bottom right); added water level as a tool and the key-item zoom. The boundary and south-water notes are superseded.
