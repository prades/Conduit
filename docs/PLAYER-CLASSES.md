# Player classes, class ultimates, perks and follower moves — the path

Asked: *"Make a clear path to add player classes and class specific ultimates and perks like a character progression system, and make way for follower evolution attack move selection, and add niche attacks that only specific playable character classes have access to."*

**Status: plan. Nothing here is built.** Stage 0 changes no behaviour; every later stage is one commit with its own test suite, like the kits.

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

### 2.2 Classes to ship first (names are placeholders, the table makes them cheap to change)

| Class | Idea | Ultimate | Leans on |
|---|---|---|---|
| **COMMANDER** (today's player) | the squad | ARMY SURGE (existing) | siphon, follower ultimates, bonds |
| **ENGINEER** | the power grid | OVERCLOCK GRID: every pylon/turret/battery in the network fires at 2x for 10 s, shields from core pylons | pylons, kits, zones |
| **HACKER** | disruption, panels, ammo | SYSTEM CRASH: every enemy in view is blinded and stunned, the wall panels pay out | the player weapon, blind status (combos) |
| **BROODMASTER** | followers and evolution | MOLT: every follower's signature move fires at once and their cooldowns reset | evolutions, moves |

Four is enough to prove the table; more is a table row each.

## 3. Follower move selection

Today a form has one hard-wired move. The change:

- **`MOVES` registry** holds every move as `{ id, name, role, cd, range, fn }`. The existing ones (PETAL BLAZE, ARC VOLLEY, SINGULARITY SHOT, AEGIS BURST, STATIC RUSH, HEXFIRE, CHOMP, ERUPTION, GRAVITY SLAM, CORRODE SHOT, QUILL BURST, AEGIS BLOOM, REWIRE, RAPID DISCHARGE, HEAVY HAUL) move out of the `if/else` chain **unchanged**.
- **Each evolution lists the moves it may use**: `EVOLUTIONS[id].moves = ["petal_blaze", ...]`, the first being today's move (the default, so nothing changes until the player picks).
- **A follower has `f.move`** (saved with it). `evolutionTick` becomes `MOVES[f.move || def.moves[0]].fn(f)`; the cooldown is the move's own.
- **The UI:** the INFO tab's ATTACKS page gets a **MOVE** row to switch (a chip per allowed move, with the same numbers `MOVE_INFO` shows), and the Command Center gets "set move" for a selected group like it has for roles.
- **How a move becomes allowed:** it is on the form's list, **and** (if the move has `classes`) your class is on its list, **and** you have unlocked it (a perk, a level, or a class start move).

### 3.1 Niche moves only certain classes can use

`MOVES[x].classes = ["engineer"]` hides and blocks it for everyone else. They are **moves your followers use because of who you are**, so a Commander's army and an Engineer's army fight differently with the same forms. Examples (each uses machinery that exists):

| Move | Class | On | What |
|---|---|---|---|
| OVERCLOCK PULSE | Engineer | core/electric forms | hastes every pylon and turret in 3 tiles for 5 s (power.js haste) |
| SPLICE | Engineer | toxic/core | rebuilds a wrecked pylon from range, no walking (the re-arm job as a move) |
| SPOOF | Hacker | flux/electric | an enemy changes sides for 4 s (a small version of the ant mind-control) |
| BLACKOUT | Hacker | ice/flux | blinds in a cone (the blind status from combos) |
| RALLY CRY | Commander | brawlers | the group's next hit is doubled and shared across bonds |
| FOCUS FIRE | Commander | mages | every mage in range hits the same target |
| REGROW | Broodmaster | any | a follower sheds a layer: heals half and fires its own signature move |
| CHAIN MOLT | Broodmaster | evolved | a level-up on one evolved follower levels its bonded partner a half level |

## 4. Progression

- **Currency:** `xp` for the *player*, not a follower. Earned from: siphon wisps landing (small, steady), a night survived, a zone taken, a nest destroyed, a boss killed. Levels 1–20, each level = 1 perk point; level 5/10/15/20 also unlocks a class tier (a stronger ultimate stage, a new move).
- **Perk tree per class:** 3 branches × 4 tiers. A perk is a `stat` and/or a `hook`, costs 1–3 points, and `needs` the one before it. Branches map to the class idea (Engineer: GRID / BUILD / OVERCLOCK; Commander: SQUAD / SURGE / BONDS).
- **Ultimate stages:** the class ultimate has three stages that perks unlock (longer, wider, a second effect). The bar fills at the same rate; the stage changes what it does.
- **Persistence:** one record, `conduit_player`, in localStorage like `tubecrawler_*`. Class, xp, perks and the chosen moves per form. A **respec** (refund all points) is free between nights, so a build is an experiment, not a mistake.
- **UI:** a **CLASS** panel on the dock (slab style): the class card (portrait = the 3D player, tinted), the ultimate, the perk tree as three columns of slabs, points left. The class picker is the first run's screen and in this panel.

## 5. Build order (each is a commit, its own tests, a full green run)

0. **MOVES registry.** Pure refactor: the `if/else` chain becomes a lookup, `MOVE_INFO` gains an `id`. Test: every evolution's move fires the same as before (the existing tests/evolution.js is the proof).
1. **Class registry + save + `classStat`/`classHook`.** One class, COMMANDER, which is today's behaviour, moved. The siphon and surge constants read through `classStat`. Test: with no perks, every number equals the old constant.
2. **Ultimate slot.** `fireArmySurge` becomes `class.ultimate.fn`; the HUD label and the info page come from the class.
3. **XP, levels, perk points, the CLASS panel.** COMMANDER's tree.
4. **Move selection.** `f.move`, the MOVE row, the group setter, save/restore. Class-gated moves enforced by the registry.
5. **ENGINEER**, then **HACKER**, then **BROODMASTER**: each is a class row, a tree, an ultimate function, two or three class moves, and a test that its numbers match the table.
6. Roster sheet / docs generated from the tables.

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

## 8. Decisions needed

1. **When is the class chosen?** At the start of a run (locked for the run), or switchable at the crystal between nights (progression per class)?
2. **Is progression per run or permanent?** Perks and XP reset each run, or the player level persists across runs?
3. **Move choice:** pick per follower, or per evolution form for the whole squad (all QUILLSTONES use the same move)?
4. **Class moves:** only usable when you are that class (they vanish if you switch), or learned for good once unlocked?
