# The player's part in a fight

- **Status:** Step 1 (the bars come back, the repair kit, build `2026-11-11e`) and step 2 (GUARD and STUN DIVE, build `2026-11-11f`) are **implemented and verified by tests**; not playtested.
- **Owner:** the user (creative direction); the agent (implementation support)
- **Last updated:** 2026-11-11
- **Branch/build context:** `claude/start-game-project-HSh7Z`, build `2026-11-11f`
- **Related docs:** `COMBAT.md` (the player's three hits, the bite), `PLAYER-CLASSES.md`, `UNIVERSAL-AND-PLAYER-CARDS.md` (Player cards), `TECHNICIANS.md` (the Photonic Shield, which also stops shots)

## 1. Intent

The owner, 2026-11-11: "I feel like the 3-hit rule is a bit harsh, and I feel like there's no room for compatibility there with just 3 bars. I feel like it would be cool maybe to have the player use items to recharge the bars, but at the same time maybe it would be better if they had more of a role within the combat, and they could block shots for the followers, or swoop in to stun the target. But I don't want to make it too easy."

What it is today (js/config.js `PLAYER_HITS`, js/helpers.js `hurtPlayer`): any hit takes one of three bars, however hard; nothing refills them but a knockout, which sends you back to the Crystal at 5% of its power (at its reserve, the run ends). Chip damage from one fight carries into the next.

## 2. Approved design (2026-11-11, chosen from options)

Offered three directions (A the bars come back; B A plus a part for the player in a fight; C no health, the player a monitor of the battlefield), the owner chose **"B built on A"**. Then, of the details:

1. **The bars come back, slowly**: after **10 seconds** with no creature near you and no hit, **one bar every 8 seconds** (chosen "Slow" over medium and fast).
2. **A repair item** refills one bar, and can be used mid-fight. It comes from **both**: creatures sometimes drop one, and some lie at spots around the facility, coming back a while after they are taken.
3. **GUARD is a stance**: tap GUARD by the dial and you hold up a guard: creature shots aimed at followers near you hit you instead, **a bar each, one a second at most**; you move at **half speed** while guarding; tap again to drop it (chosen over guarding one follower and over automatic body-blocking).
4. **STUN DIVE is a chip, then a tap**: tap STUN by the dial, then a creature a few tiles away: you swoop to it and it is stunned for a moment so the squad can pile on; then the chip rests (as the technicians' abilities work; chosen over a double tap).
5. **The knockout stays**: three bars gone is still back to the Crystal. Protecting the squad costs bars, so it does not make the game easy.

## 3. Must-have requirements

**Step 1: the bars come back, and the repair kit**
- [x] Out of danger (no creature near you, no hit) for 10 s, a bar comes back every 8 s until all three are back; any hit, or a creature coming near, stops it and starts the 10 s again.
- [x] The repair kit: a pack item, used from the pack, from a pill by the dial and with a key; it gives one bar back; refused when your bars are full.
- [x] Creatures sometimes drop one when killed; some lie at spots in the facility and come back a while after they are taken.

**Step 2: GUARD and STUN DIVE**
- [x] GUARD by the dial, a stance on and off: while it is on, a creature's shot that would hit a follower near you hits you instead (one bar, then the usual grace); you move at half speed.
- [x] STUN by the dial, then a creature in reach and in sight: you swoop beside it and it is stunned for a moment; then the chip rests.

## 4. Non-goals

- The player has no hit points: bars stay a count of hits.
- No change to the followers' health, the creatures, or the knockout's cost.
- More bars from cards or classes (a later step, once the bars come back: the room to grow the owner asked for).
- Phones (not supported).

## 5. Chosen by the agent, provisional (the owner's to change)

**Step 1 (build `2026-11-11e`):** the name REPAIR KIT; its look on the floor (a small grey case, a carry handle, a green plus on its lid) and in the pack (the same, drawn); three at most in the pack; a creature drops one on **8%** of kills (never a test boss), lying there **a minute** as the scrap does; **three spots** (two in the arena: by its door from the hallway and in its south-east corner; one on the Sewers' north ledge by the culvert), each back **three minutes** after it is taken; the **KIT pill** at the end of the row by the dial while you carry one; the key **H**.

**Step 2 (build `2026-11-11f`):** GUARD guards your squad (followers and clones) within **2.5 tiles** of you; the two buttons are **round, GUARD above STUN, just left of the dial** (the pill row by the dial had no room left on an iPad); the keys **G** and **V**; STUN DIVE reaches **5 tiles** (in sight, a clear way), the swoop takes **0.2 s** and nothing hits you during it, you stop **0.9 tiles** from the creature, the stun lasts **1.5 s**, the button rests **12 s**. A boss can be stunned like any creature (open question 2); a huge body (THE ANT QUEEN's) is in reach when its edge is, and you stop outside it.

**Where the buttons are (build `2026-11-11t`)**: in the corners layout (a tablet or a desktop) GUARD and STUN are two emblems THE CORE holds out on its cables, left of your cube in the bottom-right corner (js/corehud.js; `UI-STYLE.md`, "THE CORE"); a tap does the same. The round buttons by the dial remain outside that layout. Since build `2026-11-11u` the emblems are bigger, and the KIT pill (with the ammunition and the other pills) is in THE CORE's box over its slab.

## 6. Affected systems

The player's bars (js/config.js, js/helpers.js `hurtPlayer`, the HUD), the danger test (js/facilityplay.js `facilityEnemyNear`), the pack (js/inventory.js `ITEMS`), drops (js/drops.js), the map's pickups (js/facilitymap.js), the props (a ground model, design/props/models/pickups.js), the dial's chips (js/targeting.js), creature shots (js/predator.js, `targetsGreen`; the shield's stop, js/techabilities.js `techShieldStopsShot`), the stun (js/combat.js `applyStun`), the save (what kits you carry; the spots).

## 7. Edge cases

- A knockout fills the bars as now; the refill never goes past three.
- The tutorial, the Toxic Queen's scripted knockout and the cards that touch the bars (LAST STAND, GLASS CANNON) keep working.
- `?attract` (the website's background) has no player.

## 8. Acceptance criteria

Written per step, with its tests.

## 9. Implementation notes

**Step 1, build `2026-11-11e`** (js/playercombat.js, `PLAYER_COMBAT`):
- **The refill** (`playerCombatTick`, each frame of the facility from js/facilitytutorial.js): the wait starts again when `player.lastHitAt` changes or `facilityEnemyNear()` finds a creature (asked every quarter second); after `refill.after` (600 frames) a bar comes back, then one each `refill.every` (480); never past `PLAYER_HITS`. Not in `?attract`.
- **The repair kit** (`ITEMS.repair_kit`, js/inventory.js; its icon `INV_ICONS.repair`; second in the pack's order): `playerKitUse` gives a bar back or refuses; `invUse` spends one only when it worked. The KIT pill (`drawKitChip`, `kitChipTap`) is drawn in the row by the dial (js/targeting.js; in THE CORE's box in the corners layout since `2026-11-11u`) and its tap taken in js/input.js (in THE CORE's box, by js/corehud.js `_corePillTap`); the H key in js/playercombat.js.
- **Drops** (`playerKitDrop`, from js/drops.js `onPredatorDeath`): a temporary pickup, as the scrap's (js/facilityspawn.js), gone once taken or after `drop.life`.
- **Spots that fill again**: a map pickup may carry `respawn` (frames; js/facilitymap.js, carried by js/facility.js); js/facilitytutorial.js `facilityPickupTick` puts a taken one back that long after, in a column of light; js/facilitysave.js does not keep it as taken.
- **GUARD** (`playerGuardToggle`, `playerGuardSpeed`, `playerGuardBlocks`): js/game.js asks `playerGuardBlocks(p, a)` in the shots' hit test before a creature's shot (`targetsGreen`) hurts one of your squad; it calls `hurtPlayer` (no push), so inside the grace a block is free. js/facilityplay.js multiplies your step by `playerGuardSpeed()`. A knockout (js/game.js) and a new game (js/facilityplay.js) call `playerCombatReset`. The reach is drawn round you on the floor (`drawPlayerCombatFx`).
- **STUN DIVE** (`playerDiveArm`, `playerDiveAt`, `_pcDiveStep`): armed, the next tap on a creature (js/input.js, before the attack) dives at it if it is in reach, in sight (`facilitySeesFrom`) and the way is clear (`_fpLos`, js/facilityplay.js: the straight-walk test the routes and leaps use); the swoop moves you a frame at a time in `playerCombatTick`, `player.invuln` covers it, and at its end `applyStun` (js/combat.js). Its streak is drawn on the floor.
- **The buttons** (`drawPlayerCombatChips`, from js/targeting.js `drawTargetUI`; `playerCombatTap` from js/input.js): GUARD lit while up; STUN pulsing while armed, its rest a dark sweep and the seconds left. A panel over the corner (the pack, INFO, the class picker, the Armory) hides them and takes their taps away (`_tgChipsOff`), as it does the serum, potion and kit pills'.
- **The model** on the floor: `repair_kit` in design/props/models/pickups.js (since build `2026-11-13x` in design/props/models/_items.js, shared with its 3D icon in the pack), baked into img/props/pickups.png (the other eleven pickups re-baked pixel for pixel the same). design/props/bake_props.js now uses the machine's Playwright and browser (the old pinned browser is not on this machine).

## 10. Verification record

| Check | Result | Evidence / notes |
|---|---|---|
| `node tests/playercombat.js` (7 checks: the refill's timing and its resets, the kit's use and refusal, the pill and the key, drops, the three spots and their return, the model) | Pass | build `2026-11-11e` |
| The nearest suites (facility, facilityplay, packs, serum, potion, targets, toolbox, hud, bottomui, mutator, crystalline, bible, bundle, images and others: 24) | Pass | build `2026-11-11e` |
| The real page: a kit on the arena floor, the KIT pill by the dial, one bar left | Looked at (screenshot) | not playtested |
| `node tests/playercombat.js`, step 2 (6 more checks: GUARD's toggle, pace and reset; its block and costs; a dive's swoop, stun, rest and refusals; a huge body's reach and stop; a panel over the corner taking the buttons' and pills' taps away; the buttons, the keys and the armed tap) | Pass | build `2026-11-11f` |
| The real page: GUARD up (the ring round the squad, the two buttons by the dial), a dive mid-swoop and after (STUNNED, the button resting) | Looked at (screenshots) | not playtested |
| The full run (`node tests/run.js`, 109 suites) | Pass | build `2026-11-11f` (commit `80ac3e3`); an earlier run before the last fixes had one failure, techabilities' real-browser throw (the thrown follower came down out of reach), which passed alone, in a 12-suite rerun and in this run |

## 11. Open questions

1. More bars, or a faster refill, from cards and classes (later).
2. Whether a boss (THE ANT QUEEN, the Toxic Queen) can be stunned by the dive, and for how long.

## 12. History

- 2026-11-11: the owner's question; directions A, B and C offered; "B built on A" chosen; the four details chosen from options (guard stance; chip then tap; both sources; slow refill). Decision record: `DECISION-LOG.md`, "The player's part in a fight".
