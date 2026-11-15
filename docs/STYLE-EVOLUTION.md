# The game's look and combat, evolved (3D or 2.5D, a slower fight)

- **Status:** **Proposed.** Two rounds of ten directions, each with an example picture, for the owner to choose from. Round 2 (§3) is the current set; round 1 (§7) is kept. Nothing is built in the game and nothing here is approved.
- **Owner:** the user (creative direction); the agent (drafts and implementation support)
- **Last updated:** 2026-11-15
- **Branch/build context:** `claude/start-game-project-HSh7Z`, build `2026-11-15j` (the game is unchanged by this)
- **Related docs:** `STYLE-CRYSTAL-LAB.md` (the look the game has now), `BATTLE-LOOK.md` (the JRPG battle look; real time kept, 2026-11-11), `DECISION-LOG.md` ("Stay 2D for now", 2026-11-09), `COMBAT.md`, `ART-PROCESS.md`, `OPEN-QUESTIONS.md`
- **The drafts:** `design/style-evolution/` (round 1) and `design/style-evolution/round2/` (how to make the pictures again: the README there)

## 1. The requests

- The owner, 2026-11-15: "Im looking for a real update in style for the overall game. I want 3d or 2.5d graphics and I want to slow down the combat to make it completely readable. Can you give me 10 suggestions including example pictures. Im looking to evolve my game entirely"
- The owner, the same day, after round 1: "Reimagine it now". Round 2 is that: the same request, answered again from the start.

## 2. Earlier decisions this reopens

- **2026-11-09, "Stay 2D for now"** (`DECISION-LOG.md`). The owner then: "I intend to make this a fully 3-D game"; offered a prototype, going all in or staying 2D, they stayed 2D: "I don't wanna take any risks". A real-time 3D engine was left open for later.
- **2026-11-11, "Real-time stays"** (`BATTLE-LOOK.md` §2, item 1). Turn-based battles and "dramatic beats" (a freeze or slow motion on big moves) were offered and not chosen.

Both stand until the owner chooses here. In round 2, directions 3 to 5 and 7 to 10 would supersede the second (they are not plain real time), and 1 and 2 bring back a slower clock.

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
  - The ant, after the game's drawing of it (`js/bugs3d.js`: the same parts and measures, its heights raised by half).
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

1. Which look, or which mix? Round 1's looks (§7) can still be chosen.
2. Which fight? Does "real time stays" (2026-11-11) still hold?
3. Real 3D or 2.5D? If real 3D, the Crystal Chamber behind a flag first?
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
