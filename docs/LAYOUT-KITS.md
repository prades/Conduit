# Zone equipment layouts: 16 kits (a plan)

Asked: *"layouts for different equipment systems, that don't exaggerate unnecessary equipment. Plan a way to make 16 different variants of zone equipment layouts that make sense, used by the auto and available as build kits in the build menu in a separate tab."*

This is a plan, nothing is built yet. It ends with the decisions I need from you.

## 1. What a kit is

A **kit** is a small, fixed pattern of equipment for one zone, written once as data and used three ways: placed by the player (a KITS tab in the build menu), placed by autoplay, and queued as build orders for a crew (the ZONES tab).

- Coordinates are **(dx, dy) from the zone's held nest**: dx runs toward the front (the next zone, where the enemy comes from), dy is the lane row 0..3. A kit can be mirrored if the nest has room on only one side.
- Each piece names a **kind** and an **element slot**, not an element: `G` generator, `C` connector, `B` battery, `T` turret, `W` wave pylon, `S` support pylon. Slots are `NET` (the zone's network element: batteries and turrets), `FORM` (the formation element) and `AUX` (support). So one layout covers every element: 16 layouts x the unlocked elements is the real number of variants.
- A kit has a **target** (the tier its battery bank reaches, whether an Ultra or a formation forms) and a **budget** (pieces and shards).

## 2. The rules that stop it exaggerating

These are checked by a validator (and a test) on every kit, so a new kit cannot cheat:

| Rule | Meaning |
|---|---|
| R1 | Batteries are exactly the number the target tier needs: 0, 2 (tier I), 4 (tier II) or 6 (tier III). No spare battery. |
| R2 | Every turret has a job: a lane gun, or one of the four turrets of an Ultra square. At most 4 free turrets, plus an Ultra's 4. |
| R3 | A wave pylon exists only as one of the 4 of a formation square, or as one of at most 2 supports. Never loose. |
| R4 | One generator per zone. A connector only in the kit whose point is reach (RELAY LINE). |
| R5 | Every piece is **powered and linked**: the graph of pieces is connected under the real link rules (3.05 tiles between pylons, a generator within 6 of a nest, a connector feeds 14). A kit that leaves a piece dark fails. |
| R6 | The target is **achieved when built**: the network reads the tier it claims, an Ultra fuses, a formation forms (tier II needed, within 6 tiles of the bank). Simulated in the real game in the test. |
| R7 | At most 17 pieces and 170 shards, and the layout fits the 4-row lane with the lane left open (a free row for walking). |

## 3. The 16 kits

Legend on the 4-row lane, nest on the left: `G` generator, `B` battery, `T` turret, `W` wave pylon, `S` support, `C` connector, `.` empty. dx 0 is at the nest.

All kits share the same **core**, so a kit is always a superset of a smaller one and the builder only adds the difference (this is what lets auto *upgrade* a zone instead of rebuilding it). The generator is `G(0,1)`; batteries fill in the order `(1,1) (2,1)` then `(1,0) (2,0)` then `(3,0) (3,1)`.

### Power: hold a zone cheaply (4)

```
 1 SKELETON        3 pcs  30   tier I     power only, for a cleared zone with nothing to defend
   0 1 2 3
y0 . . . .
y1 G B B .
y2 . . . .

 2 OUTPOST         5 pcs  50   tier I     the minimum that fights back
   0 1 2 3
y0 . . . .
y1 G B B .
y2 . T T .

 3 STRONGPOINT     7 pcs  70   tier II    a pod of four: MK II turrets and formations become possible
   0 1 2 3
y0 . B B .
y1 G B B .
y2 . T T .

 4 BASTION         9 pcs  90   tier III   a pod of six: full-strength network over the widest area
   0 1 2 3
y0 . B B B
y1 G B B B
y2 . T T .
```

### Defence: guns (5)

```
 5 RELAY LINE      6 pcs  60   tier I     a connector near the nest feeds a forward post (14 tiles) with no chain of pylons
   0 1 2 3 4 5 6 7 8 9
y0 . . . . . . . . T .
y1 G C . . . . . . B B
y2 . . . . . . . . T .

 6 GUN LINE        7 pcs  70   tier I     four guns across the lane at one column: even fire, no gaps
   0 1 2 3 4
y0 . . . . T
y1 G B B . T
y2 . . . . T
y3 . . . . T

 7 CROSSFIRE       7 pcs  70   tier I     guns staggered on the outer rows: covers the walls without blocking the lane
   0 1 2 3 4 5
y0 . . . T . T
y1 G B B . . .
y2 . . . . . .
y3 . . . T . T

 8 ULTRA NEAR      9 pcs  90   tier II    pod of four + a 2x2 of turrets that fuse into an Ultra, close to the nest
   0 1 2 3 4 5
y0 . B B . . .
y1 G B B . T T
y2 . . . . T T

 9 ULTRA FRONT     9 pcs  90   tier II    the same Ultra, forward at the zone's entrance (the bank stays within 6 tiles so it still fuses)
   0 1 2 3 4 5 6 7 8
y0 . . . B B . . . .
y1 G . . B B . . T T
y2 . . . . . . . T T
```

### Control: formations (3, each takes any formation element)

Formation element (flux black hole, fire spinning wall, ice generator, toxic tower, core shield forge) is chosen at placement, so each of these is five concrete kits. Each needs a tier II bank of the **formation** element, so the bank is the same element as the square.

```
 10 TRAP           9 pcs  90   tier II    formation mid-lane: catches what is walking through
   0 1 2 3 4 5 6
y0 . B B . . . .
y1 G B B . W W .
y2 . . . . W W .

 11 CHOKE          9 pcs  90   tier II    formation at the entrance, bank behind it: stops them before the guns
   0 1 2 3 4 5 6 7 8
y0 . . . B B . . . .
y1 G . . B B . . W W
y2 . . . . . . . W W

 12 HOME GUARD     9 pcs  90   tier II    formation beside the generator, for zones that get raided from the side
   0 1 2 3 4
y0 . B B W W
y1 G B B W W
```

### Combined (4)

```
 13 SUPPORT NET    7 pcs  70   tier I     2 guns + 2 support pylons (electric haste or core shields) that work on the squad standing in the lane
   0 1 2 3 4
y0 . . . S .
y1 G B B . T
y2 . . . S T

 14 SIEGE          11 pcs 110  tier II    an Ultra plus two more guns for a zone that is attacked every night
 15 HARDENED       7 pcs + 2 MK II  100   the STRONGPOINT with both turrets upgraded to MK II (they need a tier I network)
 16 FULL KIT       17 pcs 170  tier III   what autoplay builds now: pod of six, Ultra, a formation, two supports. The ceiling: nothing bigger exists.
```

14 to 16 reuse the layouts above (their maps are the union of the kits they contain, positions unchanged).

## 4. How the player uses them (build menu, new KITS tab)

- A fifth tab, **KITS**, next to TURRETS / WAVE / POWER / MODULES. Sixteen cards, grouped POWER / DEFENCE / CONTROL / COMBINED, each with a mini-map of the lane (the same drawing as above, in colour), its piece count, its price and the tier it reaches.
- Tap a card: the view zooms out as any tool does and a **ghost of the whole kit** follows the pointer, each piece green or red (and why, using the existing reasons: no room, no power, needs a nest within 6). The chip at the bottom has the kit's element slots (NET, FORM) as switches, like the battery switches today.
- **SNAP TO NEST** puts the ghost on the held nest of the zone you are in; one tap builds everything that is missing (the cost is charged per piece, nothing is built that cannot be afforded: it stops and says how many more shards it needs). Tapping the ground instead places it where you point.
- Pieces that already exist are skipped, so placing a bigger kit on a smaller one **upgrades** it; a card shows what a placement would add ("+4 pieces, 40").
- In the ZONES tab a zone card gets **BUILD KIT**: it queues the kit as build orders for that zone's ant builders (the system already built), so you can equip a zone you are not standing in.

## 5. How auto uses them

Today autoplay's plan at each held nest is hard-coded (about 17 structures). It becomes: **pick a kit, build its missing pieces, one per think, and stop.** The pick is a ladder, so a zone gets no more than it needs:

1. A zone that is cleared and quiet gets **SKELETON**, then OUTPOST once shards allow.
2. A zone that is the front (the next target) or under raids gets a guns kit: STRONGPOINT, then ULTRA NEAR or CROSSFIRE.
3. With a tier II bank and an unlocked formation element it adds a control kit (TRAP at the front, HOME GUARD where raids come from the side, CHOKE at the entrance).
4. Only deep zones with spare shards reach SIEGE and FULL KIT. MK II (HARDENED) is the last step, only with shards over the spare floor.
5. The elements come from what the squad is (network element = the commonest unlocked element, formation element = the first unlocked one that forms), as now.

The chosen kit is remembered per zone and shown on the zone card ("STRONGPOINT, 5 of 7"), so what auto is doing is visible.

## 6. Making sure they make sense

- `js/kits.js` holds the 16 kits as data and the validator (R1 to R7).
- `tests/kits.js`:
  - the rules on all 16 (counts, no loose pieces, budget, fits the lane);
  - every kit built in the real game world for each element: the network tier is the target, every piece is powered, an Ultra fuses, a formation forms, nothing is left dark;
  - superset chains (SKELETON inside OUTPOST inside STRONGPOINT inside BASTION, and so on): the delta of an upgrade is exactly the added pieces;
  - the placement search finds a spot or says why (mirrored, shifted, partly blocked by a nest or a wreck);
  - the KITS tab cards and ghost; auto picks the right kit for a quiet zone, a front zone, a raided zone, and does not exceed it.
- Mutation checks on the validator (an extra battery, a loose wave pylon, a dark piece must each fail).

## 7. Build order

1. Kit data and validator, with all tests above except the UI ones.
2. Placement engine (anchor, mirror, shift, delta) and the KITS tab with the ghost.
3. Autoplay on kits.
4. ZONES tab: kit chip and BUILD KIT.

## 8. Decisions I need

1. **Size.** Keep every kit small (the ceiling is FULL KIT at 17 pieces, which is what autoplay builds today), or make the top end smaller?
2. **Placing.** Ghost you place anywhere, snap-to-nest one tap, or both (recommended)?
3. **Variants.** I read "16 variants" as 16 layouts, each usable with any element (so 16 x elements). If you meant 16 per element, or 4 families of 4 variants, say so.
4. **Auto.** Pick the kit by the ladder above, or let you set a preferred kit per zone (auto then only builds that)?
