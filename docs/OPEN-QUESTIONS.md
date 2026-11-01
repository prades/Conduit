# Open questions

*Written 2026-10-30 after Pack 1 went onto main (`0f41843`), and rewritten the same day after the owner answered the fifteen questions of the first version and the market follow-ups ("round 2": build 2026-10-30g), then again after the owner answered the eight questions that round left (build 2026-10-30h, 72 suites). For the owner and anyone reading along, a second AI included.*

The first version of this file listed fifteen choices I had made that the briefs did not ask for. **Every one now has an answer** (section 1), and so does each of the eight that the market left (section 1c): all are built and tested. Nothing market-related is open any more (section 2).

## 1. Answered in round 2 (built and tested)

| # | the question | the owner's answer | what the game does now |
|---|---|---|---|
| A1 | What a card from a pack becomes | **Found for the run.** ◆1,000 keeps one for good | `EQUIP_PACK.keep = "run"`: usable at once by a follower of the element, gone with NEW GAME, kept in the run's save |
| A2 | A pack card must be found before its ◆1,000 unlock | **Yes** | FIND IT IN A PACK FIRST (`EQUIP_PACK.unlockNeedsFind`). The six Crystalline cards, which no pack deals, are still bought outright |
| A3 | A card found twice | **A special buy menu** (section 1b) | a duplicate pays credits; a market sells the cards |
| A4 | Where and when a pack can be bought | **Any time on the CARDS screen** | no pause, no cooldown, no limit but the ◆100 |
| A5 | "Across all damage categories" (Impact Studs, Bedrock Matrix) | **Every hit a follower lands** | one multiplier in `applyDamage`; a set amount and a burn's tick are not multiplied |
| A6 | Poison and paralysis did not exist | "Poison has no damage, it just makes the creature weak, and electric makes the affected glitchy and mess up wind-up actions." And **make the Frost Maw's and the Manta's stuns real** | **Poison is a weakness:** no damage, the creature's bite lands for x0.6 (40% weaker) for 4 seconds, at 15% a hit. **Static Lock is a glitch:** every wind-up it tries fails (the rear-back before a bite, an ability's charge-up) for 0.5 seconds, at 10% a hit; it still walks; it flickers and says GLITCH. **The Maw's stun (75 frames) and the Manta's (45) are real:** the creature does nothing, and a bite it was winding up is cut short. The old poison and paralysis are gone |
| A7 | Burn damage and the target's defense | **Defense still applies** | a burn's tick goes through `applyDamage` with no attacker, as the game's own always did |
| A8 | Which hits can proc | **Every direct hit** | one roll per proc card, per target the hit reaches; not a reflected hit, a set amount, a hit a shield took, or a tick |
| A9 | Small bonuses are not rounded | **Keep the exact number** | a stat a card moves is kept to three decimals; maximum health stays whole |
| A10, B2 | Attack speed counts in frames | **The rest between ordinary attacks only** | `followerRest`; signature-move timers and technician abilities keep theirs |
| B1 | "Elemental attack power" | **SP.ATK only** | the Mage's shot and each element's special; not the plain hits or the signature moves |
| B3 | Same-stat stacking cannot happen with the six | **Fine as it is** | the sum is built and tested with stand-in cards |
| 14 | The Game Bible | **Not yet**; later, on 2026-10-30: update it to reflect everything installed | done: see section 4 |
| 15 | `docs/CARD-SYSTEM.md` | **Update it and push `design-notes`** | done on the `design-notes` branch only, never on main |

### 1b. The market (your answer to A3, in your words, and the follow-ups)

> "Should go into a special buy menu, credits that you use to buy the permanent cards actually and a rotating buy menu that refreshes every 5 mins cards go from 90-650 credits and duplicates cannot be found here and the credits you get from each pack is equivalent to 25% of what the market value of the card is. You can also buy the cards with actual shards too."

