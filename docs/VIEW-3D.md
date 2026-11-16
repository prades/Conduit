# The game in 3D (the 3D view)

**Status:** Stage 1 **implemented** on branch `claude/start-game-project-HSh7Z`, build `2026-11-16a`, **behind a switch** (`?engine=3d`). Verified in a headless browser with software WebGL (`tests/view3d.js`). **Not seen on an iPad.** Without the switch the game is exactly as before, and that is what players get until the owner says otherwise.

## 1. The decision

The owner, 2026-11-16, having picked round 2's CRYSTAL LAB 3D (`STYLE-EVOLUTION.md`) and tried it on the test page (`lab3d/`): **"Can we build the full game up to this point?"** Asked which way, they chose **"The real game in 3D"**. The option read:

> Your actual game, drawn in this 3D look, built area by area. Its rules, squad, creatures, cards and saves stay exactly as they are; only the drawing changes. It runs behind a switch while it grows, so today's 2D game keeps working and stays what players get until you say otherwise. This is the "move to real 3D" decision: with the switch on, the game loads the 3D engine. I start now with the real game's lab floor.

This answers the open question "Real 3D or 2.5D?" with real 3D, and supersedes "Stay 2D for now" (2026-11-09) in part: the 2D game stays the default (`DECISION-LOG.md`).

## 2. What it is

