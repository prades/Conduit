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

## 2. The idea

**WALL CELLS.** A battery stops being a pylon standing in the lane and becomes a **cell set into the wall**: a lit panel flush with the wall face. The lane keeps its floor clear (the clutter was the banks of batteries), and the wall, which the player never walks on, carries the power.

- **Where:** each zone's back wall has a row of cell slots (`WALL_CELLS_PER_ZONE`, six: the most a tier III bank needs), spaced along the wall.
- **Building one:** pick BATTERY in the build menu, then tap a slot (or the wall segment); it costs what a battery costs, in an element you choose, like today. A slot already holding a cell of another element can be replaced.
- **What they do:** exactly what a battery bank did: the cells of one element in a zone are a bank, 2 / 4 / 6 give tier I / II / III, the reach is measured from the nearest cell along the wall, they hold charge and feed pylons in range, and they charge from the nest. So **nothing about the network rules changes; where the batteries stand does**.
- **Predators attack the walls:** a wall cell has health. Predators that reach the wall (they already hunt pylons and the Crystal) attack the cells: a destroyed cell is lost with its charge, the zone's tier drops, and it can be rebuilt (core workers rebuild wrecked pylons today; the same job rebuilds a cell). Nothing in the lane can be bypassed by standing a battery out of reach any more: the wall is where the lane's enemies already are.

## 3. The kits

The kits lose their `B` pieces. A kit becomes generator, connector, turrets, wave and support pylons, and its **target tier** is now *the tier the wall already provides* (a kit asks for it; it does not build it). So:

- R1 (batteries are exactly the number the tier needs) becomes: **a kit builds no batteries**; its target tier is checked against the zone's wall cells (a kit that needs tier II says so and is not blocked: it builds, and goes live when the wall cells arrive).
- A new kit action **FILL THE WALL** builds the wall cells to a tier (2, 4 or 6 cells of an element), separately from any layout, in one tap.
- The kit list stays sixteen, smaller: POWER kits become mostly the generator and the way the wall feeds it; the Ultra and formation kits (which need a tier II bank) lose their battery blocks and keep their turret or wave squares.
- Autoplay builds wall cells with the same function.

## 4. The look

All the equipment is redrawn to match the wall: dark chamfered plates, the same panel seams and teal trace lines, lit slots and trim rather than free-standing glass and metal. Pylons, turrets, the generator, the connector and the modules. This is art, so it goes the way the creatures did: **numbered mock-ups first**, you pick, then it is built.

## 5. Build order

1. **Wall cells:** the slots, the cell as a battery in every rule (bank, tier, charge, supply), the build tool on the wall, saving, and moving existing batteries into slots when a game is loaded.
2. **Predators and the walls:** cell health, the attack, the loss of tier, the rebuild.
3. **The kits:** the `B` pieces out, the validator and tests rewritten, FILL THE WALL, autoplay.
4. **The look:** mock-ups, then the redraw.

## 6. Decisions

1. **Where do the cells live?**
2. **How do predators attack them?**
3. **What do the kits do about batteries?**
