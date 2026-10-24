# The playable tutorial milestone — inspection, plan, and phase reports

The tutorial is an extension of the facility mode (`?facilityplay`, docs/FACILITY.md), not a rewrite. The facility already runs on the strip game's player, followers, enemies, Crystal, wave and power code (`facilityPlayStart` resets the strip game and puts the Crystal, the player and three followers in the Crystal Chamber; the strip game's save is never touched).

## What the project has, and what it does not (inspection)

| Wanted | State | Where |
|---|---|---|
| Dark facility, head lamp, emergency lights | **Built in phase 2** | js/facilitytutorial.js, js/facilitystyle.js (room lighting), js/facilityplay.js |
| Room lighting (a room is lit while the player is in it and dark when they leave; open-door pools) | existed | js/facilitystyle.js `_fpLightUpdate` |
| Followers: recruiting, bonds, evolution (a form and a signature move at level 10), roles, the Command Center | **exists** | js/evolution.js, js/bonds.js, js/commandcenter.js, js/recruitcrystal.js, js/npc.js, js/moves.js |
| Crystal, waves, enemies (predators, nests, raids), combat | **exists** | js/waves.js, js/predator.js, js/combat.js, js/nightraids.js |
| Power: batteries, relay pylons, nests, grids, the wall power unit ("boot it", tiers), the network HUD | **exists in the strip game** (the tube lane); not wired into the facility's rooms | js/power.js, js/wallunit.js, js/nethud.js |
| The Crystal Chamber's power pack area (a fixture) and the wall unit's HUD ("TAP HERE TO BOOT THE POWER UNIT") | exist, **do nothing in the facility yet** | js/facilityplay.js `power_pack_area`, js/wallunit.js |
| Player classes | **do not exist.** There is no Gunslinger, Technomancer or Mutator anywhere in the code. docs/PLAYER-CLASSES.md plans a registry (Commander, Stormcaller, Pyromancer, Flux Weaver, Necromancer, Rogue, Gunmaster), of which only stage 0 (js/moves.js) is built | docs/PLAYER-CLASSES.md |
| Inventory window, items | **do not exist.** The only "inventory" is a localStorage DNA counter (js/save.js); the player carries shards (currency) and ammo (a number) | js/save.js, js/config.js |
| Relays as things in the facility | **do not exist** (relays are strip-game pylons) | js/power.js |
| The Security Room and the Armory | exist (monitors, drawers, the Armory under the deck with its two garage doors) but hold no items yet | js/facilitymap.js |
| The player's head-mounted monitor light | the player is a cube whose face is a monitor with green eye-lines; it gave no light. Phase 2 makes the monitor the lamp | js/draw.js `drawPlayer` |

### Conflicts to settle before phase 3

1. **"Maintain the three existing player classes"** names classes that are not in the project. Phases 3 to 5 depend on them (class-restricted equipment, who can repair a relay, who uses biological samples). Nothing has been invented. A decision is needed: build the three (Gunslinger, Technomancer, Mutator) as the first rows of the planned class registry in docs/PLAYER-CLASSES.md (the registry is data, so they would sit beside the planned classes), or map them onto planned classes.
2. **Relays and the existing power system.** The strip game's relays are pylons on a lane with nests and batteries; the facility needs relay *stations* in rooms. Phase 5 should add a thin facility layer (a relay station object, a room's power set, `facilityPower(room, on)`, which phase 2 already provides) that the strip game's power code can feed, not a second power simulation.
3. **The old tube-lane HUD** ("NETWORK OFFLINE", "TAP HERE TO BOOT THE POWER UNIT") is still shown in the facility; the tutorial will have to reuse or hide it in phase 5.

## The plan

