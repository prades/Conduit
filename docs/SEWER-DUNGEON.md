# The Sewer Dungeon (the redesign)

> **Status: Designed in part** (the owner, 2026-11-21, of the skeleton picture `design/sewer-dungeon/skeleton-2026-11-20.png`: "This is our sewer now, make it happen"; then "new mechanics I'll answer the questions in prompt form"). **Nothing of it is built.** The Sewers in the game are still the ones in `SEWER-QUEST.md`, which this replaces as its stages are built. Everything below is read off the picture; what the picture marks TBD, and what it does not say, is in §6, not filled in.

## 1. Intent
A dungeon to explore, not a corridor: a dynamic water level that changes the routes, a boss you do not have to kill, more than one way through.

## 2. The layout (the picture; "rough skeleton, not final room-by-room")
About 90 × 60 tiles, wider than tall as the picture is drawn (the owner's choice; the picture's note says 60 × 90), north up. A **Central Channel** runs north to south down the middle (walkways both sides) into the **Round Junction**; a **West Channel** (walkways both sides) runs from the **West Entrance (from the Arena)** to the Central Channel.

| Place | What the picture says |
|---|---|
| West Entrance | From the Arena |
| Northwest Wing | Secret door; energy-card cache; additional loot (TBD) |
| West Hall | Optional mini-boss; candidate key cache (TBD); battery pack (TBD); side loot / samples (TBD) |
| Southwest Storage | Crates / supplies; possible key / stash (TBD); samples / spare parts (TBD) |
| Channel-bed key | Underwater in the West Channel: lower the water to drain, use REEF (Stonepetal) to descend and retrieve; opens the Subway Exit |
| Subway Exit | South-west; opened by the channel-bed key |
| Northeast Offices | Locked door; cracked wall / alternate entry; office area (TBD) |
| High Ledge Room | Reached by Kinetic Launcher; upper floor (up to 2 stories); loot / side objective (TBD) |
| East Rubble | Rubble blockage; chest (TBD); multiple bypass options (clear, reroute, etc.) |
| Low Drain Tunnel | Normally underwater; exposed when the water is lowered; exploration / loot (TBD) |
| Round Junction: Toxic Nest / Queen | The Round Junction dam. The Toxic Queen is an obstacle, not required to kill; a trash and debris dam backs up the water; non-lethal approaches available |
| Purification Chamber | East of the junction: install the purification module; console / module slot; the quest's objective (cleanse the sewer); distinct from the Queen's lair |
| Experiment Lab | Off the map, in the facility: run tests and build the purification module there |

