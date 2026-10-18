# Player classes, class ultimates, perks and follower moves — the path

Asked: *"Make a clear path to add player classes and class specific ultimates and perks like a character progression system, and make way for follower evolution attack move selection, and add niche attacks that only specific playable character classes have access to."*

**Status: stage 0 built (js/moves.js, tests/moves.js); stages 1 to 6 are the plan.** Stage 0 changes no behaviour; every later stage is one commit with its own test suite, like the kits. Decisions are in §8.

## 1. What the game has today (and what is in the way)

| Thing | Where | State |
|---|---|---|
| The player's ultimate | `playerUltimate` / `PLAYER_ULT_MAX`, `chargePlayerUltimate`, `fireArmySurge` (js/helpers.js), HUD bar (js/game.js) | **one** ultimate, hard-wired: ARMY SURGE. Charged by the siphon (followers near you). |
| The player's weapon | `playerAttackMode`, `playerAmmo` (js/config.js) | one weapon, ammo from hacked wall panels. |
| Player progression | nothing | no XP, no level, no perks. The old shop perm-upgrades were removed (`tubecrawler_permupgrades` is only purged). |
| Follower evolution moves | `EVOLUTIONS[id].move` + the `if/else` chain in `evolutionTick` (js/evolution.js) | **one move per form**, chosen by *the form's name*, not by the player. |
| Follower roles | `brawler` / `sniper` (MAGE) / `camper` (TECHNICIAN) | a role fixes how it fights; the Technician's deployables are planned (docs/TECHNICIAN-deployables.md). |
| Follower's own ultimate | `ELEMENT_ULTIMATES` (js/unitinfo.js), double-tap | one per element. |
| Info pages | `MOVE_INFO` keyed by move name (js/unitinfo.js) | text read off the constants. |

What blocks classes: the ultimate, the surge numbers and the siphon rate are constants and functions the rest of the game reads directly; the move a follower uses is a name test. So the path is **make those three things data-driven first** (Stage 0 and 1), then adding a class, a perk or a move is a table entry.

## 2. The shape

Three registries, one save record, one hook function.

```
CLASSES   (js/classes.js)   id → { name, colour, tagline, ultimate, passive, perkTree, startMoves }
PERKS     (inside a class)  id → { name, tier, cost, needs:[ids], stat:{...} | hook:"name" }
MOVES     (js/moves.js)     id → { name, element, role, cd, range, classes:[ids]?, fn(f), info() }
PLAYER    (js/progress.js)  { class, xp, level, points, perks:[ids], moves:{formId: moveId} }  → one save key
```

- **`classStat(name, base)`** is the one function the game asks for a number: `classStat("siphonRate", SIPHON_PER_WISP)` returns the base plus every owned perk's modifier. The siphon, the surge, ammo, build cost, hack reward, move cooldowns all call it. Perks that are plain numbers are *only* a `stat` entry, so most perks need no code at all.
- **`classHook(name, ...args)`** is for the rare perk that does something (on kill, on night start, on build). Same idea as the zone-kit validator: the game calls named hook points; a perk lists the hook it implements.
- The class is **data**, so the UI (class picker, perk screen, INFO pages, the roster sheet) is generated from the tables, as the mini dial and the kits tab already are.

### 2.1 A class

```js
{ id: "engineer", name: "ENGINEER", colour: "#ffb020", tagline: "The grid is the weapon.",
  ultimate: { id: "overclock", name: "OVERCLOCK GRID", cost: 100, fn: overclockGrid, info: () => [...] },
  passive:  { stat: { buildCost: 0.85, siphonRate: 0.8 } },
  perkTree: [ /* 3 branches x 4 tiers, §4 */ ],
  startMoves: ["rewire"] }
```

The ultimate is the **same bar** (`playerUltimate`); a class only chooses what tapping it does. COMMANDER's ultimate is today's ARMY SURGE, moved, not changed, so existing saves and tests keep working.

### 2.2 The roster (picked: Flux Weaver, Necromancer, Stormcaller, Pyromancer, Rogue, Gunmaster; Broodmaster dropped)

