# The Mutator: the lash and the one clone

ASKED (the brief, "Player Classes" and "Mutator Clone System"):

> *Mutator: melee-focused summoner and biological specialist. Fights alongside a single primary cloned creature. Uses DNA to create clones, purchase clone upgrades, and craft healing serums.*
> *The Mutator can create a clone based on the enemy species encountered in the game. Clones should use the established designs and characteristics of their corresponding enemy species. The Mutator normally has only one active primary clone. [...] If the clone dies, its accumulated upgrades are lost and a replacement must be created.*

This page is the brief's step 4, *"the Mutator's basic melee combat and single-clone lifecycle"*. Steps 5 to 7 (DNA costs and upgrades, the Ice Mage's specimen recovery, the healing serum) build on it and are listed at the end.

## 1. What was already there

| System | Where | State before step 4 |
|---|---|---|
| The Mutator class | `CLASSES.mutator` (js/classes.js) | a row: the `bio` skill, a mutagen sample to start, the lab coat (put on in the Experiment Lab) and the sequencer's perk. No weapon of its own: it fired the service gun like everyone. |
| The Clone Bay | js/clone.js (`getCloneOptions`, `executeClone`, `makeClone`) | **any class** grew up to `MAX_CLONES` (4) clones for crystals and DNA splices; a clone that fell came back at the Crystal after 20 seconds. |
| DNA | `dnaInventory` (js/clone.js), `onPredatorDeath` (js/drops.js) | a kill drops its species' and class's splices; saved with the facility. |
| How a clone fought | js/npc.js (the followers' AI) | **a bug**: a clone has no element and no stats, so every hit it landed was a follower's plain swing, `stats.attack (5) × 0.25 = 1.25`, whatever its power. Measured: an ant-scout clone (power 72) brought an ant scout down by 18 health in 600 frames while the ant bit it for 18 a time. Its species' special and its striker's shot were never given to it (`makeClone` built it without them). |
| A dismissed clone | `dismissOldestClone` (js/clone.js) | **a bug**: it was queued to come back like a fallen one, and filled the slot DISMISS had freed 20 seconds later. |
| The player's attack | js/targeting.js, js/gunfire.js, js/input.js `firePlayerShot` | the dial at the top left and a tap on the locked creature fire the gun in hand (`WEAPONS`, js/weapons.js). |

## 2. What step 4 built

### 2.1 A clone fights as the creature it is (every clone)

`cloneFight` and `cloneTick` (js/clone.js), called by the followers' AI for a clone (js/npc.js):

- **Its bite, in the creature's two beats** (docs/COMBAT.md): it closes to its reach, **rears back** under the same telegraph as a creature (the ring and the word BITE over it, in your side's teal), then the bite lands for its power. A creature roots itself to rear back; a clone **keeps after a target that walks on** while it rears, because the creatures it goes for are often walking to the Crystal (rooted, it missed every bite at one). A target faster than the clone still gets away and the bite misses.
- **Its species' special** (js/abilities.js): a scout's LEAP away when it is badly hurt, an ant striker's MANDIBLE FRENZY, a beetle's CARAPACE SLAM, a scorpion's VENOM LANCE, a spider's WEB SNARE, a mantis's BLADE FLURRY, a moth's BLINDING DUST. It hurts the creatures only.
- **Its striker's or tank's shot from the rear** (js/predator.js `_abdomenTick`, pulled out of the creature's update so a clone can use it): it hits the creatures, never your side and never a recruit walking to the Crystal.
- While it is told to RETREAT it starts neither a special nor a shot.

**The clone's power multiplier** (`CLONE_POWER_MULT`, js/config.js) was 4. It had never been felt in play (the bug above), and at 4 a clone killed a creature of its own kind and level in one bite. It is **1.5** now, a tentative knob. The same fights at each value (one clone against one creature, nothing else alive; measured in the test sandbox):

| Fight | ×4 | ×2 | **×1.5** |
|---|---|---|---|
| ant scout clone vs ant scout, same level | 1 bite, the clone untouched | 2 bites, clone at 93% | **3 bites, clone at 86%** |
| ant scout clone vs beetle scout L4 (it reflects bites) | clone wins at 14% | both fall | both fall |
| ant scout clone vs spider striker L4 | the clone falls | the clone falls | the clone falls |
| beetle striker clone vs mantis striker L4 | 3 bites | 5 bites | 6 bites, clone at 91% |
| ant striker clone vs ant striker L8 | 2 bites | 3 bites | 4 bites (and its MANDIBLE FRENZY), clone at 81% |
| spider scout clone vs moth tank L4 | clone wins at 67% | the clone falls | the clone falls |

A fresh clone beats its own kind and level in a fight you can read (several bites each way) and loses to the bigger classes alone. That leaves the brief's upgrades (step 5) something to do: *"invest in that clone over time, developing it into a powerful super soldier."* Health stays at ×4 (`CLONE_HEALTH_MULT`, an earlier ask).

### 2.2 Cloning is the Mutator's

`CLASS_RULES.clone` (js/classes.js) is the rule, as data: `{ skill: "bio", max: 1, primary: true }`.

- The class with the skill (the Mutator) grows clones, **one at a time**, and its clone is its **primary** clone.
- Anyone else opens the Clone Bay and is told who can: *ONLY A MUTATOR GROWS CLONES* (with no class yet, *CLASSES COME AFTER THE TUTORIAL*). A card's button says *MUTATOR ONLY*.
- With its clone out, a second is refused: *ONE CLONE AT A TIME, DISMISS YOURS FIRST*.
- **The old rule is one edit away:** with no `skill` in the rule every class clones again, up to `MAX_CLONES`, and those clones come back at the Crystal as before (tests/mutator.js checks that this still works).

### 2.3 The one clone's life (js/mutator.js)

- **Grown** at the Clone Bay like every clone (`makeClone`), at the Crystal; the player is told *YOUR CLONE: ANT SCOUT, IT FOLLOWS YOU*. `mutatorClone()` finds it.
- **It follows** the Mutator and **takes the squad's orders**: the battle tool's default pool includes it (js/helpers.js `getCommandPool`), so HOLD holds it where it stands, COME brings it back, RETREAT pulls it out of a fight (js/mixtool.js), and the enemy card's ATTACK sends it. This is the brief's counterplay: *"protect it through positioning, tactical decisions"*.
- **It does not come back by itself.** When it falls, DEFEATED is said over it, nothing is queued at the Crystal, and its **body** stays where it fell: the creature's own drawing, dimmed and still, on a dashed ring in the Mutator's purple, with a plate (*ANT SCOUT CLONE · FALLEN*). The player is told *YOUR ANT SCOUT CLONE HAS FALLEN / IT DOES NOT COME BACK, GROW A NEW ONE AT THE CLONE BAY*, and the bay can grow a new one at once.
- **A dismissed clone** (DISMISS in the bay) never comes back and leaves no body. This also fixes the bug for every clone.
- **The save** keeps the primary clone as primary (`pr` in the clone record) and every body where it lies (`bodies`, js/facilitysave.js); NEW GAME clears them.

What the body is *for* is the next two steps: the DNA the player can recover from it (step 5) and the Ice Mage's preservation and the capsule (step 6). Until then it lies there (`MUTATOR.body.life` is 0: it stays until it is dealt with).

### 2.4 The lash: the Mutator's melee

`WEAPONS.lash` (js/weapons.js), the **TENTACLE LASH**, is the Mutator's own weapon (`cls: "mutator"`). It goes in the Mutator's hand when the class is chosen (`CLASSES.mutator.weapon`). It is aimed exactly as the gun is, through the same targeting (no second input system):

- **The dial** at the top left, or **a tap on the locked creature**: a creature in reach is struck; one out of reach is **walked to** (straight to a spot in reach when it can be seen, round the walls by the route when not), and struck once it is in reach. One click is one strike; **holding** keeps striking.
- **Two beats**, like a creature's bite: the tentacle **draws back** for `MUTATOR.lash.windup` frames (a curl behind the player and a ring closing on the creature), then the **lash** lands: a whip drawn from the player to the creature, a flash, and the number over it. The player turns to face it.
- A creature that **slips out of reach** during the wind-up is missed (*MISS*, no damage).
- It **spends nothing**: the small icon by the dial shows a tentacle and *MELEE*, and the dial's badge is a tentacle instead of a pistol.
- **A tap on the floor** calls the attack off and walks there; **stowing** the weapon does too.
- The Mutator can still take the service gun or the laser rifle at the Armory terminal (EQUIP), and take the lash back the same way. The terminal now lists each class its own: the Mutator sees the lash and not the Gunslinger's machine gun, the Gunslinger the machine gun and not the lash; with no class it lists what it did before.
- A Mutator's game saved before the lash existed comes back with the lash in hand (`weaponSnapshot().cw`); one saved after keeps whatever was in hand.
- No new sprite: the player's sheets are unchanged (the brief: *"Do not redesign established character or enemy appearances"*); the lash is drawn over the scene.

The other classes' attacks are unchanged (a Gunslinger's click fires a round as before).