**Routes (the picture's example):** an exploratory, tool-based route through the side areas (extra loot, safer); a hard route pushing through the Toxic Nest (high difficulty, forfeits much of the optional loot, does not require killing the Queen).

## 3. The rules on the picture
- **Dynamic water.** HIGH (raised): floats crates and debris, reaches high ledges and doors, can flood patrol paths, can wash ants out (non-lethal). LOW (drained): exposes drain tunnels, reveals lower routes and loot, gives access to submerged areas, reduces or redirects flow.
- **Optional crossing: raise, then bridge.** Raise the water first, then make a temporary bridge: ice (Ice Technician) or a box pushed into the raised water (Flux Technician or Technomancer).
- **Kinetic Launcher (traversal only).** Vertical traversal at authored spots; launches straight up to a ledge (up to 2 stories); not for crossing the Central Channel; not for throwing enemies.
- **Toolkit and utilities.** The Technomancer mech: 3 environmental charges per dungeon. Each follower with a utility: 1 use per dungeon. Battery packs restore all 3 mech charges and all follower uses.
- **Non-lethal approaches (Queen / patrols).** Distraction (toxic decoy), disguise (Mutator ant clone), sleep (potion), freeze (ice), stun (arc), flood (raise water), block / redirect (move objects).
- **Future clone utilities, tentative.** Worker: dig (loose terrain). Striker: cut (vines, web). Tank: carry (heavy objects).
- **Reset.** The dungeon resets on each return (water level, moved obstacles, bridges, doors, creatures). Persistence of collected items and quest state is open.
- **Quest flow.** Collect samples and spare parts in the Sewer; return to the Experiment Lab (run tests, build the purification module: details TBD); return and install the module at the Purification Chamber; cleanse the sewer.

## 4. Non-goals
Not approved by the picture: any number (costs, charges beyond those written, timers, damage), any room's exact tiles, any item marked TBD.

## 5. Stages (the agent's plan, proposed)
1. The layout: the rooms, channels and walkways, in 2D and in the 3D view; the entrance from the Arena; nothing new to do in it yet.
2. The water: two levels and what each opens and shuts; where it is changed.
3. Ways through: the channel-bed key and the Subway Exit, the launcher's spots, the rubble, the locked door and cracked wall, raise-then-bridge.
4. The Queen as an obstacle and the non-lethal approaches; the Purification Chamber and the quest's new flow.
5. Charges, battery packs, the reset, loot.

## 6. Open questions
**Answered (the owner, 2026-11-21, of four questions):**
- The old Sewers: **"Replace outright"**. The new layout takes the old one's place when stage 1 is built.
- The old Queen sequence (the ambush at the install, the scripted knock-out, the return): **"Drop the ambush and defeat"**. She sits in the Round Junction; you get past her by a non-lethal approach or fight her; Side Quest and the potion stay as one approach.
- Changing the water level: **"A Technomancer charge"**: the mech spends one of its 3 environmental charges at a water control.
- First stage: **"Layout + water together"**.

**Answered (the owner, 2026-11-21, of four more):**
- Where the mech spends a charge on the water: **"At water control panels"** (fixed panels; where and how many is the agent's, provisional).
- A player with no mech: **"Flux can block water flow by pushing into the water heavy objects or rubble falling could increase water level"**. So the water also rises when the flow is blocked: a heavy object pushed into it by Flux, or rubble falling into it. (Where the flow can be blocked, and what lowers it again, is open.)
- The level on entering: **"LOW (drained)"**.
- The old Sewers' pieces with no place on the picture (Side Quest's platform, the pumps and valves, the drain-pipe shortcut, the sample bank puzzle): **"Remove all, re-add later"**.

**Answered (the owner, 2026-11-21, of the first tile plan, 60 across by 90 down):** "Yes resize it": **"Wider than tall, like the picture"** (now about 90 across by 60 down, `design/sewer-dungeon/layout.js`). Blocking the flow to raise the water: **"Anywhere along a channel"**; pulling the object back out lowers it ("yes").

**The first tile plan was wrong (the owner, 2026-11-21, of the rectangles plan: "It looks like you completely changed how the map looked. Is that intentional?"). It was not: the agent had simplified the picture to boxes and straight passages.** Then: **"Can you make it like have half tiles and like diagonal tiles to make sure like every one of these cool little shapes of these rooms and stuff is complete, and especially the circular area?"** and **"I really want to have the elevation as well."** So: the plan is traced from the picture by hand, shape for shape: the chamfered corners and diagonal walls, the notched rooms, the winding passages, and the Round Junction as a true ring; walls may run at half tiles and on diagonals (the map's rooms are polygons, 20 px to a tile: a wall can lie anywhere). And the picture's heights are built: the walkways above the channels, the stairs between them, the High Ledge Room's upper floor, the Low Drain Tunnel below. The rectangles plan (`design/sewer-dungeon/layout.js`) is superseded; the picture's own proportions (near square, about 80 by 72) replace 90 by 60.

**The hand trace (the owner, 2026-11-21, of the first overlay drawn over the picture: "Perfect").** `design/sewer-dungeon/trace.js` is the plan to build from. Its heights (`lvl`, in storeys; the agent's reading of the picture's stairs, shown to the owner): 0 the walkways, the ring, the nest, the Offices, East Rubble and the Purification Chamber; -2 the channels' beds; -1 the Low Drain Tunnel and the west and south-west rooms the stairs go down to (West Hall, Southwest Storage, the Subway Exit); +1 the Northwest Wing and its gallery, up the stairs from the walkway; +2 the High Ledge Room, reached by a launcher at its foot.

**The stairs (the owner, 2026-11-21, of the heights overlay: "I see a lot of places where stairs are there, but you're not putting them in").** A second pass over the picture, enlarged area by area, found eleven flights, now in `trace.js` (`STAIRS`, each with the heights it joins): down from the gallery into the West Channel's bed; from the south walkway down to the West Hall; from the south-west plaza up to the ring; the diagonal flight from the Subway Exit's passage up to the ring; steps at the Offices' door, on the East Rubble's approach and where the Purification Chamber's passage leaves the ring; inside the High Ledge Room down to its foot; the stepped banks along both sides of the Central Channel; and the ring's inner steps all the way round, down to the nest (so the nest lies a storey below the ring: changed from level). Where a flight goes is the agent's reading of the hatching; shown to the owner.

**Corrected (the owner, 2026-11-21, circling the flight the agent had drawn between the south-west plaza and the ring): "Not stairs".** Removed from `STAIRS` (ten flights now). Open: how the plaza (read as a storey down) and the ring meet there.

*Found in the code (2026-11-21):* the Technomancer's mech has no abilities and no charges today (it makes you faster and widens the lamp); its 3 environmental charges per dungeon are new with this dungeon. A room has one floor height, so an upper floor (the High Ledge Room) is a room of its own joined by a ramp, a ledge or a launcher.

**Still open:** everything the picture marks TBD (§2); where the water controls stand and how many; what "washes ants out" does to them; the mini-boss; the keys' caches; what the tests and the module's build are at the Experiment Lab; what persists across the reset; every number.
