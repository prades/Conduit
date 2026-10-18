# Zone equipment layouts: 16 kits

Asked: *"layouts for different equipment systems, that don't exaggerate unnecessary equipment. Plan a way to make 16 different variants of zone equipment layouts that make sense, used by the auto and available as build kits in the build menu in a separate tab."*

**Status: built, then reworked for the wall power unit (build 2026-10-18y): the kits build NO batteries.** The batteries are the power unit in each zone's back wall (js/wallunit.js, docs/WALL-GRID.md); a kit names the unit tier it needs (`target.tier`), builds, and what needs the tier goes live when the unit is booted and upgraded (by hand, or by autoplay). Because the bank no longer links the pieces, kits that reach the front are fed by a connector (the relay kits: RELAY LINE, ULTRA FRONT, TRAP, CHOKE), and the lane guns sit within link range of the generator. Below, the rules and the kit list are as they are now; where the sections after the kit list still say 'battery' or give old piece counts, the kit list and js/kits.js are right. js/kits.js (the sixteen kits, the rules, the placement engine), js/kitui.js and the KITS tab in the build menu (js/buildmenu.js), autoplay on the ladder (js/autoplay.js), and BUILD A LAYOUT KIT in the ZONES tab's order picker (js/zones.js). Tests: tests/kits.js (every kit built in the real game and measured), tests/kitui.js, tests/autoplay.js, tests/zonecrew.js.

Decisions made: both the ghost and SNAP TO NEST; auto uses the ladder; 16 layouts each usable with any element it takes; no fixed size cap (the largest kit, FULL KIT, is 17 pieces because that is everything a zone needs, not because of a cap). Changes found while building: a kit must stay inside one zone (a piece across the line has no generator), so wide kits shift back from the nest; a zone has exactly one generator, so a kit aligns onto an existing one; FULL KIT includes the two lane guns so it is a superset of STRONGPOINT and BASTION.

## 1. What a kit is

A **kit** is a small, fixed pattern of equipment for one zone, written once as data and used three ways: placed by the player (a KITS tab in the build menu), placed by autoplay, and queued as build orders for a crew (the ZONES tab).

