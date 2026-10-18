# Fire: bouncing fire bombs and burning ground

Asked: *"The fire element is mostly about little fire bombs that actually use projectile geometry and bounce off walls and off the ground a few times, perhaps as a special ability. The fire turrets shoot little fireballs that bounce off walls; you modify the direction of the fire turrets, and the fireballs burn the ground where they land. If you get touched by that fire you take a little hit of damage, like the other hazards on the map. The hazard stays on the map for 10 or 15 seconds."*

**Status: stages 1 to 3 built (js/firebombs.js, tests/firebombs.js); 4 (tuning and the guide) is left.** Four stages, each a commit with its own tests.

## 1. What the game has to build on

| Thing | Where | What it gives us |
|---|---|---|
| A flying round with a height | `turretShots` (js/game.js): `{ x, y, z, target, ... }`, drawn with its z (`drawTurretShots`) | a world position and a height already; today it flies straight to a target and never falls |
| Follower shots | `followerProjectiles` (js/clone.js): `{ x, y, vx, vy, life }` | flat, no height |
| Ground hazards | `environmentalHazards` (js/elements.js): acid pools tick damage on a timer to every actor on their tiles and `hurtPlayer`; they have a draw pass inside the depth-sorted tile loop | exactly the "touch it, take a little hit" rule; a pool is a list of tiles |
| Burning | `a.burning` / `a.burnDamage` on an actor (`petalBlaze`), `fireShockwave` effects | the fire status and its effects |
| The lane | floor rows `FLOOR_Y_MIN` (-1) to `FLOOR_Y_MAX` (4) between the back and front walls; pylons, modules and ice blocks are tile objects | the walls and obstacles a bomb can bounce off |

## 2. The new parts

**A FIRE BOMB** (`fireBombs`, js/firebombs.js): a ball with a position and a height, `{ x, y, z, vx, vy, vz, bounces }`, moved by the frame loop with gravity. It arcs, lands, and **bounces**: each ground bounce keeps part of its upward speed and drops a small scorch where it lands. It **bounces off the walls** (the lane's back and front rows reflect its y speed; a pylon, module or ice block it hits reflects it too). When it is out of bounces it bursts and leaves a **burning patch**.

**A BURNING PATCH** (`fireBurns`, drawn on the floor under everything like the acid pools): a few tiles of fire that **lasts 600 to 900 frames (10 to 15 seconds)**, fading out in its last second. Anything standing in it takes a hit of damage every half second and is set burning, the same rule the acid pools follow. Bounces that land close together merge their patches rather than stacking, so a long bounce path is a line of fire, not a pile.

**FIRE TURRETS** lob bombs instead of straight rounds: a turret throws a bomb in its **aim direction**; the bomb bounces down the lane and the ground it lands on burns. **Aim:** tap a fire turret and a small ring of eight directions (and AUTO) opens on it; the pick is saved on the turret. AUTO is how every fire turret works today: it throws at the nearest enemy.

**FIRE FOLLOWERS** get the bomb as their special: the Quillstone, the Ember Hood and a fire egg's special attack, when its will allows, lob a bouncing bomb at the target. Their ordinary shots stay as they are.

## 3. Build order

1. **The engine:** `fireBombs` and `fireBurns` (physics, bounces, patches, damage, drawing), with tests for the physics (it lands, it bounces a limited number of times, it reflects off the walls, a patch lasts 10 to 15 seconds and burns what stands in it).
2. **Fire turrets:** bombs in place of straight rounds, the aim ring and the saved aim.
3. **Fire followers:** the bomb as their special.
4. **Tuning and the guide:** damage, bounce counts and the index text.

## 4. Decisions (answered)

1. **Who is hurt by the fire on the ground?** **Everyone**, like the acid pools: enemies, your followers and you.
2. **How is a turret aimed?** **Tap it** for a ring of eight directions and AUTO; saved on the turret.
3. **Which fire things throw bombs first?** **Fire turrets**, then fire follower specials.

## 5. Done so far

- **Stage 1, the engine:** `fireBombs` (x, y, height, gravity, `FIRE_BOUNCES` = 3 ground bounces that keep 62% of their speed up, reflection off the lane's side walls and off wall and pylon tiles, a splash on the hostile where it lands) and `fireTiles` (burning ground 600 to 900 frames, a hit every 30 frames to everyone on it and to the player, refreshed rather than stacked, capped at 160 tiles), drawn by the floor tiles and above the world.
- **Stage 2, the turrets:** a fire turret (or an Ultra of fire) throws a bomb in place of a straight round, at the nearest enemy on AUTO or down the aim you tapped in; the aim ring, the arrow on an aimed turret, and the save.
- **Stage 3, the followers:** a fire follower's SPECIAL (it was a meteor on the target) is two bouncing bombs lobbed at it, with the meteor's bonus against live nests. The evolved fire forms (Quillstone, Ember Hood, and the legacy Bunker Bloom and Cinder Halo) get a second move, **FIRE BOMBS** (three bombs fanned at the nearest foe, every 5 seconds); their own move stays the default. **Choosing a move** is built here too: a form with more than one move shows them as buttons on its INFO tab (js/unitinfo.js), the pick is `f.move` (js/moves.js evoMoveOf) and it is saved with the follower.
