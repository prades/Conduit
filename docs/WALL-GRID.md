# The wall grid: batteries in the walls, equipment that matches them

Asked: *"I want the battery system to be interwoven into the wall, so there is not a whole bunch of clutter everywhere. And I'd like to upgrade all the equipment again to make it look like it matches the paneling on the walls. That means redoing all the kits, I'd imagine: we could just remove the batteries from all the kits and have it so the predators attack the walls."*

**Status: plan.** Nothing here is built.

## 1. What a battery is today

| Thing | Where | Rule |
|---|---|---|
| A battery | a pylon on a floor tile (`isBattery`, an element, `charge` up to `BATTERY_CAPACITY` 120) | linked batteries of one element form a **bank** (`_batteryBanks`, js/game.js): 2, 4 or 6 of them give network **tier I, II, III** (`BATTERY_TIER_SIZES`) |
| Its reach | `BANK_FULL_RANGE` 6 tiles, a tier lower every `BANK_FALLOFF_STEP` 6 tiles beyond | js/nethud.js `networkSignalAt` reads it |
| Its job | feeds pylons and turrets within `BATTERY_SUPPLY_RANGE` 12, charged from a nest | js/power.js |
| In the kits | `B` pieces: exactly the number the target tier needs (rule R1 in docs/LAYOUT-KITS.md) | 12 of the 16 kits have them |
| The wall | the lane has a back wall (row -2) and a front wall (row 5) of `wall_back` / `wall_front` tiles, panelled with dark plates and teal traces; wall PANELS are hackable for shards; the nest vortex is in the back wall | js/world.js, js/draw.js |

## 2. The idea (as answered)

**A POWER UNIT IN EACH ZONE'S WALL.** There are no batteries to place any more. Each zone's back wall carries one **power unit**: an interactive cabinet set into the wall, six cells wide (the six wall tiles at the zone's left end, clear of the nest's vortex), dark until you **boot it up** and then **upgrade** it, like a machine in the wall rather than a pile of pylons in the lane.

- **Tap it** (the wall panel) and a small panel opens on it: **BOOT** (pick an element, pay) when it is dark; when it is up, its tier, charge and health, **UPGRADE** (to tier II, then III), and the element chips to **RECONFIGURE** it.
- **What a tier is:** the unit's cells are real batteries in every rule (the unit sets two, four or six wall tiles to battery cells of its element), so the **bank, the tier, the reach, the charge and the supply are exactly what they were**: tier I, II, III = the 2, 4, 6 cells a bank gave. Only where they stand, and how you build them, changes. A zone needs its generator to boot (as all tech does).
- **Price:** the same as the batteries it replaces: each step (BOOT, then UPGRADE to II, then to III) is two cells' worth.
- **Predators attack the walls (decided: they damage the wall segment, and a unit inside a wrecked segment goes dark until it is repaired).**

## 3. The kits

The kits lose their `B` pieces and build no batteries; a kit's target tier is read from the zone's power unit (a kit that needs tier II says so, builds, and goes live when you upgrade the unit). The player boots and upgrades the unit by hand, and autoplay does it with the same functions. **("FILL THE WALL" was dropped: the unit is the interaction.)**

## 4. The look

All the equipment is redrawn to match the wall: dark chamfered plates, the same panel seams and teal trace lines, lit slots and trim rather than free-standing glass and metal. Pylons, turrets, the generator, the connector and the modules. This is art, so it goes the way the creatures did: **numbered mock-ups first**, you pick, then it is built.

## 5. Build order

1. **The power unit (DONE, build 2026-10-18w):** the six wall tiles, the cells as batteries in every rule, the panel (BOOT, UPGRADE, RECONFIGURE), drawing it in the wall, saving, and the build menu no longer placing batteries.
2. **Predators and the walls:** wall segments with health, the attack, a unit dark inside a wrecked segment, the repair.
3. **The kits:** the `B` pieces out, the validator and tests rewritten, autoplay on the unit.
4. **The look:** mock-ups, then the redraw.

Notes on stage 1: the unit is wired into its zone's generator whatever the distance (power.js `generatorFeeding`); a wall cell cannot be demolished; the pylon kind picker and the build menu no longer offer a battery (`buildFloorBatteries` in js/buildmenu.js is the off switch the old placing tests turn on); the tutorial's battery step is "boot the power unit". Tests: tests/wallunit.js.

## 6. Decisions (answered)

1. **Where do the cells live?** In each zone's back wall, one **power unit** of six cells (answered, then simplified: boot it, upgrade it).
2. **How do predators attack them?** They damage **wall segments**; a unit in a wrecked segment goes dark until repaired.
3. **What do the kits do about batteries?** **Build none**; the unit is booted and upgraded by hand (no "fill the wall").