### 2.5 DNA, upgrades, death, recovery (the brief's step 5)

**What a clone costs.** Growing one takes its species' splices (`CLONE_COSTS[species].splicesNeeded`, js/species.js) and crystals (`cloneShardCost`), as before. A clone of a class takes the splices of that species *and class*, so in kills of that class (with the splices each class drops, `dnaDrops`):

| Species | Splices | A scout clone | A striker clone | A tank clone |
|---|---|---|---|---|
| ant | 3 | 3 | 3 | 1.5 |
| beetle | 5 | 5 | 2.5 | 2.5 |
| mantis | 8 | 4 | 2.7 | 2.7 |
| scorpion | 8 | 4 | 2.7 | 2.7 |
| spider | 10 | 3.3 | 3.3 | 2.5 |
| moth | 12 | 4 | 3 | 3 |

The brief's tentative target is *"DNA equivalent to roughly two or three enemy kills"*. The table is close for the stronger classes and above it for scouts. It is left as it was, because the brief says not to finalise tentative costs; `CLONE_COSTS` is the one place to change it.

**Upgrades** (`CLONE_UPGRADES`, js/mutator.js: a table; a new row is a new upgrade, and a test adds one at run time to prove nothing else has to change):

| Upgrade | Ranks | DNA per rank | Each rank |
|---|---|---|---|
| ARMOR PLATING | 3 | 4, 7, 10 | +25% health |
| SERRATED ARMS | 3 | 4, 7, 10 | +25% power (its bite, special and shot) |
| POUNCE | 2 | 5, 8 | a jumping attack: it crouches (POUNCE! over it), leaps in an arc onto a creature beyond its reach and up to 2.5 tiles further a rank, and bites as it lands (×1.2 its power), then rests 5 s. A scout's escape leap goes 2.5 tiles further too (*"a longer leap or jumping attack"*). |
| LONG REACH | 2 | 4, 7 | +0.35 tiles to its bite's reach (*"increased attack radius"*) |

