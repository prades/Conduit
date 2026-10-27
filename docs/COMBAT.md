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

Counterplay that already exists and now has the time to be used: COME and RETREAT (js/mixtool.js) pull the squad out during a wind-up, and the Mutator's clone with it (docs/MUTATOR.md); HOLD posts them out of reach; the Mutator's serum (docs/MUTATOR.md, the brief's step 7) will heal the area.

A clone bites in the same two beats as a creature, with the same telegraph in your side's teal (js/clone.js `cloneFight`, docs/MUTATOR.md §2.1); the Mutator's lash has two beats too (a draw-back, then the lash).

## 3. Tentative, not decided

The defaults above are a first pass so a fight can be read; they are not balance. Raise or lower them in one place. Follower health was **not** raised: with the cap at 0.34 and single-target bites, a squad of three against three ants takes a third of the hits it took, and a lone follower dies in four bites spread over about four seconds instead of three in two.
