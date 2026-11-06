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
- **Side Quest's look and lines.** *His look is answered:* the void walker (your decision of 2026-11-02), built in `2026-11-02f`; until then he was a small black saucer drawn in code, and the saucer design family (Nos. 661–683) is set aside. His opening is the archive's word for word; the other lines are mine, to polish. His spot: the maintenance platform off the north ledge since 2026-11-01 (first the south ledge's side passage; the archive: "a safe side passage or maintenance platform roughly halfway"). His "gadgets and gizmos", his later inventory and his progression into the Nests: open, as the archive says.
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
- **The lead parent** decided the offspring's type and element (the higher level; a tie, the one in view). The archive says "offspring inherit one parent's type" without saying which. **Superseded** by your design of 2026-11-02 (`CONVERSION.md`), built in `2026-11-02f`: the element is drawn between the parents', the class among the three.
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

**Answered: yes to all** ("Yes push the card art for everyone", after "They're a little bit too big", which build `m` answered by shrinking them). All eighteen are live since build `n`. The notes that went with them, for the record:
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
  - **Answered by the design, and built in build `2026-11-02c`** (Build B, §1m): the Universal kind is retired and the player's slots take Player cards only, so they stay empty until the Player cards come.
  - **Designed 2026-11-01 and 2026-11-02:** each follower class gets a card family. **Mages** wear their element's aura (+5% to +10% attack damage to every follower near). **Brawlers'** opportunity cards add +20% to +40% to a hit that exploits a weakness. **Technicians'** cards shorten waits and add charges. The player's two slots take **Player cards** only, for now: 18 elemental roles. The rules and the open questions: `UNIVERSAL-AND-PLAYER-CARDS.md`. The damage-type chart the Brawlers need was designed on 2026-11-02: `COMBAT.md` §7.

## 1m. Build B: the class card families, Series 2 reshaped (built 2026-11-02, build `2026-11-02c`, on the branch; `UNIVERSAL-AND-PLAYER-CARDS.md`, `SERIES-2.md`)

Asked (the owner, 2026-11-02): "mages get aura cards, and the brawlers get opportunity bonuses ... And then technicians get cool down management"; the tiers, the reach, the openings, the clone, the cut and the refund as answered that day; the 21 names approved ("Approve all 21"); then "Start Build B". All built as designed. Tested; not playtested.

**For your approval:**
- **The Prototype aura's status chance: answered.** "Raise to 10%" (build `2026-11-02d`).
- **The rings and glints: answered.** "It shouldn't be displayed or affected in other rooms": the ring is cut to the Mage's room, and the aura reaches no unit in another room (build `2026-11-02d`).

**Readings we took where the design did not say** (each easy to change):
- **"The same aura counts once" is read as the same card.** Two Mages wearing KINDLING BAND give +5% once. One fire Mage wearing KINDLING BAND and HEARTH SIGIL gives both (+12.5%), as two different cards always add up. **Confirmed:** "Both count" (2026-11-02).
- **Two opportunity cards on one Brawler add their shares** (PRESSURE SPUR and RUPTURE FANG: +60% an opening), as every card adds.
- **A Prototype aura's status uses the numbers of Pack 1's Precision card of its element** (a 3-second burn of 3 a second, a 4-second weakness of 40%, and so on), as ATTUNED CORE does.
- **The clone's whole hit grows by the aura's share:** its damage all comes from its power, its one attack stat. A follower's ATK is the physical part only.
- **The ring is drawn over the floor and, faintly, over the units,** not under them. The floor is drawn tile by tile among the units, so a ring under them would need a new drawing pass. Since build `2026-11-02d` it is cut to the Mage's room (the owner's answer), and since build `2026-11-02e` it is drawn on the floor itself, so no wall shows it ("It shouldn't show up on the walls either").
- **The refund shows a line when it is paid** ("◆3000 BACK · 3 SERIES 2 CARDS YOU OWNED WERE CUT"), and the run is saved at once.

## 1n. The following update approved; STORMCALLER (2026-11-02)

