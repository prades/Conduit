# The Technomancer: the arc gauntlet, its charge, and the grid

ASKED (the brief, "Player Classes"):

> *Technomancer: hybrid melee and ranged combatant. Uses technological and electrical abilities. Melee combat and ranged electrical attacks should complement one another. Also has a technological relationship with the facility's power network and infrastructure. Implement this class after the Mutator.*

This page covers the brief's step 8, *"Implement the Technomancer's hybrid melee/ranged combat."* Its tutorial stage is step 9 (docs/TUTORIAL.md).

## 1. What was already there

| System | Where | State before step 8 |
|---|---|---|
| The Technomancer class | `CLASSES.technomancer` (js/classes.js) | the `repair` and `tech` skills, a power cell to start, its gear found in the labs and Teleport Room 1. **No weapon of its own:** it fired the service gun like everyone. |
| Its tie to the power network | `CLASS_RULES.relay` (js/classes.js), js/stations.js | it repairs a relay with **one** power cell (anyone else needs the relay kit and two), and the repair **starts by itself** when it stands at a broken relay. The charging station gives it a power cell as well as ammunition. |
| Its perks | `CLASS_PERKS.tuned`, `CLASS_PERKS.mech` | the tuned lamp (Teleport Room 1's console) and the spider mech (the Show Room's mech bay). |
| The power network | js/facilitytutorial.js, js/stations.js | the facility starts in a blackout; a relay online powers its rooms (`_fpPowered`); the blackout is over when every room has power. |
| Melee | js/mutator.js | the Mutator's lash: walked into reach, two beats (a wind-up, then the hit), aimed through the same dial and lock as the gun. |
| A creature's bite | js/predator.js `_biteTick`, docs/COMBAT.md | two beats: the creature rears back for `COMBAT.bite.windup` frames under a telegraph (the ring and BITE), then bites. |

## 2. What step 8 built

### 2.1 The arc gauntlet

`WEAPONS.gauntlet` (js/weapons.js), the **ARC GAUNTLET**, is the Technomancer's own weapon (`cls: "technomancer"`, kind **hybrid**). It goes in the Technomancer's hand when the class is chosen (`CLASSES.technomancer.weapon`). It is aimed exactly as every weapon is (the dial at the top left, a tap on the locked creature, hold to keep going). What a click does depends on where the creature is:

| The creature | The gauntlet's charges | What happens |
|---|---|---|
| in reach (1.4 tiles) | any | **a punch** |
| out of reach, within the arc's range (8 tiles) and in sight | 1 or more | **an arc**, for one charge |
| out of reach | none | the player is **walked in** and punches |
| beyond the arc's range, or round a corner | any | the player is walked in and punches (no charge spent) |

### 2.2 The punch: in reach, and it fills the gauntlet