| the point | decided with you | where |
|---|---|---|
| Credits | ◇, **the run's own** ("reset each run"): NEW GAME clears them; the run's save keeps them. They are shown exactly, halves included (◇22.5), see 1c | `equipCredits`, `equipReset` |
| What pays them | **only a duplicate** in a pack: 25% of the card's market value (a half is possible: 22.5) | `equipPackOpen` |
| What a duplicate is | a card **in your hand or already found this run**. A card you own for good but did **not** bring is **not** a duplicate: it is found for the run and pays no credits (so you can wear it beyond the hand's three) | `equipDuplicate` |
| Market value by rarity | **90 / 150 / 250 / 350 / 500 / 650** (Unrefined, Refined, Precision, Prototype, Lustrous, Crystalline). Pack 1 deals the first three | `EQUIP_MARKET.values` |
| The shelf | **six** cards, not in your hand and **not found this run**. It may list a card you own for good but did not bring. **Only cards a pack deals:** the six Crystalline cards are not sold. **Dealt with the pack's own odds** (60 / 30 / 10), see 1c | `equipShelfPool`, `equipShelfDeal` |
| The clock | a new shelf every **5 minutes** of the **game's own clock** (18,000 frames), saved with the run, so a reload keeps the same six cards and the time left. **It waits while the CARDS sheet is open**, see 1c | `EQUIP_MARKET.every`, `equipTick`, `equipShelfSync` |
| Paying | the card's value in **credits, or the same number of shards** | `equipMarketBuy` |
| Buying | a card **new to you is kept for good and found**; one you already own for good is **found for the run** and nothing new is written | `equipMarketBuy` |
| The ◆1,000 unlock | **stays beside the market** | `equipUnlock` |
| The screen | a MARKET section on the CARDS sheet (the shelf, its clock, two prices on each card, two taps to buy); the header shows the run's credits; the pack's reveal tags each card NEW or DUPLICATE · +◇ | js/cardsui.js |

### 1c. The eight questions the market left (answered, 2026-10-30)

| # | the question | the owner's answer | what the game does now |
|---|---|---|---|
| N1 | The flat ◆1,000 unlock is 4 to 11 times a shelf card's price (90 to 250) | **Keep ◆1,000** | unchanged: the premium for keeping a card you already found, since a found card never appears on the shelf |
| N2 | The shelf is a flat draw; a pack is 60 / 30 / 10 | **Weighted like a pack** | **built:** each place on the shelf rolls a rarity by the pack's own weights (`EQUIP_PACK.rarities`), then takes one of that rarity's cards: mostly Unrefined, a Precision card on about half the shelves (47%), none kept for it; a rarity with no card left is left out of the roll; the shelf follows the pack if the pack's odds are tuned |
| N3 | A bought card's place stays empty until the next shelf | **Leave it empty** | unchanged |
| N4 | Credits come in halves (a duplicate of an Unrefined card pays 22.5) and the header rounded down | **Show the half** | **built:** the header reads ◇22.5 (a whole number still shows no decimal), a price says exactly how short you are (NEED ◇67.5 MORE), the pack's reveal says +◇22.5; the sheet draws again for a half |
| N5 | A weakened creature bites 40% weaker but its abilities do not change | **Bite only** | unchanged: abilities are answered by Static Lock's glitch |
| N6 | The shelf's clock runs while the CARDS sheet is open | **Hold it while open** | **built:** the time spent with the sheet open is not the shelf's (`equipShelfSync`: the sheet's opening and closing, its redraws, the tick and a save all sync); a shelf that is due when you open the sheet is dealt first; the note says THE CLOCK WAITS WHILE THIS SHEET IS OPEN; the game itself still keeps running |
| N7 | A phone cannot buy a pack or use the market | **Later, as planned** | unchanged |
| N8 | The values of Prototype (350), Lustrous (500) and Crystalline (650) are unused | **Keep them** | unchanged: used when a later pack deals those rarities |

## 1d. The Sewers' quest, the boss and Series 2 (built 2026-10-31; docs/SEWER-QUEST.md)

Decided with you by buttons before building, and built: the Sewers' boss is **a toxic ant boss**; the sample puzzle's second solution is **a fire technician launched into the collapsed tunnel, which drills the choke open from inside** (the first is a flux technician's Telegrab); the non-lethal end is **the boss calmed, alive, keeping its lair**. The quest's states, the module (the brief's ◆800; **◆300 since build `2026-11-01a`, at your word**), the install, the cycle that clears the water, and the saves are in `js/quests.js`, `js/bosses.js`, `js/puzzles.js`.

**The archive, read later the same day** (the Notion connector came back): it has **no Series 2 card list**, and its boss page leaves the Sewers' boss unspecified; its faction-progression page proposes the **Toxic Ant Queen** for the Sewers and the **Ant Queen** for the first nest; its non-lethal design is a **distress state** at about half health with follower control effects opening the install window; it approved **Booster Pack 2** rules on 2026-10-30 (unlocked after the first boss, all six rarities, one Precision-or-higher card per pack; price and odds open). You chose, by buttons: write the status to the archive; Series 2 is that Pack 2 and a spared boss counts for its unlock; apply both queens' names, provisional; build the distress window and thin the brood after purification. All built (`2026-10-31d`).

- **Where the archive and the build differed, by your decision:** the archive's puzzle note wants an Electric Technician **jump pad carrying the player**; the build launched a **fire technician** in, as you chose. Recorded in the status page. **Redone later the same day (build `2026-10-31j`) at your word:** the puzzle has three ways, each on its own: Telegrab; the launcher **carries the player** over the choke onto the tunnel's broken-off floor (the archive's jump pad after all) and its broken edge drops them back; a fire technician **drills the choke from the ledge**. The tunnel is six tiles across now (docs/SEWER-QUEST.md). Nothing new was invented in numbers: the ride uses the launcher's own flight, the jump the broken section's, the walk to the pad the throw's reach and wait. **Asked and answered (2026-11-01):** the ride costs nothing (no cooldown, no damage to the rider, ridden again at once), by your choice; build `j` went to main the same day.

Still open from that work:
- **The queen's numbers.** Level 6, the ant species' boss block: provisional; the archive says to measure the live game before setting them. (The distress cycle of build `d` is gone: the archive's later rules replaced it, §1e.)
- **The Nest's encounter.** The row names the Ant Queen with no lair, level or numbers; the nest area has no entrance. The archive's proposed Ant Queen fight (lunge, brood call, nest tremor) is a design, not code.
- **Series 2 cards.** The list, its effects and numbers, and the pack's price and odds: none exist in the archive. The pack stays off sale until they do. **Settled in build `2026-11-01j` (§1j):** 32 cards from the owner-approved draft, the price and odds picked at the owner's word.
- **A reward for sparing the queen.** The archive calls it valuable and undecided; nothing is granted.
- **After purification:** one straggler ant at a time, one every 100 s, is my number for "a few incidental insects may remain".

## 1e. The Toxic Queen's rules, Side Quest and the Sleeping Potion (built 2026-10-31, build `f`; docs/SEWER-QUEST.md)

Built from the archive's newest sections (the patch frame, the clarifications, the encounter flow, the phase transition, the ant-wave size, the quest-line terminology) and your instruction: the term is **quest line**, and Side Quest's line after the queen's fate is decided is **"…"** for either outcome. What the archive left open was built provisionally and marked so in the code; what it asked to be decided before coding is listed here, undecided:

- **The 50-coin rule.** The archive's older "50 coins for another potion after a use in combat" conflicts with its specific "50 shards for the next potion once it has been used on the sewer boss", and the game has no coins. Built: ◆100 from Side Quest, ◆50 for the next once a potion has put the queen to sleep (spent by that purchase), ◆100 otherwise (a lost potion). A use on an ordinary creature changes no price. **Your call**: drop the coin rule, or make a use on any creature in combat earn the ◆50.
- **"One-fourth effectiveness"** of the lab's copy: read as a quarter of the sleep (75 frames to the original's 300), the same radius, enemies only. The archive asked for the measure to be defined.
- **Damage and sleep.** A sleeper is not woken by a hit (your followers must be able to hold a sleeping queen while you install). The archive leaves resistance and immunity open.
- **The queen's provisional numbers**: her guard 2.5 tiles; her leash and roam 15 tiles (the cistern); the bomb's 12 tiles of reach, 1.6-tile burst, 1 s wind-up and 1 s flight; the spit's 3-tile trigger, 1-tile burst, half a second each way; a wave of 4 nymphs (the archive: start at 4, up to 6), the first 30 s after she wakes, level 2 to 3; her frantic pace at 3 times her own; the sleep of 5 s on every creature (the archive gives only the queen's); the potion's 3-tile area and 4-tile reach. The archive's fixed numbers are built as given: 45 s, 10 s, 30 s, 50%, about 10 s to install, about 5 s of sleep, ◆100 / ◆50 / ◆100.
- **Poison on you**: the game's poison is a weakness, so yours is too (your hits at 60% for 2 s). The archive says only that it should wear off quickly.
- **Side Quest's look and lines.** He is drawn in code (a small black saucer with chasing rim lights on four tiny legs); the saucer design family (design/evolutions/forms26.js, Nos. 661–683) is the candidate for a proper sheet once a piece is approved (docs/ART-PROCESS.md). His opening is the archive's word for word; the other lines are mine, to polish. His spot: the south ledge's side passage (the archive: "a safe side passage or maintenance platform roughly halfway"). His "gadgets and gizmos", his later inventory and his progression into the Nests: open, as the archive says.
- **The name.** The archive's newest notes say "the Toxic Queen"; the game keeps the name you approved this morning, THE TOXIC ANT QUEEN (provisional either way).
- **Side Quest's reaction to a kill** (disappointment, reduced trust): undecided in the archive; the placeholder stands.

## 1f. Follower scarcity, breeding and the Vital items (built 2026-10-31, build `g`; docs/FOLLOWER-PROGRESSION.md)

Built from the archive's follow-up scope ("follower scarcity, breeding quality, and Vital Prisms", 2026-10-31) and the brief. What was decided on the way, all provisional:

- **The posts are free, once** (your answer, 2026-10-31, to the build that priced them at ◆200: "Free, once"). The roster's + RECRUIT is the direct purchase at ◆200 (was ◆30). `FP_SPOT.price` is kept at 0 with the machinery behind it (a price set there is asked for, said on the pad and refused when short).
- **The roster's RECRUIT is not limited.** Only the posts are finite ("no global one-recruit limit"). If direct recruiting should be scarce too, the button needs a rule of its own.
- **Answered the same day:** the Vital items restore up to the born hp (not past it); a bred line climbs across generations, capped at twice the personality's numbers.
- **Breeding has no room, keeper or wait.** The Sanctuary design's chamber, its keeper and the breeding duration are not built; the offspring comes out at the Crystal at once, from the roster's BREED button (two taps). The pair is any two bonded followers; neither is used up or changed.
- **The formula** (per stat: hp, attack, defense, special attack, accuracy, will): `min(2 × own, max(own, the parents' mean) × 1.05 × (1 ± 3%))`, three places. "No cross-generation stacking" (the Sanctuary page) is read as: the bonus is applied once per follower, at birth, in its base; a bred parent's higher base is inherited through the mean, so a line does climb, bounded by the cap of twice the personality's own number. If climbing across generations should stop altogether, inherit from the personality's own numbers instead of the parents' (one line in js/breeding.js breedBase).
- **The Vital items restore, up to the born hp.** The archive's section is "permanent follower HP-stat restoration" ("restores a follower's permanently lost base HP stat"); the brief's "permanently increase" is read the same way. A follower that has lost nothing is not a target. If a Vital item should raise a follower past what it was born with, the cap is one line (js/vital.js vitalUse).
- **Five cases** (+5, +5, +10, +10, +20: 50 hp stat in all across the facility), at the places listed in docs/FOLLOWER-PROGRESSION.md. The count and the places are the implementer's.
- **The lead parent** decides the offspring's type and element (the higher level; a tie, the one in view). The archive says "offspring inherit one parent's type" without saying which.
- **The Game Bible** records the formula and the measured outcome (150 offspring: +5% on average on every stat in the list, never under a recruit of the personality), as the archive asked, from the test that measures them (tests/followerprog.js).

## 1g. The Nest, the ants, the opened-up Sewers, the clone in the squad and the movement rules (built 2026-11-01, build `g`; docs/SEWER-QUEST.md "The Nest", docs/FACILITY.md)

Built from the phase brief ("Stability, Nest Implementation, Ant Population & Sewer Expansion") and your answers on the way: **"Only one queen in sewers for now"**, **"Make a waterfall and another big sewer gate tunnel entrance"** (with your sketch of the cistern), and the combat step as you shaped it (**"if there's no enemies nearby, there's no limit. But if they run into an enemy, they stop if they're on a run, and then they're limited to moving 5 spaces or something like that"**). What was decided on the way, all provisional:

- **Two queens in the archive, one in the game.** The archive plans the **Toxic Ant Queen** for the Sewers and the **Ant Queen** for the first nest (the map's Nest Area south of the arena, no way in). The brief's Nest "houses the Queen Ant", with "the existing Toxic Ant Queen mechanics" and "avoid duplicating the existing Queen Ant implementation"; you said one queen, in the Sewers. So the Nest is **the Toxic Ant Queen's colony at the Sewers' east end** and the `nest` row (THE ANT QUEEN) stays planned and unarmed. **Your call** when the Nest Area gets its way in.
- **The Nest's state** (INFESTED / STIRRED / CALMED / CLEARED) is read from her encounter and the purification; it changes the brood's numbers only where the purification already did (a queen killed before the water is clean leaves the brood at full numbers, as before). Its other effects are the look (the glow of the eggs, holes and resin). Whether killing her should also thin the brood: **your call**.
- **The arena is ants only** ("initially"). What it becomes later is not set: the spawn table's **stages** wait for an event (the purification, the queen's fate) but no later stage is written. **The effect on the economy, to playtest:** an ant pays 4.0 shards a kill on average against 11.2 for the old mix of six (beetles, scorpions, spiders, mantises, moths pay more), but has 41% of the health, so per point of damage it is about 13% fewer shards; DNA a kill 1.1 against 2.1; the Mutator can only clone ants in the arena now; the spiders' lurking has no spider to do it.
- **"Toxic Ants returning to their normal state after purification"** (the brief's list of items to review): **not built and not defined.** After the purification the brood thins to a straggler, and the straggler is still a toxic ant of the brood. What "normal" should be (no element? not hostile? a different look?) is **your call**.
- **The opened-up Sewers** are the implementer's reading of "widen the left-side areas, open up the river-side sections": the south ledge three tiles deep (the left of the screen as you face the river), a service bridge for a loop, Side Quest on a lit platform in plain sight, the Nest's wide dam. The west end, the north ledge and the puzzle are as they were (the puzzle's three ways are tested unchanged). The waterfall and the moat are scenery.
- **The combat step** (5 tiles; an enemy near within 6 tiles in sight, 10 if it is after you or your squad, 3 s after a hit; the run stops once): the numbers are the implementer's. Settings → COMBAT STEP turns it all off.
- **The room rule** reads "rooms the player has not entered" as "rooms the player is not in": a tap goes anywhere in the room you are in and a little way through its doorways (2.6 tiles). If you meant rooms never visited (a fog of war), it is a different rule.
- **The queen's frantic roam now reaches past the Nest.** Frantic, she roams to spots she can see within 15 tiles of her post (`frantic.roam`, unchanged). The service bridge brought the loop's east end inside that circle, so she can now leave the Nest through her gate, run along the south ledge, cross the bridge and reach the north ledge's east end (the full run's repeat runs caught her there). Unchanged, as the brief asked ("Preserve the existing Toxic Ant Queen mechanics"). Whether she should keep to the Nest (her roam held to its area) is **your call**.
- **The brief's review list (its Part 6), checked against the code; nothing marked done that is not:**
  - *Follower XP for meaningful combat participation:* the rule is as it was: the killer keeps 60% (`XP_KILLER_SHARE`); on a kill by you or a squad member the rest of the squad shares the other 40% wherever they are; otherwise followers within 4 tiles share it (`XP_SHARE_RANGE`, js/levels.js). The clone counts as a member of the squad now. XP by participation (damage done, time in the fight) is **not built and not defined**.
  - *Crystal healing and regeneration:* built (then 0.01 HP a frame while no alarm was up, `CRYSTAL_REGEN`); since build `h` it is the Crystal's idle refill, whole in five minutes (§1h).
  - *Turret repair pressure; the arena's ants targeting and destroying turrets:* **CORRECTED (build `h`):** this said there were no turrets and that the sentries were props. That was wrong: the map's three sentries were working turrets (they fired at creatures while their relay fed them, js/stations.js). The owner: "the facility has permanent turrets [...] Now they become destructible but repairable"; built in `h` (§1h).
  - *Side Quest's visibility and the timing of his encounter:* visibility done in this build (the lit platform); the timing is unchanged (after the lab turn-in and about ten toxic ants killed).
  - *Toxic ants returning to their normal state after purification:* not built, not defined (above).
  - *The Sanctuary chamber, its keeper and the breeding duration:* not built (§1f, "Breeding has no room, keeper or wait").
  - *Series 2's booster content:* the plumbing only; no card list, the pack not on sale (the unlock below).
  - *Future Nests and cavern expansion:* not built. Ready in the data: a second Nest is a row of `NESTS`, a second race a row of `ENEMY_RACES` (five wait with no Nest), the planned `nest` boss row and the map's Nest Area (no way in), and the barred arch (`sewer_arch`) as an entrance to reuse. No caverns.

**The Series 2 unlock, as the brief asked: reported, not changed.** The archive (Notion) says Series 2 unlocks after the sewer purification; the CHANGELOG says Booster Pack 2 unlocks after the first boss encounter is resolved; this file (§1d) says a spared boss counts. **What the code does:** `EQUIP_PACK2.unlock` is `"first_boss"`, met by `bossAnyResolved()` (js/bosses.js): the first boss encounter resolved, **calm or defeated**, either outcome. In the Sewers both outcomes come at the end of the purification or at the queen's death, so the two readings differ only when the queen is killed before the water is clean (the code unlocks then; "after purification" would wait). The pack is not on sale either way (no card list). **Unchanged, your call.**

## 1h. The playtest patch: the Crystal's power, the turrets, the ant raids, whole revivals (built 2026-11-01, build `h`; docs/FACILITY.md "The Crystal's power, the turrets and the ant raids")

The owner played build `g` and answered the questions put to them; what they said is built:

- **Movement:** the combat step is **3 tiles** (five was "too long"). No limit with no enemy near, as before.
- **Ants pay about 11 shards** a kill (money was "too slow"): worker 8, scout 9, striker 14, tank 22 (11.2 on average, the old mix's 11.24). DNA unchanged.
- **Series 2 unlocks only after the purification** ("Only after purification"; it was the first boss resolved either way). The discrepancy of §1g is settled.
- **The queen's death thins the brood**, the water clean or not ("Yes, thin out"); the Nest is CLEARED.
- **Toxic ants return to normal after the purification: they lose the element** ("Yes, lose the element"). The queen keeps hers (PROVISIONAL: she is the Toxic Ant Queen).
- **Kept as they were:** the arena stays ants only after the Nest is calmed ("Not yet"); her frantic roam may leave the Nest ("Keep it"); the squad shares XP ("Keep sharing"); the room rule is the room you are in.
- **The ant raids** ("The ants need to invade and go for the crystal and the turrets"): on a timer, every **3 minutes**, **3 ants**, **turrets first**, then the Crystal; they start **once the Sewers are found** (the first three minutes after, PROVISIONAL); **just the alarm**; they **attack while you are away**. The facility's own alarm is not raised (the implementer's choice: it would rouse the Sewers' brood too); the raid shows the alarm triangle.
- **The turrets** (the three sentries): **destructible but repairable**, **sturdy** (500 health, PROVISIONAL), repaired by standing at one for **10 seconds, free**; they run on the **Crystal alone** (the relays only light rooms and the charging station). Measured with nobody defending and you away (fourteen raids, eight random and six built around tanks): the six without a tank were killed by the hallway turret alone, which lost 6 to 158 of its 500; of the eight with a tank, six wrecked it and two left it at 55, and the Crystal Chamber's two finished what was left; the Crystal was not bitten in any. That is the "sturdy" you chose ("a raid of 3 needs a good while to wreck one; it's often still shooting when you arrive"). A turret aims only at what its shot can hit: the hallway one had been firing at the Experiment Lab's waiting recruit through the wall, which with every shot paid would have drained the Crystal (fixed before this build was committed).
- **The Crystal's power** ("make it to where the crystal powers the turrets, and also powers the revival of you and the followers, and it's tied to the network meter at the top now. And crystal can be charged up 75% by a 50 shard cost, or it'll heal up over time if it's idle"): **one pool, its health**; a turret's shot **0.1%**, a follower's revival **3%**, yours **5%** ("Light"); a **10% reserve**, at or below which nothing is paid; an unpaid follower **waits**, your unpaid revival is **game over**; idle, **whole in about five minutes**; **tap the network meter** for ◆50, +75%; the dial's outer ring is the charge. Nothing is paid while the tutorial runs (the implementer's guard: the tutorial is never a loss).
- **Followers revive whole**: no HP stat lost at a death ("They need to be revived with the same amount of HP"), no XP lost ("Remove it"); so none falls for good. A save's follower that lost HP to earlier deaths gets it back on load (the implementer's reading of the same answer).
- **The Vital items are removed** ("Remove them"), with their five hidden cases.
- **The Ice Mage's preservation and the Resurrection Zone serve the clone** ("perfect for the clone resurrection"): they already did; with followers never falling for good, the clone is what they are for.

Open, for the owner (playtest): the turret's health and the raid's pace (in the measured raids the turrets never let one reach the Crystal; but three ants that do reach it bite about 45 a second together, its 300 in about seven seconds, so once the turrets are wrecked and left unrepaired a raid can end a run fast); whether the first raid should come at once when the Sewers are found; the raid clock is not saved (a load starts it again); whether the queen should lose her element too; whether the turrets should still need their relays in the tutorial (they run on the Crystal from the start now, so they fire in the tutorial's assault).

## 1i. The collection, the first card item, the Series 2 draft (built 2026-11-01, build `i`; docs/UI-STYLE.md, docs/SERIES-2.md)

Asked: "sketch out the items for series pack 2", "give 3D item looks instead of crystal for the first packs designs ... a 3D object that hovers out of the picture of the card itself", "make it sortable by rarity or by the element", then "mini cards that the player can slide through, and the main card that would be in the middle of the slider is the card that is displayed at the top ... its description and card elements are labeled on the side of the card, and the card itself actually changes form and blows up the image and the rarity meters highlight". The owner's answers, asked the same day: the items in the **game-model look**; Series 2 is **40 cards** (5 per identity, Unrefined to Lustrous); **stats low, abilities high**; the slider replaces **the collection**.

- **Built:** the collection as a featured card over a rail of mini cards, sortable by rarity or element (docs/UI-STYLE.md).
- **A preview, awaiting approval:** EMBER PLATING's 3D item. It shows only with `?cardart=items`; the crystal stays for everyone until the owner says yes (docs/ART-PROCESS.md). The other seventeen Pack 1 items come after that.
- **A draft, awaiting approval:** the 40 Series 2 items (docs/SERIES-2.md). Names, effects and numbers are PROPOSED, and nothing is in the game. Still open there: the pack's price and odds, whether Series 2 deals the Crystalline six as its rarest tier, and the order of the work. **Settled in build `j` (§1j).**

## 1j. Series 2 on sale, the Prototype rarity, EMBER PLATING's item live (built 2026-11-01, build `j`; docs/SERIES-2.md)

Asked: "The ember plating looks good. Series 2. Pick a price and set the odds for the pack and make it to where another rarity is unlocked, and that means we should make and push to main." Asked which rarity, the owner picked **"Prototype unlocks"**: Series 2 deals Unrefined to Prototype, and Lustrous comes in a later update.

- **Built:** the 32 cards of the draft's first four rarities, as drafted (one card per identity and rarity; js/cards.js `EQUIP_SERIES2`), with the eight Prototype abilities (Shell block, Regrowth, Nova, Overclock, Absorb, Cleave, Chain, Double charge) and ATTUNED CORE.
- **Built:** the pack on sale after the purification: ◆150, 4 cards, odds 50 / 30 / 15 / 5, one slot Precision or higher (about one pack in three holds a Prototype).
- **Live:** EMBER PLATING's 3D item, without the preview flag. The other cards keep the crystal or cube until their pieces are approved.
- **PICKED by us, at your word** (all provisional, unplayed): the price (half again Pack 1's ◆100, for a pack that opens later and deals stronger cards) and the odds (Prototype rare at 5%, Precision a little above Pack 1's 10%). Every card number is the draft's.
- **The implementer's readings, for your eye:**
  - Nova counts the follower's **hits landed** (not attacks swung).
  - Chain jumps from **every hit** the Mage lands, its shots included.
  - Cleave and Chain deal a share of what the hit took after the target's defense. Nova deals a share of the wearer's SP.ATK.
  - None of the three strikes sets off another card (one hit never chains into many).
  - Shell block and Absorb count only an enemy's hit.
  - Regrowth heals only while the follower is hurt.
- **Fixed on the way:** the market's shelf could sell Series 2 cards before the pack opened; a jelly card's refusal read "FOR JELLYS".

**Answered the same day:** the price and odds are kept ("Keep the price and odds"), and the eight Lustrous cards stay as drafts in docs/SERIES-2.md, to build later ("They're just drafts, so just keep them around").

Still open, for the owner (playtest): the cards' numbers once played; whether a later pack deals the Crystalline six.

## 1k. Pack 1's other seventeen card items (built 2026-11-01, build `k`; docs/UI-STYLE.md "The card items")

Asked: "we'll design the 3D items for the next 17 pack 1 cards right now". All seventeen are modelled in EMBER PLATING's look and baked; they show only with `?cardart=items` until you approve each (docs/ART-PROCESS.md), and everyone else still sees the crystal.

**For your eye, item by item** (yes to all, yes to some, or notes on any):
- **VENOM GLAND** was the weakest at first (it read as a glowing leaf or bulb); it was reworked into a plump sac with two budding lobes, a dark wet membrane and the venom glowing inside it.
- **REPULSOR PULSE**: at the mini card's size its shockwave rings dominate, so it reads as an emitter more than a palm piece.
- **IMPACT STUDS** is a closed knuckle band (it reads as a studded bracelet), not an open strap: a closed loop keeps the picture upright.
- **FROST LINING**: the quilted satin catches the light royal blue rather than dark navy.
- **CINDERBRAND** could pass for a torch at the mini size; the hole in its flame sigil marks it as a brand.
- **The electric three** are brighter and cleaner steel than Ember's dark bands (chosen so they do not go dark on dark); they can be pulled darker.

## 1l. The CARDS screen's two menus, the gold of the cards taken into the run, YOU on the roster, a pack's reveal (built 2026-11-01, build `l`; docs/UI-STYLE.md)

Asked: the shop "in a new menu on the card menu called shop"; the hand and the cards found "consolidated into this rotating thing at the bottom ... sorted under a new assortment of owned cards", and every card viewable "with the same scroll mechanics", unlockable from there; a pack opened "in a straight row with the rarest card ... illuminated from the back"; then "the hand part should be out of the picture", the cards "permanently unlocked and that the player brought along with them" lit "yellow, matching the purchased button color scheme", "a new player icon and player card in the roster that the player can equip their cards to their own player", and "remove the entire bordered in menu". All built as asked. **Chosen by us, for your eye:**
- **Found cards are now teal** (their ★, outline and state), so the gold is the hand's alone. Until now the hand was teal and the found cards gold.
- **TAKE INTO THE RUN and IN YOUR HAND ✓** are gold too, like the buttons that buy.
- **YOU is pinned first in the strip**, before the squad, whatever the filters; ◂ ▸ still walk the creatures only (from YOU they go to the first or the last).
- **The player's card shows its hits** (3 / 3 HITS: the player's health is a count of hits, not hit points), its class and rank once chosen, and its two cards as mini cards.
- **Open: the player's slots take Universal cards only** (the rule chosen on 2026-10-30), and **no real card is Universal yet**: Pack 1 is element cards, Series 2 species and class cards, the Crystalline six class cards. Only the test cards (`?cards`) can be worn by the player today. Should some cards fit the player (a Universal series, or any card), or does the player wait for Universal cards?

## 2. Newly open

Nothing market-related is open: the eight questions above were all answered. (What was never decided is in section 3.)

## 3. Not decided, nothing built

- **B4 (carried over).** You chose "block the direct unlock of the Crystalline cards when packs open". That is **not built**, because no pack deals them. It waits for the pack that does.
- **The packs after Series 2:** where Lustrous and Crystalline come from, pack tiers, prices, odds ("higher-tier packs improve the odds"). Pack 1 deals Unrefined to Precision, Series 2 up to Prototype (§1j).
- **Other kinds of card:** Universal cards (the player's two slots have nothing they can hold) and player-class cards. (Series 2 brought class cards beyond the Crystalline six, and the first subclass cards.)
- **Resistances:** how a resistance from a card combines with a subclass's own (CARD-SYSTEM §9).
- **The card list, final values and balance:** every Pack 1 number is an initial setting, in one table (`EQUIP_PACK1`, js/cards.js); the market's in `EQUIP_MARKET`. The rarity of each future card.
- **Card art:** the design asks for low-poly 3D artwork and kanji-inspired graphics. One card has its 3D item (EMBER PLATING, live since build `j`); the other Pack 1 items are next, then Series 2's. No kanji.
- **A phone's CARDS screen and slots.**
- **Jelly's damage profile and the universal attack index:** both listed as missing in the Notion archive.

## 4. Documents and records out of step

- **Notion (2026-11-01).** The connector failed to connect for this whole phase (an HTTP 400 on every call): nothing of build `g` is in the archive. The status text for it is ready to paste (the session's scratchpad, notion_2026-11-01g.md), and the old card status text (§4 below) is still waiting too.
- **Notion (2026-10-31).** The connector failed for most of the session; when it came back the archive was read (the Next Major Update Framework, the Boss Encounter Framework, the Enemy Faction & Biome Escalation page, the archive root) and the implementation status was written as a new child page under the Game Design Archive (section 1d above says what the read changed).
- **Notion (earlier).** Its connector failed to connect in this session (an HTTP 400 on every call), so the Archive was never updated, and could not be re-read, for the cards, the Crystalline cards, Pack 1 or the market. It may say something different from the above: please compare, above all on how cards are found, pack contents and odds, whether a pack's cards are permanent, and the poison and paralysis wording (both gone). The text still to be written there is in the session scratchpad: `/tmp/claude-0/-home-user-Conduit/dee5ef54-ced0-50c5-bf19-ef4dca8550bd/scratchpad/notion_status_2026-10-30.md` (sections 1 to 8; the older copy on the `design-notes` branch, `docs/NOTION-UPDATE-PENDING.md`, lacks sections 6 to 8).
- **`docs/CARD-SYSTEM.md` (on the `design-notes` branch only)** was updated and pushed to `design-notes` in round 2 (never to main): everything built, and every answer above.
- **Game Bible (`bible.html`)** was brought up to date on 2026-10-30, at your request ("update the game Bible to reflect all of the different installations"), after your earlier "not yet". New in part 05: *Subclasses*, *Equip cards: slots, the hand and the CARDS screen* (with a picture of the screen, `img/bible/ui/cards_sheet.webp`, made by `design/bible/pictures.js cards`), *The cards, and what they do* (all 24, from the code's own tables) and *Booster packs, found cards and the market*. Changed in place: the table of statuses (the weakness, the glitch and the stuns), the signature moves (the rebuilt Quill Burst, and the Frost Maw's and the Manta's stuns, which now work), a respawn keeping the role and the cards, the roster's CARD 1, CARD 2 and SUBCLASS, the dock's CARDS button, the saves (the run's `cards`, the collection at `conduit_fp_cards`), the economy (credits, the pack, the unlock), the file list (70 scripts), the tests (72 suites, 27 in a real browser) and the open lists. Every number it quotes about cards is tagged and checked against the code by `tests/bible.js` (2,273 numbers). The older draft in the session scratchpad is obsolete. The picture of the CARDS screen is the only new one: the older pictures (the HUD's dock, the Command Center) are as they were made, so they do not show the CARDS button or the card slots.
- **`tests/visiblearea.js`** is a known flaky real-browser timing test (about 1 run in 14 on main).
- **This file** is on the working branch (`claude/start-game-project-HSh7Z`) and goes to main with the builds the owner sends there (main has had it since build `h`).

## 5. Already decided: please do not reopen

- Five subclasses (Jelly is the fifth), set by form from the roster chart. An egg and the ten retired forms have none.
- Two card slots per follower; the player has two Universal slots.
- A card is a type: any number of units may wear it, never twice on one unit, and it is never used up. Cards move freely between followers. Exile, falling for good and a re-roll empty the slots, and nothing is lost.
- A permanent unlock is a flat ◆1,000 shards, paid from the run's shards, for a card found first (a card a pack deals) or outright (the Crystalline six). The collection survives NEW GAME.
- At the start of a run you pick up to 3 cards from the collection, and the hand can be changed from the CARDS screen during the run.
- The CARDS screen is a dock button, always shown, on tablet and desktop; phones come later.
- Rarity names: Unrefined, Refined, Precision, Prototype, Lustrous, Crystalline. A rarity chip of illuminated bars (1 to 6) shows it.
- Pack 1: ◆100, exactly 4 cards, Unrefined, Refined and Precision at 60 / 30 / 10, one slot reserved for a Precision, no card twice in a pack; the 18 Element cards and their numbers. What it deals is found for the run.
- The six Crystalline class cards, each +50% to one stat.
- Quill Burst's numbers (range 4, +25% on a hit, every 4 seconds, no burn).
- The market: everything in sections 1b and 1c.