- **The following update** (`FOLLOWING-UPDATE.md`): "Approve as drafted". Its gates are still open: the 18 Player card kits, the looks' mockups, each card item.
- **STORMCALLER** was both the electric Technomancer's Player card role and a planned player class. The owner: "Rename the Player card". The role's new name was drafted with the kits (SURGE ENGINEER, LAMPLIGHTER, ARC WARDEN). **Answered:** "ARC WARDEN".
- **The 18 Player card kits:** drafted and **approved** ("Approve as drafted"), with the player's hits taking the role's element ("The role's element"; `COMBAT.md` §7.9). The kits are in `UNIVERSAL-AND-PLAYER-CARDS.md`, "The 18 kits".
- **Build C's open point:** whether Side Quest's picture in the dialogue box changes with his sprite. **Read in Build C (`2026-11-02f`) as yes:** the box shows the void walker's sheet facing you, as part of "drawn as the void walker". **Answered:** "Keep as built" (2026-11-02).

## 1o. Build C's readings (build `2026-11-02f`)

Build C followed the approved design (`NEXT-UPDATE.md` Build C). Where it did not say, these readings were taken, each easy to change:
- **The dialogue box's picture** is the void walker too (§1n above). **Confirmed:** "Keep as built".
- **He stands on his legs**, at the evolved followers' size, and no longer hovers: the sheet is a walker. His idle frames play; the action frames are unused.
- **He turns toward you**, to the nearest of his eight facings, wherever you are in the Sewers.
- **His colour stays** (#9fd8ff): his plate and the soft glow at his core, as before.
- **His station's ring is drawn under his feet.** It was drawn after him, so it lay over the walker's body. The saucer had hovered above it.
- **The game's words still called him a drone** in one place: the install step's hint ("THE DRONE ON THE MAINTENANCE PLATFORM ... SELLS A SLEEPING POTION"). That is the archive's description of him ("a small flying robot drone"), so it was left. The in-game guide calls him the void walker. **Answered:** "Say SIDE QUEST". Since build `2026-11-02g` the hint reads "SIDE QUEST, ON THE MAINTENANCE PLATFORM OFF THE NORTH LEDGE, SELLS A SLEEPING POTION."
- **The class draw meets the stat cap more often.** An offspring of another class than its parents can inherit a mean above twice its own number, and that stat is then capped. For example, two Brawlers' cautious Mage gets ATK 16, not about 20. The formula is as approved; only how often the cap applies changed (`FOLLOWER-PROGRESSION.md` §2).
- **The offspring's personality** within its class is still the Crystal's own pick, as a recruit's: it is not one of the seeded draws.
- **Two stale lines in the in-game guide were corrected** with Build C's own lines: the Vital items (removed 2026-11-01) and Side Quest's old spot.

## 1p. Part 1a's readings: the Player card rules and the Gunslinger's six (build `2026-11-02h`, on the branch; `UNIVERSAL-AND-PLAYER-CARDS.md` section 9)

Part 1a followed the approved kits and rules ("Approve as drafted", "The role's element"). Where they did not say, these readings were taken, each easy to change. The owner answered three of them in a prompt (2026-11-02), all as built; the rest stand as readings.
1. **"One at a time", with two slots.** The two slots never hold two roles of one class, so one role at most is awake. A role for each of two classes can be worn: the one for the class you are is awake, the other asleep. *(The other reading: one Player card in the two slots at all.)* **Confirmed:** "One per class".
2. **"It needs the matching class"** is asked when a card goes in: a role goes in only while you are its class (FOR THE GUNSLINGER otherwise). A role already in a slot stays there whatever the class, asleep, through the card tick and a save.
3. **"The gun fires 20% slower"** (CRYO MARKSMAN) is read as 20% fewer shots a second: the wait between shots is divided by 0.8. The service gun goes from 45 frames to 56, the machine gun from 11 to 14, the laser from 28 to 35. That is the convention of the cards' attack speed. *(The other reading, the wait × 1.2, gives 54, 13 and 34.)* **Confirmed:** "Rate × 0.8".
4. **ARC SLINGER's jump:**
   - It is once a shot, from the first creature hit, to the nearest other creature within 2.6 tiles.
   - It deals 60% of the round's damage before defense, as the arc's jump does, and is the round's own kind of hit (Projectile, electric).
   - On the laser it never goes to a creature the beam went through.
   - It sets nothing else off, and it is drawn with the arc's bolt, from creature to creature.
5. **CRYO MARKSMAN's freeze:**
   - "Already slowed" is slowed by anything before this round: a web, a Frost Patch, the round before.
   - The 5 seconds count from the freeze.
   - A boss can be frozen, as by the Frost Maw's bite.
   - FROZEN shows over the creature.
6. **Directions.** RIFT RUNNER pulls toward where you stand when the round lands. BREACH GUNNER pushes away from where the round was fired.
7. **A round that kills** sets nothing on the creature (a status on the dead does nothing).
8. **Where they come from, for now.** The six are Series 2's cards, so like every Series 2 card one is found before it can be kept for good (no outright ◆1,000 unlock). Series 2 deals them, and Side Quest sells the Sewers' three, once all eighteen are built (Part 1d). Until then only `?cards=all` has them. Why: the pack's odds and pool then change once, not three times, and the Sewers' three span all three classes. *(The other way: Series 2 deals each class's six as soon as they are built.)* **Confirmed:** "All 18 together".
9. **The words.** BLIGHT SHOOTER's card says POISON, the game's word for the weakness, as on MIREBLIGHT. The card's kind line reads PLAYER · GUNSLINGER · FIRE.
10. **The look.** A Player card stays gold with no texture: the cards' look is still open (`UNIVERSAL-AND-PLAYER-CARDS.md` §11, item 11). A role asleep is greyed (grayscale, a dashed edge) and marked ASLEEP on the player's card and its slot. The column says when it wakes: "… IS ASLEEP: IT WAKES WHEN YOU ARE A GUNSLINGER AGAIN".

## 1q. Part 1b's readings: the Technomancer's six (build `2026-11-02i`, on the branch; `UNIVERSAL-AND-PLAYER-CARDS.md` section 9, "Part 1b")

Part 1b followed the approved kits. Where they did not say, these readings were taken, each easy to change. The owner answered two in a prompt (2026-11-02), both as built; the rest stand as readings.
1. **Rule 2 for the Technomancer.** The punch and the arc take the role's element. The arc stays all Elemental, so a role's arc meets the triangle in its element; it keeps the arc's blue look.
2. **FORGEMASTER:**
   - the sentries' rounds stay electric and only add the burn;
   - "your repairs" are the turret's (600 → 300 frames) and the relay's (100 → 50).
3. **SMOG ENGINEER and CRYO TECH:**
   - "within 3 tiles" is by distance alone, through walls, as the sleeping potion's area is. **Confirmed:** "Distance alone";
   - "online" is a relay that has been repaired;
   - "for as long as they stay": the status is set again every half second while a creature is in the area, with Pack 1's numbers, so it wears off 4 s (the weakness) or 2 s (the slow) after the creature leaves.
4. **ARC WARDEN:**
   - "in the lamp's light" is within its reach and in sight (walls stop it);
   - the first zap comes at once when the overcharge begins, then every 2 s;
   - the zap costs no charge;
   - each zap is drawn as the arc's bolt from your hand.
5. **GRAVITY ENGINEER:**
   - SWAP is a row on a squad member's card, the card a tablet or a desktop opens from the squad stack. A phone has no such card yet, so no SWAP on a phone. **Confirmed:** "Tablet/desktop only for now"; a phone gets it with that card.
   - It works only with a member that follows you (not one holding a room), and only on your stretch of floor: not across a doorway into another part of the map.
   - The minute's wait starts at the swap and is not saved.
6. **BULWARK ENGINEER:**
   - "in front of you": toward the creature you have locked, when you can see it; otherwise the way you face;
   - it is placed as the core technician places its wall: 3 tiles out, or just in front of a nearer creature;
   - with less than a tile of floor ahead, no shield goes up ("NO ROOM FOR A SHIELD"), and the cell still overcharges the lamp;
   - nobody holds behind it.
7. **SWAP's look:** a purple row, SWAP PLACES ⇄, above INDEX and DISMISS, with a line saying what it does or why not. It is the agent's, for the owner to keep or change.

## 1r. Part 1c's readings: the Mutator's six (build `2026-11-02j`, on the branch; `UNIVERSAL-AND-PLAYER-CARDS.md` section 9, "Part 1c")

Part 1c followed the approved kits. Where they did not say, these readings were taken, each easy to change; they are the owner's to confirm or change.
1. **Rule 2 for the Mutator.** The lash and the clone's bites take the role's element, for the triangle only. The bite stays Piercing and all physical, with the triangle on the whole bite, as on your own hits.
   - "The clone" is the Mutator's own clone, the one the Clone Bay grows for it.
   - Its "bites" are its bite and its POUNCE's bite as it lands. Its special (an ant striker's MANDIBLE FRENZY, a beetle's CARAPACE SLAM) and a striker's or tank's shot are not bites: they take no element and set nothing. *(The other reading: all of the clone's attacks.)*
2. **ASH SURGEON and PLAGUE DOCTOR, the serum's pool:**
   - "in it" is within the pool's 2.6 tiles, by distance, as for the allies it heals;
   - the status lands on each heal beat (every 30 frames, the first at once on the splash), with Pack 1's numbers: the burn lasts up to 3 s after a creature leaves the pool, the weakness 4 s;
   - PLAGUE DOCTOR's "poisons enemies" is the weakness, as its kit says.
3. **CRYO GENETICIST: both readings, as proposed.**
   - (a) A follower's return costs the Crystal nothing while the role is awake when it comes back. With nothing to pay, it does not wait at the Crystal's 10% reserve either.
   - (b) The clone, when it falls, is preserved at once: its body is a specimen capsule, as an Ice Mage leaves one, with its level, its upgrades and what it cost. You take it by walking over it and restore it at the Crystal (`SPECIMENS.md`). A capsule gives no DNA to salvage.
4. **SPLICER:**
   - "the last creature it killed" is any kill of the clone's: a bite, its special, its shot;
   - the element and its status stay the clone's until its next kill of a creature with an element;
   - it is not saved: after a load, or after the clone waited out a switch of class, the clone starts with none;
   - it is kept while SPLICER is off, and works again when SPLICER is back;
   - "SPLICED: TOXIC" shows over the clone when it changes.

   Today only the Sewers' toxic brood and the Toxic Queen have an element, so in play it is toxic or nothing.
5. **CORE SHAPER:**
   - +50% health is added as two ARMOR PLATING ranks add, on top of any bought: with two ranks bought, ×1.5 becomes ×2. It goes beyond ARMOR's top rank.
   - Putting the card on or taking it off keeps the clone's share of health (half stays half), so wearing it heals nothing.
   - "Moves 20% slower" is its walking pace × 0.8, a slow on top of it; its pounce's leap is not slowed.
   - Its knock back is Pack 1's push (0.22), away from the clone.
   - Its health and pace follow the role on the card tick, within half a second.
6. **The words.** "EVERY BITE OF YOUR CLONE TO POISON: …", "ENEMIES IN YOUR SERUM'S POOL, ON EVERY HEAL BEAT, TO BURN: …". SPLICER's first line names the lash only ("YOUR LASH IS FLUX"). When CRYO GENETICIST preserves the clone, the screen says "… HAS FALLEN — PRESERVED AT ONCE, ITS 2 UPGRADES KEPT".

## 1s. The follower combat redesign, the fire and electric moves: readings (build `2026-11-03a`, on the branch; `FOLLOWER-COMBAT-REDESIGN.md`)

This build followed the approved brief and the owner's answers (`DECISION-LOG.md`). Every number is the provisional one in `FOLLOWER-COMBAT-REDESIGN.md` §11.2, to tune in play. Where the brief did not say, these readings were taken, each easy to change; they are the owner's to confirm or change.
1. **QUILL BURST:** the middle quill flies straight at the nearest enemy and the other four fan out evenly either side of it. A quill that touches nobody flies its full reach and is gone. Nothing burns.
2. **FIREBALL:** a name only. The Ember Hood's everyday shot is the Mages' fire shot, which the game already drew as a fireball; its look, numbers and behaviour are unchanged.
3. **HEXFIRE:**
   - the shot does no damage of its own (FIREBALL is the direct hit);
   - it lands on the first enemy it touches, or where it was aimed if nothing was in the way;
   - the circle bites every enemy in it as it lands, then every half second, through the Ember Hood as a move;
   - the retired Cinder Halo, which shares the Ember Hood's move, gets the new HEXFIRE too.
4. **PINBALL:**
   - each collision does the same damage (no rise or fall along the chain), and each hit is a little brighter;
   - it picks only an enemy it can see, and stops at a wall, when it falls, is thrown or is told to RETREAT;
   - its wait counts from the end of a roll;
   - it is the Static Orb's alone: the retired electric brawlers (Storm Manta, Prism Hood, Volt Ring) keep SONIC ROLL by itself.
5. **CHAIN LIGHTNING:** the first jump is 60% of the shot; each enemy is struck once; the Reaver and an electric Mage egg keep the plain shot.
6. **STATIC VORTEX:**
   - it is cast on the nearest enemy in reach, not on the biggest cluster;
   - its bites read the Thunderhead's power (ATK), as every move does. §11.2's provisional value said SP.ATK; the established system has a move read ATK, so this follows it;
   - an enemy can walk against the pull, and a stronger knock is left as it is.
7. **An observation on the existing shots, not changed:** a follower shot touches an enemy within 30 px of (Δx × 60, Δy × 30), so its touch is about half a tile across the floor's x and a whole tile across its y. QUILL BURST's quills therefore spread less sharply in one direction than in the other. It is the shots' existing hit test (`js/game.js`), shared by every follower shot and the sentries, so it was left as it is. A rounder touch would be a separate change, the owner's call.

## 2. Newly open

Nothing market-related is open: the eight questions above were all answered. (What was never decided is in section 3.)

- **A card's words are cut on its face** (seen 2026-11-02, build `2026-11-02j`, on the CARDS screen at 1180 × 820). The face's box shows about five lines, so the longer words run past it and are cut. That is 23 cards: the six Mage CROWNs, the three opportunity cards and 14 of the 18 Player cards (PLAGUE DOCTOR's words are the longest). The EFFECT line beside the stage always shows the whole text. It is not new: the auras and the opportunity cards have been cut this way since Build B. Ways to mend it, for the owner: smaller type on the face for long words; a short line on the face (the role's theme) with the full words in EFFECT; or a taller box. Nothing is changed until the owner picks.

## 3. Not decided, nothing built

- **B4 (carried over).** You chose "block the direct unlock of the Crystalline cards when packs open". That is **not built**, because no pack deals them. It waits for the pack that does.
- **The packs after Series 2:** where Lustrous and Crystalline come from, pack tiers, prices, odds ("higher-tier packs improve the odds"). Pack 1 deals Unrefined to Precision, Series 2 up to Prototype (§1j).
- **Other kinds of card:** the class card families (Mage auras, Brawler opportunity, Technician cooldowns) are built (build `2026-11-02c`, §1m); the Player cards (the player's elemental roles) are designed and approved, and the rules and the Gunslinger's six are built (build `2026-11-02h`, §1p), and the Technomancer's six (build `2026-11-02i`, §1q): `UNIVERSAL-AND-PLAYER-CARDS.md`. (Series 2 brought class cards beyond the Crystalline six, and the first subclass cards.)
  - **Your answers of 2026-11-02:**
    - openings add up; a stun or sleep counts;
    - auras reach 4 tiles, the clone included;
    - the Technician's family is Series 2's four;
    - three tiers, Refined to Prototype;
    - Series 2 reshaped: its eight Brawler and Mage class cards cut, owned copies removed and refunded ◆1,000, the new cards added (63 in all, `SERIES-2.md`);
    - Player cards found in Series 2 at Prototype, and sold by Side Quest after each quest for that line's element, ◆1,000, kept for good;
    - a class switch puts a Player card to sleep;
    - the Universal kind retired.
  - **Being drafted for you:** the 18 Player cards' kits.
  - Answered later on 2026-11-02: the refunds arrive at the next run's start.
  - Still open (section 11): Side Quest's stock beyond the Sewers, the cards' looks.
- **The conversion apparatus and BLOOM** (designed 2026-11-02, not built; `CONVERSION.md`):
  - BLOOM is a seventh, life-giving element.
  - Once the purification quest is done, the apparatus can be installed. A toxic + fire pair's offspring is then BLOOM half the time, and a toxic follower can be converted into BLOOM.
  - An offspring's element becomes a random draw between its parents' current elements, and its class a random draw among the three. *(Built in `2026-11-02f`, Build C.)*
  - **Your answers, second round:**
    - outside the triangles; MEND heals the most hurt ally nearby; blossom pink;
    - three forms over time;
    - only from breeding and conversion;
    - the full card set, with Pack 1 and Side Quest offering it once the apparatus is in;
    - the apparatus a free reward beside the purifier;
    - conversion free, keeping everything;
    - breeding stays at the roster;
    - "Greenshire" a slip.
  - **Open** (its section 11):
    - the apparatus's look;
    - BLOOM's forms: pictures, two names, which comes first, an egg;
    - CONSUME's, SEEDFALL's and REEF's numbers, and where the coral can be climbed;
    - BLOOM's cards' designs;
    - BLOOM's texture and icon.

    Designed since, in words (2026-11-02):
    - MEND heals 2% every hit;
    - SUNDEW, the pitcher-shell Brawler, whose CONSUME swallows an enemy and takes 75% less damage while holding it;
    - the lotus lantern Mage, with SEEDFALL;
    - the coral crab Technician, whose REEF grows coral the player can climb to new areas.

    These are drafts and mockups for your approval. Confirmed last: the other 50% is toxic or fire; Series 2's BLOOM cards wait for the apparatus; an evolved toxic follower waits for its class's BLOOM form.
- **Side Quest's look, and the subclass art** (designed 2026-11-02; Side Quest's look built in `2026-11-02f`, the subclass art not built):
  - Side Quest becomes the void walker, the old flux worker's form (`img/evo/hauler.png`; `SEWER-QUEST.md`). *(Built in `2026-11-02f`; readings in §1o.)*
  - Each of the five subclasses gets a theme, a texture and an icon, and each element an icon. They show on cards, followers and the enemy card (`UI-STYLE.md`).
  - Mockups come first, for your approval.
- **Damage types, race weaknesses, and every hit part physical, part elemental** (designed and approved 2026-11-02; built in `2026-11-02a`, on main since your "Push to main"; the words moved in `2026-11-02b`; `COMBAT.md` §7). Approved: six types, each race's weaknesses and resistances, each follower attack's type, and your rule that every attack is part physical (ATK) and part elemental (SP.ATK).
  - **Your answers of 2026-11-02:**
    - half and half, with an Elemental attack at a quarter and three quarters;
    - the triangle on the elemental part only;
    - evolving raises SP.ATK too;
    - the 18 forms' leans as drafted;
    - the Mage auras stay on ATK;
    - the opportunity card counts both parts of a hit.
  - **Second round, 2026-11-02 (§7.8):**
    - the enemy attack types and your followers' subclass weaknesses, approved as drafted;
    - your own attacks: punch Crushing, lash Slashing, arc Elemental, clone's bite Piercing;
    - the retired forms copy their replacements;
    - a word per part on screen;
    - bosses use their race's row.
  - Answered later on 2026-11-02: the retired forms take their replacement's row when hit.
  - **Built in 2026-11-02a (Build A).** Readings made while building it (docs/COMBAT.md §7.10):
    - **Answered 2026-11-02:**
      - BLINDING DUST's small toxic ticks: "Keep the ticks". The enemy table is corrected.
      - The words' look: "Move beside the creature". They sit to its right at body height, clear of the name plate (build `2026-11-02b`).
    - **Standing unless you say otherwise:**
      - **An egg Mage's shot** is typed Projectile. The rule "an egg hits with its scythe legs: Slashing" is read as its melee.
      - **A player's weapon with an element** (the laser on a selected element) still sets the triangle on the whole hit, as before; the player's hits are not split.
      - **These stay as they were:** a Series 2 card's echo (cleave, chain, nova), and the poison and dust ticks.
  - Still open (§7.9): the later quest lines' elements, the Player cards' elemental part, the icons.
- **Resistances:** how a resistance from a card combines with a subclass's own (CARD-SYSTEM §9).
- **The card list, final values and balance:** every Pack 1 number is an initial setting, in one table (`EQUIP_PACK1`, js/cards.js); the market's in `EQUIP_MARKET`. The rarity of each future card.
- **Card art:** the design asks for low-poly 3D artwork and kanji-inspired graphics. One card has its 3D item (EMBER PLATING, live since build `j`); the other Pack 1 items are next, then Series 2's. No kanji.
- **A phone's CARDS screen and slots.**
- **Jelly's damage profile and the universal attack index:** both listed as missing in the Notion archive. The followers' attack table (`COMBAT.md` §7.4, 2026-11-02) may cover part of the attack index. It was not compared with the archive, because the Notion connector failed to connect this session.

## 4. Documents and records out of step

- **Notion (2026-11-01).** The connector failed to connect for this whole phase (an HTTP 400 on every call): nothing of build `g` is in the archive. The status text for it is ready to paste (the session's scratchpad, notion_2026-11-01g.md), and the old card status text (§4 below) is still waiting too.
- **Notion (2026-10-31).** The connector failed for most of the session; when it came back the archive was read (the Next Major Update Framework, the Boss Encounter Framework, the Enemy Faction & Biome Escalation page, the archive root) and the implementation status was written as a new child page under the Game Design Archive (section 1d above says what the read changed).
- **Notion (earlier).** Its connector failed to connect in this session (an HTTP 400 on every call), so the Archive was never updated, and could not be re-read, for the cards, the Crystalline cards, Pack 1 or the market. It may say something different from the above: please compare, above all on how cards are found, pack contents and odds, whether a pack's cards are permanent, and the poison and paralysis wording (both gone). The text still to be written there is in the session scratchpad: `/tmp/claude-0/-home-user-Conduit/dee5ef54-ced0-50c5-bf19-ef4dca8550bd/scratchpad/notion_status_2026-10-30.md` (sections 1 to 8; the older copy on the `design-notes` branch, `docs/NOTION-UPDATE-PENDING.md`, lacks sections 6 to 8).
- **`docs/CARD-SYSTEM.md` (on the `design-notes` branch only)** was updated and pushed to `design-notes` in round 2 (never to main): everything built, and every answer above.
- **Game Bible (`bible.html`)** was brought up to date on 2026-10-30, at your request ("update the game Bible to reflect all of the different installations"), after your earlier "not yet". New in part 05: *Subclasses*, *Equip cards: slots, the hand and the CARDS screen* (with a picture of the screen, `img/bible/ui/cards_sheet.webp`, made by `design/bible/pictures.js cards`), *The cards, and what they do* (all 24, from the code's own tables) and *Booster packs, found cards and the market*. Changed in place: the table of statuses (the weakness, the glitch and the stuns), the signature moves (the rebuilt Quill Burst, and the Frost Maw's and the Manta's stuns, which now work), a respawn keeping the role and the cards, the roster's CARD 1, CARD 2 and SUBCLASS, the dock's CARDS button, the saves (the run's `cards`, the collection at `conduit_fp_cards`), the economy (credits, the pack, the unlock), the file list (70 scripts), the tests (72 suites, 27 in a real browser) and the open lists. Every number it quotes about cards is tagged and checked against the code by `tests/bible.js` (2,273 numbers). The older draft in the session scratchpad is obsolete. The picture of the CARDS screen is the only new one: the older pictures (the HUD's dock, the Command Center) are as they were made, so they do not show the CARDS button or the card slots.
- **`tests/visiblearea.js`** is a known flaky real-browser timing test (about 1 run in 14 on main).
- **`tests/carousel.js`** (found 2026-11-02): its 1180 px check "a name is cut" fails now and then, because its three recruits get random names and a long one is cut on the strip. It failed 1 run in 4 that day. A fix would seed the test's names, or have the strip fit any name; neither is done yet.
- **This file** is on the working branch (`claude/start-game-project-HSh7Z`) and goes to main with the builds the owner sends there (main has had it since build `h`).

## 5. Already decided: please do not reopen

- Five subclasses (Jelly is the fifth), set by form from the roster chart. An egg and the ten retired forms have none.
- Two card slots per follower; the player has two Universal slots. (Superseded by you on 2026-11-02: the player's two slots take Player cards only, and the Universal kind is retired; `UNIVERSAL-AND-PLAYER-CARDS.md`.)
- A card is a type: any number of units may wear it, never twice on one unit, and it is never used up. Cards move freely between followers. Exile, falling for good and a re-roll empty the slots, and nothing is lost.
- A permanent unlock is a flat ◆1,000 shards, paid from the run's shards, for a card found first (a card a pack deals) or outright (the Crystalline six). The collection survives NEW GAME.
- At the start of a run you pick up to 3 cards from the collection, and the hand can be changed from the CARDS screen during the run.
- The CARDS screen is a dock button, always shown, on tablet and desktop; phones come later.
- Rarity names: Unrefined, Refined, Precision, Prototype, Lustrous, Crystalline. A rarity chip of illuminated bars (1 to 6) shows it.
- Pack 1: ◆100, exactly 4 cards, Unrefined, Refined and Precision at 60 / 30 / 10, one slot reserved for a Precision, no card twice in a pack; the 18 Element cards and their numbers. What it deals is found for the run.
- The six Crystalline class cards, each +50% to one stat.
- Quill Burst's numbers (range 4, +25% on a hit, every 4 seconds, no burn). (**Superseded** by your follower combat brief, 2026-11-02: QUILL BURST becomes five quills fired at once, each stopping at its first enemy, with no splash; its numbers are open again, `FOLLOWER-COMBAT-REDESIGN.md`. The code still runs the old rules until that is built.)
- The market: everything in sections 1b and 1c.
