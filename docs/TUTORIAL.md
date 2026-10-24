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

1. **(Settled: the three classes were built as rows of the registry; see phase 4.)** "Maintain the three existing player classes" named classes that were not in the project. Phases 3 to 5 depend on them (class-restricted equipment, who can repair a relay, who uses biological samples). Nothing has been invented. A decision is needed: build the three (Gunslinger, Technomancer, Mutator) as the first rows of the planned class registry in docs/PLAYER-CLASSES.md (the registry is data, so they would sit beside the planned classes), or map them onto planned classes.
2. **Relays and the existing power system.** The strip game's relays are pylons on a lane with nests and batteries; the facility needs relay *stations* in rooms. Phase 5 should add a thin facility layer (a relay station object, a room's power set, `facilityPower(room, on)`, which phase 2 already provides) that the strip game's power code can feed, not a second power simulation.
3. **The old tube-lane HUD** ("NETWORK OFFLINE", "TAP HERE TO BOOT THE POWER UNIT") is still shown in the facility; the tutorial will have to reuse or hide it in phase 5.

## The plan

| Phase | Work | State |
|---|---|---|
| 1 | Inspect, report, plan | this file |
| 2 | **Tutorial blackout** | done (below) |
| 3 | Inventory: a data-driven `ITEMS` table, a window with icons, names, descriptions, inspection, categories, quantities, tools and consumables, class restrictions; items working end to end (collect, show, inspect, use) | **done** |
| 4 | Class-specific progression: the three classes as data, and the stations, items and rooms each uses; restrictions configurable | **done** |
| 5 | Relay stations that need an item or a capability, click to repair, power the room's lights, a charging station and defences | **done** |
| 6 | Followers and the Crystal defence: teach recruiting and positioning with the existing systems, a manageable first assault | **done** |

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

## Phase 3: the pack (done)

**What it does.** `js/classes.js` holds the three classes as data (Gunslinger, Technomancer, Mutator: name, colour, tagline, rooms, start kit, skills) and `CLASS_RULES`: any class may *carry* another class's gear, only the right class may *use* it (both switches are data). The class picker opens when the tutorial is FINISHED (see "Classes come after the tutorial" below); `?class=technomancer` names a class from the start, for development. `js/inventory.js` holds a data-driven `ITEMS` table (name, category, type, stack, colour, icon, class restriction, description, lore, stats, `use`) and the pack window: press **I** (or the PACK button), tabs (ALL, GEAR, TOOLS, PARTS, SAMPLES), item cells with quantity and a LOCKED chip for gear your class cannot use, an item page with INSPECT (the lore and the numbers) and USE. A new item is one row, an icon and a `use`.

| Item | For | What it really does |
|---|---|---|
| Ammo pack | anyone | +10 rounds in the gun (kept when the gun is full) |
| Flare | Gunslinger | lights the ground where you stand, 6.5 tiles, for 30 seconds (a real light in the blackout) |
| Power cell | Technomancer | overcharges the monitor lamp for a minute; it is also what a relay repair costs (phase 5) |
| Mutagen sample | Mutator | raises the nearest follower within 8 tiles a level (and so toward evolution) |
| Relay kit | anyone | a reusable tool: lets any class repair a relay (phase 5) |

**Supplies.** Nine supply cases stand in the rooms each class works in (`pickups` in js/facilitymap.js; the Armory and Security Room for the Gunslinger, the labs and Teleport Room 1 for the Technomancer, the lab and the Crystal Chamber for the Mutator, the kit in the Chamber). Each shows its item's icon over a beacon, so it can be found in the dark; walking over one takes it (a case that will not fit stays).

## Phase 4: class stations and perks (done)

A **station** is a prop the player can use (`stations` in js/facilitymap.js, `STATION_KINDS` in js/stations.js): walk up and press **E**, tap the plate that appears, or tap the station (the player walks there first). Its ring shows in the class's colour for the class that can use it and dim for everyone else, who are refused with the reason. Each class earns a **perk** (`CLASS_PERKS`, read through `classStat(name, base)` as docs/PLAYER-CLASSES.md plans, so the rest of the game needs no class code):

