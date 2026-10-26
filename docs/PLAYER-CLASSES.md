# Player classes, class ultimates, perks and follower moves — the path

Asked: *"Make a clear path to add player classes and class specific ultimates and perks like a character progression system, and make way for follower evolution attack move selection, and add niche attacks that only specific playable character classes have access to."*

**Status: stage 0 built (js/moves.js, tests/moves.js); the facility tutorial (docs/TUTORIAL.md) built the first rows of the registry in js/classes.js (GUNSLINGER, TECHNOMANCER, MUTATOR) with `classStat`, `CLASS_RULES`, perks earned at stations and a signature piece of gear each, and js/weapons.js the player's weapons; stages 1 to 6 of this plan are otherwise still the plan.** Stage 0 changed no behaviour; every later stage is one commit with its own test suite. Decisions are in §8.

## 1. What the game has today (and what is in the way)

| Thing | Where | State |
|---|---|---|
| The player's ultimate | `playerUltimate` / `PLAYER_ULT_MAX`, `chargePlayerUltimate`, `fireArmySurge` (js/helpers.js), the bar under the health (js/game.js) | **one** ultimate, hard-wired: ARMY SURGE. Charged by the siphon (followers near you). |
| The player's weapon | `WEAPONS` (js/weapons.js): the service gun, the Gunslinger's machine gun, the laser rifle, each with a level 1 to 3 bought with scrap at the Armory's terminal; `firePlayerShot` (js/input.js) | one weapon in hand; rounds from ammo packs, the hallway's charging station and scrap; the rifle's fuel cells from the computer lab. |
| The classes | `CLASSES`, `CLASS_RULES`, `CLASS_PERKS`, `classStat(name, base)` (js/classes.js); the stations that earn a perk (js/stations.js) | three classes as data, chosen when the tutorial is done; a rank (1, plus one per perk); no XP and no level for the player. |
| Follower evolution moves | `MOVES` (js/moves.js), `EVOLUTIONS[id].moves`, `f.move` | one default move per form; a form that lists a second (the fire forms' FIRE BOMBS) shows the choice on the INFO tab of its card (js/unitinfo.js). |
| Follower roles | `brawler` / `sniper` (MAGE) / `camper` (TECHNICIAN) | a role fixes how it fights; it comes with the egg or the recruit, and an evolved form keeps its own. |
| Follower's own ultimate | `FOLLOWER_ULTIMATES` (js/elements.js; the names in `ELEMENT_ULTIMATES`, js/unitinfo.js), double-tap | one per element, working within `ULT_REACH` (12) tiles of the follower. |
| Info pages | `MOVE_INFO` keyed by move name (js/unitinfo.js); the INFO panel (js/infodex.js) | text read off the constants. |

What blocks classes: the ultimate, the surge numbers and the siphon rate are constants and functions the rest of the game reads directly. So the path is **make those data-driven** (stages 1 and 2), then adding a class, a perk or a move is a table entry, as `classStat` already makes a stat perk one.

## 2. The shape

Three registries, one save record, one hook function.

```
CLASSES   (js/classes.js)   id → { name, colour, tagline, rooms, startKit, skills, ultimate?, passive?, perkTree?, startMoves? }   (the first three rows exist)
PERKS     (CLASS_PERKS)     id → { cls, name, desc, stat:{ name: { mul | add } } | hook:"name" }                                  (stat perks exist)
MOVES     (js/moves.js)     id → { name, fn(f), classes:[ids]? }                                                                   (exists)
PLAYER    (the facility's save, js/facilitysave.js)  { cls, perks, xp?, level?, points?, moves:{formId: moveId} }               (cls and perks are saved)
```

- **`classStat(name, base)`** is the one function the game asks for a number: `classStat("playerSpeed", FP_PLAYER_SPEED)` returns the base multiplied and added to by every owned perk. The mech's speed, the lamp's reach and its overcharge, the mutagen's levels and the shot's damage and rate already go through it; the siphon, the surge and move cooldowns would. Perks that are plain numbers are *only* a `stat` entry, so most perks need no code at all.
- **`classHook(name, ...args)`** is for the rare perk that does something (on a kill, on a relay restored, on an assault beaten): the game calls named hook points; a perk lists the hook it implements.
- The class is **data**, so the UI (the class picker, the pack's "requires" chips, the INFO panel's class rows) is generated from the table, as it already is.

### 2.1 A class

```js
{ id: "gunslinger", name: "GUNSLINGER", colour: "#ffb347", tagline: "Weapons, ammunition and tactical gear.",
  rooms: ["armory", "security_room"], startKit: [["flare", 1]], skills: ["tactical"],                     // built
  ultimate: { id: "bullet_storm", name: "BULLET STORM", cost: 100, fn: bulletStorm, info: () => [...] },  // planned
  passive:  { stat: { shotCooldown: 0.9 } },
  perkTree: [ /* 3 branches x 4 tiers, §4 */ ] }
```

The ultimate is the **same bar** (`playerUltimate`); a class only chooses what tapping it does. COMMANDER's ultimate is today's ARMY SURGE, moved, not changed, so existing saves and tests keep working.

### 2.2 The roster (picked: Flux Weaver, Necromancer, Stormcaller, Pyromancer, Rogue, Gunmaster; Broodmaster dropped)

COMMANDER stays as the default (today's player, so nothing breaks), beside the tutorial's three. Four **elemental** classes, one for each of four of the six elements (ice and core are open for later: a Cryomancer, a Warden), and two that are **not** elemental.

| Class | Element | Fantasy | Ultimate (the same bar) | Perk branches |
|---|---|---|---|---|
| **COMMANDER** | any | the army: today's player | ARMY SURGE (existing, moved) | SQUAD / SURGE / BONDS |
| **STORMCALLER** | electric | chain lightning, haste, stun | **STATIC STORM**: for 8 s every enemy in view is struck by chaining arcs, allies move 1.4x | ARC (chain count, damage) / TEMPO (haste, siphon rate) / STUN |
| **PYROMANCER** | fire | burning, big damage with a cost | **WILDFIRE**: a spreading fire across the room for 10 s (burning ground, js/firebombs.js); burns your front units a little too | EMBER (burn damage, spread) / FURNACE (self-burn for power) / ASH (burned foes drop crystals) |
| **FLUX WEAVER** | flux | gravity, position | **EVENT HORIZON**: a black hole drags everything in view to a point, holds it, pushes it out | PULL (range, hold time) / PHASE (swap, blink) / RIFT (fields of slow) |
| **NECROMANCER** | toxic (decay) | what dies feeds you | **SECOND WIND**: every follower and clone that fell in the last few minutes rises at half health for 20 s | HARVEST (kills pay crystals and ultimate) / RAISE (revive, ghost allies) / BLIGHT (damage over time) |
| **ROGUE** | none | stealth, ambush | **VANISH**: the whole squad drops off every enemy's radar for 8 s; the first hit out of it is a triple-damage ambush | SHADOW (detection range) / AMBUSH (first-strike bonus) / SILENT (no proximity alarm at the eggs and the stations) |
| **GUNMASTER** | none | the player's own gun | **BULLET STORM**: for 8 s the gun fires on its own at everything in range, no ammo cost, every hit marks | BARREL (damage, rate) / MAGAZINE (ammo, reload from kills) / MODS (more gear slots) |

The player is hard to kill (three hits, then back at the Crystal), and the creatures go for the Crystal and the followers, so **stealth is about the squad, not about the player's own life**: see §3.2.


## 3. Follower move selection

A form had one hard-wired move, chosen by its name in an `if/else` chain. The change, most of it built in stage 0:

- **`MOVES` registry** holds every move as `{ id, name, fn }`. The existing ones (PETAL BLAZE, QUILL BURST, ARC VOLLEY, SINGULARITY SHOT, AEGIS BURST, STATIC RUSH, HEXFIRE, CORRODE SHOT, GRAVITY SLAM, AEGIS BLOOM, ERUPTION, CHOMP) moved out of the chain **unchanged**, and FIRE BOMBS (`bomb_lob`, docs/FIRE-BOMBS.md) was added as a row. *Built.*
- **Each evolution lists the moves it may use**: `EVOLUTIONS[id].moves = ["petal_blaze", ...]`, the first being its old move (the default, so nothing changes until the player picks). *Built; the fire forms list two.*
- **A follower has `f.move`** (saved with it). `evolutionTick` fires `evoMoveOf(f).fn(f)`; the cooldown is the move's own. *Built.*
- **The UI:** a form with more than one move shows them as buttons on the INFO tab of its card (js/unitinfo.js). *Built.* A "set move" for a selected group in the Command Center, like it has for roles, is left.
- **How a move becomes allowed:** it is on the form's list, **and** (if the move has `classes`) your class is on its list (`evoMoveAllowed`, built), **and** you have unlocked it (a perk, a level, or a class start move: planned).

### 3.1 Niche moves only certain classes can use

`MOVES[x].classes = ["stormcaller"]` hides and blocks it for everyone else. They are **moves your followers use because of who you are**, so a Commander's army and a Stormcaller's army fight differently with the same forms. Each uses machinery that exists.

| Move | Class | On | What |
|---|---|---|---|
| ARC RELAY | Stormcaller | electric mages | the arc also jumps through allies, charging their ultimates |
| TESLA SNAP | Stormcaller | electric brawlers | the first hit on a target stuns it (the stun status) |
| IMMOLATE | Pyromancer | fire brawlers | sets itself alight: double damage, takes a little itself |
| EMBER TRAIL | Pyromancer | fire forms | leaves a burning path as it moves (burning ground, `igniteFireTile`) |
| PULL CHAIN | Flux Weaver | flux mages | yanks one enemy into melee range (the vortex pull, on one target) |
| PHASE STEP | Flux Weaver | flux forms | swaps places with the nearest ally in trouble |
| SALVAGE | Necromancer | any | a corpse nearby turns into crystals |
| SOUL LINK | Necromancer | toxic forms | shares its damage with a dead ally's ghost (a short-lived ghost phage) |
| AMBUSH | Rogue | brawlers | a follower standing out of sight opens with a first strike at 3x |
| SMOKE BOMB | Rogue | any | drops a cloud that hides allies inside it from enemies |
| COVER FIRE | Gunmaster | mages | fires on the target you last shot, with you |
| SPOTTER | Gunmaster | snipers | marks a target: your shots on it do +50% |

### 3.2 Stealth (the Rogue) and the gun (the Gunmaster)

- **Stealth is a status on the squad**: `a.hidden = frames`. A hidden unit is not picked as a target by creatures beyond 1.5 tiles (the targeting code already asks `isHostileTarget` and range; this is one more test), and its first hit out of hiding is multiplied. The Rogue gets it by passive (standing still for 2 s), by SMOKE BOMB and by the ultimate. The **blind** status (`blinded`, js/predator.js) is the model: a creature that loses its target wanders.
- **The gun is its own system**: today a table of weapons (`WEAPONS`, js/weapons.js: the service gun at 10 damage every 45 frames, the machine gun, the laser rifle; a level 1 to 3 each, bought with scrap at the Armory's terminal). It gains **mods** (barrel, magazine, core) that the Gunmaster's perks fill. Any class can fire the gun; the Gunmaster gets the slots and the perks.


## 4. Progression

- **Currency:** `xp` for the *player*, not a follower. Earned from: a kill (small, steady), an assault beaten, a relay restored, a boss killed. Levels 1–20, each level = 1 perk point; level 5/10/15/20 also unlocks a class tier (a stronger ultimate stage, a new move).
- **Perk tree per class:** 3 branches × 4 tiers. A perk is a `stat` and/or a `hook`, costs 1–3 points, and `needs` the one before it. Branches map to the class idea (Commander: SQUAD / SURGE / BONDS; Stormcaller: ARC / TEMPO / STUN). The tutorial's perks (js/classes.js `CLASS_PERKS`, earned at stations) are the first tier of their classes' trees.
- **Ultimate stages:** the class ultimate has three stages that perks unlock (longer, wider, a second effect). The bar fills at the same rate; the stage changes what it does.
- **Persistence:** in the facility's save (`conduit_fp_save`, js/facilitysave.js), where the class and its perks already live: xp, perks and the chosen moves per form. A **respec** (refund all points) is free at the Crystal, so a build is an experiment, not a mistake.
- **UI:** a **CLASS** panel on the dock (slab style): the class card (portrait = the 3D player, tinted), the ultimate, the perk tree as three columns of slabs, points left. The class picker (built: it opens when the tutorial is finished) would also be reachable from this panel.

### 4.1 Ideas parked with the old game

A **hack puzzle** (an algebra problem at a wall panel, paying gear by tier) and the **gear** it paid (five tiers by reach: one follower, a squad of three, an aura, the whole team, the team and you) were planned on the old game's wall panels and its roster squads (A, B, C); the panels and the roster squads went with it. The facility has one squad, the three that follow you (js/party.js), and its consoles and stations are where a puzzle would go if the idea comes back. It is not in the build order below.

## 5. Build order (each is a commit, its own tests, a full green run)

0. **MOVES registry** (built).
1. **Class registry + save + `classStat`/`classHook`.** Half built: the registry, `classStat` and the save exist (js/classes.js, js/facilitysave.js); `classHook`, COMMANDER's row and the siphon and surge constants reading through `classStat` are left. Test: with no perks, every number equals the old constant.
2. **Ultimate slot.** `fireArmySurge` becomes `class.ultimate.fn`; the HUD label and the info page come from the class.
3. **XP, levels, perk points, the CLASS panel** with COMMANDER's tree.
4. **Move selection.** `f.move` and the INFO tab's choice are built; the squad setter and the class-gated unlocks are left.
5. The elemental classes one at a time: **STORMCALLER**, **PYROMANCER**, **FLUX WEAVER**, **NECROMANCER** (a row, a tree, an ultimate, two moves each, a test that its numbers match the table).
6. **ROGUE** (the `hidden` status and the targeting test), then **GUNMASTER** (needs the gun mods).

## 6. Adding a class afterwards (the checklist)

1. A row in `CLASSES` (name, colour, ultimate, passive stats).
2. Its perk tree (rows of `{ name, tier, cost, needs, stat | hook }`).
3. Its ultimate function in `js/classes.js` (use `armyUnits()`, `applyDamage`, the existing statuses).
4. Class-only moves as rows in `MOVES` with `classes: ["id"]`.
5. `tests/classes.js` picks it up: every perk reachable, no cycle in `needs`, the ultimate fires and spends the bar, the class moves are blocked for others.

No other file changes: the picker, the perk screen, the INFO pages and the roster are built from the tables.

## 7. Risks, and what keeps them small

- **Balance:** all numbers are named constants in the class table; tests only assert the *relationships* (a perk is never negative, tier 4 > tier 1).
- **Save compatibility:** a save with no class is a game waiting at the class picker (as today); every follower with no `f.move` uses its form's default.
- **Performance:** `classStat` is a lookup into a table rebuilt when a perk is bought, not a loop over perks each frame (the frame loop is the only clock; no new timers).
- **Scope:** stages 0–2 change no gameplay. A class that is not finished is simply not in the picker.

## 8. Decisions (answered)

1. **When is the class chosen?** When the tutorial is finished (built: the picker opens then, once), and **switchable at the Crystal** afterwards; each class keeps its own level and perks.
2. **Progression** is **permanent** (saved with the facility game), with a free respec at the Crystal.
3. **Move choice** is **per follower, plus a squad setter** (the INFO tab's move buttons, built; "set move" for a selected group like roles).
4. **Class moves** work **only while you are that class**; switch and a follower falls back to its form's default move (`evoMoveAllowed` already enforces it once `playerClassId()` exists).

The decisions about the hack puzzle and its gear are parked with them (§4.1).

## 9. Done so far

- **The registry's first rows (built):** GUNSLINGER, TECHNOMANCER and MUTATOR as data in js/classes.js, `CLASS_RULES` (carry anyone's gear, use only your own; how a relay is repaired), `CLASS_PERKS` read through `classStat`, the stations that earn them (js/stations.js), the signature gear (docs/TUTORIAL.md, "Class gear") and the weapons table (js/weapons.js). The class and its perks are saved with the facility.
- **Stage 0 (built):** `MOVES` in js/moves.js, `evoMoveIds / evoMoveAllowed / evoMoveOf`, and `evolutionTick` fires `evoMoveOf(f).fn(f)` instead of the if/else chain. Each form's default is the move it always had (tests/moves.js compares every form with the old chain). A form can list several moves (`EVOLUTIONS[id].moves`: the fire forms do, and the INFO tab offers the choice), and a class-only move is already blocked for other classes; nothing uses that yet.