- The Mutator's melee, shared (js/mutator.js `mutatorLash`, now generic over the melee weapon in hand): a creature out of reach is walked to; the gauntlet **winds up** for `WEAPONS.gauntlet.windup` frames, then lands for its damage. A creature that slips out of reach in the wind-up is missed (*MISS*).
- Its damage is **electric** (the element wheel applies; the number over the creature is electric's yellow; electric hits a shield twice as hard, as every electric hit does).
- **Every punch that lands stores one CHARGE** (`TECHNO.charge.perHit`), up to `TECHNO.charge.max` (6). A miss stores nothing.
- Drawn as a straight jab from the player to the creature, in the Technomancer's cyan, with sparks on a hit (the lash is a curved whip in purple).
- It spends no ammunition and is never dry.

### 2.3 The arc: out of reach, and it spends a charge

`technoArc` (js/technomancer.js):

- **At once**, at the creature, for the punch's damage × `TECHNO.arc.mult` (1.3), raised by the relays online (2.4).
- It **jumps on**: to the nearest creature within `TECHNO.arc.chainRange` (2.6 tiles) of the last one, `TECHNO.arc.chain` (2) times, each for `TECHNO.arc.chainPct` (60%) of the first hit. It only ever jumps to creatures (`isHostileTarget`): never to a follower, a clone, a recruit walking to the Crystal, or the player.
- **It cuts a bite short.** A creature it hits while **rearing back to bite** (the telegraph, docs/COMBAT.md) loses the bite: the wind-up ends, *INTERRUPTED* is said over it, and it cannot rear back again for `TECHNO.arc.stagger` (30) frames. This is the readable counterplay: see the ring and BITE over a creature, throw the arc.
- It spends **one charge** and rests `TECHNO.arc.cooldown` (30) frames. The player does not move.
- Drawn as a jagged, flickering bolt from the player's hand to each creature it hit in turn, fading over `TECHNO.arc.fx` frames (drawing changes nothing in the game: tests/ghost.js).

**How the two complement each other** (the brief's ask): the punches fill the gauntlet and the arcs spend it. The arc opens a fight from range, reaches the creatures behind the first, and stops a bite before it lands; the punch finishes the fight up close and pays for the next arcs. With no charge the gauntlet always closes in, so the Technomancer is never without an attack.

### 2.4 The grid: the facility's power charges the gauntlet

- **In a powered room** (js/facilitytutorial.js `_fpPowered`: a room whose relay is online, or every room once the blackout is over) the gauntlet gains **one charge every `TECHNO.charge.gridEvery` frames** (120, two seconds), up to its most. In a room with no power it gains none. The count starts again when the player walks into power or spends a charge from full.
- **Every relay online makes the arc stronger** by `TECHNO.arc.perRelay` (10% each; with the six relays, 60%).
- The relays are the Technomancer's own work (one power cell, by standing at it), so restoring the network is how the Technomancer grows in a fight: more rooms to recharge in, a stronger arc.

### 2.5 What the player sees

- **The small pill** by the dial: a **bolt** and the charges, *3/6*; *3/6 · GRID* while a powered room is charging it; the bolt flashes white as a charge is stored.
- **The dial's badge** is a bolt (a pistol for a gun, a tentacle for the lash).
- **The Armory terminal's row** for the gauntlet: *PUNCH 14 · 1.7 STRIKES/S · REACH 1.4 · ARC 18.2 FOR A CHARGE*. The Technomancer can still take the service gun or the laser rifle there (EQUIP) and take the gauntlet back the same way; the terminal lists it the gauntlet and not the Gunslinger's machine gun or the Mutator's lash.
- The class picker's blurb and the game index (START, THE CLASSES) say what it does.
- No new sprite: the player's sheets are unchanged (the brief: *"Do not redesign established character or enemy appearances"*); the punch and the arc are drawn over the scene.

### 2.6 The save

The charges in the gauntlet are saved (`tc`, js/facilitysave.js), capped to its most when they come back; NEW GAME empties it.

### 2.7 A fix to the shared melee (the Mutator's lash too)

Letting go of a **held** attack still landed one more strike: the attack kept going until its next strike. Now a hold that has struck stops when it is let go; a strike already winding up still lands, and a single click is still one strike (tests/mutator.js, tests/technomancer.js).

### 2.8 Measured: the gauntlet against one creature

One creature, four tiles off, in the arena (nothing else alive, no squad, the grid off), the dial held on it (measured in the test sandbox; seconds to kill it, and how):

| Creature (its health) | Gauntlet, no charge | Gauntlet, 6 charges | Service gun |
|---|---|---|---|
| ant scout L4 (56) | 2.3 s, 4 punches | 1.5 s, 4 arcs | 3.9 s |
| ant striker L4 (93) | 4.7 s, 8 punches | 2.5 s, 6 arcs | 7.3 s |
| beetle scout L4 (168) | 8.3 s, 14 punches | 6.9 s, 6 arcs + 7 punches | not dead after 60 s (15 left), 1 hit taken |
| spider striker L4 (280) | 13.1 s, 22 punches | 11.7 s, 6 arcs + 15 punches | not dead after 60 s (120 left) |
| mantis tank L4 (299) | 16.7 s, 28 punches | 14.7 s, 6 arcs + 20 punches | not dead after 60 s (119 left), 2 hits taken |
| ant scout L8 (72) | 3.3 s, 5 punches | 1.5 s, 4 arcs | 4.7 s |

The punch is about 23 damage a second (14 every 36 frames), between the lash (25) and the service gun (13); the machine gun is 43. A full gauntlet opens a fight hard.

**Found while measuring, and since changed** (docs/COMBAT.md §4: creatures hunt and bite the player now, and the same fights cost hits; the table above is from before). In melee the player took **no hits**: a creature bites the player only by touching them (`PLAYER_BITE_RANGE`, 0.9 tiles), and a creature that is hit turns on its `lastAttacker`, which for the player's hits is a copy of where the player stood (not the player), and bites at that from its bite reach (1.5 tiles) without stepping in; the gauntlet (1.4) and the lash (1.45) strike from outside the 0.9. So melee cost the Technomancer and the Mutator nothing. Asked to make creatures dangerous, they now turn on whoever hits them and bite in the bite's two beats (dodge by stepping out while one rears back).

## 3. Tentative: every number is a knob

| Knob | Where | Value | What it does |
|---|---|---|---|
| `WEAPONS.gauntlet` | js/weapons.js | damage 14, cooldown 28, reach 1.4, windup 8 | the punch (one every 36 frames, 1.7 a second) |
| `TECHNO.charge.max` | js/technomancer.js | 6 | the most charges the gauntlet holds (`classStat("technoCharge")` lets a perk change it) |
| `TECHNO.charge.perHit` | js/technomancer.js | 1 | charges a punch that lands stores |
| `TECHNO.charge.gridEvery` | js/technomancer.js | 120 frames (0: never) | how often a powered room adds a charge |
| `TECHNO.arc.mult` | js/technomancer.js | 1.3 | the arc's damage over the punch's (18.2 with no relay online) |
| `TECHNO.arc.range` | js/technomancer.js | 8 tiles | how far the arc reaches |
| `TECHNO.arc.cooldown` | js/technomancer.js | 30 frames | the rest after an arc |
| `TECHNO.arc.chain` / `chainRange` / `chainPct` | js/technomancer.js | 2 / 2.6 tiles / 0.6 | how many more creatures it jumps to, how far each jump reaches, how hard they are hit |
| `TECHNO.arc.perRelay` | js/technomancer.js | 0.1 | the share more the arc hits for each relay online |
| `TECHNO.arc.stagger` | js/technomancer.js | 30 frames (0: no interrupt) | how long a bite the arc cuts short keeps the creature from rearing back |

## 4. Decisions made here (please confirm or change)

1. **The gauntlet is a weapon in hand, like the lash**, aimed through the same dial and lock as every weapon: no second input system. The Technomancer keeps the service gun and the laser rifle as a choice at the Armory terminal.
2. **Melee and ranged complement each other through one resource, the charge:** punches store it, arcs spend it. With no charge the gauntlet closes in to punch.
3. **The arc's extra job is to cut a bite short.** It answers the bite telegraph the combat readability work added (docs/COMBAT.md). It does not stun or slow otherwise.
4. **"A technological relationship with the facility's power network" is read as:** a powered room recharges the gauntlet, and every relay online makes the arc stronger. Both are knobs (`gridEvery: 0`, `perRelay: 0` turn them off). The existing ties (repairing a relay with one cell, the auto-start, the charging station's cell) are unchanged.
5. **The arc jumps only to creatures**, never to the player's side or to a recruit walking to the Crystal.
6. **The gauntlet has no scrap levels** (like the lash): the Armory's upgrades are the guns'.

## 5. Not done here

- **Its tutorial stage: built** in step 9 (docs/TUTORIAL.md, "The class stages"): the mech, a relay, three punches, two arcs.
- **Further Technomancer abilities** (deployables, turrets, taking over the facility's systems) were not asked for in these words and are not invented here; the existing mech and tuned lamp perks stay as they were.
