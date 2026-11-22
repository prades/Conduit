# The game's look and combat, evolved (3D or 2.5D, a slower fight)

- **Status:** **A direction is chosen** (2026-11-16): round 2's direction 1, CRYSTAL LAB 3D with the slowed and signalled fight (the owner: "I like the direction of 1"). It is not designed in detail. **Its test page is built** (§8), `lab3d/`, apart from the game: first the Crystal Chamber (read once on an iPad: 52 fps), then, at the owner's asking, the lab's whole ground floor to walk, a fight at a pace you set with every blow marked before it lands, and a battle camera; then, the owner having tried those, the camera kept always on the cube and no model flattened. It is tested in a headless browser; **as it is now it has not been measured on an iPad**, and the fight's rules are stand-ins. Nothing in the game is changed. The other nineteen directions stay here as offered.
- **Owner:** the user (creative direction); the agent (drafts and implementation support)
- **Last updated:** 2026-11-16
- **Branch/build context:** `claude/start-game-project-HSh7Z`, build `2026-11-15j` (the game is unchanged by this)
- **Related docs:** `STYLE-CRYSTAL-LAB.md` (the look the game has now), `BATTLE-LOOK.md` (the JRPG battle look; real time kept, 2026-11-11), `DECISION-LOG.md` ("Stay 2D for now", 2026-11-09), `COMBAT.md`, `ART-PROCESS.md`, `OPEN-QUESTIONS.md`
- **The drafts:** `design/style-evolution/` (round 1) and `design/style-evolution/round2/` (how to make the pictures again: the README there)
- **The live test page:** `lab3d/` (the page), `tools/lab3d.js` (makes it), `design/style-evolution/live/` (the lab floor, its ways, the viewer, the page's template, the map), `tests/lab3d.js`

## 1. The requests

- The owner, 2026-11-15: "Im looking for a real update in style for the overall game. I want 3d or 2.5d graphics and I want to slow down the combat to make it completely readable. Can you give me 10 suggestions including example pictures. Im looking to evolve my game entirely"
- The owner, the same day, after round 1: "Reimagine it now". Round 2 is that: the same request, answered again from the start.
- The owner, 2026-11-16, of round 2: **"I like the direction of 1"** (`DECISION-LOG.md`).
- The owner, the same day, asked which piece to build first (a live 3D test room, the slower fight in today's game, or the look without a 3D engine): **"Live 3D test room"** (§8).

## 2. Earlier decisions this reopens

- **2026-11-09, "Stay 2D for now"** (`DECISION-LOG.md`). The owner then: "I intend to make this a fully 3-D game"; offered a prototype, going all in or staying 2D, they stayed 2D: "I don't wanna take any risks". A real-time 3D engine was left open for later.
- **2026-11-11, "Real-time stays"** (`BATTLE-LOOK.md` §2, item 1). Turn-based battles and "dramatic beats" (a freeze or slow motion on big moves) were offered and not chosen.

Both still stood after the owner's pick: direction 1 kept real time (it slowed the pace; it was not turn-based). *(2026-11-17: the owner's card battles replace real time in battles: turn-based, one card a turn from the whole squad, `CARD-BATTLES.md`. Round 1's 7 COMMAND MENU, 9 CARDS and 7's BATTLE STAGE are its nearest ancestors here.)* "Stay 2D" stands until the owner chooses between real 3D and 2.5D (§6).

## 3. Round 2: ten directions, reimagined (the current set)

### 3.1 What is different from round 1

- **The game's own room.** Every picture is the Crystal Chamber, the room the game's look was designed in, not the Sewers.
- **The game's own things, in 3D.** The room is built from the map, and its props are the models the game's pictures are baked from. Round 1 had bare walls and a rough ant.
- **Each direction is a whole game.** Its look, its camera and its fight belong together, and each picture carries a full mock of the screen you would play on.
- **They are grouped by how far they go** (§3.3), from the same game made clearer to a different kind of fight.

### 3.2 The pictures

- **One moment in all ten:** ants raid the Crystal. The player, the Jelly Ram, Stonepetal and the Rimestar hold them off; the sentry fires.
- **From the game** (`round2/export.js` reads it from the running game):
  - The room's tiles, walls, doors, wall fittings and floor marks.
  - Its props: the game's own 3D models (`design/props/models/`), each the variant the game picks.
  - The squad and the player: the forms' own models (`design/evolutions/`).
  - The Crystal's pad and tank: the game's models.
- **Modelled for the pictures** (stand-ins):
  - The ant, after the game's drawing of it (`js/bugs3d.js`: the same parts and measures, its heights raised by half). *(Superseded 2026-11-22 as the ant's 3D look: THE STALKER, variation D (earthy), the owner: **"Earthy and the sewers look good"**; its builder, `buildAnt` in `design/style-evolution/round2/chamber.js`, is now the Stalker's, and the game's 3D view draws it: `VIEW-3D.md` §4.4. These pictures and the test page `lab3d/`, a snapshot made before, keep the old ant until they are made again.)*
  - The crystal, its liquid and its bubbles, the doors and the wall fittings (the game paints these flat, in code).
  - The walls nearest the camera are cut down so it can see in.
