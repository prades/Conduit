# Follower progression: the recruitment posts and breeding (the Vital items were removed 2026-11-01)

**2026-11-01, the owner's playtest:** a death no longer costs a follower anything: it comes back with its HP stat and all its XP ("They need to be revived with the same amount of HP"; on its XP: "Remove it"), its return paid from the Crystal's power (docs/FACILITY.md "The Crystal's power"). So a follower never falls for good, and the **Vital items are gone** ("Remove them"): `js/vital.js`, the three item rows and the five hidden cases. A follower saved with HP stat lost to earlier deaths gets it back on load, up to its born hp (`followerHp0`, now in js/breeding.js). The sections below are the record of what was built on 2026-10-31; where they say otherwise, this note wins.

Built 2026-10-31 (build `2026-10-31g`) from the Game Design Archive's *Next Major Update Framework*, section "Follow-up patch scope — follower scarcity, breeding quality, and Vital Prisms (2026-10-31)", and the brief that went with it. Three systems, each on the paths the game already had. Everything numeric is provisional and listed in docs/OPEN-QUESTIONS.md §1f.

The code: `js/followerspots.js` (the posts), `js/breeding.js` (breeding), `js/vital.js` (the Vital items), `js/inventory.js` (the three item rows), `js/facilitymap.js` (the five hidden cases), `js/clone.js` (`RECRUIT_COST`), and the record of a follower's birth through `js/facilitysave.js`, `js/game.js` (the respawn queue) and `js/specimen.js` (a preserved body). The tests: `tests/followerprog.js` (the suite of these three), `tests/followerspots.js`.

## What a follower's numbers are (the audit, unchanged)