- Coordinates are **(dx, dy) from the zone's held nest**: dx runs toward the front (the next zone, where the enemy comes from), dy is the lane row 0..3. A kit can be mirrored if the nest has room on only one side.
- Each piece names a **kind** and an **element slot**, not an element: `G` generator, `C` connector, `T` turret, `W` wave pylon, `S` support pylon. Slots are `NET` (the zone's network element: batteries and turrets), `FORM` (the formation element) and `AUX` (support). So one layout covers every element: 16 layouts x the unlocked elements is the real number of variants.
- A kit has a **target** (the tier its battery bank reaches, whether an Ultra or a formation forms) and a **budget** (pieces and shards).

## 2. The rules that stop it exaggerating

These are checked by a validator (and a test) on every kit, so a new kit cannot cheat:

| Rule | Meaning |
|---|---|
| R1 | A kit builds no batteries (the wall's power unit is the bank) and names a target tier, 1 to 3. |
| R2 | Every turret has a job: a lane gun, or one of the four turrets of an Ultra square. At most 4 free turrets, plus an Ultra's 4. |
| R3 | A wave pylon exists only as one of the 4 of a formation square, or as one of at most 2 supports. Never loose. |
| R4 | One generator per zone. A connector only in the kit whose point is reach (RELAY LINE). |
| R5 | Every piece is **powered and linked**: the graph of pieces is connected under the real link rules (3.05 tiles between pylons, a generator within 6 of a nest, a connector feeds 14). A kit that leaves a piece dark fails. |
| R6 | The target is asked for, not paid for: an Ultra and a formation need unit tier II, MK II tier I. The kit builds; the unit tier is the player's (or autoplay's) to boot and upgrade. |
| R7 | The layout fits the 4-row lane (10 columns) with a way through left open in every column. There is no piece cap: the rules above are what keep it honest. |

## 3. The 16 kits

Legend on the 4-row lane, nest on the left, dx 0 at the nest: `G` generator, `C` connector, `T` turret, `W` wave pylon, `S` support, `.` empty. Each kit is a superset of the smaller one it grows from (SKELETON in OUTPOST in STRONGPOINT in BASTION; STRONGPOINT in ULTRA NEAR in SIEGE; STRONGPOINT in HARDENED and FULL KIT), so a zone is upgraded by adding the difference.

```
SKELETON  1 pcs  10  tier I   Power only: just the generator. For a cleared zone with nothing to defend; boot the power unit in the wall and it holds the zone.
y0 .
y1 G
y2 .
```

```
OUTPOST  3 pcs  30  tier I   The minimum that fights back: a generator and two guns, on a tier I power unit.
y0 . . . .
y1 G . . .
y2 . . T T
```

```
STRONGPOINT  4 pcs  40  tier II   Three guns on a tier II power unit: MK II turrets and formations become possible.
y0 . . . .
y1 G . . .
y2 . . T T
y3 . . . T
```

```
BASTION  5 pcs  50  tier III   Four guns on a tier III power unit: the strongest network, over the widest area.
y0 . . . . .
y1 G . . . .
y2 . . T T T
y3 . . . T .
```

```
RELAY LINE  5 pcs  50  tier I   A connector by the nest feeds a forward post of three guns with no chain of pylons between.
y0 . . . . . . . . T .
y1 G C . . . . . . T .
y2 . . . . . . . . T .
```

```
GUN LINE  5 pcs  50  tier I   Four guns in a diagonal line across the lane: even fire, and a way through left open.
y0 . . . . T .
y1 G . . T . .
y2 . . . . T .
y3 . . . . . T
```

```
CROSSFIRE  5 pcs  50  tier I   Guns staggered on the outer rows: they cover the walls and leave the lane open.
y0 . . T . T .
y1 G . . . . .
y2 . . . . . .
y3 . . T . T .
```

```
ULTRA NEAR  5 pcs  50  tier II   The STRONGPOINT with one more gun: a 2x2 that fuses into an Ultra turret, close to the nest.
y0 . . . .
y1 G . . .
y2 . . T T
y3 . . T T
```

```
ULTRA FRONT  6 pcs  60  tier II   The same Ultra at the zone's entrance, fed by a connector so it still fuses.
y0 . . . . . . . . .
y1 G C . . . . . T T
y2 . . . . . . . T T
```

```
TRAP  6 pcs  60  tier II   A formation mid-lane (black hole, firewall, ice generator, toxic tower, shield forge), fed by a connector: it catches what walks through.
y0 . . . . . . .
y1 G C . . . W W
y2 . . . . . W W
```

```
CHOKE  6 pcs  60  tier II   A formation at the entrance, fed by a connector: it stops them before the guns.
y0 . . . . . . . . .
y1 G C . . . . . W W
y2 . . . . . . . W W
```

```
HOME GUARD  5 pcs  50  tier II   A formation beside the generator, for a zone raided from the side.
y0 . . . .
y1 G . W W
y2 . . W W
```

```
SUPPORT NET  5 pcs  50  tier I   Two guns and two support pylons (haste or shields) that work on the squad standing in the lane.
y0 . . S .
y1 G . T .
y2 . . S T
```

```
SIEGE  7 pcs  70  tier II   An Ultra and two more guns forward of it, for a zone attacked every night.
y0 . . . . . . .
y1 G . . . . . T
y2 . . T T . T .
y3 . . T T . . .
```

```
HARDENED  4 pcs  85  tier II (MK II)   The STRONGPOINT with all three guns upgraded to MK II.
y0 . . . .
y1 G . . .
y2 . . T T
y3 . . . T
```

```
FULL KIT  13 pcs  130  tier III   The most a zone needs: four lane guns, an Ultra and a formation, with a way through left open; on a tier III power unit.
y0 . . . . . T T . .
y1 G . . . . T T . .
y2 . . T T T . . W W
y3 . . . T . . . W W
```

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

## 8. Decisions (answered)

1. **Size.** Keep every kit small (the ceiling is FULL KIT at 17 pieces, which is what autoplay builds today), or make the top end smaller?
2. **Placing.** Ghost you place anywhere, snap-to-nest one tap, or both (recommended)?
3. **Variants.** I read "16 variants" as 16 layouts, each usable with any element (so 16 x elements). If you meant 16 per element, or 4 families of 4 variants, say so.
4. **Auto.** Pick the kit by the ladder above, or let you set a preferred kit per zone (auto then only builds that)?