- They are bought at the **Clone Bay**: with the Mutator's clone out, the bay is that clone's panel (its picture, level, health, bite, reach and pounce, the DNA you have), a row for each upgrade (what it does, its ranks, the next rank's DNA, BUY), and at the foot what is at stake.
- An upgrade costs **any DNA**: `dnaSpend` takes it from the largest splice stocks first, so the rare ones are kept for growing a clone. Growing one still takes its own species' splices.
- The upgrades last through its level-ups (js/levels.js multiplies its health and power by them at every level) and through a save.

**Death loses them.** When the clone falls, the player is told *ITS 2 UPGRADES ARE LOST*. Its body keeps what it had and what it cost (`invested`: the splices it was grown from plus the DNA its upgrades took). The next clone starts with none.

**Part of the DNA comes back** (`MUTATOR.dna.recover`, 40%):
- **SALVAGE DNA**: a long press on the body opens its ring; UP is *SALVAGE DNA +n*. Near the body (`MUTATOR.body.reach`, 2.2 tiles) it is done at once. From further off the player walks there first, and a tap elsewhere calls it off. The DNA comes back as the clone's own species' and class's splices, and the body is gone. Its plate says how much it would give.
- **RELEASE** at the Clone Bay (two taps: the first asks *SURE? TAP AGAIN*) gives back the same share and leaves no body (`MUTATOR.dna.releaseRecovers`). Without it, letting the clone die would pay better than letting it go.
- 40% is less than all of it, so *"rebuilding repeatedly from scratch should leave the player less effective than successfully maintaining and upgrading a clone"*. A test checks the salvage is less than the investment.

**One predator against one upgraded clone** (the brief's test), measured in the arena, face to face:

| Clone | vs mantis tank L4 | vs spider tank L4 |
|---|---|---|
| ant striker, fresh (level 5) | the clone falls (or wins with a fifth of its health left) | the clone falls |
| ant striker, ARMOR 3 + SERRATED 3 (level 5) | wins with 54% left | wins with 48% left |

Seen while measuring, and not changed: a creature on its way to the Crystal turns only on what bites it. A spider webs a clone that chases it (20% speed for five seconds) and walks on, and once it is more than six tiles off the clone goes back to the Mutator, as every brawler does. The counterplay is the enemy card's ATTACK, which sends the clone after that creature.

### 2.6 The healing serum, the laboratory, and the Mutator's level (the brief's step 7)

ASKED: *"The Mutator can craft healing serums that are splashed onto the ground. Each serum creates an area-of-effect healing zone. Eligible allies within the splash zone receive healing. Healing should be visually readable and clearly communicate which units are being affected."* *"The Mutator has a laboratory where serum becomes available over time. Serum replenishes at configurable 60-second intervals. Higher Mutator levels increase the amount of serum generated automatically. DNA can also be spent whenever the player crafts a serum. The automatic supply and DNA crafting systems should work together."* Code: js/serum.js; tests: tests/serum.js.

**The serum** is an item of the pack, HEALING SERUM (stack 5). Only the Mutator uses it; anyone may carry it.
- It is used from the pack, from the **SERUM pill** beside the weapon's by the dial (it shows how many), or with **Q**.
- It is **splashed where the Mutator stands**: a green pool on the floor, `SERUM.splash.radius` (2.6 tiles) wide, for `SERUM.splash.frames` (5 s).
- Every **ally** in it (a follower or a clone of yours) is healed `SERUM.splash.pct` (6%) of its max health every `SERUM.splash.every` frames (0.5 s): about 60% over the pool's life.
- **Readable:** the pool is painted on the floor tiles it covers, with bubbles; every ally it is healing wears a pulsing green ring and a rising "+"; each heal floats a green "+n" over the unit (js/combat.js `healUnit`).
- Creatures in it are not healed. The player is not either (the player has three hits, not health).

**The laboratory** is the Experiment Lab's fume hood: the **SERUM HOOD**, a Mutator's station (js/stations.js, `F.stations` in js/facilitymap.js on the existing `lab_hood` prop).
- While the player is a Mutator, every `SERUM.lab.every` frames (60 s) it makes `base + perLevel × (Mutator level − 1)` serums (1, plus a quarter a level, the fractions carried to the next round), up to `SERUM.lab.cap` (5) waiting.
- At the hood, **COLLECT** takes what is waiting into the pack, for free.
- With nothing waiting, **CRAFT** makes one now for `SERUM.craft.dna` DNA (5, the brief's tentative figure; any splices). Without the DNA it says how much it takes and when the next free one is ready.
- **They work together:** both fill the same item in the pack; the free supply is slow, DNA buys more; crafting always costs DNA. The formula is exposed, not final: `SERUM.lab` and `SERUM.craft`.

**The Mutator's level.** The player had no level, and the brief asks for *"higher Mutator levels"* and *"a dedicated progression system built around biological experimentation"*. So experiments raise it: every DNA the Mutator spends on biology is a point. That is growing a clone (its splices), buying an upgrade, or crafting a serum.
- The thresholds are `MUTATOR.level.thresholds` (0, 10, 25, 45, 70, 100, 140, 190, 250, 320 for levels 1 to 10).
- A level-up is said (*MUTATOR ▲ LEVEL 2, THE LAB MAKES MORE SERUM*); the Clone Bay's panel shows the level and the points to the next.
- Another class gains none. The points are saved.
- **What the level does today** is the laboratory's yield. Anything else it should unlock is a decision for later; `mutatorLevel()` is the one function to read.

## 3. Tentative: every number is a knob

| Knob | Where | Value | What it does |
|---|---|---|---|
| `CLONE_POWER_MULT` | js/config.js | 1.5 (was 4) | a clone's power over its species' (bite, special, shot) |
| `CLONE_HEALTH_MULT` | js/config.js | 4 | a clone's health over its species' |
| `CLASS_RULES.clone` | js/classes.js | `{ skill: "bio", max: 1, primary: true }` | who clones, how many at once, whether the clone stays fallen |
| `WEAPONS.lash` | js/weapons.js | damage 18, cooldown 34, reach 1.45 tiles | the lash's numbers (one strike every 43 frames with the wind-up) |
| `MUTATOR.lash.windup` | js/mutator.js | 9 frames | the lash's first beat |
| `MUTATOR.lash.slack` | js/mutator.js | 0.3 tiles | how far past its reach a creature may slip in the wind-up and still be hit |
| `MUTATOR.body.life` | js/mutator.js | 0 (stays) | how long a fallen clone's body lies |
| `MUTATOR.body.reach` | js/mutator.js | 2.2 tiles | how near the player must be to work on a body |
| `CLONE_COSTS` | js/species.js | 3 to 12 splices | what growing a clone takes (its species' DNA) |
| `CLONE_UPGRADES` | js/mutator.js | the table in 2.5 | each upgrade's ranks, DNA per rank and effect |
| `MUTATOR.dna.recover` | js/mutator.js | 0.4 | the share of what a clone cost that its body or its release gives back |
| `MUTATOR.dna.releaseRecovers` | js/mutator.js | true | whether RELEASE gives that share back too |
| `MUTATOR.pounce` | js/mutator.js | wind-up 14, air 22, ×1.2, rest 300 | the jumping attack |
| `SERUM.splash` | js/serum.js | radius 2.6, 300 frames, every 30, 6% | the healing pool |
| `SERUM.lab` | js/serum.js | every 3600 (60 s), base 1, +0.25 a level, cap 5 | the laboratory's free supply |
| `SERUM.craft.dna` | js/serum.js | 5 | crafting one at the hood |
| `ITEMS.healing_serum.stack` | js/inventory.js | 5 | how many the pack holds |
| `MUTATOR.level.thresholds` | js/mutator.js | 0, 10, 25 ... 320 | the Mutator's levels, in experiment points (DNA spent on biology) |

## 4. Decisions made here (please confirm or change)

1. **Only the Mutator clones.** The brief gives cloning to the Mutator and limits it to one clone; a Gunslinger with four clones would out-summon the summoner. Saves from before keep the clones they have. One line restores the old rule (2.2).
2. **The clone's power is ×1.5**, not ×4 (2.1, with the measured fights).
3. **The Mutator keeps the guns as a choice** at the Armory terminal; the lash is what it starts with.
4. **A clone keeps after its target while it rears back**; a creature stays rooted (its telegraph is the player's warning; a clone's is not a threat to the player).
5. **Upgrades and the serum cost any DNA** (the largest stocks first); growing a clone takes its own species' splices.
6. **RELEASE gives back the same share as a salvaged body.**
7. **"A longer leap or jumping attack" is one upgrade, POUNCE:** a jumping attack for every clone, and a longer escape leap for a scout. **"Increased attack radius" is the bite's reach.**
8. **Salvage is an order on the body's ring** (a long press, the brief's *"holds the interaction input"*), done near it, not automatic at death: the body has to stay for the Ice Mage (step 6).
9. **The serum is splashed where the Mutator stands**, not thrown at a point: the Mutator walks to whoever needs it. A thrown serum is a small change if wanted.
10. **The laboratory is the Experiment Lab's fume hood**, an existing prop made the Mutator's station; its free serum waits there to be collected.
11. **The Mutator's level comes from experiments** (DNA spent on biology). The other way would be the class's existing rank (1 plus one a perk, so 3 at most for the Mutator).
12. **Allies are followers and clones;** the player is not healed by the serum.

## 5. Next (the brief's steps 5 to 7)

- **Step 5: built** (2.5).
- **Step 6: built** (docs/SPECIMENS.md): the Ice Mage freezes a fallen ally's body (the Mutator's clone, or a follower lost for good); the player carries the containment capsule to the Resurrection Zone, the Crystal, where it restores the specimen as it was. A clone's body is salvaged OR preserved.
- **Step 7: built** (2.6).
