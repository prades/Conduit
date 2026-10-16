# The Technician — deployables

**The role.** The post-holding role (id `camper`, shown as TECHNICIAN; assigned
from high DEF or WILL) stops being "stand at a pylon and swing at what comes
close". A technician is the hands-on one: *you* order it to a tile, it builds
a small element **device** there, and the device does one tactical job for a
short while. Where you put it, and when, is the skill. At rest it still
anchors to its pylon and fights within 2.5 tiles (`CAMPER_ENGAGE_RADIUS`), so
a technician you are not commanding is no worse than a camper was.

All numbers are starting values, kept as named constants so tuning is a
one-line change. Nothing here is built yet; this is the plan.

---

## 1. The loop

1. Select technicians (the follower index's TECHNICIANS row, or tap one) and
   tap a free floor tile. The command menu gets **DEPLOY**, next to MOVE, JOB
   and BUILD. It only shows for a pool that has a technician in it.
2. Each selected technician (up to `DEPLOY_MAX_CREW` = 3) is sent a
   `deploy` job: `a.job = { type: "deploy", target: tile, kind, buildTime }`,
   the same machinery as `build_pylon` (js/commands.js `_executeBuild`).
   Which device is its **element's** (§3); a pool of mixed elements deploys one
   of each, on neighbouring tiles.
3. It walks there and **kneels** to build for `DEPLOY_BUILD_FRAMES` (150, 2.5
   s). While it builds it does not fight back and does not move: it is the
   exposed part. A half-built device is drawn as a ghost with a progress ring.
   If the technician dies or is pulled off, the build is lost and the shards
   are not refunded.
4. The device goes up, costs shards (§2), and starts working.

**Where it may be built.** Any free floor tile in a zone that has a
**generator** (`zoneGenerated(t)`): devices are tech, and all tech on a zone
needs its generator (js/power.js). Not on a tile with a pylon, module, nest,
another device or an ice block, and not within `DEPLOY_NEST_GAP` (2.5) tiles of
an enemy nest.

**Caps.** `DEVICE_CAP_PER_TECH` = 2 live devices per technician; building a
third dismantles its oldest. `DEVICE_CAP_TOTAL` = 12 on the map (the oldest
overall goes first). Devices are **short-lived and not saved**: a night is at
most a few minutes, and a reload clears them (like formations, they come from
the state of the world, and this one is not part of it).

## 2. Rules every device shares

| Constant | Value | Meaning |
|---|---|---|
| `DEPLOY_COST` | per device (§3) | shards, paid when the build **starts** |
| `DEPLOY_BUILD_FRAMES` | 150 | kneeling time; × `EVOLVED_BUILD_MULT` (0.6) if evolved |
| `DEVICE_HP` | 60 × `levelFactor(L)` | what predators have to chew through |
| `DEVICE_LIFE` | per device | frames before it dismantles itself |
| `DEVICE_POWER` | the builder's `power` | damage scales with the technician (level, evolution ×1.25) |

**Enemies and devices.** Devices are *obstacles and targets of opportunity*, not
bait: a predator attacks one only when it is within `DEVICE_BITE_RANGE` (0.9)
of it on its way, never diverts the whole lane to chase it. A device that is
hit takes the predator's `power` per blow every `FW_HIT_EVERY` (45) frames,
the same cadence the Force Wall uses. Bosses and beetles resist the *control*
effects (§3) the way they already resist `vortexPullImmune` pulls.

**Combos.** A device is an element source. When one **triggers** within
`COMBO_REACH` (3) tiles of an awake support or disruption pylon of a
*different* element, it also runs that pair's `foe` effect from
`ELEMENT_COMBOS` (js/config.js) over its own radius for `COMBO_FRAMES` (90).
A flame trap beside an ice pylon steams, a tesla coil beside a toxic pylon
corrodes. Same machinery as pylon combos, so no new effects are needed, and
laying devices to complete a combo is the layout puzzle.

**Not a formation.** Formations (js/formations.js: black hole, spinning
firewall, ice generator, toxic tower, shield forge) are *permanent* base
structures that need four pylons. Devices are portable and temporary: a trap
you set for this fight. Where they overlap in element, a device is smaller and
shorter-lived on purpose.

## 3. The six devices

### FIRE — FLAME TRAP *(cost 14, life 3600 = 60 s)*
A flat dark plate with glowing vents, sunk flush with the floor.
- **Armed** once built. **Triggers** when an enemy is within 0.7 tiles.
- **Burst:** every enemy within `TRAP_RADIUS` (1.4) takes 1.5 × power in fire
  damage and burns for 180 frames (`burning`, `burnDamage` = 10% of power).
- **3 charges**, `TRAP_REARM` (90) frames between bursts.
- Beetles and bosses take half. Not triggered by your own side.
- *Why it is fun:* set it on the chokepoint just ahead of your line; three
  bursts as a pack walks over it. Cheap, so you re-lay it.
- **Evolution upgrade:** fire technicians' device becomes the **FLAME TOWER**
  (a standing column that fires embers at range 3.5, 6 shots), with its own look.

### ICE — FREEZE MINE *(cost 12, life 5400 = 90 s)*
A dim frost ring on the floor, hard to see (enemies do not avoid it).
- **Triggers** on the first enemy within 0.8 tiles.
- **Freeze:** every enemy within `MINE_RADIUS` (1.8) is stunned `MINE_STUN`
  (90 frames, `hitStun`) and slowed ×0.5 for 120 more (`applySlow`). Beetles
  and bosses are only slowed. **One use**; the mine is spent.
- Its ring is drawn on the floor tile by tile like the frost (`drawFrostOnTile`)
  so it lies under units.
- *Why:* the answer to a fast scout pack or a sniping spider: set it on their
  path, then punish the stun. Reward is the ambush.
- **Evolution upgrade:** two charges, and it leaves a patch of frost that slows.

### ELECTRIC — TESLA COIL *(cost 18, life 1500 = 25 s)*
A tall dark coil on a hex foot, a bright ring at the tip.
- Every `COIL_EVERY` (60) frames it zaps the nearest enemy within `COIL_RANGE`
  (3.2): 1.0 × power, **chaining** to 2 more within 2.2 tiles at 60%
  (the Reaver's arc, `arcVolley` in js/evolution.js).
- **14 zaps**, then it burns out (or at end of life).
- *Why:* the only device that fights *back at range*; the price is a short
  life, so you time it to land where the fight is about to be.
- **Evolution upgrade:** 20 zaps, chains 3, and it stuns its first target.

### FLUX — SNARE WELL *(cost 16, life 2400 = 40 s)*
A small dark disc with a lens of warped floor over it (the same distortion
language as the flux evolutions, kept subtle).
- **Triggers** on the first enemy within 2.0 tiles. **Open** for
  `WELL_OPEN` (240 frames): everything within `WELL_RADIUS` (2.6) is dragged
  0.06 tiles a frame toward the centre (not what `vortexPullImmune` says is
  too heavy) and slowed ×0.5.
- **Collapse:** when it closes, whoever is still inside takes
  1.2 × power. One use.
- *Why:* it bunches a pack so a fire pylon, a coil or your brawlers hit them
  all. It is *set-up*, and the payoff is the player's own follow-up.
- **Evolution upgrade:** open 360 frames, ticks damage while open, collapse 1.6×.

### CORE — BULWARK *(cost 20, life none: it stands until broken)*
A hex-plated black block on the floor, glowing trim.
- **Solid:** a one-tile barricade; predators **cannot cross or walk through
  it** and stop to break it (the Force Wall's rule, `FW_GAP`). **Your own units
  walk through.** HP `BULWARK_HP` (150 × `levelFactor`).
- **Shield cells** (js/shieldcells.js) mend it: a technician beside it spends
  one cell for `FW_CELL_HP` (100) HP, so the shield economy feeds a physical
  wall. Without cells it only has its HP.
- Cap **1** per technician (it is the big one): a second dismantles the first.
- *Why:* it shapes where enemies go. The wall splits a pack, funnels them
  into a trap or turret, or buys a pylon time.
- **Evolution upgrade:** HP × 1.6, and it reflects 20% of what hits it.

### TOXIC — ACID SPRAYER *(cost 15, life 1800 = 30 s)*
A squat black nozzle on a drum, a faint green mist.
- **Triggers** the moment an enemy is within `SPRAY_RADIUS` (2.4); then runs
  for `SPRAY_FRAMES` (600 = 10 s): every enemy inside is poisoned
  (4% of power per 30 frames) and has its armour eaten (`defenseShredded`,
  factor 0.6, refreshed each tick).
- One run; it is spent after. The area stays hazed (painted per tile).
- *Why:* the setup for armour-heavy enemies: spray, then hit them with
  everything. Pairs with the Caldera's `ERUPTION` armour shred.
- **Evolution upgrade:** two runs, and the haze slows.

## 4. What the evolutions add

An evolved technician does **not** get a new device: it gets an **upgraded**
one (the "Evolution upgrade" under each device above), builds in
`EVOLVED_BUILD_MULT` (0.6) of the time, and keeps its signature look. Each
evolution is designed when we get to it, with the device in mind (a fire
technician that builds a flame tower should look like it carries one).

## 5. Interface

- **DEPLOY** is a command-menu entry (js/commands.js `executeCommand`), with a
  one-line tooltip per device that says what it does, what it costs, and how
  long it lasts. It greys out with the reason: "NO GENERATOR" (the zone),
  "NO SHARDS", "TILE TAKEN", "TOO CLOSE TO A NEST".
- Devices on the floor show a small **charge pip row** (charges left) and a
  thin **life bar**; a half-built one shows the progress ring.
- The follower index's TECHNICIANS row opens a squad menu with a **DEPLOY**
  option that lays one device each on the next free tiles round the target.

## 6. Build plan (after approval)

Shipped one at a time, each with its own test suite and a green full run:

| # | What | Notes |
|---|---|---|
| 1 | The system: `deploy` job, device store, caps, the build/kneel state, the combo hook, drawing, the DEPLOY command and its refusals | No devices yet but a stub; tests for the loop |
| 2 | Fire + core: FLAME TRAP and BULWARK | One damage device, one obstacle: enough to feel the loop |
| 3 | Ice + flux: FREEZE MINE and SNARE WELL | The two control devices |
| 4 | Electric + toxic: TESLA COIL and ACID SPRAYER | The two ranged/area devices |
| 5 | The evolution upgrades | Land with each technician evolution's art |

## 7. Open questions

1. **Cost vs reward.** The costs are cheap on purpose (a pylon is 10 shards,
   `PYLON_BUILD_COST`; these are 12 to 20). Is cheaper better so devices are
   spammed, or dearer so each one is a decision?
2. **Do devices need a generator in the zone?** Written yes, for consistency
   with "all tech needs one". A zone without one would leave technicians
   unable to deploy there.
3. **Saved or not.** Written *not saved*. Say so if a reload should keep them.