| Class | Station | Perk | Effect |
|---|---|---|---|
| Gunslinger | Armory weapon locker | Service rifle | shots hit 60% harder and 25% faster (the player's shot reads `classStat`) |
| Gunslinger | Security Room console | CCTV sweeps | every enemy in the facility is marked (a diamond, an arrow at the screen's edge) for 25 s, then a 60 s cooldown |
| Technomancer | Teleport Room 1 console | Tuned lamp | the lamp reaches 25% further, an overcharge lasts 50% longer |
| Mutator | a test chamber in the lab | Sequenced samples | costs a sample; afterwards a sample raises a follower two levels |

The pack shows the class, its rank (1, plus one per perk) and the perks.

## Phase 5: the electrical network (done)

Three **relays** (`relays` in js/facilitymap.js) stand broken: the Crystal Chamber's (feeds two sentries that guard the door), the hallway's (powers the hallway and the stair room; feeds a sentry and the charging station) and the lobby's (powers the lobby and the Security Room). A relay is a station: a repair runs with a progress bar over the box and needs **either a skill or a part**, a rule in `CLASS_RULES.relay` (js/classes.js):

- a class with the `repair` skill (the Technomancer): **one power cell**, under two seconds, and it **starts by itself** when they stand at a broken relay with a cell and keep still;
- anyone else: the **relay kit** (found in the Crystal Chamber) and **two power cells**, five seconds, started by tapping the relay. This is the explicit design rule that lets the other classes restore a relay at all (their cells are spent by the relay, they do not use them).

A repair that is walked away from stops (nothing is spent). When a relay comes online: its rooms have power (`facilityPower`: the blackout lifts there, they are lit while you are in them, open doors throw pools), the box turns green with a turning ring, a ring of light and a flash spread from it, the screen says POWER RESTORED, the sentries it feeds shoot the nearest enemy within 9 tiles (8 damage every 50 frames, through the strip's own projectiles), and the hallway's charging station refills your gun (a Technomancer also gets a cell; 90 s cooldown). All three relays do not end the blackout: the other rooms stay dark. Adding an electrical room is a `relays` row and a prop.

## Phase 6: followers and the Crystal defence (done)

`js/tutorial.js` is a short list of objectives (`TUT_STEPS`) with a plate under the FACILITY · EXIT tab: find supplies; earn your class's perk; restore the Crystal Chamber's relay; **recruit** a follower (the roster's + RECRUIT, 30 shards: `recruitFollower`); **post** two followers near the Crystal (the roster's HOLD: `a.stance`); **defend the Crystal**; evolve a follower. It uses the strip's systems and builds no new ones: recruits are `recruitFollower`, levels are `gainXp`, evolution is `evolutionTick` at level 10, the enemies are the strip's ants hunting the Crystal under an alarm.

- The tutorial's followers (the three you start with and every recruit) are **level 9**, and the assault's enemies level 8, so one assault takes a follower to the evolution level.
- **The assault**: a 20 second countdown, then four scouts from the east end of the hallway, then 25 seconds later three strikers. The alarm is up while they live. A wounded enemy that runs is made to press on. A Crystal below 15% is saved: the enemies are called off, it is mended to 60% and the assault comes again. After a minute past the last wave, what is left is called off ("THE REST FLED"). Beating it pays every follower 400 XP (`gainXp`), and the fighting earns more; followers that reach level 10 evolve as they always do.
- The tutorial finishes when a follower has evolved, and says so once.

A scripted run through every step (collect, perk, relay, recruit, hold, the assault, evolution) with a Technomancer and a Gunslinger finishes with two evolved followers and the Crystal untouched at full health.

**Files added or changed in phases 3 to 6.** js/classes.js, js/inventory.js, js/stations.js, js/tutorial.js (new); js/facilitytutorial.js, js/facilityplay.js, js/facilitystyle.js, js/facilitystyleall.js, js/facilitydecor.js (none), js/facility.js, js/facilitygrow.js, js/facilitymap.js (pickups, stations, relays, relay/sentry/charger props), js/game.js, js/ui.js, js/input.js (the pack, the picker, stations, the shot reads `classStat`), game.html, tests/facility.js, tests/facilityplay.js.

**Known issues.** The tutorial's enemies bleed 0.01 HP a frame like every enemy in the strip, so a wounded one that keeps away can die on its own, without giving a kill's XP (the assault's reward covers it). A prop (a floodlight, a sentry) in an enemy's straight path can hold it for a moment until its unstick logic replans; the spawn rows keep clear of them. The relays' sentries use the strip's follower projectiles, so they do not credit XP to anyone. The first assault is tuned by feel (two waves, level 8) and not yet by play-testing with a real player: `TUT` in js/tutorial.js is the table to change.

## Classes come after the tutorial (revision)

**The rule.** The tutorial has no classes. Only when its last objective is done does the class picker open ("TUTORIAL COMPLETE — CHOOSE YOUR CLASS"), and only once a class is chosen do that class's items enter the facility.

- **The tutorial without a class.** Six objectives: find supplies, restore the Crystal Chamber's relay, recruit, post followers, defend the Crystal, evolve a follower. Only five supply cases are in the facility (ammunition in the Armory and the Security Room, power cells in the lab and the lobby, the relay kit in the Crystal Chamber). With no class a relay is repaired with the kit and two power cells, the way every class without the Technomancer's skill does. The class stations show no ring and cannot be used.
- **The picker** opens by itself when the sixth objective (evolve) is done, absorbs taps until a class is chosen, and is never shown again.
- **Class items enter.** Choosing a class gives its start kit and lets that class's cases in: each arrives in a column of light, with the message "SUPPLIES FOR YOUR CLASS HAVE ARRIVED": the Gunslinger's flares in the Armory (2 cases), the Technomancer's cells in Teleport Room 1 (2), the Mutator's samples in the lab and the Crystal Chamber (3). A case for another class never enters (`class` on a `pickups` row in js/facilitymap.js; `facilityClassItemsEnter`).
- **Then the class objective:** go to the class's station and earn its perk (the objective plate turns to the class's colour), and the class's rules (the Technomancer's repair skill and its auto-repair, the Gunslinger's rifle and CCTV, the Mutator's sequencer) apply from then on.

## The gun lesson (revision)

The tutorial teaches the player's gun (js/gunfire.js): a seventh objective, **FIRE YOUR GUN**, comes after posting the followers and before the assault. A stray ant (level 3, plenty of health, grazing) is put in view 4 to 6 tiles away and the player is given training rounds (the gun is topped up to 8). The objective counts the player's own shots (`playerShotsFired`) to three. The hints teach it in two steps: *long-press the ant until the ring opens, then slide to ATTACK (that arms the gun and locks on)*; then, once armed, *click it as often as you like, or hold your finger on it to keep firing; each shot costs a round*. A stray that dies is replaced (up to four times); when the lesson is done the stray is taken away. The assault's hint reminds the player that they can shoot too. The tutorial now has seven objectives: supplies, relay, recruit, post, gun, defend, evolve.

## Class gear (revision)

Each class earns a **signature piece of gear** (`CLASS_SIGNATURE` in js/classes.js: the perk it is). The gear is seen on the player: it is modelled onto the same cube (design/evolutions/forms30.js, Nos. 840–843) and baked to a sheet of its own (img/hd/player_gun.png, player_gun_aim.png, player_mech.png, player_coat.png; `node design/evolutions/bake.js <three-dir> <out> <ids> 186 2.2`, then cropped to the box in `HD_BOX`). js/playergear.js picks the sheet (`playerGearSheet`); js/hdsprites.js draws from it.

- **Gunslinger — the machine gun.** Found in the **Armory** (the weapon locker). The cube still floats; two of its four cables are long tentacles that carry the big belt-fed gun low at its left side. When the weapon is **armed** they pull it up level beside the screen, looking down the sights, and the action frames fire it (recoil and a muzzle flash) for 14 frames after each shot. It turns to the locked enemy. Four times the rate of fire, each round a little softer (`shotCooldown` ×0.25, `shotDamage` ×0.8), and the locker gives four ammo packs.
- **Technomancer — the spider mech.** It has to be **built in the Show Room**: the legs (two cases in Teleport Room 1 and the passage, two each) and the core (in the Show Room) go into the **mech bay**, a seven-second build at the pad (walk away and it stops, nothing is spent). An armoured walker with the cube seated in its cockpit, four thick jointed legs that walk with the player; 40% faster (`playerSpeed` ×1.4) and the lamp reaches 30% further.
- **Mutator — the lab coat and goggles.** Put on by walking **from Teleport Room 1 through the passage into the Experiment Lab**, in that order (any other walk starts again), and **kept for good**. A draped white coat open at the front with a collar, lapels, pockets, stains and a vial of mutagen, and safety goggles pushed up on the brow. A mutagen sample raises a follower two levels (`mutagenLevels` +1); the sequencer's perk adds one more.

**Known issues.** The gear sheets have no angry (red-eyed) variant: the plain cube's `player_angry` sheet is not used while gear is worn. Each sheet decodes to about 9–10 MB, loaded only when its gear is owned. The sheets are baked at 186 px cells over 4.4 units to hold the mech and the gun inside the cell at every facing.
