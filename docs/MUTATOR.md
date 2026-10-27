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

## 4. Decisions made here (please confirm or change)

1. **Only the Mutator clones.** The brief gives cloning to the Mutator and limits it to one clone; a Gunslinger with four clones would out-summon the summoner. Saves from before keep the clones they have. One line restores the old rule (2.2).
2. **The clone's power is ×1.5**, not ×4 (2.1, with the measured fights).
3. **The Mutator keeps the guns as a choice** at the Armory terminal; the lash is what it starts with.
4. **A clone keeps after its target while it rears back**; a creature stays rooted (its telegraph is the player's warning; a clone's is not a threat to the player).

## 5. Next (the brief's steps 5 to 7)

- **Step 5:** clone DNA costs (configurable; *"roughly two or three enemy kills"* is tentative), data-driven upgrades (armor plating, serrated arms, a longer leap or jumping attack, a wider attack radius), upgrades lost on death, and **partial DNA recovery** from the fallen clone's body.
- **Step 6:** the Ice Mage freezes a fallen ally's body; the player carries the containment capsule to the Resurrection Zone; the capsule is used there to restore the specimen.
- **Step 7:** the healing serum: crafted with DNA, splashed on the ground, healing the allies in its area; the laboratory makes it over time (every 60 s, configurable), more with the Mutator's level.
