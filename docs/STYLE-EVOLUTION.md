# The game's look and combat, evolved (3D or 2.5D, a slower fight)

- **Status:** **Proposed.** Ten directions with an example picture each, for the owner to choose from. Nothing is built in the game and nothing here is approved.
- **Owner:** the user (creative direction); the agent (drafts and implementation support)
- **Last updated:** 2026-11-15
- **Branch/build context:** `claude/start-game-project-HSh7Z`, build `2026-11-15j` (the game is unchanged by this)
- **Related docs:** `BATTLE-LOOK.md` (the JRPG battle look; real time kept, 2026-11-11), `DECISION-LOG.md` ("Stay 2D for now", 2026-11-09), `COMBAT.md`, `EFFECTS.md`, `ART-PROCESS.md` (drafts first), `OPEN-QUESTIONS.md`
- **The drafts:** `design/style-evolution/` (how to make the pictures again: its README)

## 1. The request

The owner, 2026-11-15: "Im looking for a real update in style for the overall game. I want 3d or 2.5d graphics and I want to slow down the combat to make it completely readable. Can you give me 10 suggestions including example pictures. Im looking to evolve my game entirely"

## 2. Earlier decisions this reopens

- **2026-11-09, "Stay 2D for now"** (`DECISION-LOG.md`). The owner then: "I intend to make this a fully 3-D game"; offered a prototype, going all in or staying 2D, they stayed 2D: "I don't wanna take any risks". A real-time 3D engine was left open for later.
- **2026-11-11, "Real-time stays"** (`BATTLE-LOOK.md` §2, item 1). Turn-based battles and "dramatic beats" (a freeze or slow motion on big moves) were offered and not chosen.

Both stand until the owner chooses here. A turn-based fight (directions 2, 4, 7, 9) or a freeze or slow motion (1, 8) would supersede the second.

## 3. The pictures

- **One moment of play in all ten:** the Sewers' north bank by Side Quest's gate. The player, the Jelly Ram, the Electro Skink and the Fire Egg fight three toxic ants.
- **Built in real 3D** (three.js r128, the version the bakers use) from the game's own map and models:
  - `export.js` reads the floor, walls, river, bridges, gate and lamps from the running game.
  - The player (No. 814) and the squad's forms are their own models (`design/evolutions/`).
  - The ants are a stand-in made for the pictures. The game draws its ants in code (`js/bugs3d.js`).
- **The fight ideas are drawn over each picture:** rings, menus, cards, numbers. Every number, word, colour and size in them is the agent's, for the picture. None is a proposed value.
- **They are stills,** made in a software renderer in 1 to 9 seconds each. They say nothing about speed on an iPad.

## 4. The ten directions

Each has a look and a way of making the fight slow and readable. The two halves are separate choices (§5).

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

## 5. Two choices: the look and the fight

Any look can take any fight, for example INK TOON's look with SLOW TIME. The fights, by how much they change the game:

- **Real time kept, with reading aids:**
  - 1 SLOW TIME and 10 HEAVY AND DELIBERATE slow it down.
  - 3 TELEGRAPHS and 6 INTENT AND THREAT show a blow before it lands.
  - 8 HIT-STOP pauses on each blow.
- **Real time with a pause:** 5 PAUSE AND PLAN. It is close to today's orders (COME, HOLD, drawn paths).
- **Turn-based:** 2 TURN QUEUE, 4 THE GRID, 7 COMMAND MENU, 9 CARDS.
  - These change the most: creature behaviour, every attack's timing, the squad's orders, the player's GUARD and STUN DIVE, and how `tools/balance-trial.js` measures a fight.

The fight ideas do not need the new look. Any of them can be tried in today's 2D game first.

## 6. 3D or 2.5D: what it would take (the agent's view)

**Today**
- The game draws on a 2D canvas: 56 of its 106 code files, about 3,600 drawing calls.
- Its forms, props, items and effect pieces are 3D models baked into pictures. No 3D runs in the game.

**2.5D: keep the canvas, bake more from models**
- The walls, floors and props would be baked in the chosen look, as the creatures already are.
- This is the smaller risk, but the light stays baked: no moving lights or shadows.
- Some looks fit it: 3, 4, 5, and 2's sprites. Others do not: 8's moving light, and the full-screen filters of 1 and 10.

**Real 3D (WebGL), as in the pictures**
- The rules, map, saves and menus would not change. The drawing would be rebuilt.
- **Old iPads.** The game runs from iPadOS 13.4. WebGL 2 comes with iPadOS 15, so either three.js stays at a version that still draws on WebGL 1 (r162 or older), or the oldest iPads are dropped (open since 2026-11-11).
- **The full-screen passes** (the blur, glow, depth of field and paint filter) cost per pixel. An old iPad would need a LOW setting without them.

**The safe first step** (as offered on 2026-11-09): a prototype behind a flag (`?engine=3d`), the Sewers only, measured on the owner's iPads before anything else changes.

## 7. The agent's recommendation (a suggestion, not a decision)

- **The fight: 1 SLOW TIME with 3's TELEGRAPHS and 6's intent chip** on the creature about to act.
  - It slows the fight and shows every blow before it lands.
  - It keeps real time and every rule, so the 2026-11-11 choice stands.
  - It can be tried in today's game first.
- **The look: 1 DIORAMA.**
  - It is closest to today's facility (the same panels, lamps and kerbs, in real light).
  - 3's ink outlines can be added on the creatures if they get lost against the floor.
  - It should start as the `?engine=3d` prototype of the Sewers, measured on the iPads.

## 8. Open questions

1. Which look, or which mix?
2. Which fight idea or ideas? Does "real time stays" (2026-11-11) still hold?
3. Real 3D or 2.5D? If real 3D, a prototype behind a flag first?
4. The oldest iPads (iPadOS 13.4 to 14): keep them (WebGL 1, an older three.js), or not?