| Phase | Work | State |
|---|---|---|
| 1 | Inspect, report, plan | this file |
| 2 | **Tutorial blackout** | done (below) |
| 3 | Inventory: a data-driven `ITEMS` table, a window with icons, names, descriptions, inspection, categories, quantities, tools and consumables, class restrictions; 3 to 5 items working end to end (collect, show, inspect, use) before any more | waits for the class decision |
| 4 | Class-specific progression: the three classes as data, and the items and rooms each uses (the Security Room and Armory for the Gunslinger, relays for the Technomancer, samples for the Mutator); restrictions configurable | waits for the class decision |
| 5 | Relay stations that need an item or a capability, click to repair, power the room's lights, a charging station and defences; `facilityPower(room, true)` is the hook already built | |
| 6 | Followers and the Crystal defence: teach recruiting and positioning with the existing systems, a manageable first assault | |

## Phase 2: the tutorial blackout (done)

**What it does.** `?facilityplay` opens in a blackout. Every room is dark, the Crystal Chamber and the room the player stands in included, whether doors are open or shut.

- **The lamp.** The player's monitor is the light that moves: a dim pool (at most 55% light, within a tile, fading to nothing at 4.8 tiles) in the **visor's green** (`#0f8`, the eye-lines of the monitor face; red while the player is angry), drawn as a soft colour wash over what it lights. It lights only the room the player is in (a wall's far side is not lit through it).
- **The floodlights.** Emergency floodlights stay on: the 7 that were already in the arena and on the catwalks, plus **8 along the hallway and 5 more across the arena**, placed a tile or two off the walls, clear of every door, the steps and the paths (they reach 90% of the hallway and most of the arena). The exit signs (a small green glow each), the crystal's glow and the Security Room's two monitor-wall lights are on too. All of it is data: `FP_TUT` (js/facilitytutorial.js) and the `floodlight` props in js/facilitymap.js.
- **Enemies.** They are never dimmed (units are not part of the room lighting), and an enemy standing in the dark also gets a faint ember-red glow on the floor under it, which is gone where there is half light or more.
- The message "BLACKOUT — FACILITY POWER IS DOWN / YOUR MONITOR LAMP IS YOUR LIGHT" is said once, a second after the start.

**Rules kept.** A room is lit while the player is in it and dark when they leave it; an open door throws a ground pool; a stairway glows. A blackout adds one condition to each: a room can be lit (and a door can throw its pool) only once it has *power*. `facilityPower(roomId, true)` powers a room (the stair room goes with the hallway), `facilityPower("all", true)` powers everything and ends the blackout, and from then on the ordinary rule applies, exactly as before. `?facilityplay&power=on` starts the facility lit (for development and the ordinary lighting checks).

**Files changed.** js/facilitytutorial.js (new), js/facilitystyle.js (the light update, `_fpTileLight`, `_fpItemLight`, `_fpDarkFill`), js/facilityplay.js (starts the tutorial, ticks the message, the dark amount), js/game.js (the enemy glow under a unit, the lamp's colour after the scene), js/facilitymap.js (13 floodlights), game.html (the script tag), tests/facilityplay.js, this file.

**Tests.** Six checks in tests/facilityplay.js: it starts in a blackout with nothing powered, 20 floodlights (8 or more in the hallway reaching 90% of it, 9 or more in the arena), the exit signs and the designated lights; the player's own room is dark, and the lamp is dim, smooth, follows the player and lights nothing in another room; the lamp is the visor's green (and red when angry) and is drawn only in a blackout; powering one room lights it only while the player is in it, a door throws its pool only from a powered room, powering everything ends the blackout and the ordinary rule returns; enemies get the glow only when hostile, alive and in the dark, and only with the blackout on; the message is said once. The existing lighting, door, wall and speed checks pass unchanged with the blackout off, the real-page walk through two doors passes with it on, the facility data checks pass with the new floodlights, and a 173,000-step random walk through the facility finds no wall or floodlight to walk through.

**Known issues.** The lamp is a circle, not a cone (the player has no facing). The glow under an enemy is a flat ellipse and does not follow the floor's height on the steps. A wall piece is lit as a whole from its middle, so a long wall at the edge of a light changes in one step. The lamp's wash is drawn over the scene (so it also tints a wall standing in front of the player). Phase 3 needs the class decision above.