- **The screens drawn over them** (bars, menus, cards, numbers, timings) are the agent's, for the picture. The move names are the game's; what they cost and do on these screens is not a proposal.
- **They are stills** from a software renderer (4 to 14 seconds each). They say nothing about speed on an iPad.

### 3.3 The ten

**A. The same game, clearer** (real time kept)

| No. | Look | Fight |
|---|---|---|
| 1 | **CRYSTAL LAB 3D.** The game's own cartoon lab (`STYLE-CRYSTAL-LAB.md`: flat colour, one bold ink line round every solid, neon seams) as a real 3D world. | **SLOWED AND SIGNALLED.** Real time at a slower pace. Every blow marks the floor before it lands: a red shape that fills for a creature's, a line for yours. |
| 2 | **THE LIVING DIORAMA.** Every room a little model on a table: soft light, soft shadows, a tilt-shift blur. | **TIME MOVES WHEN YOU MOVE.** Stand still and the fight holds, with a see-through copy of every creature where it will be. Move and time runs. |

**B. One action at a time** (the fight is put in order)

| No. | Look | Fight |
|---|---|---|
| 3 | **CRYSTAL NOIR.** The blackout as a look: the Crystal is the only light, the floor mirrors it, the doors burn red. | **THE CRYSTAL'S BEAM.** You draw the Crystal's light to a follower and that one acts; nobody else moves. The ants strike on a count you can see. |
| 4 | **INK AND SPOT COLOUR.** A comic: black ink and screen tone, colour only on the squad, the creatures and the Crystal. | **PANEL BY PANEL.** The fight is cut into exchanges of one blow each, played one after another, each in its own panel. You cut in between panels. |
| 5 | **PIXEL SQUAD.** 2.5D: the squad and the creatures as crisp pixel sprites, standing in a lit 3D lab. | **ACTIVE TIME.** Every unit's gauge fills. When one is full the world waits for its move, which plays by itself unless you choose. |

**C. A new point of view**

| No. | Look | Fight |
|---|---|---|
| 6 | **THIRD PERSON.** Full 3D at eye level: the camera behind your cube, the room standing tall around you. | **LOCK ON.** You face one creature at a time. Its move is announced, and you answer it: GUARD, DIVE or strike. The squad holds the others. |

**D. A new kind of fight**

| No. | Look | Fight |
|---|---|---|
| 7 | **CARTRIDGE 3D.** Chunky low-resolution 3D: big pixels, flat-shaded models, a short haze. A fight is staged side-on. | **COMMAND MENU.** A battle of turns: pick each member's move from its list and its target, then the round plays in order. |
| 8 | **FACET TACTICS.** Clean flat facets, like cut crystal, under a soft low light. The floor's tiles are the board. | **TURNS ON THE TILES.** Your side moves, then theirs. Blue is where a unit can go, red is what it can hit; cover and facing count. |
| 9 | **PAPERCRAFT.** Everything cut and folded from card: flat colour, a white cut edge, soft shadows, paper grain. | **CARDS.** Each follower's moves are cards in your hand. The Crystal's energy plays them. Then the ants take their turn, which is shown beforehand. |
| 10 | **THE WAR TABLE.** The whole facility as a hologram on a table: every room at once, the raid's route drawn through it. | **PLAN, THEN WATCH.** Before a wave you post the squad at doors and corners. The wave then plays by itself, as fast or slow as you like. |

### 3.4 The look and the fight are two choices