- **The same game, drawn in 3D.** The rules, the squad, the creatures, the cards, the saves, the panels and every tap are the game's own and are not touched. Only the world and the bodies in it are drawn by a 3D view, in the chosen look.
- **The switch:** `?engine=3d` in the address (`js/config.js` `VIEW3D_ON`), on `play.html` or `game.html?dev`. Without it nothing of the view is fetched or run.
- **Built area by area.** Where the view has built the room you are in, it draws the frame's world; anywhere else the frame is the 2D game's, as before.
- More in the address, as on the test page: `?ink=0`, `?shadows=0`, `?sharp=1.5` (more pixels; the game's own canvas has one a point), and `?dark=game` (§4.3).

## 3. The stages (the agent's plan, for the owner to reorder)

1. **The lab's ground floor** (the eight rooms of the test page): **built**, this stage.
2. The other rooms in the lab's style, and the other levels (the deck, the arena, the Experiment Lab, the Cold Storage).
3. The caves, the water and the dark places: the sewers, the Nest, the domains.
4. Models for the other creatures: the beetle, scorpion, spider, mantis, moth, roly-poly and larva (the ant has one), the clones, the bosses.
5. The effects in 3D: the attacks, the Ultimates, the numbers and words (today the 2D ones are laid over the picture).
6. Turning and tilting the camera, once the effects are 3D (the 2D effects are drawn for the game's one angle).
7. Then: the battle view's zoom in 3D, real lights for the dark rooms, the 3D view as the default.

## 4. Stage 1: what it draws

### 4.1 The camera
**The game's own camera**: the same angle (2:1, 30° down), the same scale (a tile `TILE_W` px across) and centred on the player, riding the player's floor as the game's does (`js/facilityplay.js` `_fpP`, `_fpCam`). A point of the world is on the screen exactly where the game's drawing puts it (within a pixel, tested), so every 2D drawing laid over the picture lies where it did: bars, plates, effects, marks, the start screen's panels, and every tap.

### 4.2 The world
- **The eight rooms** read from the running game when the view is made (`view3d/gamemap.js`), built as the test page builds them (`design/style-evolution/live/floor.js`, round 2's `chamber.js` for each room's props, wall fittings and floor marks; the props from the game's own models).
- **The walls in front of the room you are in sink** into the floor (the test page's way; the game's 2D walls cut down).
- **The doors** slide open and shut as the game's do (`facilityDoorsTick`).
- **The stairs**: a tile higher or lower than its room (the hallway's stairs down to the arena, Teleport Room 1's up to the deck) stands at its height, with risers.
- **The Crystal** turns and bobs in its tank as the game's does, amber when it is hurt, red when it is failing (the game's three bands).

### 4.3 The light
The game's own light (`js/facilitystyle.js`): the room you are in is lit, the others are dark, an open door throws a pool of light, a blackout leaves only the emergency lights. A map of the tiles is written from the game's levels each frame (only when they change is it sent on) and laid on every surface of the world by the tile in front of it.

**The agent's choice, the owner's to make:** the room you are in is drawn as bright as the chosen look (the pictures the owner chose), and a dark room as much darker than it as the 2D game's dark rooms are than its lit room. The 2D game draws its lit room two fifths darker than its palette (the owner, 2026-11-09, `FP_LIT`); `?dark=game` draws the 3D room you are in that dark too, to compare.

### 4.4 The bodies
- **The cube, the eggs and the evolved forms** are their own 3D models: the ones their sprites are baked from (`design/evolutions`), built as the bakers build them (`design/evolutions/bake.js`, whose table of jobs goes into the view), at the sprites' scale, turned to the sprites' row and posed for the sprites' frame (`js/hdsprites.js`, `js/evolution.js` `_evoFrame`): idle breaths, walking, signature moves, special blocks, the class gear, red eyes when angry, the evolved forms growing as they molt.
- **The ants** are the ant model at the game's own measures (`js/bugs3d.js`), each class at its width, turned to its heading, lunging forward on a bite with its jaws wide, its legs in step while it walks, every foot down while it stands.
- **A body stands where the game has the unit**: its x and y, on its floor. The 2D drawing put a unit's feet half a tile up the screen from there (the top corner of its tile), so while the view shows, the game draws what goes over a unit (its bars, plate, rings) half a tile lower, with the body (`js/view3d.js` `view3dFeet`; `js/game.js`; `js/input.js` for tapping a follower).
- **Still the game's 2D drawing:** the other creatures, an ant that is a clone, an ally, a nymph or a boss, a form still cracking out of its egg, one under the floor, a ghost, one in smoke form, and anyone standing outside the built rooms.

### 4.5 What is still drawn in 2D, over the picture
- Everything over a unit, the effects, the numbers and words, the panels and cards.
- **The floor's marks that are play** (the evolved forms' pools, fire, acid, the serum's pool, the Frost Patch, the Mage's aura, THORNWHIP's thicket and seedfall, HEXFIRE, the meteor craters, the long-press ring) are the game's own 2D drawing, made into a layer the view lays on its floor, under all that stands on it.
- **The facility's items the view does not build:** pickups, a station's ring, a follower's spot (in the rooms it has built).

### 4.6 Not in stage 1
- The battle view's zoom: off while the 3D view shows.
- Turning the camera (§3).
- A body's flash when it is hit (its bars and numbers show the hit).
- The stairs' floor marks follow the room's floor, not each tread.
- A relay's or charger's look as it powers up (built as "on").
- Props that move or are taken away in play: none in the lab's eight rooms.

## 5. How it works

| Piece | File |
|---|---|
| The switch; fetching three.js and the view behind the start screen; whether a frame is the view's; the floor-marks layer; a unit's offset | `js/view3d.js`, `js/config.js` (`VIEW3D_ON`; the game's canvas see-through with the switch on), `js/init.js` (`_suAssets`) |
| The hooks in the game's frame | `js/game.js` (`clearFrame`, the draw list, `drawFloorTileMarks`), `js/facilityplay.js` (`facilityDrawItems`), `js/draw.js` (the bodies), `js/input.js` (tapping a follower) |
| The game's map, read from the running game | `view3d/gamemap.js` (the test page's exporter uses it too) |
| The drawing: the renderer, the world merged so it is cheap, the ink line, the shadows, an ant's body | `view3d/core.js` (the test page uses it too) |
| The view: camera, light, doors, Crystal, bodies, the floor marks laid on | `view3d/gameview.js` |
| One script of all that, with the forms' and props' models and the bakers' table | `dist/view3d.js`, made by `node tools/view3d.js` (the stamp runs it); never edit it by hand |
| three.js r128 (MIT, `vendor/three.LICENSE.txt`), shared with the test page | `vendor/three.min.js` |

- **The view's own canvas** lies under the game's. While the view shows, the game's frame is cleared to nothing where the world is, and draws no floor tile, wall or prop.
- **A failure never stops the game**: if three.js or the view does not load or throws, the game is drawn in 2D as ever, and `VIEW3D.error` says why.
- **Cost** in the test browser (software WebGL, which says nothing of an iPad): about 420 draws and 350,000 triangles a frame in the Crystal Chamber with its squad, and 380 to 670 in the other rooms; the view's script is 1.6 MB and three.js 0.6 MB, fetched only with the switch on; the view is made in a few seconds behind the start screen.

## 6. Tests

`tests/view3d.js`: the files (the view's script fresh from its sources; every evolved form, the cube and every egg in the bakers' table; three.js r128 with its licence; fetched only through `js/view3d.js` behind the switch; the page loads it before the boot check). Then, in a real browser: **off**, nothing of it is fetched or made and the game's canvas is opaque; **on**, it is made with no error and shows in the Crystal Chamber with a picture that is not blank; **the camera** is the game's projection to the pixel, on the floor, up a wall, at the gem and down the stairs; **the bodies** (the cube, an egg, an evolved form, an ant; a beetle left to the game; what is over a unit drawn with its body); **the world** (a door as open as the game's; light and dark rooms; a blackout; the floor marks laid on; the items kept); **away** in the arena it hides and the frame is the 2D game's; **a failure** leaves the game in 2D.

## 7. Open questions

- The room you are in: as bright as the chosen look, or as dark as the 2D game's (`?dark=game`)? (§4.3)
- The order of the stages (§3).
- How fast it runs on the owner's iPads, the old one too (WebGL 1 is tested on the test page, not here).
- When the 3D view becomes the default.
