# Combat: the audit, and what makes a fight readable

ASKED: *"Combat must be more readable and understandable, taking inspiration from the clear feedback of games like RuneScape. Currently, predators can appear to eliminate the player's creatures almost immediately. Most creatures should normally survive several hits, so investigate the actual combat logic before simply increasing health."*

## 1. The audit (measured in the test sandbox, `tests/combat.js` repeats it)

Method: one creature against one follower in the Crystal Chamber with nothing else alive (the chamber's sentries switched off), every `applyDamage` logged with its frame, its source and the call site; then three ants against a bunched squad of three.

| Fight | Hits taken before death | Time to death | Notes |
|---|---|---|---|
| ant scout L3 vs fire brawler L5 (25 HP) | 4 bites of 9–10 | 137 frames (2.3 s) | the follower had dealt 41 of the ant's 52 by then |
| mantis scout L3 vs cautious brawler L5 (25 HP) | 4 bites of 8–14 | 136 frames (2.3 s) | BLADE FLURRY never fired: it needs ~4 s of engagement to charge |
| spider striker L4 vs electric mage L5 (38 HP) at 4 tiles | 2 abdomen shots of 16 + 2 bites | 243 frames (4.0 s) | |
| scorpion striker L4 vs core brawler L9 (31 HP) | 3 bites of 10.5 | 99 frames (1.6 s) | |
| 3 ant scouts L3 vs 3 followers L9, bunched | 14 hits in all, 9 of them in the first frame | nobody died; the ants died in 6.6 s | **one bite hit all three followers** |
| fire brawler L5 vs a still ant scout L3 (52 HP) | — | the ant died in 237 frames (4 s) | 7 hits of 7–9 every ~41 frames, burn ticks, one fire-bomb splash |

The same fights under the rules of §2 (the follower fighting back as before):

| Fight | Hits taken | Time to death | Notes |
|---|---|---|---|
| ant scout L3 vs fire brawler L5 | 3 bites of 10.5, 65 frames apart | the follower lived: **the ant died** at 196 frames | the first bite comes at frame 18 (the wind-up), not frame 0 |
| mantis scout L3 vs cautious brawler L5 | 3 bites of 6.4 plus burn ticks | 292 frames (4.9 s) | was 2.3 s |
| spider striker L4 vs electric mage L5 at 4 tiles | 2 shots of 16 + 2 bites | 279 frames (4.7 s) | |
| scorpion striker L4 vs core brawler L9 | 4 bites of 7.9 | 279 frames (4.7 s) | was 1.6 s: the cap went from 45% to 34%, and each bite is announced |
| 3 ant scouts L3 vs 3 followers L9, bunched | 8 hits in all, 3 in the first frame | nobody died; the ants died in 2.6 s | each ant bit one follower |

What is true of the code (js/predator.js, js/npc.js, js/combat.js, js/abilities.js, js/helpers.js `applyDamage`):

- **No double hits.** A creature's bite runs on `attackCooldown` (45 frames, 0.75 s) and lands once per cycle; a follower's hit the same (45, 40 or 70 frames by tier); an ability's hits are spaced by its own `interval`. No source hit the same target twice in one frame in any run.
- **The damage is what the numbers say.** A bite is the creature's `power` (its class's number at level 5, scaled by its level), taken down by the follower's defense (`defenseMult`), and **capped at 45% of the follower's max health** per hit. So a follower always survives at least three hits of anything, which is why every fight above ends at the third or fourth hit.
- **The bite is an area hit.** A creature in its attack state hits *every* unit of the other side within 1.5 tiles, not the one it is biting (`js/predator.js`, the ATTACK UNIT branch). A squad that stands together (it does: the followers keep 0.75 tiles apart) takes each bite three times over. This is the "unexpected damage stacking" of the ask, and it is the single biggest reason a squad melts.
- **Deaths are legitimate**, and come from a bite, a shot, a burn or a hazard. A creature once bled 0.01 a frame (the red health decay, `js/game.js`), which killed an idle one in time and paid for it; that pass is gone, and nothing but a hit takes a creature's health.
- **The pace is the problem, not a bug.** Three hits 0.75 s apart is 2.3 s from full health to dead, with no warning before any of them: the bite has no wind-up (the abilities do, and they are readable; the plain bite is not). Nothing tells the player which creature is about to bite whom, and the numbers that float off a hit are only drawn over *enemies* (`applyDamage`'s ticker is gated to red targets), so a follower's health bar simply drops.

## 2. The rules (built in `js/combat.js` as the `COMBAT` table: every number is a knob, none is final)

| Knob | Default | What it does |
|---|---|---|
| `COMBAT.bite.windup` | 18 frames | a creature whose bite is ready REARS BACK for this long before it lands: the telegraph. A target that leaves its reach (1.5 tiles) in that time is missed. |
| `COMBAT.bite.cooldown` | 45 frames | the rest between bites, as before (a cycle is now 63 frames, about one bite a second) |
| `COMBAT.bite.splash` | `false` | `true` is the old rule (every unit in reach is hit). `false`: a bite hits the creature's target (the one it turned on), or the nearest unit of the other side in reach when it has none |
| `COMBAT.hitCap` | 0.34 | the most of a follower's or clone's max health one hit may take (was 0.45): at least three hits, usually four |
| `COMBAT.numbers.ally` | `true` | damage numbers over your own units too (red, "−n"), and green "+n" for healing |
| `COMBAT.lagBar` | 36 frames | the health bar keeps a pale segment of the health just lost that drains over this long (RuneScape's way of showing a hit's size) |
| `COMBAT.defeatText` | 90 frames | "DEFEATED" over a unit that dies, in its side's colour |

What the player sees, in order: the creature turns on a unit and **rears back** (a ring over it closes as the bite comes, a chevron on the ring points at its target, the word BITE above, and a mark drops over the unit it is biting); the bite **lands** (a flash on the target, a red number, the bar's pale segment showing how much); the **remaining health** is the bar; a unit that dies says **DEFEATED** and, for a follower, the Crystal's ticker counts its return (clones had this already).

Counterplay that already exists and now has the time to be used: COME and RETREAT (js/mixtool.js) pull the squad out during a wind-up, and the Mutator's clone with it (docs/MUTATOR.md); HOLD posts them out of reach; the Mutator's serum (docs/MUTATOR.md 2.6) heals the area; the Technomancer's arc cuts a bite short while it is being wound up (docs/TECHNOMANCER.md 2.3).

A clone bites in the same two beats as a creature, with the same telegraph in your side's teal (js/clone.js `cloneFight`, docs/MUTATOR.md §2.1); the Mutator's lash has two beats too (a draw-back, then the lash), and so has the Technomancer's punch (a wind-up, then the jab).

## 3. Tentative, not decided

The defaults above are a first pass so a fight can be read; they are not balance. Raise or lower them in one place. Follower health was **not** raised: with the cap at 0.34 and single-target bites, a squad of three against three ants takes a third of the hits it took, and a lone follower dies in four bites spread over about four seconds instead of three in two.

## 4. Whom a creature goes for: the player is prey

ASKED: *"It feels like I'm invulnerable if I'm really trying, the different predators will have more attacks with cool downs later but they should feel more dangerous, make them target you if you are weak especially. They should target weak targets and the player has a health bar too. They should also target you if you attack them."*

**What it was.**
- **A creature hurt the player only by touch.** That meant within 0.9 tiles, and the bite landed on the instant of contact.
- **A creature the player hit turned on a copy of where the player stood.** Its `lastAttacker` was the shot's snapshot of the position, not the player. If that spot was out of reach, it walked back to the Crystal.
- **Nothing chased anything.** A creature turned only on a unit within 1.2 tiles.
- **So melee was free.** The lash (1.45 tiles) and the gauntlet (1.4) strike from outside the 0.9-tile touch. In every measured melee fight the player took no hits.

**What it is** (`COMBAT.prey`, js/combat.js; `predatorPickPrey`, js/predator.js). Every `every` frames (12) a creature looks at your followers, your clones and **the player**. It goes for:
- **Whoever hit it last**, or the player if the player touched it, from up to `revenge` tiles (12), seen through walls. The player's hits now name the player itself: the gun, the laser, the melee and the arc all mark their hits as the player's (`isPlayer`), and `predatorSource` maps that to the player.
- **In a fight** (an alarm up, or provoked): anything within `close` tiles (2.5), because it's in the way. Also anything **weak** within `sense` tiles (6), meaning down to `weakAt` (half) of its health or less. For the player, its health is its three hits: the bar at the top of the screen.
- **Calm** (no alarm, not provoked): only what is down to `calmWeakAt` (a third) or less within `notice` tiles (3). For the player that means one hit left. A calm creature also turns on whatever hits or touches it.

Of those it takes the best by score:
- `near`: 1 when beside it, falling to 0 at `sense` tiles.
- `weak` × the share of health lost. The player's share of hits lost counts `weakPlayer` (2) times, so **a weak player is the first choice**.
- `attacker` if it was the last to hit it.
- `keep` if it is already after it, so it does not flit between two.

With none of those, it does what it did before: goes for the Crystal in a fight, or wanders its round when calm.

It **chases** its prey by the route round the walls; a slow on it still slows it. It keeps chasing until the prey is in reach, then bites in the bite's two beats: the telegraph over its target (the player included), then the bite. Against the player the bite is one of the three hits, with the knockback. **Step out of reach while it rears back and the bite misses:** *DODGED* appears over the player. A prey more than `leash` tiles off (13), for example a player knocked back to the Crystal, is let go; with no alarm up the creature calms down and returns to its round, and does not follow you to the Crystal. Its shots and specials still pass the player by. (*"more attacks with cool downs later"*.)

**Measured** (in the test sandbox: the Technomancer's or the Mutator's fight in the arena, one creature four tiles off, the dial held, no squad). The "dodging" runs are a crude bot that steps back 1.2 tiles each time a bite at it is rearing, then walks back in. It dodges every bite and loses its own strikes to it, so a real player who picks their moments does better.

| Creature | Gauntlet, standing and trading: time, hits taken | Gauntlet, dodging: time, hits taken | Lash, dodging: time, hits taken |
|---|---|---|---|
| ant scout L4 | 2.3 s, 2 | 8.6 s, 2 | 15 s, 2 |
| ant striker L4 | 7.1 s, 6 | 18.1 s, 2 | 19.7 s, 4 |
| beetle scout L4 | 14.3 s, 12 | not dead in 60 s, 2 | 15.4 s, 9 |
| spider striker L4 | 23.9 s, 20 | not dead in 60 s, 1 | 19.7 s, 13 |
| mantis tank L4 | 27.5 s, 23 | 27.6 s, 12 | 25.1 s, 17 |

Every three hits is a knockback to the Crystal. Before this change every one of these fights cost **0** hits. Trading blows with anything bigger than an ant now costs knockbacks unless the player dodges, arcs from range (6 charges took an ant striker down at 0 hits), or lets the squad take the attention. **These numbers are a first pass and not balance.** The knobs:
- `COMBAT.prey`: who a creature picks, and how readily.
- `COMBAT.bite.windup`: the dodge window, 18 frames.
- `COMBAT.bite.cooldown`.
- `PLAYER_HIT_GRACE`: the shortest gap between two hits on the player, 60 frames.

## 5. Spiders lurk

ASKED: *"Spiders should have no tag and should hang out near objects that reveal it only partially when idle."* (`SPIDER_LURK`, js/facilityspawn.js.)

- **No tag.** An arena spider wears no name plate (js/draw.js `_drawPredatorBars`). A spider clone of yours still has its tag.
- **Cover.** An idle spider goes from cover to cover. Cover is a floor tile just behind one of the arena's middling props: crates, crate stacks or barrels. It is meant to be partly seen: the truck, the tanks and the generator hid it completely, and a barrier hid none of it. "Behind" means the prop's north or west side, nearer the back of the picture than the prop's front corner, so the prop is drawn over part of it. A spider stays at each cover 8 to 15 seconds after getting there (`rest`).
- **Lurking.** Resting at cover, it is drawn at `alpha` 0.6, with no health bar over it and no hostile glow under it in the dark. The auto-lock passes it by, but a tap still locks it.
- **Out.** Provoked, with an alarm up, or with prey to go for (for example a player on their last hit walking by, `COMBAT.prey`), it comes out and is seen like any creature.

Tests: tests/prey.js. The older player-bite tests were changed to the new rule: tests/threehits.js, tests/targets.js, tests/stun.js. They still require one hit per bite, the knockback, and that a calm creature leaves a healthy player alone.

## 6. Statuses the equip cards set, and two real stuns (js/combat.js, js/cards.js `equipOnHit`, js/evolution.js)

Pack 1's Precision cards (docs/TUTORIAL.md, "Equip cards") set a status on a creature when a follower's hit lands. Every direct hit a follower lands can: its plain hit, the element's physical and special, the Mage's shot, a signature move, a fire-bomb's splash, an ultimate, a thrown technician's impact. A follower rolls once for each proc card it wears, once for each creature the hit reaches. None for a reflected hit, a set amount, a hit a shield took, or a burn's own tick (those have no attacker). One rule for all of them: **a status already on is refreshed, never stacked**: the longer time wins, the stronger number wins, so however many hits land the target has one timer of each, and every timer runs out by itself in `updateStatusEffects`.

| status | what it does | how long | the code |
|---|---|---|---|
| burn (Cinderbrand, 15%) | the game's own: `burning` frames, `burnDamage` a tick, a tick every `DOT_TICK` (20) frames; 3 a second is 1 a tick. It is the only one of these that hurts | 180 frames | `applyBurn` (a burn that had run out starts clean) |
| poison, the WEAKNESS (Mireblight, 15%) | **no damage.** The creature is weak: its bite power is taken down to x0.6 (40% weaker), the toxic smoke bomb's own `toxicWeakened` status, with the factor kept in `toxicWeakenFactor` so a stronger weakness it has already is kept; the factor is cleared the frame the timer ends | 240 frames | `applyWeaken` |
| glitch (Static Lock, 10%) | **no damage, no stop.** The creature's wind-ups fail while it lasts: the rear-back before a bite is cancelled as soon as it starts (`_biteTick`), an ability's charge-up is cancelled and a new one cannot begin (`abilityTick`). It still walks. Drawn as a flicker (offset, blinking, three yellow bars) with the word GLITCH. Creatures only | 30 frames | `applyGlitch` |
| slow (Rime Snare, 20%) | the game's own `applySlow` (x0.75); a stronger slow it already has, a web, is kept | 120 frames | `applySlow` |
| knockback (Repulsor Pulse, 15%) | the Core bash's push: a velocity (0.22) that decays by itself, about 0.8 tile; a second push replaces the first | | `applyKnockback` |
| stun (the Frost Maw's and the Manta's moves, not a card) | the creature cannot move, bite or use an ability: `Predator.update` returns at once, and a bite being wound up is cut short as the Technomancer's arc cuts one. Creatures only. These two moves used to write `hitStun`, which every hit writes and nothing reads, so their stun did nothing until now | Maw 75 frames, Manta 45 frames | `applyStun` |

The burn's ticks reach the creature through `applyDamage` with no attacker, so a creature's defense takes them down like any hit and a kill by a tick is credited to whoever hit it last. Siphon is not a status: it heals the follower (`healUnit`) by a tenth of the health the hit really took.

Tests: tests/packs.js (each status alone, refreshed and not stacked, a stronger one kept, the glitch against a bite and an ability, the stun, a fight with every card), tests/evolution.js (the real stuns of the Maw and the Manta).

## 7. Damage types, race weaknesses, and the physical and elemental parts of a hit (designed 2026-11-02; nothing built)

- **Status:** Designed, every part approved by the owner on 2026-11-02 (§7.2 to §7.7):
  - the six damage types, and what each race is weak to and resists;
  - each follower attack's type;
  - the owner's rule that every hit is part physical and part elemental, and how the two parts are worked out;
  - each form's lean.

  Open items: §7.8. Not implemented.
- **Branch/build:** written on `claude/start-game-project-HSh7Z` against build `2026-11-01n`.
- **Decision:** `DECISION-LOG.md`, "Damage types, race weaknesses, and every hit part physical, part elemental". The Brawler's opportunity cards use this chart (`UNIVERSAL-AND-PLAYER-CARDS.md`).

ASKED (2026-11-02): *"category 1 is slashing, piercing, and projectiles ... the next damage category is crushing slash earthquake damage. And then the third category is elemental damage. And each of these ... races has their own weakness and resistance to each of these."* Then: *"We can separate it into basically six different types of damage, if the game can handle it. Now, we need to basically make attack types for each of our followers and their alternate attacks, and talk about what each species is weak to."* Of the draft of §7.3 and §7.4: *"That looks really good."*

### 7.1 What the code does today (build `2026-11-01n`)

- **No damage types.** A hit carries one element, its own or its attacker's, and the element triangle multiplies the whole hit: ×1.3, ×0.7, or ×0 for ice on core (js/helpers.js `applyDamage`, js/elements.js `getElementMultiplier`).
- **No race weaknesses.** A beetle differs only by extra defense (`BEETLE_DEFENSE`, js/levels.js).
- **Each attack reads one stat:**
  - a Brawler's or Technician's plain hit: ATK × 0.25 (js/combat.js `followerAttack`);
  - its element's physical move: ATK × 0.35 to 0.6; its element's special: SP.ATK × 0.12 to 0.7 (js/elements.js);
  - a Mage's shot: SP.ATK × 0.5 (js/npc.js);
  - every signature move, the Mages' included: `power`, which is ATK (js/evolution.js, js/firebombs.js);
  - THERMITE DRILL reads ATK, the blight pools SP.ATK (js/techabilities.js).
- **Class shows in the stats through personality** (js/species.js `PERSONALITIES`; the numbers are in §7.6). A level raises every stat alike. Evolving multiplies health and ATK by 1.25, not SP.ATK (js/levels.js `_applyFollowerLevel`).

### 7.2 The six damage types

Slashing, Piercing and Projectile (the owner's category 1); Crushing and Earthquake (category 2); Elemental (category 3).

### 7.3 What each race is weak to and resists

Weak: ×1.3. Resists: ×0.7. Anything else: ×1. Every form of a race, nymph to boss, uses its race's row.

| Race | Weak to | Resists |
|---|---|---|
| Ant | Crushing, Earthquake | Elemental |
| Beetle | Crushing, Earthquake, Piercing ✦ | Slashing, Projectile |
| Scorpion | Elemental | Slashing, Piercing, Projectile |
| Spider | Slashing, Piercing, Projectile | Elemental |
| Mantis | Slashing, Piercing, Projectile | Crushing, Earthquake |
| Moth | Elemental, Projectile ✦ | Crushing, Earthquake |

✦ Added when the three categories became six: drills and spikes crack a beetle's shell; a moth is shot out of the air.

### 7.4 The followers' attacks

A follower's **main attack** is its everyday hit: a Brawler's or Technician's plain hit and its element's physical move, or a Mage's shot. Its **alternates** are its signature move and, for a Technician, its ability. The types follow each creature's body.

| Form | Class · element | Main attack | Alternates |
|---|---|---|---|
| QUILLSTONE | Brawler · fire | Piercing (quill spikes) | QUILL BURST: Projectile |
| FROST MAW | Brawler · ice | Slashing (ice jaws) | CHOMP: Piercing |
| STATIC ORB | Brawler · electric | Crushing (rams) | STATIC RUSH: Crushing |
| JELLY RAM | Brawler · core | Crushing (ram) | none yet |
| SEEPER | Brawler · toxic | Slashing (lash) | ERUPTION: Earthquake |
| RIFT MIMIC | Brawler · flux | Slashing (claws) | GRAVITY SLAM: Earthquake |
| THUNDERHEAD | Mage · electric | Elemental | ARC VOLLEY: Elemental |
| VOIDSTAR | Mage · flux | Elemental | SINGULARITY SHOT: Elemental |
| EMBER HOOD | Mage · fire | Elemental | HEXFIRE: Elemental |
| RIMESTAR | Mage · ice | Projectile (ice shards) | none yet |
| HORNSHELL | Mage · core | Projectile (horn spines) | none yet |
| ROTSHARD | Mage · toxic | Projectile (rot shards) | CORRODE SHOT: Elemental |
| HAMMER SLUG | Technician · core | Crushing (hammer) | PHOTONIC SHIELD: no damage |
| GOO PROXY | Technician · flux | Crushing (goo slam) | TELEGRAB: no damage |
| THERMITE BURROWER | Technician · fire | Piercing (drill) | THERMITE DRILL: Piercing |
| BLIGHT SPIDER | Technician · toxic | Piercing (fangs) | BLIGHT pools: Elemental |
| HOVER SHELL | Technician · electric | Crushing (ram) | KINETIC LAUNCHER: Earthquake (the landing) |
| IGLOO SKATER | Technician · ice | Slashing (skate blades) | FROST PATCH: Elemental |

- **Every element special is Elemental:** the fire bombs (the fire forms' FIRE BOMBS too), the static field, the ice burst, the singularity, the smoke bomb.
- **An egg** (not yet evolved) hits with its scythe legs: Slashing.
- **The player's guns and the turrets:** Projectile.

### 7.5 Every hit is part physical, part elemental (the owner's rule)

ASKED (2026-11-02), of the tables above: *"each element or each creature is more elemental than the others. And that should be reflected in their stats. So, and that means every single one of their attacks is half special and half physical, meaning that, and it's skewed depending on how it's laid out. And special attack is basically elemental damage. So that way, whenever we have a something that increases special attack, that's how it's calculated on, like, a brawler who probably has less elemental power."*

- Every attack is part physical and part special, and **special attack is elemental damage**.
- **Creatures differ in how elemental they are, and their stats show it.**
- So **anything that raises SP.ATK raises only the elemental part of a hit**, and a Brawler, with less elemental power, gains less from it.

### 7.6 How the two parts are worked out (approved 2026-11-02)

These were proposed as first guesses. The owner chose them in a prompt, over the alternatives in brackets:
- the half-and-half split, with Elemental attacks at a quarter and three quarters (over the same split for every attack, or a set share per class);
- the triangle on the elemental part only, with an ice hit's physical part landing on core (over ice on core still doing nothing, or the triangle on the whole hit);
- evolving raising SP.ATK too (over evolving as today).

The other lines below keep today's behavior or follow from those choices.

1. **Two parts.** The physical part comes from ATK and has the attack's type (§7.4). The elemental part comes from SP.ATK: it is Elemental, in the creature's element.
2. **Half and half.** An attack does its own number × (½ ATK + ½ SP.ATK). An attack §7.4 types Elemental leans elemental: × (¼ ATK + ¾ SP.ATK), and its physical quarter has no type (no race is weak to it or resists it).
3. **The stats skew it.** On a half-and-half attack the elemental share is SP.ATK ÷ (ATK + SP.ATK). A follower's card shows the share with its stats (for example ELEMENTAL 25%). An evolved form's lean tilts it further (§7.7). With today's personalities, at level 1 (a level raises both stats alike; a bred follower's stats differ by a few percent):

| Class | Personality | ATK | SP.ATK | Elemental share, half-and-half attack | Elemental share, Elemental attack |
|---|---|---|---|---|---|
| Brawler | wild | 18 | 6 | 25% | 50% |
| Brawler | aggressive | 20 | 10 | 33% | 60% |
| Technician | stoic | 10 | 8 | 44% | 71% |
| Mage | cautious | 8 | 8 | 50% | 75% |
| Mage | cunning | 10 | 15 | 60% | 82% |

4. **What each multiplier touches:**
   - **The race chart (§7.3):** the physical part by its type; the elemental part by the Elemental column.
   - **The element triangle:** the elemental part only. Ice on core: the elemental part does nothing and the physical part lands (today the whole hit does nothing).
   - The race chart and the triangle on one elemental part multiply (×1.69 at most).
   - **Defense:** the whole hit, as today.
   - **Cards:** +ATK lifts the physical part, +SP.ATK the elemental part, +DAMAGE DEALT the whole hit. A Brawler's opportunity bonus: the whole hit, on a weakness of either part (the owner, 2026-11-02: `UNIVERSAL-AND-PLAYER-CARDS.md`).
   - A burn's tick, a pool's tick and a set amount (a thrown technician) stay as they are.
5. **Evolving** multiplies SP.ATK by 1.25 as well as health and ATK, so an evolved creature is no less elemental.
6. **Each attack's own number is retuned** when this is built, so a creature's damage stays about where it is. With today's numbers a wild Brawler's main attack would lose a third and its element special would gain half.

**What it does, for example.** A +10% SP.ATK card gives a wild Brawler's Slashing main attack +2.5% damage, and a cunning Mage's Elemental main attack +8%. Element match-ups matter less to Brawlers (a fire Brawler on a flux creature: about ×1.1, today ×1.3) and still matter to Mages (about ×1.25). The Mage auras' +5% ATK (`UNIVERSAL-AND-PLAYER-CARDS.md`) lifts physical parts only: about +4% on a Brawler's hit, +1% on a Mage's. The owner kept the auras on ATK (2026-11-02).

### 7.7 Each form's lean (approved 2026-11-02)

The owner wanted *"each creature"* to differ in how elemental it is, asked for a draft for every form, and approved it as drafted.

- **When:** a creature takes its form's lean when it evolves. An egg has none: its class and personality alone set its split. The ten retired forms have no species, so no lean.
- **The steps:** each step moves 10% between ATK and SP.ATK. +2 is ATK ×0.8 and SP.ATK ×1.2; +1 is ×0.9 and ×1.1; −1 is ×1.1 and ×0.9. No form is at −2.
- **The rule:** it uses the owner's species chart (js/cards.js `EQUIP_FORM_SUBCLASS`) and §7.4.
  - Elemental species: +1.
  - Shelled species (crustacean, mollusk): −1.
  - Drones and jellies: 0.
  - A main attack typed Elemental: +1 more.
- **Nothing new is saved:** the lean is applied where a follower's stats are worked out, as evolving's ×1.25 is.
- **Damage:** a lean moves stat from one side to the other. A creature whose ATK and SP.ATK differ gains or loses a little overall damage (a wild QUILLSTONE about +5%, a wild FROST MAW about −5%), and the retune (§7.6, item 6) evens it out.

The elemental share of each form's main attack (the range runs from a wild to an aggressive Brawler, from a cautious to a cunning Mage):

| Form | Class · element | Species | Lean | Elemental share of its main attack |
|---|---|---|---|---|
| THUNDERHEAD | Mage · electric | Elemental | +2 | 82–87% |
| EMBER HOOD | Mage · fire | Elemental | +2 | 82–87% |
| VOIDSTAR | Mage · flux | Mollusk | 0 | 75–82% |
| ROTSHARD | Mage · toxic | Elemental | +1 | 55–65% |
| RIMESTAR | Mage · ice | Drone | 0 | 50–60% |
| HORNSHELL | Mage · core | Mollusk | −1 | 45–55% |
| IGLOO SKATER | Technician · ice | Elemental | +1 | 49% |
| GOO PROXY | Technician · flux | Jelly | 0 | 44% |
| THERMITE BURROWER | Technician · fire | Drone | 0 | 44% |
| BLIGHT SPIDER | Technician · toxic | Drone | 0 | 44% |
| HOVER SHELL | Technician · electric | Drone | 0 | 44% |
| HAMMER SLUG | Technician · core | Mollusk | −1 | 40% |
| FROST MAW | Brawler · ice | Elemental | +1 | 29–38% |
| STATIC ORB | Brawler · electric | Drone | 0 | 25–33% |
| JELLY RAM | Brawler · core | Jelly | 0 | 25–33% |
| RIFT MIMIC | Brawler · flux | Jelly | 0 | 25–33% |
| QUILLSTONE | Brawler · fire | Crustacean | −1 | 21–29% |
| SEEPER | Brawler · toxic | Crustacean | −1 | 21–29% |

Alternatives the owner passed over: species alone, without the +1 for an Elemental main attack (THUNDERHEAD and EMBER HOOD at +1, VOIDSTAR at −1); and steps of 20%.

### 7.8 Not covered yet (open)

- Enemies' attacks: do they have types, and are followers or the player weak to any? Neither has a race in this chart.
- The player's melee (the gauntlet, the lash, the arc), the Mutator's clone's bite and the serum: their types. The player has no SP.ATK: do Player cards give the player's attacks an elemental part?
- The ten retired forms' attack types (a follower already evolved into one keeps it).
- How a weakness shows on screen: WEAK! and RESIST speak for the element triangle only today.
