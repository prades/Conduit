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

## 7. Damage types, race weaknesses, and the physical and elemental parts of a hit (designed 2026-11-02; built in `2026-11-02a`)

- **Status:** Designed, every part approved by the owner on 2026-11-02 (§7.2 to §7.8):
  - the six damage types, and what each race is weak to and resists;
  - each follower attack's type;
  - the owner's rule that every hit is part physical and part elemental, and how the two parts are worked out;
  - each form's lean;
  - the enemies' attack types, your followers' weaknesses by subclass, your own attacks' types, the retired forms, and the words on screen.

  Open items: §7.9. **Implemented in build `2026-11-02a`** (`NEXT-UPDATE.md`, Build A); how, and what was measured: §7.10.
- **Branch/build:** written on `claude/start-game-project-HSh7Z` against build `2026-11-01n`; built on the same branch as build `2026-11-02a` (not on main).
- **Decision:** `DECISION-LOG.md`, "Damage types, race weaknesses, and every hit part physical, part elemental". The Brawler's opportunity cards use this chart (`UNIVERSAL-AND-PLAYER-CARDS.md`).

ASKED (2026-11-02): *"category 1 is slashing, piercing, and projectiles ... the next damage category is crushing slash earthquake damage. And then the third category is elemental damage. And each of these ... races has their own weakness and resistance to each of these."* Then: *"We can separate it into basically six different types of damage, if the game can handle it. Now, we need to basically make attack types for each of our followers and their alternate attacks, and talk about what each species is weak to."* Of the draft of §7.3 and §7.4: *"That looks really good."*

### 7.1 What the code did before the damage system (build `2026-11-01n`)

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