Any look can take any fight, for example CRYSTAL LAB 3D's look with THE CRYSTAL'S BEAM. None of the fights needs a new look: each can be tried in today's 2D game first.

## 4. What each would take (the agent's view)

**Today.** The game draws on a 2D canvas (56 of its 106 code files, about 3,600 drawing calls). Its forms, props and items are 3D models baked into pictures; no 3D runs in the game.

**Two ways to a new look**
- **2.5D:** keep the canvas and bake more from the models, in the chosen look. The smaller risk, but the light and the camera stay fixed.
- **Real 3D (WebGL), as in the pictures:** the rules, map, saves and menus stay; the drawing is rebuilt.
  - **Old iPads.** The game runs from iPadOS 13.4. WebGL 2 comes with iPadOS 15, so three.js would stay at a version that still draws on WebGL 1 (r162 or older), or the oldest iPads are dropped (open since 2026-11-11).
  - **Full-screen passes** (blur, glow, the mirror floor, screen tone) cost per pixel. An old iPad would need a LOW setting without them.

**Round 2, look by look**

| No. | The look needs | The fight needs |
|---|---|---|
| 1 | Real 3D, or baked 2.5D (from the fixed camera it is the look the game has now). The ink line is one more drawing of the scene. | Slower timings and floor marks. No new rules. |
| 2 | Real 3D. The blur is a full-screen pass. | A clock that runs only while the player moves, and a forecast of the next seconds. |
| 3 | Real 3D. The mirror floor draws the scene twice and the Crystal's shadows are costly: LOW would drop both. | A new way to give orders (the beam and its charges), and the ants on a count. |
| 4 | Real 3D, or today's canvas with zoomed insets. The screen tone is a full-screen pass. | The fight put in order by the game, one exchange at a time. |
| 5 | The sprites baked small, as now; the room in 3D or baked. | Gauges and the wait at a full gauge. |
| 6 | Real 3D only. Every room must look right from inside (ceilings, far walls), and it needs new controls and a camera that avoids walls. The largest job. | Lock-on, and the player's GUARD and STUN DIVE as the main moves. |
| 7 | Real 3D at a quarter of the pixels: the cheapest to draw. | A turn-based battle system. |
| 8 | Real 3D or baked 2.5D. | A turn-based system on the tiles (the map is already tiles; cover exists). |
| 9 | Real 3D or baked 2.5D. | A card system for moves (the game's cards are not moves today). |
| 10 | Lines: it could be drawn on today's canvas. | A plan-and-watch mode on top of the raids and sentries the game has. |

**The safe first step** (as offered on 2026-11-09): one room in real 3D behind a flag (`?engine=3d`), measured on the owner's iPads before anything else changes. Round 2's scripts already build the Crystal Chamber from the game's map and prop models; they draw stills offline, not the game.

## 5. The agent's recommendation (a suggestion, not a decision)

- **The look: 1, CRYSTAL LAB 3D.**
  - It is the style the owner already approved, carried into 3D. There is no new art direction to find.
  - Flat colour and one ink line are cheap to draw, and they keep the squad and the creatures apart from the room at a glance.
- **The fight, the smallest step: 1, SLOWED AND SIGNALLED.** It keeps every rule and can be tried in today's game.
- **The fight, the boldest that suits the game: 3, THE CRYSTAL'S BEAM.** One action at a time, chosen by a drag, and it gives the Crystal a part in every fight. It works with look 1.
- **Then, by `ART-PROCESS.md`:** once a direction is chosen, one piece first (one room, one form) before the rest.

## 6. Open questions

1. ~~Which look, or which mix?~~ *(answered 2026-11-16: direction 1, "I like the direction of 1")*
2. ~~Which fight?~~ *(answered with it: direction 1's, slowed and signalled; real time stays. Superseded 2026-11-17: turn-based card battles, `CARD-BATTLES.md`.)* Still open: **how slow, and which marks**. The test page now lets the owner try four paces and one set of marks by eye (§8.3, §8.10). The game already has wind-ups to build on (a creature rears back before a bite, `COMBAT.md`).
3. Real 3D or 2.5D? ~~Which piece is built first?~~ *(answered 2026-11-16: "Live 3D test room"; built, §8.)* ~~What next in it?~~ *(answered 2026-11-16, all three: "Walk the lab floor", "A fight at the new pace", "A battle camera"; built, §8.2 to §8.4.)* Still open: **what the page reads on the owner's two iPads as it is now** (one reading of the first room: 52 fps), and then real 3D or 2.5D.
6. The test page's own choices, each the agent's and for the owner to keep or change: the walls in front of your room sinking (the game's walls always stand), the fight's stand-in numbers (§8.3), the CAMERA button's two angles (§8.4). ~~The camera coming down by itself in a fight~~ *(answered 2026-11-16: taken out; "Just make it to where it's always near the player, and the player can change the angle of it".)*
4. The oldest iPads (iPadOS 13.4 to 14): keep them (WebGL 1, an older three.js), or not?
5. A reference would help the next step: a game, a screenshot or a picture that shows the feel the owner has in mind (`ART-PROCESS.md`).

## 7. Round 1: the first set (kept; any of it can still be chosen)

**Its pictures.** One moment in all ten: the Sewers' north bank by Side Quest's gate; the player, the Jelly Ram, the Electro Skink and the Fire Egg against three toxic ants. Built in 3D from the map's floor, walls, river, bridges and gate and the forms' models; the ants a rough stand-in; no props.

| No. | Look | Fight |
|---|---|---|
| 1 | **DIORAMA.** Real 3D, soft shadows, warm light; a tilt-shift blur makes the facility a model on a table. | **SLOW TIME.** When a creature engages, the clock runs at 40%. Every blow shows a wind-up ring filling under its attacker before it lands. |
| 2 | **PIXEL SQUAD, 3D WORLD.** A lit 3D world with depth of field and glow; the creatures are crisp pixel sprites standing in it. | **TURN QUEUE** (active time). Every unit's gauge fills; when it is full, that unit acts, one at a time, while the others hold still. |
| 3 | **INK TOON.** Cel-shaded 3D with thick ink outlines and flat bright colour: the game's bold outlines, in real 3D. | **TELEGRAPHS.** A creature's attack marks the floor first (a red shape that fills), and you have a beat to step out of it. |
| 4 | **LOW-POLY TACTICS.** Flat-shaded low-poly 3D, a clean palette, the tile grid shown on the floor. | **TURN BY TURN ON THE GRID.** Your unit's moves in blue, its reach in red, action points to spend; then the creatures move. |
| 5 | **VOXEL LAB.** The facility and every creature built of small cubes. Chunky and clear at a glance. | **PAUSE AND PLAN.** Real time, but a tap stops everything. You draw each member's order, then let it run. |
| 6 | **HOLO-TACTICAL.** The facility as a dark hologram in glowing lines; the squad in cyan light, the creatures in red. | **INTENT AND THREAT.** Every creature shows what it will do next, to whom, for how much and when, and a list shows the next three seconds. |
| 7 | **BATTLE STAGE.** Explore as now. When a fight starts, the camera drops to a close, low 3D battle view, lit like a stage. | **COMMAND MENU.** Choose each member's move (attack, skill, Ultimate, item, guard), then the round plays out in order. |
| 8 | **NOIR LIGHT.** A dark facility lit only by its lamps, the squad's lights and the glowing river; beams in the haze. | **SPOTLIGHT AND HIT-STOP.** Whoever acts is lit and everyone else dims. Every blow freezes for a beat with its number big. |
| 9 | **TABLETOP.** Painted miniatures on round bases on a board of the map, a warm lamp over it, shallow focus. | **CARDS.** Each round you play cards from a hand (the game's own energy and combat cards) in the order of an initiative track. |
| 10 | **PAINTED.** The 3D scene as an oil painting: warm, soft, a storybook. | **HEAVY AND DELIBERATE.** Still real time, but each unit acts at most once every two seconds, with a big wind-up, one shot in the air each. |

**Round 1's fights, by how much they change the game**
- Real time kept, with reading aids: 1 SLOW TIME, 10 HEAVY AND DELIBERATE, 3 TELEGRAPHS, 6 INTENT AND THREAT, 8 HIT-STOP.
- Real time with a pause: 5 PAUSE AND PLAN.
- Turn-based: 2 TURN QUEUE, 4 THE GRID, 7 COMMAND MENU, 9 CARDS.

**Round 1's recommendation, as given then:** the DIORAMA look with SLOW TIME, TELEGRAPHS and an intent chip, starting as an `?engine=3d` prototype of the Sewers. Round 2's (§5) replaces it as the agent's suggestion.

## 8. The live 3D test page (`lab3d/`)

*(Then the owner chose **"The real game in 3D"** (2026-11-16): the actual game drawn in this look, area by area, behind `?engine=3d`. That is `VIEW-3D.md`; this page stays a test page. The two share the drawing core, `view3d/core.js`, and three.js, `vendor/three.min.js`.)*

- **Status:** **Implemented; verified** by `tests/lab3d.js` (21 checks) in a headless browser with software WebGL (WebGL 2 and WebGL 1). **Measured on one iPad once, before the lab floor and the fight were added** (§8.9). Not measured since. **The fight is a test of pace and signals: its rules and most of its numbers are the agent's stand-ins (§8.3), and none is a decision about the game.**
- **The asks** (the owner):
  1. 2026-11-16, of three first pieces: "Live 3D test room": the Crystal Chamber running in real 3D in look 1, on a separate page with a frame-rate readout, to try on both iPads.
  2. 2026-11-16, having seen it run: "Wow, that's exciting. I'd love to see more". Asked what to see next in the page (one or more of three), all three: **"Walk the lab floor"**, **"A fight at the new pace"**, **"A battle camera"**.
  3. 2026-11-16, having tried those, "My only two critiques":
     - "every now and again when I finish a battle, maybe the player or the models get squashed by something. I'm not sure what it is, but they get squashed on the map and then they return to normal." It was the agent's own way of showing one of yours at no health. Taken out (§8.3).
     - "it automatically zooms into action that happens across the map, and that interferes with the auto camera mode, which I don't know. **Just make it to where it's always near the player, and the player can change the angle of it.**" Done (§8.4).

### 8.1 What it is

- A page of its own, `lab3d/index.html`. The game does not load it or link to it, and it changes nothing in the game.
- The lab's ground floor, the eight rooms on the Crystal Chamber's level, in the look of picture 1 from the same code (`round2/` `STYLES.lab`): flat cartoon colour and one ink line round every solid.
- It opens on the Crystal Chamber, as picture 1 has it, with a raid arriving at the chamber's east door.

### 8.2 Walk the lab floor

- **Tap the floor**: the cube walks there by the shortest way round the walls and the props. The squad follows in its steps, and gathers round it when it stops. The camera is always on the cube (§8.4).
- **The rooms** (1,080 tiles, 76 props, from the game's map and the game's own prop models): Crystal Chamber, Teleport Room 1, Server Room, Security Room, Warehouse, the Hallway, The Lounge, the narrow passage. Each has its own floor and wall colours (the game's `FP_ROOM_STYLE`); the Lounge is wood and the passage a grate. The room's name shows at the top.
- **The walls.** The game spaces its rooms a tile apart and that gap is the wall. Here each tile of it is a block a tile thick, one wall between two rooms.
  - **The walls in front of the room you are in sink into the floor**, leaving a cut stub (picture 1's cut-down near walls). Walk into the next room and they rise behind you while its own sink. In the game a wall always stands at full height; this is the test page's way of seeing into a room in 3D, and it is the agent's.
  - Where two rooms touch with no gap the wall is thin: glass (the Warehouse's west side) or a solid divider (the Lounge's south side).
- **The ways out** of these eight rooms are not built: the door to the deck is shut, and the arena's door and the two stairs end in a dark apron.

### 8.3 A fight at the new pace

- **Raids** come by themselves: three waves of ants (3, 4 and 5), up from the arena's door and round to the Crystal by either of the chamber's doors. A wave sets out when one ant of the wave before is left. A raid held, there is a rest, and the next comes. RAIDS turns them off.
- **The squad fights by itself**: the Jelly Ram, Stonepetal and the Rimestar go for the nearest ant; the two sentries fire. You walk the cube, which does not attack. Ants go for whoever of yours is near, else for the Crystal.
- **Every blow is marked on the floor before it lands.** Its shape appears with its outline and fills; when it is full the blow lands **on whoever stands in the shape at that moment**, so stepping out of a shape is stepping out of the blow.

| Blow | Its shape on the floor |
|---|---|
| An ant's bite; the Jelly Ram's WOBBLE SLAM | A wedge in front of it |
| Stonepetal's STAKE RING | A disc round its target; stakes rise in it |
| The Rimestar's ICICLE VOLLEY; a sentry's beam | A strip from it to its target |
| A striker ant's lunge | A dashed line with an arrowhead, then it dashes along it |

- The ants' marks are red, yours cyan. Bars stand over the ants, and over yours and the Crystal once hurt; a bar keeps a pale piece of the health just lost (the game's `lagBar`). Numbers rise from each blow. The Crystal's health and the wave are at the top left.
- **PACE** (×1, ×0.8, ×0.6, ×0.4; it starts at ×0.6, picture 1's): the speed of the fight's clock. **While a fight is on, everything runs at that pace**, the cube's walk too; with no fight on, the page runs at ×1. FIGHT SPEED shows at the top while it applies.

**What is the game's, and what is a stand-in**

| The game's own (at PACE ×1) | Where from |
|---|---|
| The four ants' speed, health and power | `js/species.js`, the first ants: worker 1.44 tiles a second, 45, 7; scout 1.32, 60, 18; striker 1.08, 100, 27; soldier 0.72, 180, 38 |
| The bite's two beats and its reach | `js/combat.js` `COMBAT.bite`: it rears back 18 frames, lands, rests 45; reach 1.5 tiles |
| The Rimestar's wind-up and rest | `js/npc.js`: 12 frames and 55 frames |
| One of yours at no health: a follower leaves and is back by the Crystal three seconds later (of the fight's clock), its health as it was; the cube is set back by the Crystal | `js/game.js` (a follower's 180 frames on the respawn queue); `PLAYER-COMBAT.md` (the knockout) |

- **One of yours at no health** shrinks away where it fell; a line under the Crystal's meter says who is coming back and in how long (the game has a ticker over the Crystal). No model is ever flattened: that was the agent's own way of showing it (flattened where it stood for five seconds, then up at half health), and it read as a fault.

**Stand-ins, the agent's, for this page only:** the squad's health, speeds, reach and damage; the Jelly Ram's and Stonepetal's timings; the sentries' beam; the lunge; the Crystal's 400 health; the waves; how far an ant notices; that the ants hurry up the hallway (6 tiles a second, outside the pace) until they are near; the cube's bar of 100 (the game's player has three hits); that a follower come back walks to you (in the game it waits by the Crystal for you). None of the game's damage types, statuses, cards or abilities is in it, nor the cost of a return in the Crystal's power.

### 8.4 The camera

- **It is always on the cube** (the owner, 2026-11-16: "Just make it to where it's always near the player, and the player can change the angle of it"). The cube sits a little above the middle of the picture, as picture 1 has it, so more of the floor in front of it shows over the buttons.
- **You change the angle:** one finger turns and tilts it (kept on the side the walls sink on); two fingers come nearer, or go far enough out to see the whole floor.
- **CAMERA** swings it to one of two angles, **FAR** (picture 1's, where it starts) and **NEAR** (lower and closer), and the finger goes on from there. The two angles are the agent's.
- **It never moves by itself**, but for a little sway when left alone.
- **Superseded, 2026-11-16: the battle camera that came down by itself** (AUTO). Asked for as "A battle camera", it came down close to a fight when one was on and went back out after; it looked at the middle of the fight, wherever that was, and sank the walls in front of it. The owner, having tried it: "it automatically zooms into action that happens across the map, and that interferes". Taken out. Only the walls in front of the room the cube is in sink now.
- The game has a battle view of its own (`js/battleview.js`: a zoom, soft edges, faint walls). This page does not use it.

### 8.5 The readout and the switches

- **The readout** (top right): frames a second, milliseconds a frame and the worst frame, draws and triangles a frame, the picture's size in pixels, WebGL 1 or 2.
- **Three small switches** under it, to see what each costs:
  - INK LINE: off, the room loses its outline and its second drawing.
  - SHADOWS: off, no shadow drawing.
  - SHARP: 1×, 1.5× or 2× the screen's points in pixels (never more than the screen has).
- In the address: `?ink=0`, `?shadows=0`, `?sharp=`, `?cam=`, `?pace=`, `?raid=0`, `?gl=1` (WebGL 1, as an iPad before iPadOS 15), `?chunk=N` (§8.6).

### 8.6 How it is drawn cheaply (`design/style-evolution/live/viewer.js`)

- **Merged.** Everything that stands still is one mesh a material, a room at a time, in squares of 7 tiles so what is out of sight is not drawn (`?chunk=N` tries another size: smaller means fewer triangles and more draws). Plain materials that differ only in colour share one, the colour carried in the vertices. The page builds 7,828 meshes and draws 673.
- **A plain copy for the second and third drawings.** The ink line needs the room drawn again in each solid's flat colour, and the shadows need its shape. Neither needs materials, so each square of a room has one plain copy for those two drawings: one draw there, not one a material.
- **Shadows every other frame.**
- **The marks on the floor, the bars and the numbers** are each one mesh, written again every frame.
- **A frame at the Crystal Chamber**, ink line and shadows on: 386 draws and 597,000 triangles with the shadows' drawing, 288 and 355,000 on the frames between. In a fight, 393 and 672,000, and 294 and 418,000. (The first test room, one room and no fight: 395 and 397,000 every frame.)

### 8.7 How it is made

- `node tools/lab3d.js` writes `lab3d/lab3d.js` (the forms' and props' models; round 2's kit, chamber and styles; `live/floor.js`, `live/walk.js`, `live/viewer.js`; the lab floor's map, `live/lab.json`; comments out) and `lab3d/index.html` (from `live/page.html`). `--export` reads the eight rooms from the running game first (`round2/export.js --lab`).
- The rooms' floor marks, wall fittings and props are round 2's room builder (`round2/chamber.js` `buildRoom`), now able to build any room. The ten still pictures render byte for byte as before.
- three.js r128 as published (MIT, `vendor/three.LICENSE.txt`), the bakers' version, which still draws on WebGL 1, is `vendor/three.min.js` (it was `lab3d/three.min.js`): this page loads it, and so does the game's 3D view, only with its switch on (`VIEW-3D.md`).
- **It is a snapshot** of the map and the models at the build the page names. Nothing remakes it when they change and no test fails when it is behind; run the tool to bring it up to date.

### 8.8 What it is not

- **Not the game, and not a design of the game's fight.** It is a place to see the look move, to feel a pace, and to read a frame rate.
- **Not the whole facility**: one level, eight rooms. No deck, arena, Nest, sewers or domains.
- Its ant, crystal, doors, glass and wall fittings are modelled for the pictures after the game's drawings (§3.2); the game draws those in code. *(The page's ant is the one of its making, 2026-11-16; since 2026-11-22 its builder makes THE STALKER, D (`VIEW-3D.md` §4.4), which the page shows only once `node tools/lab3d.js` makes it again.)*
- The ways it finds (`live/walk.js`, a grid) are its own, not the game's (`js/facility.js`).

### 8.9 Readings

- **The owner's first, 2026-11-15** (a screenshot from the live site, Chrome on an iPad; 2732 pixels wide, so a 12.9-inch one by the agent's reading), of the first test room (one room, a loop, no fight): **52 fps**, 19.2 ms a frame, worst 20, with INK LINE on, SHADOWS on and SHARP at 2× (2732 × 1784 pixels, WebGL 2), 395 draws. The owner: "Wow, that's exciting. I'd love to see more".
  - It was the heaviest setting the page had, on the sharpest screen an iPad has, and just under the screen's 60.
  - **Seen in that picture: the glow round the Crystal drew as a ring of coloured dots.** Changed since (not yet seen on an iPad): the picture is now drawn in the colours the screen shows rather than in linear light turned at the end (eight bits of linear light are too few in the dark, where one step shows as thirteen), and the glow's soft disc is made from numbers, not from a canvas gradient (which an iPad's browser dithers).
- **Not read yet:** this page as it is now, on either iPad; the older iPad at all.

### 8.10 What to read, and what to tell

On each iPad:
1. The rate at the Crystal Chamber in a fight, everything on (SHARP 1.5×, then 2×).
2. The rate walking the Hallway and the Warehouse, the heaviest rooms.
3. The rate with INK LINE off, and with SHADOWS off.
4. Whether the glow round the Crystal is smooth now.
5. On the older iPad: whether it starts at all, and whether walking feels smooth.

And by eye, which the page cannot measure:
- **Which PACE reads best**, and whether the marks give enough warning at it.
- Whether the walls sinking are right, or too much; whether the CAMERA button's two angles are the right two.
