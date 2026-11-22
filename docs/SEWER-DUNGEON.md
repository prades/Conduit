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

**Corrected (the owner, 2026-11-21, circling the diagonal passage the agent had drawn from the West Hall's east side up to the Central Channel's west walkway): "No hallway here".** Removed from `SHAPES`: those diagonal lines in the picture are walls, not a way through.

**Answered (the owner, 2026-11-21, of the south-west plaza and the ring): "Same height, you can cross it".** The plaza and the ring are one floor. *The agent's reading that follows, shown to the owner:* the plaza is joined flat to the West Hall and Southwest Storage, which the picture's stairs put a storey below the walkways; so the ring is a storey down too, reached from the Central Channel's walkways by the stepped curves the picture draws at its north (`st_ramp_w`, `st_ramp_e`), the nest a storey below the ring down its inner steps, and the Purification Chamber's passage up a flight from the ring.

**Approved to build (the owner, 2026-11-21, of the trace with its three corrections): "The ring is a storey down, build it".**

**Corrected (the owner, 2026-11-21, having walked the bare rooms on the live page):** "when I say it needs to be multiple stories, I'm not talking about actual stories. I'm talking about how it has stairs and whatnot to make it feel like it's underground and has multiple stories"; "the very front entrance, dude, you don't need to have 2 or 4 sets of railings. It's one set of railing, and it's a really deep channel that is not all the way full. It needs to be wider. This channel needs to be wider at the entrance. And it doesn't need to have 4 railings anywhere." So (build `2026-11-17bc`): a step of the trace's heights is a short flight (0.45 of a tile), not a storey; an edge between a walkway and its water has ONE rail, the walkway's; the West Channel is 4.3 tiles wide (it was 3.1), its south walkway and what hangs off it moved south; a channel lies deep below its walkways (0.9 of a tile) with its water below the brim. *Still to do there:* the water's own look (it is drawn dark and plain until the sewer look is in).

