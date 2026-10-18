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
2. **Predators and the walls (DONE, build 2026-10-18x):** a hunter (js/infest.js) walks to the floor in front of a booted cell and bashes it; the cells beside it in its three-tile segment take half; a cell at no health is wrecked (dark, empty, out of the bank, so the unit drops a tier). Not converted: damaged, not taken. Repair: ants mend hurt cells and rebuild wrecked ones live, the panel's REPAIR button (5 shards a cell), and hurt cells slowly mend themselves. Thieves that eat a battery wreck a cell the same way. See js/wallunit.js.
3. **The kits (DONE, build 2026-10-18y):** the `B` pieces are out of all 16 kits (which were redesigned so no two are the same layout without them; the front kits are fed by a connector), a kit names the unit tier it needs and says so when the unit is below it, the unit moved to the front of the zone's wall (x 9 to 14, beside the nest) so the guns are inside the bank's full-strength reach (saves from before it are migrated), the zone order picker has no battery, and autoplay boots and upgrades the unit once the generator stands. See docs/LAYOUT-KITS.md.
4. **No generators, no connectors (DONE, build 2026-10-18z):** asked "do you think connectors / generators are really necessary?" (no; workers will do the healing in a later patch). The unit is the zone's generator: BOOT needs only a nest of yours in the zone (the home portal at home), the unit draws on it at any distance, charges its cells from it and feeds every pylon within the battery supply range (12) of a live cell, and linked pylons carry it on. Nothing is placed: the build menu has no POWER tab (the network panel's tap opens the unit's panel instead), the picker offers attack / support / disruption only, the kits and zone orders have no generator or connector (the four 'relay' kits became plain layouts, SKELETON became PICKET: one gun), the tutorial teaches booting the unit and drops the generator, connector and circuit steps, and no cable runs from the unit. Generators and connectors in an old save are demolished and refunded on load (`legacyPowerClear`). The old placing code is still in the engine behind `buildFloorBatteries` (which the old tests turn on); deleting it is a later patch.
5. **The look (the wall DONE, build 2026-10-18aa):** asked for a dark, evil laboratory with 3D-ish, bulky equipment that comes off the wall (thick computer screens, generators, servers, test chambers, control panels); the user picked option 5 of the six mock-ups, AMBER OLD-TECH (beige-black chunky cabinets, amber monochrome screens, big dials). js/labwall.js: every back-wall tile carries a baked sprite of a piece that stands out of the wall (servers, single and stacked CRTs, consoles with a raised monitor, pipe runs; a generator, a test chamber with a specimen, or a wide console on a pair of tiles), chosen by a fixed function of x, drawn in the depth-sorted pass so units walk in front of it; the power unit's six tiles are glass capacitors (tube filled in the element's colour, empty bay, wreck); the wall face and its traces went warm and amber; hackable wall panels no longer generate on the unit's tiles. **Then (build 2026-10-18ac): the interactable equipment took the same amber old-tech palette (the sentinel pylons and hack panels, the wave monoliths, the turrets and emplacements, the Ultra turret, the modules), and a two-tile piece is cut in two halves, one stamped with each tile (its sprite was also too short and cut off its foot). Not done: redrawing the pylons, turrets, MK II and Ultra with finer detail per tier; today they are the old shapes in the new colours.**

Notes on stage 1: the unit is wired into its zone's generator whatever the distance (power.js `generatorFeeding`); a wall cell cannot be demolished; the pylon kind picker and the build menu no longer offer a battery (`buildFloorBatteries` in js/buildmenu.js is the off switch the old placing tests turn on); the tutorial's battery step is "boot the power unit". Tests: tests/wallunit.js.

## 6. Decisions (answered)

1. **Where do the cells live?** In each zone's back wall, one **power unit** of six cells (answered, then simplified: boot it, upgrade it).
2. **How do predators attack them?** They damage **wall segments**; a unit in a wrecked segment goes dark until repaired.
3. **What do the kits do about batteries?** **Build none**; the unit is booted and upgraded by hand (no "fill the wall").
