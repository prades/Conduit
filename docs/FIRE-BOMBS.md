# Fire: bouncing fire bombs and burning ground

Asked: *"The fire element is mostly about little fire bombs that actually use projectile geometry and bounce off walls and off the ground a few times, perhaps as a special ability. [...] the fireballs burn the ground where they land. If you get touched by that fire you take a little hit of damage, like the other hazards on the map. The hazard stays on the map for 10 or 15 seconds."* (The ask also had fire turrets lobbing them; the turrets went with the old game, and the bombs are the fire followers' alone.)

**Status: built (js/firebombs.js, tests/firebombs.js); the tuning and the guide text are what is left.**

## 1. What the game has to build on

| Thing | Where | What it gives us |
|---|---|---|
| Follower shots | `followerProjectiles` (js/clone.js): `{ x, y, vx, vy, life }` | flat, no height: the bomb needs its own |
| Burning | `a.burning` / `a.burnDamage` on an actor, `fireShockwave` effects | the fire status and its effects |
| The floor | the facility's floor tiles (js/facilityplay.js `_fpBuildWorld`): where there is no floor tile there is a wall or a prop | the walls and obstacles a bomb can bounce off |
| The damage rule | `applyDamage` and `isHostileTarget` (js/helpers.js) | who a splash hurts |

## 2. The parts

**A FIRE BOMB** (`fireBombs`): a ball with a position and a height, `{ x, y, z, vx, vy, vz, bounces }`, moved by the frame loop with gravity (`FIRE_GRAVITY`). It arcs, lands, splashes whoever is hostile within `FIRE_SPLASH_R` (0.95 tiles) of where it lands, and **bounces**: each ground bounce keeps `FIRE_BOUNCE_KEEP` (62%) of its upward speed and sets the tile it landed on alight, up to `FIRE_BOUNCES` (3) bounces, when it bursts. It **bounces off anything that is not floor** (the facility's walls and props) while it is lower than `FIRE_WALL_Z` (3 tiles of height, about what the walls stand), keeping `FIRE_WALL_KEEP` (85%) of its sideways speed; higher than that it sails over.

**BURNING GROUND** (`fireTiles`, drawn by the floor tiles and above the world): a tile on fire for `FIRE_BURN_MIN` to `FIRE_BURN_MAX` frames (600 to 900: **10 to 15 seconds**), fading in its last second. Anything standing on it, **everyone**, the creatures, your followers and you, takes a little hit every half second (`FIRE_BURN_TICK`) and is set burning. A bounce that lands on a tile already burning refreshes it rather than stacking; at most `FIRE_BURN_CAP` (160) tiles burn at once (the oldest go out first); nothing burns where there is no floor. It is the only hazard on the facility's floor.

**WHO THROWS THEM.** A fire follower's **special** (js/elements.js; it was a meteor on the target) is two bouncing bombs lobbed at it (`throwFireBombsAt`, two bounces each). The evolved fire forms (the Quillstone and the Ember Hood, and the legacy Bunker Bloom and Cinder Halo) have a second move, **FIRE BOMBS** (`bomb_lob` in js/moves.js; `fireBombBarrage`): three bombs fanned at the nearest foe within `FIRE_BARRAGE_RANGE` (7 tiles), every `FIRE_BARRAGE_EVERY` (300 frames: 5 seconds). A form's own move stays its default; a form with more than one move shows them as buttons on the INFO tab of its card (js/unitinfo.js), the pick is `f.move` (js/moves.js `evoMoveOf`) and it is saved with the follower.

## 3. How it was built

1. **The engine:** `fireBombs` and `fireTiles` (physics, bounces, patches, damage, drawing), with tests for the physics (it lands, it bounces a limited number of times, it reflects off a wall, a patch lasts 10 to 15 seconds and burns what stands in it).
2. **The followers:** the special, the FIRE BOMBS move, and choosing a move.
3. **Tuning and the guide:** damage, bounce counts and the index text (left).

## 4. Decisions (answered)

1. **Who is hurt by the fire on the ground?** **Everyone**: enemies, your followers and you.
2. **What throws bombs?** Fire followers: their special, and the FIRE BOMBS move of the evolved fire forms. There are no fire turrets and no aim ring.
