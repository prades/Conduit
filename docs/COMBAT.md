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
- **Deaths are legitimate**, and come from a bite or a shot almost every time. The red health decay (0.01 a frame on creatures) is not a factor.
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