A follower's **main attack** is its everyday hit: a Brawler's or Technician's plain hit and its element's physical move, or a Mage's shot. *(Since build `2026-11-09b`, the owner's: the element's physical move is an **evolved** Brawler's or Technician's everyday hit only (with WILL); an **unevolved** follower makes the plain hit (ATK × 0.25, one enemy, no WILL spent; a Mage shoots) until unevolved followers' attacks are designed anew (open: `OPEN-QUESTIONS.md`); it keeps its element for the triangle. BLOOM has a move since then, its evolved Brawler's and Technician's (SUNDEW's NECTAR STING, STONEPETAL's head): ATK × 0.45 on the one it hits, MENDing as every BLOOM hit (js/elements.js `ELEMENT_ATTACKS.blossom`; the agent's number, provisional). And no element has an Ultimate: each evolved form has its own (js/elements.js `FORM_ULTIMATES`).)* Its **alternates** are its signature move and, for a Technician, its ability. The types follow each creature's body. The fire and electric followers' attacks were redesigned on 2026-11-02 (`FOLLOWER-COMBAT-REDESIGN.md`, built from build `2026-11-03a`); their types did not change.

**A follower's attacks** (the owner, 2026-11-07: "I don't think we're gonna have a special attack. It's going to be each [follower] has at max a primary attack and alternate attack and a card special attack and a ultimate ability"; build `2026-11-07jj`): its primary (the everyday hit above), at most one alternate, a card's special attack (the SPECIAL ATTACK slot) and its Ultimate. The element special that a follower used to fire now and then (fire bombs, static field, ice burst, singularity, toxic cloud) is gone from its attacks.

**A Mage winds up its everyday shot** (the owner, 2026-11-07: "mages have to wind up their normal attack as well, but it's a really fast wind up and they can't move while they're doing it"; build `2026-11-07kk`): `MAGE_SHOT_WINDUP` frames (12, provisional) standing still, aimed at the enemy it picked, then the shot; the rest after it is as before. Attack speed shortens the wind-up as it does the rest; a retreat cancels it; a target that dies in the wind-up is let go.

**An alternate is a chosen mode** (the owner, 2026-11-07, build `2026-11-07ff`). An evolved follower fights with its main attack until one of its alternates is chosen (the INDEX tab, the HUD pop-out, the roster). The chosen alternate is then its only attack, until it is switched back; attack orders keep it. With an enemy in the move's reach it winds up rooted (it cannot move), fires, and winds up again only once the move's effect has ended (at most 20 s). While it winds up, a Mage has a faint glow of its element round it, a Brawler's body rumbles and a Technician has circuit sparks of its element flickering over its body, each growing (builds `2026-11-07gg` and `hh`: the owner, "an aura for a mage and a rumble for a brawler", then "Circuit sparks works"). The Technician's ability is unchanged (the player fires it).

| Form | Class · element | Main attack | Alternates |
|---|---|---|---|
| QUILLSTONE | Brawler · fire | Piercing (quill spikes) | QUILL BURST (five quills at once, each stopping at its first enemy): Projectile (FIRE BOMBS taken off it, 2026-11-07) |
| FROST MAW | Brawler · ice | Slashing (ice jaws) | CHOMP: Piercing |
| ELECTRO SKINK | Brawler · electric (since build `2026-11-08a`) | Slashing (for now: what it hit with as an egg; open) | ZIGZAG DASH (build `2026-11-09c`, the owner's pick of the agent's drafts; numbers provisional): Slashing, electric (BASH before). Its Ultimate LIGHTNING CIRCUIT: electric |
| STATIC ORB | Brawler · electric (set aside since build `2026-11-08a`: kept by a follower that has it; the magnetic brawler to be) | Crushing (rams) | SONIC ROLL (STATIC RUSH renamed): Crushing; CAPACITOR DISCHARGE (it stands still storing up to 4 charges; you release them into a short chain, build `2026-11-07ss`): Crushing and electric. PINBALL is superseded by it (the design notes) |
| JELLY RAM | Brawler · core | Crushing (ram) | WOBBLE SLAM (build `2026-11-09c`, the owner's pick of the agent's drafts; numbers provisional): Crushing (BASH before) |
| SEEPER | Brawler · toxic | Slashing (lash) | ERUPTION: Earthquake |
| RIFT MIMIC | Brawler · flux | Slashing (claws) | GRAVITY SLAM: Earthquake |
| THUNDERHEAD | Mage · electric | Elemental (CHAIN LIGHTNING: the shot conducts on, by distance) | STATIC VORTEX (a stationary pull that bites): Elemental |
| VOIDSTAR | Mage · flux | Elemental | SINGULARITY SHOT: Elemental |
| EMBER HOOD | Mage · fire | Elemental (FIREBALL) | HEXFIRE (a shot that leaves a stationary burning circle): Elemental (FIRE BOMBS taken out as an alternate, 2026-11-07) |
| RIMESTAR | Mage · ice | Projectile (ice shards) | ICICLE VOLLEY (build `2026-11-09c`, the owner's pick of the agent's drafts; numbers provisional): Projectile, three of its shots (reading SP.ATK) (BASH before) |
| HORNSHELL | Mage · core | Projectile (horn spines) | ECHO PULSE (build `2026-11-09c`, the owner's pick of the agent's drafts; numbers provisional): Elemental (BASH before) |
| ROTSHARD | Mage · toxic | Projectile (CORRODE SHOT since build `2026-11-07ss`: its everyday shot eats the armour of what it hits) | ROTTEN DECOY |
| HAMMER SLUG | Technician · core | Crushing (hammer) | SHELL GUARD (build `2026-11-09c`, the owner's pick of the agent's drafts; numbers provisional): no damage (BASH before). Its utility, PHOTONIC SHIELD: no damage |
| GOO PROXY | Technician · flux | Crushing (goo slam) | PHASE SWAP (build `2026-11-09c`, the owner's pick of the agent's drafts; numbers provisional): its burst Elemental (BASH before). Its utility, FLUX MOVE: no damage (it moves objects; Telegrab, retired 2026-11-06, did none either) |
| THERMITE BURROWER | Technician · fire | Piercing (BURROW STRIKE: it dives, travels under the floor and erupts beneath the enemy, 2 × its plain hit; build `2026-11-06a`) | THERMITE DRILL: Piercing; FAULTLINE (a path the player draws, spikes along it): Piercing |
| BLIGHT SPIDER | Technician · toxic | Piercing (fangs) | VENOM BITE (build `2026-11-09c`, the owner's pick of the agent's drafts; numbers provisional): Piercing (BASH before). Its utility, BLIGHT pools: Elemental |
| HOVER SHELL | Technician · electric | Crushing (ram) | SHOCK ZAP (build `2026-11-09c`, the owner's pick of the agent's drafts; numbers provisional): Elemental, electric (BASH before). Its utility, KINETIC LAUNCHER: Earthquake (the landing) |
| IGLOO SKATER | Technician · ice | Slashing (skate blades) | SKATE CHARGE (build `2026-11-09c`, the owner's pick of the agent's drafts; numbers provisional): Slashing (BASH before). Its utility, FROST PATCH: Elemental |

**Second attacks for every follower (build `2026-11-07ss`; the owner: "inherit second attacks on all the followers", "Inherit from the design notes", then "BASH for now" and "Apply both").** Every follower has a second attack now, chosen as a locked mode as before (`js/moves.js`):
- **BASH** where the design notes give none (the eight forms above, and every follower before it evolves): it rams the nearest enemy it can see within 1.8 tiles, 1.5 × its attack, Crushing whatever its form, a push of a tile and a 0.5 s stun; a 4 s wind-up. A Mage locked on it walks in to use it. The numbers are the agent's (provisional). *(Since build `2026-11-09c` BASH is only an unevolved follower's: the nine forms that had it as a stand-in each have their own, the owner's pick of the agent's drafts, 2026-11-09 (the numbers the agent's, provisional; their looks to be designed "with 3-D flare"):*
  - *ZIGZAG DASH (Electro Skink, 4 s): it darts through the nearest enemy within 4 tiles and on, a hop of 2.5 tiles at a time, 3 at most: each 1 × its attack, Slashing, electric, and its wind-up broken (GLITCH 0.5 s); it ends beside the last.*
  - *WOBBLE SLAM (Jelly Ram, 4 s; a close move): every enemy within 1.5 tiles 1.2 × its attack, Crushing, staggered 0.5 s (not a boss).*
  - *ICICLE VOLLEY (Rimestar, 5 s): three icicles in a fan (0.26 rad apart) at the nearest enemy within 7 tiles, each its shot (SP.ATK × the Mages' share), Projectile, ice; one that hits slows to 60% for 2 s.*
  - *ECHO PULSE (Hornshell, 5 s): every enemy within 4 tiles 0.4 × its attack, Elemental (core), its wind-up broken (GLITCH 0.5 s).*
  - *SHELL GUARD (Hammer Slug, 6 s): with an enemy within 3 tiles, it braces for 4 s: half damage taken, and the enemies within 3 tiles (not a boss) go for it (SWEET SCENT's lure).*
  - *PHASE SWAP (Goo Proxy, 5 s): it swaps places with the nearest enemy within 6 tiles that is not a boss (both spots floor); a goo burst at the spot it left, 1 × its attack, Elemental (flux), on every enemy within 1 tile of it.*
  - *VENOM BITE (Blight Spider, 5 s; a close move): it steps in and bites the nearest enemy within 1.8 tiles, 1 × its attack, Piercing: POISONED (40% weaker for 4 s) and MARKED: your side's next 3 hits on it within 10 s deal 20% more.*
  - *SHOCK ZAP (Hover Shell, 4 s): the nearest enemy within 4 tiles, 1 × its attack, Elemental, electric, its wind-up broken (GLITCH 0.5 s); its KINETIC LAUNCHER untouched.*
  - *SKATE CHARGE (Igloo Skater, 4.5 s): it skates toward the nearest enemy within 4 tiles and on, 4 tiles along open floor: every enemy within 0.8 of its line 1 × its attack, Slashing, ice, slowed to 60% for 2 s.*
  - *A follower saved locked on BASH carries over to its form's own (js/moves.js `moveAltCarried`).*
- **CAPACITOR DISCHARGE** for the Static Orb (the design notes; PINBALL is superseded, its code kept): it stands still storing a charge every 1.5 s, up to 4, enemies near or not, and may move again once full; RETREAT stops the charging. The player releases them (its squad card's ⚡ chip, or its INFO) into an enemy within 2 tiles: a chain of 1 + the charges enemies, each within 2.5 tiles of the last, 0.5 × its attack × the charges each (electric). A switch of attack loses the charges. The numbers are the agent's (provisional).
- **CORRODE SHOT** is the Rotshard's everyday shot (the design notes' primary): the Mage's shot, its own damage, and it eats the armour of what it hits, weaker round it. ROTTEN DECOY is its second attack.
| SUNDEW (built `2026-11-08k`) | Brawler · bloom | Piercing: NECTAR STING, its blade-leaf's sting (build `2026-11-08n`; Slashing, its slash, before) | SWEET SCENT: no damage (a lure, or a heal with its stockpile full; build `2026-11-08n`; BASH before). Its Ultimate CONSUME: the digestion Elemental (the owner kept it, 2026-11-08) |
| THORNWHIP (built `2026-11-08j`; named 2026-11-08; it was the lotus lantern) | Mage · bloom | Elemental (SEED SHOT: its vines fling a glowing seed like a sling, 2026-11-08) | SEEDFALL: Elemental. Its Ultimate PINK THICKET: Elemental (build `2026-11-08l`) |
| STONEPETAL (built `2026-11-08m` as the coral crab; named `2026-11-08n`) | Technician · bloom | Crushing (its head driving down: No. 914 has no claws) | STAKE RING: Piercing (build `2026-11-08n`; BASH before). Its ability REEF and its Ultimate REEF PILLAR deal no damage (`TECHNICIANS.md`) |

- **Every element special is Elemental:** the fire bombs (the fire forms' FIRE BOMBS move too, until it was taken out on 2026-11-07), the static field, the ice burst, the singularity, the smoke bomb. *(Since build `2026-11-07jj` no follower uses an element special: the owner, "each [follower] has at max a primary attack and alternate attack and a card special attack and a ultimate ability". The functions stay in js/elements.js, unused.)*
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

- **When:** a creature takes its form's lean when it evolves. An egg has none: its class and personality alone set its split. The ten retired forms take the lean of the form that replaced each (§7.8).
- **The steps:** each step moves 10% between ATK and SP.ATK. +2 is ATK ×0.8 and SP.ATK ×1.2; +1 is ×0.9 and ×1.1; −1 is ×1.1 and ×0.9. No form is at −2.
- **The rule:** it uses the owner's species chart (js/cards.js `EQUIP_FORM_SUBCLASS`) and §7.4.
  - Elemental species: +1.
  - Spine-legged and Mollusk: −1 (the shelled lean; Spine-legged is the Crustacean, renamed in build `2026-11-08h`, with the Electro Skink and the Blight Spider in it).
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
| BLIGHT SPIDER | Technician · toxic | Spine-legged (a Drone until build `2026-11-08h`) | −1 | 40% |
| HOVER SHELL | Technician · electric | Drone | 0 | 44% |
| HAMMER SLUG | Technician · core | Mollusk | −1 | 40% |
| FROST MAW | Brawler · ice | Elemental | +1 | 29–38% |
| STATIC ORB | Brawler · electric | Drone | 0 | 25–33% |
| JELLY RAM | Brawler · core | Jelly | 0 | 25–33% |
| RIFT MIMIC | Brawler · flux | Jelly | 0 | 25–33% |
| QUILLSTONE | Brawler · fire | Spine-legged | −1 | 21–29% |
| SEEPER | Brawler · toxic | Spine-legged | −1 | 21–29% |
| ELECTRO SKINK | Brawler · electric | Spine-legged (none until build `2026-11-08h`) | −1 | 21–29% (by the rule, as the other −1 Brawlers; not measured) |
| THORNWHIP (built `2026-11-08j`; it was the lotus lantern) | Mage · bloom | Elemental | +2 | 82–87% |
| STONEPETAL (built `2026-11-08m`) | Technician · bloom | Spine-legged | −1 | 40% |
| SUNDEW (built `2026-11-08k`) | Brawler · bloom | Mollusk | −1 | 21–29% |

Alternatives the owner passed over: species alone, without the +1 for an Elemental main attack (THUNDERHEAD and EMBER HOOD at +1, VOIDSTAR at −1); and steps of 20%.

### 7.8 The enemy side, your own attacks, the retired forms, the words on screen (approved 2026-11-02)

The owner asked for a draft of the enemy side and approved it as drafted; the rest was chosen in prompts.

**Each enemy attack's type:**

| Race | Bite | Special |
|---|---|---|
| Ant | Slashing (mandibles) | MANDIBLE FRENZY: Slashing |
| Beetle | Crushing (horn) | CARAPACE SLAM: Earthquake |
| Scorpion | Piercing (stinger) | VENOM LANCE: Piercing |
| Spider | Piercing (fangs); its shot: Projectile | WEB SNARE: no damage |
| Mantis | Slashing (scythes) | BLADE FLURRY: Slashing |
| Moth | Crushing (wing buffet) | BLINDING DUST: small toxic ticks, left on the old rule (the owner kept them, 2026-11-02; this table first said "no damage") |

- **The Toxic Queen** fights as an ant; her bomb is Earthquake and her spit Projectile. **A boss uses its race's row** in §7.3.
- A scout's LEAP does no damage.
- **An enemy with an element** (today the toxic brood and the Toxic Queen): every hit is half its type and half Elemental in its element, and the element triangle falls on the elemental half. An enemy without one: all physical.

**What your followers are weak to and resist, by subclass** (weak ×1.3, resists ×0.7; the subclass is the form's tag, js/cards.js `EQUIP_FORM_SUBCLASS`):

| Subclass | Weak to | Resists |
|---|---|---|
| Spine-legged (the Crustacean, renamed in build `2026-11-08h`) | Crushing, Earthquake | Slashing, Piercing |
| Mollusk | Slashing, Piercing | Crushing, Earthquake |
| Elemental | Earthquake, Projectile | Slashing, Elemental |
| Drone | Crushing, Elemental | Piercing, Projectile |
| Jelly | Slashing, Elemental | Crushing, Projectile |

- An egg (no subclass yet) has no row.
- The Mutator's clone takes hits by its race's row (§7.3).
- The player has no row: a hit is one of the player's three hits, whatever its type.
- The turrets and the Crystal have no row.

**Your own attacks:**
- Guns and turrets: Projectile.
- The Technomancer's gauntlet punch: Crushing. The arc: Elemental (electric).
- The Mutator's lash: Slashing. The clone's bite: Piercing.
- The serum heals: no type.

The player has no SP.ATK, so these hits are not split.

**The ten retired forms** (a follower already evolved into one keeps it) copy the form that replaced each: its attack types (§7.4), its lean (§7.7) and, when hit, its subclass's row (the owner, 2026-11-02).
- BUNKER BLOOM → QUILLSTONE
- REAVER → THUNDERHEAD
- SERPENT → VOIDSTAR
- AEGIS WARDEN → JELLY RAM
- STORM MANTA, PRISM HOOD and VOLT RING → STATIC ORB
- CINDER HALO → EMBER HOOD
- CALDERA → SEEPER
- PETAL AEGIS → HORNSHELL

PETAL BLAZE, the one move of their own, is Elemental.

**On screen, a word per part:** a hit says what each part met, for example SLASHING WEAK! and FIRE RESIST on the same hit. Today WEAK! and RESIST speak for the element triangle only.

**BLOOM, a seventh element** (designed 2026-11-02, `CONVERSION.md`):
- It sits outside the two triangles: ×1 against every element, and every element ×1 against it.
- Its hits set MEND: the most hurt ally nearby is healed a little.
- A BLOOM follower's hits split like any follower's, the elemental part in BLOOM. Its forms' subclasses and leans come with their designs.

### 7.9 Not covered yet (open)

- Which element each future quest line has (Side Quest's stock follows it, `SEWER-QUEST.md`).
- Whether a Player card gives the player's attacks an elemental part (the Player cards' kits, `UNIVERSAL-AND-PLAYER-CARDS.md`). **Answered 2026-11-02** ("The role's element"; that document's "The 18 kits", rule 2): no elemental part; the class's hits take the role's element for the triangle only.
  - **Implemented for the Gunslinger** in build `2026-11-02h` (Part 1a): with a Gunslinger role awake, a round of any gun (`DMG_HIT_GUN`, Projectile) carries the role's element in place of the selector's, and js/damage.js sets the triangle on the whole hit, as for any player's weapon. Tested: tests/playercards.js (×1.3 on a flux creature for a fire round; exactly a plain round's damage on a creature with no element). **For the Technomancer** in build `2026-11-02i` (Part 1b): the punch (`DMG_HIT_PUNCH`, Crushing) and the arc (Elemental, `dmgArcHit`: the same hit in the role's element) take the role's element; tested (×1.3 on a flux creature with FORGEMASTER for both). **For the Mutator** in build `2026-11-02j` (Part 1c): the lash (`DMG_HIT_LASH`, Slashing) and the clone's bites take the role's element. A bite (`dmgCloneHit`: Piercing, the role's element, the triangle on the whole bite as on the player's hits) is the clone's bite and its POUNCE's bite as it lands. Its special and a striker's shot are not bites and keep no element. SPLICER's clone bites in the element of its last kill instead. Tested (×1.3 on a flux creature with ASH SURGEON for both).
- The icons beside the words (the subclass, element and race icons, `UI-STYLE.md`).

### 7.10 As built (build `2026-11-02a`)

- **Status:** Implemented on `claude/start-game-project-HSh7Z` as build `2026-11-02a` (`NEXT-UPDATE.md`, Build A).
  - **Verified** by tests/damage.js (25 checks) and the full run (85 suites); the suites whose references moved are listed in `CHANGELOG.md`, `2026-11-02a`.
  - **Measured** before and after (below).
  - **Not playtested.** The words' look waits on the owner (a screenshot, `NEXT-UPDATE.md` section 4).

**Where it lives:**
- **js/damage.js** (new): the tables of §7.3, §7.4 and §7.8, the split, the rows, the leans' rule, the retune and the words.
- **js/helpers.js `applyDamage`** takes what a hit is as a seventh argument and hands it to `dmgApply` before defense.
  - A hit is a frozen constant (`DMG_HIT_MAIN`, `DMG_HIT_SHOT`, …), so nothing is made per hit.
  - A hit that says nothing keeps the old rule: the element triangle on the whole hit.
- **js/levels.js `_applyFollowerLevel`:** evolving multiplies SP.ATK by 1.25 too (§7.6, item 5), then applies the form's lean (§7.7). Nothing new is saved.

**What each attack says it is:**

| Who | Attack | Its part | Its number reads |
|---|---|---|---|
| Follower | the plain hit, a job's attack, its element's physical move | main (§7.4) | ATK |
| Follower | a Mage's shot | main | SP.ATK |
| Follower | the twelve signature moves, THERMITE DRILL | alternate | ATK |
| Follower | a follower thrown by the Kinetic Launcher, landing | Earthquake | ATK |
| Follower | the element specials and the fire special's bombs (no longer used since 2026-11-07, build `jj`), the toxic impact, the fire eruption | special (Elemental) | SP.ATK |
| Follower | the fire forms' FIRE BOMBS move (taken out 2026-11-07, build `ii`) | special (Elemental) | ATK |
| Creature | its bite (js/predator.js, three places) | its race's (§7.8) | — |
| Creature | MANDIBLE FRENZY, CARAPACE SLAM, VENOM LANCE's first hit, BLADE FLURRY | its own (§7.8) | — |
| Creature | the spider's shot; its charged extra | Projectile; Elemental | — |
| Creature | the Toxic Queen's spit; her bomb | Projectile; Earthquake (toxic) | — |
| You | guns, the laser and its pierce, the turrets | Projectile | — |
| You | the Mutator's lash; the gauntlet; the arc | Slashing; Crushing; Elemental (electric) | — |
| You | the clone's pounce | Piercing | — |

*Since then (the follower combat redesign, `FOLLOWER-COMBAT-REDESIGN.md`): build `2026-11-03a`'s PINBALL and STATIC VORTEX are signature moves (alternate, ATK), and the Ember Hood's FIREBALL and the Thunderhead's CHAIN LIGHTNING are the Mages' shot (main, SP.ATK). Build `2026-11-06a`'s BURROW STRIKE stands in the Thermite Burrower's plain hit (main, ATK), and its FAULTLINE's spikes are an ability's (alternate, ATK), as THERMITE DRILL's are.*

**Left on the old rule, as §7.6 item 4 says:**
- a burn's tick;
- a pool's tick (the blight pools, VENOM LANCE's and BLINDING DUST's ticks);
- a reflected hit;
- a Series 2 card's echo (Nova, Cleave, Chain);
- a set amount (a thrown technician, the fixed self-damage).

**The retune (§7.6, item 6), as built:**
- An attack's number still reads the stat it read, so a level or a card lifts it as before.
- `dmgNorm` then scales it: the class's average of that stat over the class's average blend, the form's lean included. The averages come from the class's personalities (js/species.js).
- So a follower at its class's average stats does exactly what it did before, evolved or not, whatever its lean. tests/damage.js checks this on eight forms.
- A follower whose stats differ from its class's average gains or loses with them: that is the skew of §7.6, item 3.

**Readings made while building it** (`OPEN-QUESTIONS.md`):
- **Answered (2026-11-02):** BLINDING DUST deals small toxic ticks in the code, though §7.8 said "no damage". The owner kept them ("Keep the ticks").
- **Standing unless the owner says otherwise:**
  - An egg Mage's shot is Projectile ("an egg hits with its scythe legs" read as its melee).
  - A player's weapon with an element (the laser on a selected element) keeps the triangle on the whole hit.

**The words on screen** (placed beside the creature in build `2026-11-02b`; the owner: "Move beside the creature"):
- **What they say:** a word for each part that met a weakness or a resistance. SLASHING WEAK! is gold, FIRE RESIST is blue, and ICE IMMUNE marks ice on core.
- **Where they sit:** to the creature's right, at its body's height, the physical part's word over the elemental part's. Each starts a little past the creature's side, clear of its name plate. They drift up slowly (about 18 px in their 40 frames), so they never climb into the plate.
- **How often:** one set per target every 12 frames, so a flurry does not pile them up.
- **What they replace:** the old WEAK! and RESIST, for every hit that says what it is.
- In build `2026-11-02a` the words stacked over the hit's number, where they could cover the name plate.

**Measured before and after** (`NEXT-UPDATE.md` Build A, item 8). tests/measure_damage.js (run by hand, not in the full run) measures three things:
- each follower class's damage in 15 s at level 10 (evolved), against a still creature of each race;
- each race's bite on a held follower of five subclasses, in 10 s;
- §1's six fights, both sides fighting.

"Before" is the code of build `2026-11-01n`; "after" is this build. Both ran on the same harness.

The first tries were thrown out because their runs leaked into each other. These carried over from one run to the next:
- leftover fire and pools;
- the player's lock on the last creature;
- the arena's spawner;
- a cache kept by frame and count;
- the recruits' wandering clocks;
- the screen's shake, whose jitter draws random numbers.

Also, the bite test's "held" follower still fired its signature move and killed the creature early.

The harness now starts every run clean. Thirteen mixed runs give the same numbers forward and in reverse order.

**A follower's damage in 15 s** at level 10 (evolved), on a still creature. Each class is the mean over its personalities, the six elements and the six races:

| Class | Before | After | Change | After vs before, by race |
|---|---|---|---|---|
| Brawler | 475 | 477 | 0% | ant −1%, beetle −1%, scorpion −4%, spider +3%, mantis +3%, moth +2% |
| Mage | 254 | 259 | +2% | ant −22%, beetle −1%, scorpion +18%, spider −17%, mantis +5%, moth +27% |
| Technician | 159 | 168 | +6% | ant −3%, beetle +16%, scorpion +11%, spider −3%, mantis +4%, moth +11% |

- **The class averages hold.**
- **The Technicians' +6% comes from the race chart, not the retune.** Their Crushing and Piercing main attacks meet more weaknesses than resistances across the six races; a beetle is weak to both.
- **A Mage now swings with a race's Elemental column:** ants and spiders resist it, scorpions and moths are weak to it.
- **The personalities skew as §7.6 item 3 says:** aggressive +4%, wild −4%, cautious −2%, cunning +5%, stoic +6%.

**A race's bite on a held follower, in 10 s.** The five followers are QUILLSTONE, FROST MAW, STATIC ORB, JELLY RAM and HAMMER SLUG.
- Each moves by its subclass's row: ×0.7 where it resists the bite's type, ×1.3 where it is weak.
- It moves a little less where a special's ticks stay as they were (VENOM LANCE, BLINDING DUST).
- The mean over the five, by race: ant −2%, beetle +3%, scorpion −8%, spider −9%, mantis −2%, moth +2%.

**§1's six fights**, both sides fighting (f = frames, 60 a second):

| Fight | Before | After |
|---|---|---|
| ant scout L3 vs fire brawler L5 | the ant fell at 154 f; the follower took 3 hits, 7 health left | the same: each hit is about 4% weaker (an ant resists the elemental third), and a fire bomb's landing ends it at the same frame |
| mantis scout L3 vs wild brawler L5 | the follower fell at 216 f after 4 hits; the mantis had 52 left | the same fall; the mantis had 46 left (it is weak to the follower's Slashing) |
| spider striker L4 vs electric mage L5 | the follower fell at 570 f after 4 hits; the spider had 256 left | the same; 258 left |
| scorpion striker L4 vs core brawler L9 | the follower fell at 216 f after 4 hits; the scorpion had 167 left | the same; 169 left |
| beetle scout L4 vs fire technician L10 | the follower fell at 529 f after 19 hits; the beetle had 70 left | at 417 f after 16 hits; the beetle had 77 left. THERMITE BURROWER is a drone, weak to the beetle's Crushing |
| moth striker L4 vs flux mage L10 | the follower fell at 619 f after 8 hits; the moth had 240 left | at 838 f after 9 hits; the moth had 190 left. VOIDSTAR, a mollusk, resists the moth's Crushing, and a moth is weak to its Elemental shots |

These fights are not §1's audit runs (the setup differs); they compare the two builds on one harness. Every follower still takes several hits before it falls.

## 8. Walls, cover and sight (Milestone Two; built in `2026-11-06h`)

- **Status:** Implemented and tested in build `2026-11-06h` (on main at the owner's word); the moves that strike at once needing sight (§8.5) in build `2026-11-06i` (branch `claude/start-game-project-HSh7Z`). **Not playtested.**
- **Source:** the owner's answers of 2026-11-06 (`DECISION-LOG.md`), from the study in `FLUX-MOVEMENT.md` §13 (the roadmap's Milestone Two, `NEXT-PHASE-ROADMAP.md`). This section is the canonical statement of the rules.
- **Readings:** what nothing said is marked **[reading]**; each one is listed for the owner in `OPEN-QUESTIONS.md` §1x.

### 8.1 The owner's rules (quoted)

1. Cover: "Stops shots".
2. What gives cover: "Barriers", "Crates and stacks", "Barrels", "Desks and consoles" (the desks, the consoles and the lab benches).
3. "Walls stop shots".
4. "See over low ones".
5. "Shoot over own cover": a shot fired from right behind an object passes over that object, within about a tile of the shooter.
6. Stepping over an object: "Not yet". Every solid still blocks walking for everyone.
7. Tall objects (the ones not seen over): "Yes, they stop shots".

### 8.2 What each kind of object does (`js/facility.js` `FAC_COVER`, `FAC_LOW`)

Each solid gets two traits from its kind when the map is built: `cover` (it stops a shot) and `low` (sight passes over it).

| Kind | Stops a shot | Seen over | On the main map |
|---|---|---|---|
| Barrier, crate, barrel, desk, computer desk, reception desk, lab bench | yes (cover) | yes | 34 |
| Crate stack, console **[reading: too high to see over]** | yes (cover) | no | 8 |
| Table, couch, cart, turret (sentry), the Sewers' river and pools, barred gates, the boss gate **[reading]** | no: passed over | yes | 17 |
| Everything else: generator, locker, vending machine, cabinet, cooler, server rack, teleporter, tanks, plants, floodlights, the truck, rubble… (tall) | yes, always | no | 105 |

The heights are read from the props' 3D models (the player is about 70 px tall; `FLUX-MOVEMENT.md` §13): waist high or less is low. A barred gate is seen through and water is seen across **[reading]**.

The Flux test room (`?fluxlab`) now has the roadmap's "object that provides cover": its crates, barrel, barriers and desk (cover, seen over) and its two consoles (cover, not seen over). Its generator is tall.

### 8.3 Sight (`facilitySees`; in play `facilitySeesFrom`)

- **Nothing is seen through:**
  - a wall: any edge of a room, whatever it is drawn as (wall, rock, glass, the arena's railing wall, the Nest's spill lip) **[reading: glass blocks sight, as it always did]**;
  - the band between rooms, or outside the building;
  - a solid that is not low.
- **What is seen:**
  - over a low solid;
  - through a doorway;
  - a solid at either end of the line: the one looking (a turret) or the one looked at (a rubble pile being drilled) does not hide itself.
- **What uses sight:**
  - the auto-lock and the enemy card;
  - a creature's choice of prey;
  - the combat step's "enemy near";
  - the technicians' aims;
  - the Technomancer's arc, ARC WARDEN, BURROW STRIKE;
  - spawning out of the player's sight;
  - the shooters of §8.5.
- **Walking is another question:** route smoothing, steering, wander spots, leaps, the clone's pounce, PINBALL's roll and FAULTLINE's path keep the walking test. A crate is seen over and still not walked through.
- **What changed for sight** (it was the walking test until this build): low furniture, water and barred gates are now seen over. Walls, glass and tall objects hide what is behind them, as before.

### 8.4 Shots (`facilityShotStop`, `facilityShotReach`; the shots in flight, `js/game.js`)

- **A shot that travels** is anything on the shared shot list:
  - the player's service gun and machine gun;
  - a Mage's bolt (FIREBALL and CHAIN LIGHTNING too);
  - QUILL BURST's quills and HEXFIRE's shot;
  - a creature's rear shot;
  - a turret's shot.
- **Such a shot stops at:**
  - a wall (glass included **[reading]**);
  - a cover object, unless it is the shooter's own: cover within `FAC_SHOT.own` = **1.0 tile** of where the shot was fired, measured to the object's nearest edge **[reading: the owner's "about a tile"]**;
  - a tall object, always. A tall object is nobody's own cover **[reading]**.
- **Over its own cover:** a shot fired from right behind a crate stack or a console passes over it too: cover too high to see over is still its owner's cover **[reading]**.
- **What it passes over:** a low object that gives no cover.
- **Either side's cover:** a creature's shot at a follower behind a crate stops at the crate, as yours do.
- **Where a shot stops:** a small spark in the shot's colour (an `impact` effect, 0.35 tiles, 12 frames) **[reading]**. A shot that does something where it ends (HEXFIRE's burning circle) does it on its own side of what stopped it.
- **The laser's beam** (`fireLaserShot`) stops at the first wall, cover (not the player's own) or tall object:
  - the target beyond the stop is not hit;
  - a creature in the line before the stop is hit as before (for less); one beyond it is not;
  - a spark marks where the beam stopped, and the beam is drawn to there.
- **Unchanged:**
  - lobs (an arc: the toxic smoke bomb) fly over everything;
  - the fire bombs bounce off walls and props (`js/firebombs.js`);
  - the Photonic Shield stops enemy shots;
  - REEF's outcrops and REEF PILLAR (build `2026-11-08m`) stop enemies' movement, and since build `2026-11-08n` their shots (the owner: "Stop shots too"; a lob flies over, your shots pass); bites and sight pass them (`TECHNICIANS.md`, "REEF"). *(Changed in build `2026-11-09a`, the owner: "Stops everyone's": REEF's rock is cover for every side, as a crate: every shot's step, the laser's beam and a sentry's aim stop at it, with the own-cover rule (a shot fired within `FAC_SHOT.own` of its edge passes over it); a lob flies over; bites and sight still pass it.)*
  - melee (bites, the lash, the punch) tests distance only, so a bite still reaches over a one-tile object;
  - ~~the moves that strike at once (ARC VOLLEY, SINGULARITY SHOT, STATIC VORTEX, PETAL BLAZE) are as they were~~ *(superseded in build `2026-11-06i` by the owner's "Need sight": §8.5)*.

### 8.5 The shooters fire at what they can see

- **A Mage** (`js/npc.js`) fires only at an enemy it can see. One it cannot see it walks toward, as it does one too far off, and the navigation layer takes that step round the wall, until it can see it **[reading]**. Cover it sees over may still stop its shot.
- **QUILL BURST and HEXFIRE** (`js/evolution.js`) are aimed only at an enemy the follower can see. With none in sight, the move is not fired and stays ready **[reading]**.
- **A creature's rear shot** (`js/predator.js`) is fired only at a target it can see, the one that last hit it included **[reading]**.
- **A turret** (`js/stations.js`) fires only with a clear shot (`facilityShotClear`: nothing would stop it short of its target), so the Crystal pays for no shot that a wall or cover would stop **[reading]**.
- **The player** fires when they choose (a tap or a hold). A round fired at a creature behind a wall or cover is stopped there. The auto-lock takes only creatures in sight, as before (now over low objects too).
- **A follower's moves that strike at once need sight** (built in `2026-11-06i`; the owner, 2026-11-06: "Need sight": nothing strikes through a wall or a tall object). Cover does not stop them: they do not travel.
  - **The moves:** ARC VOLLEY, SINGULARITY SHOT, STATIC VORTEX, PETAL BLAZE (the four the owner was asked about), and the rest of their kind **[reading: the owner's "nothing strikes through a wall"]**: CORRODE SHOT, CHOMP, ERUPTION, GRAVITY SLAM, SONIC ROLL's shocks, CHAIN LIGHTNING's jumps.
  - **The target:** such a move is used only on an enemy the follower can see. With none in sight it is not used, and it stays ready.
  - **What it reaches beyond the target** is only what can be seen from where the strike comes **[reading]**:
    - from the follower: PETAL BLAZE's ring, ERUPTION, GRAVITY SLAM;
    - from the enemy struck: ARC VOLLEY's, CHAIN LIGHTNING's and SONIC ROLL's jumps; SINGULARITY SHOT's pull and slow; CORRODE SHOT's splash; CHOMP's slow; the equip cards' echoes (NOVA, CLEAVE, CHAIN);
    - from the middle of a field: a burning circle's bite (HEXFIRE), a storm's bite and pull (STATIC VORTEX).
  - **SONIC ROLL's dash** puts the follower's body where it ends, so it needs a straight walk there (the walking test, as PINBALL's roll does), not only sight: never through a wall nor over an object **[reading: stepping over is "Not yet"]**.
  - **The creatures' specials and the player's own jumps need sight too** (built in `2026-11-06j`; the owner, 2026-11-06: "Both need sight"). A special (LEAP, MANDIBLE FRENZY, CARAPACE SLAM, VENOM LANCE, WEB SNARE, BLADE FLURRY, BLINDING DUST) neither aims at nor reaches anything its creature cannot see (js/abilities.js `_abWalled`, beside the Photonic Shield). ARC SLINGER's jump and the Technomancer's arc jump only to a creature seen from the one they leave (js/playercards.js `playerRoundJump`, js/technomancer.js `technoArc`). Nothing in the game strikes through a wall or a tall object now.

### 8.6 FLUX MOVE and cover

A moved object keeps its kind and its traits. It gives cover, and is seen over, where it now stands, and no longer where it stood. The traits live on the solid that `facilitySolidMove` moves, so nothing has to be copied.

### 8.7 Code and tests

- **Code:**
  - `js/facility.js`: `FAC_COVER`, `FAC_LOW`, `FAC_SHOT`, `_facWallCrossed`, `facilitySees`, `facilityShotStop`, `facilityShotReach`;
  - `js/facilityplay.js`: `facilitySeesFrom`, `facilityShotStopAt`, `facilityShotClear`;
  - the seeing uses moved from the walking test in `js/targeting.js`, `js/predator.js`, `js/facilityspawn.js`, `js/technomancer.js`, `js/playercards.js`, `js/combat.js`, `js/techabilities.js`;
  - `js/game.js` (the shot loop), `js/weapons.js` (the laser), `js/npc.js` (the Mage), `js/evolution.js` (`_evoSeen`), `js/stations.js` (the turret);
  - build `2026-11-06i`: `js/evolution.js` (`_evoSees`, `_evoFoesSeen`, `_evoDashOk`, `fieldBite`, `staticVortexTick`), `js/cards.js` (`_equipFoesNear`).
- **Tests:**
  - `tests/cover.js` (new, 19 checks; the real page on a tablet; 22 since build `2026-11-06i`: the moves that strike at once);
  - suites whose fixtures faked sight with the walking test, or placed units outside the building or across walls, were updated: `tests/enemycard.js`, `tests/facilityplay.js`, `tests/followercombat.js`, `tests/technomancer.js`, `tests/mutator.js`, `tests/playercards.js`, `tests/evolution.js`.