COMMANDER stays as the default (today's player, so nothing breaks). Four **elemental** classes, one for each of four of the six elements (ice and core are open for later: a Cryomancer, a Warden), and two that are **not** elemental.

| Class | Element | Fantasy | Ultimate (the same bar) | Perk branches |
|---|---|---|---|---|
| **COMMANDER** | any | the army: today's player | ARMY SURGE (existing, moved) | SQUAD / SURGE / BONDS |
| **STORMCALLER** | electric | chain lightning, haste, stun | **STATIC STORM**: for 8 s every enemy in view is struck by chaining arcs, allies move 1.4x | ARC (chain count, damage) / TEMPO (haste, siphon rate) / STUN |
| **PYROMANCER** | fire | burning, big damage with a cost | **WILDFIRE**: a spreading fire across the lane for 10 s; burns your front units a little too | EMBER (burn damage, spread) / FURNACE (self-burn for power) / ASH (burned foes drop shards) |
| **FLUX WEAVER** | flux | gravity, position | **EVENT HORIZON**: a black hole drags everything in view to a point, holds it, pushes it out | PULL (range, hold time) / PHASE (swap, blink) / RIFT (zones of slow) |
| **NECROMANCER** | toxic (decay) | what dies feeds you | **SECOND WIND**: every follower and clone that died this night rises at half health for 20 s | HARVEST (kills pay shards and ultimate) / RAISE (revive, ghost allies) / BLIGHT (damage over time) |
| **ROGUE** | none | stealth, ambush, the quiet hack | **VANISH**: the whole squad drops off every enemy's radar for 8 s; the first hit out of it is a triple-damage ambush | SHADOW (detection range) / AMBUSH (first-strike bonus) / SILENT HACK (quiet panels, no decoy alarm) |
| **GUNMASTER** | none | the player's own gun | **BULLET STORM**: for 8 s the gun fires on its own at everything in range, no ammo cost, every hit marks | BARREL (damage, rate) / MAGAZINE (ammo, reload from kills) / MODS (more gear slots) |

The player cannot be hurt in this game (enemies go for the Crystal and the followers), so **stealth is about the squad and the hacks, not about the player's own life**: see §3.2.


## 3. Follower move selection

Today a form has one hard-wired move. The change:

- **`MOVES` registry** holds every move as `{ id, name, role, cd, range, fn }`. The existing ones (PETAL BLAZE, ARC VOLLEY, SINGULARITY SHOT, AEGIS BURST, STATIC RUSH, HEXFIRE, CHOMP, ERUPTION, GRAVITY SLAM, CORRODE SHOT, QUILL BURST, AEGIS BLOOM, REWIRE, RAPID DISCHARGE, HEAVY HAUL) move out of the `if/else` chain **unchanged**.
- **Each evolution lists the moves it may use**: `EVOLUTIONS[id].moves = ["petal_blaze", ...]`, the first being today's move (the default, so nothing changes until the player picks).
- **A follower has `f.move`** (saved with it). `evolutionTick` becomes `MOVES[f.move || def.moves[0]].fn(f)`; the cooldown is the move's own.
- **The UI:** the INFO tab's ATTACKS page gets a **MOVE** row to switch (a chip per allowed move, with the same numbers `MOVE_INFO` shows), and the Command Center gets "set move" for a selected group like it has for roles.
- **How a move becomes allowed:** it is on the form's list, **and** (if the move has `classes`) your class is on its list, **and** you have unlocked it (a perk, a level, or a class start move).

### 3.1 Niche moves only certain classes can use

`MOVES[x].classes = ["stormcaller"]` hides and blocks it for everyone else. They are **moves your followers use because of who you are**, so a Commander's army and a Stormcaller's army fight differently with the same forms. Each uses machinery that exists.

| Move | Class | On | What |
|---|---|---|---|
| ARC RELAY | Stormcaller | electric mages | the arc also jumps through allies, charging their ultimates |
| TESLA SNAP | Stormcaller | electric brawlers | the first hit on a target stuns it (the stun status) |
| IMMOLATE | Pyromancer | fire brawlers | sets itself alight: double damage, takes a little itself |
| EMBER TRAIL | Pyromancer | fire forms | leaves a burning path as it moves (the burn status on floor tiles) |
| PULL CHAIN | Flux Weaver | flux mages | yanks one enemy into melee range (the vortex pull, on one target) |
| PHASE STEP | Flux Weaver | flux forms | swaps places with the nearest ally in trouble |
| SALVAGE | Necromancer | any | a wreck or a corpse nearby turns into shards |
| SOUL LINK | Necromancer | toxic forms | shares its damage with a dead ally's ghost (a short-lived ghost phage) |
| AMBUSH | Rogue | brawlers | a follower standing out of sight opens with a first strike at 3x |
| SMOKE BOMB | Rogue | any | drops a cloud that hides allies inside it from enemies |
| COVER FIRE | Gunmaster | mages | fires on the target you last shot, with you |
| SPOTTER | Gunmaster | snipers | marks a target: your shots on it do +50% |

### 3.2 Stealth (the Rogue) and the gun (the Gunmaster)

- **Stealth is a status on the squad**: `a.hidden = frames`. A hidden unit is not picked as a target by predators beyond 1.5 tiles (the targeting code already asks `isHostileTarget` and range; this is one more test), and its first hit out of hiding is multiplied. The Rogue gets it by passive (standing still for 2 s), by SMOKE BOMB and by the ultimate. The **blind** status that combos use is the model: a predator that loses its target wanders.
- **The Rogue's hack is quiet**: a decoy panel does not trip the alarm for a Rogue who solves it (§4.1), nests can be hacked with a shorter alarm delay.
- **The gun is its own system**: today one weapon (`firePlayerShot`: 10 damage, 45-frame cooldown, 1 ammo, the selected element). It becomes a table of **guns** (`GUNS`: pistol, scattergun, rail, arc-caster...) and **mods** (barrel, magazine, core) that the Gunmaster's perks and the hack rewards (§4.2) fill. Any class can fire the gun; the Gunmaster gets the slots and the perks.


## 4. Progression

- **Currency:** `xp` for the *player*, not a follower. Earned from: siphon wisps landing (small, steady), a night survived, a zone taken, a nest destroyed, a boss killed. Levels 1–20, each level = 1 perk point; level 5/10/15/20 also unlocks a class tier (a stronger ultimate stage, a new move).
- **Perk tree per class:** 3 branches × 4 tiers. A perk is a `stat` and/or a `hook`, costs 1–3 points, and `needs` the one before it. Branches map to the class idea (Engineer: GRID / BUILD / OVERCLOCK; Commander: SQUAD / SURGE / BONDS).
- **Ultimate stages:** the class ultimate has three stages that perks unlock (longer, wider, a second effect). The bar fills at the same rate; the stage changes what it does.
- **Persistence:** one record, `conduit_player`, in localStorage like `tubecrawler_*`. Class, xp, perks and the chosen moves per form. A **respec** (refund all points) is free between nights, so a build is an experiment, not a mistake.
- **UI:** a **CLASS** panel on the dock (slab style): the class card (portrait = the 3D player, tinted), the ultimate, the perk tree as three columns of slabs, points left. The class picker is the first run's screen and in this panel.

### 4.1 The panel puzzle and the HACK skill (for every class)

Today a wall panel is hacked by standing next to it for 2.5 s (`SIPHON_FRAMES`, js/game.js): it pays shards and 8 ammo, or, if it is a decoy, trips an alarm. The puzzle sits **on top of that**, so nothing is taken away:

- **Two ways in.** Stand at a panel: **QUICK HACK** (the old 2.5 s siphon, same shards and ammo, no gear) or **SOLVE** (the puzzle, for gear too). Followers on a hack or siphon order, and autoplay, keep doing the quick hack: they cannot do maths.
- **The puzzle:** a multiple-choice algebra problem with up to three variables, e.g. `2x + y - z = 9`, where some variables are given and you pick the value of the one asked for from four choices. The generator is a **pure function** `makePuzzle(skill, rng)` so it can be tested: always exactly one correct choice, distractors distinct and plausible (off by a sign, by a swapped coefficient, by one), integer answers only.
- **The HACK skill** is a **separate permanent track, not part of the class** (every class hacks): levels 1 to 10, +XP per solve (more for harder ones), saved with the player record. Skill decides how many variables are in play and the difficulty tier, and with it the reward tier.
- **Failing** costs a lock-out of that panel and a small shard fee; on a **decoy** the alarm trips either way, as today (the Rogue's SILENT HACK removes it).
- **While it is open:** the world is paused like the other canvas panels; a 20 s timer (a perk can lengthen it) so it stays a quick beat in the lane. A slab-style modal, big italic numbers, four big answer buttons, touch and keyboard.

### 4.2 Gear: what a solved panel pays

A solved puzzle pays **a piece of gear**. Gear is individual: a thing a unit *carries*, in two families.

**FIELD GEAR: the tier is how far its effect reaches.**

| Tier | Reach | Carried by | Meaning |
|---|---|---|---|
| **T1** | **one follower** | that follower | the cheapest and most common; a personal upgrade |
| **T2** | **a squad, up to 3** | a follower | every member of the **roster squad** the carrier belongs to (up to 3, §4.3); a carrier in no squad gets the effect for itself only, so build squads to get the value |
| **T3** | **an aura** | a follower | every ally and clone within 3 tiles of the carrier, while it lives |
| **T4** | **the whole team** | the player's loadout | every follower and clone you own, wherever they are |
| **T5** | **the whole team and you** | the player's loadout | the team, and the player's own stats (siphon, hack timer, gun) |

Each piece is an **effect** (what it does) at a **tier** (where it reaches): the effect table is shared, so one definition of DAMAGE CELL gives five items. Effects: DAMAGE CELL (+damage), PLATING (damage taken down), REGEN WEAVE (HP per second), OVERCLOCK COIL (speed), WILL CELL (will refills faster), ELEMENT CORE (the unit's element hits harder), SIPHON TAP (siphon rate; T5 only touches the player, below T5 it is the carriers'), and so on. Strength grows with tier, but a bigger reach is weaker per unit (T1 is the strongest on its one unit), so a T1 on your best follower is still worth carrying.

**GUN GEAR: the tier is the strength.** The player's weapon has barrel, magazine and core slots; a gun mod's tier 1 to 5 is how much it adds (LONG BARREL +range, EXTENDED MAG +ammo, ELEMENT CORE element shots, PIERCING ROUNDS, RAPID BOLT shorter cooldown). The Gunmaster has more slots.

**Rules that keep it simple:**
- A follower carries **1 field piece** (2 once evolved). T4 and T5 go in the **player's loadout** (2 T4 slots, 1 T5 slot), not on a unit, so the team effect does not vanish with one death.
- **Same effect does not stack**: the strongest reach and tier applies to a unit once, so ten DAMAGE CELLs cannot add up. Different effects add.
- **Aura (T3)** is recomputed on a slow tick (every 30 frames), not per frame (the frame loop is the only clock; one pass over the followers). A **squad (T2)** needs no tick: it is the roster's own list, read when the gear is applied.
- A follower that **dies** drops its gear back to the inventory.
- **Kept for good** in an inventory of 8 (a perk or a gun mod slot raises it); it carries across runs.

**What a puzzle pays.** The puzzle tier decides the gear tier: **1 unknown variable → T1, 2 → T2 (a T3 on a hard one), 3 → T3 (T4 on a hard one)**; a **T5** only from a 3-variable solved in under half the time, and only at HACK level 8 or more. A decoy pays nothing. Quick hacks drop no gear: gear is the reason to solve.

**Where it shows.** A carried piece is a small pip on the unit's status chip (js/status.js) and a row on its INFO tab; an aura is a thin ring on the floor round the carrier; the GEAR panel (a dock slab) is the inventory, the equip slots on each follower, and the player loadout.

### 4.3 Roster squads (what a T2 piece reaches)

A **squad** is a small group you set up in the roster: up to **3 followers**, named (SQUAD A, B, C...) and coloured, a follower in at most one. It is a **new roster feature**, separate from the zone worker crews in js/zones.js (those are ants and core workers sent to build a zone). Squads are also useful on their own, so they ship with Track B's first step:

- **Making one:** in the Command Center roster, select up to 3 cards and tap **MAKE SQUAD**; a squad strip across the top shows each squad with its members and the gear they share. Drag or tap a member to remove it; a dead member leaves the squad.
- **Orders by squad:** a squad is a selection target (tap its strip to select all three, so HOLD, COME, MOVE and JOB work on it), and the mini dial's SEL scope can be a squad.
- **Saved** with the followers (`f.squadId`), so a reload keeps them.
- **Gear:** a T2 piece carried by any member applies to all current members. If the carrier leaves the squad, the effect leaves with it.

## 5. Build order (each is a commit, its own tests, a full green run)

**Track A, classes.**
0. **MOVES registry** (built).
1. **Class registry + save + `classStat`/`classHook`.** One class, COMMANDER, today's behaviour moved. The siphon and surge constants read through `classStat`. Test: with no perks, every number equals the old constant.
2. **Ultimate slot.** `fireArmySurge` becomes `class.ultimate.fn`; HUD label and info page come from the class.
3. **XP, levels, perk points, the CLASS panel** with COMMANDER's tree.
4. **Move selection.** `f.move`, the MOVE row, the squad setter, save/restore; class-gated moves.
5. The elemental classes one at a time: **STORMCALLER**, **PYROMANCER**, **FLUX WEAVER**, **NECROMANCER** (a row, a tree, an ultimate, two moves each, a test that its numbers match the table).
6. **ROGUE** (the `hidden` status and the targeting test), then **GUNMASTER** (needs Track B's guns and mods).

**Track B, the hack puzzle and gear (independent of classes: build it any time after stage 1).**
- **B1 Puzzle engine:** `makePuzzle(skill, rng)` pure, with a test that every problem has exactly one correct choice and integer answers, over thousands of seeds at every skill.
- **B2 HACK skill:** XP, levels 1 to 10, saved.
- **B3 Panel integration:** QUICK HACK / SOLVE at a panel, the modal, fail and decoy rules.
- **B0 Roster squads** (up to 3, named, saved, selectable; the T2 gear reach and a feature on their own).
- **B4 Gear:** the `GEAR` effect table, the five tiers (one / squad of 3 / aura / team / team + player), the inventory, equip rules and the GEAR panel; tier reach recomputed on a slow tick. Tests: each tier reaches exactly who it should, same effect never stacks, a dead carrier's gear returns, T4/T5 survive a death.
- **B5 Guns and mods:** `GUNS` and the gun mod slots (the Gunmaster's stage 6 depends on this).

## 6. Adding a class afterwards (the checklist)

1. A row in `CLASSES` (name, colour, ultimate, passive stats).
2. Its perk tree (rows of `{ name, tier, cost, needs, stat | hook }`).
3. Its ultimate function in `js/classes.js` (use `armyUnits()`, `applyDamage`, the existing statuses).
4. Class-only moves as rows in `MOVES` with `classes: ["id"]`.
5. `tests/classes.js` picks it up: every perk reachable, no cycle in `needs`, the ultimate fires and spends the bar, the class moves are blocked for others.

No other file changes: the picker, the perk screen, the INFO pages and the roster are built from the tables.

## 7. Risks, and what keeps them small

- **Balance:** all numbers are named constants in the class table; tests only assert the *relationships* (a perk is never negative, tier 4 > tier 1).
- **Save compatibility:** a save with no `conduit_player` becomes COMMANDER level 1; every follower with no `f.move` uses its form's default.
- **Performance:** `classStat` is a lookup into a table rebuilt when a perk is bought, not a loop over perks each frame (the frame loop is the only clock; no new timers).
- **Scope:** Stage 0–2 change no gameplay. A class that is not finished is simply not in the picker.

## 8. Decisions (answered)

1. **When is the class chosen?** Picked at the start and **switchable at the crystal between nights**; each class keeps its own level and perks.
2. **Progression** is **permanent** (saved per class, `conduit_player`), with a free respec between nights.
3. **Move choice** is **per follower, plus a squad setter** (INFO tab MOVE row, and "set move" for a selected group like roles).
4. **Class moves** work **only while you are that class**; switch and a follower falls back to its form's default move (`evoMoveAllowed` already enforces it once `playerClassId()` exists).

### Answered (the new asks)

5. **Hacker skill:** more variables = **harder and better gear**. The skill unlocks the tiers (1, 2, then 3 unknown variables); you choose how hard to go, up to your level.
6. **Gear** is **kept for good** in the inventory (8 slots) and carries across runs. **Reworked:** it is individual gear in five tiers by reach (one follower, a squad of 3, an aura, the whole team, the whole team and you), see 4.2.
7. **A wrong answer** costs a **lock-out of that panel and a small shard fee**; a decoy still trips its alarm as today.
8. **Team gear (T4, T5)** goes in the **player's loadout slots** (2 T4, 1 T5), not on a unit.
9. **The squad of 3 (T2)** is a **squad you set up in the roster**, not the nearest allies: see 4.3.

## 9. Done so far

- **Stage 0 (built):** `MOVES` in js/moves.js, `evoMoveIds / evoMoveAllowed / evoMoveOf`, and `evolutionTick` fires `evoMoveOf(f).fn(f)` instead of the if/else chain. Each form's default is the move it always had (tests/moves.js compares every form with the old chain). A form can already list several moves (`EVOLUTIONS[id].moves`), and a class-only move is already blocked for other classes; nothing uses either yet.