- A follower is made from its personality (`applyPersonality`, js/species.js: hp 20 / defense 10 / attack 10 / speed 10 / special attack 10 / accuracy 10 / will 20, each times the personality's factor). Those creation stats are its **base**; its level scales the base into its **stats** (`levelledStats`), the evolved form and the equip cards multiply at apply time, and `maxHealth = round(stats.hp × 1.25 × the cards)` (`_applyFollowerLevel`, js/levels.js). Everything derives from the base, every time.
- **Every death took 1 off the base hp** (until 2026-11-01: now it takes nothing, and the respawn queue carries the base as it was). At 0 the follower **fell for good**: its body lies where it fell, an Ice Mage preserves it in a capsule, and the capsule used at the Crystal (the Resurrection Zone) brings it back from its record (js/specimen.js, `spawnFollowerFromSave(rec)`).
- Shards: `shardCount`; a new game starts with 100; kills pay on the spot.

## 1. The recruitment posts (`js/followerspots.js`)

The eight pads of the map (`FACILITY_MAP.followerSpots`, stable ids `spot_lobby … spot_cold`) are **posts**, each with its egg of a fixed type and element.

- **The claim**: walking within `FP_SPOT.take` (1.5 tiles) of the egg makes the follower right there (as before: `spawnFollowerAtCrystal`, put on the pad, no walk home) and claims the post in the same synchronous step (`facilityFollowerSpotTake`): one function, one check, one follower. Called twice in a frame it claims once. **Free**: the owner's decision (2026-10-31) after the brief's ◆200 was built; `FP_SPOT.price` is kept at 0.
- **The price machinery** (kept, tested with a price set): short of `FP_SPOT.price` nothing moves. The egg stays, nothing is taken, nothing is made; the pad says `NEED ◆n FOR THIS POST · YOU HAVE ◆m` once, and again after you walk off (2.5 tiles) and back. With the price at 0 the pad reads `FREE · ONCE · WALK UP TO IT`.
- **The squad full**: who makes room is asked first (`partyPickOpen`, as the quick recruit's); the post is claimed once a choice is made; CANCEL leaves the egg.
- **Exhausted**: a claimed post has `used = true`, no egg, never fills again, and its pad goes dark with a cross; within 8 tiles the label reads `CLAIMED · ITS RECRUIT IS YOURS ALREADY`. The other posts are each their own; there is no limit on how many you claim. An unclaimed egg that goes some other way is put back once you are more than `FP_SPOT.near` (4 tiles) away.
- **Saved**: `followerSpotsSnapshot` writes the claimed ids (`{ spot_deck: 1 }`); `followerSpotsApply` marks them claimed and removes their eggs. An older save kept a refill delay per empty spot; such a number is read as claimed (the egg had been taken). The refill (`FP_SPOT.refill`, 90 s) and the roster cap (`FP_SPOT.cap`) are gone.
- **The quick recruit** (js/clone.js, the roster's + RECRUIT button, the carousel's tile, the phone's roster): `RECRUIT_COST` is **◆200** (it was 30): the archive's direct purchase. It is not limited.

## 2. Breeding (`js/breeding.js`)

- **Who**: two followers that have **bonded** (js/bonds.js: they fought side by side within 2.5 tiles long enough; `partnerUid`). A clone never. Neither parent is used up or changed.
- **Where**: the roster. The Command Center's settings column for the creature in view has `BREED WITH <partner> ◆50`; the phone's roster card has the same button when the follower is bonded. Two taps: the first arms it (4 s), the second pays, so a double tap makes one offspring and pays once (`breedTap`). With the squad full, who makes room is asked first and nothing is paid until it is chosen (`breedStart`).
- **The price**: `BREED.price` = **◆50**, taken after the offspring exists (`breedMake`: parents checked, offspring made, price taken, in one synchronous step).
- **What comes out**: the **lead** parent's type and element (the higher level; a tie: the one in view), a personality of that type (so its role is the type's, as a recruit's), at the recruit level, unbonded, no cards, at the Crystal, and a base of its own.
- **The formula** (`breedBase`), for each stat `s` in `BREED.stats` = hp, attack, defense, specialAttack, accuracy, will:

      base[s] = min( BREED.cap × own[s],  max( own[s], (A[s] + B[s]) / 2 ) × BREED.upbringing × (1 + v) )

  where `own` is `applyPersonality(the offspring's personality)` (what a recruit of that personality has), `A` and `B` are the parents' bases with their **born** hp in place of what deaths wore it down to (`breedParentBase`), `v` is a draw in [−`BREED.variation`, +`BREED.variation`] per stat (a test injects the draw), `BREED.upbringing` = 1.05, `BREED.variation` = 0.03, `BREED.cap` = 2. The result is kept to three places (as the equip cards keep a moved stat); speed and resonance are untouched.
  - So an offspring is at least `own × 1.05 × 0.97` = +1.85% above a recruit of its personality on every listed stat, on average +5%, and never past twice one however many generations breed.
  - **Measured** (tests/followerprog.js, 150 offspring of one pair): the upbringing term averages 1.05 ± 0.01 on every stat; the worst offspring is ≥ 1.018 × a recruit of its personality on every stat.
- **Applied once**: the bonus lives in the base only. `_applyFollowerLevel` derives stats and health from the base on every level-up, reload (`followerBuild`), respawn (the queue entry's `base`) and restored body (`rec.base`); nothing is added again anywhere.
- **Provenance**: `f.bred = { gen, parents: [uidA, uidB] }` (gen = the parents' highest + 1) and `f.hp0` (its born hp, what the Vital items restore to). Both are in `followerRecord` (the save, a fallen body's record), restored by `followerBuild`, carried by the respawn queue and its rebuild, and cleared by a RE-ROLL (someone new). A recruit's record writes neither. The INFO's VITALS show `ORIGIN: BRED · GEN n` (or `RECRUITED`).

## 3. The Vital items (REMOVED 2026-11-01; this was `js/vital.js`, `js/inventory.js`)

| Item | Puts back | Rarity | Stack |
| --- | --- | --- | --- |
| VITAL FLECK (`vital_fleck`) | +5 hp stat | common | 5 |
| VITAL PRISM (`vital_prism`) | +10 hp stat | uncommon | 5 |
| VITAL CORE (`vital_core`) | +20 hp stat | rare | 5 |

- Consumables of the pack's own table (SAMPLES tab, any class; not cards, not a heal). USE from the pack calls `vitalUse(id)`; the pack removes one only when it returns ok.
- **The born hp** `followerHp0(f)`: `f.hp0` if it has one (bred), else `applyPersonality(f.personality).hp`. **What deaths cost**: `followerHpLost(f) = hp0 − base.hp`.
- **The target** (`vitalTarget`): the one follower picked in the roster (`ccSelectionList()`), however far; two picked: refused; none picked: the nearest living follower within `VITAL.range` (8 tiles). Never a clone, never one that is dead, waiting to come back, lying as a body or sealed in a capsule (none of those are in the living roster, and the item touches no queue, body or capsule). A follower that has lost nothing is **not a target**: nothing happens, the item is kept, the pack says it is whole.
- **The effect**: `base.hp = min(hp0, base.hp + n)` then `_applyFollowerLevel(f, false)`: the maximum health rises at once and the current health by the same (the level-up rule). Exactly once per item; a second item on a whole follower is refused and kept.
- **Death rules untouched**: a death still takes 1 off the base; at 0 the follower still falls for good; the capsule and the Crystal still bring it back with the base it fell with (1), and a Vital item can then mend it. Nothing revives.
- **Persistence**: the base is what the save, a respawn and a body already keep; the mended value rides with it. A taken case is in the save's `taken` list.
- **The five hidden cases** (`F.pickups`, once each, the usual case with a beacon): `pk_vital_tunnel` (a Fleck) at the west end of the collapsed tunnel's broken-off floor, behind the choke (the water sample is at its east end); `pk_vital_cistern` (the Core) in the cistern's far north-west corner, behind the boss gate, the queen's room; `pk_vital_cave` (a Fleck) at the very tip of the Cold Storage's ice cave past the technician's pad; `pk_vital_armory` (a Prism) in the Armory's north-east wall alcove; `pk_vital_arena` (a Prism) in the one-tile alcove of the arena's west wall. 50 hp stat in all. The arena catwalk was considered and left out: the player never walks it.

## Not built, and open

- The Sanctuary room, its keeper and the breeding wait of the archive's design; a limit on the roster's + RECRUIT; raising a follower past its born hp; the cross-generation rule's other reading. All in docs/OPEN-QUESTIONS.md §1f.