**Corrected (the owner, 2026-11-21, of a screenshot of the ring's west walkway, its outer wall an arc of many short pieces against sixteen flat inner sides): "This tunnel is bad, make it uniform. Dont use reference make this area completely uniform".** The Round Junction's ring is no longer traced from the picture: its outer edge is sixteen flat sides, each over its inner one, so the walkway is one width all the way round (2.5 tiles); the passages and walkways meet it on those sides (build `2026-11-17bd`).

**Corrected (the owner, 2026-11-21): "The bottom left tunnel connecting to that room from the circular junction is not right. I can't navigate through it."** The Subway Exit's passage from the ring was a sliver three tiles of floor wide in all; it now runs straight south-west from nearly the whole of the ring's side, 3.4 tiles wide, to the Subway Exit's east wall. Found with it: the small west room's passage to the West Hall was too thin to walk (2 of its 15 tiles reached); it is 2.5 tiles wide and square-cornered now. Every room's every tile is now reached on foot from the West Entrance (checked in the sandbox). Build `2026-11-17be`.

**The tests while this is a prototype (the owner, 2026-11-21: "Something needs to be done about a 25-minute test run on a fucking prototype map").** A change that touches only the dungeon behind `?sewerdungeon` (its trace, its tool, its generated map) is pushed on the short run: `node tests/run.js facility facilityplay sewers sewerlook bundle ghost` (about two minutes) and a look in a real browser. The full run is for changes outside the switch and for the swap.

**Corrected (the owner, 2026-11-21, of a screenshot taken on the Central Channel's west walkway where it crossed the West Channel's mouth): "This platform shouldn't exist, it should be cut off here".** The walkway is cut there: it ends at the West Channel's north bank and starts again at its south bank, and the West Channel runs on into the Central Channel, nothing drawn between the two waters. *The agent's, with it:* a landing at the channel's head, the WEST ENTRANCE (two tiles deep, across both banks), since with that walkway gone nothing else joined the north bank to the south; every tile is still reached on foot from it. Build `2026-11-17bf`.

**Corrected (the owner, 2026-11-21): "The room right under the main entrance tunnel is inaccessible from it. It should have access from the main entrance."** A short flight from the West Channel's south walkway, near the entrance, down into the small room below it (it was reached only through the West Hall). Where the flight stands along that wall is the agent's. Build `2026-11-17bg`.

**Added (the owner, 2026-11-21): "There should also be a flooded staircase that leads into the channel in the entrance tunnel. Maybe make that channel a little bit wider as well."** THE FLOODED STAIRCASE: steps from the north walkway down into the West Channel, where the picture hatches them beside the key (two tiles wide; nothing walks off its foot, the water is there). The West Channel is 5 tiles wide now (it was 4.3). Build `2026-11-17bh`.

**Found with it: the trace must lie on the game's grid.** The game's playable map moves every wall onto its half-tile lines; a doorway traced a little off them was moved shut (the south bank could not be reached at all). `trace.js` now puts every point on the nearest half-tile line itself, once, for the map and the pictures alike (the ring's own corners excepted, so it stays one width), and the ring is cut on those lines where things meet it. Walkways are whole tiles wide: 2 along both channels. Every tile of all 35 rooms is reached on foot from the West Entrance.

**Corrected (the owner, 2026-11-21, of a screenshot at the flooded staircase): "U added a wall lining the entire channel".** Cutting the steps into the channel had turned the north walkway's rail into a wall all along it (an edge only partly shared with the water was drawn as wall). The tool now makes every end of a shared wall a corner of both rooms, so the rail is back along the water and only along it; the entrance landing's water edge has its rail too. Build `2026-11-17bi`.

**Added (the owner, 2026-11-21): "I want the entrance tunnel to have two sets of stairs before it reaches the main tunnel and channel."** The West Channel's walkways, on both banks, come down two short flights between the West Entrance and the Central Channel: the entrance and the first stretch stand two flights above the main tunnel's walkways, the middle stretch one. *The agent's:* where the two flights stand (16 and 26 tiles in from the entrance), and what follows: the Northwest Wing and its gallery a flight above the entrance's stretch, the flights down to the room under the entrance, to the West Hall and into the channel longer, a flight 0.4 of a tile. Build `2026-11-17bj`.

**Added (the owner, 2026-11-21, of the entrance tunnel's two flights; the message broke off): "The both sides should have the stairs, and also it should affect the water level. It should slope down too. The water should".** Both banks have both flights (built so in `bj`). The West Channel's water now comes down with its tunnel: three stretches, the entrance's two flights above the main channel's water, the middle one, a fall between each where the walkways' flights stand (build `2026-11-17bk`). *Not done, and asked of the owner:* a true slope (the game's water is level in each stretch: a slope needs new drawing), and what the sentence went on to say.

**Added (the owner, 2026-11-22, finishing the sentence that broke off): the water "should have cutoff valves at the end of each channel, or at the beginning of the top of the map, or the very north, and then where the west channel meets the main channel."** Two cutoff valves stand in the dungeon (build `2026-11-17bl`): one at the Central Channel's north end, one where the West Channel runs into it, each on the west walkway beside the water (the game's own valve housing for now; the approved drain valve's model is `SEWER-PROPS.md`'s). *Open:* what turning one does (cut that channel's water off, so it drains below the valve?), who can turn it, and how it sits with the water panels and the mech's charges answered earlier.

**Answered (the owner, 2026-11-22, asked whether the cutoff valves replace the water panels): "Yeah, that's the panels that we're talking about. The eventual design will be on the walls. There's already 3D designs for it."** The two cutoff valves ARE the water controls of the earlier answers (a Technomancer's mech spends a charge at one to change the water): there are no separate panels, and the two provisional panel places are dropped. They will be wall-mounted, in the models already approved (`SEWER-PROPS.md`: the drain valve, the sluice gate and its switch); until those are in the game each is the game's own valve housing, stood against its walkway's wall (build `2026-11-17bm`). *Still open:* what closing each one does to the water.

**Added (the owner, 2026-11-22): "The shape of the channel should be like a inverted trapezoid."** Each side of a channel slopes in from its walkway's edge down to the bed, 1.5 tiles across (the agent's measure), so the channel is wide at the top and narrow at the bed (build `2026-11-17bn`): a slope along every straight edge a walkway shares with its water (15 of them). *Not yet:* the slope reads only faintly while the channel is drawn plain and dark; the ring's angled edges and the ends of the channels are still sheer; the water's own look.

**Corrected (the owner, 2026-11-22, circling a door frame standing across the West Channel's walkway where it meets the main one): "Remove this dumb arc doorway".** Where two of the dungeon's pieces join on one floor there is a plain gap now, no frame: every such doorway (26 of them), not only that one. Build `2026-11-17bo`.

*Found in the code (2026-11-21):* the Technomancer's mech has no abilities and no charges today (it makes you faster and widens the lamp); its 3 environmental charges per dungeon are new with this dungeon. A room has one floor height, so an upper floor (the High Ledge Room) is a room of its own joined by a ramp, a ledge or a launcher.

**Still open:** everything the picture marks TBD (§2); where the water controls stand and how many; what "washes ants out" does to them; the mini-boss; the keys' caches; what the tests and the module's build are at the Experiment Lab; what persists across the reset; every number.
